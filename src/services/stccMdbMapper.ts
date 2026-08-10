import sanitizeHtml from "sanitize-html";
import type { CareAdviceCategory, ClinicalContentPackageInput, InitialAssessmentResponseType } from "../types/clinicalContent.js";
import type { DispositionCode, Severity } from "../types/triage.js";
import { prisma } from "../db.js";

/**
 * Shared mapper from the real STCC vendor schema (verified via ODBC/ADOX
 * against a real sample .mdb - see the STCC realignment plan) to this app's
 * ClinicalContentPackageInput shape. Used by both:
 *  - src/data/stccLicensedContent/index.ts (file-based CLINICAL_CONTENT_SOURCE=
 *    stcc-licensed, reading docs/protocol-review/data/stcc-sample-extract.json)
 *  - src/services/clinicalContent.ts's loadContentPackageFromDatabase()
 *    (CLINICAL_CONTENT_SOURCE=database, reading the Mdb* Prisma vendor-mirror
 *    tables directly - see prisma/schema.prisma)
 *
 * Keeping one mapper means both sources produce byte-identical protocol
 * shapes regardless of whether the data comes from a JSON snapshot or live
 * Postgres rows.
 */

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];
type QuestionInput = ProtocolInput["questions"][number];
type CareAdviceInput = NonNullable<ProtocolInput["careAdvice"]>[number];
type GuidelineRedirectInput = NonNullable<ProtocolInput["guidelineRedirects"]>[number];
type InitialAssessmentQuestionInput = NonNullable<ProtocolInput["initialAssessmentQuestions"]>[number];

export type RawAlgorithm = {
  AlgorithmID: number;
  Title: string;
  Author: string | null;
  Copyright: string | null;
  Definition: string | null;
  DefinitionXHTML: string | null;
  Background: string | null;
  BackgroundXHTML: string | null;
  FirstAid: string | null;
  InitialAssessmentQuestions: string | null;
  Category: string | null;
  Group: string | null;
  Type: string | null;
  System: string | null;
  Anatomy: string | null;
  VersionYear: string | null;
  Status: string | null;
  Acuity: number | null;
  Gender: string | null;
  AgeGroup: string | null;
  Min_Age_Years: number | null;
  Max_Age_Years: number | null;
  LastUpDate: string | null;
  LastReviewDate: string | null;
  WH: boolean | null;
  BH: boolean | null;
  OA: boolean | null;
  CD: boolean | null;
  Hospice: boolean | null;
  Oncology: boolean | null;
  Prescription_Option: boolean | null;
  CMS_PRIVATE: boolean | null;
  SampleGuidelines: boolean | null;
};

export type RawQuestion = {
  QuestionID: number;
  AlgorithmID: number;
  QuestionOrder: number;
  Question: string;
  DispositionLevel: number | null;
  Information: string | null;
  TelemedicineEligible: boolean | null;
};

export type RawQuestionAdvice = {
  QuestionID: number;
  AdviceID: number;
  QuestionAdviceOrder: number | null;
};

export type RawAdvice = {
  AdviceID: number;
  AlgorithmID: number;
  Advice: string | null;
  Advice_XHTML: string | null;
  PatientHealthInfo: boolean | null;
  AdviceSnap: string | null;
  AlgorithmOrder: number | null;
};

export type RawDisposition = {
  LevelID: number;
  DispositionHeading: string;
  DispositionHeading_Telemedicine: string | null;
};

export type RawAlgorithmSearchWord = {
  AlgorithmID: number;
  SearchWord: string;
};

export type RawSupplemental = {
  SupplementalID: number;
  Title: string | null;
  Content: string | null;
  Content_XHTML: string | null;
  Category: string | null;
};

export type RawAlgorithmSupplemental = {
  AlgorithmID: number;
  SupplementalID: number;
};

export type CanonicalExtract = {
  algorithms: RawAlgorithm[];
  questions: RawQuestion[];
  questionAdvice: RawQuestionAdvice[];
  advice: RawAdvice[];
  dispositions: RawDisposition[];
  algorithmSearchWords: RawAlgorithmSearchWord[];
  supplementals: RawSupplemental[];
  algorithmSupplementals: RawAlgorithmSupplemental[];
};

// Real disposition-level ladder observed across the sample .mdb's 5 algorithms
// (34/54/9/26/48 counts for Abdominal Pain - Male match the earlier hand-built
// approximation, confirming counts were right even though field *structure*
// wasn't). This is a documented approximation of the real STCC levels down to
// this app's 4-tier Severity + 8-value DispositionCode routing scheme.
const LEVEL_TO_SEVERITY: Record<number, Severity> = {
  100: "Emergency",
  90: "Emergency",
  89: "Emergency",
  85: "Emergency",
  84: "Emergency",
  80: "Urgent",
  79: "Urgent",
  78: "Urgent",
  70: "Routine",
  65: "Routine",
  50: "Routine",
  20: "Routine",
  15: "Self-care"
};

const LEVEL_TO_DISPOSITION_CODE: Record<number, DispositionCode> = {
  100: "HMC_EMERGENCY_DEPARTMENT",
  90: "HMC_EMERGENCY_DEPARTMENT",
  89: "HMC_EMERGENCY_DEPARTMENT",
  85: "HMC_EMERGENCY_DEPARTMENT",
  84: "HMC_EMERGENCY_DEPARTMENT",
  80: "HMC_URGENT_REVIEW",
  79: "PHCC_URGENT_CARE_OR_TELECONSULT",
  78: "HMC_URGENT_REVIEW",
  70: "PHCC_URGENT_CARE_OR_TELECONSULT",
  65: "PHCC_URGENT_CARE_OR_TELECONSULT",
  50: "PHCC_URGENT_CARE_OR_TELECONSULT",
  20: "PHCC_URGENT_CARE_OR_TELECONSULT",
  15: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS"
};

// Matches the real Information-field free text STCC uses for pre-screen
// redirects, e.g. "Go to Guideline: Chest Pain (Adult) first - then use
// Abdominal Pain guideline." There is no structured GotoGuideline column in
// the real schema (verified via ODBC) - this is the only place the redirect
// target actually lives.
const GOTO_GUIDELINE_PATTERN = /Go to Guideline:\s*([^.\r\n]+)/i;

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

// The real vendor *_XHTML columns are licensed content, not user input - but
// "licensed" does not mean "safe to render as-is". This app's security
// posture (see the plain-text-only rendering this replaces) never trusted
// vendor markup by default, so this is never skipped even though the source
// is a paid data feed rather than an anonymous user. Only a narrow set of
// structural/formatting tags survive; anything else (script, style, iframe,
// event handler attributes, javascript: URLs) is stripped entirely.
function sanitizeXhtml(value: string): string {
  return sanitizeHtml(value, {
    allowedTags: ["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "u", "sub", "sup", "h1", "h2", "h3", "h4", "table", "thead", "tbody", "tr", "th", "td", "span"],
    allowedAttributes: {},
    allowedSchemes: [],
    disallowedTagsMode: "discard"
  }).trim();
}

// The vendor's own Advice_XHTML always leads with a real, complete,
// correctly-cased heading as its first tag (confirmed live against 20 real
// Mdb_Advice rows, e.g. "<strong>Call EMS 911 Now:</strong>", "<strong>Note
// to Triager - Ambulance Transport for Bedridden Patient:</strong>") - a far
// better title source than AdviceSnap, which is a hard VARCHAR(30) DB
// truncation that cuts off mid-word (e.g. "FIRST AID - DIRECT PRESSURE FO").
const LEADING_HEADING_PATTERN = /<(strong|b)>([^<]+)<\/\1>/i;

function extractAdviceTitle(advice: RawAdvice): string {
  if (advice.Advice_XHTML) {
    const match = LEADING_HEADING_PATTERN.exec(advice.Advice_XHTML);
    if (match) {
      const heading = stripHtml(match[2]).replace(/:\s*$/, "").trim();
      if (heading) {
        return heading;
      }
    }
  }
  if (advice.Advice) {
    const firstLine = stripHtml(advice.Advice.split(/\r?\n/)[0]).replace(/:\s*$/, "").trim();
    if (firstLine) {
      return firstLine;
    }
  }
  return advice.AdviceSnap?.trim() || `Care advice ${advice.AdviceID}`;
}

// No vendor-provided category column exists for Care Advice (confirmed
// against the real Mdb_Advice schema - only PatientHealthInfo, already used
// for patientSendable) - this is a small, explicit heuristic on the real
// title text above, claiming only the 3 patterns actually observed verbatim
// across every sampled protocol. Everything else defaults to GENERAL
// (ordinary patient-facing instructions) rather than guessing further.
function categorizeAdviceTitle(title: string): CareAdviceCategory {
  const lower = title.toLowerCase();
  if (lower.startsWith("note to triager")) {
    return "NOTE_TO_TRIAGER";
  }
  if (lower.startsWith("call back if")) {
    return "CALL_BACK_IF";
  }
  if (lower.startsWith("care advice")) {
    return "DISPOSITION";
  }
  return "GENERAL";
}

function genderRestrictionFor(gender: string | null): ProtocolInput["genderRestriction"] {
  if (gender === "M") return "male";
  if (gender === "F") return "female";
  return undefined;
}

function patientGroupFor(ageGroup: string | null): ProtocolInput["patientGroup"] {
  const normalized = (ageGroup ?? "").toLowerCase();
  if (normalized.includes("pediatric") || normalized.includes("child")) return "pediatric";
  if (normalized.includes("adult")) return "adult";
  return "adult";
}

// STCC's real InitialAssessmentQuestions column is a single free-text block
// (e.g. "1. LOCATION: \"Where does it hurt?\"\r\n2. RADIATION: ..."), not a
// structured table - there is no per-item Category/Choices/Map data in the
// real schema. This splits on the source's own numbered-line convention
// rather than inventing structure that isn't there; every item is OPEN_TEXT
// since there's no real signal for a richer response type.
function initialAssessmentQuestionsFor(rawText: string | null, protocolId: string): InitialAssessmentQuestionInput[] {
  if (!rawText) return [];
  const lines = rawText
    .split(/\r?\n(?=\d+\.\s)/)
    .map((line) => stripHtml(line))
    .filter((line) => line.length > 0);
  return lines.map((line, index) => ({
    id: `${protocolId}-iaq-${index + 1}`,
    sequence: index + 1,
    responseType: responseTypeFromCategoryLabel(line),
    promptTextEn: line.slice(0, 1000),
    required: true,
    emergencyKeywords: []
  }));
}

// Each real IAQ line is prefixed with a category label the vendor itself
// wrote into the text (e.g. "1. LOCATION: \"Where does it hurt?\"") - there is
// no separate structured Category column (verified via ODBC), but the label
// text itself is real, so deriving a richer widget type from it (matching
// this app's existing InitialAssessmentResponseType options) is honest
// parsing, not invented structure. Only labels with a clear, unambiguous
// correspondence are mapped; everything else stays OPEN_TEXT rather than
// guessing (e.g. CAUSE/MECHANISM/PATTERN have no obvious widget match).
const CATEGORY_LABEL_PATTERN = /^\d+\.\s*([A-Za-z ]+):/;

function responseTypeFromCategoryLabel(line: string): InitialAssessmentResponseType {
  const match = CATEGORY_LABEL_PATTERN.exec(line);
  const label = match ? match[1].trim().toUpperCase() : "";
  if (label === "LOCATION") return "LOCATION";
  if (label === "ONSET") return "DURATION";
  if (label === "RECURRENT SYMPTOM") return "YES_NO";
  if (label.includes("SEVERITY")) return "PAIN_SCALE";
  return "OPEN_TEXT";
}

function isRedirectLevel(levelId: number, dispositionsById: Map<number, RawDisposition>): boolean {
  const heading = dispositionsById.get(levelId)?.DispositionHeading ?? "";
  return heading.toLowerCase().includes("more appropriate guideline");
}

// Kebab-case slug of the title, matching this app's existing external-id
// convention (e.g. "stcc-abdominal-pain-male") - stable across re-extracts as
// long as STCC doesn't rename the guideline, unlike the raw AlgorithmID which
// is an internal vendor identifier not meant to be a public contract.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Resolves the app-facing string protocol id (e.g. "stcc-ankle-pain",
// consistent everywhere in API/DTOs/frontend/tests) to the real vendor
// integer AlgorithmID, by recomputing the same slug buildProtocol() derives
// for each MdbAlgorithm row. Used only where a real DB-level FK to
// MdbAlgorithm is needed (TriageQueueItem.matchedProtocolId,
// AviationTriageEncounter.protocolUsedId, VoiceCallSession.protocolId) -
// every other consumer keeps using the string id unchanged.
export async function resolveMdbAlgorithmId(protocolId: string | undefined): Promise<number | null> {
  if (!protocolId) {
    return null;
  }
  const algorithms = await prisma.mdbAlgorithm.findMany({ select: { algorithmId: true, title: true } });
  const match = algorithms.find((a) => `stcc-${slugify(a.title ?? "")}` === protocolId);
  return match?.algorithmId ?? null;
}

function buildProtocol(
  algorithm: RawAlgorithm,
  extract: CanonicalExtract,
  dispositionsById: Map<number, RawDisposition>
): ProtocolInput {
  const protocolId = `stcc-${slugify(algorithm.Title)}`;

  const algorithmQuestions = extract.questions
    .filter((q) => q.AlgorithmID === algorithm.AlgorithmID)
    .sort((a, b) => (b.DispositionLevel ?? 0) - (a.DispositionLevel ?? 0) || a.QuestionOrder - b.QuestionOrder);

  const dispositionQuestions = algorithmQuestions.filter(
    (q) => q.DispositionLevel !== null && !isRedirectLevel(q.DispositionLevel, dispositionsById)
  );
  const redirectQuestions = algorithmQuestions.filter(
    (q) => q.DispositionLevel !== null && isRedirectLevel(q.DispositionLevel, dispositionsById)
  );

  const adviceOrderByQuestion = new Map<number, RawQuestionAdvice[]>();
  for (const qa of extract.questionAdvice) {
    const list = adviceOrderByQuestion.get(qa.QuestionID) ?? [];
    list.push(qa);
    adviceOrderByQuestion.set(qa.QuestionID, list);
  }

  const questions: QuestionInput[] = dispositionQuestions.map((q, index) => {
    const level = q.DispositionLevel!;
    const linkedAdvice = (adviceOrderByQuestion.get(q.QuestionID) ?? []).sort(
      (a, b) => (a.QuestionAdviceOrder ?? 0) - (b.QuestionAdviceOrder ?? 0)
    );
    const strippedInformation = q.Information ? stripHtml(q.Information) : "";
    // Real STCC Disposition.DispositionHeading_Telemedicine - the parallel
    // telemedicine-consult heading for this question's disposition level
    // (e.g. "See PCP or Video Visit Within 24 Hours"), surfaced next to the
    // telemedicine-eligible badge rather than only the standard heading.
    const telemedicineHeading = dispositionsById.get(level)?.DispositionHeading_Telemedicine;
    return {
      id: `${protocolId}-q${q.QuestionID}`,
      acuityOrder: index + 1,
      severity: LEVEL_TO_SEVERITY[level] ?? "Routine",
      questionTextEn: stripHtml(q.Question),
      dispositionCode: LEVEL_TO_DISPOSITION_CODE[level] ?? "PHCC_URGENT_CARE_OR_TELECONSULT",
      rationaleEn: strippedInformation.length > 0 ? strippedInformation : `STCC disposition level ${level}.`,
      redFlag: level >= 90,
      keywords: [],
      careAdviceIds: linkedAdvice.map((qa) => `${protocolId}-advice-${qa.AdviceID}`),
      telemedicineEligible: q.TelemedicineEligible ?? false,
      telemedicineNotesEn: q.TelemedicineEligible && telemedicineHeading ? telemedicineHeading : undefined,
      dispositionLevel: level,
      questionOrder: q.QuestionOrder
    };
  });

  const supplementals: NonNullable<ProtocolInput["supplementals"]> = extract.algorithmSupplementals
    .filter((link) => link.AlgorithmID === algorithm.AlgorithmID)
    .map((link, index) => {
      const supplemental = extract.supplementals.find((s) => s.SupplementalID === link.SupplementalID);
      return {
        id: `${protocolId}-supplemental-${link.SupplementalID}`,
        titleEn: supplemental?.Title?.trim() || `Reference ${link.SupplementalID}`,
        supplementalType: supplemental?.Category?.trim() || "reference",
        plainTextEn: supplemental?.Content ? stripHtml(supplemental.Content) : "See guideline for details.",
        sanitizedHtmlEn: supplemental?.Content_XHTML ? sanitizeXhtml(supplemental.Content_XHTML) : undefined,
        displayOrder: index
      };
    });

  const careAdvice: CareAdviceInput[] = extract.advice
    .filter((advice) => advice.AlgorithmID === algorithm.AlgorithmID)
    .map((advice) => {
      const owningQuestion = dispositionQuestions.find((q) =>
        (adviceOrderByQuestion.get(q.QuestionID) ?? []).some((qa) => qa.AdviceID === advice.AdviceID)
      );
      const level = owningQuestion?.DispositionLevel ?? undefined;
      const titleEn = extractAdviceTitle(advice);
      return {
        id: `${protocolId}-advice-${advice.AdviceID}`,
        titleEn,
        instructionTextEn: advice.Advice ? stripHtml(advice.Advice) : advice.AdviceSnap?.trim() || "See guideline.",
        sanitizedHtmlEn: advice.Advice_XHTML ? sanitizeXhtml(advice.Advice_XHTML) : undefined,
        dispositionCode: level ? LEVEL_TO_DISPOSITION_CODE[level] : undefined,
        warningSigns: [],
        displayOrder: advice.AlgorithmOrder ?? 0,
        patientSendable: advice.PatientHealthInfo ?? false,
        adviceCategory: categorizeAdviceTitle(titleEn)
      } satisfies CareAdviceInput;
    });

  const guidelineRedirects: GuidelineRedirectInput[] = redirectQuestions.map((q) => {
    const match = q.Information ? GOTO_GUIDELINE_PATTERN.exec(q.Information) : null;
    return {
      id: `${protocolId}-redirect-${q.QuestionID}`,
      questionOrder: q.QuestionOrder,
      promptTextEn: stripHtml(q.Question),
      targetProtocolTitleEn: match ? match[1].trim() : "See more appropriate guideline",
      hintEn: q.Information ? stripHtml(q.Information) : undefined
    };
  });

  return {
    id: protocolId,
    titleEn: algorithm.Title,
    clinicalDefinitionEn: algorithm.Definition ? stripHtml(algorithm.Definition) : undefined,
    clinicalDefinitionSanitizedHtmlEn: algorithm.DefinitionXHTML ? sanitizeXhtml(algorithm.DefinitionXHTML) : undefined,
    backgroundInfoEn: algorithm.Background ? stripHtml(algorithm.Background) : undefined,
    backgroundInfoSanitizedHtmlEn: algorithm.BackgroundXHTML ? sanitizeXhtml(algorithm.BackgroundXHTML) : undefined,
    ageMin: algorithm.Min_Age_Years ?? undefined,
    ageMax: algorithm.Max_Age_Years ?? undefined,
    genderRestriction: genderRestrictionFor(algorithm.Gender),
    mode: "after-hours",
    patientGroup: patientGroupFor(algorithm.AgeGroup),
    acuity: algorithm.Acuity ?? undefined,
    // Real vendor search terms (AlgorithmSearchWords -> SearchWord, verified
    // via ODBC), e.g. "ACHILLES TENDON", "ANKLE FRACTURE" - powers scoreProtocol()'s
    // keyword matching in clinicalContent.ts so a caller who doesn't say the
    // exact protocol title (e.g. "twisted my ankle") can still match.
    keywords: extract.algorithmSearchWords
      .filter((row) => row.AlgorithmID === algorithm.AlgorithmID)
      .map((row) => ({ phrase: row.SearchWord.toLowerCase(), language: "en", weight: 70, source: "release" })),
    initialAssessmentQuestions: initialAssessmentQuestionsFor(algorithm.InitialAssessmentQuestions, protocolId),
    questions,
    careAdvice,
    guidelineRedirects,
    // Real STCC Supplemental content (OTC drug dosage tables, reviewer lists,
    // etc. - Supplemental/AlgorithmSupplemental, verified via ODBC). Not every
    // protocol has one; empty array is expected and correct where none exist.
    supplementals,
    authorship: {
      authorEn: algorithm.Author ?? undefined,
      lastRevisedIso: algorithm.LastUpDate ?? undefined,
      lastReviewedIso: algorithm.LastReviewDate ?? undefined,
      versionYear: algorithm.VersionYear ? Number(algorithm.VersionYear) : undefined,
      contentSet: algorithm.Group ?? undefined
    },
    provenance: {
      generated: false,
      sourceKind: "licensed-stcc-import",
      sourceDocuments: [algorithm.Copyright ?? "Schmitt-Thompson Clinical Content (STCC)"],
      contentNotice:
        "Licensed Schmitt-Thompson Clinical Content, imported under an active organizational content license. Requires clinical governance sign-off before any production use.",
      requiresClinicalValidation: true,
      licensedContentIncluded: false
    }
  };
}

export function mapCanonicalExtractToPackage(extract: CanonicalExtract): ClinicalContentPackageInput {
  const dispositionsById = new Map(extract.dispositions.map((d) => [d.LevelID, d]));

  return {
    release: {
      name: "STCC Licensed Content - Real Sample Extract",
      version: String(extract.algorithms[0]?.VersionYear ?? "unknown"),
      sourceType: "licensed-stcc",
      region: "QA",
      mode: "after-hours"
    },
    localizedDispositions: [
      {
        code: "HMC_EMERGENCY_DEPARTMENT",
        destinationNameEn: "Nearest Hamad Medical Corporation Emergency Department",
        routingNotesEn: "Use for emergency presentations.",
        region: "QA"
      },
      {
        code: "HMC_URGENT_REVIEW",
        destinationNameEn: "HMC urgent review pathway",
        routingNotesEn: "Use for urgent but not immediately life-threatening presentations.",
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
    protocols: extract.algorithms.map((algorithm) => buildProtocol(algorithm, extract, dispositionsById))
  };
}
