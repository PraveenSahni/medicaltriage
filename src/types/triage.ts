import { z } from "zod";

export const SeveritySchema = z.enum(["Emergency", "Urgent", "Routine", "Self-care"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const severityRank: Record<Severity, number> = {
  "Self-care": 1,
  Routine: 2,
  Urgent: 3,
  Emergency: 4
};

export const DispositionCodeSchema = z.enum([
  "SIDRA_PEDIATRIC_ED",
  "HMC_EMERGENCY_DEPARTMENT",
  "HMC_URGENT_REVIEW",
  "IST_HIA_MIDFIELD_MEDICAL_CENTRE",
  "IST_OLD_AIRPORT_MEDICAL_COMMISSION",
  "PHCC_URGENT_CARE_OR_TELECONSULT",
  "OUTSTATION_TELECONSULT_ESCALATION",
  "SELF_CARE_WITH_CALLBACK_PRECAUTIONS"
]);
export type DispositionCode = z.infer<typeof DispositionCodeSchema>;

export const StaffValidateRequestSchema = z
  .object({
    istStaffId: z.string().min(3).max(64).optional(),
    ist_staff_id: z.string().min(3).max(64).optional()
  })
  .transform((value) => ({
    istStaffId: value.istStaffId ?? value.ist_staff_id ?? ""
  }))
  .refine((value) => value.istStaffId.length >= 3, {
    message: "ist_staff_id is required",
    path: ["ist_staff_id"]
  });
export type StaffValidateRequest = z.infer<typeof StaffValidateRequestSchema>;

export const TriageStartRequestSchema = z.object({
  istStaffId: z.string().min(3).max(64),
  dependentId: z.string().optional()
});
export type TriageStartRequest = z.infer<typeof TriageStartRequestSchema>;

export const TriageEvaluationRequestSchema = z.object({
  istStaffId: z.string().min(3).max(64),
  dependentId: z.string().optional(),
  nurseId: z.string().min(1).max(64),
  protocolId: z.string().min(1).max(120).optional(),
  selectedQuestionIds: z.array(z.string().min(1).max(120)).default([]),
  aiRecommendationSeverity: SeveritySchema.optional(),
  clinicianFinalSeverity: SeveritySchema.optional(),
  clinicianOverrideReasonCode: z.enum(["CLINICIAN_OVERRIDE_DOWN_BLOCKED", "CLINICIAN_OVERRIDE_UP", "OTHER"]).optional(),
  clinicianOverrideRationale: z.string().max(1200).optional(),
  nurseOverrideRationale: z.string().max(1000).optional(),
  symptoms: z.object({
    chiefComplaint: z.string().min(1).max(240),
    narrative: z.string().max(4000).optional(),
    language: z.enum(["en", "ar", "hi", "tl"]).default("en"),
    ageYears: z.number().int().min(0).max(120).optional(),
    biologicalSex: z.enum(["female", "male", "other", "unknown"]).optional(),
    durationMinutes: z.number().int().min(0).optional(),
    redFlags: z.array(z.string().min(1).max(100)).default([]),
    vitals: z.object({
      temperatureC: z.number().min(30).max(45).optional(),
      heartRate: z.number().int().min(20).max(260).optional(),
      oxygenSaturation: z.number().min(40).max(100).optional(),
      systolicBp: z.number().int().min(40).max(260).optional()
    }).optional()
  }),
  aviationContext: z.object({
    crewRole: z.enum(["flight_deck", "cabin_crew", "ground_staff", "dependent", "other"]).default("other"),
    onDuty: z.boolean().optional(),
    outstation: z.boolean().optional(),
    stationCode: z.string().max(12).optional(),
    flightDepartureIso: z.string().datetime().optional(),
    sicknessLeaveRequested: z.boolean().optional(),
    recentVaccinationHours: z.number().int().min(0).optional(),
    occupationalOrCommissionVisit: z.boolean().optional()
  }).default({})
});
export type TriageEvaluationRequest = z.infer<typeof TriageEvaluationRequestSchema>;

const ConsciousLevelSchema = z
  .preprocess((value) => String(value ?? "").trim().toLowerCase(), z.enum([
    "a",
    "alert",
    "v",
    "voice",
    "p",
    "pain",
    "u",
    "unresponsive"
  ]))
  .transform((value) => {
    if (value === "a" || value === "alert") {
      return "alert" as const;
    }
    if (value === "v" || value === "voice") {
      return "voice" as const;
    }
    if (value === "p" || value === "pain") {
      return "pain" as const;
    }
    return "unresponsive" as const;
  });

export const TriageCalculateScoreRequestSchema = z
  .object({
    heart_rate: z.coerce.number().int().min(20).max(260),
    respiratory_rate: z.coerce.number().int().min(1).max(80),
    spo2: z.coerce.number().min(40).max(100),
    temperature: z.coerce.number().min(30).max(45),
    conscious_level: ConsciousLevelSchema,
    ist_staff_id: z.string().min(3).max(64).optional(),
    istStaffId: z.string().min(3).max(64).optional(),
    dependent_id: z.string().min(1).max(120).optional(),
    dependentId: z.string().min(1).max(120).optional(),
    age_years: z.coerce.number().int().min(0).max(120).optional(),
    patient_age_years: z.coerce.number().int().min(0).max(120).optional(),
    age_months: z.coerce.number().int().min(0).max(1440).optional(),
    patient_age_months: z.coerce.number().int().min(0).max(1440).optional()
  })
  .transform((value) => {
    const ageMonths = value.age_months ?? value.patient_age_months;
    const istStaffId = value.istStaffId ?? value.ist_staff_id;
    const dependentId = value.dependentId ?? value.dependent_id;
    return {
      heartRate: value.heart_rate,
      respiratoryRate: value.respiratory_rate,
      spo2: value.spo2,
      temperatureC: value.temperature,
      consciousLevel: value.conscious_level,
      ...(istStaffId ? { istStaffId } : {}),
      ...(dependentId ? { dependentId } : {}),
      ageYears: value.age_years ?? value.patient_age_years ?? (ageMonths !== undefined ? ageMonths / 12 : undefined),
      ...(ageMonths !== undefined ? { ageMonths } : {})
    };
  });
export type TriageCalculateScoreRequest = z.infer<typeof TriageCalculateScoreRequestSchema>;

export const TriageCompleteRequestSchema = z
  .object({
    encounter_id: z.string().max(120).optional(),
    // The frontend's compileTriageCompletion() already sends this on every
    // call (see frontend/src/cockpit/api/triageCompletion.ts) - previously
    // silently dropped since this schema didn't recognize the field, which is
    // exactly why /triage/complete was non-idempotent: nothing distinguished
    // a genuine retry from a brand-new completion. A queue item can only be
    // completed once, so its id is a natural, already-available idempotency
    // key requiring no new client-side plumbing.
    queueItemId: z.string().max(160).optional(),
    ist_staff_id: z.string().min(3).max(64).optional(),
    istStaffId: z.string().min(3).max(64).optional(),
    patient_name: z.string().max(160).optional(),
    patient_age_years: z.coerce.number().int().min(0).max(120).optional(),
    nurse_id: z.string().max(64).optional(),
    // Matches QueueContextUpdateSchema's reasonNarrative max (1000) - the
    // chief complaint is typically the same text as the call's reason
    // narrative, so this must be able to hold it verbatim rather than
    // silently truncating a real caller's full description.
    chief_complaint: z.string().min(1).max(1000),
    subjective: z.string().max(2000).optional(),
    objective: z.string().max(2000).optional(),
    assessment: z.string().max(2000).optional(),
    recommendation: z.string().max(2000).optional(),
    final_disposition_code: z.string().min(1).max(120),
    calculated_severity: z.enum(["EMERGENCY", "URGENT", "ROUTINE", "SELF_CARE"]).optional(),
    routing_destination: z.string().min(1).max(240),
    safety_rationale: z.string().max(2000).optional(),
    vitals: TriageCalculateScoreRequestSchema.optional(),
    custom_aviation_tags: z.array(z.string().min(1).max(80)).default([])
  })
  .transform((value) => ({
    encounterId: value.encounter_id,
    queueItemId: value.queueItemId,
    istStaffId: value.istStaffId ?? value.ist_staff_id,
    patientName: value.patient_name,
    patientAgeYears: value.patient_age_years,
    nurseId: value.nurse_id,
    chiefComplaint: value.chief_complaint,
    subjective: value.subjective,
    objective: value.objective,
    assessment: value.assessment,
    recommendation: value.recommendation,
    finalDispositionCode: value.final_disposition_code,
    calculatedSeverity: value.calculated_severity,
    routingDestination: value.routing_destination,
    safetyRationale: value.safety_rationale,
    vitals: value.vitals,
    customAviationTags: value.custom_aviation_tags
  }));
export type TriageCompleteRequest = z.infer<typeof TriageCompleteRequestSchema>;

export type DependentProfile = {
  id: string;
  relationshipType: "spouse" | "child" | "parent" | "other";
  age: number;
  dateOfBirthIso?: string;
  biologicalSex: "female" | "male" | "other" | "unknown";
};

export type StaffProfile = {
  id: string;
  istStaffId: string;
  department: string;
  jobTitle: string;
  dutyStatus: "active" | "on-leave" | "suspended" | "inactive";
  dateOfBirthIso?: string;
  biologicalSex?: "female" | "male" | "other" | "unknown";
  insuranceProvider?: string;
  insuranceEligibilityStatus: "eligible" | "ineligible" | "pending-verification" | "unknown";
  insuranceLastChecked?: string;
  dependents: DependentProfile[];
};

export type StaffValidationResult = {
  valid: boolean;
  profile?: StaffProfile;
  reason?: string;
};

export type InsuranceSnapshot = {
  provider: string;
  status: StaffProfile["insuranceEligibilityStatus"];
  lastCheckedIso: string;
  notes: string[];
};

export type RuleTrace = {
  ruleId: string;
  matched: boolean;
  severity?: Severity;
  dispositionCode?: DispositionCode;
  rationale: string;
};

export type AviationEvaluation = {
  tags: string[];
  fitToFlyStatus: "cleared" | "restricted" | "medical-review-required";
  outstationEscalationRequired: boolean;
  sicknessValidationTelemetry: Record<string, unknown>;
  vaccinationReactionFlag: boolean;
  trace: RuleTrace[];
};

export type DispositionDecision = {
  severity: Severity;
  dispositionCode: DispositionCode;
  destinationName: string;
  destinationRationale: string;
  safetyFloorApplied: boolean;
  trace: RuleTrace[];
};

export type ClipboardPayload = {
  englishSbar: string;
  arabicSbar: string;
  clipboardText: string;
  structured: Record<string, unknown>;
};

export function severityMax(left: Severity, right: Severity): Severity {
  return severityRank[left] >= severityRank[right] ? left : right;
}

export function isSeverityDowngrade(candidate: Severity, floor: Severity): boolean {
  return severityRank[candidate] < severityRank[floor];
}
