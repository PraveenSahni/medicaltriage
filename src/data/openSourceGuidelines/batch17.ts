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
  // 1. Pregnancy - Itching - Qatar-localized UAT-only draft; adult/adolescent clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-pregnancy-itching",
    titleEn: "Pregnancy - Itching",
    clinicalDefinitionEn: "UAT-only assessment of itching in a confirmed current pregnancy, including recognition of possible intrahepatic cholestasis of pregnancy; not approved for real-patient or production use.",
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
      { id: "oscg-pregitching-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the patient currently pregnant, and has the pregnancy been confirmed?" },
      { id: "oscg-pregitching-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How old is the patient and how many weeks pregnant are they?" },
      { id: "oscg-pregitching-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the patient speak privately and safely? If under 18, assess coercion, abuse, exploitation, and whether the accompanying adult may be unsafe under the Qatar safeguarding pathway approved for UAT." },
      { id: "oscg-pregitching-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Where is the itching worst, is there a rash, is it worse at night, and how long has it lasted?" },
      { id: "oscg-pregitching-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there yellowing of the skin or eyes, dark urine, pale stools, or reduced or changed fetal movement?" }
    ],
    questions: [
      {
        id: "oscg-pregitching-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there reduced or changed fetal movement, heavy vaginal bleeding, severe breathing difficulty, collapse, or another immediate threat to the pregnant patient or baby?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "HMC directs patients with concern about the baby's health or significant pregnancy red flags to an appropriate maternity emergency department and directs life-threatening emergencies to Qatar 999.",
        redFlag: true,
        keywords: ["reduced fetal movement", "heavy bleeding pregnant", "collapse pregnant"],
        careAdviceIds: ["oscg-pregitching-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-pregitching-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "In this confirmed pregnancy, is there new or persistent itching, especially without a rash, on the palms or soles, worse at night, severe or generalized, or associated with yellowing of the skin or eyes?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "RCOG states that itching can be the first sign of intrahepatic cholestasis of pregnancy and should be reported to a healthcare professional. Itching without rash, including palms or soles and worse at night, is characteristic; diagnosis requires clinical assessment and bile-acid/liver-function testing.",
        redFlag: false,
        keywords: ["severe itching in pregnancy", "whole body itching pregnant"],
        careAdviceIds: ["oscg-pregitching-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-pregitching-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Has a maternity clinician already assessed this same mild, localized itching, found no concerning cause, provided a follow-up plan, and are there no new or worsening features?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes practical comfort measures for mild pregnancy-related itching once serious causes have been checked.",
        redFlag: false,
        keywords: ["mild itching pregnancy already checked"],
        careAdviceIds: ["oscg-pregitching-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pregitching-emergency-advice", titleEn: "Emergency pregnancy warning signs", instructionTextEn: "For a life-threatening emergency, call Qatar 999. For reduced or changed fetal movement or significant pregnancy bleeding without immediate life threat, go immediately to the emergency department at the patient's booked HMC maternity hospital or the Qatar maternity destination approved for this UAT environment. Do not drive if faint, severely unwell, or bleeding heavily.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fetal movement reduces further", "bleeding, collapse, or breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pregitching-urgent-advice", titleEn: "Prompt pregnancy itching review", instructionTextEn: "Arrange prompt maternity assessment through the patient's booked maternity service or the Qatar pathway approved for this UAT environment. Possible cholestasis cannot be confirmed by telephone and may require bile-acid and liver-function blood tests. Do not start an antihistamine or other medicine unless a maternity clinician or pharmacist confirms it is appropriate in this pregnancy.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["itching worsens or affects sleep", "yellowing develops", "fetal movement changes"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-pregitching-selfcare-advice", titleEn: "Comfort measures after maternity assessment", instructionTextEn: "Follow the maternity clinician's review plan. Cool compresses, lukewarm baths, unperfumed moisturizer, and loose cotton clothing may provide comfort. These measures do not treat cholestasis. Seek reassessment if itching persists, returns, or worsens; repeated blood tests may be needed when symptoms continue.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["itching becomes severe or affects sleep", "yellowing or changed fetal movement develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult and adolescent obstetric and safeguarding review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Royal College of Obstetricians and Gynaecologists, \"Intrahepatic cholestasis of pregnancy\", updated April 2026, https://www.rcog.org.uk/for-the-public/browse-our-patient-information/intrahepatic-cholestasis-of-pregnancy/",
        "Hamad Medical Corporation, \"Maternity Care\", https://hamad.qa/EN/Hospitals-and-services/WWRC/Our-Services/Pages/Maternity-Care.aspx (accessed 25 July 2026)",
        "World Health Organization, \"Assessing and supporting adolescents' capacity for autonomous decision-making in health care settings\", 2021"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Adult and 12-17-year-old generated variants require separate Qatar obstetric approval; the adolescent variant additionally requires approved privacy, consent, safeguarding, and mandatory-reporting rules. Exact non-emergency Qatar maternity routing remains GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 2. Pregnancy - Urination Pain - Qatar-localized UAT-only draft; adult/adolescent clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-pregnancy-urination-pain",
    titleEn: "Pregnancy - Urination Pain",
    clinicalDefinitionEn: "UAT-only assessment of painful urination or suspected urinary infection in a confirmed current pregnancy; not approved for real-patient or production use.",
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
      { id: "oscg-pregurinepain-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the patient currently pregnant, and has the pregnancy been confirmed?" },
      { id: "oscg-pregurinepain-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How old is the patient and how many weeks pregnant are they?" },
      { id: "oscg-pregurinepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the patient speak privately and safely? If under 18, assess coercion, abuse, exploitation, and whether the accompanying adult may be unsafe under the Qatar safeguarding pathway approved for UAT." },
      { id: "oscg-pregurinepain-iaq4", sequence: 4, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured, and are there chills or shaking?" },
      { id: "oscg-pregurinepain-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there back or flank pain, vomiting, contractions, vaginal bleeding, fluid loss, or reduced or changed fetal movement?" }
    ],
    questions: [
      {
        id: "oscg-pregurinepain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with urinary symptoms, is the patient confused, difficult to wake, severely short of breath, fainting or collapsing, unable to keep fluids down and rapidly worsening, having regular contractions or fluid loss, bleeding heavily, or reporting reduced or changed fetal movement?",
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
        questionTextEn: "In this confirmed pregnancy, is there painful or frequent urination, urgency, blood in the urine, fever or chills, or back or flank pain without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cystitis guidance lists pregnancy itself as an automatic urgent-review criterion, since untreated UTIs in pregnancy carry a higher risk of kidney infection and preterm labor.",
        redFlag: false,
        keywords: ["pregnant with painful urination", "pregnant with back pain and uti symptoms"],
        careAdviceIds: ["oscg-pregurinepain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pregurinepain-emergency-advice", titleEn: "Emergency pregnancy urinary symptom precautions", instructionTextEn: "For a life-threatening emergency, call Qatar 999. Otherwise go immediately to the emergency department at the patient's booked HMC maternity hospital or the Qatar maternity destination approved for this UAT environment. Do not drive if faint, confused, severely unwell, or bleeding heavily.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening contractions or fluid loss", "heavier bleeding", "confusion, collapse, or breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pregurinepain-urgent-advice", titleEn: "Same-day pregnancy urinary assessment", instructionTextEn: "Arrange same-day in-person maternity or obstetric assessment through the patient's booked service or the Qatar pathway approved for this UAT environment. A urine test and clinical assessment may be required. Do not use leftover antibiotics or start an antibiotic, urinary remedy, or pain medicine unless a maternity clinician or pharmacist confirms it is appropriate in this pregnancy.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or vomiting develops", "back or flank pain worsens", "contractions, bleeding, fluid loss, or changed fetal movement develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult and adolescent obstetric and safeguarding review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Cystitis\", https://www.nhs.uk/conditions/cystitis/ (page last reviewed 11 July 2025) - pregnancy-specific urgent-review criterion",
        "NICE, \"Pyelonephritis (acute): antimicrobial prescribing\", NG111, https://www.nice.org.uk/guidance/ng111/chapter/recommendations",
        "Hamad Medical Corporation, \"Maternity Care\", https://hamad.qa/EN/Hospitals-and-services/WWRC/Our-Services/Pages/Maternity-Care.aspx (accessed 25 July 2026)",
        "World Health Organization, \"Assessing and supporting adolescents' capacity for autonomous decision-making in health care settings\", 2021"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Adult and 12-17-year-old generated variants require separate Qatar obstetric approval; the adolescent variant additionally requires approved privacy, consent, safeguarding, and mandatory-reporting rules. Exact non-emergency Qatar maternity routing and antimicrobial policy remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 3. Vaginal Discharge - Qatar-localized UAT-only draft; generated IDs 1369-1370
  // ------------------------------------------------------------------
  {
    id: "oscg-vaginal-discharge",
    titleEn: "Vaginal Discharge",
    clinicalDefinitionEn: "UAT-only assessment of vaginal discharge in female patients aged 12 years and older; not approved for real-patient or production use.",
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
      { id: "oscg-vaginaldischarge-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the patient, and can they speak privately and safely? For anyone under 18, use the Qatar-approved safeguarding pathway for possible coercion, abuse, exploitation, or an unsafe accompanying person." },
      { id: "oscg-vaginaldischarge-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Describe the color, smell, amount, duration, itching or soreness, and whether a retained tampon or other vaginal foreign body is possible." },
      { id: "oscg-vaginaldischarge-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is pregnancy possible or confirmed, or is there fever, pelvic or lower-abdominal pain, vomiting, pain urinating, bleeding between periods or after sex, recent delivery/procedure, or immunocompromise?" }
    ],
    questions: [
      {
        id: "oscg-vaginaldischarge-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has the discharge changed color, smell, texture, or amount; is there itching, soreness, urinary pain, bleeding, possible pregnancy, pelvic pain, fever, vomiting, a possible retained foreign body, recent delivery/procedure, immunocompromise, or concern for sexual abuse or exploitation?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK vaginal discharge guidance recommends prompt clinical review for these changes, which can indicate infection.",
        redFlag: false,
        keywords: ["discharge with pelvic pain", "discharge with itching and soreness"],
        careAdviceIds: ["oscg-vaginaldischarge-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-vaginaldischarge-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "For a non-pregnant adult already familiar with their usual discharge, is this unchanged, typical discharge with none of the urgent, safeguarding, or vulnerability features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes normal vaginal discharge as expected and usually nothing to worry about.",
        redFlag: false,
        keywords: ["normal vaginal discharge"],
        careAdviceIds: ["oscg-vaginaldischarge-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-vaginaldischarge-urgent-advice", titleEn: "Urgent vaginal discharge review", instructionTextEn: "Arrange same-day in-person assessment through the Qatar service approved for this UAT environment. Do not diagnose an STI or recommend an antimicrobial, antifungal, vaginal preparation, or removal of a possible foreign body by telephone. If severe or rapidly worsening pelvic pain, collapse, heavy bleeding, severe illness, or pregnancy with an immediate threat develops, call Qatar 999 and do not self-drive.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pelvic pain, fever, vomiting, heavy bleeding, faintness, or severe illness develops", "pregnancy is possible or confirmed", "safeguarding concern or inability to speak privately"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-vaginaldischarge-selfcare-advice", titleEn: "Home care for normal discharge", instructionTextEn: "Wash the area gently with warm water and mild, non-perfumed soap. Avoid perfumed soaps, deodorants, scented wipes, and douching.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["color, smell, or texture changes", "itching, soreness, or pain develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, adolescent, sexual-health, and safeguarding review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Vaginal discharge\", https://www.nhs.uk/conditions/vaginal-discharge/ (page last reviewed 15 February 2024)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Generated catalog scope is female adult and female child/adolescent only (IDs 1369-1370). Pregnancy, age, capacity, privacy, safeguarding, sexual-health testing, and medicine eligibility require clinician assessment. Exact non-emergency Qatar routing and mandatory-reporting workflow remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 4. Vaginal Bleeding - Postmenopausal - SOURCE ONLY; no generated batch-17 catalog variant
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
      { id: "oscg-postmenopausalbleeding-urgent-advice", titleEn: "Urgent postmenopausal bleeding review", instructionTextEn: "Arrange prompt gynecology or primary-care review. All postmenopausal bleeding needs professional evaluation, even a single light episode.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding becomes heavier", "abdominal pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-08-13", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Vaginal bleeding between periods or after sex\" (postmenopausal-bleeding note), https://www.nhs.uk/conditions/vaginal-bleeding-between-periods-or-after-sex/ (page last reviewed 13 August 2024)"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Any postmenopausal bleeding requires prompt in-person assessment; heavy bleeding, collapse, severe pain, or severe illness requires Qatar 999 and no self-driving. Exact Qatar gynecology routing remains GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 5. Menopause Symptoms and Questions - SOURCE ONLY; no generated batch-17 catalog variant
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-menopausesymptoms-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Are these typical menopause/perimenopause symptoms (hot flushes, night sweats, mood changes, irregular periods) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes these as common, manageable symptoms, and recommends early primary-care discussion for treatment options if they affect quality of life.",
        redFlag: false,
        keywords: ["typical menopause symptoms"],
        careAdviceIds: ["oscg-menopausesymptoms-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-menopausesymptoms-urgent-advice", titleEn: "Urgent menopause-related symptom review", instructionTextEn: "Arrange prompt primary-care review for these specific symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-menopausesymptoms-selfcare-advice", titleEn: "Managing common menopause symptoms", instructionTextEn: "Menopause and perimenopause symptoms typically last 7-9 years or longer and can change over time. Arrange routine primary-care review to discuss options - early advice can help reduce the impact on daily life, relationships, and work.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms significantly affect daily life", "any postmenopausal bleeding occurs"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-05-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Menopause - Symptoms\", https://www.nhs.uk/conditions/menopause/symptoms/ (page last reviewed 19 May 2026)"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Menopausal hormone therapy and non-hormonal medicines require individualized clinician review of bleeding, pregnancy possibility, cancer/thrombotic history, comorbidity, and interactions. Exact Qatar referral route remains GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 6. Pubic Lice - Qatar-localized UAT-only draft; generated IDs 1371-1374
  // ------------------------------------------------------------------
  {
    id: "oscg-pubic-lice",
    titleEn: "Pubic Lice",
    clinicalDefinitionEn: "UAT-only assessment of suspected pubic lice in patients aged 12 years and older; not approved for real-patient or production use.",
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
      { id: "oscg-publiclice-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the patient, where are lice or nits seen, and how long has itching been present?" },
      { id: "oscg-publiclice-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Can the patient speak privately and safely? For a child or adolescent, pubic lice requires an immediate Qatar-approved safeguarding assessment for possible sexual contact, abuse, or exploitation; do not question them in front of a potentially unsafe person." },
      { id: "oscg-publiclice-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the patient pregnant or breastfeeding, immunocompromised, affected around the eyes, or allergic to lice treatments, and what medicines or treatments have already been used?" }
    ],
    questions: [
      {
        id: "oscg-publiclice-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Is pubic lice suspected or confirmed?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends contacting a sexual-health clinic, primary-care clinician, or pharmacist for pubic lice - it will not resolve without treatment, and sexual partners should also be examined.",
        redFlag: false,
        keywords: ["suspected pubic lice"],
        careAdviceIds: ["oscg-publiclice-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-publiclice-routine-advice", titleEn: "Pubic lice assessment and treatment", instructionTextEn: "Arrange pharmacist or clinician confirmation and use only a locally approved product exactly as labelled; suitability differs by age, pregnancy or breastfeeding, allergy, skin condition, and treatment site. Do not apply body products to eyelashes or eyes. Avoid close body or sexual contact until assessment and treatment are complete; partner notification and STI testing must follow the confidential Qatar pathway approved for UAT. For anyone under 18, prioritize safeguarding review before partner-contact advice. Launder clothing and bedding according to the selected product's instructions.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["eye involvement, skin infection, allergy, or symptoms persisting after correctly completed treatment", "any safeguarding concern"], displayOrder: 1, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, sexual-health, pharmacy, and safeguarding review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pubic lice\", https://www.nhs.uk/conditions/pubic-lice/ (page last reviewed 15 May 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Generated catalog scope is adult/child and female/male (IDs 1371-1374); ageMin 12 means child variants are adolescent-only. Pediatric sexual-abuse assessment, confidentiality, mandatory reporting, partner notification, STI testing, and product formulary remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 7. Postpartum - Depression - Qatar-localized UAT-only draft; adult/adolescent clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-postpartum-depression",
    titleEn: "Postpartum - Depression",
    clinicalDefinitionEn: "UAT-only mental-health assessment for a patient who gave birth within the previous 12 months, including emergency recognition of postpartum psychosis and immediate safety risk; not approved for real-patient or production use.",
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
      { id: "oscg-postpartumdepression-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the patient, when did they give birth, and is the baby currently with them?" },
      { id: "oscg-postpartumdepression-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Can the patient speak privately and safely, away from anyone who may be controlling or unsafe? If under 18, apply the Qatar adolescent consent, safeguarding, and mandatory-reporting pathway approved for UAT." },
      { id: "oscg-postpartumdepression-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Are there thoughts, plans, or actions involving suicide, self-harm, harm to the baby, or harm to anyone else?" },
      { id: "oscg-postpartumdepression-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there severe confusion, extreme agitation, very little need for sleep with unusually high energy, hallucinations, fixed unusual beliefs, or behavior that is markedly unlike the patient's usual self?" },
      { id: "oscg-postpartumdepression-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is a safe and reliable adult physically present and able to care for the patient and baby right now?" }
    ],
    questions: [
      {
        id: "oscg-postpartumdepression-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there imminent danger; a current suicide or self-harm plan or action; thoughts, intent, or behavior suggesting harm to the baby or another person; severe confusion, hallucinations, delusions, mania, or extreme agitation; inability to care safely for self or baby; or no safe adult supervision when safety is uncertain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS guidance identifies suicide, self-harm, harm to the baby, and postpartum psychosis as emergency concerns. Postpartum psychosis can worsen rapidly and may affect insight, so caregiver observations and immediate safety are material.",
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
        questionTextEn: "Within 12 months after giving birth, is low mood, loss of interest, hopelessness, guilt, persistent anxiety, irritability, inability to sleep even when able, difficulty bonding, or difficulty coping lasting more than 2 weeks, worsening, or substantially affecting daily care, with all emergency features excluded?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends speaking promptly with a maternity, primary-care, or community health clinician if postnatal depression is suspected.",
        redFlag: false,
        keywords: ["low mood since having the baby", "struggling to cope after birth"],
        careAdviceIds: ["oscg-postpartumdepression-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postpartumdepression-emergency-advice", titleEn: "Emergency postpartum mental-health precautions", instructionTextEn: "Call Qatar 999 for an ambulance for immediate danger or suspected postpartum psychosis and follow the emergency operator's instructions. Keep the patient and baby with a safe, responsible adult; do not leave either unsupervised while risk is present. Remove access to immediate means of harm only when this can be done safely. Do not self-drive or rely on the patient to travel alone. If the patient cannot speak privately or the accompanying person may be unsafe, do not disclose sensitive information and follow the Qatar safeguarding escalation approved for this UAT environment.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["any immediate risk to the patient, baby, or another person", "psychosis, severe confusion, mania, or rapidly changing behavior", "safe supervision becomes unavailable"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postpartumdepression-urgent-advice", titleEn: "Prompt postpartum mental-health assessment", instructionTextEn: "Arrange prompt assessment through HMC Perinatal Psychiatry, the Virtual Women's Mental Health service, maternity or primary care using the exact Qatar referral route approved for this UAT environment. The published access route is HMC 16000, option 4; current operating hours and out-of-hours fallback must be confirmed operationally before nurse UAT. Treatment can include psychological support and clinician-prescribed medicine. Do not recommend starting, stopping, or changing psychiatric medicine by telephone; a qualified prescriber must assess the patient, including breastfeeding, other medicines, previous bipolar or psychotic illness, and individual risks. Ensure a safe support person knows the callback plan when the patient consents and it is safe.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["mood or ability to cope worsens", "thoughts of self-harm or harm to the baby develop", "confusion, hallucinations, unusual beliefs, agitation, or markedly reduced need for sleep develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult and adolescent perinatal mental-health and safeguarding review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Post-natal depression\", https://www.nhs.uk/mental-health/conditions/post-natal-depression/ (page last reviewed 18 March 2026)",
        "NHS.UK, \"Postpartum psychosis\", https://www.nhs.uk/mental-health/conditions/post-partum-psychosis/ (page last reviewed 18 October 2023)",
        "Hamad Medical Corporation, \"Perinatal Psychiatry\", https://hamad.qa/EN/Hospitals-and-services/HMC-Mental-Health-Service/Our-Services/Pages/Perinatal-Psychiatry.aspx (accessed 25 July 2026)",
        "Hamad Medical Corporation, \"Supporting Women's Mental Health Needs — Virtual Women's Mental Health Helpline Service\", 2026, https://hamad.qa/EN/Documents/2026/15062026/Supporting-Womens-Mental-Health-Needs_Virtual-Womens-Mental-Health-Helpline-Service.pdf",
        "World Health Organization, \"Assessing and supporting adolescents' capacity for autonomous decision-making in health care settings\", 2021"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Applicable only after confirmed birth within the previous 12 months. Adult and 12-17-year-old generated variants require separate Qatar perinatal mental-health approval; the adolescent variant additionally requires approved privacy, consent, safeguarding, and mandatory-reporting rules. HMC 16000 option 4 is a published access route, but current hours, referral acceptance, emergency fallback, and the precise nurse workflow remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 8. Heart Rate and Heartbeat Questions - Qatar-localized UAT-only draft; generated IDs 1377-1380
  // ------------------------------------------------------------------
  {
    id: "oscg-heart-rate-and-heartbeat-questions",
    titleEn: "Heart Rate and Heartbeat Questions",
    clinicalDefinitionEn: "UAT-only assessment of a fast, pounding, fluttering, slow, or irregular heartbeat across adult and pediatric patients; not approved for real-patient or production use.",
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
      { id: "oscg-heartrate-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's age, sex, pregnancy or postpartum status where relevant, measured heart rate if available, duration, pattern, and whether symptoms are occurring now?" },
      { id: "oscg-heartrate-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there chest pain, severe breathing difficulty, fainting, seizure, blue/grey color, confusion, severe weakness, or inability to wake normally?" },
      { id: "oscg-heartrate-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Is there congenital or other heart disease, prior arrhythmia, family history of sudden cardiac death, fever, dehydration, bleeding, thyroid disease, anemia, stimulant/recreational-drug use, or a new/recently changed medicine?" }
    ],
    questions: [
      {
        id: "oscg-heartrate-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are palpitations present now with chest pain, severe breathing difficulty, fainting or near-fainting, seizure, blue/grey color, severe weakness, confusion, or inability to wake normally?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK heart palpitations guidance lists these as emergency-assessment criteria. Do not drive yourself to the emergency department.",
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
        questionTextEn: "Do palpitations keep recurring, last several minutes or longer, or occur in a child, during pregnancy or postpartum, with fever/dehydration/bleeding, known heart disease, family history of sudden cardiac death, stimulant exposure, or a new or changed medicine?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends seeing a doctor for recurring or persistent palpitations, especially with cardiac risk factors.",
        redFlag: false,
        keywords: ["recurring palpitations", "palpitations with heart condition history"],
        careAdviceIds: ["oscg-heartrate-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-heartrate-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "For an otherwise well adult who is not pregnant or recently postpartum, is this a brief, occasional episode with a clear benign trigger and none of the emergency, urgent, medicine, or cardiac-risk features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes palpitations from lifestyle triggers as often not needing treatment.",
        redFlag: false,
        keywords: ["brief palpitations from stress or caffeine"],
        careAdviceIds: ["oscg-heartrate-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-heartrate-emergency-advice", titleEn: "Emergency palpitations precautions", instructionTextEn: "Call Qatar 999 now. Do not drive or allow the patient to drive. Keep them at rest and follow dispatcher instructions; do not give food, drink, or an extra dose of heart medicine unless directed by an emergency clinician.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain or breathing", "loss of consciousness, seizure, or blue/grey color"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-heartrate-urgent-advice", titleEn: "Urgent palpitations review", instructionTextEn: "Arrange prompt in-person assessment through the Qatar pathway approved for this UAT environment; an ECG and review of medicines and contributing illness may be required. Do not advise starting, stopping, or taking an extra dose of a cardiac, thyroid, stimulant, or other medicine by telephone.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["episodes become more frequent, longer, or continuous", "chest pain, breathing difficulty, faintness, or altered responsiveness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-heartrate-selfcare-advice", titleEn: "Managing lifestyle-related palpitations", instructionTextEn: "Avoid known triggers such as stress, caffeine, alcohol, smoking, recreational drugs, strenuous exercise, and sleep deprivation.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["palpitations become more frequent or last longer", "chest pain or fainting develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, obstetric, cardiac, and pharmacy review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Heart palpitations\", https://www.nhs.uk/conditions/heart-palpitations/ (page last reviewed 17 March 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Generated catalog scope is adult/child and female/male (IDs 1377-1380). Pediatric vital-sign thresholds are intentionally not encoded and require age-specific Qatar clinical governance. Exact non-emergency Qatar routing and medicine rules remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 9. Opioid Use and Problems - SOURCE ONLY; no generated batch-17 catalog variant
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-opioiduse-emergency-advice", titleEn: "Emergency opioid overdose response", instructionTextEn: "Call Qatar 999 immediately and follow dispatcher instructions. Give naloxone only if it is available and the caller is trained or the dispatcher directs its use; do not delay CPR or emergency transport. Stay with the person, do not induce vomiting, do not give food or drink, and do not let them drive. Place them in the recovery position if breathing normally and there is no suspected trauma.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing stops or worsens", "reduced response returns after naloxone"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-opioiduse-urgent-advice", titleEn: "Urgent opioid dependence support", instructionTextEn: "Arrange prompt medical review - do not stop opioids abruptly without medical guidance. Connect the caller with your organization's substance use support service for safe, supervised treatment options.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["withdrawal symptoms become severe", "any signs of overdose develop"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized emergency medicine knowledge about opioid overdose recognition (respiratory depression, pinpoint pupils, unresponsiveness) and naloxone response - not a single-source quote; no single dedicated NHS.UK page covers opioid misuse/overdose directly"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Qatar 999 is the emergency route. Naloxone availability, caller instruction, pediatric exposure, pregnancy, intentional poisoning, safeguarding, toxicology, withdrawal, and substance-use referral pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 10. Abdomen Bloating and Swelling - Qatar-localized UAT-only draft; generated IDs 1381-1384
  // ------------------------------------------------------------------
  {
    id: "oscg-abdomen-bloating-and-swelling",
    titleEn: "Abdomen Bloating and Swelling",
    clinicalDefinitionEn: "UAT-only assessment of abdominal bloating or swelling across adult and pediatric patients; not approved for real-patient or production use.",
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
      { id: "oscg-bloating-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's age and sex, when did swelling start, and is pregnancy possible or confirmed or has there been a recent delivery or abdominal procedure?" },
      { id: "oscg-bloating-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured, and is there severe or localized pain, breathing difficulty, faintness, a rigid abdomen, or rapidly increasing swelling?" },
      { id: "oscg-bloating-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there green or bloody vomit, vomiting blood, blood or black stool, inability to pass stool/gas/urine, reduced feeding or wet diapers in a child, a lump, weight loss, immunocompromise, or medicines that may cause constipation?" }
    ],
    questions: [
      {
        id: "oscg-bloating-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe sudden or rapidly worsening abdominal pain, a rigid or very tender abdomen, vomiting blood, green vomit in a child, collapse, severe breathing difficulty, heavy bleeding, or pregnancy/postpartum with severe pain or faintness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK bloating guidance lists these as emergency-assessment criteria.",
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
        questionTextEn: "Is there bloating with persistent vomiting, diarrhea or constipation, pain, fever or chills, a lump, inability to pass urine/stool/gas, blood or black stool, weight loss, reduced child feeding or urine, possible pregnancy, recent surgery, immunocompromise, or a medicine-related concern?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons for urgent clinical review.",
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
        questionTextEn: "For an otherwise well adult who is not pregnant or recently postpartum, is this mild short-lived bloating with none of the emergency, urgent, pediatric, or vulnerability features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild bloating as manageable at home with diet and lifestyle changes.",
        redFlag: false,
        keywords: ["mild bloating"],
        careAdviceIds: ["oscg-bloating-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bloating-emergency-advice", titleEn: "Emergency bloating precautions", instructionTextEn: "Call Qatar 999 and do not self-drive. Do not give food, drink, laxatives, enemas, or pain medicines unless directed by an emergency clinician.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain, rigidity, collapse, bleeding, or vomiting", "worsening breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bloating-urgent-advice", titleEn: "Urgent bloating review", instructionTextEn: "Arrange same-day in-person assessment through the Qatar route approved for this UAT environment. Do not recommend a laxative, antacid, antiemetic, or other medicine until age, pregnancy, obstruction risk, comorbidity, allergies, and current medicines have been checked.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain, vomiting, distension, or fever worsens", "blood, black stool, inability to pass stool/gas/urine, faintness, or reduced responsiveness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-bloating-selfcare-advice", titleEn: "Home care for mild bloating", instructionTextEn: "Stay physically active, chew with your mouth closed to avoid swallowing air, drink enough water, eat smaller and more frequent meals, and gently massage the stomach from right to left. Avoid fizzy drinks, excess caffeine and alcohol, gas-producing foods, and large late meals.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain, vomiting, or fever develops", "does not improve with self-care"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, obstetric, surgical, and pharmacy review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Bloating\", https://www.nhs.uk/conditions/bloating/ (page last reviewed 21 January 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Generated catalog scope is adult/child and female/male (IDs 1381-1384). Pediatric, pregnancy/postpartum, obstruction, bleeding, surgical, immunocompromise, and medicine pathways require separate Qatar clinical approval. Exact non-emergency Qatar routing remains GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  }
];
