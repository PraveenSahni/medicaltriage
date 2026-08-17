# Business Decision Register

_Rows blocked on a decision only a business/clinical/legal/privacy owner
can make - engineering cannot honestly decide these unilaterally.
Generated 2026-08-05._

## IG.09 - Retention period for `AviationTriageEncounter` and `AuditEvent`

**Decision recorded 2026-08-17:** the business owner approved a 365-day retention baseline for the operational triage/privacy scope. The executable policy implemented by PR-011 applies to completed `TriageQueueItem` records and remains subordinate to active record-level or organization-level legal holds. Clinical encounters and the append-only audit ledger are not silently deleted by this operational job; extending destructive execution to those record classes requires their own dependency-safe archive/export procedure and a new approved change.

- **Requirement ID**: IG.09 (extend `RetentionPolicy` beyond the single
  existing `TriageQueueItem`/`COMPLETED` policy).
- **Decision resolved for the current executable scope**: 365 days. The original broader question was how long a completed clinical encounter
  record (`AviationTriageEncounter`) and the security audit trail
  (`AuditEvent`) be retained before deletion?
- **Why engineering cannot decide this**: these are clinical-record and
  audit-trail retention periods, governed by regulatory/legal/clinical
  requirements (e.g. medical-record retention law in the relevant
  jurisdiction, aviation safety-record requirements, SOC 2 audit-trail
  expectations) - not a technical parameter. Inventing a number (e.g.
  "7 years") without that input would be a fabricated compliance
  control, not a real one.
- **Recommended decision**: adopt whichever retention period the
  clinical/legal function already uses for equivalent paper/EMR medical
  records at IST Health, and align `AuditEvent` retention to the SOC 2
  audit-trail norm (commonly 1-7 years depending on control type) once
  confirmed by the privacy/compliance owner.
- **Options and risk**:
  - *No retention policy (current state)*: audit trail and clinical
    records are kept indefinitely. Low data-loss risk, but no honest
    answer to IG.09, and unbounded storage growth.
  - *Short retention (e.g. 1-2 years)*: minimizes storage and privacy
    exposure, but risks conflicting with clinical/legal record-keeping
    obligations if a medical/legal need arises later.
  - *Long retention aligned to clinical/legal norms*: honest, defensible,
    likely the right answer - but requires the actual number from
    whoever owns that obligation.
- **Decision owner**: Clinical governance lead + Legal + Privacy/DPO +
  Business owner (joint decision, not a single owner).
- **Due date**: not yet set - recommend before the next questionnaire
  submission cycle.
- **Evidence required once decided**: a documented retention decision
  (this register updated with the real number), then the same
  engineering pattern already used for `TriageQueueItem`
  (`RetentionPolicy` row + a scheduled purge job) applied to the two new
  entity types.
- **Questionnaire response after approval**: Yes, once the policy row(s)
  exist and the purge logic is implemented and tested - not before.

## NFR-119 - QR-facing configurable alert thresholds (secondary business angle)

Beyond the technical "no CI credentials to write live GCP Monitoring
policy" blocker (see `production-execution-register.md`), there is also a
real product-scope decision here: should Qatar Airways get a
self-service UI/API to configure its own alert thresholds, or is an
engineer-mediated change-request process (current state) sufficient for
this relationship? That's a product/contractual decision, not an
engineering default - flagging it so it isn't silently assumed either way.

- **Decision owner**: Product owner + account/relationship manager.
- **Recommended decision**: engineer-mediated is proportionate for a
  single-customer bespoke deployment; revisit only if QR explicitly
  requests self-service configuration.
