import { randomUUID } from "node:crypto";
import { Router } from "express";
import { withMockFlag } from "../config/runtime.js";
import { buildSafetyAuditDraft } from "../services/auditLog.js";
import { evaluateAviationRules } from "../services/aviationRules.js";
import { resolveDisposition } from "../services/dispositionRouter.js";
import { findDependent, validateStaffMember } from "../services/hrms.js";
import { verifyInsuranceEligibility } from "../services/insurance.js";
import { calculateTriageScore } from "../services/news2Scoring.js";
import { persistCompletedTriageNote, persistEvaluatedEncounter } from "../services/persistence.js";
import { compileSbarClipboardPayload } from "../services/sbarCompiler.js";
import { compileBilingualSoapSbarMarkdown } from "../services/triageNoteCompiler.js";
import {
  TriageCalculateScoreRequestSchema,
  TriageCompleteRequestSchema,
  TriageEvaluationRequestSchema,
  TriageStartRequestSchema
} from "../types/triage.js";

function deriveCompletionFitToFlyStatus(args: {
  jobTitle?: string;
  finalDispositionCode: string;
  customAviationTags: string[];
}): "CLEARED" | "RESTRICTED" | "MEDICAL_REVIEW_REQUIRED" {
  const jobTitle = args.jobTitle?.toLowerCase() ?? "";
  const safetySensitiveCrew = jobTitle.includes("pilot") || jobTitle.includes("cabin crew");
  const selfCare = args.finalDispositionCode === "SELF_CARE_WITH_CALLBACK_PRECAUTIONS";
  const taggedForReview = args.customAviationTags.some((tag) =>
    ["fit-to-fly-review", "duty-restriction", "sickness-validation"].includes(tag)
  );

  if (safetySensitiveCrew && (!selfCare || taggedForReview)) {
    return "RESTRICTED";
  }

  if (taggedForReview) {
    return "MEDICAL_REVIEW_REQUIRED";
  }

  return "CLEARED";
}

export function createTriageRouter(): Router {
  const router = Router();

  router.post("/start", async (req, res) => {
    const parsed = TriageStartRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid triage start payload", details: parsed.error.flatten() });
    }

    const staff = await validateStaffMember(parsed.data.istStaffId);
    if (!staff.valid || !staff.profile) {
      return res.status(404).json(staff);
    }

    const dependent = findDependent(staff.profile, parsed.data.dependentId);
    if (parsed.data.dependentId && !dependent) {
      return res.status(400).json({ error: "Dependent is not mapped to the validated staff member." });
    }

    const insurance = await verifyInsuranceEligibility(staff.profile);

    return res.json({
      encounterId: randomUUID(),
      staff: staff.profile,
      selectedDependent: dependent,
      insurance,
      phiPersistenceMode: "ephemeral-api-session-only"
    });
  });

  router.post("/calculate-score", (req, res) => {
    const parsed = TriageCalculateScoreRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid triage vital-sign payload", details: parsed.error.flatten() });
    }

    const result = calculateTriageScore(parsed.data);
    return res.json({
      ...result,
      clinicalSafetyNotice:
        "Rules-first result. AI is not permitted to downgrade RED_ALERT, emergency, or high-risk routing."
    });
  });

  router.post("/complete", async (req, res) => {
    const parsed = TriageCompleteRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid triage completion payload", details: parsed.error.flatten() });
    }

    const staff = parsed.data.istStaffId ? await validateStaffMember(parsed.data.istStaffId) : undefined;
    const fitToFlyStatus = deriveCompletionFitToFlyStatus({
      jobTitle: staff?.profile?.jobTitle,
      finalDispositionCode: parsed.data.finalDispositionCode,
      customAviationTags: parsed.data.customAviationTags
    });
    const note = compileBilingualSoapSbarMarkdown(parsed.data);
    const persistence = await persistCompletedTriageNote(parsed.data, note, fitToFlyStatus);
    if (req.accepts(["json", "text"]) === "json") {
      return res.json(withMockFlag({
        notePayload: note,
        fitToFlyStatus,
        staff: staff?.profile,
        clipboardOptimized: true,
        persistence
      }));
    }

    return res.type("text/plain").send(note);
  });

  router.post("/encounters/evaluate", async (req, res) => {
    const parsed = TriageEvaluationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid triage evaluation payload", details: parsed.error.flatten() });
    }

    const request = parsed.data;
    const staff = await validateStaffMember(request.istStaffId);
    if (!staff.valid || !staff.profile) {
      return res.status(404).json(staff);
    }

    const dependent = findDependent(staff.profile, request.dependentId);
    if (request.dependentId && !dependent) {
      return res.status(400).json({ error: "Dependent is not mapped to the validated staff member." });
    }

    const insurance = await verifyInsuranceEligibility(staff.profile);
    const aviation = evaluateAviationRules(request, staff.profile);
    const decision = resolveDisposition(request, staff.profile, aviation);
    const clipboardPayload = compileSbarClipboardPayload({
      request,
      profile: staff.profile,
      dependent,
      insurance,
      decision,
      aviation
    });
    const safetyAudit = buildSafetyAuditDraft(request, decision);
    const persistence = await persistEvaluatedEncounter({
      request,
      decision,
      aviation,
      clipboardPayload,
      safetyAudit
    });

    return res.json(withMockFlag({
      encounterId: randomUUID(),
      decision,
      insurance,
      aviation,
      clipboardPayload,
      safetyAudit,
      persistence,
      humanInLoopRequired: true,
      warnings: [
        "Mock rules are for MVP wiring only and must be replaced with licensed clinical content and local governance approvals.",
        "When MOCK_MODE=false, the API requires PostgreSQL/Cloud SQL and writes completed triage/audit records through Prisma."
      ]
    }));
  });

  return router;
}
