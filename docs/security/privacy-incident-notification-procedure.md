# Privacy Incident Notification Procedure

_Written 2026-08-05, closing IS.61's second half ("notify customers
expeditiously"). Companion to `docs/security/reveal-anomaly-detection.md`
(the detection half, already closed). No customer has been notified by
this batch - this document describes the controlled workflow built so
that a real notification can happen safely once approved, not a claim
that one has occurred._

## Phase 1 - scope and decision dependencies

**Notification is NOT triggered automatically by an anomaly alert.**
Every detection signal (currently: the reveal-anomaly counter
exceeding its threshold) creates a durable **incident candidate** only
- a raw anomaly event never bypasses human review to directly notify
anyone. This is enforced at the code level (the state machine has no
transition from `detected` directly to any notification state) and
proven by test (`tests/privacyIncidentWorkflow.test.ts`,
"creates an incident candidate from a detection signal without
notifying anyone").

**Separated concerns, per the literal requirement**:
- Technical anomaly detection (already built, see the companion doc).
- Security/privacy incident triage (`beginReview`, `classifyIncident`).
- Privacy breach confirmation (`confirmIncident`).
- Customer-notification decision (`recordNotificationDecision`) - a
  distinct, reasoned, human decision, not inferred from severity alone.
- Regulatory notification - **out of scope for this batch**; if a
  confirmed breach also triggers a regulatory (not just customer)
  notification obligation, that is a separate legal determination this
  workflow does not make or automate.
- Operational delivery (`generateAndDeliverNotification`).

## Decision inputs required before real activation (all currently unset)

| Input | Status | Configuration |
|---|---|---|
| Customer notification recipients | **Approval-required** - none configured | `PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS` |
| Internal incident recipients | Approval-required - none configured | `PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS` |
| DPO/privacy approver | Approval-required - role, not a named individual, per standing instruction | N/A (workflow role, not config) |
| Security approver | Approval-required | N/A |
| Legal approver | Approval-required - must approve the template (see the template doc) | N/A |
| Notification deadline/SLA | **Approval-required** - no engineering default was chosen; `PRIVACY_NOTIFICATION_SLA_HOURS` is `null` until set | `PRIVACY_NOTIFICATION_SLA_HOURS` |
| Severity threshold | Engineering default only (reuses the reveal-anomaly threshold as the *detection* signal) - the *notification* severity threshold is a human judgment call at classification time, not hardcoded | N/A |
| Affected-customer determination | A human judgment recorded per-incident (`confirmIncident`), not automated | N/A |
| Notification template approval | **Approval-required** - draft exists, unapproved (see template doc) | N/A |
| Communication channel | Email only (reuses the existing, already-live `getEmailAdapter()`) - SMS/other channels not built | N/A |
| Escalation path | Not built this batch - overdue incidents raise a durable audit event; a real escalation/paging integration is a future step | N/A |
| After-hours handling | Not built - no on-call/paging integration exists in this codebase | N/A |
| Regulatory-notification responsibility | Approval-required, legal determination, explicitly out of this batch's scope | N/A |

## Workflow (implemented)

1. Anomaly/privacy signal detected -> `createIncidentCandidate()`.
2. Durable incident candidate created (`status: detected`).
3. Security/privacy review initiated -> `beginReview()` (`status: under_review`).
4. Incident classified -> `classifyIncident()` (`status: privacy_assessment_required`, or `notification_not_required` if no real impact).
5. Affected-customer status recorded -> `confirmIncident()` (`status: confirmed_incident`, or `notification_not_required`).
6. Notification decision recorded, with a mandatory reason -> `recordNotificationDecision()` (`status: notification_approval_pending`, or `notification_not_required`).
7. Notification approved, segregation-of-duties enforced -> `approveNotification()` (`status: approved_for_notification`).
8. Customer notification generated -> `renderNotificationTemplate()`.
9. Notification delivered (internal-test dry-run only until fully authorized) -> `generateAndDeliverNotification()` (`status: notification_queued` then `notification_sent`/`delivery_failed`).
10. Delivery evidence retained - `deliveryStatus`, `notificationSentAt`, and a durable `AuditEvent` per transition.
11. Follow-up and closure -> manual transition to `closed`.

## Incident model

`PrivacyIncident` (`prisma/schema.prisma`, migration
`20260805170935_add_privacy_incident_workflow`): id, organization,
detection source, detection timestamp, severity, status, assigned
owner, privacy-impact status, affected-customer status, notification-
required decision + reason + decision-maker + timestamp, approver +
approval timestamp, notification deadline, notification-sent
timestamp, delivery status, correlation ID, evidence references
(JSON, operational metadata only). **Does not store**: revealed
values, PHI, credentials, tokens, or any raw sensitive request data -
verified by test (`tests/privacyIncidentWorkflow.test.ts`, "does not
persist revealed values or sensitive fields").

## Status model and transition enforcement

`ALLOWED_TRANSITIONS` (`src/services/privacyIncidentWorkflow.ts`) is
an explicit allow-list - any transition not listed is rejected with
`InvalidTransitionError`. Verified by test that an invalid transition
(e.g. approving before a decision is recorded) is rejected, and that
segregation of duties (the decision-maker cannot also approve) is
enforced (`SelfApprovalError`).

## Notification service

Reuses the existing, already-live `getEmailAdapter()`
(`src/services/communicationAdapters.ts` - the same adapter
`sliReportService.ts` already uses in production). Supports:
configurable recipients (env-driven, never hardcoded), the approved-
fields-only template, dry-run/preview (`isPrivacyNotificationDryRun()`),
mandatory approval before any delivery attempt, duplicate-send
prevention (`DuplicateNotificationError`), failure recording
(`delivery_failed` status + durable audit event), and masked/no
sensitive-data logging (the audit trail records status/outcome only,
never message bodies).

**Not built this batch**: automatic retry-with-backoff (a delivery
failure is recorded and requires a human to re-queue, matching this
codebase's existing preference for visible failures over automatic
retries in security-relevant paths) and a real escalation/paging
integration for overdue incidents.

## Failure policy

| Scenario | Behavior |
|---|---|
| Notification service unavailable | Delivery attempt fails, incident moves to `delivery_failed`, durable audit event recorded - **not silently discarded** |
| Email delivery failure | Same as above |
| Invalid/missing recipients | `NotificationNotConfiguredError` thrown before any send attempt |
| Missing approval | `InvalidTransitionError` - delivery cannot be attempted without `approved_for_notification` status |
| Missing SLA | No deadline is set; the incident proceeds through the workflow but is never flagged "overdue" (there is nothing to be overdue against) - a real, disclosed gap, not a silent default |
| Duplicate send request | `DuplicateNotificationError` - a second send for an already-sent incident is rejected |
| Partial recipient delivery | Not applicable in this pass - delivery targets a single recipient per attempt; a real multi-recipient batch-delivery feature is not built |
| Database outage | The incident-candidate creation itself (`createIncidentCandidate`, called from `checkRevealAnomalyRate`) is wrapped in try/catch so a database issue there does not block the underlying reveal-anomaly detection/audit path - logged, not silently swallowed |

## Cross-instance and idempotency validation performed

Real end-to-end run against the actual soc2 Postgres database: created
an incident, reviewed, classified, confirmed, decided, approved, and
dry-run-delivered - every step produced a real, durable row (verified
via direct query), and a real `PRIVACY_INCIDENT_STATUS_TRANSITION`
audit event was confirmed once `AUDIT_EVENT_DB_PERSISTENCE` was also
enabled. All synthetic test rows were deleted after validation.

## Compliance decision: IS.61

**Retained Partial** (unchanged from the prior downward correction).
Exact remark applied to the workbook:

> "Multi-instance privacy-anomaly detection and durable incident/audit
> workflow are operational. Customer notification capability is
> implemented in controlled dry-run/internal-test mode. Final closure
> requires approved notification SLA, legal/privacy-approved template,
> authorized Qatar Airways recipients and one approved live delivery
> validation."

## Remaining dependencies before this can move to Yes

1. Approved notification SLA (`PRIVACY_NOTIFICATION_SLA_HOURS`).
2. Legal/DPO/management-approved template (see
   `docs/security/privacy-incident-notification-template.md`).
3. Authorized Qatar Airways recipients
   (`PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS`) - see
   `docs/qr-compliance/qatar-airways-input-pack.md`.
4. One real, approved, successfully delivered live notification (not
   a dry-run) with retained delivery evidence.
