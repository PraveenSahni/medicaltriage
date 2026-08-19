import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { auditPrisma } from "../db.js";
import type { AuditEvent } from "../types/security.js";

const AUDIT_LEDGER_LOCK_ID = 1_096_520_215_793n;
export const AUDIT_LEDGER_GENESIS_HASH = "0".repeat(64);

type AuditTransaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

function requiredAuditSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET?.trim();
  if (!secret) {
    throw new Error("AUDIT_HMAC_SECRET is required for chained audit persistence.");
  }
  return secret;
}

function auditKeyVersion(): string {
  return process.env.AUDIT_HMAC_KEY_VERSION?.trim() || "v1";
}

function secretForKeyVersion(keyVersion: string): string {
  if (keyVersion === auditKeyVersion()) return requiredAuditSecret();
  const encoded = process.env.AUDIT_HMAC_KEYS_JSON?.trim();
  if (encoded) {
    const parsed = JSON.parse(encoded) as Record<string, unknown>;
    const secret = parsed[keyVersion];
    if (typeof secret === "string" && secret.trim()) return secret;
  }
  throw new Error(`No audit HMAC verification key is configured for key version ${keyVersion}.`);
}

function canonicalValue(value: unknown): string {
  if (value === undefined) return "__undefined__";
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalValue).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalValue(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "__unsupported__";
}

export function canonicalAuditLedgerPayload(event: AuditEvent, previousHash: string, keyVersion: string): string {
  return canonicalValue({
    id: event.id,
    timestampIso: event.timestampIso,
    userId: event.userId,
    activeRole: event.activeRole,
    organization: event.organization,
    facility: event.facility,
    department: event.department,
    action: event.action,
    module: event.module,
    resource: event.resource,
    recordReference: event.recordReference,
    purpose: event.purpose,
    approvalReference: event.approvalReference,
    ipAddress: event.ipAddress,
    device: event.device,
    sessionHash: event.sessionHash,
    success: event.success,
    risk: event.risk,
    metadata: event.metadata,
    previousHash,
    keyVersion
  });
}

export function auditLedgerHash(
  event: AuditEvent,
  previousHash: string,
  keyVersion = auditKeyVersion(),
  secret = requiredAuditSecret()
): string {
  return createHmac("sha256", secret)
    .update(canonicalAuditLedgerPayload(event, previousHash, keyVersion))
    .digest("hex");
}

function jsonValue(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  return value === undefined ? undefined : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);
}

function normalizedMetadata(value: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export async function appendAuditEvent(event: AuditEvent, client: PrismaClient = auditPrisma): Promise<{ id: string; eventHash: string }> {
  return client.$transaction(async (tx: AuditTransaction) => {
    await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock($1)", AUDIT_LEDGER_LOCK_ID);
    const previous = await tx.auditEvent.findFirst({
      where: { eventHash: { not: null } },
      orderBy: { sequenceNumber: "desc" },
      select: { eventHash: true }
    });
    const previousHash = previous?.eventHash ?? AUDIT_LEDGER_GENESIS_HASH;
    const keyVersion = auditKeyVersion();
    // Sign the exact JSON representation that PostgreSQL will retain. JSON
    // serialization removes undefined object properties; signing the original
    // in-memory object would otherwise make a freshly written row unverifiable.
    const persistedEvent = { ...event, metadata: normalizedMetadata(event.metadata) };
    const eventHash = auditLedgerHash(persistedEvent, previousHash, keyVersion);
    const created = await tx.auditEvent.create({
      data: {
        id: event.id,
        timestamp: new Date(event.timestampIso),
        userId: event.userId || undefined,
        activeRole: event.activeRole || undefined,
        organization: event.organization || undefined,
        facility: event.facility || undefined,
        department: event.department || undefined,
        action: event.action,
        module: event.module,
        resource: event.resource || undefined,
        recordReference: event.recordReference,
        purpose: event.purpose,
        approvalReference: event.approvalReference,
        ipAddress: event.ipAddress || undefined,
        device: event.device || undefined,
        sessionHash: event.sessionHash,
        success: event.success,
        riskLevel: event.risk,
        metadata: jsonValue(persistedEvent.metadata),
        previousHash,
        eventHash,
        keyVersion
      }
    });
    return { id: created.id, eventHash };
  });
}

export type OperationalAuditEvent = {
  action: string;
  module: string;
  resource: string;
  success: boolean;
  risk?: AuditEvent["risk"];
  userId?: string;
  activeRole?: string;
  organization?: string;
  facility?: string;
  department?: string;
  recordReference?: string;
  purpose?: string;
  approvalReference?: string;
  ipAddress?: string;
  device?: string;
  sessionHash?: string;
  metadata?: Record<string, unknown>;
  timestampIso?: string;
};

export async function appendOperationalAuditEvent(
  event: OperationalAuditEvent,
  client: PrismaClient = auditPrisma
): Promise<{ id: string; eventHash: string }> {
  return appendAuditEvent(
    {
      id: randomUUID(),
      timestampIso: event.timestampIso ?? new Date().toISOString(),
      userId: event.userId ?? "",
      activeRole: event.activeRole ?? "",
      organization: event.organization ?? "",
      facility: event.facility ?? "",
      department: event.department ?? "",
      action: event.action,
      module: event.module,
      resource: event.resource,
      recordReference: event.recordReference,
      purpose: event.purpose,
      approvalReference: event.approvalReference,
      ipAddress: event.ipAddress ?? "",
      device: event.device ?? "",
      sessionHash: event.sessionHash,
      success: event.success,
      risk: event.risk ?? "medium",
      metadata: event.metadata
    },
    client
  );
}

function safeHashEqual(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export type AuditChainVerification = {
  valid: boolean;
  checkedEvents: number;
  legacyUnsignedEvents: number;
  legacyNormalizedEvents: number;
  firstInvalidEventId?: string;
  headHash: string;
};

export async function verifyAuditEventChain(client: PrismaClient = auditPrisma): Promise<AuditChainVerification> {
  const [rows, legacyUnsignedEvents] = await Promise.all([
    client.auditEvent.findMany({ where: { eventHash: { not: null } }, orderBy: { sequenceNumber: "asc" } }),
    client.auditEvent.count({ where: { eventHash: null } })
  ]);
  let previousHash = AUDIT_LEDGER_GENESIS_HASH;
  let legacyNormalizedEvents = 0;
  for (const row of rows) {
    const event: AuditEvent = {
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
      recordReference: row.recordReference ?? undefined,
      purpose: row.purpose ?? undefined,
      approvalReference: row.approvalReference ?? undefined,
      ipAddress: row.ipAddress ?? "",
      device: row.device ?? "",
      sessionHash: row.sessionHash ?? undefined,
      success: row.success,
      risk: row.riskLevel as AuditEvent["risk"],
      metadata: (row.metadata as Record<string, unknown> | null) ?? undefined
    };
    const keyVersion = row.keyVersion ?? "";
    const secret = secretForKeyVersion(keyVersion);
    const expected = auditLedgerHash(event, previousHash, keyVersion, secret);
    // Three early v1 QUEUE_ITEM_CREATE records were signed before JSON
    // persistence removed an undefined stationCode property. Preserve those
    // immutable records and verify their original canonical payload narrowly;
    // all other shapes remain fail-closed.
    const legacyCreateEvent = event.action === "QUEUE_ITEM_CREATE"
      && event.module === "Queue"
      && keyVersion === "v1"
      && event.metadata !== undefined
      && !Object.prototype.hasOwnProperty.call(event.metadata, "stationCode")
      ? { ...event, metadata: { ...event.metadata, stationCode: undefined } }
      : undefined;
    const matchesLegacyNormalization = Boolean(
      legacyCreateEvent
      && row.eventHash
      && safeHashEqual(auditLedgerHash(legacyCreateEvent, previousHash, keyVersion, secret), row.eventHash)
    );
    if (row.previousHash !== previousHash || !row.eventHash || (!safeHashEqual(expected, row.eventHash) && !matchesLegacyNormalization)) {
      return {
        valid: false,
        checkedEvents: rows.indexOf(row),
        legacyUnsignedEvents,
        legacyNormalizedEvents,
        firstInvalidEventId: row.id,
        headHash: previousHash
      };
    }
    if (matchesLegacyNormalization) legacyNormalizedEvents += 1;
    previousHash = row.eventHash;
  }
  return { valid: true, checkedEvents: rows.length, legacyUnsignedEvents, legacyNormalizedEvents, headHash: previousHash };
}
