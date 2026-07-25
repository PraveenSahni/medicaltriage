import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

const buildBatch03UatProvenance = (
  input: Parameters<typeof buildGuidelineProvenance>[0]
) => buildGuidelineProvenance({
  ...input,
  contentNotice: `${input.contentNotice} UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Exact Qatar routes, medication/dose eligibility, pediatric handling, pregnancy/postpartum handling, safeguarding, and escalation details are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval.`
});

/**
 * Batch 03 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as batch01.
 *
 * Localization note (Suicide Concerns): Qatar's official emergency number is
 * 999. HMC publishes the National Mental Health Helpline as 16000, option 4,
 * available 08:00-18:00 Saturday-Thursday (verified 2026-07-25). UK-specific
 * crisis numbers in the NHS source are deliberately excluded. The host
 * organization must still approve its non-emergency out-of-hours,
 * disconnection, refusal, safeguarding, and emergency-handover procedures.
 */
export const batch03Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Suicide Concerns - https://www.nhs.uk/every-mind-matters/urgent-support/
  // ------------------------------------------------------------------
  {
    id: "oscg-suicide-concerns",
    titleEn: "Suicide Concerns",
    clinicalDefinitionEn: "UAT-only suicide-concern screening and safety-routing draft for people aged 10 years and older; a positive screen requires assessment by an appropriately trained clinician and this protocol is not a substitute for a comprehensive suicide risk assessment.",
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
      { id: "oscg-suicide-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the caller's current location, callback number, and preferred language, and can emergency services reach that location if needed?" },
      { id: "oscg-suicide-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Can the caller speak privately and safely right now? For a child or adolescent, establish whether the accompanying caregiver is trusted and safe before discussing suicidal thoughts, offer a safe opportunity to speak without that caregiver when feasible, and explain that privacy cannot be promised when information must be shared to protect the caller or another person from serious harm." },
      { id: "oscg-suicide-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the caller thinking about killing themselves right now?" },
      { id: "oscg-suicide-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Has the caller made a plan, chosen a time or method, taken preparatory steps, or do they have access to medicines, weapons, ligatures, heights, traffic, or another possible means of harm?" },
      { id: "oscg-suicide-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "Has the caller ever attempted suicide or intentionally harmed themselves? If yes, what happened, when, and was medical or mental health care received?" },
      { id: "oscg-suicide-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Does the caller feel able to stay safe while help is arranged?" },
      { id: "oscg-suicide-iaq7", sequence: 7, responseType: "OPEN_TEXT", promptTextEn: "Is a trusted, responsible adult physically present and able to provide safe continuous supervision, without putting themselves or the caller at risk?" },
      { id: "oscg-suicide-iaq8", sequence: 8, responseType: "YES_NO", promptTextEn: "Is there any immediate risk that the caller may seriously harm another person, or that a baby, child, vulnerable person, or other dependent in their care is unsafe?" },
      { id: "oscg-suicide-iaq9", sequence: 9, responseType: "YES_NO", promptTextEn: "For a child or adolescent, is the caregiver unsafe, possibly involved in abuse or exploitation, unwilling or unable to supervise safely, preventing private assessment, or threatening to remove the child before a safe handover?" }
    ],
    questions: [
      {
        id: "oscg-suicide-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the caller thinking of suicide right now; has an attempt or preparatory act occurred; is there intent, a feasible plan, or access to means; are they unable to stay safe; is safe continuous supervision unavailable; has the caller disconnected or refused help while an immediate threat remains; or is there an immediate serious risk to another person, baby, child, vulnerable person, or dependent?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NIMH guidance treats current suicidal thoughts as requiring urgent emergency mental health evaluation and says the person cannot be left alone; plan feasibility, access to means, preparatory acts, past behavior, and ability to remain safe inform immediate safety action. WHO advises not leaving a person alone when immediate danger is suspected. Qatar's official emergency number is 999.",
        redFlag: true,
        keywords: ["current suicidal thoughts", "suicide plan", "access to means", "preparatory act", "attempt in progress", "cannot stay safe", "unsafe supervision", "risk to others"],
        careAdviceIds: ["oscg-suicide-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-suicide-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature above, has the caller had recent suicidal thoughts, escalating self-harm thoughts, or past suicidal behavior; are answers incomplete or unreliable; is privacy unsafe; or, for a child or adolescent, is a caregiver unsafe, obstructing private assessment, unable to supervise, or is there a possible abuse, exploitation, neglect, or safeguarding concern requiring an age-appropriate trained clinician and the approved Qatar safeguarding pathway?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NIMH requires a brief suicide safety assessment by a trained clinician after a positive screen; non-acute positive screens still need timely assessment, safety planning, and referral. HMC's National Mental Health Helpline provides mental health assessment and support through 16000, option 4, during published operating hours.",
        redFlag: true,
        keywords: ["recent suicidal thoughts", "escalating self-harm thoughts", "past suicide attempt", "positive suicide screen", "unsafe caregiver", "child safeguarding concern", "cannot speak privately"],
        careAdviceIds: ["oscg-suicide-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      },
      {
        id: "oscg-suicide-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "After direct screening is negative for current or recent suicidal thoughts and suicidal behavior, does the caller have emotional distress or low mood and want non-emergency mental health support?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "Qatar's HMC Mental Health Helpline and PHCC pathways provide access for non-emergency mental health concerns. A negative screen does not by itself prove safety; clinical concern or an unreliable assessment must be escalated rather than assigned to this lower-acuity path.",
        redFlag: false,
        keywords: ["low mood", "occasional distressing thoughts"],
        careAdviceIds: ["oscg-suicide-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-suicide-emergency-advice", titleEn: "Qatar emergency safety response", instructionTextEn: "Call Qatar emergency services on 999 and give the caller's exact location and known risks. Keep the caller engaged and do not leave them alone while help is arranged. Ask only a trusted, safe, responsible adult to remain physically present; for a child, do not disclose details to or rely on a caregiver who may be unsafe or involved. Reduce access to possible means only when this can be done without confrontation or danger. Do not ask the caller to drive. If the caller disconnects, refuses emergency help, or an unsafe caregiver attempts to end contact while an immediate threat remains, follow the organization's approved emergency escalation, welfare-check, documentation, and safeguarding procedure; refusal does not remove the duty to escalate an immediate safety threat. Explain that confidentiality cannot be guaranteed when disclosure is necessary to protect the caller or another person from serious harm.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["caller becomes unreachable", "current suicidal thoughts", "attempt or preparation", "access to means", "cannot stay safe", "unsafe caregiver or no safe supervision", "immediate risk to another person, baby, child, vulnerable person, or dependent"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-suicide-urgent-advice", titleEn: "Urgent age-appropriate mental health and safeguarding assessment", instructionTextEn: "Arrange a suicide safety assessment by an appropriately trained, age-appropriate clinician without relying on a promise or contract to stay safe. During the HMC National Mental Health Helpline's published hours (08:00-18:00 Saturday-Thursday), call 16000 and choose option 4. For a child or adolescent, provide a safe opportunity to speak privately, do not assume a caregiver is safe, and activate the approved Qatar safeguarding process when abuse, exploitation, neglect, unsafe supervision, or risk to another child is suspected; the exact reporting and information-sharing duties are GOVERNANCE_REQUIRED. Confirm a collaborative safety plan, a trusted safe support person, and safer storage or removal of lethal means where this can be done without confrontation or danger. Outside published helpline hours, do not advise waiting when assessment or safe supervision cannot be maintained: call 999 for immediate danger; otherwise use only the urgent out-of-hours route approved by Qatar governance. If no approved timely route is available, risk increases, contact is lost, or supervision fails, escalate to 999.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["current suicidal thoughts develop", "a plan, preparation, intent, or access to means develops", "privacy or supervision becomes unsafe", "caller disconnects or refuses safe handover", "risk to another person or child develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-suicide-routine-advice", titleEn: "Qatar non-emergency mental health support", instructionTextEn: "Offer HMC's National Mental Health Helpline on 16000, option 4, during its published hours (08:00-18:00 Saturday-Thursday), or an approved PHCC or mental health appointment. Outside those hours, use only the non-emergency route and timing approved by Qatar governance; do not tell the caller to wait if safety, privacy, reliable participation, or safe supervision is uncertain. Provide a collaborative safety plan and instructions to call 999 if immediate danger develops. For a child or adolescent, explain age-appropriate confidentiality limits, offer safe private communication, and use the approved safeguarding pathway without relying on a potentially unsafe caregiver. Do not use this pathway when answers are incomplete, privacy is unsafe, the caller cannot reliably participate, safe supervision is unavailable, contact is lost, or the clinician remains concerned.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["suicidal thoughts appear or intensify", "a plan or access to means develops", "the caller cannot stay safe", "privacy, supervision, or child safety becomes uncertain"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"National Mental Health Helpline marks six years of supporting Qatar's population\", https://hamad.qa/EN/news/2026/April/Pages/National-Mental-Health-Helpline-marks-six-years-of-supporting-Qatar%E2%80%99s-population.aspx (accessed 2026-07-25)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "National Institute of Mental Health, \"Ask Suicide-Screening Questions (ASQ) Toolkit\", https://www.nimh.nih.gov/research/research-conducted-at-nimh/asq-toolkit-materials (accessed 2026-07-25)",
        "National Institute of Mental Health, \"Adult Outpatient Brief Suicide Safety Assessment Guide\", https://www.nimh.nih.gov/research/research-conducted-at-nimh/asq-toolkit-materials/adult-outpatient/adult-outpatient-brief-suicide-safety-assessment-guide (accessed 2026-07-25)",
        "World Health Organization, \"Suicide: questions and answers\", https://www.who.int/news-room/questions-and-answers/item/suicide (accessed 2026-07-25)",
        "NHS.UK, \"Every Mind Matters: Urgent support\", https://www.nhs.uk/every-mind-matters/urgent-support/"
      ],
      contentNotice:
        "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized workflow-testing draft using HMC/MoPH routing and NIMH/WHO suicide-safety principles. HMC publishes 16000 option 4 with hours of 08:00-18:00 Saturday-Thursday; 999 is Qatar's 24/7 emergency number. Requires Qatar clinical-governance approval of assessment wording, age applicability, child/adolescent privacy and safeguarding, non-emergency out-of-hours routing, confidentiality limits, emergency-service handover, disconnect/welfare-check actions, transport refusal, documentation, and follow-up before nurse UAT. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
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
      { id: "oscg-depression-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, and how long has the low mood or functional change lasted? For a child/adolescent, confirm private safe assessment and approved safeguarding/caregiver involvement." },
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
        id: "oscg-depression-q1-child-safeguarding",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "For a patient aged 12 to 17, is private assessment not currently safe or possible, might the caregiver be unsafe, or is there abuse, neglect, bullying, substance use, psychosis, risk to another person, inability to remain safe, or self-harm/suicidal thinking without the immediate plan-or-attempt features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "NICE child-depression and self-harm guidance requires child-specific assessment of home/social context, abuse or bullying, substances, self-harm/suicide and safeguarding, with an opportunity for private assessment. Exact Qatar safeguarding, mental-health destination, confidentiality, reporting, and disconnect procedure remain GOVERNANCE_REQUIRED.",
        redFlag: true,
        keywords: ["child depression safeguarding", "unsafe caregiver", "child cannot speak privately", "child self harm thoughts"],
        careAdviceIds: ["oscg-depression-child-safeguarding-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-depression-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Have symptoms of low mood, loss of interest, or hopelessness been present for most of the day, nearly every day, for more than 2 weeks?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP if you experience symptoms of depression for most of the day, every day, for more than 2 weeks.",
        redFlag: false,
        keywords: ["persistent low mood", "two weeks depressed"],
        careAdviceIds: ["oscg-depression-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-depression-q2-child-review",
        acuityOrder: 4,
        severity: "Routine",
        questionTextEn:
          "Is the patient aged 12 to 17 with low mood or loss of interest, with none of the emergency or safeguarding features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn:
          "A child or adolescent requires age-appropriate clinical assessment and safeguarding review rather than the adult-derived brief-low-mood self-care branch. Exact Qatar pediatric mental-health destination and timing remain GOVERNANCE_REQUIRED.",
        redFlag: false,
        keywords: ["child low mood", "adolescent depression"],
        careAdviceIds: ["oscg-depression-child-review-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-depression-q2-selfcare",
        acuityOrder: 5,
        severity: "Self-care",
        questionTextEn: "For an adult, is this a brief low mood of less than 2 weeks, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance notes a low mood may improve after a short time without needing clinical intervention.",
        redFlag: false,
        keywords: ["brief low mood"],
        careAdviceIds: ["oscg-depression-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-depression-emergency-advice", titleEn: "Qatar emergency mental-health response", instructionTextEn: "Call Qatar emergency services on 999, give the exact location, and do not ask the person to drive. Keep them engaged and continuously supervised by a trusted safe adult when possible. Reduce access to means only without confrontation or danger. For a child or vulnerable person, follow the approved safeguarding pathway. If contact is lost or help is refused despite immediate risk, use the approved welfare-check and emergency-handover procedure.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["caller becomes unreachable", "attempt, plan, intent, or access to means", "unsafe supervision or risk to another person"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-depression-child-safeguarding-advice", titleEn: "Urgent child mental-health and safeguarding response", instructionTextEn: "Keep the young person engaged in a safe setting and arrange urgent assessment through the Qatar governance-approved child mental-health/safeguarding pathway. Offer a safe opportunity to speak privately; do not rely on a caregiver who may be unsafe and do not promise absolute confidentiality. If immediate danger, an attempt, plan/intent, access to means, severe agitation/psychosis, unsafe supervision, or loss of contact develops, call 999 and follow the approved emergency handover or welfare-check procedure. Exact service, reporting, consent, confidentiality, and disconnect actions remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["attempt, plan, intent, or access to means", "psychosis, severe agitation, risk to another person, or inability to remain safe", "unsafe caregiver, loss of contact, or no safe supervision"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-depression-routine-advice", titleEn: "Depression clinical follow-up", instructionTextEn: "Arrange clinical or mental-health assessment through the approved Qatar pathway.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["thoughts of self-harm develop", "symptoms worsen significantly"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-depression-child-review-advice", titleEn: "Child depression assessment required", instructionTextEn: "Arrange age-appropriate child or adolescent mental-health assessment through the Qatar governance-approved pathway. Confirm a safe opportunity for private assessment and review home, school, bullying/abuse, substance use, self-harm, suicide, risk to others, safe supervision, and safeguarding. Exact destination, consent and reporting remain GOVERNANCE_REQUIRED.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["self-harm or suicidal thinking", "psychosis, severe agitation, or inability to remain safe", "abuse, bullying, unsafe caregiver, or loss of safe supervision"], displayOrder: 4, adviceCategory: "DISPOSITION" },
      { id: "oscg-depression-selfcare-advice", titleEn: "Support for a brief adult low mood", instructionTextEn: "For an adult with no emergency, urgent, pregnancy/postpartum, or safeguarding features, stay connected with trusted supports and maintain routine activity and sleep. Arrange assessment through the approved Qatar pathway if low mood persists beyond 2 weeks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["mood persists beyond 2 weeks", "thoughts of self-harm develop"], displayOrder: 5, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, mental-health, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
      sourceDocuments: [
        "NHS.UK, \"Symptoms - Clinical depression\", https://www.nhs.uk/mental-health/conditions/clinical-depression/symptoms/ (page last reviewed 5 July 2023)",
        "NICE, \"Depression in children and young people: identification and management\", https://www.nice.org.uk/guidance/ng134/chapter/recommendations",
        "NICE, \"Self-harm: assessment, management and preventing recurrence\", https://www.nice.org.uk/guidance/ng225/chapter/recommendations"
      ],
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
      { id: "oscg-insomnia-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, and how long has the sleep change lasted? Ask about child safeguarding, medicines/substances, mania, psychosis, suicidality, breathing pauses, pain, and medical illness." },
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-insomnia-emergency-advice", titleEn: "Qatar emergency insomnia-associated response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive when sleeplessness accompanies suicidal risk, severe confusion/agitation, hallucinations, mania with unsafe behaviour, poisoning/overdose, seizure, chest pain, severe breathing difficulty, or reduced consciousness. Stay with the person if safe and do not give alcohol, sedatives, or another person's sleep medicine.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["suicidal or violent risk", "confusion, hallucinations, or unsafe mania", "poisoning, seizure, abnormal breathing, or reduced consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-insomnia-routine-advice", titleEn: "Routine insomnia follow-up", instructionTextEn: "Book a routine GP appointment to discuss persistent sleep difficulty.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["mood or mental health worsens"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-insomnia-selfcare-advice", titleEn: "Sleep hygiene self-help", instructionTextEn: "Go to bed only when sleepy, keep consistent wake times, relax for an hour before bed, keep the bedroom dark and quiet, exercise during the day (not within 4 hours of bedtime), and avoid tobacco, alcohol, caffeine, large meals, screens, and daytime naps close to bedtime.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["trouble sleeping persists beyond a few weeks", "affecting daily functioning"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, mental-health, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
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
      { id: "oscg-panic-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, when did this episode start, and is it first, different, or more severe than prior clinician-diagnosed panic episodes?" },
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-panic-emergency-advice", titleEn: "Qatar emergency response for symptoms not safely attributable to panic", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for first/severe chest pain, abnormal breathing, fainting, stroke signs, seizure, anaphylaxis, pregnancy/postpartum danger signs, poisoning, or immediate risk of harm. Keep the person with you, allow the position that makes breathing easiest, and do not assume a prior panic diagnosis explains new or different symptoms.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening chest pain or breathing", "fainting, seizure, or neurological change", "risk of self-harm or harm to others"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-panic-routine-advice", titleEn: "Routine panic disorder follow-up", instructionTextEn: "Book a routine GP appointment to discuss recurring panic attacks and treatment options.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["attacks become more frequent or severe"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-panic-selfcare-advice", titleEn: "Coping with a panic attack", instructionTextEn: "Stay where you are if possible, breathe slowly and deeply, remind yourself the attack will pass and is not life-threatening, and focus on calm, positive images.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms do not settle", "chest pain or breathing difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, mental-health, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
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
      { id: "oscg-fatigue-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, and did weakness start suddenly or gradually? Clarify generalized versus one-sided/focal weakness and child feeding, behaviour, urine, and safeguarding concerns." },
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fatigue-emergency-advice", titleEn: "Qatar emergency generalized-weakness response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for sudden or one-sided weakness, inability to stand, confusion, fainting, seizure, abnormal breathing, chest pain, major bleeding, severe infection, pregnancy/postpartum danger signs, suspected poisoning, or an unwell/floppy child. Keep the person still and do not give food, drink, or medicine if consciousness or swallowing is impaired.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening or one-sided weakness", "loss of consciousness, seizure, or confusion", "abnormal breathing, chest pain, bleeding, or severe infection"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fatigue-routine-advice", titleEn: "Routine fatigue follow-up", instructionTextEn: "Book a routine GP appointment to investigate persistent or unexplained tiredness.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop", "worsening weight loss"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-fatigue-selfcare-advice", titleEn: "Home care for occasional tiredness", instructionTextEn: "Maintain a balanced diet and regular activity, keep consistent sleep times aiming for 6-9 hours, relax before bed, and avoid smoking, excess alcohol, caffeine, and screens close to bedtime.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["tiredness persists for weeks", "new symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, mental-health, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
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
      { id: "oscg-bphigh-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the adult's exact age and sex, are they pregnant or within 6 weeks postpartum, what readings were obtained, and were they repeated after rest with a validated device, correct cuff, supported bare arm, and no talking? Do not use this adult-only protocol for a child." },
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
        id: "oscg-bphigh-q1-pregnancy-emergency",
        acuityOrder: 2,
        severity: "Emergency",
        questionTextEn:
          "Is the patient pregnant or recently postpartum with severe headache, new visual disturbance, severe pain below the ribs or in the upper abdomen, seizure, confusion, collapse, severe breathing difficulty, or rapidly worsening severe illness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "NICE and RCOG identify severe headache, visual symptoms and severe upper-abdominal/rib pain in pregnancy or after birth as possible pre-eclampsia warning symptoms requiring immediate medical help. Qatar 999 is reserved here for immediate life-threatening or rapidly deteriorating features; exact maternity handover remains GOVERNANCE_REQUIRED.",
        redFlag: true,
        keywords: ["pregnancy high blood pressure", "postpartum severe headache", "preeclampsia symptoms"],
        careAdviceIds: ["oscg-bphigh-pregnancy-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bphigh-q2-pregnancy-review",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn:
          "Is the patient pregnant or recently postpartum with a raised blood-pressure reading or new headache, visual symptoms, swelling, nausea/vomiting, or upper-abdominal discomfort, but none of the immediate life-threatening features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "Pregnancy and postpartum hypertension require prompt maternity assessment because pre-eclampsia may first occur during pregnancy or after birth. Exact Qatar maternity destination, timing and transport remain GOVERNANCE_REQUIRED.",
        redFlag: false,
        keywords: ["pregnant raised blood pressure", "postpartum raised blood pressure", "possible preeclampsia"],
        careAdviceIds: ["oscg-bphigh-pregnancy-review-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bphigh-q1-urgent",
        acuityOrder: 4,
        severity: "Urgent",
        questionTextEn: "Are there frequent headaches or blurred vision, or chest pain that comes and goes?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these symptoms alongside high blood pressure.",
        redFlag: false,
        keywords: ["headaches with high blood pressure", "blurred vision"],
        careAdviceIds: ["oscg-bphigh-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bphigh-q2-routine",
        acuityOrder: 5,
        severity: "Routine",
        questionTextEn: "Is the reading 140/90 or higher (professional check) or 135/85 or higher (home check), with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance defines these as high blood pressure readings warranting a GP or pharmacy check and follow-up.",
        redFlag: false,
        keywords: ["blood pressure 140 over 90", "elevated blood pressure reading"],
        careAdviceIds: ["oscg-bphigh-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bphigh-emergency-advice", titleEn: "Qatar emergency high-blood-pressure response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive when a high reading accompanies chest/back pain, severe breathlessness, stroke signs, seizure, confusion, fainting, acute visual loss, or pregnancy/postpartum warning symptoms. Keep the person resting and do not repeatedly recheck, take extra doses, or use another person's medicine while waiting; a device reading must not delay symptom-based emergency care.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["chest/back pain or breathing difficulty", "stroke signs, seizure, confusion, or visual loss", "pregnancy/postpartum severe headache, visual symptoms, upper-abdominal pain, or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bphigh-pregnancy-emergency-advice", titleEn: "Emergency pregnancy/postpartum hypertension response", instructionTextEn: "Call Qatar emergency services on 999 for seizure, collapse, confusion, severe breathing difficulty, reduced consciousness, or rapidly worsening severe pregnancy/postpartum symptoms. Keep the patient resting, do not allow self-driving, and do not give extra blood-pressure medicine unless directed by the approved maternity/emergency pathway. Provide pregnancy or birth date and symptoms during handover; exact maternity receiving service remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["seizure, confusion, collapse, or reduced consciousness", "severe breathing difficulty", "rapidly worsening severe headache, visual disturbance, or upper-abdominal pain"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-bphigh-pregnancy-review-advice", titleEn: "Urgent maternity blood-pressure assessment", instructionTextEn: "Arrange prompt same-day maternity assessment through the Qatar governance-approved pathway; do not route a pregnant or recently postpartum patient through routine adult blood-pressure follow-up. Do not self-adjust medication. Call 999 for seizure, collapse, confusion, severe breathing difficulty, reduced consciousness, or rapid deterioration. Exact destination and transport remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["severe or worsening headache", "new visual symptoms or severe upper-abdominal/rib pain", "seizure, confusion, collapse, breathing difficulty, or reduced consciousness"], displayOrder: 3, adviceCategory: "DISPOSITION" },
      { id: "oscg-bphigh-urgent-advice", titleEn: "Urgent blood pressure review", instructionTextEn: "Arrange same-day medical review through the approved Qatar pathway for these accompanying symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["chest pain develops", "vision worsens"], displayOrder: 4, adviceCategory: "DISPOSITION" },
      { id: "oscg-bphigh-routine-advice", titleEn: "Routine blood pressure follow-up", instructionTextEn: "For a non-pregnant adult who is not recently postpartum, arrange a primary-care or pharmacy blood-pressure check and follow-up through the approved Qatar pathway.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["chest pain, severe headache, or vision changes develop", "pregnancy or recent postpartum status is identified"], displayOrder: 5, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, obstetric, emergency, cardiovascular, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Adult" },
    provenance: buildBatch03UatProvenance({
      sourceDocuments: [
        "NHS.UK, \"High blood pressure (hypertension)\", https://www.nhs.uk/conditions/high-blood-pressure-hypertension/ (page last reviewed 19 July 2024)",
        "NICE, \"Hypertension in pregnancy: diagnosis and management\", https://www.nice.org.uk/guidance/ng133/chapter/recommendations",
        "Royal College of Obstetricians and Gynaecologists, \"Pre-eclampsia\", https://www.rcog.org.uk/for-the-public/browse-our-patient-information/pre-eclampsia/"
      ],
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
      { id: "oscg-hypo-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, what glucose reading and units are shown, what symptoms are present, and what does their personal diabetes/hypoglycaemia plan say?" },
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hypo-emergency-advice", titleEn: "Qatar emergency low-blood-sugar response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for reduced consciousness, seizure, unsafe swallowing, severe confusion/aggression, injury, or failure to improve under the person's approved plan. Give prescribed glucagon only if it is available and the helper is trained, following the product/personal plan. Do not give anything by mouth to a drowsy, seizing, or unsafe-to-swallow person; use the recovery position if breathing.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement under the prescribed rescue plan", "worsening unresponsiveness", "seizure or abnormal breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hypo-selfcare-advice", titleEn: "Governed fast-acting carbohydrate treatment", instructionTextEn: "Only if fully awake and swallowing safely, follow the person's clinician-approved diabetes plan for fast-acting carbohydrate and timed glucose recheck. Product, amount, repeat interval, follow-on food, insulin/pump adjustment, and pediatric/pregnancy actions require the approved Qatar protocol; do not improvise exact doses. Escalate to 999 for deterioration or failure to respond.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["no improvement according to the personal plan", "level of consciousness or swallowing worsens", "seizure or recurrent episode"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, diabetes, emergency, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
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
      { id: "oscg-hyper-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, what glucose and ketone readings/units are shown, what symptoms are present, and what does their prescribed sick-day or pump plan say?" },
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
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hyper-emergency-advice", titleEn: "Qatar emergency hyperglycaemia/DKA response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for vomiting, abdominal pain, deep/rapid breathing, fruity breath, dehydration, confusion/drowsiness, ketones above the person's emergency-plan threshold, or rapid deterioration. Follow only the person's prescribed sick-day/pump plan; do not improvise extra insulin. Do not force fluids when vomiting, drowsy, or unsafe to swallow, and do not delay 999 for another glucose or ketone check.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening drowsiness or confusion", "vomiting, abnormal breathing, or dehydration", "rising ketones or failure of the personal plan"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hyper-routine-advice", titleEn: "Routine high blood sugar follow-up", instructionTextEn: "Take diabetes medicine as prescribed, avoid sugary/starchy foods, manage stress, stay active, and follow sick-day guidance from the diabetes care team.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["nausea, vomiting, or confusion develops", "breath develops a fruity smell"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, diabetes, emergency, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
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
      { id: "oscg-cuts-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, anticoagulated, immunocompromised, or diabetic, where is the wound, and exactly how did it occur? Include bite, puncture, contamination, body-fluid exposure, and child/vulnerable-person safeguarding concerns." },
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cuts-emergency-advice", titleEn: "Qatar emergency wound response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Apply continuous firm direct pressure with a clean dressing, adding layers without removing soaked ones. Do not remove or press directly on an embedded object. Keep the person still and warm. If a body part is amputated, wrap it in clean damp material, seal it in a bag, and keep the bag cool without direct ice contact. Follow 999 instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop or is spurting", "pale, cold, faint, confused, or unresponsive person", "loss of movement, feeling, or circulation"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cuts-urgent-advice", titleEn: "Urgent wound review", instructionTextEn: "Clean the wound as best as possible and arrange same-day medical review for cleaning, possible antibiotics, or stitches.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness, swelling, or pus", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-cuts-selfcare-advice", titleEn: "Home first aid for a minor cut", instructionTextEn: "Wash hands, check for anything embedded, apply pressure with a clean cloth, raise the area above the heart if bleeding, rinse once bleeding stops, pat dry, and cover with a sterile dressing or plaster. Keep clean and dry and change as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "wound does not heal as expected"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, wound, safeguarding, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
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
      { id: "oscg-hearing-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, when did the hearing change start, was it sudden or gradual and one- or two-sided, and was there head injury, severe noise, foreign body, medicine exposure, neurological symptom, or safeguarding concern?" },
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
        telemedicineEligible: false,
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
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hearing-emergency-advice", titleEn: "Qatar emergency hearing-loss response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive when hearing change follows major head trauma or accompanies stroke signs, severe vertigo with inability to stand, seizure, reduced consciousness, severe headache/neck stiffness, or fluid/blood from the ear after injury. Keep the person still; do not insert drops, tools, or packing into the ear and do not remove an embedded object.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["neurological change or reduced consciousness", "severe vertigo or inability to stand", "blood or clear fluid after head injury"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hearing-urgent-advice", titleEn: "Urgent hearing review", instructionTextEn: "Arrange an urgent GP appointment or 111 assessment - sudden hearing changes may need quick treatment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["hearing worsens further", "dizziness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hearing-routine-advice", titleEn: "Routine hearing follow-up", instructionTextEn: "Book a routine GP appointment; a free hearing test may also be available at some pharmacies and opticians.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["sudden worsening", "new ear pain or discharge"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, ENT, safeguarding, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch03UatProvenance({
      sourceDocuments: ["NHS.UK, \"Hearing loss\", https://www.nhs.uk/conditions/hearing-loss/ (page last reviewed 30 May 2025)"],
      contentNotice: "Decomposed from NHS.UK's published hearing loss guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
