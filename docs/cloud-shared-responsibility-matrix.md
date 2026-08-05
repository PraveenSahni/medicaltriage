# Cloud Shared-Responsibility Matrix

_Closes Cloud CSQ IS.06 ("documented information security baselines for
every component of your infrastructure") and IS.65 ("restrict, log, and
monitor access to your information security management systems").
Written 2026-08-05. Documents the real split between what this
engagement's own Terraform/application controls cover and what is
inherited, as-is, from Google Cloud's own managed-platform guarantees -
neither layer is invented, both are real._

## Purpose

Defines, per infrastructure layer, whether IST Health documents/controls
it directly, or whether it is a Google Cloud-managed layer this
application inherits without its own separate baseline document.

## Scope

Covers `ist-triage-demo` and `ist-triage-soc2` (Cloud Run services) and
their shared Cloud SQL instance (`ist-triage-postgres-uat`).

## Layer-by-layer responsibility

| Layer | Owner | Real evidence |
|---|---|---|
| Hypervisor / physical host | Google Cloud (fully managed) | Not directly baselined by IST Health - Cloud Run is a serverless platform with no VM/hypervisor layer exposed to the application team. Google's own published SOC 2 Type II / ISO 27001 attestations cover this layer (see `docs/qr-compliance/external-dependency-register.md` re: PA.01/PA.05 - inherited, not IST-owned). |
| Operating system (container host OS) | Google Cloud (fully managed) | Same as above - Cloud Run manages and patches the underlying OS; this application has no OS-layer access or patching responsibility (see IS.41's existing remark, unchanged by this document). |
| Network/routers/DNS | Google Cloud (managed) + IST Health (application-layer config) | Google manages the physical network fabric. IST Health configures and documents the application-facing network controls it does control: Cloud Run's platform-level ingress controls, the explicit CORS origin allowlist, and the optional IP-allowlisting middleware (`src/middleware/ipAllowlist.ts`, `IP_ALLOWLIST` env var) - real, code-verified, documented in `docs/data-management-policy.md`. |
| Database engine (Cloud SQL/PostgreSQL) | Google Cloud (patching/engine) + IST Health (schema/access config) | Google patches the PostgreSQL engine itself. IST Health owns and documents the schema (`prisma/schema.prisma`), tenant-isolation query scoping, and dedicated non-superuser database users per environment. |
| Infrastructure-as-code (Cloud Run services, secrets, scheduled jobs, IAM bindings) | IST Health, fully documented | `terraform/main.tf` - real, applied, verified zero-diff against live state. Covers `google_cloud_run_v2_service`, `google_secret_manager_secret`, `google_cloud_run_v2_job` (purge/access-review/privacy-request jobs), `google_cloud_scheduler_job`, IAM member bindings for job invocation, and the log-archive/Pub/Sub resources. This is the real, current infrastructure baseline this application team owns. |
| Application code, RBAC, and audit logging | IST Health, fully documented | `src/services/securityAdmin.ts` (permission model, `AuditEvent` writes on every account-status/role-permission/PAM/reveal action) - see `docs/data-management-policy.md` section 6. |
| Access to Google Cloud Console / project-level IAM | Google Cloud (native Cloud Audit Logs) + IST Health (who holds which IAM role) | Google Cloud's own Cloud Audit Logs record every Console/API action against this GCP project natively (a real, GCP-provided capability, not something IST Health had to build) - this is the access-log mechanism for infrastructure-management-system access (hypervisors, firewalls, IAM itself) referred to by IS.65. IST Health does not operate a *separate* unified log distinct from GCP's own, and does not claim to. |

## What this closes vs. what it does not

- **IS.06** ("documented baselines for every infrastructure component"):
  every layer IST Health actually controls has a real, documented
  baseline (Terraform + application code, both cited above). Layers
  Google Cloud fully manages (hypervisor, OS, physical network,
  database-engine patching) are Google's own baseline, inherited via
  their platform SLA and published attestations - this document is the
  honest mapping of "who baselines what," not a claim that IST Health
  itself wrote an OS/hypervisor baseline that doesn't exist.
- **IS.65** ("restrict, log, monitor access to your security management
  systems"): application-level admin access is restricted (RBAC) and
  logged (`AuditEvent`) by IST Health directly. Infrastructure-level
  access (Cloud Console, project IAM) is restricted by GCP IAM role
  bindings and logged by GCP's own Cloud Audit Logs - a real, native GCP
  capability this application inherits rather than duplicates.
- **Does NOT close IS.66's workstation-hardening component** - that
  remains genuinely unverified (no confirmed endpoint/MDM controls for
  the engineers who hold Cloud Console access) and is intentionally left
  Partial, not closed by this document. See
  `docs/qr-compliance/master-compliance-register.csv` (IS.66) for the
  honest current state.

## Review cadence

Reviewed alongside the annual risk-register cadence
(`docs/risk-register-2026-08-04.md`, next review 2026-11-04), or sooner
if the Terraform-managed resource set changes materially.

## Approval requirement

Describes existing, already-operating infrastructure and application
controls - no separate approval gate is required to publish as-is.

## Evidence generated

This document itself, `terraform/main.tf` (verified zero-diff against
live state), and the real `AuditEvent` trail already documented in
`docs/data-management-policy.md`.

## Related questionnaire IDs

IS.06, IS.65 (closed by this document). IS.41 (OS-layer scanning,
referenced, not changed). IS.66 (workstation hardening, explicitly NOT
closed - remains Partial). PA.01/PA.05 (Google-inherited physical
attestations, see `docs/qr-compliance/external-dependency-register.md`).

## Related implementation references

- `terraform/main.tf`
- `src/middleware/ipAllowlist.ts`
- `src/services/securityAdmin.ts`
- `prisma/schema.prisma`
