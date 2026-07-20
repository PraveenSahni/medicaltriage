import { z } from "zod";
import { DispositionCodeSchema, SeveritySchema } from "./triage.js";

export const ProtocolModeSchema = z.enum(["office-hours", "after-hours", "both"]);
export type ProtocolMode = z.infer<typeof ProtocolModeSchema>;

export const ClinicalContentSourceTypeSchema = z.enum([
  "synthetic-sample",
  "licensed-stcc",
  "local-qatar-override"
]);
export type ClinicalContentSourceType = z.infer<typeof ClinicalContentSourceTypeSchema>;

export const ClinicalContentKeywordSchema = z.object({
  phrase: z.string().min(1).max(160),
  language: z.string().min(2).max(8).default("en"),
  weight: z.number().int().min(1).max(100).default(50),
  source: z.string().min(1).max(64).default("release")
});
export type ClinicalContentKeyword = z.infer<typeof ClinicalContentKeywordSchema>;

export const ClinicalContentCareAdviceSchema = z.object({
  id: z.string().min(1).max(120),
  titleEn: z.string().min(1).max(240),
  titleAr: z.string().max(240).optional(),
  instructionTextEn: z.string().min(1).max(5000),
  instructionTextAr: z.string().max(5000).optional(),
  dispositionCode: DispositionCodeSchema.optional(),
  warningSigns: z.array(z.string().min(1).max(220)).default([])
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
  displayOrder: z.number().int().min(0).default(0),
  sectionLabel: z.string().min(1).max(160).optional()
});
export type ClinicalContentSupplemental = z.infer<typeof ClinicalContentSupplementalSchema>;

export const ClinicalContentDispositionMapSchema = z.object({
  severity: SeveritySchema,
  dispositionCode: DispositionCodeSchema,
  ageMin: z.number().int().min(0).max(120).optional(),
  ageMax: z.number().int().min(0).max(120).optional(),
  routeLabelEn: z.string().min(1).max(240),
  routeRationaleEn: z.string().min(1).max(2000),
  sourceOfCareEn: z.string().min(1).max(240).optional(),
  telemedicineHeadingEn: z.string().min(1).max(240).optional(),
  aviationContext: z.record(z.unknown()).optional()
});
export type ClinicalContentDispositionMap = z.infer<typeof ClinicalContentDispositionMapSchema>;

export const ClinicalContentProvenanceSchema = z.object({
  generated: z.boolean().default(true),
  sourceKind: z.string().min(1).max(100).default("synthetic-public-topic"),
  sourceDocuments: z.array(z.string().min(1).max(1000)).default([]),
  contentNotice: z.string().min(1).max(2000),
  requiresClinicalValidation: z.boolean().default(true),
  licensedContentIncluded: z.literal(false).default(false)
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
  branching: z.record(z.unknown()).optional()
});
export type ClinicalContentQuestion = z.infer<typeof ClinicalContentQuestionSchema>;

export const ClinicalContentProtocolSchema = z.object({
  id: z.string().min(1).max(120),
  titleEn: z.string().min(1).max(240),
  titleAr: z.string().max(240).optional(),
  clinicalDefinitionEn: z.string().max(3000).optional(),
  clinicalDefinitionAr: z.string().max(3000).optional(),
  backgroundInfoEn: z.string().max(3000).optional(),
  backgroundInfoAr: z.string().max(3000).optional(),
  ageMin: z.number().int().min(0).max(120).optional(),
  ageMax: z.number().int().min(0).max(120).optional(),
  genderRestriction: z.enum(["female", "male", "other", "unknown"]).optional(),
  mode: ProtocolModeSchema.default("both"),
  patientGroup: z.enum(["adult", "pediatric", "mixed", "unknown"]).default("unknown"),
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
};
