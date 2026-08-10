import { authenticator } from "otplib";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import {
  confirmMfaEnrollment,
  enrollMfa,
  getAccessRevocationMetricsReport,
  grantPermissionToRole,
  listActiveSessionsForUser,
  resetSecurityStoreForTests,
  revokePermissionFromRole,
  revokeSessionById,
  setDirectoryStatusForEmployee,
  updateUserAccountStatus
} from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

const PLATFORM_ADMIN = "usr_platform_admin_10001";
const SYSTEM_ADMIN = "usr_senior_nurse_10001";
const NURSE = "usr_nurse_10001";
const NURSE_EMPLOYEE_ID = "IST-10001";

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({ username, password: TEST_ADMIN_PASSWORD, simulateRole })
    .expect(200);
  return agent;
}

async function elevate(agent: request.Agent, userId: string) {
  const { secret } = enrollMfa(userId);
  confirmMfaEnrollment(userId, authenticator.generate(secret));
  await agent.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);
}

describe("CSQ IS.13 - access-revocation timing metrics", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("records a duration for a successful account status change (revocation)", async () => {
    await updateUserAccountStatus(SYSTEM_ADMIN, "suspended", {
      userId: PLATFORM_ADMIN,
      reason: "test suspension"
    });
    const report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.completedCount).toBe(1);
    expect(report.byType.ACCOUNT_STATUS_CHANGE.completed).toBe(1);
    expect(report.maxDurationMs).not.toBeNull();
    expect(report.maxDurationMs!).toBeGreaterThanOrEqual(0);
  });

  it("records a duration for a role-permission revoke, not for a grant", async () => {
    await grantPermissionToRole("remote_triage_nurse", "reports.view", {
      userId: PLATFORM_ADMIN,
      activeRole: "platform_super_administrator",
      reason: "test grant"
    });
    let report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.completedCount).toBe(0);

    await revokePermissionFromRole("remote_triage_nurse", "reports.view", {
      userId: PLATFORM_ADMIN,
      activeRole: "platform_super_administrator",
      reason: "test revoke"
    });
    report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.completedCount).toBe(1);
    expect(report.byType.ROLE_PERMISSION_REVOKE.completed).toBe(1);
  });

  it("records a duration for single-session termination", async () => {
    const agent = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const sessions = listActiveSessionsForUser(NURSE);
    expect(sessions.length).toBeGreaterThan(0);
    await revokeSessionById(sessions[0].sessionId, { userId: PLATFORM_ADMIN, activeRole: "platform_super_administrator" });

    const report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.byType.SESSION_TERMINATION.completed).toBe(1);
    void agent;
  });

  it("records a failure outcome for a session that no longer exists", async () => {
    await expect(
      revokeSessionById("nonexistent-session-id", { userId: PLATFORM_ADMIN, activeRole: "platform_super_administrator" })
    ).rejects.toThrow();
    const report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.failedCount).toBe(1);
    expect(report.completedCount).toBe(0);
  });

  it("records a duration for HRMS/JML-driven deprovisioning", async () => {
    await setDirectoryStatusForEmployee(NURSE_EMPLOYEE_ID, "inactive");
    const report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.byType.JML_DEPROVISION.completed).toBe(1);
  });

  it("computes p50/p95/max across multiple revocations", async () => {
    await updateUserAccountStatus(SYSTEM_ADMIN, "suspended", { userId: PLATFORM_ADMIN, reason: "r1" });
    await updateUserAccountStatus(SYSTEM_ADMIN, "active", { userId: PLATFORM_ADMIN, reason: "r2 (reactivate, no metric)" });
    await setDirectoryStatusForEmployee(NURSE_EMPLOYEE_ID, "inactive");

    const report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.completedCount).toBe(2);
    expect(report.p50DurationMs).not.toBeNull();
    expect(report.p95DurationMs).not.toBeNull();
    expect(report.maxDurationMs).not.toBeNull();
    expect(report.p95DurationMs!).toBeGreaterThanOrEqual(report.p50DurationMs!);
  });

  it("returns an explicit empty-period result, not an error, when nothing was recorded", () => {
    const report = getAccessRevocationMetricsReport({ days: 1 });
    expect(report.completedCount).toBe(0);
    expect(report.failedCount).toBe(0);
    expect(report.p50DurationMs).toBeNull();
    expect(report.dataComplete).toBe(false);
    expect(report.note).toMatch(/No access-removal operations recorded/);
  });

  it("scopes the report to one organization when requested", async () => {
    await updateUserAccountStatus(SYSTEM_ADMIN, "suspended", { userId: PLATFORM_ADMIN, reason: "r1" });
    const matching = getAccessRevocationMetricsReport({ days: 1, organization: "IST Tech" });
    expect(matching.completedCount).toBe(1);
    const nonMatching = getAccessRevocationMetricsReport({ days: 1, organization: "A Different Org" });
    expect(nonMatching.completedCount).toBe(0);
  });

  it("does not report a real target/SLA, only measured performance", () => {
    const report = getAccessRevocationMetricsReport({ days: 30 });
    expect(report.note).not.toMatch(/target.*minutes|SLA.*guaranteed/i);
    expect((report as unknown as Record<string, unknown>).targetMs).toBeUndefined();
  });

  it("requires audit.events.view permission to read the report over HTTP", async () => {
    const agent = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await agent.get("/api/v1/admin/access-revocation-metrics").expect(403);
  });

  it("serves the report over HTTP for a platform administrator", async () => {
    const agent = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(agent, PLATFORM_ADMIN);
    await updateUserAccountStatus(SYSTEM_ADMIN, "suspended", { userId: PLATFORM_ADMIN, reason: "http test" });
    const res = await agent.get("/api/v1/admin/access-revocation-metrics?days=7").expect(200);
    expect(res.body.completedCount).toBe(1);
    expect(res.body.byType.ACCOUNT_STATUS_CHANGE.completed).toBe(1);
  });

  it("never includes credentials, tokens, or session values in a recorded metric", async () => {
    await updateUserAccountStatus(SYSTEM_ADMIN, "suspended", { userId: PLATFORM_ADMIN, reason: "sensitive-data check" });
    const report = getAccessRevocationMetricsReport({ days: 1 });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toMatch(/password|secret|token|sessionId/i);
  });
});
