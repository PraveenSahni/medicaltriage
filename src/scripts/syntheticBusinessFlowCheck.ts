// Real synthetic business-flow check (NFR-124): unlike the bare HTTP
// health-endpoint uptime probe, this exercises an actual business flow -
// login (including the real MFA challenge every account on this
// environment requires) followed by a real authenticated queue read -
// against the live soc2 environment, using a dedicated, low-privilege
// synthetic-monitoring identity (never a real human persona's
// credentials).
//
// Usage: node scripts/syntheticBusinessFlowCheck.mjs [baseUrl]
// Requires env vars: SYNTHETIC_MONITOR_PASSWORD, SYNTHETIC_MONITOR_MFA_SECRET
import { authenticator } from "otplib";

const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";
const USERNAME = "synthetic-monitor@irisstar.tech";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function main() {
  const password = requireEnv("SYNTHETIC_MONITOR_PASSWORD");
  const mfaSecret = requireEnv("SYNTHETIC_MONITOR_MFA_SECRET");

  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password })
  });
  const loginBody = await loginRes.json();

  let cookie: string | null;
  if (loginRes.status === 202 && loginBody.mfaRequired) {
    const code = authenticator.generate(mfaSecret);
    const verifyRes = await fetch(`${BASE_URL}/api/v1/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId: loginBody.challengeId, code })
    });
    if (verifyRes.status !== 200) {
      throw new Error(`MFA verification failed: ${verifyRes.status} ${await verifyRes.text()}`);
    }
    cookie = verifyRes.headers.get("set-cookie");
  } else if (loginRes.status === 200) {
    cookie = loginRes.headers.get("set-cookie");
  } else {
    throw new Error(`Login failed: ${loginRes.status} ${JSON.stringify(loginBody)}`);
  }

  if (!cookie) {
    throw new Error("Login succeeded but no session cookie was returned.");
  }
  // set-cookie carries attributes (HttpOnly; SameSite=...; Path=...) that
  // must NOT be forwarded in a request Cookie header - only the
  // name=value pair itself.
  const cookiePair = cookie.split(";")[0];

  const queueRes = await fetch(`${BASE_URL}/api/v1/queue`, {
    headers: { Cookie: cookiePair }
  });
  if (queueRes.status !== 200) {
    throw new Error(`Authenticated queue read failed: ${queueRes.status} ${await queueRes.text()}`);
  }
  const queueBody = await queueRes.json();

  console.log(
    `Synthetic business-flow check OK - login+MFA succeeded, queue read returned ${queueBody.count} item(s) (totalCount ${queueBody.totalCount}) at ${new Date().toISOString()}.`
  );
}

main().catch((error) => {
  console.error("Synthetic business-flow check FAILED:", error);
  process.exitCode = 1;
});
