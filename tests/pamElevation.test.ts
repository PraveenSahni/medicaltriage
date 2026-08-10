import { authenticator } from "otplib";
import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { confirmMfaEnrollment, enrollMfa, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

const SYS_ADMIN_ID = "usr_platform_admin_10001";

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ username, password: TEST_ADMIN_PASSWORD, simulateRole }).expect(200);
  return agent;
}

function enrollAndConfirmMfa(userId: string): string {
  const { secret } = enrollMfa(userId);
  const confirmed = confirmMfaEnrollment(userId, authenticator.generate(secret));
  if (!confirmed) {
    throw new Error("Expected MFA confirmation to succeed in test setup");
  }
  return secret;
}

// Closes NFR-180's JIT-elevation/MFA/audit-trail capability gap - a second,
// time-boxed layer on top of the standing role/permission model for the
// highest-risk mutation permissions.
describe("PAM: JIT privileged-access elevation", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("rejects a privileged mutation with elevationRequired before elevating", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const response = await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "suspended", reason: "test" })
      .expect(403);
    expect(response.body).toMatchObject({ elevationRequired: true });
  });

  it("rejects elevation when MFA is not enrolled", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    await sysAdmin.post("/api/v1/admin/elevate").send({ code: "123456" }).expect(403);
  });

  it("allows the privileged mutation after elevating with a correct TOTP code", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const secret = enrollAndConfirmMfa(SYS_ADMIN_ID);

    const elevated = await sysAdmin.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);
    expect(elevated.body).toMatchObject({ elevated: true });

    const updated = await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "suspended", reason: "elevated mutation" })
      .expect(200);
    expect(updated.body.user.accountStatus).toBe("suspended");
  });

  it("rejects an incorrect TOTP code at elevation", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const secret = enrollAndConfirmMfa(SYS_ADMIN_ID);
    const wrongCode = String((Number(authenticator.generate(secret)) + 1) % 1000000).padStart(6, "0");
    await sysAdmin.post("/api/v1/admin/elevate").send({ code: wrongCode }).expect(401);
  });

  it("expires the elevation after its TTL and rejects the privileged action again", async () => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    try {
      const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
      const secret = enrollAndConfirmMfa(SYS_ADMIN_ID);
      await sysAdmin.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);

      jest.advanceTimersByTime(16 * 60 * 1000);

      const rejected = await sysAdmin
        .patch("/api/v1/admin/users/usr_nurse_10001/status")
        .send({ status: "suspended", reason: "post-expiry attempt" })
        .expect(403);
      expect(rejected.body).toMatchObject({ elevationRequired: true });
    } finally {
      jest.useRealTimers();
    }
  });

  it("revokes access immediately on explicit de-elevation, before the TTL", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const secret = enrollAndConfirmMfa(SYS_ADMIN_ID);
    await sysAdmin.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);

    await sysAdmin.post("/api/v1/admin/de-elevate").expect(200);

    const rejected = await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "suspended", reason: "post-de-elevation attempt" })
      .expect(403);
    expect(rejected.body).toMatchObject({ elevationRequired: true });
  });

  it("returns a real audit trail bounded by the elevation's grant/end events", async () => {
    const sysAdmin = await agentFor("rishma@irisstar.tech", "platform_super_administrator");
    const secret = enrollAndConfirmMfa(SYS_ADMIN_ID);

    const elevated = await sysAdmin.post("/api/v1/admin/elevate").send({ code: authenticator.generate(secret) }).expect(200);
    const elevationId = elevated.body.elevationId as string;

    await sysAdmin
      .patch("/api/v1/admin/users/usr_nurse_10001/status")
      .send({ status: "suspended", reason: "during elevation window" })
      .expect(200);

    await sysAdmin.post("/api/v1/admin/de-elevate").expect(200);

    const trail = await sysAdmin.get(`/api/v1/admin/elevation/${elevationId}/audit-trail`).expect(200);
    const actions = trail.body.events.map((event: { action: string }) => event.action);
    expect(actions).toEqual(expect.arrayContaining(["PAM_ELEVATION_GRANTED", "PAM_ELEVATION_ENDED"]));
  });
});
