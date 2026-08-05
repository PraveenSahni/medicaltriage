# Production Execution Register

_Rows where the control is technically ready (code/config exists) but the
questionnaire genuinely asks whether a production action has actually
been performed - not whether it's possible. Generated 2026-08-05, updated
2026-08-05 (Batch 5)._

## NFR-119 - QR-facing alert-threshold configuration

- **Exact production action**: none proposed yet - see
  `business-decision-register.md`'s product-scope question first. If
  engineer-mediated remains the answer, no production action is needed;
  the current state (real, engineer-set thresholds) is the honest final
  state for this row, and it should be scored on that basis rather than
  held open indefinitely.
- **Required access**: N/A pending the business decision above.
- **Status**: awaiting business decision, not blocked on infrastructure
  access.

## IS.07 - Terraform/production drift detection

- **Exact production action**: add a scheduled CI job that runs
  `terraform plan` against the live soc2/demo environments and alerts on
  any detected drift (a non-zero plan diff).
- **Required access**: a CI service-account credential with read access
  to the GCP project's Terraform state and resources - confirmed via
  grep that no such credential is configured in this repo's CI today.
- **Expected evidence after deployment**: a real CI run history showing
  the drift-detection job executing on schedule, plus at least one
  observed "zero drift" result and (ideally) one real detected-drift
  event to prove the alert path works.
- **Rollback**: none needed - this is a read-only detection job, not a
  mutating one.
- **Responsible owner**: DevOps lead.
- **Status**: Production execution required - blocked on provisioning
  the CI credential, not on writing the job itself (the job's logic
  could be written and validated with `terraform plan` locally against
  the existing `terraform/main.tf` in a follow-up batch, then wired into
  CI once the credential exists).

## DR / regional failover rows (NFR-039, NFR-040, NFR-041, DR.05)

- **Exact production action**: (1) deploy the application (Cloud Run)
  tier into the DR region (asia-south1/Mumbai) alongside the existing
  cross-region DB replica; (2) perform an actual DR switchover drill
  (promote the replica, redirect traffic, measure real RTO); (3) repeat
  on a planned interval per whatever cadence is decided.
- **Required access**: Cloud Run deploy permissions in the DR region,
  DNS/traffic-routing control, a maintenance window for the drill.
- **Expected evidence after deployment**: a dated DR-drill report with
  measured RTO/RPO numbers (not estimates), following the same rigor as
  the existing restore-drill documented in
  `docs/restore-drill-2026-08-04.md` (referenced in the register for
  DR.04/RM.13).
- **Rollback**: drill should be performed against a non-production
  cutover path first (e.g. the soc2 environment) before ever being
  exercised against `triaged.irisstar.tech`'s live demo traffic.
- **Responsible owner**: Cloud architect + SRE.
- **Status**: Production execution required - real, scoped, but a
  significant infrastructure exercise, not a quick win. Recommend its
  own dedicated session once mandatory Priority 1/2 work is further
  along.

## UX/NFR-015 - soc2 redeploy to pick up a real, already-fixed a11y issue

- **Finding (2026-08-05, Batch 5)**: ran the already-broadened
  `scripts/a11yAudit.mjs` (5 real pages/personas: login, help center,
  Nurse Cockpit, Service Manager Board, Control Center admin) live
  against `triagedsoc2.irisstar.tech`. Result: 1 real violation
  (`html-has-lang`, serious impact) on the unauthenticated `/help` page.
- **Root cause confirmed**: `src/routes/helpRouter.ts`'s "Sign in
  required" HTML branch already includes `lang="en"` in the current
  source (line 68) - the **live deployed Cloud Run revision on
  `ist-triage-soc2` is running an older build that predates this fix**,
  confirmed by comparing `curl`'d live output (missing the `<html
  lang="en">` wrapper entirely) against the current source.
- **Exact production action**: redeploy `ist-triage-soc2` via the
  established canary-then-cutover pattern
  (`docs/change-management-policy.md` §2) to pick up the current source.
- **Required access**: `gcloud run deploy` permissions on the
  `ist-triage-soc2` Cloud Run service (already used routinely this
  engagement).
- **Expected evidence after deployment**: re-run
  `node scripts/a11yAudit.mjs` and confirm 0 violations across all 5
  pages (matches this session's run except for the 1 stale-deploy
  finding).
- **Rollback**: standard canary rollback (traffic stays on the prior
  revision until the canary is health-checked).
- **Status**: Production execution required - not performed this batch
  since a live redeploy is a production action outside this batch's
  explicit "no production credentials" boundary; flagged for explicit
  go-ahead rather than executed silently.

## NFR-004 (UX tab) - cross-browser e2e fixture fixes need DB access

- **Finding (2026-08-05, Batch 5)**: the deeper clinical-workflow e2e
  suite (`tests/e2e/browser-journey.spec.ts`, `tests/e2e/api-contract.spec.ts`)
  requires the local Cloud SQL Auth Proxy tunnel to `127.0.0.1:5433` -
  the same dependency already flagged as unavailable in this session's
  test-baseline correction (`docs/qr-compliance/final-validation-report.md`).
  Could not attempt to diagnose or fix the "stale test-fixture
  assumptions" mentioned in the existing remark without that DB access.
- **Status**: Test procedure complete (Playwright config + 4-engine/
  2-mobile-profile matrix already real and passing for the login/entry
  flow), awaiting DB-tunnel access to fix and re-verify the deeper
  workflow fixtures.

## AuditEvent durable persistence - resolved 2026-08-05

**Exact production action**: activate `AUDIT_EVENT_DB_PERSISTENCE=true`
on `ist-triage-soc2`. **Done** - validated on canary (2 revisions,
cross-instance read confirmed), then cut over to live traffic; a real
failed-login against the live URL confirmed as a real database row.

**Required access**: `gcloud run deploy`/`update-traffic` on
`ist-triage-soc2` (already routinely used this engagement).

**Evidence**: `docs/operations/audit-event-persistence.md`; real
`AuditEvent` rows in the soc2 database with real actor/organization/
action/risk/outcome fields, no secrets.

**Rollback**: set `AUDIT_EVENT_DB_PERSISTENCE=false` and redeploy - no
data loss (this only stops new durable writes, doesn't remove existing
rows).

**Status**: Closed. `MFA_MANDATORY` (AR.13) remains a separate,
still-blocked item on the same environment.
