import { batch22Protocols } from "../../../../../src/data/openSourceGuidelines/batch22.js";
import { batch15Protocols } from "../../../../../src/data/openSourceGuidelines/batch15.js";
import { batch14Protocols } from "../../../../../src/data/openSourceGuidelines/batch14.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

generateDemographicBatch({
  batch: "22",
  root: "docs/protocol-review/catalog/open-source/batch-22",
  protocols: [...batch22Protocols, ...batch15Protocols, ...batch14Protocols],
  selectedIds: [
    "oscg-pelvic-pain-female",
    "oscg-abdominal-pain-upper",
    "oscg-contraception-iud",
    "oscg-measles-exposure",
    "oscg-blood-in-urine",
    "oscg-urination-pain-female",
    "oscg-urination-pain-male",
  ],
  variants: {
    "oscg-pelvic-pain-female": [
      { age: "Adult", gender: "Female" },
      { age: "Child", gender: "Female" },
    ],
    "oscg-abdominal-pain-upper": [
      { age: "Adult", gender: "Male" },
      { age: "Adult", gender: "Female" },
      { age: "Child", gender: "Male" },
      { age: "Child", gender: "Female" },
    ],
    "oscg-contraception-iud": [
      { age: "Adult", gender: "Female" },
      { age: "Child", gender: "Female" },
    ],
    "oscg-urination-pain-female": [
      { age: "Adult", gender: "Female" },
      { age: "Child", gender: "Female" },
    ],
    "oscg-urination-pain-male": [
      { age: "Adult", gender: "Male" },
      { age: "Child", gender: "Male" },
    ],
  },
  redirects: {
    "oscg-pelvic-pain-female": {
      question: "Is the pain mainly in the upper abdomen with indigestion, reflux, or heartburn symptoms rather than the pelvis?",
      info: "Pain centered in the upper abdomen belongs in the Abdominal Pain - Upper pathway.",
      target: "Abdominal Pain - Upper",
    },
    "oscg-abdominal-pain-upper": {
      question: "Is nausea or vomiting the main concern without upper abdominal pain, reflux, or indigestion?",
      info: "Nausea or vomiting without upper abdominal pain belongs in the Nausea pathway.",
      target: "Nausea",
    },
    "oscg-contraception-iud": {
      question: "Is pelvic pain the main concern without an IUD-related symptom or question?",
      info: "Female pelvic pain without an IUD concern belongs in the Pelvic Pain - Female pathway.",
      target: "Pelvic Pain - Female",
    },
    "oscg-measles-exposure": {
      question: "Is a widespread rash the main concern rather than contact with a person who may have measles?",
      info: "A widespread rash belongs in the Rash or Redness - Widespread pathway.",
      target: "Rash or Redness - Widespread",
    },
    "oscg-blood-in-urine": {
      question: "Is pain in the side or back the main concern rather than visible blood in urine?",
      info: "Pain focused in the side or back belongs in the Flank Pain pathway.",
      target: "Flank Pain",
    },
    "oscg-urination-pain-female": {
      question: "Is pain in the side or back the main concern rather than pain primarily during urination?",
      info: "Pain focused in the side or back belongs in the Flank Pain pathway.",
      target: "Flank Pain",
    },
    "oscg-urination-pain-male": {
      question: "Is pain in the side or back the main concern rather than pain primarily during urination?",
      info: "Pain focused in the side or back belongs in the Flank Pain pathway.",
      target: "Flank Pain",
    },
  },
  startId: 1465,
  endId: 1484,
  version: "batch22-source-supported-carry-forward-2026-07-25",
  adaptText: (value, { protocol, age }) => {
    if (
      protocol.id === "oscg-blood-in-urine" &&
      age === "Child" &&
      value ===
        "NHS.UK guidance states blood in urine must always be checked out promptly, regardless of amount or certainty about the cause, since it can occasionally be a sign of cancer that's easier to treat if found early."
    ) {
      return "Visible blood in a child's urine needs prompt clinical assessment to identify urinary-tract, kidney, infection, injury, or other causes.";
    }
    return value;
  },
  excludedNotes: [
    "Combined birth-control pills was excluded because its source is standard ACHES knowledge rather than a named public source.",
    "Face Pain, Mouth Pain, and Muscle Aches and Body Pain were excluded because their source notes explicitly generalize or synthesize other pathways.",
    "Bullying, Child Abuse Suspected, and Child Neglect Suspected were excluded because they are sensitive pathways without an approved Qatar operational source.",
    "Twelve remaining slots use named-source families carried forward from Batches 14 and 15: Measles Exposure, Urine - Blood In, and sex-specific Urination Pain.",
  ],
});
