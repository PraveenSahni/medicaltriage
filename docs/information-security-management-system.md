# Information Security Management System (ISMS) Overview

_Closes Cloud CSQ IS.01 ("documentation describing your Information Security
Management System"). This is an index tying together the real, separately-
written security/governance documents already produced across this
engagement into one named ISMS reference - it does not duplicate their
content, and does not claim a formal ISO 27001-certified ISMS (see "What
this is not" below)._

## Governance structure

| ISMS component | Real document |
|---|---|
| Risk assessment & treatment | `docs/risk-register-2026-08-04.md` - real, evidence-based risk register with a defined quarterly review cadence |
| Control inventory mapped to Trust Service Criteria | `docs/soc2-control-matrix.md` |
| Incident response | `docs/incident-response-plan.md` |
| Business continuity / disaster recovery | `docs/backup-disaster-recovery-plan.md`, `docs/dr-failover-runbook.md` |
| Change management | `docs/change-management-policy.md` |
| Data governance (encryption, masking, retention, legal hold) | `docs/data-management-policy.md` |
| Regulatory/standards mapping | `docs/regulatory-due-diligence-mapping.md` |
| Non-production environment structure | `docs/non-production-environments.md` |
| Integration/connectivity inventory | `docs/integration-connectivity-touchpoints.md` |
| Vulnerability disclosure | `SECURITY.md` |
| Exit/off-boarding | `docs/exit-plan.md` |
| Access-termination procedure | `docs/hr-access-termination-procedure.md` |

## Scope

This ISMS covers the IST Health Tele-Triage application and its supporting
GCP infrastructure (Cloud Run, Cloud SQL, Secret Manager, Firebase Hosting,
Cloud Monitoring/Logging) across the two real, currently-operating
environments (`triaged.irisstar.tech` and `triagedsoc2.irisstar.tech`).

## Ownership and maintenance

Each document above is maintained alongside the code it describes - a real
architectural change (a new integration, a new data flow, a new control) is
expected to update the relevant document in the same change, not as a
separate retrofit. The risk register's quarterly review (see its own
"Review cadence" section) is the anchor point for confirming this whole set
stays current.

## What this is not

- **Not a certified ISMS.** No independent body (e.g. an ISO 27001
  certification auditor) has assessed this structure - it is this
  engagement's own honest self-organization of its real security
  documentation, not an external attestation.
- **Not a single monolithic document.** Deliberately organized as a set of
  focused, individually-maintainable documents rather than one large
  document that inevitably drifts out of date - this index is the map
  between them.
