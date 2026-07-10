import type {
  AviationEvaluation,
  DispositionCode,
  DispositionDecision,
  RuleTrace,
  Severity,
  StaffProfile,
  TriageEvaluationRequest
} from "../types/triage.js";
import { severityMax } from "../types/triage.js";
import { deriveProtocolSafetyFloor, getLocalizedDisposition } from "./clinicalContent.js";

function textFor(request: TriageEvaluationRequest): string {
  return [
    request.symptoms.chiefComplaint,
    request.symptoms.narrative ?? "",
    ...request.symptoms.redFlags
  ].join(" ").toLowerCase();
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function pediatricAge(request: TriageEvaluationRequest): boolean {
  return typeof request.symptoms.ageYears === "number" && request.symptoms.ageYears < 18;
}

function deriveRulesFloor(request: TriageEvaluationRequest): {
  severity: Severity;
  dispositionCode?: DispositionCode;
  trace: RuleTrace[];
} {
  const text = textFor(request);
  const trace: RuleTrace[] = [];
  let severity: Severity = "Self-care";

  const emergencyRules: Array<{ id: string; matched: boolean; rationale: string }> = [
    {
      id: "STCC_MOCK_CHEST_PAIN_SWEATING",
      matched: text.includes("chest") && hasAny(text, ["sweat", "diaphoresis", "tight"]),
      rationale: "Chest pain/tightness with sweating is treated as an emergency floor in the mock ruleset."
    },
    {
      id: "STCC_MOCK_SEVERE_CONSTANT_PAIN_GT_60",
      matched:
        hasAny(text, ["severe", "constant"]) &&
        hasAny(text, ["chest", "abdominal", "abdomen"]) &&
        (request.symptoms.durationMinutes ?? 0) >= 60,
      rationale: "Severe constant chest or abdominal pain for 60+ minutes cannot be downgraded by AI."
    },
    {
      id: "STCC_MOCK_BREATHING_OR_CONSCIOUSNESS",
      matched: hasAny(text, ["shortness of breath", "difficulty breathing", "altered consciousness", "unresponsive"]),
      rationale: "Breathing difficulty or altered consciousness requires emergency disposition."
    },
    {
      id: "STCC_MOCK_STROKE_OR_ANAPHYLAXIS",
      matched: hasAny(text, ["face droop", "slurred speech", "one-sided weakness", "anaphylaxis", "throat swelling"]),
      rationale: "Stroke/anaphylaxis warning terms require emergency disposition."
    }
  ];

  for (const rule of emergencyRules) {
    trace.push({
      ruleId: rule.id,
      matched: rule.matched,
      severity: rule.matched ? "Emergency" : undefined,
      rationale: rule.rationale
    });

    if (rule.matched) {
      severity = "Emergency";
    }
  }

  if (severity !== "Emergency") {
    const urgentMatched =
      hasAny(text, ["moderate pain", "persistent vomiting", "high fever", "dizziness"]) ||
      (typeof request.symptoms.vitals?.oxygenSaturation === "number" &&
        request.symptoms.vitals.oxygenSaturation < 94);

    trace.push({
      ruleId: "STCC_MOCK_URGENT_REVIEW",
      matched: urgentMatched,
      severity: urgentMatched ? "Urgent" : undefined,
      rationale: "Moderate concerning symptoms or abnormal oxygen saturation should receive urgent review."
    });

    if (urgentMatched) {
      severity = "Urgent";
    } else if (hasAny(text, ["cough", "sore throat", "back pain", "rash", "fever"])) {
      severity = "Routine";
      trace.push({
        ruleId: "STCC_MOCK_ROUTINE_REVIEW",
        matched: true,
        severity: "Routine",
        rationale: "Common lower-acuity symptom matched routine/self-care review bucket."
      });
    }
  }

  const protocolFloor = deriveProtocolSafetyFloor(request.protocolId, request.selectedQuestionIds);
  trace.push(...protocolFloor.trace);

  return {
    severity: severityMax(severity, protocolFloor.severity),
    dispositionCode: protocolFloor.dispositionCode,
    trace
  };
}

function routeBySeverity(
  request: TriageEvaluationRequest,
  severity: Severity,
  aviation: AviationEvaluation,
  protocolDispositionCode?: DispositionCode
): Pick<DispositionDecision, "dispositionCode" | "destinationName" | "destinationRationale"> {
  if (severity === "Emergency" && pediatricAge(request)) {
    return {
      dispositionCode: "SIDRA_PEDIATRIC_ED",
      destinationName: "Sidra Medicine Emergency Department",
      destinationRationale: "High-acuity pediatric presentation."
    };
  }

  if (severity === "Emergency") {
    return {
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      destinationName: "Nearest Hamad Medical Corporation Emergency Department",
      destinationRationale: "High-acuity adult/general presentation."
    };
  }

  if (aviation.outstationEscalationRequired) {
    return {
      dispositionCode: "OUTSTATION_TELECONSULT_ESCALATION",
      destinationName: "IST teleconsult escalation for outstation staff",
      destinationRationale: "Outstation staff require remote clinical coordination and duty-status handling."
    };
  }

  if (
    request.aviationContext.occupationalOrCommissionVisit ||
    aviation.fitToFlyStatus !== "cleared" ||
    request.aviationContext.sicknessLeaveRequested
  ) {
    const dispositionCode: DispositionCode = request.aviationContext.occupationalOrCommissionVisit
      ? "IST_OLD_AIRPORT_MEDICAL_COMMISSION"
      : "IST_HIA_MIDFIELD_MEDICAL_CENTRE";

    return {
      dispositionCode,
      destinationName:
        dispositionCode === "IST_OLD_AIRPORT_MEDICAL_COMMISSION"
          ? "IST Old Airport Road Medical Commission"
          : "IST Medical Centre, HIA Midfield",
      destinationRationale: "Occupational, fit-to-fly, or sickness-validation workflow."
    };
  }

  if (protocolDispositionCode) {
    const localized = getLocalizedDisposition(protocolDispositionCode);
    return {
      dispositionCode: protocolDispositionCode,
      destinationName: localized?.destinationNameEn ?? protocolDispositionCode,
      destinationRationale:
        localized?.routingNotesEn ?? "Disposition selected by the active Phase 1 protocol content."
    };
  }

  if (severity === "Urgent") {
    return {
      dispositionCode: "HMC_URGENT_REVIEW",
      destinationName: "HMC urgent review pathway",
      destinationRationale: "Urgent but not emergency according to the mock safety floor."
    };
  }

  if (severity === "Routine") {
    return {
      dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
      destinationName: "PHCC urgent care or IST teleconsult booking",
      destinationRationale: "Low-acuity staff pathway with local primary-care or teleconsult option."
    };
  }

  return {
    dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
    destinationName: "Self-care with callback precautions",
    destinationRationale: "No mock red flag or urgent review trigger was detected."
  };
}

export function resolveDisposition(
  request: TriageEvaluationRequest,
  _profile: StaffProfile,
  aviation: AviationEvaluation
): DispositionDecision {
  const floor = deriveRulesFloor(request);
  const aviationFloor = aviation.trace.reduce<Severity>(
    (current, item) => (item.severity ? severityMax(current, item.severity) : current),
    "Self-care"
  );
  const severity = severityMax(floor.severity, aviationFloor);
  const route = routeBySeverity(request, severity, aviation, floor.dispositionCode);

  return {
    severity,
    ...route,
    safetyFloorApplied: severity !== "Self-care",
    trace: [...floor.trace, ...aviation.trace]
  };
}
