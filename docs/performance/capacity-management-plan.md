# Capacity Management Plan

_Written 2026-08-05 alongside the NFR-138/152/156 performance-remediation
pass. This is a real capacity-status document reflecting what was
actually measured, not a full capacity-planning exercise (that remains
separate, larger work requiring Qatar Airways' actual projected peak
concurrent-user count - not yet provided)._

## Current known capacity

- **Cloud SQL instance**: `ist-triage-postgres-uat`, tier `db-f1-micro`
  (smallest available, shared-core), `max_connections` capped low (a
  real, hard, shared constraint - the instance also serves the demo
  environment, a DR read replica, and local development).
- **Cloud Run (`ist-triage-soc2`)**: `max_instance_count = 20`
  (`terraform/main.tf`), no explicit CPU/memory override (platform
  default applies, effectively 1 vCPU per instance).
- **Prisma connection pool**: explicitly set to 8 per instance as of
  2026-08-05 (`src/db.ts`, `DATABASE_CONNECTION_LIMIT` env var,
  previously an implicit default of ~3).

## Measured capacity ceiling (updated 2026-08-05, later)

At 10 concurrent users (the only concurrency level actually tested):
- Public/no-DB endpoints: comfortably handled (p95 ~629ms-416ms across
  runs).
- Protocol-list endpoint: meets the 3s p95 target (fixed via the
  connection-pool setting).
- Queue-list endpoint: **now also meets the 3s p95 target** (446-569ms),
  after a real root-cause fix (4 missing database migrations applied to
  the live soc2 database - see `nfr-138-152-156-root-cause.md`'s
  "Follow-up investigation" section). The connection-pool setting was a
  real, separate, additional improvement; it was not, on its own,
  sufficient to explain the queue endpoint's original regression.

## Update 2026-08-05: dedicated NFR-156 capacity/soak batch

See `nfr-156-capacity-plan.md` for the full Phase 1-7 writeup. Summary
of what changed here:

- **Safe operating envelope, validated**: up to 25 concurrent users on
  the read-heavy queue-list/protocol-list workload (70/30 mix, ~3s
  request cadence), 100%/99.8% success, zero 5xx, single Cloud Run
  instance, Cloud Run CPU 1-8%, Cloud SQL CPU ~11%, DB connections
  steady at 9 (soc2 db) - all measured, not inferred.
- **Warning threshold (recommended)**: sustained Cloud Run CPU >50% or
  Cloud SQL CPU >60% for more than 5 minutes, or DB connection count
  approaching 20 (out of `db-f1-micro`'s low, shared `max_connections`
  ceiling) - none of these were observed in this batch's testing, so
  these are engineering-judgment thresholds, not yet validated against
  a real incident.
- **Critical threshold (recommended)**: Cloud SQL connection count at
  or above ~22-23 (approaching the instance's hard ceiling, shared with
  the demo environment and a DR replica) - a real risk given `soc2`
  alone already holds a steady 9 connections during light load; this
  is the most fragile shared resource in the current architecture.
- **Scaling actions**: Cloud Run `max_instance_count = 20` gives
  significant headroom for compute scale-out (untested in this batch -
  no tier drove a second instance); the real constraint is Cloud SQL's
  `db-f1-micro` tier's connection ceiling and shared-instance CPU, not
  Cloud Run.
- **Database-upgrade trigger (recommended)**: if a real QR peak-load
  figure implies sustained connection counts above ~15-18 across all
  environments sharing this instance, upgrade `ist-triage-postgres-uat`
  off `db-f1-micro` before that load is placed on it - this is a
  low-risk, straightforward change once a real target is known.
- **Connection-pool guidance**: current `DATABASE_CONNECTION_LIMIT=8`
  per Cloud Run instance (`src/db.ts`) is adequate at the validated
  25-user tier; re-evaluate if `max_instance_count` scale-out is ever
  exercised for real, since N instances × 8 connections could approach
  the DB's ceiling faster than CPU/memory would.
- **Min-instance guidance**: no min-instance is currently set (scales
  to 0, cold starts possible) - acceptable at today's validated load
  level; consider a `min-instances=1` setting if cold-start latency
  becomes operationally significant once real traffic begins.
- **Cost implications**: the validated envelope requires no additional
  spend - same single `db-f1-micro`/single-instance Cloud Run footprint
  already in place. A DB tier upgrade (if triggered per above) is the
  main cost lever, not Cloud Run scale-out.
- **Monitoring**: continue using the same Cloud Monitoring
  metrics/queries exercised in this batch (`run.googleapis.com/
  container/*`, `cloudsql.googleapis.com/database/*`) - no new
  dashboards were built this pass; a follow-up could wire these into
  the existing SLI reporting (`sliReportService.ts`) rather than
  ad hoc queries.

## What this plan does not cover

- Qatar Airways' actual projected peak concurrent-user count - not yet
  provided; this document cannot honestly define a capacity target
  without it.
- A 60+ minute soak, or any soak/tier test of the write path - see
  `nfr-156-capacity-plan.md`'s "What this does not close" for the full
  list.
- A demonstrated ceiling above 25 concurrent simulated users - the
  6-account test pool, not the platform, was the limiting factor
  encountered at higher tiers (NFR-047's rate limiter working as
  designed).
- Autoscaling behavior at more than 1 Cloud Run instance - not observed
  in any tier or the soak; the tested load never required scale-out.

## Recommended next steps

1. Obtain Qatar Airways' actual peak-load projection to define a real
   capacity target (same open item tracked for NFR-038/NFR-185's
   SLA-tier clarification).
2. Provision a larger real or safely-synthetic test-account pool (10+
   distinct accounts) to re-run the 50-concurrent-user tier without the
   rate-limiter confound, to find the actual application/infrastructure
   ceiling above 25 users.
3. Run a genuine 60+ minute soak, including the write path
   (queue-item creation/claim/status-transition), once a larger account
   pool exists.
4. Consider whether `db-f1-micro` remains adequate once a real QR
   target is known - a tier upgrade is a straightforward, low-risk
   change if capacity requirements exceed what this tier can serve, and
   is the most likely first real constraint given the shared-instance
   connection ceiling.

## Review cadence

Reviewed alongside the annual risk-register cadence
(`docs/risk-register-2026-08-04.md`, next review 2026-11-04), or
immediately once a QR peak-load projection is provided.
