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
    clinicalDefinitionEn: "Diarrhea assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-diarrhea-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the diarrhea lasted?" },
      { id: "oscg-diarrhea-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any blood in the stool?" },
      { id: "oscg-diarrhea-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Able to keep fluids down?" }
    ],
    questions: [
      {
        id: "oscg-diarrhea-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there blue, grey, pale, or blotchy skin/lips/tongue, severe difficulty breathing or very fast short breaths, confusion or not responding as usual, a stiff neck with pain looking at bright lights, or a sudden severe headache or severe tummy ache?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK diarrhoea and vomiting guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["blue lips diarrhea", "confused with diarrhea", "severe headache with diarrhea"],
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
          "Is there bloody diarrhea or bleeding from the bottom, has diarrhea lasted more than 7 days, is the person unable to keep fluids down, or are there signs of dehydration?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["bloody diarrhea", "diarrhea more than 7 days", "cant keep fluids down"],
        careAdviceIds: ["oscg-diarrhea-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-diarrhea-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this diarrhea of less than 7 days with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: diarrhoea usually resolves within 5-7 days with rest and fluids.",
        redFlag: false,
        keywords: ["typical diarrhea"],
        careAdviceIds: ["oscg-diarrhea-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-diarrhea-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the person still and calm and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "breathing difficulty increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-diarrhea-urgent-advice", titleEn: "Urgent diarrhea review", instructionTextEn: "Arrange same-day medical review, especially for bloody stool, prolonged symptoms, or dehydration.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding increases", "signs of dehydration worsen"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-diarrhea-selfcare-advice", titleEn: "Home care for diarrhea", instructionTextEn: "Stay home and rest, drink plenty of fluids, and avoid fruit juice or fizzy drinks. Diarrhoea usually settles within 5-7 days.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["lasts more than 7 days", "blood appears in stool"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Diarrhoea and vomiting\", https://www.nhs.uk/conditions/diarrhoea/ (page last reviewed 21 December 2023)"],
      contentNotice: "Decomposed from NHS.UK's published diarrhoea and vomiting guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Diarrhea on Antibiotics - https://www.nhs.uk/conditions/clostridium-difficile/ (reviewed 2025-07-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-diarrhea-on-antibiotics",
    titleEn: "Diarrhea on Antibiotics",
    clinicalDefinitionEn: "Antibiotic-associated diarrhea (possible C. difficile) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-cdiff-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What antibiotic is being taken or was recently finished?" },
      { id: "oscg-cdiff-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the diarrhea lasted?" },
      { id: "oscg-cdiff-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any blood in the stool?" }
    ],
    questions: [
      {
        id: "oscg-cdiff-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there blue/grey/pale skin, severe breathing difficulty, confusion, or a sudden severe headache or tummy ache?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the C. difficile guidance itself, matching the general diarrhoea emergency criteria - severe illness needs immediate care regardless of the antibiotic-related cause.",
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
        questionTextEn: "Is there diarrhea while taking, or having recently taken, antibiotics, bloody diarrhea, or diarrhea lasting more than 7 days?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: seek an urgent GP appointment or NHS 111 for diarrhea associated with antibiotic use - possible C. difficile infection. Do not use antidiarrheal medication like loperamide, as it can prevent proper infection clearance.",
        redFlag: false,
        keywords: ["diarrhea taking antibiotics", "bloody diarrhea antibiotics"],
        careAdviceIds: ["oscg-cdiff-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cdiff-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the person still and calm and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cdiff-urgent-advice", titleEn: "Urgent antibiotic-diarrhea review", instructionTextEn: "Do not use antidiarrheal medication such as loperamide. Arrange same-day medical review to assess whether the current antibiotic should be stopped and a C. diff-specific antibiotic started. If already prescribed a C. diff treatment course, complete the full course even if feeling better.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen after new antibiotic starts", "symptoms return after treatment"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Clostridium difficile (C. diff)\", https://www.nhs.uk/conditions/clostridium-difficile/ (page last reviewed 24 July 2025)"],
      contentNotice: "Decomposed from NHS.UK's published C. difficile guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Earache - https://www.nhs.uk/conditions/earache/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-earache",
    titleEn: "Earache",
    clinicalDefinitionEn: "Earache assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-earache-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever, discharge, or hearing changes?" }
    ],
    questions: [
      {
        id: "oscg-earache-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn:
          "Has the earache lasted more than 2-3 days, does the person feel generally unwell or have a high temperature, is there swelling around the ear, fluid coming from the ear, hearing loss or change, something stuck in the ear, or is this a child under 2 with earache in both ears?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK earache guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["earache more than 3 days", "swelling around ear", "fluid from ear", "hearing change with earache"],
        careAdviceIds: ["oscg-earache-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-earache-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Does the caller keep getting earaches recurrently?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for recurring earaches.",
        redFlag: false,
        keywords: ["recurring earaches"],
        careAdviceIds: ["oscg-earache-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-earache-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a recent, mild earache with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: most earaches get better within 2-3 days without needing treatment.",
        redFlag: false,
        keywords: ["mild recent earache"],
        careAdviceIds: ["oscg-earache-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earache-urgent-advice", titleEn: "Urgent earache review", instructionTextEn: "Arrange same-day or next-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "hearing loss increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earache-routine-advice", titleEn: "Routine earache follow-up", instructionTextEn: "Book a routine GP appointment for recurring earaches.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["earaches become more frequent"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-earache-selfcare-advice", titleEn: "Home care for earache", instructionTextEn: "Use paracetamol or ibuprofen for pain and place a warm flannel on the ear. Do not insert objects into the ear or try to remove earwax, and keep water out of the affected ear. Most earaches resolve within 2-3 days.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2-3 days", "fever or discharge develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earache\", https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025)"],
      contentNotice: "Decomposed from NHS.UK's published earache guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Ear - Foreign Body - https://www.nhs.uk/conditions/earache/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-foreign-body",
    titleEn: "Ear - Foreign Body",
    clinicalDefinitionEn: "Object stuck in the ear assessment decomposed from NHS.UK's published earache guidance.",
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
      { id: "oscg-earbody-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is stuck in the ear?" },
      { id: "oscg-earbody-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been there?" },
      { id: "oscg-earbody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any pain, bleeding, or hearing change?" }
    ],
    questions: [
      {
        id: "oscg-earbody-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there something stuck in the ear?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK earache guidance lists \"something stuck in the ear\" as one of its urgent GP/NHS 111 criteria.",
        redFlag: false,
        keywords: ["stuck in ear"],
        careAdviceIds: ["oscg-earbody-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-earbody-urgent-advice",
        titleEn: "Foreign body in ear - do not attempt removal",
        instructionTextEn: "Do not try to remove the object with cotton swabs, tweezers, or other tools - this can push it deeper or damage the ear canal/eardrum. Arrange same-day medical review for professional removal.",
        dispositionCode: "HMC_URGENT_REVIEW",
        warningSigns: ["pain worsens", "bleeding starts", "hearing suddenly changes"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION",
        patientSendable: true
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earache\", https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025)"],
      contentNotice: "Decomposed from NHS.UK's published earache guidance's foreign-body criterion (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The 'do not attempt removal' care advice is standard first-aid practice, not explicitly quoted from this specific page. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Ear - Swimmer's - https://www.nhs.uk/conditions/ear-infection/ (reviewed 2025-01-16)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-swimmers",
    titleEn: "Ear - Swimmer's",
    clinicalDefinitionEn: "Outer ear infection (swimmer's ear / otitis externa) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-swimmerear-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any discharge, hearing change, or dizziness?" }
    ],
    questions: [
      {
        id: "oscg-swimmerear-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn:
          "Does the person feel generally unwell or have a very high temperature, is there swelling around the ear, fluid coming from the ear, hearing loss or change, nausea/vomiting/dizziness, a severe sore throat, or a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK ear infection guidance lists these as urgent NHS 111/GP criteria.",
        redFlag: false,
        keywords: ["swelling around ear", "dizziness with ear infection", "discharge from ear"],
        careAdviceIds: ["oscg-swimmerear-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-swimmerear-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has earache persisted beyond 3 days, or are ear infections recurring?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for persistent or recurrent ear infections.",
        redFlag: false,
        keywords: ["persistent ear infection", "recurrent ear infections"],
        careAdviceIds: ["oscg-swimmerear-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-swimmerear-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild, recent case with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends a pharmacist for a suspected mild ear infection.",
        redFlag: false,
        keywords: ["mild recent ear infection"],
        careAdviceIds: ["oscg-swimmerear-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-swimmerear-urgent-advice", titleEn: "Urgent ear infection review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening pain or swelling", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-swimmerear-routine-advice", titleEn: "Routine ear infection follow-up", instructionTextEn: "Book a GP appointment for persistent or recurring ear infections.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "new discharge"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-swimmerear-selfcare-advice", titleEn: "Pharmacy self-care for mild ear infection", instructionTextEn: "See a pharmacist for advice and treatment options. Keep the ear dry and avoid swimming until resolved.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms not improving", "hearing changes or discharge develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-01-16", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Ear infection\", https://www.nhs.uk/conditions/ear-infection/ (page last reviewed 16 January 2025)"],
      contentNotice: "Decomposed from NHS.UK's published ear infection guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source covers ear infections generally rather than outer-ear/swimmer's-ear specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Eye - Foreign Body - https://www.nhs.uk/conditions/eye-injuries/ (reviewed 2026-03-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-foreign-body",
    titleEn: "Eye - Foreign Body",
    clinicalDefinitionEn: "Something in the eye assessment decomposed from NHS.UK's published eye injuries guidance.",
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
      { id: "oscg-eyebody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any vision changes?" }
    ],
    questions: [
      {
        id: "oscg-eyebody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Has a sharp object pierced the eye, did something hit the eye at high speed, has vision changed since the injury, is there severe eye pain, headache or light sensitivity, nausea or vomiting, inability to move the eye or keep it open, or blood/pus from the eye?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK eye injuries guidance lists these as call-999/A&E criteria. Do not try to remove any object that has pierced the eye.",
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
        severity: "Self-care",
        questionTextEn: "Is this a minor speck or particle with none of the emergency features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: wash the eye with clean water, holding it open, running water over the eyeball for at least 20 minutes.",
        redFlag: false,
        keywords: ["minor speck in eye"],
        careAdviceIds: ["oscg-eyebody-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyebody-emergency-advice", titleEn: "Emergency eye injury precautions", instructionTextEn: "Do not try to remove any object that's pierced the eye, do not touch or rub the eye, and arrange emergency transport immediately - do not drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision worsens", "pain increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyebody-selfcare-advice", titleEn: "Home first aid for something in the eye", instructionTextEn: "Wash the eye with clean, non-hot water from a tap, shower, or bottle. Hold the eye open and run water over the eyeball for at least 20 minutes, without the water flow too strong. Avoid touching or rubbing the eye and avoid makeup or contact lenses until healed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["object does not clear with rinsing", "pain or vision changes develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page last reviewed 12 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published eye injuries guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Eye - Chemical In - https://www.nhs.uk/conditions/eye-injuries/ (reviewed 2026-03-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-chemical",
    titleEn: "Eye - Chemical In",
    clinicalDefinitionEn: "Chemical in the eye assessment decomposed from NHS.UK's published eye injuries guidance.",
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
      { id: "oscg-eyechem-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the container/packaging available?" }
    ],
    questions: [
      {
        id: "oscg-eyechem-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has a strong chemical, such as oven cleaner or bleach, gotten into the eye?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK eye injuries guidance lists chemical exposure to the eye as a call-999/A&E criterion.",
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
        instructionTextEn: "Keep rinsing the eye with clean water while waiting for medical help. Take the chemical container with you if possible. Do not drive - call for an ambulance or have someone else drive.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["vision changes", "pain increases"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page last reviewed 12 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published eye injuries guidance's chemical-exposure criterion (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Treated as an unconditional emergency per the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Coughing Up Blood - https://www.nhs.uk/conditions/coughing-up-blood/ (reviewed 2024-06-13)
  // ------------------------------------------------------------------
  {
    id: "oscg-coughing-up-blood",
    titleEn: "Coughing Up Blood",
    clinicalDefinitionEn: "Hemoptysis (coughing up blood) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-hemoptysis-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any chest pain or shortness of breath?" }
    ],
    questions: [
      {
        id: "oscg-hemoptysis-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is more than just a few spots or streaks of blood being coughed up, or is there difficulty breathing, a very fast heartbeat, or chest/upper back pain along with the blood?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance: call 999 or go to A&E for these features - may indicate a serious condition such as pulmonary embolism.",
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
        rationaleEn: "NHS.UK guidance recommends an urgent GP appointment or 111 call even for small amounts of blood - occasionally a sign of a serious underlying cause.",
        redFlag: false,
        keywords: ["small streaks of blood", "flecks of blood in phlegm"],
        careAdviceIds: ["oscg-hemoptysis-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hemoptysis-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the person sitting upright and calm and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathlessness", "increasing amount of blood"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hemoptysis-urgent-advice", titleEn: "Urgent hemoptysis review", instructionTextEn: "Arrange prompt medical evaluation - even small amounts of blood in phlegm should be checked, since underlying causes range from infection to more serious conditions.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["amount of blood increases", "breathing difficulty develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-06-13", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Coughing up blood\", https://www.nhs.uk/conditions/coughing-up-blood/ (page last reviewed 13 June 2024)"],
      contentNotice: "Decomposed from NHS.UK's published coughing up blood guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Arm Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/ (reviewed 2023-05-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-arm-injury",
    titleEn: "Arm Injury",
    clinicalDefinitionEn: "Arm/wrist injury assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-arminjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the arm be moved at all?" }
    ],
    questions: [
      {
        id: "oscg-arminjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the arm or wrist numb, tingling, or has pins and needles, is there heavy bleeding, a bone sticking out of the skin, or has the arm changed shape or is at an odd angle?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken arm or wrist guidance lists these as call-999/A&E criteria.",
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
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["severe arm pain", "cannot use arm", "worsening swelling"],
        careAdviceIds: ["oscg-arminjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-arminjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild pain or bruising with the arm still usable and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides sling, ice, and pain-relief first-aid steps for a mild arm injury.",
        redFlag: false,
        keywords: ["mild arm pain"],
        careAdviceIds: ["oscg-arminjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-arminjury-emergency-advice", titleEn: "Emergency arm injury precautions", instructionTextEn: "Keep the arm still, do not attempt to realign a deformity, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening numbness", "increasing bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-arminjury-urgent-advice", titleEn: "Urgent arm injury review", instructionTextEn: "Support the arm with a towel as a sling, apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, and arrange same-day medical review. Avoid eating or drinking in case surgery is needed.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "new numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-arminjury-selfcare-advice", titleEn: "Home care for a mild arm injury", instructionTextEn: "Support the arm with a sling if needed, apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, remove jewelry from the affected limb, and take paracetamol or ibuprofen for pain.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "new numbness or inability to use the arm"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\", https://www.nhs.uk/conditions/broken-arm-or-wrist/ (page last reviewed 26 May 2023)"],
      contentNotice: "Decomposed from NHS.UK's published broken arm or wrist guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Cracked or Dry Skin - https://www.nhs.uk/conditions/atopic-eczema/ (reviewed 2024-09-06)
  // ------------------------------------------------------------------
  {
    id: "oscg-cracked-dry-skin",
    titleEn: "Cracked or Dry Skin",
    clinicalDefinitionEn: "Cracked/dry skin (eczema) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
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
      { id: "oscg-drySkin-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any blistering, leaking fluid, or spots filled with pus?" }
    ],
    questions: [
      {
        id: "oscg-drySkin-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the affected skin blistered, crusty, leaking fluid, or has spots filled with pus, is it painful/swollen/warm, has it suddenly worsened or spread, or is there fever/feeling generally unwell?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK atopic eczema guidance lists these as signs of infection or complications needing an urgent NHS 111 call or GP appointment.",
        redFlag: false,
        keywords: ["infected eczema", "blistered skin", "spreading rash worsening"],
        careAdviceIds: ["oscg-drySkin-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-drySkin-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have moisturizing treatments not helped the dry or cracked skin?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP if treatments are not helping the eczema.",
        redFlag: false,
        keywords: ["eczema not improving with treatment"],
        careAdviceIds: ["oscg-drySkin-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-drySkin-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a small area of dry, slightly itchy skin with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can advise on mild cases with small areas of dry, slightly itchy skin.",
        redFlag: false,
        keywords: ["mild dry skin"],
        careAdviceIds: ["oscg-drySkin-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-drySkin-urgent-advice", titleEn: "Urgent skin infection review", instructionTextEn: "Arrange same-day medical review for these signs of infection or complications.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-drySkin-routine-advice", titleEn: "Routine eczema follow-up", instructionTextEn: "Book a GP appointment if moisturizing treatments have not helped.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-drySkin-selfcare-advice", titleEn: "Home care for dry, cracked skin", instructionTextEn: "Apply moisturizing treatments (emollients) at least twice a day, even after symptoms improve, and use an emollient instead of soap for washing. Avoid triggers such as harsh soap, detergent, some fabrics, and pets, and keep cool since heat increases itchiness.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "not improving with moisturizing"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-09-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Atopic eczema\", https://www.nhs.uk/conditions/atopic-eczema/ (page last reviewed 06 September 2024)"],
      contentNotice: "Decomposed from NHS.UK's published atopic eczema guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
