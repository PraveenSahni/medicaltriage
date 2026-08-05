import { createHash } from "node:crypto";
import type {
  AcuityDispositionCode,
  Prisma,
  TriageSeverity
} from "@prisma/client";
import {
  shouldPersistAuditEventsInDatabase,
  shouldPersistMfaCredentialsInDatabase,
  shouldPersistRevealAnomalyCountersInDatabase,
  shouldPersistRevealWorkflowInDatabase,
  shouldPersistRolePermissionOverridesInDatabase,
  shouldPersistSessionsInDatabase,
  shouldUseDatabasePersistence
} from "../config/runtime.js";
import { prisma } from "../db.js";
import { decryptMfaSecret } from "./mfaCrypto.js";
import type { SafetyAuditDraft } from "../services/auditLog.js";
import type {
  AviationEvaluation,
  ClipboardPayload,
  DispositionDecision,
  Severity,
  TriageCompleteRequest,
  TriageEvaluationRequest
} from "../types/triage.js";
import { DispositionCodeSchema } from "../types/triage.js";
import type { AuditEvent, AuthenticatedSession } from "../types/security.js";
import type {
  CcpOutboundDraft,
  CcpSendResult,
  InboundWebhookRecord
} from "../types/communication.js";

export type PersistenceResult =
  | { persisted: true; recordId: string }
  | { persisted: false; reason: "mock-mode" | "missing-staff-id" | "invalid-disposition-code" };

function sessionHash(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

function severityToPrisma(severity: Severity): TriageSeverity {
  const map: Record<Severity, TriageSeverity> = {
    Emergency: "EMERGENCY",
    Urgent: "URGENT",
    Routine: "ROUTINE",
    "Self-care": "SELF_CARE"
  };
  return map[severity];
}

function initialScoreForSeverity(severity: Severity): number {
  const map: Record<Severity, number> = {
    Emergency: 10,
    Urgent: 6,
    Routine: 2,
    "Self-care": 0
  };
  return map[severity];
}

function jsonValue(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAuthenticatedSession(value: unknown): value is AuthenticatedSession {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Partial<AuthenticatedSession>;
  return (
    typeof candidate.sessionId === "string" &&
    typeof candidate.activeRole === "string" &&
    typeof candidate.expiresAtIso === "string" &&
    typeof candidate.user === "object" &&
    Boolean(candidate.user) &&
    isStringArray(candidate.permissions) &&
    isStringArray(candidate.responsibilities)
  );
}

function draftFromRow(row: Awaited<ReturnType<typeof prisma.ccpDraft.findUnique>>): CcpOutboundDraft | undefined {
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    istStaffId: row.istStaffId,
    threadId: row.threadId,
    linkedGoalId: row.linkedGoalId ?? undefined,
    channel: row.channel as CcpOutboundDraft["channel"],
    to: row.recipientTo,
    originalTo: row.originalTo,
    subject: row.subject,
    body: row.body,
    status: row.status as CcpOutboundDraft["status"],
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
    draftedByRole: row.draftedByRole,
    approval: row.approval as CcpOutboundDraft["approval"],
    sendResult: row.sendResult ? (row.sendResult as CcpSendResult) : undefined
  };
}

function inboundRecordFromRow(
  row: Awaited<ReturnType<typeof prisma.ccpWebhookRecord.findUnique>>
): InboundWebhookRecord | undefined {
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    status: "persisted",
    persistedAtIso: row.persistedAt.toISOString(),
    inbound: {
      id: row.inboundId,
      provider: row.provider,
      providerMessageId: row.providerMessageId ?? undefined,
      channel: row.channel as InboundWebhookRecord["inbound"]["channel"],
      from: row.sender,
      to: row.recipient,
      body: row.body,
      receivedAtIso: row.persistedAt.toISOString(),
      attachments: row.attachments as InboundWebhookRecord["inbound"]["attachments"],
      raw: row.rawPayload as Record<string, string>
    },
    queueNote: row.queueNote
  };
}

export async function persistSecurityAuditEvent(event: AuditEvent): Promise<PersistenceResult> {
  if (!shouldPersistAuditEventsInDatabase()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const created = await prisma.auditEvent.create({
    data: {
      timestamp: new Date(event.timestampIso),
      userId: event.userId,
      activeRole: event.activeRole,
      organization: event.organization,
      facility: event.facility,
      department: event.department,
      action: event.action,
      module: event.module,
      resource: event.resource,
      purpose: event.purpose,
      ipAddress: event.ipAddress,
      device: event.device,
      success: event.success,
      riskLevel: event.risk
    }
  });

  return { persisted: true, recordId: created.id };
}

export type MfaCredentialSnapshot = {
  userId: string;
  secretCiphertext: string;
  status: "pending" | "enabled" | "disabled";
  enrolledAt?: string;
};

export async function persistMfaCredential(snapshot: MfaCredentialSnapshot): Promise<PersistenceResult> {
  if (!shouldPersistMfaCredentialsInDatabase()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const upserted = await prisma.userMfaCredential.upsert({
    where: { userId: snapshot.userId },
    create: {
      userId: snapshot.userId,
      secretCiphertext: snapshot.secretCiphertext,
      status: snapshot.status,
      enrolledAt: snapshot.enrolledAt ? new Date(snapshot.enrolledAt) : undefined
    },
    update: {
      secretCiphertext: snapshot.secretCiphertext,
      status: snapshot.status,
      enrolledAt: snapshot.enrolledAt ? new Date(snapshot.enrolledAt) : undefined
    }
  });

  return { persisted: true, recordId: upserted.id };
}

export type PersistedMfaCredential = {
  secret: string;
  status: "pending" | "enabled" | "disabled";
  enrolledAt?: string;
};

// Read-path counterpart to persistMfaCredential() - without this, MFA
// enrollment only ever lived in the handling instance's in-memory
// mfaCredentials Map, invisible to every other Cloud Run instance/revision
// (the same cross-instance class of bug already found and fixed for
// sessions via getPersistedUserSession() - found here during AR.13's
// production-activation validation, when an admin enrolled against one
// canary revision and was told to re-enroll on another).
export async function getPersistedMfaCredential(userId: string): Promise<PersistedMfaCredential | undefined> {
  if (!shouldPersistMfaCredentialsInDatabase()) {
    return undefined;
  }
  try {
    const row = await prisma.userMfaCredential.findUnique({ where: { userId } });
    if (!row) {
      return undefined;
    }
    return {
      secret: decryptMfaSecret(row.secretCiphertext),
      status: row.status as "pending" | "enabled" | "disabled",
      enrolledAt: row.enrolledAt ? row.enrolledAt.toISOString() : undefined
    };
  } catch (error) {
    console.error("Failed to read persisted MFA credential:", error);
    return undefined;
  }
}

// Closes R-04 - real, previously-orphaned RevealRequest/RevealApproval/
// RevealEvent tables now genuinely record the two-step approval-gated
// reveal workflow in src/services/revealWorkflow.ts.
export type RevealRequestSnapshot = {
  id: string;
  requesterUserId: string;
  resourceType: string;
  resourceId: string;
  fieldName: string;
  purpose: string;
  status: string;
  expiresAt?: string;
};

export async function persistRevealRequest(snapshot: RevealRequestSnapshot): Promise<PersistenceResult> {
  if (!shouldPersistRevealWorkflowInDatabase()) {
    return { persisted: false, reason: "mock-mode" };
  }
  const upserted = await prisma.revealRequest.upsert({
    where: { id: snapshot.id },
    create: {
      id: snapshot.id,
      requesterUserId: snapshot.requesterUserId,
      resourceType: snapshot.resourceType,
      resourceId: snapshot.resourceId,
      fieldName: snapshot.fieldName,
      purpose: snapshot.purpose,
      status: snapshot.status,
      expiresAt: snapshot.expiresAt ? new Date(snapshot.expiresAt) : undefined
    },
    update: {
      status: snapshot.status,
      expiresAt: snapshot.expiresAt ? new Date(snapshot.expiresAt) : undefined
    }
  });
  return { persisted: true, recordId: upserted.id };
}

export type RevealApprovalSnapshot = {
  revealRequestId: string;
  approverUserId: string;
  decision: string;
  comments?: string;
};

export async function persistRevealApproval(snapshot: RevealApprovalSnapshot): Promise<PersistenceResult> {
  if (!shouldPersistRevealWorkflowInDatabase()) {
    return { persisted: false, reason: "mock-mode" };
  }
  const created = await prisma.revealApproval.create({
    data: {
      revealRequestId: snapshot.revealRequestId,
      approverUserId: snapshot.approverUserId,
      decision: snapshot.decision,
      comments: snapshot.comments
    }
  });
  return { persisted: true, recordId: created.id };
}

export type RevealEventSnapshot = {
  revealRequestId?: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  fieldName: string;
  purpose: string;
  success: boolean;
  ipAddress?: string;
  device?: string;
};

export async function persistRevealEvent(snapshot: RevealEventSnapshot): Promise<PersistenceResult> {
  if (!shouldPersistRevealWorkflowInDatabase()) {
    return { persisted: false, reason: "mock-mode" };
  }
  const created = await prisma.revealEvent.create({
    data: {
      revealRequestId: snapshot.revealRequestId,
      userId: snapshot.userId,
      resourceType: snapshot.resourceType,
      resourceId: snapshot.resourceId,
      fieldName: snapshot.fieldName,
      purpose: snapshot.purpose,
      success: snapshot.success,
      ipAddress: snapshot.ipAddress,
      device: snapshot.device
    }
  });
  return { persisted: true, recordId: created.id };
}

export type PersistedRevealRequest = {
  id: string;
  requesterUserId: string;
  resourceType: string;
  resourceId: string;
  fieldName: string;
  purpose: string;
  status: string;
  expiresAt?: string;
};

// Read-path counterpart to persistRevealRequest() - without this, a reveal
// request created on one Cloud Run instance was invisible to an approver's
// request landing on a different instance, since the workflow is inherently
// two separate HTTP requests. Found during the persistence-gating sweep.
export async function getPersistedRevealRequest(revealRequestId: string): Promise<PersistedRevealRequest | undefined> {
  if (!shouldPersistRevealWorkflowInDatabase()) {
    return undefined;
  }
  const row = await prisma.revealRequest.findUnique({ where: { id: revealRequestId } });
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    requesterUserId: row.requesterUserId,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    fieldName: row.fieldName,
    purpose: row.purpose,
    status: row.status,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : undefined
  };
}

// Closes IS.61's multi-instance requirement (found during the persistence-
// gating sweep: the in-memory reveal-anomaly counter was process-local).
// Records one reveal-request attempt, opportunistically deletes this
// user's rows older than the window (bounding table growth under normal
// load - a real cleanup-on-write strategy, not a scheduled job), then
// returns the real count of this user's attempts still within the window
// - all in one transaction, so concurrent requests from different
// instances see a consistent, atomic result rather than a race.
export async function recordAndCountRevealAnomalyEvents(args: {
  userId: string;
  organization?: string;
  windowSeconds: number;
}): Promise<{ count: number; persisted: boolean }> {
  if (!shouldPersistRevealAnomalyCountersInDatabase()) {
    return { count: 0, persisted: false };
  }
  const windowStart = new Date(Date.now() - args.windowSeconds * 1000);
  const [, , countResult] = await prisma.$transaction([
    prisma.revealAnomalyEvent.create({
      data: { userId: args.userId, organization: args.organization }
    }),
    prisma.revealAnomalyEvent.deleteMany({
      where: { userId: args.userId, timestamp: { lt: windowStart } }
    }),
    prisma.revealAnomalyEvent.count({
      where: { userId: args.userId, timestamp: { gte: windowStart } }
    })
  ]);
  return { count: countResult, persisted: true };
}

// Reads the real, previously-orphaned AuthenticationProvider row for a real
// OIDC login/callback flow (closes the "OAuth Provider Integration" gap) -
// null in mock mode or when no row exists, so callers fall back to the
// static/disabled in-memory ssoProviders entries.
export async function getAuthenticationProviderConfig(providerKey: string) {
  if (!shouldUseDatabasePersistence()) {
    return null;
  }
  return prisma.authenticationProvider.findUnique({ where: { providerKey } });
}

export type RolePermissionOverride = {
  roleCode: string;
  permissionCode: string;
  action: "GRANT" | "REVOKE";
  grantedBy: string;
  reason: string;
};

export type PersistedRolePermissionOverride = {
  roleCode: string;
  permissionCode: string;
  action: "GRANT" | "REVOKE";
  createdAt: string;
};

// Read-path counterpart to persistRolePermissionOverride() - without this,
// a grant/revoke recorded by one Cloud Run instance was never even best-
// effort visible to another, a genuine authorization-bypass risk (a role's
// effective permissions would differ depending on which instance handled a
// given login). Found during the persistence-gating sweep.
export async function getPersistedRolePermissionOverrides(roleCode: string): Promise<PersistedRolePermissionOverride[]> {
  if (!shouldPersistRolePermissionOverridesInDatabase()) {
    return [];
  }
  const rows = await prisma.rolePermission.findMany({
    where: { roleCode, status: "active" },
    orderBy: { createdAt: "asc" }
  });
  return rows.map((row) => ({
    roleCode: row.roleCode,
    permissionCode: row.permissionCode,
    action: row.action as "GRANT" | "REVOKE",
    createdAt: row.createdAt.toISOString()
  }));
}

export async function persistRolePermissionOverride(override: RolePermissionOverride): Promise<PersistenceResult> {
  if (!shouldPersistRolePermissionOverridesInDatabase()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const created = await prisma.rolePermission.create({
    data: {
      roleCode: override.roleCode,
      permissionCode: override.permissionCode,
      action: override.action,
      grantedBy: override.grantedBy,
      reason: override.reason
    }
  });

  return { persisted: true, recordId: created.id };
}

const VALID_RISK_CLASSIFICATIONS = new Set(["low", "medium", "high", "critical"]);

function toRiskClassification(riskLevel: string | null): AuditEvent["risk"] {
  return (VALID_RISK_CLASSIFICATIONS.has(riskLevel ?? "") ? riskLevel : "low") as AuditEvent["risk"];
}

/**
 * Reads real, persisted AuditEvent rows - the actual production audit
 * trail written by persistSecurityAuditEvent() above, plus the operational
 * jobs (purgeExpiredQueueData.ts, fulfillPrivacyRequests.ts,
 * accessEntitlementReview.mjs) that write directly via Prisma. Previously
 * GET /api/v1/admin/audit-events only ever returned securityAdmin.ts's
 * static 2-row in-memory mock array, even in database-persistence mode -
 * meaning none of these real entries were ever visible through the admin
 * API. Falls back to an empty array (not the mock) when DB persistence is
 * off, since there is no real data to show in that mode.
 */
export async function listPersistedAuditEvents(
  limit = 200,
  filter?: { userId?: string; organization?: string; action?: string; since?: string; until?: string }
): Promise<AuditEvent[]> {
  if (!shouldPersistAuditEventsInDatabase()) {
    return [];
  }

  const rows = await prisma.auditEvent.findMany({
    where: {
      ...(filter?.userId ? { userId: filter.userId } : {}),
      ...(filter?.organization ? { organization: filter.organization } : {}),
      ...(filter?.action ? { action: filter.action } : {}),
      ...(filter?.since || filter?.until
        ? {
            timestamp: {
              ...(filter?.since ? { gte: new Date(filter.since) } : {}),
              ...(filter?.until ? { lte: new Date(filter.until) } : {})
            }
          }
        : {})
    },
    orderBy: { timestamp: "desc" },
    take: limit
  });

  return rows.map((row) => ({
    id: row.id,
    timestampIso: row.timestamp.toISOString(),
    userId: row.userId ?? "",
    activeRole: row.activeRole ?? "",
    organization: row.organization ?? "",
    facility: row.facility ?? "",
    department: row.department ?? "",
    action: row.action,
    module: row.module,
    resource: row.resource ?? "",
    purpose: row.purpose ?? undefined,
    ipAddress: row.ipAddress ?? "",
    device: row.device ?? "",
    success: row.success,
    risk: toRiskClassification(row.riskLevel)
  }));
}

export async function persistUserSession(args: {
  session: AuthenticatedSession;
  ipAddress: string;
  device: string;
}): Promise<PersistenceResult> {
  if (!shouldPersistSessionsInDatabase()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const created = await prisma.userSession.create({
    data: {
      userId: args.session.user.id,
      sessionHash: sessionHash(args.session.sessionId),
      sessionPayload: jsonValue(args.session),
      authMethod: args.session.authMethod,
      mfaVerified: args.session.mfaVerified,
      ipAddress: args.ipAddress,
      device: args.device,
      userAgent: args.device,
      expiresAt: new Date(args.session.expiresAtIso)
    }
  });

  return { persisted: true, recordId: created.id };
}

export async function getPersistedUserSession(sessionId?: string): Promise<AuthenticatedSession | undefined> {
  if (!sessionId || !shouldPersistSessionsInDatabase()) {
    return undefined;
  }

  const row = await prisma.userSession.findUnique({
    where: {
      sessionHash: sessionHash(sessionId)
    }
  });
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
    return undefined;
  }

  const sessionPayload = row.sessionPayload as unknown;
  if (!isAuthenticatedSession(sessionPayload) || sessionPayload.sessionId !== sessionId) {
    return undefined;
  }

  return sessionPayload;
}

export async function revokePersistedSession(sessionId?: string): Promise<void> {
  if (!sessionId || !shouldPersistSessionsInDatabase()) {
    return;
  }

  await prisma.userSession.updateMany({
    where: {
      sessionHash: sessionHash(sessionId),
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function revokePersistedSessionsForUser(userId: string): Promise<void> {
  // Found in the persistence-gating sweep: this checked the generic
  // shouldUseDatabasePersistence() while session creation/lookup already
  // correctly used the dedicated shouldPersistSessionsInDatabase() -
  // meaning a suspended account's sessions were revoked in-memory but
  // silently NOT revoked in the database, even with SESSION_DB_PERSISTENCE
  // already on. Fixed to check the same flag as the rest of the session
  // persistence path.
  if (!shouldPersistSessionsInDatabase()) {
    return;
  }

  await prisma.userSession.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function persistCcpOutboundDraft(draft: CcpOutboundDraft, organizationId?: string): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const saved = await prisma.ccpDraft.upsert({
    where: {
      id: draft.id
    },
    create: {
      id: draft.id,
      organizationId,
      istStaffId: draft.istStaffId,
      threadId: draft.threadId,
      linkedGoalId: draft.linkedGoalId,
      channel: draft.channel,
      recipientTo: draft.to,
      originalTo: draft.originalTo,
      subject: draft.subject,
      body: draft.body,
      status: draft.status,
      draftedByRole: draft.draftedByRole,
      approval: jsonValue(draft.approval),
      sendResult: draft.sendResult ? jsonValue(draft.sendResult) : undefined,
      createdAt: new Date(draft.createdAtIso)
    },
    update: {
      linkedGoalId: draft.linkedGoalId,
      recipientTo: draft.to,
      originalTo: draft.originalTo,
      subject: draft.subject,
      body: draft.body,
      status: draft.status,
      draftedByRole: draft.draftedByRole,
      approval: jsonValue(draft.approval),
      sendResult: draft.sendResult ? jsonValue(draft.sendResult) : undefined
    }
  });

  return { persisted: true, recordId: saved.id };
}

export async function getPersistedCcpOutboundDraft(draftId: string): Promise<CcpOutboundDraft | undefined> {
  if (!shouldUseDatabasePersistence()) {
    return undefined;
  }

  const row = await prisma.ccpDraft.findUnique({
    where: {
      id: draftId
    }
  });
  return draftFromRow(row);
}

export async function listPersistedCcpOutboundDrafts(): Promise<CcpOutboundDraft[]> {
  if (!shouldUseDatabasePersistence()) {
    return [];
  }

  const rows = await prisma.ccpDraft.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 100
  });
  return rows
    .map((row) => draftFromRow(row))
    .filter((draft): draft is CcpOutboundDraft => Boolean(draft));
}

export async function persistInboundWebhookRecord(record: InboundWebhookRecord, organizationId?: string): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const saved = await prisma.ccpWebhookRecord.upsert({
    where: {
      id: record.id
    },
    create: {
      id: record.id,
      organizationId,
      inboundId: record.inbound.id,
      provider: record.inbound.provider,
      providerMessageId: record.inbound.providerMessageId,
      channel: record.inbound.channel,
      sender: record.inbound.from,
      recipient: record.inbound.to,
      body: record.inbound.body,
      status: record.status,
      attachments: jsonValue(record.inbound.attachments),
      rawPayload: jsonValue(record.inbound.raw),
      queueNote: record.queueNote,
      persistedAt: new Date(record.persistedAtIso)
    },
    update: {
      providerMessageId: record.inbound.providerMessageId,
      body: record.inbound.body,
      status: record.status,
      attachments: jsonValue(record.inbound.attachments),
      rawPayload: jsonValue(record.inbound.raw),
      queueNote: record.queueNote
    }
  });

  return { persisted: true, recordId: saved.id };
}

export async function listPersistedInboundWebhookRecords(): Promise<InboundWebhookRecord[]> {
  if (!shouldUseDatabasePersistence()) {
    return [];
  }

  const rows = await prisma.ccpWebhookRecord.findMany({
    orderBy: {
      persistedAt: "desc"
    },
    take: 100
  });
  return rows
    .map((row) => inboundRecordFromRow(row))
    .filter((record): record is InboundWebhookRecord => Boolean(record));
}

export async function persistEvaluatedEncounter(args: {
  request: TriageEvaluationRequest;
  decision: DispositionDecision;
  aviation: AviationEvaluation;
  clipboardPayload: ClipboardPayload;
  safetyAudit: SafetyAuditDraft;
  organizationId?: string;
}): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }

  const created = await prisma.aviationTriageEncounter.create({
    data: {
      organizationId: args.organizationId,
      staffMember: {
        connect: {
          istStaffId: args.request.istStaffId
        }
      },
      initialAcuityScore: initialScoreForSeverity(args.decision.severity),
      finalDispositionCode: args.decision.dispositionCode as AcuityDispositionCode,
      transcriptText: args.request.symptoms.narrative,
      transcriptLanguage: args.request.symptoms.language,
      customAviationTags: jsonValue(args.aviation.tags),
      clipboardPayload: jsonValue(args.clipboardPayload.structured),
      nurseId: args.request.nurseId,
      completedAt: new Date()
    }
  });

  if (args.safetyAudit.required) {
    const safetyLogData: Prisma.SafetyAuditDeviationLogCreateInput = {
      encounter: {
        connect: { id: created.id }
      },
      originalAiRecommendation: args.safetyAudit.originalAiRecommendation ?? "NONE",
      nurseOverrideRationale: args.safetyAudit.nurseOverrideRationale,
      rulesEngineSeverity: severityToPrisma(args.decision.severity),
      overrideStatusFlag: args.safetyAudit.overrideStatusFlag,
      isCriticalFloorBreach: args.safetyAudit.isCriticalFloorBreach,
      explainabilityTrace: jsonValue(args.safetyAudit.explainabilityTrace)
    };
    await prisma.safetyAuditDeviationLog.create({
      data: safetyLogData
    });
  }

  return { persisted: true, recordId: created.id };
}

export async function persistCompletedTriageNote(
  request: TriageCompleteRequest,
  notePayload: string,
  fitToFlyStatus: string,
  organizationId?: string
): Promise<PersistenceResult> {
  if (!shouldUseDatabasePersistence()) {
    return { persisted: false, reason: "mock-mode" };
  }
  if (!request.istStaffId) {
    return { persisted: false, reason: "missing-staff-id" };
  }

  const parsedDisposition = DispositionCodeSchema.safeParse(request.finalDispositionCode);
  if (!parsedDisposition.success) {
    return { persisted: false, reason: "invalid-disposition-code" };
  }

  // Real idempotency check: a queue item can only be completed once, so a
  // retried/duplicated request carrying the same queueItemId must return the
  // already-persisted encounter instead of creating a second row (previously
  // this endpoint had no dedup key at all - every call created a brand-new
  // aviationTriageEncounter regardless of whether it was a genuine retry).
  if (request.queueItemId) {
    const existing = await prisma.aviationTriageEncounter.findUnique({
      where: { sourceQueueItemId: request.queueItemId }
    });
    if (existing) {
      return { persisted: true, recordId: existing.id };
    }
  }

  const created = await prisma.aviationTriageEncounter.create({
    data: {
      organizationId,
      staffMember: {
        connect: {
          istStaffId: request.istStaffId
        }
      },
      initialAcuityScore: request.finalDispositionCode === "HMC_EMERGENCY_DEPARTMENT" ? 10 : 2,
      finalDispositionCode: parsedDisposition.data as AcuityDispositionCode,
      transcriptText: request.subjective,
      transcriptLanguage: "en",
      customAviationTags: jsonValue([...request.customAviationTags, `fit-to-fly-${fitToFlyStatus.toLowerCase()}`]),
      clipboardPayload: jsonValue({
        notePayload,
        routingDestination: request.routingDestination,
        safetyRationale: request.safetyRationale
      }),
      nurseId: request.nurseId ?? "unknown",
      completedAt: new Date(),
      sourceQueueItemId: request.queueItemId
    }
  });

  return { persisted: true, recordId: created.id };
}

// Closes IS.61's second half - durable, cross-instance-safe privacy-
// incident workflow state. Always persisted (no MOCK_MODE-style gate) -
// this is a brand-new feature with no prior in-memory-only behavior to
// preserve, so it is built durable from the start rather than repeating
// the exact anti-pattern this engagement spent several batches fixing.
export type PrivacyIncidentRecord = {
  id: string;
  organization?: string;
  detectionSource: string;
  detectedAt: string;
  severity: string;
  status: string;
  assignedOwnerUserId?: string;
  privacyImpactStatus?: string;
  affectedCustomerStatus?: string;
  notificationRequired?: boolean;
  decisionReason?: string;
  decisionByUserId?: string;
  decisionAt?: string;
  approverUserId?: string;
  approvalAt?: string;
  notificationDeadlineAt?: string;
  notificationSentAt?: string;
  deliveryStatus?: string;
  correlationId?: string;
};

function toPrivacyIncidentRecord(row: {
  id: string;
  organization: string | null;
  detectionSource: string;
  detectedAt: Date;
  severity: string;
  status: string;
  assignedOwnerUserId: string | null;
  privacyImpactStatus: string | null;
  affectedCustomerStatus: string | null;
  notificationRequired: boolean | null;
  decisionReason: string | null;
  decisionByUserId: string | null;
  decisionAt: Date | null;
  approverUserId: string | null;
  approvalAt: Date | null;
  notificationDeadlineAt: Date | null;
  notificationSentAt: Date | null;
  deliveryStatus: string | null;
  correlationId: string | null;
}): PrivacyIncidentRecord {
  return {
    id: row.id,
    organization: row.organization ?? undefined,
    detectionSource: row.detectionSource,
    detectedAt: row.detectedAt.toISOString(),
    severity: row.severity,
    status: row.status,
    assignedOwnerUserId: row.assignedOwnerUserId ?? undefined,
    privacyImpactStatus: row.privacyImpactStatus ?? undefined,
    affectedCustomerStatus: row.affectedCustomerStatus ?? undefined,
    notificationRequired: row.notificationRequired ?? undefined,
    decisionReason: row.decisionReason ?? undefined,
    decisionByUserId: row.decisionByUserId ?? undefined,
    decisionAt: row.decisionAt ? row.decisionAt.toISOString() : undefined,
    approverUserId: row.approverUserId ?? undefined,
    approvalAt: row.approvalAt ? row.approvalAt.toISOString() : undefined,
    notificationDeadlineAt: row.notificationDeadlineAt ? row.notificationDeadlineAt.toISOString() : undefined,
    notificationSentAt: row.notificationSentAt ? row.notificationSentAt.toISOString() : undefined,
    deliveryStatus: row.deliveryStatus ?? undefined,
    correlationId: row.correlationId ?? undefined
  };
}

export async function createPrivacyIncident(args: {
  organization?: string;
  detectionSource: string;
  severity?: string;
  correlationId?: string;
  evidenceReferences?: Record<string, unknown>;
}): Promise<PrivacyIncidentRecord> {
  const created = await prisma.privacyIncident.create({
    data: {
      organization: args.organization,
      detectionSource: args.detectionSource,
      severity: args.severity ?? "unclassified",
      status: "detected",
      correlationId: args.correlationId,
      evidenceReferences: args.evidenceReferences ? (args.evidenceReferences as Prisma.InputJsonValue) : undefined
    }
  });
  return toPrivacyIncidentRecord(created);
}

export async function getPrivacyIncident(id: string): Promise<PrivacyIncidentRecord | undefined> {
  const row = await prisma.privacyIncident.findUnique({ where: { id } });
  return row ? toPrivacyIncidentRecord(row) : undefined;
}

export async function updatePrivacyIncident(
  id: string,
  updates: Partial<Omit<PrivacyIncidentRecord, "id" | "detectionSource" | "detectedAt">>
): Promise<PrivacyIncidentRecord> {
  const updated = await prisma.privacyIncident.update({
    where: { id },
    data: {
      ...(updates.organization !== undefined ? { organization: updates.organization } : {}),
      ...(updates.severity !== undefined ? { severity: updates.severity } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.assignedOwnerUserId !== undefined ? { assignedOwnerUserId: updates.assignedOwnerUserId } : {}),
      ...(updates.privacyImpactStatus !== undefined ? { privacyImpactStatus: updates.privacyImpactStatus } : {}),
      ...(updates.affectedCustomerStatus !== undefined ? { affectedCustomerStatus: updates.affectedCustomerStatus } : {}),
      ...(updates.notificationRequired !== undefined ? { notificationRequired: updates.notificationRequired } : {}),
      ...(updates.decisionReason !== undefined ? { decisionReason: updates.decisionReason } : {}),
      ...(updates.decisionByUserId !== undefined ? { decisionByUserId: updates.decisionByUserId } : {}),
      ...(updates.decisionAt !== undefined ? { decisionAt: new Date(updates.decisionAt) } : {}),
      ...(updates.approverUserId !== undefined ? { approverUserId: updates.approverUserId } : {}),
      ...(updates.approvalAt !== undefined ? { approvalAt: new Date(updates.approvalAt) } : {}),
      ...(updates.notificationDeadlineAt !== undefined
        ? { notificationDeadlineAt: new Date(updates.notificationDeadlineAt) }
        : {}),
      ...(updates.notificationSentAt !== undefined ? { notificationSentAt: new Date(updates.notificationSentAt) } : {}),
      ...(updates.deliveryStatus !== undefined ? { deliveryStatus: updates.deliveryStatus } : {})
    }
  });
  return toPrivacyIncidentRecord(updated);
}

export async function listOverduePrivacyIncidents(now: Date = new Date()): Promise<PrivacyIncidentRecord[]> {
  const rows = await prisma.privacyIncident.findMany({
    where: {
      notificationDeadlineAt: { lt: now },
      status: { notIn: ["notification_sent", "closed", "notification_not_required"] }
    },
    orderBy: { notificationDeadlineAt: "asc" }
  });
  return rows.map(toPrivacyIncidentRecord);
}
