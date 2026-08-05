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

## What this plan does not cover

- Qatar Airways' actual projected peak concurrent-user count - not yet
  provided; this document cannot honestly define a capacity target
  without it.
- Sustained/soak testing (minutes of load, not a single ~30s burst per
  scenario).
- A tested ceiling for the queue-list endpoint specifically, since its
  bottleneck is not yet root-caused.
- Autoscaling behavior at more than 1-2 concurrent Cloud Run instances -
  not observed during this test (10 concurrent load-test workers did not
  appear to trigger significant scale-out based on connection-count
  metrics staying flat).

## Recommended next steps

1. Root-cause the queue-list endpoint's specific bottleneck (see
   `nfr-138-152-156-validation.md`).
2. Obtain Qatar Airways' actual peak-load projection to define a real
   capacity target (this is the same open item tracked for NFR-038/
   NFR-185's SLA-tier clarification).
3. Consider whether `db-f1-micro` remains adequate once a real target
   is known - a tier upgrade is a straightforward, low-risk change if
   capacity requirements exceed what this tier can serve.

## Review cadence

Reviewed alongside the annual risk-register cadence
(`docs/risk-register-2026-08-04.md`, next review 2026-11-04), or
immediately once the queue-list root cause is found.
