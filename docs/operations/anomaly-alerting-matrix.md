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

## Update 2026-08-06 (continued): deployed and partially validated

All 3 new policies were applied for real via `terraform apply` (scoped
via `-target` to only these 6 resources; a full, untargeted
`terraform plan` afterward showed zero drift anywhere else in the
project). Wired to the existing, already-operational internal IST
notification channel ("Triage Ops Email" -
`projects/triage-502706/notificationChannels/15435234724333157056`,
confirmed via `gcloud alpha monitoring channels list`, the same channel
already used by all 5 pre-existing policies) - no new channel needed, no
Qatar Airways recipient used.

The queue-backlog metric is now backed by a real emission
(`emitQueueBacklogMetric()` in `src/services/queueOrchestration.ts`,
called from `listQueueItems()`).

**A real, more significant defect was found and fixed during synthetic
validation**: the auth-failure-rate log filter originally read
`jsonPayload.path="/api/v1/auth/login"`, but a live synthetic
failed-login trigger against `https://triagedsoc2.irisstar.tech` showed
via `gcloud logging read` that `requestDurationLogger` actually logs
router-relative paths (`"/login"`, not the full mount path) - the
original filter would never have matched anything. Fixed and
re-`terraform apply`-ed; a follow-up synthetic trigger confirmed real log
entries now match the corrected filter.

**What was validated**: real synthetic failed-login attempts against the
live soc2 environment produce real, matching Cloud Logging entries for
the auth-failure-rate metric (confirmed via `gcloud logging read`).

**What was NOT completed this batch**: a full incident-fire-and-resolve
cycle (metric crosses threshold -> policy enters incident state ->
notification delivered -> condition clears -> policy resolves) for any
of the 3 policies. Each requires sustained real traffic sampled across a
genuine 5-15 minute Cloud Monitoring alignment window, which was not
completed within this session. This is the one remaining gap before
NFR-118 can move to Yes per its own closure rule ("policies are deployed,
internal alert routing works, synthetic trigger/resolve cycles succeed").

## Update 2026-08-06 (continued): dedicated operational validation batch

Full inspection, synthetic-trigger, and coverage-matrix pass performed -
see `docs/operations/nfr-118-alert-validation-report.md` for exact
timestamps, commands, and evidence. Confirmed zero Terraform drift (a
full `terraform plan` shows the live project exactly matches
configuration). The authentication-failure-spike trigger produced real,
verified, end-to-end metric-ingestion evidence: matching Cloud Logging
entries and matching Cloud Monitoring time-series data points exceeding
the raw `>10` threshold. Privacy-reveal-anomaly and queue-backlog-age
triggers were **not attempted** this batch - both require an
authenticated session against the live soc2 environment (MFA-mandatory,
no admin bootstrap credential configured there), which this session does
not have and should not attempt to bypass.

**Genuine, disclosed tooling limitation**: Cloud Monitoring's public
API/CLI surface (`gcloud alpha monitoring policies ...`, the
`alertPolicies` REST resource) exposes only policy *definitions*, never
live incident/violation state - there is no accessible way in this
environment to confirm "an incident opened" or "a notification was
delivered" without Cloud Console UI access (not available this session)
or inbox access to "Triage Ops Email" (also not available). This applies
to all 3 policies regardless of trigger success.

## Closure decision

**NFR-118 stays Partial.** All 3 new policies are genuinely deployed
against the real soc2 project, correctly filtered (after a real bug fix
confirmed via live log inspection), and wired to an operational internal
notification channel. This batch added real, verified metric-ingestion
proof for 1 of 3 policies. It does not move to Yes because: (1) incident-
state and notification-delivery cannot be confirmed with the tools
available in this environment for any of the 3 policies, and (2) the
privacy-anomaly and queue-backlog triggers were not attempted due to a
genuine authentication-credential constraint against the live
MFA-mandatory soc2 environment.
