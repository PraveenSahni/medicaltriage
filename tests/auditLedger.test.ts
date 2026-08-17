import {
  appendAuditEvent,
  AUDIT_LEDGER_GENESIS_HASH,
  verifyAuditEventChain
} from "../src/services/auditLedger.js";
import type { AuditEvent } from "../src/types/security.js";

type StoredRow = Record<string, any>;

function event(id: string, action = "LOGIN"): AuditEvent {
  return {
    id,
    timestampIso: `2026-08-17T12:00:0${id.slice(-1)}.000Z`,
    userId: "user-1",
    activeRole: "triage_nurse",
    organization: "org-1",
    facility: "facility-1",
    department: "Clinical Operations",
    action,
    module: "Authentication",
    resource: "session",
    purpose: "test",
    ipAddress: "127.0.0.1",
    device: "jest",
    success: true,
    risk: "low",
    metadata: { attempt: Number(id.slice(-1)) }
  };
}

function fakeClient() {
  const rows: StoredRow[] = [];
  const auditEvent = {
    findFirst: jest.fn(async () => {
      const signed = rows.filter((row) => row.eventHash).sort((a, b) => Number(b.sequenceNumber - a.sequenceNumber));
      return signed[0] ? { eventHash: signed[0].eventHash } : null;
    }),
    create: jest.fn(async ({ data }: { data: StoredRow }) => {
      const row = { ...data, sequenceNumber: BigInt(rows.length + 1) };
      rows.push(row);
      return row;
    }),
    findMany: jest.fn(async () => [...rows].filter((row) => row.eventHash).sort((a, b) => Number(a.sequenceNumber - b.sequenceNumber))),
    count: jest.fn(async () => rows.filter((row) => !row.eventHash).length)
  };
  const transaction = { auditEvent, $executeRawUnsafe: jest.fn(async () => 1) };
  return {
    rows,
    transaction,
    client: {
      auditEvent,
      $transaction: jest.fn(async (callback: (tx: typeof transaction) => unknown) => callback(transaction))
    } as any
  };
}

describe("append-only chained audit ledger", () => {
  const originalSecret = process.env.AUDIT_HMAC_SECRET;
  const originalVersion = process.env.AUDIT_HMAC_KEY_VERSION;

  beforeEach(() => {
    process.env.AUDIT_HMAC_SECRET = "unit-test-audit-chain-secret";
    process.env.AUDIT_HMAC_KEY_VERSION = "test-v1";
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.AUDIT_HMAC_SECRET;
    else process.env.AUDIT_HMAC_SECRET = originalSecret;
    if (originalVersion === undefined) delete process.env.AUDIT_HMAC_KEY_VERSION;
    else process.env.AUDIT_HMAC_KEY_VERSION = originalVersion;
  });

  it("serializes writes under a PostgreSQL advisory transaction lock and links every event", async () => {
    const store = fakeClient();
    await appendAuditEvent(event("event-1"), store.client);
    await appendAuditEvent(event("event-2", "MFA_VERIFIED"), store.client);

    expect(store.transaction.$executeRawUnsafe).toHaveBeenCalledTimes(2);
    expect(store.rows[0].previousHash).toBe(AUDIT_LEDGER_GENESIS_HASH);
    expect(store.rows[1].previousHash).toBe(store.rows[0].eventHash);
    expect(store.rows[0].eventHash).toMatch(/^[a-f0-9]{64}$/);
    await expect(verifyAuditEventChain(store.client)).resolves.toMatchObject({ valid: true, checkedEvents: 2 });
  });

  it("detects modification of a signed event", async () => {
    const store = fakeClient();
    await appendAuditEvent(event("event-1"), store.client);
    store.rows[0].action = "ADMIN_PERMISSION_GRANTED";

    await expect(verifyAuditEventChain(store.client)).resolves.toMatchObject({
      valid: false,
      firstInvalidEventId: "event-1"
    });
  });

  it("detects removal of an event from the middle of the chain", async () => {
    const store = fakeClient();
    await appendAuditEvent(event("event-1"), store.client);
    await appendAuditEvent(event("event-2"), store.client);
    await appendAuditEvent(event("event-3"), store.client);
    store.rows.splice(1, 1);

    await expect(verifyAuditEventChain(store.client)).resolves.toMatchObject({
      valid: false,
      firstInvalidEventId: "event-3"
    });
  });

  it("detects reordered events", async () => {
    const store = fakeClient();
    await appendAuditEvent(event("event-1"), store.client);
    await appendAuditEvent(event("event-2"), store.client);
    store.rows[0].sequenceNumber = 2n;
    store.rows[1].sequenceNumber = 1n;

    await expect(verifyAuditEventChain(store.client)).resolves.toMatchObject({ valid: false });
  });

  it("fails closed when the dedicated audit HMAC secret is unavailable", async () => {
    const store = fakeClient();
    delete process.env.AUDIT_HMAC_SECRET;

    await expect(appendAuditEvent(event("event-1"), store.client)).rejects.toThrow(/AUDIT_HMAC_SECRET/);
    expect(store.rows).toHaveLength(0);
  });

  it("reports pre-migration unsigned rows separately instead of claiming they were authenticated", async () => {
    const store = fakeClient();
    store.rows.push({ id: "legacy", eventHash: null, sequenceNumber: 1n });
    await appendAuditEvent(event("event-2"), store.client);

    await expect(verifyAuditEventChain(store.client)).resolves.toMatchObject({
      valid: true,
      checkedEvents: 1,
      legacyUnsignedEvents: 1
    });
  });
});
