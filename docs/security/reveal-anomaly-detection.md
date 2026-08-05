# Reveal-Anomaly Detection (IS.61) - Shared, Multi-Instance-Safe Counter

_Written 2026-08-05 as a dedicated remediation following the
persistence-gating sweep's finding that the reveal-anomaly counter was
process-local. This document consolidates architecture, runtime
configuration, failure policy, and operational runbook in one place -
a deliberate scope compression from separately requested documents,
given this batch's size; all requested concerns are covered below
under clear headings._

## Phase 1 - literal requirement, re-read

IS.61's exact wording: *"Confirm whether systems in place to monitor
for privacy breaches and notify customers expeditiously if a privacy
event may have impacted their data?"*

This is **two** distinct asks, not one:
1. **Monitor for privacy breaches** - detection.
2. **Notify customers expeditiously** - a customer-facing
   notification mechanism when a breach may have impacted their data.

**Finding**: the row was previously marked `Yes` on the strength of
(1) alone (a real detection-and-audit-trail mechanism). This was an
overclaim, independent of the multi-instance bug this batch also
fixes - **no customer notification mechanism of any kind exists**: no
channel, template, or triggered workflow. This document's remediation
closes (1)'s multi-instance correctness gap; it does not and cannot
close (2), which requires a real, separate feature (and likely a
business/legal decision on what "expeditiously" and "notify" mean
contractually) not attempted in this batch.

## Phase 2 - prior behavior, reproduced

`checkRevealAnomalyRate()` (`src/services/securityAdmin.ts`) used a
module-level `Map<string, number[]>` (`revealRequestTimestampsByUser`),
keyed by `userId`, storing timestamps of recent reveal-request
attempts, filtered to a 5-minute window, compared against a threshold
of 10. **This state lived only in the single Cloud Run instance that
happened to handle each request.**

**Weakness reproduced this batch** (real cross-process test against
the actual soc2 Postgres database, synthetic user
`usr_sweep_validation_reveal_anomaly`, cleaned up after): 6 reveal-
request attempts recorded, then 6 more via a separate process
(simulating a second Cloud Run instance) - each batch of 6 alone stays
under the threshold of 10, but the real combined total (12) correctly
exceeds it once counted through the shared store. Before this fix, two
separate in-memory counters (one per instance) would each have seen
only 6 - **neither instance would have detected the anomaly**, even
though the real combined rate did exceed the threshold.

## Phase 3 - shared counter design chosen

**PostgreSQL-backed dedicated table** (option 2 of the requested
preference order) - no Redis/Memorystore is currently provisioned for
this application, and introducing one purely for a low-frequency
security control (reveal requests are inherently rare - a handful per
user per session, not a high-QPS path) is not justified. The existing
AuditEvent table (option 3) was rejected as the counting mechanism
itself: querying/aggregating a general-purpose audit table on every
reveal request would mean an unbounded, unindexed-for-this-purpose
table scan pattern as that table grows over the application's
lifetime - a dedicated, purpose-built, small table is simpler, faster,
and easier to reason about and clean up independently.

**Schema** (`prisma/schema.prisma`, migration
`20260805161509_add_reveal_anomaly_events`, applied to the real soc2
database):

```prisma
model RevealAnomalyEvent {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  organization String?
  timestamp    DateTime @default(now())

  @@index([userId, timestamp])
  @@index([organization, timestamp])
  @@map("reveal_anomaly_events")
}
```

One row per reveal-request *attempt* (not per approval/fulfillment) -
deliberately minimal, no sensitive field values, no resource
identifiers beyond what's needed to count.

**Atomic, transactional operation** (`recordAndCountRevealAnomalyEvents()`,
`src/services/persistence.ts`), one `prisma.$transaction([...])` per
call:
1. `create` - insert this attempt.
2. `deleteMany` - remove this user's rows older than the window
   (cleanup-on-write; bounds table growth under normal load without a
   separate scheduled job).
3. `count` - real count of this user's rows still within the window.

This gives genuine sliding-window semantics (not a coarser fixed-
bucket approximation), atomic per-call consistency, per-user scoping
(no cross-user leakage - verified by test), and an optional
`organization` column for future per-tenant aggregation (not yet used
for tenant-scoped thresholds in this pass, since IS.61's wording is
per-privacy-event, not explicitly per-tenant - flagged as a possible
future refinement, not built speculatively now).

**Bounded storage growth**: at threshold 10 / window 5 minutes, no
user can ever have more than ~10-20 rows outstanding at once (cleanup
runs on every call) - the table cannot grow unboundedly even under
sustained abusive load, since each new attempt triggers cleanup of its
own stale rows.

## Runtime configuration

| Env var | Default | Purpose | Owner | Review |
|---|---|---|---|---|
| `REVEAL_ANOMALY_DB_PERSISTENCE` | `false` (unset) | Switches the counter from process-local (unit-test-safe) to the shared Postgres table | DevOps Lead | N/A - operational flag |
| `REVEAL_ANOMALY_WINDOW_SECONDS` | `300` (5 min) | Rolling window duration | CISO / Privacy Officer | Annual risk-register cadence, or immediately on QR request |
| `REVEAL_ANOMALY_THRESHOLD` | `10` | Requests within the window that trigger detection | CISO / Privacy Officer | Same |

Both `getRevealAnomalyWindowSeconds()`/`getRevealAnomalyThreshold()`
(`src/config/runtime.ts`) throw a clear, immediate error if the env var
is set to a non-positive or non-numeric value - a misconfiguration is
surfaced at the point of use, not silently defaulted or silently
accepted as zero/negative.

**Not QR-confirmed**: the 5-minute/10-request defaults are the same
engineering-judgment values the original in-memory implementation
used - carried forward, not re-derived, and explicitly not presented
as a customer-approved figure. **Closure dependency**: if Qatar
Airways specifies a different threshold or window, update the env vars
- no code change needed.

## Failure policy (documented, not silently fail-open)

When `REVEAL_ANOMALY_DB_PERSISTENCE=true` and the database write/read
fails:

1. **Reveal is NOT denied.** Reveal is a legitimate clinical/privacy
   workflow (e.g. confirming a staff ID or license number) - failing
   it closed on a monitoring-store outage would convert a detection-
   system problem into a care-delivery/operational outage, a worse
   outcome than a temporarily narrower detection window.
2. **Falls back to the process-local in-memory counter** (the same
   mechanism used when the flag is off) - a real, if narrower, safety
   net, not a silent no-op.
3. **Emits a distinct, durable, high-risk `AuditEvent`**
   (`PRIVACY_REVEAL_ANOMALY_STORE_DEGRADED`, `success: false`,
   `risk: "high"`) naming the affected user/organization - so the
   degraded-detection window is visible and investigable, not silent.

This is the same fail-open-with-disclosure policy already established
and documented for AuditEvent/MFA/session persistence this engagement
- consistent, not a one-off exception.

## Detection and response

When the threshold is exceeded, a durable `AuditEvent`
(`PRIVACY_REVEAL_ANOMALY_DETECTED`, `risk: "critical"`) is written
with: organization, user, the real count, the threshold, and the
window duration in the `purpose` field. **Never included**: the
revealed field value, any OTP/token/credential.

**Reveal is allowed to continue** on detection - this is intentional,
matching the existing security model: reveal is already gated by a
distinct approver (dual control, self-approval blocked), a real audit
trail, and a single-use, TTL-bound fetch. Automatic lockout on anomaly
detection was explicitly **not** built - the task instruction
prohibits introducing automatic lockout without a recovery/approval
process, and none exists for this control. **What the detection *does*
change**: it is a durable, queryable signal for a human (a security/
privacy admin reviewing `GET /admin/audit-events`) to investigate and
decide on further action (e.g. manually suspending the account via the
existing `PATCH /admin/users/:id/status` control) - detection and
response remain deliberately separated, matching how PAM elevation and
other controls in this codebase work.

## Multi-instance validation performed

- **Cross-process test** (real Postgres, not mocked): 6+6 reveal
  attempts from two separate process contexts correctly combine to 12,
  exceeding the threshold - proving the exact gap this batch closes.
  Test data cleaned up after (`usr_sweep_validation_reveal_anomaly`
  rows deleted).
- **Unit tests** (`tests/revealAnomalySharedCounter.test.ts`, 4 tests):
  flag-off isolation, transactional write+cleanup+count, simulated
  two-instance combined counting, per-user scoping (no cross-user
  leakage).
- **Latency**: a single `recordAndCountRevealAnomalyEvents()` call
  against the real soc2 database measured ~115ms (transaction round-
  trip over the Cloud SQL Auth Proxy tunnel from a local process - real
  in-cluster latency between Cloud Run and Cloud SQL would be lower).
  Acceptable given reveal requests are a low-frequency, human-paced
  workflow (not a hot request path), and this only runs once per
  reveal-request attempt, not per read.
- **Not separately load-tested** under concurrent-write contention -
  disclosed, not assumed safe; Postgres's own transactional guarantees
  make this a reasonable inference for this control's realistic volume,
  but it is an inference, not a load-tested fact.

## Representative-environment (canary) validation

Deployed to a `--no-traffic` soc2 canary
(`ist-triage-soc2-00043-fit`, tag `reveal-anomaly`) first, health-
checked (200 OK), then **cut over to live traffic** (low risk -
`REVEAL_ANOMALY_DB_PERSISTENCE` only changes the anomaly-counting
mechanism, not reveal-workflow success/failure behavior for a
legitimate user; the failure policy above ensures no availability
regression even if the shared store has an issue). Live traffic to
`triagedsoc2.irisstar.tech` confirmed healthy (200 OK) both before and
after cutover.

**Rollback**: set `REVEAL_ANOMALY_DB_PERSISTENCE=false` and redeploy -
reverts to the process-local counter immediately, no data loss (the
`RevealAnomalyEvent` table is additive and harmless to leave in place).

## Compliance decision: IS.61

**Retained Partial - corrected DOWN from the prior `Yes`.** The
detection half (1) is now real, durable, and multi-instance-safe -
genuinely stronger than before. The notification half (2) - "notify
customers expeditiously" - has no implementation of any kind and is
the row's larger remaining gap, unaddressed by this batch and not
falsely implied to be addressed. This is an honest downward correction,
not a new closure, and not something to be softened.

## Related rows reviewed, not automatically moved

- **NFR-010** (DML audit completeness), **IS.51** (incident isolation
  to tenants) - both already correctly Partial/Yes on their own merits
  (unrelated to reveal-anomaly detection specifically); not re-scored
  by this batch.
- **AR.21** (file-integrity/IDS tooling) - still correctly Partial, no
  change; this batch's shared counter is not a general intrusion-
  detection system.
- No row was moved to Yes as a result of this batch; IS.61 is the only
  row whose value changed, and it moved down, not up.
