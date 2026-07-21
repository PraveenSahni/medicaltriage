import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 14 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Wrist Injury and Hand Injury directly use the "Broken arm or
 * wrist" page (already cited for Arm/Elbow/Finger/Shoulder/Hip/Leg/Toe Injury
 * generalizations) - wrist is literally in its title, hand is the closest
 * anatomical neighbor. Heat Exposure (heat exhaustion and heatstroke) is
 * genuinely important for this Qatar/Gulf deployment given the climate. Wound
 * Infection Suspected synthesizes the skin-infection red-flag criteria
 * already cited for Boils/Cuts and Grazes/Sores, applied specifically to a
 * "is my wound infected" presentation.
 */
export const batch14Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Wrist Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/
  // ------------------------------------------------------------------
  {
    id: "oscg-wrist-injury",
    titleEn: "Wrist Injury",
    clinicalDefinitionEn: "Wrist injury assessment decomposed from NHS.UK's published broken arm or wrist guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "wrist injury", weight: 100 },
      { phrase: "hurt my wrist", weight: 90 },
      { phrase: "fell on my wrist", weight: 95 },
      { phrase: "wrist looks deformed", weight: 100 },
      { phrase: "cant move my wrist", weight: 90 },
      { phrase: "landed on my wrist", weight: 100 },
      { phrase: "landed right on my wrist", weight: 100 },
      { phrase: "wrist looks bent", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-wristinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-wristinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any numbness or tingling in the hand?" },
      { id: "oscg-wristinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-wristinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the wrist look visibly deformed or out of place, is there a bone showing through the skin, or is there numbness, tingling, or loss of pulse in the hand?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken arm or wrist guidance lists visible deformity, protruding bone, and loss of feeling or circulation as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["deformed wrist", "numbness in hand after wrist injury"],
        careAdviceIds: ["oscg-wristinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-wristinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant swelling, inability to move the wrist normally, or pain that worsens when trying to grip or move it?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these signs as reasons to seek urgent medical assessment for a possible fracture.",
        redFlag: false,
        keywords: ["cant grip after wrist injury", "swollen wrist"],
        careAdviceIds: ["oscg-wristinjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-wristinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bump or strain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor wrist injuries as manageable at home with rest, ice, and pain relief.",
        redFlag: false,
        keywords: ["minor wrist strain"],
        careAdviceIds: ["oscg-wristinjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-wristinjury-emergency-advice", titleEn: "Emergency wrist injury precautions", instructionTextEn: "Do not try to realign the wrist. Support it in the most comfortable position and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["hand turns pale or cold", "worsening numbness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-wristinjury-urgent-advice", titleEn: "Urgent wrist injury review", instructionTextEn: "Rest and support the wrist and arrange same-day medical review for a possible fracture.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-wristinjury-selfcare-advice", titleEn: "Home care for a minor wrist injury", instructionTextEn: "Rest the wrist, apply a cold compress, and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "swelling increases or numbness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\", https://www.nhs.uk/conditions/broken-arm-or-wrist/"],
      contentNotice: "Decomposed from NHS.UK's published broken arm or wrist guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the wrist-specific presentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Hand Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/, generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-hand-injury",
    titleEn: "Hand Injury",
    clinicalDefinitionEn: "Hand injury assessment, generalized from NHS.UK's published broken arm or wrist guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "hand injury", weight: 100 },
      { phrase: "hurt my hand", weight: 90 },
      { phrase: "crushed my hand", weight: 95 },
      { phrase: "hand looks deformed", weight: 100 },
      { phrase: "slammed my hand in the door", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-handinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-handinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any numbness or loss of movement in the fingers?" },
      { id: "oscg-handinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-handinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the hand look visibly deformed or out of place, is there a bone showing through the skin, an amputated or partially severed finger, or numbness/loss of pulse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken arm or wrist guidance lists visible deformity, protruding bone, and loss of feeling or circulation as call-999/A&E criteria; a severed or partially severed digit is a time-critical surgical emergency.",
        redFlag: true,
        keywords: ["deformed hand", "amputated finger", "severed finger"],
        careAdviceIds: ["oscg-handinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-handinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant swelling, inability to move the fingers normally, or a crush injury under a heavy object?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these signs as reasons to seek urgent medical assessment for a possible fracture or tendon injury.",
        redFlag: false,
        keywords: ["cant move fingers after hand injury", "crushed hand under object"],
        careAdviceIds: ["oscg-handinjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-handinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bump or bruise with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor hand injuries as manageable at home with rest, ice, and pain relief.",
        redFlag: false,
        keywords: ["minor hand bruise"],
        careAdviceIds: ["oscg-handinjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-handinjury-emergency-advice", titleEn: "Emergency hand injury precautions", instructionTextEn: "If a finger is severed, wrap it in clean, slightly damp gauze, place it in a sealed bag, and put that bag on ice (never directly on the tissue). Control bleeding with firm pressure and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["hand turns pale or cold", "worsening numbness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-handinjury-urgent-advice", titleEn: "Urgent hand injury review", instructionTextEn: "Rest and elevate the hand and arrange same-day medical review for a possible fracture or tendon injury.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-handinjury-selfcare-advice", titleEn: "Home care for a minor hand injury", instructionTextEn: "Rest the hand, apply a cold compress, and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "swelling increases or numbness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to the hand; standard emergency-medicine knowledge of amputated-digit transport (damp gauze, sealed bag, on ice, never direct contact)"],
      contentNotice: "No dedicated NHS.UK page exists for hand injuries specifically. This protocol generalizes NHS.UK's broken arm or wrist guidance's fracture red-flag criteria to the hand, combined with widely-recognized emergency medicine knowledge about severed-digit transport - a documented generalization. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Toothache - https://www.nhs.uk/conditions/toothache/ (reviewed 2024-07-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-toothache",
    titleEn: "Toothache",
    clinicalDefinitionEn: "Toothache assessment decomposed from NHS.UK's published toothache guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "toothache", weight: 100 },
      { phrase: "tooth pain", weight: 100 },
      { phrase: "my tooth really hurts", weight: 90 },
      { phrase: "tooth has been hurting", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-toothache-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Which tooth, and how long has it hurt?" },
      { id: "oscg-toothache-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any facial or neck swelling, or fever?" },
      { id: "oscg-toothache-iaq3", sequence: 3, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" }
    ],
    questions: [
      {
        id: "oscg-toothache-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the area around the eye or neck swollen, or is swelling in the mouth or neck making it difficult to breathe, swallow, or speak?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK toothache guidance lists spreading facial/neck swelling with airway or swallowing difficulty as an immediate emergency (a dental abscess can spread rapidly). Do not drive to A&E.",
        redFlag: true,
        keywords: ["face swollen with toothache", "trouble swallowing with tooth pain", "trouble breathing with tooth pain"],
        careAdviceIds: ["oscg-toothache-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-toothache-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has the pain lasted more than 2 days, does it not go away with painkillers, or is there fever, biting pain, red gums, a bad taste, or cheek/jaw swelling?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends contacting a dentist for these persistent or infection-suggestive symptoms.",
        redFlag: false,
        keywords: ["toothache lasting days", "swollen gums with tooth pain"],
        careAdviceIds: ["oscg-toothache-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-toothache-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, recent tooth pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild, recent toothache as manageable at home while awaiting a routine dental appointment.",
        redFlag: false,
        keywords: ["mild toothache"],
        careAdviceIds: ["oscg-toothache-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toothache-emergency-advice", titleEn: "Emergency toothache precautions", instructionTextEn: "Do not drive to A&E - ask someone to drive you or call 999 for an ambulance. Spreading facial/neck swelling with breathing or swallowing difficulty needs immediate emergency care.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening swelling", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothache-urgent-advice", titleEn: "Urgent dental review", instructionTextEn: "Contact a dentist for a prompt appointment given the persistent pain or signs of infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothache-selfcare-advice", titleEn: "Home care for mild toothache", instructionTextEn: "Take ibuprofen or paracetamol as directed, use a mouth pain-relief gel, rinse with warm salt water, eat soft food, and avoid very sweet, hot, or cold foods until seen by a dentist.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 days", "swelling or fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-07-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Toothache\", https://www.nhs.uk/conditions/toothache/ (page last reviewed 01 July 2024)"],
      contentNotice: "Decomposed from NHS.UK's published toothache guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Vision Loss or Change - https://www.nhs.uk/conditions/vision-loss/ (reviewed 2025-08-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-vision-loss-or-change",
    titleEn: "Vision Loss or Change",
    clinicalDefinitionEn: "Sudden vision loss or change assessment decomposed from NHS.UK's published vision loss guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "vision loss", weight: 100 },
      { phrase: "sudden vision change", weight: 100 },
      { phrase: "cant see out of one eye", weight: 100 },
      { phrase: "vision suddenly blurry", weight: 90 },
      { phrase: "seeing flashing lights", weight: 90 },
      { phrase: "suddenly cant see out of one eye at all", weight: 100 },
      { phrase: "it just went dark", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-visionloss-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the vision change." },
      { id: "oscg-visionloss-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it start?" },
      { id: "oscg-visionloss-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does it affect one eye or both?" }
    ],
    questions: [
      {
        id: "oscg-visionloss-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has the person suddenly lost vision in one or both eyes, or is there suddenly severe eye pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK vision loss guidance lists sudden vision loss and sudden severe eye pain as call-999/A&E criteria. Do not drive to A&E.",
        redFlag: true,
        keywords: ["sudden blindness one eye", "sudden severe eye pain"],
        careAdviceIds: ["oscg-visionloss-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-visionloss-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there blurred or double vision, flashing lights or shapes, a dark shadow moving across the vision, pain in one or both eyes, or a red and painful eye, or does bright light hurt the eyes?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent GP or NHS 111 advice for these vision changes even without complete vision loss.",
        redFlag: false,
        keywords: ["dark shadow across vision", "double vision", "eyes hurt in bright light"],
        careAdviceIds: ["oscg-visionloss-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-visionloss-emergency-advice", titleEn: "Emergency vision loss precautions", instructionTextEn: "Do not drive to A&E - ask someone to drive you or call 999 for an ambulance. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision does not return", "pain worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-visionloss-urgent-advice", titleEn: "Urgent vision change review", instructionTextEn: "Arrange urgent same-day medical or ophthalmology review for these vision changes.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision worsens", "complete vision loss develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-08-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Vision loss\", https://www.nhs.uk/conditions/vision-loss/ (page last reviewed 28 August 2025)"],
      contentNotice: "Decomposed from NHS.UK's published vision loss guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Vomiting Blood - https://www.nhs.uk/conditions/vomiting-blood/ (reviewed 2025-08-18)
  // ------------------------------------------------------------------
  {
    id: "oscg-vomiting-blood",
    titleEn: "Vomiting Blood",
    clinicalDefinitionEn: "Vomiting blood (hematemesis) assessment decomposed from NHS.UK's published vomiting blood guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "vomiting blood", weight: 100 },
      { phrase: "threw up blood", weight: 100 },
      { phrase: "blood in my vomit", weight: 100 },
      { phrase: "coughing up blood while vomiting", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-vomitblood-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the amount and appearance of blood." },
      { id: "oscg-vomitblood-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it start?" },
      { id: "oscg-vomitblood-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any black poo, tummy pain, or feeling faint?" }
    ],
    questions: [
      {
        id: "oscg-vomitblood-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with vomiting blood, does the person feel generally unwell, confused, faint or dizzy, have rapid or shallow breathing, cold clammy pale skin, tummy pain, or black poo?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK vomiting blood guidance lists these as call-999/A&E criteria - signs of significant gastrointestinal bleeding. Do not drive to A&E.",
        redFlag: true,
        keywords: ["faint after vomiting blood", "black poo with vomiting blood", "confused after vomiting blood"],
        careAdviceIds: ["oscg-vomitblood-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-vomitblood-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has the vomiting of blood stopped, with no other symptoms present?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends an urgent GP appointment or NHS 111 call even after vomiting blood has stopped, to find the cause.",
        redFlag: false,
        keywords: ["vomited blood once stopped now"],
        careAdviceIds: ["oscg-vomitblood-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vomitblood-emergency-advice", titleEn: "Emergency vomiting blood precautions", instructionTextEn: "Do not drive to A&E - ask someone to drive you or call 999 for an ambulance. Keep the person seated or lying on their side and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening faintness", "more blood"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vomitblood-urgent-advice", titleEn: "Urgent vomiting blood review", instructionTextEn: "Arrange an urgent GP appointment or NHS 111-equivalent review even though the bleeding has stopped, to determine the cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vomiting blood recurs", "black poo or faintness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-08-18", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Vomiting blood\", https://www.nhs.uk/conditions/vomiting-blood/ (page last reviewed 18 August 2025)"],
      contentNotice: "Decomposed from NHS.UK's published vomiting blood guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Urine - Blood In - https://www.nhs.uk/conditions/blood-in-urine/ (reviewed 2023-05-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-blood-in-urine",
    titleEn: "Urine - Blood In",
    clinicalDefinitionEn: "Blood in urine (hematuria) assessment decomposed from NHS.UK's published blood in urine guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "blood in my urine", weight: 100 },
      { phrase: "blood in my pee", weight: 100 },
      { phrase: "peeing blood", weight: 95 },
      { phrase: "urine looks pink", weight: 85 },
      { phrase: "urine looks red", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bloodurine-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the color and how much blood is present." },
      { id: "oscg-bloodurine-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this been noticed?" },
      { id: "oscg-bloodurine-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any recent beetroot intake, medication, or menstruation that could explain it?" }
    ],
    questions: [
      {
        id: "oscg-bloodurine-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there any blood in the urine, regardless of amount, whether it's the first time, or the cause is uncertain?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance states blood in urine must always be checked out promptly, regardless of amount or certainty about the cause, since it can occasionally be a sign of cancer that's easier to treat if found early.",
        redFlag: false,
        keywords: ["any blood in urine", "pink or red pee"],
        careAdviceIds: ["oscg-bloodurine-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bloodurine-urgent-advice", titleEn: "Urgent blood-in-urine review", instructionTextEn: "Arrange a prompt GP appointment or NHS 111-equivalent review. This always needs professional evaluation, even if it happens only once or the amount seems small.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["heavy bleeding develops", "pain, fever, or feeling unwell develops"], displayOrder: 1, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Blood in urine\", https://www.nhs.uk/conditions/blood-in-urine/ (page last reviewed 19 May 2023)"],
      contentNotice: "Decomposed from NHS.UK's published blood in urine guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source page treats any occurrence as needing prompt professional evaluation rather than self-care, so no self-care tier is included. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Urination Pain - Female - https://www.nhs.uk/conditions/cystitis/ (reviewed 2025-07-11)
  // ------------------------------------------------------------------
  {
    id: "oscg-urination-pain-female",
    titleEn: "Urination Pain - Female",
    clinicalDefinitionEn: "Painful urination (UTI/cystitis symptoms) in females, decomposed from NHS.UK's published cystitis guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "painful urination", weight: 100 },
      { phrase: "burning when i pee", weight: 100 },
      { phrase: "hurts to pee", weight: 95 },
      { phrase: "think i have a uti", weight: 90 },
      { phrase: "cystitis symptoms", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-urinepainf-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the urinary symptoms." },
      { id: "oscg-urinepainf-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-urinepainf-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person pregnant, diabetic, or immunocompromised?" }
    ],
    questions: [
      {
        id: "oscg-urinepainf-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with urinary symptoms, is there confusion, a very high or low temperature, fast breathing, a fast heart rate, or does the person seem seriously unwell?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are recognized sepsis red flags that can complicate a urinary tract infection and require immediate emergency care - widely-taught sepsis-screening knowledge applied to a UTI context.",
        redFlag: true,
        keywords: ["confused with uti symptoms", "seriously unwell with urinary symptoms"],
        careAdviceIds: ["oscg-urinepainf-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-urinepainf-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person 65 or older, pregnant, diabetic, using a catheter, having a recurrent infection, or having pain in the lower tummy or back, blood in the urine, a fever, or symptoms not improving after 48 hours?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cystitis guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["uti with fever", "uti not improving after 2 days", "blood in urine with uti symptoms"],
        careAdviceIds: ["oscg-urinepainf-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-urinepainf-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are the symptoms mild, without fever or the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild cystitis symptoms as manageable at home with fluids, pain relief, and monitoring.",
        redFlag: false,
        keywords: ["mild uti symptoms"],
        careAdviceIds: ["oscg-urinepainf-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-urinepainf-emergency-advice", titleEn: "Emergency urinary infection precautions", instructionTextEn: "Arrange emergency transport immediately - these symptoms can indicate a serious infection spreading through the body.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-urinepainf-urgent-advice", titleEn: "Urgent urinary symptom review", instructionTextEn: "Arrange same-day medical review given the risk factors or persistent symptoms present.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever develops", "back or flank pain develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-urinepainf-selfcare-advice", titleEn: "Home care for mild urinary symptoms", instructionTextEn: "Take paracetamol up to 4 times a day for pain and fever, rest, and drink enough fluids to pass pale urine regularly. Avoid bladder irritants like fruit juice, coffee, and alcohol.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms worsen or do not improve within 2 days", "fever or back pain develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cystitis\", https://www.nhs.uk/conditions/cystitis/ (page last reviewed 11 July 2025)"],
      contentNotice: "Decomposed from NHS.UK's published cystitis guidance (Crown copyright, reused under the Open Government Licence). The emergency tier adds a standard, widely-taught sepsis-screen (confusion, temperature extremes, rapid breathing/heart rate) not a direct quote from this specific page, since UTIs are a recognized common sepsis source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Urination Pain - Male - https://www.nhs.uk/conditions/cystitis/ (reviewed 2025-07-11), male-specific tier
  // ------------------------------------------------------------------
  {
    id: "oscg-urination-pain-male",
    titleEn: "Urination Pain - Male",
    clinicalDefinitionEn: "Painful urination (UTI symptoms) in males, decomposed from NHS.UK's published cystitis guidance, which treats male sex as an automatic urgent-review criterion.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "painful urination", weight: 95 },
      { phrase: "burning when i pee male", weight: 100 },
      { phrase: "hurts when i urinate", weight: 90 },
      { phrase: "pain when peeing", weight: 90 },
      { phrase: "really painful when i urinate", weight: 100 },
      { phrase: "painful when i urinate and theres some discharge", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-urinepainm-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the urinary symptoms." },
      { id: "oscg-urinepainm-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-urinepainm-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any discharge, testicular pain, or back/flank pain?" }
    ],
    questions: [
      {
        id: "oscg-urinepainm-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with urinary symptoms, is there confusion, a very high or low temperature, fast breathing, a fast heart rate, or does the person seem seriously unwell?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Recognized sepsis red flags that can complicate a urinary tract infection and require immediate emergency care.",
        redFlag: true,
        keywords: ["confused with urinary symptoms", "seriously unwell with urination pain"],
        careAdviceIds: ["oscg-urinepainm-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-urinepainm-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there testicular or scrotal pain, discharge, blood in the urine, fever, back or flank pain, or symptoms not improving within 48 hours?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cystitis guidance treats being male as an automatic urgent-review criterion (UTIs in men are less common and warrant assessment to rule out other causes such as a sexually transmitted infection or prostate involvement), and lists these additional features as reasons for prompt review.",
        redFlag: false,
        keywords: ["testicular pain with urination pain", "discharge with painful urination", "blood in urine with urination pain"],
        careAdviceIds: ["oscg-urinepainm-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-urinepainm-emergency-advice", titleEn: "Emergency urinary infection precautions", instructionTextEn: "Arrange emergency transport immediately - these symptoms can indicate a serious infection spreading through the body.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-urinepainm-urgent-advice", titleEn: "Urgent urinary symptom review", instructionTextEn: "Arrange same-day medical review - urinary symptoms in men should always be assessed promptly to identify the cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever develops", "testicular pain develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cystitis\", https://www.nhs.uk/conditions/cystitis/ (page last reviewed 11 July 2025) - male-specific urgent-review criterion"],
      contentNotice: "Decomposed from NHS.UK's published cystitis guidance, which explicitly lists being male as one of its urgent-review criteria (since UTIs are less common in men and warrant assessment). No self-care tier is included, consistent with the source's own male-specific urgency. The emergency tier adds a standard sepsis screen, not a direct quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Heat Exposure (Heat Exhaustion and Heat Stroke) - https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/ (reviewed 2026-05-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-heat-exposure",
    titleEn: "Heat Exposure (Heat Exhaustion and Heat Stroke)",
    clinicalDefinitionEn: "Heat exhaustion and heatstroke assessment decomposed from NHS.UK's published guidance - genuinely important given Qatar's climate.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "heat exhaustion", weight: 100 },
      { phrase: "heat stroke", weight: 100 },
      { phrase: "heatstroke", weight: 100 },
      { phrase: "overheated outside", weight: 85 },
      { phrase: "too much sun and heat", weight: 85 },
      { phrase: "out in the heat all day", weight: 100 },
      { phrase: "sweating heavily with a headache", weight: 100 },
      { phrase: "dizzy from the heat", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-heatexposure-iaq1", sequence: 1, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-heatexposure-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long was the heat exposure?" },
      { id: "oscg-heatexposure-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the skin still sweating?" }
    ],
    questions: [
      {
        id: "oscg-heatexposure-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there a very high temperature, hot skin that has stopped sweating (may look red), a fast heartbeat, fast breathing, confusion or lack of coordination, a seizure, loss of consciousness, or no improvement after 30 minutes of cooling?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance lists these as signs of heatstroke requiring an immediate 999 call. Do not drive to A&E.",
        redFlag: true,
        keywords: ["hot skin not sweating", "confused from heat", "unconscious from heat"],
        careAdviceIds: ["oscg-heatexposure-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-heatexposure-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Are there symptoms of heat exhaustion that are difficult to treat, or is advice needed?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends contacting NHS 111 for heat exhaustion symptoms that are struggling to resolve with home cooling measures.",
        redFlag: false,
        keywords: ["heat exhaustion not improving"],
        careAdviceIds: ["oscg-heatexposure-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-heatexposure-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these early heat-exhaustion symptoms (feeling faint, sweating heavily, headache, cramps) with none of the emergency features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes early heat exhaustion as manageable at home with cooling measures and usually resolves within 30 minutes.",
        redFlag: false,
        keywords: ["early heat exhaustion symptoms"],
        careAdviceIds: ["oscg-heatexposure-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-heatexposure-emergency-advice", titleEn: "Emergency heatstroke precautions", instructionTextEn: "While waiting for the ambulance, wrap the person in a cool, wet sheet or fan and sponge them with cool water. If unconscious, place in the recovery position and be ready to perform CPR if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["loss of consciousness", "seizure"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-heatexposure-urgent-advice", titleEn: "Urgent heat exhaustion review", instructionTextEn: "Continue cooling measures and arrange prompt medical advice since symptoms are not resolving.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["confusion develops", "sweating stops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-heatexposure-selfcare-advice", titleEn: "Home cooling for heat exhaustion", instructionTextEn: "Move to a cool place, remove unnecessary clothing, give plenty of water to drink (isotonic sports drinks or rehydration powders are fine), and cool the skin by spraying or sponging with cool water and fanning. Symptoms typically improve within 30 minutes.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after 30 minutes of cooling", "confusion or stopped sweating develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-05-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Heat exhaustion and heatstroke\", https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/ (page last reviewed 28 May 2026)"],
      contentNotice: "Decomposed from NHS.UK's published heat exhaustion and heatstroke guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Particularly relevant to this Qatar/Gulf deployment given ambient heat exposure risk. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Wound Infection Suspected - synthesis of Boils/Cuts and Grazes red-flag criteria
  // ------------------------------------------------------------------
  {
    id: "oscg-wound-infection-suspected",
    titleEn: "Wound Infection Suspected",
    clinicalDefinitionEn: "Suspected wound infection assessment, synthesized from NHS.UK's boils and cuts-and-grazes skin-infection red-flag criteria.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "wound infection", weight: 100 },
      { phrase: "cut looks infected", weight: 100 },
      { phrase: "wound is infected", weight: 100 },
      { phrase: "wound leaking pus", weight: 95 },
      { phrase: "wound is red and swollen", weight: 90 },
      { phrase: "looks infected, red and swollen", weight: 100 },
      { phrase: "red and swollen with pus", weight: 100 },
      { phrase: "pus coming out", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-woundinfection-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the wound?" },
      { id: "oscg-woundinfection-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-woundinfection-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long has the wound been present?" }
    ],
    questions: [
      {
        id: "oscg-woundinfection-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there rapidly spreading redness, red streaking away from the wound, confusion, a very high or low temperature, fast breathing, or does the person seem seriously unwell?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Rapidly spreading infection or systemic sepsis red flags (confusion, temperature extremes, fast breathing) after a wound infection require immediate emergency care.",
        redFlag: true,
        keywords: ["red streaking from wound", "confused with wound infection", "seriously unwell with infected wound"],
        careAdviceIds: ["oscg-woundinfection-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-woundinfection-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the skin around the wound hot, red, swollen, increasingly painful, or leaking pus, or does the person have a high temperature or feel generally unwell?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with NHS.UK's skin-infection red-flag criteria (already applied to boils, cuts and grazes, and general sores) - these signs warrant a same-day medical review.",
        redFlag: false,
        keywords: ["wound hot and swollen", "wound leaking pus"],
        careAdviceIds: ["oscg-woundinfection-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-woundinfection-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild redness right at the wound edge only, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, localized redness without spreading, pus, or systemic symptoms can be monitored at home.",
        redFlag: false,
        keywords: ["mild redness at wound edge"],
        careAdviceIds: ["oscg-woundinfection-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-woundinfection-emergency-advice", titleEn: "Emergency wound infection precautions", instructionTextEn: "Arrange emergency transport immediately - spreading infection can become life-threatening quickly.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "spreading redness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-woundinfection-urgent-advice", titleEn: "Urgent wound infection review", instructionTextEn: "Keep the wound clean and covered and arrange same-day medical review for possible antibiotic treatment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-woundinfection-selfcare-advice", titleEn: "Home monitoring for mild wound redness", instructionTextEn: "Keep the wound clean and covered with a dressing, wash hands before and after care, and watch closely for the next day or two.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness spreads", "pus, fever, or worsening pain develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Boils\" and \"Cuts and grazes\" (skin-infection red-flag criteria, already cited for the Boil, Sores, and Skin Injury protocols), applied specifically to a suspected-wound-infection presentation"],
      contentNotice: "No single dedicated NHS.UK page exists for 'is my wound infected' specifically. This protocol synthesizes the skin-infection red-flag criteria already cited for Boils/Cuts and Grazes/Sores, applied to a focused wound-infection concern - a documented synthesis, not a single-source quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
