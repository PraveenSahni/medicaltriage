import { createHash } from "node:crypto";
import type {
  QueueClinicalStage,
  QueuePreparedProtocolDto,
  QueueProtocolSuggestionDto,
  RagShadowSuggestionDto,
  StccProcessSnapshotDto,
  StccProcessStepDto,
  StccProcessStepStatus,
  StccVisibleActionTab
} from "../types/queue.js";

type StccProcessInput = {
  status: "INCOMING" | "IN_PROCESS" | "INFO_REQUIRED" | "COMPLETED";
  currentStage: QueueClinicalStage;
  reasonNarrative?: string;
  preparedProtocol?: QueuePreparedProtocolDto;
  vitals?: unknown;
  matchedProtocolId?: string;
  dispositionCode?: string;
  clinicalApproval?: Record<string, unknown>;
  sbarCopied: boolean;
  identityValidated: boolean;
  safetyFloorActive: boolean;
};

type RagShadowInput = {
  reasonNarrative: string;
  sourceType: RagShadowSuggestionDto["sourceType"];
  releaseVersion: string;
  deterministicSuggestions: QueueProtocolSuggestionDto[];
  deterministicPrimaryProtocolId?: string;
  preparedAtIso: string;
};

const visibleActionTabs: StccProcessSnapshotDto["visibleActionTabs"] = [
  {
    id: "REASON_AND_EMERGENCY_RULE_OUT",
    label: "Reason and Emergency Rule-Out",
    mappedStepIds: ["OPENING_SCRIPT", "REASON_FOR_VISIT", "GUIDELINE_SELECTION", "INITIAL_ASSESSMENT_QUESTIONS"]
  },
  {
    id: "QUESTIONS",
    label: "Questions",
    mappedStepIds: ["INITIAL_ASSESSMENT_QUESTIONS", "TRIAGE_ASSESSMENT_QUESTIONS", "TELEMEDICINE_ELIGIBLE"]
  },
  {
    id: "DISPOSITION_AND_CARE_ADVICE",
    label: "Disposition and Care Advice",
    mappedStepIds: ["TRIAGE_DISPOSITION", "CARE_ADVICE", "HANDOFF_REFERRAL"]
  },
  {
    id: "SBAR_COMPLETE",
    label: "SBAR / Complete",
    mappedStepIds: ["HANDOFF_REFERRAL", "CLOSING_SCRIPT"]
  }
];

const possibleRedFlagTerms = [
  "breathing",
  "chest",
  "confusion",
  "fainting",
  "seizure",
  "severe",
  "shortness",
  "stroke",
  "sweating",
  "unresponsive",
  "vomiting"
];

function stableHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeReason(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function keywordsFor(value: string): string[] {
  return unique(
    normalizeReason(value)
      .split(" ")
      .map((part) => part.trim())
      .filter((part) => part.length >= 3)
  ).slice(0, 12);
}

function confidenceFrom(suggestions: QueueProtocolSuggestionDto[]): number {
  const [first, second] = suggestions;
  if (!first) {
    return 0;
  }
  const firstScore = Math.max(0, first.score);
  const secondScore = Math.max(0, second?.score ?? 0);
  const margin = firstScore - secondScore;
  return Math.min(0.97, Math.max(0.35, (firstScore + margin) / Math.max(100, firstScore + secondScore + 25)));
}

function comparisonFor(
  deterministicPrimaryProtocolId: string | undefined,
  shadowPrimaryProtocolId: string | undefined,
  suggestions: QueueProtocolSuggestionDto[]
): RagShadowSuggestionDto["comparison"] {
  if (!deterministicPrimaryProtocolId) {
    return {
      deterministicPrimaryProtocolId,
      shadowPrimaryProtocolId,
      agreement: "NO_DETERMINISTIC_CANDIDATE",
      reasonCode: "SYSTEM_HAS_NOT_SELECTED_A_PRIMARY_PROTOCOL"
    };
  }
  if (!shadowPrimaryProtocolId) {
    return {
      deterministicPrimaryProtocolId,
      shadowPrimaryProtocolId,
      agreement: "NO_SHADOW_CANDIDATE",
      reasonCode: "RAG_RETRIEVAL_RETURNED_NO_APPROVED_PROTOCOL"
    };
  }
  if (deterministicPrimaryProtocolId === shadowPrimaryProtocolId) {
    return {
      deterministicPrimaryProtocolId,
      shadowPrimaryProtocolId,
      agreement: "FULL_MATCH",
      reasonCode: "DETERMINISTIC_AND_SHADOW_PRIMARY_PROTOCOL_MATCH"
    };
  }
  if (suggestions.some((item) => item.protocolId === deterministicPrimaryProtocolId)) {
    return {
      deterministicPrimaryProtocolId,
      shadowPrimaryProtocolId,
      agreement: "PARTIAL_MATCH",
      reasonCode: "DETERMINISTIC_PROTOCOL_IS_PRESENT_IN_SHADOW_TOP_CANDIDATES"
    };
  }
  return {
    deterministicPrimaryProtocolId,
    shadowPrimaryProtocolId,
    agreement: "NO_MATCH",
    reasonCode: "DETERMINISTIC_AND_SHADOW_PROTOCOLS_DIVERGE"
  };
}

export function buildRagShadowSuggestion(input: RagShadowInput): RagShadowSuggestionDto {
  const keywords = keywordsFor(input.reasonNarrative);
  const candidates = input.deterministicSuggestions.slice(0, 5);
  const shadowPrimaryProtocolId = candidates[0]?.protocolId;
  const sourceIds = candidates.map((candidate) => candidate.protocolId);
  const eventSeed = [
    input.releaseVersion,
    input.reasonNarrative,
    input.deterministicPrimaryProtocolId ?? "none",
    sourceIds.join(",")
  ].join("|");

  return {
    mode: "DRY_RUN_SHADOW",
    boundary: "APPROVED_CONTENT_ONLY",
    sourceType: input.sourceType,
    sourceReleaseVersion: input.releaseVersion,
    query: input.reasonNarrative,
    extractedReason: {
      normalizedReason: normalizeReason(input.reasonNarrative),
      keywords,
      possibleRedFlags: possibleRedFlagTerms.filter((term) => normalizeReason(input.reasonNarrative).includes(term))
    },
    retrieval: {
      eventId: `rag-ret-${stableHash(eventSeed).slice(0, 16)}`,
      corpusIds: [`clinical-content:${input.sourceType}:${input.releaseVersion}`],
      retrievedSourceIds: sourceIds,
      retrievedSnippetHashes: candidates.map((candidate) =>
        stableHash(`${input.releaseVersion}|${candidate.protocolId}|${candidate.matchedTerms.join(",")}`).slice(0, 16)
      ),
      confidence: confidenceFrom(candidates)
    },
    suggestedProtocolCandidates: candidates,
    comparison: comparisonFor(input.deterministicPrimaryProtocolId, shadowPrimaryProtocolId, candidates),
    prohibitedActionAcknowledgement: [
      "No invented questions",
      "No invented care advice",
      "No disposition decision authority",
      "No downgrade below deterministic safety floor"
    ],
    cannotDecideDisposition: true,
    requiresNurseReview: true,
    generatedAtIso: input.preparedAtIso
  };
}

function actionTabFor(stage: QueueClinicalStage): StccVisibleActionTab {
  if (stage === "PROTOCOL") return "QUESTIONS";
  if (stage === "DISPOSITION") return "DISPOSITION_AND_CARE_ADVICE";
  if (stage === "SBAR") return "SBAR_COMPLETE";
  return "REASON_AND_EMERGENCY_RULE_OUT";
}

function completedIf(condition: boolean, fallback: StccProcessStepStatus = "READY"): StccProcessStepStatus {
  return condition ? "COMPLETED" : fallback;
}

function step(input: Omit<StccProcessStepDto, "notes"> & { notes?: string[] }): StccProcessStepDto {
  return {
    ...input,
    notes: input.notes ?? []
  };
}

export function buildStccProcessSnapshot(input: StccProcessInput): StccProcessSnapshotDto {
  const hasReason = Boolean(input.reasonNarrative?.trim());
  const hasPreparedGuideline = input.preparedProtocol?.status === "PREPARED";
  const hasGuideline = Boolean(input.matchedProtocolId);
  const hasInitialAssessment = Boolean(input.vitals) || input.safetyFloorActive;
  const hasDisposition = Boolean(input.dispositionCode);
  const hasClinicalApproval = Boolean(input.clinicalApproval);

  return {
    processName: "Telehealth Triage Encounter",
    averageDurationMinutes: "11-13",
    currentActionTab: actionTabFor(input.currentStage),
    visibleActionTabs,
    canonicalSteps: [
      step({
        id: "OPENING_SCRIPT",
        label: "Opening Script",
        lane: "CALL_OPENING",
        status: input.status === "INCOMING" ? "READY" : "COMPLETED",
        deterministicOwner: "NURSE",
        nurseActionRequired: input.status === "INCOMING",
        sourceBoundary: "NURSE_DOCUMENTATION",
        notes: ["Deliver friendly greeting and introduction."]
      }),
      step({
        id: "REASON_FOR_VISIT",
        label: "Reason for Visit / Initial Nurse Assessment",
        lane: "CALL_OPENING",
        status: completedIf(hasReason && input.identityValidated, "IN_PROGRESS"),
        deterministicOwner: "SYSTEM_AND_NURSE",
        nurseActionRequired: !hasReason,
        sourceBoundary: "HRMS",
        notes: [
          "HRMS identity and age are validated before queue entry.",
          "The nurse confirms the caller's reason narrative before selecting a guideline."
        ]
      }),
      step({
        id: "GUIDELINE_SELECTION",
        label: "Guideline Selection",
        lane: "GUIDELINE_SELECTION",
        status: hasGuideline ? "COMPLETED" : hasPreparedGuideline ? "READY" : "BLOCKED",
        deterministicOwner: "SYSTEM_AND_NURSE",
        nurseActionRequired: !hasGuideline,
        sourceBoundary: "STCC_CONTENT",
        notes: ["Search words and keyword matches prepare candidate guidelines; the nurse selects the final guideline."]
      }),
      step({
        id: "INITIAL_ASSESSMENT_QUESTIONS",
        label: "Initial Assessment Questions",
        lane: "ASSESSMENT",
        status: completedIf(hasInitialAssessment, hasGuideline || hasPreparedGuideline ? "READY" : "BLOCKED"),
        deterministicOwner: "SYSTEM_AND_NURSE",
        nurseActionRequired: !hasInitialAssessment,
        sourceBoundary: "STCC_CONTENT",
        notes: ["Emergency safety-floor rules are checked before lower-acuity questions."]
      }),
      step({
        id: "TRIAGE_ASSESSMENT_QUESTIONS",
        label: "Triage Assessment Questions",
        lane: "ASSESSMENT",
        status: hasDisposition ? "COMPLETED" : hasGuideline ? "IN_PROGRESS" : "BLOCKED",
        deterministicOwner: "SYSTEM_AND_NURSE",
        nurseActionRequired: hasGuideline && !hasDisposition,
        sourceBoundary: "STCC_CONTENT",
        notes: ["Questions are presented high-to-low acuity; a Yes fixes the disposition, a No unlocks the next item."]
      }),
      step({
        id: "TELEMEDICINE_ELIGIBLE",
        label: "Telemedicine Eligible",
        lane: "ASSESSMENT",
        status: hasGuideline ? (hasDisposition ? "COMPLETED" : "READY") : "BLOCKED",
        deterministicOwner: "SYSTEM",
        nurseActionRequired: false,
        sourceBoundary: "STCC_CONTENT",
        notes: ["Eligibility is an indicator and never downgrades the clinical disposition."]
      }),
      step({
        id: "TRIAGE_DISPOSITION",
        label: "Triage Disposition",
        lane: "DISPOSITION_AND_CLOSE",
        status: completedIf(hasDisposition, hasGuideline ? "READY" : "BLOCKED"),
        deterministicOwner: "SYSTEM_AND_NURSE",
        nurseActionRequired: !hasDisposition,
        sourceBoundary: "STCC_CONTENT",
        notes: ["The clinical disposition is determined by rules and nurse-confirmed answers."]
      }),
      step({
        id: "CARE_ADVICE",
        label: "Care Advice",
        lane: "DISPOSITION_AND_CLOSE",
        status: hasClinicalApproval ? "COMPLETED" : hasDisposition ? "READY" : "BLOCKED",
        deterministicOwner: "SYSTEM_AND_NURSE",
        nurseActionRequired: hasDisposition && !hasClinicalApproval,
        sourceBoundary: "STCC_CONTENT",
        notes: ["Care advice is mapped from approved content and selected for give-now or send-later use."]
      }),
      step({
        id: "HANDOFF_REFERRAL",
        label: "Hand-Off / Referral",
        lane: "DISPOSITION_AND_CLOSE",
        status: hasClinicalApproval ? "COMPLETED" : hasDisposition ? "READY" : "BLOCKED",
        deterministicOwner: "SYSTEM_AND_NURSE",
        nurseActionRequired: hasDisposition && !hasClinicalApproval,
        sourceBoundary: "LOCAL_QATAR_OVERLAY",
        notes: ["Qatar routing and fit-to-fly overlays are applied after the STCC clinical disposition is fixed."]
      }),
      step({
        id: "CLOSING_SCRIPT",
        label: "Closing Script",
        lane: "DISPOSITION_AND_CLOSE",
        status: input.status === "COMPLETED" || input.sbarCopied ? "COMPLETED" : hasClinicalApproval ? "READY" : "BLOCKED",
        deterministicOwner: "NURSE",
        nurseActionRequired: hasClinicalApproval && !input.sbarCopied,
        sourceBoundary: "NURSE_DOCUMENTATION",
        notes: ["Deliver friendly closing, callback instructions, and SBAR completion."]
      })
    ]
  };
}
