import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { decideReveal, fetchApprovedRevealValue, requestReveal, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

// Closes R-04 - proves the real two-step approval-gated reveal workflow:
// request -> a distinct second account approves/denies -> the original
// requester fetches the value once, within a short TTL. Replaces the old
// single-step recordReveal(), which returned the plaintext value in the
// same call that requested it.
describe("Two-step approval-gated reveal workflow", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  afterEach(() => {
    resetSecurityStoreForTests();
  });

  it("rejects a non-allow-listed field", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");
    await privacyOfficer
      .post("/api/v1/admin/reveal/request")
      .send({ resourceType: "ApplicationUser", resourceId: "usr_nurse_10001", field: "fullName", purpose: "test purpose" })
      .expect(400);
  });

  it("rejects fetching a value that was never requested/approved", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");
    await privacyOfficer.get("/api/v1/admin/reveal/not-a-real-id/value").expect(404);
  });

  it("rejects a decision from the same account that made the request", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");
    const requested = await privacyOfficer
      .post("/api/v1/admin/reveal/request")
      .send({ resourceType: "ApplicationUser", resourceId: "usr_nurse_10001", field: "mobile", purpose: "test purpose" })
      .expect(202);

    await privacyOfficer
      .post(`/api/v1/admin/reveal/${requested.body.id}/decision`)
      .send({ decision: "approved" })
      .expect(409);
  });

  it("rejects fetching a value by anyone other than the original requester", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");
    const complianceAuditor = await agentFor("audit@irisstar.tech", "compliance_auditor");

    const requested = await privacyOfficer
      .post("/api/v1/admin/reveal/request")
      .send({ resourceType: "ApplicationUser", resourceId: "usr_nurse_10001", field: "mobile", purpose: "test purpose" })
      .expect(202);
    await complianceAuditor.post(`/api/v1/admin/reveal/${requested.body.id}/decision`).send({ decision: "approved" }).expect(200);

    // The approver is not the requester, so they may not fetch the value.
    await complianceAuditor.get(`/api/v1/admin/reveal/${requested.body.id}/value`).expect(403);
  });

  it("never produces a fetchable value for a denied request", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");
    const complianceAuditor = await agentFor("audit@irisstar.tech", "compliance_auditor");

    const requested = await privacyOfficer
      .post("/api/v1/admin/reveal/request")
      .send({ resourceType: "ApplicationUser", resourceId: "usr_nurse_10001", field: "mobile", purpose: "test purpose" })
      .expect(202);
    await complianceAuditor.post(`/api/v1/admin/reveal/${requested.body.id}/decision`).send({ decision: "denied" }).expect(200);

    await privacyOfficer.get(`/api/v1/admin/reveal/${requested.body.id}/value`).expect(409);
  });

  it("shows a pending request in the approver queue, and no longer once decided", async () => {
    const privacyOfficer = await agentFor("privacy@irisstar.tech", "privacy_officer");
    const complianceAuditor = await agentFor("audit@irisstar.tech", "compliance_auditor");

    const requested = await privacyOfficer
      .post("/api/v1/admin/reveal/request")
      .send({ resourceType: "ApplicationUser", resourceId: "usr_nurse_10001", field: "mobile", purpose: "test purpose" })
      .expect(202);

    const pendingBefore = await complianceAuditor.get("/api/v1/admin/reveal/pending").expect(200);
    expect(pendingBefore.body.requests.some((r: { id: string }) => r.id === requested.body.id)).toBe(true);

    await complianceAuditor.post(`/api/v1/admin/reveal/${requested.body.id}/decision`).send({ decision: "approved" }).expect(200);

    const pendingAfter = await complianceAuditor.get("/api/v1/admin/reveal/pending").expect(200);
    expect(pendingAfter.body.requests.some((r: { id: string }) => r.id === requested.body.id)).toBe(false);
  });

  it("rejects fetching the same approved value a second time (single-use)", async () => {
    const { id } = await requestReveal("usr_privacy_10001", {
      resourceType: "ApplicationUser",
      resourceId: "usr_nurse_10001",
      field: "mobile",
      purpose: "test purpose"
    });
    await decideReveal(id, "usr_compliance_10001", "approved");

    await expect(fetchApprovedRevealValue(id, "usr_privacy_10001")).resolves.toEqual(expect.any(String));
    await expect(fetchApprovedRevealValue(id, "usr_privacy_10001")).rejects.toThrow(/already been fetched/i);
  });

  it("rejects fetching an approved value once its TTL has expired", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "queueMicrotask"] });
    try {
      const { id } = await requestReveal("usr_privacy_10001", {
        resourceType: "ApplicationUser",
        resourceId: "usr_nurse_10001",
        field: "mobile",
        purpose: "test purpose"
      });
      await decideReveal(id, "usr_compliance_10001", "approved");

      jest.advanceTimersByTime(61_000);

      await expect(fetchApprovedRevealValue(id, "usr_privacy_10001")).rejects.toThrow(/expired/i);
    } finally {
      jest.useRealTimers();
    }
  });
});
