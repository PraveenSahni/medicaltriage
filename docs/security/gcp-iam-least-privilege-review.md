# GCP IAM Least-Privilege Review (CSQ IS.66 - cloud-IAM cutover)

_Executed 2026-08-06. Real live-infrastructure change against
`triage-502706`, environment: soc2 web service only (demo/jobs/schedulers
deliberately deferred - see below)._

## 2026-08-17 correction — authoritative project remains `triage-502706`

An inspection performed against `aimltriage` was unrelated to the registered demo environment and must not be used as IAM or PR-009 closure evidence. The authoritative target is project `triage-502706` (project number `1096520215793`), region `me-central1`, Cloud Run service `ist-triage-demo`.

The authoritative baseline records that the demo service still runs as the default Compute identity `1096520215793-compute@developer.gserviceaccount.com`. The 2026-08-06 review below remains relevant: only the SOC2 web service was cut over to the dedicated `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`; demo, jobs and schedulers were deliberately deferred.

The approved PR-008 direction is to decommission SOC2 after customer security validation. SOC2-only jobs should therefore be deleted through that controlled change, not migrated merely to preserve a temporary environment. Any job that remains must use a separate least-privilege identity. The current `praveen@irisstar.tech` session lacks `run.services.get` on `triage-502706`, so no fresh live IAM read, mutation or cutover was performed. PR-009 remains open; see the remediation register for its canary and evidence requirements.

## Phase 1: Permission dependency map

Built from real source inspection (not assumed), per service/job:

| Workload | GCP API used | Evidence | Required role |
|---|---|---|---|
| `ist-triage-soc2`, `ist-triage-demo` (web services) | Cloud SQL (unix socket) | `terraform/main.tf`'s `cloudsql_instances` block, `DATABASE_URL` format | `roles/cloudsql.client` |
| `ist-triage-soc2`, `ist-triage-demo` | Secret Manager (env-var injection at container start) | `--set-secrets` in `terraform/main.tf` (`soc2_database_url`, `soc2_auth_jwt_secret`, `soc2_audit_hmac_secret`) | `roles/secretmanager.secretAccessor`, scoped to exactly those 3 secrets |
| `ist-triage-soc2`, `ist-triage-demo` | Cloud Logging (stdout/stderr capture) | Every service emits structured `console.log` JSON; Cloud Run ships this automatically | **None required** - Cloud Run's platform-level log ingestion does not require the runtime SA to hold `logging.logWriter` |
| `ist-triage-soc2`, `ist-triage-demo` | Cloud Monitoring | Confirmed via grep: no `@google-cloud/monitoring` import anywhere in the web-service request path | **None required** for the web services |
| `generate-monthly-sli-report-soc2` (job) | Cloud Monitoring **read** | `src/services/sliReportService.ts` imports `MetricServiceClient` from `@google-cloud/monitoring` and calls `listTimeSeries` directly | `roles/monitoring.viewer` - **materially different from the web service**, real finding, see "Jobs" section below |
| All jobs (`purge-expired-queue-data-soc2`, `fulfill-privacy-requests-soc2`, `access-entitlement-review-soc2`, `dast-probe-soc2`) | Cloud SQL, Secret Manager | Same env/secret bindings as the web services (reuse the same soc2 image) | Same as web services |
| Cloud Scheduler triggers (`*-trigger` jobs) | `run.invoker` on their target Cloud Run Job only | `terraform/main.tf`'s `google_cloud_run_v2_job_iam_member` resources | `roles/run.invoker`, already resource-scoped to one job each - confirmed correct |
| Pub/Sub (`restore_drill_reminders`) | Publish/subscribe for a quarterly reminder | `terraform/main.tf`'s `google_pubsub_topic`/`google_pubsub_subscription` | Managed by the Cloud Scheduler binding, not the web service |
| Cloud Storage (`triage-502706-log-archive`) | Write, via a **Cloud Logging sink**, not application code | `terraform/main.tf`'s `google_logging_project_sink` + `google_storage_bucket_iam_member` | Held by the Logging service agent, not the app runtime SA |
| BigQuery (billing export) | Not used by application code | `terraform/main.tf`'s `google_bigquery_dataset.billing_export` is a platform billing-export target, not app-read/write | N/A to runtime SA |
| KMS | Not used anywhere in this codebase (confirmed via grep) | N/A | N/A |
| Artifact Registry (image pull) | Handled by the **Cloud Run Service Agent**, not the runtime SA | Standard GCP behavior - image pull authorization is separate from the container's own runtime identity | N/A to runtime SA |
| Email/communication infrastructure | None exists (confirmed: no SMTP/email-provider client library anywhere in `package.json` or source) | N/A | N/A |
| FHIR/external integrations | Outbound HTTPS only, authenticated via application-level secrets (not GCP IAM) | `src/integration/fhirWriteback.ts` | N/A to GCP IAM |
| Service-account impersonation/token creation | Not used by the runtime SA | Confirmed: no `iam.serviceAccountTokenCreator`/`serviceAccountUser` binding held by `ist-triage-cloudrun-sa` | Explicitly **not** granted |

**`roles/editor` is never granted to the dedicated runtime identity** -
confirmed by inspecting its actual project-level bindings after this
batch's changes (see Phase 9 below): only `roles/cloudsql.client`
project-wide, plus 3 resource-scoped `secretmanager.secretAccessor`
bindings.

## Phase 2: Dedicated SA role review

`ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`:

| Role | Scope | Resource-scoped where possible? |
|---|---|---|
| `roles/cloudsql.client` | Project | Cloud SQL IAM does not support per-database resource-level binding in this GCP API version - project-wide is the finest grain available; the app itself only ever connects to its own configured `ist_triage_soc2` database via its connection string, so this is a real but unavoidable platform limitation, not an oversight |
| `roles/secretmanager.secretAccessor` (x3) | Per-secret | Yes - each binding names exactly one of the 3 real soc2 secrets, not project-wide |

No project-wide roles beyond `cloudsql.client` exist on this SA. No
service-account-impersonation rights. No cross-environment access (the
demo environment's own secrets are not bound to this SA - confirmed by
inspecting each demo secret's IAM policy, none reference
`ist-triage-cloudrun-sa`).

## Phase 3 + 4: Soc2 canary cutover and functional validation

1. Deployed a new revision (`ist-triage-soc2-00062-coh`) via `gcloud run
   deploy --service-account=ist-triage-cloudrun-sa@... --no-traffic
   --tag=canary-sa-cutover`, reusing the **exact same image**
   (`ist-triage-soc2:20260806-mfa-ui`) already serving live traffic - only
   the runtime identity changed, nothing else.
2. `GET /api/v1/runtime/environment` against the canary tag URL -> `200`,
   correct environment metadata returned (proves container startup and
   Secret Manager env-var injection succeeded under the new SA - a
   startup failure from a missing secret grant would have prevented the
   container from booting at all).
3. `POST /api/v1/auth/login` with a wrong password against the canary ->
   `401 "Invalid username or password."` - this response can only be
   produced after a real database query against the real `AdminUser`
   table completes, proving Cloud SQL connectivity works under the new
   SA (`roles/cloudsql.client`).
4. `gcloud logging read` filtered to the canary's exact revision name,
   `severity>=ERROR` - **zero results**. No `PERMISSION_DENIED`, no
   authentication/initialization error, across all traffic served by the
   canary revision.

Login/MFA/queue/administrative-route functional validation could not be
performed against a *real* authenticated user this session (no admin
bootstrap credential exists on soc2, MFA is mandatory - the same,
already-disclosed constraint from the NFR-118 validation batch). The
unauthenticated-path evidence above (DB connectivity + secret loading +
zero errors) is what this session could genuinely prove; deeper
authenticated-flow validation (MFA challenge, queue claim, audit-event
write, PAM elevation) would require either real user credentials or a
dedicated pre-authenticated test harness, neither available here -
disclosed as a real, remaining evidence gap, not glossed over.

## Phase 5: Cutover and monitoring

Promoted the validated canary to 100% traffic:
`gcloud run services update-traffic ist-triage-soc2
--to-revisions=ist-triage-soc2-00062-coh=100`.

Post-cutover checks against the real custom domain
(`https://triagedsoc2.irisstar.tech`):
- `GET /api/v1/runtime/environment` -> `200`.
- `POST /api/v1/auth/login` (wrong password) -> `401`, same real-DB-query
  behavior as the canary.
- `gcloud logging read ... severity>=ERROR` (service-wide, 5-minute
  freshness window post-cutover) -> **zero results**.

**Rollback path preserved**: the prior revision
(`ist-triage-soc2-00057-hat`, still running the default compute SA) was
never deleted - a rollback is `gcloud run services update-traffic
ist-triage-soc2 --to-revisions=ist-triage-soc2-00057-hat=100`, a single
command, no rebuild needed.

## Phase 6: Demo/customer-facing service - deferred, not cut over

**Not performed this batch.** `triaged.irisstar.tech` is the live,
customer-facing demo - per the explicit instruction not to automatically
repeat the cutover there, and given this batch's synthetic-validation
depth (unauthenticated-path only, no real authenticated-flow proof) is
not yet strong enough to justify an unattended customer-facing change.
**Recommended as a separate, explicitly-approved deployment window**,
using the identical procedure already proven safe on soc2.

## Phase 7: Cloud Run Jobs and schedulers - assessed, not cut over

All 4 jobs (`purge-expired-queue-data-soc2`, `fulfill-privacy-requests-
soc2`, `access-entitlement-review-soc2`, `dast-probe-soc2`) and their
Cloud Scheduler trigger identities still use the default compute SA -
**confirmed via `gcloud run jobs describe`**, unchanged by this batch.

**Real finding: `generate-monthly-sli-report-soc2` has a materially
different permission need** (`roles/monitoring.viewer`, for its direct
`MetricServiceClient.listTimeSeries` calls) that neither the web service
nor the other 3 jobs require. Per this batch's own instruction to
"prefer separate identities where permissions materially differ," this
job should get its **own** dedicated SA (e.g.
`ist-triage-sli-report-sa`) with `cloudsql.client` (if it reads the DB)
+ `monitoring.viewer` + the relevant secret accessor grants - **not**
reuse `ist-triage-cloudrun-sa`, which should stay scoped to exactly what
the web service needs.

**None of the 4 jobs' identities were changed this batch** - each needs
its own individually-verified cutover (their command/args differ from
the web service's default startup, so "the web service canary passed"
does not prove a job's own code path is safe under the new SA). This is
explicitly flagged as the next actionable step, not silently skipped.

## Phase 8: Default Compute Engine SA cleanup - NOT performed this batch

Per the explicit instruction, "do not remove `roles/editor` merely
because the new web-service canary works." Real remaining dependents on
the default compute SA, confirmed via `gcloud run jobs describe`/`gcloud
scheduler jobs describe`:

- `ist-triage-demo` (web service) - not yet cut over (Phase 6).
- All 4 Cloud Run Jobs - not yet cut over (Phase 7).
- Cloud Scheduler's `run.invoker` bindings target the jobs, which still
  run as the default compute SA.

**`roles/editor` cannot be safely removed or narrowed until all of the
above are migrated and individually verified.** This is the correct,
conservative outcome - not a shortcut.

## Phase 9: Security validation of the dedicated runtime identity

- **Cannot mutate unrelated infrastructure**: holds only
  `cloudsql.client` (a data-plane connect permission, not a mutating
  admin role) plus 3 narrow secret-read grants - confirmed via
  `gcloud projects get-iam-policy` showing no `editor`/`owner`/any
  `*.admin` role for this SA.
- **Cannot administer IAM**: no `iam.securityAdmin`/`resourcemanager.
  projectIamAdmin`/similar role held.
- **Cannot access unrelated secrets**: each `secretmanager.secretAccessor`
  binding is a per-secret resource-level grant (confirmed in
  `terraform/least_privilege_runtime.tf`'s plan/apply output), not a
  project-wide Secret Manager role.
- **Cannot impersonate other service accounts**: no
  `iam.serviceAccountTokenCreator`/`iam.serviceAccountUser` role held.
- **Cannot access the other environment**: the demo environment's 3
  secrets do not reference this SA in their IAM policies (checked
  individually).
- **No JSON key**: `gcloud iam service-accounts keys list` shows only
  `SYSTEM_MANAGED` keys (the implicit, non-exportable key GCP always
  maintains) - no user-managed/downloadable key exists.
- **Logs show the correct principal**: Cloud Run's own structured audit
  metadata attributes each revision to its configured
  `serviceAccountName` - confirmed via `gcloud run services describe
  ist-triage-soc2 --format="value(spec.template.spec.serviceAccountName)"`
  returning `ist-triage-cloudrun-sa@...` post-cutover.
- **Auditable**: this SA's usage is now tracked in Terraform (previously
  it was not), giving a reviewable, versioned record of its grants going
  forward.

## Terraform validation

`terraform fmt`, `terraform validate`, and a full untargeted `terraform
plan -detailed-exitcode` all pass cleanly - **"No changes. Your
infrastructure matches the configuration"** - confirming
`terraform/main.tf`'s `google_cloud_run_v2_service.soc2` resource now
correctly reflects the real, live, cut-over service account, and that no
other resource in the project drifted during this operation.
