# STCC-Compatible RAG Shadow RFI Gap Tracker

Status: Active

Last reviewed: 2026-07-17

Scope owner: Clinical Product, Clinical Governance, Data Engineering, AI/ML Engineering, and Quality Assurance

## 1. Purpose

This is the canonical tracker for the gaps identified while comparing the RFI data sheet with the IST Health STCC-Compatible RAG Shadow Architecture.

The tracker covers only:

- STCC-compatible clinical content structure and lifecycle
- reason-for-call extraction and approved search-word matching
- deterministic guideline selection support
- bounded RAG retrieval and advisory shadow suggestions
- English Voice AI collection of reason and initial-assessment responses under deterministic STCC control
- prerecorded approved clinical audio, streaming transcription, interruption handling, and nurse transcript validation
- governed MedGemma adaptation for structured language interpretation and shadow comparison
- nurse, deterministic-system, and RAG comparison evidence
- acuity-ordered questions, disposition, care advice, first aid, and references
- clinical-content governance, model evaluation, and release readiness

The tracker does not assess provider-specific call-center infrastructure, HRMS source-system implementation, EMR/FHIR, scheduling, hosting, general RBAC, insurance, or commercial requirements. It does include the clinical Voice AI collection boundary, recording/transcript evidence needed for nurse validation, and MedGemma adaptation because those directly affect STCC process integrity. Telephony transport and enterprise recording infrastructure remain separate integration/privacy workstreams.

## 2. Non-Negotiable Architecture Boundary

The following RFI wording must be interpreted through the approved safety architecture:

| RFI expectation | Approved IST Health interpretation |
| --- | --- |
| AI suggests a triage category | RAG may suggest a candidate guideline and rationale. Deterministic rules and the nurse establish the disposition. |
| AI recommends next steps or advice | The system retrieves mapped, approved content. AI cannot invent questions, advice, first aid, disposition, or local routes. |
| AI supports differential diagnosis | Differential diagnosis is excluded. The bounded function is reason-to-guideline matching, not diagnosis. |
| Dynamic WHO, NICE, or CDC protocols | External guidance may enter only through approved content governance. It cannot be mixed dynamically into the licensed STCC clinical corpus during a live encounter. |
| AI learns from calls | The system first records de-identified comparison evidence. No model training occurs from an encounter until validation, governance approval, lineage, and dataset controls are complete. |
| AI-generated clinical summary | AI may draft or assist wording. The final note remains rules-grounded, nurse-reviewed, and auditable. |

## 3. Current Verified Baseline

The following capabilities exist and should be preserved:

- STCC-shaped telehealth process snapshot from opening script through SBAR and audit closure
- deterministic emergency safety floors and high-to-low acuity question ordering
- nurse ownership of guideline confirmation, clinical disposition, care advice, and closing
- six synthetic demonstration protocols for software workflow validation
- Prisma structures for algorithms, questions, search words, advice, first aid, references, supplementals, releases, imports, and RAG evidence
- dry-run RAG shadow DTO with source IDs, snippet hashes, confidence, candidate protocols, agreement, and prohibited-action acknowledgements
- bilingual SOAP/SBAR generation and clipboard-ready completion output
- explicit prohibition on AI-created questions, advice, routes, disposition decisions, and safety-floor downgrades

Compatibility is not the same as clinical completeness. Licensed STCC import, a real bounded retrieval service, a governed model adapter, durable comparison evidence, and clinical validation remain open.

## 4. Status Definitions

| Status | Meaning |
| --- | --- |
| `NOT_STARTED` | No implementation evidence exists. |
| `PARTIAL` | Some schema, contract, documentation, UI, or tests exist, but the acceptance criteria are not complete. |
| `BLOCKED_EXTERNAL` | Completion requires a license, source database, clinical decision, vendor input, or approval outside engineering. |
| `IN_PROGRESS` | Implementation has started on an approved branch or task. |
| `READY_FOR_REVIEW` | Implementation and automated evidence exist; independent review is pending. |
| `VALIDATED` | Acceptance criteria and positive/negative tests have passed, with evidence recorded. |
| `CLOSED` | Validation, governance approval, documentation, migration, and rollback evidence are complete. |
| `DEFERRED` | Explicitly removed from the current release with a recorded decision and impact assessment. |

A UI screenshot, schema model, document, or passing build alone cannot close a gap.

## 5. Master Gap Register

| ID | Workstream | Gap | Current state | Required target | Priority | Status | Primary owner | Dependency | Closure evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GAP-001 | Source and licensing | Licensed STCC database and permitted-use scope are not available in the runtime. | Synthetic content only. | Confirm license, permitted environments, source package, update rights, RAG indexing rights, and retention restrictions. | Critical | `BLOCKED_EXTERNAL` | Product Owner / Legal / Clinical Governance | STCC agreement and source delivery | Signed scope decision, source manifest, checksum, access record, and governance approval |
| GAP-002 | Source mapping | No complete field-by-field STCC source-to-canonical mapping has been approved. | Architecture-level mapping exists. | Map every source table, field, relationship, code, status, language, ordering rule, and exclusion. | Critical | `PARTIAL` | Data Architect / Clinical Content Manager | GAP-001 | Approved mapping workbook or Markdown, unresolved-field count of zero, clinical sign-off |
| GAP-003 | Staging import | Raw licensed STCC data cannot yet be loaded losslessly into a staging layer. | Import job/error schema exists. | Build repeatable raw import preserving source identity, types, row counts, and source hashes. | Critical | `NOT_STARTED` | Data Engineering | GAP-001, GAP-002 | Dry-run report, source-to-stage row reconciliation, checksum evidence, rollback script |
| GAP-004 | Canonical import | Canonical runtime tables are not populated from licensed staging data. | Canonical schema exists; samples are hard-coded. | Normalize staging data into releases, algorithms, questions, search words, advice, bridges, first aid, references, supplementals, taxonomy, and telemedicine metadata. | Critical | `NOT_STARTED` | Data Engineering | GAP-002, GAP-003 | Reproducible import, target row counts, relationship report, content hashes, zero unexplained loss |
| GAP-005 | Import validation | Duplicate, relationship, bridge, ordering, language, and code-set validation is incomplete. | Validation requirements are documented. | Fail imports for duplicate clinical identity, orphaned relationships, invalid question order, missing advice bridges, unsafe HTML, and unsupported codes. | Critical | `PARTIAL` | Data Engineering / QA | GAP-003, GAP-004 | Positive and negative importer tests, defect report, zero critical validation errors |
| GAP-006 | Release lifecycle | Licensed content cannot yet move through draft, validation, approval, activation, supersession, rollback, and annual reconciliation. | Release structures exist. | Implement immutable release identity, four-eyes approval, activation gate, previous-release rollback, and local-overlay reconciliation. | Critical | `PARTIAL` | Protocol Content Manager / Clinical Governance | GAP-004, GAP-005 | Approved release, activation audit, rollback rehearsal, reconciliation report |
| GAP-007 | Clinical coverage | Full RFI protocol breadth is not present. | Six synthetic protocols only. | Verify licensed adult, pediatric, behavioral, women's health, chronic disease, older-adult, hospice, and applicable specialty coverage against the approved source index. | Critical | `NOT_STARTED` | Clinical Content Manager | GAP-004, GAP-006 | Coverage matrix, expected-versus-imported protocol counts, clinical sampling sign-off |
| GAP-008 | RAG corpus governance | No executable approved-corpus manifest or index activation gate exists. | Boundary is documented as approved-content-only. | Build a manifest containing release IDs, permitted sections, hashes, language, status, effective dates, and index eligibility. | Critical | `NOT_STARTED` | AI/ML Engineering / Clinical Governance | GAP-006 | Signed manifest, reproducible index build, excluded-source tests, corpus hash |
| GAP-009 | Retrieval adapter | The current shadow reuses deterministic candidates rather than performing independent bounded retrieval. | Dry-run DTO and hashes exist. | Implement a backend retrieval adapter that searches only the active approved corpus and returns source IDs, versions, citations, scores, and no-content outcomes. | Critical | `NOT_STARTED` | AI/ML Engineering | GAP-008 | Retrieval contract tests, citation verification, out-of-corpus rejection, latency evidence |
| GAP-010 | Model adapter | No live governed LLM endpoint or model inference adapter is enabled. | Model strategy and contracts are documented. | Add a private backend model adapter for structured reason extraction, keyword suggestions, candidate ranking rationale, and safety acknowledgement. | High | `NOT_STARTED` | AI/ML Engineering / Security | GAP-008, GAP-009 | Model/prompt/corpus lineage, schema validation, timeout/failure behavior, no frontend-to-model access |
| GAP-011 | Prohibited-output enforcement | Unsafe-output structures exist, but there is no complete runtime validator around a real model response. | Boundary strings and schema exist. | Reject invented questions, advice, first aid, routes, disposition decisions, unsafe downgrades, out-of-corpus citations, and privacy violations. | Critical | `PARTIAL` | AI/ML Engineering / Clinical Safety | GAP-010 | Negative adversarial suite, blocked-output records, zero unsafe state changes |
| GAP-012 | Durable shadow ledger | Retrieval, model, comparison, correction, and blocked-output evidence is not persistently written by the active runtime. | Prisma evidence models exist; queue returns transient shadow data. | Persist retrieval, suggestion, nurse selection, comparison, feedback, model evaluation, and blocked-output records without changing clinical state. | Critical | `NOT_STARTED` | Backend Engineering | GAP-009, GAP-010, GAP-011 | Database integration tests, lineage query, idempotency test, retention and masking evidence |
| GAP-013 | Independent comparison | Current agreement compares deterministic candidates with a shadow derived from those same candidates. | UI/API show full, partial, or no match. | Compare independent bounded retrieval/model output with deterministic ranking and the nurse's final guideline selection. | High | `PARTIAL` | Backend / AI/ML / Frontend | GAP-009, GAP-010, GAP-012 | Three-way comparison record, reason codes, correction capture, disagreement test cases |
| GAP-014 | Explainability and citations | Confidence and source identifiers are present but do not yet prove independent evidence retrieval. | Dry-run explanation is visible. | Show approved source title, section, release, citation, matched terms, rationale, confidence, and boundary warning without exposing hidden reasoning. | High | `PARTIAL` | Frontend / AI/ML / Clinical Governance | GAP-009, GAP-013 | Nurse usability review, citation click-through, inaccessible-source handling, accessibility test |
| GAP-015 | Clinical question and advice integrity | Workflow logic exists, but production question, disposition, advice, first-aid, and reference integrity is unproven. | Synthetic content demonstrates the flow. | Prove each active question belongs to the selected release and that every disposition/advice/first-aid output is mapped, ordered, and approved. | Critical | `PARTIAL` | Clinical Content Manager / QA | GAP-004, GAP-005, GAP-006 | Protocol traversal tests, bridge validation, high-to-low order tests, clinical sample review |
| GAP-016 | Note assistance boundary | Deterministic bilingual SBAR exists; governed transcription and model-assisted drafting do not. | Clipboard-ready deterministic note is implemented. | If retained in scope, add transcription/drafting as preliminary evidence with nurse review, source grounding, masking, and no alteration of disposition. | Medium | `PARTIAL` | Clinical Product / AI/ML / Privacy | GAP-010, GAP-011, GAP-012 | Draft/final diff, nurse approval record, privacy test, deterministic-disposition preservation |
| GAP-017 | Evaluation corpus | No clinically approved STCC-bounded model evaluation corpus covers the required populations and failure modes. | Synthetic scenario generation exists. | Create immutable train-free evaluation sets for adult, pediatric, women, behavioral, chronic, older-adult, aviation, ambiguous, no-match, and adversarial cases. | High | `PARTIAL` | QA / Clinical Governance / AI/ML | GAP-007, GAP-008 | Dataset card, source lineage, expected outcomes, no leakage, clinical approval |
| GAP-018 | Model scorecard | No release-blocking RAG/model scorecard is operational. | Metrics are planned. | Measure protocol recall, top-k agreement, citation validity, no-match precision, unsafe downgrade rate, hallucination rate, and subgroup performance. | Critical | `NOT_STARTED` | AI/ML / QA / Clinical Safety | GAP-017 | Versioned scorecard, approved thresholds, failed-model rejection test, signed review |
| GAP-019 | Correction and learning governance | Nurse corrections are not yet captured as validated learning labels. | Feedback taxonomy is planned. | Record whether a mismatch is a reason-extraction, synonym, search-weight, content, prompt, model, nurse-selection, or safety issue. | High | `NOT_STARTED` | Clinical Governance / AI/ML | GAP-012, GAP-013 | Correction taxonomy, reviewer workflow, label audit, de-identified export test |
| GAP-020 | End-to-end UAT | No production-like UAT proves licensed content, bounded RAG, deterministic safety, nurse action, evidence persistence, and rollback together. | Synthetic API/browser tests exist. | Run positive, negative, no-match, failure, privacy, accessibility, concurrency, Chrome, and Edge journeys against an approved UAT release. | Critical | `NOT_STARTED` | QA / Clinical Governance | GAP-006 through GAP-019 | Signed UAT report, defects resolved, rollback rehearsal, go/no-go decision |
| GAP-021 | Voice orchestration | No governed English Voice AI state machine controls identity, reason capture, guideline preparation, initial assessment, nurse validation, exceptions, and fallback. | The target flow is documented; active runtime is nurse-led. | Implement an idempotent, auditable state machine with normal and exception paths, deterministic advancement, and nurse-led fallback. | Critical | `NOT_STARTED` | Backend / Integration / Clinical Product | GAP-006, GAP-015 | State-transition tests, retry/idempotency evidence, interruption/disconnection tests, nurse fallback proof |
| GAP-022 | Approved audio assets | Fixed STCC clinical questions do not yet have a release-bound English audio registry or confirmed rendition rights. | Prerecorded audio is the approved design direction. | Register every audio asset against protocol release, question ID, language, checksum, voice, approval, and storage URI; confirm license rights. | Critical | `BLOCKED_EXTERNAL` | Clinical Content / Legal / Product | GAP-001, GAP-006 | Rights decision, audio manifest, text/audio checksum reconciliation, clinical approval, rollback asset version |
| GAP-023 | Speech and interruption handling | Streaming STT, voice activity detection, barge-in, confirmation, uncertainty, and human-request handling are not implemented. | Transcript assistance is not live. | Capture caller responses without losing interruptions; classify constrained intent; re-ask once on uncertainty; never advance on partial/low-confidence output. | Critical | `NOT_STARTED` | Integration / Backend / QA | GAP-021, GAP-022 | Audio/STT contract tests, VAD timing evidence, low-confidence negative tests, latency and outage tests |
| GAP-024 | Nurse voice validation | The nurse cannot yet review synchronized recording/transcript evidence and validate every initial-assessment answer. | Nurse owns guideline and disposition but no voice-validation workspace exists. | Show identity/age, reason, candidate evidence, audio, transcript, question/answer, confidence, interruption, contradiction, emergency, and correction controls. | Critical | `NOT_STARTED` | Frontend / Clinical Product / Privacy | GAP-021, GAP-023 | Per-answer accept/correct/re-ask/reject UAT, audit persistence, accessibility review, masked playback controls |
| GAP-025 | MedGemma adaptation | No governed MedGemma adapter, adaptation dataset, fine-tuned interpreter, or registered scorecard exists. | Synthetic LLM-ready rows and strategy exist. | Adapt a versioned MedGemma adapter only for extraction, structured answer mapping, contradiction detection, emergency-term flagging, and approved ID ranking. Do not encode or autonomously execute STCC. | Critical | `NOT_STARTED` | AI/ML / Clinical Governance / Privacy | GAP-001, GAP-008 through GAP-012, GAP-017 | Rights approval, dataset card, leakage-safe splits, model registry, structured-output tests, scorecard, known limitations, rollback |
| GAP-026 | Voice AI safety UAT | No end-to-end evidence proves English Voice AI, MedGemma shadow interpretation, deterministic STCC control, nurse validation, emergency transfer, and fallback together. | Component-level synthetic tests exist. | Run call/API/browser journeys for normal, ambiguous, interrupted, disconnected, emergency, model-outage, STT-outage, wrong-identity, dependent, and nurse-correction paths. | Critical | `NOT_STARTED` | QA / Clinical Governance / Security | GAP-020 through GAP-025 | Signed UAT pack, zero unsafe advancement, emergency-recall threshold met, Chrome/Edge evidence, go/no-go and rollback rehearsal |

## 6. RFI Alignment Register

| RFI clinical/AI expectation | Alignment | Gap IDs | Decision |
| --- | --- | --- | --- |
| Free-text symptoms prepare candidate guidelines | Partial | GAP-008 to GAP-014 | Keep. Implement as bounded retrieval and nurse-confirmed selection. |
| Spoken symptoms and initial-assessment support | Not started / governed target | GAP-021 to GAP-026 | Implement as English clinical collection under deterministic STCC control; MedGemma interprets in shadow mode and the nurse validates every response. |
| Red-flag identification | Aligned baseline | GAP-015, GAP-020 | Preserve deterministic safety floors and validate against licensed content. |
| Adult and pediatric protocols | Partial | GAP-001 to GAP-007 | Requires licensed content import and coverage validation. |
| Comorbidity and specialist domains | Partial | GAP-007, GAP-017 | Include only where represented in the licensed, approved corpus. |
| AI triage-category recommendation | Intentional variance | GAP-013, GAP-014 | Reword as candidate guideline suggestion; rules and nurse own disposition. |
| Differential diagnosis | Excluded | None | Do not implement inside the STCC RAG shadow. |
| AI-generated advice | Intentional variance | GAP-011, GAP-015 | Retrieve mapped approved advice; do not generate it. |
| Explain why a recommendation was shown | Partial | GAP-009, GAP-013, GAP-014 | Provide source-grounded rationale and citations, not hidden reasoning. |
| AI recommendation logging | Partial | GAP-012, GAP-019 | Persist complete lineage and comparison evidence. |
| Protocol review and updates | Partial | GAP-005, GAP-006 | Implement governed release lifecycle and rollback. |
| AI-generated notes summary | Partial | GAP-016 | Keep nurse-reviewed and separate from clinical authority. |

## 7. Ordered Execution Plan

Work should proceed in this order. A later gate may be designed early but cannot be closed before its dependencies.

1. **Gate 1: Source authority** - close GAP-001 and GAP-002.
2. **Gate 2: Reproducible ingestion** - close GAP-003 through GAP-005.
3. **Gate 3: Governed clinical release** - close GAP-006, GAP-007, and GAP-015.
4. **Gate 4: Approved RAG corpus** - close GAP-008 and GAP-009.
5. **Gate 5: Governed model shadow** - close GAP-010 through GAP-014.
6. **Gate 6: Evaluation and learning** - close GAP-017 through GAP-019.
7. **Gate 7: English Voice AI collection** - close GAP-021 through GAP-024.
8. **Gate 8: MedGemma adaptation and voice safety validation** - close GAP-025, GAP-026, and GAP-020.

GAP-016 remains optional note drafting. It is separate from the required transcript and structured-answer evidence in GAP-023 and GAP-024. Voice AI must not delay deterministic nurse-led clinical readiness, and the system must fail back to that workflow whenever voice, speech, retrieval, or model services are unavailable.

## 8. Definition of Done for Every Gap

Every gap must have all applicable evidence before it can be marked `CLOSED`:

- implementation or approved external decision
- linked requirement and architecture boundary
- positive and negative automated tests
- API contract validation where applicable
- database migration and rollback evidence where applicable
- privacy and masking review where applicable
- clinical governance review where applicable
- Help/Library update
- UAT evidence reference
- commit and deployment reference
- named approver and approval date

## 9. Per-Gap Work Log Template

Copy this block under the relevant gap when work begins:

```text
Gap ID:
Status:
Owner:
Started:
Target completion:
Branch / task:
Requirement references:
Implementation summary:
Files changed:
Migration:
Tests added:
Positive test result:
Negative test result:
Clinical review:
Security/privacy review:
Rollback procedure:
Evidence links:
Open risks:
Next action:
Approved by:
Closed date:
```

## 10. Decision Log

| Date | Decision | Reason | Approver | Affected gaps |
| --- | --- | --- | --- | --- |
| 2026-07-17 | Treat AI disposition, differential diagnosis, and generated care advice as bounded or prohibited rather than autonomous features. | Preserve rules-first, nurse-owned clinical authority and STCC content integrity. | Pending formal governance approval | GAP-011, GAP-013, GAP-015 |
| 2026-07-17 | Track licensed clinical content separately from local Qatar routing and aviation overlays. | Prevent local operational policy from modifying the licensed clinical source. | Pending formal governance approval | GAP-002, GAP-006, GAP-015 |
| 2026-07-17 | Use approved prerecorded English audio for fixed clinical questions and streaming STT for caller responses. | Preserve exact wording and release auditability while still supporting caller interruption and natural responses. Arabic is deferred. | Pending formal governance approval | GAP-021 to GAP-024 |
| 2026-07-17 | Adapt MedGemma for constrained language interpretation, not STCC memorization or autonomous triage. | Keep licensed content, question order, safety floors, and disposition authority in deterministic services and nurse approval. | Pending formal governance approval | GAP-008 to GAP-013, GAP-025, GAP-026 |

## 11. Immediate Next Action

Start with **GAP-001**.

Required questions:

1. Has the licensed STCC database package been obtained?
2. Which edition, year, adult/pediatric modes, and language assets are included?
3. May the licensed content be stored in development, UAT, and production?
4. May approved STCC text be indexed for bounded RAG retrieval?
5. May snippets, hashes, citations, or embeddings be retained?
6. What annual update, archival, deletion, and audit obligations apply?
7. Who is the named clinical content owner and final release approver?
8. Does the license permit approved audio renditions of clinical questions?
9. Does the license permit RAG indexing, embeddings, derived structured labels, model evaluation, or fine-tuning/model derivatives?
10. Which licensed fields may be sent as runtime context to a private MedGemma endpoint, and what retention restrictions apply?

Until these questions are answered, synthetic content may be used for software validation only and no clinical-readiness claim should be made.

## 12. Evidence Sources

- `docs/stcc-compatible-rag-shadow-architecture-poa.md`
- `docs/stcc-after-hours-database-structure-2026.md`
- `docs/stcc-after-hours-database-structure-2026-line-compare.md`
- `prisma/schema.prisma`
- `src/services/ragShadow.ts`
- `src/data/samplePhase1ClinicalContent.ts`
- `src/routes/protocols.ts`
- `src/services/triageNoteCompiler.ts`
- `frontend/src/HelpCenter.tsx`
- `frontend/src/components/Triage/NurseWorkspace.tsx`
- `tests/e2e/api-contract.spec.ts`
- `tests/queueOrchestration.test.ts`
- RFI data sheet: `RFI-Data sheet- AI triage_DS.docx`
