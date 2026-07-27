import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";
import { resetVoiceAssessmentStoreForTests } from "../src/services/voiceAssessment.js";
import { BoundedMedGemmaVoiceResponseInterpreter } from "../src/services/voiceInterpreter.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();
const scenarioIds = [
  "VOICE-AUTH-001",
  "VOICE-START-001",
  "VOICE-OWNER-001",
  "VOICE-FLOW-001",
  "VOICE-UNCERTAIN-001",
  "VOICE-INTERRUPT-001",
  "VOICE-EMERGENCY-001",
  "VOICE-NEGATION-001",
  "VOICE-TAKEOVER-001",
  "VOICE-RBAC-001",
  "VOICE-BOUNDARY-001"
] as const;

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({ username, password: TEST_ADMIN_PASSWORD, simulateRole })
    .expect(200);
  return agent;
}

async function startSession(
  agent: ReturnType<typeof request.agent>,
  protocolId = "sample-ankle-foot-injury"
) {
  return agent
    .post("/api/v1/voice-assessment/sessions")
    .send({
      protocolId,
      queueItemId: "queue-voice-1001",
      language: "en",
      recordingNoticePlayed: true,
      recordingAuthorizationStatus: "GRANTED"
    })
    .expect(201);
}

describe("English Voice AI initial-assessment foundation", () => {
  beforeEach(() => {
    resetRateLimitBucketsForTests();
    resetSecurityStoreForTests();
    resetVoiceAssessmentStoreForTests();
  });

  it("VOICE-AUTH-001 rejects unauthenticated session creation", async () => {
    await request(app)
      .post("/api/v1/voice-assessment/sessions")
      .send({
        protocolId: "sample-ankle-foot-injury",
        queueItemId: "queue-voice-1001",
        recordingNoticePlayed: true,
        recordingAuthorizationStatus: "GRANTED"
      })
      .expect(401);
  });

  it("VOICE-START-001 pins the English prompt and recording-governance boundary", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await startSession(nurse);

    expect(response.body.session).toMatchObject({
      createdByUserId: "usr_nurse_10001",
      protocolId: "sample-ankle-foot-injury",
      language: "en",
      status: "ACTIVE",
      recordingGovernance: {
        noticePlayed: true,
        authorizationStatus: "GRANTED",
        rawRecordingRagEligible: false,
        storageRegion: "me-central1"
      },
      currentQuestion: {
        id: "ankle-foot-iaq1",
        sequence: 1,
        deliveryMode: "TEXT_SIMULATION"
      }
    });
  });

  it("VOICE-OWNER-001 blocks another ordinary nurse from opening the named-user session", async () => {
    const owner = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const otherNurse = await agentFor("sara@irisstar.tech", "pediatric_triage_nurse");
    const started = await startSession(owner);

    const response = await otherNurse
      .get(`/api/v1/voice-assessment/sessions/${started.body.session.id}`)
      .expect(403);

    expect(response.body.code).toBe("VOICE_SESSION_ACCESS_DENIED");
  });

  it("VOICE-FLOW-001 advances deterministically and completes only after nurse validation", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const started = await startSession(nurse);
    const sessionId = started.body.session.id as string;

    const first = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "I twisted my ankle while playing football.", sttConfidence: 0.97 })
      .expect(200);
    expect(first.body.session.currentQuestion.id).toBe("ankle-foot-iaq2");
    await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/turns/${first.body.session.turns[0].id}/validate`)
      .send({ decision: "VALIDATE" })
      .expect(200);

    const second = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "Yes, I can take four steps.", sttConfidence: 0.96 })
      .expect(200);
    expect(second.body.session.turns[1].classification).toBe("YES");
    await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/turns/${second.body.session.turns[1].id}/validate`)
      .send({ decision: "VALIDATE" })
      .expect(200);

    const third = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "There is mild swelling without numbness or color change.", sttConfidence: 0.95 })
      .expect(200);
    expect(third.body.session.status).toBe("AWAITING_NURSE_VALIDATION");
    expect(third.body.session.currentQuestion).toBeUndefined();

    const completed = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/turns/${third.body.session.turns[2].id}/validate`)
      .send({
        decision: "CORRECT",
        correctedAnswer: { classification: "OPEN_TEXT", value: "Mild lateral swelling; no numbness." },
        comment: "Removed an ambiguous phrase from the transcript interpretation."
      })
      .expect(200);
    expect(completed.body.session.status).toBe("COMPLETED");
    expect(completed.body.session.completedAt).toEqual(expect.any(String));
  });

  it("VOICE-UNCERTAIN-001 allows one clarification and then requires nurse takeover", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const started = await startSession(nurse);
    const sessionId = started.body.session.id as string;

    const clarification = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "I do not know.", sttConfidence: 0.9 })
      .expect(200);
    expect(clarification.body.session).toMatchObject({
      status: "ACTIVE",
      clarificationAttempts: 1
    });
    expect(clarification.body.session.turns[0].status).toBe("NEEDS_CLARIFICATION");

    const takeover = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "Still not sure.", sttConfidence: 0.9 })
      .expect(200);
    expect(takeover.body.session.status).toBe("NURSE_TAKEOVER");
    expect(takeover.body.session.takeoverReason).toMatch(/remained uncertain/i);
  });

  it("VOICE-INTERRUPT-001 treats caller barge-in as interruption instead of an answer", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const started = await startSession(nurse);

    const response = await nurse
      .post(`/api/v1/voice-assessment/sessions/${started.body.session.id}/responses`)
      .send({ transcriptText: "", interrupted: true })
      .expect(200);

    expect(response.body.session.turns[0]).toMatchObject({
      classification: "INTERRUPTED",
      status: "NEEDS_CLARIFICATION"
    });
    expect(response.body.session.currentQuestion.id).toBe("ankle-foot-iaq1");
  });

  it("VOICE-EMERGENCY-001 hands emergency language to the nurse without selecting a disposition", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const started = await startSession(nurse, "sample-chest-pain-adult");

    const response = await nurse
      .post(`/api/v1/voice-assessment/sessions/${started.body.session.id}/responses`)
      .send({ transcriptText: "It is crushing in the center of my chest.", sttConfidence: 0.99 })
      .expect(200);

    expect(response.body.session.status).toBe("NURSE_TAKEOVER");
    expect(response.body.session.turns[0].classification).toBe("EMERGENCY_SIGNAL");
    expect(response.body.session.turns[0]).not.toHaveProperty("disposition");
    expect(response.body.session.turns[0]).not.toHaveProperty("route");
    expect(response.body.session.turns[0]).not.toHaveProperty("severity");
  });

  it("VOICE-NEGATION-001 does not turn a contracted negative mobility answer into Yes", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const started = await startSession(nurse);
    const sessionId = started.body.session.id as string;

    await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "I twisted my ankle during football.", sttConfidence: 0.97 })
      .expect(200);

    const response = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "I can't take four steps.", sttConfidence: 0.98 })
      .expect(200);

    expect(response.body.session.turns[1]).toMatchObject({
      classification: "NO",
      structuredAnswer: false
    });
  });

  it("VOICE-TAKEOVER-001 supports an explicit nurse takeover command", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const started = await startSession(nurse);

    const response = await nurse
      .post(`/api/v1/voice-assessment/sessions/${started.body.session.id}/takeover`)
      .send({ reason: "Caller requests to speak directly with the nurse." })
      .expect(200);

    expect(response.body.session).toMatchObject({
      status: "NURSE_TAKEOVER",
      takeoverReason: "Caller requests to speak directly with the nurse."
    });
  });

  it("VOICE-RBAC-001 exports only nurse-approved examples to an authorized reviewer", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const governance = await agentFor("governance@irisstar.tech", "clinical_governance_lead");
    const started = await startSession(nurse);
    const sessionId = started.body.session.id as string;
    const answered = await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/responses`)
      .send({ transcriptText: "I twisted it during football.", sttConfidence: 0.96 })
      .expect(200);
    await nurse
      .post(`/api/v1/voice-assessment/sessions/${sessionId}/turns/${answered.body.session.turns[0].id}/validate`)
      .send({ decision: "VALIDATE" })
      .expect(200);

    await nurse
      .get(`/api/v1/voice-assessment/sessions/${sessionId}/training-examples`)
      .expect(403);

    const exported = await governance
      .get(`/api/v1/voice-assessment/sessions/${sessionId}/training-examples`)
      .expect(200);
    expect(exported.body).toMatchObject({
      count: 1,
      boundary: "interpretation-only-no-clinical-outcomes"
    });
    expect(exported.body.examples[0]).toMatchObject({
      task: "BOUNDED_INITIAL_ASSESSMENT_INTERPRETATION",
      source: "NURSE_VALIDATED_VOICE_TURN"
    });
    expect(exported.body.examples[0]).not.toHaveProperty("disposition");
    expect(exported.body.examples[0]).not.toHaveProperty("route");
    expect(exported.body.examples[0]).not.toHaveProperty("severity");
  });

  it("VOICE-BOUNDARY-001 rejects a MedGemma response containing clinical outcome fields", async () => {
    const interpreter = new BoundedMedGemmaVoiceResponseInterpreter({
      async infer() {
        return {
          classification: "OPEN_TEXT",
          value: "left ankle",
          confidence: 0.95,
          evidence: ["left ankle"],
          requiresNurseTakeover: false,
          disposition: "HOMECARE"
        };
      }
    });

    await expect(
      interpreter.interpret({
        questionId: "ankle-foot-iaq1",
        responseType: "OPEN_TEXT",
        promptTextEn: "Please describe how the injury happened.",
        emergencyKeywords: [],
        transcriptText: "I twisted my left ankle.",
        interrupted: false,
        sttConfidence: 0.95
      })
    ).rejects.toThrow();
  });

  it("keeps every voice-assessment scenario ID unique", () => {
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
  });
});
