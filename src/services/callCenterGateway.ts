import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { isMockMode, shouldUseDatabasePersistence } from "../config/runtime.js";
import { prisma } from "../db.js";
import type { AuthenticatedSession } from "../types/security.js";
import type {
  CallCenterAdapter,
  CallCenterAdapterCommand,
  CallCenterAdapterResult,
  CallCenterCommand,
  CallCenterEvent,
  CallCenterEventReceiptDto,
  CallCenterEventType,
  CallCenterSessionDto,
  CallCenterSessionStatus,
  RecordingGovernance
} from "../types/callCenter.js";
import {
  claimQueueItem,
  createQueueItem,
  getQueueItem,
  releaseQueueItem
} from "./queueOrchestration.js";
import { auditSignatureFor } from "./safetyKernel.js";

export class CallCenterGatewayError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

type StoredEvent = Omit<CallCenterEventReceiptDto, "session"> & {
  sessionId: string;
  safePayload: Record<string, unknown>;
  auditSignature: string;
};

type DbSessionRow = {
  id: string;
  queueItemId: string | null;
  provider: string;
  externalCallId: string;
  direction: string;
  channel: string;
  status: string;
  aniMasked: string | null;
  aniHash: string | null;
  dnis: string | null;
  language: string;
  queueName: string | null;
  agentId: string | null;
  recordingGovernance: unknown;
  requiresIdentityResolution: boolean;
  startedAt: Date | null;
  connectedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type DbEventRow = {
  id: string;
  callCenterSessionId: string;
  provider: string;
  providerEventId: string;
  externalCallId: string;
  eventType: string;
  processStatus: string;
  safePayload: unknown;
  auditSignature: string;
  failureCode: string | null;
  occurredAt: Date;
  receivedAt: Date;
  processedAt: Date | null;
};

type CallCenterPrismaClient = {
  callCenterSession: {
    findMany(args: Record<string, unknown>): Promise<DbSessionRow[]>;
    findUnique(args: Record<string, unknown>): Promise<DbSessionRow | null>;
    create(args: Record<string, unknown>): Promise<DbSessionRow>;
    update(args: Record<string, unknown>): Promise<DbSessionRow>;
  };
  callCenterEvent: {
    findUnique(args: Record<string, unknown>): Promise<DbEventRow | null>;
    create(args: Record<string, unknown>): Promise<DbEventRow>;
    update(args: Record<string, unknown>): Promise<DbEventRow>;
  };
};

const globalForGateway = globalThis as unknown as {
  istCallCenterSessions?: Map<string, CallCenterSessionDto>;
  istCallCenterEvents?: Map<string, StoredEvent>;
  istCallCenterAdapters?: Map<string, CallCenterAdapter>;
};

function nowIso(): string {
  return new Date().toISOString();
}

function stableJson(value: unknown): string {
  if (value === undefined) {
    return "null";
  }
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .filter((key) => record[key] !== undefined)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
    .join(",")}}`;
}

function targetOrganizationForEvent(event: CallCenterEvent): string {
  const configured = event.organizationId ?? process.env.CALL_CENTER_DEFAULT_ORGANIZATION_ID?.trim();
  if (configured) {
    return configured;
  }
  if (isMockMode()) {
    return "org_ist_tech";
  }
  throw new CallCenterGatewayError(
    422,
    "Call-center event could not be mapped to a target clinical organization.",
    "CALL_CENTER_ORGANIZATION_UNRESOLVED"
  );
}

function gatewaySecret(): string {
  const configured = process.env.CALL_CENTER_GATEWAY_SECRET?.trim();
  if (configured) {
    return configured;
  }
  if (isMockMode()) {
    return "mock-call-center-gateway-secret";
  }
  throw new CallCenterGatewayError(
    503,
    "Call-center gateway signing secret is not configured.",
    "CALL_CENTER_SECRET_MISSING"
  );
}

export function callCenterSignatureFor(payload: unknown): string {
  return createHmac("sha256", gatewaySecret()).update(stableJson(payload)).digest("hex");
}

export function verifyCallCenterSignature(payload: unknown, suppliedSignature: string | undefined): boolean {
  if (!suppliedSignature || !/^[a-f0-9]{64}$/i.test(suppliedSignature)) {
    return false;
  }
  const expected = Buffer.from(callCenterSignatureFor(payload), "hex");
  const supplied = Buffer.from(suppliedSignature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function sessions(): Map<string, CallCenterSessionDto> {
  globalForGateway.istCallCenterSessions ??= new Map<string, CallCenterSessionDto>();
  return globalForGateway.istCallCenterSessions;
}

function events(): Map<string, StoredEvent> {
  globalForGateway.istCallCenterEvents ??= new Map<string, StoredEvent>();
  return globalForGateway.istCallCenterEvents;
}

function adapters(): Map<string, CallCenterAdapter> {
  if (!globalForGateway.istCallCenterAdapters) {
    globalForGateway.istCallCenterAdapters = new Map<string, CallCenterAdapter>();
    registerCallCenterAdapter(new DryRunCallCenterAdapter());
  }
  return globalForGateway.istCallCenterAdapters;
}

function db(): CallCenterPrismaClient {
  return prisma as unknown as CallCenterPrismaClient;
}

function sessionKey(provider: string, externalCallId: string): string {
  return `${provider}:${externalCallId}`;
}

function eventKey(provider: string, providerEventId: string): string {
  return `${provider}:${providerEventId}`;
}

function maskAni(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.replace(/\s+/g, "");
  if (normalized.length <= 4) {
    return "*".repeat(normalized.length);
  }
  return `${normalized.slice(0, 3)}${"*".repeat(Math.max(3, normalized.length - 6))}${normalized.slice(-3)}`;
}

function aniHash(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const pepper = process.env.CALL_CENTER_ANI_HASH_SECRET ?? gatewaySecret();
  return createHmac("sha256", pepper).update(value).digest("hex");
}

function recordingFromUnknown(value: unknown): RecordingGovernance | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  return value as RecordingGovernance;
}

function rowToSession(row: DbSessionRow): CallCenterSessionDto {
  return {
    id: row.id,
    queueItemId: row.queueItemId ?? undefined,
    provider: row.provider,
    externalCallId: row.externalCallId,
    direction: row.direction as CallCenterSessionDto["direction"],
    channel: row.channel as CallCenterSessionDto["channel"],
    status: row.status as CallCenterSessionStatus,
    aniMasked: row.aniMasked ?? undefined,
    dnis: row.dnis ?? undefined,
    language: row.language,
    queueName: row.queueName ?? undefined,
    agentId: row.agentId ?? undefined,
    recording: recordingFromUnknown(row.recordingGovernance),
    requiresIdentityResolution: row.requiresIdentityResolution,
    startedAtIso: row.startedAt?.toISOString(),
    connectedAtIso: row.connectedAt?.toISOString(),
    endedAtIso: row.endedAt?.toISOString(),
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString()
  };
}

function safeEventPayload(event: CallCenterEvent): Record<string, unknown> {
  return {
    provider: event.provider,
    providerEventId: event.providerEventId,
    externalCallId: event.externalCallId,
    eventType: event.eventType,
    occurredAtIso: event.occurredAtIso,
    direction: event.direction,
    channel: event.channel,
    aniMasked: maskAni(event.ani),
    dnis: event.dnis,
    callbackTargetRef: event.callbackTargetRef,
    language: event.language,
    queueName: event.queueName,
    agentId: event.agentId,
    istStaffId: event.istStaffId,
    dependentId: event.dependentId,
    organizationId: event.organizationId,
    patientType: event.patientType,
    stationCode: event.stationCode,
    reasonNarrative: event.reasonNarrative,
    recording: event.recording,
    metadataKeys: Object.keys(event.metadata).sort()
  };
}

function statusForEvent(eventType: CallCenterEventType): CallCenterSessionStatus {
  const mapping: Record<CallCenterEventType, CallCenterSessionStatus> = {
    CALL_OFFERED: "OFFERED",
    CALL_CONNECTED: "CONNECTED",
    CALL_HELD: "HELD",
    CALL_RESUMED: "CONNECTED",
    CALL_ENDED: "ENDED",
    CALLBACK_REQUESTED: "WAITING_CALLBACK",
    CALLBACK_ANSWERED: "CONNECTED",
    NO_ANSWER: "NO_ANSWER",
    RECORDING_AVAILABLE: "ENDED"
  };
  return mapping[eventType];
}

function integrationSession(organizationId?: string): AuthenticatedSession {
  const expiresAtIso = new Date(Date.now() + 5 * 60_000).toISOString();
  return {
    sessionId: `call-center-integration-${randomUUID()}`,
    activeRole: "call_intake_coordinator",
    permissions: ["triage.workspace.view", "triage.call.intake"],
    responsibilities: ["register_triage_call"],
    expiresAtIso,
    authMethod: "local",
    mfaVerified: true,
    user: {
      id: "svc_call_center_gateway",
      employeeId: "SERVICE",
      hrmsId: "SERVICE",
      fullName: "Call Center Integration Gateway",
      email: "c***@system.local",
      mobile: "",
      organization: "IRIS STAR Technologies L.L.C",
      organizationId: organizationId ?? "org_ist_tech",
      organizationCode: "IST",
      facility: "GCP Doha",
      department: "Integration",
      clinicalSpecialty: "None",
      jobTitle: "Service Principal",
      professionalCategory: "integration",
      manager: "Integration Administrator",
      country: "Qatar",
      preferredLanguage: "en",
      timeZone: "Asia/Qatar",
      authenticationMethod: "local",
      mfaStatus: "enabled",
      accountStatus: "active",
      directoryStatus: "active",
      roles: ["call_intake_coordinator"],
      responsibilities: ["register_triage_call"],
      queues: ["tele-triage"],
      accessProfiles: ["integration-intake"],
      createdBy: "system",
      createdAtIso: expiresAtIso,
      updatedBy: "system",
      updatedAtIso: expiresAtIso
    }
  };
}

function validateRecordingGovernance(recording: RecordingGovernance | undefined): void {
  if (!recording?.objectRef) {
    return;
  }
  if (!recording.noticePlayed) {
    throw new CallCenterGatewayError(409, "Recording cannot be retained before the approved notice is played.", "RECORDING_NOTICE_REQUIRED");
  }
  if (!new Set(["GRANTED", "LEGAL_BASIS"]).has(recording.consentStatus)) {
    throw new CallCenterGatewayError(409, "Recording cannot be retained without consent or an approved legal basis.", "RECORDING_CONSENT_REQUIRED");
  }
  if (recording.storageRegion !== "me-central1") {
    throw new CallCenterGatewayError(409, "Call recordings must remain in GCP Doha (me-central1).", "RECORDING_RESIDENCY_VIOLATION");
  }
  if (recording.ragEligible !== false) {
    throw new CallCenterGatewayError(409, "Raw call recordings cannot enter the clinical RAG corpus.", "RECORDING_RAG_BOUNDARY_VIOLATION");
  }
}

async function findSession(provider: string, externalCallId: string): Promise<CallCenterSessionDto | undefined> {
  if (!shouldUseDatabasePersistence()) {
    return sessions().get(sessionKey(provider, externalCallId));
  }
  const row = await db().callCenterSession.findUnique({
    where: { provider_externalCallId: { provider, externalCallId } }
  });
  return row ? rowToSession(row) : undefined;
}

async function saveSession(session: CallCenterSessionDto, aniPlaintext?: string): Promise<CallCenterSessionDto> {
  if (!shouldUseDatabasePersistence()) {
    sessions().set(sessionKey(session.provider, session.externalCallId), session);
    return session;
  }
  const existing = await db().callCenterSession.findUnique({
    where: { provider_externalCallId: { provider: session.provider, externalCallId: session.externalCallId } }
  });
  const data = {
    queueItemId: session.queueItemId,
    provider: session.provider,
    externalCallId: session.externalCallId,
    direction: session.direction,
    channel: session.channel,
    status: session.status,
    aniMasked: session.aniMasked,
    aniHash: aniHash(aniPlaintext),
    dnis: session.dnis,
    language: session.language,
    queueName: session.queueName,
    agentId: session.agentId,
    recordingGovernance: session.recording,
    requiresIdentityResolution: session.requiresIdentityResolution,
    startedAt: session.startedAtIso ? new Date(session.startedAtIso) : null,
    connectedAt: session.connectedAtIso ? new Date(session.connectedAtIso) : null,
    endedAt: session.endedAtIso ? new Date(session.endedAtIso) : null
  };
  const row = existing
    ? await db().callCenterSession.update({ where: { id: existing.id }, data })
    : await db().callCenterSession.create({ data: { id: session.id, ...data } });
  return rowToSession(row);
}

async function findEvent(provider: string, providerEventId: string): Promise<StoredEvent | undefined> {
  if (!shouldUseDatabasePersistence()) {
    return events().get(eventKey(provider, providerEventId));
  }
  const row = await db().callCenterEvent.findUnique({
    where: { provider_providerEventId: { provider, providerEventId } }
  });
  if (!row) {
    return undefined;
  }
  return {
    id: row.id,
    sessionId: row.callCenterSessionId,
    provider: row.provider,
    providerEventId: row.providerEventId,
    externalCallId: row.externalCallId,
    eventType: row.eventType as CallCenterEventType,
    processStatus: row.processStatus as StoredEvent["processStatus"],
    duplicate: false,
    receivedAtIso: row.receivedAt.toISOString(),
    processedAtIso: row.processedAt?.toISOString(),
    failureCode: row.failureCode ?? undefined,
    safePayload: row.safePayload as Record<string, unknown>,
    auditSignature: row.auditSignature
  };
}

async function saveEvent(event: StoredEvent): Promise<StoredEvent> {
  if (!shouldUseDatabasePersistence()) {
    events().set(eventKey(event.provider, event.providerEventId), event);
    return event;
  }
  const existing = await db().callCenterEvent.findUnique({
    where: { provider_providerEventId: { provider: event.provider, providerEventId: event.providerEventId } }
  });
  const data = {
    callCenterSessionId: event.sessionId,
    provider: event.provider,
    providerEventId: event.providerEventId,
    externalCallId: event.externalCallId,
    eventType: event.eventType,
    processStatus: event.processStatus,
    safePayload: event.safePayload,
    auditSignature: event.auditSignature,
    failureCode: event.failureCode,
    receivedAt: new Date(event.receivedAtIso),
    processedAt: event.processedAtIso ? new Date(event.processedAtIso) : null
  };
  if (existing) {
    await db().callCenterEvent.update({ where: { id: existing.id }, data });
  } else {
    await db().callCenterEvent.create({
      data: { id: event.id, occurredAt: new Date(String(event.safePayload.occurredAtIso)), ...data }
    });
  }
  return event;
}

async function queueItemForEvent(event: CallCenterEvent): Promise<string | undefined> {
  if (!event.istStaffId || !new Set<CallCenterEventType>(["CALL_OFFERED", "CALLBACK_REQUESTED"]).has(event.eventType)) {
    return undefined;
  }
  try {
    const targetOrganizationId = targetOrganizationForEvent(event);
    const item = await createQueueItem(integrationSession(targetOrganizationId), {
      istStaffId: event.istStaffId,
      dependentId: event.dependentId,
      organizationId: targetOrganizationId,
      targetOrganizationId,
      patientType: event.dependentId ? "Dependent" : event.patientType,
      channel: event.eventType === "CALLBACK_REQUESTED" ? "Callback" : event.channel,
      stationCode: event.stationCode,
      summary: event.reasonNarrative ?? "Incoming tele-triage call awaiting nurse review.",
      reasonNarrative: event.reasonNarrative,
      safetyFloorActive: false,
      slaMinutes: event.eventType === "CALLBACK_REQUESTED" ? 30 : 10
    });
    return item.id;
  } catch {
    return undefined;
  }
}

function receipt(stored: StoredEvent, session: CallCenterSessionDto, duplicate: boolean): CallCenterEventReceiptDto {
  return {
    id: stored.id,
    provider: stored.provider,
    providerEventId: stored.providerEventId,
    externalCallId: stored.externalCallId,
    eventType: stored.eventType,
    processStatus: stored.processStatus,
    duplicate,
    session,
    receivedAtIso: stored.receivedAtIso,
    processedAtIso: stored.processedAtIso,
    failureCode: stored.failureCode
  };
}

export async function ingestCallCenterEvent(event: CallCenterEvent): Promise<CallCenterEventReceiptDto> {
  validateRecordingGovernance(event.recording);
  const existingEvent = await findEvent(event.provider, event.providerEventId);
  if (existingEvent?.processStatus === "PROCESSED") {
    const existingSession = await findSession(event.provider, event.externalCallId);
    if (!existingSession) {
      throw new CallCenterGatewayError(500, "Idempotent event exists without its call session.", "CALL_CENTER_SESSION_MISSING");
    }
    return receipt(existingEvent, existingSession, true);
  }

  const timestamp = nowIso();
  let session =
    (await findSession(event.provider, event.externalCallId)) ??
    ({
      id: `ccs-${randomUUID()}`,
      provider: event.provider,
      externalCallId: event.externalCallId,
      direction: event.direction,
      channel: event.channel,
      status: statusForEvent(event.eventType),
      aniMasked: maskAni(event.ani),
      dnis: event.dnis,
      language: event.language,
      queueName: event.queueName,
      agentId: event.agentId,
      recording: event.recording,
      requiresIdentityResolution: !event.istStaffId,
      startedAtIso: event.eventType === "CALL_OFFERED" ? event.occurredAtIso : undefined,
      createdAtIso: timestamp,
      updatedAtIso: timestamp
    } satisfies CallCenterSessionDto);

  const safePayload = safeEventPayload(event);
  let stored: StoredEvent =
    existingEvent ?? {
      id: `cce-${randomUUID()}`,
      sessionId: session.id,
      provider: event.provider,
      providerEventId: event.providerEventId,
      externalCallId: event.externalCallId,
      eventType: event.eventType,
      processStatus: "RECEIVED",
      duplicate: false,
      receivedAtIso: timestamp,
      safePayload,
      auditSignature: auditSignatureFor(safePayload)
    };

  session = await saveSession(session, event.ani);
  stored = await saveEvent(stored);

  try {
    const queueItemId = session.queueItemId ?? (await queueItemForEvent(event));
    const nextStatus = statusForEvent(event.eventType);
    session = {
      ...session,
      queueItemId,
      status: nextStatus,
      agentId: event.agentId ?? session.agentId,
      recording: event.recording ?? session.recording,
      requiresIdentityResolution: !queueItemId && !session.queueItemId,
      connectedAtIso: new Set<CallCenterEventType>(["CALL_CONNECTED", "CALLBACK_ANSWERED", "CALL_RESUMED"]).has(event.eventType)
        ? event.occurredAtIso
        : session.connectedAtIso,
      endedAtIso: new Set<CallCenterEventType>(["CALL_ENDED", "NO_ANSWER", "RECORDING_AVAILABLE"]).has(event.eventType)
        ? event.occurredAtIso
        : session.endedAtIso,
      updatedAtIso: timestamp
    };
    session = await saveSession(session, event.ani);
    stored = await saveEvent({
      ...stored,
      processStatus: "PROCESSED",
      processedAtIso: nowIso(),
      failureCode: undefined
    });
    return receipt(stored, session, false);
  } catch (error) {
    const failureCode = error instanceof CallCenterGatewayError ? error.code : "CALL_CENTER_EVENT_PROCESSING_FAILED";
    stored = await saveEvent({
      ...stored,
      processStatus: "FAILED",
      processedAtIso: nowIso(),
      failureCode
    });
    throw error;
  }
}

export class DryRunCallCenterAdapter implements CallCenterAdapter {
  readonly key = "dry-run";
  readonly displayName = "IST Dry-Run Call Center Adapter";

  async execute(command: CallCenterAdapterCommand): Promise<CallCenterAdapterResult> {
    const statusByAction: Record<CallCenterCommand["action"], CallCenterSessionStatus> = {
      ANSWER: "CONNECTED",
      START_CALLBACK: "CONNECTED",
      HOLD: "HELD",
      RESUME: "CONNECTED",
      END: "ENDED"
    };
    return {
      accepted: true,
      providerCommandId: `dry-command-${randomUUID()}`,
      status: statusByAction[command.action],
      occurredAtIso: nowIso()
    };
  }

  async health(): Promise<{ ok: boolean; detail: string }> {
    return { ok: true, detail: "Dry-run adapter is available; no external telephony provider is contacted." };
  }
}

export function registerCallCenterAdapter(adapter: CallCenterAdapter): void {
  globalForGateway.istCallCenterAdapters ??= new Map<string, CallCenterAdapter>();
  globalForGateway.istCallCenterAdapters.set(adapter.key, adapter);
}

function resolveAdapter(key: string): CallCenterAdapter {
  const adapter = adapters().get(key);
  if (!adapter) {
    throw new CallCenterGatewayError(503, `Call-center provider adapter '${key}' is not configured.`, "CALL_CENTER_ADAPTER_UNAVAILABLE");
  }
  return adapter;
}

function defaultRecordingAuthorization(): RecordingGovernance | undefined {
  if (!isMockMode()) {
    return undefined;
  }
  return {
    purpose: "SERVICE_QUALITY_AND_SAFETY",
    noticePlayed: true,
    noticeVersion: "SIMULATION-NOTICE-1",
    consentStatus: "GRANTED",
    storageRegion: "me-central1",
    ragEligible: false
  };
}

function requireRecordingAuthorization(command: CallCenterCommand): RecordingGovernance | undefined {
  if (command.action !== "ANSWER" && command.action !== "START_CALLBACK") {
    return command.recordingAuthorization;
  }
  const authorization = command.recordingAuthorization ?? defaultRecordingAuthorization();
  if (!authorization?.noticePlayed || !new Set(["GRANTED", "LEGAL_BASIS"]).has(authorization.consentStatus)) {
    throw new CallCenterGatewayError(
      409,
      "Play the approved recording notice and capture consent or legal basis before connecting the call.",
      "RECORDING_AUTHORIZATION_REQUIRED"
    );
  }
  validateRecordingGovernance(authorization);
  return authorization;
}

function providerFor(command: CallCenterCommand): string {
  return command.provider ?? process.env.CALL_CENTER_PROVIDER ?? "dry-run";
}

async function ensureQueueSession(
  session: AuthenticatedSession,
  queueItemId: string,
  provider: string
): Promise<CallCenterSessionDto> {
  const existing = await listCallCenterSessions().then((items) => items.find((item) => item.queueItemId === queueItemId));
  if (existing) {
    return existing;
  }
  const queueItem = await getQueueItem(session, queueItemId);
  const timestamp = nowIso();
  return saveSession({
    id: `ccs-${randomUUID()}`,
    queueItemId,
    provider,
    externalCallId: `${provider}-${queueItemId}`,
    direction: queueItem.channel === "Callback" ? "OUTBOUND" : "INBOUND",
    channel: queueItem.channel === "Callback" ? "Callback" : "Phone",
    status: queueItem.channel === "Callback" ? "WAITING_CALLBACK" : "OFFERED",
    language: "en",
    queueName: "IST-HEALTH-TRIAGE",
    requiresIdentityResolution: false,
    startedAtIso: timestamp,
    createdAtIso: timestamp,
    updatedAtIso: timestamp
  });
}

function commandEventType(action: CallCenterCommand["action"]): CallCenterEventType {
  const eventByAction: Record<CallCenterCommand["action"], CallCenterEventType> = {
    ANSWER: "CALL_CONNECTED",
    START_CALLBACK: "CALLBACK_ANSWERED",
    HOLD: "CALL_HELD",
    RESUME: "CALL_RESUMED",
    END: "CALL_ENDED"
  };
  return eventByAction[action];
}

export async function executeQueueCallCommand(
  actor: AuthenticatedSession,
  queueItemId: string,
  command: CallCenterCommand
): Promise<{ item: Awaited<ReturnType<typeof getQueueItem>>; call: CallCenterSessionDto; providerCommandId: string }> {
  const recordingAuthorization = requireRecordingAuthorization(command);
  const provider = providerFor(command);
  const adapter = resolveAdapter(provider);
  const currentItem = await getQueueItem(actor, queueItemId);
  let claimedHere = false;
  if (command.action === "ANSWER" || command.action === "START_CALLBACK") {
    if (currentItem.lockedBy !== actor.user.id) {
      await claimQueueItem(actor, queueItemId);
      claimedHere = true;
    }
  }

  let call = await ensureQueueSession(actor, queueItemId, provider);
  call = await saveSession({
    ...call,
    status: command.action === "ANSWER" || command.action === "START_CALLBACK" ? "CONNECTING" : call.status,
    agentId: actor.user.id,
    recording: recordingAuthorization ?? call.recording,
    updatedAtIso: nowIso()
  });

  let result: CallCenterAdapterResult;
  try {
    result = await adapter.execute({ action: command.action, session: call, actorId: actor.user.id, actorRole: actor.activeRole });
    if (!result.accepted) {
      throw new CallCenterGatewayError(502, "The configured call-center provider rejected the command.", result.failureCode ?? "CALL_CENTER_COMMAND_REJECTED");
    }
  } catch (error) {
    call = await saveSession({ ...call, status: "FAILED", updatedAtIso: nowIso() });
    if (claimedHere) {
      await releaseQueueItem(actor, queueItemId).catch(() => undefined);
    }
    throw error;
  }

  const connected = result.status === "CONNECTED" ? result.occurredAtIso : call.connectedAtIso;
  const ended = result.status === "ENDED" ? result.occurredAtIso : call.endedAtIso;
  call = await saveSession({
    ...call,
    status: result.status,
    connectedAtIso: connected,
    endedAtIso: ended,
    updatedAtIso: result.occurredAtIso
  });

  const safePayload = {
    queueItemId,
    action: command.action,
    actorId: actor.user.id,
    actorRole: actor.activeRole,
    providerCommandId: result.providerCommandId,
    occurredAtIso: result.occurredAtIso
  };
  await saveEvent({
    id: `cce-${randomUUID()}`,
    sessionId: call.id,
    provider: call.provider,
    providerEventId: result.providerCommandId,
    externalCallId: call.externalCallId,
    eventType: commandEventType(command.action),
    processStatus: "PROCESSED",
    duplicate: false,
    receivedAtIso: result.occurredAtIso,
    processedAtIso: result.occurredAtIso,
    safePayload,
    auditSignature: auditSignatureFor(safePayload)
  });

  return {
    item: await getQueueItem(actor, queueItemId),
    call,
    providerCommandId: result.providerCommandId
  };
}

export async function listCallCenterSessions(): Promise<CallCenterSessionDto[]> {
  if (!shouldUseDatabasePersistence()) {
    return [...sessions().values()].sort((left, right) => right.updatedAtIso.localeCompare(left.updatedAtIso));
  }
  const rows = await db().callCenterSession.findMany({ orderBy: { updatedAt: "desc" }, take: 250 });
  return rows.map(rowToSession);
}

export async function getCallCenterGatewayStatus() {
  const health = await Promise.all(
    [...adapters().values()].map(async (adapter) => ({
      key: adapter.key,
      displayName: adapter.displayName,
      ...(await adapter.health())
    }))
  );
  return {
    architecture: "provider-neutral-call-center-gateway",
    configuredProvider: process.env.CALL_CENTER_PROVIDER ?? "dry-run",
    persistence: shouldUseDatabasePersistence() ? "postgresql" : "mock-in-memory",
    recordingRegion: "me-central1",
    rawRecordingRagEligible: false,
    providers: health
  };
}

export function resetCallCenterGatewayForTests(): void {
  globalForGateway.istCallCenterSessions = new Map();
  globalForGateway.istCallCenterEvents = new Map();
  globalForGateway.istCallCenterAdapters = new Map();
  registerCallCenterAdapter(new DryRunCallCenterAdapter());
}
