// Access-entitlement review report - closes part of NFR-036 ("periodic
// reviews of authentication and authorization data via system-generated
// notifications") and CSQ IS.17/18/19 ("annual certification of
// entitlements for all system users and administrators"). This produces
// the report a reviewer would certify against; it does not yet implement
// the certification workflow (recording who reviewed it, when, and any
// remediation actions) - that's the honest remaining gap, noted in the
// output itself rather than glossed over.
// Usage: node scripts/accessEntitlementReview.mjs [baseUrl]
const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";
const ADMIN_USERNAME = "sa@irisstar.tech";
const ADMIN_PASSWORD_ENV = "LocalMockAdmin!2026";

const jar = {};

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (jar.cookie) headers.set("Cookie", jar.cookie);
  if (jar.token) headers.set("Authorization", `Bearer ${jar.token}`);
  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) jar.cookie = setCookie.split(";")[0];
  return response;
}

async function login() {
  const r = await request("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: ADMIN_USERNAME, password: ADMIN_PASSWORD_ENV })
  });
  if (!r.ok) throw new Error(`Login failed: ${r.status}`);
  const body = await r.json();
  jar.token = body.accessToken;
}

async function main() {
  await login();

  const usersRes = await request("/api/v1/admin/users");
  if (!usersRes.ok) throw new Error(`Failed to list users: ${usersRes.status}`);
  const { users } = await usersRes.json();

  const rolesRes = await request("/api/v1/admin/roles");
  const { roles } = rolesRes.ok ? await rolesRes.json() : { roles: [] };
  const roleByCode = new Map(roles.map((r) => [r.code, r]));

  console.log(`Access entitlement review - ${BASE_URL} - generated ${new Date().toISOString()}`);
  console.log(`Total accounts: ${users.length}\n`);

  const flagged = [];

  for (const user of users) {
    const roleLabels = (user.roles ?? []).map((code) => roleByCode.get(code)?.name ?? code);
    const isElevated = (user.roles ?? []).some((r) => /admin|manager|super/i.test(r));
    const inactiveOver90Days =
      user.lastLoginIso && new Date(user.lastLoginIso).getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000;

    console.log(
      `- ${user.fullName} <${user.email}> | status=${user.accountStatus} | roles=[${roleLabels.join(", ")}] | lastLogin=${user.lastLoginIso ?? "never"}`
    );

    if (user.accountStatus !== "active" && isElevated) {
      flagged.push({ email: user.email, reason: "elevated role on a non-active account" });
    }
    if (inactiveOver90Days && isElevated) {
      flagged.push({ email: user.email, reason: "elevated role, no login in 90+ days" });
    }
  }

  console.log("\n=== Flagged for review ===");
  if (flagged.length === 0) {
    console.log("None.");
  } else {
    for (const f of flagged) console.log(`- ${f.email}: ${f.reason}`);
  }

  console.log(
    "\nNote: this is the report a reviewer certifies against, not the certification itself. " +
      "No workflow yet records who reviewed this, when, or what remediation followed - " +
      "see CSQ IS.17-19 in the questionnaire review for the honest remaining gap."
  );
}

main().catch((error) => {
  console.error("Access review failed:", error);
  process.exitCode = 1;
});
