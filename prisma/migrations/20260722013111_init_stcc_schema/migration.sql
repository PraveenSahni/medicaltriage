-- CreateEnum
CREATE TYPE "TriageSeverity" AS ENUM ('EMERGENCY', 'URGENT', 'ROUTINE', 'SELF_CARE');

-- CreateEnum
CREATE TYPE "AcuityDispositionCode" AS ENUM ('SIDRA_PEDIATRIC_ED', 'HMC_EMERGENCY_DEPARTMENT', 'HMC_URGENT_REVIEW', 'IST_HIA_MIDFIELD_MEDICAL_CENTRE', 'IST_OLD_AIRPORT_MEDICAL_COMMISSION', 'PHCC_URGENT_CARE_OR_TELECONSULT', 'OUTSTATION_TELECONSULT_ESCALATION', 'SELF_CARE_WITH_CALLBACK_PRECAUTIONS');

-- CreateEnum
CREATE TYPE "BiologicalSex" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PatientGroup" AS ENUM ('ADULT', 'PEDIATRIC', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CareAdviceCategory" AS ENUM ('DISPOSITION', 'NOTE_TO_TRIAGER', 'GENERAL', 'CALL_BACK_IF');

-- CreateEnum
CREATE TYPE "DutyStatus" AS ENUM ('ACTIVE', 'ON_LEAVE', 'REST_PERIOD', 'SUSPENDED', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DependentRelationship" AS ENUM ('SPOUSE', 'SON', 'DAUGHTER', 'CHILD', 'PARENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceEligibilityStatus" AS ENUM ('ELIGIBLE', 'SUSPENDED', 'INELIGIBLE', 'PENDING_VERIFICATION', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "OverrideStatusFlag" AS ENUM ('AI_RECOMMENDATION_DIFFERED', 'NURSE_OVERRIDE_UP', 'NURSE_OVERRIDE_DOWN_BLOCKED', 'RULES_ENGINE_FINAL', 'REVIEW_REQUIRED');

-- CreateEnum
CREATE TYPE "ProtocolMode" AS ENUM ('OFFICE_HOURS', 'AFTER_HOURS', 'BOTH');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('INCOMING', 'IN_PROCESS', 'INFO_REQUIRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QueueClinicalStage" AS ENUM ('INTAKE', 'IDENTITY', 'VITALS', 'PROTOCOL', 'DISPOSITION', 'SBAR');

-- CreateEnum
CREATE TYPE "DirectoryStatus" AS ENUM ('ACTIVE', 'DISABLED', 'ON_LEAVE', 'REST_PERIOD', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ClinicalContentSourceType" AS ENUM ('SYNTHETIC_SAMPLE', 'LICENSED_STCC', 'LOCAL_QATAR_OVERRIDE');

-- CreateEnum
CREATE TYPE "ClinicalContentImportStatus" AS ENUM ('PENDING', 'VALIDATED', 'IMPORTED', 'FAILED');

-- CreateEnum
CREATE TYPE "RagShadowStatus" AS ENUM ('RECORDED', 'BLOCKED', 'REVIEWED', 'PROMOTED_TO_RULE_REVIEW');

-- CreateEnum
CREATE TYPE "ProtocolComparisonAgreement" AS ENUM ('FULL_MATCH', 'PARTIAL_MATCH', 'NO_MATCH', 'NO_DETERMINISTIC_CANDIDATE', 'NO_SHADOW_CANDIDATE');

-- CreateEnum
CREATE TYPE "LearningFeedbackAction" AS ENUM ('NO_CHANGE', 'ADD_SYNONYM', 'ADJUST_KEYWORD_WEIGHT', 'PROMPT_REVIEW', 'CONTENT_REVIEW', 'SAFETY_REVIEW');

-- CreateEnum
CREATE TYPE "ModelEvaluationStatus" AS ENUM ('PLANNED', 'RUNNING', 'PASSED', 'FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "SafetyBlockedOutputReason" AS ENUM ('UNSAFE_DOWNGRADE', 'INVENTED_QUESTION', 'INVENTED_CARE_ADVICE', 'OUT_OF_BOUND_SOURCE', 'PRIVACY_BOUNDARY', 'OTHER');

-- CreateEnum
CREATE TYPE "InitialAssessmentResponseType" AS ENUM ('OPEN_TEXT', 'YES_NO', 'LOCATION', 'DURATION', 'PAIN_SCALE', 'TEMPERATURE');

-- CreateEnum
CREATE TYPE "VoiceSessionStatus" AS ENUM ('CREATED', 'ACTIVE', 'AWAITING_NURSE_VALIDATION', 'NURSE_TAKEOVER', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoiceTurnStatus" AS ENUM ('READY', 'NEEDS_CLARIFICATION', 'AWAITING_NURSE_VALIDATION', 'VALIDATED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VoiceAnswerClassification" AS ENUM ('YES', 'NO', 'OPEN_TEXT', 'UNCERTAIN', 'INTERRUPTED', 'EMERGENCY_SIGNAL');

-- CreateEnum
CREATE TYPE "VoiceValidationStatus" AS ENUM ('PENDING', 'VALIDATED', 'CORRECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClinicalAudioAssetStatus" AS ENUM ('DRAFT', 'APPROVED', 'RETIRED');

-- CreateTable
CREATE TABLE "protocol_releases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "source_type" "ClinicalContentSourceType" NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'QA',
    "mode" "ProtocolMode" NOT NULL DEFAULT 'BOTH',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "imported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algorithms" (
    "id" TEXT NOT NULL,
    "release_id" TEXT,
    "external_protocol_id" TEXT,
    "mode" "ProtocolMode" NOT NULL DEFAULT 'BOTH',
    "title_en" TEXT NOT NULL,
    "title_ar" TEXT,
    "clinical_definition_en" TEXT,
    "clinical_definition_ar" TEXT,
    "background_info_en" TEXT,
    "background_info_ar" TEXT,
    "gender_restriction" "BiologicalSex",
    "patient_group" "PatientGroup" NOT NULL DEFAULT 'UNKNOWN',
    "acuity" INTEGER,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "guideline_redirects" JSONB,
    "pain_severity_table" JSONB,
    "background_detail" JSONB,
    "author_en" TEXT,
    "expert_reviewer_en" TEXT,
    "last_revised_at" TIMESTAMP(3),
    "last_reviewed_at" TIMESTAMP(3),
    "version_year" INTEGER,
    "content_set" TEXT,
    "provenance" JSONB,
    "stcc_version" TEXT,
    "source_record_hash" TEXT,
    "source_record_checksum" TEXT,
    "source_effective_from" TIMESTAMP(3),
    "source_effective_to" TIMESTAMP(3),
    "annual_reconciliation_status" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "algorithms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "initial_assessment_questions" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT NOT NULL,
    "external_question_id" TEXT,
    "sequence" INTEGER NOT NULL,
    "response_type" "InitialAssessmentResponseType" NOT NULL,
    "prompt_text_en" TEXT NOT NULL,
    "clarification_prompt_en" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "emergency_keywords" JSONB,
    "source_record_hash" TEXT,
    "source_record_checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "initial_assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_audio_assets" (
    "id" TEXT NOT NULL,
    "initial_assessment_question_id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "release_version" TEXT NOT NULL,
    "voice_name" TEXT NOT NULL,
    "storage_uri" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "status" "ClinicalAudioAssetStatus" NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_audio_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triage_questions" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT NOT NULL,
    "external_question_id" TEXT,
    "acuity_order" INTEGER NOT NULL,
    "severity_grade" "TriageSeverity" NOT NULL,
    "question_text_en" TEXT NOT NULL,
    "question_text_ar" TEXT,
    "acuity_disposition_code" "AcuityDispositionCode" NOT NULL,
    "rationale_en" TEXT,
    "red_flag" BOOLEAN NOT NULL DEFAULT false,
    "branching" JSONB,
    "telemedicine_eligible" BOOLEAN,
    "telemedicine_notes_en" TEXT,
    "disposition_level_id" TEXT,
    "question_order" INTEGER,
    "source_record_hash" TEXT,
    "source_record_checksum" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triage_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "care_advice" (
    "id" TEXT NOT NULL,
    "external_care_advice_id" TEXT,
    "advice_title_en" TEXT NOT NULL,
    "advice_title_ar" TEXT,
    "instruction_text_en" TEXT NOT NULL,
    "instruction_text_ar" TEXT,
    "content_format" TEXT NOT NULL DEFAULT 'plain_text',
    "sanitized_html_en" TEXT,
    "sanitized_html_ar" TEXT,
    "source_record_hash" TEXT,
    "source_record_checksum" TEXT,
    "disposition_code" "AcuityDispositionCode",
    "warning_signs" JSONB,
    "patient_sendable" BOOLEAN NOT NULL DEFAULT false,
    "advice_category" "CareAdviceCategory",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "care_advice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algorithm_care_advice" (
    "algorithm_id" TEXT NOT NULL,
    "care_advice_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "algorithm_care_advice_pkey" PRIMARY KEY ("algorithm_id","care_advice_id")
);

-- CreateTable
CREATE TABLE "question_advice_bridge" (
    "question_id" TEXT NOT NULL,
    "advice_id" TEXT NOT NULL,
    "trigger_answer" TEXT NOT NULL DEFAULT 'YES',

    CONSTRAINT "question_advice_bridge_pkey" PRIMARY KEY ("question_id","advice_id","trigger_answer")
);

-- CreateTable
CREATE TABLE "protocol_keyword_indexes" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "normalized_phrase" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "weight" INTEGER NOT NULL DEFAULT 50,
    "source" TEXT NOT NULL DEFAULT 'release',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_keyword_indexes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_synonyms" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT,
    "canonical_term" TEXT NOT NULL,
    "synonym" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "region" TEXT NOT NULL DEFAULT 'QA',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_synonyms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_disposition_maps" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT,
    "severity" "TriageSeverity" NOT NULL,
    "disposition_code" "AcuityDispositionCode" NOT NULL,
    "age_min" INTEGER,
    "age_max" INTEGER,
    "aviation_context" JSONB,
    "route_label_en" TEXT NOT NULL,
    "route_label_ar" TEXT,
    "route_rationale_en" TEXT NOT NULL,
    "route_rationale_ar" TEXT,
    "telemedicine_heading_en" TEXT,
    "telemedicine_heading_ar" TEXT,
    "source_of_care_en" TEXT,
    "source_of_care_ar" TEXT,
    "disposition_level_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_disposition_maps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "localized_dispositions" (
    "id" TEXT NOT NULL,
    "code" "AcuityDispositionCode" NOT NULL,
    "destination_name_en" TEXT NOT NULL,
    "destination_name_ar" TEXT,
    "routing_notes_en" TEXT NOT NULL,
    "routing_notes_ar" TEXT,
    "region" TEXT NOT NULL DEFAULT 'QA',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "localized_dispositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositions" (
    "id" TEXT NOT NULL,
    "level_id" INTEGER NOT NULL,
    "heading_en" TEXT NOT NULL,
    "heading_telemedicine_en" TEXT,
    "video_eligible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_content_import_jobs" (
    "id" TEXT NOT NULL,
    "release_id" TEXT,
    "source_uri" TEXT NOT NULL,
    "source_checksum" TEXT,
    "status" "ClinicalContentImportStatus" NOT NULL DEFAULT 'PENDING',
    "importer_version" TEXT NOT NULL DEFAULT 'phase1-importer',
    "rows_read" INTEGER NOT NULL DEFAULT 0,
    "rows_inserted" INTEGER NOT NULL DEFAULT 0,
    "rows_skipped" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "clinical_content_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_content_import_errors" (
    "id" TEXT NOT NULL,
    "import_job_id" TEXT NOT NULL,
    "source_record_id" TEXT,
    "table_name" TEXT,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'error',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_content_import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_references" (
    "id" TEXT NOT NULL,
    "release_id" TEXT,
    "external_reference_id" TEXT,
    "title" TEXT NOT NULL,
    "source_name" TEXT,
    "citation_text" TEXT,
    "url" TEXT,
    "reference_type" TEXT,
    "source_record_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algorithm_references" (
    "algorithm_id" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "section_label" TEXT,

    CONSTRAINT "algorithm_references_pkey" PRIMARY KEY ("algorithm_id","reference_id")
);

-- CreateTable
CREATE TABLE "clinical_supplementals" (
    "id" TEXT NOT NULL,
    "release_id" TEXT,
    "external_supplemental_id" TEXT,
    "title_en" TEXT NOT NULL,
    "title_ar" TEXT,
    "supplemental_type" TEXT NOT NULL,
    "plain_text_en" TEXT,
    "plain_text_ar" TEXT,
    "sanitized_html_en" TEXT,
    "sanitized_html_ar" TEXT,
    "source_record_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_supplementals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algorithm_supplementals" (
    "algorithm_id" TEXT NOT NULL,
    "supplemental_id" TEXT NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "section_label" TEXT,

    CONSTRAINT "algorithm_supplementals_pkey" PRIMARY KEY ("algorithm_id","supplemental_id")
);

-- CreateTable
CREATE TABLE "protocol_taxonomy" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'STCC',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_first_aid" (
    "id" TEXT NOT NULL,
    "algorithm_id" TEXT NOT NULL,
    "title_en" TEXT,
    "title_ar" TEXT,
    "instruction_text_en" TEXT NOT NULL,
    "instruction_text_ar" TEXT,
    "sanitized_html_en" TEXT,
    "sanitized_html_ar" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "source_record_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_first_aid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "ist_staff_id" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "duty_status" "DutyStatus" NOT NULL DEFAULT 'ACTIVE',
    "insurance_provider" TEXT,
    "insurance_eligibility_status" "InsuranceEligibilityStatus" NOT NULL DEFAULT 'UNKNOWN',
    "insurance_last_checked" TIMESTAMP(3),
    "date_of_birth" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dependents" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "relationship" "DependentRelationship" NOT NULL,
    "age" INTEGER NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "biological_sex" "BiologicalSex" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dependents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aviation_triage_encounters" (
    "id" TEXT NOT NULL,
    "staff_member_id" TEXT NOT NULL,
    "dependent_id" TEXT,
    "protocol_used_id" TEXT,
    "initial_acuity_score" INTEGER NOT NULL,
    "final_disposition_code" "AcuityDispositionCode" NOT NULL,
    "audio_recording_url" TEXT,
    "transcript_text" TEXT,
    "transcript_language" TEXT,
    "custom_aviation_tags" JSONB,
    "clipboard_payload" JSONB,
    "nurse_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aviation_triage_encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_audit_deviation_logs" (
    "id" TEXT NOT NULL,
    "encounter_id" TEXT NOT NULL,
    "original_ai_recommendation" TEXT NOT NULL,
    "nurse_override_rationale" TEXT,
    "rules_engine_severity" "TriageSeverity" NOT NULL,
    "override_status_flag" "OverrideStatusFlag" NOT NULL,
    "is_critical_floor_breach" BOOLEAN NOT NULL DEFAULT false,
    "explainability_trace" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_audit_deviation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "moph_license_number" TEXT,
    "country" TEXT NOT NULL DEFAULT 'QA',
    "data_residency_region" TEXT NOT NULL DEFAULT 'gcp-me-central1',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triage_queue_items" (
    "id" TEXT NOT NULL,
    "ist_staff_id" TEXT NOT NULL,
    "staff_member_id" TEXT,
    "dependent_id" TEXT,
    "organization_id" TEXT,
    "target_organization_id" TEXT,
    "status" "QueueStatus" NOT NULL DEFAULT 'INCOMING',
    "current_stage" "QueueClinicalStage" NOT NULL DEFAULT 'INTAKE',
    "priority_score" INTEGER NOT NULL DEFAULT 0,
    "patient_type" TEXT NOT NULL DEFAULT 'Staff',
    "channel" TEXT NOT NULL DEFAULT 'Phone',
    "station_code" TEXT,
    "outstation_code" TEXT,
    "department" TEXT,
    "job_title" TEXT,
    "summary" TEXT,
    "vitals" JSONB,
    "matched_protocol_id" TEXT,
    "calculated_severity" "TriageSeverity",
    "disposition_code" "AcuityDispositionCode",
    "destination_name" TEXT,
    "identity_validated" BOOLEAN NOT NULL DEFAULT false,
    "safety_floor_active" BOOLEAN NOT NULL DEFAULT false,
    "clinical_approval" JSONB,
    "sbar_copied" BOOLEAN NOT NULL DEFAULT false,
    "assigned_nurse_id" TEXT,
    "claimed_at" TIMESTAMP(3),
    "sla_deadline" TIMESTAMP(3) NOT NULL,
    "locked_by" TEXT,
    "lock_expires_at" TIMESTAMP(3),
    "custom_aviation_tags" JSONB,
    "queue_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triage_queue_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "queue_transition_logs" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "actor_organization_id" TEXT,
    "actor_role" TEXT NOT NULL,
    "target_organization_id" TEXT,
    "event_type" TEXT NOT NULL DEFAULT 'QUEUE_TRANSITION',
    "from_status" "QueueStatus" NOT NULL,
    "to_status" "QueueStatus" NOT NULL,
    "from_stage" "QueueClinicalStage" NOT NULL,
    "to_stage" "QueueClinicalStage" NOT NULL,
    "reason" TEXT,
    "audit_signature" TEXT NOT NULL,
    "trace_payload" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_transition_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_center_sessions" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT,
    "provider" TEXT NOT NULL,
    "external_call_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ani_masked" TEXT,
    "ani_hash" TEXT,
    "dnis" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "queue_name" TEXT,
    "agent_id" TEXT,
    "recording_governance" JSONB,
    "requires_identity_resolution" BOOLEAN NOT NULL DEFAULT false,
    "started_at" TIMESTAMP(3),
    "connected_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "call_center_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_call_sessions" (
    "id" TEXT NOT NULL,
    "call_center_session_id" TEXT,
    "queue_item_id" TEXT,
    "protocol_id" TEXT NOT NULL,
    "release_version" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "VoiceSessionStatus" NOT NULL DEFAULT 'CREATED',
    "current_question_id" TEXT,
    "clarification_attempts" INTEGER NOT NULL DEFAULT 0,
    "max_clarification_attempts" INTEGER NOT NULL DEFAULT 1,
    "created_by_user_id" TEXT NOT NULL,
    "recording_notice_played" BOOLEAN NOT NULL DEFAULT false,
    "recording_authorization_status" TEXT NOT NULL,
    "raw_recording_rag_eligible" BOOLEAN NOT NULL DEFAULT false,
    "recording_storage_region" TEXT NOT NULL DEFAULT 'me-central1',
    "takeover_reason" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_call_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_assessment_turns" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "audio_asset_id" TEXT,
    "sequence" INTEGER NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "prompt_text_snapshot" TEXT NOT NULL,
    "transcript_text" TEXT,
    "speech_started_at_ms" INTEGER,
    "speech_ended_at_ms" INTEGER,
    "stt_confidence" DOUBLE PRECISION,
    "answer_classification" "VoiceAnswerClassification",
    "structured_answer" JSONB,
    "interpreter_evidence" JSONB,
    "interpreter_provider" TEXT,
    "interpreter_model" TEXT,
    "interpreter_version" TEXT,
    "status" "VoiceTurnStatus" NOT NULL DEFAULT 'READY',
    "validation_status" "VoiceValidationStatus" NOT NULL DEFAULT 'PENDING',
    "nurse_corrected_answer" JSONB,
    "validation_comment" TEXT,
    "validated_by" TEXT,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voice_assessment_turns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "call_center_events" (
    "id" TEXT NOT NULL,
    "call_center_session_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "external_call_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "process_status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "safe_payload" JSONB NOT NULL,
    "audit_signature" TEXT NOT NULL,
    "failure_code" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "call_center_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_retrieval_events" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT,
    "source_type" "ClinicalContentSourceType" NOT NULL,
    "source_release_version" TEXT NOT NULL,
    "query_text" TEXT NOT NULL,
    "normalized_reason" TEXT,
    "extracted_keywords" JSONB,
    "retrieved_source_ids" JSONB NOT NULL,
    "retrieved_snippet_hashes" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "boundary_label" TEXT NOT NULL DEFAULT 'APPROVED_CONTENT_ONLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rag_retrieval_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "llm_shadow_suggestions" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT,
    "retrieval_event_id" TEXT,
    "model_name" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "corpus_version" TEXT NOT NULL,
    "extracted_reason" JSONB,
    "suggested_keywords" JSONB,
    "suggested_protocol_candidates" JSONB NOT NULL,
    "rationale_summary" TEXT,
    "cannot_decide_disposition" BOOLEAN NOT NULL DEFAULT true,
    "requires_nurse_review" BOOLEAN NOT NULL DEFAULT true,
    "status" "RagShadowStatus" NOT NULL DEFAULT 'RECORDED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "llm_shadow_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nurse_selection_events" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT,
    "selected_protocol_id" TEXT,
    "selected_disposition_code" "AcuityDispositionCode",
    "selected_care_advice_ids" JSONB,
    "selected_by_user_id" TEXT NOT NULL,
    "selected_by_role" TEXT NOT NULL,
    "selection_reason" TEXT,
    "source_step" TEXT NOT NULL DEFAULT 'QUESTIONS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nurse_selection_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_comparison_events" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT,
    "shadow_suggestion_id" TEXT,
    "deterministic_primary_protocol_id" TEXT,
    "shadow_primary_protocol_id" TEXT,
    "nurse_selected_protocol_id" TEXT,
    "agreement" "ProtocolComparisonAgreement" NOT NULL DEFAULT 'NO_SHADOW_CANDIDATE',
    "reason_code" TEXT,
    "comparison_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_comparison_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_feedback_events" (
    "id" TEXT NOT NULL,
    "comparison_event_id" TEXT,
    "model_evaluation_run_id" TEXT,
    "action" "LearningFeedbackAction" NOT NULL,
    "target_entity_type" TEXT,
    "target_entity_id" TEXT,
    "rationale" TEXT,
    "requires_clinical_review" BOOLEAN NOT NULL DEFAULT true,
    "created_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_feedback_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "model_evaluation_runs" (
    "id" TEXT NOT NULL,
    "run_name" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "prompt_version" TEXT NOT NULL,
    "corpus_version" TEXT NOT NULL,
    "dataset_version" TEXT NOT NULL,
    "status" "ModelEvaluationStatus" NOT NULL DEFAULT 'PLANNED',
    "metrics" JSONB,
    "failure_summary" TEXT,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "model_evaluation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_blocked_outputs" (
    "id" TEXT NOT NULL,
    "queue_item_id" TEXT,
    "shadow_suggestion_id" TEXT,
    "reason" "SafetyBlockedOutputReason" NOT NULL,
    "blocked_payload" JSONB NOT NULL,
    "deterministic_floor" "TriageSeverity",
    "policy_version" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "safety_blocked_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_users" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT,
    "hrms_id" TEXT,
    "full_name" TEXT NOT NULL,
    "email_ciphertext" TEXT,
    "email_blind_index" TEXT,
    "mobile_ciphertext" TEXT,
    "mobile_blind_index" TEXT,
    "organization" TEXT NOT NULL DEFAULT 'IST Tech',
    "organization_id" TEXT,
    "facility" TEXT,
    "department" TEXT,
    "clinical_specialty" TEXT,
    "job_title" TEXT,
    "professional_category" TEXT,
    "manager_user_id" TEXT,
    "licence_number_ciphertext" TEXT,
    "licence_authority" TEXT,
    "licence_expiry" TIMESTAMP(3),
    "country" TEXT NOT NULL DEFAULT 'QA',
    "preferred_language" TEXT NOT NULL DEFAULT 'en',
    "time_zone" TEXT NOT NULL DEFAULT 'Asia/Qatar',
    "authentication_method" TEXT NOT NULL DEFAULT 'local',
    "mfa_status" TEXT NOT NULL DEFAULT 'pending',
    "account_status" TEXT NOT NULL DEFAULT 'active',
    "directory_status" "DirectoryStatus" NOT NULL DEFAULT 'ACTIVE',
    "password_hash" TEXT,
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "requires_approval" BOOLEAN NOT NULL DEFAULT true,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "created_by" TEXT,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responsibilities" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "business_function" TEXT NOT NULL,
    "risk_classification" TEXT NOT NULL,
    "clinical_or_administrative" TEXT NOT NULL,
    "allowed_actions" JSONB NOT NULL,
    "data_scope" JSONB,
    "clinical_scope" JSONB,
    "integration_scope" JSONB,
    "prerequisite_responsibilities" JSONB,
    "conflicting_responsibilities" JSONB,
    "approval_requirement" TEXT NOT NULL DEFAULT 'approval_required',
    "effective_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responsibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,
    "risk" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_profiles" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organization_scope" JSONB,
    "facility_scope" JSONB,
    "department_scope" JSONB,
    "specialty_scope" JSONB,
    "queue_scope" JSONB,
    "shift_restrictions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_code" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_responsibilities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "responsibility_code" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_responsibilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_access_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_profile_code" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_access_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_scopes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope_type" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_scopes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol_set" JSONB,
    "specialties" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_scopes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "integrations" JSONB NOT NULL,
    "allowed_actions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_queue_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "queue_code" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_queue_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_requests" (
    "id" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "target_user_id" TEXT NOT NULL,
    "requested_access" JSONB NOT NULL,
    "justification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "risk" TEXT NOT NULL DEFAULT 'medium',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_approvals" (
    "id" TEXT NOT NULL,
    "access_request_id" TEXT NOT NULL,
    "approver_user_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segregation_of_duty_rules" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "conflict_type" TEXT NOT NULL,
    "left_scope" JSONB NOT NULL,
    "right_scope" JSONB NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'high',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segregation_of_duty_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_conflicts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rule_code" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "access_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_profile" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3) NOT NULL,
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "temporary_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "break_glass_access" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "purpose" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "break_glass_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authentication_providers" (
    "id" TEXT NOT NULL,
    "provider_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "tenant_id_ciphertext" TEXT,
    "issuer_url" TEXT,
    "authorization_endpoint" TEXT,
    "token_endpoint" TEXT,
    "user_info_endpoint" TEXT,
    "client_id_ciphertext" TEXT,
    "client_secret_ref" TEXT,
    "redirect_uri" TEXT,
    "logout_uri" TEXT,
    "saml_metadata_ciphertext" TEXT,
    "signing_certificate_ref" TEXT,
    "certificate_expiry" TIMESTAMP(3),
    "allowed_domains" JSONB,
    "attribute_mappings" JSONB,
    "group_mappings" JSONB,
    "jit_provisioning" BOOLEAN NOT NULL DEFAULT false,
    "local_login_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "authentication_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_hash" TEXT NOT NULL,
    "session_payload" JSONB NOT NULL,
    "auth_method" TEXT NOT NULL,
    "mfa_verified" BOOLEAN NOT NULL DEFAULT false,
    "ip_address" TEXT,
    "device" TEXT,
    "user_agent" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ccp_drafts" (
    "id" TEXT NOT NULL,
    "ist_staff_id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "linked_goal_id" TEXT,
    "channel" TEXT NOT NULL,
    "recipient_to" TEXT NOT NULL,
    "original_to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "drafted_by_role" TEXT NOT NULL,
    "approval" JSONB NOT NULL,
    "send_result" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ccp_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ccp_webhook_records" (
    "id" TEXT NOT NULL,
    "inbound_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "channel" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attachments" JSONB NOT NULL,
    "raw_payload" JSONB NOT NULL,
    "queue_note" TEXT NOT NULL,
    "persisted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ccp_webhook_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_classifications" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "risk" TEXT NOT NULL,
    "default_masking_policy" TEXT,
    "default_reveal_policy" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitive_data_fields" (
    "id" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "data_classification" TEXT NOT NULL,
    "encryption_policy_code" TEXT,
    "masking_policy_code" TEXT,
    "reveal_policy_code" TEXT,
    "blind_index_required" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensitive_data_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encryption_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data_classification" TEXT NOT NULL,
    "covered_entities" JSONB NOT NULL,
    "covered_fields" JSONB NOT NULL,
    "approved_algorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "minimum_key_size" INTEGER NOT NULL DEFAULT 256,
    "key_provider" TEXT NOT NULL,
    "key_alias" TEXT NOT NULL,
    "key_rotation_days" INTEGER NOT NULL DEFAULT 90,
    "data_residency" TEXT NOT NULL,
    "approval_requirement" TEXT NOT NULL DEFAULT 'dual_approval',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encryption_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encryption_policy_versions" (
    "id" TEXT NOT NULL,
    "policy_code" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "policy_snapshot" JSONB NOT NULL,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "effective_from" TIMESTAMP(3),
    "retired_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encryption_policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "masking_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "default_mode" TEXT NOT NULL DEFAULT 'masked',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "masking_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reveal_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data_classification" TEXT NOT NULL,
    "requires_mfa" BOOLEAN NOT NULL DEFAULT true,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "allowed_purposes" JSONB NOT NULL,
    "reveal_duration_seconds" INTEGER NOT NULL DEFAULT 60,
    "remask_on_blur" BOOLEAN NOT NULL DEFAULT true,
    "disable_copy" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reveal_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reveal_requests" (
    "id" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "reveal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reveal_approvals" (
    "id" TEXT NOT NULL,
    "reveal_request_id" TEXT NOT NULL,
    "approver_user_id" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "comments" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reveal_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reveal_events" (
    "id" TEXT NOT NULL,
    "reveal_request_id" TEXT,
    "user_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "ip_address" TEXT,
    "device" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reveal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cryptographic_key_references" (
    "id" TEXT NOT NULL,
    "key_alias" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "key_class" TEXT NOT NULL,
    "current_version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cryptographic_key_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_rotation_records" (
    "id" TEXT NOT NULL,
    "key_alias" TEXT NOT NULL,
    "from_version" TEXT NOT NULL,
    "to_version" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approved_by" TEXT,
    "rotated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_rotation_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "privacy_requests" (
    "id" TEXT NOT NULL,
    "requester_ref" TEXT NOT NULL,
    "request_type" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "due_at" TIMESTAMP(3),
    "assigned_to" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "privacy_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retention_policies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "retention_period" JSONB NOT NULL,
    "legal_basis" TEXT,
    "deletion_mode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retention_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_holds" (
    "id" TEXT NOT NULL,
    "hold_code" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_by" TEXT,
    "released_by" TEXT,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensitive_export_requests" (
    "id" TEXT NOT NULL,
    "requester_user_id" TEXT NOT NULL,
    "export_type" TEXT NOT NULL,
    "data_scope" JSONB NOT NULL,
    "justification" TEXT NOT NULL,
    "approval_status" TEXT NOT NULL DEFAULT 'pending',
    "encryption_required" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensitive_export_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" TEXT,
    "active_role" TEXT,
    "organization" TEXT,
    "facility" TEXT,
    "department" TEXT,
    "action" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "resource" TEXT,
    "record_reference" TEXT,
    "purpose" TEXT,
    "approval_reference" TEXT,
    "ip_address" TEXT,
    "device" TEXT,
    "session_hash" TEXT,
    "success" BOOLEAN NOT NULL,
    "risk_level" TEXT NOT NULL DEFAULT 'medium',
    "metadata" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "protocol_releases_region_active_idx" ON "protocol_releases"("region", "active");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_releases_source_type_version_key" ON "protocol_releases"("source_type", "version");

-- CreateIndex
CREATE UNIQUE INDEX "algorithms_external_protocol_id_key" ON "algorithms"("external_protocol_id");

-- CreateIndex
CREATE INDEX "algorithms_title_en_idx" ON "algorithms"("title_en");

-- CreateIndex
CREATE INDEX "algorithms_release_id_active_idx" ON "algorithms"("release_id", "active");

-- CreateIndex
CREATE INDEX "algorithms_mode_idx" ON "algorithms"("mode");

-- CreateIndex
CREATE INDEX "initial_assessment_questions_external_question_id_idx" ON "initial_assessment_questions"("external_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "initial_assessment_questions_algorithm_id_sequence_key" ON "initial_assessment_questions"("algorithm_id", "sequence");

-- CreateIndex
CREATE INDEX "clinical_audio_assets_status_language_idx" ON "clinical_audio_assets"("status", "language");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_audio_assets_initial_assessment_question_id_langua_key" ON "clinical_audio_assets"("initial_assessment_question_id", "language", "release_version", "checksum");

-- CreateIndex
CREATE INDEX "triage_questions_algorithm_id_acuity_order_idx" ON "triage_questions"("algorithm_id", "acuity_order");

-- CreateIndex
CREATE INDEX "triage_questions_algorithm_id_disposition_level_id_question_idx" ON "triage_questions"("algorithm_id", "disposition_level_id", "question_order");

-- CreateIndex
CREATE INDEX "triage_questions_external_question_id_idx" ON "triage_questions"("external_question_id");

-- CreateIndex
CREATE UNIQUE INDEX "care_advice_external_care_advice_id_key" ON "care_advice"("external_care_advice_id");

-- CreateIndex
CREATE INDEX "protocol_keyword_indexes_normalized_phrase_idx" ON "protocol_keyword_indexes"("normalized_phrase");

-- CreateIndex
CREATE INDEX "protocol_keyword_indexes_algorithm_id_weight_idx" ON "protocol_keyword_indexes"("algorithm_id", "weight");

-- CreateIndex
CREATE INDEX "protocol_synonyms_canonical_term_synonym_idx" ON "protocol_synonyms"("canonical_term", "synonym");

-- CreateIndex
CREATE INDEX "protocol_disposition_maps_severity_disposition_code_idx" ON "protocol_disposition_maps"("severity", "disposition_code");

-- CreateIndex
CREATE INDEX "protocol_disposition_maps_algorithm_id_active_idx" ON "protocol_disposition_maps"("algorithm_id", "active");

-- CreateIndex
CREATE UNIQUE INDEX "localized_dispositions_code_key" ON "localized_dispositions"("code");

-- CreateIndex
CREATE INDEX "localized_dispositions_region_active_idx" ON "localized_dispositions"("region", "active");

-- CreateIndex
CREATE UNIQUE INDEX "dispositions_level_id_key" ON "dispositions"("level_id");

-- CreateIndex
CREATE INDEX "clinical_content_import_jobs_status_started_at_idx" ON "clinical_content_import_jobs"("status", "started_at");

-- CreateIndex
CREATE INDEX "clinical_content_import_errors_import_job_id_idx" ON "clinical_content_import_errors"("import_job_id");

-- CreateIndex
CREATE INDEX "clinical_references_release_id_idx" ON "clinical_references"("release_id");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_references_release_id_external_reference_id_key" ON "clinical_references"("release_id", "external_reference_id");

-- CreateIndex
CREATE INDEX "clinical_supplementals_release_id_supplemental_type_idx" ON "clinical_supplementals"("release_id", "supplemental_type");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_supplementals_release_id_external_supplemental_id_key" ON "clinical_supplementals"("release_id", "external_supplemental_id");

-- CreateIndex
CREATE INDEX "protocol_taxonomy_category_value_idx" ON "protocol_taxonomy"("category", "value");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_taxonomy_algorithm_id_category_value_key" ON "protocol_taxonomy"("algorithm_id", "category", "value");

-- CreateIndex
CREATE INDEX "protocol_first_aid_algorithm_id_idx" ON "protocol_first_aid"("algorithm_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_members_ist_staff_id_key" ON "staff_members"("ist_staff_id");

-- CreateIndex
CREATE INDEX "staff_members_department_idx" ON "staff_members"("department");

-- CreateIndex
CREATE INDEX "dependents_staff_member_id_idx" ON "dependents"("staff_member_id");

-- CreateIndex
CREATE INDEX "aviation_triage_encounters_staff_member_id_created_at_idx" ON "aviation_triage_encounters"("staff_member_id", "created_at");

-- CreateIndex
CREATE INDEX "aviation_triage_encounters_final_disposition_code_idx" ON "aviation_triage_encounters"("final_disposition_code");

-- CreateIndex
CREATE UNIQUE INDEX "safety_audit_deviation_logs_encounter_id_key" ON "safety_audit_deviation_logs"("encounter_id");

-- CreateIndex
CREATE INDEX "safety_audit_deviation_logs_override_status_flag_created_at_idx" ON "safety_audit_deviation_logs"("override_status_flag", "created_at");

-- CreateIndex
CREATE INDEX "safety_audit_deviation_logs_is_critical_floor_breach_create_idx" ON "safety_audit_deviation_logs"("is_critical_floor_breach", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");

-- CreateIndex
CREATE INDEX "triage_queue_items_status_current_stage_idx" ON "triage_queue_items"("status", "current_stage");

-- CreateIndex
CREATE INDEX "triage_queue_items_priority_score_sla_deadline_idx" ON "triage_queue_items"("priority_score", "sla_deadline");

-- CreateIndex
CREATE INDEX "triage_queue_items_assigned_nurse_id_status_idx" ON "triage_queue_items"("assigned_nurse_id", "status");

-- CreateIndex
CREATE INDEX "triage_queue_items_locked_by_lock_expires_at_idx" ON "triage_queue_items"("locked_by", "lock_expires_at");

-- CreateIndex
CREATE INDEX "triage_queue_items_organization_id_status_idx" ON "triage_queue_items"("organization_id", "status");

-- CreateIndex
CREATE INDEX "triage_queue_items_target_organization_id_status_idx" ON "triage_queue_items"("target_organization_id", "status");

-- CreateIndex
CREATE INDEX "triage_queue_items_ist_staff_id_created_at_idx" ON "triage_queue_items"("ist_staff_id", "created_at");

-- CreateIndex
CREATE INDEX "queue_transition_logs_queue_item_id_timestamp_idx" ON "queue_transition_logs"("queue_item_id", "timestamp");

-- CreateIndex
CREATE INDEX "queue_transition_logs_actor_id_timestamp_idx" ON "queue_transition_logs"("actor_id", "timestamp");

-- CreateIndex
CREATE INDEX "queue_transition_logs_actor_organization_id_timestamp_idx" ON "queue_transition_logs"("actor_organization_id", "timestamp");

-- CreateIndex
CREATE INDEX "call_center_sessions_queue_item_id_status_idx" ON "call_center_sessions"("queue_item_id", "status");

-- CreateIndex
CREATE INDEX "call_center_sessions_agent_id_status_idx" ON "call_center_sessions"("agent_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "call_center_sessions_provider_external_call_id_key" ON "call_center_sessions"("provider", "external_call_id");

-- CreateIndex
CREATE INDEX "voice_call_sessions_queue_item_id_status_idx" ON "voice_call_sessions"("queue_item_id", "status");

-- CreateIndex
CREATE INDEX "voice_call_sessions_call_center_session_id_status_idx" ON "voice_call_sessions"("call_center_session_id", "status");

-- CreateIndex
CREATE INDEX "voice_call_sessions_protocol_id_release_version_idx" ON "voice_call_sessions"("protocol_id", "release_version");

-- CreateIndex
CREATE INDEX "voice_assessment_turns_session_id_validation_status_idx" ON "voice_assessment_turns"("session_id", "validation_status");

-- CreateIndex
CREATE INDEX "voice_assessment_turns_question_id_idx" ON "voice_assessment_turns"("question_id");

-- CreateIndex
CREATE UNIQUE INDEX "voice_assessment_turns_session_id_sequence_attempt_key" ON "voice_assessment_turns"("session_id", "sequence", "attempt");

-- CreateIndex
CREATE INDEX "call_center_events_call_center_session_id_occurred_at_idx" ON "call_center_events"("call_center_session_id", "occurred_at");

-- CreateIndex
CREATE INDEX "call_center_events_process_status_received_at_idx" ON "call_center_events"("process_status", "received_at");

-- CreateIndex
CREATE UNIQUE INDEX "call_center_events_provider_provider_event_id_key" ON "call_center_events"("provider", "provider_event_id");

-- CreateIndex
CREATE INDEX "rag_retrieval_events_queue_item_id_created_at_idx" ON "rag_retrieval_events"("queue_item_id", "created_at");

-- CreateIndex
CREATE INDEX "rag_retrieval_events_source_type_source_release_version_idx" ON "rag_retrieval_events"("source_type", "source_release_version");

-- CreateIndex
CREATE INDEX "llm_shadow_suggestions_queue_item_id_created_at_idx" ON "llm_shadow_suggestions"("queue_item_id", "created_at");

-- CreateIndex
CREATE INDEX "llm_shadow_suggestions_retrieval_event_id_idx" ON "llm_shadow_suggestions"("retrieval_event_id");

-- CreateIndex
CREATE INDEX "llm_shadow_suggestions_model_name_prompt_version_idx" ON "llm_shadow_suggestions"("model_name", "prompt_version");

-- CreateIndex
CREATE INDEX "nurse_selection_events_queue_item_id_created_at_idx" ON "nurse_selection_events"("queue_item_id", "created_at");

-- CreateIndex
CREATE INDEX "nurse_selection_events_selected_by_user_id_created_at_idx" ON "nurse_selection_events"("selected_by_user_id", "created_at");

-- CreateIndex
CREATE INDEX "protocol_comparison_events_queue_item_id_created_at_idx" ON "protocol_comparison_events"("queue_item_id", "created_at");

-- CreateIndex
CREATE INDEX "protocol_comparison_events_shadow_suggestion_id_idx" ON "protocol_comparison_events"("shadow_suggestion_id");

-- CreateIndex
CREATE INDEX "protocol_comparison_events_agreement_created_at_idx" ON "protocol_comparison_events"("agreement", "created_at");

-- CreateIndex
CREATE INDEX "learning_feedback_events_comparison_event_id_idx" ON "learning_feedback_events"("comparison_event_id");

-- CreateIndex
CREATE INDEX "learning_feedback_events_model_evaluation_run_id_idx" ON "learning_feedback_events"("model_evaluation_run_id");

-- CreateIndex
CREATE INDEX "learning_feedback_events_action_created_at_idx" ON "learning_feedback_events"("action", "created_at");

-- CreateIndex
CREATE INDEX "model_evaluation_runs_model_name_prompt_version_idx" ON "model_evaluation_runs"("model_name", "prompt_version");

-- CreateIndex
CREATE INDEX "model_evaluation_runs_status_created_at_idx" ON "model_evaluation_runs"("status", "created_at");

-- CreateIndex
CREATE INDEX "safety_blocked_outputs_queue_item_id_created_at_idx" ON "safety_blocked_outputs"("queue_item_id", "created_at");

-- CreateIndex
CREATE INDEX "safety_blocked_outputs_shadow_suggestion_id_idx" ON "safety_blocked_outputs"("shadow_suggestion_id");

-- CreateIndex
CREATE INDEX "safety_blocked_outputs_reason_created_at_idx" ON "safety_blocked_outputs"("reason", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "application_users_employee_id_key" ON "application_users"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_users_hrms_id_key" ON "application_users"("hrms_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_users_email_blind_index_key" ON "application_users"("email_blind_index");

-- CreateIndex
CREATE INDEX "application_users_organization_facility_department_idx" ON "application_users"("organization", "facility", "department");

-- CreateIndex
CREATE INDEX "application_users_organization_id_account_status_idx" ON "application_users"("organization_id", "account_status");

-- CreateIndex
CREATE INDEX "application_users_directory_status_idx" ON "application_users"("directory_status");

-- CreateIndex
CREATE INDEX "application_users_account_status_idx" ON "application_users"("account_status");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "responsibilities_code_key" ON "responsibilities"("code");

-- CreateIndex
CREATE INDEX "responsibilities_module_status_idx" ON "responsibilities"("module", "status");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE INDEX "permissions_module_action_idx" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "access_profiles_code_key" ON "access_profiles"("code");

-- CreateIndex
CREATE INDEX "user_roles_user_id_status_idx" ON "user_roles"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_code_effective_from_key" ON "user_roles"("user_id", "role_code", "effective_from");

-- CreateIndex
CREATE INDEX "user_responsibilities_user_id_status_idx" ON "user_responsibilities"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_responsibilities_user_id_responsibility_code_effective_key" ON "user_responsibilities"("user_id", "responsibility_code", "effective_from");

-- CreateIndex
CREATE INDEX "user_access_profiles_user_id_status_idx" ON "user_access_profiles"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_access_profiles_user_id_access_profile_code_effective__key" ON "user_access_profiles"("user_id", "access_profile_code", "effective_from");

-- CreateIndex
CREATE UNIQUE INDEX "access_scopes_code_key" ON "access_scopes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_scopes_code_key" ON "clinical_scopes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "integration_scopes_code_key" ON "integration_scopes"("code");

-- CreateIndex
CREATE INDEX "user_queue_assignments_user_id_queue_code_status_idx" ON "user_queue_assignments"("user_id", "queue_code", "status");

-- CreateIndex
CREATE INDEX "access_requests_status_created_at_idx" ON "access_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "access_approvals_access_request_id_idx" ON "access_approvals"("access_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "segregation_of_duty_rules_code_key" ON "segregation_of_duty_rules"("code");

-- CreateIndex
CREATE INDEX "access_conflicts_user_id_status_idx" ON "access_conflicts"("user_id", "status");

-- CreateIndex
CREATE INDEX "temporary_access_user_id_status_idx" ON "temporary_access"("user_id", "status");

-- CreateIndex
CREATE INDEX "break_glass_access_user_id_status_idx" ON "break_glass_access"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "authentication_providers_provider_key_key" ON "authentication_providers"("provider_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_hash_key" ON "user_sessions"("session_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_expires_at_idx" ON "user_sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "ccp_drafts_ist_staff_id_thread_id_idx" ON "ccp_drafts"("ist_staff_id", "thread_id");

-- CreateIndex
CREATE INDEX "ccp_drafts_status_created_at_idx" ON "ccp_drafts"("status", "created_at");

-- CreateIndex
CREATE INDEX "ccp_webhook_records_provider_persisted_at_idx" ON "ccp_webhook_records"("provider", "persisted_at");

-- CreateIndex
CREATE INDEX "ccp_webhook_records_sender_channel_idx" ON "ccp_webhook_records"("sender", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "data_classifications_code_key" ON "data_classifications"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sensitive_data_fields_entity_name_field_name_key" ON "sensitive_data_fields"("entity_name", "field_name");

-- CreateIndex
CREATE UNIQUE INDEX "encryption_policies_code_key" ON "encryption_policies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "encryption_policy_versions_policy_code_version_key" ON "encryption_policy_versions"("policy_code", "version");

-- CreateIndex
CREATE UNIQUE INDEX "masking_policies_code_key" ON "masking_policies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "reveal_policies_code_key" ON "reveal_policies"("code");

-- CreateIndex
CREATE INDEX "reveal_requests_requester_user_id_status_idx" ON "reveal_requests"("requester_user_id", "status");

-- CreateIndex
CREATE INDEX "reveal_approvals_reveal_request_id_idx" ON "reveal_approvals"("reveal_request_id");

-- CreateIndex
CREATE INDEX "reveal_events_user_id_occurred_at_idx" ON "reveal_events"("user_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "cryptographic_key_references_key_alias_key" ON "cryptographic_key_references"("key_alias");

-- CreateIndex
CREATE INDEX "key_rotation_records_key_alias_created_at_idx" ON "key_rotation_records"("key_alias", "created_at");

-- CreateIndex
CREATE INDEX "privacy_requests_status_due_at_idx" ON "privacy_requests"("status", "due_at");

-- CreateIndex
CREATE UNIQUE INDEX "retention_policies_code_key" ON "retention_policies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "legal_holds_hold_code_key" ON "legal_holds"("hold_code");

-- CreateIndex
CREATE INDEX "legal_holds_resource_type_resource_id_status_idx" ON "legal_holds"("resource_type", "resource_id", "status");

-- CreateIndex
CREATE INDEX "sensitive_export_requests_approval_status_created_at_idx" ON "sensitive_export_requests"("approval_status", "created_at");

-- CreateIndex
CREATE INDEX "audit_events_timestamp_idx" ON "audit_events"("timestamp");

-- CreateIndex
CREATE INDEX "audit_events_user_id_action_idx" ON "audit_events"("user_id", "action");

-- AddForeignKey
ALTER TABLE "algorithms" ADD CONSTRAINT "algorithms_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "protocol_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "initial_assessment_questions" ADD CONSTRAINT "initial_assessment_questions_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_audio_assets" ADD CONSTRAINT "clinical_audio_assets_initial_assessment_question_id_fkey" FOREIGN KEY ("initial_assessment_question_id") REFERENCES "initial_assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_questions" ADD CONSTRAINT "triage_questions_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_questions" ADD CONSTRAINT "triage_questions_disposition_level_id_fkey" FOREIGN KEY ("disposition_level_id") REFERENCES "dispositions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_care_advice" ADD CONSTRAINT "algorithm_care_advice_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_care_advice" ADD CONSTRAINT "algorithm_care_advice_care_advice_id_fkey" FOREIGN KEY ("care_advice_id") REFERENCES "care_advice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_advice_bridge" ADD CONSTRAINT "question_advice_bridge_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "triage_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_advice_bridge" ADD CONSTRAINT "question_advice_bridge_advice_id_fkey" FOREIGN KEY ("advice_id") REFERENCES "care_advice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_keyword_indexes" ADD CONSTRAINT "protocol_keyword_indexes_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_synonyms" ADD CONSTRAINT "protocol_synonyms_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_disposition_maps" ADD CONSTRAINT "protocol_disposition_maps_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_disposition_maps" ADD CONSTRAINT "protocol_disposition_maps_disposition_level_id_fkey" FOREIGN KEY ("disposition_level_id") REFERENCES "dispositions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_content_import_jobs" ADD CONSTRAINT "clinical_content_import_jobs_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "protocol_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_content_import_errors" ADD CONSTRAINT "clinical_content_import_errors_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "clinical_content_import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_references" ADD CONSTRAINT "clinical_references_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "protocol_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_references" ADD CONSTRAINT "algorithm_references_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_references" ADD CONSTRAINT "algorithm_references_reference_id_fkey" FOREIGN KEY ("reference_id") REFERENCES "clinical_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_supplementals" ADD CONSTRAINT "clinical_supplementals_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "protocol_releases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_supplementals" ADD CONSTRAINT "algorithm_supplementals_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "algorithm_supplementals" ADD CONSTRAINT "algorithm_supplementals_supplemental_id_fkey" FOREIGN KEY ("supplemental_id") REFERENCES "clinical_supplementals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_taxonomy" ADD CONSTRAINT "protocol_taxonomy_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_first_aid" ADD CONSTRAINT "protocol_first_aid_algorithm_id_fkey" FOREIGN KEY ("algorithm_id") REFERENCES "algorithms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dependents" ADD CONSTRAINT "dependents_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviation_triage_encounters" ADD CONSTRAINT "aviation_triage_encounters_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviation_triage_encounters" ADD CONSTRAINT "aviation_triage_encounters_dependent_id_fkey" FOREIGN KEY ("dependent_id") REFERENCES "dependents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviation_triage_encounters" ADD CONSTRAINT "aviation_triage_encounters_protocol_used_id_fkey" FOREIGN KEY ("protocol_used_id") REFERENCES "algorithms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_audit_deviation_logs" ADD CONSTRAINT "safety_audit_deviation_logs_encounter_id_fkey" FOREIGN KEY ("encounter_id") REFERENCES "aviation_triage_encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_queue_items" ADD CONSTRAINT "triage_queue_items_staff_member_id_fkey" FOREIGN KEY ("staff_member_id") REFERENCES "staff_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_queue_items" ADD CONSTRAINT "triage_queue_items_dependent_id_fkey" FOREIGN KEY ("dependent_id") REFERENCES "dependents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_queue_items" ADD CONSTRAINT "triage_queue_items_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_queue_items" ADD CONSTRAINT "triage_queue_items_target_organization_id_fkey" FOREIGN KEY ("target_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triage_queue_items" ADD CONSTRAINT "triage_queue_items_matched_protocol_id_fkey" FOREIGN KEY ("matched_protocol_id") REFERENCES "algorithms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_transition_logs" ADD CONSTRAINT "queue_transition_logs_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_transition_logs" ADD CONSTRAINT "queue_transition_logs_actor_organization_id_fkey" FOREIGN KEY ("actor_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "queue_transition_logs" ADD CONSTRAINT "queue_transition_logs_target_organization_id_fkey" FOREIGN KEY ("target_organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_center_sessions" ADD CONSTRAINT "call_center_sessions_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_call_sessions" ADD CONSTRAINT "voice_call_sessions_call_center_session_id_fkey" FOREIGN KEY ("call_center_session_id") REFERENCES "call_center_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_call_sessions" ADD CONSTRAINT "voice_call_sessions_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_call_sessions" ADD CONSTRAINT "voice_call_sessions_protocol_id_fkey" FOREIGN KEY ("protocol_id") REFERENCES "algorithms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_call_sessions" ADD CONSTRAINT "voice_call_sessions_current_question_id_fkey" FOREIGN KEY ("current_question_id") REFERENCES "initial_assessment_questions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_assessment_turns" ADD CONSTRAINT "voice_assessment_turns_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "voice_call_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_assessment_turns" ADD CONSTRAINT "voice_assessment_turns_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "initial_assessment_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voice_assessment_turns" ADD CONSTRAINT "voice_assessment_turns_audio_asset_id_fkey" FOREIGN KEY ("audio_asset_id") REFERENCES "clinical_audio_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_center_events" ADD CONSTRAINT "call_center_events_call_center_session_id_fkey" FOREIGN KEY ("call_center_session_id") REFERENCES "call_center_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rag_retrieval_events" ADD CONSTRAINT "rag_retrieval_events_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_shadow_suggestions" ADD CONSTRAINT "llm_shadow_suggestions_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "llm_shadow_suggestions" ADD CONSTRAINT "llm_shadow_suggestions_retrieval_event_id_fkey" FOREIGN KEY ("retrieval_event_id") REFERENCES "rag_retrieval_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nurse_selection_events" ADD CONSTRAINT "nurse_selection_events_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_comparison_events" ADD CONSTRAINT "protocol_comparison_events_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_comparison_events" ADD CONSTRAINT "protocol_comparison_events_shadow_suggestion_id_fkey" FOREIGN KEY ("shadow_suggestion_id") REFERENCES "llm_shadow_suggestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_feedback_events" ADD CONSTRAINT "learning_feedback_events_comparison_event_id_fkey" FOREIGN KEY ("comparison_event_id") REFERENCES "protocol_comparison_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_feedback_events" ADD CONSTRAINT "learning_feedback_events_model_evaluation_run_id_fkey" FOREIGN KEY ("model_evaluation_run_id") REFERENCES "model_evaluation_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_blocked_outputs" ADD CONSTRAINT "safety_blocked_outputs_queue_item_id_fkey" FOREIGN KEY ("queue_item_id") REFERENCES "triage_queue_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_blocked_outputs" ADD CONSTRAINT "safety_blocked_outputs_shadow_suggestion_id_fkey" FOREIGN KEY ("shadow_suggestion_id") REFERENCES "llm_shadow_suggestions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_users" ADD CONSTRAINT "application_users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

