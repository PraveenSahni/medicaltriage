import { z } from "zod";

export const QueueStatusSchema = z.enum(["INCOMING", "IN_PROCESS", "INFO_REQUIRED", "COMPLETED"]);
export type QueueStatus = z.infer<typeof QueueStatusSchema>;

export const QueueClinicalStageSchema = z.enum(["INTAKE", "IDENTITY", "VITALS", "PROTOCOL", "DISPOSITION", "SBAR"]);
export type QueueClinicalStage = z.infer<typeof QueueClinicalStageSchema>;

export const QueueSeveritySchema = z.enum(["EMERGENCY", "URGENT", "ROUTINE", "SELF_CARE"]);
export type QueueSeverity = z.infer<typeof QueueSeveritySchema>;

export const SafetyFloorSourceSchema = z.enum(["vitals", "symptom", "judgment"]);
export type SafetyFloorSource = z.infer<typeof SafetyFloorSourceSchema>;

export const FitToFlyStatusSchema = z.enum(["CLEARED", "RESTRICTED", "MEDICAL_REVIEW_REQUIRED"]);
export type FitToFlyStatus = z.infer<typeof FitToFlyStatusSchema>;

export const QueueVitalsSchema = z.object({
  heartRate: z.number().int().min(20).max(260),
  respiratoryRate: z.number().int().min(4).max(80),
  spo2: z.number().min(50).max(100),
  temperature: z.number().min(30).max(45),
  consciousLevel: z.enum(["alert", "voice", "pain", "unresponsive"])
});
export type QueueVitals = z.infer<typeof QueueVitalsSchema>;

export const QueueListQuerySchema = z.object({
  severity: z.string().optional(),
  wait_time: z.string().optional(),
  station: z.string().optional(),
  patient_type: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  channel: z.string().optional(),
  stage: z.string().optional(),
  owner: z.string().optional(),
  safety_floor_status: z.string().optional(),
  // Opt-in only (closes part of the pagination gap noted in
  // docs/load-test-baseline-2026-08-04.md) - omitted entirely, the response
  // is the full unpaginated list exactly as before, since the live nurse
  // cockpit board genuinely needs to see every active queue item at once,
  // not one page of it. limit/offset only apply when a caller explicitly
  // opts in (e.g. a future reporting view, or an API consumer that doesn't
  // need the whole live board).
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional()
});
export type QueueListQuery = z.infer<typeof QueueListQuerySchema>;

export const QueueCreateRequestSchema = z.object({
  istStaffId: z.string().min(2).max(80),
  dependentId: z.string().min(1).max(120).optional(),
  organizationId: z.string().min(2).max(80).optional(),
  targetOrganizationId: z.string().min(2).max(80).optional(),
  patientType: z.enum(["Staff", "Dependent"]).default("Staff"),
  channel: z.enum(["Phone", "WhatsApp", "Callback", "Email"]).default("Phone"),
  stationCode: z.string().min(2).max(12).optional(),
  department: z.string().min(1).max(120).optional(),
  jobTitle: z.string().min(1).max(120).optional(),
  summary: z.string().min(1).max(500).default("New tele-triage call awaiting intake."),
  reasonNarrative: z.string().min(1).max(1000).optional(),
  safetyFloorActive: z.boolean().default(false),
  slaMinutes: z.number().int().min(1).max(720).default(15),
  // Synthetic-seeding only: lets a mock-mode batch backdate createdAt/updatedAt
  // so demo/test data can be spread across a realistic time window instead of
  // all landing at "now". Ignored outside mock mode - see createQueueItem().
  seedCreatedAtIso: z.string().datetime().optional()
});
export type QueueCreateRequest = z.infer<typeof QueueCreateRequestSchema>;

export const ManualPatientLookupRequestSchema = z.object({
  patientIdentifier: z.string().trim().min(2).max(120)
});

export const ManualQueueCreateRequestSchema = z.object({
  patientIdentifier: z.string().trim().min(2).max(120),
  reasonNarrative: z.string().trim().min(3).max(1000),
  channel: z.enum(["Phone", "WhatsApp", "Callback", "Email"]).default("Phone")
});
export type ManualQueueCreateRequest = z.infer<typeof ManualQueueCreateRequestSchema>;

export const QueueMoveRequestSchema = z.object({
  toStatus: QueueStatusSchema.optional(),
  toStage: QueueClinicalStageSchema,
  reason: z.string().min(3).max(500).optional()
});
export type QueueMoveRequest = z.infer<typeof QueueMoveRequestSchema>;

export const QueueHandoverRequestSchema = z.object({
  targetOrganizationId: z.string().min(2).max(80),
  targetOrganizationCode: z.string().min(2).max(20).optional(),
  reason: z.string().min(6).max(500)
});
export type QueueHandoverRequest = z.infer<typeof QueueHandoverRequestSchema>;

export const QueueContextUpdateSchema = z.object({
  identityValidated: z.boolean().optional(),
  // Partial, not the full QueueVitalsSchema - a nurse enters vitals one
  // field at a time (heart rate, then respiratory rate, etc.), and
  // requiring every field in the same request made it impossible to save
  // any single value until all five had been typed.
  vitals: QueueVitalsSchema.partial().optional(),
  matchedProtocolId: z.string().min(1).max(120).optional(),
  calculatedSeverity: QueueSeveritySchema.optional(),
  floorSource: SafetyFloorSourceSchema.optional(),
  dispositionCode: z.string().min(2).max(120).optional(),
  destinationName: z.string().min(2).max(200).optional(),
  // These maps are PATCH fragments, not replacement documents. The backend
  // merges their keys into the stored clinical record so a later approval or
  // single-question save cannot erase earlier protocol lineage or answers.
  clinicalApproval: z.record(z.unknown()).optional(),
  initialAssessmentResponses: z.record(z.string().max(400)).optional(),
  taqResponses: z.record(z.boolean()).optional(),
  sbarNoteText: z.string().min(1).max(8000).optional(),
  fitToFlyStatus: FitToFlyStatusSchema.optional(),
  vitalsUnobtainable: z.boolean().optional(),
  sbarCopied: z.boolean().optional(),
  summary: z.string().min(1).max(500).optional(),
  reasonNarrative: z.string().min(1).max(1000).optional(),
  // Provenance of the reason narrative when it came from an IVR audio
  // capture + speech-to-text conversion rather than the nurse typing it
  // directly - see src/services/reasonForCallVoiceCapture.ts.
  reasonCallCapture: z
    .object({
      audioReference: z.string().max(500).optional(),
      transcriptText: z.string().min(1).max(1000),
      confidence: z.number().min(0).max(1),
      provider: z.string().min(1).max(60),
      capturedAtIso: z.string().datetime()
    })
    .optional(),
  assignedNurseId: z.string().min(1).max(120).optional(),
  // Explicit nurse attestation ("I heard the audio, this text is accurate")
  // distinct from just saving an edited reasonNarrative - see
  // queueOrchestration.ts's updateQueueItemContext, which resets this to
  // false any time reasonNarrative itself changes.
  reasonNarrativeConfirmed: z.boolean().optional()
});
export type QueueContextUpdate = z.infer<typeof QueueContextUpdateSchema>;

export type QueueTransitionLogDto = {
  id: string;
  queueItemId: string;
  actorId: string;
  actorOrganizationId?: string;
  actorRole: string;
  targetOrganizationId?: string;
  eventType?: string;
  fromStatus: QueueStatus;
  toStatus: QueueStatus;
  fromStage: QueueClinicalStage;
  toStage: QueueClinicalStage;
  reason?: string;
  auditSignature: string;
  timestampIso: string;
};

export type QueuePatientAgeSnapshotDto = {
  source: "staff" | "dependent";
  ageYears: number;
  ageMonths: number;
  dateOfBirthIso?: string;
  calculatedFrom: "HRMS_DATE_OF_BIRTH" | "HRMS_AGE_FIELD";
  biologicalSex?: "female" | "male" | "other" | "unknown";
};

export type QueueProtocolSuggestionDto = {
  protocolId: string;
  titleEn: string;
  score: number;
  matchedTerms: string[];
  questionCount: number;
  highestSeverity: "Emergency" | "Urgent" | "Routine" | "Self-care";
  releaseVersion: string;
  acuity?: number;
};

export type QueueProtocolQuestionPreviewDto = {
  id: string;
  acuityOrder: number;
  severity: "Emergency" | "Urgent" | "Routine" | "Self-care";
  questionTextEn: string;
  dispositionCode: string;
  redFlag: boolean;
  careAdviceIds: string[];
};

export type StccProcessStepStatus = "NOT_STARTED" | "READY" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type StccProcessStepDto = {
  id:
    | "OPENING_SCRIPT"
    | "REASON_FOR_VISIT"
    | "GUIDELINE_SELECTION"
    | "INITIAL_ASSESSMENT_QUESTIONS"
    | "TRIAGE_ASSESSMENT_QUESTIONS"
    | "TELEMEDICINE_ELIGIBLE"
    | "TRIAGE_DISPOSITION"
    | "CARE_ADVICE"
    | "HANDOFF_REFERRAL"
    | "CLOSING_SCRIPT";
  label: string;
  lane: "CALL_OPENING" | "GUIDELINE_SELECTION" | "ASSESSMENT" | "DISPOSITION_AND_CLOSE";
  status: StccProcessStepStatus;
  deterministicOwner: "SYSTEM" | "NURSE" | "SYSTEM_AND_NURSE";
  nurseActionRequired: boolean;
  notes: string[];
  sourceBoundary: "HRMS" | "STCC_CONTENT" | "LOCAL_QATAR_OVERLAY" | "NURSE_DOCUMENTATION";
};

export type StccVisibleActionTab =
  | "REASON_AND_EMERGENCY_RULE_OUT"
  | "QUESTIONS"
  | "DISPOSITION_AND_CARE_ADVICE"
  | "SBAR_COMPLETE";

export type StccProcessSnapshotDto = {
  processName: "Telehealth Triage Encounter";
  averageDurationMinutes: "11-13";
  currentActionTab: StccVisibleActionTab;
  canonicalSteps: StccProcessStepDto[];
  visibleActionTabs: Array<{
    id: StccVisibleActionTab;
    label: string;
    mappedStepIds: StccProcessStepDto["id"][];
  }>;
};

export type RagShadowSuggestionDto = {
  mode: "DRY_RUN_SHADOW";
  boundary: "APPROVED_CONTENT_ONLY";
  sourceType:
    | "synthetic-sample"
    | "licensed-stcc"
    | "local-qatar-override"
    | "open-source-clinical-rule"
    | "open-source-guideline";
  sourceReleaseVersion: string;
  query: string;
  extractedReason: {
    normalizedReason: string;
    keywords: string[];
    possibleRedFlags: string[];
  };
  retrieval: {
    eventId: string;
    corpusIds: string[];
    retrievedSourceIds: string[];
    retrievedSnippetHashes: string[];
    confidence: number;
  };
  suggestedProtocolCandidates: QueueProtocolSuggestionDto[];
  comparison: {
    deterministicPrimaryProtocolId?: string;
    shadowPrimaryProtocolId?: string;
    agreement: "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH" | "NO_DETERMINISTIC_CANDIDATE" | "NO_SHADOW_CANDIDATE";
    reasonCode: string;
  };
  prohibitedActionAcknowledgement: string[];
  cannotDecideDisposition: true;
  requiresNurseReview: true;
  generatedAtIso: string;
};

export type QueuePreparedProtocolDto = {
  status: "PENDING_REASON" | "PREPARED" | "AMBIGUOUS" | "NO_MATCH";
  sourceType:
    | "synthetic-sample"
    | "licensed-stcc"
    | "local-qatar-override"
    | "open-source-clinical-rule"
    | "open-source-guideline";
  releaseVersion: string;
  reasonNarrative: string;
  extractedKeywords: string[];
  primaryProtocolId?: string;
  primaryProtocolTitle?: string;
  suggestions: QueueProtocolSuggestionDto[];
  acuityQuestionPreview: QueueProtocolQuestionPreviewDto[];
  resourceSectionsAvailable: {
    background: boolean;
    firstAid: boolean;
    careAdvice: boolean;
    seeMoreAppropriateGuideline: boolean;
  };
  ragShadow?: RagShadowSuggestionDto;
  preparedAtIso: string;
};

export type QueueItemDto = {
  id: string;
  istStaffId: string;
  dependentId?: string;
  organizationId?: string;
  organizationCode?: string;
  targetOrganizationId?: string;
  targetOrganizationCode?: string;
  status: QueueStatus;
  currentStage: QueueClinicalStage;
  priorityScore: number;
  patientType: "Staff" | "Dependent";
  channel: string;
  stationCode?: string;
  department?: string;
  jobTitle?: string;
  summary: string;
  reasonNarrative?: string;
  reasonCallCapture?: {
    audioReference?: string;
    transcriptText: string;
    confidence: number;
    provider: string;
    capturedAtIso: string;
  };
  preparedProtocol?: QueuePreparedProtocolDto;
  stccProcess: StccProcessSnapshotDto;
  vitals?: QueueVitals;
  matchedProtocolId?: string;
  calculatedSeverity?: QueueSeverity;
  dispositionCode?: string;
  destinationName?: string;
  identityValidated: boolean;
  identityValidationSource?: "HRMS_AUTO" | "HRMS_LOOKUP_FAILED";
  identityValidationMessage?: string;
  identityValidatedAtIso?: string;
  patientAge?: QueuePatientAgeSnapshotDto;
  safetyFloorActive: boolean;
  safetyFloorSource?: SafetyFloorSource;
  initialAssessmentResponses?: Record<string, string>;
  taqResponses?: Record<string, boolean>;
  sbarNoteText?: string;
  fitToFlyStatus?: FitToFlyStatus;
  vitalsUnobtainable?: boolean;
  reasonNarrativeConfirmed?: boolean;
  clinicalApproval?: Record<string, unknown>;
  sbarCopied: boolean;
  assignedNurseId?: string;
  claimedAtIso?: string;
  // Set once, the moment the record first transitions to COMPLETED (see
  // moveQueueItem) - the fixed end-point for computing "total time to close
  // a call" (claimedAtIso -> completedAtIso), independent of currentStage,
  // which can still change afterward if a supervisor reopens the record.
  completedAtIso?: string;
  slaDeadlineIso: string;
  lockedBy?: string;
  lockedByName?: string;
  lockExpiresAtIso?: string;
  customAviationTags: string[];
  createdAtIso: string;
  updatedAtIso: string;
  transitionLogs?: QueueTransitionLogDto[];
};
