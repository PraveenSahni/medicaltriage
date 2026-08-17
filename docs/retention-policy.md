# Data Retention Policy

Policy owner: Privacy + Legal + Engineering

Effective date: 2026-08-17

Decision reference: `PR-011-2026-08-17`

Approved retention period: **365 days**

## 1. Policy statement

Completed operational triage queue records are retained for **365 days**.
The retention clock starts from the record's `updatedAt` timestamp while its
status is `COMPLETED`. After 365 days, an eligible record is processed using
the approved `archive_then_delete` mode.

The executable policy is identified as
`TRIAGE_QUEUE_ITEM_COMPLETED` and applies to `TriageQueueItem` records only.
The application must not use a shorter default or a command-line override
when deletion is executed.

## 2. Legal hold precedence

An active record-level or organization-level legal hold overrides the
365-day deletion schedule. Held records must not be archived or deleted by
the retention job or a privacy-erasure request. Eligibility and both hold
levels are rechecked transactionally immediately before archive and deletion.

When a privacy-erasure request encounters held data, the protected records
remain in place and the request remains open for further governance action.

## 3. Execution and evidence

The scheduled retention process runs in dry-run mode unless `--execute` is
explicitly authorized. Execute mode fails closed unless the database contains
the active 365-day policy, decision reference `PR-011-2026-08-17`, legal basis,
and `archive_then_delete` mode. Operational evidence must record the cutoff,
candidate count, excluded holds, archived count, deleted count, failures, and
the deployed revision/image identity.

Production execution requires an isolated rehearsal and a legal-hold negative
test before the job is enabled against the authoritative database.

## 4. Scope and exclusions

This automatic 365-day policy covers completed `TriageQueueItem` records.
It does **not** authorize automatic deletion of:

- `AviationTriageEncounter` clinical records;
- the append-only `AuditEvent` security ledger; or
- any record protected by an active legal hold.

Those excluded record classes require a separately approved, dependency-safe
archive/export and destruction procedure. Customer, contractual, clinical,
legal, or regulatory requirements that require longer preservation take
precedence and must be recorded as a legal hold or a separately approved
policy change.

## 5. Implementation references

- Policy migration: `prisma/migrations/20260817210000_approve_365_day_retention/migration.sql`
- Governance invariant: `src/services/retentionGovernance.ts`
- Retention executor: `src/scripts/purgeExpiredQueueData.ts`
- Privacy executor: `src/scripts/fulfillPrivacyRequests.ts`
- Regression evidence: `tests/retentionGovernance.test.ts`
- Remediation record: `docs/production-readiness-remediation-register-2026-08-17.md`

This policy must be reviewed when the data model, legal obligations, customer
contracts, or approved record classes change. Any change to the number of days
or executable scope requires a new decision reference, migration, regression
test, and controlled deployment.
