# MFA Enrollment and Recovery - AR.13

_Written 2026-08-05. Covers the real enrollment-token flow and
administrator-assisted reset that close AR.13's circular-dependency
and recovery gaps. Backend/API only - no new frontend UI was built
this batch (see Known Limitations)._

## The problem this closes

Before this batch, `MFA_MANDATORY=true` would reject an unenrolled
user's login outright with `mfaEnrollmentRequired: true` and nothing
else - but the only way to enroll (`POST /mfa/enroll`,
`POST /mfa/enroll/confirm`) required an already-authenticated session.
A genuinely unenrolled user had no path forward at all. This is why
AR.13 stayed Partial: turning mandatory MFA on for real traffic would
have locked out every unenrolled user permanently.

## Enrollment architecture

1. `POST /api/v1/auth/login` with correct credentials for an
   **unenrolled** user, with `MFA_MANDATORY=true`: returns `202
   { authenticated: false, mfaEnrollmentRequired: true, enrollmentToken }`.
2. The `enrollmentToken` is a real, server-tracked, single-purpose,
   single-use, 15-minute token (`pendingEnrollmentTokens` in
   `src/services/securityAdmin.ts`) - bound to the user and their
   organization at issuance. It is **not** a session or bearer access
   token; it authorizes exactly two routes:
   - `POST /api/v1/auth/mfa/enroll { enrollmentToken }` -> generates a
     real TOTP secret + `otpauthUrl` (same `enrollMfa()` logic already
     used by the session-based self-service path).
   - `POST /api/v1/auth/mfa/enroll/confirm { enrollmentToken, code }` ->
     verifies the first real TOTP code, flips the credential to
     `enabled`, and **consumes the token** (marks it `used`, so it can
     never be reused for another enrollment - replay is rejected with a
     distinct `MFA_ENROLLMENT_TOKEN_REPLAYED` audit event).
3. No session is issued at any point in this flow. The user must
   perform a completely fresh `POST /login` afterward, which now
   proceeds through the normal, existing MFA-challenge path
   (`mfaRequired: true` -> `POST /mfa/verify`).

This mirrors the existing MFA-challenge token's own design convention
(a random, server-tracked id is the security boundary, not a signed
JWT) rather than inventing a second token format.

## Enrollment-token security properties

| Property | How it's enforced |
|---|---|
| Short-lived | 15-minute TTL, checked on every use |
| Single-purpose | Only 2 routes ever read `pendingEnrollmentTokens`; every other route requires a real `AuthenticatedSession` and would reject this token outright |
| Single-use | Marked `used` on successful confirmation; replay throws `EnrollmentTokenInvalidError` and is audited |
| Bound to user | `userId` fixed at issuance from the already-verified password check |
| Bound to organization | `organizationId` fixed at issuance |
| Audited | Issuance, expiry, and replay each write a distinct `AuditEvent` |
| Revocable | An administrator reset (see the runbook) immediately invalidates any credential state the token could have been enrolling toward |
| Invalidated on reset | A password reset/account disablement/administrator MFA reset all leave any outstanding enrollment token pointing at a user whose credential state has changed - the token itself doesn't need separate invalidation logic since `confirmMfaEnrollmentWithToken` operates on the live `mfaCredentials` state, not a snapshot |

Never returns the secret again after confirmed enrollment - only the
initial `enroll` call before confirmation exposes the TOTP secret/
`otpauthUrl`, matching the existing session-based enrollment's
behavior.

## MFA credential state model

| State | Meaning | How reached |
|---|---|---|
| Not enrolled | No `UserMfaCredential` row/in-memory entry | Default for every user |
| `pending` | Enrollment started, not yet confirmed | `enrollMfa()`/`enrollMfaWithToken()` |
| `enabled` | Real, verified TOTP credential active | `confirmMfaEnrollment()`/`confirmMfaEnrollmentWithToken()` |
| `reset_required` | Administrator reset the credential | `resetMfaForUser()` - routes the user back through the enrollment-token flow exactly like a never-enrolled user |
| Disabled by administrator | Reserved value (`disabled`), not currently set by any route in this batch | n/a |

All 4 states persist durably via `persistMfaCredential()` (real
`UserMfaCredential` table row) when `MFA_DB_PERSISTENCE=true`, with the
same in-memory-first/DB-fallback read path (`resolveMfaCredential()`)
already used for the original enrollment flow - cross-instance
recognition is unchanged and already proven this engagement.

## Audit events

| Event | When |
|---|---|
| `MFA_ENROLLMENT_TOKEN_ISSUED` | A correct-password, unenrolled login under `MFA_MANDATORY=true` |
| `MFA_ENROLLMENT_TOKEN_REPLAYED` | A used token is presented again |
| `MFA_ENROLLMENT_TOKEN_EXPIRED` | An expired token is presented |
| `MFA_ENROLLMENT_STARTED` | `enrollMfa()` generates a new secret (existing event, reused) |
| `MFA_ENROLLMENT_CONFIRMED` | A real TOTP code confirms enrollment (existing event, reused) |
| `MFA_ENROLLMENT_TOKEN_CONSUMED` | The token is marked used after a successful confirmation |
| `MFA_RESET_COMPLETED` | An administrator resets a user's MFA (see the runbook) |
| `LOGIN_BLOCKED_MFA_ENROLLMENT_REQUIRED` | Retained from the original mandatory-MFA gate, still fires whenever the enrollment-token branch is taken |

None of these events ever include the OTP code, the TOTP secret, the
`otpauthUrl`/QR payload, the password, or the enrollment token itself -
confirmed by direct code review of every `recordAuditEvent()` call this
batch touches.

## Known limitations (honest, not hidden)

- **No frontend enrollment UI was built this batch.** This closes the
  backend/API circular dependency only - a real user today would need
  to call `POST /mfa/enroll`/`POST /mfa/enroll/confirm` directly (or
  via a future frontend) rather than through a page in this app. This
  matches this engagement's established scoping for the original MFA/
  SSO work ("no enrollment screen, no QR rendering, no provider
  picker" - explicitly out of scope then, and still out of scope now
  given this batch's time budget).
- **Real TOTP verification, not device-bound push/WebAuthn.** Same
  scope as the original MFA implementation.
- **No email/SMS-based recovery channel exists** - recovery is
  administrator-assisted only (see the runbook). If the sole enrolled
  administrator population were ever fully locked out simultaneously,
  a break-glass path would be needed - see
  `docs/security/mfa-break-glass-assessment.md` for why one was not
  built this batch.
