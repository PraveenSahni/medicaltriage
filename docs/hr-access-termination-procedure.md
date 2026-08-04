# Access Termination Procedure (Employment Termination / Role Change)

_Closes Cloud CSQ HR.03 ("roles and responsibilities for following/
performing employment termination or change-in-employment procedures").
Documents the real, already-built automated enforcement plus the
organizational responsibilities around it - not a policy invented from
scratch._

## What is automated today (real, code-verified)

1. **HRMS directory sync marks a user inactive** - when the HRMS/EMR
   directory sync sets a user's `directoryStatus` to anything other than
   `active`, `setDirectoryStatusForEmployee()` (`src/services/securityAdmin.ts`)
   automatically:
   - Sets the account's `accountStatus` to match (inactive/suspended).
   - Calls `revokeSessionsForUser()`, immediately invalidating every active
     session that user holds - not just blocking future logins.
2. **Manual account suspension** - `PATCH /api/v1/admin/users/:id/status`
   (PAM-elevation-gated) suspends an account and revokes its sessions in the
   same real-time call, for cases where termination needs to happen faster
   than the next HRMS sync cycle.
3. **Single-session termination** - `DELETE /api/v1/admin/sessions/:sessionId`
   allows revoking one specific session (e.g. a lost/stolen device) without
   waiting for full account suspension.
4. **Role-permission changes revoke affected sessions** - granting/revoking
   a permission on a role (`POST`/`DELETE /api/v1/admin/roles/:code/
   permissions`) immediately invalidates every currently-active session
   holding that role, since `session.permissions` is a snapshot taken at
   login, never silently re-derived.

## Roles and responsibilities

| Step | Responsible party | Real mechanism |
|---|---|---|
| HR marks an employee's employment as terminated/changed in the source-of-truth HRMS | HR / People team (external to this application) | Not built by this application - HRMS is the real system of record |
| HRMS directory sync propagates the status change into this application | Automated (scheduled HRMS sync) | `setDirectoryStatusForEmployee()` - automatic session revocation, no human action required |
| Emergency/out-of-cycle termination (before the next scheduled sync) | The Control Center admin actioning the request | `PATCH /admin/users/:id/status` (PAM-elevation-gated, audited) |
| Confirming the termination took effect | The requesting manager/admin | `GET /api/v1/admin/users/:id/sessions` (confirms zero active sessions remain) |

## Timing SLA

**Not formally defined.** The HRMS sync's real cadence (how often it runs)
determines the maximum time-to-revocation for the automated path - this has
not been documented or committed to as a formal SLA. The manual/emergency
path (`PATCH .../status`) is real-time (session revocation happens in the
same API call), so an urgent termination need not wait for the sync cycle.

## What this document does not cover

- The HRMS/HR-side process itself (who in HR initiates a termination, what
  triggers it) - that is an HR-owned process outside this application's
  scope.
- A formally committed maximum-time-to-revocation SLA for the automated
  sync path - a real gap, tracked in `docs/qr-questionnaire-backlog-tracker.md`.
