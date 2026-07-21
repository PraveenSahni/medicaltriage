import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

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
      { id: "oscg-backinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
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
        rationaleEn: "NHS.UK whiplash-pattern guidance lists these as reasons for an urgent GP appointment or 111 call - possible nerve involvement, applicable to back injuries generally.",
        redFlag: false,
        keywords: ["severe back pain after injury", "pins and needles after back injury"],
        careAdviceIds: ["oscg-backinjury-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-backinjury-emergency-advice", titleEn: "Emergency back injury precautions", instructionTextEn: "Keep the person as still as possible and arrange emergency transport immediately - do not attempt to move them if a spinal injury is suspected.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening leg weakness", "new loss of bladder or bowel control"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-backinjury-urgent-advice", titleEn: "Urgent back injury review", instructionTextEn: "Arrange same-day medical review for possible nerve involvement.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness spreads", "weakness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-backinjury-selfcare-advice", titleEn: "Home care for a mild back injury", instructionTextEn: "Take paracetamol or ibuprofen for pain, and try to continue everyday activities - prolonged rest does not speed recovery.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "numbness or weakness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-chestinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
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
        rationaleEn: "NHS.UK broken/bruised ribs guidance lists these as call-999/A&E criteria - could mean a rib has damaged the lung, liver, or spleen.",
        redFlag: true,
        keywords: ["worsening breathlessness rib injury", "worsening chest pain injury", "coughing blood rib injury"],
        careAdviceIds: ["oscg-chestinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-chestinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has the pain not improved within a few weeks, is there yellow or green mucus when coughing, or a very high temperature or feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent GP/111 contact for these features - may need stronger pain relief or antibiotics for a chest infection.",
        redFlag: false,
        keywords: ["rib pain not improving", "chest infection after rib injury"],
        careAdviceIds: ["oscg-chestinjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-chestinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild pain or bruising with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: broken/bruised ribs usually get better on their own within 2-6 weeks with self-care.",
        redFlag: false,
        keywords: ["mild rib bruising"],
        careAdviceIds: ["oscg-chestinjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-chestinjury-emergency-advice", titleEn: "Emergency chest injury precautions", instructionTextEn: "Keep the person sitting upright and calm, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "increasing pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-chestinjury-urgent-advice", titleEn: "Urgent chest injury review", instructionTextEn: "Arrange same-day medical review for possible chest infection or additional pain relief.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing worsens", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-chestinjury-selfcare-advice", titleEn: "Home care for mild rib injury", instructionTextEn: "Use paracetamol or ibuprofen, apply ice packs, rest but breathe normally, hold a pillow against the chest when coughing, move around gently, take deep breaths regularly, and sleep upright initially. Avoid staying immobile, straining, lifting heavy objects, intense exercise, or smoking.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["breathing difficulty develops", "pain worsens instead of improving"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-10", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken or bruised ribs\", https://www.nhs.uk/conditions/broken-or-bruised-ribs/ (page last reviewed 10 January 2024)"],
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
      { id: "oscg-shoulderinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
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
        rationaleEn: "NHS.UK fracture guidance (broken arm/wrist) lists these as call-999/A&E criteria - the same principles apply to shoulder injury and dislocation.",
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
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["severe shoulder pain", "cannot use arm shoulder injury"],
        careAdviceIds: ["oscg-shoulderinjury-urgent-advice"],
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-shoulderinjury-emergency-advice", titleEn: "Emergency shoulder injury precautions", instructionTextEn: "Keep the arm still, do not attempt to relocate a dislocated shoulder yourself, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening numbness", "increasing bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-shoulderinjury-urgent-advice", titleEn: "Urgent shoulder injury review", instructionTextEn: "Support the arm with a sling, apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "new numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-shoulderinjury-selfcare-advice", titleEn: "Home care for a mild shoulder injury", instructionTextEn: "Support the arm with a sling if needed, apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, and take paracetamol or ibuprofen for pain.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "new numbness or inability to use the arm"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
        rationaleEn: "NHS.UK guidance lists a non-fading rash as a call-999 warning sign, since it can indicate meningococcal septicaemia - do not wait to see if other symptoms develop.",
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
        severity: "Routine",
        questionTextEn: "Does the rash fade when pressed with a glass, with no fever or feeling unwell?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "A fading purple rash without fever is less concerning, but should still be reviewed to determine the cause (e.g. bruising, a blood-clotting issue, or a medication side effect).",
        redFlag: false,
        keywords: ["fading purple rash"],
        careAdviceIds: ["oscg-purplerash-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-purplerash-emergency-advice", titleEn: "Emergency non-fading rash precautions", instructionTextEn: "Arrange emergency transport immediately - do not wait for other symptoms to develop.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["fever develops", "person becomes unwell or confused"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-purplerash-routine-advice", titleEn: "Routine purple rash follow-up", instructionTextEn: "Book a prompt GP appointment to determine the cause of the rash.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["rash spreads or stops fading when pressed", "fever develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-widerash-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Any known trigger (new medication, food, illness)?" },
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
        rationaleEn: "NHS.UK rash guidance lists sudden allergic-reaction swelling/breathing difficulty and a non-fading rash as call-999 criteria.",
        redFlag: true,
        keywords: ["swollen throat with rash", "non fading widespread rash"],
        careAdviceIds: ["oscg-widerash-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-widerash-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is the rash spreading, accompanied by fever, or is the cause unclear and concerning?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "A spreading rash with fever, or an unexplained cause, warrants GP review to identify the underlying condition.",
        redFlag: false,
        keywords: ["spreading rash with fever", "unexplained widespread rash"],
        careAdviceIds: ["oscg-widerash-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-widerash-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-widerash-routine-advice", titleEn: "Routine rash follow-up", instructionTextEn: "Book a GP appointment to identify the cause of the rash.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["rash worsens or spreads further", "fever develops"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-widerash-selfcare-advice", titleEn: "Home care for a mild rash", instructionTextEn: "Use an unperfumed moisturiser, avoid known triggers, wear loose cotton clothing, and take an antihistamine if itchy per local policy.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["rash spreads or worsens", "fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
        id: "oscg-localrash-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Is the area hot, swollen, and increasingly painful, or leaking pus (possible infection), or has the rash not improved after a week or two?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "Signs of skin infection or a persistent localized rash warrant GP review.",
        redFlag: false,
        keywords: ["infected localized rash", "persistent red patch"],
        careAdviceIds: ["oscg-localrash-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-localrash-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a mild, recent localized rash with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides general skin self-care measures for a mild localized rash.",
        redFlag: false,
        keywords: ["mild localized rash"],
        careAdviceIds: ["oscg-localrash-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-localrash-routine-advice", titleEn: "Routine localized rash follow-up", instructionTextEn: "Book a GP appointment for these features.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-localrash-selfcare-advice", titleEn: "Home care for a mild localized rash", instructionTextEn: "Keep the area clean, use an unperfumed moisturiser, avoid scratching, and wear loose clothing over the area.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["rash spreads or worsens", "signs of infection develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-scrapes-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How did it happen, and roughly how big is it?" },
      { id: "oscg-scrapes-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there dirt or debris still in the wound?" }
    ],
    questions: [
      {
        id: "oscg-scrapes-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Does the wound have soil, pus, or body fluids in it or is it still dirty after cleaning, or is it swollen/red/getting more painful with pus, or larger than about 5cm?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cuts and grazes guidance lists these as reasons to call 111 or see a GP.",
        redFlag: false,
        keywords: ["dirty scrape wound", "infected graze", "large scrape"],
        careAdviceIds: ["oscg-scrapes-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-scrapes-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a small, clean scrape with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor scrapes as manageable at home with basic first aid.",
        redFlag: false,
        keywords: ["small clean scrape"],
        careAdviceIds: ["oscg-scrapes-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-scrapes-urgent-advice", titleEn: "Urgent scrape wound review", instructionTextEn: "Clean the wound as best as possible and arrange same-day medical review for cleaning or a tetanus check.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or pus", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-scrapes-selfcare-advice", titleEn: "Home first aid for a scrape", instructionTextEn: "Rinse with water to remove any dirt, pat dry, and cover with a clean dressing or plaster. Keep clean and dry and change as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)"],
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
      { id: "oscg-shingles-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the caller pregnant, breastfeeding, or immunocompromised?" }
    ],
    questions: [
      {
        id: "oscg-shingles-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn:
          "Is the caller pregnant, breastfeeding with the rash on the breasts, is the rash on the eye or nose, are there vision changes, does the caller have a severely weakened immune system, or are they 17 or younger?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "NHS.UK shingles guidance recommends urgent GP/111 contact for these groups - antiviral medicine works best if started within 3 days of the rash appearing.",
        redFlag: false,
        keywords: ["shingles near eye", "shingles pregnant", "shingles weakened immune system"],
        careAdviceIds: ["oscg-shingles-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-shingles-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is the caller 18 or older with none of the features above, within 3 days of the rash appearing?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: see a pharmacist within 3 days - they can give the same antiviral medicines as a GP.",
        redFlag: false,
        keywords: ["typical shingles case"],
        careAdviceIds: ["oscg-shingles-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-shingles-urgent-advice", titleEn: "Urgent shingles review", instructionTextEn: "Arrange same-day medical review - antiviral treatment works best when started early.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes develop", "rash spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-shingles-selfcare-advice", titleEn: "Pharmacy self-care for shingles", instructionTextEn: "See a pharmacist within 3 days for antiviral medicine. Take paracetamol for pain, keep the rash clean and dry, wear loose-fitting clothing, and use a cool compress several times daily. Do not let dressings stick to the rash or wear rough-fibre clothing over it.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["rash spreads near the eye", "vision changes develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-11-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-sinus-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have any treatments been tried?" },
      { id: "oscg-sinus-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured?" }
    ],
    questions: [
      {
        id: "oscg-sinus-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the person very unwell, are painkillers not helping or symptoms getting worse, or does the caller have a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK sinusitis guidance recommends urgent NHS 111 or emergency GP contact for these features.",
        redFlag: false,
        keywords: ["very unwell sinusitis", "worsening sinus symptoms"],
        careAdviceIds: ["oscg-sinus-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-sinus-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has there been no improvement after 7 days of pharmacy/GP treatment or 3 weeks of self-treatment, does sinusitis keep recurring, or is the patient 11 or younger?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["sinusitis not improving", "recurring sinusitis"],
        careAdviceIds: ["oscg-sinus-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-sinus-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a typical, recent case with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can give the same treatments as a GP for sinusitis.",
        redFlag: false,
        keywords: ["typical sinusitis"],
        careAdviceIds: ["oscg-sinus-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sinus-urgent-advice", titleEn: "Urgent sinusitis review", instructionTextEn: "Arrange same-day medical review for these features.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sinus-routine-advice", titleEn: "Routine sinusitis follow-up", instructionTextEn: "Book a GP appointment for persistent or recurring sinusitis.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-sinus-selfcare-advice", titleEn: "Pharmacy self-care for sinusitis", instructionTextEn: "Rest, drink plenty of fluids, take paracetamol or ibuprofen, avoid allergy triggers and smoking, and clean the nose with a homemade salt water solution up to 3 times daily. Stay home if feverish until feeling better.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after 7 days", "symptoms worsen"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-31", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-ringstuck-emergency-advice", titleEn: "Emergency ring removal", instructionTextEn: "Elevate the hand above heart level and apply ice while arranging emergency transport - the ring may need to be cut off to restore circulation.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["color worsens", "numbness increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-ringstuck-selfcare-advice", titleEn: "Home technique for a stuck ring", instructionTextEn: "Elevate the hand for a few minutes to reduce swelling, apply an ice pack, and use soap, lubricant, or lotion on the finger. Wind dental floss or thin string tightly around the finger from the fingertip down past the ring, then thread the end under the ring and unwind it from underneath, which should roll the ring off. If this doesn't work after a reasonable attempt, seek in-person help rather than continuing to force it.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["finger changes color", "numbness or severe pain develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "General first-aid practice (no single named source)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard first-aid technique for constricted-ring removal (string/floss-wrap method) - widely documented general first-aid practice, not a single NHS.UK page (none found specifically covering this)"],
      contentNotice: "No dedicated NHS.UK page was found for a ring stuck on a finger or toe. This protocol uses the standard, widely-taught first-aid removal technique (elevation, lubrication, string-wrap method) and standard circulation-compromise emergency criteria - documented as general first-aid knowledge, not a single-source quote, same pattern as the Choking protocol's technique documentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
