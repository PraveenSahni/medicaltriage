import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Second wave of formal, named, validated clinical decision rules - same
 * rigor as the original 4 (src/data/openSourceClinicalRulesContent.ts): real
 * citations fetched and verified via WebFetch (not guessed), not fabricated,
 * not licensed STCC content. `sourceType: "open-source-clinical-rule"`.
 *
 * UAT safety constraint: these rules were derived for clinicians evaluating
 * selected patients in person. No rule-negative or low-risk conclusion is
 * produced by telephone. Required ECG, troponin, palpation, range-of-motion,
 * gait, neurologic, GCS and skull examinations remain in-person assessments.
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
      "UAT-only adult chest-pain pathway that sends active or suspected acute coronary syndrome symptoms directly to Qatar 999 without HEART scoring delay. HEART may be considered only after documented in-person clinician assessment, 12-lead ECG and troponin; it must never be calculated or implied by telephone or used as a standalone rule-out test.",
    backgroundInfoEn:
      "HEART is an emergency-department risk-stratification aid for adults with chest pain being assessed for possible acute coronary syndrome. It combines clinician-assessed history, 12-lead ECG, age, risk factors and measured troponin. A telephone call cannot supply the ECG, troponin or complete clinician assessment, so individual component points and a total score must not be displayed or used for disposition. It is not a diagnostic test and is not validated for children or for screening people without a suspected acute coronary syndrome presentation.",
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
      { id: "oscr-heart-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the pain present now, recurring or worsening; accompanied by breathlessness, sweating, nausea, faintness, weakness, or pain in the arm, shoulder, back, neck or jaw; or otherwise suspected by the nurse to represent acute coronary syndrome? If yes, stop assessment and use the Qatar 999 emergency branch without calculating HEART." },
      { id: "oscr-heart-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is the patient under 18, pregnant or recently postpartum, or do they have known heart or vascular disease, diabetes, smoking, high blood pressure or cholesterol?" }
    ],
    questions: [
      {
        id: "oscr-heart-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is chest pain or pressure present now, severe, recurring or worsening, or accompanied by shortness of breath, sweating, nausea, fainting/near-fainting, marked weakness, or pain spreading to the arm, shoulder, back, neck or jaw?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "This is an emergency symptom screen, not part of HEART. Acute coronary syndrome can be atypical, including in women, older adults and people with diabetes; a reassuring telephone description cannot exclude it.",
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
        severity: "Emergency",
        questionTextEn:
          "Even if the symptom description is atypical or incomplete, does the nurse suspect active or recent acute coronary syndrome, or remain unable to exclude it safely during this call?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Suspected acute coronary syndrome requires Qatar 999 emergency assessment without scoring delay. HEART applies only after in-person clinician assessment with a documented 12-lead ECG and measured troponin; it is not a telephone rule-out or standalone triage tool.",
        redFlag: true,
        keywords: ["suspicious chest pain history", "exertional chest pain"],
        careAdviceIds: ["oscr-heart-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscr-heart-q2-age",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Only after the emergency and suspected-acute-coronary-syndrome branches are negative: has the chest pain resolved, but this episode has not yet had an in-person clinician assessment with a documented ECG and troponin testing?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Resolved symptoms still need prompt in-person assessment, and any remaining suspicion of acute coronary syndrome belongs in the preceding Qatar 999 branch. Age is collected for the receiving clinician but is not scored by the telephone pathway.",
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
          "Is the patient under 18, pregnant/recently postpartum, or is another serious cause possible (for example aortic, pulmonary embolic, respiratory or traumatic chest pain)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "HEART is not a pediatric rule and must not substitute for evaluation of pregnancy-related or non-coronary emergencies. Route according to symptoms and in-person clinical assessment, never a telephone score.",
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
          "Regardless of age, risk factors or how non-cardiac the description seems, is a complete in-person assessment for this episode unavailable?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "A HEART total cannot be calculated without all five components in the intended clinical setting. No telephone low-risk or self-care tier exists.",
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
        instructionTextEn: "Call Qatar emergency services on 999 now. Keep the person resting, do not let them drive, and follow the emergency call-taker's instructions. Do not recommend aspirin, glyceryl trinitrate or other medicine unless specifically directed under an approved Qatar protocol or already prescribed for this exact situation.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening pain", "loss of consciousness", "difficulty breathing"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      },
      {
        id: "oscr-heart-inperson-advice",
        titleEn: "Chest pain requires in-person evaluation",
        instructionTextEn:
          "Arrange prompt in-person assessment at a Qatar service capable of clinical examination, a documented 12-lead ECG and measured troponin. Do not calculate, display or interpret HEART before all required components are obtained in person, and do not use HEART alone to rule out acute coronary syndrome. Do not self-drive if symptoms recur or the person feels unwell; call 999 if any emergency feature appears or acute coronary syndrome is suspected. The exact non-emergency destination, troponin strategy and transport pathway are GOVERNANCE_REQUIRED.",
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
        "Backus BE, Six AJ, Kelder JC, et al. A prospective validation of the HEART score for chest pain patients at the emergency department. Int J Cardiol. 2013;168(3):2153-2158.",
        "Gulati M, Levy PD, Mukherjee D, et al. 2021 AHA/ACC Chest Pain Guideline. Circulation. 2021;144:e368-e454."
      ],
      contentNotice:
        "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult workflow draft. Active or suspected acute coronary syndrome symptoms route directly to Qatar 999 without HEART scoring delay. HEART is never a telephone rule-out or standalone triage test; documented in-person clinician assessment, 12-lead ECG and measured troponin are mandatory before any HEART interpretation, and no telephone self-care tier exists. No child use. GOVERNANCE_REQUIRED for Qatar chest-pain destinations, emergency transport, pregnancy/postpartum pathways, medicine advice and acceptable troponin strategy. Blocked from nurse UAT pending Qatar emergency and cardiology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
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
      "UAT-only adult acute-knee-trauma pathway describing the Ottawa Knee Rule and routing for an in-person examination; it must not declare the rule negative by telephone.",
    backgroundInfoEn:
      "The Ottawa Knee Rule guides plain radiography after acute knee trauma in the population in which it was studied. Any one of five findings supports radiography: age 55 years or older, isolated patellar tenderness, fibular-head tenderness, inability to flex to 90 degrees, or inability to bear weight for four steps both immediately after injury and at assessment. Palpation, flexion and observed gait are clinical examinations and cannot be declared negative by telephone. The rule addresses fracture radiography only; it does not exclude ligament, tendon, meniscal, vascular or other injury and is not a pediatric rule.",
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
        questionTextEn: "For the in-person clinician: is the adult patient 55 years or older?",
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
        questionTextEn: "On in-person palpation, is there isolated patellar tenderness with no other bony knee tenderness?",
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
        questionTextEn: "On in-person palpation, is there fibular-head tenderness?",
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
        questionTextEn: "On an in-person examination, is the patient unable to flex the knee to 90 degrees?",
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
        questionTextEn: "Can the patient not bear weight for four steps both immediately after injury and during the in-person assessment, regardless of limping?",
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
        severity: "Urgent",
        questionTextEn: "If no criterion is reported remotely, has the patient still not had the required in-person palpation, flexion and four-step assessment?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A telephone interview cannot complete a validated Ottawa Knee Rule examination or exclude important non-fracture injury. This UAT pathway therefore makes no rule-negative/self-care determination.",
        redFlag: false,
        keywords: ["mild knee swelling", "can bear weight", "no bony tenderness"],
        careAdviceIds: ["oscr-knee-selfcare-advice"],
        telemedicineEligible: false,
        telemedicineNotesEn: "In-person examination is required before applying the Ottawa Knee Rule.",
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscr-knee-emergency-advice", titleEn: "Emergency knee injury precautions", instructionTextEn: "Call Qatar emergency services on 999 for major deformity, open injury, uncontrolled bleeding, or a cold, pale/blue, numb or weak foot. Keep the limb still, do not straighten or realign it, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "foot turning pale or blue"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscr-knee-imaging-advice", titleEn: "Positive or incomplete rule - in-person assessment", instructionTextEn: "Arrange an in-person examination at a Qatar service able to assess the limb and obtain radiography when indicated. Until assessed, protect the limb, avoid forced movement and use wrapped ice briefly if comfortable. Pregnancy does not change the rule criteria but must be disclosed so the imaging clinician can individualize radiation protection and risk-benefit decisions.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain", "new numbness", "color change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscr-knee-selfcare-advice", titleEn: "Telephone assessment cannot make the rule negative", instructionTextEn: "Arrange in-person palpation, knee flexion and observed four-step weight bearing. A negative fracture rule does not diagnose a sprain or exclude ligament, tendon or meniscal injury. The exact non-emergency Qatar destination and analgesia advice are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "new inability to bear weight", "numbness or color change develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Stiell IG, Wells GA, Vandemheen K, et al. Derivation of a decision rule for the use of radiography in acute knee injuries. Ann Emerg Med. 1995;26(4):405-413.",
        "Stiell IG, Greenberg GH, Wells GA, et al. Prospective validation of a decision rule for the use of radiography in acute knee injuries. JAMA. 1996;275(8):611-615."
      ],
      contentNotice:
        "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult workflow draft. The Ottawa Knee Rule requires in-person palpation, range-of-motion and gait assessment and must not be declared negative by telephone. It is not for children and does not exclude important soft-tissue or vascular injury. GOVERNANCE_REQUIRED for Qatar adult trauma/imaging destinations, pregnancy imaging policy, analgesia and transport. Blocked from nurse UAT pending Qatar emergency, orthopaedic and radiology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
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
      "UAT-only adult blunt-trauma cervical-spine pathway describing the NEXUS low-risk criteria and routing for in-person examination; it must not clear the cervical spine by telephone.",
    backgroundInfoEn:
      "NEXUS classifies a blunt-trauma patient as low probability only when all five clinician-assessed findings are absent: posterior midline cervical tenderness, focal neurological deficit, altered alertness, intoxication and a painful distracting injury. It supports an imaging decision; it does not diagnose every injury or replace clinical judgment. Telephone assessment cannot reliably perform these examinations, so this pathway never clears the neck remotely. It is adult-only here; children require a separate approved pediatric pathway, and older adults warrant particular caution.",
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
        questionTextEn: "On in-person examination, is there posterior midline cervical-spine tenderness?",
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
        severity: "Emergency",
        questionTextEn: "Is alertness abnormal or uncertain, including confusion, disorientation, delayed response or inability to participate reliably?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Published NEXUS altered-consciousness criterion.",
        redFlag: false,
        keywords: ["confused after injury", "not fully alert"],
        careAdviceIds: ["oscr-nexus-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 2
      },
      {
        id: "oscr-nexus-q3",
        acuityOrder: 4,
        severity: "Urgent",
        questionTextEn: "Is there evidence or uncertainty about intoxication by alcohol, drugs or medicines that could impair alertness or pain perception?",
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
        questionTextEn: "Is there a painful distracting injury, unreliable examination, high-risk clinical concern, pregnancy, or age 65 years or older?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Painful distracting injury is a published NEXUS criterion. Age, pregnancy and other clinical concerns are not additional NEXUS points; they are flagged for cautious in-person assessment and individualized imaging decisions.",
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
        severity: "Urgent",
        questionTextEn: "Even if every criterion is reported absent, has the patient not had all five NEXUS findings assessed by a qualified clinician in person?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "All five NEXUS findings must be assessed in the intended clinical setting. Telephone reports cannot establish a validated rule-negative result or authorize removal of spinal precautions.",
        redFlag: false,
        keywords: ["mild neck pain", "no red flags"],
        careAdviceIds: ["oscr-nexus-selfcare-advice"],
        telemedicineEligible: false,
        telemedicineNotesEn: "In-person cervical-spine and neurologic examination is required.",
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscr-nexus-emergency-advice", titleEn: "Emergency neck injury precautions", instructionTextEn: "Call Qatar emergency services on 999. Ask the patient to remain still in the position found unless there is immediate danger, breathing must be managed, or the 999 call-taker instructs otherwise. Do not test neck movement, remove a fitted collar, or allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening weakness or numbness", "new loss of bladder or bowel control"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscr-nexus-imaging-advice", titleEn: "Positive or uncertain NEXUS finding", instructionTextEn: "Arrange prompt in-person trauma assessment and clinician-directed imaging. Minimize unnecessary neck movement. Pregnancy must be disclosed, but should not delay emergency stabilization or necessary imaging; imaging risk-benefit decisions belong to the treating team.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new numbness, tingling, or weakness", "worsening pain"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscr-nexus-selfcare-advice", titleEn: "Telephone assessment cannot clear the cervical spine", instructionTextEn: "Arrange in-person examination. Do not use a remotely reported negative checklist to remove spinal precautions or advise home care. The exact non-emergency Qatar destination, transport and analgesia pathway are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new numbness, tingling, or weakness develops", "pain worsens"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hoffman JR, Mower WR, Wolfson AB, Todd KH, Zucker MI. Validity of a set of clinical criteria to rule out injury to the cervical spine in patients with blunt trauma. National Emergency X-Radiography Utilization Study Group. N Engl J Med. 2000;343(2):94-99.",
        "American College of Radiology. ACR Appropriateness Criteria: Acute Spinal Trauma. Revised 2024."
      ],
      contentNotice:
        "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult blunt-trauma workflow draft. NEXUS requires five in-person clinical assessments and cannot clear a cervical spine by telephone. No child applicability; older adults and unreliable examinations require particular caution. GOVERNANCE_REQUIRED for Qatar spinal-motion-restriction practice, trauma/imaging destinations, pregnancy imaging, analgesia and transport. Blocked from nurse UAT pending Qatar emergency, trauma, spinal and radiology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
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
      "UAT-only adult minor-head-injury pathway describing the Canadian CT Head Rule and routing for in-person assessment; it must not decide that CT or clinical review is unnecessary by telephone.",
    backgroundInfoEn:
      "The original Canadian CT Head Rule applies after blunt head trauma to patients aged 16 years or older with GCS 13-15 and witnessed loss of consciousness, definite amnesia or witnessed disorientation. It does not apply to minimal head injury without those entry features, age under 16, penetrating/depressed skull injury, acute focal neurological deficit, unstable major trauma, bleeding disorder/oral anticoagulant use, or seizure after injury. This adult UAT pathway uses age 18 and older. GCS, skull-fracture signs and neurological findings require in-person examination; exclusion from the rule is not reassurance.",
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
      { id: "oscr-cch-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen, including height, stairs, vehicle involvement, penetrating injury or other major trauma?" },
      { id: "oscr-cch-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is the patient under 18, pregnant, taking an anticoagulant or antiplatelet medicine, known to have a bleeding disorder, or did a seizure occur after injury?" }
    ],
    questions: [
      {
        id: "oscr-cch-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is the patient difficult to wake, increasingly confused, having a seizure, weak or numb on one side, unable to speak/walk normally, repeatedly vomiting, deteriorating, or showing suspected open/depressed or basal skull fracture, penetrating injury, uncontrolled bleeding, or unstable major trauma?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "These are emergency danger signs or populations needing immediate stabilization, not a telephone Canadian CT Head Rule calculation. Call 999 regardless of a reported score.",
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
        questionTextEn: "For the in-person clinician: is GCS below 15 at two hours, is an open/depressed or basal skull fracture suspected, has vomiting occurred two or more times, or is age 65 years or older?",
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
          "For the in-person clinician: is there retrograde amnesia longer than 30 minutes, or a dangerous mechanism (pedestrian struck by motor vehicle, occupant ejected from motor vehicle, or fall from at least 3 feet / 5 stairs)?",
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
        severity: "Urgent",
        questionTextEn:
          "Even if no criterion is reported, has the adult not had an in-person GCS, neurological and skull assessment and confirmation that the rule's entry criteria and exclusions are satisfied?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "Telephone proxies cannot establish a validated rule-negative result. Patients outside the rule, including those on anticoagulants or antiplatelets, need clinician-directed assessment rather than remote scoring. Children require a separate pediatric head-injury pathway.",
        redFlag: false,
        keywords: ["mild head injury", "brief confusion resolved"],
        careAdviceIds: ["oscr-cch-selfcare-advice"],
        telemedicineEligible: false,
        telemedicineNotesEn: "In-person GCS, neurological and skull examination is required.",
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscr-cch-emergency-advice", titleEn: "Emergency head injury precautions", instructionTextEn: "Call Qatar emergency services on 999. Do not allow self-driving. Keep the airway clear and follow the 999 call-taker; if unconscious but breathing and no spinal concern prevents it, use the recovery position. Do not give food, drink or unprescribed medicine while emergency assessment is being arranged.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "new weakness", "repeated vomiting"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscr-cch-imaging-advice", titleEn: "Rule criterion or exclusion - in-person assessment", instructionTextEn: "Arrange prompt in-person assessment at a Qatar service able to perform GCS, neurological/skull examination and CT when clinically indicated. A responsible adult should stay with the patient. Do not stop prescribed anticoagulant or antiplatelet medicine unless the treating clinician directs it. Pregnancy must be disclosed but must not delay emergency care; CT risk-benefit belongs to the treating team.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing confusion or drowsiness", "repeated vomiting", "worsening headache"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscr-cch-selfcare-advice", titleEn: "Telephone assessment cannot make the rule negative", instructionTextEn: "Arrange in-person assessment; do not use this telephone pathway to decide that CT or observation is unnecessary. Avoid alcohol, driving, sport and sedating non-prescribed medicines while awaiting review. The exact non-emergency Qatar destination and observation/discharge instructions are GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening headache", "repeated vomiting develops", "increasing confusion, drowsiness, or new weakness"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Stiell IG, Wells GA, Vandemheen K, et al. The Canadian CT Head Rule for patients with minor head injury. Lancet. 2001;357(9266):1391-1396.",
        "National Institute for Health and Care Excellence. Head injury: assessment and early management (NG232). Published 2023; updated 2025."
      ],
      contentNotice:
        "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult workflow draft. Canadian CT Head Rule entry criteria, exclusions, GCS, neurological and skull findings require in-person confirmation; it must not be calculated or declared negative by telephone. No child applicability. Anticoagulant/antiplatelet use, bleeding disorder, post-traumatic seizure and other exclusions trigger clinician assessment, not reassurance. GOVERNANCE_REQUIRED for Qatar adult trauma/CT destinations, anticoagulant and antiplatelet pathways, pregnancy imaging, observation/discharge and transport. Blocked from nurse UAT pending Qatar emergency, trauma, neurosurgery and radiology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  }
];
