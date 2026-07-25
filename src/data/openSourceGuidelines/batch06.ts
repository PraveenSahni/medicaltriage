import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 06 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Three ear/eye protocols (Ear - Foreign Body, Ear - Swimmer's, Eye
 * - Foreign Body, Eye - Chemical In) share source pages with each other or
 * with the general Earache/Eye Injuries pages - each pulls only its own
 * relevant criterion subset, not the whole page, and cites the specific
 * source used.
 */
export const batch06Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Diarrhea - https://www.nhs.uk/conditions/diarrhoea/ (reviewed 2023-12-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-diarrhea",
    titleEn: "Diarrhea",
    clinicalDefinitionEn: "Safety-first assessment of acute diarrhoea in infants, children, adults, and pregnancy, focused on dehydration, bleeding, sepsis, exposure history, and higher-risk patients. This protocol does not determine the infectious cause.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "diarrhea", weight: 100 },
      { phrase: "diarrhoea", weight: 100 },
      { phrase: "loose stools", weight: 80 },
      { phrase: "watery poop", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-diarrhea-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Record age, duration, number and appearance of stools, vomiting, fever, abdominal pain, blood or black stool, and whether fluids stay down." },
      { id: "oscg-diarrhea-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "When was urine last passed, is urine reduced or dark, and are there dry mouth, no tears, sunken eyes or fontanelle, marked thirst, dizziness, unusual sleepiness, weakness, or inability to stand?" },
      { id: "oscg-diarrhea-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Is the patient an infant, pregnant or recently postpartum, age 65 or older, immunocompromised, diabetic, or living with kidney, heart, bowel, or other serious disease?" },
      { id: "oscg-diarrhea-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Any recent antibiotics, hospital stay, travel, unsafe food or water, sick contacts, outbreak exposure, or medicines such as laxatives?" }
    ],
    questions: [
      {
        id: "oscg-diarrhea-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is the person unresponsive or difficult to wake, confused, collapsed, unable to stand, not breathing normally, pale/blue/grey or cold and mottled, passing almost no urine, having a seizure, vomiting blood, passing a large amount of blood or black stool, or experiencing severe constant abdominal pain, a rigid or swollen abdomen, or signs of shock or sepsis?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Shock, severe dehydration, major gastrointestinal bleeding, altered consciousness, severe abdominal disease, and sepsis can be life-threatening and require immediate emergency assessment.",
        redFlag: true,
        keywords: ["blue lips diarrhea", "confused with diarrhea", "no urine diarrhea", "bloody diarrhea collapse", "sepsis diarrhea", "infant unresponsive diarrhea"],
        careAdviceIds: ["oscg-diarrhea-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-diarrhea-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Without an emergency feature, is there blood in the stool, repeated vomiting or inability to maintain fluids, reduced urine or other dehydration signs, fever with worsening illness, significant abdominal pain, recent foreign travel, diarrhoea after antibiotics or healthcare exposure, symptoms lasting 7 days, or an infant, pregnant patient, older adult, immunocompromised patient, or person with serious chronic disease whose symptoms are not clearly mild and improving?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Blood, dehydration, persistent symptoms, travel or healthcare exposure, and vulnerable physiology require prompt clinical assessment. Infants can deteriorate quickly, and pregnancy, immunocompromise, older age, and serious comorbidity lower the threshold for review. The exact Qatar non-emergency service and timeframe are governance-required.",
        redFlag: false,
        keywords: ["bloody diarrhea", "diarrhea more than 7 days", "cant keep fluids down"],
        careAdviceIds: ["oscg-diarrhea-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-diarrhea-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a non-pregnant older child or generally healthy adult with mild diarrhoea for less than 7 days, normal alertness and urine output, able to drink, no blood, significant fever or pain, no recent antibiotics or high-risk travel, and none of the risk factors above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Home care is limited to a clearly low-risk presentation with preserved hydration and explicit escalation precautions.",
        redFlag: false,
        keywords: ["typical diarrhea"],
        careAdviceIds: ["oscg-diarrhea-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-diarrhea-emergency-advice", titleEn: "Emergency diarrhoea precautions", instructionTextEn: "Call Qatar 999 now. Keep the person lying safely and warm, do not allow self-driving, and follow the call-handler's instructions. Do not force oral fluid if the person is drowsy, repeatedly vomiting, or unable to swallow safely.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced consciousness, seizure, abnormal breathing, or signs of shock", "worsening bleeding, severe pain, or absent urine"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-diarrhea-urgent-advice", titleEn: "Prompt in-person diarrhoea assessment", instructionTextEn: "Use the Qatar governance-approved in-person service and timeframe; this UAT protocol does not define the exact non-emergency route. Continue breastfeeding. If awake and able to swallow, offer small frequent amounts of correctly prepared oral rehydration solution; do not substitute concentrated juice, fizzy drinks, energy drinks, or homemade mixtures. Medication, pregnancy, infant, and chronic-disease advice requires a clinician or pharmacist.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["less urine, increasing drowsiness, inability to drink, persistent vomiting, or fainting", "blood or black stool, worsening fever, severe pain, or breathing change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-diarrhea-selfcare-advice", titleEn: "Home hydration for strictly low-risk diarrhoea", instructionTextEn: "Rest, continue normal tolerated food, and take small frequent fluids; use correctly prepared oral rehydration solution if losses continue. Maintain careful hand and toilet hygiene and do not prepare food for others while symptomatic. Do not use antimotility medicines when blood, fever, severe pain, or antibiotic-associated diarrhoea is present, and confirm any medicine with a pharmacist.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["reduced urine, dizziness, unusual sleepiness, inability to drink, or repeated vomiting", "blood or black stool, fever, worsening pain, or symptoms reaching 7 days"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Diarrhoea and vomiting\", https://www.nhs.uk/conditions/diarrhoea/ (page last reviewed 21 December 2023)",
        "WHO, \"Diarrhoea\", https://www.who.int/health-topics/diarrhoea (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis for diarrhoea across age and pregnancy contexts. It adds dehydration, sepsis, bleeding, infant, pregnancy, immunocompromise, comorbidity, antibiotic, and travel controls. Exact Qatar non-emergency routing and medication advice remain local-governance responsibilities. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Diarrhea on Antibiotics - https://www.nhs.uk/conditions/clostridium-difficile/ (reviewed 2025-07-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-diarrhea-on-antibiotics",
    titleEn: "Diarrhea on Antibiotics",
    clinicalDefinitionEn: "Safety-first assessment of diarrhoea during or after antibiotic exposure, including possible Clostridioides difficile infection, dehydration, colitis, sepsis, and higher-risk patients. Antibiotic association does not confirm C. difficile.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "diarrhea on antibiotics", weight: 100 },
      { phrase: "diarrhea after antibiotics", weight: 95 },
      { phrase: "c diff", weight: 85 },
      { phrase: "antibiotic diarrhea", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-cdiff-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What antibiotic is being taken or was recently completed, for what infection, when was the last dose, and was there a recent hospital or care-facility stay or previous C. difficile infection?" },
      { id: "oscg-cdiff-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How many unformed stools occurred in the last 24 hours, for how long, and is there fever, blood or black stool, vomiting, abdominal tenderness, severe pain, or swelling?" },
      { id: "oscg-cdiff-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Can fluids be kept down, when was urine last passed, and is there dizziness, marked weakness, confusion, fainting, or other dehydration?" },
      { id: "oscg-cdiff-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, immune suppression, inflammatory bowel disease, kidney or heart disease, diabetes, and any laxative, stool-softener, or antimotility medicine use." }
    ],
    questions: [
      {
        id: "oscg-cdiff-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse, confusion or reduced responsiveness, abnormal breathing, pale/blue/grey or cold mottled skin, almost no urine, severe weakness or inability to stand, severe constant abdominal pain, a rigid or markedly swollen abdomen, major blood or black stool, or signs of shock or sepsis?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "C. difficile and other antibiotic-associated illness can progress to severe dehydration, sepsis, fulminant colitis, toxic megacolon, shock, or death. These features require immediate emergency assessment.",
        redFlag: true,
        keywords: ["confused antibiotic diarrhea", "severe illness with diarrhea"],
        careAdviceIds: ["oscg-cdiff-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-cdiff-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is there new unexplained diarrhoea during or after antibiotics, especially 3 or more unformed stools in 24 hours, fever, abdominal pain, blood, dehydration, recurrence after C. difficile treatment, recent healthcare exposure, or an infant, pregnant, older, immunocompromised, or seriously ill patient?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Antibiotic-associated diarrhoea needs prompt clinician review because C. difficile can be life-threatening but cannot be diagnosed from symptoms alone. The prescriber must decide whether the original antibiotic can safely be continued, changed, or stopped and whether stool testing or treatment is required.",
        redFlag: false,
        keywords: ["diarrhea taking antibiotics", "bloody diarrhea antibiotics"],
        careAdviceIds: ["oscg-cdiff-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cdiff-emergency-advice", titleEn: "Emergency antibiotic-associated diarrhoea precautions", instructionTextEn: "Call Qatar 999 now. Keep the person lying safely and warm, do not allow self-driving, and follow the call-handler's instructions. Do not force oral fluids if swallowing is unsafe or vomiting is persistent.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced consciousness, abnormal breathing, collapse, or signs of shock", "worsening abdominal swelling, severe pain, bleeding, or absent urine"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cdiff-urgent-advice", titleEn: "Prompt in-person antibiotic-associated diarrhoea review", instructionTextEn: "Use the Qatar governance-approved in-person service and timeframe; this UAT protocol does not define the exact non-emergency route. Contact the antibiotic prescriber promptly. Do not independently stop, skip, switch, restart, or share antibiotics, and do not start loperamide or another antimotility drug unless the assessing clinician specifically approves it. Use soap-and-water handwashing after toilet use and before food; do not rely on alcohol hand gel alone for C. difficile spores. If awake and able to swallow, take small frequent amounts of correctly prepared oral rehydration solution.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["less urine, inability to drink, fainting, confusion, or worsening weakness", "fever, blood or black stool, severe pain, abdominal swelling, or recurrent symptoms"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Clostridium difficile (C. diff)\", https://www.nhs.uk/conditions/clostridium-difficile/ (page last reviewed 24 July 2025)",
        "US CDC, \"About C. diff\", https://www.cdc.gov/c-diff/about/index.html (accessed 25 July 2026)",
        "US CDC, \"C. diff: Facts for Clinicians\", https://www.cdc.gov/c-diff/hcp/clinical-overview/ (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis for diarrhoea during or after antibiotic exposure. It does not diagnose C. difficile or authorize a caller to alter antibiotics; testing, treatment, medication changes, isolation, and exact Qatar non-emergency routing require clinician and local-governance decisions. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Earache - https://www.nhs.uk/conditions/earache/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-earache",
    titleEn: "Earache",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric ear-pain pathway screening for mastoid/invasive infection, sudden hearing loss, foreign body, trauma, high-risk hosts and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "earache", weight: 100 },
      { phrase: "ear pain", weight: 95 },
      { phrase: "ear hurts", weight: 85 },
      { phrase: "ear hurting", weight: 90 },
      { phrase: "ear is sore", weight: 90 },
      { phrase: "sore inside ear", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-earache-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the earache lasted?" },
      { id: "oscg-earache-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "One ear or both?" },
      { id: "oscg-earache-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever, discharge, or hearing changes?" },
      { id: "oscg-earache-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there swelling behind the ear, severe dizziness, facial weakness, head injury, foreign body, diabetes, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-earache-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the patient confused, difficult to wake or rapidly deteriorating, or is there severe headache/neck stiffness, facial weakness, swelling/redness behind the ear with the ear pushed outward, or a major head injury with clear/bloody ear discharge?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sepsis, intracranial spread, facial nerve involvement, mastoid complications and skull-base injury require emergency assessment.",
        redFlag: true,
        keywords: ["ear pain confused", "swelling behind ear", "facial weakness earache"],
        careAdviceIds: ["oscg-earache-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-earache-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Has the earache lasted more than 2-3 days, does the person feel generally unwell or have a high temperature, is there swelling around the ear, fluid coming from the ear, hearing loss or change, something stuck in the ear, or is this a child under 2 with earache in both ears?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK earache guidance lists these as reasons for an urgent clinical review.",
        redFlag: false,
        keywords: ["earache more than 3 days", "swelling around ear", "fluid from ear", "hearing change with earache"],
        careAdviceIds: ["oscg-earache-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-earache-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Does the caller keep getting earaches recurrently?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine primary-care review for recurring earaches.",
        redFlag: false,
        keywords: ["recurring earaches"],
        careAdviceIds: ["oscg-earache-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-earache-q2-selfcare",
        acuityOrder: 4,
        severity: "Urgent",
        questionTextEn: "After higher-risk features are excluded, is any new ear pain still present without an in-person diagnosis?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This UAT pathway requires direct ear examination before assuming a benign cause or advising medication.",
        redFlag: false,
        keywords: ["mild recent earache"],
        careAdviceIds: ["oscg-earache-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earache-emergency-advice", titleEn: "Emergency ear-pain precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient observed, do not insert anything or add drops to the ear, and follow dispatcher instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced responsiveness or seizure", "worsening swelling, headache, neck stiffness or facial weakness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earache-urgent-advice", titleEn: "Urgent earache review", instructionTextEn: "Arrange same-day or next-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "hearing loss increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earache-routine-advice", titleEn: "Routine earache follow-up", instructionTextEn: "Arrange a routine primary-care review for recurring earaches.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["earaches become more frequent"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-earache-selfcare-advice", titleEn: "In-person assessment for new ear pain", instructionTextEn: "Keep the ear dry, do not insert objects, irrigate or use unverified drops, and arrange in-person assessment through the Qatar pathway approved for UAT. Medication requires age, weight, pregnancy, allergy, kidney/liver and interaction checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "fever, swelling, discharge, dizziness or hearing change develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earache\", https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Invasive infection and sudden hearing loss cannot be downgraded; pediatric, ENT, medication and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 4. Ear - Foreign Body - https://www.nhs.uk/conditions/earache/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-foreign-body",
    titleEn: "Ear - Foreign Body",
    clinicalDefinitionEn: "Safety-first assessment of a suspected foreign body in the external ear canal, prioritizing button batteries, sharp objects, penetrating trauma, bleeding, and complications from attempted removal.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "something stuck in ear", weight: 100 },
      { phrase: "object in ear", weight: 95 },
      { phrase: "bug in ear", weight: 85 },
      { phrase: "stuck in my ear", weight: 90 },
      { phrase: "in his ear", weight: 80 },
      { phrase: "in her ear", weight: 80 },
      { phrase: "bead in ear", weight: 95 },
      { phrase: "cant get it out", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-earbody-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What may be in the ear: a button or coin battery, magnet, sharp object, food or seed, insect, bead, cotton, hearing-aid part, or unknown object? Do not delay care trying to identify it." },
      { id: "oscg-earbody-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When was it inserted or first noticed, and has anyone attempted removal, irrigation, oil, drops, glue, tweezers, cotton buds, or another tool?" },
      { id: "oscg-earbody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there severe pain, active bleeding, discharge, sudden hearing loss, dizziness, vomiting, facial weakness, or suspected eardrum injury?" },
      { id: "oscg-earbody-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, affected ear, whether the object is visibly protruding, and whether this could involve coercion, abuse, self-harm, or an unsafe caregiver." }
    ],
    questions: [
      {
        id: "oscg-earbody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the object a button or coin battery, paired magnet, sharp or penetrating object, or unknown object with severe pain, active bleeding, sudden major hearing loss, severe dizziness, facial weakness, or reduced responsiveness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Button batteries can rapidly cause corrosive tissue injury; magnets, sharp objects, penetrating trauma, bleeding, and neurologic or vestibular symptoms require immediate specialist-capable emergency assessment.",
        redFlag: true,
        keywords: ["button battery in ear", "magnet in ear", "sharp object in ear", "ear bleeding foreign body"],
        careAdviceIds: ["oscg-earbody-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-earbody-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "If no emergency feature is present, is any object or insect still in the ear, or are pain, discharge, hearing change, failed removal attempts, or uncertainty present?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A retained ear foreign body requires prompt direct examination and controlled removal to avoid canal or eardrum injury. The exact Qatar service and timeframe are governance-required.",
        redFlag: false,
        keywords: ["stuck in ear", "insect in ear", "failed ear object removal", "hearing change foreign body"],
        careAdviceIds: ["oscg-earbody-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-earbody-emergency-advice",
        titleEn: "Emergency hazardous ear foreign body",
        instructionTextEn: "Call Qatar 999 now for a hazardous object or serious symptoms and follow the call-handler's transport instructions. Do not put liquid, oil, drops, food, or tools into the ear; do not irrigate; and do not pull an object unless it has already fallen completely free. Keep the patient still and do not allow self-driving.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening pain or bleeding", "dizziness, vomiting, facial weakness, reduced responsiveness, or sudden hearing loss"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      },
      {
        id: "oscg-earbody-urgent-advice",
        titleEn: "Foreign body in ear - controlled in-person removal",
        instructionTextEn: "Use the Qatar governance-approved in-person service and timeframe. Do not attempt blind extraction with fingers, cotton buds, tweezers, glue, suction, or other tools, and do not irrigate or add oil or drops because the object, eardrum status, and material may be uncertain. Stop further attempts after any failed removal and keep the ear dry.",
        dispositionCode: "HMC_URGENT_REVIEW",
        warningSigns: ["pain worsens", "bleeding starts", "hearing suddenly changes"],
        displayOrder: 2,
        adviceCategory: "DISPOSITION",
        patientSendable: true
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Earache\", https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025)",
        "US National Library of Medicine, StatPearls, \"Ear Foreign Body Removal\", https://www.ncbi.nlm.nih.gov/books/NBK459136/ (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis for ear foreign bodies. Button batteries, magnets, sharp or penetrating objects, bleeding, and serious neurologic, vestibular, or hearing symptoms are escalated; blind extraction and irrigation are prohibited. Exact Qatar non-emergency removal routing requires local governance approval. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Ear - Swimmer's - https://www.nhs.uk/conditions/ear-infection/ (reviewed 2025-01-16)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-swimmers",
    titleEn: "Ear - Swimmer's",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for suspected otitis externa after water exposure, screening for invasive infection, diabetes/immunocompromise, hearing or neurologic complications; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "swimmers ear", weight: 100 },
      { phrase: "outer ear infection", weight: 90 },
      { phrase: "otitis externa", weight: 80 },
      { phrase: "ear infection after swimming", weight: 90 },
      { phrase: "ear is infected", weight: 100 },
      { phrase: "ear draining", weight: 95 },
      { phrase: "went swimming", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-swimmerear-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-swimmerear-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Recent swimming or water exposure?" },
      { id: "oscg-swimmerear-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any discharge, hearing change, or dizziness?" },
      { id: "oscg-swimmerear-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there severe/night pain, fever, swelling beyond the canal, facial weakness, diabetes, immune suppression, recent instrumentation or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-swimmerear-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there confusion, reduced responsiveness, rapid deterioration, facial weakness, severe pain with diabetes or immune suppression, or redness/swelling spreading around or behind the ear with marked systemic illness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These features may indicate sepsis, invasive external-ear infection or cranial-nerve involvement and require emergency assessment.",
        redFlag: true,
        keywords: ["diabetes severe ear pain", "facial weakness ear infection", "confused ear infection"],
        careAdviceIds: ["oscg-swimmerear-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-swimmerear-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Does the person feel generally unwell or have a very high temperature, is there swelling around the ear, fluid coming from the ear, hearing loss or change, nausea/vomiting/dizziness, a severe sore throat, or a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK ear infection guidance lists these as urgent clinical-review criteria.",
        redFlag: false,
        keywords: ["swelling around ear", "dizziness with ear infection", "discharge from ear"],
        careAdviceIds: ["oscg-swimmerear-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-swimmerear-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Has earache persisted beyond 3 days, or are ear infections recurring?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a primary-care review for persistent or recurrent ear infections.",
        redFlag: false,
        keywords: ["persistent ear infection", "recurrent ear infections"],
        careAdviceIds: ["oscg-swimmerear-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-swimmerear-q2-selfcare",
        acuityOrder: 4,
        severity: "Urgent",
        questionTextEn: "After higher-risk features are excluded, is swimmer's ear still suspected without direct canal and eardrum examination?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "The cited source is not specific to otitis externa and safe drops depend on eardrum status; this UAT pathway requires in-person examination.",
        redFlag: false,
        keywords: ["mild recent ear infection"],
        careAdviceIds: ["oscg-swimmerear-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-swimmerear-emergency-advice", titleEn: "Emergency invasive ear-infection precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient observed and the ear dry; insert nothing and use no drops while awaiting emergency assessment.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["confusion or reduced responsiveness", "facial weakness or rapidly spreading swelling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-swimmerear-urgent-advice", titleEn: "Urgent ear infection review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening pain or swelling", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-swimmerear-routine-advice", titleEn: "Routine ear infection follow-up", instructionTextEn: "Arrange a primary-care review for persistent or recurring ear infections.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "new discharge"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-swimmerear-selfcare-advice", titleEn: "In-person assessment for suspected swimmer's ear", instructionTextEn: "Keep the ear dry, avoid swimming and do not insert objects or use drops until the canal and eardrum are examined. Arrange prompt in-person assessment through the Qatar UAT pathway.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain or swelling worsens", "fever, hearing change, discharge, dizziness or facial weakness"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-01-16", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Ear infection\", https://www.nhs.uk/conditions/ear-infection/ (page last reviewed 16 January 2025)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft based on nonspecific ear-infection guidance. Invasive infection cannot be downgraded; otoscopy, eardrum-safe drops, antimicrobial and ENT destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 6. Eye - Foreign Body - https://www.nhs.uk/conditions/eye-injuries/ (reviewed 2026-03-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-foreign-body",
    titleEn: "Eye - Foreign Body",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for a suspected ocular foreign body, screening for penetration, high-velocity injury, chemical exposure, visual loss and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "something in my eye", weight: 100 },
      { phrase: "object in eye", weight: 90 },
      { phrase: "dust in eye", weight: 80 },
      { phrase: "eyelash in eye", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyebody-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What went into the eye?" },
      { id: "oscg-eyebody-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did this happen?" },
      { id: "oscg-eyebody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any vision changes?" },
      { id: "oscg-eyebody-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant or a contact-lens wearer; was this metal-on-metal, grinding or power-tool work; and are there severe pain, light sensitivity, abnormal pupil, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-eyebody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Has a sharp object pierced the eye, did something hit the eye at high speed, has vision changed since the injury, is there severe eye pain, headache or light sensitivity, nausea or vomiting, inability to move the eye or keep it open, or blood/pus from the eye?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK eye injuries guidance lists these as emergency ambulance or Emergency Department criteria. Do not try to remove any object that has pierced the eye.",
        redFlag: true,
        keywords: ["pierced eye", "vision changed after eye injury", "severe eye pain"],
        careAdviceIds: ["oscg-eyebody-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyebody-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After penetrating, high-velocity and other emergency features are excluded, is a speck or particle still present or suspected?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A retained corneal foreign body or abrasion cannot be excluded remotely; this UAT pathway requires prompt eye assessment.",
        redFlag: false,
        keywords: ["minor speck in eye"],
        careAdviceIds: ["oscg-eyebody-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyebody-emergency-advice", titleEn: "Emergency eye injury precautions", instructionTextEn: "Call Qatar 999 for major trauma or severe systemic deterioration; otherwise proceed immediately to the approved emergency eye destination. Do not drive, rub or press the eye, remove an embedded object, or apply drops. Protect without pressure if feasible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision worsens", "pain, vomiting or confusion increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyebody-selfcare-advice", titleEn: "Prompt eye foreign-body assessment", instructionTextEn: "Do not rub the eye or use tweezers, cotton buds or unverified drops. Stop contact-lens use and arrange prompt in-person eye assessment through the Qatar UAT pathway. If a loose superficial particle clears spontaneously with gentle clean-water irrigation, persistent pain, redness or vision change still requires review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["object does not clear", "pain, light sensitivity or vision change develops"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page last reviewed 12 March 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric pathway with no generated IDs. Penetrating/high-velocity injury and visual loss cannot be downgraded; ophthalmology destination, examination and medication rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 7. Eye - Chemical In - https://www.nhs.uk/conditions/eye-injuries/ (reviewed 2026-03-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-chemical",
    titleEn: "Eye - Chemical In",
    clinicalDefinitionEn: "Qatar-localized UAT-only unconditional emergency pathway for any suspected chemical eye exposure in an adult or child, prioritizing immediate irrigation and specialist assessment; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "chemical in eye", weight: 100 },
      { phrase: "bleach in eye", weight: 95 },
      { phrase: "cleaner in eye", weight: 90 },
      { phrase: "chemical splashed eye", weight: 90 },
      { phrase: "oven cleaner", weight: 95 },
      { phrase: "sprayed in eye", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyechem-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What chemical went into the eye?" },
      { id: "oscg-eyechem-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has rinsing with water already started?" },
      { id: "oscg-eyechem-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the container/packaging available?" },
      { id: "oscg-eyechem-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; are contact lenses present; were powder or multiple chemicals involved; and are both eyes, skin, breathing or safeguarding concerns involved?" }
    ],
    questions: [
      {
        id: "oscg-eyechem-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has any chemical, powder, cleaning product, industrial substance or unknown liquid entered or possibly entered the eye?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK eye injuries guidance lists chemical exposure to the eye as an emergency ambulance or Emergency Department criterion.",
        redFlag: true,
        keywords: ["strong chemical in eye"],
        careAdviceIds: ["oscg-eyechem-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-eyechem-emergency-advice",
        titleEn: "Emergency chemical eye exposure first aid",
        instructionTextEn: "Start continuous gentle irrigation immediately with clean lukewarm water and call Qatar 999 on speaker; do not delay irrigation to identify the chemical. Remove contact lenses only if easy during rinsing. Brush away dry powder from skin before irrigation while avoiding further exposure. Do not rub the eye, neutralize the chemical or add drops. Continue as directed and do not drive; bring packaging only if safe and without delay.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["vision changes", "pain increases"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page last reviewed 12 March 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only unconditional Qatar emergency pathway with no generated IDs. Exposure cannot be downgraded; irrigation duration, poison-service interface, occupational decontamination and ophthalmology destination remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 8. Coughing Up Blood - https://www.nhs.uk/conditions/coughing-up-blood/ (reviewed 2024-06-13)
  // ------------------------------------------------------------------
  {
    id: "oscg-coughing-up-blood",
    titleEn: "Coughing Up Blood",
    clinicalDefinitionEn: "Qatar-localized UAT-only pathway for suspected haemoptysis in adolescents and adults, screening for major bleeding, pulmonary embolism, infection, anticoagulation, pregnancy/postpartum risk and safeguarding; not approved for production.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "coughing up blood", weight: 100 },
      { phrase: "blood in phlegm", weight: 90 },
      { phrase: "hemoptysis", weight: 80 },
      { phrase: "blood when i cough", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hemoptysis-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How much blood, and what does it look like?" },
      { id: "oscg-hemoptysis-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this been happening?" },
      { id: "oscg-hemoptysis-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any chest pain or shortness of breath?" },
      { id: "oscg-hemoptysis-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant/recently postpartum; and are there fainting, fast heartbeat, one-sided leg swelling, fever, tuberculosis exposure, cancer, recent surgery/travel, anticoagulants, bleeding disorder or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-hemoptysis-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is more than just a few spots or streaks of blood being coughed up, or is there difficulty breathing, a very fast heartbeat, or chest/upper back pain along with the blood?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance requires emergency ambulance or Emergency Department assessment for these features, which may indicate a serious condition such as pulmonary embolism.",
        redFlag: true,
        keywords: ["large amount blood coughed", "chest pain coughing blood", "hard to breathe coughing blood"],
        careAdviceIds: ["oscg-hemoptysis-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hemoptysis-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Are there just a few small spots, flecks, or streaks of blood noticed in phlegm or on a handkerchief?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends an urgent clinical review even for small amounts of blood, which can occasionally indicate a serious underlying cause.",
        redFlag: false,
        keywords: ["small streaks of blood", "flecks of blood in phlegm"],
        careAdviceIds: ["oscg-hemoptysis-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hemoptysis-emergency-advice", titleEn: "Emergency coughing-blood precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient upright if breathing is easier, observed and at rest. Give no food, drink or new medication while major bleeding or pulmonary embolism is possible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathlessness, collapse or chest pain", "increasing blood"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hemoptysis-urgent-advice", titleEn: "Urgent haemoptysis assessment", instructionTextEn: "Arrange same-day in-person assessment through the Qatar pathway approved for UAT, even for streaks. Do not stop prescribed anticoagulants unless the assessing clinician instructs this. Use infection-control precautions if tuberculosis or another transmissible infection is possible.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["amount of blood increases", "breathing difficulty, chest pain, fainting or leg swelling develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-06-13", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Coughing up blood\", https://www.nhs.uk/conditions/coughing-up-blood/ (page last reviewed 13 June 2024)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adolescent/adult pathway with no generated IDs. Major bleeding and pulmonary embolism cannot be downgraded; pregnancy, infection-control, imaging and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 9. Arm Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/ (reviewed 2023-05-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-arm-injury",
    titleEn: "Arm Injury",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for arm or wrist trauma, screening for major bleeding, open fracture, neurovascular compromise, associated major injury and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "arm injury", weight: 100 },
      { phrase: "hurt my arm", weight: 90 },
      { phrase: "broken arm", weight: 95 },
      { phrase: "wrist injury", weight: 85 },
      { phrase: "landed on my arm", weight: 95 },
      { phrase: "fell on my arm", weight: 95 },
      { phrase: "on my arm", weight: 70 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-arminjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-arminjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-arminjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the arm be moved at all?" },
      { id: "oscg-arminjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant or taking anticoagulants; and are there head/neck/chest injury, cold/pale/blue hand, weak pulse, numbness, open wound, high-energy mechanism, deliberate injury or inconsistent history?" }
    ],
    questions: [
      {
        id: "oscg-arminjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the arm or wrist numb, tingling, or has pins and needles, is there heavy bleeding, a bone sticking out of the skin, or has the arm changed shape or is at an odd angle?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken arm or wrist guidance lists these as emergency ambulance or Emergency Department criteria.",
        redFlag: true,
        keywords: ["numb arm after injury", "bone sticking out", "arm deformed"],
        careAdviceIds: ["oscg-arminjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-arminjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there severe pain or inability to use the arm, worsening pain, significant or worsening swelling/bruising, stiffness, or a high temperature/feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends an urgent clinical review for these features.",
        redFlag: false,
        keywords: ["severe arm pain", "cannot use arm", "worsening swelling"],
        careAdviceIds: ["oscg-arminjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-arminjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is any arm or wrist injury still painful, bruised or functionally affected without in-person assessment?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Fracture and growth-plate injury cannot be excluded remotely; this UAT pathway requires in-person examination before home management.",
        redFlag: false,
        keywords: ["mild arm pain"],
        careAdviceIds: ["oscg-arminjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-arminjury-emergency-advice", titleEn: "Emergency arm injury precautions", instructionTextEn: "Call Qatar 999 and do not drive for uncontrolled bleeding, open fracture, deformity with neurovascular change or associated major injury. Keep the arm still, do not realign it, and apply pressure around rather than on protruding bone.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening numbness, pallor or weakness", "increasing bleeding or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-arminjury-urgent-advice", titleEn: "Urgent arm injury review", instructionTextEn: "Support the arm in the position found, remove rings only if easy, and arrange same-day in-person assessment through the Qatar UAT pathway. Do not force movement or give food, drink or medication if surgery/sedation may be required unless instructed.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain or swelling worsens", "new numbness, colour change or inability to move"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-arminjury-selfcare-advice", titleEn: "In-person assessment for apparently mild injury", instructionTextEn: "Rest and support the limb without forced movement and arrange in-person assessment. Medication requires age, weight, pregnancy, allergy, bleeding, kidney/liver and interaction checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain or swelling worsens", "new numbness, colour change or inability to use the arm"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\", https://www.nhs.uk/conditions/broken-arm-or-wrist/ (page last reviewed 26 May 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric pathway with no generated IDs. Neurovascular injury, open fracture and safeguarding cannot be downgraded; imaging, analgesia, orthopaedic and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 10. Cracked or Dry Skin - https://www.nhs.uk/conditions/atopic-eczema/ (reviewed 2024-09-06)
  // ------------------------------------------------------------------
  {
    id: "oscg-cracked-dry-skin",
    titleEn: "Cracked or Dry Skin",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for cracked or dry skin, screening for sepsis, eczema herpeticum, bacterial infection, high-risk sites, immune compromise and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "dry skin", weight: 95 },
      { phrase: "cracked skin", weight: 95 },
      { phrase: "eczema", weight: 100 },
      { phrase: "itchy dry patches", weight: 85 },
      { phrase: "dry and cracked", weight: 95 },
      { phrase: "skin is flaking", weight: 90 },
      { phrase: "cracked hands", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-drySkin-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the dry or cracked skin?" },
      { id: "oscg-drySkin-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this been present?" },
      { id: "oscg-drySkin-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any blistering, leaking fluid, or spots filled with pus?" },
      { id: "oscg-drySkin-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; is skin near the eyes/face/genitals or widespread; and are there painful clustered blisters, fever, rapid spread, diabetes, immune suppression, new medicine/product, neglect or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-drySkin-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the patient confused, difficult to wake, collapsing or rapidly deteriorating, or are there widespread painful blisters/skin loss, eye or mouth involvement, breathing difficulty, or a rapidly spreading painful rash with marked systemic illness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sepsis, severe drug reactions, extensive blistering disease or serious allergic reactions can be life-threatening and require emergency assessment.",
        redFlag: true,
        keywords: ["skin peeling unwell", "widespread blisters fever", "confused skin infection"],
        careAdviceIds: ["oscg-drySkin-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-drySkin-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the affected skin blistered, crusty, leaking fluid, or has spots filled with pus, is it painful/swollen/warm, has it suddenly worsened or spread, or is there fever/feeling generally unwell?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK atopic eczema guidance lists these as signs of infection or complications needing an urgent clinical review.",
        redFlag: false,
        keywords: ["infected eczema", "blistered skin", "spreading rash worsening"],
        careAdviceIds: ["oscg-drySkin-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-drySkin-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Have moisturizing treatments not helped the dry or cracked skin?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a primary-care review if treatments are not helping the eczema.",
        redFlag: false,
        keywords: ["eczema not improving with treatment"],
        careAdviceIds: ["oscg-drySkin-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-drySkin-q2-selfcare",
        acuityOrder: 4,
        severity: "Routine",
        questionTextEn: "After urgent features are excluded, is there a small area of dry or cracked skin without an established diagnosis?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "This UAT pathway requires clinician or pharmacist confirmation before selecting products, particularly for infants, pregnancy, facial/genital skin or recurrent disease.",
        redFlag: false,
        keywords: ["mild dry skin"],
        careAdviceIds: ["oscg-drySkin-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-drySkin-emergency-advice", titleEn: "Emergency severe-skin-reaction precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient observed and do not apply new creams, medicines or dressings to widespread blistered or peeling skin unless instructed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced responsiveness or breathing difficulty", "rapidly spreading pain, blistering or skin loss"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-drySkin-urgent-advice", titleEn: "Urgent skin infection review", instructionTextEn: "Arrange same-day medical review for these signs of infection or complications.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-drySkin-routine-advice", titleEn: "Routine eczema follow-up", instructionTextEn: "Arrange a primary-care review if moisturizing treatments have not helped.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-drySkin-selfcare-advice", titleEn: "Assessment of mild dry or cracked skin", instructionTextEn: "Avoid known irritants and arrange clinician or pharmacist review before choosing emollients, steroids or other products. Product selection must consider age, pregnancy, allergy, application site, infection and flammability risks.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["painful blisters, spreading redness, discharge or fever", "not improving or affecting sleep/function"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-09-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Atopic eczema\", https://www.nhs.uk/conditions/atopic-eczema/ (page last reviewed 06 September 2024)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric pathway with no generated IDs. Sepsis, eczema herpeticum and safeguarding cannot be downgraded; dermatology, infection, product, steroid and destination rules remain GOVERNANCE_REQUIRED."
    })
  }
];
