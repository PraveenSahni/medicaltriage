import type { ClinicalContentPackageInput } from "../types/clinicalContent.js";

/**
 * Real, published, peer-reviewed clinical decision rules adapted into IST Health's
 * STCC-shaped triage format. This is NOT licensed Schmitt-Thompson (STCC) content and
 * NOT fabricated placeholder text - each protocol below is derived from a named,
 * publicly documented, validated clinical decision rule (the rule/algorithm itself is
 * a fact and not copyrightable; only a specific publication's wording would be).
 *
 * Every protocol still carries `requiresClinicalValidation: true`: a rule being real
 * and published does not substitute for local clinical governance sign-off before this
 * system trusts it as live triage logic.
 *
 * Three of these four rules (Centor/McIsaac, CURB-65, Wells DVT) are ADDITIVE POINT
 * SCORES, not simple Yes/No hierarchies like the Ottawa Ankle Rule. Rather than force
 * them into a false single-Yes-wins shape, each criterion is presented as its own TAQ
 * with `rationaleEn` explaining the real point tally, and a final tier question that
 * reflects the rule's own published score bands. Every protocol also carries a
 * universal STCC-style emergency rule-out question first (airway/breathing/circulation
 * red flags) ahead of the named rule's own criteria - this addition is standard
 * emergency-medicine practice, not part of the named rule itself, and is documented
 * as such per protocol.
 */
export const openSourceClinicalRulesContent: ClinicalContentPackageInput = {
  release: {
    name: "IST Health Open-Source Clinical Decision Rule Content",
    version: "2026.07-open-source-rules-v1",
    sourceType: "open-source-clinical-rule",
    region: "QA",
    mode: "after-hours"
  },
  localizedDispositions: [
    {
      code: "HMC_EMERGENCY_DEPARTMENT",
      destinationNameEn: "Hamad Medical Corporation (HMC) Emergency Department",
      routingNotesEn: "Use for emergency presentations identified by the universal rule-out screen.",
      region: "QA"
    },
    {
      code: "HMC_URGENT_REVIEW",
      destinationNameEn: "HMC urgent review pathway",
      routingNotesEn: "Use for time-sensitive findings that need same-day or next-day clinical review.",
      region: "QA"
    },
    {
      code: "PHCC_URGENT_CARE_OR_TELECONSULT",
      destinationNameEn: "PHCC urgent care or IST Health teleconsult",
      routingNotesEn: "Use for lower-acuity review once higher-priority criteria are ruled out.",
      region: "QA"
    },
    {
      code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
      destinationNameEn: "Self-care with callback precautions",
      routingNotesEn: "Use only when the rule's own published criteria indicate low risk.",
      region: "QA"
    }
  ],
  protocols: [
    // ------------------------------------------------------------------
    // 1. Ottawa Ankle Rule - Stiell IG et al., Ann Emerg Med 1992;21:384-390;
    //    BMJ 1995;311:594-597. A true Yes-fixes-disposition rule: any positive
    //    criterion means imaging is indicated; none positive means it is not.
    // ------------------------------------------------------------------
    {
      id: "oscr-ankle-foot-injury",
      titleEn: "Ankle and Foot Injury (Ottawa Ankle Rule)",
      clinicalDefinitionEn:
        "Adult ankle/foot injury imaging decision, adapted from the published, peer-reviewed Ottawa Ankle Rule (Stiell et al., 1992/1995). Validated to identify which ankle/foot injuries do not need an X-ray.",
      backgroundInfoEn:
        "The Ottawa Ankle Rule is one of the most externally validated clinical decision rules in emergency medicine, reducing unnecessary ankle X-rays without missing clinically significant fractures.",
      ageMin: 18,
      mode: "after-hours",
      patientGroup: "adult",
      acuity: 3,
      keywords: [
        { phrase: "ankle injury", weight: 100 },
        { phrase: "twisted ankle", weight: 95 },
        { phrase: "foot injury", weight: 90 },
        { phrase: "sprained ankle", weight: 85 },
        { phrase: "cannot bear weight", weight: 80 }
      ],
      initialAssessmentQuestions: [
        {
          id: "oscr-ankle-iaq1",
          sequence: 1,
          responseType: "LOCATION",
          promptTextEn: "Where exactly does the ankle or foot hurt?",
          clarificationPromptEn: "Ask the caller to point to or describe the exact spot.",
          emergencyKeywords: ["visible bone", "open wound", "foot cold or blue", "no feeling in foot"]
        },
        {
          id: "oscr-ankle-iaq2",
          sequence: 2,
          responseType: "DURATION",
          promptTextEn: "When did the injury happen?"
        },
        {
          id: "oscr-ankle-iaq3",
          sequence: 3,
          responseType: "YES_NO",
          promptTextEn: "Did you hear or feel a snap or pop at the time of injury?"
        }
      ],
      questions: [
        {
          id: "oscr-ankle-q0-emergency",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Is there an obvious deformity, visible bone, open wound, uncontrolled bleeding, or is the foot cold, pale, blue, or numb?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn:
            "Universal emergency rule-out added ahead of the Ottawa Ankle Rule itself (not part of the published rule) - signs of neurovascular compromise or open fracture require immediate emergency care regardless of the imaging-decision criteria below.",
          redFlag: true,
          keywords: ["deformity", "bone visible", "open wound", "cold foot", "blue foot", "numb"],
          careAdviceIds: ["oscr-ankle-emergency-advice"],
          telemedicineEligible: false,
          dispositionLevel: 100,
          questionOrder: 1
        },
        {
          id: "oscr-ankle-q1",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn:
            "Ottawa Ankle Rule criterion 1: is there bone tenderness over the posterior 6 cm or tip of the lateral or medial malleolus (the bony bumps on either side of the ankle)?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn:
            "Published Ottawa Ankle Rule malleolar-zone criterion. A positive answer to ANY malleolar/midfoot/weight-bearing criterion means imaging is indicated (Stiell et al., 1992).",
          redFlag: false,
          keywords: ["malleolus", "ankle bone tenderness"],
          careAdviceIds: ["oscr-ankle-imaging-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 1
        },
        {
          id: "oscr-ankle-q2",
          acuityOrder: 3,
          severity: "Urgent",
          questionTextEn:
            "Ottawa Ankle Rule criterion 2: is there bone tenderness over the navicular bone (top of the midfoot) or the base of the fifth metatarsal (outer midfoot)?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Published Ottawa Ankle Rule midfoot-zone criterion.",
          redFlag: false,
          keywords: ["navicular", "fifth metatarsal", "midfoot tenderness"],
          careAdviceIds: ["oscr-ankle-imaging-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 2
        },
        {
          id: "oscr-ankle-q3",
          acuityOrder: 4,
          severity: "Urgent",
          questionTextEn:
            "Ottawa Ankle Rule criterion 3: was the patient unable to take four steps, both right after the injury and right now?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Published Ottawa Ankle Rule weight-bearing criterion.",
          redFlag: false,
          keywords: ["cannot bear weight", "unable to walk", "four steps"],
          careAdviceIds: ["oscr-ankle-imaging-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 3
        },
        {
          id: "oscr-ankle-q4-negative",
          acuityOrder: 5,
          severity: "Self-care",
          questionTextEn:
            "If all three Ottawa criteria above are No: mild swelling or pain only, can bear weight, no bone tenderness at the specified points?",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          rationaleEn:
            "The Ottawa Ankle Rule's own validated conclusion: a patient who meets NONE of the malleolar, midfoot, or weight-bearing criteria does not need an ankle/foot X-ray.",
          redFlag: false,
          keywords: ["mild swelling", "can bear weight", "no bone tenderness"],
          careAdviceIds: ["oscr-ankle-selfcare-advice"],
          telemedicineEligible: true,
          telemedicineNotesEn: "Suitable for video visit follow-up if symptoms do not resolve as expected.",
          dispositionLevel: 15,
          questionOrder: 1
        }
      ],
      careAdvice: [
        {
          id: "oscr-ankle-emergency-advice",
          titleEn: "Emergency ankle/foot injury precautions",
          instructionTextEn:
            "Keep the limb still, do not attempt to realign a deformity, elevate if possible, and arrange emergency transport.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["worsening pain", "increasing swelling", "foot turning pale or blue"],
          displayOrder: 1,
          adviceCategory: "DISPOSITION"
        },
        {
          id: "oscr-ankle-imaging-advice",
          titleEn: "Ottawa Ankle Rule positive - arrange imaging",
          instructionTextEn:
            "Arrange same-day or next-day X-ray evaluation per the Ottawa Ankle Rule. Until then: rest the ankle, avoid weight-bearing, apply ice 20 minutes at a time, and elevate.",
          dispositionCode: "HMC_URGENT_REVIEW",
          warningSigns: ["increasing pain", "new numbness or tingling", "foot color change"],
          displayOrder: 2,
          adviceCategory: "DISPOSITION"
        },
        {
          id: "oscr-ankle-selfcare-advice",
          titleEn: "Ottawa Ankle Rule negative - home care (RICE)",
          instructionTextEn:
            "Rest, Ice (20 minutes at a time), Compression (elastic bandage, not too tight), Elevation above heart level. Gradually resume weight-bearing as tolerated over several days.",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          warningSigns: [
            "pain worsens instead of improving",
            "new inability to bear weight",
            "numbness, tingling, or color change develops"
          ],
          displayOrder: 3,
          adviceCategory: "CALL_BACK_IF",
          patientSendable: true
        }
      ],
      provenance: {
        generated: false,
        sourceKind: "open-source-clinical-decision-rule",
        sourceDocuments: [
          "Stiell IG, McKnight RD, Greenberg GH, et al. Implementation of the Ottawa Ankle Rules. JAMA. 1994;271(11):827-832.",
          "Stiell IG, Greenberg GH, McKnight RD, et al. Decision rules for the use of radiography in acute ankle injuries. Ann Emerg Med. 1992;21(4):384-390."
        ],
        contentNotice:
          "Derived from the published, peer-reviewed Ottawa Ankle Rule (Stiell et al.) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use.",
        requiresClinicalValidation: true,
        licensedContentIncluded: false
      }
    },

    // ------------------------------------------------------------------
    // 2. Centor Score, modified by McIsaac - Centor RM et al., Med Decis
    //    Making 1981;1:239-246; McIsaac WJ et al., CMAJ 1998;158:75-83.
    //    Additive point score, not a single-Yes-wins rule - see file header.
    // ------------------------------------------------------------------
    {
      id: "oscr-sore-throat",
      titleEn: "Sore Throat (Centor/McIsaac Score)",
      clinicalDefinitionEn:
        "Sore throat streptococcal-pharyngitis risk assessment, adapted from the published Centor score (Centor 1981) as modified by McIsaac (McIsaac 1998) to include an age adjustment.",
      backgroundInfoEn:
        "The Centor/McIsaac score is an ADDITIVE point score (not a single Yes/No hierarchy): age band, tonsillar exudate, tender anterior cervical lymphadenopathy, fever, and absence of cough each contribute points; the total determines whether testing or antibiotics are appropriate.",
      ageMin: 3,
      mode: "after-hours",
      patientGroup: "mixed",
      acuity: 2,
      keywords: [
        { phrase: "sore throat", weight: 100 },
        { phrase: "throat pain", weight: 90 },
        { phrase: "difficulty swallowing", weight: 70 },
        { phrase: "strep throat", weight: 85 }
      ],
      initialAssessmentQuestions: [
        {
          id: "oscr-throat-iaq1",
          sequence: 1,
          responseType: "DURATION",
          promptTextEn: "When did the sore throat start?"
        },
        {
          id: "oscr-throat-iaq2",
          sequence: 2,
          responseType: "TEMPERATURE",
          promptTextEn: "Have you measured a temperature? If so, what was it, and how was it measured?"
        },
        {
          id: "oscr-throat-iaq3",
          sequence: 3,
          responseType: "YES_NO",
          promptTextEn: "Do you have a cough?"
        }
      ],
      questions: [
        {
          id: "oscr-throat-q0-emergency",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Is there drooling or inability to swallow saliva, a muffled ('hot potato') voice, stridor, severe difficulty breathing, or inability to open the mouth fully?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn:
            "Universal emergency rule-out added ahead of the Centor/McIsaac score itself (not part of the published score) - these are standard emergency-medicine red flags for airway compromise, epiglottitis, or peritonsillar abscess.",
          redFlag: true,
          keywords: ["drooling", "cannot swallow", "muffled voice", "stridor", "cannot open mouth"],
          careAdviceIds: ["oscr-throat-emergency-advice"],
          telemedicineEligible: false,
          dispositionLevel: 100,
          questionOrder: 1
        },
        {
          id: "oscr-throat-q1",
          acuityOrder: 2,
          severity: "Routine",
          questionTextEn:
            "Centor/McIsaac criterion: is there tonsillar exudate or swelling visible on the tonsils?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Worth +1 point in the McIsaac score. Nurse should tally all criteria below before deciding disposition, per the published score bands (see final question).",
          redFlag: false,
          keywords: ["tonsillar exudate", "white patches", "swollen tonsils"],
          careAdviceIds: ["oscr-throat-tally-advice"],
          telemedicineEligible: true,
          telemedicineNotesEn: "Visual tonsil check is possible over video if camera quality allows.",
          dispositionLevel: 50,
          questionOrder: 1
        },
        {
          id: "oscr-throat-q2",
          acuityOrder: 3,
          severity: "Routine",
          questionTextEn: "Centor/McIsaac criterion: is there tender swelling of the front neck (anterior cervical) lymph nodes?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Worth +1 point in the McIsaac score.",
          redFlag: false,
          keywords: ["neck swelling", "tender lymph nodes", "swollen glands"],
          careAdviceIds: ["oscr-throat-tally-advice"],
          telemedicineEligible: true,
          dispositionLevel: 50,
          questionOrder: 2
        },
        {
          id: "oscr-throat-q3",
          acuityOrder: 4,
          severity: "Routine",
          questionTextEn: "Centor/McIsaac criterion: is there a measured or reported fever above 38C (100.4F)?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Worth +1 point in the McIsaac score.",
          redFlag: false,
          keywords: ["fever", "temperature above 38"],
          careAdviceIds: ["oscr-throat-tally-advice"],
          telemedicineEligible: true,
          dispositionLevel: 50,
          questionOrder: 3
        },
        {
          id: "oscr-throat-q4",
          acuityOrder: 5,
          severity: "Routine",
          questionTextEn: "Centor/McIsaac criterion: is cough ABSENT (no cough at all)?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Worth +1 point in the McIsaac score if cough is absent. Presence of cough scores 0 for this item.",
          redFlag: false,
          keywords: ["no cough", "absence of cough"],
          careAdviceIds: ["oscr-throat-tally-advice"],
          telemedicineEligible: true,
          dispositionLevel: 50,
          questionOrder: 4
        },
        {
          id: "oscr-throat-q5-tier",
          acuityOrder: 6,
          severity: "Self-care",
          questionTextEn:
            "After tallying age band (3-14: +1, 15-44: 0, 45+: -1) plus the four criteria above (max total 5): is the total score 1 or less?",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          rationaleEn:
            "Published McIsaac score bands: <=1 point (~1-2.5% strep risk) = no testing or antibiotics needed; 2 points = rapid strep test optional; 3 points = rapid strep test recommended; >=4 points = rapid strep test or empiric treatment per local policy. This system only automates the emergency floor; the nurse applies the actual score band using the tallied answers above.",
          redFlag: false,
          keywords: ["low score", "no red flags"],
          careAdviceIds: ["oscr-throat-selfcare-advice"],
          telemedicineEligible: true,
          dispositionLevel: 15,
          questionOrder: 1
        }
      ],
      careAdvice: [
        {
          id: "oscr-throat-emergency-advice",
          titleEn: "Emergency airway precautions",
          instructionTextEn: "Do not attempt to examine the throat further. Arrange emergency transport immediately.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["worsening breathing difficulty", "increasing drooling"],
          displayOrder: 1,
          adviceCategory: "DISPOSITION"
        },
        {
          id: "oscr-throat-tally-advice",
          titleEn: "Centor/McIsaac tally in progress",
          instructionTextEn:
            "Continue recording each criterion; the total score (with age adjustment) determines whether rapid strep testing or antibiotics are appropriate per the published score bands.",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          warningSigns: ["difficulty swallowing worsens", "new breathing difficulty"],
          displayOrder: 2,
          adviceCategory: "NOTE_TO_TRIAGER"
        },
        {
          id: "oscr-throat-selfcare-advice",
          titleEn: "Low Centor/McIsaac score - supportive care",
          instructionTextEn:
            "Warm salt-water gargles, fluids, over-the-counter pain relief per local policy, and rest. Most sore throats are viral and resolve without antibiotics.",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          warningSigns: ["difficulty swallowing develops", "high fever develops", "symptoms worsen after 3-5 days"],
          displayOrder: 3,
          adviceCategory: "CALL_BACK_IF",
          patientSendable: true
        }
      ],
      provenance: {
        generated: false,
        sourceKind: "open-source-clinical-decision-rule",
        sourceDocuments: [
          "Centor RM, Witherspoon JM, Dalton HP, et al. The diagnosis of strep throat in adults in the emergency room. Med Decis Making. 1981;1(3):239-246.",
          "McIsaac WJ, Kellner JD, Aufricht P, et al. Empirical validation of guidelines for the management of pharyngitis in children and adults. JAMA. 2004;291(13):1587-1595."
        ],
        contentNotice:
          "Derived from the published Centor score (Centor 1981) as modified by McIsaac (McIsaac 1998/2004) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use.",
        requiresClinicalValidation: true,
        licensedContentIncluded: false
      }
    },

    // ------------------------------------------------------------------
    // 3. CURB-65 - Lim WS et al., Thorax 2003;58:377-382. Additive point
    //    score; the Urea criterion is telephone-adapted since a lab value
    //    is not available by phone (documented explicitly below).
    // ------------------------------------------------------------------
    {
      id: "oscr-cough-fever-curb65",
      titleEn: "Cough With Fever (CURB-65 Pneumonia Severity)",
      clinicalDefinitionEn:
        "Community-acquired pneumonia severity/disposition assessment for a caller with cough and fever, adapted from the published CURB-65 score (Lim et al., 2003).",
      backgroundInfoEn:
        "CURB-65 is an ADDITIVE point score: Confusion, Urea (blood test - not available by phone, see telephone adaptation below), Respiratory rate, Blood pressure, and Age 65+ each contribute 1 point. The total determines outpatient vs. hospital-level care.",
      ageMin: 18,
      mode: "after-hours",
      patientGroup: "adult",
      acuity: 4,
      keywords: [
        { phrase: "cough", weight: 90 },
        { phrase: "cough with fever", weight: 100 },
        { phrase: "pneumonia symptoms", weight: 85 },
        { phrase: "chest infection", weight: 75 }
      ],
      initialAssessmentQuestions: [
        {
          id: "oscr-curb65-iaq1",
          sequence: 1,
          responseType: "DURATION",
          promptTextEn: "When did the cough and fever start?"
        },
        {
          id: "oscr-curb65-iaq2",
          sequence: 2,
          responseType: "TEMPERATURE",
          promptTextEn: "Have you measured a temperature? If so, what was it?"
        },
        {
          id: "oscr-curb65-iaq3",
          sequence: 3,
          responseType: "OPEN_TEXT",
          promptTextEn: "Are you bringing up any phlegm? What color is it?"
        }
      ],
      questions: [
        {
          id: "oscr-curb65-q0-emergency",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Is there severe difficulty breathing, blue lips, inability to speak in full sentences, or is the person confused or difficult to rouse?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn:
            "Universal emergency rule-out added ahead of CURB-65 itself (not part of the published score) - severe respiratory distress or altered consciousness requires immediate emergency care regardless of the point tally below.",
          redFlag: true,
          keywords: ["breathing difficulty", "blue lips", "cannot speak sentences", "confused"],
          careAdviceIds: ["oscr-curb65-emergency-advice"],
          telemedicineEligible: false,
          dispositionLevel: 100,
          questionOrder: 1
        },
        {
          id: "oscr-curb65-q1-confusion",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn: "CURB-65 criterion (C): is there any new confusion, even mild, that is not a baseline emergency red flag?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worth 1 point in CURB-65. Nurse should tally all 5 criteria before deciding disposition (see final question).",
          redFlag: false,
          keywords: ["confusion", "disorientation"],
          careAdviceIds: ["oscr-curb65-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 1
        },
        {
          id: "oscr-curb65-q2-urea",
          acuityOrder: 3,
          severity: "Urgent",
          questionTextEn:
            "CURB-65 criterion (U, telephone-adapted): does the caller have known kidney disease, or signs of significant dehydration (very little urination, extreme thirst, dizziness on standing)?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn:
            "TELEPHONE ADAPTATION: the published CURB-65 Urea criterion requires a blood test result (>19 mg/dL / >7 mmol/L) not available by phone. This substitutes a dehydration/kidney-history proxy and must be flagged as an approximation, not the validated criterion itself, when reviewed by clinical governance.",
          redFlag: false,
          keywords: ["kidney disease", "dehydration", "little urination"],
          careAdviceIds: ["oscr-curb65-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 2
        },
        {
          id: "oscr-curb65-q3-resprate",
          acuityOrder: 4,
          severity: "Urgent",
          questionTextEn:
            "CURB-65 criterion (R): coach the caller to count breaths for 30 seconds and double it - is the respiratory rate 30 or more per minute?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worth 1 point in CURB-65. Caller-coached counting is the standard tele-triage method for respiratory rate.",
          redFlag: false,
          keywords: ["fast breathing", "respiratory rate", "breathing quickly"],
          careAdviceIds: ["oscr-curb65-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 3
        },
        {
          id: "oscr-curb65-q4-bp",
          acuityOrder: 5,
          severity: "Urgent",
          questionTextEn:
            "CURB-65 criterion (B): if a home blood pressure monitor is available, is systolic BP under 90 or diastolic 60 or under? If none available, is the caller lightheaded or fainting when standing?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worth 1 point in CURB-65. Home BP reading preferred; lightheadedness on standing is a phone-adapted proxy when no monitor is available.",
          redFlag: false,
          keywords: ["low blood pressure", "lightheaded standing", "fainting"],
          careAdviceIds: ["oscr-curb65-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 4
        },
        {
          id: "oscr-curb65-q5-tier",
          acuityOrder: 6,
          severity: "Routine",
          questionTextEn: "After tallying the criteria above plus age 65 or older (1 point): is the total CURB-65 score 0 or 1?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn:
            "Published CURB-65 bands: 0-1 point (~1.5% mortality) = outpatient treatment appropriate; 2 points = consider hospitalization/observation; 3+ points (~22% mortality) = hospitalize, consider ICU at 4-5. This system automates only the emergency floor; the nurse applies the actual score band.",
          redFlag: false,
          keywords: ["low score", "mild symptoms"],
          careAdviceIds: ["oscr-curb65-outpatient-advice"],
          telemedicineEligible: true,
          dispositionLevel: 50,
          questionOrder: 1
        }
      ],
      careAdvice: [
        {
          id: "oscr-curb65-emergency-advice",
          titleEn: "Emergency respiratory precautions",
          instructionTextEn: "Keep the caller upright and calm. Arrange emergency transport immediately.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["worsening breathing", "blue lips or face", "unresponsive"],
          displayOrder: 1,
          adviceCategory: "DISPOSITION"
        },
        {
          id: "oscr-curb65-tally-advice",
          titleEn: "CURB-65 tally in progress",
          instructionTextEn: "Continue recording each criterion; the total score plus age determines outpatient vs. hospital-level care per the published bands.",
          dispositionCode: "HMC_URGENT_REVIEW",
          warningSigns: ["breathing worsens", "new confusion"],
          displayOrder: 2,
          adviceCategory: "NOTE_TO_TRIAGER"
        },
        {
          id: "oscr-curb65-outpatient-advice",
          titleEn: "Low CURB-65 score - outpatient care",
          instructionTextEn: "Fluids, rest, fever management per local policy, and follow-up with a clinician within 24-48 hours.",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          warningSigns: ["breathing becomes difficult", "fever does not improve in 48 hours", "confusion develops"],
          displayOrder: 3,
          adviceCategory: "CALL_BACK_IF",
          patientSendable: true
        }
      ],
      provenance: {
        generated: false,
        sourceKind: "open-source-clinical-decision-rule",
        sourceDocuments: [
          "Lim WS, van der Eerden MM, Laing R, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-382."
        ],
        contentNotice:
          "Derived from the published CURB-65 score (Lim et al., 2003) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format, with the Urea criterion telephone-adapted since a lab result is not available by phone (see rationale on that question). Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use, including explicit review of the telephone-adapted Urea substitution.",
        requiresClinicalValidation: true,
        licensedContentIncluded: false
      }
    },

    // ------------------------------------------------------------------
    // 4. Wells' Criteria for DVT - Wells PS et al., Lancet 1997;350:1795-98;
    //    NEJM 2003;349:1227-35. Additive point score with one subtractive
    //    criterion (alternative diagnosis at least as likely, -2).
    // ------------------------------------------------------------------
    {
      id: "oscr-leg-swelling-wells-dvt",
      titleEn: "Leg Swelling (Wells Criteria for DVT)",
      clinicalDefinitionEn:
        "Suspected deep vein thrombosis (DVT) risk assessment for a caller with leg swelling or pain, adapted from the published Wells' Criteria for DVT (Wells et al., 1997/2003).",
      backgroundInfoEn:
        "Wells' Criteria is an ADDITIVE point score (mostly +1 per criterion, with one -2 subtractive criterion for an equally-or-more-likely alternative diagnosis). Long-haul travel and prolonged immobility are recognized DVT risk factors relevant to aviation staff.",
      ageMin: 18,
      mode: "after-hours",
      patientGroup: "adult",
      acuity: 4,
      keywords: [
        { phrase: "leg swelling", weight: 100 },
        { phrase: "calf pain", weight: 90 },
        { phrase: "swollen leg", weight: 95 },
        { phrase: "suspected blood clot", weight: 85 },
        { phrase: "deep vein thrombosis", weight: 80 }
      ],
      initialAssessmentQuestions: [
        {
          id: "oscr-dvt-iaq1",
          sequence: 1,
          responseType: "LOCATION",
          promptTextEn: "Which leg is swollen or painful - one side or both?"
        },
        {
          id: "oscr-dvt-iaq2",
          sequence: 2,
          responseType: "DURATION",
          promptTextEn: "When did the swelling or pain start?"
        },
        {
          id: "oscr-dvt-iaq3",
          sequence: 3,
          responseType: "YES_NO",
          promptTextEn: "Have you had a long flight, long car trip, or period of bed rest recently?"
        }
      ],
      questions: [
        {
          id: "oscr-dvt-q0-emergency",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn: "Is there sudden severe shortness of breath, chest pain, or coughing up blood?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn:
            "Universal emergency rule-out added ahead of Wells' Criteria itself (not part of the published rule) - these are classic signs of pulmonary embolism, the dangerous complication of DVT, and require immediate emergency care.",
          redFlag: true,
          keywords: ["shortness of breath", "chest pain", "coughing blood"],
          careAdviceIds: ["oscr-dvt-emergency-advice"],
          telemedicineEligible: false,
          dispositionLevel: 100,
          questionOrder: 1
        },
        {
          id: "oscr-dvt-q1",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn: "Wells criterion: active cancer, or cancer treatment/palliation within the last 6 months?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worth +1 point in Wells' Criteria. Nurse should tally all criteria before deciding disposition (see final question).",
          redFlag: false,
          keywords: ["active cancer", "cancer treatment"],
          careAdviceIds: ["oscr-dvt-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 1
        },
        {
          id: "oscr-dvt-q2",
          acuityOrder: 3,
          severity: "Urgent",
          questionTextEn: "Wells criterion: bedridden for more than 3 days, or major surgery within the last 12 weeks?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worth +1 point in Wells' Criteria.",
          redFlag: false,
          keywords: ["bedridden", "recent surgery"],
          careAdviceIds: ["oscr-dvt-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 2
        },
        {
          id: "oscr-dvt-q3",
          acuityOrder: 4,
          severity: "Urgent",
          questionTextEn:
            "Wells criteria: is the calf more than 3cm bigger around than the other leg, is there swelling of the entire leg, or is there pitting edema only on the swollen side?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worth +1 point each for calf swelling >3cm, entire-leg swelling, and one-sided pitting edema in Wells' Criteria.",
          redFlag: false,
          keywords: ["calf swelling", "entire leg swollen", "pitting edema"],
          careAdviceIds: ["oscr-dvt-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 3
        },
        {
          id: "oscr-dvt-q4",
          acuityOrder: 5,
          severity: "Urgent",
          questionTextEn:
            "Wells criteria: visible collateral (non-varicose) surface veins, localized tenderness along the deep veins, previously documented DVT, or recent leg paralysis/cast immobilization?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worth +1 point each for collateral veins, deep-vein tenderness, prior DVT, and paralysis/immobilization in Wells' Criteria.",
          redFlag: false,
          keywords: ["collateral veins", "vein tenderness", "prior DVT", "leg cast"],
          careAdviceIds: ["oscr-dvt-tally-advice"],
          telemedicineEligible: false,
          dispositionLevel: 70,
          questionOrder: 4
        },
        {
          id: "oscr-dvt-q5-tier",
          acuityOrder: 6,
          severity: "Self-care",
          questionTextEn:
            "After tallying the criteria above (subtract 2 if an alternative diagnosis is at least as likely): is the total Wells score 0 or less?",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          rationaleEn:
            "Published Wells' Criteria bands: score <=0 = DVT unlikely (~5% prevalence); 1-2 = moderate risk (~17%); >=3 = DVT likely (17-53%). This system automates only the emergency floor; the nurse applies the actual score band and typically arranges D-dimer testing or ultrasound per local protocol for any non-zero-or-negative score.",
          redFlag: false,
          keywords: ["low score", "unlikely DVT"],
          careAdviceIds: ["oscr-dvt-selfcare-advice"],
          telemedicineEligible: true,
          dispositionLevel: 15,
          questionOrder: 1
        }
      ],
      careAdvice: [
        {
          id: "oscr-dvt-emergency-advice",
          titleEn: "Emergency pulmonary embolism precautions",
          instructionTextEn: "Keep the caller still and calm. Arrange emergency transport immediately.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["worsening breathlessness", "chest pain increases", "coughing blood"],
          displayOrder: 1,
          adviceCategory: "DISPOSITION"
        },
        {
          id: "oscr-dvt-tally-advice",
          titleEn: "Wells score tally in progress",
          instructionTextEn: "Continue recording each criterion; the total score determines the DVT probability tier and next diagnostic step (D-dimer vs. ultrasound) per local protocol.",
          dispositionCode: "HMC_URGENT_REVIEW",
          warningSigns: ["new shortness of breath", "chest pain develops"],
          displayOrder: 2,
          adviceCategory: "NOTE_TO_TRIAGER"
        },
        {
          id: "oscr-dvt-selfcare-advice",
          titleEn: "Low Wells score - DVT unlikely",
          instructionTextEn: "Elevate the leg when resting, stay hydrated, and move around periodically if travel-related immobility was a factor.",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          warningSigns: ["swelling worsens", "new shortness of breath or chest pain", "leg becomes very painful or discolored"],
          displayOrder: 3,
          adviceCategory: "CALL_BACK_IF",
          patientSendable: true
        }
      ],
      provenance: {
        generated: false,
        sourceKind: "open-source-clinical-decision-rule",
        sourceDocuments: [
          "Wells PS, Anderson DR, Bormanis J, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. Lancet. 1997;350(9094):1795-1798.",
          "Wells PS, Owen C, Doucette S, Fergusson D, Tran H. Does this patient have deep vein thrombosis? JAMA. 2006;295(2):199-207."
        ],
        contentNotice:
          "Derived from the published Wells' Criteria for DVT (Wells et al., 1997/2006) - a validated clinical decision rule, adapted into IST Health's STCC-shaped triage format. Not licensed Schmitt-Thompson (STCC) content. Requires local clinical governance validation before production use.",
        requiresClinicalValidation: true,
        licensedContentIncluded: false
      }
    }
  ]
};
