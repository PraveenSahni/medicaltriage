import { randomUUID } from "node:crypto";
import { Router } from "express";
import { withMockFlag } from "../config/runtime.js";
import { buildSafetyAuditDraft } from "../services/auditLog.js";
import { evaluateAviationRules } from "../services/aviationRules.js";
import { resolveDisposition } from "../services/dispositionRouter.js";
import { findDependent, resolvePatientAgeFromHrms, validateStaffMember } from "../services/hrms.js";
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
  const dispositionRequiresRestriction = new Set([
    "HMC_EMERGENCY_DEPARTMENT",
    "SIDRA_PEDIATRIC_ED",
    "HMC_URGENT_REVIEW",
    "OUTSTATION_TELECONSULT_ESCALATION"
  ]).has(args.finalDispositionCode);
  const selfCare = args.finalDispositionCode === "SELF_CARE_WITH_CALLBACK_PRECAUTIONS";
  const taggedForReview = args.customAviationTags.some((tag) =>
    ["fit-to-fly-review", "duty-restriction", "sickness-validation"].includes(tag)
  );

  if (dispositionRequiresRestriction) {
    return "RESTRICTED";
  }

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

  router.post("/calculate-score", async (req, res) => {
    const parsed = TriageCalculateScoreRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid triage vital-sign payload", details: parsed.error.flatten() });
    }

    if (!parsed.data.istStaffId) {
      return res.status(400).json({
        error: "ist_staff_id is required",
        message: "Age is calculated from HRMS/dependent records for this internal employee system."
      });
    }

    const ageResolution = await resolvePatientAgeFromHrms({
      istStaffId: parsed.data.istStaffId,
      dependentId: parsed.data.dependentId
    });
    if (!ageResolution.ok) {
      return res.status(ageResolution.status).json({
        error: "Unable to calculate HRMS patient age",
        message: ageResolution.reason
      });
    }

    const result = calculateTriageScore({
      ...parsed.data,
      ageYears: ageResolution.ageYears,
      ageMonths: ageResolution.ageMonths
    });
    return res.json({
      ...result,
      patientAge: {
        source: ageResolution.source,
        ageYears: ageResolution.ageYears,
        ageMonths: ageResolution.ageMonths,
        calculatedFrom: ageResolution.calculatedFrom
      },
      clinicalSafetyNotice:
        "Rules-first result. Patient age is calculated from HRMS/dependent records; caller-provided age is ignored for clinical routing."
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
    const ageResolution = parsed.data.istStaffId
      ? await resolvePatientAgeFromHrms({
          istStaffId: parsed.data.istStaffId,
          dependentId: undefined
        })
      : undefined;
    const completionData =
      ageResolution?.ok === true
        ? { ...parsed.data, patientAgeYears: ageResolution.ageYears }
        : parsed.data;
    const note = compileBilingualSoapSbarMarkdown(completionData);
    const persistence = await persistCompletedTriageNote(completionData, note, fitToFlyStatus);
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

    const ageResolution = await resolvePatientAgeFromHrms({
      istStaffId: parsed.data.istStaffId,
      dependentId: parsed.data.dependentId
    });
    if (!ageResolution.ok) {
      return res.status(ageResolution.status).json({
        error: "Unable to calculate HRMS patient age",
        message: ageResolution.reason
      });
    }

    const request = {
      ...parsed.data,
      symptoms: {
        ...parsed.data.symptoms,
        ageYears: ageResolution.ageYears
      }
    };
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
    let decision: ReturnType<typeof resolveDisposition>;
    try {
      decision = resolveDisposition(request, staff.profile, aviation);
    } catch (error) {
      const status = error instanceof Error && "status" in error ? Number(error.status) : 500;
      return res.status(status >= 400 && status < 500 ? status : 500).json({
        error: error instanceof Error ? error.message : "Unable to resolve clinical disposition."
      });
    }
    const finalAviation =
      decision.severity === "Emergency" || decision.severity === "Urgent"
        ? {
            ...aviation,
            fitToFlyStatus: "restricted" as const,
            tags: [...new Set([...aviation.tags, "rules-floor-duty-restriction"])],
            trace: [
              ...aviation.trace,
              {
                ruleId: "AVIATION_FINAL_DISPOSITION_RESTRICTS_FIT_TO_FLY",
                matched: true,
                severity: decision.severity,
                rationale:
                  "Final Emergency or Urgent disposition forces fit-to-fly status to restricted until clinician clearance."
              }
            ]
          }
        : aviation;
    const clipboardPayload = compileSbarClipboardPayload({
      request,
      profile: staff.profile,
      dependent,
      insurance,
      decision,
      aviation: finalAviation
    });
    const safetyAudit = buildSafetyAuditDraft(request, decision);
    const persistence = await persistEvaluatedEncounter({
      request,
      decision,
      aviation: finalAviation,
      clipboardPayload,
      safetyAudit
    });

    return res.json(withMockFlag({
      encounterId: randomUUID(),
      decision,
      insurance,
      aviation: finalAviation,
      clipboardPayload,
      safetyAudit,
      persistence,
      patientAge: {
        source: ageResolution.source,
        ageYears: ageResolution.ageYears,
        ageMonths: ageResolution.ageMonths,
        calculatedFrom: ageResolution.calculatedFrom
      },
      humanInLoopRequired: true,
      warnings: [
        "Mock rules are for MVP wiring only and must be replaced with licensed clinical content and local governance approvals.",
        "When MOCK_MODE=false, the API requires PostgreSQL/Cloud SQL and writes completed triage/audit records through Prisma."
      ]
    }));
  });

  return router;
}
