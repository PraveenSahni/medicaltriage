import type {
  ClinicalContentProvenance,
  ClinicalContentQuestion
} from "../../../types/clinicalContent.js";
import type { DispositionCode } from "../../../types/triage.js";

/**
 * Reusable helpers for authoring open-source-guideline protocols at scale.
 * Cuts the boilerplate that was hand-duplicated 4x in
 * `../openSourceClinicalRulesContent.ts` for the first wave of formal-rule
 * protocols. Every protocol built from these still needs its own
 * source-specific criteria TAQs, care advice, and provenance - these helpers
 * only cover the parts that are genuinely repeated across protocols: the
 * universal pre-screen emergency question (not part of any named source,
 * see rationale text) and the provenance object shape.
 */

export type BodySystem =
  | "respiratory"
  | "cardiac"
  | "gi"
  | "msk"
  | "neuro"
  | "genitourinary"
  | "ent"
  | "dermatologic"
  | "psychiatric"
  | "general";

type EmergencyScreenPreset = {
  questionTextEn: string;
  keywords: string[];
};

const EMERGENCY_SCREEN_PRESETS: Record<BodySystem, EmergencyScreenPreset> = {
  respiratory: {
    questionTextEn:
      "Is there severe difficulty breathing, blue lips or face, inability to speak in full sentences, or is the person confused or very difficult to rouse?",
    keywords: ["breathing difficulty", "blue lips", "cannot speak sentences", "confused"]
  },
  cardiac: {
    questionTextEn:
      "Is there crushing or severe chest pain, chest pain with shortness of breath or fainting, or has the person collapsed or lost consciousness?",
    keywords: ["crushing chest pain", "chest pain with fainting", "collapsed", "lost consciousness"]
  },
  gi: {
    questionTextEn:
      "Is there shock (cold/pale/clammy skin, too weak to stand, rapid pulse), vomiting blood, or is the person confused or difficult to awaken?",
    keywords: ["shock", "vomiting blood", "confused", "difficult to awaken"]
  },
  msk: {
    questionTextEn:
      "Is there an obvious deformity, visible bone, open wound, uncontrolled bleeding, or is the limb cold, pale, blue, or numb?",
    keywords: ["deformity", "bone visible", "open wound", "cold limb", "numb"]
  },
  neuro: {
    questionTextEn:
      "Is there sudden weakness or numbness on one side, slurred speech, a severe sudden headache ('worst ever'), a seizure happening now, or loss of consciousness?",
    keywords: ["one-sided weakness", "slurred speech", "worst headache", "seizure", "unconscious"]
  },
  genitourinary: {
    questionTextEn:
      "Is there severe uncontrolled bleeding, signs of shock (cold/pale/clammy skin, too weak to stand), or is the person confused or difficult to awaken?",
    keywords: ["severe bleeding", "shock", "confused", "difficult to awaken"]
  },
  ent: {
    questionTextEn:
      "Is there drooling or inability to swallow saliva, a muffled ('hot potato') voice, stridor, severe difficulty breathing, or inability to open the mouth fully?",
    keywords: ["drooling", "cannot swallow", "muffled voice", "stridor", "cannot open mouth"]
  },
  dermatologic: {
    questionTextEn:
      "Is there rapidly spreading redness or swelling, signs of an allergic reaction (throat tightness, facial swelling, difficulty breathing), or signs of shock?",
    keywords: ["rapidly spreading", "allergic reaction", "throat tightness", "shock"]
  },
  psychiatric: {
    questionTextEn:
      "Is there an immediate plan and means to harm self or others right now, or has an attempt already been made?",
    keywords: ["suicidal plan", "means to harm", "attempt made"]
  },
  general: {
    questionTextEn:
      "Does this sound like a life-threatening emergency to the triager (e.g., shock, severe difficulty breathing, unresponsiveness)?",
    keywords: ["life-threatening", "shock", "unresponsive"]
  }
};

/**
 * Universal pre-screen emergency question, added ahead of every source's own
 * criteria - this is standard emergency-medicine practice, not part of the
 * named rule or guideline itself, and must be documented as such via
 * `rationaleEn` (already done below) so provenance stays honest.
 */
export function buildUniversalEmergencyScreenQuestion(options: {
  idPrefix: string;
  system: BodySystem;
  dispositionCode: DispositionCode;
  careAdviceId: string;
  sourceLabelEn: string;
}): ClinicalContentQuestion {
  const preset = EMERGENCY_SCREEN_PRESETS[options.system];
  return {
    id: `${options.idPrefix}-q0-emergency`,
    acuityOrder: 1,
    severity: "Emergency",
    questionTextEn: preset.questionTextEn,
    dispositionCode: options.dispositionCode,
    rationaleEn: `Universal emergency rule-out added ahead of ${options.sourceLabelEn} itself (not part of the source guidance) - these are standard emergency-medicine red flags requiring immediate emergency care regardless of the criteria below.`,
    redFlag: true,
    keywords: preset.keywords,
    careAdviceIds: [options.careAdviceId],
    telemedicineEligible: false,
    dispositionLevel: 100,
    questionOrder: 1
  };
}

/**
 * Provenance for a protocol decomposed from real, cited public guidance prose
 * (NHS.UK / Healthdirect / MedlinePlus "when to seek help" pages) rather than
 * a formal named point-score rule. Distinct sourceKind from
 * "open-source-clinical-decision-rule" (used by the 4 formal-rule protocols)
 * so provenance stays honest about the lower-rigor, decomposed-prose origin.
 */
export function buildGuidelineProvenance(options: {
  sourceDocuments: string[];
  contentNotice: string;
}): ClinicalContentProvenance {
  return {
    generated: false,
    sourceKind: "open-source-guideline-decomposition",
    sourceDocuments: options.sourceDocuments,
    contentNotice: options.contentNotice,
    requiresClinicalValidation: true,
    licensedContentIncluded: false
  };
}
