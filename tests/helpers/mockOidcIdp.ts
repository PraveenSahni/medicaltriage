import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

// A real local OIDC issuer for testing - not a stub. Serves genuine
// discovery/JWKS/token endpoints and issues real signed JWTs, so the
// application's actual openid-client code path (discovery, PKCE,
// state/nonce validation, ID-token signature verification) gets exercised
// end to end. This is the accepted substitute for a live IdP tenant, which
// this environment doesn't have credentials for.
export type MockOidcIdp = {
  issuerUrl: string;
  stop: () => Promise<void>;
  setNextTokenResponse: (fixture: { code: string; idTokenClaims?: Record<string, unknown>; rawIdToken?: string }) => void;
  signTamperedIdToken: (claims: Record<string, unknown>) => Promise<string>;
};

export async function startMockOidcIdp(): Promise<MockOidcIdp> {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const { privateKey: wrongPrivateKey } = await generateKeyPair("RS256");
  const kid = "mock-idp-key-1";
  const jwk = await exportJWK(publicKey);

  let nextFixture: { code: string; idTokenClaims?: Record<string, unknown>; rawIdToken?: string } | undefined;

  async function signIdToken(claims: Record<string, unknown>, key = privateKey): Promise<string> {
    return new SignJWT(claims)
      .setProtectedHeader({ alg: "RS256", kid })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(key);
  }

  const server: Server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://localhost`);

    if (req.method === "GET" && url.pathname === "/.well-known/openid-configuration") {
      const issuerUrl = issuerUrlFor(server);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          issuer: issuerUrl,
          authorization_endpoint: `${issuerUrl}/authorize`,
          token_endpoint: `${issuerUrl}/token`,
          jwks_uri: `${issuerUrl}/jwks`,
          response_types_supported: ["code"],
          subject_types_supported: ["public"],
          id_token_signing_alg_values_supported: ["RS256"],
          scopes_supported: ["openid", "email", "profile"],
          token_endpoint_auth_methods_supported: ["client_secret_post"],
          code_challenge_methods_supported: ["S256"]
        })
      );
      return;
    }

    if (req.method === "GET" && url.pathname === "/jwks") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ keys: [{ ...jwk, kid, use: "sig", alg: "RS256" }] }));
      return;
    }

    if (req.method === "POST" && url.pathname === "/token") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        const params = new URLSearchParams(body);
        const code = params.get("code");
        if (!nextFixture || code !== nextFixture.code) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ error: "invalid_grant" }));
          return;
        }
        const issuerUrl = issuerUrlFor(server);
        const idToken =
          nextFixture.rawIdToken ??
          (await signIdToken({
            iss: issuerUrl,
            aud: params.get("client_id"),
            sub: "mock-subject",
            ...nextFixture.idTokenClaims
          }));
        res.writeHead(200, { "content-type": "application/json" });
        res.end(
          JSON.stringify({
            access_token: "mock-access-token",
            token_type: "Bearer",
            id_token: idToken
          })
        );
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  function issuerUrlFor(target: Server): string {
    const address = target.address() as AddressInfo;
    return `http://127.0.0.1:${address.port}`;
  }

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  return {
    issuerUrl: issuerUrlFor(server),
    stop: () => new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve()))),
    setNextTokenResponse: (fixture) => {
      nextFixture = fixture;
    },
    signTamperedIdToken: (claims) => signIdToken({ iss: issuerUrlFor(server), ...claims }, wrongPrivateKey)
  };
}
