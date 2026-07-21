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
    clinicalDefinitionEn: "Altitude sickness assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-altitude-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What altitude, and how quickly was it reached?" },
      { id: "oscg-altitude-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-altitude-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any confusion, breathlessness at rest, or coughing up blood/froth?" }
    ],
    questions: [
      {
        id: "oscg-altitude-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Does the person feel very unwell, confused, have problems with balance or coordination, hallucinations, shortness of breath even at rest, a cough with frothy or bloody spit, blue/grey/pale skin, or are they very sleepy or difficult to wake?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK altitude sickness guidance lists these as signs needing immediate medical help and descent of 300-1,000 metres.",
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
        questionTextEn: "Are symptoms mild-to-moderate (headache, nausea, fatigue) with none of the severe features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: rest at the current altitude without climbing higher - symptoms typically improve within 1-3 days; descend if not improving after 1 day.",
        redFlag: false,
        keywords: ["mild altitude sickness", "headache at altitude"],
        careAdviceIds: ["oscg-altitude-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-altitude-emergency-advice", titleEn: "Emergency altitude sickness precautions", instructionTextEn: "Descend 300-1,000 metres immediately if possible and arrange emergency medical help.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "breathing difficulty increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-altitude-selfcare-advice", titleEn: "Home care for mild altitude sickness", instructionTextEn: "Rest at the current altitude - do not climb higher. Stay hydrated, avoid alcohol. If not improving after 1 day, descend 300-1,000 metres.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after 1 day", "confusion or breathlessness at rest develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-31", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Altitude sickness\", https://www.nhs.uk/conditions/altitude-sickness/ (page last reviewed 31 July 2023)"],
      contentNotice: "Decomposed from NHS.UK's published altitude sickness guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Hoarseness - https://www.nhs.uk/conditions/laryngitis/ (reviewed 2024-01-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-hoarseness",
    titleEn: "Hoarseness",
    clinicalDefinitionEn: "Hoarse voice / laryngitis assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-hoarse-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the voice been hoarse?" },
      { id: "oscg-hoarse-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any difficulty swallowing or breathing?" },
      { id: "oscg-hoarse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does this keep recurring?" }
    ],
    questions: [
      {
        id: "oscg-hoarse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there difficulty breathing?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK laryngitis guidance: call 999 or go to A&E for difficulty breathing.",
        redFlag: true,
        keywords: ["difficulty breathing hoarse voice"],
        careAdviceIds: ["oscg-hoarse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hoarse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is it very painful, or is it difficult to swallow?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: contact 111 immediately for severe pain or difficulty swallowing.",
        redFlag: false,
        keywords: ["painful hoarse voice", "difficulty swallowing hoarse"],
        careAdviceIds: ["oscg-hoarse-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hoarse-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Have symptoms not improved after 2 weeks, or does laryngitis/voice problems keep recurring?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for symptoms lasting beyond 2 weeks or recurring.",
        redFlag: false,
        keywords: ["hoarse voice not improving", "recurring laryngitis"],
        careAdviceIds: ["oscg-hoarse-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-hoarse-q3-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this recent hoarseness of less than 2 weeks with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: laryngitis usually resolves within 1-2 weeks, often worse in the first 3 days.",
        redFlag: false,
        keywords: ["recent hoarseness"],
        careAdviceIds: ["oscg-hoarse-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hoarse-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the person calm and upright and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hoarse-urgent-advice", titleEn: "Urgent hoarseness review", instructionTextEn: "Arrange same-day medical review for severe pain or swallowing difficulty.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swallowing worsens", "breathing changes"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hoarse-routine-advice", titleEn: "Routine hoarseness follow-up", instructionTextEn: "Book a GP appointment for persistent or recurring voice problems.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-hoarse-selfcare-advice", titleEn: "Home care for hoarseness", instructionTextEn: "Speak as little as possible, drink plenty of fluids, keep the air moist with bowls of water, and gargle warm salty water (adults only). Avoid talking loudly or whispering, smoking, smoky/dusty environments, and excessive caffeine or alcohol.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after 2 weeks", "swallowing or breathing difficulty develops"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Laryngitis\", https://www.nhs.uk/conditions/laryngitis/ (page last reviewed 17 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published laryngitis guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. widespread infection with fever and severe illness)?",
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
          "Is the patient a baby 11 months or younger, is this breastfeeding with sores on the breast, does the caller have a weakened immune system, has treatment not worked or symptoms worsened, or has impetigo recurred within the past year?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons for a GP visit rather than pharmacist self-care. Impetigo is very infectious - check with the GP surgery before attending in person.",
        redFlag: false,
        keywords: ["baby with impetigo", "recurring impetigo", "impetigo treatment not working"],
        careAdviceIds: ["oscg-impetigo-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-impetigo-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a straightforward case (child 12+ months, no breastfeeding sores, no weakened immune system) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can give the same medicines as a GP for straightforward impetigo.",
        redFlag: false,
        keywords: ["straightforward impetigo"],
        careAdviceIds: ["oscg-impetigo-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-impetigo-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever develops", "spreading infection"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-impetigo-routine-advice", titleEn: "Routine impetigo follow-up", instructionTextEn: "Book a GP appointment - call ahead since impetigo is very infectious.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["worsening symptoms", "fever develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-impetigo-selfcare-advice", titleEn: "Pharmacy self-care for impetigo", instructionTextEn: "A pharmacist can provide the same medicines as a GP. Wash affected areas with soap and water, wash hands frequently (especially before/after applying cream), and wash bedding/towels at high temperature. Do not touch or scratch sores. Stay away from work, school, or nursery until no longer contagious (48 hours after starting treatment, or once patches dry and crust over without treatment). Don't share towels or prepare food for others.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with treatment", "spreading or worsening"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-06-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Impetigo\", https://www.nhs.uk/conditions/impetigo/ (page last reviewed 06 June 2024)"],
      contentNotice: "Decomposed from NHS.UK's published impetigo guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-vaccine-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe the reaction." }
    ],
    questions: [
      {
        id: "oscg-vaccine-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy since the vaccine?",
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vaccine-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vaccine-selfcare-advice", titleEn: "Home care for common vaccine side effects", instructionTextEn: "Common mild side effects usually resolve within 1-2 days. Paracetamol or ibuprofen can help with soreness or fever per local policy.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms last more than 2 days", "swelling or breathing changes develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-11-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Flu vaccine\" (side effects section), https://www.nhs.uk/vaccinations/flu-vaccine/ (page last reviewed 23 November 2023)"],
      contentNotice: "Decomposed from NHS.UK's published flu vaccine side-effect guidance, generalized to vaccines broadly since mild-reaction and rare-anaphylaxis patterns are consistent across vaccines (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
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
      contentNotice: "Decomposed from NHS.UK's published athlete's foot guidance, explicitly generalized to jock itch since both are the same fungal infection type managed identically (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. No dedicated NHS.UK jock itch page was found. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-itchwide-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-itchwide-routine-advice", titleEn: "Routine itching follow-up", instructionTextEn: "Book a GP appointment - a pharmacist can also advise on self-care and whether GP review is needed.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "new rash or swelling develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-itchwide-selfcare-advice", titleEn: "Home care for itchy skin", instructionTextEn: "Pat or tap the skin instead of scratching, use an unperfumed moisturiser regularly, take cool or lukewarm baths/showers, wear loose cotton or silk clothing, and keep nails clean and short. Avoid tight clothes, wool or synthetic fabrics, long baths/showers, and perfumed products.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with self-care", "keeps coming back", "becomes severe"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Itchy skin\", https://www.nhs.uk/conditions/itchy-skin/ (page last reviewed 19 July 2023)"],
      contentNotice: "Decomposed from NHS.UK's published itchy skin guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the widespread/all-over presentation specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
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
      contentNotice: "Decomposed from NHS.UK's published itchy skin guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the localized presentation specifically - no emergency tier since a localized itch alone does not meet the source's own emergency-adjacent criteria (unlike widespread itching, which can signal a systemic allergic reaction). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy?",
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
        questionTextEn: "Are symptoms worsening or not improving, is it in the mouth/throat/near the eyes, is there abdominal pain and vomiting, dizziness, a high fever, multiple bites, or a previous serious allergic reaction?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or see a GP urgently.",
        redFlag: false,
        keywords: ["worsening bite symptoms", "multiple bites", "prior allergic reaction to bites"],
        careAdviceIds: ["oscg-insectbite-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-insectbite-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport. Lie down with legs raised unless breathing is difficult.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-insectbite-urgent-advice", titleEn: "Urgent bite review", instructionTextEn: "Apply a cold compress and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling spreads", "breathing becomes difficult"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-insectbite-routine-advice", titleEn: "Routine bite follow-up", instructionTextEn: "Keep the area clean and book a routine review for signs of infection.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-insectbite-selfcare-advice", titleEn: "Home care for a minor bite", instructionTextEn: "Apply an ice pack, keep the area elevated, and use over-the-counter painkillers, antihistamines, or hydrocortisone cream as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling worsens", "signs of infection or allergic reaction develop"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published insect bites and stings guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format as a general entry point when the specific insect isn't known - the specific-insect variants (Bee/Yellow Jacket Sting, Bed Bug Bite, Fire Ant Sting) remain separate topics. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-genitalmale-emergency-advice", titleEn: "Emergency testicular injury precautions", instructionTextEn: "Arrange emergency transport immediately - do not delay, as testicular torsion needs rapid treatment.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "vomiting increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-genitalmale-urgent-advice", titleEn: "Urgent testicular review", instructionTextEn: "Arrange prompt medical evaluation - do not try to self-diagnose the cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens or becomes sudden and severe", "nausea or vomiting develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-06-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Testicle pain\", https://www.nhs.uk/symptoms/testicle-pain/ (page last reviewed 26 June 2025)"],
      contentNotice: "Decomposed from NHS.UK's published testicle pain guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        questionTextEn: "Is this a baby with red, sticky eyes, does the caller wear contact lenses, or have symptoms not cleared within 7 days?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK conjunctivitis guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["baby sticky eyes discharge", "eye discharge over a week"],
        careAdviceIds: ["oscg-eyepus-routine-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyepus-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Do not touch or rub the eye and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision worsens", "pain increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyepus-routine-advice", titleEn: "Routine eye discharge follow-up", instructionTextEn: "Book a GP appointment for these situations.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "pain develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-eyepus-selfcare-advice", titleEn: "Pharmacy self-care for mild eye discharge", instructionTextEn: "A pharmacist can recommend eyedrops. Gently clean the eye with cooled boiled water and a clean cloth, wiping from the inner to outer corner, using a fresh area of cloth for each wipe.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving within 7 days", "pain or vision changes develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Conjunctivitis\", https://www.nhs.uk/conditions/conjunctivitis/ (page last reviewed 23 April 2024)",
        "NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page last reviewed 12 March 2026)"
      ],
      contentNotice: "Decomposed from NHS.UK's published conjunctivitis and eye injuries guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the discharge/pus presentation specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
