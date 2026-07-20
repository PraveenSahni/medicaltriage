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
      initialAssessmentQuestions: [
        {
          id: "chest-adult-iaq1",
          sequence: 1,
          responseType: "LOCATION",
          promptTextEn: "Where exactly is the chest pain or tightness?",
          clarificationPromptEn: "Please describe where you feel the pain or tightness.",
          emergencyKeywords: ["crushing", "center of chest", "spreading to arm", "spreading to jaw"]
        },
        {
          id: "chest-adult-iaq2",
          sequence: 2,
          responseType: "DURATION",
          promptTextEn: "When did it start, and is it constant or does it come and go?",
          emergencyKeywords: ["sudden", "constant", "more than five minutes"]
        },
        {
          id: "chest-adult-iaq3",
          sequence: 3,
          responseType: "PAIN_SCALE",
          promptTextEn: "On a scale from zero to ten, how severe is it now?",
          clarificationPromptEn: "Please give a number from zero to ten."
        }
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
      initialAssessmentQuestions: [
        {
          id: "fever-child-iaq1",
          sequence: 1,
          responseType: "TEMPERATURE",
          promptTextEn: "What is the highest temperature measured, and how was it measured?",
          clarificationPromptEn: "Please state the temperature and the method used."
        },
        {
          id: "fever-child-iaq2",
          sequence: 2,
          responseType: "DURATION",
          promptTextEn: "When did the fever start?"
        },
        {
          id: "fever-child-iaq3",
          sequence: 3,
          responseType: "OPEN_TEXT",
          promptTextEn: "How is the child breathing, drinking, and responding to you?",
          emergencyKeywords: ["difficult to wake", "not breathing", "blue", "seizure", "purple rash"]
        }
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
      initialAssessmentQuestions: [
        {
          id: "breathing-iaq1",
          sequence: 1,
          responseType: "DURATION",
          promptTextEn: "When did the breathing problem start, and was the onset sudden or gradual?",
          emergencyKeywords: ["sudden", "choking"]
        },
        {
          id: "breathing-iaq2",
          sequence: 2,
          responseType: "YES_NO",
          promptTextEn: "Can the caller speak a full sentence without stopping for breath?",
          clarificationPromptEn: "Can they speak a complete sentence, yes or no?",
          emergencyKeywords: ["cannot speak", "blue lips", "confused"]
        },
        {
          id: "breathing-iaq3",
          sequence: 3,
          responseType: "OPEN_TEXT",
          promptTextEn: "What other symptoms are present, such as chest pain, fever, wheezing, or swelling?",
          emergencyKeywords: ["chest pain", "fainting", "face swelling", "throat swelling"]
        }
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
      initialAssessmentQuestions: [
        {
          id: "abdominal-iaq1",
          sequence: 1,
          responseType: "LOCATION",
          promptTextEn: "Where does it hurt?",
          clarificationPromptEn: "Please describe the exact location of the abdominal pain."
        },
        {
          id: "abdominal-iaq2",
          sequence: 2,
          responseType: "OPEN_TEXT",
          promptTextEn: "Does the pain move or spread anywhere else, such as the chest or back?"
        },
        {
          id: "abdominal-iaq3",
          sequence: 3,
          responseType: "DURATION",
          promptTextEn: "When did the pain begin, and was the onset sudden or gradual?",
          emergencyKeywords: ["sudden", "worst pain", "collapsed"]
        },
        {
          id: "abdominal-iaq4",
          sequence: 4,
          responseType: "PAIN_SCALE",
          promptTextEn: "On a scale from zero to ten, how severe is the pain now?",
          clarificationPromptEn: "Please give a pain score from zero to ten."
        },
        {
          id: "abdominal-iaq5",
          sequence: 5,
          responseType: "OPEN_TEXT",
          promptTextEn: "What other symptoms are present, such as vomiting, fever, diarrhea, or blood?",
          emergencyKeywords: ["blood in vomit", "blood in stool", "fainting", "rigid abdomen"]
        }
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
      initialAssessmentQuestions: [
        {
          id: "rash-iaq1",
          sequence: 1,
          responseType: "LOCATION",
          promptTextEn: "Where is the rash or swelling, and is it spreading?"
        },
        {
          id: "rash-iaq2",
          sequence: 2,
          responseType: "DURATION",
          promptTextEn: "When did it start, and did it follow a medicine, vaccine, food, or other exposure?"
        },
        {
          id: "rash-iaq3",
          sequence: 3,
          responseType: "YES_NO",
          promptTextEn: "Is there any trouble breathing, throat tightness, fainting, or swelling of the face or lips?",
          emergencyKeywords: ["trouble breathing", "throat tightness", "fainting", "face swelling", "lip swelling"]
        }
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
    },
    {
      id: "sample-ankle-foot-injury",
      titleEn: "Ankle and Foot Injury",
      clinicalDefinitionEn:
        "Synthetic Phase 1 protocol for ankle, foot, sprain, and sport injury complaints. Replace with licensed STCC clinical content before production.",
      backgroundInfoEn:
        "The nurse starts with neurovascular, deformity, open wound, and weight-bearing red flags before lower-acuity sprain care.",
      mode: "both",
      keywords: [
        { phrase: "ankle injury", weight: 100 },
        { phrase: "foot injury", weight: 90 },
        { phrase: "twisted ankle", weight: 100 },
        { phrase: "sprain", weight: 85 },
        { phrase: "sport injury", weight: 80 },
        { phrase: "unable to walk", weight: 85 },
        { phrase: "swelling", weight: 70 }
      ],
      initialAssessmentQuestions: [
        {
          id: "ankle-foot-iaq1",
          sequence: 1,
          responseType: "OPEN_TEXT",
          promptTextEn: "Please describe how the ankle or foot injury happened."
        },
        {
          id: "ankle-foot-iaq2",
          sequence: 2,
          responseType: "YES_NO",
          promptTextEn: "Can the patient stand and take four steps?",
          clarificationPromptEn: "Can the patient take four steps, yes or no?"
        },
        {
          id: "ankle-foot-iaq3",
          sequence: 3,
          responseType: "OPEN_TEXT",
          promptTextEn: "Describe any swelling, bruising, deformity, numbness, or color change.",
          emergencyKeywords: ["bone visible", "blue foot", "cold foot", "no feeling", "uncontrolled bleeding"]
        }
      ],
      questions: [
        {
          id: "ankle-foot-q1",
          acuityOrder: 1,
          severity: "Emergency",
          questionTextEn:
            "Foot or ankle has severe deformity, open wound with bone visible, uncontrolled bleeding, numbness, cold/blue foot, or severe pain after major trauma?",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          rationaleEn: "Possible open fracture, vascular compromise, or severe trauma requires emergency assessment.",
          redFlag: true,
          keywords: ["deformity", "open wound", "bone", "bleeding", "numb", "cold", "blue", "major trauma"],
          careAdviceIds: ["ankle-foot-emergency-red-flag"]
        },
        {
          id: "ankle-foot-q2",
          acuityOrder: 2,
          severity: "Urgent",
          questionTextEn:
            "Unable to bear weight, severe swelling, marked bruising, worsening pain, or child will not walk after the injury?",
          dispositionCode: "HMC_URGENT_REVIEW",
          rationaleEn: "Weight-bearing failure or significant swelling requires urgent clinical review and possible imaging.",
          keywords: ["unable to bear weight", "cannot walk", "swelling", "bruising", "worsening", "child"],
          careAdviceIds: ["urgent-review-precautions", "ankle-foot-injury-care"]
        },
        {
          id: "ankle-foot-q3",
          acuityOrder: 3,
          severity: "Routine",
          questionTextEn:
            "Mild to moderate pain, swelling, or limp after twisting the ankle but able to walk and no neurovascular red flags?",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          rationaleEn: "Routine clinical review is appropriate after emergency and urgent features are ruled out.",
          keywords: ["twisting", "mild", "moderate", "limp", "able to walk", "no red flags"],
          careAdviceIds: ["ankle-foot-injury-care", "routine-review-precautions"]
        },
        {
          id: "ankle-foot-q4",
          acuityOrder: 4,
          severity: "Self-care",
          questionTextEn:
            "Minor twist with improving discomfort, normal walking, no swelling progression, and reliable callback precautions?",
          dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
          rationaleEn: "Self-care is limited to low-risk injury after higher-acuity questions are negative.",
          keywords: ["minor", "improving", "normal walking", "callback"],
          careAdviceIds: ["ankle-foot-injury-care"]
        }
      ],
      careAdvice: [
        {
          id: "ankle-foot-emergency-red-flag",
          titleEn: "Foot or ankle emergency precautions",
          instructionTextEn:
            "Escalate immediately when deformity, open wound, bleeding, numbness, cold/blue foot, or major trauma is present. Keep the patient from weight-bearing until assessed.",
          dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
          warningSigns: ["open wound", "cold or blue foot", "numbness", "severe deformity", "uncontrolled bleeding"]
        },
        {
          id: "ankle-foot-injury-care",
          titleEn: "Ankle or foot injury care advice",
          instructionTextEn:
            "Advise rest, protection from weight-bearing if painful, elevation, and callback if pain, swelling, numbness, color change, or walking ability worsens.",
          dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
          warningSigns: ["worsening pain", "increasing swelling", "numbness", "color change", "cannot walk"]
        }
      ]
    }
  ]
};
