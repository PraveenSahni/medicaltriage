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
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");

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

  it("auto-validates dependent identity and age before nurse workflow", async () => {
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");

    const loaded = await nurse.get("/api/v1/queue/case-10002").expect(200);

    expect(loaded.body.item).toMatchObject({
      id: "case-10002",
      istStaffId: "IST-1001",
      dependentId: "dep_ist_1001_child_02",
      identityValidated: true,
      identityValidationSource: "HRMS_AUTO",
      patientAge: {
        source: "dependent",
        calculatedFrom: "HRMS_DATE_OF_BIRTH"
      }
    });
    expect(loaded.body.item.patientAge.ageYears).toBeGreaterThanOrEqual(3);
    expect(loaded.body.item.patientAge.ageMonths).toBeGreaterThan(0);
  });

  it("prepares protocol suggestions from the reason narrative before nurse pickup", async () => {
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");

    const loaded = await nurse.get("/api/v1/queue/case-10002").expect(200);

    expect(loaded.body.item.reasonNarrative).toBe("Fever with fast breathing reported by parent.");
    expect(loaded.body.item.preparedProtocol).toMatchObject({
      status: "PREPARED",
      sourceType: "synthetic-sample",
      primaryProtocolId: "sample-fever-child",
      primaryProtocolTitle: "Fever - Child"
    });
    expect(loaded.body.item.preparedProtocol.extractedKeywords).toContain("fever");
    expect(loaded.body.item.preparedProtocol.acuityQuestionPreview[0]).toMatchObject({
      acuityOrder: 1,
      severity: "Emergency",
      redFlag: true
    });
    expect(loaded.body.item.stccProcess).toMatchObject({
      processName: "Telehealth Triage Encounter",
      averageDurationMinutes: "11-13",
      currentActionTab: "REASON_AND_EMERGENCY_RULE_OUT"
    });
    expect(loaded.body.item.stccProcess.canonicalSteps.map((step: { id: string }) => step.id)).toEqual([
      "OPENING_SCRIPT",
      "REASON_FOR_VISIT",
      "GUIDELINE_SELECTION",
      "INITIAL_ASSESSMENT_QUESTIONS",
      "TRIAGE_ASSESSMENT_QUESTIONS",
      "TELEMEDICINE_ELIGIBLE",
      "TRIAGE_DISPOSITION",
      "CARE_ADVICE",
      "HANDOFF_REFERRAL",
      "CLOSING_SCRIPT"
    ]);
    expect(loaded.body.item.preparedProtocol.ragShadow).toMatchObject({
      mode: "DRY_RUN_SHADOW",
      boundary: "APPROVED_CONTENT_ONLY",
      cannotDecideDisposition: true,
      requiresNurseReview: true,
      comparison: {
        deterministicPrimaryProtocolId: "sample-fever-child",
        shadowPrimaryProtocolId: "sample-fever-child",
        agreement: "FULL_MATCH"
      }
    });
    expect(loaded.body.item.preparedProtocol.ragShadow.prohibitedActionAcknowledgement).toEqual(
      expect.arrayContaining([
        "No invented questions",
        "No invented care advice",
        "No disposition decision authority",
        "No downgrade below deterministic safety floor"
      ])
    );
  });

  it("searches the clinical content packet for a new ankle injury call without auto-approving a protocol", async () => {
    const manager = await agentFor("manager@irisstar.tech", "triage_service_manager");

    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Twisted ankle while playing sport",
        slaMinutes: 10
      })
      .expect(201);

    expect(created.body.item).toMatchObject({
      status: "INCOMING",
      currentStage: "INTAKE",
      reasonNarrative: "Twisted ankle while playing sport",
      preparedProtocol: {
        status: "PREPARED",
        primaryProtocolId: "sample-ankle-foot-injury",
        primaryProtocolTitle: "Ankle and Foot Injury"
      }
    });
    expect(created.body.item.matchedProtocolId).toBeUndefined();
    expect(created.body.item.preparedProtocol.extractedKeywords).toEqual(
      expect.arrayContaining(["twisted", "ankle", "sport"])
    );
    expect(created.body.item.preparedProtocol.acuityQuestionPreview[0]).toMatchObject({
      acuityOrder: 1,
      severity: "Emergency"
    });
    expect(created.body.item.preparedProtocol.ragShadow).toMatchObject({
      mode: "DRY_RUN_SHADOW",
      boundary: "APPROVED_CONTENT_ONLY",
      query: "Twisted ankle while playing sport",
      cannotDecideDisposition: true,
      requiresNurseReview: true,
      comparison: {
        deterministicPrimaryProtocolId: "sample-ankle-foot-injury",
        shadowPrimaryProtocolId: "sample-ankle-foot-injury",
        agreement: "FULL_MATCH"
      }
    });
    expect(created.body.item.stccProcess.visibleActionTabs).toEqual([
      {
        id: "REASON_AND_EMERGENCY_RULE_OUT",
        label: "Reason and Emergency Rule-Out",
        mappedStepIds: ["OPENING_SCRIPT", "REASON_FOR_VISIT", "GUIDELINE_SELECTION", "INITIAL_ASSESSMENT_QUESTIONS"]
      },
      {
        id: "QUESTIONS",
        label: "Questions",
        mappedStepIds: ["INITIAL_ASSESSMENT_QUESTIONS", "TRIAGE_ASSESSMENT_QUESTIONS", "TELEMEDICINE_ELIGIBLE"]
      },
      {
        id: "DISPOSITION_AND_CARE_ADVICE",
        label: "Disposition and Care Advice",
        mappedStepIds: ["TRIAGE_DISPOSITION", "CARE_ADVICE", "HANDOFF_REFERRAL"]
      },
      {
        id: "SBAR_COMPLETE",
        label: "SBAR / Complete",
        mappedStepIds: ["HANDOFF_REFERRAL", "CLOSING_SCRIPT"]
      }
    ]);
  });

  it("blocks call intake from editing vitals or clinical context", async () => {
    const intake = await agentFor("intake@irisstar.tech", "call_intake_coordinator");

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
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
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

  it("allows the nurse to enter SBAR before recording final approval and copied-note evidence", async () => {
    const nurse = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
    await nurse.post("/api/v1/queue/case-10002/claim").expect(200);
    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({
        vitals: {
          heartRate: 135,
          respiratoryRate: 42,
          spo2: 91,
          temperature: 38.2,
          consciousLevel: "alert"
        },
        matchedProtocolId: "sample-fever-child",
        calculatedSeverity: "EMERGENCY",
        dispositionCode: "SIDRA_PEDIATRIC_ED",
        destinationName: "Sidra Medicine Emergency Department"
      })
      .expect(200);

    await nurse
      .post("/api/v1/queue/case-10002/move")
      .send({ toStage: "DISPOSITION", toStatus: "IN_PROCESS", reason: "Assessment completed" })
      .expect(200);

    const sbar = await nurse
      .post("/api/v1/queue/case-10002/move")
      .send({ toStage: "SBAR", toStatus: "IN_PROCESS", reason: "Open SBAR review" })
      .expect(200);

    expect(sbar.body.item).toMatchObject({
      id: "case-10002",
      currentStage: "SBAR",
      status: "IN_PROCESS",
      sbarCopied: false
    });
    expect(sbar.body.item.clinicalApproval).toBeUndefined();
  });

  it("prevents another nurse from taking an active lock", async () => {
    const nurseA = await agentFor("nurse@irisstar.tech", "remote_triage_nurse");
    upsertDirectoryUserFromHrms({
      employeeId: "IST-10004",
      email: "phcc.backup.nurse@irisstar.tech",
      fullName: "PHCC Backup Nurse",
      organizationCode: "PHCC",
      jobTitle: "Remote Triage Nurse",
      roles: ["remote_triage_nurse"]
    });
    const nurseB = await agentFor("phcc.backup.nurse@irisstar.tech", "remote_triage_nurse");

    await nurseA.post("/api/v1/queue/case-10002/claim").expect(200);

    const blocked = await nurseB.post("/api/v1/queue/case-10002/claim").expect(423);
    expect(blocked.body.code).toBe("QUEUE_ITEM_LOCKED");
  });

  it("moves a new emergency vital-sign case to the top of the active queue", async () => {
    const manager = await agentFor("manager@irisstar.tech", "triage_service_manager");

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
    expect(created.body.item).toMatchObject({
      identityValidated: true,
      identityValidationSource: "HRMS_AUTO",
      patientAge: {
        source: "staff",
        calculatedFrom: "HRMS_DATE_OF_BIRTH"
      }
    });

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
