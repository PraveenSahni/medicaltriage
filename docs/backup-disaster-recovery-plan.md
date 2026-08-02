# Backup & Disaster Recovery Plan

_Last updated: 2026-08-02. Written as part of the SOC 2 remediation roadmap
(Wave A). Reflects the real, current infrastructure - not an aspirational
target state._

## Scope

Covers the two live application environments and their shared database
infrastructure:

| Environment | Cloud Run service | Database | Firebase Hosting site |
|---|---|---|---|
| Demo (customer-facing) | `ist-triage-demo` | `ist_triage_demo` | `ist-triage-demo-502706-6a0c5` (`triaged.irisstar.tech`) |
| SOC 2 staging | `ist-triage-soc2` | `ist_triage_soc2` | `ist-triage-soc2-502706` (`triagedsoc2.irisstar.tech`) |

Both databases live on the same shared Cloud SQL instance:
`triage-502706:me-central1:ist-triage-postgres-uat`.

## What's actually backed up today

**Cloud SQL (`ist-triage-postgres-uat`)** - as of 2026-08-02:

- **Automated daily backups: enabled** (previously disabled - this was a real
  gap closed as part of this remediation pass).
  - Backup window start: 02:00 (server time)
  - Retention: 7 most recent backups
  - Point-in-time recovery: **enabled** (transaction log retention: 7 days)
- **Availability type: ZONAL** (not regional/HA) - a zone outage takes the
  instance down until manually failed over or restored; there is no automatic
  cross-zone failover today. This is an accepted risk for a demo/staging
  workload, not appropriate as-is if this instance ever serves real production
  traffic with real PHI.

**Application code & configuration:**
- Source code: version-controlled in GitHub (`PraveenSahni/medicaltriage`),
  the actual durable backup of all application logic.
- Container images: stored in Artifact Registry
  (`me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/`), retained
  indefinitely by default (no explicit lifecycle/cleanup policy currently
  configured - a minor storage-cost item, not a DR risk).
- Firebase Hosting config (`firebase.json`/`.firebaserc`) and Cloud Run
  service definitions: version-controlled in the same repo, but the *live*
  Cloud Run service configuration (env vars, secrets, IAM bindings) is not
  currently captured as Infrastructure-as-Code (e.g. Terraform) - it exists
  only as imperative `gcloud` commands run by hand and recorded in this
  session's history / day-handover docs. **This is a real gap**: recreating a
  service from scratch today requires a human to correctly reconstruct the
  exact `--set-env-vars`/`--add-cloudsql-instances` flags, not a single
  reproducible script.

**What is NOT backed up / has no recovery path today:**
- Secret Manager secret values in general (GCP does not back these up
  independently of whatever redundancy the secret's replication policy
  provides - `ist-triage-soc2-database-url` uses `automatic` replication).
- Any data held only in application memory (mock-mode in-memory queue store,
  when `QUEUE_DB_PERSISTENCE=false`) - by design, this is synthetic/ephemeral
  data and not expected to survive a restart.

**Update 2026-08-03:** `ist-triage-soc2`'s `DATABASE_URL` is now a Secret
Manager secret (`ist-triage-soc2-database-url`), no longer a plain Cloud Run
env var - closes the gap previously noted here. Verified via canary-then-
cutover deploy (health-checked the canary directly before routing 100%
traffic), with `triaged.irisstar.tech` confirmed untouched throughout.
**`ist-triage-demo`'s `DATABASE_URL` is still a plain env var** - out of
scope for this pass per the standing rule not to touch `triaged.irisstar.tech`;
promoting this same fix to demo is a distinct future step. Note also: a
Secret Manager secret literally named `DATABASE_URL` already existed in this
project before this fix (created 2026-07-22) but is unused by either live
service - it points at a different, older database/user pair and appears to
be leftover from an earlier setup attempt. Left in place rather than deleted
unprompted; flagged here so it isn't mistaken for the secret actually in use.

## Recovery Point Objective (RPO) and Recovery Time Objective (RTO)

| Failure scenario | RPO (max data loss) | RTO (max time to restore) | Basis |
|---|---|---|---|
| Accidental data deletion/corruption in Postgres | Up to a few seconds (point-in-time recovery) | 1-4 hours (manual PITR restore + validation) | Cloud SQL PITR, now enabled |
| Cloud SQL instance failure (non-zone-wide) | Up to 24 hours (last daily backup) if PITR restore isn't viable | 1-4 hours | Daily automated backup |
| Zone outage taking the Cloud SQL instance down | Up to 24 hours | Hours (manual restore into a new zone/instance - no automatic failover configured) | ZONAL availability, no HA replica |
| Cloud Run service deleted/misconfigured | Zero (code is in Git, image is in Artifact Registry) | 30-60 minutes (manual redeploy following the recipe in `README.md`, or faster once the service is reproducible as code - see gaps below) | Confirmed working this session: redeploying a known-good image + env vars takes well under an hour by hand |
| Firebase Hosting site/domain misconfigured | Zero (config is in Git) | 15-30 minutes (`firebase deploy --only hosting:<target>`) | Confirmed working this session |
| Full GCP project loss (extreme) | Up to 24 hours for data; zero for code | Days (recreate project, all infra, restore from last backup) | No cross-project/cross-region backup replication configured today |

These are the plan's **current, honest** targets given today's infrastructure
- not yet formally reviewed or signed off by a business stakeholder as
  acceptable for a production (non-demo) workload. Before this system ever
  handles real PHI in production, the ZONAL-vs-REGIONAL availability
  decision and the RPO/RTO table above should be explicitly re-reviewed and
  approved, not just inherited from the demo setup.

## Explicitly out of scope / open gaps for a future pass

1. **No Infrastructure-as-Code** for Cloud Run services, Cloud SQL instance,
   or Firebase Hosting sites - recovery today depends on a human correctly
   re-running documented `gcloud`/`firebase` commands. Recommended next step:
   capture the real, working configuration (confirmed exact env vars/flags
   this session) into Terraform or a `gcloud` script checked into the repo.
2. **No automated backup restore test has ever been performed** - "backups
   are enabled" is not the same as "we've proven we can actually restore from
   one." A quarterly restore drill (restore the latest backup into a
   scratch instance, verify data integrity, tear it down) should be
   scheduled once this plan is adopted.
3. **No cross-region/cross-project backup replication** - a full-region GCP
   outage in `me-central1` would be unrecoverable under the current setup.
   Out of scope for the demo/staging environments; would need to be revisited
   before any real production PHI workload.
4. **DATABASE_URL is a plain env var, not a Secret Manager secret** - noted
   above; fixing this is a small, separate hardening item (not blocking this
   DR plan, but worth doing alongside the encryption/masking Wave C items).
