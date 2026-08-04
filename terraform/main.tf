# Infrastructure-as-Code for ist-triage-soc2 (only). Closes the "no IaC"
# gap noted in docs/backup-disaster-recovery-plan.md. Deliberately scoped to
# resources unique to soc2 - it does NOT declare the shared Cloud SQL
# instance (ist-triage-postgres-uat), which also hosts the live demo
# database, since managing a shared resource under one environment's IaC
# risks an accidental `terraform destroy`/drift-correction affecting the
# other environment. The database *inside* that instance (ist_triage_soc2)
# and the Secret Manager secret are soc2-specific and safe to declare here.
#
# This file was built by reading the real, live configuration (via `gcloud
# run services describe`, `gcloud sql databases describe`, etc.) and
# importing each resource with `terraform import`, then confirmed with
# `terraform plan` showing zero diff - it describes actual current state,
# not an aspirational target.

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = "triage-502706"
  region  = "me-central1"
}

data "google_sql_database_instance" "shared" {
  name = "ist-triage-postgres-uat"
}

# Receiving dataset for GCP's standard billing export (NFR-134 cost
# visibility). Creating the dataset is API/Terraform-able; linking it as
# the billing account's export destination is NOT - GCP only exposes that
# one step through the Cloud Billing Console UI (Billing > Billing export),
# requiring the billing account admin to click "Edit settings" once. This
# resource prepares the destination so that one remaining manual step is
# all that's needed - see docs/cost-visibility-setup.md.
resource "google_bigquery_dataset" "billing_export" {
  dataset_id  = "billing_export"
  location    = "me-central1"
  description = "GCP billing export destination for cost visibility (NFR-134)"
}

# Long-term log archive (NFR-127) - a durable copy alongside Cloud
# Logging's own default (shorter) retention window.
resource "google_storage_bucket" "log_archive" {
  name                        = "triage-502706-log-archive"
  location                    = "me-central1"
  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
}

resource "google_logging_project_sink" "triage_log_archive" {
  name        = "ist-triage-log-archive"
  destination = "storage.googleapis.com/${google_storage_bucket.log_archive.name}"
  filter      = "resource.type=\"cloud_run_revision\" AND (resource.labels.service_name=\"ist-triage-demo\" OR resource.labels.service_name=\"ist-triage-soc2\")"
}

resource "google_storage_bucket_iam_member" "log_archive_writer" {
  bucket = google_storage_bucket.log_archive.name
  role   = "roles/storage.objectCreator"
  member = google_logging_project_sink.triage_log_archive.writer_identity
}

resource "google_sql_database" "soc2" {
  name     = "ist_triage_soc2"
  instance = data.google_sql_database_instance.shared.name
}

# Pub/Sub topic Secret Manager notifies when a secret's rotation reminder
# fires (NFR-182: secrets rotation). Notification only, not automated
# rotation - GCP has no generic auto-rotation mechanism for arbitrary
# secret values; this creates the reminder infrastructure so a rotation is
# never simply forgotten, without pretending rotation itself is automated.
resource "google_pubsub_topic" "secret_rotation_notifications" {
  name = "secret-rotation-notifications"
}

resource "google_pubsub_topic_iam_member" "secret_manager_publisher" {
  topic  = google_pubsub_topic.secret_rotation_notifications.name
  role   = "roles/pubsub.publisher"
  member = "serviceAccount:service-1096520215793@gcp-sa-secretmanager.iam.gserviceaccount.com"
}

resource "google_secret_manager_secret" "soc2_database_url" {
  secret_id = "ist-triage-soc2-database-url"

  replication {
    auto {}
  }

  rotation {
    rotation_period    = "7776000s" # 90 days
    next_rotation_time = "2026-11-02T09:04:23Z"
  }
  topics {
    name = google_pubsub_topic.secret_rotation_notifications.id
  }
}

# Discovered during this remediation pass: ist-triage-soc2 previously had NO
# AUTH_JWT_SECRET/AUDIT_HMAC_SECRET set at all, silently running on the
# hardcoded fallback values in src/middleware/auth.ts / src/services/
# safetyKernel.ts (unenforced because MOCK_MODE=true skips the required-env
# check in assertRuntimeConfiguration). Fixed 2026-08-04 with real generated
# secrets.
resource "google_secret_manager_secret" "soc2_auth_jwt_secret" {
  secret_id = "ist-triage-soc2-auth-jwt-secret"

  replication {
    auto {}
  }

  rotation {
    rotation_period    = "7776000s" # 90 days
    next_rotation_time = "2026-11-02T09:04:23Z"
  }
  topics {
    name = google_pubsub_topic.secret_rotation_notifications.id
  }
}

resource "google_secret_manager_secret" "soc2_audit_hmac_secret" {
  secret_id = "ist-triage-soc2-audit-hmac-secret"

  replication {
    auto {}
  }

  rotation {
    rotation_period    = "7776000s" # 90 days
    next_rotation_time = "2026-11-02T09:04:23Z"
  }
  topics {
    name = google_pubsub_topic.secret_rotation_notifications.id
  }
}

resource "google_cloud_run_v2_service" "soc2" {
  name     = "ist-triage-soc2"
  location = "me-central1"

  template {
    service_account = "1096520215793-compute@developer.gserviceaccount.com"

    scaling {
      max_instance_count = 20
    }

    containers {
      image = "me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2:quickwins-20260804"

      env {
        name  = "NODE_ENV"
        value = "production"
      }
      env {
        name  = "MOCK_MODE"
        value = "true"
      }
      env {
        name  = "QUEUE_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "SIMULATE_INCOMING_CALLS"
        value = "false"
      }
      env {
        name  = "APP_ENVIRONMENT"
        value = "demo"
      }
      env {
        name  = "APP_DATA_PROFILE"
        value = "synthetic"
      }
      env {
        name  = "APP_ENVIRONMENT_BANNER_VISIBLE"
        value = "true"
      }
      env {
        name  = "APP_ENVIRONMENT_LABEL"
        value = "SOC2-STAGING"
      }
      env {
        name  = "APP_ENVIRONMENT_DESCRIPTION"
        value = "SOC2 remediation staging environment. Synthetic records only. No PHI."
      }
      env {
        name  = "CLINICAL_CONTENT_SOURCE"
        value = "stcc-licensed"
      }
      env {
        name  = "SESSION_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name = "DATABASE_URL"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.soc2_database_url.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "AUTH_JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.soc2_auth_jwt_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "AUDIT_HMAC_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.soc2_audit_hmac_secret.secret_id
            version = "latest"
          }
        }
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      resources {
        cpu_idle          = true
        startup_cpu_boost = true
      }
    }

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [data.google_sql_database_instance.shared.connection_name]
      }
    }
  }

  # client/client_version/the template's revision name are set by whichever
  # tool last deployed (gcloud CLI vs Terraform) - not meaningful config
  # drift, so they're excluded from plan/apply diffing rather than fought
  # over between deploy paths.
  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].revision,
    ]
  }
}

# --- Scheduled operational jobs (R-04/R-09/R-10) ---
# Both jobs reuse the same soc2 image, overriding command/args to run a
# specific script instead of starting the server. Declared here (rather
# than left as gcloud-only state) for the same reason every other piece of
# this session's infra is in Terraform - a `terraform plan` zero-diff is
# objective proof the config matches reality.
resource "google_cloud_run_v2_job" "purge_expired_queue_data" {
  name     = "purge-expired-queue-data-soc2"
  location = "me-central1"

  template {
    template {
      service_account = "1096520215793-compute@developer.gserviceaccount.com"
      max_retries     = 1
      timeout         = "600s"

      containers {
        image   = "me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2:legal-hold-20260804"
        command = ["node"]
        args    = ["dist/scripts/purgeExpiredQueueData.js"]

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.soc2_database_url.secret_id
              version = "latest"
            }
          }
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [data.google_sql_database_instance.shared.connection_name]
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }
}

resource "google_cloud_run_v2_job" "access_entitlement_review" {
  name     = "access-entitlement-review-soc2"
  location = "me-central1"

  template {
    template {
      service_account = "1096520215793-compute@developer.gserviceaccount.com"
      max_retries     = 1
      timeout         = "300s"

      containers {
        image   = "me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2:ops-scripts-20260804"
        command = ["node"]
        args    = ["scripts/accessEntitlementReview.mjs", "https://triagedsoc2.irisstar.tech"]
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }
}

resource "google_cloud_run_v2_job" "fulfill_privacy_requests" {
  name     = "fulfill-privacy-requests-soc2"
  location = "me-central1"

  template {
    template {
      service_account = "1096520215793-compute@developer.gserviceaccount.com"
      max_retries     = 1
      timeout         = "300s"

      containers {
        image   = "me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2:dsar-fulfillment-20260804"
        command = ["node"]
        args    = ["dist/scripts/fulfillPrivacyRequests.js"]

        env {
          name = "DATABASE_URL"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.soc2_database_url.secret_id
              version = "latest"
            }
          }
        }

        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }

      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [data.google_sql_database_instance.shared.connection_name]
        }
      }
    }
  }

  lifecycle {
    ignore_changes = [client, client_version]
  }
}

# On-demand only (no Cloud Scheduler trigger) - DSAR requests arrive ad hoc,
# driven by a legal/compliance event, not a fixed cadence like the purge or
# access-review jobs above.
resource "google_cloud_run_v2_job_iam_member" "fulfill_privacy_requests_invoker" {
  name     = google_cloud_run_v2_job.fulfill_privacy_requests.name
  location = "me-central1"
  role     = "roles/run.invoker"
  member   = "serviceAccount:1096520215793-compute@developer.gserviceaccount.com"
}

resource "google_cloud_run_v2_job_iam_member" "purge_invoker" {
  name     = google_cloud_run_v2_job.purge_expired_queue_data.name
  location = "me-central1"
  role     = "roles/run.invoker"
  member   = "serviceAccount:1096520215793-compute@developer.gserviceaccount.com"
}

resource "google_cloud_run_v2_job_iam_member" "access_review_invoker" {
  name     = google_cloud_run_v2_job.access_entitlement_review.name
  location = "me-central1"
  role     = "roles/run.invoker"
  member   = "serviceAccount:1096520215793-compute@developer.gserviceaccount.com"
}

resource "google_cloud_scheduler_job" "purge_expired_queue_data_trigger" {
  name        = "purge-expired-queue-data-soc2-trigger"
  region      = "me-central1"
  schedule    = "0 3 * * 0"
  time_zone   = "Etc/UTC"
  description = "Weekly dry-run of the TriageQueueItem retention/purge script (NFR-067/068/069, R-10). Runs in DRY RUN mode only (--execute not passed) until a real retention period is formally approved - see docs/risk-register-2026-08-04.md R-10."

  retry_config {
    retry_count = 0
  }

  http_target {
    uri         = "https://me-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/triage-502706/jobs/${google_cloud_run_v2_job.purge_expired_queue_data.name}:run"
    http_method = "POST"
    oauth_token {
      service_account_email = "1096520215793-compute@developer.gserviceaccount.com"
    }
  }
}

resource "google_cloud_scheduler_job" "access_entitlement_review_trigger" {
  name        = "access-entitlement-review-soc2-trigger"
  region      = "me-central1"
  schedule    = "0 4 1 1,4,7,10 *"
  time_zone   = "Etc/UTC"
  description = "Quarterly access-entitlement review report (NFR-036, CSQ IS.17-19, risk register R-09). Produces a report only - certification/sign-off remains a manual process."

  retry_config {
    retry_count = 0
  }

  http_target {
    uri         = "https://me-central1-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/triage-502706/jobs/${google_cloud_run_v2_job.access_entitlement_review.name}:run"
    http_method = "POST"
    oauth_token {
      service_account_email = "1096520215793-compute@developer.gserviceaccount.com"
    }
  }
}

resource "google_pubsub_topic" "restore_drill_reminders" {
  name = "restore-drill-reminders"
}

resource "google_pubsub_subscription" "restore_drill_reminders_pull" {
  name  = "restore-drill-reminders-pull"
  topic = google_pubsub_topic.restore_drill_reminders.name
}

resource "google_cloud_scheduler_job" "restore_drill_quarterly_reminder" {
  name        = "restore-drill-quarterly-reminder"
  region      = "me-central1"
  schedule    = "0 5 1 1,4,7,10 *"
  time_zone   = "Etc/UTC"
  description = "Quarterly reminder to re-run the backup restore drill (R-06) - a Pub/Sub notification, not an automated drill (the drill itself creates/destroys a real Cloud SQL clone and should stay a deliberate, supervised action)."

  retry_config {
    retry_count = 0
  }

  pubsub_target {
    topic_name = google_pubsub_topic.restore_drill_reminders.id
    data       = base64encode("{\"reminder\":\"Quarterly Cloud SQL PITR restore drill is due. See docs/restore-drill-2026-08-04.md for the procedure. Risk register R-06.\"}")
  }
}
