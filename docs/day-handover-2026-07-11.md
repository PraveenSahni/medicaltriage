# Day Handover - IST Tech Clinical Triage Platform

Date: 2026-07-11 04:04 +04:00

## Repository State

- Repository: `https://github.com/PraveenSahni/medicaltriage`
- Branch: `main`
- Last pushed commit: `f05c99f - Build triage simulation and LLM strategy help`
- Working tree before this handover file: clean and synced with `origin/main`
- Local app in browser: `http://127.0.0.1:5174/#help`

## What Was Completed

1. Help and Library were expanded and separated.
   - Help now gives role-based operating guidance.
   - Library now gives technical/reference detail for data ingestion, simulation, APIs, CCP, routes, Oracle HCM, governance, security, and LLM strategy.
   - Governance and Security Administration remain separate sections.

2. Triage workspace was simplified and expanded.
   - Nurse-facing workflow is step-based and less cluttered.
   - Incoming call pipeline and stage progression were added conceptually in the workspace.
   - Synthetic data visibility was added so generated records can be reviewed from the system rather than only from files.

3. Synthetic data and simulation engines were added.
   - Synthetic Oracle Fusion HCM-style employee feed.
   - Synthetic dependents, encounters, audit traces, semantic vectors, and LLM-ready rows.
   - Complete clinical simulation engine for employee verification, protocol matching, safety floors, aviation gates, SBAR, simulated FHIR writeback, and audit logging.
   - Regional Qatar context added for heat, humidity, dust, respiratory season, vulnerable groups, and demographic priors.
   - Cohorts cover pediatric/dependent cases, female health, pregnancy red flags, male health, and aviation-duty contexts.

4. LLM / MedGemma strategy was documented in the product.
   - MedGemma is positioned as a governed clinical copilot, not the triage authority.
   - The LLM may summarize, explain, suggest missing questions, draft SBAR, and support bilingual wording.
   - The LLM may not diagnose, approve or downgrade disposition, approve fit-to-duty, approve sickness leave, bypass red floors, or send CCP messages without nurse approval.
   - Cloud strategy targets private GCP Doha `me-central1` deployment after service, quota, privacy, security, clinical, and cost approvals.

5. Word reference documents were included in Git.
   - `IST Qatar Clinical Triage & Symptom Screening System_ Enterprise Reference Architecture & Implementation Blueprint.docx`
   - `IST Qatar Triage Platform_ Phase I Manual.docx`

## Key Files Added Or Updated

- `frontend/src/HelpCenter.tsx`
- `frontend/src/TriageWorkspace.tsx`
- `frontend/src/global.css`
- `src/routes/simulation.ts`
- `src/services/simulationEngine.ts`
- `src/scripts/generateSimulationDataset.ts`
- `python/generate_synthetic_pdp_data.py`
- `python/simulation_engine.py`
- `python/clinical_simulation_engine.py`
- `python/run_bulk_clinical_simulation.py`
- `python/regional_context.py`
- `docs/synthetic-employee-data.md`
- `docs/simulation-engine.md`
- `docs/clinical-simulation-engine.md`
- `docs/llm-cloud-strategy.md`
- `docs/oracle-fusion-hcm-integration.md`

## Validation Completed

Passed:

- `npm.cmd run typecheck:web`
- `npm.cmd run build:web`
- `npm.cmd run build`
- Bundled Python: `python/test_clinical_simulation_engine.py`
- Bundled Python: `python/test_bulk_clinical_simulation.py`
- Bundled Python: `python/test_synthetic_pdp_generator.py`
- Bundled Python: `python/test_simulation_engine.py`

Browser verification:

- Help landing page shows the LLM guide and LLM strategy button.
- Library topic opens with `LLM Copilot and MedGemma Cloud Strategy`.
- Integration tab shows GCP Doha implementation tasks and planned LLM API rows.
- Synthetic data panel was previously verified in the workspace.

Note:

- `python` is not currently available on the shell PATH. Python tests passed with the bundled runtime at:
  `C:\Users\PraveenSAHNI\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`
- The `package.json` Python scripts still call `python`. Next session should either add Python to PATH, update scripts to use a configured runtime, or document the local execution requirement.

## Current Architecture Position

The system is now a Phase I rules-first tele-triage MVP with strong simulation and governance scaffolding.

Current live/working scope:

- Frontend triage workspace.
- Help / Library / Governance / Security Admin content.
- Mock/stubbed enterprise integration boundaries.
- Synthetic employee and clinical data generation.
- Simulation API and training-row generation.
- AI safety wrappers and downgrade-blocking tests.
- LLM strategy and GCP Doha cloud migration plan.

Not production-live yet:

- Licensed STCC/SymptomScreen clinical content.
- Live Oracle Fusion HCM connector.
- Live EMR / Oracle Health / FHIR writeback.
- Live Twilio / Microsoft Graph outbound sends beyond dry-run posture.
- Live MedGemma model endpoint.
- Real LLM training or provider fine-tuning.
- Production PostgreSQL/Cloud SQL seed proof.
- Legal/DPO/clinical governance sign-off for PHI persistence, training, and model serving.

## Important Design Decisions

1. Rules-first, AI-second remains non-negotiable.
   - Deterministic clinical floors are outside the model.
   - AI can explain and draft, not decide.

2. MedGemma strategy is evaluation-first.
   - Start with synthetic JSONL evaluation.
   - Use prompt engineering and retrieval before fine-tuning.
   - Fine-tuning requires dataset lineage, validation scorecards, rollback, and approval.

3. GCP Qatar strategy is private-first.
   - Target region: `me-central1`.
   - Candidate deployment: private GKE or approved Vertex AI custom endpoint.
   - Required controls: IAM, KMS, Secret Manager, audit logs, redaction, VPC Service Controls, model registry, and DPO/clinical approvals.

4. CCP remains nurse-approved.
   - Two-way communication is supported conceptually and through adapters.
   - Outbound employee messages are sent only after Remote Triage Nurse review and approval.

5. Synthetic data is for evaluation and training workflows only.
   - It is not clinical truth.
   - It contains no real PHI.
   - Generated output files under `data/generated/` are ignored by Git.

## Recommended Next-Day Starting Points

1. Fix Python script portability.
   - Decide whether to update `package.json` scripts or set a documented local PATH.

2. Add an AI evaluation pipeline.
   - Create train/validation/test splits from synthetic JSONL.
   - Add safety validators for downgrade refusal, nurse-approval wording, pediatric routing, gender/age context, Qatar seasonal context, and CCP approval.
   - Surface evaluation status in Help/Library or Admin dashboard.

3. Implement the LLM adapter contract in dry-run mode.
   - Future endpoints:
     - `POST /api/v1/ai/copilot/evaluate`
     - `POST /api/v1/ai/copilot/draft`
   - Return structured advisory fields only.

4. Improve synthetic data visibility in the UI.
   - Add filters by cohort, severity, route, season, heat risk, dust risk, and patient context.
   - Add a small record-detail drawer for audit and training-row inspection.

5. Prepare Phase I database proof.
   - Provision local or Cloud SQL PostgreSQL.
   - Run Prisma migration and seed.
   - Capture row counts and seed proof in docs or dashboard.

6. Review cloud deployment backlog.
   - Confirm GCP service availability and quotas in `me-central1`.
   - Define Cloud Run/GKE/Cloud SQL/VPC/Secret Manager architecture.
   - Decide where MedGemma will run for UAT.

## Open Risks

- Help and Library are now comprehensive, but the system still needs a final clinical review pass for exact language.
- The current simulation is synthetic and deterministic; it must not be interpreted as validated clinical evidence.
- Word documents are committed as binary artifacts and will increase repository size.
- GCP service availability for the exact MedGemma serving path must be verified before making infrastructure commitments.
- Legal and privacy review is required before any live PHI persistence, LLM inference, or training workflow.

## Resume Prompt For Next Session

Start by reading:

1. `docs/day-handover-2026-07-11.md`
2. `docs/llm-cloud-strategy.md`
3. `docs/clinical-simulation-engine.md`
4. `frontend/src/HelpCenter.tsx`
5. `frontend/src/TriageWorkspace.tsx`

Then check:

```powershell
git status --short --branch
npm.cmd run typecheck:web
npm.cmd run build
npm.cmd run build:web
```

Use bundled Python if `python` is not on PATH:

```powershell
& 'C:\Users\PraveenSAHNI\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' python/test_clinical_simulation_engine.py
```
