# Log Data Protection Audit (NFR-078, NFR-004 AI-tab)

_Audit date: 2026-08-06. Reviewer: engineering (this batch)._

## Scope

Exhaustive review of every logging/telemetry surface in the backend
(`src/`, `scripts/`), one-shot admin/migration/simulation jobs
(`src/scripts/`), and the frontend (`frontend/src/`). Automated repo-wide
grep plus manual contextual review of every hit.

## Sensitive-data categories checked

Direct identifiers (name, email, phone, national ID, passport, employee/
staff ID), quasi-identifiers (department, job title, age), clinical data
(medical narrative, symptoms, diagnosis, triage answers, medication),
credentials/secrets (passwords, tokens, session cookies, OTPs, MFA secrets,
API keys), and AI-adjacent data (prompts/outputs, if any).

## Findings

### Confirmed, fixed this batch

| Finding | File(s) | Fix |
|---|---|---|
| `requesterRef` (a real person identifier, the staff member's `istStaffId`) logged unmasked to console | `src/scripts/fulfillPrivacyRequests.ts` (2 `console.log` sites) | Added `maskIdentifier()`, applied to both console output sites. The durable `AuditEvent.metadata` (a legitimate, access-controlled audit record, not a "log file") intentionally still carries the real value. |
| 15 catch-all `console.error("<label>", error)` sites logging raw `Error` objects with no scrubbing (audit/MFA/reveal-workflow/persistence/HRMS-candidate-pool/call-simulator failures) | `src/services/securityAdmin.ts` (14), `src/services/persistence.ts`, `src/services/queueCallGenerator.ts`, `src/services/callSimulator.ts` (3), `src/services/privacyIncidentWorkflow.ts` | All wrapped with the new `sanitizeForLog()` (`src/utils/logSanitizer.ts`) |
| `morgan("combined")` logs the full request path **including query string** verbatim, with no masking, even though no current route was found to place sensitive data in a query parameter | `src/app.ts` | Replaced the `:url` token with a custom `:url-no-query` token that strips the query string before logging |

### Reviewed and confirmed NOT a defect

- `src/middleware/requestDuration.ts` - the newest logging surface, already
  designed to log only `method`/`path`/`statusCode`/`durationMs` - no
  bodies, no query string (`req.path` never includes it in Express).
  Confirmed clean by design.
- No call site anywhere logs a full request body, full user object, or
  full patient/queue-record object wholesale. This was specifically
  checked (the highest-severity anti-pattern) and confirmed absent.
- Frontend (`frontend/src/`) has **zero** `console.*` calls at all -
  confirmed via recursive grep.
- `src/db.ts`'s Prisma client logs only `["error"]` in production
  (`["warn","error"]` in dev) - not `["query"]` - so SQL statements and bind
  parameters are never logged by design; residual risk is limited to
  whatever a thrown Prisma error's own message text contains, which is now
  passed through `sanitizeForLog()` wherever it reaches a `console.error`
  call (see above).
- MFA enrollment/reset code paths never log the TOTP secret in plaintext
  anywhere - confirmed by direct review of every call site in
  `securityAdmin.ts`'s MFA functions.
- `src/services/communicationAdapters.ts`'s `JSON.stringify(payload)` at
  line 315 is the actual **outbound send payload** to Microsoft Graph's
  sendMail API (containing a recipient email + message body) - not a log
  call. No adjacent code path logs this payload; confirmed via grep of the
  same file and `callCenterGateway.ts` for any error/debug logging of
  `message`/`payload`.

### Reviewed, lower priority, deliberately not changed this batch (disclosed)

~20 one-shot admin/migration/simulation scripts under `src/scripts/`
(`backfillQueuePatientAge.ts`, `bulkProcessQueue.ts`, every
`simulate*Exhaustive.ts`, seed scripts, etc.) use plain
`console.error("<label>", error)` without `sanitizeForLog()`. These operate
on synthetic/demo data by construction, are invoked directly by an
administrator (not triggered by end-user input), and each error path was
manually confirmed not to echo patient content in its label text. Flagged
by `scripts/logPrivacyAudit.mjs` as candidates for the same treatment if
this standard is extended.

### AI-specific review (NFR-004 AI-tab, per its own applicability question)

- **No live AI/LLM/GenAI component exists anywhere in this codebase**,
  confirmed by grep for every common call-pattern (`generateContent`,
  `chat.completions`, OpenAI/Anthropic/VertexAI/GoogleGenerativeAI client
  usage) - zero matches.
- `src/services/ragShadow.ts` exists and has **zero** `console.*` calls
  (confirmed by direct grep). It is a compliance dry-run comparator that
  repackages `searchClinicalProtocols()`'s own deterministic output - it
  does not call an external model and has no prompt/output logging surface
  to secure.
- Therefore: this requirement's live-AI-logging clause has **no current
  applicability** - there is nothing to log-scrub because there is nothing
  generating AI content. This is stated as a fact about today's system, not
  a claim that AI logging controls exist - if a live AI/LLM component is
  added in the future, prompts/outputs and any retrieved-document content
  must go through the same `sanitizeForLog()`/redaction discipline defined
  in `docs/security/logging-redaction-standard.md` before this row can be
  re-confirmed against a real AI logging surface.

## Tests added (evidence)

- `tests/logSanitizer.test.ts` - 12 unit tests (email/phone/clinical/token/
  cookie/password/OTP redaction, nested objects, arrays, Error objects,
  circular references, non-mutation, safe-field preservation, string
  truncation)
- `tests/logPrivacyIntegration.test.ts` - 2 integration-style tests that
  spy on `console.log`/`console.error` and make a real request through the
  real Express app, confirming a synthetic PII marker value never appears
  in emitted output

## Runtime validation (B10)

A running e2e server instance (real soc2 database via Cloud SQL Auth
Proxy) was queried directly with synthetic marker values
(`PII_TEST_EMAIL_...`) in a request query string. The server's own
structured request-duration log and morgan HTTP access log were inspected
directly (not via curl - via a live browser fetch call and direct log file
review) and contained **zero** occurrences of the marker string, confirming
the `:url-no-query` fix and the pre-existing path-only structured logging
both hold in practice, not just in code review.

## Remaining limitations

- NFR-078's database-field-level-encryption-with-vault-keys clause remains
  unaddressed (separate architecture item, tracked under NFR-076/IS.33/
  IS.34) - **NFR-078 stays Partial** regardless of the logging work above.
- The ~20 lower-priority admin/simulation scripts noted above are not yet
  migrated to `sanitizeForLog()`.
- No third-party log-access governance, retention policy, or external log
  processor review was performed this batch (out of scope - this batch
  covers application-level logging content, not log infrastructure
  governance).
