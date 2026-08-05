import { authenticator } from "otplib";

const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";

const ACCOUNTS = [
  { username: "pa@irisstar.tech", password: "PlatformAdmin@2026", role: "platform_super_administrator", label: "admin" },
  { username: "layla@irisstar.tech", password: "Layla@2026", role: "remote_triage_nurse", label: "nurse" }
];

async function login(account) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: account.username, password: account.password, simulateRole: account.role })
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function enrollAndConfirm(account) {
  const { status: loginStatus, body: loginBody } = await login(account);
  if (loginStatus !== 200 || !loginBody.accessToken) {
    throw new Error(`${account.label} initial login failed: ${loginStatus} ${JSON.stringify(loginBody)}`);
  }
  const token = loginBody.accessToken;

  const enrollRes = await fetch(`${BASE_URL}/api/v1/auth/mfa/enroll`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });
  const enrollBody = await enrollRes.json();
  if (enrollRes.status !== 200 || !enrollBody.secret) {
    throw new Error(`${account.label} enroll failed: ${enrollRes.status} ${JSON.stringify(enrollBody)}`);
  }

  const code = authenticator.generate(enrollBody.secret);
  const confirmRes = await fetch(`${BASE_URL}/api/v1/auth/mfa/enroll/confirm`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  const confirmBody = await confirmRes.json();
  if (confirmRes.status !== 200) {
    throw new Error(`${account.label} confirm failed: ${confirmRes.status} ${JSON.stringify(confirmBody)}`);
  }

  console.log(`[${account.label}] enrolled and confirmed. secret len=${enrollBody.secret.length}`);

  // Now verify the full second-login MFA-challenge cycle works end-to-end
  // for this now-enrolled account, before any enforcement is turned on.
  const { status: secondLoginStatus, body: secondLoginBody } = await login(account);
  if (secondLoginStatus !== 202 || !secondLoginBody.mfaRequired) {
    throw new Error(`${account.label} second login did not require MFA as expected: ${secondLoginStatus} ${JSON.stringify(secondLoginBody)}`);
  }
  const challengeId = secondLoginBody.challengeId;
  const challengeCode = authenticator.generate(enrollBody.secret);
  const verifyRes = await fetch(`${BASE_URL}/api/v1/auth/mfa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId, code: challengeCode })
  });
  const verifyBody = await verifyRes.json();
  if (verifyRes.status !== 200 || !verifyBody.accessToken) {
    throw new Error(`${account.label} MFA verify failed: ${verifyRes.status} ${JSON.stringify(verifyBody)}`);
  }
  console.log(`[${account.label}] full enroll -> re-login -> MFA challenge -> verify cycle: SUCCESS`);
  return { username: account.username, secret: enrollBody.secret };
}

async function main() {
  const results = [];
  for (const account of ACCOUNTS) {
    results.push(await enrollAndConfirm(account));
  }
  console.log("\nAll accounts enrolled and verified successfully.");
}

main().catch((error) => {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
});
