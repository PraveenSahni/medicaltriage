import { batch13Protocols } from "../../../../../src/data/openSourceGuidelines/batch13.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "13",
  root: "docs/protocol-review/catalog/open-source/batch-13",
  protocols: batch13Protocols,
  selectedIds: [
    "oscg-ear-injury",
    "oscg-elbow-injury",
    "oscg-eye-injury",
    "oscg-hip-injury",
    "oscg-leg-injury",
  ],
  redirects: {
    "oscg-ear-injury": {
      question: "Is the main concern an object lodged in the ear rather than an injury to the ear?",
      info: "An object lodged in the ear belongs in the Ear - Foreign Body pathway.",
      target: "Ear - Foreign Body",
    },
    "oscg-elbow-injury": {
      question: "Did this elbow injury occur as part of a motor vehicle crash or a multi-system crash injury?",
      info: "A motor vehicle crash or multi-system crash injury belongs in the Motor Vehicle Accident pathway.",
      target: "Motor Vehicle Accident",
    },
    "oscg-eye-injury": {
      question: "Was the eye exposed to a chemical rather than injured by blunt or penetrating trauma?",
      info: "The Eye - Chemical In family is source-only and has no generated target. Keep this as a direct emergency disposition: begin immediate irrigation for a splash without suspected penetration while Qatar 999 assessment and controlled transport are arranged.",
      dispositionLevel: 100,
      careAdviceId: "oscg-eyeinjury-emergency-advice",
    },
    "oscg-hip-injury": {
      question: "Did this hip injury occur as part of a motor vehicle crash or a multi-system crash injury?",
      info: "A motor vehicle crash or multi-system crash injury belongs in the Motor Vehicle Accident pathway.",
      target: "Motor Vehicle Accident",
    },
    "oscg-leg-injury": {
      question: "Did this leg injury occur as part of a motor vehicle crash or a multi-system crash injury?",
      info: "A motor vehicle crash or multi-system crash injury belongs in the Motor Vehicle Accident pathway.",
      target: "Motor Vehicle Accident",
    },
  },
  startId: 1285,
  endId: 1304,
  version: "batch13-learned-safeguard-expansion-2026-07-25",
  adaptText: (value) =>
    value.replace(
      /lists ([^.]+) as Qatar 999\/emergency department criteria/gi,
      "identifies $1 as signs requiring emergency assessment; the local Qatar emergency pathway is used here",
    ),
  excludedNotes: [
    "Face Injury was deferred because its source is a documented multi-source generalization that needs focused governance review.",
    "Mouth Injury and Tooth Injury were deferred because their emergency-dentistry content is not anchored to one dedicated public guideline.",
    "Tailbone Injury was deferred because it generalizes a back-injury screen without a dedicated source.",
    "Toe Injury was deferred because it generalizes upper-limb fracture guidance to a different anatomical site.",
  ],
});
