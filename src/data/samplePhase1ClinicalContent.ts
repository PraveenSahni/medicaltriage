import type { ClinicalContentPackageInput } from "../types/clinicalContent.js";

export const samplePhase1ClinicalContent: ClinicalContentPackageInput = {
  release: {
    name: "IST Tech Phase 1 Synthetic Clinical Content",
    version: "2026.07-sample",
    sourceType: "synthetic-sample",
    region: "QA",
    mode: "both"
  },
  localizedDispositions: [
    {
      code: "SIDRA_PEDIATRIC_ED",
      destinationNameEn: "Sidra Medicine Emergency Department",
      routingNotesEn: "Use for pediatric emergency presentations after the safety floor is triggered.",
      region: "QA"
    },
    {
      code: "HMC_EMERGENCY_DEPARTMENT",
      destinationNameEn: "Nearest Hamad Medical Corporation Emergency Department",
      routingNotesEn: "Use for adult or general emergency presentations.",
      region: "QA"
    },
    {
      code: "HMC_URGENT_REVIEW",
      destinationNameEn: "HMC urgent review pathway",
      routingNotesEn: "Use for urgent but not immediately life-threatening presentations.",
      region: "QA"
    },
    {
      code: "IST_HIA_MIDFIELD_MEDICAL_CENTRE",
      destinationNameEn: "IST Medical Centre, HIA Midfield",
      routingNotesEn: "Use for IST staff clinical review, fit-to-fly checks, and sickness validation.",
      region: "QA"
    },
    {
      code: "PHCC_URGENT_CARE_OR_TELECONSULT",
      destinationNameEn: "PHCC urgent care or IST teleconsult",
      routingNotesEn: "Use for lower-acuity review after emergency and urgent red flags are ruled out.",
      region: "QA"
    },
    {
      code: "OUTSTATION_TELECONSULT_ESCALATION",
      destinationNameEn: "IST outstation teleconsult escalation",
      routingNotesEn: "Use when staff are outside Doha and need coordinated clinical and duty-status handling.",
      region: "QA"
    },
    {
      code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
      destinationNameEn: "Self-care with callback precautions",
      routingNotesEn: "Use only when higher acuity questions are negative and nurse review agrees.",
      region: "QA"
    }
  ],
  protocols: [
    {
      id: "sample-chest-pain-adult",
      titleEn: "Chest Pain or Tightness - Adult",
      clinicalDefinitionEn:
        "Synthetic Phase 1 protocol for routing adult chest pain complaints. Replace with licensed STCC clinical content before production.",
      backgroundInfoEn:
        "The checklist is ordered to rule out life-threatening symptoms before lower-acuity pathways.",
      ageMin: 18,
      mode: "both",
      keywords: [
        { phrase: "chest pain", weight: 100 },
        { phrase: "chest tightness", weight: 100 },
        { phrase: "sweating", weight: 85 },
        { phrase: "shortness of breath", weight: 90 },
        { phrase: "diaphoresis", weight: 85 },
        { phrase: "heart pain", weight: 70 }
      ],
      questions: [
        {
          id: "chest-adult-q1",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Chest pain or tightness with sweating, breathing difficulty, fainting, confusion, or pain spreading to arm, jaw, back, or shoulder?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn: "High-risk chest pain features keep the emergency safety floor active.",
          redFlag: true,
          keywords: ["chest", "tightness", "sweating", "breathing", "fainting", "jaw", "arm"],
          careAdviceIds: ["adult-emergency-red-flag"]
        },
        {
          id: "chest-adult-q2",
          acuityOrder: 2,
          severity: "Emergency",
          questionTextEn: "Severe constant chest pain lasting more than 5 minutes or recurring during the call?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn: "Persistent or recurrent severe chest pain requires emergency evaluation.",
          redFlag: true,
          keywords: ["severe", "constant", "recurring", "more than 5 minutes"],
          careAdviceIds: ["adult-emergency-red-flag"]
        },
        {
          id: "chest-adult-q3",
          acuityOrder: 3,
          severity: "Urgent",
          questionTextEn: "Mild chest discomfort with dizziness, palpitations, fever, cough, or recent exertion?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Concerning non-emergency chest symptoms require time-sensitive clinical review.",
          keywords: ["mild", "dizziness", "palpitations", "fever", "cough", "exertion"],
          careAdviceIds: ["urgent-review-precautions"]
        },
        {
          id: "chest-adult-q4",
          acuityOrder: 4,
          severity: "Routine",
          questionTextEn: "No red flags and discomfort appears related to strain, reflux, or a previously assessed condition?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Routine review remains available only after emergency and urgent items are negative.",
          keywords: ["strain", "reflux", "previously assessed"],
          careAdviceIds: ["routine-review-precautions"]
        }
      ],
      careAdvice: [
        {
          id: "adult-emergency-red-flag",
          titleEn: "Emergency chest symptom precautions",
          instructionTextEn:
            "Keep the caller on the line when possible, advise immediate emergency evaluation, and document the red flag that triggered the safety floor.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["worsening chest pain", "difficulty breathing", "fainting", "new confusion"]
        },
        {
          id: "urgent-review-precautions",
          titleEn: "Urgent review precautions",
          instructionTextEn:
            "Arrange urgent clinical review and provide callback precautions for worsening pain, breathing difficulty, fainting, or new weakness.",
          dispositionCode: "HMC_URGENT_REVIEW",
          warningSigns: ["worsening pain", "shortness of breath", "fainting"]
        },
        {
          id: "routine-review-precautions",
          titleEn: "Routine review precautions",
          instructionTextEn:
            "Route to routine clinical review or teleconsult after higher acuity symptoms have been ruled out by the nurse.",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          warningSigns: ["new red flags", "symptoms worsening", "new fever"]
        }
      ]
    },
    {
      id: "sample-fever-child",
      titleEn: "Fever - Child",
      clinicalDefinitionEn:
        "Synthetic Phase 1 pediatric fever protocol for demonstrating age-aware protocol routing.",
      ageMin: 0,
      ageMax: 17,
      mode: "both",
      keywords: [
        { phrase: "child fever", weight: 100 },
        { phrase: "baby fever", weight: 95 },
        { phrase: "high temperature", weight: 85 },
        { phrase: "febrile", weight: 75 },
        { phrase: "not drinking", weight: 80 }
      ],
      questions: [
        {
          id: "fever-child-q1",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Child is difficult to wake, has breathing difficulty, seizure, purple rash, stiff neck, or appears severely ill?",
          dispositionCode: "SIDRA_PEDIATRIC_ED",
          rationaleEn: "Pediatric fever plus systemic danger signs requires emergency routing.",
          redFlag: true,
          keywords: ["difficult to wake", "breathing", "seizure", "purple rash", "stiff neck"],
          careAdviceIds: ["pediatric-emergency-red-flag"]
        },
        {
          id: "fever-child-q2",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn:
            "Infant under 3 months with fever, child not drinking, persistent vomiting, dehydration signs, or fever over 40 C?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Young age, dehydration, or very high fever requires prompt clinician review.",
          keywords: ["under 3 months", "not drinking", "vomiting", "dehydration", "40"],
          careAdviceIds: ["urgent-review-precautions"]
        },
        {
          id: "fever-child-q3",
          acuityOrder: 3,
          severity: "Routine",
          questionTextEn: "Fever with cough, sore throat, ear pain, or mild rash but child is alert and drinking?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Common fever symptoms can route to routine review when red flags are negative.",
          keywords: ["cough", "sore throat", "ear pain", "rash", "alert", "drinking"],
          careAdviceIds: ["pediatric-fever-home-monitoring"]
        },
        {
          id: "fever-child-q4",
          acuityOrder: 4,
          severity: "Self-care",
          questionTextEn:
            "Mild fever, child is comfortable, drinking, breathing normally, and caregiver has clear callback precautions?",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          rationaleEn: "Self-care is limited to low-risk presentations with reliable caregiver follow-up.",
          keywords: ["mild fever", "comfortable", "drinking", "normal breathing"],
          careAdviceIds: ["pediatric-fever-home-monitoring"]
        }
      ],
      careAdvice: [
        {
          id: "pediatric-emergency-red-flag",
          titleEn: "Pediatric fever emergency precautions",
          instructionTextEn:
            "Escalate for emergency pediatric assessment and document the danger sign that triggered escalation.",
          dispositionCode: "SIDRA_PEDIATRIC_ED",
          warningSigns: ["hard to wake", "breathing difficulty", "seizure", "purple rash", "stiff neck"]
        },
        {
          id: "pediatric-fever-home-monitoring",
          titleEn: "Pediatric fever monitoring",
          instructionTextEn:
            "Confirm hydration, breathing, alertness, and caregiver ability to seek care if warning signs appear.",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          warningSigns: ["not drinking", "breathing difficulty", "worsening appearance", "persistent vomiting"]
        }
      ]
    },
    {
      id: "sample-breathing-problem",
      titleEn: "Breathing Problem",
      clinicalDefinitionEn:
        "Synthetic Phase 1 protocol for shortness of breath and breathing difficulty complaints.",
      mode: "both",
      keywords: [
        { phrase: "shortness of breath", weight: 100 },
        { phrase: "difficulty breathing", weight: 100 },
        { phrase: "wheezing", weight: 80 },
        { phrase: "oxygen saturation", weight: 85 },
        { phrase: "cannot speak", weight: 95 }
      ],
      questions: [
        {
          id: "breathing-q1",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Severe breathing difficulty, blue lips, unable to speak full sentences, confusion, or oxygen saturation below 90 percent?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn: "Severe respiratory compromise requires emergency routing.",
          redFlag: true,
          keywords: ["severe", "blue lips", "unable to speak", "confusion", "oxygen saturation"],
          careAdviceIds: ["breathing-emergency-red-flag"]
        },
        {
          id: "breathing-q2",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn:
            "Moderate shortness of breath, new wheeze, fever with breathing symptoms, or oxygen saturation below 94 percent?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Moderate respiratory symptoms require urgent clinical review.",
          keywords: ["moderate", "wheeze", "fever", "94"],
          careAdviceIds: ["urgent-review-precautions"]
        },
        {
          id: "breathing-q3",
          acuityOrder: 3,
          severity: "Routine",
          questionTextEn: "Mild cough or congestion with normal breathing and no high-risk features?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Mild respiratory symptoms can route lower after emergency symptoms are ruled out.",
          keywords: ["mild cough", "congestion", "normal breathing"],
          careAdviceIds: ["routine-review-precautions"]
        }
      ],
      careAdvice: [
        {
          id: "breathing-emergency-red-flag",
          titleEn: "Breathing emergency precautions",
          instructionTextEn:
            "Escalate immediately for emergency assessment when severe breathing difficulty or low oxygen saturation is reported.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["blue lips", "severe breathlessness", "confusion", "unable to speak"]
        }
      ]
    },
    {
      id: "sample-abdominal-pain",
      titleEn: "Abdominal Pain",
      clinicalDefinitionEn:
        "Synthetic Phase 1 protocol for abdominal pain search, acuity ordering, and care-advice linking.",
      mode: "both",
      keywords: [
        { phrase: "abdominal pain", weight: 100 },
        { phrase: "stomach pain", weight: 90 },
        { phrase: "belly pain", weight: 80 },
        { phrase: "vomiting", weight: 75 },
        { phrase: "severe pain", weight: 80 }
      ],
      questions: [
        {
          id: "abdominal-q1",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Severe constant abdominal pain, fainting, rigid abdomen, blood in vomit or stool, or pregnancy with severe pain?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn: "Severe abdominal red flags require emergency assessment.",
          redFlag: true,
          keywords: ["severe", "constant", "fainting", "rigid", "blood", "pregnancy"],
          careAdviceIds: ["adult-emergency-red-flag"]
        },
        {
          id: "abdominal-q2",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn:
            "Moderate pain with persistent vomiting, fever, dehydration, localized right lower pain, or worsening symptoms?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Progressive abdominal symptoms require urgent review.",
          keywords: ["moderate", "vomiting", "fever", "dehydration", "right lower", "worsening"],
          careAdviceIds: ["urgent-review-precautions"]
        },
        {
          id: "abdominal-q3",
          acuityOrder: 3,
          severity: "Routine",
          questionTextEn: "Mild cramping, suspected indigestion, or diarrhea without red flags?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Routine route is only available after the higher acuity checklist is negative.",
          keywords: ["mild", "cramping", "indigestion", "diarrhea"],
          careAdviceIds: ["routine-review-precautions"]
        }
      ],
      careAdvice: []
    },
    {
      id: "sample-rash-vaccine-reaction",
      titleEn: "Rash or Vaccination Reaction",
      clinicalDefinitionEn:
        "Synthetic Phase 1 protocol for rash, swelling, and vaccination reaction triage, including aviation follow-up context.",
      mode: "both",
      keywords: [
        { phrase: "rash", weight: 100 },
        { phrase: "vaccine reaction", weight: 90 },
        { phrase: "vaccination", weight: 90 },
        { phrase: "swelling", weight: 80 },
        { phrase: "itching", weight: 65 }
      ],
      questions: [
        {
          id: "rash-q1",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Rash with throat swelling, trouble breathing, fainting, widespread hives after exposure, or facial/lip swelling?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn: "Possible severe allergic reaction requires emergency routing.",
          redFlag: true,
          keywords: ["throat swelling", "trouble breathing", "fainting", "hives", "facial swelling"],
          careAdviceIds: ["allergy-emergency-red-flag"]
        },
        {
          id: "rash-q2",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn:
            "Rapidly spreading rash, fever with rash, painful swelling, eye involvement, or recent vaccination with worsening symptoms?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Worsening rash or vaccination reaction needs urgent review.",
          keywords: ["spreading", "fever", "painful swelling", "eye", "vaccination"],
          careAdviceIds: ["urgent-review-precautions"]
        },
        {
          id: "rash-q3",
          acuityOrder: 3,
          severity: "Routine",
          questionTextEn: "Localized mild rash, itching, or minor injection-site redness without red flags?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Mild localized rash can route lower after allergic-reaction red flags are negative.",
          keywords: ["localized", "mild", "itching", "injection site", "redness"],
          careAdviceIds: ["routine-review-precautions"]
        }
      ],
      careAdvice: [
        {
          id: "allergy-emergency-red-flag",
          titleEn: "Severe allergy precautions",
          instructionTextEn:
            "Escalate immediately for emergency assessment when airway, breathing, fainting, or facial swelling symptoms are present.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["throat swelling", "breathing difficulty", "fainting", "facial swelling"]
        }
      ]
    }
  ]
};
