import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 09 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence). Same non-fabrication/non-licensed-STCC guarantees as prior
 * batches. Nausea reuses the Diarrhoea and vomiting source already cited in
 * batch06. Lip Swelling reuses the allergic-reaction criteria already
 * established for Face Swelling/Anaphylaxis. Meningitis Exposure combines
 * the real symptom-emergency criteria from the Meningitis page with a
 * documented, honest inference for the exposure/contact-prophylaxis angle,
 * which the source page itself does not cover.
 */
export const batch09Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Meningitis Exposure - https://www.nhs.uk/conditions/meningitis/ (reviewed 2026-06-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-meningitis-exposure",
    titleEn: "Meningitis Exposure",
    clinicalDefinitionEn: "Close-contact exposure to a confirmed or suspected meningitis case, decomposed from NHS.UK's published meningitis symptom guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "meningitis exposure", weight: 100 },
      { phrase: "exposed to meningitis", weight: 100 },
      { phrase: "contact with meningitis", weight: 90 },
      { phrase: "someone i know has meningitis", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-meningexp-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What is the caller's relationship to the confirmed/suspected case, and how close/recent was the contact?" },
      { id: "oscg-meningexp-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Does the caller have any symptoms themselves right now?" },
      { id: "oscg-meningexp-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "Has a temperature been measured?" }
    ],
    questions: [
      {
        id: "oscg-meningexp-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Does the exposed person now have a very high or very low temperature, a very painful headache, confusion or slurred speech, a stiff neck with light sensitivity, a rash that does not fade under pressure, or a first-time seizure?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "NHS.UK meningitis guidance lists these as call-999/A&E criteria for anyone with these symptoms, regardless of exposure history - the source itself says to trust your instincts, since not every symptom needs to be present.",
        redFlag: true,
        keywords: ["stiff neck light sensitivity", "non fading rash", "confused after meningitis exposure"],
        careAdviceIds: ["oscg-meningexp-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-meningexp-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Was there close, prolonged contact with a confirmed or strongly suspected meningitis case, with no symptoms in the caller yet?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn:
          "The NHS.UK meningitis page itself does not address contact/exposure management (prophylactic antibiotics, monitoring) - this tier is a documented, clinically reasonable inference: close contacts of confirmed bacterial meningitis cases are typically assessed by local health authorities for prophylactic antibiotics, which this source page does not cover directly.",
        redFlag: false,
        keywords: ["close contact meningitis case", "prophylaxis needed"],
        careAdviceIds: ["oscg-meningexp-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-meningexp-emergency-advice", titleEn: "Emergency meningitis precautions", instructionTextEn: "Arrange emergency transport immediately - do not wait to see if symptoms are meningitis or something else.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "rash spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-meningexp-urgent-advice", titleEn: "Urgent exposure assessment", instructionTextEn: "Arrange assessment with local health authorities or a physician about whether prophylactic antibiotics are recommended for this contact. Monitor closely for any of the emergency symptoms above over the following days.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["any meningitis symptom develops"], displayOrder: 2, adviceCategory: "DISPOSITION", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-06-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Meningitis\", https://www.nhs.uk/conditions/meningitis/ (page last reviewed 12 June 2026)"],
      contentNotice:
        "Decomposed from NHS.UK's published meningitis symptom guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The source page covers symptoms, not exposure/contact management - the urgent tier here is a documented, honest clinical inference (contacts of confirmed cases typically need prophylaxis assessment), not a direct quote from the source. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, with particular attention to the inferred exposure-management tier."
    })
  },

  // ------------------------------------------------------------------
  // 2. Motor Vehicle Accident - https://www.nhs.uk/conditions/whiplash/ (reviewed 2023-01-03) + general trauma screen
  // ------------------------------------------------------------------
  {
    id: "oscg-motor-vehicle-accident",
    titleEn: "Motor Vehicle Accident",
    clinicalDefinitionEn: "Post-motor-vehicle-accident triage entry point, decomposed from NHS.UK's published whiplash guidance plus general trauma screening.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "car accident", weight: 100 },
      { phrase: "motor vehicle accident", weight: 100 },
      { phrase: "was in a crash", weight: 90 },
      { phrase: "just had a car crash", weight: 95 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mva-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What happened in the accident (speed, impact type)?" },
      { id: "oscg-mva-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "When did this happen?" },
      { id: "oscg-mva-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "What symptoms are being noticed now?" }
    ],
    questions: [
      {
        id: "oscg-mva-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there any loss of consciousness, severe bleeding, chest pain, severe difficulty breathing, inability to move a limb, severe abdominal pain, or numbness/weakness/pins and needles on one or both sides of the body?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn:
          "Universal post-trauma emergency screen added ahead of any specific injury guidance - a motor vehicle accident can cause many types of serious injury simultaneously, so this general screen comes first before considering neck-specific (whiplash) or other single-body-part guidance.",
        redFlag: true,
        keywords: ["unconscious after crash", "chest pain after accident", "cant move limb after crash"],
        careAdviceIds: ["oscg-mva-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-mva-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn:
          "Is there severe neck or back pain despite pain relief, tingling or pins and needles on one or both sides, problems walking or sitting upright, or a sudden electric-shock feeling in the neck, back, arms, or legs?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK whiplash guidance lists these as reasons for an urgent GP appointment or 111 call - possible nerve involvement.",
        redFlag: false,
        keywords: ["severe neck pain after crash", "pins and needles after accident"],
        careAdviceIds: ["oscg-mva-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-mva-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild soreness or stiffness (typical whiplash) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: continue everyday activities as able and use paracetamol/ibuprofen - resting the neck for long periods does not help recovery.",
        redFlag: false,
        keywords: ["mild soreness after accident", "typical whiplash"],
        careAdviceIds: ["oscg-mva-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mva-emergency-advice", titleEn: "Emergency post-accident precautions", instructionTextEn: "Keep the person as still as possible unless in immediate danger, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening symptoms", "new loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-mva-urgent-advice", titleEn: "Urgent post-accident review", instructionTextEn: "Arrange same-day medical review for possible nerve involvement.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["numbness spreads", "weakness develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-mva-selfcare-advice", titleEn: "Home care for mild whiplash", instructionTextEn: "Take paracetamol or ibuprofen for pain, and try to continue everyday activities - it might hurt a little but will speed recovery. A neck brace/collar and prolonged rest do not help.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens instead of improving", "numbness or weakness develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-01-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Whiplash\", https://www.nhs.uk/conditions/whiplash/ (page last reviewed 03 January 2023)"],
      contentNotice:
        "Decomposed from NHS.UK's published whiplash guidance for the urgent/self-care tiers, with a general post-trauma emergency screen added ahead of it (standard tele-triage practice for any motor vehicle accident, not part of the whiplash source itself, since accidents can cause injuries far beyond the neck). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 3. Menstrual Cramps - https://www.nhs.uk/conditions/period-pain/ (reviewed 2026-03-18)
  // ------------------------------------------------------------------
  {
    id: "oscg-menstrual-cramps",
    titleEn: "Menstrual Cramps",
    clinicalDefinitionEn: "Period pain assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "period pain", weight: 100 },
      { phrase: "menstrual cramps", weight: 100 },
      { phrase: "bad cramps", weight: 80 },
      { phrase: "period cramps", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-cramps-iaq1", sequence: 1, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" },
      { id: "oscg-cramps-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have painkillers already been tried?" },
      { id: "oscg-cramps-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any bleeding between periods, or pain during sex or urination?" }
    ],
    questions: [
      {
        id: "oscg-cramps-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the pelvic or period pain severe or worse than usual, and have painkillers not helped?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance: call 111 or get an urgent GP appointment for severe pain unrelieved by painkillers.",
        redFlag: false,
        keywords: ["severe period pain", "painkillers not helping cramps"],
        careAdviceIds: ["oscg-cramps-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-cramps-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have periods become more painful, heavier, or irregular, is pain preventing daily functioning, does pain occur during sex or urination, is there bleeding between periods, or a swollen abdomen with weight/appetite changes?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these situations.",
        redFlag: false,
        keywords: ["heavier periods", "bleeding between periods", "pain during sex"],
        careAdviceIds: ["oscg-cramps-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-cramps-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical period pain with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides comfort measures and pain relief for typical period pain.",
        redFlag: false,
        keywords: ["typical period pain"],
        careAdviceIds: ["oscg-cramps-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-cramps-urgent-advice", titleEn: "Urgent period pain review", instructionTextEn: "Arrange same-day medical review for severe pain unrelieved by painkillers.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "fever develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-cramps-routine-advice", titleEn: "Routine period pain follow-up", instructionTextEn: "Book a GP appointment to discuss these symptoms - may involve anti-inflammatory medication or hormonal treatment options.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-cramps-selfcare-advice", titleEn: "Home care for period pain", instructionTextEn: "Try a warm bath or shower, heat pads or a hot water bottle on the tummy, gentle massage, light exercise like yoga or walking, and over-the-counter painkillers like paracetamol or ibuprofen. Reduce alcohol and avoid smoking.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain becomes severe", "periods become heavier or irregular"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-03-18", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Period pain\", https://www.nhs.uk/conditions/period-pain/ (page last reviewed 18 March 2026)"],
      contentNotice: "Decomposed from NHS.UK's published period pain guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Menstrual Period - Missed or Late - https://www.nhs.uk/conditions/stopped-or-missed-periods/ (reviewed 2026-06-12)
  // ------------------------------------------------------------------
  {
    id: "oscg-missed-period",
    titleEn: "Menstrual Period - Missed or Late",
    clinicalDefinitionEn: "Missed or late period assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 10,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "missed period", weight: 100 },
      { phrase: "late period", weight: 95 },
      { phrase: "period hasnt come", weight: 85 },
      { phrase: "havent had my period", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-missedperiod-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How many periods have been missed?" },
      { id: "oscg-missedperiod-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Could the caller be pregnant?" },
      { id: "oscg-missedperiod-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any other new symptoms (weight change, hair growth, tiredness, skin changes)?" }
    ],
    questions: [
      {
        id: "oscg-missedperiod-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there severe abdominal pain along with a missed period and possible pregnancy (suggesting a possible ectopic pregnancy)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the missed-periods guidance itself (not part of the source) - severe pain with a possible pregnancy needs emergency evaluation to rule out ectopic pregnancy.",
        redFlag: true,
        keywords: ["severe pain missed period pregnant", "possible ectopic"],
        careAdviceIds: ["oscg-missedperiod-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-missedperiod-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Have periods been missed 3 times in a row, have periods not started by age 15, is there a missed period with weight change/tiredness/facial hair growth/skin changes, or have periods become irregular?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends seeing a GP for these situations.",
        redFlag: false,
        keywords: ["periods missed three times", "periods irregular"],
        careAdviceIds: ["oscg-missedperiod-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-missedperiod-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a single missed or late period with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: common causes include pregnancy, stress, weight changes, exercise, hormonal contraception, and breastfeeding - a home pregnancy test is a reasonable first step if pregnancy is possible.",
        redFlag: false,
        keywords: ["single missed period"],
        careAdviceIds: ["oscg-missedperiod-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-missedperiod-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Arrange emergency transport immediately - possible ectopic pregnancy needs urgent evaluation.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "fainting or dizziness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-missedperiod-routine-advice", titleEn: "Routine missed period follow-up", instructionTextEn: "Book a GP appointment to investigate the cause of missed or irregular periods.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-missedperiod-selfcare-advice", titleEn: "Home guidance for a single missed period", instructionTextEn: "A home pregnancy test is a reasonable first step if pregnancy is possible. Common causes include stress, weight changes, exercise, hormonal contraception, and breastfeeding.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["periods remain missed for 3 months", "new symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-06-12", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Stopped or missed periods\", https://www.nhs.uk/conditions/stopped-or-missed-periods/ (page last reviewed 12 June 2026)"],
      contentNotice: "Decomposed from NHS.UK's published missed periods guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. The emergency (possible ectopic pregnancy) tier is a standard tele-triage safety practice, not part of the source page itself. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Motion Sickness - https://www.nhs.uk/conditions/motion-sickness/ (reviewed 2023-06-19)
  // ------------------------------------------------------------------
  {
    id: "oscg-motion-sickness",
    titleEn: "Motion Sickness",
    clinicalDefinitionEn: "Motion sickness assessment decomposed from NHS.UK's published guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "motion sickness", weight: 100 },
      { phrase: "travel sickness", weight: 95 },
      { phrase: "car sick", weight: 85 },
      { phrase: "sea sick", weight: 85 },
      { phrase: "sick from the boat", weight: 95 },
      { phrase: "dizzy from the boat", weight: 95 },
      { phrase: "queasy on a boat", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-motionsick-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What type of travel triggered this (car, boat, plane)?" },
      { id: "oscg-motionsick-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has this lasted?" },
      { id: "oscg-motionsick-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Is the person able to keep fluids down?" }
    ],
    questions: [
      {
        id: "oscg-motionsick-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Does this sound like a life-threatening emergency to the triager (e.g. severe dehydration or symptoms unrelated to travel)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the motion sickness guidance itself - motion sickness is not itself an emergency, but persistent vomiting could cause dehydration or mask another condition.",
        redFlag: true,
        keywords: ["life threatening", "severe dehydration"],
        careAdviceIds: ["oscg-motionsick-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-motionsick-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this typical motion sickness with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance provides prevention and self-care measures for typical motion sickness.",
        redFlag: false,
        keywords: ["typical motion sickness"],
        careAdviceIds: ["oscg-motionsick-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-motionsick-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Address the underlying emergency concern and arrange emergency transport if needed.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["signs of dehydration worsen"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-motionsick-selfcare-advice", titleEn: "Prevention and self-care for motion sickness", instructionTextEn: "Sit in the front of a car or middle of a boat to reduce motion, look straight ahead at a fixed point like the horizon, get fresh air, break up long journeys, and try ginger. Avoid reading, screens, heavy/spicy meals, and alcohol before or during travel. Pharmacy options include tablets, patches (age 10+), and acupressure bands.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["unable to keep fluids down", "symptoms persist after travel ends"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-06-19", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Motion sickness\", https://www.nhs.uk/conditions/motion-sickness/ (page last reviewed 19 June 2023)"],
      contentNotice: "Decomposed from NHS.UK's published motion sickness guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Mouth Ulcers - https://www.nhs.uk/conditions/mouth-ulcers/ (reviewed 2024-03-11)
  // ------------------------------------------------------------------
  {
    id: "oscg-mouth-ulcers",
    titleEn: "Mouth Ulcers",
    clinicalDefinitionEn: "Mouth ulcer assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "mouth ulcer", weight: 100 },
      { phrase: "canker sore", weight: 90 },
      { phrase: "sore in my mouth", weight: 80 },
      { phrase: "ulcer on my tongue", weight: 80 },
      { phrase: "ulcer in my cheek", weight: 100 },
      { phrase: "ulcer on my cheek", weight: 100 },
      { phrase: "hurts to eat", weight: 85 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-mouthulcer-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the ulcer been present?" },
      { id: "oscg-mouthulcer-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "How large is it, and is it painful?" },
      { id: "oscg-mouthulcer-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any ulcers elsewhere on the body or joint pain?" }
    ],
    questions: [
      {
        id: "oscg-mouthulcer-q0-routine",
        acuityOrder: 1,
        severity: "Routine",
        questionTextEn: "Has the ulcer lasted longer than 3 weeks, is it unusually large or near the throat, is it bleeding or becoming more painful and red, or are there ulcers elsewhere on the body with joint symptoms?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends seeing a GP or dentist for these features - prolonged ulcers can occasionally indicate a more serious condition.",
        redFlag: false,
        keywords: ["mouth ulcer three weeks", "large mouth ulcer", "bleeding mouth ulcer"],
        careAdviceIds: ["oscg-mouthulcer-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-mouthulcer-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical, recent mouth ulcer with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: mouth ulcers are common and should clear up on their own within 1-2 weeks.",
        redFlag: false,
        keywords: ["typical mouth ulcer"],
        careAdviceIds: ["oscg-mouthulcer-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-mouthulcer-routine-advice", titleEn: "Routine mouth ulcer follow-up", instructionTextEn: "Book a GP or dentist appointment for these features.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["ulcer grows or bleeds more"], displayOrder: 1, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-mouthulcer-selfcare-advice", titleEn: "Pharmacy self-care for a mouth ulcer", instructionTextEn: "A pharmacist can recommend antimicrobial mouthwash, painkilling gel/spray, corticosteroid lozenges, or salt mouthwash. Use a soft-bristled toothbrush, drink cool drinks through a straw, and eat softer foods. Avoid spicy, salty, acidic, or rough/crunchy foods.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["lasts longer than 3 weeks", "becomes larger or more painful"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-03-11", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Mouth ulcers\", https://www.nhs.uk/conditions/mouth-ulcers/ (page last reviewed 11 March 2024)"],
      contentNotice: "Decomposed from NHS.UK's published mouth ulcers guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Nasal Allergies (Hay Fever) - https://www.nhs.uk/conditions/hay-fever/ (reviewed 2024-03-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-hay-fever",
    titleEn: "Nasal Allergies (Hay Fever)",
    clinicalDefinitionEn: "Hay fever / nasal allergy assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "hay fever", weight: 100 },
      { phrase: "nasal allergies", weight: 95 },
      { phrase: "sneezing and runny nose", weight: 80 },
      { phrase: "seasonal allergies", weight: 85 },
      { phrase: "sneezing nonstop", weight: 100 },
      { phrase: "allergies acting up", weight: 90 },
      { phrase: "hay fever season", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-hayfever-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long have symptoms lasted?" },
      { id: "oscg-hayfever-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Have pharmacy treatments been tried?" },
      { id: "oscg-hayfever-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any breathing difficulty or wheeze?" }
    ],
    questions: [
      {
        id: "oscg-hayfever-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden swelling of the lips, mouth, throat, or tongue, or severe difficulty breathing?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Universal emergency rule-out added ahead of the hay fever guidance itself - typical hay fever does not cause airway swelling or severe breathing difficulty, so these signs suggest a different, more serious allergic reaction.",
        redFlag: true,
        keywords: ["swollen throat with allergies", "severe breathing difficulty allergies"],
        careAdviceIds: ["oscg-hayfever-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-hayfever-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Are symptoms getting worse, or have pharmacy medicines not improved them?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance: see a doctor if symptoms are worsening or pharmacy treatments haven't helped - may be referred for immunotherapy.",
        redFlag: false,
        keywords: ["hay fever worsening", "pharmacy treatment not working allergies"],
        careAdviceIds: ["oscg-hayfever-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-hayfever-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical hay fever with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: a pharmacist can recommend antihistamines and steroid nasal sprays for typical hay fever.",
        redFlag: false,
        keywords: ["typical hay fever"],
        careAdviceIds: ["oscg-hayfever-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-hayfever-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Arrange emergency transport immediately - this does not sound like typical hay fever.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["breathing worsens", "swelling spreads"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-hayfever-routine-advice", titleEn: "Routine hay fever follow-up", instructionTextEn: "Book a GP appointment if symptoms worsen or pharmacy treatments aren't helping.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["symptoms significantly worsen"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-hayfever-selfcare-advice", titleEn: "Pharmacy self-care for hay fever", instructionTextEn: "A pharmacist can recommend antihistamine drops/tablets/nasal sprays or steroid nasal sprays, including non-drowsy options. Apply petroleum jelly around nostrils, wear wraparound sunglasses, shower after outdoor exposure, keep windows closed, and vacuum with HEPA filters.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["symptoms worsen despite treatment"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-03-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Hay fever\", https://www.nhs.uk/conditions/hay-fever/ (page last reviewed 21 March 2024)"],
      contentNotice: "Decomposed from NHS.UK's published hay fever guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Nausea - https://www.nhs.uk/conditions/diarrhoea/ (reviewed 2023-12-21)
  // ------------------------------------------------------------------
  {
    id: "oscg-nausea",
    titleEn: "Nausea",
    clinicalDefinitionEn: "Nausea assessment decomposed from NHS.UK's published diarrhoea and vomiting guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "nausea", weight: 100 },
      { phrase: "feel sick", weight: 85 },
      { phrase: "feeling nauseous", weight: 95 },
      { phrase: "queasy", weight: 75 },
      { phrase: "really nauseous", weight: 100 },
      { phrase: "nauseous since this morning", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-nausea-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the nausea lasted?" },
      { id: "oscg-nausea-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any vomiting?" },
      { id: "oscg-nausea-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Able to keep fluids down?" }
    ],
    questions: [
      {
        id: "oscg-nausea-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn:
          "Is there vomit that looks like blood or ground coffee, green vomit, a stiff neck with light sensitivity, a sudden severe headache or tummy ache, blue/grey/pale skin, severe breathing difficulty, or confusion?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK diarrhoea and vomiting guidance lists these as call-999/A&E criteria.",
        redFlag: true,
        keywords: ["vomit like blood", "confused with nausea", "severe headache with nausea"],
        careAdviceIds: ["oscg-nausea-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-nausea-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person unable to keep fluids down, or has vomiting lasted more than 2 days?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends calling 111 for these features.",
        redFlag: false,
        keywords: ["cant keep fluids down", "vomiting more than 2 days"],
        careAdviceIds: ["oscg-nausea-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-nausea-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this mild nausea with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: rest and small sips of fluid usually help mild nausea, which typically settles within a day or two.",
        redFlag: false,
        keywords: ["mild nausea"],
        careAdviceIds: ["oscg-nausea-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-nausea-emergency-advice", titleEn: "Emergency precautions", instructionTextEn: "Keep the person calm and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "breathing difficulty increases"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-nausea-urgent-advice", titleEn: "Urgent nausea review", instructionTextEn: "Arrange same-day medical review, especially if fluids cannot be kept down.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["signs of dehydration worsen"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-nausea-selfcare-advice", titleEn: "Home care for mild nausea", instructionTextEn: "Rest, sip fluids slowly, avoid fatty or spicy food, and eat small, plain meals when able.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["vomiting develops", "unable to keep fluids down"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-21", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Diarrhoea and vomiting\", https://www.nhs.uk/conditions/diarrhoea/ (page last reviewed 21 December 2023)"],
      contentNotice: "Decomposed from NHS.UK's published diarrhoea and vomiting guidance's nausea-relevant criteria (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Lip Swelling - https://www.nhs.uk/conditions/skin-rash-children/ (reviewed 2024-10-03)
  // ------------------------------------------------------------------
  {
    id: "oscg-lip-swelling",
    titleEn: "Lip Swelling",
    clinicalDefinitionEn: "Lip swelling assessment decomposed from NHS.UK's published allergic reaction emergency guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "lip swelling", weight: 100 },
      { phrase: "lips are swollen", weight: 95 },
      { phrase: "swollen lips", weight: 95 },
      { phrase: "lips puffed up", weight: 80 },
      { phrase: "lips got really puffy", weight: 100 },
      { phrase: "puffy and swollen", weight: 90 },
      { phrase: "swollen after lunch", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-lipswelling-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When did the swelling start?" },
      { id: "oscg-lipswelling-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "Any known trigger (new food, medication, insect sting)?" },
      { id: "oscg-lipswelling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any difficulty breathing or swallowing?" }
    ],
    questions: [
      {
        id: "oscg-lipswelling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there swelling of the mouth, throat, or tongue along with the lips, is the person breathing very fast or struggling to breathe, is the throat tight or hard to swallow, or has the skin turned blue, grey, or pale?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance lists these as signs of a serious allergic reaction (anaphylaxis) requiring an immediate 999 call and adrenaline auto-injector if available.",
        redFlag: true,
        keywords: ["swollen throat with lips", "struggling to breathe lip swelling"],
        careAdviceIds: ["oscg-lipswelling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-lipswelling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there lip swelling without breathing/swallowing difficulty, especially with a known allergy trigger?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Lip swelling without airway involvement still warrants prompt in-person evaluation to monitor for a worsening allergic reaction.",
        redFlag: false,
        keywords: ["lip swelling no breathing problem"],
        careAdviceIds: ["oscg-lipswelling-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lipswelling-emergency-advice", titleEn: "Emergency allergic reaction precautions", instructionTextEn: "Use an adrenaline auto-injector immediately if available, then arrange emergency transport.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["no improvement after 5 minutes", "loss of consciousness"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lipswelling-urgent-advice", titleEn: "Urgent lip swelling review", instructionTextEn: "Arrange same-day medical review and avoid the suspected trigger.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing or swallowing difficulty develops", "swelling spreads"], displayOrder: 2, adviceCategory: "DISPOSITION" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2024-10-03", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Skin rash in children\" (allergic reaction warning signs), https://www.nhs.uk/conditions/skin-rash-children/ (page last reviewed 03 October 2024)"],
      contentNotice: "Decomposed from NHS.UK's published allergic reaction emergency warning signs (Crown copyright, reused under the Open Government Licence), applied to a lip-swelling presentation, adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 10. Lymph Nodes - Swollen - https://www.nhs.uk/conditions/swollen-glands/ (reviewed 2023-09-29)
  // ------------------------------------------------------------------
  {
    id: "oscg-swollen-lymph-nodes",
    titleEn: "Lymph Nodes - Swollen",
    clinicalDefinitionEn: "Swollen glands / lymph nodes assessment decomposed from NHS.UK's published when-to-get-help guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "swollen glands", weight: 100 },
      { phrase: "swollen lymph nodes", weight: 100 },
      { phrase: "swollen glands in neck", weight: 90 },
      { phrase: "lump in neck", weight: 75 },
      { phrase: "swollen lump in my neck", weight: 100 },
      { phrase: "neck lump wont go away", weight: 100 },
      { phrase: "lump that wont go away", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-lymphnode-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where are the swollen glands?" },
      { id: "oscg-lymphnode-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long have they been swollen?" },
      { id: "oscg-lymphnode-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any night sweats, high fever, or other illness signs?" }
    ],
    questions: [
      {
        id: "oscg-lymphnode-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there difficulty swallowing or breathing alongside the swollen glands?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK swollen glands guidance: seek immediate 111/urgent help for swallowing or breathing difficulty alongside swollen glands.",
        redFlag: false,
        keywords: ["swollen glands difficulty swallowing", "swollen glands breathing problem"],
        careAdviceIds: ["oscg-lymphnode-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 78,
        questionOrder: 1
      },
      {
        id: "oscg-lymphnode-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Are the glands getting bigger or have they not gone down within 1 week, do they feel hard or not move when pressed, is there night sweats or a very high temperature, are they present with no other signs of illness, or are they just above/below the collarbone?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a GP visit for these features.",
        redFlag: false,
        keywords: ["swollen glands not going down", "hard swollen glands", "night sweats"],
        careAdviceIds: ["oscg-lymphnode-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-lymphnode-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this typical swollen glands alongside a cold or minor infection, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance: most swollen glands are due to common infections and resolve on their own within 1-2 weeks.",
        redFlag: false,
        keywords: ["typical swollen glands with cold"],
        careAdviceIds: ["oscg-lymphnode-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-lymphnode-urgent-advice", titleEn: "Urgent swollen glands review", instructionTextEn: "Arrange same-day medical review for these symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing or swallowing worsens"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-lymphnode-routine-advice", titleEn: "Routine swollen glands follow-up", instructionTextEn: "Book a GP appointment for these features.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["glands continue growing", "new symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-lymphnode-selfcare-advice", titleEn: "Home care for swollen glands", instructionTextEn: "Rest, drink plenty of fluids, and take paracetamol or ibuprofen for discomfort (no aspirin for children under 16). Swollen glands typically go down within 1-2 weeks.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["not improving after 1 week", "glands feel hard or fixed"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-09-29", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Swollen glands\", https://www.nhs.uk/conditions/swollen-glands/ (page last reviewed 29 September 2023)"],
      contentNotice: "Decomposed from NHS.UK's published swollen glands guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
