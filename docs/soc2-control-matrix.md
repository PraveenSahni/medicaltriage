# SOC 2 Control Matrix (Type I Readiness Draft)

_Last updated: 2026-08-03. Wave D of the SOC 2 remediation roadmap - compiles
the evidence from Waves A-C into a control matrix mapped to the 5 Trust
Service Criteria. This is an internal readiness draft, not a certification -
see "What this document is not" below._

## How to read this matrix

Each row is a control claim with a **Status** and **Evidence** (file:line or
live-infra citation, not a description of intent). Status values:

- **Implemented** - real code/infra exists and is exercised by the test suite
  or live-verified this remediation pass.
- **Implemented, mock-mode caveat** - real code exists, but `MOCK_MODE=true`
  on both live services today means the code path has zero live behavioral
  effect until real (non-mock) persistence is enabled. Still a real fix, not
  vaporware - flagged so an auditor isn't misled about current live impact.
  The same "real code, zero live effect under MOCK_MODE" caveat applies
  wherever it's noted below.
- **Documented accepted risk** - deliberately not implemented this pass, with
  a written rationale and deferred path forward (see
  `docs/soc2-data-governance-schema-status.md`).
- **Gap** - known, not yet addressed, not yet formally accepted either.

---

## Security

| Control | Status | Evidence |
|---|---|---|
| Multi-tenant data isolation enforced at the query layer (not just in application code after fetching all rows) | **Implemented** | `tenantWhereClause()`, `src/services/queueOrchestration.ts:1330` - merged into every `findMany`/`findFirst` in `listDbRecords()`/`getDbRecord()`. Verified via `tests/multiTenantRBAC.test.ts` (part of the 586-test suite). |
| `/triage/complete` is idempotent (duplicate/retried calls cannot create duplicate clinical encounter rows) | **Implemented, mock-mode caveat** | `AviationTriageEncounter.sourceQueueItemId`, `prisma/schema.prisma:297` (unique); checked before create in `persistCompletedTriageNote` (`src/services/persistence.ts`). Verified via a direct 3x-duplicate-call DB simulation producing exactly 1 row. Zero live effect while `MOCK_MODE=true`. |
| Container runs as a non-root user | **Implemented** | `Dockerfile:53` (`USER node`, the base image's built-in UID 1000); verified via a real write+delete queue-item operation against the non-root canary revision before cutover. |
| Dependency vulnerability scanning in CI | **Implemented, with a known backlog** | `.github/workflows/ci.yml` `dependency-audit` job (`pnpm audit --audit-level high`), `.github/dependabot.yml` (weekly npm/docker/actions updates). **3 known high-severity findings are NOT yet fixed** (`vite`, `postcss`, `brace-expansion`) - two remediation attempts this session both broke the test suite via a pre-existing `@babel/core@^8.0.1` peer-dependency conflict in the committed `package.json` baseline, and were reverted rather than shipped broken. Tracked as an explicit backlog item, not silently dropped. |
| Routine clinical queue actions (claim, disposition move, completion, deletion) generate an audit trail | **Implemented, mock-mode caveat** | `recordQueueAuditEvent()`, `src/services/queueOrchestration.ts:1290`, called from `claimQueueItem`/`moveQueueItem`/`deleteQueueItem`. Verified via a direct write against the live `ist_triage_soc2` database (schema-compatible; soc2's queue was empty at verification time, so this confirmed the write path rather than a full HTTP flow). |
| EMR/FHIR writeback generates an audit trail | **Implemented** | `recordTransmissionAudit()`, `src/integration/fhirWriteback.ts:485`; covered by `tests/fhir-writeback.test.ts`. |
| Role-based access control across the queue and admin surfaces | **Implemented** | 19-role permission module (`roles-and-permissions.md`), enforced via `requireQueueAccess`/`hasManagerControl`/`isClinicalOperator` etc. throughout `queueOrchestration.ts`; covered by `tests/adminAccessBifurcation.test.ts`, `tests/approval.test.ts`. |
| Automated uptime monitoring + alerting for both live services | **Implemented** | GCP Cloud Monitoring uptime checks `ist-triage-demo-uptime` / `ist-triage-soc2-uptime` (5-minute HTTPS polling of `/api/v1/runtime/environment`), alert policies bound to an email notification channel, firing after ~5 min of failure. See `docs/incident-response-plan.md`'s 2026-08-02 update. Still a single-email channel, not a staffed/paged rotation - see Gaps below. |
| Documented incident response process | **Implemented** | `docs/incident-response-plan.md` - severity classification, containment/eradication/recovery procedure, explicit data-breach handling notes (with an honest "notification timeline not yet confirmed with legal" flag rather than assuming GDPR defaults). |
| Automated database backups + point-in-time recovery | **Implemented** | Cloud SQL `ist-triage-postgres-uat`: daily backups (02:00 window, 7 retained) + PITR (7-day transaction log retention) - previously fully disabled, enabled this remediation pass. See `docs/backup-disaster-recovery-plan.md`. |
| Encryption/masking/reveal/key-management schema | **Documented accepted risk** | See `docs/soc2-data-governance-schema-status.md` - the Prisma models exist but no application code reads/writes them; platform-level (Cloud SQL) encryption at rest is the real control in place today. |

## Availability

| Control | Status | Evidence |
|---|---|---|
| Documented RPO/RTO per failure scenario | **Implemented** | `docs/backup-disaster-recovery-plan.md` - honest current-state table (e.g. ZONAL, not regional, availability - an accepted risk for demo/staging, explicitly flagged as needing re-review before real production PHI). |
| Uptime monitoring/alerting | **Implemented** | Same evidence as the Security-section uptime row above - listed here too since it's genuinely an Availability control, not just Security. |
| Canary-then-cutover deployment pattern (verify before full traffic cutover) | **Implemented** | Used for every deploy this remediation pass: `gcloud run deploy --no-traffic` -> tag `canary` -> health-check -> `update-traffic --to-latest`. Not yet codified as a required CI/CD gate (still a manual discipline, not an enforced pipeline step) - see Gaps. |
| Infrastructure-as-Code for reproducible recovery | **Gap** | Explicitly flagged in `docs/backup-disaster-recovery-plan.md` - Cloud Run/Cloud SQL/Firebase Hosting configuration exists only as imperative `gcloud`/`firebase` commands recorded in session history and day-handover docs, not Terraform or similar. |
| Backup restore actually tested | **Gap** | Explicitly flagged in `docs/backup-disaster-recovery-plan.md` - "backups enabled" has never been validated by an actual restore drill. |

## Processing Integrity

| Control | Status | Evidence |
|---|---|---|
| Clinical protocol content sourced from a faithfully-mirrored vendor database, not hand-authored approximations | **Implemented** | `Mdb*` Prisma models mirror the real STCC `.mdb` schema 1:1 (verified via ODBC/ADOX against the vendor file and the user's own Access Relationships diagram); `stccMdbMapper.ts` is the single shared mapping function for both file-based and DB-based content sources. |
| Staff/dependent identity validated against HRMS before a queue item is created | **Implemented** | `validateStaffMember()`/`findDependent()`/`resolvePatientAgeFromDirectory()` calls in `createQueueItem` (`src/services/queueOrchestration.ts`); a queue item cannot be created for an unvalidated identity. |
| Completed encounters lock further edits (SBAR/disposition can't be silently altered post-completion) | **Implemented** | `moveQueueItem`'s `QUEUE_ITEM_COMPLETED_LOCKED` guard (409 unless explicitly reopened); Reason for Call lock-once-Questions-answered behavior (recent commits `2828231`, `447ac39`, `394d98a`, `43387a8` - pre-dating this SOC 2 pass but part of the same processing-integrity story). |
| Automated test coverage over clinical/queue logic | **Implemented** | 586 backend tests + 52 frontend tests passing as of this pass's last full run; now gated in CI (`.github/workflows/ci.yml`). |

## Confidentiality

| Control | Status | Evidence |
|---|---|---|
| Tenant-scoped data isolation | **Implemented** | Same evidence as the Security-section tenant-isolation row - listed here too since it is fundamentally a Confidentiality control. |
| Secrets (JWT signing key, audit HMAC key) not committed to source | **Implemented, with a known gap** | Managed via GCP Secret Manager per `README.md`'s documented pattern. **Gap:** `DATABASE_URL` itself is currently a plain Cloud Run environment variable, not a Secret Manager secret, despite the README's stated intent - noted in `docs/backup-disaster-recovery-plan.md`, not yet fixed. |
| Field-level masking / controlled reveal of sensitive data | **Documented accepted risk** | `docs/soc2-data-governance-schema-status.md` - no field in either nurse UI is masked-by-default today; a nurse with queue access sees full values. |

## Privacy

| Control | Status | Evidence |
|---|---|---|
| Data-subject access/deletion request (DSAR) intake | **Documented accepted risk** | `docs/soc2-data-governance-schema-status.md` - `PrivacyRequest` table exists, unused; no in-app workflow exists. A real request today would be handled entirely outside the application. |
| Data retention/deletion policy enforcement | **Documented accepted risk** | `docs/soc2-data-governance-schema-status.md` - `RetentionPolicy`/`LegalHold` tables exist, unused; queue/encounter data persists indefinitely until manually purged. |
| Environment-level data separation (synthetic vs. real) | **Implemented** | `triaged.irisstar.tech` (`APP_DATA_PROFILE=synthetic` today, demo data only) vs. `triagedsoc2.irisstar.tech` (fully isolated Cloud SQL database, separate Cloud Run service, separate Hosting site) - the entire premise of this remediation pass's infrastructure work. |

---

## Summary: what changed this remediation pass (Waves A-C)

1. Query-level tenant isolation (previously in-memory only).
2. `/triage/complete` idempotency (previously non-idempotent by the
   developers' own code comment).
3. Non-root Docker container (previously ran as root).
4. First-ever CI pipeline: typecheck, full test suite, dependency audit gate.
5. Dependabot configured for npm/docker/actions.
6. Cloud SQL automated backups + PITR (previously fully disabled).
7. Documented incident-response plan and backup/DR plan.
8. Expanded `AuditEvent` coverage to routine queue actions (previously only
   FHIR writeback and completed-encounter persistence were audited).
9. Documented the encryption/masking/reveal/privacy/retention/legal-hold
   schema as an honest accepted risk rather than an implied-but-unenforced
   control.
10. Live uptime monitoring + email alerting for both services (previously
    zero automated detection of an outage).

All of the above (except the documentation-only items) was built and verified
against the isolated `ist-triage-soc2`/`triagedsoc2.irisstar.tech` environment
first, per the original remediation plan's explicit constraint of never
touching the live customer-facing `triaged.irisstar.tech` demo mid-pass.
**None of these fixes have yet been promoted to `triaged.irisstar.tech`** -
that promotion is a distinct, later step, not implied by this document.

## What this document is not

- **Not a SOC 2 certification.** SOC 2 Type I/Type II reports are issued by
  an independent, accredited CPA firm after their own audit - this matrix is
  an internal self-assessment intended to make that engagement more
  efficient and its outcome more predictable, not a substitute for it.
- **Not a claim that every gap is closed.** The remaining gaps are listed
  explicitly in each section above and are real - an auditor will find them
  independently if they aren't disclosed here first.
- **Not scoped/approved by legal or a compliance officer.** Notably, the
  data-breach notification timeline (`docs/incident-response-plan.md`) and
  the overall applicability of any specific privacy regulation to this
  system's real deployment jurisdiction have not been confirmed with counsel.

## Remaining gaps (candid list, for the next remediation pass)

1. 3 known dependency vulnerabilities (`vite`, `postcss`, `brace-expansion`) -
   fix requires first resolving the pre-existing `@babel/core@^8.0.1` peer
   conflict in `package.json`, ideally in its own dedicated session given the
   demonstrated instability risk.
2. `DATABASE_URL` should move from a plain Cloud Run env var to Secret
   Manager, matching the README's already-stated intent.
3. No Infrastructure-as-Code; no backup-restore drill has ever been run.
4. Field-level masking/reveal, DSAR intake, and retention-driven deletion
   remain unimplemented (accepted risk, not silently absent - see the
   dedicated status doc).
5. On-call is a single email address, not a staffed/paged rotation.
6. Structured application logging and error-rate/latency alerting do not
   exist yet - only binary uptime is monitored.
7. Engage an accredited SOC 2 auditor for a formal Type I readiness review
   once the above is triaged and, where reasonable, addressed.
