# Master Compliance Register - overview

_Generated 2026-08-05 from `NFR_COTS_CSQ_v8.3-edc758c5-2b70-496a-9db4-947af34a67a4.xlsx`
(OneDrive, `000.PSDownload`). This document is the human-readable index and
methodology note for **`master-compliance-register.csv`**, which is the
authoritative, full-detail register (459 rows, 20 columns) - open the CSV
for the complete per-row data. Duplicating all 459 rows into prose here
would just be a worse copy of the same data; this file explains how it was
built and what's genuinely known versus still pending._

## Scope

All scored rows (any non-blank Compliance/Supplier-Response value,
including N/A) across the 4 relevant tabs:

| Tab | Total scored | Mandatory | Non-mandatory |
|---|---|---|---|
| Non Functional Req | 195 | 24 | 171 |
| UX | 17 | 3 | 14 |
| AI | 63 | 17 | 46 |
| Cloud CSQ | 184 | 135 | 49 |
| **All tabs** | **459** | **179** | **280** |

(Note: this table counts N/A rows too, unlike the compliance-percentage
summaries elsewhere in this engagement, which exclude N/A from the
denominator per standing instruction. Both views are valid for different
purposes - this register counts *rows*, the percentage summaries count
*scored-and-applicable* rows.)

## How each row was classified

Every row was mechanically extracted from the xlsx (tab, ID, requirement
text, mandatory flag, current response, current remarks - all real,
pulled programmatically, not retyped). Each row was then put into one of
four honesty-preserving buckets:

1. **Closed** (168 rows) - already "Yes" or genuinely "N/A" in the current
   workbook, or one of the specific rows this engagement has already
   investigated, implemented, and verified this session (soft-delete,
   org export, legal hold, privacy anomaly detection, audit-completeness
   fixes, request-ID propagation, and the 10 documentation closures from
   the 2026-08-05 doc batch). Each has a real evidence pointer in the
   `Evidence Location` column.
2. **Flagged - blocked** (3 rows: NFR-119, IS.07, IG.09) - explicitly
   investigated and found to require either live production
   infrastructure writes, missing CI credentials, or a business/legal
   decision that engineering cannot make unilaterally. See
   `production-execution-register.md` and `business-decision-register.md`.
3. **In triage** (4 rows: NFR-138, NFR-152, NFR-156, NFR-189) - real gaps
   already understood in detail (a genuine load-test perf regression;
   a monthly-SLI-report script that was marked done but never built) with
   a concrete next action defined, not yet executed.
4. **Not yet triaged** (284 rows) - every remaining Partial/No/Other row.
   **Important**: "not yet triaged" does NOT mean "no information exists."
   Many of these rows already carry detailed, honest remarks from earlier
   passes of this same engagement (e.g. CO.08's SOC 2 Type II gap, IS.33's
   CMEK platform-limitation finding, PA.01's Google-Cloud-inherited
   physical-security attestation). This register's `Closure Category`
   column for these rows was assigned via a **mechanical keyword pass**
   over that existing remark text (see `scripts/_categorizeRemaining.py`)
   to give a first-pass routing, not a fully independent re-investigation.
   Treat this categorization as a starting triage, not a final verdict -
   each one still needs the row-by-row Stage 2 evidence-discovery pass
   before its questionnaire response changes.

### First-pass categorization of the 284 not-yet-independently-verified rows

| Closure category (first pass) | Count |
|---|---|
| Existing control - evidence missing (tentative) | 119 |
| Cannot currently comply | 83 |
| Valid N/A (candidate - verify) | 25 |
| External audit or certification required | 13 |
| Testing or validation closure | 10 |
| Documentation closure | 9 |
| Operational process closure | 9 |
| Cloud or infrastructure closure | 8 |
| Privacy or legal closure | 8 |

## What this register does NOT yet contain

- Independent re-verification of the 119 "existing control - evidence
  missing (tentative)" rows against actual source code/config (Stage 2).
  This engagement's earlier sessions already did real investigation for
  most of these (the remarks quoted in the CSV are genuine, not
  invented) - what's missing is a fresh, current-code cross-check before
  any status change.
- Full column detail (Responsible Role / Dependency / Effort / Risk /
  Validation Method) for the 284 not-yet-triaged rows - these are marked
  `TBD` in the CSV rather than guessed.

## Files

- `master-compliance-register.csv` - full 459-row, 20-column register.
- `scripts/_genComplianceRegister.py`, `scripts/_categorizeRemaining.py` -
  the generation scripts (kept for re-runnability if the xlsx changes;
  not part of the application, safe to delete once the register is
  considered final for this engagement phase).
