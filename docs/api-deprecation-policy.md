# API Deprecation Policy

_Written to close NFR-187 ("confirm the supplier provides a minimum 3-month
deprecation notice for any API version change, with parallel support of the
old and new versions")._

## Current state, honestly

This API does not yet have a formal versioning scheme (see NFR-006 in the
questionnaire review - also an open gap) or a history of breaking API
changes, since this is a young, actively-developed application rather than
a long-lived public API product. This document establishes the policy that
will apply going forward, not a retrospective account of past deprecations
(there haven't been any yet).

## Policy

1. **Minimum 3-month notice.** Any breaking change to a request/response
   shape, endpoint path, or authentication mechanism used by an external
   caller (EMR/FHIR integration partners, the Oracle Fusion HCM sync, any
   future third-party integration) will be announced at least 3 months
   before the old behavior is removed.
2. **Parallel support during the notice period.** Where feasible, the old
   and new behavior will be supported simultaneously (e.g. via a version
   path segment or a backward-compatible additive field) for the full
   notice period, rather than a hard cutover.
3. **Non-breaking changes are exempt.** Adding a new optional field, a new
   endpoint, or a new optional query parameter is not considered a breaking
   change and does not require advance notice.
4. **Security-driven exceptions.** If a vulnerability requires an immediate
   breaking change to remediate, the standard notice period does not apply -
   affected integration partners will be notified as soon as practically
   possible, with the security rationale explained.

## Scope

This policy applies to the REST API surface consumed by external systems
(FHIR/EMR writeback, HRMS sync). It does not apply to internal
frontend-to-backend API calls within this same application, which are
versioned implicitly by deploying frontend and backend together.
