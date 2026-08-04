// Lightweight DAST-style probe against a real deployed environment - closes
// part of NFR-002/AI-002 ("Dynamic Application Security Testing"). This is
// NOT equivalent to a full OWASP ZAP/Burp Suite scan (no Docker/Java
// runtime was available to run ZAP's baseline scanner in this environment)
// - it's a scripted set of common checks: security headers, common exposed
// paths, basic injection/XSS reflection probes. Findings are real; absence
// of findings here does NOT mean "no vulnerabilities exist," only "these
// specific checks did not find one."
// Usage: node scripts/dastProbe.mjs [baseUrl]
const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";

const findings = [];

function record(severity, area, description) {
  findings.push({ severity, area, description });
}

async function checkSecurityHeaders() {
  const res = await fetch(`${BASE_URL}/`);
  const headers = res.headers;
  const checks = [
    ["content-security-policy", "CSP header present"],
    ["x-content-type-options", "X-Content-Type-Options: nosniff present"],
    ["x-frame-options", "X-Frame-Options (clickjacking protection) present"],
    ["strict-transport-security", "HSTS header present"]
  ];
  for (const [header, label] of checks) {
    if (!headers.get(header)) {
      record("medium", "security-headers", `Missing: ${label}`);
    }
  }
}

async function checkExposedPaths() {
  const paths = ["/.env", "/.git/config", "/package.json", "/.git/HEAD", "/server-status", "/debug", "/.aws/credentials"];
  for (const path of paths) {
    const res = await fetch(`${BASE_URL}${path}`);
    if (res.status === 200) {
      const text = await res.text();
      // A SPA's catch-all route often returns 200 with the same index.html
      // for every unknown path - that's not an actual exposure, so only
      // flag it if the body looks like the real sensitive file content.
      const isHtmlShell = /<!doctype html>/i.test(text.trim());
      const looksReal =
        (path.includes(".env") && /=/.test(text) && !isHtmlShell) ||
        (path.includes("package.json") && text.trim().startsWith("{")) ||
        (path.includes(".git") && !isHtmlShell);
      if (looksReal) {
        record("critical", "exposed-path", `${path} returned 200 with what looks like real file content`);
      }
    }
  }
}

async function checkUnauthenticatedDataAccess() {
  const sensitivePaths = ["/api/v1/queue", "/api/v1/admin/users", "/api/v1/protocols"];
  for (const path of sensitivePaths) {
    const res = await fetch(`${BASE_URL}${path}`);
    if (res.status === 200) {
      record("critical", "auth-bypass", `${path} returned 200 without authentication`);
    } else if (res.status !== 401 && res.status !== 403) {
      record("low", "auth-bypass", `${path} returned unexpected status ${res.status} without authentication (expected 401/403)`);
    }
  }
}

async function checkLoginInjectionAndXssHandling() {
  const payloads = [
    { label: "SQL injection attempt", username: "' OR '1'='1", password: "x" },
    { label: "XSS attempt in username", username: "<script>alert(1)</script>", password: "x" }
  ];
  for (const payload of payloads) {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: payload.username, password: payload.password })
    });
    const text = await res.text();
    if (res.status === 200) {
      record("critical", "injection", `${payload.label} resulted in a 200 (successful) login response`);
    }
    if (text.includes("<script>alert(1)</script>")) {
      record("high", "xss-reflection", `${payload.label}: raw payload reflected unescaped in response body`);
    }
    if (/relation|syntax error|SQLSTATE|prisma\.\w+\.\w+\(\)/i.test(text)) {
      record("medium", "info-disclosure", `${payload.label}: response body contains a raw DB/ORM error string`);
    }
  }
}

async function main() {
  console.log(`DAST-style probe against ${BASE_URL} - ${new Date().toISOString()}`);
  await checkSecurityHeaders();
  await checkExposedPaths();
  await checkUnauthenticatedDataAccess();
  await checkLoginInjectionAndXssHandling();

  console.log(`\nFindings: ${findings.length}`);
  for (const f of findings) {
    console.log(`[${f.severity.toUpperCase()}] ${f.area}: ${f.description}`);
  }
  if (findings.length === 0) {
    console.log("No findings from this specific check set - not a guarantee of no vulnerabilities.");
  }
}

main().catch((error) => {
  console.error("DAST probe failed:", error);
  process.exitCode = 1;
});
