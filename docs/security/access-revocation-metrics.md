# Access-Removal Timing Metrics (CSQ IS.13)

_Written 2026-08-06 as part of the Automated Security Monitoring & Metrics
batch. Status: **operational** - real, tested, deployed in code (not
infrastructure-dependent)._

## Literal requirement

> "Confirm whether the supplier provide metrics which track the speed with
> which you are able to remove access rights following a request from us?"

This asks specifically for **metrics on revocation speed**, not a new
revocation capability (already real, see below), not a formal SLA (none has
been approved by Qatar Airways), and not customer-visible self-service
metrics (no customer portal exists in this application). The literal ask
is satisfied by an operating, queryable report of measured revocation
durations.

## Access-removal paths covered

| Path | Function | Trigger |
|---|---|---|
| Account status change (suspend/lock/deactivate) | `updateUserAccountStatus` | Admin action via `PATCH /admin/users/:id/status` |
| Role-permission revoke | `revokePermissionFromRole` (via `mutateRolePermission`) | Admin action via `DELETE /admin/roles/:code/permissions/:permissionCode` |
| Single-session termination | `revokeSessionById` | Admin action via `DELETE /admin/users/:id/sessions/:sessionId` |
| HRMS/JML-driven deprovisioning | `setDirectoryStatusForEmployee` | Oracle HRMS sync webhook |

Grants (the inverse of a revoke) are explicitly **not** counted - only
removal operations. Broad session revocation triggered internally by the
above (`revokeSessionsForUser`/`revokeSessionsForRole`) is captured at the
outer call site, not double-counted separately.

Not covered, and why: privileged-access de-elevation (`endElevation`) is a
self-service, user-initiated action ending one's *own* temporary privilege
window, not a third-party "remove this access" request - a materially
different action than the ones this metric targets; API/service-credential
revocation does not apply, since this application has no customer-issued
API keys/service credentials to revoke.

## Metric architecture

A dedicated in-process `AccessRevocationMetric` record (not overloaded onto
`AuditEvent`, which has no numeric-duration field) is written at the
completion of every path above:

```ts
{
  id, correlationId,
  requestedAtIso, completedAtIso, durationMs,
  revocationType: "ACCOUNT_STATUS_CHANGE" | "ROLE_PERMISSION_REVOKE" | "SESSION_TERMINATION" | "JML_DEPROVISION",
  outcome: "SUCCESS" | "FAILURE",
  organization, actorUserId, targetUserId?, targetRoleCode?,
  sessionsRevoked?, failureReason?
}
```

No credentials, tokens, or session values are ever stored - only the
identifiers needed to attribute and time the operation (enforced by a
dedicated test: `tests/accessRevocationMetrics.test.ts`).

**Known limitation, disclosed**: the metric store is currently in-process
memory only (mirrors this engagement's existing "in-memory first"
pattern used elsewhere, e.g. `rolePermissionOverrides`), not yet persisted
to Postgres. This means metrics reset on a process restart/redeploy. This
is an accepted, disclosed limitation for this batch, not a hidden gap - a
future pass can add a `persistAccessRevocationMetric()` function mirroring
the existing `persistSecurityAuditEvent` best-effort-persistence pattern.

## Reporting endpoint

`GET /api/v1/admin/access-revocation-metrics?days=<n>&organization=<org>`

- Gated by `audit.events.view` (the same permission the existing
  `/audit-events` and `/audit-trail` reporting routes use).
- Returns: `completedCount`, `failedCount`, `p50DurationMs`,
  `p95DurationMs`, `maxDurationMs`, a per-`revocationType` breakdown,
  `dataCompleteness`, and an explicit empty-period message when nothing was
  recorded in the requested window (never a 500/empty-array-without-context).
- Organization-scoped: a request for one organization never returns another
  organization's metrics.
- Does not return individual employee names/PII beyond the identifiers
  already needed for correlation (`targetUserId`, an internal id, not a
  name/email).

## No invented SLA

No Qatar-Airways-approved revocation-time target exists. The report
returns **measured performance only**; a `targetMs` field was deliberately
NOT added, since inventing an unapproved target would misrepresent this as
an SLA-conformance report rather than what it actually is - a real,
operating measurement capability.

## Validation performed

- 12 new tests (`tests/accessRevocationMetrics.test.ts`): duration
  recording for all 4 revocation types, failure-outcome recording, p50/p95/
  max computation across multiple revocations, empty-period handling,
  organization scoping, unauthorized-route rejection (403 for a
  non-privileged role), authorized HTTP access, and a sensitive-data
  exclusion check (no password/secret/token/sessionId ever appears in a
  report).
- Full backend suite: 771/771 (759 baseline + 12 new), `tsc` clean.
- Representative validation: ran a real suspend (`updateUserAccountStatus`),
  a real role-permission revoke, a real single-session termination, and a
  real HRMS-driven deprovisioning against the local test harness; confirmed
  the report reflects all 4, with correct per-type counts and non-null
  p50/p95/max.

## Closure decision

**CSQ IS.13 moves to Yes.** The literal requirement (metrics tracking
revocation speed) is genuinely, operationally satisfied - not merely
documented or planned.
