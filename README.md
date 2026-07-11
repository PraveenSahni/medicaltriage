# IST Qatar Tele-Triage MVP Scaffold

This repository contains the code scaffold requested in the consolidated developer prompt for an IST Qatar tele-triage and symptom-screening MVP.

The implementation follows a rules-first, AI-second shape:

- Prisma/PostgreSQL schema for STCC-style protocol tables, IST staff/dependent records, aviation triage encounters, and safety audit logs.
- TypeScript Express API with `/api/v1/staff/validate`, `/api/v1/protocols/*`, and `/api/v1/triage/*` routes.
- Mock HRMS validation, dependent mapping, insurance eligibility checks, localized disposition routing, aviation rule tags, and SBAR clipboard payload generation.
- Phase 1 clinical content importer with release/import audit tables, keyword search indexes, and a synthetic sample package for local development.
- Python safety wrapper that blocks an LLM downgrade when the deterministic mock rules classify an encounter as `Emergency`, then writes the explainability trace to SQLite.

Important: the clinical rules in this scaffold are mock thresholds for software wiring only. Production deployment requires licensed clinical content, local clinical governance, privacy review, security review, and approved HRMS/EMR integrations.

## Project Layout

```text
prisma/schema.prisma             PostgreSQL schema
src/index.ts                     Express app entrypoint
src/routes/staff.ts              POST /api/v1/staff/validate
src/routes/protocols.ts          GET /api/v1/protocols search/detail/care-advice
src/routes/triage.ts             POST /api/v1/triage/start and /encounters/evaluate
src/services/*                   HRMS, Oracle HCM target adapter, insurance, aviation, disposition, SBAR, audit helpers
src/scripts/importClinicalContent.ts Phase 1 clinical content importer
docs/phase-1-gcp-qatar.md        GCP Qatar Phase 1 deployment and import notes
docs/oracle-fusion-hcm-integration.md Oracle Fusion HCM API catalogue and adapter plan
frontend/src/TriageWorkspace.tsx Responsive nurse triage workspace
frontend/src/Dashboard.tsx       Operations and safety officer dashboard
frontend/src/HelpCenter.tsx      Help/About tabs
frontend/src/global.css          Tailwind component layer and clinical styling
python/safety_wrapper.py         AI copilot safety wrapper with SQLite audit logging
python/example_emergency_payload.json
```

## TypeScript API

Install dependencies, generate Prisma client, and run the API:

```bash
pnpm install
pnpm prisma:generate
pnpm dev
```

## Local PostgreSQL Live-Mode Test

Use the local Docker Compose database when you want to validate live-mode Prisma writes and reads without provisioning GCP Cloud SQL.

1. Copy `.env.example` to `.env` and keep the local database values aligned. The API loads `.env` at startup without requiring an extra dotenv package:

```env
DATABASE_URL="postgresql://triage_user:triage_password@localhost:5432/ist_triage?schema=public"
POSTGRES_USER=triage_user
POSTGRES_PASSWORD=triage_password
POSTGRES_DB=ist_triage
POSTGRES_PORT=5432
```

2. Start PostgreSQL and apply the Prisma schema:

```bash
pnpm db:local:up
pnpm prisma:migrate
pnpm db:seed
```

3. For a live-mode persistence run, set the required integration variables before starting the API:

```env
MOCK_MODE=false
ADMIN_PASSWORD="replace-with-a-secure-local-uat-password"
AUTH_JWT_SECRET="replace-with-a-long-random-secret"
ORACLE_HCM_BASE_URL="https://example.fa.oraclecloud.com"
EMR_BASE_URL="https://example-emr.local"
TWILIO_ACCOUNT_SID="local-placeholder"
TWILIO_AUTH_TOKEN="local-placeholder"
```

The server rejects `MOCK_MODE=false` if `ADMIN_PASSWORD` is missing or still set to the mock local fallback. The frontend role simulator uses `VITE_DEMO_ADMIN_PASSWORD` only for local demos; do not expose a production administrator secret through Vite/browser configuration.

Run the frontend SPA:

```bash
pnpm dev:web
```

Build the frontend:

```bash
pnpm typecheck:web
pnpm build:web
```

Dry-run the Phase 1 clinical content package:

```bash
pnpm content:dry-run
```

Import clinical content into PostgreSQL or Cloud SQL after `DATABASE_URL` is configured:

```bash
pnpm content:import
```

Search the active Phase 1 protocol package:

```bash
curl "http://localhost:8080/api/v1/protocols/search?q=chest%20tightness&ageYears=32"
```

Example evaluation payload:

```json
{
  "istStaffId": "IST-10001",
  "nurseId": "nurse-42",
  "aiRecommendationSeverity": "Routine",
  "symptoms": {
    "chiefComplaint": "Chest tightness",
    "narrative": "Cabin crew reports chest tightness and sweating for more than one hour.",
    "language": "en",
    "ageYears": 32,
    "durationMinutes": 75,
    "redFlags": ["sweating", "chest pain"]
  },
  "aviationContext": {
    "crewRole": "cabin_crew",
    "onDuty": true,
    "sicknessLeaveRequested": true
  }
}
```

Send it to:

```bash
curl -X POST http://localhost:8080/api/v1/triage/encounters/evaluate \
  -H "Content-Type: application/json" \
  -d @payload.json
```

## Python Safety Wrapper

Run the emergency downgrade-blocking example:

```bash
python python/safety_wrapper.py --payload-file python/example_emergency_payload.json
```

The result includes:

- `rules_engine_severity`
- `llm_severity`
- `downgrade_blocked`
- `final_severity`
- `explainability_trace`

The same trace is written to `python/audit.sqlite3` in the `safety_audit_deviation_log` table.

## Integration Notes

- Replace `src/services/hrms.ts` with the Oracle Fusion HCM adapter while preserving the return contract. The target Oracle APIs are documented in `docs/oracle-fusion-hcm-integration.md` and surfaced in the Help > Integration tab.
- Replace synthetic Phase 1 protocol content and mock triage rules with licensed STCC content or an approved clinical rules service.
- EMR/FHIR writeback starts through `POST /api/v1/emr/writeback/:encounterId`. It builds a nurse-approved FHIR R4 `DocumentReference` in dry-run mode by default, checks QHIE consent, routes adult cases to Cerner-style HMC/PHCC targets and pediatric cases to Epic-style Sidra targets, and stores only non-PHI status metadata in audit events.
- Clinical AI approval starts through `/api/v1/approval`. The queue and review endpoints force feature-level reasoning review before EMR writeback or patient communication can proceed; the Safety Officer dashboard is available in Admin > AI Safety for audit-enabled roles.
- Python AI safety scoring is implemented in `python/TriageSafetyScorecard.py` and can be regression-tested with `npm run test:ai-scorecard`.
- Connect Prisma persistence only after the PHI retention policy is approved. The API scaffold currently treats clinical payloads as ephemeral and returns the SBAR clipboard payload without writing PHI.
- Use the `SafetyAuditDeviationLog` model and Python SQLite trace as the starting point for the Safety Officer dashboard.
- Target GCP Qatar region `me-central1` for Cloud Run, Cloud SQL PostgreSQL, and Cloud Run Jobs. See `docs/phase-1-gcp-qatar.md`.
- Use Oracle Fusion HCM `publicWorkers`, `workers`, work relationships, assignments, HCM contacts, absences, document records, Atom feeds, and HCM Extracts for the HRMS connector after service-account roles and data-governance gates are approved.
