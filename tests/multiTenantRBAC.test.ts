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

describe("Multi-tenant named-user queue and HRMS directory controls", () => {
  beforeEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
  });

  afterEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
  });

  it("segregates queue cards by authenticated organization", async () => {
    const phccNurse = await agentFor("nurse@ist.local", "remote_triage_nurse");
    const hmcNurse = await agentFor("senior.nurse@ist.local", "senior_triage_nurse");

    const phccQueue = await phccNurse.get("/api/v1/queue").expect(200);
    const hmcQueue = await hmcNurse.get("/api/v1/queue").expect(200);

    expect(phccQueue.body.queue.length).toBeGreaterThan(0);
    expect(hmcQueue.body.queue.length).toBeGreaterThan(0);
    expect(phccQueue.body.queue.every((item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_phcc")).toBe(true);
    expect(hmcQueue.body.queue.every((item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_hmc")).toBe(true);
    expect(phccQueue.body.queue.some((item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_hmc")).toBe(false);
  });

  it("uses HRMS status to revoke sessions, release locks, and block login", async () => {
    const manager = await agentFor("triage.manager@ist.local", "triage_service_manager");
    await manager
      .post("/api/v1/hrms/sync-users")
      .send({
        source: "oracle-fusion-hcm-test",
        employees: [
          {
            employeeId: "IST-18001",
            email: "hrms.phcc.nurse@ist.local",
            fullName: "HRMS PHCC Nurse",
            organizationCode: "PHCC",
            jobTitle: "Remote Triage Nurse",
            employmentStatus: "Active"
          }
        ]
      })
      .expect(200);

    const nurse = await agentFor("hrms.phcc.nurse@ist.local", "remote_triage_nurse");
    const claim = await nurse.post("/api/v1/queue/case-10002/claim").expect(200);
    expect(claim.body.item.lockedBy).toBe("usr_hrms_ist_18001");

    const sync = await manager
      .post("/api/v1/hrms/sync-users")
      .send({
        source: "oracle-fusion-hcm-test",
        employees: [
          {
            employeeId: "IST-18001",
            email: "hrms.phcc.nurse@ist.local",
            fullName: "HRMS PHCC Nurse",
            organizationCode: "PHCC",
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
        username: "hrms.phcc.nurse@ist.local",
        password: TEST_ADMIN_PASSWORD,
        simulateRole: "remote_triage_nurse"
      })
      .expect(403);

    const admin = await agentFor("admin@ist.local", "platform_super_administrator");
    const released = await admin.get("/api/v1/queue/case-10002").expect(200);
    expect(released.body.item.lockedBy).toBeUndefined();
    expect(released.body.item.status).toBe("INCOMING");
  });

  it("allows a PHCC nurse to hand over an escalated card to HMC with a signed audit log", async () => {
    const phccNurse = await agentFor("nurse@ist.local", "remote_triage_nurse");
    const hmcNurse = await agentFor("senior.nurse@ist.local", "senior_triage_nurse");

    await phccNurse.post("/api/v1/queue/case-10002/claim").expect(200);
    const handover = await phccNurse
      .post("/api/v1/queue/case-10002/escalate")
      .send({
        targetOrganizationId: "org_hmc",
        targetOrganizationCode: "HMC",
        reason: "Pediatric red flag needs HMC emergency escalation coordination."
      })
      .expect(200);

    expect(handover.body.item).toMatchObject({
      id: "case-10002",
      targetOrganizationId: "org_hmc",
      status: "INCOMING"
    });
    expect(handover.body.item.transitionLogs[0]).toMatchObject({
      actorId: "usr_nurse_10001",
      actorOrganizationId: "org_phcc",
      targetOrganizationId: "org_hmc",
      eventType: "ESCALATION_HANDOVER",
      auditSignature: expect.any(String)
    });

    const phccQueue = await phccNurse.get("/api/v1/queue").expect(200);
    expect(phccQueue.body.queue.some((item: { id: string }) => item.id === "case-10002")).toBe(false);

    const hmcQueue = await hmcNurse.get("/api/v1/queue").expect(200);
    expect(hmcQueue.body.queue.some((item: { id: string }) => item.id === "case-10002")).toBe(true);
  });
});
