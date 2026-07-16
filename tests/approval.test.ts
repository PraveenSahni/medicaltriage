import request from "supertest";
import { createApp } from "../src/app.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
process.env.MOCK_MODE = "true";

const app = createApp();

async function authenticatedAgent(simulateRole = "remote_triage_nurse") {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({
      username: "nurse@irisstar.tech",
      password: TEST_ADMIN_PASSWORD,
      simulateRole
    })
    .expect(200);
  return agent;
}

describe("clinical AI HITL approval gateway", () => {
  it("requires authentication before exposing the approval queue", async () => {
    await request(app).get("/api/v1/approval/queue").expect(401);
  });

  it("returns a clinician approval queue with feature-level reasoning", async () => {
    const agent = await authenticatedAgent();
    const response = await agent.get("/api/v1/approval/queue").expect(200);

    expect(response.body.checkpoint).toContain("authenticated clinician review");
    expect(response.body.queue[0]).toMatchObject({
      safetyFloorOverride: true,
      reviewed: false
    });
    expect(response.body.queue[0].featureLevelReasoning.length).toBeGreaterThanOrEqual(2);
  });

  it("rejects blind approval when reasoning features were not reviewed", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/v1/approval/reviews/enc-ai-review-10001")
      .send({
        decision: "approve",
        reviewedReasoningFeatureIds: ["vital-spo2-floor"],
        activeReviewConfirmed: true,
        rulesEngineSeverity: "Emergency",
        finalApprovedSeverity: "Emergency",
        finalDispositionCode: "HMC_EMERGENCY_DEPARTMENT"
      })
      .expect(400);

    expect(response.body.details.fieldErrors.reviewedReasoningFeatureIds).toBeDefined();
  });

  it("requires an override reason when the nurse modifies the AI care plan", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/v1/approval/reviews/enc-ai-review-10001")
      .send({
        decision: "modify",
        reviewedReasoningFeatureIds: ["vital-spo2-floor", "symptom-chest-sweating"],
        activeReviewConfirmed: true,
        originalAiRecommendation: "Routine",
        rulesEngineSeverity: "Emergency",
        finalApprovedSeverity: "Emergency",
        finalDispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        modifiedCarePlan: "Escalate immediately and prepare SBAR handoff."
      })
      .expect(400);

    expect(response.body.details.fieldErrors.nurseOverrideRationale).toBeDefined();
  });

  it("records a signed approval decision in mock mode", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/v1/approval/reviews/enc-ai-review-10001")
      .send({
        decision: "override",
        reviewedReasoningFeatureIds: ["vital-spo2-floor", "symptom-chest-sweating"],
        activeReviewConfirmed: true,
        originalAiRecommendation: "Routine",
        rulesEngineSeverity: "Emergency",
        finalApprovedSeverity: "Emergency",
        finalDispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        nurseOverrideReasonCode: "AI_DOWNGRADE_BLOCKED",
        nurseOverrideRationale: "AI suggested a lower acuity than the deterministic red floor, so downgrade was blocked.",
        modifiedCarePlan: "Emergency escalation and EMR writeback after nurse approval."
      })
      .expect(200);

    expect(response.body).toMatchObject({
      approved: true,
      nonBypassableCheckpoint: true,
      emrWritebackAllowed: true,
      patientCommunicationAllowed: true
    });
    expect(response.body.audit.auditSignature).toMatch(/^[a-f0-9]{64}$/);
    expect(response.body.audit.persisted).toBe(false);
    expect(response.body.audit.traceEvent).toMatchObject({
      activeReviewConfirmed: true,
      featureLevelReasoningReviewed: true,
      isCriticalFloorBreach: false
    });
  });

  it("rejects clinician downgrades below the rules floor without the special justification code", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/v1/approval/reviews/enc-ai-review-10001")
      .send({
        decision: "override",
        reviewedReasoningFeatureIds: ["vital-spo2-floor", "symptom-chest-sweating"],
        activeReviewConfirmed: true,
        originalAiRecommendation: "Routine",
        rulesEngineSeverity: "Emergency",
        finalApprovedSeverity: "Routine",
        finalDispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        nurseOverrideReasonCode: "OTHER",
        nurseOverrideRationale: "Clinician attempted to downgrade below the rules floor without the required code."
      })
      .expect(400);

    expect(response.body.details.fieldErrors.nurseOverrideReasonCode).toBeDefined();
  });

  it("flags justified clinician downgrades as critical floor breaches", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/v1/approval/reviews/enc-ai-review-10001")
      .send({
        decision: "override",
        reviewedReasoningFeatureIds: ["vital-spo2-floor", "symptom-chest-sweating"],
        activeReviewConfirmed: true,
        originalAiRecommendation: "Routine",
        rulesEngineSeverity: "Emergency",
        finalApprovedSeverity: "Routine",
        finalDispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        nurseOverrideReasonCode: "CLINICIAN_OVERRIDE_DOWN_BLOCKED",
        nurseOverrideRationale:
          "Senior clinician documented exceptional context and accepted director-level retrospective review."
      })
      .expect(200);

    expect(response.body.audit.traceEvent).toMatchObject({
      isCriticalFloorBreach: true,
      nurseOverrideReasonCode: "CLINICIAN_OVERRIDE_DOWN_BLOCKED"
    });
  });
});
