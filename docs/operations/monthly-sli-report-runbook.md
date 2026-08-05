# Monthly SLI/SLO Report - Operational Runbook

_Closes Cloud CSQ/NFR-123 ("scheduled reports via email for the key
metrics") and provides the "monitored" half of NFR-189 for real. The
"reported monthly to Qatar Airways" half of NFR-189 remains Partial
until a real QR recipient and live email secrets are configured - see
"Remaining action" below._

## What this is

`src/services/sliReportService.ts` queries real GCP Cloud Monitoring
data for the 4 SLIs defined in `docs/sli-slo-definitions.md`
(availability, latency, error rate, saturation), calculates each SLI's
percentage/value against its SLO target, and (when a recipient is
configured) emails a plain-text report via the existing
`getEmailAdapter()` (Microsoft Graph, same adapter every other
integration in this app uses).

## Real, deployed infrastructure

- **Cloud Run Job**: `generate-monthly-sli-report-soc2`
  (`terraform/main.tf`), running
  `me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2:sli-report-20260805`.
- **Cloud Scheduler**: `monthly-sli-report-soc2-trigger`, cron
  `0 7 1 * *` (07:00 UTC on the 1st of each month), triggers the job via
  its Cloud Run Jobs API `:run` endpoint.
- **Verified 2026-08-05**: manually executed
  (`gcloud run jobs execute generate-monthly-sli-report-soc2 --wait`) -
  completed successfully (`exit(0)`), real data pulled for all 4 SLIs:

  | SLI | Result | Target | Status |
  |---|---|---|---|
  | Availability | 100.00% | >= 99.5% | PASS |
  | Latency (p95) | 67.81ms | <= 3000ms | PASS |
  | Error rate | 0.03% | <= 1% | PASS |
  | Saturation (Cloud SQL connections) | 56.00% | <= 80% | PASS |

  All 4 showed `complete` data completeness. No error was thrown during
  the audit-event write (unlike an earlier local dry-run in an
  environment without Cloud SQL Proxy access, which correctly logged and
  continued past that failure) - the real Cloud Run Job execution has
  the Cloud SQL Proxy sidecar mounted, so this write succeeded for real.

## Configuration (environment variables)

| Variable | Required | Purpose |
|---|---|---|
| `GCP_PROJECT_ID` | Yes | The GCP project to query Cloud Monitoring against |
| `SLI_REPORT_ENVIRONMENT_LABEL` | No (defaults to service name) | Label shown in the report |
| `SLI_REPORT_SERVICE_NAME` | No (defaults to `ist-triage-soc2`) | Cloud Run service name for latency/error-rate/saturation filters |
| `SLI_REPORT_UPTIME_CHECK_ID` | Yes | The real uptime-check `check_id` (from the existing alert policy) |
| `SLI_REPORT_CLOUDSQL_DATABASE_ID` | Yes | `project:instance` for the saturation query |
| `SLI_REPORT_CLOUDSQL_MAX_CONNECTIONS` | No (defaults to 25) | Denominator for the saturation percentage |
| `SLI_REPORT_RECIPIENT_EMAIL` | No | **Deliberately not hardcoded anywhere.** Unset = report generates but is never emailed (safe default) |
| `SLI_REPORT_LOOKBACK_DAYS` | No (defaults to 30) | Reporting-period length |
| `SLI_REPORT_DRY_RUN` | No (defaults to `true`) | Set to `"false"` to allow real email delivery when a recipient is configured |

Configuration is validated at load time (`loadSliReportConfig()`) - a
missing required variable throws a precise `SliReportConfigError` naming
exactly which one, rather than silently defaulting to an invented value.

## Manual invocation

```
npx tsx src/scripts/generateMonthlySliReport.ts --dry-run
npx tsx src/scripts/generateMonthlySliReport.ts --force
gcloud run jobs execute generate-monthly-sli-report-soc2 --region=me-central1 --project=triage-502706 --wait
```

`--dry-run` previews the report without ever emailing, regardless of
config. `--force` bypasses the duplicate-period check (see below) to
resend a report for a period already emailed.

## Idempotency

One real email delivery per environment+calendar-month, enforced by
checking for an existing `SLI_REPORT_EMAILED` `AuditEvent` for that
environment/period before sending - not by a new table, reusing the same
`AuditEvent` model every other scheduled job in this app already writes
to. Use `--force` to deliberately resend.

## Audit trail

Every run writes real `AuditEvent` rows (module `SliReporting`):
`SLI_REPORT_GENERATION_STARTED`, `SLI_REPORT_GENERATED`,
`SLI_REPORT_GENERATION_FAILED`, `SLI_REPORT_EMAILED`,
`SLI_REPORT_EMAIL_FAILED`, `SLI_REPORT_DUPLICATE_SKIPPED`. Metadata
includes the report ID and outcome - not recipient email addresses (per
this app's convention of not logging PII in metadata; recipient count
only).

## Remaining action to fully close NFR-189

NFR-189's literal wording requires SLIs/SLOs to be "reported monthly **to
Qatar Airways**" - the capability now genuinely works end-to-end (proven
above), but no real email has been sent to an actual QR recipient, since
no customer email address is hardcoded anywhere in this codebase or
infrastructure config (by design). **To close this for real**: obtain a
real QR-designated recipient email address, configure
`SLI_REPORT_RECIPIENT_EMAIL` as a Cloud Run Job env var (or Secret
Manager secret), configure the real `MS_GRAPH_*` live-mode secrets if not
already set for this environment, set `SLI_REPORT_DRY_RUN=false`, then
re-run the job once and confirm a real delivered email.

## Known limitations

- Error-rate and latency data availability depends on the underlying
  log-based metric (`logging.googleapis.com/user/request_duration_ms`)
  and Cloud Run's built-in `request_count` metric continuing to be
  populated - if either stops flowing, the report will honestly show
  `no-data` rather than a fabricated percentage.
- This reports on `ist-triage-soc2` only, not `ist-triage-demo` - a
  second job/scheduler pointed at demo's real metric labels would be
  needed to report on that environment too, not built this pass.
