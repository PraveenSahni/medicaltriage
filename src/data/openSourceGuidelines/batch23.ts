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
    clinicalDefinitionEn: "Qatar-localized UAT-only pediatric bedwetting pathway screening for diabetes, urinary disease, constipation, neurologic symptoms and safeguarding; not approved for production.",
    ageMin: 5,
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
      { id: "oscg-bedwetting-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Have home strategies already been tried?" },
      { id: "oscg-bedwetting-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; was the child previously dry; and are there excessive thirst/urination, weight loss, pain, fever, constipation, weakness, gait change, genital symptoms, stress, punishment, abuse or safeguarding concerns?" }
    ],
    questions: [
      {
        id: "oscg-bedwetting-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the wetting, is the child confused, difficult to wake, fainting or collapsing, having a seizure, severely short of breath, unable to keep fluids down and rapidly worsening, in immediate danger, or disclosing abuse while the suspected unsafe person is present?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Severe systemic illness, neurological deterioration or immediate safeguarding danger requires emergency assessment rather than a routine bedwetting pathway.",
        redFlag: true,
        keywords: ["child bedwetting critically unwell", "bedwetting with seizure", "bedwetting immediate safeguarding danger"],
        careAdviceIds: ["oscg-bedwetting-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-bedwetting-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is the child under 5, or is there excessive thirst or urination, weight loss, pain or fever, new daytime wetting, constipation with significant symptoms, weakness or gait change, genital symptoms, punishment, suspected abuse, or another safeguarding concern?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Children under 5 require an age-appropriate pathway, while diabetes, urinary, neurological, genital and safeguarding features require prompt pediatric assessment rather than routine enuresis advice.",
        redFlag: false,
        keywords: ["bedwetting child under five", "bedwetting with excessive thirst", "bedwetting with weakness", "bedwetting safeguarding concern"],
        careAdviceIds: ["oscg-bedwetting-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bedwetting-q0-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Has the child kept wetting the bed despite trying home strategies, or started wetting the bed again after being dry for more than 6 months?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK bedwetting guidance recommends primary-care review for these situations - a return of bedwetting after a dry period can occasionally indicate an underlying medical or emotional cause.",
        redFlag: false,
        keywords: ["bedwetting after being dry for months", "home strategies not working bedwetting"],
        careAdviceIds: ["oscg-bedwetting-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-bedwetting-q1-selfcare",
        acuityOrder: 4,
        severity: "Routine",
        questionTextEn: "Is the child age 5 or older with typical bedwetting and none of the features above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance states bedwetting in young children is normal, and many children under 5 experience it.",
        redFlag: false,
        keywords: ["typical bedwetting young child"],
        careAdviceIds: ["oscg-bedwetting-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 50,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bedwetting-emergency-advice", titleEn: "Emergency pediatric or safeguarding response", instructionTextEn: "For critical illness or immediate danger, call Qatar emergency services on 999 now and follow the call-taker's instructions. Keep the child with a safe adult where possible. Do not confront a suspected unsafe person or disclose the child's account to them. The exact Qatar child-protection reporting and safe-callback workflow remains GOVERNANCE_REQUIRED for UAT.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced responsiveness, collapse or seizure", "breathing difficulty or rapid deterioration", "immediate safeguarding danger"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bedwetting-urgent-advice", titleEn: "Prompt pediatric assessment", instructionTextEn: "Arrange prompt pediatric clinical review through the Qatar pathway approved for this UAT environment. A child under 5 must use a separately approved age-appropriate pathway. Excessive thirst or urination, weight loss, fever, pain, weakness, gait change, genital symptoms or safeguarding concerns must not be managed as routine bedwetting. The exact non-emergency destination, safeguarding report and safe-callback process remain GOVERNANCE_REQUIRED.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["the child becomes drowsy, weak or rapidly worse", "vomiting or inability to drink develops", "immediate safety concern develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-bedwetting-routine-advice", titleEn: "Routine bedwetting follow-up", instructionTextEn: "Arrange a primary-care appointment - a bedwetting alarm or medication may help if home strategies haven't worked.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["daytime wetting also develops", "pain with urination develops"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-bedwetting-selfcare-advice", titleEn: "Supportive bedwetting review", instructionTextEn: "Never punish or shame the child. Arrange pediatric primary-care review through the Qatar UAT pathway before alarms or medicine; assess daytime symptoms, constipation, diabetes risk and safeguarding. Maintain normal daytime hydration and regular toilet access without forced fluid restriction.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["excessive thirst, weight loss, pain, fever or weakness", "new daytime wetting or safeguarding concern"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-04-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Bedwetting\", https://www.nhs.uk/conditions/bedwetting/ (page last reviewed 11 April 2023)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Child-only Qatar pathway. Diabetes, neurologic and safeguarding concerns cannot be downgraded; age thresholds, alarms, medication and destination rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 2. Breath-Holding Spell - standard pediatric knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-breath-holding-spell",
    titleEn: "Breath-Holding Spell",
    clinicalDefinitionEn: "Qatar-localized UAT-only pediatric pathway for a possible breath-holding spell; diagnosis requires exclusion of seizure, cardiac, respiratory, metabolic, injury and safeguarding causes.",
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
      { id: "oscg-breathholding-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Did the child recover fully and quickly on their own?" },
      { id: "oscg-breathholding-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; was there a trigger; and are there exercise/sleep onset, prolonged unresponsiveness, seizure signs, injury, family sudden death, heart disease, ingestion or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-breathholding-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this a typical, brief, previously-diagnosed breath-holding spell with quick full recovery?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Breath-holding spells are a well-recognized, benign, involuntary reflex in young children that typically resolve by school age and don't need emergency treatment once diagnosed.",
        redFlag: false,
        keywords: ["typical previously diagnosed breath holding spell"],
        careAdviceIds: ["oscg-breathholding-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-breathholding-emergency-advice", titleEn: "Emergency precautions for a prolonged episode", instructionTextEn: "Call Qatar 999 for an ambulance now if the episode does not resolve quickly, seizure-like movements continue, breathing is abnormal, or the child does not wake normally. Do not self-drive. Protect the child from injury, place them on a safe flat surface, and follow the call handler's instructions; do not put anything in the mouth.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["episode continues", "child doesn't wake up normally"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathholding-urgent-advice", titleEn: "Urgent first-episode evaluation", instructionTextEn: "Arrange prompt clinical review to confirm the diagnosis, especially for a first episode.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["episodes become more frequent or last longer"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-breathholding-selfcare-advice", titleEn: "Clinical assessment after a possible spell", instructionTextEn: "Keep the child safe on a flat surface, do not shake, restrain or put anything in the mouth, and arrange prompt pediatric assessment through the Qatar UAT pathway. Call 999 if breathing or recovery is abnormal.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["episode continues or breathing is abnormal", "child does not recover fully"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-taught pediatric knowledge about breath-holding spells - the specific NHS.UK page could not be retrieved during authoring"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only pediatric synthesis with no generated IDs and no dedicated named source. Cardiac, seizure, ingestion and safeguarding exclusions and exact Qatar routing remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 3. Crying - Before 3 Months Old - https://www.nhs.uk/conditions/colic/ (reviewed 2022-04-26)
  // ------------------------------------------------------------------
  {
    id: "oscg-crying-before-3-months",
    titleEn: "Crying - Before 3 Months Old",
    clinicalDefinitionEn: "Safety-first unexplained crying assessment only for babies younger than 12 weeks. Crying with illness or another symptom requires assessment through the relevant symptom pathway; colic is considered only after serious illness, injury, feeding problems, and caregiver-safety concerns are excluded.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "pediatric",
    acuity: 5,
    keywords: [
      { phrase: "baby wont stop crying", weight: 100 },
      { phrase: "newborn crying a lot", weight: 95 },
      { phrase: "think my baby has colic", weight: 100 },
      { phrase: "baby cries for hours", weight: 90 },
      { phrase: "wont stop crying no matter what i try", weight: 100 },
      { phrase: "think she has colic", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-cryingunder3m-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the baby's date of birth and exact age in weeks? This protocol applies only before 12 weeks of age." },
      { id: "oscg-cryingunder3m-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the baby's measured temperature, how was it measured, and when?" },
      { id: "oscg-cryingunder3m-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is breathing normal, is colour normal, and is the baby alert and responding normally when awake?" },
      { id: "oscg-cryingunder3m-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "When did the baby last feed, how much compared with usual, and how many wet nappies have there been in the last 12 hours?" },
      { id: "oscg-cryingunder3m-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there vomiting, a new rash, a swollen soft spot, pain when touched or moved, or any possibility of injury?" },
      { id: "oscg-cryingunder3m-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "Is the caregiver overwhelmed, angry, or afraid that they or someone else may shake or hurt the baby?" }
    ],
    questions: [
      {
        id: "oscg-cryingunder3m-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the baby not moving, very weak or floppy, difficult to wake, having a seizure, struggling to breathe, blue or grey, or is there immediate concern that anyone may shake or hurt the baby?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Reduced responsiveness, weakness, abnormal colour, breathing compromise, seizure, or immediate risk of inflicted injury can be life-threatening and requires emergency help.",
        redFlag: true,
        keywords: ["floppy unresponsive crying baby", "blue baby breathing difficulty", "may shake or hurt baby"],
        careAdviceIds: ["oscg-cryingunder3m-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-cryingunder3m-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the baby under 12 weeks with a temperature of 38 C or higher; a weak, high-pitched, or different cry; poor feeding; markedly fewer wet nappies or none for 12 hours; repeated or forceful vomiting; green vomit; a non-blanching rash; a swollen soft spot; pain when touched or moved; possible injury; abnormal behaviour; or nonstop inconsolable crying for 2 hours?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NICE classifies temperature 38 C or higher before 3 months as high risk. Feeding reduction, reduced urine, abnormal responsiveness, abnormal cry, vomiting, rash, bulging fontanelle, pain or injury concern also require urgent in-person pediatric assessment.",
        redFlag: false,
        keywords: ["fever 38 baby under 3 months", "poor feeding fewer wet nappies", "weak high pitched cry", "inconsolable crying 2 hours"],
        careAdviceIds: ["oscg-cryingunder3m-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-cryingunder3m-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is the baby definitely younger than 12 weeks, previously assessed as having uncomplicated colic, consolable, alert and content between episodes, feeding and urinating normally, with measured temperature below 38 C and none of the emergency or urgent features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Home comfort measures are appropriate only for a previously assessed, otherwise well, consolable baby with normal feeding, urine output, temperature, breathing, colour, and behaviour.",
        redFlag: false,
        keywords: ["typical colic crying pattern"],
        careAdviceIds: ["oscg-cryingunder3m-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cryingunder3m-emergency-advice", titleEn: "Emergency precautions for a critically unwell or unsafe infant", instructionTextEn: "Call Qatar emergency services on 999 for an ambulance now; do not self-drive with an unstable infant. Follow the call handler's instructions. If there is a risk someone may hurt or shake the baby, place the baby on their back in a safe empty cot, move the unsafe person away, and have a safe adult take over if available. Never shake the baby.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["baby becomes floppy or unresponsive", "breathing or colour changes", "risk that someone may hurt the baby"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cryingunder3m-urgent-advice", titleEn: "Urgent in-person assessment for a young infant", instructionTextEn: "Arrange urgent in-person pediatric assessment now; the exact non-emergency Qatar destination remains GOVERNANCE_REQUIRED. Do not give fever medicine to delay assessment. Call 999 if the baby becomes difficult to wake, floppy, blue or grey, has breathing difficulty or a seizure, or cannot be transported safely.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["feeding or urine output falls", "crying or behaviour changes", "temperature reaches 38 C"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-cryingunder3m-selfcare-advice", titleEn: "Controlled comfort measures for previously assessed colic", instructionTextEn: "Use the baby's established feeding plan and try holding, gentle rocking, a warm bath, or quiet background sound. Always place the baby on their back in a safe empty cot for sleep. If overwhelmed, put the baby safely in the cot, step away briefly, and ask a safe adult to take over. Never shake the baby. Re-enter urgent assessment if the baby becomes difficult to console, feeds less, has fewer wet nappies, develops vomiting, fever, abnormal breathing or colour, becomes unusually sleepy, or the cry changes.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["temperature reaches 38 C", "feeding or wet nappies decrease", "cry, breathing, colour, or alertness changes", "caregiver feels at risk of losing control"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-04-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Colic\", https://www.nhs.uk/conditions/colic/", "NICE NG143, \"Fever in under 5s: assessment and initial management\", https://www.nice.org.uk/guidance/ng143/chapter/recommendations", "NICE NG194, \"Postnatal care\" - signs and symptoms of serious illness in babies, https://www.nice.org.uk/guidance/ng194/chapter/recommendations", "American Academy of Pediatrics HealthyChildren.org, \"Crying Baby - Before 3 Months Old\", https://www.healthychildren.org/English/tips-tools/Symptom-Checker/Pages/symptomviewer.aspx?symptom=Crying+Baby+-+Before+3+Months+Old"],
      contentNotice: "Safety-first UAT adaptation for infants younger than 12 weeks. It combines published colic advice with NICE infant fever/serious-illness red flags and AAP caregiver-safety guidance. The source's UK-specific service routes are excluded; the exact non-emergency Qatar pediatric destination and safeguarding workflow remain GOVERNANCE_REQUIRED. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical-governance validation before any nurse UAT and is prohibited from production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Crying - 3 Months and Older - https://www.nhs.uk/conditions/colic/ (reviewed 2022-04-26), generalized past colic age
  // ------------------------------------------------------------------
  {
    id: "oscg-crying-3-months-and-older",
    titleEn: "Crying - 3 Months and Older",
    clinicalDefinitionEn: "Qatar-localized UAT-only assessment for unexplained crying from 3 months onward; the cited colic source does not establish this age range, so illness, injury and safeguarding must be assessed in person.",
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
      { id: "oscg-crying3mplus-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any fever, pulling at ears, arching the back, or other new symptoms?" },
      { id: "oscg-crying3mplus-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; are feeding, urine, breathing, colour and alertness normal; and is there vomiting, rash, pain, injury, caregiver overwhelm or risk anyone may hurt the child?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-crying3mplus-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this a brief, mild fussy period in an otherwise well child with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Brief, mild fussiness without other symptoms in an older infant is often manageable at home.",
        redFlag: false,
        keywords: ["brief mild fussiness older baby"],
        careAdviceIds: ["oscg-crying3mplus-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-crying3mplus-emergency-advice", titleEn: "Emergency precautions for an abnormal cry", instructionTextEn: "Call Qatar 999 for an ambulance now and do not self-drive. Keep the child with a safe responsible adult and follow the call handler's instructions; do not give medicine, food, or drink to a child with reduced responsiveness or breathing difficulty.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["lethargy worsens", "feeding stops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-crying3mplus-urgent-advice", titleEn: "Urgent review for persistent crying past colic age", instructionTextEn: "Arrange prompt clinical review to look for another cause, since colic typically resolves by 3-4 months.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fever develops", "new symptoms appear"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-crying3mplus-selfcare-advice", titleEn: "Pediatric assessment for unexplained crying", instructionTextEn: "Arrange prompt in-person pediatric assessment. If overwhelmed, place the child safely in an age-appropriate cot, step away briefly and ask a safe adult for help. Never shake or hurt the child; call Qatar 999 for immediate danger or severe illness.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["crying or behaviour changes", "fever, feeding, urine, breathing, colour or alertness changes"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-04-26", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Pediatric" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Colic\" (cry-quality red flag, generalized past the typical colic age), https://www.nhs.uk/conditions/colic/ (page last reviewed 26 April 2022)"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only age-generalization with no generated IDs. Exact age-specific pediatric, injury and safeguarding pathways remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 5. Eating Disorders Symptoms and Questions - https://www.nhs.uk/conditions/eating-disorders/ (reviewed 2024-01-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-eating-disorders",
    titleEn: "Eating Disorders Symptoms and Questions",
    clinicalDefinitionEn: "Safety-first assessment of possible eating-disorder symptoms in adolescents and adults, including acute medical instability, suicide or self-harm risk, pregnancy, safeguarding, and need for confidential in-person assessment. This protocol does not diagnose an eating disorder.",
    ageMin: 10,
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
      { id: "oscg-eatingdisorders-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "When safe and appropriate, speak privately with the patient. What restriction, binge eating, vomiting, laxative or diuretic use, water loading, excessive exercise, weight change, or reduced intake is occurring, and for how long?" },
      { id: "oscg-eatingdisorders-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there fainting, inability to stand, chest pain, severe or irregular palpitations, breathing difficulty, confusion, seizure, severe weakness, very little urine, inability to keep fluids down, blood in vomit, or severe abdominal pain?" },
      { id: "oscg-eatingdisorders-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there current suicidal intent, a suicide plan, recent self-harm, inability to stay safe, or an immediate threat from another person?" },
      { id: "oscg-eatingdisorders-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "Record age, pregnancy or possible pregnancy, diabetes or other illness, medicines, recent purging, fluid intake and urine output, and any known abnormal pulse, blood pressure, glucose, or electrolytes." },
      { id: "oscg-eatingdisorders-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Does the patient feel safe with the caregiver or person present, and can they speak freely? Consider coercion, forced eating or restriction, abuse, neglect, and safeguarding without confronting a suspected unsafe person." }
    ],
    questions: [
      {
        id: "oscg-eatingdisorders-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse or fainting, inability to stand, chest pain, severe or irregular palpitations, breathing difficulty, confusion, seizure, severe weakness, severe dehydration or minimal urine, inability to keep fluids down, blood in vomit, severe abdominal pain, known severe electrolyte or glucose abnormality, current suicidal intent or plan, recent serious self-harm, inability to stay safe, or immediate danger from another person?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Eating disorders can cause life-threatening dehydration, electrolyte disturbance, hypoglycaemia, cardiac instability, organ failure, and psychiatric crisis. NICE recommends acute medical care for severe dehydration, electrolyte imbalance, malnutrition, or incipient organ failure; immediate suicide, self-harm, or safeguarding danger also requires emergency action.",
        redFlag: true,
        keywords: ["fainting with eating disorder", "irregular heartbeat with eating disorder", "severe dehydration", "vomiting blood", "suicidal with eating disorder", "unsafe caregiver"],
        careAdviceIds: ["oscg-eatingdisorders-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eatingdisorders-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Without an emergency feature, is there suspected restriction, binge eating, self-induced vomiting, laxative or diuretic misuse, water loading, excessive exercise, rapid or concerning weight change, growth or puberty concern, pregnancy, or coercion or safeguarding concern?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A suspected eating disorder requires prompt in-person medical and mental-health assessment; BMI, weight, or duration alone must not determine access to treatment. Adolescents need developmentally appropriate privacy and safeguarding, and pregnancy requires coordinated obstetric and eating-disorder care. The exact Qatar service and timeframe are governance-required.",
        redFlag: false,
        keywords: ["restrictive eating pattern", "making myself sick after eating", "excessive exercise and eating concerns"],
        careAdviceIds: ["oscg-eatingdisorders-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eatingdisorders-emergency-advice", titleEn: "Emergency eating-disorder or safety crisis", instructionTextEn: "Call Qatar 999 now for collapse, serious physical symptoms, or immediate suicide, self-harm, or violence risk. Do not allow self-driving. Keep the patient with a safe, trusted person, remove immediate means of harm only if safe, and follow the 999 call-handler's instructions. Do not attempt rapid feeding, forced feeding, electrolyte replacement, or large fluid intake outside a clinician-supervised plan because refeeding and electrolyte shifts can be dangerous.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["collapse, confusion, seizure, chest pain, severe palpitations, breathing difficulty, or reduced urine", "suicidal action, escalating self-harm, or immediate danger"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eatingdisorders-urgent-advice", titleEn: "Confidential in-person eating-disorder assessment", instructionTextEn: "Use the Qatar governance-approved in-person medical and mental-health pathway; the exact non-emergency service and timeframe are not defined by this UAT protocol. Arrange physical observations, hydration and electrolyte assessment, glucose when indicated, ECG risk assessment, mental-health and suicide screening, pregnancy care where relevant, and safeguarding review. Offer the adolescent or adult a private conversation while observing local consent and safeguarding policy. Do not prescribe a home refeeding, purging-withdrawal, fluid, electrolyte, or weight-restoration plan by telephone.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fainting, chest pain, palpitations, confusion, severe weakness, vomiting blood, inability to drink, or reduced urine", "suicidal thoughts, self-harm, coercion, abuse, or inability to remain safe"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-01-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Eating disorders\", https://www.nhs.uk/conditions/eating-disorders/ (page last reviewed 23 January 2024)",
        "NICE NG69, \"Eating disorders: recognition and treatment\", https://www.nice.org.uk/guidance/ng69/chapter/recommendations (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only safety synthesis for adolescent and adult eating-disorder presentations. It adds medical-instability, suicide/self-harm, pregnancy, privacy, coercion, and safeguarding controls and deliberately provides no telephone refeeding plan. Qatar non-emergency medical, mental-health, consent, confidentiality, and safeguarding routes require local governance approval. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. ICD and Pacemaker Symptoms and Questions - https://www.nhs.uk/conditions/pacemaker-implantation/ (reviewed 2026-03-30)
  // ------------------------------------------------------------------
  {
    id: "oscg-icd-and-pacemaker-symptoms",
    titleEn: "ICD and Pacemaker Symptoms and Questions",
    clinicalDefinitionEn: "Adult safety assessment for symptoms associated with an implanted pacemaker or implantable cardioverter-defibrillator (ICD), including shock events, arrhythmia symptoms, and implant-site complications.",
    ageMin: 18,
    mode: "after-hours",
    patientGroup: "adult",
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
      { id: "oscg-icdpacemaker-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Is this a pacemaker, ICD, or other implanted cardiac device, and when and where was it implanted or last checked? Use the device card if available without delaying care." },
      { id: "oscg-icdpacemaker-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Did the device deliver a shock? Record how many shocks, when they occurred, whether shocks are continuing, and symptoms before and after each shock." },
      { id: "oscg-icdpacemaker-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is there collapse or near-collapse, chest pain, breathing difficulty, palpitations, severe dizziness, confusion, or persistent weakness now?" },
      { id: "oscg-icdpacemaker-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is the implant site newly red, hot, swollen, open, draining blood, pus, or clear fluid, or associated with fever or chills?" },
      { id: "oscg-icdpacemaker-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Has anyone placed a magnet over the device, attempted to reprogram it, or manipulated the generator or leads? Do not do so." }
    ],
    questions: [
      {
        id: "oscg-icdpacemaker-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there collapse or near-collapse, chest pain, severe breathing difficulty, sustained or distressing palpitations, severe dizziness, confusion, pale/blue/grey skin, a shock with ongoing symptoms, more than one ICD shock, or continuing shocks?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These features may represent an unstable arrhythmia, cardiac event, device problem, or electrical storm. Repeated ICD shocks or any shock with ongoing symptoms require immediate emergency assessment.",
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
        questionTextEn: "If no emergency feature is present, was there one ICD shock followed by full recovery, are palpitations, dizziness, breathlessness, or prior symptoms recurring, or is the implant site red, hot, swollen, painful, open, or draining, with or without fever or chills?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A single ICD shock still requires prompt device-team review, and recurrent symptoms or implant-site infection may require device interrogation, rhythm assessment, or treatment. The exact Qatar device-clinic route and timeframe are governance-required.",
        redFlag: false,
        keywords: ["pacemaker wound infected", "pacemaker site leaking fluid"],
        careAdviceIds: ["oscg-icdpacemaker-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-icdpacemaker-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this only a non-urgent device question with no shock, cardiac symptom, wound change, fever, or other feature above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Device-specific restrictions and expected recovery depend on device type, indication, implant date, manufacturer, and implanting team's instructions; telephone triage should defer to the governance-approved device service.",
        redFlag: false,
        keywords: ["normal pacemaker recovery"],
        careAdviceIds: ["oscg-icdpacemaker-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-icdpacemaker-emergency-advice", titleEn: "Emergency ICD or pacemaker precautions", instructionTextEn: "Call Qatar 999 now. Sit or lie in a safe place, keep another person nearby if possible, and do not drive. Do not place a magnet over the device, attempt programming, manipulate the generator or leads, or touch the patient during an active shock. Follow the 999 call-handler's instructions; begin resuscitation if directed if the patient becomes unresponsive and is not breathing normally.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["another shock, collapse, chest pain, severe palpitations, or worsening breathing", "unresponsiveness or abnormal breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-icdpacemaker-urgent-advice", titleEn: "Prompt device-clinic or in-person review", instructionTextEn: "Use the Qatar governance-approved device-clinic or in-person pathway; the exact service and timeframe are not defined by this UAT protocol. Keep the device identification card and shock details available. Do not drive after a shock or while symptomatic, and do not apply magnets or manipulate the device. Keep an affected implant wound clean and dry without squeezing or probing it.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["another shock, fainting, chest pain, breathing difficulty, sustained palpitations, or severe dizziness", "spreading redness, wound opening or drainage, fever, or chills"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-icdpacemaker-routine-advice", titleEn: "Governance-approved device advice", instructionTextEn: "Use the Qatar governance-approved device service for individualized advice. Follow the implanting team's written instructions for activity, wound care, driving, medicines, electromagnetic exposure, and follow-up; this UAT protocol does not set universal time limits.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["shock, fainting, chest pain, breathing difficulty, palpitations, fever, or wound change"], displayOrder: 3, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "NHS.UK, \"Pacemaker implantation\", https://www.nhs.uk/conditions/pacemaker-implantation/ (page last reviewed 30 March 2026)",
        "Mid and South Essex NHS Foundation Trust, \"Pacemaker and ICD patients\", https://www.mse.nhs.uk/pacemaker-and-icd-patients/ (accessed 25 July 2026)",
        "American Heart Association, \"Living With Your Implantable Cardioverter Defibrillator (ICD)\", https://www.heart.org/en/health-topics/arrhythmia/prevention--treatment-of-arrhythmia/living-with-your-implantable-cardioverter-defibrillator-icd (accessed 25 July 2026)",
        "Qatar Ministry of Public Health, \"Healthcare Services in Qatar\", https://sportandhealth.moph.gov.qa/EN/faninfo/Pages/HealthcareServicesInQatar.aspx (999 ambulance access; accessed 25 July 2026)"
      ],
      contentNotice: "UAT-only adult safety synthesis for pacemaker and ICD symptoms. Repeated shocks, a shock with ongoing symptoms, unstable cardiac features, and device-site infection are distinguished, while magnets, device manipulation, self-driving, and universal recovery restrictions are avoided. The exact Qatar device-clinic route and non-emergency timeframe require local governance approval. Not licensed Schmitt-Thompson (STCC) content. Requires Qatar clinical governance validation before any production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Marijuana Use and Problems - standard substance-use knowledge, sensitive-topic handling
  // ------------------------------------------------------------------
  {
    id: "oscg-marijuana-use-and-problems",
    titleEn: "Marijuana Use and Problems",
    clinicalDefinitionEn: "Qatar-localized UAT-only toxicology and safety pathway for suspected cannabis exposure, including children, pregnancy, co-ingestion, mental-health crisis and safeguarding.",
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
      { id: "oscg-marijuanause-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Was anything else taken (alcohol, other drugs)?" },
      { id: "oscg-marijuanause-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; what product/amount/time/route; and are there chest symptoms, severe anxiety/psychosis, vomiting, drowsiness, injury, self-harm or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-marijuanause-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this a mild, self-limiting reaction (drowsiness, mild dizziness) with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Mild intoxication effects typically resolve with rest and time.",
        redFlag: false,
        keywords: ["mild marijuana intoxication"],
        careAdviceIds: ["oscg-marijuanause-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-marijuanause-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Call Qatar 999 for an ambulance now, especially if other substances may be involved, and do not self-drive. Do not induce vomiting or give food, drink, or medicine unless directed by the emergency team.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening chest symptoms"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-marijuanause-urgent-advice", titleEn: "Support for anxiety reaction or concerning use pattern", instructionTextEn: "Move to a calm, quiet, familiar space with reassurance until symptoms settle. Connect the caller with a substance-use support service if use is becoming frequent or problematic.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "physical symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-marijuanause-selfcare-advice", titleEn: "In-person toxicology assessment", instructionTextEn: "Keep the patient with a safe sober adult, do not drive, induce vomiting or give unverified remedies, and arrange prompt in-person Qatar assessment. Preserve packaging if safe; do not delay emergency care.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["drowsiness, agitation, psychosis, vomiting or chest symptoms", "self-harm or immediate safety concern"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary substance-use knowledge (acute cannabis intoxication/panic reaction management, cannabinoid hyperemesis recognition) - not a single-source quote"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only toxicology synthesis with no generated IDs. Qatar poison-service, pediatric, pregnancy, mental-health, confidentiality and safeguarding routes remain GOVERNANCE_REQUIRED; no legal advice is provided."
    })
  },

  // ------------------------------------------------------------------
  // 8. Hallucinogenic Mushrooms - Use and Problems - standard substance-use knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-hallucinogenic-mushrooms-use-and-problems",
    titleEn: "Hallucinogenic Mushrooms - Use and Problems",
    clinicalDefinitionEn: "Qatar-localized UAT-only toxicology pathway for known or suspected mushroom ingestion; wild mushroom toxicity cannot be distinguished from hallucinogenic exposure remotely.",
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
      { id: "oscg-hallucmushrooms-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any severe panic, injury risk, or physical symptoms (vomiting, chest pain)?" },
      { id: "oscg-hallucmushrooms-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; was the mushroom wild/unknown; what amount/time; what co-ingestants; and are there confusion, drowsiness, seizures, self-harm or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hallucmushrooms-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this a mild, manageable reaction to a known hallucinogenic mushroom with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Mild hallucinogenic effects in a safe environment often resolve on their own over hours.",
        redFlag: false,
        keywords: ["mild reaction to mushrooms"],
        careAdviceIds: ["oscg-hallucmushrooms-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hallucmushrooms-emergency-advice", titleEn: "Emergency mushroom poisoning/complication precautions", instructionTextEn: "Call Qatar 999 for an ambulance now and do not self-drive. Do not induce vomiting or give food, drink, or medicine unless directed by the emergency team. If safe, retain a sample or photo for identification without delaying emergency care.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening vomiting", "seizure or unresponsiveness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hallucmushrooms-urgent-advice", titleEn: "Support for a severe psychological reaction", instructionTextEn: "Stay with the person in a calm, quiet, safe space away from hazards, and reassure them the effects will pass. Seek professional support if panic doesn't settle.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["injury risk increases", "physical symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hallucmushrooms-selfcare-advice", titleEn: "Urgent mushroom-exposure assessment", instructionTextEn: "Keep the patient with a safe sober adult, do not induce vomiting or give food, drink or remedies unless directed, and arrange prompt in-person toxicology assessment. Preserve a sample/photo and packaging only if safe.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vomiting, pain, confusion, drowsiness or seizure", "panic, unsafe behaviour or self-harm risk"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary toxicology/substance-use knowledge (wild mushroom poisoning risk, acute hallucinogen reaction management) - not a single-source quote"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only toxicology synthesis with no generated IDs. Qatar poison-service, species identification, pediatric, pregnancy, psychiatric and safeguarding rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 9. Substance Use and Problems - general catch-all, standard knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-substance-use-and-problems",
    titleEn: "Substance Use and Problems",
    clinicalDefinitionEn: "Qatar-localized UAT-only catch-all pathway for an unknown or mixed substance exposure, prioritizing airway, overdose, withdrawal, mental-health and safeguarding emergencies.",
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
      { id: "oscg-substanceuse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Were multiple substances combined (including alcohol)?" },
      { id: "oscg-substanceuse-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; what substance/amount/time/route; and are there abnormal breathing, drowsiness, agitation, seizure, chest symptoms, self-harm, coercion or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-substanceuse-emergency-advice", titleEn: "Emergency overdose/severe reaction precautions", instructionTextEn: "Call Qatar 999 for an ambulance now and do not self-drive. Follow the call handler's instructions for recovery position or CPR. Do not induce vomiting or give food, drink, or medicine. Identify containers or substances for responders only when safe and without delaying care.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens or stops", "no response to stimulation"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-substanceuse-urgent-advice", titleEn: "Support for a substance use concern", instructionTextEn: "Arrange prompt medical review - do not stop some substances abruptly without medical guidance, since withdrawal can be dangerous for certain substances. Connect the caller with your organization's substance use support service.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["withdrawal symptoms develop", "any signs of overdose develop"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, non-proprietary emergency toxicology and substance-use support knowledge - not a single-source quote"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only catch-all synthesis with no generated IDs. It must defer to substance-specific pathways when known; Qatar poison-service, withdrawal, mental-health, pregnancy, confidentiality and safeguarding rules remain GOVERNANCE_REQUIRED."
    })
  },

  // ------------------------------------------------------------------
  // 10. Fluid Intake Increased - standard knowledge (polydipsia as a diabetes/DI red flag)
  // ------------------------------------------------------------------
  {
    id: "oscg-fluid-intake-increased",
    titleEn: "Fluid Intake Increased",
    clinicalDefinitionEn: "Qatar-localized UAT-only adult and pediatric pathway for increased thirst/fluid intake, screening for diabetes/DKA, dehydration, electrolyte disturbance, pregnancy and safeguarding.",
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
      { id: "oscg-fluidintake-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any confusion, rapid breathing, or fruity-smelling breath?" },
      { id: "oscg-fluidintake-iaq4", sequence: 4, responseType: "OPEN_TEXT", promptTextEn: "What is the exact age; is the patient pregnant; and are there frequent urination, weight loss, vomiting, abdominal pain, weakness, reduced responsiveness, diabetes, kidney disease, medication change, forced drinking or safeguarding concerns?" }
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
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fluidintake-q2-selfcare",
        acuityOrder: 3,
        severity: "Urgent",
        questionTextEn: "Is this mild, explainable increased thirst (hot weather, exercise, salty food) with none of the features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Thirst with an obvious explanation and no other symptoms is usually not concerning.",
        redFlag: false,
        keywords: ["mild explainable thirst"],
        careAdviceIds: ["oscg-fluidintake-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fluidintake-emergency-advice", titleEn: "Emergency diabetic emergency precautions", instructionTextEn: "Call Qatar 999 for an ambulance now and do not self-drive. Follow the patient's written diabetes emergency plan only if applicable and the patient can safely swallow; do not force fluids, food, insulin, or other medicine while awaiting emergency guidance.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "worsening breathing"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fluidintake-urgent-advice", titleEn: "Urgent review for new increased thirst", instructionTextEn: "Arrange prompt medical review and blood sugar testing - this pattern needs evaluation for diabetes.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "confusion or rapid breathing develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fluidintake-selfcare-advice", titleEn: "In-person assessment of increased thirst", instructionTextEn: "Arrange prompt in-person assessment through the Qatar UAT pathway. Do not force excessive water intake or restrict fluids without clinical advice; glucose, ketones, hydration, electrolytes, pregnancy and medication causes may need checking.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vomiting, abdominal pain, rapid breathing, confusion or drowsiness", "increasing thirst, urination, weakness or weight loss"], displayOrder: 3, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, widely-taught endocrinology knowledge linking polydipsia to diabetes/diabetic ketoacidosis - not a single-source quote; no single dedicated NHS.UK page covers increased fluid intake as its own presentation"],
      contentNotice: "UAT DATA ONLY — NOT FOR REAL-PATIENT CARE OR PRODUCTION. Source-only synthesis with no generated IDs. Diabetes/DKA cannot be downgraded; pediatric, pregnancy, electrolyte, medication and safeguarding rules remain GOVERNANCE_REQUIRED."
    })
  }
];
