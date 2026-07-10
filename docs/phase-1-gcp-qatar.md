# Phase 1: GCP Qatar SaaS Triage Engine

This Phase 1 slice establishes the core SaaS triage engine foundation for IST Qatar, targeting Google Cloud region `me-central1` in Doha.

The included clinical content is synthetic and exists only to prove the software flow. Licensed STCC content must be obtained and imported before production clinical use.

## What Is Built

- Clinical content release model for versioned protocol packages.
- Import job and import error audit tables for controlled content loading.
- Protocol keyword index, synonym, disposition map, and question-to-care-advice links.
- Synthetic Phase 1 content package with five protocol examples:
  - Chest Pain or Tightness - Adult
  - Fever - Child
  - Breathing Problem
  - Abdominal Pain
  - Rash or Vaccination Reaction
- API routes under `/api/v1/protocols`:
  - `GET /api/v1/protocols/releases/current`
  - `GET /api/v1/protocols/search?q=chest&ageYears=32`
  - `GET /api/v1/protocols/:protocolId`
  - `GET /api/v1/protocols/:protocolId/care-advice?positiveQuestionIds=q1,q2`
- Encounter evaluation now accepts:
  - `protocolId`
  - `selectedQuestionIds`
- The frontend searches the protocol API and renders the matched protocol in strict acuity order.
- The frontend keeps a local synthetic fallback when the API is offline.
- Clipboard SBAR generation remains available from the final disposition panel.

## GCP Qatar Target Shape

| Layer | GCP Qatar Target |
| --- | --- |
| Frontend/API containers | Cloud Run in `me-central1` |
| Relational clinical content DB | Cloud SQL for PostgreSQL in `me-central1` |
| Content import execution | Cloud Run Jobs in `me-central1` |
| Licensed package staging | Region-pinned Cloud Storage bucket, approved for Qatar residency |
| Secrets | Secret Manager, scoped IAM, least privilege service accounts |
| Custom domain | External HTTPS Load Balancer with serverless NEG for Cloud Run |
| Analytics | De-identified export only, after governance approval |

## Content Import Flow

1. Receive the licensed STCC package through the approved vendor/licensing channel.
2. Store the raw package in a controlled GCS bucket in the approved Qatar residency design.
3. Run the importer as a Cloud Run Job.
4. Validate schema and content counts before writing.
5. Write `ProtocolRelease`, `Algorithm`, `TriageQuestion`, `CareAdvice`, keyword indexes, localized dispositions, and import audit rows.
6. Keep the active release immutable. Load updates as a new `ProtocolRelease`.
7. Retire old releases only after clinical governance approval.

## Local Commands

Validate the Prisma schema:

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/ist_triage" pnpm prisma validate
```

Dry-run the synthetic package without a database:

```bash
pnpm content:dry-run
```

Import to PostgreSQL or Cloud SQL after `DATABASE_URL` is configured:

```bash
pnpm content:import
```

Run API and frontend:

```bash
pnpm dev:api
pnpm dev:web
```

## Phase 1 Remaining Work

- Replace synthetic content with licensed STCC content.
- Confirm final STCC delivery format and field mapping.
- Add Cloud SQL migration execution in CI/CD.
- Add Cloud Run Job deployment and IAM for the importer.
- Add automated tests for protocol search, acuity ordering, and care-advice mapping.
- Add authentication, tenant controls, PHI retention policy, and production audit retention.
- Add production observability dashboards and clinical safety review workflow.
