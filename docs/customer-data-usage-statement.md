# Customer Data Usage Statement

_Closes Cloud CSQ IS.58 ("provide documentation regarding how you may
utilize or access customer data and/or metadata"). Written for Qatar
Airways as the platform's operating counterparty. Consolidates and
brings current the internal data-governance status
(`docs/soc2-data-governance-schema-status.md`, 2026-08-02) with the real
enforcement work built since (`docs/data-management-policy.md`,
2026-08-05) into one customer-facing statement._

## Purpose

States plainly how IST Health accesses and uses data submitted through
the platform (queue records, clinical narratives, SBAR notes, staff/
dependent records, audit logs) - and what it does not do with that data.

## What data is collected

Tenant-scoped operational data (triage queue items, clinical encounters,
staff/dependent identity records) and platform-generated audit/metadata
(who accessed what, when, from which session).

## How IST Health accesses this data

- **Operational support**: IST Health engineering/support staff access
  data only through the same permission-gated, tenant-scoped API surface
  the application itself uses - there is no separate back-door data
  access path. Every access by an administrative account is logged as a
  real `AuditEvent` (`docs/data-management-policy.md` §6).
- **Incident response**: during a security or availability incident,
  access may be broadened temporarily per
  `docs/incident-response-plan.md`'s containment/recovery procedures -
  still logged, still tenant-scoped where technically possible.
- **No secondary use**: customer content is never repurposed as model-
  training input for another tenant's benefit (`docs/data-management-
  policy.md` §10), never replicated into non-production/test
  environments (`docs/data-management-policy.md` §1, IG.13), and is
  never sold, shared with unrelated third parties, or used for any
  purpose beyond operating the platform for the tenant that submitted it.

## Metadata specifically

Metadata (session logs, audit trail entries, request timing) is used
only for the platform's own operational and security purposes: detecting
anomalies (`checkRevealAnomalyRate()`, IS.61), tracing incidents to
specific tenants (IS.51, `docs/data-management-policy.md` §1), and
supporting the entitlement-review/certification process
(`docs/entitlement-reporting-procedure.md`).

## What this document does not cover

- A formal, negotiated data-processing addendum (DPA) specific to Qatar
  Airways' contractual relationship - this document states the real,
  uniform technical/operational practice today, not a substitute for a
  legal DPA.
- Field-level ("data in use") encryption - a documented, accepted gap
  (`docs/data-management-policy.md` §7).

## Review cadence

Reviewed alongside the annual risk-register cadence
(`docs/risk-register-2026-08-04.md`, next review 2026-11-04).

## Approval requirement

Describes existing, already-operating practice - no separate approval
gate is required to publish as-is. Recommend sharing directly with Qatar
Airways, since it is written to be handed to them.

## Related questionnaire IDs

IS.58 (this document). IG.13, IS.51 (`docs/data-management-policy.md`).
CO.14 (`docs/data-management-policy.md` §10).

## Related implementation references

- `docs/data-management-policy.md`
- `docs/soc2-data-governance-schema-status.md`
- `python/generate_synthetic_pdp_data.py`
