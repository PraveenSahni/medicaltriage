# AiMLTriage remediation and SOC2 handover — 2026-08-19

## 1. Purpose and authority

This handover records the remediation, implementation, deployment, regression,
operational decisions and remaining approval gates completed collaboratively through
2026-08-19. It is a practical continuation guide, not a substitute for the controlled
registers.

Authoritative companion records:

- `docs/production-readiness-remediation-register-2026-08-17.md`
- `docs/production-readiness-approval-closure-pack-2026-08-19.md`
- `docs/retention-policy.md`
- `docs/security/audit-ledger-remediation.md`
- `docs/infrastructure/pr-012-certificate-remediation.md`

The four-gate closure rule remains: source/config evidence, automated tests,
deployment evidence and live verification. A source commit alone is not closure.

## 2. Current release decision

**Overall decision: NO-GO.**

The current SOC2 candidate is technically deployed and regression-tested, but the
following named approvals or decisions remain mandatory:

1. PR-006 and PR-015 — qualified Clinical QA approval of the five-protocol clinical
   matrices and observed nurse-override/care-advice outcomes.
2. PR-010 — Security Architecture approval of the append-only/chained-ledger design
   and accepted legacy unsigned boundary.
3. PR-011 — Privacy/Legal approval before enabling recurring destructive retention
   execution. The 365-day policy and legal-hold controls are technically active;
   scheduled execution remains deliberately dry-run.
4. PR-008 — accepted temporary shared Cloud SQL boundary. Final consolidation or
   SOC2 decommissioning requires a separately approved change with backup/restore
   evidence.

No one should translate technical pass results into clinical, legal or production
approval without the named approver completing the closure pack.

## 3. Environment map

### GCP project and region

- Project: `triage-502706`
- Project number: `1096520215793`
- Region: `me-central1`
- Current operator used for the controlled deployment: `sahni.ps@gmail.com`
- Dedicated runtime service account:
  `ist-triage-cloudrun-sa@triage-502706.iam.gserviceaccount.com`

### SOC2 remediation environment

- Service: `ist-triage-soc2`
- URL: `https://ist-triage-soc2-gv6v4zyvuq-ww.a.run.app/`
- Current revision: `ist-triage-soc2-release-2efa598`
- Traffic: 100% to the revision above
- Git SHA exposed by runtime:
  `2efa598063da3bb19f0bd9140888003e2132bf77`
- Cloud Build: `37709746-d005-4775-814f-b94723230b4e`
- Immutable image digest:
  `sha256:91beb285e085afa047bf31a562ae39661cb98bdbe948d323c943e478b5af21ba`
- Runtime label: `SOC2-STAGING`
- Data profile: synthetic; no PHI is authorized
- Required persistence flags reported true: queue, sessions, MFA, audit events,
  role permissions, reveal workflow, reveal anomaly and security anomaly

### Demo environment

- URL: `https://triaged.irisstar.tech/`
- Revision: `ist-triage-demo-00072-luk`
- Git SHA: `73beab907e2cf1931dc43706e45d8414cdbc1afa`
- Cloud Build: `9f9d365b-b973-4509-b59f-8c3c4225a4f7`
- Purpose: curated synthetic user testing
- Explicit exception: seeded Demo credentials may be enabled only through
  `ALLOW_DEMO_CREDENTIALS=true`; this exception must never be copied to SOC2 or
  a live-data environment.

The Demo service was intentionally not changed during the final SOC2 release. SOC2
contains the later remediation commits and is the controlled validation target.

## 4. Final SOC2 release execution

The final release was performed from a clean detached worktree pinned to
`2efa598063da3bb19f0bd9140888003e2132bf77`.

Execution sequence:

1. Pushed four pending commits to GitHub `main`.
2. Submitted the exact clean worktree to Cloud Build.
3. Built backend and frontend successfully.
4. Pushed the immutable Artifact Registry image.
5. Deployed `ist-triage-soc2-release-2efa598` at zero traffic.
6. Verified root HTTP 200, runtime provenance, service identity, persistence flags
   and absence of application/Prisma errors.
7. Ran focused backend/security/clinical regression: 95/95 passed.
8. Ran full frontend regression: 67/67 passed. Existing React test `act(...)`
   warnings remained non-failing and should be cleaned up separately.
9. Shifted SOC2 traffic to the validated revision at 100%.
10. Verified the live SOC2 root and runtime response after cutover.
11. Removed the clean temporary deployment worktree.

The tagged Cloud Run `/healthz` URL returned the already-known Google-side 404
routing behavior while `/` and `/api/v1/runtime/environment` returned 200. The
revision itself was ready and serving; this was not treated as an application
startup failure.

## 5. Important application functionality added after the current Demo SHA

### Governed manual call intake — `f8a51ef`

The nurse must complete the following sequence:

1. Enter Employee ID or Dependent ID.
2. Resolve the patient.
3. Enter the mandatory reason for call.
4. Create the queue call.
5. Continue into the existing protocol-driven triage workflow.

Implemented safeguards include stale-selection clearing, mandatory reason
validation, dependent-to-sponsor resolution and governed queue creation. This fixed
the manual Add Call internal-server-error path observed during local review.

Useful synthetic identifiers:

- Employees: `IST-00001` through `IST-26000`
- Legacy deterministic employees: `IST-1001`, `IST-10001`, `IST-2002`,
  `IST-20002`, `IST-2205`, `IST-3003`, `IST-90001`
- Dependents: `dep_ist_1001_child_01`, `dep_ist_1001_child_02`,
  `dep_demo_10001_child`

### Active-call focus — `07e0363`

While a nurse has an active call, sidebar navigation, direct route diversion,
browser-back diversion, Help and sign-out are blocked or restored to the cockpit.
The nurse must select Hold Call before leaving the active workflow. A maximum of
two held calls is enforced.

The 2026-08-25 manual regression follow-up added an explicit, visible hold-first
message. Back, Sign out and Help remain blocked during the active call, but now tell
the nurse to select Hold Call rather than appearing to do nothing. Browser-back
diversion shows the same instruction before restoring the cockpit route.

### Fit-to-fly governance — `fa98cb3`

- Emergency -> `RESTRICTED`
- Urgent -> `RESTRICTED`
- Routine plus safety-sensitive crew -> `MEDICAL_REVIEW_REQUIRED`
- After Emergency, Urgent and restriction-requiring destinations have resolved to
  `RESTRICTED`, any remaining severity with a fit-to-fly-review, duty-restriction
  or sickness-validation tag -> `MEDICAL_REVIEW_REQUIRED` (including Routine and
  Self-care)
- Missing severity -> `MEDICAL_REVIEW_REQUIRED`

Safety-sensitive titles include Pilot, Captain, First Officer, Flight Deck, Cabin
Crew and Cabin Supervisor. Shared destination does not determine severity; the
calculated protocol severity remains authoritative.

### Audit payload normalization — `74985a1`

Persisted ledger payloads were normalized so audit creation and chain verification
do not fail on the null-payload shape that produced:

`Invalid prisma.auditEvent.create() invocation: Null constraint violation`

### Legal-hold serialization — `be4f10b`, `ab9a7e6`

Concurrent legal-hold mutations are serialized at the database boundary. The live
hold-first race retained the governed record. The approved retention period is 365
days; recurring destructive execution remains dry-run pending Privacy/Legal approval.

### Consolidated application Help — `7aeb048` and related documentation commits

The Help section was reconciled with the remediation state and role model. It covers
manual intake, active-call focus, protocol/care-advice controls, fit-to-fly,
administration, audit, retention and PR-001 through PR-015 status. Restricted
administrator information remains role-gated.

### Test and repository hygiene — `34a27db`, `e12dc45`, `a757073`, `2efa598`

- Added a separate 13-case disposition-routing business pack outside production
  runtime code.
- Removed embedded credentials from executable test helpers; secrets must be supplied
  through the documented test environment variables.
- Preserved the canonical gated Demo seed map because Demo testing still depends on
  it and the runtime gate prevents SOC2 use.
- Archived superseded working papers and non-authoritative project artifacts under
  `docs/deprecated` with explicit notices.

## 6. PR-001 through PR-015 current disposition

| ID | Current status | Handover statement |
|---|---|---|
| PR-001 | Complete with Demo-only exception | Seeded/shared passwords fail closed in production by default. SOC2 uses governed credentials and MFA. |
| PR-002 | Complete | Git SHA, Cloud Build, immutable digest, Cloud Run revision labels and runtime provenance are traceable. |
| PR-003 | Complete | Eight required persistence controls enabled and reported by the runtime. |
| PR-004 | Complete | Three-role separation and conflict enforcement passed source, regression and SOC2 administrator UAT. |
| PR-005 | Complete | Exactly three protected product roles; Platform Administrator can create governed custom roles. |
| PR-006 | Technical verification complete; clinical sign-off pending | Exact-question care advice and fail-closed negatives passed the authenticated five-protocol matrix. |
| PR-007 | Complete | Incremental IAQ/TAQ/approval merging, hold/resume, retry and conflict behavior passed SOC2 nurse UAT. |
| PR-008 | Temporary risk accepted | Separate DBs/users/secrets share one Cloud SQL instance; final consolidation/decommission remains a controlled decision. |
| PR-009 | Complete | Demo/SOC2 services and scheduled jobs use the dedicated keyless runtime identity with scoped secret access. |
| PR-010 | Technical remediation complete; Security Architecture approval pending | Individual clinical/HITL payload signatures and the persisted append-only hash chain are complementary controls. The live durable audit path uses `securityAdmin.recordAuditEvent()` -> `persistence.persistSecurityAuditEvent()` -> `auditLedger.appendAuditEvent()`. The executable `scripts/configureAuditWriterRole.sql` provisions the restricted role; SOC2 execution evidence records `ist_audit_writer_soc2` membership, insert/select-only privileges, a verified signed chain, a denied live `UPDATE`, and the bounded legacy unsigned population. |
| PR-011 | Technical activation complete; recurring execute approval pending | 365-day retention and legal-hold race controls passed; scheduler stays dry-run. |
| PR-012 | Complete | Healthy serving chains documented and stale load-balancer resources removed. |
| PR-013 | Complete | Isolated PostgreSQL CI guard, migrations and database-backed Jest execution are established. |
| PR-014 | Complete | Admin create-user, duplicate/invalid/conflict cases, role boundaries, reversible permission grant and cleanup passed SOC2 UAT. |
| PR-015 | Technical matrix complete; Clinical QA signature pending | 25/25 ambiguity/no-match matrix and 100/100 clinical regressions passed with nurse override evidence. |

### 2026-08-25 manual regression failure corrections

The three failures recorded in the returned SOC2 manual regression workbook were
reproduced against the source contract and corrected:

1. Administrator MFA reset now requires a non-blank governance reason in the UI and
   submits the backend-required `{ reason }` payload instead of `{}`.
2. The Service Manager is removed from the Nurse Cockpit route gate. Queue clinical
   mutations and all triage endpoints now independently require
   `triage.workspace.view`; the manager retains read-only queue/operational access.
3. Active-call Back, Sign out, Help and browser-back attempts remain blocked and now
   display an explicit instruction to select Hold Call first.

Focused evidence: 88/88 backend role/responsibility tests passed, 6/6 frontend
contract/route/navigation tests passed, and backend build plus frontend typecheck
passed. Live SOC2 closure still requires deployment of this candidate and rerunning
the three corresponding workbook rows; local automated evidence does not by itself
prove the currently deployed revision.

## 7. Role and credential operating model

Protected product roles:

1. Triage Nurse
2. Service Manager
3. Platform Administrator

Seeded identities used for testing:

| Person | Login | Internal user ID | Role |
|---|---|---|---|
| Rishma M Sangma | `rishma@irisstar.tech` | `usr_platform_admin_10001` | Platform Administrator |
| Layla Hassan | `layla@irisstar.tech` | `usr_nurse_10001` | Triage Nurse |
| Khalid Al-Marri | `khalid@irisstar.tech` | `usr_manager_10001` | Service Manager |
| Fatima Al-Kaabi | `fatima@irisstar.tech` | `usr_senior_nurse_10001` | Triage Nurse |
| Sara Al-Emadi | `sara@irisstar.tech` | `usr_pediatric_nurse_10001` | Triage Nurse |

SOC2 does not accept the shared seeded passwords. The controlled activation process
is:

1. Rishma logs in with the Secret Manager-backed administrator credential and MFA.
2. Platform Administration -> Users.
3. Enter a mandatory governance reason on Layla or Khalid's row.
4. Actions -> Issue temporary credential.
5. Complete fresh MFA/PAM elevation.
6. Securely transmit the one-time displayed password outside this repository and
   outside audit screenshots.
7. Reset the user's old MFA only when required, with a separate reason and elevation.
8. User enrolls a new authenticator and verifies a subsequent password-plus-MFA login.

The administrator cannot provision their own credential through this action. Never
record passwords, MFA seeds, QR codes, recovery codes, cookies or session tokens in
documentation, test evidence or chat.

## 8. Manual regression workbook

The controlled execution pack is committed at:

`outputs/soc2-manual-regression-20260819/AiMLTriage_SOC2_Manual_Regression_Test_Pack.xlsx`

It contains 55 detailed cases covering:

- authentication and governed credential issuance
- MFA reset and re-enrollment
- role separation and conflict boundaries
- create-user administration
- manual employee and dependent calls
- five-protocol matching, ambiguity, no-match and override behavior
- exact-question care-advice lineage
- fit-to-fly outcomes
- active-call and two-held-call boundaries
- complete employee/dependent triage
- audit-ledger creation and chain verification
- 365-day retention and legal hold
- role-specific Help documentation
- runtime provenance and seeded-password rejection

The workbook includes controlled Status and Priority lists, tester comments, actual
results, evidence/defect references, execution date, approver/sign-off and a
formula-driven dashboard. No secret values belong in the workbook.

## 9. Immediate continuation plan

Execute in this order:

1. Rishma validates her SOC2 administrator login and MFA.
2. Issue governed credentials to Layla and Khalid.
3. Complete their MFA enrollment and role-boundary tests.
4. Run employee and dependent manual Add Call cases.
5. Execute the five-protocol PR-006/PR-015 matrix with qualified Clinical QA.
6. Validate fit-to-fly and active-call focus behavior.
7. Complete full employee and dependent calls and verify audit-chain health.
8. Run only non-destructive retention checks until Privacy/Legal signs recurring
   execute mode.
9. Record evidence and approvals in the workbook and closure pack.
10. Reconcile the remediation register and change the overall decision only after
    every named gate is actually closed.

## 10. Known cautions and deferred cleanup

- Demo and SOC2 are intentionally on different commits. Do not promote SOC2 changes
  to Demo in bulk; review and move them item by item after SOC2 UAT.
- SOC2 still reports a synthetic/mock data profile. No PHI is authorized.
- Frontend tests pass but produce non-failing React `act(...)` warnings in the
  CompletionStage suite; treat cleanup as test-quality work, not a hidden release
  failure.
- Many historical zero-traffic Cloud Run tags remain. Cleanup should be a separately
  scoped, inventory-first action and must not remove the live revision or required
  audit evidence.
- PR-008 consolidation/decommission must begin with exact database, secret, backup,
  restore and rollback inventory. Do not drop a database or SOC2 resource merely
  because the long-term intent is one system.
- Marketing website changes are separate from the triage application and were
  intentionally preserved.

## 11. Git handover state

Before this handover commit:

- Branch: `main`
- Remote: `origin/main`
- Application baseline: `2efa598`
- Remote and local application history were synchronized.
- The Excel execution pack and this handover were the only intended new tracked
  deliverables.

Temporary workbook builder files, rendered previews and inspection output are not
part of the controlled commit.
