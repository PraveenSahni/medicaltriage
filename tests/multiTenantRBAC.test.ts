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

// All named demo users (Layla/Fatima/Sara/Khalid/etc) now share a single
// tenant (IST_TECH) - real deployments here run one organization, and
// splitting demo accounts across PHCC/HMC/SIDRA caused generator-created
// calls to land in a different org than the nurse claiming them could see,
// producing orphaned cross-org queue records. Multi-tenant RBAC coverage
// below still exercises the real segregation/escalation logic, just against
// ad hoc HRMS-synced test identities scoped to distinct orgs (the same
// mechanism the second test in this file already used), not demo accounts.
async function syncOrgScopedNurse(
  manager: Awaited<ReturnType<typeof agentFor>>,
  employeeId: string,
  email: string,
  organizationCode: string,
  role: string,
  jobTitle: string
) {
  await manager
    .post("/api/v1/hrms/sync-users")
    .send({
      source: "oracle-fusion-hcm-test",
      employees: [
        {
          employeeId,
          email,
          fullName: jobTitle,
          organizationCode,
          jobTitle,
          roles: [role],
          employmentStatus: "Active"
        }
      ]
    })
    .expect(200);
  return agentFor(email, role);
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
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const phccNurse = await syncOrgScopedNurse(
      manager,
      "IST-19001",
      "test.phcc.nurse@irisstar.tech",
      "PHCC",
      "remote_triage_nurse",
      "Remote Triage Nurse"
    );
    const hmcNurse = await syncOrgScopedNurse(
      manager,
      "IST-19002",
      "test.hmc.nurse@irisstar.tech",
      "HMC",
      "senior_triage_nurse",
      "Senior Triage Nurse"
    );

    // The global seed queue is now single-tenant (org_ist_tech), matching
    // real demo user assignments - so this test creates its own org-diverse
    // calls explicitly (organizationId is caller-specifiable for manager
    // roles, per QueueCreateRequestSchema) rather than relying on seed data.
    await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        organizationId: "org_phcc",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Test PHCC-scoped call for tenant segregation check."
      })
      .expect(201);
    await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        organizationId: "org_hmc",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Test HMC-scoped call for tenant segregation check."
      })
      .expect(201);

    const phccQueue = await phccNurse.get("/api/v1/queue").expect(200);
    const hmcQueue = await hmcNurse.get("/api/v1/queue").expect(200);

    expect(phccQueue.body.queue.length).toBeGreaterThan(0);
    expect(hmcQueue.body.queue.length).toBeGreaterThan(0);
    expect(phccQueue.body.queue.every((item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_phcc")).toBe(true);
    expect(hmcQueue.body.queue.every((item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_hmc")).toBe(true);
    expect(phccQueue.body.queue.some((item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_hmc")).toBe(false);
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
            email: "hrms.phcc.nurse@irisstar.tech",
            fullName: "HRMS PHCC Nurse",
            organizationCode: "IST_TECH",
            jobTitle: "Remote Triage Nurse",
            employmentStatus: "Active"
          }
        ]
      })
      .expect(200);

    const nurse = await agentFor("hrms.phcc.nurse@irisstar.tech", "remote_triage_nurse");
    const claim = await nurse.post("/api/v1/queue/case-10002/claim").expect(200);
    expect(claim.body.item.lockedBy).toBe("usr_hrms_ist_18001");

    const sync = await manager
      .post("/api/v1/hrms/sync-users")
      .send({
        source: "oracle-fusion-hcm-test",
        employees: [
          {
            employeeId: "IST-18001",
            email: "hrms.phcc.nurse@irisstar.tech",
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
        username: "hrms.phcc.nurse@irisstar.tech",
        password: TEST_ADMIN_PASSWORD,
        simulateRole: "remote_triage_nurse"
      })
      .expect(403);

    const admin = await agentFor("pa@irisstar.tech", "platform_super_administrator");
    const released = await admin.get("/api/v1/queue/case-10002").expect(200);
    expect(released.body.item.lockedBy).toBeUndefined();
    expect(released.body.item.status).toBe("INCOMING");
  });

  it("allows a PHCC nurse to hand over an escalated card to HMC with a signed audit log", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const phccNurse = await syncOrgScopedNurse(
      manager,
      "IST-19003",
      "test.phcc.nurse2@irisstar.tech",
      "PHCC",
      "remote_triage_nurse",
      "Remote Triage Nurse"
    );
    const hmcNurse = await syncOrgScopedNurse(
      manager,
      "IST-19004",
      "test.hmc.nurse2@irisstar.tech",
      "HMC",
      "senior_triage_nurse",
      "Senior Triage Nurse"
    );

    // Seed data is single-tenant (org_ist_tech) now - create a fresh
    // PHCC-scoped call explicitly for this cross-org escalation scenario.
    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        organizationId: "org_phcc",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Pediatric red flag needing HMC emergency escalation coordination."
      })
      .expect(201);
    const caseId = created.body.item.id as string;

    await phccNurse.post(`/api/v1/queue/${caseId}/claim`).expect(200);
    const handover = await phccNurse
      .post(`/api/v1/queue/${caseId}/escalate`)
      .send({
        targetOrganizationId: "org_hmc",
        targetOrganizationCode: "HMC",
        reason: "Pediatric red flag needs HMC emergency escalation coordination."
      })
      .expect(200);

    expect(handover.body.item).toMatchObject({
      id: caseId,
      targetOrganizationId: "org_hmc",
      status: "INCOMING"
    });
    expect(handover.body.item.transitionLogs[0]).toMatchObject({
      actorId: "usr_hrms_ist_19003",
      actorOrganizationId: "org_phcc",
      targetOrganizationId: "org_hmc",
      eventType: "ESCALATION_HANDOVER",
      auditSignature: expect.any(String)
    });

    const phccQueue = await phccNurse.get("/api/v1/queue").expect(200);
    expect(phccQueue.body.queue.some((item: { id: string }) => item.id === caseId)).toBe(false);

    const hmcQueue = await hmcNurse.get("/api/v1/queue").expect(200);
    expect(hmcQueue.body.queue.some((item: { id: string }) => item.id === caseId)).toBe(true);
  });
});
