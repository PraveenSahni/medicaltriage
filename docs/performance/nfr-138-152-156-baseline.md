# NFR-138/152/156 Performance Baseline (2026-08-05)

_Re-confirms the regression first documented in
`docs/load-test-baseline-2026-08-04.md` before making any code change,
per the mandated "confirm baseline before modifying production code"
rule._

## Test configuration

- Tool: `scripts/loadTest.mjs` (native `fetch`, no external load service).
- Target: `https://triagedsoc2.irisstar.tech` (staging, not the live
  customer-facing demo - matches the standing rule against load-testing
  `triaged.irisstar.tech`).
- Concurrency: 10 workers.
- Requests per worker: 20 (200 total per scenario).
- Command: `node scripts/loadTest.mjs`

## Endpoints tested

- `/api/v1/runtime/environment` (public health check, no DB read).
- `/api/v1/queue?limit=50` (authenticated, real DB read via Prisma).
- `/api/v1/protocols?limit=1000` (authenticated, real DB read via
  Mdb*-backed content loader).

## Results (2026-08-05, before any fix)

| Scenario | Requests | Throughput | p50 | p95 | p99 | Max | Errors |
|---|---|---|---|---|---|---|---|
| Health check | 200 | 6.7 req/s* | 1100ms | 2895ms | 4612ms | 8225ms | 0 |
| Queue list (`?limit=50`) | 200 | 6.4 req/s | 1295ms | **3148ms** | 3844ms | 5804ms | 0 |
| Protocol list (`?limit=1000`) | 200 | 6.5 req/s | 814ms | **3982ms** | 6800ms | 6995ms | 0 |

_*Note: this run's health-check numbers are noticeably worse than the
2026-08-04 baseline's (343ms p50/633ms p95) - a real, measured
observation consistent with the connection-pool-contention root cause
below, since the health-check scenario ran immediately after (and
shares the same Cloud Run instance/connection pool as) the two DB-backed
scenarios in the same test run, unlike the original baseline which ran
health-check first before any DB load._

**Target**: p95 ≤ 3000ms (NFR-138). **Not met** on queue list (3148ms)
or protocol list (3982ms).

## Real-time infrastructure metrics during this test run

Queried directly via the Cloud Monitoring API
(`monitoring.googleapis.com/v3`) for the `ist-triage-postgres-uat`
Cloud SQL instance during the test window:

- **CPU utilization**: 8.7%-12.0% throughout - not saturated.
- **Active connections** (`cloudsql.googleapis.com/database/postgresql/num_backends`):
  stayed at 2-4 connections throughout the entire test, despite 10
  concurrent requests being fired continuously.

This is the key measured finding: **the database itself was not under
load**, but the number of connections it was actually serving never
came close to the request concurrency. See
`nfr-138-152-156-root-cause.md` for the analysis.

## Cloud SQL instance sizing (confirmed via `gcloud sql instances describe`)

- Tier: `db-f1-micro` (shared-core, smallest available tier).
- Availability: `ZONAL` (single zone, no HA failover for this instance).
- Confirmed via direct inspection, not assumed.
