# Privileged Identity Register (CSQ IS.66)

_Updated 2026-08-06 after the soc2 runtime-identity cutover. Supersedes
the inventory table in `docs/security/is66-least-privilege-assessment.md`
with current, post-cutover state._

| Identity | Type | Environment | Role/binding | Scope | Purpose | Owner | Privileged? | Status |
|---|---|---|---|---|---|---|---|---|
| `sahni.ps@gmail.com` (masked) | Human | Project-wide | `roles/owner` | Project | Sole project owner/founder-level admin | Project owner | Yes | Unchanged this batch |
| Default Compute Engine SA (`<project-number>-compute@developer.gserviceaccount.com`) | Service account | Project-wide | `roles/editor` | Project | **Still the runtime identity for**: `ist-triage-demo` (web service), all 4 Cloud Run Jobs, Cloud Scheduler invoker targets | Platform/DevOps | Yes | Real over-privilege, cutover for the web-service half only partially complete (soc2 done, demo + jobs pending) |
| `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com` ("IST Health Cloud Run runtime") | Service account | soc2 only | `roles/cloudsql.client` (project) + `secretmanager.secretAccessor` (3 soc2 secrets, resource-scoped) | Scoped to soc2's own DB connectivity + its own 3 secrets | **Now the live runtime identity for `ist-triage-soc2`** (cut over 2026-08-06) | Platform/DevOps | No (narrowly scoped) | **Cutover complete for soc2**; tracked in Terraform |
| `ci-drift-detector@triage-502706.iam.gserviceaccount.com` | Service account (WIF, keyless) | Project-wide (read-only) | `roles/iam.securityReviewer`, `roles/cloudsql.viewer`, `roles/viewer` | Project | Weekly CI drift-detection (`terraform plan`, read-only) | DevOps/CI | No (read-only) | Unchanged; minor `viewer`/`securityReviewer` redundancy flagged, not remediated |
| `1096520215793@cloudbuild.gserviceaccount.com` | Service account (GCP-provisioned) | Project-wide | `roles/cloudbuild.builds.builder` | Project | Cloud Build execution | GCP-managed | Standard | Unchanged, out of scope |
| `firebase-adminsdk-fbsvc@...` | Service account (GCP-provisioned) | Project-wide | `roles/iam.serviceAccountTokenCreator`, Firebase service-agent roles | Project | Firebase Hosting deploys | GCP-managed | Standard | Unchanged, out of scope |
| Various `*.serviceAgent` accounts | Service accounts (GCP-provisioned) | Project-wide | Each API's own agent role | Project | Auto-created by GCP when each API is enabled | GCP-managed | Not human-controlled | Unchanged, out of scope |

## Changes this batch

- `ist-triage-cloudrun-sa` moved from "dormant, cutover-ready" to
  **"live runtime identity for `ist-triage-soc2`."**
- No other identity's role bindings changed.

## Still pending (explicitly not done this batch)

1. Cut over `ist-triage-demo` (customer-facing) to `ist-triage-cloudrun-sa`
   - requires its own explicitly-approved deployment window.
2. Create a **separate**, narrower SA for `generate-monthly-sli-report-
   soc2` (needs `roles/monitoring.viewer`, which the web service does not)
   - real finding from Phase 1's permission dependency map.
3. Cut over the remaining 3 Cloud Run Jobs to an appropriate identity
   (either `ist-triage-cloudrun-sa` if their permission needs genuinely
   match, or their own dedicated identity if not - each needs individual
   verification, not a blanket assumption).
4. Only once (1)-(3) are complete and verified: narrow or remove the
   default compute SA's project-wide `roles/editor`.
