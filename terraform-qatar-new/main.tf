# Infrastructure-as-Code for the ist-triage-qatar-new GCP project - a fresh,
# standalone environment separate from triage-502706 (see ../terraform/,
# which is scoped only to soc2 resources inside that other project).
#
# Built by reading the real, live configuration (via `gcloud run services
# describe`, `gcloud sql instances describe`, etc. against this project) and
# importing each resource with `terraform import`, then confirmed with
# `terraform plan` showing zero diff - it describes actual current state,
# not an aspirational target.
#
# Deliberately out of scope for this first pass (documented, not silently
# skipped): the scheduled operational jobs (purge/DSAR/access-review/DAST/
# SLI-report), log archive bucket, billing export dataset, and secret
# rotation reminders that terraform/main.tf declares for triage-502706's
# soc2 service. Those are real hardening opportunities for this project too,
# just not yet built here.

terraform {
  required_version = "~> 1.14.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Remote state (matches the pattern in ../terraform/main.tf) - state lives
  # in GCS, not on a contributor's laptop, with native lock-on-write and
  # object versioning for recovery from a bad write.
  backend "gcs" {
    bucket = "ist-triage-qatar-new-terraform-state"
    prefix = "root"
  }
}

# access_token here (rather than requiring `gcloud auth application-default
# login`, which needs an interactive browser flow) - refresh with
# `gcloud auth print-access-token` if a plan/apply is run more than ~1 hour
# after the token was generated.
variable "gcp_access_token" {
  type      = string
  sensitive = true
}

provider "google" {
  project      = "ist-triage-qatar-new"
  region       = "me-central1"
  access_token = var.gcp_access_token
}

variable "project_id" {
  type    = string
  default = "ist-triage-qatar-new"
}

variable "region" {
  type    = string
  default = "me-central1"
}

# --- APIs ---
# Modeled as resources (not just assumed-enabled) so `terraform plan` is the
# source of truth for what this project actually depends on.
resource "google_project_service" "enabled" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "servicenetworking.googleapis.com",
  ])

  project            = var.project_id
  service            = each.value
  disable_on_destroy = false
}

# --- Artifact Registry ---
resource "google_artifact_registry_repository" "ist_triage_repo" {
  repository_id = "ist-triage-repo"
  location      = var.region
  format        = "DOCKER"
  description   = "IST Triage container images"
}

# --- Cloud SQL ---
resource "google_sql_database_instance" "ist_triage_postgres" {
  name             = "ist-triage-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = "db-custom-1-3840"
    availability_type = "ZONAL"

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      transaction_log_retention_days = 7
    }

    ip_configuration {
      ipv4_enabled = true
    }

    disk_autoresize = true
    disk_size       = 20
    disk_type       = "PD_SSD"
  }

  deletion_protection = true
}

resource "google_sql_database" "ist_triage" {
  name     = "ist_triage"
  instance = google_sql_database_instance.ist_triage_postgres.name
}

resource "google_sql_user" "triage_user" {
  name     = "triage_user"
  instance = google_sql_database_instance.ist_triage_postgres.name
  # Password is managed out-of-band (set once via `gcloud sql users create`,
  # rotated manually) - Terraform should not hold the live DB password in
  # state. See DATABASE_URL in Secret Manager for the actual connection
  # string.
  password = "unmanaged-see-secret-manager"

  lifecycle {
    ignore_changes = [password]
  }
}

# --- Runtime service account (least privilege) ---
resource "google_service_account" "cloudrun_runtime" {
  account_id   = "ist-triage-cloudrun-sa"
  display_name = "IST Triage Cloud Run runtime"
  description  = "Least-privilege runtime identity for ist-triage Cloud Run services"
}

resource "google_project_iam_member" "cloudrun_runtime_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloudrun_runtime.email}"
}

resource "google_project_iam_member" "cloudrun_runtime_log_writer" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloudrun_runtime.email}"
}

resource "google_project_iam_member" "cloudrun_runtime_metric_writer" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloudrun_runtime.email}"
}

# Cloud Build's default compute service account needs these two roles in a
# fresh project - neither exists by default, and both were discovered the
# hard way (a `gcloud builds submit` failure) during this project's initial
# setup. See docs/local-system-administration-review.md for the narrative.
resource "google_project_iam_member" "cloudbuild_compute_storage_viewer" {
  project = var.project_id
  role    = "roles/storage.objectViewer"
  member  = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

resource "google_project_iam_member" "cloudbuild_compute_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${data.google_project.current.number}-compute@developer.gserviceaccount.com"
}

data "google_project" "current" {
  project_id = var.project_id
}

# --- Secrets (containers only - values are set out-of-band via `gcloud
# secrets versions add`, never held in Terraform state) ---
resource "google_secret_manager_secret" "auth_jwt_secret" {
  secret_id = "AUTH_JWT_SECRET"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "audit_hmac_secret" {
  secret_id = "AUDIT_HMAC_SECRET"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "database_url" {
  secret_id = "DATABASE_URL"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "audit_database_url" {
  secret_id = "AUDIT_DATABASE_URL"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "mfa_encryption_key" {
  secret_id = "MFA_ENCRYPTION_KEY"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "admin_password" {
  secret_id = "ADMIN_PASSWORD"
  replication {
    auto {}
  }
}

locals {
  runtime_secrets = {
    AUTH_JWT_SECRET    = google_secret_manager_secret.auth_jwt_secret.secret_id
    AUDIT_HMAC_SECRET  = google_secret_manager_secret.audit_hmac_secret.secret_id
    DATABASE_URL       = google_secret_manager_secret.database_url.secret_id
    AUDIT_DATABASE_URL = google_secret_manager_secret.audit_database_url.secret_id
    MFA_ENCRYPTION_KEY = google_secret_manager_secret.mfa_encryption_key.secret_id
    ADMIN_PASSWORD     = google_secret_manager_secret.admin_password.secret_id
  }
}

resource "google_secret_manager_secret_iam_member" "runtime_secret_access" {
  for_each  = local.runtime_secrets
  secret_id = each.value
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_runtime.email}"
}

# --- Cloud Run services ---
# Each service shares the same image/secrets/DB, differing only in the
# environment/banner metadata (matches the pattern documented in README.md
# for ist-triage-simulation/ist-triage-demo, extended here with a third
# ist-triage-soc2 service mirroring the original triage-502706 project's
# three-environment structure).
locals {
  services = {
    ist-triage-simulation = {
      app_environment = "demo"
      data_profile    = "synthetic"
      banner_label    = "SIMULATION"
    }
    ist-triage-demo = {
      app_environment = "demo"
      data_profile    = "curated-demo"
      banner_label    = "DEMO"
    }
    ist-triage-soc2 = {
      app_environment = "demo"
      data_profile    = "synthetic"
      banner_label    = "SOC2"
    }
  }
}

resource "google_cloud_run_v2_service" "triage" {
  for_each = local.services

  name     = each.key
  location = var.region

  template {
    service_account = google_service_account.cloudrun_runtime.email

    scaling {
      max_instance_count = 20
    }

    containers {
      image = "me-central1-docker.pkg.dev/${var.project_id}/ist-triage-repo/ist-triage:latest"

      resources {
        cpu_idle          = true
        startup_cpu_boost = true
        limits = {
          memory = "1Gi"
          cpu    = "1"
        }
      }

      env {
        name  = "MOCK_MODE"
        value = "true"
      }
      env {
        name  = "APP_ENVIRONMENT"
        value = each.value.app_environment
      }
      env {
        name  = "APP_DATA_PROFILE"
        value = each.value.data_profile
      }
      env {
        name  = "APP_ENVIRONMENT_LABEL"
        value = each.value.banner_label
      }
      env {
        name  = "APP_ENVIRONMENT_BANNER_VISIBLE"
        value = "true"
      }
      env {
        name  = "CCP_TRANSPORT_MODE"
        value = "dry-run"
      }
      env {
        name  = "FHIR_WRITEBACK_MODE"
        value = "dry-run"
      }
      env {
        name  = "CLINICAL_CONTENT_SOURCE"
        value = "stcc-licensed"
      }
      env {
        name  = "QUEUE_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "SESSION_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "MFA_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "AUDIT_EVENT_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "ROLE_PERMISSION_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "REVEAL_WORKFLOW_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "REVEAL_ANOMALY_DB_PERSISTENCE"
        value = "true"
      }
      env {
        name  = "SECURITY_ANOMALY_DB_PERSISTENCE"
        value = "true"
      }

      dynamic "env" {
        for_each = local.runtime_secrets
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
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
        instances = [google_sql_database_instance.ist_triage_postgres.connection_name]
      }
    }
  }

  # Whoever last deployed (gcloud CLI vs Terraform) sets these - not
  # meaningful config drift, so excluded from plan/apply diffing rather than
  # fought over between deploy paths (same pattern as ../terraform/main.tf).
  lifecycle {
    ignore_changes = [
      client,
      client_version,
      template[0].revision,
    ]
  }

  depends_on = [google_secret_manager_secret_iam_member.runtime_secret_access]
}

resource "google_cloud_run_v2_service_iam_member" "public_invoker" {
  for_each = local.services

  name     = google_cloud_run_v2_service.triage[each.key].name
  location = var.region
  role     = "roles/run.invoker"
  member   = "allUsers"
}

output "service_urls" {
  value = { for name, svc in google_cloud_run_v2_service.triage : name => svc.uri }
}
