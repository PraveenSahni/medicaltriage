# Executive Compliance Plan - Qatar Airways vendor questionnaire

_2026-08-05. This is the top-level plan for bringing
`NFR_COTS_CSQ_v8.3-edc758c5-2b70-496a-9db4-947af34a67a4.xlsx` to maximum
honest compliance. It sets direction and sequencing; the detailed
row-by-row data lives in `master-compliance-register.csv`._

## Principle

A row moves to "Yes" only when the control is implemented (or formally
established), validated, evidenced, and accurately described - never on
intention alone. Rows that cannot honestly reach "Yes" stay Partial, No,
Other, or a documented N/A, and are instead routed to whichever register
actually owns the blocker (business decision, external audit, Qatar
Airways clarification, or production execution).

## Current state (confirmed 2026-08-05)

- Git: working tree has only this session's own new doc files untracked;
  23 commits ahead of `origin/main`; nothing pushed.
- `npx tsc -p tsconfig.json --noEmit`: clean.
- `npx jest --runInBand`: **688/692 passing** (corrected from a stale
  "692/692" figure in the prior handover doc - 4 failures in
  `tests/ssoOidcFlow.test.ts` are a local environment issue, the Cloud
  SQL proxy tunnel to `127.0.0.1:5433` is not currently running in this
  session, confirmed via isolated re-run and a direct port check, not a
  code regression).
- Register: 459 scored rows across 4 tabs, 179 mandatory. 168 rows
  closed, 3 flagged-blocked, 4 in active triage, 284 not yet
  independently re-verified this pass (see
  `master-compliance-register.md` for what "not yet triaged" does and
  doesn't mean).

## Sequencing (per the mandated prioritization)

- **Priority 0 - integrity corrections**: done as part of building this
  register - the stale test-count figure above, and the previously
  wrongly-marked-complete NFR-123/NFR-189 (already reopened as task #102
  in an earlier session this engagement).
- **Priority 1 - mandatory quick closures**: **Batch 1**, proposed in
  `mandatory-closure-plan.md` - 5 mandatory Cloud CSQ rows (CO.14, IS.19,
  IS.24, IS.43, IS.49) where the gap is specifically "no published
  policy/role-definition document exists," a real documentation closure
  with no engineering dependency.
- **Priority 2 - mandatory engineering work**: pending Stage 2
  independent re-verification of the 119 "existing control - evidence
  missing (tentative)" mandatory rows in Cloud CSQ/NFR/AI (e.g. AR.10
  CSRF, AR.13 mandatory-MFA, IS.65/66 least-privilege, IG.14 tenant
  isolation) - these need a real current-code check before any batch is
  proposed, not a blanket close.
- **Priority 3 - mandatory infrastructure/operational work**: the
  performance regression (NFR-138/152/156), the SLI report rebuild
  (NFR-189/123), and the Cloud CSQ rows flagged "Cloud or infrastructure
  closure" (8 rows) or "Testing or validation closure" (10 rows).
- **Priority 4 - mandatory external/business actions**: everything routed
  to `business-decision-register.md`, `production-execution-register.md`,
  or `qatar-airways-clarification-register.md` - 13 rows need external
  audit/certification, 8 need legal/privacy input, plus IG.09/NFR-119/
  IS.07 already identified.
- **Priority 5 - non-mandatory closures**: deferred until mandatory work
  above is substantially worked through, per the mandated ordering.

## What's genuinely NOT achievable by engineering alone

Confirmed this pass (not assumed): 13 rows require an actual external
audit/certification (SOC 2 Type II, ISO 27001, independent pentest) that
doesn't exist; several "No" rows describe organizational HR/training
programs (security-awareness training, sanction policies) that are
business decisions, not code; 2 rows (IS.33/IS.34, CMEK) hit a real GCP
platform limitation (customer-managed keys are creation-time-only for an
existing Cloud SQL instance) with no workaround short of provisioning a
new instance - a real infrastructure decision, not a quick fix.

## Next steps after Batch 1

Independent Stage-2 re-verification of the 119 tentative
"existing-control" mandatory-adjacent rows, tab by tab, starting with
Cloud CSQ (it holds 135 of the 179 mandatory rows). Each subsequent batch
will be presented for approval before implementation, per the batch-size
and commit-locally-only rules already in force this engagement.
