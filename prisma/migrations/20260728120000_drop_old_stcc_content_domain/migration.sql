-- DropForeignKey
ALTER TABLE "algorithm_care_advice" DROP CONSTRAINT "algorithm_care_advice_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "algorithm_care_advice" DROP CONSTRAINT "algorithm_care_advice_care_advice_id_fkey";

-- DropForeignKey
ALTER TABLE "algorithm_references" DROP CONSTRAINT "algorithm_references_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "algorithm_references" DROP CONSTRAINT "algorithm_references_reference_id_fkey";

-- DropForeignKey
ALTER TABLE "algorithm_supplementals" DROP CONSTRAINT "algorithm_supplementals_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "algorithm_supplementals" DROP CONSTRAINT "algorithm_supplementals_supplemental_id_fkey";

-- DropForeignKey
ALTER TABLE "algorithms" DROP CONSTRAINT "algorithms_release_id_fkey";

-- DropForeignKey
ALTER TABLE "aviation_triage_encounters" DROP CONSTRAINT "aviation_triage_encounters_protocol_used_id_fkey";

-- DropForeignKey
ALTER TABLE "clinical_audio_assets" DROP CONSTRAINT "clinical_audio_assets_initial_assessment_question_id_fkey";

-- DropForeignKey
ALTER TABLE "clinical_content_import_errors" DROP CONSTRAINT "clinical_content_import_errors_import_job_id_fkey";

-- DropForeignKey
ALTER TABLE "clinical_content_import_jobs" DROP CONSTRAINT "clinical_content_import_jobs_release_id_fkey";

-- DropForeignKey
ALTER TABLE "clinical_references" DROP CONSTRAINT "clinical_references_release_id_fkey";

-- DropForeignKey
ALTER TABLE "clinical_supplementals" DROP CONSTRAINT "clinical_supplementals_release_id_fkey";

-- DropForeignKey
ALTER TABLE "initial_assessment_questions" DROP CONSTRAINT "initial_assessment_questions_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "protocol_disposition_maps" DROP CONSTRAINT "protocol_disposition_maps_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "protocol_disposition_maps" DROP CONSTRAINT "protocol_disposition_maps_disposition_level_id_fkey";

-- DropForeignKey
ALTER TABLE "protocol_first_aid" DROP CONSTRAINT "protocol_first_aid_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "protocol_keyword_indexes" DROP CONSTRAINT "protocol_keyword_indexes_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "protocol_synonyms" DROP CONSTRAINT "protocol_synonyms_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "protocol_taxonomy" DROP CONSTRAINT "protocol_taxonomy_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "question_advice_bridge" DROP CONSTRAINT "question_advice_bridge_advice_id_fkey";

-- DropForeignKey
ALTER TABLE "question_advice_bridge" DROP CONSTRAINT "question_advice_bridge_question_id_fkey";

-- DropForeignKey
ALTER TABLE "triage_questions" DROP CONSTRAINT "triage_questions_algorithm_id_fkey";

-- DropForeignKey
ALTER TABLE "triage_questions" DROP CONSTRAINT "triage_questions_disposition_level_id_fkey";

-- DropForeignKey
ALTER TABLE "triage_queue_items" DROP CONSTRAINT "triage_queue_items_matched_protocol_id_fkey";

-- DropForeignKey
ALTER TABLE "voice_assessment_turns" DROP CONSTRAINT "voice_assessment_turns_audio_asset_id_fkey";

-- DropForeignKey
ALTER TABLE "voice_assessment_turns" DROP CONSTRAINT "voice_assessment_turns_question_id_fkey";

-- DropForeignKey
ALTER TABLE "voice_call_sessions" DROP CONSTRAINT "voice_call_sessions_current_question_id_fkey";

-- DropForeignKey
ALTER TABLE "voice_call_sessions" DROP CONSTRAINT "voice_call_sessions_protocol_id_fkey";

-- AlterTable
ALTER TABLE "aviation_triage_encounters" DROP COLUMN "protocol_used_id",
ADD COLUMN     "protocol_used_id" INTEGER;

-- AlterTable
ALTER TABLE "triage_queue_items" DROP COLUMN "matched_protocol_id",
ADD COLUMN     "matched_protocol_id" INTEGER;

-- AlterTable
ALTER TABLE "voice_call_sessions" DROP COLUMN "protocol_id",
ADD COLUMN     "protocol_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "acuity_ratings";

-- DropTable
DROP TABLE "algorithm_care_advice";

-- DropTable
DROP TABLE "algorithm_references";

-- DropTable
DROP TABLE "algorithm_supplementals";

-- DropTable
DROP TABLE "algorithms";

-- DropTable
DROP TABLE "care_advice";

-- DropTable
DROP TABLE "clinical_audio_assets";

-- DropTable
DROP TABLE "clinical_content_import_errors";

-- DropTable
DROP TABLE "clinical_content_import_jobs";

-- DropTable
DROP TABLE "clinical_references";

-- DropTable
DROP TABLE "clinical_supplementals";

-- DropTable
DROP TABLE "dispositions";

-- DropTable
DROP TABLE "initial_assessment_questions";

-- DropTable
DROP TABLE "localized_dispositions";

-- DropTable
DROP TABLE "protocol_disposition_maps";

-- DropTable
DROP TABLE "protocol_first_aid";

-- DropTable
DROP TABLE "protocol_keyword_indexes";

-- DropTable
DROP TABLE "protocol_releases";

-- DropTable
DROP TABLE "protocol_synonyms";

-- DropTable
DROP TABLE "protocol_taxonomy";

-- DropTable
DROP TABLE "question_advice_bridge";

-- DropTable
DROP TABLE "stcc_systems";

-- DropTable
DROP TABLE "stcc_types";

-- DropTable
DROP TABLE "triage_questions";

-- CreateIndex
CREATE INDEX "voice_call_sessions_protocol_id_release_version_idx" ON "voice_call_sessions"("protocol_id", "release_version");

-- AddForeignKey
ALTER TABLE "aviation_triage_encounters" ADD CONSTRAINT "aviation_triage_encounters_protocol_used_id_fkey" FOREIGN KEY ("protocol_used_id") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_queue_items" ADD CONSTRAINT "triage_queue_items_matched_protocol_id_fkey" FOREIGN KEY ("matched_protocol_id") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_call_sessions" ADD CONSTRAINT "voice_call_sessions_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "Mdb_Algorithm"("AlgorithmID") ON DELETE RESTRICT ON UPDATE CASCADE;
