-- AlterTable
ALTER TABLE "aviation_triage_encounters" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "call_center_sessions" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "ccp_drafts" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "ccp_webhook_records" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "staff_members" ADD COLUMN     "organization_id" TEXT;

-- AlterTable
ALTER TABLE "voice_call_sessions" ADD COLUMN     "organization_id" TEXT;

-- CreateIndex
CREATE INDEX "aviation_triage_encounters_organization_id_created_at_idx" ON "aviation_triage_encounters"("organization_id", "created_at");

-- CreateIndex
CREATE INDEX "call_center_sessions_organization_id_idx" ON "call_center_sessions"("organization_id");

-- CreateIndex
CREATE INDEX "ccp_drafts_organization_id_idx" ON "ccp_drafts"("organization_id");

-- CreateIndex
CREATE INDEX "ccp_webhook_records_organization_id_idx" ON "ccp_webhook_records"("organization_id");

-- CreateIndex
CREATE INDEX "staff_members_organization_id_idx" ON "staff_members"("organization_id");

-- CreateIndex
CREATE INDEX "voice_call_sessions_organization_id_idx" ON "voice_call_sessions"("organization_id");
