import { batch11Protocols } from "../../../../../src/data/openSourceGuidelines/batch11.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "11",
  root: "docs/protocol-review/catalog/open-source/batch-11",
  protocols: batch11Protocols,
  selectedIds: [
    "oscg-chest-injury",
    "oscg-rash-widespread",
    "oscg-scrapes",
    "oscg-shingles",
    "oscg-sinus-pain-congestion",
  ],
  redirects: {
    "oscg-chest-injury": {
      question: "Was the chest injury part of a motor vehicle crash or a multi-system crash presentation?",
      info: "A motor vehicle crash with possible injuries in more than one body area belongs in the Motor Vehicle Accident pathway.",
      target: "Motor Vehicle Accident",
    },
    "oscg-rash-widespread": {
      question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse the main concern?",
      info: "Systemic allergic-reaction features require the Anaphylaxis pathway.",
      target: "Anaphylaxis",
    },
    "oscg-scrapes": {
      question: "Is this a deep, gaping, or actively bleeding cut rather than a superficial scrape or graze?",
      info: "A deep cut or laceration belongs in the Cuts and Lacerations pathway.",
      target: "Cuts and Lacerations",
    },
    "oscg-shingles": {
      question: "Is the main concern a widespread rash without the typical painful, one-sided stripe of blisters?",
      info: "A widespread rash without the typical shingles pattern belongs in the Rash or Redness - Widespread pathway.",
      target: "Rash or Redness - Widespread",
    },
    "oscg-sinus-pain-congestion": {
      question: "Are sneezing, itchy or watery eyes, and clear nasal discharge the main symptoms without facial pain, pressure, fever, or thick discharge?",
      info: "Symptoms dominated by an allergic pattern belong in the Nasal Allergies pathway.",
      target: "Nasal Allergies",
    },
  },
  startId: 1245,
  endId: 1264,
  version: "batch11-learned-safeguard-expansion-2026-07-25",
  excludedNotes: [
    "Back Injury was excluded because its source explicitly generalizes whiplash guidance from the neck to the back.",
    "Shoulder Injury was excluded because its source explicitly generalizes broken-arm or wrist guidance to the shoulder.",
    "Rash - Purple Spots or Dots and Rash or Redness - Localized were deferred to avoid duplicating one rash source across multiple families in the same batch.",
    "Ring Stuck on Finger or Toe was excluded because no dedicated cited public clinical source was identified.",
  ],
  adaptText: (value, { protocol, age, gender }) => {
    if (protocol.id !== "oscg-shingles") return value;
    if (value === "Is the caller pregnant, breastfeeding, or immunocompromised?") {
      if (age === "Adult" && gender === "Female") return value;
      return age === "Child"
        ? "Does the child have a weakened immune system?"
        : "Does the caller have a weakened immune system?";
    }
    if (
      value ===
      "Is the caller pregnant, breastfeeding with the rash on the breasts, is the rash on the eye or nose, are there vision changes, does the caller have a severely weakened immune system, or are they 17 or younger?"
    ) {
      if (age === "Adult" && gender === "Female") {
        return "Is the caller pregnant, breastfeeding with the rash on the breasts, is the rash on the eye or nose, are there vision changes, or does the caller have a severely weakened immune system?";
      }
      if (age === "Child") {
        return "Because this patient is 17 or younger, or if the rash is on the eye or nose, there are vision changes, or the child has a severely weakened immune system, is urgent review required?";
      }
      return "Is the rash on the eye or nose, are there vision changes, or does the caller have a severely weakened immune system?";
    }
    return value;
  },
  includeQuestion: (question, { protocol, age }) =>
    !(
      protocol.id === "oscg-shingles" &&
      (
        (age === "Child" &&
          question.id === "oscg-shingles-q1-selfcare") ||
        (age === "Adult" &&
          question.id === "oscg-shingles-q2-child-age-unavailable")
      )
    ),
});
