# IS.07 PR status (branch-local note)

_Written 2026-08-06, on `feature/is07-drift-detection`._

## Status

**IS.07 remains Partial.** This PR does not move it to Yes and contains no
questionnaire-status change of any kind.

## Why the 3 compliance trackers are intentionally excluded from this PR

`docs/qr-compliance/mandatory-conversion-status.md`,
`docs/qr-compliance/production-execution-register.md`, and
`docs/qr-questionnaire-backlog-tracker.md` are **not modified in this
branch**, even though the original local commit (`f212571` on local
`main`) appended IS.07 evidence to all three.

Local `main` is currently 32 commits ahead of `origin/main`, and these 3
files were edited across many of those unpushed commits:

- `mandatory-conversion-status.md` **does not exist on `origin/main` at
  all** - it was created by an earlier, unrelated unpushed commit
  (`9df6e0f`, "docs: mandatory NFR/Cloud CSQ conversion-status plan").
  Appending to a file that doesn't exist upstream isn't a safe, isolated
  change.
- `production-execution-register.md` and `qr-questionnaire-backlog-tracker.md`
  both exist on `origin/main`, but have diverged significantly across the
  unpushed history - the patch context from the local commit no longer
  applies cleanly, and reconciling it correctly would require deciding how
  to fold in content from other, unrelated unpushed commits, which this PR
  does not do.

Per explicit instruction, this branch does **not** import `9df6e0f` or any
other unrelated compliance-planning commit, does not create a substitute
version of the missing tracker file, and does not manually copy historical
content from local `main`. The IS.07 operational evidence that *can* be
recorded in a self-contained way lives in
`docs/operations/infrastructure-drift-detection-runbook.md` and
`docs/architecture/infrastructure-as-code-scope.md` instead, both of which
are new files with no upstream conflict.

**These 3 trackers must be updated after this PR merges**, through a
separate reconciliation change that accounts for the full, real state of
`main` at that point (including whatever of the 32 currently-unpushed
commits have by then also been pushed/merged).

## Exact operational steps still required before IS.07 can move to Yes

1. Merge this PR into `main`.
2. Run the `infra-drift-detection` workflow on `main` (schedule fires
   automatically at 03:00 UTC once merged, or trigger manually via
   `workflow_dispatch`).
3. Prove keyless WIF authentication succeeds in that real GitHub Actions
   run (not just the local service-account-impersonation proxy validation
   done pre-merge).
4. Prove a clean run returns exit 0 through the actual workflow.
5. Prove a real, controlled synthetic drift (e.g. `max_instance_count`
   20→21) is detected by the actual workflow with exit 2.
6. Prove the workflow's GitHub-issue alert is created, and that a second
   drifted run before remediation deduplicates onto the same issue rather
   than opening a new one.
7. Prove the sanitized plan artefact is produced and retained (90 days)
   from a real run.
8. Revert the synthetic drift.
9. Prove a final clean exit-0 run through the actual workflow, and close
   the drift issue per the runbook.

Only once all 9 of these are observed as real GitHub Actions execution
evidence (not local-equivalent validation) does IS.07 move to Yes.
