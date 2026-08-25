# Production Readiness Remediation Register

Date opened: 2026-08-17

Last reconciled: 2026-08-19

Target decision: end of week
Scope: `triaged.irisstar.tech`, `triagedsoc2.irisstar.tech`, application source, CI, Cloud Run, Cloud SQL and scheduled jobs.

An item is closed only after four gates pass: source/config evidence, automated tests, deployment evidence, and live verification. A local change alone is not a closure.

## Release decision

Current decision: **NO-GO**

Current top blockers:

1. PR-004 and PR-014 administrator/conflict UAT is complete on the MFA-enforced
   SOC2 remediation environment. Demo remains the synthetic password-only
   user-testing environment and was not changed by that UAT.
2. PR-006 and PR-015 technical matrices passed on deployed candidates, but named
   qualified Clinical QA approval is still required before clinical promotion.
3. PR-010 source and restart verification are technically complete on a
   zero-traffic SOC2 revision; Security Architecture approval remains the
   promotion and governance closure gate.
4. PR-011 technical activation is complete on SOC2 under the approved 365-day
   policy. The weekly scheduler remains intentionally dry-run until Privacy/Legal
   approves recurring destructive execution.
5. PR-008 remains an accepted temporary shared-boundary risk. SOC2 is the
   authoritative remediation environment during customer security validation and
   will be decommissioned only after an approved final consolidation decision.

PR-001, PR-002, PR-003, PR-005, PR-009, PR-012 and PR-013 are complete. The
remediated SOC2 revision is promoted, and demo has a documented PR-001 testing
exception. The overall release decision remains **NO-GO** until the remaining
clinical, privacy/legal and live UAT gates are closed.

The remaining approval blocks and post-approval operator actions are
consolidated in
`docs/production-readiness-approval-closure-pack-2026-08-19.md`. Blank or
partially completed blocks are not approvals.

Status interpretation:

- **Complete**: all recorded closure gates passed.
- **Technical/canary passed**: implementation and stated technical evidence passed,
  but promotion, business UAT or named approval remains.
- **Risk accepted**: an explicitly documented temporary risk with a required exit.
- Historical change-log entries preserve their point-in-time state; the register
  table and this reconciled release decision are current.

## Remediation register

| ID | Severity | Finding | Owner | Status | Closure evidence |
|---|---|---|---|---|---|
| PR-001 | Critical | Shared/seeded demo credentials usable in production runtime | Engineering + IAM owner | Complete with explicit demo-only exception | Credentials fail closed by default; SOC2 requires governed credentials and MFA; synthetic demo deliberately sets `ALLOW_DEMO_CREDENTIALS=true` and `MFA_MANDATORY=false` for user testing |
| PR-002 | Critical | Deployed image cannot be mapped to exact Git commit | DevOps | Complete | Guarded clean-tree release; Git SHA, Cloud Build, immutable digest, revision labels and live runtime response match on current zero-traffic candidate |
| PR-003 | Critical | Incomplete security persistence flags | DevOps + Security | Complete | Eight flags enabled; migrations current; cross-revision MFA/session/queue durability; live audit, reveal and both anomaly stores verified |
| PR-004 | Critical | Responsibility conflicts declared but unenforced | Engineering + Security | Complete | Assignment-time SoD validator; 135/135 regression; SOC2 administrator PAM UAT proved conflicting role assignment and conflicting permission grant return 409; cleanup verified |
| PR-005 | High | Backend has 3 roles while product/audit material claims 19 | Product + Security | Complete | Exactly 3 protected roles confirmed on the current immutable candidate; Platform Administrator sees governed custom-role creation; historical 19-role material is labelled historical |
| PR-006 | Critical | Care advice can fall back to every item sharing a disposition code | Clinical Engineering | SOC2 technical verification complete; clinical sign-off and promotion pending | Exact-question advice enforced; authenticated current-image 30/30 five-protocol matrix and fail-closed negatives passed |
| PR-007 | High | Free-form JSON overwrite remains in legacy workspaces/scripts | Engineering | Complete | Governed SOC2 nurse MFA UAT passed incremental IAQ/TAQ/approval merge, answer, hold/resume reload, disposition, idempotent retry, late-answer 409, unchanged storage and audited cleanup |
| PR-008 | High | Shared Cloud SQL instance is a common boundary | Cloud owner | Risk accepted - temporary remediation topology | Separate databases/users/secrets remain on one instance; SOC2 is the remediation authority and final consolidation/decommission requires a separately approved change |
| PR-009 | High | Demo and scheduled jobs use default Compute service account | Cloud Security | Complete | Demo and SOC2 services plus all six SOC2 jobs use the dedicated keyless runtime identity; per-secret access is scoped and live inventory was reverified |
| PR-010 | High | Audit signatures are not an immutable/chained ledger | Security Architecture | Technical remediation complete on SOC2; approval pending | SOC2 uses an insert/select-only audit login; 2,376 legacy unsigned rows are bounded; new signed chain verified; live UPDATE denied |
| PR-011 | High | Retention/legal-hold/privacy execution not fully operational | Privacy + Legal + Engineering | Technical activation and concurrent-hold race complete; recurring execute approval pending | Active 365-day policy; database-trigger serialization; live hold-first race retained the record; SOC2 scheduler remains dry-run |
| PR-012 | Medium | Managed certificate resources remain PROVISIONING | DevOps | Complete | Healthy triage and marketing serving chains documented; stale load-balancer resources removed; post-change DNS/TLS/HTTP validation passed |
| PR-013 | High | Database-backed Jest suites not green in the audit workstation | QA/DevOps | Complete | Isolated PostgreSQL 15 CI service, fail-closed database guard, migrations and complete Jest run passing |
| PR-014 | High | Live Admin Create User and Grant Permission UAT incomplete | QA + Security | Complete | SOC2 exact-HTTP UAT passed authenticated admin/manager/nurse boundaries, PAM elevation, create/duplicate/invalid/conflict cases, reversible permission grant, audit lookup and approved cleanup |
| PR-015 | High | Five-protocol adversarial auto-match matrix missing | Clinical QA | Technical deployment matrix passed; clinical signature pending | 25/25 deployed ambiguity/no-match matrix; 100/100 clinical regressions; nurse override evidence; named Clinical QA signature |

## Historical GCP baseline captured 2026-08-17

This is the pre-remediation baseline. It is retained for audit traceability and is
superseded where later dated deployment evidence appears below.

- Demo revision at baseline: `ist-triage-demo-00033-fmh`, image tag `20260812-hotfix-112943`. PR-014 cleanup rolled the same unchanged image to `ist-triage-demo-00035-wlm`.
- SOC2 revision: `ist-triage-soc2-00073-mad`, image tag `synthetic-flow-fix-20260807`.
- Both services: `MOCK_MODE=true`, `APP_ENVIRONMENT=demo`, `APP_DATA_PROFILE=synthetic`.
- Separate database secrets, database names and database users; shared PostgreSQL 15 instance in `me-central1`.
- Backups and point-in-time recovery enabled; instance availability is ZONAL.
- Demo shared fallback produced HTTP 200 authenticated session; SOC2 rejected the same password with HTTP 401.
- Retention and privacy fulfillment jobs have no `--execute` argument.

## PR-001 completion record

Source remediation, zero-traffic deployment verification and operator-controlled
credential/TOTP custody are complete, in accordance with the four-gate definition above.

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

PR-001 is closed. Governed credentials remain mandatory on SOC2. On 2026-08-19,
the owner explicitly designated demo as synthetic user testing and authorized the
auditable escape hatch there only; this does not authorize seeded credentials in
SOC2 or any future live-data environment.

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

### 2026-08-18 operator custody and closure evidence

- The authorized operator `sahni.ps@gmail.com` requested recovery of the protected
  Platform Administrator account `rishma@irisstar.tech` after the validation-owned
  authenticator was found unavailable.
- A single-purpose zero-traffic recovery execution changed the durable credential
  to `reset_required`, revoked existing sessions and used the application recovery
  service so the reset was audited. The temporary Cloud Run job was deleted and its
  absence verified.
- A fresh remediation instance returned enrollment-required. The operator completed
  fresh TOTP enrollment and confirmed successful password-plus-TOTP login. No password,
  enrollment token, TOTP secret or one-time code is retained in this register.
- Production traffic and nurse/Service Manager demo access were unchanged. PR-001 is
  complete; the established operator-controlled MFA path unblocks PR-004 and PR-014.

## PR-002 implementation and deployment record — deployed-image Git traceability

PR-002 proves that a human-readable image tag is insufficient: every release must
be traceable to one immutable source commit and one immutable container digest.

Required implementation:

1. Build only from a clean, committed checkout; reject dirty-tree production builds.
2. Tag the image with the full Git SHA and retain the immutable Artifact Registry digest.
3. Add OCI image labels for source repository, revision and build timestamp.
4. Set safe Cloud Run revision labels/annotations carrying the short commit SHA and release identifier.
5. Expose `gitSha`, `imageDigest` or deployment revision through the authenticated runtime diagnostic surface, with no secret values.
6. Record commit, Cloud Build ID, image URI/digest, Cloud Run revision and verification timestamp in this register.
7. Add CI/release validation that fails when the deployed revision lacks source provenance or does not match the approved commit.

The authoritative demo deployment is mapped end to end as follows:

`Git commit -> Cloud Build -> Artifact Registry digest -> Cloud Run revision -> live runtime response`.

Source implementation completed so far:

- Docker image accepts Git SHA and Cloud Build ID as build arguments and writes them to OCI labels and runtime environment variables.
- `GET /api/v1/runtime/environment` exposes `gitSha`, `buildId` and the automatic Cloud Run `K_REVISION` value without exposing credentials.
- `cloudbuild.provenance.yaml` tags every image with the full 40-character Git SHA and records the Cloud Build ID.
- `scripts/buildProvenanceRelease.ps1` refuses a production build from a dirty tree, resolves the exact committed SHA, invokes the provenance build, and prints the immutable Artifact Registry digest.
- Runtime tests and backend typecheck pass; PowerShell release-script syntax passes.

PR-002 is closed. Promotion of the proven immutable image remains part of the
overall release decision rather than a PR-002 remediation gap. Under PR-008, SOC2
is assigned to controlled decommission and requires a separate provenance deployment
only if it remains an active release target.

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
- At the time of this canary, promotion was pending the PR-001 operator-MFA
  custody gate; that gate closed on 2026-08-18. The provenance implementation
  itself is proven against the authoritative demo project `triage-502706`.

### 2026-08-18 current-candidate closure evidence

- A stale inherited label on a later remediation canary was detected and was not
  accepted as PR-002 closure evidence. The release workflow was strengthened with
  `scripts/deployProvenanceCanary.ps1`, which rejects a dirty checkout, requires the
  requested full SHA to equal `HEAD`, resolves the immutable digest, deploys at zero
  traffic and fails on label, image, runtime or health mismatch.
- The definitive clean committed source was
  `8e002bdde9c2d788dd249ac8c35d0aab5f022f99`. Cloud Build
  `05bd55ee-58f6-4e5a-a5d8-798a3bddb11d` completed `SUCCESS` and produced digest
  `sha256:aeba36ac095d01c93fbd327d9b576720cb0adaee85c0dd87522f030cda5d427d`.
- Zero-traffic revision `ist-triage-demo-00065-xuf` carries labels
  `git-sha=8e002bd` and `release=pr-002-close` and uses that exact digest.
- The live tagged runtime returned the same full Git SHA, Cloud Build ID and Cloud
  Run revision; health returned HTTP 200. Independent authoritative inspection was
  retained because the local Google CLI wrapper did not emit the script's final
  summary object after deployment; no mismatch was concealed.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`; the closure
  candidate received zero percent. PR-002 is complete.

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

PR-003 is complete. Promotion remains part of the overall release decision. Repeat
against SOC2 only if that temporary environment remains in scope under the accepted
PR-008 consolidation decision.

### 2026-08-18 current-candidate closure evidence

- Current immutable candidate `ist-triage-demo-00065-xuf` reports all eight required
  persistence controls enabled. Its Git SHA, Cloud Build ID and immutable image digest
  are recorded in the PR-002 closure evidence above; health returned HTTP 200 and it
  continued to receive zero percent of traffic.
- The focused local persistence regression recorded 82/86 passing assertions. The
  only four failures were the known real-PostgreSQL cases attempting the unavailable
  workstation endpoint `127.0.0.1:5433`; PR-013's isolated PostgreSQL execution had
  already passed the complete database-backed run, 50/50 suites and 539/539 tests.
- Single-purpose Cloud Run execution
  `pr003-persistence-close-20260818-pjxxd` completed successfully against Cloud SQL.
  Its fail-closed invariant required: reveal-request write and reload, reveal-event
  write, two-call reveal-anomaly count of 2, two-call security-anomaly count of 2,
  and presence of the chained audit event. Any missing write/read would have failed
  the execution.
- The job's `finally` cleanup removed the synthetic reveal request/event and both
  anomaly-counter records. The append-only audit evidence was retained by design.
  The temporary Cloud Run job and local structured-test output were deleted and their
  absence verified. Production traffic was unchanged. PR-003 is complete.

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

- Using the operator MFA custody established under completed PR-001, prove create,
  restart/hydrate, assign, login and conflict rejection using a
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
  require PAM elevation with a fresh TOTP. Operator custody is now established,
  so this UAT is ready to execute. PR-005's canonical three-role deployment gate is
  proven; PR-004's elevated live mutation gate is not yet claimed complete.

### 2026-08-18 current-candidate PR-005 closure evidence

- Authenticated browser UAT on current immutable zero-traffic candidate
  `ist-triage-demo-00065-xuf` displayed exactly three protected system roles:
  Platform Administrator, Triage Service Manager and Triage Nurse.
- The Platform Administrator could open the governed custom-role screen, which
  exposes permission and responsibility selection, mandatory business reason and
  explicit segregation/prerequisite validation. Custom roles remain distinct from
  the protected system catalog.
- The prepared PR-004 unsafe reveal-request/reveal-approval role was never created;
  the catalog remained at exactly three roles and the unsubmitted form was cleared.
  PR-004 remains open because fresh PAM elevation was not completed during this
  interaction. That does not reopen PR-005's role-model/documentation finding.
- Existing 135/135 focused canary regression, current schema and role hydration
  evidence remain applicable. Production traffic was unchanged. PR-005 is complete.

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

### 2026-08-19 current SOC2 verification

- Current-source exact-lineage regression passed 38/38 per source copy (76/76
  observed because Jest also discovered the retained deployment worktree).
  This includes the named 30-case matrix across exactly five protocols, three
  exhaustive passes over all 126 authored TAQs, same-disposition sibling
  exclusion, unknown/cross-protocol rejection and API provenance contracts.
- Focused frontend protocol and completion-stage tests passed 10/10. Backend
  and frontend TypeScript validation passed.
- Governed synthetic-monitor password plus MFA authentication succeeded against
  zero-traffic SOC2 revision `ist-triage-soc2-pr010b-74985a1`.
- The read-only live API matrix passed 30/30 positive cases across exactly the
  five licensed protocols. Every response returned `selectionMode` =
  `EXACT_QUESTION`, the requested protocol/question lineage, and exactly the
  selected question's authored advice IDs with no disposition-sharing sibling
  advice.
- Missing question lineage, an unknown question and a cross-protocol question
  each failed closed with HTTP 422. Evidence:
  `test-results/pr006-soc2-live-20260819082606.json`.
- Runtime provenance matched Git
  `74985a1b165326d3a7a330a2339b5e881ba49fa6`; the validation created no queue
  or clinical records and changed neither demo nor production traffic.
- Technical verification on the current SOC2 image is complete. A qualified
  named Clinical QA reviewer must still approve the clinical wording,
  thresholds and protocol content before promotion; automated execution cannot
  provide that approval.

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
- The 2026-08-18 live browser attempt could not enter those nurse workflows:
  PAM-elevated governed account creation succeeded, but the issued temporary
  password was rejected by production-mode authentication. Resolve PR-014 and
  repeat this browser matrix with a governed nurse identity.
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

Authoritative baseline and decision:

1. Cloud Run service `ist-triage-demo` serves `triaged.irisstar.tech` through Firebase Hosting.
2. Recorded revision is `ist-triage-demo-00033-fmh`, using image `me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-demo:20260812-hotfix-112943`.
3. The production-traffic revision still uses the default Compute identity
   `1096520215793-compute@developer.gserviceaccount.com`; the tested zero-traffic
   replacement revision uses the dedicated identity recorded below.
4. The existing 2026-08-06 IAM review records that the SOC2 web service was moved to `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`, while demo, jobs and schedulers were deliberately deferred.
5. Repository infrastructure still assigns the default Compute identity to scheduled SOC2 workloads. Under PR-008, workloads that exist only for the temporary SOC2 environment should be deleted through controlled decommission instead of migrated. Any scheduled workload that survives must receive its own least-privilege identity.
6. The live runtime endpoint was reported healthy with `environment=demo`, `dataProfile=synthetic` and `is_mock=true`; this does not prove the configured service account or IAM bindings.
7. Live control-plane access was restored with approved principal
   `sahni.ps@gmail.com`, and the current configuration and IAM bindings were
   verified directly in `triage-502706`.

Required closure sequence:

- Authenticate an approved principal with enough read access to inventory Cloud Run, IAM, Secret Manager IAM, Cloud Run Jobs and Cloud Scheduler in `triage-502706`.
- Capture the demo service configuration, active revision/image digest, attached service account, Cloud SQL attachment, secret references, project IAM, service-account keys and all scheduled workloads.
- Attach a dedicated keyless demo runtime identity with Cloud SQL Client and access only to the five required demo secrets. Do not grant Editor, Owner or IAM administration.
- Create a no-traffic revision using the same approved image and configuration, then validate startup, `/healthz/`, `/api/v1/runtime/environment`, database connectivity, authentication and a representative triage workflow before shifting traffic.
- Confirm logs contain no permission failures and preserve the previous revision as the tested rollback target until the observation window completes.
- Delete SOC2-only scheduled workloads during the approved PR-008 decommission. If any job remains temporarily, assign a separate job identity with only Cloud SQL Client, per-secret accessor, and Monitoring Viewer only where the job actually queries Monitoring.
- Record command output, IAM bindings, revision name, immutable image digest, validation results, rollback target, operator and timestamp here before changing PR-009 to complete.

### 2026-08-17 zero-traffic identity-canary evidence

- Dedicated identity:
  `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`.
- The identity has no user-managed service-account keys and therefore uses
  Cloud Run's keyless workload identity path.
- Project roles are limited to `roles/cloudsql.client`,
  `roles/monitoring.viewer`, and custom role
  `projects/triage-502706/roles/istTriageRuntimeSchedulerOperator`. It has no
  Editor, Owner or IAM-administration role.
- The custom Scheduler role contains only `cloudscheduler.jobs.get`, `list`,
  `run`, `pause` and `enable`, matching the operations exposed by the
  administrator API; it cannot create, delete or arbitrarily update jobs.
- `roles/secretmanager.secretAccessor` is granted on exactly five named demo
  secrets: database URL, authentication JWT, audit HMAC, administrator password
  and MFA encryption key. It is not granted project-wide.
- Zero-traffic revision `ist-triage-demo-pr009-iam`, tagged `pr009-canary`, uses
  immutable image digest
  `sha256:6c421ea1677d50484bb11f97f16ea94eeea9ab61c09f28b7a1b72b19f84e531a`.
  The revision directly reports service account
  `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`.
- Health, persisted session and Scheduler-list requests returned HTTP 200; the
  Scheduler response contained all six current jobs. Runtime provenance matched
  Git `24a634f98b25740d395f31a40c9c12cce5598d6f`, Cloud Build
  `86f36895-1e4c-48ac-9d64-aa56b2a6519c`, and the PR-009 revision. All eight
  persistence flags remained enabled.
- No severity-ERROR log entry was returned for the PR-009 revision during the
  validation window. The temporary session was revoked.
- All six remaining default-identity jobs are named `*-soc2` and belong only to
  the temporary SOC2 environment. Under the accepted PR-008 decision, they will
  be deleted during controlled SOC2 decommission rather than migrated. Any job
  retained beyond that decommission must receive its own least-privilege job
  identity before it may run.
- Production traffic remained 100% on `ist-triage-demo-00035-wlm`; promotion of
  the dedicated identity remains part of the overall release decision.

### 2026-08-18 current-candidate identity revalidation

- The newest zero-traffic revision `ist-triage-demo-pr014g-0e30f43` is ready and
  healthy under `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`.
  Its immutable digest is
  `sha256:ee5e153c285cb7d6decd5574a7eb82b5e31864ac4b6203ce3694f5fdba6c4c81`.
- The dedicated identity still has no user-managed keys. Its project roles remain
  limited to Cloud SQL Client, Monitoring Viewer and the five-operation Scheduler
  custom role; it has no project-level Secret Accessor, Editor, Owner or IAM role.
- Secret Accessor remains granted separately on exactly the five required demo
  secrets. The current candidate returned runtime HTTP 200 with exact Git/build
  provenance and all eight persistence controls active; no severity-ERROR log
  entry was found for the revision.
- Production traffic remains 100% on `ist-triage-demo-00035-wlm`, which was
  directly reconfirmed to use the default Compute service account. PR-009 cannot
  be marked complete until the fully regression-tested aggregate candidate is
  promoted. Rolling traffic to the older PR-009-only canary would regress later
  remediations, while promoting the newest candidate before PR-014/PR-007 browser
  UAT would bypass their release gates. No traffic change was made.

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

### 2026-08-18 zero-traffic deployment evidence

- Migration `20260817190000_add_append_only_audit_chain` was applied to
  `ist_triage_demo`. The existing application login remained non-superuser,
  non-`CREATEROLE` and non-`CREATEDB`.
- Dedicated roles `ist_audit_writer` (`NOLOGIN`) and
  `ist_audit_writer_login` (`LOGIN`) were provisioned. Live privilege
  inspection confirmed membership plus `SELECT=true`, `INSERT=true`,
  `UPDATE=false`, `DELETE=false` and `TRUNCATE=false` on `audit_events`.
  The login also has no application-table mutation grant.
- `ist-triage-demo-audit-database-url` is readable only by
  `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`. The database
  password was rotated after the first canary exposed an invalid credential;
  the rejected revision received no traffic.
- Database tamper-negative execution passed 6/6: `UPDATE`, `DELETE`,
  `TRUNCATE`, unsigned `INSERT`, wrong-predecessor `INSERT` and application
  table mutation were all blocked.
- Live validation found and corrected a second fail-closed defect: the
  integrity route used the general non-mock persistence switch instead of
  `AUDIT_EVENT_DB_PERSISTENCE`. Focused audit/admin/runtime tests and backend
  typecheck passed; the correction is commit
  `47e10f3d2be2ce25c30c8e3952a7f64d6d395139`.
- Cloud Build `cc8e5390-50d6-40f8-8a17-4a95c39b245b` completed `SUCCESS`.
  Immutable image digest:
  `sha256:52a72b053c57bee3977d15f80022cb3645033160f5a673ff1c988b9843d63feb`.
- Zero-traffic revision `ist-triage-demo-pr010d-47e10f3`, tagged
  `pr010-canary`, reported the exact commit, build and revision. It runs as the
  dedicated PR-009 service account with all eight persistence controls active.
- An intentional failed login returned HTTP 401 and created a chained event.
  Authenticated integrity verification returned HTTP 200 with `valid=true`,
  `checkedEvents=2`, `legacyUnsignedEvents=3287` and chain head
  `c4ee4122ec6bded526420dca26dfe3c4569134a5fa402f35d1766e5381a5c42d`.
  Historical unsigned rows remain explicitly outside the authenticity claim.
- All temporary database-admin users, secrets, Cloud Run jobs, local
  credential files and validation sessions were removed. Production traffic
  remained 100% on `ist-triage-demo-00035-wlm` throughout.

Outstanding promotion gates:

- Exercise and verify chained writes through queue, FHIR and retained job
  paths, then restart the zero-traffic revision and re-run integrity
  verification.
- Obtain Security Architecture approval before promotion.

### 2026-08-19 SOC2 cross-path and restart verification

- Commit `74985a1b165326d3a7a330a2339b5e881ba49fa6` corrects a canonicalization
  defect found during live verification: JSON persistence removed an undefined
  `stationCode` metadata property after the event had been signed. New writes
  now sign the exact JSON-normalized representation persisted to PostgreSQL.
- The immutable historical rows were not updated or re-signed. Exactly three
  v1 `QUEUE_ITEM_CREATE` events match the proven legacy undefined-property
  representation and are reported as `legacyNormalizedEvents=3`; every other
  event shape remains fail-closed.
- Focused ledger regression tests passed 14/14 across the main and retained
  deployment copies. Project TypeScript validation passed.
- Pre-restart SOC2 evidence passed with 91 signed events, 2,376 explicitly
  unsigned pre-migration events, all required authentication, user, role and
  queue action families, and denied `UPDATE`, `DELETE` and `TRUNCATE` attempts.
  Evidence: `test-results/pr010-soc2-pre-restart-20260819071225.json`.
- Cloud Build `b80a06c2-18c7-4427-a5b9-ce85bed1d174` produced immutable digest
  `sha256:7e1a7e4077ff3bf417fd90a8c5a55e911ba1a89efc304355a87a37f5ba41ceb8`.
  Zero-traffic SOC2 revision `ist-triage-soc2-pr010b-74985a1`, tag
  `pr010-restart`, reports the exact Git SHA, build ID and revision name and
  retains the dedicated runtime service account and all eight persistence
  controls.
- A governed synthetic monitor completed password plus MFA authentication on
  the restarted revision. Its attempt to call the administrator-only integrity
  endpoint returned 403, confirming least privilege rather than granting the
  nurse monitor audit access.
- Post-restart restricted-role verification passed with 96 signed events,
  `legacyUnsignedEvents=2376`, `legacyNormalizedEvents=3`, all cross-path action
  families present, and all three mutation attempts denied. Evidence:
  `test-results/pr010-soc2-post-restart-20260819072716.json`.
- SOC2 production traffic remained 100% on `ist-triage-soc2-00078-qul`; demo
  traffic and configuration were untouched. Technical remediation and restart
  evidence are complete. Security Architecture approval is still required
  before promotion and final governance closure.

## PR-011 implementation record — 365-day retention and hold-safe privacy execution

Decision `PR-011-2026-08-17` approves a 365-day retention period for completed operational triage queue records in the surviving system. Active record-level and organization-level legal holds override retention and privacy erasure.

The canonical policy is `docs/retention-policy.md`. It defines the period in
days, retention trigger, archive/delete action, legal-hold precedence,
execution evidence, and excluded record classes.

Source controls:

1. Migration `20260817210000_approve_365_day_retention` installs an active `TRIAGE_QUEUE_ITEM_COMPLETED` policy with 365 days, an explicit decision reference, legal basis and `archive_then_delete` mode.
2. Execute mode fails closed unless that exact active policy and legal basis exist. Command-line period overrides are permitted for dry-run analysis only and rejected with `--execute`.
3. The former unapproved 90-day execution fallback is removed.
4. Retention execution and privacy erasure acquire the same database advisory
   lock enforced by legal-hold mutation triggers, then re-read eligible records
   and both levels of active hold before deletion. This serializes direct SQL
   and application writers instead of relying on `SERIALIZABLE` alone.
5. Privacy erasure revalidates records and holds inside a serializable transaction; deletion and request-state update are atomic. If any record is held, the request remains open with a partial-execution explanation instead of being falsely marked fulfilled.
6. Pure regression coverage proves the approved policy gate, rejects missing/inactive/wrong-period/wrong-decision/no-legal-basis policies, rejects execute overrides, and proves record, organization and released-hold behavior.
7. The operational job does not silently extend destructive deletion to dependency-linked clinical encounters or the append-only audit ledger. Any later scope expansion requires a dependency-safe archive/export design and separately approved change.

### 2026-08-18 isolated execute-mode rehearsal

- The 10-case retention-governance suite passed in both the main and exact
  deployment worktree copies (20 observed assertions); backend TypeScript
  validation passed.
- An isolated database named `ist_triage_pr011_rehearsal_20260818` was created
  on the authoritative `triage-502706` Cloud SQL instance. It used a temporary
  connection secret available only to the dedicated runtime service account;
  no `ist_triage_demo` records were in scope.
- Migration execution installed the exact approved policy:
  `TRIAGE_QUEUE_ITEM_COMPLETED`, 365 days, decision
  `PR-011-2026-08-17`, `archive_then_delete`, active legal basis.
- Six explicitly marked synthetic queue records covered expired eligible,
  expired record-held, expired organization-held, expired released-hold,
  fresh completed and old in-process boundaries. Three synthetic hold rows
  covered active record, active organization and released states.
- Dry-run reconciliation found exactly four expired completed records, excluded
  the two active holds and selected only the eligible plus released-hold
  records. No row changed.
- Execute reconciliation repeated those counts transactionally and
  archived/deleted exactly two records. Final evidence retained the active
  record-held and organization-held rows, plus the fresh completed and old
  in-process controls. Archives existed only for
  `pr011-expired-eligible` and `pr011-expired-released`.
- The audit ledger contained one `RETENTION_PURGE_DRY_RUN` and one
  `RETENTION_PURGE_EXECUTED` event.
- Live fail-closed evidence changed only the isolated policy to `draft`; the
  execute job failed with the expected requirement for an active 365-day
  policy, decision reference and legal basis. The isolated policy was restored
  to active before cleanup.
- Cloud Build `fffc2961-9b5e-4943-a1de-0c4148b1f737` produced the temporary
  migration-tool digest
  `sha256:51f0b9b886da96a18eca7f7a23c9342551c696ec4bb57854c8d9d23658432af8`.
  The execute job used application digest
  `sha256:52a72b053c57bee3977d15f80022cb3645033160f5a673ff1c988b9843d63feb`,
  which contains the committed PR-011 source.
- The isolated database, temporary secret, four Cloud Run jobs,
  migration-only image and local build file were deleted and absence verified.
  Production traffic and the surviving demo database were unchanged.

Outstanding activation gate:

- Record Privacy/Legal approver sign-off before enabling recurring execute
  mode. The controlled concurrent-hold race and rollback/disable procedure are
  complete; the retained schedule remains dry-run.

### 2026-08-19 SOC2 technical activation evidence

- Read-only inspection confirmed migration
  `20260817210000_approve_365_day_retention` is applied and not rolled back in
  `ist_triage_soc2`.
- The active `TRIAGE_QUEUE_ITEM_COMPLETED` policy contains exactly 365 days,
  decision `PR-011-2026-08-17`, a non-empty legal basis and
  `archive_then_delete` mode.
- At activation time the 365-day cutoff returned zero expired completed queue
  records, zero legal-hold exclusions and zero eligible records; no archives or
  deletions were created.
- The retained Cloud Run job `purge-expired-queue-data-soc2` was upgraded to
  immutable digest
  `sha256:7e1a7e4077ff3bf417fd90a8c5a55e911ba1a89efc304355a87a37f5ba41ceb8`
  from commit `74985a1b165326d3a7a330a2339b5e881ba49fa6`, uses the dedicated runtime
  service account and restricted audit-writer secrets, and contains no
  `--execute` argument.
- Weekly scheduler `purge-expired-queue-data-soc2-trigger` remains enabled at
  `0 3 * * 0` UTC and invokes the dry-run job only.
- Dry-run execution `purge-expired-queue-data-soc2-f5tfp` succeeded using the
  approved 365-day policy with zero changes and appended a valid
  `RETENTION_PURGE_DRY_RUN` event.
- One-time governed execute rehearsal
  `purge-expired-queue-data-soc2-6txh8` succeeded with zero eligible records and
  therefore zero deletions. It appended `RETENTION_PURGE_EXECUTED`; the retained
  job definition remained dry-run afterward.
- Subsequent ledger verification passed with 99 signed events and denied
  `UPDATE`, `DELETE` and `TRUNCATE`. Focused retention governance tests passed
  20/20 across the main and retained deployment copies; TypeScript validation
  passed.
- The disable/rollback procedure is recorded in `docs/retention-policy.md`.
  Demo was not changed. Technical activation is complete; recurring destructive
  scheduling remains gated on recorded Privacy/Legal approval.

### 2026-08-19 concurrent legal-hold race closure

- Review found the prior `SERIALIZABLE`-only claim was not sufficient to prove a
  concurrent hold would block deletion. The remediation now uses advisory lock
  `1096520211011` as the shared database boundary.
- Migration `20260819090000_serialize_legal_hold_mutations` installs triggers
  that acquire the lock before legal-hold INSERT, UPDATE, DELETE and TRUNCATE.
  Retention purge and privacy erasure acquire the same lock before re-reading
  records and active record/organization holds.
- Focused governance and migration-contract regressions passed 24/24; Prisma
  schema validation and backend TypeScript validation passed.
- The migration applied successfully to `ist_triage_soc2`. A controlled race
  created one uniquely named synthetic expired queue record and an uncommitted
  active hold. The purge transaction remained blocked until the hold committed,
  then found the hold, deleted nothing and retained the record.
- Exact cleanup removed the synthetic hold and queue record. Read-only
  verification returned zero remaining `pr011-race-*` artifacts.
- Commit `be4f10ba70abb691fdcf0f92b9d93cce3d81f70b`, Cloud Build
  `c1d3c53e-d269-4819-8e8b-7b2e61fb7027`, immutable digest
  `sha256:0dfd950a6e360699107dc5250b3b02bfdb68567c1fbaeab2a16e7094177b5856`.
- Jobs `purge-expired-queue-data-soc2` and
  `fulfill-privacy-requests-soc2` were upgraded to that image. Dry-run
  executions `purge-expired-queue-data-soc2-cw7b4` and
  `fulfill-privacy-requests-soc2-gcrs9` completed successfully. The weekly
  purge job still contains no `--execute` argument.
- Demo and Cloud Run service traffic were untouched. The technical concurrency
  gate is closed; recorded Privacy/Legal approval is the remaining PR-011 gate
  before recurring destructive scheduling.

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
- 2026-08-18: PR-006 and PR-007 were revalidated against the current workspace source. The focused backend run passed 118/118 tests across the exact-protocol lineage and queue-orchestration suites (the workspace and retained deployment copy were both discovered by Jest), and the focused cockpit lineage run passed 4/4. PR-006 remains gated on named qualified Clinical QA approval. PR-007 remains gated on live browser evidence across the active cockpit, legacy completion, hold/resume and handoff paths; this technical rerun does not claim those workflow gates.
- 2026-08-17: PR-008 risk decision recorded. The shared Cloud SQL instance is accepted only for the temporary remediation topology; SOC2 will be safely decommissioned after customer security validation, leaving one authoritative system.
- 2026-08-17: PR-009 evidence correction: `aimltriage` was the wrong project and its inventory is invalid for closure. The authoritative target is `triage-502706`; its demo baseline still uses the default Compute service account. PR-009 is open pending authorized live inventory, least-privilege cutover and canary evidence.
- 2026-08-17: PR-009 zero-traffic identity canary passed in `triage-502706`. The dedicated keyless runtime account has Cloud SQL Client, Monitoring Viewer, a five-permission Scheduler custom role and access to exactly five demo secrets, with no Editor/Owner role or user-managed key. Health, persisted session and Scheduler listing returned 200 with no severity-ERROR canary logs. SOC2-only jobs remain assigned to the PR-008 controlled decommission; production identity promotion remains blocked by PR-001 MFA custody.
- 2026-08-17: PR-010 source remediation completed. New audit events use a serialized HMAC chain and dedicated insert/select-only database connection; database triggers prohibit mutation and unsigned/forked inserts; integrity verification and tamper regressions were added. Isolated Cloud SQL migration and no-traffic demo canary evidence remain pending.
- 2026-08-25: Returned SOC2 manual regression results identified three application failures. Source corrections now (1) send the mandatory governance reason on administrator MFA reset, (2) restrict the Nurse Cockpit and clinical mutation APIs to `triage.workspace.view` so the Service Manager remains operational/read-only, and (3) show explicit Hold Call guidance when active-call navigation is blocked. Focused backend role/responsibility regression passed 88/88; focused frontend contract/route/navigation regression passed 6/6; both builds/typechecks passed. Status is source-fixed and awaiting SOC2 deployment plus live retest before the workbook failures can be changed to Pass.
- 2026-08-25: The three-failure candidate was deployed to SOC2. Git SHA `120809d4f2ccb59443ea480a049459b35b24a4f2`, Cloud Build `b126ab1c-392d-4d9c-9544-7fcca548be7e`, immutable digest `sha256:7d51e81ec171b451dad49781c5bcb922d6fdbcd1899d77fd8d3433709d5d6ac7`, and revision `ist-triage-soc2-regfix-120809d` are mutually traceable. The zero-traffic runtime canary passed before promotion to 100% SOC2 traffic; runtime provenance and all eight persistence flags were verified on the primary URL, root returned 200, and unauthenticated clinical access returned 401. Demo was not deployed or changed. The three workbook rows remain pending operator-authenticated manual UI retest before their evidence status changes to Pass.
- 2026-08-18: PR-010 zero-traffic canary passed after live validation corrected the audit-integrity persistence guard and audit-login credential/grant configuration. Tamper-negative execution passed 6/6, the live chain verified as valid, temporary access was removed and production traffic remained unchanged. Queue/FHIR/job-path verification, restart evidence and Security Architecture approval remain promotion gates.
- 2026-08-17: PR-011 business decision and source remediation completed for a 365-day completed-queue retention policy. Execute mode now requires the approved policy, legal holds are revalidated transactionally, and privacy erasure remains open when held records survive. Isolated `ist_triage_demo` rehearsal remains pending.
- 2026-08-18: PR-011 isolated Cloud SQL rehearsal passed. Dry-run and execute counts reconciled exactly; record and organization holds blocked deletion, a released hold permitted deletion, archive and audit counts matched, and an inactive policy failed closed. All temporary resources were removed. Production migration, scheduled activation, concurrent-hold race evidence and Privacy/Legal approval remain gated.
- 2026-08-17: PR-012 investigation completed. Both triage domains are healthy on Firebase Hosting with a valid shared Google Trust Services certificate. `aimltriage.com` still fails hostname-valid TLS across its two published Firebase IPs. The additive external load-balancer chain is a stale-resource candidate, but the current identity cannot read its live inventory or Firebase custom-domain state. No destructive action was taken. Exact evidence, resource candidates, access requirements and cleanup order are in `docs/infrastructure/pr-012-certificate-remediation.md`.
- 2026-08-17: PR-012 live remediation executed with explicit approval. Correct Firebase ownership/DNS records were installed for the marketing apex and `www`; Firebase accepted the apex and began certificate minting. The unused `ist-triage-url-map` chain, both inactive certificates, both backend services, both serverless NEGs and reserved address `ist-triage-lb-ip` (`8.233.232.24`) were deleted and their absence verified in the console. The Terraform declaration was removed. Final closure awaits Firebase `Connected` and hostname-valid TLS for `aimltriage.com` and `www.aimltriage.com`.
- 2026-08-18: PR-012 closed. The apex and `www` marketing domains now return HTTPS 200 with separate hostname-valid Google Trust Services certificates and HSTS; the triage domain remains healthy. Live GCP inventory reconfirmed the abandoned load-balancer chain is absent, and its Terraform declaration remains removed.
- 2026-08-18: PR-013 closed. The fail-closed guard approved only the isolated `_test` database, all 20 migrations applied, and the complete database-backed backend run passed 50/50 suites and 539/539 tests. Every temporary database, secret, job, image and build file was removed after evidence capture.
- 2026-08-18: PR-014 current source passed 97/97 locally and a healthy zero-traffic canary was deployed. Non-mutating live verification proved runtime availability but the remediated application rejected the legacy shared administrator password, so PAM-elevated mutation UAT remains blocked by PR-001 operator credential/MFA custody. No security control was bypassed and no synthetic mutation occurred.
- 2026-08-18: PR-015 deployed-candidate matrix passed 25/25 inside the immutable application image, matching the local 100/100 backend lineage and 10/10 UI override results. The temporary job was removed and production traffic was unchanged. Named qualified Clinical QA signature remains the only closure gate.
- 2026-08-18: PR-001 closed. The authorized operator requested an audited recovery of the protected Platform Administrator after the validation authenticator was unavailable, completed fresh TOTP enrollment and successfully authenticated with password plus TOTP. The temporary recovery job was deleted; production traffic and existing demo-user access were unchanged. PR-004 and PR-014 elevated UAT are now unblocked.
- 2026-08-18: PR-002 closed against the current source. A stale inherited revision label was detected and rejected; the deployment workflow was strengthened. Clean commit `8e002bdde9c2d788dd249ac8c35d0aab5f022f99`, Cloud Build `05bd55ee-58f6-4e5a-a5d8-798a3bddb11d`, immutable digest `sha256:aeba36ac095d01c93fbd327d9b576720cb0adaee85c0dd87522f030cda5d427d`, revision `ist-triage-demo-00065-xuf`, revision labels and live runtime response all matched. Health returned 200 and production traffic was unchanged.
- 2026-08-18: PR-003 closed against the current immutable candidate. All eight flags were active; prior cross-revision MFA/session/queue evidence remained valid; live Cloud SQL execution `pr003-persistence-close-20260818-pjxxd` proved reveal workflow reload, reveal/security anomaly cross-call counts and append-only audit persistence. Synthetic mutable rows and the temporary job were removed; production traffic was unchanged.
- 2026-08-18: PR-005 closed on current immutable zero-traffic candidate `ist-triage-demo-00065-xuf`. Authenticated Platform Administrator browser UAT displayed exactly the three protected system roles and the governed custom-role screen with business-reason, permission, responsibility and SoD controls. The catalog remained at three; production traffic was unchanged. PR-004 remains separately open pending completed PAM-elevated mutation UAT.
- 2026-08-19: PR-014's governed-password defect was fixed and deployed to zero-traffic revision `ist-triage-demo-pr014g-0e30f43`. Exact commit/build/digest provenance, dedicated identity, all persistence flags, 346/346 focused backend tests, 4/4 cockpit lineage tests and both TypeScript checks passed. Browser login reached mandatory administrator MFA; final PAM create/login/cleanup UAT remains pending because no current operator TOTP was available. Production traffic remained unchanged.
- 2026-08-19: Production traffic was promoted to `ist-triage-demo-pr014g-0e30f43` to repair the PR-010 schema/writer compatibility failure on legacy revision `ist-triage-demo-00035-wlm`. Direct and custom-domain provenance matched, protected queue access returned 401 instead of 500, the dedicated PR-009 identity became active, and no post-cutover error-level candidate logs were present. The append-only database trigger remained enforced.
- 2026-08-19: A PAM-protected seeded-to-governed transition was deployed as `ist-triage-demo-cred-73beab9` and promoted after zero-traffic gates. Layla retained the nurse role and Khalid retained the service-manager role; their issued passwords were accepted by production with mandatory MFA enrollment. Seeded passwords remain disabled. First-login MFA and role-specific workflow evidence remain open.

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

### 2026-08-18 isolated database-backed execution

- Exact committed source `47e10f3d2be2ce25c30c8e3952a7f64d6d395139`
  was packaged into a temporary CI-only image. Corrected Cloud Build
  `f70b421d-f480-4b33-a7fa-0cb65d4e691e` completed `SUCCESS`; image digest was
  `sha256:2703e16b4126955211d8027e441fb1cdc0c7255eefd9faeab7dec6c38558b703`.
- The test target was an isolated database named `ist_triage_pr013_test` with
  a temporary secret scoped only to the dedicated runtime service account.
  The guard explicitly approved `localhost/ist_triage_pr013_test`; no demo or
  production database credentials or rows were used.
- All 20 committed Prisma migrations applied successfully, including durable
  roles, append-only audit chaining and the approved retention policy.
- Complete backend execution passed: 50/50 suites and 539/539 tests, zero
  snapshots, 69.786 seconds. This includes the SSO and security-anomaly
  database suites that were previously blocked on the audit workstation.
- The first complete-suite attempt reached Node's default heap limit after the
  guard and migrations passed. The identical image passed after setting a
  3 GiB Node heap inside a 4 GiB test container; no application source was
  changed to obtain the passing result.
- Successful execution `pr013-database-test-9vqxd` completed in 1m24.22s.
  The isolated database, temporary secret and Cloud Run job, both temporary
  image digests and all three build-only local files were removed; absence was
  verified.

PR-013 is complete. The checked-in GitHub Actions PostgreSQL 15 service now
provides repeatable enforcement on pushes and pull requests. This technical
test completion is not clinical UAT.

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
- This initial live run established the deployment gap. It is superseded by the
  current-candidate checkpoint below. Detailed matrix and evidence interpretation are in
  `docs/security/pr-014-admin-user-permission-uat.md`.

### 2026-08-18 current-candidate checkpoint

- Current source passed 97/97 locally and was deployed as healthy zero-traffic
  revision `ist-triage-demo-pr014c-47e10f3` using the dedicated runtime service
  account with persistent MFA enabled.
- Non-mutating live checks passed. Elevated mutation UAT stopped at authentication
  because the remediated runtime correctly returned HTTP 401 for the legacy shared
  administrator password. No synthetic user, role or permission mutation occurred.
- PR-014 therefore remains open and blocked by the PR-001 operator credential/MFA
  custody gate. Once custody is available, execute the guarded exact-HTTP matrix,
  verify cleanup and record the resulting audit evidence.

The PR-001 custody gate was completed later on 2026-08-18. PR-014 is now unblocked
and ready for the guarded exact-HTTP matrix; it is not yet closed.

### 2026-08-18 governed-account browser finding

- The operator authenticated with the protected Platform Administrator account
  and completed PAM elevation. The live UI created a controlled
  `remote_triage_nurse` account and displayed a random temporary password once.
- Immediate sign-in with that exact issued credential returned the generic HTTP
  401 authentication failure. Current source explains the result: dynamically
  created passwords are stored in the in-memory demo-password map, while
  production mode permits that map only when demo credentials are explicitly
  enabled. Enabling shared/seeded demo credentials would violate PR-001 and was
  not used as a workaround.
- The failed nurse login created no authenticated session. The administrator
  reauthenticated, completed a second PAM elevation and suspended the controlled
  account with the recorded cleanup reason.
- This is a real PR-014 closure defect and also blocks PR-007 browser workflow
  evidence. PR-014 requires a durable governed credential lifecycle (or approved
  enterprise identity path) that works with demo credentials disabled, followed
  by successful create-user/login UAT and cleanup verification.

### 2026-08-19 governed-account remediation and checkpoint

- Commit `0e30f43e74e25f619e22c5ee3830133b9e2bc92f` implements durable governed
  credentials without re-enabling seeded/demo passwords. Governed email/username
  identifiers are encrypted with AES-256-GCM and located through an HMAC blind
  index; temporary passwords are persisted only as versioned scrypt hashes in
  the existing governed account tables.
- Focused governed-account authentication passed 2/2 and the existing PR-014
  create-user/permission boundary suite passed 57/57. The complete remediation
  focus rerun passed 346/346 backend assertions (including duplicate retained
  deployment-copy discovery), the cockpit protocol suite passed 4/4, and both
  backend and frontend TypeScript checks passed.
- Cloud Build `226268bd-2d2b-4f11-9724-573ed0b042de` produced immutable digest
  `sha256:ee5e153c285cb7d6decd5574a7eb82b5e31864ac4b6203ce3694f5fdba6c4c81`.
  Healthy zero-traffic revision `ist-triage-demo-pr014g-0e30f43` reports the
  exact commit/build provenance, all eight persistence flags and dedicated
  identity `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`.
- Browser authentication with the protected Platform Administrator password
  reached the mandatory MFA challenge on the new candidate, proving the
  credential and first-factor path. The operator did not have a current MFA
  code during this checkpoint, so no PAM mutation was attempted and no test
  account was created.
- Remaining PR-014 closure evidence is deliberately narrow: complete MFA/PAM,
  create one controlled nurse, sign in with its issued temporary password,
  complete nurse MFA enrollment, verify authorization/persistence, and remove
  the controlled record through the approved cleanup path. PR-014 is not closed
  until that evidence exists.

### 2026-08-19 production compatibility incident and recovery

- The PR-010 append-only database migration had been applied while production
  traffic still served legacy revision `ist-triage-demo-00035-wlm`. That
  revision wrote the pre-chain audit shape, so the database trigger rejected
  queue-claim audit inserts and the public demo returned HTTP 500. GCP request
  logs tie the failures directly to `ist-triage-demo-00035-wlm`.
- The database trigger was not weakened or removed. After confirming exact
  runtime provenance, all eight persistence controls, public UI availability,
  successful administrator password-plus-MFA authentication and no candidate
  error logs, production traffic was changed to 100% revision
  `ist-triage-demo-pr014g-0e30f43`.
- Both the direct Cloud Run URL and `https://triaged.irisstar.tech` then reported
  commit `0e30f43e74e25f619e22c5ee3830133b9e2bc92f`, build
  `226268bd-2d2b-4f11-9724-573ed0b042de` and the promoted revision. Protected
  queue access returned the expected HTTP 401 without credentials instead of
  HTTP 500, and the post-cutover candidate error-log query returned no entries.
- The promoted revision runs as the dedicated keyless service account and
  immutable digest
  `sha256:ee5e153c285cb7d6decd5574a7eb82b5e31864ac4b6203ce3694f5fdba6c4c81`.
  The former revision is not a database-compatible rollback target. Any
  rollback must use a revision containing the chained audit writer.

### 2026-08-19 seeded-to-governed credential transition

- Commit `73beab907e2cf1931dc43706e45d8414cdbc1afa` adds a PAM-protected
  existing-user credential action. It preserves identity and role assignments,
  generates a 24-character random temporary password, persists only a versioned
  scrypt hash and records a high-risk `USER_GOVERNED_CREDENTIAL_ISSUED` audit
  event. It does not enable `ALLOW_DEMO_CREDENTIALS`.
- Focused credential, PR-014 boundary, role-governance and audit-ledger suites
  passed 145/145; backend and frontend TypeScript checks passed.
- Cloud Build `9f9d365b-b973-4509-b59f-8c3c4225a4f7` produced immutable digest
  `sha256:0c96cee19f3f286a5b204efbac29a0dff7f570ee0c67f6e451cbd787290e65d7`.
  Revision `ist-triage-demo-cred-73beab9` passed zero-traffic provenance,
  persistence, dedicated-identity, authorization-negative and error-log gates,
  then received 100% traffic.
- The authorized Platform Administrator issued governed temporary credentials
  for Layla Hassan (`remote_triage_nurse`) and Khalid Al-Marri
  (`triage_service_manager`). Direct production authentication accepted both
  passwords and returned `mfaEnrollmentRequired=true`; neither returned invalid
  credentials. Temporary passwords and enrollment tokens are deliberately not
  recorded in this register.
- Remaining evidence: each user must complete first-login MFA enrollment, then
  Layla must complete the nurse claim/release path and Khalid must confirm the
  manager-only surface. Verify the resulting chained audit events afterward.

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
- Source remediation and technical deployment evidence are complete. The immutable
  deployed candidate passed 25/25 adversarial ambiguity/no-match cases; the temporary
  execution job was removed and production traffic was unchanged. Closure now
  requires a named qualified Clinical QA reviewer signature. The review artifact is
  `docs/protocol-review/pr-015-five-protocol-adversarial-matrix.md`.
- 2026-08-19 refresh passed 100/100 backend lineage cases per source copy,
  10/10 nurse-override UI cases and frontend TypeScript validation. Git
  comparison confirmed the matching and override implementation is unchanged
  between the prior deployed 25/25 evidence image and current SOC2 remediation
  image commit `74985a1`; no redeployment was required. Named Clinical QA
  signature remains the sole closure gate.

## 2026-08-19 SOC2 remediation cutover and demo testing exception

The owner changed the operating sequence: remediation is now performed on SOC2,
while demo remains available for synthetic end-user testing. This supersedes the
earlier plan to decommission SOC2 before completing the remaining remediation UAT.
It does not remove the eventual PR-008 consolidation requirement.

After validating the demo administrator transition, the owner explicitly froze the
demo environment. No remaining remediation deployment, database operation,
credential change, traffic change or UAT mutation may target demo; all subsequent
remediation work and evidence must target `ist-triage-soc2` and
`ist_triage_soc2` unless the owner issues a new explicit instruction.

SOC2 deployment evidence:

- Cloud SQL database `ist_triage_soc2` was migrated through all 20 repository
  migrations, including the append-only audit-chain and approved 365-day retention
  migrations. The separate database, application user and secrets were preserved;
  demo data was not copied into the SOC2 database.
- Missing SOC2 secrets were created for the administrator bootstrap, MFA encryption
  and dedicated audit connection. Secret payloads are not recorded here.
- Audit login `ist_audit_writer_soc2` receives only membership in the restricted
  audit role. Live verification through that connection reported 2,376 explicitly
  bounded legacy unsigned rows, one initial signed/linked event, and a denied
  `UPDATE`. Subsequent authenticated checks append additional signed events.
- Immutable image digest
  `sha256:0c96cee19f3f286a5b204efbac29a0dff7f570ee0c67f6e451cbd787290e65d7`,
  Git `73beab907e2cf1931dc43706e45d8414cdbc1afa` and build
  `9f9d365b-b973-4509-b59f-8c3c4225a4f7` were deployed first at zero traffic.
- Revision `ist-triage-soc2-00078-qul` passed health, all-eight-persistence,
  provenance, governed synthetic-monitor password, mandatory MFA and authenticated
  queue checks, then received 100% SOC2 traffic.
- All six `*-soc2` Cloud Run jobs now use
  `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`; the two monitoring
  secrets grant accessor only to the runtime identities that require them. No job
  was executed as part of the IAM change.

Demo testing evidence:

- Zero-traffic revision `ist-triage-demo-00070-nuh` deliberately sets
  `ALLOW_DEMO_CREDENTIALS=true` and `MFA_MANDATORY=false`. This exception is limited
  to the `MOCK_MODE=true`, synthetic-data demo environment.
- Seeded Layla and Khalid authentication passed with the expected
  `remote_triage_nurse` and `triage_service_manager` roles, respectively, and both
  completed an authenticated queue read before promotion.
- The same revision then received 100% demo traffic, and both logins were repeated
  successfully through the primary demo URL. SOC2 remains governed and
  MFA-enforced.
- At the owner's request, Rishma's existing demo-only MFA credential was moved to
  `reset_required` through the governed reset service; the action generated the
  high-risk `MFA_RESET_COMPLETED` audit event and found no active sessions to
  revoke. SOC2 credentials were not changed.
- Fresh zero-traffic revision `ist-triage-demo-00072-luk` proved that the seeded
  Rishma credential signs in without an MFA challenge, retains
  `platform_super_administrator`, and can read the protected administrator roles
  surface. The revision then received 100% demo traffic and the password-only login
  was repeated successfully through the primary demo URL.

## 2026-08-19 PR-004 and PR-014 SOC2 closure UAT

The guarded live runner was extended to support the authoritative SOC2 endpoint and
mandatory MFA for each protected test role. Backend TypeScript validation passed.
The demo service and database were not accessed or changed during this UAT.

Execution target and controls:

- Primary target: `https://ist-triage-soc2-gv6v4zyvuq-ww.a.run.app`, revision
  `ist-triage-soc2-00078-qul`; zero-traffic identity-loading revision
  `ist-triage-soc2-00080-fax` was not promoted.
- Three temporary governed identities were created with exactly one protected role
  each: Platform Administrator, Service Manager and Triage Nurse. All three completed
  mandatory TOTP enrollment. Their random passwords and TOTP seeds were held only in
  six temporary Secret Manager records and were never printed or documented.

Exact-HTTP results:

- Anonymous create user: 401.
- Service Manager create user: 403.
- Triage Nurse grant permission: 403.
- Platform Administrator create user before PAM elevation: 403.
- Administrator password + MFA authentication: 202 then 200; PAM elevation: 200.
- Valid controlled user creation: 201; issued password accepted and returned the
  expected mandatory-MFA enrollment response.
- Duplicate email: 409; external email: 400; unknown role: 400.
- Conflicting Nurse + Service Manager role assignment: 409.
- Reversible `reports.view` nurse grant: 200 and immediately visible; manager attempt
  to grant it: 403; conflicting `privacy.reveal.approve` nurse grant: 409.
- Resource-specific audit lookup: 200.
- Permission rollback and controlled-user deactivation: 200.

Independent post-run verification proved the reversible permissions were absent and
no active controlled PR-014 user remained. The authenticated audit-integrity endpoint
returned `valid=true`, 33 checked signed events and 2,376 explicitly bounded legacy
unsigned events. The three UAT identities were deactivated; each subsequent login
returned 403. The administrator self-deactivation guard correctly required an audited
maintenance cleanup, which recorded `USER_STATUS_CHANGED`. All six temporary secrets
were then deleted. Machine-readable evidence is
`test-results/pr014-live-uat-20260819061647.json`.

## 2026-08-19 PR-007 SOC2 nurse workflow closure UAT

The guarded `test:pr007:soc2-live` runner targets only the primary SOC2 URL and
requires the governed synthetic-monitor nurse password plus TOTP secret. The monitor
was bound to the existing `org_ist_tech` tenant so tenant enforcement remained
active; demo was not accessed or changed.

The live sequence passed password + MFA authentication, controlled case creation,
claim, answer, two incremental IAQ patches, two incremental TAQ patches, approval
lineage, HOLD, RESUME and a database reload. The reload retained every earlier map
key. Complete synthetic vitals and the selected abdominal-pain protocol were saved,
the case moved to `DISPOSITION`, and an idempotent partial retry returned 200. A new
post-disposition TAQ key returned 409; the final reload proved the rejected key was
absent and all earlier IAQ/TAQ/approval data remained intact. Release returned 200.

Two setup attempts were safely rejected before clinical mutation: an invalid HRMS
identity returned 404, and an unbound-tenant claim was denied. The one controlled
record created by the tenant-denial attempt and the final successful UAT record were
soft-deleted through audited SOC2 maintenance after exact ID and synthetic job-title
validation. Machine-readable evidence is
`test-results/pr007-soc2-live-uat-20260819063049.json`.
