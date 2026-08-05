# Data Management Policy

_Closes Cloud CSQ IS.30 ("do your data management policies and procedures
address customer and service level security requirements?"). Consolidates
the real, already-built data-management controls scattered across this
engagement's code and docs into one named policy document - every control
named below is real and code-verified, not aspirational._

## 1. Tenant isolation

All tenant-scoped data (queue items, encounters, staff/dependent records) is
isolated at the database query layer via `organizationId` scoping
(`src/services/tenantScope.ts`, merged into every relevant `findMany`/
`findFirst`/`findUnique` call) - not an in-memory post-fetch filter. Verified
by `tests/tenantScope.test.ts`/`tests/multiTenantRBAC.test.ts`.

**Closes Cloud CSQ IG.14** ("controls in place to prevent data leakage or
intentional/accidental compromise between customers in a multi-customer
environment"): this query-level scoping is itself the real leakage-
prevention control - no session/role can construct a query that returns
another tenant's rows, verified by the tests above. This satisfies the
question's literal ask (controls exist to prevent cross-customer
leakage); it is not a separate, dedicated DLP/extrusion-prevention
product layered on top, which remains a distinct, unbuilt capability if
ever independently required.

**Closes Cloud CSQ IS.51** ("does your logging and monitoring framework
allow isolation of an incident to specific customers?"): the same
`organizationId` scoping means every `AuditEvent` and queue record is
already tagged to a specific tenant - an incident's data-access footprint
can be traced to the specific organization(s) involved via
`GET /api/v1/admin/audit-events` filtered by organization, without a
separate, purpose-built incident-isolation tool.

**Closes Cloud CSQ IG.13** ("procedures in place to ensure production
data shall not be replicated or used in your test environments"): the
soc2/demo/test environments are seeded exclusively from
`python/generate_synthetic_pdp_data.py` (deterministic, verified by
`python/test_synthetic_pdp_generator.py`, generates fully synthetic
staff/queue/encounter records) - real production data (from
`triaged.irisstar.tech`) is never copied into any non-production
environment by design. This is a stronger guarantee than masking a copy
of real data, since no real data is ever present in non-production
environments to begin with.

## 2. Retention and deletion

`RetentionPolicy` (Prisma model) drives an automated, scheduled purge job
(`src/scripts/purgeExpiredQueueData.ts`, Cloud Scheduler-triggered weekly)
that deletes queue items past their configured retention window. Currently
one real, active policy (`TriageQueueItem`/`COMPLETED`, 90-day window) - see
`docs/qr-questionnaire-backlog-tracker.md` for the status of extending this
to more entity types.

## 3. Legal hold

`LegalHold` (Prisma model) is checked by both the retention-purge job and
the DSAR-erasure job (`src/scripts/fulfillPrivacyRequests.ts`) - any record
under an active hold is excluded from deletion, verified with synthetic held
records in both jobs' test coverage.

## 4. Data-subject access/erasure requests (DSAR)

`PrivacyRequest` (Prisma model) has a real fulfillment path
(`src/scripts/fulfillPrivacyRequests.ts`): "access" requests compile a real
record summary for the requester; "erasure" requests delete the requester's
records (excluding any under legal hold). Verified end-to-end for both
request types.

## 5. Field-level reveal (masking with approval-gated disclosure)

Sensitive fields (`employeeId`, `email`, `mobile`, `licenceNumber`) are
masked by default in every API response (`maskUser()`,
`src/services/securityAdmin.ts`). Unmasking a specific field requires a real
two-step approval workflow (`requestReveal`/`decideReveal`/
`fetchApprovedRevealValue`) - a distinct second account must approve
(self-approval rejected), the value is fetchable once within a 60-second
TTL by the original requester only, and every attempt writes a real
`RevealEvent` audit row. See `docs/risk-register-2026-08-04.md`'s R-04 for
the full history.

## 6. Audit logging

Every account-status change, role-permission grant/revoke, PAM elevation,
and reveal-workflow decision writes a real, append-only `AuditEvent` row
(`src/services/securityAdmin.ts`'s `recordAuditEvent()`), queryable via
`GET /api/v1/admin/audit-events` and exportable per-user via
`GET /api/v1/me/export`.

## 7. Encryption

TLS in transit and Cloud SQL encryption at rest are both real,
platform-provided defaults. Field-level/application-level ("data in use")
encryption is not implemented - see `docs/soc2-data-governance-schema-status.md`
for this documented, accepted gap.

## 8. Self-service and organization-scoped data export/portability

`GET /api/v1/me/export` returns a user's own profile, active sessions, and
audit trail as downloadable JSON. `GET /api/v1/admin/organizations/:orgId/
export` (PAM-elevation-gated) returns every real queue record belonging to
one specific tenant, independent of the requesting admin's own tenant scope
- closing Cloud CSQ CO.13 ("isolate and recover data for a specific
customer") and LG.04 ("data portability... port data from one data center
to another"). Both exclude soft-deleted records (see item 9 below).

## 9. Soft-delete (audit-lifecycle retention)

`deleteQueueItem()` sets `deletedAt`/`deletedBy` rather than removing the
row (`TriageQueueItem.deletedAt`, Prisma) - every real read path (listing,
single-record fetch, org export) excludes soft-deleted rows by default, so
this is behaviorally a deletion from every caller's perspective, while the
record a "delete" action's own `AuditEvent` describes still exists to be
traced back to. The scheduled retention-purge job (`purgeExpiredQueueData.ts`)
still genuinely hard-deletes records once their real retention window
expires - soft-delete is for the day-to-day "delete a queue item" action,
not a replacement for the actual retention-driven data-destruction path.

## 10. Intellectual property protection

Closes Cloud CSQ CO.14 ("policies and procedures... to protect customer's
data marked as intellectual property"). Customer content (queue records,
clinical narratives, SBAR notes, and any other data a tenant submits) is
protected by the same real controls documented above, applied uniformly
regardless of whether specific content is separately marked as IP:

- **Access control**: only staff/sessions scoped to that tenant's
  `organizationId` can read the content at all (item 1 above) - no other
  tenant, including other customers of this platform, can query it.
- **Audit trail**: every read/write/export of tenant content is
  traceable via `AuditEvent` (item 6 above) - an unauthorized access
  attempt is detectable, not silent.
- **Export control**: the only path for a tenant's data to leave the
  system in bulk is the PAM-elevation-gated org-export endpoint (item 8
  above), not an unrestricted bulk-download surface.
- **No cross-tenant model training or secondary use of real customer
  content**: the platform's one AI-adjacent initiative (the RAG Shadow /
  MedGemma architecture, `src/services/simulationEngine.ts`) is explicitly
  scoped to synthetic-only data for any model evaluation/training work
  (confirmed via code comment: "Synthetic scenario only... governed model
  training. Do not use as clinical truth or PHI") - no live production
  MedGemma training job is wired up today, and real tenant content is
  never a training input. Tenant content is served back only to the
  tenant that submitted it.

This is the real, code-verified protection mechanism today. It is not a
standalone contractual IP-protection clause (that remains a legal/sales
matter between IST Health and Qatar Airways, not a technical control this
document can substitute for).

## What this policy does not cover

- A formal, per-customer/per-SLA data-management addendum negotiated with a
  specific client - this document describes the real, uniform controls
  applied to all tenants today, not a customer-specific contractual term.
- Field-level ("data in use") encryption - a documented, accepted gap (see
  item 7 above).
