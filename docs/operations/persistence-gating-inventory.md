# Persistence-Gating Integrity Sweep

_Written 2026-08-05, following the AR.13/AuditEvent Priority-0
remediations. Full inventory of every `shouldUseDatabasePersistence()`
(and related dedicated-flag) call site, its actual soc2 risk, and
what was fixed vs. deferred in this pass._

## Phase 1/2 - Inventory and classification

| File / function | Data / control | In-memory behavior | DB write (soc2, before this batch) | DB read | Existing flag | soc2 config | Multi-instance risk | Restart risk | Compliance rows affected | Classification | Action this batch |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `queueOrchestration.ts` - triage queue CRUD | Queue items | N/A - reads/writes DB directly when flag on | Real (`QUEUE_DB_PERSISTENCE=true` already set on soc2, independent of `MOCK_MODE`) | Real | `QUEUE_DB_PERSISTENCE` (already dedicated) | **On** | None - already correct | None - already correct | NFR-011, CO.13/LG.04 | 2 (durable in prod-like, mockable in tests) | None needed - already correctly gated |
| `queueOrchestration.ts` - soft delete (`deletedAt`) | Queue soft-delete | Same as above - part of the same real DB row | Real | Real | `QUEUE_DB_PERSISTENCE` | **On** | None | None | NFR-011 | 2 | None needed |
| `purgeExpiredQueueData.ts` / `fulfillPrivacyRequests.ts` | Retention execution, legal-hold enforcement, DSAR erasure | N/A - dedicated `PrismaClient`, run as separate Cloud Run Jobs | Real - these scripts never went through `shouldUseDatabasePersistence()` at all | Real | None needed - separate job client | Jobs run on schedule, unaffected by web-service `MOCK_MODE` | None | None | IG.09 (retention decision pending, separate), RM.13, IS.54 | 1 (must always be durable) - already durable | None needed |
| `securityAdmin.ts` legal hold creation | Legal hold (create) | **No web-service route creates a `LegalHold` row at all** - confirmed via grep, no `prisma.legalHold.create` call site in `src/routes/*.ts` or `securityAdmin.ts` | N/A - no code path exists | N/A | N/A | N/A | N/A - nothing to be inconsistent | N/A | IS.54 | 7 (requires a decision - a real creation UI/API doesn't exist yet, separate gap from persistence-gating) | Documented as a real, separate gap - not a `MOCK_MODE` bug, out of scope for this sweep |
| `persistence.ts:persistRolePermissionOverride` / `securityAdmin.ts` grant/revoke | Role-permission overrides | `rolePermissionOverrides` in-memory array, authoritative for `roleByCode()`'s permission resolution at every login | Was a no-op (`shouldUseDatabasePersistence()` false under `MOCK_MODE`) | **No read-fallback existed at all** (same missing-read-path class of bug as MFA before its fix) | None (shared generic gate) | Off (generic gate always false on soc2) | **Real**: a grant/revoke on one instance never became visible on another - a genuine authorization-bypass risk, not just a compliance-evidence gap | Real - lost on restart | NFR-030/031/032 (Admin RBAC) | **6 (incorrectly coupled to MOCK_MODE)** | **Fixed this batch** - dedicated flag + read-fallback |
| `persistence.ts:persistRevealRequest/Approval/Event` / `securityAdmin.ts` reveal workflow | Privileged PII reveal (request/approve/fetch) | `revealRequestsById` in-memory `Map`, authoritative | Was a no-op | **No read-fallback existed at all** | None (shared generic gate) | Off | **Real**: a reveal request created on one instance is invisible to an approver's request landing on a different instance - a functional failure, not just an evidence gap, given this is a 2-step, 2-actor workflow across separate HTTP requests | Real - lost on restart | R-04, privacy/reveal rows | **6** | **Fixed this batch** - dedicated flag + read-fallback |
| `securityAdmin.ts:checkRevealAnomalyRate` | Reveal-request anomaly counter (5-min window, threshold 10) | `revealRequestTimestampsByUser` in-memory `Map`, **no DB backing of any kind, not even best-effort** | N/A - never persisted | N/A | None | N/A | **Real**: the counter is inherently per-instance; a requester hitting different Cloud Run instances could distribute requests to stay under the per-instance threshold, defeating org-wide detection | Real - resets on restart | IS.61 | 5 (best-effort evidence only, and currently overstated in scope) | **Remark corrected this batch** (not re-architected - see "Deferred" below) |
| `persistence.ts:getAuthenticationProviderConfig` | Real OIDC/SSO provider config (`AuthenticationProvider` table) | N/A - read-only lookup | N/A (read-only) | Was a no-op read | None (shared generic gate) | Off | Low - this is a rarely-changing config row, not per-request state; a stale/missing read just means SSO config isn't found, a visible failure, not a silent security gap | Low | NFR-016/022 (SSO) | 6, but low real-world impact given SSO isn't yet connected to a real IdP tenant | Deferred - flagged, not fixed (SSO not yet live) |
| `persistence.ts:persistCcpOutboundDraft/getPersisted.../listPersisted...` | Call-center-platform outbound message drafts | In-memory-first with best-effort persist | Was a no-op | Was a no-op | None (shared generic gate) | Off | Medium - a draft created on one instance invisible on another until sent; not a compliance-evidence control, a UX/workflow correctness issue | Real | None identified | 6, but not compliance-evidence-bearing | Deferred - flagged for a future batch, not security/compliance-critical |
| `persistence.ts:persistInboundWebhookRecord/listPersisted...` | Inbound webhook records (Twilio/etc.) | In-memory-first with best-effort persist | Was a no-op | Was a no-op | None (shared generic gate) | Off | Medium - a webhook record's durability affects debugging/replay, not an authorization or compliance-evidence control | Real | None identified | 6, but not compliance-evidence-bearing | Deferred |
| `persistence.ts:persistEvaluatedEncounter` | Aviation-triage-encounter evaluation snapshot | Write-through to `AviationTriageEncounter` | Was a no-op | N/A (write path) | None (shared generic gate) | Off | **Real, but already covered**: this writes the same `AviationTriageEncounter` row the queue-completion flow also writes via `QUEUE_DB_PERSISTENCE`-gated code - confirmed this specific call site is a secondary/redundant write, not the sole source of truth for the encounter record | Real for this specific write, but not for the encounter as a whole | None identified as solely dependent on this path | 6, lower severity given redundancy | Deferred - flagged, not fixed (needs its own investigation to confirm no unique data is lost) |
| `persistence.ts:persistCompletedTriageNote` | Completed SBAR/SOAP note snapshot | Write-through | Was a no-op | N/A (write path) | None (shared generic gate) | Off | Same redundancy caveat as evaluated-encounter above | Real for this path | None identified as solely dependent | 6, lower severity | Deferred - flagged |
| `revokePersistedSessionsForUser` | Session revocation on account-status change | Iterates in-memory `sessions` map (already real/durable via the fixed `SESSION_DB_PERSISTENCE`), additionally attempts a DB-side revoke | Was a no-op for the DB-side revoke specifically | N/A (write path) | `shouldUseDatabasePersistence()` (generic gate) - **should be `shouldPersistSessionsInDatabase()`, a bug found in this sweep** | Off (wrong flag checked) | **Real**: with `SESSION_DB_PERSISTENCE=true` already on soc2, session revocation on account suspension was silently NOT reaching the database, even though session creation/lookup already correctly uses the dedicated flag - an inconsistent pair | Real | NFR-021 (session termination), account-suspension security control | **6 - a real bug, the gate function itself was wrong** | **Fixed this batch** |
| `persistence.ts` MFA / AuditEvent / Sessions | (already fixed in prior batches) | - | - | - | `MFA_DB_PERSISTENCE`, `AUDIT_EVENT_DB_PERSISTENCE`, `SESSION_DB_PERSISTENCE` | **On** (soc2, live) | Fixed | Fixed | AR.13, NFR-010, IS.61, IS.51 | 2 | Already resolved |

## Priority findings (A-E, per the review's own structure)

**A. Legal holds - no real gap found.** No web-service code path
creates a `LegalHold` row at all; the two Cloud Run Jobs that *read*
active holds (`purgeExpiredQueueData.ts`, `fulfillPrivacyRequests.ts`)
use their own dedicated `PrismaClient`, never gated by
`shouldUseDatabasePersistence()`/`MOCK_MODE` - already durable, already
cross-process-consistent (both jobs and any future creation path would
read/write the same real table). The real gap is that **no
UI/API creates a legal hold today** - a feature-completeness gap, not
a persistence-gating bug, out of this sweep's scope.

**B. Retention policy and purge state - no real gap found.** Same
dedicated-job-client pattern as legal holds; `RetentionPolicy` already
has 1 real row in the soc2 database (the `TriageQueueItem`/`COMPLETED`
policy). Execution history/failure recording exists via the job's own
audit-event writes (`recordJobAuditEvent`), independent of the web-
service bug class. IG.09 remains the correct, separate, still-open
blocker for extending retention to more entity types - not touched by
this sweep, per explicit instruction not to invent a retention period.

**C. Queue and soft-delete state - no real gap found.** Already
correctly using its own dedicated `QUEUE_DB_PERSISTENCE` flag,
confirmed set on soc2, confirmed independent of `MOCK_MODE`.

**D. Reveal workflow and anomaly controls - 2 real gaps found and
addressed.** (1) Reveal request/approval/event persistence was a
silent no-op with no cross-instance read-fallback - **fixed**. (2) The
anomaly counter is genuinely process-local with no DB backing at all -
**not re-architected in this pass** (would need a new durable
windowed-counter table or a shared cache, a larger change than this
sweep's budget), but **IS.61's remark is corrected** to state this
scope limitation honestly rather than implying org-wide detection.

**E. Role-permission overrides - 1 real gap found and fixed.** Same
missing-read-fallback pattern as MFA before its fix - a genuine
authorization-bypass risk in a multi-instance deployment, now closed.

## What changed this batch

1. New flags (`src/config/runtime.ts`): `ROLE_PERMISSION_DB_PERSISTENCE`,
   `REVEAL_WORKFLOW_DB_PERSISTENCE`.
2. New read-fallback functions (`src/services/persistence.ts`):
   `getPersistedRolePermissionOverrides(roleCode)`,
   `getPersistedRevealRequest(revealRequestId)`, wired into
   `securityAdmin.ts`'s `roleByCode()` permission resolution and the
   reveal-workflow's `decideReveal()`/`fetchApprovedRevealValue()`
   read sites, mirroring `resolveMfaCredential()`'s exact pattern.
3. Fixed `revokePersistedSessionsForUser()` to check
   `shouldPersistSessionsInDatabase()` instead of the generic
   `shouldUseDatabasePersistence()` - a real, separate bug where
   session *creation* used the correct dedicated flag but session
   *revocation* checked the wrong one.
4. Corrected IS.61's remark to disclose the anomaly counter's
   process-local scope honestly.
5. Deferred, explicitly flagged, not fixed this pass: SSO provider
   config read, CCP outbound drafts, inbound webhook records,
   evaluated-encounter/completed-triage-note secondary writes - none
   are compliance-evidence-bearing or authorization-critical in the
   way the 3 fixed items are; each is named above with its own
   recommended action for a future batch.
