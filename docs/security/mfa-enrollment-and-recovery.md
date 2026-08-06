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

## PRIORITY-0 CORRECTION (2026-08-06): the real browser UI now exists

An earlier version of this document (and the AR.13 questionnaire
remark) claimed AR.13 was fully closed based on API-level (curl)
validation alone. A follow-up integrity review found this was a real
overclaim: `frontend/src/auth/LoginCard.tsx` had **zero handling** for
the `mfaRequired`/`mfaEnrollmentRequired` login responses - a real
interactive user in the actual browser saw only a generic "Sign-in
failed" message, with no way to enroll or complete a challenge. AR.13
was reverted to Partial, and this batch built the real, accessible
in-browser flow described below, closing the gap for real.

## Real browser UI (built 2026-08-06)

`LoginCard.tsx` now handles every MFA-related login response as a
distinct screen, driven entirely by component state (never the URL,
never `localStorage`):

- **Password screen** (unchanged): username/password submit.
- **Enrollment screen**: shown when the login response carries
  `mfaEnrollmentRequired`/`enrollmentToken`. Immediately calls
  `POST /mfa/enroll` with the token to fetch a real secret and
  `otpauthUrl`, and renders the manual setup key (a labeled, read-only,
  focusable input - the QR-code alternative explicitly called for)
  plus a 6-digit code field. On confirm, calls
  `POST /mfa/enroll/confirm`; on success the secret is cleared from
  state immediately (never shown again) and the user is told to sign
  in again with the app now requiring a fresh, real login rather than
  auto-continuing a session.
- **Challenge screen**: shown when the login response carries
  `mfaRequired`/`challengeId` (an already-enrolled user). A single
  6-digit code field submits to `POST /mfa/verify`.
- **Enrollment-complete screen**: a real confirmation state before
  returning to the password screen.
- Expired/replayed enrollment tokens are detected from the exact error
  string the backend returns and routed back to the password screen
  with a clear "your enrollment link has expired, sign in again"
  message - not a generic failure.
- Invalid OTP codes (both enrollment-confirm and challenge-verify) show
  an accessible `role="alert"` message and allow retry without losing
  the enrollment token/challenge id.
- A "Back to sign in"/"Cancel and start over" control is present on
  every non-terminal screen, and never leaves an unauthenticated user
  able to reach any application route - `onAuthenticated()` (the only
  function that grants app access) is called exclusively from the
  challenge/normal-login success paths, never from the enrollment
  screens.

**Security properties preserved**: the enrollment token and challenge
id live only in React component state (in memory), never in the URL
query string, never in `localStorage`/`sessionStorage`. The TOTP secret
is held only until enrollment succeeds, then cleared. Existing CSRF/
session-cookie handling (`credentials: "include"` on the real-session-
issuing calls) is untouched.

## Real browser validation results (2026-08-06)

Performed through direct browser interaction against the running application -
not curl, not direct API calls, per the explicit constraint for this
validation:

- **`sara@irisstar.tech`** (unenrolled at the start of this batch): logged in
  with username/password through the real login form on the canary URL,
  observed the frontend correctly recognize the `mfaEnrollmentRequired`
  response and render the new Enrollment screen (not a generic failure). The
  manual setup key was shown once, a real TOTP code (generated locally from
  the displayed secret) was entered into the enrollment-confirm form and
  accepted. Then performed a completely fresh browser login (new
  username/password submission) and confirmed it was routed to the Challenge
  screen (`mfaRequired`), entered a fresh real TOTP code, and reached the
  actual application - real name and real queue data rendered, confirming
  genuine session issuance through the UI, not just an API 200. A deliberately
  wrong OTP code was also submitted once and correctly rejected with an
  accessible alert message, without losing the in-progress challenge state.
- **`khalid@irisstar.tech`** (unenrolled): logged in on the real production
  domain `triagedsoc2.irisstar.tech` and confirmed the Enrollment screen
  rendered there too (not just on canary) - proving the fix is live for real
  users of the production domain, not only the pre-cutover canary.
- One early round of "invalid code" rejections during testing was root-caused
  to Browser-pane tool round-trip latency exceeding the 30-second TOTP
  validity window between generating a code and it reaching the server - not
  a product defect. This was isolated and confirmed via an independent,
  fast, sub-second curl round trip that succeeded immediately, then resolved
  in the browser by minimizing the gap between code generation and
  submission.

## Known testing-infrastructure limitation (disclosed)

A frontend test file for the new `LoginCard.tsx` MFA screens was written using
React Testing Library, but this repository's Jest configuration cannot yet
execute a file containing Vite's `import.meta.env` syntax under true Node ESM
(`ReferenceError: jest is not defined` once the ESM parse issue itself is
worked around) - no other existing test file in the repo exercises this
boundary, so this is a real, pre-existing gap, not something this batch broke.
The test file was removed rather than left in a non-running state, and live
browser verification (above) was used as the substitute evidence for this
specific validation, which matches this review's own instruction to validate
through the real browser rather than API/curl calls.

## Known limitations (honest, not hidden)

- **Real TOTP verification, not device-bound push/WebAuthn.** Same
  scope as the original MFA implementation.
- **No email/SMS-based recovery channel exists** - recovery is
  administrator-assisted only (see the runbook). If the sole enrolled
  administrator population were ever fully locked out simultaneously,
  a break-glass path would be needed - see
  `docs/security/mfa-break-glass-assessment.md` for why one was not
  built this batch.
