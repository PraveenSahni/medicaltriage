# Management Summary - Mandatory External Action & Approval Pack

_Generated 2026-08-05. Companion to `mandatory-action-register.md` and
the 6 focused packs. NFR-156 is explicitly NOT counted as closed in
this summary - it remains Partial, per standing instruction, backed by
real 25-user/20-minute-soak evidence rather than an untested gap._

## Current compliance (unchanged by this planning batch)

- **Mandatory compliance: 74/153 = 48.4%**
- **Overall compliance: 132/396 = 33.3%**

These are the standing, previously-reported figures. This batch is a
planning/reconciliation exercise, not a closure batch - no
questionnaire response changed, so these percentages are carried
forward unchanged. A separate reconciliation finding (row-count
discrepancies between the live workbook and these standing figures,
mostly explained by `"Yes (inherited)"`/`"N/A (commercial)"` literal-
string artifacts) is documented in `mandatory-action-register.md`'s
"Scope and reconciliation note" and flagged as a recommended input to
the next `master-compliance-register` regeneration - not applied here.

## Mandatory Yes by tab (from the live workbook, 2026-08-05)

| Tab | Mandatory rows | Yes (exact string) | Unresolved |
|---|---|---|---|
| Non Functional Req | 24 | 7 | 17 |
| UX | 3 | 0 | 3 |
| " AI" | 17 | 4 | 7 (+6 N/A) |
| Cloud CSQ | 135 | 62 | 55 (+17 N/A, +4 "Yes (inherited)") |
| **Total** | **179** | **73** | **82** |

## Remaining mandatory rows by dependency category (82 rows)

| Category | Count | Rows (IDs) |
|---|---|---|
| 1. Engineering work remaining | 15 | NFR-039, NFR-040, NFR-041(NFR), NFR-076, NFR-078, NFR-118, NFR-004(AI), NFR-014(AI), DR.05, IS.50, IS.66, DR.04, AR.03, AR.13, AR.21, CO.04 (16 listed; some grouped as one project) |
| 2. Implementation complete - awaiting deployment | 1 | NFR-015 (UX) |
| 3. Documentation complete - awaiting approval | 1 | IS.02 |
| 4. Test procedure complete - awaiting execution | 2 | NFR-004 (UX), IS.07 |
| 5. Business decision required | 10 | NFR-119, NFR-010(AI), NFR-016(AI), PA.02, HR.01, HR.02, IS.10, IS.20, IS.21, IS.27 |
| 6. Legal or privacy approval required | 6 | LG.01, IG.10, IS.52, IS.55, IS.62, DR.09 |
| 7. Clinical approval required | 0 (folded into IG.09's joint decision, category 5-adjacent) | - |
| 8. Qatar Airways clarification required | 8 | NFR-016, NFR-022, NFR-038, NFR-156, NFR-185, NFR-189, NFR-016(UX) |
| 9. External audit or certification required | 13 | CO.01, CO.02, CO.03, CO.05, CO.07, CO.08, CO.09, PA.01, PA.05, PA.03, DR.06, DR.07, AR.19, NFR-041(AI) |
| 10. Third-party evidence required | 3 | NFR-058, IS.39, IS.40 |
| 11. Cannot currently comply | 12 | NFR-079, IG.01, IG.06, IG.15, PA.04, IS.13, IS.33, IS.34, IS.45, IS.53, LG.02 |
| 12. Valid N/A | 11 | NFR-064, NFR-193, IS.59, IS.41, IS.11, IS.73, SD.06, AR.17, RM.02, NFR-040(AI), NFR-044(AI) |

_(IG.09 sits across categories 5/6/7 - a joint Clinical Governance
Lead + Legal + Privacy/DPO + Business decision - counted once under
category 5 above; see `legal-privacy-action-pack.md`.)_

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
| 1 | Reclassify the 11 valid-N/A rows (confirm + update remark) | 11 | Low (~1 day) | CISO |
| 2 | Normalize 4 "Yes (inherited)" Cloud CSQ cells to exact "Yes" | 4 | Low (~0.5 day) | CISO |
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
