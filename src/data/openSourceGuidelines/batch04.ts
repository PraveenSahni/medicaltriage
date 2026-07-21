import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 04 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as batch01/03.
 *
 * Localization note (Sexual Assault or Rape): same as Suicide Concerns in
 * batch03 - no UK-specific service names/numbers are included; care advice
 * references "your organization's local sexual assault support service /
 * SARC-equivalent" as an explicit placeholder for the host organization.
 */
export const batch04Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Confusion - Delirium - https://www.nhs.uk/conditions/confusion/ (reviewed 2024-05-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-confusion-delirium",
    titleEn: "Confusion - Delirium",
    clinicalDefinitionEn: "Sudden confusion (delirium) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "sudden confusion", weight: 100 },
      { phrase: "delirium", weight: 95 },
      { phrase: "acting confused", weight: 90 },
      { phrase: "became confused", weight: 95 },
      { phrase: "very confused", weight: 90 },
      { phrase: "doesn t know where he is", weight: 90 },
      { phrase: "disoriented", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-confusion-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the confusion start?" },
      { id: "oscg-confusion-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is this new, or a gradual long-standing change?" },
      { id: "oscg-confusion-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any recent illness, medication changes, head injury, or diabetes?" }
    ],
    questions: [
      {
        id: "oscg-confusion-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has the person suddenly become confused?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance: \"go to A&E or call 999 if someone suddenly becomes confused\" - many causes need urgent assessment and can be life-threatening (infection, stroke, low blood sugar, head injury, medication, carbon monoxide, severe respiratory/cardiac problems, seizure).",
        redFlag: true,
        keywords: ["sudden new confusion", "suddenly confused"],
        careAdviceIds: ["oscg-confusion-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-confusion-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the person been gradually becoming more forgetful or confused over weeks or months, without a sudden change?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for gradual forgetfulness/confusion, which may indicate dementia rather than an acute cause.",
        redFlag: false,
        keywords: ["gradual forgetfulness", "long-standing confusion"],
        careAdviceIds: ["oscg-confusion-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-confusion-emergency-advice", titleEn: "Emergency confusion precautions", instructionTextEn: "Stay with the person, use simple language, avoid asking multiple questions at once, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-confusion-routine-advice", titleEn: "Routine memory/confusion follow-up", instructionTextEn: "Book a routine GP appointment to assess gradual forgetfulness or confusion.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["confusion suddenly worsens", "new inability to recognize people or places"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-05-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Confusion\", https://www.nhs.uk/conditions/confusion/ (page last reviewed 28 May 2024)"],
      contentNotice: "Decomposed from NHS.UK's published confusion guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. NHS.UK treats ANY sudden new confusion as an emergency (no self-care/urgent-only middle tier exists in the source) - this protocol has no self-care tier as a result, matching the source's own binary framing. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Sexual Assault or Rape - https://www.nhs.uk/live-well/sexual-health/help-after-rape-and-sexual-assault/ (reviewed 2024-11-06)
  // ------------------------------------------------------------------
  {
    id: "oscg-sexual-assault-rape",
    titleEn: "Sexual Assault or Rape",
    clinicalDefinitionEn: "Support and care pathway after rape or sexual assault, decomposed from NHS.UK's published guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "sexual assault", weight: 100 },
      { phrase: "rape", weight: 100 },
      { phrase: "assaulted", weight: 80 },
      { phrase: "sexually attacked", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-assault-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the caller safe right now?" },
      { id: "oscg-assault-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long ago did this happen?" },
      { id: "oscg-assault-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Are there any injuries needing medical attention?" }
    ],
    questions: [
      {
        id: "oscg-assault-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the caller in immediate danger, has uncontrolled bleeding or a serious injury, or is the assault still occurring?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the NHS.UK guidance itself - immediate danger or serious physical injury requires emergency care and, where safe, police involvement first.",
        redFlag: true,
        keywords: ["immediate danger", "serious injury", "assault occurring now"],
        careAdviceIds: ["oscg-assault-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-assault-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Did this happen recently (within the last few days), and has the caller not yet had medical care, evidence collection, or considered pregnancy/STI risk?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends prompt medical care for any injuries and risk of pregnancy/STIs, and notes forensic evidence collection is time-sensitive (best within 7 days, though still worth asking about beyond that). Reporting to police is the caller's choice, not required.",
        redFlag: false,
        keywords: ["recent assault", "needs medical care", "evidence collection"],
        careAdviceIds: ["oscg-assault-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      },
      {
        id: "oscg-assault-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the caller safe and not in urgent physical danger, but seeking support or wanting to know their options?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: it was not your fault, and support is available regardless of when the assault happened or whether it's reported to police.",
        redFlag: false,
        keywords: ["seeking support", "wants information"],
        careAdviceIds: ["oscg-assault-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-assault-emergency-advice", titleEn: "Emergency safety and injury precautions", instructionTextEn: "Help the caller reach a safe location if possible and arrange emergency transport for any injuries. Reporting to police is the caller's choice.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["ongoing danger", "worsening injury"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-assault-urgent-advice", titleEn: "Urgent medical and forensic care", instructionTextEn: "Connect the caller with your organization's local sexual assault support/medical service for injury care, pregnancy/STI risk assessment, and forensic examination if desired. If possible, gently advise not washing or changing clothes beforehand, while making clear this is entirely the caller's choice and evidence can still be collected afterward regardless.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new injury symptoms", "caller's safety changes"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true },
      { id: "oscg-assault-routine-advice", titleEn: "Ongoing support", instructionTextEn: "Reassure the caller this was not their fault. Connect them with your organization's local support service for counseling and follow-up options, at their own pace.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["caller's safety or wellbeing changes"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-11-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Help after rape and sexual assault\", https://www.nhs.uk/live-well/sexual-health/help-after-rape-and-sexual-assault/ (page last reviewed 06 November 2024)"],
      contentNotice: "Decomposed from NHS.UK's published guidance on help after rape and sexual assault (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. UK-specific service names are NOT included - the host organization MUST insert real, locally-applicable sexual assault support service contact information before production use. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, with particular attention given the safety and trauma sensitivity of this topic."
    })
  },

  // ------------------------------------------------------------------
  // 3. Bluish Skin or Body Part (Cyanosis) - https://www.nhs.uk/conditions/shortness-of-breath/ (reviewed 2024-01-30)
  // ------------------------------------------------------------------
  {
    id: "oscg-cyanosis",
    titleEn: "Bluish Skin or Body Part (Cyanosis)",
    clinicalDefinitionEn: "Bluish skin/lips (cyanosis) assessment decomposed from NHS.UK's published emergency guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "blue lips", weight: 100 },
      { phrase: "bluish skin", weight: 100 },
      { phrase: "turning blue", weight: 95 },
      { phrase: "cyanosis", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-cyanosis-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Which part of the body looks blue, grey, or very pale (lips, face, fingers)?" },
      { id: "oscg-cyanosis-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did this start?" },
      { id: "oscg-cyanosis-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any breathing difficulty or chest pain right now?" }
    ],
    questions: [
      {
        id: "oscg-cyanosis-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips or skin turning very pale, blue, or grey (on brown or black skin, this may be easier to see on the palms of the hands)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance lists this as a call-999 sign for both adults and children. Do not drive to A&E - call an ambulance or have someone else drive.",
        redFlag: true,
        keywords: ["blue lips", "grey skin", "pale palms"],
        careAdviceIds: ["oscg-cyanosis-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cyanosis-emergency-advice", titleEn: "Emergency cyanosis precautions", instructionTextEn: "Do not drive to A&E yourself - call an ambulance or have someone else drive. Keep the person as calm and still as possible while waiting.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening color change", "loss of consciousness", "stops breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Shortness of breath\", https://www.nhs.uk/conditions/shortness-of-breath/ (page last reviewed 30 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published shortness of breath guidance's cyanosis warning sign (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Cyanosis is treated by the source as an unconditional emergency sign - this protocol has a single Emergency-tier question and no other tiers, matching that framing rather than inventing a false self-care pathway. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Hair Loss - https://www.nhs.uk/conditions/hair-loss/ (reviewed 2024-01-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-hair-loss",
    titleEn: "Hair Loss",
    clinicalDefinitionEn: "Hair loss assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "hair loss", weight: 100 },
      { phrase: "losing hair", weight: 90 },
      { phrase: "losing a lot of hair", weight: 100 },
      { phrase: "lot of hair", weight: 90 },
      { phrase: "balding", weight: 75 },
      { phrase: "thinning hair", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hairloss-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the hair loss been happening?" },
      { id: "oscg-hairloss-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Is it patchy, all over, or a receding pattern?" },
      { id: "oscg-hairloss-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any scalp redness, pain, or other new symptoms?" }
    ],
    questions: [
      {
        id: "oscg-hairloss-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. related to a serious underlying illness)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the hair loss guidance itself - the source has no emergency criteria of its own since hair loss is essentially never an emergency, but this screen protects against a rare underlying serious cause being missed.",
        redFlag: true,
        keywords: ["life threatening"],
        careAdviceIds: ["oscg-hairloss-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hairloss-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is the caller worried about the hair loss and would like it assessed?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP if you're worried about your hair loss, to identify the cause before considering commercial hair clinic options.",
        redFlag: false,
        keywords: ["worried about hair loss"],
        careAdviceIds: ["oscg-hairloss-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hairloss-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["underlying condition worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hairloss-routine-advice", titleEn: "Routine hair loss follow-up", instructionTextEn: "Book a routine GP appointment to discuss the cause of hair loss and available treatment options. Losing 50-100 hairs a day is normal.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["hair loss accelerates suddenly", "affects wellbeing significantly"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-24", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hair loss\", https://www.nhs.uk/conditions/hair-loss/ (page last reviewed 24 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published hair loss guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Hallucinations - https://www.nhs.uk/conditions/psychosis/ (reviewed 2023-09-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-hallucinations",
    titleEn: "Hallucinations",
    clinicalDefinitionEn: "Hallucinations/psychosis assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "hallucinations", weight: 100 },
      { phrase: "seeing things", weight: 85 },
      { phrase: "hearing voices", weight: 90 },
      { phrase: "psychosis", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-halluc-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did this start?" },
      { id: "oscg-halluc-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person a danger to themselves or others right now?" },
      { id: "oscg-halluc-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any recent drug or alcohol use, fever, or head injury?" }
    ],
    questions: [
      {
        id: "oscg-halluc-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person severely distressed, at risk of harming themselves or others, or refusing to go to A&E when they urgently need to?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK psychosis guidance: for a crisis where someone is at risk, take them to A&E if they agree, contact their GP or out-of-hours GP, or call 999 for an ambulance.",
        redFlag: true,
        keywords: ["danger to self or others", "severe distress"],
        careAdviceIds: ["oscg-halluc-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-halluc-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Are hallucinations (seeing or hearing things that aren't there) present now, without immediate danger?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: see a GP immediately if experiencing symptoms of psychosis, since early treatment can be more effective.",
        redFlag: false,
        keywords: ["seeing or hearing things"],
        careAdviceIds: ["oscg-halluc-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 78,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-halluc-emergency-advice", titleEn: "Emergency mental health precautions", instructionTextEn: "Stay with the person if safe to do so and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["risk of harm increases", "person becomes unreachable"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-halluc-urgent-advice", titleEn: "Urgent psychosis evaluation", instructionTextEn: "Arrange prompt medical evaluation - early treatment for psychosis symptoms is more effective. Contact your organization's local mental health service.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "risk of harm develops"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-09-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Psychosis\", https://www.nhs.uk/conditions/psychosis/ (page last reviewed 05 September 2023)"],
      contentNotice: "Decomposed from NHS.UK's published psychosis guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Muscle Jerks - Tics - Shudders - https://www.nhs.uk/conditions/tics/ (reviewed 2023-04-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-muscle-jerks-tics",
    titleEn: "Muscle Jerks - Tics - Shudders",
    clinicalDefinitionEn: "Tics/muscle jerks assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "tics", weight: 100 },
      { phrase: "muscle jerks", weight: 95 },
      { phrase: "twitching", weight: 85 },
      { phrase: "shuddering", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-tics-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has this been happening?" },
      { id: "oscg-tics-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person fully alert and responsive during these episodes (as opposed to losing consciousness)?" },
      { id: "oscg-tics-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe the movements." }
    ],
    questions: [
      {
        id: "oscg-tics-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the person lose consciousness, become unresponsive, or have jerking that involves the whole body with loss of awareness (suggesting a seizure rather than a tic)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the tics guidance itself - a true seizure (loss of consciousness/awareness) is a different, more urgent condition than a tic and must be ruled out first; the source page does not address this distinction.",
        redFlag: true,
        keywords: ["loss of consciousness", "unresponsive during jerks", "whole body seizure"],
        careAdviceIds: ["oscg-tics-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-tics-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Do the tics occur very regularly or are becoming more frequent/severe, cause social or emotional problems, cause pain or accidental injury, interfere with daily activities, or come with anger, depression, or self-harm?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons to see a GP about tics.",
        redFlag: false,
        keywords: ["frequent tics", "tics affecting daily life", "tics with distress"],
        careAdviceIds: ["oscg-tics-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-tics-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are the tics mild and not causing problems, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: tics are not usually serious and don't damage the brain; mild tics without problems may not need GP evaluation.",
        redFlag: false,
        keywords: ["mild tics", "no problems from tics"],
        careAdviceIds: ["oscg-tics-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-tics-emergency-advice", titleEn: "Emergency seizure precautions", instructionTextEn: "Protect the person from injury, do not restrain them, time the episode, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["episode continues beyond a few minutes", "difficulty breathing after"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-tics-routine-advice", titleEn: "Routine tic follow-up", instructionTextEn: "Book a routine GP appointment to discuss the tics and their impact.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["tics worsen or new symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-tics-selfcare-advice", titleEn: "Reassurance for mild tics", instructionTextEn: "Mild tics are common and usually not serious. Continue to monitor and see a GP if they become more frequent, severe, or start causing problems.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["tics become more frequent or severe", "start causing pain, injury, or distress"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Tics\", https://www.nhs.uk/conditions/tics/ (page last reviewed 05 April 2023)"],
      contentNotice: "Decomposed from NHS.UK's published tics guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source does not distinguish tics from seizures - the emergency screen here (loss of consciousness/whole-body seizure) is added specifically for that distinction, a standard tele-triage safety practice, not part of the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Pale Skin - https://www.nhs.uk/conditions/iron-deficiency-anaemia/ (reviewed 2024-01-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-pale-skin",
    titleEn: "Pale Skin",
    clinicalDefinitionEn: "Pale skin/possible anemia assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "pale skin", weight: 100 },
      { phrase: "looking pale", weight: 90 },
      { phrase: "skin looking", weight: 85 },
      { phrase: "very pale", weight: 85 },
      { phrase: "anemia", weight: 80 },
      { phrase: "washed out", weight: 60 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-pale-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the paleness been noticed?" },
      { id: "oscg-pale-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any tiredness, shortness of breath, or heart palpitations?" },
      { id: "oscg-pale-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any recent illness, bleeding, or dizziness?" }
    ],
    questions: [
      {
        id: "oscg-pale-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the pale skin, is the person cold and clammy, too weak to stand, breathing very fast, or does the pulse feel very rapid or weak (signs of shock)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the anemia guidance itself (not part of the source) - sudden pallor with signs of shock suggests significant blood loss or another acute cause requiring immediate emergency care.",
        redFlag: true,
        keywords: ["shock signs", "cold clammy pale", "weak rapid pulse"],
        careAdviceIds: ["oscg-pale-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-pale-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is there ongoing pale skin along with tiredness, shortness of breath, or heart palpitations, without the emergency features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP if iron deficiency anemia is suspected - pale skin, tiredness, shortness of breath, and palpitations are common symptoms.",
        redFlag: false,
        keywords: ["pale skin with tiredness", "possible anemia"],
        careAdviceIds: ["oscg-pale-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pale-emergency-advice", titleEn: "Emergency shock precautions", instructionTextEn: "Lie the person down with legs raised if possible, keep them warm, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening weakness", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pale-routine-advice", titleEn: "Routine anemia follow-up", instructionTextEn: "Book a routine GP appointment to check for iron deficiency anemia with a blood test.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "shortness of breath increases"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Iron deficiency anaemia\", https://www.nhs.uk/conditions/iron-deficiency-anaemia/ (page last reviewed 26 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published iron deficiency anaemia guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source has no emergency/shock criteria - the emergency screen here is added specifically for that, a standard tele-triage safety practice, not part of the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Poisoning - https://www.nhs.uk/conditions/poisoning/ (reviewed 2025-06-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-poisoning",
    titleEn: "Poisoning",
    clinicalDefinitionEn: "Suspected poisoning assessment decomposed from NHS.UK's published emergency guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "poisoning", weight: 100 },
      { phrase: "swallowed something harmful", weight: 95 },
      { phrase: "ingested chemical", weight: 85 },
      { phrase: "accidental poisoning", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-poison-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was swallowed, touched, or breathed in?" },
      { id: "oscg-poison-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did this happen?" },
      { id: "oscg-poison-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the packaging or container available?" }
    ],
    questions: [
      {
        id: "oscg-poison-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has the person possibly swallowed, touched, or breathed in something harmful, lost consciousness, stopped breathing, had severe breathing difficulty, is choking/gasping, or had a seizure?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK poisoning guidance lists these as call-999/A&E criteria. Do not try to make the person sick - they could choke. Start CPR if unresponsive and not breathing; place in recovery position if unconscious but breathing.",
        redFlag: true,
        keywords: ["swallowed harmful substance", "unconscious poisoning", "stopped breathing", "seizure"],
        careAdviceIds: ["oscg-poison-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-poison-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the caller unsure whether the substance swallowed, touched, or breathed in is harmful?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 when unsure if a substance is harmful.",
        redFlag: false,
        keywords: ["unsure if harmful", "unknown substance"],
        careAdviceIds: ["oscg-poison-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-poison-emergency-advice", titleEn: "Emergency poisoning precautions", instructionTextEn: "Do not try to make the person sick. Find the packaging or container and bring it to hospital if possible. If unresponsive and not breathing, start CPR; if unconscious but breathing, place in the recovery position. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-poison-urgent-advice", titleEn: "Urgent poisoning advice", instructionTextEn: "Keep the substance or packaging available for reference and arrange urgent advice on whether further care is needed.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["any new symptoms develop", "breathing difficulty starts"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-06-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Poisoning\", https://www.nhs.uk/conditions/poisoning/ (page last reviewed 12 June 2025)"],
      contentNotice: "Decomposed from NHS.UK's published poisoning guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Rash - Widespread On Drugs - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-rash-widespread-drugs",
    titleEn: "Rash - Widespread On Drugs",
    clinicalDefinitionEn: "Suspected medication-related widespread rash assessment decomposed from NHS.UK's published rash emergency guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "rash from medication", weight: 100 },
      { phrase: "drug rash", weight: 95 },
      { phrase: "allergic rash", weight: 85 },
      { phrase: "widespread rash", weight: 80 },
      { phrase: "rash after antibiotic", weight: 95 },
      { phrase: "rash after starting", weight: 90 },
      { phrase: "new antibiotic", weight: 70 },
      { phrase: "rash all over", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-drugrash-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What medication was started or changed recently?" },
      { id: "oscg-drugrash-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the rash start relative to the medication?" },
      { id: "oscg-drugrash-iaq3", sequence: 3, responseType: "LOCATION", promptTextEn: "Where is the rash, and how widespread is it?" }
    ],
    questions: [
      {
        id: "oscg-drugrash-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden swelling of the lips, mouth, throat, or tongue, a tight throat or difficulty swallowing, difficulty breathing, or a rash that looks like small bruises or bleeding under the skin and does not fade when pressed with a glass?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK rash guidance lists sudden allergic-reaction swelling/breathing difficulty and a non-fading rash (possible meningococcal sepsis) as call-999 criteria.",
        redFlag: true,
        keywords: ["swollen throat", "non-fading rash", "difficulty breathing with rash"],
        careAdviceIds: ["oscg-drugrash-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-drugrash-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a widespread rash that started soon after a new or changed medication, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A rash appearing soon after starting a new medication warrants prompt review to assess whether the medication should be stopped, even without the source's own listed emergency signs.",
        redFlag: false,
        keywords: ["rash after new medication", "possible drug reaction"],
        careAdviceIds: ["oscg-drugrash-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-drugrash-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Arrange emergency transport immediately. Bring the medication packaging if possible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening swelling", "breathing difficulty increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-drugrash-urgent-advice", titleEn: "Urgent medication rash review", instructionTextEn: "Do not stop the medication without medical advice unless instructed. Arrange same-day review with the prescriber or urgent care to assess the rash and medication.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["rash spreads or worsens", "swelling or breathing changes develop"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\", https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "Decomposed from NHS.UK's general rash emergency warning signs (allergic reaction, non-fading rash) applied to a medication-reaction context (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source page does not have a dedicated drug-rash section - the emergency criteria are general rash red flags, and the urgent tier is this protocol's own reasonable extension, documented as such. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Weight Loss - Unintended - https://www.nhs.uk/conditions/unintentional-weight-loss/ (reviewed 2025-07-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-weight-loss-unintended",
    titleEn: "Weight Loss - Unintended",
    clinicalDefinitionEn: "Unintentional weight loss assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "unexplained weight loss", weight: 100 },
      { phrase: "losing weight without trying", weight: 95 },
      { phrase: "unintended weight loss", weight: 90 },
      { phrase: "lost a lot of weight", weight: 95 },
      { phrase: "lost weight", weight: 85 },
      { phrase: "without trying to diet", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-weightloss-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the weight loss been happening?" },
      { id: "oscg-weightloss-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any change in diet or exercise that could explain it?" },
      { id: "oscg-weightloss-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any other new symptoms alongside the weight loss?" }
    ],
    questions: [
      {
        id: "oscg-weightloss-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. severe dehydration, inability to keep any food or fluids down, or another acute red flag)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the weight loss guidance itself - the source has no emergency criteria of its own since unexplained weight loss is a gradual-onset concern, but acute red flags must still be ruled out.",
        redFlag: true,
        keywords: ["life threatening", "severe dehydration"],
        careAdviceIds: ["oscg-weightloss-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-weightloss-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the caller kept losing weight without changing diet or exercise, especially with other new symptoms?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP as soon as possible if there is weight loss and other symptoms - the earlier the cause is found, the sooner it can be treated; weight loss without trying should always be checked.",
        redFlag: false,
        keywords: ["weight loss no diet change", "unexplained weight loss with symptoms"],
        careAdviceIds: ["oscg-weightloss-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-weightloss-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["underlying condition worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-weightloss-routine-advice", titleEn: "Routine weight loss follow-up", instructionTextEn: "Book a prompt GP appointment to investigate the cause of unexplained weight loss.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop", "weight loss accelerates"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-07-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Unintentional weight loss\", https://www.nhs.uk/conditions/unintentional-weight-loss/ (page last reviewed 28 July 2025)"],
      contentNotice: "Decomposed from NHS.UK's published unintentional weight loss guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
