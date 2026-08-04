# QR NFR/COTS/CSQ Questionnaire — Technical Requirements Mapping Review

_Review pass only — nothing has been written into the workbook yet, per instruction to
review and understand the mapping first. Source file:
`NFR_COTS_CSQ_v8.3-....xlsx`, tab "Non Functional Req" (195 rows, `NFR-001`–`NFR-195`,
29 sections). The "UX" (17 rows) and " AI" (63 rows) tabs and the "Cloud CSQ" tab have
not been reviewed yet — this pass covers the Non Functional Req tab only, since that's
what "technical requirements" referred to._

## Important framing before any answer gets written

This questionnaire's template appears written for a **large, established enterprise
COTS/SaaS platform vendor** (assumes a developer portal, API monetization, thick
clients, formal PAM/SIEM integration, a public bug-bounty program, dedicated account
teams, etc.). This codebase is a **bespoke tele-triage application** built this
engagement, not an off-the-shelf enterprise platform. Two honest implications:

1. A large fraction of rows will honestly be **"No" or "Not Applicable to this
   architecture"** — not because the product is bad, but because these are COTS-vendor
   questions being asked of a custom-built system. Marking them Yes to look complete
   would be dishonest and likely to fail regardless once QR does technical diligence.
2. Some rows are **business/commercial questions** (Partnership, Reference Customers,
   Exit Pricing) that have nothing to do with the codebase — those need input from
   whoever owns the commercial relationship with Qatar Airways, not from a code review.

## Legend used below
- **Yes** — real, verified in code/infra this session or a prior one, with a citation.
- **Partial** — something real exists but falls short of the literal requirement.
- **No** — nothing in the codebase does this today.
- **N/A (commercial)** — not a code question; needs business/sales input.
- **Needs QR input** — the requirement itself depends on QR specifying a parameter
  (tier level, approved region, etc.) before it can be answered at all.

---

## Section-by-section summary

| Section | Rows | Rough split | Headline |
|---|---|---|---|
| API Management | 001–009, 186–187 (11) | 1 Yes, 3 Partial, 7 No | REST APIs exist; no developer portal, discovery, monetization, or formal OpenAPI docs |
| Auditing | 010–015 (6) | 3 Yes, 2 Partial, 1 No | Real `AuditEvent` + transition-log audit trail exists; **no soft delete** (queue items are hard-deleted) |
| Authentication | 016–028 (13) | 2 Yes, 3 Partial, 8 No | Session-based custom auth only; no AD/OIDC/SAML federation, no MFA, no IP allowlisting |
| Authorization | 029–036 (8) | 3 Yes, 3 Partial, 2 No | Real fine-grained RBAC (19 roles); no self-service admin UI or periodic-review workflow |
| Availability & Resilience | 037–048 (12) | 0 Yes, 2 Partial, 10 No | Single ZONAL Cloud SQL instance, no DR region, no tested RTO/RPO |
| Batch Processing | 049–055 (7) | 0 Yes, 1 Partial, 6 No | No job-scheduling subsystem; ad hoc scripts only |
| Compliance | 056–059, 185 (5) | 0 Yes, 3 Partial, 2 No | Secret Manager partially used; no license-compliance audit; regulatory (GDPR/HIPAA/PCI) not formally assessed |
| Data Analytics | 060–066 (7) | 0 Yes, 1 Partial, 6 No | No analytics export API or data-warehouse handoff pipeline |
| Data Management | 067–073 (7) | 0 Yes, 2 Partial, 5 No | No automated purge/archive; no test-data masking tool |
| Data Migration | 074 (1) | 1 Partial | Ad hoc Prisma-migration + custom loader scripts, not a general migration tool |
| Data Protection | 075–080 (6) | 1 Yes, 3 Partial, 2 No | Encryption in transit/at rest via platform; no data-spiking, no file-upload malware scanning |
| Emerging Technologies | 081–082 (2) | 1 Partial, 1 Partial | RAG-shadow/semantic-matching AI features exist as **shadow-only**, not driving live decisions |
| Environments | 083–085 (3) | 0 Yes, 1 Partial, 2 No | Two environments (demo, soc2) exist; no formal SIT/UAT/Stage with SLA |
| Extensibility | 086–100 (15) | 1 Yes, 4 Partial, 10 No | Standard open stack (Node/TS/React); no plugin framework, feature flags, or automated blue-green pipeline |
| Hosting | 101–104 (4) | 2 Yes, 1 Partial, 1 Needs-input | **GCP Cloud Run, region me-central1 (Doha, Qatar)** — a real, strong answer |
| Integration | 105–113, 188 (10) | 0 Yes, 3 Partial, 7 No | REST-only; no event/async messaging, no webhook signing/DLQ |
| Technology Standards | 114–115 (2) | 2 Yes | Current, actively-maintained stack (Node 24 runtime, TS 5.6, React 18, Express 4, Prisma 5) |
| Observability, Monitoring & Alerts | 116–134, 189–190 (21) | 1 Yes, 3 Partial, 17 No | Basic uptime checks + email alerts only (added this session); no full logs/traces/APM, no SIEM streaming, no cost dashboards |
| Partnership | 135–137, 193 (4) | N/A (commercial) | Not a code question |
| Performance | 138–151 (14) | 0 Yes, 3 Partial, 11 No | No formal perf-test gate in CI, no caching layer, no compression middleware confirmed |
| Scalability | 152–156 (5) | 1 Yes, 2 Partial, 2 No | Cloud Run auto-scales app tier; Cloud SQL is a single-instance bottleneck |
| Upgrades | 157–163 (7) | 0 Yes, 3 Partial, 4 No | Manual canary-then-cutover pattern used this session; not pipeline-automated, no QR approval workflow |
| Maintainability | 164–165 (2) | 1 N/A, 1 No | Web app only (no thick client → N/A); business rules are code, not admin-configurable |
| Security Controls | 166–184 (14) | 1 Yes, 5 Partial, 8 No | Solid session-cookie hygiene (HttpOnly/SameSite=Strict/Secure, 30-min TTL) and Helmet; **no AD-only login (real gap — shared admin password, flagged separately)**, no PAM/JIT, no pentest evidence |
| Network requirements | 175–176 (2) | Needs QR input | Can't be answered without QR's network topology decisions |
| Supply Chain Security | 177–179 (3) | 0 Yes, 2 Partial, 1 No | Dependabot + `pnpm audit` in CI (weekly, gate on high/critical); no SBOM generation, no code signing |
| Exit & Portability | 191–192 (2) | 1 Partial, 1 Partial | Postgres data is exportable by nature; no formal exit-plan document |
| Sustainability | 194 (1) | N/A (commercial) | GCP's public sustainability commitments could be cited generically, not IST's own |
| Accessibility | 195 (1) | 0 No | No VPAT/WCAG audit has been performed |

---

## Deep dive: the 24 "Mandatory = Yes" rows

These are the rows QR marked as absolute gating requirements — the ones a "No" on will
hurt most. Worth reviewing individually before anything else.

| ID | Requirement (short) | Honest status | Evidence / gap |
|---|---|---|---|
| NFR-010 | Audit all DML with before/after values | **Yes** (queue actions), **Partial** (not universal) | `AuditEvent` (`recordQueueAuditEvent`, `queueOrchestration.ts`), `QueueTransitionLog` captures `fromStatus`/`toStatus`. Gap: `updateQueueContext` (severity/disposition/SBAR edits) has **no** audit row — flagged in the independent SOC 2 review this session, not yet fixed. |
| NFR-011 | Audit table retains full lifecycle history | **Partial** | `AuditEvent`/`QueueTransitionLog` are append-only, but queue-item **hard delete** removes the parent row entirely (`deleteQueueItem`, `queueOrchestration.ts`) — the audit event survives but the record it describes doesn't. |
| NFR-016 | AD/OIDC/SAML federated auth | **No** | Custom session-based login only (`securityAdmin.ts`); no identity-provider integration exists. |
| NFR-022 | SSO login | **No** | Same as above — no SSO of any kind implemented. |
| NFR-027 | IP allowlisting outside QR network | **No** | No IP-based access control exists anywhere in the app. |
| NFR-038 | Availability SLA (e.g. 99.95% Tier 0) | **No formal SLA** | No SLA has been defined or measured; uptime checks (added this session) only detect outages, don't guarantee an SLA. |
| NFR-039 | RTO with DR-test evidence | **No** | No DR region exists; no DR test has ever been run (explicitly flagged as a gap in `docs/backup-disaster-recovery-plan.md`). |
| NFR-040 | RPO with DR-test evidence | **Partial** | Cloud SQL point-in-time recovery is enabled (RPO ~seconds for the primary), but there is no cross-region replica, so a zone/region outage has no near-zero-RPO failover. |
| NFR-041 | Primary & DR HA architecture | **No** | Single ZONAL Cloud SQL instance (`docs/backup-disaster-recovery-plan.md` explicitly calls this an accepted risk for demo/staging, not production-appropriate). |
| NFR-056 | Only commercially-clean OSS licenses | **Not yet audited** | No formal license-compliance scan has been run against `package.json`'s dependency tree. |
| NFR-058 | OWASP-compliant security architecture | **Partial** | Helmet, parameterized queries via Prisma, session hardening are real; but the independent review this session found a shared `ADMIN_PASSWORD` that authenticates as any user (a serious OWASP A07 finding), plus other gaps — cannot honestly claim full OWASP alignment yet. |
| NFR-064 | Encrypted data handoff to analytics | **N/A currently** | No analytics data-handoff pipeline exists at all (see NFR-060–066) — nothing to encrypt yet. |
| NFR-076 | Encryption at rest/in transit/in use | **Yes/Partial** | TLS in transit (Cloud Run/Firebase Hosting default HTTPS), Cloud SQL encryption at rest (GCP default). "In use" (e.g. field-level encryption) is **not** implemented — see `docs/soc2-data-governance-schema-status.md`'s accepted-risk documentation from this session. |
| NFR-078 | PII never in logs, always encrypted with vault keys | **Partial/Unverified** | No field-level encryption of PII exists; no systematic log-scrubbing audit has been performed to confirm PII never lands in logs. |
| NFR-079 | Data-loss prevention (no local export of sensitive data) | **No** | No DLP controls exist; nothing prevents copying rendered clinical data. |
| NFR-116 | Full observability (logs/traces/metrics with user/session/error detail) | **No** | Only basic Cloud Run request logging + the uptime checks added this session exist — no distributed tracing, no structured per-request metrics dashboard. |
| NFR-118 | Anomaly alerting (error rate, SLA, performance) | **Partial** | Only binary up/down alerting exists (this session's addition); no error-rate or performance-threshold alerting. |
| NFR-119 | Configurable alert thresholds | **No** | The uptime-check thresholds are fixed in the Terraform-free `gcloud` config, not exposed as a QR-configurable setting. |
| NFR-138 | ≤3s response time for critical transactions | **Not measured** | No load-test evidence exists to confirm this either way. |
| NFR-152 | Scalability SLA for peak + projected growth | **Partial** | Cloud Run auto-scales app instances; Cloud SQL (single instance) has not been load-tested against a defined peak target. |
| NFR-156 | Capacity sized for peak without degradation | **Not measured** | Same as above — no capacity/load testing has been performed. |
| NFR-185 | Data residency in QR-approved region | **Likely Yes, needs QR confirmation** | All current infrastructure (Cloud Run, Cloud SQL, Firebase Hosting) is provisioned in `me-central1` (Doha, Qatar) — a strong real answer once QR confirms this region is on their approved list. |
| NFR-189 | SLIs/SLOs defined, monitored, reported monthly | **No** | No SLIs/SLOs have been formally defined; nothing is reported to QR today. |
| NFR-193 | 3+ comparable enterprise reference customers | **N/A (commercial)** | Not a code question — needs input from whoever owns the QR commercial relationship. |

**Bottom line on the mandatory set:** of 24 gating requirements, roughly **3 are solid
Yes** (audit trail exists for queue actions, encryption in transit/at rest, Qatar-region
hosting), **~9 are Partial** with real but incomplete implementations, and **~11 are
No** — mostly around DR/HA, federated auth/SSO, IP restriction, and formal
observability/SLO reporting. These are the rows most worth discussing before any
answer is finalized, since a weak "No" on a mandatory item is far more consequential
than on an optional one.

---

## Recommended next step

Given the above, before filling the sheet I'd suggest deciding, per section, whether
to:
1. Answer honestly as-is (recommended for anything code-verifiable — matches the
   "mark honestly, cite real gaps" approach already used for the SOC 2 control matrix
   this session), or
2. Flag as "roadmap/planned" for gaps that are realistically closeable before this
   goes to QR (e.g. SSO/OIDC integration, DR region, SBOM generation), or
3. Route to someone else entirely (Partnership, Reference Customers, Exit Pricing,
   Network requirements — these need QR's own infrastructure team or the commercial
   owner, not a code answer).

Let me know which sections you want to start actually filling into the workbook, and
whether any of the "No" answers above should instead become "Planned — target date
TBD" rather than a flat No.
