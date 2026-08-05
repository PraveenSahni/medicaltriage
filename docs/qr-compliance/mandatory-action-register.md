# Mandatory Action & Approval Register

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
string `"Yes"` in the live workbook - **82 rows total** (17 NFR + 3 UX + 7 AI + 55 Cloud CSQ). This is
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
- 4 Cloud CSQ rows (**PA.03, DR.06, DR.07, AR.19**) carry the literal
  value `"Yes (inherited)"`, not exact `"Yes"` - substantively these
  are real, evidenced "Yes" answers (Google Cloud's own attestations
  covering physical/environmental controls this application doesn't
  own), but they count as "unresolved" under a strict string match.
  They are listed below with dependency category **9 (external
  evidence - already exists)** and a recommended action of *normalizing
  the workbook cell to `"Yes"`* with the inherited-attestation caveat
  kept in the remark - this register does not make that edit itself
  (see "Questionnaire control" below).
- 2 rows (**NFR-193, RM.02**) read `"N/A (commercial)"` - genuinely
  non-technical/commercial questions, not engineering gaps. Listed
  under category 12 for completeness.
- `master-compliance-register.csv`/`.md` is stale relative to the
  current xlsx (several 2026-08-05 batches post-date its last
  regeneration) - recommend regenerating it before the next external
  submission. This register was built directly from the live workbook,
  not from that stale file.

**Percentage basis**: 74/153 = 48.4% mandatory and 132/396 = 33.3%
overall are the figures already reported to date and used in
`management-summary.md` below **unchanged**, per this batch's explicit
instruction not to recompute or restate compliance percentages
differently. The row-count reconciliation above is reported as a
transparency finding for a future register-regeneration pass, not used
to override the standing percentages.

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
packs; this table carries the compact form for all 82 rows so nothing
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

### Cloud CSQ tab (55)

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
| PA.05 | Physical ingress/egress monitoring | Partial (GCP-inherited) | CISO | 9 |

**Already-inherited "Yes" candidates (4) - workbook not edited this pass**:

| ID | Requirement (short) | Workbook literal value | Recommended workbook normalization (not applied) | Category |
|---|---|---|---|---|
| PA.03 | Physical perimeter security | "Yes (inherited)" | Normalize to "Yes" with inherited-GCP-attestation caveat retained | 9 |
| DR.06 | Physical-disaster protection | "Yes (inherited)" | Same | 9 |
| DR.07 | Power/network redundancy | "Yes (inherited)" | Same | 9 |
| AR.19 | NTP/time synchronization | "Yes (inherited)" | Same | 9 |

**Cannot-currently-comply (14, after moving PA.03/DR.06/DR.07/AR.19 above and DR.05 below)**:

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
| IS.59 | Metadata-collection via inspection tech | No (N/A-flavored) | Reclassify as N/A - no such inspection technology in this architecture | CISO | 12 |
| LG.02 | Third-party data access beyond Twilio metadata | No | No such access exists to control - likely genuine N/A once reviewed | Legal Counsel | 11 |
| DR.05 | Recurring BCP test program | No | Build a recurring (not one-off) BCP/DR test cadence on top of the existing restore-drill precedent | DevOps Lead | 1 |
| IS.39 | Network-layer vulnerability scan | No | Commission a real network vuln scan (commercial tool/vendor) | External Auditor | 10 |
| IS.40 | Application-layer vulnerability scan | Partial (pnpm audit + internal DAST) | Commission a full commercial app-layer scanner | External Auditor | 10 |
| IS.41 | OS-layer vulnerability scan | No | Cloud Run is Google-managed - clarify whether this is inherited (GCP) or genuinely N/A | Cloud Administrator | 12 (candidate) |

**Valid N/A candidates (5)**:

| ID | Requirement (short) | Status | Required action | Owner | Category |
|---|---|---|---|---|---|
| IS.11 | Unauthorized OS-layer software install | No (N/A candidate) | Confirm no OS-layer access exists in this serverless architecture; reclassify | CISO | 12 |
| IS.73 | Physical wireless infrastructure controls | No (N/A candidate) | Confirm no physical wireless infra owned by IST; reclassify | CISO | 12 |
| SD.06 | (Supplier-domain N/A candidate) | No | Confirm applicability; reclassify if genuinely N/A | CISO | 12 |
| AR.17 | Virtualization-layer attack surface | No (N/A candidate) | Confirm serverless architecture has no virtualization layer IST controls; reclassify | Cloud Administrator | 12 |
| RM.02 | SLA remuneration terms | N/A (commercial) | Route to commercial/contracts function | Executive Sponsor | 12 |

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
