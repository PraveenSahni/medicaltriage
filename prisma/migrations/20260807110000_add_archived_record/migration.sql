CREATE TABLE "archived_records" (
  "id" TEXT NOT NULL,
  "entity_name" TEXT NOT NULL,
  "record_id" TEXT NOT NULL,
  "policy_code" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "archived_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "archived_records_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "archived_records_entity_name_record_id_idx" ON "archived_records"("entity_name", "record_id");
