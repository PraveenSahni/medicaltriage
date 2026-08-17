type ExpectedStatus = "PREPARED" | "AMBIGUOUS" | "NO_MATCH";

type MatrixCase = {
  id: string;
  protocolId: string;
  category: "CLEAR" | "SYNONYM" | "NEGATION" | "AMBIGUOUS" | "NO_MATCH";
  narrative: string;
  expectedStatus: ExpectedStatus;
  expectedPrimary?: string;
  biologicalSex?: "male" | "female";
};

const protocols = {
  abdominal: "stcc-abdominal-pain-male",
  diarrhea: "stcc-diarrhea",
  pregnancy: "stcc-pregnancy-decreased-or-abnormal-fetal-movement",
  anklePain: "stcc-ankle-pain",
  ankleInjury: "stcc-ankle-injury"
} as const;

const matrix: MatrixCase[] = [
  { id: "ABD-CLEAR", protocolId: protocols.abdominal, category: "CLEAR", narrative: "Severe abdominal pain and stomach pain with epigastric pain for two hours.", expectedStatus: "PREPARED", expectedPrimary: protocols.abdominal, biologicalSex: "male" },
  { id: "DIA-CLEAR", protocolId: protocols.diarrhea, category: "CLEAR", narrative: "Watery diarrhea with repeated loose bowel movements today.", expectedStatus: "PREPARED", expectedPrimary: protocols.diarrhea },
  { id: "PREG-CLEAR", protocolId: protocols.pregnancy, category: "CLEAR", narrative: "Pregnant caller reports decreased fetal movement and the baby moving much less today.", expectedStatus: "PREPARED", expectedPrimary: protocols.pregnancy, biologicalSex: "female" },
  { id: "ANKP-CLEAR", protocolId: protocols.anklePain, category: "CLEAR", narrative: "Aching ankle joint pain from arthritis and bursitis without injury.", expectedStatus: "PREPARED", expectedPrimary: protocols.anklePain },
  { id: "ANKI-CLEAR", protocolId: protocols.ankleInjury, category: "CLEAR", narrative: "Broken ankle fracture after trauma with deformity.", expectedStatus: "PREPARED", expectedPrimary: protocols.ankleInjury },

  { id: "ABD-SYN", protocolId: protocols.abdominal, category: "SYNONYM", narrative: "Severe stomach ache with abdomen cramps and bloating.", expectedStatus: "PREPARED", expectedPrimary: protocols.abdominal, biologicalSex: "male" },
  { id: "DIA-SYN", protocolId: protocols.diarrhea, category: "SYNONYM", narrative: "Frequent loose stools and urgent bowel motions since morning.", expectedStatus: "PREPARED", expectedPrimary: protocols.diarrhea },
  { id: "PREG-SYN", protocolId: protocols.pregnancy, category: "SYNONYM", narrative: "The baby has stopped kicking and movements are reduced in pregnancy.", expectedStatus: "PREPARED", expectedPrimary: protocols.pregnancy, biologicalSex: "female" },
  { id: "ANKP-SYN", protocolId: protocols.anklePain, category: "SYNONYM", narrative: "Ankle pain from arthritis and bursitis without injury.", expectedStatus: "PREPARED", expectedPrimary: protocols.anklePain },
  { id: "ANKI-SYN", protocolId: protocols.ankleInjury, category: "SYNONYM", narrative: "Ankle injury with broken bone and fracture after a fall.", expectedStatus: "PREPARED", expectedPrimary: protocols.ankleInjury },

  { id: "ABD-NEG", protocolId: protocols.abdominal, category: "NEGATION", narrative: "No abdominal pain and no stomach ache; calling about a headache.", expectedStatus: "NO_MATCH", biologicalSex: "male" },
  { id: "DIA-NEG", protocolId: protocols.diarrhea, category: "NEGATION", narrative: "No diarrhea and no loose stool; bowel movements are normal.", expectedStatus: "NO_MATCH" },
  { id: "PREG-NEG", protocolId: protocols.pregnancy, category: "NEGATION", narrative: "No reduced fetal movement; the baby is moving normally.", expectedStatus: "NO_MATCH", biologicalSex: "female" },
  { id: "ANKP-NEG", protocolId: protocols.anklePain, category: "NEGATION", narrative: "No ankle pain and no joint pain; requesting routine information.", expectedStatus: "NO_MATCH" },
  { id: "ANKI-NEG", protocolId: protocols.ankleInjury, category: "NEGATION", narrative: "No ankle injury, no fracture and no trauma; walking normally.", expectedStatus: "NO_MATCH" },

  { id: "ABD-AMB", protocolId: protocols.abdominal, category: "AMBIGUOUS", narrative: "Abdominal pain and ankle pain started together.", expectedStatus: "AMBIGUOUS", biologicalSex: "male" },
  { id: "DIA-AMB", protocolId: protocols.diarrhea, category: "AMBIGUOUS", narrative: "Diarrhea and abdominal pain are equally concerning.", expectedStatus: "AMBIGUOUS" },
  { id: "PREG-AMB", protocolId: protocols.pregnancy, category: "AMBIGUOUS", narrative: "Baby movement concern and diarrhea began together.", expectedStatus: "AMBIGUOUS", biologicalSex: "female" },
  { id: "ANKP-AMB", protocolId: protocols.anklePain, category: "AMBIGUOUS", narrative: "Sprained ankle twisted and swollen.", expectedStatus: "AMBIGUOUS" },
  { id: "ANKI-AMB", protocolId: protocols.ankleInjury, category: "AMBIGUOUS", narrative: "Sprained ankle twisted and swollen.", expectedStatus: "AMBIGUOUS" },

  { id: "ABD-NONE", protocolId: protocols.abdominal, category: "NO_MATCH", narrative: "Requesting a replacement access badge.", expectedStatus: "NO_MATCH", biologicalSex: "male" },
  { id: "DIA-NONE", protocolId: protocols.diarrhea, category: "NO_MATCH", narrative: "Needs help updating a telephone number.", expectedStatus: "NO_MATCH" },
  { id: "PREG-NONE", protocolId: protocols.pregnancy, category: "NO_MATCH", narrative: "Calling to confirm tomorrow's appointment time.", expectedStatus: "NO_MATCH", biologicalSex: "female" },
  { id: "ANKP-NONE", protocolId: protocols.anklePain, category: "NO_MATCH", narrative: "Asking where to collect an identity card.", expectedStatus: "NO_MATCH" },
  { id: "ANKI-NONE", protocolId: protocols.ankleInjury, category: "NO_MATCH", narrative: "General enquiry with no medical symptom reported.", expectedStatus: "NO_MATCH" }
];

describe("PR-015 five-protocol adversarial auto-match matrix", () => {
  let searchClinicalProtocols: typeof import("../src/services/clinicalContent.js").searchClinicalProtocols;
  let classifyProtocolSuggestions: typeof import("../src/services/queueOrchestration.js").classifyProtocolSuggestions;

  beforeAll(async () => {
    process.env.CLINICAL_CONTENT_SOURCE = "stcc-licensed";
    process.env.APP_ENVIRONMENT = "demo";
    jest.resetModules();
    ({ searchClinicalProtocols } = await import("../src/services/clinicalContent.js"));
    ({ classifyProtocolSuggestions } = await import("../src/services/queueOrchestration.js"));
  });

  test("matrix contains five cases for each of exactly five licensed protocols", () => {
    expect(matrix).toHaveLength(25);
    expect(new Set(matrix.map((item) => item.protocolId)).size).toBe(5);
    for (const protocolId of Object.values(protocols)) expect(matrix.filter((item) => item.protocolId === protocolId)).toHaveLength(5);
  });

  test.each(matrix)("$id $category -> $expectedStatus", (item) => {
    const results = searchClinicalProtocols({
      q: item.narrative,
      ageYears: item.protocolId === protocols.pregnancy ? 30 : 36,
      biologicalSex: item.biologicalSex,
      mode: "both",
      limit: 5
    });
    const suggestions = results.map((result) => ({
      protocolId: result.id,
      titleEn: result.titleEn,
      score: result.score,
      matchedTerms: result.matchedTerms,
      highestSeverity: result.highestSeverity,
      questionCount: result.questionCount,
      releaseVersion: result.releaseVersion
    }));
    const classification = classifyProtocolSuggestions(suggestions);

    expect(classification.status).toBe(item.expectedStatus);
    if (item.expectedPrimary) expect(classification.primarySuggestion?.protocolId).toBe(item.expectedPrimary);
    else expect(classification.primarySuggestion).toBeUndefined();
  });
});
