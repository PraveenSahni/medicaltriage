import { batch16Protocols } from "../../../../../src/data/openSourceGuidelines/batch16.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "16",
  root: "docs/protocol-review/catalog/open-source/batch-16",
  protocols: batch16Protocols,
  selectedIds: [
    "oscg-warts",
    "oscg-falls-and-falling",
    "oscg-tooth-extraction",
    "oscg-cough-chronic",
    "oscg-alcohol-use-and-problems",
  ],
  redirects: {
    "oscg-warts": {
      question: "Is this an open traumatic skin wound rather than a wart or verruca?",
      info: "An open traumatic wound belongs in the Skin Injury pathway.",
      target: "Skin Injury",
    },
    "oscg-falls-and-falling": {
      question: "Did fainting or a temporary loss of consciousness occur before the fall?",
      info: "A collapse caused by fainting belongs in the Fainting pathway.",
      target: "Fainting",
    },
    "oscg-tooth-extraction": {
      question: "Is this an active cut or laceration in the mouth rather than a healing tooth-extraction socket?",
      info: "An active cut or laceration belongs in the Cuts and Lacerations pathway.",
      target: "Cuts and Lacerations",
    },
    "oscg-cough-chronic": [
      {
        question: "Is there major coughing of blood, breathing difficulty, blue or grey colour, collapse, confusion, or crushing chest pain?",
        info: "Major haemoptysis or cardiopulmonary compromise remains a direct Qatar 999 emergency and must not redirect a young child into the age-12-and-older Coughing Up Blood protocol.",
        dispositionLevel: 100,
        careAdviceId: "oscg-coughchronic-emergency-advice",
      },
      {
        question: "Without an emergency feature, is any blood present in the sputum?",
        info: "Any haemoptysis requires governed prompt in-person assessment. This direct disposition preserves support for children younger than 12 without a permissive age-incompatible redirect.",
        dispositionLevel: 70,
        careAdviceId: "oscg-coughchronic-urgent-advice",
      },
    ],
    "oscg-alcohol-use-and-problems": {
      question: "Is the immediate concern a suspected acute alcohol poisoning or overdose with reduced responsiveness rather than ongoing alcohol use?",
      info: "Suspected acute alcohol poisoning belongs in the Poisoning pathway.",
      target: "Poisoning",
    },
  },
  startId: 1345,
  endId: 1364,
  version: "batch16-learned-safeguard-expansion-2026-07-25",
  excludedNotes: [
    "Sickle Cell Disease - Acute Pain was deferred because its emergency thresholds include uncited generalized hematology knowledge requiring specialist governance.",
    "Domestic Violence was deferred pending verified Qatar safeguarding contacts and reporting pathways.",
    "Marine Animal Stings and Bites - North America was excluded because its geography and generalized evidence are inappropriate for Qatar.",
    "Contraception - Birth Control Shot was excluded because it requires female-only applicability rather than four demographic variants.",
    "Smoking - Tobacco Use and Problems was excluded because its record cites generalized knowledge rather than a named public source document.",
  ],
});
