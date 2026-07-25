import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 05 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior batches.
 */
export const batch05Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Choking - https://www.nhs.uk/conditions/baby/first-aid-and-safety/first-aid/how-to-stop-a-child-from-choking/ (reviewed 2024-10-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-choking",
    titleEn: "Choking - Inhaled Foreign Body",
    clinicalDefinitionEn: "Choking assessment and first-aid decomposed from NHS.UK's published guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "choking", weight: 100 },
      { phrase: "choked on something", weight: 95 },
      { phrase: "cant breathe choking", weight: 90 },
      { phrase: "something stuck in throat", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-choking-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the person coughing loudly right now?" },
      { id: "oscg-choking-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What did they choke on?" },
      { id: "oscg-choking-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has back blows or abdominal/chest thrusts already been tried?" },
      { id: "oscg-choking-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record exact age, pregnancy or marked obesity, consciousness, colour, ability to speak or cry, and whether the object may be a battery, magnet, sharp item, or unknown substance." }
    ],
    questions: [
      {
        id: "oscg-choking-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the cough silent or ineffective, is the person unable to speak, cry, or breathe normally, are they blue/grey, becoming exhausted, or unconscious, or has the object failed to clear?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance: call 999 if the blockage doesn't come out after back blows and chest/abdominal thrusts, or immediately if the person becomes unconscious. Ineffective/silent coughing needs immediate back blows and thrusts, not watchful waiting.",
        redFlag: true,
        keywords: ["silent cough", "cant breathe in", "unconscious choking"],
        careAdviceIds: ["oscg-choking-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-choking-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is the person coughing loudly and able to breathe, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: if coughing loudly, encourage them to carry on coughing rather than intervening - this is effective, self-clearing choking.",
        redFlag: false,
        keywords: ["coughing loudly", "effective cough"],
        careAdviceIds: ["oscg-choking-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-choking-emergency-advice",
        titleEn: "Emergency choking first aid",
        instructionTextEn:
          "Call Qatar 999 immediately on speakerphone, use emergency ambulance transport, and do not allow self-driving. Follow the call-handler's age-specific instructions. For a conscious patient with ineffective cough, give up to 5 back blows, checking after each; if not cleared, use up to 5 abdominal thrusts for adults and children over 1, but chest thrusts for infants under 1 and for pregnancy or when abdominal thrusts cannot be performed. Repeat as directed. If unresponsive and not breathing normally, begin CPR as instructed. Never perform a blind finger sweep, suspend an infant by the feet, or give food or drink. Medical assessment is required after thrusts or persistent symptoms, even if the object clears.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["blockage does not clear", "person becomes unconscious"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      },
      {
        id: "oscg-choking-selfcare-advice",
        titleEn: "Effective coughing - no intervention needed",
        instructionTextEn: "Encourage the person to keep coughing. Do not perform back blows or thrusts while the cough remains effective - this could push the object further in.",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        warningSigns: ["cough becomes silent or ineffective", "breathing difficulty develops"],
        displayOrder: 2,
        adviceCategory: "CALL_BACK_IF",
        patientSendable: true
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"How to stop a child from choking\", https://www.nhs.uk/conditions/baby/first-aid-and-safety/first-aid/how-to-stop-a-child-from-choking/ (page last reviewed 28 October 2024)"],
      contentNotice: "SOURCE-ONLY UAT generalization; no generated variant exists in the current 504-protocol catalog. Qatar 999 call-handler instructions are authoritative. Adult, infant, child, pregnancy, obesity, post-clearance, safeguarding, and hazardous-object pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Cold Exposure (Hypothermia) - Qatar-localized UAT-only draft; adult/child/infant clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-hypothermia",
    titleEn: "Cold Exposure (Hypothermia)",
    clinicalDefinitionEn: "UAT-only emergency recognition and first-aid pathway for suspected hypothermia after cold exposure in an adult, child, or infant; not approved for real-patient or production use.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "hypothermia", weight: 100 },
      { phrase: "very cold body temperature", weight: 85 },
      { phrase: "shivering uncontrollably", weight: 90 },
      { phrase: "shivering and confused", weight: 95 },
      { phrase: "freezing weather", weight: 85 },
      { phrase: "stuck in the cold", weight: 85 },
      { phrase: "cold exposure", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hypothermia-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, what cold or wet exposure occurred, and for how long?" },
      { id: "oscg-hypothermia-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the patient fully responsive and breathing normally, without slow, irregular, or gasping breaths?" },
      { id: "oscg-hypothermia-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there shivering, cold or pale skin, blue or grey colour, slurred speech, confusion, unusual drowsiness, poor coordination, or—if an infant—cold skin, unusual quietness, poor feeding, sleepiness, or floppiness?" },
      { id: "oscg-hypothermia-iaq4", sequence: 4, responseType: "TEMPERATURE", promptTextEn: "What is the measured temperature, if a reliable reading is available? Do not delay Qatar 999 or first aid to obtain it." },
      { id: "oscg-hypothermia-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Has the patient been moved safely out of wind, water, or cold and insulated from the ground?" }
    ],
    questions: [
      {
        id: "oscg-hypothermia-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "After cold or wet exposure, is hypothermia suspected because the patient is very cold or has shivering, cold or pale skin, blue or grey colour, slow breathing, slurred speech, confusion, unusual drowsiness, poor coordination, or—if an infant—cold skin, unusual quietness, poor feeding, sleepiness, or floppiness? If uncertain, keep the emergency disposition.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK identifies suspected hypothermia in adults and children as a medical emergency requiring hospital care and describes infant-specific signs. Qatar HMC directs life-threatening emergencies to 999.",
        redFlag: true,
        keywords: ["suspected hypothermia", "confused after cold", "slurred speech cold"],
        careAdviceIds: ["oscg-hypothermia-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-hypothermia-emergency-advice",
        titleEn: "Suspected hypothermia — call Qatar 999",
        instructionTextEn:
          "Call Qatar 999 for an ambulance and follow the operator's instructions. If safe, move the patient gently into shelter, insulate them from the cold ground, remove wet clothing without unnecessary movement, and wrap the body and head in dry blankets, clothing, or towels. Stay with the patient and monitor breathing. A fully alert adult or older child who can swallow safely may have a warm non-alcoholic drink; give nothing by mouth to an infant or anyone drowsy, confused, vomiting, or unable to swallow safely. Do not rub or massage the skin or limbs and do not use a hot bath, direct heater, fire, heat lamp, hot water bottle, or heating device directly on the skin. Do not give alcohol. If unresponsive but breathing normally, follow the 999 operator's positioning instructions; if not breathing normally, start age-appropriate CPR as directed. Do not drive the patient to hospital.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening confusion or drowsiness", "loss of consciousness"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, emergency, and environmental-exposure review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "Resuscitation Council UK, \"First Aid Guidelines\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines",
        "NHS.UK, \"Hypothermia\", https://www.nhs.uk/conditions/hypothermia/ (page last reviewed 09 June 2023)"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Suspected hypothermia remains an unconditional emergency with no self-care or non-emergency branch. Adult and child generated variants share this canonical source but require separate Qatar adult, pediatric, and infant approval. Qatar 999 is the verified emergency route. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 3. Coma / Unconsciousness - Qatar-localized UAT-only draft; adult/child/infant clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-coma-unconscious",
    titleEn: "Coma",
    clinicalDefinitionEn: "UAT-only emergency recognition and first-aid pathway for an unresponsive adult, child, or infant; not approved for real-patient or production use.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "unconscious", weight: 100 },
      { phrase: "not waking up", weight: 95 },
      { phrase: "coma", weight: 100 },
      { phrase: "passed out and wont wake up", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-coma-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the scene safe to approach, and is the patient unresponsive to voice and gentle touch?" },
      { id: "oscg-coma-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the patient breathing normally? Gasping, panting, slow irregular breaths, or uncertainty do not count as normal breathing." },
      { id: "oscg-coma-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, how long have they been unresponsive, and what happened immediately beforehand?" },
      { id: "oscg-coma-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Was there trauma, a fall, seizure, choking, drowning, poisoning, overdose, diabetes, pregnancy, or another known medical cause?" },
      { id: "oscg-coma-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is an AED available, and is there another person who can call Qatar 999 and bring it?" }
    ],
    questions: [
      {
        id: "oscg-coma-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the adult, child, or infant unresponsive to voice and gentle touch, or not breathing normally? Treat gasping, panting, slow irregular breaths, and uncertainty about normal breathing as a possible cardiac arrest.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Resuscitation Council UK 2025 guidance requires an immediate emergency call for any unresponsive person and CPR when breathing is abnormal. Adults and children with reduced responsiveness who do not meet CPR criteria may be placed laterally, except in trauma or agonal breathing.",
        redFlag: true,
        keywords: ["unresponsive", "wont wake up"],
        careAdviceIds: ["oscg-coma-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-coma-emergency-advice",
        titleEn: "Unresponsive patient — call Qatar 999",
        instructionTextEn:
          "Call Qatar 999 immediately, put the phone on speaker, and follow the operator's instructions. If the patient is unresponsive and not breathing normally, start age-appropriate CPR immediately and use an AED as soon as available, following its prompts. If breathing normally and there is no suspected trauma, place the patient in a lateral recovery position and continuously monitor breathing. If trauma or spinal injury is possible, avoid unnecessary movement but keep the airway open as directed by 999; airway and breathing take priority. Do not give food, drink, oral sugar, or medicine to an unresponsive patient and do not leave them alone. Use naloxone or another emergency medicine only if available, appropriate to the suspected cause, and directed by the patient's existing plan, product instructions, a trained responder, or the 999 operator. Do not drive the patient to hospital.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["breathing stops or changes", "person starts to wake but remains confused"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, and resuscitation clinical review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "Resuscitation Council UK, \"Adult Basic Life Support Guidelines\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/adult-basic-life-support-guidelines",
        "Resuscitation Council UK, \"Paediatric Life Support\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/paediatric-basic-life-support-guidelines",
        "Resuscitation Council UK, \"First Aid Guidelines — Recovery position\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines",
        "NHS.UK, \"Recovery position\", https://www.nhs.uk/tests-and-treatments/first-aid/recovery-position/"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Unresponsiveness remains an unconditional emergency with no lower-acuity branch. Adult and child generated variants require separate Qatar resuscitation approval, including infant CPR and trauma positioning. Qatar 999 is the verified emergency route. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 4. Burns - Chemical - Qatar-localized UAT-only draft; adult/child/infant clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-burns-chemical",
    titleEn: "Burns - Chemical",
    clinicalDefinitionEn: "UAT-only emergency recognition and decontamination pathway for suspected chemical exposure causing a skin or eye burn; not approved for real-patient or production use.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "chemical burn", weight: 100 },
      { phrase: "acid burn", weight: 95 },
      { phrase: "chemical on skin", weight: 90 },
      { phrase: "chemical in eyes", weight: 90 },
      { phrase: "drain cleaner", weight: 95 },
      { phrase: "cleaning chemical", weight: 90 },
      { phrase: "bleach on skin", weight: 90 },
      { phrase: "splashed chemical", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-chemburn-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the scene safe to approach without exposing the caller or responder to fumes, liquid, powder, contaminated clothing, fire, or another hazard?" },
      { id: "oscg-chemburn-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, what product or chemical was involved, and is the label or safety data sheet available without delaying first aid?" },
      { id: "oscg-chemburn-iaq3", sequence: 3, responseType: "LOCATION", promptTextEn: "Did the chemical contact the skin, eyes, face, mouth, airway, or clothing, and how large is the affected area?" },
      { id: "oscg-chemburn-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there breathing difficulty, coughing, choking, collapse, reduced responsiveness, severe eye pain, or vision change?" },
      { id: "oscg-chemburn-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Has contaminated clothing been removed safely, has any dry chemical been brushed away, and has appropriate irrigation started?" }
    ],
    questions: [
      {
        id: "oscg-chemburn-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has a harmful acid, alkali, cleaning product, industrial chemical, or unknown chemical contacted the skin or eyes, or caused pain, burning, visible injury, breathing symptoms, or reduced responsiveness? If the substance or exposure type is uncertain, keep this emergency disposition and do not redirect to a combined or lower-acuity burn pathway.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK treats acid or chemical exposure to skin or eyes as an emergency requiring immediate first aid and hospital assessment. Uncertainty must fail closed because chemical identity changes decontamination risks.",
        redFlag: true,
        keywords: ["acid on skin", "chemical in eyes"],
        careAdviceIds: ["oscg-chemburn-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-chemburn-emergency-advice",
        titleEn: "Chemical exposure — call Qatar 999",
        instructionTextEn:
          "Call Qatar 999 immediately and follow the operator's instructions. Do not enter a contaminated area or touch the chemical without suitable protection. Move away from fumes only if this can be done safely. Using gloves or another protective barrier, carefully cut away contaminated clothing rather than pulling it over the head; do not remove material stuck to skin. Brush visible dry powder away without spreading it or exposing the responder. Unless the product label, safety data sheet, or 999 operator specifically warns that water is unsafe for that substance, immediately irrigate affected skin or eyes with copious cool or lukewarm running water for about 1 hour. Let runoff flow away from unaffected skin and the other eye. Remove contact lenses only if easy and continue irrigation. Do not scrub, rub, neutralize with another chemical, apply cream, ointment, ice, or medicine, or delay irrigation while identifying the product. Keep the container or a photograph available for emergency responders if safe. Do not drive the patient to hospital.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening pain", "vision changes if eyes affected"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, burns, ophthalmology, toxicology, and HazMat review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "Hamad Medical Corporation, \"Al Wakra Hospital Emergency Quick Guide\", 2025, https://hamad.qa/EN/Hospitals-and-services/alwakra/Patients-and-Visitors/Documents/PF%20Materials/AWH-Quick-Guide_Emergency.pdf (Qatar Poison Center 4003 1111)",
        "NHS.UK, \"Acid and chemical burns\", https://www.nhs.uk/conditions/acid-and-chemical-burns/ (page last reviewed 05 June 2024)",
        "NHS England, \"Management of self-presenters from hazardous-material incidents\", 2026, https://www.england.nhs.uk/long-read/the-management-of-self-presenters-from-incidents-involving-hazardous-materials-or-chemical-biological-radiological-nuclear-cbrn-substances/"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Chemical skin or eye burns remain an unconditional emergency. Unknown or compound burn exposures must fail closed here and must not redirect to a lower-acuity thermal or combined burn pathway. Adult and child generated variants require separate Qatar pediatric, burns, ophthalmology, toxicology, and HazMat approval. Qatar 999 is the verified emergency route. Whether and when a nurse also contacts Qatar Poison Center 4003 1111 is GOVERNANCE_REQUIRED and must not delay 999 or decontamination. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 5. Boil (Skin Abscess) - https://www.nhs.uk/conditions/boils/ (reviewed 2023-06-20)
  // ------------------------------------------------------------------
  {
    id: "oscg-boil-skin-abscess",
    titleEn: "Boil (Skin Abscess)",
    clinicalDefinitionEn: "Boil/skin abscess assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "boil", weight: 100 },
      { phrase: "skin abscess", weight: 95 },
      { phrase: "carbuncle", weight: 80 },
      { phrase: "painful lump under skin", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-boil-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the boil?" },
      { id: "oscg-boil-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been there?" },
      { id: "oscg-boil-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the caller have diabetes or a weakened immune system?" }
    ],
    questions: [
      {
        id: "oscg-boil-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there confusion, collapse, abnormal breathing, pale/blue/mottled skin, rapidly spreading redness or swelling, severe pain out of proportion, black skin, or swelling around the eye, nose, jaw, or neck affecting vision, swallowing, or breathing?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sepsis, necrotising infection, orbital spread, and airway involvement require immediate emergency assessment.",
        redFlag: true,
        keywords: ["sepsis boil", "black skin abscess", "face swelling breathing"],
        careAdviceIds: ["oscg-boil-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-boil-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is the boil on the face, near the eye, genitals, breast, spine, hand, or over a joint; is redness spreading or fever present; or is the patient an infant, pregnant, diabetic, immunocompromised, or otherwise seriously unwell?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK boils guidance lists these as reasons for an urgent GP appointment or 111 call.",
        redFlag: false,
        keywords: ["boil on face", "spreading boil infection", "fever with boil"],
        careAdviceIds: ["oscg-boil-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-boil-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Has the boil lasted 2 weeks without improving, does the caller keep getting boils, or is there a cluster of boils (carbuncle)?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for a persistent boil, recurring boils, or a carbuncle.",
        redFlag: false,
        keywords: ["persistent boil", "recurring boils", "carbuncle"],
        careAdviceIds: ["oscg-boil-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-boil-q2-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a single, recent boil with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides self-care steps (warm compresses) for an uncomplicated boil.",
        redFlag: false,
        keywords: ["single recent boil"],
        careAdviceIds: ["oscg-boil-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-boil-emergency-advice", titleEn: "Emergency skin-infection precautions", instructionTextEn: "Call Qatar 999 now. Do not squeeze, lance, cut, or apply caustic substances. Keep the patient still, do not allow self-driving, and follow the call-handler's instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["confusion, collapse, breathing change, rapidly spreading swelling, black skin, or severe pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-boil-urgent-advice", titleEn: "Prompt in-person abscess review", instructionTextEn: "Use the Qatar governance-approved in-person service. Do not squeeze or pierce the lesion or use leftover antibiotics. Pregnancy, infant, diabetes, immune suppression, facial and genital lesions require clinician-led treatment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness, fever, severe pain, or swelling near eye or airway"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-boil-routine-advice", titleEn: "Routine boil follow-up", instructionTextEn: "Book a routine GP appointment for a persistent, recurring, or clustered boil.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["boil worsens", "fever develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-boil-selfcare-advice", titleEn: "Care for a localized boil pending Qatar review", instructionTextEn: "Use a clean warm compress for short periods and keep the area clean and covered if it drains. Do not pick, squeeze, pierce, or apply caustic products, and do not share towels. Medicine choice and dose require age, weight, pregnancy or breastfeeding status, allergies, kidney or liver disease, ulcer or bleeding risk, other medicines, and Qatar formulary approval. This UAT branch remains non-telemedicine pending clinical governance.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["boil lasts more than 2 weeks", "signs of spreading infection or fever", "pain or swelling rapidly worsens"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-20", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Boils\", https://www.nhs.uk/conditions/boils/ (page last reviewed 20 June 2023)"],
      contentNotice: "UAT-only adaptation with sepsis, necrotising infection, facial/orbital/airway, age, pregnancy, diabetes, immunocompromise, anatomic-site, medication, and safeguarding controls. Exact Qatar drainage and antimicrobial routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Cold Sores (Fever Blisters) - https://www.nhs.uk/conditions/cold-sores/ (reviewed 2024-02-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-cold-sores",
    titleEn: "Cold Sores (Fever Blisters)",
    clinicalDefinitionEn: "Cold sore assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "cold sore", weight: 100 },
      { phrase: "fever blister", weight: 95 },
      { phrase: "sore on lip", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-coldsore-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the cold sore been present?" },
      { id: "oscg-coldsore-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Does the caller have a weakened immune system?" },
      { id: "oscg-coldsore-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Are there also mouth ulcers or swollen, painful gums?" }
    ],
    questions: [
      {
        id: "oscg-coldsore-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there eye pain, redness or vision change, widespread painful blistering with fever or severe illness, breathing or swallowing difficulty, severe facial swelling, confusion, or a newborn or young infant with blisters or fever?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the cold sores guidance itself - cold sores themselves are never an emergency, but severe swelling or swallowing difficulty would suggest a different, more serious problem.",
        redFlag: true,
        keywords: ["life threatening"],
        careAdviceIds: ["oscg-coldsore-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-coldsore-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Without an emergency feature, is the lesion near the eye, not healing within 10 days, very large or painful, widespread over eczema, associated with painful gums or poor intake, or present in pregnancy, an infant, or an immunocompromised patient?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["cold sore not healing", "large painful cold sore", "mouth ulcers with cold sore"],
        careAdviceIds: ["oscg-coldsore-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-coldsore-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a typical cold sore with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes typical cold sores as manageable with pharmacy treatments and self-care.",
        redFlag: false,
        keywords: ["typical cold sore"],
        careAdviceIds: ["oscg-coldsore-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-coldsore-emergency-advice", titleEn: "Emergency herpes-related precautions", instructionTextEn: "Call Qatar 999 now for airway, neurologic, severe systemic, or infant emergency features. Do not allow self-driving. Do not touch the eyes and wash hands after any lesion contact.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision change, confusion, worsening swelling, breathing or swallowing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-coldsore-routine-advice", titleEn: "Routine cold sore follow-up", instructionTextEn: "Book a GP appointment - antiviral tablets may be prescribed for large, painful, or recurring cold sores.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["not healing after 10 days", "spreading or worsening"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-coldsore-selfcare-advice", titleEn: "Low-risk cold-sore care", instructionTextEn: "Avoid kissing, oral sex, sharing utensils, and contact with newborns or immunocompromised people until healed. Wash hands and avoid touching eyes. A pharmacist must confirm antiviral and pain medicine suitability for age, pregnancy, breastfeeding, kidney disease, and interactions.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["eye symptoms, fever, poor intake, spreading over eczema, or failure to heal"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-02-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cold sores\", https://www.nhs.uk/conditions/cold-sores/ (page last reviewed 19 February 2024)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Ocular herpes, neonatal exposure, eczema herpeticum, pregnancy, immunocompromise, antiviral medication, and exact Qatar routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Constipation - https://www.nhs.uk/conditions/constipation/ (reviewed 2023-10-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-constipation",
    titleEn: "Constipation",
    clinicalDefinitionEn: "Constipation assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "constipation", weight: 100 },
      { phrase: "constipated", weight: 100 },
      { phrase: "havent pooped", weight: 75 },
      { phrase: "cant poop", weight: 75 },
      { phrase: "havent been able to poop", weight: 95 },
      { phrase: "backed up", weight: 80 },
      { phrase: "havent gone", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-constipation-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the constipation lasted?" },
      { id: "oscg-constipation-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any blood in the stool?" },
      { id: "oscg-constipation-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any unexplained weight loss or severe abdominal pain?" }
    ],
    questions: [
      {
        id: "oscg-constipation-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe or constant abdominal pain, persistent or green vomiting, a markedly swollen or rigid abdomen, inability to pass gas, collapse, confusion, major rectal bleeding or black stool, or a very unwell infant?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the constipation guidance itself - severe pain, vomiting, or abdominal distension suggests bowel obstruction, which needs emergency evaluation.",
        redFlag: true,
        keywords: ["severe abdominal pain", "vomiting with constipation", "swollen hard abdomen"],
        careAdviceIds: ["oscg-constipation-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-constipation-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Without an emergency feature, is there blood, ongoing pain, fever, weight loss, sudden bowel-habit change, faecal soiling or urinary symptoms, or is the patient a newborn/infant, pregnant or postpartum, older/frail, immunocompromised, neurologically impaired, or taking constipating medicines?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons to see a GP, though categorized as non-urgent rather than emergency.",
        redFlag: false,
        keywords: ["blood in stool", "constipation not improving", "weight loss with constipation"],
        careAdviceIds: ["oscg-constipation-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-constipation-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical constipation with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides diet, fluid, and lifestyle self-care measures, with pharmacist-recommended laxatives if needed.",
        redFlag: false,
        keywords: ["typical constipation"],
        careAdviceIds: ["oscg-constipation-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-constipation-emergency-advice", titleEn: "Emergency abdominal precautions", instructionTextEn: "Call Qatar 999 now, do not allow self-driving, and give no laxative, enema, food, or drink when obstruction, severe illness, or unsafe swallowing is possible. Follow the call-handler's instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain, distension, vomiting, bleeding, collapse, or confusion"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-constipation-routine-advice", titleEn: "Routine constipation follow-up", instructionTextEn: "Book a GP appointment to investigate persistent constipation or associated symptoms.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["blood in stool increases", "pain worsens"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true },
      { id: "oscg-constipation-selfcare-advice", titleEn: "Low-risk constipation care", instructionTextEn: "Maintain normal fluids, gradually increase fibre only if obstruction is not suspected, stay active, and use a regular unhurried toilet routine. A pharmacist or clinician must choose any laxative for age, pregnancy, breastfeeding, kidney or heart disease, interactions, and duration; do not use repeated enemas or adult products in children without instruction.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain, distension, vomiting, inability to pass gas, blood, fever, poor intake, or failure to improve"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-10-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Constipation\", https://www.nhs.uk/conditions/constipation/ (page last reviewed 26 October 2023)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Obstruction criteria are a safety synthesis. Qatar neonatal, pediatric, pregnancy/postpartum, frailty, neurologic, medicine and bowel-cancer pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Acne - https://www.nhs.uk/conditions/acne/ (reviewed 2023-01-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-acne",
    titleEn: "Acne",
    clinicalDefinitionEn: "Acne assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "acne", weight: 100 },
      { phrase: "spots on face", weight: 80 },
      { phrase: "pimples", weight: 75 },
      { phrase: "breakouts", weight: 70 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-acne-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the acne been present?" },
      { id: "oscg-acne-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Have any pharmacy treatments been tried?" },
      { id: "oscg-acne-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is it affecting mood or self-esteem?" }
    ],
    questions: [
      {
        id: "oscg-acne-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe facial or eye swelling affecting vision or breathing, rapidly spreading painful redness with fever or severe illness, blistering or skin peeling after medicine, or current suicidal intent, plan, or inability to stay safe?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the acne guidance itself - acne is never itself an emergency, but a severe secondary infection would need urgent care.",
        redFlag: true,
        keywords: ["life threatening"],
        careAdviceIds: ["oscg-acne-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-acne-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have pharmacy treatments failed, is acne nodular, cystic, scarring, or significantly affecting mood, or is there pregnancy or pregnancy possibility, immune suppression, endocrine symptoms, or concern about prescribed isotretinoin or another medicine?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP if pharmacy treatments aren't working, acne is affecting wellbeing, or it's moderate/severe - proper treatment for nodules/cysts avoids scarring.",
        redFlag: false,
        keywords: ["acne not improving", "severe acne", "acne affecting mood"],
        careAdviceIds: ["oscg-acne-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-acne-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild acne that hasn't been treated yet?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends a pharmacist first for mild acne.",
        redFlag: false,
        keywords: ["mild acne", "untreated acne"],
        careAdviceIds: ["oscg-acne-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-acne-emergency-advice", titleEn: "Emergency skin or mental-health precautions", instructionTextEn: "Call Qatar 999 now for airway, severe skin-reaction, sepsis, or immediate suicide risk. Keep the patient with a safe trusted person and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing or vision change, spreading blistering or infection, confusion, or escalating self-harm risk"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-acne-routine-advice", titleEn: "Routine acne follow-up", instructionTextEn: "Book a GP appointment - moderate to severe acne needs proper treatment to avoid scarring.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["acne worsens", "significant impact on wellbeing"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-acne-selfcare-advice", titleEn: "Pharmacy care for mild acne", instructionTextEn: "Use gentle cleansing and do not pick or squeeze lesions. A pharmacist must confirm treatment for age, pregnancy or pregnancy possibility, breastfeeding, skin sensitivity, and other medicines. Do not use another person's antibiotics, retinoids, or isotretinoin.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["scarring, nodules, worsening infection, mood decline, or failure to improve"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Acne\", https://www.nhs.uk/conditions/acne/ (page last reviewed 03 January 2023)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Qatar dermatology, pregnancy-prevention, isotretinoin, adolescent confidentiality, mental-health, and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Athlete's Foot - https://www.nhs.uk/conditions/athletes-foot/ (reviewed 2024-04-29)
  // ------------------------------------------------------------------
  {
    id: "oscg-athletes-foot",
    titleEn: "Athlete's Foot",
    clinicalDefinitionEn: "Athlete's foot assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "athletes foot", weight: 100 },
      { phrase: "itchy feet", weight: 75 },
      { phrase: "peeling skin between toes", weight: 85 },
      { phrase: "fungal foot infection", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-athletesfoot-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has this been present?" },
      { id: "oscg-athletesfoot-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has a pharmacy treatment already been tried?" },
      { id: "oscg-athletesfoot-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the caller have diabetes?" }
    ],
    questions: [
      {
        id: "oscg-athletesfoot-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the foot or leg rapidly becoming hot, painful, swollen or red, is there fever, pus, ulceration, black skin, red streaking, severe pain, or is the patient diabetic, poorly perfused, pregnant, immunocompromised, or a young child?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to see a doctor promptly - could indicate a serious infection, and foot problems are more serious with diabetes.",
        redFlag: false,
        keywords: ["hot painful red foot", "spreading fungal infection", "diabetes foot infection"],
        careAdviceIds: ["oscg-athletesfoot-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-athletesfoot-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have pharmacy treatments not worked, or is there significant pain?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a doctor if pharmacy treatments don't work or there's a lot of pain.",
        redFlag: false,
        keywords: ["pharmacy treatment not working"],
        careAdviceIds: ["oscg-athletesfoot-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-athletesfoot-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a typical, uncomplicated case with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends a pharmacist first for athlete's foot.",
        redFlag: false,
        keywords: ["typical athletes foot"],
        careAdviceIds: ["oscg-athletesfoot-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-athletesfoot-urgent-advice", titleEn: "Prompt in-person foot assessment", instructionTextEn: "Use the Qatar governance-approved in-person service, particularly for diabetes, poor circulation, immune suppression, pregnancy, children, ulcers, or bacterial infection signs. Do not use steroid-combination or leftover antifungal/antibiotic products without clinician or pharmacist confirmation.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness, fever, ulcer, black skin, numbness, or severe pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-athletesfoot-routine-advice", titleEn: "Routine athlete's foot follow-up", instructionTextEn: "Book a GP appointment if pharmacy treatment hasn't worked.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["worsening pain or spreading"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-athletesfoot-selfcare-advice", titleEn: "Pharmacy self-care for athlete's foot", instructionTextEn: "A pharmacist can recommend creams, sprays, or powders. Dry feet thoroughly (especially between toes), use separate towels, wear clean cotton socks daily, and avoid scratching, walking barefoot in public areas, or sharing footwear/towels.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with treatment", "spreading or worsening"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-29", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Athlete's foot\", https://www.nhs.uk/conditions/athletes-foot/ (page last reviewed 29 April 2024)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Qatar diabetic-foot, vascular, immunocompromise, pregnancy, pediatric, infection, and medicine pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. COVID-19 - Diagnosed or Suspected - https://www.nhs.uk/conditions/covid-19/covid-19-symptoms-and-what-to-do/ (reviewed 2023-03-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-covid19",
    titleEn: "COVID-19 - Diagnosed or Suspected",
    clinicalDefinitionEn: "COVID-19 symptom assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "covid", weight: 100 },
      { phrase: "coronavirus", weight: 90 },
      { phrase: "positive covid test", weight: 90 },
      { phrase: "covid symptoms", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-covid-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Has there been a positive COVID-19 test?" },
      { id: "oscg-covid-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-covid-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe breathing, chest pain, alertness, fluid intake and urine, fever, oxygen saturation if already measured, and the main symptoms." },
      { id: "oscg-covid-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy/postpartum, immune suppression, obesity, heart/lung/kidney disease, diabetes, vaccination, symptom-onset date, and safeguarding or safe-isolation limitations." }
    ],
    questions: [
      {
        id: "oscg-covid-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Does the person seem very unwell or getting worse, have sudden chest pain, is so breathless they can't say short sentences at rest, are they coughing up blood, or have they collapsed, fainted, or had a first-time seizure, or developed a non-fading rash?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK COVID-19 guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["very unwell covid", "severe breathlessness", "coughing up blood", "collapsed"],
        careAdviceIds: ["oscg-covid-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-covid-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is there worsening breathlessness, persistent fever or dehydration, oxygen saturation below the locally approved threshold, or is the patient an infant, pregnant/postpartum, older/frail, immunocompromised, or living with significant chronic disease?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Higher-risk patients and worsening respiratory or hydration symptoms need prompt assessment, including eligibility for time-sensitive treatment under current Qatar policy.",
        redFlag: false,
        keywords: ["high risk covid", "pregnant covid", "worsening covid breathing"],
        careAdviceIds: ["oscg-covid-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-covid-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are symptoms mild and improving in an otherwise low-risk older child or adult, with normal breathing, hydration and alertness, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends rest, fluids, and simple pain relief for mild COVID-19, with isolation guidance to protect others.",
        redFlag: false,
        keywords: ["mild covid symptoms"],
        careAdviceIds: ["oscg-covid-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-covid-emergency-advice", titleEn: "Emergency respiratory precautions", instructionTextEn: "Call Qatar 999 now, help the person sit in the easiest breathing position, use a mask only if tolerated and it does not impede breathing, and do not allow self-driving. Follow the call-handler's instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing, blue/grey colour, collapse, confusion, or loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-covid-urgent-advice", titleEn: "Prompt Qatar COVID-19 assessment", instructionTextEn: "Use the current Qatar governance-approved in-person or telehealth pathway. Confirm current testing, isolation, antiviral eligibility, oxygen thresholds, pregnancy, pediatric and immunocompromise policy; this UAT protocol must not hard-code changing public-health rules.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing worsens, oxygen falls, chest pain, confusion, poor intake, reduced urine, or collapse"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-covid-selfcare-advice", titleEn: "Home care for mild COVID-19", instructionTextEn: "Rest, drink plenty of water, take paracetamol or ibuprofen if uncomfortable, and try honey for cough (not for babies under 12 months). Stay away from others per local isolation guidance. Avoid lying flat while coughing.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["breathing difficulty develops", "symptoms significantly worsen"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-03-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"COVID-19 symptoms and what to do\", https://www.nhs.uk/conditions/covid-19/covid-19-symptoms-and-what-to-do/ (page last reviewed 21 March 2023)"],
      contentNotice: "UAT-only adaptation with age, pregnancy/postpartum, immunocompromise, comorbidity, dehydration, oxygen, safeguarding, and time-sensitive treatment controls. Current Qatar testing, isolation, antiviral, mask, oxygen-threshold, and service-routing policy remains GOVERNANCE_REQUIRED because it changes over time. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  }
];
