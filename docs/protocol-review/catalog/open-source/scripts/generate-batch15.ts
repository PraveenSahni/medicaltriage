import { batch15Protocols } from "../../../../../src/data/openSourceGuidelines/batch15.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "15",
  root: "docs/protocol-review/catalog/open-source/batch-15",
  protocols: batch15Protocols,
  selectedIds: [
    "oscg-tick-bite",
    "oscg-sweating",
    "oscg-swallowing-difficulty",
    "oscg-ringworm",
    "oscg-eye-pain-and-other-symptoms",
  ],
  redirects: {
    "oscg-tick-bite": {
      question: "Is this a non-tick insect bite or sting rather than an attached or recently removed tick?",
      info: "A bite or sting not caused by a tick belongs in the Insect Bite pathway.",
      target: "Insect Bite",
    },
    "oscg-sweating": {
      question: "Did the sweating begin during or after possible exposure to a faulty heater, generator, fire, charcoal, gas appliance, or enclosed-space fumes?",
      info: "Symptoms associated with possible carbon monoxide exposure belong in the Carbon Monoxide Exposure pathway.",
      target: "Carbon Monoxide Exposure",
    },
    "oscg-swallowing-difficulty": {
      question: "Did the problem start after swallowing a solid object, button battery, magnet, or sharp item?",
      info: "A suspected swallowed object belongs in the Swallowed Foreign Body pathway.",
      target: "Swallowed Foreign Body",
    },
    "oscg-ringworm": {
      question: "Is this mainly a weeping, blistered, or honey-crusted sore rather than a ring-shaped scaly rash?",
      info: "A weeping or honey-crusted infected sore belongs in the Impetigo pathway.",
      target: "Impetigo (Infected Sore)",
    },
    "oscg-eye-pain-and-other-symptoms": {
      question: "Is itching, watering, and allergy-type irritation the main concern without significant eye pain, light sensitivity, or vision change?",
      info: "Allergy-type eye symptoms without pain or vision change belong in the Eye Allergy pathway.",
      target: "Eye - Allergy",
    },
  },
  startId: 1325,
  endId: 1344,
  version: "batch15-learned-safeguard-expansion-2026-07-25",
  excludedNotes: [
    "Measles Exposure was excluded because pregnancy-specific risk cannot be copied into Male variants and needs a specialized applicability design.",
    "Toenail - Ingrown and Fingernail Infection were deferred because a canonical nail-infection redirect pathway is not yet authored.",
    "Arm Pain and Leg Pain were deferred because safe injury-versus-nontraumatic routing requires additional canonical destination review.",
  ],
});
