import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 21 - non-traumatic joint/limb pain and swelling topics, all
 * generalized from the same NHS.UK "joint pain" (non-injury) guidance page
 * already used for Arm Pain and Leg Pain (batch15) - the source's own scope
 * explicitly covers joint pain "not caused by an injury" generally, so
 * applying it per body part here is a direct, low-risk extension of an
 * already-established pattern rather than a new generalization. Each
 * protocol is distinct from its already-existing traumatic-injury sibling
 * (e.g. Ankle Pain here vs. a future/no Ankle Injury; Finger Pain vs. Finger
 * Injury from batch10; Hip Pain vs. Hip Injury from batch13).
 */
export const batch21Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Ankle Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-ankle-pain",
    titleEn: "Ankle Pain",
    clinicalDefinitionEn: "Non-traumatic ankle pain assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "ankle pain", weight: 100 },
      { phrase: "my ankle hurts", weight: 90 },
      { phrase: "ankle has been aching", weight: 90 },
      { phrase: "sore ankle no injury", weight: 85 },
      { phrase: "ankle has just been aching for a few days", weight: 100 },
      { phrase: "ankle pain no injury or anything", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-anklepain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-anklepain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-anklepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the ankle swollen and hot?" }
    ],
    questions: [
      {
        id: "oscg-anklepain-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the ankle swollen and hot, or does the person feel generally unwell with a high temperature or feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["ankle swollen and hot", "unwell with ankle pain"],
        careAdviceIds: ["oscg-anklepain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-anklepain-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild ankle pain without the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild joint pain as manageable at home with rest, ice, and gentle movement.",
        redFlag: false,
        keywords: ["mild ankle pain"],
        careAdviceIds: ["oscg-anklepain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-anklepain-urgent-advice", titleEn: "Urgent ankle pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-anklepain-selfcare-advice", titleEn: "Home care for mild ankle pain", instructionTextEn: "Rest the ankle when possible, apply an ice pack wrapped in a towel for up to 20 minutes every 2-3 hours, keep gently moving rather than fully immobilizing it, and take a suitable over-the-counter pain reliever.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 weeks", "swelling, redness, or fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\" (non-injury pain guidance), https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic ankle pain"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used for Arm Pain and Leg Pain (batch15), applied to the ankle. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Ankle Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-ankle-swelling",
    titleEn: "Ankle Swelling",
    clinicalDefinitionEn: "Non-traumatic ankle swelling assessment decomposed from NHS.UK's published joint pain guidance and shortness-of-breath guidance's swollen-ankle criterion (batch18).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "ankle swelling", weight: 100 },
      { phrase: "ankles are swollen", weight: 95 },
      { phrase: "swollen ankles no injury", weight: 90 },
      { phrase: "puffy ankles", weight: 85 },
      { phrase: "ankles are so swollen lately", weight: 100 },
      { phrase: "ankles are so swollen no injury", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-ankleswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the swelling lasted?" },
      { id: "oscg-ankleswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is one ankle more swollen than the other?" },
      { id: "oscg-ankleswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any shortness of breath or chest pain?" }
    ],
    questions: [
      {
        id: "oscg-ankleswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is one ankle much more swollen than the other, along with shortness of breath or chest pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "One-sided ankle/leg swelling with breathing or chest symptoms is a recognized blood clot red flag, consistent with the Leg Pain/Wells DVT concept already used in this system.",
        redFlag: true,
        keywords: ["one ankle more swollen with shortness of breath"],
        careAdviceIds: ["oscg-ankleswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-ankleswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the swelling hot and red, is the person unwell or feverish, or is the ankle swelling worse with breathlessness on exertion or lying down?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with NHS.UK joint pain and shortness-of-breath guidance - swollen ankles alongside breathlessness can indicate a heart or circulation problem needing prompt review.",
        redFlag: false,
        keywords: ["swollen ankles with breathlessness", "hot red swollen ankle"],
        careAdviceIds: ["oscg-ankleswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-ankleswelling-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, even swelling in both ankles with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, symmetric ankle swelling (e.g. from long periods of standing or heat) is often manageable at home.",
        redFlag: false,
        keywords: ["mild even ankle swelling"],
        careAdviceIds: ["oscg-ankleswelling-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ankleswelling-emergency-advice", titleEn: "Emergency ankle swelling precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ankleswelling-urgent-advice", titleEn: "Urgent ankle swelling review", instructionTextEn: "Arrange same-day medical review to check for a heart, circulation, or infection cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathlessness worsens", "swelling spreads"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-ankleswelling-selfcare-advice", titleEn: "Home care for mild ankle swelling", instructionTextEn: "Elevate the legs when resting, stay active with regular movement, reduce salt intake, and avoid standing for long periods.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["one ankle becomes more swollen than the other", "breathlessness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026)",
        "NHS.UK, \"Shortness of breath\" (swollen-ankle criterion, already cited for Breathing Difficulty, batch18), https://www.nhs.uk/conditions/shortness-of-breath/"
      ],
      contentNotice: "Combines the joint pain guidance already used for Arm/Leg/Ankle Pain with the swollen-ankle-plus-breathlessness criterion already cited for Breathing Difficulty. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Elbow Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-elbow-pain",
    titleEn: "Elbow Pain",
    clinicalDefinitionEn: "Non-traumatic elbow pain assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "elbow pain", weight: 100 },
      { phrase: "my elbow hurts", weight: 90 },
      { phrase: "elbow has been aching", weight: 90 },
      { phrase: "sore elbow no injury", weight: 85 },
      { phrase: "elbow has just been aching for a while", weight: 100 },
      { phrase: "elbow pain no injury or anything", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-elbowpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-elbowpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-elbowpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the elbow swollen and hot?" }
    ],
    questions: [
      {
        id: "oscg-elbowpain-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the elbow swollen and hot, or does the person feel generally unwell with a high temperature or feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["elbow swollen and hot", "unwell with elbow pain"],
        careAdviceIds: ["oscg-elbowpain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-elbowpain-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild elbow pain without the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild joint pain as manageable at home with rest, ice, and gentle movement.",
        redFlag: false,
        keywords: ["mild elbow pain"],
        careAdviceIds: ["oscg-elbowpain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-elbowpain-urgent-advice", titleEn: "Urgent elbow pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowpain-selfcare-advice", titleEn: "Home care for mild elbow pain", instructionTextEn: "Rest the elbow when possible, apply an ice pack wrapped in a towel for up to 20 minutes every 2-3 hours, keep gently moving rather than fully immobilizing it, and take a suitable over-the-counter pain reliever.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 weeks", "swelling, redness, or fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\" (non-injury pain guidance), https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic elbow pain"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used for Arm Pain and Leg Pain (batch15), applied to the elbow, distinct from the traumatic Elbow Injury protocol (batch13). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Elbow Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-elbow-swelling",
    titleEn: "Elbow Swelling",
    clinicalDefinitionEn: "Non-traumatic elbow swelling assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "elbow swelling", weight: 100 },
      { phrase: "elbow is swollen", weight: 95 },
      { phrase: "swollen elbow no injury", weight: 90 },
      { phrase: "puffy elbow", weight: 80 },
      { phrase: "elbow is swollen and puffy", weight: 100 },
      { phrase: "elbow is swollen and puffy didnt hurt it", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-elbowswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the swelling lasted?" },
      { id: "oscg-elbowswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the skin red, hot, or painful to touch?" },
      { id: "oscg-elbowswelling-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" }
    ],
    questions: [
      {
        id: "oscg-elbowswelling-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the elbow swollen and hot, or does the person feel generally unwell with a fever or feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call - a swollen, hot joint can indicate infection (septic bursitis/arthritis) needing prompt treatment.",
        redFlag: false,
        keywords: ["hot swollen elbow", "elbow swelling with fever"],
        careAdviceIds: ["oscg-elbowswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-elbowswelling-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild swelling without redness, heat, or fever?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild elbow swelling without infection signs is often manageable at home.",
        redFlag: false,
        keywords: ["mild elbow swelling no redness"],
        careAdviceIds: ["oscg-elbowswelling-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-elbowswelling-urgent-advice", titleEn: "Urgent elbow swelling review", instructionTextEn: "Arrange same-day medical review for possible joint infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "redness spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowswelling-selfcare-advice", titleEn: "Home care for mild elbow swelling", instructionTextEn: "Rest the elbow, apply a cold compress, and take an over-the-counter pain reliever if needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness, warmth, or fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to elbow swelling"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used elsewhere in this content set, applied to elbow swelling. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Finger Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-finger-pain",
    titleEn: "Finger Pain",
    clinicalDefinitionEn: "Non-traumatic finger pain assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "finger pain", weight: 100 },
      { phrase: "my finger hurts", weight: 90 },
      { phrase: "finger has been aching", weight: 90 },
      { phrase: "sore finger no injury", weight: 85 },
      { phrase: "finger has just been aching for a few days", weight: 100 },
      { phrase: "finger pain no injury or anything", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fingerpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Which finger, and where exactly?" },
      { id: "oscg-fingerpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-fingerpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the finger swollen and hot?" }
    ],
    questions: [
      {
        id: "oscg-fingerpain-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the finger swollen and hot, or does the person feel generally unwell with a high temperature?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["finger swollen and hot", "unwell with finger pain"],
        careAdviceIds: ["oscg-fingerpain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fingerpain-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild finger pain without the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild joint pain as manageable at home with rest and gentle movement.",
        redFlag: false,
        keywords: ["mild finger pain"],
        careAdviceIds: ["oscg-fingerpain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fingerpain-urgent-advice", titleEn: "Urgent finger pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingerpain-selfcare-advice", titleEn: "Home care for mild finger pain", instructionTextEn: "Rest the finger, apply a cold compress if swollen, keep gently moving rather than fully immobilizing it, and take a suitable over-the-counter pain reliever.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 weeks", "swelling, redness, or fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic finger pain"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used elsewhere in this content set, applied to the finger, distinct from the traumatic Finger Injury protocol (batch10). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Foot Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-foot-pain",
    titleEn: "Foot Pain",
    clinicalDefinitionEn: "Non-traumatic foot pain assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "foot pain", weight: 100 },
      { phrase: "my foot hurts", weight: 90 },
      { phrase: "foot has been aching", weight: 90 },
      { phrase: "sore foot no injury", weight: 85 },
      { phrase: "foot has just been aching for days", weight: 100 },
      { phrase: "foot pain no injury or anything", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-footpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-footpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-footpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the foot swollen and hot?" }
    ],
    questions: [
      {
        id: "oscg-footpain-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the foot swollen and hot, does the person have diabetes with a foot wound, or does the person feel generally unwell with a fever?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists swelling/heat and feeling unwell as reasons for urgent review; diabetic foot problems specifically need prompt assessment given the higher risk of complications.",
        redFlag: false,
        keywords: ["foot swollen and hot", "diabetic foot pain"],
        careAdviceIds: ["oscg-footpain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-footpain-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild foot pain without the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild joint/foot pain as manageable at home with rest, ice, and supportive footwear.",
        redFlag: false,
        keywords: ["mild foot pain"],
        careAdviceIds: ["oscg-footpain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-footpain-urgent-advice", titleEn: "Urgent foot pain review", instructionTextEn: "Arrange same-day medical review, especially given diabetes or signs of infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-footpain-selfcare-advice", titleEn: "Home care for mild foot pain", instructionTextEn: "Rest the foot, apply an ice pack wrapped in a towel, wear supportive well-fitting footwear, and take a suitable over-the-counter pain reliever.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 weeks", "swelling, redness, or fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic foot pain"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used elsewhere in this content set, applied to the foot. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Hand Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-hand-swelling",
    titleEn: "Hand Swelling",
    clinicalDefinitionEn: "Non-traumatic hand swelling assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "hand swelling", weight: 100 },
      { phrase: "hand is swollen", weight: 95 },
      { phrase: "swollen hand no injury", weight: 90 },
      { phrase: "puffy hand", weight: 80 },
      { phrase: "hand is swollen and puffy", weight: 100 },
      { phrase: "hand is swollen and puffy didnt hurt it", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-handswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the swelling lasted?" },
      { id: "oscg-handswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the skin red, hot, or painful to touch?" },
      { id: "oscg-handswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is one hand more swollen than the other?" }
    ],
    questions: [
      {
        id: "oscg-handswelling-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the hand swollen and hot, or does the person feel generally unwell with a fever?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["hot swollen hand", "hand swelling with fever"],
        careAdviceIds: ["oscg-handswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-handswelling-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild, even swelling without redness, heat, or fever?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild hand swelling without infection signs is often manageable at home.",
        redFlag: false,
        keywords: ["mild hand swelling"],
        careAdviceIds: ["oscg-handswelling-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-handswelling-urgent-advice", titleEn: "Urgent hand swelling review", instructionTextEn: "Arrange same-day medical review for possible infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "redness spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-handswelling-selfcare-advice", titleEn: "Home care for mild hand swelling", instructionTextEn: "Elevate the hand when resting, apply a cold compress, and take an over-the-counter pain reliever if needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness, warmth, or fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to hand swelling"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used elsewhere in this content set, applied to hand swelling. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Hip Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-hip-pain",
    titleEn: "Hip Pain",
    clinicalDefinitionEn: "Non-traumatic hip pain assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "hip pain", weight: 100 },
      { phrase: "my hip hurts", weight: 90 },
      { phrase: "hip has been aching", weight: 90 },
      { phrase: "sore hip no injury", weight: 85 },
      { phrase: "hip has just been aching for a while", weight: 100 },
      { phrase: "hip pain no injury or anything", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hippain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-hippain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-hippain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person able to bear weight normally?" }
    ],
    questions: [
      {
        id: "oscg-hippain-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the hip swollen and hot, does the person feel generally unwell with a fever, or has walking become difficult?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["hip swollen and hot", "hip pain limiting walking no injury"],
        careAdviceIds: ["oscg-hippain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hippain-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild hip pain without the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild joint pain as manageable at home with rest, ice, and gentle movement.",
        redFlag: false,
        keywords: ["mild hip pain"],
        careAdviceIds: ["oscg-hippain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hippain-urgent-advice", titleEn: "Urgent hip pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection or a more significant cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "difficulty walking worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hippain-selfcare-advice", titleEn: "Home care for mild hip pain", instructionTextEn: "Rest the hip when possible, apply an ice pack wrapped in a towel for up to 20 minutes every 2-3 hours, keep gently moving rather than fully immobilizing it, and take a suitable over-the-counter pain reliever.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 weeks", "swelling, redness, or fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic hip pain"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used elsewhere in this content set, applied to the hip, distinct from the traumatic Hip Injury protocol (batch13). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Knee Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-knee-swelling",
    titleEn: "Knee Swelling",
    clinicalDefinitionEn: "Non-traumatic knee swelling assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "knee swelling", weight: 100 },
      { phrase: "knee is swollen", weight: 95 },
      { phrase: "swollen knee no injury", weight: 90 },
      { phrase: "puffy knee", weight: 80 },
      { phrase: "knee is swollen and puffy", weight: 100 },
      { phrase: "knee is swollen and puffy didnt hurt it", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-kneeswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the swelling lasted?" },
      { id: "oscg-kneeswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the skin red, hot, or painful to touch?" },
      { id: "oscg-kneeswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person able to bear weight normally?" }
    ],
    questions: [
      {
        id: "oscg-kneeswelling-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the knee swollen and hot, does the person feel generally unwell with a fever, or is walking difficult?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call - a swollen, hot knee can indicate joint infection needing prompt treatment.",
        redFlag: false,
        keywords: ["hot swollen knee", "knee swelling with fever"],
        careAdviceIds: ["oscg-kneeswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-kneeswelling-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild swelling without redness, heat, or fever?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild knee swelling without infection signs is often manageable at home.",
        redFlag: false,
        keywords: ["mild knee swelling no redness"],
        careAdviceIds: ["oscg-kneeswelling-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-kneeswelling-urgent-advice", titleEn: "Urgent knee swelling review", instructionTextEn: "Arrange same-day medical review for possible joint infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "unable to bear weight"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-kneeswelling-selfcare-advice", titleEn: "Home care for mild knee swelling", instructionTextEn: "Rest the knee, apply a cold compress, elevate when resting, and take an over-the-counter pain reliever if needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness, warmth, or fever develops", "unable to bear weight"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to knee swelling"],
      contentNotice: "Decomposed from the same NHS.UK joint pain guidance already used elsewhere in this content set, applied to knee swelling, distinct from the Ottawa Knee Rule protocol (batch02, traumatic injury). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Arm Swelling and Edema
  // ------------------------------------------------------------------
  {
    id: "oscg-arm-swelling-and-edema",
    titleEn: "Arm Swelling and Edema",
    clinicalDefinitionEn: "Non-traumatic arm swelling assessment decomposed from NHS.UK's published joint pain guidance and standard DVT/lymphedema red-flag knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "arm swelling", weight: 100 },
      { phrase: "arm is swollen", weight: 95 },
      { phrase: "swollen arm no injury", weight: 90 },
      { phrase: "puffy arm", weight: 80 },
      { phrase: "arm is swollen and puffy", weight: 100 },
      { phrase: "arm is swollen and puffy didnt hurt it", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-armswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the swelling lasted?" },
      { id: "oscg-armswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is one arm more swollen than the other?" },
      { id: "oscg-armswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any shortness of breath or chest pain?" }
    ],
    questions: [
      {
        id: "oscg-armswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is one arm suddenly much more swollen than the other, along with shortness of breath or chest pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sudden one-sided arm swelling with breathing/chest symptoms can indicate a blood clot (e.g. from a central line or after prolonged immobility) that has traveled to the lungs, consistent with the DVT-risk concept already used in this system.",
        redFlag: true,
        keywords: ["one arm swollen with shortness of breath"],
        careAdviceIds: ["oscg-armswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-armswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the arm swollen and hot, is one arm noticeably more swollen than the other, or does the person feel generally unwell with a fever?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists swelling and heat with feeling unwell as reasons for urgent review.",
        redFlag: false,
        keywords: ["arm swollen and hot", "one arm more swollen than other"],
        careAdviceIds: ["oscg-armswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-armswelling-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, even swelling in both arms with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, symmetric arm swelling without infection or clot signs is often manageable at home.",
        redFlag: false,
        keywords: ["mild even arm swelling"],
        careAdviceIds: ["oscg-armswelling-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-armswelling-emergency-advice", titleEn: "Emergency arm swelling precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-armswelling-urgent-advice", titleEn: "Urgent arm swelling review", instructionTextEn: "Arrange same-day medical review to check for infection or a blood clot.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling worsens", "breathing difficulty develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-armswelling-selfcare-advice", titleEn: "Home care for mild arm swelling", instructionTextEn: "Elevate the arm when resting and stay gently active.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["one arm becomes more swollen than the other", "breathing difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026); DVT-risk concept already used for Leg Pain (batch15) and Postpartum - Leg Pain/Leg Swelling (batch20), generalized to the arm"],
      contentNotice: "Combines the joint pain guidance already used elsewhere in this content set with the DVT-risk red-flag pattern already established for leg swelling protocols, applied to the arm (e.g. relevant for callers with central venous catheters or after prolonged immobility). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
