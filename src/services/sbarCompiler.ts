import type {
  AviationEvaluation,
  ClipboardPayload,
  DependentProfile,
  DispositionDecision,
  InsuranceSnapshot,
  StaffProfile,
  TriageEvaluationRequest
} from "../types/triage.js";

function callerLabel(profile: StaffProfile, dependent?: DependentProfile): string {
  if (dependent) {
    return `${dependent.relationshipType} dependent of ${profile.department} staff member ${profile.istStaffId}`;
  }

  return `${profile.department} staff member ${profile.istStaffId}`;
}

export function compileSbarClipboardPayload(args: {
  request: TriageEvaluationRequest;
  profile: StaffProfile;
  dependent?: DependentProfile;
  insurance: InsuranceSnapshot;
  decision: DispositionDecision;
  aviation: AviationEvaluation;
}): ClipboardPayload {
  const { request, profile, dependent, insurance, decision, aviation } = args;
  const caller = callerLabel(profile, dependent);
  const symptomText = request.symptoms.narrative || request.symptoms.chiefComplaint;
  const tags = aviation.tags.length > 0 ? aviation.tags.join(", ") : "none";

  const englishSbar = [
    `S: ${caller} reports ${symptomText}.`,
    `B: Duty status ${profile.dutyStatus}; insurance ${insurance.status}; language ${request.symptoms.language}.`,
    `A: Deterministic safety floor ${decision.severity}; route ${decision.dispositionCode}; aviation tags ${tags}.`,
    `R: ${decision.destinationName}. ${decision.destinationRationale}`
  ].join(" ");

  // MVP bilingual support: Arabic labels are provided, while clinical content
  // remains source text until a governed translation service is connected.
  const arabicSbar = [
    `الشكوى: ${caller} - ${symptomText}.`,
    `الخلفية: حالة العمل ${profile.dutyStatus}; التأمين ${insurance.status}; اللغة ${request.symptoms.language}.`,
    `التقييم: مستوى السلامة ${decision.severity}; المسار ${decision.dispositionCode}; وسوم الطيران ${tags}.`,
    `التوصية: ${decision.destinationName}. ${decision.destinationRationale}`
  ].join(" ");

  return {
    englishSbar,
    arabicSbar,
    clipboardText: [
      "IST Tele-Triage SBAR",
      "",
      englishSbar,
      "",
      "Arabic summary",
      arabicSbar
    ].join("\n"),
    structured: {
      staffId: profile.istStaffId,
      dependentId: dependent?.id,
      nurseId: request.nurseId,
      severity: decision.severity,
      dispositionCode: decision.dispositionCode,
      destinationName: decision.destinationName,
      aviation,
      insurance
    }
  };
}
