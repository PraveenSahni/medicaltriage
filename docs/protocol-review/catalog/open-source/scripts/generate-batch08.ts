import { batch08Protocols } from "../../../../../src/data/openSourceGuidelines/batch08.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "08",
  root: "docs/protocol-review/catalog/open-source/batch-08",
  protocols: batch08Protocols,
  selectedIds: [
    "oscg-altitude-sickness",
    "oscg-hoarseness",
    "oscg-impetigo",
    "oscg-immunization-reactions",
    "oscg-insect-bite-generic",
  ],
  redirects: {
    "oscg-altitude-sickness": {
      question: "Did symptoms begin after exposure to a heater, fire, generator, engine, or enclosed-space fumes rather than after ascent to high altitude?",
      info: "A suspected toxic gas exposure belongs in the Carbon Monoxide Exposure pathway.",
      target: "Carbon Monoxide Exposure",
    },
    "oscg-hoarseness": {
      question: "Are sudden throat or tongue swelling, wheeze, faintness, confusion, or collapse the main concern?",
      info: "Sudden systemic allergic-reaction features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-impetigo": {
      question: "Is this a localized rash or redness without honey-colored crusts, weeping sores, or suspected impetigo?",
      info: "The localized-rash family is not generated. Arrange clinical review through the Qatar route approved by governance (GOVERNANCE_REQUIRED).",
      dispositionLevel: 50,
      careAdviceId: "oscg-impetigo-routine-advice",
    },
    "oscg-immunization-reactions": {
      question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse occurring after vaccination?",
      info: "Systemic allergic-reaction features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-insect-bite-generic": {
      question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse the main concern?",
      info: "Systemic allergic-reaction features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
  },
  startId: 1185,
  endId: 1204,
  version: "batch08-learned-safeguard-expansion-2026-07-25",
  redirectTelemedicineEligible: false,
  excludedNotes: [
    "Jock Itch was excluded because its source note generalizes an Athlete's Foot page.",
    "Genital Injury - Male was excluded because Female variants would be clinically inapplicable.",
  ],
});
