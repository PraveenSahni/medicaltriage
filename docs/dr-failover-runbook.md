# DR Failover / Promotion Runbook (R-01)

_Written 2026-08-04 as the "write and rehearse a promotion runbook" next
step from docs/backup-disaster-recovery-plan.md. This document has been
**written but not yet rehearsed** - promoting `ist-triage-postgres-dr-mumbai`
is a one-way, irreversible operation (a promoted replica cannot be turned
back into a replica), so an actual dry-run promotion requires explicit
sign-off before executing, not something to do silently as part of writing
this doc. See "Rehearsal status" at the end._

## When to use this runbook

Only if `me-central1` (Doha) is confirmed down at the **regional** level -
not a single Cloud Run instance restart, not a single zone blip (Cloud SQL's
own ZONAL availability already recovers from most transient zone issues
without this procedure). Confirm via the Google Cloud Status Dashboard
before starting - a false failover wastes the one-way promotion.

## Pre-conditions (already true today, confirmed this session)

- Cross-region read replica `ist-triage-postgres-dr-mumbai` (asia-south1) is
  `RUNNABLE` and replicating from the primary.
- The application container image is already region-agnostic and stored in
  Artifact Registry (`me-central1-docker.pkg.dev/.../ist-triage-soc2:*`) -
  Artifact Registry itself is a Google-managed multi-region-durable service,
  so the image is not lost in a `me-central1` outage.
- Firebase Hosting config (`firebase.json`) and the app's env-var/secret
  requirements are documented in `terraform/main.tf` (soc2) - the real,
  working configuration, not a guess.

## Procedure

### 1. Promote the read replica to a standalone writable primary

```bash
gcloud sql instances promote-replica ist-triage-postgres-dr-mumbai --project=triage-502706
```

**This is irreversible.** The replica stops replicating and becomes an
independent primary. Confirm the outage is real and regional before running
this.

### 2. Stand up the application tier in the DR region (asia-south1)

No standby Cloud Run service exists in asia-south1 today (the honest gap
this runbook exists to reduce, not eliminate - see "What this runbook does
NOT solve" below). During a real regional outage:

```bash
gcloud run deploy ist-triage-soc2-dr \
  --project=triage-502706 \
  --region=asia-south1 \
  --image=me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2:<last-known-good-tag> \
  --service-account=1096520215793-compute@developer.gserviceaccount.com \
  --set-secrets="DATABASE_URL=ist-triage-soc2-database-url:latest,AUTH_JWT_SECRET=ist-triage-soc2-auth-jwt-secret:latest,AUDIT_HMAC_SECRET=ist-triage-soc2-audit-hmac-secret:latest" \
  --add-cloudsql-instances=triage-502706:asia-south1:ist-triage-postgres-dr-mumbai \
  --set-env-vars="NODE_ENV=production,MOCK_MODE=true,QUEUE_DB_PERSISTENCE=true,SIMULATE_INCOMING_CALLS=false,APP_ENVIRONMENT=demo,APP_DATA_PROFILE=synthetic,APP_ENVIRONMENT_BANNER_VISIBLE=true,APP_ENVIRONMENT_LABEL=DR-FAILOVER,CLINICAL_CONTENT_SOURCE=stcc-licensed,SESSION_DB_PERSISTENCE=true"
```

**Real, unresolved problem this step exposes**: the `DATABASE_URL` secret's
connection string is hardcoded to the `me-central1` Cloud SQL connection
name (`.../me-central1:ist-triage-postgres-uat`) - it will NOT work
unmodified against the promoted Mumbai instance. A real failover requires
either a new Secret Manager secret with the Mumbai connection string
(`triage-502706:asia-south1:ist-triage-postgres-dr-mumbai`), created and
substituted at deploy time above, or a parameterized deploy script. This
runbook flags that step explicitly rather than glossing over it - it has
never been executed, so the exact command is a best-effort draft, not a
proven recipe.

### 3. Repoint DNS / Firebase Hosting

```bash
firebase hosting:sites:create ist-triage-soc2-dr-502706 --project triage-502706
firebase target:apply hosting soc2-dr ist-triage-soc2-dr-502706 --project triage-502706
# Update firebase.json's soc2-dr target rewrite to point at ist-triage-soc2-dr / asia-south1
firebase deploy --only hosting:soc2-dr --project triage-502706
# Then re-point triagedsoc2.irisstar.tech's custom-domain association to the new site (manual DNS/Firebase console step)
```

### 4. Verify

```bash
curl -s https://<new-dr-url>/api/v1/runtime/environment
```
Confirm login works, a queue item can be created/claimed, and the
`APP_ENVIRONMENT_LABEL=DR-FAILOVER` banner is visible (so anyone using the
system during failover knows it's the DR instance, not routine staging).

### 5. Fail back (once `me-central1` recovers)

There is **no documented fail-back procedure yet** - promotion is one-way,
so returning to `me-central1` as primary means standing up a *new* replica
from the (now-primary) Mumbai instance back toward `me-central1`, or
restoring from a backup taken after the incident. This is a real, open gap:
fail-back is harder than fail-over and is not solved by this runbook.

## What this runbook does NOT solve

- **No automated trigger** - a human must decide the outage is real and
  regional, then run every step above manually. There is no health-check-
  driven automatic failover.
- **No standby app tier pre-provisioned** - step 2 stands one up during the
  incident, adding real time-to-recovery (the RTO table in
  docs/backup-disaster-recovery-plan.md still says "hours, not minutes"
  until this is pre-provisioned).
- **The DATABASE_URL secret problem in step 2 is unresolved** - flagged
  honestly above rather than papered over.
- **No fail-back procedure.**

## Rehearsal status

**Not yet rehearsed.** Writing this runbook is the documented next step from
the backup/DR plan; actually executing a promotion (even against the
Mumbai replica, not the live demo) is a one-way, irreversible action on
real infrastructure and requires explicit sign-off before being attempted,
consistent with this session's standing "confirm before destructive
actions" rule. Recommended: schedule a deliberate rehearsal window, get
explicit approval, then execute this runbook end-to-end once and record
the actual elapsed time and any corrections needed to this document.
