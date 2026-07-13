import { z } from "zod";

export const QueueStatusSchema = z.enum(["INCOMING", "IN_PROCESS", "INFO_REQUIRED", "COMPLETED"]);
export type QueueStatus = z.infer<typeof QueueStatusSchema>;

export const QueueClinicalStageSchema = z.enum(["INTAKE", "IDENTITY", "VITALS", "PROTOCOL", "DISPOSITION", "SBAR"]);
export type QueueClinicalStage = z.infer<typeof QueueClinicalStageSchema>;

export const QueueSeveritySchema = z.enum(["EMERGENCY", "URGENT", "ROUTINE", "SELF_CARE"]);
export type QueueSeverity = z.infer<typeof QueueSeveritySchema>;

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
  safety_floor_status: z.string().optional()
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
  safetyFloorActive: z.boolean().default(false),
  slaMinutes: z.number().int().min(1).max(720).default(15)
});
export type QueueCreateRequest = z.infer<typeof QueueCreateRequestSchema>;

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
  vitals: QueueVitalsSchema.optional(),
  matchedProtocolId: z.string().min(1).max(120).optional(),
  calculatedSeverity: QueueSeveritySchema.optional(),
  dispositionCode: z.string().min(2).max(120).optional(),
  destinationName: z.string().min(2).max(200).optional(),
  clinicalApproval: z.record(z.unknown()).optional(),
  sbarCopied: z.boolean().optional(),
  summary: z.string().min(1).max(500).optional(),
  assignedNurseId: z.string().min(1).max(120).optional()
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
  vitals?: QueueVitals;
  matchedProtocolId?: string;
  calculatedSeverity?: QueueSeverity;
  dispositionCode?: string;
  destinationName?: string;
  identityValidated: boolean;
  safetyFloorActive: boolean;
  clinicalApproval?: Record<string, unknown>;
  sbarCopied: boolean;
  assignedNurseId?: string;
  claimedAtIso?: string;
  slaDeadlineIso: string;
  lockedBy?: string;
  lockExpiresAtIso?: string;
  customAviationTags: string[];
  createdAtIso: string;
  updatedAtIso: string;
  transitionLogs?: QueueTransitionLogDto[];
};
