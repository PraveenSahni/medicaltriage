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
| **SSO/MFA** (enterprise IdP: AD/OIDC/SAML + MFA) | ~9 rows (NFR-016/018/020/022/025/028, AI/CSQ auth rows) | Large - real IdP integration, session model changes | Not started (R-02) |
| **SAST tooling** (static code security scanning) | ~9 rows | Medium - add a SAST tool (e.g. Semgrep/CodeQL) to CI | Not started |
| **Formal certification** (SOC 2 Type II / ISO 27001) | ~8 rows | Large, external - requires an accredited auditor | Readiness work done (this engagement); certification itself not started (R-05) |
| **Masking/Reveal/DLP** (field-level PII masking, approval-gated reveal) | ~4 rows | Large - UI + MFA + approval workflow (deliberately deferred, R-04) | Not started |
| **Independent penetration test** | ~4 rows | External - needs a commissioned third-party pentest | Not started |
| **SIEM integration** | ~3 rows | Medium - log-streaming connector to an external SIEM | Not started |
| **CMEK/BYOK** (customer-managed encryption keys) | ~3 rows | Blocked - Cloud SQL/Secret Manager only support CMEK at instance creation; would require a disruptive migration | Investigated, deliberately deferred (accepted risk) |
| **WAF** (Cloud Armor or equivalent) | ~2 rows | Small-medium - a real, addable GCP feature | Not started |
| **PAM** (Privileged Access Management with JIT) | ~1 row | Large - a dedicated PAM tool | Not started |
| **Arabic/RTL i18n** | ~1 row | Large - full i18n framework + translated content | Not started |

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

## 5. Engineering backlog (long tail, ~240 rows, needs individual triage)

This is intentionally not exhaustively listed row-by-row here (see the
workbook itself for each one's real remark) - it's a large, fragmented set
of small items, mostly single-row asks within a section. Grouped by where
they cluster, largest first:

| Area | Approx. rows | Flavor |
|---|---|---|
| Cloud CSQ (various domains, mostly single-row) | ~45 | Documentation/process gaps (asset inventory, third-party agreements, audit-tool access controls) - many are one-line policy statements away from Partial->Yes |
| Observability, Monitoring & Alerts (NFR + AI) | ~18 | Distributed tracing/APM, QR-facing dashboards, business-KPI alerting, log-search/deep-dive tooling |
| UX tab | ~15 | Personalization, feedback collection, global search, onboarding/tooltips |
| Performance | ~10 | Caching layer, response compression, async transactions, formal perf-test-in-pipeline |
| Integration | ~9 | Event-driven/async integration, admin-configurable integration events, retry/backoff, common gateway |
| Security Controls | ~8 | Login URL randomization, per-request context validation, CORS verb/header hardening |
| Authentication / API Management / Auditing / Authorization / Availability / Extensibility | ~6 each | Mostly sub-items of the "major initiatives" above (SSO, certification) plus smaller standalone asks |

### Concrete quick-win candidates already identified

These look like small, genuinely closeable engineering tasks (a
config flip or small addition), not part of a large initiative:

1. **Enable GCP Security Command Center** for the project (NFR-010,
   IS.45) - a GCP console/API setting, not a code change.
2. **Add a response-compression middleware** (e.g. `compression` npm
   package) to `src/app.ts` (NFR-140/143) - small, low-risk addition.
3. **Add a caching layer** for master/seed/configuration data
   (NFR-140) - scope depends on what's worth caching; smallest version
   could be an in-memory TTL cache for protocol/role data.
4. **Add a license-compliance check** to CI (NFR-056/163) - e.g.
   `license-checker` npm package, alongside the existing `pnpm audit` step.
5. **Enable Cloud Armor (WAF)** in front of the Cloud Run services -
   a real GCP feature, moderate setup effort, closes ~2 rows directly and
   strengthens several "no WAF" mentions elsewhere.

## Recommended order of attack

1. Knock out the 5 quick wins above first (cheap, real, no dependencies).
2. Pick one major initiative to actually start - **SAST tooling** is the
   best next candidate: medium effort, no external dependency, closes ~9
   rows, and directly strengthens the "no SAST" gap repeated across NFR/
   CSQ/AI tabs.
3. Route the "Blocked" and "Organizational/process" items to their real
   owners (you, IST HR/legal, whoever holds Billing Admin) rather than
   letting them sit unassigned.
4. Treat SSO/MFA, masking/reveal, and formal certification as separate,
   explicitly-scoped future engagements - each is too large to fold into
   an incremental "next batch" pass.
