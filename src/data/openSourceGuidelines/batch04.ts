import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 04 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as batch01/03.
 *
 * Localization note (Sexual Assault or Rape): HMC publishes a dedicated
 * Sexual Assault Service at Hamad General Hospital on +974 4025 6460. Its
 * trained team provides telephone triage and explains Qatar legal processes.
 * Qatar clinical governance must still approve child/adolescent eligibility,
 * consent/assent, confidentiality limits, safeguarding/reporting, emergency
 * handover, and safe-contact procedures before nurse UAT.
 */
export const batch04Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Confusion - Delirium - https://www.nhs.uk/conditions/confusion/ (reviewed 2024-05-28)
  // ------------------------------------------------------------------
  {
    id: "oscg-confusion-delirium",
    titleEn: "Confusion - Delirium",
    clinicalDefinitionEn: "UAT-only assessment of new confusion or an acute change from developmental or cognitive baseline; sudden confusion is an emergency and this pathway must not redirect children into an adult head-injury decision rule.",
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
      { id: "oscg-confusion-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the person last at their usual cognitive or developmental baseline, and was the change sudden or gradual?" },
      { id: "oscg-confusion-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Can the person state their name, age, and current place or date as developmentally appropriate? For a child, are they recognizing caregivers, interacting, and responding as usual?" },
      { id: "oscg-confusion-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there reduced consciousness, a seizure, new one-sided weakness, facial droop, speech difficulty, severe headache, stiff neck, breathing difficulty, or recent head injury?" },
      { id: "oscg-confusion-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Is there fever or recent illness, diabetes or possible low glucose, a new or changed medicine, alcohol or drug exposure, possible poisoning, or possible carbon monoxide exposure affecting anyone else nearby?" },
      { id: "oscg-confusion-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "For a baby or a child too young to assess orientation, is there new abnormal responsiveness, failure to recognize or engage with a caregiver, marked drowsiness, or another acute change from usual behavior?" }
    ],
    questions: [
      {
        id: "oscg-confusion-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has the person suddenly become confused or acutely changed from their usual cognitive or developmental baseline, including a child who is newly disoriented, abnormally drowsy, not recognizing or engaging with caregivers, or not responding normally?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance requires immediate medical help for sudden confusion because causes such as infection, stroke, hypoglycaemia, head injury, medicines, poisoning, carbon monoxide, cardiopulmonary illness, or seizure may be life-threatening. In a young child, assess an acute change from developmental baseline rather than relying on adult orientation questions. This is a direct Qatar 999 disposition, not a Head Injury redirect.",
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
        questionTextEn: "With no acute change or emergency feature, has an adult gradually become more forgetful or confused, or has a child shown a persistent developmental, learning, behavioral, or cognitive change that needs clinical assessment?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK recommends clinical assessment for gradually progressive adult forgetfulness or confusion. A persistent cognitive or developmental change in a child requires a pediatric assessment and must not be treated as possible adult dementia.",
        redFlag: false,
        keywords: ["gradual forgetfulness", "long-standing confusion"],
        careAdviceIds: ["oscg-confusion-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-confusion-emergency-advice", titleEn: "Qatar emergency response for acute confusion", instructionTextEn: "Call Qatar emergency services on 999. Stay with the person, use simple words and short sentences, reassure them, and avoid repeated questioning or restraint unless needed to prevent immediate injury. Do not allow them to drive. Gather their medicines and relevant exposure information if safe. Do not redirect to the adult Canadian CT Head Rule: acute confusion after head injury requires direct emergency assessment, and that rule is not validated for children.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion or abnormal responsiveness", "loss of consciousness", "seizure", "stroke signs", "breathing difficulty", "recent head injury", "possible poisoning or carbon monoxide exposure"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-confusion-routine-advice", titleEn: "Age-appropriate cognitive follow-up", instructionTextEn: "Arrange an approved PHCC assessment for gradual adult memory or cognitive change. For a child, arrange an age-appropriate pediatric assessment rather than an adult memory pathway. Call 999 if a sudden change, reduced responsiveness, seizure, new neurological sign, or serious illness develops.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["sudden worsening", "new inability to recognize caregivers or places", "reduced responsiveness", "new neurological symptom"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-05-28", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Sudden confusion (delirium)\", https://www.nhs.uk/symptoms/confusion/ (page last reviewed 28 May 2024)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized workflow draft. Any sudden confusion or acute change from developmental baseline routes directly to 999 and must not use the adult-only Canadian CT Head Rule; no lower-acuity redirect is permitted. GOVERNANCE_REQUIRED for the Qatar pediatric destination and clinical definition of abnormal responsiveness in preverbal or developmentally delayed children. Blocked from nurse UAT pending Qatar adult and pediatric clinical approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 2. Sexual Assault or Rape - https://www.nhs.uk/live-well/sexual-health/help-after-rape-and-sexual-assault/ (reviewed 2024-11-06)
  // ------------------------------------------------------------------
  {
    id: "oscg-sexual-assault-rape",
    titleEn: "Sexual Assault or Rape",
    clinicalDefinitionEn: "UAT-only, trauma-informed safety and healthcare-routing draft after suspected or disclosed sexual assault or rape for people aged 12 years and older; it does not replace trained clinical, forensic, safeguarding, or legal assessment.",
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
      { id: "oscg-assault-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Can the caller speak privately and safely without the suspected perpetrator or another unsafe person hearing, seeing the screen, or accessing messages?" },
      { id: "oscg-assault-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Is the caller in immediate danger now, and what safe location and callback method may be used without increasing risk?" },
      { id: "oscg-assault-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there severe bleeding, breathing difficulty, loss of consciousness, suspected strangulation, severe head or neck injury, poisoning, severe pain, or another serious injury?" },
      { id: "oscg-assault-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there immediate risk of suicide, self-harm, or serious harm to another person?" },
      { id: "oscg-assault-iaq5", sequence: 5, responseType: "DURATION", promptTextEn: "When did the most recent assault happen? Ask only the minimum detail needed to arrange safe and time-sensitive care." },
      { id: "oscg-assault-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Does the caller want urgent medical care or information about injury treatment, pregnancy prevention, STI or HIV care, psychological support, or forensic examination?" },
      { id: "oscg-assault-iaq7", sequence: 7, responseType: "YES_NO", promptTextEn: "For a child or adolescent, can they speak privately and is a safe, non-offending caregiver or safeguarding professional available?" }
    ],
    questions: [
      {
        id: "oscg-assault-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the assault occurring now; is the caller in immediate danger; is safe communication impossible because the suspected perpetrator or an unsafe caregiver is present; or is there severe bleeding, breathing difficulty, loss of consciousness, suspected strangulation, severe head or neck injury, poisoning, severe pain, suicidal crisis, or another serious injury?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Immediate danger, life-threatening injury, strangulation symptoms, impaired consciousness, or acute suicide risk requires emergency response before routine forensic or follow-up care. Qatar's official emergency number is 999. Safety planning must not alert or confront a suspected perpetrator.",
        redFlag: true,
        keywords: ["immediate danger", "serious injury", "assault occurring now", "strangulation", "unsafe caregiver", "suicidal crisis"],
        careAdviceIds: ["oscg-assault-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-assault-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature above, does the caller need prompt specialist assessment for injuries, pregnancy risk, STI or HIV care, psychological support, safeguarding, or options for forensic examination, regardless of when the assault happened?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "HMC's Sexual Assault Service provides specialist medical treatment, emergency contraception, STI/HIV assessment, psychological support, and forensic examination. WHO recommends urgent survivor-centred care and notes that HIV prophylaxis and emergency contraception are time-sensitive; care should still be offered after those windows and must not depend on forensic participation.",
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
        questionTextEn: "Is the caller currently safe with no emergency feature and seeking information, ongoing healthcare, or psychological support after a past assault?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "Survivor-centred support remains appropriate regardless of when the assault occurred. HMC's specialist service accepts calls from survivors and people seeking advice; its trained team explains available care and Qatar legal processes.",
        redFlag: false,
        keywords: ["seeking support", "wants information"],
        careAdviceIds: ["oscg-assault-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-assault-emergency-advice", titleEn: "Qatar emergency safety and injury response", instructionTextEn: "If it is safe to communicate, call Qatar emergency services on 999 and provide the location and immediate threat or injury. Do not ask the affected person to drive or self-transport; use the emergency response arranged by 999. Do not confront or alert the suspected perpetrator, and do not send messages or leave voicemail if that may expose the caller. Prioritize life-saving care over evidence preservation. Use only the caller's agreed safe callback method. For a child or adolescent, do not rely on a caregiver who may be involved or unsafe; follow the approved safeguarding escalation.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["ongoing danger", "suspected strangulation or breathing difficulty", "heavy bleeding", "loss of consciousness", "severe head or neck injury", "suicidal crisis", "unsafe caregiver or perpetrator present"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-assault-urgent-advice", titleEn: "HMC specialist sexual-assault care", instructionTextEn: "Offer contact with HMC's Sexual Assault Service at Hamad General Hospital on +974 4025 6460 for specialist telephone triage and prompt medical, psychological, and forensic-care options. Explain that each part of history-taking, examination, treatment, documentation, and forensic evidence collection requires an appropriate consent process and that the person may ask to pause or stop. Some pregnancy and infection-prevention treatments are time-sensitive, so do not delay medical care. If the person wants to preserve possible evidence and it does not delay urgent care, avoid washing, eating, drinking, brushing teeth, or changing clothes after relevant contact; if any of these have already happened, still offer specialist care. Do not promise confidentiality or a choice about reporting until the HMC team has explained Qatar legal processes and the organization's approved safeguarding duties.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new or worsening injury", "breathing or swallowing difficulty after neck pressure", "caller's safety changes", "suicidal thoughts"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true },
      { id: "oscg-assault-routine-advice", titleEn: "Trauma-informed ongoing support", instructionTextEn: "Listen without blame, avoid asking the person to repeat unnecessary details, and affirm that the assault was not their fault. Offer HMC's Sexual Assault Service on +974 4025 6460 for advice and healthcare options even when the assault was not recent. Agree a safe contact method and explain confidentiality and its limits before recording or sharing sensitive information. Child/adolescent consent, caregiver involvement, mandatory reporting, and referral actions remain subject to the approved Qatar safeguarding pathway.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["caller's safety or wellbeing changes", "new injury symptoms", "suicidal thoughts"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-11-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Sexual Assault Service\", https://www.hamad.qa/EN/Hospitals-and-services/Hamad-General-Hospital/Hospital-Services/Clinical-Departments/Pages/Sexual-Assault-Service.aspx (accessed 2026-07-25)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "World Health Organization, \"Clinical management of rape and intimate partner violence survivors\", https://www.who.int/publications/i/item/9789240001411",
        "World Health Organization, \"Responding to children and adolescents who have been sexually abused\", https://www.who.int/publications/i/item/9789241550147",
        "NHS.UK, \"Help after rape and sexual assault\", https://www.nhs.uk/live-well/sexual-health/help-after-rape-and-sexual-assault/ (page last reviewed 06 November 2024)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized workflow-testing draft. HMC's official Sexual Assault Service page verifies +974 4025 6460, trained telephone triage, confidential specialist care, and medical, psychological, and forensic options; it states that its team explains Qatar legal processes. GOVERNANCE_REQUIRED and blocked from nurse UAT until Qatar clinical/legal owners approve service age eligibility, consent and adolescent assent, confidentiality limits, child and adult safeguarding/reporting duties, police/forensic interfaces, documentation, interpreter use, safe contact, perpetrator-present, disconnect, and emergency-handover procedures. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 3. Bluish Skin or Body Part (Cyanosis) - Qatar-localized UAT structure; governance review required
  // ------------------------------------------------------------------
  {
    id: "oscg-cyanosis",
    titleEn: "Bluish Skin or Body Part (Cyanosis)",
    clinicalDefinitionEn: "UAT assessment structure for a reported blue, grey, unusually pale, or otherwise abnormal colour. It separates central/generalized colour change (lips, tongue, oral mucosa, face, or widespread skin), which may reflect respiratory, cardiac, circulatory, sepsis, or hypothermia emergencies, from a colour change confined to a finger, toe, hand, or foot, which may reflect cold-related peripheral vasoconstriction, vascular compromise, compression, or trauma. Colour reports are not a diagnosis and must be interpreted with breathing, behaviour, circulation, temperature, injury, and the person's usual appearance.",
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
      { id: "oscg-cyanosis-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age, and is this colour new or different from their documented usual appearance or congenital heart-disease plan?" },
      { id: "oscg-cyanosis-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Exactly where is the colour change: lips, tongue or inside the mouth, face, widespread skin, or only one or more fingers, toes, hands, or feet? Is it one-sided or on both sides?" },
      { id: "oscg-cyanosis-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person fully responsive and breathing normally? For a baby or child, are they difficult to wake, floppy, confused, unable to feed/cry/speak normally, grunting, flaring the nostrils, drawing in under/between the ribs, having pauses, or breathing unusually fast, slow, or irregularly?" },
      { id: "oscg-cyanosis-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there severe breathlessness, choking, chest pain, collapse/fainting, seizure, confusion, cold or clammy skin, fever or suspected serious infection, or rapidly worsening illness?" },
      { id: "oscg-cyanosis-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "If confined to a limb or digit, did it start suddenly, and is there severe pain, coldness, numbness, weakness, swelling, injury, a tight cast/bandage/jewellery, or inability to move the limb?" },
      { id: "oscg-cyanosis-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Was there significant cold or wet exposure, a measured temperature below 35 C, or in a baby: cold trunk, unusual quietness, sleepiness, floppiness, or refusal to feed?" }
    ],
    questions: [
      {
        id: "oscg-cyanosis-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there a new blue, grey, very pale, or markedly abnormal colour of the lips, tongue/inside the mouth, face, or widespread skin; uncertainty about whether the change is central or only peripheral; or any colour change with abnormal breathing, choking, chest pain, collapse, seizure, confusion, reduced responsiveness, cold/clammy appearance, suspected sepsis or hypothermia? In a baby or child, include floppiness, difficulty waking, poor feeding, weak/abnormal cry, grunting, nasal flaring, chest indrawing, breathing pauses, or unusually fast, slow, or irregular breathing.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Central or generalized abnormal colour can indicate inadequate oxygenation or circulation from respiratory, cardiac, infectious, shock, or temperature-related illness. Resuscitation Council UK treats abnormal body colour together with abnormal behaviour or breathing as a sign of possible critical illness in children. Colour can be difficult to assess remotely and across skin tones: compare with the person's usual colour and inspect lips, tongue/oral mucosa, nail beds, palms, and soles, but never use apparent colour alone to dismiss abnormal breathing or behaviour.",
        redFlag: true,
        keywords: ["blue lips", "grey skin", "pale palms"],
        careAdviceIds: ["oscg-cyanosis-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-cyanosis-q1-limb-emergency",
        acuityOrder: 2,
        severity: "Emergency",
        questionTextEn: "Is the colour change confined to a finger, toe, hand, foot, arm, or leg but sudden or rapidly worsening, with severe pain, marked coldness, numbness, weakness, inability to move, major swelling, significant trauma, or a tight cast/bandage or other compression?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A sudden painful, cold, numb, weak, injured, compressed, or rapidly changing limb may have threatened blood flow or serious injury and requires emergency in-person assessment; it must not be downgraded because the lips or tongue look normal.",
        redFlag: true,
        keywords: ["blue finger", "blue toe", "cold limb", "painful limb", "numb limb", "tight cast"],
        careAdviceIds: ["oscg-cyanosis-limb-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 2
      },
      {
        id: "oscg-cyanosis-q2-peripheral-urgent",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is the colour change definitely confined to fingers, toes, hands, or feet, with normal lips/tongue/inside the mouth, normal responsiveness and breathing, no emergency limb features, but it is persistent, recurrent, unexplained, or not returning toward the person's usual colour after shelter and gentle whole-body warming?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A clearly isolated peripheral colour change without systemic or limb-threat features is not automatically central cyanosis, but persistent, recurrent, or unexplained change still needs prompt in-person assessment. The approved Qatar non-emergency route and timing remain a local governance decision.",
        redFlag: false,
        keywords: ["blue fingers", "blue toes", "peripheral colour change", "cold hands", "cold feet"],
        careAdviceIds: ["oscg-cyanosis-peripheral-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 3
      }
    ],
    careAdvice: [
      { id: "oscg-cyanosis-emergency-advice", titleEn: "Qatar emergency response for central or systemic colour change", instructionTextEn: "Call Qatar emergency services on 999 now and follow the call-taker's instructions. Keep the person with you and allow the position in which breathing is easiest; do not make them walk or drive. Use prescribed oxygen or rescue treatment only according to their personal plan. If they become unresponsive and are not breathing normally, start age-appropriate CPR as directed by 999 and use an AED if available. Do not give food, drink, or unprescribed medicine. If cold or wet, move to shelter, remove wet clothing if practical, cover with dry layers, and handle gently; do not rub the limbs or use a hot bath, heat lamp, or hot-water bottle. Do not delay 999 while trying to confirm colour by video or pulse oximetry.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["abnormal lips, tongue, oral mucosa, face, or widespread colour", "difficulty breathing or choking", "chest pain or collapse", "confusion, seizure, floppiness, or reduced responsiveness", "infant poor feeding or abnormal breathing", "suspected sepsis, shock, or hypothermia"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cyanosis-limb-emergency-advice", titleEn: "Emergency response for threatened limb or serious injury", instructionTextEn: "Call Qatar emergency services on 999 for a suddenly painful, cold, numb, weak, immobile, severely swollen, injured, compressed, or rapidly discolouring limb or digit. Keep the person and affected part at rest. If safe, remove an obvious external constricting item such as a ring before swelling worsens, but do not cut off or alter a cast or medical dressing unless instructed by emergency services. Do not rub, massage, directly heat, tightly wrap, or compress the part, and do not give food, drink, or unprescribed medicine. Do not drive. This is a direct emergency pathway; do not redirect to an unavailable limb-pain, vascular, trauma, or cold-injury protocol.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["rapidly worsening colour", "severe pain", "cold, numb, weak, or immobile limb", "major swelling or injury", "tight cast or compression", "new systemic or breathing symptom"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-cyanosis-peripheral-urgent-advice", titleEn: "Prompt in-person review for isolated peripheral colour change", instructionTextEn: "Arrange prompt same-day in-person assessment through the Qatar route approved by local clinical governance. While arranging care, move from cold or wet conditions, remove wet clothing, and warm the whole person gradually with dry layers; do not rub or massage the affected part or apply direct heat. Remove only an obvious external constricting item if safe. Remote appearance cannot confirm the cause. Call 999 immediately if colour involves the lips, tongue, inside the mouth, face, or becomes widespread; if breathing, responsiveness, feeding, chest symptoms, temperature, or general condition is abnormal; or if the limb becomes painful, cold, numb, weak, swollen, injured, or rapidly worse. Do not use a compound redirect.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["central or widespread colour change", "abnormal breathing or responsiveness", "chest pain, collapse, fever, or serious illness", "infant feeding or behaviour change", "painful, cold, numb, weak, swollen, or injured limb"], displayOrder: 3, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, emergency, respiratory/cardiac, sepsis, hypothermia, vascular, trauma, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 2026-07-25)",
        "Resuscitation Council UK, \"Paediatric Life Support (basic and advanced): 2025 Guidelines\", https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/paediatric-basic-life-support-guidelines (published 27 October 2025)",
        "NHS.UK, \"Shortness of breath\", https://www.nhs.uk/conditions/shortness-of-breath/ (page last reviewed 30 January 2024)",
        "NHS.UK, \"Bronchiolitis\", https://www.nhs.uk/conditions/bronchiolitis/ (accessed 2026-07-25)",
        "NHS.UK, \"Hypothermia\", https://www.nhs.uk/conditions/hypothermia/ (page last reviewed 09 June 2023)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Central/generalized colour change and any abnormal breathing, behaviour, circulation, serious infection, or hypothermia feature fail closed to Qatar 999; a sudden painful/cold/numb/weak/injured/compressed limb also remains an emergency. Only definitely isolated peripheral colour change without those features enters the non-emergency branch, whose service route and timing are GOVERNANCE_REQUIRED. Remote colour assessment is unreliable across lighting, cameras, and skin tones; assess the person's usual colour plus lips, tongue/oral mucosa, nail beds, palms, and soles, and do not use colour alone to downgrade abnormal breathing or behaviour. No unresolved compound redirect is permitted. Requires Qatar adult, pediatric, emergency, respiratory/cardiac, sepsis, hypothermia, vascular, trauma, and nursing approval before nurse UAT. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 4. Hair Loss - Qatar-localized UAT structure; governance review required
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
      { id: "oscg-hairloss-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, and when/how quickly did hair loss begin? This protocol starts at age 12; younger children require an approved pediatric route." },
      { id: "oscg-hairloss-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Is it patchy, all over, or a receding pattern?" },
      { id: "oscg-hairloss-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Is there scalp pain, redness, swelling, pus, blistering, chemical/thermal exposure, new medicine, fever, weight loss, restrictive eating, endocrine symptoms, pregnancy/postpartum change, hair pulling/traction, distress/self-harm concern, or a safeguarding concern?" }
    ],
    questions: [
      {
        id: "oscg-hairloss-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is hair/scalp change part of a current emergency: chemical or electrical exposure, major burn, facial/airway swelling, breathing difficulty, collapse, severe infection with confusion, poisoning/overdose, severe dehydration/malnutrition, or immediate self-harm/safeguarding danger?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Hair loss alone is generally not an emergency, but the reported presentation may be secondary to a time-critical exposure, allergic reaction, infection, poisoning, malnutrition, mental-health crisis, or safeguarding threat.",
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
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hairloss-emergency-advice", titleEn: "Qatar emergency response for the underlying danger", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Follow the relevant exposure, burn, anaphylaxis, poisoning, severe-illness, suicide-safety, or safeguarding instructions from 999. Do not apply chemicals, attempt decontamination beyond emergency instructions, or give unprescribed medicine.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["airway or breathing change", "collapse, confusion, or severe illness", "chemical/burn exposure", "self-harm or safeguarding danger"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hairloss-routine-advice", titleEn: "Governed in-person hair-loss assessment", instructionTextEn: "Arrange an in-person assessment through the Qatar route and timing approved by governance to evaluate pattern, scalp disease, medicines, nutrition, endocrine illness, pregnancy/postpartum factors, traction/pulling, and psychosocial impact. Do not start supplements, topical medicines, or hair-loss drugs without age, pregnancy, diagnosis, interaction, and laboratory review. For an adolescent, provide private age-appropriate assessment with approved caregiver and safeguarding practice.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["rapid or patchy progression", "scalp pain, inflammation, pus, or scarring", "weight loss, restrictive eating, systemic illness, or severe distress"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adolescent/adult, obstetric, dermatology, mental-health, safeguarding, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Age 12+" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hair loss\", https://www.nhs.uk/conditions/hair-loss/ (page last reviewed 24 January 2024)"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft for age 12 and older. Hair loss alone is not treated as an emergency; emergency routing applies only to a dangerous associated exposure, illness, mental-health, or safeguarding presentation. Exact Qatar route, pediatric boundary, pregnancy/postpartum pathway, tests, supplements, and medicines are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 5. Hallucinations - https://www.nhs.uk/conditions/psychosis/ (reviewed 2023-09-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-hallucinations",
    titleEn: "Hallucinations",
    clinicalDefinitionEn: "UAT-only assessment of hallucinations in people aged 12 years and older, separating medical or neurological emergencies from suspected psychosis and requiring age-appropriate mental health review.",
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
      { id: "oscg-halluc-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did this start, and was the onset sudden or gradual?" },
      { id: "oscg-halluc-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person confused, difficult to wake, having a seizure, severely agitated, unable to care for basic needs, or at immediate risk of harming themselves or another person?" },
      { id: "oscg-halluc-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Is there fever, severe headache, stiff neck, recent head injury, new neurological symptoms, pregnancy or recent birth, sleep deprivation, medicine change, alcohol or drug use or withdrawal, or possible poisoning?" },
      { id: "oscg-halluc-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the person seeing, hearing, feeling, smelling, or tasting, and are voices giving commands to harm themselves or someone else?" },
      { id: "oscg-halluc-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "For an adolescent, can they speak privately and safely, and is a trusted, non-threatening caregiver or responsible adult available?" }
    ],
    questions: [
      {
        id: "oscg-halluc-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there immediate risk of harm; command hallucinations to harm; severe agitation or inability to maintain basic safety; sudden confusion or reduced consciousness; seizure; fever with severe headache or stiff neck; recent head injury; new neurological symptoms; suspected poisoning, overdose, or severe withdrawal; or rapidly worsening symptoms after childbirth?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Hallucinations can arise from psychosis or an acute medical, neurological, toxicological, or perinatal emergency. Immediate danger or inability to remain safe requires emergency care; sudden confusion itself requires immediate assessment. This is a direct Qatar 999 disposition and must not redirect to a missing or demographically incompatible Poisoning protocol.",
        redFlag: true,
        keywords: ["danger to self or others", "command hallucinations", "sudden confusion", "seizure", "fever and stiff neck", "head injury", "poisoning or withdrawal", "postpartum deterioration"],
        careAdviceIds: ["oscg-halluc-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-halluc-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With all emergency and acute medical features excluded, are new or worsening hallucinations present now, or is this a first suspected psychotic episode?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK and NIMH guidance support prompt assessment of possible psychosis because hallucinations have multiple causes and early treatment is important. Children and adolescents require an age-appropriate pediatric or child mental health assessment, not automatic reuse of an adult pathway.",
        redFlag: false,
        keywords: ["seeing or hearing things"],
        careAdviceIds: ["oscg-halluc-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-halluc-emergency-advice", titleEn: "Qatar emergency hallucination response", instructionTextEn: "Call Qatar emergency services on 999. Stay with the person if this is safe, reduce stimulation, speak calmly in short sentences, and do not argue about or validate the hallucination as fact. Remove access to means of harm only when safe and do not allow the person to drive. If poisoning or overdose is possible, tell 999 what may have been taken; do not use an unresolved protocol redirect.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["risk of harm", "command hallucinations", "sudden confusion", "reduced consciousness", "seizure", "fever or neurological symptoms", "possible poisoning", "person becomes unreachable"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-halluc-urgent-advice", titleEn: "Urgent age-appropriate mental health assessment", instructionTextEn: "Arrange prompt assessment by an appropriately trained clinician. During the HMC National Mental Health Helpline's published hours (08:00-18:00 Saturday-Thursday), call 16000 and choose option 4. An adolescent needs a private, age-appropriate assessment with safe caregiver involvement. The organization must approve the pediatric and non-emergency out-of-hours routes before UAT. Call 999 if safety cannot be maintained or any medical or neurological red flag appears.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen rapidly", "confusion or reduced responsiveness develops", "command hallucinations or risk of harm develops", "safe supervision fails"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-09-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"National Mental Health Helpline marks six years of supporting Qatar's population\", https://hamad.qa/EN/news/2026/April/Pages/National-Mental-Health-Helpline-marks-six-years-of-supporting-Qatar%E2%80%99s-population.aspx (accessed 2026-07-25)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "National Institute of Mental Health, \"Understanding Psychosis\", https://www.nimh.nih.gov/health/publications/understanding-psychosis (accessed 2026-07-25)",
        "NHS.UK, \"Urgent support\", https://www.nhs.uk/every-mind-matters/urgent-support/ (accessed 2026-07-25)",
        "NHS.UK, \"Sudden confusion (delirium)\", https://www.nhs.uk/symptoms/confusion/ (page last reviewed 28 May 2024)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized workflow draft. Emergency medical, neurological, toxicological, perinatal, and safety features route directly to 999; no unresolved Poisoning redirect is permitted. HMC publishes 16000 option 4 for non-emergency mental health support from 08:00-18:00 Saturday-Thursday. GOVERNANCE_REQUIRED for pediatric mental health routing, perinatal routing, safe supervision, disconnect/refusal actions, and the non-emergency out-of-hours pathway. Blocked from nurse UAT pending Qatar adult, pediatric, and perinatal clinical approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 6. Muscle Jerks - Tics - Shudders - https://www.nhs.uk/conditions/tics/ (reviewed 2023-04-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-muscle-jerks-tics",
    titleEn: "Muscle Jerks - Tics - Shudders",
    clinicalDefinitionEn: "UAT-only assessment of possible tics from age 3 years, with direct fail-closed seizure screening; events in younger children must not be classified as tics by this pathway.",
    ageMin: 3,
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
      { id: "oscg-tics-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the person, when did the episodes start, and what exactly happens before, during, and after each event?" },
      { id: "oscg-tics-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is this the first suspected seizure, is an episode happening now, or is there loss of awareness, unresponsiveness, collapse, stiffening, rhythmic jerking, eye deviation, color change, or confusion or unusual sleepiness afterward?" },
      { id: "oscg-tics-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How long does each event last, do events repeat without full recovery, and is breathing normal afterward?" },
      { id: "oscg-tics-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there fever, recent head injury, possible poisoning, pregnancy, diabetes, serious injury, or a known seizure plan with prescribed rescue medicine?" },
      { id: "oscg-tics-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "If this is a child under 2 years with repeated brief clusters of sudden bending, stiffening, or head drops, especially around waking, has infantile spasm been considered?" },
      { id: "oscg-tics-iaq6", sequence: 6, responseType: "OPEN_TEXT", promptTextEn: "If the person remains fully aware, is there an urge before the movement, brief voluntary suppression, or a repeated movement or sound typical of a tic? Do not delay care to obtain a video, but record one safely if diagnostic uncertainty remains." }
    ],
    questions: [
      {
        id: "oscg-tics-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is this a first suspected seizure; is a seizure continuing for 5 minutes or longer or longer than usual; are seizures recurring without full recovery; is there failure to recover normally, breathing difficulty, serious injury, pregnancy, or an event in water; or is the person's approved emergency seizure plan ineffective or unavailable?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK seizure first aid requires emergency help for a first seizure, prolonged seizure, repeated seizures without recovery, serious injury, or breathing difficulty. These features require direct Qatar 999 care; the missing Seizure protocol must not be used as a redirect.",
        redFlag: true,
        keywords: ["first suspected seizure", "seizure five minutes", "no recovery", "breathing difficulty", "serious injury", "seizure in pregnancy", "seizure in water"],
        careAdviceIds: ["oscg-tics-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-tics-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature above, is there a possible first seizure that has fully stopped, recurrence after a long remission, diagnostic uncertainty between a tic and seizure, a new movement beginning before age 3 years, developmental regression, or suspected infantile spasms in a child under 2 years?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NICE recommends urgent specialist assessment after a first suspected seizure or recurrence after remission and specialist guidance within 24 hours for suspected infantile spasms. A child under 3 years or a person with developmental regression or loss of awareness should not be assigned to a benign tic pathway.",
        redFlag: true,
        keywords: ["possible first seizure resolved", "seizure after remission", "infantile spasms", "movement under age three", "developmental regression", "diagnostic uncertainty"],
        careAdviceIds: ["oscg-tics-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      },
      {
        id: "oscg-tics-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Do the tics occur very regularly or are becoming more frequent/severe, cause social or emotional problems, cause pain or accidental injury, interfere with daily activities, or come with anger, depression, or self-harm?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons to see a GP about tics.",
        redFlag: false,
        keywords: ["frequent tics", "tics affecting daily life", "tics with distress"],
        careAdviceIds: ["oscg-tics-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-tics-q3-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Are the tics mild and not causing problems, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: tics are not usually serious and don't damage the brain; mild tics without problems may not need GP evaluation.",
        redFlag: false,
        keywords: ["mild tics", "no problems from tics"],
        careAdviceIds: ["oscg-tics-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-tics-emergency-advice", titleEn: "Qatar seizure first aid and emergency response", instructionTextEn: "Call Qatar emergency services on 999. Time the event, protect the person from nearby hazards, cushion the head, loosen tight neck clothing, and turn them onto their side after convulsions stop if breathing. Do not restrain them, put anything in their mouth, or give food, drink, or oral medicine until fully recovered. Follow a prescribed rescue-medicine plan only if trained and authorized. Stay until recovery or handover. This is a direct emergency disposition; do not redirect to the missing Seizure protocol.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["first suspected seizure", "seizure lasts 5 minutes or longer", "repeated seizure without recovery", "difficulty breathing", "serious injury", "failure to recover normally"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-tics-urgent-advice", titleEn: "Fail-closed seizure or infantile-spasm assessment", instructionTextEn: "Do not label the event as a tic. Arrange age-appropriate urgent clinical assessment. Suspected infantile spasms in a child under 2 years require specialist pediatric neurology guidance and referral within 24 hours; a first suspected seizure requires urgent specialist follow-up even when fully resolved. Call 999 if another event begins, recovery is incomplete, breathing is abnormal, or any emergency criterion develops. The exact Qatar pediatric neurology and first-seizure destination is GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["another seizure", "reduced responsiveness", "breathing change", "developmental regression", "clusters of infant spasms"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-tics-routine-advice", titleEn: "Age-appropriate tic follow-up", instructionTextEn: "Arrange PHCC or pediatric assessment to discuss the tics and their impact. Do not reprimand the person or repeatedly draw attention to the tic. Reassess urgently if awareness changes, development regresses, or the movement pattern is no longer typical.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["tics worsen", "loss of awareness", "developmental regression", "new neurological symptoms"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-tics-selfcare-advice", titleEn: "Reassurance for clearly identified mild tics", instructionTextEn: "When seizure features and other red flags have been excluded, mild tics are usually not serious. Avoid repeatedly focusing on or criticizing the tic. Arrange clinical review if movements become more frequent or severe or cause pain, injury, distress, bullying, or interference with school, work, or daily life.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["loss of awareness or responsiveness", "tics become more frequent or severe", "pain, injury, distress, or developmental change"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-05", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NICE, \"Epilepsies in children, young people and adults\", NG217, https://www.nice.org.uk/guidance/ng217 (updated 30 January 2025)",
        "NHS.UK, \"What to do if someone has a seizure (fit)\", https://www.nhs.uk/symptoms/what-to-do-if-someone-has-a-seizure-fit/ (accessed 2026-07-25)",
        "NHS.UK, \"Tics\", https://www.nhs.uk/conditions/tics/ (page last reviewed 05 April 2023)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized workflow draft for age 3 years and older. Possible seizure emergencies route directly to 999; the absent Seizure protocol is not a valid redirect. Children under 3 years, developmental regression, suspected infantile spasms, and uncertain events are excluded from self-care and fail closed to age-appropriate assessment. GOVERNANCE_REQUIRED for Qatar first-seizure, pediatric neurology, and infantile-spasm destinations and for rescue-medicine policy. Blocked from nurse UAT pending Qatar adult and pediatric neurological approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 7. Pale Skin - https://www.nhs.uk/conditions/iron-deficiency-anaemia/ (reviewed 2024-01-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-pale-skin",
    titleEn: "Pale Skin",
    clinicalDefinitionEn: "UAT-only assessment of pallor that first excludes shock and active bleeding, then separates adult possible anaemia from pediatric pallor requiring age-appropriate investigation.",
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
      { id: "oscg-pale-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "Did the pallor appear suddenly or gradually, and how different is it from the person's usual skin, lips, palms, nail beds, or inside the lower eyelid?" },
      { id: "oscg-pale-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there active heavy bleeding, vomiting or coughing blood, black or bloody stool, bleeding in pregnancy or after birth, recent trauma or surgery, or possible internal bleeding?" },
      { id: "oscg-pale-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person cold or clammy, faint or confused, very weak, difficult to wake, breathing rapidly or with difficulty, or showing a rapid weak pulse or collapse?" },
      { id: "oscg-pale-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Is there tiredness, breathlessness, palpitations, dizziness, headache, fever, bruising, repeated infections, poor appetite, poor growth, jaundice, heavy periods, pregnancy, or known anaemia or blood disorder?" },
      { id: "oscg-pale-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "For a baby or child, is there reduced feeding, reduced activity, abnormal sleepiness, breathing difficulty, poor growth, unexplained bruising or bleeding, persistent fever, or caregiver concern that the child is significantly unwell?" }
    ],
    questions: [
      {
        id: "oscg-pale-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there active heavy bleeding or suspected internal bleeding, or pallor with collapse, confusion, reduced responsiveness, cold clammy skin, severe weakness, rapid or difficult breathing, or a rapid weak pulse suggesting shock?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS first-aid guidance identifies pale cold clammy skin, rapid shallow breathing, weakness and dizziness as shock features requiring immediate emergency help. Active bleeding or suspected internal bleeding must be managed directly and must not redirect to the missing Bleeding protocol.",
        redFlag: true,
        keywords: ["active heavy bleeding", "suspected internal bleeding", "shock signs", "cold clammy pale", "collapse", "weak rapid pulse"],
        careAdviceIds: ["oscg-pale-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-pale-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no shock or active bleeding, is this a baby, child, or young person with persistent unexplained pallor, or is any person significantly breathless, tachycardic, faint, rapidly worsening, pregnant or recently postpartum, or known to have a haemoglobin disorder?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Pallor in children has a broader differential than dietary iron deficiency and requires age-appropriate assessment; NICE advises very urgent full blood count for unexplained pallor in children and young people. Significant symptoms, pregnancy/postpartum status, or a known haemoglobin disorder also require prompt clinical review.",
        redFlag: true,
        keywords: ["child with pallor", "significant breathlessness", "fainting", "rapidly worsening pallor", "pregnancy or postpartum", "haemoglobin disorder"],
        careAdviceIds: ["oscg-pale-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      },
      {
        id: "oscg-pale-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "For an adult with all emergency and urgent features excluded, is there gradual pallor with tiredness, mild breathlessness, headache, or palpitations suggesting possible anaemia?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK lists pallor, tiredness, breathlessness, headache and palpitations as possible iron-deficiency anaemia symptoms, but diagnosis requires blood testing and evaluation of the cause rather than assumed iron treatment.",
        redFlag: false,
        keywords: ["pale skin with tiredness", "possible anemia"],
        careAdviceIds: ["oscg-pale-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-pale-emergency-advice", titleEn: "Qatar shock or bleeding emergency response", instructionTextEn: "Call Qatar emergency services on 999 and use emergency ambulance transport; do not allow self-driving. If there is visible external bleeding, apply firm direct pressure with a clean dressing unless an object is embedded; do not remove an embedded object. Keep the person warm and still. If injuries and breathing allow, lie them down; do not give food or drink. Do not use the missing Bleeding protocol as a redirect.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["continued or hidden bleeding", "worsening weakness", "collapse or loss of consciousness", "confusion", "rapid or difficult breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-pale-urgent-advice", titleEn: "Urgent age-appropriate pallor assessment", instructionTextEn: "Arrange prompt in-person assessment and blood testing through an approved Qatar adult, maternity, or pediatric pathway. Unexplained pallor in a child must not be treated as presumed dietary iron deficiency without assessment. Do not start iron solely from this protocol; iron can be harmful when unnecessary or overdosed. Call 999 if bleeding, collapse, reduced responsiveness, or breathing difficulty develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["active bleeding", "fainting or collapse", "increasing breathlessness", "reduced responsiveness", "rapid deterioration"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-pale-routine-advice", titleEn: "Adult possible-anaemia follow-up", instructionTextEn: "Arrange a PHCC assessment and blood test for possible anaemia and its cause. Do not assume iron deficiency or start iron solely because skin appears pale. Seek urgent reassessment if breathlessness, palpitations, dizziness, bleeding, or weakness increases.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen", "shortness of breath increases", "bleeding develops", "fainting"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"First aid: shock and severe bleeding\", https://www.nhs.uk/tests-and-treatments/first-aid/ (accessed 2026-07-25)",
        "NICE, \"Suspected cancer: recognition and referral\", NG12, https://www.nice.org.uk/guidance/ng12 (pallor in children and young people)",
        "Great Ormond Street Hospital, \"Anaemia\", https://www.gosh.nhs.uk/conditions-and-treatments/general-medical-conditions/anaemia/",
        "NHS.UK, \"Iron deficiency anaemia\", https://www.nhs.uk/conditions/iron-deficiency-anaemia/ (page last reviewed 26 January 2024)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized workflow draft. Shock and active or suspected internal bleeding route directly to 999; the absent Bleeding protocol is not a valid redirect. Pediatric pallor is separated from routine adult possible-anaemia assessment and requires age-appropriate investigation. GOVERNANCE_REQUIRED for exact Qatar pediatric, maternity, haematology, and urgent blood-test destinations and thresholds. Blocked from nurse UAT pending Qatar adult, pediatric, obstetric, emergency, and haematology approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 8. Poisoning - https://www.nhs.uk/conditions/poisoning/ (reviewed 2025-06-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-poisoning",
    titleEn: "Poisoning",
    clinicalDefinitionEn: "UAT-only fail-closed assessment of suspected poisoning or overdose by ingestion, inhalation, eye or skin contact, injection, or bite/sting in adults and children.",
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
      { id: "oscg-poison-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's age, approximate weight, relevant medical history, pregnancy status, current symptoms, and exact location?" },
      { id: "oscg-poison-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What substance or product was involved? Read the exact label, ingredients, strength, container size, warning symbols, and manufacturer when available; do not guess from color or appearance." },
      { id: "oscg-poison-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Was it swallowed, inhaled, injected, splashed in the eye, placed on the skin, or delivered by a bite or sting, and what is the maximum possible amount or duration of exposure?" },
      { id: "oscg-poison-iaq4", sequence: 4, responseType: "DURATION", promptTextEn: "When did the exposure occur, and has any first aid, food, drink, medicine, or attempted vomiting already occurred?" },
      { id: "oscg-poison-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is the person collapsed, difficult to wake, confused, having a seizure, choking, drooling or unable to swallow, struggling to breathe, blue or grey, severely agitated, or showing a serious burn?" },
      { id: "oscg-poison-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Was the exposure deliberate, related to self-harm, or associated with an unsafe environment or possible neglect? For a child, are other children at risk from the same unsecured substance?" },
      { id: "oscg-poison-iaq7", sequence: 7, responseType: "YES_NO", promptTextEn: "Is the original container, medicine packet, safety data sheet, or a clear photograph available to show the poison specialist without delaying care?" }
    ],
    questions: [
      {
        id: "oscg-poison-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "After a suspected exposure, is the person collapsed, unresponsive or difficult to wake, having a seizure, choking, unable to swallow, severely confused or agitated, blue or grey, not breathing normally, having severe breathing difficulty, showing a serious chemical burn, or at immediate risk after a deliberate overdose or self-harm exposure?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Life-threatening poisoning features require Qatar 999. Sidra's Qatar Poison Center explicitly states that it cannot dispatch ambulances and that life-threatening situations must call 999. Deliberate overdose also requires immediate safety and medical assessment.",
        redFlag: true,
        keywords: ["unresponsive poisoning", "abnormal breathing", "seizure", "choking", "chemical burn", "deliberate overdose", "self-harm exposure"],
        careAdviceIds: ["oscg-poison-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-poison-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With no emergency feature above, is any potentially harmful or unknown exposure suspected, including a medicine error or overdose, household or workplace chemical, gas or fume, eye or skin splash, injection, or bite or sting?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "The Qatar Poison Center provides individualized advice for adults and children based on age, weight, medical history, substance, amount, route, symptoms, and timing. An asymptomatic exposure cannot be declared safe from generic protocol logic; poison-specialist assessment is required.",
        redFlag: false,
        keywords: ["possible poisoning", "unknown substance", "medicine error", "chemical exposure", "eye or skin exposure", "inhaled poison", "bite or sting"],
        careAdviceIds: ["oscg-poison-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-poison-emergency-advice", titleEn: "Qatar poisoning emergency response", instructionTextEn: "Call Qatar emergency services on 999, use emergency ambulance transport, do not allow self-driving, and follow the call handler's instructions. Protect yourself from contamination and move away from fumes only if safe. Do not induce vomiting or give food, drink, charcoal, antidotes, or oral medicine unless 999 or the Qatar Poison Center specifically directs it. If unresponsive and not breathing normally, begin CPR if trained and safe from contamination; if unconscious but breathing, use the recovery position unless injury prevents it. Keep the original container or clear product photograph for responders without delaying care. For deliberate exposure, maintain safe supervision and remove access to remaining substances only when safe.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced responsiveness", "seizure", "abnormal breathing", "choking or inability to swallow", "blue or grey color", "serious burn", "deliberate overdose or self-harm"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-poison-urgent-advice", titleEn: "Qatar Poison Center assessment and route-specific first aid", instructionTextEn: "Call Sidra Medicine's Qatar Poison Center on +974 4003 1111 during its published hours (09:00-01:00 daily) for individualized adult or child advice; it is a phone service and cannot dispatch an ambulance. Do not wait for symptoms and do not induce vomiting or give anything by mouth unless directed. For inhalation, move to fresh air without entering an unsafe area. For eye exposure, remove contact lenses when easy and rinse immediately with plenty of room-temperature water for 15-20 minutes. For skin exposure, remove contaminated clothing while avoiding secondary exposure and rinse with plenty of room-temperature running water for at least 15 minutes; brush off a dry chemical first only when its label or a poison specialist directs this. Keep the product/container available. Outside published hours, the approved Qatar non-emergency toxicology route is GOVERNANCE_REQUIRED; call 999 for any deterioration or uncertainty about immediate safety.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["any new symptom", "drowsiness or confusion", "vomiting or drooling", "breathing difficulty", "seizure", "persistent eye pain or vision change", "worsening skin pain or burn"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-06-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Sidra Medicine, \"Qatar Poison Center\", https://www.sidra.org/clinic/children-young-peoples-services/qatar-poison-center/ (accessed 2026-07-25)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Poisoning\", https://www.nhs.uk/conditions/poisoning/ (page last reviewed 12 June 2025)",
        "US CDC/NIOSH, \"First Aid Procedures for Chemical Hazards\", https://www.cdc.gov/niosh/npg/firstaid.html",
        "National Capital Poison Center, \"First aid guidelines\", https://www.poison.org/first-aid-for-poisonings"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE. Qatar-localized workflow draft. Sidra's current Qatar Poison Center page verifies +974 4003 1111, adult and child telephone advice, hours of 09:00-01:00 daily, and that life-threatening cases must call 999. No exposure is declared safe by this protocol without poison-specialist advice. GOVERNANCE_REQUIRED for the non-emergency route from 01:00-09:00, occupational or mass chemical exposure, hazardous decontamination, deliberate overdose and safeguarding, pregnancy, envenomation, interpreter access, and organization-specific documentation. Blocked from nurse UAT pending Qatar toxicology, emergency, pediatric, mental health, and safeguarding approval. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 9. Rash - Widespread On Drugs - Qatar-localized child UAT structure; governance review required
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
      { id: "oscg-drugrash-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the child's exact age, sex, weight, allergies and medical conditions, and what prescribed, over-the-counter, traditional/herbal, or injected medicine was started, stopped, or changed? Record exact name, dose, timing, last dose, and packaging if safely available." },
      { id: "oscg-drugrash-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the rash start relative to the medication?" },
      { id: "oscg-drugrash-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Where is the rash and how fast is it spreading? Ask about facial/airway swelling, breathing/swallowing, faintness/floppiness, fever, pain, purple/non-fading spots, blisters/peeling, skin tenderness, mouth/eye/genital sores, facial swelling, vomiting, reduced urine, and safeguarding or dosing-error concerns." }
    ],
    questions: [
      {
        id: "oscg-drugrash-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there lip/mouth/throat/tongue swelling, breathing or swallowing difficulty, faintness, confusion, unusual floppiness, or collapse; a purple/non-fading rash with illness; or fever with painful skin, blisters, peeling, rapidly spreading redness, facial swelling, or sores involving the mouth, eyes, or genitals?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Airway, breathing, circulation, or responsiveness change may indicate anaphylaxis. Non-fading rash with illness may indicate sepsis, while painful blistering/peeling or mucosal involvement after medicine exposure may represent a severe cutaneous adverse reaction; all require emergency assessment.",
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
        questionTextEn: "With every emergency feature excluded, is there a new widespread rash after any medicine, supplement, traditional remedy, vaccine/injection, or dose change?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A rash appearing soon after starting a new medication warrants prompt review to assess whether the medication should be stopped, even without the source's own listed emergency signs.",
        redFlag: false,
        keywords: ["rash after new medication", "possible drug reaction"],
        careAdviceIds: ["oscg-drugrash-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-drugrash-emergency-advice", titleEn: "Qatar emergency medicine-rash response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. If anaphylaxis is suspected, use the child's prescribed adrenaline auto-injector immediately according to its instructions and emergency plan; antihistamine must not delay adrenaline or 999. Do not give another dose of the suspected medicine unless 999/qualified prescriber explicitly directs it, and do not give food, drink, or oral medicine if swallowing or responsiveness is impaired. Keep all packaging and a medicine list for handover.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["airway swelling, breathing difficulty, faintness, floppiness, or collapse", "non-fading rash with illness", "painful skin, blistering, peeling, mucosal sores, facial swelling, fever, or rapid progression"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-drugrash-urgent-advice", titleEn: "Urgent pediatric medication-rash review", instructionTextEn: "Arrange prompt same-day in-person pediatric assessment through the Qatar route approved by governance and contact an authorized prescriber/pharmacist before the next dose when this can be done without delaying care. Do not independently restart, substitute, or permanently discontinue an essential medicine; document the suspected product as a reaction, not a confirmed allergy, until assessed. Do not use leftover antihistamine, steroid, antibiotic, or topical treatment without age/weight and interaction checks. Call 999 immediately for any emergency feature.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["rash spreads, becomes painful, blisters, peels, or involves mouth/eyes/genitals", "fever, facial swelling, breathing/swallowing change, faintness, or floppiness"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar pediatric, emergency, allergy, dermatology, pharmacy, safeguarding, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Child" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\", https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized child-only structure-validation draft. Anaphylaxis, non-fading rash with illness, and severe cutaneous adverse-reaction features fail closed to Qatar 999. Exact culprit-drug hold/restart instructions, pediatric dose actions, allergy documentation, and Qatar pharmacy/prescriber route are GOVERNANCE_REQUIRED. Both branches are non-telemedicine pending Qatar pediatric, emergency, allergy, dermatology, pharmacy, safeguarding, and nursing approval. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 10. Weight Loss - Unintended - Qatar-localized UAT structure; governance review required
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
      { id: "oscg-weightloss-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, and what dated measured weights, units, time course, and growth trend are available? This protocol starts at age 12; younger children require an approved pediatric route." },
      { id: "oscg-weightloss-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Was weight loss truly unintended? Ask privately and age-appropriately about food restriction, purging, laxatives/diuretics, excessive exercise, body-image distress, food insecurity, neglect/coercion, pregnancy, medicines/substances, and self-harm/safeguarding risk." },
      { id: "oscg-weightloss-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Ask about inability to eat/drink, repeated vomiting/diarrhoea, dehydration/reduced urine, fainting, confusion, chest symptoms, severe weakness, fever/night sweats, pain, bleeding, swallowing difficulty, persistent cough, excessive thirst/urination, abdominal symptoms, and other new illness." }
    ],
    questions: [
      {
        id: "oscg-weightloss-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there inability to keep fluids down, severe dehydration or very little urine, fainting/collapse, confusion, seizure, chest pain, abnormal breathing, severe weakness/inability to stand, major bleeding, severe abdominal pain, suspected diabetic crisis, dangerous eating-disorder behaviour, or immediate self-harm/safeguarding danger?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Unintended weight loss is usually gradual, but acute dehydration, metabolic illness, bleeding, severe malnutrition/electrolyte disturbance, medical instability, or mental-health/safeguarding danger can be time-critical.",
        redFlag: true,
        keywords: ["life threatening", "severe dehydration"],
        careAdviceIds: ["oscg-weightloss-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-weightloss-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With emergency features excluded, is measured weight continuing to fall without intent, is there another symptom or medicine change, or is the person aged 12-17, pregnant/postpartum, medically vulnerable, possibly restricting/purging, or affected by food insecurity or safeguarding concerns?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: see a GP as soon as possible if there is weight loss and other symptoms - the earlier the cause is found, the sooner it can be treated; weight loss without trying should always be checked.",
        redFlag: false,
        keywords: ["weight loss no diet change", "unexplained weight loss with symptoms"],
        careAdviceIds: ["oscg-weightloss-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-weightloss-emergency-advice", titleEn: "Qatar emergency response for acute instability", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Keep the person supervised and at rest. Do not force food or fluids, give supplements/electrolytes, or alter insulin/other medicines when vomiting, confused, drowsy, unsafe to swallow, or medically unstable. For immediate self-harm or safeguarding danger, follow the approved emergency safety and welfare-check pathway.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["collapse, confusion, seizure, or inability to stand", "abnormal breathing, chest pain, severe dehydration, bleeding, or severe abdominal pain", "unsafe eating-disorder behaviour or self-harm risk"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-weightloss-routine-advice", titleEn: "Prompt in-person unexplained-weight-loss assessment", instructionTextEn: "Arrange prompt in-person assessment through the Qatar route and timing approved by governance. Bring dated weights/growth records and a complete medicine/supplement history. Do not prescribe high-calorie supplements, electrolytes, vitamins, appetite stimulants, laxative changes, or refeeding targets without assessment; rapid refeeding can be unsafe in severe malnutrition. Adolescents require private age-appropriate eating-disorder and safeguarding screening with approved caregiver involvement.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["weight loss accelerates", "fainting, vomiting, dehydration, weakness, chest symptoms, bleeding, fever/night sweats, excessive thirst/urination, or self-harm concern"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adolescent/adult, obstetric, emergency, primary-care, eating-disorder, nutrition, safeguarding, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Age 12+" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Unintentional weight loss\", https://www.nhs.uk/conditions/unintentional-weight-loss/ (page last reviewed 28 July 2025)"],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft for age 12 and older. Acute medical instability, dangerous eating-disorder behaviour, self-harm, and safeguarding danger fail closed to Qatar 999. Exact Qatar routes, pediatric age boundary, pregnancy/postpartum pathway, growth/weight thresholds, laboratory work-up, supplements, and refeeding actions are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval. Not licensed Schmitt-Thompson (STCC) content."
    })
  }
];
