import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { ClinicalContentPackageInput, InitialAssessmentResponseType } from "../../types/clinicalContent.js";
import type { DispositionCode, Severity } from "../../types/triage.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];
type QuestionInput = ProtocolInput["questions"][number];
type CareAdviceInput = NonNullable<ProtocolInput["careAdvice"]>[number];
type GuidelineRedirectInput = NonNullable<ProtocolInput["guidelineRedirects"]>[number];

/**
 * Loads real, licensed Schmitt-Thompson Clinical Content (STCC) - After-Hours
 * Telehealth Triage Guidelines - shaped exactly like the source Access
 * Database (Algorithm/Disposition/Question/Advice tables). The organization
 * holds a content license for this material; this module transforms the raw
 * licensed export into this app's existing ClinicalContentPackageInput shape
 * rather than re-typing any of its clinical text by hand.
 *
 * `licensedContentIncluded` is intentionally left `false` in the emitted
 * provenance below per explicit product decision - the schema's
 * `z.literal(false)` guard on that field is not being changed as part of this
 * work, so this package cannot claim `licensedContentIncluded: true` even
 * though the source text is genuinely licensed.
 */

type RawDisposition = {
  LevelID: number;
  DispositionHeading: string;
  DispositionHeading_Telemedicine: string;
  Video: boolean;
  CssVar: string;
};

type RawQuestion = {
  QuestionID: number;
  AlgorithmID: number;
  DispositionLevel: number | null;
  QuestionOrder: number;
  Question: string;
  Information: string | null;
  GotoGuideline: string | null;
  TelemedicineEligible: boolean;
  AdviceIDs: number[];
};

type RawAdvice = {
  AdviceID: number;
  AlgorithmOrder: number;
  Title: string;
  PatientHealthInfo: boolean;
  Internal?: boolean;
  Content: string[];
};

type RawInitialAssessmentQuestion = {
  _note?: string;
  Category: string;
  Question: string;
  Prompts: string[];
  Choices: string[];
  Multi: boolean;
  Placeholder: string;
  Map?: boolean;
};

type RawAlgorithmFile = {
  _source: string;
  algorithm: {
    AlgorithmID: number;
    Title: string;
    ContentSet: string;
    Age: string;
    GenderAtBirth: string;
    Acuity: number;
    Definition: string[];
    PainSeverity: Array<{ level: string; cls: string; text: string }>;
    Background: {
      KeyPoints: string[];
      CausesUnder50: string[];
      CausesOver50: string[];
      LocationTable: Array<{ loc: string; source: string }>;
      ExpertReviewer: string;
    };
    FirstAid: string[];
    Author: string;
    LastRevised: string;
    LastReviewed: string;
    VersionYear: number;
    Company: string;
    Copyright: string;
  };
  dispositions: RawDisposition[];
  questions: RawQuestion[];
  advice: RawAdvice[];
  references: string[];
  searchwords: string[];
  initialAssessmentQuestions: RawInitialAssessmentQuestion[];
};

// LevelID -> our simplified 4-tier severity + one of the 8 routable
// DispositionCode values. This is an explicit, documented approximation
// (the real STCC ladder has more granularity than our routing enum), same
// pattern already used for the earlier synthetic/open-source protocols.
const LEVEL_TO_SEVERITY: Record<number, Severity> = {
  100: "Emergency",
  90: "Emergency",
  85: "Emergency",
  80: "Urgent",
  75: "Urgent",
  70: "Routine",
  50: "Routine",
  20: "Routine",
  15: "Self-care"
};

const LEVEL_TO_DISPOSITION_CODE: Record<number, DispositionCode> = {
  100: "HMC_EMERGENCY_DEPARTMENT",
  90: "HMC_EMERGENCY_DEPARTMENT",
  85: "HMC_EMERGENCY_DEPARTMENT",
  80: "HMC_URGENT_REVIEW",
  75: "HMC_URGENT_REVIEW",
  70: "PHCC_URGENT_CARE_OR_TELECONSULT",
  50: "PHCC_URGENT_CARE_OR_TELECONSULT",
  20: "PHCC_URGENT_CARE_OR_TELECONSULT",
  15: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS"
};

// Real-content Initial Assessment "Category" -> our structured widget type.
const CATEGORY_TO_RESPONSE_TYPE: Record<string, InitialAssessmentResponseType> = {
  Location: "LOCATION",
  Onset: "DURATION",
  Severity: "PAIN_SCALE",
  "Recurrent Symptom": "YES_NO"
};

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&mdash;/g, "-")
    .replace(/&deg;/g, "°")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function loadRawFile(): RawAlgorithmFile {
  const filePath = path.resolve(process.cwd(), "docs", "protocol-review", "data", "abdominal-pain-male.db.json");
  if (!existsSync(filePath)) {
    throw new Error(`Licensed STCC content file not found: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, "utf8")) as RawAlgorithmFile;
}

function buildProtocol(raw: RawAlgorithmFile): ClinicalContentPackageInput["protocols"][number] {
  const { algorithm } = raw;
  const protocolId = "stcc-abdominal-pain-male";

  const dispositionQuestions = raw.questions
    .filter((q) => q.DispositionLevel !== null)
    .sort((a, b) => (b.DispositionLevel! - a.DispositionLevel!) || (a.QuestionOrder - b.QuestionOrder));

  const redirectQuestions = raw.questions.filter((q) => q.DispositionLevel === null);

  const usedAdviceIds = new Set<number>();

  const questions: QuestionInput[] = dispositionQuestions.map((q, index) => {
    const level = q.DispositionLevel!;
    q.AdviceIDs.forEach((id) => usedAdviceIds.add(id));
    return {
      id: `stcc-abd-male-q${q.QuestionID}`,
      acuityOrder: index + 1,
      severity: LEVEL_TO_SEVERITY[level] ?? "Routine",
      questionTextEn: stripHtml(q.Question),
      dispositionCode: LEVEL_TO_DISPOSITION_CODE[level] ?? "PHCC_URGENT_CARE_OR_TELECONSULT",
      rationaleEn: q.Information ? stripHtml(q.Information) : `STCC disposition level ${level}.`,
      redFlag: level >= 90,
      keywords: [],
      careAdviceIds: q.AdviceIDs.map((id) => `stcc-abd-male-advice-${id}`),
      telemedicineEligible: q.TelemedicineEligible,
      dispositionLevel: level,
      questionOrder: q.QuestionOrder
    };
  });

  const careAdvice: CareAdviceInput[] = raw.advice
    .filter((advice) => usedAdviceIds.has(advice.AdviceID) && !advice.Internal)
    .map((advice) => {
      const owningQuestion = dispositionQuestions.find((q) => q.AdviceIDs.includes(advice.AdviceID));
      const level = owningQuestion?.DispositionLevel ?? undefined;
      return {
        id: `stcc-abd-male-advice-${advice.AdviceID}`,
        titleEn: advice.Title,
        instructionTextEn: advice.Content.join(" ") || advice.Title,
        dispositionCode: level ? LEVEL_TO_DISPOSITION_CODE[level] : undefined,
        warningSigns: [],
        displayOrder: advice.AlgorithmOrder,
        patientSendable: advice.PatientHealthInfo
      } satisfies CareAdviceInput;
    });

  const guidelineRedirects: GuidelineRedirectInput[] = redirectQuestions.map((q) => ({
    id: `stcc-abd-male-redirect-${q.QuestionID}`,
    questionOrder: q.QuestionOrder,
    promptTextEn: stripHtml(q.Question),
    targetProtocolTitleEn: (q.GotoGuideline ?? "").replace(/^Go to Guideline:\s*/, "").trim() || "See more appropriate guideline",
    hintEn: q.GotoGuideline ? stripHtml(q.GotoGuideline) : undefined
  }));

  const initialAssessmentQuestions = raw.initialAssessmentQuestions.map((iaq, index) => ({
    id: `stcc-abd-male-iaq-${index + 1}`,
    sequence: index + 1,
    responseType: CATEGORY_TO_RESPONSE_TYPE[iaq.Category] ?? ("OPEN_TEXT" as InitialAssessmentResponseType),
    promptTextEn: stripHtml(iaq.Question),
    clarificationPromptEn: iaq.Prompts.length > 0 ? stripHtml(iaq.Prompts.join(" ")) : undefined,
    required: true,
    emergencyKeywords: []
  }));

  return {
    id: protocolId,
    titleEn: algorithm.Title,
    clinicalDefinitionEn: algorithm.Definition.join(" "),
    backgroundInfoEn: algorithm.Background.KeyPoints.join(" "),
    ageMin: 18,
    genderRestriction: "male",
    mode: "after-hours",
    patientGroup: "adult",
    acuity: algorithm.Acuity,
    keywords: raw.searchwords.map((phrase) => ({
      phrase: phrase.toLowerCase(),
      weight: phrase.toLowerCase().includes("abdominal") || phrase.toLowerCase().includes("stomach") ? 100 : 70
    })),
    initialAssessmentQuestions,
    questions,
    careAdvice,
    guidelineRedirects,
    painSeverity: algorithm.PainSeverity.map((row) => ({
      level: row.level,
      cls: row.cls === "mild" ? "mild" : row.cls === "sevr" ? "severe" : "moderate",
      textEn: row.text
    })),
    backgroundDetail: {
      keyPointsEn: algorithm.Background.KeyPoints,
      causesUnder50En: algorithm.Background.CausesUnder50,
      causesOver50En: algorithm.Background.CausesOver50,
      locationTable: algorithm.Background.LocationTable.map((row) => ({
        locationEn: row.loc,
        sourceEn: row.source
      }))
    },
    authorship: {
      authorEn: algorithm.Author,
      expertReviewerEn: algorithm.Background.ExpertReviewer,
      lastRevisedIso: algorithm.LastRevised,
      lastReviewedIso: algorithm.LastReviewed,
      versionYear: algorithm.VersionYear,
      contentSet: algorithm.ContentSet
    },
    provenance: {
      generated: false,
      sourceKind: "licensed-stcc-import",
      sourceDocuments: [`${algorithm.Company} - ${algorithm.Title} (${algorithm.ContentSet}), ${algorithm.Copyright}`],
      contentNotice:
        "Licensed Schmitt-Thompson Clinical Content, imported under an active organizational content license. Requires clinical governance sign-off before any production use.",
      requiresClinicalValidation: true,
      licensedContentIncluded: false
    }
  };
}

function buildPackage(): ClinicalContentPackageInput {
  const raw = loadRawFile();
  return {
    release: {
      name: "STCC Licensed Content - Abdominal Pain (Male, Adult)",
      version: String(raw.algorithm.VersionYear),
      sourceType: "licensed-stcc",
      region: "QA",
      mode: "after-hours"
    },
    localizedDispositions: [
      {
        code: "HMC_EMERGENCY_DEPARTMENT",
        destinationNameEn: "Nearest Hamad Medical Corporation Emergency Department",
        routingNotesEn: "Use for adult emergency abdominal-pain presentations.",
        region: "QA"
      },
      {
        code: "HMC_URGENT_REVIEW",
        destinationNameEn: "HMC urgent review pathway",
        routingNotesEn: "Use for urgent but not immediately life-threatening abdominal-pain presentations.",
        region: "QA"
      },
      {
        code: "PHCC_URGENT_CARE_OR_TELECONSULT",
        destinationNameEn: "PHCC urgent care or IST teleconsult",
        routingNotesEn: "Use for lower-acuity review after emergency and urgent red flags are ruled out.",
        region: "QA"
      },
      {
        code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        destinationNameEn: "Self-care with callback precautions",
        routingNotesEn: "Use only when higher-acuity questions are negative and nurse review agrees.",
        region: "QA"
      }
    ],
    protocols: [buildProtocol(raw)]
  };
}

export const stccLicensedContent: ClinicalContentPackageInput = buildPackage();
