# CSQ IS.66 - Least-Privilege and Administrative-Access Assessment

_Executed 2026-08-06. Cloud SQL Auth Proxy: not required for this batch
(pure GCP IAM + application-code review, no database access needed)._

## Phase 1: Literal requirement, decomposed

> "*Confirm whether the supplier ensure hardening of admin workstations
> and Role Based Access Control to enforce the 'least privilege'
> principle*"

This is a genuine **compound** requirement. Decomposed into 6 parts and
mapped to who it actually applies to:

| Part | Applies to | In scope for a code/cloud review? |
|---|---|---|
| 1. Administrative workstation hardening | IST employee laptops/devices | **No** - requires HR/IT/endpoint-management evidence, not derivable from this repository |
| 2. Cloud administrative IAM | GCP human admins, service accounts, CI/CD identities | **Yes** - directly assessable via `gcloud`/Terraform |
| 3. Application RBAC | Application administrators (Control Center roles) | **Yes** - directly assessable via source code and tests |
| 4. Least-privilege enforcement | Both (2) and (3) | **Yes**, for the cloud/app halves only |
| 5. Privileged-access review | Both (2) and (3) | **Yes** for a one-time inventory; **no** recurring process exists |
| 6. Evidence/periodic certification | Both, plus (1) | **Partially** - one-time evidence produced this pass, not a certified recurring program |

**Do not conflate (1) with (2)/(3)**: workstation hardening is an
IST-employee-endpoint control (corporate laptops, EDR, disk encryption)
that has no cloud-IAM or application-RBAC equivalent - it is a distinct,
unverifiable-from-code gap, addressed honestly in Phase 7 below, not
reinterpreted as "the cloud side is hardened so this is covered."

Qatar Airways administrators are not in scope for any part of this
review - QR has no administrative access to this application or its
cloud infrastructure today (confirmed by the existing role model: all
seeded roles are IST/clinical-organization roles, no QR-side account type
exists).

## Phase 2 + 3: Privileged-identity inventory and GCP IAM audit

Real `gcloud projects get-iam-policy triage-502706` output, reviewed in
full (17 role bindings across the project).

| Identity | Type | Role | Scope | Purpose | Privileged? | Assessment |
|---|---|---|---|---|---|---|
| `sahni.ps@gmail.com` | Human (masked: the sole project owner) | `roles/owner` | Project | Primary account holder/founder-level administrator | Yes | Broad, but the **only** human binding on the project - expected for a small team at this stage; recommend a break-glass/emergency-access review once a second trusted admin exists, not urgent to remediate alone |
| `1096520215793-compute@developer.gserviceaccount.com` (default Compute Engine SA) | Service account (GCP-provisioned default) | `roles/editor` | Project | **Currently the actual runtime identity for both live Cloud Run services** (confirmed via `gcloud run services describe`) | Yes | **Real finding, addressed below** - project-wide Editor is far broader than an application runtime needs |
| `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com` ("IST Health Cloud Run runtime") | Service account (purpose-built) | `roles/cloudsql.client` | Project | **Already exists, already scoped, but never actually attached to either live Cloud Run service** and was never tracked in Terraform | No (narrowly scoped) | Real finding, addressed below - this is the intended least-privilege identity, sitting unused |
| `ci-drift-detector@triage-502706.iam.gserviceaccount.com` | Service account (Workload Identity Federation, built for IS.07) | `roles/iam.securityReviewer`, `roles/cloudsql.viewer`, `roles/viewer` | Project | CI drift-detection job (`terraform plan` read-only checks) | No (read-only, no mutation permission - confirmed in the IS.07 batch via a real 403 on a direct mutation attempt) | Minor redundancy: `roles/viewer` and `roles/iam.securityReviewer` overlap in read scope; low-risk, not remediated this pass (removing either risks breaking the drift-detection job's actual read calls without re-verifying each API surface it touches - deferred per "do not remove access without proving the intended operational path") |
| `1096520215793@cloudbuild.gserviceaccount.com` | Service account (GCP-provisioned) | `roles/cloudbuild.builds.builder` | Project | Cloud Build's own build-execution identity | Standard/expected, GCP-managed | Not modified - a standard, product-required binding |
| `firebase-adminsdk-fbsvc@...` | Service account (GCP-provisioned) | `roles/iam.serviceAccountTokenCreator`, `roles/firebase.*ServiceAgent` | Project | Firebase Hosting deployment | Standard/expected | Not modified |
| Various `*.serviceAgent` bindings (`artifactregistry`, `cloudscheduler`, `containerregistry`, `logging`, `pubsub`, `run`) | Service accounts (GCP-provisioned) | Each service's own agent role | Project | Google-managed service agents, auto-created and auto-scoped by each GCP API when first enabled | Not human-controlled | Not in scope - these are Google's own platform-managed identities, not this engagement's to modify |

**Workload Identity Federation**: confirmed already in use for the
`ci-drift-detector` identity (built in the IS.07 batch) - no long-lived
JSON key exists for it. No other WIF principals exist yet.

**Long-lived service-account keys**: none found. `gcloud iam
service-accounts keys list` was checked for `ist-triage-cloudrun-sa` and
`ci-drift-detector` - both show only the implicit Google-managed key,
no user-managed JSON key downloaded. This is real, positive evidence
(no committed credential file, no exportable static key).

**Real finding #1 (addressed this batch): default-compute-SA Editor
role, currently the live runtime identity.** Both `ist-triage-soc2` and
`ist-triage-demo` Cloud Run services run under the default compute SA,
which holds project-wide `roles/editor` - a broad role for an
application runtime. The intended, narrowly-scoped replacement
(`ist-triage-cloudrun-sa`, holding only `roles/cloudsql.client`) already
existed but was **missing the Secret Manager access** the app actually
needs (`DATABASE_URL`, `AUTH_JWT_SECRET`, `AUDIT_HMAC_SECRET` - all
currently only granted to the default compute SA, confirmed via
`gcloud secrets get-iam-policy` on each of the 3 soc2 secrets) and was
**never wired into Terraform** (zero references anywhere in this repo's
`.tf` files before this batch).

**Remediation applied this batch** (`terraform/least_privilege_runtime.tf`,
applied via `terraform apply` - confirmed via a full untargeted
`terraform plan` showing zero drift afterward):
- Added a `data "google_service_account"` reference to the existing
  `ist-triage-cloudrun-sa`, bringing it under Terraform's review for the
  first time.
- Granted it `roles/secretmanager.secretAccessor` on all 3 soc2 secrets
  (additive only - the default compute SA's existing access was **not**
  removed, so this change has zero blast radius to the currently-running
  services).

**Deliberately NOT done this batch**: switching either live Cloud Run
service's `--service-account` to `ist-triage-cloudrun-sa`, and removing
the default compute SA's project-wide `roles/editor`. Both are real
production changes requiring a deployment window, a tested cutover, and
a rollback plan - per the explicit instruction "do not make broad IAM
changes during an active deployment window" and "do not remove access
without proving the intended operational path." The dedicated SA is now
genuinely cutover-ready (has every permission the app currently uses:
`cloudsql.client` + `secretmanager.secretAccessor` on its 3 real
secrets); the actual cutover is the next concrete, low-risk, well-scoped
step - see "Recommended next steps" below.

## Phase 4: Application RBAC review

This engagement has already built and tested, across prior batches, the
real controls this phase asks to confirm - reviewed here rather than
duplicated:

| Control | Status | Evidence |
|---|---|---|
| Role-to-permission mapping, least privilege per role | Real, static baseline + persisted override layer | `roles`/`permissions` in `securityAdmin.ts`, `rolePermissionOverrides` |
| Unauthorized-role denial | Real, tested | `tests/roleUatMatrix.test.ts`, `tests/adminAccessBifurcation.test.ts` |
| PAM elevation for the highest-risk mutations | Real, tested | `requireElevatedPermission`, `tests/pamElevation.test.ts` |
| Cross-organization protection | Real, tested | `tests/tenantScope.test.ts`, `canAccessOrganizationRecord` |
| Durable permission overrides | Real, tested, DB-persisted | `grantPermissionToRole`/`revokePermissionFromRole`, `tests/rolePermissionManagement.test.ts` |
| Session revocation after access removal | Real, tested | `revokeSessionsForUser`/`revokeSessionsForRole`, exercised in `tests/adminAccessBifurcation.test.ts` |
| Audit events for privileged actions | Real, tested | `recordAuditEvent` called at every mutation reviewed |
| Access-removal timing metrics | Real, tested (closed CSQ IS.13 this engagement) | `docs/security/access-revocation-metrics.md` |
| Application-level intrusion detection | Real, tested (closed CSQ AR.21 this engagement) | `docs/security/application-intrusion-detection.md` |

**No new gaps were found in this pass** requiring new tests - the
application-RBAC half of IS.66 is substantively already covered by
controls this engagement built and tested for other rows (IS.13, AR.21,
the PAM/role-permission-management batches). No new test file was added
for Phase 4, per the instruction "add focused tests only for confirmed
gaps" - none were found.

## Phase 5: Service-account key review

- `ist-triage-cloudrun-sa`: no user-managed key, ready for
  attached-identity use (the standard, keyless Cloud Run pattern).
- `ci-drift-detector`: confirmed keyless (Workload Identity Federation),
  built in the IS.07 batch specifically to avoid a long-lived key.
- No `.json` credential file is committed anywhere in this repository
  (confirmed via the existing SBOM/dependency-audit tooling's file scan
  conventions - no service-account key pattern found).
- Secret access is narrowly scoped per-secret (each of the 3 soc2 secrets
  has its own IAM policy, not a blanket "all secrets" grant).

## Phase 6: Remediation summary

| Change | Risk | Status |
|---|---|---|
| Add `ist-triage-cloudrun-sa` to Terraform (previously untracked) | None (read-only data source) | Applied |
| Grant `ist-triage-cloudrun-sa` `secretmanager.secretAccessor` on 3 soc2 secrets | None (additive, existing access untouched) | Applied |
| Cut over live services to `ist-triage-cloudrun-sa` | Medium (real runtime-identity change) | **Not done - recommended next step** |
| Remove default compute SA's project-wide `roles/editor` | Medium-High (could break anything still relying on it, incl. other GCP-managed workflows) | **Not done - only safe after the cutover above is verified** |
| Deduplicate `ci-drift-detector`'s `roles/viewer` vs `roles/iam.securityReviewer` | Low | **Not done this pass** - flagged, not remediated, since removing either without re-verifying every read call the drift job makes risks silently breaking it |

## Phase 7: Administrator-workstation-hardening assessment

**This section is honestly limited to what a code/cloud review can
verify - no HR/IT/endpoint-management system was consulted, and none of
the following is invented from the repository.**

| Control | Classification |
|---|---|
| Managed corporate devices | Requires HR/IT evidence |
| Full-disk encryption | Requires HR/IT evidence |
| Endpoint protection / EDR | Requires HR/IT evidence |
| OS patching | Requires HR/IT evidence |
| Screen lock | Requires HR/IT evidence |
| MFA (for workstation/device login, distinct from this application's own MFA) | Requires HR/IT evidence |
| Local-administrator restrictions | Requires HR/IT evidence |
| Device inventory | Requires HR/IT evidence |
| Remote wipe | Requires HR/IT evidence |
| USB controls | Requires HR/IT evidence |
| Antivirus | Requires HR/IT evidence |
| Browser policies | Requires HR/IT evidence |
| Security baseline (e.g. CIS benchmark) | Requires HR/IT evidence |
| Compliance reporting | Requires HR/IT evidence |

**None of these can be verified, documented, or assumed from this
codebase or GCP project.** This is a real, disclosed, unresolved gap -
not something this engagement's cloud/application work can close. Per
the explicit instruction, **IS.66 is retained Partial regardless of the
cloud-IAM improvements above**, precisely because this half of the
compound requirement remains entirely unproven.

## Phase 8: Periodic access review (one-time inventory, not a certified process)

The Phase 2/3 table above **is** this pass's privileged-identity
inventory. Restated in the requested review format:

| Identity | Role | Last-used evidence | Owner | Certification status | Removal recommendation |
|---|---|---|---|---|---|
| `sahni.ps@gmail.com` | `roles/owner` | Active (used to run this batch's own `gcloud`/`terraform` commands) | Project owner | Not certified - this pass is the first review | Retain; establish a recurring review cadence |
| Default compute SA | `roles/editor` (as live runtime identity) | Active (serving real production traffic) | Platform/DevOps | Not certified | Recommend cutover to the dedicated SA, then narrow this role (see Phase 6) |
| `ist-triage-cloudrun-sa` | `roles/cloudsql.client` + (new) `secretmanager.secretAccessor` | Not yet used as a runtime identity (dormant until cutover) | Platform/DevOps | Newly reviewed this pass | Retain and complete the cutover |
| `ci-drift-detector` | `roles/iam.securityReviewer`, `roles/cloudsql.viewer`, `roles/viewer` | Active (weekly CI drift-detection runs, per IS.07) | DevOps/CI | Reviewed this pass, minor redundancy flagged | Retain; consider consolidating `viewer` + `securityReviewer` in a future pass |

**This is explicitly NOT marked as a completed, certified, recurring
privileged-access-review program** - it is a real, one-time inventory and
audit performed this batch. A recurring cadence (e.g. quarterly) would
need to be formally adopted and scheduled separately; that adoption
itself is not done here.

## Recommended next steps (not performed this batch)

1. **Cut over both live Cloud Run services' `--service-account` to
   `ist-triage-cloudrun-sa`**, during a planned deployment window, with a
   canary/staged rollout and an explicit rollback command
   (`gcloud run services update --service-account=<default-compute-sa>`)
   ready before starting.
2. Only after the cutover is verified stable, narrow or remove the
   default compute SA's project-wide `roles/editor`.
3. Obtain real IST HR/IT evidence for the workstation-hardening
   checklist in Phase 7 (the one part of IS.66 this review cannot close).
4. Adopt a recurring (e.g. quarterly) privileged-access review cadence
   formally, rather than the one-time pass performed here.

## IS.66 closure decision

**IS.66 stays Partial.** The cloud-IAM half was genuinely investigated
and improved (a real, previously-untracked over-privilege finding
identified and its narrowly-scoped replacement made cutover-ready,
tracked in Terraform for the first time), and the application-RBAC half
was confirmed already substantively covered by this engagement's own
prior work. It does not move to Yes because: (1) the actual IAM cutover
was deliberately not performed this batch (a real production change
needing its own window), and (2) the administrator-workstation-hardening
half of this compound requirement remains entirely unverifiable from a
code/cloud review and requires real HR/IT evidence this session cannot
obtain or invent.
