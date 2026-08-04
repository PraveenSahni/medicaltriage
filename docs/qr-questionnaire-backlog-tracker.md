# QR Questionnaire Backlog Tracker

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
| UX tab | ~15 | Personalization, ~~feedback collection~~ (done), ~~global search~~ (done, backend-only), onboarding/tooltips |
| Performance | ~10 | ~~Response compression~~ (done), formal perf-test-in-pipeline (done). NFR-145 (async transactions) corrected 2026-08-04 to Partial - a real fire-and-forget pattern already existed uncredited (MFA-credential persistence in securityAdmin.ts), just not narrow/system-wide. NFR-140 (caching layer) intentionally left as-is: protocols/roles data is already fully memory-resident with no per-request DB read, so a separate cache layer would be redundant there - the real remaining gap is a formal cache-invalidation/TTL infrastructure layer, not something worth faking for its own sake. |
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
