import request from "supertest";
import { createApp } from "../src/app.js";
import { resetQueueStoreForTests } from "../src/services/queueOrchestration.js";
import { resetSecurityStoreForTests, upsertDirectoryUserFromHrms } from "../src/services/securityAdmin.js";

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

describe("Enterprise queue orchestration", () => {
  beforeEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
  });

  it("locks a board case for Step cockpit handoff", async () => {
    const nurse = await agentFor("nurse@ist.local", "remote_triage_nurse");

    const claim = await nurse.post("/api/v1/queue/case-10002/claim").expect(200);

    expect(claim.body.item).toMatchObject({
      id: "case-10002",
      status: "IN_PROCESS",
      assignedNurseId: "usr_nurse_10001",
      lockedBy: "usr_nurse_10001"
    });
    expect(claim.body.item.lockExpiresAtIso).toEqual(expect.any(String));

    const loaded = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(loaded.body.item.lockedBy).toBe("usr_nurse_10001");
  });

  it("blocks call intake from editing vitals or clinical context", async () => {
    const intake = await agentFor("intake@ist.local", "call_intake_coordinator");

    const response = await intake
      .patch("/api/v1/queue/case-10002/context")
      .send({
        vitals: {
          heartRate: 80,
          respiratoryRate: 16,
          spo2: 99,
          temperature: 36.8,
          consciousLevel: "alert"
        }
      })
      .expect(403);

    expect(response.body.code).toBe("QUEUE_ROLE_DENIED");
  });

  it("rejects direct completion when clinical prerequisites are missing", async () => {
    const nurse = await agentFor("nurse@ist.local", "remote_triage_nurse");
    await nurse.post("/api/v1/queue/case-10002/claim").expect(200);

    const response = await nurse
      .post("/api/v1/queue/case-10002/move")
      .send({
        toStatus: "COMPLETED",
        toStage: "SBAR",
        reason: "Attempted direct completion"
      })
      .expect(400);

    expect(response.body.code).toBe("QUEUE_SEQUENCE_BLOCKED");
  });

  it("prevents another nurse from taking an active lock", async () => {
    const nurseA = await agentFor("nurse@ist.local", "remote_triage_nurse");
    upsertDirectoryUserFromHrms({
      employeeId: "IST-10004",
      email: "phcc.backup.nurse@ist.local",
      fullName: "PHCC Backup Nurse",
      organizationCode: "PHCC",
      jobTitle: "Remote Triage Nurse",
      roles: ["remote_triage_nurse"]
    });
    const nurseB = await agentFor("phcc.backup.nurse@ist.local", "remote_triage_nurse");

    await nurseA.post("/api/v1/queue/case-10002/claim").expect(200);

    const blocked = await nurseB.post("/api/v1/queue/case-10002/claim").expect(423);
    expect(blocked.body.code).toBe("QUEUE_ITEM_LOCKED");
  });

  it("moves a new emergency vital-sign case to the top of the active queue", async () => {
    const manager = await agentFor("triage.manager@ist.local", "triage_service_manager");

    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-90001",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        department: "Flight Operations",
        jobTitle: "Pilot",
        summary: "New pilot call with initially routine symptoms.",
        slaMinutes: 1
      })
      .expect(201);

    const id = created.body.item.id as string;
    await manager
      .patch(`/api/v1/queue/${id}/context`)
      .send({
        vitals: {
          heartRate: 145,
          respiratoryRate: 18,
          spo2: 88,
          temperature: 37.0,
          consciousLevel: "alert"
        }
      })
      .expect(200);

    const queue = await manager.get("/api/v1/queue").expect(200);
    expect(queue.body.queue[0]).toMatchObject({
      id,
      safetyFloorActive: true,
      calculatedSeverity: "EMERGENCY"
    });
  });
});
