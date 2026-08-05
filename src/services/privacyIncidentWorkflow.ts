// Closes IS.61's second half - "notify customers expeditiously if a
// privacy event may have impacted their data." A raw anomaly-detection
// event never bypasses human review to directly notify a customer: this
// module implements the controlled, auditable path from a detected signal
// through classification, an explicit human notification decision,
// approval (with segregation-of-duties), dry-run/internal-test delivery,
// and evidence retention. Real customer delivery stays disabled until a
// real SLA, real recipients, and an approval are all configured - see
// docs/security/privacy-incident-notification-procedure.md.
import { randomUUID } from "node:crypto";
import {
  getPrivacyNotificationCustomerRecipients,
  getPrivacyNotificationInternalRecipients,
  getPrivacyNotificationSlaHours,
  isPrivacyNotificationDryRun,
  isPrivacyNotificationEnabled
} from "../config/runtime.js";
import { getEmailAdapter } from "./communicationAdapters.js";
import {
  createPrivacyIncident,
  getPrivacyIncident,
  listOverduePrivacyIncidents,
  persistSecurityAuditEvent,
  updatePrivacyIncident,
  type PrivacyIncidentRecord
} from "./persistence.js";
import type { AuditEvent } from "../types/security.js";

async function recordWorkflowAuditEvent(event: Omit<AuditEvent, "id" | "timestampIso">): Promise<void> {
  try {
    await persistSecurityAuditEvent({ ...event, id: randomUUID(), timestampIso: new Date().toISOString() });
  } catch (error) {
    console.error("Failed to persist privacy-incident workflow audit event (workflow state itself is unaffected):", error);
  }
}

export type PrivacyIncidentStatus =
  | "detected"
  | "under_review"
  | "privacy_assessment_required"
  | "confirmed_incident"
  | "notification_not_required"
  | "notification_approval_pending"
  | "approved_for_notification"
  | "notification_queued"
  | "notification_sent"
  | "delivery_failed"
  | "closed";

// Explicit allow-list of valid transitions - anything not listed here is
// rejected, closing the "raw anomaly event bypasses review" risk at the
// state-machine level, not just by convention.
const ALLOWED_TRANSITIONS: Record<PrivacyIncidentStatus, PrivacyIncidentStatus[]> = {
  detected: ["under_review"],
  under_review: ["privacy_assessment_required", "notification_not_required", "closed"],
  privacy_assessment_required: ["confirmed_incident", "notification_not_required"],
  confirmed_incident: ["notification_approval_pending"],
  notification_not_required: ["closed"],
  notification_approval_pending: ["approved_for_notification", "notification_not_required"],
  approved_for_notification: ["notification_queued"],
  notification_queued: ["notification_sent", "delivery_failed"],
  notification_sent: ["closed"],
  delivery_failed: ["notification_queued", "closed"],
  closed: []
};

export class InvalidTransitionError extends Error {}
export class SelfApprovalError extends Error {}
export class NotificationNotConfiguredError extends Error {}
export class DuplicateNotificationError extends Error {}

async function transition(incidentId: string, to: PrivacyIncidentStatus): Promise<PrivacyIncidentRecord> {
  const incident = await getPrivacyIncident(incidentId);
  if (!incident) {
    throw new Error(`No privacy incident found with id ${incidentId}`);
  }
  const allowed = ALLOWED_TRANSITIONS[incident.status as PrivacyIncidentStatus] ?? [];
  if (!allowed.includes(to)) {
    throw new InvalidTransitionError(`Cannot transition privacy incident from "${incident.status}" to "${to}"`);
  }
  const result = await updatePrivacyIncident(incidentId, { status: to });
  await recordWorkflowAuditEvent({
    userId: incident.decisionByUserId ?? incident.assignedOwnerUserId ?? "system",
    activeRole: "unknown",
    organization: incident.organization ?? "",
    facility: "",
    department: "",
    action: "PRIVACY_INCIDENT_STATUS_TRANSITION",
    module: "PrivacyIncidentWorkflow",
    resource: `PrivacyIncident:${incidentId}`,
    purpose: `${incident.status} -> ${to}`,
    ipAddress: "",
    device: "",
    success: true,
    risk: to === "notification_sent" || to === "delivery_failed" ? "high" : "medium"
  });
  return result;
}

// Step 1-2: a detection signal (e.g. the reveal-anomaly counter exceeding
// its threshold) creates a durable incident CANDIDATE only - detection
// never notifies anyone directly.
export async function createIncidentCandidate(args: {
  organization?: string;
  detectionSource: string;
  severity?: "low" | "medium" | "high" | "critical";
  correlationId?: string;
  evidenceReferences?: Record<string, unknown>;
}): Promise<PrivacyIncidentRecord> {
  return createPrivacyIncident({
    organization: args.organization,
    detectionSource: args.detectionSource,
    severity: args.severity,
    correlationId: args.correlationId ?? randomUUID(),
    evidenceReferences: args.evidenceReferences
  });
}

// Step 3: security/privacy review initiated (a human claims the incident).
export async function beginReview(incidentId: string, reviewerUserId: string): Promise<PrivacyIncidentRecord> {
  await updatePrivacyIncident(incidentId, { assignedOwnerUserId: reviewerUserId });
  return transition(incidentId, "under_review");
}

// Step 4-5: classify severity and affected-customer status. Splits
// "privacy assessment required" from a genuinely "confirmed incident" -
// most anomaly signals should resolve to notification_not_required
// (a false positive or benign explanation) without ever reaching a
// notification decision at all.
export async function classifyIncident(
  incidentId: string,
  args: { severity: "low" | "medium" | "high" | "critical"; privacyImpactStatus: "confirmed_breach" | "no_impact" }
): Promise<PrivacyIncidentRecord> {
  await updatePrivacyIncident(incidentId, { severity: args.severity, privacyImpactStatus: args.privacyImpactStatus });
  if (args.privacyImpactStatus === "no_impact") {
    return transition(incidentId, "notification_not_required");
  }
  return transition(incidentId, "privacy_assessment_required");
}

export async function confirmIncident(
  incidentId: string,
  args: { affectedCustomerStatus: "affected" | "not_affected" }
): Promise<PrivacyIncidentRecord> {
  await updatePrivacyIncident(incidentId, { affectedCustomerStatus: args.affectedCustomerStatus });
  if (args.affectedCustomerStatus === "not_affected") {
    return transition(incidentId, "notification_not_required");
  }
  return transition(incidentId, "confirmed_incident");
}

// Step 6: record the human notification decision (required or not),
// with a mandatory reason - never inferred automatically from severity
// alone. If a real SLA is configured, sets a real notification deadline;
// if not, deliberately leaves it unset (see getPrivacyNotificationSlaHours's
// own doc comment - a missing SLA is a real, visible gap, not silently
// defaulted).
export async function recordNotificationDecision(
  incidentId: string,
  args: { decisionByUserId: string; notificationRequired: boolean; reason: string }
): Promise<PrivacyIncidentRecord> {
  const slaHours = getPrivacyNotificationSlaHours();
  const notificationDeadlineAt = args.notificationRequired && slaHours
    ? new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()
    : undefined;
  await updatePrivacyIncident(incidentId, {
    notificationRequired: args.notificationRequired,
    decisionReason: args.reason,
    decisionByUserId: args.decisionByUserId,
    decisionAt: new Date().toISOString(),
    ...(notificationDeadlineAt ? { notificationDeadlineAt } : {})
  });
  if (!args.notificationRequired) {
    return transition(incidentId, "notification_not_required");
  }
  return transition(incidentId, "notification_approval_pending");
}

// Step 7: explicit human approval, required before any customer delivery
// (dry-run or real). Segregation of duties: the approver cannot be the
// same person who made the notification-required decision.
export async function approveNotification(
  incidentId: string,
  args: { approverUserId: string }
): Promise<PrivacyIncidentRecord> {
  const incident = await getPrivacyIncident(incidentId);
  if (!incident) {
    throw new Error(`No privacy incident found with id ${incidentId}`);
  }
  if (incident.decisionByUserId && incident.decisionByUserId === args.approverUserId) {
    throw new SelfApprovalError("The notification decision-maker cannot also approve the notification.");
  }
  await updatePrivacyIncident(incidentId, {
    approverUserId: args.approverUserId,
    approvalAt: new Date().toISOString()
  });
  return transition(incidentId, "approved_for_notification");
}

export type NotificationPreview = {
  to: string;
  subject: string;
  body: string;
};

// Approved-fields-only template - deliberately does not state unverified
// facts, admit liability, or make legal commitments; every field is
// operational metadata already recorded on the incident, not free text
// authored ad hoc at send time. Requires Legal/DPO/management approval
// before this template's wording is used for a real customer send - see
// docs/security/privacy-incident-notification-template.md.
export function renderNotificationTemplate(incident: PrivacyIncidentRecord, recipient: string): NotificationPreview {
  return {
    to: recipient,
    subject: `Privacy Incident Notification - Reference ${incident.id}`,
    body: [
      `Incident reference: ${incident.id}`,
      `Detected: ${incident.detectedAt}`,
      `Affected service: IST Health Tele-Triage platform`,
      `Nature of incident: under review - see incident record for classification`,
      `Known data impact: ${incident.affectedCustomerStatus ?? "under assessment"}`,
      `Containment status: ${incident.status}`,
      `Contact point: [approved contact point - not yet configured]`,
      "",
      "This notification template requires Legal, DPO, and management approval before use for any real customer communication."
    ].join("\n")
  };
}

// Steps 8-11: generate a preview, then deliver only to configured
// recipients. Real customer delivery requires ALL of: notification
// enabled, dry-run explicitly off, and a real customer recipient
// configured - any one of these being unmet keeps this in dry-run/no-op,
// never a silent real send.
export async function generateAndDeliverNotification(
  incidentId: string,
  args: { targetAudience: "internal_test" | "customer" }
): Promise<{ preview: NotificationPreview; delivered: boolean; dryRun: boolean; recipients: string[] }> {
  const incident = await getPrivacyIncident(incidentId);
  if (!incident) {
    throw new Error(`No privacy incident found with id ${incidentId}`);
  }
  if (incident.notificationSentAt) {
    throw new DuplicateNotificationError(`Incident ${incidentId} already has a recorded notification send.`);
  }
  if (incident.status !== "approved_for_notification" && incident.status !== "notification_queued") {
    throw new InvalidTransitionError(
      `Cannot deliver a notification for an incident in status "${incident.status}" - approval is required first.`
    );
  }

  const recipients =
    args.targetAudience === "internal_test"
      ? getPrivacyNotificationInternalRecipients()
      : getPrivacyNotificationCustomerRecipients();

  if (recipients.length === 0) {
    throw new NotificationNotConfiguredError(
      `No ${args.targetAudience === "internal_test" ? "internal" : "authorized customer"} recipients are configured.`
    );
  }

  // Customer delivery is refused outright (not even a preview via this
  // path) unless the notification system is fully, explicitly configured
  // for live sends - internal_test is the only path that ever runs in
  // dry-run/preview mode. This is deliberately stricter than "dry-run
  // would be harmless anyway": it keeps a single, simple rule ("customer
  // audience requires full authorization, no exceptions") rather than a
  // conditional one that a future change could accidentally weaken.
  if (args.targetAudience === "customer" && (!isPrivacyNotificationEnabled() || isPrivacyNotificationDryRun())) {
    throw new NotificationNotConfiguredError(
      "Customer delivery requires PRIVACY_NOTIFICATION_ENABLED=true, PRIVACY_NOTIFICATION_DRY_RUN=false, and an authorized QR recipient - refusing to send without explicit, non-default configuration."
    );
  }

  const preview = renderNotificationTemplate(incident, recipients[0]);
  const dryRun = args.targetAudience === "internal_test" && (isPrivacyNotificationDryRun() || !isPrivacyNotificationEnabled());

  if (incident.status === "approved_for_notification") {
    await transition(incidentId, "notification_queued");
  }

  if (dryRun) {
    await updatePrivacyIncident(incidentId, { deliveryStatus: "dry-run" });
    return { preview, delivered: false, dryRun: true, recipients };
  }

  try {
    const adapter = getEmailAdapter();
    const result = await adapter.send({ to: recipients[0], subject: preview.subject, body: preview.body });
    if (!result.ok) {
      await updatePrivacyIncident(incidentId, { deliveryStatus: "failed" });
      await transition(incidentId, "delivery_failed");
      return { preview, delivered: false, dryRun: false, recipients };
    }
    await updatePrivacyIncident(incidentId, {
      deliveryStatus: "sent",
      notificationSentAt: new Date().toISOString()
    });
    await transition(incidentId, "notification_sent");
    return { preview, delivered: true, dryRun: false, recipients };
  } catch (error) {
    await updatePrivacyIncident(incidentId, { deliveryStatus: "failed" });
    await transition(incidentId, "delivery_failed");
    throw error;
  }
}

// Overdue check - a real notification-deadline miss is a durable, high-
// risk operational signal, not a silently-discarded requirement. Emits a
// distinct audit event per overdue incident (idempotent in effect - safe
// to call repeatedly, e.g. from a scheduled job; each call simply
// re-confirms the same real overdue state until it's resolved).
export async function checkOverdueNotifications(): Promise<PrivacyIncidentRecord[]> {
  const overdue = await listOverduePrivacyIncidents();
  for (const incident of overdue) {
    await recordWorkflowAuditEvent({
      userId: incident.assignedOwnerUserId ?? "system",
      activeRole: "unknown",
      organization: incident.organization ?? "",
      facility: "",
      department: "",
      action: "PRIVACY_NOTIFICATION_OVERDUE",
      module: "PrivacyIncidentWorkflow",
      resource: `PrivacyIncident:${incident.id}`,
      purpose: `Notification deadline ${incident.notificationDeadlineAt} has passed - status is still "${incident.status}"`,
      ipAddress: "",
      device: "",
      success: false,
      risk: "high"
    });
  }
  return overdue;
}
