# Security AuditEvent Durable Persistence

_Written 2026-08-05 as a dedicated remediation for a Priority-0 audit-
integrity defect found during AR.13's canary validation. Covers
runtime configuration, architecture, failure policy, and the
operational runbook in one place - a deliberate scope compression from
separately requested "runtime config doc / architecture doc / schema
mapping / runbook" documents, given the size of this remediation;
all four concerns are covered below under clear headings._

## The defect

`persistSecurityAuditEvent()` and `listPersistedAuditEvents()`
(`src/services/persistence.ts`) were gated by
`shouldUseDatabasePersistence()`, which returns `!isMockMode()`. Since
`MOCK_MODE=true` on the live `ist-triage-soc2` environment, both
functions were a silent no-op there - every security `AuditEvent`
(login, MFA, PAM elevation, access denial, legal hold, exports, etc.)
was pushed to an in-memory array (`auditEvents` in
`src/services/securityAdmin.ts`) only, never durably written to the
real Postgres database. In-memory state is lost on container restart,
scale-down, or redeploy, and is invisible to any other concurrently
running Cloud Run instance - so the durable security audit trail this
engagement has repeatedly cited as evidence for authentication, MFA,
PAM, and access-control questionnaire rows **did not actually exist on
soc2** prior to this batch.

**This is a different code path from the separately-scheduled Cloud
Run Jobs** (`sliReportService.ts`'s SLI reports, the retention-purge
job, the privacy-request fulfillment job, the access-entitlement-
review job) - those already use their own dedicated `PrismaClient` +
`recordJobAuditEvent()`/`findAuditEvents()` helpers, unaffected by
`MOCK_MODE`/`shouldUseDatabasePersistence()`, and their historical
`AuditEvent` rows were confirmed present in the real soc2 database
throughout this investigation. Only the **web service's** interactive
security-audit-trail path (`recordAuditEvent()` in
`securityAdmin.ts`) was affected.

## Runtime configuration

New flag, mirroring the existing `SESSION_DB_PERSISTENCE`/
`MFA_DB_PERSISTENCE` precedent (`src/config/runtime.ts`):

```ts
export function shouldPersistAuditEventsInDatabase(): boolean {
  return envFlag("AUDIT_EVENT_DB_PERSISTENCE", false);
}
```

| Env var | Default | Effect |
|---|---|---|
| `AUDIT_EVENT_DB_PERSISTENCE` | `false` (unset) | When `"true"`, `persistSecurityAuditEvent()`/`listPersistedAuditEvents()` read/write the real `AuditEvent` table, independent of `MOCK_MODE`. When unset/`"false"`, both are a safe no-op (matches existing unit-test isolation - no test needs to opt in) |

**Precedence**: `AUDIT_EVENT_DB_PERSISTENCE` is checked directly and
does **not** consult `MOCK_MODE`/`shouldUseDatabasePersistence()` at
all - this is deliberate, since `MOCK_MODE` is about mocking
integrations (Twilio, EMR, call-center gateway) and demo-password
auth, not about whether a real security audit trail should exist.

**Currently set**: `soc2` canary revisions during this validation only
(`AUDIT_EVENT_DB_PERSISTENCE=true`). The live, traffic-serving
revision does **not** have this flag set yet - see "Remaining
activation step" below.

## Architecture

`recordAuditEvent()` (`securityAdmin.ts`) is the single write path
used by every interactive security event:
1. Push to the in-memory `auditEvents` array (unconditional - this
   remains the fast, always-available read path for the current
   process's own `GET /admin/audit-events` requests).
2. `await persistSecurityAuditEvent(event)` inside a `try/catch` -
   failure is logged (`console.error`) and swallowed; **the business
   action that triggered the audit event (login, MFA verification,
   elevation, etc.) always completes regardless of persistence
   outcome.**

### Chosen failure policy (documented, not silently kept)

**Fail-open, best-effort persistence** - the same policy already used
for sessions and MFA credentials in this codebase. Rationale,
per event category:

| Category | Policy | Why |
|---|---|---|
| Login (success/failure) | Fail-open | Failing login itself because an audit-DB write failed would turn a logging outage into a full authentication outage - a much larger blast radius than a temporarily-incomplete audit trail |
| MFA enrollment/verification (success/failure) | Fail-open | Same reasoning |
| PAM elevation | Fail-open | Same reasoning - elevation already requires fresh MFA re-verification; a missing audit row doesn't weaken the access control itself, only the record of it |
| Access denial | Fail-open | The denial itself (403/401) already happened at the authorization layer regardless of audit-write outcome |
| Legal hold / retention / data export | **Different code path** - these run via the separate Cloud Run Jobs' own dedicated Prisma client (not `shouldUseDatabasePersistence()`-gated), already durably writing today, out of scope for this fix |

**Not implemented, and explicitly not recommended given this
system's risk profile**: a durable write-ahead outbox, automatic
retry-with-backoff, or fail-closed business actions. This is a
synthetic-data, SOC2-remediation staging environment with no PHI; the
existing fail-open pattern is proportionate. If a future real-
production deployment needs stronger guarantees (e.g. a required
SIEM-forwarding SLA), revisit this decision explicitly rather than
building it speculatively now.

## Sensitive-data review

The `AuditEvent` TypeScript type (`src/types/security.ts`) carries no
password, OTP, recovery-code, cookie, or token field at all - there is
nothing to accidentally leak via this path. Confirmed via a dedicated
test (`tests/auditEventPersistence.test.ts`) that the persisted row's
keys never contain `password`/`otp`/`secret`/`token`/`cookie`/
`recoveryCode` substrings. The Prisma model's `metadata Json?` column
exists but is never written by any current call site - reserved for
future structured context, not sensitive payloads.

## Indexes and query support

Added (migration `20260805152719_add_audit_event_query_indexes`,
applied to the real soc2 database):

```prisma
@@index([timestamp])              // pre-existing
@@index([userId, action])         // pre-existing
@@index([organization, timestamp]) // new - tenant-scoped date-range queries
@@index([action, timestamp])       // new - event-type queries
@@index([riskLevel, timestamp])    // new - risk-triage queries
```

`listPersistedAuditEvents()` now accepts `{ userId, organization,
action, since, until }` filters (previously only `userId`/`since`/
`until`) - real tenant-isolation and event-type query support, not
just a schema change with no caller.

**No `correlationId`/request-ID column was added.** The existing
`metadata Json?` column is the intended carrier for a request ID once
a caller wires it through; adding a new dedicated column would be a
second migration this batch doesn't need to force. Documented here as
a known gap, not silently worked around.

## Retention

**Not decided by this batch.** `AuditEvent` retention remains subject
to IG.09's still-open joint decision (Clinical Governance Lead + Legal
+ DPO + Executive Sponsor) - see `docs/qr-compliance/legal-privacy-action-pack.md`.
This fix makes the audit trail durable; it does not invent a retention
period.

## Concurrency and resilience - what was and wasn't validated

**Validated**: two different Cloud Run revisions (`audit-canary` /
`audit-canary2`) both successfully wrote real rows to the same
database, and a query against the database (not against either
instance's own in-memory state) correctly returned both - proving
cross-instance durability, not just single-instance correctness.

**Not validated in this pass** (disclosed, not assumed safe): genuine
concurrent-write load (many simultaneous logins across multiple
instances), database-unavailable behavior beyond the existing generic
`try/catch`, connection-pool saturation under audit-write load
specifically. Given the fail-open policy and the existing shared
`DATABASE_CONNECTION_LIMIT` pooling already tuned this engagement
(`nfr-138-152-156` performance batch), no new resilience risk is
believed to exist, but this is an inference, not a load-tested fact -
flagged for the next capacity/soak batch if audit-write volume ever
becomes a real concern.

## Operational runbook

**To activate durable audit persistence on a real environment**:
1. Set `AUDIT_EVENT_DB_PERSISTENCE=true` on the target Cloud Run
   service's env vars (Secret Manager not required - this is not a
   secret value).
2. Confirm the `20260805152719_add_audit_event_query_indexes`
   migration has been applied to that environment's database
   (`npx prisma migrate deploy`).
3. Deploy via the standard canary-then-cutover pattern
   (`docs/change-management-policy.md` §2).
4. Verify with a real login attempt, then query
   `SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 5;`
   against the real database to confirm a fresh row appears.

**To query the audit trail for an investigation**:
`listPersistedAuditEvents(limit, { userId?, organization?, action?,
since?, until? })` - already used by the existing `GET
/admin/audit-events` route (gated by `audit.events.view`).

**Remaining activation step, not yet done**: the live, 100%-traffic
`ist-triage-soc2` revision does not yet have
`AUDIT_EVENT_DB_PERSISTENCE=true` set - this pass validated the fix on
`--no-traffic` canaries only, per the same safety discipline as the
AR.13 activation attempt. Recommend activating this on the live
revision as a **low-risk, quick production activation** (unlike
AR.13's `MFA_MANDATORY`, this flag has no user-facing behavior change
and no lockout risk - it purely makes an already-happening in-memory
write also land durably in Postgres).
