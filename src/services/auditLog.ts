import type {
  DispositionDecision,
  TriageEvaluationRequest
} from "../types/triage.js";
import { isSeverityDowngrade } from "../types/triage.js";

export type SafetyAuditDraft = {
  required: boolean;
  originalAiRecommendation?: string;
  nurseOverrideRationale?: string;
  rulesEngineSeverity: string;
  overrideStatusFlag: "AI_RECOMMENDATION_DIFFERED" | "NURSE_OVERRIDE_UP" | "NURSE_OVERRIDE_DOWN_BLOCKED" | "RULES_ENGINE_FINAL";
  isCriticalFloorBreach: boolean;
  explainabilityTrace: unknown[];
};

export function buildSafetyAuditDraft(
  request: TriageEvaluationRequest,
  decision: DispositionDecision
): SafetyAuditDraft {
  const aiSeverity = request.aiRecommendationSeverity;
  const aiDiffers = Boolean(aiSeverity && aiSeverity !== decision.severity);
  const downgradeBlocked = Boolean(aiSeverity && isSeverityDowngrade(aiSeverity, decision.severity));
  const clinicianFloorBreach = Boolean(
    request.clinicianFinalSeverity && isSeverityDowngrade(request.clinicianFinalSeverity, decision.severity)
  );

  let overrideStatusFlag: SafetyAuditDraft["overrideStatusFlag"] = "RULES_ENGINE_FINAL";
  if (downgradeBlocked || clinicianFloorBreach) {
    overrideStatusFlag = "NURSE_OVERRIDE_DOWN_BLOCKED";
  } else if (request.nurseOverrideRationale) {
    overrideStatusFlag = "NURSE_OVERRIDE_UP";
  } else if (aiDiffers) {
    overrideStatusFlag = "AI_RECOMMENDATION_DIFFERED";
  }

  return {
    required:
      aiDiffers ||
      Boolean(request.nurseOverrideRationale) ||
      Boolean(request.clinicianOverrideRationale) ||
      clinicianFloorBreach ||
      decision.severity === "Emergency",
    originalAiRecommendation: aiSeverity,
    nurseOverrideRationale: request.nurseOverrideRationale ?? request.clinicianOverrideRationale,
    rulesEngineSeverity: decision.severity,
    overrideStatusFlag,
    isCriticalFloorBreach: clinicianFloorBreach,
    explainabilityTrace: decision.trace
  };
}
