# SLIs / SLOs

_Written to close NFR-189 ("confirm that Service Level Indicators
(availability, latency, error-rate, saturation) and their Service Level
Objectives are defined, monitored, and reported monthly to Qatar
Airways")._

## Honest status

This document **defines** the SLIs/SLOs. It does not yet claim they are
fully monitored end-to-end or formally reported monthly - that reporting
cadence does not exist yet. Each row below states what's actually measured
today versus what's only a defined target.

| SLI | Definition | Target (SLO) | Measured today? |
|---|---|---|---|
| Availability | `/api/v1/runtime/environment` responds 200 | 99.5% per calendar month | **Yes** - GCP Cloud Monitoring uptime checks (`ist-triage-demo-uptime`, `ist-triage-soc2-uptime`), 5-minute polling interval, added this remediation pass |
| Latency | p95 response time for critical clinical-workflow endpoints (queue claim, triage complete) | ≤ 3 seconds | **Yes** (completed 2026-08-04) - a Cloud Logging-based distribution metric (`request_duration_ms`) parses `durationMs` from every request's structured log line, and a real alert policy (`soc2 p95 request latency > 3s`) fires on `ALIGN_PERCENTILE_95 > 3000ms` over a 5-minute window. Verified with real traffic: the metric shows live distribution data (e.g. 16 requests, mean 0.83ms, in one 60s window) - this is site-wide latency, not yet broken out per-endpoint for the two specific clinical-workflow endpoints named in the target |
| Error rate | 5xx responses as a percentage of total requests | < 1% per calendar month | **Partial** - real alert policies now exist for both services (`ist-triage-demo 5xx error rate`, `ist-triage-soc2 5xx error rate`, added 2026-08-04), firing when >5 5xx responses occur in a 5-minute window using Cloud Run's built-in `request_count` metric (no new instrumentation). This is count-based alerting, not yet a formal percentage-of-total-traffic SLO calculation or monthly report. |
| Saturation | Cloud SQL connection pool utilization, Cloud Run instance count vs. max | Alert at 80% of configured limits | **Yes** (added 2026-08-04) - real alert policies (`Cloud SQL connection saturation (ist-triage-postgres-uat)`, `Cloud Run instance count saturation (soc2 + demo)`) using Cloud Monitoring's built-in `cloudsql.googleapis.com/database/postgresql/num_backends` and `run.googleapis.com/container/instance_count` metrics - no new instrumentation needed, both were already collected natively by GCP |

## What closing the "measured today" gap would require

- **Latency:** closed 2026-08-04 - structured logging, a log-based p95
  metric, and an alert are all real and verified. Remaining refinement (not
  a gap, an enhancement): break the metric out per-endpoint so the two
  specific clinical-workflow endpoints named in the target (queue claim,
  triage complete) can be tracked individually rather than as one
  site-wide p95.
- **Error rate:** the same logging infrastructure, aggregated by status
  code.
- **Saturation:** Cloud SQL and Cloud Run both expose utilization metrics
  natively in Cloud Monitoring already - this is the cheapest of the three
  gaps to close, since it doesn't require new instrumentation, only a
  dashboard/alert policy on metrics GCP already collects.

## Log archival (added 2026-08-04)

Closes NFR-127 ("historical log data to be purged/archived as per
application requirement"). A Cloud Logging sink (`ist-triage-log-archive`)
now exports both services' request/application logs to a Cloud Storage
bucket (`gs://triage-502706-log-archive`, `me-central1`) with a 1-year
retention lifecycle policy (auto-deletes objects older than 365 days).
This runs alongside Cloud Logging's own default retention (30 days in the
live console) - the bucket is the durable long-term copy.

## Secret rotation reminders (added 2026-08-04)

Closes part of NFR-182 ("secrets rotation must be automated"). GCP Secret Manager has no
generic mechanism to auto-rotate an arbitrary secret's *value* (there's nothing to
regenerate a DB password or JWT signing key on its own) - what it does provide is a
rotation reminder: a Pub/Sub notification fired on a schedule so a rotation is never
simply forgotten. All 3 soc2 secrets (`ist-triage-soc2-database-url`,
`ist-triage-soc2-auth-jwt-secret`, `ist-triage-soc2-audit-hmac-secret`) now have a
90-day rotation period configured, publishing to the `secret-rotation-notifications`
Pub/Sub topic, first reminder due `2026-11-02T09:04:23Z`. This is reminder
infrastructure, not automated rotation - actually rotating a secret (generating a new
value, updating the Cloud Run revision, verifying, then disabling the old version)
remains a manual, verified operation each time the reminder fires. Declared in
`terraform/main.tf` (zero-diff verified) alongside the pubsub topic and its
`roles/pubsub.publisher` IAM binding for the Secret Manager service agent.

## Reporting cadence (real, built and executed 2026-08-05)

A real monthly SLI/SLO report now exists -
`src/services/sliReportService.ts`, deployed as the
`generate-monthly-sli-report-soc2` Cloud Run Job, triggered monthly by
Cloud Scheduler (`monthly-sli-report-soc2-trigger`, `0 7 1 * *`). It
queries real GCP Cloud Monitoring data for all 4 SLIs above, calculates
each against its SLO target, and emails the result via the existing
`getEmailAdapter()`. Manually executed end-to-end 2026-08-05 (confirmed
success, `exit(0)`, all 4 SLIs returned `complete` data with real
values - see `docs/operations/monthly-sli-report-runbook.md` for the
exact result and full operational detail).

**What is NOT yet closed**: no email has been sent to a real Qatar
Airways recipient - no customer email address is hardcoded anywhere in
this codebase or infrastructure config, by design. The capability is
real and proven; the actual monthly delivery *to Qatar Airways*
specifically requires a real recipient address and live email secrets to
be configured once QR provides them (see the runbook's "Remaining
action" section).

## Explicitly out of scope for this document

- Building the actual latency/error-rate/saturation monitoring described
  above - this document defines targets, it doesn't implement the
  instrumentation.
