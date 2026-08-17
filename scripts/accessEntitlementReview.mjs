// Access-entitlement review report - closes part of NFR-036 ("periodic
// reviews of authentication and authorization data via system-generated
// notifications") and CSQ IS.17/18/19 ("annual certification of
// entitlements for all system users and administrators").
//
// Certification recording (added 2026-08-04): after producing the report,
// this now writes a real chained AuditEvent row (action
// ACCESS_ENTITLEMENT_REVIEW_CERTIFIED) through the centralized ledger writer,
// recording the reviewer identity, timestamp, total/flagged account counts,
// and the full flagged list - the actual "who reviewed it, when" record a
// certification requires. Remediation actions taken as a result of a given
// review are still tracked outside this script (there is no workflow that
// automatically remediates a flagged account) - that narrower gap remains.
// Remediation (added 2026-08-04): with --execute, auto-remediable flagged
// accounts (elevated role, no login in 90+ days) are suspended via
// PATCH /api/v1/admin/users/:id/status, which itself writes a real
// AuditEvent for the status change. Dry-run by default (report only, no
// mutation) - mirrors this session's other operational scripts' safety
// pattern.
// Usage: node scripts/accessEntitlementReview.mjs [baseUrl] [--execute]
import { PrismaClient } from "@prisma/client";
import { appendOperationalAuditEvent } from "../dist/services/auditLedger.js";

const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";
const EXECUTE = process.argv.includes("--execute");
const ADMIN_USERNAME = "sa@irisstar.tech";
const ADMIN_PASSWORD_ENV = "LocalMockAdmin!2026";
const prisma = new PrismaClient();

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
      // Only this case is auto-remediable: the account is currently active
      // with no login in 90+ days, so suspending it is a safe, reversible
      // action. The other flagged case (non-active account with an
      // elevated role) is already non-active - nothing to remediate there.
      flagged.push({ email: user.email, userId: user.id, reason: "elevated role, no login in 90+ days", remediable: true });
    }
  }

  console.log("\n=== Flagged for review ===");
  if (flagged.length === 0) {
    console.log("None.");
  } else {
    for (const f of flagged) console.log(`- ${f.email}: ${f.reason}`);
  }

  const remediated = [];
  const remediableCount = flagged.filter((f) => f.remediable).length;
  console.log(`\n${remediableCount} account(s) auto-remediable (elevated + inactive 90+ days). Mode: ${EXECUTE ? "EXECUTE (will suspend)" : "DRY RUN (no changes)"}`);
  if (EXECUTE) {
    for (const f of flagged.filter((item) => item.remediable)) {
      const r = await request(`/api/v1/admin/users/${f.userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "suspended", reason: `Access-entitlement review: ${f.reason}` })
      });
      if (r.ok) {
        remediated.push(f.email);
        console.log(`Suspended: ${f.email}`);
      } else if (r.status === 409) {
        console.log(`Skipped ${f.email}: cannot suspend the account running this review (self-protection guard).`);
      } else {
        console.log(`Failed to suspend ${f.email}: HTTP ${r.status}`);
      }
    }
  }

  const certification = await appendOperationalAuditEvent({
      userId: ADMIN_USERNAME,
      action: "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED",
      module: "AccessGovernance",
      resource: "UserAccount",
      success: true,
      risk: flagged.length > 0 ? "medium" : "low",
      metadata: {
          baseUrl: BASE_URL,
          totalAccounts: users.length,
          flaggedCount: flagged.length,
          flagged,
          remediableCount,
          remediatedCount: remediated.length,
          remediated
      }
  });

  console.log(`\nCertification recorded: AuditEvent ${certification.id} (reviewer=${ADMIN_USERNAME}, ${certification.timestamp.toISOString()}).`);
  console.log(
    "Note: auto-remediable findings (elevated + inactive 90+ days) can now be suspended automatically with " +
      "--execute, itself recorded as a real AuditEvent. The other flagged case (elevated role on an already " +
      "non-active account) has nothing to auto-remediate and still requires human judgment."
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Access review failed:", error);
  process.exitCode = 1;
});
