# Critical Asset Inventory

_Closes Cloud CSQ PA.08 ("maintain a complete inventory of all of your
critical assets"). Consolidates the real assets of both live
environments into one document - the soc2 environment's inventory is
sourced from Terraform (`terraform/main.tf`, verified zero-diff against
live state); the demo environment is not Terraform-managed (a real,
stated limitation, not glossed over) and its inventory below is sourced
from this engagement's own deployment/handover records._

## soc2 environment (`ist-triage-soc2`) - Terraform-managed

| Asset | Terraform resource | Purpose |
|---|---|---|
| Cloud Run service | `google_cloud_run_v2_service.soc2` | Application runtime |
| Cloud SQL database | `google_sql_database.soc2` | Application data (shared `ist-triage-postgres-uat` instance) |
| Secrets | `google_secret_manager_secret.soc2_database_url`, `soc2_auth_jwt_secret`, `soc2_audit_hmac_secret` | Credentials/signing keys, 90-day rotation reminders |
| Scheduled jobs | `google_cloud_run_v2_job.purge_expired_queue_data`, `access_entitlement_review`, `fulfill_privacy_requests` | Retention purge, quarterly access review, DSAR fulfillment |
| Job triggers | `google_cloud_scheduler_job.purge_expired_queue_data_trigger`, `access_entitlement_review_trigger` | Scheduling for the jobs above |
| Log archive | `google_storage_bucket.log_archive`, `google_logging_project_sink.triage_log_archive` | 1-year log retention |
| Notifications | `google_pubsub_topic.secret_rotation_notifications`, `restore_drill_reminders` | Operational reminders |
| Billing export | `google_bigquery_dataset.billing_export` | Cost tracking |

## Demo environment (`ist-triage-demo`) - not Terraform-managed

| Asset | Identifier | Source |
|---|---|---|
| Cloud Run service | `ist-triage-demo` | `docs/day-handover-2026-07-28.md` |
| Cloud SQL database | `ist_triage_demo` (shared `ist-triage-postgres-uat` instance) | `docs/backup-disaster-recovery-plan.md` |
| Firebase Hosting site | `ist-triage-demo-502706-6a0c5` (`triaged.irisstar.tech`) | `docs/backup-disaster-recovery-plan.md` |
| Secrets | **None** - `DATABASE_URL` is a plain Cloud Run env var, no `AUTH_JWT_SECRET`/`AUDIT_HMAC_SECRET` set | `docs/backup-disaster-recovery-plan.md`, risk-register item R-11 - a known, deliberately-deferred gap |

## Shared infrastructure

| Asset | Identifier |
|---|---|
| Cloud SQL instance | `ist-triage-postgres-uat` (me-central1), serving both environments' databases |
| Cross-region read replica | `ist-triage-postgres-dr-mumbai` (asia-south1) |
| Artifact Registry repo | `ist-triage-repo` (`me-central1-docker.pkg.dev/triage-502706/`) |

## What this document does not cover

- **The demo environment is not managed as infrastructure-as-code** - its
  asset list above is sourced from deployment/handover documentation
  produced during this engagement, not from a live, automatically
  re-verifiable source of truth like Terraform state. Bringing demo
  under Terraform (matching soc2) would close this gap for real; not
  done here since it's a real infrastructure change, not a documentation
  task.
- Physical hardware assets - fully abstracted away by Google Cloud's
  managed platform (see `docs/cloud-shared-responsibility-matrix.md`).

## Review cadence

Reviewed alongside the annual risk-register cadence
(`docs/risk-register-2026-08-04.md`, next review 2026-11-04), or sooner
if a new environment/resource is provisioned.
