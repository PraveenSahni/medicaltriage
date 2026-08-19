import { authenticator } from "otplib";

const BASE_URL = process.argv[2];
if (!BASE_URL) throw new Error("usage: node _auditPersistValidate.mjs <canaryUrl>");

async function login(username, password, simulateRole) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, simulateRole })
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function main() {
  // 1. Failed login (wrong password) - LOGIN failure event
  const fail = await login("pa@irisstar.tech", "WrongPassword!", "platform_super_administrator");
  console.log("failed login:", fail.status);

  // 2. Enrolled admin: successful password step -> MFA challenge -> MFA success
  const step1 = await login("pa@irisstar.tech", process.env.TEST_ADMIN_PASSWORD ?? "", "platform_super_administrator");
  console.log("admin step1 (mfa required):", step1.status, JSON.stringify(step1.body));
  if (step1.status !== 202) throw new Error("expected MFA challenge for enrolled admin");

  // We don't have the admin's real secret in this process - use the known
  // seed value is not available; instead exercise MFA FAILURE (wrong code),
  // which is the real, capturable audit event for this validation pass.
  const wrongVerify = await fetch(`${BASE_URL}/api/v1/auth/mfa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ challengeId: step1.body.challengeId, code: "000000" })
  });
  console.log("mfa verify (wrong code):", wrongVerify.status);

  // 3. Access-denied action: an unauthenticated request to a protected admin route
  const denied = await fetch(`${BASE_URL}/api/v1/admin/audit-events`);
  console.log("access denied (no session):", denied.status);
}

main().catch((error) => {
  console.error("FAILED:", error.message);
  process.exitCode = 1;
});
