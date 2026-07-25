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
  // 1. Fainting - Qatar-localized UAT-only draft; adult/child/pregnancy clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-fainting",
    titleEn: "Fainting",
    clinicalDefinitionEn: "UAT-only assessment of a transient loss of consciousness or suspected faint in an adult or child, including pregnancy-related, cardiac, neurologic, bleeding, and injury risks; not approved for real-patient or production use.",
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
      { id: "oscg-fainting-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the patient fully responsive and breathing normally now? Gasping or irregular breathing is not normal." },
      { id: "oscg-fainting-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, when did the episode occur, how long did unresponsiveness last, and have they completely returned to their usual behavior, speech, and movement?" },
      { id: "oscg-fainting-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What posture and activity preceded the episode, were there warning symptoms, and what did a witness observe during and after it?" },
      { id: "oscg-fainting-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there chest pain, palpitations, breathlessness, severe headache, new weakness or speech change, significant bleeding, black stool, vomiting blood, seizure features, or serious injury?" },
      { id: "oscg-fainting-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is the patient pregnant or recently pregnant, or could pregnancy be possible; and is there abdominal or one-sided pelvic pain, vaginal bleeding, or shoulder-tip pain?" },
      { id: "oscg-fainting-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Did fainting occur during exertion or while lying down, or is there known heart disease, an implanted cardiac device, or family history of sudden cardiac death before age 40 or an inherited cardiac condition?" }
    ],
    questions: [
      {
        id: "oscg-fainting-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is the patient unresponsive or not breathing normally; not fully recovered; having new speech or movement difficulty, severe headache, chest pain, severe breathlessness, sustained palpitations, ongoing seizure, or major injury; showing heavy bleeding, vomiting blood, black stool, shock or collapse; or pregnant/possibly pregnant with abdominal or one-sided pelvic pain, vaginal bleeding, shoulder-tip pain, or collapse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These features indicate possible cardiac arrest, stroke, seizure, major injury, significant blood loss, or ruptured ectopic pregnancy. HMC directs life-threatening emergencies to Qatar 999; RCOG notes that collapse may be the first sign of ectopic pregnancy.",
        redFlag: true,
        keywords: ["not breathing after fainting", "not waking up after fainting", "chest pain fainting", "fainted while exercising"],
        careAdviceIds: ["oscg-fainting-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fainting-q1-cardiac-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After immediate emergency features are excluded, did the faint occur during exertion or while lying down, without a warning, with chest symptoms or palpitations; or is there known heart disease, an implanted cardiac device, new unexplained breathlessness, or family history of sudden cardiac death before age 40 or an inherited cardiac condition?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NICE identifies exertional syncope, cardiac disease or breathlessness, abnormal ECG, and a family history of early sudden cardiac death or inherited cardiac disease as red flags requiring urgent cardiovascular assessment. Pediatric guidance applies similar cardiac red flags.",
        redFlag: false,
        keywords: ["fainted during exercise", "fainted lying down", "family sudden cardiac death"],
        careAdviceIds: ["oscg-fainting-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fainting-q2-assessment",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Has the patient completely recovered after any other fainting or blackout episode, with all emergency and cardiac red flags excluded?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A benign faint cannot be confirmed by telephone alone. Initial assessment may require witness history, vital signs, glucose when indicated, bleeding or pregnancy evaluation, and a 12-lead ECG; pediatric syncope requires age-specific assessment.",
        redFlag: false,
        keywords: ["fully recovered after fainting"],
        careAdviceIds: ["oscg-fainting-assessment-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-fainting-emergency-advice",
        titleEn: "Emergency after fainting — call Qatar 999",
        instructionTextEn: "Call Qatar 999 immediately and follow the operator's instructions. If unresponsive and not breathing normally, start age-appropriate CPR and use an AED as directed. If unresponsive but breathing normally and there is no suspected trauma, place the patient in a lateral recovery position and monitor breathing continuously; if pregnant, use a side-lying position. If trauma is possible, avoid unnecessary movement while maintaining the airway. If fully conscious, keep the patient lying safely and do not let them stand, walk, drive, or remain alone. Give no food, drink, or medicine until fully alert and swallowing safely.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["not waking up", "breathing stops"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      },
      {
        id: "oscg-fainting-urgent-advice",
        titleEn: "Urgent cardiac-risk fainting assessment",
        instructionTextEn: "Arrange urgent same-day in-person assessment through the Qatar destination approved for this UAT environment. The assessment should include a 12-lead ECG and age- and presentation-appropriate cardiovascular evaluation. Until medically cleared, do not drive, exercise, swim alone, work at height, or operate machinery. Do not start, stop, or change medication based on this telephone pathway.",
        dispositionCode: "HMC_URGENT_REVIEW",
        warningSigns: ["another faint", "chest pain, palpitations, breathlessness, or reduced responsiveness"],
        displayOrder: 2,
        adviceCategory: "DISPOSITION"
      },
      {
        id: "oscg-fainting-assessment-advice",
        titleEn: "In-person assessment after a recovered faint",
        instructionTextEn: "Arrange prompt in-person assessment using the Qatar route approved for this UAT environment. Record witness details and all medicines. The clinician may check vital signs lying and standing, glucose, pregnancy or bleeding indicators, and a 12-lead ECG. If presyncope returns before review, lie down safely; a pregnant patient should lie on their side. Do not drive or undertake hazardous activity until assessed.",
        dispositionCode: "HMC_URGENT_REVIEW",
        warningSigns: ["fainting recurs", "new pain, bleeding, neurologic, breathing, or cardiac symptoms"],
        displayOrder: 3,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, emergency, cardiology, neurology, and obstetric review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "NICE, \"Transient loss of consciousness ('blackouts') in over 16s\", CG109, updated November 2023, https://www.nice.org.uk/guidance/cg109/chapter/Recommendations",
        "Royal Children's Hospital Melbourne, \"Clinical Practice Guideline: Syncope\", updated November 2023, https://www.rch.org.au/clinicalguide/guideline_index/Syncope/",
        "Royal College of Obstetricians and Gynaecologists, \"Ectopic pregnancy\", https://www.rcog.org.uk/for-the-public/browse-our-patient-information/ectopic-pregnancy/",
        "NHS.UK, \"Fainting\", https://www.nhs.uk/symptoms/fainting/"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Adult and child variants share a canonical source but require separate Qatar adult, pediatric, cardiac, neurologic, bleeding, pregnancy, and injury approval. Emergency findings cannot be downgraded. No routine teleconsult or self-care diagnosis is permitted before in-person assessment. Qatar 999 is verified for life-threatening emergencies; the exact non-emergency assessment destination and timeframe remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 2. Hiccups - https://www.nhs.uk/conditions/hiccups/ (reviewed 2023-06-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-hiccups",
    titleEn: "Hiccups",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for persistent or recurrent hiccups, screening for cardiopulmonary, neurologic, metabolic, medication and safeguarding concerns; not approved for production.",
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
      { id: "oscg-hiccups-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any other new symptoms alongside the hiccups?" },
      { id: "oscg-hiccups-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there chest pain, breathing/swallowing difficulty, weakness, confusion, severe headache, vomiting, dehydration, recent surgery, new medicines, serious chronic disease or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-hiccups-q2-selfcare",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "After emergency features are excluded, is this a brief episode in a patient who is otherwise well?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "This UAT pathway does not prescribe unverified home manoeuvres; age, pregnancy, aspiration risk and associated illness must be checked before reassurance.",
        redFlag: false,
        keywords: ["brief hiccups"],
        careAdviceIds: ["oscg-hiccups-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hiccups-emergency-advice", titleEn: "Emergency associated symptoms", instructionTextEn: "Call Qatar 999 and do not drive for severe breathing difficulty, chest pain, collapse, new neurological deficit or reduced responsiveness. Follow dispatcher instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["chest pain or breathing difficulty", "collapse, confusion or new weakness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hiccups-routine-advice", titleEn: "Persistent hiccup assessment", instructionTextEn: "Arrange in-person primary-care review through the Qatar pathway approved for UAT when hiccups last over 48 hours, recur or affect sleep, eating or drinking. Do not start or stop medication without review.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop", "oral intake or breathing is affected"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hiccups-selfcare-advice", titleEn: "Brief hiccups safety advice", instructionTextEn: "Keep the patient observed and avoid breath-holding, paper-bag breathing, forced swallowing or other manoeuvres that may cause choking or fainting. Seek clinical review if symptoms persist, recur or affect intake.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["hiccups last more than 48 hours", "pain, breathing, neurological or hydration symptoms develop"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hiccups\", https://www.nhs.uk/conditions/hiccups/ (page last reviewed 23 June 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. This source-only Qatar adult/pediatric pathway has no generated IDs. Emergency associated symptoms cannot be downgraded; age-specific assessment, medication review and exact destination remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 3. Eye - Allergy - https://www.nhs.uk/conditions/conjunctivitis/ (reviewed 2024-04-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-allergy",
    titleEn: "Eye - Allergy",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for suspected allergic eye symptoms, screening for sight-threatening disease, trauma, chemical exposure, infection, contact-lens risk and neonatal illness; not approved for production.",
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
      { id: "oscg-eyeallergy-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any known allergy trigger (pollen, pet, new product)?" },
      { id: "oscg-eyeallergy-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there chemical/foreign-body exposure, injury, contact-lens use, severe pain, light sensitivity, reduced vision, unequal pupils, fever, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-eyeallergy-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden or reduced vision, severe eye pain, chemical exposure, penetrating/embedded object, major injury, abnormal pupil, or eye symptoms with severe headache, vomiting, confusion or rapid deterioration?",
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
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-eyeallergy-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, are itchy or watery eyes still presumed to be allergy without an in-person examination?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Remote assessment cannot safely confirm allergy or exclude infection, corneal disease, foreign body or contact-lens complications in this UAT pathway.",
        redFlag: false,
        keywords: ["typical eye allergy"],
        careAdviceIds: ["oscg-eyeallergy-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyeallergy-emergency-advice", titleEn: "Emergency eye precautions", instructionTextEn: "Call Qatar 999 for major trauma, collapse or severe systemic deterioration; otherwise proceed immediately to the locally approved emergency eye destination. Do not drive with impaired vision, rub the eye, remove an embedded object or apply drops after chemical exposure unless directed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision worsens", "pain, vomiting or confusion increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeallergy-routine-advice", titleEn: "Priority eye assessment", instructionTextEn: "Arrange prompt in-person assessment through the Qatar pathway approved for UAT. Neonates, contact-lens wearers and immunocompromised patients need age/risk-specific review. Stop wearing contact lenses until clinically cleared.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "pain, light sensitivity or vision change develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeallergy-selfcare-advice", titleEn: "In-person assessment of presumed eye allergy", instructionTextEn: "Avoid rubbing the eyes and stop contact-lens wear. Arrange in-person assessment before selecting drops or antihistamines; age, pregnancy, allergy, glaucoma and interactions must be checked.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain, light sensitivity or vision change", "swelling, fever or systemic allergy develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-04-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Conjunctivitis\", https://www.nhs.uk/conditions/conjunctivitis/ (page last reviewed 23 April 2024)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Sight-threatening and chemical/traumatic eye findings cannot be downgraded; neonatal, contact-lens, ophthalmology destination and medication rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 4. Contraception - Emergency - https://www.nhs.uk/conditions/contraception/emergency-contraception/ (reviewed 2024-01-31)
  // ------------------------------------------------------------------
  {
    id: "oscg-emergency-contraception",
    titleEn: "Contraception - Emergency",
    clinicalDefinitionEn: "Qatar-localized UAT-only, female-at-birth pathway for time-sensitive emergency-contraception assessment, including pregnancy, medication interaction, sexual-assault and minor-safeguarding controls; it is not prescribing guidance and is not approved for production.",
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
      { id: "oscg-emergcontra-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, when did each episode of unprotected intercourse or contraceptive failure occur, and when was the first day of the last menstrual period?" },
      { id: "oscg-emergcontra-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Could pregnancy already exist, is a period late, or is there one-sided pelvic/abdominal pain, vaginal bleeding, shoulder-tip pain, fainting or collapse?" },
      { id: "oscg-emergcontra-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What regular contraception, medicines and supplements are used, including enzyme-inducing treatment; and are there breastfeeding, weight/BMI or medical-device considerations?" },
      { id: "oscg-emergcontra-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Was the intercourse non-consensual, coerced or associated with exploitation; is the patient under 18; or is there any immediate safety, confidentiality or safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-emergcontra-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is emergency contraception requested after recent unprotected intercourse or contraceptive failure, including when timing is uncertain or may exceed 5 days?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: emergency contraception is time-sensitive and must be used within 3-5 days of unprotected sex, with effectiveness decreasing the longer you wait - the IUD can be fitted up to 5 days after, levonorgestrel pills work up to 3 days after, and ulipristal acetate pills work up to 5 days after.",
        redFlag: false,
        keywords: ["unprotected sex recently", "need emergency contraception now"],
        careAdviceIds: ["oscg-emergcontra-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-emergcontra-urgent-advice",
        titleEn: "Time-sensitive emergency contraception access",
        instructionTextEn:
          "Arrange confidential same-day assessment through the Qatar service approved for this UAT environment; do not delay because the exact timing or preferred method is uncertain. A qualified clinician or pharmacist must determine eligibility, timing, interactions, pregnancy testing, ongoing contraception and follow-up. Do not recommend or supply a specific product from this pathway. If assault or coercion is disclosed, prioritize immediate safety, consent, trauma-informed care, forensic options and age-appropriate safeguarding without confronting a suspected perpetrator. Call Qatar 999 for collapse, severe pain, major bleeding or immediate danger.",
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
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE, PRESCRIBING OR PRODUCTION. Female-at-birth, source-only Qatar pathway with no generated IDs. Exact legal/confidentiality, minor consent, safeguarding, sexual-assault, pharmacy/clinic access, product eligibility and follow-up rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 5. Flank Pain - Qatar-localized UAT-only draft; adult/child/pregnancy clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-flank-pain",
    titleEn: "Flank Pain",
    clinicalDefinitionEn: "UAT-only assessment of flank, side, or back pain where renal stone, infection, urinary obstruction, vascular emergency, pregnancy complication, or another cause must be considered; not approved for real-patient or production use.",
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
      { id: "oscg-flank-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, where is the pain, when did it start, was onset sudden, and does it travel to the abdomen, groin, shoulder, or testicle?" },
      { id: "oscg-flank-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the patient confused, difficult to wake, fainting or collapsed, severely short of breath, cold or clammy, or rapidly worsening?" },
      { id: "oscg-flank-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there fever, shaking chills, vomiting, inability to keep fluids down, painful urination, foul or cloudy urine, blood in urine, or inability to pass urine?" },
      { id: "oscg-flank-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is the patient pregnant, recently pregnant, or possibly pregnant, and is there one-sided pelvic or abdominal pain, vaginal bleeding, shoulder-tip pain, fainting, or reduced fetal movement?" },
      { id: "oscg-flank-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there a known abdominal aortic aneurysm, solitary kidney, kidney transplant, significant kidney disease, urinary abnormality, diabetes, immune suppression, recent urinary procedure, or anticoagulant use?" },
      { id: "oscg-flank-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Is the patient a child, unable to communicate symptoms reliably, or experiencing a first episode that has not been assessed in person?" }
    ],
    questions: [
      {
        id: "oscg-flank-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse, confusion, reduced responsiveness, severe breathing difficulty, cold or clammy skin, or rapid deterioration; sudden severe abdominal, back, or flank pain especially with a known aneurysm or pulsating abdominal mass; complete inability to pass urine with severe pain or illness; or pregnancy/possible pregnancy with severe one-sided abdominal or pelvic pain, vaginal bleeding, shoulder-tip pain, fainting, or collapse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These features may indicate shock, ruptured abdominal aortic aneurysm, complete urinary obstruction, or ruptured ectopic pregnancy. NHS identifies sudden severe abdominal or back pain as an AAA emergency, and RCOG identifies severe pain or collapse as possible ruptured ectopic pregnancy.",
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
        questionTextEn: "After immediate emergency features are excluded, is there fever or shaking chills, feeling very unwell, severe or uncontrolled pain, vomiting or dehydration, blood in urine, painful or foul-smelling urine, reduced urine, inability to pass urine, a solitary or transplanted kidney, significant renal or urinary disease, diabetes or immune suppression; or is the patient pregnant, recently pregnant, or a child?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "An infected obstructed kidney and sepsis require urgent hospital care. NICE recommends hospital or specialist assessment when pyelonephritis is accompanied by serious illness, pregnancy, dehydration, structural urinary abnormality, diabetes, immune suppression, or pediatric age.",
        redFlag: false,
        keywords: ["severe flank pain", "fever with flank pain", "blood in urine"],
        careAdviceIds: ["oscg-flank-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 90,
        questionOrder: 1
      },
      {
        id: "oscg-flank-q2-assessment",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "With all emergency and higher-risk features excluded, is this new or recurrent flank pain that has not yet been assessed in person during this episode?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A kidney stone cannot be confirmed by telephone. Flank pain may require examination, urinalysis, renal function and infection tests, pregnancy testing where relevant, and age- and pregnancy-appropriate imaging before home management is judged safe.",
        redFlag: false,
        keywords: ["new flank pain needs assessment"],
        careAdviceIds: ["oscg-flank-assessment-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-flank-emergency-advice", titleEn: "Emergency flank or back pain — call Qatar 999", instructionTextEn: "Call Qatar 999 immediately and follow the operator's instructions. Keep the patient resting in the safest comfortable position, observed, and warm. Do not allow the patient to drive, walk unassisted, eat, drink large volumes, or take new medicine while a vascular emergency, ectopic pregnancy, shock, or complete obstruction is possible. If unresponsive and not breathing normally, start age-appropriate CPR as directed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["collapse or reduced responsiveness", "worsening pain, bleeding, breathing difficulty, or shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-flank-urgent-advice", titleEn: "High-risk flank pain — same-day hospital assessment", instructionTextEn: "Arrange immediate same-day in-person assessment through the Qatar hospital or maternity destination approved for this UAT environment. Do not delay for a teleconsult. The patient may need urine and blood tests, renal-function and infection assessment, and imaging. Do not use leftover antibiotics or start, stop, or change medicine. A clinician or pharmacist must select analgesia after considering age, pregnancy, kidney function, allergy, bleeding risk, other medicines, and dehydration. Do not force fluids if the patient is vomiting, unable to urinate, or may have obstruction.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever, shaking, confusion, or worsening illness", "inability to urinate", "increasing pain, vomiting, bleeding, or fainting"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-flank-assessment-advice", titleEn: "Undiagnosed flank pain — in-person assessment", instructionTextEn: "Arrange prompt same-day in-person assessment using the Qatar route approved for this UAT environment. A clinician may need urinalysis, blood tests, pregnancy testing where relevant, and imaging; suspected renal colic in pregnancy generally requires ultrasound rather than CT as the initial imaging approach. Until assessed, use only medicine already confirmed as appropriate for this patient and do not assume the pain is a kidney stone or force excessive fluid intake.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens or becomes sudden and severe", "fever, vomiting, bleeding, reduced urine, fainting, or pregnancy-related symptoms"], displayOrder: 3, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, emergency, urology, renal, vascular, and obstetric review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "NICE, \"Pyelonephritis (acute): antimicrobial prescribing\", NG111, https://www.nice.org.uk/guidance/ng111/chapter/recommendations",
        "NICE, \"Renal and ureteric stones\", QS195, https://www.nice.org.uk/guidance/qs195",
        "NICE, \"Suspected sepsis in pregnant or recently pregnant people\", NG255, 2025, https://www.nice.org.uk/guidance/ng255",
        "Royal College of Obstetricians and Gynaecologists, \"Ectopic pregnancy\", https://www.rcog.org.uk/for-the-public/browse-our-patient-information/ectopic-pregnancy/",
        "NHS.UK, \"Abdominal aortic aneurysm\", https://www.nhs.uk/conditions/abdominal-aortic-aneurysm/",
        "NHS.UK, \"Kidney stones — Symptoms\", https://www.nhs.uk/conditions/kidney-stones/symptoms/"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Adult and child variants share a canonical source but require separate Qatar pediatric, urology, renal, vascular, infection, pregnancy, and imaging approval. Emergency findings cannot be downgraded, and no undiagnosed flank-pain self-care pathway is permitted. Qatar 999 is verified for life-threatening emergencies; exact same-day hospital, maternity, and lower-risk assessment destinations remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 6. Bed Bug Bite - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-bed-bug-bite",
    titleEn: "Bed Bug Bite",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for suspected bed-bug bites, screening for anaphylaxis, infection, extensive reactions, immune risk and environmental/safeguarding concerns; not approved for production.",
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
      { id: "oscg-bedbug-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any swelling of the lips, throat, or difficulty breathing?" },
      { id: "oscg-bedbug-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; are bites widespread or near an eye/mouth; and are there fever, severe pain, spreading redness, immune suppression, infestation affecting a vulnerable person, neglect or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-bedbug-q2-selfcare",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "After emergency and infection features are excluded, are these presumed bed-bug bites requiring confirmation and safe symptom/environmental advice?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "The cause cannot be confirmed remotely, and pediatric, pregnancy, medication and vulnerable-household risks require clinician review in this UAT pathway.",
        redFlag: false,
        keywords: ["minor itchy bites"],
        careAdviceIds: ["oscg-bedbug-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bedbug-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Call Qatar 999 immediately and follow dispatcher instructions. If the patient has their own prescribed adrenaline auto-injector, use it according to its plan. Keep the patient lying down unless breathing is difficult; do not let them stand or walk and do not drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms persist or recur", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bedbug-routine-advice", titleEn: "Routine bite follow-up", instructionTextEn: "Keep the area clean and book a routine review for signs of infection.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-bedbug-selfcare-advice", titleEn: "Clinical and environmental review for presumed bites", instructionTextEn: "Avoid scratching, gently clean affected skin, and arrange clinician or pharmacist review before medication is selected. Use a licensed pest-control process appropriate to the household; do not apply pesticides to skin or improvise chemical treatments.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["pain, spreading redness, discharge or fever", "allergic reaction symptoms"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Anaphylaxis and systemic infection cannot be downgraded; medication, pest-control, vulnerable-household and safeguarding workflows remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 7. Fire Ant Sting - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-fire-ant-sting",
    titleEn: "Fire Ant Sting",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for suspected fire-ant stings, screening for anaphylaxis, multiple-sting toxicity, infection and high-risk patients; species-specific Qatar governance is required before production.",
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
      { id: "oscg-fireant-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any prior serious allergic reaction to insect stings?" },
      { id: "oscg-fireant-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; how many stings and where; and are there breathing/swallowing symptoms, vomiting, dizziness, widespread rash, fever, severe pain, immune suppression or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fireant-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is any fire-ant sting suspected, including a single or few local stings?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Species and cumulative venom risk cannot be confirmed remotely; this Qatar UAT pathway requires prompt clinical assessment rather than medication-led self-care.",
        redFlag: false,
        keywords: ["minor ant sting"],
        careAdviceIds: ["oscg-fireant-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fireant-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Call Qatar 999 immediately and follow dispatcher instructions. If the patient has their own prescribed adrenaline auto-injector, use it according to its plan. Keep the patient lying down unless breathing is difficult; do not let them stand or walk and do not drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms persist or recur", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fireant-urgent-advice", titleEn: "Urgent sting review", instructionTextEn: "Apply a cold compress and arrange same-day medical review, especially with multiple stings or a prior reaction history.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling spreads", "breathing becomes difficult"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fireant-selfcare-advice", titleEn: "Prompt assessment for local ant stings", instructionTextEn: "Move away from further exposure, gently wash the area, avoid squeezing pustules or applying unverified products, and arrange prompt review through the Qatar pathway approved for UAT. Medication requires age, weight, pregnancy, allergy, comorbidity and interaction checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling worsens", "systemic allergy or infection develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Anaphylaxis and systemic toxicity cannot be downgraded; local species, observation, toxicology, medication and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 8. Ear - Congestion - https://www.nhs.uk/conditions/earache/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-congestion",
    titleEn: "Ear - Congestion",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for ear blockage/fullness, screening for sudden hearing loss, barotrauma, infection, foreign body and high-risk hosts; not approved for production.",
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
      { id: "oscg-earcongestion-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any pain, discharge, or hearing loss?" },
      { id: "oscg-earcongestion-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; was hearing loss sudden; and are there severe pain, dizziness, facial weakness, head injury, foreign body, diabetes, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-earcongestion-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there sudden hearing loss, severe dizziness, facial weakness, head injury, severe/worsening pain, fever or systemic illness, swelling around/behind the ear, discharge, foreign body, or any hearing change in a child or high-risk patient?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK earache guidance lists these as urgent GP/111 criteria, applicable when ear congestion is accompanied by these features.",
        redFlag: false,
        keywords: ["ear congestion with fever", "ear blocked with hearing loss"],
        careAdviceIds: ["oscg-earcongestion-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-earcongestion-q1-selfcare",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "After urgent features are excluded, is mild ear fullness still present without an established cause?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "This UAT pathway requires age-appropriate assessment before assuming wax or pressure change and does not authorize instrumentation or medication remotely.",
        redFlag: false,
        keywords: ["mild ear fullness"],
        careAdviceIds: ["oscg-earcongestion-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earcongestion-urgent-advice", titleEn: "Urgent ear review", instructionTextEn: "Arrange same-day in-person ear assessment through the Qatar pathway approved for UAT. Sudden hearing loss requires time-critical specialist assessment. Do not insert objects, irrigate the ear or use unverified drops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or swelling worsens", "hearing loss, dizziness or facial weakness increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earcongestion-selfcare-advice", titleEn: "Assessment for persistent ear fullness", instructionTextEn: "Keep the ear dry, do not insert objects or use drops, and arrange in-person primary-care review if fullness persists or recurs. Children and patients with diabetes or immune suppression need lower-threshold review.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["hearing changes", "pain, discharge, dizziness or fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earache\", https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric pathway with no generated IDs. Sudden hearing loss and serious infection cannot be downgraded; ENT destination, audiology, wax treatment and medication rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 9. Ear - Discharge - https://www.nhs.uk/conditions/ear-infection/ (reviewed 2025-01-16)
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-discharge",
    titleEn: "Ear - Discharge",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for ear discharge, screening for head injury/CSF leak, mastoid or invasive infection, foreign body, hearing loss and high-risk hosts; not approved for production.",
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
      { id: "oscg-eardischarge-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any recent head injury?" },
      { id: "oscg-eardischarge-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there severe pain, fever, swelling behind the ear, dizziness, hearing loss, facial weakness, diabetes, immune suppression, foreign body or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eardischarge-emergency-advice", titleEn: "Qatar emergency ear-discharge precautions", instructionTextEn: "Call Qatar emergency services on 999 now and follow the call-taker's instructions. Do not allow self-driving. Do not plug, irrigate, probe, or put drops into the ear; allow fluid to drain freely and use emergency ambulance transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion or drowsiness", "severe headache", "reduced consciousness or neurological symptoms"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eardischarge-urgent-advice", titleEn: "Urgent ear discharge review", instructionTextEn: "Keep the ear dry and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "hearing loss develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-01-16", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Ear infection\", https://www.nhs.uk/conditions/ear-infection/ (page last reviewed 16 January 2025)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric pathway with no generated IDs. Post-traumatic clear discharge and invasive infection cannot be downgraded; ENT, imaging, antimicrobial and exact destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 10. Face Swelling - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-face-swelling",
    titleEn: "Face Swelling",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for facial swelling, screening for anaphylaxis, deep facial/dental infection, orbital involvement, pregnancy-related hypertension and safeguarding; not approved for production.",
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
      { id: "oscg-faceswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any difficulty breathing or swallowing?" },
      { id: "oscg-faceswelling-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant or recently postpartum; and are there eye pain/vision change, fever, dental pain, drooling, neck swelling, severe headache, high blood pressure, reduced fetal movement, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-faceswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Are the lips, mouth, throat, or tongue suddenly swollen; is breathing fast or difficult; is the throat tight or swallowing difficult; is the patient blue, grey, pale, confused or collapsed; or is a pregnant/recently postpartum patient severely unwell with sudden facial swelling, severe headache, vision change, upper abdominal pain, breathing difficulty or seizure?",
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-faceswelling-emergency-advice", titleEn: "Emergency facial swelling precautions", instructionTextEn: "Call Qatar 999 immediately and follow dispatcher instructions. If anaphylaxis is suspected and the patient has their own prescribed adrenaline auto-injector, use it according to its plan. Keep the patient lying down unless breathing is difficult; do not let them stand, walk or drive. Tell 999 immediately if pregnant or recently postpartum.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms persist or recur", "loss of consciousness or seizure"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-faceswelling-urgent-advice", titleEn: "Urgent facial swelling review", instructionTextEn: "Arrange same-day medical review to assess the cause of the swelling.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing or swallowing difficulty develops", "swelling spreads or worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\" (allergic reaction warning signs), https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric pathway with no generated IDs. Airway compromise, orbital/deep infection and severe pregnancy symptoms cannot be downgraded; adrenaline, dental/ENT/ophthalmology/maternity destination and medication rules remain GOVERNANCE_REQUIRED."
    })
  }
];
