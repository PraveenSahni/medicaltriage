# Anomaly Alerting Matrix (NFR-118)

_Written 2026-08-06 as part of the Automated Security Monitoring & Metrics
batch. Status: **existing 4 policies operational; 3 new policies
prepared, not yet applied.**_

## Literal requirement

> "System shall have the capability to raise alerts in case of any
> anomalies like (but not limited to) Increased error rates, SLA drop,
> performance drop, transaction drop etc."

Interpreted, per this batch's explicit instruction, as a **representative,
risk-based monitoring capability**, not literal detection of every
possible anomaly (an unbounded, undeliverable standard for any real
system).

## Existing operational alert policies (confirmed live, gcloud-provisioned)

| Metric | Threshold | Window | Channel | Owner | Environment | Status |
|---|---|---|---|---|---|---|
| 5xx error rate | > 5 in window | 5 min | Cloud Monitoring incident | Backend eng | soc2 + demo | Verified live (`docs/sli-slo-definitions.md`) |
| p95 request latency | > 3000ms | 5 min | Cloud Monitoring incident | Backend eng | soc2 + demo | Verified live |
| Cloud SQL connection saturation | 80% of `max_connections` | - | Cloud Monitoring incident | SRE | shared instance | Verified live |
| Cloud Run instance-count saturation | 80% of configured max | - | Cloud Monitoring incident | SRE | soc2 + demo | Verified live |
| Uptime/availability | Uptime-check failure | - | Cloud Monitoring incident | SRE | soc2 + demo | Verified live |

All 5 were provisioned directly via `gcloud` (not Terraform) prior to this
batch - confirmed by grep: no `google_monitoring_alert_policy` resource
existed anywhere in this repo before `terraform/alerting.tf` (added this
batch). This is a real, disclosed gap in this engagement's own
infrastructure-as-code discipline for monitoring specifically (unlike
every other resource in `terraform/main.tf`), not something this batch
attempts to retroactively import - only new policies are added as IaC.

Distinguishing "detection only" vs. "operational alert": all 5 existing
policies are real Cloud Monitoring alert policies that enter incident
state and notify a configured channel - not merely a durable log/audit
record with no paging path.

## New policies added this batch (`terraform/alerting.tf`) - NOT YET APPLIED

| Policy | Real signal backing it | Threshold (engineering default) | Status |
|---|---|---|---|
| Authentication-failure-rate spike | Real: `requestDurationLogger`'s existing structured stdout log (`path="/api/v1/auth/login"`, `statusCode=401`) | > 10 failures / 5 min | Terraform written, not applied |
| Privacy reveal-rate anomaly | Real: a new structured stdout log line added this batch in `checkRevealAnomalyRate` (`src/services/securityAdmin.ts`) - previously this detection was only a durable `AuditEvent`, never emitted to stdout/Cloud Logging | > 0 detections / 15 min | Terraform written, not applied |
| Queue backlog age | **Not yet backed by any real log emission** - no code currently emits `queue_oldest_waiting_item_age_seconds` to stdout. Disclosed explicitly in `terraform/alerting.tf`'s own comments. | > 30 min oldest-waiting-item age | Terraform written, NOT populatable until a follow-up emits the metric |

All thresholds above are **engineering defaults**, explicitly not
Qatar-Airways-approved SLA/paging thresholds - `terraform/alerting.tf`'s
`notification_channel_ids` variable defaults to an empty list (no
hardcoded QR recipient), per this batch's explicit constraint.

## Alert delivery

**Not yet configured.** `notification_channel_ids` is an empty list by
default in `terraform/alerting.tf` - these 3 new policies, once applied,
would have no real paging destination attached until a real notification
channel (email/Slack/PagerDuty) is created and wired in, a separate,
deliberate step (creating a notification channel is itself a real
operational decision, e.g. who receives these pages - not invented here).

## Why these were not deployed this batch

Per this batch's own closure rule ("if only more policies are defined in
Terraform but not deployed and triggered, retain Partial"), and given that
`terraform apply` against the live soc2 project plus a synthetic-trigger-
and-resolve validation cycle is itself a real production-monitoring
change, this was deliberately deferred to its own execution window rather
than folded into the same pass that authored the resource definitions -
consistent with this engagement's general practice of not bundling
definition and live-activation of infrastructure changes in a single,
rushed step. `gcloud` credentials were confirmed available and
authenticated to the `triage-502706` project during this batch
(`gcloud auth list`), so this is a scheduling/discipline decision, not a
credentials blocker - flagged as the very next actionable step.

## Remaining activation steps (in order)

1. Add the missing `queue_oldest_waiting_item_age_seconds` stdout emission
   (small, separate code change) so all 3 new policies have a real signal.
2. Create a real Cloud Monitoring notification channel and populate
   `notification_channel_ids`.
3. `terraform plan`/`apply` against the soc2 project.
4. Synthetic validation per policy: trigger a safe synthetic condition
   (e.g. deliberate failed logins against a disposable test account),
   confirm the metric changes, confirm the policy enters incident state,
   confirm the notification fires, restore normal state, confirm the
   alert resolves, retain evidence.
5. Document policy owners formally in this matrix.

## Closure decision

**NFR-118 stays Partial**, strengthened from the prior state (4 real
policies) with 2 of 3 new policies now backed by real emitted log data
(auth-failure, privacy-anomaly) and one (queue-backlog) honestly disclosed
as not yet backed by any emission at all. None of the 3 new policies have
been applied or synthetically validated this batch - per the batch's own
rule, definitions in Terraform without deployment and triggering do not
constitute an operational alert.
