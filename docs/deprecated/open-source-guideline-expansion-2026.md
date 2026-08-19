# Open-Source Guideline Expansion: Scaling Toward STCC Catalog Size

Status: implementation review note, continuing `docs/open-source-clinical-decision-rules-content.md`. Not clinically approved for production use.

## Why this exists

The 4-protocol formal-rule module shipped and verified well, but the user's direction was explicit: "we have to not get only 4 protocols but as much as protocals STCC has." Real Schmitt-Thompson STCC has roughly 400 protocols (~200 adult + ~200 pediatric). Only ~10-15 topics in all of medicine have a named, validated point-score clinical decision rule (Ottawa Ankle, Centor/McIsaac, CURB-65, Wells DVT, HEART, PERC, Alvarado, Canadian C-Spine, NEXUS, CHA2DS2-VASc...) - covering the rest of a ~400-topic catalog means also decomposing real, cited public health guidance (NHS.UK "when to get help" pages, Crown copyright, reused under the Open Government Licence) into the same TAQ shape, not just formal rules. This is a deliberate, user-confirmed reversal of the earlier "narrow to only formal rules" scoping.

A second clarification mid-planning: the new protocols must match the **full real STCC shape**, not just the structural fields already added in the earlier "STCC Structural Schema Compatibility (Part A)" pass. A third clarification: the user ultimately wants the Nurse Cockpit to **actually serve from the STCC-compatible Prisma tables** (Algorithm/TriageQuestion/CareAdvice/Disposition), not just a JSON file - closing the DB-import/serving disconnect this session's sysadmin review had flagged as GAP-004. A real target exists: GCP Cloud SQL instance `ist-triage-postgres-uat` (project `aimltriage`, region `me-central1`).

**Explicit exclusion carried through this entire pass:** `docs/protocol-review/data/abdominal-pain-male.db.json` (a personal reference file containing real, copyrighted Schmitt-Thompson content - `"Copyright": "...LaGrange Medical Software, Inc. All rights reserved."`) was never read for content, never used as a source, and no protocol in this expansion touches "Abdominal Pain" topics at all, to eliminate any risk of inadvertent resemblance to that licensed material.

## What changed

### 1. Full STCC structural shape (schema extension)

Added to `Algorithm` (`prisma/schema.prisma`) and mirrored in `src/types/clinicalContent.ts` - all additive/nullable, all confirmed unread by `dispositionRouter.ts`/`news2Scoring.ts`:

- `guidelineRedirects` (Json) - STCC's "GotoGuideline" pre-screen pattern: a question with no disposition that routes to a different protocol entirely.
- `painSeverityTable` (Json) - a per-protocol Mild/Moderate/Severe descriptive table.
- `backgroundDetail` (Json) - `keyPointsEn[]`, `causesUnder50En[]`, `causesOver50En[]`, `locationTable[]`. Not every protocol populates all of these - empty arrays are expected where an age-split or anatomical breakdown doesn't apply to the topic.
- `authorEn`, `expertReviewerEn`, `lastRevisedAt`, `lastReviewedAt`, `versionYear`, `contentSet` - authorship/versioning metadata.
- `provenance` (Json) - a gap caught while building the DB loader (see below): without this column, importing a protocol into Postgres and then serving it back from Postgres would have silently dropped every citation and the `requiresClinicalValidation` flag.

**Hard rule enforced in every new field:** `expertReviewerEn` never names an invented clinician. The real STCC reference file names a specific credentialed physician; fabricating an equivalent for our own unreviewed content would misrepresent it as physician-signed-off, which is unsafe for health content. Ours either omits the field or attributes to the real source organization's editorial process (e.g. "NHS.UK clinical editorial review"). Similarly, `contentSet`/`authorEn` use IST Health's own labels, never STCC's product name.

### 2. Topic selection + resumable tracking ledger

`python/select_open_source_topic_targets.py` (read-only, no network calls) ranks candidate topics from the already-cached `data/generated/synthetic_stcc_guidelines/synthetic_stcc_guidelines.json` (1,684 entries from our own generator, itself scraped from STCC's *public index* PDFs - topic names are facts, not copyrightable, distinct from the licensed question/advice content). Restricted to `mode === "after-hours"` (this system's permanent domain constraint), 832 unique canonical topics exist; the script selects the top 400 by patient-group coverage and index-membership prominence, and outputs `data/open-source-topic-tracking.csv` (committed - small metadata, not the fabricated corpus) as a resumable ledger: `titleEn, patientGroupCoverage, membershipCount, sourceTier, ruleNote, status, assignedBatch, protocolId, sourceUrls, notes`.

A caught bug worth noting: the first pass used loose substring keyword matching (`"foot" in title`) to flag formal-rule candidates, which false-matched "Athlete's Foot" and "Hand-Foot-Mouth Disease" against the Ottawa Ankle Rule, and "Whooping Cough Exposure"/"Coughing Up Blood" against CURB-65. Fixed by switching to exact-normalized-title matching against a small allowlist, re-verified against the actual corpus (`node -e` spot checks) before trusting it.

Current ledger state: 6 rows `formal-rule-verified` (the 4 authored protocols, matched against 6 real corpus title variants), 6 `formal-rule-candidate` (Chest Pain/HEART, Knee Injury or Pain/Ottawa Knee, Neck Injury or Pain/NEXUS-Canadian C-Spine, Head Injury/Canadian CT Head-PECARN - real rules exist but their point tables have **not** been fetched/verified with the same rigor as the original 4, so none are authored yet), 10 rows `authored` (batch01, below), ~374 rows still `pending`.

### 3. Scalable module structure

`src/data/openSourceClinicalRulesContent.ts` (the original 4) is untouched. New `src/data/openSourceGuidelines/`:
- `shared/builders.ts` - `buildUniversalEmergencyScreenQuestion()` (per-body-system red-flag presets: respiratory, cardiac, gi, msk, neuro, genitourinary, ent, dermatologic, psychiatric, general) and `buildGuidelineProvenance()`.
- `batch01.ts` - the 10 protocols below, each a plain `ClinicalContentProtocol[]` export.
- `index.ts` - assembles the original 4 + every batch array into one `ClinicalContentPackageInput`. Adding a `batch02.ts` later means adding one array-spread line here - no other file changes.

`src/services/clinicalContent.ts` and `src/scripts/importClinicalContent.ts` were repointed to import from the new index instead of the single old file - verified byte-identical checksum for the original 4 protocols before batch01 was added, proving the repoint introduced zero content drift.

New `sourceType` value `"open-source-guideline"` (distinct from `"open-source-clinical-rule"` - decomposed public prose is structurally different, lower-rigor provenance than a named point-score rule, and this stays visible rather than blended). Added in 5 places: the Zod enum, `src/types/queue.ts` (2 independently-declared literal unions), `frontend/src/QueueContext.tsx` (2 more) - the same pattern that required fixing in 4 places last time this session added a sourceType value.

### 4. Batch 01 - 10 protocols decomposed from NHS.UK

Each fetched live from the real page (not guessed), paraphrased rather than quoted at length, with real citations and page-last-reviewed dates:

| Protocol | Source page | Last reviewed |
|---|---|---|
| Back Pain | nhs.uk/conditions/back-pain | 2026-03-05 |
| Burns - Thermal | nhs.uk/conditions/burns-and-scalds | 2026-03-31 |
| Animal Bite | nhs.uk/conditions/animal-and-human-bites | 2025-10-27 |
| Bee or Yellow Jacket Sting | nhs.uk/conditions/insect-bites-and-stings | 2023-06-01 |
| Anaphylaxis | nhs.uk/conditions/anaphylaxis | 2023-06-21 |
| Carbon Monoxide Exposure | nhs.uk/conditions/carbon-monoxide-poisoning | 2025-12-16 |
| Nosebleed | nhs.uk/conditions/nosebleed | 2023-12-05 |
| Headache | nhs.uk/conditions/headaches | 2024-04-17 |
| Sunburn | nhs.uk/conditions/sunburn | 2025-11-24 |
| Frostbite | nhs.uk/conditions/frostbite | 2025-06-09 |

Every protocol still carries a universal emergency pre-screen question ahead of the source's own tiers (documented per-question as an addition, not part of the source), `requiresClinicalValidation: true`, `licensedContentIncluded: false`, and reuses the existing 8-value `AcuityDispositionCode` enum (no new disposition codes invented). Anaphylaxis is deliberately shorter than the others - NHS.UK's own guidance for it is binary (severe reaction = emergency now, everything else = a separate page), so it only has an emergency tier and a "mild reaction, monitor closely" tier rather than a forced 4-tier ladder.

Total corpus after batch01: **14 protocols** (4 formal-rule + 10 guideline-decomposition), 52 TAQs, 42 initial-assessment questions, 41 care-advice entries.

### 5. DB-backed serving (Nurse Cockpit runs from the STCC-compatible tables)

New `loadContentPackageFromDatabase()` in `src/services/clinicalContent.ts` queries `Algorithm` (with nested `questions`, `careAdviceLinks`, `initialAssessmentQuestions`, `keywordIndexes`) plus the global `LocalizedDisposition` table, and reshapes DB rows back into the same `ClinicalContentPackage` shape - the mirror image of what the importer already writes. Reuses the existing Prisma singleton (`src/db.ts`), no second client created.

Two known, accepted lossy spots (both pre-existing in the importer's write side, not introduced by the read side): (1) question-level `keywords` are indexed in `ProtocolKeywordIndex` at the algorithm level only, with no per-question foreign key, so they can't be reattached to individual questions on read-back - this degrades search-relevance scoring slightly, not clinical correctness, since protocol-level keywords round-trip fully; (2) `release.sourceType` collapses to whatever the importer's `sourceToDb()` already collapses `open-source-clinical-rule`/`open-source-guideline` down to (`SYNTHETIC_SAMPLE`), since the DB enum has no dedicated value for those two sourceTypes yet - documented as out of scope, matching the plan's explicit decision not to expand the DB enum for this.

**Top-level await problem and fix:** the natural design (`const contentPackage = await loadContentPackage()`) failed under `ts-jest`'s isolated per-file ESM transpilation (`TS1378`), even though plain `tsc` and real Node ESM both accept it fine, and `isolatedModules: true` (ts-jest's own suggested fix) broke the test setup-file transform in a different way. Fixed by avoiding top-level `await` entirely: `contentPackage` is a module-level `let`, synchronously initialized to a placeholder for the `database` source; a new exported `contentPackageReady` promise resolves once the real DB load completes (or resolves immediately, already-settled, for every other source). Only `src/index.ts` (the real server entrypoint, never touched by tests) awaits it before calling `app.listen()`. Every downstream function (`listClinicalProtocols`, `searchClinicalProtocols`, etc.) stayed fully synchronous and unchanged, exactly as the plan required.

## Verification performed (this session)

- `npx tsc -p tsconfig.json --noEmit` and `npx tsc -p frontend/tsconfig.json --noEmit`: clean throughout.
- `npx prisma validate` / `npx prisma generate`: pass with a placeholder `DATABASE_URL` (no live connection needed for either command).
- `npx tsx src/scripts/importClinicalContent.ts --dry-run --source open-source-rules`: validates all 14 protocols cleanly.
- `npx jest --runInBand`: 593/593, unaffected (found and fixed a real, pre-existing fragility along the way: `tests/jest.setup.ts` deleted `CLINICAL_CONTENT_SOURCE` instead of setting it to `""`, so `loadLocalEnv()`'s "only fill in `undefined` keys" behavior silently refilled it from `.env` mid-test-run - this had been flagged as "worth double-checking" in an earlier session note, and it was in fact live-breaking 11 tests once `.env` actually had `CLINICAL_CONTENT_SOURCE=open-source-rules` set).
- Live: dev server restarted on the `open-source-rules` source, `/healthz` confirms the release, and 5 realistic caller queries against the 10 new protocols all top-matched correctly ("sunburn on the beach" -> Sunburn 180, "stung by a bee" -> Bee or Yellow Jacket Sting, "nosebleed wont stop" -> Nosebleed 165, "carbon monoxide detector going off" -> Carbon Monoxide Exposure 190, "worst headache of my life" -> Headache 177). Pulled the full Headache protocol via the API and confirmed `painSeverity`, `authorship`, and `provenance.sourceDocuments`/`requiresClinicalValidation` all render with the exact authored values.

## Required follow-up (outside this environment - no Docker, no reachable Cloud SQL here)

1. Generate the combined migration (Part A + this pass's Design-0 fields) against a disposable Postgres so the SQL can be reviewed before touching the shared UAT database:
   ```
   npx prisma migrate dev --name add_stcc_structural_fields_and_provenance
   ```
2. Apply it to the real UAT instance (`ist-triage-postgres-uat`, project `aimltriage`, region `me-central1`) - use `migrate deploy`, not `migrate dev`, against a shared environment:
   ```
   DATABASE_URL="<UAT connection string from Secret Manager>" npx prisma migrate deploy
   ```
3. Import the open-source content into it:
   ```
   DATABASE_URL="<same UAT connection string>" npx tsx src/scripts/importClinicalContent.ts --source open-source-rules
   ```
4. Point the Nurse Cockpit's API at the database-backed source (local `.env` and/or the `ist-triage-demo` Cloud Run service's secrets/env) and restart:
   ```
   CLINICAL_CONTENT_SOURCE=database
   DATABASE_URL=<same UAT connection string>
   ```
5. Confirm `/healthz` reports the DB-backed release and the protocol count matches what was imported; spot-check the same search queries used in this session's live verification.

## Explicitly out of scope / not claimed

- Not clinically validated for this system - `requiresClinicalValidation: true` stands on every protocol.
- Only 14 of the ~400-topic target are authored; `data/open-source-topic-tracking.csv` tracks the remaining ~374 `pending` rows as an explicit, resumable backlog, not a hidden gap.
- The 6 `formal-rule-candidate` topics (Chest Pain/HEART, Knee/Ottawa Knee, Neck/NEXUS-Canadian C-Spine, Head Injury/Canadian CT Head-PECARN) are plausible textual matches only - their precise point tables have not been fetched and cited with the same rigor as the original 4, and must not be authored as formal-rule content until that research is done.
- The DB migration/import/live-verification against the real UAT Cloud SQL instance was not performed in this environment and is the user's explicit follow-up to run themselves.
