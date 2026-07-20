import { z } from "zod";
import { InitialAssessmentResponseTypeSchema } from "./clinicalContent.js";

export const VoiceSessionStatusSchema = z.enum([
  "CREATED",
  "ACTIVE",
  "AWAITING_NURSE_VALIDATION",
  "NURSE_TAKEOVER",
  "COMPLETED",
  "CANCELLED"
]);
export type VoiceSessionStatus = z.infer<typeof VoiceSessionStatusSchema>;

export const VoiceTurnStatusSchema = z.enum([
  "READY",
  "NEEDS_CLARIFICATION",
  "AWAITING_NURSE_VALIDATION",
  "VALIDATED",
  "REJECTED"
]);
export type VoiceTurnStatus = z.infer<typeof VoiceTurnStatusSchema>;

export const VoiceAnswerClassificationSchema = z.enum([
  "YES",
  "NO",
  "OPEN_TEXT",
  "UNCERTAIN",
  "INTERRUPTED",
  "EMERGENCY_SIGNAL"
]);
export type VoiceAnswerClassification = z.infer<typeof VoiceAnswerClassificationSchema>;

export const VoiceValidationStatusSchema = z.enum([
  "PENDING",
  "VALIDATED",
  "CORRECTED",
  "REJECTED"
]);
export type VoiceValidationStatus = z.infer<typeof VoiceValidationStatusSchema>;

export const StartVoiceAssessmentSchema = z
  .object({
    protocolId: z.string().min(1).max(120),
    queueItemId: z.string().min(1).max(160).optional(),
    callCenterSessionId: z.string().min(1).max(160).optional(),
    language: z.literal("en").default("en"),
    recordingNoticePlayed: z.literal(true),
    recordingAuthorizationStatus: z.enum(["GRANTED", "LEGAL_BASIS"])
  })
  .strict();
export type StartVoiceAssessmentInput = z.infer<typeof StartVoiceAssessmentSchema>;

export const SubmitVoiceResponseSchema = z
  .object({
    transcriptText: z.string().max(4000).default(""),
    interrupted: z.boolean().default(false),
    sttConfidence: z.number().min(0).max(1).optional(),
    speechStartedAtMs: z.number().int().min(0).optional(),
    speechEndedAtMs: z.number().int().min(0).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.speechStartedAtMs !== undefined &&
      value.speechEndedAtMs !== undefined &&
      value.speechEndedAtMs < value.speechStartedAtMs
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["speechEndedAtMs"],
        message: "speechEndedAtMs must be greater than or equal to speechStartedAtMs."
      });
    }
  });
export type SubmitVoiceResponseInput = z.infer<typeof SubmitVoiceResponseSchema>;

export const ValidateVoiceTurnSchema = z
  .object({
    decision: z.enum(["VALIDATE", "CORRECT", "REJECT"]),
    correctedAnswer: z
      .object({
        classification: z.enum(["YES", "NO", "OPEN_TEXT"]),
        value: z.union([z.string(), z.number(), z.boolean()])
      })
      .strict()
      .optional(),
    comment: z.string().min(2).max(1200).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.decision === "CORRECT" && !value.correctedAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correctedAnswer"],
        message: "A corrected answer is required when decision is CORRECT."
      });
    }
    if ((value.decision === "CORRECT" || value.decision === "REJECT") && !value.comment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["comment"],
        message: "A comment is required when correcting or rejecting a turn."
      });
    }
  });
export type ValidateVoiceTurnInput = z.infer<typeof ValidateVoiceTurnSchema>;

export const VoiceInterpreterInputSchema = z
  .object({
    questionId: z.string().min(1),
    responseType: InitialAssessmentResponseTypeSchema,
    promptTextEn: z.string().min(1),
    emergencyKeywords: z.array(z.string().min(1)),
    transcriptText: z.string(),
    interrupted: z.boolean(),
    sttConfidence: z.number().min(0).max(1).optional()
  })
  .strict();
export type VoiceInterpreterInput = z.infer<typeof VoiceInterpreterInputSchema>;

/**
 * The bounded interpreter can classify and extract only. Clinical severity,
 * disposition, route and care advice are intentionally absent from this schema.
 */
export const VoiceInterpreterOutputSchema = z
  .object({
    classification: VoiceAnswerClassificationSchema,
    value: z.union([z.string(), z.number(), z.boolean()]).optional(),
    confidence: z.number().min(0).max(1),
    evidence: z.array(z.string().min(1).max(240)).max(12),
    requiresNurseTakeover: z.boolean(),
    takeoverReason: z.string().min(1).max(500).optional()
  })
  .strict();
export type VoiceInterpreterOutput = z.infer<typeof VoiceInterpreterOutputSchema>;

export type VoiceQuestionDto = {
  id: string;
  sequence: number;
  responseType: z.infer<typeof InitialAssessmentResponseTypeSchema>;
  promptTextEn: string;
  clarificationPromptEn?: string;
  deliveryMode: "APPROVED_AUDIO_ASSET" | "TEXT_SIMULATION";
  audioAsset?: {
    id: string;
    storageUri: string;
    checksum: string;
    releaseVersion: string;
  };
};

export type VoiceTurnDto = {
  id: string;
  questionId: string;
  sequence: number;
  attempt: number;
  promptTextEn: string;
  transcriptText?: string;
  speechStartedAtMs?: number;
  speechEndedAtMs?: number;
  sttConfidence?: number;
  classification?: VoiceAnswerClassification;
  structuredAnswer?: string | number | boolean;
  confidence?: number;
  evidence: string[];
  interpreterProvider?: string;
  interpreterModel?: string;
  interpreterVersion?: string;
  status: VoiceTurnStatus;
  validationStatus: VoiceValidationStatus;
  nurseCorrectedAnswer?: {
    classification: "YES" | "NO" | "OPEN_TEXT";
    value: string | number | boolean;
  };
  validationComment?: string;
  validatedBy?: string;
  validatedAt?: string;
};

export type VoiceSessionDto = {
  id: string;
  createdByUserId: string;
  protocolId: string;
  protocolTitleEn: string;
  releaseVersion: string;
  language: "en";
  status: VoiceSessionStatus;
  queueItemId?: string;
  callCenterSessionId?: string;
  recordingGovernance: {
    noticePlayed: true;
    authorizationStatus: "GRANTED" | "LEGAL_BASIS";
    rawRecordingRagEligible: false;
    storageRegion: "me-central1";
  };
  currentQuestion?: VoiceQuestionDto;
  clarificationAttempts: number;
  maxClarificationAttempts: number;
  takeoverReason?: string;
  turns: VoiceTurnDto[];
  startedAt: string;
  completedAt?: string;
};

export const MedGemmaVoiceTrainingExampleSchema = z
  .object({
    exampleId: z.string().min(1),
    task: z.literal("BOUNDED_INITIAL_ASSESSMENT_INTERPRETATION"),
    protocolId: z.string().min(1),
    releaseVersion: z.string().min(1),
    questionId: z.string().min(1),
    responseType: InitialAssessmentResponseTypeSchema,
    promptTextEn: z.string().min(1),
    transcriptText: z.string().min(1),
    approvedClassification: z.enum(["YES", "NO", "OPEN_TEXT"]),
    approvedValue: z.union([z.string(), z.number(), z.boolean()]),
    evidence: z.array(z.string()),
    source: z.literal("NURSE_VALIDATED_VOICE_TURN")
  })
  .strict();
export type MedGemmaVoiceTrainingExample = z.infer<typeof MedGemmaVoiceTrainingExampleSchema>;
