# Cross-Instance Session Authentication - Investigation and Finding

_Investigated 2026-08-05 as a dedicated follow-up to a bug flagged during
the queue-endpoint performance work: a valid, freshly-issued session
cookie consistently returned `401 Authentication required` on
`triagedsoc2.irisstar.tech`, while a Bearer token for the same user
succeeded. This document is the real, evidence-based conclusion - the
root cause turned out to be different from, and much better news than,
the "cross-instance in-memory cache" hypothesis that motivated this
investigation._

## Reproduction

1. `POST /api/v1/auth/login` against `https://triagedsoc2.irisstar.tech`
   - `200 OK`, real session cookie issued (`ist_triage_session=...`,
     `HttpOnly; SameSite=Strict; Path=/; Max-Age=1800; Secure`), real
     `accessToken` (JWT) also returned in the body.
2. `GET /api/v1/queue?limit=50` with that cookie - `401
   {"error":"Authentication required"}`, consistently, on every attempt,
   immediately (2ms server-side latency - rejected before any real work).
3. The identical request with `Authorization: Bearer <accessToken>` -
   `200 OK`, real data.

## Root cause: NOT a session-store or cross-instance defect

**Direct proof, in order**:

1. Queried the real `UserSession` table (via a local Cloud SQL Auth
   Proxy tunnel to the live database) for the exact session just
   created - **the row exists**, correct `sessionHash`, not revoked, not
   expired.
2. Called `getPersistedUserSession(sessionId)` directly (the compiled,
   deployed function, same database) - **returns the correct session**.
3. Called `readAuthenticatedSession(req)` directly (the full HTTP-level
   function, same cookie header, same database) - **returns the correct
   session**.
4. Tested the same cookie against the Cloud Run service's own direct
   URL (`https://ist-triage-soc2-gv6v4zyvuq-ww.a.run.app`, bypassing the
   custom domain entirely) - **`200 OK`, real data, cookie auth works
   perfectly**.

Steps 1-3 prove the application's session persistence, hashing, lookup,
and cross-instance DB-fallback logic are all **already correct** - there
is no session-store bug. Step 4 proves the failure is specific to
`triagedsoc2.irisstar.tech`, not to the application.

**The real cause**: `triagedsoc2.irisstar.tech` is served via Firebase
Hosting's `run` rewrite target (`firebase.json`), which proxies requests
to the Cloud Run service. **Firebase Hosting's `run` rewrite does not
forward the `Cookie` request header upstream to Cloud Run** - a known,
external, platform-level limitation of this integration, not an
application defect. Every cookie-only request through the custom domain
loses its `Cookie` header before the application ever sees it, which is
exactly why the rejection is instant (2ms) and 100% consistent regardless
of which Cloud Run instance receives it - the header is simply never
present.

## This is already known and already mitigated - discovered, not introduced, this pass

This exact limitation was already documented in this codebase from an
earlier session (`src/routes/helpRouter.ts`'s comment on the standalone
`/help` page) and **already has a real, working mitigation built for the
whole application**, not just `/help`:

- `frontend/src/authToken.ts`'s `installBearerTokenFetch()` patches the
  global `window.fetch` once at startup to attach
  `Authorization: Bearer <token>` to every outgoing API call.
- `frontend/src/main.tsx:9` calls `installBearerTokenFetch()`
  unconditionally at application startup - confirmed via source
  inspection, not assumed.
- Every real frontend API call (confirmed by grep across
  `frontend/src/QueueContext.tsx` and others) already goes through this
  patched `fetch` - the `credentials: "include"` option on those calls is
  a harmless, working fallback for the cookie path, not the primary
  mechanism.

**Conclusion: real browser-based users of this application are not
affected by this limitation today.** The failure only manifests for a
raw HTTP client (like `curl` or a hand-rolled load-test script) that
sends a session cookie without also attaching the Bearer token - exactly
what this investigation's own diagnostic testing and the earlier
performance-batch load test did.

## No code change made

Since no defect was found in the session-store, hashing, lookup,
expiration, revocation, or cross-instance logic, **no code was changed**
in this investigation. Introducing a change here (e.g., a "fix" to
in-memory session sharing) would not address the real cause (a header
being stripped in transit) and could not be tested to actually resolve
it, since the real cause is external to the application.

## What WOULD close the gap for a raw cookie-only client (not done, out of scope)

If cookie-only (non-JS) API access is ever a real requirement, the only
way Firebase Hosting would forward the `Cookie` header is to stop
routing this environment through Firebase Hosting's `run` rewrite and
instead front Cloud Run with a real external HTTPS Load Balancer +
Serverless NEG - the exact same migration already identified and
deliberately deferred in this engagement's earlier Cloud Armor/WAF work
(`docs/qr-questionnaire-backlog-tracker.md`), a genuine infrastructure
migration with real cost/risk, not a quick fix. Not recommended unless a
real, concrete need for cookie-only API access (outside the browser
frontend) emerges.

## Security assessment

No security control was changed. All of the following remain exactly as
they were, verified unaffected by this investigation:

- Session expiration, revocation, and rotation logic (unchanged, already
  correct).
- `HttpOnly`/`Secure`/`SameSite=Strict` cookie attributes (unchanged).
- CSRF posture (unchanged - `SameSite=Strict` plus this app's existing
  CORS allowlist).
- Tenant isolation (unchanged - not implicated by this investigation).
- Bearer/JWT signature verification (unchanged, confirmed working
  throughout this investigation).

## Compliance impact

No questionnaire row is closed or changed based on this finding - no
code was fixed because no application-level defect existed. This
document exists so a future investigator does not have to re-derive
this from scratch, and so the earlier performance-batch's "separate,
unresolved cookie-auth finding" note is understood correctly: it was a
real, reproducible symptom, but its cause is a platform integration
limitation the application already correctly works around for real
users, not an open application bug.
