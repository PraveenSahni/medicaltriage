import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({ username, password: TEST_ADMIN_PASSWORD, simulateRole })
    .expect(200);
  return agent;
}

// NFR-118's queue-backlog anomaly signal (docs/operations/anomaly-alerting-matrix.md).
describe("NFR-118 - queue backlog metric emission", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("emits a real queue_metric log line with waiting count and oldest-age on an unfiltered list", async () => {
    const agent = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    await agent.get("/api/v1/queue").expect(200);
    const emitted = consoleSpy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes('"metric":"queue_backlog"'));
    expect(emitted.length).toBeGreaterThan(0);
    const parsed = JSON.parse(emitted[0]);
    expect(typeof parsed.waitingCount).toBe("number");
    expect(typeof parsed.oldestWaitingAgeSeconds).toBe("number");
    expect(parsed.oldestWaitingAgeSeconds).toBeGreaterThanOrEqual(0);
    expect(parsed).not.toHaveProperty("reasonNarrative");
    expect(parsed).not.toHaveProperty("istStaffId");
    consoleSpy.mockRestore();
  });

  it("does not emit the metric for a narrowly-filtered query", async () => {
    const agent = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    await agent.get("/api/v1/queue?severity=Emergency").expect(200);
    const emitted = consoleSpy.mock.calls.map((call) => String(call[0])).filter((line) => line.includes('"metric":"queue_backlog"'));
    expect(emitted.length).toBe(0);
    consoleSpy.mockRestore();
  });
});
