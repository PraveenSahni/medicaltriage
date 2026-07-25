import { batch14Protocols } from "../../../../../src/data/openSourceGuidelines/batch14.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "14",
  root: "docs/protocol-review/catalog/open-source/batch-14",
  protocols: batch14Protocols,
  selectedIds: [
    "oscg-wrist-injury",
    "oscg-toothache",
    "oscg-vision-loss-or-change",
    "oscg-vomiting-blood",
    "oscg-heat-exposure",
  ],
  redirects: {
    "oscg-wrist-injury": {
      question: "Was the wrist injury part of a motor vehicle crash or other multi-system collision?",
      info: "A motor vehicle collision requires the Motor Vehicle Accident pathway before an isolated wrist pathway.",
      target: "Motor Vehicle Accident",
    },
    "oscg-toothache": {
      question: "Are shallow sores or ulcers inside the mouth the main concern rather than pain arising from a tooth?",
      info: "Mouth sores without a primary tooth problem belong in the Mouth Ulcers pathway.",
      target: "Mouth Ulcers",
    },
    "oscg-vision-loss-or-change": {
      question: "Did the eye symptoms begin after a chemical splash or chemical exposure?",
      info: "The Eye - Chemical In family is source-only and has no generated target. Chemical-associated vision symptoms remain a direct emergency disposition with immediate irrigation for a splash without suspected penetration, Qatar 999, and no self-driving.",
      dispositionLevel: 100,
      careAdviceId: "oscg-visionloss-emergency-advice",
    },
    "oscg-vomiting-blood": {
      question: "Is nausea or vomiting present without red, brown, or coffee-ground material and without suspected blood?",
      info: "Vomiting without suspected blood belongs in the Nausea pathway.",
      target: "Nausea",
    },
    "oscg-heat-exposure": {
      question: "Is cold exposure, shivering, or suspected low body temperature the main concern rather than heat exposure?",
      info: "Cold exposure belongs in the Cold Exposure (Hypothermia) pathway.",
      target: "Cold Exposure (Hypothermia)",
    },
  },
  startId: 1305,
  endId: 1324,
  version: "batch14-learned-safeguard-expansion-2026-07-25",
  excludedNotes: [
    "Hand Injury was excluded because its source explicitly generalizes broken-arm or wrist guidance to the hand.",
    "Urination Pain - Female and Urination Pain - Male were excluded because sex-specific source families must not be expanded into four demographic variants.",
    "Wound Infection Suspected was excluded because its source identifies it as a multi-source synthesis.",
    "Urine - Blood In was deferred because menstruation wording requires more specialized sex-specific adaptation.",
  ],
});
