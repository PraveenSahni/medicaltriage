# Load/Capacity Test Baseline (2026-08-04)

_Closes the "not measured" status on NFR-138/139/152/156 and AI-038. This is
a real, run-once baseline against `ist-triage-soc2` at modest concurrency
(10 concurrent workers, 20 requests each = 200 requests per scenario) - not
a full capacity-planning exercise, and deliberately conservative since the
target is a live service, not a dedicated load rig. Tool: `scripts/loadTest.mjs`
(native `fetch`, no external load-testing service required)._

## Results (original baseline, 2026-08-04, before pagination existed)

| Scenario | Requests | Throughput | p50 | p95 | p99 | Max | Errors |
|---|---|---|---|---|---|---|---|
| Public health check (`/api/v1/runtime/environment`) | 200 | 26.5 req/s | 343ms | 633ms | 771ms | 1040ms | 0 |
| Queue list (`/api/v1/queue`, authenticated, real DB read) | 200 | 6.8 req/s | 1056ms | **2950ms** | **4335ms** | 5394ms | 0 |
| Protocol list (`/api/v1/protocols?limit=1000`, authenticated) | 200 | 7.2 req/s | 1016ms | 3149ms | 4505ms | 5520ms | 0 |

## Re-baseline after adding pagination (2026-08-04, same day, later)

Once opt-in `limit`/`offset` pagination was added to both endpoints, this
baseline was re-run with a direct unpaginated-vs-paginated comparison on
the queue endpoint:

| Scenario | Requests | Throughput | p50 | p95 | p99 | Max | Errors |
|---|---|---|---|---|---|---|---|
| Public health check | 200 | 25.1 req/s | 350ms | 651ms | 979ms | 1009ms | 0 |
| Queue list, unpaginated (`/api/v1/queue`) | 200 | 6.2 req/s | 944ms | 4481ms | 6178ms | 7424ms | 0 |
| Queue list, paginated (`/api/v1/queue?limit=50`) | 200 | 6.5 req/s | 1089ms | **3487ms** | 4518ms | 5957ms | 0 |
| Protocol list (`/api/v1/protocols?limit=1000`) | 200 | 6.3 req/s | 904ms | 3280ms | 6326ms | 12876ms | 0 |

## Finding: pagination helps, but is not the whole story

**Zero request errors** in either run - the service doesn't fall over under
this load. Pagination genuinely reduced tail latency on the queue endpoint
(p95 4481ms -> 3487ms, roughly 22% faster) - a real, measured improvement,
not a claim. **But it did not bring p95/p99 under the 3-second NFR-138
target**, and the queue was empty (0 real items) during this re-baseline -
meaning payload size cannot be the dominant factor here, since there was
effectively no payload either way.

This points to a different or additional root cause than originally
hypothesized: likely **connection/request contention under concurrent
load** (Cloud SQL connection pool saturation, or per-request auth/session
lookup overhead) rather than purely large response payloads. The original
hypothesis (large unpaginated payloads) was a real, valid partial cause -
this re-baseline shows it wasn't the *only* cause, and pagination alone is
not sufficient to close this gap.

**This is not a synthetic/staging-only artifact.** `ist-triage-soc2` and
`ist-triage-demo` share the same underlying architecture; this same
behavior should be expected on the live demo under equivalent concurrent
load, though it was not tested there (per the standing rule against
load-testing the live customer-facing environment).

## Recommendation (updated after re-baseline)

1. ~~Implement pagination on `/api/v1/queue` and `/api/v1/protocols`~~ -
   **done 2026-08-04**, confirmed to help but not fully close the gap.
2. Investigate the connection/contention hypothesis directly: measure
   Cloud SQL active-connection count during a concurrent-load run (the
   saturation alert added this engagement already tracks this metric -
   check its value during a future load test), and profile whether
   per-request session/auth lookups add meaningful overhead.
3. A proper capacity-planning exercise (QR's actual projected peak
   concurrent-user count, sustained load over minutes not seconds) remains
   a separate, larger piece of work - this baseline establishes that a
   problem exists and that one fix (pagination) was only a partial
   improvement, not the full picture of the system's ceiling.

## Explicitly out of scope for this baseline

- Sustained/soak testing (this was a single ~200-request burst per
  scenario, not minutes of sustained load).
- Testing against `triaged.irisstar.tech` (the live demo) - out of scope
  per the standing rule for this engagement.
- Any fix to the pagination gap identified above - this document is the
  measurement, not the remediation.
