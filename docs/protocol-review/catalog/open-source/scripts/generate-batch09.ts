import { batch09Protocols } from "../../../../../src/data/openSourceGuidelines/batch09.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "09",
  root: "docs/protocol-review/catalog/open-source/batch-09",
  protocols: batch09Protocols,
  selectedIds: [
    "oscg-motor-vehicle-accident",
    "oscg-motion-sickness",
    "oscg-mouth-ulcers",
    "oscg-hay-fever",
    "oscg-nausea",
  ],
  redirects: {
    "oscg-motor-vehicle-accident": {
      question: "Was there no motor vehicle crash, with back pain or stiffness now being the primary concern?",
      info: "Back symptoms without a motor vehicle accident belong in the Back Pain pathway.",
      target: "Back Pain",
    },
    "oscg-motion-sickness": {
      question: "Is nausea occurring without travel, movement, or motion exposure?",
      info: "Nausea not triggered by motion belongs in the general Nausea pathway.",
      target: "Nausea",
    },
    "oscg-mouth-ulcers": {
      question: "Are fluid-filled blisters on or around the lips the main concern rather than ulcers inside the mouth?",
      info: "The cold-sore family is not generated. Arrange in-person clinical assessment through the Qatar route approved by governance (GOVERNANCE_REQUIRED).",
      dispositionLevel: 50,
      careAdviceId: "oscg-mouthulcer-routine-advice",
    },
    "oscg-hay-fever": {
      question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse the main concern?",
      info: "Systemic allergic-reaction features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-nausea": {
      question: "Are frequent loose or watery stools the main concern rather than nausea itself?",
      info: "A presentation dominated by loose or watery stools belongs in the Diarrhea pathway.",
      target: "Diarrhea",
    },
  },
  startId: 1205,
  endId: 1224,
  version: "batch09-learned-safeguard-expansion-2026-07-25",
  redirectTelemedicineEligible: false,
  excludedNotes: [
    "Menstrual Cramps and Menstrual Period - Missed or Late were excluded because Male variants are clinically inapplicable.",
    "Meningitis Exposure was excluded because its source note identifies the exposure-management tier as an inference not directly covered by the cited page.",
  ],
});
