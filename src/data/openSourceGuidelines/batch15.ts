import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

const buildBatch15UatProvenance = (
  input: Parameters<typeof buildGuidelineProvenance>[0]
) => buildGuidelineProvenance({
  ...input,
  contentNotice: `${input.contentNotice} UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Exact Qatar routes, medication/dose eligibility, pediatric handling, pregnancy/postpartum handling, immunocompromise, safeguarding, and escalation details are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval.`
});

/**
 * Batch 15 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Measles Exposure uses NHS.UK's own published post-exposure
 * guidance (contact tracing for the unvaccinated, pregnant, infants under 1,
 * and immunocompromised) - a genuine dedicated exposure page, unlike the
 * other communicable-disease "Exposure" topics still pending research.
 * Fingernail Infection and Toenail - Ingrown reuse the skin-infection
 * red-flag criteria already cited for Boils/Wound Infection Suspected,
 * combined with standard podiatry first aid. Eye Pain and Other Symptoms
 * reuses the eye-pain urgent tier from the Vision Loss source (batch14),
 * as a dedicated presentation for pain without vision change or trauma.
 */
export const batch15Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Measles Exposure - https://www.nhs.uk/conditions/measles/ (reviewed 2025-07-31)
  // ------------------------------------------------------------------
  {
    id: "oscg-measles-exposure",
    titleEn: "Measles Exposure",
    clinicalDefinitionEn: "Measles contact/exposure assessment decomposed from NHS.UK's published measles guidance's contact-tracing recommendations.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "measles exposure", weight: 100 },
      { phrase: "been around someone with measles", weight: 100 },
      { phrase: "contact with measles", weight: 95 },
      { phrase: "exposed to measles", weight: 100 },
      { phrase: "diagnosed with measles", weight: 100 },
      { phrase: "daycare with measles", weight: 100 },
      { phrase: "someone diagnosed with measles", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-measlesexposure-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the exposed person's exact age and sex, are they pregnant or immunocompromised, when/where/how close was contact, who confirmed measles, and what vaccination or prior-immunity evidence exists? Include infant and safeguarding concerns." },
      { id: "oscg-measlesexposure-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has the person had 2 doses of MMR vaccine, or had measles before?" },
      { id: "oscg-measlesexposure-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person pregnant, under 1 year old, or immunocompromised?" }
    ],
    questions: [
      {
        id: "oscg-measlesexposure-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has the person had close contact with someone with measles and is unvaccinated or only partially vaccinated, pregnant, under 1 year old, or has a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK measles guidance recommends urgent clinical contact for these groups after measles exposure - measles in pregnancy can cause miscarriage, stillbirth, or premature birth, and infants/immunocompromised people are at higher risk of severe disease.",
        redFlag: false,
        keywords: ["unvaccinated contact with measles", "pregnant exposed to measles", "baby exposed to measles"],
        careAdviceIds: ["oscg-measlesexposure-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-measlesexposure-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Has the person had 2 doses of MMR vaccine or measles before, with none of the higher-risk factors above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Fully vaccinated or previously infected individuals are generally protected and can monitor at home for symptoms.",
        redFlag: false,
        keywords: ["fully vaccinated exposed to measles"],
        careAdviceIds: ["oscg-measlesexposure-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-measlesexposure-urgent-advice", titleEn: "Urgent measles exposure follow-up", instructionTextEn: "Contact the Qatar urgent clinical review pathway promptly - do not simply walk into a clinic, as measles is highly contagious and the clinic may need to prepare to see you safely.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or rash develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-measlesexposure-selfcare-advice", titleEn: "Governed Qatar measles-exposure monitoring", instructionTextEn: "Do not attend a clinic unannounced. Avoid contact with infants, pregnant people, and immunocompromised people, and contact the Qatar public-health/clinical route approved by governance to verify exposure, immunity, vaccination records, and whether time-sensitive post-exposure action applies. Monitor for fever, cough, runny nose, red eyes, and spreading rash; call ahead before any in-person care. Vaccine or immunoglobulin eligibility/timing must not be invented by UAT content.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["fever, cough, red eyes, or rash develops", "breathing difficulty, dehydration, confusion, seizure, or severe illness"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-31", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["NHS.UK, \"Measles\", https://www.nhs.uk/conditions/measles/ (page last reviewed 31 July 2025) - contact-tracing/exposure guidance section"],
      contentNotice: "Decomposed from NHS.UK's published measles guidance's specific contact/exposure recommendations (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Tick Bite - https://www.nhs.uk/conditions/lyme-disease/ (reviewed 2025-06-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-tick-bite",
    titleEn: "Tick Bite",
    clinicalDefinitionEn: "Tick bite assessment decomposed from NHS.UK's published Lyme disease guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "tick bite", weight: 100 },
      { phrase: "bitten by a tick", weight: 100 },
      { phrase: "found a tick on me", weight: 95 },
      { phrase: "tick attached to my skin", weight: 95 },
      { phrase: "tick attached to my leg", weight: 100 },
      { phrase: "found a tick attached", weight: 100 },
      { phrase: "tick after a hike", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-tickbite-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant or immunocompromised, where/when/geographically did exposure occur, is the tick attached/engorged, and are there rash, fever, neurological, cardiac, or joint symptoms?" },
      { id: "oscg-tickbite-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the bite happen, or when was the tick found?" },
      { id: "oscg-tickbite-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there a rash or flu-like symptoms?" }
    ],
    questions: [
      {
        id: "oscg-tickbite-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Within the past 3 months of a tick bite or visiting a high-risk area, is there a round or oval rash, or flu-like symptoms such as feeling hot or cold, shivery, headaches, or aching muscles?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK Lyme disease guidance recommends urgent clinical review for these symptoms, which can appear up to 3 months after an infected tick bite.",
        redFlag: false,
        keywords: ["bullseye rash after tick bite", "flu like symptoms after tick bite"],
        careAdviceIds: ["oscg-tickbite-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-tickbite-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a recent tick bite with no rash or flu-like symptoms?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes safe tick removal as a manageable home first-aid step, with monitoring for delayed symptoms.",
        redFlag: false,
        keywords: ["recent tick bite no symptoms"],
        careAdviceIds: ["oscg-tickbite-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-tickbite-urgent-advice", titleEn: "Urgent tick bite follow-up", instructionTextEn: "Arrange urgent clinical review - if Lyme disease is suspected, antibiotics are more effective when started promptly.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["rash spreads", "symptoms worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-tickbite-selfcare-advice", titleEn: "Safe tick removal and governed follow-up", instructionTextEn: "Use fine-tipped tweezers or a proper tick tool, grasp close to the skin, and pull steadily upward without twisting, burning, coating, or crushing the tick. Wash hands and the site, record date/location and a photograph if possible, and do not delay care trying to save the tick. Antibiotic testing/treatment, pregnancy and pediatric decisions, imported-travel infections, and Qatar route require governance approval.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["expanding rash, fever, headache, facial weakness, joint swelling, or flu-like illness", "site infection or retained mouthparts with worsening inflammation"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-06-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["NHS.UK, \"Lyme disease\", https://www.nhs.uk/conditions/lyme-disease/ (page last reviewed 03 June 2025)"],
      contentNotice: "Decomposed from NHS.UK's published Lyme disease guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the tick-bite presentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Sweating - https://www.nhs.uk/conditions/excessive-sweating-hyperhidrosis/ (reviewed 2023-11-07)
  // ------------------------------------------------------------------
  {
    id: "oscg-sweating",
    titleEn: "Sweating",
    clinicalDefinitionEn: "Excessive sweating (hyperhidrosis) assessment decomposed from NHS.UK's published excessive sweating guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "sweating too much", weight: 100 },
      { phrase: "excessive sweating", weight: 100 },
      { phrase: "sweat a lot for no reason", weight: 90 },
      { phrase: "night sweats", weight: 90 },
      { phrase: "sweating way more than usual", weight: 100 },
      { phrase: "sweating more than usual for months", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-sweating-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, when did sweating begin, is it generalized/night-time or localized, and are there fever, weight loss, chest/breathing symptoms, fainting, glucose/heat/poisoning exposure, medicine/substance change, or child safeguarding concerns?" },
      { id: "oscg-sweating-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Does it happen at night?" },
      { id: "oscg-sweating-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any other symptoms, like fever, weight loss, or chest pain?" }
    ],
    questions: [
      {
        id: "oscg-sweating-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the sweating, is there chest pain, difficulty breathing, confusion, or fainting?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sudden profuse sweating combined with chest pain, breathing difficulty, confusion, or fainting is a recognized red flag for a serious underlying cause (such as a heart attack or severe infection) and needs immediate emergency care.",
        redFlag: true,
        keywords: ["sweating with chest pain", "sweating and cant breathe", "fainting with heavy sweating"],
        careAdviceIds: ["oscg-sweating-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-sweating-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has the sweating lasted at least 6 months, does it happen at least weekly or interfere with daily activities, does it happen at night, is there a family history, or is it not helped by things tried so far?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends clinical review for these persistent, functionally-limiting, or unexplained sweating patterns.",
        redFlag: false,
        keywords: ["sweating for months", "night sweats not improving"],
        careAdviceIds: ["oscg-sweating-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-sweating-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, occasional sweating with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild sweating as manageable at home with clothing and antiperspirant measures.",
        redFlag: false,
        keywords: ["mild occasional sweating"],
        careAdviceIds: ["oscg-sweating-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sweating-emergency-advice", titleEn: "Qatar emergency sweating-associated response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for sweating with chest pain, abnormal breathing, fainting, confusion, seizure, stroke signs, severe weakness, suspected hypoglycaemia, heat illness, poisoning/carbon monoxide, sepsis, or pregnancy/postpartum danger signs. Move from heat or a suspected exposure only if safe and do not give food, drink, or medicine if consciousness/swallowing is impaired.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain or breathing", "confusion, fainting, seizure, or weakness", "heat, poisoning, infection, or glucose emergency"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sweating-urgent-advice", titleEn: "Urgent sweating review", instructionTextEn: "Arrange a primary-care appointment to investigate the cause and discuss treatment options.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new symptoms develop", "sweating worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sweating-selfcare-advice", titleEn: "Governed care for non-urgent sweating", instructionTextEn: "Use loose breathable clothing, change damp clothing/socks, maintain usual fluids if not restricted, and avoid known triggers. Antiperspirant or medicine advice requires age, pregnancy/breastfeeding, skin integrity, endocrine/cardiac conditions, interactions, and approved Qatar pharmacy guidance. New night sweats, weight loss, fever, medicine/substance change, or a child with unexplained sweating needs in-person assessment.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["persistent or worsening sweating", "night sweats, fever, weight loss, palpitations, or functional impact"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-11-07", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["NHS.UK, \"Excessive sweating (hyperhidrosis)\", https://www.nhs.uk/conditions/excessive-sweating-hyperhidrosis/ (page last reviewed 07 November 2023)"],
      contentNotice: "Decomposed from NHS.UK's published excessive sweating guidance (Crown copyright, reused under the Open Government Licence). The emergency tier adds a standard, widely-taught red flag (sweating with chest pain/breathing difficulty/confusion/fainting) not explicitly on this specific page, since the source itself does not describe emergency criteria. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Swallowing Difficulty - https://www.nhs.uk/conditions/swallowing-problems-dysphagia/ (reviewed 2023-05-02)
  // ------------------------------------------------------------------
  {
    id: "oscg-swallowing-difficulty",
    titleEn: "Swallowing Difficulty",
    clinicalDefinitionEn: "UAT-only adult and pediatric dysphagia pathway separating airway obstruction, aspiration and acute neurological emergencies from swallowing difficulty requiring prompt in-person assessment.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "trouble swallowing", weight: 100 },
      { phrase: "difficulty swallowing", weight: 100 },
      { phrase: "food feels stuck in my throat", weight: 95 },
      { phrase: "hard time swallowing food", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-swallowdiff-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did swallowing change: suddenly today or gradually, and is it worsening?" },
      { id: "oscg-swallowdiff-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Can the person swallow saliva, water, medicines, soft food and solids; where does it feel stuck; and is swallowing painful?" },
      { id: "oscg-swallowdiff-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there choking, ineffective or silent cough, breathing difficulty/noisy breathing, drooling, wet/gurgly voice, food or drink returning through the nose, or shortness of breath after swallowing?" },
      { id: "oscg-swallowdiff-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Did symptoms start with facial droop, arm/leg weakness or numbness, speech change, confusion, severe headache, collapse, or another possible stroke sign?" },
      { id: "oscg-swallowdiff-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there sudden tongue/lip/throat swelling, hives, wheeze, voice change, a suspected bone/foreign body, chemical ingestion, neck trauma, or caustic/hot-liquid burn?" },
      { id: "oscg-swallowdiff-iaq6", sequence: 6, responseType: "OPEN_TEXT", promptTextEn: "What is the age, underlying neurological/developmental condition, recent surgery/intubation, chest infection history, weight loss/dehydration, and usual prescribed swallowing or feeding plan?" },
      { id: "oscg-swallowdiff-iaq7", sequence: 7, responseType: "YES_NO", promptTextEn: "For a baby or child, is there poor feeding, cyanosis, sweating or breathing change with feeds, fewer wet nappies, lethargy, recurrent vomiting, poor growth, or caregiver concern about aspiration?" }
    ],
    questions: [
      {
        id: "oscg-swallowdiff-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the airway blocked or breathing difficult/noisy; is coughing ineffective or the person unable to speak; can they not swallow saliva or are they drooling with a complete obstruction; is there acute stroke sign, reduced consciousness, cyanosis, or rapidly developing tongue/lip/throat swelling?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Airway obstruction, complete oesophageal obstruction with inability to handle secretions, anaphylaxis and acute neurological dysphagia are time-critical emergencies. Infants and children can deteriorate rapidly.",
        redFlag: true,
        keywords: ["choking cannot speak", "cant breathe while swallowing", "cannot swallow saliva", "drooling obstruction", "swallowing problem stroke", "throat swelling"],
        careAdviceIds: ["oscg-swallowdiff-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-swallowdiff-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any new or worsening swallowing difficulty, pain, food sticking, cough/choke or breathlessness with intake, wet/gurgly voice, nasal regurgitation, recurrent chest infection, weight loss/dehydration, medicine-swallowing difficulty, or infant/child feeding concern?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK advises urgent assessment for adult or child dysphagia. Aspiration can be silent, and safe texture, fluid and medicine decisions require clinical and swallowing assessment rather than telephone trial-and-error.",
        redFlag: false,
        keywords: ["wet gurgly voice after eating", "baby arches back feeding", "food comes back up through nose"],
        careAdviceIds: ["oscg-swallowdiff-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-swallowdiff-emergency-advice", titleEn: "Qatar airway or swallowing emergency response", instructionTextEn: "Call Qatar emergency services on 999 now and do not allow self-driving. If choking but coughing effectively, encourage coughing. If unable to breathe, speak or cough effectively, follow the 999 call-taker's age-appropriate choking instructions; do not perform a blind finger sweep. Start CPR if unresponsive and not breathing normally. Give nothing by mouth for complete obstruction, reduced consciousness, acute stroke signs or severe aspiration risk.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing", "blue or grey colour", "reduced consciousness", "unable to swallow saliva"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-swallowdiff-urgent-advice", titleEn: "Prompt in-person swallowing assessment", instructionTextEn: "Arrange prompt in-person assessment through an approved Qatar adult or pediatric pathway, with speech-and-language/swallowing, medical, ENT, gastrointestinal or neurological input as indicated. Until assessed, stop any item that causes cough, choke, wet voice or breathlessness; use only an existing clinician-prescribed texture/feeding plan. Do not invent a texture, add thickener, crush/open tablets or stop essential medicine without pharmacist/clinician instruction. Call 999 for airway difficulty, inability to swallow saliva, acute neurological signs or deterioration. Exact non-emergency destinations are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["choking episode", "cannot swallow saliva", "breathing or voice change", "fever or chest symptoms", "dehydration", "weight loss or child poor growth"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Dysphagia (swallowing problems)\", https://www.nhs.uk/symptoms/swallowing-problems-dysphagia/ (accessed 2026-07-25)",
        "American Speech-Language-Hearing Association, \"Adult Dysphagia\" and \"Aerodigestive Disorders\" (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric dysphagia workflow draft. Airway obstruction, inability to swallow saliva with complete obstruction, anaphylaxis, reduced consciousness or acute neurological signs route to 999; all other new/worsening dysphagia requires in-person assessment. GOVERNANCE_REQUIRED for Qatar choking/CPR instructions, stroke and allergy pathways, adult/pediatric swallowing services, feeding textures, medication formulation, ENT/GI/neurology destinations and transport. Blocked from nurse UAT pending Qatar emergency, adult, pediatric, speech-and-language/swallowing, ENT, GI, neurology and pharmacy approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 5. Ringworm - https://www.nhs.uk/conditions/ringworm/ (reviewed 2023-08-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-ringworm",
    titleEn: "Ringworm",
    clinicalDefinitionEn: "Ringworm assessment decomposed from NHS.UK's published ringworm guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "ringworm", weight: 100 },
      { phrase: "ring shaped rash", weight: 90 },
      { phrase: "circular itchy rash", weight: 85 },
      { phrase: "ring shaped itchy rash", weight: 100 },
      { phrase: "think its ringworm", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-ringworm-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant or immunocompromised, where is the rash, and does it involve scalp, beard, nails, face, genitals, widespread skin, infection, household contacts, animals, or safeguarding concerns?" },
      { id: "oscg-ringworm-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been present?" },
      { id: "oscg-ringworm-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has it been treated with an antifungal already?" }
    ],
    questions: [
      {
        id: "oscg-ringworm-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Has the ringworm not improved after antifungal treatment recommended by a pharmacist, does it affect the scalp, or does the person have a weakened immune system (from chemotherapy, steroids, or diabetes)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK ringworm guidance recommends clinical review for these situations - scalp ringworm typically needs prescription treatment.",
        redFlag: false,
        keywords: ["scalp ringworm", "ringworm not improving with antifungal"],
        careAdviceIds: ["oscg-ringworm-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-ringworm-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical ring-shaped rash with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends pharmacist-guided antifungal treatment as the first step for typical ringworm.",
        redFlag: false,
        keywords: ["typical ringworm rash"],
        careAdviceIds: ["oscg-ringworm-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ringworm-urgent-advice", titleEn: "Ringworm needing clinical review", instructionTextEn: "Arrange a primary-care appointment for prescription-strength antifungal treatment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreads rapidly", "signs of secondary bacterial infection develop"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ringworm-selfcare-advice", titleEn: "Governed ringworm care", instructionTextEn: "Keep the area clean/dry, avoid scratching and sharing towels, clothing, combs, or bedding, wash fabrics regularly, and consider affected household members/pets. Antifungal product, duration, scalp/nail treatment, pregnancy/breastfeeding, pediatric age, immunocompromise, and medicine interactions require approved Qatar pharmacist/clinician guidance. Do not use steroid cream alone on an undiagnosed fungal rash.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["scalp, beard, nail, widespread, painful, infected, or rapidly spreading involvement", "no improvement or immunocompromised patient"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-08-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["NHS.UK, \"Ringworm\", https://www.nhs.uk/conditions/ringworm/ (page last reviewed 03 August 2023)"],
      contentNotice: "Decomposed from NHS.UK's published ringworm guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Toenail - Ingrown - standard podiatry first aid + skin-infection red flags already cited
  // ------------------------------------------------------------------
  {
    id: "oscg-ingrown-toenail",
    titleEn: "Toenail - Ingrown",
    clinicalDefinitionEn: "Ingrown toenail assessment based on standard podiatry first-aid knowledge and the skin-infection red-flag criteria already cited for Boils and Wound Infection Suspected.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "ingrown toenail", weight: 100 },
      { phrase: "toenail digging into skin", weight: 90 },
      { phrase: "toenail is infected", weight: 85 },
      { phrase: "toenail is digging into the skin", weight: 100 },
      { phrase: "toenail digging into the skin", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-ingrowntoenail-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, diabetic, immunocompromised, neuropathic, or affected by poor circulation, which toe is involved, and are there spreading redness, pus, fever, severe pain, injury, or safeguarding concerns?" },
      { id: "oscg-ingrowntoenail-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been a problem?" },
      { id: "oscg-ingrowntoenail-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the person have diabetes or poor circulation?" }
    ],
    questions: [
      {
        id: "oscg-ingrowntoenail-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the toenail hot, red, swollen, increasingly painful, or leaking pus, or does the person have diabetes or poor circulation?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the skin-infection red-flag criteria already applied to Boils and Wound Infection Suspected; diabetes or poor circulation raises the risk of complications from a foot infection and needs prompt professional care.",
        redFlag: false,
        keywords: ["infected ingrown toenail", "diabetic with ingrown toenail"],
        careAdviceIds: ["oscg-ingrowntoenail-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-ingrowntoenail-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a mild ingrown toenail with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild ingrown toenails without signs of infection are manageable at home with soaking and proper nail care.",
        redFlag: false,
        keywords: ["mild ingrown toenail"],
        careAdviceIds: ["oscg-ingrowntoenail-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ingrowntoenail-urgent-advice", titleEn: "Urgent ingrown toenail review", instructionTextEn: "Arrange same-day medical or podiatry review, especially given the infection signs or diabetes/circulation risk.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ingrowntoenail-selfcare-advice", titleEn: "Safe care for mild ingrown-toenail irritation", instructionTextEn: "Wear roomy footwear, keep the toe clean and dry, and trim future nail growth straight across without cutting down the sides. Do not dig under the nail, insert cotton/string, cut into swollen skin, drain pus, or use sharp tools. Soaks, antiseptics, antibiotics, pain medicine, and podiatry route require diabetes/circulation/immunocompromise, age, pregnancy, allergy, and Qatar governance checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness spreads, swelling, pus, fever, red streaks, or pain worsens", "diabetes, poor circulation, neuropathy, or immunocompromise"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["Standard podiatry first-aid knowledge (warm soaks, cotton-wisp technique, straight-across nail trimming) combined with the skin-infection red-flag criteria already cited for Boils and Wound Infection Suspected - not a single-source quote"],
      contentNotice: "The specific NHS.UK ingrown toenail page could not be retrieved during authoring. This protocol combines widely-taught, non-proprietary podiatry first-aid technique with the skin-infection red-flag criteria already used elsewhere in this content set. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Arm Pain - https://www.nhs.uk/conditions/joint-pain/ (reviewed 2026-02-26), generalized to non-traumatic arm pain
  // ------------------------------------------------------------------
  {
    id: "oscg-arm-pain",
    titleEn: "Arm Pain",
    clinicalDefinitionEn: "Non-traumatic arm pain assessment decomposed from NHS.UK's published joint pain guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "arm pain", weight: 100 },
      { phrase: "my arm hurts", weight: 90 },
      { phrase: "arm has been aching", weight: 90 },
      { phrase: "sore arm no injury", weight: 85 },
      { phrase: "arm has just been aching", weight: 100 },
      { phrase: "no injury or anything", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-armpain-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, where/when did pain start, and is there trauma, chest/breathing symptom, weakness/numbness, swelling, colour/temperature change, fever, clot risk, immunocompromise, or safeguarding concern?" },
      { id: "oscg-armpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-armpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any chest pain, shortness of breath, or sweating along with the arm pain?" }
    ],
    questions: [
      {
        id: "oscg-armpain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the arm pain (especially the left arm) accompanied by chest pain, pressure, shortness of breath, sweating, or nausea?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Arm pain accompanied by chest symptoms is a recognized cardiac warning sign (the same underlying concern behind the HEART score already used in this system) and needs immediate emergency evaluation.",
        redFlag: true,
        keywords: ["arm pain with chest pain", "arm pain with shortness of breath"],
        careAdviceIds: ["oscg-armpain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-armpain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the skin around the painful area swollen and hot, or does the person feel generally unwell with a high temperature or feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for urgent clinical review.",
        redFlag: false,
        keywords: ["arm swollen and hot", "unwell with arm pain"],
        careAdviceIds: ["oscg-armpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-armpain-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild arm pain without the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild joint/limb pain as manageable at home with rest, ice, and gentle movement.",
        redFlag: false,
        keywords: ["mild arm pain"],
        careAdviceIds: ["oscg-armpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-armpain-emergency-advice", titleEn: "Qatar emergency arm-pain response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for arm pain with chest/back/jaw pain, breathing difficulty, sweating/nausea, collapse; sudden weakness/numbness or stroke signs; or a cold, pale/blue, pulseless, severely swollen, or rapidly painful limb. Keep the person and limb at rest; do not massage, compress, or apply direct heat.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["chest symptoms or breathing difficulty", "stroke signs", "cold, pale/blue, numb, weak, pulseless, or rapidly swollen arm"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-armpain-urgent-advice", titleEn: "Urgent arm pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection or a more significant cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-armpain-selfcare-advice", titleEn: "Governed care for mild non-traumatic arm pain", instructionTextEn: "Use relative rest and gentle movement only as tolerated; use a wrapped cool pack briefly without direct skin exposure. Do not massage or compress an unexplained swollen limb. Medicine requires age/weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulants, and current-medicine checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain persists or worsens", "swelling, redness, fever, chest symptoms, weakness, numbness, or colour/temperature change"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\" (non-injury pain guidance), https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic arm pain"],
      contentNotice: "Decomposed from NHS.UK's published joint pain guidance (Crown copyright, reused under the Open Government Licence), distinct from the Arm Injury protocol (batch06) which covers traumatic arm injuries. The emergency cardiac-symptom tier adds standard, widely-taught knowledge (not a direct quote from this specific page). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Leg Pain - https://www.nhs.uk/conditions/joint-pain/ (reviewed 2026-02-26), generalized to non-traumatic leg pain
  // ------------------------------------------------------------------
  {
    id: "oscg-leg-pain",
    titleEn: "Leg Pain",
    clinicalDefinitionEn: "Non-traumatic leg pain assessment decomposed from NHS.UK's published joint pain guidance, with an added DVT-risk screen consistent with the Wells' Criteria already used in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "leg pain", weight: 100 },
      { phrase: "my leg hurts", weight: 90 },
      { phrase: "leg has been aching", weight: 90 },
      { phrase: "sore leg no injury", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-legpain-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, where/when did pain start, and is there trauma, one-sided swelling, chest/breathing symptom, weakness/numbness, colour/temperature change, fever, clot risk, immunocompromise, or safeguarding concern?" },
      { id: "oscg-legpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the pain lasted?" },
      { id: "oscg-legpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is one leg more swollen than the other?" }
    ],
    questions: [
      {
        id: "oscg-legpain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is one leg (especially the calf) swollen, warm, and tender compared to the other, along with shortness of breath or chest pain?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "One-sided leg swelling/tenderness with breathing or chest symptoms is a recognized red flag for a blood clot that may have traveled to the lungs (consistent with the Wells' Criteria for DVT already used in this system) and needs immediate emergency evaluation.",
        redFlag: true,
        keywords: ["leg swelling with shortness of breath", "one leg swollen and painful with chest pain"],
        careAdviceIds: ["oscg-legpain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-legpain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the skin around the painful area swollen and hot, or does the person feel generally unwell with a high temperature or feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for urgent clinical review.",
        redFlag: false,
        keywords: ["leg swollen and hot", "unwell with leg pain"],
        careAdviceIds: ["oscg-legpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-legpain-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild leg pain without the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild joint/limb pain as manageable at home with rest, ice, and gentle movement.",
        redFlag: false,
        keywords: ["mild leg pain"],
        careAdviceIds: ["oscg-legpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-legpain-emergency-advice", titleEn: "Qatar emergency leg-pain response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for one-sided leg pain/swelling with chest pain, breathlessness, coughing blood, fainting; or a suddenly cold, pale/blue, numb, weak, pulseless, severely painful limb. Keep the person and leg at rest; do not walk, massage, compress, or apply direct heat.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing difficulty, chest pain, coughing blood, or collapse", "cold, pale/blue, numb, weak, pulseless, or rapidly painful leg"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-legpain-urgent-advice", titleEn: "Urgent leg pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection or a more significant cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-legpain-selfcare-advice", titleEn: "Governed care for mild non-traumatic leg pain", instructionTextEn: "Use relative rest and gentle movement only as tolerated; use a wrapped cool pack briefly without direct skin exposure. Do not massage or compress unexplained one-sided swelling. Medicine requires age/weight, pregnancy/postpartum status, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulants, and current-medicine checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain persists or worsens", "one-sided swelling, redness, fever, chest/breathing symptoms, weakness, numbness, or colour/temperature change"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["NHS.UK, \"Joint pain\" (non-injury pain guidance), https://www.nhs.uk/conditions/joint-pain/ (page last reviewed 26 February 2026) - applied to non-traumatic leg pain, with an emergency tier informed by the same DVT/PE risk concept underlying Wells' Criteria for DVT (batch02, formal rule)"],
      contentNotice: "Decomposed from NHS.UK's published joint pain guidance (Crown copyright, reused under the Open Government Licence), distinct from the Leg Injury protocol (batch13) which covers traumatic leg injuries. The emergency DVT/PE-risk tier is a documented synthesis with the Wells' Criteria concept already used elsewhere in this system, not a direct quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Eye Pain and Other Symptoms - https://www.nhs.uk/conditions/vision-loss/ (reviewed 2025-08-28), eye-pain tier generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-pain-and-other-symptoms",
    titleEn: "Eye Pain and Other Symptoms",
    clinicalDefinitionEn: "UAT-only adult and pediatric eye-pain pathway screening for sight-threatening disease, chemical exposure, trauma, acute glaucoma-pattern symptoms and contact-lens complications before urgent in-person ophthalmic assessment.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "eye pain", weight: 100 },
      { phrase: "my eye hurts", weight: 90 },
      { phrase: "eye is red and painful", weight: 95 },
      { phrase: "eye pain in bright light", weight: 90 },
      { phrase: "eye really hurts", weight: 100 },
      { phrase: "sensitive to bright light", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyepain-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Which eye hurts, where is the pain, how severe is it, and is onset sudden, worsening, deep, surface-like, with eye movement, or associated with headache?" },
      { id: "oscg-eyepain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "What exact time did pain start, and is it constant, recurrent or rapidly worsening?" },
      { id: "oscg-eyepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there any blurred, reduced, double or lost vision, halos, flashes/floaters, curtain/shadow, unequal pupil, inability to open or move the eye, or abnormal visual behavior in a child?" },
      { id: "oscg-eyepain-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is the eye red, very light-sensitive, discharging, swollen, cloudy, or accompanied by severe headache, nausea or vomiting?" },
      { id: "oscg-eyepain-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Was there chemical splash, sharp/high-speed object, grinding or power-tool exposure, blunt trauma, foreign body, blood/fluid from the eye, or recent eye surgery/injection?" },
      { id: "oscg-eyepain-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Does the person wear contact lenses, are lenses still in, or did they sleep/swim/shower in lenses?" },
      { id: "oscg-eyepain-iaq7", sequence: 7, responseType: "YES_NO", promptTextEn: "For a baby or child, is there marked distress, refusal to open/use the eye, new squint, abnormal eye movement, fever with eyelid swelling, or caregiver concern about sight?" }
    ],
    questions: [
      {
        id: "oscg-eyepain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is pain sudden or severe, or associated with any vision change, red eye plus severe headache/nausea/vomiting or halos, chemical exposure, penetrating/high-speed or major trauma, blood/fluid from the eye, inability to open/move the eye, serious neurological signs, or rapid deterioration after eye surgery/injection?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These may represent chemical injury, open globe/intraocular foreign body, acute angle-closure glaucoma, endophthalmitis, orbital or neurological emergency, or another sight-threatening condition. Telephone assessment cannot exclude them.",
        redFlag: true,
        keywords: ["sudden severe eye pain", "eye pain vision loss", "red eye vomiting halos", "chemical eye pain", "penetrating eye injury", "pain after eye surgery"],
        careAdviceIds: ["oscg-eyepain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyepain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature, is there any persistent eye pain, red or light-sensitive eye, pain with eye movement, discharge/cloudiness, eyelid swelling, foreign-body sensation, contact-lens use, or pain/abnormal visual behavior in a child?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A red painful or photophobic eye and any painful contact-lens presentation require same-day in-person examination because keratitis, uveitis and other sight-threatening disease cannot be excluded remotely. Children may not reliably report vision change.",
        redFlag: false,
        keywords: ["red painful eye", "eyes hurt in bright light"],
        careAdviceIds: ["oscg-eyepain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-eyepain-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Even if discomfort sounds mild, has true eye pain not yet been distinguished in person from surface irritation, abrasion, infection, inflammation or pressure-related disease?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This UAT pathway does not diagnose dry eye or authorize self-care from a telephone description of pain. An age-appropriate eye examination is required.",
        redFlag: false,
        keywords: ["mild eye discomfort"],
        careAdviceIds: ["oscg-eyepain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyepain-emergency-advice", titleEn: "Qatar sight-threatening eye response", instructionTextEn: "Call Qatar emergency services on 999 and do not allow driving. For a chemical splash without suspected penetration, protect yourself, remove contact lenses only if easy, and immediately rinse with lots of clean room-temperature water for at least 20 minutes while help is arranged; do not neutralize the chemical and bring its container. For a penetrating/high-speed injury or suspected open globe, do not rinse, remove an object, rub, press, patch or apply drops/ointment; protect without pressure using a rigid shield or clean cup if available.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision change", "worsening pain", "vomiting", "reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyepain-urgent-advice", titleEn: "Same-day in-person ophthalmic assessment", instructionTextEn: "Arrange same-day assessment through an approved Qatar adult or pediatric ophthalmology pathway. Remove contact lenses if easy and do not reinsert them; do not use another person's, leftover, steroid, antibiotic or anaesthetic eye drops. Do not drive while pain or vision is affected. Call 999 for sudden/severe pain, vision change, chemical or penetrating/high-speed trauma, red eye with headache/nausea/vomiting, neurological signs or rapid worsening.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes", "pain worsens", "vomiting or severe headache", "child stops opening or using the eye"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyepain-selfcare-advice", titleEn: "Telephone assessment cannot diagnose mild eye pain", instructionTextEn: "Arrange an age-appropriate in-person eye examination. Avoid rubbing, contact lenses and unprescribed drops while awaiting review. The exact Qatar non-emergency destination, transport and medication pathway are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "redness, photophobia or vision change develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-08-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page reviewed 12 March 2026)",
        "NHS.UK, \"Vision loss\", https://www.nhs.uk/conditions/vision-loss/ (page reviewed 28 August 2025)",
        "Royal Devon University Healthcare, \"Emergency eye services\" (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric eye-pain workflow draft. Sudden/severe pain, vision change, glaucoma-pattern symptoms, chemical injury, penetrating/high-speed trauma, postoperative deterioration or neurological emergency routes to 999; all remaining true eye pain requires same-day in-person examination, with contact-lens pain treated as high risk. GOVERNANCE_REQUIRED for Qatar adult/pediatric ophthalmology, chemical decontamination, trauma, postoperative, contact-lens, medication and transport pathways. Blocked from nurse UAT pending Qatar emergency, adult ophthalmology, pediatric ophthalmology and trauma approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 10. Fingernail Infection - standard podiatry/hand-infection first aid + skin-infection red flags already cited
  // ------------------------------------------------------------------
  {
    id: "oscg-fingernail-infection",
    titleEn: "Fingernail Infection",
    clinicalDefinitionEn: "Fingernail infection (paronychia) assessment, synthesized from the skin-infection red-flag criteria already cited for Boils and Wound Infection Suspected.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "fingernail infection", weight: 100 },
      { phrase: "nail bed infected", weight: 95 },
      { phrase: "swollen around my fingernail", weight: 90 },
      { phrase: "pus around my nail", weight: 95 },
      { phrase: "pus building up around my fingernail", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fingernailinfection-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, diabetic, immunocompromised, neuropathic, or affected by poor circulation, which finger is involved, and are there spreading redness, pus, fever, severe pain, injury/bite, movement limitation, or safeguarding concerns?" },
      { id: "oscg-fingernailinfection-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been a problem?" },
      { id: "oscg-fingernailinfection-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever or spreading redness up the finger?" }
    ],
    questions: [
      {
        id: "oscg-fingernailinfection-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the nail hot, red, swollen, increasingly painful, or leaking pus, or is there fever or redness spreading up the finger?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the skin-infection red-flag criteria already applied to Boils and Wound Infection Suspected - these signs warrant a same-day medical review, and drainage may be needed if pus has collected.",
        redFlag: false,
        keywords: ["infected fingernail with pus", "redness spreading up finger"],
        careAdviceIds: ["oscg-fingernailinfection-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fingernailinfection-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild redness or tenderness around the nail with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, early nail-fold irritation without pus or spreading redness can often be managed at home.",
        redFlag: false,
        keywords: ["mild nail fold irritation"],
        careAdviceIds: ["oscg-fingernailinfection-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fingernailinfection-urgent-advice", titleEn: "Urgent fingernail infection review", instructionTextEn: "Arrange same-day medical review - a collection of pus around the nail often needs to be drained by a clinician.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingernailinfection-selfcare-advice", titleEn: "Safe care for mild nail-fold irritation", instructionTextEn: "Keep the finger gently clean and dry and avoid biting, picking, cutting the cuticle, artificial nails, or drainage with a needle. Soaks, antiseptics, antibiotics, pain medicine, and hand-surgery route require diabetes/circulation/immunocompromise, age, pregnancy, allergy, and Qatar governance checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness spreads, swelling, pus, red streaks, fever, severe throbbing pain, or movement limitation", "diabetes, poor circulation, neuropathy, or immunocompromise"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch15UatProvenance({
      sourceDocuments: ["Skin-infection red-flag criteria already cited for Boils and Wound Infection Suspected, applied to a fingernail-specific presentation - not a single-source quote"],
      contentNotice: "No dedicated NHS.UK page exists for fingernail infections (paronychia) specifically. This protocol synthesizes the skin-infection red-flag criteria already used elsewhere in this content set with standard warm-soak first aid. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
