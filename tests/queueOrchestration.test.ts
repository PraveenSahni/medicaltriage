import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
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
    resetRateLimitBucketsForTests();
  });

  it("saves vitals one field at a time without requiring the full set", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.post("/api/v1/queue/case-10002/claim").expect(200);

    const afterHeartRate = await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ vitals: { heartRate: 72 } })
      .expect(200);
    expect(afterHeartRate.body.item.vitals).toMatchObject({ heartRate: 72 });

    const afterRespiratoryRate = await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ vitals: { respiratoryRate: 16 } })
      .expect(200);
    expect(afterRespiratoryRate.body.item.vitals).toMatchObject({ heartRate: 72, respiratoryRate: 16 });

    const reloaded = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(reloaded.body.item.vitals).toMatchObject({ heartRate: 72, respiratoryRate: 16 });
  });

  it("does not trigger the emergency safety floor from a single normal-range vital entered alone", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10001",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Test case with no prior vitals recorded."
      })
      .expect(201);
    const id = created.body.item.id as string;
    expect(created.body.item.vitals).toBeUndefined();

    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.post(`/api/v1/queue/${id}/claim`).expect(200);

    // A single normal-range vital entered alone (no other fields recorded
    // yet, e.g. consciousLevel undefined) must never itself trigger the
    // emergency safety floor.
    const afterHeartRate = await nurse
      .patch(`/api/v1/queue/${id}/context`)
      .send({ vitals: { heartRate: 72 } })
      .expect(200);
    expect(afterHeartRate.body.item.safetyFloorActive).toBe(false);
    expect(afterHeartRate.body.item.vitals).toMatchObject({ heartRate: 72 });
  });

  it("generates a synthetic call via the shared queue-call generator (manual invocation)", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");

    const response = await manager.post("/api/v1/queue/simulate").send({});

    if (response.status === 503) {
      // Synthetic HRMS seed file not present in this environment - the
      // generator degrades gracefully rather than crashing.
      expect(response.body.code).toBe("QUEUE_SIMULATE_NO_CANDIDATES");
      return;
    }

    expect(response.status).toBe(201);
    expect(response.body.item).toMatchObject({
      istStaffId: expect.any(String),
      reasonNarrative: expect.any(String)
    });
    expect(["Staff", "Dependent"]).toContain(response.body.item.patientType);
  });

  it("locks a board case for Step cockpit handoff", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

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
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

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
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

    const loaded = await nurse.get("/api/v1/queue/case-10002").expect(200);

    expect(loaded.body.item.reasonNarrative).toBe("Fever with fast breathing reported by parent.");
    expect(loaded.body.item.preparedProtocol).toMatchObject({
      status: "NO_MATCH",
      sourceType: "synthetic-sample"
    });
    expect(loaded.body.item.preparedProtocol.primaryProtocolId).toBeUndefined();
    expect(loaded.body.item.preparedProtocol.suggestions.map((item: { protocolId: string }) => item.protocolId)).toEqual(
      expect.arrayContaining(["sample-fever-child"])
    );
    expect(loaded.body.item.preparedProtocol.extractedKeywords).toContain("fever");
    expect(loaded.body.item.preparedProtocol.acuityQuestionPreview).toEqual([]);
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
        agreement: "NO_DETERMINISTIC_CANDIDATE"
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
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");

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

  it("rejects direct completion when clinical prerequisites are missing", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
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
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
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
    const nurseA = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    upsertDirectoryUserFromHrms({
      employeeId: "IST-10004",
      email: "phcc.backup.nurse@irisstar.tech",
      fullName: "PHCC Backup Nurse",
      organizationCode: "IST_TECH",
      jobTitle: "Remote Triage Nurse",
      roles: ["remote_triage_nurse"]
    });
    const nurseB = await agentFor("phcc.backup.nurse@irisstar.tech", "remote_triage_nurse");

    await nurseA.post("/api/v1/queue/case-10002/claim").expect(200);

    const blocked = await nurseB.post("/api/v1/queue/case-10002/claim").expect(423);
    expect(blocked.body.code).toBe("QUEUE_ITEM_LOCKED");
  });

  it("moves a new emergency vital-sign case to the top of the active queue", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");

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
      safetyFloorSource: "vitals",
      calculatedSeverity: "EMERGENCY"
    });
  });

  it("activates the emergency floor from triager judgment without any vitals", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");

    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-90001",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        department: "Flight Operations",
        jobTitle: "Pilot",
        summary: "Caller sounds severely unwell to the triager.",
        slaMinutes: 15
      })
      .expect(201);
    const id = created.body.item.id as string;
    expect(created.body.item.safetyFloorActive).toBe(false);

    const escalated = await manager
      .patch(`/api/v1/queue/${id}/context`)
      .send({
        calculatedSeverity: "EMERGENCY",
        floorSource: "judgment",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        destinationName: "Hamad Medical Corporation (HMC) Emergency Department"
      })
      .expect(200);

    expect(escalated.body.item).toMatchObject({
      id,
      safetyFloorActive: true,
      safetyFloorSource: "judgment",
      calculatedSeverity: "EMERGENCY",
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT"
    });
  });

  it("blocks severity and route downgrades through context patches while the floor is active", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.post("/api/v1/queue/case-10002/claim").expect(200);

    const attempted = await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({
        calculatedSeverity: "ROUTINE",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        destinationName: "PHCC urgent care or IST teleconsult booking"
      })
      .expect(200);

    expect(attempted.body.item).toMatchObject({
      id: "case-10002",
      safetyFloorActive: true,
      calculatedSeverity: "EMERGENCY",
      dispositionCode: "SIDRA_PEDIATRIC_ED"
    });
  });

  it("persists structured initial-assessment answers on the queue item", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.post("/api/v1/queue/case-10002/claim").expect(200);

    const answers = {
      "What is the highest temperature measured, and how was it measured?": "39.5C (Ear)",
      "When did the fever start?": "2 days"
    };
    const patched = await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ initialAssessmentResponses: answers })
      .expect(200);
    expect(patched.body.item.initialAssessmentResponses).toEqual(answers);

    const reloaded = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(reloaded.body.item.initialAssessmentResponses).toEqual(answers);
  });

  it("PR-007 merges partial IAQ, TAQ and approval JSON updates without losing earlier fields", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.post("/api/v1/queue/case-10002/claim").expect(200);

    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ initialAssessmentResponses: { "iaq-location": "lower abdomen" } })
      .expect(200);
    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ initialAssessmentResponses: { "iaq-duration": "two hours" } })
      .expect(200);

    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ taqResponses: { "taq-emergency": false } })
      .expect(200);
    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ taqResponses: { "taq-urgent": true } })
      .expect(200);

    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ clinicalApproval: { terminalQuestionId: "taq-urgent" } })
      .expect(200);
    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ clinicalApproval: { approvedAtIso: "2026-08-17T12:00:00.000Z", approvedBy: "Layla" } })
      .expect(200);

    const reloaded = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(reloaded.body.item.initialAssessmentResponses).toEqual({
      "iaq-location": "lower abdomen",
      "iaq-duration": "two hours"
    });
    expect(reloaded.body.item.taqResponses).toEqual({
      "taq-emergency": false,
      "taq-urgent": true
    });
    expect(reloaded.body.item.clinicalApproval).toEqual({
      terminalQuestionId: "taq-urgent",
      approvedAtIso: "2026-08-17T12:00:00.000Z",
      approvedBy: "Layla"
    });
  });

  it("PR-007 permits idempotent partial JSON after disposition but rejects new clinical answers", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
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
        destinationName: "Sidra Medicine Emergency Department",
        initialAssessmentResponses: { "iaq-duration": "two hours" },
        taqResponses: { "taq-emergency": true },
        clinicalApproval: { terminalQuestionId: "taq-emergency" }
      })
      .expect(200);
    await nurse
      .post("/api/v1/queue/case-10002/move")
      .send({ toStage: "DISPOSITION", toStatus: "IN_PROCESS", reason: "Assessment completed" })
      .expect(200);

    await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({
        initialAssessmentResponses: { "iaq-duration": "two hours" },
        taqResponses: { "taq-emergency": true },
        clinicalApproval: { approvedAtIso: "2026-08-17T12:00:00.000Z" }
      })
      .expect(200);

    const rejected = await nurse
      .patch("/api/v1/queue/case-10002/context")
      .send({ taqResponses: { "taq-late-change": false } })
      .expect(409);
    expect(rejected.body.code).toBe("QUEUE_DISPOSITION_LOCKED");

    const reloaded = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(reloaded.body.item.taqResponses).toEqual({ "taq-emergency": true });
    expect(reloaded.body.item.clinicalApproval).toEqual({
      terminalQuestionId: "taq-emergency",
      approvedAtIso: "2026-08-17T12:00:00.000Z"
    });
  });

  it("labels the seeded symptom-reported red-floor cases with their floor source", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");

    const loaded = await nurse.get("/api/v1/queue/case-10002").expect(200);
    expect(loaded.body.item).toMatchObject({
      safetyFloorActive: true,
      safetyFloorSource: "symptom"
    });
  });

  describe("GET /api/v1/queue pagination (opt-in, additive)", () => {
    it("returns the full unpaginated list and a matching totalCount when no limit/offset is given", async () => {
      const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
      const res = await nurse.get("/api/v1/queue").expect(200);
      expect(res.body.count).toBe(res.body.queue.length);
      expect(res.body.totalCount).toBe(res.body.queue.length);
    });

    it("slices the response when limit/offset are provided, without changing totalCount", async () => {
      const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
      const full = await nurse.get("/api/v1/queue").expect(200);
      const totalCount = full.body.totalCount as number;
      expect(totalCount).toBeGreaterThan(0);

      const paged = await nurse.get("/api/v1/queue?limit=1&offset=0").expect(200);
      expect(paged.body.queue).toHaveLength(1);
      expect(paged.body.totalCount).toBe(totalCount);
      expect(paged.body.queue[0].id).toBe(full.body.queue[0].id);
    });

    it("rejects an invalid limit (non-positive or non-integer) as a 400", async () => {
      const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
      await nurse.get("/api/v1/queue?limit=0").expect(400);
      await nurse.get("/api/v1/queue?limit=-1").expect(400);
      await nurse.get("/api/v1/queue?limit=abc").expect(400);
    });
  });

  // Closes the answer-call authorization/audit gaps found during the
  // NFR-004 UX cross-browser validation batch (call-center-gateway session
  // remediation).
  describe("claim authorization and audit evidence", () => {
    it("persists a durable audit event for a successful claim", async () => {
      const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
      await nurse.post("/api/v1/queue/case-10002/claim").expect(200);

      const admin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      const events = await admin.get("/api/v1/admin/audit-events").expect(200);
      const claimEvents = (events.body.events as Array<{ action: string; resource: string }>).filter(
        (event) => event.resource?.includes("case-10002")
      );
      expect(claimEvents.length).toBeGreaterThan(0);
    });
  });
});
