import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 22 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence) where available, plus standard, non-proprietary medical/safety
 * knowledge where a specific NHS.UK page could not be retrieved (Contraception
 * - Birth Control Pills Combined uses the globally-recognized "ACHES" blood-clot
 * warning mnemonic; Muscle Aches and Body Pain generalizes the flu guidance
 * already used in batch19; Face Pain and Mouth Pain generalize the sinus/
 * tooth/mouth-injury sources already established). Child Abuse Suspected and
 * Child Neglect Suspected follow the same sensitive-topic handling already
 * established for Domestic Violence (batch16) and Elder/Vulnerable Adult
 * Abuse: no fabricated hotline numbers, host org must insert local Qatar
 * mandated-reporting/support contacts before production use.
 */
export const batch22Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Pelvic Pain - Female - https://www.nhs.uk/conditions/pelvic-pain/ (reviewed 2025-11-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-pelvic-pain-female",
    titleEn: "Pelvic Pain - Female",
    clinicalDefinitionEn: "Pelvic pain assessment decomposed from NHS.UK's published pelvic pain guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 4,
    keywords: [
      { phrase: "pelvic pain", weight: 100 },
      { phrase: "pain in my lower abdomen", weight: 85 },
      { phrase: "pain in my pelvis", weight: 95 },
      { phrase: "lower belly pain female", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-pelvicpainf-iaq1", sequence: 1, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" },
      { id: "oscg-pelvicpainf-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it lasted?" },
      { id: "oscg-pelvicpainf-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Could the person be pregnant?" }
    ],
    questions: [
      {
        id: "oscg-pelvicpainf-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the pain severe, worsening, or worse with movement/touch, is there faintness, dizziness, or loss of consciousness, pain in the tip of the shoulder, breathing difficulty, heavy vaginal bleeding, or sudden confusion?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK pelvic pain guidance lists these as call-999/A&E criteria - shoulder-tip pain with pelvic pain and possible pregnancy can indicate a ruptured ectopic pregnancy.",
        redFlag: true,
        keywords: ["severe pelvic pain with dizziness", "shoulder tip pain with pelvic pain", "heavy vaginal bleeding with pelvic pain"],
        careAdviceIds: ["oscg-pelvicpainf-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-pelvicpainf-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there difficulty with urination or bowel movements, blood in urine or stool, unusual vaginal discharge or bleeding, pain or frequency with urination, a very high temperature with chills, vomiting and diarrhea, or a known/suspected pregnancy?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent NHS 111 contact for these features - if 20+ weeks pregnant, contact the midwife directly.",
        redFlag: false,
        keywords: ["pelvic pain with fever", "pelvic pain with vaginal discharge", "pregnant with pelvic pain"],
        careAdviceIds: ["oscg-pelvicpainf-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-pelvicpainf-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild pelvic pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends a GP visit for persistent mild pelvic pain to determine the cause.",
        redFlag: false,
        keywords: ["mild pelvic pain"],
        careAdviceIds: ["oscg-pelvicpainf-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pelvicpainf-emergency-advice", titleEn: "Emergency pelvic pain precautions", instructionTextEn: "Arrange emergency transport immediately - this combination can indicate a serious emergency such as a ruptured ectopic pregnancy.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "worsening dizziness or bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pelvicpainf-urgent-advice", titleEn: "Urgent pelvic pain review", instructionTextEn: "Arrange same-day medical review (or contact the midwife directly if 20+ weeks pregnant) for these accompanying symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-pelvicpainf-selfcare-advice", titleEn: "Routine pelvic pain follow-up", instructionTextEn: "Book a GP appointment if the pain persists, especially with unexplained weight loss or digestive changes, to determine the underlying cause.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "new symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-11-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pelvic pain\", https://www.nhs.uk/conditions/pelvic-pain/ (page last reviewed 24 November 2025)"],
      contentNotice: "Decomposed from NHS.UK's published pelvic pain guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Abdominal Pain - Upper - https://www.nhs.uk/conditions/indigestion/ (reviewed 2023-05-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-abdominal-pain-upper",
    titleEn: "Abdominal Pain - Upper",
    clinicalDefinitionEn: "Upper abdominal pain / indigestion assessment decomposed from NHS.UK's published indigestion guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "upper abdominal pain", weight: 100 },
      { phrase: "indigestion", weight: 100 },
      { phrase: "pain in my upper stomach", weight: 90 },
      { phrase: "heartburn and stomach pain", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-upperabdopain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-upperabdopain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it lasted?" },
      { id: "oscg-upperabdopain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any difficulty swallowing, vomiting blood, or black stool?" }
    ],
    questions: [
      {
        id: "oscg-upperabdopain-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Are episodes recurring, is the pain severe, is there unexplained weight loss, difficulty swallowing, persistent vomiting, a lump felt in the abdomen, or blood in vomit or stool?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK indigestion guidance lists these as reasons to see a GP - they can be a sign of something more serious.",
        redFlag: false,
        keywords: ["indigestion with weight loss", "difficulty swallowing with stomach pain", "blood in vomit with stomach pain"],
        careAdviceIds: ["oscg-upperabdopain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-upperabdopain-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this typical indigestion/heartburn with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes dietary and lifestyle measures plus pharmacy antacids as effective first-line self-care.",
        redFlag: false,
        keywords: ["typical indigestion heartburn"],
        careAdviceIds: ["oscg-upperabdopain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-upperabdopain-urgent-advice", titleEn: "Urgent upper abdominal pain review", instructionTextEn: "Arrange a GP appointment for these concerning symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "blood in vomit or stool develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-upperabdopain-selfcare-advice", titleEn: "Home care for indigestion/heartburn", instructionTextEn: "Reduce caffeine, alcohol, and cola, avoid eating within 3-4 hours of bedtime, avoid rich, spicy, or fatty foods, raise the head of the bed slightly, and lose weight if overweight. A pharmacist can recommend an antacid, alginate, or acid-reducing medicine. Avoid ibuprofen or aspirin without medical advice, and don't smoke.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms recur often or worsen", "weight loss or swallowing difficulty develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Indigestion\", https://www.nhs.uk/conditions/indigestion/ (page last reviewed 05 May 2023)"],
      contentNotice: "Decomposed from NHS.UK's published indigestion guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for upper abdominal pain. Distinct from the excluded Abdominal Pain - Female/Male and Abdominal Injury topics (permanently out of scope for this content set due to an unrelated reference-file contamination concern). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Contraception - IUD Symptoms and Questions - https://www.nhs.uk/contraception/methods-of-contraception/iud-coil/side-effects/ (reviewed 2024-02-15)
  // ------------------------------------------------------------------
  {
    id: "oscg-contraception-iud",
    titleEn: "Contraception - IUD Symptoms and Questions",
    clinicalDefinitionEn: "IUD (coil) symptom assessment decomposed from NHS.UK's published IUD side-effects guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 3,
    keywords: [
      { phrase: "iud symptoms", weight: 100 },
      { phrase: "coil side effects", weight: 100 },
      { phrase: "cant feel my iud strings", weight: 100 },
      { phrase: "iud pain question", weight: 90 },
      { phrase: "have an iud and cant feel the strings", weight: 100 },
      { phrase: "cant feel the strings anymore", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-iudsymptoms-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the IUD fitted?" },
      { id: "oscg-iudsymptoms-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are present?" },
      { id: "oscg-iudsymptoms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the IUD threads be felt as usual?" }
    ],
    questions: [
      {
        id: "oscg-iudsymptoms-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there lower tummy pain that painkillers don't help, sudden pain that's worsening or won't go away, a high temperature or abnormal/smelly discharge, very heavy vaginal bleeding, a suspected pregnancy, or can the IUD threads not be felt or do they feel different?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK IUD side-effects guidance lists these as reasons to seek urgent medical attention - missing threads can mean reduced pregnancy protection or a shifted device.",
        redFlag: false,
        keywords: ["cant feel my iud threads", "severe pain after iud", "smelly discharge with iud"],
        careAdviceIds: ["oscg-iudsymptoms-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-iudsymptoms-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Are these common expected side effects (period-like pain after fitting, bleeding between periods, heavier/longer periods) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes these as common IUD side effects that often improve over the first few months.",
        redFlag: false,
        keywords: ["common iud side effects"],
        careAdviceIds: ["oscg-iudsymptoms-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-iudsymptoms-urgent-advice", titleEn: "Urgent IUD symptom review", instructionTextEn: "Arrange same-day review to check the IUD position and rule out infection or pregnancy. Use a backup contraception method (such as condoms) until checked if the threads can't be felt.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "bleeding increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-iudsymptoms-selfcare-advice", titleEn: "Home monitoring for common IUD side effects", instructionTextEn: "Mild period-like pain and bleeding changes are common in the first few months and often settle. Take paracetamol or ibuprofen for cramping as directed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens or is not relieved by painkillers", "cannot feel the threads or they feel different"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-02-15", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"IUD (coil) - Side effects\", https://www.nhs.uk/contraception/methods-of-contraception/iud-coil/side-effects/ (page last reviewed 15 February 2024)"],
      contentNotice: "Decomposed from NHS.UK's published IUD side-effects guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Contraception - Birth Control Pills Combined - standard reproductive health knowledge (ACHES mnemonic)
  // ------------------------------------------------------------------
  {
    id: "oscg-contraception-birth-control-pills-combined",
    titleEn: "Contraception - Birth Control Pills Combined",
    clinicalDefinitionEn: "Combined contraceptive pill symptom assessment based on standard, globally-recognized reproductive-health knowledge (the \"ACHES\" blood-clot warning sign mnemonic).",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 4,
    keywords: [
      { phrase: "combined pill side effects", weight: 100 },
      { phrase: "birth control pill question", weight: 95 },
      { phrase: "combined oral contraceptive symptoms", weight: 90 },
      { phrase: "on the pill and feel off", weight: 85 },
      { phrase: "on the combined pill", weight: 100 },
      { phrase: "bad headache and my vision is blurry", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-combinedpill-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the pill been taken?" },
      { id: "oscg-combinedpill-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are present?" },
      { id: "oscg-combinedpill-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any smoking history or personal/family history of blood clots?" }
    ],
    questions: [
      {
        id: "oscg-combinedpill-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe abdominal pain, chest pain or shortness of breath, a severe headache unlike usual, eye problems (blurred vision, loss of vision, double vision), or severe leg pain/swelling - the well-known \"ACHES\" combined-pill blood clot warning signs?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "The ACHES mnemonic (Abdominal pain, Chest pain, Headache severe, Eye problems, Severe leg pain/swelling) is globally-taught reproductive health knowledge for recognizing a serious blood clot complication of combined hormonal contraception, requiring immediate emergency evaluation.",
        redFlag: true,
        keywords: ["severe headache on the pill", "chest pain on birth control", "leg swelling on the pill", "vision changes on birth control"],
        careAdviceIds: ["oscg-combinedpill-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-combinedpill-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Are these mild, common side effects (breast tenderness, mood changes, breakthrough bleeding, headache relieved by simple painkillers) with none of the ACHES features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild side effects are common when starting or continuing the combined pill and often settle within a few months.",
        redFlag: false,
        keywords: ["mild combined pill side effects"],
        careAdviceIds: ["oscg-combinedpill-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-combinedpill-emergency-advice", titleEn: "Emergency combined-pill blood clot precautions", instructionTextEn: "Arrange emergency transport immediately - these are recognized warning signs of a serious blood clot and need urgent evaluation.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "worsening breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-combinedpill-selfcare-advice", titleEn: "Home monitoring for mild combined-pill side effects", instructionTextEn: "Mild breast tenderness, mood changes, or breakthrough bleeding are common, especially in the first few months, and often settle on their own.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["any ACHES symptom (abdominal pain, chest pain, severe headache, eye problems, severe leg pain/swelling) develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, globally-recognized reproductive-health knowledge - the \"ACHES\" combined-hormonal-contraceptive blood clot warning mnemonic - the specific NHS.UK combined pill side-effects subpage could not be retrieved during authoring"],
      contentNotice: "The NHS.UK combined pill side-effects subpage could not be retrieved during authoring. This protocol is based on the widely-taught ACHES mnemonic, standard reproductive-health education used internationally. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Face Pain - generalized from Sinus Pain/Congestion (batch11) and Toothache (batch14)
  // ------------------------------------------------------------------
  {
    id: "oscg-face-pain",
    titleEn: "Face Pain",
    clinicalDefinitionEn: "Non-traumatic facial pain assessment, generalized from the sinus pain and toothache criteria already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "face pain", weight: 100 },
      { phrase: "my face hurts", weight: 90 },
      { phrase: "facial pain no injury", weight: 90 },
      { phrase: "pain in my cheek and jaw", weight: 85 },
      { phrase: "face has been hurting for the past couple days", weight: 100 },
      { phrase: "whole face has been hurting", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-facepain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-facepain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it lasted?" },
      { id: "oscg-facepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any facial swelling, fever, or vision change?" }
    ],
    questions: [
      {
        id: "oscg-facepain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there facial swelling making it hard to breathe, swallow, or speak, or is there vision change, sudden severe facial swelling near the eye, or high fever with severe facial pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Consistent with the emergency criteria already established for Toothache (spreading swelling threatening the airway) and Sinus Pain (orbital spread risk) in this system.",
        redFlag: true,
        keywords: ["face swelling trouble breathing", "face pain with vision change"],
        careAdviceIds: ["oscg-facepain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-facepain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there facial swelling, fever, pain lasting more than a few days, or pain not relieved by simple painkillers?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the urgent tiers already used for Toothache and Sinus Pain, these signs warrant prompt in-person assessment.",
        redFlag: false,
        keywords: ["face pain with swelling", "face pain lasting days"],
        careAdviceIds: ["oscg-facepain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-facepain-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild facial pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild facial pain (e.g. from sinus congestion or muscle tension) is often manageable at home.",
        redFlag: false,
        keywords: ["mild face pain"],
        careAdviceIds: ["oscg-facepain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-facepain-emergency-advice", titleEn: "Emergency face pain precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing difficulty", "vision worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-facepain-urgent-advice", titleEn: "Urgent face pain review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-facepain-selfcare-advice", titleEn: "Home care for mild face pain", instructionTextEn: "Take a suitable over-the-counter pain reliever, apply a warm compress if sinus-related, and rest.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens or lasts more than a few days", "swelling or fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Generalized from the Sinus Pain or Congestion (batch11) and Toothache (batch14) emergency/urgent criteria already established in this system - no single dedicated NHS.UK general facial-pain page was found"],
      contentNotice: "This protocol generalizes the emergency/urgent facial-swelling criteria already used for Toothache and Sinus Pain to general facial pain, distinct from the traumatic Face Injury protocol (batch13). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Mouth Pain - generalized from Toothache (batch14) and Mouth Injury (batch13)
  // ------------------------------------------------------------------
  {
    id: "oscg-mouth-pain",
    titleEn: "Mouth Pain",
    clinicalDefinitionEn: "Non-traumatic mouth pain assessment, generalized from the toothache and mouth-injury criteria already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "mouth pain", weight: 100 },
      { phrase: "my mouth hurts", weight: 90 },
      { phrase: "mouth pain no injury", weight: 90 },
      { phrase: "sore inside my mouth", weight: 85 },
      { phrase: "inside of my mouth has just been sore", weight: 100 },
      { phrase: "mouth has just been sore for a couple days", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mouthpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-mouthpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it lasted?" },
      { id: "oscg-mouthpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any swelling, fever, or difficulty swallowing?" }
    ],
    questions: [
      {
        id: "oscg-mouthpain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there swelling in the mouth or neck making it difficult to breathe, swallow, or speak?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Consistent with the emergency criteria already established for Toothache - spreading swelling threatening the airway needs immediate emergency care.",
        redFlag: true,
        keywords: ["mouth swelling trouble breathing", "mouth pain trouble swallowing"],
        careAdviceIds: ["oscg-mouthpain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-mouthpain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has the pain lasted more than 2 days, is it not relieved by painkillers, or is there fever, swelling, or red gums?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the Toothache protocol's urgent tier, these signs warrant a dental or medical appointment.",
        redFlag: false,
        keywords: ["mouth pain lasting days", "mouth pain with swelling"],
        careAdviceIds: ["oscg-mouthpain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-mouthpain-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, recent mouth pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild mouth pain (e.g. a minor ulcer or irritation) is often manageable at home.",
        redFlag: false,
        keywords: ["mild mouth pain"],
        careAdviceIds: ["oscg-mouthpain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mouthpain-emergency-advice", titleEn: "Emergency mouth pain precautions", instructionTextEn: "Do not drive to A&E - ask someone to drive you or call 999 for an ambulance.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening swelling", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthpain-urgent-advice", titleEn: "Urgent mouth pain review", instructionTextEn: "Arrange a prompt dental or medical appointment for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthpain-selfcare-advice", titleEn: "Home care for mild mouth pain", instructionTextEn: "Rinse with warm salt water, take a suitable over-the-counter pain reliever, and use a mouth pain-relief gel from a pharmacy if needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 days", "swelling or fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Generalized from the Toothache (batch14) and Mouth Injury (batch13) criteria already established in this system - no single dedicated NHS.UK general mouth-pain page was found"],
      contentNotice: "This protocol generalizes the emergency/urgent criteria already used for Toothache to general (non-dental, non-traumatic) mouth pain. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Muscle Aches and Body Pain - generalized from Flu (batch19)
  // ------------------------------------------------------------------
  {
    id: "oscg-muscle-aches-and-body-pain",
    titleEn: "Muscle Aches and Body Pain",
    clinicalDefinitionEn: "General muscle aches and body pain assessment, generalized from the flu guidance already used in this system, for callers with body aches as the primary concern.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "body aches", weight: 100 },
      { phrase: "muscles ache all over", weight: 95 },
      { phrase: "achy all over", weight: 90 },
      { phrase: "muscle aches and pains", weight: 90 },
      { phrase: "body just aches all over", weight: 100 },
      { phrase: "achy everywhere", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-muscleaches-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have the aches lasted?" },
      { id: "oscg-muscleaches-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-muscleaches-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any weakness, severe pain, or dark urine?" }
    ],
    questions: [
      {
        id: "oscg-muscleaches-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Along with the body aches, is there a high fever, severe muscle pain and weakness, dark urine, or is the person 65+, pregnant, or living with a long-term condition or weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the flu guidance already used in this system, severe muscle pain with dark urine can rarely indicate rhabdomyolysis (muscle breakdown), and higher-risk groups need prompt evaluation.",
        redFlag: false,
        keywords: ["severe muscle pain and dark urine", "body aches with high fever"],
        careAdviceIds: ["oscg-muscleaches-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-muscleaches-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this typical, mild body aches (e.g. from a cold, flu, or exercise) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, generalized muscle aches are commonly viral or exertional and manageable at home.",
        redFlag: false,
        keywords: ["mild typical body aches"],
        careAdviceIds: ["oscg-muscleaches-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-muscleaches-urgent-advice", titleEn: "Urgent body aches review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["weakness worsens", "urine gets darker"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-muscleaches-selfcare-advice", titleEn: "Home care for mild body aches", instructionTextEn: "Rest, stay hydrated, and take paracetamol or ibuprofen for pain and fever as directed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms worsen or don't improve after a week", "weakness or dark urine develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Flu\" (already cited for Influenza (Flu) Suspected, batch19), https://www.nhs.uk/conditions/flu/ - generalized to muscle aches/body pain as the primary presenting complaint"],
      contentNotice: "Generalized from the flu guidance already used elsewhere in this content set, for callers presenting primarily with body aches (with or without other flu symptoms). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Bullying - standard child/adolescent mental health support knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-bullying",
    titleEn: "Bullying",
    clinicalDefinitionEn: "Bullying/cyberbullying concern assessment based on standard, non-proprietary child and adolescent mental health support knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 3,
    keywords: [
      { phrase: "being bullied", weight: 100 },
      { phrase: "bullying at school", weight: 100 },
      { phrase: "cyberbullying", weight: 100 },
      { phrase: "kids being mean to my child", weight: 85 },
      { phrase: "getting bullied at school", weight: 100 },
      { phrase: "getting bullied and its affecting them", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bullying-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What has been happening, and for how long?" },
      { id: "oscg-bullying-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any thoughts of self-harm or not wanting to be alive?" },
      { id: "oscg-bullying-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has a trusted adult (parent, teacher, counselor) been told?" }
    ],
    questions: [
      {
        id: "oscg-bullying-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there any talk of self-harm, suicide, or not wanting to be alive because of the bullying, or is there an immediate physical safety threat?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Bullying is a recognized risk factor for self-harm and suicidal thinking in children and teens; any such statement needs immediate emergency mental health attention, consistent with the Suicide Concerns protocol already in this system.",
        redFlag: true,
        keywords: ["thoughts of self harm from bullying", "doesnt want to be alive because of bullying"],
        careAdviceIds: ["oscg-bullying-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bullying-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the bullying ongoing, affecting school attendance, sleep, or mood, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Ongoing bullying affecting daily functioning warrants prompt involvement of the school and a mental health professional.",
        redFlag: false,
        keywords: ["bullying affecting school", "bullying affecting sleep or mood"],
        careAdviceIds: ["oscg-bullying-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bullying-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a recent, isolated incident being handled with support from trusted adults, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Early, supported reporting to school staff and parents is the recommended first step for bullying concerns.",
        redFlag: false,
        keywords: ["isolated bullying incident being addressed"],
        careAdviceIds: ["oscg-bullying-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bullying-emergency-advice", titleEn: "Emergency bullying-related mental health precautions", instructionTextEn: "Connect the caller with your organization's local emergency mental health crisis line or emergency services immediately - do not leave the child unsupervised if there is any immediate risk.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["any immediate risk to the child"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bullying-urgent-advice", titleEn: "Getting help for ongoing bullying", instructionTextEn: "Report the bullying to the school and keep a written record of incidents. Encourage the child to stay connected with trusted friends and adults, and consider involving a school counselor or mental health professional if it's affecting mood, sleep, or school attendance.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["mood or behavior worsens", "any talk of self-harm develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-bullying-selfcare-advice", titleEn: "Supporting a child dealing with bullying", instructionTextEn: "Listen without judgment, reassure the child it isn't their fault, report the incident to school staff, and keep checking in regularly.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bullying continues or worsens", "mood or behavior changes develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary child and adolescent mental health support knowledge about bullying/cyberbullying - the specific NHS.UK bullying page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK bullying guidance page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary child/adolescent mental health support knowledge, and the emergency tier is consistent with the Suicide Concerns protocol already in this system. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, and the host organization should insert local school-safeguarding and crisis-support resources."
    })
  },

  // ------------------------------------------------------------------
  // 9. Child Abuse Suspected - standard child-safeguarding knowledge, sensitive-topic handling
  // ------------------------------------------------------------------
  {
    id: "oscg-child-abuse-suspected",
    titleEn: "Child Abuse Suspected",
    clinicalDefinitionEn: "Suspected child abuse assessment based on standard, non-proprietary child-safeguarding knowledge, following the same sensitive-topic handling already established for Domestic Violence (batch16).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 5,
    keywords: [
      { phrase: "suspect child abuse", weight: 100 },
      { phrase: "child was hurt by a caregiver", weight: 95 },
      { phrase: "worried someone is abusing my child", weight: 100 },
      { phrase: "unexplained injuries on my child", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-childabuse-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the child in immediate danger right now?" },
      { id: "oscg-childabuse-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What has been observed or disclosed?" },
      { id: "oscg-childabuse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the child currently safe and away from the suspected person?" }
    ],
    questions: [
      {
        id: "oscg-childabuse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the child in immediate danger right now, or are there signs of a serious injury (unexplained fractures, burns, bruising patterns inconsistent with the explanation given)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Standard child-safeguarding practice: a child's immediate physical safety always takes priority, and suspicious injury patterns need urgent medical and child-protection evaluation together.",
        redFlag: true,
        keywords: ["child in immediate danger", "unexplained fractures child", "suspicious bruising pattern child"],
        careAdviceIds: ["oscg-childabuse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-childabuse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there suspicion or a disclosure of abuse without immediate physical danger right now?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Standard safeguarding practice requires prompt referral to child-protection services and medical evaluation even without an active emergency, since delayed reporting can allow ongoing harm.",
        redFlag: false,
        keywords: ["disclosure of abuse", "suspected abuse no immediate danger"],
        careAdviceIds: ["oscg-childabuse-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-childabuse-emergency-advice", titleEn: "Emergency child safety precautions", instructionTextEn: "If the child is in immediate danger, connect the caller with emergency services right away. Arrange emergency medical evaluation for any suspicious injury.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["immediate danger continues"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-childabuse-urgent-advice", titleEn: "Reporting suspected child abuse", instructionTextEn: "Follow your organization's mandated-reporting protocol and connect the caller with local child-protection services promptly. Do not confront the suspected abuser directly - let child-protection professionals lead the investigation.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["the child's situation changes or new concerns arise"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary child-safeguarding knowledge (injury-pattern recognition, mandated-reporting practice) - not a single-source quote"],
      contentNotice: "Consistent with the sensitive-topic handling already established for Domestic Violence (batch16), this protocol does not name specific hotlines or agencies - care advice directs the triager to the host organization's own mandated-reporting protocol and local child-protection services, which MUST be configured before production use. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance and legal/safeguarding validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Child Neglect Suspected - standard child-safeguarding knowledge, sensitive-topic handling
  // ------------------------------------------------------------------
  {
    id: "oscg-child-neglect-suspected",
    titleEn: "Child Neglect Suspected",
    clinicalDefinitionEn: "Suspected child neglect assessment based on standard, non-proprietary child-safeguarding knowledge, following the same sensitive-topic handling as Child Abuse Suspected.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 4,
    keywords: [
      { phrase: "suspect child neglect", weight: 100 },
      { phrase: "child isnt being taken care of", weight: 95 },
      { phrase: "worried about child neglect", weight: 100 },
      { phrase: "child left alone unsupervised", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-childneglect-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the child in immediate danger right now (unsupervised, no food/shelter, medical needs unmet)?" },
      { id: "oscg-childneglect-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What has been observed?" },
      { id: "oscg-childneglect-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Are there any urgent unmet medical or safety needs right now?" }
    ],
    questions: [
      {
        id: "oscg-childneglect-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the child currently unsupervised and in an unsafe situation, severely malnourished or dehydrated, or does the child have an urgent unmet medical need?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Standard child-safeguarding practice: an unsafe unsupervised situation or an unmet urgent medical/nutritional need requires immediate intervention.",
        redFlag: true,
        keywords: ["child unsupervised unsafe", "child severely malnourished", "unmet medical need child"],
        careAdviceIds: ["oscg-childneglect-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-childneglect-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a pattern of concern (poor hygiene, frequent unexplained absences from school, inadequate clothing for weather) without an immediate emergency?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Standard safeguarding practice requires prompt referral to child-protection/social services for a suspected pattern of neglect, even without an immediate emergency.",
        redFlag: false,
        keywords: ["pattern of concern for neglect", "poor hygiene child neglect concern"],
        careAdviceIds: ["oscg-childneglect-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-childneglect-emergency-advice", titleEn: "Emergency child safety precautions", instructionTextEn: "Connect the caller with emergency services immediately for an unsafe unsupervised situation or unmet urgent medical need.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["immediate danger continues"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-childneglect-urgent-advice", titleEn: "Reporting suspected child neglect", instructionTextEn: "Follow your organization's mandated-reporting protocol and connect the caller with local child-protection/social services promptly.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["the child's situation worsens", "new concerns arise"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary child-safeguarding knowledge (neglect pattern recognition, mandated-reporting practice) - not a single-source quote"],
      contentNotice: "Consistent with the sensitive-topic handling already established for Child Abuse Suspected and Domestic Violence, this protocol does not name specific hotlines or agencies - care advice directs the triager to the host organization's own mandated-reporting protocol and local child-protection services, which MUST be configured before production use. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance and legal/safeguarding validation before production use."
    })
  }
];
