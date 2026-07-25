import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

const buildBatch19UatProvenance = (
  input: Parameters<typeof buildGuidelineProvenance>[0]
) => buildGuidelineProvenance({
  ...input,
  contentNotice: `${input.contentNotice} UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Exact Qatar routes, medication/dose eligibility, pediatric handling, pregnancy/postpartum handling, immunocompromise, safeguarding, and escalation details are GOVERNANCE_REQUIRED. All branches are non-telemedicine pending Qatar clinical and nursing approval.`
});

/**
 * Batch 19 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence) where available, plus standard, non-proprietary medical/first-aid
 * knowledge where a specific NHS.UK page could not be retrieved (Bruises,
 * Drowning and Submersion Event, Electric Shock or Lightning Injury). Groin
 * Injury and Strain generalizes the fracture/strain red-flag pattern already
 * established for Arm/Leg Pain (batch15) and limb injuries. Eyelid Swelling
 * reuses the eye-injury/allergy emergency criteria already cited for Eye
 * Injury (batch13) and Eye - Allergy (batch07).
 */
export const batch19Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Eye - Redness - https://www.nhs.uk/conditions/red-eye/ (reviewed 2025-10-27)
  // ------------------------------------------------------------------
  {
    id: "oscg-eye-redness",
    titleEn: "Eye - Redness",
    clinicalDefinitionEn: "Red eye assessment decomposed from NHS.UK's published red eye guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "red eye", weight: 100 },
      { phrase: "eye is really red", weight: 95 },
      { phrase: "bloodshot eye", weight: 90 },
      { phrase: "whites of my eye are red", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyeredness-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the eye been red?" },
      { id: "oscg-eyeredness-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any vision change, pain, or discharge?" },
      { id: "oscg-eyeredness-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Does the person wear contact lenses?" }
    ],
    questions: [
      {
        id: "oscg-eyeredness-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the red eye, is there vision change (wavy lines, flashing, loss of vision), severe light sensitivity, a severe headache with nausea, very dark redness, an eye injury or object in the eye, chemical exposure, or unequal pupil sizes?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK red eye guidance lists these as emergency-assessment criteria.",
        redFlag: true,
        keywords: ["red eye with vision change", "red eye with severe headache", "chemical in red eye"],
        careAdviceIds: ["oscg-eyeredness-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyeredness-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is a baby under 28 days old affected, is the eye very painful and red, or is there redness with contact lens wear?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends urgent clinical or optician review for these situations - contact-lens-related redness can indicate a serious infection.",
        redFlag: false,
        keywords: ["newborn red eyes", "very painful red eye", "red eye with contact lenses"],
        careAdviceIds: ["oscg-eyeredness-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-eyeredness-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild redness with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes mild red eye as often resolving within a few days.",
        redFlag: false,
        keywords: ["mild eye redness"],
        careAdviceIds: ["oscg-eyeredness-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyeredness-emergency-advice", titleEn: "Qatar emergency red-eye precautions", instructionTextEn: "Call Qatar emergency services on 999 now for sudden vision loss, severe eye pain with headache or vomiting, penetrating injury, or serious chemical exposure, and follow the call-taker's instructions. Do not drive. Do not rub, press, patch, or put unprescribed drops in the eye, and remove contact lenses only if this is easy and they are not stuck. For chemical exposure, immediately irrigate continuously with clean lukewarm water while arranging emergency help; do not delay irrigation to complete this assessment.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening or lost vision", "severe or worsening pain", "chemical or penetrating injury"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeredness-urgent-advice", titleEn: "Urgent red eye review", instructionTextEn: "Stop wearing contact lenses and arrange same-day medical or eye-care review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "vision changes develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyeredness-selfcare-advice", titleEn: "Home care for mild eye redness", instructionTextEn: "Avoid touching or rubbing the eye and stop wearing contact lenses until it clears. It should improve within a few days.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["persists beyond a few days", "sticky discharge or pain develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-10-27", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: ["NHS.UK, \"Red eye\", https://www.nhs.uk/conditions/red-eye/ (page last reviewed 27 October 2025)"],
      contentNotice: "Decomposed from NHS.UK's published red eye guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Blood Pressure - Low - Qatar-localized UAT structure; governance review required
  // ------------------------------------------------------------------
  {
    id: "oscg-blood-pressure-low",
    titleEn: "Blood Pressure - Low",
    clinicalDefinitionEn: "UAT assessment structure for a low blood-pressure reading or symptoms compatible with hypotension. A reading is interpreted with age, pregnancy/postpartum status, symptoms, trend, measurement quality, prescribed baseline, and possible causes such as bleeding, severe infection/sepsis, anaphylaxis, cardiac illness, dehydration, heat illness, or medication effects. A single home-device value does not diagnose shock and a reassuring value must not override serious symptoms.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "low blood pressure", weight: 100 },
      { phrase: "blood pressure dropped", weight: 95 },
      { phrase: "hypotension symptoms", weight: 90 },
      { phrase: "feel dizzy when i stand up low bp", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-lowbp-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, and are they pregnant or within 6 weeks after birth? For a child, record the exact age rather than applying an adult blood-pressure threshold." },
      { id: "oscg-lowbp-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What were the blood-pressure readings, when were they taken, and what is the person's usual or clinician-set range? Was the correct cuff size used on a supported bare arm at heart level after rest, and was the reading repeated?" },
      { id: "oscg-lowbp-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person unresponsive, difficult to wake, confused, fainting, unable to stand, very weak, pale/mottled/cold/clammy, breathing abnormally, or passing very little or no urine?" },
      { id: "oscg-lowbp-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there chest pain, severe breathlessness, a very fast/slow/irregular heartbeat, stroke signs, seizure, severe abdominal or back pain, major injury, or visible or suspected internal bleeding such as vomiting blood, black/bloody stool, or heavy vaginal bleeding?" },
      { id: "oscg-lowbp-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there possible severe infection or sepsis: rapid deterioration, fever or unusually low temperature, shaking, abnormal colour, severe pain, fast/difficult breathing, confusion, unusual sleepiness, poor feeding, repeated vomiting, or reduced urine/wet nappies?" },
      { id: "oscg-lowbp-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "After a possible allergen, is there throat/tongue swelling, wheeze or breathing difficulty, widespread hives, vomiting, sudden dizziness/faintness, confusion, floppiness, or pale/cold/clammy skin?" },
      { id: "oscg-lowbp-iaq7", sequence: 7, responseType: "YES_NO", promptTextEn: "Could dehydration, heat exposure, vomiting/diarrhoea, poor intake, a new or changed medicine, overdose, pregnancy complication, or a heart/endocrine condition be contributing?" }
    ],
    questions: [
      {
        id: "oscg-lowbp-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person unresponsive or difficult to wake; repeatedly fainting; confused; unable to stand; severely weak; pale, mottled, cold or clammy; breathing abnormally; or rapidly worsening? Is there chest pain, severe breathlessness, a dangerous-feeling heartbeat, stroke signs, seizure, major trauma, severe abdominal/back pain, heavy or suspected internal bleeding, severe infection/sepsis features, or suspected anaphylaxis? In a baby or child, include floppiness, abnormal interaction, poor feeding, abnormal breathing, abnormal colour, repeated vomiting, or markedly reduced urine/wet nappies. During pregnancy or within 6 weeks after birth, include faintness with bleeding, severe abdominal pain, chest/breathing symptoms, severe headache/visual symptoms, or collapse.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Hypotension with impaired consciousness, breathing/circulation abnormality, bleeding, anaphylaxis, cardiac or neurological symptoms, sepsis, trauma, or pregnancy/postpartum danger signs may represent shock or another time-critical condition. Emergency disposition is driven by the whole clinical picture, not a numeric threshold or one device reading.",
        redFlag: true,
        keywords: ["fainted with low blood pressure", "signs of shock low bp"],
        careAdviceIds: ["oscg-lowbp-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-lowbp-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With all emergency features absent, is this a child with a reported low reading or new dizziness/weakness; a pregnant or recently postpartum person with a new low reading or symptoms; or anyone with persistent/recurrent dizziness, near-fainting, blurred vision, nausea, weakness, postural symptoms, reduced intake/urine, vomiting/diarrhoea, heat exposure, or a new/changed medicine?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Persistent or recurrent symptoms need prompt assessment for dehydration, medication effects, pregnancy-related causes, cardiac/endocrine illness, or evolving infection. Pediatric blood pressure is age- and size-dependent, so this UAT protocol does not apply an adult cutoff to a child.",
        redFlag: false,
        keywords: ["recurring low blood pressure symptoms"],
        careAdviceIds: ["oscg-lowbp-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-lowbp-q2-measurement-review",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Are there no symptoms or danger features, with only one unexpectedly low home/device reading or a reading consistent with the person's clinician-documented usual range?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "One isolated reading can be affected by cuff size, position, rest, movement, device limitations, or the person's normal baseline. A properly repeated measurement and clinician review are safer than diagnosing or treating from a single number; Qatar service route and timing require local approval.",
        redFlag: false,
        keywords: ["single low blood pressure reading", "asymptomatic low blood pressure"],
        careAdviceIds: ["oscg-lowbp-measurement-advice"],
        telemedicineEligible: false,
        dispositionLevel: 40,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lowbp-emergency-advice", titleEn: "Qatar emergency response for shock or a dangerous underlying cause", instructionTextEn: "Call Qatar emergency services on 999 now and follow the call-taker's instructions; do not drive or let the person walk. Keep them still and warm. If faint but breathing normally, lay them flat if tolerated; use the recovery position if unconscious but breathing. If late in pregnancy, place them on their left side unless breathing is easier in another position or 999 advises otherwise. If breathing is difficult, allow the position that makes breathing easiest. Control visible external bleeding with firm direct pressure if safe. If anaphylaxis is suspected, use the person's prescribed adrenaline auto-injector immediately and follow their emergency plan. If unresponsive and not breathing normally, start age-appropriate CPR as directed by 999 and use an AED if available. Do not give food, drink, salt, caffeine, or unprescribed medicine, and do not delay for another blood-pressure reading.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["reduced consciousness or repeated fainting", "abnormal breathing, chest pain, or stroke signs", "cold, clammy, pale, mottled, or rapidly worsening condition", "bleeding or major trauma", "sepsis or anaphylaxis features", "pregnancy or postpartum danger signs"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lowbp-urgent-advice", titleEn: "Prompt in-person assessment for symptomatic or higher-risk low blood pressure", instructionTextEn: "Arrange prompt same-day in-person assessment through the Qatar route approved by local clinical governance. Keep the person seated or lying until dizziness settles, assist them when standing, and prevent falls. Small sips of fluid may be reasonable only if fully alert, not vomiting, and without a clinician-imposed fluid restriction; do not force fluids in a baby, pregnant person, or anyone with heart/kidney disease. Do not stop, skip, or change prescribed medicine without clinician advice. Record readings, symptoms, timing, recent illness/intake, pregnancy/postpartum status, and medicines. Call 999 if any emergency feature appears or the person cannot be safely transported.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["fainting, confusion, or inability to stand", "chest pain or abnormal breathing", "bleeding, severe pain, or pregnancy/postpartum concern", "fever, abnormal colour, reduced urine, or rapid deterioration", "allergic swelling or wheeze"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-lowbp-measurement-advice", titleEn: "Repeat and review an isolated asymptomatic reading", instructionTextEn: "If the person remains completely well, rest quietly for at least 5 minutes, use a validated device and correctly sized cuff on a supported bare arm at heart level, avoid talking or moving, and repeat the measurement according to the device instructions. Record both readings rather than repeatedly checking. Arrange review through the Qatar non-emergency route and timing approved by local governance, especially for a child, pregnancy/postpartum patient, new medicine, or a result outside the person's clinician-documented usual range. Do not use this branch when symptoms or danger signs are present, and do not change medicine, deliberately increase salt, or advise extra fluid without considering pregnancy and heart/kidney restrictions.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["dizziness, weakness, fainting, or confusion", "abnormal breathing, chest pain, bleeding, fever, or reduced urine", "new concern in a child or pregnancy/postpartum", "repeat reading remains unexpectedly different from documented baseline"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, cardiology, sepsis, allergy, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Low blood pressure (hypotension)\", https://www.nhs.uk/conditions/low-blood-pressure-hypotension/ (page last reviewed 11 July 2023)",
        "NHS.UK, \"Blood pressure test\", https://www.nhs.uk/tests-and-treatments/blood-pressure-test/ (accessed 2026-07-25)",
        "NHS.UK, \"Sepsis\", https://www.nhs.uk/conditions/sepsis/ (accessed 2026-07-25)",
        "NHS.UK, \"Anaphylaxis\", https://www.nhs.uk/conditions/anaphylaxis/ (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. Emergency routing is based on symptoms and suspected shock, bleeding, anaphylaxis, cardiac/neurological illness, sepsis, trauma, or pregnancy/postpartum complications, not a single numeric reading. The adult NHS definition of less than 90/60 mmHg is not used as a pediatric emergency threshold; child interpretation requires age/size-appropriate Qatar governance. Device accuracy, cuff size, rest, arm position, repeat measurement, trend, and documented baseline must be considered, but rechecking must never delay Qatar 999. All branches are non-telemedicine pending approval. The non-emergency service route, pediatric thresholds, pregnancy/postpartum pathway, fluid advice, and medication actions are GOVERNANCE_REQUIRED. Requires Qatar adult, pediatric, obstetric, emergency, cardiology, sepsis, allergy, and nursing approval before nurse UAT. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 3. Influenza (Flu) Suspected - https://www.nhs.uk/conditions/flu/ (reviewed 2026-02-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-influenza-suspected",
    titleEn: "Influenza (Flu) Suspected",
    clinicalDefinitionEn: "Suspected influenza (flu) assessment decomposed from NHS.UK's published flu guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "think i have the flu", weight: 100 },
      { phrase: "flu symptoms", weight: 100 },
      { phrase: "body aches and fever flu", weight: 90 },
      { phrase: "influenza symptoms", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-flususpected-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-flususpected-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-flususpected-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any chronic conditions, pregnancy, or age 65+?" }
    ],
    questions: [
      {
        id: "oscg-flususpected-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden chest pain, severe or abnormal breathing (gasping, choking, unable to speak or feed normally), coughing up blood, blue or grey colour, confusion, collapse, a seizure, severe dehydration, or is a baby or child unusually floppy, difficult to wake, feeding poorly, or rapidly worsening?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK flu and emergency guidance treats severe breathing, chest pain, haemoptysis and rapid serious deterioration as emergency features; infant colour, responsiveness, feeding and hydration changes can be signs of serious illness.",
        redFlag: true,
        keywords: ["chest pain with flu", "coughing up blood with flu", "cant breathe with flu", "floppy infant with flu", "blue child with flu"],
        careAdviceIds: ["oscg-flususpected-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-flususpected-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "After emergency features are excluded, is the patient under 3 months with a measured temperature of 38 degrees Celsius or higher, age 3-6 months with a measured temperature of 39 degrees Celsius or higher, or is the person 65 or older, pregnant or recently gave birth, living with a long-term condition or weakened immune system, feeling very unwell or short of breath, or have symptoms not improved after 7 days?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NICE treats fever at these infant age thresholds as higher risk, and NHS.UK guidance recommends urgent clinical review for the other higher-risk groups or persistent symptoms.",
        redFlag: false,
        keywords: ["fever in young infant with flu", "flu not improving after a week", "flu with chronic condition"],
        careAdviceIds: ["oscg-flususpected-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-flususpected-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these typical flu symptoms with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes rest and fluids as appropriate first-line self-care for flu.",
        redFlag: false,
        keywords: ["typical flu symptoms"],
        careAdviceIds: ["oscg-flususpected-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-flususpected-emergency-advice", titleEn: "Qatar emergency response for severe influenza-like illness", instructionTextEn: "Call Qatar emergency services on 999 now for severe or abnormal breathing, blue or grey colour, severe chest pain, confusion, collapse, seizure, coughing blood, severe dehydration, or a baby or child who is floppy, difficult to wake, feeding poorly, or rapidly worsening. Follow 999 instructions and do not drive. If unresponsive and not breathing normally, start age-appropriate CPR as directed and use an AED if available.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening or abnormal breathing", "blue or grey colour, confusion, collapse, or seizure", "coughing blood or severe dehydration", "rapid deterioration in a baby, child, pregnant person, older adult, or immunocompromised person"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-flususpected-urgent-advice", titleEn: "Urgent flu review for higher-risk groups", instructionTextEn: "Arrange same-day medical review given the higher-risk factors present.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["symptoms worsen", "breathing difficulty develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-flususpected-selfcare-advice", titleEn: "Supportive care pending Qatar governance approval", instructionTextEn: "Rest, take frequent suitable fluids, and reduce contact with others while feverish or unwell. Medicine choice and dose require age, weight, allergy, pregnancy, kidney/liver disease, ulcer/bleeding risk, other medicines, and Qatar formulary checks; never give aspirin to a child or teenager with a viral illness, and do not combine products containing the same ingredient. This branch is UAT-only and requires an approved Qatar non-emergency route.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["breathing difficulty, chest pain, confusion, or dehydration", "symptoms worsen or fail to improve", "concern in pregnancy, infancy, frailty, or immunocompromise"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-02-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: [
        "NHS.UK, \"Flu\", https://www.nhs.uk/conditions/flu/ (page last reviewed 03 February 2026)",
        "NICE NG143, \"Fever in under 5s: assessment and initial management\", https://www.nice.org.uk/guidance/ng143"
      ],
      contentNotice: "Decomposed from NHS.UK's published flu guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Hernia - Qatar-localized UAT structure; governance review required
  // ------------------------------------------------------------------
  {
    id: "oscg-hernia",
    titleEn: "Hernia",
    clinicalDefinitionEn: "UAT assessment structure for a known or suspected abdominal-wall, groin, umbilical, or incisional hernia. It distinguishes a soft, uncomplicated bulge from incarceration, bowel obstruction, or strangulation, where trapped bowel or other tissue may lose its blood supply. A remote description cannot confirm the diagnosis or safely establish reducibility.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "hernia", weight: 100 },
      { phrase: "bulge in my groin", weight: 90 },
      { phrase: "lump near my belly button", weight: 85 },
      { phrase: "think i have a hernia", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hernia-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the person's exact age and sex, and are they pregnant or recently postpartum? For an infant, was the baby premature?" },
      { id: "oscg-hernia-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the bulge or lump: groin, scrotum/labia, belly button, abdominal wall, or a previous-operation scar? Is this a clinician-diagnosed hernia?" },
      { id: "oscg-hernia-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it appear, and has its size, firmness, tenderness, colour, or usual ability to flatten when relaxed changed?" },
      { id: "oscg-hernia-iaq4", sequence: 4, responseType: "YES_NO", promptTextEn: "Is there sudden, severe, persistent, or rapidly worsening pain; a hard/tender bulge; new redness, purple/dark colour, or marked swelling; or a bulge that no longer flattens as it normally does?" },
      { id: "oscg-hernia-iaq5", sequence: 5, responseType: "YES_NO", promptTextEn: "Is there repeated or green vomit, inability to keep fluids down, a swollen or increasingly painful abdomen, inability to pass stool or gas, blood in vomit or stool, fever/shivering, confusion, faintness, or severe weakness?" },
      { id: "oscg-hernia-iaq6", sequence: 6, responseType: "YES_NO", promptTextEn: "For a baby or child, are they inconsolable, unusually sleepy/floppy, feeding poorly, repeatedly vomiting, passing fewer wet nappies, or is there a painful/firm groin, scrotal, labial, or umbilical swelling?" }
    ],
    questions: [
      {
        id: "oscg-hernia-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the hernia or bulge suddenly or severely painful, hard, tender, rapidly larger, newly red/purple/dark, or no longer flattening as it normally does? Is there repeated or green vomiting, inability to keep fluids down, a swollen/painful abdomen, inability to pass stool or gas, blood in vomit/stool, fever/shivering, confusion, faintness, or rapid deterioration? For a baby or child, include inconsolable crying, unusual sleepiness/floppiness, poor feeding, repeated vomiting, or a painful/firm groin, scrotal, labial, or umbilical lump.",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "A painful irreducible or discoloured hernia, especially with vomiting, distension, or failure to pass stool/gas, may represent incarceration, bowel obstruction, or strangulation requiring urgent surgery. Infants can deteriorate quickly and an irreducible inguinal hernia may also threaten bowel, testicular, or ovarian blood supply.",
        redFlag: true,
        keywords: ["hernia with severe pain", "hernia with vomiting", "hernia bulge wont go back in and painful"],
        careAdviceIds: ["oscg-hernia-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hernia-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "With all emergency features absent, is there new or increasing discomfort, tenderness, enlargement, uncertain reducibility, or a new groin/scrotal/labial lump; or is the patient an infant, pregnant/recently postpartum, or recently operated on?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "A symptomatic, changing, uncertain, pediatric, pregnancy-associated, or postoperative lump needs prompt in-person examination. Remote assessment cannot confirm the type of hernia, exclude another diagnosis, or establish safe reducibility.",
        redFlag: false,
        keywords: ["painful hernia", "changing hernia", "child groin lump", "pregnancy hernia"],
        careAdviceIds: ["oscg-hernia-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-hernia-q2-routine",
        acuityOrder: 3,
        severity: "Routine",
        questionTextEn: "Is this an adult with a soft, painless, unchanged bulge that still flattens in its usual way when relaxed, with no vomiting, abdominal swelling, bowel change, fever, skin-colour change, pregnancy/postpartum concern, or other feature above?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "An uncomplicated suspected hernia still requires an in-person clinical examination to confirm the diagnosis and discuss monitoring or repair. The Qatar route and timing require local governance approval.",
        redFlag: false,
        keywords: ["soft painless hernia", "unchanged reducible bulge"],
        careAdviceIds: ["oscg-hernia-routine-advice"],
        telemedicineEligible: false,
        dispositionLevel: 40,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hernia-emergency-advice", titleEn: "Qatar emergency response for possible incarceration, obstruction, or strangulation", instructionTextEn: "Call Qatar emergency services on 999 now and follow the call-taker's instructions. Do not drive or allow the person to drive. Keep them resting in the position of greatest comfort and do not force, repeatedly manipulate, massage, bind, tape, or apply direct heat or ice to the bulge. Do not give food, drink, laxatives, enemas, or unprescribed medicine because urgent surgery or anaesthesia may be needed. If vomiting, place an alert person on their side or leaning safely forward; if unresponsive but breathing, use the recovery position. If they become unresponsive and are not breathing normally, start age-appropriate CPR as directed by 999.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["severe or worsening pain", "hard, tender, irreducible, enlarged, or discoloured bulge", "repeated or green vomiting", "abdominal distension or inability to pass stool/gas", "infant poor feeding, floppiness, or inconsolability", "confusion, faintness, fever, or rapid deterioration"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hernia-urgent-advice", titleEn: "Prompt in-person assessment for a symptomatic or higher-risk hernia", instructionTextEn: "Arrange prompt same-day in-person assessment through the Qatar route approved by local clinical governance. Avoid heavy lifting, straining, or activity that increases pain. Do not ask the caller to test or force the lump back in, and do not bind or tape it. Follow only an existing clinician-taught plan for a known hernia. For an infant, pregnancy/postpartum patient, new groin/scrotal/labial lump, or postoperative lump, use the age- and service-appropriate route approved by governance. Call 999 immediately if pain becomes severe, the bulge becomes hard/tender/discoloured or stops flattening as usual, vomiting or abdominal swelling develops, stool/gas cannot pass, or the person's general condition worsens.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain or swelling", "hardness, tenderness, colour change, or loss of usual reducibility", "vomiting, distension, or inability to pass stool/gas", "baby becomes inconsolable, sleepy, floppy, or feeds poorly"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-hernia-routine-advice", titleEn: "In-person confirmation of an uncomplicated suspected hernia", instructionTextEn: "Arrange a non-emergency in-person assessment through the Qatar route and timing approved by local governance; a photograph or video cannot confirm the diagnosis. Until reviewed, avoid activities that clearly provoke pain or bulging and address constipation or persistent cough with a clinician or pharmacist. Do not force reduction, bind or tape the bulge, begin strenuous exercise, or use this pathway for a child, pregnancy/postpartum concern, recent operation, pain, vomiting, abdominal swelling, bowel obstruction symptoms, fever, or colour change.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new pain, firmness, tenderness, enlargement, or colour change", "bulge no longer flattens as usual", "vomiting, distension, constipation with inability to pass gas, fever, or feeling unwell"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "PENDING: Qatar adult, pediatric, obstetric, emergency, surgical, and nursing governance review", lastReviewedIso: "2026-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Qatar UAT | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: [
        "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (accessed 2026-07-25)",
        "NHS.UK, \"Hernia\", https://www.nhs.uk/conditions/hernia/ (page last reviewed 19 May 2026)",
        "NHS.UK, \"Umbilical hernia\", https://www.nhs.uk/conditions/umbilical-hernia/ (accessed 2026-07-25)",
        "NHS England, \"Making a decision about inguinal hernia\", https://www.england.nhs.uk/wp-content/uploads/2023/11/PRN00250-dst-making-a-decision-about-inguinal-hernia.pdf (accessed 2026-07-25)",
        "Royal Children's Hospital Melbourne, \"Irreducible inguinal hernia - pre-referral\", https://www.rch.org.au/kidsconnect/prereferral_guidelines/Irreducible_inguinal_hernia_prereferral/ (accessed 2026-07-25)"
      ],
      contentNotice: "UAT DATA - NOT FOR REAL PATIENT CARE OR PRODUCTION. Qatar-localized structure-validation draft. A painful, hard, tender, discoloured, rapidly enlarging, or no-longer-reducible hernia, or any hernia with vomiting, abdominal distension, inability to pass stool/gas, systemic illness, or an unwell infant, fails closed to Qatar 999 because incarceration, obstruction, strangulation, or threatened gonadal/bowel blood supply cannot be excluded remotely. No caller-directed forced reduction is permitted. All branches are non-telemedicine. The non-emergency route/timing, pediatric surgical pathway, pregnancy/postpartum pathway, fasting instruction, analgesia, and any clinician-performed reduction protocol are GOVERNANCE_REQUIRED. Requires Qatar adult, pediatric, obstetric, emergency, surgical, and nursing approval before nurse UAT. Not production-approved and not licensed Schmitt-Thompson (STCC) content."
    })
  },

  // ------------------------------------------------------------------
  // 5. Blister - Foot and Hand - https://www.nhs.uk/conditions/blisters/ (reviewed 2023-11-22)
  // ------------------------------------------------------------------
  {
    id: "oscg-blister-foot-hand",
    titleEn: "Blister - Foot and Hand",
    clinicalDefinitionEn: "Foot and hand blister assessment decomposed from NHS.UK's published blister guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "blister on my foot", weight: 100 },
      { phrase: "blister on my hand", weight: 100 },
      { phrase: "got a blister from new shoes", weight: 90 },
      { phrase: "blister from friction", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-blister-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the blister?" },
      { id: "oscg-blister-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What caused it?" },
      { id: "oscg-blister-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any redness, pus, or increasing pain?" }
    ],
    questions: [
      {
        id: "oscg-blister-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the blister severely painful or recurring, does the surrounding skin look hot and infected with green/yellow pus, is there spreading redness, is it in an unusual location (eyelid, mouth, genitals), are there multiple blisters without a clear cause, or did it result from a burn, scald, sunburn, or allergic reaction?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK blister guidance lists these as reasons to seek prompt clinical review.",
        redFlag: false,
        keywords: ["infected blister with pus", "blisters from a burn", "multiple blisters no clear cause"],
        careAdviceIds: ["oscg-blister-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-blister-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical friction blister from new shoes or repeated rubbing, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes typical friction blisters as manageable at home.",
        redFlag: false,
        keywords: ["typical friction blister"],
        careAdviceIds: ["oscg-blister-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-blister-urgent-advice", titleEn: "Urgent in-person blister review", instructionTextEn: "Arrange same-day in-person assessment through the Qatar route approved by governance for spreading redness, warmth, pus, fever, severe pain, a burn/chemical/electrical/frostbite cause, widespread or unexplained blistering, or any blister in a person with diabetes, poor circulation, neuropathy, or immunocompromise. Do not burst or peel it and do not apply unprescribed chemicals.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["spreading redness, pus, or fever", "rapidly increasing pain or blistering", "high-risk cause or health condition"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-blister-selfcare-advice", titleEn: "Home care for a typical blister", instructionTextEn: "Keep the blister clean, gently wash and pat dry, and cover with a soft plaster or padded dressing. Do not burst it yourself; if it bursts on its own, let the fluid drain before covering, and don't peel off the skin. Avoid the shoes or activity that caused it until healed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["signs of infection develop", "pain worsens"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-11-22", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: ["NHS.UK, \"Blisters\", https://www.nhs.uk/conditions/blisters/ (page last reviewed 22 November 2023)"],
      contentNotice: "Decomposed from NHS.UK's published blister guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Bruises - standard first-aid + unexplained-bruising red-flag knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-bruises",
    titleEn: "Bruises",
    clinicalDefinitionEn: "Bruise assessment based on standard first-aid knowledge, with unexplained or easy bruising treated as a red flag per widely-recognized hematology knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "bruise", weight: 100 },
      { phrase: "bruising easily", weight: 95 },
      { phrase: "unexplained bruises", weight: 95 },
      { phrase: "black and blue mark", weight: 85 },
      { phrase: "bruises showing up on my legs", weight: 100 },
      { phrase: "dont remember bumping into anything", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-bruises-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the bruise?" },
      { id: "oscg-bruises-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Is there a known cause, or did it appear without injury?" },
      { id: "oscg-bruises-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any other unusual bleeding (nosebleeds, gum bleeding, blood in urine/stool)?" }
    ],
    questions: [
      {
        id: "oscg-bruises-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Are bruises appearing without a clear cause, bruising unusually easily, or is there other unexplained bleeding (nosebleeds, gum bleeding, blood in urine or stool)?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Unexplained or easy bruising, especially with other bleeding, is a recognized red flag for a blood-clotting or platelet problem and warrants prompt medical evaluation - widely-taught hematology knowledge.",
        redFlag: false,
        keywords: ["bruises with no known cause", "bruising and bleeding gums"],
        careAdviceIds: ["oscg-bruises-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-bruises-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical bruise with a known cause (bump or minor injury) and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A typical bruise from a known minor injury is manageable at home and resolves over 1-2 weeks.",
        redFlag: false,
        keywords: ["typical bruise from bump"],
        careAdviceIds: ["oscg-bruises-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-bruises-urgent-advice", titleEn: "Urgent in-person bruising review", instructionTextEn: "Arrange prompt same-day in-person review through the Qatar route approved by governance for unexplained or extensive bruising, other bleeding, anticoagulant use, pregnancy/postpartum concern, immunocompromise, or possible non-accidental injury. Escalate safeguarding concerns according to the approved Qatar pathway and do not confront a suspected perpetrator. Call 999 for major trauma, uncontrolled bleeding, shock, severe head/chest/abdominal pain, confusion, fainting, or breathing difficulty.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["new bleeding or rapidly spreading bruising", "head, chest, or abdominal symptoms", "safeguarding concern or inconsistent history"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-bruises-selfcare-advice", titleEn: "Care for a minor explained bruise", instructionTextEn: "For a clearly minor accidental bruise with no red flags, rest and elevate the area if comfortable and use a cold pack wrapped in cloth for short periods; never apply ice directly. Medicine choice and dose require age, weight, pregnancy, allergy, bleeding risk, liver/kidney disease, and other-medicine checks. This UAT branch is non-telemedicine pending Qatar approval.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain, swelling, numbness, or movement worsens", "new unexplained bruises or bleeding", "the history raises a safeguarding concern"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: ["Standard first-aid bruise care knowledge combined with widely-taught hematology knowledge about unexplained/easy bruising as a bleeding-disorder red flag - the specific NHS.UK bruising page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK bruising page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary first-aid and hematology knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Drowning and Submersion Event - standard emergency medicine/resuscitation knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-drowning-submersion-event",
    titleEn: "Drowning and Submersion Event",
    clinicalDefinitionEn: "Drowning/submersion event assessment based on standard, universally-recognized emergency medicine and resuscitation knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "drowning", weight: 100 },
      { phrase: "almost drowned", weight: 100 },
      { phrase: "pulled out of the water not breathing", weight: 100 },
      { phrase: "went under water and swallowed a lot", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-drowning-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the person breathing and conscious now?" },
      { id: "oscg-drowning-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long was the person submerged or in distress?" },
      { id: "oscg-drowning-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Was CPR or rescue breathing needed?" }
    ],
    questions: [
      {
        id: "oscg-drowning-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "After a submersion event, is the person unresponsive, not breathing normally, coughing persistently, breathless, blue or grey, confused, unusually sleepy, vomiting repeatedly, injured, or did they require rescue breaths or CPR?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Breathing, neurological, injury, or resuscitation features after submersion require emergency assessment. This UAT protocol avoids the misleading terms dry or secondary drowning; assessment is based on current symptoms, event severity, age, and comorbidity.",
        redFlag: true,
        keywords: ["submersion event", "pulled from water", "near drowning"],
        careAdviceIds: ["oscg-drowning-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-drowning-emergency-advice", titleEn: "Qatar emergency response after submersion", instructionTextEn: "Protect the rescuer first: do not enter unsafe water. Call Qatar emergency services on 999 for an ambulance and follow the call-taker's instructions; do not self-drive. Remove the person from water only when safe. If unresponsive and not breathing normally, begin age-appropriate rescue breathing and CPR as directed by 999 and use an AED if available; do not delay CPR to remove water from the lungs. Keep a breathing person warm and still, use the recovery position if unconscious but breathing, and do not give food or drink. Anyone with symptoms, injury, loss of consciousness, or rescue-breath/CPR requirement needs emergency transport; disposition for a completely asymptomatic minor event remains GOVERNANCE_REQUIRED.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["cough, abnormal breathing, blue or grey colour", "confusion, unusual sleepiness, collapse, or seizure", "vomiting, chest pain, or deterioration"], displayOrder: 1, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: ["Standard, universally-recognized emergency medicine and resuscitation knowledge (delayed/secondary drowning risk, CPR) - the specific NHS.UK drowning page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK drowning page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary emergency medicine knowledge that any submersion event requires emergency medical evaluation regardless of apparent recovery. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, particularly relevant given Qatar's coastal/pool exposure."
    })
  },

  // ------------------------------------------------------------------
  // 8. Electric Shock or Lightning Injury - standard emergency medicine knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-electric-shock-lightning-injury",
    titleEn: "Electric Shock or Lightning Injury",
    clinicalDefinitionEn: "Electric shock or lightning injury assessment based on standard, universally-recognized emergency medicine and first-aid knowledge.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "electric shock", weight: 100 },
      { phrase: "got shocked by an outlet", weight: 95 },
      { phrase: "struck by lightning", weight: 100 },
      { phrase: "electrocuted", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-electricshock-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What was the source (household current, high voltage, lightning)?" },
      { id: "oscg-electricshock-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the person conscious and breathing normally?" },
      { id: "oscg-electricshock-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person still in contact with the electrical source?" }
    ],
    questions: [
      {
        id: "oscg-electricshock-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Was there any electric shock or lightning strike, especially involving high voltage, loss of consciousness, chest pain, irregular heartbeat, burns, or muscle pain/weakness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Widely-recognized emergency medicine knowledge: electric shock and lightning injuries can cause life-threatening heart rhythm disturbances and internal injuries that are not obvious from the outside, so any significant shock is treated as an emergency.",
        redFlag: true,
        keywords: ["electric shock unconscious", "lightning strike injury", "electric shock chest pain"],
        careAdviceIds: ["oscg-electricshock-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-electricshock-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Was this a very brief, low-voltage static shock (such as touching a doorknob) with no symptoms at all?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "A brief static discharge without any symptoms does not carry the same risk as a sustained household or high-voltage shock.",
        redFlag: false,
        keywords: ["brief static shock no symptoms"],
        careAdviceIds: ["oscg-electricshock-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-electricshock-emergency-advice", titleEn: "Qatar emergency electrical-injury precautions", instructionTextEn: "Call Qatar emergency services on 999. Do not touch the person until the electrical supply is isolated; do not approach high-voltage equipment or an unsafe lightning area, and follow the emergency call-taker's instructions. If unresponsive and not breathing normally once the scene is safe, start age-appropriate CPR and use an AED if available. Do not apply ice, creams, or adhesive dressings to burns and do not drive. Household-current, high-voltage, lightning, loss-of-consciousness, chest symptoms, burns, pregnancy, or pediatric exposures require in-person assessment through the route approved by Qatar governance.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["loss of consciousness or seizure", "chest pain, abnormal heartbeat, or abnormal breathing", "burns, weakness, numbness, or significant pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-electricshock-selfcare-advice", titleEn: "After a very brief static shock", instructionTextEn: "No treatment is usually needed for a brief static discharge without symptoms, but watch for any delayed symptoms.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["any pain, numbness, or irregular heartbeat develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: ["Standard, universally-recognized emergency medicine knowledge about electric shock/lightning injury risk (cardiac arrhythmia, internal injury, CPR) - the specific NHS.UK electric shock page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK electric shock page could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary emergency medicine knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Groin Injury and Strain - generalized from limb-injury/strain pattern (batch06/15)
  // ------------------------------------------------------------------
  {
    id: "oscg-groin-injury-and-strain",
    titleEn: "Groin Injury and Strain",
    clinicalDefinitionEn: "Groin injury/strain assessment, generalized from the limb-injury fracture pattern and non-traumatic-pain pattern already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "groin strain", weight: 100 },
      { phrase: "pulled my groin", weight: 95 },
      { phrase: "groin injury from sports", weight: 90 },
      { phrase: "groin muscle pain", weight: 85 },
      { phrase: "pulled a muscle in my groin", weight: 100 },
      { phrase: "pulled a muscle in my groin playing soccer", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-groininjury-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the injury happen?" },
      { id: "oscg-groininjury-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is there a bulge or lump, or testicular involvement?" },
      { id: "oscg-groininjury-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-groininjury-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden severe testicular pain or swelling, a groin bulge that is painful and won't go back in, or inability to bear weight after a high-impact injury?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Sudden severe testicular pain can indicate testicular torsion (a time-critical surgical emergency), and a painful irreducible groin bulge can indicate a strangulated hernia - both need immediate emergency care.",
        redFlag: true,
        keywords: ["sudden severe testicular pain", "groin bulge wont go back in and painful"],
        careAdviceIds: ["oscg-groininjury-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-groininjury-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there significant swelling or bruising, or difficulty walking?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Consistent with the limb-strain pattern already used in this system, significant swelling or walking difficulty after a groin injury warrants prompt assessment.",
        redFlag: false,
        keywords: ["cant walk after groin injury", "swollen groin after strain"],
        careAdviceIds: ["oscg-groininjury-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-groininjury-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild groin strain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild muscle strains are manageable at home with rest, ice, and gradual return to activity.",
        redFlag: false,
        keywords: ["mild groin muscle strain"],
        careAdviceIds: ["oscg-groininjury-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-groininjury-emergency-advice", titleEn: "Qatar emergency groin/testicular precautions", instructionTextEn: "Call Qatar emergency services on 999 now for sudden severe testicular pain, a changed/high-riding testicle, severe pain with nausea or vomiting, major trauma or bleeding, or a painful hard/discoloured groin bulge. Do not drive, eat, drink, massage, bind, or attempt to push a bulge or testicle into position because urgent surgery or anaesthesia may be needed. Keep the person resting and follow 999 instructions.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["sudden or worsening testicular/groin pain", "vomiting, collapse, or major bleeding", "hard, tender, irreducible, or discoloured bulge"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-groininjury-urgent-advice", titleEn: "Urgent groin injury review", instructionTextEn: "Rest and avoid strenuous activity, and arrange same-day medical review.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["swelling increases", "unable to walk"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-groininjury-selfcare-advice", titleEn: "Care for a mild suspected groin strain", instructionTextEn: "Rest from provoking activity and use a cold pack wrapped in cloth for short periods; do not apply ice directly. Do not massage a lump or testicle. Medicine choice and dose require age, weight, pregnancy, allergy, kidney/liver disease, ulcer/bleeding risk, and other-medicine checks. This UAT branch remains non-telemedicine pending Qatar approval.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain or swelling worsens", "a bulge, testicular symptom, vomiting, numbness, or walking difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: ["Generalized from the limb-injury/strain fracture-and-strain pattern already established for Arm Pain/Leg Pain (batch15) and Genital Injury - Male (batch08), combined with standard emergency medicine knowledge of testicular torsion and strangulated hernia red flags - the specific NHS.UK groin strain page could not be retrieved during authoring"],
      contentNotice: "The NHS.UK groin strain page could not be retrieved during authoring. This protocol generalizes the existing limb-strain pattern and combines it with widely-recognized emergency medicine red flags for the groin region specifically. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Eyelid Swelling - generalized from Eye Injury (batch13) / Eye - Allergy (batch07)
  // ------------------------------------------------------------------
  {
    id: "oscg-eyelid-swelling",
    titleEn: "Eyelid Swelling",
    clinicalDefinitionEn: "Eyelid swelling assessment, generalized from the eye-injury and eye-allergy emergency criteria already established in this system.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "eyelid is swollen", weight: 100 },
      { phrase: "swollen eyelid", weight: 100 },
      { phrase: "eye is puffy and swollen", weight: 90 },
      { phrase: "eyelid swelling and redness", weight: 90 },
      { phrase: "eyelid is really puffy and swollen", weight: 100 },
      { phrase: "puffy and swollen this morning", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-eyelidswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the swelling been present?" },
      { id: "oscg-eyelidswelling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any vision change, pain, or fever?" },
      { id: "oscg-eyelidswelling-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any known trigger (insect bite, allergy, injury, makeup)?" }
    ],
    questions: [
      {
        id: "oscg-eyelidswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the eyelid swelling, is there vision change, inability to open the eye, bulging of the eye, severe pain, or swelling of the lips/mouth/throat with breathing difficulty?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Vision change or a bulging eye can indicate a serious orbital infection (orbital cellulitis), and swelling with breathing difficulty can indicate anaphylaxis - both recognized emergencies, consistent with the eye-injury and severe-allergy criteria already used in this system.",
        redFlag: true,
        keywords: ["eyelid swelling with vision change", "bulging eye", "eyelid swelling breathing difficulty"],
        careAdviceIds: ["oscg-eyelidswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-eyelidswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the eyelid red, warm, and increasingly painful, or is there fever, without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Redness, warmth, and fever can indicate a spreading eyelid infection (preseptal cellulitis) needing prompt antibiotic treatment.",
        redFlag: false,
        keywords: ["red warm swollen eyelid", "eyelid swelling with fever"],
        careAdviceIds: ["oscg-eyelidswelling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-eyelidswelling-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild puffiness or swelling, such as from an insect bite or mild allergy, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild eyelid swelling without pain, vision change, or fever is often manageable at home.",
        redFlag: false,
        keywords: ["mild eyelid puffiness"],
        careAdviceIds: ["oscg-eyelidswelling-selfcare-advice"],
        telemedicineEligible: false,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-eyelidswelling-emergency-advice", titleEn: "Qatar emergency eyelid-swelling precautions", instructionTextEn: "Call Qatar emergency services on 999 now for breathing difficulty, throat/tongue swelling, collapse, severe eye pain, new vision change, a bulging eye, inability to move the eye normally, serious injury, or chemical exposure. Follow 999 instructions and do not drive. Use a prescribed adrenaline auto-injector immediately for suspected anaphylaxis according to the person's plan. Do not press, patch, or put unprescribed drops or creams in the eye; irrigate chemical exposure immediately with clean lukewarm water.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["vision change, bulging eye, or painful eye movement", "breathing difficulty or throat/tongue swelling", "fever with rapid worsening or reduced alertness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyelidswelling-urgent-advice", titleEn: "Urgent eyelid swelling review", instructionTextEn: "Arrange same-day medical review for possible infection.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["vision changes develop", "fever worsens"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-eyelidswelling-selfcare-advice", titleEn: "Care for mild eyelid swelling", instructionTextEn: "Do not rub or press the eye. A clean cool compress may be used gently over the closed lid. Antihistamine selection and dose require age, weight, pregnancy/breastfeeding, allergy, comorbidity, sedation, and interaction checks under the Qatar formulary; do not use unprescribed eye drops or creams. This UAT branch is non-telemedicine pending approval.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["swelling, redness, pain, or fever worsens", "vision change, painful eye movement, breathing difficulty, or facial swelling develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildBatch19UatProvenance({
      sourceDocuments: ["Generalized from the eye-injury and eye-allergy emergency criteria already established for Eye Injury (batch13) and Eye - Allergy (batch07), combined with standard emergency-medicine knowledge distinguishing orbital cellulitis from preseptal cellulitis - the specific NHS.UK eyelid swelling page could not be retrieved during authoring"],
      contentNotice: "No dedicated NHS.UK page was retrieved for eyelid swelling specifically during authoring. This protocol generalizes the eye-emergency criteria already used elsewhere in this content set. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
