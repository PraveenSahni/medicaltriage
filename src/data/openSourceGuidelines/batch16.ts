import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";
import { addChildSafeguardingUatBranches } from "./batch09.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 16 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence), plus two protocols based on standard, non-proprietary medical
 * knowledge where a specific NHS.UK page could not be retrieved (Marine
 * Animal Stings and Bites, generalizing the snake/stingray venomous-injury
 * pattern from batch12; Contraception - Birth Control Shot, standard
 * reproductive-health knowledge about the Depo-Provera injection). Domestic
 * Violence follows the same sensitive-topic handling already established for
 * Suicide Concerns and Sexual Assault or Rape (batch03/04): no UK-specific
 * hotline numbers, and an explicit provenance notice requiring the host
 * organization to insert real Qatar-applicable contact info before
 * production use. Sickle Cell Disease - Acute Pain adds a standard,
 * widely-taught hematology emergency screen (the NHS.UK source page itself
 * does not specify emergency criteria) since sickle cell crises are a
 * genuine, common presentation in this Gulf-region deployment.
 */
const batch16ProtocolDefinitions: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Warts - https://www.nhs.uk/conditions/warts-and-verrucas/ (reviewed 2023-07-25)
  // ------------------------------------------------------------------
  {
    id: "oscg-warts",
    titleEn: "Warts",
    clinicalDefinitionEn: "Assessment of a suspected wart or verruca in children and adults, with safeguards for uncertain diagnosis, genital lesions, pregnancy, diabetes, poor circulation, and immunocompromise.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "wart", weight: 100 },
      { phrase: "verruca", weight: 100 },
      { phrase: "wart on my skin", weight: 90 },
      { phrase: "small skin growth", weight: 80 },
      { phrase: "wart that keeps coming back", weight: 100 },
      { phrase: "wart on my hand", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-warts-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the wart or verruca?" },
      { id: "oscg-warts-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been present?" },
      { id: "oscg-warts-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has it changed in colour, shape, or size, bled, ulcerated, or become painful, or is the diagnosis uncertain?" },
      { id: "oscg-warts-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, diabetes, poor circulation, immune suppression, medicines, and whether a genital lesion in a child raises a safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-warts-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the lesion on the face or genitals, changing, bleeding, ulcerated, large, painful, recurrent, or uncertain to be a wart; or does the patient have diabetes, poor circulation, immune suppression, pregnancy, or a genital lesion requiring age-appropriate safeguarding assessment?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "These features require diagnosis and treatment selection by a clinician. Genital lesions need confidential, age-appropriate sexual-health and safeguarding assessment; the exact Qatar route is governance-required.",
        redFlag: false,
        keywords: ["genital wart", "wart bleeding or changing", "large painful wart"],
        careAdviceIds: ["oscg-warts-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-warts-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical small wart or verruca on intact non-facial, non-genital skin in an otherwise healthy, non-pregnant patient, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes typical warts/verrucas as manageable with pharmacy over-the-counter treatments.",
        redFlag: false,
        keywords: ["typical small wart"],
        careAdviceIds: ["oscg-warts-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-warts-urgent-advice", titleEn: "Lesion requiring in-person assessment", instructionTextEn: "Use the Qatar governance-approved primary-care, dermatology, sexual-health, or safeguarding pathway. Do not label an uncertain, changing, bleeding, facial, or genital lesion as a wart by telephone. Provide privacy for adolescents when safe and follow local consent and safeguarding policy.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["rapid change, persistent bleeding, ulceration, spreading infection, or severe pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-warts-selfcare-advice", titleEn: "Low-risk wart care", instructionTextEn: "Do not cut, burn, pick, or share treatment devices. Ask a pharmacist to confirm an age-appropriate product and follow its label; never use wart acids on the face, genitals, broken skin, or without professional advice in pregnancy, diabetes, poor circulation, or immune suppression. Wash hands after contact and avoid sharing towels, socks, or shoes.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["growth, colour or shape change, bleeding, ulceration, pain, or diagnostic uncertainty", "skin infection or failure to improve"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Warts and verrucas\", https://www.nhs.uk/conditions/warts-and-verrucas/ (page last reviewed 25 July 2023)"],
      contentNotice: "UAT-only adaptation of NHS.UK wart guidance with diagnosis, age, pregnancy, diabetes, circulation, immunocompromise, genital-lesion privacy, and safeguarding controls. Exact Qatar dermatology and sexual-health pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical-governance validation and is prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Sickle Cell Disease - Acute Pain - https://www.nhs.uk/conditions/sickle-cell-disease/ (reviewed 2022-11-30) + standard hematology emergency knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-sickle-cell-acute-pain",
    titleEn: "Sickle Cell Disease - Acute Pain",
    clinicalDefinitionEn: "Sickle cell pain crisis assessment, combining NHS.UK's published sickle cell disease guidance with standard, widely-taught hematology emergency criteria (the source page does not itself define emergency thresholds).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "sickle cell pain crisis", weight: 100 },
      { phrase: "sickle cell pain episode", weight: 100 },
      { phrase: "sickle cell disease pain", weight: 100 },
      { phrase: "having a sickle cell crisis", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-sicklecell-iaq1", sequence: 1, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" },
      { id: "oscg-sicklecell-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-sicklecell-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any chest pain, cough, breathing difficulty, weakness, confusion, severe headache, seizure, abdominal swelling, priapism, dehydration, or pregnancy?" },
      { id: "oscg-sicklecell-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, individual sickle-cell emergency plan, usual analgesia and doses already taken, urine output, recent infection, and whether safe transport and supervision are available." }
    ],
    questions: [
      {
        id: "oscg-sicklecell-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there fever or severe illness, chest pain, cough or breathing difficulty, blue/grey colour, sudden weakness or numbness, confusion, severe headache, seizure, reduced consciousness, severe abdominal pain or swelling, priapism, dehydration, pregnancy with significant symptoms, or severe or atypical pain not controlled by the documented home plan?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Widely-taught hematology emergency knowledge: fever in sickle cell disease can indicate life-threatening sepsis (due to functional asplenia), chest pain/breathing difficulty may indicate acute chest syndrome, and sudden weakness/confusion may indicate stroke - all recognized sickle cell emergencies requiring immediate hospital care.",
        redFlag: true,
        keywords: ["fever with sickle cell", "chest pain with sickle cell", "weakness one side sickle cell", "pain not controlled sickle cell"],
        careAdviceIds: ["oscg-sicklecell-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-sicklecell-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a mild, typical pain episode that responds to the usual home pain plan, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK sickle cell disease guidance describes hydration, warmth, and over-the-counter pain relief as self-care measures for milder episodes.",
        redFlag: false,
        keywords: ["mild sickle cell pain episode"],
        careAdviceIds: ["oscg-sicklecell-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sicklecell-emergency-advice", titleEn: "Emergency sickle-cell precautions", instructionTextEn: "Call Qatar 999 now and do not allow self-driving. Follow the patient's emergency plan while awaiting help, keep them warm, and do not exceed prescribed analgesic doses. Fever, chest symptoms, neurologic signs, priapism, severe dehydration, or uncontrolled pain require hospital assessment.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain, fever, chest symptoms, or breathing difficulty", "weakness, confusion, seizure, reduced consciousness, or priapism"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sicklecell-selfcare-advice", titleEn: "Documented home plan for a strictly typical mild episode", instructionTextEn: "Use only the patient's clinician-approved sickle-cell home plan, including usual fluids, warmth, and prescribed analgesia. Do not improvise doses or use ibuprofen without confirming age, pregnancy, kidney function, hydration, and other contraindications. The exact Qatar sickle-cell follow-up route remains governance-required.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["fever, chest pain, cough, breathing difficulty, neurologic symptoms, priapism, dehydration, or atypical pain", "pain is not promptly controlled by the documented plan"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-11-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Sickle cell disease\", https://www.nhs.uk/conditions/sickle-cell-disease/ (page last reviewed 30 November 2022) - self-care guidance; standard, widely-taught hematology emergency criteria (fever/sepsis risk, acute chest syndrome, stroke signs) not explicitly stated on this overview page"],
      contentNotice: "SOURCE-ONLY UAT safety synthesis; this family has no generated variant in the current 504-protocol catalog. Emergency criteria extend beyond the cited overview and require Qatar hematology governance. The individual care plan is authoritative for home management. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Domestic Violence - https://www.nhs.uk/live-well/healthy-body/getting-help-for-domestic-violence/ (reviewed 2026-06-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-domestic-violence",
    titleEn: "Domestic Violence",
    clinicalDefinitionEn: "Domestic violence/abuse assessment decomposed from NHS.UK's published domestic abuse guidance, following the same sensitive-topic handling already established for Suicide Concerns and Sexual Assault or Rape.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "domestic violence", weight: 100 },
      { phrase: "domestic abuse", weight: 100 },
      { phrase: "my partner hurt me", weight: 95 },
      { phrase: "afraid of my partner", weight: 95 },
      { phrase: "partner hit me", weight: 100 },
      { phrase: "dont feel safe right now", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-domesticviolence-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the person in immediate danger right now?" },
      { id: "oscg-domesticviolence-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Are there children involved or at risk?" },
      { id: "oscg-domesticviolence-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the caller alone, safe to talk, and using a device that is not being monitored?" },
      { id: "oscg-domesticviolence-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Has there been strangulation, suffocation, weapon use, sexual assault, pregnancy trauma, threats to kill, stalking, escalating violence, or injury needing medical care?" },
      { id: "oscg-domesticviolence-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is the patient a child or dependent adult, or are children, pregnancy, disability, or an unsafe caregiver involved?" }
    ],
    questions: [
      {
        id: "oscg-domesticviolence-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there immediate danger, serious injury, strangulation or suffocation, weapon use, sexual assault, pregnancy trauma, threats to kill, escalating violence, stalking with immediate access, or danger to a child or dependent adult?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance states emergency situations warrant an immediate emergency services call - physical safety takes priority.",
        redFlag: true,
        keywords: ["in immediate danger from partner", "partner hit me", "partner choked me"],
        careAdviceIds: ["oscg-domesticviolence-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-domesticviolence-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there ongoing emotional abuse, threats, intimidation, isolation, or controlling behavior from a partner, ex-partner, or family member, without immediate physical danger right now?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance emphasizes that a person does not need to wait for a crisis to get help - connecting promptly with a primary-care clinician or a specialized support organization is appropriate at any point.",
        redFlag: false,
        keywords: ["controlling partner", "threatened by partner", "afraid of my partner"],
        careAdviceIds: ["oscg-domesticviolence-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-domesticviolence-emergency-advice", titleEn: "Emergency domestic-abuse safety response", instructionTextEn: "If safe, call Qatar 999 now. Do not self-drive or travel with the suspected abuser; use ambulance or police transport as directed by the 999 call-taker. Do not disclose the concern to, confront, or negotiate with the suspected abuser. Avoid leaving voicemail, texts, printed material, or browsing traces unless the patient confirms this is safe. Use the Qatar governance-approved silent-call, police, medical, child-protection, and safeguarding procedure; strangulation needs urgent medical assessment even without visible injury.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["immediate danger, strangulation symptoms, weapon access, threats to kill, escalating violence, or serious injury"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-domesticviolence-urgent-advice", titleEn: "Confidential domestic-abuse support", instructionTextEn: "Speak privately only when safe, validate without pressuring disclosure or departure, document objectively under the approved policy, and use the Qatar governance-approved domestic-abuse and safeguarding pathway. Do not provide unverified contact details or create a safety plan that could be discovered on a monitored device.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["escalating threats, stalking, strangulation, weapon use, pregnancy violence, or child danger"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-06-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Getting help for domestic violence\", https://www.nhs.uk/live-well/healthy-body/getting-help-for-domestic-violence/ (page last reviewed 23 June 2026)"],
      contentNotice: "SOURCE-ONLY UAT adaptation; this family has no generated variant in the current 504-protocol catalog. Qatar police, medical, silent-call, child-protection, adult-safeguarding, documentation, confidentiality, and referral workflows remain GOVERNANCE_REQUIRED. No unverified hotline is supplied. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Falls and Falling - https://www.nhs.uk/conditions/falls/ (reviewed 2025-03-06)
  // ------------------------------------------------------------------
  {
    id: "oscg-falls-and-falling",
    titleEn: "Falls and Falling",
    clinicalDefinitionEn: "Safety-first assessment after a fall in children and adults, including trauma, medical causes, anticoagulation, pregnancy, frailty, and safeguarding.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "had a fall", weight: 100 },
      { phrase: "fell down at home", weight: 95 },
      { phrase: "keeps falling", weight: 90 },
      { phrase: "cant get up after falling", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fallsandfalling-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How, when, and from what height did the fall occur, and was there collapse, fainting, seizure, chest pain, palpitations, or weakness before it?" },
      { id: "oscg-fallsandfalling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person awake, breathing normally, able to move all limbs, and safely able to get up without severe pain?" },
      { id: "oscg-fallsandfalling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Was there head, neck, back, hip, abdominal, or major limb injury, loss of consciousness, vomiting, confusion, memory loss, seizure, bleeding, or new weakness or numbness?" },
      { id: "oscg-fallsandfalling-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, anticoagulant or antiplatelet use, bleeding disorder, frailty, osteoporosis, intoxication, and whether the history or caregiver situation raises abuse, neglect, or safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-fallsandfalling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person unresponsive, not breathing normally, unable to get up, or is there suspected head, neck, back, hip, abdominal, or major limb injury; uncontrolled bleeding; severe pain or deformity; repeated vomiting, seizure, confusion, new weakness or numbness; or a fall associated with chest pain, collapse, or pregnancy trauma?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK falls guidance lists possible head/back/neck/hip injury and inability to get up as emergency-assessment criteria.",
        redFlag: true,
        keywords: ["cant get up after fall", "hit head in fall", "hip injury from fall", "fall on blood thinner", "pregnant fall", "weakness after fall"],
        careAdviceIds: ["oscg-fallsandfalling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fallsandfalling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is there pain, swelling, a wound, dizziness, new unsteadiness, suspected medical cause, anticoagulant use, pregnancy, frailty, recurrent falls, or any child, older-adult, abuse, neglect, or unsafe-caregiver concern?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Injury may be occult and a fall may be caused by acute illness or medication. Higher-risk patients and safeguarding concerns need prompt assessment; exact Qatar routing is governance-required.",
        redFlag: false,
        keywords: ["pain after falling", "feeling unwell after a fall"],
        careAdviceIds: ["oscg-fallsandfalling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fallsandfalling-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Was this a low-level accidental fall in a generally healthy adult who is now completely well, walking normally, with no pain, injury, head strike, medical trigger, high-risk medicine or condition, recurrence, or safeguarding concern?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends routine primary-care review to discuss balance/mobility for repeated minor falls, and general fall-prevention self-care otherwise.",
        redFlag: false,
        keywords: ["minor fall no injury"],
        careAdviceIds: ["oscg-fallsandfalling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fallsandfalling-emergency-advice", titleEn: "Emergency fall precautions", instructionTextEn: "Call Qatar 999 now. Do not move the person unless needed to escape immediate danger or directed by the call-handler; support the head and neck, keep them warm, control external bleeding without pressing on a deformity, give nothing by mouth, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced consciousness, abnormal breathing, seizure, vomiting, weakness, or numbness", "worsening pain, bleeding, or shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fallsandfalling-urgent-advice", titleEn: "Prompt in-person fall review", instructionTextEn: "Use the Qatar governance-approved in-person service and timeframe to assess injury and the cause of the fall. Do not stop anticoagulants or other medicines unless instructed by the treating clinician. Address privacy and safeguarding without confronting a suspected unsafe caregiver.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new headache, vomiting, confusion, weakness, numbness, chest pain, fainting, or inability to walk", "pain, swelling, bleeding, or breathing difficulty worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fallsandfalling-selfcare-advice", titleEn: "Fall prevention at home", instructionTextEn: "Stay physically active with regular strength and balance exercises, wear well-fitting shoes with good grip, keep a phone or alarm nearby, remove trip hazards and loose wires, use non-slip bath mats, and review medications with a primary-care clinician or pharmacist if balance is a concern. Arrange primary-care review if falls keep happening.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["falls become more frequent", "pain or injury is noticed later"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-03-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Falls\", https://www.nhs.uk/conditions/falls/ (page last reviewed 06 March 2025)"],
      contentNotice: "UAT-only adaptation of NHS.UK falls guidance with trauma, medical-cause, anticoagulant, pregnancy, age, frailty, and safeguarding controls. Exact Qatar non-emergency and safeguarding routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical-governance validation and is prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Marine Animal Stings and Bites - North America - generalized from Snakebite/Stingray Injury (batch12)
  // ------------------------------------------------------------------
  {
    id: "oscg-marine-animal-stings-bites",
    titleEn: "Marine Animal Stings and Bites",
    clinicalDefinitionEn: "General marine animal sting/bite assessment (jellyfish, sea urchin, coral, etc.), generalized from the venomous-injury first-aid principles already established for Snakebite and Stingray Injury (batch12).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "jellyfish sting", weight: 100 },
      { phrase: "stung by a jellyfish", weight: 100 },
      { phrase: "sea urchin spine in my foot", weight: 95 },
      { phrase: "marine animal sting", weight: 95 },
      { phrase: "cut on coral", weight: 90 },
      { phrase: "stung by a jellyfish while swimming", weight: 100 },
      { phrase: "jellyfish at the beach", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-marinesting-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What kind of marine animal was involved?" },
      { id: "oscg-marinesting-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the sting or injury?" },
      { id: "oscg-marinesting-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-marinesting-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is the person safely out of the water, awake, breathing normally, and free of chest pain, collapse, vomiting, severe weakness, or widespread reaction?" },
      { id: "oscg-marinesting-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, allergy history, immune suppression, diabetes, wound contamination, retained spine, eye/face/neck/chest involvement, and whether the species is uncertain." }
    ],
    questions: [
      {
        id: "oscg-marinesting-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse, reduced responsiveness, abnormal breathing, chest pain, widespread hives or swelling, repeated vomiting, severe weakness, rapidly progressive or severe pain, major bleeding, eye/face/neck/chest injury, or multiple extensive stings?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Marine envenomation severity varies significantly by species (jellyfish, sea urchin, coral, and others common in Gulf waters); these are recognized signs of a severe reaction requiring immediate emergency care, following the same principle already applied to Snakebite and Stingray Injury.",
        redFlag: true,
        keywords: ["breathing difficulty after jellyfish sting", "severe pain marine sting", "widespread swelling marine sting"],
        careAdviceIds: ["oscg-marinesting-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-marinesting-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a puncture wound from a sea urchin or coral, or moderate pain and swelling without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Marine puncture wounds (sea urchin spines, coral cuts) carry a high infection risk and may need professional wound care, consistent with the Stingray Injury protocol's urgent tier.",
        redFlag: false,
        keywords: ["sea urchin spine stuck", "coral cut infection risk"],
        careAdviceIds: ["oscg-marinesting-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-marinesting-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild sting with local pain only, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Most mild jellyfish stings and minor marine scrapes are manageable at home with rinsing and pain relief.",
        redFlag: false,
        keywords: ["mild jellyfish sting"],
        careAdviceIds: ["oscg-marinesting-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-marinesting-emergency-advice", titleEn: "Emergency marine-injury precautions", instructionTextEn: "Call Qatar 999 now and alert beach lifeguards if present. Do not re-enter the water, allow self-driving, rub the area, apply a pressure bandage, or use urine or unverified chemicals. Begin resuscitation if directed. Species-specific rinsing and heat or antivenom measures must follow trained local rescue guidance because incorrect treatment can worsen some envenomations.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["collapse, abnormal breathing, chest pain, repeated vomiting, or spreading reaction"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-marinesting-urgent-advice", titleEn: "Prompt marine puncture or sting review", instructionTextEn: "Use the Qatar governance-approved in-person service. Do not remove deeply embedded spines, probe wounds, or use species-specific chemicals unless instructed by a trained local clinician or rescue service. A clinician should assess retained material, infection, tetanus, pain control, and pregnancy or pediatric medication safety.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain, swelling, redness, drainage, fever, numbness, or reduced movement"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-marinesting-selfcare-advice", titleEn: "Low-risk marine-contact care", instructionTextEn: "Only after a reliable low-risk identification and local protocol confirmation, rinse and treat as directed by Qatar lifeguard or clinical guidance. Do not rub, blindly remove material, or assume vinegar or fresh water is safe for every species. Confirm pain medicines with a pharmacist.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["worsening pain, swelling, vomiting, weakness, breathing change, or widespread rash"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-injury first-aid principles, already generalized to Stingray Injury in batch12), https://www.nhs.uk/conditions/snake-bites/ - further generalized to general marine animal stings/bites; standard first-aid knowledge of jellyfish sting management (seawater rinse, not fresh water)"],
      contentNotice: "SOURCE-ONLY UAT synthesis; this family has no generated variant in the current 504-protocol catalog. Species-specific first aid varies, so Qatar coastal species, lifeguard, poison, emergency, and wound-care pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Contraception - Birth Control Shot - standard reproductive-health knowledge (Depo-Provera injection)
  // ------------------------------------------------------------------
  {
    id: "oscg-contraception-birth-control-shot",
    titleEn: "Contraception - Birth Control Shot",
    clinicalDefinitionEn: "Contraceptive injection (e.g. Depo-Provera) symptom and side-effect assessment, based on standard, universally-recognized reproductive-health knowledge.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "birth control shot", weight: 100 },
      { phrase: "contraceptive injection", weight: 100 },
      { phrase: "depo provera side effects", weight: 100 },
      { phrase: "birth control injection question", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-birthcontrolshot-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the last injection given?" },
      { id: "oscg-birthcontrolshot-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What symptoms or questions are present?" },
      { id: "oscg-birthcontrolshot-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any collapse, severe headache or neurologic symptom, chest pain, breathing difficulty, severe allergic reaction, severe abdominal pain, or very heavy bleeding?" },
      { id: "oscg-birthcontrolshot-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy possibility, date and type of last injection, timing of intercourse, bleeding pattern, mood or self-harm concern, medicines, and whether the patient can speak privately and feels safe." }
    ],
    questions: [
      {
        id: "oscg-birthcontrolshot-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse, chest pain, severe breathing difficulty, facial or throat swelling, sudden severe headache with vision, speech, weakness or seizure symptoms, severe abdominal pain, pregnancy with pain or bleeding, very heavy bleeding with faintness, or immediate self-harm risk?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are widely-recognized warning signs of a rare but serious hormonal-contraceptive complication (such as a blood clot or severe allergic reaction) and need immediate emergency evaluation.",
        redFlag: true,
        keywords: ["severe headache after birth control shot", "leg swelling after birth control shot", "allergic reaction to birth control shot"],
        careAdviceIds: ["oscg-birthcontrolshot-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-birthcontrolshot-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is there heavy or prolonged bleeding, significant mood change, injection-site infection, pregnancy concern, a late or missed injection, unprotected intercourse, medicine interaction concern, or an adolescent privacy, consent, coercion, or safeguarding issue?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Heavy/prolonged bleeding, significant mood changes, or a missed dose with pregnancy risk warrant prompt review with a reproductive health provider.",
        redFlag: false,
        keywords: ["heavy bleeding on birth control shot", "missed birth control shot"],
        careAdviceIds: ["oscg-birthcontrolshot-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-birthcontrolshot-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these mild, common side effects (irregular light spotting, mild weight change, mild injection-site soreness) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Irregular bleeding and mild injection-site soreness are common, expected side effects that usually settle over the first few months.",
        redFlag: false,
        keywords: ["mild birth control shot side effects"],
        careAdviceIds: ["oscg-birthcontrolshot-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-birthcontrolshot-emergency-advice", titleEn: "Emergency reproductive-health precautions", instructionTextEn: "Call Qatar 999 now and do not allow self-driving. Use a safe companion where possible and follow the call-handler's instructions. Do not assume symptoms are caused by the injection or exclude pregnancy-related or unrelated emergencies.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["collapse, breathing difficulty, neurologic symptoms, severe pain, heavy bleeding, or self-harm risk"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-birthcontrolshot-urgent-advice", titleEn: "Prompt contraceptive and pregnancy-risk review", instructionTextEn: "Use the Qatar governance-approved reproductive-health pathway. Do not promise contraceptive protection or give a universal reinjection or emergency-contraception schedule without confirming the product, dates, pregnancy possibility, medicines, and local policy. Provide adolescent privacy when safe and follow consent and safeguarding rules.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["heavy bleeding, faintness, severe pain, pregnancy symptoms, worsening mood, or self-harm thoughts"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-birthcontrolshot-selfcare-advice", titleEn: "Home monitoring for mild side effects", instructionTextEn: "Irregular light bleeding, mild weight change, and mild soreness at the injection site are common and often settle within the first few months. Keep track of symptoms and the date of the next injection.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding becomes heavy or prolonged", "any severe symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized reproductive-health knowledge about the contraceptive injection (Depo-Provera) side-effect profile and rare serious complications - the specific NHS.UK side-effects subpage could not be retrieved during authoring"],
      contentNotice: "SOURCE-ONLY UAT synthesis; this family has no generated variant in the current 504-protocol catalog and lacks a directly retrieved primary source. Product-specific timing, pregnancy exclusion, emergency contraception, adolescent consent, confidentiality, and safeguarding remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Tooth Extraction - standard post-extraction dental first-aid knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-tooth-extraction",
    titleEn: "Tooth Extraction",
    clinicalDefinitionEn: "Safety-first post-dental-extraction assessment for bleeding, airway-threatening swelling, infection, dry socket, medicine risk, and expected healing in children and adults.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "tooth extraction", weight: 100 },
      { phrase: "had a tooth pulled", weight: 100 },
      { phrase: "extraction site pain", weight: 95 },
      { phrase: "dry socket", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-toothextraction-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the tooth extracted?" },
      { id: "oscg-toothextraction-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the bleeding under control?" },
      { id: "oscg-toothextraction-iaq3", sequence: 3, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10, and is it improving or worsening?" },
      { id: "oscg-toothextraction-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, immune suppression, diabetes, anticoagulants or bleeding disorder, medicines already taken, facial or neck swelling, fever, pus, swallowing, breathing, hydration, and whether a responsible adult is supervising after sedation." }
    ],
    questions: [
      {
        id: "oscg-toothextraction-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there heavy or uncontrolled bleeding despite continuous firm pressure, collapse or faintness, rapidly spreading facial or neck swelling, difficulty breathing, inability to swallow saliva, drooling, severe trismus, confusion, or reduced responsiveness after sedation or pain medicine?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Uncontrolled post-extraction bleeding or spreading facial swelling threatening the airway are time-critical dental emergencies.",
        redFlag: true,
        keywords: ["cant stop bleeding after tooth extraction", "severe swelling after tooth extraction"],
        careAdviceIds: ["oscg-toothextraction-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-toothextraction-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is pain severe, worsening after initial improvement, or associated with bad taste or odour, fever, pus, increasing swelling, difficulty opening the mouth, persistent bleeding, poor intake, immune suppression, diabetes, pregnancy, anticoagulant use, or a child with inadequate supervision?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This pattern is classic for dry socket (lost blood clot) or an infection - both well-established post-extraction complications needing prompt dental review.",
        redFlag: false,
        keywords: ["pain got worse days after extraction", "bad taste after tooth extraction", "dry socket symptoms"],
        careAdviceIds: ["oscg-toothextraction-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-toothextraction-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this the expected mild soreness and swelling in the first day or two after extraction, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild soreness, swelling, and minor oozing are expected in the first 1-2 days after a routine extraction.",
        redFlag: false,
        keywords: ["normal soreness after tooth extraction"],
        careAdviceIds: ["oscg-toothextraction-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toothextraction-emergency-advice", titleEn: "Emergency post-extraction precautions", instructionTextEn: "Call Qatar 999 now for airway symptoms, collapse, sedation-related reduced responsiveness, or uncontrolled bleeding. If awake and able, sit forward and bite continuously on clean folded gauze over the socket; do not repeatedly remove it to check. Do not allow self-driving or give food, drink, or more sedating medicine when alertness or swallowing is impaired.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing or swallowing difficulty, drooling, collapse, or reduced responsiveness", "bleeding remains heavy or swelling spreads rapidly"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothextraction-urgent-advice", titleEn: "Prompt dental assessment", instructionTextEn: "Use the Qatar governance-approved emergency-dental or oral-surgery pathway. Do not diagnose dry socket remotely, pack the socket, disturb sutures, or independently stop anticoagulants. Medication advice must account for age, pregnancy, allergy, kidney or liver disease, bleeding risk, and doses already taken.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening pain, fever, pus, facial or neck swelling, trismus, poor intake, or bleeding"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothextraction-selfcare-advice", titleEn: "Expected-healing care", instructionTextEn: "Follow the treating dentist's written instructions. Use continuous gauze pressure for minor oozing, soft cool food when fully alert, and avoid forceful rinsing, spitting, straws, smoking, vaping, or probing the socket during the initial healing period. Confirm analgesics and pediatric or pregnancy suitability with a dentist or pharmacist.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens after initial improvement, bad taste or odour, fever, pus, or increasing swelling", "persistent bleeding, poor intake, swallowing or breathing difficulty"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-taught post-extraction dental first-aid knowledge (bleeding control, dry socket recognition, clot-protection instructions) - not a single-source quote"],
      contentNotice: "UAT-only safety synthesis without a single dedicated source page. Qatar emergency-dental access, bleeding thresholds, analgesia, anticoagulant, pregnancy, pediatric, sedation-discharge, and oral-surgery pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Cough - Chronic - https://www.nhs.uk/conditions/cough/ (reviewed 2023-12-08)
  // ------------------------------------------------------------------
  {
    id: "oscg-cough-chronic",
    titleEn: "Cough - Chronic",
    clinicalDefinitionEn: "Chronic/persistent cough (3+ weeks) assessment decomposed from NHS.UK's published cough guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "chronic cough", weight: 100 },
      { phrase: "cough for weeks", weight: 100 },
      { phrase: "persistent cough", weight: 95 },
      { phrase: "cough wont go away", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-coughchronic-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the cough lasted?" },
      { id: "oscg-coughchronic-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any weight loss, blood in the phlegm, or chest pain?" },
      { id: "oscg-coughchronic-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-coughchronic-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, immune suppression, tuberculosis contact or travel, smoking or vaping, occupational exposure, reflux or asthma history, medicines such as ACE inhibitors, and whether a child is choking or may have inhaled an object." }
    ],
    questions: [
      {
        id: "oscg-coughchronic-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe breathing difficulty, blue/grey colour, collapse, confusion, inability to speak or drink, major coughing of blood, crushing chest pain, stridor, or sudden cough after choking or suspected inhaled foreign body, especially in a child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Airway obstruction, respiratory failure, major haemoptysis, and serious cardiopulmonary symptoms require immediate emergency assessment.",
        redFlag: true,
        keywords: ["severe breathing chronic cough", "coughing lots of blood", "child choking cough"],
        careAdviceIds: ["oscg-coughchronic-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-coughchronic-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is the cough rapidly worsening, is the person very unwell, or is there breathlessness, chest pain, any blood in sputum, high fever, dehydration, immune suppression, pregnancy, an infant or young child, or tuberculosis exposure or concern?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cough guidance lists these as reasons to seek urgent clinical review immediately.",
        redFlag: false,
        keywords: ["coughing up blood", "chest pain with cough", "cough getting worse fast"],
        careAdviceIds: ["oscg-coughchronic-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-coughchronic-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Has the cough lasted 3 weeks or more, or is it recurrent or associated with unexplained weight loss, night sweats, persistent hoarseness, a neck lump, smoking or vaping, occupational exposure, or a medicine that may cause cough?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends routine primary-care review for a cough persisting beyond 3 weeks, or with weight loss or immune compromise.",
        redFlag: false,
        keywords: ["cough lasting 3 weeks", "weight loss with chronic cough"],
        careAdviceIds: ["oscg-coughchronic-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-coughchronic-q2-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a mild cough under 3 weeks in an otherwise well older child or adult, with normal breathing and intake and none of the features or higher-risk states above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes most coughs under 3 weeks as manageable at home.",
        redFlag: false,
        keywords: ["mild cough under 3 weeks"],
        careAdviceIds: ["oscg-coughchronic-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-coughchronic-emergency-advice", titleEn: "Emergency cough and breathing precautions", instructionTextEn: "Call Qatar 999 now, keep the patient in the easiest breathing position, and do not allow self-driving. For suspected choking, follow the call-handler's age-appropriate first-aid instructions; do not perform a blind finger sweep.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing, blue/grey colour, collapse, or reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-coughchronic-urgent-advice", titleEn: "Prompt in-person cough review", instructionTextEn: "Use the Qatar governance-approved in-person service and timeframe. Mention immune suppression, pregnancy, child age, blood, tuberculosis exposure, travel, and breathing symptoms before arrival so infection-control precautions can be arranged.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening breathing difficulty, chest pain, increasing blood, confusion, or poor intake"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-coughchronic-routine-advice", titleEn: "Persistent-cough investigation", instructionTextEn: "Use the governance-approved Qatar primary-care or respiratory pathway for examination and investigation. Do not stop a prescribed medicine such as an ACE inhibitor without the prescriber's advice, and do not assume a persistent cough is benign.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["blood, weight loss, night sweats, chest pain, fever, or breathing difficulty"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-coughchronic-selfcare-advice", titleEn: "Low-risk cough care", instructionTextEn: "Rest, take normal fluids, avoid smoke and vaping, and use honey only for patients aged 1 year or older. Confirm all medicines with a pharmacist for age, pregnancy, chronic disease, interactions, and doses already taken.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["cough reaches 3 weeks or becomes recurrent", "blood, weight loss, fever, chest pain, poor intake, or breathing difficulty"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-08", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cough\", https://www.nhs.uk/conditions/cough/ (page last reviewed 08 December 2023)"],
      contentNotice: "UAT-only adaptation of NHS.UK cough guidance with airway, haemoptysis, tuberculosis, age, pregnancy, immunocompromise, exposure, medicine, and malignancy-warning controls. Exact Qatar respiratory, infection-control, and suspected-cancer routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Alcohol Use and Problems - https://www.nhs.uk/live-well/alcohol-support/ (reviewed 2022-12-16)
  // ------------------------------------------------------------------
  {
    id: "oscg-alcohol-use-and-problems",
    titleEn: "Alcohol Use and Problems",
    clinicalDefinitionEn: "Safety-first alcohol intoxication, co-ingestion, dependence, and withdrawal assessment for adults and adolescents aged 12 years or older. It does not diagnose dependence or authorize unsupervised detoxification.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "alcohol problem", weight: 100 },
      { phrase: "drinking too much", weight: 95 },
      { phrase: "alcohol withdrawal", weight: 100 },
      { phrase: "trying to stop drinking", weight: 90 },
      { phrase: "want to try to stop drinking", weight: 100 },
      { phrase: "think i have a drinking problem", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-alcoholuse-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What alcohol was consumed, approximately how much, over what period, and when was the last drink?" },
      { id: "oscg-alcoholuse-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Were any medicines, opioids, sedatives, stimulants, cannabis, chemicals, or other substances also taken?" },
      { id: "oscg-alcoholuse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person awake and responding normally, breathing normally, and able to protect their airway without repeated vomiting?" },
      { id: "oscg-alcoholuse-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "After stopping or reducing alcohol, when did symptoms begin, and are there shaking, sweating, vomiting, agitation, confusion, hallucinations, or seizures?" },
      { id: "oscg-alcoholuse-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there a history of withdrawal seizure, delirium tremens, epilepsy, severe withdrawal, significant liver or heart disease, pregnancy, or concurrent benzodiazepine dependence?" },
      { id: "oscg-alcoholuse-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Are there thoughts or plans to harm self or others, recent violence, suspected assault or injury, or concern that a caregiver or companion is unsafe?" },
      { id: "oscg-alcoholuse-iaq7", sequence: 7, responseType: "YES_NO", promptTextEn: "If the patient is under 18, can they speak privately now, and do they say they feel safe with the accompanying adult?" },
      { id: "oscg-alcoholuse-iaq8", sequence: 8, responseType: "YES_NO", promptTextEn: "Is a sober, safe adult available to stay with the person and arrange transport without letting them drive?" }
    ],
    questions: [
      {
        id: "oscg-alcoholuse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there loss of consciousness, inability to wake normally, stopped/slow/irregular breathing, blue or very pale skin, a seizure, repeated vomiting with reduced alertness, severe confusion or agitation, hallucinations, severe tremor, suspected poisoning or dangerous co-ingestion, serious injury, or immediate risk of suicide, violence, abuse, or unsafe supervision?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK lists impaired consciousness, abnormal breathing, seizure and colour change as alcohol-poisoning emergencies. Severe withdrawal can cause seizures or delirium tremens, and immediate self-harm, violence, poisoning or safeguarding risk also requires emergency intervention.",
        redFlag: true,
        keywords: ["alcohol poisoning unconscious", "slow irregular breathing alcohol", "seizure alcohol withdrawal", "delirium tremens", "alcohol with other drugs", "suicide risk alcohol"],
        careAdviceIds: ["oscg-alcoholuse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-alcoholuse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person dependent on alcohol and planning or attempting to stop or reduce; having anxiety, insomnia, sweating, tremor, nausea, retching, vomiting, or a racing heart within hours or days of reduction; pregnant; aged under 18; lacking safe sober supervision; or at higher risk because of prior withdrawal seizure/delirium, epilepsy, major illness, or concurrent sedative dependence?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Withdrawal can begin within 6 to 12 hours and usually lasts 3 to 7 days. NICE advises against sudden reduction in dependent drinkers without medical support and uses a lower hospital-admission threshold for adolescents and other vulnerable people.",
        redFlag: false,
        keywords: ["mild alcohol withdrawal symptoms", "physically dependent on alcohol"],
        careAdviceIds: ["oscg-alcoholuse-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-alcoholuse-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a request for help about alcohol use with no current intoxication, withdrawal, co-ingestion, pregnancy, immediate mental-health or safeguarding risk, and no plan to stop abruptly without clinical support?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A non-emergency concern still benefits from confidential clinical screening and support; this branch does not provide a self-detox plan.",
        redFlag: false,
        keywords: ["concerned about drinking too much"],
        careAdviceIds: ["oscg-alcoholuse-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-alcoholuse-emergency-advice", titleEn: "Emergency alcohol-related precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not leave the person alone and do not let them drive. If unconscious but breathing, place them in the recovery position and monitor breathing. Do not give coffee, put them in a cold shower, make them vomit, or give more alcohol. Follow the 999 call handler's instructions and retain available substance containers for responders.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing slows or stops", "reduced consciousness", "another seizure", "worsening confusion or violence"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-alcoholuse-urgent-advice", titleEn: "Urgent alcohol dependence or withdrawal assessment", instructionTextEn: "Arrange prompt in-person clinical assessment before any further reduction if dependence or withdrawal is possible. Do not advise abrupt self-detox or prescribe a drinking schedule. Ensure sober, safe supervision and transport. The exact Qatar withdrawal/addiction pathway remains GOVERNANCE_REQUIRED; for confidential substance-use screening during current operating hours, HMC publishes the National Mental Health Helpline at 16000, option 4. Call 999 if severe tremor, hallucinations, confusion, seizure, collapse, breathing abnormality, or immediate safety risk develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["withdrawal symptoms worsen", "severe tremor, hallucinations, confusion, or seizure develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-alcoholuse-selfcare-advice", titleEn: "Confidential support for alcohol use", instructionTextEn: "Arrange confidential clinical screening rather than attempting unsupported detoxification. HMC publishes the National Mental Health Helpline at 16000, option 4, including substance-use screening and brief intervention; confirm current availability when calling. The long-term Qatar addiction-treatment destination remains GOVERNANCE_REQUIRED. If withdrawal symptoms occur after reducing alcohol, obtain urgent medical assessment.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["withdrawal symptoms develop when cutting down", "pregnancy, co-ingestion, self-harm thoughts, or unsafe supervision becomes apparent"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-12-16", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Alcohol-use disorder\" (withdrawal begins within 6 to 12 hours and usually lasts 3 to 7 days), https://www.nhs.uk/conditions/alcohol-use-disorder/", "NHS.UK, \"Alcohol poisoning\", https://www.nhs.uk/conditions/alcohol-poisoning/", "NICE CG100, \"Alcohol-use disorders: diagnosis and management of physical complications\", https://www.nice.org.uk/guidance/cg100/chapter/recommendations", "NICE CG115, \"Alcohol-use disorders: diagnosis, assessment and management of harmful drinking and alcohol dependence\", https://www.nice.org.uk/guidance/cg115/chapter/Recommendations", "Hamad Medical Corporation, National Mental Health Helpline and substance-use screening service, 16000 option 4, https://www.hamad.qa/EN/news/2026/April/Pages/National-Mental-Health-Helpline-marks-six-years-of-supporting-Qatar%E2%80%99s-population.aspx"],
      contentNotice: "Safety-first UAT adaptation covering acute intoxication, poisoning, co-ingestion, withdrawal, suicide and safeguarding risk. HMC 16000 option 4 is a verified mental-health access point and HMC documentation includes substance-use screening; it is not represented as a complete detoxification or addiction-treatment destination. Exact Qatar withdrawal, adolescent, pregnancy, safeguarding, and out-of-hours pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical-governance validation before nurse UAT and is prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Smoking - Tobacco Use and Problems - standard public-health smoking-cessation knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-smoking-tobacco-use",
    titleEn: "Smoking - Tobacco Use and Problems",
    clinicalDefinitionEn: "Tobacco/smoking cessation support assessment, based on standard, universally-recognized public-health smoking-cessation knowledge and nicotine-withdrawal recognition.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "want to quit smoking", weight: 100 },
      { phrase: "smoking cessation", weight: 100 },
      { phrase: "trying to stop smoking", weight: 95 },
      { phrase: "nicotine withdrawal", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-smokingtobacco-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How much and how often does the person currently smoke?" },
      { id: "oscg-smokingtobacco-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has a quit attempt been tried before?" },
      { id: "oscg-smokingtobacco-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any chest pain, breathing difficulty, coughing blood, poisoning from liquid nicotine, pregnancy, medicines, mental-health symptoms, or other substance use?" },
      { id: "oscg-smokingtobacco-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "If under 18, can the patient speak privately and do they feel safe, without coercion or an unsafe caregiver?" }
    ],
    questions: [
      {
        id: "oscg-smokingtobacco-q0-urgent",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe or worsening breathing difficulty, chest pain, coughing blood, collapse, confusion, seizure, suspected nicotine-liquid ingestion or skin exposure with illness, pregnancy with acute symptoms, or immediate self-harm risk?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Acute cardiopulmonary symptoms, nicotine poisoning, neurologic compromise, and immediate mental-health risk require emergency assessment rather than cessation counselling.",
        redFlag: true,
        keywords: ["breathing symptoms with smoking history", "chest pain and smoker"],
        careAdviceIds: ["oscg-smokingtobacco-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-smokingtobacco-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a general request for help with quitting smoking or coping with nicotine withdrawal, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Smoking cessation support (counseling, nicotine replacement therapy) is a well-established, effective, non-urgent service.",
        redFlag: false,
        keywords: ["wants help quitting smoking"],
        careAdviceIds: ["oscg-smokingtobacco-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-smokingtobacco-urgent-advice", titleEn: "Emergency smoking or nicotine-related symptoms", instructionTextEn: "Call Qatar 999 now and do not allow self-driving. For nicotine liquid exposure, remove contaminated clothing and rinse exposed skin with water while following the call-handler's instructions; do not induce vomiting.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing, chest pain, collapse, confusion, seizure, or vomiting"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-smokingtobacco-selfcare-advice", titleEn: "Governance-approved tobacco cessation support", instructionTextEn: "Use the Qatar governance-approved cessation service. A clinician or pharmacist must select nicotine-replacement or other medicines based on age, pregnancy or breastfeeding, dependence, comorbidity, interactions, and current tobacco or nicotine products. Provide confidential adolescent assessment and follow consent and safeguarding policy.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["breathing difficulty, chest pain, coughing blood, poisoning symptoms, or self-harm thoughts"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized public-health smoking-cessation knowledge (nicotine replacement therapy and behavioral support effectiveness) - not a single-source quote"],
      contentNotice: "SOURCE-ONLY UAT synthesis; this family has no generated variant in the current 504-protocol catalog and no single cited clinical source. Qatar cessation, nicotine-poisoning, medication, pregnancy, adolescent-consent, confidentiality, and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  }
];

const batch16ChildSafeguardingProtocolIds = new Set([
  "oscg-alcohol-use-and-problems"
]);

export const batch16Protocols: ProtocolInput[] =
  batch16ProtocolDefinitions.map((protocol) =>
    batch16ChildSafeguardingProtocolIds.has(protocol.id)
      ? addChildSafeguardingUatBranches(protocol)
      : protocol
  );
