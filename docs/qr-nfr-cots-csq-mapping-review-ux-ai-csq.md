# QR NFR/COTS/CSQ Questionnaire — UX, AI, and Cloud CSQ Tabs Mapping Review

_Companion to `docs/qr-nfr-cots-csq-mapping-review.md` (which covered the "Non
Functional Req" tab). This pass covers the remaining three tabs: **UX** (17 rows),
**AI** (63 rows), **Cloud CSQ** (184 rows, a CSA CAIQ-derived cloud security
questionnaire). Review only — nothing has been written into the workbook._

---

## UX tab (17 rows, all under one section "User Experience")

### The one framing point that matters for this whole tab
This tab asks about a **generic enterprise web-app UX** and is largely answerable
honestly, unlike the AI tab below. Two Mandatory=Yes items need real attention:
**Cross-Browser Compatibility (NFR-004)** and **Accessibility Compliance /
WCAG 2.1 (NFR-015)** — no formal cross-browser test matrix or WCAG audit has been
run against this codebase. **Branding & Custom Theme (NFR-016, also Mandatory=Yes)**
has real support in principle (React/CSS is fully themeable) but no QR-specific
brand theme has actually been built.

| ID | Requirement (short) | Honest status | Evidence / gap |
|---|---|---|---|
| NFR-001 | Mobile responsiveness | **Partial** | Cockpit UI (`frontend/src/cockpit/`) uses standard responsive CSS, but no dedicated mobile-viewport testing has been done; the app targets desktop nurse workstations primarily. |
| NFR-002 | UI consistency across modules | **Yes** | Two parallel UIs exist though (`#/cockpit` and the older `#/cockpit-v2`/`NurseWorkspaceRedesign`) — consistency is real *within* each, not fully unified *across* both (a known, documented architectural question from earlier this session, not yet resolved). |
| NFR-003 | User-personalizable UI preferences | **No** | No user-level UI preference/settings storage exists. |
| NFR-004 | Cross-browser compatibility (**Mandatory**) | **Not formally verified** | Built with standard React/Vite output (broadly compatible), but no test matrix across enterprise-standard browsers has been run. |
| NFR-005 | Effective error messaging | **Partial** | Form validation errors exist (Zod-driven `400` responses with field errors), but no systematic UX review of error-message clarity has been done. |
| NFR-006 | Multi-level (L1/L2/L3) navigation | **Partial** | The Cockpit has a stage-based flow (Intake → Questions → Disposition → Completion) plus a sidebar, not a deep multi-level menu hierarchy — appropriate for this app's linear clinical workflow, but doesn't map cleanly onto a generic L1/L2/L3 answer. |
| NFR-007 | Usability (action buttons, global search) | **Partial** | Protocol search/match panel exists (`ProtocolMatchPanel.tsx`); no cross-application global search. |
| NFR-008 | Learnability / low cognitive load | **Subjective — no formal usability testing performed** | Can't honestly claim compliance without a usability study; the guided Yes/No question flow was designed with this in mind but hasn't been measured. |
| NFR-009 | Accessibility basics (tab nav, contrast) | **Partial/Unverified** | No accessibility audit has been run; standard HTML form elements are used (which carry some baseline keyboard-navigability), but color contrast has not been formally checked against WCAG thresholds. |
| NFR-010 | Training & support resources | **No** | No in-app help/training content exists beyond the standalone Help page (`helpRouter.ts`), which serves a different purpose (restricted-content lookup, not general training). |
| NFR-011 | User feedback gathering | **No** | No feedback-collection mechanism exists in the app. |
| NFR-012 | Arabic/RTL support | **No** | No i18n/RTL support exists; all UI text is English-only. This is a real, notable gap for a Qatar-based deployment. |
| NFR-013 | Intuitive role-based navigation | **Yes** | Real: 19-role RBAC (`roles-and-permissions.md`) drives which routes/UI a user can reach; sidebar/menu items are gated by permission. |
| NFR-014 | Efficient data entry (autocomplete, inline validation) | **Partial** | Some inline validation exists (Zod-backed forms); no autocomplete/smart-defaults layer beyond what native HTML provides. |
| NFR-015 | Responsive + WCAG 2.1 (**Mandatory**) | **Partial/Not formally verified** | Same as NFR-001/009 — responsive CSS exists, no formal WCAG audit. |
| NFR-016 | QR branding/theme (**Mandatory**) | **No, but feasible** | The app has its own branding (IST Health) today; no QR-specific theme has been built. Technically straightforward (CSS custom properties already used throughout, e.g. `cockpit.css`'s `:root` tokens), just not done. |
| NFR-017 | Contextual help/tooltips/onboarding | **Partial** | Some inline rationale/guidance text exists on clinical question cards (`step-rationale` styling); no general onboarding flow for new users. |

**UX summary: 2 Yes, 8 Partial, 6 No, 1 not formally verifiable without dedicated
testing.** Both Mandatory items (NFR-004, NFR-015) are currently unverified rather
than confirmed — worth closing with actual testing before answering Yes.

---

## AI tab (63 rows, 17 sections)

### The framing point that matters most for this entire tab
**This system has no generative AI / LLM integration at all.** Confirmed by code
review: there is no OpenAI/Anthropic/Gemini/any third-party model API call anywhere
in the codebase. The one AI-adjacent feature — "RAG shadow" (`src/services/ragShadow.ts`,
`buildRagShadowSuggestion`) — is a **local, deterministic keyword/similarity scorer**
run purely as a **shadow comparison signal** against the real clinical decision engine
(the rules-based STCC protocol matcher). It never generates free text, never calls an
external model, and **never drives an actual clinical decision** — it's an internal
QA/validation signal only, not user-facing AI output.

This means the large majority of this tab's 63 requirements — which assume a
production LLM/GenAI system (hallucination monitoring, jailbreak resistance, prompt
injection defense, bias assessment reports, model cards, third-party sub-processor
disclosure, retraining cadence, kill switches for autonomous agents) — are **Not
Applicable** to this system as built today, not because of a compliance gap but
because **the product doesn't contain the thing being asked about.** Answering these
as "No" (implying a GenAI system that fails these controls) would be actively
misleading; the honest answer is "N/A — no GenAI/LLM component exists in this
product."

The exception is the **clinical-approval/human-in-the-loop workflow**, which is real
and relevant even without an LLM: `src/routes/approvalRouter.ts`'s
`recordApprovalReview`/`liveApprovalQueue` implements exactly the kind of mandatory
human-review-before-action gate this tab asks about (NFR-034, NFR-058, NFR-060) — it
gates on nurse review of AI/rules-engine-flagged encounters before disposition is
finalized. This is worth citing explicitly since it's a genuine strength, just not
framed around an LLM.

| ID | Section | Requirement (short) | Honest status | Evidence / gap |
|---|---|---|---|
| NFR-001 | API Security | OAuth2/RBAC/IP-restricted AI API access | **N/A** | No dedicated "AI API" exists to secure — the ragShadow function is an internal library call, not an exposed endpoint. |
| NFR-002 | API Security | DAST on all APIs | **No** | No dynamic security testing pipeline exists for any API, AI or otherwise. |
| NFR-003 | API Security | MCP / A2A protocol compliance | **N/A** | No agent-to-agent or MCP-based architecture exists. |
| NFR-004 | Data Privacy & Logging | PII masked in logs (**Mandatory**) | **Partial/Unverified** | No systematic log-scrubbing audit has been performed (same gap noted in the NFR tab's Data Protection section); no AI-specific logging exists since there's no AI output to log. |
| NFR-005 | Data Privacy & Logging | Prompts/completions comply with GDPR/HIPAA (**Mandatory**) | **N/A** | No prompts/completions exist — nothing generates free-text AI output. |
| NFR-006 | Data Privacy & Logging | QR data never used for model training (**Mandatory**) | **Yes, trivially** | True by construction — there is no model being trained on any data, QR's or otherwise. |
| NFR-007 | Data Privacy & Logging | Prompt/completion retention limits | **N/A** | Nothing is generated to retain. |
| NFR-008 | Data Privacy & Logging | Third-party AI sub-processors disclosed (**Mandatory**) | **Yes, trivially** | None exist — no third-party AI provider (OpenAI, Azure OpenAI, Gemini, etc.) is used anywhere. |
| NFR-009 | Data Privacy & Logging | Zero-retention agreements with model providers (**Mandatory**) | **N/A** | No model providers are used. |
| NFR-010 | Infra Security | Cloud-native threat detection (Defender/SCC) (**Mandatory**) | **No** | GCP Security Command Center is not currently enabled/configured for this project (not verified as active). |
| NFR-011 | Infra Security | Cloud vendor policy framework compliance | **Partial** | Runs on GCP; no formal policy-framework audit performed. |
| NFR-012 | Network Security | Private Link / no public exposure | **No** | Cloud Run services are deployed with public HTTPS ingress (`--allow-unauthenticated` on the app layer, with the app's own session auth as the access control) — not privately-networked infrastructure. |
| NFR-013 | Network Security | Public access disabled for critical workloads | **No** | Same as above — the app is intentionally public-facing (with app-level auth), not network-isolated. |
| NFR-014 | Network Security | Firewalls, IP allowlisting, DDoS protection (**Mandatory**) | **Partial** | Cloud Run/GCP provides baseline DDoS protection at the platform layer; no application-level IP allowlisting exists (same gap as NFR tab's NFR-027). |
| NFR-015 | Network Security | WAF at Layer 7 | **No** | No WAF (e.g. Cloud Armor) is confirmed configured in front of these services. |
| NFR-016 | Secrets & Key Mgmt | Centralized vault for secrets (**Mandatory**) | **Partial** | GCP Secret Manager is used for some secrets (`AUTH_JWT_SECRET`, `AUDIT_HMAC_SECRET`, and — as of this session — `ist-triage-soc2`'s `DATABASE_URL`); `ist-triage-demo`'s `DATABASE_URL` remains a plain env var (documented gap). |
| NFR-017 | Secrets & Key Mgmt | Soft-delete/purge protection on vault | **Unverified** | Not explicitly configured; GCP Secret Manager's default behavior would need to be checked. |
| NFR-018 | Secrets & Key Mgmt | Vault firewall restricting access | **No** | Secret Manager access is governed by IAM (service-account scoping), not network firewall rules — a different but related control; worth clarifying which QR actually means. |
| NFR-019 | Storage/DB Security | Defender for Storage/DB | **No** | Not configured. |
| NFR-020 | Storage/DB Security | Customer-managed keys at rest | **No** | Cloud SQL uses Google-managed encryption keys by default, not customer-managed keys (CMEK). |
| NFR-021 | Storage/DB Security | Strict firewall policies for storage/DB | **Partial** | Cloud SQL access is via Cloud SQL Auth Proxy/private IP patterns for the app; no formally documented firewall policy review has been done. |
| NFR-022 | Storage/DB Security | AD auth for storage, shared-key auth disabled | **No** | Uses Postgres username/password auth (via Secret Manager), not Azure AD — this control is written in Azure-specific language and doesn't map directly onto the GCP stack. |
| NFR-023 | Observability | Continuous security monitoring with SLA remediation (**Mandatory**) | **No** | Only basic uptime monitoring exists (this session's addition); no security-finding monitoring/remediation SLA process exists. |
| NFR-024 | Observability | Centralized SIEM (Sentinel or equivalent) | **No** | No SIEM integration exists; explicitly flagged as a gap in the independent SOC 2 review this session. |
| NFR-025 | Observability | Data governance platform (Purview or equivalent) | **No** | No data classification/governance platform is in use. |
| NFR-026 | Cost Governance | Transparent AI cost model | **N/A** | No AI service consumption exists to have a cost model for. |
| NFR-027 | Cost Governance | FinOps dashboard | **No** | No cost dashboard exists (flagged as a gap in the NFR tab's Observability section too). |
| NFR-028 | Cost Governance | Rate limiting / usage caps for AI (**Mandatory**) | **N/A** | No AI service usage exists to cap; general API rate limiting does exist for login/staff-validate/help-verify endpoints (`src/middleware/rateLimit.ts`), just not AI-specific. |
| NFR-029 | Performance & Latency | AI response latency SLA | **N/A** | No AI response path exists to have a latency SLA. |
| NFR-030 | Archival & Purging | Archive/purge AI prompts per retention policy | **N/A** | No prompts/completions are generated or stored. |
| NFR-031 | Backup & Recovery | Tested backup/recovery for critical services | **Partial** | Cloud SQL automated backups + PITR are enabled (this session's Wave A work); no restore drill has ever actually been performed (explicitly flagged as a gap in `docs/backup-disaster-recovery-plan.md`). |
| NFR-032 | GenAI Ops | Bias assessment report for the model | **N/A** | No model exists to assess for bias. |
| NFR-033 | GenAI Ops | Reject toxic/hateful prompts (**Mandatory**) | **N/A** | No generative model accepts free-text prompts from users. |
| NFR-034 | GenAI Ops | Explainable decisions + human override | **Yes (real, not LLM-based)** | The clinical decision engine is rules-based (deterministic STCC protocol matching), which is inherently more explainable than an LLM; `approvalRouter.ts`'s HITL approval workflow lets a clinician review, override, and document rationale for any AI/rules-flagged disposition before it's finalized — this is a genuine strength worth highlighting, reframed away from "AI explainability" toward "deterministic rules + mandatory clinician review." |
| NFR-035 | GenAI Ops | ≤2s latency for AI responses | **N/A** | No generative AI response path exists. |
| NFR-036 | GenAI Ops | Alert on hallucination/toxicity spikes | **N/A** | Nothing generates content that could hallucinate. |
| NFR-037 | GenAI Ops | Model versioning & rollback | **N/A** | No production model exists to version. |
| NFR-038 | GenAI Ops | Scale to peak concurrent users, load-tested | **Not measured** | No formal load testing has been performed against any part of the app. |
| NFR-039 | GenAI Ops | Real-time dashboards (latency/error/hallucination/bias) | **N/A / Partial** | No hallucination/bias metrics exist (nothing generates content); basic uptime dashboards exist via Cloud Monitoring (this session). |
| NFR-040 | GenAI Ops | Incident response plan incl. hallucination incidents (**Mandatory**) | **Partial** | A real incident-response plan exists (`docs/incident-response-plan.md`, this session's work) covering general security/availability incidents; it does not and cannot cover "hallucination" incidents since there's no generative model to hallucinate. |
| NFR-041 | GenAI Ops | Regulatory compliance + SOC2/ISO27001 questionnaire (**Mandatory**) | **In progress / Partial** | This engagement's entire remediation pass (SOC 2 control matrix, tenant isolation, audit logging, etc.) is the relevant evidence; **no formal SOC 2 Type II or ISO 27001 certification exists** — that requires an external accredited auditor, a distinct future step from this codebase work. |
| NFR-042 | GenAI Ops | Periodic retraining with bias re-assessment | **N/A** | No model exists to retrain. |
| NFR-043 | GenAI Ops | Data stays in agreed environment; no training without consent (**Mandatory**) | **Yes, trivially** | True by construction — data is not sent to any external AI provider at all. |
| NFR-044 | GenAI Ops | Log every AI request/response with actor + model version (**Mandatory**) | **N/A for AI specifically; Partial for the app generally** | No AI requests exist to log this way; the app does have `AuditEvent` logging for clinical actions (claim/move/complete/delete, this session's work) with actor attribution, which is the closest real analog. |
| NFR-045 | Prompt & Content Safety | Prompt-injection defenses (**Mandatory**) | **N/A** | No prompt-accepting interface exists to inject into. |
| NFR-046 | Prompt & Content Safety | Jailbreak resistance evidence (**Mandatory**) | **N/A** | No model exists to jailbreak. |
| NFR-047 | Prompt & Content Safety | Output filtering (toxicity/PII/policy) | **N/A** | No generated output exists to filter. |
| NFR-048 | Grounding & Quality | RAG grounded on QR's authorized sources with citations | **Partial, reframed** | The "RAG shadow" feature is grounded on the same real STCC vendor-mirror clinical content (`Mdb*` tables) the deterministic engine uses — but it's a shadow comparison signal, not a citation-returning answer engine, and it isn't QR-specific content. |
| NFR-049 | Grounding & Quality | Hallucination/factual-accuracy benchmarking | **N/A** | No generative text output exists to benchmark for factual accuracy. |
| NFR-050 | Agent & Tool Governance | MCP tools registry with audit trail | **N/A** | No AI-agent/tool-calling architecture exists. |
| NFR-051 | Agent & Tool Governance | Policy-constrained autonomous agent actions | **N/A** | No autonomous AI agents exist in this system. |
| NFR-052 | Agent & Tool Governance | A2A protocol conformance | **N/A** | Same as above. |
| NFR-053 | Model Transparency | Model/data cards per LLM | **N/A** | No LLM is used. |
| NFR-054 | Model Transparency | Content provenance/watermarking (C2PA) | **N/A** | No AI-generated content exists to watermark. |
| NFR-055 | Cost Governance | Per-tenant token/request quotas | **N/A** | No token-based AI usage exists to quota. |
| NFR-056 | Regulatory | AI regulation compliance (EU AI Act, Qatar AI guidance) | **Likely N/A / low-risk classification** | Since there is no generative/autonomous AI decisioning component, this system likely falls outside or at the lowest tier of most AI-specific regulatory frameworks — but this determination should be confirmed by whoever owns regulatory/legal review, not asserted unilaterally here. |
| NFR-057 | Evaluation Framework | Golden-set/adversarial/regression eval before each release | **N/A for AI; Yes for the app generally** | No AI model exists to evaluate this way; the app does have a real, growing automated test suite (595 backend + 52 frontend tests, gated in CI as of this session) serving the equivalent regression-testing purpose for the actual (rules-based) system. |
| NFR-058 | Human Oversight | HITL for high-impact/low-confidence decisions | **Yes (real, not LLM-based)** | Same as NFR-034 — `approvalRouter.ts`'s clinical approval workflow is real, mandatory human review before high-impact clinical decisions are finalized. |
| NFR-059 | Agent Autonomy & Guardrails | Explicit boundaries on autonomous agent actions | **N/A** | No autonomous AI agents exist. |
| NFR-060 | HITL | Mandatory approval gates for high-risk AI-agent actions | **Yes (real, reframed)** | Same clinical-approval workflow — though it gates *clinical* decisions generally (both rules-engine and any AI-shadow input), not specifically "AI agent actions" since no autonomous agent exists. |
| NFR-061 | Agent Kill Switch | Immediate agent-termination capability | **N/A** | No running AI agent exists to kill-switch. |
| NFR-062 | Output Grounding & Confidence | Confidence scores + citations on AI output | **N/A** | No AI-generated output is shown to end users. |
| NFR-063 | Agent Decision Traceability | Full reasoning-chain logging for agents | **N/A** | No agent reasoning chain exists; the deterministic rules engine's decision path is traceable through `explainabilityTrace` on `SafetyAuditDeviationLog` instead — a different but conceptually related real capability. |

**AI tab summary: roughly 32 of 63 rows are N/A (no GenAI/LLM/agent component
exists to answer about), 3 are genuinely Yes (reframed around the real HITL/rules-
engine architecture rather than LLM explainability), ~10 are Partial (mostly
overlapping with NFR-tab gaps: no SIEM, no CMEK, no WAF, no FinOps dashboard), and the
rest are No.** The single most important message for this tab, if QR asks about it
directly, is: **this product does not currently contain a generative-AI or autonomous-
agent component** — the "shadow" AI feature is an internal QA signal, not a
production decision-maker. If QR's actual intent is to evaluate a *future* AI feature
roadmap rather than the current build, that's a different conversation than filling
this tab literally.

---

## Cloud CSQ tab (184 rows, CSA CAIQ-derived, 11 domains)

### Framing
This is a **Cloud Security Alliance CAIQ-style questionnaire** aimed at a mature cloud
service *provider* (the kind of document AWS/Azure/GCP themselves would fill in about
their own data centers) — many rows ask about things like physical data-center access
control, hypervisor hardening, background-checked data-center staff, and BYOK/customer-
managed encryption key support. For a workload **built on top of GCP** (not operating
your own data center), the honest answer to most physical/infrastructure-layer
questions is **"inherited from Google Cloud"** — citing Google's own published
compliance posture (Google is independently SOC 2 Type II and ISO 27001 certified,
publishes data-center physical security controls, offers CMEK, etc.) — while
application-layer questions (data segregation, incident response, secure disposal,
access reviews) need to be answered about **this application specifically**, not GCP.

Given the scale (184 rows), a full row-by-row table like the NFR/UX tabs would be
very long. Instead, here is the domain-level breakdown with the pattern that applies
within each, plus specific flags for the highest-stakes Mandatory items.

| Domain | Rows | Pattern |
|---|---|---|
| Compliance & Audits (CO) | 16 | Mostly about the *supplier organization's* formal certifications (SOC 2 Type 2, ISO 27001, pentests, audit-report sharing) — **this is a business/compliance-program question, not a code question**. As of this session: no SOC 2 Type II attestation exists (this engagement's remediation work is a self-assessment step toward that, documented in `docs/soc2-control-matrix.md`, not the certification itself); no ISO 27001 certification exists; no formal penetration test has been performed. |
| Information Governance (IG) | 15 | Data labeling standards, retention enforcement, secure disposal, DLP — mixed: Cloud SQL/GCP handles secure disposal of underlying storage; **no application-level DLP solution or formal data-labeling standard is implemented**; retention-policy enforcement is explicitly an accepted-risk gap (`docs/soc2-data-governance-schema-status.md`, this session). |
| Physical Access (PA) | 8 | Entirely about the **data center operator's** physical security — inherited from Google Cloud (`me-central1`, Doha), not something this application team controls or should attest to directly. |
| HR (HR) | 3 | Employee security training, background checks, termination procedures — **organizational/HR policy questions, not code questions.** |
| Information Security (IS) | 39 (largest domain) | The broadest domain: ISMS documentation, access-review cadence, encryption key management (BYOK/CMEK), vulnerability scanning, incident response, source-code access control. Real, mixed answers: session hardening and RBAC are real (Yes); BYOK/CMEK is **No** (GCP-managed keys only); vulnerability scanning exists only via `pnpm audit`/Dependabot (dependency-level, not infrastructure/network-layer scanning) — **Partial**; formal annual access-entitlement certification does **not** exist. |
| Legal (LG) | 4 | Data location/portability commitments, third-party data access, NDA — data location is a real, strong answer (`me-central1`, Doha, Qatar — same fact as NFR-185); the others are contractual/legal questions outside code scope. |
| Operations Management (OM) | 10 | Backup/recovery, capacity planning, VM restore/portability — Cloud SQL backups+PITR are real (this session); **VM image portability doesn't apply** (Cloud Run is a managed/serverless compute model, not customer-managed VMs) — several CAIQ questions here are IaaS-specific and don't map onto a PaaS/serverless architecture. |
| Risk Management (RM) | 13 | Formal risk-assessment cadence, SLA remuneration, business-continuity plans — **no formal enterprise risk-assessment program exists for this application**; no SLA-based remuneration terms exist (a commercial/contract question). |
| SW Deployment (SD) | 6 | Change management, QA process, secure SDLC, unauthorized-software controls — CI pipeline exists (typecheck + tests + dependency audit, this session) but **does not gate deployment** (flagged in the independent review — no branch protection, direct pushes to `main`); no formal SDLC security-defect-detection tooling (SAST) is in place beyond `pnpm audit`. |
| BCP/DR (DR) | 9 | Business-continuity testing, geographic redundancy, environmental/power resilience — geographic redundancy is a **real gap**: single ZONAL Cloud SQL instance, no DR region (same finding as the NFR tab's Availability & Resilience section); physical environmental controls are inherited from Google Cloud. |
| Architecture (AR) | 25 (2nd largest) | Federated identity/SAML, MFA, WAF, network segmentation, clock sync, code-security scanning — real gaps mirror the NFR tab's Authentication/Security Controls sections: **no SAML/SSO federation, no MFA anywhere in the app** (a serious, repeated gap across every tab that touches auth), no WAF, no SAST tooling; NTP/clock sync is inherited from the GCP platform (Yes by default). |

### Cross-cutting themes across the Cloud CSQ tab worth flagging directly

1. **No SSO/MFA is the single most repeated gap** across NFR, AI, and CSQ tabs alike
   (NFR-016/018/022, AI's implicit auth questions, CSQ's AR.03/AR.06/AR.13). This is
   worth fixing before any of these tabs go back to QR, not just documenting — it's
   the one gap that shows up in every security-flavored section of the whole
   questionnaire.
2. **No formal external certification** (SOC 2 Type II, ISO 27001) exists yet — the
   entire "Compliance & Audits" domain (CO) and several IS/AR rows depend on this.
   This session's work (`docs/soc2-control-matrix.md`) is explicitly a *readiness*
   document for that future audit, not the certification itself.
3. **BYOK/Customer-Managed Encryption Keys are not supported** — Cloud SQL and Secret
   Manager both use Google-managed keys today (IS.33/IS.34/IS.35, AI-tab NFR-020).
4. **No DR region** — the single ZONAL Cloud SQL instance recurs as a gap across the
   NFR tab (Availability & Resilience), the AI tab (Backup & Recovery), and the CSQ
   tab (DR domain) — worth fixing once, since it's cited from three directions.

---

## Combined recommendation across all four tabs

Given the volume and the repeated cross-cutting gaps (no SSO/MFA, no DR region, no
formal external certification, no SAST/pentest program), it may be more efficient to
first close or start a small number of **high-leverage, cross-tab gaps** — since each
one resolves multiple questionnaire rows across NFR, UX, AI, and CSQ simultaneously —
before doing a full row-by-row fill of the workbook. Happy to scope any of these as
next work, or to proceed straight to filling specific sections if you'd rather answer
honestly now and treat the gaps as a tracked backlog instead.
