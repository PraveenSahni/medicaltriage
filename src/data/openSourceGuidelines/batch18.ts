import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 18 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Dizziness - Lightheadedness and Dizziness - Vertigo both draw on
 * the same NHS.UK dizziness page, split by presentation, with numbness/
 * weakness/speech-difficulty treated as an emergency stroke (FAST) red flag
 * - consistent with the Neurologic Deficit protocol already in this system
 * (batch10) - rather than the source page's own "non-urgent" framing, which
 * groups it alongside milder associated symptoms. Jaundice uses NHS.UK's
 * newborn jaundice guidance, the most common jaundice presentation in
 * after-hours pediatric triage.
 */
export const batch18Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Asthma Attack - https://www.nhs.uk/conditions/asthma/asthma-attack/ (reviewed 2025-04-07)
  // ------------------------------------------------------------------
  {
    id: "oscg-asthma-attack",
    titleEn: "Asthma Attack",
    clinicalDefinitionEn: "Asthma attack assessment decomposed from NHS.UK's published asthma attack guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "asthma attack", weight: 100 },
      { phrase: "cant breathe wheezing", weight: 95 },
      { phrase: "asthma flare up", weight: 95 },
      { phrase: "inhaler isnt helping", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-asthmaattack-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Does the person have a reliever inhaler with them?" },
      { id: "oscg-asthmaattack-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the attack lasted?" },
      { id: "oscg-asthmaattack-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How many puffs of the inhaler have been taken so far?" }
    ],
    questions: [
      {
        id: "oscg-asthmaattack-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person feeling worse despite the inhaler, not improving after the maximum reliever dose, or without an inhaler available at all?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK asthma attack guidance lists these as call-999 criteria.",
        redFlag: true,
        keywords: ["asthma not improving with inhaler", "no inhaler asthma attack", "feeling worse during asthma attack"],
        careAdviceIds: ["oscg-asthmaattack-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-asthmaattack-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a mild flare-up that improves with the reliever inhaler, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes a mild flare-up responding to the reliever inhaler as manageable, with a follow-up GP review recommended afterward.",
        redFlag: false,
        keywords: ["mild asthma flare up improving"],
        careAdviceIds: ["oscg-asthmaattack-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-asthmaattack-emergency-advice", titleEn: "Emergency asthma attack precautions", instructionTextEn: "Keep taking the reliever inhaler as directed while waiting for the ambulance. Sit upright and try to stay calm. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing", "blue or grey lips"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-asthmaattack-selfcare-advice", titleEn: "Home management of a mild asthma flare", instructionTextEn: "Sit upright and stay calm. For a blue reliever inhaler, take 1 puff every 30-60 seconds up to a maximum of 10 puffs (use a spacer if available, shaking between puffs). For an AIR/MART-type inhaler, take 1 puff every 1-3 minutes up to a maximum of 6 puffs. Arrange an urgent GP appointment within 2 days after any attack to review treatment.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with inhaler", "symptoms return or worsen"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-04-07", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Asthma attack\", https://www.nhs.uk/conditions/asthma/asthma-attack/ (page last reviewed 07 April 2025)"],
      contentNotice: "Decomposed from NHS.UK's published asthma attack guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Breathing Difficulty - https://www.nhs.uk/conditions/shortness-of-breath/ (reviewed 2024-01-30)
  // ------------------------------------------------------------------
  {
    id: "oscg-breathing-difficulty",
    titleEn: "Breathing Difficulty",
    clinicalDefinitionEn: "Shortness of breath / breathing difficulty assessment decomposed from NHS.UK's published shortness of breath guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "breathing difficulty", weight: 100 },
      { phrase: "cant catch my breath", weight: 100 },
      { phrase: "gasping for air", weight: 95 },
      { phrase: "short of breath", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-breathingdifficulty-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the breathing difficulty lasted?" },
      { id: "oscg-breathingdifficulty-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any chest pain or bluish lips/skin?" },
      { id: "oscg-breathingdifficulty-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any known lung or heart condition?" }
    ],
    questions: [
      {
        id: "oscg-breathingdifficulty-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe difficulty breathing (gasping, choking, unable to get words out), a tight or heavy chest, pain spreading to the arms/back/neck/jaw, blue/grey/pale skin or lips, or sudden confusion?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK shortness of breath guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["gasping for air cant talk", "blue lips breathing difficulty", "chest tight cant breathe"],
        careAdviceIds: ["oscg-breathingdifficulty-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-breathingdifficulty-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the breathlessness worse than usual, is there nausea or vomiting, coughing up blood, leg pain or swelling, or heart palpitations?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends contacting NHS 111 for these accompanying symptoms.",
        redFlag: false,
        keywords: ["worse breathlessness than usual", "breathing difficulty with leg swelling"],
        careAdviceIds: ["oscg-breathingdifficulty-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-breathingdifficulty-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is breathlessness worse with activity or lying down, with swollen ankles, or has a cough lasted 3+ weeks?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for these patterns, and states shortness of breath should never be self-diagnosed.",
        redFlag: false,
        keywords: ["breathless lying down", "breathless with swollen ankles"],
        careAdviceIds: ["oscg-breathingdifficulty-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-breathingdifficulty-emergency-advice", titleEn: "Emergency breathing difficulty precautions", instructionTextEn: "Help the person sit upright and stay calm, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathingdifficulty-urgent-advice", titleEn: "Urgent breathing difficulty review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing worsens", "chest pain develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathingdifficulty-routine-advice", titleEn: "Routine breathlessness follow-up", instructionTextEn: "Book a GP appointment to investigate the cause - shortness of breath should never be self-diagnosed.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Shortness of breath\", https://www.nhs.uk/conditions/shortness-of-breath/ (page last reviewed 30 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published shortness of breath guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Common Cold - https://www.nhs.uk/conditions/common-cold/ (reviewed 2024-03-22)
  // ------------------------------------------------------------------
  {
    id: "oscg-common-cold",
    titleEn: "Common Cold",
    clinicalDefinitionEn: "Common cold assessment decomposed from NHS.UK's published common cold guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "common cold", weight: 100 },
      { phrase: "stuffy nose and sore throat", weight: 90 },
      { phrase: "think i have a cold", weight: 95 },
      { phrase: "runny nose and sneezing", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-commoncold-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-commoncold-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-commoncold-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any existing chronic condition or weakened immune system?" }
    ],
    questions: [
      {
        id: "oscg-commoncold-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there a high temperature lasting more than 3 days, worsening symptoms, shortness of breath or chest pain, symptoms lasting more than 10 days, a cough lasting more than 3 weeks, or an existing chronic condition or weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK common cold guidance lists these as reasons to see a GP.",
        redFlag: false,
        keywords: ["cold symptoms lasting over 10 days", "chest pain with a cold"],
        careAdviceIds: ["oscg-commoncold-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-commoncold-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Are these typical cold symptoms with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes the common cold as self-limiting, usually improving within 1-2 weeks.",
        redFlag: false,
        keywords: ["typical cold symptoms"],
        careAdviceIds: ["oscg-commoncold-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-commoncold-urgent-advice", titleEn: "Urgent cold-with-complications review", instructionTextEn: "Arrange a GP appointment for these concerning symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty develops", "symptoms significantly worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-commoncold-selfcare-advice", titleEn: "Home care for a common cold", instructionTextEn: "Rest, drink plenty of fluids, eat well, and try steam inhalation from a hot shower for congestion. Adults can gargle salt water or try hot lemon and honey for a sore throat. A pharmacist can recommend paracetamol, ibuprofen, or a decongestant (not for children under 6). Most colds improve within 1-2 weeks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["fever lasts more than 3 days", "symptoms worsen or last more than 10 days"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-03-22", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Common cold\", https://www.nhs.uk/conditions/common-cold/ (page last reviewed 22 March 2024)"],
      contentNotice: "Decomposed from NHS.UK's published common cold guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Fever - https://www.nhs.uk/conditions/fever-in-adults/ (reviewed 2023-05-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-fever",
    titleEn: "Fever",
    clinicalDefinitionEn: "Fever (high temperature) assessment decomposed from NHS.UK's published fever in adults guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "high temperature", weight: 100 },
      { phrase: "have a fever", weight: 100 },
      { phrase: "running a temperature", weight: 90 },
      { phrase: "feel hot and feverish", weight: 90 },
      { phrase: "had a fever for a couple days", weight: 100 },
      { phrase: "fever but not helping", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fever-iaq1", sequence: 1, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-fever-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the fever lasted?" },
      { id: "oscg-fever-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Have any home treatments been tried, and did they help?" }
    ],
    questions: [
      {
        id: "oscg-fever-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has the fever been treated at home but is not getting better, or is it getting worse?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK fever guidance recommends urgent GP or NHS 111 contact when home treatment isn't working.",
        redFlag: false,
        keywords: ["fever not improving with home treatment", "fever getting worse"],
        careAdviceIds: ["oscg-fever-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fever-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a fever (38C or above) that is new or improving with home treatment, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes rest, fluids, and paracetamol/ibuprofen as appropriate first-line self-care for fever.",
        redFlag: false,
        keywords: ["new fever responding to home treatment"],
        careAdviceIds: ["oscg-fever-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fever-urgent-advice", titleEn: "Urgent fever review", instructionTextEn: "Arrange a prompt GP appointment or NHS 111-equivalent review since home treatment hasn't helped.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "new symptoms develop"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fever-selfcare-advice", titleEn: "Home care for a fever", instructionTextEn: "Get plenty of rest and drink lots of fluids (water is best) to avoid dehydration. Take paracetamol or ibuprofen if the fever is causing discomfort. Stay home and limit contact with others until the temperature returns to normal.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["fever does not improve or worsens with home treatment"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Fever in adults\", https://www.nhs.uk/conditions/fever-in-adults/ (page last reviewed 24 May 2023)"],
      contentNotice: "Decomposed from NHS.UK's published fever in adults guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format as a general fever entry point. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Dizziness - Lightheadedness - https://www.nhs.uk/conditions/dizziness/ (reviewed 2023-04-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-dizziness-lightheadedness",
    titleEn: "Dizziness - Lightheadedness",
    clinicalDefinitionEn: "Lightheadedness assessment decomposed from NHS.UK's published dizziness guidance, with numbness/weakness/speech difficulty treated as an emergency stroke red flag consistent with the Neurologic Deficit protocol (batch10).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "feeling lightheaded", weight: 100 },
      { phrase: "feel faint and woozy", weight: 90 },
      { phrase: "lightheaded when i stand up", weight: 95 },
      { phrase: "feel like i might pass out", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-lightheadedness-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has this been happening?" },
      { id: "oscg-lightheadedness-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any numbness, weakness, or trouble speaking?" },
      { id: "oscg-lightheadedness-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does it happen when standing up quickly?" }
    ],
    questions: [
      {
        id: "oscg-lightheadedness-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the lightheadedness, is there numbness or weakness in the face, arm, or leg, sudden trouble speaking, or a fall with loss of consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Numbness, weakness, or speech difficulty are FAST stroke warning signs and require immediate emergency care, consistent with the Neurologic Deficit protocol already in this system.",
        redFlag: true,
        keywords: ["numbness one side with dizziness", "trouble speaking with dizziness"],
        careAdviceIds: ["oscg-lightheadedness-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-lightheadedness-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is dizziness persistent or recurring, with hearing or speech changes, tinnitus, vision changes, fainting, headache, or nausea?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK dizziness guidance recommends GP review for persistent/recurring dizziness with these associated symptoms.",
        redFlag: false,
        keywords: ["dizziness that keeps coming back", "dizziness with fainting"],
        careAdviceIds: ["oscg-lightheadedness-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-lightheadedness-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a brief, one-off episode of lightheadedness (such as standing up quickly) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes brief lightheadedness as usually resolving on its own with simple precautions.",
        redFlag: false,
        keywords: ["brief lightheaded episode"],
        careAdviceIds: ["oscg-lightheadedness-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lightheadedness-emergency-advice", titleEn: "Emergency stroke-pattern precautions", instructionTextEn: "Note the time symptoms started and arrange emergency transport immediately - fast treatment matters for a possible stroke.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms worsen", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lightheadedness-urgent-advice", titleEn: "Urgent dizziness review", instructionTextEn: "Arrange a GP appointment to investigate the recurring dizziness and associated symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["dizziness worsens or occurs more often", "hearing or vision changes develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-lightheadedness-selfcare-advice", titleEn: "Home care for brief lightheadedness", instructionTextEn: "Lie down until it passes, then get up slowly. Move gradually, rest, and drink plenty of water. Avoid caffeine, cigarettes, alcohol, and drugs, and avoid driving, ladders, or machinery while feeling dizzy.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["dizziness persists or recurs", "numbness, weakness, or speech difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Dizziness\", https://www.nhs.uk/conditions/dizziness/ (page last reviewed 21 April 2023)"],
      contentNotice: "Decomposed from NHS.UK's published dizziness guidance (Crown copyright, reused under the Open Government Licence). The emergency stroke-pattern tier reclassifies the source's own numbness/weakness/speech-difficulty mention (grouped under its general GP-advice section) as an emergency, consistent with standard FAST stroke-recognition practice and the existing Neurologic Deficit protocol in this system - a deliberate, documented safety-conservative deviation from the source's own tiering. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Dizziness - Vertigo - https://www.nhs.uk/conditions/dizziness/ (reviewed 2023-04-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-dizziness-vertigo",
    titleEn: "Dizziness - Vertigo",
    clinicalDefinitionEn: "Vertigo (spinning sensation) assessment decomposed from NHS.UK's published dizziness guidance, with the same emergency stroke red-flag reclassification as Dizziness - Lightheadedness.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "room is spinning", weight: 100 },
      { phrase: "vertigo", weight: 100 },
      { phrase: "everything is spinning", weight: 95 },
      { phrase: "spinning sensation", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-vertigo-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the spinning sensation lasted?" },
      { id: "oscg-vertigo-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any hearing loss, ringing in the ears, or trouble speaking?" },
      { id: "oscg-vertigo-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does it change with head position?" }
    ],
    questions: [
      {
        id: "oscg-vertigo-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the spinning sensation, is there numbness or weakness in the face, arm, or leg, sudden trouble speaking, double vision, or a severe headache unlike any before?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are recognized red flags for a central (brainstem/cerebellar stroke) cause of vertigo rather than a benign inner-ear cause, and need immediate emergency care.",
        redFlag: true,
        keywords: ["vertigo with numbness or weakness", "vertigo with double vision", "worst headache ever with vertigo"],
        careAdviceIds: ["oscg-vertigo-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-vertigo-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the vertigo persistent or recurring, with new hearing loss, ringing in the ears, or vomiting that won't settle?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK dizziness guidance recommends GP review for persistent/recurring dizziness with hearing changes or tinnitus.",
        redFlag: false,
        keywords: ["vertigo with hearing loss", "vertigo with ringing in ears"],
        careAdviceIds: ["oscg-vertigo-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-vertigo-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a brief spinning episode, especially with head position changes, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Brief positional vertigo often settles with simple precautions and gradual movement.",
        redFlag: false,
        keywords: ["brief positional vertigo"],
        careAdviceIds: ["oscg-vertigo-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vertigo-emergency-advice", titleEn: "Emergency central-vertigo precautions", instructionTextEn: "Note the time symptoms started and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms worsen", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vertigo-urgent-advice", titleEn: "Urgent vertigo review", instructionTextEn: "Arrange a GP appointment to investigate the vertigo and hearing symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vertigo worsens or occurs more often", "hearing changes develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-vertigo-selfcare-advice", titleEn: "Home care for brief vertigo", instructionTextEn: "Move the head gradually and carefully, sit or lie down until it passes, and avoid sudden position changes. Avoid driving, ladders, or machinery while dizzy.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["vertigo persists or recurs", "numbness, weakness, or speech difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Dizziness\", https://www.nhs.uk/conditions/dizziness/ (page last reviewed 21 April 2023)"],
      contentNotice: "Decomposed from the same NHS.UK dizziness guidance already used for Dizziness - Lightheadedness, split out for the spinning/vertigo presentation with the same safety-conservative emergency stroke-pattern reclassification. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Hives - https://www.nhs.uk/conditions/hives/ (reviewed 2024-04-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-hives",
    titleEn: "Hives",
    clinicalDefinitionEn: "Hives (nettle rash/urticaria) assessment decomposed from NHS.UK's published hives guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "hives", weight: 100 },
      { phrase: "nettle rash", weight: 100 },
      { phrase: "itchy welts on skin", weight: 90 },
      { phrase: "raised itchy bumps all over", weight: 90 },
      { phrase: "itchy welts all over my body", weight: 100 },
      { phrase: "looks like hives", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hives-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the rash been present?" },
      { id: "oscg-hives-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any swelling of the lips, mouth, or throat, or breathing difficulty?" },
      { id: "oscg-hives-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any known trigger (food, plant, cold, heat, medication)?" }
    ],
    questions: [
      {
        id: "oscg-hives-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there swelling of the lips, mouth, throat, or tongue, severe breathing difficulty, wheezing, choking, a tight throat, blue/grey/pale skin, sudden confusion or drowsiness, or loss of consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK hives guidance lists these as signs of a serious allergic reaction (anaphylaxis) needing immediate hospital treatment.",
        redFlag: true,
        keywords: ["swollen throat with hives", "breathing difficulty with hives", "hives and lips swelling"],
        careAdviceIds: ["oscg-hives-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hives-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has the rash not improved after 2 days, is it spreading, recurring, with a high fever, or swelling under the skin?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent GP or NHS 111 contact for these features.",
        redFlag: false,
        keywords: ["hives not improving after 2 days", "spreading hives rash"],
        careAdviceIds: ["oscg-hives-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hives-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a typical hives outbreak with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes hives as typically resolving within days with self-treatment.",
        redFlag: false,
        keywords: ["typical hives outbreak"],
        careAdviceIds: ["oscg-hives-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hives-emergency-advice", titleEn: "Emergency anaphylaxis precautions", instructionTextEn: "Arrange emergency transport immediately - this may be a severe allergic reaction requiring emergency treatment.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hives-urgent-advice", titleEn: "Urgent hives review", instructionTextEn: "Arrange same-day medical review for these features.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hives-selfcare-advice", titleEn: "Home care for typical hives", instructionTextEn: "Ask a pharmacist about an antihistamine, and try to identify and avoid any personal trigger (certain foods, plants, cold, heat, tight clothing, sunlight, or water). Hives usually settle within a few days.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling of the face, lips, or throat develops", "does not improve after 2 days"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hives\", https://www.nhs.uk/conditions/hives/ (page last reviewed 26 April 2024)"],
      contentNotice: "Decomposed from NHS.UK's published hives guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Head Lice - https://www.nhs.uk/conditions/head-lice/ (reviewed 2024-04-22)
  // ------------------------------------------------------------------
  {
    id: "oscg-head-lice",
    titleEn: "Head Lice",
    clinicalDefinitionEn: "Head lice assessment decomposed from NHS.UK's published head lice guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "head lice", weight: 100 },
      { phrase: "found lice in hair", weight: 95 },
      { phrase: "nits in my kids hair", weight: 95 },
      { phrase: "itchy scalp lice", weight: 90 },
      { phrase: "lice crawling in my kids hair", weight: 100 },
      { phrase: "lice in hair after school", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-headlice-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Have live lice actually been seen (not just nits/eggs)?" },
      { id: "oscg-headlice-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Has any treatment already been tried?" },
      { id: "oscg-headlice-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Are other close contacts also affected?" }
    ],
    questions: [
      {
        id: "oscg-headlice-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Have medicated treatments already been tried without success?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends speaking to a pharmacist about alternative treatments if the first attempt hasn't worked.",
        redFlag: false,
        keywords: ["lice treatment not working"],
        careAdviceIds: ["oscg-headlice-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-headlice-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a new case of suspected or confirmed head lice with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance states head lice can be treated without seeing a GP, using wet combing or pharmacy treatments.",
        redFlag: false,
        keywords: ["new case of head lice"],
        careAdviceIds: ["oscg-headlice-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-headlice-urgent-advice", titleEn: "Head lice treatment not working", instructionTextEn: "Ask a pharmacist about alternative treatment options.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["lice persist after a second treatment"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-headlice-selfcare-advice", titleEn: "Home treatment for head lice", instructionTextEn: "Check everyone in close contact and treat everyone with lice on the same day. Use wet combing with conditioner and a detection comb on days 1, 5, 9, and 13, or a pharmacy lotion/spray (repeating after a week if needed). Children do not need to stay home from school. Avoid products with permethrin, repellents, electric combs, or plant oils, which are unlikely to work.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["lice persist after treatment"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-22", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Head lice\", https://www.nhs.uk/conditions/head-lice/ (page last reviewed 22 April 2024)"],
      contentNotice: "Decomposed from NHS.UK's published head lice guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Jaundice - https://www.nhs.uk/conditions/jaundice-newborn/ (reviewed 2026-03-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-jaundice",
    titleEn: "Jaundice",
    clinicalDefinitionEn: "Jaundice (yellowing of the skin/eyes) assessment, primarily decomposed from NHS.UK's published newborn jaundice guidance - the most common jaundice presentation in after-hours pediatric triage.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "jaundice", weight: 100 },
      { phrase: "yellow skin", weight: 95 },
      { phrase: "baby looks yellow", weight: 100 },
      { phrase: "whites of eyes are yellow", weight: 95 },
      { phrase: "baby is looking yellow", weight: 100 },
      { phrase: "newborn looking yellow eyes", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-jaundice-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the person, and when was jaundice first noticed?" },
      { id: "oscg-jaundice-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What color is the urine/stool?" },
      { id: "oscg-jaundice-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is feeding/eating and behavior normal?" }
    ],
    questions: [
      {
        id: "oscg-jaundice-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is a jaundiced baby under 24 hours old, unusually sleepy or hard to wake, feeding poorly, showing abnormal muscle tone or movements, having a temperature outside 36-38C, producing no wet diapers, or having difficulty breathing (grunting, chest/stomach sucking in)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK newborn jaundice guidance lists these as call-999/A&E criteria - jaundice under 24 hours old or with these features can indicate a serious underlying problem.",
        redFlag: true,
        keywords: ["jaundice under 24 hours old", "baby wont wake up jaundice", "baby not feeding jaundice"],
        careAdviceIds: ["oscg-jaundice-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-jaundice-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the baby over 24 hours old with suspected or worsening jaundice, dark yellow/brown urine, or pale creamy-colored stool - or is this jaundice in an older child or adult?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent review for these signs in a newborn; jaundice at any other age also always needs prompt medical evaluation since it can indicate a liver or blood problem.",
        redFlag: false,
        keywords: ["dark urine with jaundice", "pale stool with jaundice", "adult with jaundice"],
        careAdviceIds: ["oscg-jaundice-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-jaundice-emergency-advice", titleEn: "Emergency newborn jaundice precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening sleepiness", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-jaundice-urgent-advice", titleEn: "Urgent jaundice review", instructionTextEn: "Arrange same-day medical review. For a jaundiced baby, keep feeding regularly (about 8-12 times a day) and wake a sleepy baby for feeds - most newborn jaundice resolves within about 2 weeks, but it needs monitoring.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["baby becomes sleepy or feeds poorly", "jaundice worsens or spreads"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Jaundice in newborn babies\", https://www.nhs.uk/conditions/jaundice-newborn/ (page last reviewed 24 March 2026)"],
      contentNotice: "Primarily decomposed from NHS.UK's newborn jaundice guidance (Crown copyright, reused under the Open Government Licence), since this is the most common jaundice presentation in after-hours pediatric triage; the urgent tier notes jaundice at any age always needs prompt evaluation, a general extension beyond the newborn-specific source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Earwax - https://www.nhs.uk/conditions/earwax-build-up/ (reviewed 2024-01-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-earwax",
    titleEn: "Earwax",
    clinicalDefinitionEn: "Earwax build-up assessment decomposed from NHS.UK's published earwax build-up guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "earwax build up", weight: 100 },
      { phrase: "ear feels blocked with wax", weight: 95 },
      { phrase: "ear plugged with wax", weight: 90 },
      { phrase: "too much earwax", weight: 90 },
      { phrase: "ear feels blocked up with wax", weight: 100 },
      { phrase: "cant hear well earwax", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-earwax-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the blockage been present?" },
      { id: "oscg-earwax-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any pain, discharge, or bleeding from the ear?" },
      { id: "oscg-earwax-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Has anything already been tried (oil drops, ear candles, cotton buds)?" }
    ],
    questions: [
      {
        id: "oscg-earwax-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Have symptoms lasted more than 5 days despite home treatment, or is there a severe blockage preventing hearing?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK earwax guidance recommends GP review for symptoms lasting more than 5 days or a severe hearing blockage.",
        redFlag: false,
        keywords: ["earwax blockage lasting days", "cant hear because of earwax"],
        careAdviceIds: ["oscg-earwax-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-earwax-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a recent, mild earwax blockage with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends softening oil drops as first-line home treatment.",
        redFlag: false,
        keywords: ["mild recent earwax blockage"],
        careAdviceIds: ["oscg-earwax-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earwax-urgent-advice", titleEn: "Urgent earwax review", instructionTextEn: "See a GP or nurse - the wax may need professional removal by irrigation, microsuction, or gentle scraping.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain or discharge develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earwax-selfcare-advice", titleEn: "Home treatment for earwax build-up", instructionTextEn: "Lie on your side with the affected ear facing up, apply 2-3 drops of olive or almond oil, and stay on your side for 5-10 minutes. Repeat 3-4 times a day for 3-5 days - the wax should clear naturally over about 2 weeks. Do not use cotton buds or fingers, which can push wax deeper.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["no improvement after 5 days", "pain, discharge, or bleeding develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earwax build-up\", https://www.nhs.uk/conditions/earwax-build-up/ (page last reviewed 05 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published earwax build-up guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
