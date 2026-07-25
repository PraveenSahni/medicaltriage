import { batch23Protocols } from "../../../../../src/data/openSourceGuidelines/batch23.js";
import { batch21Protocols } from "../../../../../src/data/openSourceGuidelines/batch21.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

const supplementalIds = [
  "oscg-elbow-pain",
  "oscg-elbow-swelling",
  "oscg-finger-pain",
  "oscg-foot-pain",
  "oscg-hand-swelling",
];

const pediatricSupplements = supplementalIds.map((id) => {
  const source = batch21Protocols.find((protocol) => protocol.id === id);
  if (!source) throw new Error(`Missing Batch 21 supplement source: ${id}`);
  const selfCareAdviceIds = new Set(
    source.questions
      .filter((question) => question.dispositionLevel === 15)
      .flatMap((question) => question.careAdviceIds),
  );
  const remapAdviceId = (adviceId: string) =>
    selfCareAdviceIds.has(adviceId) ? `${adviceId}-child-review` : adviceId;
  return {
    ...source,
    id: `${source.id}-child`,
    canonicalSourceProtocolId: source.id,
    questions: source.questions.map((question) =>
      question.dispositionLevel === 15
        ? {
            ...question,
            severity: "Routine",
            questionTextEn: `Does the child have ${source.titleEn.toLowerCase()} without the urgent features above?`,
            dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
            rationaleEn: "NHS.UK joint pain guidance specifically advises clinical review when a child has joint problems.",
            careAdviceIds: question.careAdviceIds.map(remapAdviceId),
            dispositionLevel: 40,
          }
        : {
            ...question,
            careAdviceIds: question.careAdviceIds.map(remapAdviceId),
          },
    ),
    careAdvice: source.careAdvice.map((advice) =>
      selfCareAdviceIds.has(advice.id)
        ? {
            ...advice,
            id: remapAdviceId(advice.id),
            titleEn: `Clinical review for childhood ${source.titleEn.toLowerCase()}`,
            instructionTextEn: `Arrange primary-care review for the child's ${source.titleEn.toLowerCase()}. Rest the affected area when needed and use a wrapped cold pack for up to 20 minutes while awaiting review.`,
            dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
            adviceCategory: "DISPOSITION",
          }
        : advice,
    ),
  };
});

const childOnly = [
  { age: "Child" as const, gender: "Male" as const },
  { age: "Child" as const, gender: "Female" as const },
];
const adultOnly = [
  { age: "Adult" as const, gender: "Male" as const },
  { age: "Adult" as const, gender: "Female" as const },
];
const infantOnly = [
  { age: "Child" as const, gender: "Male" as const, ageMin: 0, ageMax: 0, ageDisplay: "Infant (younger than 3 months)" },
  { age: "Child" as const, gender: "Female" as const, ageMin: 0, ageMax: 0, ageDisplay: "Infant (younger than 3 months)" },
];
const supplementProtocolIds = pediatricSupplements.map((protocol) => protocol.id);
const selectedIds = [
  "oscg-bedwetting",
  "oscg-crying-before-3-months",
  "oscg-eating-disorders",
  "oscg-icd-and-pacemaker-symptoms",
  ...supplementProtocolIds,
];
const crashRedirect = {
  question: "Did this joint problem begin with a motor vehicle crash or as part of a multi-system crash injury?",
  info: "A motor vehicle crash or multi-system crash injury belongs in the Motor Vehicle Accident pathway.",
  target: "Motor Vehicle Accident",
};

generateDemographicBatch({
  batch: "23",
  root: "docs/protocol-review/catalog/open-source/batch-23",
  protocols: [...batch23Protocols, ...pediatricSupplements],
  selectedIds,
  variants: {
    "oscg-bedwetting": childOnly,
    "oscg-crying-before-3-months": infantOnly,
    "oscg-icd-and-pacemaker-symptoms": adultOnly,
    ...Object.fromEntries(supplementProtocolIds.map((id) => [id, childOnly])),
  },
  redirects: {
    "oscg-bedwetting": {
      question: "Is visible blood in urine the main concern rather than nighttime bedwetting?",
      info: "Visible blood in urine belongs in the Urine - Blood In pathway.",
      target: "Urine - Blood In",
    },
    "oscg-crying-before-3-months": {
      question: "Is breathing difficulty the main concern rather than crying or suspected colic?",
      info: "Breathing difficulty belongs in the Breathing Difficulty pathway.",
      target: "Breathing Difficulty",
    },
    "oscg-eating-disorders": {
      question: "Are thoughts of suicide or immediate self-harm the primary concern?",
      info: "Suicidal thoughts or immediate self-harm risk belong in the Suicide Concerns pathway.",
      target: "Suicide Concerns",
    },
    "oscg-icd-and-pacemaker-symptoms": {
      question: "Are palpitations or heartbeat questions present without an implanted-device concern?",
      info: "Heartbeat concerns without an implanted-device issue belong in the Heart Rate and Heartbeat Questions pathway.",
      target: "Heart Rate and Heartbeat Questions",
    },
    ...Object.fromEntries(supplementProtocolIds.map((id) => [id, crashRedirect])),
  },
  startId: 1485,
  endId: 1504,
  version: "batch23-source-supported-carry-forward-2026-07-25",
  excludedNotes: [
    "Breath-Holding Spell, marijuana, hallucinogenic mushrooms, general substance use, and increased fluid intake were excluded because their records lack a dedicated named source.",
    "Crying - 3 Months and Older was excluded because it generalizes a source scoped to younger infant colic.",
    "Ten remaining slots use source-supported pediatric joint-review variants carried forward from Batch 21; adult self-care was replaced with the source's explicit child clinical-review instruction.",
  ],
});
