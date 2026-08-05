// Isolated queue-list endpoint load test - performance follow-up for
// NFR-138/152/156. Same auth/tenant/concurrency profile as scripts/loadTest.mjs
// but scoped to only the queue endpoint, with richer percentiles and payload
// size, and run as multiple discrete iterations to separate cold-start noise
// from repeatable, warm-instance latency.
// Usage: node scripts/loadTestQueueIsolated.mjs [baseUrl] [concurrency] [requestsPerWorker] [iterations]
const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";
const CONCURRENCY = Number(process.argv[3] ?? 10);
const REQUESTS_PER_WORKER = Number(process.argv[4] ?? 20);
const ITERATIONS = Number(process.argv[5] ?? 3);
const NURSE_USERNAME = "layla@irisstar.tech";
const NURSE_PASSWORD = "Layla@2026";

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: NURSE_USERNAME, password: NURSE_PASSWORD, simulateRole: "remote_triage_nurse" })
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const body = await res.json();
  // Bearer token, not the session cookie - a real, separate discovery this
  // pass found that cross-instance cookie-session lookups are currently
  // broken on soc2 (a distinct, pre-existing bug, not caused by this
  // investigation - flagged separately, not fixed in this batch). The
  // Bearer/JWT path is self-contained (no server-side session-store lookup
  // needed) and is a real, legitimate auth path this app already supports.
  return body.accessToken;
}

async function timedRequest(path, token) {
  const start = performance.now();
  let status;
  let bytes = 0;
  let rowCount;
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    status = res.status;
    const text = await res.text();
    bytes = Buffer.byteLength(text, "utf8");
    try {
      const parsed = JSON.parse(text);
      rowCount = Array.isArray(parsed?.queue) ? parsed.queue.length : undefined;
    } catch {
      // non-JSON or unexpected shape - leave rowCount undefined
    }
  } catch {
    status = 0;
  }
  return { durationMs: performance.now() - start, status, bytes, rowCount };
}

async function worker(token, requestCount, path) {
  const results = [];
  for (let i = 0; i < requestCount; i++) {
    results.push(await timedRequest(path, token));
  }
  return results;
}

async function runIteration(label, path, token) {
  const start = Date.now();
  const workers = Array.from({ length: CONCURRENCY }, () => worker(token, REQUESTS_PER_WORKER, path));
  const allResults = (await Promise.all(workers)).flat();
  const wallClockMs = Date.now() - start;

  const durations = allResults.map((r) => r.durationMs).sort((a, b) => a - b);
  const errors = allResults.filter((r) => r.status === 0 || r.status >= 400);
  const total = allResults.length;
  const avgBytes = allResults.reduce((sum, r) => sum + (r.bytes ?? 0), 0) / total;
  const rowCounts = allResults.map((r) => r.rowCount).filter((n) => n !== undefined);

  return {
    label,
    totalRequests: total,
    concurrency: CONCURRENCY,
    wallClockMs: Math.round(wallClockMs),
    throughputRps: Number((total / (wallClockMs / 1000)).toFixed(1)),
    p50Ms: Math.round(percentile(durations, 50)),
    p75Ms: Math.round(percentile(durations, 75)),
    p90Ms: Math.round(percentile(durations, 90)),
    p95Ms: Math.round(percentile(durations, 95)),
    p99Ms: Math.round(percentile(durations, 99)),
    minMs: Math.round(durations[0] ?? 0),
    maxMs: Math.round(durations[durations.length - 1] ?? 0),
    errorCount: errors.length,
    errorRatePct: Number(((errors.length / total) * 100).toFixed(2)),
    avgResponseBytes: Math.round(avgBytes),
    rowCountSample: rowCounts.length ? rowCounts[0] : undefined
  };
}

async function main() {
  console.log(
    `Isolated queue-endpoint load test against ${BASE_URL} (concurrency=${CONCURRENCY}, requests/worker=${REQUESTS_PER_WORKER}, iterations=${ITERATIONS})`
  );
  const token = await login();
  const iterations = [];
  for (let i = 1; i <= ITERATIONS; i++) {
    const label = i === 1 ? "iteration-1 (cold, includes instance warmup)" : `iteration-${i} (warm)`;
    const result = await runIteration(label, "/api/v1/queue?limit=50", token);
    console.log(`\n--- ${label} ---`);
    console.log(JSON.stringify(result, null, 2));
    iterations.push(result);
  }
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify({ baseUrl: BASE_URL, iterations }, null, 2));
}

main().catch((error) => {
  console.error("Isolated queue load test failed:", error);
  process.exitCode = 1;
});
