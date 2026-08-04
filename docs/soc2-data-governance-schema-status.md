# Data Governance Schema: Current Enforcement Status

_Last updated: 2026-08-02. Written as part of the SOC 2 remediation roadmap
(Wave C). Reflects the real, current state of the code - not an aspirational
target state._

## Purpose

`prisma/schema.prisma` defines a full enterprise data-governance schema:
encryption policy, field-level masking, controlled "reveal" of masked data,
cryptographic key lifecycle, privacy/DSAR requests, retention policy, legal
hold, and sensitive-data export approval. **As of this writing, none of these
tables are read or written by any application code path.** They exist as
schema only.

An auditor reviewing this schema without this document would reasonably
conclude the opposite of the truth - that encryption/masking/retention/legal-
hold controls are implemented, because the tables and their well-considered
column shapes (approval workflows, MFA-gated reveal, key rotation cadence,
retention-period JSON, etc.) look like a working system. **An unenforced-but-
present control surface is a worse audit finding than an honestly-absent one**,
because it signals the gap wasn't understood rather than that it was deferred
with judgment. This document exists to make that distinction explicit and
correct the record.

## Tables and their real status

| Table(s) | What it models | Read/written by app code? |
|---|---|---|
| `EncryptionPolicy`, `EncryptionPolicyVersion` | Per-data-classification encryption requirements (algorithm, key size, rotation cadence, dual-approval) | **No.** No code queries or writes these models anywhere in `src/`. |
| `MaskingPolicy` | Default display-masking rules per field | **No.** |
| `RevealPolicy`, `RevealRequest`, `RevealApproval`, `RevealEvent` | MFA/approval-gated temporary unmasking of sensitive fields, with an audit trail of every reveal | **No.** No UI or API path exists to request, approve, or perform a "reveal" - sensitive fields in this app are either shown in full or not shown at all, with no masked-by-default state today. |
| `CryptographicKeyReference`, `KeyRotationRecord` | Key inventory and rotation history | **No.** The only real encryption key material in this system today is `AUTH_JWT_SECRET`/`AUDIT_HMAC_SECRET` (Secret Manager secrets, rotated manually per `docs/backup-disaster-recovery-plan.md`'s noted gap) - neither is tracked in these tables. |
| `PrivacyRequest` | DSAR (data-subject access/deletion request) intake and SLA tracking | **No.** There is no user-facing or admin-facing flow for a staff member or dependent to request their data, or to have it deleted, today. |
| `RetentionPolicy` | Per-entity retention period and deletion mode | **No.** No scheduled job or code path ever deletes data based on age. Queue/encounter data persists indefinitely until manually purged (as was done for synthetic test data earlier this session). |
| `LegalHold` | Suspends normal deletion for a resource under legal/investigative hold | **No.** Moot today since nothing is ever automatically deleted (see `RetentionPolicy` above), but would need real enforcement the moment retention-driven deletion is ever implemented. |
| `SensitiveExportRequest` | Approval-gated bulk export of sensitive data | **No.** No bulk-export feature exists in the app at all today. |
| `SensitiveDataField`, `DataClassification` | Catalog of which entity.field combinations are sensitive and at what classification, referencing the above policies by code | **No.** Not populated; nothing resolves a field's classification against this catalog at runtime. |

For contrast, `AuditEvent` (same schema section) **is** real and enforced:
written by `fhirWriteback.ts`'s EMR handoff and, as of this session's Wave C
work, by `queueOrchestration.ts`'s claim/move/complete/delete actions (see
`recordQueueAuditEvent()`).

## Why this is being formally deferred rather than implemented now

Building real enforcement for even one of these areas (e.g. field-level
masking with MFA-gated reveal) is a genuine multi-week feature: it requires
deciding which fields in this app are actually sensitive enough to mask,
building the masked-by-default rendering path in both nurse UIs, wiring an
MFA challenge, building the approval workflow UI for a manager/approver role,
and only then making the existing `RevealPolicy`/`RevealRequest`/
`RevealApproval`/`RevealEvent` tables real. Attempting this as a rushed
addition within this remediation pass - alongside the already-completed,
substantive Wave B/C fixes (query-level tenant isolation, `/triage/complete`
idempotency, non-root Docker, expanded audit logging) - risks either a
shallow implementation that doesn't hold up to real scrutiny, or destabilizing
work already verified working (as happened this session with the dependency-
upgrade attempts, which were reverted twice after breaking the test suite).

**Decision: treat this as an accepted, explicitly-documented risk for the
current SOC 2 Type I readiness pass**, per the original remediation plan's own
stated alternative ("if a given table isn't going to be enforced in the near
term, explicitly document that as an accepted risk/out-of-scope item").

## What this means today, concretely

- Sensitive data in this system (patient/staff health information) is **not
  masked by default** anywhere in either nurse UI - a nurse with legitimate
  queue access sees full values, not a masked-then-revealed value. This is
  today's actual behavior, not a regression from this document.
- There is **no automated data retention/deletion** - data persists until
  someone manually deletes it via direct DB access or a script, as has been
  done for synthetic test data this session.
- There is **no DSAR/privacy-request intake mechanism** - if a real data-
  subject access or deletion request were received today, it would need to be
  handled entirely outside this application (manual DB query/deletion by an
  engineer), not through any built-in workflow.
- Encryption at rest is provided by the underlying Cloud SQL/GCP platform
  (confirmed enabled by default for Cloud SQL), not by any application-level
  field encryption - the `EncryptionPolicy` tables would only become relevant
  if/when application-level (as opposed to platform-level) encryption is
  required.

## Recommended path forward (future work, not this pass)

In priority order, if/when picked back up:
1. **`PrivacyRequest` + a minimal DSAR intake/fulfillment flow** - highest
   real-world compliance urgency if this system ever handles real PHI under
   a regulatory regime with subject-access-request obligations.
2. **`RetentionPolicy` + a scheduled deletion job** for at least the queue/
   encounter tables - currently the largest gap between "schema implies this
   is governed" and "data actually lives forever."
3. **`MaskingPolicy`/`RevealPolicy` family** - the most implementation-heavy
   item (UI + MFA + approval workflow), appropriate to defer until the first
   two are real.
4. **`EncryptionPolicy`/key-management tables** - lowest near-term urgency
   given platform-level encryption at rest is already in place; relevant
   mainly if a field-level/application-level encryption requirement emerges
   (e.g. a specific regulatory mandate beyond what platform encryption
   satisfies).

## Customer-managed encryption keys (CMEK) - explicit decision, 2026-08-04

Investigated as part of this remediation pass (CSQ IS.33-35, AI-tab NFR-020):
Cloud SQL and Secret Manager currently use Google-managed encryption keys,
not customer-managed keys. **CMEK cannot be enabled on an existing Cloud SQL
instance** - GCP only supports setting it at instance creation time, meaning
adopting CMEK here would require creating a brand-new instance and migrating
data across, not a configuration flag.

Since `ist-triage-postgres-uat` is the single shared instance also hosting
`ist_triage_demo` (the live customer-facing database), a full CMEK migration
was explicitly decided against for this pass - the risk of touching the live
demo's database is not justified for what is, for a demo/staging workload,
already covered by Google-managed encryption at rest. **This is a conscious,
documented accepted risk, not an oversight**: platform-level encryption at
rest is real and active; the gap is specifically the absence of
customer-controlled key material and rotation, which matters mainly for a
production workload with a specific regulatory or contractual requirement
for CMEK.

If this is ever required (e.g. a specific client contract term), the correct
path is a new, CMEK-enabled Cloud SQL instance provisioned specifically for
that requirement - most cleanly done as part of a planned migration rather
than an in-place change to shared infrastructure.

## Explicitly out of scope for this document

- Actually implementing any of the above - this is a status/accepted-risk
  record, not an implementation.
- Deciding whether any of this is *required* for a specific SOC 2 Type I
  scope - that determination belongs to Wave D's control-matrix mapping and,
  ultimately, the engaged auditor, not this document.
