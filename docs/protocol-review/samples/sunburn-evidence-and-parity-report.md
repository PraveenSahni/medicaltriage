# Sample Protocol: `oscg-sunburn` — Field-Level Evidence and Parity Report

Sample #1 of the 229-protocol baseline approval gate. Produced 2026-07-25. This is a controlled sample for template/workflow validation, not yet part of the production content pipeline.

## Field-level provenance

| Field path | Source organization | Source type | Publication/review date | Source reference | Date accessed | Evidence level | Review status |
|---|---|---|---|---|---|---|---|
| `algorithm.Definition`, `Background.KeyPoints`, `FirstAid`, `dispositions[70]`/`dispositions[15]`-linked question text | NHS.UK | National health authority | Last reviewed 2025-11-24 | https://www.nhs.uk/conditions/sunburn/ | 2026-07-25 | High (national health authority) | Technically validated; clinical sign-off pending |
| `questions[0]` (emergency/heatstroke question) and its `Information` field | NHS.UK | National health authority | Last reviewed 2026-05-28 (next review 2029-05-28) | https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/ | 2026-07-25 | High (national health authority) | Technically validated; clinical sign-off pending |
| `algorithm.GenderAtBirth` = "Male and Female" | *(no source states a gender restriction)* | Structural default, not a clinical claim | n/a | n/a | n/a | N/A — administrative field | Marked in Research Gap Register (see below), not fabricated as a clinical fact |
| `algorithm.AlgorithmID` = 1010 | Internal assignment | Structural/administrative numbering | n/a | n/a | n/a | N/A | Needs confirmation against a real numbering scheme before final release (currently an arbitrary placeholder distinct from the STCC exemplar's 79) |
| `algorithm.PainSeverity` = `[]` | n/a | Structural decision | n/a | n/a | n/a | N/A | Documented reasoning: sunburn's severity in the sourced guidance is defined by blistering/systemic symptoms, not a 1–10 pain scale like the abdominal-pain exemplar — leaving empty rather than fabricating a scale not present in the source |
| `algorithm.LastRevised` | *(unresolved)* | — | — | — | — | — | **Open Research Gap** — the internal IST adaptation date is not recorded anywhere in the existing runtime record; only the source publisher's own review date is known. Marked `RESEARCH_REQUIRED` in the JSON rather than guessed. |

## Research Gap Register (this sample)

| Protocol ID | Field path | Status | Blocking final approval? | Notes |
|---|---|---|---|---|
| oscg-sunburn | `algorithm.LastRevised` | Open | Yes | Needs the actual date this content was adapted into the IST runtime record — not derivable from the source pages, must come from internal records |
| oscg-sunburn | `algorithm.AlgorithmID` numbering scheme | Open | Yes | 1010 is a placeholder; a real numbering convention must be agreed (e.g. block-allocated ranges per batch file) before all 229 protocols can be assigned non-colliding IDs |
| oscg-sunburn | `algorithm.GenderAtBirth` | Resolved-by-default | No (documented default, not a fabrication) | No source discusses gender applicability for sunburn; defaulted to unrestricted, recorded as a structural default rather than invented clinical content |

Per the user's rule: this protocol **cannot** be marked complete for the final 229-baseline while the two "blocking" gaps above remain open — this sample intentionally demonstrates the Research Gap Register mechanism working as specified, not a fully-cleared sample.

## JSON ↔ PDF ↔ Runtime parity check

| Field | `sunburn.db.json` | `sunburn.pdf` | Runtime record (`oscg-sunburn` in `batch01.ts`) | Match? |
|---|---|---|---|---|
| Protocol ID | `AlgorithmID: 1010` (+ `oscg-sunburn` cross-ref in `_source.importSource`) | "oscg-sunburn" shown in footer | `id: "oscg-sunburn"` | Match (JSON carries both the new numeric ID and the original slug for traceability) |
| Title | "Sunburn" | "Sunburn" (H1) | `titleEn: "Sunburn"` | Match |
| Question count | 3 | 3 (table rows) | 3 (`questions[]`) | Match |
| Question text | verbatim | verbatim | verbatim (source of truth) | Match — no wording changed during reshaping |
| Disposition codes | HMC_EMERGENCY_DEPARTMENT / HMC_URGENT_REVIEW / SELF_CARE_WITH_CALLBACK_PRECAUTIONS (via `DestinationCode`) | shown as plain headings (LevelID only, not the internal code) | `dispositionCode` field on each question | Match — same 3 codes, PDF intentionally omits the internal code string since it's an implementation detail, not patient-facing content |
| Care advice count | 3 | 3 | 3 (`careAdvice[]`) | Match |
| Search words | 6 terms | 6 terms | 6 (`keywords[]`) | Match |
| Initial assessment questions | 3 | 3 (table) | 3 | Match |
| References | 2 (NHS.UK Sunburn + NHS.UK Heat exhaustion/heatstroke) | 2 (same, numbered list) | *(not present as a `references[]` field in the runtime schema today — this is new metadata added during reshaping)* | **Difference, documented, not silently corrected**: the runtime TypeScript record has no `references[]` array; this sample is the first to add one, sourced directly from the existing `provenance.sourceDocuments` field which already cited the NHS.UK sunburn URL. The second reference (heat-exhaustion/heatstroke page) is genuinely new — added because the emergency question's rationale specifically needed sourcing beyond the sunburn page alone. |

**No difference was silently corrected in only one format** — the one substantive gap (missing `references[]` in the runtime schema) is called out here rather than fixed in the JSON/PDF without also flagging it for the runtime schema itself, per the "any difference must be reported" instruction.

## Structural validation

- Zod schema (`ClinicalContentProtocolSchema`) compatibility: not run against this new DB-shaped JSON in this sample pass — the DB-shaped format is a **different, new schema** (not yet Zod-validated) that this sample is establishing, not the existing runtime schema. A structural JSON-schema validator for the new canonical format is a Phase 2 follow-up, not yet built.
- `questions.min(1)`: satisfied (3 questions).
- No `null` values present in the final JSON except the two intentionally-flagged `RESEARCH_REQUIRED`/`PENDING` fields, which are explicitly non-null placeholder strings documenting an open gap, not silent nulls.

## What this sample proves and what it does not

**Proves**: the DB-shaped canonical format can represent an open-source protocol without losing or altering any clinical content; real external sourcing (NHS.UK, with exact citations and review dates) can fill genuine metadata gaps the runtime schema lacks (`references[]`); the Research Gap Register mechanism correctly blocks a protocol with unresolved administrative fields from being called "complete," even though its clinical content is fully sourced; a real, valid PDF can be generated from the JSON via the existing Playwright dependency already used by this repo's E2E tests, with no new external tooling required.

**Does not yet prove**: numbering-scheme collision-safety across all 228 protocols (only one `AlgorithmID` was assigned); a formal JSON-schema validator for the new canonical shape; full parity automation (this report was written by hand, not by a script); PDF visual/layout fidelity against the actual approved `Abdominal Pain - Male.pdf` reference (this sample's HTML/PDF is a plain, unstyled structural approximation — matching the reference PDF's exact typography/branding is a separate template-design task, not attempted at this stage).
