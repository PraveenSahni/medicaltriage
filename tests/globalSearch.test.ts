import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { resetQueueStoreForTests } from "../src/services/queueOrchestration.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

// Closes NFR-007 - proves one call spans both real, structured data sources
// (protocols, queue cases), reusing searchClinicalProtocols() unchanged and
// a new scorer for queue cases (no backend queue search existed before -
// the Nurse Cockpit's "Search cases..." box only ever filtered the
// already-loaded client-side list).
describe("Global search (protocols + queue cases)", () => {
  beforeEach(() => {
    resetQueueStoreForTests();
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("finds a real protocol by a known keyword", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await nurse.get("/api/v1/search").query({ q: "chest", limit: 5 }).expect(200);
    expect(response.body.protocols.length).toBeGreaterThan(0);
    expect(response.body.protocols[0]).toMatchObject({ score: expect.any(Number), matchedTerms: expect.any(Array) });
  });

  it("finds a real queue case by a distinctive term in its reasonNarrative", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10002",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Reports a highly unusual zorbington sensation in the elbow."
      })
      .expect(201);
    const caseId = created.body.item.id as string;

    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await nurse.get("/api/v1/search").query({ q: "zorbington", limit: 5 }).expect(200);

    expect(response.body.queue.some((item: { id: string }) => item.id === caseId)).toBe(true);
    expect(response.body.protocols).toEqual([]);
  });

  it("finds a real queue case by staff id", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const created = await manager
      .post("/api/v1/queue")
      .send({
        istStaffId: "IST-10003",
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        reasonNarrative: "Routine follow-up call."
      })
      .expect(201);
    const caseId = created.body.item.id as string;

    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await nurse.get("/api/v1/search").query({ q: "IST-10003", limit: 5 }).expect(200);

    expect(response.body.queue.some((item: { id: string }) => item.id === caseId)).toBe(true);
  });

  it("rejects an empty query", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    await nurse.get("/api/v1/search").query({ q: "" }).expect(400);
  });
});
