import { z } from "zod";
import { DispositionCodeSchema, SeveritySchema } from "./triage.js";

export const ProtocolModeSchema = z.enum(["office-hours", "after-hours", "both"]);
export type ProtocolMode = z.infer<typeof ProtocolModeSchema>;

export const ClinicalContentSourceTypeSchema = z.enum([
  "synthetic-sample",
  "licensed-stcc",
  "local-qatar-override",
  "open-source-clinical-rule",
  "open-source-guideline"
]);
export type ClinicalContentSourceType = z.infer<typeof ClinicalContentSourceTypeSchema>;

export const ClinicalContentKeywordSchema = z.object({
  phrase: z.string().min(1).max(160),
  language: z.string().min(2).max(8).default("en"),
  weight: z.number().int().min(1).max(100).default(50),
  source: z.string().min(1).max(64).default("release")
});
export type ClinicalContentKeyword = z.infer<typeof ClinicalContentKeywordSchema>;

export const CareAdviceCategorySchema = z.enum([
  "DISPOSITION",
  "NOTE_TO_TRIAGER",
  "GENERAL",
  "CALL_BACK_IF"
]);
export type CareAdviceCategory = z.infer<typeof CareAdviceCategorySchema>;

export const ClinicalContentCareAdviceSchema = z.object({
  id: z.string().min(1).max(120),
  titleEn: z.string().min(1).max(240),
  titleAr: z.string().max(240).optional(),
  instructionTextEn: z.string().min(1).max(5000),
  instructionTextAr: z.string().max(5000).optional(),
  contentFormat: z.enum(["plain_text", "xhtml"]).default("plain_text"),
  sanitizedHtmlEn: z.string().max(10000).optional(),
  sanitizedHtmlAr: z.string().max(10000).optional(),
  dispositionCode: DispositionCodeSchema.optional(),
  warningSigns: z.array(z.string().min(1).max(220)).default([]),
  displayOrder: z.number().int().min(0).default(0),
  patientSendable: z.boolean().default(false),
  adviceCategory: CareAdviceCategorySchema.optional()
});
export type ClinicalContentCareAdvice = z.infer<typeof ClinicalContentCareAdviceSchema>;

/**
 * Search terminology is intentionally separate from protocol titles. This lets
 * a licensed content release replace synthetic terms without changing the
 * application-level protocol contract.
 */
export const ClinicalContentSynonymSchema = z.object({
  canonicalTerm: z.string().min(1).max(240),
  synonym: z.string().min(1).max(240),
  language: z.string().min(2).max(8).default("en"),
  region: z.string().min(2).max(8).default("QA")
});
export type ClinicalContentSynonym = z.infer<typeof ClinicalContentSynonymSchema>;

export const ClinicalContentTaxonomySchema = z.object({
  category: z.string().min(1).max(100),
  value: z.string().min(1).max(240),
  source: z.string().min(1).max(100).default("synthetic-public-index"),
  displayOrder: z.number().int().min(0).default(0)
});
export type ClinicalContentTaxonomy = z.infer<typeof ClinicalContentTaxonomySchema>;

export const ClinicalContentFirstAidSchema = z.object({
  titleEn: z.string().min(1).max(240),
  instructionTextEn: z.string().min(1).max(5000),
  sanitizedHtmlEn: z.string().max(10000).optional(),
  sanitizedHtmlAr: z.string().max(10000).optional(),
  displayOrder: z.number().int().min(0).default(0)
});
export type ClinicalContentFirstAid = z.infer<typeof ClinicalContentFirstAidSchema>;

export const ClinicalContentReferenceSchema = z.object({
  id: z.string().min(1).max(160),
  title: z.string().min(1).max(500),
  sourceName: z.string().min(1).max(240).optional(),
  citationText: z.string().min(1).max(2000).optional(),
  url: z.string().url().max(2000).optional(),
  referenceType: z.string().min(1).max(80).default("public-source"),
  displayOrder: z.number().int().min(0).default(0)
});
export type ClinicalContentReference = z.infer<typeof ClinicalContentReferenceSchema>;

export const ClinicalContentSupplementalSchema = z.object({
  id: z.string().min(1).max(160),
  titleEn: z.string().min(1).max(240),
  supplementalType: z.string().min(1).max(100),
  plainTextEn: z.string().min(1).max(10000),
  sanitizedHtmlEn: z.string().max(10000).optional(),
  sanitizedHtmlAr: z.string().max(10000).optional(),
  displayOrder: z.number().int().min(0).default(0),
  sectionLabel: z.string().min(1).max(160).optional()
});
export type ClinicalContentSupplemental = z.infer<typeof ClinicalContentSupplementalSchema>;

/// STCC's numeric disposition-level ladder (100->15). Additive reference
/// metadata; never consulted by severityMax/severityRank or dispositionRouter.ts.
export const DispositionLevelSchema = z.number().int().min(15).max(100);

export const ClinicalContentDispositionMapSchema = z.object({
  severity: SeveritySchema,
  dispositionCode: DispositionCodeSchema,
  ageMin: z.number().int().min(0).max(120).optional(),
  ageMax: z.number().int().min(0).max(120).optional(),
  routeLabelEn: z.string().min(1).max(240),
  routeRationaleEn: z.string().min(1).max(2000),
  sourceOfCareEn: z.string().min(1).max(240).optional(),
  telemedicineHeadingEn: z.string().min(1).max(240).optional(),
  aviationContext: z.record(z.unknown()).optional(),
  dispositionLevel: DispositionLevelSchema.optional()
});
export type ClinicalContentDispositionMap = z.infer<typeof ClinicalContentDispositionMapSchema>;

export const ClinicalContentProvenanceSchema = z.object({
  generated: z.boolean().default(true),
  sourceKind: z.string().min(1).max(100).default("synthetic-public-topic"),
  sourceDocuments: z.array(z.string().min(1).max(1000)).default([]),
  contentNotice: z.string().min(1).max(2000),
  usageStatus: z.enum(["UAT_ONLY", "PRODUCTION"]).optional(),
  productionEligible: z.boolean().optional(),
  clinicalStatus: z
    .enum([
      "CLINICAL_CORRECTION_REQUIRED",
      "READY_FOR_QATAR_CLINICAL_REVIEW",
      "CLINICALLY_REVIEWED_FOR_UAT",
      "PRODUCTION_APPROVED"
    ])
    .optional(),
  requiresClinicalValidation: z.boolean().default(true),
  licensedContentIncluded: z.literal(false).default(false),
  // Distinct from productionEligible/PRODUCTION_APPROVED: lets UAT-only
  // content run in the demo deployment (APP_ENVIRONMENT=demo) without
  // claiming production clinical approval. See assertClinicalContentAllowedInEnvironment.
  demoEligible: z.boolean().optional()
});
export type ClinicalContentProvenance = z.infer<typeof ClinicalContentProvenanceSchema>;

export const InitialAssessmentResponseTypeSchema = z.enum([
  "OPEN_TEXT",
  "YES_NO",
  "LOCATION",
  "DURATION",
  "PAIN_SCALE",
  "TEMPERATURE"
]);
export type InitialAssessmentResponseType = z.infer<typeof InitialAssessmentResponseTypeSchema>;

/**
 * STCC-shaped history-taking prompt used before the acuity-ordered triage
 * checklist. These prompts collect facts only; they never carry a disposition.
 */
export const ClinicalContentInitialAssessmentQuestionSchema = z.object({
  id: z.string().min(1).max(120),
  sequence: z.number().int().min(1),
  responseType: InitialAssessmentResponseTypeSchema,
  promptTextEn: z.string().min(1).max(1000),
  clarificationPromptEn: z.string().min(1).max(1000).optional(),
  required: z.boolean().default(true),
  emergencyKeywords: z.array(z.string().min(1).max(120)).default([])
});
export type ClinicalContentInitialAssessmentQuestion = z.infer<
  typeof ClinicalContentInitialAssessmentQuestionSchema
>;

export const ClinicalContentQuestionSchema = z.object({
  id: z.string().min(1).max(120),
  acuityOrder: z.number().int().min(1),
  severity: SeveritySchema,
  questionTextEn: z.string().min(1).max(1000),
  questionTextAr: z.string().max(1000).optional(),
  dispositionCode: DispositionCodeSchema,
  rationaleEn: z.string().min(1).max(1200),
  redFlag: z.boolean().default(false),
  keywords: z.array(z.string().min(1).max(120)).default([]),
  careAdviceIds: z.array(z.string().min(1).max(120)).default([]),
  branching: z.record(z.unknown()).optional(),
  telemedicineEligible: z.boolean().optional(),
  telemedicineNotesEn: z.string().max(1200).optional(),
  dispositionLevel: DispositionLevelSchema.optional(),
  questionOrder: z.number().int().min(1).optional()
});
export type ClinicalContentQuestion = z.infer<typeof ClinicalContentQuestionSchema>;

/**
 * STCC's GotoGuideline pattern: a pre-screen question with no severity or
 * disposition that routes the caller to a different protocol entirely.
 */
export const ClinicalContentGuidelineRedirectSchema = z.object({
  id: z.string().min(1).max(120),
  questionOrder: z.number().int().min(1),
  promptTextEn: z.string().min(1).max(500),
  targetProtocolTitleEn: z.string().min(1).max(240),
  targetProtocolId: z.string().min(1).max(120).optional(),
  hintEn: z.string().max(500).optional()
});
export type ClinicalContentGuidelineRedirect = z.infer<typeof ClinicalContentGuidelineRedirectSchema>;

export const ClinicalContentPainSeverityRowSchema = z.object({
  level: z.string().min(1).max(40),
  cls: z.enum(["mild", "moderate", "severe"]),
  textEn: z.string().min(1).max(400)
});
export type ClinicalContentPainSeverityRow = z.infer<typeof ClinicalContentPainSeverityRowSchema>;

export const ClinicalContentLocationTableRowSchema = z.object({
  locationEn: z.string().min(1).max(120),
  sourceEn: z.string().min(1).max(240)
});
export type ClinicalContentLocationTableRow = z.infer<typeof ClinicalContentLocationTableRowSchema>;

/// Not every protocol type has all of these; empty arrays are expected where
/// an age-split or anatomical-location breakdown doesn't apply to the topic.
export const ClinicalContentBackgroundDetailSchema = z.object({
  keyPointsEn: z.array(z.string().min(1).max(600)).default([]),
  causesUnder50En: z.array(z.string().min(1).max(160)).default([]),
  causesOver50En: z.array(z.string().min(1).max(160)).default([]),
  locationTable: z.array(ClinicalContentLocationTableRowSchema).default([])
});
export type ClinicalContentBackgroundDetail = z.infer<typeof ClinicalContentBackgroundDetailSchema>;

/**
 * Authorship/versioning metadata. expertReviewerEn must attribute to the real
 * source organization's editorial process only (e.g. "NHS.UK clinical
 * editorial review") - never an invented named clinician, since that would
 * misrepresent an unreviewed protocol as physician-signed-off.
 */
export const ClinicalContentAuthorshipSchema = z.object({
  authorEn: z.string().min(1).max(240).optional(),
  expertReviewerEn: z.string().min(1).max(240).optional(),
  lastRevisedIso: z.string().optional(),
  lastReviewedIso: z.string().optional(),
  versionYear: z.number().int().min(2000).max(2100).optional(),
  contentSet: z.string().min(1).max(240).optional()
});
export type ClinicalContentAuthorship = z.infer<typeof ClinicalContentAuthorshipSchema>;

export const ClinicalContentProtocolSchema = z.object({
  id: z.string().min(1).max(120),
  titleEn: z.string().min(1).max(240),
  titleAr: z.string().max(240).optional(),
  // Real STCC Background/Definition text (verified via ODBC against a real
  // sample .mdb) can run past 9000 chars for some guidelines (e.g. Diarrhea) -
  // raised from the original 3000 to fit the honest full text rather than
  // truncating it.
  clinicalDefinitionEn: z.string().max(12000).optional(),
  clinicalDefinitionAr: z.string().max(12000).optional(),
  backgroundInfoEn: z.string().max(12000).optional(),
  backgroundInfoAr: z.string().max(12000).optional(),
  ageMin: z.number().int().min(0).max(120).optional(),
  ageMax: z.number().int().min(0).max(120).optional(),
  genderRestriction: z.enum(["female", "male", "other", "unknown"]).optional(),
  mode: ProtocolModeSchema.default("both"),
  patientGroup: z.enum(["adult", "pediatric", "mixed", "unknown"]).default("unknown"),
  /// Synthetic/heuristic 1-5 guideline-level acuity approximation, not real
  /// STCC AcuityRating. Never consulted by the deterministic safety kernel.
  acuity: z.number().int().min(1).max(5).optional(),
  titleVariants: z.array(z.string().min(1).max(240)).default([]),
  synonyms: z.array(ClinicalContentSynonymSchema).default([]),
  taxonomy: z.array(ClinicalContentTaxonomySchema).default([]),
  dispositionMappings: z.array(ClinicalContentDispositionMapSchema).default([]),
  keywords: z.array(ClinicalContentKeywordSchema).default([]),
  initialAssessmentQuestions: z
    .array(ClinicalContentInitialAssessmentQuestionSchema)
    .default([]),
  questions: z.array(ClinicalContentQuestionSchema).min(1),
  careAdvice: z.array(ClinicalContentCareAdviceSchema).default([]),
  firstAid: z.array(ClinicalContentFirstAidSchema).default([]),
  references: z.array(ClinicalContentReferenceSchema).default([]),
  supplementals: z.array(ClinicalContentSupplementalSchema).default([]),
  openSourcePatientEducationAnchors: z.array(z.string().url().max(2000)).default([]),
  guidelineRedirects: z.array(ClinicalContentGuidelineRedirectSchema).default([]),
  painSeverity: z.array(ClinicalContentPainSeverityRowSchema).max(6).default([]),
  backgroundDetail: ClinicalContentBackgroundDetailSchema.optional(),
  authorship: ClinicalContentAuthorshipSchema.optional(),
  provenance: ClinicalContentProvenanceSchema.optional()
});
export type ClinicalContentProtocol = z.infer<typeof ClinicalContentProtocolSchema>;

export const LocalizedDispositionSchema = z.object({
  code: DispositionCodeSchema,
  destinationNameEn: z.string().min(1).max(240),
  destinationNameAr: z.string().max(240).optional(),
  routingNotesEn: z.string().min(1).max(1000),
  routingNotesAr: z.string().max(1000).optional(),
  region: z.string().min(2).max(8).default("QA")
});
export type LocalizedDisposition = z.infer<typeof LocalizedDispositionSchema>;

export const ClinicalContentPackageSchema = z.object({
  release: z.object({
    name: z.string().min(1).max(240),
    version: z.string().min(1).max(80),
    sourceType: ClinicalContentSourceTypeSchema,
    region: z.string().min(2).max(8).default("QA"),
    mode: ProtocolModeSchema.default("both")
  }),
  protocols: z.array(ClinicalContentProtocolSchema).min(1),
  localizedDispositions: z.array(LocalizedDispositionSchema).default([])
});
export type ClinicalContentPackageInput = z.input<typeof ClinicalContentPackageSchema>;
export type ClinicalContentPackage = z.infer<typeof ClinicalContentPackageSchema>;

export const ProtocolSearchQuerySchema = z.object({
  q: z.string().max(240).default(""),
  ageYears: z.coerce.number().int().min(0).max(120).optional(),
  biologicalSex: z.enum(["female", "male", "other", "unknown"]).optional(),
  mode: ProtocolModeSchema.default("both"),
  limit: z.coerce.number().int().min(1).max(20).default(8)
});
export type ProtocolSearchQuery = z.infer<typeof ProtocolSearchQuerySchema>;

export type ProtocolSearchResult = {
  id: string;
  titleEn: string;
  clinicalDefinitionEn?: string;
  ageMin?: number;
  ageMax?: number;
  mode: ProtocolMode;
  score: number;
  matchedTerms: string[];
  questionCount: number;
  highestSeverity: z.infer<typeof SeveritySchema>;
  releaseVersion: string;
  // Real STCC Algorithm.Acuity (1-5, 1 = most urgent) - used to rank/color
  // search results by urgency, not just keyword relevance.
  acuity?: number;
};
