# Local System Administration Review — IST Health Clinical Triage

- **Review date:** 2026-07-20 → 2026-07-21 (overnight session)
- **Reviewer:** Automated read-only system administration review (Claude Code)
- **Scope:** Local workstation installation at `C:\AiMlTriage` only. No GCP, Firebase, Cloud Run, Cloud SQL, or DNS resources were inspected, validated, or modified.
- **Commit under review:** `b3c782bebdc499b1c361dbead82136b1d68fd656` (branch `main`)
- **Change guarantee:** No application code, configuration, schema, data, database record, GCP resource, commit, or deployment was changed. The only file created is this report. Two temporary login sessions were created against the in-memory mock session store during endpoint validation and were explicitly logged out; the store is ephemeral.

---

## 1. Executive summary

The local system is **healthy and fully operational in its default simulation/mock profile**. Both expected services are running (frontend on `127.0.0.1:5174`, API on `:8080`), all probed endpoints respond correctly with proper authentication and RBAC behavior, all five frontend hash routes render after direct load and refresh, the Prisma schema validates, both TypeScript projects typecheck cleanly, and **all 589 Jest tests (13 suites) and 4 Python safety-wrapper tests pass**.

Key structural fact: the runtime is in `MOCK_MODE=true` (`environment: simulation`, `persistenceMode: mock-in-memory`, `dataProfile: synthetic`). **No PostgreSQL database is running and none is required in this mode** — there is no `.env` file, Docker is not installed on this host, and all persistence is in-memory. This is by design (`src/config/runtime.ts:88-90`), and live mode is guarded by a startup assertion that refuses to boot without real credentials (`src/config/runtime.ts:154-179`).

The clinical safety architecture is well implemented: deterministic rules run before AI, emergency floors cannot be downgraded by AI or clinician input, AI/RAG is shadow-advisory only, nurse approval gates completion, and overrides are HMAC-signed. Synthetic data is labeled end-to-end.

The most significant findings are **production-readiness security gaps** (a shared master password that is not mock-gated, no password hashing anywhere, missing RBAC on four state-changing route groups), **operational gaps** (no DB health check, no Prisma migrations baseline, no backup/restore or account-unlock procedure), and **release-hygiene concerns in yesterday's commit `b3c782b`** (~77 MB added to git history including apparently proprietary STCC PDFs — a licensing exposure).

---

## 2. Local architecture inventory

| Component | Classification | Evidence |
|---|---|---|
| Frontend (React 18 + Vite 5 + Tailwind, hash routing) | **Running locally** | `frontend/src/main.tsx`, `frontend/src/App.tsx:20,257-307` |
| Express/TypeScript API | **Running locally** | `src/index.ts`, `src/app.ts:85-189` |
| Prisma data-access layer (postgresql provider) | **Implemented but not running** (bypassed in mock mode) | `prisma/schema.prisma:5-8`, `src/config/runtime.ts:96-98` |
| PostgreSQL database | **External dependency, not running** (Docker Compose definition exists; Docker not installed on this host) | `docker-compose.yml` |
| Python simulation & safety modules | **Running locally (on demand, offline, synthetic-only)** | `python/safety_wrapper.py:1-6`, `python/clinical_simulation_engine.py` |
| Authentication / authorization | **Running locally (mock credentials)** | `src/routes/auth.ts`, `src/services/securityAdmin.ts`, `src/middleware/auth.ts`, `src/middleware/rbac.ts` |
| Queue & nurse workspace | **Running locally** | `src/routes/queueRouter.ts`, `src/services/queueOrchestration.ts`, `frontend/src/KanbanWorkspace.tsx` |
| STCC-compatible protocol services | **Running locally; clinical content is synthetic placeholder** ("Replace with licensed STCC content before clinical production use", `src/routes/protocols.ts:33-34`) | `src/services/clinicalContent.ts`, `src/data/samplePhase1ClinicalContent.ts` |
| Safety Kernel (deterministic HITL/floor logic) | **Running locally** (crypto trace verification short-circuits in mock mode) | `src/services/safetyKernel.ts:5-25,178-180`, `src/services/dispositionRouter.ts:200-249` |
| RAG shadow | **Mock/simulated** (deterministic heuristic shadow, no vector store or LLM) | `src/services/ragShadow.ts:59,111-197` |
| MedGemma integration | **Planned only / seam** ("Adapter for a future Qatar-hosted MedGemma endpoint", version `"unconfigured"`) | `src/services/voiceInterpreter.ts:195-219` |
| Voice assessment (new in b3c782b) | **Running locally, mock-mode only** (throws 503 outside mock persistence) | `src/services/voiceAssessment.ts:37-45`, `src/routes/voiceAssessment.ts` |
| Call-centre gateway | **Running locally in dry-run provider mode** | `src/routes/callCenterGateway.ts`, `src/config/runtime.ts:189-191` |
| HRMS adapter | **Mock/simulated** (in-file directory; production target Oracle Fusion HCM) | `src/services/hrms.ts:14+` |
| FHIR/EMR writeback | **Implemented but not running** (payload construction real; transport dry-run, gated by Safety Kernel) | `src/integration/fhirWriteback.ts:1-45,605`, `src/routes/emr.ts:18` |
| Help / Library | **Running locally** (static content) | `frontend/src/HelpCenter.tsx` |
| Test Results (Test Evidence Center) | **Running locally, static-data-driven** (offline-generated JSON catalog, no backend API) | `frontend/src/components/HelpCenter/TestEvidenceCenter.tsx:77,427` |
| Control Centre (admin) | **Running locally (mock data)** | `frontend/src/AdminPortal.tsx`, `src/routes/admin.ts:43-131` |
| CCP (Continuous Communication Pipeline) | **Running locally (dry-run transport; Twilio is external seam)** | `frontend/src/CcpWorkspace.tsx`, `src/routes/ccp.ts` |
| Kanban / Cockpit | **Running locally** | `frontend/src/KanbanWorkspace.tsx`, `frontend/src/App.tsx:215-223` |

---

## 3. Runtime and endpoint status

### 3.1 Host and runtime versions (Task 1)

| Item | Value |
|---|---|
| OS | Windows 11 Pro Insider Preview, build 10.0.26220, AMD64 |
| Node.js | v24.14.0 (no `engines` field in package.json; Dockerfile targets Node 20 — mismatch worth noting) |
| npm | 11.9.0 (pnpm not installed globally; `pnpm-lock.yaml` present — used `corepack pnpm` for audit) |
| TypeScript | 5.9.3 (via npx) |
| Prisma / @prisma/client | 5.22.0 (upstream latest is 7.x — major versions behind) |
| PostgreSQL | **Not installed as a service; `psql` not on PATH; Docker not installed.** Not required in mock mode. |
| Python | 3.12.10 |

### 3.2 Processes and ports

Exactly one instance of each app service — **no port conflicts, no duplicate servers**:

| PID | Process | Port | Role |
|---|---|---|---|
| 25900 | node (tsx `src/index.ts`, child of `npm run dev:api` PID 20912/36816) | `:::8080` | API |
| 29320 | node (vite, child of `npm run dev:web -- --port 5174` PID 25792) | `127.0.0.1:5174` | Frontend dev server |

Resource use at review time: API ~15.6 MB working set, Vite ~16.8 MB, both with negligible CPU. Other node/python processes on the host belong to unrelated tools (MCP servers, Adobe, IDE agents). Stale PID files `.api-8080.pid` / `.web-5174.pid` exist at repo root (untracked by git).

### 3.3 Live endpoint validation (Task 3) — all probed 2026-07-21 ~00:05 local

Unauthenticated:

| Endpoint | Status | Type | Time | Result |
|---|---|---|---|---|
| `GET /healthz` | 200 | JSON | 329 ms (first), 84 ms warm | **Correct** — reports `ok:true`, `environment: simulation`, `mockMode: true`, `persistenceMode: mock-in-memory`, `adminPasswordSource: mock-local-fallback` |
| `GET /api/v1/runtime/environment` | 200 | JSON | 18 ms | **Correct** |
| `GET /api/v1/auth/session` (no cookie) | 401 | JSON | 30 ms | **Correct** (auth required) |
| `GET /api/v1/queue` (no cookie) | 401 | JSON | 8 ms | **Correct** |
| `GET /api/v1/admin/summary` (no cookie) | 401 | JSON | 5 ms | **Correct** |
| Frontend `GET http://127.0.0.1:5174/` | 200 | HTML | 111 ms | **Correct** |

Authenticated as simulation nurse (`nurse@irisstar.tech`):

| Endpoint | Status | Time | Result |
|---|---|---|---|
| `POST /api/v1/auth/login` | 200 | 200 ms | **Correct** — session cookie + JWT issued |
| `GET /api/v1/auth/session` | 200 | 19 ms | **Correct** |
| `GET /api/v1/queue` | 200 | 84 ms | **Correct** |
| `GET /api/v1/protocols/releases/current` | 200 | 14 ms | **Correct** |
| `GET /api/v1/protocols/search?query=chest+pain` | 200 | 25 ms | **Correct** |
| `GET /api/v1/protocols` | 200 | 13 ms | **Correct** |
| `GET /api/v1/call-center/status` | **403** | 4 ms | **Correct** — nurse lacks permission (RBAC enforced) |
| `GET /api/v1/admin/summary` | **403** | 4 ms | **Correct** — RBAC enforced |
| `POST /api/v1/staff/validate` `{}` | 400 | 11 ms | **Correct** — Zod input validation rejects empty payload |
| `POST /api/v1/triage/calculate-score` `{}` | 400 | 6 ms | **Correct** — input validation (safety-calculation endpoint alive) |
| `POST /api/v1/triage/complete` `{}` | 400 | 5 ms | **Correct** — input validation (SBAR endpoint alive; no state-changing payload sent) |

Authenticated as simulation platform admin (`pa@irisstar.tech`):

| Endpoint | Status | Time | Result |
|---|---|---|---|
| `POST /api/v1/auth/login` | 200 | 23 ms | **Correct** — `redirectTo: admin` |
| `GET /api/v1/admin/summary` | 200 | 14 ms | **Correct** |
| `GET /api/v1/admin/control-modules` | 200 | 19 ms | **Correct** |
| `GET /api/v1/admin/audit-events` | 200 | 14 ms | **Correct** |
| `POST /api/v1/auth/logout` (both sessions) | 200 | ≤18 ms | **Correct** — cookie expired |

Call-centre gateway health: no dedicated public health endpoint; `GET /api/v1/call-center/status` (authenticated) is the status view — **Partial** (works, but requires elevated permission; `/healthz` includes `callCenterGateway: {enabled: true, provider: "dry-run"}`).

Test Results data: served as static file `GET /test-evidence/executed-test-catalog.json` from the SPA build, generated offline by `scripts/generateHelpTestCatalog.ts` — **Correct by design; no backend endpoint**.

### 3.4 Frontend routes (browser-verified, direct load + full refresh, authenticated)

| Route | Renders | Heading observed |
|---|---|---|
| `#/workspace` | ✅ | "One Active Call" / "Call Queue" |
| `#/kanban` | ✅ | "Nurse Queue Board" |
| `#/admin` | ✅ | "Role-Based Control Center" |
| `#/help` | ✅ | "IST Help Center and Clinical Library" |
| `#/ccp` | ✅ | "CCP - Continuous Communication Pipeline" |

Session survived full page reloads (cookie-based). Zero browser console errors during the whole walkthrough. Pre-login, every route correctly gates to the login page with the visible **SIMULATION — "Synthetic records only. No PHI"** banner.

---

## 4. Service and process inventory

- **API:** `npm run dev:api` → `tsx src/index.ts`, listening on 8080 (all interfaces `::`). Started 2026-07-20 17:48.
- **Frontend:** `npm run dev:web -- --port 5174` → Vite bound to 127.0.0.1:5174 (config default is 5173, `strictPort: false`; the CORS allowlist covers both 5173 and 5174 — `src/config/runtime.ts:10-15`).
- **Database:** none running (mock mode). `docker-compose.yml` defines `postgres:15-alpine` with `pg_isready` healthcheck for optional live-local mode, but **Docker is not installed on this host**, so `pnpm db:local:up` would fail here.
- **Python:** no resident processes; invoked on demand via `scripts/runPython.mjs`.
- Vite proxy: `/api` → `http://127.0.0.1:8080` (`frontend/vite.config.ts:10-15`), consistent with observed behavior.

---

## 5. Database administration findings (Task 6)

| Check | Result | Evidence |
|---|---|---|
| Prisma schema validity | **Correct** — `npx prisma validate` passed (placeholder `DATABASE_URL` used; no connection attempted) | command output |
| Prisma Client generation | **Correct** — generated client present under `node_modules` (engines 5.22.0); running API imports it without error | `npx prisma --version` |
| Migration history | **Missing** — `prisma/migrations/` does not exist; the schema has never been baselined. `prisma:migrate` script exists but was never run/committed. Live deployment would depend on ad-hoc `migrate dev`/`db push` — not safe or repeatable | `prisma/` listing; `docs/deprecated/day-handover-2026-07-13.md:192-194` lists migration as an open item |
| Provider / connection expectations | postgresql via `env("DATABASE_URL")`; no `.env` exists locally → mock fallback engages | `prisma/schema.prisma:5-8` |
| Local DB reachable | **Not Applicable in mock mode / Blocked for live mode** — no DATABASE_URL, no local Postgres, Docker absent | runtime evidence |
| Tables/constraints exist | **Blocked** — no database to inspect. Schema (static) defines 76 models, 24 enums | `prisma/schema.prisma` (1,696 lines) |
| FKs, unique & clinical/audit indexes (static review) | **Correct** — e.g. `AviationTriageEncounter.staffMember onDelete: Restrict` (`schema.prisma:636`); queue indexes `[status,currentStage]`, `[priorityScore,slaDeadline]`, `[lockedBy,lockExpiresAt]` (`:744-751`); `SafetyAuditDeviationLog @@index([isCriticalFloorBreach,createdAt])` (`:672-673`); `AuditEvent @@index([timestamp])`, `[userId,action]` (`:1692-1693`); `VoiceAssessmentTurn @@unique([sessionId,sequence,attempt])` (`:874`) | schema |
| Backup/restore instructions | **Missing** — no `pg_dump`/`pg_restore` procedure, script, or doc anywhere in the repo | repo-wide search |
| Seed vs synthetic-data separation | **Correct** — `prisma/seed.ts` (deterministic DB fixtures, no credentials) is separate from Python/TS synthetic generators writing to `data/generated/` and from the clinical-content importer (`src/scripts/importClinicalContent.ts`) | `package.json:19-33` |
| Migrations safe/repeatable | **Failed (by absence)** — nothing to replay; see Missing above | — |
| DB startup failure reported clearly | **Failed** — no `prisma.$connect()` at boot; `/healthz` never pings the DB and stays green during an outage; a down DB surfaces only as a generic, unlogged `500 "Unexpected server error"` (`src/middleware/error.ts:51-54`). No `PrismaClientInitializationError`/`ECONNREFUSED` handling exists | `src/index.ts`, `src/app.ts:147-157` |
| Audit persistence completeness | **Partial** — `persistSecurityAuditEvent` drops `recordReference`, `approvalReference`, `sessionHash`, `metadata` columns when writing `AuditEvent` rows | `src/services/persistence.ts:127-152` |

---

## 6. Authentication and RBAC findings (Task 7)

| Check | Result | Evidence |
|---|---|---|
| Named-user authentication | **Partial** — flow works, but password verification is **constant-time comparison against cleartext values; no bcrypt/argon2 anywhere**. `.env.example:81` advertises `AUTH_PASSWORD_HASH_ALGORITHM="argon2id"` but that variable is never read — a misleading control | `src/services/securityAdmin.ts:2080,2129-2133` |
| Simulation-user authentication | **Correct** — 19 per-role demo passwords, gated on `isMockMode()` so they are dead in live mode | `securityAdmin.ts:86-106,2132` |
| User-to-role binding | **Correct** — role is derived server-side from the user record; client `simulateRole` is validated against the user's assigned roles; a client cannot select a role without a valid user assignment | `securityAdmin.ts:2093-2107,2179` |
| Role-specific sim credentials | **Correct** — verified live: nurse login received 403 on admin and call-center endpoints; platform admin received 200 | §3.3 probes |
| Account locking | **Partial** — 5 failures → HTTP 423, but the lock is in-memory, has **no time-based auto-unlock and no admin unlock endpoint**; the only recovery is an API restart, despite the "temporarily locked" message | `securityAdmin.ts:1810,2121-2125,2183,2039` |
| Session expiry | **Correct** — 30 min / 8 h remember-me; cookie `HttpOnly; SameSite=Strict`, `Secure` when TLS; JWT HS256 30-min TTL with constant-time signature check and live-session revocation | `securityAdmin.ts:35-36,2257-2261`; `src/middleware/auth.ts:6,24-31,68-77` |
| Password masking outside simulation | **Correct in API** (passwords never returned/logged; sessions store masked user). **Partial in UI**: login page pre-fills all sim credentials and defaults to a visible (`type="text"`) password field — acceptable only because it is simulation-gated | `securityAdmin.ts:1837-1845,2100`; `frontend/src/LoginPage.tsx:48-281,294` (visible-password default confirmed live in browser) |
| RBAC middleware on API | **Partial** — admin, queue, call-center, voice-assessment, EMR, approval routes all carry permission checks. **But `POST /api/v1/triage/{start,calculate-score,complete,encounters/evaluate}`, `POST /api/v1/ccp/{messages/draft,messages/:id/approve-send,webhooks/twilio}`, `POST /api/v1/simulation/run*`, and `POST /api/v1/staff/validate` require only authentication, no role/permission** — any authenticated account (e.g. helpdesk, reporting analyst) can invoke them | `src/routes/triage.ts:56-162`, `src/routes/ccp.ts:70-98`, `src/routes/simulation.ts:132-144`, `src/routes/staff.ts:8`; positive: `src/routes/admin.ts:43-131`, `queueRouter.ts:45` |
| Frontend route protection / direct URL | **Correct (with correct architecture)** — `#/admin` gating is client-side convenience only; real enforcement is server-side RBAC (verified: nurse gets 401/403 from admin APIs) | `frontend/src/App.tsx:87-105,299` |
| Audit of login/privileged actions | **Partial** — LOGIN / FAILED_LOGIN / DIRECTORY_LOGIN_BLOCKED / PERSONAL_DATA_REVEAL events are recorded, but security audit events are stored **unsigned** (no HMAC), unlike clinical approval traces | `securityAdmin.ts:2136-2206,2267-2290`; `persistence.ts:127-152` |
| Unauthenticated mounts | **Correct with caveats** — `/api/v1/hrms/sync-users` internally requires a cron secret (constant-time, no fallback) or manager/admin session; call-center inbound webhook requires HMAC signature (constant-time) | `src/services/hrmsSync.ts:87-104`; `src/routes/callCenterGateway.ts:28-36` |

---

## 7. Security findings (Task 8)

**Critical (production-facing; benign in local simulation):**

1. **Shared master password authenticates as ANY user — not mock-gated.** `adminPasswordOk` (`securityAdmin.ts:2130`) compares the single `ADMIN_PASSWORD` env value against any username, including the seeded `platform_super_administrator`. In live mode (`MOCK_MODE=false` with `ADMIN_PASSWORD` set), one credential = every identity. The 22 seeded demo users (`securityAdmin.ts:810-1398`) remain active in that scenario.
2. **No password hashing.** Cleartext credential comparison throughout (`securityAdmin.ts:2129-2133`); advertised argon2id is unimplemented.

**High:**

3. Missing RBAC on state-changing triage/CCP/simulation/staff routes (see §6).
4. **Audit-signing secret fallback chain**: `AUDIT_HMAC_SECRET ?? AUDIT_SIGNING_SECRET ?? AUTH_JWT_SECRET ?? "mock-local-audit-signing-secret"` (`safetyKernel.ts:74-80`). `AUDIT_HMAC_SECRET` is not in `REQUIRED_LIVE_DEPENDENCIES` (`runtime.ts:17-30`), so live mode silently reuses the JWT secret (cross-domain key reuse) with no startup assertion.
5. **CORS reflects a `Host`/`X-Forwarded-Host`-derived origin with `credentials: true`** (`src/app.ts:52-73,90-101`). Behind a proxy that doesn't sanitize `X-Forwarded-Host`, arbitrary origins could be reflected as allowed with credentials.
6. JWT fallback secret constant `"mock-dev-only-ist-triage-jwt-secret"` exists in code (`src/middleware/auth.ts:12-13`); live start is blocked if `AUTH_JWT_SECRET` unset, but the constant would sign real tokens if that guard were ever bypassed. JWT is hand-rolled rather than a vetted library.

**Medium:**

7. Rate limiting only on login (10/min) and staff-validate (30/min); in-memory and per-instance (`src/middleware/rateLimit.ts`; `auth.ts:32-36`; `app.ts:102-106`).
8. In-memory account lockout — resets on restart, bypassable under horizontal scaling, no unlock path.
9. `MOCK_MODE` short-circuits the Safety Kernel's cryptographic HITL verification (`safetyKernel.ts:178-180`) — correct for demo, but means the strongest gate is never exercised in the default profile.
10. Dependency audit (`corepack pnpm audit`): **4 vulnerabilities — 1 high, 3 moderate — all in dev tooling** (vite ≤6.4.2: `server.fs.deny` bypass GHSA-4w7w-66w2-5vf9, path traversal, launch-editor NTLM hash disclosure; esbuild ≤0.24.2 dev-server request forgery). None are in production runtime dependencies; exposure is limited to the local dev server.

**Positives:** helmet CSP with `script-src 'self'` (`app.ts:108-122`); 1 MB body limit; broad Zod validation (verified live — empty payloads → 400); constant-time comparison used consistently (passwords, JWT, audit HMAC, call-center signature, cron secret); 5xx responses are generic with no stack traces (`error.ts:29-55`); no credentials or PHI in any log statement (only 6 `console.*` calls in `src/`, all clean); `assertRuntimeConfiguration` blocks live startup with missing secrets or the mock admin password; `.env` properly gitignored and absent; no secrets found in the repo or in commit `b3c782b`.

---

## 8. Clinical safety operational findings (Task 9)

All items verified against source (implementation review, not clinical certification):

| Requirement | Result | Evidence |
|---|---|---|
| Deterministic Safety Kernel before AI output | **Correct** — `evaluateAviationRules` → `resolveDisposition` computes the floor before AI severity is consulted; separate export kernel gates EMR/CCP | `src/routes/triage.ts:197-206`; `src/services/dispositionRouter.ts:200-224`; `fhirWriteback.ts:605`; `ccpCommunication.ts:112` |
| Emergency floors cannot be downgraded | **Correct** — monotonic `severityMax`; AI downgrade blocked (`AI_DOWNGRADE_BLOCKED_BY_RULES_ENGINE`); clinician downgrade blocked, requires reason + ≥12-char rationale, flags `isCriticalFloorBreach`; Emergency/Urgent forces fit-to-fly `restricted` | `dispositionRouter.ts:107,205-249`; `triage.ts:207-224,251-253`; verified by Python tests (4/4 pass, incl. `test_red_vitals_block_llm_downgrade_and_write_audit_row`) |
| STCC question order high→low acuity | **Correct** — `acuityOrder` sorted ascending, indexed; history prompts deliberately carry no severity columns | `prisma/schema.prisma:320-336,268-292`; `clinicalContent.ts:152`; `ragShadow.ts:273,283` |
| AI/RAG/MedGemma advisory only | **Correct** — shadow hard-codes `cannotDecideDisposition: true`, `requiresNurseReview: true`, `mode: DRY_RUN_SHADOW`; no code path assigns AI severity to the decision; voice interpreter's Zod output schema is `.strict()` with no disposition/acuity fields (model output containing clinical outcomes is rejected — test VOICE-BOUNDARY-001) | `ragShadow.ts:166-197`; `schema.prisma:936-938,1028-1044`; `src/services/voiceInterpreter.ts` |
| Nurse approval required for disposition | **Correct** — approval requires `activeReviewConfirmed: literal(true)` + ≥2 reviewed reasoning features; export requires a signed human-approval trace; CCP send requires the Remote Triage Nurse role | `approvalRouter.ts:21-66,532-569`; `safetyKernel.ts:162-199`; `ccpCommunication.ts:62-68` |
| Fit-to-fly separately governed | **Correct** — computed independently with its own gates and owning role; cannot lower clinical acuity | `src/services/aviationRules.ts:16-117`; `triage.ts:20-51,207-224`; `securityAdmin.ts:737-747` |
| SBAR preserves safety findings | **Correct** — severity, safety-floor line, aviation status and full decision trace carried into SBAR payload and `SafetyAuditDeviationLog` | `sbarCompiler.ts:32-68`; `auditLog.ts:38-51`; `triage.ts:234-240` |
| Overrides create signed audit evidence | **Correct** — HMAC-SHA256 over canonicalized payload, `timingSafeEqual` verification; signed trace stored in deviation log | `safetyKernel.ts:107-160`; `approvalRouter.ts:272-345` |
| Synthetic content visibly identified | **Correct** — `ClinicalContentSourceType` enum in DB, UI SIMULATION banner ("Synthetic records only. No PHI" — verified rendered live), evaluate-response warnings, generated package labeled `"sourceType": "synthetic-sample"` | `schema.prisma:100-104`; `runtime.ts:115-119`; browser walkthrough §3.4 |

**Caveat (Medium risk):** in `MOCK_MODE` the export kernel returns `{approved: true, mode: "mock-mode"}` without checking the signed DB trace (`safetyKernel.ts:178-180`). UAT/production must run with `MOCK_MODE=false` for the cryptographic gate to be active.

---

## 9. Privacy and data findings (Task 10)

| Check | Result | Evidence |
|---|---|---|
| Staff/dependent identifier masking | **Correct** — server-side `maskUser`/`maskEmail`/`maskMobile`; board shows `DEP-####***` / truncated staff IDs; telephony ANI masked + HMAC-hashed | `securityAdmin.ts:1817-1845`; `KanbanWorkspace.tsx:117-120,308,353`; `callCenterGateway.ts:195-212` |
| Synthetic/non-synthetic separation | **Correct** — sourceType enum, `@@unique([sourceType, version])`, env-switched content loader, generators segregated under `data/generated/` (gitignored) | `schema.prisma:206,218`; `clinicalContent.ts:17-47` |
| Recording/transcript abstractions | **Correct** — storage-URI abstraction, `recordingStorageRegion` default `me-central1`, governance validator rejects retention without notice/consent, out-of-region storage, and raw-recording RAG eligibility | `schema.prisma:294-313,827-830`; `callCenterGateway.ts:331-347`; `src/types/voiceAssessment.ts:47-48` |
| Retention & deletion | **Partial** — `RetentionPolicy`/`LegalHold` models and `AUDIT_EVENT_RETENTION_DAYS=2555` exist, but **no purge/deletion executor consumes them** — declarative only | `schema.prisma:1624-1653`; `.env.example:90`; docs acknowledge pending |
| Purpose-based reveal + audit | **Correct** — reveal requires `privacy.reveal.request` permission, records purpose/resource/actor at risk `critical`; MFA + 60-second window configured; SoD rule against self-reveal | `securityAdmin.ts:2267-2299,555-569`; `.env.example:82,91` |
| PHI in local logs | **Correct (clean)** — all runtime log files inspected: access lines and startup banners only; error logs are 0 bytes; no names/DOB/identifiers/credentials found | `.runtime-api.log` (3.9 KB), `.runtime-api-error.log` (0 B), `.api-8080.err.log` (0 B), `logs/api-dev.*.log` (0 B) |
| Export/clipboard | **Partial by design** — SBAR clipboard copy is unmasked for the treating nurse (uses staff ID + department, never name); reports are de-identified/`exportAllowed`-gated; no unmasked bulk export found | `NurseWorkspace.tsx:643-658`; `sbarCompiler.ts:11-17`; `AdminPortal.tsx:175,863` |
| Local data safe for demo | **Correct** — all identities are synthetic (`@irisstar.tech`), mock HRMS directory, dry-run transports, SIMULATION banner enforced | `hrms.ts:16-124`; `runtime.ts:88-90,115-119` |

---

## 10. Build and test results (Task 12)

| Validation | Result |
|---|---|
| `npx prisma validate` | ✅ **Pass** — "The schema at prisma\schema.prisma is valid" |
| Backend typecheck `npx tsc -p tsconfig.json --noEmit` | ✅ **Pass** (exit 0) |
| Frontend typecheck `npx tsc -p frontend/tsconfig.json --noEmit` | ✅ **Pass** (exit 0) |
| Jest (unit + integration + API) `npx jest --runInBand` | ✅ **Pass — 13/13 suites, 589/589 tests, 19.4 s.** Suites: triage, approval, safety-kernel, safety-alignment, queueOrchestration, callCenterGateway, voiceAssessment, fhir-writeback, multiTenantRBAC, adminAccessBifurcation, roleUatMatrix, simulation, runtime |
| Python safety wrapper `npm run test:python` | ✅ **Pass — 4/4** (incl. red-vitals LLM-downgrade block + audit row) |
| Playwright browser/E2E tests | ⏭ **Not executed** (configured: `api-contract`, `google-chrome`, `microsoft-edge` projects on ports 18080-18082 with dedicated server bootstrap). Deliberately skipped: `test:e2e` first runs `build:web`, which rewrites `dist-web/` — avoided to keep the review non-mutating. **No browser E2E coverage is claimed.** Frontend behavior was instead verified manually via a real browser session (§3.4). A prior HTML report exists in `playwright-report/` |
| Dependency audit `corepack pnpm audit` | ⚠ **4 vulnerabilities (1 high, 3 moderate), all in dev tooling** (vite ×3, esbuild ×1); production dependencies clean |
| Duplicate-test detection | Not available as a script; none found |
| Jest deprecation warning | ts-jest `globals` config style is deprecated (cosmetic; noted in output) |

---

## 11. Git status and release hygiene (Task 13) — including review of commit b3c782b

- **Branch:** `main`, reported up to date with `origin/main` (no fetch performed, per read-only constraint — ahead/behind is as of last sync).
- **Remote:** `origin → https://github.com/PraveenSahni/medicaltriage.git`
- **HEAD:** `b3c782bebdc499b1c361dbead82136b1d68fd656`
- **Tracked modifications:** none (clean working tree).
- **Untracked:** `docs/protocol-review/` (single file `abdominal-pain-male.html`, 65 KB — appears to be a rendered protocol review; decide whether to track or discard).
- **Pending commits:** none.
- **Ignored correctly:** `dist/`, `dist-web/`, `.env`, `node_modules/`, `data/generated/`, `tmp/`. No log, PID, or test-report files are tracked. 223 files tracked total.

### Review of yesterday's commit `b3c782b` ("Finalize STCC-compatible synthetic data generation and voice assessment work")

- **Scale:** 61 files, +706,294 / −72 lines, **~77 MB added to permanent git history.** Dominated by two ~28.5 MB MedlinePlus XML dumps plus two zip duplicates of the same data (~9 MB), ~7 MB of PDFs, and screenshots.
- **Code (~1,900 lines):** the voice-assessment feature is well built — mounted behind `requireAuthenticatedSession` plus per-route `requireAnyPermission`; per-record ownership checks; `.strict()` Zod schemas with length caps; the interpreter is deterministic and structurally prevented from emitting clinical outcomes (interpretation-only boundary, enforced by schema and test). It deliberately does not touch the Safety Kernel (it produces no disposition). Sessions live in a `globalThis` map gated by `requireMockPersistence()` (503 outside mock mode) — safe guardrail, but the feature is unfinished for live persistence. Minor: hardcoded `storageRegion: "me-central1"`; heavy `(prisma as any)` casts in `importClinicalContent.ts` bypass type safety.
- **No secrets or real personal data** found in the commit. Synthetic labeling is consistent (`"synthetic": true` manifest, `sourceType: "synthetic-sample"`).
- **⚠ Licensing exposure (High):** several files appear to be **proprietary Schmitt-Thompson (STCC) clinical content**, committed to a public-remote repo: five PDFs under `New folder/` (e.g. "Evidence Behind the STCC Adult Telehealth Triage Guidelines 2025.pdf"), root-level `Abdominal Pain - Male.pdf`, and `docs/After-Hours Telehealth Triage Guidelines Database Documentation 2026.pdf`. The 19 `data/stcc-public-indexes/*.pdf` files are public index pages (lower risk). MedlinePlus XML is public-domain (NLM) but 57 MB of it is re-downloadable (`source_url.txt` records the source) and shouldn't live in git history.
- **Handover accuracy:** the handover note says `data/generated/synthetic_stcc_guidelines/` was "included in versioned workspace" — in fact that directory is **gitignored and not in the commit**; the generated packages exist only in the working tree. Worth knowing before relying on the remote as backup for those artifacts.
- **Recommendation:** history rewrite (`git filter-repo`) to remove the proprietary PDFs and the MedlinePlus XML/zips *before* the repo gains more consumers; a `.gitignore` edit alone will not shrink history or cure the licensing issue.

---

## 12. Classification summary

**Correct**
- Frontend + API running, single instances, correct ports; Vite proxy aligned
- All probed endpoints: status codes, auth gating (401), RBAC (403 for under-privileged role), input validation (400), response times ≤ 350 ms
- All five hash routes render on direct load and refresh; session persistence; zero console errors
- Prisma schema valid; both typechecks clean; 589/589 Jest + 4/4 Python tests pass
- Safety architecture: deterministic floor before AI, no-downgrade enforcement, shadow-only AI, HITL approval, signed overrides, fit-to-fly separation, SBAR preservation, synthetic labeling
- Masking, purpose-based reveal with critical-risk audit, PHI-free logs, mock-gated demo credentials, server-side role binding, constant-time comparisons, no stack-trace disclosure, `.env` hygiene

**Partial**
- RBAC coverage (four route groups auth-only), audit-event persistence drops columns, security audit trail unsigned, account lockout without unlock path, retention declarative only, rate limiting narrow and in-memory, runbook (start documented; diagnosis partial), call-centre health only via authenticated status route, SBAR clipboard unmasked by design, login page shows passwords by default (sim-gated)

**Missing**
- Prisma migrations baseline; backup/restore procedure; DB readiness/health probe; correlation IDs; password hashing; audit-HMAC startup assertion; account-unlock procedure; clean-shutdown documentation; retention executor; `engines` field

**Failed**
- DB startup-failure reporting (opaque, unlogged 500; healthz stays green) — by code inspection; not triggerable locally without a DB

**Blocked / Not Applicable**
- Live DB reachability, table/constraint verification, migration status: no local database exists (mock mode by design; Docker not installed)
- Playwright E2E: not executed (would mutate `dist-web/`); no browser-test coverage claimed
- GCP/Cloud Run/Cloud SQL validation: out of scope by instruction

---

## 13. Risks (ordered)

**Critical** *(production-facing; inert in local simulation)*
1. Shared `ADMIN_PASSWORD` authenticates as any user including platform super admin, and is **not** mock-gated (`securityAdmin.ts:2119-2133`).
2. No password hashing; cleartext credential store; advertised argon2id unimplemented (`securityAdmin.ts:86-106,2129-2133`).

**High**
3. Proprietary STCC PDFs committed to git history in `b3c782b` (licensing exposure; public GitHub remote).
4. No RBAC on state-changing triage/CCP/simulation/staff routes (`triage.ts:56-162`, `ccp.ts:70-98`, `simulation.ts:132-144`, `staff.ts:8`).
5. Audit-signing secret silently falls back to the JWT secret or a hardcoded constant in live mode; no startup assertion (`safetyKernel.ts:74-80`; `runtime.ts:17-30`).
6. No Prisma migrations baseline — schema evolution is unreproducible and unauditable.
7. CORS reflects `X-Forwarded-Host`-derived origins with credentials (`app.ts:52-73`).

**Medium**
8. `/healthz` never checks the DB; no readiness endpoint; DB failures surface as unlogged generic 500s (`app.ts:147-157`; `error.ts:51-54`).
9. Locked accounts recoverable only by API restart; lockout and rate limits in-memory/per-instance.
10. `MOCK_MODE` bypasses the cryptographic HITL export gate (`safetyKernel.ts:178-180`) — enforce `MOCK_MODE=false` in UAT/production.
11. ~77 MB of regenerable/duplicate data (MedlinePlus XML + zip duplicates) in git history; repo bloat.
12. Security audit events stored unsigned; persisted audit rows drop four columns (`persistence.ts:127-152`).
13. Dev-tooling vulnerabilities: vite ≤6.4.2 (1 high, 2 moderate), esbuild ≤0.24.2 (1 moderate) — local dev server exposure only.
14. No request correlation IDs; no structured logger.

**Low**
15. No backup/restore or clean-shutdown documentation; no `engines` field (host Node 24 vs Dockerfile Node 20); Prisma 5.22 two majors behind; Zod `.flatten()` details returned on 400; `helmet` `style-src 'unsafe-inline'`; ts-jest deprecated config style; stray `New folder/` naming and root-level clutter (`Abdominal Pain - Male.pdf`, `remix_-ist-technologies.zip`, `interactive dashboard style click on enable .html`); untracked `docs/protocol-review/` undecided; handover note inaccuracy about `data/generated` being versioned.

---

## 14. Recommended remediation sequence

1. **Immediately (before any further pushes):** remove proprietary STCC PDFs (+ MedlinePlus XML/zips) from git history via `git filter-repo`; force-push after coordinating; add ignore rules for `data/open-source/` and reference PDFs. (Risk 3, 11)
2. Remove or mock-gate the shared `ADMIN_PASSWORD` any-user match; implement argon2id hashing to match the advertised control. (Risks 1, 2)
3. Add `requirePermission` gates to triage, CCP, simulation, and staff-validate routes. (Risk 4)
4. Add `AUDIT_HMAC_SECRET` to `REQUIRED_LIVE_DEPENDENCIES` and assert it is non-default at startup, mirroring the admin-password check. (Risk 5)
5. Baseline the schema: `prisma migrate dev --name baseline` against a local Docker Postgres, commit `prisma/migrations/`. (Risk 6)
6. Restrict CORS origin computation to the explicit allowlist; stop trusting `X-Forwarded-Host`. (Risk 7)
7. Add a `/readyz` endpoint with `SELECT 1` DB probe (live mode), catch `PrismaClientInitializationError` with an actionable log line, and log 5xx causes server-side. (Risk 8)
8. Add time-based lockout decay plus an admin unlock endpoint; document recovery. (Risk 9)
9. Sign security audit events with the same HMAC used for clinical traces; persist the four dropped audit columns. (Risk 12)
10. Upgrade vite/esbuild patch versions; add request-ID middleware and a structured logger; add `engines` field; write backup/restore + shutdown runbooks (see §15). (Risks 13, 14, 15)

---

## 15. Local runbook (startup, validation, shutdown, recovery)

### Start (default simulation mode — no DB needed)
```powershell
cd C:\AiMlTriage
npm install                # or corepack pnpm install (pnpm-lock.yaml is authoritative)
npx prisma generate        # required once before typecheck/build
npm run dev:api            # API on http://127.0.0.1:8080
npm run dev:web -- --port 5174   # frontend on http://127.0.0.1:5174 (default 5173 also allowed by CORS)
```

### Optional live-local DB mode (requires Docker — NOT installed on this host)
```powershell
copy .env.example .env     # then edit values; never commit
npm run db:local:up        # postgres:15-alpine on 5432
npm run prisma:migrate     # NOTE: no migrations exist yet; first run creates the baseline
npm run db:seed
# set MOCK_MODE=false in .env — startup will hard-fail unless all live secrets are configured
```

### Validate
```powershell
Invoke-WebRequest http://127.0.0.1:8080/healthz            # expect 200, ok:true
Invoke-WebRequest http://127.0.0.1:5174/                   # expect 200 HTML
npx prisma validate
npx tsc -p tsconfig.json --noEmit
npx tsc -p frontend/tsconfig.json --noEmit
npx jest --runInBand                                        # 589 tests
npm run test:python                                         # safety wrapper
# auth smoke: POST /api/v1/auth/login with a simulation credential, then GET /api/v1/queue (expect 200)
```

### Shut down cleanly
No stop scripts exist. Stop the two `npm run dev:*` terminals with Ctrl+C, or:
```powershell
Get-NetTCPConnection -State Listen |
  Where-Object { $_.LocalPort -in 8080,5174 } |
  ForEach-Object { Stop-Process -Id $_.OwningProcess }
npm run db:local:down      # only if Docker Postgres was started
```
Note: `.api-8080.pid` / `.web-5174.pid` at repo root may be stale — verify against live listeners before trusting them.

### Recovery
- **Locked simulation account:** there is no unlock endpoint or timeout. Restart the API process (lockout map is in-memory and clears on restart). Documented here because it is documented nowhere else.
- **Regenerate Prisma Client (Windows):** stop the API first (the query-engine DLL is locked while running), then `npx prisma generate`, then restart (`docs/day-handover-2026-07-11.md:63`).
- **Frontend failure:** check `.runtime-web-error.log` / Vite terminal; confirm port 5174 listener; confirm `/api` proxy target 8080 is up.
- **API failure:** check `.runtime-api-error.log` / terminal; `GET /healthz`; note healthz does NOT test the DB — in live mode a green healthz does not rule out DB failure.
- **Database failure (live mode):** `npm run db:local:logs`; `docker compose ps`; expect generic 500s from the API with no server log detail (known gap, §13 Risk 8).
- **Database restore:** no procedure exists. Until one is written: `docker exec ist_qatar_postgres_local pg_dump -U triage_user ist_triage > backup.sql` / restore via `psql`. Treat this as unverified guidance.

---

## 16. Exact commands executed (all read-only or compute-only)

```
# Inventory
[System.Environment]::OSVersion.VersionString; (Get-CimInstance Win32_OperatingSystem).Caption; $env:PROCESSOR_ARCHITECTURE
node --version; npm --version; python --version; npx tsc --version; npx prisma --version; psql --version (not found)
Get-NetTCPConnection -State Listen | Where-Object LocalPort in 5174,8080,5432,3000,5173,8081,8000
Get-Process | Where-Object ProcessName -match 'node|postgres|python|vite'
Get-CimInstance Win32_Process -Filter "Name='node.exe'"   # command lines
Get-Service | Where-Object Name -match 'postgres'
docker ps (not installed)
Get-ChildItem C:\AiMlTriage; Get-ChildItem -Filter '.env*' -Force
Get-Content .env key-name masking (no .env exists; .env.example listed by key only)

# Endpoint probes (Invoke-WebRequest; scratchpad script probe-endpoints.ps1)
GET /healthz, /, /api/v1/runtime/environment, /api/v1/auth/session, /api/v1/queue, /api/v1/admin/summary (unauth)
POST /api/v1/auth/login (nurse + platform-admin simulation credentials)
GET /api/v1/queue, /api/v1/protocols{,/search,/releases/current}, /api/v1/call-center/status, /api/v1/admin/{summary,control-modules,audit-events} (authed)
POST /api/v1/staff/validate {}, /api/v1/triage/calculate-score {}, /api/v1/triage/complete {}  (validation-only, rejected 400)
POST /api/v1/auth/logout (both sessions)
Browser: loaded 127.0.0.1:5174 at #/workspace, #/kanban, #/admin, #/help, #/ccp with full reloads; console checked

# Validation
$env:DATABASE_URL='postgresql://placeholder:placeholder@localhost:5432/placeholder'; npx prisma validate
npx tsc -p tsconfig.json --noEmit
npx tsc -p frontend/tsconfig.json --noEmit
npx jest --runInBand
npm run test:python
corepack pnpm audit

# Git (read-only)
git status; git log --oneline -5; git remote -v; git rev-parse HEAD
git show --stat b3c782b (+ targeted git show diffs, via review agent)
git check-ignore dist dist-web .env node_modules data/generated logs tmp
git ls-files (counts, large-file scan, log/PID tracking check)
```

Not executed by policy or environment: any GCP/gcloud/firebase command, prisma migrate/db push/seed, npm/pnpm install, docker compose up, Playwright E2E (mutates `dist-web/`), any DELETE/PATCH/state-changing API call, any commit/push.

## 17. Evidence reference index

Primary evidence locations cited throughout: `src/app.ts` (63-189), `src/config/runtime.ts` (10-195), `src/routes/auth.ts` (30-108), `src/services/securityAdmin.ts` (34-2299), `src/middleware/auth.ts` (6-78), `src/middleware/rateLimit.ts`, `src/middleware/error.ts` (29-55), `src/routes/triage.ts` (14-260), `src/services/dispositionRouter.ts` (107-249), `src/services/safetyKernel.ts` (5-199), `src/services/ragShadow.ts` (59-293), `src/services/voiceInterpreter.ts` (83-219), `src/services/voiceAssessment.ts` (37-364), `src/routes/approvalRouter.ts` (21-569), `src/services/sbarCompiler.ts` (11-68), `src/services/persistence.ts` (127-152), `src/services/callCenterGateway.ts` (123-347), `src/services/hrmsSync.ts` (87-104), `src/integration/fhirWriteback.ts` (418-704), `src/services/clinicalContent.ts` (17-236), `prisma/schema.prisma` (5-1695), `frontend/src/App.tsx` (20-307), `frontend/src/LoginPage.tsx` (48-294), `frontend/src/KanbanWorkspace.tsx` (117-353), `frontend/vite.config.ts` (5-23), `docker-compose.yml`, `Dockerfile`, `jest.config.cjs`, `playwright.config.ts`, `.env.example` (1-91), `docs/day-handover-2026-07-11.md`, `docs/deprecated/day-handover-2026-07-13.md` (150-243).
