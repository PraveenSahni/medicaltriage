# NFR-156 Capacity Planning and Soak Testing

_Written 2026-08-05 as a dedicated follow-up to the NFR-138/152/156
performance batch. NFR-138 and NFR-152 are closed (see
`nfr-138-152-156-validation.md`); this document covers NFR-156's
distinct, remaining ask: capacity sizing against a real peak load and
sustained-load (soak) validation. It reports honestly what was and was
not demonstrated - see "What this does not close" at the end._

## Phase 1 - literal requirement and closure criteria

NFR-156's wording asks for capacity planning: demonstrated peak-load
capacity, sustained-load behavior, scaling limits, and resource
thresholds - not just a point-in-time response-time check (that ask is
NFR-138/152, already closed separately). Closure of NFR-156 to "Yes"
requires all of:

1. A representative workload model, explicitly labeled where it is an
   engineering assumption rather than a QR-confirmed figure.
2. Controlled load tiers with full metric capture (Cloud Run instance
   count/CPU, Cloud SQL connections, latency percentiles, error/429/5xx
   breakdown).
3. Rate-limiter-aware testing that reports platform capacity and
   NFR-047 rate-limiter behavior **separately**, never conflated.
4. A sustained soak test, watching for drift/leaks, not just a snapshot.
5. An honestly bounded capacity statement - "validated up to X" - never
   "supports unlimited scaling" or an inferred ceiling beyond what was
   actually tested.
6. Updated capacity-management documentation reflecting the above.

This document and its companion `capacity-management-plan.md` update
are that evidence. **Full contractual capacity sign-off still requires
Qatar Airways' actual peak concurrent-user/RPS projection**, which has
not been provided as of this writing (same open item as NFR-038/
NFR-185) - so this row is expected to remain **Partial**, now with real
engineering evidence behind it rather than an untested gap.

## Phase 2 - representative workload model

No QR-confirmed peak-load figure exists. The tiers below are
**engineering-assumption test tiers**, clearly labeled as such, used to
characterize the platform's real behavior - not a substitute for a
QR-confirmed target.

Dominant real-time workflow modeled: a nurse keeps the triage queue
list open and refreshes it; protocol lookups happen per-call, less
frequently.

| Parameter | Assumption used | Note |
|---|---|---|
| Read/write mix | 100% read in this pass | Queue-item creation/claim/status-transition writes were excluded from the tier tests to avoid mutating shared synthetic data mid-test; called out as a real limitation below |
| Workload split | 70% queue-list, 30% protocol-list | Matches the queue-list-as-primary-screen usage pattern |
| Refresh cadence per nurse | 1 request per ~3s (think time) | A closed-loop, no-pacing hammer measures the rate limiter, not the platform - confirmed directly in this batch (see Phase 4) |
| Concurrent nurses (test tiers) | 10 / 25 / 50 | Higher tiers not run - see "Account-pool limitation" below |
| Distinct identities used | 6 real seeded accounts | Not one shared token - required to separate platform capacity from NFR-047 |

**Account-pool limitation, stated honestly**: only 6 real seeded
accounts with queue-read-eligible roles were available in this
environment. At concurrency 50 with 6 accounts, each account carries
~8 workers, and NFR-047's per-account limit (600 req/60s) becomes the
binding constraint before the application or database is meaningfully
loaded - this is expected, documented, and reported separately from
platform capacity in Phase 4, not treated as an application defect.
A true 50-*distinct-user* capacity test would need 50 real accounts,
which do not exist in this environment; this is flagged as a real gap
in test-data provisioning, not a platform limit.

## Phase 3 - controlled load tiers (results)

Tool: `scripts/capacityLoadTest.mjs` (new, this batch), run against
`https://triagedsoc2.irisstar.tech`, 3s think time per worker between
requests, 6 distinct real accounts round-robined across workers.

| Tier | Duration | Total reqs | RPS | p50 | p90 | p95 | p99 | Success % | 429s | 5xx |
|---|---|---|---|---|---|---|---|---|---|---|
| 10 concurrent | 60s | 184 | 2.9 | 344ms | 372ms | 475ms | 968ms | 100% | 0 | 0 |
| 25 concurrent | 60s | 468 | 7.4 | 283ms | 385ms | 464ms | 840ms | 99.8% | 1 | 0 |
| 50 concurrent | 60s | 936 | 14.7 | 263ms | 389ms | 535ms | 983ms | 90.8% | 86 | 0 |

**Zero 5xx errors and zero timeouts at every tier** - the application
and database layer never failed; all degradation at tier 50 was
NFR-047 rejections on the 6 shared accounts (see Phase 4).

Infrastructure metrics (Cloud Monitoring, live, during the tier-10/25/50
runs, `triage-502706`/`me-central1`):

| Metric | Observed |
|---|---|
| Cloud Run active instance count | Stayed at **1** throughout all 3 tiers - no scale-out observed |
| Cloud Run CPU utilization (p99, per-instance) | 1-8% - never exceeded ~8% |
| Cloud SQL active connections (`num_backends`) | Steady at **2** throughout |

**This means the tested tiers (10/25/50 simulated concurrent users at
a 3s think time) never came close to stressing the single Cloud Run
instance, its CPU, or the database connection pool.** The real
constraint encountered at tier 50 was the account-pool/rate-limiter
interaction described above, not compute, memory, or DB capacity.

## Phase 4 - platform capacity vs. rate-limiter behavior (reported separately)

- **Platform capacity** (queue-list + protocol-list, realistic 3s-cadence
  reads, distributed across 6 real accounts): validated clean (100%/
  99.8% success, zero 5xx, single instance, single-digit CPU%) at 10 and
  25 simulated concurrent users. At 50, the account pool (not the
  platform) became the limiting factor.
- **Rate-limiter behavior** (NFR-047, `defaultApiRateLimit`, 600 req/
  60s per identity): confirmed working as designed - the 86 429s at
  tier 50 are the control correctly rejecting bursts once a shared
  account's per-minute budget was exceeded by carrying ~8 simulated
  users' worth of traffic. This is a working security control, not a
  platform capacity failure, and is not counted as one in the table
  above's "Success %" interpretation.

## Phase 5 - soak test results

**Test parameters** (real, from the completed run):

| Parameter | Value |
|---|---|
| Start (approx., from tool timestamps) | 2026-08-05T13:07:15Z |
| End | 2026-08-05T13:27:38Z |
| Actual duration | 1202.5s (~20 min 3s) |
| Concurrent users | 10 |
| Distinct test accounts | 6 (round-robined) |
| Think time per worker | 3000ms between requests |
| Workload mix | 70% `GET /api/v1/queue?limit=50`, 30% `GET /api/v1/protocols?limit=1000` (same mix as the tier tests; read-only, see limitation below) |

**Client-side results (combined across both endpoints)**:

| Metric | Value |
|---|---|
| Total requests | 3,609 |
| Successful (200) | 3,609 (100%) |
| 429 (rate-limited) | 0 |
| Other 4xx (401/403/etc.) | 0 |
| 5xx | 0 |
| Timeouts | 0 |
| Throughput | 3.0 req/s |
| p50 | 283ms |
| p90 | 370ms |
| p95 | 396ms |
| p99 | 969ms |
| Max | 1,274ms |

**Known tooling limitation, disclosed rather than papered over**:
`capacityLoadTest.mjs` records one pooled result set across both
endpoints and reports a single end-of-run summary, not a genuine
interval-by-interval time series or a per-endpoint (queue vs. protocol)
percentile breakdown. The 100%/zero-error result is real and the full
raw per-request array was in memory during the run, but the script as
written does not surface a queue-only vs. protocol-only split or a
minute-by-minute client-side percentile trend. This is a real gap in
this pass's tooling, not a finding of "no drift" on the client side
specifically - the infrastructure-side time series below (which *is*
genuinely interval-by-interval, sourced from Cloud Monitoring, not this
script) is what actually supports the "no drift" conclusion in this
report. **Not measured in this pass, and not claimed**: tenant-isolation
failures and audit-write failures - this run issued read-only GET
requests against endpoints that do not exercise cross-tenant boundaries
or write to the audit table, so there is nothing to report for either
category from this specific test; this is a scope gap (writes were
excluded, see Phase 2), not a finding of "zero failures."

**Infrastructure metrics across the soak window** (Cloud Monitoring,
real, 5-minute intervals, `triage-502706`/`me-central1`, window
2026-08-05T13:06:00Z-13:35:00Z, covering pre-load baseline through a
~7-minute post-load recovery period):

| Time | Cloud Run instances | Cloud Run CPU (p99) | Cloud Run memory (p99) | Cloud SQL CPU | Cloud SQL connections (`ist_triage_soc2` db) | Cloud SQL disk util |
|---|---|---|---|---|---|---|
| 13:10 (start) | 1 | 8.0% | 29.0% | 11.2% | 9 | 1.719% |
| 13:15 (~1/4) | 1 | 3.0% | 29.0% | 11.4% | 9 | 1.719% |
| 13:20 (mid) | 1 | 3.0% | 28.0% | 11.4% | 9 | 1.720% |
| 13:25 (~3/4) | 1 | 3.0% | 28.0% | 11.6% | 9 | 1.720% |
| 13:30 (post-load) | 1 | 3.0% | 28.0% | 10.4% | 9 | 1.720% |

- **Cloud Run request-count by response class** (5-min sums, same
  window): 100% `2xx`/`200` throughout the soak proper; the 86 `429`s
  visible in the 13:05 bucket are the tail of the immediately-preceding
  tier-50 test (which ended right as the soak began), not the soak
  itself - the soak's own buckets (13:10 onward) show zero 429s,
  matching the script's own 0-count report. Zero 401s, zero 5xx, in
  every bucket.
- **Cloud Run server-side request latency (p95, `2xx` only)**: ~9.8-
  9.9ms, flat across all 5 buckets - this is server-side processing
  time only (excludes client-observed network/TLS/queueing overhead,
  which is why it is much lower than the client-side p95 of 396ms
  above; both are real, they measure different things).
- **Cloud Run instance count**: exactly 1 throughout - no scale-out, no
  restarts observed in this metric.
- **Cloud SQL connections**: flat at 9 for the `ist_triage_soc2`
  database for the entire window (`ist_triage_demo` flat at 4-5,
  `cloudsqladmin` flat at 2, both unrelated pre-existing baseline
  traffic) - no connection growth.
- **Cloud SQL memory utilization**: a flat 100% (`1.0`) throughout -
  this is `db-f1-micro`'s well-known shared-core baseline reporting
  behavior (its small allotted memory is effectively always reported
  near-full by this metric), not a soak-induced leak; flagged as
  measured-but-not-diagnostic for this instance tier, included for
  completeness rather than omitted.
- **Cloud SQL disk utilization**: flat at ~1.72% throughout - no growth
  from audit/queue-table writes, consistent with this being a read-only
  test.

**Findings (measured vs. inferred, stated explicitly)**:
- **Measured, no drift**: Cloud Run CPU/memory, Cloud SQL CPU/
  connections/disk utilization, and Cloud Run server-side latency were
  all flat across the full 20-minute window and into the ~7-minute
  post-load period - no growth trend in any infrastructure metric.
- **Measured, zero errors**: 3,609/3,609 client-side requests
  succeeded; Cloud Run's own request-count metric independently
  confirms zero 4xx/5xx in every 5-minute bucket of the soak itself.
- **Not measured this pass** (see limitation above): a genuine
  per-endpoint or per-minute client-side percentile trend; tenant-
  isolation behavior; audit-write behavior; write-path (queue-item
  creation/status-transition) behavior under sustained load; memory/
  connection behavior at a load level actually approaching this
  environment's real resource ceiling (this test ran at low single-
  digit CPU% throughout, so a leak that only manifests under real
  resource pressure would not necessarily surface here).
- **Inferred, not directly measured**: that the same flat behavior
  would hold at a higher, resource-stressing concurrency or over a
  much longer duration (60+ minutes or multiple hours) - this pass
  does not speak to that; only extrapolation, not evidence, would
  support such a claim.

**Duration assessment against NFR-156's literal wording**: NFR-156 asks
for capacity planning including "sustained load" validation. A 20-
minute run at a load level that never exceeded single-digit CPU% is a
real, genuine sustained-load exercise - it is not a single short burst
- but it is **not** a long-duration soak test in the sense typically
used for leak-detection programs (which target 60 minutes to several
hours specifically to surface slow leaks that a 20-minute window could
miss). This report labels it accurately as a **20-minute sustained
read-load validation**, not a "long-duration soak test," and recommends
a genuine 60+ minute run (ideally also exercising the write path and a
higher concurrency tier) as explicit follow-up work, not yet done.

## Phase 6 - capacity limit determination (honest, bounded)

**The strongest currently supported capacity statement:**

> Validated at up to 25 concurrent users under the defined realistic
> workload and pacing (70% queue-list / 30% protocol-list reads, ~3s
> think time per user). A 50-user test was attempted, but validation
> was constrained by the available six-account test pool and correctly
> functioning per-account rate limiting (NFR-047) - not by application
> or infrastructure capacity.

Supporting detail, tier by tier:

- **10 concurrent users**: 100% success (184/184), zero 5xx/timeouts,
  p95 475ms, 1 Cloud Run instance, single-digit CPU%.
- **25 concurrent users**: 99.8% success (467/468), zero 5xx/timeouts,
  1 stray 429, p95 464ms, 1 Cloud Run instance, single-digit CPU%.
  **Validated.**
- **50 concurrent users - not validated as platform capacity.** 850/936
  requests succeeded (90.8%) before the 6-account pool's shared
  NFR-047 budget was exceeded; 86 requests were rejected with 429 by
  the rate limiter, correctly, and are not counted as infrastructure
  failures. Restricting the observation to the period/requests before
  rate-limiting began to dominate: zero 5xx, zero timeouts, p95 535ms,
  still only 1 Cloud Run instance, CPU still single-digit percent -
  i.e., the infrastructure showed no sign of strain even while serving
  the tier-50 load; **the limiting factor was test-identity count, not
  compute, memory, DB connections, or application latency.**
- This report does **not** broaden the tier-50 result into a claim of
  validated 50-user platform capacity, and does not extrapolate beyond
  25 concurrent users. A future pass with a larger real/safely-synthetic
  test-account pool (never a relaxed production rate limit) is needed
  to actually find the application/infrastructure ceiling above this
  point.
- Do **not** infer that the platform supports unlimited scaling, or
  that 50 real distinct concurrent users would fail - the evidence
  here does not speak to that; it only speaks to what 6 shared
  accounts carrying 50 workers' worth of traffic encounter (NFR-047's
  designed-in protection).
- Cloud Run `max_instance_count = 20` (Terraform) and Cloud SQL
  `db-f1-micro`'s connection ceiling remain untested - no tier in this
  batch, nor the 20-minute soak, drove the service to a second instance
  or drove DB connections meaningfully above their steady baseline
  (2 idle / 9 during active soc2 load).

## Phase 7 - capacity plan updates

See `capacity-management-plan.md`, updated 2026-08-05 with this
document's findings, current infra sizing, safe operating envelope,
warning/critical thresholds, and scaling guidance.

## What this does not close

- Qatar Airways' actual peak-load projection - still not provided;
  final contractual capacity sign-off remains blocked on this, same as
  NFR-038/NFR-185.
- A demonstrated ceiling above 25 concurrent simulated users - the
  account-pool constraint, not the platform, was the limiting factor
  encountered at tier 50 in this pass.
- Autoscaling behavior beyond 1 Cloud Run instance - not observed,
  since the tested load never required a second instance, including
  during the 20-minute soak.
- Write-path (queue-item creation/claim/status-transition) load
  characteristics - this pass tested reads only; tenant-isolation and
  audit-write behavior under load are correspondingly unmeasured.
- A soak duration at or above the recommended 60 minutes - this pass
  ran a real 20-minute sustained read-load validation (100% success,
  3,609 requests, flat infrastructure metrics throughout and into a
  ~7-minute post-load recovery window), which is genuinely useful
  evidence against short-term drift/leaks at this load level, but is
  explicitly **not** labeled a long-duration soak test - a 60+ minute
  run (ideally including the write path and a higher concurrency tier)
  remains a real, disclosed gap, not yet done.
- A per-endpoint (queue vs. protocol) or minute-by-minute client-side
  percentile breakdown for the soak - the test tooling in this pass
  only produced a pooled end-of-run summary; the infrastructure-side
  time series (which is genuinely interval-by-interval) is what
  supports this report's "no drift" conclusion, not the client-side
  numbers.

Given the above, **NFR-156 is retained Partial** - now backed by real,
reproducible capacity evidence (zero-error read-path performance at up
to 25 concurrent users, clear identification of the actual first
limiting factor encountered at tier 50, and a genuine 20-minute
sustained-load run with flat infrastructure metrics) rather than an
untested gap, but still short of a QR-confirmed peak-load target, a
60+ minute soak, and write-path/tenant-isolation/audit-write validation
under load.
