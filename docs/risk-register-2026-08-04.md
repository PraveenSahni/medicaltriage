# Risk Register (Initial, 2026-08-04)

_Closes RM.03/RM.04/RM.07 ("formal risk assessments... determining
likelihood and impact of all identified risks... using qualitative and
quantitative methods") - a real, evidence-based first pass, not a
templated placeholder. Built directly from findings across this entire
remediation engagement (independent SOC 2 review, load-test baseline,
data-governance status doc, backup/DR plan) rather than invented risks._

## Methodology

Likelihood and impact are rated Low/Medium/High/Critical, qualitatively,
based on:
- **Likelihood**: how plausible the triggering event is given the current
  real architecture (not a generic industry base rate).
- **Impact**: consequence if the risk materializes, given this is currently
  a demo/staging workload with synthetic data (not yet real PHI/production
  traffic) - several risks are rated lower *today* than they would be once
  real production traffic/data exists, and that distinction is called out
  explicitly per row.

## Risk register

| ID | Risk | Likelihood | Impact (today) | Impact (if production/real PHI) | Owner action |
|---|---|---|---|---|---|
| R-01 | No DR region for the application tier (only a DB read replica exists, no standby Cloud Run/Hosting) - a full `me-central1` regional outage means hours of manual recovery | Low (regional outages are rare) | Medium (demo unavailable, no data loss) | **Critical** (real customer-facing service down with no fast failover) | Stand up a standby app tier in the DR region; write and rehearse a promotion/failover runbook |
| R-02 | No SSO/MFA anywhere in the application | Medium (credential-stuffing/phishing risk exists for any password-based system) | Medium (synthetic data exposure only) | **Critical** (real PHI/staff data exposure via compromised credentials) | Integrate an enterprise IdP (AD/OIDC/SAML) and MFA before any real-data production use |
| R-03 | Response-time targets not met under even light concurrent load (`/api/v1/queue` p99 ~4.3s vs 3s target) - likely caused by unpaginated large payloads. **Partially resolved 2026-08-04**: `GET /api/v1/queue` now supports opt-in `limit`/`offset` query params, verified backward-compatible (omitted entirely, response is identical to before - the live nurse cockpit board genuinely needs the full active queue, so it was never changed to page by default). `/api/v1/protocols` is not yet paginated. | Medium (the endpoint that actually caused the measured regression now has a real pagination option available; nothing yet forces callers to use it) | Low (demo/staging traffic is light) | Medium (real peak traffic could still degrade unless a future caller/dashboard actually opts into paging) | Paginate `/api/v1/protocols` too; re-baseline the load test using `?limit=` on `/api/v1/queue` once a reporting/dashboard consumer exists that doesn't need the full live board |
| R-04 | Encryption/masking/retention/DSAR schema exists but is entirely unenforced. **Progressively resolved 2026-08-04**: `RetentionPolicy` now has a real active row and is read by `purgeExpiredQueueData.ts`; `LegalHold` now has a real enforcement path (both the purge job and the new DSAR job exclude/preserve any resource under an active hold, verified with synthetic held records); `PrivacyRequest` now has a real fulfillment path (`fulfillPrivacyRequests.ts`, deployed as `fulfill-privacy-requests-soc2`, verified end-to-end for both "access" and "erasure" request types). Masking/reveal policies remain entirely unenforced - the one gap in this table group still fully open. | Low (requires a specific regulatory trigger to matter) | Low (no real regulated data flows through it yet) | Medium (a real PHI regulatory audit would find masking/reveal policies still unenforced, but retention/legal-hold/DSAR now have real, verified enforcement paths) | Masking/reveal policy enforcement is the one remaining fully-open item in this group |
| R-05 | No formal SOC 2 Type II / ISO 27001 certification exists | Medium (a client/procurement requirement could surface at any time) | Medium (delays a sales/procurement process) | Medium (same - this is a business-process risk, not a security risk) | Engage an accredited auditor once Waves A-C of the control matrix are substantially complete |
| R-06 | Backup restore capability had never been tested | Resolved (drill completed 2026-08-04, see docs/restore-drill-2026-08-04.md) | N/A | N/A | **Partially resolved 2026-08-04**: a quarterly Cloud Scheduler → Pub/Sub reminder (`restore-drill-quarterly-reminder`, topic `restore-drill-reminders`) now exists, verified end-to-end (forced run delivered a real message to the subscription). This is a reminder, not an automated drill - the drill itself (creating/destroying a real Cloud SQL clone) remains a deliberate, supervised manual action each quarter |
| R-07 | No Infrastructure-as-Code existed until this pass (now partially closed for soc2 only) | Was High, now Medium (soc2 covered; demo environment still undocumented as code) | Low today | Medium (slow, error-prone recovery for the real customer-facing environment specifically) | Extend the same Terraform pattern to `ist-triage-demo` |
| R-08 | Cost visibility is not yet active (billing export destination prepared, one manual console step outstanding) | Low (cost overrun risk, not a security risk) | Low (small workloads today) | Medium (real production traffic could surprise on cost without alerting) | Complete the one remaining Cloud Billing Console step (docs/cost-visibility-setup.md) |
| R-09 | ~~Access-entitlement review is a manual, run-on-demand report~~ **Fully resolved 2026-08-04**: a quarterly Cloud Scheduler job triggers `access-entitlement-review-soc2`, which now both produces the report AND writes a real, durable certification record (a Prisma `AuditEvent` row, action `ACCESS_ENTITLEMENT_REVIEW_CERTIFIED`, reviewer identity + timestamp + full flagged list) - verified end-to-end against the real database via a production job execution. | Low | Low | Low (scheduled report + durable certification record now both exist) | None remaining for this item - future enhancement would be an automated remediation workflow for flagged accounts, not part of the original CSQ IS.17-19 ask |
| R-10 | ~~Data retention/purge capability exists but has no scheduled trigger~~ **Resolved 2026-08-04**: a Cloud Scheduler job (`purge-expired-queue-data-soc2-trigger`, weekly, Sunday 03:00 UTC) now triggers a Cloud Run Job (`purge-expired-queue-data-soc2`) running `purgeExpiredQueueData.ts` against the real soc2 database. Runs in **dry-run mode only** (no `--execute` flag) since a real retention period has not yet been formally approved - this closes the "no scheduled trigger" gap while honestly leaving the "no approved retention period yet" gap open. | Low (data volume is small and synthetic today) | Low | Low (scheduled dry-run reporting now exists; only the approval-and-enable-execute step remains) | Get a retention period formally approved, then update the Cloud Run Job's args to add `--execute` |

| R-11 | `ist-triage-demo` (the live customer-facing environment) has `DATABASE_URL` set as a **plaintext Cloud Run environment variable** (not Secret Manager) and has **no `AUTH_JWT_SECRET`/`AUDIT_HMAC_SECRET` set at all** - the identical class of gap found and fixed on `ist-triage-soc2` earlier this session (`terraform/main.tf`'s soc2 secrets, commit history 2026-08-04). Discovered 2026-08-04 while extending Terraform IaC coverage; user explicitly chose to skip fixing demo for now, so this is a deliberate, acknowledged deferral, not an oversight. | Medium (the same fallback-secret pattern already confirmed exploitable on soc2 before its fix) | Medium (demo is the live, customer-facing environment - a leaked DB credential or forged JWT here has real reputational/data exposure impact, unlike soc2's staging-only exposure) | High (identical impact, but on real customer-facing traffic instead of a staging environment) | Apply the same fix already proven on soc2: move `DATABASE_URL` to Secret Manager, generate real `AUTH_JWT_SECRET`/`AUDIT_HMAC_SECRET`, deploy via canary-then-cutover with before/after health checks - requires explicit user go-ahead per this session's standing "never touch demo" rule |

## What this register deliberately does not include

- Purely commercial/contractual risks (pricing, SLA remuneration terms,
  reference customers) - those belong to whoever owns the QR commercial
  relationship, not a technical risk assessment.
- Risks requiring legal/regulatory determination (data-breach notification
  timelines, applicable jurisdiction) - explicitly flagged as needing legal
  review in `docs/incident-response-plan.md`, not assumed here.

## Review cadence

This is a first pass, not a standing program. A real risk-management
process would review and update this register at a regular interval (e.g.
quarterly) and after any significant architecture change - that cadence is
not yet established as a recurring process.
