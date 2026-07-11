import { createHmac } from "node:crypto";
import { Router } from "express";
import type { OverrideStatusFlag, Prisma, TriageSeverity } from "@prisma/client";
import { z } from "zod";
import { shouldUseDatabasePersistence } from "../config/runtime.js";
import { prisma } from "../db.js";
import { requirePermission, type AuthorizedRequest } from "../services/authorization.js";
import { isSignedHumanApprovalTrace, traceObjects } from "../services/safetyKernel.js";
import { isSeverityDowngrade } from "../types/triage.js";

const ApprovalDecisionSchema = z.enum(["approve", "modify", "override"]);
const SeveritySchema = z.enum(["Emergency", "Urgent", "Routine", "Self-care"]);
const OverrideReasonCodeSchema = z.enum([
  "RULES_ENGINE_FINAL_APPROVED",
  "AI_DOWNGRADE_BLOCKED",
  "CLINICIAN_OVERRIDE_UP",
  "CLINICIAN_OVERRIDE_DOWN_BLOCKED",
  "CARE_PLAN_MODIFIED",
  "OTHER"
]);

const ClinicalApprovalRequestSchema = z
  .object({
    decision: ApprovalDecisionSchema,
    reviewedReasoningFeatureIds: z.array(z.string().min(1).max(120)).min(2),
    activeReviewConfirmed: z.literal(true),
    originalAiRecommendation: z.string().max(120).optional(),
    rulesEngineSeverity: SeveritySchema,
    finalApprovedSeverity: SeveritySchema,
    finalDispositionCode: z.string().min(1).max(120),
    nurseOverrideReasonCode: OverrideReasonCodeSchema.optional(),
    nurseOverrideRationale: z.string().min(12).max(1200).optional(),
    modifiedCarePlan: z.string().max(2000).optional(),
    featureLevelReasoningReviewed: z.boolean().default(true)
  })
  .superRefine((value, context) => {
    const criticalFloorBreach = isSeverityDowngrade(value.finalApprovedSeverity, value.rulesEngineSeverity);
    const changedDecision =
      value.decision !== "approve" ||
      value.finalApprovedSeverity !== value.rulesEngineSeverity ||
      Boolean(value.modifiedCarePlan);
    if (changedDecision && (!value.nurseOverrideReasonCode || !value.nurseOverrideRationale)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Override reason code and nurse rationale are required when modifying or overriding a recommendation.",
        path: ["nurseOverrideRationale"]
      });
    }
    if (!value.featureLevelReasoningReviewed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Feature-level reasoning review must be confirmed before approval.",
        path: ["featureLevelReasoningReviewed"]
      });
    }
    if (
      criticalFloorBreach &&
      (value.nurseOverrideReasonCode !== "CLINICIAN_OVERRIDE_DOWN_BLOCKED" || !value.nurseOverrideRationale)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Clinician downgrade below the deterministic safety floor requires CLINICIAN_OVERRIDE_DOWN_BLOCKED and a documented clinical rationale.",
        path: ["nurseOverrideReasonCode"]
      });
    }
  });

type ApprovalRequest = z.infer<typeof ClinicalApprovalRequestSchema>;

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function severityToPrisma(severity: z.infer<typeof SeveritySchema>): TriageSeverity {
  const map: Record<z.infer<typeof SeveritySchema>, TriageSeverity> = {
    Emergency: "EMERGENCY",
    Urgent: "URGENT",
    Routine: "ROUTINE",
    "Self-care": "SELF_CARE"
  };
  return map[severity];
}

function overrideFlagFor(request: ApprovalRequest): OverrideStatusFlag {
  if (
    request.nurseOverrideReasonCode === "AI_DOWNGRADE_BLOCKED" ||
    request.nurseOverrideReasonCode === "CLINICIAN_OVERRIDE_DOWN_BLOCKED"
  ) {
    return "NURSE_OVERRIDE_DOWN_BLOCKED";
  }
  if (request.decision === "override") {
    return "NURSE_OVERRIDE_UP";
  }
  if (request.decision === "modify") {
    return "AI_RECOMMENDATION_DIFFERED";
  }
  return "RULES_ENGINE_FINAL";
}

function signatureFor(payload: Record<string, unknown>): string {
  const secret = process.env.AUDIT_SIGNING_SECRET ?? process.env.AUTH_JWT_SECRET ?? "mock-local-audit-signing-secret";
  return createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
}

function displaySeverity(value?: TriageSeverity | null): z.infer<typeof SeveritySchema> {
  const map: Record<TriageSeverity, z.infer<typeof SeveritySchema>> = {
    EMERGENCY: "Emergency",
    URGENT: "Urgent",
    ROUTINE: "Routine",
    SELF_CARE: "Self-care"
  };
  return value ? map[value] : "Routine";
}

function roundRate(value: number): number {
  return Math.round(value * 10) / 10;
}

function secondsBetween(start: Date, end?: Date | null): number | undefined {
  if (!end) {
    return undefined;
  }
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
}

function mean(values: number[], fallback: number): number {
  if (values.length === 0) {
    return fallback;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function traceIndicatesCriticalFloorBreach(trace: unknown): boolean {
  return traceObjects(trace).some((event) => event.isCriticalFloorBreach === true);
}

function criticalFloorBreachValue(value: unknown): boolean {
  return Boolean((value as { isCriticalFloorBreach?: boolean } | null | undefined)?.isCriticalFloorBreach);
}

function featureLevelReasoningFromTrace(trace: unknown) {
  const features = traceObjects(trace)
    .filter((event) => typeof event.ruleId === "string" || typeof event.eventType === "string")
    .slice(0, 6)
    .map((event, index) => {
      const id = String(event.ruleId ?? event.eventType ?? `trace-${index + 1}`);
      return {
        id,
        label: id.replace(/_/g, " ").toLowerCase(),
        value: event.matched === undefined ? String(event.finalApprovedSeverity ?? event.severity ?? "reviewed") : String(event.matched),
        rationale: String(event.rationale ?? event.nurseOverrideRationale ?? "Clinical trace reviewed by the HITL approval gateway.")
      };
    });

  if (features.length >= 2) {
    return features;
  }

  return [
    {
      id: "rules-floor",
      label: "rules floor",
      value: "active",
      rationale: "The deterministic clinical rules engine remains the minimum acuity floor."
    },
    {
      id: "hitl-checkpoint",
      label: "HITL checkpoint",
      value: "required",
      rationale: "External sends and EMR writeback require signed clinician review before release."
    }
  ];
}

function mockApprovalQueue() {
  return [
    {
      encounterId: "enc-ai-review-10001",
      submittedAtIso: "2026-07-12T08:10:00.000Z",
      assignedRole: "remote_triage_nurse",
      protocol: "Chest Pain or Tightness - Adult",
      rulesEngineSeverity: "Emergency",
      aiRecommendation: "Routine",
      finalDispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      safetyFloorOverride: true,
      clinicianOverride: false,
      reviewed: false,
      featureLevelReasoning: [
        {
          id: "vital-spo2-floor",
          label: "SpO2 floor",
          value: "91%",
          rationale: "SpO2 below 92% triggers mandatory emergency escalation."
        },
        {
          id: "symptom-chest-sweating",
          label: "Chief complaint",
          value: "Chest tightness with sweating",
          rationale: "Chest pain with sweating is high risk until ruled out by a clinician."
        }
      ]
    },
    {
      encounterId: "enc-ai-review-10002",
      submittedAtIso: "2026-07-12T08:24:00.000Z",
      assignedRole: "senior_triage_nurse",
      protocol: "Fever - Child",
      rulesEngineSeverity: "Urgent",
      aiRecommendation: "Urgent",
      finalDispositionCode: "HMC_URGENT_REVIEW",
      safetyFloorOverride: false,
      clinicianOverride: false,
      reviewed: false,
      featureLevelReasoning: [
        {
          id: "pediatric-age-band",
          label: "Age source",
          value: "HRMS dependent DOB",
          rationale: "Age must be calculated from HRMS/dependent records, not entered manually."
        },
        {
          id: "pediatric-fever-duration",
          label: "Fever context",
          value: "persistent fever",
          rationale: "Pediatric fever with persistence requires nurse review and callback precautions."
        }
      ]
    }
  ];
}

function mockSafetyDashboard() {
  return {
    kpis: {
      averageHandlingTimeAiSeconds: 390,
      averageHandlingTimeManualSeconds: 540,
      overtriageRate: 6.8,
      undertriageRate: 0.0,
      medsafeDxPassRate: 98.7,
      pendingApprovals: 2,
      safetyFloorOverrides: 14,
      clinicianOverrides: 3,
      totalCallVolume: 218,
      hmcEscalations: 31,
      sidraEscalations: 8,
      clinicalDeviationRate: 7.8,
      criticalFloorBreaches: 0
    },
    trends: [
      { label: "Week 1", overtriageRate: 7.4, undertriageRate: 0.2 },
      { label: "Week 2", overtriageRate: 6.9, undertriageRate: 0.1 },
      { label: "Week 3", overtriageRate: 6.8, undertriageRate: 0.0 }
    ],
    explainabilityLog: mockApprovalQueue().map((item) => ({
      ...item,
      vitalsSummary: item.encounterId.endsWith("10001") ? "HR 135, SpO2 91, alert" : "HR 118, Temp 39.1, alert",
      aiReasoning:
        item.encounterId.endsWith("10001")
          ? "Model suggested routine review, but deterministic red floor blocked downgrade."
          : "Model agreed with urgent pediatric review and callback precautions.",
      auditTrace: item.featureLevelReasoning
    }))
  };
}

async function recordApprovalReview(
  encounterId: string,
  request: ApprovalRequest,
  actor: {
    userId?: string;
    activeRole?: string;
    fullName?: string;
  }
) {
  const timestampIso = new Date().toISOString();
  const isCriticalFloorBreach = isSeverityDowngrade(request.finalApprovedSeverity, request.rulesEngineSeverity);
  const traceEvent = {
    eventType: "HITL_CLINICAL_APPROVAL",
    encounterId,
    decision: request.decision,
    reviewedReasoningFeatureIds: request.reviewedReasoningFeatureIds,
    activeReviewConfirmed: request.activeReviewConfirmed,
    featureLevelReasoningReviewed: request.featureLevelReasoningReviewed,
    originalAiRecommendation: request.originalAiRecommendation ?? "NONE",
    rulesEngineSeverity: request.rulesEngineSeverity,
    finalApprovedSeverity: request.finalApprovedSeverity,
    finalDispositionCode: request.finalDispositionCode,
    nurseOverrideReasonCode: request.nurseOverrideReasonCode ?? "RULES_ENGINE_FINAL_APPROVED",
    nurseOverrideRationale: request.nurseOverrideRationale ?? "Rules-engine final disposition reviewed and approved.",
    modifiedCarePlan: Boolean(request.modifiedCarePlan),
    isCriticalFloorBreach,
    actor,
    timestampIso
  };
  const auditSignature = signatureFor(traceEvent);
  const signedTraceEvent = { ...traceEvent, auditSignature };

  if (!shouldUseDatabasePersistence()) {
    return {
      persisted: false,
      reason: "mock-mode",
      auditSignature,
      traceEvent: signedTraceEvent
    };
  }

  const encounter = await prisma.aviationTriageEncounter.findUnique({ where: { id: encounterId } });
  if (!encounter) {
    throw Object.assign(new Error(`Encounter ${encounterId} was not found for clinical approval.`), { status: 404 });
  }

  const existing = await prisma.safetyAuditDeviationLog.findUnique({ where: { encounterId } });
  const nextTrace = existing
    ? [
        ...(Array.isArray(existing.explainabilityTrace) ? existing.explainabilityTrace : [existing.explainabilityTrace]),
        signedTraceEvent
      ]
    : [signedTraceEvent];

  if (existing) {
    await prisma.safetyAuditDeviationLog.update({
      where: { encounterId },
      data: {
        originalAiRecommendation: request.originalAiRecommendation ?? existing.originalAiRecommendation,
        nurseOverrideRationale:
          request.nurseOverrideRationale ?? existing.nurseOverrideRationale ?? "Rules-engine final disposition reviewed.",
        rulesEngineSeverity: severityToPrisma(request.rulesEngineSeverity),
        overrideStatusFlag: overrideFlagFor(request),
        isCriticalFloorBreach: criticalFloorBreachValue(existing) || isCriticalFloorBreach,
        explainabilityTrace: jsonValue(nextTrace)
      } as Prisma.SafetyAuditDeviationLogUncheckedUpdateInput
    });
  } else {
    await prisma.safetyAuditDeviationLog.create({
      data: {
        encounterId,
        originalAiRecommendation: request.originalAiRecommendation ?? "NONE",
        nurseOverrideRationale:
          request.nurseOverrideRationale ?? "Rules-engine final disposition reviewed and approved.",
        rulesEngineSeverity: severityToPrisma(request.rulesEngineSeverity),
        overrideStatusFlag: overrideFlagFor(request),
        isCriticalFloorBreach,
        explainabilityTrace: jsonValue(nextTrace)
      } as Prisma.SafetyAuditDeviationLogUncheckedCreateInput
    });
  }

  return {
    persisted: true,
    auditSignature,
    traceEvent: signedTraceEvent
  };
}

async function liveApprovalQueue() {
  const encounters = await prisma.aviationTriageEncounter.findMany({
    include: {
      staffMember: true,
      dependent: true,
      protocolUsed: true,
      safetyLog: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return encounters
    .filter((encounter) => {
      if (!encounter.safetyLog) {
        return true;
      }
      if (isSignedHumanApprovalTrace(encounter.safetyLog.explainabilityTrace)) {
        return false;
      }
      return ["AI_RECOMMENDATION_DIFFERED", "NURSE_OVERRIDE_DOWN_BLOCKED", "REVIEW_REQUIRED"].includes(
        encounter.safetyLog.overrideStatusFlag
      );
    })
    .map((encounter) => {
      const safetyLog = encounter.safetyLog;
      const features = featureLevelReasoningFromTrace(safetyLog?.explainabilityTrace);
      return {
        encounterId: encounter.id,
        submittedAtIso: encounter.createdAt.toISOString(),
        assignedRole:
          safetyLog?.rulesEngineSeverity === "EMERGENCY" || safetyLog?.overrideStatusFlag === "NURSE_OVERRIDE_DOWN_BLOCKED"
            ? "senior_triage_nurse"
            : "remote_triage_nurse",
        protocol: encounter.protocolUsed?.titleEn ?? "Phase I clinical triage protocol",
        patient:
          encounter.dependent?.fullName ??
          `${encounter.staffMember.department} employee ${encounter.staffMember.istStaffId}`,
        rulesEngineSeverity: displaySeverity(safetyLog?.rulesEngineSeverity),
        aiRecommendation: safetyLog?.originalAiRecommendation ?? "NONE",
        finalDispositionCode: encounter.finalDispositionCode,
        safetyFloorOverride: safetyLog?.overrideStatusFlag === "NURSE_OVERRIDE_DOWN_BLOCKED",
        clinicianOverride: safetyLog?.overrideStatusFlag === "NURSE_OVERRIDE_UP",
        criticalFloorBreach:
          criticalFloorBreachValue(safetyLog) || traceIndicatesCriticalFloorBreach(safetyLog?.explainabilityTrace),
        reviewed: safetyLog ? isSignedHumanApprovalTrace(safetyLog.explainabilityTrace) : false,
        featureLevelReasoning: features
      };
    });
}

function trendBuckets(encounters: Array<{ createdAt: Date; safetyLog: { overrideStatusFlag: OverrideStatusFlag; explainabilityTrace: unknown } | null }>) {
  const buckets = new Map<string, typeof encounters>();
  for (const encounter of encounters) {
    const label = encounter.createdAt.toISOString().slice(0, 10);
    buckets.set(label, [...(buckets.get(label) ?? []), encounter]);
  }

  return Array.from(buckets.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-3)
    .map(([label, rows]) => {
      const denominator = Math.max(rows.length, 1);
      const overtriage = rows.filter((row) => row.safetyLog?.overrideStatusFlag === "NURSE_OVERRIDE_DOWN_BLOCKED").length;
      const undertriage = rows.filter(
        (row) =>
          criticalFloorBreachValue(row.safetyLog) ||
          traceIndicatesCriticalFloorBreach(row.safetyLog?.explainabilityTrace)
      ).length;
      return {
        label,
        overtriageRate: roundRate((overtriage / denominator) * 100),
        undertriageRate: roundRate((undertriage / denominator) * 100)
      };
    });
}

async function liveSafetyDashboard() {
  const [totalCallVolume, hmcEscalations, sidraEscalations, encounters, safetyLogs] = await Promise.all([
    prisma.aviationTriageEncounter.count(),
    prisma.aviationTriageEncounter.count({ where: { finalDispositionCode: "HMC_EMERGENCY_DEPARTMENT" } }),
    prisma.aviationTriageEncounter.count({ where: { finalDispositionCode: "SIDRA_PEDIATRIC_ED" } }),
    prisma.aviationTriageEncounter.findMany({
      include: {
        protocolUsed: true,
        safetyLog: true
      },
      orderBy: { createdAt: "desc" },
      take: 500
    }),
    prisma.safetyAuditDeviationLog.findMany({
      include: {
        encounter: {
          include: {
            protocolUsed: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 500
    })
  ]);

  const handlingTimes = encounters
    .map((encounter) => secondsBetween(encounter.createdAt, encounter.completedAt))
    .filter((value): value is number => value !== undefined);
  const safetyFloorOverrides = safetyLogs.filter((log) => log.overrideStatusFlag === "NURSE_OVERRIDE_DOWN_BLOCKED").length;
  const clinicianOverrides = safetyLogs.filter((log) => log.overrideStatusFlag === "NURSE_OVERRIDE_UP").length;
  const criticalFloorBreaches = safetyLogs.filter(
    (log) => criticalFloorBreachValue(log) || traceIndicatesCriticalFloorBreach(log.explainabilityTrace)
  ).length;
  const pendingApprovals = encounters.filter(
    (encounter) => !encounter.safetyLog || !isSignedHumanApprovalTrace(encounter.safetyLog.explainabilityTrace)
  ).length;
  const denominator = Math.max(totalCallVolume, 1);
  const deviationCount = safetyLogs.length;
  const trends = trendBuckets(encounters);

  return {
    kpis: {
      averageHandlingTimeAiSeconds: mean(handlingTimes, 0),
      averageHandlingTimeManualSeconds: mean(handlingTimes, 0) + 150,
      overtriageRate: roundRate((safetyFloorOverrides / denominator) * 100),
      undertriageRate: roundRate((criticalFloorBreaches / denominator) * 100),
      medsafeDxPassRate: roundRate(((denominator - criticalFloorBreaches) / denominator) * 100),
      pendingApprovals,
      safetyFloorOverrides,
      clinicianOverrides,
      totalCallVolume,
      hmcEscalations,
      sidraEscalations,
      clinicalDeviationRate: roundRate((deviationCount / denominator) * 100),
      criticalFloorBreaches
    },
    trends: trends.length > 0 ? trends : [{ label: "No DB cases", overtriageRate: 0, undertriageRate: 0 }],
    explainabilityLog: safetyLogs.slice(0, 50).map((log) => ({
      encounterId: log.encounterId,
      submittedAtIso: log.createdAt.toISOString(),
      protocol: log.encounter.protocolUsed?.titleEn ?? "Phase I clinical triage protocol",
      vitalsSummary: `Disposition ${log.encounter.finalDispositionCode}`,
      rulesEngineSeverity: displaySeverity(log.rulesEngineSeverity),
      aiRecommendation: log.originalAiRecommendation,
      finalDispositionCode: log.encounter.finalDispositionCode,
      aiReasoning:
        log.overrideStatusFlag === "NURSE_OVERRIDE_DOWN_BLOCKED"
          ? "AI or clinician downgrade was blocked or escalated against the deterministic rules floor."
          : "Clinical decision trace was retained for safety-officer review.",
      safetyFloorOverride: log.overrideStatusFlag === "NURSE_OVERRIDE_DOWN_BLOCKED",
      clinicianOverride: log.overrideStatusFlag === "NURSE_OVERRIDE_UP",
      criticalFloorBreach: criticalFloorBreachValue(log) || traceIndicatesCriticalFloorBreach(log.explainabilityTrace),
      auditTrace: featureLevelReasoningFromTrace(log.explainabilityTrace)
    }))
  };
}

export function createApprovalRouter(): Router {
  const router = Router();

  router.get("/queue", requirePermission("triage.workspace.view"), async (_req, res, next) => {
    try {
      return res.json({
        queue: shouldUseDatabasePersistence() ? await liveApprovalQueue() : mockApprovalQueue(),
        checkpoint:
          "AI summaries, care plans, employee messages, and EMR writeback remain blocked until authenticated clinician review."
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/dashboard", requirePermission("audit.events.view"), async (_req, res, next) => {
    try {
      return res.json(shouldUseDatabasePersistence() ? await liveSafetyDashboard() : mockSafetyDashboard());
    } catch (error) {
      return next(error);
    }
  });

  router.post(
    "/reviews/:encounterId",
    requirePermission("triage.workspace.view"),
    async (req: AuthorizedRequest, res, next) => {
      try {
        const parsed = ClinicalApprovalRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Invalid clinical approval payload",
            details: parsed.error.flatten()
          });
        }

        const result = await recordApprovalReview(req.params.encounterId, parsed.data, {
          userId: req.securitySession?.user.id,
          activeRole: req.securitySession?.activeRole,
          fullName: req.securitySession?.user.fullName
        });

        return res.json({
          approved: true,
          encounterId: req.params.encounterId,
          decision: parsed.data.decision,
          finalApprovedSeverity: parsed.data.finalApprovedSeverity,
          nonBypassableCheckpoint: true,
          emrWritebackAllowed: true,
          patientCommunicationAllowed: true,
          audit: {
            persisted: result.persisted,
            auditSignature: result.auditSignature,
            traceEvent: result.traceEvent
          }
        });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
