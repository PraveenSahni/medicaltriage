import { batch12Protocols } from "../../../../../src/data/openSourceGuidelines/batch12.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "12",
  root: "docs/protocol-review/catalog/open-source/batch-12",
  protocols: batch12Protocols,
  selectedIds: [
    "oscg-skin-foreign-body",
    "oscg-unusual-stool-color",
    "oscg-swallowed-foreign-body",
    "oscg-sores",
    "oscg-skin-injury",
  ],
  redirects: {
    "oscg-skin-foreign-body": {
      question: "Is this primarily a narrow puncture wound with no retained object?",
      info: "A narrow penetrating wound without a retained object belongs in the Puncture Wound pathway.",
      target: "Puncture Wound",
    },
    "oscg-unusual-stool-color": {
      question: "Is frequent loose or watery stool the primary concern rather than stool color alone?",
      info: "Frequent loose or watery stool belongs in the Diarrhea pathway.",
      target: "Diarrhea",
    },
    "oscg-swallowed-foreign-body": {
      question: "Was a medicine, household chemical, plant, or other potentially poisonous substance swallowed rather than a solid object?",
      info: "A potentially toxic ingestion belongs in the Poisoning pathway.",
      target: "Poisoning",
    },
    "oscg-sores": {
      question: "Is this primarily a painful pus-filled lump or abscess rather than an open or non-healing sore?",
      info: "A painful pus-filled lump or abscess belongs in the Boil (Skin Abscess) pathway.",
      target: "Boil (Skin Abscess)",
    },
    "oscg-skin-injury": {
      question: "Was the skin injury caused mainly by heat, flame, steam, or a hot object?",
      info: "A heat-related burn belongs in the Burns - Thermal pathway.",
      target: "Burns - Thermal",
    },
  },
  startId: 1265,
  endId: 1284,
  version: "batch12-learned-safeguard-expansion-2026-07-25",
  excludedNotes: [
    "Smoke and Fume Inhalation was excluded because it is a multi-source synthesis rather than a dedicated source protocol.",
    "Snakebite - North America was excluded because its geography is not appropriate for Qatar without local toxicology governance.",
    "Spider Bite - North America and Scorpion Sting - North America were excluded because they generalize snake-bite evidence and carry inappropriate geography.",
    "Stingray Injury was excluded because it generalizes snake-bite evidence and requires Qatar-specific marine-envenomation review.",
  ],
});
