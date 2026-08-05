# Change Management Policy

_Consolidates the real change-management controls already in place across this
engagement into one document (closes Cloud CSQ SD.02: "documentation which
describes your production change management procedures"). Every control
named here is real and already in force - this is a write-up of existing
practice, not a new process being introduced._

## 1. Code review and CI gating

Every change to `main` goes through a pull request. `.github/workflows/ci.yml`
runs on every push/PR to `main` and must pass before a change is considered
mergeable:

- **`typecheck-and-test`** - backend TypeScript typecheck (`tsc --noEmit`),
  frontend typecheck, backend test suite (`jest --runInBand`), frontend test
  suite.
- **`dependency-audit`** - fails the build on any newly introduced
  HIGH/CRITICAL dependency vulnerability (`pnpm audit --audit-level high`),
  a license-compliance check against an allowlist of commercially-clean OSS
  licenses, and generates a CycloneDX SBOM published as a build artifact on
  every run (closes NFR-177).
- **`docker-build`** - validates the production `Dockerfile` still builds
  (build-only, no push/registry credentials involved).
- **`.github/workflows/codeql.yml`** - static application security testing
  (CodeQL) on every push/PR plus a weekly schedule, published as a
  downloadable SARIF artifact.

**Honest gap, not glossed over:** this repository is private on a GitHub plan
tier that does not support required-status-check branch protection or
GitHub Advanced Security features (confirmed directly via the GitHub API -
`gcloud`/`gh` calls to enable branch protection or code-scanning upload
return `403 Upgrade to GitHub Pro or make this repository public`). CI
passing is therefore enforced today by team convention and PR review
discipline, not by a GitHub-enforced merge gate. The workflows themselves are
real and do run on every push - what's missing is the platform-level
enforcement that a merge cannot happen while they're red. Upgrading the
GitHub plan (or making the repo public) is the concrete next step to close
this gap; it is a licensing/business decision, not an engineering one.

## 2. Deployment: canary-then-cutover

Every production deploy to Cloud Run this engagement (`ist-triage-demo`,
`ist-triage-soc2`) has followed the same manual, verified sequence:

1. `gcloud run deploy <service> --no-traffic --tag=canary ...` - the new
   revision is deployed but receives zero live traffic.
2. Health-check the canary revision directly (`/healthz`,
   `/api/v1/runtime/environment`, a real login + read) before it serves any
   real user.
3. `gcloud run services update-traffic <service> --to-latest` - only after
   the canary is confirmed healthy does traffic cut over to the new
   revision.
4. Re-verify the now-live service post-cutover.

This is documented in `docs/soc2-control-matrix.md` and
`docs/incident-response-plan.md`, and used consistently for every deploy this
session - including the explicit rule to health-check
`triaged.irisstar.tech` (the live customer-facing environment) before and
after any change that could affect it. Like CI gating, this is currently a
disciplined manual practice, not a pipeline-enforced step (no CD automation
runs the canary-then-cutover sequence automatically) - flagged in
`docs/soc2-control-matrix.md`'s gap list as a future automation opportunity.

## 3. Audit trail of changes

- Every git commit is attributed to a real author with a descriptive message
  explaining the change's purpose.
- Every administrative/security-relevant change made through the running
  application itself (account status changes, role-permission grants/
  revokes, PAM elevation grants, reveal-workflow approvals) writes a real
  `AuditEvent` row - a separate, application-level change trail distinct
  from git history, covering changes made through the product rather than to
  its source code.
- `docs/risk-register-2026-08-04.md` and
  `docs/qr-questionnaire-backlog-tracker.md` are updated after every real
  remediation, giving a running, dated record of what changed and why across
  this engagement.

## 5. Risk-based patching timeframes

Closes Cloud CSQ IS.43 ("provide your risk-based systems patching
timeframes to your customers upon request"). Real, currently-enforced
timeframes:

| Risk level | Timeframe | Real mechanism |
|---|---|---|
| New HIGH/CRITICAL dependency vulnerability introduced by a proposed change | Blocks merge immediately (0 days) | `dependency-audit` CI job, `pnpm audit --audit-level high` (`.github/workflows/ci.yml:63`) |
| Existing dependency vulnerability, any severity, in already-deployed code | Weekly scan, PR opened same week | Dependabot (`.github/dependabot.yml`, `schedule.interval: weekly`, npm + Docker ecosystems), grouped into fast individual PRs for security patches vs. batched minor/patch version bumps |
| Application-layer vulnerability found by the internal DAST-style probe | Weekly scan | `scripts/dastProbe.mjs`, scheduled weekly (see `docs/qr-questionnaire-backlog-tracker.md`) |

**What this does not cover**: there is no separately measured
"time-to-remediate" SLA once a Dependabot PR is opened - merging it still
depends on the same PR-review discipline noted in section 1's honest gap
(no platform-enforced required check on this GitHub plan tier). The
detection cadence above is real and automated; the remediation-merge step
is currently a manual, disciplined practice, not a measured/enforced SLA.

## 6. What this policy does not (yet) cover

- No automated CD pipeline exists - deploys are manual `gcloud`/`firebase`
  CLI invocations following the canary-then-cutover pattern above, not a
  triggered pipeline.
- No formal change-advisory-board/approval-ticket workflow exists for
  non-security-sensitive changes - this engagement explicitly declined to
  build a multi-level approval workflow for auth/authz changes specifically
  (see `docs/qr-questionnaire-backlog-tracker.md` section 4a), accepting the
  immediate-change-plus-audit-trail model instead.
- Branch protection is not platform-enforced today (see the honest gap in
  section 1) - a GitHub plan upgrade (or making the repo public) is the
  concrete next step.
