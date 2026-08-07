# Segregation of Duties (CSQ IS.26)

Closes the real remaining gap this row previously disclosed: the
technical segregation-of-duties controls already existed in code but
were never documented as a standalone control.

## 1. Role-based segregation

Every user session resolves to exactly one active role
(`src/services/securityAdmin.ts`), and each role's permission set is
defined explicitly (e.g. `admin.users.manage`, `admin.roles.manage`,
`privacy.reveal.request`, `privacy.reveal.approve`). Reveal-request and
reveal-approval are deliberately **separate** permissions, held by
different role sets (e.g. `privacy_officer` requests, `compliance_auditor`
approves) - holding one does not imply the other.

## 2. Dual-control PII reveal (real, code-enforced)

Revealing a masked PII field (`src/services/revealWorkflow.ts`) requires
two distinct steps by two distinct accounts:

1. A requester with `privacy.reveal.request` submits a request
   (`POST /api/v1/admin/reveal/request`) - no value is disclosed yet.
2. A **different** account with `privacy.reveal.approve` must approve it
   (`POST /api/v1/admin/reveal/:id/decision`). Self-approval is rejected
   unconditionally with `409 Conflict`, regardless of what permissions the
   requester's own session holds - this is enforced in code
   (`approverUserId === requesterUserId` check), not just documented as a
   policy expectation.
3. Only the original requester may then fetch the approved value once
   (`GET /api/v1/admin/reveal/:id/value`) within a short TTL.

Every step writes a real, permanent audit record
(`RevealRequest`/`RevealApproval`/`RevealEvent`), independently of the
general `AuditEvent` trail.

## 3. Privileged-action elevation (PAM)

The highest-risk mutation permissions (`admin.users.manage`,
`admin.roles.manage`, `crypto.policy.manage`, `security.sso.manage`,
`privacy.reveal.approve`) additionally require a second, time-boxed
MFA re-verification (`requireElevatedPermission`,
`src/services/authorization.ts`) before they can be exercised - a
standing permission grant alone is not sufficient.

## 4. Real tamper-evidence for safety-critical decisions (IS.31)

Human-in-the-loop clinical approval events are HMAC-signed at write time
(`auditSignatureFor()`, `src/services/safetyKernel.ts`) and the signature
is actually re-verified on read (`verifyAuditSignature()`) - a mismatch
throws `SafetyKernelTraceVerificationError` rather than silently trusting
the stored record. This is a real, enforced integrity check against
unauthorized tampering with a safety-critical customer-data record, not
just an audit log entry.

## Verified

- `tests/adminAccessBifurcation.test.ts`: self-approval rejection (409),
  single-use fetch, TTL expiry, cross-account approve/fetch flow.
- `tests/safety-kernel.test.ts`: signature verification failure path.
