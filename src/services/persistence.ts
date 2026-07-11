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
import type {
  CcpOutboundDraft,
  CcpSendResult,
  InboundWebhookRecord
} from "../types/communication.js";

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAuthenticatedSession(value: unknown): value is AuthenticatedSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AuthenticatedSession>;
  return (
    typeof candidate.sessionId === "string" &&
    typeof candidate.activeRole === "string" &&
    typeof candidate.expiresAtIso === "string" &&
    typeof candidate.user === "object" &&
    Boolean(candidate.user) &&
    isStringArray(candidate.permissions) &&
    isStringArray(candidate.responsibilities)
  );
}

function draftFromRow(row: Awaited<ReturnType<typeof prisma.ccpDraft.findUnique>>): CcpOutboundDraft | undefined {
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    istStaffId: row.istStaffId,
    threadId: row.threadId,
    linkedGoalId: row.linkedGoalId ?? undefined,
    channel: row.channel as CcpOutboundDraft["channel"],
    to: row.recipientTo,
    originalTo: row.originalTo,
    subject: row.subject,
    body: row.body,
    status: row.status as CcpOutboundDraft["status"],
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
    draftedByRole: row.draftedByRole,
    approval: row.approval as CcpOutboundDraft["approval"],
    sendResult: row.sendResult ? (row.sendResult as CcpSendResult) : undefined
  };
}

function inboundRecordFromRow(
  row: Awaited<ReturnType<typeof prisma.ccpWebhookRecord.findUnique>>
): InboundWebhookRecord | undefined {
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    status: "persisted",
    persistedAtIso: row.persistedAt.toISOString(),
    inbound: {
      id: row.inboundId,
      provider: row.provider,
      providerMessageId: row.providerMessageId ?? undefined,
      channel: row.channel as InboundWebhookRecord["inbound"]["channel"],
      from: row.sender,
      to: row.recipient,
      body: row.body,
      receivedAtIso: row.persistedAt.toISOString(),
      attachments: row.attachments as InboundWebhookRecord["inbound"]["attachments"],
      raw: row.rawPayload as Record<string, string>
    },
    queueNote: row.queueNote
  };
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
      sessionPayload: jsonValue(args.session),
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

export async function getPersistedUserSession(sessionId?: string): Promise<AuthenticatedSession | undefined> {
  if (!sessionId || !shouldUseDatabasePersistence()) {
    return undefined;
  }

  const row = await prisma.userSession.findUnique({
    where: {
      sessionHash: sessionHash(sessionId)
    }
  });
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
    return undefined;
  }

  const sessionPayload = row.sessionPayload as unknown;
  if (!isAuthenticatedSession(sessionPayload) || sessionPayload.sessionId !== sessionId) {
    return undefined;
  }

  return sessionPayload;
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

export async function persistCcpOutboundDraft(draft: CcpOutboundDraft): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const saved = await prisma.ccpDraft.upsert({
    where: {
      id: draft.id
    },
    create: {
      id: draft.id,
      istStaffId: draft.istStaffId,
      threadId: draft.threadId,
      linkedGoalId: draft.linkedGoalId,
      channel: draft.channel,
      recipientTo: draft.to,
      originalTo: draft.originalTo,
      subject: draft.subject,
      body: draft.body,
      status: draft.status,
      draftedByRole: draft.draftedByRole,
      approval: jsonValue(draft.approval),
      sendResult: draft.sendResult ? jsonValue(draft.sendResult) : undefined,
      createdAt: new Date(draft.createdAtIso)
    },
    update: {
      linkedGoalId: draft.linkedGoalId,
      recipientTo: draft.to,
      originalTo: draft.originalTo,
      subject: draft.subject,
      body: draft.body,
      status: draft.status,
      draftedByRole: draft.draftedByRole,
      approval: jsonValue(draft.approval),
      sendResult: draft.sendResult ? jsonValue(draft.sendResult) : undefined
    }
  });

  return { persisted: true, recordId: saved.id };
}

export async function getPersistedCcpOutboundDraft(draftId: string): Promise<CcpOutboundDraft | undefined> {
  if (!shouldUseDatabasePersistence()) {
    return undefined;
  }

  const row = await prisma.ccpDraft.findUnique({
    where: {
      id: draftId
    }
  });
  return draftFromRow(row);
}

export async function listPersistedCcpOutboundDrafts(): Promise<CcpOutboundDraft[]> {
  if (!shouldUseDatabasePersistence()) {
    return [];
  }

  const rows = await prisma.ccpDraft.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 100
  });
  return rows
    .map((row) => draftFromRow(row))
    .filter((draft): draft is CcpOutboundDraft => Boolean(draft));
}

export async function persistInboundWebhookRecord(record: InboundWebhookRecord): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const saved = await prisma.ccpWebhookRecord.upsert({
    where: {
      id: record.id
    },
    create: {
      id: record.id,
      inboundId: record.inbound.id,
      provider: record.inbound.provider,
      providerMessageId: record.inbound.providerMessageId,
      channel: record.inbound.channel,
      sender: record.inbound.from,
      recipient: record.inbound.to,
      body: record.inbound.body,
      status: record.status,
      attachments: jsonValue(record.inbound.attachments),
      rawPayload: jsonValue(record.inbound.raw),
      queueNote: record.queueNote,
      persistedAt: new Date(record.persistedAtIso)
    },
    update: {
      providerMessageId: record.inbound.providerMessageId,
      body: record.inbound.body,
      status: record.status,
      attachments: jsonValue(record.inbound.attachments),
      rawPayload: jsonValue(record.inbound.raw),
      queueNote: record.queueNote
    }
  });

  return { persisted: true, recordId: saved.id };
}

export async function listPersistedInboundWebhookRecords(): Promise<InboundWebhookRecord[]> {
  if (!shouldUseDatabasePersistence()) {
    return [];
  }

  const rows = await prisma.ccpWebhookRecord.findMany({
    orderBy: {
      persistedAt: "desc"
    },
    take: 100
  });
  return rows
    .map((row) => inboundRecordFromRow(row))
    .filter((record): record is InboundWebhookRecord => Boolean(record));
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
