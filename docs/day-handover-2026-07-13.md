# Day Handover - IST Tech Clinical Triage Platform

Date: 2026-07-13

## Closure Summary

Today the IST Tech Clinical Triage Platform was deployed and validated on Google Cloud Run in two separate environments:

- Demo: customer walkthrough environment with curated demonstration data.
- Simulation: synthetic-data environment for workflow rehearsal, AI evaluation, governed model testing, and volume simulation.

Both environments run the same committed application code and are clearly separated by runtime banner, data profile, and intended usage. Both remain mock/dry-run clinical environments and must not be treated as production clinical service.

## Repository State

- Repository: `https://github.com/PraveenSahni/medicaltriage`
- Branch: `main`
- Last deployment commit: `ae3b763 - Allow Cloud Run same-origin auth requests`
- Previous Cloud Run fixes:
  - `7189f4d - Serve Cloud Run SPA bundle as deferred script`
  - `e9afb6d - Fix Cloud Run SPA CSP for Vite assets`
  - `6e6b5b7 - Install OpenSSL for Prisma in Cloud Run image`
  - `8b9649e - Fix pnpm workspace for Cloud Build`
- Working tree at handover preparation: clean before this document was added.

## Google Cloud Environment

- GCP project: `aimltriage`
- Project number: `747398852986`
- Region: `me-central1`
- Artifact Registry repository: `ist-triage-repo`
- Cloud SQL instance: `ist-triage-postgres-uat`
- Cloud SQL database: `ist_triage`
- Cloud Run service account: `ist-triage-cloudrun-sa@aimltriage.iam.gserviceaccount.com`
- Secrets configured:
  - `DATABASE_URL`
  - `AUTH_JWT_SECRET`
  - `AUDIT_HMAC_SECRET`

## Deployed Cloud Run Services

### Demo

- Service: `ist-triage-demo`
- URL: `https://ist-triage-demo-747398852986.me-central1.run.app/`
- Runtime label: `DEMO`
- Data profile: `curated-demo`
- Purpose: customer walkthroughs, business demonstrations, and controlled solution presentation.

### Simulation

- Service: `ist-triage-simulation`
- URL: `https://ist-triage-simulation-747398852986.me-central1.run.app/`
- Runtime label: `SIMULATION`
- Data profile: `synthetic`
- Purpose: synthetic workflow rehearsal, queue behavior testing, AI evaluation, and governed model testing.

## Runtime Configuration

Both services are currently configured as safe non-production environments:

- `MOCK_MODE=true`
- `AUTH_LOCAL_LOGIN_ENABLED=true`
- `CCP_TRANSPORT_MODE=dry-run`
- `FHIR_WRITEBACK_MODE=dry-run`
- Cloud SQL connection attached, but current runtime remains mock/in-memory for application behavior.

This means the deployed environments are suitable for demo, validation, and UAT-style walkthroughs, but not for live clinical operations.

## Work Completed Today

1. Cloud Run SPA rendering issue fixed.
   - Root page was loading but React remained blank because the production Vite module script was blocked by the Cloud Run/Helmet CSP combination.
   - The server now serves the SPA index with a deferred script form compatible with the deployed CSP.
   - Static serving was adjusted so the rewritten SPA fallback is used consistently.

2. Same-origin Cloud Run login issue fixed.
   - The browser showed `Origin not allowed by security policies` during login from the Cloud Run domain.
   - CORS now accepts exact same-origin requests based on the deployed request host and forwarded protocol.
   - The existing localhost allow-list remains intact.
   - Unknown external origins remain blocked.

3. Demo and Simulation services deployed.
   - Cloud Build image tag: `ae3b763`
   - Demo revision deployed: `ist-triage-demo-00004-srz`
   - Simulation revision deployed: `ist-triage-simulation-00005-pbb`
   - Both revisions serve 100 percent of traffic.

4. End-to-end role validation completed.
   - All 19 configured simulated roles were tested against both Demo and Simulation.
   - Total role login/session checks: 38.
   - Result: 38 passed, 0 failed.

5. Browser-level workflow validation completed.
   - Demo login page visible and clean.
   - Simulation login page visible and clean.
   - Remote Triage Nurse can enter the Step cockpit.
   - Nurse cockpit can open one active call.
   - Active call lock, staged triage, red safety floor, route, and bilingual SBAR preview render.
   - Board/Kanban cockpit renders.
   - CCP workspace renders.
   - Help/Library renders.
   - Demo Platform Super Administrator enters the Security, Privacy, and Access Control admin portal.

## Validated Role Catalog

The following roles were validated through deployed login and session restore on both Demo and Simulation:

- A - Platform Super Administrator
- A - Organization Administrator
- A - System Administrator
- S - Security Administrator
- S - Privacy Officer / DPO
- G - Compliance Auditor
- G - Clinical Governance Lead
- G - Protocol Content Manager
- G - Quality Reviewer
- B - Triage Service Manager
- B - Call Intake Coordinator
- B - Remote Triage Nurse
- B - Senior Triage Nurse
- B - Pediatric Triage Nurse
- B - Teleconsult Physician
- B - Occupational Health Clinician
- I - Integration Administrator
- R - Reporting Analyst
- U - Helpdesk Support

## Validation Evidence

Local validation before deployment:

- `npm.cmd run typecheck:web` passed.
- `npm.cmd run build` passed.
- `npm.cmd test -- --runInBand` passed.
- Jest result: 9 test suites passed, 52 tests passed.

Cloud validation after deployment:

- Demo runtime endpoint returned `200`.
- Simulation runtime endpoint returned `200`.
- Root HTML for both apps returned `200`.
- Root HTML includes the deferred frontend script bundle.
- Same-origin Simulation login returned `200`.
- Same-origin CORS response returned:
  - `Access-Control-Allow-Origin: https://ist-triage-simulation-747398852986.me-central1.run.app`
- Unknown origin check returned `403`, confirming the CORS hardening still blocks untrusted origins.
- `/healthz/` returns `200`.

Operational note:

- `/healthz` without the trailing slash returned a Google edge `404` during one check, while `/healthz/` returned the expected application health JSON. This should be cleaned up in a future routing pass if an external monitor requires the slashless form.

## Difference Between Demo And Simulation

Demo is for showing the solution.

- Uses curated demonstration data.
- Best for customer walkthroughs and business demonstrations.
- Keeps the experience clean, predictable, and presentation-ready.

Simulation is for testing and learning.

- Uses synthetic records only.
- Best for workflow rehearsal, AI evaluation, governed model testing, queue-volume behavior, edge cases, and synthetic-data quality review.
- No PHI should be used.

Both environments run the same application code and both remain dry-run/mock environments at this stage.

## Current Product Position

The deployed platform now supports:

- Minimal IST Tech login experience.
- Grouped role simulator.
- Separate Demo and Simulation Cloud Run services.
- Nurse Step cockpit for one-call-at-a-time triage.
- Kanban/Board cockpit for queue visibility.
- CCP workspace for controlled employee communication.
- Help and Library structure.
- Security and administration portal.
- Rules-first clinical safety floors.
- Bilingual SBAR preview.
- Synthetic data and simulation support.
- Dry-run FHIR and CCP transport configuration.

## Open Items For Next Session

1. Decide final monitor endpoint.
   - Either standardize on `/healthz/` or add an explicit slashless `/healthz` Cloud Run-compatible route check.

2. Complete live database mode migration.
   - Current deployed behavior remains mock/in-memory.
   - Next step is Prisma migration against Cloud SQL, controlled seed, and live persistence validation.

3. Separate Demo data and Simulation data more visibly inside the app.
   - Demo should stay curated and presentation-safe.
   - Simulation should expose synthetic record filters, case details, and scenario controls.

4. Continue nurse cockpit refinement.
   - Keep one-active-call workflow simple.
   - Improve incoming-call filters and record-detail review.
   - Decide whether senior nurse/service manager defaults to Step or Board.

5. Harden production readiness.
   - Replace local mock login with SSO.
   - Disable mock password fallback for non-demo/non-simulation.
   - Finalize Cloud SQL private connectivity and least-privilege access.
   - Add Cloud Monitoring checks and alerting.

6. Complete integration hardening.
   - Oracle Fusion HCM employee sync live connector.
   - FHIR/EMR writeback in dry-run first, then controlled UAT.
   - CCP WhatsApp/SMS/email provider configuration after governance approval.

7. Prepare UAT checklist.
   - Role-by-role access review.
   - Nurse cockpit workflow review.
   - Safety-floor test scenarios.
   - Pediatric/adult routing review.
   - Audit and privacy review.
   - Demo versus Simulation acceptance criteria.

## Pickup Instructions

Use these URLs for the next review:

- Demo: `https://ist-triage-demo-747398852986.me-central1.run.app/`
- Simulation: `https://ist-triage-simulation-747398852986.me-central1.run.app/`

Recommended next validation path:

1. Open Simulation.
2. Simulate `B - Remote Triage Nurse`.
3. Open a queue call from the Step cockpit.
4. Confirm staged workflow, safety floor, disposition route, and SBAR preview.
5. Switch to Board.
6. Open Help/Library.
7. Sign out.
8. Simulate `A - Platform Super Administrator`.
9. Confirm Security, Privacy, and Access Control admin portal.
10. Repeat only key smoke checks in Demo for customer presentation readiness.

