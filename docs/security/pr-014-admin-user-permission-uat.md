# PR-014 Admin Create-User and Permission UAT

Date: 2026-08-17

## Scope and safety

This UAT covers the complete finite set of equivalence classes and declared
schema boundaries for `POST /api/v1/admin/users` and
`POST/DELETE /api/v1/admin/roles/:code/permissions`. It does not claim to test
every possible Unicode string or network failure. Destructive volume and rate
boundaries run only against the isolated application process. Live execution
uses synthetic data, a reversible permission change, audit verification and an
approved deactivation/instance-reset cleanup path.

## Automated boundary matrix

The executable matrix is
`tests/pr014AdminUserPermissionBoundaries.test.ts`.

| Area | Boundary classes covered |
|---|---|
| Authentication | no session (`401`), nurse (`403`), service manager (`403`), platform administrator without PAM elevation (`403`), elevated administrator |
| Required user fields | absent/empty; minimum 1; maximum 200; over-limit 201 |
| Mobile | minimum 1; maximum 40; over-limit 41 |
| Reason | minimum 1; maximum 500; empty; over-limit 501 |
| Email | malformed, wrong domain, suffix-confusion domain, mixed case normalization, case-insensitive duplicate |
| Roles | missing, empty, 11-item over-limit, unknown, each of the three protected system roles, duplicate code normalization, conflicting multi-role assignment |
| Credential handling | temporary password returned once; absent from user-list response; created user can authenticate |
| Permission grant | unauthenticated, both non-admin roles, admin without elevation, valid grant, duplicate/idempotent grant, unknown role, unknown permission, empty permission, reason 1/500/501 |
| Security invariants | segregation-of-duties conflict rejected, effective permission visible immediately, `Cache-Control: no-store`, 21st mutation rate-limited with `Retry-After` |

Execution command:

```powershell
npx.cmd jest tests/pr014AdminUserPermissionBoundaries.test.ts tests/roleGovernance.test.ts tests/rolePermissionManagement.test.ts tests/adminAccessBifurcation.test.ts tests/pamElevation.test.ts --runInBand --silent
```

Result: **97/97 passed** across five suites. The dedicated PR-014 file contains
56 cases; the adjacent role-governance, permission, access and PAM suites add
41 regression cases.

## Live GCP demo execution

Target: `https://triaged.irisstar.tech`, project `triage-502706`.

The guarded runner is `src/scripts/pr014LiveUat.ts`; it refuses targets outside
the approved synthetic demo allow-list and requires
`ALLOW_LIVE_ADMIN_UAT=PR014`.

The live run produced 24 HTTP evidence records: **22 passed and 2 failed**.

Passed live controls included:

- anonymous create denied `401`;
- nurse/service-manager mutations denied `403`;
- administrator mutation denied without PAM elevation `403`;
- MFA enrollment, confirmation and PAM elevation `200`;
- synthetic user creation `201` and immediate login `200`;
- duplicate email `409`, out-of-domain email `400`, unknown role `400`;
- reversible permission grant and immediate readback `200`;
- user-creation audit history `200`; and
- report-permission rollback and primary test-user deactivation `200`.

Failed live controls:

| Case | Expected | Actual | Meaning |
|---|---:|---:|---|
| `UAT-012` conflicting nurse + service-manager assignment | `409` | `201` | Deployed revision does not contain the current assignment-time SoD enforcement. |
| `UAT-017` grant reveal-approval to requester nurse role | `409` | `200` | Deployed revision does not contain the current role-permission SoD enforcement. |

These two controls pass in the current source checkout. The evidence therefore
shows deployment drift, not an unresolved local implementation failure.

## Cleanup and recovery evidence

The initial `finally` path revoked `reports.view` and deactivated the primary
synthetic user. Because the stale deployment unexpectedly accepted two
negative mutations, the demo was rolled to the same unchanged image in fresh
Cloud Run revisions to clear its non-persistent synthetic identity state.

Final recovery revision: `ist-triage-demo-00035-wlm`, receiving 100% traffic.

Read-only post-recovery verification passed:

- runtime environment `200`, `environment=demo`, `dataProfile=synthetic`;
- administrator login `200` without an unexpected MFA challenge;
- roles list `200`, with neither temporary permission present; and
- users list `200`, with no active PR-014 synthetic account.

## Initial closure decision (superseded by the checkpoint below)

PR-014 remains **open**. Deploy an image built from the current approved Git
commit, rerun this live matrix, require both SoD cases to return `409`, and
retain the HTTP evidence. The former SOC2 environment was not mutated during
this run; if it remains a closure target, it requires the same successful
matrix or an approved decommissioning decision.

## 2026-08-18 zero-traffic deployment checkpoint

- Current source again passed the complete 97/97 local boundary and adjacent
  security matrix; backend and frontend TypeScript checks passed.
- Image digest
  `sha256:52a72b053c57bee3977d15f80022cb3645033160f5a673ff1c988b9843d63feb`
  was deployed as zero-traffic revision
  `ist-triage-demo-pr014c-47e10f3`, tagged `pr014-canary`, with the exact Git
  SHA and Cloud Build ID in runtime provenance. Production traffic remained
  100% on `ist-triage-demo-00035-wlm`.
- A proposed ephemeral-MFA revision was rejected by the production
  fail-closed configuration because durable MFA is mandatory. It received no
  traffic and the required `MFA_DB_PERSISTENCE=true` setting was restored.
- Non-mutating live verification returned runtime HTTP 200. The old shared
  administrator password returned HTTP 401, as required by PR-001's current
  source. Therefore the PAM-elevated mutation matrix cannot be authorized
  until an operator-controlled login and TOTP seed are available.
- No synthetic user, permission, MFA credential or session mutation was made.
  The runner now treats failed HTTP evidence in verify/recovery modes as a
  process failure; the previous implementation could print a clean-state
  message after failed authentication.

PR-014 remained open and explicitly blocked by the PR-001 operator credential
and MFA-custody gate at this checkpoint. The control was not bypassed.

## 2026-08-18 operator-custody update

The authorized operator completed fresh TOTP enrollment and a successful protected
Platform Administrator login on the current remediation candidate. PR-001 is closed;
PR-014 is now unblocked and ready for the guarded elevated HTTP matrix. No password,
TOTP secret, enrollment token or one-time code is recorded here.
