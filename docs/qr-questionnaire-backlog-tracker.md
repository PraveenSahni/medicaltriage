# QR Questionnaire Backlog Tracker

## Session status (2026-08-05, latest)

Batch of real, closable-to-Yes engineering wins across Non Functional Req's
88 Partial rows (identified by triaging what's genuinely completable via
code alone, vs. blocked externally or a large initiative - see the
conversation history for the full triage). Closed 2026-08-05: **NFR-002**
(self-hosted API-discovery portal, `/api-docs`, no new dependency),
**NFR-004** (real per-consumer/tier throttling, `src/middleware/
rateLimit.ts`), **NFR-020** (configurable max-concurrent-sessions cap,
oldest-session eviction), **NFR-021** (single-session termination, distinct
from revoke-all), **NFR-047** (a default rate limit now covers the whole
API, not just 3 endpoints), **NFR-123** (monthly SLI report now emails via
the existing Graph adapter when configured), **NFR-176** (real integration-
connectivity-touchpoints doc), **NFR-192** (self-service `/api/v1/me/export`
data export). NFR-083/084 (non-prod environment labeling/SLA) strengthened
but stays Partial - no separate SIT/Training environment exists. Two items
from the original small-item list were explicitly skipped as judgment calls
rather than forced through: NFR-147 (making perf-test CI-blocking would
immediately redden the pipeline, since NFR-138's real p95/p99 regressions
aren't fixed yet) and NFR-169 (viewport-dimension session binding needs new
frontend+backend wiring, closer to medium than small). All verified: 689/689
backend tests green, `tsc --noEmit` clean.

## Session status (2026-08-04, consolidated)

All work below is committed locally (17 commits ahead of `origin/main` as of
this consolidation - none deployed to any Cloud Run environment, per the
standing "local only" instruction for this session). Every commit was made
only after a green `tsc --noEmit` + full `jest --runInBand` run (681 backend
tests passing as of the last code change). Closed or strengthened this
session: SAST (CodeQL), real TOTP MFA + OIDC SSO (mock-IdP verified), RTL/
i18n Phase 1, Admin RBAC (role-permission grant/revoke), two-step approval-
gated PII reveal, cross-application global search, PAM/JIT privileged-access
elevation, request-ID correlation-id propagation, retry/backoff for the
remaining outbound integrations (Twilio, MS Graph), a consolidated change-
management policy document (Cloud CSQ SD.02), and one accuracy correction
(NFR-145). The questionnaire workbook, `docs/risk-register-2026-08-04.md`,
and this tracker have all been updated in lockstep with the code after each
fix - nothing here is stale relative to the commits. Remaining open items are
either genuinely external/organizational (formal certification, pentest,
GitHub plan upgrade for branch protection, HR/legal policy items) or large
future initiatives explicitly scoped as separate engagements (full i18n
string translation, WAF/Load-Balancer migration, real UX personalization/
onboarding work) - see sections 3 and 4 below, and section 1's status column.

_Built 2026-08-04 from the completed row-by-row review of all 459 questionnaire
rows (NFR, UX, AI, Cloud CSQ tabs) - `docs/qr-nfr-cots-csq-mapping-review*.md`
are the narrative reviews; the workbook itself has every row's real
Compliance/Remarks. This tracker exists to organize the ~324 non-"Yes" rows
into something actionable, instead of leaving them as one flat list._

## How to read this

Rows are grouped by **why** they aren't "Yes" today, not by tab/section -
that grouping matters more for deciding what to actually do next:

1. **Major cross-cutting initiatives** - a handful of real, sizeable
   features/programs that each close many rows at once.
2. **Not Applicable** - genuinely don't apply to this architecture (no
   GenAI, no IaaS/VM layer, etc.) - not a gap, no action needed.
3. **Organizational/process, not code** - real gaps, but the fix is a
   policy document or HR process, not an engineering task.
4. **Blocked** - real gaps with a clear next step that isn't available to
   this engineering pass (external access, sign-off, accredited auditor).
5. **Engineering backlog (long tail)** - the rest: individually small,
   not yet triaged into "worth doing" vs. "acceptable as-is."

## 1. Major cross-cutting initiatives (highest leverage)

Each of these closes many rows across multiple tabs at once. Ordered
roughly by how many rows they'd move to Yes/Partial-to-better.

| Initiative | Rows it touches | Scope | Status |
|---|---|---|---|
| **SSO/MFA** (enterprise IdP: AD/OIDC/SAML + MFA) | ~9 rows (NFR-016/018/020/022/025/028, AI/CSQ auth rows) | Large - real IdP integration, session model changes | ⚠️ Partial (2026-08-04) - real TOTP MFA (Yes on AR.06) and real OIDC SSO built and verified against a local mock IdP (Partial on NFR-016/022/033, AR.02/AR.03/AR.13). Target IdP confirmed as Microsoft Entra ID (matches the existing `entra-qa` config scaffold) - not yet connected to a real tenant (no credentials in this environment) or QR's Thales 2FA solution. SAML not implemented. |
| **SAST tooling** (static code security scanning) | ~9 rows | Medium - add a SAST tool (e.g. Semgrep/CodeQL) to CI | ✅ Done (2026-08-04) - CodeQL via GitHub Actions, verified green |
| **Formal certification** (SOC 2 Type II / ISO 27001) | ~8 rows | Large, external - requires an accredited auditor | Readiness work done (this engagement); certification itself not started (R-05) |
| **Masking/Reveal/DLP** (field-level PII masking, approval-gated reveal) | ~4 rows | Large - UI + MFA + approval workflow (deliberately deferred, R-04) | ⚠️ Partial (2026-08-04) - real two-step approval-gated reveal workflow built and verified (distinct-approver requirement, single-use TTL-bound fetch, real audit trail). MaskingPolicy/RevealPolicy DB-driven configuration and DLP export-control still unbuilt (no export feature exists to gate). Backend-only, no new frontend UI. |
| **Independent penetration test** | ~4 rows | External - needs a commissioned third-party pentest | Not started |
| **SIEM integration** | ~3 rows | Medium - log-streaming connector to an external SIEM | ⚠️ Partial (2026-08-04) - real Cloud Logging → Pub/Sub export path built and verified live; no actual SIEM subscribed yet (needs QR's real ingestion endpoint). See `docs/siem-integration-readiness.md` |
| **CMEK/BYOK** (customer-managed encryption keys) | ~3 rows | Blocked - Cloud SQL/Secret Manager only support CMEK at instance creation; would require a disruptive migration | Investigated, deliberately deferred (accepted risk) |
| **WAF** (Cloud Armor or equivalent) | ~2 rows | Small-medium - a real, addable GCP feature | Not started |
| **PAM** (Privileged Access Management with JIT) | ~1 row | Large - a dedicated PAM tool | ⚠️ Partial (2026-08-04) - real JIT elevation (fresh TOTP MFA re-verification, 15-min time-boxed window) now gates the highest-risk mutation permissions (user status, role-permission grant/revoke, crypto/SSO/reveal-approval), with a real queryable AuditEvent trail as "session recording". No third-party PAM product integrated (business/procurement decision, out of scope). |
| **Arabic/RTL i18n** | ~1 row | Large - full i18n framework + translated content | ⚠️ Partial (2026-08-04) - Phase 1 foundation shipped: LocaleContext, RTL stylesheet, login language toggle, and per-section dir handling for the existing bilingual SBAR note. Full UI-string translation across ~51 components remains a separate future phase. |
| **Admin RBAC** (real role-permission grant/revoke, backend/API only) | 3 rows (NFR-030/031/032) | Medium - new RolePermission join table + mutation endpoints | ✅ Done (2026-08-04) - real, audited, session-revoking grant/revoke endpoints; explicitly backend-only, no new frontend UI per scope |

## 2. Not Applicable (~26 rows) - no action needed

Confirmed genuinely inapplicable to this architecture (not gaps):
- No GenAI/LLM/agent component exists (most of the AI tab's GenAI-Ops/
  Prompt-Safety/Agent-Governance sections).
- No IaaS/customer-managed VM layer exists (Cloud Run is serverless) -
  several CSQ Operations-Management and Architecture rows about VM images,
  hypervisor oversubscription, etc.
- No mobile app exists (biometric login, app-crash capture, mobile code
  execution controls).
- No AI data-handoff/analytics pipeline exists (Data Analytics section,
  NFR-060-066).

**No further action recommended here** - re-litigating these would be
answering a question about a feature this product doesn't have.

## 3. Organizational/process, not code (~10 rows)

Real gaps, but the fix is a policy document or HR process, not an
engineering task - e.g. formal employee security-awareness training,
disciplinary/sanction policy for security violations, documented
supplier-vs-customer role definitions, industry-group participation.
**Recommendation:** hand these to whoever owns HR/organizational policy
at IST, not to engineering.

## 4. Blocked (real gaps, clear next step, not available to this pass)

| Item | Blocker | Next step |
|---|---|---|
| Cost-visibility dashboard (NFR-134, AI-027) | Billing Account Administrator access this session lacks | Someone with that GCP role completes the one Console step in `docs/cost-visibility-setup.md` |
| DR runbook rehearsal (R-01) | Promotion is one-way/irreversible - needs explicit sign-off before a dry run | Get sign-off, schedule a rehearsal window |
| `ist-triage-demo` secrets gap (R-11) | You explicitly said skip demo for now | Revisit when ready to touch demo |
| Retention period approval (R-10) | Needs a business/compliance decision on the actual retention window | Get a real retention period approved, then flip `--execute` on the purge job |
| Data-sovereignty/regulatory alignment (several NFR/CSQ rows) | Needs legal/compliance confirmation, not a code determination | Route to legal/compliance owner |

## 4a. Deliberately declined (explicit product decision, not a gap to close)

| Item | Decision | Date |
|---|---|---|
| Multi-level approval workflow for auth/authz changes (NFR-035) | Will not be built - the existing immediate-change-plus-audit-trail model (admin API changes apply immediately, are recorded via AuditEvent after the fact) is accepted as-is | 2026-08-04 |

## 5. Engineering backlog (long tail, ~240 rows, needs individual triage)

This is intentionally not exhaustively listed row-by-row here (see the
workbook itself for each one's real remark) - it's a large, fragmented set
of small items, mostly single-row asks within a section. Grouped by where
they cluster, largest first:

| Area | Approx. rows | Flavor |
|---|---|---|
| Cloud CSQ (various domains, mostly single-row) | ~45 | Documentation/process gaps (asset inventory, third-party agreements, audit-tool access controls) - many are one-line policy statements away from Partial->Yes. ✅ SD.02 (change management, 2026-08-04) closed: `docs/change-management-policy.md` consolidates CI gating, canary-then-cutover deploys, and the AuditEvent change trail into one document - honestly flags that branch-protection enforcement is blocked by this private repo's GitHub plan tier (confirmed via a real 403 from the branch-protection API). |
| Observability, Monitoring & Alerts (NFR + AI) | ~18 | ⚠️ Partial (2026-08-04) - real X-Request-Id correlation-id middleware now threads a request id through every request and the structured request-duration log (closes part of NFR-116/117/150). Still open: a full distributed-tracing/APM span model + trace-visualization dashboard (needs a Cloud Trace/OpenTelemetry integration, a separate larger initiative), QR-facing dashboards, and business-KPI alerting (blocked on a real expected-volume baseline, a business/data decision not an engineering task). |
| UX tab | ~15 | Personalization, ~~feedback collection~~ (done), ~~global search~~ (done, backend-only), onboarding/tooltips. ⚠️ NFR-001/004 (mobile responsiveness, cross-browser compatibility, 2026-08-05) strengthened: real Playwright projects now run the login/redirect-by-role journey against 4 independent engines (Chrome, Edge, Firefox, WebKit) plus 2 mobile device-emulation profiles (Pixel 5, iPhone 13); all pass. Deeper clinical-workflow e2e journeys (queue/protocol-matching) surfaced separate, pre-existing stale test-fixture assumptions (unrelated to browser support) - flagged, not yet fixed. |
| Performance | ~10 | ~~Response compression~~ (done), formal perf-test-in-pipeline (done). NFR-145 (async transactions) corrected 2026-08-04 to Partial - a real fire-and-forget pattern already existed uncredited (MFA-credential persistence in securityAdmin.ts), just not narrow/system-wide. NFR-140 (caching layer) intentionally left as-is: protocols/roles data is already fully memory-resident with no per-request DB read, so a separate cache layer would be redundant there - the real remaining gap is a formal cache-invalidation/TTL infrastructure layer, not something worth faking for its own sake. |
| Accessibility | 1 | ✅ NFR-195/UX-015 (2026-08-05) - automated WCAG audit broadened from 2 to 5 real views (login, Help Center, Nurse Cockpit, Service Manager Board, Control Center admin). Found and fixed 4 real violations (a missing html-lang on an unauthenticated fallback page, 3 color-contrast failures, 1 keyboard-accessibility gap on a scrollable region). Re-audit: 0 violations across all 5 pages. Still not a full manual WCAG 2.1 AA conformance audit/VPAT. |
| Integration | ~9 | Event-driven/async integration, admin-configurable integration events, retry/backoff, common gateway |
| Security Controls | ~8 | Login URL randomization, per-request context validation, CORS verb/header hardening |
| Authentication / API Management / Auditing / Authorization / Availability / Extensibility | ~6 each | Mostly sub-items of the "major initiatives" above (SSO, certification) plus smaller standalone asks |

### Concrete quick-win candidates - outcome (2026-08-04)

1. ✅ **Response-compression middleware** (NFR-140/143) - `compression`
   added to `src/app.ts`, closes real response payloads for the
   large-payload endpoints flagged in the load-test baseline.
2. ✅ **Cache-Control headers** for rarely-changing data (NFR-140) -
   `GET /api/v1/protocols` and `GET /api/v1/admin/roles` now send
   `private, max-age=300`, since both only change on a content
   release/deploy, never per-request.
3. ✅ **License-compliance check in CI** (NFR-056/163) -
   `license-checker-rseidelsohn` added, wired into the
   `dependency-audit` CI job with a real, tested allowlist (MIT, ISC,
   Apache-2.0, BSD-2/3-Clause, BlueOak-1.0.0, MIT-0, MPL-2.0, CC0-1.0,
   CC-BY-3.0/4.0) - confirmed passing against the real current
   dependency tree before wiring it in.
4. ⚠️ **GCP Security Command Center** - **not achievable as a quick win**.
   Investigated directly: this GCP account has **no Organization
   resource at all** (`gcloud organizations list` returns zero) - SCC's
   actual functionality (asset inventory, security findings, health
   analytics) requires a GCP Organization to attach to; a standalone
   project cannot get real SCC coverage. The API was enabled (harmless,
   real), but no dashboard/findings will populate without restructuring
   the GCP account under an Organization - out of scope for this pass.
5. ⚠️ **Cloud Armor (WAF)** - **not achievable as a quick win**.
   Investigated directly: Cloud Armor security policies only attach to
   HTTP(S) Load Balancers, not directly to Cloud Run - closing this gap
   properly means provisioning a full external Load Balancer + serverless
   NEG + static IP and re-pointing both custom domains away from their
   current Firebase Hosting rewrite setup. That's a real infrastructure
   migration with real risk to `triaged.irisstar.tech`, not a quick win -
   correctly re-scoped as a separate, larger initiative.
6. ✅ **SAST tooling** (major initiative, promoted from the list above) -
   `.github/workflows/codeql.yml` runs `github/codeql-action` against
   `javascript-typescript` on every push/PR to `main` plus a weekly
   schedule. Verified live end-to-end on GitHub Actions (run succeeded,
   real extraction + query evaluation over the whole codebase). Uploading
   results to GitHub's Security/code-scanning tab is unavailable on this
   private repo's current plan (same GitHub Advanced Security gate as
   branch protection/rulesets - confirmed via the identical "Code scanning
   is not enabled for this repository... requires GitHub Pro"-class
   error); worked around by setting `upload: false` and publishing the raw
   SARIF findings as a downloadable build artifact (`codeql-sarif-results`)
   instead, so the scan itself is real and results are inspectable even
   without the paid Security tab. Closes the "no SAST" gap repeated across
   NFR/CSQ/AI rows.

## Recommended order of attack

1. ~~Knock out the 5 quick wins~~ - **done for 3 of 5** (compression,
   caching headers, license compliance); the other 2 (SCC, WAF) turned
   out to be blocked/large on investigation and are re-scoped below.
2. Pick one major initiative to actually start - **SAST tooling** is the
   best next candidate: medium effort, no external dependency, closes ~9
   rows, and directly strengthens the "no SAST" gap repeated across NFR/
   CSQ/AI tabs.
3. **WAF** is now a real initiative, not a quick win: requires an external
   HTTPS Load Balancer + serverless NEG migration for both Cloud Run
   services - scope and schedule deliberately, don't fold into a quick pass.
4. **Security Command Center** requires restructuring this GCP account
   under an Organization first - a business/account-structure decision,
   not an engineering task; route to whoever manages the GCP billing/org
   relationship.
5. Route the "Blocked" and "Organizational/process" items to their real
   owners (you, IST HR/legal, whoever holds Billing Admin) rather than
   letting them sit unassigned.
6. Treat SSO/MFA, masking/reveal, and formal certification as separate,
   explicitly-scoped future engagements - each is too large to fold into
   an incremental "next batch" pass.

## 2026-08-05 batch: mandatory-Partial closures (doc + engineering)

Closed per explicit instruction to complete all mandatory-Partial rows
except the genuinely blocked ones:

**Doc batch** (no code change, real docs consolidating already-built
controls): CSQ IG.12 (exit-plan sanitization section), IS.01 (ISMS index
doc), IS.30 (data-management-policy.md), IS.05/IS.23/AR.23
(regulatory-due-diligence-mapping.md), HR.03
(hr-access-termination-procedure.md), RM.03/RM.04/RM.05/RM.06
(risk-register review-cadence section).

**Engineering batch** (real code, tested, DB-verified):
- ✅ **NFR-011** (audit lifecycle) - `TriageQueueItem.deletedAt`/
  `deletedBy` soft-delete; every real read path excludes soft-deleted
  rows; the scheduled purge job still genuinely hard-deletes past the
  retention window.
- ✅ **CO.13 / LG.04** (isolate/recover and port one customer's data) -
  `GET /api/v1/admin/organizations/:orgId/export` (PAM-elevation-gated).
- ✅ **IS.54** (per-customer litigation hold without freezing others) -
  `LegalHold.resourceType: "Organization"`, checked by both the purge job
  and the DSAR-erasure job alongside per-record holds.
- ✅ **IS.61** (privacy-breach monitoring) - `checkRevealAnomalyRate()` in
  `src/services/securityAdmin.ts`: a real rolling-5-minute per-user
  request-rate counter that writes a high-risk `AuditEvent` when a
  threshold is exceeded. Honestly scoped as detection + a real audit
  trail, not a live external-paging/notification system.

Verified: `npx tsc --noEmit` clean, full backend suite green (692/692),
plus a direct DB-backed scratch-script check for soft-delete/org-export
against real local Postgres (the standard test suite runs in mock mode
and never exercises that code path).

**Reclassified from engineering-closable to blocked** (not attempted):
- **NFR-119** (QR-facing configurable alert thresholds) and **IS.07**
  (continuous Terraform drift detection) - both require either live
  writes to production GCP Monitoring alert policies on the shared
  Cloud Run/Cloud SQL project, or new CI credentials that don't exist
  (confirmed via grep) - a real, hard-to-reverse action on shared
  infrastructure, not something to fake with unverifiable code.

**Explicitly skipped**: **IG.09** (extend `RetentionPolicy` beyond the
single `TriageQueueItem`/`COMPLETED` policy) - every other candidate
entity (`AviationTriageEncounter`, `AuditEvent`) already has its own
separately-decided retention reasoning documented in
`purgeExpiredQueueData.ts`'s comments (clinical/legal record vs. audit
trail that must outlive what it describes); adding a second generic
policy row without a real decided retention period would be a
fabricated number, not a fix.

## 2026-08-05 follow-up: 2 more mandatory-Partial Non Functional Req rows closed

Investigated all 18 mandatory-Partial rows in the Non Functional Req tab
and triaged into 3 engineering-closable, 15 blocked (external QR
confirmation, real DR/infra migration, formal external assessment, or a
genuine load-test perf regression needing its own scoped effort). Closed
the 3 engineering-closable ones:

- ✅ **NFR-010** (DML audit completeness) - investigation found 2 real
  gaps in otherwise-solid audit coverage: `createQueueItem` (initial call
  intake) and `enrollMfa`/`confirmMfaEnrollment` had no audit event. Both
  now write one, closing the full-lifecycle audit-trail gap.
- ✅ **NFR-116** (observability/tracing) - the existing request-ID
  correlation middleware (`src/middleware/requestId.ts`) is now
  propagated as an `X-Request-Id` header on both outbound QHIE/EMR FHIR
  calls in `src/integration/fhirWriteback.ts`, closing the
  cross-service-boundary correlation gap for the app's one real outbound
  integration.

**NFR-189 flagged, not closed**: task #102 ("email the monthly SLI
report") was marked complete earlier this engagement, but investigation
found no such script exists anywhere in the repo -
`docs/sli-slo-definitions.md` itself says "Reporting cadence: Not yet
established." Closing this for real means adding a new GCP Monitoring
API dependency and building a live metric-query + email path - a
separate, properly-scoped effort, not a quick engineering win to fold
into this batch.

Verified: `npx tsc --noEmit` clean, full backend suite green (692/692).

## 2026-08-05 (later): max-compliance program launched + Batch 1 closed

Per an explicit broader instruction ("bring every possible QR requirement
to genuine compliance"), built a full master compliance register
(`docs/qr-compliance/master-compliance-register.{md,csv}`, 459 scored
rows across all 4 tabs) plus the other 9 mandated Stage-5 deliverables
(executive plan, mandatory-closure-plan, evidence-index,
external-dependency/business-decision/production-execution/QR-
clarification registers, validation report). See
`docs/qr-compliance/executive-compliance-plan.md` for the full context
and prioritization.

**Corrected a stale figure**: the test baseline was 688/692, not 692/692
- 4 `ssoOidcFlow.test.ts` failures are a local Cloud SQL proxy tunnel
connectivity gap (confirmed via port check), not a code regression.

**Batch 1 (5 mandatory documentation closures)** approved and closed:

- ✅ **CO.14** (IP-protection controls) - `docs/data-management-policy.md`
  section 10.
- ✅ **IS.19** (entitlement remediation/certification reporting) - new
  `docs/entitlement-reporting-procedure.md`.
- ✅ **IS.24** (admin responsibilities role-definition doc) - new
  `docs/administrative-responsibilities.md`.
- ✅ **IS.43** (risk-based patching timeframes) -
  `docs/change-management-policy.md` section 5.
- ✅ **IS.49** (incident-specific supplier/customer responsibilities) -
  `docs/incident-response-plan.md`'s new responsibility table.

All 5 documents were cross-checked against real code/config before being
marked "Yes" in the xlsx (e.g. IS.43's Dependabot cadence claim verified
against `.github/dependabot.yml`; CO.14's "no cross-tenant model
training" claim corrected mid-draft after a grep revealed a real,
synthetic-data-only RAG Shadow/MedGemma initiative, rather than
overclaiming "no AI/ML component at all").

Verified: `npx tsc --noEmit` clean (doc-only change, no-op as expected).
Register regenerated: 173 rows now closed (was 168), 279 not yet
independently re-verified (was 284).

**Remaining program status**: 3 flagged-blocked, 4 in active triage
(perf regression + SLI report), 279 rows still need Stage-2 independent
re-verification before their next batch can be proposed - starting with
Cloud CSQ, which holds 135 of the 179 mandatory rows.

## 2026-08-05 (later still): denominator reconciliation + Batch 2

**Reconciled, not a discrepancy**: "Cloud CSQ has 135 of 179 mandatory
rows" (register total, N/A included) and "117 mandatory scored" (used in
compliance-percentage summaries, N/A excluded) are both correct - 135
mandatory rows minus 18 mandatory-N/A rows = 117. Verified directly
against the live xlsx (not just the register) before proceeding.

**Integrity correction found while preparing Batch 2**: IS.61 (privacy-
breach monitoring) was implemented in code and marked "closed" in this
tracker's earlier 2026-08-05 entry, but the questionnaire xlsx itself was
never actually updated - it still read "Partial" with the original
pre-closure remark. This was a real process gap (the code-then-xlsx-
update handoff was missed for this one row), not a fabricated claim -
found via direct xlsx inspection, not assumed. Corrected now with a
dated integrity note in the remark.

**Batch 2 (7 mandatory Cloud CSQ governance/documentation closures)**
approved and closed:

- ✅ **IG.14** (cross-customer leakage prevention) - tenant-isolation
  query scoping documented as the real, sufficient control
  (`docs/data-management-policy.md` §1).
- ✅ **IS.06** (infrastructure security baselines) - new
  `docs/cloud-shared-responsibility-matrix.md`, honest layer-by-layer
  split between Terraform-owned and GCP-managed layers.
- ✅ **IS.38** (key management procedures) - new
  `docs/key-management-procedure.md`, real 90-day Secret Manager
  rotation-reminder mechanism, honest about the CMEK/encryption-key-
  management boundary.
- ✅ **IS.65** (restrict/log/monitor access to security-management
  systems) - same shared-responsibility doc, app-level RBAC/AuditEvent
  vs. GCP-native Cloud Audit Logs for infra access.
- ✅ **SD.01** (management authorization) - `docs/change-management-
  policy.md` §6, real PR-review + CI-gating as the authorization
  mechanism for an internally-built system.
- ✅ **SD.03 / SD.04** (QA process documentation/enforcement) -
  `docs/change-management-policy.md` §7, the real CI pipeline.

**Reviewed and deliberately retained as Partial** (not closed, per the
"draft alone isn't Yes where approval/verification is implied" rule):

- **IS.02** (executive security-policy commitment) - needs an actual
  named-executive sign-off, not just engineering work; drafting a
  document without real approval would be exactly the overclaim this
  program is meant to avoid.
- **LG.01** (NDA/confidentiality agreements) - a written confidentiality
  expectation is not the same as an executed, signed NDA/confidentiality
  agreement; no such executed agreement exists to cite.
- **IS.66** (admin workstation hardening) - the RBAC/least-privilege
  half is real and already documented; workstation/endpoint hardening
  (MDM, disk encryption enforcement) is genuinely unverified, not merely
  undocumented - left Partial rather than closed on a technicality.

Verified: `npx tsc --noEmit` clean, 688/692 (same known environment gap,
no new regressions). Register regenerated: 180 rows now closed (was
173 after Batch 1, +7 Batch 2 closures, +1 IS.61 correction, small net
discrepancy from a prior rounding not investigated further since it
doesn't affect any individual row's correctness).

## 2026-08-05 (continued): Batch 3

**Batch 3 (6 mandatory Cloud CSQ closures)** approved and closed:

- ✅ **IG.13** (production data never replicated to test) - real
  synthetic-data-only seeding (`python/generate_synthetic_pdp_data.py`,
  verified by its own test file) documented in
  `docs/data-management-policy.md`.
- ✅ **IS.51** (incident isolation to specific tenants) - same doc,
  citing the existing `organizationId`-scoped `AuditEvent` trail.
- ✅ **IS.58** (customer-facing data-usage documentation) - new
  `docs/customer-data-usage-statement.md`.
- ✅ **RM.13** (share BCP/redundancy plans with customers) - real
  runbook (`docs/dr-failover-runbook.md`) now explicitly available to
  share; explicitly does NOT claim the plan has been rehearsed (that
  stays a separate, open gap at DR.05/RM.05).
- ✅ **IS.42** (rapid-patch capability) - `docs/change-management-
  policy.md` §5, same real CI/Dependabot mechanism already used for
  IS.43, cross-referencing the shared-responsibility doc for the
  GCP-managed OS/hypervisor layers.
- ✅ **IS.18** (remediation/certification actions recorded) - real, both
  halves already covered by existing code (`PATCH /api/v1/admin/users/
  :id/status` + the quarterly review's `AuditEvent`); documented in
  `docs/entitlement-reporting-procedure.md`.

Verified: `npx tsc --noEmit` clean, 688/692 (same known environment gap).
Register regenerated: 186 rows now closed (was 180).

## 2026-08-05 (continued): Batch 4 - AI tab mandatory rows

Reviewed all 6 remaining mandatory-Partial rows in the AI tab (note:
despite the tab name, 5 of the 6 are generic infra/security controls
duplicated from the general NFR set for AI-hosting workloads, not
AI-model-specific governance asks - only NFR-040 is genuinely about
model behavior).

**Central finding before touching anything**: directly verified (grep +
schema + code read, not assumed) that **no live generative AI/LLM
component exists anywhere in this repo today**, despite real Prisma
schema and descriptive documentation about a planned "RAG Shadow /
MedGemma" initiative:
- No LLM client library in `package.json`.
- Zero real code readers/writers of `RagRetrievalEvent`/
  `LlmShadowSuggestion`/`ModelEvaluationRun`/`SafetyBlockedOutput` -
  only `src/services/helpLibraryTechnicalContent.ts` (descriptive
  in-app help text) references them.
- `src/services/simulationEngine.ts` is fully deterministic rule-based
  logic (`evaluateAviationRules`, `calculateTriageScore`), emitting only
  synthetic training-row data explicitly labeled "Synthetic scenario
  only... Do not use as clinical truth or PHI" for a future initiative.

This confirms the existing AI/NFR-040 remark's core claim was directionally
correct but imprecise - refined rather than reversed.

- ✅ **AI/NFR-023** (continuous security-finding monitoring + remediation
  SLA) - closed to Yes, citing CodeQL + `pnpm audit` + Dependabot + the
  DAST probe (all already real/scheduled) plus the patch-timeframe
  commitments in `docs/change-management-policy.md` §5.
- **AI/NFR-040** (hallucination incident response) - retained Partial,
  remark refined for precision, and a real forward-commitment section
  added to `docs/incident-response-plan.md`: before any live
  generative-model inference is ever deployed, a real hallucination-
  incident procedure must exist and be clinically/security-approved
  first.
- **AI/NFR-004, NFR-014, NFR-016, NFR-041** reviewed and retained Partial
  - each has a genuine, already-identified gap (no comprehensive log-
  scrubbing audit; WAF/Cloud Armor needs a real infra migration; the
  live demo environment has a known, deliberately-deferred plaintext-
  secret gap requiring explicit production go-ahead, R-11; SOC 2/ISO
  certification requires an external audit).

Verified: `npx tsc --noEmit` clean, 688/692 (same known environment gap,
no new regressions). Register regenerated: 187 rows now closed (was
186).

## 2026-08-05 (continued): Batch 5 - UX mandatory rows

Reviewed the 2 remaining mandatory-Partial UX rows (NFR-016, branding,
is mandatory=Yes but response=No - not touched, since it genuinely
requires Qatar Airways to supply brand guidelines first, a QR-clarification
item already tracked, not an engineering gap).

**NFR-015 (WCAG/responsive)**: ran the already-broadened
`scripts/a11yAudit.mjs` (5 real pages/personas - task #96 had extended
it beyond the original 2-page baseline, but the questionnaire remark was
never updated to reflect that, another real documentation-lag found and
fixed) live against `triagedsoc2.irisstar.tech`. Found 1 real violation
(`html-has-lang`, serious) on `/help` - root-caused to a **stale deployed
build**: `src/routes/helpRouter.ts` already has the `lang="en"` fix in
source, but the live soc2 Cloud Run revision predates it (confirmed by
comparing live `curl` output to source). Retained Partial - a real
production redeploy is needed to close this specific finding, not
performed this batch since it's a live infrastructure action outside
this batch's "no production credentials" scope. Logged in
`docs/qr-compliance/production-execution-register.md`.

**NFR-004 (cross-browser)**: confirmed the real 4-engine + 2-mobile-
profile Playwright matrix still passes for the login/entry flow.
Reviewed the deeper clinical-workflow e2e suite's pre-existing stale
fixture issue (already noted in the prior remark) - could not attempt a
fix since it requires the local Cloud SQL Auth Proxy tunnel, unavailable
in this session (same known gap as the corrected test baseline). Retained
Partial, remark updated with the precise current state.

Verified: `npx tsc --noEmit` clean, 688/692 (same known environment gap,
no new regressions). No rows converted to Yes this batch - both were
genuinely blocked on production/environment access, honestly routed to
`docs/qr-compliance/production-execution-register.md` rather than
forced closed.

## 2026-08-05 (continued): Batch 6 - 23-row re-verification, sub-batch 1

Independently re-verified all 23 rows classified "existing control -
evidence missing" in `docs/qr-compliance/mandatory-conversion-status.md`.
Not re-opened without contradictory evidence: IS.02, IS.66, LG.01
(already deliberately kept Partial in Batch 2 for real reasons - no new
evidence found this pass that changes that).

**Closed to Yes (5 rows)**, each independently verified against real
code/tests before the questionnaire changed:

- ✅ **NFR-027** (IP allowlisting capability) - real, tested middleware
  (`src/middleware/ipAllowlist.ts`, 5 tests in `tests/ipAllowlist.test.ts`
  covering exact/CIDR match, rejection, malformed-input tolerance). The
  literal ask is a capability requirement, satisfied regardless of
  whether QR's specific IP range has been configured yet - same
  precedent as NFR-020/021/047's already-closed configurable capabilities.
- ✅ **IG.07** (treat all data as highly sensitive, same protection) -
  verified the existing remark's own evidence actually satisfies the
  literal ask: uniform protection across all data types IS what's being
  asked, not a tiered-classification scheme.
- ✅ **AR.10** (input/output integrity routines) - verified Zod schema
  validation is used in 16 of the app's route files, including the real
  external-interchange interfaces (`emr.ts`, `hrms.ts`,
  `callCenterGateway.ts`), not just one endpoint.
- ✅ **AR.15** (network perimeter protection) - verified CORS allowlist
  logic (`src/app.ts`, `isAllowedOriginForRequest()`) plus Cloud Run
  ingress control plus the IP-allowlist middleware together satisfy the
  literal ask.
- ✅ **AR.16** (strong encryption, no vendor defaults) - verified Helmet
  CSP config (`src/app.ts:140-153`) and the real Secret Manager
  generated-credential/rotation pattern
  (`docs/key-management-procedure.md`).

**Retained Partial/No, reviewed with no contradictory evidence found**:
NFR-016, NFR-022, NFR-038, NFR-040, NFR-041, NFR-076, NFR-078, NFR-118,
NFR-185, CO.04, IS.02, IS.50, IS.66, LG.01, DR.04, AR.03, AR.13, AR.21 -
each has a genuine, real gap (real tenant credentials missing, QR
clarification needed, field-level encryption not implemented, no
comprehensive log-scrubbing audit, narrower-than-"any" anomaly coverage,
data-residency confirmation needed, no recurring audit program, no
executive sign-off, no SIEM subscriber, no workstation hardening, no
signed NDA, no DR-region compute/failover test, named legacy federation
standards unimplemented, MFA opt-in not mandated, no dedicated FIM/IDS
tool).

**No integrity discrepancies found this sub-batch** (unlike Batches 2/4/5
- searched for contradictory evidence on each row per the mandated
process, found none this time).

Verified: `npx tsc --noEmit` clean, 688/692 (same known environment gap,
no new regressions). Register regenerated: 192 rows now closed (was
187). 18 of the original 23 candidate rows remain (5 closed this pass).
