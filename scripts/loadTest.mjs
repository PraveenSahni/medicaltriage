// Minimal load/capacity test against a real deployed environment - closes
// NFR-138/139/152/156/AI-038 ("not measured" -> a real number). Deliberately
// conservative (modest concurrency, short duration) since this targets a
// live service, not a dedicated load-testing rig - a real baseline is more
// valuable than an untested guess, but this is not a full capacity-planning
// exercise.
// Usage: node scripts/loadTest.mjs [baseUrl] [concurrency] [requestsPerWorker]
const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";
const CONCURRENCY = Number(process.argv[3] ?? 10);
const REQUESTS_PER_WORKER = Number(process.argv[4] ?? 20);
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function login() {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: NURSE_USERNAME, password: NURSE_PASSWORD, simulateRole: "remote_triage_nurse" })
  });
  const durationMs = performance.now() - start;
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const setCookie = res.headers.get("set-cookie");
  const cookie = setCookie ? setCookie.split(";")[0] : undefined;
  return { cookie, durationMs };
}

async function timedRequest(path, cookie) {
  const start = performance.now();
  let status;
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers: cookie ? { Cookie: cookie } : {} });
    status = res.status;
    await res.text();
  } catch (error) {
    status = 0;
  }
  return { durationMs: performance.now() - start, status };
}

async function worker(cookie, requestCount, path) {
  const results = [];
  for (let i = 0; i < requestCount; i++) {
    results.push(await timedRequest(path, cookie));
  }
  return results;
}

async function runScenario(label, path, cookie) {
  const start = Date.now();
  const workers = Array.from({ length: CONCURRENCY }, () => worker(cookie, REQUESTS_PER_WORKER, path));
  const allResults = (await Promise.all(workers)).flat();
  const wallClockMs = Date.now() - start;

  const durations = allResults.map((r) => r.durationMs).sort((a, b) => a - b);
  const errors = allResults.filter((r) => r.status === 0 || r.status >= 500);
  const total = allResults.length;

  return {
    label,
    path,
    totalRequests: total,
    concurrency: CONCURRENCY,
    wallClockMs: Math.round(wallClockMs),
    throughputRps: Number((total / (wallClockMs / 1000)).toFixed(1)),
    p50Ms: Math.round(percentile(durations, 50)),
    p95Ms: Math.round(percentile(durations, 95)),
    p99Ms: Math.round(percentile(durations, 99)),
    maxMs: Math.round(durations[durations.length - 1] ?? 0),
    errorCount: errors.length,
    errorRatePct: Number(((errors.length / total) * 100).toFixed(2))
  };
}

async function main() {
  console.log(`Load test against ${BASE_URL} (concurrency=${CONCURRENCY}, requests/worker=${REQUESTS_PER_WORKER})`);

  const publicScenario = await runScenario("Public health check (unauthenticated)", "/api/v1/runtime/environment", undefined);

  const { cookie, durationMs: loginLatencyMs } = await login();
  console.log(`Login latency (single request): ${Math.round(loginLatencyMs)}ms`);

  const queueScenario = await runScenario("Queue list (authenticated, real DB read, unpaginated)", "/api/v1/queue", cookie);
  const queuePaginatedScenario = await runScenario(
    "Queue list (authenticated, real DB read, paginated limit=50)",
    "/api/v1/queue?limit=50",
    cookie
  );
  const protocolsScenario = await runScenario(
    "Protocol list (authenticated, real DB read)",
    "/api/v1/protocols?limit=1000",
    cookie
  );

  const summary = { baseUrl: BASE_URL, scenarios: [publicScenario, queueScenario, queuePaginatedScenario, protocolsScenario] };
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error("Load test failed:", error);
  process.exitCode = 1;
});
