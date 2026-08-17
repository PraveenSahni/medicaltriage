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
| PR-003 | Critical | Incomplete security persistence flags | DevOps + Security | In progress | Flags enabled; cross-instance tests and live persistence query pass |
| PR-004 | Critical | Responsibility conflicts declared but unenforced | Engineering + Security | Source complete; deployment pending | Assignment-time SoD validator and negative tests |
| PR-005 | High | Backend has 3 roles while product/audit material claims 19 | Product + Security | Source complete; deployment pending | Approved canonical role catalog reconciled across API, UI and documentation |
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

## PR-003 implementation record — durable production state

GCP baseline:

- Demo has only queue and session DB persistence enabled; MFA, audit events, role overrides, reveal workflow and both anomaly stores are not enabled.
- SOC2 has queue, session, MFA, audit events, role overrides, reveal workflow and reveal-anomaly persistence enabled; security-anomaly persistence is not enabled.
- Both logical databases are on the same Cloud SQL instance but use separate database names, users and Secret Manager connection secrets.

Source remediation in progress:

1. Defined one canonical eight-flag production persistence set covering queue, sessions, MFA, audit events, role overrides, reveal workflow, reveal anomaly and security anomaly.
2. `NODE_ENV=production` now fails startup when `DATABASE_URL` or any required persistence flag is absent, including when `MOCK_MODE=true`.
3. The public runtime diagnostic reports the boolean persistence posture without exposing connection details.
4. `.env.example` documents every required flag explicitly.
5. Backend typecheck passes. The focused runtime and mocked/cross-instance persistence regression has 32/32 runnable tests passing; two real PostgreSQL cases are deliberately excluded pending live connectivity.
6. Cloud SQL validation is currently blocked because the selected gcloud user token requires interactive reauthentication. The downloaded Cloud SQL Auth Proxy v2.23.0 was verified as validly signed by Google LLC before the connection attempt.

Remaining closure gates:

- Verify every required migration/table in both logical databases.
- Run the real PostgreSQL cross-instance suites against each database.
- Enable missing flags on a no-traffic demo canary and prove health, login/MFA, audit, reveal and anomaly durability.
- Promote demo only after the canary passes; repeat on SOC2.
- Confirm restart and multi-instance behavior, then record the exact revisions and evidence here.

## PR-004 and PR-005 implementation record — governed three-role model

Agreed canonical model:

- Three protected system roles: Triage Nurse, Triage Service Manager and Platform Administrator.
- Platform Administrators can create additional governed custom roles for approved requirements; custom roles do not become additional system roles.

Source remediation complete:

1. Added one central role-definition validator for unknown codes, responsibility prerequisites, static responsibility conflicts and sensitive permission conflict pairs.
2. Applied validation to custom-role creation, role-permission grants, new-user multi-role assignments and HRMS-supplied roles/responsibilities.
3. Added an elevated and rate-limited `POST /api/v1/admin/roles` endpoint with duplicate/protected-code rejection, audit logging and PostgreSQL persistence.
4. Added durable custom-role bundle fields and migration `20260817153000_add_durable_custom_roles`; startup plus configurable periodic hydration loads only records explicitly marked `custom` and rejects collisions or invalid persisted definitions.
5. Updated the Roles screen to display protected system roles and provide permission/responsibility selection for custom-role creation. The existing permission-revocation UI now sends its required reason body.
6. Reconciled current Help Center and canonical role documentation to the three-system-role model while retaining older 19-role material only as explicitly historical evidence.
7. Backend and frontend typechecks pass; Prisma validates and generates. The three-role UAT/governance/permission run passed 101/101, the adjacent admin/reveal run passed 41/41, and the final focused role regression passed 17/17 after adding custom-role assignment coverage.

Remaining deployment closure gates:

- Apply the custom-role migration to isolated demo and SOC2 logical databases after gcloud reauthentication.
- Deploy a no-traffic demo canary and prove create, restart/hydrate, assign, login and conflict rejection using a disposable custom role.
- Confirm all three protected roles remain visible and existing Triage Nurse, Service Manager and Platform Administrator workflows are unchanged.
- Promote demo only after canary evidence; repeat against SOC2 and record exact revisions.

## Change log

- 2026-08-17: PR-001 source remediation completed and verified locally. Production runtime now fails closed for shared and seeded demo credentials unless `ALLOW_DEMO_CREDENTIALS=true` is deliberately configured. Focused authentication/session regression: 35/35 tests passed; backend typecheck passed. Deployment closure remains pending.
- 2026-08-17: PR-002 elevated to next critical remediation with an explicit end-to-end provenance chain and closure criteria.
- 2026-08-17: PR-002 source implementation added: clean-tree build guard, full-SHA image tag, OCI labels, Cloud Build ID, immutable-digest output and live runtime provenance fields. Build/deployment evidence remains pending.
- 2026-08-17: PR-003 started. Added a fail-closed production persistence policy and safe runtime posture reporting; database and canary validation remain in progress.
- 2026-08-17: PR-003 source validation completed: backend typecheck passed and 32/32 runnable focused tests passed. Two real PostgreSQL tests, database schema evidence and canary activation remain open pending interactive gcloud reauthentication.
- 2026-08-17: PR-004 and PR-005 source remediation completed around three protected system roles plus governed custom roles. SoD validation, durable schema/API, Platform Administrator UI, audit behavior and documentation were added; all focused and adjacent recorded suites passed. Database migration and no-traffic canary evidence remain pending.
