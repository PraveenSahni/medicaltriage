# Privacy Notification Operational Runbook

_Written 2026-08-05. Companion to
`docs/security/privacy-incident-notification-procedure.md`. This is
the "how to operate it" reference for whoever runs this workflow for
real once approvals exist._

## Configuration reference

| Env var | Default | Effect |
|---|---|---|
| `PRIVACY_NOTIFICATION_ENABLED` | `false` | Master switch for the delivery step only - the incident/review/classification workflow always runs regardless |
| `PRIVACY_NOTIFICATION_DRY_RUN` | `true` | Even when enabled, a send only leaves this application when this is explicitly `"false"` |
| `PRIVACY_NOTIFICATION_SLA_HOURS` | unset (`null`) | Real number of hours from a "notification required" decision to a deadline; unset means no deadline is tracked |
| `PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS` | unset (empty) | Comma-separated internal IST test/review addresses |
| `PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS` | unset (empty) | Comma-separated authorized Qatar Airways recipient addresses - never hardcoded |

## How to run an internal dry-run/test cycle (safe, no external contact)

1. Ensure `PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS` is set to a real
   internal IST address.
2. Create/advance an incident through the workflow
   (`createIncidentCandidate` -> `beginReview` -> `classifyIncident`
   -> `confirmIncident` -> `recordNotificationDecision` ->
   `approveNotification`).
3. Call `generateAndDeliverNotification(incidentId, { targetAudience:
   "internal_test" })`. With `PRIVACY_NOTIFICATION_ENABLED` unset (or
   `PRIVACY_NOTIFICATION_DRY_RUN` still `true`), this returns a preview
   only - no email is sent.
4. To actually deliver an internal test email, set
   `PRIVACY_NOTIFICATION_ENABLED=true` and
   `PRIVACY_NOTIFICATION_DRY_RUN=false`, then re-run step 3.

## How real customer delivery is gated (do not attempt without authorization)

`generateAndDeliverNotification(incidentId, { targetAudience:
"customer" })` throws `NotificationNotConfiguredError` unless **all**
of the following are true simultaneously:
- `PRIVACY_NOTIFICATION_ENABLED=true`
- `PRIVACY_NOTIFICATION_DRY_RUN=false`
- `PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS` contains a real address

There is no dry-run/preview path for `targetAudience: "customer"` -
customer delivery is either fully authorized or entirely refused, by
design (see the procedure doc's design-constraints note).

## Checking for overdue notifications

`checkOverdueNotifications()` queries for incidents past their
`notificationDeadlineAt` that are not yet `notification_sent`/
`closed`/`notification_not_required`, and emits a durable high-risk
`PRIVACY_NOTIFICATION_OVERDUE` audit event per overdue incident. Not
yet wired to a scheduled Cloud Run Job or alerting integration in this
pass - recommend a follow-up batch adding a scheduled job (mirroring
the existing SLI-report/retention-purge job pattern) that calls this
function on an interval and pages/escalates on any result.

## Rollback

Set `PRIVACY_NOTIFICATION_ENABLED=false` (or leave `DRY_RUN=true`) and
redeploy - immediately reverts to preview-only behavior. The
`PrivacyIncident` table is additive and harmless to leave in place;
no data loss from disabling the flag.

## Real validation performed (2026-08-05)

Full workflow run against the real soc2 Postgres database (synthetic
incident, cleaned up after): incident created -> reviewed -> classified
-> confirmed -> notification decision recorded -> approved (distinct
approver) -> dry-run delivered to a configured internal test recipient
-> confirmed no email actually sent (dry-run) -> confirmed a real,
durable `PRIVACY_INCIDENT_STATUS_TRANSITION` audit event was written.
Deployed to a `--no-traffic` soc2 canary
(`ist-triage-soc2-00045-muy`, tag `privacy-incident`), health-checked,
then cut over to live traffic (low risk - notification delivery stays
disabled by default; only the always-on incident-candidate creation on
anomaly detection is newly active, a low-risk additive DB write).
