import request from "supertest";
import { createApp } from "../src/app.js";
import { resetQueueStoreForTests } from "../src/services/queueOrchestration.js";
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

// Single-tenant deployment: exactly one organization (org_ist_tech) exists -
// see securityAdmin.ts's organizationDirectory. HMC/PHCC/SIDRA are real
// Qatar hospitals used only as disposition/destination routing targets
// (dispositionCode/destinationName), never as tenants. Cross-tenant
// segregation/escalation tests were removed along with the second tenant
// fixture per explicit product decision - this suite now only covers the
// HRMS-driven session/lock lifecycle, which doesn't depend on tenant count.
describe("HRMS-driven session and queue-lock lifecycle", () => {
  beforeEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
  });

  afterEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
  });

  it("uses HRMS status to revoke sessions, release locks, and block login", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    await manager
      .post("/api/v1/hrms/sync-users")
      .send({
        source: "oracle-fusion-hcm-test",
        employees: [
          {
            employeeId: "IST-18001",
            email: "hrms.nurse@irisstar.tech",
            fullName: "HRMS Nurse",
            organizationCode: "IST_TECH",
            jobTitle: "Remote Triage Nurse",
            employmentStatus: "Active"
          }
        ]
      })
      .expect(200);

    const nurse = await agentFor("hrms.nurse@irisstar.tech", "remote_triage_nurse");
    const claim = await nurse.post("/api/v1/queue/case-10002/claim").expect(200);
    expect(claim.body.item.lockedBy).toBe("usr_hrms_ist_18001");

    const sync = await manager
      .post("/api/v1/hrms/sync-users")
      .send({
        source: "oracle-fusion-hcm-test",
        employees: [
          {
            employeeId: "IST-18001",
            email: "hrms.nurse@irisstar.tech",
            fullName: "HRMS Nurse",
            organizationCode: "IST_TECH",
            jobTitle: "Remote Triage Nurse",
            employmentStatus: "On-Leave"
          }
        ]
      })
      .expect(200);

    expect(sync.body.summary).toMatchObject({
      processed: 1,
      disabled: 1,
      sessionsRevoked: 1,
      queueLocksReleased: 1
    });

    await nurse.get("/api/v1/auth/session").expect(401);
    await request(app)
      .post("/api/v1/auth/login")
      .send({
        username: "hrms.nurse@irisstar.tech",
        password: TEST_ADMIN_PASSWORD,
        simulateRole: "remote_triage_nurse"
      })
      .expect(403);

    const admin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const released = await admin.get("/api/v1/queue/case-10002").expect(200);
    expect(released.body.item.lockedBy).toBeUndefined();
    expect(released.body.item.status).toBe("INCOMING");
  });
});
