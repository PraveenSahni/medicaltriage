import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";
import { addChildSafeguardingUatBranches } from "./batch09.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 13 - a coherent cluster of body-part injury topics, each decomposed
 * from the most directly relevant real, publicly available source (Crown
 * copyright NHS.UK pages reused under the Open Government Licence, or
 * standard universally-taught first-aid knowledge where noted). Elbow, Hip,
 * and Leg Injury generalize the NHS.UK "Broken arm or wrist" fracture-red-flag
 * pattern already used for Finger and Shoulder Injury (batch10/11) to other
 * limb bones/joints. Tailbone Injury generalizes the whiplash-pattern back
 * injury guidance already used for Back Injury (batch11). Eye Injury reuses
 * the NHS.UK eye injuries page already cited for Eye - Foreign Body and Eye -
 * Chemical In (batch06), applied to blunt/penetrating trauma generally.
 * Mouth Injury and Tooth Injury use standard, universally-taught emergency
 * dentistry/first-aid knowledge (knocked-out tooth handling, soft-tissue
 * bleeding control) since no single dedicated NHS.UK page covers them.
 */
const batch13ProtocolDefinitions: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Ear Injury - https://www.nhs.uk/conditions/earache/ (reviewed 2025-10-27), generalized to trauma
  // ------------------------------------------------------------------
  {
    id: "oscg-ear-injury",
    titleEn: "Ear Injury",
    clinicalDefinitionEn: "Ear trauma assessment, generalized from NHS.UK's earache guidance's hearing-loss and discharge red flags applied to injury.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "ear injury", weight: 100 },
      { phrase: "hurt my ear", weight: 90 },
      { phrase: "hit my ear", weight: 90 },
      { phrase: "punched in the ear", weight: 90 },
      { phrase: "blood coming from my ear", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-earinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the ear get injured?" },
      { id: "oscg-earinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any bleeding, discharge, or sudden hearing change?" },
      { id: "oscg-earinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-earinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, head-injury symptoms, anticoagulants or bleeding disorder, pregnancy, immune suppression, object or blast exposure, and whether the mechanism or caregiver history raises safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-earinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there reduced consciousness, seizure, repeated vomiting, severe headache, clear fluid or blood from the ear after head injury, sudden hearing loss, severe dizziness or imbalance, facial weakness, major bleeding, penetrating trauma, or an embedded object?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Clear fluid or blood from the ear after trauma can indicate a skull base fracture; consistent with NHS.UK earache guidance's discharge/hearing-loss red flags applied to a trauma context.",
        redFlag: true,
        keywords: ["fluid from ear after head injury", "sudden hearing loss after injury"],
        careAdviceIds: ["oscg-earinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-earinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the outer ear swollen, bruised, cut, or increasingly painful?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Blunt trauma to the outer ear can cause a hematoma that needs prompt drainage to prevent permanent deformity (\"cauliflower ear\").",
        redFlag: false,
        keywords: ["swollen bruised ear", "cut outer ear"],
        careAdviceIds: ["oscg-earinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-earinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bump to the ear with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A minor ear bump without bleeding, discharge, or hearing change is manageable at home.",
        redFlag: false,
        keywords: ["minor ear bump"],
        careAdviceIds: ["oscg-earinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earinjury-emergency-advice", titleEn: "Emergency ear and head-injury precautions", instructionTextEn: "Call Qatar 999 now. Do not plug, pack, irrigate, put drops into, or remove an embedded object from the ear. Keep the head and neck still, allow drainage onto a loose clean dressing without pressure, give nothing by mouth if alertness is impaired, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening dizziness, vomiting, seizure, facial weakness, or decreasing consciousness", "increasing bleeding or clear drainage"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earinjury-urgent-advice", titleEn: "Prompt in-person ear injury review", instructionTextEn: "Use the Qatar governance-approved in-person ENT or emergency pathway. A wrapped cool compress may be placed over an intact outer ear without pressure; do not drain swelling, probe the canal, or use drops. Address pediatric or vulnerable-person safeguarding privately under local policy.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["hearing change, dizziness, discharge, facial weakness, increasing swelling, or pain"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-earinjury-selfcare-advice", titleEn: "Care for a clearly minor outer-ear bump", instructionTextEn: "Use a wrapped cool compress without pressure and confirm age- and pregnancy-appropriate pain medicine with a pharmacist. Keep the canal dry and do not insert anything into it.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding, discharge, hearing change, dizziness, swelling, or worsening pain"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earache\" (discharge/hearing-loss red flags), https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025) - generalized to ear trauma"],
      contentNotice: "UAT-only generalized ear-trauma synthesis with head injury, penetrating injury, anticoagulant, age, pregnancy, immunocompromise, and safeguarding controls. Exact Qatar ENT and non-emergency pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Elbow Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/, generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-elbow-injury",
    titleEn: "Elbow Injury",
    clinicalDefinitionEn: "Elbow injury assessment, generalized from NHS.UK's published broken arm or wrist guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "elbow injury", weight: 100 },
      { phrase: "hurt my elbow", weight: 90 },
      { phrase: "fell on my elbow", weight: 95 },
      { phrase: "elbow looks deformed", weight: 100 },
      { phrase: "cant bend my elbow", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-elbowinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-elbowinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any numbness or tingling in the hand?" },
      { id: "oscg-elbowinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-elbowinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, open wound or bleeding, hand colour and warmth, movement and pulse if trained, head injury, pregnancy, anticoagulants, immune suppression, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-elbowinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there major deformity or dislocation, exposed bone, uncontrolled bleeding, a pale/blue/cold or pulseless hand, new numbness or inability to move the hand, severe crush injury, or other major trauma?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken arm or wrist guidance lists visible deformity, protruding bone, and loss of feeling or circulation as emergency-assessment criteria, applicable to elbow injuries.",
        redFlag: true,
        keywords: ["deformed elbow", "numbness in hand after elbow injury"],
        careAdviceIds: ["oscg-elbowinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-elbowinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant swelling, inability to bend or straighten the elbow, or pain that gets worse when trying to move it?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these signs as reasons to seek urgent medical assessment for a possible fracture.",
        redFlag: false,
        keywords: ["cant bend elbow", "swollen elbow"],
        careAdviceIds: ["oscg-elbowinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-elbowinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bump or strain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor limb injuries as manageable at home with rest, ice, and pain relief.",
        redFlag: false,
        keywords: ["minor elbow strain"],
        careAdviceIds: ["oscg-elbowinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-elbowinjury-emergency-advice", titleEn: "Emergency elbow injury precautions", instructionTextEn: "Call Qatar 999 now. Do not straighten, reduce, or test the joint. Support it in the position found, cover exposed bone loosely, control bleeding around rather than over protruding bone, remove rings if easy, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["hand becomes pale, blue, cold, pulseless, numb, or weak", "worsening bleeding or severe pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowinjury-urgent-advice", titleEn: "Prompt in-person elbow assessment", instructionTextEn: "Use the Qatar governance-approved in-person service. Rest and support the arm without forcing position; use a wrapped cool pack. Do not manipulate the joint. Medication advice must account for age, pregnancy, kidney disease, bleeding risk, and doses already taken.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling, new numbness, weakness, colour or temperature change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowinjury-selfcare-advice", titleEn: "Care for a clearly minor elbow injury", instructionTextEn: "Rest, use a wrapped cool pack briefly, and begin only comfortable movement. Confirm pain medicine with a pharmacist; escalate if function does not improve or any neurovascular symptom appears.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain or swelling worsens, movement reduces, or numbness, weakness, colour or temperature change develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to elbow injuries"],
      contentNotice: "UAT-only generalized elbow-injury synthesis with open fracture, neurovascular, crush, age, pregnancy, anticoagulant, immunocompromise, and safeguarding controls. Exact Qatar orthopaedic routing remains GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Eye Injury - https://www.nhs.uk/conditions/eye-injuries/, blunt/penetrating trauma
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-injury",
    titleEn: "Eye Injury",
    clinicalDefinitionEn: "UAT-only adult and pediatric eye-trauma assessment covering blunt, sharp, high-velocity, foreign-body, and chemical mechanisms with vision-threatening injuries routed directly to emergency care.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "eye injury", weight: 100 },
      { phrase: "hit in the eye", weight: 100 },
      { phrase: "punched in the eye", weight: 95 },
      { phrase: "poked in the eye", weight: 95 },
      { phrase: "something hit my eye", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyeinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was the exact mechanism: blunt impact, sharp or high-velocity object, embedded object, chemical splash, hot material, explosion, or unknown injury?" },
      { id: "oscg-eyeinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen, and for chemical exposure what product was involved and when did irrigation start?" },
      { id: "oscg-eyeinjury-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Compared with before the injury, is vision reduced, blurred, doubled, missing in part of the field, or absent in either eye?" },
      { id: "oscg-eyeinjury-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there severe pain, inability to open or move the eye, an irregular pupil, blood inside the eye, fluid leaking, a cut or puncture, or anything embedded?" },
      { id: "oscg-eyeinjury-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Was there head injury, loss of consciousness, vomiting, severe headache, confusion, seizure, or weakness?" },
      { id: "oscg-eyeinjury-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a baby or child, is the mechanism uncertain, can they not reliably report vision, or are they unable or unwilling to open or use the affected eye normally?" }
    ],
    questions: [
      {
        id: "oscg-eyeinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there any vision loss or change after injury, severe pain, chemical exposure, a sharp or high-velocity mechanism, a cut or suspected puncture of the eyeball, an embedded object, fluid leakage, blood inside the eye, irregular pupil, inability to move the eye, or associated serious head-injury features?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK and MedlinePlus guidance treats chemical exposure, vision change, severe pain, penetrating injury, embedded objects, and blood in the eye as requiring immediate care. Chemical irrigation must begin immediately, while a possible open-globe injury must be protected from pressure and not irrigated. This is a direct Qatar 999 pathway, not a redirect to a missing Eye - Chemical Injury target.",
        redFlag: true,
        keywords: ["vision loss after eye injury", "chemical eye exposure", "high velocity eye injury", "embedded object", "blood in the eye", "punctured eyeball", "irregular pupil"],
        careAdviceIds: ["oscg-eyeinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyeinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature above, is there persistent pain, redness, tearing, light sensitivity, swelling or bruising, a surface foreign-body sensation, or a child who cannot reliably report vision or use the eye normally?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Persistent ocular symptoms after trauma need prompt in-person assessment. NHS.UK advises seeking urgent advice when concerned about an eye injury, particularly in a child; telephone assessment cannot reliably exclude corneal or internal injury.",
        redFlag: false,
        keywords: ["swollen eye after injury", "black eye"],
        careAdviceIds: ["oscg-eyeinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-eyeinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this clearly a minor injury to the skin or bone around the eye, with normal vision and eye movement, no eye pain or redness, no concerning mechanism, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor injuries around the eye without vision or structural involvement as manageable at home.",
        redFlag: false,
        keywords: ["minor bump near eye"],
        careAdviceIds: ["oscg-eyeinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyeinjury-emergency-advice", titleEn: "Qatar vision-threatening eye-injury response", instructionTextEn: "Call Qatar emergency services on 999 and do not allow the person to drive. For a chemical splash without suspected penetration, protect the rescuer, remove contact lenses only if easy, and immediately rinse the open eye with a gentle flow of clean, room-temperature water for at least 20 minutes; continue while help is arranged and take the product container without delaying irrigation. Do not try to neutralize the chemical. For any embedded object, cut, puncture, high-velocity injury, fluid leak, or suspected open globe: do not irrigate, remove the object, rub, press, patch, or put drops or ointment in the eye; loosely protect it with a rigid shield or clean cup without pressure.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["any vision loss or change", "increasing pain", "chemical exposure", "embedded object or leaking fluid", "blood inside eye", "reduced consciousness or vomiting"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeinjury-urgent-advice", titleEn: "Urgent in-person eye assessment", instructionTextEn: "Arrange same-day in-person eye assessment through an approved Qatar adult or pediatric ophthalmology pathway. Do not rub the eye or attempt to remove a persistent object. A cool compress may be placed on the surrounding facial bone only when penetration is not suspected and without pressure on the eyeball. Do not use leftover anesthetic, antibiotic, steroid, or redness-relief drops. A clinician or pharmacist should confirm any age-appropriate pain medicine.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes", "pain or light sensitivity worsens", "vomiting or severe headache", "child stops using or opening the eye"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeinjury-selfcare-advice", titleEn: "Care for a clearly minor injury around the eye", instructionTextEn: "Use a wrapped cool compress on the surrounding area without pressing the eyeball. A clinician or pharmacist should confirm age-appropriate pain medicine when needed. Reassess urgently if eye pain, redness, light sensitivity, vomiting, abnormal eye movement, or any vision change develops.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["vision changes", "eye pain or redness", "increasing swelling", "vomiting or abnormal eye movement"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/ (page last reviewed 12 March 2026)",
        "US National Library of Medicine MedlinePlus, \"Eye emergencies\", https://medlineplus.gov/ency/article/000054.htm (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized adult and pediatric workflow draft. Chemical exposure and vision-threatening trauma route directly to 999; the existing missing Eye - Chemical Injury redirect is not permitted. Chemical irrigation and penetrating/open-globe protection are mutually exclusive branches and must be displayed distinctly. GOVERNANCE_REQUIRED for Qatar adult and pediatric ophthalmology destinations, chemical decontamination policy, occupational exposure, tetanus assessment, medication, and non-emergency transport. Blocked from nurse UAT pending Qatar emergency and ophthalmology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 4. Face Injury - Canadian CT Head Rule page, generalized + standard facial-fracture knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-face-injury",
    titleEn: "Face Injury",
    clinicalDefinitionEn: "Facial trauma assessment, generalized from head-injury emergency criteria plus recognized facial-fracture warning signs.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "face injury", weight: 100 },
      { phrase: "hit in the face", weight: 100 },
      { phrase: "punched in the face", weight: 95 },
      { phrase: "fell on my face", weight: 95 },
      { phrase: "face hurts after being hit", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-faceinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-faceinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any loss of consciousness, or was there a head injury too?" },
      { id: "oscg-faceinjury-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Which part of the face is affected, and are breathing, vision, eye movement, bite alignment, mouth opening, facial feeling, or nose shape changed?" },
      { id: "oscg-faceinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, anticoagulants, immune suppression, dental injury, choking, and whether assault, child injury, or an unsafe caregiver raises safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-faceinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there abnormal breathing, reduced consciousness, seizure, repeated vomiting, double or reduced vision, abnormal eye movement, inability to open the mouth, altered bite, facial numbness or weakness, uncontrolled bleeding, penetrating injury, severe deformity, or clear fluid from the nose or ear?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Facial trauma with head-injury symptoms (per the Canadian CT Head Rule's own emergency criteria) or signs of an orbital/jaw fracture (vision change, malocclusion, restricted mouth opening) needs immediate emergency care.",
        redFlag: true,
        keywords: ["double vision after face injury", "teeth dont line up", "cant open my mouth after injury"],
        careAdviceIds: ["oscg-faceinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-faceinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant facial swelling or bruising, a suspected broken nose, or a laceration that may need closure?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Facial swelling, a suspected nasal fracture, or a wound needing closure warrant prompt in-person assessment.",
        redFlag: false,
        keywords: ["facial swelling after injury", "broken nose suspected"],
        careAdviceIds: ["oscg-faceinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-faceinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bump to the face with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A minor facial bump without vision, bite, or wound complications is manageable at home.",
        redFlag: false,
        keywords: ["minor face bump"],
        careAdviceIds: ["oscg-faceinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-faceinjury-emergency-advice", titleEn: "Emergency facial-trauma precautions", instructionTextEn: "Call Qatar 999 now. Keep the head and neck still, do not allow self-driving, and control external bleeding with gentle pressure unless bone is exposed or eye injury is suspected. Do not press on the eye, straighten the nose or jaw, or give food or drink when surgery or impaired swallowing is possible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening vision, breathing, bleeding, vomiting, confusion, or consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-faceinjury-urgent-advice", titleEn: "Prompt in-person facial-trauma assessment", instructionTextEn: "Use the Qatar governance-approved trauma, maxillofacial, ENT, dental, or ophthalmology pathway. Use a wrapped cool compress without pressure on the eye and do not blow the nose when orbital fracture is possible. Address assault and safeguarding privately.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision or eye-movement change, vomiting, bite change, numbness, increasing swelling, or bleeding"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-faceinjury-selfcare-advice", titleEn: "Care for a clearly minor facial bump", instructionTextEn: "Use a wrapped cool compress and confirm pain medicine for age, pregnancy, and medical history. Reassess for delayed head, eye, dental, nose, or jaw symptoms.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["vision change, vomiting, severe headache, altered bite, numbness, increasing pain or swelling"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Stiell IG et al., \"The Canadian CT Head Rule\", Lancet 2001 (head-injury emergency criteria, already cited for the Head Injury protocol in batch02) - generalized to facial trauma; standard emergency-medicine knowledge of facial-fracture warning signs (malocclusion, restricted mouth opening)"],
      contentNotice: "SOURCE-ONLY UAT synthesis; no generated variant exists in the current 504-protocol catalog. Qatar trauma, maxillofacial, ENT, dental, ophthalmology, assault, and safeguarding routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Hip Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/, generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-hip-injury",
    titleEn: "Hip Injury",
    clinicalDefinitionEn: "Hip injury assessment, generalized from NHS.UK's published broken arm or wrist guidance's fracture criteria.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "hip injury", weight: 100 },
      { phrase: "hurt my hip", weight: 90 },
      { phrase: "fell on my hip", weight: 95 },
      { phrase: "cant put weight on my hip", weight: 100 },
      { phrase: "hip looks out of place", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hipinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-hipinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Can the person bear weight on the leg?" },
      { id: "oscg-hipinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-hipinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, osteoporosis or frailty, anticoagulants, cancer or immune suppression, head injury, collapse before the injury, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-hipinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the leg shortened, rotated or deformed, is the person unable to stand or bear weight, or is there severe pain, high-energy trauma, major bleeding, numbness or weakness, a pale/cold foot, head injury, collapse, or pregnancy trauma?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Deformity, inability to bear weight, or high-energy trauma are recognized signs of a hip fracture or dislocation, consistent with the same fracture red-flag logic NHS.UK applies to limb injuries.",
        redFlag: true,
        keywords: ["cant bear weight hip injury", "hip looks rotated", "high impact hip injury"],
        careAdviceIds: ["oscg-hipinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hipinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant swelling or bruising, or pain that limits walking but weight-bearing is still possible?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Ongoing pain limiting walking after a hip injury warrants prompt medical assessment to rule out a less obvious fracture.",
        redFlag: false,
        keywords: ["hip pain limiting walking"],
        careAdviceIds: ["oscg-hipinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hipinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bump or strain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A minor hip strain without deformity or weight-bearing difficulty is manageable at home.",
        redFlag: false,
        keywords: ["minor hip strain"],
        careAdviceIds: ["oscg-hipinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hipinjury-emergency-advice", titleEn: "Emergency hip injury precautions", instructionTextEn: "Call Qatar 999 now. Do not move, straighten, or test the leg; keep the patient warm in the position found, give nothing by mouth, and do not allow self-driving. Follow the call-handler's movement and bleeding-control instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain, collapse, confusion, or breathing change", "foot becomes pale, cold, numb, or weak"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hipinjury-urgent-advice", titleEn: "Prompt in-person hip assessment", instructionTextEn: "Use the Qatar governance-approved in-person service and avoid weight-bearing until assessed. Older, frail, pregnant, anticoagulated, or high-risk patients need a lower threshold for direct evaluation. Confirm pain medicine with a clinician or pharmacist.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening pain, inability to bear weight, faintness, confusion, numbness, or foot colour change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hipinjury-selfcare-advice", titleEn: "Care for a strictly minor hip injury", instructionTextEn: "Only when walking is normal and risk factors are absent, rest from aggravating activity and use a wrapped cool pack. Confirm medication suitability and seek assessment if pain or function does not steadily improve.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens, walking becomes difficult, or bruising, weakness, numbness, or illness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to hip injuries"],
      contentNotice: "UAT-only generalized hip-injury synthesis with occult fracture, neurovascular, age, frailty, pregnancy, anticoagulant, medical-cause, cancer, immunocompromise, and safeguarding controls. Exact Qatar trauma and orthopaedic routing remains GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Leg Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/, generalized (parallel to Arm Injury, batch06)
  // ------------------------------------------------------------------
  {
    id: "oscg-leg-injury",
    titleEn: "Leg Injury",
    clinicalDefinitionEn: "Leg injury assessment, generalized from NHS.UK's published when-to-get-help guidance for limb injuries, parallel to the existing Arm Injury protocol.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "leg injury", weight: 100 },
      { phrase: "hurt my leg", weight: 90 },
      { phrase: "broken leg", weight: 95 },
      { phrase: "fell on my leg", weight: 95 },
      { phrase: "landed on my leg", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-leginjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-leginjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Can the person bear weight on the leg?" },
      { id: "oscg-leginjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-leginjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record bleeding or open wound, foot colour, warmth, feeling, movement and pulse if trained, crush mechanism, head injury, age, pregnancy, anticoagulants, immune suppression, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-leginjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there major deformity, exposed bone, uncontrolled bleeding, severe crush injury, rapidly increasing tense swelling or pain, or is the foot pale/blue/cold, pulseless, numb, weak, or unable to move?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK limb-injury guidance lists visible deformity, protruding bone, and loss of feeling or circulation as emergency-assessment criteria.",
        redFlag: true,
        keywords: ["deformed leg", "numbness in foot after leg injury"],
        careAdviceIds: ["oscg-leginjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-leginjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person unable to bear weight, or is there significant swelling and bruising?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Inability to bear weight is a recognized fracture indicator (the same logic underlying the Ottawa Ankle and Knee Rules already used in this system) warranting prompt assessment.",
        redFlag: false,
        keywords: ["cant bear weight leg", "swollen leg after injury"],
        careAdviceIds: ["oscg-leginjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-leginjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bump or strain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A minor leg strain without deformity or weight-bearing difficulty is manageable at home.",
        redFlag: false,
        keywords: ["minor leg strain"],
        careAdviceIds: ["oscg-leginjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-leginjury-emergency-advice", titleEn: "Emergency leg injury precautions", instructionTextEn: "Call Qatar 999 now. Do not realign or test the leg. Support it in the position found, cover exposed bone loosely, control bleeding around rather than on protruding bone, keep the patient warm, give nothing by mouth, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["foot becomes pale, blue, cold, pulseless, numb, or weak", "rapidly increasing pain, swelling, bleeding, or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-leginjury-urgent-advice", titleEn: "Prompt in-person leg assessment", instructionTextEn: "Use the Qatar governance-approved in-person service, avoid weight-bearing, support the limb, and use a wrapped cool pack. Do not massage or tightly bandage a significantly swollen or potentially fractured leg. Confirm medication for age, pregnancy, kidney disease, and bleeding risk.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling, numbness, weakness, or foot colour/temperature change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-leginjury-selfcare-advice", titleEn: "Care for a clearly minor leg injury", instructionTextEn: "Rest from aggravating activity and use a wrapped cool pack briefly. Do not tightly wrap the limb; confirm pain medicine with a pharmacist and reassess walking, swelling, colour, warmth, feeling, and movement.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain or swelling worsens, weight-bearing becomes difficult, or numbness, weakness, colour or temperature change develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to leg injuries, parallel to the existing Arm Injury protocol (batch06)"],
      contentNotice: "UAT-only generalized leg-injury synthesis with open fracture, neurovascular and compartment-risk, crush, age, pregnancy, anticoagulant, immunocompromise, and safeguarding controls. Exact Qatar trauma and orthopaedic routing remains GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Mouth Injury - standard first-aid knowledge (soft-tissue/dental trauma bleeding control)
  // ------------------------------------------------------------------
  {
    id: "oscg-mouth-injury",
    titleEn: "Mouth Injury",
    clinicalDefinitionEn: "Mouth and oral soft-tissue trauma assessment, based on standard emergency first-aid knowledge for bleeding control and dental trauma.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "mouth injury", weight: 100 },
      { phrase: "hurt my mouth", weight: 90 },
      { phrase: "cut inside my mouth", weight: 95 },
      { phrase: "bit my tongue hard", weight: 90 },
      { phrase: "split my lip", weight: 90 },
      { phrase: "bit my tongue really hard", weight: 100 },
      { phrase: "bit my tongue", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mouthinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-mouthinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the bleeding under control?" },
      { id: "oscg-mouthinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any tooth loosened, displaced, broken, missing, or possibly inhaled, and is it a baby or permanent tooth?" },
      { id: "oscg-mouthinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, choking or breathing difficulty, jaw injury, anticoagulants or bleeding disorder, pregnancy, immune suppression, contamination or bite, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-mouthinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there difficulty breathing, choking or suspected inhaled tooth, inability to swallow saliva, uncontrolled bleeding, rapidly increasing tongue or floor-of-mouth swelling, reduced consciousness, major jaw or facial trauma, or a large penetrating wound?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Uncontrolled oral bleeding, airway involvement, or a completely avulsed tooth are time-critical emergencies - a knocked-out permanent tooth has the best chance of survival if reimplanted within about 30-60 minutes, well-established emergency dentistry knowledge.",
        redFlag: true,
        keywords: ["cant stop mouth bleeding", "tooth knocked completely out", "difficulty breathing after mouth injury"],
        careAdviceIds: ["oscg-mouthinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-mouthinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a moderate laceration to the lip, tongue, or inside of the cheek, or a loosened (but not knocked-out) tooth?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Moderate oral lacerations and loosened teeth need prompt evaluation for possible closure or dental splinting.",
        redFlag: false,
        keywords: ["loosened tooth after injury", "cut lip needs stitches"],
        careAdviceIds: ["oscg-mouthinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-mouthinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor bite or bump to the mouth with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Minor oral bumps and small tongue/lip bites are manageable at home with basic first aid.",
        redFlag: false,
        keywords: ["minor mouth bump", "bit my tongue"],
        careAdviceIds: ["oscg-mouthinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mouthinjury-emergency-advice", titleEn: "Emergency mouth injury precautions", instructionTextEn: "Call Qatar 999 now. Do not allow self-driving; await ambulance transport or follow the 999 call-taker's transport instructions. Sit the conscious patient forward, allow blood to drain, and use clean gauze pressure where safe. Do not blindly sweep the mouth, push loose tissue or objects deeper, or give food, drink, or medicine when breathing, swallowing, or alertness is impaired.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop, swelling increases, or breathing or consciousness changes"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthinjury-urgent-advice", titleEn: "Prompt mouth and dental injury review", instructionTextEn: "Use the Qatar governance-approved dental, maxillofacial, or emergency pathway. Apply gentle gauze pressure, preserve any tooth fragment, do not reimplant a baby tooth, and confirm medication for age, pregnancy, bleeding risk, and doses already taken.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding increases, swelling worsens, fever develops, or swallowing changes"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthinjury-selfcare-advice", titleEn: "Home care for a minor mouth injury", instructionTextEn: "Rinse gently with cool water, apply a cold compress to the outside of the lip or cheek if swollen, and avoid hot or spicy food until it heals.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding does not stop", "signs of infection develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard emergency first-aid and emergency dentistry knowledge (bleeding control, avulsed-tooth reimplantation window) - not a single-source quote"],
      contentNotice: "SOURCE-ONLY UAT synthesis; no generated variant exists in the current 504-protocol catalog and no single dedicated source is cited. Qatar dental, maxillofacial, airway, pediatric, anticoagulant, and safeguarding routes remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Tailbone Injury - generalized from Back Injury (batch11, whiplash-pattern source)
  // ------------------------------------------------------------------
  {
    id: "oscg-tailbone-injury",
    titleEn: "Tailbone Injury",
    clinicalDefinitionEn: "Tailbone (coccyx) injury assessment, generalized from the spinal-injury emergency screen already used for Back Injury.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "tailbone injury", weight: 100 },
      { phrase: "hurt my tailbone", weight: 95 },
      { phrase: "fell on my tailbone", weight: 100 },
      { phrase: "landed on my tailbone", weight: 100 },
      { phrase: "coccyx pain", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-tailboneinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-tailboneinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any numbness, tingling, or bladder/bowel control changes?" },
      { id: "oscg-tailboneinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-tailboneinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record trauma height and force, age, pregnancy, osteoporosis, cancer, immune suppression, anticoagulants, fever, rectal bleeding, head injury, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-tailboneinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there leg weakness or numbness, loss of feeling around the genitals or anus, new bladder or bowel retention or incontinence, inability to walk, severe spinal pain after major trauma, collapse, or pregnancy trauma with pain or bleeding?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal spinal-injury emergency screen, the same cauda equina criteria already applied to Back Injury - a tailbone fall can still involve the lower spine.",
        redFlag: true,
        keywords: ["leg numbness after tailbone injury", "loss of bladder control after fall on tailbone"],
        careAdviceIds: ["oscg-tailboneinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-tailboneinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the pain severe, or is there significant swelling or bruising over the tailbone?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Severe pain or significant swelling after a tailbone injury warrants prompt evaluation to rule out a fracture.",
        redFlag: false,
        keywords: ["severe tailbone pain"],
        careAdviceIds: ["oscg-tailboneinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-tailboneinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild to moderate tailbone pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild tailbone bruises are manageable at home with rest and a cushioned seat.",
        redFlag: false,
        keywords: ["mild tailbone bruise"],
        careAdviceIds: ["oscg-tailboneinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-tailboneinjury-emergency-advice", titleEn: "Emergency spinal-injury precautions", instructionTextEn: "Call Qatar 999 now. Keep the person still in the position found, avoid twisting or lifting, give nothing by mouth, and do not allow self-driving. Follow the call-handler's movement and resuscitation instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening weakness or numbness, saddle numbness, or bladder/bowel change"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-tailboneinjury-urgent-advice", titleEn: "Prompt in-person coccyx or spinal assessment", instructionTextEn: "Use the Qatar governance-approved in-person service. Avoid prolonged direct pressure and use a wedge-shaped coccyx cushion if comfortable rather than forcing a painful position. Confirm medicine for age, pregnancy, kidney disease, and bleeding risk.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness, weakness, bladder/bowel change, fever, rectal bleeding, or sharply worsening pain"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-tailboneinjury-selfcare-advice", titleEn: "Care for a strictly minor coccyx bruise", instructionTextEn: "Avoid prolonged sitting, use a coccyx-relief cushion if comfortable, use a wrapped cool pack, and keep bowel movements soft with normal fluids and fibre. Confirm medication with a pharmacist.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["numbness, weakness, bladder/bowel change, fever, rectal bleeding, or worsening pain"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK whiplash-pattern back-injury cauda equina emergency criteria (already used for the Back Injury protocol, batch11) - generalized to the tailbone"],
      contentNotice: "SOURCE-ONLY UAT generalization; no generated variant exists in the current 504-protocol catalog. Qatar spinal, trauma, pregnancy, cancer, immunocompromise, anticoagulant, and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Toe Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/, generalized (parallel to Finger Injury, batch10)
  // ------------------------------------------------------------------
  {
    id: "oscg-toe-injury",
    titleEn: "Toe Injury",
    clinicalDefinitionEn: "Toe injury assessment, generalized from NHS.UK's published broken arm or wrist guidance, parallel to the existing Finger Injury protocol.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "toe injury", weight: 100 },
      { phrase: "stubbed my toe", weight: 95 },
      { phrase: "hurt my toe", weight: 90 },
      { phrase: "dropped something on my toe", weight: 95 },
      { phrase: "toe looks crooked", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-toeinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-toeinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the toenail affected?" },
      { id: "oscg-toeinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-toeinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record open wound, colour, warmth, feeling and movement, diabetes, poor circulation, immune suppression, pregnancy, anticoagulants, age, and safeguarding concern." }
    ],
    questions: [
      {
        id: "oscg-toeinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is bone exposed, bleeding uncontrolled, or is the toe or foot pale, blue, cold, pulseless, completely numb, or unable to move after a severe crush injury?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Open fracture, uncontrolled bleeding, and neurovascular compromise require immediate emergency assessment.",
        redFlag: true,
        keywords: ["bone exposed toe", "cold blue toe after injury", "crushed toe numb"],
        careAdviceIds: ["oscg-toeinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-toeinjury-q0-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the toe deformed, displaced, very painful, or difficult to use; is the great toe involved; is the nail torn or blood trapped painfully beneath it; or does the patient have diabetes, poor circulation, immune suppression, pregnancy, or anticoagulant use?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Visible deformity or nail-bed injury suggests a possible fracture or significant soft-tissue injury needing prompt assessment.",
        redFlag: false,
        keywords: ["deformed toe", "toenail torn off"],
        careAdviceIds: ["oscg-toeinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-toeinjury-q1-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor injury to a smaller toe with intact skin, normal colour, warmth, feeling and movement, tolerable walking, no significant nail injury or high-risk condition, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Most stubbed toes are manageable at home by buddy-taping to the adjacent toe.",
        redFlag: false,
        keywords: ["minor stubbed toe"],
        careAdviceIds: ["oscg-toeinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toeinjury-emergency-advice", titleEn: "Emergency toe or foot precautions", instructionTextEn: "Call Qatar 999 now. Do not realign the toe or remove embedded material. Cover exposed bone loosely, control bleeding around it, keep the foot still and elevated if tolerated, and do not allow self-driving.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["increasing bleeding, severe pain, or pale, blue, cold, numb, or weak toe or foot"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toeinjury-urgent-advice", titleEn: "Prompt in-person toe assessment", instructionTextEn: "Use the Qatar governance-approved in-person service. Rest and elevate; do not straighten the toe, drill or drain the nail, or buddy-tape a deformed, open, great-toe, circulation-impaired, or high-risk injury. Confirm medication suitability.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling, skin breakdown, fever, numbness, or colour/temperature change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-toeinjury-selfcare-advice", titleEn: "Care for a strictly minor smaller-toe injury", instructionTextEn: "Use a wrapped cool pack, elevate, and wear roomy supportive footwear. Buddy-taping is optional only if alignment and skin are normal and circulation remains intact; place soft padding between toes and stop if pain, numbness, or colour changes.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens, walking becomes difficult, or deformity, numbness, wound, or colour change appears"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to toe injuries, parallel to the existing Finger Injury protocol (batch10)"],
      contentNotice: "SOURCE-ONLY UAT generalization; no generated variant exists in the current 504-protocol catalog. Qatar fracture, nail-bed, diabetes, circulation, pregnancy, medication, pediatric, and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Tooth Injury - standard emergency dentistry knowledge (knocked-out/loosened tooth)
  // ------------------------------------------------------------------
  {
    id: "oscg-tooth-injury",
    titleEn: "Tooth Injury",
    clinicalDefinitionEn: "Traumatic tooth injury assessment, based on standard, universally-taught emergency dentistry first-aid knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "tooth injury", weight: 100 },
      { phrase: "knocked out tooth", weight: 100 },
      { phrase: "tooth got knocked out", weight: 100 },
      { phrase: "chipped my tooth", weight: 90 },
      { phrase: "tooth feels loose after injury", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-toothinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-toothinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is a permanent (adult) tooth involved?" },
      { id: "oscg-toothinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long ago did this happen?" },
      { id: "oscg-toothinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Is the tooth accounted for, could it have been inhaled, and are there breathing difficulty, facial or jaw injury, uncontrolled bleeding, reduced consciousness, anticoagulants, pregnancy, or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-toothinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there breathing difficulty or suspected inhaled tooth, uncontrolled bleeding, reduced consciousness or major facial or jaw trauma, or was a permanent tooth completely knocked out and urgent dental care cannot be reached safely without emergency assistance?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A completely avulsed permanent tooth has the best chance of being saved if reimplanted within about 30-60 minutes - well-established, time-critical emergency dentistry knowledge.",
        redFlag: true,
        keywords: ["adult tooth knocked out", "cant stop bleeding from tooth socket"],
        careAdviceIds: ["oscg-toothinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-toothinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the tooth loosened, pushed out of position, chipped with visible pink/red inside (possible nerve exposure), or a baby tooth knocked out?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Loosened or displaced teeth and chips exposing the nerve need same-day dental assessment; a knocked-out baby tooth is generally not reimplanted but should still be checked promptly.",
        redFlag: false,
        keywords: ["tooth loosened after injury", "baby tooth knocked out", "chipped tooth exposing nerve"],
        careAdviceIds: ["oscg-toothinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-toothinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a very minor chip with no looseness, bleeding, or pain, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A very minor tooth chip without looseness or bleeding can wait for a routine dental visit.",
        redFlag: false,
        keywords: ["very minor tooth chip"],
        careAdviceIds: ["oscg-toothinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toothinjury-emergency-advice", titleEn: "Emergency dental-trauma precautions", instructionTextEn: "Call Qatar 999 for airway compromise, suspected aspiration, uncontrolled bleeding, reduced consciousness, or major facial trauma. Do not allow self-driving; await ambulance transport or follow the 999 call-taker's transport instructions. For an avulsed permanent tooth, handle only the crown; if visibly dirty, briefly rinse without scrubbing. Reinsert only if the patient is cooperative, fully alert, and there is no aspiration risk; otherwise place it in milk or an approved tooth-preservation medium. Never reinsert a baby tooth and never store a tooth in a young child's mouth.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing difficulty, missing unaccounted tooth, reduced consciousness, or bleeding that will not stop"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothinjury-urgent-advice", titleEn: "Time-critical dental injury review", instructionTextEn: "Use the Qatar governance-approved emergency-dental pathway immediately for an avulsed permanent tooth and promptly for loosened, displaced, fractured, or baby-tooth injury. Do not touch the root, scrub the tooth, reimplant a baby tooth, or force a permanent tooth into place. Confirm pain medicine for age, pregnancy, and medical history.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain, swelling, bleeding, fever, bite change, or tooth mobility"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothinjury-selfcare-advice", titleEn: "Home care for a minor tooth chip", instructionTextEn: "Avoid chewing on the affected side and book a routine dental visit to smooth or repair the chip.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain, looseness, or bleeding develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-taught emergency dentistry first-aid knowledge (avulsed permanent tooth reimplantation window and storage-medium guidance) - not a single-source quote"],
      contentNotice: "SOURCE-ONLY UAT synthesis; no generated variant exists in the current 504-protocol catalog and no single dedicated source is cited. Qatar emergency-dental access, avulsion handling, pediatric aspiration, analgesia, pregnancy, anticoagulant, and safeguarding pathways remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson content; prohibited from production use."
    })
  }
];

const batch13ChildSafeguardingProtocolIds = new Set([
  "oscg-ear-injury",
  "oscg-elbow-injury",
  "oscg-eye-injury",
  "oscg-hip-injury",
  "oscg-leg-injury"
]);

export const batch13Protocols: ProtocolInput[] =
  batch13ProtocolDefinitions.map((protocol) =>
    batch13ChildSafeguardingProtocolIds.has(protocol.id)
      ? addChildSafeguardingUatBranches(protocol)
      : protocol
  );
