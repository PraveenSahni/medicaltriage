import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

// Closes NFR-192 (Data Portability) - a real, self-service data export.
describe("Self-service data export", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("returns the caller's own profile, sessions, and audit trail as downloadable JSON", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await nurse.get("/api/v1/me/export").expect(200);

    expect(response.headers["content-disposition"]).toMatch(/attachment; filename="ist-health-my-data-/);
    expect(response.body.profile.id).toBe("usr_nurse_10001");
    expect(response.body.activeSessions.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(response.body.auditEvents)).toBe(true);
  });

  it("never returns another user's data - only the caller's own", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await nurse.get("/api/v1/me/export").expect(200);

    for (const session of response.body.activeSessions) {
      expect(session.userId).toBe("usr_nurse_10001");
    }
  });

  it("requires authentication", async () => {
    await request(app).get("/api/v1/me/export").expect(401);
  });
});
