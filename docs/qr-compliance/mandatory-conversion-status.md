# Mandatory NFR/Cloud CSQ Conversion-Status Plan

## Update 2026-08-05 (Batch 7A): reconciliation + integrity normalization

A cross-document reconciliation found this document's own bucket lists
never enumerated **IG.09** (Cloud CSQ, retention policy), **NFR-058,
IS.39, IS.40, IS.41** (vulnerability scanning, discussed in prose only),
**NFR-041 (NFR tab, DR architecture)**, and **NFR-189** (SLI/SLO
reporting, tracked in its own section) - all are real, mandatory,
unresolved rows and are now tracked in
`docs/qr-compliance/mandatory-action-register.md`, the new
consolidated source of truth for unresolved-mandatory-row tracking
going forward.

**Batch 7A also applied real, verified workbook edits** (full detail
in `mandatory-action-register.md`):
- **4 Cloud CSQ rows normalized from `"Yes (inherited)"` to exact
  `"Yes"`**: PA.03, DR.06, DR.07, AR.19 - each independently
  re-verified against Google Cloud's own published attestations, no
  contradicting evidence found. Recorded as response normalization of
  already-real evidence, not a new engineering closure.
- **4 rows reclassified to `"N/A"`**: NFR-064 (NFR tab - corrected an
  internal inconsistency where the remark already said "Not
  applicable" while the cell read "No"), IS.41, IS.73, SD.06 (Cloud
  CSQ - each verified against Google's shared-responsibility model for
  serverless/PaaS, not a bare "handled by the cloud provider"
  assertion).
- **2 rows reviewed and deliberately NOT reclassified to N/A**: IS.11
  (a genuine unimplemented HR policy gap, not architectural
  non-applicability - the "not currently implemented" trap) and AR.17
  (GCP's side is attested, but IST's own corporate-office-network scope
  is unconfirmed, not confirmed non-applicable). Remarks corrected;
  Compliance value unchanged (retained "No").
- **2 AI-tab rows reviewed against the "shadow AI" trap and confirmed
  already honest**: NFR-040 (AI), NFR-044 (AI) - real
  `RagRetrievalEvent`/`LlmShadowSuggestion` Prisma models and a
  shadow-comparison service genuinely exist (confirmed via repo grep),
  but no live LLM inference is wired - the existing remarks already
  document this precisely; no change made.

**Recomputed mandatory compliance** (see `mandatory-action-register.md`'s
"Batch 7A scoring impact" section for the full before/after table):
77/149 = 51.7% (previously reported 74/153 = 48.4%; a small portion of
this gap is pre-existing `master-compliance-register.csv` drift, not
caused by this batch - disclosed, not hidden).

_Covers all 79 remaining mandatory rows in the Non Functional Req and
Cloud CSQ tabs not yet "Yes" (AI and UX mandatory rows are covered in
Batches 4-5; this document does not repeat them). For each row, this
classifies whether it can be advanced to one of the 5 target states, or
whether it genuinely cannot advance further without new investigation._

## Update 2026-08-05: NFR-189 (monthly SLI reporting) substantially advanced

NFR-189 was not one of the original 23 "existing control" candidates
(it was tracked separately as an "engineering closure" needing new code,
per task #102). Built for real this pass:
`src/services/sliReportService.ts` (real GCP Monitoring queries, all 4
SLIs, SLO comparison, audit trail, idempotency), validated end-to-end
via a real Cloud Run Job execution. **Retained Partial** - the literal
wording requires reporting "to Qatar Airways" specifically, and no real
QR recipient/live email secrets are configured (by design). This moves
NFR-189 from "Not yet advanced" to **State: Implementation complete,
awaiting a real recipient + live-mode secrets** - see
`docs/operations/monthly-sli-report-runbook.md`'s "Remaining action".

## Honest scope note

Advancing a row to one of the 5 target states below requires a real
artifact (a decision paper, an evidence template, a completed test
procedure) to already exist. Building 79 such artifacts in one pass would
either be superficial busywork or fabricated evidence - neither is
acceptable. This document instead does two things honestly:

1. **Classifies every row** into either one of the 5 target states (where
   a real artifact already exists or the row's nature makes the
   classification self-evident) or an honest 6th bucket: **"Not yet
   advanced - requires Stage-2 investigation"** for rows whose current
   Partial/No status was set in an earlier pass and has not been
   independently re-verified against current code this session.
2. **Names the specific next artifact needed** to advance each row, so a
   future batch can pick this up directly rather than re-deriving it.

## State 1: Implementation complete, awaiting production deployment

| ID | Tab | What's implemented | What's needed |
|---|---|---|---|
| NFR-119 | NFR | Real, engineer-set alert thresholds exist | Business decision first (see `business-decision-register.md`) on whether a QR-facing config surface is even wanted - not a deployment gap alone |
| IS.07 | Cloud CSQ | Terraform-managed infra baseline exists | A scheduled CI drift-detection job - needs a CI service-account credential that doesn't exist (see `production-execution-register.md`) |
| PA.08 | Cloud CSQ | Real infra inventory exists implicitly via Terraform | Needs a formal, exported asset-inventory artifact (not yet produced) - closer to a documentation gap than a deployment gap; reclassify to Stage-2 investigation in a future batch |

## State 2: Documentation complete, awaiting approval

None yet. No row in this remaining set has a fully drafted document
sitting only on an approval gate - IS.02 (executive security-policy
commitment) was reviewed in Batch 2 and explicitly NOT drafted, precisely
because drafting content without the real approval it needs would be the
overclaim this program exists to avoid. If a future batch drafts IS.02's
document, it would land here, still Partial, pending real sign-off.

## State 3: Test procedure complete, awaiting execution

| ID | Tab | Procedure | Status |
|---|---|---|---|
| NFR-138 / NFR-152 | NFR | **Resolved 2026-08-05** - root cause found (4 missing DB migrations on live soc2, not primarily connection-pool sizing) and fixed for real (`prisma migrate deploy`); queue-list p95 3105ms -> 446-569ms | **Closed to Yes.** Both moved out of this table - see `docs/performance/nfr-138-152-156-validation.md`. |
| NFR-156 | NFR | **Advanced 2026-08-05** - dedicated capacity-planning/soak batch: multi-tier load test (10/25/50 concurrent users, 6 distinct real accounts) plus a genuine 20-minute sustained-load run, all against `triagedsoc2.irisstar.tech` with real Cloud Monitoring evidence (Cloud Run/Cloud SQL flat throughout, zero 5xx). See `docs/performance/nfr-156-capacity-plan.md`. | Retained Partial - validated up to 25 concurrent users with zero errors; tier 50 was constrained by the 6-account test pool hitting NFR-047's rate limiter (not infrastructure), and a 60+ minute soak plus a real QR peak-load projection remain open. |

IS.39/IS.40/IS.41 (network/application/OS-layer vulnerability scanning)
and NFR-058 (OWASP compliance) do NOT have a defined test procedure yet
beyond the existing lightweight DAST probe - these remain in the
"not yet advanced" bucket below, since no comprehensive-scan procedure
has been designed.

## State 4: Evidence template complete, awaiting external evidence

| ID | Tab | Real readiness evidence produced this engagement |
|---|---|---|
| CO.01, CO.02, CO.03, CO.05, CO.07 | Cloud CSQ | Risk register, gap-analysis docs, internal DAST probe - real internal review artifacts a real external auditor could be handed as a starting point |
| CO.08, CO.09 | Cloud CSQ | Same readiness work, explicitly framed as SOC 2/ISO 27001 *readiness*, not certification |
| PA.01, PA.05 | Cloud CSQ | Google Cloud's own published attestations already exist and are cited (`docs/qr-compliance/external-dependency-register.md`) - the "evidence template" here is simply pointing to Google's real, existing attestation, not something IST Health needs to produce |

All 9 rows: genuinely awaiting an external auditor/certification body -
no further internal action can close these. See
`docs/qr-compliance/external-dependency-register.md` (already produced,
Stage 1).

## State 5: Decision paper complete, awaiting decision

| ID | Tab | Decision paper |
|---|---|---|
| IG.09 | Cloud CSQ | `docs/qr-compliance/business-decision-register.md` - retention period for `AviationTriageEncounter`/`AuditEvent`, needs Clinical + Legal + Privacy + Business sign-off |

The 5 "Privacy or legal closure" rows (IG.10, IS.52, IS.55, IS.62, DR.09)
and the 7 "Operational process closure" rows (PA.02, HR.01, HR.02, IS.10,
IS.20, IS.21, IS.27) do **not** yet have a real decision paper written -
classifying them here would be premature. They belong in the "not yet
advanced" bucket below until a future batch drafts the actual paper for
each (a real HR/legal/privacy decision needs to be scoped per row, not
assumed identical).

## Not yet advanced - requires Stage-2 investigation (46 rows)

These rows' current Partial/No status was set in an earlier engagement
pass and has not been independently re-verified against current code
this session. Advancing them to one of the 5 states above without that
re-verification would risk exactly the kind of unsupported claim this
program exists to prevent.

- **23 rows, "existing control - evidence missing"**: NFR-016, NFR-022,
  NFR-027, NFR-038, NFR-040, NFR-041, NFR-076, NFR-078, NFR-118,
  NFR-185, CO.04, IG.07, IS.02, IS.50, IS.66, LG.01, DR.04, AR.03,
  AR.10, AR.13, AR.15, AR.16, AR.21 - each likely has a real, already-
  built control (per the earlier remark) that could genuinely close with
  the same kind of documentation-only pass used in Batches 2-3; simply
  not yet re-verified/actioned this session.
- **18 rows, "cannot currently comply"**: NFR-039, NFR-079, IG.01, IG.06,
  IG.15, PA.03, PA.04, IS.13, IS.33, IS.34, IS.45, IS.53, IS.59, LG.02,
  DR.05, DR.06, DR.07, AR.19 - several of these (IS.33/34 CMEK, PA.03/
  PA.04/DR.06/DR.07 Google-inherited physical attestations) are likely
  genuine, permanent platform/architectural limits, not gaps this
  engagement can close at all - a future batch should confirm each
  individually rather than assume.
- **5 rows, "valid N/A candidate"**: NFR-064, IS.11, IS.73, SD.06, AR.17
  - flagged by keyword heuristic as *possibly* legitimately N/A, but
    each needs a real read of the requirement text and remark before
    reclassifying - not done this session.
- **12 rows named above** (5 privacy/legal + 7 operational-process) -
  each needs its own real decision paper drafted, not a generic one.

## Recommendation

The highest-value next step is re-verifying the 23 "existing control -
evidence missing" rows - this is the same pattern (Batches 2-3) that
already closed 13 real Cloud CSQ rows this session with no engineering
work, just honest documentation of already-built controls. Recommend
this as the next batch once mandatory NFR/Cloud CSQ work resumes.

## Update 2026-08-05 (continued): overall-denominator reconciliation + PA.05 fix

A follow-up mechanical recount (`scripts/_reconcileOverallDenominator.py`,
walking every physical workbook row, all 4 tabs) found that the
previously-reported "132/400" overall figure was never actually
computed from the live workbook - it was derived by applying a
mandatory-scope delta to a rough, differently-sourced estimate, and is
retracted. The mechanical recount also found **PA.05** ("physical
ingress/egress monitoring") had already been `"Yes (inherited)"` in
the workbook the whole time, but was mis-transcribed as `"Partial"` in
the action register - causing it to be missed by the original Batch 7A
pass. PA.05 is now normalized to exact `"Yes"` alongside the other 4.

**Corrected, mechanically-verified figures**: mandatory 78/149 =
52.35%; overall 133/391 = 34.02%. See `management-summary.md` for the
full per-tab breakdown and row-level delta table.

## Update 2026-08-05 (continued): AR.13 production-activation validation

Attempted, per explicit instruction, to activate `MFA_MANDATORY=true`
in the live soc2 environment. Validated entirely on `--no-traffic`
canaries (live traffic never touched). Found and fixed 2 real defects
(MFA-credential DB persistence was silently disabled by
`MOCK_MODE=true`; the live revision predated the MFA feature entirely
and had to be redeployed). Deliberately **not cut over** - only 2 of
~19 real accounts are enrolled and there is no self-service enrollment
path once enforcement is on, which would lock out most accounts with
no in-app recovery. **AR.13 remains Partial**, now backed by real
canary-validated evidence. See `docs/qr-questionnaire-backlog-tracker.md`
for full detail, and the secondary finding that AuditEvent persistence
is also currently non-functional on soc2 (same root cause, separate
future batch).

## Update 2026-08-05 (continued): AuditEvent durable-persistence remediation

Fixed a Priority-0 audit-integrity defect (found during AR.13
validation): `MOCK_MODE=true` silently disabled all AuditEvent DB
persistence on soc2. Added a dedicated `AUDIT_EVENT_DB_PERSISTENCE`
flag, validated cross-instance on canaries, then activated on live
traffic (low-risk, unlike `MFA_MANDATORY`). No mandatory row moved to
Yes as a direct result - the underlying code evidence for
NFR-010/IS.61/IS.51/HR.03 was already accurate; only its live-
environment durability was previously unproven. See
`docs/operations/audit-event-persistence.md` and
`docs/qr-questionnaire-backlog-tracker.md` for full detail.

## Update 2026-08-05 (continued): persistence-gating integrity sweep

Found and fixed 2 real multi-instance gaps (role-permission overrides,
reveal workflow) and 1 flag bugfix (session revocation), following the
AR.13/AuditEvent Priority-0 fixes. Full inventory in
`docs/operations/persistence-gating-inventory.md`. IS.61's remark
corrected (value unchanged) to disclose the reveal-anomaly counter's
process-local scope. No mandatory row moved to Yes.

## Update 2026-08-05 (continued): IS.61 corrected down to Partial

Built a shared, durable, multi-instance-safe reveal-anomaly counter
(closes the persistence-gating sweep's finding). Re-reading IS.61's
literal wording during this batch found it requires BOTH monitoring
AND customer notification - the row's prior `Yes` value covered
monitoring only, an overclaim. Corrected to Partial. See
`docs/security/reveal-anomaly-detection.md` and
`docs/qr-questionnaire-backlog-tracker.md`. Mandatory compliance now
77/149 = 51.68% (was 78/149 = 52.35%); overall 132/391 = 33.76% (was
133/391 = 34.02%).

## Update 2026-08-05 (continued): IS.61 customer-notification workflow built - retained Partial

A controlled, auditable privacy-incident notification workflow now
exists (detection -> review -> classification -> decision -> approval
-> dry-run/internal-test delivery), operational in safe mode only. See
`docs/security/privacy-incident-notification-procedure.md`. IS.61
remains Partial - real customer delivery requires an approved SLA,
legal/privacy-approved template, authorized Qatar Airways recipients,
and one approved live delivery, none of which exist. No compliance
percentage change from this batch.

## Update 2026-08-05 (continued): NFR-015 accessibility redeploy - retained Partial, no percentage change

Real production redeploy of `ist-triage-soc2` executed (canary ->
0-violation audit -> 100% cutover -> Firebase Hosting CDN cache fix ->
0-violation re-audit against the live custom domain). A new, real,
unresolved Focus Visible (WCAG 2.1 SC 2.4.7) defect was found via
manual testing and remains open. NFR-015 stays Partial - the evidence
behind that Partial is now real, current, and far stronger than the
prior batch's (broken audit tooling + stale build), but the row cannot
honestly move to Yes while a confirmed, material accessibility defect
is open. See `docs/accessibility/accessibility-known-limitations.md`
for the retest trigger. No compliance percentage change from this
batch.

## Update 2026-08-05 (continued): NFR-015 Focus Visible defect fixed, retained Partial

Root-caused and fixed the Focus Visible (WCAG 2.1 SC 2.4.7) defect
flagged in the prior batch - an app-wide CSS specificity-escalation
reset was suppressing the focus ring; fixed via `outline` (untouched
by that reset), deployed, and verified live via real keyboard testing
on production. A second, real, distinct deployment-runbook gap was
also found and fixed along the way (Firebase Hosting's static
`dist-web` upload is independent of the Cloud Run image and must be
rebuilt separately before each `firebase deploy --only hosting:soc2`).
NFR-015 stays Partial - the one known defect is closed, but several
required manual checks (modal focus-trap, zoom/reflow, session-
timeout, destructive-action, real screen-reader testing) remain
unperformed, so the row cannot honestly move to Yes yet. No compliance
percentage change from this batch.

## Update 2026-08-05 (continued): NFR-015 final manual validation batch, retained Partial

Completed the remaining NFR-015 manual checklist. Fixed 3 real defects
(modal focus management on the Service Manager Board's call-detail
drawer, missing viewport meta on the unauthenticated Help fallback,
unwrapped top-action-bar causing 320px reflow overflow) and deployed/
verified all three live. Found and left unfixed, out of scope: the
Nurse Cockpit's 3-column layout is not mobile-responsive at all - a
real, structural defect. Confirmed session-timeout has no accessible
warning capability (not implemented) and no real screen-reader testing
is possible in this environment. NFR-015 stays Partial - these two
remaining material gaps (Cockpit responsiveness, screen-reader
validation) are the honest reason Yes is not yet reachable. No
compliance percentage change from this batch.

## Update 2026-08-05 (continued): NFR-015 Nurse Cockpit responsive fix + audit-tooling integrity fix, retained Partial

Fixed the Nurse Cockpit's non-responsive 3-column layout (single-
column stack below 900px, ARIA tablist semantics added to the stage
tabs) - the last confirmed material defect blocking NFR-015. Deployed
and verified live via 30 new Playwright tests across 6 engines and a
corrected axe-core audit. Found and fixed a significant, real bug in
this engagement's own accessibility-audit tooling
(`scripts/a11yAudit.mjs`): its login check silently accepted a 202
"MFA required" response as a successful login, meaning prior "Nurse
Cockpit"/"Control Center Admin: 0 violations" claims rested on an audit
that likely never reached those pages authenticated. Fixed and
re-verified: genuinely 0 violations across all 5 pages now. NFR-015
stays Partial - the sole remaining blocker is the complete absence of
real screen-reader validation (checklist prepared for a future batch).
No compliance percentage change from this batch.

## Update 2026-08-06: AR.13 - real enrollment/recovery built, mandatory MFA activated on soc2, moved to Yes

Closed the two gaps that kept AR.13 at Partial: (1) a real pre-auth
enrollment token now lets an unenrolled user complete MFA enrollment
without an existing session, removing the circular dependency that
previously meant `MFA_MANDATORY=true` would have locked out anyone not
already enrolled; (2) a real, PAM-elevation-gated administrator MFA
reset now exists, with immediate session revocation and forced
re-enrollment, closing the "no recovery path" gap. A second
administrator (`sa@irisstar.tech`) was enrolled so at least 2
administrators are active, and `MFA_MANDATORY=true` was activated on
`ist-triage-soc2` via canary-then-cutover, live-validated end to end
(enrolled users authenticate normally, unenrolled users are routed
into real enrollment rather than locked out, admin reset works,
cross-instance persistence confirmed). **AR.13 moves to Yes for the
soc2 environment** - see
`docs/qr-questionnaire-backlog-tracker.md` Batch 10 for the full
evidence and the explicit scope note (this activation covers soc2
only, the only environment this engagement's technical evidence has
ever targeted).

## PRIORITY-0 CORRECTION 2026-08-06: AR.13 reverted from Yes to Partial

The prior batch's move to Yes rested on curl-only validation. A real,
material gap was found: the browser UI has no handling at all for
`mfaRequired`/`mfaEnrollmentRequired` - a real user sees only a
generic failure message. Backend/API enforcement remains real and
operational; the interactive user journey does not exist yet.
**Reverted to Partial** pending a real frontend fix (see the
backlog tracker and evidence index for the immediate follow-up batch).

## Update 2026-08-06 (continued): real frontend MFA UI built and browser-validated - AR.13 back to Yes

Built the missing browser-facing MFA enrollment/challenge UI in
`LoginCard.tsx` (enrollment screen with manual setup key, challenge
screen, setup-complete confirmation - state held only in memory,
secret never re-shown after enrollment). Deployed via canary-then-
cutover, validated via real Browser-pane interaction (not curl): an
unenrolled account was shown the real enrollment screen and completed
it; a subsequent fresh login correctly required and completed the MFA
challenge, granting real application access. Confirmed on production
too. **AR.13 moves back to Yes**, this time genuinely backed by a real
user-journey validation rather than API-only evidence.

## Update 2026-08-06: IS.07 - CI drift-detection credential built and validated (still Partial)

The CI-credential gap recorded in the table above is now closed: a real
Workload Identity Federation identity (`ci-drift-detector@triage-502706
.iam.gserviceaccount.com`) exists, least-privilege (no apply-level
mutation permission - confirmed via a real 403), and a full drift-detection
GitHub Actions workflow was written and validated end-to-end against real
soc2 infrastructure (real pre-existing drift found + reconciled, real
synthetic drift detected + reverted, final clean run confirmed). Status
stays **Partial**, not Yes, because the workflow's schedule cannot
literally be active in GitHub Actions until this is pushed (explicitly out
of scope this batch). See
`docs/operations/infrastructure-drift-detection-runbook.md`.
