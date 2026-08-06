# Infrastructure Drift Detection Runbook (IS.07)

_Written 2026-08-06. Activates continuous Terraform drift detection for the
soc2 environment, closing the gap explicitly recorded as blocking IS.07:
"needs a CI credential that doesn't exist."_

## Phase 1 - closure criteria (defined before any change)

IS.07 asks for continuous infrastructure/configuration-drift detection.
Read literally, it requires:

- **Infrastructure drift detection** - yes, this is the core ask.
- **Scheduled scanning** - yes (daily cron, plus on every `terraform/**`
  push to `main`, plus manual `workflow_dispatch`).
- **Alerting** - yes (a deduplicated GitHub issue per unresolved drift).
- **Evidence retention** - yes (sanitized plan artefact, 90-day retention;
  the GitHub issue itself is a durable record).
- **Review and approval before remediation** - yes (documented process
  below; the workflow never applies automatically).
- **Configuration monitoring** - satisfied as a byproduct of drift
  detection (the plan diff *is* the configuration-monitoring signal here).
- **Automated remediation** - **not required and not built.** The
  compliance instruction for this batch explicitly says not to build
  automatic remediation unless the requirement demands it; IS.07 does not.
- **Customer reporting (Qatar Airways)** - kept pending. No authorized
  external recipient/channel exists yet for this row; only internal
  GitHub-issue alerting is wired up.

**IS.07 moves to Yes only if**: CI authentication is operational, the
workflow runs successfully end to end, scheduled execution is enabled in
the committed workflow file, a real controlled drift was actually detected
by the pipeline, alerting/evidence worked, the drift was remediated, and a
final clean run succeeded - all proven below, not asserted.

## Phase 2 - what was found (real, not assumed)

- `terraform/main.tf` already existed, declaring the soc2-only resource set
  (see `docs/architecture/infrastructure-as-code-scope.md`). Its state was
  **local-only** (`terraform/terraform.tfstate`) - no CI identity could
  ever safely use it.
- `.github/workflows/` had 3 workflows (`ci.yml`, `codeql.yml`,
  `performance-test.yml`), **none** authenticating to GCP.
- No Workload Identity Federation pool/provider/service account existed
  anywhere in the project.
- The shared Cloud SQL instance and the entire demo environment are
  intentionally NOT under Terraform - see the scope doc for why.

## Phase 3 - CI authentication (built this batch, real GCP resources)

All created directly against project `triage-502706`:

| Resource | Value |
|---|---|
| Terraform state bucket | `gs://triage-502706-terraform-state` (`me-central1`, versioned, uniform bucket-level access) |
| Service account | `ci-drift-detector@triage-502706.iam.gserviceaccount.com` |
| Workload Identity Pool | `github-actions` (location `global`) |
| Workload Identity Provider | `github-actions-drift`, issuer `https://token.actions.githubusercontent.com`, attribute condition `assertion.repository=='PraveenSahni/medicaltriage'` - only OIDC tokens asserting this exact repository can ever exchange for a GCP credential |
| IAM binding | `roles/iam.workloadIdentityUser` on the service account, restricted to `principalSet://iam.googleapis.com/projects/1096520215793/locations/global/workloadIdentityPools/github-actions/attribute.repository/PraveenSahni/medicaltriage` |

**Granted roles (documented, why each is needed)**:

| Role | Scope | Why |
|---|---|---|
| `roles/viewer` | Project | Broad read of the Cloud Run/Pub/Sub/BigQuery/Scheduler/Storage/Secret Manager resources `terraform plan` needs to read |
| `roles/cloudsql.viewer` | Project | Reads the shared Cloud SQL instance (a `data` source in `main.tf`) |
| `roles/iam.securityReviewer` | Project | Read-only `getIamPolicy` across resource types - needed because several declared resources are IAM-binding resources (`google_pubsub_topic_iam_member`, `google_storage_bucket_iam_member`, `google_cloud_run_v2_job_iam_member`); `roles/viewer` alone does not include `getIamPolicy` for Pub/Sub topics or Storage buckets (confirmed by a real 403 during validation, see below) |
| `roles/storage.objectAdmin` | **Bucket-scoped**, `gs://triage-502706-terraform-state` only (not project-wide) | Terraform's GCS backend needs read+write+lock on the state object itself, even for `plan` |

**No apply-level mutation role was granted anywhere.** Verified directly:
authenticating as this identity and issuing a real `PATCH` against the
Cloud Run Admin API (attempting to set a label on `ist-triage-soc2`)
returned `403` (`apply_attempt_http_status=403`) - confirmed 2026-08-06
during this batch's validation run.

Branch/schedule restriction note: GitHub only fires `schedule` events from
the workflow file as committed on the repository's default branch, and
`workflow_dispatch` requires the operator to explicitly pick a branch - the
provider's repository-level attribute condition, combined with these
GitHub-side trigger semantics, is the real restriction in place. A finer
per-branch WIF condition was not layered on top (documented as a known,
accepted scope limit).

## Phase 4 - the workflow

`.github/workflows/infra-drift-detection.yml`:

1. Checks out the exact branch.
2. Authenticates via `google-github-actions/auth@v2` using WIF (no JSON
   key).
3. Installs Terraform 1.14.9 (pinned, matches `.terraform.lock.hcl`).
4. `terraform fmt -check`, `terraform init`, `terraform validate`.
5. `terraform plan -detailed-exitcode -no-color -out=drift.tfplan`.
6. Interprets the exit code: 0 = clean, 2 = drift, 1 = workflow/Terraform
   error (job fails loudly, distinct from a drift alert).
7. Sanitizes the plan's text output (redacts any `secret`/`token`/
   `password`/`key`-named field's value) before it ever leaves the runner,
   uploads it as a 90-day-retention artefact. The binary `.tfplan` file
   itself is never uploaded.
8. On drift (exit 2): opens a GitHub issue labeled `infra-drift,soc2`, or
   comments on the existing open one instead of opening a duplicate
   (deduplication), then fails the job so it's visible in CI status.
9. Never runs `terraform apply` - there is no apply step in this workflow
   at all.

Triggers: `schedule` (daily 03:00 UTC), `push` to `main` touching
`terraform/**`, and manual `workflow_dispatch`.

## Drift classification (applied during this batch's real run)

The very first `terraform plan` run against soc2 (before any synthetic
test) returned **exit code 2** - real, pre-existing drift, not
synthetic:

- The deployed Cloud Run image tag was `...soc2:20260806-mfa-ui`, while
  `main.tf` still declared `...soc2:quickwins2-20260804`.
- 8 real env vars (`MFA_MANDATORY`, `MFA_DB_PERSISTENCE`,
  `AUDIT_EVENT_DB_PERSISTENCE`, `ROLE_PERMISSION_DB_PERSISTENCE`,
  `REVEAL_WORKFLOW_DB_PERSISTENCE`, `REVEAL_ANOMALY_DB_PERSISTENCE`,
  `PRIVACY_NOTIFICATION_ENABLED`, `PRIVACY_NOTIFICATION_DRY_RUN`) existed
  on the real deployed service but not in `main.tf`.

**Classification**: expected configuration not yet reflected in IaC - every
one of these was added via a legitimate `gcloud run deploy
--update-env-vars` during this engagement's own prior feature batches
(MFA, audit, role-permission, reveal-workflow, and privacy-notification
work), and simply never back-filled into Terraform. Not an unauthorized
change.

**Remediation applied**: updated `main.tf`'s `image` value and added the 8
missing `env` blocks (in the exact real order confirmed via `gcloud run
services describe`, since Cloud Run v2's `env` blocks are matched
positionally, not by name - getting the order wrong produces a false
rename diff, which was caught and corrected during this batch). Re-ran
`terraform plan`: **exit 0, "No changes."**

## Alerting

The workflow opens a GitHub issue (label `infra-drift,soc2`) containing:
environment, workflow run URL, detection time, and step-by-step
remediation instructions (see the workflow file's `github-script` step for
the exact template). A second drift detection while an issue is still open
adds a comment to the existing issue instead of opening a duplicate.

No secret values are ever included - the alert body is static template
text plus run metadata, never plan content.

Qatar Airways / external customer notification for this row is **not**
wired up - no authorized external recipient exists yet. This portion is
explicitly left pending per the compliance instruction's own guidance.

## Remediation process (documented workflow, followed once for real above)

1. Review the sanitized plan artefact from the failed/drifted run.
2. Classify (expected / unauthorized / provider noise / state
   inconsistency / import gap / workflow error).
3. If expected: update `terraform/main.tf` to match reality.
4. If unauthorized: revert the manual change out of band, or hold for
   review before importing it into Terraform - never silently normalize an
   unauthorized change into config without review.
5. Peer review the `main.tf` diff (standard PR review - branch protection
   already requires CI to pass before merge, per prior-session work).
6. Approved `terraform apply` (run manually by an authorized operator - not
   part of this workflow).
7. Re-run the drift workflow (`workflow_dispatch`) to confirm exit 0.
8. Close the drift-alert issue, referencing the clean re-run.

## Tests / validation performed against real soc2 infrastructure

All of the following were run for real, this batch, against project
`triage-502706`:

| Test | Result |
|---|---|
| `terraform fmt -check -diff` | Clean, no diff |
| `terraform validate` | `Success! The configuration is valid.` |
| Clean no-drift run (after reconciling real drift, as the genuine `ci-drift-detector` identity) | Exit 0, "No changes." |
| CI identity lacks apply-level mutation permission | Direct `PATCH` to Cloud Run Admin API using the identity's own token → HTTP 403 |
| Controlled, reversible synthetic drift (`scaling.max_instance_count`: 20 → 21 via `gcloud run services update --max-instances=21`, out of band) | `terraform plan` (as the CI identity) → **exit 2**, diff showed exactly `max_instance_count = 21 -> 20` |
| Revert synthetic drift (`--max-instances=20`) + re-run | **Exit 0**, "No changes." - environment returned to a clean state |
| State locking / remote backend | Migrated from local state to the new GCS backend (`terraform init -migrate-state`); confirmed the state object exists at `gs://triage-502706-terraform-state/soc2/default.tfstate` |
| Provider lockfile | `.terraform.lock.hcl` unchanged, already pinned to `hashicorp/google ~> 5.0` |

**Not literally executable in this batch (disclosed limitation)**: the
instruction for this batch says not to push. GitHub's `schedule` trigger
only fires for a workflow file that exists on the repository's default
branch, and `workflow_dispatch` requires the workflow to already be present
on GitHub - so a literal GitHub Actions run of this workflow cannot happen
until this commit is pushed and merged. Every step the workflow performs
was instead validated for real, directly against soc2, using the exact
same identity (`ci-drift-detector`, via genuine WIF-less-but-equivalent
service-account impersonation locally, exercising the same IAM bindings the
real WIF exchange would produce) and the exact same `terraform` commands
the workflow file runs. This is the closest possible operational proof
without pushing, but it is not the same as a real GitHub Actions execution
log. Duplicate-alert handling, incorrect-branch/incorrect-repository
authentication rejection, and "multiple environments cannot be confused"
were reasoned through and configured correctly (attribute condition,
concurrency group, hardcoded `soc2` prefix/labels) but likewise not
observed as a live GitHub Actions run.

## Coverage limitations (see also the architecture-scope doc)

- Only the soc2 resources declared in `terraform/main.tf` are covered. The
  demo environment, Firebase Hosting, and Artifact Registry have zero
  drift-detection coverage.
- The shared Cloud SQL **instance** is read-only (`data` source) - drift on
  its own configuration would show up in a plan diff, but Terraform cannot
  and must not remediate it under soc2's IaC.
- No per-branch WIF restriction beyond the repository-level attribute
  condition (see Phase 3 note).

## IS.07 status

**Remains Partial, not Yes - by the compliance instruction's own explicit
rule**: "If the workflow is implemented but credentials or schedule remain
inactive, retain Partial."

Everything that can be proven without pushing has been proven for real:
CI authentication is genuinely operational (real WIF pool/provider/service
account, real IAM enforcement including a real 403 on a mutation attempt),
a real pre-existing drift was found on live soc2 infrastructure and
reconciled, a real controlled synthetic drift was detected (exit 2) and
reverted (exit 0), and the workflow file itself is fully written and
locally validated (YAML structure, `terraform fmt`/`validate`).

But the **schedule is not literally active**: GitHub only executes a
`schedule` trigger for a workflow file that exists on the repository's
default branch, and `workflow_dispatch` requires the workflow to already
be present on GitHub. Since this batch is explicitly instructed not to
push, the cron trigger in the committed file cannot fire, and no real
GitHub Actions run of this workflow has occurred or can occur yet. That is
exactly the "schedule remains inactive" condition the instruction calls
out - so IS.07 stays Partial pending a push/merge that activates the
schedule and produces at least one real GitHub Actions execution log.
