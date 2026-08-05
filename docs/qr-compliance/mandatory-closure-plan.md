# Mandatory Closure Plan - Batch 1

_Proposed 2026-08-05. Batch size: 5 documentation closures (within the
mandated 10-20 range, kept smaller because each document needs distinct,
real content - not padding to hit a count)._

## Why these 5

All 5 are mandatory Cloud CSQ rows whose remark (already written in an
earlier pass of this engagement) says the same thing in each case: **the
underlying practice is real, but no formal, published, customer-facing
document exists describing it.** No engineering dependency, no external
approval blocker - this is a pure documentation closure once the actual
content is written honestly.

Two of the five (IS.24, IS.49) carry an important caveat already noted in
their remarks: this is a bespoke internal system, not a multi-tenant SaaS
product with an external customer-admin relationship in the classic
sense. Qatar Airways, as the vendor-questionnaire counterparty, **is**
the real "customer" here - so a document addressed to QR describing
these responsibilities is genuine and directly answers the question, not
a fiction dressed up for a non-existent audience.

| ID | Requirement | Proposed document |
|---|---|---|
| CO.14 | IP-protection controls for customer data | New section in `docs/data-management-policy.md` (already exists, already covers tenant isolation) - add an explicit "Intellectual property protection" subsection naming the real controls (tenant scoping, audit logging, access control) as the IP-protection mechanism. |
| IS.19 | Share entitlement remediation/certification reports with customers | New `docs/entitlement-reporting-procedure.md` - documents the real quarterly access-review AuditEvent record (already exists this engagement, per `docs/risk-register-2026-08-04.md`'s review-cadence section) and defines the concrete process/format for sharing that record with Qatar Airways on request. |
| IS.24 | Role-definition document (supplier vs. customer admin responsibilities) | New `docs/administrative-responsibilities.md` - defines exactly which admin actions IST Health performs (deployment, code changes, infra config, incident triage) vs. which remain QR's own (account provisioning requests, data-use decisions, contractual approvals). |
| IS.43 | Risk-based patching-timeframe commitment | New section in `docs/change-management-policy.md` (already exists) - add explicit patch-timeframe commitments by severity (e.g. critical dependency CVEs within N days, tied to the real `pnpm audit` CI gate already in place). |
| IS.49 | Roles/responsibilities during security incidents | New section in `docs/incident-response-plan.md` (already exists) - add an explicit "Supplier vs. customer responsibilities" table for the incident lifecycle (detection, containment, notification, remediation, post-incident review). |

## Explicitly NOT included in this batch

- Any row needing external audit/certification (13 rows) - separate
  workstream, no document can substitute for an actual SOC 2/ISO 27001/
  pentest engagement.
- Any row needing an organizational HR/training program (9 rows) - a
  real business decision to stand up a program, not a doc-only fix.
- The 119 "existing control - evidence missing (tentative)" rows - these
  need independent Stage-2 code verification before any closure action,
  proposed as later batches once that verification is done.

## Validation plan for this batch

1. Draft all 5 documents/sections with real, specific content (no
   generic placeholders) per the Workstream B required structure
   (purpose, scope, roles, control requirements, operating procedure,
   review cadence, approval requirement, evidence generated, exceptions
   process, related questionnaire IDs, related implementation
   references).
2. Cross-check each document's factual claims against the actual code/
   config it references (e.g. confirm the quarterly-review AuditEvent
   pattern really exists before IS.19 cites it).
3. Mark each document's approval status explicitly - these are
   operational/security-process documents; per the mandated rule, draft
   status alone supports "Partial," not "Yes," where formal management/
   security approval is implied by the question. Recommendation below.
4. Update `docs/qr-questionnaire-backlog-tracker.md` and the xlsx only
   after the documents exist and have been cross-checked.
5. `npx tsc --noEmit` (no-op expected, doc-only change) + `npx jest
   --runInBand` (confirm no regression) before committing.

## Recommended final response per row

Given these are internal-process documents describing real, already-
happening practices (not net-new controls awaiting a separate approval
gate), and given this engagement's established pattern of moving
similar consolidation docs (data-management-policy, ISMS index, HR
termination procedure) straight to "Yes" once cross-checked - the
recommendation is **Yes** for all 5, with the remark stating the exact
document/section and validation date. Flagging this recommendation
explicitly rather than assuming it, since IS.19/IS.24/IS.49 do touch
"customer-facing" claims that could reasonably be held to a higher bar -
proceed on my recommendation, or hold these at Partial until you've
reviewed the drafted content yourself?
