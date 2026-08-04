import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

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

    const reveal = await privacyOfficer
      .post("/api/v1/admin/reveal")
      .send({
        userId: "usr_privacy_10001",
        resourceType: "ApplicationUser",
        resourceId: "usr_nurse_10001",
        field: "email",
        purpose: "Privacy investigation for named-user access review"
      })
      .expect(200);
    expect(reveal.body).toMatchObject({ decision: "approved", value: "layla@irisstar.tech" });
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

      await sysAdmin
        .patch("/api/v1/admin/users/usr_system_admin_10001/status")
        .send({ status: "suspended", reason: "attempting self-suspend" })
        .expect(409);
    });

    it("allows an account to reactivate itself back to active (not a lockout risk)", async () => {
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");

      await sysAdmin
        .patch("/api/v1/admin/users/usr_system_admin_10001/status")
        .send({ status: "active", reason: "self-reactivation is harmless" })
        .expect(200);
    });

    it("returns 404 for a non-existent user id", async () => {
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await sysAdmin
        .patch("/api/v1/admin/users/usr_does_not_exist/status")
        .send({ status: "suspended", reason: "test" })
        .expect(404);
    });

    it("rejects an invalid status value", async () => {
      const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
      await sysAdmin
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "not-a-real-status", reason: "test" })
        .expect(400);
    });
  });
});
