import { batch19Protocols } from "../../../../../src/data/openSourceGuidelines/batch19.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "19",
  root: "docs/protocol-review/catalog/open-source/batch-19",
  protocols: batch19Protocols,
  selectedIds: [
    "oscg-eye-redness",
    "oscg-blood-pressure-low",
    "oscg-influenza-suspected",
    "oscg-hernia",
    "oscg-blister-foot-hand",
  ],
  redirects: {
    "oscg-eye-redness": {
      question: "Are itching, watering, and allergy symptoms the main concern without significant pain, injury, chemical exposure, or vision change?",
      info: "Eye symptoms dominated by an allergic pattern belong in the Eye - Allergy pathway.",
      target: "Eye - Allergy",
    },
    "oscg-blood-pressure-low": {
      question: "Was there a brief loss of consciousness with recovery, rather than ongoing low blood pressure symptoms?",
      info: "A brief loss of consciousness belongs in the Fainting pathway.",
      target: "Fainting",
    },
    "oscg-influenza-suspected": {
      question: "Is confirmed or suspected COVID-19 the primary concern?",
      info: "Confirmed or suspected COVID-19 belongs in the authored COVID-19 - Diagnosed or Suspected pathway.",
      target: "COVID-19 - Diagnosed or Suspected",
    },
    "oscg-hernia": {
      question: "Is nausea or vomiting the main concern without a new or known lump or bulge?",
      info: "Nausea or vomiting without a hernia concern belongs in the Nausea pathway.",
      target: "Nausea",
    },
    "oscg-blister-foot-hand": {
      question: "Did the blister form directly after a heat, hot-liquid, or flame burn?",
      info: "A blister caused by thermal injury belongs in the Burns - Thermal pathway.",
      target: "Burns - Thermal",
    },
  },
  startId: 1405,
  endId: 1424,
  version: "batch19-learned-safeguard-expansion-2026-07-25",
  adaptText: (value, context) => {
    if (context.protocol.id !== "oscg-influenza-suspected") return value;
    if (context.age === "Adult" && context.gender === "Female") return value;
    if (context.age === "Adult") {
      return value
        .replace(", pregnant or recently gave birth", "")
        .replace(", pregnancy", "");
    }
    return value
      .replace("Is the person 65 or older, pregnant or recently gave birth, living with", "Is the child living with")
      .replace("Any chronic conditions, pregnancy, or age 65+?", "Any chronic conditions or weakened immunity?");
  },
  excludedNotes: [
    "Bruises was excluded because its source is standard first-aid and unexplained-bruising knowledge rather than one dedicated cited public protocol.",
    "Drowning and Submersion Event and Electric Shock or Lightning Injury were excluded because their source is generalized emergency-medicine knowledge rather than a dedicated cited public protocol.",
    "Groin Injury and Strain and Eyelid Swelling were excluded because their sources explicitly generalize other injury or eye pathways.",
  ],
});
