import request from "supertest";
import { createApp } from "../src/app.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { authenticateLocal, resetSecurityStoreForTests, validateSessionContext } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;

const app = createApp();

// Closes NFR-169 - a cookie-based session is now bound to the User-Agent
// that created it and re-validated on every authenticated request, not
// just checked once at login.
describe("Session context binding (cookie sessions)", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  afterEach(() => {
    resetSecurityStoreForTests();
  });

  it("allows a request from the same User-Agent that created the session", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .set("User-Agent", "TestBrowser/1.0")
      .send({ username: "layla@irisstar.tech", password: "Layla@2026", simulateRole: "remote_triage_nurse" })
      .expect(200);
    const cookie = login.headers["set-cookie"];

    await request(app).get("/api/v1/queue").set("Cookie", cookie).set("User-Agent", "TestBrowser/1.0").expect(200);
  });

  it("rejects a request from a different User-Agent using the same session cookie", async () => {
    const login = await request(app)
      .post("/api/v1/auth/login")
      .set("User-Agent", "TestBrowser/1.0")
      .send({ username: "layla@irisstar.tech", password: "Layla@2026", simulateRole: "remote_triage_nurse" })
      .expect(200);
    const cookie = login.headers["set-cookie"];

    await request(app).get("/api/v1/queue").set("Cookie", cookie).set("User-Agent", "DifferentClient/9.9").expect(401);
  });

  it("allows an IP change but records it, rather than rejecting the request", async () => {
    const loginResult = await authenticateLocal({
      username: "layla@irisstar.tech",
      password: "Layla@2026",
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "10.0.0.1",
      device: "TestBrowser/1.0"
    });
    if (!loginResult.ok || "mfaRequired" in loginResult) {
      throw new Error("Expected an immediate session");
    }

    const sameContext = await validateSessionContext(loginResult.session.sessionId, "10.0.0.1", "TestBrowser/1.0");
    expect(sameContext).toBe("ok");

    const changedIp = await validateSessionContext(loginResult.session.sessionId, "10.0.0.2", "TestBrowser/1.0");
    expect(changedIp).toBe("ip-changed");

    // The mismatch is not persistent - it was recorded once and the bound
    // IP updated, so the same new IP on a subsequent request is now "ok".
    const settledContext = await validateSessionContext(loginResult.session.sessionId, "10.0.0.2", "TestBrowser/1.0");
    expect(settledContext).toBe("ok");
  });
});
