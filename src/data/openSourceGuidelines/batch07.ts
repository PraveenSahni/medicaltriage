import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 07 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Bed Bug Bite and Fire Ant Sting reuse the same "Insect bites and
 * stings" source already cited for Bee or Yellow Jacket Sting in batch01 -
 * same page, different topic framing, same pattern as reusing Earache for
 * Ear - Foreign Body in batch06. Ear - Congestion and Ear - Discharge reuse
 * the Earache / Ear infection sources already cited in batch06.
 */
export const batch07Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Fainting - https://www.nhs.uk/conditions/fainting/ (reviewed 2023-02-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-fainting",
    titleEn: "Fainting",
    clinicalDefinitionEn: "Fainting (syncope) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "fainted", weight: 100 },
      { phrase: "fainting", weight: 100 },
      { phrase: "passed out", weight: 95 },
      { phrase: "blacked out", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fainting-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long ago did this happen, and how long were they unconscious?" },
      { id: "oscg-fainting-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have they fully recovered now?" },
      { id: "oscg-fainting-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What was the person doing right before fainting?" }
    ],
    questions: [
      {
        id: "oscg-fainting-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Are they not breathing, unable to be woken within 1 minute, not fully recovered or having difficulty with speech or movement, having chest pain or an irregular heartbeat, seriously hurt from the fall, shaking or jerking from a seizure, or did they faint while exercising or while lying down?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK fainting guidance lists all of these as call-999 criteria - fainting while exercising or lying down is especially concerning since normal fainting is usually triggered by standing.",
        redFlag: true,
        keywords: ["not breathing after fainting", "not waking up after fainting", "chest pain fainting", "fainted while exercising"],
        careAdviceIds: ["oscg-fainting-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fainting-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the person fully recovered with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: fainting is probably nothing serious, but it's still worth seeing a GP to check the cause.",
        redFlag: false,
        keywords: ["fully recovered after fainting"],
        careAdviceIds: ["oscg-fainting-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-fainting-emergency-advice",
        titleEn: "Emergency fainting precautions",
        instructionTextEn: "Lay the person on their back with legs raised (on their side if pregnant, especially 28+ weeks). Arrange emergency transport immediately.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["not waking up", "breathing stops"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      },
      {
        id: "oscg-fainting-routine-advice",
        titleEn: "Routine fainting follow-up",
        instructionTextEn: "Book a GP appointment to check the cause. If feeling faint again: lie down with legs raised or sit with head lowered between knees, drink water, eat something, and take deep breaths.",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        warningSigns: ["fainting recurs", "new symptoms develop"],
        displayOrder: 2,
        adviceCategory: "CALL_BACK_IF",
        patientSendable: true
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-02-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Fainting\", https://www.nhs.uk/conditions/fainting/ (page last reviewed 23 February 2023)"],
      contentNotice: "Decomposed from NHS.UK's published fainting guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Hiccups - https://www.nhs.uk/conditions/hiccups/ (reviewed 2023-06-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-hiccups",
    titleEn: "Hiccups",
    clinicalDefinitionEn: "Hiccups assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "hiccups", weight: 100 },
      { phrase: "hiccupping", weight: 90 },
      { phrase: "cant stop hiccuping", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hiccups-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have the hiccups lasted?" },
      { id: "oscg-hiccups-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Do the hiccups keep coming back and affecting daily life?" },
      { id: "oscg-hiccups-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any other new symptoms alongside the hiccups?" }
    ],
    questions: [
      {
        id: "oscg-hiccups-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. hiccups alongside chest pain, breathing difficulty, or other acute symptoms)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the hiccups guidance itself - hiccups are almost never an emergency, but must not mask another acute condition.",
        redFlag: true,
        keywords: ["life threatening"],
        careAdviceIds: ["oscg-hiccups-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hiccups-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have the hiccups lasted longer than 48 hours, or do they come back often and affect daily life?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends seeing a GP if hiccups last longer than 48 hours or recur frequently enough to affect daily life.",
        redFlag: false,
        keywords: ["hiccups longer than 48 hours", "recurring hiccups"],
        careAdviceIds: ["oscg-hiccups-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-hiccups-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a brief episode of hiccups with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides simple self-help techniques for brief, typical hiccups.",
        redFlag: false,
        keywords: ["brief hiccups"],
        careAdviceIds: ["oscg-hiccups-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hiccups-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["chest pain or breathing difficulty develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hiccups-routine-advice", titleEn: "Routine hiccup follow-up", instructionTextEn: "Book a GP appointment for hiccups lasting over 48 hours or recurring often.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop", "hiccups worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-hiccups-selfcare-advice", titleEn: "Home remedies for hiccups", instructionTextEn: "Try breathing into a paper bag (not over the head), pulling knees to chest and leaning forward, sipping ice-cold water, swallowing granulated sugar, or biting a lemon/tasting vinegar. Avoid alcoholic, fizzy, or hot drinks, chewing gum, smoking, spicy food, and eating quickly. These remedies aren't proven to work for everyone.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["hiccups last more than 48 hours", "new symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hiccups\", https://www.nhs.uk/conditions/hiccups/ (page last reviewed 23 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published hiccups guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Eye - Allergy - https://www.nhs.uk/conditions/conjunctivitis/ (reviewed 2024-04-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-allergy",
    titleEn: "Eye - Allergy",
    clinicalDefinitionEn: "Allergic conjunctivitis assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "eye allergy", weight: 100 },
      { phrase: "itchy watery eyes", weight: 90 },
      { phrase: "allergic conjunctivitis", weight: 85 },
      { phrase: "red itchy eyes", weight: 85 },
      { phrase: "itchy and watery", weight: 95 },
      { phrase: "watery eyes", weight: 85 },
      { phrase: "itchy eyes", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyeallergy-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-eyeallergy-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "One eye or both?" },
      { id: "oscg-eyeallergy-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any known allergy trigger (pollen, pet, new product)?" }
    ],
    questions: [
      {
        id: "oscg-eyeallergy-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there pain in the eyes, sensitivity to light, or changes in vision like wavy lines or flashing?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK conjunctivitis guidance lists these as signs of a more serious eye problem needing urgent 111 or emergency assessment.",
        redFlag: true,
        keywords: ["eye pain", "light sensitivity eyes", "vision changes"],
        careAdviceIds: ["oscg-eyeallergy-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyeallergy-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is this a baby with red, sticky eyes, does the caller wear contact lenses with eyelid spots, or have symptoms not cleared within 7 days?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["baby sticky eyes", "contact lens eye allergy", "eye symptoms over a week"],
        careAdviceIds: ["oscg-eyeallergy-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-eyeallergy-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical itchy, watery eye allergy with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can advise on eyedrops or antihistamines for typical allergic conjunctivitis.",
        redFlag: false,
        keywords: ["typical eye allergy"],
        careAdviceIds: ["oscg-eyeallergy-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyeallergy-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Arrange emergency transport for these signs of a more serious eye problem.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision worsens", "pain increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeallergy-routine-advice", titleEn: "Routine eye allergy follow-up", instructionTextEn: "Book a GP appointment for these situations, especially a baby under 30 days with sticky eyes (urgent) or a contact lens wearer with eyelid spots.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "new pain develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-eyeallergy-selfcare-advice", titleEn: "Pharmacy self-care for eye allergy", instructionTextEn: "A pharmacist can suggest eyedrops or antihistamines. Avoid rubbing the eyes and remove contact lenses until symptoms clear.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving within 7 days", "pain or vision changes develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Conjunctivitis\", https://www.nhs.uk/conditions/conjunctivitis/ (page last reviewed 23 April 2024)"],
      contentNotice: "Decomposed from NHS.UK's published conjunctivitis guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format, focused on the allergic-trigger presentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Contraception - Emergency - https://www.nhs.uk/conditions/contraception/emergency-contraception/ (reviewed 2024-01-31)
  // ------------------------------------------------------------------
  {
    id: "oscg-emergency-contraception",
    titleEn: "Contraception - Emergency",
    clinicalDefinitionEn: "Emergency contraception time-sensitivity assessment decomposed from NHS.UK's published guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "emergency contraception", weight: 100 },
      { phrase: "morning after pill", weight: 100 },
      { phrase: "unprotected sex", weight: 85 },
      { phrase: "need the emergency pill", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-emergcontra-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long ago did the unprotected sex happen?" },
      { id: "oscg-emergcontra-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the caller currently on any regular contraception?" },
      { id: "oscg-emergcontra-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any preference between the pill and the IUD (copper coil)?" }
    ],
    questions: [
      {
        id: "oscg-emergcontra-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has unprotected sex happened within the last 5 days (120 hours)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: emergency contraception is time-sensitive and must be used within 3-5 days of unprotected sex, with effectiveness decreasing the longer you wait - the IUD can be fitted up to 5 days after, levonorgestrel pills work up to 3 days after, and ulipristal acetate pills work up to 5 days after.",
        redFlag: false,
        keywords: ["unprotected sex recently", "need emergency contraception now"],
        careAdviceIds: ["oscg-emergcontra-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 78,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-emergcontra-urgent-advice",
        titleEn: "Time-sensitive emergency contraception access",
        instructionTextEn:
          "Emergency contraception is available free from sexual health/family planning clinics, GP surgeries, NHS walk-in centres, most pharmacies (pill only), and young people's services. The IUD (copper coil) is the most effective option and can be fitted within 5 days (120 hours) of unprotected sex. Levonorgestrel pills work within 3 days (72 hours); ulipristal acetate pills work within 5 days (120 hours). The sooner it's used, the more effective it is.",
        dispositionCode: "HMC_URGENT_REVIEW",
        warningSigns: ["time window is closing", "uncertainty about which option to choose"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION",
        patientSendable: true
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-31", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Emergency contraception\", https://www.nhs.uk/conditions/contraception/emergency-contraception/ (page last reviewed 31 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published emergency contraception guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. This is a time-sensitive access/information need rather than a symptom-severity ladder - only one tier is used, matching the source's own single time-window framing. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Flank Pain - https://www.nhs.uk/conditions/kidney-stones/ (reviewed 2022-11-30)
  // ------------------------------------------------------------------
  {
    id: "oscg-flank-pain",
    titleEn: "Flank Pain",
    clinicalDefinitionEn: "Flank pain (possible kidney stones) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "flank pain", weight: 100 },
      { phrase: "kidney stone", weight: 95 },
      { phrase: "side pain", weight: 75 },
      { phrase: "back and side pain", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-flank-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Which side is the pain on?" },
      { id: "oscg-flank-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-flank-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any blood in the urine?" }
    ],
    questions: [
      {
        id: "oscg-flank-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person completely unable to pass any urine, or do they have severe pain along with a high fever and shaking chills (suggesting a possible infected, obstructed kidney)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the kidney stones guidance itself - complete inability to pass urine, or severe pain with signs of infection, suggests a urological emergency (obstructed, infected kidney) needing immediate care.",
        redFlag: true,
        keywords: ["cannot pass urine", "fever and shaking with flank pain"],
        careAdviceIds: ["oscg-flank-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-flank-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the pain severe, is there a high temperature or feeling hot/cold/shivery, or is there blood in the urine?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: contact a GP or NHS 111 right away for severe pain, fever, or blood in the urine.",
        redFlag: false,
        keywords: ["severe flank pain", "fever with flank pain", "blood in urine"],
        careAdviceIds: ["oscg-flank-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-flank-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild-to-moderate flank pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: most kidney stones are small enough to pass in urine and can be managed at home with medication.",
        redFlag: false,
        keywords: ["mild flank pain"],
        careAdviceIds: ["oscg-flank-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-flank-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the person comfortable and arrange emergency transport immediately - possible infected, obstructed kidney.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "fever increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-flank-urgent-advice", titleEn: "Urgent flank pain review", instructionTextEn: "Arrange same-day medical review for severe pain, fever, or blood in the urine.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "unable to pass urine"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-flank-selfcare-advice", titleEn: "Home care for mild flank pain", instructionTextEn: "Drink plenty of water every day to avoid dehydration and aim for pale urine. Over-the-counter pain relief per local policy may help while the stone passes.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "fever or blood in urine develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-11-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Kidney stones\", https://www.nhs.uk/conditions/kidney-stones/ (page last reviewed 30 November 2022)"],
      contentNotice: "Decomposed from NHS.UK's published kidney stones guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source does not distinguish 999 vs GP/111 urgency - the emergency tier here (complete inability to pass urine, or severe pain with infection signs) is added as a standard tele-triage safety practice, not explicitly part of the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Bed Bug Bite - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-bed-bug-bite",
    titleEn: "Bed Bug Bite",
    clinicalDefinitionEn: "Bed bug bite assessment decomposed from NHS.UK's published insect bites and stings guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "bed bug bite", weight: 100 },
      { phrase: "bed bugs", weight: 90 },
      { phrase: "bites in a line", weight: 75 },
      { phrase: "itchy bites on skin", weight: 70 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bedbug-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where are the bites?" },
      { id: "oscg-bedbug-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the bites appear?" },
      { id: "oscg-bedbug-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any swelling of the lips, throat, or difficulty breathing?" }
    ],
    questions: [
      {
        id: "oscg-bedbug-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these as signs of a serious allergic reaction (anaphylaxis) requiring an immediate 999 call.",
        redFlag: true,
        keywords: ["swollen throat bite", "struggling to breathe bite"],
        careAdviceIds: ["oscg-bedbug-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bedbug-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is the skin around the bites hot, red, and painful, or is pus or fluid coming out (signs of infection)?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance flags these infection signs as needing a pharmacist or GP review.",
        redFlag: false,
        keywords: ["infected bug bites", "pus from bites"],
        careAdviceIds: ["oscg-bedbug-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-bedbug-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these minor itchy bites with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor bites without infection/allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["minor itchy bites"],
        careAdviceIds: ["oscg-bedbug-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bedbug-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport. Lie down with legs raised unless breathing is difficult.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bedbug-routine-advice", titleEn: "Routine bite follow-up", instructionTextEn: "Keep the area clean and book a routine review for signs of infection.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-bedbug-selfcare-advice", titleEn: "Home care for minor bites", instructionTextEn: "Apply an ice pack, use over-the-counter antihistamines or hydrocortisone cream, and avoid scratching. Wash bedding at a high temperature to help prevent further bites.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "allergic reaction symptoms appear"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published insect bites and stings guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the bed bug bite presentation specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Fire Ant Sting - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-fire-ant-sting",
    titleEn: "Fire Ant Sting",
    clinicalDefinitionEn: "Fire ant sting assessment decomposed from NHS.UK's published insect bites and stings guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "fire ant sting", weight: 100 },
      { phrase: "fire ant bite", weight: 95 },
      { phrase: "stung by ants", weight: 90 },
      { phrase: "ant bites burning", weight: 80 },
      { phrase: "fire ants", weight: 100 },
      { phrase: "stings burning", weight: 90 },
      { phrase: "ants stinging", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fireant-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where was the caller stung?" },
      { id: "oscg-fireant-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How many stings?" },
      { id: "oscg-fireant-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any prior serious allergic reaction to insect stings?" }
    ],
    questions: [
      {
        id: "oscg-fireant-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these as signs of a serious allergic reaction (anaphylaxis) - use an adrenaline auto-injector immediately if available.",
        redFlag: true,
        keywords: ["swollen throat sting", "struggling to breathe sting"],
        careAdviceIds: ["oscg-fireant-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fireant-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Are there multiple stings, symptoms worsening, or a previous serious allergic reaction to a sting?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists multiple stings and a prior serious reaction as reasons to call 111 or see a GP urgently.",
        redFlag: false,
        keywords: ["multiple ant stings", "prior allergic reaction to stings"],
        careAdviceIds: ["oscg-fireant-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fireant-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a single or few stings with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor stings without allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["minor ant sting"],
        careAdviceIds: ["oscg-fireant-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fireant-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport. Lie down with legs raised unless breathing is difficult.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fireant-urgent-advice", titleEn: "Urgent sting review", instructionTextEn: "Apply a cold compress and arrange same-day medical review, especially with multiple stings or a prior reaction history.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling spreads", "breathing becomes difficult"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fireant-selfcare-advice", titleEn: "Home care for minor ant stings", instructionTextEn: "Apply an ice pack, keep the area elevated, and use over-the-counter painkillers, antihistamines, or hydrocortisone cream as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling worsens", "signs of infection or allergic reaction develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published insect bites and stings guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the fire ant sting presentation specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Ear - Congestion - https://www.nhs.uk/conditions/earache/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-congestion",
    titleEn: "Ear - Congestion",
    clinicalDefinitionEn: "Ear congestion/fullness assessment decomposed from NHS.UK's published earache guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "ear congestion", weight: 100 },
      { phrase: "ear feels blocked", weight: 90 },
      { phrase: "ear feels full", weight: 85 },
      { phrase: "plugged ear", weight: 80 },
      { phrase: "ear feels really blocked", weight: 100 },
      { phrase: "blocked and full", weight: 95 },
      { phrase: "ear after my flight", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-earcongestion-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has this lasted?" },
      { id: "oscg-earcongestion-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Recent cold, flight, or swimming?" },
      { id: "oscg-earcongestion-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any pain, discharge, or hearing loss?" }
    ],
    questions: [
      {
        id: "oscg-earcongestion-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has this lasted more than 2-3 days, does the person feel generally unwell or have a high temperature, is there swelling around the ear, fluid coming from the ear, or hearing loss or change?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK earache guidance lists these as urgent GP/111 criteria, applicable when ear congestion is accompanied by these features.",
        redFlag: false,
        keywords: ["ear congestion with fever", "ear blocked with hearing loss"],
        careAdviceIds: ["oscg-earcongestion-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-earcongestion-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild ear fullness or congestion with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: most ear symptoms of this kind resolve within 2-3 days without treatment.",
        redFlag: false,
        keywords: ["mild ear fullness"],
        careAdviceIds: ["oscg-earcongestion-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earcongestion-urgent-advice", titleEn: "Urgent ear review", instructionTextEn: "Arrange same-day or next-day medical review for these accompanying symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "hearing loss increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earcongestion-selfcare-advice", titleEn: "Home care for ear congestion", instructionTextEn: "Try swallowing, yawning, or chewing gum to help equalize ear pressure. Avoid inserting objects into the ear.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms last more than 2-3 days", "pain or discharge develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earache\", https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025)"],
      contentNotice: "Decomposed from NHS.UK's published earache guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the ear congestion/fullness presentation specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Ear - Discharge - https://www.nhs.uk/conditions/ear-infection/ (reviewed 2025-01-16)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-discharge",
    titleEn: "Ear - Discharge",
    clinicalDefinitionEn: "Ear discharge assessment decomposed from NHS.UK's published ear infection guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "ear discharge", weight: 100 },
      { phrase: "fluid coming from ear", weight: 95 },
      { phrase: "ear draining fluid", weight: 90 },
      { phrase: "pus from ear", weight: 90 },
      { phrase: "fluid draining from ear", weight: 100 },
      { phrase: "draining out of my ear", weight: 95 },
      { phrase: "yellow fluid", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eardischarge-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the discharge lasted?" },
      { id: "oscg-eardischarge-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What does the discharge look like (clear, bloody, pus-like)?" },
      { id: "oscg-eardischarge-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any recent head injury?" }
    ],
    questions: [
      {
        id: "oscg-eardischarge-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Did the discharge start after a head injury, or is there clear watery fluid that could be cerebrospinal fluid?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the ear infection guidance itself - clear fluid from the ear after a head injury can indicate a skull fracture (CSF leak), a genuine emergency.",
        redFlag: true,
        keywords: ["clear fluid ear head injury", "csf leak"],
        careAdviceIds: ["oscg-eardischarge-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eardischarge-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there fluid coming from the ear along with feeling generally unwell, a high temperature, swelling around the ear, or hearing changes?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK ear infection guidance lists fluid coming from the ear as an urgent NHS 111/GP criterion.",
        redFlag: false,
        keywords: ["ear discharge with fever", "ear discharge unwell"],
        careAdviceIds: ["oscg-eardischarge-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eardischarge-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Do not plug the ear - let fluid drain freely, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion or drowsiness", "severe headache"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eardischarge-urgent-advice", titleEn: "Urgent ear discharge review", instructionTextEn: "Keep the ear dry and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "hearing loss develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-01-16", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Ear infection\", https://www.nhs.uk/conditions/ear-infection/ (page last reviewed 16 January 2025)"],
      contentNotice: "Decomposed from NHS.UK's published ear infection guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the discharge presentation specifically. The post-head-injury CSF-leak emergency screen is a standard tele-triage safety practice, not part of the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Face Swelling - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-face-swelling",
    titleEn: "Face Swelling",
    clinicalDefinitionEn: "Face swelling assessment decomposed from NHS.UK's published allergic reaction emergency guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "face swelling", weight: 100 },
      { phrase: "face is swollen", weight: 95 },
      { phrase: "swollen face", weight: 95 },
      { phrase: "puffy face", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-faceswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the swelling start?" },
      { id: "oscg-faceswelling-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Any known trigger (new food, medication, insect sting, dental problem)?" },
      { id: "oscg-faceswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any difficulty breathing or swallowing?" }
    ],
    questions: [
      {
        id: "oscg-faceswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Are the lips, mouth, throat, or tongue suddenly swollen along with the face, is the person breathing very fast or struggling to breathe, is the throat tight or hard to swallow, or has the skin turned blue, grey, or pale?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance lists these as signs of a serious allergic reaction (anaphylaxis) requiring an immediate 999 call and adrenaline auto-injector if available.",
        redFlag: true,
        keywords: ["swollen throat with face", "struggling to breathe face swelling"],
        careAdviceIds: ["oscg-faceswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-faceswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there facial swelling without breathing/swallowing difficulty, especially with dental pain or a known allergy trigger?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Facial swelling without airway involvement still warrants prompt in-person evaluation to rule out a worsening allergic reaction or a dental/facial infection.",
        redFlag: false,
        keywords: ["facial swelling no breathing problem", "dental swelling"],
        careAdviceIds: ["oscg-faceswelling-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-faceswelling-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport. Lie down with legs raised unless breathing is difficult.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-faceswelling-urgent-advice", titleEn: "Urgent facial swelling review", instructionTextEn: "Arrange same-day medical review to assess the cause of the swelling.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing or swallowing difficulty develops", "swelling spreads or worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\" (allergic reaction warning signs), https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "Decomposed from NHS.UK's published allergic reaction emergency warning signs (Crown copyright, reused under the Open Government Licence), applied to a facial-swelling presentation, adapted into IST Health's STCC-shaped triage format. The urgent (non-airway) tier is this protocol's own reasonable extension for facial swelling without emergency signs, documented as such. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
