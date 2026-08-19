/**
 * Admin panel ("Control Center") validation test bucket - exercises every
 * real feature inventoried this session (Users, Roles, Responsibilities,
 * Access Control, PAM elevation, reveal workflow) plus negative/permission
 * tests, against a real running instance (local or GCP demo).
 *
 * Usage: API_BASE=https://triaged.irisstar.tech npx tsx src/scripts/adminPanelTestBucket.ts
 */

import { authenticator } from "otplib";

const API_BASE = process.env.API_BASE ?? "http://localhost:8080";

const ACCOUNTS = {
  superAdmin: { username: "rishma@irisstar.tech", password: process.env.TEST_ADMIN_PASSWORD ?? "" },
  serviceManager: { username: "khalid@irisstar.tech", password: process.env.TEST_MANAGER_PASSWORD ?? "" },
  nurse: { username: "layla@irisstar.tech", password: process.env.TEST_NURSE_PASSWORD ?? "" }
};

type CookieJar = { cookie?: string; token?: string };
type Result = { name: string; pass: boolean; detail: string };

const results: Result[] = [];

function record(name: string, pass: boolean, detail: string) {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} - ${name} - ${detail}`);
}

async function request(jar: CookieJar, path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (jar.cookie) headers.set("Cookie", jar.cookie);
  if (jar.token) headers.set("Authorization", `Bearer ${jar.token}`);
  const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) jar.cookie = setCookie.split(";")[0];
  return response;
}

async function login(username: string, password: string): Promise<CookieJar> {
  const jar: CookieJar = {};
  const r = await request(jar, "/api/v1/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
  if (!r.ok) throw new Error(`Login failed for ${username}: ${r.status}`);
  const body = (await r.json()) as { accessToken?: string };
  jar.token = body.accessToken;
  return jar;
}

// Real PAM elevation requires a real, currently-enabled TOTP factor - rather
// than needing a pre-existing seeded MFA secret we don't control, this
// enrolls a brand-new TOTP factor for the session's own account (a secret we
// generate and hold locally), confirms it with a real generated code, then
// elevates with a real generated code against that same secret. This proves
// the entire real MFA + PAM elevation chain, not a mocked shortcut.
async function elevateViaFreshMfa(jar: CookieJar): Promise<{ elevated: boolean; detail: string }> {
  const enrollResp = await request(jar, "/api/v1/auth/mfa/enroll", { method: "POST" });
  if (!enrollResp.ok) return { elevated: false, detail: `enroll failed: ${enrollResp.status}` };
  const enrollBody = (await enrollResp.json()) as { secret?: string };
  const secret = enrollBody.secret;
  if (!secret) return { elevated: false, detail: "enroll response had no secret" };

  const confirmCode = authenticator.generate(secret);
  const confirmResp = await request(jar, "/api/v1/auth/mfa/enroll/confirm", {
    method: "POST",
    body: JSON.stringify({ code: confirmCode })
  });
  if (!confirmResp.ok) return { elevated: false, detail: `confirm failed: ${confirmResp.status}` };

  const elevateCode = authenticator.generate(secret);
  const elevateResp = await request(jar, "/api/v1/admin/elevate", {
    method: "POST",
    body: JSON.stringify({ code: elevateCode })
  });
  if (!elevateResp.ok) {
    const body = await elevateResp.json().catch(() => ({}));
    return { elevated: false, detail: `elevate failed: ${elevateResp.status} ${JSON.stringify(body)}` };
  }
  return { elevated: true, detail: "elevated via freshly-enrolled MFA" };
}

async function main() {
  console.log(`\n=== Admin Panel Test Bucket against ${API_BASE} ===\n`);

  const superAdmin = await login(ACCOUNTS.superAdmin.username, ACCOUNTS.superAdmin.password);
  const serviceManager = await login(ACCOUNTS.serviceManager.username, ACCOUNTS.serviceManager.password);
  const nurse = await login(ACCOUNTS.nurse.username, ACCOUNTS.nurse.password);
  record("Login: super admin", true, "authenticated");
  record("Login: service manager", true, "authenticated");
  record("Login: nurse", true, "authenticated");

  const elevation = await elevateViaFreshMfa(superAdmin);
  record("PAM: enroll fresh MFA + elevate super admin", elevation.elevated, elevation.detail);

  // --- 1. Users panel ---
  {
    const r = await request(superAdmin, "/api/v1/admin/users?limit=10&offset=0");
    record("Users: list (super admin)", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(serviceManager, "/api/v1/admin/users?limit=10&offset=0");
    record("Users: list denied for service manager (expect 403)", r.status === 403, `status ${r.status}`);
  }

  let createdUserId: string | undefined;
  {
    const email = `test.bucket.${Date.now()}@irisstar.tech`;
    const r = await request(superAdmin, "/api/v1/admin/users", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Test Bucket User",
        email,
        mobile: "+97455559999",
        employeeId: `TB-${Date.now()}`,
        organization: "IST Tech",
        facility: "HIA Midfield",
        department: "QA",
        jobTitle: "Test Account",
        roles: ["remote_triage_nurse"],
        reason: "admin panel test bucket - create user"
      })
    });
    const body = await r.json().catch(() => ({}));
    createdUserId = body?.user?.id;
    record("Users: create user", r.status === 201 || r.status === 200, `status ${r.status}, id=${createdUserId ?? "none"}, body=${JSON.stringify(body)}`);
  }

  if (createdUserId) {
    const r = await request(superAdmin, `/api/v1/admin/users/${createdUserId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "suspended", reason: "admin panel test bucket - suspend" })
    });
    record("Users: suspend created user", r.ok, `status ${r.status}`);
  }

  if (createdUserId) {
    const r = await request(superAdmin, `/api/v1/admin/users/${createdUserId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "active", reason: "admin panel test bucket - reactivate" })
    });
    record("Users: reactivate created user", r.ok, `status ${r.status}`);
  }

  {
    // Self-status-change should be blocked (409)
    const meResp = await request(superAdmin, "/api/v1/auth/session");
    const meBody = await meResp.json().catch(() => ({}));
    const selfId = meBody?.session?.user?.id ?? meBody?.user?.id;
    if (selfId) {
      const r = await request(superAdmin, `/api/v1/admin/users/${selfId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "suspended", reason: "self-lockout test" })
      });
      record("Users: self-status-change blocked (expect 409)", r.status === 409, `status ${r.status}`);
    } else {
      record("Users: self-status-change blocked (expect 409)", false, "could not resolve own user id from session");
    }
  }

  if (createdUserId) {
    const r = await request(superAdmin, `/api/v1/admin/users/${createdUserId}/mfa-reset`, { method: "POST" });
    record("Users: reset MFA", r.ok, `status ${r.status}`);
  }

  if (createdUserId) {
    const r = await request(superAdmin, `/api/v1/admin/users/${createdUserId}/sessions`);
    record("Users: view sessions", r.ok, `status ${r.status}`);
  }

  // --- 2. Roles panel ---
  {
    const r = await request(superAdmin, "/api/v1/admin/roles");
    record("Roles: list", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(superAdmin, "/api/v1/admin/permissions");
    record("Permissions: list catalog", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(superAdmin, "/api/v1/admin/roles/remote_triage_nurse/permissions", {
      method: "POST",
      body: JSON.stringify({ permissionCode: "reports.view", reason: "admin panel test bucket - grant" })
    });
    record("Roles: grant permission to role", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(superAdmin, "/api/v1/admin/roles/remote_triage_nurse/permissions/reports.view", {
      method: "DELETE",
      body: JSON.stringify({ reason: "admin panel test bucket - revoke" })
    });
    record("Roles: revoke permission from role", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(superAdmin, "/api/v1/admin/roles/platform_super_administrator/permissions/admin.roles.manage", {
      method: "DELETE",
      body: JSON.stringify({ reason: "self-lockout test" })
    });
    record("Roles: self-lockout guard (expect 409)", r.status === 409, `status ${r.status}`);
  }

  // --- 3. Responsibilities panel ---
  {
    const r = await request(superAdmin, "/api/v1/admin/responsibilities");
    record("Responsibilities: list catalog", r.ok, `status ${r.status}`);
  }

  // --- 4. Access Control panel ---
  {
    const r = await request(superAdmin, "/api/v1/admin/elevation/status");
    record("Access Control: elevation status", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(superAdmin, "/api/v1/admin/audit-events/resource/UserAccount:test");
    record("Access Control: resource audit-history trace", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(superAdmin, "/api/v1/admin/access-entitlement-reviews");
    record("Access Control: entitlement reviews list", r.ok, `status ${r.status}`);
  }
  {
    const r = await request(superAdmin, "/api/v1/admin/access-revocation-metrics?days=30");
    record("Access Control: revocation metrics", r.ok, `status ${r.status}`);
  }

  // --- 5. Reveal workflow (dual control) - super admin only, to avoid
  // touching Layla's account (which holds privacy.reveal.request but not
  // .approve, so cross-account approval can't be tested with current seed
  // data anyway - noted as a real gap in the summary instead of enrolling
  // MFA on a second real named account).
  let revealRequestId: string | undefined;
  {
    const r = await request(superAdmin, "/api/v1/admin/reveal/request", {
      method: "POST",
      body: JSON.stringify({
        resourceType: "UserAccount",
        resourceId: createdUserId ?? "usr_platform_admin_10001",
        field: "email",
        purpose: "test bucket validation"
      })
    });
    const body = await r.json().catch(() => ({}));
    revealRequestId = body?.id;
    record("Reveal: super admin submits request", r.status === 201 || r.status === 202 || r.ok, `status ${r.status}, id=${revealRequestId ?? "none"}`);
  }
  if (revealRequestId) {
    const r = await request(superAdmin, `/api/v1/admin/reveal/${revealRequestId}/decision`, {
      method: "POST",
      body: JSON.stringify({ decision: "approved" })
    });
    record("Reveal: self-approval blocked (expect 403/409)", r.status === 403 || r.status === 409, `status ${r.status}`);
  }

  // --- 6. Read-only panels (Audit, Governance, Protocol Library, Integration, Reports, Support, Security, Privacy) ---
  const readOnlyRoutes: Array<[string, string]> = [
    ["Audit events", "/api/v1/admin/audit-events"],
    ["Governance", "/api/v1/admin/governance"],
    ["Protocol library", "/api/v1/admin/protocol-library"],
    ["Integrations", "/api/v1/admin/integrations"],
    ["Reports", "/api/v1/admin/reports"],
    ["Support", "/api/v1/admin/support"],
    ["SSO providers", "/api/v1/admin/sso-providers"],
    ["Encryption policies", "/api/v1/admin/encryption-policies"],
    ["Reveal directory", "/api/v1/admin/reveal-directory"],
    ["Control modules", "/api/v1/admin/control-modules"],
    ["Summary", "/api/v1/admin/summary"]
  ];
  for (const [name, path] of readOnlyRoutes) {
    const r = await request(superAdmin, path);
    record(`Read-only: ${name}`, r.ok, `status ${r.status}`);
  }

  // --- 7. API-only endpoints with no frontend UI ---
  const apiOnlyRoutes: Array<[string, string]> = [
    ["Scheduled jobs list", "/api/v1/admin/scheduled-jobs"],
    ["Security thresholds", "/api/v1/admin/security-thresholds"],
    ["Feedback summary", "/api/v1/admin/feedback-summary"],
    ["Feedback trend", "/api/v1/admin/feedback-trend"]
  ];
  for (const [name, path] of apiOnlyRoutes) {
    const r = await request(superAdmin, path);
    record(`API-only: ${name}`, r.ok, `status ${r.status}`);
  }

  // --- 8. Negative permission tests ---
  {
    // 401 here (not 403) is also a correct outcome: granting/revoking a
    // permission on remote_triage_nurse above revokes every currently-active
    // session with that activeRole (real security behavior), which included
    // this nurse jar's own session - so by this point she's not just denied
    // the permission, she's not even authenticated anymore. Both status
    // codes represent "access correctly denied", just via different paths.
    const r = await request(nurse, "/api/v1/admin/roles");
    record("Negative: nurse denied Roles list (expect 401/403)", r.status === 401 || r.status === 403, `status ${r.status}`);
  }
  {
    const r = await request(serviceManager, "/api/v1/admin/roles/remote_triage_nurse/permissions", {
      method: "POST",
      body: JSON.stringify({ permissionCode: "reports.view", reason: "negative test" })
    });
    record("Negative: service manager denied role grant (expect 403)", r.status === 403, `status ${r.status}`);
  }

  console.log("\n=== Summary ===");
  const passed = results.filter((r) => r.pass);
  const failed = results.filter((r) => !r.pass);
  console.log(`${passed.length}/${results.length} passed`);
  if (failed.length > 0) {
    console.log("\nFailures:");
    for (const f of failed) console.log(`  - ${f.name}: ${f.detail}`);
  }
}

main().catch((error) => {
  console.error("Test bucket run failed", error);
  process.exitCode = 1;
});
