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

export const StaffValidateRequestSchema = z.object({
  istStaffId: z.string().min(3).max(64)
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

export type DependentProfile = {
  id: string;
  relationshipType: "spouse" | "child" | "parent" | "other";
  age: number;
  biologicalSex: "female" | "male" | "other" | "unknown";
};

export type StaffProfile = {
  id: string;
  istStaffId: string;
  department: string;
  jobTitle: string;
  dutyStatus: "active" | "on-leave" | "suspended" | "inactive";
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
