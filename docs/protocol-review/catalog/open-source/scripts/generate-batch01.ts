import path from "node:path";
import { batch01Protocols } from "../../../../../src/data/openSourceGuidelines/batch01.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

const outputRoot = process.env.BATCH01_OUTPUT_ROOT
  ? path.resolve(process.env.BATCH01_OUTPUT_ROOT)
  : path.resolve("docs/protocol-review/catalog/open-source");

generateDemographicBatch({
  batch: "01",
  root: outputRoot,
  protocols: batch01Protocols,
  selectedIds: [
    "oscg-back-pain",
    "oscg-burns-thermal",
    "oscg-animal-bite",
    "oscg-insect-sting",
    "oscg-anaphylaxis",
    "oscg-carbon-monoxide",
    "oscg-nosebleed",
    "oscg-headache",
    "oscg-sunburn",
    "oscg-frostbite",
  ],
  redirects: {
    // Back Injury is authored but excluded from generation, so major trauma
    // remains in this protocol's Qatar-999 emergency rule instead of redirecting.
    "oscg-back-pain": [],
    "oscg-burns-thermal": {
      question: "Was the burn caused by an acid or another chemical rather than dry heat, hot liquid, or steam?",
      info: "A chemical burn requires the authored Burns - Chemical pathway and immediate substance-specific decontamination precautions. Electrical exposure remains in the thermal-burn emergency rule-out rather than this redirect.",
      target: "Burns - Chemical",
    },
    "oscg-animal-bite": [
      {
        question: "Was this an insect bite rather than a mammal or human bite or an insect sting?",
        info: "A non-sting insect bite requires the authored Insect Bite pathway.",
        target: "Insect Bite",
      },
      {
        question: "Was this a bee, wasp, or yellow-jacket sting rather than a mammal or human bite?",
        info: "A bee, wasp, or yellow-jacket sting requires the authored Bee or Yellow Jacket Sting pathway.",
        target: "Bee or Yellow Jacket Sting",
      },
    ],
    "oscg-insect-sting": {
      question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse present?",
      info: "Systemic airway, breathing, circulation, or consciousness features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-anaphylaxis": {
      question: "Is the reaction limited to the skin or sting site without airway, breathing, circulation, or consciousness features?",
      info: "A localized reaction without anaphylaxis features belongs in the allergy, hives, or insect-sting pathway.",
      target: "Allergic Reaction or Hives",
    },
    // Smoke and Fume Inhalation is authored but excluded from generation.
    // Fire/smoke exposure therefore stays in the direct CO emergency/urgent rules.
    "oscg-carbon-monoxide": [],
    "oscg-nosebleed": {
      question: "Did bleeding begin after a significant facial or nasal injury?",
      info: "A traumatic nosebleed requires the Nose Injury pathway.",
      target: "Nose Injury",
    },
    // The generated Head Injury rule is adult-only and has narrower entry
    // criteria. Post-traumatic headache stays in this protocol's direct
    // emergency assessment rule for every demographic.
    "oscg-headache": [],
    "oscg-sunburn": [
      {
        question: "Is this a burn from direct heat, flame, hot liquid, or steam rather than sun exposure?",
        info: "A non-solar thermal burn requires the authored Burns - Thermal pathway.",
        target: "Burns - Thermal",
      },
      {
        question: "Was the injury caused by an acid or another chemical rather than sun exposure?",
        info: "A chemical burn requires the authored Burns - Chemical pathway and immediate substance-specific decontamination precautions.",
        target: "Burns - Chemical",
      },
    ],
    "oscg-frostbite": {
      question: "Is generalized cold exposure, shivering, confusion, drowsiness, or reduced consciousness the main concern?",
      info: "Systemic cold illness requires the authored Cold Exposure (Hypothermia) pathway.",
      target: "Cold Exposure (Hypothermia)",
    },
  },
  startId: 1001,
  endId: 1040,
  version: "batch01-canonical-source-regeneration-2026-07-25",
  includeQuestion: (question, { protocol, age }) => {
    if (protocol.id !== "oscg-back-pain") return true;
    if (age === "Child") {
      return ![
        "oscg-backpain-q2-routine",
        "oscg-backpain-q3-selfcare",
      ].includes(question.id);
    }
    return question.id !== "oscg-backpain-q2-child-review";
  },
  redirectTelemedicineEligible: false,
  preserveUatProvenance: true,
  sourceText:
    "UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation content generated deterministically from src/data/openSourceGuidelines/batch01.ts and cited public sources. It is not licensed STCC content. All disposition and redirect branches are non-telemedicine pending Qatar clinical and nursing governance approval. Generation does not import or deploy records.",
});
