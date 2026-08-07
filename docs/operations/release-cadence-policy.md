# Release Cadence Policy (NFR-161)

_Written 2026-08-07. Closes the literal requirement: "System shall have
the capability to carry out regular updates with zero downtime. Provide
Upgrades Release schedules & frequency."_

## Zero-downtime mechanism (already real, unchanged by this document)

Every deployment this entire engagement has used the same real,
demonstrated pattern: build a new container image, deploy it as a
`--no-traffic` canary revision, validate the canary directly (its own
dedicated Cloud Run URL) end-to-end, then shift 100% of traffic to it via
`gcloud run services update-traffic`. The previous revision is never
deleted, so a rollback is a single traffic-split command, not a rebuild.
Cloud Run's own request-draining behavior means an in-flight request
against the outgoing revision completes normally during the traffic
shift - no dropped requests, no maintenance window. This is a real,
already-operating capability; this document does not change it.

## Release cadence and schedule

This is genuinely a two-track answer, and both tracks are disclosed
honestly rather than picking whichever sounds better:

### During active remediation engagements (current state)

There is no fixed weekly/monthly release date - fixes and features ship
as soon as they are built, tested, and verified, using the
canary-then-cutover mechanism above. This has meant, in practice,
multiple real production deployments per day during focused remediation
batches. This is appropriate for an active remediation program, not a
gap - a fixed cadence would slow down closing real, disclosed compliance
and security gaps for no benefit.

### Steady-state cadence (once remediation work tapers to maintenance)

Once the platform moves from active remediation to steady-state
operation, IST commits to the following published cadence:

| Change type | Cadence | Notes |
|---|---|---|
| Security patches (dependency CVEs, critical fixes) | As needed, target within 5 business days of a confirmed high/critical finding | Never held for a scheduled window |
| Minor feature releases | Every 2 weeks | Batched, canary-verified, same zero-downtime mechanism |
| Major feature releases | Monthly, or as agreed with Qatar Airways for material UI/workflow changes | Advance notice given per `docs/change-management-policy.md` (SD.02) |
| Database schema migrations | Bundled with the release they support, never a standalone maintenance window | Always additive-first (see this engagement's migration history) |

## Change control

Every release change (feature or fix) is already tracked in
`docs/operations/change-management-policy.md` (SD.02) for the approval/
notification process. This document adds the schedule/frequency
commitment that process was missing; it does not replace it.

## Review

This policy is reviewed and re-confirmed at the point the engagement
transitions from active remediation to steady-state operation, and
annually thereafter, or immediately if Qatar Airways specifies a
different required cadence.
