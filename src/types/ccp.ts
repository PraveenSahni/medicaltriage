import { z } from "zod";
import type { StaffProfile } from "./triage.js";

export const EmployeeCcpLookupSchema = z.object({
  istStaffId: z.string().min(3).max(64)
});
export type EmployeeCcpLookup = z.infer<typeof EmployeeCcpLookupSchema>;

export const CcpChannelSchema = z.enum(["call", "sms", "whatsapp", "email", "portal", "emr"]);
export type CcpChannel = z.infer<typeof CcpChannelSchema>;

export const CcpGoalStatusSchema = z.enum(["open", "waiting-human", "scheduled", "completed", "blocked"]);
export type CcpGoalStatus = z.infer<typeof CcpGoalStatusSchema>;

export const CcpCommunicationDirectionSchema = z.enum(["inbound", "outbound", "internal"]);
export type CcpCommunicationDirection = z.infer<typeof CcpCommunicationDirectionSchema>;

export const CcpCommunicationKindSchema = z.enum([
  "call",
  "sms",
  "whatsapp",
  "email",
  "portal-note",
  "emr-note",
  "task"
]);
export type CcpCommunicationKind = z.infer<typeof CcpCommunicationKindSchema>;

export type CcpSubject = {
  staff: StaffProfile;
  displayName: string;
  primaryContext: string;
  dependentSummary: string;
  communicationScope: string;
};

export type CcpConsentState = {
  status: "active" | "limited" | "needs-review";
  lastVerifiedIso: string;
  lawfulBasis: string;
  consentNote: string;
  channels: Array<{
    channel: CcpChannel;
    label: string;
    status: "enabled" | "limited" | "disabled";
    purpose: string;
    policy: string;
  }>;
};

export type CcpGoal = {
  id: string;
  threadId: string;
  title: string;
  status: CcpGoalStatus;
  ownerRole: string;
  priority: "high" | "medium" | "normal";
  dueIso: string;
  description: string;
  settlePoint: string;
  nextAction: string;
};

export type CcpCommunicationRecord = {
  id: string;
  threadId: string;
  occurredAtIso: string;
  direction: CcpCommunicationDirection;
  kind: CcpCommunicationKind;
  channel: CcpChannel;
  actor: string;
  subject: string;
  summary: string;
  linkedGoalId?: string;
  auditTags: string[];
  approval?: {
    status: "not-required" | "pending-nurse-review" | "approved";
    requiredRole: string;
    approvedByRole?: string;
    approvedAtIso?: string;
    note: string;
  };
};

export type CcpVisitThread = {
  id: string;
  title: string;
  visitType: "call" | "clinic-visit" | "teleconsult" | "follow-up";
  status: "active" | "closed" | "follow-up-open";
  openedAtIso: string;
  closedAtIso?: string;
  reason: string;
  routeSummary: string;
  primaryOwnerRole: string;
  threadHref: string;
  lastCommunication: {
    occurredAtIso: string;
    channel: CcpChannel;
    actor: string;
    subject: string;
    summary: string;
  };
};

export type CcpControllerState = {
  controllerName: string;
  rules: string[];
  hardFloors: string[];
  humanGates: string[];
  auditMode: string;
};

export type EmployeeCcpSummary = {
  generatedAtIso: string;
  pipelineName: "CCP";
  pipelineMeaning: "Continuous Communication Pipeline";
  subject: CcpSubject;
  metrics: {
    activeChannels: number;
    openGoals: number;
    completedGoals: number;
    totalCommunications: number;
    totalThreads: number;
    linkedPreviousThreads: number;
    lastContactIso: string;
    nextAction: string;
  };
  currentThread: CcpVisitThread;
  linkedPreviousThreads: CcpVisitThread[];
  consent: CcpConsentState;
  goals: CcpGoal[];
  timeline: CcpCommunicationRecord[];
  controller: CcpControllerState;
};
