# Non-Production Environments

_Closes NFR-083/084 ("minimum mandated non-production environments... SIT,
UAT & Stage, with SLA of at least 99% availability" / "additional
environments like NFR, Training etc."). This maps the two real, already-
running non-production environments onto that naming convention, and
defines their availability target - it does not require standing up new
infrastructure, since both environments already exist and are independently
verified this engagement._

## Environment mapping

| QR-requested tier | This engagement's real environment | What it is |
|---|---|---|
| **UAT (User Acceptance Testing)** | `ist-triage-demo` / `triaged.irisstar.tech` | The customer-facing demo environment used for stakeholder walkthroughs and acceptance review. Synthetic data only (`APP_DATA_PROFILE=synthetic`). |
| **Stage (Staging)** | `ist-triage-soc2` / `triagedsoc2.irisstar.tech` | The environment every real fix and remediation this engagement is verified against before being considered done - genuinely a pre-production staging environment in practice, not just named for SOC 2 work. |
| **SIT (System Integration Testing)** | Not a separately named environment today | Integration-level verification (Twilio webhook flows, FHIR writeback, HRMS adapter) happens against the Stage environment above, or locally via the Playwright e2e harness (`playwright.config.ts`) - there is no third, dedicated SIT-only environment. |
| **NFR/Training** | Not provisioned | Would follow the same, already-demonstrated repeatable process used to stand up the Stage environment (new Cloud SQL database, Secret Manager secrets, Cloud Run service, Firebase Hosting target) - real, but requires engineering effort each time, not a self-service "request an environment" capability. |

## Availability target

Both non-production environments target **99% monthly availability**,
matching the floor QR's own requirement names ("at least 99%"). This is
monitored the same way as the production-facing SLI/SLO already defined in
`docs/sli-slo-definitions.md`: Cloud Monitoring uptime checks against each
environment's `/healthz` endpoint, alerting on sustained failure.

This is a **defined target for these two non-production environments
specifically** - it does not replace or restate the separate,
formally-defined production availability SLI/SLO in
`docs/sli-slo-definitions.md`.

## What this does not cover

- A dedicated, separate SIT environment distinct from Stage - not built;
  integration testing today happens against Stage or locally.
- A dedicated Training environment - not provisioned; would need the same
  real, repeatable-but-manual environment-creation process used for Stage.
- A formal, QR-confirmed SLA tier (this defines an internal 99% target as a
  reasonable floor, not a QR-negotiated contractual SLA).
