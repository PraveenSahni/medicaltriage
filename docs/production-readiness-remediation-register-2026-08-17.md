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
| PR-006 | Critical | Care advice can fall back to every item sharing a disposition code | Clinical Engineering | Source complete; deployment pending | Exact-question advice enforced; implicit fallback prohibited; exhaustive regression matrix |
| PR-007 | High | Free-form JSON overwrite remains in legacy workspaces/scripts | Engineering | Source complete; deployment pending | Backend merge invariant; legacy caller reconciliation; lifecycle regression tests |
| PR-008 | High | Shared Cloud SQL instance is a common boundary | Cloud owner | Risk accepted — temporary remediation topology | SOC2 is temporary and will be decommissioned after customer security validation; one production system remains |
| PR-009 | High | Demo and scheduled jobs use default Compute service account | Cloud Security | Open — live access required | Dedicated keyless runtime identity; scheduled-workload disposition; least-privilege IAM and canary evidence from `triage-502706` |
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

Outstanding deployment gates:

- Build from the isolated PR-006 commit and deploy to a no-traffic demo canary.
- Exercise multiple real protocols in the browser: auto-selected and nurse-overridden protocol, IAQs, every TAQ tier, terminal disposition, exact advice, all-No behavior, hold/resume and handoff.
- Confirm no generic or same-disposition sibling advice appears in network responses or the UI; record protocol ID, question ID, advice IDs and revision for each run.
- Promote demo only after clinical review; repeat on SOC2 before marking PR-006 fully closed.

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

Outstanding deployment gates:

- Deploy the isolated PR-007 commit to a no-traffic demo canary.
- Against Cloud SQL, submit separate IAQ, TAQ and approval PATCH requests, reload through a separate application instance, and verify every key remains present.
- Repeat across active cockpit, legacy completion path, hold/resume and handoff; verify a post-disposition new-answer attempt returns HTTP 409 without changing stored JSON.
- Promote demo only after canary evidence; repeat against SOC2 before marking PR-007 fully closed.

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

## Change log

- 2026-08-17: PR-001 source remediation completed and verified locally. Production runtime now fails closed for shared and seeded demo credentials unless `ALLOW_DEMO_CREDENTIALS=true` is deliberately configured. Focused authentication/session regression: 35/35 tests passed; backend typecheck passed. Deployment closure remains pending.
- 2026-08-17: PR-002 elevated to next critical remediation with an explicit end-to-end provenance chain and closure criteria.
- 2026-08-17: PR-002 source implementation added: clean-tree build guard, full-SHA image tag, OCI labels, Cloud Build ID, immutable-digest output and live runtime provenance fields. Build/deployment evidence remains pending.
- 2026-08-17: PR-003 started. Added a fail-closed production persistence policy and safe runtime posture reporting; database and canary validation remain in progress.
- 2026-08-17: PR-003 source validation completed: backend typecheck passed and 32/32 runnable focused tests passed. Two real PostgreSQL tests, database schema evidence and canary activation remain open pending interactive gcloud reauthentication.
- 2026-08-17: PR-004 and PR-005 source remediation completed around three protected system roles plus governed custom roles. SoD validation, durable schema/API, Platform Administrator UI, audit behavior and documentation were added; all focused and adjacent recorded suites passed. Database migration and no-traffic canary evidence remain pending.
- 2026-08-17: PR-006 source remediation completed. Questions, TAQs, disposition and care advice now share one selected protocol lineage; care advice requires exact question linkage and fails closed without it. Repeated exhaustive and negative regression tests, backend build and both typechecks passed. Canary and live multi-protocol clinical verification remain pending.
- 2026-08-17: PR-006 validation was tightened to the five licensed protocols only. A named 30-case cross-protocol matrix and three exhaustive passes over all 126 licensed TAQs passed; synthetic sample protocols are not counted as clinical validation evidence.
- 2026-08-17: PR-007 source remediation completed. Structured IAQ, TAQ and approval JSON now merge at the backend boundary; legacy callers preserve existing approval lineage; idempotent post-disposition retries remain allowed while new clinical answers stay locked. Focused, adjacent and complete frontend regression suites passed. Cloud SQL canary verification remains pending.
- 2026-08-17: PR-008 risk decision recorded. The shared Cloud SQL instance is accepted only for the temporary remediation topology; SOC2 will be safely decommissioned after customer security validation, leaving one authoritative system.
- 2026-08-17: PR-009 evidence correction: `aimltriage` was the wrong project and its inventory is invalid for closure. The authoritative target is `triage-502706`; its demo baseline still uses the default Compute service account. PR-009 is open pending authorized live inventory, least-privilege cutover and canary evidence.
