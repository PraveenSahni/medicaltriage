# Entitlement Remediation & Certification Reporting Procedure

_Closes Cloud CSQ IS.19 ("will you share user entitlement remediation and
certification reports with your customers, if inappropriate access may
have been allowed to customer data?"). Documents the real, already-built
underlying record and defines the process for sharing it with Qatar
Airways on request - the record itself is real and code-verified; this
document is the missing sharing procedure._

## Purpose

Confirms that when an access-entitlement review flags an inappropriate
grant, a durable, auditable record is produced, and defines how that
record is made available to Qatar Airways.

## Scope

Applies to the quarterly access-entitlement review job
(`access-entitlement-review-soc2`, Cloud Scheduler) and the certification
record it produces. Covers the soc2/demo environments this engagement's
remediation work applies to.

## Roles and responsibilities

- **System Administrator / Security lead**: owns the quarterly review job,
  reviews flagged findings, and is the named "reviewer identity" recorded
  in each certification event.
- **Compliance/Account owner**: receives and forwards Qatar Airways'
  request for a report; packages the underlying record into a
  customer-shareable summary (see "Operating procedure" below).

## Control requirements

1. The quarterly review must actually run and produce a durable record -
   not just an on-screen report.
2. Every review, whether or not it flags anything, must write a
   certification event - an empty/clean result must be provable, not just
   assumed.
3. The record must name the reviewer, the timestamp, and the full flagged
   list (if any) - not a summary count alone.

## Operating procedure

1. `access-entitlement-review-soc2` (Cloud Scheduler, quarterly) runs the
   entitlement review and writes a real `AuditEvent` row
   (`action: "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED"`, reviewer identity,
   timestamp, full flagged-account list) via
   `src/services/securityAdmin.ts` (see the `IS.18` remediation-action
   code path referenced at `src/services/securityAdmin.ts:2022-2023` and
   `src/routes/admin.ts:164`) - verified end-to-end against the real
   database via a production job execution
   (`docs/risk-register-2026-08-04.md`, item R-09).
2. **On a Qatar Airways request** for an entitlement remediation/
   certification report: the Compliance/Account owner queries
   `GET /api/v1/admin/audit-events` filtered to
   `action=ACCESS_ENTITLEMENT_REVIEW_CERTIFIED` for the requested date
   range, and compiles the real record (reviewer, timestamp, flagged
   accounts and their remediation status) into a shareable summary
   document.
3. If a review flagged an account with an inappropriate entitlement, the
   summary explicitly states what was found and what remediation action
   was taken (the account-status endpoint used for remediation is itself
   rate-limited and blocks self-suspension, per the same R-09 hardening).

## Review cadence

The underlying review runs quarterly (Cloud Scheduler-triggered). This
reporting procedure itself should be reviewed alongside the annual
risk-register review cadence (`docs/risk-register-2026-08-04.md`, next
review 2026-11-04).

## Approval requirement

This procedure documents an existing, already-operating technical control
and a new manual reporting step layered on top of it - no separate formal
approval gate is required to operate it, since it does not itself
authorize any account or data action (the underlying review job and
remediation actions carry their own existing authorization). Recommend
security-lead sign-off on the procedure's wording before first real use.

## Evidence generated

- `AuditEvent` rows with `action: "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED"`
  (one per quarterly run, durable, queryable).
- Whatever shareable summary document is produced per request (not
  itself a system-generated artifact - a manual compilation step from the
  real underlying record).

## Exceptions process

If a quarter's review job fails to run (e.g. a Cloud Scheduler outage),
this must be logged as a gap in the next available report rather than
silently skipped - the certification record's value depends on it being
provably continuous, not assumed.

## Related questionnaire IDs

IS.19 (this document). IS.17/IS.18 (the underlying review-and-remediation
control itself, see `docs/risk-register-2026-08-04.md` item R-09).

## Related implementation references

- `src/services/securityAdmin.ts:2022-2023` (remediation-action code path)
- `src/routes/admin.ts:164` (real remediation action for findings)
- `docs/risk-register-2026-08-04.md` item R-09 (full history and
  verification detail)
