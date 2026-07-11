# First Formal Handover - IST Tech Clinical Triage Platform

Date: 2026-07-11 04:04 +04:00

## Purpose Of This Handover

This is the first formal project handover for the IST Tech Clinical Triage Platform. It is intended to give a start-to-end view of the work completed so far, the current repository and application state, the major design decisions already made, and the open items that should guide the next work session.

Use this file as the project pickup point for anyone joining the workstream cold. It captures both the completed build work and the remaining delivery gaps.

## Repository State

- Repository: `https://github.com/PraveenSahni/medicaltriage`
- Branch: `main`
- Last pushed implementation commit before the first handover: `f05c99f - Build triage simulation and LLM strategy help`
- First handover commit: `a478283 - Add day handover for triage platform`
- Working tree before this update: clean and synced with `origin/main`
- Local app in browser: `http://127.0.0.1:5174/#help`

## Start-To-End Completed Work

This section summarizes the completed work from the beginning of the build conversation through the close of this first handover.

1. Product identity and UI direction were established.
   - The system name was aligned to IST Tech / IST Tele-Triage.
   - The login experience was redesigned toward a simple Apple-like minimal interface.
   - IST Tech branding, light-by-default theme, dark-mode option, and role simulation were added.
   - Internal screens were aligned toward a cleaner, card-light, nurse-focused workflow.

2. Phase I triage engine scope was implemented as a working scaffold.
   - Staff validation exists through a mock/adapter-ready HRMS layer.
   - Vital-sign safety floors exist for RED alert routing.
   - SBAR/SOAP clipboard output exists.
   - Rules-first, AI-second behavior is documented and reflected in the code and tests.

3. Help and Library were expanded and separated.
   - Help now gives role-based operating guidance.
   - Library now gives technical/reference detail for data ingestion, simulation, APIs, CCP, routes, Oracle HCM, governance, security, and LLM strategy.
   - Governance and Security Administration remain separate sections.

4. Security administration and role structure were expanded.
   - Roles were grouped by business prefix: Administration, Security and Privacy, Governance and Quality, Business and Clinical Operations, Integration, Reporting, and User Support.
   - Role access differences were documented in Help/Library.
   - Security Administration help explains login, SSO, masking, reveal, audit, and production hardening concepts.

5. CCP was added as a platform pattern.
   - CCP means Continuous Communication Pipeline.
   - The employee is the index, while each visit/call/teleconsult is a separate thread.
   - Previous threads remain visible to the nurse as linked context.
   - Outbound messages require Remote Triage Nurse review and approval.
   - WhatsApp/SMS and email adapters are documented, with dry-run posture for safety.

6. Oracle Fusion HCM integration strategy was documented.
   - Oracle HCM is the planned staff/dependent source of truth.
   - The frontend keeps calling IST APIs while Oracle sits behind a backend adapter.
   - Public workers, workers, assignments, contacts, dependents, absences, documents, Atom feeds, and HCM Extracts are mapped in Help/Library and docs.

7. Data ingestion and clinical content strategy were documented.
   - Phase I uses sample/open-source-compatible content for engineering validation.
   - The schema is prepared for licensed clinical content later.
   - Seed/import concepts, protocol lifecycle, and validation gates are documented.

8. Synthetic data and simulation engines were added.
   - Synthetic Oracle Fusion HCM-style employee feed.
   - Synthetic dependents, encounters, audit traces, semantic vectors, and LLM-ready rows.
   - Complete clinical simulation engine for employee verification, protocol matching, safety floors, aviation gates, SBAR, simulated FHIR writeback, and audit logging.
   - Regional Qatar context added for heat, humidity, dust, respiratory season, vulnerable groups, and demographic priors.
   - Cohorts cover pediatric/dependent cases, female health, pregnancy red flags, male health, and aviation-duty contexts.

9. LLM / MedGemma strategy was documented in the product.
   - MedGemma is positioned as a governed clinical copilot, not the triage authority.
   - The LLM may summarize, explain, suggest missing questions, draft SBAR, and support bilingual wording.
   - The LLM may not diagnose, approve or downgrade disposition, approve fit-to-duty, approve sickness leave, bypass red floors, or send CCP messages without nurse approval.
   - Cloud strategy targets private GCP Doha `me-central1` deployment after service, quota, privacy, security, clinical, and cost approvals.

10. Word reference documents were included in Git.
    - `IST Qatar Clinical Triage & Symptom Screening System_ Enterprise Reference Architecture & Implementation Blueprint.docx`
    - `IST Qatar Triage Platform_ Phase I Manual.docx`

## Completed In The Final Build Pass

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

## Open Items By Workstream

### Product And UI

- Continue simplifying the triage workspace for a nurse handling one incoming call at a time.
- Add stronger filtering and detail views for synthetic data records inside the application.
- Review all Help/Library language with clinical, governance, and client-facing eyes.

### Phase I Backend And Database

- Provision a PostgreSQL or Cloud SQL database.
- Run Prisma migration and seed.
- Capture protocol, staff, dependent, encounter, and audit row counts.
- Decide how much PHI, if any, is persisted in Phase I versus kept in-memory and handed off to EMR.

### Clinical Content

- Replace sample Phase I content with licensed STCC/SymptomScreen or another approved clinical source before production.
- Validate pediatric thresholds, adult red floors, care advice, local route mapping, and Arabic clinical wording with governance.
- Establish release, versioning, rollback, and review cadence for protocol content.

### Oracle Fusion HCM

- Confirm tenant URL, authentication pattern, least-privilege roles, and approved fields.
- Build the live Oracle HCM adapter behind `POST /api/v1/staff/validate`.
- Confirm whether dependents live in Oracle HCM Contacts/Contact Relationships for the operating organization.
- Confirm whether absence/document writeback is in scope for Phase I or later.

### CCP Communication

- Keep dry-run by default until Twilio and Microsoft Graph secrets, signed webhook URL, mailbox scoping, and governance approval are complete.
- Persist CCP messages and inbound records in a durable store rather than in-memory demo state.
- Add delivery receipts, retry/backoff, dead-letter handling, and retention controls.

### Simulation And AI Evaluation

- Build a formal AI evaluation pipeline from the synthetic JSONL.
- Add train/validation/test splits.
- Add scorecards for downgrade refusal, nurse-approval wording, pediatric routing, female-health context, male-health context, Qatar seasonal context, and CCP send-approval language.
- Surface evaluation results in Help/Library, Admin, or a dedicated governance dashboard.

### LLM / MedGemma

- Implement the LLM adapter contract in dry-run mode first.
- Confirm whether MedGemma is the approved model for UAT or whether another model is required.
- Verify GCP Doha `me-central1` service availability, accelerator availability, and quota for the chosen serving path.
- Do not fine-tune on real PHI without legal, DPO, clinical, and security sign-off.

### GCP Cloud Deployment

- Define the Phase I GCP Qatar architecture for Cloud Run/GKE, Cloud SQL, Secret Manager, VPC, KMS, logging, and monitoring.
- Decide whether model serving uses private GKE, Vertex AI custom endpoint, or a staged CPU/quantized inference path.
- Add deployment IaC or runbook once the cloud target is approved.

### Compliance And Governance

- Complete DPIA/privacy assessment.
- Confirm Qatar data-law and GDPR control mapping with legal/privacy teams.
- Establish audit retention, masking, reveal, export, and deletion policies.
- Obtain clinical governance sign-off before production clinical use.

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
