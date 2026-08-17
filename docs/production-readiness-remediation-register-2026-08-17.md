# Production Readiness Remediation Register

Date opened: 2026-08-17

Target decision: end of week
Scope: `triaged.irisstar.tech`, `triagedsoc2.irisstar.tech`, application source, CI, Cloud Run, Cloud SQL and scheduled jobs.

An item is closed only after four gates pass: source/config evidence, automated tests, deployment evidence, and live verification. A local change alone is not a closure.

## Release decision

Current decision: **NO-GO**

Current top blockers:

1. Demo accepts a shared seeded password and creates an authenticated administrator session without MFA.
2. Deployed images are not traceable to exact Git SHAs and differ from the audited checkout.
3. Both services run `MOCK_MODE=true`; security persistence is incomplete on demo and security-anomaly DB persistence is unset on both.
4. Care-advice fallback, JSON merge invariants, RBAC/SoD enforcement and full database-backed test evidence remain open.
5. Retention and privacy fulfillment jobs are deployed without `--execute` pending governance approval.

## Remediation register

| ID | Severity | Finding | Owner | Status | Closure evidence |
|---|---|---|---|---|---|
| PR-001 | Critical | Shared/seeded demo credentials usable in production runtime | Engineering + IAM owner | Source complete; deployment pending | Focused tests; deploy; shared and seeded passwords return 401; approved named login requires MFA |
| PR-002 | Critical | Deployed image cannot be mapped to exact Git commit | DevOps | Source implementation in progress | Immutable digest and Git SHA label exposed by runtime endpoint; build provenance recorded; deployed revision matches approved commit |
| PR-003 | Critical | Incomplete security persistence flags | DevOps + Security | Open | Flags enabled; cross-instance tests and live persistence query pass |
| PR-004 | Critical | Responsibility conflicts declared but unenforced | Engineering + Security | Open | Assignment-time SoD validator and negative tests |
| PR-005 | High | Backend has 3 roles while product/audit material claims 19 | Product + Security | Open | Approved canonical role catalog reconciled across API, UI and documentation |
| PR-006 | Critical | Care advice can fall back to every item sharing a disposition code | Clinical Engineering | Open | Exact-question advice by default; explicit governed fallback; regression tests |
| PR-007 | High | Free-form JSON overwrite remains in legacy workspaces/scripts | Engineering | Open | Backend merge invariant and all-surface regression tests |
| PR-008 | High | Shared Cloud SQL instance is a common boundary | Cloud owner | Open/decision required | Accepted risk or isolated instance with restore test |
| PR-009 | High | Demo and scheduled jobs use default Compute service account | Cloud Security | Open | Dedicated least-privilege accounts and IAM evidence |
| PR-010 | High | Audit signatures are not an immutable/chained ledger | Security Architecture | Open | Append-only DB role plus chaining or immutable external export |
| PR-011 | High | Retention/legal-hold/privacy execution not fully operational | Privacy + Legal + Engineering | Blocked on approval | Approved period; execute-mode rehearsal; legal-hold negative test |
| PR-012 | Medium | Managed certificate resources remain PROVISIONING | DevOps | Open | Serving certificate chain and ownership documented; stale resources removed |
| PR-013 | High | Database-backed Jest suites not green in the audit workstation | QA/DevOps | Open | Ephemeral PostgreSQL CI run with all suites passing |
| PR-014 | High | Live Admin Create User and Grant Permission UAT incomplete | QA + Security | Open | Exact HTTP evidence in both environments; test records cleaned through approved process |
| PR-015 | High | Five-protocol adversarial auto-match matrix missing | Clinical QA | Open | Signed ambiguity/no-match matrix with nurse override evidence |

## GCP baseline captured 2026-08-17

- Demo revision: `ist-triage-demo-00033-fmh`, image tag `20260812-hotfix-112943`.
- SOC2 revision: `ist-triage-soc2-00073-mad`, image tag `synthetic-flow-fix-20260807`.
- Both services: `MOCK_MODE=true`, `APP_ENVIRONMENT=demo`, `APP_DATA_PROFILE=synthetic`.
- Separate database secrets, database names and database users; shared PostgreSQL 15 instance in `me-central1`.
- Backups and point-in-time recovery enabled; instance availability is ZONAL.
- Demo shared fallback produced HTTP 200 authenticated session; SOC2 rejected the same password with HTTP 401.
- Retention and privacy fulfillment jobs have no `--execute` argument.

## PR-001 completion record

Source remediation is complete. Full production closure remains gated on deployment and live verification, in accordance with the four-gate definition above.

How the source issue was fixed:

1. Added `areDemoCredentialsEnabled()` in `src/config/runtime.ts`.
2. Shared and seeded credentials now default to disabled whenever `NODE_ENV=production`, including a Cloud Run service that still has `MOCK_MODE=true`.
3. Re-enabling them in production requires the explicit, auditable escape hatch `ALLOW_DEMO_CREDENTIALS=true`.
4. `getAdminPassword()` no longer returns the hard-coded fallback in a production runtime by default.
5. `authenticateLocal()` applies the same gate to the shared fallback and every seeded per-user password.
6. A separately configured `ADMIN_PASSWORD` remains restricted to the platform bootstrap administrator and still passes through the existing MFA gate.

Verification completed:

- Backend TypeScript: pass.
- Authentication/MFA/PAM/session focused regression: 35/35 tests passed.
- New negative tests prove both `LocalMockAdmin!2026` and the seeded `PlatformAdmin@2026` credential are rejected when `NODE_ENV=production` and the escape hatch is absent.

Outstanding deployment gates:

- Build from the isolated remediation commit.
- Configure an approved named/bootstrap access path and mandatory MFA without locking out administrators.
- Deploy to demo first.
- Verify both unsafe credentials return HTTP 401.
- Verify approved named login requires MFA and succeeds after MFA.
- Record revision, image digest and rollback result. These deployment facts will also provide the first live proof for PR-002.

## PR-002 implementation plan — deployed-image Git traceability

PR-002 is the next critical remediation. A human-readable image tag is insufficient: every release must be traceable to one immutable source commit and one immutable container digest.

Required implementation:

1. Build only from a clean, committed checkout; reject dirty-tree production builds.
2. Tag the image with the full Git SHA and retain the immutable Artifact Registry digest.
3. Add OCI image labels for source repository, revision and build timestamp.
4. Set safe Cloud Run revision labels/annotations carrying the short commit SHA and release identifier.
5. Expose `gitSha`, `imageDigest` or deployment revision through the authenticated runtime diagnostic surface, with no secret values.
6. Record commit, Cloud Build ID, image URI/digest, Cloud Run revision and verification timestamp in this register.
7. Add CI/release validation that fails when the deployed revision lacks source provenance or does not match the approved commit.

PR-002 closes only when both demo and SOC2 can be mapped:

`Git commit -> Cloud Build -> Artifact Registry digest -> Cloud Run revision -> live runtime response`.

Source implementation completed so far:

- Docker image accepts Git SHA and Cloud Build ID as build arguments and writes them to OCI labels and runtime environment variables.
- `GET /api/v1/runtime/environment` exposes `gitSha`, `buildId` and the automatic Cloud Run `K_REVISION` value without exposing credentials.
- `cloudbuild.provenance.yaml` tags every image with the full 40-character Git SHA and records the Cloud Build ID.
- `scripts/buildProvenanceRelease.ps1` refuses a production build from a dirty tree, resolves the exact committed SHA, invokes the provenance build, and prints the immutable Artifact Registry digest.
- Runtime tests and backend typecheck pass; PowerShell release-script syntax passes.

Remaining PR-002 gates:

- Build the committed implementation from a clean checkout.
- Confirm OCI revision/build labels on the resulting image.
- Deploy as a no-traffic demo canary with commit/release revision labels.
- Match live runtime provenance to the commit, build and digest.
- Add/verify the corresponding CI or release-policy enforcement.
- Repeat against SOC2 only after demo verification.

## Change log

- 2026-08-17: PR-001 source remediation completed and verified locally. Production runtime now fails closed for shared and seeded demo credentials unless `ALLOW_DEMO_CREDENTIALS=true` is deliberately configured. Focused authentication/session regression: 35/35 tests passed; backend typecheck passed. Deployment closure remains pending.
- 2026-08-17: PR-002 elevated to next critical remediation with an explicit end-to-end provenance chain and closure criteria.
- 2026-08-17: PR-002 source implementation added: clean-tree build guard, full-SHA image tag, OCI labels, Cloud Build ID, immutable-digest output and live runtime provenance fields. Build/deployment evidence remains pending.
