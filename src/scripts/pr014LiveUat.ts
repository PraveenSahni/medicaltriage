import { mkdir, writeFile } from "node:fs/promises";
import { authenticator } from "otplib";

const API_BASE = (process.env.API_BASE ?? "").replace(/\/$/, "");
const allowedTargets = new Set([
  "https://triaged.irisstar.tech",
  "https://ist-triage-demo-1096520215793.me-central1.run.app",
  "https://pr010-canary---ist-triage-demo-gv6v4zyvuq-ww.a.run.app",
  "https://pr014-canary---ist-triage-demo-gv6v4zyvuq-ww.a.run.app"
]);

if (process.env.ALLOW_LIVE_ADMIN_UAT !== "PR014") throw new Error("Set ALLOW_LIVE_ADMIN_UAT=PR014 to authorize synthetic live mutations.");
if (!allowedTargets.has(API_BASE)) throw new Error(`Refusing unapproved PR-014 target: ${API_BASE || "<empty>"}`);

const credentials = {
  admin: { username: process.env.PR014_ADMIN_USERNAME ?? "rishma@irisstar.tech", password: process.env.PR014_ADMIN_PASSWORD ?? "PlatformAdmin@2026" },
  manager: { username: process.env.PR014_MANAGER_USERNAME ?? "khalid@irisstar.tech", password: process.env.PR014_MANAGER_PASSWORD ?? "Khalid@2026" },
  nurse: { username: process.env.PR014_NURSE_USERNAME ?? "layla@irisstar.tech", password: process.env.PR014_NURSE_PASSWORD ?? "Layla@2026" }
};

type Jar = { cookie?: string; token?: string };
type Evidence = { id: string; method: string; path: string; expected: number[]; actual: number; pass: boolean; note?: string };
const evidence: Evidence[] = [];

async function call(jar: Jar, id: string, method: string, path: string, expected: number[], body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-PR-014-UAT": "synthetic" };
  if (jar.cookie) headers.Cookie = jar.cookie;
  if (jar.token) headers.Authorization = `Bearer ${jar.token}`;
  const response = await fetch(`${API_BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) jar.cookie = setCookie.split(";")[0];
  const parsed = await response.json().catch(() => ({}));
  const item = { id, method, path, expected, actual: response.status, pass: expected.includes(response.status) };
  evidence.push(item);
  console.log(`${item.pass ? "PASS" : "FAIL"} ${id} ${method} ${path} -> ${response.status}`);
  return { response, body: parsed as Record<string, any> };
}

async function login(label: string, username: string, password: string) {
  const jar: Jar = {};
  const result = await call(jar, `AUTH-${label}`, "POST", "/api/v1/auth/login", [200], { username, password });
  jar.token = result.body.accessToken;
  return jar;
}

function requireAllEvidencePassed(mode: string) {
  const failed = evidence.filter((item) => !item.pass);
  if (failed.length > 0) {
    throw new Error(`${mode} recorded ${failed.length} failed HTTP control(s): ${failed.map((item) => item.id).join(", ")}`);
  }
}

async function main() {
  const anonymous: Jar = {};
  const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const email = `pr014.uat.${stamp}@irisstar.tech`;
  const payload = {
    fullName: "PR-014 Synthetic UAT User", email, mobile: "+97455550140", organization: "IST Tech",
    facility: "QA", department: "Security UAT", jobTitle: "Synthetic Test Account",
    roles: ["remote_triage_nurse"], reason: `PR-014 live UAT ${stamp}`
  };

  if (process.env.PR014_VERIFY_ONLY === "true") {
    const runtime = await call({}, "VERIFY-RUNTIME", "GET", "/api/v1/runtime/environment", [200]);
    if (runtime.body.environment !== "demo" || runtime.body.dataProfile !== "synthetic") {
      throw new Error("PR-014 verification target is not the synthetic demo environment");
    }
    const admin = await login("VERIFY-ADMIN", credentials.admin.username, credentials.admin.password);
    const roles = await call(admin, "VERIFY-ROLES", "GET", "/api/v1/admin/roles", [200]);
    const nurseRole = roles.body.roles?.find((role: { code: string }) => role.code === "remote_triage_nurse");
    for (const permissionCode of ["reports.view", "privacy.reveal.approve"]) {
      if (nurseRole?.permissions?.includes(permissionCode)) throw new Error(`Transient permission still present: ${permissionCode}`);
    }
    const users = await call(admin, "VERIFY-USERS", "GET", "/api/v1/admin/users", [200]);
    const activeSyntheticUsers = (users.body.users ?? []).filter((user: any) =>
      user.fullName === "PR-014 Synthetic UAT User" && user.jobTitle === "Synthetic Test Account" && user.accountStatus === "active"
    );
    if (activeSyntheticUsers.length > 0) throw new Error(`${activeSyntheticUsers.length} active PR-014 synthetic users remain`);
    requireAllEvidencePassed("PR-014 verify-only mode");
    console.log("PASS VERIFY clean synthetic identity state");
    return;
  }

  if (process.env.PR014_RECOVERY === "true") {
    const admin = await login("RECOVERY-ADMIN", credentials.admin.username, credentials.admin.password);
    const enroll = await call(admin, "RECOVERY-MFA-ENROLL", "POST", "/api/v1/auth/mfa/enroll", [200]);
    const secret = enroll.body.secret;
    if (!secret) throw new Error("Recovery MFA enrollment returned no secret");
    await call(admin, "RECOVERY-MFA-CONFIRM", "POST", "/api/v1/auth/mfa/enroll/confirm", [200], { code: authenticator.generate(secret) });
    await call(admin, "RECOVERY-ELEVATE", "POST", "/api/v1/admin/elevate", [200], { code: authenticator.generate(secret) });
    const roles = await call(admin, "RECOVERY-ROLES", "GET", "/api/v1/admin/roles", [200]);
    const nurseRole = roles.body.roles?.find((role: { code: string }) => role.code === "remote_triage_nurse");
    for (const permissionCode of ["reports.view", "privacy.reveal.approve"]) {
      if (nurseRole?.permissions?.includes(permissionCode)) {
        await call(admin, `RECOVERY-REVOKE-${permissionCode}`, "DELETE", `/api/v1/admin/roles/remote_triage_nurse/permissions/${permissionCode}`, [200], { reason: `PR-014 recovery rollback ${stamp}` });
      }
    }
    const users = await call(admin, "RECOVERY-USERS", "GET", "/api/v1/admin/users", [200]);
    const activeSyntheticUsers = (users.body.users ?? []).filter((user: any) =>
      user.fullName === "PR-014 Synthetic UAT User" && user.jobTitle === "Synthetic Test Account" && user.accountStatus === "active"
    );
    for (const user of activeSyntheticUsers) {
      await call(admin, `RECOVERY-DEACTIVATE-${user.id}`, "PATCH", `/api/v1/admin/users/${user.id}/status`, [200], { status: "deactivated", reason: `PR-014 recovery cleanup ${stamp}` });
    }
    if (activeSyntheticUsers.length === 0) console.log("PASS RECOVERY no active PR-014 synthetic users remained");
    requireAllEvidencePassed("PR-014 recovery mode");
    return;
  }

  await call(anonymous, "UAT-001", "POST", "/api/v1/admin/users", [401], payload);
  const admin = await login("ADMIN", credentials.admin.username, credentials.admin.password);
  const manager = await login("MANAGER", credentials.manager.username, credentials.manager.password);
  const nurse = await login("NURSE", credentials.nurse.username, credentials.nurse.password);
  await call(manager, "UAT-002", "POST", "/api/v1/admin/users", [403], payload);
  await call(nurse, "UAT-003", "POST", "/api/v1/admin/roles/remote_triage_nurse/permissions", [403], { permissionCode: "reports.view", reason: "negative UAT" });
  await call(admin, "UAT-004", "POST", "/api/v1/admin/users", [403], payload);

  const enroll = await call(admin, "UAT-005", "POST", "/api/v1/auth/mfa/enroll", [200]);
  const secret = enroll.body.secret;
  if (!secret) throw new Error("MFA enrollment returned no secret");
  await call(admin, "UAT-006", "POST", "/api/v1/auth/mfa/enroll/confirm", [200], { code: authenticator.generate(secret) });
  await call(admin, "UAT-007", "POST", "/api/v1/admin/elevate", [200], { code: authenticator.generate(secret) });

  let createdUserId: string | undefined;
  const additionalCreatedUserIds: string[] = [];
  let permissionWasGranted = false;
  let conflictingPermissionWasGranted = false;
  try {
    const created = await call(admin, "UAT-008", "POST", "/api/v1/admin/users", [201], payload);
    createdUserId = created.body.user?.id;
    const temporaryPassword = created.body.temporaryPassword;
    if (!createdUserId || !temporaryPassword) throw new Error("Create user response omitted id or temporary password");

    await login("CREATED-USER", email, temporaryPassword);
    await call(admin, "UAT-009", "POST", "/api/v1/admin/users", [409], payload);
    await call(admin, "UAT-010", "POST", "/api/v1/admin/users", [400], { ...payload, email: `pr014.${stamp}@example.com` });
    await call(admin, "UAT-011", "POST", "/api/v1/admin/users", [400], { ...payload, email: `pr014.badrole.${stamp}@irisstar.tech`, roles: ["not_a_role"] });
    const conflictingUser = await call(admin, "UAT-012", "POST", "/api/v1/admin/users", [409], { ...payload, email: `pr014.conflict.${stamp}@irisstar.tech`, roles: ["remote_triage_nurse", "triage_service_manager"] });
    if (conflictingUser.response.status === 201 && conflictingUser.body.user?.id) additionalCreatedUserIds.push(conflictingUser.body.user.id);

    const before = await call(admin, "UAT-013", "GET", "/api/v1/admin/roles", [200]);
    const nurseRole = before.body.roles?.find((role: { code: string }) => role.code === "remote_triage_nurse");
    if (nurseRole?.permissions?.includes("reports.view")) throw new Error("Reversible live grant precondition failed: reports.view already present");
    await call(admin, "UAT-014", "POST", "/api/v1/admin/roles/remote_triage_nurse/permissions", [200], { permissionCode: "reports.view", reason: `PR-014 reversible live grant ${stamp}` });
    permissionWasGranted = true;
    const afterGrant = await call(admin, "UAT-015", "GET", "/api/v1/admin/roles", [200]);
    const grantedRole = afterGrant.body.roles?.find((role: { code: string }) => role.code === "remote_triage_nurse");
    if (!grantedRole?.permissions?.includes("reports.view")) throw new Error("Granted permission was not immediately visible");
    await call(manager, "UAT-016", "POST", "/api/v1/admin/roles/remote_triage_nurse/permissions", [403], { permissionCode: "reports.view", reason: "negative UAT" });
    const conflictingGrant = await call(admin, "UAT-017", "POST", "/api/v1/admin/roles/remote_triage_nurse/permissions", [409], { permissionCode: "privacy.reveal.approve", reason: "PR-014 SoD negative UAT" });
    conflictingPermissionWasGranted = conflictingGrant.response.status === 200;
    await call(admin, "UAT-018", "GET", `/api/v1/admin/audit-events/resource/UserAccount:${createdUserId}`, [200]);
  } finally {
    if (permissionWasGranted) {
      await call(admin, "CLEAN-001", "DELETE", "/api/v1/admin/roles/remote_triage_nurse/permissions/reports.view", [200], { reason: `PR-014 rollback ${stamp}` });
    }
    if (conflictingPermissionWasGranted) {
      await call(admin, "CLEAN-003", "DELETE", "/api/v1/admin/roles/remote_triage_nurse/permissions/privacy.reveal.approve", [200], { reason: `PR-014 unexpected-grant rollback ${stamp}` });
    }
    if (createdUserId) {
      await call(admin, "CLEAN-002", "PATCH", `/api/v1/admin/users/${createdUserId}/status`, [200], { status: "deactivated", reason: `PR-014 approved synthetic cleanup ${stamp}` });
    }
    for (const userId of additionalCreatedUserIds) {
      await call(admin, `CLEAN-004-${userId}`, "PATCH", `/api/v1/admin/users/${userId}/status`, [200], { status: "deactivated", reason: `PR-014 unexpected-create cleanup ${stamp}` });
    }
  }

  const output = { control: "PR-014", target: API_BASE, executedAt: new Date().toISOString(), syntheticEmail: email, evidence, passed: evidence.every((item) => item.pass) };
  await mkdir("test-results", { recursive: true });
  const outputPath = `test-results/pr014-live-uat-${stamp}.json`;
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Evidence: ${outputPath}`);
  if (!output.passed) process.exitCode = 1;
}

main().catch((error) => { console.error("PR-014 live UAT failed:", error instanceof Error ? error.message : error); process.exitCode = 1; });
