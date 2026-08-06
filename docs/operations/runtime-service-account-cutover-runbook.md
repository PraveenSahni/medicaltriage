# Runtime Service-Account Cutover Runbook (CSQ IS.66)

_Established 2026-08-06 from the real soc2 cutover performed this batch.
Reuse this exact procedure for the deferred demo/jobs cutovers._

## Preconditions

- The target dedicated service account exists, is tracked in Terraform,
  and holds exactly the roles the workload's real permission-dependency
  map requires (see `docs/security/gcp-iam-least-privilege-review.md`
  Phase 1 for the methodology).
- A rollback revision (the currently-serving one) will **not** be deleted
  until the cutover is independently confirmed stable.
- Confirm via `gcloud run services describe <service>
  --format="value(spec.template.spec.containers[0].image)"` that you
  will redeploy the **exact same image** - a service-account cutover
  should never be bundled with an application code change, so a
  regression can be attributed unambiguously to the identity change.

## Procedure (used for `ist-triage-soc2`, 2026-08-06)

1. **Canary deploy, 0% traffic**:
   ```
   gcloud run deploy <service> --project=<project> --region=<region> \
     --image=<the exact currently-serving image> \
     --service-account=<dedicated-sa>@<project>.iam.gserviceaccount.com \
     --no-traffic --tag=<canary-tag>
   ```
2. **Health check** the tagged canary URL:
   `curl <tag>---<service>-<hash>.<region>.run.app/api/v1/runtime/environment`
   -> expect `200` with correct environment metadata (proves container
   boot + secret injection succeeded).
3. **Database-connectivity check** (unauthenticated-safe): a login
   attempt with a wrong password against the canary URL -> expect a real
   `401 "Invalid username or password."`, which can only be produced
   after a real DB query completes.
4. **Error-log check**:
   ```
   gcloud logging read 'resource.type="cloud_run_revision" AND
   resource.labels.revision_name="<canary-revision>" AND severity>=ERROR'
   --freshness=10m
   ```
   -> expect zero results.
5. **Promote to 100%** only if steps 2-4 are all clean:
   ```
   gcloud run services update-traffic <service> \
     --to-revisions=<canary-revision>=100
   ```
6. **Post-cutover verification** against the real custom domain (not just
   the tag URL) - repeat steps 2-4 against the production hostname.
7. **Update Terraform** (`service_account = ...`) to match the real,
   now-live state, then `terraform plan -detailed-exitcode` to confirm
   zero drift.
8. **Preserve rollback**: do not delete the prior revision. Rollback is a
   single `gcloud run services update-traffic --to-revisions=<prior>=100`
   command.

## What this runbook does NOT cover

- **Authenticated-flow validation** (real login, MFA, queue claim, audit-
  event write, PAM elevation) - this requires either real user
  credentials or a dedicated pre-authenticated test harness, neither of
  which existed for this batch's soc2 cutover. This is a real, disclosed
  evidence gap - a future cutover (e.g. the deferred demo/jobs work)
  should either obtain synthetic test credentials safely or perform this
  validation through the application's own Playwright e2e suite pointed
  at the canary tag URL.
- **Cloud Run Jobs** - a job's command/args differ from a web service's
  default startup, so a web-service canary passing does **not** prove a
  job's own code path is safe under a new identity. Each job needs its
  own individual canary-equivalent (a manual `gcloud run jobs execute`
  against a temporarily-retagged job, observed for errors, before
  updating its scheduled trigger).

## Reuse for the deferred cutovers

| Target | Status | Blocker |
|---|---|---|
| `ist-triage-soc2` | **Done** (this batch) | - |
| `ist-triage-demo` (customer-facing) | Deferred | Requires an explicitly-approved deployment window (customer-facing risk) |
| `generate-monthly-sli-report-soc2` | Deferred | Needs its own dedicated SA (real `roles/monitoring.viewer` requirement not shared by the web service) |
| `purge-expired-queue-data-soc2`, `fulfill-privacy-requests-soc2`, `access-entitlement-review-soc2`, `dast-probe-soc2` | Deferred | Each needs individual verification via `gcloud run jobs execute` before its scheduler trigger is repointed |
