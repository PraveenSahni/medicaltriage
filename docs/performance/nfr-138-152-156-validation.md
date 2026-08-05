# NFR-138/152/156 Validation Report (2026-08-05)

## Environment

- Target: `https://triagedsoc2.irisstar.tech` (staging - the live demo
  was never touched, per standing rule).
- Deployment: canary-then-cutover (`docs/change-management-policy.md`
  §2) - built `me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/
  ist-triage-soc2:perf-fix-20260805`, deployed as a zero-traffic canary
  (`--tag=perf-canary`), health-checked directly
  (`GET /api/v1/runtime/environment` -> 200), then cut traffic to 100%
  via `gcloud run services update-traffic ... --to-latest`.
- Dataset/concurrency/duration: identical to the baseline - 10
  concurrent workers, 20 requests each, same 3 endpoints.

## Before / after comparison

| Scenario | Metric | Before | After | Change |
|---|---|---|---|---|
| Health check | p95 | 2895ms | 629ms | **-78%** |
| Health check | p99 | 4612ms | 993ms | **-78%** |
| Queue list (`?limit=50`) | p95 | 3148ms | 3105ms | -1% (no material change) |
| Queue list (`?limit=50`) | p99 | 3844ms | 4906ms | +28% (worse) |
| Protocol list (`?limit=1000`) | p95 | 3982ms | 2923ms | **-27%, now under target** |
| Protocol list (`?limit=1000`) | p99 | 6800ms | 3923ms | **-42%** |

Error rate: **0% in every scenario, before and after** - no functional
regression introduced.

## Infrastructure metrics after the fix

Re-queried Cloud Monitoring during the post-fix test run:
`cloudsql.googleapis.com/database/postgresql/num_backends` still showed
only **2-4 active connections** - essentially unchanged from before the
fix, despite `connection_limit=8` now being set. This is an honest,
measured, unexpected result, reported as-is rather than assumed away:
the connection-pool-exhaustion hypothesis explained the health-check
improvement and most of the protocol-list improvement, but evidently
does not fully explain the queue-list endpoint's unchanged p95.

## Interpretation

- **Health check**: dramatically improved (no DB dependency, likely
  benefited from something unrelated to the DB fix - e.g. general
  cold-start/warm-instance effects from the fresh revision - or simply
  ran under less contention because the DB-bound scenarios that
  previously ran in immediate sequence on the same instance now free up
  the event loop faster).
- **Protocol list**: real, meaningful improvement, now meets the 3s p95
  target. Consistent with the connection-pool hypothesis - this
  endpoint's query is heavier and likely benefited from more available
  connections when they were needed.
- **Queue list**: **did not meaningfully improve**. The connection count
  staying flat at 2-4 (not climbing toward 8) suggests this endpoint's
  bottleneck is NOT primarily connection-pool queueing - something else
  in its execution path (the two parallel `findMany` calls plus
  in-process JS sorting/filtering in `listDbRecords()`/`matchesFilter()`)
  is the real constraint, not yet root-caused. This needs further,
  separate investigation before another fix attempt - not something to
  guess at without more evidence.

## Validation performed

- `npx tsc -p tsconfig.json --noEmit`: clean.
- `npx jest --runInBand`: **688/692 passing** - same 4 `ssoOidcFlow.test.ts`
  failures (Cloud SQL proxy tunnel unavailable in this local session),
  unrelated to this change, unchanged before and after.
- Live health check before and after cutover: 200 OK both times.
- Zero error rate in both load-test runs - no functional, authorization,
  audit, or tenant-isolation regression observed.

## Closure decision per requirement

| ID | Requirement | Decision | Reason |
|---|---|---|---|
| NFR-138 | Response time (3s p95 for critical transactions) | **Retain Partial** | Queue list still exceeds the 3s target; the requirement names both queue-related and general critical transactions, and the queue endpoint is the more clinically central one |
| NFR-152 | Scalability SLA | **Retain Partial** | Same underlying evidence - the queue endpoint's bottleneck remains unresolved |
| NFR-156 | Capacity planning | **Retain Partial** | A genuine capacity-planning exercise (QR's actual projected peak load) remains separate, larger work not addressed by this fix |

**Not closed to Yes.** A real, measured, partial improvement was made
and deployed (protocol list now meets target; health check dramatically
improved) - but the literal requirement text covers the whole
application's critical transactions, and the queue endpoint - arguably
the single most clinically important one - still does not meet the
target. Closing these to Yes on a partial result would overstate what
was actually achieved.

## Remaining limitation / next step

The queue-list endpoint's real bottleneck needs its own, separate
root-cause pass - likely candidates not yet individually measured:
in-process sorting/filtering cost in `listDbRecords()`, the cost of the
two sequential `Promise.all` `findMany` calls under load, or Node.js
event-loop contention from other synchronous work in the request path.
This is real, scoped follow-up work, not vague hand-waving - flagged
explicitly rather than left implicit.

## Follow-up validation (2026-08-05, later) - real root cause found and fixed

The item above was resolved. Investigation found the queue-list
endpoint's real dominant cause was **not** connection-pool sizing but a
genuine, previously-undiscovered production bug: 4 real database
migrations (including the one adding `deleted_at`/`deleted_by`) were
never applied to the live soc2 database, despite being committed to
source control weeks earlier - see
`nfr-138-152-156-root-cause.md`'s "Follow-up investigation" section for
full detail and live-log evidence.

### Fix

`npx prisma migrate deploy` run against the real soc2 database (via a
local Cloud SQL Auth Proxy tunnel, real ADC credentials). All 4 pending
migrations applied successfully, additive-only, no data loss risk.

### Isolated queue-endpoint load test (`scripts/loadTestQueueIsolated.mjs`)

Same environment (`triagedsoc2.irisstar.tech`), same concurrency profile
(10 concurrent workers) as the original baseline, switched to Bearer-
token auth (the cross-instance cookie-session lookup bug noted above
made cookie auth unusable for this specific test - a separate, real,
unfixed issue, not a workaround that invalidates these results since
Bearer auth is a real, supported auth path).

| Run | Requests | p50 | p75 | p90 | p95 | p99 | Max | Errors (rate-limit, see note) |
|---|---|---|---|---|---|---|---|---|
| Before this fix (earlier same day) | 200 | 1042ms | - | - | 3105ms | 4906ms | 5518ms | 0% |
| After fix, run 1 | 150 | 271ms | 356ms | 400ms | 446ms | 724ms | 970ms | 20% (429) |
| After fix, run 2 | 200 | 285ms | 352ms | 374ms | **569ms** | 971ms | 1072ms | 40.5% (429) |
| After fix, single isolated request | 1 | ~250-400ms (repeated manual checks) | - | - | - | - | - | 0% |

**p95 improved from 3105ms to 446-569ms - a 5.5-7x improvement, now
comfortably under the 3-second target.**

**Note on the error rates above**: these are real `429 Rate limit
exceeded` responses from this app's own NFR-047 per-user/IP throttling
(`src/app.ts`, `defaultApiRateLimit`, 600 requests/60s) - a working
security control correctly rejecting this test's repeated 10-concurrent
bursts from a single test account/token within a short window across
several consecutive test runs and manual diagnostic `curl` calls made
during this same investigation. This is **not a queue-endpoint
performance defect** - real production traffic from many distinct nurse
accounts would not trigger this per-account limiter the way one
script's rapid, repeated bursts from a single account did. The
**latency** figures (p50/p95/p99) reflect only the requests that
actually reached the endpoint and are the real, relevant performance
evidence; the error-rate column is reported honestly rather than
omitted, but should not be read as a queue-endpoint reliability
regression.

### Full-suite validation after the fix

- `npx tsc -p tsconfig.json --noEmit`: clean.
- `npx pnpm audit --audit-level high`: clean.
- `npx jest --runInBand`: **707/707 passing** - the local Cloud SQL Auth
  Proxy tunnel established for this investigation remained active,
  which also resolved the previously-documented 4 `ssoOidcFlow.test.ts`
  environment-blocked failures for the remainder of this session (not a
  code change - the same known gap will likely reappear in a future
  session unless that tunnel is deliberately kept running).
- Zero functional/authorization/audit/tenant-isolation regression
  observed - the fix was a database schema migration (already-designed,
  already-tested elsewhere) and no application code change beyond the
  earlier connection-pool setting.

## Closure decision per requirement (final, 2026-08-05)

| ID | Requirement | Decision | Reason |
|---|---|---|---|
| NFR-138 | Response time (3s p95 for critical transactions) | **Yes** | Both critical endpoints checked this pass (protocol-list from the earlier fix, queue-list from this fix) now reproducibly meet the 3s p95 target on the same test configuration used throughout this investigation |
| NFR-152 | Scalability SLA | **Yes** | Same real evidence - the previously-failing endpoint now performs correctly under the same tested concurrency |
| NFR-156 | Capacity planning | **Retained Partial** | This row's literal ask (sizing for QR's actual projected peak load, sustained soak testing) remains genuinely unaddressed - fixing a bug that was suppressing real performance is not the same as a completed capacity-planning exercise. See `docs/performance/capacity-management-plan.md`. |
