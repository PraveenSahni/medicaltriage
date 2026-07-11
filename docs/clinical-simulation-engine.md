# Complete Clinical Triage Simulation Engine

The complete simulation engine is the orchestration layer for end-to-end IST Tech tele-triage simulation.

It connects four modules:

1. `EmployeeSimulator`
2. `VectorKnowledgeEngine`
3. `TriageNurseSimulator`
4. `EMRWritebackEngine`

The goal is to test the full journey before live production integrations are connected:

```text
Oracle Fusion HCM-style synthetic employee feed
  -> staff/dependent verification
  -> symptom vector protocol retrieval
  -> nurse triage state machine
  -> WHO/IITT safety floor
  -> NEWS2 scoring when stable
  -> aviation medicine gates
  -> localized Qatar routing
  -> bilingual SBAR
  -> simulated FHIR transaction
  -> safety audit deviation log
```

## Run

Full default scale:

```powershell
python python/clinical_simulation_engine.py --summary
```

Fast sample:

```powershell
python python/clinical_simulation_engine.py --aircraft 10 --encounters 100 --summary
```

Unit tests:

```powershell
python python/test_clinical_simulation_engine.py
```

## Bulk Runs

For a 100-record rehearsal with encounter, audit, and LLM-ready training partitions:

```powershell
python python/run_bulk_clinical_simulation.py --records 100 --start-date 2024-01-01 --end-date 2024-01-31 --output-dir data/generated/bulk_clinical_sim_100 --aircraft 10 --audit-rate 0.10
```

For the planned 1,000,000-record run:

```powershell
python python/run_bulk_clinical_simulation.py --records 1000000 --start-date 2024-01-01 --output-dir data/generated/bulk_clinical_sim_1m --aircraft 260 --audit-rate 0.05
```

The bulk runner streams:

- `encounters/*.jsonl`
- `audit/*.jsonl`
- `training/*.jsonl`
- `manifest.json`

The training partition uses system/user/assistant messages and expected outputs
for LLM copilot evaluation or governed fine-tuning.

The current bulk profile mix is deliberately contextual for AI/ML learning:

- Adult aviation cases: cardiac emergency, cabin crew back pain, pilot ear barotrauma, and mandated immunization fever.
- Pediatric/dependent cases: pediatric respiratory distress and pediatric fever/vomiting/dehydration.
- Female health cases: urinary symptoms and pregnancy red-flag presentations.
- Male health cases: urgent genitourinary presentations.

Every generated encounter carries `patient_context` and `biological_sex` fields where relevant, so model evaluation can check whether the copilot understands age band, dependent status, sex-specific red flags, aviation role, and duty restrictions. These fields are for explanation, drafting, routing rationale, and safety evaluation only; deterministic rules and nurse approval remain authoritative.

The bulk runner also attaches `regional_context` to each row. This adds a
day-wise Qatar context for:

- Temperature, apparent temperature, humidity, wind, heat risk, dust risk, and respiratory season.
- Seasonal impacts such as heat stress, dehydration, renal strain, asthma/COPD exacerbation, allergic rhinitis, and winter respiratory context.
- Vulnerable groups such as children/dependents, pregnancy, older adults, and aviation workers.
- Qatar demographic priors for population-scale AI/ML evaluation, including NCD-aware screening, pediatric/dependent context, female-health workflows, male-health workflows, and aviation duty exposure.

The current test runner uses deterministic climatology so bulk runs are
reproducible offline. Production data hydration should use open daily sources
such as NASA POWER Daily API or Open-Meteo Historical Weather API by Doha
coordinate, then keep the same `regional_context` contract.

## Modules

### EmployeeSimulator

Builds the synthetic aviation workforce from the Oracle Fusion HCM-style feed created by the synthetic data factory.

It validates:

- `ist_staff_id` / Oracle `PersonNumber`
- department
- job title
- duty status
- dependents

### VectorKnowledgeEngine

Provides a five-dimensional semantic codebook:

- `ACUTE_CHEST_PAIN`
- `PEDIATRIC_COUGH`
- `PEDIATRIC_FEVER_DEHYDRATION`
- `LOWER_BACK_PAIN`
- `VACCINE_FEVER`
- `FEMALE_HEALTH`
- `MALE_HEALTH`
- `PILOT_EAR_BAROTRAUMA`
- `UNKNOWN_SYMPTOM`

It applies cosine similarity and falls back to `UNKNOWN_SYMPTOM` below `0.70`.

### TriageNurseSimulator

Runs the step-by-step nurse workflow:

- Patient verification.
- Chief complaint protocol mapping.
- WHO/IITT RED floor.
- Pediatric tachypnea thresholds.
- NEWS2 score for stable cases.
- Aviation medicine gate.
- AI downgrade blocking.
- Localized disposition routing.

### EMRWritebackEngine

Simulates the final write-back gateway:

- Bilingual English/Arabic SBAR Markdown.
- FHIR transaction `Bundle`.
- `Encounter`, `Observation`, and `ClinicalImpression` resources.
- Append-only safety audit deviation log when AI is blocked or nurse rationale is recorded.

No live EMR is called. The payload is for integration testing and governance review.

## Built-In Prompt Cases

The self-running suite executes:

- Case A: active pilot with crushing chest pain and SpO2 91%, routed to HMC Adult ED with fit-to-fly restricted.
- Case B: two-year-old dependent with tachypnea, routed to Sidra Pediatric ED.
- Case C: stable cabin crew lower back injury, routed to IST Medical Centre HIA with flight duties restricted.

## Safety Position

The engine is synthetic-only. It is useful for:

- AI copilot testing.
- Prompt regression.
- Queue simulation.
- Oracle HCM adapter testing.
- Seasonal heat/dust/demographic-context evaluation.
- FHIR payload review.
- Clinical safety demonstration.

It must not be used as autonomous clinical decision support or as evidence from real patient records.
