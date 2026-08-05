// Multi-account, multi-tier capacity test for NFR-156. Distributes load
// across several real, distinct test accounts (not one shared token) to
// measure genuine platform capacity separately from NFR-047's per-account
// rate limiter - the two are reported separately, never conflated.
// Usage: node scripts/capacityLoadTest.mjs [baseUrl] [concurrency] [durationSeconds]
const BASE_URL = process.argv[2] ?? "https://triagedsoc2.irisstar.tech";
const CONCURRENCY = Number(process.argv[3] ?? 10);
const DURATION_SECONDS = Number(process.argv[4] ?? 30);
// Think time between a worker's requests, simulating a real nurse's queue
// refresh cadence rather than a closed-loop hammer with no pacing - without
// this, a handful of accounts saturate NFR-047's per-account rate limit
// almost immediately, which measures the rate limiter, not the platform.
const THINK_TIME_MS = Number(process.argv[5] ?? 3000);

// Real seeded test accounts (src/services/securityAdmin.ts) - distinct
// identities so no single account's rate-limit bucket is the constraint
// being measured in this test.
const ACCOUNTS = [
  { username: "layla@irisstar.tech", password: "Layla@2026", role: "remote_triage_nurse" },
  { username: "fatima@irisstar.tech", password: "Fatima@2026", role: "senior_triage_nurse" },
  { username: "sara@irisstar.tech", password: "Sara@2026", role: "remote_triage_nurse" },
  { username: "physician@irisstar.tech", password: "Physician@2026", role: "teleconsult_physician" },
  { username: "oh@irisstar.tech", password: "OccupationalHealth@2026", role: "occupational_health_clinician" },
  { username: "intake@irisstar.tech", password: "Intake@2026", role: "call_intake_coordinator" }
];

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function login(account) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: account.username, password: account.password, simulateRole: account.role })
  });
  if (!res.ok) throw new Error(`Login failed for ${account.username}: ${res.status}`);
  const body = await res.json();
  return body.accessToken;
}

async function timedRequest(path, token) {
  const start = performance.now();
  let status;
  try {
    const res = await fetch(`${BASE_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
    status = res.status;
    await res.text();
  } catch {
    status = 0;
  }
  return { durationMs: performance.now() - start, status };
}

// Representative workload mix for the platform's dominant real-time
// pattern: nurses keep the queue list open and it's the highest-frequency
// read; protocol-list is looked up per-call, less frequently. No write
// endpoint is included in this specific tier test (queue-item creation/
// claim changes real state and would need per-worker synthetic data
// cleanup - out of scope for this capacity pass, called out explicitly
// as a limitation in the capacity-management-plan).
const WORKLOAD = [
  { path: "/api/v1/queue?limit=50", weight: 0.7 },
  { path: "/api/v1/protocols?limit=1000", weight: 0.3 }
];

function pickPath() {
  const r = Math.random();
  let cumulative = 0;
  for (const w of WORKLOAD) {
    cumulative += w.weight;
    if (r <= cumulative) return w.path;
  }
  return WORKLOAD[0].path;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function worker(token, endTime, results) {
  while (Date.now() < endTime) {
    const path = pickPath();
    results.push(await timedRequest(path, token));
    if (THINK_TIME_MS > 0) await sleep(THINK_TIME_MS);
  }
}

async function runTier(concurrency, durationSeconds) {
  console.log(`\n=== Tier: ${concurrency} concurrent users, ${durationSeconds}s, thinkTime=${THINK_TIME_MS}ms ===`);
  // Log in once per distinct account (not once per worker) - logging in the
  // same account repeatedly in a tight loop trips the login-specific
  // brute-force rate limiter, which is a different control than the one this
  // test is trying to measure. Workers beyond the account pool size reuse an
  // already-issued token, same as multiple browser tabs for one nurse would.
  const accountTokens = [];
  for (const account of ACCOUNTS) {
    accountTokens.push(await login(account));
  }
  const tokens = [];
  for (let i = 0; i < concurrency; i++) {
    tokens.push(accountTokens[i % accountTokens.length]);
  }
  const results = [];
  const start = Date.now();
  const endTime = start + durationSeconds * 1000;
  const workers = tokens.map((token) => worker(token, endTime, results));
  await Promise.all(workers);
  const wallClockMs = Date.now() - start;

  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const total = results.length;
  const rateLimit429 = results.filter((r) => r.status === 429).length;
  const serverErrors5xx = results.filter((r) => r.status >= 500).length;
  const authErrors401 = results.filter((r) => r.status === 401 || r.status === 403).length;
  const timeouts = results.filter((r) => r.status === 0).length;
  const success = results.filter((r) => r.status === 200).length;

  const summary = {
    concurrency,
    durationSeconds,
    wallClockMs: Math.round(wallClockMs),
    totalRequests: total,
    throughputRps: Number((total / (wallClockMs / 1000)).toFixed(1)),
    p50Ms: Math.round(percentile(durations, 50)),
    p90Ms: Math.round(percentile(durations, 90)),
    p95Ms: Math.round(percentile(durations, 95)),
    p99Ms: Math.round(percentile(durations, 99)),
    maxMs: Math.round(durations[durations.length - 1] ?? 0),
    successCount: success,
    successRatePct: Number(((success / total) * 100).toFixed(2)),
    rateLimit429Count: rateLimit429,
    serverError5xxCount: serverErrors5xx,
    authError401Count: authErrors401,
    timeoutCount: timeouts
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
}

async function main() {
  const summary = await runTier(CONCURRENCY, DURATION_SECONDS);
  console.log("\n=== FINAL ===");
  console.log(JSON.stringify(summary));
}

main().catch((error) => {
  console.error("Capacity load test failed:", error);
  process.exitCode = 1;
});
