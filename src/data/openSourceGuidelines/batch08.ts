import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 08 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Jock Itch generalizes the Athlete's Foot source (both are
 * dermatophyte/tinea fungal infections with identical management - documented
 * explicitly, not silently assumed). Itching - Localized and Itching -
 * Widespread share the same "Itchy skin" source, split by the source's own
 * "is it all over your body" criterion. Eye - Pus or Discharge reuses the
 * Conjunctivitis source already cited for Eye - Allergy in batch07.
 */
export const batch08Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Altitude Sickness - https://www.nhs.uk/conditions/altitude-sickness/ (reviewed 2023-07-31)
  // ------------------------------------------------------------------
  {
    id: "oscg-altitude-sickness",
    titleEn: "Altitude Sickness",
    clinicalDefinitionEn: "Safety-first assessment of illness after ascent to altitude, distinguishing acute mountain sickness from suspected high-altitude cerebral oedema (HACE), high-altitude pulmonary oedema (HAPE), and other emergencies.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "altitude sickness", weight: 100 },
      { phrase: "mountain sickness", weight: 90 },
      { phrase: "high altitude", weight: 80 },
      { phrase: "feel sick at altitude", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-altitude-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the current and sleeping altitude, how quickly was it reached, when did symptoms begin relative to ascent, and is a lower safe altitude reachable now?" },
      { id: "oscg-altitude-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there confusion, unusual behaviour, severe drowsiness, inability to walk a straight line, loss of coordination, collapse, seizure, or reduced responsiveness?" },
      { id: "oscg-altitude-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there breathlessness at rest, marked breathing difficulty, chest congestion, worsening cough, frothy or bloody sputum, blue or grey colour, or a major fall in exercise ability?" },
      { id: "oscg-altitude-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, heart or lung disease, sickle-cell disease, medicines or substances, possible injury, fever, carbon-monoxide exposure, and glucose if immediately available without delaying rescue." },
      { id: "oscg-altitude-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "What communication, trained companions, oxygen, shelter, weather protection, evacuation, and professional rescue resources are actually available? Do not delay descent or rescue to obtain equipment." }
    ],
    questions: [
      {
        id: "oscg-altitude-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there suspected HACE or HAPE: confusion or abnormal behaviour, inability to walk normally, loss of coordination, severe drowsiness, collapse, seizure or reduced responsiveness; or breathlessness at rest, respiratory distress, chest congestion, worsening cough, frothy or bloody sputum, blue/grey colour, or rapidly declining exercise ability?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "HACE and HAPE are life-threatening. Descent is the definitive field action and oxygen is an important adjunct when genuinely available, but neither remote equipment nor medication replaces professional rescue and evacuation.",
        redFlag: true,
        keywords: ["confused at altitude", "breathless at rest altitude", "coughing blood altitude"],
        careAdviceIds: ["oscg-altitude-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-altitude-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Are symptoms limited to headache with nausea, dizziness, fatigue, or poor sleep after recent ascent, with normal breathing at rest, normal walking and thinking, no concerning alternative cause, and a reliable companion, communication, and descent plan?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Possible mild acute mountain sickness must not ascend higher. Worsening or failure to improve requires descent; unreliable observation, communication, or descent access lowers the threshold for rescue advice.",
        redFlag: false,
        keywords: ["mild altitude sickness", "headache at altitude"],
        careAdviceIds: ["oscg-altitude-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-altitude-emergency-advice", titleEn: "Emergency HACE/HAPE precautions", instructionTextEn: "Activate professional rescue immediately: call Qatar 999 if in Qatar, or the local emergency or mountain-rescue number when abroad. Begin assisted descent to a substantially lower safe altitude as soon as conditions permit; never leave the patient alone or make them walk if weak, breathless, confused, or uncoordinated. Minimize exertion, protect from cold, do not allow driving, and give supplemental oxygen only if available and operated by someone trained. Oxygen, a portable hyperbaric chamber, or previously prescribed expedition medicine must not delay descent or evacuation. If weather or terrain prevents descent, tell rescuers immediately and use only trained, available measures while awaiting rescue.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion, inability to walk, seizure, or reduced responsiveness", "increasing breathlessness, blue/grey colour, or frothy/bloody cough"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-altitude-selfcare-advice", titleEn: "Monitored care for possible mild altitude illness", instructionTextEn: "Stop ascent and do not sleep higher. Rest with a reliable companion, avoid exertion, alcohol, sedatives, and opioids, and drink normally without forcing excess water. If symptoms worsen or do not clearly improve at the same altitude, descend with assistance and seek the governance-approved medical service. Do not rely on small recreational oxygen cans or start prescription altitude medicines unless they were prescribed for this patient with clear instructions.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["confusion, abnormal walking, severe drowsiness, collapse, or seizure", "breathlessness at rest, worsening cough, chest congestion, blue/grey colour, or failure to improve"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-31", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Altitude sickness\", https://www.nhs.uk/conditions/altitude-sickness/ (page last reviewed 31 July 2023)",
        "US CDC Yellow Book 2026, \"High-Altitude Travel and Altitude Illness\", https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/high-altitude-travel-and-altitude-illness.html (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis for altitude illness, including HACE/HAPE, descent, oxygen, remote rescue, and alternative-diagnosis controls. Qatar 999 applies only when in Qatar; travelers abroad must use the local emergency or mountain-rescue system. Medication, oxygen, evacuation, and exact non-emergency routing require trained clinicians and local governance. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Hoarseness - https://www.nhs.uk/conditions/laryngitis/ (reviewed 2024-01-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-hoarseness",
    titleEn: "Hoarseness",
    clinicalDefinitionEn: "Safety-first assessment of hoarseness or suspected laryngitis in children and adults, excluding acute upper-airway obstruction and identifying infection, immunocompromise, and possible malignancy red flags.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "hoarse voice", weight: 100 },
      { phrase: "hoarseness", weight: 100 },
      { phrase: "lost my voice", weight: 90 },
      { phrase: "laryngitis", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hoarse-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Record age, onset and duration, recent choking or inhaled foreign body, infection or intubation, recurrent episodes, smoking or vaping, occupational voice use, and previous head, neck, or chest cancer." },
      { id: "oscg-hoarse-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there noisy breathing or stridor, chest or neck pulling in, pauses in breathing, blue colour, inability to speak or drink, drooling or inability to swallow saliva, tripod posture, severe drowsiness, or rapid worsening?" },
      { id: "oscg-hoarse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there severe throat pain, neck swelling, high fever or severe illness, blood when coughing, dehydration, immune suppression, or recent chemotherapy?" },
      { id: "oscg-hoarse-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is hoarseness persistent or unexplained, especially in an adult aged 45 or older, or accompanied by a neck lump, progressive swallowing pain, unexplained weight loss, or smoking history?" }
    ],
    questions: [
      {
        id: "oscg-hoarse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there difficulty breathing, stridor at rest, chest or neck pulling in, pauses in breathing, blue/grey colour, inability to speak or drink, drooling or inability to swallow saliva, tripod posture, reduced responsiveness, or rapid worsening, especially in a child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are possible upper-airway-obstruction signs. Children have smaller airways and can deteriorate rapidly; drooling and inability to swallow saliva can indicate a serious airway infection or obstruction.",
        redFlag: true,
        keywords: ["difficulty breathing hoarse voice", "stridor child", "drooling cannot swallow", "blue child hoarse"],
        careAdviceIds: ["oscg-hoarse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hoarse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency airway feature, is there severe throat pain, swallowing difficulty, neck swelling, high fever or severe illness, dehydration, coughing blood, immune suppression, recent chemotherapy, or sudden hoarseness after choking or possible inhaled foreign body?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "These features require prompt direct assessment for serious infection, deep-neck disease, foreign body, bleeding, or complications in an immunocompromised patient. The exact Qatar service and timeframe are governance-required.",
        redFlag: false,
        keywords: ["painful hoarse voice", "difficulty swallowing hoarse"],
        careAdviceIds: ["oscg-hoarse-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hoarse-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is hoarseness persistent, recurrent, or unexplained, particularly in a person aged 45 or older, or associated with a neck lump, progressive swallowing pain, unexplained weight loss, smoking or vaping, or previous head, neck, or chest cancer?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "Persistent or unexplained hoarseness needs examination. NICE advises consideration of a suspected-cancer pathway for persistent unexplained hoarseness or an unexplained neck lump in people aged 45 and over; Qatar referral criteria require local governance.",
        redFlag: false,
        keywords: ["hoarse voice not improving", "recurring laryngitis"],
        careAdviceIds: ["oscg-hoarse-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-hoarse-q3-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this recent mild hoarseness in a patient who is otherwise well, drinking normally, breathing quietly, with no drooling, stridor, severe pain, immune suppression, cancer red flag, or other feature above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: laryngitis usually resolves within 1-2 weeks, often worse in the first 3 days.",
        redFlag: false,
        keywords: ["recent hoarseness"],
        careAdviceIds: ["oscg-hoarse-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hoarse-emergency-advice", titleEn: "Emergency upper-airway precautions", instructionTextEn: "Call Qatar 999 now. Keep the patient calm and in the position that makes breathing easiest; do not force them to lie down, inspect the throat, or give food, drink, tablets, or steam. Do not allow self-driving. Follow the call-handler's airway and resuscitation instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["increasing stridor, chest or neck recession, drooling, blue/grey colour, exhaustion, or reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hoarse-urgent-advice", titleEn: "Prompt in-person hoarseness assessment", instructionTextEn: "Use the Qatar governance-approved in-person service and timeframe. Keep the patient calm and do not attempt throat examination or use steam inhalation. If swallowing is comfortable, offer normal cool fluids; escalate immediately for stridor, drooling, breathing difficulty, inability to drink, blue colour, or drowsiness.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["stridor, drooling, breathing difficulty, inability to swallow, blue/grey colour, or drowsiness", "worsening fever, neck swelling, dehydration, or coughing blood"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hoarse-routine-advice", titleEn: "Persistent-hoarseness assessment", instructionTextEn: "Use the Qatar governance-approved primary-care or ENT pathway; this UAT protocol does not assign a definitive cancer diagnosis or exact referral timeframe. Persistent unexplained hoarseness, a neck lump, progressive swallowing symptoms, weight loss, smoking history, or previous cancer requires documented clinical examination and referral consideration.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new breathing or swallowing difficulty", "neck swelling, blood, weight loss, or worsening symptoms"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-hoarse-selfcare-advice", titleEn: "Home care for strictly low-risk hoarseness", instructionTextEn: "Rest the voice, speak gently rather than whispering or shouting, take normal fluids, and avoid smoking, vaping, smoke, dust, and excess alcohol. Do not use bowls or kettles of steam because of burn risk. Confirm medicines and age restrictions with a pharmacist.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["stridor, drooling, breathing or swallowing difficulty, fever with severe illness, or dehydration", "persistent, recurrent, or unexplained symptoms, neck lump, blood, or weight loss"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Laryngitis\", https://www.nhs.uk/conditions/laryngitis/ (page last reviewed 17 January 2024)",
        "Cambridge University Hospitals NHS Foundation Trust, \"Children's croup and stridor\", https://www.cuh.nhs.uk/patient-information/childrens-croup-and-stridor/ (accessed 25 July 2026)",
        "NICE NG12, \"Suspected cancer: recognition and referral\", https://www.nice.org.uk/guidance/ng12/chapter/recommendations-organised-by-site-of-cancer (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis for hoarseness and laryngitis. It adds pediatric airway, stridor, drooling, foreign-body, immunocompromise, and cancer-warning controls. Exact Qatar urgent, primary-care, ENT, and suspected-cancer routing requires local governance approval. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Impetigo (Infected Sore) - https://www.nhs.uk/conditions/impetigo/ (reviewed 2024-06-06)
  // ------------------------------------------------------------------
  {
    id: "oscg-impetigo",
    titleEn: "Impetigo (Infected Sore)",
    clinicalDefinitionEn: "Impetigo assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "impetigo", weight: 100 },
      { phrase: "crusty sores", weight: 85 },
      { phrase: "infected sore skin", weight: 85 },
      { phrase: "honey colored crust", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-impetigo-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where are the sores?" },
      { id: "oscg-impetigo-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long have they been present?" },
      { id: "oscg-impetigo-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has this happened before in the last year?" }
    ],
    questions: [
      {
        id: "oscg-impetigo-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there confusion, collapse, abnormal breathing, pale/blue/mottled skin, rapidly spreading painful redness, blistering or skin loss, severe pain, swelling near the eye or airway, or a newborn or infant who is feverish or very unwell?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the impetigo guidance itself - impetigo itself is rarely an emergency, but a severe, spreading skin infection with systemic illness needs urgent care.",
        redFlag: true,
        keywords: ["life threatening"],
        careAdviceIds: ["oscg-impetigo-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-impetigo-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn:
          "Without an emergency feature, is the patient under 1 year, pregnant or breastfeeding with breast lesions, diabetic or immunocompromised, are lesions near the eye, widespread, recurrent, worsening, or not responding, or is there a safeguarding concern?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons for clinical review rather than pharmacist self-care. Impetigo is very infectious; the Qatar attendance route must be approved by clinical governance before use (GOVERNANCE_REQUIRED).",
        redFlag: false,
        keywords: ["baby with impetigo", "recurring impetigo", "impetigo treatment not working"],
        careAdviceIds: ["oscg-impetigo-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-impetigo-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a straightforward case (child 12+ months, no breastfeeding sores, no weakened immune system) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance supports pharmacist assessment and treatment for straightforward impetigo; the applicable Qatar service route requires clinical-governance approval (GOVERNANCE_REQUIRED).",
        redFlag: false,
        keywords: ["straightforward impetigo"],
        careAdviceIds: ["oscg-impetigo-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-impetigo-emergency-advice", titleEn: "Emergency skin-infection precautions", instructionTextEn: "Call Qatar 999 now, do not allow self-driving, and do not squeeze, pierce, or apply caustic products. Follow the call-handler's instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["confusion, collapse, breathing change, severe pain, blistering, or rapidly spreading infection"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-impetigo-routine-advice", titleEn: "Governance-approved impetigo review", instructionTextEn: "Use the Qatar governance-approved in-person pathway and call ahead for infection-control advice. Infant, pregnancy, breastfeeding, immune, diabetes, eye-area, medicine, and safeguarding decisions require clinician review.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["worsening symptoms, fever, eye swelling, pain, or rapid spread"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-impetigo-selfcare-advice", titleEn: "Pharmacy self-care for impetigo", instructionTextEn: "A pharmacist may assess and treat straightforward impetigo where permitted; the applicable Qatar service route requires clinical-governance approval (GOVERNANCE_REQUIRED). Wash affected areas with soap and water, wash hands frequently (especially before/after applying cream), and wash bedding/towels at high temperature. Do not touch or scratch sores. Stay away from work, school, or nursery until no longer contagious (48 hours after starting treatment, or once patches dry and crust over without treatment). Don't share towels or prepare food for others.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with treatment", "spreading or worsening"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-06-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Impetigo\", https://www.nhs.uk/conditions/impetigo/ (page last reviewed 06 June 2024)"],
      contentNotice: "UAT-only adaptation with sepsis, severe skin infection, eye/airway, infant, pregnancy, breastfeeding, diabetes, immunocompromise, infection-control, medicine, and safeguarding controls. Exact Qatar routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Immunization Reactions - anaphylaxis criteria (batch01) + https://www.nhs.uk/vaccinations/flu-vaccine/ (reviewed 2023-11-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-immunization-reactions",
    titleEn: "Immunization Reactions",
    clinicalDefinitionEn: "Post-vaccination reaction assessment decomposed from NHS.UK's published vaccine side-effect and anaphylaxis guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "vaccine reaction", weight: 100 },
      { phrase: "vaccination side effect", weight: 90 },
      { phrase: "shot reaction", weight: 80 },
      { phrase: "sore arm after vaccine", weight: 85 },
      { phrase: "flu shot", weight: 90 },
      { phrase: "sore after shot", weight: 95 },
      { phrase: "arm is sore with a mild fever", weight: 100 },
      { phrase: "fever after vaccine", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-vaccine-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Which vaccine, and when was it given?" },
      { id: "oscg-vaccine-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured?" },
      { id: "oscg-vaccine-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe the reaction, onset, breathing, alertness, rash, fever, hydration, neurologic symptoms, and injection-site changes." },
      { id: "oscg-vaccine-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, immune suppression, allergy history, vaccine and batch if available, medicines, and whether symptoms could be unrelated acute illness." }
    ],
    questions: [
      {
        id: "oscg-vaccine-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there facial, mouth, throat or tongue swelling, breathing difficulty, wheeze, collapse, reduced responsiveness, blue/grey colour, seizure, severe confusion, non-blanching rash with illness, or other rapidly progressive reaction?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK vaccine guidance: serious allergic reaction (anaphylaxis) to a vaccine is very rare but requires an immediate 999 call and adrenaline auto-injector if available.",
        redFlag: true,
        keywords: ["swollen throat after vaccine", "struggling to breathe after shot"],
        careAdviceIds: ["oscg-vaccine-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-vaccine-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is there pain or soreness at the injection site, a slightly raised temperature, or an aching body, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: the most common vaccine side effects are mild and get better within 1-2 days.",
        redFlag: false,
        keywords: ["sore injection site", "mild fever after vaccine", "achy after vaccine"],
        careAdviceIds: ["oscg-vaccine-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vaccine-emergency-advice", titleEn: "Emergency post-vaccination precautions", instructionTextEn: "Call Qatar 999 now. Use the patient's prescribed adrenaline auto-injector immediately for suspected anaphylaxis and follow its plan; do not delay the call. Position according to breathing and consciousness, do not allow standing or driving, and follow call-handler instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing, swelling, collapse, seizure, or consciousness worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vaccine-selfcare-advice", titleEn: "Low-risk expected vaccine reaction care", instructionTextEn: "Rest, take normal fluids, and use a wrapped cool compress at the injection site. A pharmacist or clinician must confirm fever or pain medicine for age, weight, pregnancy, medical history, and doses already taken. Do not assume persistent or worsening illness is vaccine-related.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["breathing or swelling changes, seizure, severe illness, dehydration, persistent fever, or worsening injection-site redness"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-11-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Flu vaccine\" (side effects section), https://www.nhs.uk/vaccinations/flu-vaccine/ (page last reviewed 23 November 2023)"],
      contentNotice: "UAT-only vaccine-reaction generalization with anaphylaxis, neurologic, sepsis mimic, age, pregnancy, immunocompromise, medicine, and product-documentation controls. Exact Qatar vaccine, adverse-event reporting, and non-emergency routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Jock Itch - https://www.nhs.uk/conditions/athletes-foot/ (reviewed 2024-04-29), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-jock-itch",
    titleEn: "Jock Itch",
    clinicalDefinitionEn: "Jock itch (tinea cruris) assessment decomposed from NHS.UK's published athlete's foot guidance, generalized to the groin.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "jock itch", weight: 100 },
      { phrase: "groin fungal infection", weight: 85 },
      { phrase: "itchy groin rash", weight: 90 },
      { phrase: "tinea cruris", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-jockitch-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has this been present?" },
      { id: "oscg-jockitch-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has a pharmacy treatment already been tried?" },
      { id: "oscg-jockitch-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the caller have diabetes?" }
    ],
    questions: [
      {
        id: "oscg-jockitch-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin hot, painful, and red, has the infection spread to other areas, does the caller have diabetes, or a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance for tinea (fungal skin) infections lists these as reasons to see a doctor promptly - could indicate a serious infection, and skin infections are more serious with diabetes.",
        redFlag: false,
        keywords: ["hot painful red groin", "spreading fungal infection", "diabetes skin infection"],
        careAdviceIds: ["oscg-jockitch-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-jockitch-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have pharmacy treatments not worked, or is there significant discomfort?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a doctor if pharmacy treatments don't work or there's a lot of discomfort.",
        redFlag: false,
        keywords: ["pharmacy treatment not working jock itch"],
        careAdviceIds: ["oscg-jockitch-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-jockitch-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a typical, uncomplicated case with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends a pharmacist first for tinea/fungal skin infections.",
        redFlag: false,
        keywords: ["typical jock itch"],
        careAdviceIds: ["oscg-jockitch-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-jockitch-urgent-advice", titleEn: "Urgent skin infection review", instructionTextEn: "Arrange prompt medical review, especially with diabetes or a weakened immune system.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-jockitch-routine-advice", titleEn: "Routine jock itch follow-up", instructionTextEn: "Book a GP appointment if pharmacy treatment hasn't worked.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["worsening or spreading"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-jockitch-selfcare-advice", titleEn: "Pharmacy self-care for jock itch", instructionTextEn: "A pharmacist can recommend antifungal creams, sprays, or powders. Dry the area thoroughly after washing, wear loose cotton underwear, and avoid sharing towels.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with treatment", "spreading or worsening"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-29", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Athlete's foot\", https://www.nhs.uk/conditions/athletes-foot/ (page last reviewed 29 April 2024) - generalized: jock itch (tinea cruris) and athlete's foot (tinea pedis) are the same class of dermatophyte fungal infection with identical management"],
      contentNotice: "SOURCE-ONLY UAT generalization; no generated variant exists in the current 504-protocol catalog. Genital differential diagnosis, STI, adolescent privacy, consent, pregnancy, diabetes, immunocompromise, medication and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Itching - Widespread - https://www.nhs.uk/conditions/itchy-skin/ (reviewed 2023-07-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-itching-widespread",
    titleEn: "Itching - Widespread",
    clinicalDefinitionEn: "Widespread itchy skin assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "itchy all over", weight: 100 },
      { phrase: "widespread itching", weight: 95 },
      { phrase: "itchy whole body", weight: 90 },
      { phrase: "itching everywhere", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-itchwide-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the itching lasted?" },
      { id: "oscg-itchwide-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any new rash, lump, or swelling?" },
      { id: "oscg-itchwide-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the caller pregnant?" }
    ],
    questions: [
      {
        id: "oscg-itchwide-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden swelling of the lips, mouth, throat, or tongue, or difficulty breathing along with the itching?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the itchy skin guidance itself - widespread itching with airway swelling suggests a severe allergic reaction requiring immediate care.",
        redFlag: true,
        keywords: ["swollen throat with itching", "breathing difficulty with itching"],
        careAdviceIds: ["oscg-itchwide-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-itchwide-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is the itching affecting daily life, not improving with self-care or keeps coming back, caused by a new rash/lump/swelling, severe, or happening during pregnancy?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these, plus itching that is all over the body, as reasons to see a GP.",
        redFlag: false,
        keywords: ["itching affecting daily life", "severe widespread itching", "itching in pregnancy"],
        careAdviceIds: ["oscg-itchwide-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-itchwide-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild widespread itching with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides self-care advice and pharmacist support for mild itchy skin.",
        redFlag: false,
        keywords: ["mild widespread itching"],
        careAdviceIds: ["oscg-itchwide-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-itchwide-emergency-advice", titleEn: "Qatar emergency allergic-reaction precautions", instructionTextEn: "Call Qatar emergency services on 999 now. If anaphylaxis is suspected, use the person's prescribed adrenaline auto-injector immediately according to their plan and follow the call-taker's instructions. Do not allow standing, walking, or self-driving; use emergency ambulance transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after prescribed adrenaline", "loss of consciousness", "worsening breathing or throat/tongue swelling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-itchwide-routine-advice", titleEn: "Routine itching follow-up", instructionTextEn: "Book a GP appointment - a pharmacist can also advise on self-care and whether GP review is needed.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "new rash or swelling develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-itchwide-selfcare-advice", titleEn: "Home care for itchy skin", instructionTextEn: "Pat or tap the skin instead of scratching, use an unperfumed moisturiser regularly, take cool or lukewarm baths/showers, wear loose cotton or silk clothing, and keep nails clean and short. Avoid tight clothes, wool or synthetic fabrics, long baths/showers, and perfumed products.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with self-care", "keeps coming back", "becomes severe"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Itchy skin\", https://www.nhs.uk/conditions/itchy-skin/ (page last reviewed 19 July 2023)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Pregnancy cholestasis, systemic disease, infant/child, immunocompromise, medicine reaction and safeguarding routes remain GOVERNANCE_REQUIRED. Airway or systemic allergic features require Qatar 999. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Itching - Localized - https://www.nhs.uk/conditions/itchy-skin/ (reviewed 2023-07-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-itching-localized",
    titleEn: "Itching - Localized",
    clinicalDefinitionEn: "Localized itchy skin assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "itchy patch", weight: 100 },
      { phrase: "localized itching", weight: 95 },
      { phrase: "itchy spot on skin", weight: 85 },
      { phrase: "one itchy area", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-itchlocal-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the itching?" },
      { id: "oscg-itchlocal-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it lasted?" },
      { id: "oscg-itchlocal-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any new rash, lump, or swelling at the site?" }
    ],
    questions: [
      {
        id: "oscg-itchlocal-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Is the itching affecting daily life, not improving with self-care or keeps coming back, or caused by a new rash, lump, or swelling?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons to see a GP for itchy skin.",
        redFlag: false,
        keywords: ["persistent localized itching", "itchy lump or rash"],
        careAdviceIds: ["oscg-itchlocal-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-itchlocal-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a mild, localized itchy patch with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides self-care advice and pharmacist support for mild itchy skin.",
        redFlag: false,
        keywords: ["mild localized itching"],
        careAdviceIds: ["oscg-itchlocal-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-itchlocal-routine-advice", titleEn: "Routine itching follow-up", instructionTextEn: "Book a GP appointment - a pharmacist can also advise on self-care and whether GP review is needed.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "new rash or swelling develops"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-itchlocal-selfcare-advice", titleEn: "Home care for a localized itchy patch", instructionTextEn: "Pat or tap the skin instead of scratching, apply an unperfumed moisturiser regularly, and keep nails clean and short. Avoid tight clothing or synthetic fabrics over the area and perfumed products.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with self-care", "spreads or worsens"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Itchy skin\", https://www.nhs.uk/conditions/itchy-skin/ (page last reviewed 19 July 2023)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Pregnancy, systemic disease, infant/child, immunocompromise, medication reaction, genital symptoms and safeguarding routes remain GOVERNANCE_REQUIRED. Any airway or systemic allergic feature requires emergency assessment. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Insect Bite (generic) - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-insect-bite-generic",
    titleEn: "Insect Bite",
    clinicalDefinitionEn: "General insect bite assessment (unknown insect) decomposed from NHS.UK's published insect bites and stings guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "insect bite", weight: 100 },
      { phrase: "bug bite", weight: 90 },
      { phrase: "got bitten by something", weight: 80 },
      { phrase: "bitten by a bug", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-insectbite-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where was the caller bitten?" },
      { id: "oscg-insectbite-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Do they know what bit them?" },
      { id: "oscg-insectbite-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any prior serious allergic reaction to insect bites?" }
    ],
    questions: [
      {
        id: "oscg-insectbite-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there swelling of the lips, mouth, throat or tongue, breathing difficulty, wheeze, collapse, reduced responsiveness, blue/grey colour, widespread hives with vomiting or dizziness, or a rapidly progressive reaction?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these as signs of a serious allergic reaction (anaphylaxis) requiring an immediate 999 call.",
        redFlag: true,
        keywords: ["swollen throat bite reaction", "struggling to breathe after bite"],
        careAdviceIds: ["oscg-insectbite-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-insectbite-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, are symptoms worsening, is the bite in the mouth, throat or near the eye, are there multiple bites, fever, abdominal pain, vomiting or dizziness, or is the patient an infant, pregnant, immunocompromised, or previously severely allergic?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or see a GP urgently.",
        redFlag: false,
        keywords: ["worsening bite symptoms", "multiple bites", "prior allergic reaction to bites"],
        careAdviceIds: ["oscg-insectbite-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-insectbite-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the skin around the bite hot, red, painful, swollen, or leaking pus or fluid (signs of infection)?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance flags these infection signs as needing a pharmacist or GP review.",
        redFlag: false,
        keywords: ["infected bite"],
        careAdviceIds: ["oscg-insectbite-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-insectbite-q3-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a single, minor bite with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor bites without infection or allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["minor single bite"],
        careAdviceIds: ["oscg-insectbite-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-insectbite-emergency-advice", titleEn: "Emergency insect-reaction precautions", instructionTextEn: "Call Qatar 999 now. Use the patient's prescribed adrenaline auto-injector immediately for suspected anaphylaxis and follow its plan. Do not allow standing, walking, or driving; position for breathing and consciousness and follow the call-handler.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing, swelling, vomiting, dizziness, collapse, or consciousness worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-insectbite-urgent-advice", titleEn: "Prompt in-person bite review", instructionTextEn: "Use the Qatar governance-approved in-person service. Remove a visible stinger by scraping if easy, wash the area, and use a wrapped cool pack. Do not squeeze venom sacs or use unverified remedies. Medication requires age, pregnancy and comorbidity checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling spreads, fever, vomiting, dizziness, severe pain, or breathing change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-insectbite-routine-advice", titleEn: "Routine bite follow-up", instructionTextEn: "Keep the area clean and book a routine review for signs of infection.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-insectbite-selfcare-advice", titleEn: "Care for a minor bite pending Qatar review", instructionTextEn: "Wash the area, avoid scratching, elevate it if comfortable, and use a cold pack wrapped in cloth for short periods; do not apply ice directly. Pain medicine, antihistamine, or topical steroid selection and dose require age, weight, pregnancy or breastfeeding status, allergies, comorbidities, sedation and interaction risk, skin integrity, and Qatar formulary approval. This UAT branch remains non-telemedicine pending governance.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling worsens", "signs of infection or allergic reaction develop", "facial swelling, breathing difficulty, dizziness, or rapid worsening"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "UAT-only generic bite/sting pathway with anaphylaxis, multiple/critical-site exposure, infection, infant, pregnancy, immunocompromise, medication and uncertain-species controls. Exact Qatar allergy and non-emergency routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Genital Injury - Male - https://www.nhs.uk/symptoms/testicle-pain/ (reviewed 2025-06-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-genital-injury-male",
    titleEn: "Genital Injury - Male",
    clinicalDefinitionEn: "Male genital injury / testicular pain assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "testicle injury", weight: 100 },
      { phrase: "groin injury male", weight: 85 },
      { phrase: "hit in the testicles", weight: 90 },
      { phrase: "testicular pain", weight: 95 },
      { phrase: "kicked in the groin", weight: 100 },
      { phrase: "kicked in the balls", weight: 100 },
      { phrase: "groin pain after injury", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-genitalmale-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the injury or pain start?" },
      { id: "oscg-genitalmale-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen, if any?" },
      { id: "oscg-genitalmale-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any nausea, vomiting, or abdominal pain along with it?" }
    ],
    questions: [
      {
        id: "oscg-genitalmale-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there sudden, severe testicle pain, testicle pain along with feeling or being sick or tummy pain, or has the pain lasted more than an hour or continued at rest?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance: go to A&E or call 999 for these features - possible testicular torsion, which needs rapid treatment to prevent permanent damage. Do not try to self-diagnose.",
        redFlag: true,
        keywords: ["sudden severe testicle pain", "testicle pain with vomiting", "prolonged testicle pain"],
        careAdviceIds: ["oscg-genitalmale-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-genitalmale-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there aching or discomfort the caller is worried about, a lump, swelling, a change in shape or texture, or one testicle noticeably larger than the other?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent GP/111 assessment for these features.",
        redFlag: false,
        keywords: ["testicle lump", "swollen testicle", "testicle size difference"],
        careAdviceIds: ["oscg-genitalmale-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-genitalmale-emergency-advice", titleEn: "Emergency testicular precautions", instructionTextEn: "Call Qatar 999 now and do not allow self-driving, eating or drinking. Do not manipulate, rotate, massage, or apply pressure to the testicle. Torsion is time-critical and cannot be excluded by telephone.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain, swelling, vomiting, faintness, bleeding, or colour change"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-genitalmale-urgent-advice", titleEn: "Prompt confidential genital assessment", instructionTextEn: "Use the Qatar governance-approved in-person urology or trauma pathway. Provide privacy for adolescents when safe; assess coercion, assault and unsafe caregivers without confrontation and follow local consent and safeguarding policy.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain becomes sudden or severe, nausea, vomiting, swelling, bleeding, urinary difficulty, or fever"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-06-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Testicle pain\", https://www.nhs.uk/symptoms/testicle-pain/ (page last reviewed 26 June 2025)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Qatar torsion, trauma, urology, adolescent privacy, consent, sexual assault and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Eye - Pus or Discharge - https://www.nhs.uk/conditions/conjunctivitis/ (reviewed 2024-04-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-pus-discharge",
    titleEn: "Eye - Pus or Discharge",
    clinicalDefinitionEn: "Eye discharge/pus assessment decomposed from NHS.UK's published conjunctivitis and eye injuries guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "eye discharge", weight: 100 },
      { phrase: "pus from eye", weight: 95 },
      { phrase: "eye is gunky", weight: 75 },
      { phrase: "eye crusted shut", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyepus-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has this lasted?" },
      { id: "oscg-eyepus-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "One eye or both?" },
      { id: "oscg-eyepus-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any pain or vision changes?" }
    ],
    questions: [
      {
        id: "oscg-eyepus-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there blood or pus coming from the eye along with severe pain, vision changes, or light sensitivity?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK eye injuries guidance lists blood or pus from the eye, alongside pain or vision changes, as a call-999/A&E criterion.",
        redFlag: true,
        keywords: ["blood or pus from eye", "eye discharge with vision changes"],
        careAdviceIds: ["oscg-eyepus-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyepus-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Without an emergency feature, is this a newborn or young infant, contact-lens wearer, immunocompromised patient, recent eye surgery or trauma, marked swelling, copious pus, possible STI exposure, or symptoms not improving?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK conjunctivitis guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["baby sticky eyes discharge", "eye discharge over a week"],
        careAdviceIds: ["oscg-eyepus-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-eyepus-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild discharge with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can advise on eyedrops for typical conjunctivitis discharge.",
        redFlag: false,
        keywords: ["mild eye discharge"],
        careAdviceIds: ["oscg-eyepus-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyepus-emergency-advice", titleEn: "Emergency eye precautions", instructionTextEn: "Call Qatar 999 now for vision-threatening or systemic emergency features and do not allow self-driving. Do not rub, patch, press, or use leftover drops; remove contact lenses only if easy and no penetrating injury is suspected.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision worsens, pain increases, eye movement changes, vomiting, or severe swelling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyepus-routine-advice", titleEn: "Prompt in-person eye-discharge review", instructionTextEn: "Use the Qatar governance-approved ophthalmology, neonatal, pediatric, or sexual-health pathway. Stop contact-lens wear. Do not share or use leftover antibiotic, steroid, anaesthetic, or redness-relief drops.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["pain, light sensitivity, vision change, fever, marked swelling, or worsening discharge"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-eyepus-selfcare-advice", titleEn: "Pharmacy self-care for mild eye discharge", instructionTextEn: "A pharmacist can recommend eyedrops. Gently clean the eye with cooled boiled water and a clean cloth, wiping from the inner to outer corner, using a fresh area of cloth for each wipe.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving within 7 days", "pain or vision changes develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Conjunctivitis\", https://www.nhs.uk/conditions/conjunctivitis/ (page last reviewed 23 April 2024)",
        "NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page last reviewed 12 March 2026)"
      ],
      contentNotice: "SOURCE-ONLY UAT adaptation; no generated variant exists in the current 504-protocol catalog. Neonatal infection, gonococcal or chlamydial disease, contact-lens keratitis, ocular herpes, trauma, chemical exposure, immunocompromise, medication and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  }
];
