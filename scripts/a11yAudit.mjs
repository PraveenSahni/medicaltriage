// Automated accessibility audit (axe-core via Playwright) against a real,
// deployed environment - closes NFR-195/UX-015 ("no formal WCAG audit has
// been performed") with a real baseline, not a fabricated pass/fail claim.
// Usage: node scripts/a11yAudit.mjs [baseUrl]
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";

async function loginAndGetCookie(baseUrl) {
  const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: NURSE_USERNAME, password: NURSE_PASSWORD, simulateRole: "remote_triage_nurse" })
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status}`);
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

async function main() {
  const browser = await chromium.launch();
  const results = [];

  try {
    const publicContext = await browser.newContext();
    const publicPage = await publicContext.newPage();
    await auditPage(publicPage, `${BASE_URL}/`, "Login page (unauthenticated)", results);
    await publicContext.close();

    const cookie = await loginAndGetCookie(BASE_URL);
    const authedContext = await browser.newContext();
    const domain = new URL(BASE_URL).hostname;
    await authedContext.addCookies([
      { name: cookie.name, value: cookie.value, domain, path: "/", httpOnly: true, secure: true, sameSite: "Strict" }
    ]);
    const authedPage = await authedContext.newPage();
    await auditPage(authedPage, `${BASE_URL}/#/cockpit`, "Nurse Cockpit (authenticated)", results);
    await authedContext.close();
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
