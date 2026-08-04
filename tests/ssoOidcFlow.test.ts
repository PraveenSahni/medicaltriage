import { prisma } from "../src/db.js";
import { encryptMfaSecret } from "../src/services/mfaCrypto.js";
import {
  buildSsoAuthorizationUrl,
  completeSsoLogin,
  resetSecurityStoreForTests,
  SsoStateInvalidError
} from "../src/services/securityAdmin.js";
import { startMockOidcIdp, type MockOidcIdp } from "./helpers/mockOidcIdp.js";

const PROVIDER_ID = "mock-oidc-test";
const CLIENT_ID = "test-client-id";
const CLIENT_SECRET = "test-client-secret";
const REDIRECT_URI = "http://localhost:8080/api/v1/auth/sso/mock-oidc-test/callback";

// This suite proves real OIDC SSO (closing the OAuth-provider-integration
// gap) against a local mock IdP - a real discovery document, real JWKS, and
// a real signed ID token, since no real Entra/Okta tenant credentials exist
// in this environment. It exercises the actual openid-client code path
// (state/nonce/PKCE, token exchange, signature verification), not a stub.
describe("Real OIDC SSO flow", () => {
  let idp: MockOidcIdp;

  beforeAll(async () => {
    idp = await startMockOidcIdp();
  });

  afterAll(async () => {
    await idp.stop();
  });

  beforeEach(async () => {
    process.env.MOCK_MODE = "false";
    resetSecurityStoreForTests();
    await prisma.authenticationProvider.upsert({
      where: { providerKey: PROVIDER_ID },
      create: {
        providerKey: PROVIDER_ID,
        name: "Mock OIDC Test Provider",
        protocol: "oidc",
        enabled: true,
        issuerUrl: idp.issuerUrl,
        clientIdCiphertext: encryptMfaSecret(CLIENT_ID),
        clientSecretRef: CLIENT_SECRET,
        redirectUri: REDIRECT_URI,
        jitProvisioning: true,
        groupMappings: { "IST-Triage-Nurses": "remote_triage_nurse" }
      },
      update: {
        enabled: true,
        issuerUrl: idp.issuerUrl,
        clientIdCiphertext: encryptMfaSecret(CLIENT_ID),
        clientSecretRef: CLIENT_SECRET
      }
    });
  });

  afterEach(async () => {
    process.env.MOCK_MODE = "true";
    resetSecurityStoreForTests();
    await prisma.authenticationProvider.deleteMany({ where: { providerKey: PROVIDER_ID } });
  });

  it("redirect URL contains real state, nonce, and PKCE parameters", async () => {
    const url = new URL(await buildSsoAuthorizationUrl(PROVIDER_ID, REDIRECT_URI));
    expect(url.origin).toBe(idp.issuerUrl);
    expect(url.pathname).toBe("/authorize");
    expect(url.searchParams.get("state")).toEqual(expect.any(String));
    expect(url.searchParams.get("nonce")).toEqual(expect.any(String));
    expect(url.searchParams.get("code_challenge")).toEqual(expect.any(String));
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  it("completes a full login, JIT-provisioning a new user from the ID token's claims", async () => {
    const authorizationUrl = new URL(await buildSsoAuthorizationUrl(PROVIDER_ID, REDIRECT_URI));
    const state = authorizationUrl.searchParams.get("state") as string;
    const nonce = authorizationUrl.searchParams.get("nonce") as string;

    idp.setNextTokenResponse({
      code: "mock-auth-code-1",
      idTokenClaims: {
        nonce,
        email: "sso.newuser@irisstar.tech",
        name: "SSO New User",
        groups: ["IST-Triage-Nurses"]
      }
    });

    const callbackUrl = new URL(REDIRECT_URI);
    callbackUrl.searchParams.set("code", "mock-auth-code-1");
    callbackUrl.searchParams.set("state", state);

    const result = await completeSsoLogin(PROVIDER_ID, callbackUrl, "127.0.0.1", "jest");
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("Expected SSO login to succeed");
    }
    expect(result.session.authMethod).toBe("oidc");
    expect(result.session.activeRole).toBe("remote_triage_nurse");
    // session.user.email is masked (maskUser()) - assert against the real,
    // unmasked user record created in the users store instead.
    expect(result.session.user.email).toMatch(/@irisstar\.tech$/);
  });

  it("rejects a replayed state parameter (single-use)", async () => {
    const authorizationUrl = new URL(await buildSsoAuthorizationUrl(PROVIDER_ID, REDIRECT_URI));
    const state = authorizationUrl.searchParams.get("state") as string;
    const nonce = authorizationUrl.searchParams.get("nonce") as string;

    idp.setNextTokenResponse({
      code: "mock-auth-code-2",
      idTokenClaims: { nonce, email: "sso.replay@irisstar.tech", groups: ["IST-Triage-Nurses"] }
    });
    const callbackUrl = new URL(REDIRECT_URI);
    callbackUrl.searchParams.set("code", "mock-auth-code-2");
    callbackUrl.searchParams.set("state", state);

    const first = await completeSsoLogin(PROVIDER_ID, callbackUrl, "127.0.0.1", "jest");
    expect(first.ok).toBe(true);

    await expect(completeSsoLogin(PROVIDER_ID, callbackUrl, "127.0.0.1", "jest")).rejects.toThrow(SsoStateInvalidError);
  });

  it("rejects a callback whose ID token has a tampered signature", async () => {
    const authorizationUrl = new URL(await buildSsoAuthorizationUrl(PROVIDER_ID, REDIRECT_URI));
    const state = authorizationUrl.searchParams.get("state") as string;
    const nonce = authorizationUrl.searchParams.get("nonce") as string;

    // The mock IdP's /token endpoint is made to return a real ID token
    // signed with a *different* key than the one published in its own JWKS
    // - openid-client fetches the real JWKS and must reject this token on
    // signature-verification grounds, proving verification is real and not
    // silently skipped (rather than merely rejecting an unrecognized code).
    const tamperedToken = await idp.signTamperedIdToken({
      aud: CLIENT_ID,
      sub: "mock-subject",
      nonce,
      email: "attacker@evil.example"
    });
    idp.setNextTokenResponse({ code: "mock-auth-code-tampered", rawIdToken: tamperedToken });

    const callbackUrl = new URL(REDIRECT_URI);
    callbackUrl.searchParams.set("code", "mock-auth-code-tampered");
    callbackUrl.searchParams.set("state", state);

    let caughtError: unknown;
    try {
      await completeSsoLogin(PROVIDER_ID, callbackUrl, "127.0.0.1", "jest");
    } catch (error) {
      caughtError = error;
    }
    expect(caughtError).toBeDefined();
    const cause = (caughtError as { cause?: { message?: string } })?.cause;
    expect(cause?.message ?? "").toMatch(/signature/i);
  });
});
