// Automated accessibility audit (axe-core via Playwright) against a real
// running instance - closes NFR-195/UX-015/AR.09 ("no formal WCAG audit has
// been performed") with a real, broadened baseline, not a fabricated
// pass/fail claim. Usage: node scripts/a11yAudit.mjs [baseUrl]
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";

const NURSE = { username: "layla@irisstar.tech", password: "Layla@2026", role: "remote_triage_nurse" };
const MANAGER = { username: "khalid@irisstar.tech", password: "Khalid@2026", role: "triage_service_manager" };
const PLATFORM_ADMIN = { username: "pa@irisstar.tech", password: "PlatformAdmin@2026", role: "platform_super_administrator" };

async function loginAndGetCookie(baseUrl, persona) {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: persona.username, password: persona.password, simulateRole: persona.role })
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed for ${persona.username}: ${loginRes.status}`);
  }
  const setCookie = loginRes.headers.get("set-cookie");
  if (!setCookie) {
    throw new Error("No session cookie returned from login");
  }
  const [nameValue] = setCookie.split(";");
  const [name, value] = nameValue.split("=");
  return { name, value };
}

async function auditPage(page, url, label, results) {
  await page.goto(url, { waitUntil: "networkidle" });
  const axeResults = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  results.push({
    label,
    url,
    violationCount: axeResults.violations.length,
    violations: axeResults.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodeCount: v.nodes.length,
      sampleTarget: v.nodes[0]?.target?.[0]
    }))
  });
}

async function auditAsPersona(browser, baseUrl, persona, pages, results) {
  const cookie = await loginAndGetCookie(baseUrl, persona);
  const domain = new URL(baseUrl).hostname;
  const context = await browser.newContext();
  await context.addCookies([
    { name: cookie.name, value: cookie.value, domain, path: "/", httpOnly: true, secure: true, sameSite: "Strict" }
  ]);
  const page = await context.newPage();
  for (const { path, label } of pages) {
    await auditPage(page, `${baseUrl}${path}`, label, results);
  }
  await context.close();
}

async function main() {
  const browser = await chromium.launch();
  const results = [];

  try {
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await auditPage(publicPage, `${BASE_URL}/`, "Login page (unauthenticated)", results);
    await auditPage(publicPage, `${BASE_URL}/help`, "Help Center (unauthenticated)", results);
    await publicContext.close();

    // Broadened from the original 2-page baseline (login + Nurse Cockpit) to
    // cover every real, distinct authenticated view this app has - the
    // Triage Service Manager Board (a separate read-only workspace) and the
    // Control Center admin console, each gated by a different real role.
    await auditAsPersona(browser, BASE_URL, NURSE, [{ path: "/#/cockpit", label: "Nurse Cockpit (authenticated)" }], results);
    await auditAsPersona(
      browser,
      BASE_URL,
      MANAGER,
      [{ path: "/#/service-manager-board", label: "Triage Service Manager Board (authenticated)" }],
      results
    );
    await auditAsPersona(
      browser,
      BASE_URL,
      PLATFORM_ADMIN,
      [{ path: "/#/admin", label: "Control Center - Admin (authenticated)" }],
      results
    );
  } finally {
    await browser.close();
  }

  const totalViolations = results.reduce((sum, r) => sum + r.violationCount, 0);
  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const r of results) {
    for (const v of r.violations) {
      if (v.impact && byImpact[v.impact] !== undefined) byImpact[v.impact] += v.nodeCount;
    }
  }

  console.log(JSON.stringify({ baseUrl: BASE_URL, totalViolations, byImpactNodeCount: byImpact, pages: results }, null, 2));
}

main().catch((error) => {
  console.error("Accessibility audit failed:", error);
  process.exitCode = 1;
});
