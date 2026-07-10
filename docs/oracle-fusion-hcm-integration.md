# Oracle Fusion HCM Integration Plan

This note defines how the IST Qatar triage platform should integrate with Oracle HRMS / Oracle Fusion Cloud HCM while keeping the clinical triage engine independent from Oracle-specific payloads.

The target pattern is an adapter behind the existing IST API:

```text
Frontend
  -> POST /api/v1/staff/validate
  -> POST /api/v1/triage/start
  -> POST /api/v1/triage/encounters/evaluate

Backend adapters
  -> Oracle Fusion HCM REST for staff, assignment, contact, absence, document context
  -> Insurance eligibility connector
  -> EMR / Oracle Health connector
  -> Scheduling connector
  -> Analytics export
```

## Connector Principles

- Keep the frontend and triage rules on IST-owned API contracts.
- Treat Oracle Fusion HCM as the staff and dependent source of truth, not as the clinical decision engine.
- Start read-only for staff validation, duty assignment, department, contact, and absence lookup.
- Store credentials in GCP Secret Manager and run the adapter in GCP Qatar region `me-central1`.
- Cache only the minimum snapshot needed for a triage call: active worker status, assignment, department, job title, duty status, dependent relationship, callback detail, insurance handoff fields, and last verification time.
- Do not write absence records, document records, or EMR notes until HR, privacy, and medical governance approve the writeback use case.
- Use Oracle Atom feeds for key employee changes and HCM Extracts for baseline or periodic bulk sync. Avoid high-frequency REST polling against workers.

## Environment Contract

```text
ORACLE_HCM_BASE_URL=https://example.fa.oraclecloud.com
ORACLE_HCM_API_VERSION=11.13.18.05
ORACLE_HCM_AUTH_MODE=oauth2
ORACLE_HCM_READONLY=true
ORACLE_HCM_CACHE_TTL_SECONDS=300
ORACLE_HCM_CONNECT_TIMEOUT_MS=5000
ORACLE_HCM_TOKEN_SECRET_NAME=oracle-hcm-oauth-token
ORACLE_HCM_USERNAME_SECRET_NAME=oracle-hcm-username
ORACLE_HCM_PASSWORD_SECRET_NAME=oracle-hcm-password
```

The request base becomes:

```text
{ORACLE_HCM_BASE_URL}/hcmRestApi/resources/{ORACLE_HCM_API_VERSION}
```

Oracle supports Basic authentication over SSL and bearer-token authentication patterns. For production, prefer OAuth/JWT or the Qatar Airways approved enterprise identity pattern; keep Basic credentials only as a fallback for early sandbox testing.

## Oracle API Catalogue

| Area | Oracle API | IST triage use | Initial mode |
| --- | --- | --- | --- |
| Active staff lookup | `GET /publicWorkers`, `GET /publicWorkers/{PersonId}` | Confirm the staff member exists and is active with the lowest practical data scope. | Read-only |
| Full staff profile | `GET /workers`, `GET /workers/{workersUniqID}` | Resolve PersonId, PersonNumber, worker type, and deeper worker profile fields when public data is not sufficient. | Read-only with HCM roles |
| Assignment and duty context | `GET /workers/{workersUniqID}/child/workRelationships`, `GET /workers/{workersUniqID}/child/workRelationships/{PeriodOfServiceId}/child/assignments`, `GET /publicWorkers/{PersonId}/child/assignments` | Map department, job title, location, legal employer, assignment status, and duty-related context. | Read-only |
| Dependents and contacts | `GET /hcmContacts`, `GET /hcmContacts/{hcmContactsUniqID}/child/contactRelationships` | Map spouse, child, parent, and other dependent relationships into the triage dependent picker where IST stores them in HCM. | Read-only, governed PHI |
| Phone and email | `GET /workers/{workersUniqID}/child/phones`, `GET /workers/{workersUniqID}/child/emails`, `GET /hcmContacts/{hcmContactsUniqID}/child/phones`, `GET /hcmContacts/{hcmContactsUniqID}/child/emails` | Confirm callback details when policy allows the triage team to view them. | Minimum necessary |
| Absence and sickness | `GET /absences`, `POST /absences/action/findByAdvancedSearchQuery`, `POST /absences` | Read existing sickness or absence context. Future writeback can create an absence request after HR approval. | Read first, write later |
| Medical certificates | `GET /documentRecords`, `POST /documentRecords`, `GET /documentRecords/{DocumentsOfRecordId}/child/attachments` | Future storage or retrieval of sickness certificates and fit-to-duty evidence. | Future writeback |
| Change sync | Oracle HCM Atom feeds, HCM Extracts, object snapshots | Keep the staff eligibility cache current without repeatedly polling REST endpoints. | Scheduled integration |

## Canonical Mapping

| IST field | Oracle source candidate |
| --- | --- |
| `istStaffId` | `PersonNumber` or configured external identifier |
| `staffProfile.id` | `PersonId` or `workersUniqID` stored as an internal reference |
| `department` | Assignment department or organization field |
| `jobTitle` | Assignment job/title field |
| `dutyStatus` | Worker/assignment status plus HR absence or leave state |
| `dependents[]` | HCM Contacts plus Contact Relationships |
| `insuranceEligibilityStatus` | Benefits or payer connector, not HCM alone unless IST stores plan eligibility there |
| `insuranceLastChecked` | IST eligibility adapter timestamp |

## Runtime Flow

1. Nurse enters IST staff ID.
2. `POST /api/v1/staff/validate` calls the Oracle HCM adapter.
3. Adapter resolves the worker using `publicWorkers` or `workers` and maps the staff identity.
4. Adapter loads assignment and work relationship data for department, job title, location, and duty context.
5. Adapter loads contact relationship data only if dependents are needed for the current encounter.
6. Adapter optionally checks absences for sickness or duty status context.
7. API returns the normalized `StaffValidationResult` already used by the current frontend.
8. Triage proceeds through protocol search, acuity checklist, final disposition, clipboard note, and audit.

## Governance Gates

- Confirm Qatar Airways Oracle tenant URL and Fusion HCM version path.
- Confirm service account roles and whether `publicWorkers` is sufficient for active worker lookup.
- Confirm where dependents are actually mastered: HCM Contacts, benefits, payer records, or another dependent-management system.
- Confirm whether duty status is represented by assignment status, absence, roster integration, or a separate airline operations system.
- Confirm whether sickness certificates should live in Oracle HCM Document Records, EMR, or both.
- Approve retention, audit, encryption, and access controls before PHI persistence or writeback.

## Oracle Documentation Sources

- REST API for Oracle Fusion Cloud HCM: `https://docs.oracle.com/en/cloud/saas/human-resources/farws/index.html`
- Quick Start, authentication, URL path, Atom feeds, HCM Extracts: `https://docs.oracle.com/en/cloud/saas/human-resources/farws/Quick_Start.html`
- All REST Endpoints: `https://docs.oracle.com/en/cloud/saas/human-resources/farws/rest-endpoints.html`
