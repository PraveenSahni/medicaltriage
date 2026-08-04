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
| Latency | p95 response time for critical clinical-workflow endpoints (queue claim, triage complete) | ≤ 3 seconds | **No** - no latency percentile tracking is currently collected; only Cloud Run's default request logging exists |
| Error rate | 5xx responses as a percentage of total requests | < 1% per calendar month | **Partial** - real alert policies now exist for both services (`ist-triage-demo 5xx error rate`, `ist-triage-soc2 5xx error rate`, added 2026-08-04), firing when >5 5xx responses occur in a 5-minute window using Cloud Run's built-in `request_count` metric (no new instrumentation). This is count-based alerting, not yet a formal percentage-of-total-traffic SLO calculation or monthly report. |
| Saturation | Cloud SQL connection pool utilization, Cloud Run instance count vs. max | Alert at 80% of configured limits | **No** - not currently tracked or alerted on |

## What closing the "measured today" gap would require

- **Latency:** structured request logging with duration capture, exported
  to a metrics backend (Cloud Monitoring custom metrics or an APM tool),
  plus a dashboard.
- **Error rate:** the same logging infrastructure, aggregated by status
  code.
- **Saturation:** Cloud SQL and Cloud Run both expose utilization metrics
  natively in Cloud Monitoring already - this is the cheapest of the three
  gaps to close, since it doesn't require new instrumentation, only a
  dashboard/alert policy on metrics GCP already collects.

## Reporting cadence

Not yet established. Once the metrics above are actually being collected,
a monthly summary (even a simple exported report from Cloud Monitoring)
could be shared with QR - this is a process decision to make once the
underlying measurement gap is closed, not a technical blocker itself.

## Explicitly out of scope for this document

- Building the actual latency/error-rate/saturation monitoring described
  above - this document defines targets, it doesn't implement the
  instrumentation.
