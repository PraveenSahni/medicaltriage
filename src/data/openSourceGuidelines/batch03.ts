import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 03 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as batch01.
 *
 * Localization note (Suicide Concerns): the NHS.UK source page lists
 * UK-specific crisis phone numbers (Samaritans 116 123, HOPELINE247, CALM,
 * Childline) which are NOT valid/reachable for a Qatar-deployed system -
 * these are deliberately NOT included in the authored care advice text.
 * `careAdvice[].instructionTextEn` instead references "your organization's
 * local emergency mental health crisis line" as an explicit placeholder the
 * host organization must fill in with real Qatar-applicable contact
 * information before production use - flagged again in `provenance`.
 */
export const batch03Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Suicide Concerns - https://www.nhs.uk/every-mind-matters/urgent-support/
  // ------------------------------------------------------------------
  {
    id: "oscg-suicide-concerns",
    titleEn: "Suicide Concerns",
    clinicalDefinitionEn: "Suicidal-ideation risk assessment decomposed from NHS.UK's published urgent mental health support guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "suicidal", weight: 100 },
      { phrase: "want to end my life", weight: 100 },
      { phrase: "suicide", weight: 100 },
      { phrase: "self harm", weight: 85 },
      { phrase: "dont want to be here anymore", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-suicide-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the caller safe right now, in a safe location?" },
      { id: "oscg-suicide-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Is anyone else with the caller right now?" },
      { id: "oscg-suicide-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long has the caller been feeling this way?" }
    ],
    questions: [
      {
        id: "oscg-suicide-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the caller have an immediate plan and means to harm themselves right now, or has an attempt already been made?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK urgent mental health guidance: \"if you or someone else is in danger, call 999 or go to A&E now.\" Immediate plan/means or an attempt in progress is a life-threatening emergency.",
        redFlag: true,
        keywords: ["suicide plan", "attempt in progress", "immediate danger"],
        careAdviceIds: ["oscg-suicide-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-suicide-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the caller having persistent thoughts of suicide or self-harm without an immediate plan or means, or have they attempted self-harm in the past?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent NHS 111 mental-health-option assessment or crisis-line contact for persistent suicidal feelings without immediate danger - same-day clinical review, not a wait-and-see approach.",
        redFlag: true,
        keywords: ["persistent suicidal thoughts", "past self-harm"],
        careAdviceIds: ["oscg-suicide-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 78,
        questionOrder: 1
      },
      {
        id: "oscg-suicide-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the caller experiencing low mood or occasional distressing thoughts, but stable and safe right now with no plan, means, or history of attempts?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends contacting a GP or mental health service when concerned but not in crisis - your mental health is as important as your physical health, and this should not be dismissed as low priority.",
        redFlag: false,
        keywords: ["low mood", "occasional distressing thoughts"],
        careAdviceIds: ["oscg-suicide-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-suicide-emergency-advice", titleEn: "Emergency safety precautions", instructionTextEn: "Stay on the line with the caller if possible, do not leave them alone, remove access to means of harm if safely possible, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["caller becomes unreachable", "immediate attempt in progress"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-suicide-urgent-advice", titleEn: "Urgent mental health follow-up", instructionTextEn: "Connect the caller with your organization's local emergency mental health crisis line and arrange same-day clinical review. Stay engaged with the caller and avoid leaving them without support until connected.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["thoughts intensify", "a plan or means develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-suicide-routine-advice", titleEn: "Routine mental health support", instructionTextEn: "Encourage contacting a GP or local mental health support service. Provide your organization's local mental health support line contact information.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["thoughts become more frequent or intense", "a plan or means develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Every Mind Matters: Urgent support\", https://www.nhs.uk/every-mind-matters/urgent-support/"],
      contentNotice:
        "Decomposed from NHS.UK's published urgent mental health support guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. UK-specific crisis phone numbers from the source (Samaritans, HOPELINE247, CALM, Childline) are NOT included in this content - they are not reachable/applicable in Qatar. The host organization MUST insert real, locally-applicable crisis-line contact information into the placeholder care advice before production use. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, with particular attention given the safety sensitivity of this topic."
    })
  },

  // ------------------------------------------------------------------
  // 2. Depression - https://www.nhs.uk/mental-health/conditions/clinical-depression/symptoms/ (reviewed 2023-07-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-depression",
    titleEn: "Depression",
    clinicalDefinitionEn: "Depression assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "depression", weight: 100 },
      { phrase: "feeling depressed", weight: 90 },
      { phrase: "low mood", weight: 80 },
      { phrase: "no interest in anything", weight: 70 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-depression-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the low mood lasted?" },
      { id: "oscg-depression-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any thoughts of self-harm or suicide?" },
      { id: "oscg-depression-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How is this affecting daily life (work, sleep, appetite, relationships)?" }
    ],
    questions: [
      {
        id: "oscg-depression-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are there thoughts of suicide with a plan or means, or has a self-harm attempt been made?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the depression guidance itself - NHS.UK's depression page explicitly flags suicidal thoughts and self-harm as serious symptoms requiring dedicated urgent support.",
        redFlag: true,
        keywords: ["suicidal thoughts", "self harm plan"],
        careAdviceIds: ["oscg-depression-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-depression-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have symptoms of low mood, loss of interest, or hopelessness been present for most of the day, nearly every day, for more than 2 weeks?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP if you experience symptoms of depression for most of the day, every day, for more than 2 weeks.",
        redFlag: false,
        keywords: ["persistent low mood", "two weeks depressed"],
        careAdviceIds: ["oscg-depression-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-depression-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a brief low mood of less than 2 weeks, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance notes a low mood may improve after a short time without needing clinical intervention.",
        redFlag: false,
        keywords: ["brief low mood"],
        careAdviceIds: ["oscg-depression-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-depression-emergency-advice", titleEn: "Emergency mental health precautions", instructionTextEn: "Stay with the caller, do not leave them alone, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["caller becomes unreachable", "attempt in progress"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-depression-routine-advice", titleEn: "Routine depression follow-up", instructionTextEn: "Book a routine GP or mental health service appointment for assessment and support options.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["thoughts of self-harm develop", "symptoms worsen significantly"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-depression-selfcare-advice", titleEn: "Support for a brief low mood", instructionTextEn: "Stay connected with friends and family, maintain routine activity and sleep, and reach out to a GP if the low mood persists beyond 2 weeks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["mood persists beyond 2 weeks", "thoughts of self-harm develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Symptoms - Clinical depression\", https://www.nhs.uk/mental-health/conditions/clinical-depression/symptoms/ (page last reviewed 5 July 2023)"],
      contentNotice: "Decomposed from NHS.UK's published depression symptoms guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Insomnia - https://www.nhs.uk/conditions/insomnia/ (reviewed 2024-03-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-insomnia",
    titleEn: "Insomnia",
    clinicalDefinitionEn: "Insomnia/sleep difficulty assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "insomnia", weight: 100 },
      { phrase: "cant sleep", weight: 90 },
      { phrase: "trouble sleeping", weight: 90 },
      { phrase: "not sleeping well", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-insomnia-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the trouble sleeping lasted?" },
      { id: "oscg-insomnia-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have changes to sleep habits already been tried?" },
      { id: "oscg-insomnia-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How is this affecting daily life?" }
    ],
    questions: [
      {
        id: "oscg-insomnia-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. related to a medical condition needing immediate attention)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the insomnia guidance itself - insomnia is rarely itself an emergency, but must not mask an underlying urgent medical or mental health condition.",
        redFlag: true,
        keywords: ["life threatening"],
        careAdviceIds: ["oscg-insomnia-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-insomnia-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has changing sleeping habits not helped, has the trouble sleeping lasted months, or is it affecting daily life to the point of making it hard to cope?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends seeing a GP when self-help sleep changes have not helped, symptoms have lasted months, or daily functioning is impaired.",
        redFlag: false,
        keywords: ["chronic insomnia", "insomnia affecting daily life"],
        careAdviceIds: ["oscg-insomnia-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-insomnia-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this recent, mild sleep difficulty with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides self-help sleep hygiene measures for uncomplicated, recent sleep difficulty.",
        redFlag: false,
        keywords: ["recent mild sleep trouble"],
        careAdviceIds: ["oscg-insomnia-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-insomnia-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern first and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["underlying condition worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-insomnia-routine-advice", titleEn: "Routine insomnia follow-up", instructionTextEn: "Book a routine GP appointment to discuss persistent sleep difficulty.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["mood or mental health worsens"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-insomnia-selfcare-advice", titleEn: "Sleep hygiene self-help", instructionTextEn: "Go to bed only when sleepy, keep consistent wake times, relax for an hour before bed, keep the bedroom dark and quiet, exercise during the day (not within 4 hours of bedtime), and avoid tobacco, alcohol, caffeine, large meals, screens, and daytime naps close to bedtime.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["trouble sleeping persists beyond a few weeks", "affecting daily functioning"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-03-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insomnia\", https://www.nhs.uk/conditions/insomnia/ (page last reviewed 19 March 2024)"],
      contentNotice: "Decomposed from NHS.UK's published insomnia guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Anxiety and Panic Attack - https://www.nhs.uk/mental-health/conditions/panic-disorder/ (reviewed 2023-08-22)
  // ------------------------------------------------------------------
  {
    id: "oscg-anxiety-panic-attack",
    titleEn: "Anxiety and Panic Attack",
    clinicalDefinitionEn: "Panic attack/anxiety assessment decomposed from NHS.UK's published panic disorder guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "panic attack", weight: 100 },
      { phrase: "anxiety attack", weight: 95 },
      { phrase: "cant breathe anxious", weight: 75 },
      { phrase: "feeling panicked", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-panic-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did this episode start?" },
      { id: "oscg-panic-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has this happened before?" },
      { id: "oscg-panic-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe what the caller is feeling right now." }
    ],
    questions: [
      {
        id: "oscg-panic-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there crushing or pressure-like chest pain, pain spreading to the arm/jaw, fainting, or severe difficulty breathing that does not fit a typical panic attack pattern?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the panic disorder guidance itself (NHS.UK's page notes it does not give 999 criteria) - panic attack symptoms can closely mimic cardiac or respiratory emergencies, which must be ruled out first, not assumed to be anxiety.",
        redFlag: true,
        keywords: ["chest pain not typical panic", "fainting", "severe breathing difficulty"],
        careAdviceIds: ["oscg-panic-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-panic-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the caller had regular, unexpected panic attacks followed by at least a month of ongoing worry about having more?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: this pattern may indicate panic disorder and warrants a GP visit for assessment.",
        redFlag: false,
        keywords: ["recurring panic attacks", "ongoing worry about attacks"],
        careAdviceIds: ["oscg-panic-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-panic-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a single, isolated panic episode now settling, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides in-the-moment coping techniques for an isolated panic episode.",
        redFlag: false,
        keywords: ["single panic episode", "settling down"],
        careAdviceIds: ["oscg-panic-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-panic-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the caller calm and still and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-panic-routine-advice", titleEn: "Routine panic disorder follow-up", instructionTextEn: "Book a routine GP appointment to discuss recurring panic attacks and treatment options.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["attacks become more frequent or severe"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-panic-selfcare-advice", titleEn: "Coping with a panic attack", instructionTextEn: "Stay where you are if possible, breathe slowly and deeply, remind yourself the attack will pass and is not life-threatening, and focus on calm, positive images.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms do not settle", "chest pain or breathing difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-08-22", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Panic disorder\", https://www.nhs.uk/mental-health/conditions/panic-disorder/ (page last reviewed 22 August 2023)"],
      contentNotice: "Decomposed from NHS.UK's published panic disorder guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source page itself provides no 999/emergency criteria for panic attacks - the emergency screen here is added specifically to rule out cardiac/respiratory mimics, a standard tele-triage safety practice, not part of the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Weakness (Generalized) and Fatigue - https://www.nhs.uk/conditions/tiredness-and-fatigue/ (reviewed 2023-06-02)
  // ------------------------------------------------------------------
  {
    id: "oscg-weakness-fatigue",
    titleEn: "Weakness (Generalized) and Fatigue",
    clinicalDefinitionEn: "Generalized weakness/fatigue assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 5,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "fatigue", weight: 100 },
      { phrase: "feeling weak", weight: 95 },
      { phrase: "no energy", weight: 85 },
      { phrase: "exhausted", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fatigue-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the tiredness or weakness lasted?" },
      { id: "oscg-fatigue-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any unintentional weight loss, mood changes, or other new symptoms?" },
      { id: "oscg-fatigue-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Is this affecting daily activities?" }
    ],
    questions: [
      {
        id: "oscg-fatigue-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden one-sided weakness or numbness, slurred speech, chest pain, severe difficulty breathing, or is the person confused or difficult to rouse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the tiredness/fatigue guidance itself - sudden focal weakness or altered consciousness may indicate stroke or another acute emergency rather than simple fatigue.",
        redFlag: true,
        keywords: ["sudden one-sided weakness", "slurred speech", "confused"],
        careAdviceIds: ["oscg-fatigue-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fatigue-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the tiredness lasted a few weeks without a clear cause, is it affecting daily life, or is it accompanied by weight loss, mood changes, or gasping/snorting/choking sounds during sleep?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for unexplained, persistent, or functionally-impairing tiredness, or tiredness with these associated symptoms.",
        redFlag: false,
        keywords: ["persistent unexplained tiredness", "weight loss with fatigue"],
        careAdviceIds: ["oscg-fatigue-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-fatigue-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a normal, occasional tiredness with a clear cause and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: it's normal to feel tired sometimes; sleep hygiene and lifestyle measures are appropriate first steps.",
        redFlag: false,
        keywords: ["normal occasional tiredness"],
        careAdviceIds: ["oscg-fatigue-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fatigue-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the caller safe and still and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening weakness", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fatigue-routine-advice", titleEn: "Routine fatigue follow-up", instructionTextEn: "Book a routine GP appointment to investigate persistent or unexplained tiredness.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop", "worsening weight loss"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-fatigue-selfcare-advice", titleEn: "Home care for occasional tiredness", instructionTextEn: "Maintain a balanced diet and regular activity, keep consistent sleep times aiming for 6-9 hours, relax before bed, and avoid smoking, excess alcohol, caffeine, and screens close to bedtime.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["tiredness persists for weeks", "new symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Tiredness and fatigue\", https://www.nhs.uk/conditions/tiredness-and-fatigue/ (page last reviewed 02 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published tiredness and fatigue guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Blood Pressure - High - https://www.nhs.uk/conditions/high-blood-pressure-hypertension/ (reviewed 2024-07-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-blood-pressure-high",
    titleEn: "Blood Pressure - High",
    clinicalDefinitionEn: "High blood pressure assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 18,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 3,
    keywords: [
      { phrase: "high blood pressure", weight: 100 },
      { phrase: "hypertension", weight: 90 },
      { phrase: "blood pressure reading high", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bphigh-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was the blood pressure reading, and how was it measured?" },
      { id: "oscg-bphigh-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the caller already being treated for high blood pressure?" },
      { id: "oscg-bphigh-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any other symptoms right now (headache, chest pain, vision changes)?" }
    ],
    questions: [
      {
        id: "oscg-bphigh-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there chest pain or discomfort that does not go away, pain spreading to the arm/neck/jaw/back, or chest pain with sweating, nausea, lightheadedness, or breathlessness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK high blood pressure guidance lists these as call-999 criteria for a possible heart attack.",
        redFlag: true,
        keywords: ["chest pain with high blood pressure", "pain spreading to arm"],
        careAdviceIds: ["oscg-bphigh-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bphigh-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Are there frequent headaches or blurred vision, or chest pain that comes and goes?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these symptoms alongside high blood pressure.",
        redFlag: false,
        keywords: ["headaches with high blood pressure", "blurred vision"],
        careAdviceIds: ["oscg-bphigh-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bphigh-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the reading 140/90 or higher (professional check) or 135/85 or higher (home check), with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance defines these as high blood pressure readings warranting a GP or pharmacy check and follow-up.",
        redFlag: false,
        keywords: ["blood pressure 140 over 90", "elevated blood pressure reading"],
        careAdviceIds: ["oscg-bphigh-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bphigh-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the caller sitting still and calm and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bphigh-urgent-advice", titleEn: "Urgent blood pressure review", instructionTextEn: "Arrange same-day medical review for these accompanying symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["chest pain develops", "vision worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-bphigh-routine-advice", titleEn: "Routine blood pressure follow-up", instructionTextEn: "Book a GP or pharmacy blood pressure check and follow-up. Lifestyle measures: balanced diet, 150+ minutes of exercise weekly, weight management, reduced salt and alcohol, and no smoking.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["chest pain, severe headache, or vision changes develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-07-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"High blood pressure (hypertension)\", https://www.nhs.uk/conditions/high-blood-pressure-hypertension/ (page last reviewed 19 July 2024)"],
      contentNotice: "Decomposed from NHS.UK's published high blood pressure guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Diabetes - Low Blood Sugar - https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/ (reviewed 2023-08-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-diabetes-low-blood-sugar",
    titleEn: "Diabetes - Low Blood Sugar",
    clinicalDefinitionEn: "Hypoglycemia (low blood sugar) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "low blood sugar", weight: 100 },
      { phrase: "hypoglycemia", weight: 95 },
      { phrase: "hypo", weight: 70 },
      { phrase: "blood sugar dropped", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hypo-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the blood sugar reading, if known?" },
      { id: "oscg-hypo-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is a glucagon injection available and does someone know how to use it?" },
      { id: "oscg-hypo-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has the person been drinking alcohol?" }
    ],
    questions: [
      {
        id: "oscg-hypo-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person unresponsive or unconscious, AND is a glucagon injection unavailable, or has one already been given without recovery within 10 minutes, or has the person been drinking alcohol?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK low blood sugar guidance lists these as call-999 criteria for severe hypoglycemia.",
        redFlag: true,
        keywords: ["unconscious low blood sugar", "glucagon not available", "no recovery after glucagon"],
        careAdviceIds: ["oscg-hypo-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hypo-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is the person conscious and able to swallow safely, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides the fast-acting sugar treatment steps for a conscious person with low blood sugar.",
        redFlag: false,
        keywords: ["conscious low blood sugar", "able to swallow"],
        careAdviceIds: ["oscg-hypo-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hypo-emergency-advice", titleEn: "Emergency low blood sugar precautions", instructionTextEn: "If a glucagon injection is available and someone knows how to use it, give it now. Arrange emergency transport immediately regardless.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after glucagon", "worsening unresponsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hypo-selfcare-advice", titleEn: "Fast-acting sugar treatment", instructionTextEn: "Give a small glass of fruit juice or sugary fizzy drink, 5 glucose tablets, 4 large jelly babies, or 2 tubes of glucose gel. Check blood sugar after 10-15 minutes; if still low, repeat. Once recovered, eat something that will keep blood sugar up longer.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["no improvement after repeated treatment", "level of consciousness drops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-08-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Low blood sugar (hypoglycaemia)\", https://www.nhs.uk/conditions/low-blood-sugar-hypoglycaemia/ (page last reviewed 03 August 2023)"],
      contentNotice: "Decomposed from NHS.UK's published low blood sugar guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Diabetes - High Blood Sugar - https://www.nhs.uk/conditions/high-blood-sugar-hyperglycaemia/ (reviewed 2026-03-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-diabetes-high-blood-sugar",
    titleEn: "Diabetes - High Blood Sugar",
    clinicalDefinitionEn: "Hyperglycemia (high blood sugar) and diabetic ketoacidosis risk assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "high blood sugar", weight: 100 },
      { phrase: "hyperglycemia", weight: 95 },
      { phrase: "diabetic ketoacidosis", weight: 85 },
      { phrase: "blood sugar too high", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hyper-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the blood sugar reading, if known?" },
      { id: "oscg-hyper-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has a ketone level been checked (blood or urine)?" },
      { id: "oscg-hyper-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has diabetes medicine been taken as prescribed today?" }
    ],
    questions: [
      {
        id: "oscg-hyper-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Along with high blood sugar, is there nausea/vomiting or stomach pain, faster-than-usual breathing or heart rate, drowsiness, breath with a fruity ('pear drop') smell, confusion or difficulty concentrating, or a high ketone level?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK high blood sugar guidance lists these as call-999/A&E criteria for possible diabetic ketoacidosis (DKA). Do not drive to A&E - call an ambulance.",
        redFlag: true,
        keywords: ["fruity breath smell", "confused high blood sugar", "high ketones"],
        careAdviceIds: ["oscg-hyper-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hyper-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has blood sugar remained high or symptoms continued despite trying to lower it, or is this high blood sugar in someone not previously diagnosed with diabetes?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends contacting a diabetes care team or GP for persistent high readings or a new, undiagnosed presentation.",
        redFlag: false,
        keywords: ["persistent high blood sugar", "new diabetes symptoms"],
        careAdviceIds: ["oscg-hyper-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hyper-emergency-advice", titleEn: "Emergency DKA precautions", instructionTextEn: "Do not drive to hospital - call for an ambulance or arrange someone else to drive. Keep the person hydrated with water if able to drink safely.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening drowsiness", "vomiting continues"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hyper-routine-advice", titleEn: "Routine high blood sugar follow-up", instructionTextEn: "Take diabetes medicine as prescribed, avoid sugary/starchy foods, manage stress, stay active, and follow sick-day guidance from the diabetes care team.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["nausea, vomiting, or confusion develops", "breath develops a fruity smell"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"High blood sugar (hyperglycaemia)\", https://www.nhs.uk/conditions/high-blood-sugar-hyperglycaemia/ (page last reviewed 17 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published high blood sugar guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Cuts and Lacerations - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02)
  // ------------------------------------------------------------------
  {
    id: "oscg-cuts-lacerations",
    titleEn: "Cuts and Lacerations",
    clinicalDefinitionEn: "Cut/laceration wound assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "cut", weight: 90 },
      { phrase: "laceration", weight: 95 },
      { phrase: "deep cut", weight: 95 },
      { phrase: "gash", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-cuts-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the cut located?" },
      { id: "oscg-cuts-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How did the cut happen, and roughly how big/deep is it?" },
      { id: "oscg-cuts-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the bleeding under control with direct pressure?" }
    ],
    questions: [
      {
        id: "oscg-cuts-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is bleeding uncontrolled or spurting bright red blood, is there numbness or trouble moving near the wound, is it a bad cut on the face or palm, is the wound very large or deep, or is something stuck in it (e.g. glass)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK cuts and grazes guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["uncontrolled bleeding", "numbness near wound", "embedded object", "deep cut face"],
        careAdviceIds: ["oscg-cuts-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-cuts-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Does the wound have soil, pus, or dirt still in it after cleaning, was it from a person or animal bite, is it swollen/red/getting more painful or leaking pus, is it larger than about 5cm, or does the caller feel generally unwell or feverish?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or see a GP for the wound.",
        redFlag: false,
        keywords: ["dirty wound", "infected cut", "large cut", "feverish with cut"],
        careAdviceIds: ["oscg-cuts-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-cuts-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a small, shallow cut with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor cuts as manageable at home with basic first aid.",
        redFlag: false,
        keywords: ["small cut", "shallow cut"],
        careAdviceIds: ["oscg-cuts-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cuts-emergency-advice", titleEn: "Emergency wound precautions", instructionTextEn: "Apply firm direct pressure with a clean cloth (do not remove anything embedded in the wound) and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cuts-urgent-advice", titleEn: "Urgent wound review", instructionTextEn: "Clean the wound as best as possible and arrange same-day medical review for cleaning, possible antibiotics, or stitches.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness, swelling, or pus", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-cuts-selfcare-advice", titleEn: "Home first aid for a minor cut", instructionTextEn: "Wash hands, check for anything embedded, apply pressure with a clean cloth, raise the area above the heart if bleeding, rinse once bleeding stops, pat dry, and cover with a sterile dressing or plaster. Keep clean and dry and change as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "wound does not heal as expected"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)"],
      contentNotice: "Decomposed from NHS.UK's published cuts and grazes guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Hearing Loss or Change - https://www.nhs.uk/conditions/hearing-loss/ (reviewed 2025-05-30)
  // ------------------------------------------------------------------
  {
    id: "oscg-hearing-loss",
    titleEn: "Hearing Loss or Change",
    clinicalDefinitionEn: "Hearing loss/change assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "hearing loss", weight: 100 },
      { phrase: "cant hear well", weight: 85 },
      { phrase: "sudden deafness", weight: 90 },
      { phrase: "muffled hearing", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hearing-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the hearing change start?" },
      { id: "oscg-hearing-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "One ear or both?" },
      { id: "oscg-hearing-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any ear pain, discharge, or dizziness?" }
    ],
    questions: [
      {
        id: "oscg-hearing-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. associated with a head injury or stroke symptoms)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the hearing loss guidance itself - hearing loss is rarely an emergency on its own, but must not mask trauma or a neurological event.",
        redFlag: true,
        keywords: ["hearing loss with head injury", "hearing loss with stroke symptoms"],
        careAdviceIds: ["oscg-hearing-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hearing-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Did the hearing loss come on suddenly in one or both ears, has it worsened over just the last few days or weeks, or does it come with earache or discharge?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends an urgent GP appointment or 111 call for sudden hearing loss or hearing loss with other symptoms - it may need to be treated quickly.",
        redFlag: false,
        keywords: ["sudden hearing loss", "hearing loss with earache"],
        careAdviceIds: ["oscg-hearing-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hearing-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Has the hearing been getting gradually worse over time, or did it not improve after treatment for an ear infection or earwax?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for gradual hearing changes or hearing that hasn't improved after prior treatment.",
        redFlag: false,
        keywords: ["gradual hearing loss", "hearing not improved after treatment"],
        careAdviceIds: ["oscg-hearing-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hearing-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["underlying condition worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hearing-urgent-advice", titleEn: "Urgent hearing review", instructionTextEn: "Arrange an urgent GP appointment or 111 assessment - sudden hearing changes may need quick treatment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["hearing worsens further", "dizziness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hearing-routine-advice", titleEn: "Routine hearing follow-up", instructionTextEn: "Book a routine GP appointment; a free hearing test may also be available at some pharmacies and opticians.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["sudden worsening", "new ear pain or discharge"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-05-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hearing loss\", https://www.nhs.uk/conditions/hearing-loss/ (page last reviewed 30 May 2025)"],
      contentNotice: "Decomposed from NHS.UK's published hearing loss guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
