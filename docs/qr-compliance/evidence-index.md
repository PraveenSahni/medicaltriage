# Evidence Index

_Maps every "Yes" response to its evidence. Generated 2026-08-05. Full
machine-readable version: `master-compliance-register.csv` columns
`Evidence Location` / `Validation Method` for all 105 rows currently
scored "Yes"._

## Full detail for this engagement's most recent closures (2026-08-05)

These rows have complete column detail per the mandated evidence-index
shape, since they were validated in this session with a known validator
and date.

| Requirement ID | Control | Code reference | Config reference | Document reference | Test reference | Operational evidence | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|---|---|---|---|
| NFR-011 | Soft-delete on queue items | `src/services/queueOrchestration.ts` (`deleteQueueItem`, `dbRowToRecord`) | `prisma/schema.prisma` (`TriageQueueItem.deletedAt/deletedBy`) | `docs/data-management-policy.md` §9 | `tests/softDeleteAndOrgExport.test.ts` | DB-verified scratch script against real local Postgres | 2026-08-05 | This engagement (automated + reviewed) | None known |
| CO.13 / LG.04 | Org-scoped data export | `src/routes/admin.ts` (`GET /organizations/:orgId/export`) | PAM elevation gate | `docs/data-management-policy.md` §8 | `tests/softDeleteAndOrgExport.test.ts` | Same DB-verified scratch script | 2026-08-05 | This engagement | Export is JSON only, no scheduled/automated delivery |
| IS.54 | Org-level legal hold | `src/scripts/purgeExpiredQueueData.ts`, `src/scripts/fulfillPrivacyRequests.ts` | `LegalHold.resourceType="Organization"` | `docs/data-management-policy.md` §3 | Existing jest suite (692 baseline) | Reasoned via code review, not a live legal-hold drill | 2026-08-05 | This engagement | No live drill of an actual org-wide hold performed yet |
| IS.61 | Privacy-breach anomaly detection | `src/services/securityAdmin.ts` (`checkRevealAnomalyRate`) | 5-min rolling window, threshold 10 | none dedicated | Existing jest suite | Detection + `AuditEvent` write only, no external paging | 2026-08-05 | This engagement | Not a live external-notification system - explicitly scoped as detection + audit trail |
| NFR-010 | DML audit completeness | `src/services/queueOrchestration.ts:1936`, `src/services/securityAdmin.ts:2850,2905` | none | none dedicated | Existing jest suite | Confirmed via targeted grep for all `.create()`/`.update()`/`.delete()` call sites | 2026-08-05 | This engagement | Coverage confirmed for queue orchestration + security admin modules only, not repo-wide |
| NFR-116 | Request-ID propagation to outbound FHIR | `src/integration/fhirWriteback.ts`, `src/routes/emr.ts` | `ExecuteWritebackOptions.requestId` | none dedicated | `npx tsc --noEmit`; existing jest suite | Header propagation confirmed by code inspection | 2026-08-05 | This engagement | No live trace-visualization/APM dashboard - correlation only |
| IG.12 | Sanitization of computing resources on exit | none (doc-only) | none | `docs/exit-plan.md` | none | Manual doc review | 2026-08-05 | This engagement | No live exit rehearsal performed |
| IS.01 | ISMS documentation | none (doc-only) | none | `docs/information-security-management-system.md` | none | Manual doc review | 2026-08-05 | This engagement | Not formally approved by an external ISMS body |
| IS.30 | Data management policy | none (doc-only) | none | `docs/data-management-policy.md` | none | Manual doc review + cross-reference to real code | 2026-08-05 | This engagement | None known |
| IS.05 / IS.23 / AR.23 | Regulatory due-diligence mapping | none (doc-only) | none | `docs/regulatory-due-diligence-mapping.md` | none | Manual doc review | 2026-08-05 | This engagement | Internal self-benchmarking, not externally audited |
| HR.03 | Employment-termination procedure | `setDirectoryStatusForEmployee()`, `revokeSessionsForUser()` (grep-confirmed real function names) | none | `docs/hr-access-termination-procedure.md` | Existing jest suite | Cross-checked against real exported function names | 2026-08-05 | This engagement | None known |
| RM.03 / RM.04 / RM.05 / RM.06 | Risk-register review cadence | none (doc-only) | none | `docs/risk-register-2026-08-04.md` §"Review cadence" | none | Manual doc review, real next-review date set (2026-11-04) | 2026-08-05 | This engagement | Cadence commitment not yet exercised (first review not due until 2026-11-04) |

## Batch 2 closures (2026-08-05) - Cloud CSQ governance/documentation

| Requirement ID | Control | Code/config reference | Document reference | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|---|
| IG.14 | Tenant-isolation as leakage-prevention control | `src/services/tenantScope.ts` | `docs/data-management-policy.md` §1 | 2026-08-05 | This engagement | No separate dedicated DLP/extrusion-prevention tool exists |
| IS.06 | Infrastructure baseline (shared-responsibility mapping) | `terraform/main.tf` | `docs/cloud-shared-responsibility-matrix.md` | 2026-08-05 | This engagement | Hypervisor/OS layers are GCP-managed, not separately baselined by IST Health |
| IS.38 | Key/secret rotation-reminder procedure | `terraform/main.tf:81-149` | `docs/key-management-procedure.md` | 2026-08-05 | This engagement | Encryption-key management proper (CMEK) remains GCP-managed; first rotation reminder not yet observed (due 2026-11-02) |
| IS.65 | Access restriction/logging (app + infra split) | `src/services/securityAdmin.ts` | `docs/cloud-shared-responsibility-matrix.md` | 2026-08-05 | This engagement | Infra-level log review process not independently exercised by IST Health |
| SD.01 | Management authorization via PR review + CI gate | `.github/workflows/ci.yml` | `docs/change-management-policy.md` §6 | 2026-08-05 | This engagement | No formal acquisition process exists (not applicable - nothing is externally acquired) |
| SD.03 | QA process documentation | CI pipeline (typecheck/test/audit/SBOM/canary) | `docs/change-management-policy.md` §7 | 2026-08-05 | This engagement | None known |
| SD.04 | Quality-standard enforcement | Same as SD.03 | `docs/change-management-policy.md` §7 | 2026-08-05 | This engagement | None known |

**Also corrected 2026-08-05**: IS.61 (privacy-breach monitoring) was
implemented in code during the 2026-08-05 engineering batch and marked
closed in the backlog tracker at the time, but the questionnaire xlsx
itself was never actually updated - a real process gap, found and fixed
during Batch 2 preparation. See `docs/qr-questionnaire-backlog-tracker.md`
for the correction note.

## Batch 3 closures (2026-08-05) - Cloud CSQ logging/data-segregation/patching

| Requirement ID | Control | Code/config reference | Document reference | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|---|
| IG.13 | Synthetic-only non-production data | `python/generate_synthetic_pdp_data.py`, `python/test_synthetic_pdp_generator.py` | `docs/data-management-policy.md` | 2026-08-05 | This engagement | None known |
| IS.18 | Remediation + certification actions recorded | `PATCH /api/v1/admin/users/:id/status` | `docs/entitlement-reporting-procedure.md` | 2026-08-05 | This engagement | Human-judgment case remains manual by design (correct, not a gap) |
| IS.42 | Rapid-patch capability | CI dependency-audit + Dependabot | `docs/change-management-policy.md` §5 | 2026-08-05 | This engagement | OS/hypervisor layers are Google-managed, out of this team's scope |
| IS.51 | Incident isolation to specific tenants | `organizationId`-scoped `AuditEvent` | `docs/data-management-policy.md` | 2026-08-05 | This engagement | No dedicated per-customer incident-isolation tool, tracing is via existing audit query |
| IS.58 | Customer-facing data-usage statement | none (doc-only) | `docs/customer-data-usage-statement.md` | 2026-08-05 | This engagement | Not a substitute for a formal negotiated DPA |
| RM.13 | BCP/DR plan sharing | none (doc-only) | `docs/dr-failover-runbook.md` | 2026-08-05 | This engagement | Plan is real but not yet rehearsed (separate, still-open gap: DR.05/RM.05) |

## Batch 4 (2026-08-05) - AI tab mandatory rows

| Requirement ID | Control | Evidence | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|
| AI/NFR-023 | Continuous security-finding monitoring + remediation SLA | CodeQL (`.github/workflows/codeql.yml`), `pnpm audit` CI gate, Dependabot (`.github/dependabot.yml`), DAST probe (`scripts/dastProbe.mjs`), remediation timeframes (`docs/change-management-policy.md` §5) | 2026-08-05 | This engagement | None known |

**Reviewed, retained Partial** (5 of 6 mandatory AI rows): AI/NFR-004
(PII-in-logs - no comprehensive scrubbing audit across all logging
surfaces), AI/NFR-014 (WAF/Cloud Armor - real infra migration required),
AI/NFR-016 (secrets vault - demo environment still has a known, deferred
plaintext-secret gap, R-11, requiring explicit go-ahead to touch
production), AI/NFR-040 (hallucination incident response - refined for
precision after directly verifying no live generative-model component
exists anywhere in this repo; a real forward-commitment section added to
`docs/incident-response-plan.md`, not closed to Yes since no live model
exists to have built a real incident procedure for yet), AI/NFR-041
(SOC 2/ISO certification - external-audit dependency, unchanged).

**Central integrity finding this batch**: verified directly (not
assumed) that despite real Prisma schema (`RagRetrievalEvent`,
`LlmShadowSuggestion`, `ModelEvaluationRun`, `SafetyBlockedOutput`) and
descriptive documentation (`src/services/helpLibraryTechnicalContent.ts`)
describing a planned "RAG Shadow / MedGemma" initiative, **no live
generative AI/LLM code path exists anywhere in this system today** - no
LLM client dependency in `package.json`, zero real code readers/writers
of those Prisma models, and `src/services/simulationEngine.ts` confirmed
fully deterministic (rule-based `evaluateAviationRules`/
`calculateTriageScore`), emitting only synthetic, explicitly-labeled
non-clinical training data for a future initiative.

## Batch 6 (2026-08-05) - independent re-verification of 23 "existing control" rows, 5 closed

| Requirement ID | Control | Code/config/test reference | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|
| NFR-027 | IP allowlisting capability | `src/middleware/ipAllowlist.ts`, `tests/ipAllowlist.test.ts` (5 tests) | 2026-08-05 | This engagement | QR's specific IP range not yet configured (deployment step, not a capability gap) |
| IG.07 | Uniform data protection | `docs/data-management-policy.md` (tenant isolation, audit logging, RBAC) | 2026-08-05 | This engagement | No additive tiered-classification scheme exists (not required by the literal question) |
| AR.10 | Input/output integrity (Zod) | 16 route files under `src/routes/*.ts`, including `emr.ts`, `hrms.ts`, `callCenterGateway.ts` | 2026-08-05 | This engagement | None known |
| AR.15 | Network perimeter protection | `src/app.ts` (`isAllowedOriginForRequest`, CORS), Cloud Run ingress, `src/middleware/ipAllowlist.ts` | 2026-08-05 | This engagement | No dedicated commercial IPS/WAF (not required by the literal question) |
| AR.16 | Strong encryption, no vendor defaults | `src/app.ts:140-153` (Helmet CSP), `docs/key-management-procedure.md` (Secret Manager, generated credentials) | 2026-08-05 | This engagement | None known |

**18 of the 23 candidate rows reviewed and retained Partial/No** with no
contradictory evidence found (each has a genuine, real gap - see
`docs/qr-questionnaire-backlog-tracker.md`'s Batch 6 entry for the full
list and reasoning per row). **No integrity discrepancies found this
sub-batch.**

## Monthly SLI reporting - NFR-123 real closure, NFR-189 real progress (2026-08-05)

| Requirement ID | Control | Code/config reference | Test reference | Operational evidence | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|---|---|
| NFR-123 | Real monthly SLI/SLO report + email capability | `src/services/sliReportService.ts`, `src/scripts/generateMonthlySliReport.ts`, `terraform/main.tf` (`generate_monthly_sli_report` job + `monthly_sli_report_trigger` scheduler) | `tests/sliReportService.test.ts` (15 tests) | Real `gcloud run jobs execute --wait` run, `exit(0)`, all 4 SLIs returned with complete data | 2026-08-05 | This engagement | None known for the capability itself |
| NFR-189 | SLIs/SLOs monitored (all 4, real data) | Same as above | Same as above | Same real execution: 100.00% availability, 67.81ms p95 latency, 0.03% error rate, 56.00% saturation, all PASS | 2026-08-05 | This engagement | "Reported monthly **to Qatar Airways**" specifically not yet demonstrated - no real QR recipient/live email secrets configured (by design, no customer email hardcoded) |

**Integrity note**: NFR-123 was previously marked "Yes" citing
`scripts/generateMonthlySliReport.mjs`, which was real but incomplete
(only queried 2 of 4 SLIs, computed no SLO pass/fail verdict, had no
audit trail or idempotency). The row's status (Yes) did not change as a
result of this batch, but the *evidence backing that Yes* was
substantially incomplete before this pass and is now genuinely accurate
- not counted as a new closure in the register's totals since the bucket
value was already "Yes," but flagged here for transparency.

## Performance follow-up: NFR-138/NFR-152 real closure (2026-08-05)

| Requirement ID | Control | Evidence | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|
| NFR-138 | 3s p95 response time | 4 missing DB migrations found and applied to live soc2 (`npx prisma migrate deploy`); queue-list p95 3105ms -> 446-569ms | 2026-08-05 | This engagement | NFR-156 (capacity planning/soak testing) remains separately open |
| NFR-152 | Scalability SLA | Same evidence | 2026-08-05 | This engagement | Same |

## Capacity planning/soak testing: NFR-156 real evidence (2026-08-05)

| Requirement ID | Control | Evidence | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|
| NFR-156 | Capacity planning / sustained-load validation | Multi-tier load test (10/25/50 concurrent users, 6 distinct real accounts, ~3s think time) plus a 20-minute sustained-load run against `triagedsoc2.irisstar.tech`, with real Cloud Monitoring evidence: Cloud Run instance count/CPU/memory and Cloud SQL CPU/connections/disk utilization all flat throughout the soak window and a ~7-minute post-load recovery period; zero 5xx across every tier and the soak (3,609/3,609 soak requests succeeded). See `docs/performance/nfr-156-capacity-plan.md`. | 2026-08-05 | This engagement | Validated only up to 25 concurrent users - tier 50 was constrained by the 6-account test pool hitting the NFR-047 rate limiter, not infrastructure. Still open: Qatar Airways' actual peak-load projection, a 60+ minute soak (this pass ran 20 minutes), and write-path/tenant-isolation/audit-write validation under load (this pass tested reads only) |

**Major integrity finding this pass**: 4 real database migrations
(`add_user_feedback`, `add_role_permission_overrides`,
`add_user_mfa_credential`, `add_queue_item_soft_delete`) were committed
to source control but **never applied to the live soc2 database** -
confirmed directly via live Cloud Run error logs
("`The column triage_queue_items.deleted_at does not exist`") and
`npx prisma migrate status`. This was the real dominant cause of the
queue-list endpoint's performance regression, not primarily the
connection-pool sizing addressed in the earlier performance batch.
Fixed via a real `prisma migrate deploy` against the live database.

**Follow-up correction (2026-08-05, later)**: the "cross-instance
cookie-session lookup" item above was investigated as its own dedicated
task. It is **not an application defect** - direct testing proved the
session-store, hashing, lookup, and cross-instance DB-fallback logic are
all already correct. The real cause is that Firebase Hosting's `run`
rewrite proxy (fronting `triagedsoc2.irisstar.tech`) does not forward
the `Cookie` header to Cloud Run - confirmed by testing the same cookie
directly against the Cloud Run service's own URL, where it worked. The
frontend already mitigates this for all real users
(`installBearerTokenFetch()`, `frontend/src/main.tsx:9`). No code
changed; no questionnaire row is affected. Full write-up:
`docs/architecture/session-authentication-cross-instance.md`.

## Everything else scored "Yes" (94 rows, prior to Batch 1/2/3/4)

Sourced from earlier passes of this same engagement (prior to 2026-08-05).
Each has an `Evidence Location` value in `master-compliance-register.csv`
pulled directly from the questionnaire's own Remarks column - these are
real citations (specific files, docs, or test names) written at the time
each row was originally closed, not re-verified independently in this
pass. Per Stage 2 of the compliance program, these should be re-confirmed
against current code before being relied upon in a future audit - flagged
here rather than silently assumed still accurate.

## Batch 7A - integrity normalization (2026-08-05)

Following a reconciliation review of `mandatory-action-register.md`
(which found IG.09 genuinely omitted and two count-column typos, but
no true duplicate row), a controlled normalization batch was run
directly against the live workbook:

| ID | Change | Evidence basis |
|---|---|---|
| PA.03 | "Yes (inherited)" -> "Yes" | Google Cloud Trust Center SOC 2 Type II / ISO 27001 attestation, physical perimeter security |
| DR.06 | "Yes (inherited)" -> "Yes" | Same, physical-disaster protection |
| DR.07 | "Yes (inherited)" -> "Yes" | Same, power/network redundancy |
| AR.19 | "Yes (inherited)" -> "Yes" | Same, NTP/time sync, corroborated by this engagement's own consistent audit-trail timestamps |
| NFR-064 | "No" -> "N/A" | Corrected an internal inconsistency (remark already said "Not applicable," cell read "No") |
| IS.41 | "No" -> "N/A" | Verified via GCP's published shared-responsibility model for serverless/PaaS - OS-layer scanning is Google's contractual responsibility |
| IS.73 | "No" -> "N/A" | Same shared-responsibility verification, hypervisor layer |
| SD.06 | "No" -> "N/A" | Ephemeral/immutable Cloud Run images, no persistent install surface; real supply-chain analog (SBOM/dependency scanning) already covered elsewhere |

No requirement text or Mandatory flag was changed for any row - only
the Compliance and Remarks cells, and only after individual
verification per row (not a blanket conversion). Two rows (IS.11,
AR.17) were reviewed under the same rigor and **deliberately not**
reclassified to N/A - see `mandatory-action-register.md` for why.
Recomputed mandatory compliance: 77/149 = 51.7% (see
`management-summary.md` for the full before/after breakdown, with
response-normalization and N/A-reclassification effects reported
separately - zero genuine new engineering compliance closures this
batch).
