# NFR quick-wins batch - 2026-08-07

Real, bounded engineering closing 4 questionnaire rows that were Partial only
because the underlying capability existed at the infrastructure layer
(`gcloud`/Terraform) but was never exposed through the application itself, or
never actually observed end-to-end. This doc records the scope and honest
result of each before the code changes land.

## NFR-049 / NFR-050 / NFR-051 - admin-facing job scheduling control

**Before**: real job scheduling (Cloud Scheduler + Cloud Run Jobs, 5 real
scheduled jobs), real periodic/on-demand execution, and real pause/cancel all
existed - but only via `gcloud scheduler jobs ...` run by an engineer, never
through an in-app admin surface.

**Fix**: a new `GET /api/v1/admin/scheduled-jobs` (list real Cloud Scheduler
jobs + their last execution status), `POST /api/v1/admin/scheduled-jobs/:name/run`
(trigger now), `POST /api/v1/admin/scheduled-jobs/:name/pause` and `/resume`,
using the real `@google-cloud/scheduler` client (same official-client pattern
`sliReportService.ts` already established for `@google-cloud/monitoring`) -
not a new scheduling engine, a real admin-facing control surface over the
existing one.

**Scope boundary**: this only lists/controls the scheduler jobs that already
exist in this project (retention purge, access-entitlement review, DAST
probe, monthly SLI report, restore-drill reminder) - it does not let an admin
create an arbitrary new schedule from scratch (that remains a Terraform/IaC
change, deliberately, so every real scheduled job stays reviewable in source
control).

## NFR-124 - real business-flow synthetic transaction

**Before**: only a bare HTTP health-endpoint uptime check existed - not a
synthetic transaction exercising a real business flow.

**Fix**: `scripts/syntheticBusinessFlowCheck.ts`, a real script that logs in
as a real test account, reads the queue, and asserts both succeed - runnable
standalone or as a new Cloud Scheduler-triggered Cloud Run Job
(`synthetic-business-flow-check`), alerting via the same Cloud Monitoring
log-based-metric + alert-policy pattern already used for the DAST probe.

## NFR-118 - observed fire-then-resolve cycle for the 3 new alert policies

**Before**: the 3 new alert policies (auth-failure-rate, privacy-reveal
anomaly, queue-backlog-age) were deployed and individually smoke-tested, but
no policy had been observed going from healthy -> firing -> resolved in a
real incident lifecycle.

**Fix**: a real synthetic trigger against the live soc2 environment (repeated
failed logins) to cross the auth-failure-rate threshold, observed via the
Cloud Monitoring Incidents API until the policy actually opens an incident,
then stopping the trigger and confirming the incident auto-resolves once the
condition clears.

## NFR-144 - pagination extended to two more list endpoints

**Before**: real opt-in `limit`/`offset` pagination existed on
`GET /api/v1/queue` and `GET /api/v1/protocols` only.

**Fix**: the same pattern (backward-compatible, `totalCount` in the response)
extended to `GET /api/v1/admin/users` and `GET /api/v1/admin/audit-events`.
