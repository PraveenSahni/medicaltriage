-- CreateTable
CREATE TABLE "privacy_incidents" (
    "id" TEXT NOT NULL,
    "organization" TEXT,
    "detection_source" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "severity" TEXT NOT NULL DEFAULT 'unclassified',
    "status" TEXT NOT NULL DEFAULT 'detected',
    "assigned_owner_user_id" TEXT,
    "privacy_impact_status" TEXT,
    "affected_customer_status" TEXT,
    "notification_required" BOOLEAN,
    "decision_reason" TEXT,
    "decision_by_user_id" TEXT,
    "decision_at" TIMESTAMP(3),
    "approver_user_id" TEXT,
    "approval_at" TIMESTAMP(3),
    "notification_deadline_at" TIMESTAMP(3),
    "notification_sent_at" TIMESTAMP(3),
    "delivery_status" TEXT,
    "correlation_id" TEXT,
    "evidence_references" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "privacy_incidents_organization_status_idx" ON "privacy_incidents"("organization", "status");

-- CreateIndex
CREATE INDEX "privacy_incidents_status_notification_deadline_at_idx" ON "privacy_incidents"("status", "notification_deadline_at");

-- CreateIndex
CREATE INDEX "privacy_incidents_detection_source_detected_at_idx" ON "privacy_incidents"("detection_source", "detected_at");
