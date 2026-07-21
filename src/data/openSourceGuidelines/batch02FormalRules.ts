import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Second wave of formal, named, validated clinical decision rules - same
 * rigor as the original 4 (src/data/openSourceClinicalRulesContent.ts): real
 * citations fetched and verified via WebFetch (not guessed), not fabricated,
 * not licensed STCC content. `sourceType: "open-source-clinical-rule"`.
 *
 * Two of these (HEART Score, Canadian CT Head Rule) require an honest,
 * documented telephone adaptation because part of the rule cannot be
 * assessed by phone at all (ECG/troponin; GCS/skull-fracture exam) - broader
 * than the CURB-65 Urea substitution in the original 4, since here entire
 * categories are unavailable, not just one lab value. The adaptation chosen
 * throughout: route to in-person evaluation rather than pretend a
 * phone-only partial score is sufficient to safely discharge home.
 */
export const batch02FormalRulesProtocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. HEART Score - Six AJ, Backus BE, Kelder JC. Neth Heart J. 2008;16(6):191-196;
  //    Backus BE et al. Int J Cardiol. 2013;168(3):2153-2158.
  //    Additive point score. ECG and Troponin components CANNOT be assessed
  //    by phone - documented explicitly, no self-care tier exists for chest
  //    pain in this protocol (see rationale).
  // ------------------------------------------------------------------
  {
    id: "oscr-chest-pain-heart",
    titleEn: "Chest Pain (HEART Score)",
    clinicalDefinitionEn:
      "Adult chest pain major-adverse-cardiac-event risk assessment, adapted from the published, peer-reviewed HEART Score (Six et al., 2008; Backus et al., 2013).",
    backgroundInfoEn:
      "The HEART Score is an ADDITIVE point score across 5 categories (History, ECG, Age, Risk factors, Troponin), each worth 0-2 points. Two of the five categories (ECG, Troponin) require in-person testing and cannot be assessed by telephone - this protocol therefore has no self-care tier: any chest pain caller without emergency red flags is routed to urgent in-person evaluation, since a safe low-risk HEART tier cannot be determined without ECG and troponin.",
    ageMin: 18,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 5,
    keywords: [
      { phrase: "chest pain", weight: 100 },
      { phrase: "chest tightness", weight: 90 },
      { phrase: "chest pressure", weight: 90 },
      { phrase: "heart attack", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscr-heart-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the chest pain in your own words - what does it feel like, where is it, does it spread anywhere?" },
      { id: "oscr-heart-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the pain start, and how long has it lasted?" },
      { id: "oscr-heart-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any history of heart disease, stents, bypass surgery, stroke, or peripheral artery disease?" }
    ],
    questions: [
      {
        id: "oscr-heart-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there crushing or pressure-like chest pain, pain spreading to the arm/neck/jaw, sweating, nausea, shortness of breath, fainting or near-fainting, or pain lasting more than 15-20 minutes without relief?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Universal ACS/STEMI emergency rule-out added ahead of HEART Score scoring itself (not part of the published score) - classic acute coronary syndrome red flags require immediate emergency care regardless of the point tally below.",
        redFlag: true,
        keywords: ["crushing chest pain", "pain spreading to arm", "sweating", "shortness of breath", "fainting"],
        careAdviceIds: ["oscr-heart-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscr-heart-q1-history",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "HEART criterion (History): does the description sound moderately or highly suspicious for cardiac chest pain (e.g. exertional, pressure-like, radiating), rather than clearly non-cardiac (e.g. sharp, positional, reproducible by touch)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "Worth 0/1/2 points in the HEART Score (slightly/moderately/highly suspicious history). Nurse should tally this alongside Age and Risk Factors below - ECG and Troponin CANNOT be assessed by phone, so no full score can be calculated here; this only informs how urgently in-person evaluation is needed.",
        redFlag: false,
        keywords: ["suspicious chest pain history", "exertional chest pain"],
        careAdviceIds: ["oscr-heart-inperson-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscr-heart-q2-age",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "HEART criterion (Age): is the patient 45 or older?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Worth 1 point (45-64) or 2 points (65+) in the HEART Score; under 45 scores 0.",
        redFlag: false,
        keywords: ["age 45 or older", "age 65 or older"],
        careAdviceIds: ["oscr-heart-inperson-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 2
      },
      {
        id: "oscr-heart-q3-riskfactors",
        acuityOrder: 4,
        severity: "Urgent",
        questionTextEn:
          "HEART criterion (Risk Factors): does the patient have known risk factors (high blood pressure, high cholesterol, diabetes, obesity, smoking, family history of heart disease) or a known history of heart attack, stent, bypass, stroke, or peripheral artery disease?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Worth 1 point (1-2 risk factors) or 2 points (3+ risk factors, or known atherosclerotic disease) in the HEART Score.",
        redFlag: false,
        keywords: ["heart disease risk factors", "known heart disease", "prior heart attack"],
        careAdviceIds: ["oscr-heart-inperson-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 3
      },
      {
        id: "oscr-heart-q4-tier",
        acuityOrder: 5,
        severity: "Urgent",
        questionTextEn:
          "Regardless of how low the History/Age/Risk-Factor tally seems: has an ECG and troponin blood test NOT yet been done for this episode of chest pain?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "Published HEART Score low-risk discharge (0-3 total) requires normal ECG and troponin - both unobtainable by phone. This protocol therefore has NO self-care tier: any undiagnosed chest pain without emergency red flags is routed to urgent in-person evaluation for ECG and troponin, not sent home on a phone-only partial score.",
        redFlag: false,
        keywords: ["no ecg done", "no troponin done", "needs in-person evaluation"],
        careAdviceIds: ["oscr-heart-inperson-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 4
      }
    ],
    careAdvice: [
      {
        id: "oscr-heart-emergency-advice",
        titleEn: "Emergency chest pain precautions",
        instructionTextEn: "Keep the caller sitting or lying still and calm. Arrange emergency transport immediately - do not let the caller drive themselves.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening pain", "loss of consciousness", "difficulty breathing"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      },
      {
        id: "oscr-heart-inperson-advice",
        titleEn: "Chest pain requires in-person evaluation",
        instructionTextEn:
          "This chest pain needs an in-person medical evaluation with an ECG and blood test, which cannot be done by phone. Arrange urgent transport to a facility that can perform both promptly.",
        dispositionCode: "HMC_URGENT_REVIEW",
        warningSigns: ["pain worsens or spreads", "shortness of breath develops", "sweating or nausea develops"],
        displayOrder: 2,
        adviceCategory: "DISPOSITION",
        patientSendable: true
      }
    ],
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Six AJ, Backus BE, Kelder JC. Chest pain in the emergency room: value of the HEART score. Neth Heart J. 2008;16(6):191-196.",
        "Backus BE, Six AJ, Kelder JC, et al. A prospective validation of the HEART score for chest pain patients at the emergency department. Int J Cardiol. 2013;168(3):2153-2158."
      ],
      contentNotice:
        "Derived from the published, peer-reviewed HEART Score (Six et al. 2008; Backus et al. 2013) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format. The ECG and Troponin components cannot be assessed by telephone and are explicitly not attempted here; this protocol therefore only ever routes to Emergency or Urgent in-person evaluation, never self-care, which is a deliberate telephone-triage safety adaptation, not the rule's own published low-risk discharge pathway. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, including explicit review of the no-self-care-tier design choice."
    })
  },

  // ------------------------------------------------------------------
  // 2. Ottawa Knee Rule - Stiell IG et al. Ann Emerg Med. 1995;26(4):405-413;
  //    Stiell IG et al. JAMA. 1996;275(8):611-615. Single Yes-fixes-disposition rule.
  // ------------------------------------------------------------------
  {
    id: "oscr-knee-injury-ottawa",
    titleEn: "Knee Injury (Ottawa Knee Rule)",
    clinicalDefinitionEn:
      "Adult knee injury imaging decision, adapted from the published, peer-reviewed Ottawa Knee Rule (Stiell et al., 1995/1996). Validated to identify which knee injuries do not need an X-ray.",
    backgroundInfoEn:
      "The Ottawa Knee Rule is a validated, highly sensitive clinical decision rule for acute knee trauma: any ONE positive criterion means imaging is indicated; none positive means it is not.",
    ageMin: 18,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 3,
    keywords: [
      { phrase: "knee injury", weight: 100 },
      { phrase: "twisted knee", weight: 90 },
      { phrase: "knee pain after injury", weight: 85 },
      { phrase: "hurt my knee", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscr-knee-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the injury happen?" },
      { id: "oscr-knee-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Did you hear or feel a pop or snap at the time of injury?" },
      { id: "oscr-knee-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" }
    ],
    questions: [
      {
        id: "oscr-knee-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there an obvious deformity, visible bone, open wound, uncontrolled bleeding, or is the foot/lower leg cold, pale, blue, or numb?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the Ottawa Knee Rule itself (not part of the published rule) - signs of neurovascular compromise or open fracture/dislocation require immediate emergency care.",
        redFlag: true,
        keywords: ["deformity", "bone visible", "open wound", "cold foot", "numb"],
        careAdviceIds: ["oscr-knee-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscr-knee-q1",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Ottawa Knee Rule criterion: is the patient 55 or older?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published Ottawa Knee Rule age criterion (Stiell et al., 1995/1996). A positive answer to ANY criterion means imaging is indicated.",
        redFlag: false,
        keywords: ["age 55 or older"],
        careAdviceIds: ["oscr-knee-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscr-knee-q2",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Ottawa Knee Rule criterion: is there tenderness ONLY over the kneecap (patella), with no other bony tenderness?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published Ottawa Knee Rule isolated patellar tenderness criterion.",
        redFlag: false,
        keywords: ["kneecap tenderness", "patella tenderness"],
        careAdviceIds: ["oscr-knee-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 2
      },
      {
        id: "oscr-knee-q3",
        acuityOrder: 4,
        severity: "Urgent",
        questionTextEn: "Ottawa Knee Rule criterion: is there tenderness over the head of the fibula (the bony bump on the outer side of the knee, below the joint)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published Ottawa Knee Rule fibular head tenderness criterion.",
        redFlag: false,
        keywords: ["fibular head tenderness", "outer knee tenderness"],
        careAdviceIds: ["oscr-knee-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 3
      },
      {
        id: "oscr-knee-q4",
        acuityOrder: 5,
        severity: "Urgent",
        questionTextEn: "Ottawa Knee Rule criterion: is the patient unable to bend the knee to 90 degrees (a right angle)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published Ottawa Knee Rule flexion criterion.",
        redFlag: false,
        keywords: ["cannot bend knee", "unable to flex knee"],
        careAdviceIds: ["oscr-knee-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 4
      },
      {
        id: "oscr-knee-q5",
        acuityOrder: 6,
        severity: "Urgent",
        questionTextEn: "Ottawa Knee Rule criterion: was the patient unable to take four steps, both right after the injury and right now?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published Ottawa Knee Rule weight-bearing criterion.",
        redFlag: false,
        keywords: ["cannot bear weight", "unable to walk on knee"],
        careAdviceIds: ["oscr-knee-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 5
      },
      {
        id: "oscr-knee-q6-negative",
        acuityOrder: 7,
        severity: "Self-care",
        questionTextEn: "If all five Ottawa Knee criteria above are No: mild swelling or pain only, can bear weight, no bony tenderness at the specified points, can bend the knee?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "The Ottawa Knee Rule's own validated conclusion: a patient who meets NONE of the five criteria does not need a knee X-ray.",
        redFlag: false,
        keywords: ["mild knee swelling", "can bear weight", "no bony tenderness"],
        careAdviceIds: ["oscr-knee-selfcare-advice"],
        telemedicineEligible: true,
        telemedicineNotesEn: "Suitable for video visit follow-up if symptoms do not resolve as expected.",
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscr-knee-emergency-advice", titleEn: "Emergency knee injury precautions", instructionTextEn: "Keep the limb still, do not attempt to realign a deformity, elevate if possible, and arrange emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "foot turning pale or blue"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscr-knee-imaging-advice", titleEn: "Ottawa Knee Rule positive - arrange imaging", instructionTextEn: "Arrange same-day or next-day X-ray evaluation per the Ottawa Knee Rule. Until then: rest, avoid weight-bearing, apply ice 20 minutes at a time, and elevate.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain", "new numbness", "color change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscr-knee-selfcare-advice", titleEn: "Ottawa Knee Rule negative - home care (RICE)", instructionTextEn: "Rest, Ice (20 minutes at a time), Compression (elastic bandage, not too tight), Elevation above heart level. Gradually resume weight-bearing as tolerated.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "new inability to bear weight", "numbness or color change develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Stiell IG, Wells GA, Vandemheen K, et al. Derivation of a decision rule for the use of radiography in acute knee injuries. Ann Emerg Med. 1995;26(4):405-413.",
        "Stiell IG, Greenberg GH, Wells GA, et al. Prospective validation of a decision rule for the use of radiography in acute knee injuries. JAMA. 1996;275(8):611-615."
      ],
      contentNotice:
        "Derived from the published, peer-reviewed Ottawa Knee Rule (Stiell et al. 1995/1996) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. NEXUS Criteria - Hoffman JR et al. N Engl J Med. 2000;343(2):94-99.
  //    All 5 criteria must be NEGATIVE to safely skip imaging; any ONE
  //    positive means imaging is indicated (same shape as Ottawa rules).
  // ------------------------------------------------------------------
  {
    id: "oscr-neck-injury-nexus",
    titleEn: "Neck Injury (NEXUS Criteria)",
    clinicalDefinitionEn:
      "Adult neck/cervical-spine injury imaging decision after blunt trauma, adapted from the published, peer-reviewed NEXUS Criteria (Hoffman et al., 2000).",
    backgroundInfoEn:
      "NEXUS Criteria: if focal neurologic deficit, midline spinal tenderness, altered consciousness, intoxication, or a distracting injury is present, imaging is indicated; if ALL are absent, imaging is not needed. The rule's own authors note it performs less reliably in patients over 65 - this protocol routes patients 65+ to in-person evaluation regardless of the other criteria as an explicit, documented caution.",
    ageMin: 18,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 4,
    keywords: [
      { phrase: "neck injury", weight: 100 },
      { phrase: "neck pain after injury", weight: 90 },
      { phrase: "whiplash", weight: 85 },
      { phrase: "hurt my neck", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscr-nexus-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the neck injury happen?" },
      { id: "oscr-nexus-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscr-nexus-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any numbness, tingling, or weakness in the arms or legs?" }
    ],
    questions: [
      {
        id: "oscr-nexus-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there weakness, numbness, or paralysis in the arms or legs, loss of bladder or bowel control, or is the patient unable to move part of their body since the injury?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the NEXUS Criteria itself (not part of the published rule) - a focal neurologic deficit is itself one of the 5 NEXUS criteria and always the highest-urgency finding, so it is elevated to the emergency screen here.",
        redFlag: true,
        keywords: ["arm or leg weakness", "numbness", "loss of bladder control", "paralysis"],
        careAdviceIds: ["oscr-nexus-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscr-nexus-q1",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "NEXUS criterion: is there tenderness directly over the middle of the back of the neck (midline spinal tenderness)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published NEXUS midline tenderness criterion (Hoffman et al., 2000). A positive answer to ANY NEXUS criterion means imaging is indicated.",
        redFlag: false,
        keywords: ["midline neck tenderness", "back of neck tenderness"],
        careAdviceIds: ["oscr-nexus-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscr-nexus-q2",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "NEXUS criterion: is the patient confused, drowsy, or not fully alert since the injury?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published NEXUS altered-consciousness criterion.",
        redFlag: false,
        keywords: ["confused after injury", "not fully alert"],
        careAdviceIds: ["oscr-nexus-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 2
      },
      {
        id: "oscr-nexus-q3",
        acuityOrder: 4,
        severity: "Urgent",
        questionTextEn: "NEXUS criterion: has the patient been drinking alcohol or taking drugs that could affect alertness or pain perception?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published NEXUS intoxication criterion.",
        redFlag: false,
        keywords: ["intoxicated", "alcohol or drugs"],
        careAdviceIds: ["oscr-nexus-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 3
      },
      {
        id: "oscr-nexus-q4",
        acuityOrder: 5,
        severity: "Urgent",
        questionTextEn: "NEXUS criterion: is there another painful injury (e.g. a broken bone) that might be distracting the patient from noticing neck pain, OR is the patient 65 or older?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published NEXUS distracting-injury criterion. Age 65+ is added here as an explicit telephone-triage caution, not part of the published rule: the original authors note NEXUS performs less reliably over age 65, so this protocol routes these callers to in-person evaluation regardless of the other criteria.",
        redFlag: false,
        keywords: ["distracting injury", "age 65 or older"],
        careAdviceIds: ["oscr-nexus-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 4
      },
      {
        id: "oscr-nexus-q5-negative",
        acuityOrder: 6,
        severity: "Self-care",
        questionTextEn: "If all four NEXUS criteria above are No and the patient is under 65: no midline tenderness, fully alert, not intoxicated, no distracting injury?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "The NEXUS Criteria's own validated conclusion: a patient with ALL five criteria negative does not need cervical spine imaging.",
        redFlag: false,
        keywords: ["mild neck pain", "no red flags"],
        careAdviceIds: ["oscr-nexus-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscr-nexus-emergency-advice", titleEn: "Emergency neck injury precautions", instructionTextEn: "Keep the head and neck as still as possible - do not let the caller move their neck. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening weakness or numbness", "new loss of bladder or bowel control"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscr-nexus-imaging-advice", titleEn: "NEXUS criterion positive - arrange imaging", instructionTextEn: "Arrange prompt in-person evaluation and imaging. Keep neck movement to a minimum until seen.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new numbness, tingling, or weakness", "worsening pain"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscr-nexus-selfcare-advice", titleEn: "NEXUS negative - home care", instructionTextEn: "Rest, over-the-counter pain relief per local policy, gentle movement as tolerated, and a heat or ice pack for comfort.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["new numbness, tingling, or weakness develops", "pain worsens instead of improving"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hoffman JR, Mower WR, Wolfson AB, Todd KH, Zucker MI. Validity of a set of clinical criteria to rule out injury to the cervical spine in patients with blunt trauma. National Emergency X-Radiography Utilization Study Group. N Engl J Med. 2000;343(2):94-99."
      ],
      contentNotice:
        "Derived from the published, peer-reviewed NEXUS Criteria (Hoffman et al., 2000) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format, with an added age-65+ telephone-triage caution reflecting the original authors' own stated reliability limitation in that age group. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Canadian CT Head Rule - Stiell IG et al. Lancet. 2001;357(9266):1391-1396.
  //    High/medium-risk criteria trigger imaging; GCS and skull-fracture exam
  //    cannot be assessed by phone, so current-alertness proxies are used and
  //    documented; exclusion-from-rule populations (seizure, anticoagulants)
  //    are treated as real emergency-level risks, not just rule-inapplicability.
  // ------------------------------------------------------------------
  {
    id: "oscr-head-injury-cch",
    titleEn: "Head Injury (Canadian CT Head Rule)",
    clinicalDefinitionEn:
      "Adult minor head injury (brief loss of consciousness, amnesia, or witnessed disorientation) CT-imaging decision, adapted from the published, peer-reviewed Canadian CT Head Rule (Stiell et al., 2001).",
    backgroundInfoEn:
      "The Canadian CT Head Rule applies to minor head injury with GCS 13-15 plus loss of consciousness, amnesia, or witnessed disorientation. It is not validated for patients under 16, on blood thinners, or with a seizure after injury - this protocol treats those populations as needing emergency-level care directly, rather than attempting to apply an unvalidated rule to them.",
    ageMin: 18,
    mode: "after-hours",
    patientGroup: "adult",
    acuity: 4,
    keywords: [
      { phrase: "head injury", weight: 100 },
      { phrase: "hit my head", weight: 90 },
      { phrase: "concussion", weight: 85 },
      { phrase: "knocked out", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscr-cch-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Did the patient lose consciousness, and for how long?" },
      { id: "oscr-cch-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the injury happen?" },
      { id: "oscr-cch-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" }
    ],
    questions: [
      {
        id: "oscr-cch-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is the patient currently confused, very drowsy, or difficult to rouse; are there signs of a skull fracture (clear or bloody fluid from the ear or nose, bruising around both eyes or behind an ear); has there been a seizure since the injury; or is the patient on blood-thinning medication (e.g. warfarin, apixaban)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Current altered consciousness and skull-fracture signs are the Canadian CT Head Rule's own high-risk criteria. Seizure-after-injury and blood-thinner use are populations the rule explicitly excludes (it was not validated for them) - rather than treat exclusion as 'rule doesn't apply, no action needed', this protocol treats both as real emergency-level risks requiring direct emergency care, not rule application.",
        redFlag: true,
        keywords: ["confused after head injury", "skull fracture signs", "seizure after injury", "blood thinners"],
        careAdviceIds: ["oscr-cch-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscr-cch-q1-highrisk",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Canadian CT Head Rule high-risk criterion: has the patient vomited twice or more since the injury, or is the patient 65 or older?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published Canadian CT Head Rule high-risk criteria (Stiell et al., 2001) - associated with need for neurosurgical intervention.",
        redFlag: false,
        keywords: ["repeated vomiting after head injury", "age 65 or older head injury"],
        careAdviceIds: ["oscr-cch-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscr-cch-q2-mediumrisk",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn:
          "Canadian CT Head Rule medium-risk criterion: is there no memory of events for 30 minutes or more before the injury, or did the injury happen from a dangerous mechanism (struck by a vehicle, thrown from a vehicle, or a fall from more than 3 feet / 5 stairs)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Published Canadian CT Head Rule medium-risk criteria - associated with clinically important brain injury on CT.",
        redFlag: false,
        keywords: ["retrograde amnesia", "dangerous injury mechanism", "fall from height"],
        careAdviceIds: ["oscr-cch-imaging-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 2
      },
      {
        id: "oscr-cch-q3-negative",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn:
          "If none of the criteria above apply: brief loss of consciousness or confusion right after the injury, but now fully alert, no repeated vomiting, no dangerous mechanism, under 65, and not on blood thinners?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn:
          "The Canadian CT Head Rule's own validated conclusion (100% sensitive for injuries needing neurosurgery in the studied population): patients meeting none of the high- or medium-risk criteria do not need a head CT. Standard concussion home-observation precautions still apply.",
        redFlag: false,
        keywords: ["mild head injury", "brief confusion resolved"],
        careAdviceIds: ["oscr-cch-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscr-cch-emergency-advice", titleEn: "Emergency head injury precautions", instructionTextEn: "Keep the patient still, do not let them stand or drive, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "new weakness", "repeated vomiting"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscr-cch-imaging-advice", titleEn: "Canadian CT Head Rule criterion positive - arrange imaging", instructionTextEn: "Arrange prompt in-person evaluation and CT imaging. Someone should stay with the patient and watch for worsening symptoms until seen.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing confusion or drowsiness", "repeated vomiting", "worsening headache"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscr-cch-selfcare-advice", titleEn: "Canadian CT Head Rule negative - home observation", instructionTextEn: "Standard concussion precautions: rest, avoid strenuous activity and screens, have someone check on the patient periodically for the first 24 hours, and avoid alcohol and sedating medication.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["worsening headache", "repeated vomiting develops", "increasing confusion, drowsiness, or new weakness"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Stiell IG, Wells GA, Vandemheen K, et al. The Canadian CT Head Rule for patients with minor head injury. Lancet. 2001;357(9266):1391-1396."],
      contentNotice:
        "Derived from the published, peer-reviewed Canadian CT Head Rule (Stiell et al., 2001) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format. GCS and skull-fracture exam findings are approximated by phone-assessable proxies (current alertness, reported skull-fracture signs) - documented as an approximation, not the validated in-person exam. Not licensed Schmitt-Thompson (STCC) content. Adult-only (ageMin 18) - the rule is not validated in children; a pediatric head-injury protocol (e.g. PECARN) is a separate future candidate. Requires local clinical governance validation before production use."
    })
  }
];
