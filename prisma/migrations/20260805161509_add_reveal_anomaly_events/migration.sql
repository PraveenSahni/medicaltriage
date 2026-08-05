-- CreateTable
CREATE TABLE "reveal_anomaly_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reveal_anomaly_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reveal_anomaly_events_user_id_timestamp_idx" ON "reveal_anomaly_events"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "reveal_anomaly_events_organization_timestamp_idx" ON "reveal_anomaly_events"("organization", "timestamp");
