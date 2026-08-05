# Key Management Procedure

_Closes Cloud CSQ IS.38 ("maintain key management procedures"). Documents
the real, currently-operating secret-rotation-reminder mechanism, and is
explicit about the one thing it does not cover: encryption-key management
proper, which is entirely GCP-managed for this application's infrastructure._

## Purpose

Defines how application secrets (database credentials, JWT signing
secrets, audit HMAC secrets) are stored, and how rotation is ensured to
never be silently forgotten.

## Scope

Covers the 3 real secrets provisioned for the soc2 environment:
`ist-triage-soc2-database-url`, `ist-triage-soc2-auth-jwt-secret`,
`ist-triage-soc2-audit-hmac-secret` (`terraform/main.tf`).

## Roles and responsibilities

- **DevOps lead**: owns the Secret Manager resources and responds to
  rotation-reminder notifications.
- **Backend eng**: performs the actual rotation (generate new value,
  update the Cloud Run revision, verify, disable the old version).

## Control requirements

1. Every application secret must live in GCP Secret Manager, never
   hardcoded or committed to source control.
2. Every secret must have a defined rotation period with a real reminder
   mechanism - a rotation must never be simply forgotten.
3. Rotating a secret must not cause an outage - the old version stays
   valid until the new one is confirmed working.

## Operating procedure

1. **Storage**: all 3 secrets are provisioned via
   `google_secret_manager_secret` Terraform resources
   (`terraform/main.tf:96,118,134`), injected into the Cloud Run service
   at deploy time via `--set-secrets`, never baked into the container
   image.
2. **Rotation reminder**: each secret has a `rotation { rotation_period =
   "7776000s" }` block (90 days, `terraform/main.tf:103-104`), publishing
   to a real `google_pubsub_topic.secret_rotation_notifications` Pub/Sub
   topic (`terraform/main.tf:86`) when the reminder fires - first
   reminder due 2026-11-02 per `docs/sli-slo-definitions.md`.
3. **Manual rotation on reminder**: DevOps lead generates a new value
   (new DB password via `gcloud sql users set-password`, or a newly
   generated JWT/HMAC secret), updates the Secret Manager secret version,
   redeploys the Cloud Run service with the new version, verifies the
   service is healthy, then disables (not deletes) the prior secret
   version.
4. **What this is NOT**: GCP Secret Manager's rotation feature is a
   *reminder*, not automated rotation - there is no generic mechanism to
   regenerate a database password or signing key on its own. This
   procedure is honest about that: rotation itself remains a manual,
   verified operation each time the reminder fires.

## Encryption-key management (explicitly out of scope for this document)

Cloud SQL's disk-level encryption-at-rest keys and TLS certificate
management are entirely Google Cloud-managed - there is no customer-
managed key (CMEK) currently enabled on the existing Cloud SQL instance
(investigated 2026-08-04: GCP does not support enabling CMEK on an
already-created instance, creation-time only - see `master-compliance-
register.csv` rows IS.33/IS.34 for the full finding). This procedure
covers *application secret* rotation, which is genuinely IST Health's own
responsibility and control; it does not claim to cover encryption-key
management proper, which remains GCP's.

## Review cadence

Reviewed alongside the annual risk-register cadence
(`docs/risk-register-2026-08-04.md`, next review 2026-11-04), and
triggered ad hoc whenever a rotation reminder fires (first: 2026-11-02).

## Approval requirement

Describes an existing, already-operating technical mechanism - no
separate approval gate needed to publish as-is.

## Evidence generated

- `terraform/main.tf` rotation blocks (verified zero-diff against live
  state).
- The Pub/Sub notification itself, once the first reminder fires
  (2026-11-02) - not yet observed, since the 90-day window hasn't
  elapsed.

## Exceptions process

If a rotation reminder is missed or a rotation is delayed past a
reasonable window after the reminder fires, this must be logged in the
next risk-register review rather than silently skipped.

## Related questionnaire IDs

IS.38 (this document). IS.33/IS.34 (CMEK investigation, referenced, not
re-litigated here).

## Related implementation references

- `terraform/main.tf:81-149` (secret resources, rotation config, Pub/Sub
  topic)
- `docs/sli-slo-definitions.md` (secret rotation reminders section)
