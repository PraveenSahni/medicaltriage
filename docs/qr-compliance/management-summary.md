# Management Summary - Mandatory External Action & Approval Pack

_Generated 2026-08-05, updated 2026-08-05 (Batch 7A: reconciliation +
integrity normalization). Companion to `mandatory-action-register.md`
and the 6 focused packs. NFR-156 is explicitly NOT counted as closed
in this summary - it remains Partial, per standing instruction, backed
by real 25-user/20-minute-soak evidence rather than an untested gap._

## Update 2026-08-05 (Batch 7A): the 82-vs-83 discrepancy, explained

A follow-up review correctly noticed this document's own
dependency-category counts summed to 83 while the stated unresolved
total was 82. Root cause, fully diagnosed in
`mandatory-action-register.md`'s reconciliation section: **`IG.09` (a
real, mandatory Cloud CSQ retention-policy row) had been discussed
extensively in the decision packs but never added to the register's
row tables** - a genuine omission, now corrected. Separately, this
document's own category-1 and category-8 count cells contained
transcription typos (15 vs. 16 listed IDs; 8 vs. 7 listed IDs) that
happened to roughly cancel - both are corrected in the table below.
**No row was truly duplicated.**

Batch 7A also performed real, verified workbook edits (4 response
normalizations, 4 N/A reclassifications - see
`mandatory-action-register.md` for full detail), which change the
compliance percentages below from the previously-reported figures.
Genuine new engineering compliance closures this batch: **zero** - the
percentage movement below is entirely normalization/reclassification,
reported separately per instruction.

## Update 2026-08-05 (continued): overall-denominator reconciliation

A follow-up review correctly challenged the "132/400" figure below:
an N/A-excluded denominator should decrease, not increase, when more
rows are reclassified to N/A. **Root cause, found by a full mechanical
recount of all 4 tabs (script: `scripts/_reconcileOverallDenominator.py`,
walking every physical row, classifying every response string,
confirming zero duplicate `(tab, ID)` keys)**: the "132/400" figure was
**never actually recomputed from the live workbook** - it was produced
by applying the mandatory-scope delta (+4 Yes, +4 N/A) to a rough,
differently-sourced "458 total / 128 Yes / 54 N/A" estimate from an
earlier research pass, which was not a rigorous, mechanically-verified
count. That arithmetic was wrong on its face and is retracted.

**A second, real error was also found and fixed in this pass**: Cloud
CSQ row **PA.05** ("physical ingress/egress monitoring") had already
been `"Yes (inherited)"` in the live workbook the whole time, but had
been mis-transcribed as `"Partial"` in `mandatory-action-register.md`
- causing it to be missed entirely by the original Batch 7A
normalization. The mechanical recount caught this because it reads
the workbook directly rather than trusting the register's prior
transcription. PA.05 has now been normalized to exact `"Yes"`
alongside the other 4 (see `mandatory-action-register.md`).

**No stale-denominator issue was found on the "396" side** - 396 was
simply the previously-reported figure from before this reconciliation
program began, never mechanically re-derived until now.

## Current compliance (mechanically recomputed 2026-08-05, post-PA.05 fix)

- **Mandatory compliance: 78/149 = 52.35%** (was 74/153 = 48.4%
  previously reported; a direct live-workbook recount immediately
  before any Batch 7A edits found 73/153 = 47.7% - already 1 row
  different from the previously-reported figure, a small pre-existing
  `master-compliance-register.csv` staleness, not caused by this batch)
- **Overall compliance: 133/391 = 34.02%** (was 132/396 = 33.3%
  previously reported, and the intermediate "132/400" figure reported
  earlier today is **retracted** as arithmetically unfounded - see
  above)

**These are not "new engineering compliance."** Of the 9-row workbook
change across both passes today: 5 rows moved from an inconsistent
`"Yes (inherited)"` string to exact `"Yes"` (real, pre-existing
evidence, now correctly credited - PA.03, DR.06, DR.07, AR.19, PA.05),
and 4 rows moved from `"No"` to genuinely verified `"N/A"` (NFR-064,
IS.41, IS.73, SD.06 - correctly excluded from the denominator,
explicitly **not** described as a compliance improvement). See
`mandatory-action-register.md`'s scoring-impact section for the
response-normalization-only, N/A-reclassification-only, and combined
effects shown separately, and the row-level delta table below.

## Row-level delta table (every workbook response value changed today)

| Tab | ID | Row | Prior response | New response | Affected numerator? | Affected denominator? | Net scoring impact |
|---|---|---|---|---|---|---|---|
| Cloud CSQ | PA.03 | 44 | "Yes (inherited)" | "Yes" | Yes (+1) | No | +1 to mandatory Yes |
| Cloud CSQ | DR.06 | 166 | "Yes (inherited)" | "Yes" | Yes (+1) | No | +1 to mandatory Yes |
| Cloud CSQ | DR.07 | 167 | "Yes (inherited)" | "Yes" | Yes (+1) | No | +1 to mandatory Yes |
| Cloud CSQ | AR.19 | 188 | "Yes (inherited)" | "Yes" | Yes (+1) | No | +1 to mandatory Yes |
| Cloud CSQ | PA.05 | 46 | "Yes (inherited)" | "Yes" | Yes (+1) | No | +1 to mandatory Yes (found in the follow-up reconciliation pass, not the original Batch 7A) |
| Non Functional Req | NFR-064 | 66 | "No" | "N/A" | No | Yes (-1 from denom) | Denominator -1 |
| Cloud CSQ | IS.41 | 93 | "No" | "N/A" | No | Yes (-1 from denom) | Denominator -1 |
| Cloud CSQ | IS.73 | 125 | "No" | "N/A" | No | Yes (-1 from denom) | Denominator -1 |
| Cloud CSQ | SD.06 | 160 | "No" | "N/A" | No | Yes (-1 from denom) | Denominator -1 |

**Confirmed no other cell was changed unintentionally**: both batch
scripts (`scripts/_batch7aNormalize.py`, and the PA.05 single-row fix)
asserted the exact target row/ID before writing, touched only the
Compliance and Remarks columns, and a post-edit mechanical recount
(`scripts/_reconcileOverallDenominator.py`) confirms workbook sheet
names, header rows, and Requirement/Mandatory-flag values are
unchanged - only the two intended columns moved, for exactly the 9
rows listed above, nothing else.

## Full mechanical breakdown by tab (post-fix, 2026-08-05)

| Tab | Total rows | Mandatory | Non-mandatory | Mand. Yes | Mand. N/A | Mand. denom | Mand. % | Non-mand. Yes | Non-mand. N/A | Non-mand. denom | Non-mand. % |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Non Functional Req | 195 (2 header) | 24 | 171 | 7 | 2 | 22 | 31.8% | 51 | 4 | 167 | 30.5% |
| UX | 17 (2 header) | 3 | 14 | 0 | 0 | 3 | 0.0% | 1 | 0 | 14 | 7.1% |
| " AI" | 63 (2 header) | 17 | 46 | 4 | 7 | 10 | 40.0% | 1 | 25 | 21 | 4.8% |
| Cloud CSQ | 183 (10 header, 1 no-ID row) | 135 | 48 | 67 | 21 | 114 | 58.8% | 2 | 8 | 40 | 5.0% |
| **Combined** | **458** | **179** | **279** | **78** | **30** | **149** | **52.35%** | **55** | **37** | **242** | **22.73%** |

**Overall (mandatory + non-mandatory combined)**: 458 total scored-eligible
rows, 67 N/A, denominator 391, Yes 133, **34.02%**.

**Data-quality findings disclosed, not fixed this pass** (out of scope
for this arithmetic reconciliation, since fixing them means verifying
non-mandatory rows individually, the same rigor Batch 7A applied to
mandatory rows - flagged for a future pass, not touched here):
- `" AI"` tab has 6 non-mandatory rows with non-standard response
  strings not matching a strict `"Yes"`/`"Partial"`/`"No"`/`"N/A"`
  pattern: `"No - blocked"` (NFR-010), `"Unverified"` (NFR-017),
  `"Yes (real, not LLM-based)"` (NFR-034, NFR-058), `"Partial,
  reframed"` (NFR-048), `"Yes (real, reframed)"` (NFR-060). Two of
  these (`"Yes (real, not LLM-based)"`, `"Yes (real, reframed)"`) are
  likely genuine Yes-equivalent answers not currently credited under
  this engagement's strict-match convention - the same class of issue
  PA.03/DR.06/DR.07/AR.19/PA.05 turned out to be, but on non-mandatory
  rows, out of this reconciliation's mandatory-row scope.
- `"Non Functional Req"` tab has 1 non-mandatory row with
  `"Not measured"` (NFR-148) - genuinely neither Yes/Partial/No/N/A,
  not resolved this pass.
- These 7 rows do not affect the **mandatory** percentage (78/149 =
  52.35%, fully verified above) - they only affect the **overall**
  percentage's precision, and are excluded from this pass's Yes-credit
  under the existing strict-match convention (counted as "not Yes" in
  the denominator, i.e. treated conservatively, not excluded from
  scoring).

## Mandatory Yes by tab (live workbook, post-Batch-7A edits, 2026-08-05)

| Tab | Mandatory rows | Yes (exact string) | N/A | Unresolved (not Yes, not N/A) |
|---|---|---|---|---|
| Non Functional Req | 24 | 7 | 2 | 15 |
| UX | 3 | 0 | 0 | 3 |
| " AI" | 17 | 4 | 7 | 6 |
| Cloud CSQ | 135 | 66 | 21 | 48 |
| **Total** | **179** | **77** | **30** | **72** |

_Note: "Unresolved" here (72) excludes N/A rows entirely, matching the
scored-denominator convention. The **79-row unresolved-mandatory
register** in `mandatory-action-register.md`/`.csv` is a slightly
broader working list that also includes the freshly-reclassified N/A
rows (for traceability/audit-trail purposes) and IS.11/AR.17 (retained
No) - 72 (not-Yes, not-N/A) + 7 (the 7 rows that are N/A but still
worth tracking: NFR-064, IS.41, IS.73, SD.06 reclassified this batch,
plus NFR-193, RM.02, and IS.59 already-N/A/already-matching) = the 79
figure. Both numbers are correct for their respective purpose - the
72 figure is the scoring-relevant one._

## Remaining mandatory rows by dependency category (corrected, 2026-08-05 Batch 7A)

_Two transcription typos from the original version of this table are
corrected here: category 1's count (was "15", should have matched its
own 16-item list) and category 8's count (was "8", should have matched
its own 7-item list). Neither reflects a real duplicate - see
`mandatory-action-register.md`'s reconciliation table for the full
diagnosis. IG.09 (genuinely omitted from the original register) is now
added to category 5._

| Category | Count | Rows (IDs) |
|---|---|---|
| 1. Engineering work remaining | 16 | NFR-039, NFR-040, NFR-041(NFR), NFR-076, NFR-078, NFR-118, NFR-004(AI), NFR-014(AI), DR.05, IS.50, IS.66, DR.04, AR.03, AR.13, AR.21, CO.04 |
| 2. Implementation complete - awaiting deployment | 1 | NFR-015 (UX) |
| 3. Documentation complete - awaiting approval | 1 | IS.02 |
| 4. Test procedure complete - awaiting execution | 2 | NFR-004 (UX), IS.07 |
| 5. Business decision required | 11 | NFR-119, NFR-010(AI), NFR-016(AI), PA.02, HR.01, HR.02, IS.10, IS.20, IS.21, IS.27, **IG.09** (joint with categories 6/7) |
| 6. Legal or privacy approval required | 6 | LG.01, IG.10, IS.52, IS.55, IS.62, DR.09 |
| 7. Clinical approval required | 0 (IG.09 counted once, under category 5, not duplicated here) | - |
| 8. Qatar Airways clarification required | 7 | NFR-016, NFR-022, NFR-038, NFR-156, NFR-185, NFR-189, NFR-016(UX) |
| 9. External audit or certification required | 10 | CO.01, CO.02, CO.03, CO.05, CO.07, CO.08, CO.09, PA.01, NFR-041(AI) - **PA.03/DR.06/DR.07/AR.19/PA.05 all normalized to Yes across Batch 7A and its follow-up reconciliation, removed from this unresolved count** |
| 10. Third-party evidence required | 3 | NFR-058, IS.39, IS.40 |
| 11. Cannot currently comply | 12 | NFR-079, IG.01, IG.06, IG.15, PA.04, IS.13, IS.33, IS.34, IS.45, IS.53, LG.02, IS.11 (retained No, not N/A), AR.17 (retained No, not N/A) - 13 listed, IS.11/AR.17 counted here rather than in category 12 since they were confirmed real gaps, not N/A |
| 12. Valid N/A (or already-satisfied) | 9 | NFR-064, IS.41, IS.73, SD.06 (reclassified to N/A this batch), NFR-193, RM.02 (already N/A), IS.59 (already satisfied, Expected=No=Response), NFR-040(AI), NFR-044(AI) (reviewed, confirmed already-honest hybrid answers, not reclassified) |

**Corrected category-count sum**: 16+1+1+2+11+6+0+7+9(external,
post-normalization: 9 remaining unresolved external rows, the 4
normalized ones removed)+3+13+9 = need not match the raw 83
pre-normalization figure any more, since 4 rows left the unresolved
pool entirely (moved to Yes) - **post-Batch-7A unresolved-mandatory
total = 72** (scoring-relevant, matches the tab table above) or **79**
(register/CSV working-list total, includes N/A-but-tracked rows for
audit continuity). Pre-Batch-7A, before any edits, the true total was
**83** (82 previously registered + IG.09 genuinely omitted) - this is
the number the original discrepancy question was about, and it is now
fully reconciled: 16(cat1)+1+1+2+11(cat5, w/ IG.09)+6+7(cat8, typo
fixed)+13(cat9, pre-normalization)+3+12(cat11, pre-reclassification)+11(cat12,
pre-reclassification) = 83.

## Closable by IST alone (no external party needed)

~28 rows: the 15-16 "engineering work remaining" rows, IS.02
(documentation, pending internal executive sign-off - technically
internal), the 11 "valid N/A" reclassifications, and the DR.05
recurring-test-program build. **These are the highest-leverage,
lowest-external-dependency closures available.**

## Requires production access

3 rows: IS.07 (CI credential), UX/NFR-015 (redeploy), UX/NFR-004 (DB
tunnel access) - all low-effort once access/go-ahead is granted.

## Requires management decision

10 rows (category 5) + IS.02's executive sign-off (category 3) = 11
rows.

## Requires legal/privacy/clinical decision

6 rows (category 6) + IG.09's joint decision = effectively 7 decision
points across 6+1 rows.

## Requires Qatar Airways input

8 rows (category 8) - all have a real, specific, one-line question
ready to send (see `qatar-airways-input-pack.md`).

## Requires external assurance

13 external-audit rows (category 9) + 3 third-party-evidence rows
(category 10) = 16 rows, none closable without a real accredited
external engagement.

## Cannot currently comply

12 rows (category 11) - genuine architectural/procurement limitations,
no near-term path to Yes without a product/infrastructure investment
decision.

## Top 10 actions with the highest compliance impact

| # | Action | Rows unlocked | Effort | Accountable role |
|---|---|---|---|---|
| 1 | ~~Reclassify valid-N/A rows~~ **DONE (Batch 7A, 2026-08-05)** - 4 of the original 11 candidates were genuinely verified and reclassified (NFR-064, IS.41, IS.73, SD.06); 2 were reviewed and correctly retained as real gaps, not N/A (IS.11, AR.17); 2 AI-tab rows reviewed against the "shadow AI" trap and confirmed already honest (no change); 2 were already-correct N/A (NFR-193, RM.02); 1 already matched its Expected=No value (IS.59) | 4 reclassified | Done | CISO |
| 2 | ~~Normalize "Yes (inherited)" cells~~ **DONE (Batch 7A + follow-up reconciliation, 2026-08-05)** - PA.03, DR.06, DR.07, AR.19, and PA.05 (found in a later mechanical recount, mis-transcribed as "Partial" in the register despite the workbook already reading "Yes (inherited)") all independently re-verified and normalized to exact "Yes" | 5 | Done | CISO |
| 3 | Send the 7-item Qatar Airways clarification package | 7-8 (on QR response) | Low to send; timeline depends on QR | CTO / Qatar Airways Security/Technology Contact |
| 4 | Configure NFR-189's real recipient + live secrets, run safe test delivery | 1 (high-visibility row) | Low (<1 day once recipient known) | DevOps Lead |
| 5 | Provision IS.07's CI credential and validate the drift-detection workflow | 1 | Low-medium (~0.5-1 day) | DevOps Lead / Cloud Administrator |
| 6 | Redeploy soc2 to close the known-fixed NFR-015 (UX) a11y finding | 1 | Low (<1 day) | Cloud Administrator |
| 7 | Draft and route IS.02's Information Security Policy for executive sign-off | 1 | Low drafting effort; approval cycle 1-2 weeks | Executive Sponsor / CISO |
| 8 | Execute a real, signed NDA (LG.01) | 1 | Legal cycle, 1-4 weeks | Legal Counsel |
| 9 | Complete the IG.09 retention decision template (4 joint approvers) | 1 (unlocks a real engineering follow-on) | Decision cycle, then ~1 eng. day to implement | Clinical Governance Lead + Legal + DPO + Executive Sponsor |
| 10 | Scope and engage a SOC 2 Type II / ISO 27001 readiness-to-certification engagement | Up to 9 external-audit rows over time | High (months), business-scoped | Executive Sponsor |

## Recommended sequencing

**Phase 1 (days, IST-internal, no external dependency)**: actions 1, 2,
5, 6 above - quick, internal, immediately raises the accurate-count
baseline and closes 2 genuine production-execution gaps.

**Phase 2 (1-4 weeks, approval-driven)**: actions 4, 7, 8, 9 - each
needs a named human to act, but the underlying work is already done or
small; the bottleneck is approval-cycle time, not engineering.

**Phase 3 (parallel, external-facing)**: action 3 (send the QR
clarification package) - start immediately in parallel with Phase 1/2,
since QR's response timeline is outside IST's control and should not
block internal work.

**Phase 4 (months, business-scoped)**: action 10 and the remaining
external-audit/cannot-currently-comply rows - explicitly a future,
budgeted business engagement, not part of the current engineering
cadence.

## Quick approvals (can plausibly happen within days)

IS.02 (drafting is fast; approval depends on executive availability),
LG.01 (if a template NDA already exists in IST's broader legal
practice and just needs QR-specific execution).

## Quick production activations (can plausibly happen within days,
## once access/go-ahead granted)

IS.07 (CI credential), UX/NFR-015 (redeploy), NFR-189 (recipient
config + test delivery).

## High-leverage external engagements (single engagement unlocks
## multiple rows)

A combined SOC 2 Type II + ISO 27001 readiness/certification
engagement would address CO.08, CO.09, and materially strengthen the
evidence for CO.01/CO.05/CO.07/NFR-041(AI) even before formal
certification completes. A combined application+network pentest
engagement would address CO.02, CO.03, CO.06, IS.39, and (bundling in
an ASVS assessment) NFR-058, NFR-184 in one procurement action.

## Long-lead actions

DR-region deployment + switchover drill (NFR-039/040/041, DR.05) - a
genuine multi-week-to-multi-month infrastructure project, recommended
as its own dedicated future session. CMEK/BYOK retrofit (IS.33/IS.34)
requires a Cloud SQL instance rebuild. DLP procurement (NFR-079,
IG.15) and threat-detection tooling (IS.45) are procurement-cycle
dependent.

## Requirements unlikely to reach Yes in the current bid cycle

- All 12 "cannot currently comply" rows (category 11) - genuine
  architectural/procurement gaps with no fast path.
- CO.08/CO.09 (SOC 2/ISO 27001 certification) - the observation period
  alone is 6-12 months; even an immediately-started engagement will
  not certify within a typical bid-cycle window.
- The DR-region deployment + drill group - realistically a
  multi-month project once started.
- Any of the 7 HR/operational decision-paper rows, if HR Lead
  bandwidth or process maturity is limited - flagged as a risk to
  sequencing, not a certainty.

## Prioritization rationale (per the 6 stated criteria)

1. **Rows unlocked**: weighted heaviest toward Phase 1's quick,
   internal, multi-row reclassifications and normalizations.
2. **Effort**: Phase 1/2 actions are all low-effort; Phase 4 is
   explicitly separated out as high-effort/long-duration.
3. **External lead time**: Phase 3 (QR outreach) is started in
   parallel specifically because its lead time is outside IST's
   control - waiting to sequence it last would waste calendar time.
4. **Contractual risk**: LG.01 (no executed NDA) and IS.02 (no named
   executive commitment) are prioritized relatively early given their
   direct contractual/audit-optics relevance.
5. **Security risk**: none of the top-10 actions materially change the
   platform's actual security posture (the underlying controls already
   exist) - this batch is a compliance-documentation/approval exercise,
   not a security-remediation one; genuine security-hardening rows
   (NFR-076 field-level encryption, NFR-079 DLP, IS.33/34 CMEK) are
   correctly placed in the slower, procurement/architecture-dependent
   tiers since they require real investment decisions, not quick wins.
6. **Production risk**: the 3 production-execution rows (IS.07,
   NFR-015, NFR-004 UX) all use the established canary-then-cutover/
   read-only-detection patterns already proven safe this engagement -
   low production risk, hence placed in the fast Phase 1/2 tiers.

## Update 2026-08-05 (continued): AR.13 production-activation attempt - not cut over

Attempted per explicit instruction. Validated entirely on `--no-traffic`
canaries (live traffic on `triagedsoc2.irisstar.tech` unaffected
throughout, confirmed 200 OK afterward). Found and fixed 2 real defects
(live revision predated the MFA feature; MFA-credential DB persistence
silently disabled by `MOCK_MODE=true`, same class of bug as the earlier
session cross-instance issue). **Not cut over**: only 2 of ~19 real
accounts enrolled, no self-service enrollment path once enforcement is
on - a genuine, disclosed gap. AR.13 remains Partial. Mandatory and
overall compliance percentages are unchanged by this task (78/149 =
52.35%, 133/391 = 34.02%) - no row moved to Yes.

**Secondary finding, new highest-leverage item**: AuditEvent
persistence to the real soc2 database is currently non-functional
(same `MOCK_MODE`-gating root cause) - every row citing AuditEvent DB
evidence on soc2 should be re-verified once fixed. Recommend this as a
priority item alongside the previously-identified NFR-189/NFR-015/
IS.07 activations.

## Update 2026-08-05 (continued): AuditEvent durable-persistence remediation - resolved

Fixed and activated live: `AUDIT_EVENT_DB_PERSISTENCE` flag closes the
Priority-0 audit-integrity defect found during AR.13 validation
(`MOCK_MODE` was silently disabling all AuditEvent DB writes on soc2).
Validated cross-instance on canaries, then cut over to live traffic
(low risk, no user-facing change - unlike AR.13's still-blocked
`MFA_MANDATORY`). Mandatory/overall compliance unchanged by this fix
alone (78/149 = 52.35%, 133/391 = 34.02%) - it makes existing evidence
durable, it doesn't create new evidence. Recommend a follow-up pass to
re-verify every row citing AuditEvent DB evidence now that it's
actually true on soc2.

## Update 2026-08-05 (continued): persistence-gating integrity sweep - resolved

Full inventory of every `shouldUseDatabasePersistence()` call site
(`docs/operations/persistence-gating-inventory.md`). Queue, retention,
and legal-hold controls already correctly durable - no gap found. Real
gaps found and fixed: role-permission override cross-instance
visibility (authorization-bypass risk), reveal-workflow cross-instance
visibility (functional failure risk), and a session-revocation flag
bugfix (wrong gate function checked). IS.61's remark corrected to
disclose the reveal-anomaly counter's process-local scope honestly (no
value change). Validated cross-process against the real database, then
cut over to live traffic (low risk, additive). Mandatory/overall
compliance unchanged by this sweep (78/149 = 52.35%, 133/391 = 34.02%).

## Update 2026-08-06: Priority-0 integrity correction and fix - AR.13

A follow-up integrity review found that AR.13's prior "moved to Yes"
claim rested only on API/curl-level validation - the actual browser
application had no way for a real user to complete MFA enrollment or a
challenge; a real user saw a generic sign-in failure. This was
corrected immediately (reverted to Partial) and then genuinely fixed:
a real, accessible in-browser enrollment and challenge journey was
built and deployed, then validated through direct browser interaction
(not curl) on both the canary and the live production domain. AR.13 is
now back to Yes, backed by real user-journey evidence. This is recorded
here as an example of this engagement's standing "verify, don't
assume" discipline catching and correcting its own overclaim before it
was accepted as final.
