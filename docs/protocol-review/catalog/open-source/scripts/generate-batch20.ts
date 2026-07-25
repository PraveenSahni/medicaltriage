import { batch20Protocols } from "../../../../../src/data/openSourceGuidelines/batch20.js";
import { generateDemographicBatch } from "./shared-demographic-generator.js";

const selectedIds = batch20Protocols.map((protocol) => protocol.id);
const femalePostpartumVariants = Object.fromEntries(
  selectedIds.map((id) => [id, [{ age: "Adult" as const, gender: "Female" as const }, { age: "Child" as const, gender: "Female" as const }]]),
);

generateDemographicBatch({
  batch: "20",
  root: "docs/protocol-review/catalog/open-source/batch-20",
  protocols: batch20Protocols,
  selectedIds,
  variants: femalePostpartumVariants,
  redirects: {
    "oscg-postpartum-headache": {
      question: "Is this a non-postpartum headache presentation without recent childbirth?",
      info: "A headache not occurring in the postpartum period belongs in the Headache pathway.",
      target: "Headache",
    },
    "oscg-postpartum-high-blood-pressure": {
      question: "Is high blood pressure the primary concern without recent childbirth?",
      info: "The authored Blood Pressure - High protocol is adult-only and cannot receive an adolescent redirect. Arrange governed in-person clinical review without applying a permissive alias.",
      dispositionLevel: 70,
      careAdviceId: "oscg-postpartumhighbp-urgent-advice",
    },
    "oscg-postpartum-vision-loss-or-change": {
      question: "Is vision loss or change the primary concern without recent childbirth?",
      info: "Vision symptoms outside the postpartum period belong in the Vision Loss or Change pathway.",
      target: "Vision Loss or Change",
    },
    "oscg-postpartum-csection-symptoms": {
      question: "Is this a skin wound or injury unrelated to a recent C-section?",
      info: "A non-operative skin wound or injury belongs in the Skin Injury pathway.",
      target: "Skin Injury",
    },
    "oscg-postpartum-leg-pain": {
      question: "Is new weakness, numbness, facial change, speech difficulty, or loss of coordination the primary concern?",
      info: "A continuing focal neurologic deficit belongs in the Neurologic Deficit pathway.",
      target: "Neurologic Deficit",
    },
    "oscg-postpartum-leg-swelling-and-edema": {
      question: "Is a high blood-pressure reading with headache or vision change the primary concern?",
      info: "Postpartum high blood pressure with headache or vision change remains a direct Qatar 999 emergency and must not redirect to an adult-only general blood-pressure protocol.",
      dispositionLevel: 100,
      careAdviceId: "oscg-postpartumlegswelling-emergency-advice",
    },
    "oscg-postpartum-urination-pain": {
      question: "Is pain in the side or back below the ribs the primary concern rather than pain during urination?",
      info: "Primary side or back pain below the ribs belongs in the Flank Pain pathway.",
      target: "Flank Pain",
    },
    "oscg-postpartum-fever": {
      question: "Are cough, breathing symptoms, or a positive COVID-19 test the primary concern?",
      info: "A COVID-19 respiratory presentation belongs in the authored COVID-19 - Diagnosed or Suspected pathway.",
      target: "COVID-19 - Diagnosed or Suspected",
    },
    "oscg-postpartum-breast-pain-and-engorgement": {
      question: "Is this a focal pus-filled skin lump or abscess rather than postpartum breast engorgement or mastitis symptoms?",
      info: "A focal skin abscess belongs in the Boil (Skin Abscess) pathway.",
      target: "Boil (Skin Abscess)",
    },
    "oscg-postpartum-vaginal-bleeding-and-lochia": {
      question: "Was there a brief faint with full recovery, and is fainting now the primary concern?",
      info: "A fully recovered brief faint belongs in the Fainting pathway.",
      target: "Fainting",
    },
  },
  startId: 1425,
  endId: 1444,
  version: "batch20-postpartum-female-applicability-2026-07-25",
  excludedNotes: [
    "Male variants are prohibited because every Batch 20 family is postpartum-specific.",
    "Child variants begin at the source-supported minimum age of 12 years and represent adolescent postpartum patients only.",
    "No prepubertal child pathway or non-postpartum female pathway was fabricated.",
  ],
});
