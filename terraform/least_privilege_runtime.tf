# CSQ IS.66 ("hardening of admin workstations and Role Based Access
# Control to enforce the 'least privilege' principle") - cloud IAM half.
#
# REAL FINDING (2026-08-06 IS.66 assessment): both live Cloud Run services
# (ist-triage-soc2, ist-triage-demo) run under the GCP default Compute
# Engine service account (`<project-number>-compute@developer.
# gserviceaccount.com`), which this project grants a project-wide
# `roles/editor` binding - a broad, non-least-privilege role for an
# application runtime identity. A dedicated, narrowly-scoped runtime
# service account (`ist-triage-cloudrun-sa@triage-502706.iam.
# gserviceaccount.com`, display name "IST Health Cloud Run runtime")
# already exists and already holds `roles/cloudsql.client` - confirmed via
# `gcloud iam service-accounts describe` and `gcloud projects
# get-iam-policy` - but was created entirely out-of-band (no Terraform
# reference existed anywhere in this repo before this file) and was never
# actually wired to the live Cloud Run services. This file completes the
# missing IAM bindings so the SA is genuinely cutover-ready; it does NOT
# switch the live services' runtime identity (a real production change
# requiring its own deployment window and rollback plan - see
# docs/security/least-privilege-runtime-identity.md for the exact
# remaining cutover steps and why they're deliberately deferred).

data "google_service_account" "cloudrun_runtime" {
  account_id = "ist-triage-cloudrun-sa"
  project    = "triage-502706"
}

# The default compute SA currently holds project-wide secretmanager.
# secretAccessor on all 3 soc2 secrets (confirmed via `gcloud secrets
# get-iam-policy` on each) - these additive grants give the already-
# provisioned, narrowly-scoped runtime SA the same access, without
# removing anything from the currently-in-use default SA (zero blast
# radius to the live services).
resource "google_secret_manager_secret_iam_member" "cloudrun_runtime_database_url" {
  secret_id = google_secret_manager_secret.soc2_database_url.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_service_account.cloudrun_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "cloudrun_runtime_auth_jwt_secret" {
  secret_id = google_secret_manager_secret.soc2_auth_jwt_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_service_account.cloudrun_runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "cloudrun_runtime_audit_hmac_secret" {
  secret_id = google_secret_manager_secret.soc2_audit_hmac_secret.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${data.google_service_account.cloudrun_runtime.email}"
}
