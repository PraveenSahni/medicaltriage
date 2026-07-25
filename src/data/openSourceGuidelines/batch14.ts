import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";
import { addChildSafeguardingUatBranches } from "./batch09.js";

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
const batch14ProtocolDefinitions: ProtocolInput[] = [
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
      { id: "oscg-wristinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-wristinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record open wound, bleeding, hand colour/warmth/movement, rings, crush or high-energy mechanism, age, pregnancy, anticoagulants, immune suppression, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-wristinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there major deformity, exposed bone, uncontrolled bleeding, severe crush injury, or is the hand pale/blue/cold, pulseless, numb, weak, or unable to move?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken arm or wrist guidance lists visible deformity, protruding bone, and loss of feeling or circulation as emergency-assessment criteria.",
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-wristinjury-emergency-advice", titleEn: "Emergency wrist injury precautions", instructionTextEn: "Call Qatar 999 now. Do not realign or test the wrist. Support it as found, cover exposed bone loosely, control bleeding around it, remove rings if easy, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["hand becomes pale, blue, cold, pulseless, numb, or weak", "worsening bleeding, swelling, or severe pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-wristinjury-urgent-advice", titleEn: "Prompt in-person wrist assessment", instructionTextEn: "Use the Qatar governance-approved in-person pathway. Support the wrist without forcing position and use a wrapped cool pack. Medication must account for age, pregnancy, kidney disease, bleeding risk, and doses already taken.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling, numbness, weakness, or colour/temperature change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-wristinjury-selfcare-advice", titleEn: "Care for a clearly minor wrist injury", instructionTextEn: "Rest from aggravating activity, use a wrapped cool pack briefly, and confirm pain medicine with a pharmacist. Seek review if function does not improve or any neurovascular symptom develops.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain or swelling worsens, grip weakens, or numbness or colour change develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\", https://www.nhs.uk/conditions/broken-arm-or-wrist/"],
      contentNotice: "UAT-only wrist-injury adaptation with open fracture, crush, neurovascular, age, pregnancy, anticoagulant, immunocompromise, medication and safeguarding controls. Exact Qatar orthopaedic routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
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
        rationaleEn: "NHS.UK broken arm or wrist guidance lists visible deformity, protruding bone, and loss of feeling or circulation as emergency-assessment criteria; a severed or partially severed digit is a time-critical surgical emergency.",
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-handinjury-emergency-advice", titleEn: "Emergency hand injury precautions", instructionTextEn: "Call Qatar 999 now. Do not realign, remove embedded objects, or allow self-driving. Wrap an amputated part in clean damp gauze, seal it in a bag, and cool that bag over ice-water without direct ice contact. Control bleeding, remove rings if easy, and support the hand.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["hand turns pale, blue or cold, worsening numbness, weakness, bleeding, or swelling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-handinjury-urgent-advice", titleEn: "Urgent hand injury review", instructionTextEn: "Rest and elevate the hand and arrange same-day medical review for a possible fracture or tendon injury.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-handinjury-selfcare-advice", titleEn: "Governed care for a minor hand injury", instructionTextEn: "Rest the hand and use a wrapped cool compress briefly without direct skin exposure. Pain medicine requires an approved Qatar clinician or pharmacist pathway confirming age and weight, pregnancy or breastfeeding, allergies, kidney or liver disease, ulcer or bleeding risk, anticoagulants, current medicines, and maximum dose. Do not improvise a medicine or dose from this UAT content.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "swelling increases or numbness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to the hand; standard emergency-medicine knowledge of amputated-digit transport (damp gauze, sealed bag, on ice, never direct contact)"],
      contentNotice: "SOURCE-ONLY UAT generalization; no generated variant exists in the current 504-protocol catalog. Qatar hand surgery, amputation, crush, open fracture, neurovascular, pediatric, pregnancy, anticoagulant, medication and safeguarding routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
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
      { id: "oscg-toothache-iaq3", sequence: 3, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" },
      { id: "oscg-toothache-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, immune suppression, diabetes, anticoagulants, medicines and doses already taken, poor intake, trauma, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-toothache-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the area around the eye or neck swollen, or is swelling in the mouth or neck making it difficult to breathe, swallow, or speak?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK toothache guidance lists spreading facial/neck swelling with airway or swallowing difficulty as an immediate emergency (a dental abscess can spread rapidly). Do not drive yourself to the emergency department.",
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toothache-emergency-advice", titleEn: "Emergency dental-infection precautions", instructionTextEn: "Call Qatar 999 now for airway, swallowing, eye or neck swelling and do not allow self-driving. Sit upright if breathing is easier, give nothing by mouth if swallowing is unsafe, and do not squeeze or pierce swelling.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening swelling, drooling, breathing difficulty, confusion, or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothache-urgent-advice", titleEn: "Prompt dental assessment", instructionTextEn: "Use the Qatar governance-approved emergency-dental pathway. Do not use leftover antibiotics or place aspirin or caustic products on the gum. Medication requires age, pregnancy, allergy, kidney/liver disease, anticoagulant, and dose checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling, fever, trismus, poor intake, or worsening pain"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothache-selfcare-advice", titleEn: "Temporary low-risk toothache care", instructionTextEn: "Use soft foods, avoid temperature triggers, and rinse gently with warm salt water only if old enough to spit safely. Confirm all pain medicines and oral gels with a dentist or pharmacist; do not delay definitive dental care.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain persists, fever, swelling, poor intake, swallowing or breathing difficulty"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-07-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Toothache\", https://www.nhs.uk/conditions/toothache/ (page last reviewed 01 July 2024)"],
      contentNotice: "UAT-only toothache adaptation with airway, deep infection, eye/neck spread, age, pregnancy, diabetes, immunocompromise, anticoagulant, medication and safeguarding controls. Exact Qatar dental routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Vision Loss or Change - https://www.nhs.uk/conditions/vision-loss/ (reviewed 2025-08-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-vision-loss-or-change",
    titleEn: "Vision Loss or Change",
    clinicalDefinitionEn: "UAT-only adult and pediatric assessment of new vision loss or change, with sudden loss, severe painful eye disease, and associated neurological emergencies routed directly to emergency care.",
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
      { id: "oscg-visionloss-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What changed: complete or partial loss, blur, double vision, flashing lights, new floaters, dark curtain or shadow, missing field, color change, or inability to fix and follow?" },
      { id: "oscg-visionloss-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "What exact time did it start, was onset sudden or gradual, and is it constant, worsening, or now resolved?" },
      { id: "oscg-visionloss-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "When each eye is covered separately, does the change affect one eye, both eyes, or the same side of the visual field?" },
      { id: "oscg-visionloss-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there severe eye pain, a red eye, headache, nausea or vomiting, unequal pupils, eye injury, chemical exposure, recent eye surgery, or contact-lens use?" },
      { id: "oscg-visionloss-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there facial droop, arm or leg weakness or numbness, speech difficulty, severe imbalance, confusion, seizure, or severe sudden headache?" },
      { id: "oscg-visionloss-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a baby or child, is there a sudden failure to fix or follow, new abnormal eye movement or squint, white or absent red reflex, or caregiver concern that the child cannot see normally?" }
    ],
    questions: [
      {
        id: "oscg-visionloss-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden complete or partial vision loss in one or both eyes or a visual field; sudden severe eye pain, especially with red eye, headache, nausea or vomiting; or vision change with stroke signs, severe headache, seizure, eye trauma, or chemical exposure?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK treats sudden vision loss and sudden severe eye pain as emergencies. Associated focal neurological symptoms may indicate stroke, while a painful red eye with systemic symptoms may be another sight-threatening emergency. Children may not describe loss reliably, so a sudden objective change in visual behavior must fail closed.",
        redFlag: true,
        keywords: ["sudden blindness one eye", "partial visual field loss", "sudden severe eye pain", "red eye with vomiting", "vision change with stroke signs", "child suddenly cannot see"],
        careAdviceIds: ["oscg-visionloss-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-visionloss-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature above, is there new or worsening blur or double vision, first or suddenly increased flashes or floaters, a dark curtain or shadow, eye pain, red eye, light sensitivity, abnormal eye movement, or a persistent visual concern in a child?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK advises urgent assessment for new flashes, floaters, dark curtain or shadow, blur, pain, or other new changes because retinal and other ocular disease can permanently affect vision. Adults and children require an age-appropriate in-person examination.",
        redFlag: false,
        keywords: ["dark shadow across vision", "double vision", "eyes hurt in bright light"],
        careAdviceIds: ["oscg-visionloss-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-visionloss-emergency-advice", titleEn: "Qatar emergency vision response", instructionTextEn: "Call Qatar emergency services on 999 and record the exact last-known-normal time. Do not allow the person to drive, eat or drink while emergency assessment is being arranged, or put unprescribed drops or medication in the eye. Keep them safely supervised. For a chemical splash without suspected penetration, protect the rescuer, remove contact lenses only if easy, and immediately rinse the open eye with a gentle flow of clean, room-temperature water for at least 20 minutes; continue irrigation while help is arranged and take the product container without delaying care. Do not try to neutralize the chemical. If penetration, an embedded object, a cut, fluid leak, or open-globe injury is possible, do not irrigate, rub, press, patch, remove the object, or put drops or ointment in the eye; loosely protect it without pressure. Do not delay emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision does not return", "pain worsens", "stroke sign", "vomiting or reduced consciousness", "new seizure"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-visionloss-urgent-advice", titleEn: "Urgent age-appropriate ophthalmic assessment", instructionTextEn: "Arrange same-day in-person assessment through an approved Qatar adult or pediatric ophthalmology pathway. Do not drive while vision is affected. Avoid contact lenses and unprescribed eye drops. Call 999 immediately for sudden loss, severe pain, stroke signs, severe headache, vomiting, confusion, seizure, or rapid worsening.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["sudden or complete vision loss", "severe eye pain", "stroke signs", "rapid worsening", "child stops fixing, following, or using an eye"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-08-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Vision loss\", https://www.nhs.uk/conditions/vision-loss/ (page last reviewed 28 August 2025)",
        "NHS.UK, \"Floaters and flashes in the eyes\", https://www.nhs.uk/symptoms/floaters-and-flashes-in-the-eyes/ (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric workflow draft. Sudden loss, severe painful eye disease, or neurological emergency routes directly to 999. GOVERNANCE_REQUIRED for Qatar adult and pediatric ophthalmology destinations, pediatric visual-behavior thresholds, stroke/ophthalmology handover, medication, and non-emergency transport. Blocked from nurse UAT pending Qatar emergency, stroke, adult ophthalmology, and pediatric ophthalmology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 5. Vomiting Blood - https://www.nhs.uk/conditions/vomiting-blood/ (reviewed 2025-08-18)
  // ------------------------------------------------------------------
  {
    id: "oscg-vomiting-blood",
    titleEn: "Vomiting Blood",
    clinicalDefinitionEn: "UAT-only adult and pediatric assessment of suspected haematemesis, distinguishing active gastrointestinal bleeding and shock from a resolved small episode that still requires urgent in-person assessment.",
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
      { id: "oscg-vomitblood-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Was blood definitely vomited rather than coughed up or spat out, and was it bright red, dark, brown or black, coffee-ground-like, streaked, clotted, or mixed with food?" },
      { id: "oscg-vomitblood-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "When did it start, how many episodes occurred, what is the estimated maximum amount, and is bleeding continuing?" },
      { id: "oscg-vomitblood-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there black or bloody stool, abdominal pain or swelling, repeated retching, nosebleed or mouth bleeding, recent injury or procedure, or possible swallowed blood?" },
      { id: "oscg-vomitblood-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is the person faint, dizzy, confused, cold or clammy, pale, very weak, breathing rapidly, difficult to wake, or collapsed?" },
      { id: "oscg-vomitblood-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "Is there known liver disease, ulcer, bleeding disorder, pregnancy or recent birth, or use of anticoagulants, aspirin, ibuprofen or another anti-inflammatory medicine?" },
      { id: "oscg-vomitblood-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a baby or child, is there poor feeding, reduced wet nappies or urine, abnormal sleepiness, inconsolability, breathing change, bruising, or a caregiver concern that the child is significantly unwell?" }
    ],
    questions: [
      {
        id: "oscg-vomitblood-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is blood being vomited now or repeatedly, is there more than a small streak or coffee-ground vomit, or is there confusion, faintness, collapse, rapid or difficult breathing, cold clammy pallor, severe weakness, abdominal pain or swelling, black or bloody stool, reduced responsiveness, or a significantly unwell baby or child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK requires emergency assessment when an adult or child has haematemesis with systemic illness, confusion, faintness, abnormal breathing, cold clammy pallor, abdominal pain, or black stool. Ongoing or substantial bleeding and pediatric deterioration fail closed to Qatar 999.",
        redFlag: true,
        keywords: ["ongoing vomiting blood", "coffee ground vomit", "faint after vomiting blood", "black stool", "cold clammy pallor", "unwell child vomiting blood"],
        careAdviceIds: ["oscg-vomitblood-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-vomitblood-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has a small episode stopped completely, with none of the emergency features above and the person currently alert, breathing normally, and clinically stable?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK requires urgent clinical review even after haematemesis stops and no other symptoms remain. A child requires an age-appropriate in-person assessment; swallowed blood is a possible explanation but must not be assumed remotely.",
        redFlag: false,
        keywords: ["vomited blood once stopped now"],
        careAdviceIds: ["oscg-vomitblood-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vomitblood-emergency-advice", titleEn: "Qatar gastrointestinal-bleeding emergency response", instructionTextEn: "Call Qatar emergency services on 999. Do not allow the person to drive, eat, drink, or take non-prescribed medicine. Keep them still and warm; if drowsy or vomiting, position them on their side while maintaining the airway unless injury prevents it. Gather medicines and relevant records without delaying care. Do not stop prescribed anticoagulants or other essential medicines unless the emergency clinician directs this, but report all recent doses.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["more blood or coffee-ground vomit", "fainting or collapse", "cold clammy pallor", "black or bloody stool", "increasing abdominal pain", "reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vomitblood-urgent-advice", titleEn: "Urgent in-person haematemesis assessment", instructionTextEn: "Arrange urgent same-day in-person assessment through an approved Qatar adult or pediatric pathway even though bleeding stopped. Do not take additional aspirin, ibuprofen, or another non-prescribed anti-inflammatory medicine while awaiting advice. Do not stop prescribed anticoagulants or other essential medicines unless a clinician directs it. Call 999 if bleeding recurs or faintness, pallor, breathing change, black stool, abdominal pain, weakness, or reduced responsiveness develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vomiting blood recurs", "black or bloody stool", "faintness or pallor", "breathing change", "child becomes sleepy or feeds poorly"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-08-18", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Vomiting blood\", https://www.nhs.uk/symptoms/vomiting-blood/ (page last reviewed 18 August 2025)",
        "NHS.UK, \"First aid: shock\", https://www.nhs.uk/tests-and-treatments/first-aid/ (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric workflow draft. Ongoing or substantial bleeding, shock, or an unwell child routes directly to 999; every resolved episode still requires urgent in-person assessment. GOVERNANCE_REQUIRED for exact Qatar adult gastroenterology, pediatric, maternity, transfusion, anticoagulant-reversal, and same-day destinations. Blocked from nurse UAT pending Qatar emergency, adult gastrointestinal, pediatric, obstetric, and haematology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 6. Urine - Blood In - https://www.nhs.uk/conditions/blood-in-urine/ (reviewed 2023-05-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-blood-in-urine",
    titleEn: "Urine - Blood In",
    clinicalDefinitionEn: "UAT-only adult and pediatric assessment of reported visible blood in urine, separating life-threatening bleeding, retention/obstruction, infection, trauma and pregnancy-related concerns from stable haematuria that still requires in-person testing.",
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
      { id: "oscg-bloodurine-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Is blood definitely mixed with urine, and is it pink, red or dark brown, streaked, clotted, or causing heavy bleeding? Could it instead be vaginal/menstrual, rectal, skin or genital bleeding?" },
      { id: "oscg-bloodurine-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When was it first and last seen, how many times, and is it continuing or increasing?" },
      { id: "oscg-bloodurine-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there inability to urinate, only drops despite a full painful bladder, clots, severe side/back/abdominal/groin pain, fever or rigors, vomiting, reduced urine, swelling, confusion, faintness, pallor, or serious illness?" },
      { id: "oscg-bloodurine-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Was there recent abdominal, back, pelvic or genital trauma, a procedure or catheter problem, strenuous exercise, or possible foreign body?" },
      { id: "oscg-bloodurine-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's age and anatomy, and are they pregnant or recently postpartum, taking anticoagulant/antiplatelet medicines, or known to have kidney, urinary, bleeding, immune or cancer conditions?" },
      { id: "oscg-bloodurine-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a child or adolescent, is there fever, abdominal mass/swelling, bruising, genital injury/discharge, reduced urine, marked distress, or any privacy or safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-bloodurine-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there heavy or ongoing bleeding, clots with inability to urinate or painful bladder distension, fainting/shock, severe illness or confusion, severe trauma, severe flank/abdominal pain with vomiting or reduced urine, or an unwell infant or child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Heavy bleeding, clot retention, shock, serious infection, obstruction and significant urinary-tract trauma require emergency assessment. A child may deteriorate without being able to describe symptoms reliably.",
        redFlag: true,
        keywords: ["heavy blood in urine", "blood clots cannot urinate", "urinary retention", "shock", "severe trauma", "unwell child"],
        careAdviceIds: ["oscg-bloodurine-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bloodurine-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any possible visible blood in urine, including a first, single, painless or small episode, or blood with dysuria, fever, flank pain, pregnancy/postpartum status, anticoagulant use, recent trauma, or childhood?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK advises prompt assessment of any visible haematuria. Urine testing and sometimes blood tests, examination or imaging are needed; food, medicines or menstruation must not be assumed to explain it remotely. Unexplained visible haematuria in a child warrants very urgent specialist assessment under NICE suspected-cancer guidance.",
        redFlag: false,
        keywords: ["any blood in urine", "pink red or brown urine", "painless haematuria", "child visible haematuria"],
        careAdviceIds: ["oscg-bloodurine-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bloodurine-emergency-advice", titleEn: "Qatar urinary-bleeding emergency response", instructionTextEn: "Call Qatar emergency services on 999. Do not allow self-driving. Do not force fluids when urine cannot pass, the bladder is painfully full, vomiting is ongoing, or emergency assessment is required. Do not insert, flush or manipulate a catheter unless specifically trained and directed. Report prescribed anticoagulant/antiplatelet medicines, but do not stop them unless the emergency clinician directs it.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["increasing bleeding or clots", "cannot urinate", "fainting or confusion", "worsening pain", "reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bloodurine-urgent-advice", titleEn: "Prompt in-person haematuria assessment", instructionTextEn: "Arrange prompt in-person assessment through an approved Qatar adult or pediatric pathway for urine testing and clinician-directed examination, blood tests or imaging. Do not assume food, menstruation or medicine is the cause and do not start leftover antibiotics. Children with unexplained visible blood need a very urgent age-appropriate pathway. Call 999 for heavy bleeding, clots with retention, severe pain/illness, fainting, confusion or deterioration. The exact Qatar non-emergency urology, nephrology, pediatric, maternity and trauma destinations are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["heavy bleeding or clots", "cannot urinate", "fever or rigors", "flank pain or vomiting", "reduced urine", "child becomes unwell"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Blood in urine\", https://www.nhs.uk/symptoms/blood-in-urine/ (accessed 2026-07-25)",
        "NICE NG12, \"Suspected cancer: recognition and referral\", recommendations for visible haematuria in adults and children (updated 2026)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric workflow draft. Heavy bleeding, clot retention, shock, serious infection, obstruction or trauma routes to 999; every possible visible-haematuria episode requires in-person assessment. GOVERNANCE_REQUIRED for Qatar adult urology/nephrology, pediatric very-urgent haematuria, maternity/postpartum, trauma, catheter, anticoagulant and cancer-referral pathways. Blocked from nurse UAT pending Qatar emergency, urology, nephrology, pediatric, obstetric and oncology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 7. Urination Pain - Female - https://www.nhs.uk/conditions/cystitis/ (reviewed 2025-07-11)
  // ------------------------------------------------------------------
  {
    id: "oscg-urination-pain-female",
    titleEn: "Urination Pain - Female",
    clinicalDefinitionEn: "UAT-only adult and pediatric pathway for dysuria in patients with female urinary/reproductive anatomy, distinguishing sepsis, pyelonephritis, retention/obstruction, pregnancy/postpartum and genital or STI-related causes from possible lower UTI.",
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
      { id: "oscg-urinepainf-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe burning or pain, frequency, urgency, urine amount/flow, blood/cloudiness/odor, lower abdominal pain, and when symptoms began." },
      { id: "oscg-urinepainf-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature if measured, and are there rigors, flank/back pain, nausea, vomiting, confusion, weakness or reduced urine?" },
      { id: "oscg-urinepainf-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the patient pregnant, possibly pregnant, within 6 weeks after birth, diabetic, immunocompromised, catheterized, or known to have kidney/urinary abnormalities?" },
      { id: "oscg-urinepainf-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there inability to urinate, painful bladder fullness, severe one-sided pain, recent urinary/pelvic trauma or procedure, or catheter blockage/dislodgement?" },
      { id: "oscg-urinepainf-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there vaginal/vulval pain, itching, sores, discharge, bleeding, pelvic pain, pain during sex, or possible STI exposure?" },
      { id: "oscg-urinepainf-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a child or adolescent, is there fever, vomiting, poor feeding, reduced wet nappies/urine, new wetting, abdominal/back pain, genital symptoms, or any privacy or safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-urinepainf-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with urinary symptoms, is there confusion, difficult waking, fainting, fast or difficult breathing, mottled/pale skin, severe weakness, very high or low temperature, inability to keep fluids down, very low urine output, severe or rapidly worsening pain, or a seriously unwell infant or child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These may indicate sepsis, severe pyelonephritis, acute kidney injury or another time-critical illness. Temperature alone neither confirms nor excludes sepsis.",
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
        questionTextEn: "Is there fever/rigors, flank or back pain, vomiting, blood in urine, inability or marked difficulty urinating, pregnancy/possible pregnancy or recent birth, age under 16 or 65+, catheter, diabetes/immunosuppression, urinary abnormality, recurrent symptoms, genital discharge/sores/pelvic pain, or no improvement within 48 hours of clinician-prescribed treatment?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "These features require same-day in-person assessment for upper/complicated UTI, retention/obstruction, pregnancy complications or another diagnosis. Children require age-specific urine testing; genital symptoms may require confidential STI/reproductive assessment rather than empirical UTI treatment.",
        redFlag: false,
        keywords: ["uti with fever", "uti not improving after 2 days", "blood in urine with uti symptoms"],
        careAdviceIds: ["oscg-urinepainf-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-urinepainf-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "For a non-pregnant adult with mild isolated dysuria and no red flag, has urine testing or an approved Qatar lower-UTI assessment pathway not yet confirmed that self-care or delayed prescribing is appropriate?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Dysuria is not specific to cystitis. This UAT telephone pathway does not prescribe antibiotics, set unsafe delay thresholds, or exclude pregnancy, pyelonephritis, STI, vaginitis, obstruction or other causes without in-person testing and local governance.",
        redFlag: false,
        keywords: ["mild uti symptoms"],
        careAdviceIds: ["oscg-urinepainf-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-urinepainf-emergency-advice", titleEn: "Qatar urinary emergency response", instructionTextEn: "Call Qatar emergency services on 999 and do not allow self-driving. Keep the person safely supervised. Do not force oral fluids if drowsy, vomiting, unable to swallow, unable to urinate or awaiting emergency assessment. Do not use leftover antibiotics or another person's medicine.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "breathing difficulty", "collapse", "very low urine", "worsening pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-urinepainf-urgent-advice", titleEn: "Same-day urinary and reproductive assessment", instructionTextEn: "Arrange same-day in-person assessment through an approved Qatar adult, maternity or pediatric pathway for urine sampling before antibiotics when feasible and clinician-directed examination/testing. Pregnancy or recent birth, fever/flank pain, retention, blood, catheter problems and genital symptoms require tailored review. Adolescents should be offered developmentally appropriate private time, within Qatar consent, confidentiality and safeguarding policy.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or rigors", "back or flank pain", "vomiting", "cannot urinate", "blood in urine", "becomes very unwell"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-urinepainf-selfcare-advice", titleEn: "Testing before a lower-UTI plan", instructionTextEn: "Until assessed, rest and drink normally to thirst if fully alert and not vomiting or fluid-restricted. Do not force excessive fluids, start leftover antibiotics, use urinary alkalinizing products, or give fixed-dose/timed analgesia unless an approved Qatar clinician or protocol confirms age, weight, pregnancy, allergies, kidney function, interactions and maximum dose. The exact non-emergency destination and medicine pathway are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "fever or flank pain", "vomiting", "reduced urine", "pregnancy concern"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NICE NG109, \"Urinary tract infection (lower): antimicrobial prescribing\" (updated 2026)",
        "NICE NG111, \"Pyelonephritis (acute): antimicrobial prescribing\" (accessed 2026-07-25)",
        "CDC, \"Adolescents - STI Treatment Guidelines\" (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized pathway for adults and children with female urinary/reproductive anatomy. Sepsis or severe deterioration routes to 999; pregnancy/postpartum, pediatric illness, pyelonephritis, retention/obstruction, haematuria, catheter and genital/STI features require in-person testing. GOVERNANCE_REQUIRED for Qatar adult/pediatric UTI, maternity, urology, STI confidentiality/safeguarding, urine-testing, antimicrobial and analgesia pathways. Blocked from nurse UAT pending Qatar emergency, adult, pediatric, obstetric, urology, infectious-disease and safeguarding approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 8. Urination Pain - Male - https://www.nhs.uk/conditions/cystitis/ (reviewed 2025-07-11), male-specific tier
  // ------------------------------------------------------------------
  {
    id: "oscg-urination-pain-male",
    titleEn: "Urination Pain - Male",
    clinicalDefinitionEn: "UAT-only adult and pediatric pathway for dysuria in patients with male urinary/reproductive anatomy, distinguishing sepsis, pyelonephritis, retention/obstruction, acute scrotal pain, prostatitis, trauma and urethral/STI causes from possible lower UTI.",
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
      { id: "oscg-urinepainm-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe burning or pain, frequency, urgency, urine amount/flow, hesitancy, blood/cloudiness/odor, lower abdominal or perineal pain, and when symptoms began." },
      { id: "oscg-urinepainm-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature if measured, and are there rigors, flank/back pain, nausea, vomiting, confusion, weakness or reduced urine?" },
      { id: "oscg-urinepainm-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there sudden or severe testicular/scrotal pain or swelling, a high-riding or unusually positioned testis, genital injury, or groin/abdominal pain?" },
      { id: "oscg-urinepainm-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there inability to urinate, painful bladder fullness, severe one-sided pain, recent urinary/pelvic trauma or procedure, or catheter blockage/dislodgement?" },
      { id: "oscg-urinepainm-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there urethral discharge, penile pain/sores, pain with ejaculation, perineal/rectal pain, or possible STI exposure?" },
      { id: "oscg-urinepainm-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a child or adolescent, is there fever, vomiting, poor feeding, reduced wet nappies/urine, new wetting, genital symptoms/injury, marked distress, or any privacy or safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-urinepainm-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there confusion, difficult waking, fainting, fast or difficult breathing, mottled/pale skin, severe weakness, very high or low temperature, inability to keep fluids down, very low urine output, severe or rapidly worsening pain, or a seriously unwell infant or child; or sudden severe testicular/scrotal pain or swelling?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These may indicate sepsis, severe pyelonephritis, acute kidney injury or another time-critical illness. Sudden severe unilateral scrotal pain/swelling may be torsion and requires immediate surgical assessment; urinary symptoms must not delay that pathway.",
        redFlag: true,
        keywords: ["confused with urinary symptoms", "seriously unwell with urination pain", "sudden severe testicular pain", "scrotal swelling"],
        careAdviceIds: ["oscg-urinepainm-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-urinepainm-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any dysuria in a male, or fever/rigors, flank/back/perineal pain, vomiting, blood, reduced flow or retention, catheter, diabetes/immunosuppression, urinary abnormality, recurrent symptoms, genital discharge/sores, or no improvement within 48 hours of clinician-prescribed treatment?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Dysuria in male anatomy requires in-person assessment and urine testing to distinguish UTI, pyelonephritis, prostatitis, urethritis/STI, obstruction and other causes. Children need an age-specific pathway; adolescents need confidential, developmentally appropriate history and safeguarding assessment.",
        redFlag: false,
        keywords: ["testicular pain with urination pain", "discharge with painful urination", "blood in urine with urination pain"],
        careAdviceIds: ["oscg-urinepainm-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-urinepainm-emergency-advice", titleEn: "Qatar urinary or acute-scrotal emergency response", instructionTextEn: "Call Qatar emergency services on 999 and do not allow self-driving. Keep the person safely supervised. Do not give food or drink when urgent surgery may be needed for sudden severe scrotal pain, or force fluids if drowsy, vomiting, unable to swallow or unable to urinate. Do not manipulate the testis or catheter and do not use leftover antibiotics.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "breathing difficulty", "collapse", "very low urine", "increasing scrotal pain/swelling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-urinepainm-urgent-advice", titleEn: "Same-day urinary and genital assessment", instructionTextEn: "Arrange same-day in-person assessment through an approved Qatar adult or pediatric pathway for urine sampling before antibiotics when feasible and clinician-directed genital, prostate or STI testing as indicated. Adolescents should be offered developmentally appropriate private time, within Qatar consent, confidentiality and safeguarding policy. Do not start leftover antibiotics or use fixed-dose/timed analgesia without an approved Qatar medicine pathway. Call 999 for sudden severe scrotal pain, retention, sepsis features or deterioration. Exact non-emergency destinations are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or rigors", "testicular pain develops or worsens", "vomiting", "cannot urinate", "blood in urine", "becomes very unwell"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NICE NG109, \"Urinary tract infection (lower): antimicrobial prescribing\" (updated 2026)",
        "NICE NG111, \"Pyelonephritis (acute): antimicrobial prescribing\" (accessed 2026-07-25)",
        "CDC, \"Urethritis and Cervicitis - STI Treatment Guidelines\" and \"Adolescents - STI Treatment Guidelines\" (accessed 2026-07-25)"
      ],
      contentNotice: "SOURCE-ONLY UAT DATA - no generated variant exists in the current 504-protocol catalog. Qatar-localized pathway for adults and children with male urinary/reproductive anatomy. Sepsis, severe deterioration or acute scrotal emergency routes to 999; all male dysuria requires in-person assessment. GOVERNANCE_REQUIRED for Qatar adult/pediatric urinary, acute-scrotal, urology, STI confidentiality/safeguarding, urine-testing, antimicrobial and analgesia pathways. Prohibited from production use and not licensed Schmitt-Thompson content."
    })
  },

  // ------------------------------------------------------------------
  // 9. Heat Exposure (Heat Exhaustion and Heat Stroke) - https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/ (reviewed 2026-05-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-heat-exposure",
    titleEn: "Heat Exposure (Heat Exhaustion and Heat Stroke)",
    clinicalDefinitionEn: "UAT-only Qatar adult and pediatric assessment separating heatstroke or other severe heat illness from heat exhaustion; sweating does not exclude heatstroke.",
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
      { id: "oscg-heatexposure-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's age, exact location, activity, clothing or protective equipment, medical conditions, pregnancy status, medicines, and access to air conditioning or shade?" },
      { id: "oscg-heatexposure-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long was the heat exposure, when did symptoms begin, and how long have active cooling measures been used?" },
      { id: "oscg-heatexposure-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "What is the measured temperature, by which method? Do not delay emergency action to obtain a temperature." },
      { id: "oscg-heatexposure-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there confusion, unusual behavior, slurred speech, poor coordination, collapse, seizure, reduced consciousness, severe breathing difficulty, or inability to drink safely?" },
      { id: "oscg-heatexposure-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "Is the skin hot, dry or sweaty, and are there headache, dizziness, nausea, vomiting, cramps, heavy sweating, weakness, thirst, fast breathing, or a rapid pulse?" },
      { id: "oscg-heatexposure-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a baby or child, is there reduced feeding, fewer wet nappies or less urine, no tears, sunken eyes or fontanelle, unusual sleepiness, irritability, or reduced responsiveness?" }
    ],
    questions: [
      {
        id: "oscg-heatexposure-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "After heat exposure, is there confusion, altered behavior, slurred speech, poor coordination, seizure, collapse or reduced consciousness, very high temperature, hot skin whether dry or still sweating, severe breathing difficulty, inability to drink safely, or no clear improvement after 30 minutes of active cooling?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Heatstroke is a time-critical emergency defined clinically by central nervous system dysfunction after heat exposure; sweating may continue and must not be used to rule it out. NHS.UK and CDC guidance require immediate emergency help and rapid cooling. A measured temperature is supportive but emergency action must not wait for it.",
        redFlag: true,
        keywords: ["confused from heat", "poor coordination from heat", "heat seizure", "unconscious from heat", "hot skin sweating or dry", "not improving with cooling"],
        careAdviceIds: ["oscg-heatexposure-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-heatexposure-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no heatstroke feature, is there vomiting, inability to maintain oral fluids, worsening symptoms, significant dehydration, persistent symptoms despite cooling, or increased vulnerability such as infancy, pregnancy, older age, chronic heart or kidney disease, or medicines that impair heat tolerance?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Heat exhaustion that worsens, prevents safe hydration, or does not improve promptly can progress to heatstroke. Babies, children, pregnant people, older adults, and people with relevant chronic illness or medicines require a lower threshold for age-appropriate clinical assessment.",
        redFlag: false,
        keywords: ["heat exhaustion not improving"],
        careAdviceIds: ["oscg-heatexposure-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-heatexposure-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is the person fully alert, improving promptly in a cool place, able to drink without vomiting, and experiencing only mild heat-exhaustion symptoms such as heavy sweating, thirst, headache, dizziness, weakness, nausea, or cramps, with none of the emergency or urgent features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes early heat exhaustion as manageable at home with cooling measures and usually resolves within 30 minutes.",
        redFlag: false,
        keywords: ["early heat exhaustion symptoms"],
        careAdviceIds: ["oscg-heatexposure-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-heatexposure-emergency-advice", titleEn: "Qatar heatstroke emergency cooling", instructionTextEn: "Call Qatar emergency services on 999 and do not allow the person to drive. Move them to shade or air conditioning, remove excess outer clothing and equipment, wet the skin with cool water, apply cool wet cloths, and fan continuously while awaiting help. Follow 999 instructions about more intensive cooling. Do not give anything by mouth if confused, drowsy, seizing, vomiting repeatedly, or unable to swallow safely. If unconscious but breathing, use the recovery position; if not breathing normally, start CPR if trained. Do not give fever medicine such as paracetamol or ibuprofen to treat heatstroke.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["confusion or abnormal behavior", "seizure", "loss of consciousness", "very high temperature", "breathing difficulty", "no improvement with cooling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-heatexposure-urgent-advice", titleEn: "Urgent heat-exhaustion assessment", instructionTextEn: "Continue active cooling in shade or air conditioning and arrange prompt age-appropriate in-person assessment through an approved Qatar route. Give small frequent sips of cool water or an appropriate oral rehydration drink only when fully alert and swallowing normally. Do not use salt tablets or give an infant sports drinks. Call 999 if confusion, reduced consciousness, seizure, severe breathing difficulty, inability to drink, or failure to improve within 30 minutes develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["confusion develops", "vomiting prevents drinking", "reduced urine", "symptoms worsen", "not improving within 30 minutes"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-heatexposure-selfcare-advice", titleEn: "Closely monitored cooling for mild heat exhaustion", instructionTextEn: "Move to shade or air conditioning, stop activity, remove excess clothing, cool the skin with cool water and fanning, and give small frequent sips of cool water or an age-appropriate oral rehydration drink while fully alert. A responsible adult should monitor a child continuously. Do not return to heat or strenuous activity that day. Call 999 for any altered behavior, collapse, seizure, severe breathing difficulty, or failure to improve within 30 minutes.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving within 30 minutes", "confusion or unusual behavior", "vomiting or inability to drink", "reduced responsiveness", "reduced urine"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-05-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Heat exhaustion and heatstroke\", https://www.nhs.uk/conditions/heat-exhaustion-heatstroke/ (page last reviewed 28 May 2026)",
        "US CDC/NIOSH, \"Heat-related illnesses\", https://www.cdc.gov/niosh/heat-stress/about/illnesses.html (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric workflow draft. Altered mental status after heat exposure is heatstroke until assessed, and ongoing sweating does not exclude it. Emergency cooling starts while 999 is called. GOVERNANCE_REQUIRED for Qatar adult and pediatric heat-illness destinations, occupational and sports-event escalation, infant oral-fluid rules, pregnancy, chronic-disease and medicine risk, cooling resources, and return-to-work or activity policy. Blocked from nurse UAT pending Qatar emergency, adult, pediatric, obstetric, occupational-health, and sports-medicine approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-woundinfection-emergency-advice", titleEn: "Emergency wound-infection precautions", instructionTextEn: "Call Qatar 999 now, do not allow self-driving, and do not squeeze, probe, cut, or apply caustic products. Keep the wound loosely covered and follow call-handler instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["confusion, collapse, breathing change, black skin, severe pain, or rapidly spreading redness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-woundinfection-urgent-advice", titleEn: "Prompt in-person wound assessment", instructionTextEn: "Use the Qatar governance-approved in-person service. Do not use leftover antibiotics or close an infected wound. Clinician review must address wound type, retained material, bite or injection, tetanus/rabies, diabetes, circulation, immune suppression, pregnancy and age.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness, swelling or pain, pus, fever, numbness, reduced movement, or red streaking"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-woundinfection-selfcare-advice", titleEn: "Home monitoring for mild wound redness", instructionTextEn: "Keep the wound clean and covered with a dressing, wash hands before and after care, and watch closely for the next day or two.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness spreads", "pus, fever, or worsening pain develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Boils\" and \"Cuts and grazes\" (skin-infection red-flag criteria, already cited for the Boil, Sores, and Skin Injury protocols), applied specifically to a suspected-wound-infection presentation"],
      contentNotice: "SOURCE-ONLY UAT synthesis; no generated variant exists in the current 504-protocol catalog. Qatar sepsis, necrotising infection, wound, bite, injection, tetanus/rabies, diabetes, circulation, immunocompromise, pregnancy, pediatric, antimicrobial and safeguarding routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  }
];

const batch14ChildSafeguardingProtocolIds = new Set([
  "oscg-wrist-injury"
]);

export const batch14Protocols: ProtocolInput[] =
  batch14ProtocolDefinitions.map((protocol) =>
    batch14ChildSafeguardingProtocolIds.has(protocol.id)
      ? addChildSafeguardingUatBranches(protocol)
      : protocol
  );
