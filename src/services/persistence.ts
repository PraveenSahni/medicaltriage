import { createHash } from "node:crypto";
import type {
  AcuityDispositionCode,
  OverrideStatusFlag,
  Prisma,
  TriageSeverity
} from "@prisma/client";
import { shouldUseDatabasePersistence } from "../config/runtime.js";
import { prisma } from "../db.js";
import type { SafetyAuditDraft } from "../services/auditLog.js";
import type {
  AviationEvaluation,
  ClipboardPayload,
  DispositionDecision,
  Severity,
  TriageCompleteRequest,
  TriageEvaluationRequest
} from "../types/triage.js";
import { DispositionCodeSchema } from "../types/triage.js";
import type { AuditEvent, AuthenticatedSession } from "../types/security.js";

export type PersistenceResult =
  | { persisted: true; recordId: string }
  | { persisted: false; reason: "mock-mode" | "missing-staff-id" | "invalid-disposition-code" };

function sessionHash(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

function severityToPrisma(severity: Severity): TriageSeverity {
  const map: Record<Severity, TriageSeverity> = {
    Emergency: "EMERGENCY",
    Urgent: "URGENT",
    Routine: "ROUTINE",
    "Self-care": "SELF_CARE"
  };
  return map[severity];
}

function initialScoreForSeverity(severity: Severity): number {
  const map: Record<Severity, number> = {
    Emergency: 10,
    Urgent: 6,
    Routine: 2,
    "Self-care": 0
  };
  return map[severity];
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function persistSecurityAuditEvent(event: AuditEvent): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const created = await prisma.auditEvent.create({
    data: {
      timestamp: new Date(event.timestampIso),
      userId: event.userId,
      activeRole: event.activeRole,
      organization: event.organization,
      facility: event.facility,
      department: event.department,
      action: event.action,
      module: event.module,
      resource: event.resource,
      purpose: event.purpose,
      ipAddress: event.ipAddress,
      device: event.device,
      success: event.success,
      riskLevel: event.risk
    }
  });

  return { persisted: true, recordId: created.id };
}

export async function persistUserSession(args: {
  session: AuthenticatedSession;
  ipAddress: string;
  device: string;
}): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const created = await prisma.userSession.create({
    data: {
      userId: args.session.user.id,
      sessionHash: sessionHash(args.session.sessionId),
      authMethod: args.session.authMethod,
      mfaVerified: args.session.mfaVerified,
      ipAddress: args.ipAddress,
      device: args.device,
      userAgent: args.device,
      expiresAt: new Date(args.session.expiresAtIso)
    }
  });

  return { persisted: true, recordId: created.id };
}

export async function revokePersistedSession(sessionId?: string): Promise<void> {
  if (!sessionId || !shouldUseDatabasePersistence()) {
    return;
  }

  await prisma.userSession.updateMany({
    where: {
      sessionHash: sessionHash(sessionId),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function persistEvaluatedEncounter(args: {
  request: TriageEvaluationRequest;
  decision: DispositionDecision;
  aviation: AviationEvaluation;
  clipboardPayload: ClipboardPayload;
  safetyAudit: SafetyAuditDraft;
}): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const created = await prisma.aviationTriageEncounter.create({
    data: {
      staffMember: {
        connect: {
          istStaffId: args.request.istStaffId
        }
      },
      initialAcuityScore: initialScoreForSeverity(args.decision.severity),
      finalDispositionCode: args.decision.dispositionCode as AcuityDispositionCode,
      transcriptText: args.request.symptoms.narrative,
      transcriptLanguage: args.request.symptoms.language,
      customAviationTags: jsonValue(args.aviation.tags),
      clipboardPayload: jsonValue(args.clipboardPayload.structured),
      nurseId: args.request.nurseId,
      completedAt: new Date()
    }
  });

  if (args.safetyAudit.required) {
    await prisma.safetyAuditDeviationLog.create({
      data: {
        encounterId: created.id,
        originalAiRecommendation: args.safetyAudit.originalAiRecommendation ?? "NONE",
        nurseOverrideRationale: args.safetyAudit.nurseOverrideRationale,
        rulesEngineSeverity: severityToPrisma(args.decision.severity),
        overrideStatusFlag: args.safetyAudit.overrideStatusFlag as OverrideStatusFlag,
        explainabilityTrace: jsonValue(args.safetyAudit.explainabilityTrace)
      }
    });
  }

  return { persisted: true, recordId: created.id };
}

export async function persistCompletedTriageNote(
  request: TriageCompleteRequest,
  notePayload: string,
  fitToFlyStatus: string
): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }
  if (!request.istStaffId) {
    return { persisted: false, reason: "missing-staff-id" };
  }

  const parsedDisposition = DispositionCodeSchema.safeParse(request.finalDispositionCode);
  if (!parsedDisposition.success) {
    return { persisted: false, reason: "invalid-disposition-code" };
  }

  const created = await prisma.aviationTriageEncounter.create({
    data: {
      staffMember: {
        connect: {
          istStaffId: request.istStaffId
        }
      },
      initialAcuityScore: request.finalDispositionCode === "HMC_EMERGENCY_DEPARTMENT" ? 10 : 2,
      finalDispositionCode: parsedDisposition.data as AcuityDispositionCode,
      transcriptText: request.subjective,
      transcriptLanguage: "en",
      customAviationTags: jsonValue([...request.customAviationTags, `fit-to-fly-${fitToFlyStatus.toLowerCase()}`]),
      clipboardPayload: jsonValue({
        notePayload,
        routingDestination: request.routingDestination,
        safetyRationale: request.safetyRationale
      }),
      nurseId: request.nurseId ?? "unknown",
      completedAt: new Date()
    }
  });

  return { persisted: true, recordId: created.id };
}
