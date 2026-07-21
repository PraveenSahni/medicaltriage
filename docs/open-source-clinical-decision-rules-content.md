# Open-Source Clinical Decision Rules -> STCC-Shaped Content

Status: implementation review note. This is not a replacement for licensed STCC content and is not clinically approved for production use.

## Why this exists

"100% STCC format compatibility" splits into two unrelated problems: real STCC clinical content is blocked on a Schmitt-Thompson license (tracked as GAP-001 through GAP-007 in `docs/stcc-rfi-rag-shadow-gap-tracker.md`); the schema/structure ("Part A") is pure engineering and was closed separately (see `docs/stcc-after-hours-database-structure-2026.md`). This content module addresses a third option: our own synthetic generator's placeholder text is fabricated (identical 4-question templates per protocol, no real clinical basis, and measurable quality bugs found via a full 1,063-protocol self-match audit this session - title-parsing fragments, casing duplicates, a "Cancer -"/"Postpartum -" scoring bias). Rather than either fabricate better-sounding placeholder text or wait for a license, this module sources content from **real, published, peer-reviewed clinical decision rules** - the rule/algorithm itself is a fact and not copyrightable (the same legal basis already relied on for WHO IMCI and RCP NEWS2 in `src/services/news2Scoring.ts`), and these rules are already structured as literal Yes/No/point criteria - the closest structural match to STCC's TAQ format of any source surveyed (including openly-licensed prose sources like NHS.UK, which would need real decomposition work).

## What's in the module

`src/data/openSourceClinicalRulesContent.ts` - 4 protocols, deliberately narrow (per explicit decision to narrow the corpus to only topics with a genuine open-source structural match, rather than mixing fabricated and real-sourced content):

| Protocol | Rule | Citation |
|---|---|---|
| Ankle and Foot Injury | Ottawa Ankle Rule | Stiell et al., Ann Emerg Med 1992;21:384-390; JAMA 1994;271:827-832 |
| Sore Throat | Centor score, modified by McIsaac | Centor et al., Med Decis Making 1981;1:239-246; McIsaac et al., JAMA 2004;291:1587-1595 |
| Cough With Fever | CURB-65 pneumonia severity | Lim et al., Thorax 2003;58:377-382 |
| Leg Swelling | Wells' Criteria for DVT | Wells et al., Lancet 1997;350:1795-1798; JAMA 2006;295:199-207 |

Every protocol carries `provenance.sourceDocuments` citing the actual publications above, `provenance.licensedContentIncluded: false`, and `provenance.requiresClinicalValidation: true` - **a rule being real and published does not substitute for local clinical governance sign-off** before this system trusts it as live triage logic. New `sourceType` value added for this: `"open-source-clinical-rule"` (`src/types/clinicalContent.ts`), distinct from `"synthetic-sample"` (fabricated) and `"licensed-stcc"` (not yet available).

## Design notes and honest caveats

- **Universal emergency screen added first, in every protocol.** None of these 4 rules is itself an emergency-airway/breathing/circulation screen - Ottawa Ankle Rule is an imaging decision, Centor/McIsaac is a strep-testing decision, CURB-65 and Wells are severity/probability scores. Per this system's own non-negotiable safety-kernel requirement (deterministic emergency floor before any other logic), each protocol's first TAQ is a standard emergency-medicine red-flag screen (neurovascular compromise, airway compromise, respiratory distress, pulmonary embolism signs) that is **not part of the named rule** - documented explicitly in each question's `rationaleEn`.
- **Three of the four rules are additive point scores, not Yes-fixes-disposition hierarchies.** Only the Ottawa Ankle Rule is a true "any positive criterion -> action" rule. Centor/McIsaac, CURB-65, and Wells DVT are cumulative point totals. Rather than force a false single-Yes-wins shape onto them, each criterion is presented as its own TAQ with `rationaleEn` explaining the real point value and instructing the nurse to tally, and a final tier question that reflects the rule's own published score bands. This is an honest adaptation, not a corruption of the algorithm - but it means these three protocols rely on the nurse correctly summing points, which the deterministic system does not automate today.
- **One criterion is telephone-adapted, not the validated version:** CURB-65's "Urea" criterion requires a blood test result, unavailable by phone. It is substituted with a dehydration/kidney-history proxy, explicitly flagged in both the question's `rationaleEn` and the protocol's `provenance.contentNotice` as an approximation requiring specific clinical-governance review - this is the one place content quality has genuinely changed the original rule's inputs, not just its presentation.
- **Disposition codes and the numeric disposition-level ladder are reused from the existing schema/STCC-structural work**, not invented for this module (`AcuityDispositionCode` enum, `Disposition` lookup model with `dispositionLevelId`/`questionOrder` added earlier this session) - confirms those structural additions are usable by more than one content source.
- **Care advice is standard, non-controversial first aid/self-care guidance** (e.g., RICE for ankle injury) - not proprietary STCC text.

## How to activate it locally

Set in `.env` (gitignored): `CLINICAL_CONTENT_SOURCE=open-source-rules` (takes effect after the API restarts; do not set `CLINICAL_CONTENT_USE_GENERATED_STCC=true` at the same time - that branch is checked first in `loadContentPackage()`). Same mechanism also works for the importer: `npx tsx src/scripts/importClinicalContent.ts --dry-run --source open-source-rules`.

## Verification performed (this session)

- `npx prisma validate`/`generate` not needed (no schema changes this pass).
- `npx tsc -p tsconfig.json --noEmit` and frontend typecheck: clean (required extending 4 independently-declared `sourceType` literal unions in `src/types/queue.ts` and `frontend/src/QueueContext.tsx` to include the new value).
- `npx tsx src/scripts/importClinicalContent.ts --dry-run --source open-source-rules`: all 4 protocols Zod-validate (4 protocols, 23 TAQs, 12 initial-assessment questions, 12 care-advice entries, 4 localized dispositions).
- `npx jest --runInBand`: 593/593, unaffected (tests are pinned to the embedded sample via `tests/jest.setup.ts` regardless of `.env`).
- Live: `/healthz` confirms `clinicalContentRelease.sourceType: "open-source-clinical-rule"`; search-matched all 4 protocols correctly and with decisive score separation against realistic caller phrasing ("twisted ankle" -> Ottawa Ankle Rule protocol, score 229; "sore throat and fever" -> Centor/McIsaac, 242, vs. 25 for the next candidate; "cough for a week with fever" -> CURB-65, 228, vs. 8; "one leg more swollen than the other" -> Wells DVT, 73) - a materially cleaner result than the fabricated 1,684-protocol corpus, which never exceeded ~66% confidence on anything tested earlier this session. Confirmed `dispositionLevel`/`questionOrder`/`telemedicineEligible`/`acuity`/`provenance` all render with the exact authored values via `GET /api/v1/protocols/oscr-ankle-foot-injury`.

## Explicitly out of scope / not claimed

- Not clinically validated for this system - `requiresClinicalValidation: true` stands.
- Not a replacement for the full 1,684-topic synthetic corpus's breadth - deliberately narrow (4 protocols) per the decision to only include topics with a genuine open-source structural match.
- A fifth candidate (HEART score, chest pain risk) was identified but deferred - its precise point table was not fetched with the same rigor as the four above.
- The Ottawa Ankle Rule is the only one of the four that is a genuine single-Yes-wins hierarchy; the other three's point-tally nature is a real structural mismatch with STCC's TAQ format that this module documents rather than hides.
