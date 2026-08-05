# Validation Report - 2026-08-05 (register-build pass)

_Named "final-validation-report.md" per the mandated deliverable list, but
this is a **snapshot at the register-build milestone**, not a close-out
of the whole program - the program itself is far from finished (284 rows
not yet independently re-verified). This report will be updated/replaced
at the end of each subsequent batch._

## Commands run and results

```
npx tsc -p tsconfig.json --noEmit
```
Result: clean, zero errors.

```
npx jest --runInBand
```
Result: **688 passed, 4 failed, 692 total** (30 of 31 suites passed).
Failures isolated to `tests/ssoOidcFlow.test.ts` (4 tests), all with the
same root cause: `PrismaClientInitializationError: Can't reach database
server at 127.0.0.1:5433`. Confirmed via `netstat`/`ps` that no Cloud SQL
proxy tunnel process is currently listening on that port in this session
- this is a local environment/connectivity gap, not a code regression
(the same suite passed cleanly earlier this engagement when the tunnel
was active). **Action needed before relying on this number**: restart
the local Cloud SQL proxy tunnel and re-run this suite in isolation to
confirm a clean pass, per this engagement's established pattern for this
exact flakiness class.

```
git status --porcelain
git log --oneline -5
git rev-list --count origin/main..HEAD
```
Result: working tree has only this session's own new/untracked doc
files (no destructive state); 23 commits ahead of `origin/main`; nothing
pushed (per instruction, no push/reset/rebase/force-checkout performed).

## What was NOT run this pass (and why)

- **Frontend jest / typecheck** - out of scope for this pass (register
  building and backend-only closures); will run when a UX/frontend batch
  is proposed.
- **Accessibility tests, dependency/container scanning, Terraform
  validate, load tests** - not applicable yet; no code changed this pass
  beyond documentation-generation scripts (`scripts/_genComplianceRegister.py`,
  `scripts/_categorizeRemaining.py`), which touch no application runtime
  code.
- **DB-backed integration checks** (soft-delete/org-export re-verification)
  - not re-run this pass since no related code changed; last verified
  2026-08-05 earlier in this engagement.

## Register-build validation

- 459 rows extracted programmatically from the live xlsx (not retyped) -
  spot-checked against the earlier compliance-percentage summaries in
  this conversation (396 N/A-excluded scored rows + 63 N/A = 459,
  reconciles correctly).
- Batch-1 candidate rows (CO.14, IS.19, IS.24, IS.43, IS.49) - full
  requirement text and remarks pulled and quoted verbatim in
  `mandatory-closure-plan.md`, not summarized from memory.

## Outstanding integrity item

The prior handover document (`docs/handover-2026-08-05.md`, written
earlier today) states "692/692 passing" - this is now known stale per
the finding above. That document is being left as-is (a dated snapshot
of what was true at the time it was written) rather than edited
retroactively, but this report is the authoritative current figure.
