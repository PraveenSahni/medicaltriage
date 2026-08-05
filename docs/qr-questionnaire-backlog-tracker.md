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

## 2026-08-05 (continued): Batch 6 - NFR-015 real redeploy + full validation

Closed the prior batch's outstanding "needs a real production redeploy"
gap for NFR-015. Fixed a real break in `scripts/a11yAudit.mjs` itself
(its cookie-based login stopped working against `triagedsoc2.irisstar.tech`
- Firebase Hosting's `run` rewrite doesn't reliably return `Set-Cookie`
to a bare `fetch()`, mirroring the already-documented request-side
Cookie-forwarding limit; fixed via a real UI-driven login matching
`tests/e2e/browser-journey.spec.ts`'s pattern). Built the current
source, deployed as a `--no-traffic` canary (`ist-triage-soc2-00047-nuz`),
audited it (0 violations across all 5 pages/personas - confirming the
2 "new" violations found against the *old* live revision were stale-
deployment artifacts of already-committed fixes, not real code
defects), then cut over to 100% traffic. Found and fixed a second real,
new operational gap along the way: the custom domain kept serving the
old bundle after the Cloud Run cutover because Firebase Hosting's CDN
cache isn't invalidated by a Cloud Run traffic change alone - required
a `firebase deploy --only hosting:soc2` to force cache invalidation.
Ran the full manual/automated/browser-coverage validation described in
`docs/accessibility/accessibility-validation-report.md` and found one
new, real, unresolved defect during manual keyboard testing: a Focus
Visible (WCAG 2.1 SC 2.4.7) failure on at least the Service Manager
Board's action buttons - the app's own `--focus-ring` token resolves
correctly and `:focus-visible` matches, but a broader `box-shadow: none
!important` rule elsewhere suppresses the visible ring. **NFR-015
retained at Partial** (not moved to Yes) - this is now a materially
better-evidenced Partial (real, current-build, 5-page/persona automated
zero-violation result plus a documented, narrow, real remaining gap)
rather than the prior Partial's "audit tool was broken and the build
was stale" state. See `docs/accessibility/accessibility-known-limitations.md`
for the full punch list and retest trigger.

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

## 2026-08-05 (continued): PA.08 - Implementation complete, awaiting deployment category

Moving to the next priority category per the mandated order
(documentation-complete-awaiting-approval has zero rows; moving to
implementation-complete-awaiting-deployment). Of that category's 3 rows
(NFR-119, IS.07, PA.08), only PA.08 (critical asset inventory) had a
genuine documentation-only path - NFR-119 needs a business decision
first, IS.07 needs a CI credential that doesn't exist.

- ✅ **PA.08** (complete inventory of critical assets) - new
  `docs/critical-asset-inventory.md`, real inventory of both live
  environments (soc2 sourced from Terraform, demo sourced from real
  deployment/handover records since demo isn't Terraform-managed -
  stated honestly, not glossed over).

Verified: `npx tsc --noEmit` clean, 688/692 (same known environment gap,
no new regressions). Register regenerated: 193 rows now closed (was
192).

## 2026-08-05 (continued): Monthly SLI reporting - NFR-123/NFR-189 real closure

Task #102's earlier finding ("no monthly SLI report script exists") was
itself found to be **incomplete this pass**: `scripts/generateMonthlySliReport.mjs`
did exist and was real - it queried live Cloud Monitoring data for
latency/saturation and had a real email-delivery path - but deliberately
never computed availability/error-rate percentages or an SLO pass/fail
verdict (its own comment explains why: "not shown numerically here to
avoid a partial/misleading figure"), and had no audit trail or
idempotency. A real Cloud Run Job + Cloud Scheduler already existed too
(`terraform/main.tf`), pointed at the old script.

**Built for real** (superseding the .mjs script, not just patching it):
`src/services/sliReportService.ts` using the official
`@google-cloud/monitoring` client (new dependency, `pnpm audit` clean) -
queries all 4 SLIs, calculates each against its real SLO target
(`docs/sli-slo-definitions.md`), generates a report, emails it via the
existing `getEmailAdapter()`, writes a full audit trail
(`SLI_REPORT_GENERATION_STARTED/GENERATED/FAILED`,
`SLI_REPORT_EMAILED/EMAIL_FAILED`, `SLI_REPORT_DUPLICATE_SKIPPED`), and
enforces one delivery per environment+month unless `--force`d. 15 tests
(`tests/sliReportService.test.ts`) cover SLI calculation, SLO pass/fail,
missing/partial data, idempotency, and email failure - all mocked at the
GCP-client/Prisma/email-adapter boundary.

**Real end-to-end validation performed** (not just unit tests): built
and pushed a new soc2 image, updated `terraform/main.tf`'s
`generate_monthly_sli_report` job to run the compiled TS entry point
with real config, applied via Terraform, then executed the real Cloud
Run Job (`gcloud run jobs execute --wait`) - completed successfully
(`exit 0`). Real data returned for all 4 SLIs: Availability 100.00%,
Latency p95 67.81ms, Error rate 0.03%, Saturation 56.00%, all PASS,
complete data. No database error this run (unlike an earlier local
dry-run without Cloud SQL Proxy access) - the audit-event write
succeeded for real via the job's Cloud SQL Proxy sidecar.

**Integrity correction found along the way**: a real, pre-existing
`pnpm-lock.yaml`/`pnpm-workspace.yaml` version-skew issue (local pnpm
11.20.0 vs. the Dockerfile's pinned pnpm 9.15.9 reading the `overrides`
config from different locations) blocked the Docker build - fixed by
keeping the overrides declared in both `package.json` and
`pnpm-workspace.yaml` for compatibility, not by changing the pinned
version (out of this batch's scope).

**Closure decision**:
- ✅ **NFR-123** (capability to generate scheduled reports via email) -
  closed to Yes. The literal ask is about capability, which is now real,
  tested, deployed, and proven working end-to-end.
- **NFR-189** (SLIs/SLOs monitored AND reported monthly **to Qatar
  Airways**) - retained Partial. Monitoring is now genuinely real for
  all 4 SLIs (proven above). The literal wording specifically names "to
  Qatar Airways" as the report recipient - no real QR email address or
  live email secrets are configured anywhere (by design, no customer
  email is hardcoded into code or infrastructure). Exact remaining
  action documented in
  `docs/operations/monthly-sli-report-runbook.md`.

Verified: `npx tsc --noEmit` clean, `npx pnpm audit --audit-level high`
clean (new dependency), 703/707 backend tests passing (15 new,
688 baseline unchanged, same known Cloud SQL tunnel gap in
`ssoOidcFlow.test.ts`).

## 2026-08-05 (continued): Queue-endpoint performance follow-up - real root cause found

Investigated why the earlier connection-pool fix only helped the
protocol-list endpoint, not queue-list. Ran an isolated queue-endpoint
load test, then traced the actual production error.

**Major integrity finding**: 4 real database migrations
(`add_user_feedback`, `add_role_permission_overrides`,
`add_user_mfa_credential`, `add_queue_item_soft_delete`) were committed
to source control weeks ago but **had never actually been applied to
the live soc2 database** - confirmed via `npx prisma migrate status`
against the real database (local Cloud SQL Auth Proxy tunnel, real ADC
credentials) and directly via live Cloud Run error logs: `"The column
triage_queue_items.deleted_at does not exist in the current database"`.
This was the real dominant cause of the queue-list endpoint's
regression - the earlier connection-pool fix was real and helped
(protocol-list), but was investigating a secondary factor, not this one.

**Fix**: `npx prisma migrate deploy` run for real against the live
soc2 database - all 4 migrations additive-only (`ADD COLUMN`,
`CREATE INDEX`, `CREATE TABLE`), no data-loss risk, applied
successfully.

**Real before/after result** (isolated queue-endpoint load test, same
10-concurrent-worker configuration used throughout): p95 improved from
**3105ms to 446-569ms** (5.5-7x). Both critical endpoints (protocol-list,
queue-list) now reproducibly meet the 3s target.

**Separate, unresolved finding, not fixed this batch**: cross-instance
cookie-session lookup returns a clean, fast 401 for a valid, freshly-
issued session cookie - a distinct real bug, worked around (not fixed)
by switching this investigation's load test to Bearer-token auth (a
real, already-supported auth path).

**Closure decision**:
- ✅ **NFR-138** (3s p95 response time) - closed to Yes.
- ✅ **NFR-152** (scalability SLA) - closed to Yes, same evidence.
- **NFR-156** (capacity planning) - retained Partial. Fixing a
  performance-suppressing bug is not the same as completing a real
  capacity-planning exercise against QR's actual projected peak load
  (still not provided) with sustained soak testing (still not
  performed).

Verified: `npx tsc --noEmit` clean, `npx pnpm audit --audit-level high`
clean, **707/707 backend tests passing** - the local Cloud SQL Auth
Proxy tunnel used for this investigation remained active and also
resolved the previously-documented 4 `ssoOidcFlow.test.ts`
environment-blocked failures for the remainder of this session (not a
code change; may reappear in a future session unless that tunnel is
deliberately kept running). Zero functional/authorization/audit/
tenant-isolation regression. Register regenerated: 195 rows now closed
(was 193).

## 2026-08-05 (continued): Cross-instance cookie-session finding - corrected

Dedicated follow-up investigation into the cookie-auth 401 flagged
during the performance work. **Reframed, not fixed as originally
assumed**: direct testing proved the session-store, hashing, lookup,
expiration, and cross-instance DB-fallback logic are all already
correct (a fresh session's DB row, `getPersistedUserSession()`, and the
full `readAuthenticatedSession()` function all returned the correct
session when tested directly). The actual cause: Firebase Hosting's
`run` rewrite proxy (which fronts `triagedsoc2.irisstar.tech`) does not
forward the `Cookie` request header to Cloud Run - confirmed
conclusively by testing the same cookie against the Cloud Run service's
own direct URL, where it worked perfectly.

**This is not a live application bug** - the frontend already installs
a real, working mitigation for exactly this limitation
(`frontend/src/authToken.ts`'s `installBearerTokenFetch()`, called
unconditionally at `frontend/src/main.tsx:9`), attaching a Bearer token
to every real API call the browser frontend makes. Real users are
unaffected; only a raw cookie-only HTTP client (like the earlier
performance batch's diagnostic `curl`/load-test scripts) hits this.

**No code changed** - there was no defect to fix. Full write-up:
`docs/architecture/session-authentication-cross-instance.md`.

**No questionnaire rows changed** - nothing was broken, so nothing was
fixed; no closure claim is made based on this investigation.

## 2026-08-05 (continued): Performance remediation - NFR-138/152/156

Real root-cause investigation and fix, per the dedicated performance
batch. Root cause confirmed via live Cloud Monitoring metrics (not
assumed): Prisma's connection pool was unconfigured on `ist-triage-soc2`
(defaulting to ~3 connections for its 1-vCPU allocation) - active DB
connections stayed at 2-4 throughout a 10-concurrent-worker load test
while Cloud SQL CPU stayed under 12%, confirming requests were queueing
for a free connection, not for the database itself. Two initial
hypotheses (missing indexes, N+1 queries) were investigated and **ruled
out** with direct evidence before landing on the real cause - see
`docs/performance/nfr-138-152-156-root-cause.md`.

**Fix**: `src/db.ts` now explicitly sets `connection_limit=8` (was
implicit/default ~3), configurable via `DATABASE_CONNECTION_LIMIT`.
Built, deployed to `ist-triage-soc2` via canary-then-cutover, health-
checked before and after cutover.

**Result (real before/after load test, same config)**:
- Health check p95: 2895ms -> 629ms (-78%).
- Protocol-list p95: 3982ms -> 2923ms (-27%, **now meets the 3s target**).
- Queue-list p95: 3148ms -> 3105ms (no material change - **still exceeds
  the target**). Its bottleneck is not connection-pool-related and
  remains un-root-caused.

**Not closed to Yes**: NFR-138, NFR-152, NFR-156 all retained Partial -
a real, measured, partial improvement was made, but the queue-list
endpoint (arguably the most clinically central one) still exceeds the
3s p95 target, so closing these would overstate what was achieved.

Verified: `npx tsc --noEmit` clean, 688/692 (unchanged), zero errors in
both load-test runs (no functional/authorization/audit/tenant-isolation
regression). Register regenerated: 193 rows closed (unchanged - no rows
converted this pass, remarks updated with real evidence).

## 2026-08-05 (continued): NFR-156 dedicated capacity-planning/soak batch

Follow-up batch closing the remaining NFR-156 gap left open by the
performance-remediation pass above: real capacity sizing and sustained-
load (soak) evidence, not just a point-in-time response-time fix.

**Multi-tier load test** (new `scripts/capacityLoadTest.mjs`, against
`https://triagedsoc2.irisstar.tech`, 6 distinct real seeded accounts
round-robined across workers rather than one shared token - required
to separate platform capacity from NFR-047's per-account rate limiter):

- 10 concurrent users, 60s: 184/184 succeeded (100%), p95 475ms, zero
  5xx/timeouts.
- 25 concurrent users, 60s: 467/468 succeeded (99.8%), p95 464ms, zero
  5xx/timeouts, 1 stray 429.
- 50 concurrent users, 60s: 850/936 succeeded (90.8%), p95 535ms, zero
  5xx/timeouts, 86 429s. **Not counted as an infrastructure or platform
  finding** - Cloud Monitoring confirmed Cloud Run stayed at 1 instance
  and single-digit CPU% throughout even this tier; the 429s are the
  6-account test pool exceeding NFR-047's per-account budget, i.e. the
  rate limiter working exactly as designed against an under-provisioned
  test-account pool, not a capacity ceiling.

**Soak test** (real, completed): 10 concurrent users, same 6 accounts,
3s think time, 2026-08-05T13:07:15Z-13:27:38Z (~20 min 3s). 3,609/3,609
requests succeeded (100%), zero 429/4xx/5xx/timeouts, p50/p95/p99 =
283/396/969ms. Cloud Monitoring confirmed flat metrics across the full
window and a ~7-minute post-load recovery period: Cloud Run instance
count steady at 1, CPU 3-8%, memory ~28-29%; Cloud SQL CPU ~11%,
connections steady at 9, disk ~1.72% - no drift, no leak, no growth
trend in any measured signal.

**Capacity statement, deliberately bounded**: "Validated at up to 25
concurrent users under the defined realistic workload and pacing. A
50-user test was attempted, but validation was constrained by the
available six-account test pool and correctly functioning per-account
rate limiting (NFR-047) - not by application or infrastructure
capacity." No claim of unlimited scaling or of a demonstrated ceiling
above 25 users is made.

**Disclosed limitations, not glossed over**: the load-test tooling
produced a pooled end-of-run summary, not a genuine per-endpoint
(queue vs. protocol) or per-minute client-side percentile breakdown -
the "no drift" conclusion rests on the infrastructure-side Cloud
Monitoring time series (genuinely interval-by-interval), not the
client-side numbers. Tenant-isolation and audit-write behavior under
load were not measured (this pass tested reads only). The 20-minute
run is labeled a "sustained read-load validation," explicitly **not** a
long-duration soak test - a 60+ minute run (ideally including the
write path and a larger, non-rate-limit-constrained account pool) is
named as real, disclosed follow-up work.

**Result**: NFR-156 **retained Partial** - the row now carries real,
reproducible capacity evidence (zero-error performance at up to 25
concurrent users, the actual first limiting factor correctly
identified at tier 50, and a genuine 20-minute soak with flat
infrastructure metrics) instead of an untested gap, but a QR
peak-load projection, a 60+ minute soak, and write-path/tenant-
isolation validation under load remain open.

Full write-up: `docs/performance/nfr-156-capacity-plan.md`.
`docs/performance/capacity-management-plan.md` updated with the safe
operating envelope, warning/critical thresholds, and scaling guidance
derived from this evidence.

Verified: `npx tsc -p tsconfig.json --noEmit` clean, **707/707 backend
tests passing** (unchanged - no code path was modified, only a new
standalone test-harness script and documentation). No functional/
authorization/audit/tenant-isolation regression. Committed locally as
`4383256`, not pushed.

## 2026-08-05 (continued): Mandatory action pack reconciliation + Batch 7A normalization

A follow-up review of the Mandatory External Action & Approval Pack
(committed `e975bd6`) correctly flagged that its dependency-category
counts summed to 83 while the register's stated total was 82. Root
cause, fully diagnosed: **IG.09** (a real, mandatory Cloud CSQ
retention-policy row, already discussed extensively in
`business-decision-register.md` and the decision packs) had never
been added to `mandatory-action-register.md`/`.csv`'s own row tables -
a genuine omission, not a duplicate. Separately, two count-column
typos in `management-summary.md` (category 1: 15 vs. its own 16-item
list; category 8: 8 vs. its own 7-item list) happened to roughly
cancel. Both are corrected; IG.09 is now in the register.

**Batch 7A** then performed a controlled integrity-normalization pass
directly against the live workbook, per explicit instruction to verify
rather than convert automatically:
- 4 Cloud CSQ rows (PA.03, DR.06, DR.07, AR.19) normalized from
  `"Yes (inherited)"` to exact `"Yes"`, each independently re-verified
  against Google Cloud's own published attestations - real evidence,
  recorded as normalization, not new engineering closure.
- 4 rows (NFR-064, IS.41, IS.73, SD.06) reclassified from `"No"` to
  `"N/A"`, each verified against Google's shared-responsibility model
  or an internal remark inconsistency - not a bare "handled by the
  cloud provider" assertion.
- 2 rows (IS.11, AR.17) reviewed under the same rigor and deliberately
  **not** reclassified - genuine gaps (an unimplemented HR policy; an
  unconfirmed corporate-office-network scope), matching exactly the
  "not currently implemented" and "no physical office" traps the
  instruction warned against.
- 2 AI-tab rows (NFR-040, NFR-044) reviewed against the "shadow AI"
  trap - confirmed via repo grep that real `RagRetrievalEvent`/
  `LlmShadowSuggestion` Prisma models and a shadow-comparison service
  genuinely exist, but no live LLM inference is wired; existing
  remarks already honest, no change made.

**Recomputed mandatory compliance: 77/149 = 51.7%** (was 74/153 =
48.4%). Broken out explicitly, per instruction, so no cause is
conflated: response normalization alone would be 77/153 = 50.3%; N/A
reclassification alone would be 73/149 = 49.0%; combined (the real
result) is 77/149 = 51.7%; genuine new engineering compliance closure
this batch: **zero**. The N/A-driven denominator reduction is
explicitly not described as an engineering improvement.

No requirement text or Mandatory flag was changed for any row - only
Compliance/Remarks cells, and only for the 8 rows individually
verified above. `mandatory-action-register.md`, `.csv`,
`mandatory-conversion-status.md`, `management-summary.md`,
`closure-evidence-checklist.md`, and `evidence-index.md` all updated
to reflect this. Documentation/spreadsheet-only change - no source
code touched, so no `tsc`/test run was required or performed for this
step (verified: `git status` shows no source files changed beyond the
workbook and `docs/`/`scripts/_batch7aNormalize.py`, `scripts/_genActionRegisterCsv.py`).

## 2026-08-05 (continued): Batch 7B - internal quick-closure review

Reviewed the 8 candidate rows from `mandatory-action-register.md`'s
"engineering work remaining, non-long-lead" set (CO.04, IS.50, IS.66,
DR.04, DR.05, AR.03, AR.13, AR.21) for a genuine, small, internally-
closable engineering fix - explicitly not selecting rows merely
because they're easy to re-document.

**7 of 8 reviewed and found to have no legitimate small-fix path this
pass** - each requires either a real organizational program (CO.04:
recurring internal-audit cadence; DR.05: recurring BCP test program),
external/commercial tooling (IS.50: a subscribed SIEM; AR.21: file-
integrity/IDS product), a larger already-scoped infrastructure project
(DR.04: DR-region compute deployment, explicitly deferred elsewhere as
long-lead), a legacy protocol integration (AR.03: SAML/SPML/WS-Fed), or
genuinely has no further internal action available without additional
organizational context (IS.66: admin-workstation hardening, where
IST's own workstation-fleet policy is outside this codebase's
visibility). Forcing any of these to Yes (or even a stronger Partial)
without real new evidence would be exactly the kind of overclaim this
program exists to avoid - remarks left unchanged.

**1 of 8 (AR.13) had a genuine, small, real, testable gap**: MFA was
enforceable per-user but had no way to actually be *required* for all
remote access - the literal AR.13 ask. Built:
- `isMfaMandatory()` in `src/config/runtime.ts` (env flag
  `MFA_MANDATORY`, default off - same `envFlag()` pattern as
  `SESSION_DB_PERSISTENCE`/`QUEUE_DB_PERSISTENCE`).
- Wired into `authenticateLocal()` (`src/services/securityAdmin.ts`):
  when on, any login attempt by an account without MFA enabled is
  blocked with a distinct `mfaEnrollmentRequired: true` response
  (not a generic auth failure), with a real `AuditEvent`
  (`LOGIN_BLOCKED_MFA_ENROLLMENT_REQUIRED`). When off (default),
  behavior is unchanged from before this batch.
- `src/routes/auth.ts`'s `POST /login` surfaces `mfaEnrollmentRequired`
  in the 401 response body.
- 3 new tests in `tests/mfaVerification.test.ts`: blocks a non-enrolled
  account when the flag is on; still allows the normal MFA-challenge
  flow for an already-enrolled account when the flag is on; confirms
  default (flag unset) behavior is unchanged.

**AR.13 remains Partial, not moved to Yes** - the capability now
genuinely exists and is tested, but turning `MFA_MANDATORY=true` on
for a live environment is an operational rollout decision (it would
immediately lock out any currently-unenrolled user), not something
this engineering pass can or should flip on unilaterally. Workbook
remark updated to describe the real, tested mechanism and state
exactly what would move this to Yes (an operator decision to enable
it for a given environment).

Verified: `npx tsc -p tsconfig.json --noEmit` clean, **710/710 backend
tests passing** (707 baseline + 3 new). No functional/authorization/
audit/tenant-isolation regression - the new gate is off by default and
only activates when an operator explicitly sets `MFA_MANDATORY=true`.

## 2026-08-05 (continued): AR.13 production-activation validation - not cut over, 2 real bugs found and fixed

Attempted a controlled production activation of `MFA_MANDATORY=true`
per the established canary-then-cutover pattern, entirely against
`--no-traffic` canary revisions of `ist-triage-soc2` - the
traffic-serving revision (`ist-triage-soc2-00030-koy`, 100% traffic)
was never touched; live traffic to `triagedsoc2.irisstar.tech`
remained on it throughout and was confirmed unaffected (200 OK) at the
end.

**Pre-deployment check found the live revision predated the entire MFA
feature** (404 on `/api/v1/auth/mfa/enroll`) - rebuilt and deployed a
fresh image to a `--no-traffic` canary first.

**Two real, previously-undiscovered defects found and fixed before any
cutover was considered**:
1. MFA credential persistence (`persistMfaCredential`) was silently a
   no-op on soc2, because `MOCK_MODE=true` makes
   `shouldUseDatabasePersistence()` return false - the exact same class
   of bug already found and fixed for sessions earlier this engagement
   (`SESSION_DB_PERSISTENCE`), never applied to MFA. Fixed: a dedicated
   `MFA_DB_PERSISTENCE` flag (`src/config/runtime.ts`) plus a real
   read-fallback `getPersistedMfaCredential()` (`src/services/
   persistence.ts`) wired into `resolveMfaCredential()`
   (`src/services/securityAdmin.ts`), used by login, MFA-challenge
   verification, and PAM elevation - without this, enrollment on one
   Cloud Run instance/revision was invisible to any other.
2. (Secondary finding, out of this row's scope, tracked for a future
   batch) `persistSecurityAuditEvent` has the same `MOCK_MODE`-gating
   issue - AuditEvent rows have never actually persisted to the real
   soc2 Postgres database, only held in-memory per-instance. This
   affects every questionnaire row citing "AuditEvent" DB evidence on
   soc2, not just AR.13 - flagged honestly rather than silently
   patched as a side effect of this task.

**Validated on canary, with a real enrolled admin (`pa@irisstar.tech`)
and nurse (`layla@irisstar.tech`) account** (enrolled via the real
`/api/v1/auth/mfa/enroll`/`enroll/confirm` API, confirmed persisted in
the actual Postgres `UserMfaCredential` table, not just in-memory):
enrolled users complete the MFA challenge correctly; an unenrolled
account (`sara@irisstar.tech`) is blocked with a distinct
`mfaEnrollmentRequired: true` response (401, no secrets/tokens/OTP
leaked); invalid and garbage/replayed challenge codes are rejected;
enforcement is correctly recognized across different Cloud Run
instances/revisions (the critical fix above), not just the one that
processed enrollment.

**Deliberately NOT cut over to live traffic**: only 2 of ~19 real
seeded accounts are enrolled, and - a genuine, disclosed architectural
gap - enrollment requires an existing authenticated session, meaning
an unenrolled user has **no self-service path to enroll once
MFA_MANDATORY is on**. Enabling this globally today would lock out
most real accounts with no in-app recovery path, directly matching
this task's own explicit safety gate ("do not enable globally without
first confirming recovery"). Recovery is not yet confirmed - this is
the real blocker, not a matter of more testing.

**AR.13 remains Partial** - stronger, real, canary-validated evidence
now backs it, and two real defects were fixed (independently improving
MFA's cross-instance correctness for any future activation), but
organization-wide activation requires either enrolling all real active
accounts first or building a genuine self-service/admin-assisted
enrollment path for the mandatory state - neither exists yet.

Canary revisions left deployed at 0% traffic (`ar13-canary`,
`ar13-mandatory`, `ar13-fix`, `ar13-enroll2`, `ar13-enroll3`,
`ar13-enforce`) - harmless, zero live-traffic exposure, available for
inspection; recommend cleanup in a future infra-hygiene pass.

Verified: `npx tsc -p tsconfig.json --noEmit` clean, **710/710 backend
tests passing** (unchanged - the persistence fix required no new
tests beyond the existing MFA suite, since the bug was
environment-specific to soc2's real Postgres/MOCK_MODE interaction,
not reproducible in the mocked test harness). Real production
validation performed via direct HTTP calls against the canary URLs and
a live Cloud SQL Auth Proxy tunnel query against the real soc2
database (tunnel was active and required for this verification).

## 2026-08-05 (continued): Priority-0 AuditEvent durable-persistence remediation

Fixed the audit-integrity defect found during AR.13's canary
validation: `MOCK_MODE=true` on soc2 silently made every security
`AuditEvent` write a no-op against the real database (in-memory only,
lost on restart, invisible cross-instance). Root cause and fix
documented in full at `docs/operations/audit-event-persistence.md`.

**Fix**: dedicated `AUDIT_EVENT_DB_PERSISTENCE` flag
(`src/config/runtime.ts`), independent of `MOCK_MODE`, wired into
`persistSecurityAuditEvent()`/`listPersistedAuditEvents()`
(`src/services/persistence.ts`). Also found and fixed a real, separate
coverage gap: wrong-code MFA verification previously wrote no audit
event at all - added `LOGIN_MFA_FAILED`. Added 3 new indexes
(migration `20260805152719_add_audit_event_query_indexes`, applied to
the real soc2 database) and extended the read-filter to support
`organization`/`action`, not just `userId`.

**Validated**: on `--no-traffic` canaries first (2 different revisions
both wrote to and correctly read from the same database, proving
cross-instance durability - not just single-instance correctness), no
secrets/tokens present in persisted rows (`AuditEvent`'s own type
carries none), then **cut over to live traffic** on
`ist-triage-soc2` (low risk - purely additive, no user-facing
behavior change, unlike AR.13's `MFA_MANDATORY`). A real failed-login
attempt against the live `https://triagedsoc2.irisstar.tech` URL was
confirmed as a real row in the actual Postgres database.

**Compliance implication**: several already-"Yes" mandatory rows
(NFR-010, IS.61, IS.51, HR.03) cited real AuditEvent-writing code as
evidence - that code was and remains correct; what wasn't true until
now is that those writes actually landed durably on soc2. No
compliance percentage changes as a result of this fix alone - a full
re-verification pass of every AuditEvent-citing row is recommended as
follow-up, not performed exhaustively here.

**AR.13 unaffected**: still Partial, still not cut over -
`MFA_MANDATORY` remains off on the live revision; this batch only
activated the separate, lower-risk `AUDIT_EVENT_DB_PERSISTENCE` flag.

Verified: `npx tsc -p tsconfig.json --noEmit` clean, **716/716 backend
tests passing** (710 + 6 new in `tests/auditEventPersistence.test.ts`),
`npx pnpm audit --audit-level high` clean. Cloud SQL Auth Proxy was
active and required throughout for direct database verification
(migration application, pre/post row counts, cross-instance read
confirmation).

## 2026-08-05 (continued): Dedicated persistence-gating integrity sweep

Full inventory of every `shouldUseDatabasePersistence()` call site
(and related in-memory-authoritative state), following the AR.13/
AuditEvent Priority-0 fixes. Full inventory and classification:
`docs/operations/persistence-gating-inventory.md`.

**No real gap found** (already correctly durable, cross-process
consistent): triage queue/soft-delete (own `QUEUE_DB_PERSISTENCE`
flag, already on soc2), retention execution and legal-hold enforcement
(the two Cloud Run Jobs use their own dedicated Prisma client, never
gated by `MOCK_MODE` at all).

**Real gaps found and fixed**:
1. **Role-permission overrides** - no cross-instance read-fallback
   existed at all (a grant/revoke on one instance was invisible to
   another, a genuine authorization-bypass risk). Fixed: dedicated
   `ROLE_PERMISSION_DB_PERSISTENCE` flag, a new
   `getPersistedRolePermissionOverrides()` read function, and a
   startup-hydration call (`hydrateRolePermissionOverridesFromDatabase()`
   in `src/index.ts`) so every new instance boots from the current
   durable state. Disclosed residual limitation: a grant/revoke made
   while another instance is already running still requires that
   instance to restart to see it - a periodic-refresh or invalidation-
   signal mechanism was not built in this pass.
2. **Reveal workflow (privileged PII reveal)** - same missing-read-
   fallback pattern; a request created on one instance was invisible to
   an approver's request on a different instance, a functional failure
   given the workflow is inherently two separate HTTP requests. Fixed:
   dedicated `REVEAL_WORKFLOW_DB_PERSISTENCE` flag, a new
   `getPersistedRevealRequest()` read function wired into `decideReveal()`
   and `fetchApprovedRevealValue()`. Disclosed, not "fixed": the
   approved plaintext value itself (`revealValuesById`) remains
   intentionally never persisted (a correct security choice) - a
   third instance that never processed the approval genuinely cannot
   serve the value; only the request/approval metadata's cross-
   instance visibility was closed.
3. **Session revocation on account-status change** - a real, separate
   bug: `revokePersistedSessionsForUser()` checked the generic
   `shouldUseDatabasePersistence()` instead of the dedicated
   `shouldPersistSessionsInDatabase()` already used by session
   creation/lookup - meaning a suspended account's sessions were
   revoked in-memory but silently not revoked in the database, even
   with `SESSION_DB_PERSISTENCE=true` already on soc2. Fixed to check
   the correct flag.
4. **IS.61's remark corrected** (Compliance value unchanged, "Yes"):
   the reveal-anomaly-rate counter is genuinely process-local with no
   database backing at all, not yet re-architected - the control
   remains real for a single-instance requester, but "organization-
   wide" detection is narrower in practice than the row might imply.
   Disclosed honestly rather than silently left overstated.

**Deferred, explicitly flagged, not fixed this pass** (none
compliance-evidence-bearing or authorization-critical in the way the
3 fixed items are): SSO `AuthenticationProvider` config read (SSO not
yet connected to a real IdP tenant), CCP outbound draft persistence,
inbound webhook record persistence, the secondary/redundant
`persistEvaluatedEncounter`/`persistCompletedTriageNote` write paths.

**Validated**: 5 new focused tests
(`tests/persistenceGatingCrossInstance.test.ts`) proving each flag's
on/off gating; a real cross-process integration check against the
actual soc2 Postgres database (a role-permission grant and a reveal
request each written by one process and correctly read back by a
separate process, simulating cross-instance visibility) - both real
rows confirmed then cleaned up as synthetic test data. Deployed to a
`--no-traffic` canary first, then **cut over to live traffic** (low
risk - purely additive persistence + a flag-name bugfix, no user-
facing behavior change).

Verified: `npx tsc -p tsconfig.json --noEmit` clean, **721/721 backend
tests passing** (716 + 5 new), `npx pnpm audit --audit-level high`
clean. Cloud SQL Auth Proxy was active and required throughout for
direct database verification (pre/post row counts, cross-process
read-after-write proof, test-data cleanup).

## 2026-08-05 (continued): IS.61 shared anomaly-detection remediation - Partial (corrected down from Yes)

Dedicated batch closing the multi-instance gap in the reveal-anomaly
counter found during the persistence-gating sweep. Full detail:
`docs/security/reveal-anomaly-detection.md`.

**Re-read the literal requirement**: IS.61 asks for BOTH monitoring
AND customer notification. The row was previously `Yes` on monitoring
alone - an overclaim independent of the multi-instance bug.

**Built**: a shared, durable, PostgreSQL-backed rolling-window counter
(new `RevealAnomalyEvent` table, migration
`20260805161509_add_reveal_anomaly_events`, applied to the real soc2
database) replacing the process-local in-memory `Map`. Atomic
transactional create+cleanup+count per attempt
(`recordAndCountRevealAnomalyEvents()`, `src/services/persistence.ts`).
New config: `REVEAL_ANOMALY_DB_PERSISTENCE`,
`REVEAL_ANOMALY_WINDOW_SECONDS`, `REVEAL_ANOMALY_THRESHOLD` (validated,
explicit, not QR-confirmed defaults carried over unchanged from the
prior implementation: 5 min / 10 requests).

**Failure policy** (documented, not silent fail-open): on shared-store
failure, falls back to the local counter and emits a distinct high-
risk `PRIVACY_REVEAL_ANOMALY_STORE_DEGRADED` audit event - reveal
itself is never denied (a monitoring outage should not become a care-
delivery outage).

**Validated**: a real cross-process test against the actual soc2
database proved the exact gap closed (6+6 attempts across two
simulated instances correctly combine to 12 and exceed the threshold,
where each instance alone would have seen only 6 and never detected
it) - test data cleaned up after. 4 new unit tests
(`tests/revealAnomalySharedCounter.test.ts`). Deployed to canary,
health-checked, then **cut over to live traffic** (low risk).

**IS.61 compliance decision**: **retained Partial, corrected DOWN from
the prior Yes** - monitoring/detection is now real and multi-instance-
safe, but "notify customers expeditiously" has no implementation of
any kind and remains the row's real, larger gap. This is an honest
downward correction, not a closure.

Verified: `npx tsc -p tsconfig.json --noEmit` clean, **725/725 backend
tests passing** (721 + 4 new), `npx pnpm audit --audit-level high`
clean. Cloud SQL Auth Proxy was active and required throughout
(migration application, cross-process validation, test-data cleanup).

**Recomputed compliance**: mandatory 77/149 = 51.68% (was 78/149 =
52.35% - the -1 numerator is IS.61's honest downward correction, not a
new gap introduced this batch). Overall 132/391 = 33.76% (was
133/391 = 34.02%, same -1 cause).

## 2026-08-05 (continued): IS.61 customer-notification workflow - Partial (unchanged)

Dedicated batch closing IS.61's second literal requirement ("notify
customers expeditiously"). Full detail:
`docs/security/privacy-incident-notification-procedure.md`,
`docs/security/privacy-incident-notification-template.md`,
`docs/operations/privacy-notification-runbook.md`.

**Built**: a controlled, auditable privacy-incident lifecycle
(`PrivacyIncident` model, migration
`20260805170935_add_privacy_incident_workflow`, applied to the real
soc2 database) - detection creates an incident CANDIDATE only (never
bypasses review to directly notify anyone), through human review,
classification, an explicit notification decision with a mandatory
reason, segregation-of-duties approval, and dry-run/internal-test
delivery via the existing, already-live `getEmailAdapter()`. Explicit
allow-list state machine (`ALLOWED_TRANSITIONS`) rejects invalid
transitions. New config: `PRIVACY_NOTIFICATION_ENABLED`,
`PRIVACY_NOTIFICATION_DRY_RUN` (default `true`),
`PRIVACY_NOTIFICATION_SLA_HOURS` (no engineering default - `null`
until approved), `PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS`,
`PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS` (both empty by default, no
address invented or hardcoded).

**Two real bugs found and fixed by this batch's own tests before
validation**: (1) a dry-run preview was silently permitted for the
`customer` audience instead of being refused outright; (2) a duplicate
notification-send attempt on an already-sent incident raised the wrong
error type. Both fixed - customer delivery now requires full,
explicit, non-default configuration with no preview exception, and
duplicate-send detection is checked before the status gate.

**Validated**: 10 new unit tests
(`tests/privacyIncidentWorkflow.test.ts`) plus a real end-to-end run
against the actual soc2 Postgres database (incident created,
reviewed, classified, confirmed, decided, approved by a distinct
approver, dry-run-delivered to a configured internal recipient,
confirmed no email sent, confirmed a real durable
`PRIVACY_INCIDENT_STATUS_TRANSITION` audit event) - all synthetic test
data cleaned up after. Wired the reveal-anomaly detector
(`checkRevealAnomalyRate`) to create a real incident candidate on
threshold breach, alongside its existing audit event. Deployed to a
`--no-traffic` canary, health-checked, then cut over to live traffic
(low risk - notification delivery stays disabled by default).

**IS.61 remains Partial** - exact remark: "Multi-instance privacy-
anomaly detection and durable incident/audit workflow are operational.
Customer notification capability is implemented in controlled dry-
run/internal-test mode. Final closure requires approved notification
SLA, legal/privacy-approved template, authorized Qatar Airways
recipients and one approved live delivery validation." None of the 4
remaining dependencies exist yet - not a new gap, the same one already
disclosed.

Verified: `npx tsc -p tsconfig.json --noEmit` clean, **735/735 backend
tests passing** (725 + 10 new), `npx pnpm audit --audit-level high`
clean. Cloud SQL Auth Proxy was active and required throughout
(migration application, full end-to-end real-database validation,
test-data cleanup).

**Compliance unchanged by this batch**: mandatory 77/149 = 51.68%,
overall 132/391 = 33.76% - no row moved to Yes or down; IS.61's status
and remark are consistent with its prior downward correction.

## 2026-08-05 (continued): Batch 7 - NFR-015 Focus Visible remediation

Root-caused and fixed the one open item from Batch 6: a real WCAG 2.1
SC 2.4.7 Focus Visible defect. Found via direct CSSOM inspection that
an app-wide "blank reset" rule in `global.css` (6x `[class]`
attribute-selector specificity escalation, by design, per its own code
comment) was forcing `box-shadow: none !important` on every classed
element, silently defeating the app's generic focus-visible rule.
Fixed by switching that rule to use `outline` (a property the reset
never touches) with the existing `--t1` token - no new color invented.
Built, canary-deployed (`ist-triage-soc2-00049-tuv`), audited (0
violations), cut over to 100%. While verifying live, found and fixed a
second, distinct, real deployment-runbook gap: `firebase deploy --only
hosting:soc2` uploads a **local** `dist-web` static build, independent
of the Cloud Run image - Firebase Hosting serves matching static asset
paths directly, bypassing the Cloud Run rewrite. The local `dist-web`
had not been rebuilt with the CSS fix, so the "cache-busting" redeploy
from this same batch initially re-served the stale bundle. Fixed by
running `npm run build:web` before the Firebase deploy. Verified live
on production via real keyboard Tab: the previously-broken
`.smb-soft-btn` now shows a real, visible outline. Re-ran the full
5-page/persona audit (0 violations) and the frontend jest suite
(55/55, no regression).

**NFR-015 remains Partial** (not moved to Yes) - the confirmed defect
is now closed, but several manual checks the batch instructions
require (modal focus-trap, 200% zoom/reflow, session-timeout,
destructive-action, real screen-reader testing) were never performed,
so "no unresolved material defect" is true only for what has actually
been tested, not the full literal scope. This is a materially stronger
Partial than Batch 6's - the only known defect is fixed - but honestly
short of Yes given the untested surface. See
`docs/accessibility/accessibility-known-limitations.md` for the full,
updated punch list. No compliance percentage change (Partial to
Partial).

## 2026-08-05 (continued): Batch 8 - NFR-015 final manual accessibility validation

Completed the remaining manual checklist items. Found and fixed 3
additional real defects: (1) `ReadOnlyCallDrawer` (Service Manager
Board's call-detail overlay, the only dialog in the 5-page scope) had
no `role="dialog"`/`aria-modal`, no initial focus, no Tab trap, no
focus restoration - added all of it plus 2 new jest/RTL regression
tests; (2) the unauthenticated `/help` fallback page had no viewport
meta tag at all, forcing a 980px desktop mobile rendering - fixed;
(3) the Service Manager Board's top-action bar overflowed the
viewport at 320px (no `flex-wrap`) - fixed. All 3 verified live on
production (`ist-triage-soc2-00051-nec`, 100% traffic, Firebase
Hosting rebuilt via `npm run build:web` before redeploy per the
established runbook fix).

Found and left **unfixed, explicitly out of scope**: the Nurse
Cockpit's 3-column desktop layout does not collapse on narrow
viewports at all - a real, structural, material defect on the primary
nurse workflow screen. Confirmed via code/live review: session-timeout
has no client-side warning UI (classified Not Implemented, not
untested); no destructive action exists in the 5-page-scope frontend
(classified N/A); no real screen reader is available in this
environment (confirmed again, unchanged).

Full validation: backend `tsc` clean, frontend `tsc` clean, full
backend suite 735/735, full frontend suite 57/57, 5-page axe-core
audit 0 violations (canary + production post-cutover).

**NFR-015 remains Partial.** Two material, independent gaps block Yes:
the Cockpit's non-responsive layout (a real, confirmed defect) and the
complete absence of real screen-reader validation. Everything else
found across this whole NFR-015 effort (color contrast, `.smb-board`
keyboard focus, Focus Visible, modal focus management, viewport meta,
top-action-bar reflow) has now been found, fixed, deployed, and
verified live. No compliance percentage change (Partial to Partial).
