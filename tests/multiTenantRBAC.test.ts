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

// All named demo users (Layla/Fatima/Sara/Khalid/etc) share the one real
// tenant (org_ist_tech) - real deployments here run a single organization.
// HMC/PHCC/SIDRA are real Qatar hospitals used only as disposition/
// destination routing targets (dispositionCode/destinationName), never as
// tenants - listing them in the tenant directory previously caused
// generator-created calls to land in a different "org" than the nurse
// claiming them could see, producing orphaned cross-org queue records.
// Multi-tenant RBAC coverage below still exercises the real segregation/
// escalation logic, against org_ist_tech (the real tenant) and
// org_test_tenant_b (a second tenant that exists only as a test fixture -
// see securityAdmin.ts's organizationDirectory).
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
    const tenantANurse = await syncOrgScopedNurse(
      manager,
      "IST-19001",
      "test.tenant-a.nurse@irisstar.tech",
      "IST_TECH",
      "remote_triage_nurse",
      "Remote Triage Nurse"
    );
    const tenantBNurse = await syncOrgScopedNurse(
      manager,
      "IST-19002",
      "test.tenant-b.nurse@irisstar.tech",
      "TEST_TENANT_B",
      "senior_triage_nurse",
      "Senior Triage Nurse"
    );

    // The global seed queue is single-tenant (org_ist_tech) - this test
    // creates its own second-tenant call explicitly (organizationId is
    // caller-specifiable for manager roles, per QueueCreateRequestSchema)
    // rather than relying on seed data.
    await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        organizationId: "org_ist_tech",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Test tenant-A-scoped call for tenant segregation check."
      })
      .expect(201);
    await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        organizationId: "org_test_tenant_b",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Test tenant-B-scoped call for tenant segregation check."
      })
      .expect(201);

    const tenantAQueue = await tenantANurse.get("/api/v1/queue").expect(200);
    const tenantBQueue = await tenantBNurse.get("/api/v1/queue").expect(200);

    expect(tenantAQueue.body.queue.length).toBeGreaterThan(0);
    expect(tenantBQueue.body.queue.length).toBeGreaterThan(0);
    expect(
      tenantAQueue.body.queue.every((item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_ist_tech")
    ).toBe(true);
    expect(
      tenantBQueue.body.queue.every(
        (item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_test_tenant_b"
      )
    ).toBe(true);
    expect(
      tenantAQueue.body.queue.some(
        (item: { targetOrganizationId?: string }) => item.targetOrganizationId === "org_test_tenant_b"
      )
    ).toBe(false);
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

    const admin = await agentFor("pa@irisstar.tech", "platform_super_administrator");
    const released = await admin.get("/api/v1/queue/case-10002").expect(200);
    expect(released.body.item.lockedBy).toBeUndefined();
    expect(released.body.item.status).toBe("INCOMING");
  });

  it("allows a tenant-A nurse to hand over an escalated card to tenant B with a signed audit log", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const tenantANurse = await syncOrgScopedNurse(
      manager,
      "IST-19003",
      "test.tenant-a.nurse2@irisstar.tech",
      "IST_TECH",
      "remote_triage_nurse",
      "Remote Triage Nurse"
    );
    const tenantBNurse = await syncOrgScopedNurse(
      manager,
      "IST-19004",
      "test.tenant-b.nurse2@irisstar.tech",
      "TEST_TENANT_B",
      "senior_triage_nurse",
      "Senior Triage Nurse"
    );

    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        organizationId: "org_ist_tech",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Pediatric red flag needing cross-tenant escalation coordination."
      })
      .expect(201);
    const caseId = created.body.item.id as string;

    await tenantANurse.post(`/api/v1/queue/${caseId}/claim`).expect(200);
    const handover = await tenantANurse
      .post(`/api/v1/queue/${caseId}/escalate`)
      .send({
        targetOrganizationId: "org_test_tenant_b",
        targetOrganizationCode: "TEST_TENANT_B",
        reason: "Pediatric red flag needs cross-tenant emergency escalation coordination."
      })
      .expect(200);

    expect(handover.body.item).toMatchObject({
      id: caseId,
      targetOrganizationId: "org_test_tenant_b",
      status: "INCOMING"
    });
    expect(handover.body.item.transitionLogs[0]).toMatchObject({
      actorId: "usr_hrms_ist_19003",
      actorOrganizationId: "org_ist_tech",
      targetOrganizationId: "org_test_tenant_b",
      eventType: "ESCALATION_HANDOVER",
      auditSignature: expect.any(String)
    });

    const tenantAQueue = await tenantANurse.get("/api/v1/queue").expect(200);
    expect(tenantAQueue.body.queue.some((item: { id: string }) => item.id === caseId)).toBe(false);

    const tenantBQueue = await tenantBNurse.get("/api/v1/queue").expect(200);
    expect(tenantBQueue.body.queue.some((item: { id: string }) => item.id === caseId)).toBe(true);
  });
});
