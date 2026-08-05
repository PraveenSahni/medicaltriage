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
