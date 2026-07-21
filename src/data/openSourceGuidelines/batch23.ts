import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 23 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence) where available, plus standard, non-proprietary medical knowledge
 * where a specific NHS.UK page could not be retrieved (Breath-Holding Spell,
 * Marijuana Use and Problems, Hallucinogenic Mushrooms - Use and Problems,
 * Substance Use and Problems, Fluid Intake Increased). Crying - Before 3
 * Months Old and Crying - 3 Months and Older both draw on the same NHS.UK
 * colic guidance, split by the age boundary the source itself uses (colic
 * typically resolves by 3-4 months). The eating-disorder helpline named on
 * the NHS.UK source (Beat) is a UK-specific charity and is deliberately NOT
 * included in the care advice, consistent with the sensitive-topic handling
 * already established for Suicide Concerns/Domestic Violence/Bullying.
 */
export const batch23Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Bedwetting (Nocturnal Enuresis) - https://www.nhs.uk/conditions/bedwetting/ (reviewed 2023-04-11)
  // ------------------------------------------------------------------
  {
    id: "oscg-bedwetting",
    titleEn: "Bedwetting (Nocturnal Enuresis)",
    clinicalDefinitionEn: "Bedwetting assessment decomposed from NHS.UK's published bedwetting guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 1,
    keywords: [
      { phrase: "bedwetting", weight: 100 },
      { phrase: "wetting the bed", weight: 100 },
      { phrase: "child wets the bed", weight: 95 },
      { phrase: "nocturnal enuresis", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bedwetting-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the child?" },
      { id: "oscg-bedwetting-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Was the child previously dry at night for 6+ months?" },
      { id: "oscg-bedwetting-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Have home strategies already been tried?" }
    ],
    questions: [
      {
        id: "oscg-bedwetting-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Has the child kept wetting the bed despite trying home strategies, or started wetting the bed again after being dry for more than 6 months?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK bedwetting guidance recommends a GP visit for these situations - a return of bedwetting after a dry period can occasionally indicate an underlying medical or emotional cause.",
        redFlag: false,
        keywords: ["bedwetting after being dry for months", "home strategies not working bedwetting"],
        careAdviceIds: ["oscg-bedwetting-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-bedwetting-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this typical bedwetting in a young child with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance states bedwetting in young children is normal, and many children under 5 experience it.",
        redFlag: false,
        keywords: ["typical bedwetting young child"],
        careAdviceIds: ["oscg-bedwetting-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bedwetting-routine-advice", titleEn: "Routine bedwetting follow-up", instructionTextEn: "Book a GP appointment - a bedwetting alarm or medication may help if home strategies haven't worked.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["daytime wetting also develops", "pain with urination develops"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-bedwetting-selfcare-advice", titleEn: "Home strategies for bedwetting", instructionTextEn: "Encourage plenty of fluids during the day, establish regular toilet visits (4-7 times a day including before bed), use a reward system for positive behaviors (not for staying dry itself), use a waterproof mattress protector, and make the toilet easy to reach at night. Avoid caffeinated drinks and never punish for wetting the bed - it can make things worse.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bedwetting continues despite these steps", "bedwetting returns after a dry period"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Bedwetting\", https://www.nhs.uk/conditions/bedwetting/ (page last reviewed 11 April 2023)"],
      contentNotice: "Decomposed from NHS.UK's published bedwetting guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Breath-Holding Spell - standard pediatric knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-breath-holding-spell",
    titleEn: "Breath-Holding Spell",
    clinicalDefinitionEn: "Breath-holding spell assessment in young children, based on standard, universally-taught pediatric knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 2,
    keywords: [
      { phrase: "breath holding spell", weight: 100 },
      { phrase: "toddler held their breath and turned blue", weight: 100 },
      { phrase: "child stopped breathing when crying", weight: 90 },
      { phrase: "went limp after crying hard", weight: 85 },
      { phrase: "held his breath crying hard and turned blue", weight: 100 },
      { phrase: "turned blue for a few seconds", weight: 100 },
      { phrase: "toddler held his breath crying hard", weight: 100 },
      { phrase: "held his breath crying hard and turned blue for a few seconds", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-breathholding-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What happened right before the episode (crying, fright, anger)?" },
      { id: "oscg-breathholding-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long did the episode last?" },
      { id: "oscg-breathholding-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Did the child recover fully and quickly on their own?" }
    ],
    questions: [
      {
        id: "oscg-breathholding-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Did the episode last more than a minute, involve jerking movements (seizure-like activity) lasting beyond the brief episode, or did the child not fully recover afterward?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "While classic breath-holding spells are brief and self-resolving, a prolonged episode, ongoing seizure activity, or incomplete recovery needs emergency evaluation to rule out a seizure disorder or other cause.",
        redFlag: true,
        keywords: ["breath holding spell lasted a long time", "seizure like movements after breath holding", "didnt recover after breath holding spell"],
        careAdviceIds: ["oscg-breathholding-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-breathholding-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is this the first-ever episode, or are episodes becoming more frequent?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A first episode should be evaluated by a doctor to confirm the diagnosis and rule out other causes, even though breath-holding spells themselves are benign.",
        redFlag: false,
        keywords: ["first breath holding spell", "breath holding spells more frequent"],
        careAdviceIds: ["oscg-breathholding-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-breathholding-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a typical, brief, previously-diagnosed breath-holding spell with quick full recovery?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Breath-holding spells are a well-recognized, benign, involuntary reflex in young children that typically resolve by school age and don't need emergency treatment once diagnosed.",
        redFlag: false,
        keywords: ["typical previously diagnosed breath holding spell"],
        careAdviceIds: ["oscg-breathholding-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-breathholding-emergency-advice", titleEn: "Emergency precautions for a prolonged episode", instructionTextEn: "Keep the child safe from injury (lay them on a soft surface, turn to the side) and arrange emergency transport immediately if the episode doesn't resolve quickly or seizure-like movements continue.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["episode continues", "child doesn't wake up normally"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathholding-urgent-advice", titleEn: "Urgent first-episode evaluation", instructionTextEn: "Arrange a prompt GP appointment to confirm the diagnosis, especially for a first episode.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["episodes become more frequent or last longer"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathholding-selfcare-advice", titleEn: "Managing a breath-holding spell at home", instructionTextEn: "Stay calm - these episodes are involuntary and not the child's fault. Keep the child safe from falling during the episode. They almost always resolve on their own within a minute with full recovery.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["an episode lasts longer than usual", "the child doesn't fully recover"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-taught pediatric knowledge about breath-holding spells - the specific NHS.UK page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK breath-holding page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary pediatric knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Crying - Before 3 Months Old - https://www.nhs.uk/conditions/colic/ (reviewed 2022-04-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-crying-before-3-months",
    titleEn: "Crying - Before 3 Months Old",
    clinicalDefinitionEn: "Excessive crying/colic assessment in babies under 3 months, decomposed from NHS.UK's published colic guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 2,
    keywords: [
      { phrase: "baby wont stop crying", weight: 100 },
      { phrase: "newborn crying a lot", weight: 95 },
      { phrase: "think my baby has colic", weight: 100 },
      { phrase: "baby cries for hours", weight: 90 },
      { phrase: "wont stop crying no matter what i try", weight: 100 },
      { phrase: "think she has colic", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-cryingunder3m-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the baby?" },
      { id: "oscg-cryingunder3m-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long and how often does the crying last?" },
      { id: "oscg-cryingunder3m-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the cry sound different from normal - weak or high-pitched?" }
    ],
    questions: [
      {
        id: "oscg-cryingunder3m-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the baby have a weak or high-pitched cry, or does the cry sound different from their normal cry?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK colic guidance lists a weak or high-pitched cry as a call-999/A&E criterion - it can indicate a serious underlying illness.",
        redFlag: true,
        keywords: ["weak cry baby", "high pitched cry baby"],
        careAdviceIds: ["oscg-cryingunder3m-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-cryingunder3m-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Are you worried about the baby's crying, has nothing seemed to help, are you struggling to cope, or is the baby not growing/gaining weight as expected?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends contacting NHS 111 or a GP for these concerns - caregiver coping and baby's growth both matter.",
        redFlag: false,
        keywords: ["nothing helps baby crying", "struggling to cope with crying baby", "worried about baby weight and crying"],
        careAdviceIds: ["oscg-cryingunder3m-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-cryingunder3m-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical colic-pattern crying (more than 3 hours a day, 3+ days a week) in an otherwise healthy, well-growing baby, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes colic as common, starting at a few weeks old and usually resolving by 3-4 months.",
        redFlag: false,
        keywords: ["typical colic crying pattern"],
        careAdviceIds: ["oscg-cryingunder3m-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cryingunder3m-emergency-advice", titleEn: "Emergency precautions for an abnormal cry", instructionTextEn: "Arrange emergency transport immediately - a weak or high-pitched cry can be a sign of serious illness in a young baby.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["baby becomes floppy or unresponsive", "breathing changes"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cryingunder3m-urgent-advice", titleEn: "Urgent review for persistent crying", instructionTextEn: "Arrange a prompt GP or NHS 111-equivalent review, especially if coping is difficult - support is available and asking for help is important.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["weight gain concerns", "crying pattern changes"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-cryingunder3m-selfcare-advice", titleEn: "Home comfort measures for colic", instructionTextEn: "Hold and cuddle the baby during crying spells, keep them upright during feeds to reduce swallowed air, burp them afterward, try gentle rocking, a warm bath, or soft background noise. Colic isn't harmful and usually resolves by 3-4 months. If feeling overwhelmed, it's okay to put the baby down safely and take a short break.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["the cry changes character", "weight gain slows or stops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-04-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Colic\", https://www.nhs.uk/conditions/colic/ (page last reviewed 26 April 2022)"],
      contentNotice: "Decomposed from NHS.UK's published colic guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for babies under 3 months, the age range the source itself associates with colic. The source's UK-specific Cry-sis helpline number is deliberately not included, consistent with the sensitive-topic handling used elsewhere in this content set. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Crying - 3 Months and Older - https://www.nhs.uk/conditions/colic/ (reviewed 2022-04-26), generalized past colic age
  // ------------------------------------------------------------------
  {
    id: "oscg-crying-3-months-and-older",
    titleEn: "Crying - 3 Months and Older",
    clinicalDefinitionEn: "Persistent excessive crying assessment in infants past the typical colic age, decomposed from NHS.UK's published colic guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 2,
    keywords: [
      { phrase: "baby still crying a lot", weight: 100 },
      { phrase: "wont stop crying and hes older now", weight: 90 },
      { phrase: "excessive crying past colic age", weight: 90 },
      { phrase: "inconsolable crying older baby", weight: 90 },
      { phrase: "still crying a lot nothing seems to help", weight: 100 },
      { phrase: "months old and still crying", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-crying3mplus-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How old is the child?" },
      { id: "oscg-crying3mplus-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has the crying pattern lasted?" },
      { id: "oscg-crying3mplus-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever, pulling at ears, arching the back, or other new symptoms?" }
    ],
    questions: [
      {
        id: "oscg-crying3mplus-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does the child have a weak or high-pitched cry, or does the cry sound different from their normal cry, especially with lethargy or poor feeding?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Consistent with NHS.UK colic guidance's cry-quality red flag, an abnormal cry beyond the typical colic age is even more concerning for an underlying illness and needs emergency evaluation.",
        redFlag: true,
        keywords: ["weak cry older baby", "abnormal cry with lethargy"],
        careAdviceIds: ["oscg-crying3mplus-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-crying3mplus-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Has excessive crying continued or newly appeared past the typical colic age of 3-4 months, or is there fever, ear-pulling, back-arching, or another new symptom alongside the crying?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Persistent or new excessive crying beyond the age when colic typically resolves warrants medical evaluation to look for another cause (such as an ear infection or reflux).",
        redFlag: false,
        keywords: ["still crying a lot past colic age", "crying with fever or ear pulling"],
        careAdviceIds: ["oscg-crying3mplus-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-crying3mplus-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a brief, mild fussy period in an otherwise well child with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Brief, mild fussiness without other symptoms in an older infant is often manageable at home.",
        redFlag: false,
        keywords: ["brief mild fussiness older baby"],
        careAdviceIds: ["oscg-crying3mplus-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-crying3mplus-emergency-advice", titleEn: "Emergency precautions for an abnormal cry", instructionTextEn: "Arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["lethargy worsens", "feeding stops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-crying3mplus-urgent-advice", titleEn: "Urgent review for persistent crying past colic age", instructionTextEn: "Arrange a prompt GP or NHS 111-equivalent review to look for another cause, since colic typically resolves by 3-4 months.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever develops", "new symptoms appear"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-crying3mplus-selfcare-advice", titleEn: "Home comfort measures for a fussy older infant", instructionTextEn: "Hold and comfort the child, check for common causes like hunger, a wet diaper, or tiredness, and try gentle rocking or soft background noise.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["crying pattern changes or worsens", "fever or other symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-04-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Colic\" (cry-quality red flag, generalized past the typical colic age), https://www.nhs.uk/conditions/colic/ (page last reviewed 26 April 2022)"],
      contentNotice: "Generalizes the same NHS.UK colic guidance already used for Crying - Before 3 Months Old, applied to persistent/new crying past the age when colic typically resolves - a documented generalization since the source's own scope is colic specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Eating Disorders Symptoms and Questions - https://www.nhs.uk/conditions/eating-disorders/ (reviewed 2024-01-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-eating-disorders",
    titleEn: "Eating Disorders Symptoms and Questions",
    clinicalDefinitionEn: "Eating disorder symptom assessment decomposed from NHS.UK's published eating disorders guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "eating disorder", weight: 100 },
      { phrase: "anorexia symptoms", weight: 100 },
      { phrase: "not eating enough and losing weight", weight: 90 },
      { phrase: "making myself sick after eating", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eatingdisorders-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What eating patterns or behaviors are of concern?" },
      { id: "oscg-eatingdisorders-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this been happening?" },
      { id: "oscg-eatingdisorders-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fainting, chest symptoms, or extreme weight change?" }
    ],
    questions: [
      {
        id: "oscg-eatingdisorders-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there fainting or feeling faint, a racing heart, severe dizziness, tingling/numbness or poor circulation in the limbs, or an extremely high or low weight for age/height?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK eating disorders guidance identifies these as concerning physical warning signs that need immediate medical attention - severe eating disorders can cause life-threatening cardiac and electrolyte complications.",
        redFlag: true,
        keywords: ["fainting with eating disorder", "heart racing with eating disorder", "extreme weight loss"],
        careAdviceIds: ["oscg-eatingdisorders-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eatingdisorders-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a pattern of restrictive eating, making oneself sick after eating, laxative misuse, excessive exercise, or withdrawing from social situations involving food, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends contacting a GP as soon as possible for these behavioral patterns.",
        redFlag: false,
        keywords: ["restrictive eating pattern", "making myself sick after eating", "excessive exercise and eating concerns"],
        careAdviceIds: ["oscg-eatingdisorders-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eatingdisorders-emergency-advice", titleEn: "Emergency eating-disorder complication precautions", instructionTextEn: "Arrange emergency transport immediately - these physical symptoms can indicate a serious, life-threatening complication.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening dizziness or fainting", "chest symptoms develop"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eatingdisorders-urgent-advice", titleEn: "Getting help for a suspected eating disorder", instructionTextEn: "Contact a GP as soon as possible - they will assess eating habits, feelings, and overall health, and can refer to specialist support. With treatment, most people recover from an eating disorder. If supporting someone else, encourage them to see a GP and offer to go with them.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["physical symptoms develop", "the behavior pattern worsens"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Eating disorders\", https://www.nhs.uk/conditions/eating-disorders/ (page last reviewed 23 January 2024)"],
      contentNotice: "Decomposed from NHS.UK's published eating disorders guidance (Crown copyright, reused under the Open Government Licence). The source's UK-specific Beat helpline number is deliberately NOT included, consistent with the sensitive-topic handling already used for Suicide Concerns/Domestic Violence/Bullying - the host organization should connect callers to its own local eating-disorder support service. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. ICD and Pacemaker Symptoms and Questions - https://www.nhs.uk/conditions/pacemaker-implantation/ (reviewed 2026-03-30)
  // ------------------------------------------------------------------
  {
    id: "oscg-icd-and-pacemaker-symptoms",
    titleEn: "ICD and Pacemaker Symptoms and Questions",
    clinicalDefinitionEn: "Pacemaker/ICD (implantable cardioverter-defibrillator) symptom assessment decomposed from NHS.UK's published pacemaker implantation guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "pacemaker symptoms", weight: 100 },
      { phrase: "icd went off", weight: 100 },
      { phrase: "defibrillator shocked me", weight: 100 },
      { phrase: "pacemaker wound looks infected", weight: 95 },
      { phrase: "pacemaker shocked me", weight: 100 },
      { phrase: "shocked me a couple times", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-icdpacemaker-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the device implanted or last checked?" },
      { id: "oscg-icdpacemaker-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are present?" },
      { id: "oscg-icdpacemaker-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Did the ICD deliver a shock?" }
    ],
    questions: [
      {
        id: "oscg-icdpacemaker-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe difficulty breathing, chest tightness or heaviness, pain spreading to the arms/back/neck/jaw, severe pale/blue/grey skin, sudden confusion, or did the ICD deliver a shock (especially more than one)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK pacemaker guidance lists these as call-999/A&E criteria; an ICD shock (especially repeated shocks) always needs emergency evaluation to check the heart rhythm and device function.",
        redFlag: true,
        keywords: ["icd shocked me multiple times", "chest tightness with pacemaker", "difficulty breathing with pacemaker"],
        careAdviceIds: ["oscg-icdpacemaker-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-icdpacemaker-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the wound more swollen, painful, or red, is there blood, pus, or clear fluid leaking from the wound, is there a fever or chills, or have prior symptoms returned or worsened?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends contacting the pacemaker clinic or NHS 111 for these wound or symptom-recurrence concerns.",
        redFlag: false,
        keywords: ["pacemaker wound infected", "pacemaker site leaking fluid"],
        careAdviceIds: ["oscg-icdpacemaker-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-icdpacemaker-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this normal, expected post-implant recovery (mild soreness, fatigue) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes initial fatigue and chest soreness as expected, with full recovery over weeks to months.",
        redFlag: false,
        keywords: ["normal pacemaker recovery"],
        careAdviceIds: ["oscg-icdpacemaker-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-icdpacemaker-emergency-advice", titleEn: "Emergency pacemaker/ICD precautions", instructionTextEn: "Arrange emergency transport immediately - do not drive yourself.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["another shock occurs", "worsening breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-icdpacemaker-urgent-advice", titleEn: "Urgent pacemaker wound/symptom review", instructionTextEn: "Contact the pacemaker clinic or arrange same-day medical review for these signs.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["wound worsens", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-icdpacemaker-selfcare-advice", titleEn: "Home care during normal pacemaker recovery", instructionTextEn: "Keep the wound area clean and dry, do gentle shoulder exercises as directed by the care team, avoid driving for at least a week, and avoid heavy lifting, strenuous activity, or raising the elbow above shoulder height for 4-6 weeks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["wound changes", "new symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Pacemaker implantation\", https://www.nhs.uk/conditions/pacemaker-implantation/ (page last reviewed 30 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published pacemaker implantation guidance (Crown copyright, reused under the Open Government Licence), extended to cover ICD-specific shock events using standard cardiology knowledge (an ICD shock always warrants evaluation). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Marijuana Use and Problems - standard substance-use knowledge, sensitive-topic handling
  // ------------------------------------------------------------------
  {
    id: "oscg-marijuana-use-and-problems",
    titleEn: "Marijuana Use and Problems",
    clinicalDefinitionEn: "Marijuana (cannabis) use assessment based on standard, non-proprietary substance-use knowledge.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "marijuana use problem", weight: 100 },
      { phrase: "smoked too much weed", weight: 95 },
      { phrase: "cannabis use question", weight: 90 },
      { phrase: "edible hit too hard", weight: 90 },
      { phrase: "smoked way too much weed", weight: 100 },
      { phrase: "freaking out after smoking weed", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-marijuanause-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was used, how much, and when?" },
      { id: "oscg-marijuanause-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any chest pain, severe anxiety/panic, or confusion?" },
      { id: "oscg-marijuanause-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Was anything else taken (alcohol, other drugs)?" }
    ],
    questions: [
      {
        id: "oscg-marijuanause-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there chest pain, severe confusion or paranoia, a racing or irregular heartbeat with distress, vomiting that won't stop, or unresponsiveness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "While rarely life-threatening on its own, severe cardiac symptoms, uncontrolled vomiting (cannabinoid hyperemesis), or unresponsiveness need emergency evaluation, especially if other substances may be involved.",
        redFlag: true,
        keywords: ["chest pain after marijuana", "severe vomiting from marijuana use", "unresponsive after using marijuana"],
        careAdviceIds: ["oscg-marijuanause-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-marijuanause-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant anxiety, panic, or paranoia without the emergency features above, or a concern about frequent/problematic use?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Acute anxiety/panic reactions to marijuana (especially edibles) usually resolve but benefit from a calm, monitored environment; a pattern of concerning use benefits from prompt support.",
        redFlag: false,
        keywords: ["anxious and paranoid from marijuana", "worried about marijuana use pattern"],
        careAdviceIds: ["oscg-marijuanause-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-marijuanause-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild, self-limiting reaction (drowsiness, mild dizziness) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild intoxication effects typically resolve with rest and time.",
        redFlag: false,
        keywords: ["mild marijuana intoxication"],
        careAdviceIds: ["oscg-marijuanause-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-marijuanause-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Arrange emergency transport immediately, especially if other substances may be involved.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening chest symptoms"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-marijuanause-urgent-advice", titleEn: "Support for anxiety reaction or concerning use pattern", instructionTextEn: "Move to a calm, quiet, familiar space with reassurance until symptoms settle. Connect the caller with a substance-use support service if use is becoming frequent or problematic.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "physical symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-marijuanause-selfcare-advice", titleEn: "Home monitoring for mild intoxication", instructionTextEn: "Rest in a safe place, stay hydrated, and avoid driving or operating machinery until fully clear-headed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms worsen", "vomiting or chest symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary substance-use knowledge (acute cannabis intoxication/panic reaction management, cannabinoid hyperemesis recognition) - not a single-source quote"],
      contentNotice: "This protocol is based on widely-taught, non-proprietary substance-use knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, and awareness that cannabis legal status varies by jurisdiction (illegal in Qatar) - this content addresses medical triage only, not legal guidance."
    })
  },

  // ------------------------------------------------------------------
  // 8. Hallucinogenic Mushrooms - Use and Problems - standard substance-use knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-hallucinogenic-mushrooms-use-and-problems",
    titleEn: "Hallucinogenic Mushrooms - Use and Problems",
    clinicalDefinitionEn: "Hallucinogenic mushroom ('magic mushroom') use assessment based on standard, non-proprietary toxicology/substance-use knowledge.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "took magic mushrooms", weight: 100 },
      { phrase: "hallucinogenic mushrooms bad trip", weight: 100 },
      { phrase: "psilocybin mushrooms problem", weight: 90 },
      { phrase: "ate wild mushrooms and feel weird", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hallucmushrooms-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was taken, how much, and when?" },
      { id: "oscg-hallucmushrooms-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Could this have been a wild-foraged (unidentified) mushroom rather than a known hallucinogenic type?" },
      { id: "oscg-hallucmushrooms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any severe panic, injury risk, or physical symptoms (vomiting, chest pain)?" }
    ],
    questions: [
      {
        id: "oscg-hallucmushrooms-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Was an unidentified, wild-foraged mushroom eaten (possible toxic species, not a known hallucinogenic type), or is there severe vomiting, chest pain, seizure, or unresponsiveness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Unidentified wild mushrooms can be a genuine poisoning emergency (some toxic species cause severe organ damage and can be mistaken for hallucinogenic ones), and severe physical symptoms always need emergency evaluation.",
        redFlag: true,
        keywords: ["ate unidentified wild mushroom", "seizure after eating mushrooms", "severe vomiting after mushrooms"],
        careAdviceIds: ["oscg-hallucmushrooms-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hallucmushrooms-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there severe panic, paranoia, or risk of injury (attempting to wander into danger) from a known hallucinogenic mushroom, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A severe psychological reaction (\"bad trip\") benefits from a calm, safe, monitored environment and sometimes professional support.",
        redFlag: false,
        keywords: ["bad trip from mushrooms", "severe panic from mushrooms"],
        careAdviceIds: ["oscg-hallucmushrooms-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hallucmushrooms-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild, manageable reaction to a known hallucinogenic mushroom with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild hallucinogenic effects in a safe environment often resolve on their own over hours.",
        redFlag: false,
        keywords: ["mild reaction to mushrooms"],
        careAdviceIds: ["oscg-hallucmushrooms-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hallucmushrooms-emergency-advice", titleEn: "Emergency mushroom poisoning/complication precautions", instructionTextEn: "Arrange emergency transport immediately. If possible, keep a sample or photo of the mushroom for identification - this can be critical if it was wild-foraged.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening vomiting", "seizure or unresponsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hallucmushrooms-urgent-advice", titleEn: "Support for a severe psychological reaction", instructionTextEn: "Stay with the person in a calm, quiet, safe space away from hazards, and reassure them the effects will pass. Seek professional support if panic doesn't settle.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["injury risk increases", "physical symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hallucmushrooms-selfcare-advice", titleEn: "Home monitoring for a mild reaction", instructionTextEn: "Stay in a calm, safe environment with someone present until the effects wear off, usually within several hours.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["panic or physical symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary toxicology/substance-use knowledge (wild mushroom poisoning risk, acute hallucinogen reaction management) - not a single-source quote"],
      contentNotice: "This protocol is based on widely-taught, non-proprietary toxicology and substance-use knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Substance Use and Problems - general catch-all, standard knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-substance-use-and-problems",
    titleEn: "Substance Use and Problems",
    clinicalDefinitionEn: "General substance use concern assessment (not otherwise covered by a specific substance protocol), based on standard, non-proprietary substance-use knowledge.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "substance use problem", weight: 100 },
      { phrase: "drug use concern", weight: 95 },
      { phrase: "took some kind of drug", weight: 90 },
      { phrase: "worried about drug use", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-substanceuse-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What substance was used, how much, and when?" },
      { id: "oscg-substanceuse-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person conscious, breathing normally, and responsive?" },
      { id: "oscg-substanceuse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Were multiple substances combined (including alcohol)?" }
    ],
    questions: [
      {
        id: "oscg-substanceuse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person unresponsive or very difficult to wake, breathing abnormally (too fast, too slow, or not at all), having a seizure, or showing signs of severe overdose (chest pain, extreme agitation, very high temperature)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Widely-recognized emergency toxicology knowledge: these are signs of a potentially life-threatening overdose or severe reaction requiring immediate emergency care, especially when multiple substances are combined.",
        redFlag: true,
        keywords: ["unresponsive after taking drugs", "seizure after drug use", "not breathing after drug use"],
        careAdviceIds: ["oscg-substanceuse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-substanceuse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a concern about a pattern of substance use, dependence, or difficulty stopping, without signs of an acute emergency right now?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Ongoing substance use concerns benefit from prompt connection to medical and substance-use support services, and abrupt cessation of some substances can be medically risky without supervision.",
        redFlag: false,
        keywords: ["pattern of substance use concern", "trying to stop using drugs"],
        careAdviceIds: ["oscg-substanceuse-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-substanceuse-emergency-advice", titleEn: "Emergency overdose/severe reaction precautions", instructionTextEn: "Call for emergency help immediately. If trained, place in the recovery position if breathing, and be ready to perform CPR if not. Try to identify what was taken to inform emergency responders.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens or stops", "no response to stimulation"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-substanceuse-urgent-advice", titleEn: "Support for a substance use concern", instructionTextEn: "Arrange prompt medical review - do not stop some substances abruptly without medical guidance, since withdrawal can be dangerous for certain substances. Connect the caller with your organization's substance use support service.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["withdrawal symptoms develop", "any signs of overdose develop"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary emergency toxicology and substance-use support knowledge - not a single-source quote"],
      contentNotice: "This is a general catch-all protocol for substance-use concerns not covered by a more specific protocol (e.g. Alcohol Use and Problems, Opioid Use and Problems, Marijuana Use and Problems, all already in this content set). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Fluid Intake Increased - standard knowledge (polydipsia as a diabetes/DI red flag)
  // ------------------------------------------------------------------
  {
    id: "oscg-fluid-intake-increased",
    titleEn: "Fluid Intake Increased",
    clinicalDefinitionEn: "Increased thirst/fluid intake (polydipsia) assessment based on standard, widely-taught medical knowledge linking excessive thirst to diabetes and other underlying conditions.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "drinking a lot more water than usual", weight: 100 },
      { phrase: "extremely thirsty all the time", weight: 100 },
      { phrase: "increased thirst and urination", weight: 100 },
      { phrase: "cant stop drinking water", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fluidintake-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the increased thirst lasted?" },
      { id: "oscg-fluidintake-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any increased urination, weight loss, fatigue, or blurred vision?" },
      { id: "oscg-fluidintake-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any confusion, rapid breathing, or fruity-smelling breath?" }
    ],
    questions: [
      {
        id: "oscg-fluidintake-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with increased thirst, is there confusion, rapid or labored breathing, fruity-smelling breath, severe abdominal pain, vomiting, or extreme drowsiness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are recognized warning signs of diabetic ketoacidosis or severe uncontrolled diabetes - a life-threatening emergency requiring immediate care, widely-taught endocrinology knowledge.",
        redFlag: true,
        keywords: ["fruity breath with thirst", "confused and very thirsty", "rapid breathing with thirst"],
        careAdviceIds: ["oscg-fluidintake-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fluidintake-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there new increased thirst along with increased urination, unexplained weight loss, fatigue, or blurred vision?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This symptom combination is a classic presentation of new-onset diabetes and needs prompt medical evaluation and blood sugar testing.",
        redFlag: false,
        keywords: ["increased thirst and urination and weight loss", "new thirst with blurred vision"],
        careAdviceIds: ["oscg-fluidintake-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fluidintake-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild, explainable increased thirst (hot weather, exercise, salty food) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Thirst with an obvious explanation and no other symptoms is usually not concerning.",
        redFlag: false,
        keywords: ["mild explainable thirst"],
        careAdviceIds: ["oscg-fluidintake-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fluidintake-emergency-advice", titleEn: "Emergency diabetic emergency precautions", instructionTextEn: "Arrange emergency transport immediately - these are signs of a serious, potentially life-threatening blood sugar emergency.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fluidintake-urgent-advice", titleEn: "Urgent review for new increased thirst", instructionTextEn: "Arrange prompt medical review and blood sugar testing - this pattern needs evaluation for diabetes.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "confusion or rapid breathing develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fluidintake-selfcare-advice", titleEn: "Home monitoring for mild, explainable thirst", instructionTextEn: "Stay hydrated as needed; this is usually not concerning if there's an obvious cause and no other symptoms.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["thirst becomes excessive or unexplained", "other symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, widely-taught endocrinology knowledge linking polydipsia to diabetes/diabetic ketoacidosis - not a single-source quote; no single dedicated NHS.UK page covers increased fluid intake as its own presentation"],
      contentNotice: "This protocol is based on widely-taught, non-proprietary endocrinology knowledge (increased thirst as a diabetes/DKA warning sign). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
