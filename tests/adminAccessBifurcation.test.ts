import { randomUUID } from "node:crypto";
import { authenticator } from "otplib";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { confirmMfaEnrollment, enrollMfa, recordAuditEvent, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({
      username,
      password: TEST_ADMIN_PASSWORD,
      simulateRole
    })
    .expect(200);
  return agent;
}

// PATCH /users/:id/status now requires PAM elevation (closes NFR-180) -
// tests that mutate account status must elevate first, same real TOTP flow
// tests/pamElevation.test.ts exercises directly.
async function elevate(agent: request.Agent, userId: string) {
  const { secret } = enrollMfa(userId);
  confirmMfaEnrollment(userId, authenticator.generate(secret));
  await agent.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);
}

describe("Role-based Control Center bifurcation", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  afterEach(() => {
    resetSecurityStoreForTests();
  });

  it("allows Reporting-capable role report catalog without access-template administration", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");

    const reports = await manager.get("/api/v1/admin/reports").expect(200);
    expect(reports.body.reports.length).toBeGreaterThan(0);
    await manager.get("/api/v1/admin/roles").expect(403);
  });

  it("reports feedback-summary as honestly unmeasured in mock mode", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");

    const summary = await manager.get("/api/v1/admin/feedback-summary").expect(200);
    expect(summary.body).toMatchObject({ measured: false, totalResponses: 0, averageRating: null });

    const remoteNurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await remoteNurse.get("/api/v1/admin/feedback-summary").expect(403);
  });

  it("reports feedback-trend as honestly unmeasured in mock mode, gated the same as feedback-summary", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");

    const trend = await manager.get("/api/v1/admin/feedback-trend").expect(200);
    expect(trend.body).toMatchObject({
      measured: false,
      byContext: [],
      byRole: [],
      recentAverageRating: null,
      priorAverageRating: null
    });

    const remoteNurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await remoteNurse.get("/api/v1/admin/feedback-trend").expect(403);
  });

  it("lets a role with admin.roles.manage view and configure real security anomaly thresholds", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");

    const initial = await sysAdmin.get("/api/v1/admin/security-thresholds").expect(200);
    const authThreshold = initial.body.thresholds.find((t: { key: string }) => t.key === "AUTH_ANOMALY_FAILURE_THRESHOLD");
    expect(authThreshold).toMatchObject({ isOverridden: false });
    expect(authThreshold.value).toBeGreaterThan(0);

    const updated = await sysAdmin
      .patch("/api/v1/admin/security-thresholds/AUTH_ANOMALY_FAILURE_THRESHOLD")
      .send({ value: 25 })
      .expect(200);
    expect(updated.body.thresholds).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "AUTH_ANOMALY_FAILURE_THRESHOLD", value: 25, isOverridden: true })])
    );

    await sysAdmin.patch("/api/v1/admin/security-thresholds/AUTH_ANOMALY_FAILURE_THRESHOLD").send({ value: -5 }).expect(400);
    await sysAdmin.patch("/api/v1/admin/security-thresholds/NOT_A_REAL_KEY").send({ value: 5 }).expect(404);

    const remoteNurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await remoteNurse.get("/api/v1/admin/security-thresholds").expect(403);
  });

  it("lets a human stakeholder acknowledge a real access-entitlement-review certification (NFR-036)", async () => {
    const certificationId = randomUUID();
    await recordAuditEvent({
      id: certificationId,
      timestampIso: new Date().toISOString(),
      userId: "usr_platform_admin_10001",
      activeRole: "platform_super_administrator",
      organization: "",
      facility: "",
      department: "",
      action: "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED",
      module: "AccessGovernance",
      resource: "AccessEntitlementReview",
      purpose: "totalUsers=5 flagged=0",
      ipAddress: "",
      device: "",
      success: true,
      risk: "low"
    });

    const auditor = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const list = await auditor.get("/api/v1/admin/access-entitlement-reviews").expect(200);
    const review = list.body.reviews.find((r: { id: string }) => r.id === certificationId);
    expect(review).toMatchObject({ acknowledged: false });

    await auditor.post(`/api/v1/admin/access-entitlement-reviews/${certificationId}/acknowledge`).expect(200);

    const after = await auditor.get("/api/v1/admin/access-entitlement-reviews").expect(200);
    const reviewAfter = after.body.reviews.find((r: { id: string }) => r.id === certificationId);
    expect(reviewAfter).toMatchObject({ acknowledged: true });

    await auditor.post("/api/v1/admin/access-entitlement-reviews/not-a-real-id/acknowledge").expect(404);

    const remoteNurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await remoteNurse.get("/api/v1/admin/access-entitlement-reviews").expect(403);
  });

  it("keeps Remote Triage Nurse out of the Control Center despite reveal permission", async () => {
    const remoteNurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

    await remoteNurse.get("/api/v1/admin/control-modules").expect(403);
    await remoteNurse.get("/api/v1/admin/reveal-directory").expect(403);
  });

  describe("PATCH /api/v1/admin/users/:id/status", () => {
    it("requires admin.users.manage - a role without it is forbidden", async () => {
      const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
      await manager
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "suspended", reason: "test" })
        .expect(403);
    });

    it("suspends a real account and records an auditable status change", async () => {
      const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      await elevate(sysAdmin, "usr_platform_admin_10001");

      const updated = await sysAdmin
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "suspended", reason: "test-driven suspension" })
        .expect(200);
      expect(updated.body.user.accountStatus).toBe("suspended");

      const usersRes = await sysAdmin.get("/api/v1/admin/users").expect(200);
      const nurse = usersRes.body.users.find((u: { id: string }) => u.id === "usr_nurse_10001");
      expect(nurse.accountStatus).toBe("suspended");
    });

    it("revokes the account's already-active session when suspended - not just a cosmetic status flip", async () => {
      const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      await elevate(sysAdmin, "usr_platform_admin_10001");
      const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

      // Confirm the nurse's session works before suspension.
      await nurse.get("/api/v1/queue").expect(200);

      await sysAdmin
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "suspended", reason: "regression test: session must be revoked" })
        .expect(200);

      // The nurse's pre-existing session must no longer be usable.
      await nurse.get("/api/v1/queue").expect(401);
    });

    it("blocks an account from suspending itself (self-lockout protection)", async () => {
      const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      await elevate(sysAdmin, "usr_platform_admin_10001");

      await sysAdmin
        .patch("/api/v1/admin/users/usr_platform_admin_10001/status")
        .send({ status: "suspended", reason: "attempting self-suspend" })
        .expect(409);
    });

    it("allows an account to reactivate itself back to active (not a lockout risk)", async () => {
      const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      await elevate(sysAdmin, "usr_platform_admin_10001");

      await sysAdmin
        .patch("/api/v1/admin/users/usr_platform_admin_10001/status")
        .send({ status: "active", reason: "self-reactivation is harmless" })
        .expect(200);
    });

    it("returns 404 for a non-existent user id", async () => {
      const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      await elevate(sysAdmin, "usr_platform_admin_10001");
      await sysAdmin
        .patch("/api/v1/admin/users/usr_does_not_exist/status")
        .send({ status: "suspended", reason: "test" })
        .expect(404);
    });

    it("rejects an invalid status value", async () => {
      const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      await elevate(sysAdmin, "usr_platform_admin_10001");
      await sysAdmin
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "not-a-real-status", reason: "test" })
        .expect(400);
    });
  });

  it("traces the real modification history for a specific resource (NFR-014)", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(sysAdmin, "usr_platform_admin_10001");

    await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "suspended", reason: "history trace test" })
      .expect(200);
    await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "active", reason: "history trace test reactivate" })
      .expect(200);

    const auditor = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const history = await auditor
      .get(`/api/v1/admin/audit-events/resource/${encodeURIComponent("UserAccount:usr_nurse_10001")}`)
      .expect(200);

    expect(history.body.resource).toBe("UserAccount:usr_nurse_10001");
    expect(history.body.events.length).toBeGreaterThanOrEqual(2);
    const actions = history.body.events.map((event: { action: string }) => event.action);
    expect(actions).toContain("USER_ACCOUNT_STATUS_CHANGED");
    // Chronological order (oldest first) - a real trace, not just a dump.
    const timestamps = history.body.events.map((event: { timestampIso: string }) => event.timestampIso);
    expect(timestamps).toEqual([...timestamps].sort());
  });

  it("returns an empty history for a resource with no recorded events", async () => {
    const auditor = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const history = await auditor
      .get(`/api/v1/admin/audit-events/resource/${encodeURIComponent("UserAccount:usr_never_touched")}`)
      .expect(200);
    expect(history.body.events).toEqual([]);
  });

  it("supports opt-in limit/offset pagination on GET /admin/users, backward-compatible when omitted (NFR-144)", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");

    const full = await sysAdmin.get("/api/v1/admin/users").expect(200);
    expect(full.body.totalCount).toBe(full.body.users.length);

    const paged = await sysAdmin.get("/api/v1/admin/users?limit=2&offset=1").expect(200);
    expect(paged.body.users).toHaveLength(2);
    expect(paged.body.totalCount).toBe(full.body.totalCount);
    expect(paged.body.users).toEqual(full.body.users.slice(1, 3));
  });

  it("supports opt-in limit/offset pagination on GET /admin/audit-events, backward-compatible when omitted (NFR-144)", async () => {
    const auditor = await agentFor("khalid@irisstar.tech", "triage_service_manager");

    const full = await auditor.get("/api/v1/admin/audit-events").expect(200);
    expect(full.body.totalCount).toBe(full.body.events.length);

    const paged = await auditor.get("/api/v1/admin/audit-events?limit=1&offset=0").expect(200);
    expect(paged.body.events).toHaveLength(1);
    expect(paged.body.totalCount).toBe(full.body.totalCount);
  });
});
