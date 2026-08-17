# External HTTPS Load Balancer Migration Plan

> **Superseded 2026-08-17 by PR-012.** Production DNS remained on Firebase
> Hosting and this proposed external load balancer was never placed in the
> serving path. The unused `ist-triage-url-map` chain and inactive managed
> certificates were removed from `triage-502706`; its Terraform declaration
> was removed to prevent recreation. This document is retained as historical
> design context only and must not be used as an active deployment procedure.

_Written 2026-08-06. Addresses two real, confirmed gaps by replacing
Firebase Hosting's `run` rewrite (currently in front of both custom
domains) with a real external HTTPS Load Balancer + Serverless NEG._

## Why this migration (two real, confirmed problems it solves)

### 1. Cookie-forwarding defect (found and confirmed this session)

Firebase Hosting's CDN layer (Fastly) in front of a `run` rewrite **does
not forward the `Cookie` header to the Cloud Run origin**. Confirmed via
direct, repeated live testing against `triaged.irisstar.tech`:

- A real login (`POST /api/v1/auth/login`) succeeds and creates a valid,
  correctly-stored server-side session (verified directly in the
  `ist_triage_demo` Postgres database - the row is 100% correct, matching
  session ID, not expired, not revoked).
- The immediate next `GET /api/v1/auth/session` call, using the exact
  same cookie, returns `401` through the custom domain - **every time**,
  reproduced identically across fresh logins and multiple retries.
- Hitting the Cloud Run service's own default `*.run.app` URL directly
  (bypassing Firebase Hosting entirely) with the identical cookie
  succeeds (`200`, `authenticated: true`).
- Ruled out CDN caching as the cause: every response shows `X-Cache:
  MISS`, including repeated hits to the identical edge node.

**This means the real, cookie-based login flow used by every human user
of both `triaged.irisstar.tech` and `triagedsoc2.irisstar.tech` is
currently broken** - a session is created successfully but the browser
can never prove it holds a valid one on any subsequent request through
the custom domain. This is a genuine, live, previously-undiscovered
defect, not something introduced by this session's other work (the
Cloud Run application code, database, and session logic were all
independently verified correct via direct testing against the
service's own URL).

**One existing code comment already anticipated exactly this** -
`CockpitUtilityBar.tsx`'s Help-link comment explicitly notes "Firebase
Hosting's rewrite-to-Cloud-Run proxy on the custom domain does not
forward the Cookie header" as the reason that one specific navigation
uses a query-string token instead of a cookie. That workaround was never
traced through to the main login flow, which relies on cookies
exclusively (`frontend/src/App.tsx`, `frontend/src/QueueContext.tsx` -
every API call uses `fetch(..., { credentials: "include" })`, never a
`Bearer` token).

### 2. WAF/Cloud Armor gap (NFR-014, already investigated in an earlier
   batch)

Cloud Armor security policies only attach to HTTP(S) Load Balancers, not
directly to Cloud Run - already correctly identified as "not achievable
as a quick win" in `docs/qr-questionnaire-backlog-tracker.md`'s earlier
investigation, requiring exactly the same Load Balancer + Serverless NEG
migration this plan describes.

**One infrastructure change closes both gaps.**

## What already exists (confirmed via direct inspection)

- Two Cloud Run services: `ist-triage-demo`, `ist-triage-soc2`
  (`me-central1`).
- Two custom domains, currently mapped via Firebase Hosting targets
  (`demo` -> `ist-triage-demo-502706-6a0c5`, `soc2` ->
  `ist-triage-soc2-502706`), each with a `run` rewrite in `firebase.json`.
- `roles/iam.securityReviewer`/`cloudsql.viewer` exist for the
  `ci-drift-detector` identity; no Compute Engine-related IAM exists yet.
- **The Compute Engine API is not yet enabled on this project**
  (confirmed via a real `gcloud compute addresses list` call returning
  `SERVICE_DISABLED`) - a genuine, first prerequisite step, not
  optional.
- No existing `google_compute_*` resources of any kind in
  `terraform/main.tf` - this is a fully greenfield addition to the
  Terraform-managed infrastructure, not a modification of anything
  existing.

## Target architecture

```
Client (browser)
  → DNS (triaged.irisstar.tech / triagedsoc2.irisstar.tech)
  → Global external IPv4 (2 static reserved addresses, or 1 shared with SNI-based routing)
  → Google-managed SSL certificate (per domain)
  → Target HTTPS Proxy
  → URL Map (host-based routing: triaged.* -> demo backend, triagedsoc2.* -> soc2 backend)
  → Backend Service (per domain) -> Serverless NEG -> Cloud Run service
  → [Cloud Armor security policy attached to each Backend Service]
```

Firebase Hosting continues to serve only the static SPA assets
(`dist-web`) if kept as a secondary path, or is retired entirely in favor
of the Cloud Run service serving both the SPA and the API directly
(the Cloud Run image already contains `dist-web`, confirmed in
`Dockerfile` - the app can serve its own static assets, so Firebase
Hosting is not structurally required once the LB is in place).

## Phased plan

### Phase 0 - Prerequisites (no risk, additive only)

1. Enable the Compute Engine API on `triage-502706`
   (`gcloud services enable compute.googleapis.com`).
2. Reserve 2 global static external IPv4 addresses (one per domain, or
   one shared address if using a single multi-host URL map - preferred,
   since it halves the DNS/cert surface):
   `gcloud compute addresses create ist-triage-lb-ip --global`.
3. Request 2 Google-managed SSL certificates (one per domain) via
   `google_compute_managed_ssl_certificate` - these take time to
   provision and validate (DNS-based domain validation), so this should
   be started well before any cutover, in parallel with everything else.

### Phase 1 - Build the LB in Terraform, fully parallel to the existing path (zero cutover risk)

All of the following are **new, additive Terraform resources** - nothing
existing is modified or deleted in this phase, and none of it carries any
live traffic yet:

1. `google_compute_region_network_endpoint_group` (Serverless NEG) for
   each Cloud Run service (`ist-triage-demo`, `ist-triage-soc2`),
   `region = "me-central1"`.
2. `google_compute_backend_service` for each, pointing at its NEG, with
   `protocol = "HTTPS"` (Cloud Run serves HTTPS-only), enabling Cloud CDN
   only if desired (recommend **off** initially, to avoid reintroducing
   any caching-of-session-responses risk - the exact class of bug this
   migration is fixing).
3. `google_compute_security_policy` (Cloud Armor) - start with a
   permissive/log-only policy (closes the real NFR-014 gap, but
   deliberately non-blocking at first, to avoid a false-positive rule
   breaking real traffic on day one) attached to both backend services.
4. `google_compute_url_map` with host-based rules: `triaged.irisstar.tech`
   -> demo backend service, `triagedsoc2.irisstar.tech` -> soc2 backend
   service.
5. `google_compute_target_https_proxy` referencing the URL map and both
   managed SSL certificates.
6. `google_compute_global_forwarding_rule` binding the reserved static IP
   + port 443 to the target HTTPS proxy.

**Validation for this phase**: hit the LB's IP directly with `curl -H
"Host: triaged.irisstar.tech" https://<LB-IP>/api/v1/runtime/environment
--resolve triaged.irisstar.tech:443:<LB-IP>` (forcing DNS resolution to
the new IP without changing real DNS yet) - confirms the LB path works
end-to-end, including the exact cookie round-trip that is broken today,
**before any real user traffic is ever routed through it.**

### Phase 2 - DNS cutover (the only step with real production risk)

1. Lower the DNS TTL for both `triaged.irisstar.tech` and
   `triagedsoc2.irisstar.tech` well in advance (at least 24-48h before
   cutover) to allow fast rollback if needed.
2. Update the DNS A/AAAA records to point at the new LB static IP(s),
   replacing whatever currently points at Firebase Hosting.
3. Monitor immediately: the exact login -> session -> queue round-trip
   this session used to find the bug, plus the existing 5xx-rate/latency/
   uptime alert policies (already real, already deployed) for any
   regression.
4. Keep the Firebase Hosting targets configured and reachable at their
   own `*.web.app` URLs (do not delete) for a full rollback path - DNS
   rollback is just re-pointing the record back, no rebuild needed.

### Phase 3 - Cloud Armor policy hardening (only after Phase 2 is stable)

Move the security policy from log-only to enforcing mode incrementally,
rule by rule, watching the same real-traffic metrics - this closes
NFR-014 for real, not just structurally.

### Phase 4 - Decommission the old path (only after a full observation
   window, e.g. 1-2 weeks stable)

Remove the Firebase Hosting `run` rewrites (or the Firebase Hosting sites
entirely, if the Cloud Run service serves its own static assets going
forward) - the very last, lowest-risk step, since by this point real
traffic has already fully moved off that path.

## Rollback plan

At every phase before Phase 4, rollback is trivial: DNS still points (or
can be pointed back) at the existing, untouched Firebase Hosting path,
which is never modified or deleted until Phase 4. The new LB resources
are purely additive until the DNS cutover in Phase 2, and even after
that, reverting DNS is a single record change.

## Verification checklist (every phase)

- `terraform fmt`/`validate`/`plan` clean.
- The exact login -> session -> queue reproduction used to find this
  bug, run against the LB path before cutover and against the live
  domain after cutover.
- Zero new `5xx`/`PERMISSION_DENIED`/error-severity log entries.
- Existing SLI/SLO alert policies (uptime, 5xx rate, p95 latency)
  continue to show healthy values through the cutover window.
- Confirm both `triaged.irisstar.tech` and `triagedsoc2.irisstar.tech`
  continue to serve the correct SPA assets and API responses.

## Effort and risk estimate

- Phase 0 + 1: Low risk (fully additive, no live traffic), Medium effort
  (several new Terraform resource types, SSL cert provisioning delay of
  potentially hours-to-a-day).
- Phase 2: The one real-risk step - a DNS cutover for two live,
  customer/QR-facing domains. Should be scheduled as an explicitly
  approved deployment window, not folded into an unattended pass.
- Phase 3: Low risk if done incrementally (log-only first).
- Phase 4: Low risk (cleanup only, after a stable observation period).

## Explicitly out of scope for this plan

- Any change to Cloud Run application code as part of this migration -
  the app already works correctly; only the network path in front of it
  changes.
- The alternative Bearer-token remediation path (switching the SPA off
  cookies) - a separate, smaller, faster fix that was explicitly not
  chosen this pass in favor of this larger, dual-purpose migration.
- Actually executing Phase 2 (the DNS cutover) - this plan defines the
  steps; the cutover itself requires a dedicated, explicitly-approved
  session given its production risk to both live customer/QR-facing
  domains.
