import { randomUUID } from "node:crypto";
import { getEmployeeCcpSummary } from "./ccp.js";
import {
  emailAdapterStatus,
  getEmailAdapter,
  getMessagingAdapter,
  messagingAdapterStatus
} from "./communicationAdapters.js";
import type {
  CcpCommunicationStatus,
  CcpMessageApproveRequest,
  CcpMessageDraftRequest,
  CcpOutboundDraft,
  CcpSendResult,
  InboundWebhookRecord
} from "../types/communication.js";
import {
  getPersistedCcpOutboundDraft,
  listPersistedCcpOutboundDrafts,
  listPersistedInboundWebhookRecords,
  persistCcpOutboundDraft,
  persistInboundWebhookRecord
} from "./persistence.js";
import { assertHumanApprovalForExport } from "./safetyKernel.js";

export class CcpCommunicationError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400
  ) {
    super(message);
  }
}

const outboundDrafts = new Map<string, CcpOutboundDraft>();
const inboundRecords: InboundWebhookRecord[] = [];

function nowIso() {
  return new Date().toISOString();
}

function activeChannelStatus(summary: Awaited<ReturnType<typeof getEmployeeCcpSummary>>, channel: string) {
  return summary?.consent.channels.find((candidate) => candidate.channel === channel)?.status;
}

function applyTestRedirect(draft: CcpOutboundDraft): CcpOutboundDraft {
  const redirect =
    draft.channel === "email"
      ? process.env.CCP_TEST_REDIRECT_EMAIL ?? process.env.CCP_TEST_REDIRECT_TO
      : process.env.CCP_TEST_REDIRECT_PHONE ?? process.env.CCP_TEST_REDIRECT_TO;

  if (!redirect || process.env.CCP_TRANSPORT_MODE === "live") {
    return draft;
  }

  return {
    ...draft,
    to: redirect
  };
}

function requireRemoteTriageNurseApproval(draft: CcpOutboundDraft, approval: CcpMessageApproveRequest) {
  if (approval.reviewerRole !== "Remote Triage Nurse") {
    throw new CcpCommunicationError(
      "Only the Remote Triage Nurse role can approve an employee-facing CCP outbound message.",
      403
    );
  }

  return {
    ...draft,
    status: "approved" as const,
    approval: {
      ...draft.approval,
      status: "approved" as const,
      approvedByRole: approval.reviewerRole,
      approvedById: approval.reviewerId,
      approvedAtIso: nowIso(),
      note: approval.note ?? "Remote Triage Nurse reviewed and approved the outbound CCP message."
    },
    updatedAtIso: nowIso()
  };
}

async function guardDraftPolicy(draft: CcpOutboundDraft) {
  const summary = await getEmployeeCcpSummary(draft.istStaffId);
  if (!summary) {
    throw new CcpCommunicationError("Employee CCP thread was not found.", 404);
  }

  const allThreads = [summary.currentThread, ...summary.linkedPreviousThreads];
  if (!allThreads.some((thread) => thread.id === draft.threadId)) {
    throw new CcpCommunicationError("Draft is linked to an unknown CCP thread.", 404);
  }

  if (summary.consent.status === "needs-review") {
    throw new CcpCommunicationError("Employee consent requires review before outbound CCP communication.", 409);
  }

  const channelStatus = activeChannelStatus(summary, draft.channel);
  if (!channelStatus || channelStatus === "disabled") {
    throw new CcpCommunicationError(`The ${draft.channel} channel is not enabled for this employee.`, 409);
  }

  if (draft.approval.status !== "approved") {
    throw new CcpCommunicationError("CCP outbound message is pending Remote Triage Nurse approval.", 409);
  }
}

async function sendApprovedDraft(draft: CcpOutboundDraft, clinicalEncounterId?: string): Promise<CcpOutboundDraft> {
  await guardDraftPolicy(draft);
  await assertHumanApprovalForExport(clinicalEncounterId, "CCP_SEND");

  const dispatchDraft = applyTestRedirect(draft);
  let sendResult: CcpSendResult;

  if (dispatchDraft.channel === "email") {
    sendResult = await getEmailAdapter().send({
      to: dispatchDraft.to,
      subject: dispatchDraft.subject,
      body: dispatchDraft.body
    });
  } else {
    sendResult = await getMessagingAdapter().send({
      channel: dispatchDraft.channel,
      to: dispatchDraft.to,
      body: dispatchDraft.body
    });
  }

  const updated: CcpOutboundDraft = {
    ...dispatchDraft,
    status: sendResult.ok ? (sendResult.dryRun ? "dry-run" : "sent") : "failed",
    updatedAtIso: nowIso(),
    sendResult
  };

  await storeDraft(updated);
  return updated;
}

async function storeDraft(draft: CcpOutboundDraft): Promise<void> {
  outboundDrafts.set(draft.id, draft);
  await persistCcpOutboundDraft(draft);
}

async function findDraft(draftId: string): Promise<CcpOutboundDraft | undefined> {
  return (await getPersistedCcpOutboundDraft(draftId)) ?? outboundDrafts.get(draftId);
}

export async function createCcpOutboundDraft(request: CcpMessageDraftRequest): Promise<CcpOutboundDraft> {
  const summary = await getEmployeeCcpSummary(request.istStaffId);
  if (!summary) {
    throw new CcpCommunicationError("Employee CCP thread was not found.", 404);
  }

  const allThreads = [summary.currentThread, ...summary.linkedPreviousThreads];
  if (!allThreads.some((thread) => thread.id === request.threadId)) {
    throw new CcpCommunicationError("Cannot create a CCP draft for an unknown employee thread.", 404);
  }

  const channelStatus = activeChannelStatus(summary, request.channel);
  if (!channelStatus || channelStatus === "disabled") {
    throw new CcpCommunicationError(`The ${request.channel} channel is not enabled for this employee.`, 409);
  }

  const createdAtIso = nowIso();
  const draft: CcpOutboundDraft = {
    id: `ccp-draft-${randomUUID()}`,
    istStaffId: request.istStaffId,
    threadId: request.threadId,
    linkedGoalId: request.linkedGoalId,
    channel: request.channel,
    to: request.to,
    originalTo: request.to,
    subject: request.subject ?? "IST Tech tele-triage follow-up",
    body: request.body,
    status: "pending-nurse-review",
    createdAtIso,
    updatedAtIso: createdAtIso,
    draftedByRole: request.draftedByRole,
    approval: {
      requiredRole: "Remote Triage Nurse",
      status: "pending-nurse-review",
      note: "Outbound employee communication is queued. It cannot send until Remote Triage Nurse approval is recorded."
    }
  };

  await storeDraft(draft);
  return draft;
}

export async function approveAndSendCcpDraft(
  draftId: string,
  approval: CcpMessageApproveRequest
): Promise<CcpOutboundDraft> {
  const draft = await findDraft(draftId);
  if (!draft) {
    throw new CcpCommunicationError("CCP outbound draft was not found.", 404);
  }

  const approvedDraft = requireRemoteTriageNurseApproval(draft, approval);
  await storeDraft(approvedDraft);
  return sendApprovedDraft(approvedDraft, approval.encounterId);
}

export async function listCcpOutboundDrafts(): Promise<CcpOutboundDraft[]> {
  const persistedDrafts = await listPersistedCcpOutboundDrafts();
  if (persistedDrafts.length > 0) {
    return persistedDrafts;
  }
  return Array.from(outboundDrafts.values()).sort((left, right) =>
    right.createdAtIso.localeCompare(left.createdAtIso)
  );
}

export function getCcpCommunicationStatus(): CcpCommunicationStatus {
  const messaging = messagingAdapterStatus();
  const email = emailAdapterStatus();

  return {
    mode: process.env.CCP_TRANSPORT_MODE === "live" ? "live" : "dry-run",
    outboundGate:
      "Draft -> Remote Triage Nurse review -> consent/channel guard -> optional test redirect -> provider adapter.",
    inboundGate:
      "Verify provider signature -> parse text/media -> persist inbound record -> acknowledge provider quickly.",
    messaging: {
      ...messaging,
      channels: ["sms", "whatsapp"],
      inboundWebhookPath: "/api/v1/ccp/webhooks/twilio"
    },
    email: {
      ...email,
      channel: "email"
    },
    safety: [
      "Default CCP_TRANSPORT_MODE is dry-run; no live WhatsApp, SMS, or email sends happen until live mode is explicitly configured.",
      "Every employee-facing outbound message must have Remote Triage Nurse approval before dispatch.",
      "The guard checks active consent and channel eligibility before invoking any adapter.",
      "Production credentials should live in Secret Manager, and Graph app-only Mail.Send should be mailbox-scoped with an Application Access Policy."
    ]
  };
}

export async function recordTwilioInboundWebhook(
  params: Record<string, string>,
  signature: string | undefined,
  publicUrl: string
): Promise<InboundWebhookRecord | null> {
  const adapter = getMessagingAdapter();
  if (!adapter.verifyInbound(signature, publicUrl, params)) {
    throw new CcpCommunicationError("Twilio webhook signature validation failed.", 403);
  }

  const inbound = adapter.parseInbound(params);
  if (!inbound) {
    return null;
  }

  const record: InboundWebhookRecord = {
    id: `ccp-inbound-${randomUUID()}`,
    status: "persisted",
    persistedAtIso: nowIso(),
    inbound,
    queueNote:
      "Persisted before acknowledgement. Production should enqueue this record for the CCP turn processor with lease/backoff/DLQ."
  };

  inboundRecords.unshift(record);
  await persistInboundWebhookRecord(record);
  return record;
}

export async function listInboundWebhookRecords(): Promise<InboundWebhookRecord[]> {
  const persistedRecords = await listPersistedInboundWebhookRecords();
  if (persistedRecords.length > 0) {
    return persistedRecords;
  }
  return inboundRecords;
}
