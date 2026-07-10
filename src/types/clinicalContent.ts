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
  keywords: z.array(ClinicalContentKeywordSchema).default([]),
  questions: z.array(ClinicalContentQuestionSchema).min(1),
  careAdvice: z.array(ClinicalContentCareAdviceSchema).default([])
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
