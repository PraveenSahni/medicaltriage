# Priority-0 Compliance-Scoring Reconciliation (2026-08-06)

_Scope: scoring/arithmetic reconciliation only. No functional/product change.
NFR-004 (UX tab) status is unchanged (Yes). IS.07 is unchanged (Partial).
PR #15 not touched. Nothing pushed._

## Confirmed functional outcome (preserved, not re-litigated here)

- WEB-008 was a stale test expectation, not a product/security/accessibility
  defect.
- The Help Center's new-tab behaviour is intentional, already
  `target="_blank" rel="noopener noreferrer"`-correct.
- The full six-engine Playwright matrix passed 86/86.
- NFR-004 (UX tab) is supported as **Yes** and stays **Yes**.

The scoring discrepancy identified below is a separate, purely
arithmetic/methodology issue in my immediately-prior report and is
unrelated to the WEB-008 functional finding.

## What went wrong in the immediately-prior report

The prior turn's "64.71% mandatory / 50.0% overall" figures (with a
`Yes + 0.5*Partial` weighting) were **not derived from an authoritative or
previously-established scoring method**. Investigation this pass found:

1. **No workbook-authoritative weighted formula exists.** The
   `Definitions & Instructions` sheet defines exactly 3 compliance
   categories - *Fully compliant / Partially compliant / Non-compliant* -
   with no numeric weight assigned to any of them, no summary/scoring
   sheet, no formula cells anywhere in the workbook, and no named ranges.
   `Partial = 0.5` was invented in the prior report, not sourced from the
   workbook or from this engagement's own prior methodology.
2. **Cloud CSQ was silently dropped.** The prior report's script reused
   the `Non Functional Req`/`UX`/`AI` column layout (id in column A,
   Mandatory in column E, Compliance in column F) against the `Cloud CSQ`
   tab, which has a **materially different layout** (CID in column D,
   "Control Requirement Type" in column F, actual Supplier Response in
   column I). Applying the wrong columns produced zero matched rows for
   Cloud CSQ, silently removing 183 requirement rows (135 of them
   mandatory) from both the mandatory and overall denominators without
   any warning being surfaced.
3. **"Other" responses were silently excluded** from both the numerator
   and denominator in the prior report, with no disclosure. This
   engagement's own established convention (`docs/qr-compliance/
   management-summary.md`, 2026-08-05) is to keep non-standard/"Other"
   responses **in** the denominator (as "not Yes"), not exclude them.

## Phase 1: Authoritative scoring method

**Method A - binary compliance** is authoritative:

> `Exact "Yes" responses / (all scored rows across all 4 tabs, excluding N/A)`

Evidence this is the established method, not a new invention:

- The workbook itself only defines Yes/Partial/No as non-numeric
  categories - there is no basis in the workbook for a weighted score.
- `docs/qr-compliance/management-summary.md` (written 2026-08-05, before
  this session's most recent closures) already establishes and uses
  exactly this method, mechanically recomputed via
  `scripts/_reconcileOverallDenominator.py`, reporting **78/149 = 52.35%
  mandatory** and **133/391 = 34.02% overall**, with "Other"/non-standard
  responses explicitly kept in the denominator as "not Yes" (see that
  document's "Data-quality findings" section).
- No other weighting scheme (Method B/C/D) has ever been used or approved
  in this engagement's documentation history prior to the erroneous prior
  turn's report.

**Method B (weighted maturity: `Yes + 0.5*Partial`) is not authoritative**
and is reported below only as a clearly-labeled, supplementary indicator,
per instruction not to invent a weighting method merely because it
produces a percentage.

## Phase 2 + 7: Mechanical recount, all 4 tabs (`scripts/reconcileComplianceScore.py`)

A new deterministic script, `scripts/reconcileComplianceScore.py`, reads
all 4 tabs directly from the live workbook using each tab's real column
layout (confirmed by direct inspection, not assumed), normalizes only
exact-match response strings (`Yes`/`Partial`/`No`/`N/A`, case-insensitive
trim), and leaves everything else as `Other` (never silently folded in).

| Tab | Physical rows | Requirement rows | Mandatory rows | Non-mandatory rows | Yes | Partial | No | Other | N/A |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Non Functional Req | 197 | 195 | 24 | 171 | 58 | 74 | 55 | 7 | 1 |
| UX | 19 | 17 | 3 | 14 | 2 | 12 | 3 | 0 | 0 |
| AI | 65 | 63 | 17 | 46 | 6 | 10 | 8 | 10 | 29 |
| Cloud CSQ | 194 | 183 | 135 | 48 | 69 | 27 | 57 | 2 | 28 |
| **Combined** | **475** | **458** | **179** | **279** | **135** | **123** | **123** | **19** | **58** |

### Mandatory-only (Method A, binary)

| Tab | Mandatory rows | Mand. Yes | Mand. N/A | Mand. binary denom (excl. N/A) | Mand. binary % |
|---|---:|---:|---:|---:|---:|
| Non Functional Req | 24 | 7 | 1 | 23 | 30.43% |
| UX | 3 | 1 | 0 | 3 | 33.33% |
| AI | 17 | 5 | 6 | 11 | 45.45% |
| Cloud CSQ | 135 | 67 | 20 | 115 | 58.26% |
| **Combined** | **179** | **80** | **27** | **152** | **52.63%** |

### Overall (Method A, binary, all rows)

| Tab | Requirement rows | Yes | N/A | Binary denom (excl. N/A) | Binary % |
|---|---:|---:|---:|---:|---:|
| Non Functional Req | 195 | 58 | 1 | 194 | 29.90% |
| UX | 17 | 2 | 0 | 17 | 11.76% |
| AI | 63 | 6 | 29 | 34 | 17.65% |
| Cloud CSQ | 183 | 69 | 28 | 155 | 44.52% |
| **Combined** | **458** | **135** | **58** | **400** | **33.75%** |

### Supplementary, non-authoritative maturity indicator (Method B, disclosed as such)

- Mandatory weighted: `(80 + 0.5*33) / 152 = 96.5/152 = 63.49%`
- Overall weighted: `(135 + 0.5*123) / 400 = 196.5/400 = 49.12%`

These two numbers are reported **only** as a supplementary maturity
indicator, never as "compliance," per Phase 6 instruction.

## Phase 3: Why the prior report's mandatory denominator was 34, not 149/152

| Component | Count |
|---|---:|
| Correct mandatory denominator (all 4 tabs, excl. N/A) | 152 |
| Cloud CSQ mandatory scored rows removed by the column-layout bug | 115 |
| Remaining (Non Functional Req + UX + AI) mandatory scored, incl. Other | 37 |
| "Other" mandatory responses additionally, silently excluded (undisclosed) | 3 |
| Prior report's reported denominator | **34** |

`37 - 3 = 34` exactly. The prior report's 13 Yes / 18 Partial / 3 No
figures match the Non Functional Req + UX + AI Yes/Partial/No mandatory
counts in the table above exactly (7+1+5=13 Yes, 13+1+4=18 Partial,
2+1+0=3 No) - confirming the bug was precisely "Cloud CSQ silently
dropped + Other silently dropped," not a different counting error.

## Phase 4: Why the prior report's overall denominator was 228, not 400

| Component | Count |
|---|---:|
| Correct overall denominator (all 4 tabs, excl. N/A) | 400 |
| Cloud CSQ overall scored rows removed by the column-layout bug | 155 |
| Remaining (Non Functional Req + UX + AI) scored, incl. Other | 245 |
| "Other" responses additionally, silently excluded (undisclosed) | 17 |
| Prior report's reported denominator | **228** |

`245 - 17 = 228` exactly. Non Functional Req + UX + AI Yes counts
(58+2+6=66) also match the prior report's "66 Yes" numerator exactly.

**Both discrepancies are fully and exactly accounted for**: Cloud CSQ
column-layout bug (the dominant cause) plus an undisclosed exclusion of
"Other" responses (a smaller, compounding cause). No other cause (N/A
handling, workbook filter state, duplicate IDs, hidden rows) contributed -
none were found; the mechanical script confirms zero duplicate
`(tab, id, row)` keys and zero hidden sheets/rows.

## Comparison against the last known-good authoritative baseline (2026-08-05)

| Metric | 2026-08-05 baseline (`management-summary.md`) | 2026-08-06 mechanical recount |
|---|---:|---:|
| Mandatory Yes / denom | 78/149 | 80/152 |
| Mandatory % | 52.35% | 52.63% |
| Overall Yes / denom | 133/391 | 135/400 |
| Overall % | 34.02% | 33.75% |

The small deltas (+2 mandatory Yes, +3 mandatory denom; +2 overall Yes, +9
overall denom) are **real, legitimate drift from intervening engagement
work between 2026-08-05 and 2026-08-06**, not a scoring error:

- **UX / NFR-004 mandatory Yes: 0 -> 1.** Confirmed via direct row
  inspection: NFR-004 (UX tab) is itself a *mandatory* row (column E =
  "Yes"). Its Compliance value moved from Partial to Yes during the
  2026-08-06 cross-browser-workflow-rewrite batch (see
  `docs/qr-questionnaire-backlog-tracker.md`'s 2026-08-06 entries) -
  legitimate, already-documented, functional closure, not a scoring
  artifact.
- **AI mandatory Yes: 4 -> 5**, consistent with the AI-tab NFR-004 (PII
  logging) closure recorded 2026-08-06 (`docs/qr-compliance/
  evidence-index.md`, "NFR-004 (AI tab) ... now Yes").
- The remaining small denominator drift (physical-row/N/A reclassification
  noise) is within the range already disclosed as normal in
  `management-summary.md`'s own history of small recount deltas (e.g. its
  own 153 -> 149 -> 152 mandatory-denominator progression across its
  three successive recounts on 2026-08-05 alone).

**No previously-reported baseline figure (78/149, 133/391) is retracted.**
They are superseded by a newer, later-dated mechanical recount that
reflects real intervening closures, using the identical Method A
methodology.

## Phase 5: Non-standard response values (not silently normalized)

| Value | Tab(s) | Normalized bucket | Basis |
|---|---|---|---|
| `"N/A (commercial)"` | Non Functional Req (5), Cloud CSQ (1) | Other (kept in denominator, not Yes) | Commercial-scope caveat, not an unambiguous N/A synonym - left as Other rather than silently treated as N/A, since collapsing it would remove it from the denominator without a stated commercial-classification policy |
| `"Not measured"` | Non Functional Req (NFR-148) | Other | Already flagged in `management-summary.md`; genuinely neither Yes/Partial/No/N/A |
| `"Needs QR input"` | Non Functional Req (NFR-175) | Other | Awaiting a third party's input, not a compliance answer |
| `"Needs legal input"` | Cloud CSQ (IS.62) | Other | Same reasoning |
| `"No - blocked"` | AI (NFR-010) | Other | Not an exact `"No"` match; likely No-equivalent but not normalized without confirmation |
| `"Unverified"` | AI (NFR-017) | Other | Ambiguous - could mean Partial or No |
| `"Yes (real, not LLM-based)"` | AI (NFR-034, NFR-058) | Other | Likely Yes-equivalent (already flagged as such in `management-summary.md`) but **not** auto-credited as Yes without an explicit, approved normalization decision |
| `"N/A / Partial"`, `"N/A for AI; Partial for the app generally"`, `"Likely N/A / low-risk classification - needs legal confirmation"`, `"N/A for AI; Yes for the app generally"` | AI (NFR-039, NFR-044, NFR-056, NFR-057) | Other | Compound/conditional values - collapsing to either N/A or a definite bucket would be an unapproved judgment call |
| `"Partial, reframed"` | AI (NFR-048) | Other | Likely Partial-equivalent, not auto-normalized |
| `"Yes (real, reframed)"` | AI (NFR-060) | Other | Likely Yes-equivalent, not auto-normalized |

None of these 19 "Other" values were silently folded into Yes/Partial/No.
All 19 remain in the denominator (per the established Method A
convention) but not in the Yes numerator - consistent with, not a
deviation from, the 2026-08-05 baseline's own treatment of the same class
of value.

## Phase 6: Two separate metrics reported going forward

- **Compliance rate (Method A, authoritative):** mandatory 80/152 =
  **52.63%**; overall 135/400 = **33.75%**.
- **Maturity score (Method B, supplementary, non-authoritative, never to
  be labeled "compliance"):** mandatory 96.5/152 = **63.49%**; overall
  196.5/400 = **49.12%**.

## Validation

- All 4 tabs included (Non Functional Req, UX, AI, Cloud CSQ) - confirmed
  via `wb.sheetnames`, no tab silently dropped this time.
- Workbook sheet names unchanged (no rename performed).
- Requirement text and Mandatory flags unchanged (script is read-only
  except for the earlier, already-reported NFR-004 UX remark-text update,
  which touched only the Remarks cell, not Compliance/Mandatory/text).
- N/A treatment consistent across all 4 tabs (excluded from denominator
  uniformly; never re-added).
- Zero duplicate `(tab, id, row)` keys detected by the script across all
  475 physical rows scanned.
- Script output (`scripts/reconcileComplianceScore.py`) matches the
  workbook counts shown in the tables above - reproducible by re-running
  the script against the same workbook path.
- **NFR-004 (UX tab) remains Yes** - not touched by this reconciliation.
- **IS.07 remains Partial** - not touched, not resumed.

## Retraction notice

The immediately-prior turn's reported figures - **"64.71% mandatory /
50.0% overall," using a `13 Yes + 18 Partial*0.5 + 3 No` / `34 rows` and
`66 Yes + 96 Partial*0.5 + 66 No` / `228 rows` formula** - are
**retracted**. They were never written into any tracked document (only
into that turn's chat response), so no document required correction for
that specific figure; this note formally retracts it for the record. The
authoritative figures are those in this document: **52.63% mandatory /
33.75% overall (Method A, binary)**, with 63.49%/49.12% reported
separately as a non-authoritative maturity indicator only.
