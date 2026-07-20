# LLM Copilot and MedGemma Cloud Strategy

Last reviewed: 2026-07-17

This document defines how IST Health should use a clinical LLM in the tele-triage platform while preserving the platform's rules-first, AI-second safety model. It also defines the complete English Voice AI initial-assessment profile and the governed MedGemma adaptation lifecycle.

## Strategic Decision

MedGemma, or any other approved clinical LLM, is a copilot. It is not the clinical decision engine.

The deterministic triage engine remains responsible for:

- Red-floor detection from vital signs and high-acuity symptoms.
- Pediatric/adult route selection.
- Aviation medicine gates such as fit-to-fly restriction, outstation escalation, and sickness validation.
- Minimum permitted disposition.
- CCP outbound-message approval gate.

The LLM may assist with:

- Converting an English caller utterance into a constrained structured answer for the active approved question.
- Extracting reason-for-call terms and suggesting approved search words, protocol IDs, and question IDs in shadow mode.
- Detecting contradictions, missing context, already-answered questions, and possible emergency phrases for deterministic evaluation.
- Explaining why the deterministic route was selected.
- Drafting SBAR/SOAP text for nurse review.
- Suggesting missing nurse questions.
- Summarizing prior CCP threads.
- Improving bilingual or plain-language wording.
- Preparing non-authoritative training and governance evidence.

The LLM must not:

- Diagnose autonomously.
- Approve or downgrade a disposition.
- Approve fit-to-duty or sickness leave.
- Override pediatric or adult red floors.
- Send WhatsApp, SMS, or email without Remote Triage Nurse approval.
- Persist or train on live PHI without explicit privacy, legal, and clinical governance approval.
- Recall or reproduce licensed STCC content from model weights.
- Rewrite, invent, skip, or reorder approved clinical questions.
- Advance the workflow when speech is partial, ambiguous, unsupported, or below the approved confidence threshold.

## Source Alignment

Google's current public documentation describes MedGemma as a collection of open models for medical text and image comprehension, built on Gemma 3. Google lists common use cases including medical text comprehension, clinical reasoning, summarization, patient interviewing, and triaging, but also states that MedGemma requires validation for the intended use case and may need prompt engineering, fine-tuning, or agentic orchestration before production use.

Google DeepMind's MedGemma page also states that model outputs are preliminary, require independent verification, and are not intended to directly inform clinical diagnosis, patient management decisions, or treatment recommendations without appropriate validation and clinical correlation.

For the IST Tech platform, that maps cleanly to the current design: the LLM can explain and draft, while rules and nurses decide.

## Phase I MVP Approach

1. Use synthetic-only training and evaluation rows.
   - Input source: `data/generated/.../training/*.jsonl`.
   - Must remain tagged as synthetic.
   - Must include expected output where the AI defers to rules and nurse approval.

2. Build evaluation before training.
   - Check that the model never downgrades emergency or urgent safety floors.
   - Check pediatric, dependent, female-health, pregnancy red-flag, male-health, heat-risk, dust-risk, and aviation-duty explanations.
   - Check that SBAR drafts state nurse approval is required.

3. Use prompt engineering and retrieval first.
   - Inject current deterministic rule trace.
   - Retrieve governed protocol text, SBAR templates, and local route policy.
   - Avoid tuning until evaluation shows a repeatable language-interpretation gap that prompting/retrieval cannot solve.

4. Optional low-cost inference pilot.
   - A quantized MedGemma deployment through `llama.cpp` or a similar CPU inference server can be used for non-PHI or synthetic MVP testing.
   - The backend should call it through a single internal adapter.
   - The frontend must never call the model directly.

5. Keep PHI out of model development.
   - MVP model tests should use synthetic or de-identified data.
   - Any live clinical text must remain minimum-necessary, masked where possible, and governed by approved retention policy.

## English Voice AI Initial Assessment Profile

### Authority and Runtime Pipeline

The approved runtime pipeline is:

```text
Caller speech
  -> streaming speech-to-text
  -> MedGemma structured interpretation in shadow mode
  -> deterministic STCC validation and safety rules
  -> approved question ID
  -> prerecorded English clinical audio
  -> caller confirmation
  -> nurse validation
```

The active STCC release, not MedGemma, supplies the exact question text, order, answer schema, permitted next IDs, disposition map, care advice, and references. The Voice AI collects; MedGemma interprets; deterministic services validate and advance; the nurse confirms and approves.

### Complete Call Flow

1. A provider-neutral call event creates a queue case and plays the approved greeting and recording notice.
2. The platform matches a registered phone number where permitted or collects employee ID and PIN, selects the employee/dependent, obtains DOB from HRMS, and calculates age. Failed identity goes to a person without blocking emergency support.
3. An approved prompt asks for the reason for call. Audio is recorded and transcribed. Deterministic search and bounded RAG independently rank only approved protocol candidates.
4. The deterministic service applies release, age, sex, mode, and status filters. A nurse resolves ambiguous or no-match results.
5. The system plays the approved prerecorded English initial-assessment question linked to the active question ID and release.
6. Voice activity detection supports barge-in: playback pauses or stops, the caller's speech is captured, and the utterance is classified as an answer, emergency statement, clarification, repeat request, human request, or unrelated/unclear speech.
7. MedGemma returns a schema-constrained interpretation. The deterministic service validates IDs, fields, answer values, citations, safety terms, and allowed actions.
8. A clear answer is repeated with an approved confirmation template. An unclear answer is re-asked once and then transferred to the nurse. Partial or low-confidence speech never advances the question path.
9. Emergency checks run after every transcript update. A deterministic trigger immediately stops automation and starts the approved emergency transfer/escalation path.
10. The nurse receives synchronized recording and transcript evidence, identity/age, reason, candidate comparison, every question/answer, confidence, interruptions, contradictions, and emergency findings. The nurse accepts, corrects, re-asks, or rejects each item.
11. Detailed acuity-ordered STCC triage continues in the nurse workspace. The first nurse-confirmed Yes fixes the provisional disposition; No unlocks the next approved item.
12. The nurse confirms disposition, mapped care advice, Qatar destination, fit-to-fly overlay, callback precautions, grounded SBAR/SOAP, handoff, and closing script.

Arabic voice interaction is deferred. Every asset and event in this profile must be explicitly tagged as English.

### Prerecorded Audio and Barge-In

Fixed clinical questions use approved prerecorded audio rather than runtime model-generated wording. The audio registry must bind `protocol_release_id`, `question_id`, `language`, `audio_version`, `clinical_text_checksum`, `speaker_or_voice_id`, approval metadata, and `storage_uri`.

Streaming speech-to-text remains necessary for caller responses. Voice activity detection must preserve the full interruption, playback offset, retry count, and transfer outcome. Runtime text-to-speech is limited to approved dynamic administrative phrases and constrained confirmation templates; it cannot paraphrase STCC clinical content.

### Structured MedGemma Contract

Example output:

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

The adapter must reject unknown fields, unknown or inactive IDs, unsupported answer values, missing lineage, out-of-corpus citations, free-form clinical instructions, autonomous disposition language, and actions outside the allowlist.

## MedGemma Adaptation and Training Plan

MedGemma may be fine-tuned, but it must not be trained to memorize or independently execute STCC. Licensed content stays in the deterministic, versioned protocol database. A versioned LoRA or equivalent adapter may be trained only for constrained clinical-language interpretation.

### Training Tasks

1. **Rights gate**: confirm permission for audio rendition, RAG indexing, embeddings, derived labels, evaluation, and model adaptation. Do not embed verbatim licensed STCC content in weights unless model derivatives are expressly permitted.
2. **Dataset construction**: create synthetic or formally de-identified rows containing transcript context, active protocol release/question ID, allowed answer schema, expected structured answer, permitted action label, candidate approved IDs, and governed nurse correction.
3. **Leakage controls**: split by patient, call, and protocol family; deduplicate near matches; keep an immutable train-free safety and adversarial set.
4. **Adapter training**: optimize extraction, answer classification, contradiction detection, already-answered detection, emergency-term recall, and approved ID ranking. Do not optimize disposition or care-advice generation.
5. **Offline evaluation**: measure field accuracy, top-k protocol recall, no-match precision, emergency recall, contradiction detection, unsupported-output rate, citation validity, subgroup performance, latency, and fail-closed behavior.
6. **Human review**: clinicians review pediatric/adult, dependent, sex-specific, age-band, aviation, ambiguous, interrupted, and emergency samples. Privacy, security, and AI governance approve the dataset and intended use.
7. **Registry**: store base model, adapter, dataset manifest, code, prompt/tool schema, metrics, intended use, limitations, approval, deployment, and rollback lineage.
8. **Shadow deployment**: compare model interpretation with deterministic results and nurse validation without changing clinical state.
9. **Governed learning**: capture nurse corrections only after de-identification and review. Retraining and promotion are offline, versioned events; live calls never update model weights automatically.
10. **Rollback**: feature flags and registry versions must restore the prior adapter or disable model assistance without disabling the nurse-led deterministic workflow.

### Release-Blocking Voice/Model Metrics

- emergency phrase recall meets the clinically approved threshold with zero known unsafe misses in the release set;
- unsafe disposition downgrade rate is 0;
- invented question, advice, route, or unsupported action rate is 0;
- every returned protocol/question ID belongs to the active permitted release;
- structured field accuracy and no-match precision meet approved thresholds;
- partial/low-confidence speech produces no workflow advancement;
- model/STT outage and timeout preserve nurse-led deterministic operation;
- performance is reported by adult/pediatric, patient/dependent, sex, age band, and aviation context;
- Chrome, Edge, API, interrupted-call, disconnected-call, and nurse-correction journeys pass.

## GCP Doha Production Approach

Target hosting region: `me-central1` in Doha, Qatar, subject to final Google Cloud service, accelerator, quota, and enterprise-policy validation.

Production pattern:

1. Private model endpoint.
   - Private GKE service or approved Vertex AI custom endpoint.
   - No public model ingress.
   - Backend-only access through the IST triage API.

2. Serving engine.
   - vLLM for high-concurrency GPU/accelerator serving after quota and performance testing.
   - llama.cpp or another CPU serving path only if latency and throughput are acceptable for the use case.

3. Security perimeter.
   - IAM least privilege.
   - Workload Identity.
   - Secret Manager for endpoint credentials.
   - Cloud KMS for keys.
   - Cloud Audit Logs for model calls and administrative changes.
   - Logging redaction and retention controls.
   - VPC Service Controls around storage, model endpoint, data lake, and approved analytics resources.

4. Governance gates.
   - DPIA/privacy assessment.
   - Qatar data-law review.
   - Clinical governance sign-off.
   - Model-version registry.
   - Dataset lineage.
   - Evaluation scorecard.
   - Known limitations.
   - Rollback plan.
   - Human-in-the-loop operating SOP.

## Implementation Backlog

### 1. Evaluation Pipeline

- Create `train.jsonl`, `validation.jsonl`, and `test.jsonl` from synthetic rows.
- Add safety validators:
  - no autonomous diagnosis language,
  - no disposition downgrade,
  - nurse approval required,
  - emergency route preserved,
  - pediatric route preserved,
  - CCP send approval preserved.
- Produce an evaluation manifest with pass/fail counts by profile, severity, route, age band, sex, and regional context.

### 2. LLM Adapter Contract

Future endpoints:

- `POST /api/v1/ai/copilot/evaluate`
- `POST /api/v1/ai/copilot/draft`

Adapter output:

- `summary`
- `missing_questions`
- `sbar_draft`
- `active_question_id`
- `structured_answer`
- `confidence`
- `emergency_terms_detected`
- `candidate_protocol_ids`
- `recommended_action`
- `source_ids`
- `source_release_id`
- `safety_floor_acknowledgement`
- `cannot_downgrade: true`
- `requires_nurse_approval: true`
- `model_version`
- `prompt_template_version`
- `eval_policy_version`

### 3. Cloud Inference Deployment

- Choose serving mode: GKE + vLLM, GKE + llama.cpp, or Vertex AI custom endpoint.
- Confirm me-central1 service availability and accelerator quota.
- Build private endpoint.
- Attach IAM, KMS, logging, monitoring, and VPC Service Controls.
- Run load tests with synthetic call volumes.
- Confirm fail-closed behavior when the model endpoint is unavailable.

### 4. Model Governance

- Register model version, prompt template version, and evaluation policy.
- Store approved use cases.
- Keep a rollback model and rollback prompt.
- Sample production outputs for quality review.
- Audit all blocked downgrades and nurse overrides.

### 5. English Voice Orchestration

- Implement the audited state machine from call offer through nurse validation and completion.
- Add approved audio registry, playback telemetry, streaming STT, voice activity events, barge-in, confirmation, retry, human request, disconnect, and emergency transfer handling.
- Add synchronized recording/transcript review with per-answer nurse validation.
- Make model, retrieval, speech, and telephony failures fail back to nurse-led deterministic operation.

### 6. MedGemma Adaptation Pipeline

- Obtain licensing, privacy, clinical, and AI governance approval before creating training derivatives.
- Build dataset cards, leakage-safe splits, immutable safety sets, adapter training jobs, evaluation scorecards, and registry promotion/rollback controls.
- Deploy the adapter in shadow-only mode until release thresholds and clinical UAT are signed.
- Prohibit automatic online learning from live calls.

## Current Status

Built:

- Synthetic encounter and training data generation.
- Rules-first clinical simulation.
- AI downgrade blocking.
- LLM-ready JSONL output.
- Help/Library documentation for LLM strategy.
- Approved target architecture for English Voice AI collection and MedGemma shadow interpretation.
- English initial-assessment session and turn contracts with release-bound protocol questions.
- Deterministic mock-runtime orchestration for ordered questions, one clarification, interruption/emergency takeover, nurse validation, and completion gating.
- Role and owner enforcement for clinical sessions and governance-only training export.
- Strict interpretation-only MedGemma adapter contract that rejects clinical outcome fields.
- Nurse-validated or corrected answer export for governed offline adaptation candidates.
- Prisma contracts for initial-assessment questions, clinical audio assets, voice sessions, voice turns, recording governance, transcript timing, STT confidence, and interpreter lineage.
- Focused component tests for normal, uncertain, interrupted, emergency, takeover, validation, authorization, and boundary-rejection paths.

Pending:

- Provider/model adapter.
- Live MedGemma endpoint.
- Evaluation scorecard runner.
- Cloud deployment in GCP Doha.
- Model registry.
- Production privacy and clinical approvals.
- English audio asset registry and STCC rendition/training rights confirmation.
- Persistent database repository for the prepared Voice AI schema and idempotent telephony event/resume handling.
- Streaming STT, voice activity/barge-in media control, approved audio playback, disconnect recovery, and emergency-transfer integration.
- Nurse synchronized recording/transcript and per-answer validation frontend with masked playback controls.
- MedGemma adaptation dataset, private inference endpoint, adapter training job, model registry, scorecard, and voice/model safety UAT.

## References

- Google for Developers, MedGemma: `https://developers.google.com/health-ai-developer-foundations/medgemma`
- Google for Developers, MedGemma 1 model card: `https://developers.google.com/health-ai-developer-foundations/medgemma/model-card-v1`
- Google for Developers, MedGemma get started: `https://developers.google.com/health-ai-developer-foundations/medgemma/get-started`
- Google DeepMind, MedGemma: `https://deepmind.google/models/gemma/medgemma/`
- Google Cloud Speech-to-Text voice activity events: `https://docs.cloud.google.com/speech-to-text/docs/voice-activity-events`
- Google Cloud Vertex AI locations: `https://cloud.google.com/vertex-ai/docs/general/locations`
- Google Cloud Compute Engine regions and zones: `https://docs.cloud.google.com/compute/docs/regions-zones`
- Google Cloud VPC Service Controls overview: `https://docs.cloud.google.com/vpc-service-controls/docs/overview`
