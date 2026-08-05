# Mandatory NFR/Cloud CSQ Conversion-Status Plan

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
| NFR-138 / NFR-152 / NFR-156 | NFR | Load-test baseline already run 2026-08-04 (`docs/load-test-baseline-2026-08-04.md`) - a real procedure exists and was executed once, finding a real p95/p99 regression | Awaiting the actual performance-engineering fix + re-test, not just re-execution of the same test - this is real, scoped engineering work (query/payload/index investigation), not a quick win. Recommend its own dedicated session. |

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
