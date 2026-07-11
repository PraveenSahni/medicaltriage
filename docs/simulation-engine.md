# IST Tech Synthetic Data Simulation Engine

This engine implements a rules-first discrete state simulation for the IST Tech tele-triage platform.

It is designed for:

- End-to-end workflow testing across call intake, semantic protocol matching, safety floors, aviation gates, routing, and SBAR generation.
- Synthetic queue and encounter data generation for frontend demos.
- LLM copilot evaluation, prompt regression tests, and governed fine-tuning datasets.
- Clinical safety regression testing, especially AI downgrade blocking and RED floor escalation.

It is not designed for:

- Autonomous clinical decision-making.
- Training on real patient data.
- Replacing licensed clinical protocol content.
- Creating production medical advice without governance approval.

## Why The Attached Design Works

The attached design is directionally correct for our system because it matches the existing architecture:

1. Patient ingestion maps to the current call queue and staff/dependent context.
2. Semantic vector matching maps to the protocol search layer.
3. WHO/IITT safety floor maps to `calculateTriageScore`.
4. NEWS2 scoring maps to the existing local NEWS2-style scoring service.
5. Aviation gate maps to `evaluateAviationRules`.
6. Qatar localized routing maps to the existing disposition and SBAR services.
7. Transition logs map to safety audit and AI explainability needs.

The pasted Python needed correction before use: it had missing list values, invalid type names, incomplete assignments, and truncated scenarios. The implementation in this repo fixes those issues and keeps the simulator deterministic and testable.

## API Endpoints

- `GET /api/v1/simulation/scenarios`
  Lists bundled synthetic scenarios.

- `POST /api/v1/simulation/run`
  Runs a supplied synthetic scenario payload.

- `POST /api/v1/simulation/run/:scenarioId`
  Runs one bundled scenario.

- `GET /api/v1/simulation/suite`
  Runs the full suite and returns JSON.

- `GET /api/v1/simulation/suite?format=jsonl`
  Runs the full suite and returns newline-delimited JSON results.

- `GET /api/v1/simulation/training-set`
  Returns LLM-ready JSONL rows. Every row is tagged `synthetic: true`.

## CLI

```powershell
npm run simulation:run
npm run simulation:jsonl
python python/simulation_engine.py --self-test
python python/simulation_engine.py --jsonl
```

For large employee and encounter seed data, use the synthetic employee data factory:

```powershell
python python/generate_synthetic_pdp_data.py --print-summary
```

That generator creates an Oracle Fusion HCM-style synthetic employee API feed,
plus normalized IST triage projections, with 26,000 synthetic staff, dependents,
5,000 historical encounters, vectors, and audit logs at the default
260-aircraft scale.

For the complete prompt-level workflow, use:

```powershell
python python/clinical_simulation_engine.py --summary
```

That orchestration layer combines employee simulation, vector matching, nurse
triage actions, and simulated EMR/FHIR write-back.

## Training / Evaluation Use

Use the JSONL export for:

- Copilot answer evaluation.
- Safety prompt regression tests.
- Fine-tuning non-autonomous explanation and note-drafting behavior.
- Testing that the AI does not downgrade deterministic RED floors.
- Testing contextual understanding for pediatric/dependent cases, female-health presentations, pregnancy red flags, male-health presentations, and aviation-duty constraints.
- Testing Qatar seasonal context such as heat stress, dehydration risk, dust exposure, respiratory season, and demographic priors.

Do not use it to train an autonomous clinical decision engine. The expected output should teach the copilot to defer to deterministic rules and nurse approval.

## Safety Contract

Every generated result includes:

- Synthetic marker.
- State transition log.
- Matched protocol.
- Safety floor result.
- NEWS2-style score.
- Aviation gate output.
- Localized route.
- SBAR note.
- Training row with system/user/assistant messages.
- `patient_context` and `biological_sex` where relevant for contextual AI/ML evaluation.
- `regional_context` with day-wise weather-derived features and demographic-health priors.

The training row intentionally says that AI is advisory and the nurse approves final disposition.
