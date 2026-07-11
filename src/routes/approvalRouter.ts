import { createHmac } from "node:crypto";
import { Router } from "express";
import type { OverrideStatusFlag, Prisma, TriageSeverity } from "@prisma/client";
import { z } from "zod";
import { shouldUseDatabasePersistence } from "../config/runtime.js";
import { prisma } from "../db.js";
import { requirePermission, type AuthorizedRequest } from "../services/authorization.js";

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
  if (request.nurseOverrideReasonCode === "AI_DOWNGRADE_BLOCKED") {
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
      clinicianOverrides: 3
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
  const traceEvent = {
    eventType: "HITL_CLINICAL_APPROVAL",
    encounterId,
    decision: request.decision,
    reviewedReasoningFeatureIds: request.reviewedReasoningFeatureIds,
    originalAiRecommendation: request.originalAiRecommendation ?? "NONE",
    rulesEngineSeverity: request.rulesEngineSeverity,
    finalApprovedSeverity: request.finalApprovedSeverity,
    finalDispositionCode: request.finalDispositionCode,
    nurseOverrideReasonCode: request.nurseOverrideReasonCode ?? "RULES_ENGINE_FINAL_APPROVED",
    nurseOverrideRationale: request.nurseOverrideRationale ?? "Rules-engine final disposition reviewed and approved.",
    modifiedCarePlan: Boolean(request.modifiedCarePlan),
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
        explainabilityTrace: jsonValue(nextTrace)
      }
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
        explainabilityTrace: jsonValue(nextTrace)
      }
    });
  }

  return {
    persisted: true,
    auditSignature,
    traceEvent: signedTraceEvent
  };
}

export function createApprovalRouter(): Router {
  const router = Router();

  router.get("/queue", requirePermission("triage.workspace.view"), (_req, res) => {
    return res.json({
      queue: mockApprovalQueue(),
      checkpoint:
        "AI summaries, care plans, employee messages, and EMR writeback remain blocked until authenticated clinician review."
    });
  });

  router.get("/dashboard", requirePermission("audit.events.view"), (_req, res) => {
    return res.json(mockSafetyDashboard());
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
