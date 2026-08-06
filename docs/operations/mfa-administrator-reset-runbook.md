# MFA Administrator Reset Runbook

_Written 2026-08-05. Companion to
`docs/security/mfa-enrollment-and-recovery.md`. This is the "how to
operate it" reference for an administrator recovering a locked-out
user._

## When to use this

- Lost or replaced authenticator device (new phone, app reinstalled,
  authenticator app data wiped).
- Expired enrollment token and the user cannot complete enrollment
  before it lapses (15 minutes) - simply having them log in again
  issues a fresh token, no reset needed.
- Suspected account compromise where the second factor itself may be
  compromised (administrator judgment call, tied to the incident-
  response process already documented elsewhere in this repo).

## Endpoint

`POST /api/v1/admin/users/:id/mfa-reset` `{ reason: string }`

- **Gated by** `requireElevatedPermission("admin.users.manage")` - the
  same PAM (just-in-time elevation) gate already used for account-
  status changes and role-permission mutations. The caller must have
  recently completed a fresh MFA re-verification via `POST
  /api/v1/admin/elevate` before this succeeds (see
  `docs/security/pam-elevation.md`/the PAM plan from earlier this
  engagement if present, or `src/services/authorization.ts`'s
  `requireElevatedPermission` for the exact mechanics).
- **`reason` is required** (max 500 characters) - recorded verbatim in
  the resulting `AuditEvent`'s `purpose` field.

## What happens on a reset

1. The target user's existing MFA credential is deleted (the secret is
   never read back to the administrator - `resetMfaForUser()` never
   returns or logs the plaintext secret).
2. The credential state becomes `reset_required`.
3. **Every active session for the target user is revoked immediately**
   (`revokeSessionsForUser()`) - the user is signed out everywhere.
4. A durable, high-risk `MFA_RESET_COMPLETED` `AuditEvent` is written,
   recording the administrator's user id, the target's user id, the
   reason, and how many sessions were revoked.
5. The user's next login attempt is treated exactly like a
   never-enrolled user under `MFA_MANDATORY=true`: they receive a
   fresh enrollment token and go through the same enrollment flow
   described in `mfa-enrollment-and-recovery.md`.

## Guards that cannot be bypassed by permission alone

- **No self-reset**: an administrator cannot reset their own MFA
  through this action (`SelfMfaResetError`, HTTP 409). This prevents an
  administrator from silently removing their own second factor.
- **No cross-tenant reset**: the target user must belong to the same
  organization as the requesting administrator (`CrossTenantMfaResetError`,
  HTTP 403).

## Identity verification before performing a reset

This is a real, load-bearing security control - do not skip it. Before
calling this endpoint:

1. Verify the requester is really the account holder, through a
   channel independent of the compromised/lost device (e.g. a known
   phone number on file, a video call, or an in-person confirmation for
   co-located staff). **This step requires organizational judgment this
   document cannot substitute for** - it is explicitly flagged here as
   an approval-dependent step, not invented as a rule
   (`docs/security/mfa-enrollment-and-recovery.md` and this runbook do
   not assume HR/Legal/management sign-off is required unless your
   organization's own policy says so).
2. Record the verification method used in the `reason` field passed to
   the endpoint (e.g. `"Verified via phone callback to number on
   file, device lost 2026-08-05"`).

## Evidence retained

The `MFA_RESET_COMPLETED` audit event itself is the durable evidence:
requester id, target id, reason text, sessions-revoked count,
timestamp. No additional manual log is required, though organizations
with a formal incident-tracking system may want to cross-reference the
audit event id there.

## Post-recovery

- Confirm the user can complete a fresh enrollment (walk them through
  `mfa-enrollment-and-recovery.md`'s flow if needed).
- Confirm they are signed out of any device they no longer control
  (already guaranteed by the automatic session revocation above, but
  worth a verbal confirmation with the user).

## Emergency escalation

If the sole enrolled administrator(s) become unavailable or locked
out simultaneously and no other privileged account can perform a
reset, see `docs/security/mfa-break-glass-assessment.md` for this
engagement's explicit decision on break-glass access.
