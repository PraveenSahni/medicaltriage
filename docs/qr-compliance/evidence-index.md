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

## Batch 7B - AR.13 real MFA-mandatory enforcement mechanism (2026-08-05)

| Requirement ID | Control | Code reference | Config reference | Test reference | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|---|---|
| AR.13 | Org-wide MFA enforcement capability | `src/services/securityAdmin.ts` (`authenticateLocal()`, `isMfaMandatory()` gate) | `src/config/runtime.ts` (`MFA_MANDATORY` env flag, default off) | `tests/mfaVerification.test.ts` (3 new tests: blocks non-enrolled, allows enrolled, default unchanged) | 2026-08-05 | This engagement | Flag defaults off - enabling it for a live environment is an operator rollout decision (would lock out unenrolled users), not yet done for any real environment |

## AR.13 production-activation validation (2026-08-05)

| Requirement ID | Control | Code reference | Config reference | Test/validation reference | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|---|---|
| AR.13 | Org-wide MFA enforcement, cross-instance correctness | `src/services/securityAdmin.ts` (`resolveMfaCredential()`), `src/services/persistence.ts` (`getPersistedMfaCredential()`) | `src/config/runtime.ts` (`MFA_DB_PERSISTENCE`, `MFA_MANDATORY`) | Live canary validation against `ist-triage-soc2` (real enrolled admin+nurse via real API, real Postgres row confirmed, cross-revision recognition confirmed); `tests/mfaVerification.test.ts` unchanged (710/710 passing) | 2026-08-05 | This engagement | Not cut over to live traffic - only 2 of ~19 real accounts enrolled, no self-service enrollment path once locked out (genuine, disclosed gap) |

**Secondary finding (not an AR.13 evidence item, flagged for a future
batch)**: `persistSecurityAuditEvent` shares the same `MOCK_MODE`-gating
defect as MFA credentials did - AuditEvent rows have never persisted
to the real soc2 Postgres database. Every row citing "AuditEvent" DB
evidence on soc2 should be re-verified once this is fixed.

## Priority-0 audit-integrity remediation: durable AuditEvent persistence (2026-08-05)

**Root cause** (found during AR.13 canary validation): `persistSecurityAuditEvent`/
`listPersistedAuditEvents` were gated by `shouldUseDatabasePersistence()`,
which returns false whenever `MOCK_MODE=true` - true on live soc2. Every
security AuditEvent (login, MFA, PAM elevation, access denial) was
therefore held only in one Cloud Run instance's memory, never durably
written to the real database, despite this engagement having repeatedly
cited "AuditEvent" DB rows as evidence for several mandatory rows.

**Fix**: dedicated `AUDIT_EVENT_DB_PERSISTENCE` flag
(`src/config/runtime.ts`), independent of `MOCK_MODE`, wired into both
functions. Added a missing `LOGIN_MFA_FAILED` audit event (a real,
separate coverage gap found during validation - wrong-code MFA
verification previously wrote no audit event at all). Added 3 new
Prisma indexes (`organization+timestamp`, `action+timestamp`,
`riskLevel+timestamp`) via migration
`20260805152719_add_audit_event_query_indexes`, applied to the real
soc2 database. Extended `listPersistedAuditEvents()`'s filter to
support `organization`/`action`, not just `userId`.

**Validated**: on `--no-traffic` canaries first (two different
revisions both wrote to, and correctly read from, the same database -
proving cross-instance durability), then **cut over to live traffic**
(low risk - purely additive persistence, no user-facing behavior
change, unlike AR.13's `MFA_MANDATORY`). A real failed-login attempt
against `https://triagedsoc2.irisstar.tech` (the live, 100%-traffic
URL) was confirmed as a real row in the actual Postgres database.

**Compliance implication, disclosed rather than silently assumed**:
several mandatory rows already marked "Yes" (e.g. NFR-010 "DML audit
completeness", IS.61 "privacy-breach anomaly detection", IS.51
"incident isolation to tenants", HR.03) cited real `AuditEvent`-writing
*code* as evidence - that code was, and remains, real and correct. What
was NOT true until this fix is that those writes actually landed
durably in the live soc2 database. **No compliance percentage changes
as a result of this finding** - the rows' underlying code-level
evidence was never inaccurate, only its live-environment durability.
A full re-verification pass of every row citing AuditEvent DB evidence
is recommended as follow-up, not performed exhaustively in this batch.

## Persistence-gating integrity sweep - role-permission and reveal-workflow cross-instance fixes (2026-08-05)

| Control | Code reference | Config | Test reference | Validation date | Validator | Remaining limitation |
|---|---|---|---|---|---|---|
| Role-permission override cross-instance visibility (NFR-030/031/032) | `getPersistedRolePermissionOverrides()`, `hydrateRolePermissionOverridesFromDatabase()` (`src/services/securityAdmin.ts`, `src/index.ts`) | `ROLE_PERMISSION_DB_PERSISTENCE` | `tests/persistenceGatingCrossInstance.test.ts` + real cross-process DB proof | 2026-08-05 | This engagement | A grant/revoke made while another instance is already running requires that instance to restart to see it - no periodic refresh built |
| Reveal-request cross-instance visibility (R-04) | `getPersistedRevealRequest()` (`src/services/persistence.ts`), wired into `decideReveal()`/`fetchApprovedRevealValue()` | `REVEAL_WORKFLOW_DB_PERSISTENCE` | Same | 2026-08-05 | This engagement | The approved plaintext value itself remains intentionally never persisted - a third instance that never processed the approval cannot serve it |
| Session revocation flag bugfix (NFR-021) | `revokePersistedSessionsForUser()` now checks `shouldPersistSessionsInDatabase()` | Uses existing `SESSION_DB_PERSISTENCE` | Same | 2026-08-05 | This engagement | None known |

See `docs/operations/persistence-gating-inventory.md` for the complete
inventory of all `shouldUseDatabasePersistence()` call sites, including
those confirmed already correct (queue, retention, legal hold) and
those deferred (SSO config, CCP drafts, webhook records).

## IS.61 - shared reveal-anomaly detection (2026-08-05) - value corrected DOWN

| Control | Code reference | Config | Migration | Test reference | Validation date | Validator | Status |
|---|---|---|---|---|---|---|---|
| Multi-instance reveal-anomaly detection | `recordAndCountRevealAnomalyEvents()` (`src/services/persistence.ts`), `checkRevealAnomalyRate()` (`src/services/securityAdmin.ts`) | `REVEAL_ANOMALY_DB_PERSISTENCE`, `REVEAL_ANOMALY_WINDOW_SECONDS`, `REVEAL_ANOMALY_THRESHOLD` | `20260805161509_add_reveal_anomaly_events` | `tests/revealAnomalySharedCounter.test.ts` + real cross-process DB proof | 2026-08-05 | This engagement | **Partial (corrected from Yes)** - detection is real and multi-instance-safe; customer notification (the row's other literal requirement) is entirely unbuilt |

See `docs/security/reveal-anomaly-detection.md` for the full
architecture, failure policy, and the honest rationale for correcting
this row's value downward rather than treating the multi-instance fix
as sufficient for a full "Yes."

## IS.61 customer-notification workflow (2026-08-05) - still Partial

| Control | Code reference | Config | Migration | Test reference | Validation date | Validator | Status |
|---|---|---|---|---|---|---|---|
| Privacy-incident notification workflow (detection -> review -> classification -> decision -> approval -> dry-run delivery) | `src/services/privacyIncidentWorkflow.ts` | `PRIVACY_NOTIFICATION_ENABLED`, `PRIVACY_NOTIFICATION_DRY_RUN`, `PRIVACY_NOTIFICATION_SLA_HOURS`, `PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS`, `PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS` | `20260805170935_add_privacy_incident_workflow` | `tests/privacyIncidentWorkflow.test.ts` (10 tests) + real cross-process Postgres validation | 2026-08-05 | This engagement | **Partial (unchanged)** - workflow operational in dry-run/internal-test mode only; no real customer notification sent, no SLA/template/QR-recipient approval exists |

See `docs/security/privacy-incident-notification-procedure.md`,
`docs/security/privacy-incident-notification-template.md`, and
`docs/operations/privacy-notification-runbook.md` for full detail.

## NFR-015 - accessibility redeployment + validation (2026-08-05, Batch 6) - retained Partial

Redeployed `ist-triage-soc2` with the current source (already-committed
`--muted` color-contrast and `.smb-board` keyboard-focusability fixes),
confirmed via a real 5-page/persona axe-core audit: 0 violations on
both the `--no-traffic` canary and, after fixing a newly-found Firebase
Hosting CDN cache-invalidation gap, the live production custom domain.
A new, real, unresolved Focus Visible (WCAG 2.1 SC 2.4.7) defect was
found via manual keyboard testing and is not yet fixed. Full detail:
`docs/accessibility/accessibility-validation-report.md`,
`docs/accessibility/manual-accessibility-checklist.md`,
`docs/accessibility/accessibility-known-limitations.md`. **NFR-015
retained Partial** - a materially stronger, current-build Partial than
before, but not Yes given the open Focus Visible defect. No compliance
percentage change from this batch (Partial to Partial).

## NFR-015 - Focus Visible defect fixed (2026-08-05, Batch 7) - retained Partial

Root-caused and fixed the WCAG 2.1 SC 2.4.7 Focus Visible defect from
Batch 6: an app-wide `box-shadow: none !important` specificity-
escalation reset in `global.css` was silently suppressing the focus
ring. Fixed via `outline` (a property that reset does not touch),
deployed to `ist-triage-soc2-00049-tuv` (100% traffic), and verified
live via real keyboard testing on production. Also found and fixed a
second, distinct, real deployment gap: Firebase Hosting's static
`dist-web` upload is independent of the Cloud Run image and must be
rebuilt (`npm run build:web`) before each `firebase deploy --only
hosting:soc2`, or the custom domain silently serves a stale bundle.
Full detail: `docs/accessibility/accessibility-known-limitations.md`.
**NFR-015 retained Partial** - the known defect is closed, but several
required manual checks (modal, zoom, session-timeout, destructive-
action, screen-reader) remain unperformed. No compliance percentage
change from this batch.

## NFR-015 - final manual accessibility validation (2026-08-05, Batch 8) - retained Partial

Completed the manual accessibility checklist for NFR-015. Fixed and
deployed 3 real defects: modal focus management on the Service Manager
Board's call-detail drawer (`role="dialog"`, `aria-modal`, focus trap,
focus restoration - 2 new regression tests added), a missing viewport
meta tag on the unauthenticated `/help` fallback page, and an
unwrapped top-action bar causing 320px reflow overflow on the Service
Manager Board. All verified live on production
(`ist-triage-soc2-00051-nec`). Found and left unfixed (out of scope,
disclosed as a real defect): the Nurse Cockpit's fixed 3-column layout
is not mobile-responsive. Confirmed session-timeout has no accessible
warning (not implemented) and no real screen-reader testing is
available in this environment. Full detail:
`docs/accessibility/accessibility-validation-report.md`,
`docs/accessibility/accessibility-known-limitations.md`. **NFR-015
retained Partial** - the Cockpit responsiveness gap and missing
screen-reader validation are the two remaining material blockers to
Yes. No compliance percentage change from this batch.
