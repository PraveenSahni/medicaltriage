import {
  authenticateLocal,
  createUser,
  issueGovernedTemporaryCredential,
  resetSecurityStoreForTests
} from "../src/services/securityAdmin.js";
import {
  decryptGovernedIdentifier,
  encryptGovernedIdentifier,
  hashGovernedPassword,
  verifyGovernedPassword
} from "../src/services/governedAccountCrypto.js";

describe("PR-014 governed local-account credentials", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAllowDemo = process.env.ALLOW_DEMO_CREDENTIALS;
  const originalSessionPersistence = process.env.SESSION_DB_PERSISTENCE;
  const originalMfaMandatory = process.env.MFA_MANDATORY;
  const originalMfaEncryptionKey = process.env.MFA_ENCRYPTION_KEY;

  beforeEach(() => {
    resetSecurityStoreForTests();
    process.env.NODE_ENV = "production";
    process.env.ALLOW_DEMO_CREDENTIALS = "false";
    process.env.SESSION_DB_PERSISTENCE = "false";
    process.env.MFA_MANDATORY = "true";
    process.env.MFA_ENCRYPTION_KEY = "pr014-governed-account-test-key";
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.ALLOW_DEMO_CREDENTIALS = originalAllowDemo;
    process.env.SESSION_DB_PERSISTENCE = originalSessionPersistence;
    process.env.MFA_MANDATORY = originalMfaMandatory;
    process.env.MFA_ENCRYPTION_KEY = originalMfaEncryptionKey;
  });

  test("a PAM-created random password is accepted while seeded demo credentials remain disabled", async () => {
    const email = "pr014.production-login@irisstar.tech";
    const created = await createUser(
      {
        fullName: "PR014 Production Login",
        email,
        mobile: "+97450001414",
        organization: "IST Tech",
        facility: "UAT",
        department: "Security",
        jobTitle: "Controlled Nurse",
        roles: ["remote_triage_nurse"]
      },
      { userId: "usr_platform_admin_10001", reason: "PR-014 production credential regression" }
    );

    const result = await authenticateLocal({
      username: email,
      password: created.temporaryPassword,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    });

    expect(result).toMatchObject({ ok: false, mfaEnrollmentRequired: true });
    expect(await authenticateLocal({
      username: "layla@irisstar.tech",
      password: "Layla@2026",
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    })).toMatchObject({ ok: false, message: "Invalid username or password." });
  });

  test("identifier encryption round-trips and password hashes reject the wrong value", () => {
    const ciphertext = encryptGovernedIdentifier("pr014@irisstar.tech");
    expect(ciphertext).not.toContain("pr014@irisstar.tech");
    expect(decryptGovernedIdentifier(ciphertext)).toBe("pr014@irisstar.tech");
    const hash = hashGovernedPassword("temporary-password");
    expect(hash).not.toContain("temporary-password");
    expect(verifyGovernedPassword("temporary-password", hash)).toBe(true);
    expect(verifyGovernedPassword("wrong-password", hash)).toBe(false);
  });

  test("an existing nurse receives a governed temporary credential without changing role", async () => {
    const issued = await issueGovernedTemporaryCredential(
      "usr_nurse_10001",
      { userId: "usr_platform_admin_10001", reason: "PR-001 seed-to-governed transition" }
    );
    expect(issued.user.roles).toEqual(["remote_triage_nurse"]);
    expect(issued.temporaryPassword).toHaveLength(24);
    expect(await authenticateLocal({
      username: "layla@irisstar.tech",
      password: issued.temporaryPassword,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    })).toMatchObject({ ok: false, mfaEnrollmentRequired: true });
  });
});
