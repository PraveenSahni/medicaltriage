import type { ClinicalContentPackageInput } from "../../types/clinicalContent.js";
import { buildGuidelineProvenance } from "./shared/builders.js";

type ProtocolInput = ClinicalContentPackageInput["protocols"][number];

/**
 * Batch 16 - decomposed from real, publicly available NHS.UK "when to get
 * help" guidance pages (Crown copyright, reused under the Open Government
 * Licence), plus two protocols based on standard, non-proprietary medical
 * knowledge where a specific NHS.UK page could not be retrieved (Marine
 * Animal Stings and Bites, generalizing the snake/stingray venomous-injury
 * pattern from batch12; Contraception - Birth Control Shot, standard
 * reproductive-health knowledge about the Depo-Provera injection). Domestic
 * Violence follows the same sensitive-topic handling already established for
 * Suicide Concerns and Sexual Assault or Rape (batch03/04): no UK-specific
 * hotline numbers, and an explicit provenance notice requiring the host
 * organization to insert real Qatar-applicable contact info before
 * production use. Sickle Cell Disease - Acute Pain adds a standard,
 * widely-taught hematology emergency screen (the NHS.UK source page itself
 * does not specify emergency criteria) since sickle cell crises are a
 * genuine, common presentation in this Gulf-region deployment.
 */
export const batch16Protocols: ProtocolInput[] = [
  // ------------------------------------------------------------------
  // 1. Warts - https://www.nhs.uk/conditions/warts-and-verrucas/ (reviewed 2023-07-25)
  // ------------------------------------------------------------------
  {
    id: "oscg-warts",
    titleEn: "Warts",
    clinicalDefinitionEn: "Warts and verrucas assessment decomposed from NHS.UK's published warts and verrucas guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "wart", weight: 100 },
      { phrase: "verruca", weight: 100 },
      { phrase: "wart on my skin", weight: 90 },
      { phrase: "small skin growth", weight: 80 },
      { phrase: "wart that keeps coming back", weight: 100 },
      { phrase: "wart on my hand", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-warts-iaq1", sequence: 1, responseType: "LOCATION", promptTextEn: "Where is the wart or verruca?" },
      { id: "oscg-warts-iaq2", sequence: 2, responseType: "DURATION", promptTextEn: "How long has it been present?" },
      { id: "oscg-warts-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Has it changed in appearance, bled, or is it painful?" }
    ],
    questions: [
      {
        id: "oscg-warts-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the wart on the face or genitals, does it bleed or change in appearance, is it large or painful, or does it keep coming back?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK warts and verrucas guidance recommends GP review for these features - genital warts specifically need sexual health clinic referral, and changing/bleeding growths need assessment.",
        redFlag: false,
        keywords: ["genital wart", "wart bleeding or changing", "large painful wart"],
        careAdviceIds: ["oscg-warts-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-warts-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a typical, small wart or verruca with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes typical warts/verrucas as manageable with pharmacy over-the-counter treatments.",
        redFlag: false,
        keywords: ["typical small wart"],
        careAdviceIds: ["oscg-warts-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-warts-urgent-advice", titleEn: "Wart needing GP or clinic review", instructionTextEn: "Arrange a GP appointment - genital warts need referral to a sexual health clinic, and facial, changing, or bleeding warts need in-person assessment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["continues to change or bleed"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-warts-selfcare-advice", titleEn: "Home treatment for warts/verrucas", instructionTextEn: "Ask a pharmacist about over-the-counter wart/verruca treatments (creams, plasters, or sprays), which can take up to 3 months to work. Wash hands after touching a wart, change socks daily with a verruca, cover it when swimming, and avoid sharing towels or shoes.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["it grows, bleeds, or becomes painful", "does not improve after 3 months of treatment"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-07-25", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Warts and verrucas\", https://www.nhs.uk/conditions/warts-and-verrucas/ (page last reviewed 25 July 2023)"],
      contentNotice: "Decomposed from NHS.UK's published warts and verrucas guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 2. Sickle Cell Disease - Acute Pain - https://www.nhs.uk/conditions/sickle-cell-disease/ (reviewed 2022-11-30) + standard hematology emergency knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-sickle-cell-acute-pain",
    titleEn: "Sickle Cell Disease - Acute Pain",
    clinicalDefinitionEn: "Sickle cell pain crisis assessment, combining NHS.UK's published sickle cell disease guidance with standard, widely-taught hematology emergency criteria (the source page does not itself define emergency thresholds).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 5,
    keywords: [
      { phrase: "sickle cell pain crisis", weight: 100 },
      { phrase: "sickle cell pain episode", weight: 100 },
      { phrase: "sickle cell disease pain", weight: 100 },
      { phrase: "having a sickle cell crisis", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-sicklecell-iaq1", sequence: 1, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" },
      { id: "oscg-sicklecell-iaq2", sequence: 2, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" },
      { id: "oscg-sicklecell-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any chest pain, breathing difficulty, weakness, or confusion?" }
    ],
    questions: [
      {
        id: "oscg-sicklecell-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Along with the pain, is there any fever, chest pain, difficulty breathing, sudden weakness or numbness on one side, confusion, severe abdominal pain, priapism, or pain not controlled by the usual home medication?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Widely-taught hematology emergency knowledge: fever in sickle cell disease can indicate life-threatening sepsis (due to functional asplenia), chest pain/breathing difficulty may indicate acute chest syndrome, and sudden weakness/confusion may indicate stroke - all recognized sickle cell emergencies requiring immediate hospital care.",
        redFlag: true,
        keywords: ["fever with sickle cell", "chest pain with sickle cell", "weakness one side sickle cell", "pain not controlled sickle cell"],
        careAdviceIds: ["oscg-sicklecell-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-sicklecell-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a mild, typical pain episode that responds to the usual home pain plan, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK sickle cell disease guidance describes hydration, warmth, and over-the-counter pain relief as self-care measures for milder episodes.",
        redFlag: false,
        keywords: ["mild sickle cell pain episode"],
        careAdviceIds: ["oscg-sicklecell-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-sicklecell-emergency-advice", titleEn: "Emergency sickle cell crisis precautions", instructionTextEn: "Arrange emergency transport immediately - fever, chest symptoms, sudden weakness, or uncontrolled pain in sickle cell disease can be life-threatening and need hospital-level care.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening pain", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-sicklecell-selfcare-advice", titleEn: "Home care for a mild sickle cell pain episode", instructionTextEn: "Drink plenty of fluids, stay warm, and take the usual over-the-counter pain relief (such as paracetamol or ibuprofen) as advised by the person's sickle cell care team.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["fever develops", "pain is not controlled by usual medication", "chest pain or breathing difficulty develops"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-11-30", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Sickle cell disease\", https://www.nhs.uk/conditions/sickle-cell-disease/ (page last reviewed 30 November 2022) - self-care guidance; standard, widely-taught hematology emergency criteria (fever/sepsis risk, acute chest syndrome, stroke signs) not explicitly stated on this overview page"],
      contentNotice: "The NHS.UK sickle cell disease overview page describes self-care measures but does not itself define emergency thresholds, so the emergency tier here adds standard, widely-taught hematology knowledge (not a direct quote). Genuinely relevant given sickle cell disease prevalence in the Gulf region. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, ideally informed by the person's individual sickle cell care plan where available."
    })
  },

  // ------------------------------------------------------------------
  // 3. Domestic Violence - https://www.nhs.uk/live-well/healthy-body/getting-help-for-domestic-violence/ (reviewed 2026-06-23)
  // ------------------------------------------------------------------
  {
    id: "oscg-domestic-violence",
    titleEn: "Domestic Violence",
    clinicalDefinitionEn: "Domestic violence/abuse assessment decomposed from NHS.UK's published domestic abuse guidance, following the same sensitive-topic handling already established for Suicide Concerns and Sexual Assault or Rape.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "domestic violence", weight: 100 },
      { phrase: "domestic abuse", weight: 100 },
      { phrase: "my partner hurt me", weight: 95 },
      { phrase: "afraid of my partner", weight: 95 },
      { phrase: "partner hit me", weight: 100 },
      { phrase: "dont feel safe right now", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-domesticviolence-iaq1", sequence: 1, responseType: "YES_NO", promptTextEn: "Is the person in immediate danger right now?" },
      { id: "oscg-domesticviolence-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Are there children involved or at risk?" },
      { id: "oscg-domesticviolence-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Is the caller safe to talk right now?" }
    ],
    questions: [
      {
        id: "oscg-domesticviolence-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is the person in immediate danger right now, or has there been physical violence such as being struck, choked, burned, or having objects thrown at them?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK guidance states emergency situations warrant an immediate emergency services call - physical safety takes priority.",
        redFlag: true,
        keywords: ["in immediate danger from partner", "partner hit me", "partner choked me"],
        careAdviceIds: ["oscg-domesticviolence-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-domesticviolence-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there ongoing emotional abuse, threats, intimidation, isolation, or controlling behavior from a partner, ex-partner, or family member, without immediate physical danger right now?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance emphasizes that a person does not need to wait for a crisis to get help - connecting promptly with a GP or a specialized support organization is appropriate at any point.",
        redFlag: false,
        keywords: ["controlling partner", "threatened by partner", "afraid of my partner"],
        careAdviceIds: ["oscg-domesticviolence-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-domesticviolence-emergency-advice", titleEn: "Emergency domestic violence precautions", instructionTextEn: "If it is safe to talk, connect the caller with emergency services immediately. If the caller cannot speak freely, follow your organization's silent/coded-response protocol for calls where the person may not be able to talk openly.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["immediate danger continues"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-domesticviolence-urgent-advice", titleEn: "Connecting to domestic abuse support", instructionTextEn: "Connect the caller with your organization's local domestic abuse support service and a GP appointment. Confidential safety planning support is available even without an immediate crisis. Some pharmacies and banks also offer safe, confidential spaces to talk.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["the situation escalates to physical danger"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2026-06-23", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Getting help for domestic violence\", https://www.nhs.uk/live-well/healthy-body/getting-help-for-domestic-violence/ (page last reviewed 23 June 2026)"],
      contentNotice: "Decomposed from NHS.UK's published domestic abuse guidance (Crown copyright, reused under the Open Government Licence). Consistent with the handling already established for Suicide Concerns and Sexual Assault or Rape (batch03/04), UK-specific hotline names/numbers are deliberately NOT included - care advice instead directs the triager to the host organization's own local support service. The host organization MUST insert real Qatar-applicable domestic-abuse support contact information before production use. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 4. Falls and Falling - https://www.nhs.uk/conditions/falls/ (reviewed 2025-03-06)
  // ------------------------------------------------------------------
  {
    id: "oscg-falls-and-falling",
    titleEn: "Falls and Falling",
    clinicalDefinitionEn: "Falls assessment decomposed from NHS.UK's published falls guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "had a fall", weight: 100 },
      { phrase: "fell down at home", weight: 95 },
      { phrase: "keeps falling", weight: 90 },
      { phrase: "cant get up after falling", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-fallsandfalling-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How did the fall happen?" },
      { id: "oscg-fallsandfalling-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Can the person get up on their own?" },
      { id: "oscg-fallsandfalling-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any head injury or loss of consciousness?" }
    ],
    questions: [
      {
        id: "oscg-fallsandfalling-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "May the person have injured their head, back, neck, or hip, or are they unable to get up?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK falls guidance lists possible head/back/neck/hip injury and inability to get up as call-999 criteria.",
        redFlag: true,
        keywords: ["cant get up after fall", "hit head in fall", "hip injury from fall"],
        careAdviceIds: ["oscg-fallsandfalling-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-fallsandfalling-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person in pain, injured, or feeling unwell following the fall?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance recommends NHS 111 or urgent review for pain, injury, or feeling unwell after a fall, even without the emergency features above.",
        redFlag: false,
        keywords: ["pain after falling", "feeling unwell after a fall"],
        careAdviceIds: ["oscg-fallsandfalling-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-fallsandfalling-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Did the person get up fine with no pain, injury, or concerning symptoms?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit to discuss balance/mobility for repeated minor falls, and general fall-prevention self-care otherwise.",
        redFlag: false,
        keywords: ["minor fall no injury"],
        careAdviceIds: ["oscg-fallsandfalling-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-fallsandfalling-emergency-advice", titleEn: "Emergency fall precautions", instructionTextEn: "Do not try to move the person if a head, back, neck, or hip injury is possible. Keep them still and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["loss of consciousness", "worsening pain"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-fallsandfalling-urgent-advice", titleEn: "Urgent fall review", instructionTextEn: "Arrange same-day medical review to check for injury and identify the cause of the fall.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "new symptoms develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-fallsandfalling-selfcare-advice", titleEn: "Fall prevention at home", instructionTextEn: "Stay physically active with regular strength and balance exercises, wear well-fitting shoes with good grip, keep a phone or alarm nearby, remove trip hazards and loose wires, use non-slip bath mats, and review medications with a GP or pharmacist if balance is a concern. See a GP if falls keep happening.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["falls become more frequent", "pain or injury is noticed later"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2025-03-06", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Falls\", https://www.nhs.uk/conditions/falls/ (page last reviewed 06 March 2025)"],
      contentNotice: "Decomposed from NHS.UK's published falls guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 5. Marine Animal Stings and Bites - North America - generalized from Snakebite/Stingray Injury (batch12)
  // ------------------------------------------------------------------
  {
    id: "oscg-marine-animal-stings-bites",
    titleEn: "Marine Animal Stings and Bites - North America",
    clinicalDefinitionEn: "General marine animal sting/bite assessment (jellyfish, sea urchin, coral, etc.), generalized from the venomous-injury first-aid principles already established for Snakebite and Stingray Injury (batch12).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "jellyfish sting", weight: 100 },
      { phrase: "stung by a jellyfish", weight: 100 },
      { phrase: "sea urchin spine in my foot", weight: 95 },
      { phrase: "marine animal sting", weight: 95 },
      { phrase: "cut on coral", weight: 90 },
      { phrase: "stung by a jellyfish while swimming", weight: 100 },
      { phrase: "jellyfish at the beach", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-marinesting-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "What kind of marine animal was involved?" },
      { id: "oscg-marinesting-iaq2", sequence: 2, responseType: "LOCATION", promptTextEn: "Where is the sting or injury?" },
      { id: "oscg-marinesting-iaq3", sequence: 3, responseType: "DURATION", promptTextEn: "When did it happen?" }
    ],
    questions: [
      {
        id: "oscg-marinesting-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there difficulty breathing, widespread swelling, severe pain out of proportion to the visible injury, or has the person lost consciousness?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Marine envenomation severity varies significantly by species (jellyfish, sea urchin, coral, and others common in Gulf waters); these are recognized signs of a severe reaction requiring immediate emergency care, following the same principle already applied to Snakebite and Stingray Injury.",
        redFlag: true,
        keywords: ["breathing difficulty after jellyfish sting", "severe pain marine sting", "widespread swelling marine sting"],
        careAdviceIds: ["oscg-marinesting-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-marinesting-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there a puncture wound from a sea urchin or coral, or moderate pain and swelling without the emergency features above?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Marine puncture wounds (sea urchin spines, coral cuts) carry a high infection risk and may need professional wound care, consistent with the Stingray Injury protocol's urgent tier.",
        redFlag: false,
        keywords: ["sea urchin spine stuck", "coral cut infection risk"],
        careAdviceIds: ["oscg-marinesting-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-marinesting-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a mild sting with local pain only, and none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Most mild jellyfish stings and minor marine scrapes are manageable at home with rinsing and pain relief.",
        redFlag: false,
        keywords: ["mild jellyfish sting"],
        careAdviceIds: ["oscg-marinesting-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-marinesting-emergency-advice", titleEn: "Emergency marine sting/bite precautions", instructionTextEn: "Keep the person still, rinse the area with seawater (not fresh water) if a jellyfish sting, and arrange emergency transport immediately.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening breathing difficulty", "spreading swelling"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-marinesting-urgent-advice", titleEn: "Urgent marine puncture wound review", instructionTextEn: "Do not try to fully remove deeply embedded spines at home. Arrange same-day medical review for wound cleaning and a tetanus check.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["increasing pain, swelling, or redness", "fever develops"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-marinesting-selfcare-advice", titleEn: "Home care for a mild marine sting", instructionTextEn: "Rinse the area with seawater or vinegar (not fresh water, which can worsen a jellyfish sting), remove any visible tentacles carefully with tweezers, and take over-the-counter pain relief as needed.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["worsening pain or swelling", "any allergic reaction symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Snake bites\" (venomous-injury first-aid principles, already generalized to Stingray Injury in batch12), https://www.nhs.uk/conditions/snake-bites/ - further generalized to general marine animal stings/bites; standard first-aid knowledge of jellyfish sting management (seawater rinse, not fresh water)"],
      contentNotice: "No dedicated NHS.UK page exists for general marine animal stings/bites. This protocol generalizes the venomous-injury first-aid principles already applied to Stingray Injury, combined with widely-documented general first-aid knowledge for jellyfish/sea urchin/coral injuries - a documented generalization, genuinely relevant to Qatar's coastal waters. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 6. Contraception - Birth Control Shot - standard reproductive-health knowledge (Depo-Provera injection)
  // ------------------------------------------------------------------
  {
    id: "oscg-contraception-birth-control-shot",
    titleEn: "Contraception - Birth Control Shot",
    clinicalDefinitionEn: "Contraceptive injection (e.g. Depo-Provera) symptom and side-effect assessment, based on standard, universally-recognized reproductive-health knowledge.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "birth control shot", weight: 100 },
      { phrase: "contraceptive injection", weight: 100 },
      { phrase: "depo provera side effects", weight: 100 },
      { phrase: "birth control injection question", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-birthcontrolshot-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the last injection given?" },
      { id: "oscg-birthcontrolshot-iaq2", sequence: 2, responseType: "OPEN_TEXT", promptTextEn: "What symptoms or questions are present?" },
      { id: "oscg-birthcontrolshot-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any leg swelling/pain, severe headache, chest pain, or signs of an allergic reaction?" }
    ],
    questions: [
      {
        id: "oscg-birthcontrolshot-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there sudden severe headache, vision changes, chest pain, shortness of breath, one-sided leg swelling and pain, or signs of a severe allergic reaction (facial/throat swelling, difficulty breathing, widespread hives)?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "These are widely-recognized warning signs of a rare but serious hormonal-contraceptive complication (such as a blood clot or severe allergic reaction) and need immediate emergency evaluation.",
        redFlag: true,
        keywords: ["severe headache after birth control shot", "leg swelling after birth control shot", "allergic reaction to birth control shot"],
        careAdviceIds: ["oscg-birthcontrolshot-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-birthcontrolshot-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is there heavy or prolonged bleeding, significant mood changes, or a missed injection with a concern about pregnancy risk?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "Heavy/prolonged bleeding, significant mood changes, or a missed dose with pregnancy risk warrant prompt review with a reproductive health provider.",
        redFlag: false,
        keywords: ["heavy bleeding on birth control shot", "missed birth control shot"],
        careAdviceIds: ["oscg-birthcontrolshot-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-birthcontrolshot-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Are these mild, common side effects (irregular light spotting, mild weight change, mild injection-site soreness) with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Irregular bleeding and mild injection-site soreness are common, expected side effects that usually settle over the first few months.",
        redFlag: false,
        keywords: ["mild birth control shot side effects"],
        careAdviceIds: ["oscg-birthcontrolshot-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-birthcontrolshot-emergency-advice", titleEn: "Emergency contraceptive-injection complication precautions", instructionTextEn: "Arrange emergency transport immediately - these symptoms need urgent evaluation to rule out a serious complication.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening headache or vision changes", "worsening leg swelling or breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-birthcontrolshot-urgent-advice", titleEn: "Urgent contraceptive-injection review", instructionTextEn: "Arrange a prompt appointment with a reproductive health provider to discuss the bleeding pattern, mood changes, or missed dose.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["bleeding worsens", "symptoms persist"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-birthcontrolshot-selfcare-advice", titleEn: "Home monitoring for mild side effects", instructionTextEn: "Irregular light bleeding, mild weight change, and mild soreness at the injection site are common and often settle within the first few months. Keep track of symptoms and the date of the next injection.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["bleeding becomes heavy or prolonged", "any severe symptoms develop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized reproductive-health knowledge about the contraceptive injection (Depo-Provera) side-effect profile and rare serious complications - the specific NHS.UK side-effects subpage could not be retrieved during authoring"],
      contentNotice: "The detailed NHS.UK contraceptive injection side-effects subpage could not be retrieved during authoring. This protocol is based on widely-taught, non-proprietary reproductive-health knowledge about the contraceptive injection's expected side effects and rare serious complication warning signs. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 7. Tooth Extraction - standard post-extraction dental first-aid knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-tooth-extraction",
    titleEn: "Tooth Extraction",
    clinicalDefinitionEn: "Post-tooth-extraction symptom assessment, based on standard, universally-taught post-extraction dental first-aid knowledge (dry socket and bleeding control).",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 3,
    keywords: [
      { phrase: "tooth extraction", weight: 100 },
      { phrase: "had a tooth pulled", weight: 100 },
      { phrase: "extraction site pain", weight: 95 },
      { phrase: "dry socket", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-toothextraction-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "When was the tooth extracted?" },
      { id: "oscg-toothextraction-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Is the bleeding under control?" },
      { id: "oscg-toothextraction-iaq3", sequence: 3, responseType: "PAIN_SCALE", promptTextEn: "How severe is the pain, 0-10?" }
    ],
    questions: [
      {
        id: "oscg-toothextraction-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there uncontrolled bleeding from the extraction site, or severe facial swelling making it hard to breathe or swallow?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "Uncontrolled post-extraction bleeding or spreading facial swelling threatening the airway are time-critical dental emergencies.",
        redFlag: true,
        keywords: ["cant stop bleeding after tooth extraction", "severe swelling after tooth extraction"],
        careAdviceIds: ["oscg-toothextraction-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-toothextraction-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Did the pain improve and then suddenly get worse a few days after the extraction, especially with a bad taste or odor, or is there increasing swelling, fever, or pus?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "This pattern is classic for dry socket (lost blood clot) or an infection - both well-established post-extraction complications needing prompt dental review.",
        redFlag: false,
        keywords: ["pain got worse days after extraction", "bad taste after tooth extraction", "dry socket symptoms"],
        careAdviceIds: ["oscg-toothextraction-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-toothextraction-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this the expected mild soreness and swelling in the first day or two after extraction, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Mild soreness, swelling, and minor oozing are expected in the first 1-2 days after a routine extraction.",
        redFlag: false,
        keywords: ["normal soreness after tooth extraction"],
        careAdviceIds: ["oscg-toothextraction-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-toothextraction-emergency-advice", titleEn: "Emergency post-extraction precautions", instructionTextEn: "Bite firmly on a folded clean gauze or cloth over the socket for 15-20 minutes without checking repeatedly, and arrange emergency transport immediately if bleeding continues or breathing becomes difficult.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["bleeding does not stop", "breathing difficulty"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothextraction-urgent-advice", titleEn: "Urgent post-extraction review", instructionTextEn: "Arrange same-day dental review - this pattern suggests dry socket or infection, both of which need professional treatment.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["pain worsens", "fever or swelling increases"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-toothextraction-selfcare-advice", titleEn: "Home care after a routine tooth extraction", instructionTextEn: "Bite on gauze to control initial oozing, apply a cold compress for swelling, take over-the-counter pain relief as directed, eat soft foods, and avoid rinsing forcefully, using a straw, or smoking for at least 24 hours to protect the healing blood clot.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["pain worsens a few days after extraction", "bad taste, odor, fever, or increasing swelling develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-taught post-extraction dental first-aid knowledge (bleeding control, dry socket recognition, clot-protection instructions) - not a single-source quote"],
      contentNotice: "No dedicated NHS.UK page exists for post-tooth-extraction care specifically. This protocol is based on widely-taught, non-proprietary dental first-aid knowledge. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 8. Cough - Chronic - https://www.nhs.uk/conditions/cough/ (reviewed 2023-12-08)
  // ------------------------------------------------------------------
  {
    id: "oscg-cough-chronic",
    titleEn: "Cough - Chronic",
    clinicalDefinitionEn: "Chronic/persistent cough (3+ weeks) assessment decomposed from NHS.UK's published cough guidance.",
    ageMin: 0,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 2,
    keywords: [
      { phrase: "chronic cough", weight: 100 },
      { phrase: "cough for weeks", weight: 100 },
      { phrase: "persistent cough", weight: 95 },
      { phrase: "cough wont go away", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-coughchronic-iaq1", sequence: 1, responseType: "DURATION", promptTextEn: "How long has the cough lasted?" },
      { id: "oscg-coughchronic-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Any weight loss, blood in the phlegm, or chest pain?" },
      { id: "oscg-coughchronic-iaq3", sequence: 3, responseType: "TEMPERATURE", promptTextEn: "What is the temperature, if measured?" }
    ],
    questions: [
      {
        id: "oscg-coughchronic-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is the cough rapidly worsening, does the person feel very unwell, is there chest pain, swollen and painful neck glands, difficulty breathing, or is there blood in the phlegm?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK cough guidance lists these as reasons to contact NHS 111 or a GP immediately.",
        redFlag: false,
        keywords: ["coughing up blood", "chest pain with cough", "cough getting worse fast"],
        careAdviceIds: ["oscg-coughchronic-urgent-advice"],
        telemedicineEligible: false,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-coughchronic-q1-routine",
        acuityOrder: 2,
        severity: "Routine",
        questionTextEn: "Has the cough lasted more than 3 weeks, is there unexplained weight loss, or does the person have a weakened immune system?",
        dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
        rationaleEn: "NHS.UK guidance recommends a routine GP visit for a cough persisting beyond 3 weeks, or with weight loss or immune compromise.",
        redFlag: false,
        keywords: ["cough lasting 3 weeks", "weight loss with chronic cough"],
        careAdviceIds: ["oscg-coughchronic-routine-advice"],
        telemedicineEligible: true,
        dispositionLevel: 50,
        questionOrder: 1
      },
      {
        id: "oscg-coughchronic-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a milder cough of less than 3 weeks with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance describes most coughs under 3 weeks as manageable at home.",
        redFlag: false,
        keywords: ["mild cough under 3 weeks"],
        careAdviceIds: ["oscg-coughchronic-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-coughchronic-urgent-advice", titleEn: "Urgent cough review", instructionTextEn: "Arrange same-day medical review for these concerning cough symptoms.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["worsening breathing difficulty", "more blood in phlegm"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-coughchronic-routine-advice", titleEn: "Routine persistent cough follow-up", instructionTextEn: "Book a GP appointment to investigate a cough lasting more than 3 weeks.", dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT", warningSigns: ["new symptoms develop"], displayOrder: 2, adviceCategory: "NOTE_TO_TRIAGER" },
      { id: "oscg-coughchronic-selfcare-advice", titleEn: "Home care for a mild cough", instructionTextEn: "Rest and stay hydrated, stay home if feverish, take paracetamol or ibuprofen for discomfort, and try hot lemon and honey (not for babies under 1 year). A cough is rarely a sign of something serious.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["lasts more than 3 weeks", "blood in phlegm, weight loss, or breathing difficulty develops"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2023-12-08", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Cough\", https://www.nhs.uk/conditions/cough/ (page last reviewed 08 December 2023)"],
      contentNotice: "Decomposed from NHS.UK's published cough guidance (Crown copyright, reused under the Open Government Licence), adapted into IST Health's STCC-shaped triage format for the chronic/persistent-cough presentation. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  },

  // ------------------------------------------------------------------
  // 9. Alcohol Use and Problems - https://www.nhs.uk/live-well/alcohol-support/ (reviewed 2022-12-16)
  // ------------------------------------------------------------------
  {
    id: "oscg-alcohol-use-and-problems",
    titleEn: "Alcohol Use and Problems",
    clinicalDefinitionEn: "Alcohol misuse and withdrawal assessment decomposed from NHS.UK's published alcohol support guidance.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 4,
    keywords: [
      { phrase: "alcohol problem", weight: 100 },
      { phrase: "drinking too much", weight: 95 },
      { phrase: "alcohol withdrawal", weight: 100 },
      { phrase: "trying to stop drinking", weight: 90 },
      { phrase: "want to try to stop drinking", weight: 100 },
      { phrase: "think i have a drinking problem", weight: 100 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-alcoholuse-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "Describe the current drinking pattern and concerns." },
      { id: "oscg-alcoholuse-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has the person tried to stop or cut down recently?" },
      { id: "oscg-alcoholuse-iaq3", sequence: 3, responseType: "YES_NO", promptTextEn: "Any tremors, hallucinations, or seizures?" }
    ],
    questions: [
      {
        id: "oscg-alcoholuse-q0-emergency",
        acuityOrder: 1,
        severity: "Emergency",
        questionTextEn: "Is there a seizure, hallucinations, or severe tremors, especially after stopping or cutting down drinking?",
        dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
        rationaleEn: "NHS.UK alcohol support guidance lists hallucinations, severe tremors, and seizures as call-999 severe alcohol withdrawal warning signs.",
        redFlag: true,
        keywords: ["seizure alcohol withdrawal", "hallucinations from alcohol withdrawal", "severe tremors alcohol withdrawal"],
        careAdviceIds: ["oscg-alcoholuse-emergency-advice"],
        telemedicineEligible: false,
        dispositionLevel: 100,
        questionOrder: 1
      },
      {
        id: "oscg-alcoholuse-q1-urgent",
        acuityOrder: 2,
        severity: "Urgent",
        questionTextEn: "Is the person physically dependent on alcohol and planning to stop or cut down, or having mild-to-moderate withdrawal signs like anxiety, sweating, tremors, nausea, or vomiting?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "NHS.UK guidance warns that stopping drinking abruptly can be dangerous if physically dependent, and recommends medical advice before stopping to arrange safe withdrawal support.",
        redFlag: false,
        keywords: ["mild alcohol withdrawal symptoms", "physically dependent on alcohol"],
        careAdviceIds: ["oscg-alcoholuse-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-alcoholuse-q2-selfcare",
        acuityOrder: 3,
        severity: "Self-care",
        questionTextEn: "Is this a general concern about drinking levels without dependence or withdrawal symptoms?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "NHS.UK guidance recommends starting with an honest conversation with a GP about drinking levels and available community support.",
        redFlag: false,
        keywords: ["concerned about drinking too much"],
        careAdviceIds: ["oscg-alcoholuse-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-alcoholuse-emergency-advice", titleEn: "Emergency alcohol withdrawal precautions", instructionTextEn: "Arrange emergency transport immediately - seizures, hallucinations, or severe tremors during alcohol withdrawal can be life-threatening.", dispositionCode: "HMC_EMERGENCY_DEPARTMENT", warningSigns: ["worsening confusion", "another seizure"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-alcoholuse-urgent-advice", titleEn: "Urgent alcohol dependence review", instructionTextEn: "Arrange prompt medical advice before stopping or cutting down if physically dependent - a clinician can arrange safe, medically supervised withdrawal support.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["withdrawal symptoms worsen", "tremors, hallucinations, or seizures develop"], displayOrder: 2, adviceCategory: "DISPOSITION" },
      { id: "oscg-alcoholuse-selfcare-advice", titleEn: "Getting support for alcohol use", instructionTextEn: "Talk honestly with a GP about drinking levels and concerns. Community alcohol services, self-help groups, and family support organizations can all help - relying only on family and friends is often not enough for long-term change.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["withdrawal symptoms develop when cutting down", "drinking increases despite trying to stop"], displayOrder: 3, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", expertReviewerEn: "NHS.UK clinical editorial review (source publisher)", lastReviewedIso: "2022-12-16", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["NHS.UK, \"Getting help for alcohol misuse\", https://www.nhs.uk/live-well/alcohol-support/ (page last reviewed 16 December 2022)"],
      contentNotice: "Decomposed from NHS.UK's published alcohol support guidance (Crown copyright, reused under the Open Government Licence). Consistent with the sensitive-topic handling already used for Domestic Violence in this batch and Suicide Concerns/Sexual Assault or Rape earlier, the source's specific UK helpline (Drinkline) is deliberately NOT included - care advice instead directs the triager to community/local resources. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, and the host organization should insert real Qatar-applicable alcohol support resources."
    })
  },

  // ------------------------------------------------------------------
  // 10. Smoking - Tobacco Use and Problems - standard public-health smoking-cessation knowledge
  // ------------------------------------------------------------------
  {
    id: "oscg-smoking-tobacco-use",
    titleEn: "Smoking - Tobacco Use and Problems",
    clinicalDefinitionEn: "Tobacco/smoking cessation support assessment, based on standard, universally-recognized public-health smoking-cessation knowledge and nicotine-withdrawal recognition.",
    ageMin: 12,
    mode: "after-hours",
    patientGroup: "mixed",
    acuity: 1,
    keywords: [
      { phrase: "want to quit smoking", weight: 100 },
      { phrase: "smoking cessation", weight: 100 },
      { phrase: "trying to stop smoking", weight: 95 },
      { phrase: "nicotine withdrawal", weight: 90 }
    ],
    initialAssessmentQuestions: [
      { id: "oscg-smokingtobacco-iaq1", sequence: 1, responseType: "OPEN_TEXT", promptTextEn: "How much and how often does the person currently smoke?" },
      { id: "oscg-smokingtobacco-iaq2", sequence: 2, responseType: "YES_NO", promptTextEn: "Has a quit attempt been tried before?" },
      { id: "oscg-smokingtobacco-iaq3", sequence: 3, responseType: "OPEN_TEXT", promptTextEn: "Any breathing symptoms or other health concerns related to smoking?" }
    ],
    questions: [
      {
        id: "oscg-smokingtobacco-q0-urgent",
        acuityOrder: 1,
        severity: "Urgent",
        questionTextEn: "Is there new or worsening shortness of breath, chest pain, or a persistent cough along with the smoking history?",
        dispositionCode: "HMC_URGENT_REVIEW",
        rationaleEn: "New or worsening respiratory or cardiac symptoms in a smoker warrant prompt medical evaluation rather than a cessation-support call alone.",
        redFlag: false,
        keywords: ["breathing symptoms with smoking history", "chest pain and smoker"],
        careAdviceIds: ["oscg-smokingtobacco-urgent-advice"],
        telemedicineEligible: true,
        dispositionLevel: 70,
        questionOrder: 1
      },
      {
        id: "oscg-smokingtobacco-q1-selfcare",
        acuityOrder: 2,
        severity: "Self-care",
        questionTextEn: "Is this a general request for help with quitting smoking or coping with nicotine withdrawal, with none of the features above?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Smoking cessation support (counseling, nicotine replacement therapy) is a well-established, effective, non-urgent service.",
        redFlag: false,
        keywords: ["wants help quitting smoking"],
        careAdviceIds: ["oscg-smokingtobacco-selfcare-advice"],
        telemedicineEligible: true,
        dispositionLevel: 15,
        questionOrder: 1
      }
    ],
    careAdvice: [
      { id: "oscg-smokingtobacco-urgent-advice", titleEn: "Urgent smoking-related symptom review", instructionTextEn: "Arrange prompt medical review for the breathing or chest symptoms before focusing on cessation support.", dispositionCode: "HMC_URGENT_REVIEW", warningSigns: ["breathing difficulty worsens", "chest pain develops"], displayOrder: 1, adviceCategory: "DISPOSITION" },
      { id: "oscg-smokingtobacco-selfcare-advice", titleEn: "Getting support to quit smoking", instructionTextEn: "Nicotine replacement therapy (patches, gum, lozenges) and behavioral support programs roughly double the chance of successfully quitting compared to willpower alone. Connect the caller with your organization's smoking-cessation service or a GP to discuss options.", dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS", warningSigns: ["new breathing or chest symptoms develop"], displayOrder: 2, adviceCategory: "CALL_BACK_IF", patientSendable: true }
    ],
    authorship: { authorEn: "IST Health Open-Source Guideline Content", versionYear: 2026, contentSet: "IST Open-Source Guideline Content | Mixed" },
    provenance: buildGuidelineProvenance({
      sourceDocuments: ["Standard, universally-recognized public-health smoking-cessation knowledge (nicotine replacement therapy and behavioral support effectiveness) - not a single-source quote"],
      contentNotice: "This protocol is based on widely-taught, non-proprietary public-health smoking-cessation knowledge rather than a single NHS.UK page. The host organization should connect callers to its own local smoking-cessation program. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use."
    })
  }
];
