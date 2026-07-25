import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

const buildBatch01UatProvenance = (
  input: Parameters<typeof buildGuidelineProvenance>[0]
) => buildGuidelineProvenance({
  ...input,
  contentNotice: `${input.contentNotice} UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Exact Qatar routes, medication/dose eligibility, pediatric handling, pregnancy/postpartum handling, safeguarding, and escalation details are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval.`
});

/**
 * Batch 01 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). NOT licensed Schmitt-Thompson (STCC) content, NOT fabricated
 * placeholder text, and NOT derived from any STCC PDF or the user's personal
 * reference file (docs/protocol-review/). Each protocol paraphrases the
 * source page's own stated urgency tiers rather than quoting at length, and
 * every criterion traceable to the source is noted in `rationaleEn`.
 *
 * Unlike the formal-rule protocols (Ottawa Ankle, Centor/McIsaac, CURB-65,
 * Wells DVT), these are decomposed prose guidance, not a named point-score
 * rule - hence `sourceKind: "open-source-guideline-decomposition"` via
 * `buildGuidelineProvenance`. `requiresClinicalValidation: true` on every
 * protocol regardless.
 */
export const batch01Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Back Pain - https://www.nhs.uk/conditions/back-pain/ (reviewed 2026-03-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-back-pain",
    titleEn: "Back Pain",
    clinicalDefinitionEn: "Back pain assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 5,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "back pain", weight: 100 },
      { phrase: "backache", weight: 90 },
      { phrase: "lower back pain", weight: 85 },
      { phrase: "spine pain", weight: 70 }
    ],
    painSeverity: [
      { level: "Mild (1-3)", cls: "mild", textEn: "Aching, does not stop normal activity." },
      { level: "Moderate (4-7)", cls: "moderate", textEn: "Interferes with normal activity or sleep." },
      { level: "Severe (8-10)", cls: "severe", textEn: "Unable to move normally because of the pain." }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-backpain-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant/recently postpartum, and where is the pain? Include trauma, cancer/immunocompromise, fever, anticoagulants, urinary symptoms, safeguarding concerns, and whether pain spreads to the chest, abdomen, or legs." },
      { id: "oscg-backpain-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the pain start, and did it follow an injury or accident?" },
      { id: "oscg-backpain-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any numbness, tingling, or weakness in either leg?" }
    ],
    questions: [
      {
        id: "oscg-backpain-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there numbness, tingling or weakness in BOTH legs, loss of feeling around the genitals or back passage, new difficulty controlling bladder or bowel, chest pain, or did the pain start after a serious accident such as a car crash or a fall from height?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "NHS.UK back pain guidance lists bilateral leg symptoms, saddle numbness, new bladder/bowel changes, sexual dysfunction, concurrent chest pain, and a major-trauma trigger as its own call-999/A&E criteria - possible cauda equina syndrome or major trauma.",
        redFlag: true,
        keywords: ["both legs numb", "loss of bladder control", "chest pain", "car accident"],
        careAdviceIds: ["oscg-backpain-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-backpain-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the caller feel hot, cold, shivery, or generally unwell, OR is this severe pain that started suddenly and is quickly getting worse?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance flags fever/feeling unwell with back pain, and sudden severe or rapidly worsening pain, as needing a same-day GP appointment or 111 call.",
        redFlag: false,
        keywords: ["fever with back pain", "sudden severe back pain"],
        careAdviceIds: ["oscg-backpain-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-backpain-q2-child-review",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn:
          "Is this a patient aged 5 to 17 years with back pain and none of the emergency or urgent features above, including no fever or systemic illness, night or rest pain, unexplained weight loss, gait change, progressive weakness or numbness, bladder or bowel change, major trauma, or safeguarding concern?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn:
          "NHS pediatric guidance identifies age, systemic illness, night/rest pain, weight loss, gait or neurological change, bladder/bowel symptoms, trauma, and safeguarding context as reasons for age-appropriate clinical assessment. The generated child pathway fails closed to in-person review rather than entering the adult self-care branch. Exact Qatar pediatric destination and timing remain GOVERNANCE_REQUIRED.",
        redFlag: false,
        keywords: ["child back pain", "pediatric back pain"],
        careAdviceIds: ["oscg-backpain-child-review-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-backpain-q2-routine",
        acuityOrder: 4,
        severity: "Routine",
        questionTextEn:
          "Has the pain lasted several weeks despite home treatment, is it interfering with daily activities, is there unexplained weight loss, a new lump or change in the shape of the back, is it worse at night or with rest, worse with coughing or straining, or is it upper back pain between the shoulder blades?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons to book a routine GP appointment rather than manage entirely at home.",
        redFlag: false,
        keywords: ["persistent back pain", "back lump", "weight loss", "upper back pain"],
        careAdviceIds: ["oscg-backpain-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-backpain-q3-selfcare",
        acuityOrder: 5,
        severity: "Self-care",
        questionTextEn: "Is this mild-to-moderate pain of gradual onset with none of the concerning features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends staying active, anti-inflammatory medicine, and heat/ice for uncomplicated back pain without red-flag features.",
        redFlag: false,
        keywords: ["mild back pain", "gradual onset"],
        careAdviceIds: ["oscg-backpain-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-backpain-emergency-advice", titleEn: "Qatar emergency back-pain response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for new bladder/bowel dysfunction, saddle numbness, progressive leg weakness, major trauma, collapse, or severe systemic illness. Keep the person still and do not make them stand or walk when spinal compromise is possible. If unresponsive and not breathing normally, follow 999 CPR instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening leg weakness", "new saddle numbness or bladder/bowel change", "reduced consciousness or abnormal breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-backpain-urgent-advice", titleEn: "Urgent back pain review", instructionTextEn: "Arrange same-day or next-day medical review. Rest in a comfortable position and avoid heavy lifting until seen.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness spreads", "fever worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-backpain-child-review-advice", titleEn: "Pediatric back-pain assessment required", instructionTextEn: "Arrange age-appropriate in-person pediatric assessment through the Qatar governance-approved pathway. Do not use the adult-derived self-care branch for a patient aged 5 to 17 years. Escalate immediately for major trauma, fever or severe illness, progressive weakness or numbness, saddle sensory loss, bladder/bowel change, chest pain, collapse, or worsening symptoms. Exact destination and timing remain GOVERNANCE_REQUIRED.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["fever or rapidly worsening pain", "new weakness, numbness, gait change, or bladder/bowel change", "major trauma, chest pain, collapse, or severe illness"], displayOrder: 3, adviceCategory: "DISPOSITION" },
      { id: "oscg-backpain-routine-advice", titleEn: "Routine back pain follow-up", instructionTextEn: "Book a routine primary-care appointment through the approved Qatar pathway. Continue gentle activity and use only governance-approved pain relief in the meantime.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["pain suddenly worsens", "new leg numbness or weakness"], displayOrder: 4, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-backpain-selfcare-advice", titleEn: "Governed care for uncomplicated adult back pain", instructionTextEn: "For an adult only, use gentle activity as tolerated and avoid prolonged bed rest or provoking strain. Wrapped cool or warm packs may be used without direct skin exposure. Medicine choice/dose requires age, weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulants, and current medicines under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain does not improve", "new numbness, weakness, fever, trauma, or bladder/bowel changes"], displayOrder: 5, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2026-03-05",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: [
        "NHS.UK, \"Back pain\", https://www.nhs.uk/conditions/back-pain/ (page last reviewed 05 March 2026)",
        "Northern Care Alliance NHS Foundation Trust, \"Paediatrics - Under 16 years Back Pain\", https://www.northerncarealliance.nhs.uk/patient-information/patient-leaflets/paediatrics-under-16-years-back-pain",
        "Sheffield Children's NHS Foundation Trust, Emergency Department Medical Guideline 4.24 \"Back Pain\", https://www.sheffieldchildrens.nhs.uk/download/1721/acute-injury-and-orthopaedics/64216/4-24-back-pain.pdf"
      ],
      contentNotice:
        "Decomposed from NHS.UK's published back pain guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Burns and Scalds - https://www.nhs.uk/conditions/burns-and-scalds/ (reviewed 2026-03-31)
  // ------------------------------------------------------------------
  {
    id: "oscg-burns-thermal",
    titleEn: "Burns - Thermal",
    clinicalDefinitionEn: "Thermal burn/scald severity assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "burn", weight: 100 },
      { phrase: "scald", weight: 95 },
      { phrase: "burned skin", weight: 95 },
      { phrase: "scalded skin", weight: 90 },
      { phrase: "spilled hot", weight: 90 },
      { phrase: "hot water burn", weight: 80 },
      { phrase: "cooking burn", weight: 70 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-burns-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, and what caused the burn? Record location, estimated size/depth, circumferential involvement, inhalation/electrical/chemical exposure, first aid already given, and child/vulnerable-person safeguarding concerns." },
      { id: "oscg-burns-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What caused the burn, and roughly how big is the affected area?" },
      { id: "oscg-burns-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did the burn happen, and has cool running water already been applied?" }
    ],
    questions: [
      {
        id: "oscg-burns-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the burn very large or deep, on the face, genitals, or bottom, or was it caused by an acid, chemical, or electricity?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK burns and scalds guidance lists large/deep burns, burns to the face/genitals/bottom, and chemical or electrical burns as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["large burn", "deep burn", "chemical burn", "electrical burn", "facial burn"],
        careAdviceIds: ["oscg-burns-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-burns-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the caller unsure how serious the burn is, or is the patient a child under 5?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 whenever there is uncertainty about a burn or scald, and specifically for children under 5.",
        redFlag: false,
        keywords: ["unsure how serious", "child burn"],
        careAdviceIds: ["oscg-burns-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-burns-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a small, superficial burn or scald with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes small burns/scalds as manageable at home with first aid.",
        redFlag: false,
        keywords: ["small burn", "minor scald"],
        careAdviceIds: ["oscg-burns-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-burns-emergency-advice", titleEn: "Qatar emergency burn response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for airway/inhalation injury, electrical or chemical burn, major/deep/circumferential burn, face/neck/genital/hand/major-joint involvement, shock, or an unwell infant/child. Stop the burning source if safe, remove loose jewellery/clothing but not material stuck to skin, and cool a thermal burn with cool running water while preventing whole-body chilling. Brush off dry chemical first and follow 999 instructions. Do not use ice, creams, oils, or adhesive dressings.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["shock or reduced consciousness", "increasing breathing difficulty or soot around airway", "rapid swelling or circumferential burn"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-burns-urgent-advice", titleEn: "Urgent burn review", instructionTextEn: "Cool the burn under cool running water for 15-30 minutes, cover loosely with cling film (not wrapped around the limb), and arrange same-day medical advice.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "signs of infection"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-burns-selfcare-advice", titleEn: "Governed first aid for a clearly minor thermal burn", instructionTextEn: "Cool with cool running water, remove nearby loose jewellery/clothing before swelling but not anything stuck, prevent whole-body chilling, and cover loosely with a clean non-stick dressing. Do not burst blisters or apply ice, butter, toothpaste, creams, or adhesive material. Pain medicine requires age, weight, pregnancy, allergy, kidney/liver disease, and current-medicine checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["increasing redness, pus, fever, swelling, or pain", "blistering, deep/white/charred skin, or functional-area involvement"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2026-03-31",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Burns and scalds\", https://www.nhs.uk/conditions/burns-and-scalds/ (page last reviewed 31 March 2026)"],
      contentNotice:
        "Decomposed from NHS.UK's published burns and scalds guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Animal Bite - https://www.nhs.uk/conditions/animal-and-human-bites/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-animal-bite",
    titleEn: "Animal Bite",
    clinicalDefinitionEn: "Animal or human bite wound assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "animal bite", weight: 100 },
      { phrase: "dog bite", weight: 90 },
      { phrase: "cat bite", weight: 85 },
      { phrase: "human bite", weight: 75 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bite-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, immunocompromised, diabetic, or anticoagulated, what animal/person caused the bite, where is it, and where/when did exposure occur? Include rabies/tetanus history and safeguarding concerns." },
      { id: "oscg-bite-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did the bite happen?" },
      { id: "oscg-bite-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has the caller had a tetanus vaccine within the last 10 years?" }
    ],
    questions: [
      {
        id: "oscg-bite-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the wound large or deep, or is bleeding not stopping with direct pressure?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK animal and human bites guidance lists a large or deep wound, or bleeding that cannot be stopped, as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["large wound", "deep wound", "uncontrolled bleeding"],
        careAdviceIds: ["oscg-bite-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bite-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Might there be debris such as teeth, hair, or dirt in the wound; is it hot, swollen, or leaking fluid; is there fever or chills; does it smell unpleasant; is it on the hands, feet, face, or head; was it a human bite; or has the caller not had a tetanus vaccine in the last 10 years?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 for same-day assessment rather than manage entirely at home.",
        redFlag: false,
        keywords: ["wound debris", "hot swollen wound", "human bite", "no tetanus vaccine"],
        careAdviceIds: ["oscg-bite-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bite-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor, shallow bite with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes most bites as not serious and manageable at home with basic first aid.",
        redFlag: false,
        keywords: ["minor bite", "shallow bite"],
        careAdviceIds: ["oscg-bite-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bite-emergency-advice", titleEn: "Qatar emergency bite response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for uncontrolled bleeding, major tissue injury, face/neck airway threat, shock, reduced consciousness, or a dangerous animal/ongoing threat. Apply continuous direct pressure with a clean dressing unless an object is embedded. Move to safety without attempting to capture the animal.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "pale, cold, faint, confused, or unresponsive person", "airway, face, hand, genital, tendon, nerve, or major-joint injury"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bite-urgent-advice", titleEn: "Urgent bite wound review", instructionTextEn: "Clean the wound with soap and warm water, cover with a clean dressing, and arrange same-day medical review for possible antibiotics or tetanus assessment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or swelling", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-bite-selfcare-advice", titleEn: "First aid while arranging bite assessment", instructionTextEn: "Wash the wound thoroughly with soap and running water, pat dry, and cover with a clean dressing; do not squeeze or deliberately make it bleed. Human/animal species, location, depth, rabies exposure, tetanus status, antibiotic need, immunocompromise, pregnancy, and medication choice require prompt in-person assessment under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["increasing warmth, swelling, redness, pain, pus, red streaks, or fever", "loss of movement/feeling or worsening general condition"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-10-27",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Animal and human bites\", https://www.nhs.uk/conditions/animal-and-human-bites/ (page last reviewed 27 October 2025)"],
      contentNotice:
        "Decomposed from NHS.UK's published animal and human bites guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Bee or Yellow Jacket Sting - https://www.nhs.uk/conditions/insect-bites-and-stings/ (reviewed 2023-06-01)
  // ------------------------------------------------------------------
  {
    id: "oscg-insect-sting",
    titleEn: "Bee or Yellow Jacket Sting",
    clinicalDefinitionEn: "Insect bite/sting and allergic-reaction assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "bee sting", weight: 100 },
      { phrase: "wasp sting", weight: 95 },
      { phrase: "yellow jacket sting", weight: 90 },
      { phrase: "insect sting", weight: 85 },
      { phrase: "insect bite", weight: 70 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-sting-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, what insect was involved if safely known, where and how many stings occurred, and is there a prescribed allergy plan or adrenaline device?" },
      { id: "oscg-sting-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has the caller had a serious allergic reaction to a sting before?" },
      { id: "oscg-sting-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "How many stings, and does the caller carry an adrenaline auto-injector (EpiPen)?" }
    ],
    questions: [
      {
        id: "oscg-sting-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Are the lips, mouth, throat or tongue suddenly swollen, is the person breathing very fast or struggling to breathe, is the throat tight or hard to swallow, has the skin or lips turned blue, grey or pale, has the person suddenly become very confused, drowsy, or dizzy, or has anyone lost consciousness or become floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK insect bites and stings guidance lists these signs of a serious allergic reaction (anaphylaxis) as call-999 criteria - use an adrenaline auto-injector immediately if one is available.",
        redFlag: true,
        keywords: ["swollen throat", "struggling to breathe", "blue lips", "unconscious", "floppy"],
        careAdviceIds: ["oscg-sting-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-sting-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Are symptoms worsening or not improving, was the sting in the mouth, throat, or near the eyes, is there abdominal pain and vomiting, dizziness, a high fever with swollen glands, more than one sting, or a previous serious allergic reaction to a sting?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or see a GP urgently rather than manage entirely at home.",
        redFlag: false,
        keywords: ["worsening sting symptoms", "sting near eyes", "multiple stings", "prior allergic reaction"],
        careAdviceIds: ["oscg-sting-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-sting-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the skin around the sting hot to touch, red, painful, swollen, or leaking pus or fluid, or is this a child under 1 year old, or a tick bite with flu-like symptoms or a bullseye rash?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance flags these infection or tick-bite signs as needing a pharmacist or GP review.",
        redFlag: false,
        keywords: ["infected sting", "tick bite", "bullseye rash"],
        careAdviceIds: ["oscg-sting-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-sting-q3-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a single, minor sting or bite with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor stings/bites without infection or allergy signs as manageable at home.",
        redFlag: false,
        keywords: ["minor sting", "single sting"],
        careAdviceIds: ["oscg-sting-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sting-emergency-advice", titleEn: "Qatar emergency sting/anaphylaxis response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive. Use the person's prescribed adrenaline auto-injector immediately according to its instructions and emergency plan. Keep them flat unless breathing is easier sitting with legs extended or they are vomiting; use the left side in pregnancy. Do not allow standing or walking. A second prescribed device and timing must follow the approved plan/999 instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["airway swelling or breathing difficulty", "faintness, confusion, floppiness, or collapse", "symptoms persist or recur"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sting-urgent-advice", titleEn: "Urgent sting review", instructionTextEn: "Remove the stinger if visible by scraping (not squeezing), apply a cold compress, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling spreads", "breathing becomes difficult"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sting-routine-advice", titleEn: "Routine sting/bite follow-up", instructionTextEn: "Keep the area clean, apply a cold compress, and book a routine review for signs of infection or a tick bite.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-sting-selfcare-advice", titleEn: "Governed care for a minor local sting", instructionTextEn: "Move away from the insect, scrape out a visible bee stinger sideways without squeezing the venom sac, wash the area, elevate if practical, and use a wrapped cool pack briefly. Pain, antihistamine, and topical medicine require age, weight, pregnancy/breastfeeding, allergy, site, sedation risk, and current-medicine checks under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling rapidly worsens or involves mouth/neck", "breathing, swallowing, dizziness, vomiting, or generalized hives", "signs of infection"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2023-06-01",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice:
        "Decomposed from NHS.UK's published insect bites and stings guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Anaphylaxis - Qatar-localized UAT-only draft; clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-anaphylaxis",
    titleEn: "Anaphylaxis",
    clinicalDefinitionEn:
      "UAT-only recognition and emergency first-aid pathway for suspected anaphylaxis (a severe, potentially life-threatening allergic reaction); not approved for real-patient or production use.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "anaphylaxis", weight: 100 },
      { phrase: "severe allergic reaction", weight: 95 },
      { phrase: "allergic reaction", weight: 80 },
      { phrase: "epipen", weight: 85 },
      { phrase: "peanut allergy", weight: 90 },
      { phrase: "food allergy", weight: 85 },
      { phrase: "swollen lips", weight: 90 },
      { phrase: "throat feels tight", weight: 90 },
      { phrase: "swelling after eating", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-anaphylaxis-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Does the person currently have any sudden airway, breathing, circulation, or reduced-responsiveness symptom described in the emergency question below?" },
      { id: "oscg-anaphylaxis-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Does the person have their prescribed adrenaline auto-injector available now?" },
      { id: "oscg-anaphylaxis-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "When did the symptoms start, and was there a possible trigger such as food, medicine, or an insect sting?" }
    ],
    questions: [
      {
        id: "oscg-anaphylaxis-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "After a possible allergic trigger, is there sudden swelling of the lips, mouth, tongue or throat; a tight throat, hoarse voice or difficulty swallowing; noisy, fast or difficult breathing or wheeze; blue, grey or very pale colour; cold or clammy skin; sudden severe dizziness, confusion, collapse or fainting; or is an infant or child unusually floppy or unresponsive? Treat these features as suspected anaphylaxis even when there is no rash.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Resuscitation Council UK guidance recognizes anaphylaxis from airway, breathing or circulation compromise, with or without skin or mucosal changes. Hamad Medical Corporation identifies severe allergic reaction as life-threatening and directs callers in Qatar to request an ambulance on 999.",
        redFlag: true,
        keywords: ["swollen throat", "struggling to breathe", "blue lips", "unresponsive", "floppy"],
        careAdviceIds: ["oscg-anaphylaxis-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-anaphylaxis-q1-mild",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Only after all emergency features above have been excluded, is there an isolated rash, hives, itching or mild localized swelling while the person remains fully alert and is breathing and swallowing normally?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "Isolated skin symptoms without airway, breathing, circulation or responsiveness problems do not by themselves establish anaphylaxis. This UAT draft routes the person for prompt review because symptoms may evolve; the exact Qatar non-emergency destination and timeframe require local clinical-governance approval.",
        redFlag: false,
        keywords: ["mild allergic reaction", "hives", "itching"],
        careAdviceIds: ["oscg-anaphylaxis-mild-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-anaphylaxis-emergency-advice", titleEn: "Suspected anaphylaxis — call Qatar 999", instructionTextEn: "Call Qatar 999 for an ambulance immediately and follow the emergency operator's instructions. If the person has their prescribed adrenaline auto-injector, help them use it promptly in the outer thigh according to the device instructions; do not delay the 999 call. Keep the person lying flat with legs raised if tolerated. If breathing is difficult, allow them to sit with legs extended; do not let them stand or walk. If symptoms persist 5 minutes after the first auto-injector and a second prescribed device is available, use it. If the person becomes unresponsive and is not breathing normally, start CPR as directed by the 999 operator. Do not drive the person to hospital.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["symptoms persist after the first auto-injector", "collapse or loss of responsiveness", "not breathing normally"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-anaphylaxis-mild-advice", titleEn: "Isolated allergic symptoms — prompt review", instructionTextEn: "Keep the person under continuous observation and arrange prompt clinical advice using the Qatar pathway approved for this UAT environment. Follow the person's existing clinician-issued allergy action plan, if available. An antihistamine may help isolated skin symptoms only when it is already appropriate for that person, but it must not delay adrenaline or Qatar 999 if any airway, breathing, circulation, or reduced-responsiveness feature develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling of the lips, mouth, tongue or throat", "difficulty breathing, wheeze or difficulty swallowing", "dizziness, collapse, confusion or unusual floppiness"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "Pending qualified Qatar clinical and operational governance review",
      lastReviewedIso: "2026-07-25",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION"
    },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 25 July 2026)",
        "Resuscitation Council UK, \"First Aid Guidelines — Anaphylaxis\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines (accessed 25 July 2026)",
        "NHS.UK, \"Anaphylaxis\", https://www.nhs.uk/conditions/anaphylaxis/ (page last reviewed 21 June 2023)"
      ],
      contentNotice:
        "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Qatar emergency routing is localized to HMC Ambulance Service via 999. Clinical recognition and first-aid wording is adapted from public Resuscitation Council UK and NHS guidance into IST Health's STCC-shaped format. Not licensed Schmitt-Thompson (STCC) content. Requires approval by qualified Qatar clinical and operational governance reviewers before nurse-led UAT; requires separate production clinical validation and release governance."
    })
  },

  // ------------------------------------------------------------------
  // 6. Carbon Monoxide Exposure - https://www.nhs.uk/conditions/carbon-monoxide-poisoning/ (reviewed 2025-12-16)
  // ------------------------------------------------------------------
  {
    id: "oscg-carbon-monoxide",
    titleEn: "Carbon Monoxide Exposure",
    clinicalDefinitionEn: "Suspected carbon monoxide exposure assessment decomposed from NHS.UK's published emergency guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "carbon monoxide", weight: 100 },
      { phrase: "co poisoning", weight: 90 },
      { phrase: "gas leak", weight: 70 },
      { phrase: "smell gas", weight: 90 },
      { phrase: "gas smell", weight: 90 },
      { phrase: "carbon monoxide detector", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-co-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Is everyone outside in fresh air now? Record exact age and sex of every exposed person, pregnancy, child/vulnerable-person status, symptoms, exposure duration/source, and whether others or pets are affected." },
      { id: "oscg-co-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What appliance or source is suspected (boiler, heater, generator, fire)?" },
      { id: "oscg-co-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long has the caller been exposed?" }
    ],
    questions: [
      {
        id: "oscg-co-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Was there fire or smoke exposure with breathing difficulty, airway or facial burns, soot around the mouth or nose, hoarseness, severe coughing, confusion, weakness, chest or muscle pain, collapse, or loss of consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK carbon monoxide poisoning guidance lists these as call-999/A&E criteria for suspected exposure. Do not drive to hospital - call for an ambulance instead.",
        redFlag: true,
        keywords: ["fire exposure", "smoke inhalation", "airway burn", "soot", "hard to breathe", "confused", "weak", "chest pain", "unconscious"],
        careAdviceIds: ["oscg-co-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-co-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the caller suspect carbon monoxide, fire, or smoke exposure but have none of the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for suspected carbon monoxide exposure when severe symptoms are not present.",
        redFlag: false,
        keywords: ["suspected exposure", "mild symptoms"],
        careAdviceIds: ["oscg-co-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-co-emergency-advice", titleEn: "Qatar emergency carbon-monoxide response", instructionTextEn: "If safe, move everyone and pets into fresh air without re-entering or delaying to find the source. Call Qatar emergency services on 999 from outside and do not drive because deterioration or collapse can be sudden. Do not use flames, switches, or appliances at the suspected site. Tell 999 about all exposed people, including asymptomatic children, pregnant people, older adults, and anyone with heart/lung disease.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["headache, dizziness, vomiting, chest pain, weakness, confusion, or breathlessness", "pregnancy or child exposure", "loss of consciousness or seizure"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-co-urgent-advice", titleEn: "Urgent carbon monoxide or smoke-exposure review", instructionTextEn: "Leave the exposure area, go into fresh air, and do not re-enter a building or restart an appliance until emergency or safety authorities say it is safe. Use the Qatar governance-approved in-person assessment route without delay (GOVERNANCE_REQUIRED). Escalate to Qatar 999 for breathing difficulty, hoarseness, soot, airway/facial burns, severe coughing, confusion, weakness, chest pain, collapse, or worsening symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty, hoarseness, soot, airway or facial burns, or severe coughing", "confusion, weakness, chest pain, collapse, or worsening symptoms"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-12-16",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Carbon monoxide poisoning\", https://www.nhs.uk/conditions/carbon-monoxide-poisoning/ (page last reviewed 16 December 2025)"],
      contentNotice:
        "Decomposed from NHS.UK's published carbon monoxide poisoning guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Nosebleed - https://www.nhs.uk/conditions/nosebleed/ (reviewed 2023-12-05)
  // ------------------------------------------------------------------
  {
    id: "oscg-nosebleed",
    titleEn: "Nosebleed",
    clinicalDefinitionEn: "Nosebleed assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "nosebleed", weight: 100 },
      { phrase: "bleeding nose", weight: 90 },
      { phrase: "nose bleeding", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-nosebleed-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, anticoagulated, or known to have a bleeding disorder, how long/severely has bleeding continued despite uninterrupted pressure, and was there trauma, surgery, foreign body, or safeguarding concern?" },
      { id: "oscg-nosebleed-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Did the bleeding start after a blow to the head?" },
      { id: "oscg-nosebleed-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the caller taking blood-thinning medication such as warfarin?" }
    ],
    questions: [
      {
        id: "oscg-nosebleed-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there difficulty breathing, reduced consciousness, collapse, faintness or shock, major facial/head trauma, or severe uncontrolled bleeding that is rapidly worsening?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Immediate life-threatening features require Qatar 999. This separates ambulance need from other NHS.UK A&E criteria that may be stable enough for governed non-ambulance transport.",
        redFlag: true,
        keywords: ["nosebleed breathing difficulty", "nosebleed shock", "major head injury", "uncontrolled bleeding"],
        careAdviceIds: ["oscg-nosebleed-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-nosebleed-q1-urgent-ed",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "After uninterrupted pinching of the soft nose, has bleeding continued longer than 10-15 minutes, does it still seem excessive, is the person swallowing a lot of blood and vomiting, or did it begin after a blow to the head without the immediate life-threatening features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK directs these features to A&E and says not to self-drive, while allowing either another driver or an ambulance. Exact Qatar destination and transport choice remain GOVERNANCE_REQUIRED.",
        redFlag: false,
        keywords: ["prolonged nosebleed", "excessive nosebleed", "vomiting swallowed blood", "nosebleed after head injury"],
        careAdviceIds: ["oscg-nosebleed-urgent-ed-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-nosebleed-q1-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is the patient a child under 2, does the caller have regular nosebleeds, anaemia symptoms, take blood-thinning medication, or have a clotting disorder such as haemophilia?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP appointment for these situations even when the bleed itself has stopped.",
        redFlag: false,
        keywords: ["recurrent nosebleeds", "blood thinners", "clotting disorder", "young child"],
        careAdviceIds: ["oscg-nosebleed-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-nosebleed-q2-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a single, brief nosebleed with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes standard first aid as sufficient for an uncomplicated nosebleed.",
        redFlag: false,
        keywords: ["brief nosebleed"],
        careAdviceIds: ["oscg-nosebleed-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-nosebleed-emergency-advice", titleEn: "Qatar emergency nosebleed response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for severe/uncontrolled bleeding, breathing compromise, faintness/shock, major facial/head trauma, or reduced consciousness. Sit forward if alert, spit blood out, and pinch the soft nose continuously. Do not tilt the head back, lie flat, pack the nose deeply, or repeatedly release pressure to check.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding remains uncontrolled", "difficulty breathing, swallowing large amounts of blood, faintness, or shock", "major trauma or reduced consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-nosebleed-urgent-ed-advice", titleEn: "Urgent in-person nosebleed assessment", instructionTextEn: "Continue sitting forward and pinching the soft nose while arranging prompt in-person emergency assessment through the Qatar governance-approved pathway. Do not self-drive. A safe adult may transport a stable patient only if the approved local pathway permits; call 999 for breathing difficulty, reduced consciousness, collapse, shock, major trauma, or rapidly worsening/uncontrolled bleeding. Exact destination and transport remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["difficulty breathing, faintness, collapse, or reduced consciousness", "bleeding becomes rapidly worse or remains uncontrolled", "major trauma"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-nosebleed-routine-advice", titleEn: "Routine nosebleed follow-up", instructionTextEn: "Arrange primary-care review through the approved Qatar pathway for recurrent nosebleeds or bleeding-risk factors.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["nosebleeds becoming more frequent or heavier"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-nosebleed-selfcare-advice", titleEn: "Home first aid for a nosebleed", instructionTextEn: "Sit down, lean forward with the head tilted forward, pinch the soft part of the nose just above the nostrils for 10-15 minutes, and breathe through the mouth. An ice pack may help.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding continues past 10-15 minutes of pinching", "feeling weak or dizzy"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2023-12-05",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Nosebleed\", https://www.nhs.uk/conditions/nosebleed/ (page last reviewed 05 December 2023)"],
      contentNotice:
        "Decomposed from NHS.UK's published nosebleed guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Headache - https://www.nhs.uk/conditions/headaches/ (reviewed 2024-04-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-headache",
    titleEn: "Headache",
    clinicalDefinitionEn: "Headache assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "headache", weight: 100 },
      { phrase: "head pain", weight: 80 },
      { phrase: "migraine", weight: 75 }
    ],
    painSeverity: [
      { level: "Mild (1-3)", cls: "mild", textEn: "Noticeable but does not stop normal activity." },
      { level: "Moderate (4-7)", cls: "moderate", textEn: "Interferes with concentration or normal activity." },
      { level: "Severe (8-10)", cls: "severe", textEn: "Worst pain the caller has ever had, or unable to function." }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-headache-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant or within 6 weeks postpartum, when did the headache start and reach maximum severity, and is it first, worst, new, or different? Include trauma, fever, neurological/visual symptoms, anticoagulants, carbon monoxide, and safeguarding concerns." },
      { id: "oscg-headache-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any recent head injury (within the last 3 months)?" },
      { id: "oscg-headache-iaq3", sequence: 3, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" }
    ],
    questions: [
      {
        id: "oscg-headache-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Has there been a seizure, numbness or weakness in the body or face, sudden extremely painful onset, difficulty speaking, balancing, walking, or remembering things, drowsiness or confusion, loss of vision, a non-fading rash, a very high temperature with a stiff neck or light sensitivity, or a recent major head injury with deterioration?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK headache guidance lists these as call-999/A&E criteria - possible stroke, meningitis, or other serious cause.",
        redFlag: true,
        keywords: ["worst headache", "numbness", "confusion", "stiff neck", "non-fading rash"],
        careAdviceIds: ["oscg-headache-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-headache-q1-recent-head-injury",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Did the headache occur after any head injury within the last 3 months, with none of the immediate life-threatening features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK directs headache after head injury within 3 months to 999 or A&E. This branch preserves emergency assessment while avoiding an unsupported rule that every stable case requires a Qatar ambulance; exact local destination and transport remain GOVERNANCE_REQUIRED.",
        redFlag: false,
        keywords: ["headache after recent head injury", "head injury within three months"],
        careAdviceIds: ["oscg-headache-recent-injury-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-headache-q1-urgent",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn:
          "Are there vision or eye problems, is the headache triggered or worsened by coughing, sneezing, bending down, or exercise, is there vomiting, is a child's headache getting worse or waking them at night, or is there jaw pain when eating or a tender scalp?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or get an urgent GP appointment.",
        redFlag: false,
        keywords: ["vision problems", "vomiting with headache", "jaw pain when eating"],
        careAdviceIds: ["oscg-headache-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-headache-q2-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this a mild-to-moderate headache with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends hydration, rest, and simple pain relief for uncomplicated headaches.",
        redFlag: false,
        keywords: ["mild headache", "typical headache"],
        careAdviceIds: ["oscg-headache-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-headache-emergency-advice", titleEn: "Qatar emergency headache response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for sudden maximal/severe headache, stroke signs, seizure, confusion, reduced consciousness, meningitis features, major head injury with deterioration, carbon-monoxide exposure, acute visual loss, or pregnancy/postpartum danger signs. Note the last-known-well time and do not give food, drink, aspirin, or unprescribed medicine when stroke, bleeding, or impaired swallowing is possible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "new weakness, numbness, speech, balance, or vision change", "seizure, neck stiffness, rash, or reduced consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-headache-recent-injury-advice", titleEn: "Emergency assessment after recent head injury", instructionTextEn: "Arrange prompt in-person emergency assessment through the Qatar governance-approved pathway and do not self-drive. Call 999 immediately if severe or worsening headache, repeated vomiting, seizure, weakness/numbness, speech/balance/vision change, confusion, drowsiness, collapse, abnormal breathing, or other deterioration develops. Exact destination and transport for a stable patient remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening headache or repeated vomiting", "confusion, drowsiness, seizure, weakness, speech, balance, or vision change", "collapse or abnormal breathing"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-headache-urgent-advice", titleEn: "Urgent headache review", instructionTextEn: "Arrange same-day or next-day medical review through the approved Qatar pathway, especially for vision changes or persistent vomiting.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision worsens", "vomiting continues"], displayOrder: 3, adviceCategory: "DISPOSITION" },
      { id: "oscg-headache-selfcare-advice", titleEn: "Governed care for a familiar uncomplicated headache", instructionTextEn: "Rest in a quiet environment, maintain usual fluids if not restricted, eat normally, and avoid alcohol and known triggers. Medicine choice/dose requires age, weight, pregnancy/breastfeeding, allergy, kidney/liver disease, ulcer/bleeding risk, anticoagulants, and current medicines under the approved Qatar pathway.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["headache persists, changes, or worsens", "new fever, neck stiffness, vomiting, vision, speech, weakness, seizure, or pregnancy/postpartum symptoms"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2024-04-17",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Headaches\", https://www.nhs.uk/conditions/headaches/ (page last reviewed 17 April 2024)"],
      contentNotice:
        "Decomposed from NHS.UK's published headaches guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Sunburn - https://www.nhs.uk/conditions/sunburn/ (reviewed 2025-11-24)
  // ------------------------------------------------------------------
  {
    id: "oscg-sunburn",
    titleEn: "Sunburn",
    clinicalDefinitionEn: "Sunburn severity assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "sunburn", weight: 100 },
      { phrase: "sunburned", weight: 100 },
      { phrase: "sun burn", weight: 95 },
      { phrase: "too much sun", weight: 85 },
      { phrase: "sun exposure", weight: 70 },
      { phrase: "heat exhaustion", weight: 60 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-sunburn-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, how long was the heat/sun exposure, what area is affected, and are there blisters, eye/face involvement, fever, vomiting, dizziness, confusion, reduced urine, or child/vulnerable-person safeguarding concerns?" },
      { id: "oscg-sunburn-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the skin blistered?" },
      { id: "oscg-sunburn-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured? If so, what was it?" }
    ],
    questions: [
      {
        id: "oscg-sunburn-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is this an electrical or lightning injury, or is there confusion, fainting, a very high temperature with no sweating, or a rapid heartbeat suggesting heatstroke rather than simple sunburn?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Electrical and lightning injuries retain a conservative emergency disposition because their authored protocol is not in the generated catalog. NHS.UK also notes severe sunburn can progress to heat exhaustion and heatstroke, which needs emergency care.",
        redFlag: true,
        keywords: ["electrical injury", "lightning injury", "heatstroke", "confusion", "fainting"],
        careAdviceIds: ["oscg-sunburn-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-sunburn-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Is the skin blistered or swollen, is the temperature very high or does the caller feel hot, cold, or shivery, does the caller feel very tired, dizzy, or sick, is there a headache or muscle cramps, or is the patient a baby or young child?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK sunburn guidance lists these as reasons for an urgent GP appointment or 111 call.",
        redFlag: false,
        keywords: ["blistered sunburn", "fever with sunburn", "dizzy", "young child sunburn"],
        careAdviceIds: ["oscg-sunburn-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-sunburn-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild-to-moderate sunburn without blistering or the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes most sunburn as resolving within about a week with home care.",
        redFlag: false,
        keywords: ["mild sunburn"],
        careAdviceIds: ["oscg-sunburn-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sunburn-emergency-advice", titleEn: "Qatar emergency heat-illness response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for confusion, seizure, collapse, abnormal breathing, very hot skin, inability to drink, severe dehydration, or an unwell infant/child. Move to shade or air conditioning, remove excess clothing, and cool with water and airflow while following 999 instructions. Do not use ice directly or give oral fluids if drowsy, vomiting, seizing, or unsafe to swallow.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion or collapse", "seizure or abnormal breathing", "inability to drink or markedly reduced urine"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sunburn-urgent-advice", titleEn: "Urgent sunburn review", instructionTextEn: "Cool the skin, stay hydrated, and arrange same-day medical review, especially for blistering or a young child.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "increasing dizziness"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sunburn-selfcare-advice", titleEn: "Governed care for mild sunburn", instructionTextEn: "Leave the sun, cool skin with a cool shower or damp cloth, wear loose clothing, and maintain usual fluids if not restricted. Use only a bland unperfumed moisturiser on intact skin and do not burst blisters or apply ice. Medicine requires age, weight, pregnancy, allergy, kidney/liver disease, dehydration, and current-medicine checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["large blisters, facial/eye involvement, fever, dizziness, vomiting, reduced urine, or feeling very unwell"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-11-24",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Sunburn\", https://www.nhs.uk/conditions/sunburn/ (page last reviewed 24 November 2025)"],
      contentNotice:
        "Decomposed from NHS.UK's published sunburn guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Frostbite - https://www.nhs.uk/conditions/frostbite/ (reviewed 2025-06-09)
  // ------------------------------------------------------------------
  {
    id: "oscg-frostbite",
    titleEn: "Frostbite",
    clinicalDefinitionEn: "Cold-exposure/frostbite assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "frostbite", weight: 100 },
      { phrase: "cold exposure", weight: 80 },
      { phrase: "hypothermia", weight: 75 },
      { phrase: "numb fingers", weight: 90 },
      { phrase: "fingers are numb", weight: 90 },
      { phrase: "freezing cold", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-frostbite-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, are they pregnant, which parts are affected, how long/cold/wet was exposure, is refreezing possible, and are there hard/numb/discoloured/blistered areas or hypothermia signs? Include infant and safeguarding concerns." },
      { id: "oscg-frostbite-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long was the caller exposed to the cold?" },
      { id: "oscg-frostbite-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has the caller already moved somewhere warm and sheltered?" }
    ],
    questions: [
      {
        id: "oscg-frostbite-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is the skin hard and frozen, is there swelling and loss of feeling in the area, are there blisters filled with blood or milky fluid, or is the person shivering constantly with slurred speech, slow breathing, and confusion?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK frostbite guidance lists these as call-999/A&E criteria, including hypothermia signs (constant shivering, slurred speech, slow breathing, confusion).",
        redFlag: true,
        keywords: ["frozen skin", "blood-filled blisters", "confused", "slurred speech"],
        careAdviceIds: ["oscg-frostbite-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-frostbite-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this mild cold exposure with tingling or numbness only, already moved to a warm sheltered place, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes safe rewarming at home for mild cold exposure without hard/frozen skin, blistering, or hypothermia signs.",
        redFlag: false,
        keywords: ["mild cold exposure", "tingling", "numbness only"],
        careAdviceIds: ["oscg-frostbite-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-frostbite-emergency-advice", titleEn: "Qatar emergency frostbite/hypothermia response", instructionTextEn: "Call Qatar emergency services on 999 and do not drive for hard/frozen/numb/discoloured or blistered tissue, suspected hypothermia, confusion, drowsiness, slow/abnormal breathing, an unwell baby, or extensive injury. Move to shelter, remove wet clothing if practical, cover with dry layers, and handle gently. Do not rub, massage, walk on affected feet, use direct heat, or thaw tissue if refreezing is possible.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion, drowsiness, or floppiness", "slow or abnormal breathing", "hard, numb, discoloured, or blistering tissue"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-frostbite-selfcare-advice", titleEn: "Governed care for mild cold exposure without frostbite signs", instructionTextEn: "Move indoors, remove wet or restrictive clothing/jewellery, dry and wrap in loose warm layers, and protect the area from pressure. Do not rub, use direct heat, hot water, or alcohol. Active water rewarming, pain medicine, dressings, and oral fluids require confirmation that frostbite/hypothermia is absent plus age, pregnancy, comorbidity, swallowing safety, and Qatar pathway checks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["skin becomes hard, numb, pale, blue, grey, or blistered", "confusion, slurred speech, drowsiness, floppiness, or abnormal breathing"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-06-09",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildBatch01UatProvenance({
      sourceDocuments: ["NHS.UK, \"Frostbite\", https://www.nhs.uk/conditions/frostbite/ (page last reviewed 09 June 2025)"],
      contentNotice:
        "Decomposed from NHS.UK's published frostbite guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
