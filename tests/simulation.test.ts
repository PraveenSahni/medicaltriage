import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

async function authenticatedAgent() {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({
      username: "nurse@ist.local",
      password: "DemoPass!2026",
      simulateRole: "remote_triage_nurse"
    })
    .expect(200);
  return agent;
}

describe("IST Tech simulation engine API", () => {
  it("lists synthetic scenarios for call-flow and AI evaluation", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .get("/api/v1/simulation/scenarios")
      .expect(200);

    expect(response.body.syntheticOnly).toBe(true);
    expect(response.body.count).toBeGreaterThanOrEqual(4);
    expect(response.body.scenarios[0]).toHaveProperty("scenarioId");
  });

  it("runs an emergency pilot scenario with deterministic safety-floor escalation", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/v1/simulation/run/sim-cardiac-pilot-red")
      .expect(200);

    expect(response.body.synthetic).toBe(true);
    expect(response.body.vitalScore.redAlertTriggered).toBe(true);
    expect(response.body.finalSeverity).toBe("Emergency");
    expect(response.body.finalDispositionCode).toBe("HMC_EMERGENCY_DEPARTMENT");
    expect(response.body.fitToFlyStatus).toBe("restricted");
    expect(response.body.trainingRow.synthetic).toBe(true);
    expect(response.body.transitionLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stateName: "WHO/IITT Safety Floor" }),
        expect.objectContaining({ stateName: "Localized Routing & Documentation" })
      ])
    );
  });

  it("keeps low-similarity symptom matching as a safety-net case", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .post("/api/v1/simulation/run/sim-unknown-low-similarity")
      .expect(200);

    expect(response.body.matchedProtocol.accepted).toBe(false);
    expect(response.body.matchedProtocol.codebookNode).toBe("UNKNOWN_SYMPTOM");
    expect(response.body.trainingRow.safetyNotice).toContain("Synthetic scenario only");
  });

  it("exports LLM-ready synthetic JSONL rows", async () => {
    const agent = await authenticatedAgent();
    const response = await agent
      .get("/api/v1/simulation/training-set")
      .expect(200);

    const rows = response.text.trim().split("\n").map((line) => JSON.parse(line));
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(rows[0]).toMatchObject({
      synthetic: true,
      purpose: "llm-evaluation-and-training"
    });
    expect(rows[0].messages).toHaveLength(3);
  });
});
