import request from "supertest";
import { createApp } from "../src/app.js";
import { resetSecurityStoreForTests } from "../src/services/securityAdmin.js";
import { resetRateLimitBucketsForTests } from "../src/middleware/rateLimit.js";
import { hashRestrictedAccessPassword } from "../src/services/helpRestrictedAccess.js";

const TEST_ADMIN_PASSWORD = "TestAdminPassword!2026";
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASSWORD;
process.env.HELP_RESTRICTED_SESSION_SECRET = "test-only-help-vault-secret";

const VAULT_PLAINTEXT_PASSWORD = "test-vault-password-2026";
process.env.HELP_RESTRICTED_ACCESS_PASSWORD_HASH = hashRestrictedAccessPassword(VAULT_PLAINTEXT_PASSWORD);

const app = createApp();

async function agentFor(username: string, simulateRole: string) {
  const agent = request.agent(app);
  await agent
    .post("/api/v1/auth/login")
    .send({ username, password: TEST_ADMIN_PASSWORD, simulateRole })
    .expect(200);
  return agent;
}

describe("Help & Library access", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  afterEach(() => {
    resetSecurityStoreForTests();
    resetRateLimitBucketsForTests();
  });

  it("requires an existing authenticated session to view the Help page", async () => {
    const response = await request(app).get("/help");
    expect(response.status).toBe(401);
    expect(response.text).toContain("Sign in required");
  });

  it("serves the Help page for any signed-in nurse without any secondary password prompt required to load it", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await nurse.get("/help").expect(200);
    expect(response.text).toContain("Help &amp; Clinical Library");
    expect(response.text).toContain("Nurse Cockpit");
    // The restricted vault section is not even rendered for a role without access.
    expect(response.text).not.toContain("Restricted Operations Vault");
  });

  it("serves the Help page for the Triage Service Manager and does not render the restricted vault", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    const response = await manager.get("/help").expect(200);
    expect(response.text).toContain("Triage Service Manager Board");
    expect(response.text).not.toContain("Restricted Operations Vault");
  });

  it("renders the restricted vault section (locked) only for a permitted role", async () => {
    const securityAdmin = await agentFor("sec@irisstar.tech", "security_administrator");
    const response = await securityAdmin.get("/help").expect(200);
    expect(response.text).toContain("Restricted Operations Vault");
    expect(response.text).toContain("vault-password");
  });

  it("rejects restricted-vault verification for a role without vault access, even with the correct password", async () => {
    const nurse = await agentFor("layla@irisstar.tech", "remote_triage_nurse");
    const response = await nurse
      .post("/api/v1/help/restricted-access/verify")
      .send({ password: VAULT_PLAINTEXT_PASSWORD });
    expect(response.status).toBe(403);
  });

  it("rejects an incorrect restricted-vault password for a permitted role", async () => {
    const securityAdmin = await agentFor("sec@irisstar.tech", "security_administrator");
    const response = await securityAdmin
      .post("/api/v1/help/restricted-access/verify")
      .send({ password: "wrong-password" });
    expect(response.status).toBe(401);
  });

  it("grants restricted-vault content only after correct password verification for a permitted role, and never returns secret values", async () => {
    const securityAdmin = await agentFor("sec@irisstar.tech", "security_administrator");

    // Vault content is unreachable before verification.
    const beforeVerify = await securityAdmin.get("/api/v1/help/restricted-vault");
    expect(beforeVerify.status).toBe(401);

    const verify = await securityAdmin
      .post("/api/v1/help/restricted-access/verify")
      .send({ password: VAULT_PLAINTEXT_PASSWORD })
      .expect(200);
    expect(verify.body.granted).toBe(true);

    const vault = await securityAdmin.get("/api/v1/help/restricted-vault").expect(200);
    expect(Array.isArray(vault.body.entries)).toBe(true);
    expect(vault.body.entries.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(vault.body);
    expect(serialized).not.toContain(VAULT_PLAINTEXT_PASSWORD);
    expect(serialized).not.toContain(process.env.HELP_RESTRICTED_ACCESS_PASSWORD_HASH);
    // Only approved metadata fields, never a literal secret value.
    for (const entry of vault.body.entries) {
      expect(Object.keys(entry)).toEqual(
        expect.arrayContaining(["system", "credentialType", "owner", "storageLocation", "environment", "rotationFrequency"])
      );
    }
  });

  it("rate-limits repeated restricted-access verification attempts", async () => {
    const securityAdmin = await agentFor("sec@irisstar.tech", "security_administrator");
    let lastStatus = 0;
    for (let attempt = 0; attempt < 7; attempt += 1) {
      const response = await securityAdmin
        .post("/api/v1/help/restricted-access/verify")
        .send({ password: "wrong-password" });
      lastStatus = response.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("never includes the restricted-access password or its hash in any response body", async () => {
    const securityAdmin = await agentFor("sec@irisstar.tech", "security_administrator");
    const helpPage = await securityAdmin.get("/help").expect(200);
    expect(helpPage.text).not.toContain(VAULT_PLAINTEXT_PASSWORD);
    expect(helpPage.text).not.toContain(process.env.HELP_RESTRICTED_ACCESS_PASSWORD_HASH as string);
  });

  it("does not require restricted-vault verification to affect the general Help content or any other route", async () => {
    const manager = await agentFor("khalid@irisstar.tech", "triage_service_manager");
    await manager.get("/help").expect(200);
    // Queue access (used by the Service Manager Board) is unaffected by Help being open.
    await manager.get("/api/v1/queue").expect(200);
  });
});
