# Load/Capacity Test Baseline (2026-08-04)

_Closes the "not measured" status on NFR-138/139/152/156 and AI-038. This is
a real, run-once baseline against `ist-triage-soc2` at modest concurrency
(10 concurrent workers, 20 requests each = 200 requests per scenario) - not
a full capacity-planning exercise, and deliberately conservative since the
target is a live service, not a dedicated load rig. Tool: `scripts/loadTest.mjs`
(native `fetch`, no external load-testing service required)._

## Results

| Scenario | Requests | Throughput | p50 | p95 | p99 | Max | Errors |
|---|---|---|---|---|---|---|---|
| Public health check (`/api/v1/runtime/environment`) | 200 | 26.5 req/s | 343ms | 633ms | 771ms | 1040ms | 0 |
| Queue list (`/api/v1/queue`, authenticated, real DB read) | 200 | 6.8 req/s | 1056ms | **2950ms** | **4335ms** | 5394ms | 0 |
| Protocol list (`/api/v1/protocols?limit=1000`, authenticated) | 200 | 7.2 req/s | 1016ms | 3149ms | 4505ms | 5520ms | 0 |

## Finding: a real performance gap, not a clean pass

**Zero request errors** at this concurrency - the service doesn't fall over.
But **NFR-138's ≤3-second target for critical transactions is not reliably
met** for the queue-list and protocol-list endpoints under even 10
concurrent users: p95/p99 exceed 3 seconds on both.

**Likely root cause:** the `/api/v1/queue` response payload is very large -
a single unauthenticated-adjacent request logged earlier this session showed
a ~5.7MB response body for this endpoint. This is consistent with a gap
already flagged in the questionnaire review (NFR-144: "take-based limits,
not true offset/cursor pagination") - the queue list appears to return a
large slice of records per call rather than a small paginated page, and
response time scales with payload size and concurrent DB read load.

**This is not a synthetic/staging-only artifact.** `ist-triage-soc2` and
`ist-triage-demo` share the same underlying architecture; this same
behavior should be expected on the live demo under equivalent concurrent
load, though it was not tested there (per the standing rule against
load-testing the live customer-facing environment).

## Recommendation (not implemented in this pass)

1. Implement real cursor/offset-based pagination on `/api/v1/queue` and
   `/api/v1/protocols`, replacing or supplementing the current fixed `take`
   limits - the single highest-leverage fix given the payload-size root
   cause identified above.
2. Re-run this same baseline after that fix to confirm p95/p99 drop under
   the 3-second target.
3. A proper capacity-planning exercise (QR's actual projected peak
   concurrent-user count, sustained load over minutes not seconds, Cloud
   SQL connection-pool saturation behavior) remains a separate, larger
   piece of work - this baseline establishes that a problem exists, not
   the full picture of the system's ceiling.

## Explicitly out of scope for this baseline

- Sustained/soak testing (this was a single ~200-request burst per
  scenario, not minutes of sustained load).
- Testing against `triaged.irisstar.tech` (the live demo) - out of scope
  per the standing rule for this engagement.
- Any fix to the pagination gap identified above - this document is the
  measurement, not the remediation.
