# Administrative Responsibilities: IST Health vs. Qatar Airways

_Closes Cloud CSQ IS.24 ("provide customers with a role definition
document clarifying your administrative responsibilities vs. those of
the customer"). Written for a bespoke, single-customer engagement - Qatar
Airways is the platform's operating counterparty ("customer" below), not
an external SaaS tenant with its own administrator seat in this system
today._

## Purpose

Defines exactly which administrative actions IST Health performs on the
platform versus which decisions and actions remain Qatar Airways' own, so
there is no ambiguity about who is accountable for what.

## Scope

Covers both live environments (`triaged.irisstar.tech`,
`triagedsoc2.irisstar.tech`), their shared Cloud SQL instance, and the
in-application admin/role-permission system described in
`src/services/securityAdmin.ts`.

## Roles and responsibilities

### IST Health (supplier) - technical/operational administration

- **Infrastructure**: Cloud Run deployment, Cloud SQL management,
  Terraform-defined resources, Secret Manager, monitoring/alerting
  configuration.
- **Application code**: all code changes, releases, and the
  canary-then-cutover deployment process (`docs/change-management-policy.md`).
- **In-application security administration**: the specific permission
  codes `admin.users.manage` (suspend/reinstate a user account) and
  `admin.roles.manage` (grant/revoke a permission from a role) are held
  only by the `system_administrator` and `compliance_auditor` roles
  (`src/services/securityAdmin.ts:638,650`) - these are IST Health
  operational staff accounts, not Qatar Airways accounts, today.
- **Incident response**: technical containment, root-cause fix, and
  post-incident reporting (`docs/incident-response-plan.md`).
- **Access-entitlement review**: the quarterly review and certification
  process (`docs/entitlement-reporting-procedure.md`).

### Qatar Airways (customer) - business/data-use administration

- **Data-use decisions**: what data is submitted to the platform, and any
  business decision about retention periods, data residency approval, or
  SLA tier (see `docs/qr-compliance/qatar-airways-clarification-register.md`
  and `docs/qr-compliance/business-decision-register.md` for the specific
  open items awaiting QR input).
- **User-provisioning requests**: Qatar Airways identifies which of its
  staff should have accounts and what clinical role they hold (e.g.
  `remote_triage_nurse`) - IST Health provisions the account on request,
  it does not unilaterally decide who gets access to QR's operational
  data.
- **Contractual/legal approvals**: any formal SLA commitment, data-
  processing agreement, or incident-notification-timeline commitment
  remains a legal/contractual matter between the two parties, not a
  unilateral IST Health decision (see the explicit gap noted in
  `docs/incident-response-plan.md`'s "Data breach specific notes").
- **Incident coordination**: designating a point of contact and
  confirming resolution from their own operational perspective
  (`docs/incident-response-plan.md`'s new "Supplier vs. Qatar Airways
  responsibilities" table).

## Control requirements

The highest-risk in-application actions (`admin.users.manage`,
`admin.roles.manage`) require PAM elevation (a fresh MFA re-verification,
time-boxed) on top of normal permission checks - see
`docs/data-management-policy.md` section 6 (Audit logging) and the PAM
elevation work referenced in this engagement's earlier sessions.

## Operating procedure

When Qatar Airways needs an administrative action performed (e.g. a new
user account, a role change, an incident-related data query), the request
is routed to IST Health's operational staff, who execute it using the
existing permission-gated, audit-logged admin functions - Qatar Airways
does not hold direct infrastructure or in-application admin credentials
in the current architecture.

## Review cadence

Reviewed alongside the annual risk-register cadence
(`docs/risk-register-2026-08-04.md`, next review 2026-11-04), or sooner
if the operational relationship changes (e.g. if Qatar Airways is ever
given its own in-application administrator accounts, which would require
revisiting this document's role split).

## Approval requirement

This document describes existing, already-operating practice - no
separate approval gate is required to publish it as-is. Recommend
sharing it with Qatar Airways for their acknowledgment, since it's
written to be handed to them (per the requirement's own wording).

## Evidence generated

This document itself, plus the underlying `AuditEvent` trail
(`docs/data-management-policy.md` section 6) that records every
in-application administrative action performed by IST Health staff.

## Exceptions process

Any deviation from this split (e.g. an emergency action taken without
following the normal request-routing process) must be documented in the
next incident post-mortem or risk-register update, not left unrecorded.

## Related questionnaire IDs

IS.24 (this document). IS.49 (incident-specific responsibilities, see
`docs/incident-response-plan.md`). CO.14 (IP-protection controls, see
`docs/data-management-policy.md` section 10).

## Related implementation references

- `src/services/securityAdmin.ts:267,274,638,650` (permission codes and
  role-permission assignments)
- `docs/change-management-policy.md` (deployment/change process)
- `docs/incident-response-plan.md` (incident roles)
- `docs/entitlement-reporting-procedure.md` (access-review reporting)
