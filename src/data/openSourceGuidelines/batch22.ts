import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 22 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence) where available, plus standard, non-proprietary medical/safety
 * knowledge where a specific NHS.UK page could not be retrieved (Contraception
 * - Birth Control Pills Combined uses the globally-recognized "ACHES" blood-clot
 * warning mnemonic; Muscle Aches and Body Pain generalizes the flu guidance
 * already used in batch19; Face Pain and Mouth Pain generalize the sinus/
 * tooth/mouth-injury sources already established). Child Abuse Suspected and
 * Child Neglect Suspected follow the same sensitive-topic handling already
 * established for Domestic Violence (batch16) and Elder/Vulnerable Adult
 * Abuse: no fabricated hotline numbers, host org must insert local Qatar
 * mandated-reporting/support contacts before production use.
 */
export const batch22Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Pelvic Pain - Female - https://www.nhs.uk/conditions/pelvic-pain/ (reviewed 2025-11-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-pelvic-pain-female",
    titleEn: "Pelvic Pain - Female",
    clinicalDefinitionEn: "Pelvic or lower abdominal pain assessment for a patient with female reproductive anatomy. Pregnancy, postpartum status, age, sexual-health and safeguarding context must be assessed; unexplained pain is not diagnosed remotely.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "pelvic pain", weight: 100 },
      { phrase: "pain in my lower abdomen", weight: 85 },
      { phrase: "pain in my pelvis", weight: 95 },
      { phrase: "lower belly pain female", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-pelvicpainf-iaq1", sequence: 1, responseType: "PAIN_SCALE", promptTextEn: "Where is the pain, did it start suddenly, is it one-sided, and how severe is it from 0 to 10?" },
      { id: "oscg-pelvicpainf-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it begin, and is it constant, worsening, or coming and going?" },
      { id: "oscg-pelvicpainf-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Could the patient be pregnant, have they recently given birth, or is a period late? Do not exclude pregnancy because contraception is used." },
      { id: "oscg-pelvicpainf-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there vaginal bleeding or discharge, fever, vomiting, faintness, shoulder-tip pain, urinary difficulty, or blood in urine or stool?" },
      { id: "oscg-pelvicpainf-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult and in sexual relationships?" }
    ],
    questions: [
      {
        id: "oscg-pelvicpainf-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse or fainting, marked dizziness, pale or clammy skin, confusion, breathing difficulty, heavy vaginal bleeding, severe or rapidly worsening pain, a rigid or very tender abdomen, or sudden severe one-sided pelvic pain with vomiting? If pregnancy is possible, is there pain with bleeding or shoulder-tip pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These features can indicate ruptured ectopic pregnancy, ovarian torsion, major bleeding, peritonitis, or shock. NICE notes ectopic pregnancy can be atypical and may occur without known risk factors.",
        redFlag: true,
        keywords: ["severe pelvic pain with dizziness", "shoulder tip pain with pelvic pain", "heavy vaginal bleeding with pelvic pain"],
        careAdviceIds: ["oscg-pelvicpainf-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-pelvicpainf-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without the emergency features above, is pregnancy possible, is the patient postpartum, under 18, or is there persistent or one-sided pain, fever or chills, vomiting, abnormal vaginal discharge or bleeding, urinary pain/frequency/retention, blood in urine or stool, rectal pressure, pain during sex, or concern about sexual assault or an unsafe caregiver?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "These features require in-person examination, pregnancy testing where applicable, and possible urine, infection, ultrasound, or safeguarding assessment; tele-triage cannot exclude ectopic pregnancy, torsion, pelvic infection, appendicitis, urinary obstruction, or abuse.",
        redFlag: false,
        keywords: ["pelvic pain with fever", "pelvic pain with vaginal discharge", "pregnant with pelvic pain"],
        careAdviceIds: ["oscg-pelvicpainf-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-pelvicpainf-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is this mild pelvic pain with pregnancy excluded and none of the emergency, urgent, pediatric, postpartum, or safeguarding features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "Unexplained pelvic pain still requires clinical follow-up to determine the cause; this is not a diagnosis or medication branch.",
        redFlag: false,
        keywords: ["mild pelvic pain"],
        careAdviceIds: ["oscg-pelvicpainf-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 40,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pelvicpainf-emergency-advice", titleEn: "Emergency pelvic pain precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Keep the patient at rest and do not let them drive. Tell the call handler if pregnancy or recent birth is possible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "worsening dizziness or bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pelvicpainf-urgent-advice", titleEn: "Urgent in-person pelvic pain review", instructionTextEn: "Arrange urgent in-person gynecology, early-pregnancy, maternity, pediatric, or safeguarding assessment as applicable; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "fever, faintness, vomiting, shoulder pain, or bleeding develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-pelvicpainf-selfcare-advice", titleEn: "Pelvic pain clinical follow-up", instructionTextEn: "Arrange in-person clinical review to determine the cause; the exact Qatar destination remains GOVERNANCE_REQUIRED. A clinician or pharmacist should confirm any medicine is suitable, especially for a child, pregnancy, postpartum patient, or patient with bleeding or kidney disease.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["pain worsens", "fever, faintness, vomiting, shoulder pain, or bleeding develops"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-11-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pelvic pain\", https://www.nhs.uk/symptoms/pelvic-pain/", "NICE NG126, \"Ectopic pregnancy and miscarriage: symptoms, signs and initial assessment\", https://www.nice.org.uk/guidance/ng126/chapter/symptoms-and-signs-of-ectopic-pregnancy-and-initial-assessment"],
      contentNotice: "Safety-first UAT adaptation for patients with female reproductive anatomy, including pregnancy, postpartum, pediatric and safeguarding distinctions. Exact Qatar non-emergency gynecology, early-pregnancy, pediatric and safeguarding routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content. Requires Qatar clinical-governance validation before nurse UAT and is prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Abdominal Pain - Upper - https://www.nhs.uk/conditions/indigestion/ (reviewed 2023-05-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-abdominal-pain-upper",
    titleEn: "Abdominal Pain - Upper",
    clinicalDefinitionEn: "Upper abdominal or epigastric pain assessment. Indigestion is considered only after emergency cardiac, gastrointestinal bleeding, surgical, pregnancy-related, and pediatric causes are screened.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "upper abdominal pain", weight: 100 },
      { phrase: "indigestion", weight: 100 },
      { phrase: "pain in my upper stomach", weight: 90 },
      { phrase: "heartburn and stomach pain", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-upperabdopain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain, does it spread to the chest, back, shoulder, arm, neck, or jaw, and is the abdomen rigid or very tender?" },
      { id: "oscg-upperabdopain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it start, was onset sudden, and is it constant, worsening, or recurrent?" },
      { id: "oscg-upperabdopain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there vomiting blood or coffee-ground material, black tarry stool, red blood in stool, fainting, sweating, breathing difficulty, persistent vomiting, fever, or yellow skin/eyes?" },
      { id: "oscg-upperabdopain-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Could the patient be pregnant, have they recently given birth, or is the patient under 18?" },
      { id: "oscg-upperabdopain-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "If under 18, can the patient speak privately, do they feel safe with the caregiver, and is there any possible injury or ingestion?" }
    ],
    questions: [
      {
        id: "oscg-upperabdopain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe or rapidly worsening pain, a rigid or very tender abdomen, fainting or collapse, pale or clammy skin, vomiting blood or coffee-ground material, black tarry stool with weakness or dizziness, chest pressure or pain spreading to the arm/neck/jaw/back, severe breathing difficulty, confusion, or pregnancy/postpartum pain with severe headache, vision change, bleeding, or collapse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These features can indicate major gastrointestinal bleeding, shock, perforation or peritonitis, acute cardiac disease, or a pregnancy-related emergency and require immediate assessment.",
        redFlag: true,
        keywords: ["vomiting blood upper abdominal pain", "black stool fainting", "upper abdominal pain chest pressure", "rigid tender abdomen"],
        careAdviceIds: ["oscg-upperabdopain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-upperabdopain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without emergency features, is the patient under 18, pregnant or postpartum, or is there persistent/recurrent pain, fever, repeated vomiting, pain through to the back or shoulder, difficulty swallowing, weight loss, jaundice, blood in vomit or stool without instability, a palpable lump, possible injury/ingestion, or concern about an unsafe caregiver?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "These presentations need in-person examination and may need ECG, blood tests, imaging, pregnancy testing, toxicology or safeguarding assessment. Adult indigestion advice must not be copied to children.",
        redFlag: false,
        keywords: ["child upper abdominal pain", "persistent upper abdominal pain", "difficulty swallowing weight loss", "jaundice abdominal pain"],
        careAdviceIds: ["oscg-upperabdopain-adult-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-upperabdopain-q2-selfcare-adult",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is the patient an adult who is not pregnant or postpartum, with brief typical indigestion or heartburn, no significant comorbidity, and none of the emergency or urgent features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Limited lifestyle advice may be reasonable for an otherwise well adult with a familiar, brief indigestion pattern after red flags are excluded; this branch does not apply to children.",
        redFlag: false,
        keywords: ["brief typical adult indigestion"],
        careAdviceIds: ["oscg-upperabdopain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-upperabdopain-urgent-advice", titleEn: "Emergency upper abdominal pain precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not let the patient drive. Do not give food, drink, or medicine while awaiting instructions if they are vomiting blood, drowsy, or may need emergency procedures.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["collapse", "worsening pain", "more blood in vomit or stool", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-upperabdopain-selfcare-advice", titleEn: "Mandatory upper abdominal pain assessment", instructionTextEn: "Children, pregnant/postpartum patients, and anyone with persistent or concerning features need in-person assessment; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain becomes severe or persistent", "vomiting, fever, jaundice, chest symptoms, blood, black stool, fainting, or breathing difficulty develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-upperabdopain-adult-selfcare-advice", titleEn: "Limited adult indigestion care", instructionTextEn: "For a well adult with a familiar brief indigestion pattern only, avoid known food or alcohol triggers and late meals. A clinician or pharmacist should confirm any antacid or pain medicine is suitable, especially with other medicines, kidney/liver disease, ulcers, or bleeding risk.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain becomes severe or persistent", "vomiting, fever, jaundice, chest symptoms, blood, black stool, fainting, or breathing difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Indigestion\", https://www.nhs.uk/conditions/indigestion/", "NHS.UK, \"Heart attack\", https://www.nhs.uk/conditions/heart-attack/", "University College London Hospitals, \"Abdominal pain\" emergency return criteria, https://www.uclh.nhs.uk/patients-and-visitors/patient-information-pages/abdominal-pain"],
      contentNotice: "Safety-first UAT adaptation separating emergency, mandatory in-person pediatric/pregnancy assessment, and a narrow adult-only indigestion branch. Exact Qatar non-emergency pediatric, obstetric and abdominal-pain destinations remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content. Requires Qatar clinical-governance validation before nurse UAT and is prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Contraception - IUD Symptoms and Questions - https://www.nhs.uk/contraception/methods-of-contraception/iud-coil/side-effects/ (reviewed 2024-02-15)
  // ------------------------------------------------------------------
  {
    id: "oscg-contraception-iud",
    titleEn: "Contraception - IUD Symptoms and Questions",
    clinicalDefinitionEn: "IUD symptom assessment for a patient with a uterus and an IUD in place. Pregnancy, ectopic pregnancy, infection, perforation or displacement must be excluded before expected side effects are assumed.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "iud symptoms", weight: 100 },
      { phrase: "coil side effects", weight: 100 },
      { phrase: "cant feel my iud strings", weight: 100 },
      { phrase: "iud pain question", weight: 90 },
      { phrase: "have an iud and cant feel the strings", weight: 100 },
      { phrase: "cant feel the strings anymore", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-iudsymptoms-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the IUD fitted, and when were the threads last felt normally?" },
      { id: "oscg-iudsymptoms-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Describe pain, bleeding, discharge, fever, faintness, vomiting, missed period, positive pregnancy test, and whether the device or threads feel different." },
      { id: "oscg-iudsymptoms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Could the patient be pregnant, have they recently given birth, or was there unprotected sex after the threads changed or could not be felt?" },
      { id: "oscg-iudsymptoms-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, do they feel safe with the accompanying adult and sexual partner, and is there any concern about coercion or assault?" }
    ],
    questions: [
      {
        id: "oscg-iudsymptoms-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse, fainting or marked dizziness, pale or clammy skin, heavy bleeding, severe or rapidly worsening lower abdominal/pelvic pain, sudden one-sided pain with vomiting, a rigid or very tender abdomen, confusion or severe illness? If pregnancy is possible, is there pain, bleeding, or shoulder-tip pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These features can indicate ruptured ectopic pregnancy, ovarian torsion, major bleeding, perforation, peritonitis, or sepsis. Pregnancy with an IUD has an increased relative risk of being ectopic.",
        redFlag: true,
        keywords: ["pregnant with iud pain bleeding", "collapse pelvic pain iud", "sudden one sided pain vomiting"],
        careAdviceIds: ["oscg-iudsymptoms-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-iudsymptoms-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without emergency features, is pregnancy suspected, can the threads not be felt or do they feel different, can the device be felt, is there persistent pain, fever, abnormal or smelly discharge, very heavy bleeding, pain during sex, recent postpartum insertion, or is the patient under 18 or reporting coercion or an unsafe caregiver?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "These findings require in-person pregnancy testing, pelvic assessment and possible ultrasound, infection testing, device-position check, emergency-contraception discussion, or safeguarding assessment.",
        redFlag: false,
        keywords: ["cant feel iud threads", "possible pregnancy with iud", "fever discharge iud", "iud coercion"],
        careAdviceIds: ["oscg-iudsymptoms-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-iudsymptoms-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these mild expected cramps or bleeding changes soon after fitting, with pregnancy excluded, threads unchanged, and none of the emergency, urgent, adolescent, postpartum, or safeguarding features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK describes mild period-like pain and bleeding changes as common after fitting, but this branch requires all higher-risk features to be absent.",
        redFlag: false,
        keywords: ["mild expected iud cramps"],
        careAdviceIds: ["oscg-iudsymptoms-expected-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-iudsymptoms-urgent-advice", titleEn: "Emergency IUD complication precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Keep the patient at rest and do not let them drive. Tell the call handler about the IUD and any possible pregnancy or recent birth.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["collapse or fainting", "pain or bleeding worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-iudsymptoms-selfcare-advice", titleEn: "Urgent in-person IUD assessment", instructionTextEn: "Arrange urgent in-person gynecology, early-pregnancy, pediatric or safeguarding assessment as applicable; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED. If threads cannot be felt or have changed, do not rely on the IUD for contraception until checked; a clinician must assess whether emergency contraception and pregnancy testing are needed.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain, faintness, fever, discharge, or bleeding worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-iudsymptoms-expected-advice", titleEn: "Monitoring expected IUD effects", instructionTextEn: "Mild cramps and bleeding changes can occur after fitting. A clinician or pharmacist should confirm any pain medicine is suitable, especially for a patient under 18, pregnant/postpartum, taking other medicines, or with kidney disease, ulcers, asthma triggered by anti-inflammatory medicines, or bleeding risk.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain becomes severe or persistent", "fever, abnormal discharge, heavy bleeding, pregnancy concern, or changed threads develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-02-15", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"IUD (coil) - Side effects\", https://www.nhs.uk/contraception/methods-of-contraception/iud-coil/side-effects/", "NICE NG126, \"Ectopic pregnancy and miscarriage: symptoms, signs and initial assessment\", https://www.nice.org.uk/guidance/ng126/chapter/symptoms-and-signs-of-ectopic-pregnancy-and-initial-assessment"],
      contentNotice: "Safety-first UAT adaptation for a patient with a uterus and IUD, including ectopic pregnancy, torsion, infection, perforation, pediatric, postpartum and safeguarding distinctions. Exact Qatar non-emergency gynecology, early-pregnancy, pediatric and safeguarding routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content. Requires Qatar clinical-governance validation before nurse UAT and is prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Contraception - Birth Control Pills Combined - SOURCE ONLY; no generated batch-22 catalog variant
  // ------------------------------------------------------------------
  {
    id: "oscg-contraception-birth-control-pills-combined",
    titleEn: "Contraception - Birth Control Pills Combined",
    clinicalDefinitionEn: "Combined contraceptive pill symptom assessment based on standard, globally-recognized reproductive-health knowledge (the \"ACHES\" blood-clot warning sign mnemonic).",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 4,
    keywords: [
      { phrase: "combined pill side effects", weight: 100 },
      { phrase: "birth control pill question", weight: 95 },
      { phrase: "combined oral contraceptive symptoms", weight: 90 },
      { phrase: "on the pill and feel off", weight: 85 },
      { phrase: "on the combined pill", weight: 100 },
      { phrase: "bad headache and my vision is blurry", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-combinedpill-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's age, when was the last pill taken, were any pills missed, and is pregnancy possible or confirmed or has there been a recent delivery?" },
      { id: "oscg-combinedpill-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are present, including chest or abdominal pain, breathing difficulty, one-sided leg swelling, severe headache, weakness, speech difficulty, or vision change?" },
      { id: "oscg-combinedpill-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the patient speak privately and safely, and is there smoking, migraine with aura, high blood pressure, immobility/surgery, clot history, liver disease, breastfeeding, or a new interacting medicine?" }
    ],
    questions: [
      {
        id: "oscg-combinedpill-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe abdominal pain, chest pain or shortness of breath, a severe headache unlike usual, eye problems (blurred vision, loss of vision, double vision), or severe leg pain/swelling - the well-known \"ACHES\" combined-pill blood clot warning signs?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "The ACHES mnemonic (Abdominal pain, Chest pain, Headache severe, Eye problems, Severe leg pain/swelling) is globally-taught reproductive health knowledge for recognizing a serious blood clot complication of combined hormonal contraception, requiring immediate emergency evaluation.",
        redFlag: true,
        keywords: ["severe headache on the pill", "chest pain on birth control", "leg swelling on the pill", "vision changes on birth control"],
        careAdviceIds: ["oscg-combinedpill-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-combinedpill-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "For an adult already assessed as eligible for this prescribed pill, are these mild expected effects with no emergency feature, pregnancy concern, missed-pill uncertainty, severe bleeding, safeguarding concern, or medicine interaction?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild side effects are common when starting or continuing the combined pill and often settle within a few months.",
        redFlag: false,
        keywords: ["mild combined pill side effects"],
        careAdviceIds: ["oscg-combinedpill-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-combinedpill-emergency-advice", titleEn: "Emergency combined-pill blood clot precautions", instructionTextEn: "Call Qatar 999 now and do not self-drive. Do not take an extra pill or another person's medicine while awaiting emergency assessment.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain or breathing difficulty", "weakness, speech difficulty, collapse, or vision loss"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-combinedpill-selfcare-advice", titleEn: "Monitoring mild combined-pill effects", instructionTextEn: "Follow the prescriber's instructions and arrange pharmacist or clinician review if symptoms persist. Missed-pill actions, emergency contraception, pregnancy testing, and whether to continue or stop the pill depend on timing, product, pregnancy risk, and interactions and must use the Qatar-approved protocol rather than telephone improvisation.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["any clot or stroke warning sign develops", "heavy bleeding, pregnancy concern, or significant mood change develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Adult" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, globally-recognized reproductive-health knowledge - the \"ACHES\" combined-hormonal-contraceptive blood clot warning mnemonic - the specific NHS.UK combined pill side-effects subpage could not be retrieved during authoring"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Qatar prescribing eligibility, adolescent consent/privacy/safeguarding, postpartum and breastfeeding timing, missed-pill and emergency-contraception rules, interactions, and exact non-emergency routing remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 5. Face Pain - SOURCE ONLY; no generated batch-22 catalog variant
  // ------------------------------------------------------------------
  {
    id: "oscg-face-pain",
    titleEn: "Face Pain",
    clinicalDefinitionEn: "Non-traumatic facial pain assessment, generalized from the sinus pain and toothache criteria already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "face pain", weight: 100 },
      { phrase: "my face hurts", weight: 90 },
      { phrase: "facial pain no injury", weight: 90 },
      { phrase: "pain in my cheek and jaw", weight: 85 },
      { phrase: "face has been hurting for the past couple days", weight: 100 },
      { phrase: "whole face has been hurting", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-facepain-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's age, where exactly is the pain, when did it start, and was there injury, dental treatment, a rash, or a new medicine?" },
      { id: "oscg-facepain-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there facial droop, arm weakness, speech change, sudden severe headache, eye pain or vision loss, swelling around the eye, or difficulty breathing or swallowing?" },
      { id: "oscg-facepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there fever, spreading redness/swelling, pregnancy, immunocompromise, a very young child, inability to drink, or possible safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-facepain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there facial swelling making it hard to breathe, swallow, or speak, or is there vision change, sudden severe facial swelling near the eye, or high fever with severe facial pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Consistent with the emergency criteria already established for Toothache (spreading swelling threatening the airway) and Sinus Pain (orbital spread risk) in this system.",
        redFlag: true,
        keywords: ["face swelling trouble breathing", "face pain with vision change"],
        careAdviceIds: ["oscg-facepain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-facepain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there facial swelling, fever, pain lasting more than a few days, or pain not relieved by simple painkillers?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the urgent tiers already used for Toothache and Sinus Pain, these signs warrant prompt in-person assessment.",
        redFlag: false,
        keywords: ["face pain with swelling", "face pain lasting days"],
        careAdviceIds: ["oscg-facepain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-facepain-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild facial pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild facial pain (e.g. from sinus congestion or muscle tension) is often manageable at home.",
        redFlag: false,
        keywords: ["mild face pain"],
        careAdviceIds: ["oscg-facepain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-facepain-emergency-advice", titleEn: "Emergency face pain precautions", instructionTextEn: "Call Qatar 999 and do not self-drive for airway difficulty, stroke signs, severe eye symptoms, collapse, or rapidly spreading swelling.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing or swallowing difficulty", "vision loss, weakness, speech change, or worsening swelling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-facepain-urgent-advice", titleEn: "Urgent face pain review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-facepain-selfcare-advice", titleEn: "Home care for mild face pain", instructionTextEn: "Rest and use simple comfort measures. A pharmacist or clinician must confirm any pain medicine is suitable for age, weight, pregnancy, allergies, comorbidity, and current medicines.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens or lasts more than a few days", "swelling, fever, eye symptoms, weakness, or speech change develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Generalized from the Sinus Pain or Congestion (batch11) and Toothache (batch14) emergency/urgent criteria already established in this system - no single dedicated NHS.UK general facial-pain page was found"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Stroke, orbital infection, airway, dental infection, pediatric, pregnancy, immunocompromise, safeguarding, analgesic, and exact Qatar routing rules require local approval. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 6. Mouth Pain - SOURCE ONLY; no generated batch-22 catalog variant
  // ------------------------------------------------------------------
  {
    id: "oscg-mouth-pain",
    titleEn: "Mouth Pain",
    clinicalDefinitionEn: "Non-traumatic mouth pain assessment, generalized from the toothache and mouth-injury criteria already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "mouth pain", weight: 100 },
      { phrase: "my mouth hurts", weight: 90 },
      { phrase: "mouth pain no injury", weight: 90 },
      { phrase: "sore inside my mouth", weight: 85 },
      { phrase: "inside of my mouth has just been sore", weight: 100 },
      { phrase: "mouth has just been sore for a couple days", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mouthpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
      { id: "oscg-mouthpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it lasted?" },
      { id: "oscg-mouthpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any swelling, fever, or difficulty swallowing?" }
    ],
    questions: [
      {
        id: "oscg-mouthpain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there swelling in the mouth or neck making it difficult to breathe, swallow, or speak?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Consistent with the emergency criteria already established for Toothache - spreading swelling threatening the airway needs immediate emergency care.",
        redFlag: true,
        keywords: ["mouth swelling trouble breathing", "mouth pain trouble swallowing"],
        careAdviceIds: ["oscg-mouthpain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-mouthpain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has the pain lasted more than 2 days, is it not relieved by painkillers, or is there fever, swelling, or red gums?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the Toothache protocol's urgent tier, these signs warrant a dental or medical appointment.",
        redFlag: false,
        keywords: ["mouth pain lasting days", "mouth pain with swelling"],
        careAdviceIds: ["oscg-mouthpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-mouthpain-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, recent mouth pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild mouth pain (e.g. a minor ulcer or irritation) is often manageable at home.",
        redFlag: false,
        keywords: ["mild mouth pain"],
        careAdviceIds: ["oscg-mouthpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mouthpain-emergency-advice", titleEn: "Emergency mouth pain precautions", instructionTextEn: "Do not drive yourself to the emergency department - ask someone to drive you or call Qatar 999 for an ambulance.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening swelling", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthpain-urgent-advice", titleEn: "Urgent mouth pain review", instructionTextEn: "Arrange a prompt dental or medical appointment for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthpain-selfcare-advice", titleEn: "Home care for mild mouth pain", instructionTextEn: "Use gentle oral hygiene and simple comfort measures. Do not use aspirin on oral tissue. A pharmacist or clinician must confirm any analgesic or oral gel is suitable for age, weight, pregnancy, allergies, comorbidity, and current medicines.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 days or prevents drinking", "swelling, fever, breathing, swallowing, or drooling difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Generalized from the Toothache (batch14) and Mouth Injury (batch13) criteria already established in this system - no single dedicated NHS.UK general mouth-pain page was found"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Airway infection, dehydration, dental, pediatric, pregnancy, immunocompromise, safeguarding, analgesic/oral-gel, and exact Qatar routing rules remain GOVERNANCE_REQUIRED. Qatar 999 applies to airway compromise and no self-driving. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 7. Muscle Aches and Body Pain - SOURCE ONLY; no generated batch-22 catalog variant
  // ------------------------------------------------------------------
  {
    id: "oscg-muscle-aches-and-body-pain",
    titleEn: "Muscle Aches and Body Pain",
    clinicalDefinitionEn: "General muscle aches and body pain assessment, generalized from the flu guidance already used in this system, for callers with body aches as the primary concern.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "body aches", weight: 100 },
      { phrase: "muscles ache all over", weight: 95 },
      { phrase: "achy all over", weight: 90 },
      { phrase: "muscle aches and pains", weight: 90 },
      { phrase: "body just aches all over", weight: 100 },
      { phrase: "achy everywhere", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-muscleaches-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have the aches lasted?" },
      { id: "oscg-muscleaches-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-muscleaches-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any weakness, severe pain, or dark urine?" }
    ],
    questions: [
      {
        id: "oscg-muscleaches-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Along with the body aches, is there a high fever, severe muscle pain and weakness, dark urine, or is the person 65+, pregnant, or living with a long-term condition or weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the flu guidance already used in this system, severe muscle pain with dark urine can rarely indicate rhabdomyolysis (muscle breakdown), and higher-risk groups need prompt evaluation.",
        redFlag: false,
        keywords: ["severe muscle pain and dark urine", "body aches with high fever"],
        careAdviceIds: ["oscg-muscleaches-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-muscleaches-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this typical, mild body aches (e.g. from a cold, flu, or exercise) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, generalized muscle aches are commonly viral or exertional and manageable at home.",
        redFlag: false,
        keywords: ["mild typical body aches"],
        careAdviceIds: ["oscg-muscleaches-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-muscleaches-urgent-advice", titleEn: "Urgent body aches review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["weakness worsens", "urine gets darker"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-muscleaches-selfcare-advice", titleEn: "Home care for mild body aches", instructionTextEn: "Rest and maintain fluids if safe. A pharmacist or clinician must confirm any pain or fever medicine using age, weight, pregnancy, allergies, kidney/liver disease, dehydration, and current medicines; do not combine products containing the same ingredient.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms worsen or do not improve", "weakness, dark urine, reduced urine, breathing difficulty, stiff neck, rash, or confusion develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Flu\" (already cited for Influenza (Flu) Suspected, batch19), https://www.nhs.uk/conditions/flu/ - generalized to muscle aches/body pain as the primary presenting complaint"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Sepsis, meningitis, rhabdomyolysis, pediatric, pregnancy/postpartum, immunocompromise, dehydration, medication, and exact Qatar routing rules remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 8. Bullying - SOURCE ONLY; no generated batch-22 catalog variant
  // ------------------------------------------------------------------
  {
    id: "oscg-bullying",
    titleEn: "Bullying",
    clinicalDefinitionEn: "Bullying/cyberbullying concern assessment based on standard, non-proprietary child and adolescent mental health support knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 3,
    keywords: [
      { phrase: "being bullied", weight: 100 },
      { phrase: "bullying at school", weight: 100 },
      { phrase: "cyberbullying", weight: 100 },
      { phrase: "kids being mean to my child", weight: 85 },
      { phrase: "getting bullied at school", weight: 100 },
      { phrase: "getting bullied and its affecting them", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bullying-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the child's age, what has happened, for how long, and can the child speak privately without the alleged perpetrator or an unsafe adult present?" },
      { id: "oscg-bullying-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there immediate physical danger, injury, sexual exploitation, threats, blackmail, sharing of sexual images, self-harm, suicidal thoughts, or risk to another person?" },
      { id: "oscg-bullying-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there a safe trusted adult available now, and has the Qatar-approved school and child-safeguarding pathway been activated without confronting a suspected unsafe person?" }
    ],
    questions: [
      {
        id: "oscg-bullying-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there any talk of self-harm, suicide, or not wanting to be alive because of the bullying, or is there an immediate physical safety threat?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Bullying is a recognized risk factor for self-harm and suicidal thinking in children and teens; any such statement needs immediate emergency mental health attention, consistent with the Suicide Concerns protocol already in this system.",
        redFlag: true,
        keywords: ["thoughts of self harm from bullying", "doesnt want to be alive because of bullying"],
        careAdviceIds: ["oscg-bullying-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bullying-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the bullying ongoing, affecting school attendance, sleep, or mood, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Ongoing bullying affecting daily functioning warrants prompt involvement of the school and a mental health professional.",
        redFlag: false,
        keywords: ["bullying affecting school", "bullying affecting sleep or mood"],
        careAdviceIds: ["oscg-bullying-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bullying-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a recent, isolated incident being handled with support from trusted adults, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Early, supported reporting to school staff and parents is the recommended first step for bullying concerns.",
        redFlag: false,
        keywords: ["isolated bullying incident being addressed"],
        careAdviceIds: ["oscg-bullying-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bullying-emergency-advice", titleEn: "Emergency bullying-related safety precautions", instructionTextEn: "Call Qatar 999 for an ambulance for immediate danger, serious injury, or imminent self-harm or harm to another person. Keep the child with a safe responsible adult, do not leave them alone, do not self-drive, and do not alert or confront a suspected perpetrator if doing so could increase risk. Preserve messages or images without forwarding them and follow the approved safeguarding escalation.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["any immediate risk to the child or another person", "safe supervision becomes unavailable"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bullying-urgent-advice", titleEn: "Getting help for ongoing bullying", instructionTextEn: "Report the bullying to the school and keep a written record of incidents. Encourage the child to stay connected with trusted friends and adults, and consider involving a school counselor or mental health professional if it's affecting mood, sleep, or school attendance.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["mood or behavior worsens", "any talk of self-harm develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-bullying-selfcare-advice", titleEn: "Supporting a child dealing with bullying", instructionTextEn: "Listen without judgment, reassure the child it isn't their fault, report the incident to school staff, and keep checking in regularly.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bullying continues or worsens", "mood or behavior changes develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary child and adolescent mental health support knowledge about bullying/cyberbullying - the specific NHS.UK bullying page could not be retrieved during authoring"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Qatar school escalation, privacy, consent, cyber-evidence handling, sexual-image/exploitation response, mandatory reporting, mental-health referral, and exact non-emergency contacts remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 9. Child Abuse Suspected - SOURCE ONLY; no generated batch-22 catalog variant
  // ------------------------------------------------------------------
  {
    id: "oscg-child-abuse-suspected",
    titleEn: "Child Abuse Suspected",
    clinicalDefinitionEn: "Suspected child abuse assessment based on standard, non-proprietary child-safeguarding knowledge, following the same sensitive-topic handling already established for Domestic Violence (batch16).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 5,
    keywords: [
      { phrase: "suspect child abuse", weight: 100 },
      { phrase: "child was hurt by a caregiver", weight: 95 },
      { phrase: "worried someone is abusing my child", weight: 100 },
      { phrase: "unexplained injuries on my child", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-childabuse-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the child in immediate danger right now?" },
      { id: "oscg-childabuse-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What was directly observed or spontaneously disclosed? Record the child's words accurately; do not conduct repeated, leading, or investigative questioning." },
      { id: "oscg-childabuse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the child speak privately, are they currently with a safe adult away from the suspected person, and is urgent medical/forensic care needed without washing, changing clothes, or discarding possible evidence?" }
    ],
    questions: [
      {
        id: "oscg-childabuse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the child in immediate danger right now, or are there signs of a serious injury (unexplained fractures, burns, bruising patterns inconsistent with the explanation given)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Standard child-safeguarding practice: a child's immediate physical safety always takes priority, and suspicious injury patterns need urgent medical and child-protection evaluation together.",
        redFlag: true,
        keywords: ["child in immediate danger", "unexplained fractures child", "suspicious bruising pattern child"],
        careAdviceIds: ["oscg-childabuse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-childabuse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there suspicion or a disclosure of abuse without immediate physical danger right now?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Standard safeguarding practice requires prompt referral to child-protection services and medical evaluation even without an active emergency, since delayed reporting can allow ongoing harm.",
        redFlag: false,
        keywords: ["disclosure of abuse", "suspected abuse no immediate danger"],
        careAdviceIds: ["oscg-childabuse-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-childabuse-emergency-advice", titleEn: "Emergency child safety precautions", instructionTextEn: "Call Qatar 999 for immediate danger or life-threatening injury and follow dispatcher instructions. Keep the child with a safe responsible adult and away from the suspected person when this can be done without increasing danger. Do not confront or notify the suspected person, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["immediate danger continues", "the safe adult or safe location becomes unavailable"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-childabuse-urgent-advice", titleEn: "Reporting suspected child abuse", instructionTextEn: "Follow the Qatar legal and organizational mandatory-reporting pathway approved for this UAT environment immediately. Arrange appropriate medical and, when indicated, forensic assessment. Document objective observations and the child's exact spontaneous words; do not promise secrecy, investigate, repeatedly question, confront the suspected person, or disclose information beyond the safeguarding team.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["the child's situation changes or new concerns arise"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary child-safeguarding knowledge (injury-pattern recognition, mandated-reporting practice) - not a single-source quote"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Qatar mandatory reporting, consent, confidentiality, safe-contact, forensic evidence, documentation, police/child-protection and medical destination rules remain GOVERNANCE_REQUIRED and must be configured before nurse UAT. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 10. Child Neglect Suspected - SOURCE ONLY; no generated batch-22 catalog variant
  // ------------------------------------------------------------------
  {
    id: "oscg-child-neglect-suspected",
    titleEn: "Child Neglect Suspected",
    clinicalDefinitionEn: "Suspected child neglect assessment based on standard, non-proprietary child-safeguarding knowledge, following the same sensitive-topic handling as Child Abuse Suspected.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 4,
    keywords: [
      { phrase: "suspect child neglect", weight: 100 },
      { phrase: "child isnt being taken care of", weight: 95 },
      { phrase: "worried about child neglect", weight: 100 },
      { phrase: "child left alone unsupervised", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-childneglect-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the child in immediate danger right now (unsupervised, no food/shelter, medical needs unmet)?" },
      { id: "oscg-childneglect-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What has been observed?" },
      { id: "oscg-childneglect-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Are there any urgent unmet medical or safety needs right now?" }
    ],
    questions: [
      {
        id: "oscg-childneglect-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the child currently unsupervised and in an unsafe situation, severely malnourished or dehydrated, or does the child have an urgent unmet medical need?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Standard child-safeguarding practice: an unsafe unsupervised situation or an unmet urgent medical/nutritional need requires immediate intervention.",
        redFlag: true,
        keywords: ["child unsupervised unsafe", "child severely malnourished", "unmet medical need child"],
        careAdviceIds: ["oscg-childneglect-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-childneglect-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a pattern of concern (poor hygiene, frequent unexplained absences from school, inadequate clothing for weather) without an immediate emergency?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Standard safeguarding practice requires prompt referral to child-protection/social services for a suspected pattern of neglect, even without an immediate emergency.",
        redFlag: false,
        keywords: ["pattern of concern for neglect", "poor hygiene child neglect concern"],
        careAdviceIds: ["oscg-childneglect-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-childneglect-emergency-advice", titleEn: "Emergency child safety precautions", instructionTextEn: "Call Qatar 999 for an ambulance for immediate danger or an urgent unmet medical need; do not self-drive or use a potentially unsafe caregiver for transport. Keep the child with a safe responsible adult when possible, do not leave them alone, and do not confront or notify a potentially unsafe caregiver if this could increase risk.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["immediate danger continues", "safe supervision, food, shelter, or necessary medicine becomes unavailable"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-childneglect-urgent-advice", titleEn: "Reporting suspected child neglect", instructionTextEn: "Follow the Qatar legal and organizational mandatory-reporting pathway approved for this UAT environment immediately. Document objective observations and unmet health, medication, nutrition, supervision, education, or shelter needs. Do not investigate, promise secrecy, confront the caregiver, or delay reporting while trying to prove neglect.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["the child's situation worsens", "new concerns or urgent unmet needs arise"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary child-safeguarding knowledge (neglect pattern recognition, mandated-reporting practice) - not a single-source quote"],
      contentNotice: "SOURCE-ONLY UAT DATA — no generated variant exists in the current 504-protocol catalog. NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Qatar mandatory reporting, confidentiality, safe-contact, medical/nutrition/medication assessment, social-support, police/child-protection and exact destination rules remain GOVERNANCE_REQUIRED and must be configured before nurse UAT. Not licensed Schmitt-Thompson (STCC) content."
    })
  }
];
