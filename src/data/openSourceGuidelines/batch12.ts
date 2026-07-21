import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

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
export const batch12Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Skin Foreign Body - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02) + splinter first aid
  // ------------------------------------------------------------------
  {
    id: "oscg-skin-foreign-body",
    titleEn: "Skin Foreign Body",
    clinicalDefinitionEn: "Splinter or embedded foreign object in the skin, decomposed from NHS.UK's published wound guidance plus standard splinter first aid.",
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
      { id: "oscg-skinbody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has removal already been attempted?" }
    ],
    questions: [
      {
        id: "oscg-skinbody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the object large or deep, is bleeding uncontrolled, or is there loss of feeling or trouble moving near it?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK cuts and grazes guidance lists an embedded object with uncontrolled bleeding or nerve involvement as a call-999/A&E criterion.",
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
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-skinbody-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a small, shallow splinter with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Standard first-aid practice: small, shallow splinters can usually be removed safely at home with tweezers.",
        redFlag: false,
        keywords: ["small shallow splinter"],
        careAdviceIds: ["oscg-skinbody-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-skinbody-emergency-advice", titleEn: "Emergency embedded object precautions", instructionTextEn: "Do not remove the object. Apply pressure around (not on) it if bleeding, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "numbness spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-skinbody-urgent-advice", titleEn: "Urgent foreign body review", instructionTextEn: "Arrange same-day medical review for professional removal and a tetanus check if needed.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-skinbody-selfcare-advice", titleEn: "Home removal of a small splinter", instructionTextEn: "Wash hands and the area with soap and water, use clean tweezers to grasp the splinter close to the skin and pull out at the same angle it went in, then clean the area again and cover with a plaster. Do not squeeze or dig with a needle.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["cannot remove it", "signs of infection develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026) - embedded object criteria; standard first-aid splinter-removal technique (not a direct NHS.UK quote)"],
      contentNotice: "Combines NHS.UK's published embedded-object emergency criteria (Crown copyright, reused under the Open Government Licence) with standard first-aid splinter-removal technique, documented as a synthesis rather than a single-source quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Smoke and Fume Inhalation - synthesis of Carbon Monoxide + Poisoning sources
  // ------------------------------------------------------------------
  {
    id: "oscg-smoke-fume-inhalation",
    titleEn: "Smoke and Fume Inhalation",
    clinicalDefinitionEn: "Smoke or toxic fume inhalation assessment, synthesized from NHS.UK's carbon monoxide poisoning and poisoning guidance.",
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
      { id: "oscg-smokeinhale-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "How long was the exposure?" }
    ],
    questions: [
      {
        id: "oscg-smokeinhale-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there difficulty breathing, confusion, chest pain, a cough with soot or blood in the phlegm, or has the person lost consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Consistent with NHS.UK carbon monoxide and poisoning guidance - breathing difficulty, confusion, or chest pain after smoke/fume exposure requires immediate emergency care. Do not drive to A&E.",
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
      { id: "oscg-smokeinhale-emergency-advice", titleEn: "Emergency smoke/fume inhalation precautions", instructionTextEn: "Get to fresh air immediately if not already there. Do not drive to A&E - call an ambulance or have someone else drive.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-smokeinhale-urgent-advice", titleEn: "Urgent smoke/fume exposure check", instructionTextEn: "Stay in fresh air and arrange prompt medical evaluation - some effects of smoke or fume inhalation can appear later.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["any breathing difficulty, confusion, or chest pain develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Carbon monoxide poisoning\", https://www.nhs.uk/conditions/carbon-monoxide-poisoning/ (page last reviewed 16 December 2025)",
        "NHS.UK, \"Poisoning\", https://www.nhs.uk/conditions/poisoning/ (page last reviewed 12 June 2025)"
      ],
      contentNotice: "No single dedicated NHS.UK page exists for general smoke/fume inhalation. This protocol synthesizes NHS.UK's carbon monoxide and poisoning guidance's emergency criteria and first-aid principles, applied to smoke/fume exposure broadly - a documented synthesis, not a direct single-source quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Snakebite - North America - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17)
  // ------------------------------------------------------------------
  {
    id: "oscg-snakebite",
    titleEn: "Snakebite - North America",
    clinicalDefinitionEn: "Snake bite assessment decomposed from NHS.UK's published emergency snake bite guidance.",
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
      { id: "oscg-snakebite-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did the bite happen?" }
    ],
    questions: [
      {
        id: "oscg-snakebite-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Has the person, or anyone, been bitten by a snake?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance: call 999 or go to A&E immediately for any snake bite.",
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
          "Stay calm. Keep the bitten area as still as possible, and use the recovery position if able. Take paracetamol for pain (avoid aspirin or ibuprofen, which can worsen bleeding). Remove jewelry and loosen clothing near the bite. Do not go near, catch, or kill the snake. Do not try to suck or cut the venom out. Do not tie anything tightly around the bitten area. Do not drive yourself - call for an ambulance or have someone else drive. Bring any medications with you.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        warningSigns: ["worsening swelling", "difficulty breathing"],
        displayOrder: 1,
        adviceCategory: "DISPOSITION"
      }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\", https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026)"],
      contentNotice: "Decomposed from NHS.UK's published snake bite guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Treated as an unconditional emergency per the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Spider Bite - North America - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-spider-bite",
    titleEn: "Spider Bite - North America",
    clinicalDefinitionEn: "Spider bite assessment, generalized from NHS.UK's published venomous-bite first-aid principles (snake bites).",
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
      { id: "oscg-spiderbite-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did the bite happen?" }
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
        severity: "Self-care",
        questionTextEn: "Is this a minor bite with mild local redness only, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Most spider bites cause only minor local reactions manageable at home, similar to other minor insect bites.",
        redFlag: false,
        keywords: ["minor spider bite"],
        careAdviceIds: ["oscg-spiderbite-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-spiderbite-emergency-advice", titleEn: "Emergency spider bite precautions", instructionTextEn: "Keep the bitten area still and below heart level if possible. Take paracetamol for pain (avoid aspirin/ibuprofen). Do not try to catch the spider, cut, or suck the bite. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain or swelling", "breathing difficulty develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-spiderbite-selfcare-advice", titleEn: "Home care for a minor spider bite", instructionTextEn: "Clean the area with soap and water, apply a cold compress, and take over-the-counter pain relief or antihistamines as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["increasing pain, swelling, or redness", "any allergic reaction symptoms develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-bite first-aid principles), https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026) - generalized to spider bites"],
      contentNotice: "No dedicated NHS.UK page exists for spider bites (the UK has no dangerous spiders). This protocol generalizes NHS.UK's snake bite first-aid principles (do not cut/suck the bite, immobilize, seek emergency care for concerning bites) to spider bites, since species cannot reliably be identified by phone - a documented generalization, not a direct quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Scorpion Sting - North America - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-scorpion-sting",
    titleEn: "Scorpion Sting - North America",
    clinicalDefinitionEn: "Scorpion sting assessment, generalized from NHS.UK's published venomous-bite first-aid principles (snake bites) - genuinely relevant given scorpions are a real hazard in Qatar and the wider Gulf region.",
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
      { id: "oscg-scorpionsting-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are present now?" }
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
        severity: "Self-care",
        questionTextEn: "Is this an adult with mild local pain and swelling only, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Most scorpion stings in adults cause only local pain manageable at home, though monitoring for delayed symptoms is still important.",
        redFlag: false,
        keywords: ["mild scorpion sting adult"],
        careAdviceIds: ["oscg-scorpionsting-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-scorpionsting-emergency-advice", titleEn: "Emergency scorpion sting precautions", instructionTextEn: "Keep the affected limb still and below heart level if possible. Take paracetamol for pain (avoid aspirin/ibuprofen). Do not cut or suck the sting site. Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain or numbness", "breathing or swallowing difficulty develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-scorpionsting-selfcare-advice", titleEn: "Home care for a mild scorpion sting", instructionTextEn: "Clean the area with soap and water, apply a cold compress, and take over-the-counter pain relief as needed. Watch closely for the next few hours for any worsening or spreading symptoms.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens or spreads", "numbness, muscle twitching, or breathing changes develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-bite first-aid principles), https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026) - generalized to scorpion stings"],
      contentNotice: "No dedicated NHS.UK page exists for scorpion stings (not a UK hazard, but a genuine hazard in Qatar and the Gulf region relevant to this deployment). This protocol generalizes NHS.UK's venomous-bite first-aid principles, combined with widely-documented general medical knowledge about scorpion envenomation severity signs - a documented generalization, not a direct quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, ideally informed by local toxicology/poison-control guidance for the specific scorpion species present in Qatar."
    })
  },

  // ------------------------------------------------------------------
  // 6. Stingray Injury - https://www.nhs.uk/conditions/snake-bites/ (reviewed 2026-07-17), generalized
  // ------------------------------------------------------------------
  {
    id: "oscg-stingray-injury",
    titleEn: "Stingray Injury",
    clinicalDefinitionEn: "Stingray injury assessment, generalized from NHS.UK's published venomous-injury first-aid principles - relevant given Gulf coastal waters.",
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
      { id: "oscg-stingray-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the barb still embedded?" }
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
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-stingray-emergency-advice", titleEn: "Emergency stingray injury precautions", instructionTextEn: "Do not remove an embedded barb. Control bleeding with direct pressure and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "breathing difficulty develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-stingray-urgent-advice", titleEn: "Urgent stingray wound review", instructionTextEn: "Rinse the wound with the hottest water the person can tolerate (this often relieves pain) and arrange same-day medical review for wound cleaning and a tetanus check - stingray wounds carry a high infection risk.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain, swelling, or redness", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-07-17", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-injury first-aid principles), https://www.nhs.uk/conditions/snake-bites/ (page last reviewed 17 July 2026) - generalized to stingray injuries"],
      contentNotice: "No dedicated NHS.UK page exists for stingray injuries (not a UK hazard, but relevant to Gulf coastal waters near Qatar). This protocol generalizes NHS.UK's venomous-injury first-aid principles combined with widely-documented general first-aid knowledge about stingray wound management (hot-water immersion, high infection risk) - a documented generalization, not a direct quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Stools - Unusual Color - https://www.nhs.uk/conditions/rectal-bleeding/ (reviewed 2023-04-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-unusual-stool-color",
    titleEn: "Stools - Unusual Color",
    clinicalDefinitionEn: "Unusual stool color assessment decomposed from NHS.UK's published rectal bleeding guidance.",
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
      { id: "oscg-stoolcolor-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any medications that could explain this (iron pills, Pepto-Bismol)?" }
    ],
    questions: [
      {
        id: "oscg-stoolcolor-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the bleeding non-stop, or is there a lot of blood (toilet water turns red or large clots are seen)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK rectal bleeding guidance lists these as call-999/A&E criteria.",
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
        rationaleEn: "NHS.UK guidance recommends an urgent GP appointment or NHS 111 call for black/dark red stool or bloody diarrhea - possible upper gastrointestinal bleeding.",
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
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for these persistent symptoms - occasionally a sign of bowel cancer, so early detection matters.",
        redFlag: false,
        keywords: ["persistent blood in stool", "unexplained weight loss with stool changes"],
        careAdviceIds: ["oscg-stoolcolor-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-stoolcolor-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the person seated or lying down and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening bleeding", "signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-stoolcolor-urgent-advice", titleEn: "Urgent stool color review", instructionTextEn: "Arrange same-day medical review for black, dark red, or bloody stool.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding increases", "dizziness or weakness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-stoolcolor-routine-advice", titleEn: "Routine stool changes follow-up", instructionTextEn: "Book a GP appointment to investigate persistent stool changes.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new or worsening symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Rectal bleeding\", https://www.nhs.uk/conditions/rectal-bleeding/ (page last reviewed 12 April 2023)"],
      contentNotice: "Decomposed from NHS.UK's published rectal bleeding guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the unusual-stool-color presentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Swallowed Foreign Body - synthesis of Poisoning + general button-battery emergency knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-swallowed-foreign-body",
    titleEn: "Swallowed Foreign Body",
    clinicalDefinitionEn: "Swallowed foreign object assessment, synthesized from NHS.UK's poisoning guidance plus recognized button-battery/magnet emergency knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "swallowed something", weight: 100 },
      { phrase: "swallowed a foreign object", weight: 100 },
      { phrase: "swallowed a coin", weight: 90 },
      { phrase: "swallowed a battery", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-swallowedbody-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was swallowed?" },
      { id: "oscg-swallowedbody-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did this happen?" },
      { id: "oscg-swallowedbody-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any choking, drooling, chest pain, or vomiting?" }
    ],
    questions: [
      {
        id: "oscg-swallowedbody-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Was a button battery, magnet, or sharp object swallowed, is there choking, difficulty breathing or swallowing, drooling, chest or abdominal pain, or vomiting?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Button batteries can cause rapid, severe tissue damage within hours and are always a medical emergency, as are swallowed magnets (which can pinch the bowel) or sharp objects, or any choking/breathing symptoms - recognized emergency medicine knowledge, consistent with NHS.UK's poisoning guidance's severity screen.",
        redFlag: true,
        keywords: ["swallowed button battery", "swallowed magnet", "choking after swallowing"],
        careAdviceIds: ["oscg-swallowedbody-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-swallowedbody-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Was a small, smooth, non-battery object swallowed (such as a coin) with no symptoms?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Even asymptomatic swallowed objects should be evaluated promptly to confirm location and ensure safe passage, particularly in young children.",
        redFlag: false,
        keywords: ["swallowed small object no symptoms"],
        careAdviceIds: ["oscg-swallowedbody-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-swallowedbody-emergency-advice", titleEn: "Emergency swallowed object precautions", instructionTextEn: "Do not give food or drink. Arrange emergency transport immediately - button batteries and magnets need urgent removal.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "vomiting increases", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-swallowedbody-urgent-advice", titleEn: "Urgent swallowed object review", instructionTextEn: "Arrange prompt medical evaluation to confirm the object's location and monitor for safe passage.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain, vomiting, or difficulty swallowing develops"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Poisoning\", https://www.nhs.uk/conditions/poisoning/ (page last reviewed 12 June 2025) - general severity screen"],
      contentNotice: "No dedicated NHS.UK page exists for swallowed foreign objects. This protocol combines NHS.UK's poisoning guidance's severity screen with widely-recognized emergency medicine knowledge about button-battery and magnet ingestion (well-documented emergencies across pediatric and emergency medicine literature) - a documented synthesis, not a direct single-source quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Sores - https://www.nhs.uk/conditions/boils/ (reviewed 2023-06-20) + Cuts and Grazes
  // ------------------------------------------------------------------
  {
    id: "oscg-sores",
    titleEn: "Sores",
    clinicalDefinitionEn: "General skin sore assessment, synthesized from NHS.UK's boils and wound-care guidance.",
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
      { id: "oscg-sores-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever or feeling generally unwell?" }
    ],
    questions: [
      {
        id: "oscg-sores-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the skin around the sore hot, painful, and swollen, is there a high temperature or feeling hot/cold/shivery, or a weakened immune system?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance for skin infections lists these as reasons for an urgent GP appointment or 111 call.",
        redFlag: false,
        keywords: ["infected sore", "fever with sore"],
        careAdviceIds: ["oscg-sores-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-sores-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the sore lasted 2 weeks or more without improving, or does it keep recurring?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "A sore that won't heal after a couple of weeks needs GP review to check for an underlying cause.",
        redFlag: false,
        keywords: ["sore not healing weeks", "recurring sore"],
        careAdviceIds: ["oscg-sores-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-sores-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a small, recent sore with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor sores as manageable at home with basic wound care.",
        redFlag: false,
        keywords: ["small recent sore"],
        careAdviceIds: ["oscg-sores-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sores-urgent-advice", titleEn: "Urgent sore review", instructionTextEn: "Arrange same-day medical review for these signs of infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sores-routine-advice", titleEn: "Routine sore follow-up", instructionTextEn: "Book a GP appointment for a sore that won't heal or keeps recurring.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["worsening symptoms"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-sores-selfcare-advice", titleEn: "Home care for a minor sore", instructionTextEn: "Keep the area clean and covered with a dressing, wash hands before and after care, and avoid picking or scratching.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not healing after 2 weeks", "signs of infection develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-20", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Boils\", https://www.nhs.uk/conditions/boils/ (page last reviewed 20 June 2023)"],
      contentNotice: "No single dedicated NHS.UK page exists for a general 'sore' (distinct from boils, cuts, or ulcers specifically). This protocol synthesizes NHS.UK's skin-infection red-flag criteria (already used for boils and cuts/grazes) applied to a general sore presentation - a documented synthesis, not a single-source quote. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Skin Injury - https://www.nhs.uk/conditions/cuts-and-grazes/ (reviewed 2026-04-02), general catch-all
  // ------------------------------------------------------------------
  {
    id: "oscg-skin-injury",
    titleEn: "Skin Injury",
    clinicalDefinitionEn: "General skin injury assessment decomposed from NHS.UK's published cuts and grazes guidance, as a broad entry point.",
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
      { id: "oscg-skininjury-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the bleeding under control?" }
    ],
    questions: [
      {
        id: "oscg-skininjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is bleeding uncontrolled, is there numbness or trouble moving near the wound, is the wound very large or deep, or is something stuck in it?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK cuts and grazes guidance lists these as call-999/A&E criteria, applicable to skin injuries generally.",
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
        rationaleEn: "NHS.UK guidance lists these as reasons to call 111 or see a GP.",
        redFlag: false,
        keywords: ["dirty skin wound", "infected skin injury"],
        careAdviceIds: ["oscg-skininjury-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-skininjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a minor skin injury with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes minor skin injuries as manageable at home with basic first aid.",
        redFlag: false,
        keywords: ["minor skin injury"],
        careAdviceIds: ["oscg-skininjury-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-skininjury-emergency-advice", titleEn: "Emergency skin injury precautions", instructionTextEn: "Apply firm direct pressure with a clean cloth and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding will not stop", "signs of shock"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-skininjury-urgent-advice", titleEn: "Urgent skin injury review", instructionTextEn: "Clean the wound as best as possible and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing redness or pain", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-skininjury-selfcare-advice", titleEn: "Home first aid for a minor skin injury", instructionTextEn: "Wash hands, apply pressure if bleeding, rinse once bleeding stops, pat dry, and cover with a clean dressing. Keep clean and dry and change as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "wound does not heal as expected"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-04-02", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cuts and grazes\", https://www.nhs.uk/conditions/cuts-and-grazes/ (page last reviewed 02 April 2026)"],
      contentNotice: "Decomposed from NHS.UK's published cuts and grazes guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format as a general skin-injury entry point when the specific injury type isn't yet known. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
