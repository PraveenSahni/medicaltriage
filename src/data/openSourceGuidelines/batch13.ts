import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

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
export const batch13Protocols: ProtocolInput[] = [
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
      { id: "oscg-earinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-earinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there clear fluid or blood coming from the ear after a head injury, sudden hearing loss, severe dizziness, or an object embedded in the ear?",
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-earinjury-emergency-advice", titleEn: "Emergency ear injury precautions", instructionTextEn: "Do not pack or plug the ear. Keep the head still and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening dizziness", "decreasing consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-earinjury-urgent-advice", titleEn: "Urgent ear injury review", instructionTextEn: "Apply a cold compress and arrange same-day medical review to prevent lasting deformity.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing swelling or pain"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-earinjury-selfcare-advice", titleEn: "Home care for a minor ear bump", instructionTextEn: "Apply a cold compress for swelling and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding, discharge, or hearing change develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Earache\" (discharge/hearing-loss red flags), https://www.nhs.uk/conditions/earache/ (page last reviewed 27 October 2025) - generalized to ear trauma"],
      contentNotice: "No dedicated NHS.UK page exists for ear trauma specifically. This protocol generalizes NHS.UK's earache guidance's discharge and sudden-hearing-loss red flags to an injury context, combined with widely-recognized emergency medicine knowledge about auricular hematoma - a documented generalization. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-elbowinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-elbowinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the elbow look visibly deformed or out of place, is there a bone showing through the skin, or is there numbness, tingling, or loss of pulse in the hand?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken arm or wrist guidance lists visible deformity, protruding bone, and loss of feeling or circulation as call-999/A&E criteria, applicable to elbow injuries.",
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-elbowinjury-emergency-advice", titleEn: "Emergency elbow injury precautions", instructionTextEn: "Do not try to realign the elbow. Support it in the most comfortable position and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["hand turns pale or cold", "worsening numbness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowinjury-urgent-advice", titleEn: "Urgent elbow injury review", instructionTextEn: "Rest and support the arm in a sling if possible and arrange same-day medical review for a possible fracture.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-elbowinjury-selfcare-advice", titleEn: "Home care for a minor elbow injury", instructionTextEn: "Rest the arm, apply a cold compress, and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "swelling increases or numbness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to elbow injuries"],
      contentNotice: "No dedicated NHS.UK page exists for elbow injuries specifically. This protocol generalizes NHS.UK's broken arm or wrist guidance's fracture red-flag criteria (deformity, protruding bone, loss of feeling/circulation) to the elbow - a documented generalization, following the same pattern already used for Finger Injury and Shoulder Injury. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Eye Injury - https://www.nhs.uk/conditions/eye-injuries/, blunt/penetrating trauma
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-injury",
    titleEn: "Eye Injury",
    clinicalDefinitionEn: "Blunt or penetrating eye trauma assessment decomposed from NHS.UK's published eye injuries guidance.",
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
      { id: "oscg-eyeinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the eye get injured?" },
      { id: "oscg-eyeinjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any change in vision?" },
      { id: "oscg-eyeinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-eyeinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden vision loss or change, severe eye pain, a cut to the eyeball or eyelid, something embedded in the eye, or blood visible in the eye?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK eye injuries guidance lists vision change, severe pain, a cut to the eye, an embedded object, and visible blood in the eye as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["vision loss after eye injury", "blood in the eye", "cut to the eyeball"],
        careAdviceIds: ["oscg-eyeinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyeinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant swelling or bruising around the eye, or persistent pain and light sensitivity?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends prompt medical review for these signs even without a definite vision change.",
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
        questionTextEn: "Is this a minor bump near the eye with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor injuries around the eye without vision or structural involvement as manageable at home.",
        redFlag: false,
        keywords: ["minor bump near eye"],
        careAdviceIds: ["oscg-eyeinjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyeinjury-emergency-advice", titleEn: "Emergency eye injury precautions", instructionTextEn: "Do not rub, press on, or try to remove anything from the eye. Cover it loosely with a clean cloth and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening vision", "increasing pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeinjury-urgent-advice", titleEn: "Urgent eye injury review", instructionTextEn: "Apply a cold compress around (not on) the eye and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes develop", "pain worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeinjury-selfcare-advice", titleEn: "Home care for a minor injury near the eye", instructionTextEn: "Apply a cold compress for swelling and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["vision changes", "increasing pain or swelling"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Eye injuries\", https://www.nhs.uk/conditions/eye-injuries/"],
      contentNotice: "Decomposed from NHS.UK's published eye injuries guidance (Crown copyright, reused under the Open Government Licence), applied here to general blunt/penetrating trauma (the same source already cited for the Eye - Foreign Body and Eye - Chemical In protocols in batch06). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-faceinjury-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Which part of the face is affected?" }
    ],
    questions: [
      {
        id: "oscg-faceinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Was there loss of consciousness, is there double or blurred vision, cannot open the mouth fully, do the teeth no longer line up normally, or is there heavy bleeding or an open wound?",
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-faceinjury-emergency-advice", titleEn: "Emergency face injury precautions", instructionTextEn: "Keep the person still, control bleeding with gentle direct pressure, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening vision", "decreasing consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-faceinjury-urgent-advice", titleEn: "Urgent face injury review", instructionTextEn: "Apply a cold compress and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes develop", "increasing swelling"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-faceinjury-selfcare-advice", titleEn: "Home care for a minor face bump", instructionTextEn: "Apply a cold compress for swelling and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["vision changes", "increasing pain or swelling"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Stiell IG et al., \"The Canadian CT Head Rule\", Lancet 2001 (head-injury emergency criteria, already cited for the Head Injury protocol in batch02) - generalized to facial trauma; standard emergency-medicine knowledge of facial-fracture warning signs (malocclusion, restricted mouth opening)"],
      contentNotice: "No single dedicated public source covers general facial trauma triage. This protocol generalizes the Canadian CT Head Rule's head-injury emergency criteria (already used for the Head Injury protocol) to facial trauma, combined with widely-recognized emergency medicine knowledge about facial-fracture warning signs - a documented synthesis. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-hipinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-hipinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the leg visibly shortened or rotated, is the person completely unable to bear any weight, or is there severe pain with a fall from height or a high-impact accident?",
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hipinjury-emergency-advice", titleEn: "Emergency hip injury precautions", instructionTextEn: "Do not try to move or straighten the leg. Keep the person still and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "leg turns pale or cold"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hipinjury-urgent-advice", titleEn: "Urgent hip injury review", instructionTextEn: "Rest and avoid weight-bearing on the affected side, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening pain", "inability to bear weight develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hipinjury-selfcare-advice", titleEn: "Home care for a minor hip strain", instructionTextEn: "Rest, apply a cold compress, and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "difficulty walking develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to hip injuries"],
      contentNotice: "No dedicated NHS.UK page exists for hip injuries specifically. This protocol generalizes NHS.UK's broken arm or wrist guidance's fracture red-flag criteria (deformity, inability to use the limb) to the hip, combined with widely-recognized emergency medicine knowledge about hip fracture presentation (leg shortening/rotation) - a documented generalization. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-leginjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-leginjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the leg look visibly deformed or out of place, is there a bone showing through the skin, or is there numbness, tingling, or loss of pulse in the foot?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK limb-injury guidance lists visible deformity, protruding bone, and loss of feeling or circulation as call-999/A&E criteria.",
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-leginjury-emergency-advice", titleEn: "Emergency leg injury precautions", instructionTextEn: "Do not try to realign the leg. Keep it still and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["foot turns pale or cold", "worsening numbness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-leginjury-urgent-advice", titleEn: "Urgent leg injury review", instructionTextEn: "Rest and avoid weight-bearing, and arrange same-day medical review for a possible fracture.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-leginjury-selfcare-advice", titleEn: "Home care for a minor leg injury", instructionTextEn: "Rest, apply a cold compress, and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "swelling increases or numbness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to leg injuries, parallel to the existing Arm Injury protocol (batch06)"],
      contentNotice: "No dedicated NHS.UK page exists for leg injuries specifically. This protocol generalizes NHS.UK's broken arm or wrist guidance's fracture red-flag criteria to the leg, mirroring the same generalization already applied to Arm Injury. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-mouthinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any teeth loosened or knocked out?" }
    ],
    questions: [
      {
        id: "oscg-mouthinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there uncontrolled bleeding, difficulty breathing or swallowing, a large or deep laceration, or a tooth knocked completely out?",
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mouthinjury-emergency-advice", titleEn: "Emergency mouth injury precautions", instructionTextEn: "Apply firm gentle pressure with clean gauze to control bleeding. If a permanent tooth was knocked out, hold it by the crown (not the root), rinse briefly if dirty, and try to reinsert it or store it in milk - then go immediately. Arrange emergency transport now.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthinjury-urgent-advice", titleEn: "Urgent mouth injury review", instructionTextEn: "Apply gentle pressure to control bleeding and arrange same-day medical or dental review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding increases", "swelling worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mouthinjury-selfcare-advice", titleEn: "Home care for a minor mouth injury", instructionTextEn: "Rinse gently with cool water, apply a cold compress to the outside of the lip or cheek if swollen, and avoid hot or spicy food until it heals.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding does not stop", "signs of infection develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard emergency first-aid and emergency dentistry knowledge (bleeding control, avulsed-tooth reimplantation window) - not a single-source quote"],
      contentNotice: "No dedicated NHS.UK page exists for general mouth injuries. This protocol is based on widely-taught, non-proprietary emergency first-aid and emergency dentistry knowledge (oral bleeding control, the well-documented time-critical window for reimplanting a knocked-out permanent tooth). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-tailboneinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-tailboneinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there numbness, tingling, or weakness in the legs, loss of feeling around the genitals or back passage, or new problems controlling the bladder or bowel?",
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-tailboneinjury-emergency-advice", titleEn: "Emergency tailbone injury precautions", instructionTextEn: "Keep the person still, avoid twisting the spine, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening numbness", "loss of bladder or bowel control"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-tailboneinjury-urgent-advice", titleEn: "Urgent tailbone injury review", instructionTextEn: "Sit on a cushion or donut pillow to relieve pressure and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness develops", "pain worsens sharply"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-tailboneinjury-selfcare-advice", titleEn: "Home care for a mild tailbone bruise", instructionTextEn: "Sit on a cushion to relieve pressure, apply a cold compress, and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["numbness or bladder/bowel changes develop", "pain worsens"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK whiplash-pattern back-injury cauda equina emergency criteria (already used for the Back Injury protocol, batch11) - generalized to the tailbone"],
      contentNotice: "No dedicated NHS.UK page exists for tailbone (coccyx) injuries specifically. This protocol generalizes the same spinal-injury emergency screen already applied to Back Injury, since a tailbone fall can involve the lower spine - a documented generalization. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-toeinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-toeinjury-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Does the toe look visibly deformed or crooked, is there numbness, or has the toenail been torn off or is bleeding heavily underneath?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Visible deformity or nail-bed injury suggests a possible fracture or significant soft-tissue injury needing prompt assessment.",
        redFlag: false,
        keywords: ["deformed toe", "toenail torn off"],
        careAdviceIds: ["oscg-toeinjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-toeinjury-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a minor stub or bruise with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Most stubbed toes are manageable at home by buddy-taping to the adjacent toe.",
        redFlag: false,
        keywords: ["minor stubbed toe"],
        careAdviceIds: ["oscg-toeinjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toeinjury-urgent-advice", titleEn: "Urgent toe injury review", instructionTextEn: "Rest and elevate the foot and arrange same-day medical review for a possible fracture or nail-bed injury.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "the toe turns pale or cold"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toeinjury-selfcare-advice", titleEn: "Home care for a minor toe injury", instructionTextEn: "Buddy-tape the injured toe to the one next to it for support, apply a cold compress, and wear roomy, supportive footwear.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens", "the toe becomes deformed or numb"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\" (fracture red-flag criteria), https://www.nhs.uk/conditions/broken-arm-or-wrist/ - generalized to toe injuries, parallel to the existing Finger Injury protocol (batch10)"],
      contentNotice: "No dedicated NHS.UK page exists for toe injuries specifically. This protocol generalizes NHS.UK's broken arm or wrist guidance's fracture red-flag criteria to the toe, combined with standard first-aid buddy-taping technique, mirroring the same generalization already applied to Finger Injury. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-toothinjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long ago did this happen?" }
    ],
    questions: [
      {
        id: "oscg-toothinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Was a permanent (adult) tooth completely knocked out, or is there uncontrolled bleeding from the gum or socket?",
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toothinjury-emergency-advice", titleEn: "Emergency knocked-out tooth first aid", instructionTextEn: "Find the tooth and pick it up by the crown (chewing surface), never the root. If dirty, rinse briefly in water without scrubbing. Try to reinsert it gently into the socket facing the right way; if that isn't possible, store it in milk or the person's own saliva - not tap water. Go for emergency dental/medical care immediately; timing is critical.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothinjury-urgent-advice", titleEn: "Urgent tooth injury review", instructionTextEn: "Avoid chewing on the affected side and arrange same-day dental review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain", "the tooth becomes more loose"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothinjury-selfcare-advice", titleEn: "Home care for a minor tooth chip", instructionTextEn: "Avoid chewing on the affected side and book a routine dental visit to smooth or repair the chip.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain, looseness, or bleeding develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-taught emergency dentistry first-aid knowledge (avulsed permanent tooth reimplantation window and storage-medium guidance) - not a single-source quote"],
      contentNotice: "No dedicated NHS.UK page exists for traumatic tooth injuries. This protocol is based on widely-taught, non-proprietary emergency dentistry knowledge (the well-documented time-critical reimplantation window for a knocked-out permanent tooth, and safe storage media). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
