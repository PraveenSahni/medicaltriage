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

describe("Role-permission mutation (Admin RBAC)", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  afterEach(() => {
    resetSecurityStoreForTests();
  });

  it("requires admin.roles.manage - a role without it is forbidden", async () => {
    const helpdesk = await agentFor("helpdesk@irisstar.tech", "helpdesk_support");
    await helpdesk
      .post("/api/v1/admin/roles/remote_triage_nurse/permissions")
      .send({ permissionCode: "reports.view", reason: "test" })
      .expect(403);
  });

  it("grants a permission to a role, visible immediately via GET /roles", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");

    const before = await sysAdmin.get("/api/v1/admin/roles").expect(200);
    const nurseBefore = before.body.roles.find((r: { code: string }) => r.code === "remote_triage_nurse");
    expect(nurseBefore.permissions).not.toContain("reports.view");

    const granted = await sysAdmin
      .post("/api/v1/admin/roles/remote_triage_nurse/permissions")
      .send({ permissionCode: "reports.view", reason: "give nurses read-only report access" })
      .expect(200);
    expect(granted.body.role.permissions).toContain("reports.view");

    const after = await sysAdmin.get("/api/v1/admin/roles").expect(200);
    const nurseAfter = after.body.roles.find((r: { code: string }) => r.code === "remote_triage_nurse");
    expect(nurseAfter.permissions).toContain("reports.view");
  });

  it("revokes a permission from a role, reflected via GET /roles", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");

    const revoked = await sysAdmin
      .delete("/api/v1/admin/roles/remote_triage_nurse/permissions/triage.workspace.view")
      .send({ reason: "temporary lockout during investigation" })
      .expect(200);
    expect(revoked.body.role.permissions).not.toContain("triage.workspace.view");

    const after = await sysAdmin.get("/api/v1/admin/roles").expect(200);
    const nurseAfter = after.body.roles.find((r: { code: string }) => r.code === "remote_triage_nurse");
    expect(nurseAfter.permissions).not.toContain("triage.workspace.view");
  });

  it("revokes already-active sessions of the affected role - not just a cosmetic change", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

    // Confirm the nurse's session works before the mutation.
    await nurse.get("/api/v1/queue").expect(200);

    await sysAdmin
      .delete("/api/v1/admin/roles/remote_triage_nurse/permissions/triage.workspace.view")
      .send({ reason: "regression test: session must be revoked" })
      .expect(200);

    // The nurse's pre-existing session must no longer be usable, since its
    // permissions were a snapshot taken at login.
    await nurse.get("/api/v1/queue").expect(401);
  });

  it("blocks revoking admin.roles.manage from the actor's own currently-active role (self-lockout)", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");

    await sysAdmin
      .delete("/api/v1/admin/roles/system_administrator/permissions/admin.roles.manage")
      .send({ reason: "attempting self-lockout" })
      .expect(409);
  });

  it("returns 404 for an unknown role code", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    await sysAdmin
      .post("/api/v1/admin/roles/not_a_real_role/permissions")
      .send({ permissionCode: "reports.view", reason: "test" })
      .expect(404);
  });

  it("returns 404 for an unknown permission code", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    await sysAdmin
      .post("/api/v1/admin/roles/remote_triage_nurse/permissions")
      .send({ permissionCode: "not.a.real.permission", reason: "test" })
      .expect(404);
  });

  it("rejects an invalid request body", async () => {
    const sysAdmin = await agentFor("sa@irisstar.tech", "system_administrator");
    await sysAdmin
      .post("/api/v1/admin/roles/remote_triage_nurse/permissions")
      .send({ permissionCode: "", reason: "" })
      .expect(400);
  });
});
