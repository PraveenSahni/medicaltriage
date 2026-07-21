import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 19 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence) where available, plus standard, non-proprietary medical/first-aid
 * knowledge where a specific NHS.UK page could not be retrieved (Bruises,
 * Drowning and Submersion Event, Electric Shock or Lightning Injury). Groin
 * Injury and Strain generalizes the fracture/strain red-flag pattern already
 * established for Arm/Leg Pain (batch15) and limb injuries. Eyelid Swelling
 * reuses the eye-injury/allergy emergency criteria already cited for Eye
 * Injury (batch13) and Eye - Allergy (batch07).
 */
export const batch19Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Eye - Redness - https://www.nhs.uk/conditions/red-eye/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-redness",
    titleEn: "Eye - Redness",
    clinicalDefinitionEn: "Red eye assessment decomposed from NHS.UK's published red eye guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "red eye", weight: 100 },
      { phrase: "eye is really red", weight: 95 },
      { phrase: "bloodshot eye", weight: 90 },
      { phrase: "whites of my eye are red", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyeredness-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the eye been red?" },
      { id: "oscg-eyeredness-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any vision change, pain, or discharge?" },
      { id: "oscg-eyeredness-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the person wear contact lenses?" }
    ],
    questions: [
      {
        id: "oscg-eyeredness-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the red eye, is there vision change (wavy lines, flashing, loss of vision), severe light sensitivity, a severe headache with nausea, very dark redness, an eye injury or object in the eye, chemical exposure, or unequal pupil sizes?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK red eye guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["red eye with vision change", "red eye with severe headache", "chemical in red eye"],
        careAdviceIds: ["oscg-eyeredness-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyeredness-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is a baby under 28 days old affected, is the eye very painful and red, or is there redness with contact lens wear?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent GP, optician, or NHS 111 contact for these situations - contact-lens-related redness can indicate a serious infection.",
        redFlag: false,
        keywords: ["newborn red eyes", "very painful red eye", "red eye with contact lenses"],
        careAdviceIds: ["oscg-eyeredness-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-eyeredness-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild redness with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild red eye as often resolving within a few days.",
        redFlag: false,
        keywords: ["mild eye redness"],
        careAdviceIds: ["oscg-eyeredness-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyeredness-emergency-advice", titleEn: "Emergency red eye precautions", instructionTextEn: "Do not rub or press the eye, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening vision", "worsening pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeredness-urgent-advice", titleEn: "Urgent red eye review", instructionTextEn: "Stop wearing contact lenses and arrange same-day medical or eye-care review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "vision changes develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeredness-selfcare-advice", titleEn: "Home care for mild eye redness", instructionTextEn: "Avoid touching or rubbing the eye and stop wearing contact lenses until it clears. It should improve within a few days.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["persists beyond a few days", "sticky discharge or pain develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Red eye\", https://www.nhs.uk/conditions/red-eye/ (page last reviewed 27 October 2025)"],
      contentNotice: "Decomposed from NHS.UK's published red eye guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Blood Pressure - Low - https://www.nhs.uk/conditions/low-blood-pressure-hypotension/ (reviewed 2023-07-11)
  // ------------------------------------------------------------------
  {
    id: "oscg-blood-pressure-low",
    titleEn: "Blood Pressure - Low",
    clinicalDefinitionEn: "Low blood pressure (hypotension) symptom assessment decomposed from NHS.UK's published low blood pressure guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "low blood pressure", weight: 100 },
      { phrase: "blood pressure dropped", weight: 95 },
      { phrase: "hypotension symptoms", weight: 90 },
      { phrase: "feel dizzy when i stand up low bp", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-lowbp-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the blood pressure reading, if measured?" },
      { id: "oscg-lowbp-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any fainting or loss of consciousness?" },
      { id: "oscg-lowbp-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long has this been happening?" }
    ],
    questions: [
      {
        id: "oscg-lowbp-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has the person fainted or lost consciousness, or are there signs of shock such as cold clammy skin, confusion, or a very weak or rapid pulse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Loss of consciousness or shock signs with low blood pressure are recognized emergencies requiring immediate care.",
        redFlag: true,
        keywords: ["fainted with low blood pressure", "signs of shock low bp"],
        careAdviceIds: ["oscg-lowbp-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-lowbp-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the person keep getting symptoms of low blood pressure such as dizziness, near-fainting, blurred vision, weakness, or confusion?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK low blood pressure guidance recommends seeing a GP for recurring symptoms.",
        redFlag: false,
        keywords: ["recurring low blood pressure symptoms"],
        careAdviceIds: ["oscg-lowbp-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-lowbp-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild, occasional episode with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes simple lifestyle measures as usually sufficient for mild, occasional low blood pressure symptoms.",
        redFlag: false,
        keywords: ["mild occasional low blood pressure symptoms"],
        careAdviceIds: ["oscg-lowbp-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lowbp-emergency-advice", titleEn: "Emergency low blood pressure precautions", instructionTextEn: "Help the person lie down with legs raised if possible and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["does not regain consciousness", "worsening confusion"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lowbp-urgent-advice", titleEn: "Urgent low blood pressure review", instructionTextEn: "Arrange a GP appointment - medications or an underlying cause may need adjusting.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fainting occurs", "symptoms worsen"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-lowbp-selfcare-advice", titleEn: "Home care for mild low blood pressure symptoms", instructionTextEn: "Get up slowly from sitting to standing, and rise gradually from lying down (lying to sitting to standing). Eat small, frequent meals and rest afterward, drink more water, and avoid standing still for long periods, sudden position changes, or excess alcohol.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms become frequent", "fainting occurs"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Low blood pressure (hypotension)\", https://www.nhs.uk/conditions/low-blood-pressure-hypotension/ (page last reviewed 11 July 2023)"],
      contentNotice: "Decomposed from NHS.UK's published low blood pressure guidance (Crown copyright, reused under the Open Government Licence). The source page does not itself define an emergency tier, so this adds standard, widely-taught shock/loss-of-consciousness recognition (not a direct quote). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Influenza (Flu) Suspected - https://www.nhs.uk/conditions/flu/ (reviewed 2026-02-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-influenza-suspected",
    titleEn: "Influenza (Flu) Suspected",
    clinicalDefinitionEn: "Suspected influenza (flu) assessment decomposed from NHS.UK's published flu guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "think i have the flu", weight: 100 },
      { phrase: "flu symptoms", weight: 100 },
      { phrase: "body aches and fever flu", weight: 90 },
      { phrase: "influenza symptoms", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-flususpected-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-flususpected-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-flususpected-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any chronic conditions, pregnancy, or age 65+?" }
    ],
    questions: [
      {
        id: "oscg-flususpected-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden chest pain, severe difficulty breathing (gasping, choking, unable to get words out), or coughing up blood?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK flu guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["chest pain with flu", "coughing up blood with flu", "cant breathe with flu"],
        careAdviceIds: ["oscg-flususpected-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-flususpected-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person 65 or older, pregnant or recently gave birth, living with a long-term condition or weakened immune system, feeling very unwell or short of breath, or have symptoms not improved after 7 days?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent GP or NHS 111 contact for these higher-risk groups or persistent symptoms.",
        redFlag: false,
        keywords: ["flu not improving after a week", "pregnant with flu symptoms", "flu with chronic condition"],
        careAdviceIds: ["oscg-flususpected-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-flususpected-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these typical flu symptoms with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes rest and fluids as appropriate first-line self-care for flu.",
        redFlag: false,
        keywords: ["typical flu symptoms"],
        careAdviceIds: ["oscg-flususpected-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-flususpected-emergency-advice", titleEn: "Emergency flu-complication precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing", "more blood in phlegm"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-flususpected-urgent-advice", titleEn: "Urgent flu review for higher-risk groups", instructionTextEn: "Arrange same-day medical review given the higher-risk factors present.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "breathing difficulty develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-flususpected-selfcare-advice", titleEn: "Home care for typical flu", instructionTextEn: "Rest and sleep, take paracetamol or ibuprofen for fever and aches, and drink plenty of water to avoid dehydration. Avoid contact with others while infectious (usually the first 5 days), and do not expect antibiotics to help, since flu is viral.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms don't improve after 7 days", "breathing difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Flu\", https://www.nhs.uk/conditions/flu/ (page last reviewed 03 February 2026)"],
      contentNotice: "Decomposed from NHS.UK's published flu guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Hernia - https://www.nhs.uk/conditions/hernia/ (reviewed 2026-05-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-hernia",
    titleEn: "Hernia",
    clinicalDefinitionEn: "Hernia assessment decomposed from NHS.UK's published hernia guidance, including its strangulation warning signs.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "hernia", weight: 100 },
      { phrase: "bulge in my groin", weight: 90 },
      { phrase: "lump near my belly button", weight: 85 },
      { phrase: "think i have a hernia", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hernia-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the bulge or lump?" },
      { id: "oscg-hernia-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been present?" },
      { id: "oscg-hernia-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is it painful, and can it be pushed back in?" }
    ],
    questions: [
      {
        id: "oscg-hernia-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there pain in or around the hernia, a bloated tummy, constipation, nausea or vomiting (especially vomiting blood or coffee-ground vomit), a high temperature or feeling hot/cold/shivery, or sudden confusion?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK hernia guidance lists these as signs that may indicate strangulation (the hernia cutting off blood supply to trapped tissue) and require urgent NHS 111 or emergency contact.",
        redFlag: true,
        keywords: ["hernia with severe pain", "hernia with vomiting", "hernia bulge wont go back in and painful"],
        careAdviceIds: ["oscg-hernia-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hernia-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is this a painless or mildly uncomfortable bulge that reduces (goes back in) easily, with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP appointment for a suspected hernia to confirm the diagnosis and discuss options.",
        redFlag: false,
        keywords: ["painless reducible hernia bulge"],
        careAdviceIds: ["oscg-hernia-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hernia-urgent-advice", titleEn: "Urgent hernia (possible strangulation) precautions", instructionTextEn: "Do not try to forcefully push the bulge back in. Arrange same-day emergency medical review - these features can indicate a surgical emergency.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening pain", "vomiting continues"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hernia-routine-advice", titleEn: "Routine hernia follow-up", instructionTextEn: "Book a GP appointment to confirm the diagnosis. Maintaining a healthy weight, staying active (about 150 minutes of moderate activity weekly), not smoking, and getting a persistent cough checked can all help.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["pain, swelling, or vomiting develops", "the bulge stops reducing"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-05-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hernia\", https://www.nhs.uk/conditions/hernia/ (page last reviewed 19 May 2026)"],
      contentNotice: "Decomposed from NHS.UK's published hernia guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Blister - Foot and Hand - https://www.nhs.uk/conditions/blisters/ (reviewed 2023-11-22)
  // ------------------------------------------------------------------
  {
    id: "oscg-blister-foot-hand",
    titleEn: "Blister - Foot and Hand",
    clinicalDefinitionEn: "Foot and hand blister assessment decomposed from NHS.UK's published blister guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "blister on my foot", weight: 100 },
      { phrase: "blister on my hand", weight: 100 },
      { phrase: "got a blister from new shoes", weight: 90 },
      { phrase: "blister from friction", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-blister-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the blister?" },
      { id: "oscg-blister-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What caused it?" },
      { id: "oscg-blister-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any redness, pus, or increasing pain?" }
    ],
    questions: [
      {
        id: "oscg-blister-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the blister severely painful or recurring, does the surrounding skin look hot and infected with green/yellow pus, is there spreading redness, is it in an unusual location (eyelid, mouth, genitals), are there multiple blisters without a clear cause, or did it result from a burn, scald, sunburn, or allergic reaction?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK blister guidance lists these as reasons to contact NHS 111 or a GP promptly.",
        redFlag: false,
        keywords: ["infected blister with pus", "blisters from a burn", "multiple blisters no clear cause"],
        careAdviceIds: ["oscg-blister-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-blister-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical friction blister from new shoes or repeated rubbing, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes typical friction blisters as manageable at home.",
        redFlag: false,
        keywords: ["typical friction blister"],
        careAdviceIds: ["oscg-blister-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-blister-urgent-advice", titleEn: "Urgent blister review", instructionTextEn: "Arrange same-day medical review for these signs of infection or an unusual cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-blister-selfcare-advice", titleEn: "Home care for a typical blister", instructionTextEn: "Keep the blister clean, gently wash and pat dry, and cover with a soft plaster or padded dressing. Do not burst it yourself; if it bursts on its own, let the fluid drain before covering, and don't peel off the skin. Avoid the shoes or activity that caused it until healed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "pain worsens"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-11-22", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Blisters\", https://www.nhs.uk/conditions/blisters/ (page last reviewed 22 November 2023)"],
      contentNotice: "Decomposed from NHS.UK's published blister guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Bruises - standard first-aid + unexplained-bruising red-flag knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-bruises",
    titleEn: "Bruises",
    clinicalDefinitionEn: "Bruise assessment based on standard first-aid knowledge, with unexplained or easy bruising treated as a red flag per widely-recognized hematology knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "bruise", weight: 100 },
      { phrase: "bruising easily", weight: 95 },
      { phrase: "unexplained bruises", weight: 95 },
      { phrase: "black and blue mark", weight: 85 },
      { phrase: "bruises showing up on my legs", weight: 100 },
      { phrase: "dont remember bumping into anything", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bruises-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the bruise?" },
      { id: "oscg-bruises-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Is there a known cause, or did it appear without injury?" },
      { id: "oscg-bruises-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any other unusual bleeding (nosebleeds, gum bleeding, blood in urine/stool)?" }
    ],
    questions: [
      {
        id: "oscg-bruises-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Are bruises appearing without a clear cause, bruising unusually easily, or is there other unexplained bleeding (nosebleeds, gum bleeding, blood in urine or stool)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Unexplained or easy bruising, especially with other bleeding, is a recognized red flag for a blood-clotting or platelet problem and warrants prompt medical evaluation - widely-taught hematology knowledge.",
        redFlag: false,
        keywords: ["bruises with no known cause", "bruising and bleeding gums"],
        careAdviceIds: ["oscg-bruises-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bruises-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical bruise with a known cause (bump or minor injury) and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A typical bruise from a known minor injury is manageable at home and resolves over 1-2 weeks.",
        redFlag: false,
        keywords: ["typical bruise from bump"],
        careAdviceIds: ["oscg-bruises-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bruises-urgent-advice", titleEn: "Urgent unexplained bruising review", instructionTextEn: "Arrange a prompt GP appointment to check for an underlying cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["more unexplained bruising or bleeding appears"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bruises-selfcare-advice", titleEn: "Home care for a typical bruise", instructionTextEn: "Apply a cold compress wrapped in a cloth for the first 10-20 minutes, rest and elevate the area if possible, and take paracetamol for pain if needed. Bruises typically fade over 1-2 weeks, changing color as they heal.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bruise doesn't fade after 2 weeks", "unexplained new bruises appear"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard first-aid bruise care knowledge combined with widely-taught hematology knowledge about unexplained/easy bruising as a bleeding-disorder red flag - the specific NHS.UK bruising page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK bruising page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary first-aid and hematology knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Drowning and Submersion Event - standard emergency medicine/resuscitation knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-drowning-submersion-event",
    titleEn: "Drowning and Submersion Event",
    clinicalDefinitionEn: "Drowning/submersion event assessment based on standard, universally-recognized emergency medicine and resuscitation knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "drowning", weight: 100 },
      { phrase: "almost drowned", weight: 100 },
      { phrase: "pulled out of the water not breathing", weight: 100 },
      { phrase: "went under water and swallowed a lot", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-drowning-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the person breathing and conscious now?" },
      { id: "oscg-drowning-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long was the person submerged or in distress?" },
      { id: "oscg-drowning-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Was CPR or rescue breathing needed?" }
    ],
    questions: [
      {
        id: "oscg-drowning-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Was there any submersion or near-drowning event, even if the person now seems to be breathing normally and acting fine?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Any drowning or near-drowning event is always treated as an emergency - widely-recognized emergency medicine knowledge, since water inhaled into the lungs can cause delayed breathing problems (secondary/dry drowning) hours after the initial event, even if the person looks fine immediately afterward.",
        redFlag: true,
        keywords: ["submersion event", "pulled from water", "near drowning"],
        careAdviceIds: ["oscg-drowning-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-drowning-emergency-advice", titleEn: "Emergency drowning/submersion precautions", instructionTextEn: "If not breathing, begin CPR immediately and continue until help arrives if trained to do so. Arrange emergency transport for everyone involved in any submersion event, even if they seem fully recovered - delayed breathing problems can develop hours later and need medical observation.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing difficulty develops later", "coughing, confusion, or extreme tiredness develops in the following hours"], displayOrder: 1, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized emergency medicine and resuscitation knowledge (delayed/secondary drowning risk, CPR) - the specific NHS.UK drowning page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK drowning page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary emergency medicine knowledge that any submersion event requires emergency medical evaluation regardless of apparent recovery. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, particularly relevant given Qatar's coastal/pool exposure."
    })
  },

  // ------------------------------------------------------------------
  // 8. Electric Shock or Lightning Injury - standard emergency medicine knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-electric-shock-lightning-injury",
    titleEn: "Electric Shock or Lightning Injury",
    clinicalDefinitionEn: "Electric shock or lightning injury assessment based on standard, universally-recognized emergency medicine and first-aid knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "electric shock", weight: 100 },
      { phrase: "got shocked by an outlet", weight: 95 },
      { phrase: "struck by lightning", weight: 100 },
      { phrase: "electrocuted", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-electricshock-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was the source (household current, high voltage, lightning)?" },
      { id: "oscg-electricshock-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person conscious and breathing normally?" },
      { id: "oscg-electricshock-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person still in contact with the electrical source?" }
    ],
    questions: [
      {
        id: "oscg-electricshock-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Was there any electric shock or lightning strike, especially involving high voltage, loss of consciousness, chest pain, irregular heartbeat, burns, or muscle pain/weakness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Widely-recognized emergency medicine knowledge: electric shock and lightning injuries can cause life-threatening heart rhythm disturbances and internal injuries that are not obvious from the outside, so any significant shock is treated as an emergency.",
        redFlag: true,
        keywords: ["electric shock unconscious", "lightning strike injury", "electric shock chest pain"],
        careAdviceIds: ["oscg-electricshock-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-electricshock-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Was this a very brief, low-voltage static shock (such as touching a doorknob) with no symptoms at all?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A brief static discharge without any symptoms does not carry the same risk as a sustained household or high-voltage shock.",
        redFlag: false,
        keywords: ["brief static shock no symptoms"],
        careAdviceIds: ["oscg-electricshock-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-electricshock-emergency-advice", titleEn: "Emergency electric shock precautions", instructionTextEn: "Do not touch the person if they may still be in contact with the electrical source - turn off the power first if it's safe to do so. Begin CPR if not breathing and trained to do so. Arrange emergency transport immediately, even if the person seems okay - internal injuries and heart rhythm problems are not always visible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["loss of consciousness", "irregular heartbeat"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-electricshock-selfcare-advice", titleEn: "After a very brief static shock", instructionTextEn: "No treatment is usually needed for a brief static discharge without symptoms, but watch for any delayed symptoms.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["any pain, numbness, or irregular heartbeat develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized emergency medicine knowledge about electric shock/lightning injury risk (cardiac arrhythmia, internal injury, CPR) - the specific NHS.UK electric shock page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK electric shock page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary emergency medicine knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Groin Injury and Strain - generalized from limb-injury/strain pattern (batch06/15)
  // ------------------------------------------------------------------
  {
    id: "oscg-groin-injury-and-strain",
    titleEn: "Groin Injury and Strain",
    clinicalDefinitionEn: "Groin injury/strain assessment, generalized from the limb-injury fracture pattern and non-traumatic-pain pattern already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "groin strain", weight: 100 },
      { phrase: "pulled my groin", weight: 95 },
      { phrase: "groin injury from sports", weight: 90 },
      { phrase: "groin muscle pain", weight: 85 },
      { phrase: "pulled a muscle in my groin", weight: 100 },
      { phrase: "pulled a muscle in my groin playing soccer", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-groininjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-groininjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there a bulge or lump, or testicular involvement?" },
      { id: "oscg-groininjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-groininjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden severe testicular pain or swelling, a groin bulge that is painful and won't go back in, or inability to bear weight after a high-impact injury?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sudden severe testicular pain can indicate testicular torsion (a time-critical surgical emergency), and a painful irreducible groin bulge can indicate a strangulated hernia - both need immediate emergency care.",
        redFlag: true,
        keywords: ["sudden severe testicular pain", "groin bulge wont go back in and painful"],
        careAdviceIds: ["oscg-groininjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-groininjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant swelling or bruising, or difficulty walking?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the limb-strain pattern already used in this system, significant swelling or walking difficulty after a groin injury warrants prompt assessment.",
        redFlag: false,
        keywords: ["cant walk after groin injury", "swollen groin after strain"],
        careAdviceIds: ["oscg-groininjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-groininjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild groin strain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild muscle strains are manageable at home with rest, ice, and gradual return to activity.",
        redFlag: false,
        keywords: ["mild groin muscle strain"],
        careAdviceIds: ["oscg-groininjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-groininjury-emergency-advice", titleEn: "Emergency groin/testicular precautions", instructionTextEn: "Arrange emergency transport immediately - these signs can indicate a time-critical surgical emergency.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "vomiting develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-groininjury-urgent-advice", titleEn: "Urgent groin injury review", instructionTextEn: "Rest and avoid strenuous activity, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling increases", "unable to walk"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-groininjury-selfcare-advice", titleEn: "Home care for a mild groin strain", instructionTextEn: "Rest, apply a cold compress, and take over-the-counter pain relief. Gradually return to activity as pain allows, avoiding a sudden return to sport.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "a bulge or testicular symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Generalized from the limb-injury/strain fracture-and-strain pattern already established for Arm Pain/Leg Pain (batch15) and Genital Injury - Male (batch08), combined with standard emergency medicine knowledge of testicular torsion and strangulated hernia red flags - the specific NHS.UK groin strain page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK groin strain page could not be retrieved during authoring. This protocol generalizes the existing limb-strain pattern and combines it with widely-recognized emergency medicine red flags for the groin region specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Eyelid Swelling - generalized from Eye Injury (batch13) / Eye - Allergy (batch07)
  // ------------------------------------------------------------------
  {
    id: "oscg-eyelid-swelling",
    titleEn: "Eyelid Swelling",
    clinicalDefinitionEn: "Eyelid swelling assessment, generalized from the eye-injury and eye-allergy emergency criteria already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "eyelid is swollen", weight: 100 },
      { phrase: "swollen eyelid", weight: 100 },
      { phrase: "eye is puffy and swollen", weight: 90 },
      { phrase: "eyelid swelling and redness", weight: 90 },
      { phrase: "eyelid is really puffy and swollen", weight: 100 },
      { phrase: "puffy and swollen this morning", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyelidswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the swelling been present?" },
      { id: "oscg-eyelidswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any vision change, pain, or fever?" },
      { id: "oscg-eyelidswelling-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any known trigger (insect bite, allergy, injury, makeup)?" }
    ],
    questions: [
      {
        id: "oscg-eyelidswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the eyelid swelling, is there vision change, inability to open the eye, bulging of the eye, severe pain, or swelling of the lips/mouth/throat with breathing difficulty?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Vision change or a bulging eye can indicate a serious orbital infection (orbital cellulitis), and swelling with breathing difficulty can indicate anaphylaxis - both recognized emergencies, consistent with the eye-injury and severe-allergy criteria already used in this system.",
        redFlag: true,
        keywords: ["eyelid swelling with vision change", "bulging eye", "eyelid swelling breathing difficulty"],
        careAdviceIds: ["oscg-eyelidswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyelidswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the eyelid red, warm, and increasingly painful, or is there fever, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Redness, warmth, and fever can indicate a spreading eyelid infection (preseptal cellulitis) needing prompt antibiotic treatment.",
        redFlag: false,
        keywords: ["red warm swollen eyelid", "eyelid swelling with fever"],
        careAdviceIds: ["oscg-eyelidswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-eyelidswelling-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild puffiness or swelling, such as from an insect bite or mild allergy, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild eyelid swelling without pain, vision change, or fever is often manageable at home.",
        redFlag: false,
        keywords: ["mild eyelid puffiness"],
        careAdviceIds: ["oscg-eyelidswelling-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyelidswelling-emergency-advice", titleEn: "Emergency eyelid swelling precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening vision", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyelidswelling-urgent-advice", titleEn: "Urgent eyelid swelling review", instructionTextEn: "Arrange same-day medical review for possible infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes develop", "fever worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyelidswelling-selfcare-advice", titleEn: "Home care for mild eyelid swelling", instructionTextEn: "Apply a cold compress and take an antihistamine if an allergy or insect bite is suspected.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling worsens", "vision changes or pain develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Generalized from the eye-injury and eye-allergy emergency criteria already established for Eye Injury (batch13) and Eye - Allergy (batch07), combined with standard emergency-medicine knowledge distinguishing orbital cellulitis from preseptal cellulitis - the specific NHS.UK eyelid swelling page could not be retrieved during authoring"],
      contentNotice: "No dedicated NHS.UK page was retrieved for eyelid swelling specifically during authoring. This protocol generalizes the eye-emergency criteria already used elsewhere in this content set. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
