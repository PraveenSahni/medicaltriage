# Logging Redaction Standard (NFR-078, NFR-004 AI-tab)

_Written 2026-08-06._

## What this closes

NFR-078 (Non Functional Req tab): **"PII Data: Ensure PII data is not stored
in log files and is always encrypted in database (including mobile apps),
using the keys from the vault."** This is a **compound** requirement -
logging safety AND field-level vault-key database encryption. This standard
closes the logging half only. The database-encryption-with-vault-keys half
is a separate, unmet architecture item (the same gap already tracked under
NFR-076/IS.33/IS.34 - field-level/CMEK encryption at rest) and is explicitly
**not** closed by this work. **NFR-078 therefore stays Partial**, regardless
of how complete the logging portion is.

NFR-004 (AI tab): **"System must comply with PII / other sensitive data must
be masked or redacted in application logs to prevent unauthorized
disclosure."** This row is about logs only - no encryption-at-rest clause -
so it is a genuine Yes candidate once the logging portion is closed.

## The standard

1. **Never log a raw request/response body, full user object, or full
   patient/queue-record object.** (Confirmed already true everywhere in
   this codebase as of the 2026-08-06 audit - no call site does this.)
2. **Never log a raw `Error` object or `error.stack`.** Pass it through
   `sanitizeForLog()` (`src/utils/logSanitizer.ts`) first, which extracts
   only `name`, a length-bounded `message`, `cause`, and an explicit
   allow-list of safe extra fields (`code`, `meta`) - never the raw stack,
   which can echo request/query data via V8's own formatting of thrown
   values in some driver error paths.
3. **Never log an unmasked person identifier** (email, phone, national ID,
   employee/staff ID used as a lookup key) even in an operational/audit
   console message. Use a partial mask (e.g. `maskIdentifier()` in
   `src/scripts/fulfillPrivacyRequests.ts`, or the existing
   `c***@system.local`-style masking already used in
   `callCenterGateway.ts`) for anything reaching stdout/Cloud Logging.
   Durable, access-controlled `AuditEvent` records are a separate,
   legitimate channel and may still carry the real, unmasked identifier -
   that's the point of an audit trail - only the broader-access console/log
   surface is masked.
4. **Never log the full request path with its query string.** The app's
   `morgan` HTTP logger uses a custom `:url-no-query` token
   (`src/app.ts`) instead of the default `:url` token, so no future route
   that (mis)uses a query parameter for something sensitive can leak it at
   the HTTP-access-log layer by default.
5. **When in doubt, run the sensitive value through `sanitizeForLog()`**
   before it reaches any `console.*` call. It recursively redacts keys
   matching a broad, explicit pattern list (password, token, authorization,
   cookie, otp, secret, email, phone/mobile, patient name, date of birth,
   medical narrative, symptoms, diagnosis, request/response body, national
   ID, passport, licence number, address), handles nested objects, arrays,
   `Error` instances, and circular references safely, and never mutates the
   input.

## What is deliberately NOT redacted

Operationally necessary, non-sensitive fields are preserved by an explicit
`SAFE_KEYS` allow-list in `sanitizeForLog()`: `requestId`, `correlationId`,
`method`, `path`, `route`, `statusCode`, `durationMs`, `count`, `id`,
`errorCategory`, `code`. Over-redacting these would make logs useless for
real debugging/tracing without buying any real privacy benefit.

## Where this is applied (2026-08-06)

- `src/services/securityAdmin.ts` - 14 catch-all `console.error(..., error)`
  sites (audit/MFA/role-permission/reveal-workflow persistence failures)
- `src/services/persistence.ts`, `src/services/queueCallGenerator.ts`,
  `src/services/callSimulator.ts`, `src/services/privacyIncidentWorkflow.ts`
- `src/scripts/fulfillPrivacyRequests.ts` - both the generic error catch
  and the two `requesterRef`-identifying console.log lines (masked via
  `maskIdentifier()`, not `sanitizeForLog()`, since `requesterRef` is a
  plain string, not an object)
- `src/app.ts` - morgan's `:url-no-query` custom token

## What was deliberately left as lower-priority (disclosed, not silently dropped)

The one-shot admin/migration/simulation scripts in `src/scripts/`
(`backfillQueuePatientAge.ts`, `bulkProcessQueue.ts`, `simulate*Exhaustive.ts`,
seed scripts, etc.) still use plain `console.error("<label>", error)` without
`sanitizeForLog()`. These were individually reviewed (see
`docs/security/log-data-protection-audit.md`) and judged low-risk - they
operate on synthetic/demo data by construction, are run by administrators
directly (not triggered by end-user input), and their error paths were
manually confirmed not to echo patient content. `scripts/logPrivacyAudit.mjs`
will continue to flag these on every run as candidates for the same
treatment if this standard is extended further.
