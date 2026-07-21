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
      { id: "oscg-choking-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has back blows or abdominal/chest thrusts already been tried?" }
    ],
    questions: [
      {
        id: "oscg-choking-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the cough silent or ineffective, is the person unable to breathe in properly, or have they become unconscious?",
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
          "Give up to 5 sharp back blows between the shoulder blades. If unsuccessful, give up to 5 abdominal thrusts (adults/children over 1: clenched fist pulled sharply inward and upward between navel and ribs; babies under 1: chest thrusts with two fingers below the nipple line instead of abdominal thrusts). Repeat cycles and call 999 if the blockage doesn't clear. Start CPR immediately if the person becomes unconscious.",
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
      contentNotice: "Decomposed from NHS.UK's published child-choking first-aid guidance (Crown copyright, reused under the Open Government Licence), generalized to all ages (the core effective-cough vs ineffective-cough distinction and back-blow/thrust technique is standard first aid taught across age groups, with the infant-specific chest-thrust vs adult abdominal-thrust technique noted explicitly in the care advice), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Cold Exposure (Hypothermia) - https://www.nhs.uk/conditions/hypothermia/ (reviewed 2023-06-09)
  // ------------------------------------------------------------------
  {
    id: "oscg-hypothermia",
    titleEn: "Cold Exposure (Hypothermia)",
    clinicalDefinitionEn: "Hypothermia assessment decomposed from NHS.UK's published emergency guidance.",
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
      { id: "oscg-hypothermia-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long was the person exposed to the cold?" },
      { id: "oscg-hypothermia-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Are they shivering, confused, or slurring words?" },
      { id: "oscg-hypothermia-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Have they already been moved somewhere warm?" }
    ],
    questions: [
      {
        id: "oscg-hypothermia-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Do you think this person has hypothermia (very cold, shivering, confused, slurred speech, or drowsy after cold exposure)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance: go to A&E or call 999 if you think you or your child have hypothermia - do not drive yourself, ask someone else to drive or call an ambulance.",
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
        titleEn: "Emergency hypothermia first aid",
        instructionTextEn:
          "Move the person indoors or to shelter quickly. Remove wet clothing and wrap them in blankets, sleeping bags, or dry towels with the head covered. If fully conscious, give warm non-alcoholic drinks and sugary foods. Keep them awake with conversation and stay with them until help arrives. Do NOT use hot baths, hot water bottles, heat lamps, massage the limbs, or give alcohol.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening confusion or drowsiness", "loss of consciousness"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-09", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hypothermia\", https://www.nhs.uk/conditions/hypothermia/ (page last reviewed 09 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published hypothermia guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. NHS.UK treats suspected hypothermia as an unconditional emergency - this protocol has a single Emergency-tier question, matching that framing rather than inventing a false self-care pathway. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Coma / Unconsciousness - https://www.nhs.uk/conditions/first-aid/recovery-position/ (reviewed 2022-03-15)
  // ------------------------------------------------------------------
  {
    id: "oscg-coma-unconscious",
    titleEn: "Coma",
    clinicalDefinitionEn: "Unconsciousness/coma emergency assessment decomposed from NHS.UK's published first-aid guidance.",
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
      { id: "oscg-coma-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the person breathing?" },
      { id: "oscg-coma-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the person been unresponsive?" },
      { id: "oscg-coma-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What happened right before they became unresponsive?" }
    ],
    questions: [
      {
        id: "oscg-coma-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person unresponsive to voice and touch?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "An unresponsive person is always a call-999 emergency. If breathing normally, use the recovery position per NHS.UK first-aid guidance; if not breathing, start CPR immediately.",
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
        titleEn: "Emergency unconsciousness first aid",
        instructionTextEn:
          "If breathing normally: place in the recovery position - extend the nearest arm at a right angle, fold the other arm with the back of the hand to their cheek, bend the far knee and roll them onto their side using it, tilt the head back and lift the chin to open the airway, then monitor until help arrives. Do not move them if a spinal injury is suspected - wait for emergency services. If not breathing normally, start CPR immediately.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["breathing stops or changes", "person starts to wake but remains confused"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-03-15", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Recovery position\", https://www.nhs.uk/conditions/first-aid/recovery-position/ (page last reviewed 15 March 2022)"],
      contentNotice: "Decomposed from NHS.UK's published recovery-position first-aid guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Unconsciousness is treated as an unconditional emergency - this protocol has a single Emergency-tier question. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Burns - Chemical - https://www.nhs.uk/conditions/acid-and-chemical-burns/ (reviewed 2024-06-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-burns-chemical",
    titleEn: "Burns - Chemical",
    clinicalDefinitionEn: "Chemical/acid burn assessment decomposed from NHS.UK's published emergency guidance.",
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
      { id: "oscg-chemburn-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What chemical was involved?" },
      { id: "oscg-chemburn-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where did it contact the body (skin, eyes, mouth)?" },
      { id: "oscg-chemburn-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has rinsing with water already started?" }
    ],
    questions: [
      {
        id: "oscg-chemburn-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has an acid or chemical gotten on the skin or in the eyes?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance: call 999 for any acid or chemical burn to the skin or eyes.",
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
        titleEn: "Emergency chemical burn first aid",
        instructionTextEn:
          "Call for emergency transport. Wear gloves if available. Carefully remove any clothing with the chemical on it and brush off any dry chemical from the skin. Put the affected area under cool or lukewarm running water, or pour water over it, for about 1 hour. Do not apply creams or anything else to the burn.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening pain", "vision changes if eyes affected"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-06-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Acid and chemical burns\", https://www.nhs.uk/conditions/acid-and-chemical-burns/ (page last reviewed 05 June 2024)"],
      contentNotice: "Decomposed from NHS.UK's published acid and chemical burns guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Treated as an unconditional emergency per the source, distinct from the graduated tiers used for thermal burns (oscg-burns-thermal). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        id: "oscg-boil-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the boil on the face, is the skin around it hot/painful/swollen, does the caller feel hot/cold/shivery, or does the caller have a weakened immune system (diabetes, steroids, chemotherapy)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK boils guidance lists these as reasons for an urgent GP appointment or 111 call.",
        redFlag: false,
        keywords: ["boil on face", "spreading boil infection", "fever with boil"],
        careAdviceIds: ["oscg-boil-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-boil-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the boil lasted 2 weeks without improving, does the caller keep getting boils, or is there a cluster of boils (carbuncle)?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for a persistent boil, recurring boils, or a carbuncle.",
        redFlag: false,
        keywords: ["persistent boil", "recurring boils", "carbuncle"],
        careAdviceIds: ["oscg-boil-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-boil-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a single, recent boil with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides self-care steps (warm compresses) for an uncomplicated boil.",
        redFlag: false,
        keywords: ["single recent boil"],
        careAdviceIds: ["oscg-boil-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-boil-urgent-advice", titleEn: "Urgent boil review", instructionTextEn: "Arrange same-day medical review, especially for a facial boil or signs of spreading infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-boil-routine-advice", titleEn: "Routine boil follow-up", instructionTextEn: "Book a routine GP appointment for a persistent, recurring, or clustered boil.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["boil worsens", "fever develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-boil-selfcare-advice", titleEn: "Home care for a boil", instructionTextEn: "Apply a warm cloth compress for 10 minutes, 4 times daily. If it bursts, clean with antibacterial soap and cover with a dressing. Take paracetamol or ibuprofen for pain. Do not pick, squeeze, or pierce the boil, and don't share towels until healed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["boil lasts more than 2 weeks", "signs of spreading infection or fever"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-20", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Boils\", https://www.nhs.uk/conditions/boils/ (page last reviewed 20 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published boils guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. severe facial swelling or difficulty swallowing)?",
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
        questionTextEn: "Has the cold sore not started healing within 10 days, is it very large or painful, does the caller have swollen painful gums and mouth sores, or a weakened immune system?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["cold sore not healing", "large painful cold sore", "mouth ulcers with cold sore"],
        careAdviceIds: ["oscg-coldsore-routine-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-coldsore-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["swelling worsens", "difficulty swallowing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-coldsore-routine-advice", titleEn: "Routine cold sore follow-up", instructionTextEn: "Book a GP appointment - antiviral tablets may be prescribed for large, painful, or recurring cold sores.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["not healing after 10 days", "spreading or worsening"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-coldsore-selfcare-advice", titleEn: "Home care for a cold sore", instructionTextEn: "A pharmacist can recommend creams, antiviral treatments, and protective patches. Avoid touching the sore (except to apply cream, dabbed not rubbed), use sunblock lip balm outdoors, take paracetamol or ibuprofen as needed, and stay hydrated.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not healing within 10 days", "becomes very large or painful"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-02-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cold sores\", https://www.nhs.uk/conditions/cold-sores/ (page last reviewed 19 February 2024)"],
      contentNotice: "Decomposed from NHS.UK's published cold sores guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        questionTextEn: "Is there severe abdominal pain, vomiting, or a swollen/hard abdomen suggesting a possible bowel obstruction?",
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
        questionTextEn: "Is constipation not improving with treatment, is there blood in the stool, unexplained weight loss, a sudden change in bowel habits, or ongoing tummy pain?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons to see a GP, though categorized as non-urgent rather than emergency.",
        redFlag: false,
        keywords: ["blood in stool", "constipation not improving", "weight loss with constipation"],
        careAdviceIds: ["oscg-constipation-routine-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-constipation-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the caller comfortable and arrange emergency transport for possible bowel obstruction.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "persistent vomiting"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-constipation-routine-advice", titleEn: "Routine constipation follow-up", instructionTextEn: "Book a GP appointment to investigate persistent constipation or associated symptoms.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["blood in stool increases", "pain worsens"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true },
      { id: "oscg-constipation-selfcare-advice", titleEn: "Home care for constipation", instructionTextEn: "Eat a balanced diet with fruits containing sorbitol, drink plenty of fluids and avoid alcohol, gradually increase fibre, keep a regular toilet routine, and stay active with a daily walk. Ask a pharmacist about laxatives if these don't help - most work within 3 days.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with treatment", "blood in stool develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-10-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Constipation\", https://www.nhs.uk/conditions/constipation/ (page last reviewed 26 October 2023)"],
      contentNotice: "Decomposed from NHS.UK's published constipation guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source has no emergency criteria of its own - the emergency screen here (possible bowel obstruction) is added as a standard tele-triage safety practice, not part of the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. signs of a severe skin infection with fever)?",
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
        questionTextEn: "Have pharmacy treatments not controlled the acne, is it making the caller very unhappy, or is it moderate-to-severe with nodules or cysts?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP if pharmacy treatments aren't working, acne is affecting wellbeing, or it's moderate/severe - proper treatment for nodules/cysts avoids scarring.",
        redFlag: false,
        keywords: ["acne not improving", "severe acne", "acne affecting mood"],
        careAdviceIds: ["oscg-acne-routine-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-acne-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever develops", "spreading infection"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-acne-routine-advice", titleEn: "Routine acne follow-up", instructionTextEn: "Book a GP appointment - moderate to severe acne needs proper treatment to avoid scarring.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["acne worsens", "significant impact on wellbeing"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-acne-selfcare-advice", titleEn: "Pharmacy self-care for mild acne", instructionTextEn: "Ask a pharmacist about creams, lotions, or gels for treating spots. Treatments can take several months to work - don't expect overnight results. Avoid picking or squeezing spots, which can cause permanent scarring.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after a few months", "becoming more severe"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Acne\", https://www.nhs.uk/conditions/acne/ (page last reviewed 03 January 2023)"],
      contentNotice: "Decomposed from NHS.UK's published acne guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
        questionTextEn: "Is the foot or leg hot, painful, and red, has the infection spread to other areas like the hands, does the caller have diabetes, or a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to see a doctor promptly - could indicate a serious infection, and foot problems are more serious with diabetes.",
        redFlag: false,
        keywords: ["hot painful red foot", "spreading fungal infection", "diabetes foot infection"],
        careAdviceIds: ["oscg-athletesfoot-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-athletesfoot-urgent-advice", titleEn: "Urgent foot infection review", instructionTextEn: "Arrange prompt medical review, especially with diabetes or a weakened immune system.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-athletesfoot-routine-advice", titleEn: "Routine athlete's foot follow-up", instructionTextEn: "Book a GP appointment if pharmacy treatment hasn't worked.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["worsening pain or spreading"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-athletesfoot-selfcare-advice", titleEn: "Pharmacy self-care for athlete's foot", instructionTextEn: "A pharmacist can recommend creams, sprays, or powders. Dry feet thoroughly (especially between toes), use separate towels, wear clean cotton socks daily, and avoid scratching, walking barefoot in public areas, or sharing footwear/towels.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving with treatment", "spreading or worsening"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-29", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Athlete's foot\", https://www.nhs.uk/conditions/athletes-foot/ (page last reviewed 29 April 2024)"],
      contentNotice: "Decomposed from NHS.UK's published athlete's foot guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-covid-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe the main symptoms." }
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
        id: "oscg-covid-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Are symptoms mild, with none of the emergency features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends rest, fluids, and simple pain relief for mild COVID-19, with isolation guidance to protect others.",
        redFlag: false,
        keywords: ["mild covid symptoms"],
        careAdviceIds: ["oscg-covid-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-covid-emergency-advice", titleEn: "Emergency COVID-19 precautions", instructionTextEn: "Help the person sit upright if breathless, with shoulders relaxed and leaning forward with hand support. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-covid-selfcare-advice", titleEn: "Home care for mild COVID-19", instructionTextEn: "Rest, drink plenty of water, take paracetamol or ibuprofen if uncomfortable, and try honey for cough (not for babies under 12 months). Stay away from others per local isolation guidance. Avoid lying flat while coughing.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["breathing difficulty develops", "symptoms significantly worsen"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-03-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"COVID-19 symptoms and what to do\", https://www.nhs.uk/conditions/covid-19/covid-19-symptoms-and-what-to-do/ (page last reviewed 21 March 2023)"],
      contentNotice: "Decomposed from NHS.UK's published COVID-19 symptoms guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
