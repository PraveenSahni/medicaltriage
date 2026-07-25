import { batch18Protocols } from "../../../../../src/data/openSourceGuidelines/batch18.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "18",
  root: "docs/protocol-review/catalog/open-source/batch-18",
  protocols: batch18Protocols,
  selectedIds: [
    "oscg-breathing-difficulty",
    "oscg-common-cold",
    "oscg-hives",
    "oscg-head-lice",
    "oscg-earwax",
  ],
  redirects: {
    "oscg-breathing-difficulty": {
      question: "Did the breathing difficulty begin with swelling of the lips, mouth, tongue, or throat after a possible allergen exposure?",
      info: "Breathing difficulty with airway swelling after a possible allergen exposure belongs in the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-common-cold": {
      question: "Are sneezing and an itchy or runny nose mainly linked to a seasonal or environmental trigger, without an infectious illness pattern?",
      info: "Symptoms primarily linked to a seasonal or environmental trigger belong in the authored Nasal Allergies (Hay Fever) pathway.",
      target: "Nasal Allergies (Hay Fever)",
    },
    "oscg-hives": {
      question: "Are there breathing problems, throat tightness, collapse, or swelling of the lips, mouth, tongue, or throat?",
      info: "Hives with airway, breathing, or circulation features belong in the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-head-lice": {
      question: "Have no live lice been found, and is a widespread rash or redness the main concern?",
      info: "A widespread rash without confirmed live lice belongs in the Rash or Redness - Widespread pathway.",
      target: "Rash or Redness - Widespread",
    },
    "oscg-earwax": {
      question: "Is ear pain, discharge, fever, or acute illness the main concern rather than wax blockage?",
      info: "Ear pain or acute ear illness belongs in the Earache pathway.",
      target: "Earache",
    },
  },
  startId: 1385,
  endId: 1404,
  version: "batch18-learned-safeguard-expansion-2026-07-25",
  adaptText: (value, { protocol, age }) => {
    if (protocol.id !== "oscg-common-cold") return value;
    if (age === "Child") {
      return value.replace(
        "Adults can gargle salt water or try hot lemon and honey for a sore throat. ",
        "",
      );
    }
    return value.replace(" (not for children under 6)", "");
  },
  excludedNotes: [
    "Asthma Attack was deferred because medication and inhaler instructions require age-specific and local formulary governance.",
    "Fever was excluded because its cited source is explicitly adult-only and does not support child variants.",
    "Dizziness - Lightheadedness and Dizziness - Vertigo were deferred because pediatric applicability is not established by the cited source.",
    "Jaundice was excluded because its cited source is newborn-specific and cannot support four Adult/Child demographic variants.",
  ],
});
