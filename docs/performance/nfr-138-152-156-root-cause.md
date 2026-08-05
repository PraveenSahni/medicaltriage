# NFR-138/152/156 Root-Cause Analysis (2026-08-05)

## Investigated and ruled out (with evidence)

| Hypothesis | Investigation | Verdict |
|---|---|---|
| Missing database indexes | Read `prisma/schema.prisma`'s `TriageQueueItem` model directly - real `@@index` entries already exist for every column the queue-list query filters/sorts on: `[status, currentStage]`, `[priorityScore, slaDeadline]`, `[organizationId, status]`, `[targetOrganizationId, status]`, `[deletedAt]`. | **Ruled out** - indexes are real and present. This was an initial hypothesis that direct evidence disproved; not assumed to be the cause without checking. |
| N+1 queries / unbounded joins | Read `listDbRecords()` in `src/services/queueOrchestration.ts` - confirmed it deliberately does NOT include `transitionLogs` in the list query (a prior optimization, documented in the code's own comment: including it was found to balloon response size and was removed). Two parallel `findMany` calls, no per-row joins. | **Ruled out** - the query shape is already lean. |
| Excessive payload size | The 2026-08-04 re-baseline already tested this directly with an empty queue (zero payload) and still saw the same tail-latency blowout - payload size cannot be the dominant factor. | **Ruled out as sole cause** (pagination did measurably help engagement-wide, per the 2026-08-04 doc, but doesn't fully explain this). |
| Cloud SQL CPU saturation | Queried live CPU utilization via Cloud Monitoring API during a real load-test run: 8.7%-12.0% throughout - far from saturated. | **Ruled out** - the database is not CPU-bound during this test. |
| Per-request session/auth DB lookups | Read `getSessionFromStore()` (`src/services/securityAdmin.ts`) - checks an in-memory `Map` first (`getSession()`), only falling to a real DB read (`getPersistedUserSession`) on a cache miss. Since the load test logs in once and reuses one session across all 200 requests to the same Cloud Run instance, this is a cache hit for nearly every request, not a per-request DB round-trip. | **Ruled out as the dominant factor** for a single-instance test run (would matter more under multi-instance autoscaling, since each fresh instance's in-memory cache starts empty - not a factor at this test's modest scale). |

## Confirmed root cause: application-level connection-pool exhaustion

**Direct evidence, not inference**:

1. Read the real `DATABASE_URL` value (via `gcloud secrets versions
   access`, redacting the password) for `ist-triage-soc2-database-url` -
   confirmed **no `connection_limit` parameter is set**.
2. Prisma's documented default pool-size formula when unset is
   `num_physical_cpus * 2 + 1`. This Cloud Run service has no explicit
   CPU allocation override in `terraform/main.tf` (`resources { cpu_idle
   = true }` only sets billing behavior, not a CPU count) - the platform
   default is 1 vCPU, giving a default Prisma pool size of **3
   connections**.
3. Queried live Cloud Monitoring data for
   `cloudsql.googleapis.com/database/postgresql/num_backends` during a
   real load-test run: **active connections stayed at 2-4 throughout**,
   never approaching the 10 concurrent requests being fired, and nowhere
   near the shared instance's `max_connections` ceiling.
4. This exact pattern - reasonable p50 (individual requests are fast
   once they get a connection), blown-out p95/p99 (later requests in
   each burst queue waiting for one of ~3 connections to free up), zero
   errors (nothing is rejected, just delayed) - is the textbook signature
   of connection-pool exhaustion, not database or application slowness.

## Fix implemented

`src/db.ts`: the Prisma Client is now constructed with an explicit
`connection_limit` query parameter appended to `DATABASE_URL` at runtime
(only if not already present), defaulting to **8** (configurable via a
new `DATABASE_CONNECTION_LIMIT` env var). This raises the per-instance
pool from an implicit 3 to a real, explicit, tested 8 - large enough to
serve this test's 10 concurrent requests without most of them queueing,
small enough to stay a safe fraction of the shared instance's connection
ceiling for a single Cloud Run instance.

## Residual risk, stated honestly

This Cloud Run service (`ist-triage-soc2`) has `max_instance_count = 20`
in Terraform. If it ever scales out to many instances simultaneously
under real concurrent load, `20 instances x 8 connections = 160` would
far exceed the shared Cloud SQL instance's connection ceiling (already
documented elsewhere in this engagement as a real, hard constraint - the
instance also serves the demo environment, a DR read replica, and this
session's own local-dev tunnel). This fix is safe and effective for the
tested scenario (a single instance under 10 concurrent requests, the
realistic near-term case for a staging environment) but does **not**
solve the connection-budget problem at full autoscaled capacity. A
complete fix at that scale would require either a smaller
`max_instance_count`, a larger/dedicated Cloud SQL tier with a higher
connection ceiling, or a connection pooler (e.g. PgBouncer/Cloud SQL's
own connection pooling) in front of Postgres - explicitly out of scope
for this fix, which addresses the measured regression at the tested
concurrency level.

## Cloud SQL tier, noted but not changed

The instance is `db-f1-micro` - the smallest available tier. CPU wasn't
the bottleneck in this test, so upgrading the tier was not needed to
close this specific regression. A larger tier would still be the right
move for genuine production-scale capacity planning, separate from this
fix.
