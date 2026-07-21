import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 10 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Finger Injury generalizes the broken-arm-or-wrist fracture
 * criteria to digits (documented explicitly). Nose - Foreign Body reuses the
 * Earache "do not attempt removal" first-aid pattern plus the Broken Nose
 * page's breathing-difficulty criterion. Puncture Wound reuses Cuts and
 * Grazes. Post-Op Symptoms and Questions synthesizes general wound-infection
 * red flags already established (Cuts and Grazes, Boils) since no single
 * dedicated NHS.UK post-operative page exists - documented as a synthesis,
 * not a single-source quote.
 */
export const batch10Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Nose Injury - https://www.nhs.uk/conditions/broken-nose/ (reviewed 2023-08-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-nose-injury",
    titleEn: "Nose Injury",
    clinicalDefinitionEn: "Nose injury assessment decomposed from NHS.UK's published broken nose guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "nose injury", weight: 100 },
      { phrase: "broken nose", weight: 100 },
      { phrase: "hit my nose", weight: 90 },
      { phrase: "hurt my nose", weight: 85 },
      { phrase: "hit in the nose", weight: 100 },
      { phrase: "nose looks crooked", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-noseinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-noseinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-noseinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any bleeding, and has it stopped?" }
    ],
    questions: [
      {
        id: "oscg-noseinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there a nosebleed that will not stop, a large open wound with something in it, clear watery fluid trickling from the nose, a severe headache with blurred or double vision, eye pain, neck pain or stiffness with tingling in the arms, a purple swelling inside the nose blocking breathing, vomiting, or loss of consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken nose guidance lists these as call-999/A&E criteria - some suggest a serious head injury, not just a nose fracture.",
        redFlag: true,
        keywords: ["nosebleed wont stop after injury", "clear fluid from nose", "purple swelling nose"],
        careAdviceIds: ["oscg-noseinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-noseinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Is the nose crooked since the injury, has swelling not started to go down after 3 days, are painkillers not helping, is there breathing difficulty once swelling subsides, or are there regular nosebleeds or fever?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["crooked nose after injury", "nose swelling not going down"],
        careAdviceIds: ["oscg-noseinjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-noseinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild bruising or swelling with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides first-aid steps for a mild nose injury.",
        redFlag: false,
        keywords: ["mild nose bruising"],
        careAdviceIds: ["oscg-noseinjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-noseinjury-emergency-advice", titleEn: "Emergency nose injury precautions", instructionTextEn: "Keep the person upright and leaning forward, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "worsening confusion"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-noseinjury-urgent-advice", titleEn: "Urgent nose injury review", instructionTextEn: "Arrange same-day medical review, especially for a crooked nose or persistent swelling.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-noseinjury-selfcare-advice", titleEn: "Home care for a mild nose injury", instructionTextEn: "Apply ice wrapped in cloth for up to 15 minutes several times a day, take paracetamol for pain, and use extra pillows to keep the head elevated while resting. Avoid straightening the nose yourself, wearing glasses, or strenuous activity for 2 weeks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling not improving after 3 days", "nose appears crooked"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-08-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken nose\", https://www.nhs.uk/conditions/broken-nose/ (page last reviewed 17 August 2023)"],
      contentNotice: "Decomposed from NHS.UK's published broken nose guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Pinworms - https://www.nhs.uk/conditions/threadworms/ (reviewed 2023-12-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-pinworms",
    titleEn: "Pinworms",
    clinicalDefinitionEn: "Pinworms (threadworms) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "pinworms", weight: 100 },
      { phrase: "threadworms", weight: 100 },
      { phrase: "itchy bottom worms", weight: 85 },
      { phrase: "worms in stool", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-pinworms-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How was this noticed (visible worms, itching)?" },
      { id: "oscg-pinworms-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the patient under 2 years old, pregnant, or breastfeeding?" },
      { id: "oscg-pinworms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Have other household members also been affected?" }
    ],
    questions: [
      {
        id: "oscg-pinworms-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Is the patient under 2 years old, is the caller pregnant or breastfeeding, or is the caller unable to tolerate the medication?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends GP advice before treatment for these groups.",
        redFlag: false,
        keywords: ["threadworms under 2 years old", "pregnant with threadworms"],
        careAdviceIds: ["oscg-pinworms-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-pinworms-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a straightforward case in someone over 2 years old, not pregnant or breastfeeding?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can recommend medicine (mebendazole) - treat all household members over 2 regardless of symptoms. No need to stay off school, nursery, or work.",
        redFlag: false,
        keywords: ["straightforward threadworms"],
        careAdviceIds: ["oscg-pinworms-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pinworms-routine-advice", titleEn: "Routine pinworms follow-up", instructionTextEn: "Get GP advice before treating a child under 2, or if pregnant or breastfeeding.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-pinworms-selfcare-advice", titleEn: "Pharmacy self-care for pinworms", instructionTextEn: "A pharmacist can recommend mebendazole for everyone in the household over 2, regardless of symptoms. Wash hands and scrub under fingernails before eating, shower daily, keep nails short, wash sleepwear/sheets/towels daily at high temperature for 2 weeks, and everyone should wear underwear at night. There's no need to stay off school, nursery, or work.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms persist after treatment", "cannot tolerate medication"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Threadworms\", https://www.nhs.uk/conditions/threadworms/ (page last reviewed 01 December 2023)"],
      contentNotice: "Decomposed from NHS.UK's published threadworms guidance (Crown copyright, reused under the Open Government Licence) - threadworms is the UK clinical term for pinworms, same organism (Enterobius vermicularis). Adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Neurologic Deficit - https://www.nhs.uk/conditions/stroke/symptoms/ (reviewed 2024-09-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-neurologic-deficit",
    titleEn: "Neurologic Deficit",
    clinicalDefinitionEn: "Sudden neurologic deficit (possible stroke) assessment decomposed from NHS.UK's published FAST test guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "neurologic deficit", weight: 90 },
      { phrase: "face drooping", weight: 100 },
      { phrase: "arm weakness one side", weight: 95 },
      { phrase: "slurred speech", weight: 95 },
      { phrase: "possible stroke", weight: 100 },
      { phrase: "face suddenly drooped", weight: 100 },
      { phrase: "slurring his words", weight: 100 },
      { phrase: "slurring words", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-neuro-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the symptoms start?" },
      { id: "oscg-neuro-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have the symptoms improved or stopped since they started?" },
      { id: "oscg-neuro-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe exactly what is happening (face, arm, speech, vision)." }
    ],
    questions: [
      {
        id: "oscg-neuro-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is one side of the face drooping, is the person unable to fully lift both arms and keep them there, is speech slurred or not making sense, or is there sudden weakness/numbness on one side, vision problems, confusion, or a severe headache - even if symptoms have since improved or stopped?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "NHS.UK guidance: the FAST test (Face, Arms, Speech, Time) - call 999 now for any of these, including if signs of a stroke occurred within the last 24 hours even if they've now stopped. Do not drive to A&E.",
        redFlag: true,
        keywords: ["face drooping one side", "cant lift both arms", "sudden slurred speech", "stroke symptoms stopped"],
        careAdviceIds: ["oscg-neuro-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-neuro-emergency-advice",
        titleEn: "Emergency stroke precautions",
        instructionTextEn: "Note the exact time symptoms started. Do not let the person drive. Arrange emergency transport immediately, even if symptoms have improved or stopped - get medical help straight away regardless.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["symptoms worsen", "loss of consciousness"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-09-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Stroke - Symptoms\", https://www.nhs.uk/conditions/stroke/symptoms/ (page last reviewed 12 September 2024)"],
      contentNotice: "Decomposed from NHS.UK's published FAST test stroke symptom guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Treated as an unconditional emergency per the source - no self-care or routine tier exists for a genuine neurologic deficit. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Post-Op Symptoms and Questions - synthesis of general wound-infection
  //    criteria (Cuts and Grazes, Boils sources already cited)
  // ------------------------------------------------------------------
  {
    id: "oscg-post-op-symptoms",
    titleEn: "Post-Op Symptoms and Questions",
    clinicalDefinitionEn: "Post-operative wound and recovery concern assessment, synthesized from NHS.UK's general wound-infection guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "after my surgery", weight: 100 },
      { phrase: "post op", weight: 95 },
      { phrase: "surgical wound", weight: 90 },
      { phrase: "incision looks infected", weight: 90 },
      { phrase: "had surgery", weight: 90 },
      { phrase: "incision is red", weight: 100 },
      { phrase: "incision leaking fluid", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postop-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What surgery was performed, and when?" },
      { id: "oscg-postop-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured?" },
      { id: "oscg-postop-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe how the surgical site looks now." }
    ],
    questions: [
      {
        id: "oscg-postop-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there heavy bleeding from the surgical site, severe uncontrolled pain, chest pain, severe difficulty breathing, or is the person confused or difficult to rouse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of general wound-care guidance - post-operative complications like serious bleeding, pulmonary embolism, or sepsis require immediate emergency care.",
        redFlag: true,
        keywords: ["heavy bleeding after surgery", "chest pain after surgery", "confused after surgery"],
        careAdviceIds: ["oscg-postop-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postop-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the wound hot, red, swollen, and increasingly painful, or leaking pus, or does the person have a high temperature or feel hot/cold/shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "General wound-infection red flags (consistent with NHS.UK's cuts/grazes and boils guidance) applied to the post-surgical context - contact the surgical team promptly for these signs.",
        redFlag: false,
        keywords: ["infected surgical wound", "fever after surgery", "wound leaking pus"],
        careAdviceIds: ["oscg-postop-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-postop-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is recovery progressing as expected with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "General post-operative wound care: keep the site clean and dry, and follow discharge instructions from the surgical team.",
        redFlag: false,
        keywords: ["normal post op recovery"],
        careAdviceIds: ["oscg-postop-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postop-emergency-advice", titleEn: "Emergency post-op precautions", instructionTextEn: "Apply pressure to any bleeding and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening bleeding", "breathing difficulty increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postop-urgent-advice", titleEn: "Urgent post-op wound review", instructionTextEn: "Contact the surgical team or arrange same-day medical review for these infection signs.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "wound spreads"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-postop-selfcare-advice", titleEn: "Home care for normal post-op recovery", instructionTextEn: "Keep the surgical site clean and dry, follow the discharge instructions given by the surgical team, and take prescribed pain relief as directed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["wound becomes red, hot, or leaks fluid", "fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)",
        "NHS.UK, \"Boils\", https://www.nhs.uk/conditions/boils/ (page last reviewed 20 June 2023)"
      ],
      contentNotice:
        "No single dedicated NHS.UK page exists for general post-operative symptom triage (surgery-type-specific discharge instructions vary by hospital). This protocol synthesizes NHS.UK's general wound-infection red-flag criteria (already used for cuts/grazes and boils) applied to the post-surgical context - a documented synthesis, not a direct single-source quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, and should defer to the specific surgical team's own discharge instructions where they conflict."
    })
  },

  // ------------------------------------------------------------------
  // 5. Finger Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/ (reviewed 2023-05-26), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-finger-injury",
    titleEn: "Finger Injury",
    clinicalDefinitionEn: "Finger injury assessment decomposed from NHS.UK's published broken arm/wrist guidance, generalized to digits.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "finger injury", weight: 100 },
      { phrase: "hurt my finger", weight: 90 },
      { phrase: "broken finger", weight: 95 },
      { phrase: "jammed my finger", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fingerinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-fingerinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-fingerinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the finger be moved and bent normally?" }
    ],
    questions: [
      {
        id: "oscg-fingerinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the finger numb, tingling, or has pins and needles, is there a bad cut with heavy bleeding, is a bone sticking out of the skin, or has the finger changed shape or is at an odd angle?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK fracture guidance (broken arm/wrist) lists these as call-999/A&E criteria - the same principles apply to a finger fracture.",
        redFlag: true,
        keywords: ["numb finger after injury", "bone sticking out finger", "finger deformed"],
        careAdviceIds: ["oscg-fingerinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fingerinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there severe pain or inability to use the finger, worsening swelling or bruising, stiffness, or a high temperature/feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["severe finger pain", "cannot use finger", "worsening finger swelling"],
        careAdviceIds: ["oscg-fingerinjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fingerinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild pain or bruising with the finger still movable and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides ice, elevation, and pain-relief first-aid steps for a mild extremity injury.",
        redFlag: false,
        keywords: ["mild finger pain"],
        careAdviceIds: ["oscg-fingerinjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fingerinjury-emergency-advice", titleEn: "Emergency finger injury precautions", instructionTextEn: "Keep the hand still, do not attempt to realign a deformity, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening numbness", "increasing bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingerinjury-urgent-advice", titleEn: "Urgent finger injury review", instructionTextEn: "Buddy-tape the injured finger to an adjacent one for support, apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "new numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingerinjury-selfcare-advice", titleEn: "Home care for a mild finger injury", instructionTextEn: "Apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, remove rings from the affected finger, and take paracetamol or ibuprofen for pain.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "new numbness or inability to move the finger"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\", https://www.nhs.uk/conditions/broken-arm-or-wrist/ (page last reviewed 26 May 2023) - generalized to finger/digit injuries using the same fracture red-flag criteria"],
      contentNotice: "Decomposed from NHS.UK's published broken arm/wrist guidance, explicitly generalized to finger injuries since fracture red-flag criteria (deformity, numbness, open bone) are consistent across small and large bones (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Puncture Wound - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02)
  // ------------------------------------------------------------------
  {
    id: "oscg-puncture-wound",
    titleEn: "Puncture Wound",
    clinicalDefinitionEn: "Puncture wound assessment decomposed from NHS.UK's published cuts and grazes guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "puncture wound", weight: 100 },
      { phrase: "stepped on a nail", weight: 90 },
      { phrase: "punctured skin", weight: 85 },
      { phrase: "something pierced my skin", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-puncture-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What caused the puncture?" },
      { id: "oscg-puncture-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the wound?" },
      { id: "oscg-puncture-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the object still in the wound?" }
    ],
    questions: [
      {
        id: "oscg-puncture-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there something still stuck in the wound, cannot stop the bleeding, is there loss of feeling or trouble moving near the wound, or is the wound very large or deep?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK cuts and grazes guidance lists an embedded object, uncontrolled bleeding, or a large/deep wound as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["object stuck in wound", "deep puncture wound", "cant stop bleeding puncture"],
        careAdviceIds: ["oscg-puncture-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-puncture-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the wound have soil, dirt, or debris still in it, was it caused by an animal or dirty object like a rusty nail, is it swollen/red/getting more painful or leaking pus, or does the caller feel generally unwell or feverish and not had a tetanus vaccine in the last 10 years?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or see a GP - puncture wounds carry a higher infection and tetanus risk than surface cuts.",
        redFlag: false,
        keywords: ["dirty puncture wound", "rusty nail wound", "no tetanus vaccine"],
        careAdviceIds: ["oscg-puncture-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-puncture-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a small, shallow, clean puncture with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor wounds as manageable at home with basic first aid.",
        redFlag: false,
        keywords: ["small clean puncture"],
        careAdviceIds: ["oscg-puncture-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-puncture-emergency-advice", titleEn: "Emergency wound precautions", instructionTextEn: "Do not remove anything embedded in the wound. Apply pressure around (not on) an embedded object if bleeding, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-puncture-urgent-advice", titleEn: "Urgent puncture wound review", instructionTextEn: "Arrange same-day medical review for cleaning, a tetanus check, and possible antibiotics.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness, swelling, or pus", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-puncture-selfcare-advice", titleEn: "Home first aid for a minor puncture", instructionTextEn: "Wash hands, apply pressure with a clean cloth if bleeding, rinse the wound once bleeding stops, pat dry, and cover with a sterile dressing. Keep clean and dry and change as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "wound does not heal as expected"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)"],
      contentNotice: "Decomposed from NHS.UK's published cuts and grazes guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the puncture-wound presentation specifically (higher infection/tetanus risk than surface cuts noted explicitly). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Mosquito Bite - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-mosquito-bite",
    titleEn: "Mosquito Bite",
    clinicalDefinitionEn: "Mosquito bite assessment decomposed from NHS.UK's published insect bites and stings guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "mosquito bite", weight: 100 },
      { phrase: "mosquito bites", weight: 100 },
      { phrase: "bitten by mosquitoes", weight: 90 },
      { phrase: "itchy mosquito bite", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mosquito-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where are the bites?" },
      { id: "oscg-mosquito-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Any recent travel to an area with mosquito-borne disease risk?" },
      { id: "oscg-mosquito-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Any fever?" }
    ],
    questions: [
      {
        id: "oscg-mosquito-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these as signs of a serious allergic reaction (anaphylaxis) requiring an immediate 999 call.",
        redFlag: true,
        keywords: ["swollen throat mosquito bite", "struggling to breathe bite reaction"],
        careAdviceIds: ["oscg-mosquito-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-mosquito-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there fever, chills, or feeling generally unwell following recent travel to an area with mosquito-borne disease risk (e.g. malaria, dengue)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Fever after travel-related mosquito exposure needs prompt evaluation to rule out mosquito-borne illness - a standard travel-medicine caution beyond the source page's own bite-specific criteria.",
        redFlag: false,
        keywords: ["fever after travel mosquito bite", "malaria risk"],
        careAdviceIds: ["oscg-mosquito-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-mosquito-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the skin around the bite hot, red, and painful, or leaking pus or fluid (signs of infection)?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance flags these infection signs as needing a pharmacist or GP review.",
        redFlag: false,
        keywords: ["infected mosquito bite"],
        careAdviceIds: ["oscg-mosquito-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-mosquito-q3-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Are these typical itchy mosquito bites with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor bites without infection or allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["typical mosquito bites"],
        careAdviceIds: ["oscg-mosquito-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mosquito-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mosquito-urgent-advice", titleEn: "Urgent travel-fever review", instructionTextEn: "Arrange prompt medical evaluation for fever following travel to a mosquito-borne disease risk area - mention the travel history clearly.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "new symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mosquito-routine-advice", titleEn: "Routine bite follow-up", instructionTextEn: "Keep the area clean and book a routine review for signs of infection.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-mosquito-selfcare-advice", titleEn: "Home care for mosquito bites", instructionTextEn: "Apply an ice pack, use over-the-counter antihistamines or hydrocortisone cream, and avoid scratching to prevent infection.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "fever develops"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published insect bites and stings guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the mosquito-specific presentation, with an added travel-fever caution (standard travel-medicine practice, not part of the source page itself, relevant given IST Health's aviation/travel population). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Leech Bite - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-leech-bite",
    titleEn: "Leech Bite",
    clinicalDefinitionEn: "Leech bite assessment decomposed from NHS.UK's published insect bites and stings guidance, generalized to leeches.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "leech bite", weight: 100 },
      { phrase: "leech attached", weight: 90 },
      { phrase: "found a leech", weight: 90 },
      { phrase: "leech on my skin", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-leech-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the leech still attached?" },
      { id: "oscg-leech-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the bite?" },
      { id: "oscg-leech-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any excessive bleeding?" }
    ],
    questions: [
      {
        id: "oscg-leech-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these as signs of a serious allergic reaction requiring an immediate 999 call.",
        redFlag: true,
        keywords: ["swollen throat leech bite", "struggling to breathe leech"],
        careAdviceIds: ["oscg-leech-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-leech-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is bleeding from the bite site prolonged (leech saliva contains an anticoagulant), or is the skin around it hot, red, and painful (signs of infection)?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "Leech bites bleed more and for longer than typical insect bites due to the anticoagulant in leech saliva - a documented characteristic of leech bites specifically, distinct from the general insect bite pattern, warranting review if bleeding is prolonged or infection signs develop.",
        redFlag: false,
        keywords: ["prolonged bleeding leech bite", "infected leech bite"],
        careAdviceIds: ["oscg-leech-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-leech-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor leech bite with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor bites without infection or allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["minor leech bite"],
        careAdviceIds: ["oscg-leech-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-leech-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-leech-routine-advice", titleEn: "Routine leech bite follow-up", instructionTextEn: "If bleeding is prolonged, apply firm direct pressure with a clean cloth. Book a routine review if bleeding continues or infection signs develop.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["bleeding does not stop with pressure", "signs of infection"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-leech-selfcare-advice", titleEn: "Home care for a leech bite", instructionTextEn: "Do not pull the leech off forcibly if still attached - use a fingernail or credit-card edge to slide it off at the head, then clean the wound with soap and water and apply gentle pressure if it bleeds. Apply an ice pack and antihistamine cream for itching.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding does not stop", "signs of infection develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published insect bites and stings guidance, generalized to leeches (Crown copyright, reused under the Open Government Licence) - leeches are not insects, but the same allergic-reaction and infection-risk framework applies, with the prolonged-bleeding characteristic (anticoagulant saliva) added as a documented leech-specific fact, not from the source page. Adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Nose - Foreign Body - https://www.nhs.uk/conditions/broken-nose/ + earache foreign-body pattern
  // ------------------------------------------------------------------
  {
    id: "oscg-nose-foreign-body",
    titleEn: "Nose - Foreign Body",
    clinicalDefinitionEn: "Object stuck in the nose assessment, decomposed from NHS.UK's published broken nose guidance plus standard foreign-body first-aid practice.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "something stuck in nose", weight: 100 },
      { phrase: "object in nose", weight: 95 },
      { phrase: "stuck up my nose", weight: 90 },
      { phrase: "put something in his nose", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-nosebody-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is stuck in the nose?" },
      { id: "oscg-nosebody-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been there?" },
      { id: "oscg-nosebody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any breathing difficulty or nosebleed?" }
    ],
    questions: [
      {
        id: "oscg-nosebody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there breathing difficulty, or is the object a button battery or magnet?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Breathing difficulty from a nasal obstruction, or a button battery/magnet (which can cause rapid tissue damage), requires emergency care - standard first-aid safety practice for foreign bodies.",
        redFlag: true,
        keywords: ["breathing difficulty object in nose", "button battery in nose"],
        careAdviceIds: ["oscg-nosebody-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-nosebody-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there something stuck in the nose that hasn't come out on its own?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Standard first-aid practice: do not try to remove an object stuck deep in the nose with tools, as this can push it further in or cause injury - arrange professional removal.",
        redFlag: false,
        keywords: ["stuck in nose"],
        careAdviceIds: ["oscg-nosebody-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-nosebody-emergency-advice", titleEn: "Emergency foreign body precautions", instructionTextEn: "Do not try to remove the object yourself. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens", "bleeding increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-nosebody-urgent-advice", titleEn: "Foreign body in nose - do not attempt removal with tools", instructionTextEn: "Encourage gentle blowing of the unaffected nostril while blocking it closed if the object might come out this way. Do not use cotton swabs, tweezers, or other tools, which can push it deeper. Arrange same-day medical review for professional removal.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty develops", "bleeding starts"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken nose\", https://www.nhs.uk/conditions/broken-nose/ (page last reviewed 17 August 2023) - breathing-difficulty criterion; standard first-aid practice for foreign-body removal (not a direct NHS.UK quote)"],
      contentNotice: "No dedicated NHS.UK page exists for a nasal foreign body specifically. This protocol combines the Broken Nose page's breathing-difficulty emergency criterion with standard first-aid safety practice (do not attempt removal with tools; button battery/magnet ingestion is a recognized emergency) - documented as a synthesis, not a single-source quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Poison Ivy - Oak - Sumac - https://www.nhs.uk/conditions/contact-dermatitis/ (reviewed 2023-05-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-poison-ivy-oak-sumac",
    titleEn: "Poison Ivy - Oak - Sumac",
    clinicalDefinitionEn: "Plant contact dermatitis (poison ivy/oak/sumac) assessment decomposed from NHS.UK's published contact dermatitis guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "poison ivy", weight: 100 },
      { phrase: "poison oak", weight: 100 },
      { phrase: "poison sumac", weight: 100 },
      { phrase: "itchy rash from plant", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-poisonivy-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the rash?" },
      { id: "oscg-poisonivy-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long ago was the plant contact?" },
      { id: "oscg-poisonivy-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any blistering or oozing?" }
    ],
    questions: [
      {
        id: "oscg-poisonivy-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden swelling of the lips, mouth, throat, or tongue, or difficulty breathing along with the rash?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the contact dermatitis guidance itself - severe allergic swelling or breathing difficulty requires immediate care, distinct from typical contact dermatitis.",
        redFlag: true,
        keywords: ["swollen throat with rash", "breathing difficulty with plant rash"],
        careAdviceIds: ["oscg-poisonivy-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-poisonivy-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Are symptoms persistent, recurrent, or severe, or has the triggering substance not responded to treatment?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP for persistent, recurrent, or severe contact dermatitis symptoms.",
        redFlag: false,
        keywords: ["severe contact dermatitis", "persistent plant rash"],
        careAdviceIds: ["oscg-poisonivy-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-poisonivy-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild, typical case with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can recommend emollients (moisturisers) for mild contact dermatitis.",
        redFlag: false,
        keywords: ["mild plant rash"],
        careAdviceIds: ["oscg-poisonivy-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-poisonivy-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens", "swelling spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-poisonivy-routine-advice", titleEn: "Routine contact dermatitis follow-up", instructionTextEn: "Book a GP appointment - they can help identify the cause and may refer to a dermatologist if the trigger can't be identified or treatment isn't working.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "not improving with treatment"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-poisonivy-selfcare-advice", titleEn: "Home care for mild contact dermatitis", instructionTextEn: "Rinse affected skin promptly with warm water. Apply emollients (moisturisers) frequently in large amounts. Avoid further contact with the plant, wash any contaminated clothing, and use skin-friendly products.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms worsen or spread", "not improving with self-care"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Contact dermatitis\", https://www.nhs.uk/conditions/contact-dermatitis/ (page last reviewed 03 May 2023)"],
      contentNotice: "Decomposed from NHS.UK's published contact dermatitis guidance (Crown copyright, reused under the Open Government Licence), applied to poison ivy/oak/sumac specifically (all cause contact dermatitis via urushiol oil) - not a UK-native plant exposure, so no dedicated NHS.UK page exists, but the underlying skin-reaction mechanism and management is the same as any contact dermatitis trigger. Adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
