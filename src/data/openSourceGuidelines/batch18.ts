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
    clinicalDefinitionEn: "Qatar-localized UAT-only emergency pathway for a suspected asthma attack in an adult or child; rescue treatment must follow the patient's clinician-issued plan and local formulary governance.",
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
      { id: "oscg-asthmaattack-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What exact prescribed rescue inhaler/action plan is available and what doses have already been taken?" },
      { id: "oscg-asthmaattack-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there inability to speak/feed, blue/grey colour, exhaustion, drowsiness, anaphylaxis, fever, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-asthmaattack-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person feeling worse despite the inhaler, not improving after the maximum reliever dose, or without an inhaler available at all?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK asthma attack guidance identifies these as signs requiring emergency assessment; the local Qatar emergency pathway is used here.",
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
        severity: "Urgent",
        questionTextEn: "Is this a mild flare-up that improves with the reliever inhaler, with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance describes a mild flare-up responding to the reliever inhaler as manageable, with a follow-up primary-care review recommended afterward.",
        redFlag: false,
        keywords: ["mild asthma flare up improving"],
        careAdviceIds: ["oscg-asthmaattack-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-asthmaattack-emergency-advice", titleEn: "Emergency asthma attack precautions", instructionTextEn: "Call Qatar 999 for an ambulance now and follow the call handler's instructions. Do not self-drive. Use only the patient's prescribed reliever inhaler according to their current written asthma plan while waiting; sit upright if able.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing", "blue or grey lips"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-asthmaattack-selfcare-advice", titleEn: "Urgent assessment after apparent improvement", instructionTextEn: "Sit upright and use only the rescue medicine already prescribed for this patient according to their written action plan. Arrange same-day in-person Qatar review; do not improvise inhaler type or dose. Call Qatar 999 immediately if improvement is incomplete or symptoms recur.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["not improving with prescribed plan", "symptoms return or worsen"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-04-07", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Asthma attack\", https://www.nhs.uk/conditions/asthma/asthma-attack/ (page last reviewed 07 April 2025)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric pathway with no generated IDs. Emergency acuity cannot be downgraded; age-specific inhaler, spacer, formulary and follow-up rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 2. Breathing Difficulty - Qatar-localized UAT-only draft; adult/child/infant clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-breathing-difficulty",
    titleEn: "Breathing Difficulty",
    clinicalDefinitionEn: "UAT-only recognition and routing pathway for breathing difficulty in adults, children, and infants; not approved for real-patient or production use.",
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
      { id: "oscg-breathingdifficulty-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, and did the breathing difficulty start suddenly or gradually?" },
      { id: "oscg-breathingdifficulty-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the patient fully responsive and breathing continuously without gasping, pauses, grunting, severe chest or rib indrawing, or inability to speak, cry, feed, or drink because of breathlessness?" },
      { id: "oscg-breathingdifficulty-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there blue, grey or very pale colour, chest pain, collapse, or sudden confusion or unusual floppiness?" },
      { id: "oscg-breathingdifficulty-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Did symptoms begin after a possible allergen with hives, swelling of the lips, mouth, tongue or throat, tight throat, wheeze, dizziness, or collapse?" },
      { id: "oscg-breathingdifficulty-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "Does the patient have a clinician-issued asthma, allergy, cardiac, respiratory, tracheostomy, or other emergency plan, and are the prescribed rescue devices available?" }
    ],
    questions: [
      {
        id: "oscg-breathingdifficulty-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe or rapidly worsening breathing difficulty; gasping, choking, pauses or irregular breathing; inability to speak, cry, feed, or drink because of breathlessness; grunting, nasal flaring, or marked pulling-in between or under the ribs; blue, grey or very pale colour; collapse, sudden confusion, unusual drowsiness or floppiness; or, in an adult or older adolescent, a tight or heavy chest or pain spreading to the arm, back, neck or jaw?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "HMC identifies difficulty breathing as life-threatening and directs Qatar callers to 999. NHS and 2025 Resuscitation Council UK guidance add age-specific pediatric danger signs including grunting, indrawing, abnormal respiratory rate or pauses, inability to feed or speak, altered behaviour, and abnormal colour.",
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
        questionTextEn: "Only after all emergency features are excluded, is breathlessness worse than usual or persistent, or accompanied by coughing blood, palpitations, vomiting, one-sided leg pain or swelling, reduced feeding or urine in a child, or caregiver concern that a child is worsening?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent clinical review for these accompanying symptoms; the local Qatar urgent-care pathway is used here.",
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
        questionTextEn: "For an adult or older adolescent only, is stable breathlessness worse with activity or lying down, associated with swollen ankles, or accompanied by a cough lasting 3 weeks or more, with all emergency and urgent features excluded?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends routine primary-care review for these patterns, and states shortness of breath should never be self-diagnosed.",
        redFlag: false,
        keywords: ["breathless lying down", "breathless with swollen ankles"],
        careAdviceIds: ["oscg-breathingdifficulty-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-breathingdifficulty-emergency-advice", titleEn: "Emergency breathing difficulty — call Qatar 999", instructionTextEn: "Call Qatar 999 for an ambulance immediately and follow the operator's instructions. Keep the patient in the position in which they breathe most comfortably and do not force them to lie flat. If suspected anaphylaxis is present, follow the Anaphylaxis emergency pathway and use the patient's prescribed adrenaline auto-injector without delaying 999. Use only rescue medicine or a device already prescribed for this patient and follow their clinician-issued emergency plan; do not improvise a dose. If the patient becomes unresponsive and is not breathing normally, start age-appropriate CPR as directed by the 999 operator. Do not drive the patient to hospital.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens or pauses", "blue, grey, or very pale colour", "reduced responsiveness or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathingdifficulty-urgent-advice", titleEn: "Same-day breathing assessment", instructionTextEn: "Arrange same-day in-person assessment through the Qatar urgent-care destination approved for this UAT environment. Keep the patient observed and resting in the position in which they breathe most comfortably. Use only medicines already prescribed for this patient according to their clinician-issued plan. Escalate immediately to Qatar 999 if any emergency feature appears.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing becomes harder or faster", "chest pain, abnormal colour, confusion, floppiness, or reduced feeding develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathingdifficulty-routine-advice", titleEn: "Stable adult breathlessness follow-up", instructionTextEn: "Arrange an in-person primary-care assessment using the Qatar route approved for this UAT environment; breathlessness should not be self-diagnosed. This routine tier is not approved for infants or young children and must never override an earlier emergency or urgent finding.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen or occur at rest", "any emergency or urgent feature develops"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, and respiratory clinical review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "Resuscitation Council UK, \"Paediatric Life Support\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/paediatric-basic-life-support-guidelines",
        "NHS.UK, \"Shortness of breath\", https://www.nhs.uk/conditions/shortness-of-breath/",
        "NHS.UK, \"Bronchiolitis\", https://www.nhs.uk/conditions/bronchiolitis/"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. The adult and child generated variants share a canonical source but contain explicit age-conditional criteria; they require separate Qatar adult and pediatric approval, including infant thresholds and the handling of chronic respiratory or cardiac disease. Qatar 999 is verified for life-threatening breathing difficulty. Exact non-emergency destinations and timeframes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 3. Common Cold - https://www.nhs.uk/conditions/common-cold/ (reviewed 2024-03-22)
  // ------------------------------------------------------------------
  {
    id: "oscg-common-cold",
    titleEn: "Common Cold",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric upper-respiratory-symptom pathway screening for breathing difficulty, sepsis, dehydration and high-risk hosts; not approved for production.",
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
      { id: "oscg-commoncold-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any existing chronic condition or weakened immune system?" },
      { id: "oscg-commoncold-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there breathing/feeding difficulty, reduced urine, drowsiness, severe pain, prolonged fever, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-commoncold-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe or abnormal breathing (gasping, choking, unable to speak or feed normally), blue or grey colour, collapse, confusion, unusual floppiness or difficulty waking, a seizure, or signs of severe dehydration such as no urine and marked drowsiness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Severe breathing, circulation, responsiveness, neurological or dehydration features can indicate a life-threatening illness rather than an uncomplicated cold and require emergency assessment.",
        redFlag: true,
        keywords: ["severe breathing difficulty with cold", "blue child with cold", "floppy infant with cold", "severe dehydration with cold"],
        careAdviceIds: ["oscg-commoncold-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-commoncold-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is the patient under 3 months with a measured temperature of 38 degrees Celsius or higher, age 3-6 months with a measured temperature of 39 degrees Celsius or higher, having feeding difficulty or reduced urine, or is there a high temperature lasting more than 3 days, worsening symptoms, shortness of breath or chest pain, symptoms lasting more than 10 days, a cough lasting more than 3 weeks, or an existing chronic condition or weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NICE treats fever at these infant age thresholds as higher risk, and NHS.UK common cold guidance lists the other features as reasons to arrange clinical review.",
        redFlag: false,
        keywords: ["fever in young infant with cold", "cold symptoms lasting over 10 days", "chest pain with a cold"],
        careAdviceIds: ["oscg-commoncold-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-commoncold-q1-selfcare",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Are these typical cold symptoms with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance describes the common cold as self-limiting, usually improving within 1-2 weeks.",
        redFlag: false,
        keywords: ["typical cold symptoms"],
        careAdviceIds: ["oscg-commoncold-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-commoncold-emergency-advice", titleEn: "Qatar emergency response for severe respiratory illness", instructionTextEn: "Call Qatar emergency services on 999 now for severe or abnormal breathing, blue or grey colour, collapse, confusion, seizure, unusual floppiness or difficulty waking, or severe dehydration. Follow the call-taker's instructions and do not self-drive. If the patient becomes unresponsive and is not breathing normally, start age-appropriate CPR as directed and use an AED if available.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing or colour worsens", "reduced responsiveness or seizure", "no urine with marked drowsiness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-commoncold-urgent-advice", titleEn: "Urgent cold-with-complications review", instructionTextEn: "Arrange prompt in-person clinical assessment through the Qatar pathway approved for this UAT environment. A young infant meeting a fever threshold, or any patient with feeding, hydration, breathing or high-risk-host concerns, must not remain on routine cold self-care. The exact non-emergency destination and timeframe remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty develops", "feeding, urine or alertness worsens", "symptoms significantly worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-commoncold-selfcare-advice", titleEn: "Low-risk respiratory symptom review", instructionTextEn: "Rest and maintain tolerated fluids; avoid steam inhalation because of burn risk. Arrange clinician/pharmacist review before medicines are selected, especially for children or pregnancy. Escalate any breathing, feeding, hydration or responsiveness concern.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["fever persists or condition worsens", "breathing, feeding, urine or alertness changes"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-03-22", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Common cold\", https://www.nhs.uk/conditions/common-cold/ (page last reviewed 22 March 2024)",
        "NICE NG143, \"Fever in under 5s: assessment and initial management\", https://www.nice.org.uk/guidance/ng143"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Breathing difficulty and sepsis cannot be downgraded; infant thresholds, medication and exact destination remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 4. Fever - https://www.nhs.uk/conditions/fever-in-adults/ (reviewed 2023-05-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-fever",
    titleEn: "Fever",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult fever pathway; the cited source does not support pediatric use, and pregnancy, sepsis and immunocompromise require lower-threshold assessment.",
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
      { id: "oscg-fever-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Have any treatments been tried, and did they help?" },
      { id: "oscg-fever-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Confirm adult age; is the patient pregnant/recently postpartum; and are there confusion, breathing difficulty, stiff neck, non-blanching rash, severe pain, dehydration, immune suppression, recent surgery/travel or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-fever-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has the fever been treated at home but is not getting better, or is it getting worse?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK fever guidance recommends urgent clinical review when home treatment is not working; the local Qatar urgent-care pathway is used here.",
        redFlag: false,
        keywords: ["fever not improving with home treatment", "fever getting worse"],
        careAdviceIds: ["oscg-fever-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fever-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is this a fever (38C or above) that is new or improving with home treatment, with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance describes rest, fluids, and paracetamol/ibuprofen as appropriate first-line self-care for fever.",
        redFlag: false,
        keywords: ["new fever responding to home treatment"],
        careAdviceIds: ["oscg-fever-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fever-urgent-advice", titleEn: "Urgent fever review", instructionTextEn: "Arrange prompt clinical review through the local Qatar urgent-care pathway since home treatment has not helped.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "new symptoms develop"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fever-selfcare-advice", titleEn: "Adult fever clinical assessment", instructionTextEn: "Rest, take tolerated fluids and arrange prompt clinical assessment through the Qatar UAT pathway. Medication requires pregnancy, allergy, kidney/liver, bleeding and interaction checks; this adult-source pathway must not be used for a child.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or condition worsens", "confusion, breathing difficulty, rash, severe pain or dehydration"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Fever in adults\", https://www.nhs.uk/conditions/fever-in-adults/ (page last reviewed 24 May 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Adult-only, source-only Qatar pathway with no generated IDs. It must not generate pediatric variants; pregnancy, sepsis, immunocompromise, medication and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 5. Dizziness - Lightheadedness - https://www.nhs.uk/conditions/dizziness/ (reviewed 2023-04-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-dizziness-lightheadedness",
    titleEn: "Dizziness - Lightheadedness",
    clinicalDefinitionEn: "Qatar-localized UAT-only adolescent/adult lightheadedness pathway screening for stroke, cardiac, bleeding, pregnancy and dehydration emergencies; pediatric applicability is not established.",
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
      { id: "oscg-lightheadedness-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does it happen when standing up quickly?" },
      { id: "oscg-lightheadedness-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Confirm age; is the patient pregnant/recently postpartum; and are there fainting, chest pain, palpitations, bleeding, neurologic symptoms, severe headache, dehydration, medication change or safeguarding concerns?" }
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
        rationaleEn: "NHS.UK dizziness guidance recommends primary-care review for persistent or recurring dizziness with these associated symptoms.",
        redFlag: false,
        keywords: ["dizziness that keeps coming back", "dizziness with fainting"],
        careAdviceIds: ["oscg-lightheadedness-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-lightheadedness-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this a brief, one-off episode of lightheadedness (such as standing up quickly) with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance describes brief lightheadedness as usually resolving on its own with simple precautions.",
        redFlag: false,
        keywords: ["brief lightheaded episode"],
        careAdviceIds: ["oscg-lightheadedness-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lightheadedness-emergency-advice", titleEn: "Emergency stroke-pattern precautions", instructionTextEn: "Call Qatar 999 for an ambulance now, note the time symptoms started, and do not self-drive. Do not give food, drink, aspirin, or other medicine unless directed by the emergency team.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms worsen", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lightheadedness-urgent-advice", titleEn: "Urgent dizziness review", instructionTextEn: "Arrange a primary-care appointment to investigate the recurring dizziness and associated symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["dizziness worsens or occurs more often", "hearing or vision changes develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-lightheadedness-selfcare-advice", titleEn: "In-person lightheadedness assessment", instructionTextEn: "Lie or sit safely, do not drive or use machinery, and arrange in-person assessment through the Qatar UAT pathway. Do not assume dehydration or change medication without review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["dizziness persists, recurs or causes fainting", "neurologic, chest, breathing or bleeding symptoms"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Dizziness\", https://www.nhs.uk/conditions/dizziness/ (page last reviewed 21 April 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only adolescent/adult Qatar pathway with no generated IDs; pediatric applicability is unsupported. Stroke cannot be downgraded; cardiac, pregnancy, bleeding, medication and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 6. Dizziness - Vertigo - https://www.nhs.uk/conditions/dizziness/ (reviewed 2023-04-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-dizziness-vertigo",
    titleEn: "Dizziness - Vertigo",
    clinicalDefinitionEn: "Qatar-localized UAT-only adolescent/adult vertigo pathway screening for stroke, acute hearing loss and dangerous neurologic or cardiac causes; pediatric applicability is not established.",
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
      { id: "oscg-vertigo-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does it change with head position?" },
      { id: "oscg-vertigo-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Confirm age; is the patient pregnant/recently postpartum; and are there new weakness/speech/vision symptoms, inability to walk, severe headache, fainting, chest symptoms, sudden hearing loss, vomiting/dehydration, medication change or safeguarding concerns?" }
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
        rationaleEn: "NHS.UK dizziness guidance recommends primary-care review for persistent or recurring dizziness with hearing changes or tinnitus.",
        redFlag: false,
        keywords: ["vertigo with hearing loss", "vertigo with ringing in ears"],
        careAdviceIds: ["oscg-vertigo-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-vertigo-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this a brief spinning episode, especially with head position changes, and none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Brief positional vertigo often settles with simple precautions and gradual movement.",
        redFlag: false,
        keywords: ["brief positional vertigo"],
        careAdviceIds: ["oscg-vertigo-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vertigo-emergency-advice", titleEn: "Emergency central-vertigo precautions", instructionTextEn: "Call Qatar 999 for an ambulance now, note the time symptoms started, and do not self-drive. Do not give food, drink, aspirin, or other medicine unless directed by the emergency team.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms worsen", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vertigo-urgent-advice", titleEn: "Urgent vertigo review", instructionTextEn: "Arrange a primary-care appointment to investigate the vertigo and hearing symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vertigo worsens or occurs more often", "hearing changes develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-vertigo-selfcare-advice", titleEn: "In-person vertigo assessment", instructionTextEn: "Sit or lie safely, move only with assistance if needed, do not drive or use machinery, and arrange in-person assessment through the Qatar UAT pathway. Do not perform repositioning manoeuvres until contraindications and diagnosis are assessed.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vertigo persists, recurs or prevents walking", "neurologic, hearing, chest or fainting symptoms"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Dizziness\", https://www.nhs.uk/conditions/dizziness/ (page last reviewed 21 April 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only adolescent/adult Qatar pathway with no generated IDs; pediatric applicability is unsupported. Stroke and sudden hearing loss cannot be downgraded; examination, manoeuvre and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 7. Hives - Qatar-localized UAT-only draft; adult/child/infant clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-hives",
    titleEn: "Hives",
    clinicalDefinitionEn: "UAT-only assessment of suspected hives (urticaria), with an emergency safety screen for anaphylaxis; not approved for real-patient or production use.",
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
      { id: "oscg-hives-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, when did the rash begin, and what does it look and feel like?" },
      { id: "oscg-hives-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there swelling of the lips, mouth, tongue or throat; difficult or noisy breathing; tight throat; difficulty swallowing; wheeze; dizziness; collapse; confusion; unusual drowsiness or floppiness?" },
      { id: "oscg-hives-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Was there a possible trigger such as food, medicine, insect sting, heat, cold, pressure, or infection, and does the patient have a prescribed allergy action plan or adrenaline auto-injector?" },
      { id: "oscg-hives-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there high fever or marked illness, painful or blistering skin, purple spots that do not fade with pressure, eye or mouth involvement, or swelling beneath the skin?" }
    ],
    questions: [
      {
        id: "oscg-hives-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden swelling of the lips, mouth, tongue or throat; tight throat, hoarse voice or difficulty swallowing; fast, noisy or difficult breathing or wheeze; blue, grey or very pale colour; cold or clammy skin; severe dizziness, confusion, collapse or reduced responsiveness; or unusual floppiness in an infant or child? Treat these features as suspected anaphylaxis even if the hives are mild or absent.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "The corrected Anaphylaxis pathway and 2025 Resuscitation Council UK guidance recognize airway, breathing or circulation compromise as anaphylaxis with or without skin changes. HMC directs severe allergic reactions in Qatar to 999.",
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
        questionTextEn: "Only after anaphylaxis and other emergency rash features are excluded, have hives failed to improve after 2 days, spread or recurred, or occurred with fever, feeling unwell, caregiver concern about a child, or swelling beneath the skin?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent clinical review for these features; the local Qatar urgent-care pathway is used here.",
        redFlag: false,
        keywords: ["hives not improving after 2 days", "spreading hives rash"],
        careAdviceIds: ["oscg-hives-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hives-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these typical itchy, raised hives in a patient who is otherwise well, with all emergency and urgent features excluded and no concern about a young child?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes hives as typically resolving within days with self-treatment.",
        redFlag: false,
        keywords: ["typical hives outbreak"],
        careAdviceIds: ["oscg-hives-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hives-emergency-advice", titleEn: "Suspected anaphylaxis — call Qatar 999", instructionTextEn: "Call Qatar 999 for an ambulance immediately and follow the Anaphylaxis emergency pathway. If the patient has their prescribed adrenaline auto-injector, help them use it promptly according to the device instructions without delaying 999. Keep the patient lying flat with legs raised if tolerated; if breathing is difficult, allow sitting with legs extended. Do not let the patient stand or walk. If symptoms persist after 5 minutes and a second prescribed device is available, use it. Antihistamines do not treat the airway, breathing, or circulation features of anaphylaxis and must not delay adrenaline or 999.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms persist after the first auto-injector", "breathing worsens", "collapse or reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hives-urgent-advice", titleEn: "Same-day hives assessment", instructionTextEn: "Arrange same-day clinical assessment through the Qatar urgent-care destination approved for this UAT environment. Keep the patient observed and escalate immediately to Qatar 999 if any airway, breathing, circulation, or reduced-responsiveness feature develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling of lips, mouth, tongue, or throat", "breathing or swallowing difficulty", "dizziness, collapse, or unusual floppiness"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hives-selfcare-advice", titleEn: "Isolated hives after emergency screening", instructionTextEn: "Avoid a suspected trigger when this can be done safely. A pharmacist or clinician should confirm whether an antihistamine is suitable and select the product, formulation, and dose using the patient's age, weight, pregnancy or breastfeeding status, other medicines, and health conditions. Do not give an adult product or dose to a child. Continue observation and use Qatar 999 immediately if anaphylaxis features develop.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling of the lips, mouth, tongue, or throat", "breathing or swallowing difficulty", "hives do not improve after 2 days or recur"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, allergy, and emergency clinical review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "Resuscitation Council UK, \"First Aid Guidelines — Anaphylaxis\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines",
        "NHS.UK, \"Hives\", https://www.nhs.uk/conditions/hives/",
        "NHS.UK, \"Antihistamines\", https://www.nhs.uk/medicines/antihistamines/"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. The adult and child generated variants share a canonical source but require separate Qatar adult and pediatric approval, including infant assessment and age-appropriate antihistamine policy. The emergency branch must hand off to the corrected Anaphylaxis pathway without lowering acuity. Qatar 999 is verified for severe allergic reaction; exact non-emergency destinations and timeframes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 8. Head Lice - https://www.nhs.uk/conditions/head-lice/ (reviewed 2024-04-22)
  // ------------------------------------------------------------------
  {
    id: "oscg-head-lice",
    titleEn: "Head Lice",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for suspected head lice, requiring confirmation, age/pregnancy review, safe product selection and safeguarding assessment.",
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
      { id: "oscg-headlice-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Are other close contacts also affected?" },
      { id: "oscg-headlice-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant/breastfeeding; and are there scalp infection, chemical exposure, failed treatments, immune suppression, neglect or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-headlice-q1-selfcare",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is this a new case of suspected or confirmed head lice with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance states head lice can be treated without primary-care review, using wet combing or pharmacy treatments.",
        redFlag: false,
        keywords: ["new case of head lice"],
        careAdviceIds: ["oscg-headlice-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-headlice-urgent-advice", titleEn: "Head lice treatment not working", instructionTextEn: "Ask a pharmacist about alternative treatment options.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["lice persist after a second treatment"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-headlice-selfcare-advice", titleEn: "Confirmed head-lice management review", instructionTextEn: "Confirm live lice with appropriate combing and obtain pharmacist/clinician advice before selecting treatment for age, pregnancy, breastfeeding, allergies and prior exposure. Do not use pesticides, veterinary products, essential oils, heat or flammable remedies.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["scalp infection or chemical injury", "lice persist despite correctly supervised treatment"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-22", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Head lice\", https://www.nhs.uk/conditions/head-lice/ (page last reviewed 22 April 2024)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Diagnosis, age/pregnancy-safe products, resistance, school policy and safeguarding remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 9. Jaundice - https://www.nhs.uk/conditions/jaundice-newborn/ (reviewed 2026-03-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-jaundice",
    titleEn: "Jaundice",
    clinicalDefinitionEn: "Qatar-localized UAT-only neonatal jaundice pathway based on a newborn-specific source; it must not be generalized to adult or older-child variants without separate evidence.",
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
      { id: "oscg-jaundice-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is feeding and behaviour normal?" },
      { id: "oscg-jaundice-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record exact age in hours/days, gestation, birth history, feeding, wet/dirty nappies, temperature, alertness, tone, breathing, bruising, blood-group/haemolysis risks and safeguarding concerns." }
    ],
    questions: [
      {
        id: "oscg-jaundice-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is a jaundiced baby under 24 hours old, unusually sleepy or hard to wake, feeding poorly, showing abnormal muscle tone or movements, having a temperature outside 36-38C, producing no wet diapers, or having difficulty breathing (grunting, chest/stomach sucking in)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK newborn jaundice guidance identifies these as signs requiring emergency assessment - jaundice under 24 hours old or with these features can indicate a serious underlying problem; the local Qatar emergency pathway is used here.",
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-jaundice-emergency-advice", titleEn: "Emergency newborn jaundice precautions", instructionTextEn: "Call Qatar 999 for an ambulance now and follow the call handler's instructions. Do not self-drive with an unstable or difficult-to-wake newborn, and do not give medicine, water, or feeds unless the emergency team advises it.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening sleepiness", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-jaundice-urgent-advice", titleEn: "Urgent jaundice review", instructionTextEn: "Arrange same-day medical review. For a jaundiced baby, keep feeding regularly (about 8-12 times a day) and wake a sleepy baby for feeds - most newborn jaundice resolves within about 2 weeks, but it needs monitoring.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["baby becomes sleepy or feeds poorly", "jaundice worsens or spreads"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Jaundice in newborn babies\", https://www.nhs.uk/conditions/jaundice-newborn/ (page last reviewed 24 March 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Newborn-only, source-only Qatar pathway with no generated IDs. It must not generate adult or generic-child variants; bilirubin thresholds, gestational-age rules, maternity/neonatal destination and safeguarding remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 10. Earwax - https://www.nhs.uk/conditions/earwax-build-up/ (reviewed 2024-01-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-earwax",
    titleEn: "Earwax",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for suspected earwax, screening for sudden hearing loss, infection, perforation, foreign body and contraindications to irrigation or drops.",
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
      { id: "oscg-earwax-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Has anything already been tried, including drops, irrigation, candles or cotton buds?" },
      { id: "oscg-earwax-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there sudden hearing loss, pain, discharge, bleeding, dizziness, previous perforation/surgery, tubes, diabetes, immune suppression, foreign body or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-earwax-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Have symptoms lasted more than 5 days despite home treatment, or is there a severe blockage preventing hearing?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK earwax guidance recommends primary-care review for symptoms lasting more than 5 days or a severe hearing blockage.",
        redFlag: false,
        keywords: ["earwax blockage lasting days", "cant hear because of earwax"],
        careAdviceIds: ["oscg-earwax-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-earwax-q1-selfcare",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is this a recent, mild earwax blockage with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends softening oil drops as first-line home treatment.",
        redFlag: false,
        keywords: ["mild recent earwax blockage"],
        careAdviceIds: ["oscg-earwax-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earwax-urgent-advice", titleEn: "Urgent earwax review", instructionTextEn: "Arrange review by a primary-care clinician or nurse - the wax may need professional removal by irrigation, microsuction, or gentle scraping.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain or discharge develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earwax-selfcare-advice", titleEn: "Assessment before earwax treatment", instructionTextEn: "Do not insert objects, use ear candles or irrigate the ear. Arrange clinician/pharmacist review before drops are selected because age, eardrum status, surgery/tubes, infection, pregnancy and allergies must be checked.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["sudden hearing loss", "pain, discharge, bleeding, fever or dizziness"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earwax build-up\", https://www.nhs.uk/conditions/earwax-build-up/ (page last reviewed 05 January 2024)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Sudden hearing loss cannot be attributed to wax remotely; otoscopy, drops, irrigation/microsuction and ENT destination rules remain GOVERNANCE_REQUIRED."
    })
  }
];
