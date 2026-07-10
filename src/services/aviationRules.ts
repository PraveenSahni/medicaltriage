import type {
  AviationEvaluation,
  RuleTrace,
  StaffProfile,
  TriageEvaluationRequest
} from "../types/triage.js";

function textFor(request: TriageEvaluationRequest): string {
  return [
    request.symptoms.chiefComplaint,
    request.symptoms.narrative ?? "",
    ...request.symptoms.redFlags
  ].join(" ").toLowerCase();
}

export function evaluateAviationRules(
  request: TriageEvaluationRequest,
  profile: StaffProfile
): AviationEvaluation {
  const context = request.aviationContext;
  const text = textFor(request);
  const tags: string[] = [];
  const trace: RuleTrace[] = [];
  let fitToFlyStatus: AviationEvaluation["fitToFlyStatus"] = "cleared";
  let outstationEscalationRequired = false;
  let vaccinationReactionFlag = false;

  const isSafetySensitiveCrew =
    context.crewRole === "flight_deck" || context.crewRole === "cabin_crew";

  const hasOperationalSymptoms =
    text.includes("dizzy") ||
    text.includes("syncope") ||
    text.includes("chest") ||
    text.includes("shortness of breath") ||
    text.includes("altered consciousness");

  if (isSafetySensitiveCrew && hasOperationalSymptoms) {
    tags.push("fit-to-fly-review");
    fitToFlyStatus = "medical-review-required";
    trace.push({
      ruleId: "AVIATION_FIT_TO_FLY_SYMPTOM_GATE",
      matched: true,
      severity: "Urgent",
      rationale: "Safety-sensitive crew reported symptoms that require medical review before duty."
    });
  } else {
    trace.push({
      ruleId: "AVIATION_FIT_TO_FLY_SYMPTOM_GATE",
      matched: false,
      rationale: "No safety-sensitive fit-to-fly trigger was detected."
    });
  }

  if (context.outstation) {
    tags.push("outstation-validation");
    outstationEscalationRequired = true;
    trace.push({
      ruleId: "AVIATION_OUTSTATION_GATE",
      matched: true,
      severity: "Urgent",
      dispositionCode: "OUTSTATION_TELECONSULT_ESCALATION",
      rationale: `Staff is outstation${context.stationCode ? ` at ${context.stationCode}` : ""}; teleconsult escalation should be available.`
    });
  }

  if (context.sicknessLeaveRequested) {
    tags.push("sickness-validation");
  }

  if (
    typeof context.recentVaccinationHours === "number" &&
    context.recentVaccinationHours <= 72 &&
    (text.includes("rash") || text.includes("fever") || text.includes("swelling"))
  ) {
    tags.push("vaccination-reaction");
    vaccinationReactionFlag = true;
    trace.push({
      ruleId: "AVIATION_VACCINATION_REACTION_GATE",
      matched: true,
      severity: "Routine",
      rationale: "Recent vaccination plus reported reaction symptom requires structured follow-up."
    });
  }

  if (profile.dutyStatus !== "active") {
    tags.push(`duty-status-${profile.dutyStatus}`);
  }

  if (fitToFlyStatus === "medical-review-required" && context.onDuty) {
    fitToFlyStatus = "restricted";
    tags.push("duty-restriction");
  }

  return {
    tags,
    fitToFlyStatus,
    outstationEscalationRequired,
    sicknessValidationTelemetry: {
      requested: context.sicknessLeaveRequested === true,
      dutyStatus: profile.dutyStatus,
      crewRole: context.crewRole,
      stationCode: context.stationCode ?? "DOH"
    },
    vaccinationReactionFlag,
    trace
  };
}

