# LLM Copilot and MedGemma Cloud Strategy

Last reviewed: 2026-07-11

This document defines how IST Tech should use a clinical LLM in the tele-triage platform while preserving the platform's rules-first, AI-second safety model.

## Strategic Decision

MedGemma, or any other approved clinical LLM, is a copilot. It is not the clinical decision engine.

The deterministic triage engine remains responsible for:

- Red-floor detection from vital signs and high-acuity symptoms.
- Pediatric/adult route selection.
- Aviation medicine gates such as fit-to-fly restriction, outstation escalation, and sickness validation.
- Minimum permitted disposition.
- CCP outbound-message approval gate.

The LLM may assist with:

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
   - Avoid tuning until evaluation shows a repeatable gap that prompting/retrieval cannot solve.

4. Optional low-cost inference pilot.
   - A quantized MedGemma deployment through `llama.cpp` or a similar CPU inference server can be used for non-PHI or synthetic MVP testing.
   - The backend should call it through a single internal adapter.
   - The frontend must never call the model directly.

5. Keep PHI out of model development.
   - MVP model tests should use synthetic or de-identified data.
   - Any live clinical text must remain minimum-necessary, masked where possible, and governed by approved retention policy.

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

## Current Status

Built:

- Synthetic encounter and training data generation.
- Rules-first clinical simulation.
- AI downgrade blocking.
- LLM-ready JSONL output.
- Help/Library documentation for LLM strategy.

Pending:

- Provider/model adapter.
- Live MedGemma endpoint.
- Evaluation scorecard runner.
- Cloud deployment in GCP Doha.
- Model registry.
- Production privacy and clinical approvals.

## References

- Google for Developers, MedGemma: `https://developers.google.com/health-ai-developer-foundations/medgemma`
- Google DeepMind, MedGemma: `https://deepmind.google/models/gemma/medgemma/`
- Google Cloud Compute Engine regions and zones: `https://docs.cloud.google.com/compute/docs/regions-zones`
- Google Cloud VPC Service Controls overview: `https://docs.cloud.google.com/vpc-service-controls/docs/overview`
