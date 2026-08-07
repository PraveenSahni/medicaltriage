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

  it("allows the Privacy Officer reveal workspace without granting user administration", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");

    const modules = await privacyOfficer.get("/api/v1/admin/control-modules").expect(200);
    expect(modules.body.modules.map((module: { id: string }) => module.id)).toEqual(
      expect.arrayContaining(["privacy", "audit", "reports"])
    );
    expect(modules.body.modules.map((module: { id: string }) => module.id)).not.toContain("users");

    await privacyOfficer.get("/api/v1/admin/reveal-directory").expect(200);
    await privacyOfficer.get("/api/v1/admin/users").expect(403);

    // Real two-step approval-gated reveal: request -> a DISTINCT second
    // account approves -> the original requester fetches the value once.
    const requested = await privacyOfficer
      .post("/api/v1/admin/reveal/request")
      .send({
        resourceType: "ApplicationUser",
        resourceId: "usr_nurse_10001",
        field: "email",
        purpose: "Privacy investigation for named-user access review"
      })
      .expect(202);
    expect(requested.body).toMatchObject({ status: "pending" });
    const revealId = requested.body.id;

    const complianceAuditor = await agentFor("audit@irisstar.tech", "compliance_auditor");
    await complianceAuditor.post(`/api/v1/admin/reveal/${revealId}/decision`).send({ decision: "approved" }).expect(200);

    const fetched = await privacyOfficer.get(`/api/v1/admin/reveal/${revealId}/value`).expect(200);
    expect(fetched.body.value).toBe("layla@irisstar.tech");

    // Single-use: fetching again is rejected.
    await privacyOfficer.get(`/api/v1/admin/reveal/${revealId}/value`).expect(409);
  });

  it("blocks a Privacy Officer from approving their own reveal request", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");

    const requested = await privacyOfficer
      .post("/api/v1/admin/reveal/request")
      .send({
        resourceType: "ApplicationUser",
        resourceId: "usr_nurse_10001",
        field: "email",
        purpose: "Self-approval attempt"
      })
      .expect(202);

    await privacyOfficer
      .post(`/api/v1/admin/reveal/${requested.body.id}/decision`)
      .send({ decision: "approved" })
      .expect(409);
  });

  it("allows Integration Administrator connector status without user administration", async () => {
    const integrationAdmin = await agentFor("integration@irisstar.tech", "integration_administrator");

    const integrations = await integrationAdmin.get("/api/v1/admin/integrations").expect(200);
    expect(integrations.body.connectors.map((connector: { id: string }) => connector.id)).toEqual(
      expect.arrayContaining(["oracle-fusion-hrms", "emr-fhir-writeback"])
    );

    await integrationAdmin.get("/api/v1/admin/users").expect(403);
  });

  it("allows Reporting Analyst report catalog without access-template administration", async () => {
    const reportingAnalyst = await agentFor("reports@irisstar.tech", "reporting_analyst");

    const reports = await reportingAnalyst.get("/api/v1/admin/reports").expect(200);
    expect(reports.body.reports.length).toBeGreaterThan(0);
    await reportingAnalyst.get("/api/v1/admin/roles").expect(403);
  });

  it("reports feedback-summary as honestly unmeasured in mock mode", async () => {
    const reportingAnalyst = await agentFor("reports@irisstar.tech", "reporting_analyst");

    const summary = await reportingAnalyst.get("/api/v1/admin/feedback-summary").expect(200);
    expect(summary.body).toMatchObject({ measured: false, totalResponses: 0, averageRating: null });

    const remoteNurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await remoteNurse.get("/api/v1/admin/feedback-summary").expect(403);
  });

  it("reports feedback-trend as honestly unmeasured in mock mode, gated the same as feedback-summary", async () => {
    const reportingAnalyst = await agentFor("reports@irisstar.tech", "reporting_analyst");

    const trend = await reportingAnalyst.get("/api/v1/admin/feedback-trend").expect(200);
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
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");

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
      userId: "usr_system_admin_10001",
      activeRole: "system_administrator",
      organization: "",
      facility: "",
      department: "",
      action: "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED",
      module: "AccessGovernance",
      resource: "AccessEntitlementReview",
      purpose: "totalUsers=19 flagged=0",
      ipAddress: "",
      device: "",
      success: true,
      risk: "low"
    });

    const auditor = await agentFor("audit@irisstar.tech", "compliance_auditor");
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

  it("allows Helpdesk Support support queue only, not audit visibility", async () => {
    const helpdesk = await agentFor("helpdesk@irisstar.tech", "helpdesk_support");

    const support = await helpdesk.get("/api/v1/admin/support").expect(200);
    expect(support.body.tickets.length).toBeGreaterThan(0);
    await helpdesk.get("/api/v1/admin/audit-events").expect(403);
  });

  describe("PATCH /api/v1/admin/users/:id/status", () => {
    it("requires admin.users.manage - a role without it is forbidden", async () => {
      const helpdesk = await agentFor("helpdesk@irisstar.tech", "helpdesk_support");
      await helpdesk
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "suspended", reason: "test" })
        .expect(403);
    });

    it("suspends a real account and records an auditable status change", async () => {
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await elevate(sysAdmin, "usr_system_admin_10001");

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
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await elevate(sysAdmin, "usr_system_admin_10001");
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
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await elevate(sysAdmin, "usr_system_admin_10001");

      await sysAdmin
        .patch("/api/v1/admin/users/usr_system_admin_10001/status")
        .send({ status: "suspended", reason: "attempting self-suspend" })
        .expect(409);
    });

    it("allows an account to reactivate itself back to active (not a lockout risk)", async () => {
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await elevate(sysAdmin, "usr_system_admin_10001");

      await sysAdmin
        .patch("/api/v1/admin/users/usr_system_admin_10001/status")
        .send({ status: "active", reason: "self-reactivation is harmless" })
        .expect(200);
    });

    it("returns 404 for a non-existent user id", async () => {
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await elevate(sysAdmin, "usr_system_admin_10001");
      await sysAdmin
        .patch("/api/v1/admin/users/usr_does_not_exist/status")
        .send({ status: "suspended", reason: "test" })
        .expect(404);
    });

    it("rejects an invalid status value", async () => {
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await elevate(sysAdmin, "usr_system_admin_10001");
      await sysAdmin
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "not-a-real-status", reason: "test" })
        .expect(400);
    });
  });

  it("traces the real modification history for a specific resource (NFR-014)", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    await elevate(sysAdmin, "usr_system_admin_10001");

    await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "suspended", reason: "history trace test" })
      .expect(200);
    await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "active", reason: "history trace test reactivate" })
      .expect(200);

    const auditor = await agentFor("audit@irisstar.tech", "compliance_auditor");
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
    const auditor = await agentFor("audit@irisstar.tech", "compliance_auditor");
    const history = await auditor
      .get(`/api/v1/admin/audit-events/resource/${encodeURIComponent("UserAccount:usr_never_touched")}`)
      .expect(200);
    expect(history.body.events).toEqual([]);
  });
});
