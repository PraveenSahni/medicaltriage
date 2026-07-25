import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";
import { addChildSafeguardingUatBranches } from "./batch09.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 10 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Finger Injury generalizes the broken-arm-or-wrist fracture
 * criteria to digits (documented explicitly). Nose - Foreign Body reuses the
 * Earache "do not attempt removal" first-aid pattern plus the Broken Nose
 * page's breathing-difficulty criterion. Puncture Wound reuses Cuts and
 * Grazes. Post-Op Symptoms and Questions synthesizes general wound-infection
 * red flags already established (Cuts and Grazes, Boils) since no single
 * dedicated NHS.UK post-operative page exists - documented as a synthesis,
 * not a single-source quote.
 */
const batch10ProtocolDefinitions: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Nose Injury - https://www.nhs.uk/conditions/broken-nose/ (reviewed 2023-08-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-nose-injury",
    titleEn: "Nose Injury",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for nasal trauma, screening for major bleeding, septal haematoma, head/neck/eye injury and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "nose injury", weight: 100 },
      { phrase: "broken nose", weight: 100 },
      { phrase: "hit my nose", weight: 90 },
      { phrase: "hurt my nose", weight: 85 },
      { phrase: "hit in the nose", weight: 100 },
      { phrase: "nose looks crooked", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-noseinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-noseinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-noseinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any bleeding, and has it stopped?" },
      { id: "oscg-noseinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant or anticoagulated; and are there loss of consciousness, vomiting, vision/neck symptoms, clear fluid, internal swelling, deliberate injury or inconsistent history?" }
    ],
    questions: [
      {
        id: "oscg-noseinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there a nosebleed that will not stop, a large open wound with something in it, clear watery fluid trickling from the nose, a severe headache with blurred or double vision, eye pain, neck pain or stiffness with tingling in the arms, a purple swelling inside the nose blocking breathing, vomiting, or loss of consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK broken nose guidance lists these as call-999/A&E criteria - some suggest a serious head injury, not just a nose fracture.",
        redFlag: true,
        keywords: ["nosebleed wont stop after injury", "clear fluid from nose", "purple swelling nose"],
        careAdviceIds: ["oscg-noseinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-noseinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Is the nose crooked since the injury, has swelling not started to go down after 3 days, are painkillers not helping, is there breathing difficulty once swelling subsides, or are there regular nosebleeds or fever?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["crooked nose after injury", "nose swelling not going down"],
        careAdviceIds: ["oscg-noseinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-noseinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this mild bruising or swelling with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A fracture, septal haematoma and safeguarding risk cannot be excluded remotely; this UAT pathway requires in-person assessment.",
        redFlag: false,
        keywords: ["mild nose bruising"],
        careAdviceIds: ["oscg-noseinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-noseinjury-emergency-advice", titleEn: "Emergency nose injury precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient observed; if awake with isolated bleeding, sit forward and pinch the soft nose, but avoid unnecessary movement if head or neck injury is possible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "vomiting, worsening confusion or breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-noseinjury-urgent-advice", titleEn: "Urgent nose injury review", instructionTextEn: "Arrange same-day medical review, especially for a crooked nose or persistent swelling.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty develops", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-noseinjury-selfcare-advice", titleEn: "In-person nasal injury assessment", instructionTextEn: "Do not straighten or manipulate the nose. Arrange prompt in-person review through the Qatar pathway approved for UAT; medication requires age, weight, pregnancy, bleeding and interaction checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding restarts", "blocked breathing, fever, worsening pain or deformity"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-08-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken nose\", https://www.nhs.uk/conditions/broken-nose/ (page last reviewed 17 August 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Major bleeding, septal haematoma and head injury cannot be downgraded; ENT, imaging, medication and safeguarding rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 2. Pinworms - https://www.nhs.uk/conditions/threadworms/ (reviewed 2023-12-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-pinworms",
    titleEn: "Pinworms",
    clinicalDefinitionEn: "Qatar-localized UAT-only pathway for suspected pinworm infection, requiring age, pregnancy/breastfeeding, differential diagnosis and safeguarding review before treatment; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "pinworms", weight: 100 },
      { phrase: "threadworms", weight: 100 },
      { phrase: "itchy bottom worms", weight: 85 },
      { phrase: "worms in stool", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-pinworms-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How was this noticed (visible worms, itching)?" },
      { id: "oscg-pinworms-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the patient under 2 years old, pregnant, or breastfeeding?" },
      { id: "oscg-pinworms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Have other household members also been affected?" },
      { id: "oscg-pinworms-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; are there abdominal pain, vomiting, fever, bleeding, weight loss, genital/urinary symptoms, immune suppression, uncertain worm identification, neglect or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-pinworms-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Is the patient under 2 years old, is the caller pregnant or breastfeeding, or is the caller unable to tolerate the medication?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends GP advice before treatment for these groups.",
        redFlag: false,
        keywords: ["threadworms under 2 years old", "pregnant with threadworms"],
        careAdviceIds: ["oscg-pinworms-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-pinworms-q1-selfcare",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is this a straightforward case in someone over 2 years old, not pregnant or breastfeeding?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "Diagnosis, household eligibility and medication require age-, pregnancy- and patient-specific review; this UAT pathway does not prescribe.",
        redFlag: false,
        keywords: ["straightforward threadworms"],
        careAdviceIds: ["oscg-pinworms-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pinworms-routine-advice", titleEn: "Routine pinworms follow-up", instructionTextEn: "Get GP advice before treating a child under 2, or if pregnant or breastfeeding.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-pinworms-selfcare-advice", titleEn: "Clinical or pharmacist pinworm review", instructionTextEn: "Arrange review through the Qatar pathway approved for UAT before medication or household treatment. Use careful hand and nail hygiene and launder sleepwear/bedding according to locally approved infection-control advice; do not share or empirically dose medicine.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["pain, vomiting, fever, bleeding or weight loss", "symptoms persist or diagnosis is uncertain"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Threadworms\", https://www.nhs.uk/conditions/threadworms/ (page last reviewed 01 December 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar pathway with no generated IDs. Under-2, pregnancy/breastfeeding, household treatment, medication, diagnosis and safeguarding rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 3. Neurologic Deficit - https://www.nhs.uk/conditions/stroke/symptoms/ (reviewed 2024-09-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-neurologic-deficit",
    titleEn: "Neurologic Deficit",
    clinicalDefinitionEn: "Safety-first assessment of a new or sudden focal neurologic deficit in a child or adult. This protocol does not diagnose stroke or a stroke mimic; emergency assessment is required.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "neurologic deficit", weight: 90 },
      { phrase: "face drooping", weight: 100 },
      { phrase: "arm weakness one side", weight: 95 },
      { phrase: "slurred speech", weight: 95 },
      { phrase: "possible stroke", weight: 100 },
      { phrase: "face suddenly drooped", weight: 100 },
      { phrase: "slurring his words", weight: 100 },
      { phrase: "slurring words", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-neuro-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "What is the exact symptom-onset time and the last-known-well time? If symptoms were noticed on waking, when was the person last known normal before sleep?" },
      { id: "oscg-neuro-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Check for sudden face droop, one-sided arm or leg weakness or numbness, speech or understanding difficulty, new loss or double vision, severe dizziness, loss of balance or coordination, inability to walk, or a sudden severe headache." },
      { id: "oscg-neuro-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person difficult to wake, not breathing normally, or having a seizure now?" },
      { id: "oscg-neuro-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "For a child, record age and any seizure, recent head injury, fever, possible ingestion, or known neurologic condition. These details must not delay the emergency call." },
      { id: "oscg-neuro-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "Does the person have diabetes, and is a glucose reading immediately available? Checking glucose must not delay calling 999." }
    ],
    questions: [
      {
        id: "oscg-neuro-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there any sudden face droop, one-sided arm or leg weakness or numbness, abnormal speech or understanding, new loss or double vision, severe dizziness, loss of balance or coordination, inability to walk, sudden severe headache, reduced consciousness, or seizure - including in a child and even if the symptoms improved or stopped?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "FAST signs and sudden vision, balance, coordination, walking, or severe-headache symptoms can indicate stroke. Hypoglycaemia, seizure, migraine, head injury, infection, and other conditions may mimic stroke, particularly in children, but telephone triage cannot safely distinguish them and must not delay emergency assessment.",
        redFlag: true,
        keywords: ["face drooping one side", "cant lift both arms", "sudden slurred speech", "stroke symptoms stopped", "sudden double vision", "sudden loss of balance", "child sudden weakness"],
        careAdviceIds: ["oscg-neuro-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-neuro-emergency-advice",
        titleEn: "Emergency stroke precautions",
        instructionTextEn: "Call Qatar 999 for an ambulance now. Record the exact onset and last-known-well times, including the time last known normal before sleep for wake-up symptoms. Keep the person safe and at rest; do not allow self-driving and do not give food, drink, or medicines because swallowing may be unsafe. If unconscious but breathing normally, place in the recovery position if safe; if not breathing normally, follow the 999 call-handler's resuscitation instructions. A glucose check or possible alternative diagnosis must not delay the call.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["symptoms worsen", "loss of consciousness"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-09-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Stroke - Symptoms\", https://www.nhs.uk/conditions/stroke/symptoms/ (page last reviewed 12 September 2024)",
        "US CDC, \"Signs and Symptoms of Stroke\", https://www.cdc.gov/stroke/signs-symptoms/ (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis of published stroke warning signs and Qatar emergency access, adapted into IST Health's STCC-shaped triage format. It is not a diagnosis and includes pediatric and stroke-mimic prompts only to support emergency handover, never to downgrade or delay care. No non-emergency route is offered. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Post-Op Symptoms and Questions - synthesis of general wound-infection
  //    criteria (Cuts and Grazes, Boils sources already cited)
  // ------------------------------------------------------------------
  {
    id: "oscg-post-op-symptoms",
    titleEn: "Post-Op Symptoms and Questions",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for post-operative concerns, screening for bleeding, sepsis, thromboembolism, wound failure and procedure-specific complications; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "after my surgery", weight: 100 },
      { phrase: "post op", weight: 95 },
      { phrase: "surgical wound", weight: 90 },
      { phrase: "incision looks infected", weight: 90 },
      { phrase: "had surgery", weight: 90 },
      { phrase: "incision is red", weight: 100 },
      { phrase: "incision leaking fluid", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-postop-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What surgery was performed, and when?" },
      { id: "oscg-postop-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured?" },
      { id: "oscg-postop-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Describe how the surgical site looks now." },
      { id: "oscg-postop-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant/recently postpartum; and are there chest pain, breathing difficulty, leg swelling, vomiting, reduced urine, wound opening, severe pain, immune suppression, anticoagulants or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-postop-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there heavy bleeding from the surgical site, severe uncontrolled pain, chest pain, severe difficulty breathing, or is the person confused or difficult to rouse?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of general wound-care guidance - post-operative complications like serious bleeding, pulmonary embolism, or sepsis require immediate emergency care.",
        redFlag: true,
        keywords: ["heavy bleeding after surgery", "chest pain after surgery", "confused after surgery"],
        careAdviceIds: ["oscg-postop-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-postop-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the wound hot, red, swollen, and increasingly painful, or leaking pus, or does the person have a high temperature or feel hot/cold/shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "General wound-infection red flags (consistent with NHS.UK's cuts/grazes and boils guidance) applied to the post-surgical context - contact the surgical team promptly for these signs.",
        redFlag: false,
        keywords: ["infected surgical wound", "fever after surgery", "wound leaking pus"],
        careAdviceIds: ["oscg-postop-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-postop-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is recovery progressing as expected with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Expected recovery is procedure-specific and cannot be confirmed by this generic telephone pathway; the surgical team must review concerns.",
        redFlag: false,
        keywords: ["normal post op recovery"],
        careAdviceIds: ["oscg-postop-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-postop-emergency-advice", titleEn: "Emergency post-operative precautions", instructionTextEn: "Call Qatar 999 and do not drive. For external bleeding use firm pressure unless prohibited by the procedure; keep the patient resting and follow dispatcher instructions. Do not give food, drink or new medicine.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening bleeding or collapse", "breathing difficulty, chest pain or reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-postop-urgent-advice", titleEn: "Urgent post-op wound review", instructionTextEn: "Contact the surgical team or arrange same-day medical review for these infection signs.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "wound spreads"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-postop-selfcare-advice", titleEn: "Surgical-team review of recovery", instructionTextEn: "Follow only the procedure-specific discharge plan already supplied and contact the operating team or Qatar pathway approved for UAT today. Do not change dressings, drains, diet, activity or medication beyond that plan without clinical advice.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["wound opens, bleeds, becomes red/hot or leaks fluid", "fever, vomiting, reduced urine, leg swelling, chest pain or breathlessness"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)",
        "NHS.UK, \"Boils\", https://www.nhs.uk/conditions/boils/ (page last reviewed 20 June 2023)"
      ],
      contentNotice:
        "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only multi-source Qatar pathway with no generated IDs. Procedure-specific instructions take precedence; surgical-team access, thromboembolism, infection, medication and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 5. Finger Injury - https://www.nhs.uk/conditions/broken-arm-or-wrist/ (reviewed 2023-05-26), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-finger-injury",
    titleEn: "Finger Injury",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for finger trauma, screening for neurovascular compromise, open fracture, tendon/nail injury, constricting rings and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "finger injury", weight: 100 },
      { phrase: "hurt my finger", weight: 90 },
      { phrase: "broken finger", weight: 95 },
      { phrase: "jammed my finger", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fingerinjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-fingerinjury-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-fingerinjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Can the finger be moved and bent normally?" },
      { id: "oscg-fingerinjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant/anticoagulated; is a ring constricting; and are there cold/pale/blue colour, numbness, open wound, nail injury, bite, deliberate injury or inconsistent history?" }
    ],
    questions: [
      {
        id: "oscg-fingerinjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the finger numb, tingling, or has pins and needles, is there a bad cut with heavy bleeding, is a bone sticking out of the skin, or has the finger changed shape or is at an odd angle?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK fracture guidance (broken arm/wrist) lists these as call-999/A&E criteria - the same principles apply to a finger fracture.",
        redFlag: true,
        keywords: ["numb finger after injury", "bone sticking out finger", "finger deformed"],
        careAdviceIds: ["oscg-fingerinjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fingerinjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there severe pain or inability to use the finger, worsening swelling or bruising, stiffness, or a high temperature/feeling hot, cold, or shivery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["severe finger pain", "cannot use finger", "worsening finger swelling"],
        careAdviceIds: ["oscg-fingerinjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fingerinjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this mild pain or bruising with the finger still movable and none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance provides ice, elevation, and pain-relief first-aid steps for a mild extremity injury.",
        redFlag: false,
        keywords: ["mild finger pain"],
        careAdviceIds: ["oscg-fingerinjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fingerinjury-emergency-advice", titleEn: "Emergency finger injury precautions", instructionTextEn: "Call Qatar emergency services on 999 now. Do not allow self-driving; await ambulance transport or follow the 999 call-taker's transport instructions. Keep the hand still and do not attempt to realign a deformity.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening numbness", "increasing bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingerinjury-urgent-advice", titleEn: "Urgent finger injury review", instructionTextEn: "Buddy-tape the injured finger to an adjacent one for support, apply ice wrapped in cloth for up to 20 minutes every 2-3 hours, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "new numbness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fingerinjury-selfcare-advice", titleEn: "In-person assessment for apparently mild finger injury", instructionTextEn: "Remove a ring only if it slides off easily, support the finger without forced straightening, and arrange in-person review through the Qatar UAT pathway. Medication requires age, weight, pregnancy, allergy, bleeding, kidney/liver and interaction checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain or swelling worsens", "new numbness, colour change or inability to move"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken arm or wrist\", https://www.nhs.uk/conditions/broken-arm-or-wrist/ (page last reviewed 26 May 2023) - generalized to finger/digit injuries using the same fracture red-flag criteria"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only indirect Qatar adult/pediatric pathway with no generated IDs. Neurovascular compromise and open injury cannot be downgraded; imaging, reduction, nail/tendon, medication and safeguarding rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 6. Puncture Wound - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02)
  // ------------------------------------------------------------------
  {
    id: "oscg-puncture-wound",
    titleEn: "Puncture Wound",
    clinicalDefinitionEn: "Safety-first assessment of a penetrating or puncture wound, including an embedded object, bite, needle or high-pressure injection injury, with anatomy, neurovascular status, age, and pregnancy considered.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "puncture wound", weight: 100 },
      { phrase: "stepped on a nail", weight: 90 },
      { phrase: "punctured skin", weight: 85 },
      { phrase: "something pierced my skin", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-puncture-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What caused the wound, when did it happen, and was it a bite, used needle, injection injury, high-pressure tool, dirty object, or intentional injury?" },
      { id: "oscg-puncture-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the wound, how deep may it be, and is any object or debris still embedded?" },
      { id: "oscg-puncture-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Is bleeding controlled, and beyond the wound is the limb warm and normally coloured with normal feeling, movement, and pulse if trained to check?" },
      { id: "oscg-puncture-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Does the wound involve the eye, head, neck, chest, abdomen, groin, genitals, hand, foot, or a joint?" },
      { id: "oscg-puncture-iaq5", sequence: 5, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy, immune problems, diabetes, medicines affecting bleeding, tetanus vaccination history, and any increasing pain, redness, swelling, pus, fever, or illness." },
      { id: "oscg-puncture-iaq6", sequence: 6, responseType: "OPEN_TEXT", promptTextEn: "For an animal exposure, what animal was involved, where did it occur, was skin broken or saliva introduced, and is the animal available for official assessment? Do not try to capture it." }
    ],
    questions: [
      {
        id: "oscg-puncture-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is bleeding heavy, spurting, or not controlled with firm pressure; is the person faint, pale, confused, or short of breath; is there a penetrating injury to the eye, neck, chest, abdomen, or groin; is a large or deeply embedded object present; is the limb beyond the wound pale, cold, pulseless, numb, or unable to move; or was this a high-pressure injection or injection of an unknown substance?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Uncontrolled bleeding, shock, critical-site penetration, major impalement, neurovascular compromise, and high-pressure injection can be limb- or life-threatening and require immediate emergency response.",
        redFlag: true,
        keywords: ["object stuck in wound", "deep puncture wound", "cant stop bleeding puncture", "eye puncture", "chest puncture", "cold numb limb", "high pressure injection"],
        careAdviceIds: ["oscg-puncture-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-puncture-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "If no emergency feature is present, is this an animal or human bite, used-needle injury, dirty or deep puncture, retained debris, delayed presentation, wound to a hand, foot, joint, genitals, or near a tendon; are infection signs developing; or is the patient a young child, pregnant, immunocompromised, diabetic, or unsure of tetanus protection?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "These wounds need prompt in-person assessment for cleaning, structural injury, infection, blood-borne-virus exposure, and clinician-led tetanus or rabies risk management. The exact Qatar non-emergency service and timeframe are governance-required.",
        redFlag: false,
        keywords: ["dirty puncture wound", "rusty nail wound", "no tetanus vaccine"],
        careAdviceIds: ["oscg-puncture-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-puncture-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this an adult with a small, shallow, clean, recent non-bite and non-injection puncture, normal feeling and movement, controlled bleeding, no retained material or high-risk condition, and tetanus status already confirmed current by an approved local pathway?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Only a narrowly defined low-risk wound may enter home care. If any criterion is uncertain, use the governance-approved in-person route rather than self-care.",
        redFlag: false,
        keywords: ["small clean puncture"],
        careAdviceIds: ["oscg-puncture-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-puncture-emergency-advice", titleEn: "Emergency penetrating-wound precautions", instructionTextEn: "Call Qatar 999 now. Do not remove or push on an embedded object; stabilize it with padding and apply firm pressure around it if bleeding. For bleeding without an object, use firm direct pressure with a clean dressing. Keep the person still and warm, give nothing by mouth, and do not allow self-driving. Follow the 999 call-handler's instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "faintness, confusion, breathing difficulty, or a pale cold limb"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-puncture-urgent-advice", titleEn: "Prompt in-person puncture-wound review", instructionTextEn: "Use the Qatar governance-approved in-person service and timeframe; the exact non-emergency route is not defined by this UAT protocol. Gently rinse visible contamination with clean running water, but do not probe, scrub deeply, close, or remove an embedded object. A clinician must assess cleaning, structural injury, infection, blood-borne-virus exposure, and whether tetanus vaccination or immunoglobulin, rabies prevention, or antibiotics are indicated. Pregnancy and pediatric medication choices require clinician or pharmacist confirmation.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness, swelling, pain, pus, fever, red streaking, numbness, or reduced movement", "bleeding, breathing difficulty, faintness, or limb colour/temperature change"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-puncture-selfcare-advice", titleEn: "Home first aid for a strictly low-risk puncture", instructionTextEn: "Wash hands, control minor bleeding with a clean dressing, rinse the shallow wound with clean running water, pat the surrounding skin dry, and apply a sterile non-adherent dressing. Do not use bleach, hydrogen peroxide, or deep probing. Keep it clean and reassess regularly; seek the governance-approved in-person service if any eligibility criterion becomes uncertain.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["increasing pain, redness, warmth, swelling, pus, fever, red streaking, numbness, or reduced movement", "the wound does not heal as expected"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)",
        "US CDC, \"Clinical Guidance for Wound Management to Prevent Tetanus\", https://www.cdc.gov/tetanus/hcp/clinical-guidance/ (accessed 25 July 2026)",
        "WHO, \"Rabies\", https://www.who.int/news-room/fact-sheets/detail/rabies (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis for puncture and penetrating wounds, including major trauma, neurovascular compromise, bite, needle, injection, tetanus, and rabies considerations. Tetanus, rabies, antibiotic, blood-borne-virus, pediatric, pregnancy, and exact Qatar non-emergency routing decisions remain clinician and local-governance responsibilities. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Mosquito Bite - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-mosquito-bite",
    titleEn: "Mosquito Bite",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for mosquito bites, screening for anaphylaxis, infection and travel-related febrile disease; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "mosquito bite", weight: 100 },
      { phrase: "mosquito bites", weight: 100 },
      { phrase: "bitten by mosquitoes", weight: 90 },
      { phrase: "itchy mosquito bite", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mosquito-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where are the bites?" },
      { id: "oscg-mosquito-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Any recent travel to an area with mosquito-borne disease risk?" },
      { id: "oscg-mosquito-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Any fever?" },
      { id: "oscg-mosquito-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there bleeding, severe headache, confusion, vomiting, dehydration, widespread rash, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-mosquito-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these as signs of a serious allergic reaction (anaphylaxis) requiring an immediate 999 call.",
        redFlag: true,
        keywords: ["swollen throat mosquito bite", "struggling to breathe bite reaction"],
        careAdviceIds: ["oscg-mosquito-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-mosquito-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there fever, chills, or feeling generally unwell following recent travel to an area with mosquito-borne disease risk (e.g. malaria, dengue)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Fever after travel-related mosquito exposure needs prompt evaluation to rule out mosquito-borne illness - a standard travel-medicine caution beyond the source page's own bite-specific criteria.",
        redFlag: false,
        keywords: ["fever after travel mosquito bite", "malaria risk"],
        careAdviceIds: ["oscg-mosquito-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-mosquito-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the skin around the bite hot, red, and painful, or leaking pus or fluid (signs of infection)?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance flags these infection signs as needing a pharmacist or GP review.",
        redFlag: false,
        keywords: ["infected mosquito bite"],
        careAdviceIds: ["oscg-mosquito-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-mosquito-q3-selfcare",
        acuityOrder: 4,
        severity: "Routine",
        questionTextEn: "Are these typical itchy mosquito bites with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance describes minor bites without infection or allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["typical mosquito bites"],
        careAdviceIds: ["oscg-mosquito-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mosquito-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Call Qatar 999 and do not drive. Use only the patient's own prescribed adrenaline auto-injector according to its plan and dispatcher instructions; keep the patient lying unless breathing is difficult.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms persist or recur", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mosquito-urgent-advice", titleEn: "Urgent travel-fever review", instructionTextEn: "Arrange prompt medical evaluation for fever following travel to a mosquito-borne disease risk area - mention the travel history clearly.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "new symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mosquito-routine-advice", titleEn: "Routine bite follow-up", instructionTextEn: "Keep the area clean and book a routine review for signs of infection.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-mosquito-selfcare-advice", titleEn: "Review for presumed mosquito bites", instructionTextEn: "Avoid scratching, clean the area gently and arrange clinician/pharmacist review before medication selection. Record travel precisely and escalate any fever or systemic symptom.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["infection, bleeding or widespread rash", "fever, confusion, vomiting or dehydration"], displayOrder: 4, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric draft. Anaphylaxis and travel fever cannot be downgraded; malaria/dengue testing, pregnancy, medication and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 8. Leech Bite - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-leech-bite",
    titleEn: "Leech Bite",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for leech attachment or bite, using indirect bite guidance and screening for bleeding, anaphylaxis, internal attachment and infection; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "leech bite", weight: 100 },
      { phrase: "leech attached", weight: 90 },
      { phrase: "found a leech", weight: 90 },
      { phrase: "leech on my skin", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-leech-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the leech still attached?" },
      { id: "oscg-leech-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the bite?" },
      { id: "oscg-leech-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any excessive bleeding?" },
      { id: "oscg-leech-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant or anticoagulated; is attachment inside the nose/mouth/genitals; and are there dizziness, pallor, immune suppression or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-leech-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, or has anyone lost consciousness or become floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these as signs of a serious allergic reaction requiring an immediate 999 call.",
        redFlag: true,
        keywords: ["swollen throat leech bite", "struggling to breathe leech"],
        careAdviceIds: ["oscg-leech-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-leech-q1-routine",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is bleeding from the bite site prolonged (leech saliva contains an anticoagulant), or is the skin around it hot, red, and painful (signs of infection)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Leech bites bleed more and for longer than typical insect bites due to the anticoagulant in leech saliva - a documented characteristic of leech bites specifically, distinct from the general insect bite pattern, warranting review if bleeding is prolonged or infection signs develop.",
        redFlag: false,
        keywords: ["prolonged bleeding leech bite", "infected leech bite"],
        careAdviceIds: ["oscg-leech-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-leech-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this a minor leech bite with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance describes minor bites without infection or allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["minor leech bite"],
        careAdviceIds: ["oscg-leech-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-leech-emergency-advice", titleEn: "Emergency leech-bite precautions", instructionTextEn: "Call Qatar 999 and do not drive for airway symptoms, collapse or uncontrolled bleeding. Use only the patient's prescribed adrenaline auto-injector according to its plan; apply firm direct pressure to external bleeding.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms persist or recur", "loss of consciousness or continued bleeding"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-leech-routine-advice", titleEn: "Routine leech bite follow-up", instructionTextEn: "If bleeding is prolonged, apply firm direct pressure with a clean cloth. Book a routine review if bleeding continues or infection signs develop.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["bleeding does not stop with pressure", "signs of infection"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-leech-selfcare-advice", titleEn: "Prompt leech-bite assessment", instructionTextEn: "Do not apply chemicals, heat or unverified remedies or forcibly pull an internal attachment. Apply firm pressure after external detachment and arrange prompt in-person assessment through the Qatar UAT pathway.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding does not stop", "dizziness, pallor or infection develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-01", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only indirect Qatar pathway with no generated IDs. Bleeding, internal attachment and anaphylaxis cannot be downgraded; removal, infection and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 9. Nose - Foreign Body - https://www.nhs.uk/conditions/broken-nose/ + earache foreign-body pattern
  // ------------------------------------------------------------------
  {
    id: "oscg-nose-foreign-body",
    titleEn: "Nose - Foreign Body",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for a suspected nasal foreign body, prioritizing airway compromise, batteries, magnets, bleeding and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "something stuck in nose", weight: 100 },
      { phrase: "object in nose", weight: 95 },
      { phrase: "stuck up my nose", weight: 90 },
      { phrase: "put something in his nose", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-nosebody-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is stuck in the nose?" },
      { id: "oscg-nosebody-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been there?" },
      { id: "oscg-nosebody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any breathing difficulty or nosebleed?" },
      { id: "oscg-nosebody-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; could this be a battery, magnet, sharp/expanding object or unknown item; have removal attempts occurred; and are there choking, discharge, fever, pain, deliberate insertion or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-nosebody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there breathing difficulty, or is the object a button battery or magnet?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Breathing difficulty from a nasal obstruction, or a button battery/magnet (which can cause rapid tissue damage), requires emergency care - standard first-aid safety practice for foreign bodies.",
        redFlag: true,
        keywords: ["breathing difficulty object in nose", "button battery in nose"],
        careAdviceIds: ["oscg-nosebody-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-nosebody-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there something stuck in the nose that hasn't come out on its own?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Standard first-aid practice: do not try to remove an object stuck deep in the nose with tools, as this can push it further in or cause injury - arrange professional removal.",
        redFlag: false,
        keywords: ["stuck in nose"],
        careAdviceIds: ["oscg-nosebody-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-nosebody-emergency-advice", titleEn: "Emergency nasal foreign body precautions", instructionTextEn: "Call Qatar 999 and do not drive for breathing difficulty or a battery/magnet. Do not attempt removal, induce sneezing, add liquid or food, or allow the patient to sniff forcefully.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens", "bleeding, drowsiness or choking develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-nosebody-urgent-advice", titleEn: "Controlled nasal foreign-body removal", instructionTextEn: "Arrange same-day in-person removal through the Qatar pathway approved for UAT. Do not use fingers, cotton buds, tweezers, suction, irrigation or repeated blowing attempts; keep the patient observed and discourage sniffing.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty develops", "bleeding, pain, fever or foul discharge"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Broken nose\", https://www.nhs.uk/conditions/broken-nose/ (page last reviewed 17 August 2023) - breathing-difficulty criterion; standard first-aid practice for foreign-body removal (not a direct NHS.UK quote)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only Qatar adult/pediatric synthesis with no generated IDs. Airway compromise, batteries and magnets cannot be downgraded; ENT removal, destination and safeguarding rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 10. Poison Ivy - Oak - Sumac - https://www.nhs.uk/conditions/contact-dermatitis/ (reviewed 2023-05-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-poison-ivy-oak-sumac",
    titleEn: "Poison Ivy - Oak - Sumac",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for suspected plant contact dermatitis, screening for anaphylaxis, eye/mucosal exposure, widespread blistering, infection and immune risk; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "poison ivy", weight: 100 },
      { phrase: "poison oak", weight: 100 },
      { phrase: "poison sumac", weight: 100 },
      { phrase: "itchy rash from plant", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-poisonivy-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the rash?" },
      { id: "oscg-poisonivy-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long ago was the plant contact?" },
      { id: "oscg-poisonivy-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any blistering or oozing?" },
      { id: "oscg-poisonivy-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; are eyes, mouth, face or genitals involved; and are there breathing symptoms, fever, severe pain, widespread blistering, immune suppression, uncertain plant/chemical exposure or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-poisonivy-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden swelling of the lips, mouth, throat, or tongue, or difficulty breathing along with the rash?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the contact dermatitis guidance itself - severe allergic swelling or breathing difficulty requires immediate care, distinct from typical contact dermatitis.",
        redFlag: true,
        keywords: ["swollen throat with rash", "breathing difficulty with plant rash"],
        careAdviceIds: ["oscg-poisonivy-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-poisonivy-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Are symptoms persistent, recurrent, or severe, or has the triggering substance not responded to treatment?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a GP for persistent, recurrent, or severe contact dermatitis symptoms.",
        redFlag: false,
        keywords: ["severe contact dermatitis", "persistent plant rash"],
        careAdviceIds: ["oscg-poisonivy-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-poisonivy-q2-selfcare",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is this a mild, typical case with none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: a pharmacist can recommend emollients (moisturisers) for mild contact dermatitis.",
        redFlag: false,
        keywords: ["mild plant rash"],
        careAdviceIds: ["oscg-poisonivy-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-poisonivy-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient lying unless breathing is difficult; use only their prescribed adrenaline auto-injector according to its plan and dispatcher instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens", "swelling spreads or consciousness reduces"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-poisonivy-routine-advice", titleEn: "Contact dermatitis follow-up", instructionTextEn: "Arrange in-person primary-care review through the Qatar pathway approved for UAT to confirm the cause and assess whether dermatology input is needed.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "not improving with treatment"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-poisonivy-selfcare-advice", titleEn: "Review for suspected plant dermatitis", instructionTextEn: "Avoid further exposure, gently wash exposed skin and contaminated clothing, and arrange clinician/pharmacist review before creams or medicines are selected. Do not burn suspected plants because smoke exposure may be hazardous.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["rash worsens, spreads, blisters or becomes infected", "eye, mouth, breathing or systemic symptoms"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-05-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Contact dermatitis\", https://www.nhs.uk/conditions/contact-dermatitis/ (page last reviewed 03 May 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult/pediatric indirect plant-dermatitis pathway. Anaphylaxis and mucosal involvement cannot be downgraded; plant identification, medication, decontamination and destination rules remain GOVERNANCE_REQUIRED."
    })
  }
];

const batch10ChildSafeguardingProtocolIds = new Set([
  "oscg-nose-injury",
  "oscg-puncture-wound"
]);

export const batch10Protocols: ProtocolInput[] =
  batch10ProtocolDefinitions.map((protocol) =>
    batch10ChildSafeguardingProtocolIds.has(protocol.id)
      ? addChildSafeguardingUatBranches(protocol)
      : protocol
  );
