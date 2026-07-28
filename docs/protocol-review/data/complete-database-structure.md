# Complete Database Structure Reference
Generated from `prisma/schema.prisma` — 94 models, 26 enums.

## STCC clinical content (app-facing)

### `ProtocolRelease` (table: `protocol_releases`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| name | String | name |  |
| version | String | version |  |
| sourceType | ClinicalContentSourceType | source_type |  |
| region | String | region |  |
| mode | ProtocolMode | mode |  |
| active | Boolean | active |  |
| importedAt | DateTime? | imported_at |  |
| algorithms | Algorithm[] | algorithms |  |
| clinicalReferences | ClinicalReference[] | clinicalReferences |  |
| clinicalSupplementals | ClinicalSupplemental[] | clinicalSupplementals |  |
| importJobs | ClinicalContentImportJob[] | importJobs |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `Algorithm` (table: `algorithms`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| releaseId | String? | release_id |  |
| release | ProtocolRelease? | release | FK/relation |
| externalProtocolId | String? | external_protocol_id | UNIQUE |
| mode | ProtocolMode | mode |  |
| titleEn | String | title_en |  |
| titleAr | String? | title_ar |  |
| clinicalDefinitionEn | String? | clinical_definition_en |  |
| clinicalDefinitionAr | String? | clinical_definition_ar |  |
| backgroundInfoEn | String? | background_info_en |  |
| backgroundInfoAr | String? | background_info_ar |  |
| genderRestriction | BiologicalSex? | gender_restriction |  |
| patientGroup | PatientGroup | patient_group |  |
| algorithmCategory | String? | algorithm_category |  |
| algorithmGroup | String? | algorithm_group |  |
| algorithmType | String? | algorithm_type |  |
| algorithmSystem | String? | algorithm_system |  |
| anatomy | String? | anatomy |  |
| womensHealthEligible | Boolean? | womens_health_eligible |  |
| behavioralHealthEligible | Boolean? | behavioral_health_eligible |  |
| occupationalHealthEligible | Boolean? | occupational_health_eligible |  |
| chronicDiseaseEligible | Boolean? | chronic_disease_eligible |  |
| hospiceEligible | Boolean? | hospice_eligible |  |
| oncologyEligible | Boolean? | oncology_eligible |  |
| prescriptionOption | Boolean? | prescription_option |  |
| cmsPrivate | Boolean? | cms_private |  |
| sampleGuideline | Boolean? | sample_guideline |  |
| acuity | Int? | acuity |  |
| ageMin | Int? | age_min |  |
| ageMax | Int? | age_max |  |
| guidelineRedirects | Json? | guideline_redirects |  |
| painSeverityTable | Json? | pain_severity_table |  |
| backgroundDetail | Json? | background_detail |  |
| authorEn | String? | author_en |  |
| expertReviewerEn | String? | expert_reviewer_en |  |
| lastRevisedAt | DateTime? | last_revised_at |  |
| lastReviewedAt | DateTime? | last_reviewed_at |  |
| versionYear | Int? | version_year |  |
| contentSet | String? | content_set |  |
| provenance | Json? | provenance |  |
| stccVersion | String? | stcc_version |  |
| sourceRecordHash | String? | source_record_hash |  |
| sourceRecordChecksum | String? | source_record_checksum |  |
| sourceEffectiveFrom | DateTime? | source_effective_from |  |
| sourceEffectiveTo | DateTime? | source_effective_to |  |
| annualReconciliationStatus | String? | annual_reconciliation_status |  |
| active | Boolean | active |  |
| questions | TriageQuestion[] | questions |  |
| initialAssessmentQuestions | InitialAssessmentQuestion[] | initialAssessmentQuestions |  |
| careAdviceLinks | AlgorithmCareAdvice[] | careAdviceLinks |  |
| keywordIndexes | ProtocolKeywordIndex[] | keywordIndexes |  |
| synonyms | ProtocolSynonym[] | synonyms |  |
| dispositionMaps | ProtocolDispositionMap[] | dispositionMaps |  |
| clinicalReferenceLinks | AlgorithmReference[] | clinicalReferenceLinks |  |
| clinicalSupplementalLinks | AlgorithmSupplemental[] | clinicalSupplementalLinks |  |
| taxonomy | ProtocolTaxonomy[] | taxonomy |  |
| firstAidItems | ProtocolFirstAid[] | firstAidItems |  |
| encounters | AviationTriageEncounter[] | encounters |  |
| matchedQueueItems | TriageQueueItem[] | matchedQueueItems |  |
| voiceSessions | VoiceCallSession[] | voiceSessions |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `InitialAssessmentQuestion` (table: `initial_assessment_questions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| algorithmId | String | algorithm_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| externalQuestionId | String? | external_question_id |  |
| sequence | Int | sequence |  |
| responseType | InitialAssessmentResponseType | response_type |  |
| promptTextEn | String | prompt_text_en |  |
| clarificationPromptEn | String? | clarification_prompt_en |  |
| required | Boolean | required |  |
| emergencyKeywords | Json? | emergency_keywords |  |
| sourceRecordHash | String? | source_record_hash |  |
| sourceRecordChecksum | String? | source_record_checksum |  |
| audioAssets | ClinicalAudioAsset[] | audioAssets |  |
| voiceTurns | VoiceAssessmentTurn[] | voiceTurns |  |
| currentVoiceSessions | VoiceCallSession[] | currentVoiceSessions | FK/relation |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `ClinicalAudioAsset` (table: `clinical_audio_assets`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| initialAssessmentQuestionId | String | initial_assessment_question_id |  |
| initialAssessmentQuestion | InitialAssessmentQuestion | initialAssessmentQuestion | FK/relation |
| language | String | language |  |
| releaseVersion | String | release_version |  |
| voiceName | String | voice_name |  |
| storageUri | String | storage_uri |  |
| checksum | String | checksum |  |
| status | ClinicalAudioAssetStatus | status |  |
| approvedBy | String? | approved_by |  |
| approvedAt | DateTime? | approved_at |  |
| voiceTurns | VoiceAssessmentTurn[] | voiceTurns |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `TriageQuestion` (table: `triage_questions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| algorithmId | String | algorithm_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| externalQuestionId | String? | external_question_id |  |
| acuityOrder | Int | acuity_order |  |
| severityGrade | TriageSeverity | severity_grade |  |
| questionTextEn | String | question_text_en |  |
| questionTextAr | String? | question_text_ar |  |
| acuityDispositionCode | AcuityDispositionCode | acuity_disposition_code |  |
| rationaleEn | String? | rationale_en |  |
| redFlag | Boolean | red_flag |  |
| branching | Json? | branching |  |
| telemedicineEligible | Boolean? | telemedicine_eligible |  |
| telemedicineNotesEn | String? | telemedicine_notes_en |  |
| dispositionLevelId | String? | disposition_level_id |  |
| dispositionLevel | Disposition? | dispositionLevel | FK/relation |
| questionOrder | Int? | question_order |  |
| sourceRecordHash | String? | source_record_hash |  |
| sourceRecordChecksum | String? | source_record_checksum |  |
| careAdviceLinks | QuestionAdviceBridge[] | careAdviceLinks |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `CareAdvice` (table: `care_advice`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| externalCareAdviceId | String? | external_care_advice_id | UNIQUE |
| adviceTitleEn | String | advice_title_en |  |
| adviceTitleAr | String? | advice_title_ar |  |
| instructionTextEn | String | instruction_text_en |  |
| instructionTextAr | String? | instruction_text_ar |  |
| contentFormat | String | content_format |  |
| sanitizedHtmlEn | String? | sanitized_html_en |  |
| sanitizedHtmlAr | String? | sanitized_html_ar |  |
| sourceRecordHash | String? | source_record_hash |  |
| sourceRecordChecksum | String? | source_record_checksum |  |
| dispositionCode | AcuityDispositionCode? | disposition_code |  |
| warningSigns | Json? | warning_signs |  |
| patientSendable | Boolean | patient_sendable |  |
| adviceCategory | CareAdviceCategory? | advice_category |  |
| algorithmLinks | AlgorithmCareAdvice[] | algorithmLinks |  |
| questionLinks | QuestionAdviceBridge[] | questionLinks |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `AlgorithmCareAdvice` (table: `algorithm_care_advice`)
| Field | Type | Column | Flags |
|---|---|---|---|
| algorithmId | String | algorithm_id |  |
| careAdviceId | String | care_advice_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| careAdvice | CareAdvice | careAdvice | FK/relation |
| displayOrder | Int | display_order |  |

### `QuestionAdviceBridge` (table: `question_advice_bridge`)
| Field | Type | Column | Flags |
|---|---|---|---|
| questionId | String | question_id |  |
| adviceId | String | advice_id |  |
| triggerAnswer | String | trigger_answer |  |
| question | TriageQuestion | question | FK/relation |
| advice | CareAdvice | advice | FK/relation |

### `ProtocolKeywordIndex` (table: `protocol_keyword_indexes`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| algorithmId | String | algorithm_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| phrase | String | phrase |  |
| normalizedPhrase | String | normalized_phrase |  |
| language | String | language |  |
| weight | Int | weight |  |
| source | String | source |  |
| createdAt | DateTime | created_at |  |

### `ProtocolSynonym` (table: `protocol_synonyms`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| algorithmId | String? | algorithm_id |  |
| algorithm | Algorithm? | algorithm | FK/relation |
| canonicalTerm | String | canonical_term |  |
| synonym | String | synonym |  |
| language | String | language |  |
| region | String | region |  |
| createdAt | DateTime | created_at |  |

### `ProtocolDispositionMap` (table: `protocol_disposition_maps`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| algorithmId | String? | algorithm_id |  |
| algorithm | Algorithm? | algorithm | FK/relation |
| severity | TriageSeverity | severity |  |
| dispositionCode | AcuityDispositionCode | disposition_code |  |
| ageMin | Int? | age_min |  |
| ageMax | Int? | age_max |  |
| aviationContext | Json? | aviation_context |  |
| routeLabelEn | String | route_label_en |  |
| routeLabelAr | String? | route_label_ar |  |
| routeRationaleEn | String | route_rationale_en |  |
| routeRationaleAr | String? | route_rationale_ar |  |
| telemedicineHeadingEn | String? | telemedicine_heading_en |  |
| telemedicineHeadingAr | String? | telemedicine_heading_ar |  |
| sourceOfCareEn | String? | source_of_care_en |  |
| sourceOfCareAr | String? | source_of_care_ar |  |
| dispositionLevelId | String? | disposition_level_id |  |
| dispositionLevel | Disposition? | dispositionLevel | FK/relation |
| adultCareAdviceNumber | Int? | adult_care_advice_number |  |
| adultCareAdviceStatement | String? | adult_care_advice_statement |  |
| pediatricCareAdviceNumber | Int? | pediatric_care_advice_number |  |
| pediatricCareAdviceStatement | String? | pediatric_care_advice_statement |  |
| active | Boolean | active |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `LocalizedDisposition` (table: `localized_dispositions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | AcuityDispositionCode | code | UNIQUE |
| destinationNameEn | String | destination_name_en |  |
| destinationNameAr | String? | destination_name_ar |  |
| routingNotesEn | String | routing_notes_en |  |
| routingNotesAr | String? | routing_notes_ar |  |
| region | String | region |  |
| active | Boolean | active |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `Disposition` (table: `dispositions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| levelId | Int | level_id | UNIQUE |
| headingEn | String | heading_en |  |
| headingTelemedicineEn | String? | heading_telemedicine_en |  |
| videoEligible | Boolean | video_eligible |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |
| triageQuestions | TriageQuestion[] | triageQuestions |  |
| dispositionMappings | ProtocolDispositionMap[] | dispositionMappings |  |

### `AcuityRating` (table: `acuity_ratings`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| levelNumeric | Int | level_numeric | UNIQUE |
| textEn | String | text_en |  |
| color | String? | color |  |
| colorAlternate | String? | color_alternate |  |
| titleEn | String? | title_en |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `StccSystem` (table: `stcc_systems`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| name | String | name | UNIQUE |
| displayOrder | Int? | display_order |  |
| exampleEn | String? | example_en |  |
| createdAt | DateTime | created_at |  |

### `StccType` (table: `stcc_types`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| name | String | name | UNIQUE |
| topicEn | String? | topic_en |  |
| createdAt | DateTime | created_at |  |

### `ClinicalContentImportJob` (table: `clinical_content_import_jobs`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| releaseId | String? | release_id |  |
| release | ProtocolRelease? | release | FK/relation |
| sourceUri | String | source_uri |  |
| sourceChecksum | String? | source_checksum |  |
| status | ClinicalContentImportStatus | status |  |
| importerVersion | String | importer_version |  |
| rowsRead | Int | rows_read |  |
| rowsInserted | Int | rows_inserted |  |
| rowsSkipped | Int | rows_skipped |  |
| errorCount | Int | error_count |  |
| startedAt | DateTime | started_at |  |
| finishedAt | DateTime? | finished_at |  |
| errors | ClinicalContentImportError[] | errors |  |

### `ClinicalContentImportError` (table: `clinical_content_import_errors`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| importJobId | String | import_job_id |  |
| importJob | ClinicalContentImportJob | importJob | FK/relation |
| sourceRecordId | String? | source_record_id |  |
| tableName | String? | table_name |  |
| message | String | message |  |
| severity | String | severity |  |
| createdAt | DateTime | created_at |  |

### `ClinicalReference` (table: `clinical_references`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| releaseId | String? | release_id |  |
| release | ProtocolRelease? | release | FK/relation |
| externalReferenceId | String? | external_reference_id |  |
| title | String | title |  |
| sourceName | String? | source_name |  |
| citationText | String? | citation_text |  |
| url | String? | url |  |
| pmid | String? | pmid |  |
| pubMedUrl | String? | pub_med_url |  |
| publicUrl | String? | public_url |  |
| referenceType | String? | reference_type |  |
| sourceRecordHash | String? | source_record_hash |  |
| algorithmLinks | AlgorithmReference[] | algorithmLinks |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `AlgorithmReference` (table: `algorithm_references`)
| Field | Type | Column | Flags |
|---|---|---|---|
| algorithmId | String | algorithm_id |  |
| referenceId | String | reference_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| reference | ClinicalReference | reference | FK/relation |
| displayOrder | Int | display_order |  |
| sectionLabel | String? | section_label |  |

### `ClinicalSupplemental` (table: `clinical_supplementals`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| releaseId | String? | release_id |  |
| release | ProtocolRelease? | release | FK/relation |
| externalSupplementalId | String? | external_supplemental_id |  |
| titleEn | String | title_en |  |
| titleAr | String? | title_ar |  |
| supplementalType | String | supplemental_type |  |
| plainTextEn | String? | plain_text_en |  |
| plainTextAr | String? | plain_text_ar |  |
| sanitizedHtmlEn | String? | sanitized_html_en |  |
| sanitizedHtmlAr | String? | sanitized_html_ar |  |
| sourceRecordHash | String? | source_record_hash |  |
| algorithmLinks | AlgorithmSupplemental[] | algorithmLinks |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `AlgorithmSupplemental` (table: `algorithm_supplementals`)
| Field | Type | Column | Flags |
|---|---|---|---|
| algorithmId | String | algorithm_id |  |
| supplementalId | String | supplemental_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| supplemental | ClinicalSupplemental | supplemental | FK/relation |
| displayOrder | Int | display_order |  |
| sectionLabel | String? | section_label |  |

### `ProtocolTaxonomy` (table: `protocol_taxonomy`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| algorithmId | String | algorithm_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| category | String | category |  |
| value | String | value |  |
| source | String | source |  |
| displayOrder | Int | display_order |  |
| createdAt | DateTime | created_at |  |

### `ProtocolFirstAid` (table: `protocol_first_aid`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| algorithmId | String | algorithm_id |  |
| algorithm | Algorithm | algorithm | FK/relation |
| titleEn | String? | title_en |  |
| titleAr | String? | title_ar |  |
| instructionTextEn | String | instruction_text_en |  |
| instructionTextAr | String? | instruction_text_ar |  |
| sanitizedHtmlEn | String? | sanitized_html_en |  |
| sanitizedHtmlAr | String? | sanitized_html_ar |  |
| displayOrder | Int | display_order |  |
| sourceRecordHash | String? | source_record_hash |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

## STCC vendor-mirror (real Mdb* tables)

### `MdbAcuityRating` (table: `Mdb_AcuityRating`)
| Field | Type | Column | Flags |
|---|---|---|---|
| acuityRatingNumeric | Int | AcuityRating_Numeric | PK |
| acuityRatingText | String? | AcuityRating_Text |  |
| acuityRatingColor | String? | AcuityRating_Color |  |
| acuityRatingColorAlternate | String? | AcuityRating_Color_Alternate |  |
| acuityRatingTitle | String? | AcuityRating_Title |  |
| acuityRatingBullet | Bytes? | AcuityRating_Bullet |  |
| acuityRatingColorAlternateImg | Bytes? | AcuityRating_Color_Alternate_Img |  |
| algorithms | MdbAlgorithm[] | algorithms |  |
| dispositions | MdbDisposition[] | dispositions |  |

### `MdbSystem` (table: `Mdb_System`)
| Field | Type | Column | Flags |
|---|---|---|---|
| system | String | System | PK |
| systemOrder | Int? | System_Order |  |
| systemExample | String? | System_Example |  |
| algorithms | MdbAlgorithm[] | algorithms |  |

### `MdbType` (table: `Mdb_Type`)
| Field | Type | Column | Flags |
|---|---|---|---|
| type | String | Type | PK |
| typeTopic | String? | Type_Topic |  |
| algorithms | MdbAlgorithm[] | algorithms |  |

### `MdbDisposition` (table: `Mdb_Disposition`)
| Field | Type | Column | Flags |
|---|---|---|---|
| levelId | Int | LevelID | PK |
| createdDate | DateTime? | CreatedDate |  |
| lastUpDate | DateTime? | LastUpDate |  |
| dispositionHeading | String? | DispositionHeading |  |
| dispositionHeadingTelemedicine | String? | DispositionHeading_Telemedicine |  |
| adultCareAdviceNumber | Int? | Adult_CareAdvice_Number |  |
| adultCareAdviceStatement | String? | Adult_CareAdvice_Statement |  |
| adultCareAdviceStatementXhtml | String? | Adult_CareAdvice_Statement_XHTML |  |
| adultCareAdviceStatementTelemedicine | String? | Adult_CareAdvice_Statement_Telemedicine |  |
| adultCareAdviceStatementXhtmlTelemedicine | String? | Adult_CareAdvice_Statement_XHTML_Telemedicine |  |
| pediatricCareAdviceNumber | Int? | Pediatric_CareAdvice_Number |  |
| pediatricCareAdviceStatement | String? | Pediatric_CareAdvice_Statement |  |
| pediatricCareAdviceStatementXhtml | String? | Pediatric_CareAdvice_Statement_XHTML |  |
| pediatricCareAdviceStatementTelemedicine | String? | Pediatric_CareAdvice_Statement_Telemedicine |  |
| pediatricCareAdviceStatementXhtmlTelemedicine | String? | Pediatric_CareAdvice_Statement_XHTML_Telemedicine |  |
| acuityRatingNumeric | Int? | AcuityRating |  |
| acuityRating | MdbAcuityRating? | acuityRating | FK/relation |
| questions | MdbQuestion[] | questions |  |

### `MdbAlgorithm` (table: `Mdb_Algorithm`)
| Field | Type | Column | Flags |
|---|---|---|---|
| algorithmId | Int | AlgorithmID | PK |
| author | String? | Author |  |
| copyright | String? | Copyright |  |
| createdDate | DateTime? | CreatedDate |  |
| lastUpDate | DateTime? | LastUpDate |  |
| lastReviewDate | DateTime? | LastReviewDate |  |
| title | String? | Title |  |
| titleUpperCase | String? | Title_UpperCase |  |
| titleLastUpdate | DateTime? | Title_LastUpdate |  |
| definition | String? | Definition |  |
| definitionXhtml | String? | DefinitionXHTML |  |
| definitionLastUpdate | DateTime? | Definition_LastUpdate |  |
| initialAssessmentQuestions | String? | InitialAssessmentQuestions |  |
| initialAssessmentQuestionsLastUpdate | DateTime? | InitalAssessmentQuestions_LastUpdate |  |
| background | String? | Background |  |
| backgroundXhtml | String? | BackgroundXHTML |  |
| backgroundLastUpdate | DateTime? | BackGround_LastUpdate |  |
| firstAid | String? | FirstAid |  |
| firstAidXhtml | String? | FirstAidXHTML |  |
| firstAidLastUpdate | DateTime? | FirstAid_LastUpdate |  |
| referenceLastUpdate | DateTime? | Reference_LastUpdate |  |
| searchWordsLastUpdate | DateTime? | SearchWords_LastUpdate |  |
| questionsLastUpdate | DateTime? | Questions_LastUpdate |  |
| caLastUpdate | DateTime? | CA_LastUpdate |  |
| ahDescriptors | Boolean? | AH_DESCRIPTORS |  |
| category | String? | Category |  |
| group | String? | Group |  |
| typeName | String? | Type |  |
| systemName | String? | System |  |
| anatomy | String? | Anatomy |  |
| versionYear | String? | VersionYear |  |
| status | String? | Status |  |
| acuity | Int? | Acuity |  |
| gender | String? | Gender |  |
| ageGroup | String? | AgeGroup |  |
| minAgeYears | Int? | Min_Age_Years |  |
| maxAgeYears | Int? | Max_Age_Years |  |
| minAgeMonths | Int? | Min_Age_Months |  |
| maxAgeMonths | Int? | Max_Age_Months |  |
| wh | Boolean? | WH |  |
| bh | Boolean? | BH |  |
| oa | Boolean? | OA |  |
| cd | Boolean? | CD |  |
| hospice | Boolean? | Hospice |  |
| oncology | Boolean? | Oncology |  |
| prescriptionOption | Boolean? | Prescription_Option |  |
| cmsPrivate | Boolean? | CMS_PRIVATE |  |
| sampleGuidelines | Boolean? | SampleGuidelines |  |
| acuityRating | MdbAcuityRating? | acuityRating | FK/relation |
| systemRef | MdbSystem? | systemRef | FK/relation |
| typeRef | MdbType? | typeRef | FK/relation |
| questions | MdbQuestion[] | questions |  |
| advice | MdbAdvice[] | advice |  |
| algorithmReferences | MdbAlgorithmReference[] | algorithmReferences |  |
| algorithmSearchWords | MdbAlgorithmSearchWord[] | algorithmSearchWords |  |
| algorithmSupplementals | MdbAlgorithmSupplemental[] | algorithmSupplementals |  |

### `MdbQuestion` (table: `Mdb_Question`)
| Field | Type | Column | Flags |
|---|---|---|---|
| questionId | Int | QuestionID | PK |
| algorithmId | Int? | AlgorithmID |  |
| questionOrder | Int? | QuestionOrder |  |
| dateCreated | DateTime? | DateCreated |  |
| lastUpDate | DateTime? | LastUpDate |  |
| question | String? | Question |  |
| dispositionLevel | Int? | DispositionLevel |  |
| information | String? | Information |  |
| smagLinkId | Int? | SMAG_LINK_ID |  |
| cmsNew | Boolean? | CMS_NEW |  |
| telemedicineEligible | Boolean? | TelemedicineEligible |  |
| algorithm | MdbAlgorithm? | algorithm | FK/relation |
| disposition | MdbDisposition? | disposition | FK/relation |
| questionAdvice | MdbQuestionAdvice[] | questionAdvice |  |

### `MdbAdvice` (table: `Mdb_Advice`)
| Field | Type | Column | Flags |
|---|---|---|---|
| adviceId | Int | AdviceID | PK |
| algorithmId | Int? | AlgorithmID |  |
| dateCreated | DateTime? | DateCreated |  |
| lastUpDate | DateTime? | LastUpDate |  |
| lastUpDateXhtml | DateTime? | LastUpDate_XHTML |  |
| advice | String? | Advice |  |
| adviceXhtml | String? | Advice_XHTML |  |
| patientHealthInfo | Boolean? | PatientHealthInfo |  |
| adviceSnap | String? | AdviceSnap |  |
| algorithmOrder | Int? | AlgorithmOrder |  |
| algorithm | MdbAlgorithm? | algorithm | FK/relation |
| questionAdvice | MdbQuestionAdvice[] | questionAdvice |  |

### `MdbQuestionAdvice` (table: `Mdb_QuestionAdvice`)
| Field | Type | Column | Flags |
|---|---|---|---|
| questionId | Int | QuestionID |  |
| adviceId | Int | AdviceID |  |
| lastUpdate | DateTime? | LastUpdate |  |
| questionAdviceOrder | Int? | QuestionAdviceOrder |  |
| question | MdbQuestion | question | FK/relation |
| advice | MdbAdvice | advice | FK/relation |

### `MdbReference` (table: `Mdb_Reference`)
| Field | Type | Column | Flags |
|---|---|---|---|
| referenceId | Int | ReferenceID | PK |
| topicReferenceId | Int? | TopicReferenceID |  |
| referenceTitle | String? | ReferenceTitle |  |
| referenceSource | String? | ReferenceSource |  |
| referenceAuthor | String? | ReferenceAuthor |  |
| lastUpdate | DateTime? | LastUpdate |  |
| dateAdded | DateTime? | DateAdded |  |
| pmid | String? | PMID |  |
| pubMedUrl | String? | PubMedURL |  |
| publicUrl | String? | PublicURL |  |
| algorithmReferences | MdbAlgorithmReference[] | algorithmReferences |  |

### `MdbAlgorithmReference` (table: `Mdb_AlgorithmReference`)
| Field | Type | Column | Flags |
|---|---|---|---|
| algorithmId | Int | AlgorithmID |  |
| referenceId | Int | ReferenceID |  |
| dateUsed | DateTime? | DateUSed |  |
| lastUpdate | DateTime? | LastUpdate |  |
| algorithm | MdbAlgorithm | algorithm | FK/relation |
| reference | MdbReference | reference | FK/relation |

### `MdbSearchWord` (table: `Mdb_SearchWord`)
| Field | Type | Column | Flags |
|---|---|---|---|
| searchWord | String | SearchWord | PK |
| dateCreated | DateTime? | DateCreated |  |
| algorithmSearchWords | MdbAlgorithmSearchWord[] | algorithmSearchWords |  |

### `MdbAlgorithmSearchWord` (table: `Mdb_AlgorithmSearchWords`)
| Field | Type | Column | Flags |
|---|---|---|---|
| algorithmId | Int | AlgorithmID |  |
| searchWord | String | SearchWord |  |
| createDate | DateTime? | CreateDate |  |
| lastUpDate | DateTime? | LastUpDate |  |
| algorithm | MdbAlgorithm | algorithm | FK/relation |
| searchWordRef | MdbSearchWord | searchWordRef | FK/relation |

### `MdbSupplemental` (table: `Mdb_Supplemental`)
| Field | Type | Column | Flags |
|---|---|---|---|
| supplementalId | Int | SupplementalID | PK |
| topicId | Int? | TopicID |  |
| author | String? | Author |  |
| filename | String? | Filename |  |
| createDate | DateTime? | CreateDate |  |
| lastUpDate | DateTime? | LastUpDate |  |
| lastReviewDate | DateTime? | LastReviewDate |  |
| title | String? | Title |  |
| titleLastUpdate | DateTime? | Title_LastUpdate |  |
| contentXhtml | String? | Content_XHTML |  |
| content | String? | Content |  |
| contentLastUpdate | DateTime? | Content_LastUpdate |  |
| category | String? | Category |  |
| group | String? | Group |  |
| status | String? | Status |  |
| versionYear | String? | VersionYear |  |
| algorithmSupplementals | MdbAlgorithmSupplemental[] | algorithmSupplementals |  |

### `MdbAlgorithmSupplemental` (table: `Mdb_AlgorithmSupplemental`)
| Field | Type | Column | Flags |
|---|---|---|---|
| algorithmId | Int | AlgorithmID |  |
| supplementalId | Int | SupplementalID |  |
| createdDate | DateTime? | CreatedDate |  |
| algorithm | MdbAlgorithm | algorithm | FK/relation |
| supplemental | MdbSupplemental | supplemental | FK/relation |

## HRMS / people

### `StaffMember` (table: `staff_members`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| istStaffId | String | ist_staff_id | UNIQUE |
| department | String | department |  |
| jobTitle | String | job_title |  |
| dutyStatus | DutyStatus | duty_status |  |
| insuranceProvider | String? | insurance_provider |  |
| insuranceEligibilityStatus | InsuranceEligibilityStatus | insurance_eligibility_status |  |
| insuranceLastChecked | DateTime? | insurance_last_checked |  |
| dateOfBirth | DateTime? | date_of_birth |  |
| dependents | Dependent[] | dependents |  |
| encounters | AviationTriageEncounter[] | encounters |  |
| queueItems | TriageQueueItem[] | queueItems |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `Dependent` (table: `dependents`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| staffMemberId | String | staff_member_id |  |
| staffMember | StaffMember | staffMember | FK/relation |
| fullName | String | full_name |  |
| relationshipType | DependentRelationship | relationship |  |
| age | Int | age |  |
| dateOfBirth | DateTime? | date_of_birth |  |
| biologicalSex | BiologicalSex | biological_sex |  |
| encounters | AviationTriageEncounter[] | encounters |  |
| queueItems | TriageQueueItem[] | queueItems |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `Organization` (table: `organizations`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| name | String | name |  |
| code | String | code | UNIQUE |
| mophLicenseNumber | String? | moph_license_number |  |
| country | String | country |  |
| dataResidencyRegion | String | data_residency_region |  |
| users | ApplicationUser[] | users |  |
| sourceQueueItems | TriageQueueItem[] | sourceQueueItems | FK/relation |
| targetQueueItems | TriageQueueItem[] | targetQueueItems | FK/relation |
| actorTransitions | QueueTransitionLog[] | actorTransitions | FK/relation |
| targetTransitions | QueueTransitionLog[] | targetTransitions | FK/relation |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

## Triage & queue operations

### `AviationTriageEncounter` (table: `aviation_triage_encounters`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| staffMemberId | String | staff_member_id |  |
| staffMember | StaffMember | staffMember | FK/relation |
| dependentId | String? | dependent_id |  |
| dependent | Dependent? | dependent | FK/relation |
| protocolUsedId | String? | protocol_used_id |  |
| protocolUsed | Algorithm? | protocolUsed | FK/relation |
| initialAcuityScore | Int | initial_acuity_score |  |
| finalDispositionCode | AcuityDispositionCode | final_disposition_code |  |
| audioRecordingUrl | String? | audio_recording_url |  |
| transcriptText | String? | transcript_text |  |
| transcriptLanguage | String? | transcript_language |  |
| customAviationTags | Json? | custom_aviation_tags |  |
| clipboardPayload | Json? | clipboard_payload |  |
| nurseId | String | nurse_id |  |
| completedAt | DateTime? | completed_at |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |
| safetyLog | SafetyAuditDeviationLog? | safetyLog |  |

### `SafetyAuditDeviationLog` (table: `safety_audit_deviation_logs`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| encounterId | String | encounter_id | UNIQUE |
| encounter | AviationTriageEncounter | encounter | FK/relation |
| originalAiRecommendation | String | original_ai_recommendation |  |
| nurseOverrideRationale | String? | nurse_override_rationale |  |
| rulesEngineSeverity | TriageSeverity | rules_engine_severity |  |
| overrideStatusFlag | OverrideStatusFlag | override_status_flag |  |
| isCriticalFloorBreach | Boolean | is_critical_floor_breach |  |
| explainabilityTrace | Json | explainability_trace |  |
| createdAt | DateTime | created_at |  |

### `TriageQueueItem` (table: `triage_queue_items`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| istStaffId | String | ist_staff_id |  |
| staffMemberId | String? | staff_member_id |  |
| staffMember | StaffMember? | staffMember | FK/relation |
| dependentId | String? | dependent_id |  |
| dependent | Dependent? | dependent | FK/relation |
| organizationId | String? | organization_id |  |
| organization | Organization? | organization | FK/relation |
| targetOrganizationId | String? | target_organization_id |  |
| targetOrganization | Organization? | targetOrganization | FK/relation |
| status | QueueStatus | status |  |
| currentStage | QueueClinicalStage | current_stage |  |
| priorityScore | Int | priority_score |  |
| patientType | String | patient_type |  |
| channel | String | channel |  |
| stationCode | String? | station_code |  |
| outstationCode | String? | outstation_code |  |
| department | String? | department |  |
| jobTitle | String? | job_title |  |
| summary | String? | summary |  |
| vitals | Json? | vitals |  |
| matchedProtocolId | String? | matched_protocol_id |  |
| matchedProtocol | Algorithm? | matchedProtocol | FK/relation |
| calculatedSeverity | TriageSeverity? | calculated_severity |  |
| dispositionCode | AcuityDispositionCode? | disposition_code |  |
| destinationName | String? | destination_name |  |
| identityValidated | Boolean | identity_validated |  |
| safetyFloorActive | Boolean | safety_floor_active |  |
| clinicalApproval | Json? | clinical_approval |  |
| sbarCopied | Boolean | sbar_copied |  |
| assignedNurseId | String? | assigned_nurse_id |  |
| claimedAt | DateTime? | claimed_at |  |
| slaDeadline | DateTime | sla_deadline |  |
| lockedBy | String? | locked_by |  |
| lockExpiresAt | DateTime? | lock_expires_at |  |
| customAviationTags | Json? | custom_aviation_tags |  |
| queuePayload | Json? | queue_payload |  |
| transitionLogs | QueueTransitionLog[] | transitionLogs |  |
| callCenterSessions | CallCenterSession[] | callCenterSessions |  |
| ragRetrievalEvents | RagRetrievalEvent[] | ragRetrievalEvents |  |
| llmShadowSuggestions | LlmShadowSuggestion[] | llmShadowSuggestions |  |
| nurseSelectionEvents | NurseSelectionEvent[] | nurseSelectionEvents |  |
| protocolComparisonEvents | ProtocolComparisonEvent[] | protocolComparisonEvents |  |
| safetyBlockedOutputs | SafetyBlockedOutput[] | safetyBlockedOutputs |  |
| voiceSessions | VoiceCallSession[] | voiceSessions |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `QueueTransitionLog` (table: `queue_transition_logs`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| queueItemId | String | queue_item_id |  |
| queueItem | TriageQueueItem | queueItem | FK/relation |
| actorId | String | actor_id |  |
| actorOrganizationId | String? | actor_organization_id |  |
| actorOrganization | Organization? | actorOrganization | FK/relation |
| actorRole | String | actor_role |  |
| targetOrganizationId | String? | target_organization_id |  |
| targetOrganization | Organization? | targetOrganization | FK/relation |
| eventType | String | event_type |  |
| fromStatus | QueueStatus | from_status |  |
| toStatus | QueueStatus | to_status |  |
| fromStage | QueueClinicalStage | from_stage |  |
| toStage | QueueClinicalStage | to_stage |  |
| reason | String? | reason |  |
| auditSignature | String | audit_signature |  |
| tracePayload | Json | trace_payload |  |
| timestamp | DateTime | timestamp |  |

### `CallCenterSession` (table: `call_center_sessions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| queueItemId | String? | queue_item_id |  |
| queueItem | TriageQueueItem? | queueItem | FK/relation |
| provider | String | provider |  |
| externalCallId | String | external_call_id |  |
| direction | String | direction |  |
| channel | String | channel |  |
| status | String | status |  |
| aniMasked | String? | ani_masked |  |
| aniHash | String? | ani_hash |  |
| dnis | String? | dnis |  |
| language | String | language |  |
| queueName | String? | queue_name |  |
| agentId | String? | agent_id |  |
| recordingGovernance | Json? | recording_governance |  |
| requiresIdentityResolution | Boolean | requires_identity_resolution |  |
| startedAt | DateTime? | started_at |  |
| connectedAt | DateTime? | connected_at |  |
| endedAt | DateTime? | ended_at |  |
| events | CallCenterEvent[] | events |  |
| voiceSessions | VoiceCallSession[] | voiceSessions |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `VoiceCallSession` (table: `voice_call_sessions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| callCenterSessionId | String? | call_center_session_id |  |
| callCenterSession | CallCenterSession? | callCenterSession | FK/relation |
| queueItemId | String? | queue_item_id |  |
| queueItem | TriageQueueItem? | queueItem | FK/relation |
| protocolId | String | protocol_id |  |
| protocol | Algorithm | protocol | FK/relation |
| releaseVersion | String | release_version |  |
| language | String | language |  |
| status | VoiceSessionStatus | status |  |
| currentQuestionId | String? | current_question_id |  |
| currentQuestion | InitialAssessmentQuestion? | currentQuestion | FK/relation |
| clarificationAttempts | Int | clarification_attempts |  |
| maxClarificationAttempts | Int | max_clarification_attempts |  |
| createdByUserId | String | created_by_user_id |  |
| recordingNoticePlayed | Boolean | recording_notice_played |  |
| recordingAuthorizationStatus | String | recording_authorization_status |  |
| rawRecordingRagEligible | Boolean | raw_recording_rag_eligible |  |
| recordingStorageRegion | String | recording_storage_region |  |
| takeoverReason | String? | takeover_reason |  |
| startedAt | DateTime? | started_at |  |
| completedAt | DateTime? | completed_at |  |
| turns | VoiceAssessmentTurn[] | turns |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `VoiceAssessmentTurn` (table: `voice_assessment_turns`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| sessionId | String | session_id |  |
| session | VoiceCallSession | session | FK/relation |
| questionId | String | question_id |  |
| question | InitialAssessmentQuestion | question | FK/relation |
| audioAssetId | String? | audio_asset_id |  |
| audioAsset | ClinicalAudioAsset? | audioAsset | FK/relation |
| sequence | Int | sequence |  |
| attempt | Int | attempt |  |
| promptTextSnapshot | String | prompt_text_snapshot |  |
| transcriptText | String? | transcript_text |  |
| speechStartedAtMs | Int? | speech_started_at_ms |  |
| speechEndedAtMs | Int? | speech_ended_at_ms |  |
| sttConfidence | Float? | stt_confidence |  |
| answerClassification | VoiceAnswerClassification? | answer_classification |  |
| structuredAnswer | Json? | structured_answer |  |
| interpreterEvidence | Json? | interpreter_evidence |  |
| interpreterProvider | String? | interpreter_provider |  |
| interpreterModel | String? | interpreter_model |  |
| interpreterVersion | String? | interpreter_version |  |
| status | VoiceTurnStatus | status |  |
| validationStatus | VoiceValidationStatus | validation_status |  |
| nurseCorrectedAnswer | Json? | nurse_corrected_answer |  |
| validationComment | String? | validation_comment |  |
| validatedBy | String? | validated_by |  |
| validatedAt | DateTime? | validated_at |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `CallCenterEvent` (table: `call_center_events`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| callCenterSessionId | String | call_center_session_id |  |
| callCenterSession | CallCenterSession | callCenterSession | FK/relation |
| provider | String | provider |  |
| providerEventId | String | provider_event_id |  |
| externalCallId | String | external_call_id |  |
| eventType | String | event_type |  |
| processStatus | String | process_status |  |
| safePayload | Json | safe_payload |  |
| auditSignature | String | audit_signature |  |
| failureCode | String? | failure_code |  |
| occurredAt | DateTime | occurred_at |  |
| receivedAt | DateTime | received_at |  |
| processedAt | DateTime? | processed_at |  |

### `SafetyBlockedOutput` (table: `safety_blocked_outputs`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| queueItemId | String? | queue_item_id |  |
| queueItem | TriageQueueItem? | queueItem | FK/relation |
| shadowSuggestionId | String? | shadow_suggestion_id |  |
| shadowSuggestion | LlmShadowSuggestion? | shadowSuggestion | FK/relation |
| reason | SafetyBlockedOutputReason | reason |  |
| blockedPayload | Json | blocked_payload |  |
| deterministicFloor | TriageSeverity? | deterministic_floor |  |
| policyVersion | String | policy_version |  |
| createdAt | DateTime | created_at |  |

## RAG / ML shadow & learning

### `RagRetrievalEvent` (table: `rag_retrieval_events`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| queueItemId | String? | queue_item_id |  |
| queueItem | TriageQueueItem? | queueItem | FK/relation |
| sourceType | ClinicalContentSourceType | source_type |  |
| sourceReleaseVersion | String | source_release_version |  |
| queryText | String | query_text |  |
| normalizedReason | String? | normalized_reason |  |
| extractedKeywords | Json? | extracted_keywords |  |
| retrievedSourceIds | Json | retrieved_source_ids |  |
| retrievedSnippetHashes | Json | retrieved_snippet_hashes |  |
| confidence | Float | confidence |  |
| boundaryLabel | String | boundary_label |  |
| shadowSuggestions | LlmShadowSuggestion[] | shadowSuggestions |  |
| createdAt | DateTime | created_at |  |

### `LlmShadowSuggestion` (table: `llm_shadow_suggestions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| queueItemId | String? | queue_item_id |  |
| queueItem | TriageQueueItem? | queueItem | FK/relation |
| retrievalEventId | String? | retrieval_event_id |  |
| retrievalEvent | RagRetrievalEvent? | retrievalEvent | FK/relation |
| modelName | String | model_name |  |
| promptVersion | String | prompt_version |  |
| corpusVersion | String | corpus_version |  |
| extractedReason | Json? | extracted_reason |  |
| suggestedKeywords | Json? | suggested_keywords |  |
| suggestedProtocolCandidates | Json | suggested_protocol_candidates |  |
| rationaleSummary | String? | rationale_summary |  |
| cannotDecideDisposition | Boolean | cannot_decide_disposition |  |
| requiresNurseReview | Boolean | requires_nurse_review |  |
| status | RagShadowStatus | status |  |
| comparisonEvents | ProtocolComparisonEvent[] | comparisonEvents |  |
| blockedOutputs | SafetyBlockedOutput[] | blockedOutputs |  |
| createdAt | DateTime | created_at |  |

### `NurseSelectionEvent` (table: `nurse_selection_events`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| queueItemId | String? | queue_item_id |  |
| queueItem | TriageQueueItem? | queueItem | FK/relation |
| selectedProtocolId | String? | selected_protocol_id |  |
| selectedDispositionCode | AcuityDispositionCode? | selected_disposition_code |  |
| selectedCareAdviceIds | Json? | selected_care_advice_ids |  |
| selectedByUserId | String | selected_by_user_id |  |
| selectedByRole | String | selected_by_role |  |
| selectionReason | String? | selection_reason |  |
| sourceStep | String | source_step |  |
| createdAt | DateTime | created_at |  |

### `ProtocolComparisonEvent` (table: `protocol_comparison_events`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| queueItemId | String? | queue_item_id |  |
| queueItem | TriageQueueItem? | queueItem | FK/relation |
| shadowSuggestionId | String? | shadow_suggestion_id |  |
| shadowSuggestion | LlmShadowSuggestion? | shadowSuggestion | FK/relation |
| deterministicPrimaryProtocolId | String? | deterministic_primary_protocol_id |  |
| shadowPrimaryProtocolId | String? | shadow_primary_protocol_id |  |
| nurseSelectedProtocolId | String? | nurse_selected_protocol_id |  |
| agreement | ProtocolComparisonAgreement | agreement |  |
| reasonCode | String? | reason_code |  |
| comparisonPayload | Json? | comparison_payload |  |
| learningFeedbackEvents | LearningFeedbackEvent[] | learningFeedbackEvents |  |
| createdAt | DateTime | created_at |  |

### `LearningFeedbackEvent` (table: `learning_feedback_events`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| comparisonEventId | String? | comparison_event_id |  |
| comparisonEvent | ProtocolComparisonEvent? | comparisonEvent | FK/relation |
| modelEvaluationRunId | String? | model_evaluation_run_id |  |
| modelEvaluationRun | ModelEvaluationRun? | modelEvaluationRun | FK/relation |
| action | LearningFeedbackAction | action |  |
| targetEntityType | String? | target_entity_type |  |
| targetEntityId | String? | target_entity_id |  |
| rationale | String? | rationale |  |
| requiresClinicalReview | Boolean | requires_clinical_review |  |
| createdByUserId | String? | created_by_user_id |  |
| createdAt | DateTime | created_at |  |

### `ModelEvaluationRun` (table: `model_evaluation_runs`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| runName | String | run_name |  |
| modelName | String | model_name |  |
| promptVersion | String | prompt_version |  |
| corpusVersion | String | corpus_version |  |
| datasetVersion | String | dataset_version |  |
| status | ModelEvaluationStatus | status |  |
| metrics | Json? | metrics |  |
| failureSummary | String? | failure_summary |  |
| learningFeedbackEvents | LearningFeedbackEvent[] | learningFeedbackEvents |  |
| startedAt | DateTime? | started_at |  |
| finishedAt | DateTime? | finished_at |  |
| createdAt | DateTime | created_at |  |

## Identity, roles & access

### `ApplicationUser` (table: `application_users`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| employeeId | String? | employee_id | UNIQUE |
| hrmsId | String? | hrms_id | UNIQUE |
| fullName | String | full_name |  |
| emailCiphertext | String? | email_ciphertext |  |
| emailBlindIndex | String? | email_blind_index | UNIQUE |
| mobileCiphertext | String? | mobile_ciphertext |  |
| mobileBlindIndex | String? | mobile_blind_index |  |
| organization | String | organization |  |
| organizationId | String? | organization_id |  |
| organizationRef | Organization? | organizationRef | FK/relation |
| facility | String? | facility |  |
| department | String? | department |  |
| clinicalSpecialty | String? | clinical_specialty |  |
| jobTitle | String? | job_title |  |
| professionalCategory | String? | professional_category |  |
| managerUserId | String? | manager_user_id |  |
| licenceNumberCiphertext | String? | licence_number_ciphertext |  |
| licenceAuthority | String? | licence_authority |  |
| licenceExpiry | DateTime? | licence_expiry |  |
| country | String | country |  |
| preferredLanguage | String | preferred_language |  |
| timeZone | String | time_zone |  |
| authenticationMethod | String | authentication_method |  |
| mfaStatus | String | mfa_status |  |
| accountStatus | String | account_status |  |
| directoryStatus | DirectoryStatus | directory_status |  |
| passwordHash | String? | password_hash |  |
| createdBy | String? | created_by |  |
| updatedBy | String? | updated_by |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `Role` (table: `roles`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| description | String? | description |  |
| status | String | status |  |
| requiresApproval | Boolean | requires_approval |  |
| version | String | version |  |
| createdBy | String? | created_by |  |
| updatedBy | String? | updated_by |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `Responsibility` (table: `responsibilities`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| description | String? | description |  |
| module | String | module |  |
| businessFunction | String | business_function |  |
| riskClassification | String | risk_classification |  |
| clinicalOrAdministrative | String | clinical_or_administrative |  |
| allowedActions | Json | allowed_actions |  |
| dataScope | Json? | data_scope |  |
| clinicalScope | Json? | clinical_scope |  |
| integrationScope | Json? | integration_scope |  |
| prerequisiteResponsibilities | Json? | prerequisite_responsibilities |  |
| conflictingResponsibilities | Json? | conflicting_responsibilities |  |
| approvalRequirement | String | approval_requirement |  |
| effectiveDate | DateTime? | effective_date |  |
| expiryDate | DateTime? | expiry_date |  |
| status | String | status |  |
| version | String | version |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `Permission` (table: `permissions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| module | String | module |  |
| action | String | action |  |
| description | String? | description |  |
| risk | String | risk |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `AccessProfile` (table: `access_profiles`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| description | String? | description |  |
| organizationScope | Json? | organization_scope |  |
| facilityScope | Json? | facility_scope |  |
| departmentScope | Json? | department_scope |  |
| specialtyScope | Json? | specialty_scope |  |
| queueScope | Json? | queue_scope |  |
| shiftRestrictions | Json? | shift_restrictions |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `UserRole` (table: `user_roles`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| roleCode | String | role_code |  |
| effectiveFrom | DateTime | effective_from |  |
| effectiveTo | DateTime? | effective_to |  |
| approvedBy | String? | approved_by |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |

### `UserResponsibility` (table: `user_responsibilities`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| responsibilityCode | String | responsibility_code |  |
| effectiveFrom | DateTime | effective_from |  |
| effectiveTo | DateTime? | effective_to |  |
| approvedBy | String? | approved_by |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |

### `UserAccessProfile` (table: `user_access_profiles`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| accessProfileCode | String | access_profile_code |  |
| effectiveFrom | DateTime | effective_from |  |
| effectiveTo | DateTime? | effective_to |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |

### `AccessScope` (table: `access_scopes`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| scopeType | String | scope_type |  |
| rules | Json | rules |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `ClinicalScope` (table: `clinical_scopes`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| protocolSet | Json? | protocol_set |  |
| specialties | Json? | specialties |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `IntegrationScope` (table: `integration_scopes`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| integrations | Json | integrations |  |
| allowedActions | Json | allowed_actions |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `UserQueueAssignment` (table: `user_queue_assignments`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| queueCode | String | queue_code |  |
| role | String | role |  |
| effectiveFrom | DateTime | effective_from |  |
| effectiveTo | DateTime? | effective_to |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |

### `AccessRequest` (table: `access_requests`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| requesterUserId | String | requester_user_id |  |
| targetUserId | String | target_user_id |  |
| requestedAccess | Json | requested_access |  |
| justification | String | justification |  |
| status | String | status |  |
| risk | String | risk |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `AccessApproval` (table: `access_approvals`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| accessRequestId | String | access_request_id |  |
| approverUserId | String | approver_user_id |  |
| decision | String | decision |  |
| comments | String? | comments |  |
| decidedAt | DateTime | decided_at |  |

### `SegregationOfDutyRule` (table: `segregation_of_duty_rules`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| description | String | description |  |
| conflictType | String | conflict_type |  |
| leftScope | Json | left_scope |  |
| rightScope | Json | right_scope |  |
| severity | String | severity |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `AccessConflict` (table: `access_conflicts`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| ruleCode | String | rule_code |  |
| details | Json | details |  |
| status | String | status |  |
| detectedAt | DateTime | detected_at |  |
| resolvedAt | DateTime? | resolved_at |  |

### `TemporaryAccess` (table: `temporary_access`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| accessProfile | String | access_profile |  |
| purpose | String | purpose |  |
| effectiveFrom | DateTime | effective_from |  |
| effectiveTo | DateTime | effective_to |  |
| approvedBy | String? | approved_by |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |

### `BreakGlassAccess` (table: `break_glass_access`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| encounterId | String? | encounter_id |  |
| purpose | String | purpose |  |
| justification | String | justification |  |
| expiresAt | DateTime | expires_at |  |
| reviewedBy | String? | reviewed_by |  |
| reviewedAt | DateTime? | reviewed_at |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |

### `AuthenticationProvider` (table: `authentication_providers`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| providerKey | String | provider_key | UNIQUE |
| name | String | name |  |
| protocol | String | protocol |  |
| enabled | Boolean | enabled |  |
| tenantIdCiphertext | String? | tenant_id_ciphertext |  |
| issuerUrl | String? | issuer_url |  |
| authorizationEndpoint | String? | authorization_endpoint |  |
| tokenEndpoint | String? | token_endpoint |  |
| userInfoEndpoint | String? | user_info_endpoint |  |
| clientIdCiphertext | String? | client_id_ciphertext |  |
| clientSecretRef | String? | client_secret_ref |  |
| redirectUri | String? | redirect_uri |  |
| logoutUri | String? | logout_uri |  |
| samlMetadataCiphertext | String? | saml_metadata_ciphertext |  |
| signingCertificateRef | String? | signing_certificate_ref |  |
| certificateExpiry | DateTime? | certificate_expiry |  |
| allowedDomains | Json? | allowed_domains |  |
| attributeMappings | Json? | attribute_mappings |  |
| groupMappings | Json? | group_mappings |  |
| jitProvisioning | Boolean | jit_provisioning |  |
| localLoginEnabled | Boolean | local_login_enabled |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `UserSession` (table: `user_sessions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| userId | String | user_id |  |
| sessionHash | String | session_hash | UNIQUE |
| sessionPayload | Json | session_payload |  |
| authMethod | String | auth_method |  |
| mfaVerified | Boolean | mfa_verified |  |
| ipAddress | String? | ip_address |  |
| device | String? | device |  |
| userAgent | String? | user_agent |  |
| expiresAt | DateTime | expires_at |  |
| revokedAt | DateTime? | revoked_at |  |
| createdAt | DateTime | created_at |  |

## Data governance & privacy

### `CcpDraft` (table: `ccp_drafts`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| istStaffId | String | ist_staff_id |  |
| threadId | String | thread_id |  |
| linkedGoalId | String? | linked_goal_id |  |
| channel | String | channel |  |
| recipientTo | String | recipient_to |  |
| originalTo | String | original_to |  |
| subject | String | subject |  |
| body | String | body |  |
| status | String | status |  |
| draftedByRole | String | drafted_by_role |  |
| approval | Json | approval |  |
| sendResult | Json? | send_result |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `CcpWebhookRecord` (table: `ccp_webhook_records`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| inboundId | String | inbound_id |  |
| provider | String | provider |  |
| providerMessageId | String? | provider_message_id |  |
| channel | String | channel |  |
| sender | String | sender |  |
| recipient | String | recipient |  |
| body | String | body |  |
| status | String | status |  |
| attachments | Json | attachments |  |
| rawPayload | Json | raw_payload |  |
| queueNote | String | queue_note |  |
| persistedAt | DateTime | persisted_at |  |

### `DataClassification` (table: `data_classifications`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| description | String? | description |  |
| risk | String | risk |  |
| defaultMaskingPolicy | String? | default_masking_policy |  |
| defaultRevealPolicy | String? | default_reveal_policy |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `SensitiveDataField` (table: `sensitive_data_fields`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| entityName | String | entity_name |  |
| fieldName | String | field_name |  |
| dataClassification | String | data_classification |  |
| encryptionPolicyCode | String? | encryption_policy_code |  |
| maskingPolicyCode | String? | masking_policy_code |  |
| revealPolicyCode | String? | reveal_policy_code |  |
| blindIndexRequired | Boolean | blind_index_required |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `EncryptionPolicy` (table: `encryption_policies`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| dataClassification | String | data_classification |  |
| coveredEntities | Json | covered_entities |  |
| coveredFields | Json | covered_fields |  |
| approvedAlgorithm | String | approved_algorithm |  |
| minimumKeySize | Int | minimum_key_size |  |
| keyProvider | String | key_provider |  |
| keyAlias | String | key_alias |  |
| keyRotationDays | Int | key_rotation_days |  |
| dataResidency | String | data_residency |  |
| approvalRequirement | String | approval_requirement |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `EncryptionPolicyVersion` (table: `encryption_policy_versions`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| policyCode | String | policy_code |  |
| version | String | version |  |
| policySnapshot | Json | policy_snapshot |  |
| approvedBy | String? | approved_by |  |
| approvedAt | DateTime? | approved_at |  |
| effectiveFrom | DateTime? | effective_from |  |
| retiredAt | DateTime? | retired_at |  |
| createdAt | DateTime | created_at |  |

### `MaskingPolicy` (table: `masking_policies`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| rules | Json | rules |  |
| defaultMode | String | default_mode |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `RevealPolicy` (table: `reveal_policies`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| dataClassification | String | data_classification |  |
| requiresMfa | Boolean | requires_mfa |  |
| requiresApproval | Boolean | requires_approval |  |
| allowedPurposes | Json | allowed_purposes |  |
| revealDurationSeconds | Int | reveal_duration_seconds |  |
| remaskOnBlur | Boolean | remask_on_blur |  |
| disableCopy | Boolean | disable_copy |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `RevealRequest` (table: `reveal_requests`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| requesterUserId | String | requester_user_id |  |
| resourceType | String | resource_type |  |
| resourceId | String | resource_id |  |
| fieldName | String | field_name |  |
| purpose | String | purpose |  |
| status | String | status |  |
| requestedAt | DateTime | requested_at |  |
| expiresAt | DateTime? | expires_at |  |

### `RevealApproval` (table: `reveal_approvals`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| revealRequestId | String | reveal_request_id |  |
| approverUserId | String | approver_user_id |  |
| decision | String | decision |  |
| comments | String? | comments |  |
| decidedAt | DateTime | decided_at |  |

### `RevealEvent` (table: `reveal_events`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| revealRequestId | String? | reveal_request_id |  |
| userId | String | user_id |  |
| resourceType | String | resource_type |  |
| resourceId | String | resource_id |  |
| fieldName | String | field_name |  |
| purpose | String | purpose |  |
| success | Boolean | success |  |
| ipAddress | String? | ip_address |  |
| device | String? | device |  |
| occurredAt | DateTime | occurred_at |  |

### `CryptographicKeyReference` (table: `cryptographic_key_references`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| keyAlias | String | key_alias | UNIQUE |
| provider | String | provider |  |
| location | String | location |  |
| keyClass | String | key_class |  |
| currentVersion | String | current_version |  |
| status | String | status |  |
| expiresAt | DateTime? | expires_at |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `KeyRotationRecord` (table: `key_rotation_records`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| keyAlias | String | key_alias |  |
| fromVersion | String | from_version |  |
| toVersion | String | to_version |  |
| status | String | status |  |
| approvedBy | String? | approved_by |  |
| rotatedAt | DateTime? | rotated_at |  |
| createdAt | DateTime | created_at |  |

### `PrivacyRequest` (table: `privacy_requests`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| requesterRef | String | requester_ref |  |
| requestType | String | request_type |  |
| jurisdiction | String | jurisdiction |  |
| status | String | status |  |
| dueAt | DateTime? | due_at |  |
| assignedTo | String? | assigned_to |  |
| notes | String? | notes |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `RetentionPolicy` (table: `retention_policies`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| code | String | code | UNIQUE |
| name | String | name |  |
| entityName | String | entity_name |  |
| retentionPeriod | Json | retention_period |  |
| legalBasis | String? | legal_basis |  |
| deletionMode | String | deletion_mode |  |
| status | String | status |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `LegalHold` (table: `legal_holds`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| holdCode | String | hold_code | UNIQUE |
| resourceType | String | resource_type |  |
| resourceId | String | resource_id |  |
| reason | String | reason |  |
| status | String | status |  |
| createdBy | String? | created_by |  |
| releasedBy | String? | released_by |  |
| releasedAt | DateTime? | released_at |  |
| createdAt | DateTime | created_at |  |

### `SensitiveExportRequest` (table: `sensitive_export_requests`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| requesterUserId | String | requester_user_id |  |
| exportType | String | export_type |  |
| dataScope | Json | data_scope |  |
| justification | String | justification |  |
| approvalStatus | String | approval_status |  |
| encryptionRequired | Boolean | encryption_required |  |
| expiresAt | DateTime? | expires_at |  |
| createdAt | DateTime | created_at |  |
| updatedAt | DateTime | updated_at |  |

### `AuditEvent` (table: `audit_events`)
| Field | Type | Column | Flags |
|---|---|---|---|
| id | String | id | PK |
| timestamp | DateTime | timestamp |  |
| userId | String? | user_id |  |
| activeRole | String? | active_role |  |
| organization | String? | organization |  |
| facility | String? | facility |  |
| department | String? | department |  |
| action | String | action |  |
| module | String | module |  |
| resource | String? | resource |  |
| recordReference | String? | record_reference |  |
| purpose | String? | purpose |  |
| approvalReference | String? | approval_reference |  |
| ipAddress | String? | ip_address |  |
| device | String? | device |  |
| sessionHash | String? | session_hash |  |
| success | Boolean | success |  |
| riskLevel | String | risk_level |  |
| metadata | Json? | metadata |  |

## Enums (26)
- **TriageSeverity**: EMERGENCY, URGENT, ROUTINE, SELF_CARE
- **AcuityDispositionCode**: SIDRA_PEDIATRIC_ED, HMC_EMERGENCY_DEPARTMENT, HMC_URGENT_REVIEW, IST_HIA_MIDFIELD_MEDICAL_CENTRE, IST_OLD_AIRPORT_MEDICAL_COMMISSION, PHCC_URGENT_CARE_OR_TELECONSULT, OUTSTATION_TELECONSULT_ESCALATION, SELF_CARE_WITH_CALLBACK_PRECAUTIONS
- **BiologicalSex**: FEMALE, MALE, OTHER, UNKNOWN
- **PatientGroup**: ADULT, PEDIATRIC, MIXED, UNKNOWN
- **CareAdviceCategory**: DISPOSITION, NOTE_TO_TRIAGER, GENERAL, CALL_BACK_IF
- **DutyStatus**: ACTIVE, ON_LEAVE, REST_PERIOD, SUSPENDED, INACTIVE
- **DependentRelationship**: SPOUSE, SON, DAUGHTER, CHILD, PARENT, OTHER
- **InsuranceEligibilityStatus**: ELIGIBLE, SUSPENDED, INELIGIBLE, PENDING_VERIFICATION, UNKNOWN
- **OverrideStatusFlag**: AI_RECOMMENDATION_DIFFERED, NURSE_OVERRIDE_UP, NURSE_OVERRIDE_DOWN_BLOCKED, RULES_ENGINE_FINAL, REVIEW_REQUIRED
- **ProtocolMode**: OFFICE_HOURS, AFTER_HOURS, BOTH
- **QueueStatus**: INCOMING, IN_PROCESS, INFO_REQUIRED, COMPLETED
- **QueueClinicalStage**: INTAKE, IDENTITY, VITALS, PROTOCOL, DISPOSITION, SBAR
- **DirectoryStatus**: ACTIVE, DISABLED, ON_LEAVE, REST_PERIOD, INACTIVE
- **ClinicalContentSourceType**: SYNTHETIC_SAMPLE, LICENSED_STCC, LOCAL_QATAR_OVERRIDE
- **ClinicalContentImportStatus**: PENDING, VALIDATED, IMPORTED, FAILED
- **RagShadowStatus**: RECORDED, BLOCKED, REVIEWED, PROMOTED_TO_RULE_REVIEW
- **ProtocolComparisonAgreement**: FULL_MATCH, PARTIAL_MATCH, NO_MATCH, NO_DETERMINISTIC_CANDIDATE, NO_SHADOW_CANDIDATE
- **LearningFeedbackAction**: NO_CHANGE, ADD_SYNONYM, ADJUST_KEYWORD_WEIGHT, PROMPT_REVIEW, CONTENT_REVIEW, SAFETY_REVIEW
- **ModelEvaluationStatus**: PLANNED, RUNNING, PASSED, FAILED, BLOCKED
- **SafetyBlockedOutputReason**: UNSAFE_DOWNGRADE, INVENTED_QUESTION, INVENTED_CARE_ADVICE, OUT_OF_BOUND_SOURCE, PRIVACY_BOUNDARY, OTHER
- **InitialAssessmentResponseType**: OPEN_TEXT, YES_NO, LOCATION, DURATION, PAIN_SCALE, TEMPERATURE
- **VoiceSessionStatus**: CREATED, ACTIVE, AWAITING_NURSE_VALIDATION, NURSE_TAKEOVER, COMPLETED, CANCELLED
- **VoiceTurnStatus**: READY, NEEDS_CLARIFICATION, AWAITING_NURSE_VALIDATION, VALIDATED, REJECTED
- **VoiceAnswerClassification**: YES, NO, OPEN_TEXT, UNCERTAIN, INTERRUPTED, EMERGENCY_SIGNAL
- **VoiceValidationStatus**: PENDING, VALIDATED, CORRECTED, REJECTED
- **ClinicalAudioAssetStatus**: DRAFT, APPROVED, RETIRED
