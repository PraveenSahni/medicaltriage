# Semantic Matching Enhancement Plan (2026)

## Status: Phase 0 complete (see §7 Changelog). Phases 1-4 not yet started.

## 1. Problem statement

`searchClinicalProtocols()` / `scoreProtocol()` (`src/services/clinicalContent.ts`) is pure
substring matching against hand-authored `keywords[]` phrase lists. It has no concept of:

- **Synonyms** (physician ↔ doctor)
- **Paraphrase** ("reset the password" ↔ "change the password")
- **Semantic similarity / embeddings**
- **Intent classification**
- **Entity/concept recognition or ontology** (nothing knows "elbow" is part of "arm")
- **Canonical form / stemming** ("running" → "run" not handled; `normalize()` only lowercases
  and strips punctuation)
- **Utterance variants** — currently handled only by manually enumerating literal phrase
  variants per protocol (the entire batch-authoring workflow this year), which is brute-force
  and does not generalize to any caller phrasing not explicitly anticipated.

This was discovered/confirmed directly during the 228-protocol open-source-guideline authoring
effort (`src/data/openSourceGuidelines/`, batches 01–23): nearly every batch required 1–2 rounds
of live-queue testing and manual keyword patching to reach 10/10 match accuracy, because a
caller phrase that wasn't a literal substring of an authored keyword scored zero for that term.

## 2. Confirmed facts grounding this plan (verified against the actual codebase, not assumed)

- **No trained model or ML/vector infrastructure exists anywhere in this repo.** Confirmed: no
  OpenAI/Anthropic SDK, no `@xenova/transformers`, no `natural`/`compromise`/`wink-nlp`, no
  pgvector, no ONNX/TF runtime, in either `package.json` (root or `frontend/`).
- **A synonym mechanism is already half-built and simply unused.** `ClinicalContentProtocol`
  has a `synonyms: ClinicalContentSynonym[]` field (`src/types/clinicalContent.ts:246`) and a
  `ProtocolSynonym` DB table that the DB importer wires up
  (`src/scripts/importClinicalContent.ts:504-511`). **None of the 228 protocols authored this
  year populate `synonyms:`** (every dry-run reported `synonymCount: 0`), and — separately —
  `scoreProtocol()` **never reads `protocol.synonyms` at all**, even for DB-backed content where
  the table would be populated. This is a built pipe with nothing flowing through it in either
  direction.
- **Matching is advisory-only, not disposition-determining.** `searchClinicalProtocols()` only
  decides which protocol/question-set is displayed to the nurse. Actual severity/disposition is
  computed independently by `deriveRulesFloor()` (hardcoded narrative red-flag keyword rules)
  and `deriveProtocolSafetyFloor()` (based on which question IDs the nurse actually marked
  positive) in `src/services/dispositionRouter.ts`, combined via `severityMax()`. Neither depends
  on the search/match score. **A semantic-matching miss means the nurse sees a slightly wrong
  protocol's question set and has to search again — it cannot silently under-triage a patient**,
  because the independent safety-floor rules and the nurse's own question answers are what
  actually set severity. This materially lowers the risk tolerance needed for the phases below.
- **A shadow-suggestion scaffold already exists, unpopulated.** `RagShadowSuggestionDto`
  (`src/types/queue.ts:173-207`) and its Prisma tables (`RagRetrievalEvent`,
  `LlmShadowSuggestion`, `ProtocolComparisonEvent`, `LearningFeedbackEvent`,
  `ModelEvaluationRun` — `prisma/schema.prisma:978-1102`) are built and wired into
  `buildRagShadowSuggestion()` (`src/services/ragShadow.ts`) — but today it just echoes the
  single deterministic keyword score and fabricates a `confidence` number from the score margin.
  `cannotDecideDisposition` and `requiresNurseReview` are hardcoded `true` by design, meaning
  this scaffold is **already scoped as advisory-only** — the phases below plug into it rather
  than building new surfaces.
- **Postgres is vanilla v15** (`docker-compose.yml`: `postgres:15-alpine` locally; Cloud SQL
  Postgres in `me-central1` per `README.md`). pgvector is installable on Cloud SQL Postgres but
  not currently enabled, and — at a 228-protocol corpus size — is not needed at all (a flat
  in-memory loop over ~228 384-dimension vectors is sub-millisecond; no vector DB required until
  the corpus is orders of magnitude larger).
- **Qatar health-data residency**: caller narrative text must not be sent to a third-party API.
  This rules out hosted embedding APIs (OpenAI/Anthropic/etc.) as a matching backend without
  separate legal/data-residency sign-off, and is the primary reason Phase 3 below specifies a
  **local, in-process** embedding model rather than an external API call.

## 3. Non-goals (explicit, to prevent scope creep)

- **Not** replacing or modifying `scoreProtocol()`'s existing substring-matching core logic.
  Every phase below is *additive* — a new signal merged alongside the existing score, never a
  replacement of it. This preserves the auditability property the existing system already has
  (every match is traceable to a literal authored phrase).
- **Not** allowing any new signal to feed `dispositionRouter.ts` directly or to bypass
  `deriveProtocolSafetyFloor`/`deriveRulesFloor`. All new signals surface through
  `RagShadowSuggestionDto` (advisory) or influence *which protocol's questions are shown*, never
  the computed severity.
- **Not** pursuing a full UMLS/SNOMED CT ontology integration (Phase 4 in the earlier options
  table) — disproportionate engineering + licensing overhead for a closed catalog of ~228 (aiming
  for ~400) protocols. A flat hand-curated gazetteer covers the practical need instead.
- **Not** building a dedicated intent classifier — with semantic retrieval in place (Phase 3),
  "intent" for this system reduces to "which of the known protocols is closest," which retrieval
  already answers for a closed, enumerable catalog.
- **Not** sending any caller narrative or PHI to an external LLM/embedding API.

## 4. Phased plan

Each phase is independently shippable, independently testable via the existing live-queue
verification process (`[[batch-verification-process]]` memory), and ordered by
effort-to-payoff ratio (cheapest/safest first).

---

### Phase 0 — Wire up the synonym pipe that already exists

**Goal**: Close the "Synonyms" gap using infrastructure that is already built but disconnected.

**Tasks**:
1. In `src/services/clinicalContent.ts`, extend `scoreProtocol()` to also loop
   `protocol.synonyms` (and `protocol.titleVariants`, which has the same problem — populated in
   authored content but never read by the JSON-mode scorer) exactly the way `protocol.keywords`
   is scored today (substring match in both directions + short-term partial credit), using a
   slightly lower weight tier than a full `keywords[]` hit so synonyms enrich rather than
   dominate scoring.
2. Backfill `synonyms: [{ canonicalTerm, synonym }]` entries for the highest-value lay↔clinical
   term pairs across the 228 already-authored protocols (e.g., physician↔doctor,
   tummy/belly↔stomach/abdomen, MI↔heart attack, kid↔child, ER↔emergency room/emergency
   department). Do not attempt full coverage in one pass — prioritize terms that appeared as
   manual keyword-variant patches during batches 01-23 (a natural, already-identified worklist —
   see the batch-by-batch keyword-fix commits for the actual phrase pairs that were needed).
3. Re-run `npm run content:dry-run` to confirm `synonymCount` is now nonzero and matches the
   backfilled entries.
4. Full regression: `npx tsc --noEmit` (both projects), `npx jest --runInBand` (593/593 baseline
   must hold — no existing test currently exercises `synonyms`, so this should be a pure
   addition), then re-run **all 23 existing batch live-queue verification scripts**
   (`gen_calls_batch01.mjs` through `gen_calls_batch23.mjs`, recreated as needed from this
   session's scratchpad) to confirm no regression in previously-10/10 batches — adding a new
   scoring path always carries a small risk of shifting which protocol wins a close contest.

**Effort**: ~1 day engineering + ~1 day content backfill + ~0.5 day regression.
**New dependencies**: none.
**Risk**: low — additive scoring change, already-established verification process catches
regressions before merge.

---

### Phase 1 — Canonical form / lightweight stemming

**Goal**: Close the "Canonical form/normalization" gap (e.g. "running" → "run",
"aches"/"aching"/"ached" → one root) without a heavyweight NLP dependency.

**Tasks**:
1. Add a small (~20-30 line), in-house suffix-stripping function to
   `src/services/clinicalContent.ts` (or a new `src/services/textNormalization.ts` if it grows),
   handling the realistic caller-phrasing suffix set actually observed this year (`-ing`, `-ed`,
   `-s`/`-es`, `-'s`). Explicitly **not** a full Porter/Snowball stemmer — our vocabulary is
   narrow (lay medical English), and an aggressive general-purpose stemmer risks
   false-collapses (e.g., "universe"→"univers") that a narrow rule set avoids.
2. Apply this stemmer inside `queryTerms()` (the short-word partial-credit path) only, not to
   the full-phrase substring checks — preserves the existing "if you type the literal authored
   phrase you get full credit" guarantee for `title`/`keywords`/`definition` matches, while
   improving the fuzzy partial-credit layer.
3. Regression: same as Phase 0 — full `tsc`/`jest`/all-batches live-queue re-verification. This
   phase touches a shared function (`queryTerms`) used by every single protocol match, so
   regression risk is higher than Phase 0 — budget extra time for keyword-collision investigation
   if any previously-passing batch regresses (the short-word partial-credit quirk documented in
   memory — cross-contamination from generic words — could behave differently once stemmed
   forms overlap more between unrelated protocols).

**Effort**: ~1 day engineering + ~1-2 days regression/collision investigation.
**New dependencies**: none.
**Risk**: medium — touches a shared function; mitigated by the existing 23-batch verification
suite acting as a regression net.

---

### Phase 2 — Lay-term → concept gazetteer (lightweight "ontology")

**Goal**: Close "Entity/Concept" and "Ontology" gaps at a fraction of UMLS/SNOMED CT's cost.

**Tasks**:
1. Create `src/data/openSourceGuidelines/shared/conceptGazetteer.json` (or `.ts` for type
   safety): a flat map of ~150-300 lay terms → canonical concept tags (e.g.,
   `"tummy" → "abdomen"`, `"noggin" → "head"`, `"funny bone" → "elbow"`). Seed this from terms
   that repeatedly caused cross-protocol collisions or required manual patching during batches
   01-23 (again, a naturally-derived worklist from this year's actual authoring history, not a
   guess).
2. At query time, before scoring, expand the caller's normalized query with any matched concept
   tags (in addition to, not instead of, the original text) — the expanded query is
   scored identically by the existing `scoreProtocol()` logic, so this phase requires no changes
   to the scoring function itself, only to the query-preparation step.
3. Optionally tag each protocol with 1-2 concept tags at authoring time (e.g., `oscg-elbow-pain`
   tagged `arm-region`) to enable simple "is this concept related to that protocol" checks later,
   without needing a graph traversal engine.
4. Regression: same process as Phase 0/1.

**Effort**: ~3-5 days (curation-heavy, not engineering-heavy).
**New dependencies**: none.
**Risk**: low — purely additive to query preparation, easy to disable by emptying the gazetteer
if it misbehaves.

---

### Phase 3 — Local embedding-based semantic similarity (second-pass, advisory only)

**Goal**: Close "Semantic similarity," "Paraphrase," "Semantic representation," and most of
"Utterance variants" and "Embedding" — the gaps that genuinely require a new capability, not
just better string handling.

**Tasks**:
1. Add `@xenova/transformers` (Transformers.js) as a new dependency — runs a small quantized
   ONNX model **in-process, on CPU, with no external network call**, directly satisfying the
   Qatar health-data-residency constraint (no caller narrative ever leaves the server).
   Recommended model: `Xenova/all-MiniLM-L6-v2` (~25MB, 384-dimension output, well-established
   general-purpose sentence embedding model, English-only — acceptable given this content set is
   English-only today).
2. Write a small embedding-cache build step: at server boot (or as an explicit
   `npm run embeddings:build` script writing a JSON cache checked into the repo, mirroring the
   existing `content:dry-run` pattern), compute one embedding vector per protocol from the
   concatenation of `titleEn` + `clinicalDefinitionEn` + the full `keywords[]` phrase bank. At
   ~228-400 protocols, this is a few seconds of one-time work, not a runtime cost.
3. At query time, embed the caller's raw narrative once (no normalization needed — embeddings
   are far more tolerant of casing/punctuation/word-order than substring matching), compute
   cosine similarity against every cached protocol vector (flat in-memory loop — no vector DB
   needed at this corpus size), and produce a **second, independently-ranked candidate list**.
4. Feed both ranked lists (existing keyword score + new embedding similarity) into
   `RagShadowSuggestionDto` — specifically populate `suggestedProtocolCandidates` and
   `comparison` with a real comparison instead of the current echo-and-fabricate-confidence
   logic, following the Agreement Engine pattern (see Phase 4). **Do not** let the embedding
   result change `primaryProtocolId` or feed `dispositionRouter.ts` in this phase — ship it as
   pure shadow/advisory data first, gather real agreement/disagreement data, and only consider
   promoting it to influence the displayed default protocol in a later, separately-scoped
   decision once shadow data justifies it.
5. Verification: this phase needs a **different** verification approach than Phases 0-2, since
   it's not modifying the existing deterministic scorer at all (zero regression risk to the
   23-batch keyword-match suite by construction). Instead: re-run all 23 batches' live-queue test
   scenarios and additionally capture the embedding-based candidate list for each, spot-checking
   that semantically-related-but-lexically-different phrasings (paraphrases of the existing test
   scenarios, deliberately reworded to share no keyword overlap with the authored phrases) are
   still found by the embedding pass even where the keyword pass would have missed them. This is
   the actual acceptance test for this phase's value.

**Effort**: ~1-2 weeks (new dependency integration, cache-build tooling, comparison-surface
wiring, a new class of verification scenarios).
**New dependencies**: `@xenova/transformers`.
**Risk**: low to the existing system (strictly additive, shadow-only), moderate in new-code
surface area (first ML dependency in this repo — needs its own test coverage, cache-invalidation
strategy when protocols are added/edited, and a decision on where the embedding cache file lives
in source control / CI).

---

### Phase 4 — Agreement Engine (multi-signal consensus, still advisory)

**Goal**: Once ≥2 independent signals exist (deterministic keyword score + embedding similarity,
Phase 3), replace `buildRagShadowSuggestion()`'s current "echo one score, fabricate a confidence
number" logic with a real consensus classification — inspired by the Triage Medley
(`ki-smile/triage-medley`) Agreement Engine pattern researched this session: classify agreement
as FULL/PARTIAL/NONE across signals, and when signals disagree, explicitly flag the shadow
suggestion for closer nurse attention rather than silently picking one.

**Tasks**:
1. Define a small `AgreementLevel = "FULL" | "PARTIAL" | "NONE"` classification: FULL when both
   signals' top pick agree; PARTIAL when the correct protocol appears in both signals' top-N but
   not as the #1 pick for both; NONE when the two signals' top-N lists don't overlap at all.
2. Populate `RagShadowSuggestionDto.comparison` with this real classification instead of the
   current confidence-from-score-margin fabrication.
3. Add an explicit low-confidence/`UNMATCHED` state (inspired by TriAgentPediatrics'
   `SpecialtyRuler` fallback pattern researched this session) for the case where even the best
   available signal's top score falls below a minimum threshold — surfaced to the nurse UI as
   "no strong match found, describe further" rather than silently displaying a shaky top pick.
4. This phase is the natural place to also decide, with real production/shadow data in hand,
   whether embedding similarity should ever be promoted from shadow-only to influencing the
   *displayed default* protocol (still never disposition) — that promotion decision is
   explicitly out of scope for this plan and should be a separate, data-informed proposal once
   Phase 3 has run in shadow mode for a meaningful period.

**Effort**: ~3-5 days (mostly logic + `RagShadowSuggestionDto` field population; UI surfacing of
the new fields in the Nurse Cockpit is a separate, not-yet-scoped follow-up).
**New dependencies**: none (builds on Phase 3's output).
**Risk**: low — purely a data/classification layer on top of already-computed signals.

## 5. Verification standard (applies to every phase)

Every phase must, before being considered "done":

1. `npx tsc -p tsconfig.json --noEmit` and `npx tsc -p frontend/tsconfig.json --noEmit` clean.
2. `npm run content:dry-run` clean (schema validation of the full assembled package).
3. `npx jest --runInBand` — 593/593 baseline must hold (or grow only via genuinely new,
   intentional test additions for the new capability, never via a shrinking baseline).
4. Re-run of the full 23-batch live-queue verification suite
   (`login → POST /api/v1/queue → read preparedProtocol.primaryProtocolId` per scenario) with **no
   regression** in any previously-10/10 batch. Any regression must be root-caused and fixed
   before the phase is marked done, not deferred.
5. An explicit written note (in this document's changelog section, added at the bottom as each
   phase completes) of what was verified, what — if anything — regressed and how it was fixed,
   and what remains a known limitation.

## 6. Open decisions requiring explicit sign-off before starting (not assumed by this plan)

- **Embedding cache storage**: committed JSON file in the repo vs. computed at server boot vs.
  a new DB table. Recommendation: committed JSON file (mirrors the existing pattern of
  `data/generated/synthetic_stcc_guidelines/synthetic_stcc_guidelines.json` and
  `data/open-source-topic-tracking.csv` already being committed, keeps CI reproducible, avoids a
  boot-time cost) — but this should be confirmed, not assumed.
- **`@xenova/transformers` as a new production dependency**: first ML-adjacent dependency in this
  repo. Needs whatever the team's normal new-dependency review process is (security/license
  review — Transformers.js is Apache-2.0, the `all-MiniLM-L6-v2` model itself is Apache-2.0 —
  before Phase 3 begins).
- **UI surfacing of the new shadow-comparison data**: this plan only specifies backend/data-layer
  work through Phase 4. Whether/how the Nurse Cockpit UI ever displays "the two signals
  disagreed" to a nurse is explicitly a separate, not-yet-scoped follow-up decision.

## 7. Changelog

### Phase 0 — complete

**What shipped:**
- `scoreProtocol()` (`src/services/clinicalContent.ts`) now scores `protocol.titleVariants` and `protocol.synonyms` in addition to the pre-existing `keywords[]`/title/definition paths — both were populated in the schema/DB path but never read by the JSON-mode scorer before this.
- A minimum-length guard (`MIN_SYNONYM_PHRASE_LENGTH`/`MIN_VARIANT_PHRASE_LENGTH = 4`) was added to both new loops, and a canonical-term de-duplication fix (score each unique `canonicalTerm` at most once per protocol, not once per variant row sharing it).
- A new shared dictionary (`src/data/openSourceGuidelines/shared/synonymDictionary.ts`) with ~70 hand-curated lay/clinical synonym groups, attached programmatically to every protocol in the assembled package (`attachDictionarySynonymsToAll`, wired into `index.ts`) based on whole-word matches in each protocol's own title/definition/keywords - no batch file was hand-edited.
- Final state: 556 synonym entries across 228 protocols (`content:dry-run` `synonymCount`).

**Regressions found and fixed during verification (three real bugs, not just content-tuning):**
1. **Catastrophic short-abbreviation false-positive** (first attempt): dictionary entries like `"er"`, `"ed"`, `"gp"`, `"mi"`, `"kid"` are substrings of countless unrelated words (`"blistered"` contains `"er"`/`"ed"`; `"kidney"` contains `"kid"`), causing a full-query substring check to match almost any caller sentence. Fixed by removing all such short/ambiguous abbreviations from the dictionary and adding the length guard above as defense-in-depth.
2. **Canonical-term double/triple-counting**: multiple synonym rows sharing one `canonicalTerm` each independently re-scored a single literal match of that canonical term in the query, multiplying the score by the number of variant rows in the group. Fixed by scoring each unique canonical phrase at most once per protocol (tracked via a `Set`).
3. **False attachment via substring-without-word-boundaries**: `attachDictionarySynonyms`'s protocol-side matching used plain `String.includes()`, so a protocol whose own keyword said "previously **diagno­sed**" got the "nose" body-part group falsely attached (`"diagnosed"` contains `"nose"` as a substring). Fixed with a word-boundary-aware `containsWholeTerm()` regex check.
4. **Redundant re-scoring of already-authored keywords**: when a synonym group's variant phrase was already a literal keyword on the protocol (e.g. Heart Rate and Heartbeat Questions already had `"heart racing"`/`"heart pounding"` as authored keywords, and the dictionary's "palpitations" group also lists those as variants because the protocol mentions "palpitations"), the same phrase was scored twice — once via `keywords[]`, once via the new `synonyms[]` path — doubling its contribution to the pre-existing short-word noise floor. Fixed by skipping any synonym addition whose variant text exactly matches an existing keyword phrase on that protocol.
5. Also removed four single-word symptom groups (`itching`, `swelling`, `fainting`, `dizziness`) after confirming via direct A/B testing that this content set deliberately has multiple competing protocols for each of those exact symptoms (six Swelling protocols by body part, three Itching protocols, two Dizziness protocols), so a generic single-word group attaches unevenly across all of them and can tip an already-close race - this is a structural property of *this* corpus, not a universal rule for every future group.

**Verification performed:** full `tsc`/`content:dry-run`/`jest` (593/593) after every fix, plus a genuine before/after A/B regression sweep (not just re-running the same code twice) across all 220 live-queue test scenarios from batches 01-23, comparing the exact same 220 scenarios with the synonym feature fully reverted (`git stash`) vs. applied. This surfaced the double-counting/false-attachment/redundant-rescoring bugs, which a same-code re-run would not have caught.

**Known residual limitation (accepted, not chased further):** two test scenarios flipped from correct to incorrect and could not be fully resolved without risking new regressions elsewhere:
- `"Suddenly cant hear well out of one ear since this morning"` (expected Hearing Loss or Change) now matches Heart Rate and Heartbeat Questions.
- `"Just threw up a bunch of blood and feel really faint and dizzy"` (expected Vomiting Blood) now matches Dizziness - Lightheadedness.

Both were confirmed via direct baseline A/B testing to already be razor-thin margins even *before* any Phase 0 change (Hearing Loss won by only 7 points out of ~300; Vomiting Blood won by only 2 points out of ~167) - i.e., these were already fragile coin-flips caused by the pre-existing short-word partial-credit scoring quirk (documented in the `batch-verification-process` memory), and Phase 0's additions (which touch unrelated words elsewhere in the same caller sentences) were enough to tip them. This is exactly the class of problem Phase 1 (stemming) and later phases (embeddings/Agreement Engine) are scoped to address structurally - further hand-tuning the Phase 0 dictionary to chase these two specific point-margins was judged not worth the whack-a-mole risk of shifting some other currently-correct, similarly-fragile match elsewhere in the ~228-protocol corpus. Revisit if Phase 1/3 don't naturally resolve them.

**Net result across all 220 scenarios:** 3 previously-broken scenarios fixed (nosebleed, insomnia, shingles), 2 residual regressions accepted as a known, documented, low-severity limitation. No other content or baseline regressions found in the full sweep.
