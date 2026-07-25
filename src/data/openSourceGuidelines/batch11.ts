import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

const buildBatch11UatProvenance = (
  input: Parameters<typeof buildGuidelineProvenance>[0]
) => buildGuidelineProvenance({
  ...input,
  contentNotice: `${input.contentNotice} UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Exact Qatar routes, medication and dose eligibility, pediatric handling, pregnancy/postpartum handling, safeguarding, and escalation details are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval.`
});

/**
 * Batch 11 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Back Injury reuses Whiplash; Shoulder Injury generalizes the
 * broken-arm-or-wrist criteria (same pattern as Finger Injury in batch10).
 * Rash - Purple Spots or Dots, Rash or Redness - Widespread, and Rash or
 * Redness - Localized all reuse the same NHS.UK rash emergency criteria
 * already cited for Rash - Widespread On Drugs (batch04) and Lip Swelling/
 * Face Swelling (batch07/09) - each pulls a different subset for its own
 * framing. Ring Stuck on Finger or Toe uses standard, non-NHS-specific
 * first-aid technique (documented as general first-aid knowledge, not a
 * single-source quote), the same pattern already used for Choking (batch05).
 */
export const batch11Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Back Injury - https://www.nhs.uk/conditions/whiplash/ (reviewed 2023-01-03), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-back-injury",
    titleEn: "Back Injury",
    clinicalDefinitionEn: "Back injury (trauma) assessment decomposed from NHS.UK's published whiplash guidance, generalized to the back.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "back injury", weight: 100 },
      { phrase: "hurt my back", weight: 90 },
      { phrase: "fell on my back", weight: 90 },
      { phrase: "injured my back", weight: 90 },
      { phrase: "landed on my back", weight: 100 },
      { phrase: "fell off a ladder", weight: 90 },
      { phrase: "landed hard on my back", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-backinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, and exactly how did the injury happen? If the history, developmental ability, or injury pattern is inconsistent, follow the approved safeguarding pathway without confronting a possible perpetrator." },
      { id: "oscg-backinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-backinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any numbness, tingling, or weakness in the legs?" }
    ],
    questions: [
      {
        id: "oscg-backinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there numbness, tingling, or weakness in one or both legs, loss of feeling around the genitals or back passage, new problems controlling bladder or bowel, or did the injury happen from a serious accident like a car crash or fall from height?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal spinal-injury emergency screen (consistent with NHS.UK back pain guidance's own cauda equina criteria) added ahead of the whiplash-style guidance below - possible spinal cord or cauda equina injury needs immediate emergency care.",
        redFlag: true,
        keywords: ["leg numbness after back injury", "loss of bladder control after fall", "serious accident back"],
        careAdviceIds: ["oscg-backinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-backinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Is there severe pain despite paracetamol or ibuprofen, tingling or pins and needles on one or both sides of the body, problems walking or sitting upright, or a sudden electric-shock feeling in the back or legs?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK whiplash-pattern guidance lists these as reasons for urgent clinical review - possible nerve involvement, applicable to back injuries generally.",
        redFlag: false,
        keywords: ["severe back pain after injury", "pins and needles after back injury"],
        careAdviceIds: ["oscg-backinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-backinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild soreness or stiffness with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: continue everyday activities as able and use paracetamol/ibuprofen - prolonged rest does not help recovery.",
        redFlag: false,
        keywords: ["mild back soreness after injury"],
        careAdviceIds: ["oscg-backinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-backinjury-emergency-advice", titleEn: "Qatar emergency back-injury precautions", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Keep the person still in the position found unless there is immediate danger, breathing must be supported, or 999 directs movement. Do not twist, sit up, stand, or walk a person with possible spinal injury. If unresponsive and not breathing normally, start age-appropriate CPR as directed by 999.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening leg weakness", "new loss of bladder or bowel control", "reduced consciousness or abnormal breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-backinjury-urgent-advice", titleEn: "Urgent back injury review", instructionTextEn: "Arrange same-day medical review for possible nerve involvement.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness spreads", "weakness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-backinjury-selfcare-advice", titleEn: "Governed care for a mild back injury", instructionTextEn: "Use relative rest and gentle activity only as tolerated. Medicine choice and dose require age, weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulant, and current-medicine checks under the approved Qatar pathway; do not give aspirin to a child. Escalate immediately for weakness, numbness, saddle sensory loss, bladder/bowel change, worsening pain, breathing symptoms, or inability to mobilize.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "numbness or weakness develops", "bladder or bowel change"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["NHS.UK, \"Whiplash\", https://www.nhs.uk/conditions/whiplash/ (page last reviewed 03 January 2023), generalized to back injuries broadly"],
      contentNotice: "Decomposed from NHS.UK's published whiplash guidance, generalized from neck to back injuries (same nerve-involvement criteria apply), with an added cauda-equina/spinal-cord emergency screen (standard tele-triage safety practice, consistent with NHS.UK's own back pain page criteria used elsewhere in this corpus). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Chest Injury - https://www.nhs.uk/conditions/broken-or-bruised-ribs/ (reviewed 2024-01-10)
  // ------------------------------------------------------------------
  {
    id: "oscg-chest-injury",
    titleEn: "Chest Injury",
    clinicalDefinitionEn: "Chest injury (broken or bruised ribs) assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "chest injury", weight: 100 },
      { phrase: "hurt my ribs", weight: 90 },
      { phrase: "broken rib", weight: 95 },
      { phrase: "bruised ribs", weight: 90 },
      { phrase: "hit in the chest", weight: 100 },
      { phrase: "ribs are sore and bruised", weight: 100 },
      { phrase: "ribs bruised", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-chestinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, taking an anticoagulant, or medically fragile, and exactly how did the injury happen? For a child or vulnerable person, follow the approved safeguarding pathway if the account or injury pattern is inconsistent." },
      { id: "oscg-chestinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-chestinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any shortness of breath?" }
    ],
    questions: [
      {
        id: "oscg-chestinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Was this caused by a serious accident such as a car accident, is shortness of breath getting worse, is chest pain getting worse, is there pain in the tummy or shoulder, or is the person coughing up blood?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken/bruised ribs guidance lists these as emergency-assessment criteria - could mean a rib has damaged the lung, liver, or spleen.",
        redFlag: true,
        keywords: ["worsening breathlessness rib injury", "worsening chest pain injury", "coughing blood rib injury"],
        careAdviceIds: ["oscg-chestinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-chestinjury-q1-child-safeguarding",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "For a child or vulnerable person, is the explanation absent, unsuitable, inconsistent with the injury or developmental ability, is there delay in seeking help, might the caregiver be unsafe, or can the patient not be offered a safe opportunity to speak privately?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "NICE child-maltreatment guidance identifies unsuitable or inconsistent explanations and caregiver obstruction of private discussion as safeguarding alerts. Exact Qatar reporting, destination, confidentiality, and disconnect actions remain GOVERNANCE_REQUIRED.",
        redFlag: true,
        keywords: ["child chest injury safeguarding", "inconsistent injury explanation", "unsafe caregiver"],
        careAdviceIds: ["oscg-chestinjury-safeguarding-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-chestinjury-q1-urgent",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Has the pain not improved within a few weeks, is there yellow or green mucus when coughing, or a very high temperature or feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent clinical review for these features - may need stronger pain relief or antibiotics for a chest infection.",
        redFlag: false,
        keywords: ["rib pain not improving", "chest infection after rib injury"],
        careAdviceIds: ["oscg-chestinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-chestinjury-q2-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this mild pain or bruising with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: broken/bruised ribs usually get better on their own within 2-6 weeks with self-care.",
        redFlag: false,
        keywords: ["mild rib bruising"],
        careAdviceIds: ["oscg-chestinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-chestinjury-emergency-advice", titleEn: "Qatar emergency chest-injury precautions", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Keep the person still in the position that makes breathing easiest; do not tightly wrap or bind the chest and do not give food, drink, or unprescribed medicine. Control an open wound with a clean dressing without sealing or pressing on an embedded object. If unresponsive and not breathing normally, start age-appropriate CPR as directed by 999.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "increasing pain", "coughing blood", "faintness, confusion, or abnormal colour"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-chestinjury-safeguarding-advice", titleEn: "Child chest-injury safeguarding response", instructionTextEn: "Arrange urgent in-person clinical and safeguarding assessment through the Qatar governance-approved pathway. Offer the child a safe opportunity to speak privately when clinically and developmentally appropriate; do not rely on or disclose the plan to a caregiver who may be unsafe. Do not confront a suspected abuser. If the child is in immediate danger, has life-threatening injury, or contact is lost before safety is established, use 999 and the approved emergency handover or welfare-check procedure. Exact reporting, consent, confidentiality, documentation, destination, and disconnect actions remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["immediate danger or unsafe caregiver", "new breathing difficulty, collapse, or severe pain", "caller disconnects before safety is established"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-chestinjury-urgent-advice", titleEn: "Urgent chest injury review", instructionTextEn: "Arrange same-day medical review through the approved Qatar pathway for possible chest infection or additional pain relief.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing worsens", "fever develops"], displayOrder: 3, adviceCategory: "DISPOSITION" },
      { id: "oscg-chestinjury-selfcare-advice", titleEn: "Governed care for a minor chest injury", instructionTextEn: "Only when injury and safeguarding concerns are absent, do not bind the chest. Rest from provoking activity but change position and breathe normally; support the sore area with a pillow when coughing. A wrapped cool pack may be used briefly without direct skin contact. Medicine choice and dose require age, weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulant, and current-medicine checks under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["breathing difficulty develops", "pain worsens", "fever, coloured sputum, faintness, or coughing blood", "safeguarding concern develops"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: [
        "NHS.UK, \"Broken or bruised ribs\", https://www.nhs.uk/conditions/broken-or-bruised-ribs/ (page last reviewed 10 January 2024)",
        "NICE, \"Child maltreatment: when to suspect maltreatment in under 18s\", https://www.nice.org.uk/guidance/cg89/chapter/recommendations",
        "NICE, \"Child abuse and neglect\", https://www.nice.org.uk/guidance/ng76/chapter/recommendations"
      ],
      contentNotice: "Decomposed from NHS.UK's published broken/bruised ribs guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Shoulder Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/ (reviewed 2023-05-26), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-shoulder-injury",
    titleEn: "Shoulder Injury",
    clinicalDefinitionEn: "Shoulder injury assessment decomposed from NHS.UK's published broken arm/wrist guidance, generalized to the shoulder.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "shoulder injury", weight: 100 },
      { phrase: "hurt my shoulder", weight: 90 },
      { phrase: "dislocated shoulder", weight: 95 },
      { phrase: "shoulder popped out", weight: 90 },
      { phrase: "fell on my shoulder", weight: 100 },
      { phrase: "shoulder looks out of place", weight: 100 },
      { phrase: "might be dislocated", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-shoulderinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, and exactly how did the injury happen? For a child or vulnerable person, follow the approved safeguarding pathway if the account or injury pattern is inconsistent." },
      { id: "oscg-shoulderinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-shoulderinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the arm be moved at the shoulder?" }
    ],
    questions: [
      {
        id: "oscg-shoulderinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the arm or shoulder numb, tingling, or has pins and needles, is there a bad open wound, or has the shoulder changed shape or is at an odd angle (suggesting dislocation)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK fracture guidance (broken arm/wrist) lists these as emergency-assessment criteria - the same principles apply to shoulder injury and dislocation.",
        redFlag: true,
        keywords: ["numb shoulder after injury", "shoulder deformed", "shoulder dislocation signs"],
        careAdviceIds: ["oscg-shoulderinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-shoulderinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there severe pain or inability to use the arm, worsening swelling or bruising, or a high temperature/feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent clinical review for these features.",
        redFlag: false,
        keywords: ["severe shoulder pain", "cannot use arm shoulder injury"],
        careAdviceIds: ["oscg-shoulderinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-shoulderinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild pain or bruising with the arm still usable and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides sling, ice, and pain-relief first-aid steps for a mild extremity injury.",
        redFlag: false,
        keywords: ["mild shoulder pain"],
        careAdviceIds: ["oscg-shoulderinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-shoulderinjury-emergency-advice", titleEn: "Qatar emergency shoulder-injury precautions", instructionTextEn: "Call Qatar emergency services on 999 and do not drive after major trauma, severe bleeding, threatened circulation, or an unresponsive/unwell patient. Support the arm in the position found; do not pull, straighten, or attempt relocation. Apply firm pressure around, not onto, an embedded object. Remove rings or watches only if easily done before swelling increases.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening numbness", "cold, pale, blue, or pulseless hand", "increasing bleeding", "reduced consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-shoulderinjury-urgent-advice", titleEn: "Urgent shoulder injury review", instructionTextEn: "Support the arm with a sling, apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "new numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-shoulderinjury-selfcare-advice", titleEn: "Governed care for a mild shoulder injury", instructionTextEn: "Support the arm comfortably and use a wrapped cool pack briefly without direct skin contact. Do not force movement or attempt relocation. Medicine choice and dose require age, weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulant, and current-medicine checks under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "new numbness or inability to use the arm", "hand becomes cold, pale, or blue"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\", https://www.nhs.uk/conditions/broken-arm-or-wrist/ (page last reviewed 26 May 2023) - generalized to shoulder injuries using the same fracture red-flag criteria"],
      contentNotice: "Decomposed from NHS.UK's published broken arm/wrist guidance, explicitly generalized to the shoulder (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Rash - Purple Spots or Dots - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-rash-purple-spots",
    titleEn: "Rash - Purple Spots or Dots",
    clinicalDefinitionEn: "Non-fading (petechial/purpuric) rash assessment decomposed from NHS.UK's published emergency rash guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "purple spots", weight: 100 },
      { phrase: "purple dots on skin", weight: 95 },
      { phrase: "rash that doesnt fade", weight: 100 },
      { phrase: "non blanching rash", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-purplerash-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the rash?" },
      { id: "oscg-purplerash-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it appear?" },
      { id: "oscg-purplerash-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured?" }
    ],
    questions: [
      {
        id: "oscg-purplerash-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the rash look like small bruises or bleeding under the skin, and does it NOT fade when you press a glass against it?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance lists a non-fading rash as an emergency warning sign, since it can indicate meningococcal septicaemia - do not wait to see if other symptoms develop.",
        redFlag: true,
        keywords: ["rash doesnt fade with glass test", "purple bruise like rash"],
        careAdviceIds: ["oscg-purplerash-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-purplerash-q1-routine",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the rash fade when pressed with a glass, with no fever or feeling unwell?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A fading purple rash without fever is less concerning, but should still be reviewed to determine the cause (e.g. bruising, a blood-clotting issue, or a medication side effect).",
        redFlag: false,
        keywords: ["fading purple rash"],
        careAdviceIds: ["oscg-purplerash-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-purplerash-emergency-advice", titleEn: "Qatar emergency non-fading-rash precautions", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Do not wait for fever or other symptoms and do not rely on a camera or glass test to rule out serious illness. Keep the person with you, note recent medicines, infection symptoms, bleeding, and pregnancy status, and follow 999 instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever or abnormal temperature", "person becomes unwell, drowsy, confused, or difficult to wake", "abnormal breathing or colour", "new bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-purplerash-routine-advice", titleEn: "Urgent purple-rash review", instructionTextEn: "Arrange prompt same-day in-person review through the Qatar route approved by governance to assess bruising, bleeding, medicine effects, infection, and hematologic causes. Call 999 if spots do not fade, the person becomes unwell, or there is abnormal bleeding.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["rash spreads or stops fading when pressed", "fever or abnormal bleeding develops"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\" (non-fading rash warning sign), https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "Decomposed from NHS.UK's published non-fading rash warning sign, applicable to all ages despite the source page's child-focused title (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Rash or Redness - Widespread - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-rash-widespread",
    titleEn: "Rash or Redness - Widespread",
    clinicalDefinitionEn: "Widespread rash or redness assessment decomposed from NHS.UK's published emergency rash guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "rash all over my body", weight: 100 },
      { phrase: "widespread rash", weight: 95 },
      { phrase: "redness all over", weight: 85 },
      { phrase: "rash spreading", weight: 85 },
      { phrase: "rash all over my whole body", weight: 100 },
      { phrase: "spreading fast", weight: 90 },
      { phrase: "broke out in a rash", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-widerash-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the rash been present?" },
      { id: "oscg-widerash-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/breastfeeding or immunocompromised, and was there a new medicine, food, product, bite/sting, infection, or close contact?" },
      { id: "oscg-widerash-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever or feeling generally unwell?" }
    ],
    questions: [
      {
        id: "oscg-widerash-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there sudden swelling of the lips, mouth, throat, or tongue, difficulty breathing, or does the rash look like small bruises or bleeding under the skin that does not fade when pressed with a glass?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK rash guidance lists sudden allergic-reaction swelling/breathing difficulty and a non-fading rash as emergency criteria.",
        redFlag: true,
        keywords: ["swollen throat with rash", "non fading widespread rash"],
        careAdviceIds: ["oscg-widerash-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-widerash-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the rash spreading, accompanied by fever, or is the cause unclear and concerning?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A spreading rash with fever, or an unexplained cause, warrants primary-care review to identify the underlying condition.",
        redFlag: false,
        keywords: ["spreading rash with fever", "unexplained widespread rash"],
        careAdviceIds: ["oscg-widerash-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-widerash-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild, non-spreading rash with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides general skin self-care measures for a mild rash.",
        redFlag: false,
        keywords: ["mild widespread rash"],
        careAdviceIds: ["oscg-widerash-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-widerash-emergency-advice", titleEn: "Qatar emergency widespread-rash response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. If anaphylaxis is suspected, use the person's prescribed adrenaline auto-injector immediately according to its instructions and emergency plan; do not substitute antihistamine for adrenaline. Keep the person lying flat unless breathing is easier sitting up or they are vomiting; a pregnant person should lie on the left side. If unresponsive and not breathing normally, start age-appropriate CPR as directed by 999. A non-fading rash or serious illness also needs 999 even without allergy symptoms.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["airway swelling or breathing difficulty", "faintness, confusion, floppiness, or loss of consciousness", "non-fading rash", "rapidly worsening illness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-widerash-routine-advice", titleEn: "Urgent widespread-rash review", instructionTextEn: "Arrange same-day in-person review through the Qatar route approved by governance, with a lower threshold for infants, pregnancy, immunocompromise, new medicines, fever, pain, blistering/peeling, or mouth/eye/genital involvement.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["rash worsens or spreads further", "fever, blistering, peeling, or mucosal involvement develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-widerash-selfcare-advice", titleEn: "Governed care for a mild rash", instructionTextEn: "Avoid a suspected trigger, use a bland unperfumed moisturiser, and wear loose clothing. Antihistamine selection and dose require age, weight, pregnancy/breastfeeding, comorbidity, sedation risk, and current-medicine checks under the approved Qatar pathway. Call 999 for airway swelling, breathing difficulty, faintness, floppiness, or a non-fading rash.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["rash spreads or worsens", "fever or systemic illness develops", "mouth, eye, or genital involvement"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\" (rash emergency warning signs), https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "Decomposed from NHS.UK's published rash emergency warning signs, applied to a widespread-rash presentation (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Rash or Redness - Localized - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-rash-localized",
    titleEn: "Rash or Redness - Localized",
    clinicalDefinitionEn: "Localized rash or redness assessment decomposed from NHS.UK's published rash guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "red patch on skin", weight: 95 },
      { phrase: "localized rash", weight: 95 },
      { phrase: "red spot on skin", weight: 85 },
      { phrase: "rash in one area", weight: 90 },
      { phrase: "red patch on my arm", weight: 100 },
      { phrase: "patch on my arm", weight: 90 },
      { phrase: "red patch that wont go away", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-localrash-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the rash?" },
      { id: "oscg-localrash-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been present?" },
      { id: "oscg-localrash-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any warmth, swelling, or pus at the site?" }
    ],
    questions: [
      {
        id: "oscg-localrash-q-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Despite starting in one area, is there lip/mouth/throat/tongue swelling, breathing difficulty, faintness, floppiness, rapidly spreading blistering/peeling, severe pain out of proportion, confusion, or a purple/non-fading rash with illness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A rash initially described as localized can be the presenting feature of anaphylaxis, sepsis, necrotizing infection, or a severe skin reaction.",
        redFlag: true,
        keywords: ["localized rash breathing difficulty", "rapidly spreading painful rash", "non fading rash"],
        careAdviceIds: ["oscg-localrash-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-localrash-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the area hot, swollen, and increasingly painful, or leaking pus (possible infection), or has the rash not improved after a week or two?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Signs of skin infection or a persistent localized rash warrant primary-care review.",
        redFlag: false,
        keywords: ["infected localized rash", "persistent red patch"],
        careAdviceIds: ["oscg-localrash-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-localrash-q1-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild, recent localized rash with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides general skin self-care measures for a mild localized rash.",
        redFlag: false,
        keywords: ["mild localized rash"],
        careAdviceIds: ["oscg-localrash-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-localrash-emergency-advice", titleEn: "Qatar emergency localized-rash response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. If anaphylaxis is suspected, use the person's prescribed adrenaline auto-injector according to its instructions and emergency plan. Do not apply creams or delay for photographs when severe pain, rapid spread, blistering/peeling, abnormal breathing, faintness, confusion, or non-fading spots are present.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["airway or breathing symptoms", "faintness, confusion, or floppiness", "rapid spread, blistering, peeling, or severe pain", "non-fading rash"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-localrash-routine-advice", titleEn: "Urgent localized-rash review", instructionTextEn: "Arrange same-day in-person review through the Qatar route approved by governance for increasing warmth, swelling, pain, pus, spreading redness, fever, immunocompromise, diabetes, pregnancy, or a young infant.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever or systemic illness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-localrash-selfcare-advice", titleEn: "Governed care for a mild localized rash", instructionTextEn: "Keep the area gently clean, avoid scratching and suspected triggers, and use a bland unperfumed moisturiser only on intact skin. Topical or oral medicine requires age, pregnancy/breastfeeding, allergy, site, skin integrity, and current-medicine checks under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["rash spreads or worsens", "pain, warmth, swelling, pus, blistering, or fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\", https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "Decomposed from NHS.UK's published rash guidance, applied to a localized presentation (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format - no emergency tier since a localized rash alone does not meet the source's emergency criteria (unlike widespread/purple-spot rashes). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Scrapes - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02)
  // ------------------------------------------------------------------
  {
    id: "oscg-scrapes",
    titleEn: "Scrapes",
    clinicalDefinitionEn: "Scrape/graze assessment decomposed from NHS.UK's published cuts and grazes guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "scrape", weight: 95 },
      { phrase: "graze", weight: 95 },
      { phrase: "scraped my knee", weight: 90 },
      { phrase: "road rash", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-scrapes-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the scrape?" },
      { id: "oscg-scrapes-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, immunocompromised, diabetic, or taking an anticoagulant, and how did it happen? Include bite, puncture, road contamination, body-fluid exposure, and safeguarding concerns." },
      { id: "oscg-scrapes-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there dirt or debris still in the wound?" }
    ],
    questions: [
      {
        id: "oscg-scrapes-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is bleeding heavy, spurting, or not controlled by firm direct pressure; is there an embedded object, exposed bone/tendon, loss of feeling or movement, a pale/cold limb, major trauma, or reduced consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A reported scrape may conceal a deeper wound, major bleeding, neurovascular injury, fracture, or serious associated trauma.",
        redFlag: true,
        keywords: ["scrape heavy bleeding", "embedded object wound", "cannot move after wound"],
        careAdviceIds: ["oscg-scrapes-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-scrapes-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the wound have soil, pus, or body fluids in it or is it still dirty after cleaning, or is it swollen/red/getting more painful with pus, or larger than about 5cm?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cuts and grazes guidance lists these as reasons to seek urgent clinical review.",
        redFlag: false,
        keywords: ["dirty scrape wound", "infected graze", "large scrape"],
        careAdviceIds: ["oscg-scrapes-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-scrapes-q1-child-safeguarding",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn:
          "For a child or vulnerable person, is the explanation absent, unsuitable, inconsistent with the wound or developmental ability, is there delay in seeking help or concern about supervision, might the caregiver be unsafe, or can the patient not be offered a safe opportunity to speak privately?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "NICE child-maltreatment guidance identifies unsuitable or inconsistent explanations, possible neglect/lack of supervision, and caregiver obstruction of private discussion as safeguarding alerts. Exact Qatar reporting, destination, confidentiality, and disconnect actions remain GOVERNANCE_REQUIRED.",
        redFlag: true,
        keywords: ["child scrape safeguarding", "inconsistent wound explanation", "unsafe caregiver", "lack of supervision"],
        careAdviceIds: ["oscg-scrapes-safeguarding-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-scrapes-q1-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a small, clean scrape with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor scrapes as manageable at home with basic first aid.",
        redFlag: false,
        keywords: ["small clean scrape"],
        careAdviceIds: ["oscg-scrapes-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-scrapes-emergency-advice", titleEn: "Qatar emergency wound response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Apply continuous firm direct pressure with a clean cloth or dressing; add further dressings without removing soaked layers. Do not remove an embedded object or press directly on it. Keep the person still and warm. If unresponsive and not breathing normally, start age-appropriate CPR as directed by 999.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["uncontrolled or spurting bleeding", "pale, cold, confused, faint, or unresponsive person", "loss of movement, feeling, or circulation"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-scrapes-urgent-advice", titleEn: "Urgent scrape wound review", instructionTextEn: "Rinse superficial contamination gently with clean running water, cover with a clean non-stick dressing, and arrange same-day in-person review. Do not scrub deeply, probe, close, or remove embedded material. Tetanus and blood/body-fluid exposure actions require immunization history and the approved Qatar pathway.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness, swelling, pain, pus, red streaking, or fever", "foreign material remains", "bite, puncture, or body-fluid exposure"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-scrapes-safeguarding-advice", titleEn: "Child wound safeguarding response", instructionTextEn: "Arrange urgent in-person clinical and safeguarding assessment through the Qatar governance-approved pathway. Offer the child a safe opportunity to speak privately when clinically and developmentally appropriate; do not rely on or disclose the plan to a caregiver who may be unsafe. Do not confront a suspected abuser. If the child is in immediate danger, has life-threatening injury, or contact is lost before safety is established, use 999 and the approved emergency handover or welfare-check procedure. Exact reporting, consent, confidentiality, documentation, destination, and disconnect actions remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["immediate danger or unsafe caregiver", "uncontrolled bleeding, collapse, or serious injury", "caller disconnects before safety is established"], displayOrder: 3, adviceCategory: "DISPOSITION" },
      { id: "oscg-scrapes-selfcare-advice", titleEn: "First aid for a clearly minor scrape", instructionTextEn: "Only when injury and safeguarding concerns are absent, wash hands, rinse the surface with clean running water, pat the surrounding skin dry, and cover with a clean non-stick dressing. Change it if wet or dirty. Do not use harsh chemicals in the wound. Medicine, antibiotic, and tetanus advice require age, pregnancy, allergy, immunization, and local-policy checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding restarts or will not stop", "increasing redness, swelling, warmth, pain, pus, red streaking, or fever", "movement, feeling, or colour changes", "safeguarding concern develops"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: [
        "NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)",
        "NICE, \"Child maltreatment: when to suspect maltreatment in under 18s\", https://www.nice.org.uk/guidance/cg89/chapter/recommendations",
        "NICE, \"Child abuse and neglect\", https://www.nice.org.uk/guidance/ng76/chapter/recommendations"
      ],
      contentNotice: "Decomposed from NHS.UK's published cuts and grazes guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the scrape/graze presentation specifically (lower acuity than a full cut/laceration, no emergency tier needed for a surface scrape). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Shingles (Zoster) - https://www.nhs.uk/conditions/shingles/ (reviewed 2023-11-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-shingles",
    titleEn: "Shingles (Zoster)",
    clinicalDefinitionEn: "Shingles assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "shingles", weight: 100 },
      { phrase: "zoster", weight: 85 },
      { phrase: "painful blistering rash band", weight: 75 },
      { phrase: "shingles rash", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-shingles-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the rash?" },
      { id: "oscg-shingles-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the rash appear?" },
      { id: "oscg-shingles-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, and are they pregnant, breastfeeding, immunocompromised, a newborn contact, or experiencing eye/ear symptoms, facial weakness, confusion, weakness, or a widespread rash?" }
    ],
    questions: [
      {
        id: "oscg-shingles-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn:
          "Using the recorded demographics rather than asking the caller to choose: is the patient age 17 or younger? Also route urgently if pregnant, breastfeeding with the rash on the breasts, the rash is on the eye or nose, there are vision changes, or the patient has a severely weakened immune system.",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "NHS.UK shingles guidance recommends urgent clinical review for these groups. In a generated Child variant, age 17 or younger is already established and this branch must be treated as true without asking the caller to validate age eligibility. Exact Qatar destination remains GOVERNANCE_REQUIRED.",
        redFlag: false,
        keywords: ["shingles near eye", "shingles pregnant", "shingles weakened immune system"],
        careAdviceIds: ["oscg-shingles-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-shingles-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is the caller 18 or older with none of the features above, within 3 days of the rash appearing?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: see a pharmacist within 3 days - they can provide the same antiviral medicines as a primary-care clinician.",
        redFlag: false,
        keywords: ["typical shingles case"],
        careAdviceIds: ["oscg-shingles-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      },
      {
        id: "oscg-shingles-q2-child-age-unavailable",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn:
          "For a generated Child variant only: is the recorded age unavailable, contradictory, or not safely confirmed?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "A generated Child variant cannot enter adult self-care. If the recorded age is unavailable or inconsistent, fail closed to prompt clinical review rather than leaving the child without a terminal disposition. Exact Qatar destination remains GOVERNANCE_REQUIRED.",
        redFlag: false,
        keywords: ["child age unavailable", "child age inconsistent"],
        careAdviceIds: ["oscg-shingles-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 2
      }
    ],
    careAdvice: [
      { id: "oscg-shingles-urgent-advice", titleEn: "Urgent Qatar shingles assessment", instructionTextEn: "For every generated Child variant, route directly to prompt same-day in-person assessment based on the recorded age; do not ask the caller to decide whether the age rule applies. Also arrange urgent assessment for eye/nose/ear involvement, vision or hearing change, facial weakness, severe headache/confusion, pregnancy, breastfeeding breast lesions, immunocompromise, or disseminated rash. Antiviral selection, dose, timing, pregnancy/breastfeeding use, renal adjustment, and pediatric use require the approved Qatar prescriber pathway. Call 999 for reduced consciousness, seizure, severe breathing difficulty, collapse, or rapidly severe illness. Exact Qatar destination remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["eye pain, red eye, or vision change", "ear rash, hearing change, or facial weakness", "confusion, severe headache, weakness, or widespread rash", "fever or rapid deterioration"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-shingles-selfcare-advice", titleEn: "Governed supportive care while awaiting shingles review", instructionTextEn: "Keep the rash clean and dry, use loose clothing and a cool clean compress, and avoid adhesive dressings. Keep lesions covered where practical, wash hands, and avoid direct contact with pregnant people who have never had chickenpox, immunocompromised people, and newborn babies until lesions have crusted. Pain medicine and antiviral access require age, pregnancy/breastfeeding, allergy, kidney/liver disease, and current-medicine checks under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["rash approaches the eye, nose, or ear", "vision, hearing, facial movement, or neurological change", "rash becomes widespread or patient becomes unwell"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["NHS.UK, \"Shingles\", https://www.nhs.uk/conditions/shingles/ (page last reviewed 23 November 2023)"],
      contentNotice: "Decomposed from NHS.UK's published shingles guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Sinus Pain or Congestion - https://www.nhs.uk/conditions/sinusitis-sinus-infection/ (reviewed 2024-01-31)
  // ------------------------------------------------------------------
  {
    id: "oscg-sinus-pain-congestion",
    titleEn: "Sinus Pain or Congestion",
    clinicalDefinitionEn: "Sinusitis assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "sinus pain", weight: 100 },
      { phrase: "sinus congestion", weight: 100 },
      { phrase: "sinusitis", weight: 95 },
      { phrase: "sinus pressure", weight: 90 },
      { phrase: "sinuses congested", weight: 100 },
      { phrase: "pressure behind my eyes", weight: 95 },
      { phrase: "sinuses painful", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-sinus-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-sinus-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/breastfeeding or immunocompromised, and what treatments or medicines have been tried?" },
      { id: "oscg-sinus-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured?" }
    ],
    questions: [
      {
        id: "oscg-sinus-q-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there swelling/redness around an eye, eye displacement, double or reduced vision, painful/restricted eye movement, severe frontal headache, neck stiffness, confusion, seizure, focal weakness, reduced consciousness, or a rapidly deteriorating child or adult?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Orbital or intracranial complications and severe systemic illness are uncommon but time-critical and cannot be excluded remotely.",
        redFlag: true,
        keywords: ["sinus eye swelling", "sinus vision change", "sinus confusion"],
        careAdviceIds: ["oscg-sinus-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-sinus-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person very unwell, are painkillers not helping or symptoms getting worse, or does the caller have a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK sinusitis guidance recommends urgent clinical review or emergency medical assessment for these features.",
        redFlag: false,
        keywords: ["very unwell sinusitis", "worsening sinus symptoms"],
        careAdviceIds: ["oscg-sinus-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-sinus-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Has there been no improvement after 7 days of pharmacy or primary-care treatment or 3 weeks of self-treatment, does sinusitis keep recurring, or is the patient 11 or younger?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends primary-care review for these situations.",
        redFlag: false,
        keywords: ["sinusitis not improving", "recurring sinusitis"],
        careAdviceIds: ["oscg-sinus-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-sinus-q2-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a typical, recent case with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can provide the same treatments as a primary-care clinician for sinusitis.",
        redFlag: false,
        keywords: ["typical sinusitis"],
        careAdviceIds: ["oscg-sinus-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sinus-emergency-advice", titleEn: "Qatar emergency sinus-complication response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Do not delay for another remote assessment or give leftover antibiotics. Keep the person with you; if consciousness or breathing worsens, follow 999 instructions and begin age-appropriate CPR if unresponsive and not breathing normally.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["eye swelling or visual change", "severe headache, neck stiffness, confusion, seizure, or weakness", "reduced consciousness or rapid deterioration"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sinus-urgent-advice", titleEn: "Urgent sinusitis review", instructionTextEn: "Arrange same-day in-person review through the Qatar route approved by governance, with a lower threshold for a young child, pregnancy, immunocompromise, severe pain, dehydration, or worsening illness. Do not use leftover antibiotics or another person's medicine.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "fever or eye symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sinus-routine-advice", titleEn: "Governed sinusitis follow-up", instructionTextEn: "Arrange in-person review for persistent or recurring symptoms. Pediatric age limits, pregnancy-safe treatment, antibiotic criteria, and exact Qatar route require governance approval.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "new eye, neurological, or systemic symptom"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-sinus-selfcare-advice", titleEn: "Governed supportive sinus care", instructionTextEn: "Rest, avoid smoke and known triggers, and maintain usual fluids if not restricted. Saline products and pain/decongestant medicines require age, pregnancy/breastfeeding, allergy, heart/blood-pressure disease, kidney/liver disease, and current-medicine checks under the approved Qatar pathway; do not advise homemade nasal solutions or antibiotics without approved instructions.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving as expected", "symptoms worsen", "eye swelling, visual change, severe headache, confusion, or neck stiffness"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, specialty, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["NHS.UK, \"Sinusitis (sinus infection)\", https://www.nhs.uk/conditions/sinusitis-sinus-infection/ (page last reviewed 31 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published sinusitis guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Ring Stuck on Finger or Toe - standard first-aid technique (no dedicated NHS.UK page found)
  // ------------------------------------------------------------------
  {
    id: "oscg-ring-stuck-finger-toe",
    titleEn: "Ring Stuck on Finger or Toe",
    clinicalDefinitionEn: "A ring or band stuck on a swollen finger or toe, using standard first-aid removal technique.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "ring stuck on finger", weight: 100 },
      { phrase: "ring wont come off", weight: 95 },
      { phrase: "cant get my ring off", weight: 95 },
      { phrase: "finger swollen ring", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-ringstuck-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the ring been stuck?" },
      { id: "oscg-ringstuck-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What has already been tried to remove it?" },
      { id: "oscg-ringstuck-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the finger changing color or feeling numb?" }
    ],
    questions: [
      {
        id: "oscg-ringstuck-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the finger turning blue, purple, or white, or is it numb or losing feeling?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A stuck ring cutting off circulation is a genuine emergency - color change or numbness means the finger's blood supply is at risk and needs urgent ring removal (often by cutting the ring).",
        redFlag: true,
        keywords: ["finger turning blue ring stuck", "numb finger ring stuck"],
        careAdviceIds: ["oscg-ringstuck-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-ringstuck-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is the finger's color and feeling normal, just swollen, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Standard first-aid technique can be tried at home first when circulation is not compromised.",
        redFlag: false,
        keywords: ["ring stuck normal color"],
        careAdviceIds: ["oscg-ringstuck-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ringstuck-emergency-advice", titleEn: "Qatar emergency constriction response", instructionTextEn: "Call Qatar emergency services on 999 for blue, pale, purple, cold, numb, severely painful, injured, or rapidly swelling tissue and do not drive. Stop removal attempts, elevate if tolerated, and keep the digit still. Do not apply direct ice, wind string/floss around the digit, pull forcefully, or use cutting tools; professional ring-cutting may be needed urgently.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["colour or temperature worsens", "numbness or pain increases", "loss of movement", "rapid swelling or injury"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ringstuck-selfcare-advice", titleEn: "Limited safe attempt while circulation remains normal", instructionTextEn: "If colour, warmth, feeling, movement, and pain are normal and there was no injury, remove other jewellery, elevate briefly, and make only one gentle attempt using a small amount of soap or water-based lubricant. Stop immediately for pain, skin injury, increasing swelling, colour/temperature change, numbness, or resistance. Do not use string/floss wrapping, force, direct ice, or cutting tools. If it does not slide off promptly, obtain same-day professional removal through the Qatar route approved by governance.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["finger or toe changes colour or becomes cold", "numbness, severe pain, skin injury, or loss of movement", "swelling increases or ring remains stuck"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar emergency, hand/vascular, pediatric, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildBatch11UatProvenance({
      sourceDocuments: ["Standard first-aid technique for constricted-ring removal (string/floss-wrap method) - widely documented general first-aid practice, not a single NHS.UK page (none found specifically covering this)"],
      contentNotice: "No dedicated NHS.UK page was found for a ring stuck on a finger or toe. This protocol uses the standard, widely-taught first-aid removal technique (elevation, lubrication, string-wrap method) and standard circulation-compromise emergency criteria - documented as general first-aid knowledge, not a single-source quote, same pattern as the Choking protocol's technique documentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
