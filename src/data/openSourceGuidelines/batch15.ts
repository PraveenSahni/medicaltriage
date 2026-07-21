import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

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
      { id: "oscg-measlesexposure-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "When was the contact with measles?" },
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
        rationaleEn: "NHS.UK measles guidance recommends urgent GP or NHS 111 contact for these groups after measles exposure - measles in pregnancy can cause miscarriage, stillbirth, or premature birth, and infants/immunocompromised people are at higher risk of severe disease.",
        redFlag: false,
        keywords: ["unvaccinated contact with measles", "pregnant exposed to measles", "baby exposed to measles"],
        careAdviceIds: ["oscg-measlesexposure-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-measlesexposure-urgent-advice", titleEn: "Urgent measles exposure follow-up", instructionTextEn: "Contact a GP or NHS 111-equivalent service promptly - do not simply walk into a clinic, as measles is highly contagious and the clinic may need to prepare to see you safely.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or rash develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-measlesexposure-selfcare-advice", titleEn: "Home monitoring after measles exposure", instructionTextEn: "Watch for fever, cough, red eyes, or a rash starting on the face and spreading over the next 7-14 days, and confirm vaccination status with a GP surgery if unsure.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["fever, cough, or rash develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-31", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-tickbite-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the tick bite?" },
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
        rationaleEn: "NHS.UK Lyme disease guidance recommends an urgent GP appointment or NHS 111 call for these symptoms, which can appear up to 3 months after an infected tick bite.",
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-tickbite-urgent-advice", titleEn: "Urgent tick bite follow-up", instructionTextEn: "Arrange an urgent GP appointment or NHS 111-equivalent review - if Lyme disease is suspected, antibiotics are more effective when started promptly.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["rash spreads", "symptoms worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-tickbite-selfcare-advice", titleEn: "Safe tick removal", instructionTextEn: "Use fine-tipped tweezers or a tick-removal tool, grasp the tick as close to the skin as possible, and pull slowly straight upward without squeezing or crushing it. Clean the bite with antiseptic or soap and water afterward. Watch for a rash or flu-like symptoms over the next 3 months.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["a rash or flu-like symptoms develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-06-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-sweating-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the excessive sweating been happening?" },
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
        rationaleEn: "NHS.UK guidance recommends seeing a GP for these persistent, functionally-limiting, or unexplained sweating patterns.",
        redFlag: false,
        keywords: ["sweating for months", "night sweats not improving"],
        careAdviceIds: ["oscg-sweating-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sweating-emergency-advice", titleEn: "Emergency sweating-with-symptoms precautions", instructionTextEn: "Arrange emergency transport immediately - sweating combined with chest pain, breathing difficulty, confusion, or fainting can be a sign of a serious condition.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain", "worsening breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sweating-urgent-advice", titleEn: "Urgent sweating review", instructionTextEn: "Arrange a GP appointment to investigate the cause and discuss treatment options.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new symptoms develop", "sweating worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sweating-selfcare-advice", titleEn: "Home care for mild sweating", instructionTextEn: "Wear loose-fitting clothing and moisture-absorbing fabrics, change socks twice a day, use a stronger over-the-counter antiperspirant, and avoid alcohol and spicy food, which can make sweating worse.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["sweating persists 6 months or more", "it starts interfering with daily life"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-11-07", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
    clinicalDefinitionEn: "Difficulty swallowing (dysphagia) assessment decomposed from NHS.UK's published dysphagia guidance.",
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
      { id: "oscg-swallowdiff-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has swallowing been difficult?" },
      { id: "oscg-swallowdiff-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is it happening with solids, liquids, or both?" },
      { id: "oscg-swallowdiff-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any choking, coughing, or breathing trouble while eating?" }
    ],
    questions: [
      {
        id: "oscg-swallowdiff-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there choking while eating or drinking, a sensation that something is completely stuck and unable to pass, or is breathing difficult right now?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Choking or a complete swallowing obstruction with breathing difficulty is a time-critical airway emergency.",
        redFlag: true,
        keywords: ["choking while eating", "cant breathe while swallowing"],
        careAdviceIds: ["oscg-swallowdiff-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-swallowdiff-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does food or milk keep coming back up (sometimes through the nose), is there a wet or gurgly voice after eating or drinking, does the person get lots of chest infections, or does an infant cry or arch their back while feeding?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK dysphagia guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["wet gurgly voice after eating", "baby arches back feeding", "food comes back up through nose"],
        careAdviceIds: ["oscg-swallowdiff-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-swallowdiff-emergency-advice", titleEn: "Emergency swallowing/choking precautions", instructionTextEn: "Stop eating or drinking immediately and arrange emergency transport now.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-swallowdiff-urgent-advice", titleEn: "Urgent swallowing difficulty review", instructionTextEn: "Arrange a prompt GP appointment - swallowing problems need professional evaluation to determine the cause and safest diet.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["choking episodes occur", "weight loss develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Swallowing problems (dysphagia)\", https://www.nhs.uk/conditions/swallowing-problems-dysphagia/ (page last reviewed 02 May 2023)"],
      contentNotice: "Decomposed from NHS.UK's published dysphagia guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source provides no self-care tier and emphasizes professional evaluation, so none is included here. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-ringworm-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the rash?" },
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
        rationaleEn: "NHS.UK ringworm guidance recommends seeing a GP for these situations - scalp ringworm typically needs prescription treatment.",
        redFlag: false,
        keywords: ["scalp ringworm", "ringworm not improving with antifungal"],
        careAdviceIds: ["oscg-ringworm-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ringworm-urgent-advice", titleEn: "Ringworm needing GP review", instructionTextEn: "Arrange a GP appointment for prescription-strength antifungal treatment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreads rapidly", "signs of secondary bacterial infection develop"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ringworm-selfcare-advice", titleEn: "Home antifungal treatment for ringworm", instructionTextEn: "Ask a pharmacist to recommend an antifungal cream, gel, or spray, and use it daily for up to 4 weeks, continuing even after the rash disappears. Wash towels and bedsheets regularly, avoid sharing personal items, and don't scratch the rash.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after using antifungal treatment", "spreads to the scalp"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-08-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-ingrowntoenail-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Which toe is affected?" },
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ingrowntoenail-urgent-advice", titleEn: "Urgent ingrown toenail review", instructionTextEn: "Arrange same-day medical or podiatry review, especially given the infection signs or diabetes/circulation risk.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ingrowntoenail-selfcare-advice", titleEn: "Home care for a mild ingrown toenail", instructionTextEn: "Soak the foot in warm water 3-4 times a day, keep the toe dry the rest of the time, wear roomy shoes, and gently place a small piece of cotton under the corner of the nail if it can be done without force. Trim nails straight across, not rounded.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness, swelling, or pus develops", "pain worsens"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-armpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
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
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["arm swollen and hot", "unwell with arm pain"],
        careAdviceIds: ["oscg-armpain-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-armpain-emergency-advice", titleEn: "Emergency arm-pain-with-chest-symptoms precautions", instructionTextEn: "Arrange emergency transport immediately - arm pain with chest symptoms can be a sign of a heart attack.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-armpain-urgent-advice", titleEn: "Urgent arm pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection or a more significant cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-armpain-selfcare-advice", titleEn: "Home care for mild arm pain", instructionTextEn: "Rest the arm when possible, apply an ice pack wrapped in a towel for up to 20 minutes every 2-3 hours, keep gently moving the arm rather than fully immobilizing it, and take a suitable over-the-counter pain reliever.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 weeks", "swelling, redness, or fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-legpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain?" },
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
        rationaleEn: "NHS.UK joint pain guidance lists these as reasons for an urgent GP appointment or NHS 111 call.",
        redFlag: false,
        keywords: ["leg swollen and hot", "unwell with leg pain"],
        careAdviceIds: ["oscg-legpain-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-legpain-emergency-advice", titleEn: "Emergency leg-pain-with-clot-risk precautions", instructionTextEn: "Arrange emergency transport immediately - one-sided leg swelling with breathing or chest symptoms can be a sign of a blood clot.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-legpain-urgent-advice", titleEn: "Urgent leg pain review", instructionTextEn: "Arrange same-day medical review for these signs of possible infection or a more significant cause.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or redness", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-legpain-selfcare-advice", titleEn: "Home care for mild leg pain", instructionTextEn: "Rest the leg when possible, apply an ice pack wrapped in a towel for up to 20 minutes every 2-3 hours, keep gently moving rather than fully immobilizing it, and take a suitable over-the-counter pain reliever.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain lasts more than 2 weeks", "swelling, redness, or fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
    clinicalDefinitionEn: "Eye pain assessment (without a definite vision change or known injury) decomposed from NHS.UK's published vision loss guidance's eye-pain criteria.",
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
      { id: "oscg-eyepain-iaq1", sequence: 1, responseType: "PAIN_SCALE", promptTextEn: "How severe is the eye pain, 0-10?" },
      { id: "oscg-eyepain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it lasted?" },
      { id: "oscg-eyepain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any vision change, injury, or redness?" }
    ],
    questions: [
      {
        id: "oscg-eyepain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the eye pain suddenly severe?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK vision loss guidance lists sudden severe eye pain as a call-999/A&E criterion, even without a definite vision change.",
        redFlag: true,
        keywords: ["sudden severe eye pain"],
        careAdviceIds: ["oscg-eyepain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyepain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the eye red and painful, does bright light hurt the eyes, or is there ongoing discomfort in one or both eyes?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent GP or NHS 111 advice for a red, painful eye or light sensitivity.",
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
        severity: "Self-care",
        questionTextEn: "Is this mild eye discomfort with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild, non-red, non-light-sensitive eye discomfort can often be monitored at home briefly.",
        redFlag: false,
        keywords: ["mild eye discomfort"],
        careAdviceIds: ["oscg-eyepain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyepain-emergency-advice", titleEn: "Emergency eye pain precautions", instructionTextEn: "Do not drive to A&E - ask someone to drive you or call 999 for an ambulance. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision changes develop", "pain worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyepain-urgent-advice", titleEn: "Urgent eye pain review", instructionTextEn: "Arrange urgent same-day medical or ophthalmology review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes develop", "pain worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyepain-selfcare-advice", titleEn: "Home care for mild eye discomfort", instructionTextEn: "Rest the eyes, avoid rubbing them, and use lubricating eye drops if dryness seems to be the cause.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "redness or vision changes develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-08-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Vision loss\" (eye-pain criteria), https://www.nhs.uk/conditions/vision-loss/ (page last reviewed 28 August 2025) - applied to eye pain as its own presentation, distinct from the Vision Loss or Change protocol (batch14)"],
      contentNotice: "Decomposed from NHS.UK's published vision loss guidance's eye-pain criteria (Crown copyright, reused under the Open Government Licence), reused here for callers presenting primarily with eye pain rather than a vision change. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-fingernailinfection-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Which finger and where around the nail?" },
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fingernailinfection-urgent-advice", titleEn: "Urgent fingernail infection review", instructionTextEn: "Arrange same-day medical review - a collection of pus around the nail often needs to be drained by a clinician.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingernailinfection-selfcare-advice", titleEn: "Home care for mild nail-fold irritation", instructionTextEn: "Soak the finger in warm water several times a day, keep it clean and dry otherwise, and avoid biting nails or picking at the cuticle.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["redness, swelling, or pus develops", "pain worsens"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Skin-infection red-flag criteria already cited for Boils and Wound Infection Suspected, applied to a fingernail-specific presentation - not a single-source quote"],
      contentNotice: "No dedicated NHS.UK page exists for fingernail infections (paronychia) specifically. This protocol synthesizes the skin-infection red-flag criteria already used elsewhere in this content set with standard warm-soak first aid. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
