import { batch17Protocols } from "../../../../../src/data/openSourceGuidelines/batch17.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

const femaleOnly = [
  { age: "Adult" as const, gender: "Female" as const },
  { age: "Child" as const, gender: "Female" as const },
];

generateDemographicBatch({
  batch: "17",
  root: "docs/protocol-review/catalog/open-source/batch-17",
  protocols: batch17Protocols,
  selectedIds: [
    "oscg-pregnancy-itching",
    "oscg-pregnancy-urination-pain",
    "oscg-vaginal-discharge",
    "oscg-pubic-lice",
    "oscg-postpartum-depression",
    "oscg-heart-rate-and-heartbeat-questions",
    "oscg-abdomen-bloating-and-swelling",
  ],
  variants: {
    "oscg-pregnancy-itching": femaleOnly,
    "oscg-pregnancy-urination-pain": femaleOnly,
    "oscg-vaginal-discharge": femaleOnly,
    "oscg-postpartum-depression": femaleOnly,
  },
  redirects: {
    "oscg-pregnancy-itching": {
      question: "Is a widespread rash the main concern rather than pregnancy-related itching without a rash?",
      info: "A widespread rash belongs in the Rash or Redness - Widespread pathway.",
      target: "Rash or Redness - Widespread",
    },
    "oscg-pregnancy-urination-pain": {
      question: "Is pain in the side or back the main concern rather than pain primarily during urination?",
      info: "Pain focused in the side or back belongs in the Flank Pain pathway.",
      target: "Flank Pain",
    },
    "oscg-vaginal-discharge": {
      question: "Are genital sores or open lesions the main concern rather than vaginal discharge?",
      info: "Open or non-healing lesions belong in the Sores pathway.",
      target: "Sores",
    },
    "oscg-pubic-lice": {
      question: "Are lice or eggs confined to scalp hair rather than pubic or coarse body hair?",
      info: "Scalp lice belong in the Head Lice pathway.",
      target: "Head Lice",
    },
    "oscg-postpartum-depression": {
      question: "Are thoughts of suicide or immediate self-harm the primary concern?",
      info: "Suicidal thoughts or immediate self-harm risk belong in the Suicide Concerns pathway.",
      target: "Suicide Concerns",
    },
    "oscg-heart-rate-and-heartbeat-questions": {
      question: "Was a faint or temporary loss of consciousness the main event?",
      info: "A faint or temporary loss of consciousness belongs in the Fainting pathway.",
      target: "Fainting",
    },
    "oscg-abdomen-bloating-and-swelling": {
      question: "Is nausea or vomiting the main concern rather than abdominal bloating or swelling?",
      info: "Symptoms dominated by nausea or vomiting belong in the Nausea pathway.",
      target: "Nausea",
    },
  },
  startId: 1365,
  endId: 1384,
  version: "batch17-applicability-aware-expansion-2026-07-25",
  excludedNotes: [
    "Vaginal Bleeding - Postmenopausal and Menopause Symptoms and Questions were deferred because only Adult Female variants are applicable and the 20-record batch was filled without fabricating other demographics.",
    "Opioid Use and Problems was excluded because its record cites generalized emergency knowledge rather than a named public source.",
    "Pregnancy, vaginal, and postpartum families are generated only as Female variants; no Male applicability was fabricated.",
  ],
});
