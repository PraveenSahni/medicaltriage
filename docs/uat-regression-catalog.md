# UAT and Regression Catalogue

## Purpose

This catalogue keeps IST Health validation cumulative, non-duplicative, and aligned with the current product contract. Tests are maintained evidence, not an ever-growing pile of similar scripts.

## Lifecycle Rules

1. **Add** a scenario when a new user behavior, safety rule, role boundary, integration contract, failure mode, or production control is introduced.
2. **Revise** the existing owning scenario when the behavior changes but the underlying risk and contract remain the same.
3. **Split** a scenario only when one case now contains materially independent pass/fail outcomes.
4. **Retire** a scenario when the feature or contract is removed. Record the retirement reason, replacement scenario if any, and release/commit reference.
5. **Do not duplicate** the same role, endpoint, body, and expected outcome. Generated role matrices enforce unique persona/action combinations.
6. **Keep stable IDs** so defects, UAT evidence, releases, and audit findings can refer to the same scenario over time.

## Scenario ID Families

| Prefix | Scope |
| --- | --- |
| `CCG-CAT` | Catalogue integrity and duplicate detection |
| `CCG-SEC` | Signed provider-event security |
| `CCG-EVT` | Event persistence, processing, and idempotency |
| `CCG-IDN` | HRMS identity and queue-entry boundary |
| `CCG-CBK` | Callback request behavior |
| `CCG-REC` | Recording notice, consent, residency, and RAG controls |
| `CCG-PHI` | Masking and minimum-necessary exposure |
| `CCG-CMD` | Nurse call-control commands |
| `CCG-FAIL` | Provider and rollback failure paths |
| `CCG-RBAC` | Role restrictions |
| `CCG-OPS` | Connector status and operations |

## Active Call-Center Scenarios

| ID | Type | Expected evidence |
| --- | --- | --- |
| `CCG-CAT-001` | Control | All maintained scenario IDs are unique. |
| `CCG-SEC-001` | Negative | Forged event signature is rejected. |
| `CCG-EVT-001` | Positive | Signed incoming event creates one HRMS-validated queue case. |
| `CCG-EVT-002` | Positive | Provider retry returns the same session and does not duplicate queue work. |
| `CCG-IDN-001` | Negative containment | Unidentified caller remains outside the clinical queue. |
| `CCG-CBK-001` | Positive | Callback request creates an outbound callback queue case. |
| `CCG-REC-001` | Negative | Recording is rejected when the notice was not played. |
| `CCG-REC-002` | Negative | Recording is rejected when consent is declined. |
| `CCG-REC-003` | Negative | Non-Doha recording location is rejected. |
| `CCG-REC-004` | Negative | Raw recording cannot be marked RAG-eligible. |
| `CCG-PHI-001` | Negative exposure | Session API returns masked ANI, never the raw number. |
| `CCG-CMD-001` | Positive | Incoming answer atomically claims and connects the case. |
| `CCG-CMD-002` | Positive | Callback command creates a connected outbound session. |
| `CCG-FAIL-001` | Negative | Missing adapter does not take a queue lock. |
| `CCG-FAIL-002` | Negative | Provider rejection releases a newly acquired lock. |
| `CCG-RBAC-001` | Negative | Intake-only role cannot execute clinical call control. |
| `CCG-OPS-001` | Positive | Status reports adapter, persistence, region, and RAG boundary. |

The comprehensive role UAT matrix independently checks each unique role/endpoint outcome across all seeded personas, including the call-center status permission boundary.

## Latest Execution Evidence

Validated on 2026-07-17:

- 12 test suites and 577 tests passed.
- 494 unique role-action cases passed across 19 roles and 26 protected endpoints.
- The role matrix contains 280 positive and 214 negative authorization outcomes.
- All 17 provider-neutral call-center scenarios passed.
- Backend and frontend TypeScript checks passed.
- The Prisma schema validated successfully.
- Help Center and Library call-center content was verified in the running frontend.
- Help **Test Results** exposes 593 unique executed cases and 601 execution records with searchable expected/actual evidence.

These totals are a dated baseline, not a target to preserve artificially. Add tests for new risks, revise the owning test when a contract changes, and retire obsolete cases through the register below.

## Retirement Register

No call-center scenarios are retired in this baseline.

When a case becomes obsolete, add a row before deleting or disabling it:

| Retired ID | Date | Reason | Replacement | Approval |
| --- | --- | --- | --- | --- |
| Example only | YYYY-MM-DD | Contract removed or merged | New scenario ID or none | Product and test owner |

## Release Gate

The following failures block release:

- deterministic emergency safety floor or STCC question order;
- unauthorized role access;
- duplicate queue creation from provider retries;
- a provider failure leaving an incorrect nurse lock;
- recording without notice, consent/legal basis, or Doha residency;
- raw recording entering RAG;
- HRMS identity/age failure entering the clinical queue;
- backend/frontend compile failure or Prisma schema invalidity.

## Commands

```powershell
npx.cmd jest tests/callCenterGateway.test.ts tests/roleUatMatrix.test.ts --runInBand
npm.cmd test -- --runInBand
npx.cmd tsc -p tsconfig.json --noEmit
npx.cmd tsc -p frontend/tsconfig.json --noEmit
```
