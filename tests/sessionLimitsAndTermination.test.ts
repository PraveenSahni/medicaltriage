import { authenticator } from "otplib";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import {
  authenticateLocal,
  confirmMfaEnrollment,
  enrollMfa,
  getSession,
  resetSecurityStoreForTests
} from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();
const SYS_ADMIN_ID = "usr_platform_admin_10001";

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

// NFR-020 (configurable max concurrent sessions) and NFR-021 (terminate one
// specific session) - both closed 2026-08-05.
describe("Concurrent session limit and single-session termination", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("evicts the oldest session once MAX_CONCURRENT_SESSIONS_PER_USER is exceeded", async () => {
    const originalLimit = process.env.MAX_CONCURRENT_SESSIONS_PER_USER;
    process.env.MAX_CONCURRENT_SESSIONS_PER_USER = "2";
    try {
      const first = await authenticateLocal({
        username: "layla@irisstar.tech",
        password: "Layla@2026",
        rememberMe: false,
        simulateRole: "remote_triage_nurse",
        ipAddress: "127.0.0.1",
        device: "jest-1"
      });
      const second = await authenticateLocal({
        username: "layla@irisstar.tech",
        password: "Layla@2026",
        rememberMe: false,
        simulateRole: "remote_triage_nurse",
        ipAddress: "127.0.0.1",
        device: "jest-2"
      });
      const third = await authenticateLocal({
        username: "layla@irisstar.tech",
        password: "Layla@2026",
        rememberMe: false,
        simulateRole: "remote_triage_nurse",
        ipAddress: "127.0.0.1",
        device: "jest-3"
      });
      if (!first.ok || "mfaRequired" in first || !second.ok || "mfaRequired" in second || !third.ok || "mfaRequired" in third) {
        throw new Error("Expected all three logins to succeed immediately");
      }

      // Limit is 2, 3 logins happened - only the single oldest excess
      // session (first) is evicted, leaving exactly 2 (second, third).
      expect(getSession(first.session.sessionId)).toBeUndefined();
      expect(getSession(second.session.sessionId)).toBeDefined();
      expect(getSession(third.session.sessionId)).toBeDefined();
    } finally {
      if (originalLimit === undefined) {
        delete process.env.MAX_CONCURRENT_SESSIONS_PER_USER;
      } else {
        process.env.MAX_CONCURRENT_SESSIONS_PER_USER = originalLimit;
      }
    }
  });

  it("lists a user's active sessions and terminates exactly one, leaving others intact", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const nurseA = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

    const otherLogin = await authenticateLocal({
      username: "layla@irisstar.tech",
      password: "Layla@2026",
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "10.0.0.2",
      device: "jest-second-device"
    });
    if (!otherLogin.ok || "mfaRequired" in otherLogin) {
      throw new Error("Expected the second nurse login to succeed immediately");
    }

    const listed = await sysAdmin.get("/api/v1/admin/users/usr_nurse_10001/sessions").expect(200);
    expect(listed.body.sessions.length).toBeGreaterThanOrEqual(2);

    const { secret } = enrollMfa(SYS_ADMIN_ID);
    confirmMfaEnrollment(SYS_ADMIN_ID, authenticator.generate(secret));
    await sysAdmin.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);

    await sysAdmin.delete(`/api/v1/admin/sessions/${otherLogin.session.sessionId}`).expect(200);

    expect(getSession(otherLogin.session.sessionId)).toBeUndefined();
    await nurseA.get("/api/v1/queue").expect(200);
  });

  it("returns 404 for an unknown session id", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const { secret } = enrollMfa(SYS_ADMIN_ID);
    confirmMfaEnrollment(SYS_ADMIN_ID, authenticator.generate(secret));
    await sysAdmin.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);

    await sysAdmin.delete("/api/v1/admin/sessions/does-not-exist").expect(404);
  });
});
