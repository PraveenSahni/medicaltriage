# STCC-Compatible RAG Shadow Architecture and Plan of Action

Status: backend process snapshot, bounded RAG shadow contract, and STCC-compatible persistence schema implemented; licensed STCC import pending

Last reviewed: 2026-07-17

This document defines the refined architecture for aligning IST Health with a fully STCC-compatible clinical content model while introducing a bounded LLM/RAG shadow layer for learning, comparison, and nurse assistance. The backend now exposes the STCC process snapshot and RAG shadow contract in queue DTOs. It does not reproduce licensed STCC clinical content and must not be treated as a substitute for a licensed STCC database, clinical governance approval, or local medical validation.

## 1. Objective

Build the platform toward a fully STCC-compatible operating model:

```text
Incoming call
  -> HRMS identity and age validation
  -> opening script
  -> reason for call
  -> search words and keyword match
  -> guideline selection
  -> initial/emergency assessment
  -> acuity-ordered triage questions
  -> disposition
  -> care advice
  -> hand-off/referral
  -> closing script
  -> SBAR and audit closure
```

At the same time, run a bounded LLM/RAG layer in parallel during the early encounter. The LLM/RAG layer may suggest, compare, explain, and learn, but it must not become the clinical decision engine.

## 1.1 STCC Telehealth Triage Encounter Process

The STCC-compatible operating process is a nurse-led swimlane. IST Health must preserve this clinical sequence even when the UI uses simplified action tabs.

```mermaid
flowchart LR
  A["Opening Script"] --> B["Reason For Visit / Initial Nurse Assessment"]
  B --> C["Guideline Selection"]
  C --> D["Initial Assessment Questions"]
  D --> E["Triage Assessment Questions"]
  E --> F["Telemedicine Eligible?"]
  E --> G["Triage Disposition"]
  F --> G
  G --> H["Hand-Off / Referral"]
  G --> I["Care Advice"]
  I --> J["Closing Script"]
```

### Process Detail

| STCC-compatible step | What happens | IST Health implementation |
| --- | --- | --- |
| Opening Script | The nurse gives a friendly greeting, introduction, and call purpose. | Approved opening script is shown in the first action tab. The system already knows the caller context from the queue. |
| Reason For Visit / Initial Nurse Assessment | The nurse records the caller's reason in the caller's own words and identifies primary and secondary chief complaints. | `reasonNarrative`, prepared protocol search, queue context, channel, wait time, staff/dependent status, station, duty state, and HRMS age validation are shown together. |
| Guideline Selection | The nurse uses search words and clinical judgment to select the best triage guideline. | Deterministic search uses approved keyword indexes, synonyms, age, sex, mode, and red-flag terms. Bounded RAG may suggest candidates, but nurse confirmation remains required. |
| Initial Assessment Questions | The nurse references or uses initial assessment questions to identify immediate risk before detailed assessment. | Emergency safety floors check SpO2, respiratory rate, heart rate, consciousness, pediatric danger signs, severe symptoms, and other red-floor triggers before lower-acuity work. |
| Triage Assessment Questions | The nurse performs a detailed assessment using the selected guideline. | The Questions tab presents one active question at a time in high-to-low acuity order. A Yes fixes the disposition; a No unlocks the next item. |
| Telemedicine Eligible? | The system/nurse notes whether the case is suitable for telemedicine based on guideline and local policy. | `telemedicineEligible`, telemedicine notes, and disposition-level telemedicine headings are supported in the schema. This is an indicator, not an override of safety floors. |
| Triage Disposition | The nurse reaches the clinical disposition and source-of-care recommendation. | STCC-shaped disposition sets the clinical floor. Qatar routing maps it to HMC, Sidra, PHCC, IST Health medical review, teleconsult, outstation escalation, or self-care. |
| Hand-Off / Referral | If the case needs urgent care, ED, physician, clinic, or another service, the nurse completes the handoff. | SBAR/SOAP draft, CCP follow-up, referral target, route rationale, and audit trace are prepared for clinician-approved handoff. |
| Care Advice | The nurse gives targeted care advice, first aid, health information, callback precautions, or send-later advice. | `CareAdvice`, `QuestionAdviceBridge`, `ProtocolFirstAid`, and localized route advice hold approved content. Employee-facing messages still require nurse approval before CCP send. |
| Closing Script | The nurse gives closing instructions and callback/return precautions. | Closing script, SBAR completion, care-advice confirmation, and CCP callback/follow-up tasks close the encounter. |

STCC FAQ material describes a typical telehealth triage encounter as an approximately 11 to 13 minute call, with variation from chief complaint, patient age/context, nurse experience, and UI efficiency. IST Health should treat this as a planning benchmark, not a contractual SLA.

### Simplified IST Health Action Tabs

The product should keep the nurse UI simple while preserving the STCC process:

| Visible IST Health action tab | STCC process contained inside |
| --- | --- |
| Reason and Emergency Rule-Out | Opening script, reason for visit, initial nurse assessment, guideline search, guideline selection, initial/emergency assessment questions |
| Questions | Initial assessment questions, triage assessment questions, telemedicine eligibility indicator, high-to-low acuity sequence |
| Disposition and Care Advice | Triage disposition, source of care, Qatar route, fit-to-fly overlay, mapped care advice, first aid, handoff/referral |
| SBAR / Complete | Closing script, callback precautions, CCP follow-up, SBAR/SOAP note, audit closure |

The RAG shadow layer runs beside the first two visible tabs only: reason extraction, keyword/search-word match, candidate guideline ranking, and comparison with nurse selection. It must not independently set disposition, source of care, first aid, care advice, or closing instructions.

## 2. Non-Negotiable Safety Principles

1. STCC or STCC-shaped content is the clinical content source.
2. Deterministic rules decide emergency floors, question ordering, and minimum permitted disposition.
3. The nurse remains the human clinical decision owner.
4. LLM/RAG is advisory and shadow-mode unless explicitly approved for a narrow non-clinical assistive task.
5. LLM/RAG cannot invent questions, dispositions, care advice, or local routes.
6. LLM/RAG cannot downgrade emergency, urgent, pediatric, aviation, or other safety-floor outcomes.
7. RAG retrieval must be limited to approved indexed content.
8. Every disagreement between nurse, deterministic system, and LLM/RAG must be recorded for governance and learning.
9. Employee-facing messages must remain nurse-approved before WhatsApp, SMS, email, or CCP send.
10. Licensed STCC content must be imported, versioned, and reconciled without casual modification.

## 3. Target Architecture

```mermaid
flowchart LR
  A["Incoming call / callback queue"] --> B["HRMS identity and age validation"]
  B --> C["Reason for call"]
  C --> D["Deterministic keyword and protocol search"]
  C --> E["Bounded RAG reason and protocol suggestion"]
  D --> F["Nurse guideline selection"]
  E --> G["Comparison and learning ledger"]
  F --> G
  F --> H["Emergency / initial assessment"]
  H --> I["Acuity-ordered triage questions"]
  I --> J["Disposition"]
  J --> K["Care advice"]
  K --> L["SBAR / referral / closing script"]
  G --> M["AI/ML evaluation datasets"]
  G --> N["Clinical governance review"]
```

### 3.1 Current Backend Implementation

The queue API now returns a `stccProcess` snapshot for every queue item. This maps the STCC telehealth encounter process into the product's four visible nurse action tabs while preserving the canonical underlying process:

- Opening Script
- Reason for Visit / Initial Nurse Assessment
- Guideline Selection
- Initial Assessment Questions
- Triage Assessment Questions
- Telemedicine Eligible
- Triage Disposition
- Care Advice
- Hand-Off / Referral
- Closing Script

The queue API also returns `preparedProtocol.ragShadow` when a reason narrative is evaluated. This is a dry-run shadow suggestion derived only from approved clinical content candidates. It includes retrieved source IDs, snippet hashes, confidence, protocol agreement status, and explicit flags that the shadow layer cannot decide disposition and requires nurse review.

### 3.2 Help and Library Implementation

The in-app Help/Library now documents the complete process in the same terms as this architecture:

- **Call Flow** describes the end-to-end telehealth triage encounter: incoming queue, HRMS age validation, opening script, reason for call, keyword search, guideline selection, emergency rule-out, acuity-ordered questions, disposition/source of care, care advice, closing script, SBAR, and audit.
- **Clinical Protocol Library** explains the STCC-compatible data shape: algorithms, questions, search words, taxonomy, care advice, first aid, references, supplementals, source lineage, and localized routing overlay.
- **STCC-Compatible RAG Shadow Architecture** explains the AI/ML boundary: retrieval is limited to approved content, LLM suggestions are advisory, unsafe output is blocked, and nurse/system/LLM comparison is stored for governance.
- **Data Ingestion and QA** explains import readiness, duplicate checks, row counts, bridge validation, source hashes, and release activation.
- **Prisma Data Model** lists the canonical persistence structures and deprecated compatibility fields that must be retired only after importer/runtime migration.

This keeps user-facing help, technical library, schema, and implementation plan aligned.

## 4. Layered Data Design

The database should separate the source content, canonical runtime content, local overlays, and learning data.

### 4.1 STCC Source Layer

Purpose: preserve imported licensed STCC structures and source identity.

Required domains:

| Domain | Required concepts |
| --- | --- |
| Release | release year, source type, checksum, imported date, active flag |
| Algorithm | source algorithm ID, title, definition, background, first aid, age/sex rules, status, acuity |
| Question | source question ID, disposition level, question order, text, rationale, telemedicine eligibility |
| Advice | advice ID, care advice text, home care advice, display/send eligibility |
| Search words | keyword, synonym, source ID, algorithm bridge, weight |
| Disposition | disposition level, heading, source-of-care wording, telemedicine heading |
| Reference | evidence/reference metadata and algorithm bridge |
| Supplemental | dosage tables, appendices, reviewer notes, non-guideline content |
| Taxonomy | category, group, type, system, anatomy, specialty flags |
| Text formats | plain text plus sanitized XHTML/HTML where available |

### 4.2 Canonical Runtime Clinical Layer

Purpose: provide stable application contracts independent of the imported STCC physical format.

Current foundation:

- `Algorithm`
- `TriageQuestion`
- `CareAdvice`
- `QuestionAdviceBridge`
- `AlgorithmCareAdvice`
- `ProtocolKeywordIndex`
- `ProtocolSynonym`
- `ProtocolDispositionMap`
- `LocalizedDisposition`
- `ProtocolRelease`
- `ClinicalContentImportJob`
- `ClinicalContentImportError`

Implemented schema alignment additions:

- `ClinicalReference`
- `AlgorithmReference`
- `ClinicalSupplemental`
- `AlgorithmSupplemental`
- `ProtocolTaxonomy`
- `ProtocolFirstAid`
- sanitized XHTML/plain text pairs on advice, supplementals, and first-aid items
- question-level telemedicine eligibility and notes
- disposition-level telemedicine headings and source-of-care wording
- STCC source record hashes/checksums and annual reconciliation metadata

Deprecated compatibility fields retained until importer and runtime code fully migrate:

- `Algorithm.stccVersion`: use `ProtocolRelease.version` through `releaseId`.
- `Dependent.age`: calculate age from HRMS/dependent date of birth at runtime.
- `AviationTriageEncounter.initialAcuityScore`: use `finalDispositionCode` plus safety trace lineage.
- `ApplicationUser.organization`: use `organizationId` and `organizationRef` for canonical tenant joins.

### 4.3 Qatar and Aviation Overlay Layer

Purpose: local routing and occupational context after the STCC clinical disposition is fixed.

Examples:

- pediatric emergency routes to Sidra Medicine Emergency Department
- adult emergency routes to HMC Emergency Department
- urgent route to HMC urgent review or approved PHCC/teleconsult path
- routine staff route to approved clinic/teleconsult workflow
- self-care with callback precautions
- fit-to-fly restriction
- duty status and outstation handling
- sickness validation and occupational health routing

This overlay must never downgrade the STCC clinical disposition.

### 4.4 RAG and Learning Layer

Purpose: keep advisory LLM output and comparison evidence separate from clinical source data.

Implemented records:

| Record | Purpose |
| --- | --- |
| `RagRetrievalEvent` | stores retrieved source IDs, versions, snippets hashes, confidence, and query |
| `LlmShadowSuggestion` | stores LLM extracted reason, keywords, suggested protocols, and rationale |
| `NurseSelectionEvent` | stores nurse-selected guideline and reason |
| `ProtocolComparisonEvent` | compares deterministic search, LLM/RAG suggestion, and nurse selection |
| `LearningFeedbackEvent` | marks whether weights, synonyms, prompts, or no changes are needed |
| `ModelEvaluationRun` | tracks model/prompt version, dataset version, metrics, failures |
| `SafetyBlockedOutput` | records unsafe model output such as downgrade attempts or invented advice |

## 5. Parallel Early-Encounter Design

The following early activities can run in parallel while preserving clinical safety.

| Activity | Deterministic system | Nurse | Bounded LLM/RAG | Comparison and learning |
| --- | --- | --- | --- | --- |
| Incoming call / callback queue | creates queue item, timestamp, channel, SLA, lock | selects one call | summarizes non-PHI call metadata if allowed | compare queue priority vs predicted complaint priority |
| HRMS identity and age validation | validates staff/dependent, DOB, age, sex, eligibility | confirms caller context when needed | may extract caller-stated identity but cannot validate identity | record mismatch between caller statement and HRMS |
| Opening script | loads approved script by language/channel | reads or adapts script within policy | suggests bilingual phrasing from approved script only | record script deviation or missing language support |
| Reason for call | stores narrative and normalized terms | clarifies and edits reason | extracts symptom, duration, body part, red flags, keyword candidates | compare nurse reason vs LLM extraction vs deterministic terms |
| Keyword/search-word match | searches approved STCC keyword index | reviews suggested protocols | retrieves only from approved STCC-bounded corpus | compare ranked candidates and reasons |
| Guideline selection | presents candidate protocols with age/sex/mode filters | selects final guideline | suggests likely guideline with citations/source IDs | mark full match, partial match, or disagreement |

### 5.1 English Voice AI Initial Assessment Authority

The English Voice AI is a governed collection channel, not an autonomous triage clinician. The authority order is fixed:

1. The active, approved STCC release supplies the exact clinical question text, question order, answer schema, and permitted next question IDs.
2. Deterministic identity, eligibility, safety-floor, protocol, and workflow services decide whether the encounter can advance.
3. Prerecorded approved English audio presents fixed clinical questions without changing their wording.
4. Streaming speech-to-text captures the caller's response.
5. MedGemma interprets the response into a constrained structured answer and may suggest search terms or protocol/question IDs in shadow mode.
6. The deterministic engine validates the structured output against the active protocol and safety rules.
7. A Remote Triage Nurse reviews the recording, transcript, extracted answers, evidence, and exceptions before confirming guideline, detailed triage, disposition, care advice, or closure.

Arabic voice interaction is deferred from this phase. English audio, transcript, model, and evaluation assets must therefore be explicitly tagged `en` rather than implying bilingual voice readiness.

### 5.2 End-to-End Voice State Machine

```text
CALL_OFFERED
  -> RECORDING_NOTICE
  -> IDENTITY_VALIDATION
  -> REASON_CAPTURE
  -> GUIDELINE_PREPARATION
  -> INITIAL_ASSESSMENT
  -> NURSE_VALIDATION_PENDING
  -> NURSE_TRIAGE_ACTIVE
  -> DISPOSITION_APPROVAL
  -> COMPLETE
```

Exception states are `IDENTITY_EXCEPTION`, `STT_UNCERTAIN`, `CALL_DISCONNECTED`, `HUMAN_REQUESTED`, and `EMERGENCY_TRANSFER`. Every transition must carry the call ID, encounter ID, actor, timestamp, source event ID, protocol release where applicable, and an idempotency key.

### 5.3 Complete English Voice AI Flow

| Stage | Automated activity | MedGemma boundary | Nurse responsibility | Required evidence |
| --- | --- | --- | --- | --- |
| Call offered | Provider-neutral gateway creates or updates one queue case. | No clinical inference. | Accept the call or callback when assigned. | provider event ID, queue ID, channel, timestamp, recording policy |
| Recording notice | Play approved greeting and recording notice before clinical collection. | No rewriting of the legal/operational notice. | Take over immediately if the caller objects or requests a person. | notice version, playback result, caller response |
| Identity validation | Match registered phone where permitted; otherwise collect employee ID and PIN, select employee/dependent, obtain DOB from HRMS, and calculate age. | May extract caller-stated identity only; cannot establish identity. | Resolve exceptions and confirm the selected person where needed. Emergency help must not be withheld for failed identity. | HRMS source, subject ID, DOB hash/reference, calculated age, validation result |
| Reason capture | Ask the approved open reason-for-call prompt, record audio, and stream speech-to-text. Deterministic search words and bounded RAG independently rank candidates. | Extract symptom, body part, duration, onset, caller language, and possible red-flag phrases into a strict schema. Candidate matching remains provisional. | Review or clarify the reason and confirm the selected guideline. | audio segment, transcript, extracted terms, candidate IDs, scores, citations |
| Guideline preparation | Apply age, sex, mode, release, status, and search-word filters to approved content only. | Recommend only permitted protocol IDs with approved citations; return no-match when evidence is insufficient. | Select or confirm the guideline; resolve ambiguity. | protocol/release IDs, matched search words, deterministic rank, RAG rank, nurse choice |
| Initial assessment | Play each approved prerecorded STCC initial-assessment question by question ID and release. | Interpret the caller response into the allowed answer schema; do not rewrite, skip, reorder, or invent a question. | Validate each question and response before the initial-assessment record is accepted. | question/audio versions, transcript span, structured answer, confidence, interruption flag |
| Interruption handling | Voice activity detection pauses or stops playback and captures barge-in speech. Classify it as an answer, emergency statement, clarification, repeat request, human request, or unrelated/unclear speech. | Produce only the constrained classification and structured fields. | Take over when confidence is low, meaning conflicts, or the caller requests a human. | VAD events, playback offset, classification, confidence, retry/escalation result |
| Confirmation | Repeat a clear interpreted answer using a fixed confirmation template. Re-ask an unclear answer once, then route to the nurse. Partial or low-confidence answers do not advance. | May fill the constrained confirmation variables; cannot decide that uncertainty is clinically safe. | Confirm or correct the answer. | confirmation prompt/version, caller confirmation, corrections |
| Continuous emergency monitoring | Run deterministic emergency phrase and safety-floor checks after every transcript update and structured answer. Stop automation and transfer/escalate when triggered. | May flag possible emergency terms for deterministic evaluation; cannot suppress or downgrade a trigger. | Continue emergency handoff and document the outcome. | trigger IDs, source transcript spans, rule result, transfer result |
| Nurse validation | Present recording, synchronized transcript, HRMS identity/age, reason, candidate evidence, each question/answer, confidence, interruptions, contradictions, and emergency findings. | Shadow output remains visibly preliminary. | Accept, correct, re-ask, or reject every item; confirm the guideline. | per-item validation decision, nurse ID, timestamp, correction reason |
| Detailed triage | After validation, run the acuity-ordered STCC triage assessment in the nurse workspace. Approved audio may play a question while the nurse controls the encounter. | May interpret answers and flag contradictions; cannot select the disposition. | Ask/validate the active question. The first confirmed Yes fixes the provisional disposition; No unlocks the next approved item. | question path, answers, rule trace, nurse actions |
| Completion | Deterministic engine provides disposition, mapped care advice, Qatar route, fit-to-fly overlay, and callback precautions. Generate SBAR/SOAP and close or hand off. | May draft a grounded summary from validated fields only. | Approve disposition, care advice, destination, fit-to-fly status, note, and closing script. | final rule trace, approvals, note diff, recording/transcript references, audit closure |

### 5.4 Prerecorded Clinical Audio Governance

Prerecorded audio is preferred for fixed STCC clinical questions because it preserves approved wording, stable pronunciation, predictable latency, reproducible playback, and release-level auditability. It does not replace speech-to-text for caller responses.

Runtime text-to-speech may be used only for approved dynamic administrative phrases or constrained confirmation templates. It must not paraphrase STCC clinical questions. Each clinical audio asset requires:

- `protocol_release_id`
- `question_id`
- `language`
- `audio_version`
- `clinical_text_checksum`
- `speaker_or_voice_id`
- `approval_status`
- `approved_by`
- `approved_at`
- `storage_uri`

The STCC license review must explicitly confirm whether audio rendition, RAG indexing, embeddings, model evaluation, and ML adaptation are permitted.

### 5.5 MedGemma Runtime Contract

MedGemma is a clinical-language interpreter and bounded RAG shadow. It may:

- normalize reason-for-call language and recommend approved search words;
- map natural speech to structured fields such as Yes/No, pain score, duration, location, onset, and aggravating factors;
- detect that a caller already answered an approved question;
- flag contradictions, missing context, and possible emergency phrases;
- recommend permitted protocol/question IDs with approved citations;
- draft a nurse summary from validated facts.

It may not memorize or independently execute STCC, recall licensed question text from model weights, rewrite questions, skip or reorder mandatory questions, set or downgrade a safety floor, approve a disposition, invent care advice, or learn online from a live call.

Example constrained output:

```json
{
  "active_question_id": "ABD-M-IQ-006",
  "answer": {
    "pain_score": 8,
    "severity": "SEVERE"
  },
  "confidence": 0.97,
  "emergency_terms_detected": ["doubled over"],
  "recommended_action": "RUN_SAFETY_RULES"
}
```

The backend rejects unknown fields, unknown IDs, unsupported answer values, missing source lineage, and any requested action outside the allowlist.

### 5.6 MedGemma Adaptation and Training Lifecycle

Do not train MedGemma to reproduce the STCC corpus. Fine-tune a versioned adapter, such as LoRA, only for constrained clinical-language interpretation after rights and governance approval.

1. Confirm rights for model evaluation, derived labels, embeddings, audio, and training. Do not place verbatim licensed STCC text into model weights unless the license explicitly permits model derivatives.
2. Build synthetic or formally de-identified examples containing transcript context, active protocol release/question ID, allowed answer schema, expected structured output, permitted action label, and nurse correction label.
3. Split train, validation, and test data by patient/call/protocol family to prevent leakage. Keep a separate immutable, train-free safety evaluation set.
4. Fine-tune a versioned adapter for extraction, classification, contradiction detection, and approved ID ranking, not clinical authority.
5. Evaluate structured-field accuracy, protocol top-k recall, no-match precision, emergency-phrase recall, contradiction detection, unsupported-output rate, subgroup performance, latency, and fail-closed behavior.
6. Require clinician, privacy, security, and AI governance review. Register base model, adapter, dataset manifest, code version, prompt/tool schema, metrics, intended use, limitations, and rollback version.
7. Deploy in shadow mode behind a private backend adapter. Compare MedGemma, deterministic engine, and nurse decisions without allowing model output to change clinical state.
8. Capture nurse corrections as governed labels only after de-identification and review. Retraining and promotion are offline, versioned, approved events; there is no automatic online learning.
9. Roll back through a feature flag and registered model/adapter version whenever safety, drift, performance, or availability thresholds fail.

Runtime context must supply the active release, exact approved question, allowed answer schema, permitted next IDs, deterministic safety rules, and only the minimum approved retrieval context. If the model or speech service is unavailable, the encounter remains usable as a nurse-led deterministic workflow.

## 6. RAG Boundary

### Allowed Retrieval Sources

- licensed STCC content after import
- synthetic STCC-shaped demo content, clearly tagged as synthetic
- IST-approved local Qatar route overlays
- approved fit-to-fly and aviation medicine rules
- approved opening and closing scripts
- approved care advice and callback precautions
- approved bilingual terminology and script wording

### Disallowed Retrieval Sources

- open web medical advice during a live encounter
- unapproved internet content
- general LLM medical memory
- nurse notes from unrelated employees unless explicitly linked and permitted
- raw PHI not needed for the current encounter
- unapproved generated questions or care advice

### RAG Output Contract

Every RAG suggestion should include:

- source type
- source release/version
- source record IDs
- retrieved section type
- confidence
- reason extraction
- suggested search terms
- suggested protocol candidates
- prohibited-action acknowledgement
- `cannot_decide_disposition: true`
- `requires_nurse_review: true`

## 7. Nurse Workflow Design

Keep the visible workflow simple:

1. Reason and Emergency Rule-Out
2. Questions
3. Disposition and Care Advice
4. SBAR / Complete

Map the STCC process inside those action tabs:

| Visible tab | STCC subprocesses |
| --- | --- |
| Reason and Emergency Rule-Out | opening script, reason for visit, initial nurse assessment, search words, guideline selection, emergency rule-out |
| Questions | initial assessment questions, triage assessment questions, telemedicine eligibility, high-to-low disposition levels |
| Disposition and Care Advice | clinical disposition, Qatar route, fit-to-fly overlay, mapped care advice, first aid where appropriate |
| SBAR / Complete | hand-off/referral, closing script, callback precautions, SBAR/SOAP, CCP follow-up |

## 8. AI/ML Learning Design

The learning engine should learn from comparison outcomes, not from replacing the clinical engine.

Training/evaluation datasets:

| Dataset | Purpose |
| --- | --- |
| reason normalization | teach symptom/body part/duration extraction |
| keyword ranking | compare deterministic keyword matches with nurse final guideline |
| protocol suggestion | evaluate candidate protocol ranking |
| question-path trace | verify high-acuity first behavior and stop-on-yes behavior |
| care-advice retrieval | verify advice maps only from approved protocol/question/disposition |
| route explanation | teach local Qatar and aviation overlay explanation |
| safety failure cases | ensure the LLM cannot downgrade safety floors |
| bilingual drafting | evaluate English/Arabic explanation and SBAR text |

Model metrics:

- protocol top-1 agreement with nurse
- protocol top-3 agreement with nurse
- keyword precision and recall
- unsafe downgrade rate, target 0
- invented question/advice rate, target 0
- citation coverage
- nurse correction rate
- pediatric/female-health/male-health/older-adult/behavioral coverage
- Qatar aviation overlay explanation accuracy

## 9. Activity Task List

### Workstream A: STCC-Compatible Database Alignment

| Task | Activity | Acceptance criteria |
| --- | --- | --- |
| A1 | Finalize STCC source-to-canonical mapping | every STCC table has target table/field or explicit exclusion |
| A2 | Add reference and supplemental models | references and supplemental content can be imported and linked to algorithms |
| A3 | Add taxonomy and status metadata | category, group, type, system, anatomy, specialty flags, status, and update dates are represented |
| A4 | Add first-aid and XHTML/plain text support | first aid and formatted content can be stored safely |
| A5 | Add telemedicine eligibility fields | question and disposition telemedicine concepts are represented |
| A6 | Add release reconciliation metadata | annual updates can compare source, local overlay, and approved override |

### Workstream B: Import and Validation Pipeline

| Task | Activity | Acceptance criteria |
| --- | --- | --- |
| B1 | Build raw STCC staging import | source tables can be loaded without transformation loss |
| B2 | Build normalized import | canonical runtime tables are populated from staging |
| B3 | Add duplicate detection | duplicate algorithms, questions, advice, search words, and bridges are reported |
| B4 | Add relationship validation | missing algorithm/question/advice/reference bridges fail validation |
| B5 | Add ordering validation | questions sort by disposition level and order |
| B6 | Add source checksum and row counts | import report proves lineage and reproducibility |

### Workstream C: Bounded RAG Shadow Layer

| Task | Activity | Acceptance criteria |
| --- | --- | --- |
| C1 | Define RAG corpus manifest | only approved source collections are indexable |
| C2 | Build retrieval adapter contract | backend returns source IDs, versions, and citation metadata |
| C3 | Build shadow suggestion contract | LLM returns extracted reason, keywords, protocol candidates, and safety acknowledgement |
| C4 | Add prohibited-output validator | invented questions, invented advice, and downgrades are blocked |
| C5 | Add comparison ledger | nurse/system/LLM differences are stored with reason codes |
| C6 | Add dry-run-only mode | RAG can run without changing clinical workflow state |

### Workstream D: Nurse Workflow Alignment

| Task | Activity | Acceptance criteria |
| --- | --- | --- |
| D1 | Add opening and closing script support | approved scripts appear in the relevant action tabs |
| D2 | Improve guideline candidate view | deterministic and RAG candidates are visible but nurse chooses final guideline |
| D3 | Preserve one-question-at-a-time flow | Yes fixes disposition; No unlocks next high-to-low question |
| D4 | Add care-advice action panel | give-now/send-later/nurse-note distinctions are visible |
| D5 | Show telemedicine eligibility | eligibility is shown as an indicator, not a decision override |
| D6 | Align Board and Step labels | both views use the same action language and same queue source |

### Workstream E: AI/ML Evaluation and Learning

| Task | Activity | Acceptance criteria |
| --- | --- | --- |
| E1 | Build synthetic STCC-shaped evaluation corpus | adult, pediatric, behavioral, women, male, chronic, older-adult, and aviation cases are covered |
| E2 | Add comparison export | disagreement records export to JSONL without PHI |
| E3 | Add model scorecard | unsafe downgrade, hallucination, citation, and agreement metrics are reported |
| E4 | Add prompt/version registry | each model output links to model, prompt, corpus, and policy version |
| E5 | Add nurse correction taxonomy | corrections distinguish keyword issue, protocol rank issue, clinical override, or no model issue |
| E6 | Add regression suite | model changes cannot pass if safety or citation tests fail |

### Workstream F: Governance, Privacy, and Operations

| Task | Activity | Acceptance criteria |
| --- | --- | --- |
| F1 | Define licensed content governance SOP | STCC source content, local overlay, and approved changes are separated |
| F2 | Define AI use policy | allowed and prohibited LLM actions are documented in Help/Library |
| F3 | Define privacy boundary | PHI masking, retention, reveal workflow, and audit are documented |
| F4 | Define clinical review workflow | protocol changes and RAG shadow suggestions require role-based approval |
| F5 | Define cloud deployment controls | GCP Doha private endpoint, IAM, KMS, audit logs, and VPC controls are planned |
| F6 | Define rollback plan | failed import, unsafe model output, or bad release can be reverted |

### Workstream G: English Voice AI and MedGemma Adaptation

| Task | Activity | Acceptance criteria |
| --- | --- | --- |
| G1 | Implement the governed voice state machine | every normal and exception transition is idempotent, auditable, resumable, and cannot bypass nurse validation |
| G2 | Build approved English audio registry | each fixed clinical prompt is linked to question/release/checksum, approved, versioned, and license-permitted |
| G3 | Add streaming STT and barge-in handling | caller interruption pauses playback, captures the full utterance, and never advances on partial or low-confidence text |
| G4 | Add constrained MedGemma interpreter contract | model output is schema-validated, ID-bounded, source-grounded, and rejected when unsupported or unsafe |
| G5 | Add nurse transcript validation workspace | nurse can play synchronized audio and accept, correct, reject, or re-ask every initial-assessment answer |
| G6 | Build governed adaptation dataset | synthetic/de-identified rows, leakage-safe splits, immutable safety set, dataset card, and rights approval exist |
| G7 | Fine-tune and register a MedGemma adapter | adapter targets extraction/classification only and includes model, data, code, metric, limitation, and rollback lineage |
| G8 | Run shadow comparison and safety UAT | Chrome/API/call journeys cover interruptions, uncertainty, disconnection, emergency transfer, model outage, and nurse correction with zero unsafe advancement |

## 10. Suggested Delivery Milestones

### Milestone 1: Design Lock

- approve this architecture
- approve STCC data model extension list
- approve RAG boundary
- approve nurse action tabs
- approve AI/ML evaluation metrics

### Milestone 2: Database and Import Readiness

- add schema extensions
- build importer staging
- build validation reports
- run synthetic import
- generate import lineage report

### Milestone 3: RAG Shadow Pilot

- index synthetic STCC-shaped content
- run LLM/RAG in dry-run shadow mode
- show nurse/system/LLM comparison
- export learning events
- block unsafe outputs

### Milestone 3A: English Voice AI Shadow Pilot

- approve English recording notice, prompts, and clinical audio assets
- run streaming STT, barge-in, confirmation, uncertainty, and transfer flows
- deploy the MedGemma interpreter adapter in shadow-only mode
- show synchronized transcript and per-answer validation to the nurse
- prove deterministic STCC ordering and safety floors remain authoritative
- prove nurse-led fallback when voice, speech, retrieval, or model services fail

### Milestone 4: Clinical UAT

- run adult and pediatric pathways
- run emergency, urgent, routine, and self-care cases
- run fit-to-fly overlay cases
- run telemedicine eligibility cases
- run nurse correction and disagreement scenarios

### Milestone 5: Licensed STCC Import Readiness

- confirm license and permitted use
- import licensed Access database into staging
- validate rows and relationships
- reconcile local overlays
- run clinical governance sign-off

## 11. Key Open Decisions

1. Whether to store raw STCC tables permanently or only during import.
2. Whether XHTML should be stored in the main clinical tables or a separate content block table.
3. Whether telemedicine eligibility should be a question field, disposition field, or both.
4. Whether RAG indexing should use canonical runtime content only or include raw STCC source records.
5. What exact nurse correction reason taxonomy should drive learning.
6. Which model provider will be used for dry-run RAG and later GCP Doha deployment.
7. What minimum model scorecard is required before any UAT demonstration.
8. Whether the STCC license permits approved audio renditions, embeddings, evaluation rows, derived labels, and any model adaptation.
9. Which English voice, recording notice, retry policy, uncertainty threshold, and emergency-transfer phrase set Clinical Governance approves.
10. Which speech, model-serving, and accelerator capabilities are available in `me-central1`, including quota, latency, failover, and data-residency constraints.

## 12. Current Definition of Done

This architecture has moved past design lock. The next definition of done is implementation readiness for importer, migration, and UAT:

- STCC-compatible schema additions are implemented and validated.
- Deprecated compatibility fields have a migration path and are not removed until runtime/importer code no longer depends on them.
- RAG is explicitly bounded to approved content and stored in a separate learning ledger.
- LLM output is advisory, cited, logged, and blocked from clinical authority.
- Nurse workflow remains simple and action-based.
- Help/Library explains STCC structure, RAG shadow mode, role responsibilities, privacy, audit, and safety floors.
- Help/Library explains the English Voice AI state machine, prerecorded clinical audio, interruption handling, nurse transcript validation, and MedGemma adaptation boundary.
- MedGemma is trained only for constrained language interpretation, remains shadow-only until governed promotion, and cannot reproduce or execute STCC from model weights.
- Importer work can populate references, supplementals, first aid, taxonomy, telemedicine flags, source hashes, and comparison ledgers.
- Test plan includes positive and negative role, safety, protocol, care advice, importer, and AI/ML cases.
