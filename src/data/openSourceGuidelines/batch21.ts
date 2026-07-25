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
    clinicalDefinitionEn: "UAT-only adult and pediatric non-traumatic ankle-pain pathway screening for joint infection, systemic illness, inability to bear weight and neurovascular compromise before in-person assessment.",
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
      { id: "oscg-anklepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the ankle swollen and hot?" },
      { id: "oscg-anklepain-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there pregnancy/postpartum status, inability to bear weight, systemic illness, diabetes/immune risk, hidden injury, neurovascular change, or—in a child—refusal to use the limb or safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-anklepain-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is ankle pain severe with inability to bear weight, neurovascular change, or a hot swollen joint plus marked systemic illness, confusion, breathing change, collapse or rapid deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Severe functional loss, neurovascular compromise, or marked systemic deterioration requires emergency assessment through the Qatar pathway.",
        redFlag: true,
        keywords: ["ankle swollen and hot", "unwell with ankle pain"],
        careAdviceIds: ["oscg-anklepain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-anklepain-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained ankle pain, hot swelling, functional limitation, child joint concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This UAT pathway requires in-person assessment and does not authorize remote diagnosis, fixed medication advice or pediatric self-care.",
        redFlag: false,
        keywords: ["mild ankle pain"],
        careAdviceIds: ["oscg-anklepain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-anklepain-urgent-advice", titleEn: "Qatar emergency ankle-joint response", instructionTextEn: "Call Qatar emergency services on 999 for a hot swollen joint with systemic illness, severe pain, inability to bear weight, deformity, a cold/pale/blue/numb foot, or rapid deterioration. Do not allow self-driving or force movement.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["increasing swelling or redness", "fever or systemic illness", "cannot bear weight"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-anklepain-selfcare-advice", titleEn: "In-person ankle assessment", instructionTextEn: "Arrange in-person assessment through an approved Qatar adult or pediatric pathway. Protect the joint and use wrapped cold briefly if comfortable. Do not provide fixed-dose analgesia until age, weight, pregnancy, allergies, kidney/liver disease and interactions are checked under an approved pathway.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain or swelling worsens", "redness, fever or inability to bear weight"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\" (non-injury pain guidance), https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic ankle pain"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric ankle-pain draft. Systemic illness with hot swelling, inability to bear weight or neurovascular compromise routes to 999; all other unexplained pain requires in-person assessment. GOVERNANCE_REQUIRED for Qatar adult/pediatric musculoskeletal, infection, imaging, pregnancy, safeguarding, analgesia and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 2. Ankle Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-ankle-swelling",
    titleEn: "Ankle Swelling",
    clinicalDefinitionEn: "UAT-only adult and pediatric ankle-swelling pathway screening for pulmonary embolism, thrombosis, infection, pregnancy complications and systemic oedema before in-person assessment.",
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
      { id: "oscg-ankleswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any shortness of breath or chest pain?" },
      { id: "oscg-ankleswelling-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there pregnancy/recent birth, clot history, cancer, surgery/immobility/travel, heart/kidney/liver disease, medicines, fever, injury, or child safeguarding concern?" }
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
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is ankle swelling persistent, unexplained, unilateral, painful/hot, associated with breathlessness, pregnancy/postpartum status, systemic disease or childhood?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Telephone assessment cannot safely determine benign oedema or exclude vascular, cardiac, renal, hepatic, pregnancy-related or inflammatory causes.",
        redFlag: false,
        keywords: ["mild even ankle swelling"],
        careAdviceIds: ["oscg-ankleswelling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ankleswelling-emergency-advice", titleEn: "Qatar emergency swelling response", instructionTextEn: "Call Qatar emergency services on 999 for breathlessness, chest pain/tightness, coughing blood, faintness/confusion/clamminess or severe rapid swelling. Do not allow self-driving or massage the swollen limb.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ankleswelling-urgent-advice", titleEn: "Same-day ankle-swelling assessment", instructionTextEn: "Arrange same-day in-person assessment for unilateral, sudden, painful, red/hot or unexplained swelling, fever, diabetes, pregnancy/postpartum status, or kidney/heart/liver disease. Exact Qatar vascular, maternity and medical destinations are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathlessness", "swelling spreads", "pain or fever"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-ankleswelling-selfcare-advice", titleEn: "Unexplained swelling needs clinical review", instructionTextEn: "Arrange in-person review before assuming benign oedema or changing salt, fluid, diuretic or other medicine. Elevate gently if comfortable; do not massage unilateral swelling.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["one ankle becomes more swollen", "breathlessness develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026)",
        "NHS.UK, \"Shortness of breath\" (swollen-ankle criterion, already cited for Breathing Difficulty, batch18), https://www.nhs.uk/conditions/shortness-of-breath/"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric ankle-swelling draft. Pulmonary-embolism symptoms route to 999; unilateral, severe, painful, hot, pregnancy/postpartum or systemic swelling requires in-person assessment. GOVERNANCE_REQUIRED for Qatar vascular, medical, pediatric, maternity, medicine and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 3. Elbow Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-elbow-pain",
    titleEn: "Elbow Pain",
    clinicalDefinitionEn: "UAT-only adult and pediatric non-traumatic elbow-pain pathway screening for joint infection, systemic illness and neurovascular compromise before in-person assessment.",
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
      { id: "oscg-elbowpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the elbow swollen and hot?" },
      { id: "oscg-elbowpain-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there pregnancy/postpartum status, systemic illness, immune risk, recent infection/procedure, hidden trauma, neurovascular change, or child safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-elbowpain-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is elbow pain severe with neurovascular change, or is there a hot swollen joint plus marked systemic illness, confusion, breathing change, collapse or rapid deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Neurovascular compromise or a hot joint with marked systemic deterioration requires emergency assessment through the Qatar pathway.",
        redFlag: true,
        keywords: ["elbow swollen and hot", "unwell with elbow pain"],
        careAdviceIds: ["oscg-elbowpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-elbowpain-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained elbow pain, hot swelling, functional limitation, child joint concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This UAT pathway requires in-person assessment and does not authorize remote diagnosis or fixed medication advice.",
        redFlag: false,
        keywords: ["mild elbow pain"],
        careAdviceIds: ["oscg-elbowpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-elbowpain-urgent-advice", titleEn: "Qatar emergency elbow-joint response", instructionTextEn: "Call Qatar emergency services on 999 for a hot swollen joint with systemic illness, severe pain, neurovascular change, or rapid deterioration. Do not allow self-driving or force movement.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["increasing swelling or redness", "fever or systemic illness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowpain-selfcare-advice", titleEn: "In-person elbow assessment", instructionTextEn: "Arrange in-person assessment through an approved Qatar adult or pediatric pathway. Use wrapped cold briefly if comfortable; avoid fixed-dose medication advice until patient factors are checked.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "swelling, redness or fever"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\" (non-injury pain guidance), https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic elbow pain"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric elbow-pain draft. Hot swelling with systemic illness or neurovascular compromise routes to 999; otherwise in-person assessment is required. GOVERNANCE_REQUIRED for Qatar infection, trauma, pediatric, pregnancy, safeguarding, analgesia and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 4. Elbow Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-elbow-swelling",
    titleEn: "Elbow Swelling",
    clinicalDefinitionEn: "UAT-only adult and pediatric elbow-swelling pathway screening for septic joint or bursa, systemic illness, vascular compromise and occult trauma before in-person assessment.",
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
      { id: "oscg-elbowswelling-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-elbowswelling-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there systemic illness, immune risk, skin wound/bite, recent infection/procedure, pregnancy/postpartum status, hidden trauma or child safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-elbowswelling-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is elbow swelling severe with neurovascular change, or is it hot/painful with marked systemic illness, confusion, breathing change, collapse or rapid deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK joint pain guidance identifies these as reasons for urgent clinical review - a swollen, hot joint can indicate infection (septic bursitis/arthritis) needing prompt treatment; the local Qatar urgent-care pathway is used here.",
        redFlag: true,
        keywords: ["hot swollen elbow", "elbow swelling with fever"],
        careAdviceIds: ["oscg-elbowswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-elbowswelling-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained elbow swelling, redness/heat, movement restriction, child concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "In-person examination is required to distinguish septic joint/bursa, inflammatory disease, occult trauma and other causes.",
        redFlag: false,
        keywords: ["mild elbow swelling no redness"],
        careAdviceIds: ["oscg-elbowswelling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-elbowswelling-urgent-advice", titleEn: "Qatar emergency hot-joint response", instructionTextEn: "Call Qatar emergency services on 999 for an ambulance for hot swollen elbow with systemic illness, severe pain, neurovascular change or rapid deterioration; do not self-drive. Do not squeeze, drain or force movement.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever worsens", "redness spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowswelling-selfcare-advice", titleEn: "In-person elbow-swelling assessment", instructionTextEn: "Arrange in-person assessment; telephone review cannot exclude septic arthritis/bursitis, inflammatory disease or occult trauma. Medication and exact Qatar destination are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["redness, warmth or fever", "movement worsens"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to elbow swelling"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric elbow-swelling draft. Possible septic joint/bursa or systemic deterioration routes to 999; otherwise in-person assessment is required. GOVERNANCE_REQUIRED for Qatar infection, orthopaedic, pediatric, pregnancy, medication and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 5. Finger Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-finger-pain",
    titleEn: "Finger Pain",
    clinicalDefinitionEn: "UAT-only adult and pediatric non-traumatic finger-pain pathway screening for infection, constriction and neurovascular compromise before in-person assessment.",
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
      { id: "oscg-fingerpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the finger swollen and hot?" },
      { id: "oscg-fingerpain-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; are rings constricting, is there systemic illness, wound/bite/nail infection, immune risk, hidden trauma, neurovascular change, pregnancy or child safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-fingerpain-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is finger pain severe with a cold/pale/blue/numb digit or constricting ring, or is there rapidly spreading redness/swelling plus marked systemic illness or deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Threatened digit circulation, a constricting ring, or spreading infection with marked systemic deterioration requires emergency assessment.",
        redFlag: true,
        keywords: ["finger swollen and hot", "unwell with finger pain"],
        careAdviceIds: ["oscg-fingerpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fingerpain-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained finger pain, swelling, wound/bite, movement limitation, child concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "In-person assessment is required to exclude infection, tendon-sheath disease, occult trauma, constriction and neurovascular problems.",
        redFlag: false,
        keywords: ["mild finger pain"],
        careAdviceIds: ["oscg-fingerpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fingerpain-urgent-advice", titleEn: "Qatar emergency finger/hand response", instructionTextEn: "Call Qatar emergency services on 999 for an ambulance for rapidly spreading infection with systemic illness, severe pain, a cold/pale/blue/numb finger, or rapid deterioration; do not self-drive. Remove rings if easy before swelling worsens; do not force them off.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["increasing swelling or redness", "fever or colour/sensation change"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingerpain-selfcare-advice", titleEn: "In-person finger assessment", instructionTextEn: "Arrange in-person assessment for unexplained pain. Protect the finger and use wrapped cold briefly if comfortable; do not squeeze, puncture or use unapproved medication.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain, swelling or redness worsens", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic finger pain"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric finger-pain draft. Systemic infection, constriction or neurovascular compromise routes to 999; otherwise in-person assessment is required. GOVERNANCE_REQUIRED for Qatar hand, infection, pediatric, safeguarding, medication and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 6. Foot Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-foot-pain",
    titleEn: "Foot Pain",
    clinicalDefinitionEn: "UAT-only adult and pediatric non-traumatic foot-pain pathway screening for infection, inability to bear weight, neurovascular compromise and diabetic or immune risk before in-person assessment.",
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
      { id: "oscg-footpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin around the foot swollen and hot?" },
      { id: "oscg-footpain-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there diabetes/neuropathy, immune/vascular disease, wound/foreign body, inability to bear weight, pregnancy/postpartum status, hidden trauma, neurovascular change or child safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-footpain-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is foot pain severe with inability to bear weight or a cold/pale/blue/numb foot, or is there a diabetic/other wound or hot swelling plus marked systemic illness or rapid deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK joint pain guidance lists swelling/heat and feeling unwell as reasons for urgent review; diabetic foot problems specifically need prompt assessment given the higher risk of complications.",
        redFlag: true,
        keywords: ["foot swollen and hot", "diabetic foot pain"],
        careAdviceIds: ["oscg-footpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-footpain-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained foot pain, wound, swelling, walking limitation, diabetes/immune risk, child concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "In-person assessment is required, particularly for diabetes/neuropathy, wounds, immune risk, children and impaired weight bearing.",
        redFlag: false,
        keywords: ["mild foot pain"],
        careAdviceIds: ["oscg-footpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-footpain-urgent-advice", titleEn: "Qatar emergency foot response", instructionTextEn: "Call Qatar emergency services on 999 for systemic illness with hot swelling, inability to bear weight, severe rapidly worsening pain, or a cold/pale/blue/numb foot. Do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["increasing swelling or redness", "fever or neurovascular change"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-footpain-selfcare-advice", titleEn: "In-person foot assessment", instructionTextEn: "Arrange in-person assessment, especially for a child, pregnancy, diabetes, neuropathy, immune compromise or skin break. Protect from pressure and do not use fixed-dose analgesia until patient factors are checked.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain persists or worsens", "swelling, redness or fever"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic foot pain"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric foot-pain draft. Systemic infection, inability to bear weight or neurovascular compromise routes to 999; diabetes and immune risk require in-person assessment. GOVERNANCE_REQUIRED for Qatar foot, diabetic-foot, pediatric, pregnancy, medication and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 7. Hand Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-hand-swelling",
    titleEn: "Hand Swelling",
    clinicalDefinitionEn: "UAT-only adult and pediatric hand-swelling pathway screening for infection, allergy, vascular obstruction, constriction and occult trauma before in-person assessment.",
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
      { id: "oscg-handswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is one hand more swollen than the other?" },
      { id: "oscg-handswelling-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; are rings constricting, is there fever, allergy, wound/bite, line/procedure, pregnancy/postpartum status, neurovascular change, hidden injury or child safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-handswelling-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is hand swelling severe with a cold/pale/blue/numb hand or constricting ring, or is there rapidly spreading redness/swelling plus marked systemic illness or deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Inability to stand or bear weight, or marked systemic deterioration including in a child, requires emergency assessment through the Qatar pathway.",
        redFlag: true,
        keywords: ["hot swollen hand", "hand swelling with fever"],
        careAdviceIds: ["oscg-handswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-handswelling-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained hand swelling, asymmetry, redness/heat, wound, child concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "In-person assessment is required to exclude infection, allergy, vascular/lymphatic obstruction, inflammatory disease and occult trauma.",
        redFlag: false,
        keywords: ["mild hand swelling"],
        careAdviceIds: ["oscg-handswelling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-handswelling-urgent-advice", titleEn: "Qatar emergency hand-swelling response", instructionTextEn: "Call Qatar emergency services on 999 for an ambulance for rapidly spreading swelling/infection with systemic illness, severe pain, or a cold/pale/blue/numb hand; do not self-drive. Remove rings if easy; do not squeeze or drain.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever worsens", "redness spreads", "colour or sensation changes"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-handswelling-selfcare-advice", titleEn: "In-person hand-swelling assessment", instructionTextEn: "Arrange in-person assessment; unexplained swelling may reflect infection, inflammatory disease, allergy, vascular obstruction or occult injury. Medication and exact Qatar destination are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["redness, warmth or fever", "swelling progresses"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to hand swelling"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric hand-swelling draft. Systemic infection or neurovascular compromise routes to 999; unexplained swelling requires in-person assessment. GOVERNANCE_REQUIRED for Qatar infection, allergy, vascular, pediatric, safeguarding, medication and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 8. Hip Pain
  // ------------------------------------------------------------------
  {
    id: "oscg-hip-pain",
    titleEn: "Hip Pain",
    clinicalDefinitionEn: "UAT-only adult and pediatric non-traumatic hip-pain pathway screening for septic arthritis, systemic illness and inability to stand or bear weight before in-person assessment.",
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
      { id: "oscg-hippain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person able to bear weight normally?" },
      { id: "oscg-hippain-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there systemic illness, pregnancy/recent birth, recent infection/procedure, night pain, immune risk, hidden trauma, or—in a child—refusal to walk/use the limb or safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-hippain-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is hip pain severe with inability to stand or bear weight, or accompanied by marked systemic illness, confusion, breathing change, collapse or rapid deterioration, including a seriously unwell child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK joint pain guidance identifies these as reasons for urgent clinical review; the local Qatar urgent-care pathway is used here.",
        redFlag: true,
        keywords: ["hip swollen and hot", "hip pain limiting walking no injury"],
        careAdviceIds: ["oscg-hippain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hippain-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained hip pain, limp/functional limitation, pregnancy/postpartum state, night pain, child concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "In-person assessment is required; every child joint problem needs clinical review and telephone triage cannot exclude serious hip pathology.",
        redFlag: false,
        keywords: ["mild hip pain"],
        careAdviceIds: ["oscg-hippain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hippain-urgent-advice", titleEn: "Qatar emergency hip response", instructionTextEn: "Call Qatar emergency services on 999 for a hot painful joint with systemic illness, inability to stand or bear weight, severe rapidly worsening pain, or a seriously unwell child. Do not allow self-driving or force walking.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever/systemic illness", "cannot walk or bear weight"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hippain-selfcare-advice", titleEn: "In-person hip assessment", instructionTextEn: "Arrange in-person assessment. Any child hip/joint problem, pregnancy/postpartum pain, night pain, functional loss or unexplained persistent pain requires an age-appropriate pathway. Medication and exact Qatar destination are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "walking difficulty", "swelling, redness or fever"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic hip pain"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric hip-pain draft. Systemic illness with joint pain, inability to stand/bear weight or a seriously unwell child routes to 999; otherwise in-person assessment is required. GOVERNANCE_REQUIRED for Qatar septic-joint, pediatric, pregnancy/postpartum, safeguarding, imaging, medication and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 9. Knee Swelling
  // ------------------------------------------------------------------
  {
    id: "oscg-knee-swelling",
    titleEn: "Knee Swelling",
    clinicalDefinitionEn: "UAT-only adult and pediatric non-traumatic knee-swelling pathway screening for septic arthritis, systemic illness, vascular compromise and inability to bear weight before in-person assessment.",
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
      { id: "oscg-kneeswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person able to bear weight normally?" },
      { id: "oscg-kneeswelling-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there systemic illness, recent infection/procedure, immune risk, pregnancy/postpartum status, calf swelling, hidden trauma or child safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-kneeswelling-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is knee swelling severely painful with inability to bear weight or neurovascular change, or is it hot with marked systemic illness, confusion, breathing change, collapse or rapid deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK joint pain guidance identifies these as reasons for urgent clinical review - a swollen, hot knee can indicate joint infection needing prompt treatment; the local Qatar urgent-care pathway is used here.",
        redFlag: true,
        keywords: ["hot swollen knee", "knee swelling with fever"],
        careAdviceIds: ["oscg-kneeswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-kneeswelling-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent or unexplained knee swelling, redness/heat, walking limitation, calf symptoms, child concern or higher-risk context?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "In-person examination is required to distinguish infection, inflammatory/crystal disease, vascular causes and occult trauma.",
        redFlag: false,
        keywords: ["mild knee swelling no redness"],
        careAdviceIds: ["oscg-kneeswelling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-kneeswelling-urgent-advice", titleEn: "Qatar emergency knee-joint response", instructionTextEn: "Call Qatar emergency services on 999 for an ambulance for hot swollen knee with systemic illness, severe pain, inability to bear weight, neurovascular change or rapid deterioration; do not self-drive. Do not force walking.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever worsens", "unable to bear weight"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-kneeswelling-selfcare-advice", titleEn: "In-person knee-swelling assessment", instructionTextEn: "Arrange in-person assessment; telephone review cannot exclude joint infection, inflammatory disease, crystal arthritis, vascular causes or occult trauma. Medication and exact Qatar destination are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["redness, warmth or fever", "unable to bear weight"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to knee swelling"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric knee-swelling draft. Possible septic joint, inability to bear weight or neurovascular compromise routes to 999; otherwise in-person assessment is required. GOVERNANCE_REQUIRED for Qatar infection, orthopaedic, pediatric, pregnancy, imaging, medication and transport pathways. Not production-approved."
    })
  },

  // ------------------------------------------------------------------
  // 10. Arm Swelling and Edema
  // ------------------------------------------------------------------
  {
    id: "oscg-arm-swelling-and-edema",
    titleEn: "Arm Swelling and Edema",
    clinicalDefinitionEn: "UAT-only adult and pediatric non-traumatic arm-swelling pathway screening for upper-extremity thrombosis or pulmonary embolism, infection, vascular compromise and systemic oedema before in-person assessment.",
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
      { id: "oscg-armswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any shortness of breath or chest pain?" },
      { id: "oscg-armswelling-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the age; is there a central line, cancer, clot history, surgery/immobility, pregnancy/recent birth, fever, allergy, systemic disease, medicines, injury or child safeguarding concern?" }
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
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is arm swelling persistent, unexplained, unilateral, painful/hot, associated with a central line/clot risk, pregnancy/postpartum status, systemic disease or childhood?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Telephone assessment cannot safely determine benign oedema or exclude upper-extremity thrombosis, infection, systemic disease or vascular/lymphatic obstruction.",
        redFlag: false,
        keywords: ["mild even arm swelling"],
        careAdviceIds: ["oscg-armswelling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-armswelling-emergency-advice", titleEn: "Qatar emergency arm-swelling response", instructionTextEn: "Call Qatar emergency services on 999 for arm swelling with breathlessness, chest pain, coughing blood, faintness, confusion or clamminess. Do not allow self-driving or massage the arm.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-armswelling-urgent-advice", titleEn: "Same-day arm-swelling assessment", instructionTextEn: "Arrange same-day in-person assessment for unilateral, sudden, painful, red/hot or unexplained swelling, fever, central line, cancer, pregnancy/postpartum state, recent surgery/immobility or previous clot. Exact Qatar vascular, maternity and medical destinations are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling worsens", "breathing difficulty develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-armswelling-selfcare-advice", titleEn: "Unexplained arm swelling needs review", instructionTextEn: "Arrange in-person assessment before assuming benign oedema. Elevate gently if comfortable; do not massage unilateral swelling or change diuretics/other medicines without clinician direction.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["one arm becomes more swollen", "breathing difficulty develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\", https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026); DVT-risk concept already used for Leg Pain (batch15) and Postpartum - Leg Pain/Leg Swelling (batch20), generalized to the arm"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric arm-swelling draft. Pulmonary-embolism symptoms route to 999; unilateral swelling, central-line, cancer, pregnancy/postpartum, infection and thrombosis risks require same-day in-person assessment. This source-only family needs dedicated Qatar evidence review before generation. GOVERNANCE_REQUIRED for Qatar vascular, line, oncology, pediatric, maternity, medication and transport pathways. Not production-approved."
    })
  }
];
