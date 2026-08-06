# Infrastructure-as-Code Scope (IS.07 coverage statement)

_Written 2026-08-06, alongside the IS.07 drift-detection activation batch._

## What is under Terraform management

`terraform/main.tf` declares the following real, imported resources for the
**soc2 environment only**:

- `google_cloud_run_v2_service.soc2` (`ist-triage-soc2`)
- 5 `google_cloud_run_v2_job` resources (purge-expired-queue-data,
  access-entitlement-review, fulfill-privacy-requests, dast-probe,
  generate-monthly-sli-report) and their `run.invoker` IAM bindings
- `google_cloud_scheduler_job` triggers for the above jobs
- 3 `google_secret_manager_secret` resources (database URL, JWT secret,
  audit HMAC secret) with rotation configuration
- `google_pubsub_topic`/`google_pubsub_subscription` (secret-rotation
  notifications, restore-drill reminders)
- `google_bigquery_dataset.billing_export`
- `google_storage_bucket.log_archive` + its IAM binding and logging sink
- `google_sql_database.soc2` (the database *inside* the shared Cloud SQL
  instance, not the instance itself - see below)

State is stored remotely in `gs://triage-502706-terraform-state/soc2/`
(GCS backend, versioned bucket) - not local, so any CI identity can safely
read/lock it.

## What is explicitly out of scope, and why

| Resource | Managed by | Why excluded |
|---|---|---|
| `ist-triage-postgres-uat` (the shared Cloud SQL **instance**) | Manual/gcloud | Also hosts the live demo database. A `terraform destroy`/drift-correction under soc2's IaC could affect the unrelated demo environment. Declared as a `data` source (read-only) instead, so plan/drift can still observe its config, but Terraform never manages its lifecycle. |
| The entire `demo` environment (`ist-triage-demo`, `triaged.irisstar.tech`) | Manual/gcloud | No Terraform coverage at all today. Out of scope for this IS.07 activation, which is explicitly soc2-only per the compliance instruction. |
| Firebase Hosting (both environments) | Manual/`firebase deploy` | No Terraform provider resource was used for Hosting site/target config in this codebase; Hosting deploys are file-based (`firebase deploy`), not declarative infra in the same sense as Cloud Run. |
| Artifact Registry repository (`ist-triage-repo`) | Manual/gcloud (created once, early in this engagement) | Never brought under Terraform; a static, rarely-changed resource. |
| Cloud SQL Auth Proxy / VPC networking | N/A | No dedicated networking resources exist beyond the default VPC; nothing to declare. |

**Practical consequence for IS.07**: the drift-detection workflow can only
ever prove "no drift" or "drift" for the resources listed in the first
table. It provides **zero** coverage for the demo environment, Firebase
Hosting, or Artifact Registry. This is a real, accepted coverage gap - not
silently omitted. If demo-environment IaC coverage becomes a requirement,
it would need its own `terraform/demo/` root module and a parallel drift
workflow, out of scope for this batch.

## CI identity scope

The `ci-drift-detector@triage-502706.iam.gserviceaccount.com` service
account (Workload Identity Federation, no long-lived key) holds:

- `roles/viewer` (project-level, broad read-only)
- `roles/cloudsql.viewer` (read the shared Cloud SQL instance's config for
  the `data` source)
- `roles/iam.securityReviewer` (read-only `getIamPolicy` across resource
  types - needed because several declared resources are themselves IAM
  bindings, e.g. `google_pubsub_topic_iam_member`,
  `google_storage_bucket_iam_member`, `google_cloud_run_v2_job_iam_member`)
- `roles/storage.objectAdmin`, scoped **only** to
  `gs://triage-502706-terraform-state` (needed for Terraform's GCS backend
  state locking during `plan` - not a project-wide storage grant)

It holds **no** apply-level mutation role on any resource. This was
verified directly: an authenticated mutation attempt using this identity's
own token against the Cloud Run Admin API returned HTTP 403 (see
`docs/operations/infrastructure-drift-detection-runbook.md` for the exact
command and result).
