-- CreateIndex
CREATE INDEX "audit_events_organization_timestamp_idx" ON "audit_events"("organization", "timestamp");

-- CreateIndex
CREATE INDEX "audit_events_action_timestamp_idx" ON "audit_events"("action", "timestamp");

-- CreateIndex
CREATE INDEX "audit_events_risk_level_timestamp_idx" ON "audit_events"("risk_level", "timestamp");
