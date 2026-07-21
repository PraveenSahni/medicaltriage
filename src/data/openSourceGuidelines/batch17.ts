import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 17 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Postpartum - Depression follows the same sensitive-topic
 * handling already established for Suicide Concerns/Sexual Assault/Domestic
 * Violence: no UK-specific hotline numbers, host org must insert local
 * Qatar contacts. Pregnancy - Urination Pain reuses the cystitis source
 * already cited for Urination Pain - Female (batch14), since pregnancy is
 * already one of that page's own urgent-review criteria. Opioid Use and
 * Problems is based on standard, universally-recognized emergency medicine
 * overdose knowledge (respiratory depression, naloxone) since no single
 * NHS.UK page covers opioid misuse/overdose directly.
 */
export const batch17Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Pregnancy - Itching - https://www.nhs.uk/conditions/itching/ (reviewed 2023-07-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-pregnancy-itching",
    titleEn: "Pregnancy - Itching",
    clinicalDefinitionEn: "Itching in pregnancy assessment decomposed from NHS.UK's published itchy skin guidance's pregnancy/obstetric cholestasis warning.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 3,
    keywords: [
      { phrase: "itching in pregnancy", weight: 100 },
      { phrase: "pregnant and really itchy", weight: 100 },
      { phrase: "itchy skin while pregnant", weight: 95 },
      { phrase: "itchy palms and soles pregnant", weight: 95 },
      { phrase: "whole body has been so itchy", weight: 100 },
      { phrase: "itchy lately worse at night", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-pregitching-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How many weeks pregnant?" },
      { id: "oscg-pregitching-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the itching worst?" },
      { id: "oscg-pregitching-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long has it lasted?" }
    ],
    questions: [
      {
        id: "oscg-pregitching-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there any itching during pregnancy, especially if it affects daily life, is severe, covers the whole body, or comes with a new rash or swelling?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK itchy skin guidance specifically flags pregnancy-related itching for GP or midwife review, since it can occasionally be caused by intrahepatic cholestasis of pregnancy (ICP), a liver condition needing monitoring.",
        redFlag: false,
        keywords: ["severe itching in pregnancy", "whole body itching pregnant"],
        careAdviceIds: ["oscg-pregitching-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-pregitching-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild, localized itching that has already been checked with a midwife or GP?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes practical comfort measures for mild pregnancy-related itching once serious causes have been checked.",
        redFlag: false,
        keywords: ["mild itching pregnancy already checked"],
        careAdviceIds: ["oscg-pregitching-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pregitching-urgent-advice", titleEn: "Urgent pregnancy itching review", instructionTextEn: "Arrange a prompt appointment with a midwife or GP - itching in pregnancy should always be checked to rule out a liver condition.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["itching worsens", "yellowing of the skin or eyes develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pregitching-selfcare-advice", titleEn: "Home comfort measures for mild itching in pregnancy", instructionTextEn: "Pat or tap the skin instead of scratching, use cool compresses and lukewarm baths, apply unperfumed moisturizer regularly, and wear loose cotton clothing. Avoid perfumed products and prolonged hot baths.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["itching becomes severe or affects sleep", "a rash, swelling, or yellowing develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Itching\", https://www.nhs.uk/conditions/itching/ (page last reviewed 19 July 2023) - pregnancy-specific warning"],
      contentNotice: "Decomposed from NHS.UK's published itchy skin guidance's pregnancy-specific section (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Pregnancy - Urination Pain - https://www.nhs.uk/conditions/cystitis/ (reviewed 2025-07-11), pregnancy-specific framing
  // ------------------------------------------------------------------
  {
    id: "oscg-pregnancy-urination-pain",
    titleEn: "Pregnancy - Urination Pain",
    clinicalDefinitionEn: "Painful urination during pregnancy, decomposed from NHS.UK's published cystitis guidance, which treats pregnancy as an automatic urgent-review criterion.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 3,
    keywords: [
      { phrase: "painful urination while pregnant", weight: 100 },
      { phrase: "burns when i pee and im pregnant", weight: 100 },
      { phrase: "pregnant with a uti", weight: 100 },
      { phrase: "pregnant and it hurts to pee", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-pregurinepain-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How many weeks pregnant?" },
      { id: "oscg-pregurinepain-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-pregurinepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any back/flank pain, contractions, or bleeding?" }
    ],
    questions: [
      {
        id: "oscg-pregurinepain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with urinary symptoms, is there confusion, a very high or low temperature, fast breathing, contractions, or vaginal bleeding?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sepsis red flags or signs of preterm labor in a pregnant person with a possible urinary tract infection require immediate emergency care.",
        redFlag: true,
        keywords: ["contractions with uti pregnant", "bleeding with urinary symptoms pregnant"],
        careAdviceIds: ["oscg-pregurinepain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-pregurinepain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person pregnant with any painful urination, back or flank pain, fever, or blood in the urine?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cystitis guidance lists pregnancy itself as an automatic urgent-review criterion, since untreated UTIs in pregnancy carry a higher risk of kidney infection and preterm labor.",
        redFlag: false,
        keywords: ["pregnant with painful urination", "pregnant with back pain and uti symptoms"],
        careAdviceIds: ["oscg-pregurinepain-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pregurinepain-emergency-advice", titleEn: "Emergency pregnancy urinary symptom precautions", instructionTextEn: "Arrange emergency transport immediately - these symptoms in pregnancy need urgent evaluation for both mother and baby.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening contractions", "heavier bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pregurinepain-urgent-advice", titleEn: "Urgent pregnancy UTI review", instructionTextEn: "Arrange same-day review with a midwife, obstetrician, or GP - UTIs in pregnancy are always treated promptly given the higher risk of complications.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever develops", "back pain worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cystitis\", https://www.nhs.uk/conditions/cystitis/ (page last reviewed 11 July 2025) - pregnancy-specific urgent-review criterion, already cited for Urination Pain - Female (batch14)"],
      contentNotice: "Decomposed from the same NHS.UK cystitis guidance already used for Urination Pain - Female, reframed here specifically for pregnancy given the source's own pregnancy-specific urgency and the higher stakes of an untreated UTI in pregnancy. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Vaginal Discharge - https://www.nhs.uk/conditions/vaginal-discharge/ (reviewed 2024-02-15)
  // ------------------------------------------------------------------
  {
    id: "oscg-vaginal-discharge",
    titleEn: "Vaginal Discharge",
    clinicalDefinitionEn: "Vaginal discharge assessment decomposed from NHS.UK's published vaginal discharge guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 2,
    keywords: [
      { phrase: "vaginal discharge", weight: 100 },
      { phrase: "discharge changed color", weight: 90 },
      { phrase: "discharge smells different", weight: 90 },
      { phrase: "unusual discharge and itchy", weight: 90 },
      { phrase: "discharge has changed color", weight: 100 },
      { phrase: "discharge has a bad smell", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-vaginaldischarge-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the color, smell, and amount." },
      { id: "oscg-vaginaldischarge-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this been noticed?" },
      { id: "oscg-vaginaldischarge-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any pelvic pain, pain urinating, or bleeding between periods?" }
    ],
    questions: [
      {
        id: "oscg-vaginaldischarge-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has the discharge changed color, smell, or texture, increased in amount, or is there itching, soreness, bleeding between periods or after sex, pain urinating, or pelvic pain?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK vaginal discharge guidance recommends contacting NHS 111 or a GP for these changes, which can indicate infection.",
        redFlag: false,
        keywords: ["discharge with pelvic pain", "discharge with itching and soreness"],
        careAdviceIds: ["oscg-vaginaldischarge-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-vaginaldischarge-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this normal, typical discharge with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes normal vaginal discharge as expected and usually nothing to worry about.",
        redFlag: false,
        keywords: ["normal vaginal discharge"],
        careAdviceIds: ["oscg-vaginaldischarge-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vaginaldischarge-urgent-advice", titleEn: "Urgent vaginal discharge review", instructionTextEn: "Arrange a prompt GP or sexual health clinic review for these changes.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pelvic pain worsens", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vaginaldischarge-selfcare-advice", titleEn: "Home care for normal discharge", instructionTextEn: "Wash the area gently with warm water and mild, non-perfumed soap. Avoid perfumed soaps, deodorants, scented wipes, and douching.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["color, smell, or texture changes", "itching, soreness, or pain develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-02-15", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Vaginal discharge\", https://www.nhs.uk/conditions/vaginal-discharge/ (page last reviewed 15 February 2024)"],
      contentNotice: "Decomposed from NHS.UK's published vaginal discharge guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Vaginal Bleeding - Postmenopausal - https://www.nhs.uk/conditions/vaginal-bleeding-between-periods-or-after-sex/ (reviewed 2024-08-13)
  // ------------------------------------------------------------------
  {
    id: "oscg-vaginal-bleeding-postmenopausal",
    titleEn: "Vaginal Bleeding - Postmenopausal",
    clinicalDefinitionEn: "Postmenopausal vaginal bleeding assessment decomposed from NHS.UK's published vaginal bleeding guidance.",
    ageMin: 40,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 3,
    keywords: [
      { phrase: "postmenopausal bleeding", weight: 100 },
      { phrase: "bleeding after menopause", weight: 100 },
      { phrase: "spotting after menopause", weight: 95 },
      { phrase: "havent had a period in years and now bleeding", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postmenopausalbleeding-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How long since the last menstrual period?" },
      { id: "oscg-postmenopausalbleeding-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How much bleeding, and for how long?" },
      { id: "oscg-postmenopausalbleeding-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any abdominal pain along with the bleeding?" }
    ],
    questions: [
      {
        id: "oscg-postmenopausalbleeding-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there any vaginal bleeding after 12 months or more without a period, regardless of how minimal or how many times it has happened?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance states any postmenopausal bleeding requires medical evaluation, even if it happens only once or the amount seems small, since it can sometimes be a sign of cancer that is easier to treat if found early.",
        redFlag: false,
        keywords: ["any postmenopausal bleeding", "single episode bleeding after menopause"],
        careAdviceIds: ["oscg-postmenopausalbleeding-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postmenopausalbleeding-urgent-advice", titleEn: "Urgent postmenopausal bleeding review", instructionTextEn: "Arrange a prompt GP appointment. All postmenopausal bleeding needs professional evaluation, even a single light episode.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding becomes heavier", "abdominal pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-08-13", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Vaginal bleeding between periods or after sex\" (postmenopausal-bleeding note), https://www.nhs.uk/conditions/vaginal-bleeding-between-periods-or-after-sex/ (page last reviewed 13 August 2024)"],
      contentNotice: "Decomposed from NHS.UK's published vaginal bleeding guidance's postmenopausal-bleeding note (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source treats any occurrence as needing prompt professional evaluation rather than self-care, so no self-care tier is included. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Menopause Symptoms and Questions - https://www.nhs.uk/conditions/menopause/symptoms/ (reviewed 2026-05-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-menopause-symptoms",
    titleEn: "Menopause Symptoms and Questions",
    clinicalDefinitionEn: "Menopause and perimenopause symptom assessment decomposed from NHS.UK's published menopause symptoms guidance.",
    ageMin: 35,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 1,
    keywords: [
      { phrase: "menopause symptoms", weight: 100 },
      { phrase: "hot flushes", weight: 95 },
      { phrase: "perimenopause questions", weight: 90 },
      { phrase: "night sweats and mood swings", weight: 85 },
      { phrase: "hot flushes and night sweats", weight: 100 },
      { phrase: "think its menopause", weight: 100 },
      { phrase: "hot flushes and night sweats lately", weight: 100 },
      { phrase: "really bad hot flushes", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-menopausesymptoms-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are present?" },
      { id: "oscg-menopausesymptoms-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-menopausesymptoms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any bleeding 12+ months after periods stopped, or a rapid heartbeat?" }
    ],
    questions: [
      {
        id: "oscg-menopausesymptoms-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there a rapid heartbeat, a change to heavier bleeding, or any vaginal bleeding after 12 or more months without a period?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK menopause symptoms guidance lists these as reasons to contact a doctor promptly.",
        redFlag: false,
        keywords: ["rapid heartbeat menopause", "heavier bleeding menopause"],
        careAdviceIds: ["oscg-menopausesymptoms-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-menopausesymptoms-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Are these typical menopause/perimenopause symptoms (hot flushes, night sweats, mood changes, irregular periods) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes these as common, manageable symptoms, and recommends early GP discussion for treatment options if they affect quality of life.",
        redFlag: false,
        keywords: ["typical menopause symptoms"],
        careAdviceIds: ["oscg-menopausesymptoms-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-menopausesymptoms-urgent-advice", titleEn: "Urgent menopause-related symptom review", instructionTextEn: "Arrange a prompt GP appointment for these specific symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-menopausesymptoms-selfcare-advice", titleEn: "Managing common menopause symptoms", instructionTextEn: "Menopause and perimenopause symptoms typically last 7-9 years or longer and can change over time. Book a routine GP appointment to discuss options - early advice can help reduce the impact on daily life, relationships, and work.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms significantly affect daily life", "any postmenopausal bleeding occurs"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-05-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Menopause - Symptoms\", https://www.nhs.uk/conditions/menopause/symptoms/ (page last reviewed 19 May 2026)"],
      contentNotice: "Decomposed from NHS.UK's published menopause symptoms guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Pubic Lice - https://www.nhs.uk/conditions/pubic-lice/ (reviewed 2026-05-15)
  // ------------------------------------------------------------------
  {
    id: "oscg-pubic-lice",
    titleEn: "Pubic Lice",
    clinicalDefinitionEn: "Pubic lice assessment decomposed from NHS.UK's published pubic lice guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 1,
    keywords: [
      { phrase: "pubic lice", weight: 100 },
      { phrase: "crabs std", weight: 90 },
      { phrase: "itchy pubic hair", weight: 85 },
      { phrase: "think i have pubic lice", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-publiclice-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has itching been present?" },
      { id: "oscg-publiclice-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has a recent sexual partner been notified?" },
      { id: "oscg-publiclice-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any lice visible on other hair-bearing areas?" }
    ],
    questions: [
      {
        id: "oscg-publiclice-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Is pubic lice suspected or confirmed?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends contacting a sexual health clinic, GP, or pharmacist for pubic lice - it will not resolve without treatment, and sexual partners should also be examined.",
        redFlag: false,
        keywords: ["suspected pubic lice"],
        careAdviceIds: ["oscg-publiclice-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-publiclice-routine-advice", titleEn: "Pubic lice treatment", instructionTextEn: "See a pharmacist, GP, or sexual health clinic for a medicated cream or shampoo treatment, applied to the whole body (excluding eyebrows/eyelashes), left on for 12 hours or overnight, then washed off and repeated after one week. Wash clothes and bedding at 50C or higher, or seal unwashable items in a plastic bag for 2 or more weeks. Avoid close body or sexual contact until treatment is complete, and have recent sexual partners examined even if they have no symptoms.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms persist after treatment"], displayOrder: 1, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-05-15", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pubic lice\", https://www.nhs.uk/conditions/pubic-lice/ (page last reviewed 15 May 2026)"],
      contentNotice: "Decomposed from NHS.UK's published pubic lice guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Postpartum - Depression - https://www.nhs.uk/mental-health/conditions/post-natal-depression/ (reviewed 2026-03-18)
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-depression",
    titleEn: "Postpartum - Depression",
    clinicalDefinitionEn: "Postpartum (postnatal) depression assessment decomposed from NHS.UK's published postnatal depression guidance, following the same sensitive-topic handling already established for Suicide Concerns.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 4,
    keywords: [
      { phrase: "postpartum depression", weight: 100 },
      { phrase: "postnatal depression", weight: 100 },
      { phrase: "feeling really low since having the baby", weight: 95 },
      { phrase: "struggling emotionally after birth", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postpartumdepression-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How long after birth, and how is the person feeling?" },
      { id: "oscg-postpartumdepression-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any thoughts of self-harm or harming the baby?" },
      { id: "oscg-postpartumdepression-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there support at home right now?" }
    ],
    questions: [
      {
        id: "oscg-postpartumdepression-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are there any thoughts of suicide, self-harm, or harming the baby?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK postnatal depression guidance identifies thoughts of suicide, self-harm, or harming the baby as requiring immediate emergency mental health attention.",
        redFlag: true,
        keywords: ["thoughts of harming the baby", "thoughts of suicide after birth", "thoughts of self harm postpartum"],
        careAdviceIds: ["oscg-postpartumdepression-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postpartumdepression-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there persistent low mood, loss of interest, excessive worry, or difficulty coping since giving birth, without thoughts of self-harm?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends speaking with a GP, midwife, or health visitor promptly if postnatal depression is suspected.",
        redFlag: false,
        keywords: ["low mood since having the baby", "struggling to cope after birth"],
        careAdviceIds: ["oscg-postpartumdepression-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumdepression-emergency-advice", titleEn: "Emergency postpartum mental health precautions", instructionTextEn: "Connect the caller with your organization's local emergency mental health crisis line or emergency services immediately - do not leave the person or baby unsupervised if there is any immediate risk.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["any immediate risk to the person or baby"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumdepression-urgent-advice", titleEn: "Getting help for postpartum depression", instructionTextEn: "Encourage speaking with a GP, midwife, or health visitor promptly. Talking therapies and, where appropriate, antidepressants (including options considered safe while breastfeeding) can help. Practical support with childcare, chores, sleep, and connecting with local parent-baby or support groups can also make a real difference.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["mood worsens", "any thoughts of self-harm develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-18", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Post-natal depression\", https://www.nhs.uk/mental-health/conditions/post-natal-depression/ (page last reviewed 18 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published postnatal depression guidance (Crown copyright, reused under the Open Government Licence). Consistent with the handling already established for Suicide Concerns/Sexual Assault or Rape/Domestic Violence, UK-specific hotline names/numbers (e.g. Samaritans, PANDAS) are deliberately NOT included - care advice instead directs the triager to the host organization's own local crisis and support resources, which MUST be inserted before production use. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Heart Rate and Heartbeat Questions - https://www.nhs.uk/conditions/heart-palpitations/ (reviewed 2026-03-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-heart-rate-and-heartbeat-questions",
    titleEn: "Heart Rate and Heartbeat Questions",
    clinicalDefinitionEn: "Heart palpitations/heartbeat concern assessment decomposed from NHS.UK's published heart palpitations guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "heart palpitations", weight: 100 },
      { phrase: "heart racing", weight: 95 },
      { phrase: "heartbeat feels irregular", weight: 95 },
      { phrase: "my heart is pounding", weight: 90 },
      { phrase: "heart has been racing and pounding", weight: 100 },
      { phrase: "pounding out of nowhere", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-heartrate-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has this been happening, and how often?" },
      { id: "oscg-heartrate-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any chest pain, shortness of breath, or fainting?" },
      { id: "oscg-heartrate-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any known heart condition or family history of heart disease?" }
    ],
    questions: [
      {
        id: "oscg-heartrate-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Do the palpitations come with chest pain, shortness of breath, or feeling faint or fainting?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK heart palpitations guidance lists these as call-999/A&E criteria. Do not drive to A&E.",
        redFlag: true,
        keywords: ["palpitations with chest pain", "palpitations with fainting"],
        careAdviceIds: ["oscg-heartrate-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-heartrate-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Do the palpitations keep coming back or happen more often, last several minutes or longer, or occur with a known heart condition or family history of heart disease?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends seeing a doctor for recurring or persistent palpitations, especially with cardiac risk factors.",
        redFlag: false,
        keywords: ["recurring palpitations", "palpitations with heart condition history"],
        careAdviceIds: ["oscg-heartrate-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-heartrate-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a brief, occasional palpitation episode linked to stress, caffeine, or lack of sleep, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes palpitations from lifestyle triggers as often not needing treatment.",
        redFlag: false,
        keywords: ["brief palpitations from stress or caffeine"],
        careAdviceIds: ["oscg-heartrate-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-heartrate-emergency-advice", titleEn: "Emergency palpitations precautions", instructionTextEn: "Do not drive to A&E - ask someone to drive you or call 999 for an ambulance. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-heartrate-urgent-advice", titleEn: "Urgent palpitations review", instructionTextEn: "Arrange a prompt medical review, likely including an ECG, to identify the cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["episodes become more frequent or longer", "new symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-heartrate-selfcare-advice", titleEn: "Managing lifestyle-related palpitations", instructionTextEn: "Avoid known triggers such as stress, caffeine, alcohol, smoking, recreational drugs, strenuous exercise, and sleep deprivation.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["palpitations become more frequent or last longer", "chest pain or fainting develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Heart palpitations\", https://www.nhs.uk/conditions/heart-palpitations/ (page last reviewed 17 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published heart palpitations guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Opioid Use and Problems - standard emergency medicine overdose knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-opioid-use-and-problems",
    titleEn: "Opioid Use and Problems",
    clinicalDefinitionEn: "Opioid misuse and overdose assessment, based on standard, universally-recognized emergency medicine knowledge about opioid overdose recognition and response.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "opioid overdose", weight: 100 },
      { phrase: "took too many pain pills", weight: 95 },
      { phrase: "opioid problem", weight: 100 },
      { phrase: "wont wake up after taking pills", weight: 100 },
      { phrase: "way too many pain pills", weight: 100 },
      { phrase: "wont wake up", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-opioiduse-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was taken, how much, and when?" },
      { id: "oscg-opioiduse-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person breathing normally and responsive?" },
      { id: "oscg-opioiduse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is naloxone (Narcan) available?" }
    ],
    questions: [
      {
        id: "oscg-opioiduse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person very slow to respond or unresponsive, breathing slowly, shallowly, or not at all, or do the pupils look pinpoint-small?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Widely-recognized, standard emergency medicine knowledge: slowed/stopped breathing, unresponsiveness, and pinpoint pupils are the classic opioid overdose triad and are immediately life-threatening.",
        redFlag: true,
        keywords: ["not breathing after taking pills", "unresponsive after opioid use", "pinpoint pupils overdose"],
        careAdviceIds: ["oscg-opioiduse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-opioiduse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a concern about opioid misuse, dependence, or difficulty stopping, without signs of an overdose right now?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Opioid dependence needs prompt medical support - stopping abruptly can be dangerous, and medically supervised tapering or substitution treatment is safer.",
        redFlag: false,
        keywords: ["opioid dependence concern", "trying to stop opioids"],
        careAdviceIds: ["oscg-opioiduse-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-opioiduse-emergency-advice", titleEn: "Emergency opioid overdose response", instructionTextEn: "Call for emergency help immediately. If naloxone (Narcan) is available and you are trained, administer it and be prepared to give rescue breaths. Stay with the person, place in the recovery position if breathing, and be ready to repeat naloxone if there's no response, since its effects can wear off before the opioid does.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing stops or worsens", "no response to naloxone"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-opioiduse-urgent-advice", titleEn: "Urgent opioid dependence support", instructionTextEn: "Arrange prompt medical review - do not stop opioids abruptly without medical guidance. Connect the caller with your organization's substance use support service for safe, supervised treatment options.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["withdrawal symptoms become severe", "any signs of overdose develop"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized emergency medicine knowledge about opioid overdose recognition (respiratory depression, pinpoint pupils, unresponsiveness) and naloxone response - not a single-source quote; no single dedicated NHS.UK page covers opioid misuse/overdose directly"],
      contentNotice: "This protocol is based on widely-taught, non-proprietary emergency medicine knowledge about opioid overdose recognition and naloxone response, since no single NHS.UK page was found covering this directly. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, and confirmation of local naloxone availability/protocols."
    })
  },

  // ------------------------------------------------------------------
  // 10. Abdomen Bloating and Swelling - https://www.nhs.uk/conditions/bloating/ (reviewed 2026-01-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-abdomen-bloating-and-swelling",
    titleEn: "Abdomen Bloating and Swelling",
    clinicalDefinitionEn: "Abdominal bloating/swelling assessment decomposed from NHS.UK's published bloating guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "abdominal bloating", weight: 100 },
      { phrase: "stomach feels bloated", weight: 95 },
      { phrase: "belly is swollen", weight: 90 },
      { phrase: "tummy is bloated and gassy", weight: 90 },
      { phrase: "bloated and gassy for the past few days", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bloating-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the bloating lasted?" },
      { id: "oscg-bloating-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-bloating-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any vomiting, changed bowel habits, or a lump felt in the tummy?" }
    ],
    questions: [
      {
        id: "oscg-bloating-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe sudden stomach pain, vomiting blood, or severe breathing difficulty along with the bloating?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK bloating guidance lists these as call-999 criteria.",
        redFlag: true,
        keywords: ["severe sudden stomach pain with bloating", "vomiting blood with bloating"],
        careAdviceIds: ["oscg-bloating-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bloating-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there bloating with vomiting, diarrhea, or constipation, a stomach ache, fever or chills, a lump or swelling felt in the tummy, inability to pass urine/stool/gas, or heartburn/acid reflux?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["bloating with vomiting or diarrhea", "lump felt in the tummy", "bloating with fever"],
        careAdviceIds: ["oscg-bloating-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bloating-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild bloating with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild bloating as manageable at home with diet and lifestyle changes.",
        redFlag: false,
        keywords: ["mild bloating"],
        careAdviceIds: ["oscg-bloating-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bloating-emergency-advice", titleEn: "Emergency bloating precautions", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "worsening breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bloating-urgent-advice", titleEn: "Urgent bloating review", instructionTextEn: "Arrange same-day medical review for these accompanying symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-bloating-selfcare-advice", titleEn: "Home care for mild bloating", instructionTextEn: "Stay physically active, chew with your mouth closed to avoid swallowing air, drink enough water, eat smaller and more frequent meals, and gently massage the stomach from right to left. Avoid fizzy drinks, excess caffeine and alcohol, gas-producing foods, and large late meals.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain, vomiting, or fever develops", "does not improve with self-care"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-01-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Bloating\", https://www.nhs.uk/conditions/bloating/ (page last reviewed 21 January 2026)"],
      contentNotice: "Decomposed from NHS.UK's published bloating guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
