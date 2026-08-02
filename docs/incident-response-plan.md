# Incident Response Plan

_Last updated: 2026-08-02. Written as part of the SOC 2 remediation roadmap
(Wave A). Contact names/numbers below are placeholders - fill in your actual
on-call roster before relying on this document for a real incident._

## Purpose

Defines who does what, in what order, when something goes wrong with the
IST Health Tele-Triage platform (`ist-triage-demo`, `ist-triage-soc2`, and
their shared Cloud SQL instance). This is a starting framework, not a
finished, drilled process - it should be reviewed and rehearsed, not just
filed away.

## Severity classification

| Severity | Definition | Example | Initial response target |
|---|---|---|---|
| **SEV1 - Critical** | Live customer-facing service down, or a confirmed data breach/unauthorized access to real PHI | `triaged.irisstar.tech` fully unreachable; confirmed cross-tenant data exposure | Acknowledge within 15 min, all-hands until mitigated |
| **SEV2 - High** | Significant functional degradation, no full outage; suspected (not confirmed) security issue | Queue creation failing for all users; a dependency vulnerability with a public exploit affects a running service | Acknowledge within 1 hour |
| **SEV3 - Moderate** | Partial/cosmetic issue, workaround available | A specific protocol's keyword matching regressed; UI label bug | Acknowledge within 1 business day |
| **SEV4 - Low** | No user impact, internal/process finding | A Dependabot PR flags a moderate-severity dev dependency | Triage at next normal review |

## Roles (fill in real names/contacts)

| Role | Responsibility | Contact |
|---|---|---|
| Incident Commander | Owns the incident end-to-end: coordinates response, makes the call on customer/stakeholder communication, declares resolution | _TBD_ |
| Technical Lead | Diagnoses and directs the actual fix; the person with `gcloud`/Cloud SQL/GitHub admin access | _TBD_ |
| Communications Owner | Notifies affected stakeholders (customer contacts, internal leadership) with accurate, non-technical status updates | _TBD_ |
| On-call rotation | Who gets paged first, and their escalation chain | _TBD - no staffed rotation exists; today the single email channel below is the entire "on-call"._ |

**Update 2026-08-02:** basic automated alerting is now live. GCP Cloud
Monitoring uptime checks (`ist-triage-demo-uptime`, `ist-triage-soc2-uptime`)
poll `/api/v1/runtime/environment` on both `triaged.irisstar.tech` and
`triagedsoc2.irisstar.tech` every 5 minutes over HTTPS. Each has a bound
alert policy (`ist-triage-demo uptime failure`, `ist-triage-soc2 uptime
failure`) that fires to an email notification channel ("Triage Ops Email")
after ~5 minutes of continuous failure, auto-closing 30 minutes after
recovery. This closes the "no alerting exists" gap noted below, but remains
a single-person email channel, not a staffed/paged rotation - see the
remaining gap in "Explicitly out of scope."

## Response procedure

### 1. Detect & Triage
- Identify which environment is affected: `triaged.irisstar.tech` (real
  customer data - treat with maximum caution) vs `triagedsoc2.irisstar.tech`
  (synthetic data only, lower stakes) vs both.
- Classify severity per the table above.
- For SEV1/SEV2: open a dedicated incident channel/thread immediately;
  don't triage silently in DMs.

### 2. Contain
- **If it's a security issue** (suspected unauthorized access, credential
  leak, or a live exploit of a known vulnerability): the priority is
  stopping further exposure before root-causing. Concretely, on this
  system, containment options already proven this session:
  - Revoke public Cloud Run access without deleting anything:
    `gcloud run services remove-iam-policy-binding <service> --member=allUsers --role=roles/run.invoker`
    (used earlier this session to take `ist-triage-simulation` offline
    safely and reversibly).
  - Roll back to the last known-good Cloud Run revision:
    `gcloud run services update-traffic <service> --to-revisions=<old-revision>=100`.
  - Rotate a compromised credential (DB password, JWT secret) via
    `gcloud sql users set-password` / regenerating and redeploying
    `AUTH_JWT_SECRET` - confirmed working pattern from this session's
    Phase 1 setup.
- **If it's an availability issue** (service down, degraded): check Cloud
  Run revision health first (`gcloud run services describe <service>`),
  then Cloud SQL instance health, then application logs
  (`gcloud run services logs read <service>`).

### 3. Eradicate & Recover
- Fix the root cause (code fix, config fix, or infrastructure fix).
- **Always verify a fix against `ist-triage-soc2` first if the fix touches
  code** - this environment exists specifically so fixes can be proven safe
  before ever reaching `triaged.irisstar.tech`'s real customer data,
  following the canary-then-cutover deployment pattern established this
  session (deploy with `--no-traffic`, tag as canary, health-check, then
  `--to-latest`).
- If data was lost or corrupted: restore from the most recent Cloud SQL
  backup or point-in-time recovery target (see
  `docs/backup-disaster-recovery-plan.md`).

### 4. Post-Incident
- For SEV1/SEV2: write a short post-incident summary - what happened, when,
  root cause, what fixed it, what prevents recurrence. Doesn't need to be
  long; it needs to exist and be honest, including what went wrong in the
  response itself.
- Track any follow-up hardening items as real backlog work, not just a
  conversation that gets forgotten.

## Data breach specific notes (real PHI, `triaged.irisstar.tech` only)

If a confirmed unauthorized access to real patient/staff health data ever
occurs on the live demo (not the synthetic `triagedsoc2` staging
environment):

- This is automatically SEV1, regardless of scope.
- Qatar's data protection framework and the client's own contractual/legal
  obligations likely require notification within a specific timeframe -
  **this plan does not currently specify that timeframe**, because it hasn't
  been confirmed with legal/compliance counsel. Do not assume a default
  (e.g. "72 hours" from GDPR) applies without confirming the actual
  applicable requirement for this specific client/jurisdiction.
- Do not delete or alter any potentially-relevant logs/audit records before
  the incident is fully understood, even if they seem unrelated - audit
  trail preservation matters more here than speed of cleanup.

## Explicitly out of scope for this version

- Formal legal/regulatory breach-notification timelines (needs legal review,
  not something to be decided unilaterally in this document).
- A staffed, drilled on-call rotation (the roles table above is a template,
  not a functioning process yet) - today's alerting goes to one email
  address, not a rotation with escalation.
- Broader observability beyond uptime (structured application logging,
  error-rate/latency alerting) - only binary up/down is monitored today.
