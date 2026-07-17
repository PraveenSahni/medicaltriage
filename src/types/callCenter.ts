import { z } from "zod";

export const CallCenterDirectionSchema = z.enum(["INBOUND", "OUTBOUND"]);
export type CallCenterDirection = z.infer<typeof CallCenterDirectionSchema>;

export const CallCenterEventTypeSchema = z.enum([
  "CALL_OFFERED",
  "CALL_CONNECTED",
  "CALL_HELD",
  "CALL_RESUMED",
  "CALL_ENDED",
  "CALLBACK_REQUESTED",
  "CALLBACK_ANSWERED",
  "NO_ANSWER",
  "RECORDING_AVAILABLE"
]);
export type CallCenterEventType = z.infer<typeof CallCenterEventTypeSchema>;

export const CallCenterSessionStatusSchema = z.enum([
  "OFFERED",
  "WAITING_CALLBACK",
  "CONNECTING",
  "CONNECTED",
  "HELD",
  "ENDED",
  "NO_ANSWER",
  "FAILED"
]);
export type CallCenterSessionStatus = z.infer<typeof CallCenterSessionStatusSchema>;

export const RecordingConsentStatusSchema = z.enum([
  "NOT_CAPTURED",
  "GRANTED",
  "DECLINED",
  "LEGAL_BASIS"
]);
export type RecordingConsentStatus = z.infer<typeof RecordingConsentStatusSchema>;

const ProviderKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9._-]*$/i, "Provider key contains unsupported characters");

export const RecordingGovernanceSchema = z.object({
  purpose: z.literal("SERVICE_QUALITY_AND_SAFETY").default("SERVICE_QUALITY_AND_SAFETY"),
  noticePlayed: z.boolean(),
  noticeVersion: z.string().trim().min(1).max(80),
  consentStatus: RecordingConsentStatusSchema,
  guardianConsentConfirmed: z.boolean().optional(),
  storageRegion: z.literal("me-central1").default("me-central1"),
  objectRef: z.string().trim().min(3).max(500).optional(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i).optional(),
  durationSeconds: z.number().int().min(0).max(86_400).optional(),
  ragEligible: z.literal(false).default(false)
});
export type RecordingGovernance = z.infer<typeof RecordingGovernanceSchema>;

export const CallCenterEventSchema = z.object({
  provider: ProviderKeySchema,
  providerEventId: z.string().trim().min(2).max(160),
  externalCallId: z.string().trim().min(2).max(160),
  eventType: CallCenterEventTypeSchema,
  occurredAtIso: z.string().datetime({ offset: true }),
  direction: CallCenterDirectionSchema,
  channel: z.enum(["Phone", "Callback"]).default("Phone"),
  ani: z.string().trim().min(3).max(40).optional(),
  dnis: z.string().trim().min(2).max(80).optional(),
  callbackTargetRef: z.string().trim().min(2).max(160).optional(),
  language: z.string().trim().min(2).max(16).default("en"),
  queueName: z.string().trim().min(1).max(120).optional(),
  agentId: z.string().trim().min(1).max(120).optional(),
  istStaffId: z.string().trim().min(2).max(80).optional(),
  dependentId: z.string().trim().min(1).max(120).optional(),
  organizationId: z.string().trim().min(2).max(80).optional(),
  patientType: z.enum(["Staff", "Dependent"]).default("Staff"),
  stationCode: z.string().trim().min(2).max(12).optional(),
  reasonNarrative: z.string().trim().min(1).max(1000).optional(),
  recording: RecordingGovernanceSchema.optional(),
  metadata: z.record(z.unknown()).default({})
});
export type CallCenterEvent = z.infer<typeof CallCenterEventSchema>;

export const CallCenterCommandSchema = z.object({
  action: z.enum(["ANSWER", "START_CALLBACK", "HOLD", "RESUME", "END"]),
  provider: ProviderKeySchema.optional(),
  recordingAuthorization: RecordingGovernanceSchema.omit({
    objectRef: true,
    sha256: true,
    durationSeconds: true
  }).optional()
});
export type CallCenterCommand = z.infer<typeof CallCenterCommandSchema>;

export type CallCenterSessionDto = {
  id: string;
  queueItemId?: string;
  provider: string;
  externalCallId: string;
  direction: CallCenterDirection;
  channel: "Phone" | "Callback";
  status: CallCenterSessionStatus;
  aniMasked?: string;
  dnis?: string;
  language: string;
  queueName?: string;
  agentId?: string;
  recording?: RecordingGovernance;
  requiresIdentityResolution: boolean;
  startedAtIso?: string;
  connectedAtIso?: string;
  endedAtIso?: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type CallCenterEventReceiptDto = {
  id: string;
  provider: string;
  providerEventId: string;
  externalCallId: string;
  eventType: CallCenterEventType;
  processStatus: "RECEIVED" | "PROCESSED" | "FAILED";
  duplicate: boolean;
  session: CallCenterSessionDto;
  receivedAtIso: string;
  processedAtIso?: string;
  failureCode?: string;
};

export type CallCenterAdapterCommand = {
  action: CallCenterCommand["action"];
  session: CallCenterSessionDto;
  actorId: string;
  actorRole: string;
};

export type CallCenterAdapterResult = {
  accepted: boolean;
  providerCommandId: string;
  status: CallCenterSessionStatus;
  occurredAtIso: string;
  failureCode?: string;
};

export interface CallCenterAdapter {
  readonly key: string;
  readonly displayName: string;
  execute(command: CallCenterAdapterCommand): Promise<CallCenterAdapterResult>;
  health(): Promise<{ ok: boolean; detail: string }>;
}
