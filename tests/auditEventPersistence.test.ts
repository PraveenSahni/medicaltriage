const auditEventCreateMock = jest.fn();
const auditEventFindManyMock = jest.fn();
const auditEventFindFirstMock = jest.fn();
const executeRawMock = jest.fn();

const auditTransaction = {
  $executeRawUnsafe: (...args: unknown[]) => executeRawMock(...args),
  auditEvent: {
    create: (...args: unknown[]) => auditEventCreateMock(...args),
    findFirst: (...args: unknown[]) => auditEventFindFirstMock(...args)
  }
};

jest.mock("../src/db.js", () => {
  const client = {
    $transaction: (callback: (tx: typeof auditTransaction) => unknown) => callback(auditTransaction),
    auditEvent: {
      create: (...args: unknown[]) => auditEventCreateMock(...args),
      findMany: (...args: unknown[]) => auditEventFindManyMock(...args)
    }
  };
  return { prisma: client, auditPrisma: client };
});

import { persistSecurityAuditEvent, listPersistedAuditEvents } from "../src/services/persistence.js";
import type { AuditEvent } from "../src/types/security.js";

// Closes the Priority-0 audit-integrity defect found during AR.13's canary
// validation: MOCK_MODE=true silently made shouldUseDatabasePersistence()
// (and therefore every AuditEvent write) a no-op on soc2 - a security
// audit trail that only ever existed in one Cloud Run instance's memory.
// AUDIT_EVENT_DB_PERSISTENCE is now the dedicated, independent flag,
// mirroring SESSION_DB_PERSISTENCE/MFA_DB_PERSISTENCE.
describe("AuditEvent durable persistence gating", () => {
  const ORIGINAL_MOCK_MODE = process.env.MOCK_MODE;
  const ORIGINAL_AUDIT_FLAG = process.env.AUDIT_EVENT_DB_PERSISTENCE;
  const ORIGINAL_AUDIT_SECRET = process.env.AUDIT_HMAC_SECRET;

  const sampleEvent: AuditEvent = {
    id: "evt_1",
    timestampIso: "2026-08-05T12:00:00.000Z",
    userId: "usr_nurse_10001",
    activeRole: "remote_triage_nurse",
    organization: "IST Tech",
    facility: "IST Tele-triage Command Centre",
    department: "Clinical Operations",
    action: "LOGIN",
    module: "Authentication",
    resource: "local",
    ipAddress: "127.0.0.1",
    device: "jest",
    success: true,
    risk: "low"
  };

  beforeEach(() => {
    auditEventCreateMock.mockReset();
    auditEventFindManyMock.mockReset();
    auditEventFindFirstMock.mockReset().mockResolvedValue(null);
    executeRawMock.mockReset().mockResolvedValue(1);
    auditEventCreateMock.mockResolvedValue({ id: "row_1" });
    auditEventFindManyMock.mockResolvedValue([]);
    process.env.AUDIT_HMAC_SECRET = "audit-ledger-test-secret";
  });

  afterEach(() => {
    if (ORIGINAL_MOCK_MODE === undefined) delete process.env.MOCK_MODE;
    else process.env.MOCK_MODE = ORIGINAL_MOCK_MODE;
    if (ORIGINAL_AUDIT_FLAG === undefined) delete process.env.AUDIT_EVENT_DB_PERSISTENCE;
    else process.env.AUDIT_EVENT_DB_PERSISTENCE = ORIGINAL_AUDIT_FLAG;
    if (ORIGINAL_AUDIT_SECRET === undefined) delete process.env.AUDIT_HMAC_SECRET;
    else process.env.AUDIT_HMAC_SECRET = ORIGINAL_AUDIT_SECRET;
  });

  it("does NOT write to the database when AUDIT_EVENT_DB_PERSISTENCE is unset, even if MOCK_MODE=false", async () => {
    process.env.MOCK_MODE = "false";
    delete process.env.AUDIT_EVENT_DB_PERSISTENCE;

    const result = await persistSecurityAuditEvent(sampleEvent);

    expect(result.persisted).toBe(false);
    expect(auditEventCreateMock).not.toHaveBeenCalled();
  });

  it("DOES write to the database when AUDIT_EVENT_DB_PERSISTENCE=true, even if MOCK_MODE=true (the exact soc2 bug)", async () => {
    process.env.MOCK_MODE = "true";
    process.env.AUDIT_EVENT_DB_PERSISTENCE = "true";

    const result = await persistSecurityAuditEvent(sampleEvent);

    expect(result.persisted).toBe(true);
    expect(auditEventCreateMock).toHaveBeenCalledTimes(1);
    const callArgs = auditEventCreateMock.mock.calls[0][0];
    expect(callArgs.data.action).toBe("LOGIN");
    expect(callArgs.data.userId).toBe("usr_nurse_10001");
    expect(callArgs.data.previousHash).toBe("0".repeat(64));
    expect(callArgs.data.eventHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("never includes password/token/secret-shaped fields in the persisted row (AuditEvent type carries none)", async () => {
    process.env.AUDIT_EVENT_DB_PERSISTENCE = "true";
    await persistSecurityAuditEvent(sampleEvent);

    const persistedData = auditEventCreateMock.mock.calls[0][0].data;
    const persistedKeys = Object.keys(persistedData);
    for (const forbidden of ["password", "otp", "secret", "token", "cookie", "recoveryCode"]) {
      expect(persistedKeys.some((key) => key.toLowerCase().includes(forbidden))).toBe(false);
    }
  });

  it("listPersistedAuditEvents returns [] when the flag is off, without querying the database", async () => {
    delete process.env.AUDIT_EVENT_DB_PERSISTENCE;
    const rows = await listPersistedAuditEvents(50, { userId: "usr_nurse_10001" });
    expect(rows).toEqual([]);
    expect(auditEventFindManyMock).not.toHaveBeenCalled();
  });

  it("listPersistedAuditEvents supports filtering by organization and action (tenant isolation / event-type queries)", async () => {
    process.env.AUDIT_EVENT_DB_PERSISTENCE = "true";
    await listPersistedAuditEvents(50, { organization: "IST Tech", action: "LOGIN" });

    expect(auditEventFindManyMock).toHaveBeenCalledTimes(1);
    const queryArgs = auditEventFindManyMock.mock.calls[0][0];
    expect(queryArgs.where.organization).toBe("IST Tech");
    expect(queryArgs.where.action).toBe("LOGIN");
  });

  it("a database failure during persistSecurityAuditEvent surfaces as a rejected promise, not a silent success", async () => {
    process.env.AUDIT_EVENT_DB_PERSISTENCE = "true";
    auditEventCreateMock.mockRejectedValueOnce(new Error("connection timeout"));

    await expect(persistSecurityAuditEvent(sampleEvent)).rejects.toThrow("connection timeout");
  });
});
