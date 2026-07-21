# IST Health Roles and Permissions

Reference doc compiled 2026-07-21 from a direct audit of the actual RBAC code
(`src/services/securityAdmin.ts`'s `roles` array, `requirePermission`/
`requireAnyPermission` calls across `src/routes/*.ts`, and the service-layer
helpers in `src/services/queueOrchestration.ts`) - not just the login
dropdown labels. Every claim below about what a role "can do" was verified
against an actual permission check in code, or explicitly flagged as
**not yet enforced** where no such check exists.

**Status: reference only.** No role changes have been made yet. This
documents the current 19-role state plus a proposed 15-role reduction to
revisit later.

---

## 1. Current state: 19 roles

### A - Administration

| Role | Permissions | What it actually unlocks |
| --- | --- | --- |
| **Platform Super Administrator** | All 23 permission codes | Every tab in the Admin Control Center (Users, Access, Security, Privacy, Audit, Governance, Protocol Library, Integration, Reports, Support) - unrestricted. |
| **Organization Administrator** | `admin.users.manage`, `admin.roles.manage`, `operations.dashboard.view`, `reports.view`, `audit.events.view` | Users + Access + Reports + Audit tabs. **Near-duplicate of System Administrator** - see §2. |
| **System Administrator** | `admin.users.manage`, `admin.roles.manage`, `support.tickets.manage`, `audit.events.view` | Users tab (directory, masked-field reveal, effective-access viewer), Access tab (role/responsibility management), Audit tab, Support tab. |

### S - Security / Privacy

| Role | Permissions | What it actually unlocks |
| --- | --- | --- |
| **Security Administrator** | `security.sso.manage`, `crypto.policy.manage`, `audit.events.view` | Security tab (SSO provider config, encryption policy management), shares Privacy tab access via `crypto.policy.manage`, required alongside Integration Administrator for the SSO connector entry. |
| **Privacy Officer / DPO** | `privacy.assessment.manage`, `privacy.reveal.request`, `crypto.policy.manage`, `audit.events.view`, `reports.view` | Privacy tab (assessments, data-boundary management). Uniquely holds `privacy.reveal.request` - the actual masked-PII reveal action (`POST /api/v1/admin/reveal`, `GET /admin/reveal-directory`), a real, logged, sensitive action distinct from merely viewing. |

### G - Governance / Quality

| Role | Permissions | What it actually unlocks |
| --- | --- | --- |
| **Compliance Auditor** | `audit.events.view`, `reports.view`, `reports.export` | Audit + Reports tabs, with export capability. |
| **Clinical Governance Lead** | `clinical.governance.approve`, `protocol.library.manage`, `triage.recommendation.view`, `audit.events.view`, `reports.view` | Governance tab (`GET /admin/governance`) and Protocol Library tab (`GET /admin/protocol-library`) - both gated by an OR-check that Protocol Content Manager also satisfies (see §2). |
| **Protocol Content Manager** | `protocol.library.manage`, `reports.view`, `audit.events.view` | Protocol Library tab only. **Subset of Clinical Governance Lead** - see §2. |
| **Quality Reviewer** | `audit.events.view`, `reports.view` | Audit + Reports tabs. **Strict subset of Compliance Auditor** - see §2. |

### B - Business / Clinical Operations

| Role | Permissions | What it actually unlocks |
| --- | --- | --- |
| **Triage Service Manager** | `triage.queue.manage`, `operations.dashboard.view`, `reports.view`, `audit.events.view` | Broad queue access (`queueRouter.ts`), call-center gateway command endpoints (`callCenterGateway.ts`) - real, enforced queue-management authority. |
| **Call Intake Coordinator** | `triage.workspace.view`, `triage.call.intake` | The *only* role (checked by literal role-name match, `isCallIntake()` in `queueOrchestration.ts`) permitted to create new queue items (`POST /api/v1/queue`) and edit call context before a nurse claims it. Real, enforced. |
| **Remote Triage Nurse** | `triage.workspace.view`, `triage.recommendation.view`, `privacy.reveal.request` | Baseline: open/work the triage cockpit, view AI/RAG shadow suggestions. |
| **Senior Triage Nurse** | `triage.workspace.view`, `triage.call.intake`, `triage.recommendation.view`, `triage.disposition.override`, `triage.queue.manage`, `privacy.reveal.request` | Genuine superset of Remote Triage Nurse: also passes `isCallIntake()` (can intake calls like the coordinator) *plus* `triage.queue.manage` (queue-level control). Real, enforced difference. |
| **Pediatric Triage Nurse** | `triage.workspace.view`, `triage.recommendation.view`, `triage.pediatric.manage`, `privacy.reveal.request` | Meant to unlock pediatric-specific workflow via `triage.pediatric.manage` - **not currently checked anywhere in the codebase**. Behaves identically to Remote Triage Nurse today. |
| **Teleconsult Physician** | `triage.workspace.view`, `triage.recommendation.view`, `triage.teleconsult.manage`, `triage.disposition.override`, `privacy.reveal.request` | Meant to unlock teleconsult approval + disposition override via `triage.teleconsult.manage`/`triage.disposition.override` - **neither is checked anywhere in the codebase**. Behaves identically to Remote Triage Nurse today. |
| **Occupational Health Clinician** | `triage.workspace.view`, `triage.recommendation.view`, `triage.disposition.override`, `privacy.reveal.request` | Meant to unlock disposition override via `triage.disposition.override` - **not checked anywhere in the codebase**. Behaves identically to Remote Triage Nurse today. |

### I / R / U - Integration, Reporting, Support

| Role | Permissions | What it actually unlocks |
| --- | --- | --- |
| **Integration Administrator** | `integration.hrms.manage`, `integration.emr.manage`, `integration.callcenter.manage`, `security.sso.manage`, `audit.events.view` | Integration tab (`GET /admin/integrations`) - live connector dashboard covering the call-center gateway, Oracle Fusion HRMS directory sync, EMR, and SSO. Uniquely holds `integration.callcenter.manage`, which gates the call-center gateway's live command endpoints (`answer`/`callback`/`hold`/`resume`/`end`) - a real, distinct capability beyond just viewing. |
| **Reporting Analyst** | `reports.view`, `reports.export` | Reports tab. **Strict subset of Compliance Auditor** - see §2. |
| **Helpdesk Support** | `support.tickets.manage` | Support tab - a real seeded ticket queue (account lockouts/MFA issues, role/access-change requests) with explicit data boundaries (e.g. "Helpdesk can see masked user profile and access status, not clinical notes"). A genuine least-privilege, front-line persona. |

---

## 2. Redundancy findings (why a 15-role set is proposed)

No route or service anywhere checks a role **by name** except `call_intake_coordinator`
(via `isCallIntake()`) and the two manager roles (via `hasManagerControl()`/
`managerRoles`). Every other distinction is by **permission code**, checked
with `requirePermission`/`requireAnyPermission`. That means a role is only
functionally meaningful if it holds a permission nothing else does, or a
combination that's checked as a specific AND (not just present in an OR list
alongside broader roles).

Four roles turned out to be pure subsets of another role in this list, never
uniquely required by any check:

1. **Organization Administrator** -> subset of/overlaps **System Administrator** (differs only by `operations.dashboard.view` + `reports.view`, easy to fold in).
2. **Quality Reviewer** -> strict subset of **Compliance Auditor** (`audit.events.view`+`reports.view` vs. the same plus `reports.export`).
3. **Reporting Analyst** -> strict subset of **Compliance Auditor** (`reports.view`+`reports.export` - literally the same two, just missing `audit.events.view`).
4. **Protocol Content Manager** -> subset of **Clinical Governance Lead** (both currently satisfy the identical `admin.ts` OR-checks for Governance and Protocol Library tabs).

Three roles are *not* permission-redundant (each carries a permission meant to
be unique to it) but are **currently behaviorally redundant** because that
permission isn't enforced anywhere yet: **Pediatric Triage Nurse**,
**Teleconsult Physician**, **Occupational Health Clinician**. They're
identical in practice to Remote Triage Nurse today. Two options when this is
revisited: (a) wire up real enforcement so they actually diverge, or (b) fold
them too if the clinical distinction isn't worth building yet. Recommendation
made earlier in this session was to **keep them** despite the current gap,
since the underlying clinical workflows (pediatric safety floors, teleconsult
escalation, occupational fitness-for-duty) are real and already differentiated
elsewhere in the system (e.g. Sidra Medicine pediatric routing) - the
permission just hasn't been threaded through to a route check yet.

**Helpdesk Support** also has some permission overlap with System
Administrator (`support.tickets.manage` is satisfied by either role in the
`/admin/support` OR-check), but merging it would violate least-privilege for
a real front-line role - recommended to **keep** it separate regardless of
the current OR-check overlap.

---

## 3. Proposed reduction: 19 -> 15 roles

Drop these 4 (fold their permissions into the role noted):

- Organization Administrator -> **System Administrator**
- Quality Reviewer -> **Compliance Auditor**
- Reporting Analyst -> **Compliance Auditor**
- Protocol Content Manager -> **Clinical Governance Lead**

Resulting 15:

| Group | Role |
| --- | --- |
| A | Platform Super Administrator |
| A | System Administrator *(absorbs Organization Administrator)* |
| S | Security Administrator |
| S | Privacy Officer / DPO |
| G | Compliance Auditor *(absorbs Quality Reviewer + Reporting Analyst)* |
| G | Clinical Governance Lead *(absorbs Protocol Content Manager)* |
| B | Triage Service Manager |
| B | Call Intake Coordinator |
| B | Remote Triage Nurse |
| B | Senior Triage Nurse |
| B | Pediatric Triage Nurse |
| B | Teleconsult Physician |
| B | Occupational Health Clinician |
| I | Integration Administrator |
| U | Helpdesk Support |

(The "R - Reporting" group disappears entirely since Reporting Analyst merges
into Compliance Auditor, which moves to the G group.)

---

## 4. What implementing this touches (not yet done)

- `frontend/src/LoginPage.tsx` - the `simulationUserGroups` dropdown data (19 -> 15 entries).
- `src/services/securityAdmin.ts` - the `roles` array (RBAC role-to-permission definitions) and the seeded demo `users` array (any user currently assigned a dropped role needs reassignment to its replacement).
- Anywhere a dropped role's string is referenced directly (grep for `"organization_administrator"`, `"quality_reviewer"`, `"reporting_analyst"`, `"protocol_content_manager"` before touching, to catch any missed reference).
- No route/middleware changes needed - the 4 dropped roles were never checked by name, only by permission code, and their permissions already exist on the roles absorbing them.

## 5. Open decision for when this is picked up

Whether to also wire up real backend enforcement for `triage.pediatric.manage`,
`triage.teleconsult.manage`, and `triage.disposition.override` (currently
unused) so Pediatric Triage Nurse / Teleconsult Physician / Occupational
Health Clinician actually diverge in behavior - or leave them as reserved/
future-facing permissions for now.
