import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";
import { addChildSafeguardingUatBranches } from "./batch09.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 12 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Spider Bite, Scorpion Sting, and Stingray Injury generalize the
 * NHS.UK snake bite guidance's "always call 999, immobilize, do not
 * cut/suck/tie off" venomous-bite first-aid principles, since the UK has no
 * dangerous spiders/scorpions/stingrays and NHS.UK has no dedicated pages for
 * them - documented explicitly as a generalization, genuinely relevant given
 * scorpions and stingrays are real hazards in Qatar/the Gulf. Smoke and Fume
 * Inhalation and Swallowed Foreign Body synthesize existing established
 * sources (Carbon Monoxide, Poisoning, general button-battery emergency
 * knowledge already used for Nose - Foreign Body) since no single dedicated
 * NHS.UK page exists for either.
 */
const batch12ProtocolDefinitions: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Skin Foreign Body - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02) + splinter first aid
  // ------------------------------------------------------------------
  {
    id: "oscg-skin-foreign-body",
    titleEn: "Skin Foreign Body",
    clinicalDefinitionEn: "Qatar-localized UAT-only pathway for a suspected splinter or embedded skin object in an adult or child; it screens for bleeding, neurovascular injury, infection, high-risk sites and safeguarding concerns and is not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "splinter in my skin", weight: 100 },
      { phrase: "splinter stuck", weight: 95 },
      { phrase: "something stuck in my skin", weight: 90 },
      { phrase: "glass in my foot", weight: 85 },
      { phrase: "splinter stuck in my finger", weight: 100 },
      { phrase: "splinter from a wood plank", weight: 100 },
      { phrase: "wood splinter", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-skinbody-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the object?" },
      { id: "oscg-skinbody-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What is the object, and how deep is it?" },
      { id: "oscg-skinbody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has removal already been attempted?" },
      { id: "oscg-skinbody-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the object near an eye, face, neck, chest, abdomen, genital area, joint, tendon, blood vessel or nerve; and are there diabetes, poor circulation, immune suppression, pregnancy, tetanus concerns, possible deliberate injury or an inconsistent history?" }
    ],
    questions: [
      {
        id: "oscg-skinbody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the object large or deep, is bleeding uncontrolled, or is there loss of feeling or trouble moving near it?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK cuts and grazes guidance lists an embedded object with uncontrolled bleeding or nerve involvement as an emergency-assessment criterion.",
        redFlag: true,
        keywords: ["large deep embedded object", "cant stop bleeding splinter"],
        careAdviceIds: ["oscg-skinbody-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-skinbody-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the object made of glass or metal and deeply embedded, or is the skin around it hot, red, swollen, or leaking pus after a removal attempt?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Deeply embedded glass/metal or signs of infection after removal warrant professional removal and review rather than repeated home attempts.",
        redFlag: false,
        keywords: ["deep glass splinter", "infected after splinter removal"],
        careAdviceIds: ["oscg-skinbody-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-skinbody-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is any skin foreign body still present or suspected, including a small or shallow splinter?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This UAT pathway requires an in-person assessment before removal advice because depth, material, retained fragments, tetanus status and pediatric or safeguarding risk cannot be reliably excluded remotely.",
        redFlag: false,
        keywords: ["small shallow splinter"],
        careAdviceIds: ["oscg-skinbody-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-skinbody-emergency-advice", titleEn: "Emergency embedded object precautions", instructionTextEn: "Call Qatar 999 for uncontrolled bleeding, collapse or severe neurovascular symptoms and do not drive. Do not remove the object. Apply pressure around, not on, an embedded object while awaiting help.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "numbness, pallor or weakness spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-skinbody-urgent-advice", titleEn: "Urgent foreign body review", instructionTextEn: "Arrange same-day in-person review through the Qatar pathway approved for this UAT environment. Do not dig, squeeze or repeatedly attempt removal. A clinician must assess retained fragments, wound care and tetanus needs.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or pain", "fever or reduced movement develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-skinbody-selfcare-advice", titleEn: "In-person review for a small skin foreign body", instructionTextEn: "Keep the area clean, avoid squeezing or probing it, and arrange same-day in-person assessment through the locally approved Qatar UAT pathway. Do not give medication advice until age, weight, pregnancy, allergy, kidney/liver disease and interactions are checked.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["cannot remove it", "bleeding, numbness or signs of infection develop"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026) - embedded object criteria; standard first-aid splinter-removal technique (not a direct NHS.UK quote)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult and pediatric safety draft. Emergency features cannot be downgraded; all other suspected retained objects require in-person review. Exact destination, tetanus workflow and specialty referral remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 2. Smoke and Fume Inhalation - synthesis of Carbon Monoxide + Poisoning sources
  // ------------------------------------------------------------------
  {
    id: "oscg-smoke-fume-inhalation",
    titleEn: "Smoke and Fume Inhalation",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for smoke, carbon monoxide or toxic-fume exposure, including delayed toxicity, pregnancy and multiple-casualty risk; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "smoke inhalation", weight: 100 },
      { phrase: "breathed in smoke", weight: 95 },
      { phrase: "inhaled fumes", weight: 95 },
      { phrase: "breathed in fumes", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-smokeinhale-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was the source of smoke or fumes?" },
      { id: "oscg-smokeinhale-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person now in fresh air?" },
      { id: "oscg-smokeinhale-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long was the exposure?" },
      { id: "oscg-smokeinhale-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; was exposure in an enclosed space or fire; are multiple people affected; and are there asthma, heart/lung disease, altered behaviour, burns, soot, headache, vomiting or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-smokeinhale-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there difficulty breathing, confusion, chest pain, a cough with soot or blood in the phlegm, or has the person lost consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Consistent with NHS.UK carbon monoxide and poisoning guidance - breathing difficulty, confusion, or chest pain after smoke/fume exposure requires immediate emergency care. Do not drive yourself to the emergency department.",
        redFlag: true,
        keywords: ["breathing difficulty after smoke", "confused after smoke inhalation", "unconscious smoke"],
        careAdviceIds: ["oscg-smokeinhale-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-smokeinhale-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Was there any smoke or fume exposure, even without symptoms yet?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with NHS.UK guidance for suspected exposure without severe symptoms - recommend a prompt check, since some effects can be delayed.",
        redFlag: false,
        keywords: ["exposed to smoke no symptoms yet"],
        careAdviceIds: ["oscg-smokeinhale-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-smokeinhale-emergency-advice", titleEn: "Emergency smoke/fume inhalation precautions", instructionTextEn: "Get to fresh air immediately if not already there. Do not drive yourself to the emergency department - call Qatar 999 or have someone else drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-smokeinhale-urgent-advice", titleEn: "Urgent smoke/fume exposure check", instructionTextEn: "Stay in fresh air and arrange prompt medical evaluation - some effects of smoke or fume inhalation can appear later.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["any breathing difficulty, confusion, or chest pain develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Carbon monoxide poisoning\", https://www.nhs.uk/conditions/carbon-monoxide-poisoning/ (page last reviewed 16 December 2025)",
        "NHS.UK, \"Poisoning\", https://www.nhs.uk/conditions/poisoning/ (page last reviewed 12 June 2025)"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized synthesis requiring adult, pediatric, obstetric, emergency and toxicology approval. Emergency symptoms route to Qatar 999; the poison-service interface and exact asymptomatic-exposure destination remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 3. Snakebite - North America - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-snakebite",
    titleEn: "Snakebite",
    clinicalDefinitionEn: "Qatar-localized UAT-only emergency pathway for any suspected snake bite in an adult or child; species and venom risk must not be inferred remotely and the pathway is not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "snake bite", weight: 100 },
      { phrase: "bitten by a snake", weight: 100 },
      { phrase: "snakebite", weight: 95 },
      { phrase: "venomous snake", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-snakebite-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where was the bite?" },
      { id: "oscg-snakebite-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Can the snake be described or was it photographed from a safe distance?" },
      { id: "oscg-snakebite-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did the bite happen?" },
      { id: "oscg-snakebite-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there breathing, swallowing, bleeding, weakness, vomiting, altered behaviour, spreading swelling, collapse or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-snakebite-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has the person, or anyone, been bitten by a snake?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance treats any snake bite as requiring immediate emergency assessment; in Qatar, call 999 or go to an emergency department.",
        redFlag: true,
        keywords: ["snake bite occurred"],
        careAdviceIds: ["oscg-snakebite-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      {
        id: "oscg-snakebite-emergency-advice",
        titleEn: "Emergency snake bite first aid",
        instructionTextEn:
          "Call Qatar 999 and do not drive. Keep the patient calm, still and under continuous observation. Remove rings or tight items only if this is easy and does not move the limb. Do not approach or attempt to catch the snake, cut or suck the wound, apply ice, or use a tourniquet or tight band. Give no medication unless Qatar 999 or a clinician advises it after patient-specific checks.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening swelling", "difficulty breathing"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\", https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Any suspected snake bite is an unconditional Qatar 999 emergency and cannot be downgraded. Qatar-specific species, antivenom, toxicology and receiving-facility arrangements remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 4. Spider Bite - North America - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-spider-bite",
    titleEn: "Suspected Spider Bite",
    clinicalDefinitionEn: "Qatar-localized UAT-only assessment for a suspected spider bite in an adult or child; the source is an indirect venomous-bite generalization and requires local toxicology approval before production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "spider bite", weight: 100 },
      { phrase: "bitten by a spider", weight: 100 },
      { phrase: "venomous spider", weight: 85 },
      { phrase: "spider bit me", weight: 90 },
      { phrase: "bitten by a spider in the garage", weight: 100 },
      { phrase: "spider bite mark on my arm", weight: 100 },
      { phrase: "mark on my arm from a spider", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-spiderbite-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where was the bite?" },
      { id: "oscg-spiderbite-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Can the spider be described?" },
      { id: "oscg-spiderbite-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did the bite happen?" },
      { id: "oscg-spiderbite-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; are there allergy, immune-suppression or serious chronic-disease risks; and are there breathing, swallowing, spreading pain/swelling, muscle symptoms, fever, altered behaviour or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-spiderbite-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Are the lips, mouth, throat, or tongue suddenly swollen, is the person struggling to breathe, is there severe pain, spreading redness, muscle cramping, or has anyone lost consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A bite from a spider with possible venom potency (or an allergic reaction to any bite) requires the same urgent precaution as NHS.UK's snake bite guidance - immediate emergency care, since the specific species usually cannot be confirmed by phone.",
        redFlag: true,
        keywords: ["swollen throat spider bite", "severe pain spider bite", "muscle cramping bite"],
        careAdviceIds: ["oscg-spiderbite-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-spiderbite-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is a spider bite suspected with only local symptoms or uncertain species?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "The species and venom risk cannot be confirmed remotely and the cited source is indirect; this UAT draft therefore requires prompt in-person assessment rather than self-care.",
        redFlag: false,
        keywords: ["minor spider bite"],
        careAdviceIds: ["oscg-spiderbite-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-spiderbite-emergency-advice", titleEn: "Emergency suspected spider bite precautions", instructionTextEn: "Call Qatar 999 and do not drive if there is airway swelling, breathing difficulty, collapse, severe systemic symptoms or rapid deterioration. Keep the patient observed; do not cut, suck, squeeze or apply a tourniquet, and do not attempt to catch the spider.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain or swelling", "breathing difficulty develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-spiderbite-selfcare-advice", titleEn: "Prompt suspected spider bite review", instructionTextEn: "Clean the area gently, avoid squeezing or unverified remedies, and arrange prompt in-person assessment through the Qatar pathway approved for UAT. Medication must be checked for age, weight, pregnancy, allergies, comorbidity and interactions.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain, swelling, redness or fever", "any allergic or neurological symptom develops"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-bite first-aid principles), https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026) - generalized to spider bites"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. This is an indirect source generalization with no generated catalog IDs. Exact Qatar species risk, toxicology consultation and destination remain GOVERNANCE_REQUIRED; emergency features cannot be downgraded."
    })
  },

  // ------------------------------------------------------------------
  // 5. Scorpion Sting - North America - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-scorpion-sting",
    titleEn: "Scorpion Sting",
    clinicalDefinitionEn: "Qatar-localized UAT-only assessment for suspected scorpion envenomation in an adult or child; it uses indirect venomous-bite principles and requires Qatar toxicology approval before production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "scorpion sting", weight: 100 },
      { phrase: "stung by a scorpion", weight: 100 },
      { phrase: "scorpion bite", weight: 90 },
      { phrase: "scorpion stung me", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-scorpionsting-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where was the sting?" },
      { id: "oscg-scorpionsting-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-scorpionsting-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are present now?" },
      { id: "oscg-scorpionsting-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there breathing/swallowing difficulty, drooling, vomiting, agitation, drowsiness, muscle or eye movements, spreading numbness, severe pain, chronic disease or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-scorpionsting-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there severe pain out of proportion to the visible sting mark, numbness or tingling spreading beyond the sting site, muscle twitching, difficulty breathing or swallowing, drooling, blurred vision, or is this a young child?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Scorpion venom potency varies significantly by species and cannot be reliably assessed by phone; these are recognized signs of a more severe envenomation requiring emergency care, following the same immediate-emergency-care principle as NHS.UK's snake bite guidance. Children are at higher risk from scorpion venom.",
        redFlag: true,
        keywords: ["severe scorpion pain", "muscle twitching scorpion sting", "child scorpion sting"],
        careAdviceIds: ["oscg-scorpionsting-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-scorpionsting-q1-selfcare",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is this an adult with apparently local pain or swelling only?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Species and venom risk cannot be confirmed remotely and delayed systemic effects are possible; local Qatar toxicology governance is absent, so this UAT pathway requires prompt in-person assessment.",
        redFlag: false,
        keywords: ["mild scorpion sting adult"],
        careAdviceIds: ["oscg-scorpionsting-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-scorpionsting-emergency-advice", titleEn: "Emergency scorpion sting precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient still and continuously observed. Do not cut, suck, squeeze or apply a tourniquet. Give no medication unless advised after patient-specific checks.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain or numbness", "breathing, swallowing, neurological or behavioural change"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-scorpionsting-selfcare-advice", titleEn: "Prompt scorpion sting review", instructionTextEn: "Clean the area gently, avoid unverified remedies, and arrange prompt in-person assessment through the Qatar pathway approved for UAT. Keep the patient observed and escalate immediately for any systemic symptom.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens or spreads", "numbness, muscle movement, vomiting, drowsiness or breathing change"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-bite first-aid principles), https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026) - generalized to scorpion stings"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. This indirect source generalization has no generated catalog IDs. Qatar species, poison-service, antivenom and destination rules remain GOVERNANCE_REQUIRED; children and systemic symptoms retain an emergency floor."
    })
  },

  // ------------------------------------------------------------------
  // 6. Stingray Injury - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-stingray-injury",
    titleEn: "Stingray Injury",
    clinicalDefinitionEn: "Qatar-localized UAT-only assessment for a stingray puncture or envenomation in an adult or child; marine-toxicology, wound and heat-treatment details require local approval before production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "stingray injury", weight: 100 },
      { phrase: "stung by a stingray", weight: 100 },
      { phrase: "stingray barb", weight: 90 },
      { phrase: "stepped on a stingray", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-stingray-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where was the injury?" },
      { id: "oscg-stingray-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did it happen?" },
      { id: "oscg-stingray-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the barb still embedded?" },
      { id: "oscg-stingray-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; is the injury on the chest, abdomen, neck, groin or near a major vessel; and are there bleeding, breathing difficulty, collapse, vomiting, allergy, immune risk or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-stingray-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is the injury to the chest or abdomen, is there severe pain, is the barb still embedded, is there heavy bleeding, or is there difficulty breathing, nausea, vomiting, or fainting?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A stingray wound to the trunk, an embedded barb, heavy bleeding, or systemic symptoms are recognized signs of a serious injury requiring emergency care.",
        redFlag: true,
        keywords: ["stingray wound chest", "embedded stingray barb", "severe pain stingray"],
        careAdviceIds: ["oscg-stingray-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-stingray-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is this a limb injury without the barb embedded, with moderate pain and swelling?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Stingray wounds carry a high infection risk and often need wound cleaning and hot-water immersion for pain relief under medical guidance.",
        redFlag: false,
        keywords: ["stingray limb injury"],
        careAdviceIds: ["oscg-stingray-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-stingray-emergency-advice", titleEn: "Emergency stingray injury precautions", instructionTextEn: "Call Qatar 999 and do not drive for severe bleeding, trunk injury, collapse or systemic symptoms. Do not remove an embedded barb. Apply pressure around, not on, the barb and follow dispatcher instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain or bleeding", "breathing difficulty or collapse"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-stingray-urgent-advice", titleEn: "Urgent stingray wound review", instructionTextEn: "Arrange same-day in-person emergency or urgent-care assessment through the Qatar pathway approved for UAT. Do not remove a retained fragment or use unverified heat treatment; clinicians must assess wound cleaning, imaging, infection and tetanus needs.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain, swelling, redness or bleeding", "fever or systemic symptoms"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-injury first-aid principles), https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026) - generalized to stingray injuries"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. This indirect marine-envenomation generalization has no generated catalog IDs. Qatar marine toxicology, safe heat-treatment parameters, imaging, antimicrobial/tetanus and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 7. Stools - Unusual Color - https://www.nhs.uk/conditions/rectal-bleeding/ (reviewed 2023-04-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-unusual-stool-color",
    titleEn: "Stools - Unusual Color",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for black, red, pale or otherwise unusual stool, screening for gastrointestinal bleeding, shock, neonatal/child illness, pregnancy and medication-related mimics; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "unusual stool color", weight: 100 },
      { phrase: "black stool", weight: 100 },
      { phrase: "tarry stool", weight: 90 },
      { phrase: "dark poo", weight: 85 },
      { phrase: "poo is black", weight: 100 },
      { phrase: "black and tarry", weight: 100 },
      { phrase: "black and tarry looking", weight: 100 },
      { phrase: "stool is black and tarry", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-stoolcolor-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the color and consistency." },
      { id: "oscg-stoolcolor-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this been noticed?" },
      { id: "oscg-stoolcolor-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What medicines, supplements or foods might affect colour, including iron, bismuth, anticoagulants or anti-inflammatory medicines?" },
      { id: "oscg-stoolcolor-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant or recently postpartum; and are there dizziness, fainting, pallor, weakness, abdominal pain/swelling, vomiting blood, fever, dehydration, liver disease, bleeding disorder, recent procedure or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-stoolcolor-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is bleeding continuing or heavy, are there large clots, vomiting blood, collapse/fainting, confusion, severe weakness, breathing difficulty, marked pallor or severe abdominal pain/swelling?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK rectal bleeding guidance lists these as emergency-assessment criteria.",
        redFlag: true,
        keywords: ["nonstop bleeding stool", "large blood clots stool"],
        careAdviceIds: ["oscg-stoolcolor-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-stoolcolor-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the stool black or dark red, or is there bloody diarrhea?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent clinical review for black/dark red stool or bloody diarrhea - possible upper gastrointestinal bleeding.",
        redFlag: false,
        keywords: ["black stool", "dark red stool", "bloody diarrhea"],
        careAdviceIds: ["oscg-stoolcolor-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-stoolcolor-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Has blood in the stool lasted 3 weeks, has stool consistency changed for 3 weeks, is there pain around the bottom or tummy, tiredness, or unexplained weight loss?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends routine primary-care review for these persistent symptoms - occasionally a sign of bowel cancer, so early detection matters.",
        redFlag: false,
        keywords: ["persistent blood in stool", "unexplained weight loss with stool changes"],
        careAdviceIds: ["oscg-stoolcolor-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-stoolcolor-emergency-advice", titleEn: "Emergency bleeding precautions", instructionTextEn: "Call Qatar 999 and do not drive. Keep the patient seated or lying down, observed and warm. Give no food, drink or medication while awaiting emergency instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening bleeding", "fainting, confusion or other signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-stoolcolor-urgent-advice", titleEn: "Urgent stool colour review", instructionTextEn: "Arrange same-day in-person review through the Qatar pathway approved for UAT for black, dark-red or bloody stool. Do not stop prescribed anticoagulants or other medicines unless a clinician instructs this.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding increases", "dizziness, pallor, weakness or pain develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-stoolcolor-routine-advice", titleEn: "Persistent stool change review", instructionTextEn: "Arrange in-person primary-care review through the locally approved Qatar pathway. Infants and children require age-specific assessment; medication and food explanations must not be assumed without checking for bleeding or systemic illness.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new bleeding, pain, fever, vomiting, weakness or dehydration"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Rectal bleeding\", https://www.nhs.uk/conditions/rectal-bleeding/ (page last reviewed 12 April 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult and pediatric draft; bleeding/shock cannot be downgraded. Neonatal and pediatric thresholds, pregnancy/postpartum handling, exact destination and investigation pathway remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 8. Swallowed Foreign Body - Qatar-localized UAT-only draft; adult/child/infant clinical approval pending
  // ------------------------------------------------------------------
  {
    id: "oscg-swallowed-foreign-body",
    titleEn: "Swallowed Foreign Body",
    clinicalDefinitionEn: "UAT-only emergency and in-person assessment pathway for suspected ingestion of a non-food object in an adult, child, or infant; not approved for real-patient or production use.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "swallowed something", weight: 100 },
      { phrase: "swallowed a foreign object", weight: 100 },
      { phrase: "swallowed a coin", weight: 90 },
      { phrase: "swallowed a battery", weight: 100 },
      { phrase: "swallowed magnets", weight: 100 },
      { phrase: "swallowed something sharp", weight: 100 },
      { phrase: "missing button battery", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-swallowedbody-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the patient choking now—unable to speak or cry, unable to cough effectively, struggling or unable to breathe, becoming blue or grey, or becoming unresponsive?" },
      { id: "oscg-swallowedbody-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What is the patient's exact age, what object may have been swallowed, how many, and what are its approximate size, shape, and material?" },
      { id: "oscg-swallowedbody-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When was the object swallowed or last seen, and was the ingestion witnessed or only suspected because an item is missing?" },
      { id: "oscg-swallowedbody-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Could it be a button or coin battery, one or more magnets, a sharp or pointed object, a large or long object, a lead-containing or toxic object, an expanding water bead, or an unknown object?" },
      { id: "oscg-swallowedbody-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there drooling, difficulty or pain swallowing, refusal to feed, neck or chest pain, coughing, gagging, vomiting, abdominal pain or swelling, blood in vomit or stool, fever, or unusual drowsiness?" }
    ],
    questions: [
      {
        id: "oscg-swallowedbody-q0-choking-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe choking: an ineffective or absent cough, inability to speak or cry, severe breathing difficulty, blue or grey colour, or reduced responsiveness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Foreign-body airway obstruction is immediately life-threatening. HMC identifies choking as a reason to call Qatar 999, and 2025 Resuscitation Council UK guidance specifies age-dependent choking first aid.",
        redFlag: true,
        keywords: ["cannot cough choking", "cannot speak choking", "cannot breathe swallowed object"],
        careAdviceIds: ["oscg-swallowedbody-choking-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-swallowedbody-q1-high-risk-emergency",
        acuityOrder: 2,
        severity: "Emergency",
        questionTextEn: "Even without symptoms, is there suspected or confirmed ingestion of a button or coin battery; any magnet, especially more than one or a magnet with metal; a sharp or pointed object; a large or long object; a lead-containing, toxic, caustic, or unknown object; an expanding water bead; or is there drooling, difficulty swallowing, refusal to feed, neck/chest/abdominal pain, persistent cough, vomiting, bleeding, fever, or unusual drowsiness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Button batteries can cause rapid tissue injury without early symptoms. Magnets can attract across bowel walls, and sharp, large, long, toxic, expanding, or symptomatic objects require urgent location and complication assessment. RCPCH/RCEM advises radiographs when battery, magnet, or sharp-object ingestion is possible.",
        redFlag: false,
        keywords: ["swallowed button battery", "swallowed magnet", "swallowed sharp object", "swallowed lead object"],
        careAdviceIds: ["oscg-swallowedbody-high-risk-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-swallowedbody-q2-assessment",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "After the emergency branches are excluded, was any other small blunt object swallowed or possibly swallowed, with the patient currently breathing and swallowing normally and without symptoms?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Observation may be appropriate for selected small blunt objects, but only after a clinician establishes the object's identity, location, size relative to patient age, timing, symptoms, and follow-up reliability. This UAT pathway does not authorize telephone-only self-care.",
        redFlag: false,
        keywords: ["swallowed small blunt object no symptoms"],
        careAdviceIds: ["oscg-swallowedbody-assessment-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-swallowedbody-choking-advice", titleEn: "Severe choking — call Qatar 999", instructionTextEn: "Call Qatar 999 immediately on speaker and follow the operator's instructions. If the patient can cough effectively, encourage coughing and monitor continuously. If the cough is ineffective, a trained or dispatcher-guided responder may give up to 5 back blows. If these fail, use up to 5 abdominal thrusts for an adult or child over 1 year, but use chest thrusts instead for an infant under 1 year or a pregnant patient; continue the age-appropriate sequence as directed. Do not perform a blind finger sweep or use an unapproved suction device. If the patient becomes unresponsive, start age-appropriate CPR immediately as directed by 999. Even after the object clears, a patient who received thrusts or chest compressions needs clinical assessment. Do not drive the patient to hospital.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["cough becomes ineffective", "breathing remains difficult", "reduced responsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-swallowedbody-high-risk-advice", titleEn: "High-risk swallowed object — emergency assessment", instructionTextEn: "Call Qatar 999 for breathing difficulty, collapse, severe symptoms, or when emergency transport is advised; otherwise proceed immediately to the emergency department using the Qatar destination approved for this UAT environment. Do not wait for symptoms. Give no food, drink, honey, medicine, or laxative and do not induce vomiting unless Qatar 999 or a poison specialist gives object-specific instructions. Keep the patient observed. Bring the matching battery, magnet, object, packaging, container, or a photograph when safe, but do not delay departure. The patient may need urgent radiographs and specialist removal. Do not use MRI until retained metal or a magnet has been excluded by clinicians.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["drooling or difficulty swallowing", "coughing, breathing difficulty, pain, vomiting, bleeding, fever, or drowsiness"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-swallowedbody-assessment-advice", titleEn: "Other swallowed object — in-person assessment", instructionTextEn: "Arrange prompt same-day in-person assessment through the Qatar destination approved for this UAT environment. Until a clinician confirms that observation is safe, do not induce vomiting, give laxatives, or give food, drink, or medicine. Do not search the stool or assume passage unless the treating clinician provides an object-specific monitoring plan. Escalate to Qatar 999 if choking, breathing difficulty, reduced responsiveness, severe pain, or collapse develops.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["difficulty swallowing or drooling", "pain, vomiting, abdominal swelling, bleeding, fever, cough, or breathing symptoms"], displayOrder: 3, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "Pending qualified Qatar adult, pediatric, emergency, gastroenterology, surgery, radiology, and toxicology review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar | UAT ONLY | NOT FOR PRODUCTION" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Home Safety — Choking and Small Objects\", https://www.hamad.qa/EN/your%20health/Patient%20and%20Family%20Education%20Unit/Publications/Diseases-and-Care/Pediatrics/Pediatrics/Home%20Safety%20-%20Choking%20and%20Small%20Objects%20-%20English.pdf",
        "Hamad Medical Corporation, \"Outpatient Handbook\", https://hamad.qa/EN/Patient-Information/Outpatient-Information/Documents/Outpatient-Handbook-EN.pdf (life-threatening choking: Qatar 999)",
        "Resuscitation Council UK, \"First Aid Guidelines — Choking in an adult\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/first-aid-guidelines",
        "Resuscitation Council UK, \"Paediatric Life Support — Foreign body airway obstruction\", 2025, https://www.resus.org.uk/professional-library/2025-resuscitation-guidelines/paediatric-basic-life-support-guidelines",
        "Royal College of Paediatrics and Child Health Patient Safety Portal, \"Ingested or inhaled magnets, water beads or batteries\", 2024, https://safety.rcpch.ac.uk/safety-alerts/",
        "UK Office for Product Safety and Standards, \"Button batteries campaign: how to stay safe\", https://www.gov.uk/government/news/button-batteries-campaign-how-to-stay-safe",
        "NASPGHAN Endoscopy Committee, \"Management of Ingested Foreign Bodies in Children\", Journal of Pediatric Gastroenterology and Nutrition 2015;60:562-574"
      ],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION USE. Adult and child generated variants share a canonical source but require separate Qatar adult, pediatric, infant, gastrointestinal, surgical, radiology, and toxicology approval. Severe choking and high-risk objects are emergency branches that cannot be downgraded. No self-care disposition or unresolved redirect is permitted. Qatar 999 is verified for life-threatening choking; the exact emergency department, non-ambulance transfer rule, poison-service involvement, imaging protocol, and non-emergency destination remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 9. Sores - https://www.nhs.uk/conditions/boils/ (reviewed 2023-06-20) + Cuts and Grazes
  // ------------------------------------------------------------------
  {
    id: "oscg-sores",
    titleEn: "Sores",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for a nonspecific skin sore, screening for sepsis, rapidly spreading infection, high-risk sites, diabetes/immune risk and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "sore on my skin", weight: 100 },
      { phrase: "open sore", weight: 95 },
      { phrase: "skin sore not healing", weight: 90 },
      { phrase: "sore that wont heal", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-sores-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the sore?" },
      { id: "oscg-sores-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been present?" },
      { id: "oscg-sores-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever or feeling generally unwell?" },
      { id: "oscg-sores-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; is the sore near an eye, face, genital area or joint; and are there diabetes, poor circulation, immune suppression, pressure injury, rapidly spreading redness, severe pain, recurrent lesions or possible neglect/deliberate injury?" }
    ],
    questions: [
      {
        id: "oscg-sores-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the sore hot, painful, and swollen, is there a high temperature or feeling hot/cold/shivery, or a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance for skin infections lists these as reasons for urgent clinical review.",
        redFlag: false,
        keywords: ["infected sore", "fever with sore"],
        careAdviceIds: ["oscg-sores-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-sores-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the sore lasted 2 weeks or more without improving, or does it keep recurring?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "A sore that won't heal after a couple of weeks needs primary-care review to check for an underlying cause.",
        redFlag: false,
        keywords: ["sore not healing weeks", "recurring sore"],
        careAdviceIds: ["oscg-sores-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-sores-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "After higher-risk features are excluded, is there still a new or unexplained skin sore?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Because this is a nonspecific synthesized pathway, in-person assessment is required before assuming a benign cause or recommending self-care.",
        redFlag: false,
        keywords: ["small recent sore"],
        careAdviceIds: ["oscg-sores-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sores-urgent-advice", titleEn: "Urgent sore review", instructionTextEn: "Arrange same-day in-person review through the locally approved Qatar UAT pathway. Do not squeeze, lance or share dressings, and do not start leftover antibiotics.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness or severe pain", "fever, drowsiness or rapid deterioration"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sores-routine-advice", titleEn: "Persistent sore follow-up", instructionTextEn: "Arrange in-person primary-care review for a sore that will not heal or keeps recurring. Document diabetes, pressure, vascular, immune and safeguarding risks.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["worsening pain, redness, discharge or systemic illness"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-sores-selfcare-advice", titleEn: "In-person review for a new sore", instructionTextEn: "Keep the area clean and lightly covered, avoid picking or applying unverified products, and arrange in-person review through the Qatar pathway approved for UAT. Medication advice requires patient-specific checks.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness, severe pain or discharge", "fever or deterioration develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-20", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Boils\", https://www.nhs.uk/conditions/boils/ (page last reviewed 20 June 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized nonspecific adult and pediatric synthesis. Sepsis, deep infection and safeguarding escalation cannot be downgraded; wound-care, antimicrobial, specialty and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 10. Skin Injury - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02), general catch-all
  // ------------------------------------------------------------------
  {
    id: "oscg-skin-injury",
    titleEn: "Skin Injury",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric entry pathway for an initially nonspecific skin injury, screening for major bleeding, deep or contaminated wounds, neurovascular damage, high-risk sites and safeguarding; not approved for production.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "skin injury", weight: 100 },
      { phrase: "hurt my skin", weight: 85 },
      { phrase: "cut my skin", weight: 85 },
      { phrase: "damaged my skin", weight: 80 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-skininjury-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the injury?" },
      { id: "oscg-skininjury-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How did it happen, and what does it look like?" },
      { id: "oscg-skininjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the bleeding under control?" },
      { id: "oscg-skininjury-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant or taking anticoagulants; is the injury near an eye, face, neck, chest, abdomen, genital area, joint, tendon, vessel or nerve; and are there diabetes, poor circulation, immune suppression, bite/injection, contamination, tetanus or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-skininjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is bleeding uncontrolled, is there numbness or trouble moving near the wound, is the wound very large or deep, or is something stuck in it?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK cuts and grazes guidance lists these as emergency-assessment criteria, applicable to skin injuries generally.",
        redFlag: true,
        keywords: ["uncontrolled bleeding skin injury", "deep skin wound"],
        careAdviceIds: ["oscg-skininjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-skininjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Does the wound have dirt still in it, is it swollen/red/getting more painful or leaking pus, is it larger than about 5cm, or does the caller feel generally unwell?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance lists these as reasons to seek urgent clinical review.",
        redFlag: false,
        keywords: ["dirty skin wound", "infected skin injury"],
        careAdviceIds: ["oscg-skininjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-skininjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "After emergency and higher-risk features are excluded, is there still a skin injury requiring wound assessment?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This broad UAT entry pathway requires in-person assessment before minor status, closure needs, tetanus status or safeguarding risk can be confirmed.",
        redFlag: false,
        keywords: ["minor skin injury"],
        careAdviceIds: ["oscg-skininjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-skininjury-emergency-advice", titleEn: "Emergency skin injury precautions", instructionTextEn: "Call Qatar 999 and do not drive for uncontrolled bleeding, shock or major injury. Apply firm direct pressure with a clean cloth unless an object is embedded; then press around, not on, it and do not remove it.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "fainting, confusion, pallor or other signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-skininjury-urgent-advice", titleEn: "Urgent skin injury review", instructionTextEn: "Cover the wound with a clean dressing and arrange same-day in-person review through the Qatar pathway approved for UAT. Do not probe the wound, remove embedded material or use leftover antibiotics.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness, pain, numbness or weakness", "fever or deterioration"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-skininjury-selfcare-advice", titleEn: "In-person skin injury assessment", instructionTextEn: "Use gentle pressure for minor bleeding, cover with a clean dressing, and arrange same-day in-person assessment. Closure, tetanus and medication decisions require patient-specific clinical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding restarts or sensation/movement changes", "infection or systemic illness develops"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Qatar-localized adult and pediatric entry pathway. Major bleeding, neurovascular injury and safeguarding concerns cannot be downgraded; closure, tetanus, antimicrobial, specialty and destination rules remain GOVERNANCE_REQUIRED."
    })
  }
];

const batch12ChildSafeguardingProtocolIds = new Set([
  "oscg-skin-foreign-body",
  "oscg-swallowed-foreign-body",
  "oscg-skin-injury"
]);

export const batch12Protocols: ProtocolInput[] =
  batch12ProtocolDefinitions.map((protocol) =>
    batch12ChildSafeguardingProtocolIds.has(protocol.id)
      ? addChildSafeguardingUatBranches(protocol)
      : protocol
  );
