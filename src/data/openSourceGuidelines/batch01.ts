import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

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
      { id: "oscg-backpain-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where exactly is the pain - lower back, upper back, or does it spread down a leg?" },
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
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-backpain-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn:
          "Has the pain lasted several weeks despite home treatment, is it interfering with daily activities, is there unexplained weight loss, a new lump or change in the shape of the back, is it worse at night or with rest, worse with coughing or straining, or is it upper back pain between the shoulder blades?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance lists these as reasons to book a routine GP appointment rather than manage entirely at home.",
        redFlag: false,
        keywords: ["persistent back pain", "back lump", "weight loss", "upper back pain"],
        careAdviceIds: ["oscg-backpain-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-backpain-q3-selfcare",
        acuityOrder: 4,
        severity: "Self-care",
        questionTextEn: "Is this mild-to-moderate pain of gradual onset with none of the concerning features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends staying active, anti-inflammatory medicine, and heat/ice for uncomplicated back pain without red-flag features.",
        redFlag: false,
        keywords: ["mild back pain", "gradual onset"],
        careAdviceIds: ["oscg-backpain-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-backpain-emergency-advice", titleEn: "Emergency back pain precautions", instructionTextEn: "Keep the caller as still and comfortable as possible. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening leg weakness", "new loss of bladder or bowel control"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-backpain-urgent-advice", titleEn: "Urgent back pain review", instructionTextEn: "Arrange same-day or next-day medical review. Rest in a comfortable position and avoid heavy lifting until seen.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness spreads", "fever worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-backpain-routine-advice", titleEn: "Routine back pain follow-up", instructionTextEn: "Book a routine GP appointment. Continue gentle activity and over-the-counter pain relief in the meantime.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["pain suddenly worsens", "new leg numbness or weakness"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-backpain-selfcare-advice", titleEn: "Home care for uncomplicated back pain", instructionTextEn: "Stay as active as possible, use anti-inflammatory pain relief per local policy, and apply ice or heat packs. Gentle stretching and short walks usually help more than bed rest.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain not improving after a few weeks", "new numbness, weakness, or bladder/bowel changes"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2026-03-05",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Back pain\", https://www.nhs.uk/conditions/back-pain/ (page last reviewed 05 March 2026)"],
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
      { id: "oscg-burns-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the burn located?" },
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-burns-emergency-advice", titleEn: "Emergency burn precautions", instructionTextEn: "Cool the burn under cool running water for 15-30 minutes while arranging emergency transport. Do not apply creams, oils, or ice.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["signs of shock", "increasing difficulty breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-burns-urgent-advice", titleEn: "Urgent burn review", instructionTextEn: "Cool the burn under cool running water for 15-30 minutes, cover loosely with cling film (not wrapped around the limb), and arrange same-day medical advice.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "signs of infection"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-burns-selfcare-advice", titleEn: "Home care for a small burn", instructionTextEn: "Cool under cool running water for 15-30 minutes, remove nearby clothing/jewellery (not anything stuck to the burn), cover loosely with cling film, and take over-the-counter pain relief. Do not burst blisters or apply creams, butter, or sticky dressings. Most small burns heal in about 2 weeks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection (redness, pus, worsening pain)", "burn not improving after a few days"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2026-03-31",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-bite-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What animal (or person) caused the bite, and where on the body?" },
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bite-emergency-advice", titleEn: "Emergency bite wound precautions", instructionTextEn: "Apply firm direct pressure with a clean cloth and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bite-urgent-advice", titleEn: "Urgent bite wound review", instructionTextEn: "Clean the wound with soap and warm water, cover with a clean dressing, and arrange same-day medical review for possible antibiotics or tetanus assessment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or swelling", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-bite-selfcare-advice", titleEn: "Home care for a minor bite", instructionTextEn: "Clean the wound with soap and warm water, gently encourage a little bleeding to flush the wound, pat dry, cover with a clean dressing, and take paracetamol or ibuprofen for pain as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["wound becomes hot, swollen, or smelly", "fever develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-10-27",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-sting-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where was the caller stung or bitten?" },
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sting-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport. Lie down with legs raised (sit up only if breathing is difficult). Do not stand or walk, even if feeling better.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes (use a second auto-injector if available)", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sting-urgent-advice", titleEn: "Urgent sting review", instructionTextEn: "Remove the stinger if visible by scraping (not squeezing), apply a cold compress, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling spreads", "breathing becomes difficult"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sting-routine-advice", titleEn: "Routine sting/bite follow-up", instructionTextEn: "Keep the area clean, apply a cold compress, and book a routine review for signs of infection or a tick bite.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-sting-selfcare-advice", titleEn: "Home care for a minor sting", instructionTextEn: "Apply an ice pack, keep the area elevated, and use over-the-counter painkillers, antihistamines, or hydrocortisone cream as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling worsens", "signs of infection develop", "any allergic reaction symptoms appear"], displayOrder: 4, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2023-06-01",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Insect bites and stings\", https://www.nhs.uk/conditions/insect-bites-and-stings/ (page last reviewed 01 June 2023)"],
      contentNotice:
        "Decomposed from NHS.UK's published insect bites and stings guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Anaphylaxis - https://www.nhs.uk/conditions/anaphylaxis/ (reviewed 2023-06-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-anaphylaxis",
    titleEn: "Anaphylaxis",
    clinicalDefinitionEn: "Suspected anaphylaxis (severe allergic reaction) assessment decomposed from NHS.UK's published emergency guidance.",
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
      { id: "oscg-anaphylaxis-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the suspected trigger (food, sting, medicine)?" },
      { id: "oscg-anaphylaxis-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Does the caller have an adrenaline auto-injector (EpiPen) available?" },
      { id: "oscg-anaphylaxis-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did the symptoms start?" }
    ],
    questions: [
      {
        id: "oscg-anaphylaxis-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Are the lips, mouth, throat or tongue suddenly swollen, is the person breathing very fast or struggling to breathe, is the throat tight or hard to swallow, has the skin, tongue or lips turned blue, grey or pale, has the person suddenly become very confused, drowsy or dizzy, fainted and cannot be woken, or is a child unresponsive or unusually floppy?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK anaphylaxis guidance lists these as the call-999-immediately signs of a severe allergic reaction.",
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
        questionTextEn: "Is there a mild allergic reaction (e.g., hives, itching, mild swelling) without any of the severe features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A reaction without airway, breathing, circulation, or consciousness involvement does not meet the NHS.UK anaphylaxis criteria, but should still be reviewed promptly since reactions can progress.",
        redFlag: false,
        keywords: ["mild allergic reaction", "hives", "itching"],
        careAdviceIds: ["oscg-anaphylaxis-mild-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-anaphylaxis-emergency-advice", titleEn: "Emergency anaphylaxis management", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then call for emergency transport. Lie down with legs raised (sit up only if breathing is difficult) and do not stand or walk, even if feeling better. If no improvement after 5 minutes and a second auto-injector is available, use it.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-anaphylaxis-mild-advice", titleEn: "Mild allergic reaction - monitor closely", instructionTextEn: "Take an antihistamine if available and monitor closely for any worsening. Arrange prompt medical review, especially if there is a known allergy history.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["any swelling of the face/throat develops", "breathing becomes difficult"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2023-06-21",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Anaphylaxis\", https://www.nhs.uk/conditions/anaphylaxis/ (page last reviewed 21 June 2023)"],
      contentNotice:
        "Decomposed from NHS.UK's published anaphylaxis emergency guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
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
      { id: "oscg-co-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the caller still inside the affected building?" },
      { id: "oscg-co-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What appliance or source is suspected (boiler, heater, generator, fire)?" },
      { id: "oscg-co-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long has the caller been exposed?" }
    ],
    questions: [
      {
        id: "oscg-co-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the caller finding it hard to breathe, suddenly confused, weak, in chest or muscle pain, or has anyone lost consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK carbon monoxide poisoning guidance lists these as call-999/A&E criteria for suspected exposure. Do not drive to hospital - call for an ambulance instead.",
        redFlag: true,
        keywords: ["hard to breathe", "confused", "weak", "chest pain", "unconscious"],
        careAdviceIds: ["oscg-co-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-co-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the caller suspect carbon monoxide exposure but have none of the severe symptoms above?",
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
      { id: "oscg-co-emergency-advice", titleEn: "Emergency carbon monoxide precautions", instructionTextEn: "Get everyone out of the building into fresh air immediately, then call for an ambulance. Do not drive yourself - carbon monoxide can cause sudden collapse.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-co-urgent-advice", titleEn: "Urgent carbon monoxide review", instructionTextEn: "Stop using the suspected appliance, go outside into fresh air, and do not re-enter the building until it has been checked. Arrange same-day medical advice.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["any new breathing difficulty, confusion, or chest pain"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-12-16",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-nosebleed-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the nose been bleeding?" },
      { id: "oscg-nosebleed-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Did the bleeding start after a blow to the head?" },
      { id: "oscg-nosebleed-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the caller taking blood-thinning medication such as warfarin?" }
    ],
    questions: [
      {
        id: "oscg-nosebleed-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Has the nosebleed lasted longer than 10-15 minutes with pinching applied, does the bleeding seem excessive, is the caller swallowing a lot of blood and vomiting, did it start after a blow to the head, or is the caller feeling weak, dizzy, or having difficulty breathing?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK nosebleed guidance lists prolonged/excessive bleeding, a head-injury trigger, and weakness/dizziness/breathing difficulty as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["prolonged nosebleed", "excessive bleeding", "head injury", "dizzy"],
        careAdviceIds: ["oscg-nosebleed-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-nosebleed-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Is the patient a child under 2, does the caller have regular nosebleeds, anaemia symptoms, take blood-thinning medication, or have a clotting disorder such as haemophilia?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP appointment for these situations even when the bleed itself has stopped.",
        redFlag: false,
        keywords: ["recurrent nosebleeds", "blood thinners", "clotting disorder", "young child"],
        careAdviceIds: ["oscg-nosebleed-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-nosebleed-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a single, brief nosebleed with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes standard first aid as sufficient for an uncomplicated nosebleed.",
        redFlag: false,
        keywords: ["brief nosebleed"],
        careAdviceIds: ["oscg-nosebleed-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-nosebleed-emergency-advice", titleEn: "Emergency nosebleed precautions", instructionTextEn: "Keep pinching the soft part of the nose and lean forward while arranging emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-nosebleed-routine-advice", titleEn: "Routine nosebleed follow-up", instructionTextEn: "Book a routine GP appointment to review recurrent nosebleeds or bleeding-risk factors.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["nosebleeds becoming more frequent or heavier"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-nosebleed-selfcare-advice", titleEn: "Home first aid for a nosebleed", instructionTextEn: "Sit down, lean forward with the head tilted forward, pinch the soft part of the nose just above the nostrils for 10-15 minutes, and breathe through the mouth. An ice pack may help.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding continues past 10-15 minutes of pinching", "feeling weak or dizzy"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2023-12-05",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-headache-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the headache start, and how suddenly?" },
      { id: "oscg-headache-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any recent head injury (within the last 3 months)?" },
      { id: "oscg-headache-iaq3", sequence: 3, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" }
    ],
    questions: [
      {
        id: "oscg-headache-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Has there been a seizure, numbness or weakness in the body or face, sudden extremely painful onset, a head injury in the last 3 months, difficulty speaking, balancing, walking, or remembering things, drowsiness or confusion, loss of vision, a non-fading rash, or a very high temperature with a stiff neck or light sensitivity?",
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
        id: "oscg-headache-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Are there vision or eye problems, is the headache triggered or worsened by coughing, sneezing, bending down, or exercise, is there vomiting, is a child's headache getting worse or waking them at night, or is there jaw pain when eating or a tender scalp?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or get an urgent GP appointment.",
        redFlag: false,
        keywords: ["vision problems", "vomiting with headache", "jaw pain when eating"],
        careAdviceIds: ["oscg-headache-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-headache-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild-to-moderate headache with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends hydration, rest, and simple pain relief for uncomplicated headaches.",
        redFlag: false,
        keywords: ["mild headache", "typical headache"],
        careAdviceIds: ["oscg-headache-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-headache-emergency-advice", titleEn: "Emergency headache precautions", instructionTextEn: "Keep the caller still and calm and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "new weakness or numbness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-headache-urgent-advice", titleEn: "Urgent headache review", instructionTextEn: "Arrange same-day or next-day medical review, especially for vision changes or persistent vomiting.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision worsens", "vomiting continues"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-headache-selfcare-advice", titleEn: "Home care for a typical headache", instructionTextEn: "Drink water, rest in a quiet dim room, and take paracetamol or ibuprofen as directed. Avoid skipping meals, excess screen time, and alcohol.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["headache persists or worsens", "new vision, speech, or weakness symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2024-04-17",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-sunburn-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How much sun exposure, and which areas are affected?" },
      { id: "oscg-sunburn-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the skin blistered?" },
      { id: "oscg-sunburn-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured? If so, what was it?" }
    ],
    questions: [
      {
        id: "oscg-sunburn-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there confusion, fainting, a very high temperature with no sweating, or a rapid heartbeat suggesting heatstroke rather than simple sunburn?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the sunburn guidance itself - NHS.UK notes severe sunburn can progress to heat exhaustion and heatstroke, which needs emergency care.",
        redFlag: true,
        keywords: ["heatstroke", "confusion", "fainting"],
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
        telemedicineEligible: true,
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sunburn-emergency-advice", titleEn: "Emergency heat-illness precautions", instructionTextEn: "Move to a cool place, cool the skin, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sunburn-urgent-advice", titleEn: "Urgent sunburn review", instructionTextEn: "Cool the skin, stay hydrated, and arrange same-day medical review, especially for blistering or a young child.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever worsens", "increasing dizziness"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sunburn-selfcare-advice", titleEn: "Home care for sunburn", instructionTextEn: "Get out of the sun, cool the skin with a cool shower or damp towels, apply aftersun or unperfumed moisturiser, stay hydrated, and take paracetamol or ibuprofen as needed. Avoid alcohol and further sun exposure.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["blistering develops", "fever, dizziness, or feeling very unwell develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-11-24",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
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
      { id: "oscg-frostbite-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Which body part is affected?" },
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
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-frostbite-emergency-advice", titleEn: "Emergency frostbite/hypothermia precautions", instructionTextEn: "Get the person somewhere warm and sheltered, wrap them in a blanket, and arrange emergency transport immediately. Do not rub the affected area or use direct heat.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "breathing becomes very slow"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-frostbite-selfcare-advice", titleEn: "Home rewarming for mild cold exposure", instructionTextEn: "Go indoors, remove restrictive clothing like gloves or boots, wrap in something warm, and place the affected area in warm (not hot) water, then dry and apply a light dressing. Elevate the area, take paracetamol for pain, and have warm drinks. Do not rub the area, use direct heat sources, take a hot bath, or drink alcohol.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["skin becomes hard or numb", "blistering develops", "confusion or slurred speech develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: {
      authorEn: "IST Health Open-Source Guideline Content",
      expertReviewerEn: "NHS.UK clinical editorial review (source publisher)",
      lastReviewedIso: "2025-06-09",
      versionYear: 2026,
      contentSet: "IST Open-Source Guideline Content | Mixed"
    },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Frostbite\", https://www.nhs.uk/conditions/frostbite/ (page last reviewed 09 June 2025)"],
      contentNotice:
        "Decomposed from NHS.UK's published frostbite guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
