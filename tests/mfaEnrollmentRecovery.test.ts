import { authenticator } from "otplib";
import {
  authenticateLocal,
  confirmMfaEnrollmentWithToken,
  CrossTenantMfaResetError,
  enrollMfaWithToken,
  EnrollmentTokenInvalidError,
  resetMfaForUser,
  resetSecurityStoreForTests,
  SelfMfaResetError,
  verifyMfaChallenge
} from "../src/services/securityAdmin.js";

const NURSE_EMAIL = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";
const NURSE_ID = "usr_nurse_10001";
const MANAGER_ID = "usr_manager_10001";

// Closes AR.13's real circular-dependency gap: mandatory MFA previously
// blocked login before an unenrolled user could ever reach the
// session-gated /mfa/enroll routes. This suite exercises the pre-auth
// enrollment token that breaks that circle, and the administrator-assisted
// reset/recovery path.
describe("AR.13 MFA enrollment token + administrator reset", () => {
  const ORIGINAL_ENV = process.env.MFA_MANDATORY;

  beforeEach(() => {
    resetSecurityStoreForTests();
    process.env.MFA_MANDATORY = "true";
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.MFA_MANDATORY;
    } else {
      process.env.MFA_MANDATORY = ORIGINAL_ENV;
    }
  });

  async function loginAndGetEnrollmentToken() {
    const result = await authenticateLocal({
      username: NURSE_EMAIL,
      password: NURSE_PASSWORD,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    });
    if (result.ok || !result.mfaEnrollmentRequired || !result.enrollmentToken) {
      throw new Error("Expected a real pre-auth enrollment token");
    }
    return result.enrollmentToken;
  }

  it("issues a real enrollment token for an unenrolled user under MFA_MANDATORY, not a dead end", async () => {
    const token = await loginAndGetEnrollmentToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("denies login outright for a wrong password even under MFA_MANDATORY", async () => {
    const result = await authenticateLocal({
      username: NURSE_EMAIL,
      password: "wrong-password",
      rememberMe: false,
      ipAddress: "127.0.0.1",
      device: "jest"
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected failure");
    expect(result.mfaEnrollmentRequired).toBeUndefined();
  });

  it("completes enrollment via the token, consumes it, and requires a fresh MFA login afterward", async () => {
    const token = await loginAndGetEnrollmentToken();

    const { secret } = enrollMfaWithToken(token);
    const confirmed = confirmMfaEnrollmentWithToken(token, authenticator.generate(secret));
    expect(confirmed).toBe(true);

    // Single-use: the same token cannot be replayed for a second enrollment.
    expect(() => enrollMfaWithToken(token)).toThrow(EnrollmentTokenInvalidError);

    // A fresh login now goes through the normal MFA challenge, not another
    // enrollment token - proving the credential really persisted.
    const secondLogin = await authenticateLocal({
      username: NURSE_EMAIL,
      password: NURSE_PASSWORD,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    });
    expect(secondLogin.ok).toBe(true);
    if (!secondLogin.ok || !("mfaRequired" in secondLogin)) {
      throw new Error("Expected the normal MFA challenge after real enrollment");
    }
    const verify = await verifyMfaChallenge(secondLogin.challengeId, authenticator.generate(secret));
    expect(verify.ok).toBe(true);
  });

  it("rejects an invalid OTP during token-based enrollment confirmation without consuming the token", async () => {
    const token = await loginAndGetEnrollmentToken();
    enrollMfaWithToken(token);
    const confirmed = confirmMfaEnrollmentWithToken(token, "000000");
    expect(confirmed).toBe(false);
  });

  it("rejects an unknown/garbage enrollment token", () => {
    expect(() => enrollMfaWithToken("not-a-real-token")).toThrow(EnrollmentTokenInvalidError);
  });

  describe("administrator-assisted reset", () => {
    it("resets a target user's MFA, revokes their sessions, and forces re-enrollment", async () => {
      const token = await loginAndGetEnrollmentToken();
      const { secret } = enrollMfaWithToken(token);
      confirmMfaEnrollmentWithToken(token, authenticator.generate(secret));

      const login = await authenticateLocal({
        username: NURSE_EMAIL,
        password: NURSE_PASSWORD,
        rememberMe: false,
        simulateRole: "remote_triage_nurse",
        ipAddress: "127.0.0.1",
        device: "jest"
      });
      if (!login.ok || !("mfaRequired" in login)) throw new Error("expected mfa challenge");
      const verified = await verifyMfaChallenge(login.challengeId, authenticator.generate(secret));
      if (!verified.ok) throw new Error("expected verified session");

      const result = await resetMfaForUser(NURSE_ID, { userId: MANAGER_ID, organization: "IST Tech" }, "Lost device");
      expect(result.sessionsRevoked).toBeGreaterThanOrEqual(1);

      // Re-enrollment is required again - the reset user must go back
      // through the same enrollment-token flow as a never-enrolled user.
      const nextLogin = await authenticateLocal({
        username: NURSE_EMAIL,
        password: NURSE_PASSWORD,
        rememberMe: false,
        simulateRole: "remote_triage_nurse",
        ipAddress: "127.0.0.1",
        device: "jest"
      });
      expect(nextLogin.ok).toBe(false);
      if (nextLogin.ok) throw new Error("expected enrollment-required");
      expect(nextLogin.mfaEnrollmentRequired).toBe(true);
      expect(nextLogin.enrollmentToken).toEqual(expect.any(String));
    });

    it("rejects an administrator resetting their own MFA through this action", async () => {
      await expect(
        resetMfaForUser(MANAGER_ID, { userId: MANAGER_ID, organization: "IST Tech" }, "self reset")
      ).rejects.toThrow(SelfMfaResetError);
    });

    it("rejects a cross-tenant reset", async () => {
      await expect(
        resetMfaForUser(NURSE_ID, { userId: MANAGER_ID, organization: "A Different Org" }, "cross tenant")
      ).rejects.toThrow(CrossTenantMfaResetError);
    });
  });
});
