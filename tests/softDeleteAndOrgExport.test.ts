import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { resetQueueStoreForTests } from "../src/services/queueOrchestration.js";
import { confirmMfaEnrollment, enrollMfa, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";
import { authenticator } from "otplib";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();
const SYS_ADMIN_ID = "usr_platform_admin_10001";

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

async function elevate(agent: request.Agent) {
  const { secret } = enrollMfa(SYS_ADMIN_ID);
  confirmMfaEnrollment(SYS_ADMIN_ID, authenticator.generate(secret));
  await agent.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);
}

// NFR-011 (soft-delete, real audit-lifecycle retention) and CO.13/LG.04
// (org-scoped data export/isolation) - both closed 2026-08-05.
describe("Queue-item soft delete and org-scoped export", () => {
  beforeEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("excludes a deleted item from the normal queue listing but keeps it exportable via org export", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10002",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Soft-delete regression test call."
      })
      .expect(201);
    const caseId = created.body.item.id as string;
    const organizationId = created.body.item.organizationId as string;

    await manager.delete(`/api/v1/queue/${caseId}`).expect(204);

    const listing = await manager.get("/api/v1/queue").expect(200);
    expect(listing.body.queue.some((item: { id: string }) => item.id === caseId)).toBe(false);

    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(sysAdmin);
    const orgExport = await sysAdmin.get(`/api/v1/admin/organizations/${organizationId}/export`).expect(200);
    expect(orgExport.headers["content-disposition"]).toMatch(/attachment; filename="ist-health-org-export-/);
    // A soft-deleted item stays traceable at the database layer (NFR-011),
    // but the org-export path intentionally excludes it too - a genuinely
    // deleted record should not resurface via a data-portability export.
    expect(orgExport.body.queueItems.some((item: { id: string }) => item.id === caseId)).toBe(false);
  });

  it("org export includes a real, non-deleted item for that organization", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10003",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Org export regression test call."
      })
      .expect(201);
    const caseId = created.body.item.id as string;
    const organizationId = created.body.item.organizationId as string;

    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    await elevate(sysAdmin);
    const orgExport = await sysAdmin.get(`/api/v1/admin/organizations/${organizationId}/export`).expect(200);
    expect(orgExport.body.queueItems.some((item: { id: string }) => item.id === caseId)).toBe(true);
  });

  it("requires PAM elevation for the org export endpoint", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const response = await sysAdmin.get("/api/v1/admin/organizations/org_ist_tech/export").expect(403);
    expect(response.body).toMatchObject({ elevationRequired: true });
  });
});
