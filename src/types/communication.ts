import { z } from "zod";
import { CcpChannelSchema } from "./ccp.js";

export const CcpOutboundChannelSchema = z.enum(["sms", "whatsapp", "email"]);
export type CcpOutboundChannel = z.infer<typeof CcpOutboundChannelSchema>;

export const CcpMessageDraftRequestSchema = z.object({
  istStaffId: z.string().min(3).max(64),
  threadId: z.string().min(6).max(140),
  channel: CcpOutboundChannelSchema,
  to: z.string().min(3).max(320),
  subject: z.string().min(1).max(180).optional(),
  body: z.string().min(1).max(1600),
  linkedGoalId: z.string().min(3).max(140).optional(),
  draftedByRole: z.string().min(2).max(120).default("Remote Triage Nurse")
});
export type CcpMessageDraftRequest = z.infer<typeof CcpMessageDraftRequestSchema>;

export const CcpMessageApproveRequestSchema = z.object({
  reviewerId: z.string().min(2).max(120),
  reviewerRole: z.string().min(2).max(120),
  note: z.string().max(500).optional()
});
export type CcpMessageApproveRequest = z.infer<typeof CcpMessageApproveRequestSchema>;

export type CcpDraftStatus =
  | "pending-nurse-review"
  | "approved"
  | "sent"
  | "dry-run"
  | "blocked"
  | "failed";

export type CcpSendResult = {
  ok: boolean;
  provider: string;
  channel: CcpOutboundChannel;
  externalId?: string;
  dryRun: boolean;
  message: string;
  error?: string;
};

export type CcpOutboundDraft = {
  id: string;
  istStaffId: string;
  threadId: string;
  linkedGoalId?: string;
  channel: CcpOutboundChannel;
  to: string;
  originalTo: string;
  subject: string;
  body: string;
  status: CcpDraftStatus;
  createdAtIso: string;
  updatedAtIso: string;
  draftedByRole: string;
  approval: {
    requiredRole: "Remote Triage Nurse";
    status: "pending-nurse-review" | "approved" | "rejected";
    approvedByRole?: string;
    approvedById?: string;
    approvedAtIso?: string;
    note: string;
  };
  sendResult?: CcpSendResult;
};

export type MessagingSendInput = {
  channel: "sms" | "whatsapp";
  to: string;
  body: string;
  mediaUrl?: string;
};

export type EmailSendInput = {
  to: string;
  subject: string;
  body: string;
  from?: string;
};

export type MessageAttachment = {
  url: string;
  contentType?: string;
  index: number;
};

export type InboundChannel = z.infer<typeof CcpChannelSchema>;

export type InboundMessage = {
  id: string;
  provider: string;
  providerMessageId?: string;
  channel: InboundChannel;
  from: string;
  to: string;
  body: string;
  receivedAtIso: string;
  attachments: MessageAttachment[];
  raw: Record<string, string>;
};

export type InboundWebhookRecord = {
  id: string;
  status: "persisted";
  persistedAtIso: string;
  inbound: InboundMessage;
  queueNote: string;
};

export type TransportAdapterStatus = {
  mode: "dry-run" | "live";
  provider: string;
  configured: boolean;
  live: boolean;
  notes: string[];
};

export type CcpCommunicationStatus = {
  mode: "dry-run" | "live";
  outboundGate: string;
  inboundGate: string;
  messaging: TransportAdapterStatus & {
    channels: Array<"sms" | "whatsapp">;
    inboundWebhookPath: string;
  };
  email: TransportAdapterStatus & {
    channel: "email";
  };
  safety: string[];
};
