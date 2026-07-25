import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

export const addChildSafeguardingUatBranches = (
  protocol: ProtocolInput
): ProtocolInput => {
  const emergencyAdviceId = `${protocol.id}-child-safeguarding-emergency-advice`;
  const urgentAdviceId = `${protocol.id}-child-safeguarding-urgent-advice`;
  const nextAssessmentSequence = Math.max(
    0,
    ...(protocol.initialAssessmentQuestions ?? []).map(
      (question) => question.sequence
    )
  ) + 1;

  return {
    ...protocol,
    initialAssessmentQuestions: [
      ...(protocol.initialAssessmentQuestions ?? []),
      {
        id: `${protocol.id}-iaq-child-private-safety`,
        sequence: nextAssessmentSequence,
        responseType: "YES_NO",
        promptTextEn:
          "If the patient is under 18, can they speak privately now, is the accompanying caregiver considered safe, and is there an approved safe callback method if contact is lost?"
      }
    ],
    questions: [
      {
        id: `${protocol.id}-q-child-safeguarding-emergency`,
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "If the patient is under 18, is harm occurring now, is there immediate danger from an accompanying or suspected caregiver, could the child be returned now to an unsafe person or place, or did contact end while an immediate threat remained unresolved?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Immediate danger, ongoing harm, an imminent unsafe return, or loss of contact during an unresolved immediate threat requires emergency action. Qatar 999 is the verified emergency route. Exact child-protection reporting, consent, documentation, and information-sharing requirements are GOVERNANCE_REQUIRED.",
        redFlag: true,
        keywords: [
          "child immediate danger",
          "harm occurring now",
          "unsafe caregiver",
          "unsafe return",
          "disconnect during immediate threat"
        ],
        careAdviceIds: [emergencyAdviceId],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: `${protocol.id}-q-child-safeguarding-urgent`,
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "If the patient is under 18 and there is no confirmed immediate danger, are they unable to speak privately, is caregiver safety uncertain, or is there another safeguarding concern requiring trained assessment?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "An inability to obtain a private history, uncertainty about caregiver safety, or another safeguarding concern needs prompt trained assessment without automatically treating it as a confirmed emergency. The exact Qatar safeguarding pathway is GOVERNANCE_REQUIRED.",
        redFlag: true,
        keywords: [
          "child cannot speak privately",
          "caregiver safety uncertain",
          "safeguarding concern",
          "safe callback"
        ],
        careAdviceIds: [urgentAdviceId],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 2
      },
      ...protocol.questions.map((question, index) => ({
        ...question,
        acuityOrder: question.acuityOrder + 2,
        questionOrder: (question.questionOrder ?? index + 1) + 2
      }))
    ],
    careAdvice: [
      {
        id: emergencyAdviceId,
        titleEn: "Immediate child safeguarding danger",
        instructionTextEn:
          "Call Qatar 999 now when immediate danger or ongoing harm is suspected. If contact continues, confirm the child's current location and a safe way to communicate without alerting or confronting a suspected unsafe caregiver. If contact is lost, use only the approved safe callback method and follow the governance-approved emergency escalation process. Do not promise confidentiality. Exact Qatar child-protection reporting, consent, documentation, and information-sharing rules are GOVERNANCE_REQUIRED.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: [
          "harm occurring now or immediate danger",
          "imminent return to an unsafe person or place",
          "contact lost while an immediate threat remains unresolved"
        ],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      },
      {
        id: urgentAdviceId,
        titleEn: "Urgent private child safeguarding assessment",
        instructionTextEn:
          "Keep questions neutral and seek a private conversation only when it is safe. Do not disclose sensitive information to a caregiver whose safety is uncertain, do not confront or alert a suspected unsafe person, and do not promise confidentiality. Arrange prompt in-person assessment through the governance-approved Qatar child safeguarding pathway and record only an approved safe callback method. If immediate danger emerges or contact is lost during an unresolved immediate threat, use the emergency branch and call Qatar 999. Exact reporting, consent, documentation, and information-sharing rules are GOVERNANCE_REQUIRED.",
        dispositionCode: "HMC_URGENT_REVIEW",
        warningSigns: [
          "private history cannot be obtained safely",
          "caregiver safety remains uncertain",
          "new immediate danger or loss of contact"
        ],
        displayOrder: 2,
        adviceCategory: "DISPOSITION"
      },
      ...(protocol.careAdvice ?? []).map((advice, index) => ({
        ...advice,
        displayOrder: (advice.displayOrder ?? index + 1) + 2
      }))
    ],
    provenance: protocol.provenance
      ? {
          ...protocol.provenance,
          contentNotice: `${protocol.provenance.contentNotice} Child private-speech, caregiver-safety, immediate-danger, safe-callback, and disconnect handling is included for UAT structure validation only. Exact Qatar child-protection reporting, consent, documentation, information-sharing, and non-emergency referral routes are GOVERNANCE_REQUIRED.`
        }
      : undefined
  };
};

const buildBatch09UatProvenance = (
  input: Parameters<typeof buildGuidelineProvenance>[0]
) => buildGuidelineProvenance({
  ...input,
  contentNotice: `${input.contentNotice} UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Exact Qatar routes, medication/dose eligibility, pediatric handling, pregnancy/postpartum handling, immunocompromise, safeguarding, and escalation details are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval.`
});

/**
 * Batch 09 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Nausea reuses the Diarrhoea and vomiting source already cited in
 * batch06. Lip Swelling reuses the allergic-reaction criteria already
 * established for Face Swelling/Anaphylaxis. Meningitis Exposure combines
 * the real symptom-emergency criteria from the Meningitis page with a
 * documented, honest inference for the exposure/contact-prophylaxis angle,
 * which the source page itself does not cover.
 */
const batch09ProtocolDefinitions: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Meningitis Exposure - https://www.nhs.uk/conditions/meningitis/ (reviewed 2026-06-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-meningitis-exposure",
    titleEn: "Meningitis Exposure",
    clinicalDefinitionEn: "UAT-only adult and pediatric pathway for reported exposure to meningitis or invasive meningococcal disease, separating symptomatic medical emergencies from asymptomatic contact assessment by Qatar public health and clinicians.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "meningitis exposure", weight: 100 },
      { phrase: "exposed to meningitis", weight: 100 },
      { phrase: "contact with meningitis", weight: 90 },
      { phrase: "someone i know has meningitis", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-meningexp-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What diagnosis or organism was confirmed or suspected in the index case, by which facility/public-health team, and when did symptoms and effective treatment start?" },
      { id: "oscg-meningexp-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What exact contact occurred and when: same household/room, kissing, shared mouth items, direct exposure to saliva or respiratory secretions, childcare/dormitory contact, or unprotected airway procedure?" },
      { id: "oscg-meningexp-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the exposed person now have fever or temperature instability, severe headache, neck stiffness, light sensitivity, vomiting, confusion, unusual sleepiness, seizure, severe limb/joint pain, cold hands/feet, fast breathing, mottled skin, or a rash that does not fade with pressure?" },
      { id: "oscg-meningexp-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "For an infant or child, is there poor feeding, abnormal cry, irritability, reduced activity, difficult waking, floppy or stiff body, bulging soft spot, breathing change, pale/mottled colour, or caregiver concern that the child is seriously unwell?" },
      { id: "oscg-meningexp-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "What is the person's age, vaccination history if known, pregnancy status, immune/spleen/complement condition, medicines, allergies, and whether public health or the treating facility has already contacted them?" },
      { id: "oscg-meningexp-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For an adolescent, was exposure in a school, dormitory, military/team or social setting, and is private or safeguarding-sensitive information needed to identify saliva/respiratory contact accurately?" }
    ],
    questions: [
      {
        id: "oscg-meningexp-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is the exposed person now seriously unwell or rapidly worsening, with fever or temperature instability, severe headache, stiff neck/light sensitivity, confusion/difficult waking, seizure, repeated vomiting, fast or difficult breathing, cold or mottled limbs, non-fading rash, or infant/child danger signs?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Meningitis and meningococcal sepsis can progress rapidly; symptoms may occur in any order and a rash, fever or classic neck stiffness may be absent. Infants often show nonspecific behavioural and feeding changes. Exposure history, vaccination or prophylaxis does not lower the emergency floor.",
        redFlag: true,
        keywords: ["stiff neck light sensitivity", "non fading rash", "confused after meningitis exposure"],
        careAdviceIds: ["oscg-meningexp-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-meningexp-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person currently asymptomatic but may have had close contact with a confirmed or suspected meningococcal or other public-health-relevant meningitis case?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "Close-contact definitions and prophylaxis depend on the organism, timing, nature of exposure, local susceptibility and public-health investigation. CDC and WHO support prompt chemoprophylaxis assessment for close contacts of invasive meningococcal disease, but this telephone pathway must not decide eligibility or prescribe a regimen.",
        redFlag: false,
        keywords: ["close contact meningitis case", "prophylaxis needed"],
        careAdviceIds: ["oscg-meningexp-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-meningexp-emergency-advice", titleEn: "Qatar suspected meningitis emergency response", instructionTextEn: "Call Qatar emergency services on 999 now and do not allow self-driving. Do not wait for a rash or for every classic symptom. Keep the person supervised and follow the 999 call-taker. If drowsy, seizing, vomiting or unable to swallow safely, give nothing by mouth. Do not give leftover antibiotics or delay transport to contact the exposed person's clinic.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion or difficult waking", "seizure", "breathing change", "non-fading rash", "rapid deterioration"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-meningexp-urgent-advice", titleEn: "Prompt Qatar contact and public-health assessment", instructionTextEn: "Promptly contact the approved Qatar communicable-disease/public-health or treating-facility pathway. Provide the index diagnosis, exposure details, dates, age, pregnancy, immune status, allergies and medicines. Do not share cups, utensils, toothbrushes, vapes or items contaminated with saliva, and use careful hand hygiene. Do not take another person's or leftover antibiotic and do not assume vaccination removes the need for assessment. Prophylaxis drug, dose, route, timing, pregnancy/age suitability, vaccination and notification are GOVERNANCE_REQUIRED decisions.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever or severe headache", "neck stiffness or light sensitivity", "vomiting or unusual sleepiness", "rash or mottled skin", "infant feeds poorly or behaves abnormally"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-06-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Meningitis\", https://www.nhs.uk/conditions/meningitis/ (page reviewed 12 June 2026)",
        "WHO, \"Meningitis\" fact sheet (accessed 2026-07-25)",
        "CDC, \"Clinical Overview of Meningococcal Disease\" and \"Meningococcal Disease - Infection Control\" (accessed 2026-07-25)"
      ],
      contentNotice:
        "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric exposure workflow draft. Any compatible serious illness routes to 999; asymptomatic exposure requires prompt organism- and contact-specific public-health assessment without telephone prescribing. GOVERNANCE_REQUIRED for Qatar close-contact definitions, notification, prophylaxis and vaccine protocols, age/pregnancy/immunocompromise selection, adolescent privacy, occupational exposure and non-emergency destinations. Blocked from nurse UAT pending Qatar emergency, infectious-disease, pediatric, obstetric, occupational-health, pharmacy and public-health approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 2. Motor Vehicle Accident - https://www.nhs.uk/conditions/whiplash/ (reviewed 2023-01-03) + general trauma screen
  // ------------------------------------------------------------------
  {
    id: "oscg-motor-vehicle-accident",
    titleEn: "Motor Vehicle Accident",
    clinicalDefinitionEn: "Post-motor-vehicle-accident triage entry point, decomposed from NHS.UK's published whiplash guidance plus general trauma screening.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "car accident", weight: 100 },
      { phrase: "motor vehicle accident", weight: 100 },
      { phrase: "was in a crash", weight: 90 },
      { phrase: "just had a car crash", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mva-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, anticoagulated, intoxicated, or medically vulnerable, and what happened (impact, restraint, ejection, rollover, pedestrian/cyclist, helmet)? Include child/vulnerable-person safeguarding concerns." },
      { id: "oscg-mva-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did this happen?" },
      { id: "oscg-mva-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are being noticed now?" }
    ],
    questions: [
      {
        id: "oscg-mva-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there any loss of consciousness, severe bleeding, chest pain, severe difficulty breathing, inability to move a limb, severe abdominal pain, or numbness/weakness/pins and needles on one or both sides of the body?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Universal post-trauma emergency screen added ahead of any specific injury guidance - a motor vehicle accident can cause many types of serious injury simultaneously, so this general screen comes first before considering neck-specific (whiplash) or other single-body-part guidance.",
        redFlag: true,
        keywords: ["unconscious after crash", "chest pain after accident", "cant move limb after crash"],
        careAdviceIds: ["oscg-mva-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-mva-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Is there severe neck or back pain despite pain relief, tingling or pins and needles on one or both sides, problems walking or sitting upright, or a sudden electric-shock feeling in the neck, back, arms, or legs?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK whiplash guidance lists these as reasons for an urgent GP appointment or 111 call - possible nerve involvement.",
        redFlag: false,
        keywords: ["severe neck pain after crash", "pins and needles after accident"],
        careAdviceIds: ["oscg-mva-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-mva-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild soreness or stiffness (typical whiplash) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: continue everyday activities as able and use paracetamol/ibuprofen - resting the neck for long periods does not help recovery.",
        redFlag: false,
        keywords: ["mild soreness after accident", "typical whiplash"],
        careAdviceIds: ["oscg-mva-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mva-emergency-advice", titleEn: "Qatar emergency collision response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Keep the person still in the position found unless there is immediate danger, breathing must be supported, or 999 directs movement. Do not remove a helmet, twist the spine, or make them stand/walk. Control severe external bleeding with direct pressure without removing embedded objects. If unresponsive and not breathing normally, follow 999 CPR instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening symptoms", "loss of consciousness or abnormal breathing", "weakness, numbness, severe bleeding, chest/abdominal pain, or pregnancy concern"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mva-urgent-advice", titleEn: "Urgent post-accident review", instructionTextEn: "Arrange same-day medical review for possible nerve involvement.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness spreads", "weakness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mva-selfcare-advice", titleEn: "Governed care after a minor collision", instructionTextEn: "Use gentle activity only as tolerated and avoid driving, hazardous work, sport, or forced neck movement while symptomatic. Do not use a collar unless prescribed. Medicine choice/dose requires age, weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulants, and current medicines under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "numbness, weakness, confusion, vomiting, chest/abdominal pain, or breathing change"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Whiplash\", https://www.nhs.uk/conditions/whiplash/ (page last reviewed 03 January 2023)"],
      contentNotice:
        "Decomposed from NHS.UK's published whiplash guidance for the urgent/self-care tiers, with a general post-trauma emergency screen added ahead of it (standard tele-triage practice for any motor vehicle accident, not part of the whiplash source itself, since accidents can cause injuries far beyond the neck). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Menstrual Cramps - https://www.nhs.uk/conditions/period-pain/ (reviewed 2026-03-18)
  // ------------------------------------------------------------------
  {
    id: "oscg-menstrual-cramps",
    titleEn: "Menstrual Cramps",
    clinicalDefinitionEn: "Period pain assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "period pain", weight: 100 },
      { phrase: "menstrual cramps", weight: 100 },
      { phrase: "bad cramps", weight: 80 },
      { phrase: "period cramps", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-cramps-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age, pregnancy possibility, menstrual/sexual history appropriate to consent and privacy, and pain onset/location/severity? For an adolescent, use approved confidential assessment, caregiver, sexual-health, and safeguarding procedures." },
      { id: "oscg-cramps-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have painkillers already been tried?" },
      { id: "oscg-cramps-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any bleeding between periods, or pain during sex or urination?" }
    ],
    questions: [
      {
        id: "oscg-cramps-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the pelvic or period pain severe or worse than usual, and have painkillers not helped?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: call 111 or get an urgent GP appointment for severe pain unrelieved by painkillers.",
        redFlag: false,
        keywords: ["severe period pain", "painkillers not helping cramps"],
        careAdviceIds: ["oscg-cramps-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-cramps-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have periods become more painful, heavier, or irregular, is pain preventing daily functioning, does pain occur during sex or urination, is there bleeding between periods, or a swollen abdomen with weight/appetite changes?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["heavier periods", "bleeding between periods", "pain during sex"],
        careAdviceIds: ["oscg-cramps-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-cramps-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical period pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides comfort measures and pain relief for typical period pain.",
        redFlag: false,
        keywords: ["typical period pain"],
        careAdviceIds: ["oscg-cramps-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cramps-urgent-advice", titleEn: "Urgent period pain review", instructionTextEn: "Arrange same-day medical review for severe pain unrelieved by painkillers.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cramps-routine-advice", titleEn: "Routine period pain follow-up", instructionTextEn: "Book a GP appointment to discuss these symptoms - may involve anti-inflammatory medication or hormonal treatment options.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-cramps-selfcare-advice", titleEn: "Governed care for familiar period pain", instructionTextEn: "Use gentle warmth without direct high heat, rest or light activity as tolerated, and maintain usual fluids. Pain medicine requires exact age/weight, pregnancy possibility, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulants, asthma history, and current-medicine checks under the approved Qatar pathway. Do not assume pelvic pain is menstrual when symptoms are new or atypical.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain becomes sudden, severe, one-sided, or different", "fainting, fever, vomiting, pregnancy possibility, or heavy bleeding"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-18", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Period pain\", https://www.nhs.uk/conditions/period-pain/ (page last reviewed 18 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published period pain guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Menstrual Period - Missed or Late - https://www.nhs.uk/conditions/stopped-or-missed-periods/ (reviewed 2026-06-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-missed-period",
    titleEn: "Menstrual Period - Missed or Late",
    clinicalDefinitionEn: "Missed or late period assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "missed period", weight: 100 },
      { phrase: "late period", weight: 95 },
      { phrase: "period hasnt come", weight: 85 },
      { phrase: "havent had my period", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-missedperiod-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age, how many periods were missed, and could pregnancy be possible? For an adolescent, ask privately with consent, confidentiality-limit, caregiver, sexual-health, coercion/abuse, and safeguarding procedures approved for Qatar." },
      { id: "oscg-missedperiod-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Could the caller be pregnant?" },
      { id: "oscg-missedperiod-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any other new symptoms (weight change, hair growth, tiredness, skin changes)?" }
    ],
    questions: [
      {
        id: "oscg-missedperiod-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe abdominal pain along with a missed period and possible pregnancy (suggesting a possible ectopic pregnancy)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the missed-periods guidance itself (not part of the source) - severe pain with a possible pregnancy needs emergency evaluation to rule out ectopic pregnancy.",
        redFlag: true,
        keywords: ["severe pain missed period pregnant", "possible ectopic"],
        careAdviceIds: ["oscg-missedperiod-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-missedperiod-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have periods been missed 3 times in a row, have periods not started by age 15, is there a missed period with weight change/tiredness/facial hair growth/skin changes, or have periods become irregular?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends seeing a GP for these situations.",
        redFlag: false,
        keywords: ["periods missed three times", "periods irregular"],
        careAdviceIds: ["oscg-missedperiod-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-missedperiod-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a single missed or late period with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: common causes include pregnancy, stress, weight changes, exercise, hormonal contraception, and breastfeeding - a home pregnancy test is a reasonable first step if pregnancy is possible.",
        redFlag: false,
        keywords: ["single missed period"],
        careAdviceIds: ["oscg-missedperiod-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-missedperiod-emergency-advice", titleEn: "Qatar emergency possible-pregnancy response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for severe or one-sided abdominal/pelvic pain, shoulder-tip pain, heavy bleeding, faintness/collapse, marked weakness, or pregnancy with acute illness. Keep the person resting; do not give food, drink, or unprescribed medicine if surgery may be needed or consciousness is impaired. A negative or unavailable home test does not safely exclude ectopic pregnancy.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening or one-sided pain", "shoulder-tip pain, heavy bleeding, fainting, dizziness, or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-missedperiod-routine-advice", titleEn: "Routine missed period follow-up", instructionTextEn: "Book a GP appointment to investigate the cause of missed or irregular periods.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-missedperiod-selfcare-advice", titleEn: "Home guidance for a single missed period", instructionTextEn: "A home pregnancy test is a reasonable first step if pregnancy is possible. Common causes include stress, weight changes, exercise, hormonal contraception, and breastfeeding.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["periods remain missed for 3 months", "new symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-06-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Stopped or missed periods\", https://www.nhs.uk/conditions/stopped-or-missed-periods/ (page last reviewed 12 June 2026)"],
      contentNotice: "Decomposed from NHS.UK's published missed periods guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The emergency (possible ectopic pregnancy) tier is a standard tele-triage safety practice, not part of the source page itself. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Motion Sickness - https://www.nhs.uk/conditions/motion-sickness/ (reviewed 2023-06-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-motion-sickness",
    titleEn: "Motion Sickness",
    clinicalDefinitionEn: "Motion sickness assessment decomposed from NHS.UK's published guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "motion sickness", weight: 100 },
      { phrase: "travel sickness", weight: 95 },
      { phrase: "car sick", weight: 85 },
      { phrase: "sea sick", weight: 85 },
      { phrase: "sick from the boat", weight: 95 },
      { phrase: "dizzy from the boat", weight: 95 },
      { phrase: "queasy on a boat", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-motionsick-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, what travel triggered symptoms, and are symptoms typical and limited to travel? Ask about medicines, neurological/ear symptoms, dehydration, poisoning, injury, and driving/aviation duties." },
      { id: "oscg-motionsick-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this lasted?" },
      { id: "oscg-motionsick-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person able to keep fluids down?" }
    ],
    questions: [
      {
        id: "oscg-motionsick-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. severe dehydration or symptoms unrelated to travel)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the motion sickness guidance itself - motion sickness is not itself an emergency, but persistent vomiting could cause dehydration or mask another condition.",
        redFlag: true,
        keywords: ["life threatening", "severe dehydration"],
        careAdviceIds: ["oscg-motionsick-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-motionsick-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this typical motion sickness with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides prevention and self-care measures for typical motion sickness.",
        redFlag: false,
        keywords: ["typical motion sickness"],
        careAdviceIds: ["oscg-motionsick-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-motionsick-emergency-advice", titleEn: "Qatar emergency vomiting/dizziness response", instructionTextEn: "Stop travel safely and call Qatar emergency services on 999; do not drive when symptoms include reduced consciousness, seizure, stroke signs, severe headache, chest pain, abnormal breathing, severe dehydration, blood/green vomit, major injury, or suspected poisoning. Do not give oral medicine or fluids if drowsy or unsafe to swallow.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["confusion, seizure, neurological change, or collapse", "severe dehydration or inability to keep fluids down", "blood/green vomit or severe pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-motionsick-selfcare-advice", titleEn: "Governed motion-sickness prevention", instructionTextEn: "If safe, look toward the horizon, get fresh air, avoid reading/screens, and take breaks. Medicine, patches, and complementary products require age/weight, pregnancy/breastfeeding, glaucoma/urinary/cardiac conditions, sedation, driving/aviation duties, and current-medicine checks under the approved Qatar pathway; no age cutoff or product is authorized by this UAT content.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["unable to keep fluids down", "symptoms persist after travel or are unlike prior motion sickness"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Motion sickness\", https://www.nhs.uk/conditions/motion-sickness/ (page last reviewed 19 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published motion sickness guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Mouth Ulcers - https://www.nhs.uk/conditions/mouth-ulcers/ (reviewed 2024-03-11)
  // ------------------------------------------------------------------
  {
    id: "oscg-mouth-ulcers",
    titleEn: "Mouth Ulcers",
    clinicalDefinitionEn: "Mouth ulcer assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "mouth ulcer", weight: 100 },
      { phrase: "canker sore", weight: 90 },
      { phrase: "sore in my mouth", weight: 80 },
      { phrase: "ulcer on my tongue", weight: 80 },
      { phrase: "ulcer in my cheek", weight: 100 },
      { phrase: "ulcer on my cheek", weight: 100 },
      { phrase: "hurts to eat", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mouthulcer-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant or immunocompromised, how long has the lesion been present, and is there fever, dehydration, weight loss, trauma, tobacco/betel use, medicine exposure, eye/genital lesions, or safeguarding concern?" },
      { id: "oscg-mouthulcer-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How large is it, and is it painful?" },
      { id: "oscg-mouthulcer-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any ulcers elsewhere on the body or joint pain?" }
    ],
    questions: [
      {
        id: "oscg-mouthulcer-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Has the ulcer lasted longer than 3 weeks, is it unusually large or near the throat, is it bleeding or becoming more painful and red, or are there ulcers elsewhere on the body with joint symptoms?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends seeing a GP or dentist for these features - prolonged ulcers can occasionally indicate a more serious condition.",
        redFlag: false,
        keywords: ["mouth ulcer three weeks", "large mouth ulcer", "bleeding mouth ulcer"],
        careAdviceIds: ["oscg-mouthulcer-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-mouthulcer-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical, recent mouth ulcer with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: mouth ulcers are common and should clear up on their own within 1-2 weeks.",
        redFlag: false,
        keywords: ["typical mouth ulcer"],
        careAdviceIds: ["oscg-mouthulcer-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mouthulcer-routine-advice", titleEn: "Routine mouth ulcer follow-up", instructionTextEn: "Book a GP or dentist appointment for these features.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["ulcer grows or bleeds more"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-mouthulcer-selfcare-advice", titleEn: "Governed care for a minor mouth ulcer", instructionTextEn: "Use a soft toothbrush, cool soft foods/fluids if swallowing safely, and avoid irritating spicy, salty, acidic, or rough foods. Mouthwash, analgesic gel/spray, steroid lozenge, and salt-rinse advice require exact age, pregnancy/breastfeeding, allergy, swallowing safety, medical conditions, and current-medicine checks under the approved Qatar pathway. Do not apply aspirin to the ulcer.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["lasts longer than 3 weeks", "becomes larger, more painful, recurrent, or associated with fever, dehydration, weight loss, eye/genital lesions, or immunocompromise"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-03-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Mouth ulcers\", https://www.nhs.uk/conditions/mouth-ulcers/ (page last reviewed 11 March 2024)"],
      contentNotice: "Decomposed from NHS.UK's published mouth ulcers guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Nasal Allergies (Hay Fever) - https://www.nhs.uk/conditions/hay-fever/ (reviewed 2024-03-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-hay-fever",
    titleEn: "Nasal Allergies (Hay Fever)",
    clinicalDefinitionEn: "Hay fever / nasal allergy assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "hay fever", weight: 100 },
      { phrase: "nasal allergies", weight: 95 },
      { phrase: "sneezing and runny nose", weight: 80 },
      { phrase: "seasonal allergies", weight: 85 },
      { phrase: "sneezing nonstop", weight: 100 },
      { phrase: "allergies acting up", weight: 90 },
      { phrase: "hay fever season", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hayfever-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/breastfeeding, immunocompromised, asthmatic, or in a safety-critical driving/aviation role, and how long have symptoms lasted? Confirm no anaphylaxis, serious asthma, infection, eye pain, or visual change." },
      { id: "oscg-hayfever-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have pharmacy treatments been tried?" },
      { id: "oscg-hayfever-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any breathing difficulty or wheeze?" }
    ],
    questions: [
      {
        id: "oscg-hayfever-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden swelling of the lips, mouth, throat, or tongue, or severe difficulty breathing?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the hay fever guidance itself - typical hay fever does not cause airway swelling or severe breathing difficulty, so these signs suggest a different, more serious allergic reaction.",
        redFlag: true,
        keywords: ["swollen throat with allergies", "severe breathing difficulty allergies"],
        careAdviceIds: ["oscg-hayfever-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hayfever-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Are symptoms getting worse, or have pharmacy medicines not improved them?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a doctor if symptoms are worsening or pharmacy treatments haven't helped - may be referred for immunotherapy.",
        redFlag: false,
        keywords: ["hay fever worsening", "pharmacy treatment not working allergies"],
        careAdviceIds: ["oscg-hayfever-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-hayfever-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical hay fever with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can recommend antihistamines and steroid nasal sprays for typical hay fever.",
        redFlag: false,
        keywords: ["typical hay fever"],
        careAdviceIds: ["oscg-hayfever-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hayfever-emergency-advice", titleEn: "Qatar emergency allergy response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for lip/mouth/throat/tongue swelling, breathing/swallowing difficulty, faintness, confusion, floppiness, or collapse. Use the person's prescribed adrenaline auto-injector immediately according to its instructions and emergency plan; antihistamine must not delay adrenaline or 999.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing or swallowing worsens", "swelling spreads", "faintness, floppiness, confusion, or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hayfever-routine-advice", titleEn: "Routine hay fever follow-up", instructionTextEn: "Book a GP appointment if symptoms worsen or pharmacy treatments aren't helping.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms significantly worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-hayfever-selfcare-advice", titleEn: "Governed hay-fever care", instructionTextEn: "Reduce pollen exposure with closed windows when counts are high, shower/change after outdoor exposure, and use wraparound glasses. Antihistamine, eye-drop, and nasal-spray selection/dose require age/weight, pregnancy/breastfeeding, asthma, glaucoma/urinary/cardiac conditions, sedation and driving/aviation duties, technique, and current-medicine checks under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms worsen despite treatment", "wheeze, asthma deterioration, facial swelling, eye pain, or visual change"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-03-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Hay fever\", https://www.nhs.uk/conditions/hay-fever/ (page last reviewed 21 March 2024)"],
      contentNotice: "Decomposed from NHS.UK's published hay fever guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Nausea - https://www.nhs.uk/conditions/diarrhoea/ (reviewed 2023-12-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-nausea",
    titleEn: "Nausea",
    clinicalDefinitionEn: "Nausea assessment decomposed from NHS.UK's published diarrhoea and vomiting guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "nausea", weight: 100 },
      { phrase: "feel sick", weight: 85 },
      { phrase: "feeling nauseous", weight: 95 },
      { phrase: "queasy", weight: 75 },
      { phrase: "really nauseous", weight: 100 },
      { phrase: "nauseous since this morning", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-nausea-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, and when did nausea start? Ask about vomiting, pain, chest/neurological symptoms, hydration/urine, diabetes/ketones, medicines/substances, poisoning, infection, and child safeguarding." },
      { id: "oscg-nausea-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any vomiting?" },
      { id: "oscg-nausea-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Able to keep fluids down?" }
    ],
    questions: [
      {
        id: "oscg-nausea-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there vomit that looks like blood or ground coffee, green vomit, a stiff neck with light sensitivity, a sudden severe headache or tummy ache, blue/grey/pale skin, severe breathing difficulty, or confusion?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK diarrhoea and vomiting guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["vomit like blood", "confused with nausea", "severe headache with nausea"],
        careAdviceIds: ["oscg-nausea-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-nausea-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person unable to keep fluids down, or has vomiting lasted more than 2 days?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["cant keep fluids down", "vomiting more than 2 days"],
        careAdviceIds: ["oscg-nausea-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-nausea-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild nausea with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: rest and small sips of fluid usually help mild nausea, which typically settles within a day or two.",
        redFlag: false,
        keywords: ["mild nausea"],
        careAdviceIds: ["oscg-nausea-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-nausea-emergency-advice", titleEn: "Qatar emergency nausea-associated response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for chest pain, severe abdominal/head pain, abnormal breathing, confusion, fainting, seizure, stroke signs, blood/coffee-ground or green vomit, major bleeding, poisoning, pregnancy emergency features, or severe dehydration. Do not give food, drink, or oral medicine if drowsy, repeatedly vomiting, or unsafe to swallow.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["confusion, collapse, seizure, or breathing difficulty", "blood/green vomit or severe pain", "very little urine, marked weakness, or inability to keep fluids down"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-nausea-urgent-advice", titleEn: "Urgent nausea review", instructionTextEn: "Arrange same-day medical review, especially if fluids cannot be kept down.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["signs of dehydration worsen"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-nausea-selfcare-advice", titleEn: "Home care for mild nausea", instructionTextEn: "Rest, sip fluids slowly, avoid fatty or spicy food, and eat small, plain meals when able.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["vomiting develops", "unable to keep fluids down"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Diarrhoea and vomiting\", https://www.nhs.uk/conditions/diarrhoea/ (page last reviewed 21 December 2023)"],
      contentNotice: "Decomposed from NHS.UK's published diarrhoea and vomiting guidance's nausea-relevant criteria (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Lip Swelling - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-lip-swelling",
    titleEn: "Lip Swelling",
    clinicalDefinitionEn: "UAT-only adult and pediatric lip-swelling pathway screening for anaphylaxis or airway angioedema, including medicine-associated swelling, before evaluating trauma, infection and localized causes in person.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "lip swelling", weight: 100 },
      { phrase: "lips are swollen", weight: 95 },
      { phrase: "swollen lips", weight: 95 },
      { phrase: "lips puffed up", weight: 80 },
      { phrase: "lips got really puffy", weight: 100 },
      { phrase: "puffy and swollen", weight: 90 },
      { phrase: "swollen after lunch", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-lipswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "What exact time did swelling begin, was onset sudden, and is it spreading or recurring?" },
      { id: "oscg-lipswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there tongue, mouth, throat, face or neck swelling; hoarse/changed voice; drooling; throat tightness; trouble swallowing; wheeze/noisy or difficult breathing; faintness; collapse; confusion; widespread hives; or repeated vomiting?" },
      { id: "oscg-lipswelling-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Was there a food, medicine/dose change, ACE-inhibitor blood-pressure medicine, insect sting, latex/chemical/cosmetic exposure, dental procedure, or previous angioedema/anaphylaxis?" },
      { id: "oscg-lipswelling-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Was there lip/face trauma, burn, bite or dental injury; or is swelling hot, red, very painful, draining pus, associated with fever, spreading facial swelling, mouth ulcers or tooth pain?" },
      { id: "oscg-lipswelling-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "What is the age, weight if a child, pregnancy/postpartum status, prescribed allergy action plan/auto-injector, medicines and allergies, immune status, and history of hereditary angioedema?" },
      { id: "oscg-lipswelling-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For an infant or child, is there abnormal cry/voice, drooling, feeding difficulty, breathing change, unusual sleepiness, pale/blue colour, or rapid worsening?" }
    ],
    questions: [
      {
        id: "oscg-lipswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is swelling spreading to the tongue, mouth, throat, face or neck, or is there voice change, drooling, throat tightness, swallowing difficulty, wheeze/noisy or difficult breathing, faintness/collapse, confusion, blue/grey/pale colour, widespread hives with systemic symptoms, or rapid worsening in an infant or child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These may indicate anaphylaxis or airway angioedema. Angioedema can occur without hives and may be associated with an ACE inhibitor even after long-term use; airway symptoms require immediate 999 response.",
        redFlag: true,
        keywords: ["swollen throat with lips", "struggling to breathe lip swelling"],
        careAdviceIds: ["oscg-lipswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-lipswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no airway or systemic emergency feature, is there new or recurrent isolated lip swelling, ACE-inhibitor or other medicine exposure, local trauma/burn, fever/redness/pus or dental/facial infection, or swelling in a baby or child?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Isolated swelling can progress or represent medicine-associated angioedema, hereditary angioedema, trauma, burn or infection. It requires same-day clinician assessment rather than telephone diagnosis.",
        redFlag: false,
        keywords: ["lip swelling no breathing problem"],
        careAdviceIds: ["oscg-lipswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lipswelling-emergency-advice", titleEn: "Qatar anaphylaxis or airway-angioedema response", instructionTextEn: "Call Qatar emergency services on 999 now and do not allow self-driving. If the patient has their own prescribed adrenaline auto-injector and action plan, help use it immediately as labelled and tell 999; follow the call-taker for repeat dosing. Lay the person flat with legs raised if tolerated, on the left side if pregnant, or allow sitting with legs extended if breathing is difficult; do not let them stand or walk. If unconscious but breathing use the recovery position; start CPR if not breathing normally. Give nothing by mouth when swallowing or consciousness is impaired.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing or voice", "tongue/throat swelling", "fainting or collapse", "reduced consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lipswelling-urgent-advice", titleEn: "Same-day in-person lip-swelling assessment", instructionTextEn: "Arrange same-day in-person assessment through an approved Qatar adult or pediatric pathway and keep the patient supervised for progression. Avoid only a clearly identified trigger when safe. Report all medicines and the last ACE-inhibitor dose; do not independently restart, stop or substitute prescribed medicine—the assessing clinician must direct the next dose. Do not give unprescribed antihistamine or steroids as a substitute for 999/adrenaline in anaphylaxis. Call 999 for tongue/throat spread, voice/swallowing/breathing change, faintness, systemic symptoms or rapid worsening. Exact non-emergency allergy, hereditary-angioedema, dental, infection and trauma destinations are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing, voice or swallowing difficulty", "tongue/throat swelling", "faintness or vomiting", "swelling spreads", "fever, redness or pus"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Angioedema\", https://www.nhs.uk/conditions/angioedema/ (accessed 2026-07-25)",
        "NHS.UK, \"Anaphylaxis\", https://www.nhs.uk/conditions/anaphylaxis/ (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric lip-swelling workflow draft. Airway/tongue/throat involvement, anaphylaxis or systemic deterioration routes to 999; isolated swelling requires same-day assessment for medicine-associated, hereditary, allergic, traumatic, dental and infectious causes. GOVERNANCE_REQUIRED for Qatar anaphylaxis positioning and adrenaline policy, ACE-inhibitor/medicine changes, pregnancy, infant/pediatric observation, hereditary-angioedema, allergy, dental/infection/trauma destinations and transport. Blocked from nurse UAT pending Qatar emergency, adult, pediatric, allergy/immunology, pharmacy, dental and ENT approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 10. Lymph Nodes - Swollen - https://www.nhs.uk/conditions/swollen-glands/ (reviewed 2023-09-29)
  // ------------------------------------------------------------------
  {
    id: "oscg-swollen-lymph-nodes",
    titleEn: "Lymph Nodes - Swollen",
    clinicalDefinitionEn: "Swollen glands / lymph nodes assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "swollen glands", weight: 100 },
      { phrase: "swollen lymph nodes", weight: 100 },
      { phrase: "swollen glands in neck", weight: 90 },
      { phrase: "lump in neck", weight: 75 },
      { phrase: "swollen lump in my neck", weight: 100 },
      { phrase: "neck lump wont go away", weight: 100 },
      { phrase: "lump that wont go away", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-lymphnode-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant or immunocompromised, where/how many nodes are enlarged, and are they tender, hard/fixed, rapidly growing, or above the collarbone? Ask about infection, fever/night sweats, weight loss, bruising, medicines, animal exposure, and safeguarding." },
      { id: "oscg-lymphnode-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long have they been swollen?" },
      { id: "oscg-lymphnode-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any night sweats, high fever, or other illness signs?" }
    ],
    questions: [
      {
        id: "oscg-lymphnode-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there difficulty swallowing or breathing alongside the swollen glands?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK swollen glands guidance: seek immediate 111/urgent help for swallowing or breathing difficulty alongside swollen glands.",
        redFlag: false,
        keywords: ["swollen glands difficulty swallowing", "swollen glands breathing problem"],
        careAdviceIds: ["oscg-lymphnode-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      },
      {
        id: "oscg-lymphnode-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Are the glands getting bigger or have they not gone down within 1 week, do they feel hard or not move when pressed, is there night sweats or a very high temperature, are they present with no other signs of illness, or are they just above/below the collarbone?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these features.",
        redFlag: false,
        keywords: ["swollen glands not going down", "hard swollen glands", "night sweats"],
        careAdviceIds: ["oscg-lymphnode-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-lymphnode-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical swollen glands alongside a cold or minor infection, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: most swollen glands are due to common infections and resolve on their own within 1-2 weeks.",
        redFlag: false,
        keywords: ["typical swollen glands with cold"],
        careAdviceIds: ["oscg-lymphnode-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lymphnode-urgent-advice", titleEn: "Urgent swollen glands review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing or swallowing worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lymphnode-routine-advice", titleEn: "Routine swollen glands follow-up", instructionTextEn: "Book a GP appointment for these features.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["glands continue growing", "new symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-lymphnode-selfcare-advice", titleEn: "Governed supportive care for swollen nodes", instructionTextEn: "Rest and maintain usual fluids if not restricted. Do not squeeze or repeatedly manipulate the node. Pain medicine requires age/weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulants, and current-medicine checks under the approved Qatar pathway; do not give aspirin to a child. Persistent, hard/fixed, supraclavicular, rapidly enlarging, generalized, or systemic presentations need in-person assessment.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving, enlarging, hard/fixed, or above the collarbone", "fever, night sweats, weight loss, bruising, breathing/swallowing difficulty, or immunocompromise"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-09-29", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch09UatProvenance({
      sourceDocuments: ["NHS.UK, \"Swollen glands\", https://www.nhs.uk/conditions/swollen-glands/ (page last reviewed 29 September 2023)"],
      contentNotice: "Decomposed from NHS.UK's published swollen glands guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];

const batch09ChildSafeguardingProtocolIds = new Set([
  "oscg-motor-vehicle-accident"
]);

export const batch09Protocols: ProtocolInput[] =
  batch09ProtocolDefinitions.map((protocol) =>
    batch09ChildSafeguardingProtocolIds.has(protocol.id)
      ? addChildSafeguardingUatBranches(protocol)
      : protocol
  );
