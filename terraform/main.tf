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

resource "google_sql_database" "soc2" {
  name     = "ist_triage_soc2"
  instance = data.google_sql_database_instance.shared.name
}

resource "google_secret_manager_secret" "soc2_database_url" {
  secret_id = "ist-triage-soc2-database-url"

  replication {
    auto {}
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
