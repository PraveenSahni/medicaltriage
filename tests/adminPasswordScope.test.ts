import { authenticateLocal, resetSecurityStoreForTests } from "../src/services/securityAdmin.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";

// This suite exists to prove a specific fix: ADMIN_PASSWORD previously
// authenticated as ANY existing user (not just the admin bootstrap account),
// which meant anyone who knew the one shared live-mode password could log in
// as a nurse/doctor/manager just by typing their username. The fix scopes
// ADMIN_PASSWORD to the platform/system admin bootstrap accounts specifically
// once MOCK_MODE=false - in mock mode (synthetic demo/test data) the old
// permissive behavior is intentionally preserved as a testing convenience.
// Exercises authenticateLocal() directly rather than through createApp(),
// since MOCK_MODE=false gates the whole app on live-integration env vars
// (Oracle HCM, FHIR, Twilio, etc.) unrelated to this specific fix.
describe("ADMIN_PASSWORD scope (live mode)", () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
    process.env.MOCK_MODE = "false";
    resetSecurityStoreForTests();
  });

  afterEach(() => {
    process.env.MOCK_MODE = "true";
  });

  it("rejects ADMIN_PASSWORD login as a non-admin (nurse) user in live mode", async () => {
    const result = await authenticateLocal({
      username: "layla@irisstar.tech",
      password: TEST_ADMIN_PASSWORD,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    });
    expect(result.ok).toBe(false);
  });

  it("still allows ADMIN_PASSWORD login as the platform admin bootstrap account in live mode", async () => {
    const result = await authenticateLocal({
      username: "pa@irisstar.tech",
      password: TEST_ADMIN_PASSWORD,
      rememberMe: false,
      ipAddress: "127.0.0.1",
      device: "jest"
    });
    expect(result.ok).toBe(true);
  });
});
