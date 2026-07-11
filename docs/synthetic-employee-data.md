# IST Tech Synthetic Employee Data Factory

The synthetic employee generator creates a full aviation workforce and encounter seed dataset for simulation, analytics, AI copilot evaluation, Oracle Fusion HCM adapter testing, and database-load testing.

It is not PHI, not HR truth, and not clinical truth.

The employee source-of-truth pattern is Oracle Fusion HCM first. The generated `staff_members` and `dependents` arrays are normalized IST triage projections derived from synthetic Oracle-style API payloads.

## What It Builds

Default scale:

- 260 active wide-body aircraft.
- 26,000 synthetic staff records.
- 4,300 pilots, split 50 percent captains and 50 percent first officers.
- 5,200 cabin crew, split 15 percent cabin supervisors and 85 percent cabin crew.
- 16,500 engineering, ground operations, and administration staff.
- Dependents assigned to 45 percent of employees.
- 5,000 historical synthetic triage encounters across five clinical profiles.
- 250 safety audit deviation logs.

The generator writes a Prisma-shaped JSON seed file:

```powershell
python python/generate_synthetic_pdp_data.py --print-summary
```

Default output:

```text
data/generated/ist_qatar_seed_data.json
```

For a smaller validation run:

```powershell
python python/generate_synthetic_pdp_data.py --aircraft 10 --encounters 100 --output data/generated/ist_qatar_seed_data_sample.json --print-summary
```

## Prisma-Aligned Tables

The JSON includes normalized database projection arrays using table names and column names:

- `protocol_releases`
- `algorithms`
- `staff_members`
- `dependents`
- `aviation_triage_encounters`
- `safety_audit_deviation_logs`

## Oracle Fusion HCM API Feed

The generated JSON also includes:

```text
oracle_fusion_hcm_api
```

This section is the synthetic source feed for adapter testing. It mirrors the Oracle Fusion HCM API areas already documented for the platform:

- `publicWorkers`
- `workers`
- `workRelationships`
- `assignments`
- `hcmContacts`
- `contactRelationships`
- `absences`

The expected production flow is:

1. Oracle Fusion HCM API returns worker, assignment, contact, dependent, and absence context.
2. The IST backend adapter maps that payload into the stable `POST /api/v1/staff/validate` response.
3. The triage engine uses only the normalized IST staff/dependent context.
4. The database stores only the approved minimum snapshot or projection needed for triage, audit, and operational continuity.

This keeps Oracle-specific payloads out of the nurse workflow and keeps clinical rules independent from HRMS implementation details.

The Prisma enum layer was extended to represent the prompt accurately:

- `DutyStatus.REST_PERIOD`
- `DependentRelationship.SON`
- `DependentRelationship.DAUGHTER`
- `InsuranceEligibilityStatus.SUSPENDED`

## Clinical Profile Mix

The 5,000 default encounter history uses five broad operational profiles:

- High-acuity cardiac emergency.
- Pediatric respiratory distress.
- Cabin crew back pain.
- Pilot ear barotrauma.
- Mandated immunization fever.

The complete bulk clinical simulation expands this mix for AI/ML evaluation with contextual cohorts:

- Pediatric fever, vomiting, and dehydration for child/dependent reasoning.
- Female urinary symptoms for routine female-health reasoning.
- Pregnancy red flags for mandatory emergency escalation.
- Male genitourinary urgent symptoms for sex-specific urgent routing.

These contextual rows include `patient_context`, `biological_sex`, dependent status, aviation role, vitals, route, and expected final severity. They help AI teams evaluate whether a copilot can explain age-specific, child/dependent, female-health, and male-health context without being allowed to override deterministic rules.

The bulk simulation adds a regional overlay for Qatar:

- Day-wise temperature, humidity, apparent heat, wind, dust risk, and respiratory season.
- Health-impact tags for heat stress, dehydration, renal strain, cardiovascular load, dust exposure, asthma/COPD exacerbation, allergic rhinitis, and seasonal respiratory context.
- Population-level demographic priors from public Qatar indicators. These priors guide AI evaluation coverage only; individual triage still depends on Oracle HCM staff/dependent context, clinical findings, and deterministic safety rules.

Open data hydration plan:

- NASA POWER Daily API for daily meteorological values by Doha coordinate.
- Open-Meteo Historical Weather API as an ERA5-style alternative.
- WHO heat/air-quality guidance and WMO sand/dust-storm context for health impact labels.
- World Bank Qatar indicators for national population context.

Each encounter includes:

- Synthetic transcript text.
- Vitals.
- Five-dimensional symptom vector.
- Cosine-similarity protocol match.
- Final deterministic disposition.
- Fit-to-fly impact.
- Clipboard/SBAR-style payload.
- Synthetic metadata for LLM evaluation.
- Contextual metadata such as age band, dependent status, biological sex, pregnancy/red-flag status where applicable, and aviation role.
- Regional metadata such as season, heat risk, dust risk, respiratory season, vulnerable groups, and demographic priors.

## Semantic Matching

The script implements native cosine similarity:

```text
similarity = dot(symptom_vector, protocol_anchor) / (norm(symptom_vector) * norm(protocol_anchor))
```

If similarity is below `0.70`, the encounter is assigned to `UNKNOWN_SYMPTOM`.

## How To Use It Safely

Use this dataset for:

- Load testing.
- Oracle Fusion HCM adapter development and contract tests.
- Demonstrating the call queue and nurse workspace.
- AI copilot prompt regression.
- Evaluating whether the AI defers to rules-first decisions.
- Analytics and dashboard demos.
- Validating database migrations and seed import jobs.

Do not use it for:

- Autonomous clinical decision-making.
- Real employee analytics.
- Real patient care.
- Production safety claims without clinical governance review.

## Validation

Run:

```powershell
python python/test_synthetic_pdp_generator.py
```

The tests verify:

- Workforce counts.
- Oracle-style API collection counts.
- Dependent counts.
- Encounter profile distributions.
- Audit-log volume.
- Full 260-aircraft scale math.
- Prisma-shaped record fields.

## End-To-End Clinical Simulation

The employee data factory feeds the complete clinical simulation engine:

```powershell
python python/clinical_simulation_engine.py --summary
```

That engine consumes the synthetic Oracle HCM feed, verifies staff/dependents,
runs vector matching and nurse triage states, then produces a simulated bilingual
SBAR/FHIR write-back payload.
