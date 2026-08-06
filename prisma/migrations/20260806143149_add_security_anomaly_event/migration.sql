-- CreateTable
CREATE TABLE "security_anomaly_events" (
    "id" TEXT NOT NULL,
    "signal_type" TEXT NOT NULL,
    "scope_key" TEXT NOT NULL,
    "organization" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_anomaly_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "security_anomaly_events_signal_type_scope_key_timestamp_idx" ON "security_anomaly_events"("signal_type", "scope_key", "timestamp");

-- CreateIndex
CREATE INDEX "security_anomaly_events_organization_timestamp_idx" ON "security_anomaly_events"("organization", "timestamp");
