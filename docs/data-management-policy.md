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

## What this policy does not cover

- A formal, per-customer/per-SLA data-management addendum negotiated with a
  specific client - this document describes the real, uniform controls
  applied to all tenants today, not a customer-specific contractual term.
- Field-level ("data in use") encryption - a documented, accepted gap (see
  item 7 above).
