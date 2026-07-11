import { randomUUID } from "node:crypto";
import { evaluateAviationRules } from "./aviationRules.js";
import { getClinicalProtocolById } from "./clinicalContent.js";
import { resolveDisposition } from "./dispositionRouter.js";
import { calculateTriageScore } from "./news2Scoring.js";
import { compileBilingualSoapSbarMarkdown } from "./triageNoteCompiler.js";
import {
  type AviationEvaluation,
  type DispositionCode,
  type DispositionDecision,
  type Severity,
  type StaffProfile,
  type TriageCalculateScoreRequest,
  type TriageEvaluationRequest,
  severityMax,
  severityRank
} from "../types/triage.js";

type SimulationRole = "Pilot" | "Cabin Crew" | "Ground Staff" | "Dependent" | "Operations";
type SimulationConsciousLevel = "A" | "V" | "P" | "U" | "alert" | "voice" | "pain" | "unresponsive";

export type SimulationVitals = {
  heartRate: number;
  respiratoryRate: number;
  spo2: number;
  temperatureC: number;
  consciousLevel: SimulationConsciousLevel;
};

export type SimulationPayload = {
  scenarioId?: string;
  name?: string;
  istStaffId: string;
  role: SimulationRole;
  ageYears: number;
  biologicalSex?: "female" | "male" | "other" | "unknown";
  dependentName?: string;
  symptomText: string;
  symptomVector?: number[];
  vitals: SimulationVitals;
  outstation?: boolean;
  stationCode?: string;
  onDuty?: boolean;
  sicknessLeaveRequested?: boolean;
  recentVaccinationHours?: number;
  occupationalOrCommissionVisit?: boolean;
  aiSuggestedSeverity?: Severity;
};

export type SimulationTransition = {
  stateId: number;
  stateName: string;
  output: Record<string, unknown>;
  consequence: string;
};

export type SimulationTrainingRow = {
  id: string;
  synthetic: true;
  purpose: "llm-evaluation-and-training";
  safetyNotice: string;
  input: Record<string, unknown>;
  expectedOutput: Record<string, unknown>;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
};

export type SimulationResult = {
  encounterId: string;
  synthetic: true;
  scenarioId: string;
  scenarioName: string;
  matchedProtocol: {
    codebookNode: string;
    protocolId?: string;
    titleEn: string;
    cosineSimilarity: number;
    accepted: boolean;
    threshold: number;
  };
  vitalScore: ReturnType<typeof calculateTriageScore>;
  aviation: AviationEvaluation;
  decision: DispositionDecision;
  finalSeverity: Severity;
  finalDispositionCode: DispositionCode;
  targetRoutingEndpoint: string;
  fitToFlyStatus: AviationEvaluation["fitToFlyStatus"];
  sbarNote: string;
  transitionLog: SimulationTransition[];
  trainingRow: SimulationTrainingRow;
};

type ProtocolAnchor = {
  node: string;
  protocolId: string;
  titleEn: string;
  vector: number[];
};

const VECTOR_THRESHOLD = 0.7;

const protocolAnchors: ProtocolAnchor[] = [
  {
    node: "ACUTE_CHEST_PAIN",
    protocolId: "sample-chest-pain-adult",
    titleEn: "Chest Pain or Tightness - Adult",
    vector: [0.95, 0.2, 0.1, 0.1, 0.1]
  },
  {
    node: "PEDIATRIC_RESPIRATORY",
    protocolId: "sample-breathing-problem",
    titleEn: "Shortness of Breath or Breathing Difficulty",
    vector: [0.12, 0.92, 0.05, 0.25, 0.08]
  },
  {
    node: "LOWER_BACK_PAIN",
    protocolId: "sample-abdominal-pain",
    titleEn: "Abdominal Pain or Back Pain",
    vector: [0.05, 0.06, 0.95, 0.08, 0.22]
  },
  {
    node: "VACCINE_REACTION",
    protocolId: "sample-rash-vaccine-reaction",
    titleEn: "Rash, Swelling, or Vaccination Reaction",
    vector: [0.08, 0.1, 0.2, 0.94, 0.18]
  },
  {
    node: "FEVER_CHILD",
    protocolId: "sample-fever-child",
    titleEn: "Fever - Child",
    vector: [0.08, 0.35, 0.06, 0.8, 0.12]
  }
];

export const simulationScenarios: SimulationPayload[] = [
  {
    scenarioId: "sim-cardiac-pilot-red",
    name: "Active pilot with chest pain and low oxygen saturation",
    istStaffId: "SIM-1001",
    role: "Pilot",
    ageYears: 44,
    biologicalSex: "male",
    symptomText: "Crushing chest pain, sweating, and shortness of breath before flight duty.",
    symptomVector: [0.98, 0.32, 0.02, 0.08, 0.05],
    vitals: {
      heartRate: 135,
      respiratoryRate: 28,
      spo2: 91,
      temperatureC: 36.8,
      consciousLevel: "A"
    },
    onDuty: true,
    sicknessLeaveRequested: true,
    aiSuggestedSeverity: "Routine"
  },
  {
    scenarioId: "sim-child-tachypnea-red",
    name: "Dependent child with cough and WHO pediatric tachypnea",
    istStaffId: "SIM-2009",
    role: "Dependent",
    dependentName: "Synthetic child dependent",
    ageYears: 3,
    biologicalSex: "male",
    symptomText: "Continuous barking cough, breathing difficulty, and grunting sounds.",
    symptomVector: [0.1, 0.94, 0.02, 0.2, 0.05],
    vitals: {
      heartRate: 110,
      respiratoryRate: 45,
      spo2: 96,
      temperatureC: 38.5,
      consciousLevel: "A"
    },
    aiSuggestedSeverity: "Urgent"
  },
  {
    scenarioId: "sim-cabin-back-pain-routine",
    name: "Cabin crew with stable lower back pain and fit-to-fly review",
    istStaffId: "SIM-7842",
    role: "Cabin Crew",
    ageYears: 29,
    biologicalSex: "female",
    symptomText: "Dull ache in lower back after lifting a galley cart, no numbness or weakness.",
    symptomVector: [0.02, 0.02, 0.96, 0.04, 0.12],
    vitals: {
      heartRate: 68,
      respiratoryRate: 14,
      spo2: 99,
      temperatureC: 36.6,
      consciousLevel: "A"
    },
    onDuty: true,
    sicknessLeaveRequested: true,
    aiSuggestedSeverity: "Self-care"
  },
  {
    scenarioId: "sim-vaccine-ground-homecare",
    name: "Ground staff with mild post-vaccination symptoms",
    istStaffId: "SIM-9901",
    role: "Ground Staff",
    ageYears: 33,
    biologicalSex: "unknown",
    symptomText: "Mandated booster yesterday, sore arm and slight fever without breathing symptoms.",
    symptomVector: [0.05, 0.05, 0.12, 0.9, 0.08],
    vitals: {
      heartRate: 82,
      respiratoryRate: 16,
      spo2: 98,
      temperatureC: 37.9,
      consciousLevel: "A"
    },
    recentVaccinationHours: 24,
    aiSuggestedSeverity: "Self-care"
  },
  {
    scenarioId: "sim-outstation-vomiting-urgent",
    name: "Outstation cabin crew with persistent vomiting and dizziness",
    istStaffId: "SIM-5510",
    role: "Cabin Crew",
    ageYears: 36,
    biologicalSex: "female",
    symptomText: "Persistent vomiting, dizziness, and weakness during an outstation layover.",
    vitals: {
      heartRate: 104,
      respiratoryRate: 18,
      spo2: 97,
      temperatureC: 37.3,
      consciousLevel: "A"
    },
    outstation: true,
    stationCode: "LHR",
    sicknessLeaveRequested: true,
    aiSuggestedSeverity: "Routine"
  },
  {
    scenarioId: "sim-unknown-low-similarity",
    name: "Unknown symptom wording below semantic threshold",
    istStaffId: "SIM-4300",
    role: "Operations",
    ageYears: 40,
    biologicalSex: "unknown",
    symptomText: "Employee asks a vague wellness question without a clear clinical complaint.",
    symptomVector: [0, 0, 0, 0, 0],
    vitals: {
      heartRate: 72,
      respiratoryRate: 16,
      spo2: 98,
      temperatureC: 36.8,
      consciousLevel: "A"
    },
    aiSuggestedSeverity: "Self-care"
  }
];

function normalizeConsciousLevel(value: SimulationConsciousLevel): TriageCalculateScoreRequest["consciousLevel"] {
  const normalized = value.toLowerCase();
  if (normalized === "a" || normalized === "alert") return "alert";
  if (normalized === "v" || normalized === "voice") return "voice";
  if (normalized === "p" || normalized === "pain") return "pain";
  return "unresponsive";
}

function roleToCrewRole(role: SimulationRole): TriageEvaluationRequest["aviationContext"]["crewRole"] {
  if (role === "Pilot") return "flight_deck";
  if (role === "Cabin Crew") return "cabin_crew";
  if (role === "Ground Staff" || role === "Operations") return "ground_staff";
  if (role === "Dependent") return "dependent";
  return "other";
}

function roleToDepartment(role: SimulationRole): string {
  if (role === "Pilot" || role === "Cabin Crew") return "Flight Operations";
  if (role === "Ground Staff") return "Ground Services";
  if (role === "Operations") return "Airport Operations";
  return "Employee Dependents";
}

function syntheticProfile(payload: SimulationPayload): StaffProfile {
  return {
    id: `synthetic_${payload.istStaffId.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
    istStaffId: payload.istStaffId,
    department: roleToDepartment(payload.role),
    jobTitle: payload.role === "Dependent" ? "Employee sponsor" : payload.role,
    dutyStatus: payload.outstation ? "on-leave" : "active",
    insuranceProvider: "Synthetic IST Staff Health Plan",
    insuranceEligibilityStatus: "eligible",
    insuranceLastChecked: "2026-07-01T08:00:00.000Z",
    dependents:
      payload.role === "Dependent"
        ? [
            {
              id: "synthetic_dependent",
              relationshipType: "child",
              age: payload.ageYears,
              biologicalSex: payload.biologicalSex ?? "unknown"
            }
          ]
        : []
  };
}

function dot(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
}

function norm(vector: number[]): number {
  return Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
}

export function cosineSimilarity(left: number[], right: number[]): number {
  const denominator = norm(left) * norm(right);
  if (denominator === 0) {
    return 0;
  }

  return dot(left, right) / denominator;
}

function textIncludesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function vectorizeSymptomText(text: string): number[] {
  const normalized = text.toLowerCase();
  const vector = [0, 0, 0, 0, 0];

  if (textIncludesAny(normalized, ["chest", "tight", "sweat", "palpitation", "heart"])) {
    vector[0] += 1;
  }

  if (textIncludesAny(normalized, ["cough", "breath", "wheeze", "grunting", "oxygen"])) {
    vector[1] += 1;
  }

  if (textIncludesAny(normalized, ["back", "lift", "numb", "weakness", "muscle"])) {
    vector[2] += 1;
  }

  if (textIncludesAny(normalized, ["vaccine", "booster", "fever", "rash", "swelling", "immunization"])) {
    vector[3] += 1;
  }

  if (textIncludesAny(normalized, ["abdomen", "abdominal", "vomit", "diarrhea", "stomach"])) {
    vector[4] += 1;
  }

  const magnitude = norm(vector);
  return magnitude === 0 ? vector : vector.map((value) => value / magnitude);
}

function vectorMatch(payload: SimulationPayload) {
  const inputVector = payload.symptomVector ?? vectorizeSymptomText(payload.symptomText);
  let best = protocolAnchors[0];
  let max = -1;

  for (const anchor of protocolAnchors) {
    const score = cosineSimilarity(inputVector, anchor.vector);
    if (score > max) {
      max = score;
      best = anchor;
    }
  }

  if (max < VECTOR_THRESHOLD) {
    return {
      inputVector,
      codebookNode: "UNKNOWN_SYMPTOM",
      protocolId: undefined,
      titleEn: "No Guideline Available",
      cosineSimilarity: Number(max.toFixed(4)),
      accepted: false,
      threshold: VECTOR_THRESHOLD
    };
  }

  const protocol = getClinicalProtocolById(best.protocolId);
  return {
    inputVector,
    codebookNode: best.node,
    protocolId: best.protocolId,
    titleEn: protocol?.titleEn ?? best.titleEn,
    cosineSimilarity: Number(max.toFixed(4)),
    accepted: true,
    threshold: VECTOR_THRESHOLD
  };
}

function scoreSeverityToTriageSeverity(severity: ReturnType<typeof calculateTriageScore>["severity"]): Severity {
  if (severity === "EMERGENCY") return "Emergency";
  if (severity === "URGENT") return "Urgent";
  if (severity === "ROUTINE") return "Routine";
  return "Self-care";
}

function durationMinutesFor(text: string): number {
  const normalized = text.toLowerCase();
  if (normalized.includes("hour") || normalized.includes("yesterday")) return 90;
  if (normalized.includes("days")) return 24 * 60;
  return 20;
}

function likelySelectedQuestionIds(protocolId: string | undefined, text: string): string[] {
  if (!protocolId) {
    return [];
  }

  const protocol = getClinicalProtocolById(protocolId);
  if (!protocol) {
    return [];
  }

  const normalized = text.toLowerCase();
  return protocol.questions
    .filter((question) => question.keywords.some((keyword) => normalized.includes(keyword.toLowerCase())))
    .slice(0, 2)
    .map((question) => question.id);
}

function buildEvaluationRequest(payload: SimulationPayload, protocolId?: string): TriageEvaluationRequest {
  return {
    istStaffId: payload.istStaffId,
    dependentId: payload.role === "Dependent" ? "synthetic_dependent" : undefined,
    nurseId: "simulation-engine",
    protocolId,
    selectedQuestionIds: likelySelectedQuestionIds(protocolId, payload.symptomText),
    aiRecommendationSeverity: payload.aiSuggestedSeverity,
    nurseOverrideRationale: payload.aiSuggestedSeverity
      ? "Synthetic comparison between advisory AI suggestion and deterministic safety floor."
      : undefined,
    symptoms: {
      chiefComplaint: payload.symptomText,
      narrative: payload.symptomText,
      language: "en",
      ageYears: payload.ageYears,
      biologicalSex: payload.biologicalSex,
      durationMinutes: durationMinutesFor(payload.symptomText),
      redFlags: [],
      vitals: {
        temperatureC: payload.vitals.temperatureC,
        heartRate: payload.vitals.heartRate,
        oxygenSaturation: payload.vitals.spo2
      }
    },
    aviationContext: {
      crewRole: roleToCrewRole(payload.role),
      onDuty: payload.onDuty,
      outstation: payload.outstation,
      stationCode: payload.stationCode,
      sicknessLeaveRequested: payload.sicknessLeaveRequested,
      recentVaccinationHours: payload.recentVaccinationHours,
      occupationalOrCommissionVisit: payload.occupationalOrCommissionVisit
    }
  };
}

function scoreBasedDecision(score: ReturnType<typeof calculateTriageScore>): Pick<DispositionDecision, "dispositionCode" | "destinationName" | "destinationRationale"> {
  return {
    dispositionCode: score.dispositionCode,
    destinationName: score.destinationName,
    destinationRationale: score.routingRationale
  };
}

function chooseDecision(
  score: ReturnType<typeof calculateTriageScore>,
  decision: DispositionDecision
): { finalSeverity: Severity; route: Pick<DispositionDecision, "dispositionCode" | "destinationName" | "destinationRationale"> } {
  const scoreSeverity = scoreSeverityToTriageSeverity(score.severity);
  const finalSeverity = severityMax(scoreSeverity, decision.severity);

  if (score.redAlertTriggered || severityRank[scoreSeverity] > severityRank[decision.severity]) {
    return {
      finalSeverity,
      route: scoreBasedDecision(score)
    };
  }

  return {
    finalSeverity,
    route: {
      dispositionCode: decision.dispositionCode,
      destinationName: decision.destinationName,
      destinationRationale: decision.destinationRationale
    }
  };
}

function transition(
  stateId: number,
  stateName: string,
  output: Record<string, unknown>,
  consequence: string
): SimulationTransition {
  return { stateId, stateName, output, consequence };
}

function trainingMessages(args: {
  payload: SimulationPayload;
  result: Omit<SimulationResult, "trainingRow">;
}): SimulationTrainingRow["messages"] {
  return [
    {
      role: "system",
      content:
        "You are an IST Tech tele-triage AI copilot. You may explain, summarize, and draft, but deterministic clinical rules and nurse approval control disposition."
    },
    {
      role: "user",
      content: JSON.stringify(
        {
          synthetic: true,
          symptomText: args.payload.symptomText,
          role: args.payload.role,
          ageYears: args.payload.ageYears,
          vitals: args.payload.vitals,
          aviation: {
            outstation: args.payload.outstation,
            onDuty: args.payload.onDuty,
            sicknessLeaveRequested: args.payload.sicknessLeaveRequested,
            recentVaccinationHours: args.payload.recentVaccinationHours
          }
        },
        null,
        2
      )
    },
    {
      role: "assistant",
      content: JSON.stringify(
        {
          matchedProtocol: args.result.matchedProtocol.titleEn,
          safetyFloorTriggered: args.result.vitalScore.redAlertTriggered,
          finalSeverity: args.result.finalSeverity,
          dispositionCode: args.result.finalDispositionCode,
          targetRoutingEndpoint: args.result.targetRoutingEndpoint,
          fitToFlyStatus: args.result.fitToFlyStatus,
          humanInLoopRequired: true,
          rationale:
            "Disposition is controlled by deterministic simulation rules. AI output is advisory and requires nurse review."
        },
        null,
        2
      )
    }
  ];
}

export function runSimulation(payload: SimulationPayload): SimulationResult {
  const encounterId = `sim-${randomUUID()}`;
  const scenarioId = payload.scenarioId ?? encounterId;
  const scenarioName = payload.name ?? "Synthetic triage simulation scenario";
  const staffProfile = syntheticProfile(payload);
  const transitionLog: SimulationTransition[] = [];

  transitionLog.push(
    transition(
      0,
      "Patient Ingestion",
      {
        istStaffId: payload.istStaffId,
        role: payload.role,
        ageYears: payload.ageYears,
        symptomText: payload.symptomText,
        synthetic: true
      },
      "Synthetic caller payload was accepted. Proceeding to semantic protocol matching."
    )
  );

  const matched = vectorMatch(payload);
  const protocolId = matched.accepted ? matched.protocolId : undefined;

  transitionLog.push(
    transition(
      1,
      "Semantic Vector Match",
      {
        codebookNode: matched.codebookNode,
        cosineSimilarity: matched.cosineSimilarity,
        accepted: matched.accepted,
        threshold: matched.threshold,
        protocolId,
        protocolTitle: protocolId ? getClinicalProtocolById(protocolId)?.titleEn : "No Guideline Available"
      },
      matched.accepted
        ? "Vector similarity met the threshold. The matched protocol can seed the branching checklist."
        : "Vector similarity was below threshold. The simulator marks this as a safety-net match and relies on nurse review."
    )
  );

  const vitalScore = calculateTriageScore({
    heartRate: payload.vitals.heartRate,
    respiratoryRate: payload.vitals.respiratoryRate,
    spo2: payload.vitals.spo2,
    temperatureC: payload.vitals.temperatureC,
    consciousLevel: normalizeConsciousLevel(payload.vitals.consciousLevel),
    ageYears: payload.ageYears
  });

  transitionLog.push(
    transition(
      2,
      "WHO/IITT Safety Floor",
      {
        overrideTriggered: vitalScore.redAlertTriggered,
        score: vitalScore.score,
        riskBand: vitalScore.riskBand,
        matchedRules: vitalScore.trace.filter((item) => item.matched).map((item) => item.ruleId)
      },
      vitalScore.redAlertTriggered
        ? "Mandatory RED floor triggered. NEWS2 and AI suggestions cannot downgrade emergency routing."
        : "No mandatory RED floor triggered. Proceeding to NEWS2 stable vital scoring."
    )
  );

  if (!vitalScore.redAlertTriggered) {
    transitionLog.push(
      transition(
        3,
        "NEWS2 Scoring",
        {
          news2: vitalScore.news2,
          score: vitalScore.score,
          riskBand: vitalScore.riskBand,
          severity: vitalScore.severity
        },
        "Objective vital-score band was calculated. Proceeding to aviation occupational gates."
      )
    );
  }

  const evaluationRequest = buildEvaluationRequest(payload, protocolId);
  const aviation = evaluateAviationRules(evaluationRequest, staffProfile);
  transitionLog.push(
    transition(
      4,
      "Aviation Occupational Gate",
      {
        crewRole: evaluationRequest.aviationContext.crewRole,
        fitToFlyStatus: aviation.fitToFlyStatus,
        outstationEscalationRequired: aviation.outstationEscalationRequired,
        tags: aviation.tags
      },
      "Aviation context was evaluated for fit-to-fly, outstation, sickness, and vaccination constraints."
    )
  );

  const dispositionDecision = resolveDisposition(evaluationRequest, staffProfile, aviation);
  const chosen = chooseDecision(vitalScore, dispositionDecision);
  const decision: DispositionDecision = {
    ...dispositionDecision,
    severity: chosen.finalSeverity,
    dispositionCode: chosen.route.dispositionCode,
    destinationName: chosen.route.destinationName,
    destinationRationale: chosen.route.destinationRationale,
    safetyFloorApplied: vitalScore.redAlertTriggered || dispositionDecision.safetyFloorApplied,
    trace: [...vitalScore.trace, ...dispositionDecision.trace]
  };

  const sbarNote = compileBilingualSoapSbarMarkdown({
    encounterId,
    istStaffId: payload.istStaffId,
    patientName: payload.dependentName ?? "Synthetic employee",
    patientAgeYears: payload.ageYears,
    nurseId: "simulation-engine",
    chiefComplaint: payload.symptomText,
    subjective: payload.symptomText,
    objective: `HR ${payload.vitals.heartRate}, RR ${payload.vitals.respiratoryRate}, SpO2 ${payload.vitals.spo2}, Temp ${payload.vitals.temperatureC}, AVPU ${payload.vitals.consciousLevel}.`,
    assessment: `${chosen.finalSeverity} severity. Score ${vitalScore.score}.`,
    recommendation: decision.destinationName,
    finalDispositionCode: decision.dispositionCode,
    routingDestination: decision.destinationName,
    safetyRationale: decision.destinationRationale,
    vitals: {
      heartRate: payload.vitals.heartRate,
      respiratoryRate: payload.vitals.respiratoryRate,
      spo2: payload.vitals.spo2,
      temperatureC: payload.vitals.temperatureC,
      consciousLevel: normalizeConsciousLevel(payload.vitals.consciousLevel),
      ageYears: payload.ageYears
    },
    customAviationTags: aviation.tags
  });

  transitionLog.push(
    transition(
      5,
      "Localized Routing & Documentation",
      {
        encounterId,
        finalSeverity: chosen.finalSeverity,
        dispositionCode: decision.dispositionCode,
        targetRoutingEndpoint: decision.destinationName,
        sbarRendered: true
      },
      "Localized routing and bilingual SBAR output were generated for nurse review and clipboard handoff."
    )
  );

  const partialResult = {
    encounterId,
    synthetic: true as const,
    scenarioId,
    scenarioName,
    matchedProtocol: {
      codebookNode: matched.codebookNode,
      protocolId,
      titleEn: protocolId ? getClinicalProtocolById(protocolId)?.titleEn ?? matched.titleEn : matched.titleEn,
      cosineSimilarity: matched.cosineSimilarity,
      accepted: matched.accepted,
      threshold: matched.threshold
    },
    vitalScore,
    aviation,
    decision,
    finalSeverity: chosen.finalSeverity,
    finalDispositionCode: decision.dispositionCode,
    targetRoutingEndpoint: decision.destinationName,
    fitToFlyStatus: aviation.fitToFlyStatus,
    sbarNote,
    transitionLog
  };

  const trainingRow: SimulationTrainingRow = {
    id: encounterId,
    synthetic: true,
    purpose: "llm-evaluation-and-training",
    safetyNotice:
      "Synthetic scenario only. Use for prompt evaluation, AI copilot testing, and governed model training. Do not use as clinical truth or PHI.",
    input: {
      scenarioId,
      scenarioName,
      symptomText: payload.symptomText,
      role: payload.role,
      ageYears: payload.ageYears,
      vitals: payload.vitals
    },
    expectedOutput: {
      matchedProtocol: partialResult.matchedProtocol,
      finalSeverity: partialResult.finalSeverity,
      finalDispositionCode: partialResult.finalDispositionCode,
      targetRoutingEndpoint: partialResult.targetRoutingEndpoint,
      fitToFlyStatus: partialResult.fitToFlyStatus,
      safetyFloorTriggered: partialResult.vitalScore.redAlertTriggered
    },
    messages: trainingMessages({ payload, result: partialResult })
  };

  return {
    ...partialResult,
    trainingRow
  };
}

export function runSimulationSuite(): SimulationResult[] {
  return simulationScenarios.map((scenario) => runSimulation(scenario));
}

export function simulationTrainingJsonl(): string {
  return runSimulationSuite()
    .map((result) => JSON.stringify(result.trainingRow))
    .join("\n");
}
