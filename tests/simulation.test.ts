import request from "supertest";
import { createApp } from "../src/app.js";

const app = createApp();

describe("IST Tech simulation engine API", () => {
  it("lists synthetic scenarios for call-flow and AI evaluation", async () => {
    const response = await request(app)
      .get("/api/v1/simulation/scenarios")
      .expect(200);

    expect(response.body.syntheticOnly).toBe(true);
    expect(response.body.count).toBeGreaterThanOrEqual(4);
    expect(response.body.scenarios[0]).toHaveProperty("scenarioId");
  });

  it("runs an emergency pilot scenario with deterministic safety-floor escalation", async () => {
    const response = await request(app)
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
    const response = await request(app)
      .post("/api/v1/simulation/run/sim-unknown-low-similarity")
      .expect(200);

    expect(response.body.matchedProtocol.accepted).toBe(false);
    expect(response.body.matchedProtocol.codebookNode).toBe("UNKNOWN_SYMPTOM");
    expect(response.body.trainingRow.safetyNotice).toContain("Synthetic scenario only");
  });

  it("exports LLM-ready synthetic JSONL rows", async () => {
    const response = await request(app)
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
