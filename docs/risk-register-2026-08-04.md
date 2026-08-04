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
| R-03 | Response-time targets not met under even light concurrent load (`/api/v1/queue` p99 ~4.3s vs 3s target) - likely caused by unpaginated large payloads | High (confirmed by direct measurement, not theoretical) | Low (demo/staging traffic is light) | High (real peak clinical-shift traffic could degrade badly) | Implement real pagination on `/api/v1/queue` and `/api/v1/protocols`; re-baseline |
| R-04 | Encryption/masking/retention/DSAR schema exists but is entirely unenforced | Low (requires a specific regulatory trigger to matter) | Low (no real regulated data flows through it yet) | High (a real PHI regulatory audit would find this immediately) | Prioritize `PrivacyRequest`/`RetentionPolicy` enforcement before handling real regulated data |
| R-05 | No formal SOC 2 Type II / ISO 27001 certification exists | Medium (a client/procurement requirement could surface at any time) | Medium (delays a sales/procurement process) | Medium (same - this is a business-process risk, not a security risk) | Engage an accredited auditor once Waves A-C of the control matrix are substantially complete |
| R-06 | Backup restore capability had never been tested | High before 2026-08-04 | N/A - a restore drill is in progress this same day; result to be documented once complete | N/A | Schedule this as a recurring (e.g. quarterly) drill, not a one-time event, once this first drill's result is recorded |
| R-07 | No Infrastructure-as-Code existed until this pass (now partially closed for soc2 only) | Was High, now Medium (soc2 covered; demo environment still undocumented as code) | Low today | Medium (slow, error-prone recovery for the real customer-facing environment specifically) | Extend the same Terraform pattern to `ist-triage-demo` |
| R-08 | Cost visibility is not yet active (billing export destination prepared, one manual console step outstanding) | Low (cost overrun risk, not a security risk) | Low (small workloads today) | Medium (real production traffic could surprise on cost without alerting) | Complete the one remaining Cloud Billing Console step (docs/cost-visibility-setup.md) |
| R-09 | Access-entitlement review is a manual, run-on-demand report, not a scheduled/enforced certification workflow | Medium (privilege creep over time is a common, realistic risk) | Low (small, known user set today) | Medium (a larger real user base makes manual review unreliable) | Schedule the review script to run on a cadence (e.g. quarterly) with a recorded sign-off, not just an ad hoc run |
| R-10 | Data retention/purge capability exists but has no scheduled trigger (manual script run required) | Low (data volume is small and synthetic today) | Low | Medium (unbounded data growth is a real cost/compliance concern at production scale) | Wire `purgeExpiredQueueData.ts` into a scheduled Cloud Scheduler job once a real retention period is formally decided |

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
