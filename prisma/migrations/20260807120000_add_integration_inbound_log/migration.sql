CREATE TABLE "integration_inbound_logs" (
  "id" TEXT NOT NULL,
  "integration" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "integration_inbound_logs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "integration_inbound_logs_integration_received_at_idx" ON "integration_inbound_logs"("integration", "received_at");
