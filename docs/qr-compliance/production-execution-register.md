# Production Execution Register

_Rows where the control is technically ready (code/config exists) but the
questionnaire genuinely asks whether a production action has actually
been performed - not whether it's possible. Generated 2026-08-05._

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
