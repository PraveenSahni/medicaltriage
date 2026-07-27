import request from "supertest";
import { createApp } from "../src/app.js";
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
});
