const privacyIncidentCreateMock = jest.fn();
const privacyIncidentFindUniqueMock = jest.fn();
const privacyIncidentUpdateMock = jest.fn();
const privacyIncidentFindManyMock = jest.fn();
const auditEventCreateMock = jest.fn();
const emailSendMock = jest.fn();

jest.mock("../src/db.js", () => ({
  prisma: {
    privacyIncident: {
      create: (...args: unknown[]) => privacyIncidentCreateMock(...args),
      findUnique: (...args: unknown[]) => privacyIncidentFindUniqueMock(...args),
      update: (...args: unknown[]) => privacyIncidentUpdateMock(...args),
      findMany: (...args: unknown[]) => privacyIncidentFindManyMock(...args)
    },
    auditEvent: {
      create: (...args: unknown[]) => auditEventCreateMock(...args)
    }
  }
}));

jest.mock("../src/services/communicationAdapters.js", () => ({
  getEmailAdapter: () => ({
    name: "mock",
    live: true,
    send: (...args: unknown[]) => emailSendMock(...args)
  })
}));

import {
  approveNotification,
  beginReview,
  classifyIncident,
  confirmIncident,
  createIncidentCandidate,
  DuplicateNotificationError,
  generateAndDeliverNotification,
  InvalidTransitionError,
  NotificationNotConfiguredError,
  recordNotificationDecision,
  SelfApprovalError
} from "../src/services/privacyIncidentWorkflow.js";

// One in-memory row store standing in for the real Postgres table, so
// these tests exercise the workflow's real state-machine and approval
// logic without needing a live database - a real integration test against
// Postgres is documented separately (see docs/security/
// privacy-incident-notification-procedure.md's validation section).
describe("Privacy incident notification workflow (IS.61)", () => {
  let rows: Map<string, any>;
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    rows = new Map();
    auditEventCreateMock.mockReset().mockResolvedValue({ id: "audit_1" });
    emailSendMock.mockReset().mockResolvedValue({ ok: true, provider: "mock", channel: "email", dryRun: false, message: "sent" });

    privacyIncidentCreateMock.mockReset().mockImplementation(async (args: any) => {
      const row = {
        id: `pi_${rows.size + 1}`,
        organization: args.data.organization ?? null,
        detectionSource: args.data.detectionSource,
        detectedAt: new Date(),
        severity: args.data.severity,
        status: args.data.status,
        assignedOwnerUserId: null,
        privacyImpactStatus: null,
        affectedCustomerStatus: null,
        notificationRequired: null,
        decisionReason: null,
        decisionByUserId: null,
        decisionAt: null,
        approverUserId: null,
        approvalAt: null,
        notificationDeadlineAt: null,
        notificationSentAt: null,
        deliveryStatus: null,
        correlationId: args.data.correlationId ?? null
      };
      rows.set(row.id, row);
      return row;
    });
    privacyIncidentFindUniqueMock.mockReset().mockImplementation(async (args: any) => rows.get(args.where.id) ?? null);
    privacyIncidentUpdateMock.mockReset().mockImplementation(async (args: any) => {
      const existing = rows.get(args.where.id);
      const updated = { ...existing, ...args.data };
      rows.set(args.where.id, updated);
      return updated;
    });
    privacyIncidentFindManyMock.mockReset().mockResolvedValue([]);

    process.env = { ...ORIGINAL_ENV };
  });

  it("creates an incident candidate from a detection signal without notifying anyone", async () => {
    const incident = await createIncidentCandidate({ organization: "IST Tech", detectionSource: "reveal_anomaly", severity: "high" });
    expect(incident.status).toBe("detected");
    expect(emailSendMock).not.toHaveBeenCalled();
  });

  it("walks the full valid path: review -> classify -> confirm -> decide -> approve -> dry-run deliver", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });

    const reviewed = await beginReview(incident.id, "usr_reviewer");
    expect(reviewed.status).toBe("under_review");

    const classified = await classifyIncident(incident.id, { severity: "high", privacyImpactStatus: "confirmed_breach" });
    expect(classified.status).toBe("privacy_assessment_required");

    const confirmed = await confirmIncident(incident.id, { affectedCustomerStatus: "affected" });
    expect(confirmed.status).toBe("confirmed_incident");

    const decided = await recordNotificationDecision(incident.id, {
      decisionByUserId: "usr_decision_maker",
      notificationRequired: true,
      reason: "Confirmed breach affecting customer data"
    });
    expect(decided.status).toBe("notification_approval_pending");

    const approved = await approveNotification(incident.id, { approverUserId: "usr_approver" });
    expect(approved.status).toBe("approved_for_notification");

    process.env.PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS = "ist-test@irisstar.tech";
    const delivery = await generateAndDeliverNotification(incident.id, { targetAudience: "internal_test" });
    expect(delivery.dryRun).toBe(true);
    expect(delivery.delivered).toBe(false);
    expect(emailSendMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid status transition (cannot approve before a decision is recorded)", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });
    await expect(approveNotification(incident.id, { approverUserId: "usr_x" })).rejects.toThrow(InvalidTransitionError);
  });

  it("enforces segregation of duties - the decision-maker cannot also approve", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });
    await beginReview(incident.id, "usr_reviewer");
    await classifyIncident(incident.id, { severity: "high", privacyImpactStatus: "confirmed_breach" });
    await confirmIncident(incident.id, { affectedCustomerStatus: "affected" });
    await recordNotificationDecision(incident.id, {
      decisionByUserId: "usr_same_person",
      notificationRequired: true,
      reason: "test"
    });
    await expect(approveNotification(incident.id, { approverUserId: "usr_same_person" })).rejects.toThrow(SelfApprovalError);
  });

  it("refuses delivery with no recipients configured", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });
    await beginReview(incident.id, "usr_reviewer");
    await classifyIncident(incident.id, { severity: "high", privacyImpactStatus: "confirmed_breach" });
    await confirmIncident(incident.id, { affectedCustomerStatus: "affected" });
    await recordNotificationDecision(incident.id, { decisionByUserId: "usr_a", notificationRequired: true, reason: "test" });
    await approveNotification(incident.id, { approverUserId: "usr_b" });

    delete process.env.PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS;
    await expect(generateAndDeliverNotification(incident.id, { targetAudience: "internal_test" })).rejects.toThrow(
      NotificationNotConfiguredError
    );
  });

  it("never allows real customer delivery without PRIVACY_NOTIFICATION_ENABLED and DRY_RUN=false", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });
    await beginReview(incident.id, "usr_reviewer");
    await classifyIncident(incident.id, { severity: "high", privacyImpactStatus: "confirmed_breach" });
    await confirmIncident(incident.id, { affectedCustomerStatus: "affected" });
    await recordNotificationDecision(incident.id, { decisionByUserId: "usr_a", notificationRequired: true, reason: "test" });
    await approveNotification(incident.id, { approverUserId: "usr_b" });

    process.env.PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS = "someone@qatarairways.com";
    // PRIVACY_NOTIFICATION_ENABLED unset, DRY_RUN defaults true - customer send must still be refused.
    await expect(generateAndDeliverNotification(incident.id, { targetAudience: "customer" })).rejects.toThrow(
      NotificationNotConfiguredError
    );
    expect(emailSendMock).not.toHaveBeenCalled();
  });

  it("prevents a duplicate notification send for an already-notified incident", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });
    await beginReview(incident.id, "usr_reviewer");
    await classifyIncident(incident.id, { severity: "high", privacyImpactStatus: "confirmed_breach" });
    await confirmIncident(incident.id, { affectedCustomerStatus: "affected" });
    await recordNotificationDecision(incident.id, { decisionByUserId: "usr_a", notificationRequired: true, reason: "test" });
    await approveNotification(incident.id, { approverUserId: "usr_b" });

    process.env.PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS = "ist-test@irisstar.tech";
    process.env.PRIVACY_NOTIFICATION_ENABLED = "true";
    process.env.PRIVACY_NOTIFICATION_DRY_RUN = "false";
    const first = await generateAndDeliverNotification(incident.id, { targetAudience: "internal_test" });
    expect(first.delivered).toBe(true);
    expect(emailSendMock).toHaveBeenCalledTimes(1);

    await expect(generateAndDeliverNotification(incident.id, { targetAudience: "internal_test" })).rejects.toThrow(
      DuplicateNotificationError
    );
  });

  it("records a delivery failure and transitions to delivery_failed, without throwing to the caller", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });
    await beginReview(incident.id, "usr_reviewer");
    await classifyIncident(incident.id, { severity: "high", privacyImpactStatus: "confirmed_breach" });
    await confirmIncident(incident.id, { affectedCustomerStatus: "affected" });
    await recordNotificationDecision(incident.id, { decisionByUserId: "usr_a", notificationRequired: true, reason: "test" });
    await approveNotification(incident.id, { approverUserId: "usr_b" });

    process.env.PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS = "ist-test@irisstar.tech";
    process.env.PRIVACY_NOTIFICATION_ENABLED = "true";
    process.env.PRIVACY_NOTIFICATION_DRY_RUN = "false";
    emailSendMock.mockResolvedValueOnce({ ok: false, provider: "mock", channel: "email", dryRun: false, message: "failed", error: "timeout" });

    const result = await generateAndDeliverNotification(incident.id, { targetAudience: "internal_test" });
    expect(result.delivered).toBe(false);
    const stored = rows.get(incident.id);
    expect(stored.status).toBe("delivery_failed");
    expect(stored.deliveryStatus).toBe("failed");
  });

  it("resolving 'no privacy impact' during classification skips notification entirely, without a decision step", async () => {
    const incident = await createIncidentCandidate({ detectionSource: "reveal_anomaly" });
    await beginReview(incident.id, "usr_reviewer");
    const classified = await classifyIncident(incident.id, { severity: "low", privacyImpactStatus: "no_impact" });
    expect(classified.status).toBe("notification_not_required");
  });

  it("does not persist revealed values or sensitive fields on the incident record (only operational metadata)", async () => {
    await createIncidentCandidate({
      detectionSource: "reveal_anomaly",
      evidenceReferences: { requesterUserId: "usr_1", count: 12, threshold: 10, windowSeconds: 300 }
    });
    const createArgs = privacyIncidentCreateMock.mock.calls[0][0];
    const serialized = JSON.stringify(createArgs);
    for (const forbidden of ["password", "otp", "secret", "token", "revealedValue", "ssn"]) {
      expect(serialized.toLowerCase()).not.toContain(forbidden.toLowerCase());
    }
  });
});
