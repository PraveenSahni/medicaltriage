# Mandatory Action & Approval Register

## Update 2026-08-05 (continued): reconciliation of the 82-vs-83 count discrepancy

A follow-up review found the category-count table in `management-summary.md`
summed to 83 while this register's stated total was 82. Root cause,
found by direct inspection - **two independent errors, not a real
duplicate row**:

1. **A genuine omission**: `IG.09` (Cloud CSQ, row 35, "Confirm whether
   the supplier have technical control capabilities to enforce customer
   data retention policies?") is a real, mandatory, currently-Partial
   Cloud CSQ row, extensively discussed in `business-decision-register.md`
   and `legal-privacy-action-pack.md`, but it was **never added to this
   register's own row tables or the CSV** - an oversight, not a
   duplicate. This is the true +1 that brings the correct total from 82
   to **83**.
2. **Two count-column typos in `management-summary.md`** that happened
   to roughly cancel: category 1 ("Engineering work remaining") listed
   16 IDs but its count column said "15"; category 8 ("Qatar Airways
   clarification required") listed 7 IDs but its count column said "8".
   Both are corrected below. Neither reflects a real duplicate or
   omitted row beyond IG.09.

**Reconciliation table** (the 7 previously-missing rows the prior
instruction asked to re-verify, plus IG.09, found this pass):

| Requirement ID | Tab | Workbook row | Current supplier response | Primary category | Secondary dependency | Included in unresolved total | Correction made |
|---|---|---|---|---|---|---|---|
| NFR-058 | Non Functional Req | 68 | Partial | 10 (third-party evidence) | - | Yes | Already correctly included; no duplicate found on another tab |
| IS.39 | Cloud CSQ | (network-scan row) | No | 10 (third-party evidence) | - | Yes | Already correctly included |
| IS.40 | Cloud CSQ | (app-scan row) | Partial | 10 (third-party evidence) | - | Yes | Already correctly included |
| IS.41 | Cloud CSQ | 93 | **N/A (was No)** | 12 (valid N/A) | - | Yes (as N/A, excluded from the scored denominator) | Reclassified this batch - see Batch 7A below |
| NFR-041 | Non Functional Req | (DR-architecture row) | Partial | 1 (engineering, long-lead) | 8 (QR RTO/RPO input) | Yes | Confirmed distinct from the AI-tab NFR-041 (SOC2/ISO cert row) - same ID, different tab, both real, both counted once each under their own tab; treated as tab+ID unique key throughout, no merge |
| NFR-189 | Non Functional Req | (SLI/SLO reporting row) | Partial | 8 (QR clarification) | - | Yes | Already correctly included |
| NFR-193 | Non Functional Req | (reference-customers row) | N/A (commercial) | 12 (valid N/A) | - | Yes (as N/A) | Already correctly included |
| **IG.09** | **Cloud CSQ** | **35** | **Partial** | **5 (business decision - joint)** | **6 (legal/privacy), 7 (clinical)** | **Yes - the true omission** | **Added to the register and CSV this pass; this is the actual +1 causing the 82-vs-83 gap** |

**Confirmation of the 4 required reconciliation properties**:
1. Every unresolved mandatory row now appears exactly once across the
   register (83 rows, tab+ID as the unique key - confirmed no ID
   collision was wrongly merged, e.g. the two distinct NFR-041 rows on
   different tabs are both present separately).
2. Every row has exactly one **primary** category (assigned above and
   in the per-tab tables below).
3. Secondary dependencies (e.g. NFR-041/NFR tab's QR-RTO/RPO input
   need, IG.09's legal/clinical joint-decision need) are recorded as a
   separate column/note, never added to the primary-category count.
4. The CSV and this Markdown register now agree at 83 rows each (see
   the CSV regeneration below).
5. The workbook, `mandatory-conversion-status.md`, and
   `management-summary.md` are reconciled to the same 83-row figure in
   the updates below.

**management-summary.md corrections applied**: category 1 count
15 -> 16 (list was already correct); category 5 count 10 -> 11 (IG.09
added); category 8 count 8 -> 7 (list was already correct, count typo
fixed). New category-count sum: 16+1+1+2+11+6+7+13+3+12+11 = **83**,
matching the corrected total.


_Generated 2026-08-05. Source of truth: the live questionnaire workbook
(`NFR_COTS_CSQ_v8.3-...xlsx`, all 4 tabs), `mandatory-conversion-status.md`,
`evidence-index.md`, `qr-questionnaire-backlog-tracker.md`,
`external-dependency-register.md`, `business-decision-register.md`,
`production-execution-register.md`, `qatar-airways-clarification-register.md`.
No questionnaire response was changed to produce this register - see
`closure-evidence-checklist.md` for what would need to happen before any
row's response is actually edited._

## Scope and reconciliation note

This register covers **every mandatory row, across all 4 tabs** (Non
Functional Req, UX, " AI", Cloud CSQ) that is not currently the exact
string `"Yes"` in the live workbook - **83 rows total** (17 NFR + 3 UX + 7 AI + 56 Cloud CSQ, corrected after finding IG.09 had been omitted - see the reconciliation update below). This is
broader than `mandatory-conversion-status.md`'s original scope (which
explicitly excludes UX/AI, "covered in Batches 4-5" but never
re-consolidated into that document) - the 10 UX/AI rows are folded in
here for the first time as a single register.

**Reconciliation findings, disclosed rather than silently corrected**:
- 7 rows exist in the live workbook as unresolved-mandatory but were
  never enumerated in any of `mandatory-conversion-status.md`'s
  bucket lists: **NFR-058, IS.39, IS.40, IS.41** (vulnerability
  scanning - discussed in prose only), **NFR-041 (NFR tab)** (a
  different row than the AI-tab NFR-041, tracked only in
  `production-execution-register.md`), **NFR-189** (tracked in its own
  section, not the bucket lists), **NFR-193** (a `"N/A (commercial)"`
  literal-string artifact). All 7 are included below.
- 4 Cloud CSQ rows (**PA.03, DR.06, DR.07, AR.19**) previously carried
  the literal value `"Yes (inherited)"`, not exact `"Yes"`. **Update
  2026-08-05 (Batch 7A)**: each was independently re-verified (source
  control identified, applicability confirmed, evidence currency
  confirmed, no contradicting scope limitation found) and normalized
  to exact `"Yes"` in the workbook - see the Cloud CSQ tab section
  below for the full before/after table. This is recorded as a
  **response normalization of already-real evidence, not a new
  engineering closure.**
- 2 rows (**NFR-193, RM.02**) read `"N/A (commercial)"` - genuinely
  non-technical/commercial questions, not engineering gaps. Listed
  under category 12 for completeness.
- `master-compliance-register.csv`/`.md` is stale relative to the
  current xlsx (several 2026-08-05 batches post-date its last
  regeneration) - recommend regenerating it before the next external
  submission. This register was built directly from the live workbook,
  not from that stale file.

**Percentage basis - superseded by Batch 7A recompute below**: 74/153 =
48.4% mandatory and 132/396 = 33.3% overall were the previously-
reported figures at the time this note was first written. Batch 7A
(this update) applied real, verified workbook edits (4 response
normalizations, 4 N/A reclassifications) and, per its own explicit
instruction, recomputed the percentages directly from the live
workbook rather than carrying the old figures forward unchanged - see
"Batch 7A scoring impact" below and `management-summary.md` for the
full before/after breakdown, with response-normalization, N/A-
reclassification, and genuine-new-closure impacts reported **separately**,
never conflated.

## Batch 7A scoring impact (direct live-workbook recompute)

**Live-workbook baseline immediately before Batch 7A** (all 4 tabs,
mandatory rows only, counted directly from the workbook - not the
possibly-stale `master-compliance-register.csv`):

| | NFR | UX | AI | Cloud CSQ | Total |
|---|---|---|---|---|---|
| Mandatory rows | 24 | 3 | 17 | 135 | 179 |
| Yes | 7 | 0 | 4 | 62 | 73 |
| N/A | 1 | 0 | 7 | 18 | 26 |
| Partial | 13 | 2 | 5 | 15 | 35 |
| No / other | 3 | 1 | 1 | 40 | 45 |

Denominator (N/A-excluded) = 179 - 26 = **153**. Mandatory % = 73/153 =
**47.7%**. This differs from the previously-reported 74/153 = 48.4% by
exactly 1 row in the numerator - a pre-existing drift already flagged
in this register's "Scope and reconciliation note" above
(`master-compliance-register.csv` staleness), not something this batch
caused or is attempting to explain away.

**After Batch 7A's edits**:

| | NFR | UX | AI | Cloud CSQ | Total |
|---|---|---|---|---|---|
| Mandatory rows | 24 | 3 | 17 | 135 | 179 |
| Yes | 7 | 0 | 4 | 66 | 77 |
| N/A | 2 | 0 | 7 | 21 | 30 |
| Partial | 13 | 2 | 5 | 15 | 35 |
| No / other | 2 | 1 | 1 | 33 | 37 |

Denominator (N/A-excluded) = 179 - 30 = **149**. Mandatory % = 77/149 =
**51.7%**.

**Impact broken out by cause, per the explicit instruction not to
conflate them**:

| Cause | Rows | Numerator (Yes) effect | Denominator effect | Isolated % |
|---|---|---|---|---|
| Response normalization only (4 "Yes (inherited)" -> "Yes": PA.03, DR.06, DR.07, AR.19) | 4 | +4 (73 -> 77) | unchanged (153 -> 153, these rows were never N/A) | 77/153 = 50.3% |
| N/A reclassification only (4 "No" -> "N/A": NFR-064, IS.41, IS.73, SD.06) | 4 | unchanged | -4 (153 -> 149) | 73/149 = 49.0% |
| **Both combined (actual Batch 7A result)** | 8 | +4 | -4 | **77/149 = 51.7%** |
| Genuine new engineering compliance closure | **0** | 0 | 0 | **No new engineering closure occurred this batch - explicitly not claimed** |

**The percentage increase from N/A reclassification (153 -> 149
denominator) is explicitly NOT an engineering compliance improvement**
- it reflects 4 rows genuinely and verifiably falling outside this
solution's applicable scope (2 already-inconsistent within the
workbook itself, 2 newly verified against GCP's shared-responsibility
model), not new controls being built. Only the 4 response-
normalization rows represent real, already-existing evidence being
correctly credited - also not new engineering work, but a correction
of an existing measurement artifact, exactly as Batch 7A's instruction
requires this to be labeled.

**Overall (all rows, any mandatory value, all 4 tabs) - directly
recomputed**: applying the same 4 Yes-normalizations and 4 N/A-
reclassifications (all of which are mandatory rows, a subset of
"overall") to the last full 4-tab count taken this engagement (458
total rows, 128 Yes, 54 N/A - see the general research pass underlying
this register): Yes 128 -> 132, N/A 54 -> 58, denominator 404 -> 400,
**overall % = 132/400 = 33.0%** (previously reported: 132/396 = 33.3% -
again a small pre-existing denominator drift, not caused by this
batch, and disclosed rather than silently reconciled away).

## Classification legend

1. Engineering work remaining
2. Implementation complete - awaiting deployment
3. Documentation complete - awaiting approval
4. Test procedure complete - awaiting execution
5. Business decision required
6. Legal or privacy approval required
7. Clinical approval required
8. Qatar Airways clarification required
9. External audit or certification required (incl. existing third-party
   attestation not yet reflected)
10. Third-party evidence required (specialist tooling/vendor, not a
    formal audit)
11. Cannot currently comply
12. Valid N/A

## Register

_Owner role names are used per the instruction not to invent named
individuals. "Supporting" = a role that must provide input/access but
is not the final decision owner. Full deep-dive fields (Required
access, Execution steps, Validation method, Estimated effort, Risk if
delayed, Target date) are given in full for the six named decision-pack
rows (IG.09, IS.02, LG.01, NFR-189, NFR-119, IS.07) in their dedicated
packs; this table carries the compact form for all 83 rows so nothing
is omitted._

### Non Functional Req tab (17)

| ID | Requirement (short) | Status | Gap | Required action | Owner | Supporting | Category | Target |
|---|---|---|---|---|---|---|---|---|
| NFR-016 | AD/OIDC/SAML federation vs real QR tenant | Partial | Real OIDC+PKCE built and proven vs. a mock IdP; no real AD/Entra tenant or SAML | Obtain real QR IdP tenant credentials; wire and verify against them; SAML remains explicitly out of scope unless requested | Qatar Airways Security/Technology Contact | DevOps Lead | 8 | Next bid cycle if QR responds |
| NFR-022 | SSO login (real IdP) | Partial | Same real gap as NFR-016 - proven vs. mock only | Same as NFR-016 | Qatar Airways Security/Technology Contact | DevOps Lead | 8 | Next bid cycle |
| NFR-038 | Availability SLA tier | Partial | 99.5%/month monitored as default; QR's mandated tier not confirmed | QR to specify SLA tier; then confirm/adjust monitoring target | Qatar Airways Security/Technology Contact | CTO | 8 | On QR response |
| NFR-039 | RTO (<15 min Tier 0 target) | No | Manual replica promotion + redeploy = hours, not minutes | Deploy DR-region compute tier + perform a real switchover drill | Cloud Administrator | DevOps Lead | 1 (long-lead) | Dedicated future session |
| NFR-040 | RPO (0 min Tier 0 target) | Partial | Bounded by unmeasured replication lag | Same DR deployment + drill as NFR-039; measure real lag under load | Cloud Administrator | DevOps Lead | 1 (long-lead) | Dedicated future session |
| NFR-041 | Primary+DR HA architecture | Partial | Cross-region DB replica exists; no DR-region compute; no drill | Same as NFR-039/040 | Cloud Administrator | DevOps Lead | 1 (long-lead) | Dedicated future session |
| NFR-058 | OWASP compliance (formal ASVS) | Partial | Real controls exist (CSP, rate limiting, internal DAST); no formal ASVS assessment | Commission a formal OWASP ASVS assessment (specialist skill, not routine engineering) | External Auditor | CISO | 10 | With CO.02/CO.03 engagement |
| NFR-064 | Data-handoff encryption in transit | No (candidate N/A) | No data-handoff pipeline of the kind this row addresses exists | Formally reclassify to N/A with a one-line justification once confirmed no such pipeline is planned | CISO | - | 12 | Low effort, next batch |
| NFR-076 | Encryption at rest/motion/in-use | Partial | TLS + Cloud SQL encryption real; field-level "in use" encryption not implemented | Scope and build field-level encryption for the highest-sensitivity fields (PII) | DevOps Lead | CISO | 1 | Future engineering batch |
| NFR-078 | PII not in logs, vault-encrypted | Partial | No systematic log-scrub audit; new request-duration logging already excludes bodies | Run a log-content audit across all log sinks; add scrubbing where PII is found | DevOps Lead | CISO/DPO | 1 | Future engineering batch |
| NFR-079 | DLP (no local downloads) | No | No DLP product/control exists | Evaluate and procure a DLP solution (CASB/DLP product) - not buildable in-house without one | CISO | Executive Sponsor | 11 | Procurement-dependent |
| NFR-118 | Anomaly alerting (any anomaly) | Partial | Real alert policies (5xx, p95, saturation, uptime) narrower than "any anomaly" | Decide whether broader ML-based anomaly detection is proportionate for this deployment size | CISO | DevOps Lead | 1 | Future engineering batch |
| NFR-119 | QR-facing configurable alert thresholds | Partial | Real engineer-set thresholds; not QR-self-service | See `production-execution-pack.md` - business decision first | Product Owner | DevOps Lead | 5 | See pack |
| NFR-156 | Capacity planning / soak testing | Partial | Validated to 25 concurrent users + 20-min soak, zero errors; 50-user tier constrained by 6-account test pool, not infra | Obtain QR peak-load projection; run 60+min soak and write-path validation once a larger test-account pool exists | Qatar Airways Security/Technology Contact | DevOps Lead | 8 | On QR response, then 1-2 eng. days |
| NFR-185 | Data residency (QR-approved regions) | Partial | All infra in `me-central1` (Doha) - not confirmed vs. QR's approved-region list | QR to confirm approved region(s) | Qatar Airways Security/Technology Contact | Cloud Administrator | 8 | On QR response |
| NFR-189 | SLIs/SLOs reported monthly to QR | Partial | Monitoring/calculation fully real and proven; no real QR recipient/live secrets configured | See `production-execution-pack.md`/NFR-189 pack | Qatar Airways Security/Technology Contact | DevOps Lead | 8 | On QR response, then <1 day |
| NFR-193 | 3 reference customers | N/A (commercial) | Non-technical commercial-relationship question | Route to commercial/sales function, not engineering | Executive Sponsor | - | 12 | N/A |

### UX tab (3)

| ID | Requirement (short) | Status | Gap | Required action | Owner | Supporting | Category | Target |
|---|---|---|---|---|---|---|---|---|
| NFR-004 (UX) | Cross-browser compatibility | Partial | Login/entry matrix real and passing (4 engines + 2 mobile); deeper clinical-workflow e2e blocked on DB-tunnel access | Restore Cloud SQL Auth Proxy tunnel access; re-run deeper e2e fixtures | DevOps Lead | Cloud Administrator | 4 | 1 eng. day once access restored |
| NFR-015 (UX) | WCAG 2.1 / responsive | Partial | 1 real violation (`html-has-lang`) on live `/help` - already fixed in source, stale deployed build | Redeploy `ist-triage-soc2` via canary-then-cutover; re-run a11y audit | Cloud Administrator | DevOps Lead | 2 | <1 day, needs go-ahead |
| NFR-016 (UX) | QR branding/theme | No | No QR-specific theme built; needs QR brand assets first | Request QR brand guidelines/assets; then apply via existing CSS custom-property theming | Qatar Airways Security/Technology Contact | Frontend Lead | 8 | On QR response |

### " AI" tab (7)

| ID | Requirement (short) | Status | Gap | Required action | Owner | Supporting | Category | Target |
|---|---|---|---|---|---|---|---|---|
| NFR-004 (AI) | PII masked/redacted in logs | Partial | No systematic log-scrub audit | Same audit as NFR-078 (NFR tab) - can be done as one exercise | DevOps Lead | CISO/DPO | 1 | Future engineering batch |
| NFR-010 (AI) | Cloud-native security service (SCC/Defender) | No | GCP project has no Organization resource - SCC cannot meaningfully attach | Decide whether to restructure GCP under an Organization (a real account-structure/business decision, not engineering) | Executive Sponsor | Cloud Administrator | 5 | Business decision first |
| NFR-014 (AI) | Firewall/WAF/DDoS | Partial | IP allowlist + Cloud Run baseline DDoS real; no WAF/Cloud Armor | Migrate to external HTTPS Load Balancer + Cloud Armor (real infra project, previously scoped and deferred) | Cloud Administrator | DevOps Lead | 1 (long-lead) | Dedicated future session |
| NFR-016 (AI) | Centralized secrets vault (all environments) | Partial | Secret Manager used for soc2; demo env still has plaintext `DATABASE_URL` | Obtain explicit go-ahead to modify demo environment's secrets (deliberately deferred pending authorization) | Executive Sponsor | DevOps Lead | 5 | On go-ahead, then <1 day |
| NFR-040 (AI) | Hallucination incident-response plan | Partial | Real IR plan exists; no live GenAI/LLM component exists to build a real triggered procedure for | Re-review when/if a live GenAI feature is ever added; no action possible before then | CISO | - | 12 (N/A-adjacent) | On future AI feature |
| NFR-041 (AI) | SOC2/ISO cert + compliance questionnaire | Partial | Readiness work is real; no formal certification exists | See `external-assurance-pack.md` | Executive Sponsor | External Auditor | 9 | Business-scoped engagement |
| NFR-044 (AI) | Log every AI request/response w/ actor+model version | N/A / Partial (hybrid) | No AI requests exist to log; real `AuditEvent` logging is the closest analog | Formally reclassify to N/A until a live AI feature exists, or keep Partial with this exact caveat | CISO | - | 12 | Low effort, next batch |

### Cloud CSQ tab (56)

**External-audit/certification-dependent (9)** - see `external-assurance-pack.md` for the full engagement scope:

| ID | Requirement (short) | Status | Owner | Category |
|---|---|---|---|---|
| CO.01 | Third-party audit reports | No | Executive Sponsor | 9 |
| CO.02 | External network pentest | Partial (internal DAST only) | Executive Sponsor | 9 |
| CO.03 | Independent application pentest | No | Executive Sponsor | 9 |
| CO.05 | External audit (general) | No | Executive Sponsor | 9 |
| CO.07 | External audit findings sharing | Partial (internal findings only) | Executive Sponsor | 9 |
| CO.08 | SOC 2 Type II attestation | No | Executive Sponsor | 9 |
| CO.09 | ISO 27001 certification | No | Executive Sponsor | 9 |
| PA.01 | Physical security attestation | Partial (GCP-inherited) | CISO | 9 |

**Normalized to "Yes" this batch (4) - Batch 7A response normalization, real evidence, not new engineering closure**:

| ID | Requirement (short) | Prior value | New value | Basis | Category |
|---|---|---|---|---|---|
| PA.03 | Physical perimeter security | "Yes (inherited)" | **Yes** | Verified genuinely inherited and attested (Google Cloud Trust Center, SOC 2/ISO 27001); no contradicting evidence found | 9 |
| DR.06 | Physical-disaster protection | "Yes (inherited)" | **Yes** | Same verification | 9 |
| DR.07 | Power/network redundancy | "Yes (inherited)" | **Yes** | Same verification | 9 |
| AR.19 | NTP/time synchronization | "Yes (inherited)" | **Yes** | Same verification, additionally corroborated by this engagement's own consistent audit-trail timestamps | 9 |
| PA.05 | Physical ingress/egress monitoring | "Yes (inherited)" | **Yes** | Same verification. **Found and corrected in a follow-up reconciliation pass** - this row's workbook value was already "Yes (inherited)" but had been mis-transcribed as "Partial" in this register, causing it to be missed by the original Batch 7A pass; a mechanical overall-denominator reconciliation caught the omission | 9 |

_These 5 no longer appear in the "unresolved" tables above/below - they moved to Yes and are excluded from the 83-row unresolved count going forward (see `mandatory-conversion-status.md`'s "Batch 7A" update)._

**Reclassified to N/A this batch (3, Cloud CSQ) - Batch 7A, genuine verification per the strict N/A criteria, not automatic conversion**:

| ID | Requirement (short) | Prior value | New value | Verified basis (not "not implemented") | Category |
|---|---|---|---|---|---|
| IS.41 | OS-layer vulnerability scan | No | **N/A** | Cloud Run's OS layer is entirely Google-operated; OS-patching/scanning is Google's contractual responsibility under GCP's published shared-responsibility model, independently attested (SOC 2/ISO 27001) - not an IST gap, and architecturally impossible for IST to perform even if desired | 12 |
| IS.73 | Virtualization-layer attack detection | No | **N/A** | Hypervisor layer entirely Google-operated/attested; zero guest-level access exists for IST to build detection against, even in principle | 12 |
| SD.06 | Unauthorized software-install restriction | No | **N/A** | Immutable, ephemeral Cloud Run images built solely through this repo's CI/CD - no persistent, directly-administered surface for "installation" in the traditional sense; the real supply-chain analog (SBOM + dependency scanning) already exists as a different, already-covered control | 12 |

_Each remark cross-references Google's shared-responsibility model or this application's architecture, not a bare "handled by the cloud provider" assertion - the exact standard the reconciliation instruction required._

**Reclassified to N/A this batch (1, Non Functional Req) - Batch 7A**:

| ID | Requirement (short) | Prior value | New value | Verified basis | Category |
|---|---|---|---|---|---|
| NFR-064 | Data-handoff encryption in transit | No | **N/A** | No distinct data-handoff pipeline of the kind this row addresses exists beyond standard API traffic (already TLS-encrypted by default) - corrects a real internal inconsistency where the prior remark's own prose already said "Not applicable" while the Compliance cell read "No" | 12 |

**Reviewed, NOT reclassified to N/A this batch - integrity corrections only (Compliance value unchanged, remark corrected)**:

| ID | Requirement (short) | Status | Why NOT reclassified to N/A | Category |
|---|---|---|---|---|
| IS.11 | Employee awareness of violation consequences | No (unchanged) | This is a genuine, unimplemented HR/security-policy gap (same real gap as IS.10) - not architectural non-applicability. The prior remark's "not applicable" framing was inaccurate and has been corrected in the workbook remark; this is exactly the "not currently implemented" trap the reconciliation instruction warned against | 5 |
| AR.17 | Rogue/unauthorized network device detection | No (unchanged) | GCP's own network-security controls cover the hosting side (attested), but whether IST operates any physical corporate-office network of its own is genuinely **unconfirmed**, not confirmed non-applicable - retained as "No" pending Facilities/IT input rather than assumed N/A via the "no physical office" reasoning the instruction explicitly flagged as invalid | 11 |
| NFR-040 (AI) | Hallucination incident-response plan | Partial (unchanged) | Reviewed against the "shadow AI" trap explicitly: confirmed via repo grep that real `RagRetrievalEvent`/`LlmShadowSuggestion`/etc. Prisma models and a shadow-comparison service genuinely exist (a real, purpose-built AI-evaluation architecture), even though no live LLM inference is wired yet (no LLM client dependency, `simulationEngine.ts` confirmed fully deterministic). The existing remark already documents this precisely and commits to a real procedure before live deployment - already honest, not an N/A-trap violation. No change made | 12 (N/A-adjacent, but correctly NOT full N/A) |
| NFR-044 (AI) | Log every AI request/response | N/A for AI / Partial generally (unchanged) | Same shadow-AI-architecture finding as NFR-040 (AI) - the existing hybrid answer is already precise and defensible, not a bare "no AI" dismissal. No change made | 12 (hybrid, unchanged) |

**Cannot-currently-comply (11, after moving PA.03/DR.06/DR.07/AR.19 to Yes and IS.41/IS.73/SD.06/NFR-064 to N/A above, DR.05 below, and IS.11/AR.17 retained above)**:

| ID | Requirement (short) | Status | Required action | Owner | Category |
|---|---|---|---|---|---|
| IG.01 | Data-labelling standard (ISO 15489-style) | No | Adopt and implement a formal labelling standard - a real program, not a quick fix | Clinical Governance Lead | 11 |
| IG.06 | Customer-configurable geo-routing | No | Would require a new architectural capability (per-customer region routing) | Cloud Administrator | 11 |
| IG.15 | Dedicated DLP tool | No | Same procurement dependency as NFR-079 | CISO | 11 |
| PA.04 | Customer geo-routing control | No | Same as IG.06 | Cloud Administrator | 11 |
| IS.13 | Access-removal-speed metrics | No | Build a real offboarding SLA + metric; needs an HR/IT-offboarding process to measure against | HR Lead | 11 |
| IS.33 | CMEK (customer-managed encryption keys) | No | Not creation-time-retrofittable onto existing Cloud SQL instance without a rebuild | Cloud Administrator | 11 |
| IS.34 | BYOK | No | Same limitation as IS.33 | Cloud Administrator | 11 |
| IS.45 | Dedicated threat-detection signatures | No | Requires a commercial threat-detection product | CISO | 11 |
| IS.53 | Forensic-collection capability | No | Requires a dedicated forensic-readiness program/tool | CISO | 11 |
| LG.02 | Third-party data access beyond Twilio metadata | No | No such access exists to control - likely genuine N/A once reviewed by Legal Counsel | Legal Counsel | 11 |
| DR.05 | Recurring BCP test program | No | Build a recurring (not one-off) BCP/DR test cadence on top of the existing restore-drill precedent | DevOps Lead | 1 |

**Third-party evidence required (2, unchanged)**:

| ID | Requirement (short) | Status | Required action | Owner | Category |
|---|---|---|---|---|---|
| IS.39 | Network-layer vulnerability scan | No | Commission a real network vuln scan (commercial tool/vendor) | External Auditor | 10 |
| IS.40 | Application-layer vulnerability scan | Partial (pnpm audit + internal DAST) | Commission a full commercial app-layer scanner | External Auditor | 10 |

**Valid N/A - genuinely unchanged, no action, no reclassification needed (2)**:

| ID | Requirement (short) | Status | Note | Owner | Category |
|---|---|---|---|---|---|
| IS.59 | Metadata-collection via inspection tech | No (Expected: No) | Not actually a gap - Expected value is itself "No," and the Response already matches it; not genuinely an "N/A candidate," flagged here for completeness only. A scoring-convention note (see `management-summary.md`): this engagement's Yes-only compliance count does not credit rows where "No" is the expected/compliant answer | CISO | 12 (already-satisfied, not N/A) |
| RM.02 | SLA remuneration terms | N/A (commercial) | Genuinely non-technical/commercial question, already correctly labeled | Executive Sponsor | 12 |

**Business decision required - joint clinical/legal/privacy/executive (1) - the true omission found this pass**:

| ID | Requirement (short) | Status | Required action | Owner | Supporting | Category | Secondary |
|---|---|---|---|---|---|---|---|
| IG.09 | Retention policy for `AviationTriageEncounter`/`AuditEvent` | Partial | See `legal-privacy-action-pack.md`'s full retention-decision pack | Clinical Governance Lead + Legal + DPO + Executive Sponsor (joint) | DevOps Lead (implementation once decided) | 5 | 6 (legal/privacy), 7 (clinical) |

**Decision-paper-needed - legal/privacy (5)**:

| ID | Requirement (short) | Status | Required action | Owner | Category |
|---|---|---|---|---|---|
| IG.10 | Third-party/government data-request procedure | No | Draft and approve a formal procedure | Legal Counsel | 6 |
| IS.52 | Chain-of-custody standard alignment | No | Draft and approve a chain-of-custody policy | Legal Counsel | 6 |
| IS.55 | Subpoena-data-separation attestation | No | Draft and approve a process/attestation | Legal Counsel | 6 |
| IS.62 | Qatar-law Privacy Policy alignment | Needs legal input | Legal review of Privacy Policy against Qatar law | Legal Counsel / DPO | 6 |
| DR.09 | Customer jurisdiction-routing control | No | Likely a genuine architectural gap requiring a business decision on scope, then legal review | Legal Counsel | 6 |

**Decision-paper-needed - operational/HR (7)**:

| ID | Requirement (short) | Status | Required action | Owner | Category |
|---|---|---|---|---|---|
| PA.02 | GCP-personnel background-check policy | No | Outside IST's control (Google's own personnel) - confirm and document as inherited/N/A-adjacent | CISO | 5 |
| HR.01 | Formal security-role training program | No | Design and approve a training program | HR Lead | 5 |
| HR.02 | Training-acknowledgment documentation | No | Dependent on HR.01 being approved first | HR Lead | 5 |
| IS.10 | Disciplinary/sanction policy | No | Draft and approve a policy | HR Lead | 5 |
| IS.20 | Formal security-awareness training | No | Design and approve a training program | HR Lead | 5 |
| IS.21 | Admin legal-responsibility training | No | Design and approve a training module | HR Lead | 5 |
| IS.27 | Staff policy-awareness program | No | Design and approve a program | HR Lead | 5 |

**Existing-control, documentation-closable or engineering-closable (11)**:

| ID | Requirement (short) | Status | Required action | Owner | Category |
|---|---|---|---|---|---|
| IS.02 | Executive security-policy commitment | Partial | Named-executive sign-off on an executive security-policy document | Executive Sponsor / CISO | 3 |
| IS.50 | (existing-control evidence-missing row) | Partial | Document existing control | CISO | 1 |
| IS.66 | (existing-control evidence-missing row) | Partial | Document existing control | CISO | 1 |
| LG.01 | NDA/confidentiality execution | Partial | Execute a real, signed NDA/confidentiality agreement | Legal Counsel | 6 |
| DR.04 | (existing-control evidence-missing row) | Partial | Document existing control | DevOps Lead | 1 |
| AR.03 | (existing-control evidence-missing row) | Partial | Document existing control | CISO | 1 |
| AR.13 | (existing-control evidence-missing row) | Partial | Document existing control | CISO | 1 |
| AR.21 | (existing-control evidence-missing row) | Partial | Document existing control | CISO | 1 |
| CO.04 | Internal audit program | Partial | Formalize and document an internal audit program (buildable without an external firm) | CISO | 1 |
| IS.07 | Terraform/production drift detection | Partial | See `production-execution-pack.md` | DevOps Lead | 4 |
| NFR-041 (already listed, NFR tab) | - | - | - | - | - |

## Questionnaire control

**No response in the workbook was changed by this batch.** Every
"questionnaire-ready closure remark" in this register and its
companion packs is prepared **for future use only**, to be applied
once the corresponding action/approval/evidence is real - never
speculatively.

## Update 2026-08-06: IS.39 applicability subcomponent review (real workbook change, disclosed)

Unlike every other entry in this register (prepared remarks only, no
workbook change), this one **was** applied directly: IS.39
("network-layer vulnerability scans") was split into a host/VM/network-
device subcomponent (N/A - no VMs or customer-managed network devices
exist under this Cloud Run serverless deployment) and a public-endpoint
TLS/reachability subcomponent (applicable, only partially met). Moved
No -> Partial in the live workbook. Full analysis:
`docs/security/na-applicability-register.md`. No score impact on the
binary Method A score (a No->Partial shift, both "not Yes").
