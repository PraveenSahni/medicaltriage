# Business Decision Register

_Rows blocked on a decision only a business/clinical/legal/privacy owner
can make - engineering cannot honestly decide these unilaterally.
Generated 2026-08-05._

## IG.09 - Retention decision

**Decision recorded 2026-08-17:** **365 days** for completed operational
triage queue records, decision `PR-011-2026-08-17`.

- **Executable scope**: `TriageQueueItem` records with status `COMPLETED`.
- **Retention trigger**: the record's `updatedAt` timestamp while completed.
- **End-of-period action**: `archive_then_delete` after 365 days.
- **Override**: active record-level or organization-level legal holds always
  prevent archive and deletion.
- **Implementation status**: policy migration, fail-closed execute invariant,
  transactional legal-hold recheck and regression tests are complete in
  source. Isolated deployment rehearsal remains required.
- **Excluded from this decision**: `AviationTriageEncounter` and the
  append-only `AuditEvent` ledger are not automatically deleted. A separate
  dependency-safe archive/export procedure and approved change are required
  before destructive execution can cover either record class.
- **Policy evidence**: `docs/retention-policy.md` is the canonical policy;
  the PR-011 record is in
  `docs/production-readiness-remediation-register-2026-08-17.md`.

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
