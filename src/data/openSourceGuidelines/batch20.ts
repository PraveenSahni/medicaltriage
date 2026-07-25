import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 20 - the postpartum symptom cluster, decomposed from real, publicly
 * available NHS.UK "when to get help" guidance pages (Crown copyright,
 * reused under the Open Government Licence). Postpartum - Headache, High
 * Blood Pressure, and Vision Loss or Change all share the same NHS.UK
 * pre-eclampsia source, since pre-eclampsia can develop in the days/weeks
 * after birth and presents with exactly these three symptoms together.
 * Postpartum - Leg Pain, Leg Swelling and Edema, Urination Pain, and Fever
 * draw on the NHS.UK C-section recovery page's warning signs (blood clot,
 * urinary symptoms, wound infection/fever), generalized to vaginal
 * deliveries too where the same physiological risks apply. Postpartum -
 * Vaginal Bleeding and Lochia uses standard, universally-taught obstetric
 * knowledge (the NHS.UK lochia page could not be retrieved during
 * authoring) given how safety-critical postpartum hemorrhage recognition is.
 */
export const batch20Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Postpartum - Headache - https://www.nhs.uk/conditions/pre-eclampsia/ (reviewed 2026-03-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-headache",
    titleEn: "Postpartum - Headache",
    clinicalDefinitionEn: "Postpartum headache assessment for a person who has given birth within the last year. Pre-eclampsia is especially relevant in the first days or weeks after birth; other pregnancy-related complications can occur later.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "headache after giving birth", weight: 100 },
      { phrase: "postpartum headache", weight: 100 },
      { phrase: "bad headache since having the baby", weight: 95 },
      { phrase: "severe headache after delivery", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumheadache-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumheadache-iaq2", sequence: 2, responseType: "PAIN_SCALE", promptTextEn: "How severe is the headache, 0-10?" },
      { id: "oscg-postpartumheadache-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any vision changes, swelling, or pain below the ribs?" },
      { id: "oscg-postpartumheadache-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumheadache-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there a severe headache that doesn't go away with simple painkillers, vision problems (blurred vision or flashing lights), pain below the ribs, sudden swelling of the face/hands/feet, feeling very unwell, persistent heartburn unresponsive to medication, or vomiting?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance lists these as pre-eclampsia warning signs that can appear in the days or weeks after birth and always need immediate evaluation.",
        redFlag: true,
        keywords: ["severe headache with vision changes postpartum", "headache with swelling postpartum"],
        careAdviceIds: ["oscg-postpartumheadache-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumheadache-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a new or persistent postpartum headache without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A new or persistent headache after birth requires clinical assessment because remote questioning alone cannot exclude a hypertensive, neurological, anaesthetic-related, or infectious cause.",
        redFlag: false,
        keywords: ["new postpartum headache", "persistent postpartum headache"],
        careAdviceIds: ["oscg-postpartumheadache-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumheadache-emergency-advice", titleEn: "Emergency postpartum pre-eclampsia precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not drive yourself. Tell the call handler that the patient gave birth recently.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening headache", "vision changes worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumheadache-selfcare-advice", titleEn: "Prompt postpartum headache review", instructionTextEn: "Arrange prompt clinical assessment through the locally approved Qatar maternity pathway; the exact non-emergency destination remains GOVERNANCE_REQUIRED. Seek emergency help on 999 if the headache becomes severe or vision change, fainting, seizure, breathing difficulty, chest pain, severe upper abdominal pain, or marked swelling develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["headache becomes severe", "vision changes or swelling develop"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pre-eclampsia\", https://www.nhs.uk/conditions/pre-eclampsia/ (page last reviewed 23 March 2026) - explicitly covers postpartum onset", "CDC Hear Her, urgent maternal warning signs during pregnancy or within one year after pregnancy, https://www.cdc.gov/hearher/"],
      contentNotice: "Decomposed from NHS.UK's published pre-eclampsia guidance (Crown copyright, reused under the Open Government Licence), applied to the postpartum headache presentation specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Postpartum - High Blood Pressure - https://www.nhs.uk/conditions/pre-eclampsia/ (reviewed 2026-03-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-high-blood-pressure",
    titleEn: "Postpartum - High Blood Pressure",
    clinicalDefinitionEn: "Postpartum high blood pressure assessment after birth; a reported reading must be confirmed and interpreted by a clinician using an approved obstetric blood-pressure pathway.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "high blood pressure after birth", weight: 100 },
      { phrase: "postpartum high blood pressure", weight: 100 },
      { phrase: "blood pressure high since having the baby", weight: 95 },
      { phrase: "worried about pre-eclampsia after delivery", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumhighbp-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the blood pressure reading, if measured?" },
      { id: "oscg-postpartumhighbp-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumhighbp-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any headache, vision changes, or swelling?" },
      { id: "oscg-postpartumhighbp-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumhighbp-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with high blood pressure, is there a severe headache, vision problems, pain below the ribs, sudden swelling of the face/hands/feet, feeling very unwell, or vomiting?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK pre-eclampsia guidance lists these as warning signs requiring immediate evaluation, which can develop in the days or weeks after birth.",
        redFlag: true,
        keywords: ["high blood pressure with headache postpartum", "high blood pressure with swelling postpartum"],
        careAdviceIds: ["oscg-postpartumhighbp-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumhighbp-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has a clinician said the postpartum blood pressure is high, or is there a new home reading above the patient's clinician-agreed range, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "The source confirms high blood pressure can be an early sign of postpartum pre-eclampsia but does not provide a complete telephone threshold or measurement protocol; the reading needs prompt confirmation under an approved obstetric pathway.",
        redFlag: false,
        keywords: ["mildly elevated blood pressure postpartum"],
        careAdviceIds: ["oscg-postpartumhighbp-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumhighbp-emergency-advice", titleEn: "Emergency postpartum pre-eclampsia precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not drive yourself. Tell the call handler that the patient gave birth recently.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening headache or vision changes"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumhighbp-urgent-advice", titleEn: "Urgent postpartum blood pressure review", instructionTextEn: "Arrange prompt blood-pressure confirmation through the locally approved Qatar maternity pathway; the exact non-emergency destination and measurement thresholds remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["headache, vision changes, or swelling develop"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pre-eclampsia\", https://www.nhs.uk/conditions/pre-eclampsia/ (page last reviewed 23 March 2026) - explicitly covers postpartum onset"],
      contentNotice: "Decomposed from the same NHS.UK pre-eclampsia guidance already used for Postpartum - Headache, applied to the high blood pressure presentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Postpartum - Vision Loss or Change - https://www.nhs.uk/conditions/pre-eclampsia/ (reviewed 2026-03-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-vision-loss-or-change",
    titleEn: "Postpartum - Vision Loss or Change",
    clinicalDefinitionEn: "Postpartum vision change assessment decomposed from NHS.UK's published pre-eclampsia guidance, distinct from the general Vision Loss or Change protocol (batch14).",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "vision changes after giving birth", weight: 100 },
      { phrase: "blurred vision since having the baby", weight: 100 },
      { phrase: "seeing flashing lights postpartum", weight: 100 },
      { phrase: "vision problems after delivery", weight: 95 },
      { phrase: "seeing flashing lights and blurry vision", weight: 100 },
      { phrase: "flashing lights since having the baby", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumvision-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumvision-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Describe the vision change." },
      { id: "oscg-postpartumvision-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any headache, swelling, or pain below the ribs?" },
      { id: "oscg-postpartumvision-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumvision-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there a new postpartum vision change such as blurred vision, flashing lights, spots, or loss of vision, whether or not headache, upper abdominal pain, swelling, or vomiting is also present?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK pre-eclampsia guidance lists vision problems as a key warning sign that can appear in the days or weeks after birth, needing immediate evaluation.",
        redFlag: true,
        keywords: ["blurred vision with headache postpartum", "flashing lights with swelling postpartum"],
        careAdviceIds: ["oscg-postpartumvision-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumvision-emergency-advice", titleEn: "Emergency postpartum vision change precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not drive yourself. Tell the call handler that the patient gave birth recently.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision worsens", "headache worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pre-eclampsia\", https://www.nhs.uk/conditions/pre-eclampsia/ (page last reviewed 23 March 2026) - explicitly covers postpartum onset"],
      contentNotice: "Decomposed from the same NHS.UK pre-eclampsia guidance already used for Postpartum - Headache and High Blood Pressure, applied here to the vision-change presentation. The source treats any occurrence as needing immediate evaluation, so no lower-acuity tier is included. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Postpartum - C-section Symptoms - https://www.nhs.uk/conditions/caesarean-section/recovery/ (reviewed 2023-01-04)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-csection-symptoms",
    titleEn: "Postpartum - C-section Symptoms",
    clinicalDefinitionEn: "C-section recovery symptom assessment decomposed from NHS.UK's published C-section recovery guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "c section incision", weight: 100 },
      { phrase: "csection wound looks infected", weight: 100 },
      { phrase: "cesarean scar symptoms", weight: 95 },
      { phrase: "c section pain and questions", weight: 90 },
      { phrase: "c section incision looks infected", weight: 100 },
      { phrase: "incision oozing fluid", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-csectionsymptoms-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many days since the C-section?" },
      { id: "oscg-csectionsymptoms-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Describe how the wound looks." },
      { id: "oscg-csectionsymptoms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever, heavy bleeding, leg pain, chest pain, or breathing difficulty?" },
      { id: "oscg-csectionsymptoms-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-csectionsymptoms-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there trouble breathing, chest pain, fainting, heavy or gushing vaginal bleeding, confusion, or rapidly worsening severe pain or illness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Breathing difficulty, chest pain, fainting, heavy bleeding, confusion, or rapidly worsening illness are urgent maternal warning signs requiring immediate emergency care.",
        redFlag: true,
        keywords: ["infected c section wound", "heavy bleeding after c section", "leg swelling after c section"],
        careAdviceIds: ["oscg-csectionsymptoms-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-csectionsymptoms-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the wound increasingly red, painful, swollen, opening, or draining pus or foul-smelling fluid; is there fever, persistent severe incision pain, painful urination, or leaking urine without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists wound infection and urinary symptoms after a C-section as requiring prompt clinical review.",
        redFlag: false,
        keywords: ["pain peeing after c section", "leaking urine after c section"],
        careAdviceIds: ["oscg-csectionsymptoms-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-csectionsymptoms-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this normal, expected C-section recovery with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes routine wound care and gradual activity increase as the expected recovery path.",
        redFlag: false,
        keywords: ["normal c section recovery"],
        careAdviceIds: ["oscg-csectionsymptoms-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-csectionsymptoms-emergency-advice", titleEn: "Emergency C-section complication precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not drive yourself. Tell the call handler about the recent C-section.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain or bleeding", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-csectionsymptoms-urgent-advice", titleEn: "Urgent C-section complication review", instructionTextEn: "Arrange prompt clinical assessment through the locally approved Qatar maternity pathway; the exact non-emergency destination remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-csectionsymptoms-selfcare-advice", titleEn: "Home care for normal C-section recovery", instructionTextEn: "Follow the discharge team's wound-care and activity instructions. Keep the wound clean and dry, use sanitary pads rather than tampons, and increase gentle activity gradually. A clinician or pharmacist should confirm any pain medicine is suitable for this patient, including during breastfeeding.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["wound becomes red, painful, swollen, opens, or drains fluid", "fever, heavy bleeding, chest pain, breathing difficulty, or one-sided leg pain develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-04", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Caesarean section - Recovery\", https://www.nhs.uk/conditions/caesarean-section/recovery/ (page last reviewed 04 January 2023)"],
      contentNotice: "Decomposed from NHS.UK's published C-section recovery guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Postpartum - Leg Pain - https://www.nhs.uk/conditions/caesarean-section/recovery/ (reviewed 2023-01-04), generalized to all postpartum
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-leg-pain",
    titleEn: "Postpartum - Leg Pain",
    clinicalDefinitionEn: "Postpartum leg pain assessment, generalized from NHS.UK's C-section recovery blood-clot warning sign to all postpartum deliveries, given the same elevated clot risk applies.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "leg pain after having the baby", weight: 100 },
      { phrase: "leg hurts since giving birth", weight: 100 },
      { phrase: "postpartum leg pain", weight: 100 },
      { phrase: "calf pain after delivery", weight: 95 },
      { phrase: "leg has really been hurting since giving birth", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumlegpain-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumlegpain-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Which leg, and where exactly?" },
      { id: "oscg-postpartumlegpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any shortness of breath or chest pain?" },
      { id: "oscg-postpartumlegpain-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumlegpain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there swelling or pain in one leg (especially the calf), along with shortness of breath or chest pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK C-section recovery guidance lists leg swelling/pain as a blood clot warning sign - the postpartum period carries an elevated clotting risk regardless of delivery method, and breathing/chest symptoms suggest the clot may have traveled to the lungs.",
        redFlag: true,
        keywords: ["leg swelling with shortness of breath postpartum", "one leg swollen and painful after birth"],
        careAdviceIds: ["oscg-postpartumlegpain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumlegpain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there leg pain or swelling without breathing or chest symptoms?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Any new leg swelling or pain in the postpartum period should be checked promptly given the elevated blood clot risk.",
        redFlag: false,
        keywords: ["new leg pain postpartum no breathing symptoms"],
        careAdviceIds: ["oscg-postpartumlegpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumlegpain-emergency-advice", titleEn: "Emergency postpartum blood clot precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Keep the patient at rest and do not let them drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumlegpain-urgent-advice", titleEn: "Urgent postpartum leg pain review", instructionTextEn: "Arrange prompt in-person assessment to rule out a blood clot; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED. Call 999 if chest pain, breathing difficulty, fainting, or coughing blood develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty or chest pain develops", "swelling worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-04", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Caesarean section - Recovery\" (blood clot warning sign), https://www.nhs.uk/conditions/caesarean-section/recovery/ (page last reviewed 04 January 2023) - generalized to all postpartum deliveries"],
      contentNotice: "The C-section page's blood-clot warning sign is generalized here to all postpartum deliveries, since the elevated postpartum clotting risk applies regardless of delivery method (widely-recognized obstetric knowledge) - a documented generalization. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Postpartum - Leg Swelling and Edema - same source as Postpartum - Leg Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-leg-swelling-and-edema",
    titleEn: "Postpartum - Leg Swelling and Edema",
    clinicalDefinitionEn: "Postpartum leg swelling assessment, generalized from the same NHS.UK C-section recovery blood-clot warning sign as Postpartum - Leg Pain.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "leg swelling after having the baby", weight: 100 },
      { phrase: "legs are swollen since giving birth", weight: 100 },
      { phrase: "postpartum leg swelling", weight: 100 },
      { phrase: "one leg more swollen than the other after birth", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumlegswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumlegswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is one leg more swollen than the other?" },
      { id: "oscg-postpartumlegswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any shortness of breath or chest pain?" },
      { id: "oscg-postpartumlegswelling-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumlegswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is one leg more swollen or painful than the other, along with shortness of breath or chest pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "One-sided leg swelling with breathing/chest symptoms is a recognized blood clot red flag, and the postpartum period carries an elevated clotting risk regardless of delivery method.",
        redFlag: true,
        keywords: ["one leg swollen with shortness of breath postpartum"],
        careAdviceIds: ["oscg-postpartumlegswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumlegswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is one leg noticeably more swollen than the other, without breathing or chest symptoms?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Asymmetric leg swelling should be checked promptly to rule out a blood clot, given the elevated postpartum risk.",
        redFlag: false,
        keywords: ["one leg more swollen than other postpartum"],
        careAdviceIds: ["oscg-postpartumlegswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumlegswelling-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, even swelling in both legs/ankles with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, symmetric ankle/leg swelling is common after birth from fluid shifts and is usually not a clot concern.",
        redFlag: false,
        keywords: ["mild even leg swelling postpartum"],
        careAdviceIds: ["oscg-postpartumlegswelling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumlegswelling-emergency-advice", titleEn: "Emergency postpartum blood clot precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Keep the patient at rest and do not let them drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumlegswelling-urgent-advice", titleEn: "Urgent postpartum leg swelling review", instructionTextEn: "Arrange prompt in-person assessment to rule out a blood clot; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty or chest pain develops", "swelling worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumlegswelling-selfcare-advice", titleEn: "Home care for mild postpartum leg swelling", instructionTextEn: "Elevate the legs when resting, stay mobile with gentle walking, and drink plenty of fluids.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["one leg becomes more swollen than the other", "breathing difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-04", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Caesarean section - Recovery\" (blood clot warning sign), https://www.nhs.uk/conditions/caesarean-section/recovery/ (page last reviewed 04 January 2023) - generalized to all postpartum deliveries"],
      contentNotice: "Generalized from the same C-section blood-clot warning sign already used for Postpartum - Leg Pain, split out for the swelling-predominant presentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Postpartum - Urination Pain - https://www.nhs.uk/conditions/caesarean-section/recovery/ + cystitis source (batch14)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-urination-pain",
    titleEn: "Postpartum - Urination Pain",
    clinicalDefinitionEn: "Postpartum painful urination assessment, combining NHS.UK's C-section recovery urinary-symptom warning with the cystitis guidance already used for Urination Pain - Female (batch14).",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "painful urination after giving birth", weight: 100 },
      { phrase: "hurts to pee since having the baby", weight: 100 },
      { phrase: "postpartum urination pain", weight: 100 },
      { phrase: "leaking urine after delivery", weight: 90 },
      { phrase: "hurts so bad to pee since having the baby", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumurinepain-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumurinepain-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-postpartumurinepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any back/flank pain or blood in the urine?" },
      { id: "oscg-postpartumurinepain-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumurinepain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with urinary symptoms, is there confusion, trouble breathing or very fast breathing, fainting, cold or clammy skin, or rapidly worsening severe illness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are sepsis red flags, and postpartum infection can progress quickly - always treated as an emergency.",
        redFlag: true,
        keywords: ["confused with urinary symptoms postpartum", "seriously unwell after delivery"],
        careAdviceIds: ["oscg-postpartumurinepain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumurinepain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there pain when urinating, leaking urine, back or flank pain, fever, or blood in the urine?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists painful or leaking urination after a C-section as needing prompt review, and the same applies to any postpartum delivery given the shared infection risk.",
        redFlag: false,
        keywords: ["pain peeing after delivery", "leaking urine after delivery"],
        careAdviceIds: ["oscg-postpartumurinepain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumurinepain-emergency-advice", titleEn: "Emergency postpartum infection precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not let the patient drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumurinepain-urgent-advice", titleEn: "Urgent postpartum urinary symptom review", instructionTextEn: "Arrange prompt clinical assessment; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED. Postpartum urinary symptoms may need examination and testing.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever develops", "back pain worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-04", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Caesarean section - Recovery\" (urinary symptom warning), https://www.nhs.uk/conditions/caesarean-section/recovery/ (page last reviewed 04 January 2023)",
        "NHS.UK, \"Cystitis\" (already cited for Urination Pain - Female, batch14), https://www.nhs.uk/conditions/cystitis/"
      ],
      contentNotice: "Combines the NHS.UK C-section recovery page's urinary-symptom warning (generalized to all postpartum deliveries) with the cystitis source already used elsewhere in this content set. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Postpartum - Fever - https://www.nhs.uk/conditions/caesarean-section/recovery/ + standard postpartum sepsis knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-fever",
    titleEn: "Postpartum - Fever",
    clinicalDefinitionEn: "Postpartum fever or suspected infection assessment using published urgent maternal warning signs and C-section wound-infection guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "fever after giving birth", weight: 100 },
      { phrase: "postpartum fever", weight: 100 },
      { phrase: "temperature since having the baby", weight: 95 },
      { phrase: "feel feverish after delivery", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumfever-iaq1", sequence: 1, responseType: "TEMPERATURE", promptTextEn: "What is the temperature?" },
      { id: "oscg-postpartumfever-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumfever-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any wound redness, foul-smelling discharge, urinary symptoms, or breast tenderness?" },
      { id: "oscg-postpartumfever-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumfever-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with fever or feeling feverish, is there confusion, trouble breathing or very fast breathing, fainting, cold or clammy skin, or rapidly worsening severe illness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are systemic urgent maternal warning signs compatible with severe infection or sepsis and require immediate emergency care.",
        redFlag: true,
        keywords: ["fever with foul smelling discharge postpartum", "fever with confusion postpartum", "high fever after delivery"],
        careAdviceIds: ["oscg-postpartumfever-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumfever-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the measured temperature 38 C or higher, or is there feverishness with foul-smelling vaginal discharge, worsening lower abdominal pain, urinary symptoms, breast redness or pain, or a wound that is red, painful, swollen, opening, or draining fluid, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "CDC lists a temperature of 100.4 F (38 C) or higher as an urgent maternal warning sign; focal postpartum infection features also need prompt clinical assessment.",
        redFlag: false,
        keywords: ["mild fever postpartum"],
        careAdviceIds: ["oscg-postpartumfever-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumfever-emergency-advice", titleEn: "Emergency postpartum sepsis precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not let the patient drive. Tell the call handler that the patient gave birth recently.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumfever-urgent-advice", titleEn: "Urgent postpartum fever review", instructionTextEn: "Arrange prompt clinical assessment through the locally approved Qatar maternity pathway; the exact non-emergency destination remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "any new symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-04", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Caesarean section - Recovery\" (wound infection warning), https://www.nhs.uk/conditions/caesarean-section/recovery/", "CDC Hear Her urgent maternal warning signs (temperature 100.4 F / 38 C or higher; severe systemic symptoms), https://www.cdc.gov/hearher/"],
      contentNotice: "Combines published C-section wound-infection guidance with CDC urgent maternal warning signs. Exact non-emergency Qatar routing remains a governance decision. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Postpartum - Breast Pain and Engorgement - https://www.nhs.uk/conditions/mastitis/ (reviewed 2023-03-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-breast-pain-and-engorgement",
    titleEn: "Postpartum - Breast Pain and Engorgement",
    clinicalDefinitionEn: "Breastfeeding-related breast pain/engorgement/mastitis assessment decomposed from NHS.UK's published mastitis guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "breast pain breastfeeding", weight: 100 },
      { phrase: "engorged breasts", weight: 100 },
      { phrase: "think i have mastitis", weight: 100 },
      { phrase: "sore red breast breastfeeding", weight: 95 },
      { phrase: "think i might have mastitis", weight: 100 },
      { phrase: "breasts are so engorged and painful", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumbreastpain-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the breast pain/redness lasted?" },
      { id: "oscg-postpartumbreastpain-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Currently breastfeeding?" },
      { id: "oscg-postpartumbreastpain-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-postpartumbreastpain-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumbreastpain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the postpartum patient confused, difficult to wake, fainting or collapsing, severely short of breath, blue or grey, having a seizure, unable to keep fluids down and rapidly worsening, or otherwise appearing critically unwell with the breast symptoms?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Altered responsiveness, collapse, severe breathing difficulty, seizure or rapid systemic deterioration can indicate sepsis or another life-threatening postpartum complication and require emergency assessment.",
        redFlag: true,
        keywords: ["mastitis with sepsis", "collapse postpartum breast infection", "confusion with mastitis"],
        careAdviceIds: ["oscg-postpartumbreastpain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumbreastpain-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is the measured temperature 38 degrees Celsius or higher, is there shaking chills or feeling systemically unwell, is breast redness or swelling spreading rapidly, have symptoms not improved 12-24 hours after home treatment or 48 hours after starting antibiotics, or is this mastitis in someone not breastfeeding?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Postpartum fever and systemic illness require prompt clinical assessment, and NHS.UK mastitis guidance recommends clinical review when symptoms fail to improve or occur outside breastfeeding.",
        redFlag: false,
        keywords: ["postpartum fever with mastitis", "mastitis not improving with treatment", "mastitis not breastfeeding"],
        careAdviceIds: ["oscg-postpartumbreastpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumbreastpain-q1-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this early engorgement or mild mastitis with no fever, systemic illness, rapid spreading redness, or other features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes continued breastfeeding/expressing, cold compresses, and pain relief as effective first-line self-care.",
        redFlag: false,
        keywords: ["mild breast engorgement"],
        careAdviceIds: ["oscg-postpartumbreastpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumbreastpain-emergency-advice", titleEn: "Emergency postpartum systemic illness response", instructionTextEn: "Call Qatar emergency services on 999 now for confusion, reduced responsiveness, collapse, severe breathing difficulty, seizure or rapid critical deterioration. Tell the call handler that the patient gave birth recently and has breast symptoms. Follow emergency instructions and do not self-drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["responsiveness or breathing worsens", "collapse or seizure", "rapid deterioration"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumbreastpain-urgent-advice", titleEn: "Urgent mastitis review", instructionTextEn: "Arrange prompt clinical review; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED. Antibiotics or further treatment may be needed.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "redness spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumbreastpain-selfcare-advice", titleEn: "Home care for breast engorgement or mild mastitis", instructionTextEn: "Continue breastfeeding responsively if able, or hand express only enough for comfort if feeding is too painful. Check positioning and attachment, use a cold compress, rest, and avoid deep breast massage, tight clothing, over-expressing, and stopping breastfeeding abruptly. A clinician or pharmacist should confirm any pain medicine is suitable for this patient.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after 12-24 hours", "fever or spreading redness develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-03-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Mastitis\", https://www.nhs.uk/conditions/mastitis/ (page last reviewed 17 March 2023)",
        "CDC HEAR HER, \"Urgent Maternal Warning Signs and Symptoms\", https://www.cdc.gov/hearher/maternal-warning-signs/index.html",
        "NHS.UK, \"Sepsis\", https://www.nhs.uk/conditions/sepsis/"
      ],
      contentNotice: "Decomposed from NHS.UK's published mastitis guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Postpartum - Vaginal Bleeding and Lochia - standard obstetric knowledge (postpartum hemorrhage recognition)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-vaginal-bleeding-and-lochia",
    titleEn: "Postpartum - Vaginal Bleeding and Lochia",
    clinicalDefinitionEn: "Postpartum vaginal bleeding assessment using published urgent maternal warning signs and postpartum haemorrhage guidance; remote pad counts are supporting observations, not a stand-alone diagnostic threshold.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "postpartum bleeding", weight: 100 },
      { phrase: "lochia", weight: 100 },
      { phrase: "bleeding heavily after birth", weight: 100 },
      { phrase: "soaking through pads after delivery", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumbleeding-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many days/weeks since delivery?" },
      { id: "oscg-postpartumbleeding-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How many pads are being soaked per hour, and are there clots?" },
      { id: "oscg-postpartumbleeding-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any dizziness, fainting, weakness, confusion, clammy skin, or a fast-beating heart?" },
      { id: "oscg-postpartumbleeding-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" }
    ],
    questions: [
      {
        id: "oscg-postpartumbleeding-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there heavy or gushing vaginal bleeding, bleeding rapidly soaking pads, large clots, fainting or severe dizziness, weakness, confusion, pale or clammy skin, a fast-beating heart, or rapidly increasing bleeding?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are published postpartum haemorrhage and urgent maternal warning signs. Postpartum haemorrhage usually occurs within 24 hours but can occur up to 12 weeks after birth.",
        redFlag: true,
        keywords: ["soaking a pad every hour postpartum", "large clots postpartum bleeding", "dizzy and bleeding heavily after birth"],
        careAdviceIds: ["oscg-postpartumbleeding-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumbleeding-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the vaginal discharge have a foul smell, or has bleeding that was decreasing suddenly become heavier again?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A foul smell can indicate infection, and bleeding becoming heavier after decreasing needs prompt evaluation.",
        redFlag: false,
        keywords: ["foul smelling lochia", "bleeding gets heavier again postpartum"],
        careAdviceIds: ["oscg-postpartumbleeding-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumbleeding-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical lochia - gradually lightening and changing from red to pink/brown to white/yellow over several weeks - with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Normal lochia gradually decreases in amount and changes color over about 4-6 weeks after birth.",
        redFlag: false,
        keywords: ["typical lochia gradually lightening"],
        careAdviceIds: ["oscg-postpartumbleeding-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumbleeding-emergency-advice", titleEn: "Emergency postpartum hemorrhage precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Keep the patient lying down if safe, do not let them drive, and tell the call handler that they gave birth recently.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening dizziness", "worsening bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumbleeding-urgent-advice", titleEn: "Urgent postpartum bleeding review", instructionTextEn: "Arrange prompt clinical assessment; the exact non-emergency Qatar maternity destination remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding increases", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumbleeding-selfcare-advice", titleEn: "Home monitoring for normal lochia", instructionTextEn: "Use sanitary pads (not tampons), and expect the discharge to gradually lighten in amount and change from red to pink/brown to white/yellow over about 4-6 weeks. Rest and stay hydrated.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding becomes heavier instead of lighter", "foul smell, fever, or dizziness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["ACOG, \"3 Conditions to Watch for After Childbirth\" (postpartum haemorrhage can occur up to 12 weeks after birth), https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth", "CDC Hear Her urgent maternal warning signs, https://www.cdc.gov/hearher/"],
      contentNotice: "Uses published ACOG postpartum haemorrhage information and CDC urgent maternal warning signs. The normal-lochia branch remains UAT-only and requires Qatar clinical-governance validation. Not licensed Schmitt-Thompson (STCC) content."
    })
  }
];
