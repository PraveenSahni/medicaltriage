-- AlterTable
ALTER TABLE "aviation_triage_encounters" ADD COLUMN     "source_queue_item_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "aviation_triage_encounters_source_queue_item_id_key" ON "aviation_triage_encounters"("source_queue_item_id");
