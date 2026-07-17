# IST Health End-to-End API and Browser Validation

## Purpose

This suite validates the full tele-triage chain from named-user login to queue closure. It checks both transport success and clinical/data meaning. Browser journeys run against the same built application in stable Google Chrome and Microsoft Edge; API tests run against a separate fresh process.

## Isolation Model

| Target | Port | State boundary | Purpose |
|---|---:|---|---|
| API contract | 18080 | Fresh in-memory process | Deep endpoint and data-lineage validation |
| Google Chrome | 18081 | Fresh in-memory process | User-visible workflow and network-response validation |
| Microsoft Edge | 18082 | Fresh in-memory process | Cross-browser workflow and network-response validation |

The suite builds `dist-web` first and serves it from Express. This gives the browser a production-like same-origin application and prevents an already-running local API, an old Vite proxy, or another browser run from contaminating results.

## Validated Touchpoints

| ID | Touchpoint | Positive validation | Negative or boundary validation | Channel |
|---|---|---|---|---|
| API-001 | Runtime and health | Simulation mode, GCP region, rules-first architecture, release | Wrong runtime profile fails assertions | API |
| API-002 | Authentication boundary | Session endpoint behavior | Anonymous queue and invalid password denied | API |
| API-003 | Named-user RBAC | Nurse email binds to nurse role and workspace | Role/identity drift fails assertions | API |
| API-004 | Queue fetch | Unique queue IDs and complete records | Missing/duplicate/inconsistent records fail | API |
| API-004A | HRMS enrichment | Identity and age source are HRMS-derived | Caller-entered age cannot substitute | API |
| API-004B | Protocol preparation | Release, candidates, and questions are linked | Duplicate candidates/questions fail | API |
| API-004C | Acuity order | Questions are ascending by acuity and high-to-low severity | Lower-priority item before emergency fails | API |
| API-004D | RAG shadow | Approved-content boundary and nurse review flags | RAG disposition authority fails | API |
| API-004E | STCC process | Four action tabs map to ten canonical steps | Missing/reordered process steps fail | API |
| API-005 | Cross-source reconciliation | Queue, HRMS, release, search, detail, advice agree | Broken IDs or release mismatch fail | API |
| API-006A | Adult safety floor | SpO2/HR breach routes to HMC emergency | Downgrade fails | API |
| API-006B | Pediatric safety floor | Age-banded tachypnea routes to Sidra | Adult routing or downgrade fails | API |
| API-006C | Stable adult | Normal vitals route to self-care | False emergency fails | API |
| API-006D | Age governance | Staff ID resolves age | Manual-age-only request is rejected | API |
| API-007 | Call-center gateway | Provider-neutral dry-run and Qatar recording region | Intake role cannot control calls | API |
| API-008A | Callback | Outbound callback connects and locks one case | Missing lock/session fails | API |
| API-008B | Clinical context | Vitals, route, approval, and SBAR state persist | Incomplete state blocks closure | API |
| API-008C | Bilingual note | English/Arabic SBAR is clipboard-ready | Missing bilingual evidence fails | API |
| API-008D | Queue closure | Completed status and audit context persist | Premature closure fails | API |
| API-008E | EMR/FHIR | Safety-gated dry-run endpoint executes | Unauthenticated writeback is denied elsewhere | API |
| WEB-001 | Login page | Runtime banner and user autofill | Data mismatch fails | Chrome + Edge |
| WEB-002 | Login error | Invalid credentials stay outside | False login success fails | Chrome + Edge |
| WEB-003 | Role landing | Admin reaches Control Center | Wrong landing fails | Chrome + Edge |
| WEB-004 | API-to-UI parity | Reason, age, and channel match queue response | UI drift fails | Chrome + Edge |
| WEB-005A | Pick call | Answer command connects queue item | Provider/API failure remains visible | Chrome + Edge |
| WEB-005B | Active assessment | HRMS, protocol, RAG boundary, and score render | Missing source evidence fails | Chrome + Edge |
| WEB-006 | Callback | Named nurse starts a provider-neutral outbound callback | Stale ownership or provider rejection fails | Chrome + Edge |
| WEB-007A | Question path | One highest-priority question and explicit Yes/No | Skipped action fails | Chrome + Edge |
| WEB-007B | Disposition | Facility and fit-to-fly restriction render | Emergency clearance fails | Chrome + Edge |
| WEB-007C | Completion | SBAR, queue move, and writeback all return success | Any missing request fails | Chrome + Edge |
| WEB-008A | Help test evidence | Summary, filters, accordion details, steps, expected/actual evidence, and executor metadata render | Missing or inconsistent evidence fails | Chrome + Edge |
| WEB-008B | Validation governance | Retest requires a reason and records status, reviewer, time, and comment | Blank governed action is rejected | Chrome + Edge |
| WEB-008C | Session continuity | Expanded state and validation outcome survive Help-tab remounts in the session | Lost review state fails | Chrome + Edge |

## Current Verified Result

Validated on 17 July 2026:

| Suite | Unique cases | Executions | Result |
|---|---:|---:|---|
| API contract | 8 | 8 | 8 passed |
| Google Chrome | 8 | 8 | 8 passed |
| Microsoft Edge | 8 | 8 | 8 passed |
| End-to-end total | 16 | 24 | 24 passed |
| Jest regression suites | 12 suites | 577 tests | 577 passed |

The Help area exposes all 593 unique executed cases under **Test Results**: 16 curated release-gate journeys and 577 generated Jest regression cases. Together they represent 601 executions because each of the eight browser journeys ran independently in Chrome and Edge. Browser cases are represented once in the review catalogue with both browsers recorded as execution targets.

The generated regression catalogue is rebuilt with `pnpm run test:help-catalog`. Stable IDs are derived from each test's source path and full title, explicit maintained IDs are preserved, and generation fails on duplicate IDs or report/count drift.

## Commands

```powershell
pnpm run test:e2e:api
pnpm run test:e2e:chrome
pnpm run test:e2e:edge
pnpm run test:e2e
pnpm run test:e2e:report
```

## Evidence and Release Gate

- A release candidate fails if any API, Chrome, or Edge project fails.
- Failed browser tests retain a screenshot and video; first retry retains a Playwright trace.
- New or changed touchpoints must add or revise a uniquely identified case in this catalog.
- Obsolete cases should be removed only when the corresponding product behavior is intentionally retired and the change is recorded.
- Unit/Jest RBAC and safety tests remain required. These E2E tests complement them; they do not replace deterministic rule tests.
