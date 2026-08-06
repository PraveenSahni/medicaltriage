# NFR-118 Operational Alert Validation Report

_Executed 2026-08-06. Environment: soc2 (`https://triagedsoc2.irisstar.tech`,
project `triage-502706`). Cloud SQL Auth Proxy: active (tunnel to
`ist-triage-postgres-uat` on `127.0.0.1:5433`, used to confirm the
soc2 database connection string and for the prior batch's Prisma
migration - not needed for this batch's HTTP-only triggers)._

## Phase 1: Deployed policy inspection

Confirmed via `gcloud alpha monitoring policies list --project=triage-502706
--format=json` that the live GCP state exactly matches
`terraform/alerting.tf`, and via `terraform plan -detailed-exitcode` (after
clearing one stale state lock left from the prior batch's own apply) that
**no drift exists anywhere in the project** ("No changes. Your
infrastructure matches the configuration.").

| Policy | Name (ID) | Filter | Threshold | Duration | Aggregation | Channel | Enabled |
|---|---|---|---|---|---|---|---|
| soc2 authentication failure rate spike | `alertPolicies/9231260387637802805` | `metric.type="logging.googleapis.com/user/soc2_auth_failure_rate"` | `> 10` | `300s` | `ALIGN_COUNT` / 300s | Triage Ops Email | true |
| soc2 privacy reveal-rate anomaly | `alertPolicies/3595332827611573293` | `metric.type="logging.googleapis.com/user/soc2_privacy_reveal_anomaly"` | `> 0` | `0s` | `ALIGN_COUNT` / 900s | Triage Ops Email | true |
| soc2 queue backlog age | `alertPolicies/5559064078824339348` | `metric.type="logging.googleapis.com/user/soc2_queue_oldest_waiting_item_age_seconds"` | `> 1800` | `300s` | `ALIGN_PERCENTILE_99` / 300s | Triage Ops Email | true |

No threshold was modified for this validation - all three were tested
against their real, deployed, unmodified configuration.

## Phase 2 + 3: Synthetic trigger and metric-ingestion validation

### Authentication failure spike - executed

A synthetic, non-existent account family (`nfr118-synth1..5@irisstar.tech`,
`synthetic-nfr118-validation@irisstar.tech`) was used - no real account was
locked or affected. Attempts respected the existing per-account lockout
(5 attempts) and per-IP login rate limit (10 requests/60s), which required
spreading the burst across multiple synthetic usernames and two rate-limit
windows:

- `2026-08-06T16:20:58Z`-`16:21:08Z`: 15 attempts against one synthetic
  username -> 5x `401`, then `423` (locked), then `429` (rate-limited).
- `2026-08-06T16:23:35Z`-`16:23:39Z`: 8 attempts against 2 fresh synthetic
  usernames -> 8x `401`.

**Cloud Logging confirmation** (`gcloud logging read
'resource.type="cloud_run_revision" AND
resource.labels.service_name="ist-triage-soc2" AND
jsonPayload.path="/login" AND jsonPayload.method="POST" AND
jsonPayload.statusCode=401' --freshness=15m`): **13 matching real log
entries**, timestamped `16:20:58`-`16:23:39Z` - confirms the corrected
filter (fixed in the prior batch) genuinely matches real production
traffic, exceeding the policy's `> 10` threshold in raw count.

**Cloud Monitoring time-series confirmation** (direct REST call to
`monitoring.googleapis.com/v3/.../timeSeries` with a live OAuth token,
filtered to `logging.googleapis.com/user/soc2_auth_failure_rate`): real
60-second DELTA data points were returned, matching the Cloud Logging
counts exactly:

| Interval (UTC) | Count |
|---|---:|
| 16:19:57-16:20:57 | 0 |
| 16:20:57-16:21:57 | 5 |
| 16:21:57-16:22:57 | 0 |
| 16:22:57-16:23:57 | 8 |
| 16:23:57-16:24:57 | 0 |
| 16:24:57-16:25:57 | 0 |

This is a genuine, end-to-end proof that the log-based metric pipeline
works: real application log lines -> real Cloud Logging entries -> real
Cloud Monitoring time-series points, with correct values.

**Limitation found, honestly disclosed**: the policy's condition requires
the *aggregated* value (using the policy's own `ALIGN_COUNT`/300s-aligned
windows, a different alignment boundary than the raw metric's 60s
buckets shown above) to exceed the threshold **continuously for 300
seconds**. This synthetic burst was compressed into roughly a 161-second
span. Depending on which 300s-aligned bucket(s) the events fall into, the
aggregated count may have exceeded 10 for only a single evaluation
window, not sustained across the full 300s duration the policy requires
to open an incident - GCP alert-policy `duration` semantics typically
require the condition to be observed true across multiple consecutive
evaluation cycles spanning that duration, not a single momentary spike.
**This means a short, front-loaded burst is very likely insufficient to
open an incident under this policy's exact configuration** - a real,
useful finding about the *test design*, not a defect in the metric or
policy itself. A future validation pass should sustain >10 events per
rolling 5-minute window continuously across at least 2 consecutive
5-minute windows (~10+ minutes of elevated traffic) to reliably cross the
duration threshold.

### Privacy reveal anomaly - NOT executed this batch

Triggering this policy for real requires an authenticated session holding
`privacy.reveal.request` (e.g. a Privacy Officer role) against the live
soc2 environment. The soc2 service has no `ADMIN_PASSWORD` bootstrap
secret configured (confirmed via `gcloud run services describe
ist-triage-soc2` - no such env var exists) and MFA is mandatory there
(per the AR.13 closure), meaning a real user's actual password and TOTP
device would be required. Neither is available to this session, and
obtaining or bypassing a real user's credentials to perform this test
would be inappropriate. **Not attempted, disclosed rather than
fabricated.**

### Queue backlog age - NOT executed this batch

Same authentication blocker: creating/aging a synthetic queue record and
then triggering `GET /api/v1/queue` against the live soc2 service to emit
the metric both require an authenticated session. **Not attempted,
disclosed rather than fabricated.**

## Phase 4 + 5: Incident-state and notification-delivery validation

**Not completed for any of the three policies**, for a reason that
applies regardless of which policy: **Cloud Monitoring's public API/CLI
surface does not expose an "open incidents" list.** `gcloud alpha
monitoring policies describe` and the `alertPolicies` REST resource
return only the policy *definition* (conditions, thresholds, channels),
never live incident/violation state - that is only visible in the Cloud
Console's Alerting UI, which this session cannot access. Similarly,
confirming actual e-mail delivery to "Triage Ops Email" would require
inbox access this session does not have.

This is the same class of constraint documented in the prior batch and is
now confirmed directly: this environment has no accessible, scriptable
way to prove "the policy opened an incident and a person received a
notification" beyond what has been shown here (real metric ingestion with
values exceeding the threshold). **This is the specific, disclosed,
remaining unproven step for all three policies.**

## Phase 6: Restoration / cleanup

- No synthetic queue records were created (Queue Backlog trigger was not
  attempted), so no queue cleanup is required.
- No synthetic reveal requests were created (Privacy Anomaly trigger was
  not attempted), so no reveal-workflow cleanup is required.
- The synthetic login accounts used
  (`nfr118-synth1..5@irisstar.tech`, `synthetic-nfr118-validation@irisstar.tech`,
  `synthetic-validation-test@irisstar.tech`) do not correspond to any real
  seeded user - login attempts against them only ever produced `401`
  (user not found) or rate-limit/lockout responses; no user record,
  session, or queue/privacy data was created or needs cleanup.
- No configuration was temporarily altered (no threshold was modified),
  so no configuration restoration is needed.
- soc2 was left in its normal healthy state throughout - confirmed via
  `GET /api/v1/runtime/environment` returning `200` before and after
  testing.

## Phase 7: Duplicate/noise assessment

Not directly observable without incident-list access (see Phase 4/5
limitation). No evidence of alert flapping was seen in the raw metric
time series (clean 0-value buckets before and after the burst, no
oscillation). No tuning changes were made or are recommended based on
this pass.

## Phase 8: Anomaly coverage matrix

| Anomaly class | Policy | Classification |
|---|---|---|
| Availability/uptime | `ist-triage-soc2 uptime failure` | Operational and previously validated (real evidence, `docs/sli-slo-definitions.md`) |
| 5xx/error rate | `ist-triage-soc2 5xx error rate` | Operational and previously validated |
| P95 latency | soc2 p95 request latency | Operational and previously validated |
| Cloud Run resource saturation | `Cloud Run instance count saturation` | Operational and previously validated |
| Cloud SQL resource saturation | Cloud SQL connection saturation | Operational and previously validated |
| SLI/SLO reporting failure | `generate_monthly_sli_report` job/alerting | Operational, detection-only (no incident-state validated this pass) |
| Authentication failure spike | `soc2 auth_failure_rate` | **Operational, metric-ingestion validated this batch; incident/notification not confirmed** |
| Privacy anomaly | `soc2 privacy_reveal_anomaly` | Operational (deployed, correctly filtered per prior batch), **not synthetically validated this batch** (authentication blocker) |
| Queue backlog age / transaction drop | `soc2 queue_backlog_age` | Operational (deployed, real emission exists), **not synthetically validated this batch** (authentication blocker) |
| Job failure (purge/privacy-fulfillment/access-review jobs) | Cloud Scheduler + Cloud Run Job retry/failure surfacing | Detection only - no dedicated alert policy exists for job-execution failure specifically |
| Transaction-volume drop (a sudden *decrease* in throughput, distinct from backlog age) | none | Not applicable this pass - the queue-backlog-age policy proxies for this but does not directly measure a volume decrease; a dedicated drop-detection policy is a remaining gap |

This is deliberately **representative, risk-based coverage** - not a
claim of universal anomaly detection.

## Phase 9: NFR-118 decision

**NFR-118 stays Partial.**

Per the closure rule's own fallback: "If one policy cannot be fully
validated: Keep NFR-118 Partial, State exactly which operational
lifecycle step remains unproven."

**Exact unproven steps, precisely stated:**

1. **Incident-state confirmation** for all 3 policies - Cloud Monitoring's
   API/CLI surface provides no accessible way to list open incidents in
   this environment; only the Console UI (not accessible this session)
   exposes this.
2. **Notification-delivery confirmation** for all 3 policies - requires
   inbox access to "Triage Ops Email," not available this session.
3. **Privacy-reveal-anomaly and queue-backlog-age synthetic triggers were
   not attempted at all** - both require an authenticated session against
   the live soc2 environment, and no admin bootstrap credential exists
   there (MFA-mandatory, per AR.13) - obtaining or bypassing real user
   credentials to perform this test would be inappropriate.
4. The one trigger that *was* executed (authentication failure spike)
   produced strong metric-ingestion evidence (real Cloud Logging entries,
   real Cloud Monitoring time-series values exceeding the raw threshold)
   but the burst's ~161-second duration was very likely too short to
   satisfy the policy's 300-second sustained-duration requirement for an
   actual incident to open - a genuine test-design limitation, disclosed
   rather than glossed over.

This batch materially strengthens NFR-118's evidence (real, verified,
end-to-end metric-ingestion proof for one of three policies, plus a full
policy-configuration audit confirming zero drift), but does not meet the
decision rule's requirement that "all three enter incident state under
safe synthetic conditions" and "internal notification delivery succeeds"
- neither of which could be confirmed with the tools available in this
session.
