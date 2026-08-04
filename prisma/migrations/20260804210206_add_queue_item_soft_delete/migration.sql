-- AlterTable
ALTER TABLE "triage_queue_items" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "deleted_by" TEXT;

-- CreateIndex
CREATE INDEX "triage_queue_items_deleted_at_idx" ON "triage_queue_items"("deleted_at");
