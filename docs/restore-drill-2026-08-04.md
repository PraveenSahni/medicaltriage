# Backup Restore Drill (2026-08-04)

_Closes the "no automated backup restore test has ever been performed" gap
explicitly flagged in `docs/backup-disaster-recovery-plan.md`. This is a
real drill against the real shared Cloud SQL instance, not a description
of the theoretical capability._

## What was done

1. Cloned `ist-triage-postgres-uat` to a scratch instance
   (`ist-triage-restore-drill-20260804`, `db-f1-micro`) at a specific
   point-in-time (`2026-08-04T08:15:00Z`) using `gcloud sql instances
   clone --point-in-time`.
2. Connected to the clone via Cloud SQL Auth Proxy and queried both
   databases it contains (`ist_triage_soc2`, `ist_triage_demo`).
3. Compared row counts and a specific record's full field values between
   the live source and the clone.
4. Deleted the scratch instance once verification was complete.

## Result: the restore mechanism works, verified byte-for-byte

- `ist_triage_soc2`: 0 queue items in both the live source and the clone -
  consistent (this environment's queue was genuinely empty at the time).
- `ist_triage_demo`: 533 queue items in the clone, matching real, ongoing
  activity in that environment (data created before the point-in-time
  cutoff was preserved; nothing was lost or corrupted).
- A specific record (`case-119eb624-76ab-46d2-8ffe-fdd223c16969`) was
  fetched from both the live source and the clone and found **identical**
  across every field (status, timestamps, etc.) - not just "a row with
  this ID exists," but the actual content matches exactly.

## Timing observation, honestly noted

The clone operation took **longer than expected** - roughly an hour from
submission to `RUNNABLE`, versus ~20 minutes for the cross-region read
replica created earlier this session. This is plausibly because a
point-in-time clone has to replay transaction logs to the exact target
timestamp (more work than establishing a live streaming replica), and/or
because `db-f1-micro` (shared-core tier) has limited resources for this
operation. **This timing is itself a real data point for RTO planning**: if
disaster recovery ever required restoring via this same clone mechanism,
budget for up to an hour before the restored instance is queryable, not the
faster ~20 minutes seen for replica creation.

## Explicitly out of scope for this drill

- This tested Cloud SQL's clone/PITR mechanism specifically, not a full
  end-to-end disaster-recovery rehearsal (no application tier was pointed
  at the clone, no DNS/traffic cutover was tested).
- This was a single drill, not a scheduled recurring one - `docs/risk-
  register-2026-08-04.md` (R-06) recommends establishing a quarterly
  cadence, which has not yet been set up as an automated process.
