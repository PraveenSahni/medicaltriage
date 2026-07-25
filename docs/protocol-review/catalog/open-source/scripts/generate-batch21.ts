import fs from "node:fs";
import path from "node:path";
import { batch21Protocols } from "../../../../../src/data/openSourceGuidelines/batch21.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

const anklePain = batch21Protocols.find((protocol) => protocol.id === "oscg-ankle-pain");
if (!anklePain) throw new Error("Ankle Pain source protocol is missing.");

const pediatricAnklePain = {
  ...anklePain,
  id: "oscg-ankle-pain-child",
  canonicalSourceProtocolId: anklePain.id,
  questions: anklePain.questions.map((question) =>
    question.id === "oscg-anklepain-q1-selfcare"
      ? {
          ...question,
          severity: "Routine",
          questionTextEn: "Does the child have ankle pain without the urgent infection features above?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "NHS.UK joint pain guidance specifically advises clinical review when a child has joint problems.",
          careAdviceIds: ["oscg-anklepain-child-review-advice"],
          dispositionLevel: 40,
        }
      : question,
  ),
  careAdvice: anklePain.careAdvice.map((advice) =>
    advice.id === "oscg-anklepain-selfcare-advice"
      ? {
          ...advice,
          id: "oscg-anklepain-child-review-advice",
          titleEn: "Clinical review for childhood ankle pain",
          instructionTextEn: "Arrange primary-care review for the child's joint problem. Rest the ankle when needed and use a wrapped cold pack for up to 20 minutes while awaiting review.",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          adviceCategory: "DISPOSITION",
        }
      : advice,
  ),
};

const protocols = [...batch21Protocols, pediatricAnklePain];
const adultOnly = [
  { age: "Adult" as const, gender: "Male" as const },
  { age: "Adult" as const, gender: "Female" as const },
];
const childOnly = [
  { age: "Child" as const, gender: "Male" as const },
  { age: "Child" as const, gender: "Female" as const },
];
const selectedIds = [
  "oscg-ankle-pain",
  "oscg-ankle-pain-child",
  "oscg-ankle-swelling",
  "oscg-elbow-pain",
  "oscg-elbow-swelling",
  "oscg-finger-pain",
  "oscg-foot-pain",
  "oscg-hand-swelling",
  "oscg-hip-pain",
  "oscg-knee-swelling",
];
const crashRedirect = {
  question: "Did this problem begin with a motor vehicle crash or as part of a multi-system crash injury?",
  info: "A motor vehicle crash or multi-system crash injury belongs in the Motor Vehicle Accident pathway.",
  target: "Motor Vehicle Accident",
};

generateDemographicBatch({
  batch: "21",
  root: "docs/protocol-review/catalog/open-source/batch-21",
  protocols,
  selectedIds,
  redirects: Object.fromEntries(selectedIds.map((id) => [id, crashRedirect])),
  variants: Object.fromEntries([
    ...selectedIds.filter((id) => id !== "oscg-ankle-pain-child").map((id) => [id, adultOnly]),
    ["oscg-ankle-pain-child", childOnly],
  ]),
  startId: 1445,
  endId: 1464,
  version: "batch21-applicability-governed-expansion-2026-07-25",
  excludedNotes: [
    "Arm Swelling and Edema was excluded because its upper-extremity thrombosis pathway generalizes a leg-specific DVT pattern without a dedicated named source.",
    "Child variants were excluded for all families except Ankle Pain because the source gives one general child-joint-problem instruction rather than body-part-specific pediatric thresholds.",
    "The two Ankle Pain child variants use the source's explicit instruction that any child joint problem receives clinical review; adult self-care disposition was not copied into them.",
  ],
});

const root = path.resolve("docs/protocol-review/catalog/open-source/batch-21");
const manifestPath = path.join(root, "manifests", "batch-21-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.conditionFamilies = 9;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
const summaryPath = path.join(root, "batches", "batch-21-summary.md");
const summary = fs
  .readFileSync(summaryPath, "utf8")
  .replace("10 public-source families", "9 public-source families");
fs.writeFileSync(summaryPath, summary);
