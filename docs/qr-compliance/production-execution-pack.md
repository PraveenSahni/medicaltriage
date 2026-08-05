# Production Execution Pack

_Generated 2026-08-05. Rows where the control is technically ready but
a real production action (deployment, configuration change, credential
provisioning) has not yet been performed. This pass had no production
credentials scope beyond what was already routinely used this
engagement - each item below states exactly what access is missing._

## NFR-189 - QR monthly SLI/SLO reporting activation

**Recipient information required**: a real, QR-designated recipient
email address for monthly SLI/SLO reports. Deliberately not hardcoded
anywhere in this codebase or infrastructure config by design - no
customer email exists to leak or misconfigure against.

**Sender configuration required**:
- `SLI_REPORT_RECIPIENT_EMAIL` set as a Cloud Run Job env var or
  Secret Manager secret once the real recipient is known.
- Real `MS_GRAPH_*` live-mode secrets confirmed configured for the
  `ist-triage-soc2` environment (the existing `getEmailAdapter()`
  integration already used by every other email-sending feature in
  this app).
- `SLI_REPORT_DRY_RUN` set to `"false"` (currently defaults to
  `"true"` - a safe default that prevents any accidental real send).

**Approval required**: sign-off from the Executive Sponsor/Product
Owner to actually begin sending real monthly reports to a named QR
contact (this is a customer-facing communication, not a reversible
internal config change once the first real email sends).

**Safe test-delivery plan**:
1. Confirm the real recipient address with QR in writing first (avoid
   sending to an unconfirmed address).
2. Run `npx tsx src/scripts/generateMonthlySliReport.ts --dry-run`
   against the real recipient config to preview the exact report
   content without sending.
3. Optionally send one real test email to an **internal** IST address
   first (temporarily set `SLI_REPORT_RECIPIENT_EMAIL` to an internal
   address, `SLI_REPORT_DRY_RUN=false`, run once, confirm delivery and
   content).
4. Only then switch `SLI_REPORT_RECIPIENT_EMAIL` to the real QR
   address.

**Production activation steps**:
1. Obtain real QR recipient email (see Qatar Airways Input Pack).
2. Configure `SLI_REPORT_RECIPIENT_EMAIL` (Secret Manager, following
   the existing secret-management pattern used for `DATABASE_URL`
   etc.).
3. Confirm `MS_GRAPH_*` live secrets are present for `ist-triage-soc2`.
4. Set `SLI_REPORT_DRY_RUN=false` on the Cloud Run Job's env vars
   (`terraform apply -target=google_cloud_run_v2_job.generate_monthly_sli_report`).
5. Run the safe test-delivery plan above.
6. Confirm the Cloud Scheduler trigger (`monthly-sli-report-soc2-trigger`,
   `0 7 1 * *`) will fire the real job on the 1st of the next month.

**Evidence needed to move to Yes**: a real delivered email to the
confirmed QR recipient (or an internal test recipient standing in
until QR confirms, clearly labeled as such in the evidence), plus the
`SLI_REPORT_EMAILED` `AuditEvent` row it generates - both already
proven to work end-to-end in this engagement (2026-08-05 manual job
execution, 100.00% availability / 67.81ms p95 / 0.03% error rate /
56.00% saturation, all PASS).

**Owner**: DevOps Lead (execution) + Qatar Airways Security/Technology
Contact (recipient confirmation) + Executive Sponsor (approval to
begin real customer communication).

**Rollback**: set `SLI_REPORT_DRY_RUN=true` again - no data is lost,
no external state changes beyond the emails already sent.

## NFR-119 - QR alert thresholds

**Threshold values QR must confirm**: none can be usefully requested
yet - see the business decision below, which comes first.

**Business decision required first** (see
`business-decision-register.md`): should QR get a self-service UI/API
to configure its own alert thresholds, or is the current
engineer-mediated change-request process sufficient? Recommended
decision: engineer-mediated is proportionate for a single-customer
bespoke deployment; revisit only if QR explicitly requests self-service.

**Production monitoring changes required**: **none, if the
engineer-mediated recommendation is accepted** - the current, real,
engineer-set alert thresholds (5xx rate, p95 latency, saturation,
uptime) are already deployed and functioning; no further production
action is needed, and this row should be scored as its final honest
state rather than held open indefinitely.

**If QR later requests self-service configuration instead**: a real
engineering effort would be needed (a threshold-configuration API/UI
gated by an appropriate permission, writing to Cloud Monitoring alert
policies programmatically) - not scoped or estimated here, since it is
contingent on a decision not yet made.

**Terraform/configuration readiness**: current thresholds are defined
in `terraform/main.tf`'s alert-policy resources - already
production-ready and deployed.

**Validation and evidence plan**: if the engineer-mediated answer is
accepted, evidence is simply the existing deployed alert policies
(already real) plus a documented change-request process description
(a short doc, ~0.5 day) for how QR would request a threshold change.

**Rollback**: N/A - no new production action is being proposed unless
the business decision changes.

**Owner**: Product Owner (decision) + DevOps Lead (any resulting
config work).

## IS.07 - Terraform/production drift detection

**Required CI credentials**: a CI service-account credential with
read access to the GCP project's Terraform state and resources -
confirmed via repository grep that **no such credential is configured
in this repo's CI today**.

**Workflow or Terraform already prepared**: `terraform/main.tf` is the
real, live infrastructure-as-code baseline already in production use
for every resource this engagement has touched (Cloud Run services,
Cloud SQL, Secret Manager, alert policies, the SLI report job, etc.) -
genuinely ready to be `terraform plan`-checked for drift.

**Activation steps**:
1. Provision a CI service-account with `roles/viewer` (or a more
   narrowly scoped read-only Terraform-state role) in `triage-502706`.
2. Add the credential to GitHub Actions secrets (this repo already has
   branch-protection-gated CI, per `docs/change-management-policy.md`).
3. Add a new scheduled workflow (e.g. daily) running
   `terraform plan -detailed-exitcode` against the live state; alert
   (e.g. via the existing communication adapter or a GitHub issue) on
   a non-zero exit code (drift detected).
4. **Can be done before the credential exists**: write and validate
   the workflow's `terraform plan` logic locally against the current
   `terraform/main.tf`, so only the credential-provisioning step
   remains once approved.

**Required evidence**: a real CI run history showing the drift-check
job executing on schedule, at least one observed "zero drift" result,
and (ideally) one real detected-drift event to prove the alert path
works end-to-end.

**Owner**: DevOps Lead (execution), Cloud Administrator (credential
provisioning/approval).

**Rollback**: none needed - this is a read-only detection job
(`terraform plan`, never `apply`), cannot mutate infrastructure.

## UX/NFR-015 - soc2 redeploy to pick up an already-fixed a11y issue

**Finding**: `src/routes/helpRouter.ts`'s "Sign in required" branch
already includes `lang="en"` in current source; the live deployed
`ist-triage-soc2` Cloud Run revision predates this fix.

**Production action**: redeploy `ist-triage-soc2` via the established
canary-then-cutover pattern (`docs/change-management-policy.md` §2).

**Required access**: `gcloud run deploy` permissions on
`ist-triage-soc2` (already routinely used this engagement).

**Evidence needed**: re-run `node scripts/a11yAudit.mjs` post-deploy
and confirm 0 violations across all 5 audited pages.

**Owner**: Cloud Administrator/DevOps Lead.

**Rollback**: standard canary rollback (traffic held on the prior
revision until the canary health-checks clean).

## UX/NFR-004 - cross-browser e2e fixture access

**Finding**: the deeper clinical-workflow e2e suite requires the local
Cloud SQL Auth Proxy tunnel (`127.0.0.1:5433`) - unavailable at points
in this session, available at others (session-dependent, not a
permanent gap).

**Production action**: none - this is a local development-environment
access dependency, not a production deployment.

**Required access**: Cloud SQL Auth Proxy tunnel access (already used
routinely this engagement when available).

**Owner**: DevOps Lead.

**Status**: test procedure complete (login/entry matrix already real
and passing); awaiting tunnel access in a future session to fix and
re-verify the deeper workflow fixtures.
