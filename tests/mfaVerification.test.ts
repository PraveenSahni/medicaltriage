import { authenticator } from "otplib";
import {
  authenticateLocal,
  confirmMfaEnrollment,
  enrollMfa,
  resetSecurityStoreForTests,
  verifyMfaChallenge
} from "../src/services/securityAdmin.js";

const NURSE_EMAIL = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";
const NURSE_ID = "usr_nurse_10001";

// This suite proves real TOTP MFA (closing AR.06/AR.13) - previously
// `mfaStatus`/`mfaVerified` were cosmetic labels copied from static seed
// data with zero real verification anywhere. It's opt-in per user: enrolling
// and confirming a real code flips a user into requiring a second,
// TOTP-verified step at login; users who never enroll are unaffected.
describe("TOTP MFA", () => {
  beforeEach(() => {
    resetSecurityStoreForTests();
  });

  it("enrolls, confirms with the correct code, and requires MFA at the next login", async () => {
    const { secret } = enrollMfa(NURSE_ID);

    // Wrong code during confirmation leaves enrollment pending, not enabled.
    const wrongConfirm = confirmMfaEnrollment(NURSE_ID, "000000");
    expect(wrongConfirm).toBe(false);

    const correctCode = authenticator.generate(secret);
    const confirmed = confirmMfaEnrollment(NURSE_ID, correctCode);
    expect(confirmed).toBe(true);

    const loginResult = await authenticateLocal({
      username: NURSE_EMAIL,
      password: NURSE_PASSWORD,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    });

    expect(loginResult.ok).toBe(true);
    if (!loginResult.ok || !("mfaRequired" in loginResult)) {
      throw new Error("Expected login to require MFA after enrollment");
    }
    expect(loginResult.challengeId).toEqual(expect.any(String));

    const verifyResult = await verifyMfaChallenge(loginResult.challengeId, authenticator.generate(secret));
    expect(verifyResult.ok).toBe(true);
    if (!verifyResult.ok) {
      throw new Error("Expected MFA verification to succeed");
    }
    expect(verifyResult.session.mfaVerified).toBe(true);
    expect(verifyResult.session.authMethod).toBe("local");
  });

  it("does not require MFA for a user who never enrolled", async () => {
    const loginResult = await authenticateLocal({
      username: NURSE_EMAIL,
      password: NURSE_PASSWORD,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    });

    expect(loginResult.ok).toBe(true);
    if (!loginResult.ok || "mfaRequired" in loginResult) {
      throw new Error("Expected an immediate session for a user with no MFA enrolled");
    }
    expect(loginResult.session.mfaVerified).toBe(false);
  });

  it("rejects a wrong TOTP code and reuses the existing account-lockout counter", async () => {
    const { secret } = enrollMfa(NURSE_ID);
    confirmMfaEnrollment(NURSE_ID, authenticator.generate(secret));

    const loginResult = await authenticateLocal({
      username: NURSE_EMAIL,
      password: NURSE_PASSWORD,
      rememberMe: false,
      simulateRole: "remote_triage_nurse",
      ipAddress: "127.0.0.1",
      device: "jest"
    });
    if (!loginResult.ok || !("mfaRequired" in loginResult)) {
      throw new Error("Expected login to require MFA");
    }

    const wrongCode = String((Number(authenticator.generate(secret)) + 1) % 1000000).padStart(6, "0");
    const rejected = await verifyMfaChallenge(loginResult.challengeId, wrongCode);
    expect(rejected.ok).toBe(false);

    // 4 more wrong password/MFA attempts on the same account should hit the
    // shared failedLoginAttempts lockout (threshold 5) - proving a wrong MFA
    // code composes with the existing lockout rather than being exempt from it.
    for (let attempt = 0; attempt < 4; attempt++) {
      await authenticateLocal({
        username: NURSE_EMAIL,
        password: "definitely-wrong",
        rememberMe: false,
        ipAddress: "127.0.0.1",
        device: "jest"
      });
    }

    const lockedOut = await authenticateLocal({
      username: NURSE_EMAIL,
      password: NURSE_PASSWORD,
      rememberMe: false,
      ipAddress: "127.0.0.1",
      device: "jest"
    });
    expect(lockedOut.ok).toBe(false);
    if (lockedOut.ok) {
      throw new Error("Expected account to be locked");
    }
    expect(lockedOut.locked).toBe(true);
  });
});
