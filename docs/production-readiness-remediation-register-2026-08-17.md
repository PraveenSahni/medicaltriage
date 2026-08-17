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
5. Retention and privacy fulfillment jobs remain without `--execute` pending
   an isolated rehearsal of the approved 365-day policy and deployment authorization.

## Remediation register

| ID | Severity | Finding | Owner | Status | Closure evidence |
|---|---|---|---|---|---|
| PR-001 | Critical | Shared/seeded demo credentials usable in production runtime | Engineering + IAM owner | Zero-traffic canary passed; operator MFA custody and promotion pending | 38/38 focused tests; unsafe passwords return 401; protected login requires enrollment/MFA and verifies successfully |
| PR-002 | Critical | Deployed image cannot be mapped to exact Git commit | DevOps | Zero-traffic provenance chain complete; promotion pending | Git SHA, Cloud Build, immutable digest, revision labels and live runtime response match |
| PR-003 | Critical | Incomplete security persistence flags | DevOps + Security | Zero-traffic canary passed; promotion pending | Eight flags enabled; migrations current; cross-revision MFA, session and queue durability proven |
| PR-004 | Critical | Responsibility conflicts declared but unenforced | Engineering + Security | Zero-traffic canary healthy; elevated mutation UAT blocked by PR-001 MFA custody | Assignment-time SoD validator; 135/135 regression; nurse mutation denied live |
| PR-005 | High | Backend has 3 roles while product/audit material claims 19 | Product + Security | Zero-traffic canary passed; promotion pending | Exactly 3 protected roles confirmed live; governed custom-role migration current |
| PR-006 | Critical | Care advice can fall back to every item sharing a disposition code | Clinical Engineering | Zero-traffic canary passed; clinical sign-off and promotion pending | Exact-question advice enforced; live 30/30 five-protocol matrix and fail-closed negatives passed |
| PR-007 | High | Free-form JSON overwrite remains in legacy workspaces/scripts | Engineering | Zero-traffic canary passed; promotion pending | Live incremental merge, cross-revision reload and disposition-lock regression passed |
| PR-008 | High | Shared Cloud SQL instance is a common boundary | Cloud owner | Risk accepted — temporary remediation topology | SOC2 is temporary and will be decommissioned after customer security validation; one production system remains |
| PR-009 | High | Demo and scheduled jobs use default Compute service account | Cloud Security | Open — live access required | Dedicated keyless runtime identity; scheduled-workload disposition; least-privilege IAM and canary evidence from `triage-502706` |
| PR-010 | High | Audit signatures are not an immutable/chained ledger | Security Architecture | Source complete; deployment pending | Append-only DB role, HMAC chain, integrity verification and live tamper-negative evidence |
| PR-011 | High | Retention/legal-hold/privacy execution not fully operational | Privacy + Legal + Engineering | Decision and source complete; deployment rehearsal pending | Approved 365-day policy; execute-mode rehearsal; legal-hold negative test on isolated demo clone |
| PR-012 | Medium | Managed certificate resources remain PROVISIONING | DevOps | Infrastructure cleanup complete; certificate issuance pending | Healthy triage serving chain documented; marketing TLS active; post-change validation |
| PR-013 | High | Database-backed Jest suites not green in the audit workstation | QA/DevOps | Source complete; CI execution pending | Isolated PostgreSQL 15 CI service, fail-closed database guard, migrations and complete Jest run passing |
| PR-014 | High | Live Admin Create User and Grant Permission UAT incomplete | QA + Security | Local 97/97; live failed 2 SoD cases; cleanup verified | Deploy current SoD enforcement; rerun exact HTTP matrix; clean test records; resolve former SOC2 scope |
| PR-015 | High | Five-protocol adversarial auto-match matrix missing | Clinical QA | Source complete; clinical signature and deployment pending | 25/25 ambiguity/no-match matrix; 100/100 clinical regressions; nurse override evidence; named Clinical QA signature |

## GCP baseline captured 2026-08-17

- Demo revision at baseline: `ist-triage-demo-00033-fmh`, image tag `20260812-hotfix-112943`. PR-014 cleanup rolled the same unchanged image to `ist-triage-demo-00035-wlm`.
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

### 2026-08-17 zero-traffic deployment evidence

- Clean committed source: `c3f36a5bab407c73919e8ace55908041539e7263`.
- Expanded focused authentication/MFA/PAM/session regression: 38/38 passed;
  backend TypeScript passed.
- Cloud Build: `82b349c4-6f57-43d6-8aa0-a33264b98e0e`.
- Immutable image digest:
  `sha256:00b79e9d21c27b144714ecc4dcf253325f59ba996f5033ba9d0ce7c00a6582dc`.
- Final test revision: `ist-triage-demo-pr001-mfa4-c3f36a5`, serving zero
  percent of traffic with administrator-password secret version 2 and MFA
  encryption-key secret version 1 pinned explicitly.
- Health returned HTTP 200. `LocalMockAdmin!2026` and
  `PlatformAdmin@2026` both returned HTTP 401.
- The protected Platform Administrator path returned enrollment-required,
  completed TOTP enrollment, then returned an MFA challenge and successfully
  authenticated only after a valid TOTP code.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`.
- Promotion remains pending controlled operator custody/recovery of the
  enrolled TOTP credential; no demo-credential bypass was re-enabled.

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

### 2026-08-17 zero-traffic deployment evidence

- Clean committed source: `1fad3f8ba4f27a4031527d470e2ee288dd2c81f2`.
- Focused runtime provenance tests: 8/8 passed; backend TypeScript and the
  guarded PowerShell release-script syntax passed.
- Cloud Build: `d23924a4-be20-4f86-b855-7ece4d617dc6`, status `SUCCESS`.
- Immutable image:
  `me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-release@sha256:c62634cc8235ec4f4a36a253e77a32fda6a31ff2102bf217b8c7703092ffa6a0`.
- Zero-traffic revision: `ist-triage-demo-pr002-1fad3f8`, labelled
  `git-sha=1fad3f8` and `release=pr-002`.
- The live tagged runtime response returned the same full Git SHA, Cloud Build
  ID and Cloud Run revision. Health returned HTTP 200.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`.
- Promotion is deliberately pending the PR-001 operator-MFA custody gate; the
  provenance implementation itself is proven against the authoritative demo
  project `triage-502706`.

## PR-003 implementation record — durable production state

GCP baseline:

- Demo has only queue and session DB persistence enabled; MFA, audit events, role overrides, reveal workflow and both anomaly stores are not enabled.
- SOC2 has queue, session, MFA, audit events, role overrides, reveal workflow and reveal-anomaly persistence enabled; security-anomaly persistence is not enabled.
- Both logical databases are on the same Cloud SQL instance but use separate database names, users and Secret Manager connection secrets.

Source remediation complete:

1. Defined one canonical eight-flag production persistence set covering queue, sessions, MFA, audit events, role overrides, reveal workflow, reveal anomaly and security anomaly.
2. `NODE_ENV=production` now fails startup when `DATABASE_URL` or any required persistence flag is absent, including when `MOCK_MODE=true`.
3. The public runtime diagnostic reports the boolean persistence posture without exposing connection details.
4. `.env.example` documents every required flag explicitly.
5. Backend typecheck passes. The focused runtime and mocked/cross-instance persistence regression has 32/32 runnable tests passing. Two additional local real-PostgreSQL cases could not connect because no database was listening at the test-only `127.0.0.1:5433` endpoint; live Cloud SQL evidence below replaces that unavailable workstation fixture for the deployment gate.

### 2026-08-17 zero-traffic deployment evidence

- Clean committed source: `be21174db40c0aa559416058d647d6a7287921af`.
- Cloud Build: `d683860f-af71-4dcc-a4ad-13a967847368`, status `SUCCESS`.
- Immutable image digest:
  `sha256:4e43dc7cab56f2939a46dd2cd488e663f0be286e0050539aedc8d2df211c30a2`.
- Cloud SQL PostgreSQL 15 instance `ist-triage-postgres-uat` was `RUNNABLE`,
  with backups and point-in-time recovery enabled. The three pending additive
  migrations were reviewed, deployed successfully and a subsequent
  `prisma migrate status` reported the database schema up to date.
- Zero-traffic revision: `ist-triage-demo-pr003-be21174`, tagged
  `pr003-canary`, labelled `git-sha=be21174` and `release=pr-003`.
- The canary has all eight required persistence flags enabled. Health returned
  HTTP 200 and the live runtime response matched the exact Git SHA, Cloud Build
  ID and revision.
- Cross-revision MFA durability passed: the fresh PR-003 revision recognized
  the previously enrolled administrator MFA credential and returned an MFA
  challenge rather than enrollment.
- Cross-revision session durability passed: a session created by the rollback
  revision was accepted by PR-003, then explicitly revoked.
- Cross-revision queue durability passed: PR-003 created synthetic record
  `case-f3686c81-62a5-4ec3-87af-c0037e661856` with HTTP 201; the PR-002 revision
  read the exact ID and marker with HTTP 200; deletion returned HTTP 204 and
  session cleanup returned HTTP 200.
- No Prisma or persistence failures were observed in the canary logs.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`.

Remaining closure gates:

- Promotion remains blocked by PR-001 controlled operator MFA custody/recovery.
- Before promotion, exercise live audit, reveal and both anomaly write/read paths
  if those workflows are available without weakening the MFA gate. The flags,
  schema and startup posture are proven, but those four live business workflows
  were not individually mutated during this canary run.
- Repeat against SOC2 only if that temporary environment remains in scope under
  the accepted PR-008 consolidation decision.

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

- Restore controlled operator MFA custody/recovery under PR-001, then prove
  create, restart/hydrate, assign, login and conflict rejection using a
  disposable custom role through the supported elevated API.
- Confirm the existing Triage Nurse, Service Manager and Platform Administrator
  user workflows in browser UAT; role-catalog visibility and the nurse's
  administrative denial are already proven below.
- Promote demo only after the elevated mutation and browser gates pass. Repeat
  against SOC2 only if that temporary environment remains in scope under
  PR-008.

### 2026-08-17 zero-traffic deployment evidence

- Clean committed source: `6f46f47041b01d06e16cd4983457bbf59977597f`.
- Focused role, permission, administrator-boundary and reveal regression:
  135/135 tests passed across seven suites. Backend and frontend TypeScript
  checks passed.
- Cloud Build: `d5c0ac37-ecc8-4fdd-9ce2-a34c2e0cca53`, status `SUCCESS`.
- Immutable image digest:
  `sha256:6cc8ea2e35f648e0ba16244ec71e3e3e695650dbe222c706b682b6b3f3c1680b`.
- Additive migration `20260817153000_add_durable_custom_roles` applied to
  `ist_triage_demo`; an independent Prisma 5.22.0 status execution reported
  `Database schema is up to date!`. The temporary migration job was deleted.
- Zero-traffic revision: `ist-triage-demo-pr004-6f46f47`, tagged
  `pr004-canary`, labelled `git-sha=6f46f47` and `release=pr-004-pr-005`.
- Health returned HTTP 200. Runtime provenance matched the exact commit, build
  and revision; all eight persistence flags remained enabled.
- The live administrator role catalog returned exactly the three protected
  system-role codes: `remote_triage_nurse`, `triage_service_manager` and
  `platform_super_administrator`.
- A Triage Nurse received HTTP 403 for both custom-role creation and access to
  the administrative role catalog. The rejected role was not persisted and
  the temporary session was revoked.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`.
- Positive custom-role create/assign/restart and live SoD-conflict mutations
  require PAM elevation with a fresh TOTP. They were not bypassed and remain
  blocked until PR-001 restores controlled operator custody/recovery of the
  enrolled MFA credential. PR-005's canonical three-role deployment gate is
  proven; PR-004's elevated live mutation gate is not yet claimed complete.

## PR-006 implementation record — exact protocol clinical lineage

Source remediation complete:

1. The care-advice service now returns only advice IDs explicitly linked by the selected question or questions in the selected protocol. Disposition-code matching is no longer a fallback.
2. `GET /api/v1/protocols/:protocolId/care-advice` fails closed with HTTP 422 when no exact question is supplied or when a question does not belong to that protocol. Successful responses expose `selectionMode: EXACT_QUESTION`, `protocolId` and `questionIds` as lineage evidence.
3. Initial Assessment Questions, TAQs and the Disposition/Care Advice stage now resolve one canonical protocol ID. A nurse-selected override takes precedence consistently over the automatic suggestion across all stages.
4. The active cockpit stores the exact terminal TAQ question and filters care advice through only that question's `careAdviceIds`. Missing or invalid terminal lineage produces no patient-sendable advice and a visible clinical-lineage error.
5. Both legacy nurse workspaces no longer generate generic emergency, ankle/foot, self-care or clinic-review text. They also fail closed unless the selected question has an explicit protocol-authored advice link.
6. The protocol safety-floor reducer now retains the authored disposition for an exact Self-care terminal question; the repeated exhaustive matrix discovered and verified this correction.
7. All five existing exhaustive protocol simulation scripts now call the advice API with the exact positive question ID. An all-No path does not request unlinked generic advice.

No governed fallback is enabled. Introducing one requires a separately approved clinical-content policy, an explicit request mode, attributable approval evidence and its own regression matrix; disposition equality alone is prohibited.

Verification completed:

- Named 30-case matrix distributed across exactly the five licensed protocols: pass. The five-protocol source contains 126 authored TAQs in total; the exhaustive question/advice/disposition matrix checks all 126 and executes three complete passes per test run.
- Negative coverage proves missing question IDs, unknown IDs, cross-protocol IDs and same-disposition sibling advice fail closed.
- Care-advice API lineage and failure contracts: pass.
- Cockpit canonical protocol selection and exact terminal-question filtering: 4/4 tests passed.
- Backend build/typecheck and frontend typecheck: pass.

### 2026-08-17 zero-traffic deployment evidence

- Clean committed source: `0acf38ef860d62415f3dd60ad580fc4aa5cd3a7e`.
- Local clinical regression: 53/53 backend tests and 13/13 frontend tests
  passed; backend and frontend TypeScript checks passed. The backend matrix
  includes 30 named cases across exactly five licensed protocols plus three
  exhaustive passes over all 126 authored TAQs.
- Cloud Build: `1f3bb6d1-580d-4ae9-9c47-edcbd9133aa5`, status `SUCCESS`.
- Immutable image digest:
  `sha256:ff8d47b7af40added3f8a66146025c8e8af09e9c525d38fa15c4b1e211dfd01b`.
- Zero-traffic revision: `ist-triage-demo-pr006-0acf38e`, tagged
  `pr006-canary`, labelled `git-sha=0acf38e` and `release=pr-006`.
- Health returned HTTP 200. Runtime provenance matched the exact commit, build
  and revision; all eight persistence flags remained enabled.
- A live 30-case API matrix passed across exactly the five licensed protocols.
  For every case, `selectionMode` was `EXACT_QUESTION`, protocol and question
  lineage matched the request, and returned advice IDs exactly equalled the
  selected question's authored `careAdviceIds`.
- One direct positive check for each of the five protocols also passed, with
  exact advice counts of 3, 2, 3, 3 and 2 respectively.
- Authenticated negative checks passed: missing question lineage returned HTTP
  422 / `CARE_ADVICE_QUESTION_REQUIRED`; unknown and cross-protocol question
  IDs returned HTTP 422 / `CARE_ADVICE_PROTOCOL_MISMATCH`.
- All temporary sessions were revoked. The validation was read-only and created
  no clinical or queue records.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`.

Outstanding deployment gates:

- Exercise multiple real protocols in the browser: auto-selected and nurse-overridden protocol, IAQs, every TAQ tier, terminal disposition, exact advice, all-No behavior, hold/resume and handoff.
- Confirm no generic or same-disposition sibling advice appears in network responses or the UI; record protocol ID, question ID, advice IDs and revision for each run.
- Obtain named Clinical QA approval before promotion. Repeat on SOC2 only if
  that temporary environment remains in scope under PR-008.

## PR-007 implementation record — structured clinical JSON merge invariant

Source remediation complete:

1. The queue-context backend now treats `initialAssessmentResponses`, `taqResponses` and `clinicalApproval` as partial PATCH maps and shallow-merges their keys into the existing record instead of replacing the entire JSON object.
2. The invariant is enforced centrally, so cockpit, legacy workspaces, scripts and direct API callers receive the same preservation behavior even if a caller submits only its newest field.
3. The post-disposition clinical lock now compares the merged candidate object with the stored record. An idempotent partial retry is allowed, while adding or changing an IAQ/TAQ after disposition still returns `QUEUE_DISPOSITION_LOCKED`.
4. Both legacy nurse workspaces preserve existing approval metadata when adding completion approval fields.
5. The bulk queue simulation preserves its terminal question ID when it subsequently records approval time. Other all-No simulation paths legitimately have no terminal positive question.
6. The database save path receives the fully merged record and continues writing the complete maps to `clinicalApproval` and `queuePayload`; API reload regression proves the complete merged structure round-trips through the configured queue store.

Verification completed:

- Focused queue orchestration: 21/21 tests passed, including two new PR-007 multi-request regression cases.
- New coverage proves incremental IAQ answers, incremental TAQ answers and later approval metadata preserve all earlier keys after reload.
- New lifecycle coverage proves idempotent partial retries remain accepted after disposition, late clinical answers remain rejected, and terminal question lineage survives later approval.
- Adjacent backend clinical suites: 74/74 tests passed across queue orchestration, triage and five-protocol PR-006 lineage.
- Complete frontend suite: 66/66 tests passed.
- Backend build/typecheck and frontend typecheck: pass.

### 2026-08-17 zero-traffic deployment evidence

- Clean committed source: `24a634f98b25740d395f31a40c9c12cce5598d6f`.
- Focused backend/clinical regression: 74/74 passed. Complete frontend suite:
  66/66 passed. Backend and frontend TypeScript checks passed. The frontend
  run emitted existing React `act(...)` warnings but no test failures.
- Cloud Build: `86f36895-1e4c-48ac-9d64-aa56b2a6519c`, status `SUCCESS`.
- Immutable image digest:
  `sha256:6c421ea1677d50484bb11f97f16ea94eeea9ab61c09f28b7a1b72b19f84e531a`.
- Zero-traffic revision: `ist-triage-demo-pr007-24a634f`, tagged
  `pr007-canary`, labelled `git-sha=24a634f` and `release=pr-007`.
- Health returned HTTP 200. Runtime provenance matched the exact commit, build
  and revision; all eight persistence flags remained enabled.
- Six separate live PATCH requests added two IAQ keys, two TAQ keys and three
  approval fields. A reload through the PR-006 revision returned every field,
  proving backend merge behavior and Cloud SQL cross-revision durability.
- The disposition lifecycle regression passed: initial context save, move to
  `DISPOSITION` and an idempotent partial retry each returned HTTP 200. A new
  late TAQ answer returned HTTP 409 / `QUEUE_DISPOSITION_LOCKED`.
- A final PR-006 cross-revision reload retained terminal question and approval
  lineage and proved the rejected late-answer key was absent.
- Both synthetic queue records used by the live checks were deleted with HTTP
  204 and verified absent; all temporary sessions were revoked.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`.

Outstanding deployment gates:

- Repeat across active cockpit, legacy completion path, hold/resume and handoff; verify a post-disposition new-answer attempt returns HTTP 409 without changing stored JSON.
- Promote demo only after browser workflow UAT. Repeat against SOC2 only if
  that temporary environment remains in scope under PR-008.

## PR-008 decision record — temporary shared Cloud SQL boundary

Decision: risk accepted for the remediation period. The demo and SOC2 environments are not intended to become two permanent production systems. SOC2 exists only to validate and demonstrate customer security requirements; after those requirements are met, SOC2 will be decommissioned and the platform will operate as one system.

Rationale:

1. The current shared Cloud SQL instance is a temporary remediation topology, not the target production architecture.
2. Demo and SOC2 already use separate logical databases, database users, connection secrets and Cloud Run services, limiting ordinary application-level crossover during remediation.
3. Provisioning a second long-lived Cloud SQL instance would add cost and migration work for an environment that is scheduled for removal.
4. The remaining shared instance-level outage and administrator blast radius is acknowledged and accepted for this temporary period.

Required decommissioning controls when customer security validation completes:

- Confirm which single environment and database become authoritative before deleting anything.
- Retain or export required audit/security evidence according to the approved retention policy.
- Take and verify a final recoverable backup before SOC2 removal.
- Remove the SOC2 Cloud Run service, database, database user, Secret Manager secrets, scheduled jobs, service-account grants, DNS/hosting routes and monitoring resources through an approved change.
- Verify the surviving system has no references to removed SOC2 resources and complete a health, login, clinical workflow and restore-readiness check.
- Record the decommission date, approver, retained evidence and deletion verification in this register.

PR-008 therefore requires no separate Cloud SQL instance for the remediation environment. Its decision gate is complete; operational follow-through is the controlled SOC2 decommission after customer requirements are satisfied.

## PR-009 correction and remediation record — authoritative GCP target

The authoritative demo environment is project `triage-502706` (project number `1096520215793`) in `me-central1`, not `aimltriage`. The earlier 2026-08-17 inspection of `aimltriage` was performed against an unrelated project and is explicitly invalid as PR-009 closure evidence.

Current authoritative baseline, pending a fresh control-plane read:

1. Cloud Run service `ist-triage-demo` serves `triaged.irisstar.tech` through Firebase Hosting.
2. Recorded revision is `ist-triage-demo-00033-fmh`, using image `me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-demo:20260812-hotfix-112943`.
3. The demo service still uses the default Compute identity `1096520215793-compute@developer.gserviceaccount.com`; therefore PR-009 remains open.
4. The existing 2026-08-06 IAM review records that the SOC2 web service was moved to `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`, while demo, jobs and schedulers were deliberately deferred.
5. Repository infrastructure still assigns the default Compute identity to scheduled SOC2 workloads. Under PR-008, workloads that exist only for the temporary SOC2 environment should be deleted through controlled decommission instead of migrated. Any scheduled workload that survives must receive its own least-privilege identity.
6. The live runtime endpoint was reported healthy with `environment=demo`, `dataProfile=synthetic` and `is_mock=true`; this does not prove the configured service account or IAM bindings.
7. `praveen@irisstar.tech` currently receives `PERMISSION_DENIED` for `run.services.get` in `triage-502706`. No live IAM mutation or fresh configuration verification has therefore been performed in this remediation step.

Required closure sequence:

- Authenticate an approved principal with enough read access to inventory Cloud Run, IAM, Secret Manager IAM, Cloud Run Jobs and Cloud Scheduler in `triage-502706`.
- Capture the demo service configuration, active revision/image digest, attached service account, Cloud SQL attachment, secret references, project IAM, service-account keys and all scheduled workloads.
- Attach a dedicated keyless demo runtime identity with Cloud SQL Client and access only to the three required demo secrets. Do not grant Editor, Owner or IAM administration.
- Create a no-traffic revision using the same approved image and configuration, then validate startup, `/healthz/`, `/api/v1/runtime/environment`, database connectivity, authentication and a representative triage workflow before shifting traffic.
- Confirm logs contain no permission failures and preserve the previous revision as the tested rollback target until the observation window completes.
- Delete SOC2-only scheduled workloads during the approved PR-008 decommission. If any job remains temporarily, assign a separate job identity with only Cloud SQL Client, per-secret accessor, and Monitoring Viewer only where the job actually queries Monitoring.
- Record command output, IAM bindings, revision name, immutable image digest, validation results, rollback target, operator and timestamp here before changing PR-009 to complete.

## PR-010 implementation record — append-only chained audit ledger

Source remediation is complete for events written after the PR-010 migration:

1. Every production audit writer now uses `src/services/auditLedger.ts`; direct Prisma audit inserts and the benchmark cleanup deletion were removed from application and operational scripts.
2. Each new event carries a database sequence number, predecessor hash, HMAC-SHA256 event hash and key version. A PostgreSQL transaction advisory lock serializes writers so concurrent Cloud Run instances cannot fork the chain.
3. Production requires a dedicated `AUDIT_HMAC_SECRET`, `AUDIT_HMAC_KEY_VERSION` and separate `AUDIT_DATABASE_URL` connection. The audit database role is limited to `SELECT`/`INSERT` on the ledger and sequence.
4. Database triggers reject `UPDATE`, `DELETE` and `TRUNCATE`, reject unsigned inserts, validate predecessor linkage, and acquire the same advisory lock even for direct SQL inserts.
5. `verifyAuditEventChain()` and the authenticated `GET /api/v1/admin/audit-events/integrity` surface detect modified, removed and reordered records. `dist/scripts/verifyAuditLedger.js` provides an operational verification command.
6. Audit persistence now retains record, approval, session and metadata fields that the previous persistence adapter dropped.
7. Pre-migration rows are counted as `legacyUnsignedEvents`; the implementation does not falsely claim retroactive authenticity for historical records.

Validation completed locally:

- Prisma schema validation and client generation passed.
- Backend TypeScript validation passed.
- Focused audit-ledger tests cover valid chaining, predecessor linkage, modification, middle deletion, reordering, missing-secret fail-closed behavior and legacy unsigned reporting.
- Existing audit persistence, runtime configuration and scheduled-report regressions pass after migration to the centralized writer.
- Static source scan finds no remaining direct `prisma.auditEvent.create/update/delete/deleteMany/upsert` call in `src/` or operational `scripts/`.
- Complete backend run: 441/447 tests passed. The six failures are the already-registered PR-013 database-backed SSO/security-anomaly cases because no PostgreSQL server was available at `127.0.0.1:5433`; the PR-010-focused and adjacent 70/70 tests passed.

Outstanding deployment gates:

- Apply migration `20260817190000_add_append_only_audit_chain` to an isolated clone of `ist_triage_demo`, then test `UPDATE`, `DELETE`, `TRUNCATE`, unsigned `INSERT` and wrong-predecessor `INSERT` all fail.
- Run `scripts/configureAuditWriterRole.sql` as the approved database administrator, create a dedicated Cloud SQL login, grant it membership in `ist_audit_writer`, store its connection URL as a demo Secret Manager secret, and expose it only as `AUDIT_DATABASE_URL` to the Cloud Run service and retained jobs.
- Deploy a no-traffic `ist-triage-demo` revision in project `triage-502706`; write events through API, queue, FHIR and job paths, run integrity verification, restart and verify again.
- Confirm the normal application database login cannot update/delete/truncate the audit table and the audit login cannot mutate non-audit application tables.
- Record revision, image digest, migration output, role grants, negative SQL evidence, chain head and rollback result before marking PR-010 complete.

## PR-011 implementation record — 365-day retention and hold-safe privacy execution

Decision `PR-011-2026-08-17` approves a 365-day retention period for completed operational triage queue records in the surviving system. Active record-level and organization-level legal holds override retention and privacy erasure.

The canonical policy is `docs/retention-policy.md`. It defines the period in
days, retention trigger, archive/delete action, legal-hold precedence,
execution evidence, and excluded record classes.

Source controls:

1. Migration `20260817210000_approve_365_day_retention` installs an active `TRIAGE_QUEUE_ITEM_COMPLETED` policy with 365 days, an explicit decision reference, legal basis and `archive_then_delete` mode.
2. Execute mode fails closed unless that exact active policy and legal basis exist. Command-line period overrides are permitted for dry-run analysis only and rejected with `--execute`.
3. The former unapproved 90-day execution fallback is removed.
4. Retention execution re-reads eligible records and both levels of active legal hold inside a serializable transaction before archive and deletion. A concurrent hold creation produces a serialization conflict rather than a stale-check deletion.
5. Privacy erasure revalidates records and holds inside a serializable transaction; deletion and request-state update are atomic. If any record is held, the request remains open with a partial-execution explanation instead of being falsely marked fulfilled.
6. Pure regression coverage proves the approved policy gate, rejects missing/inactive/wrong-period/wrong-decision/no-legal-basis policies, rejects execute overrides, and proves record, organization and released-hold behavior.
7. The operational job does not silently extend destructive deletion to dependency-linked clinical encounters or the append-only audit ledger. Any later scope expansion requires a dependency-safe archive/export design and separately approved change.

Outstanding deployment gates:

- Apply the policy migration to an isolated clone of `ist_triage_demo` in project `triage-502706`.
- Seed synthetic expired, held, organization-held and released-hold records; run dry-run and execute-mode rehearsals and reconcile exact row/archive/audit counts.
- Prove an unapproved/missing policy and a concurrent hold block deletion.
- Configure the retained production job against the surviving demo only after SOC2 job disposition under PR-008, then record revision, image digest, operator, approver and rollback evidence.

## Change log

- 2026-08-17: PR-001 source remediation completed and verified locally. Production runtime now fails closed for shared and seeded demo credentials unless `ALLOW_DEMO_CREDENTIALS=true` is deliberately configured. Focused authentication/session regression: 35/35 tests passed; backend typecheck passed. Deployment closure remains pending.
- 2026-08-17: PR-002 elevated to next critical remediation with an explicit end-to-end provenance chain and closure criteria.
- 2026-08-17: PR-002 source implementation added: clean-tree build guard, full-SHA image tag, OCI labels, Cloud Build ID, immutable-digest output and live runtime provenance fields. Build/deployment evidence remains pending.
- 2026-08-17: PR-003 started. Added a fail-closed production persistence policy and safe runtime posture reporting; database and canary validation remain in progress.
- 2026-08-17: PR-003 source validation completed: backend typecheck passed and 32/32 runnable focused tests passed. Two real PostgreSQL tests, database schema evidence and canary activation remain open pending interactive gcloud reauthentication.
- 2026-08-17: PR-003 zero-traffic canary passed in `triage-502706`. All eight persistence flags are active, Cloud SQL migrations are current, and MFA, session and synthetic queue state crossed revision boundaries successfully. Synthetic data and sessions were cleaned. Production promotion remains blocked by PR-001 operator MFA custody; live audit/reveal/anomaly workflow exercises are explicitly not claimed.
- 2026-08-17: PR-004 and PR-005 source remediation completed around three protected system roles plus governed custom roles. SoD validation, durable schema/API, Platform Administrator UI, audit behavior and documentation were added; all focused and adjacent recorded suites passed. Database migration and no-traffic canary evidence remain pending.
- 2026-08-17: PR-004/PR-005 zero-traffic canary deployed in `triage-502706`. The custom-role migration is current, 135/135 focused regressions and both typechecks passed, exactly three protected roles were confirmed live, and nurse administration attempts returned 403. PR-005 canary evidence is complete; PR-004 positive elevated mutation UAT remains blocked by the PR-001 operator-MFA custody gate and was not bypassed.
- 2026-08-17: PR-006 source remediation completed. Questions, TAQs, disposition and care advice now share one selected protocol lineage; care advice requires exact question linkage and fails closed without it. Repeated exhaustive and negative regression tests, backend build and both typechecks passed. Canary and live multi-protocol clinical verification remain pending.
- 2026-08-17: PR-006 validation was tightened to the five licensed protocols only. A named 30-case cross-protocol matrix and three exhaustive passes over all 126 licensed TAQs passed; synthetic sample protocols are not counted as clinical validation evidence.
- 2026-08-17: PR-006 zero-traffic canary passed in `triage-502706`. The live 30-case exact-question matrix passed across all five licensed protocols; missing, unknown and cross-protocol lineage failed closed with the expected HTTP 422 codes. Production traffic was unchanged. Browser workflow UAT and named Clinical QA approval remain required before promotion.
- 2026-08-17: PR-007 source remediation completed. Structured IAQ, TAQ and approval JSON now merge at the backend boundary; legacy callers preserve existing approval lineage; idempotent post-disposition retries remain allowed while new clinical answers stay locked. Focused, adjacent and complete frontend regression suites passed. Cloud SQL canary verification remains pending.
- 2026-08-17: PR-007 zero-traffic canary passed in `triage-502706`. Six incremental IAQ/TAQ/approval patches survived a PR-006 cross-revision reload; idempotent post-disposition retry returned 200, a late clinical answer returned 409 / `QUEUE_DISPOSITION_LOCKED`, and the final reload proved no forbidden key was stored. Synthetic records and sessions were cleaned; production traffic was unchanged.
- 2026-08-17: PR-008 risk decision recorded. The shared Cloud SQL instance is accepted only for the temporary remediation topology; SOC2 will be safely decommissioned after customer security validation, leaving one authoritative system.
- 2026-08-17: PR-009 evidence correction: `aimltriage` was the wrong project and its inventory is invalid for closure. The authoritative target is `triage-502706`; its demo baseline still uses the default Compute service account. PR-009 is open pending authorized live inventory, least-privilege cutover and canary evidence.
- 2026-08-17: PR-010 source remediation completed. New audit events use a serialized HMAC chain and dedicated insert/select-only database connection; database triggers prohibit mutation and unsigned/forked inserts; integrity verification and tamper regressions were added. Isolated Cloud SQL migration and no-traffic demo canary evidence remain pending.
- 2026-08-17: PR-011 business decision and source remediation completed for a 365-day completed-queue retention policy. Execute mode now requires the approved policy, legal holds are revalidated transactionally, and privacy erasure remains open when held records survive. Isolated `ist_triage_demo` rehearsal remains pending.
- 2026-08-17: PR-012 investigation completed. Both triage domains are healthy on Firebase Hosting with a valid shared Google Trust Services certificate. `aimltriage.com` still fails hostname-valid TLS across its two published Firebase IPs. The additive external load-balancer chain is a stale-resource candidate, but the current identity cannot read its live inventory or Firebase custom-domain state. No destructive action was taken. Exact evidence, resource candidates, access requirements and cleanup order are in `docs/infrastructure/pr-012-certificate-remediation.md`.
- 2026-08-17: PR-012 live remediation executed with explicit approval. Correct Firebase ownership/DNS records were installed for the marketing apex and `www`; Firebase accepted the apex and began certificate minting. The unused `ist-triage-url-map` chain, both inactive certificates, both backend services, both serverless NEGs and reserved address `ist-triage-lb-ip` (`8.233.232.24`) were deleted and their absence verified in the console. The Terraform declaration was removed. Final closure awaits Firebase `Connected` and hostname-valid TLS for `aimltriage.com` and `www.aimltriage.com`.

## PR-013 implementation record — isolated database-backed CI

Source remediation:

1. The backend CI job now provisions a disposable PostgreSQL 15 service with
   the dedicated database `ist_triage_test` and test-only credentials.
2. `DATABASE_URL` and `AUDIT_DATABASE_URL` point only to the job-local
   PostgreSQL listener. No Secret Manager or Cloud SQL credential is used.
3. `scripts/assertIsolatedTestDatabase.mjs` fails closed unless the database
   host is local, the database name ends in `_test`, the protocol is PostgreSQL,
   and execution is explicitly in CI or test mode.
4. CI applies the complete Prisma migration history before running the existing
   full backend Jest command, so SSO and security-anomaly persistence tests run
   against the same schema version as the application.

Validation completed on the audit workstation:

- isolation guard accepted `127.0.0.1/ist_triage_test`;
- isolation guard rejected a remote production-shaped URL;
- `package.json` parsed successfully;
- Prisma schema validation passed; and
- backend TypeScript validation passed.

The workstation has no Docker/PostgreSQL runtime, so the closure gate remains
the first GitHub Actions run showing the migrated PostgreSQL service and all
backend Jest suites passing. Technical test completion is not clinical UAT.

## PR-014 execution record — admin user and permission boundaries

- Added a 56-case create-user/permission boundary suite and a guarded live UAT
  runner. The focused suite plus adjacent authorization/PAM regressions passed
  97/97 locally.
- Live demo execution recorded 22/24 expected HTTP outcomes. The deployed
  `20260812-hotfix-112943` image incorrectly accepted a conflicting nurse plus
  service-manager user (`201`, expected `409`) and incorrectly granted
  `privacy.reveal.approve` to the requester nurse role (`200`, expected `409`).
- The current source rejects both cases, proving the live image predates the
  PR-004/PR-005 SoD remediation.
- All transient permissions and synthetic accounts were removed by a fresh
  unchanged revision. Post-recovery verification on
  `ist-triage-demo-00035-wlm` confirmed the synthetic demo runtime, normal
  administrator login, clean nurse permissions and no active PR-014 users.
- PR-014 remains open until the current source is built/deployed and the live
  matrix passes. Detailed matrix and evidence interpretation are in
  `docs/security/pr-014-admin-user-permission-uat.md`.

## PR-015 implementation record — adversarial protocol matching

- Added explicit `AMBIGUOUS` behavior: close candidates produce no automatic
  primary protocol and no protocol-derived acuity preview.
- Added a minimum decisive-match score and suppressed negated/normal-state
  complaint wording so phrases such as `no diarrhea`, `without injury` and
  `baby moving normally` cannot create a false positive.
- The nurse can explicitly choose among ambiguous or weak candidates before
  TAQ/disposition; read-only and post-question selection locks remain active.
- The durable high-risk queue audit entry records the previous protocol, the
  nurse-selected protocol and the prepared-match status for override evidence.
- The five-protocol matrix passed 25/25, adjacent backend clinical suites
  passed 100/100, the protocol-selection UI passed 10/10, and backend/frontend
  TypeScript checks passed.
- Source remediation is complete. Closure still requires deployment evidence
  and a named qualified Clinical QA reviewer signature. The review artifact is
  `docs/protocol-review/pr-015-five-protocol-adversarial-matrix.md`.
