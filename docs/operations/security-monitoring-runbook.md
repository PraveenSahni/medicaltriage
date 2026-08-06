# Security Monitoring Runbook (Automated Security Monitoring & Metrics batch)

_Written 2026-08-06. Covers the 3 requirements closed in this batch: CSQ
IS.13 (access-revocation metrics), CSQ IS.40 (application-layer vulnerability
scanning), NFR-118 (anomaly alerting)._

## CSQ IS.13 - access-revocation metrics

- **Where**: `src/services/securityAdmin.ts` (`AccessRevocationMetric` type,
  `recordAccessRevocationMetric`, `getAccessRevocationMetricsReport`).
- **How to check it**: `GET /api/v1/admin/access-revocation-metrics?days=30`
  as a user holding `audit.events.view`.
- **On-call action if a spike in `failedCount` is observed**: review the
  `failureReason` field on recent metrics (currently only surfaced via a
  direct code/log inspection, not yet in the report's JSON body - a future
  enhancement) and cross-reference `AuditEvent`s for the same window via
  the existing `/admin/audit-events` route.
- See `docs/security/access-revocation-metrics.md` for full architecture.

## CSQ IS.40 - application-layer vulnerability scanning

- **Where**: `.github/workflows/zap-baseline.yml` (not yet pushed/active -
  see status section below).
- **Once active**: a failed/degraded run shows in GitHub Actions; the
  `zap-baseline-report` artifact (HTML/Markdown/JSON) is retained 90 days.
- **Triage process**: classify each finding (Confirmed / False positive /
  Informational / Environment-specific / Accepted risk / Remediated),
  record owner + target date + status in a findings log alongside
  `docs/security/application-vulnerability-scanning.md`.
- **Do not** suppress a finding merely to make the workflow pass -
  `fail_action: false` means the workflow doesn't hard-fail on findings by
  design (so triage happens deliberately, not via a red X nobody reads),
  not that findings should be ignored.

## NFR-118 - anomaly alerting

- **Where**: `terraform/alerting.tf` (3 new policies, deployed 2026-08-06 -
  confirmed via `gcloud alpha monitoring policies list --project=triage-502706`);
  existing 5 policies documented in `docs/sli-slo-definitions.md`.
- **On-call action for an incident**: each policy's `documentation.content`
  field (visible in the Cloud Monitoring incident) states the specific
  investigation step (e.g. "investigate the source IP(s)" for the
  auth-failure-spike policy). All 8 policies (5 existing + 3 new) notify
  the same internal IST channel ("Triage Ops Email").
- **Remaining gap, disclosed**: a full incident-fire-and-resolve cycle has
  not yet been observed for any of the 3 new policies (requires sustained
  real traffic across a genuine 5-15 minute alignment window) - see
  `docs/operations/anomaly-alerting-matrix.md` for exact remaining steps.

## General principle for all three

None of these three controls should ever be described as "operational" or
"Yes" based on the presence of a file in this repository alone. Each has
its own explicit, disclosed activation/verification bar (documented in its
own doc above) - a prepared artifact and a verified, running control are
different things, and this batch is deliberately honest about which state
each of the three is actually in.
