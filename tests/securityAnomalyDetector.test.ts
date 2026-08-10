import { authenticator } from "otplib";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { prisma } from "../src/db.js";
import {
  confirmMfaEnrollment,
  enrollMfa,
  requestElevation,
  resetSecurityStoreForTests
} from "../src/services/securityAdmin.js";
import { recordAndCountSecurityAnomalyEvents } from "../src/services/persistence.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();
const PLATFORM_ADMIN = "usr_platform_admin_10001";
const NURSE_LOGIN = "layla@irisstar.tech";

async function loginAgent() {
  return request.agent(app);
}

describe("CSQ AR.21 / NFR-118 - shared security anomaly detector (unit, mocked persistence)", () => {
  const ORIGINAL_FLAG = process.env.SECURITY_ANOMALY_DB_PERSISTENCE;

  afterEach(() => {
    if (ORIGINAL_FLAG === undefined) delete process.env.SECURITY_ANOMALY_DB_PERSISTENCE;
    else process.env.SECURITY_ANOMALY_DB_PERSISTENCE = ORIGINAL_FLAG;
  });

  it("does not write or read when SECURITY_ANOMALY_DB_PERSISTENCE is unset (unit-test isolation preserved)", async () => {
    delete process.env.SECURITY_ANOMALY_DB_PERSISTENCE;
    const result = await recordAndCountSecurityAnomalyEvents({
      signalType: "AUTH_FAILURE",
      scopeKey: "usr_1",
      windowSeconds: 300
    });
    expect(result).toEqual({ count: 0, persisted: false });
  });
});

describe("CSQ AR.21 / NFR-118 - detector behavior via real login/MFA/elevation paths", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("does not falsely flag a single failed login below threshold", async () => {
    const agent = await loginAgent();
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    await agent.post("/api/v1/auth/login").send({ username: NURSE_LOGIN, password: "wrong-password" }).expect(401);
    const emittedSecurityEvent = consoleSpy.mock.calls
      .map((call) => String(call[0]))
      .some((line) => line.includes('"action":"SECURITY_ANOMALY_DETECTED"'));
    expect(emittedSecurityEvent).toBe(false);
    consoleSpy.mockRestore();
  });

  it("flags a burst of failed logins for the same account once the threshold is exceeded", async () => {
    process.env.AUTH_ANOMALY_FAILURE_THRESHOLD = "3";
    try {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
      for (let i = 0; i < 4; i += 1) {
        const agent = await loginAgent();
        await agent.post("/api/v1/auth/login").send({ username: NURSE_LOGIN, password: `wrong-${i}` });
      }
      const emitted = consoleSpy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("SECURITY_ANOMALY_DETECTED"));
      expect(emitted.length).toBeGreaterThan(0);
      const parsed = JSON.parse(emitted[0]);
      expect(parsed.signalType).toBe("AUTH_FAILURE");
      expect(parsed.count).toBeGreaterThan(3);
      // Never any sensitive data in the emitted line.
      expect(emitted[0]).not.toMatch(/wrong-\d|password/i);
      consoleSpy.mockRestore();
    } finally {
      delete process.env.AUTH_ANOMALY_FAILURE_THRESHOLD;
    }
  });

  it("isolates detection per user - one account's failures do not trip another's counter", async () => {
    process.env.AUTH_ANOMALY_FAILURE_THRESHOLD = "2";
    try {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
      const agentA = await loginAgent();
      await agentA.post("/api/v1/auth/login").send({ username: NURSE_LOGIN, password: "wrong-1" });
      await agentA.post("/api/v1/auth/login").send({ username: NURSE_LOGIN, password: "wrong-2" });
      await agentA.post("/api/v1/auth/login").send({ username: NURSE_LOGIN, password: "wrong-3" });

      const emittedForNurse = consoleSpy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("SECURITY_ANOMALY_DETECTED"));
      expect(emittedForNurse.length).toBeGreaterThan(0);

      consoleSpy.mockClear();
      const agentB = await loginAgent();
      await agentB.post("/api/v1/auth/login").send({ username: "rishma@irisstar.tech", password: "wrong-once" });
      const emittedForAdmin = consoleSpy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("SECURITY_ANOMALY_DETECTED"));
      expect(emittedForAdmin.length).toBe(0);
      consoleSpy.mockRestore();
    } finally {
      delete process.env.AUTH_ANOMALY_FAILURE_THRESHOLD;
    }
  });

  it("flags a burst of failed MFA challenges", async () => {
    process.env.AUTH_ANOMALY_FAILURE_THRESHOLD = "2";
    try {
      const { secret } = enrollMfa(PLATFORM_ADMIN);
      confirmMfaEnrollment(PLATFORM_ADMIN, authenticator.generate(secret));
      const agent = await loginAgent();
      const loginRes = await agent
        .post("/api/v1/auth/login")
        .send({ username: "rishma@irisstar.tech", password: TEST_ADMIN_PASSWORD })
        .expect(202);
      const { challengeId } = loginRes.body;

      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
      for (let i = 0; i < 3; i += 1) {
        await agent.post("/api/v1/auth/mfa/verify").send({ challengeId, code: "000000" });
      }
      const emitted = consoleSpy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("SECURITY_ANOMALY_DETECTED"));
      expect(emitted.some((line) => line.includes('"signalType":"MFA_FAILURE"'))).toBe(true);
      consoleSpy.mockRestore();
    } finally {
      delete process.env.AUTH_ANOMALY_FAILURE_THRESHOLD;
    }
  });

  it("flags a burst of PAM elevation denials", async () => {
    process.env.AUTH_ANOMALY_FAILURE_THRESHOLD = "2";
    try {
      const { secret } = enrollMfa(PLATFORM_ADMIN);
      confirmMfaEnrollment(PLATFORM_ADMIN, authenticator.generate(secret));
      const session = { sessionId: "session-1", user: { id: PLATFORM_ADMIN, organization: "IST Tech" }, activeRole: "platform_super_administrator" } as never;

      const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
      for (let i = 0; i < 3; i += 1) {
        await expect(requestElevation(session, "000000")).rejects.toThrow();
      }
      const emitted = consoleSpy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes("SECURITY_ANOMALY_DETECTED"));
      expect(emitted.some((line) => line.includes('"signalType":"PAM_ELEVATION_DENIED"'))).toBe(true);
      consoleSpy.mockRestore();
    } finally {
      delete process.env.AUTH_ANOMALY_FAILURE_THRESHOLD;
    }
  });
});

describe("CSQ AR.21 / NFR-118 - real PostgreSQL integration path", () => {
  const ORIGINAL_FLAG = process.env.SECURITY_ANOMALY_DB_PERSISTENCE;

  beforeEach(async () => {
    process.env.SECURITY_ANOMALY_DB_PERSISTENCE = "true";
    await prisma.securityAnomalyEvent.deleteMany({ where: { scopeKey: "test-real-db-user" } });
  });

  afterEach(async () => {
    await prisma.securityAnomalyEvent.deleteMany({ where: { scopeKey: "test-real-db-user" } });
    if (ORIGINAL_FLAG === undefined) delete process.env.SECURITY_ANOMALY_DB_PERSISTENCE;
    else process.env.SECURITY_ANOMALY_DB_PERSISTENCE = ORIGINAL_FLAG;
  });

  it("records real rows in Postgres and returns a combined count across calls (simulating 2 instances)", async () => {
    const first = await recordAndCountSecurityAnomalyEvents({
      signalType: "AUTH_FAILURE",
      scopeKey: "test-real-db-user",
      organization: "IST Tech",
      windowSeconds: 300
    });
    expect(first.persisted).toBe(true);
    expect(first.count).toBe(1);

    const second = await recordAndCountSecurityAnomalyEvents({
      signalType: "AUTH_FAILURE",
      scopeKey: "test-real-db-user",
      organization: "IST Tech",
      windowSeconds: 300
    });
    expect(second.count).toBe(2);

    const rows = await prisma.securityAnomalyEvent.findMany({ where: { scopeKey: "test-real-db-user" } });
    expect(rows.length).toBe(2);
  });

  it("expires events outside the window (real DB cleanup)", async () => {
    await prisma.securityAnomalyEvent.create({
      data: {
        signalType: "AUTH_FAILURE",
        scopeKey: "test-real-db-user",
        timestamp: new Date(Date.now() - 10 * 60 * 1000)
      }
    });
    const result = await recordAndCountSecurityAnomalyEvents({
      signalType: "AUTH_FAILURE",
      scopeKey: "test-real-db-user",
      windowSeconds: 300
    });
    // The stale row (10 min old) is outside a 5-minute window and should
    // have been cleaned up, leaving only this call's own new row.
    expect(result.count).toBe(1);
  });
});
