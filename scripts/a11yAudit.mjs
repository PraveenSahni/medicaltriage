// Automated accessibility audit (axe-core via Playwright) against a real
// running instance - closes NFR-195/UX-015/AR.09 ("no formal WCAG audit has
// been performed") with a real, broadened baseline, not a fabricated
// pass/fail claim. Usage: node scripts/a11yAudit.mjs [baseUrl]
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";

// Switched from layla@irisstar.tech to sara@irisstar.tech (2026-08-05,
// Nurse Cockpit responsive batch): layla's account has a real, enabled
// MFA credential enrolled from earlier AR.13 MFA testing, which makes
// /api/v1/auth/login return 202 { mfaRequired: true } instead of 200 -
// a real login that never completes via this simple username/password
// flow. Found because response.ok() is true for 202, which had been
// silently letting this script "succeed" past an incomplete login and
// audit whatever unauthenticated page state was left, not the real
// Nurse Cockpit (see loginViaUi's fixed check below). sara@irisstar.tech
// carries the same real remote_triage_nurse role/permissions and has no
// MFA credential enrolled, confirmed via a real login returning
// authenticated:true.
const NURSE = { username: "sara@irisstar.tech", password: "Sara@2026", role: "remote_triage_nurse" };
const MANAGER = { username: "khalid@irisstar.tech", password: "Khalid@2026", role: "triage_service_manager" };
// Switched from pa@irisstar.tech to sa@irisstar.tech for the same reason
// as NURSE above - pa now has an enrolled MFA credential and cannot
// complete a simple login. sa@irisstar.tech (system_administrator) is a
// real, distinct seeded account with confirmed Control Center admin
// access and no MFA enrolled.
const PLATFORM_ADMIN = { username: "sa@irisstar.tech", password: "SystemAdmin@2026", role: "system_administrator" };

// Real UI-driven login (not a raw fetch() extracting a Set-Cookie header) -
// found during the NFR-015 redeployment batch that Firebase Hosting's `run`
// rewrite (fronting triagedsoc2.irisstar.tech) does not reliably return a
// Set-Cookie header to a bare HTTP client either, mirroring the already-
// documented request-side Cookie-forwarding limitation
// (docs/architecture/session-authentication-cross-instance.md). A real
// browser driving the actual login form uses the app's own patched
// Bearer-token fetch (frontend/src/authToken.ts's installBearerTokenFetch())
// for every subsequent API call, exactly like a real user - this is the
// same auth path already proven reliable throughout this engagement's
// cross-browser e2e suite (tests/e2e/browser-journey.spec.ts).
async function loginViaUi(page, baseUrl, persona) {
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.locator("#username").fill(persona.username);
  await page.locator("#password").fill(persona.password);
  const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/v1/auth/login"));
  await page.locator("button[type=submit]").click();
  const response = await responsePromise;
  // response.ok() is true for any 2xx status, including the real 202
  // mfaRequired response - found during the Nurse Cockpit responsive
  // batch that this silently let the script "succeed" past a login that
  // never actually completed, auditing whatever unauthenticated/partial
  // state the page was left in instead of throwing loudly. Must check
  // the real response body, not just the HTTP status class.
  const body = await response.json();
  if (!response.ok() || body.authenticated !== true) {
    throw new Error(
      `Login did not complete for ${persona.username}: status ${response.status()}, ` +
        `authenticated=${body.authenticated}, mfaRequired=${body.mfaRequired ?? false}`
    );
  }
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
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginViaUi(page, baseUrl, persona);
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
