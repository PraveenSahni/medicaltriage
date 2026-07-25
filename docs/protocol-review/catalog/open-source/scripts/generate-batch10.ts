import { batch10Protocols } from "../../../../../src/data/openSourceGuidelines/batch10.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "10",
  root: "docs/protocol-review/catalog/open-source/batch-10",
  protocols: batch10Protocols,
  selectedIds: [
    "oscg-nose-injury",
    "oscg-neurologic-deficit",
    "oscg-puncture-wound",
    "oscg-mosquito-bite",
    "oscg-poison-ivy-oak-sumac",
  ],
  redirects: {
    "oscg-nose-injury": [
      {
        question: "Is there a button battery, paired magnets, breathing difficulty, choking, severe bleeding, marked distress, or reduced responsiveness associated with suspected material in the nose?",
        info: "The foreign-body family is not generated. Treat these as an emergency and call Qatar 999; do not attempt removal.",
        dispositionLevel: 100,
        careAdviceId: "oscg-noseinjury-emergency-advice",
      },
      {
        question: "Is other food, an object, or foreign material inside the nose the primary concern rather than an injury, without the emergency features above?",
        info: "The foreign-body family is not generated. Arrange urgent in-person assessment through the Qatar route approved by governance (GOVERNANCE_REQUIRED); do not attempt removal.",
        dispositionLevel: 70,
        careAdviceId: "oscg-noseinjury-urgent-advice",
      },
    ],
    "oscg-neurologic-deficit": {
      question: "Was there a brief faint with full recovery and no ongoing weakness, speech, vision, balance, or facial change?",
      info: "A fully recovered brief loss of consciousness without a continuing neurologic deficit belongs in the Fainting pathway.",
      target: "Fainting",
    },
    "oscg-puncture-wound": {
      question: "Is this an open cut or laceration rather than a narrow puncture wound?",
      info: "An open cut or laceration belongs in the Cuts and Lacerations pathway.",
      target: "Cuts and Lacerations",
    },
    "oscg-mosquito-bite": {
      question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse the main concern?",
      info: "Systemic allergic-reaction features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-poison-ivy-oak-sumac": {
      question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse the main concern?",
      info: "Systemic allergic-reaction features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
  },
  startId: 1225,
  endId: 1244,
  version: "batch10-learned-safeguard-expansion-2026-07-25",
  redirectTelemedicineEligible: false,
  excludedNotes: [
    "Pinworms was excluded because pregnancy, breastfeeding, and under-2 treatment rules need specialized applicability variants.",
    "Finger Injury was excluded because its source note generalizes arm-fracture criteria to digits.",
    "Post-Op Symptoms and Questions was excluded because its source note identifies it as a multi-source synthesis.",
  ],
});
