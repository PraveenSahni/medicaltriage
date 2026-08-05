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

## Everything else scored "Yes" (94 rows)

Sourced from earlier passes of this same engagement (prior to 2026-08-05).
Each has an `Evidence Location` value in `master-compliance-register.csv`
pulled directly from the questionnaire's own Remarks column - these are
real citations (specific files, docs, or test names) written at the time
each row was originally closed, not re-verified independently in this
pass. Per Stage 2 of the compliance program, these should be re-confirmed
against current code before being relied upon in a future audit - flagged
here rather than silently assumed still accurate.
