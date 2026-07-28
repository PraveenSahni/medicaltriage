import { randomUUID } from "node:crypto";
import { isMockMode, shouldPersistQueueInDatabase } from "../config/runtime.js";
import { prisma } from "../db.js";
import { auditSignatureFor } from "./safetyKernel.js";
import { getOrganizationById, listUsers } from "./securityAdmin.js";
import { findDependent, resolvePatientAgeFromDirectory, validateStaffMember } from "./hrms.js";
import {
  getClinicalProtocolById,
  getCurrentClinicalContentPackage,
  listClinicalProtocols,
  searchClinicalProtocols
} from "./clinicalContent.js";
import { buildRagShadowSuggestion, buildStccProcessSnapshot } from "./ragShadow.js";
import { captureReasonForCallAudio } from "./reasonForCallVoiceCapture.js";
import { resolveMdbAlgorithmId } from "./stccMdbMapper.js";
import type { AuthenticatedSession } from "../types/security.js";
import type {
  ClinicalContentProtocol,
  ClinicalContentQuestion,
  ProtocolSearchResult
} from "../types/clinicalContent.js";
import type {
  QueueClinicalStage,
  QueueContextUpdate,
  QueueCreateRequest,
  QueueHandoverRequest,
  QueueItemDto,
  QueueListQuery,
  QueueMoveRequest,
  QueuePatientAgeSnapshotDto,
  QueuePreparedProtocolDto,
  QueueProtocolQuestionPreviewDto,
  QueueProtocolSuggestionDto,
  QueueSeverity,
  QueueStatus,
  QueueTransitionLogDto,
  QueueVitals,
  RagShadowSuggestionDto
} from "../types/queue.js";

export class QueueOrchestrationError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string
  ) {
    super(message);
  }
}

type QueueRecord = Omit<QueueItemDto, "transitionLogs" | "stccProcess"> & {
  stccProcess?: QueueItemDto["stccProcess"];
  transitionLogs: QueueTransitionLogDto[];
};

type QueueDbTransitionRow = {
  id: string;
  queueItemId: string;
  actorId: string;
  actorOrganizationId: string | null;
  actorRole: string;
  targetOrganizationId: string | null;
  eventType: string;
  fromStatus: QueueStatus;
  toStatus: QueueStatus;
  fromStage: QueueClinicalStage;
  toStage: QueueClinicalStage;
  reason: string | null;
  auditSignature: string;
  timestamp: Date;
};

type QueueDbRow = {
  id: string;
  istStaffId: string;
  organizationId: string | null;
  targetOrganizationId: string | null;
  dependentId: string | null;
  status: QueueStatus;
  currentStage: QueueClinicalStage;
  priorityScore: number;
  patientType: string;
  channel: string;
  stationCode: string | null;
  outstationCode: string | null;
  department: string | null;
  jobTitle: string | null;
  summary: string | null;
  vitals: unknown;
  matchedProtocolId: string | null;
  calculatedSeverity: QueueSeverity | null;
  dispositionCode: string | null;
  destinationName: string | null;
  identityValidated: boolean;
  safetyFloorActive: boolean;
  clinicalApproval: unknown;
  sbarCopied: boolean;
  assignedNurseId: string | null;
  claimedAt: Date | null;
  slaDeadline: Date;
  lockedBy: string | null;
  lockExpiresAt: Date | null;
  customAviationTags: unknown;
  queuePayload: unknown;
  createdAt: Date;
  updatedAt: Date;
  transitionLogs?: QueueDbTransitionRow[];
};

type QueueModelClient = {
  findMany(args: Record<string, unknown>): Promise<QueueDbRow[]>;
  findFirst(args: Record<string, unknown>): Promise<QueueDbRow | null>;
  findUnique(args: Record<string, unknown>): Promise<QueueDbRow | null>;
  create(args: Record<string, unknown>): Promise<QueueDbRow>;
  update(args: Record<string, unknown>): Promise<QueueDbRow>;
  updateMany(args: Record<string, unknown>): Promise<{ count: number }>;
  delete(args: Record<string, unknown>): Promise<QueueDbRow>;
};

type QueueTransitionModelClient = {
  create(args: Record<string, unknown>): Promise<QueueDbTransitionRow>;
};

type QueuePrismaClient = {
  triageQueueItem: QueueModelClient;
  queueTransitionLog: QueueTransitionModelClient;
};

const STAGE_ORDER: QueueClinicalStage[] = ["INTAKE", "IDENTITY", "VITALS", "PROTOCOL", "DISPOSITION", "SBAR"];
const COMPLETED_STAGE: QueueClinicalStage = "SBAR";
const ACTIVE_LOCK_MINUTES = 5;

const clinicalOperatorRoles = new Set([
  "remote_triage_nurse",
  "senior_triage_nurse",
  "pediatric_triage_nurse",
  "teleconsult_physician",
  "occupational_health_clinician"
]);
const supervisorRoles = new Set([
  "senior_triage_nurse",
  "triage_service_manager",
  "platform_super_administrator",
  "system_administrator"
]);
const managerRoles = new Set([
  "triage_service_manager",
  "platform_super_administrator",
  "system_administrator"
]);

const globalForQueue = globalThis as unknown as {
  istTriageQueueStore?: Map<string, QueueRecord>;
  istTriageCompletionCounter?: number;
};

/**
 * Simple in-memory running total of completed encounters this API process
 * has seen, logged on every completion so a bulk run's real-time progress is
 * visible directly in the API server's own log output - no need to poll the
 * database separately to watch a long batch move forward.
 */
function recordCompletion(recordId: string): void {
  globalForQueue.istTriageCompletionCounter = (globalForQueue.istTriageCompletionCounter ?? 0) + 1;
  // eslint-disable-next-line no-console
  console.log(`[queue] completed #${globalForQueue.istTriageCompletionCounter}: ${recordId}`);
}

export function getCompletionCounter(): number {
  return globalForQueue.istTriageCompletionCounter ?? 0;
}

function nowIso(): string {
  return new Date().toISOString();
}

function deadline(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function lockDeadline(): string {
  return new Date(Date.now() + ACTIVE_LOCK_MINUTES * 60_000).toISOString();
}

function queueClient(): QueuePrismaClient {
  return prisma as unknown as QueuePrismaClient;
}

function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function organizationCodeFor(organizationId: string | undefined): string | undefined {
  return organizationId ? getOrganizationById(organizationId)?.code : undefined;
}

function effectiveTargetOrganizationId(record: Pick<QueueRecord, "organizationId" | "targetOrganizationId">): string | undefined {
  return record.targetOrganizationId ?? record.organizationId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

// Vitals may be partially entered (a nurse fills them in one field at a
// time - see QueueContextUpdateSchema's comment), so this only rejects
// genuinely malformed values, not an incomplete-but-valid partial object.
function isVitals(value: unknown): value is QueueVitals {
  if (!isRecord(value)) {
    return false;
  }
  const { heartRate, respiratoryRate, spo2, temperature, consciousLevel } = value;
  return (
    (heartRate === undefined || typeof heartRate === "number") &&
    (respiratoryRate === undefined || typeof respiratoryRate === "number") &&
    (spo2 === undefined || typeof spo2 === "number") &&
    (temperature === undefined || typeof temperature === "number") &&
    (consciousLevel === undefined || typeof consciousLevel === "string")
  );
}

function approvalFromUnknown(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function tagsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function stringFromPayload(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function patientAgeFromUnknown(value: unknown): QueuePatientAgeSnapshotDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const source = value.source;
  const ageYears = value.ageYears;
  const ageMonths = value.ageMonths;
  const calculatedFrom = value.calculatedFrom;
  if (
    (source !== "staff" && source !== "dependent") ||
    typeof ageYears !== "number" ||
    typeof ageMonths !== "number" ||
    (calculatedFrom !== "HRMS_DATE_OF_BIRTH" && calculatedFrom !== "HRMS_AGE_FIELD")
  ) {
    return undefined;
  }
  const biologicalSex = value.biologicalSex;
  return {
    source,
    ageYears,
    ageMonths,
    dateOfBirthIso: stringFromPayload(value.dateOfBirthIso),
    calculatedFrom,
    biologicalSex:
      biologicalSex === "female" || biologicalSex === "male" || biologicalSex === "other" || biologicalSex === "unknown"
        ? biologicalSex
        : undefined
  };
}

function stringArrayFromUnknown(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function severityFromUnknown(value: unknown): "Emergency" | "Urgent" | "Routine" | "Self-care" | undefined {
  return value === "Emergency" || value === "Urgent" || value === "Routine" || value === "Self-care"
    ? value
    : undefined;
}

function protocolSuggestionFromUnknown(value: unknown): QueueProtocolSuggestionDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const protocolId = stringFromPayload(value.protocolId);
  const titleEn = stringFromPayload(value.titleEn);
  const highestSeverity = severityFromUnknown(value.highestSeverity);
  if (!protocolId || !titleEn || typeof value.score !== "number" || typeof value.questionCount !== "number" || !highestSeverity) {
    return undefined;
  }
  return {
    protocolId,
    titleEn,
    score: value.score,
    matchedTerms: stringArrayFromUnknown(value.matchedTerms),
    questionCount: value.questionCount,
    highestSeverity,
    releaseVersion: stringFromPayload(value.releaseVersion) ?? "unknown"
  };
}

function protocolQuestionPreviewFromUnknown(value: unknown): QueueProtocolQuestionPreviewDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const id = stringFromPayload(value.id);
  const severity = severityFromUnknown(value.severity);
  const questionTextEn = stringFromPayload(value.questionTextEn);
  const dispositionCode = stringFromPayload(value.dispositionCode);
  if (!id || !severity || !questionTextEn || !dispositionCode || typeof value.acuityOrder !== "number") {
    return undefined;
  }
  return {
    id,
    acuityOrder: value.acuityOrder,
    severity,
    questionTextEn,
    dispositionCode,
    redFlag: value.redFlag === true,
    careAdviceIds: stringArrayFromUnknown(value.careAdviceIds)
  };
}

function preparedProtocolFromUnknown(value: unknown): QueuePreparedProtocolDto | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  const status = value.status;
  const sourceType = value.sourceType;
  const reasonNarrative = stringFromPayload(value.reasonNarrative);
  const releaseVersion = stringFromPayload(value.releaseVersion);
  const preparedAtIso = stringFromPayload(value.preparedAtIso);
  if (
    (status !== "PENDING_REASON" && status !== "PREPARED" && status !== "NO_MATCH") ||
    (sourceType !== "synthetic-sample" && sourceType !== "licensed-stcc" && sourceType !== "local-qatar-override") ||
    !reasonNarrative ||
    !releaseVersion ||
    !preparedAtIso
  ) {
    return undefined;
  }
  const resourceSections = isRecord(value.resourceSectionsAvailable) ? value.resourceSectionsAvailable : {};
  return {
    status,
    sourceType,
    releaseVersion,
    reasonNarrative,
    extractedKeywords: stringArrayFromUnknown(value.extractedKeywords),
    primaryProtocolId: stringFromPayload(value.primaryProtocolId),
    primaryProtocolTitle: stringFromPayload(value.primaryProtocolTitle),
    suggestions: Array.isArray(value.suggestions)
      ? value.suggestions.map(protocolSuggestionFromUnknown).filter((item): item is QueueProtocolSuggestionDto => Boolean(item))
      : [],
    acuityQuestionPreview: Array.isArray(value.acuityQuestionPreview)
      ? value.acuityQuestionPreview.map(protocolQuestionPreviewFromUnknown).filter((item): item is QueueProtocolQuestionPreviewDto => Boolean(item))
      : [],
    resourceSectionsAvailable: {
      background: resourceSections.background === true,
      firstAid: resourceSections.firstAid === true,
      careAdvice: resourceSections.careAdvice === true,
      seeMoreAppropriateGuideline: resourceSections.seeMoreAppropriateGuideline === true
    },
    // Trusted round-trip of our own previously-serialized output (not user
    // input) - without this, ragShadow always comes back undefined on every
    // read from the database, which makes ensurePreparedProtocol()'s
    // already-prepared check (below) fail every single time and forces a
    // full keyword-match + RAG-shadow recompute against every protocol for
    // every queue record on every single list/get request - a real
    // performance bug that got catastrophically worse once the protocol
    // catalog grew from 6 sample entries to 229 real ones.
    ragShadow: isRecord(value.ragShadow) ? (value.ragShadow as RagShadowSuggestionDto) : undefined,
    preparedAtIso
  };
}

function reasonCallCaptureFromUnknown(value: unknown): QueueRecord["reasonCallCapture"] {
  if (!isRecord(value)) {
    return undefined;
  }
  const transcriptText = stringFromPayload(value.transcriptText);
  const provider = stringFromPayload(value.provider);
  const capturedAtIso = stringFromPayload(value.capturedAtIso);
  const confidence = typeof value.confidence === "number" ? value.confidence : undefined;
  if (!transcriptText || !provider || !capturedAtIso || confidence === undefined) {
    return undefined;
  }
  return {
    audioReference: stringFromPayload(value.audioReference),
    transcriptText,
    confidence,
    provider,
    capturedAtIso
  };
}

function queuePayloadFromUnknown(value: unknown): {
  identityValidationSource?: QueueRecord["identityValidationSource"];
  identityValidationMessage?: string;
  identityValidatedAtIso?: string;
  patientAge?: QueuePatientAgeSnapshotDto;
  reasonNarrative?: string;
  reasonCallCapture?: QueueRecord["reasonCallCapture"];
  preparedProtocol?: QueuePreparedProtocolDto;
  safetyFloorSource?: QueueRecord["safetyFloorSource"];
  initialAssessmentResponses?: Record<string, string>;
  taqResponses?: Record<string, boolean>;
  sbarNoteText?: string;
  fitToFlyStatus?: QueueRecord["fitToFlyStatus"];
  vitalsUnobtainable?: boolean;
  matchedProtocolId?: string;
  dependentId?: string;
} {
  if (!isRecord(value)) {
    return {};
  }
  const source = value.identityValidationSource;
  const floorSource = value.safetyFloorSource;
  const initialAssessment = isRecord(value.initialAssessmentResponses)
    ? Object.fromEntries(
        Object.entries(value.initialAssessmentResponses).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      )
    : undefined;
  const taqResponses = isRecord(value.taqResponses)
    ? Object.fromEntries(
        Object.entries(value.taqResponses).filter(
          (entry): entry is [string, boolean] => typeof entry[1] === "boolean"
        )
      )
    : undefined;
  return {
    initialAssessmentResponses: initialAssessment,
    taqResponses,
    sbarNoteText: stringFromPayload(value.sbarNoteText),
    fitToFlyStatus:
      value.fitToFlyStatus === "CLEARED" || value.fitToFlyStatus === "RESTRICTED" || value.fitToFlyStatus === "MEDICAL_REVIEW_REQUIRED"
        ? value.fitToFlyStatus
        : undefined,
    vitalsUnobtainable: typeof value.vitalsUnobtainable === "boolean" ? value.vitalsUnobtainable : undefined,
    identityValidationSource: source === "HRMS_AUTO" || source === "HRMS_LOOKUP_FAILED" ? source : undefined,
    identityValidationMessage: stringFromPayload(value.identityValidationMessage),
    identityValidatedAtIso: stringFromPayload(value.identityValidatedAtIso),
    patientAge: patientAgeFromUnknown(value.patientAge),
    reasonNarrative: stringFromPayload(value.reasonNarrative),
    reasonCallCapture: reasonCallCaptureFromUnknown(value.reasonCallCapture),
    preparedProtocol: preparedProtocolFromUnknown(value.preparedProtocol),
    safetyFloorSource:
      floorSource === "vitals" || floorSource === "symptom" || floorSource === "judgment" ? floorSource : undefined,
    matchedProtocolId: stringFromPayload(value.matchedProtocolId),
    dependentId: stringFromPayload(value.dependentId)
  };
}

function queuePayloadFor(record: QueueRecord): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (record.identityValidationSource) payload.identityValidationSource = record.identityValidationSource;
  if (record.identityValidationMessage) payload.identityValidationMessage = record.identityValidationMessage;
  if (record.identityValidatedAtIso) payload.identityValidatedAtIso = record.identityValidatedAtIso;
  if (record.patientAge) payload.patientAge = record.patientAge;
  if (record.reasonNarrative) payload.reasonNarrative = record.reasonNarrative;
  if (record.reasonCallCapture) payload.reasonCallCapture = record.reasonCallCapture;
  if (record.preparedProtocol) payload.preparedProtocol = record.preparedProtocol;
  if (record.safetyFloorSource) payload.safetyFloorSource = record.safetyFloorSource;
  if (record.initialAssessmentResponses) payload.initialAssessmentResponses = record.initialAssessmentResponses;
  if (record.taqResponses) payload.taqResponses = record.taqResponses;
  if (record.sbarNoteText) payload.sbarNoteText = record.sbarNoteText;
  if (record.fitToFlyStatus) payload.fitToFlyStatus = record.fitToFlyStatus;
  if (typeof record.vitalsUnobtainable === "boolean") payload.vitalsUnobtainable = record.vitalsUnobtainable;
  // The app-facing matchedProtocolId is the file-based external protocol id
  // (e.g. "stcc-abdominal-pain-male"), not the Algorithm table's internal
  // cuid that the FK column of the same name actually stores - stash the
  // external id here so it round-trips correctly regardless of whether a
  // matching Algorithm row exists in the database (see resolveAlgorithmDbId).
  if (record.matchedProtocolId) payload.matchedProtocolId = record.matchedProtocolId;
  // Same reasoning as matchedProtocolId: dependentId is an HRMS-issued id
  // from the JSON-mocked directory (hrmsOracleAdapter.ts), not a row in the
  // Prisma Dependent table (which stays unseeded/legacy here) - the FK
  // column can't safely hold it, so it round-trips via the payload instead.
  if (record.dependentId) payload.dependentId = record.dependentId;
  return payload;
}

function ageSnapshotFromResolution(result: ReturnType<typeof resolvePatientAgeFromDirectory>): QueuePatientAgeSnapshotDto | undefined {
  if (!result.ok) {
    return undefined;
  }
  const snapshot: QueuePatientAgeSnapshotDto = {
    source: result.source,
    ageYears: result.ageYears,
    ageMonths: result.ageMonths,
    calculatedFrom: result.calculatedFrom
  };
  if (result.dateOfBirthIso) {
    snapshot.dateOfBirthIso = result.dateOfBirthIso;
  }
  if (result.biologicalSex) {
    snapshot.biologicalSex = result.biologicalSex;
  }
  return snapshot;
}

function hydrateRecordIdentity(record: QueueRecord): QueueRecord {
  const resolution = resolvePatientAgeFromDirectory({
    istStaffId: record.istStaffId,
    dependentId: record.dependentId,
    referenceDate: new Date(record.createdAtIso)
  });

  if (!resolution.ok) {
    return {
      ...record,
      identityValidated: false,
      identityValidationSource: "HRMS_LOOKUP_FAILED",
      identityValidationMessage: resolution.reason
    };
  }

  return {
    ...record,
    identityValidated: true,
    identityValidationSource: "HRMS_AUTO",
    identityValidationMessage: "Validated from HRMS before the call entered the clinical queue.",
    identityValidatedAtIso: record.createdAtIso,
    patientAge: ageSnapshotFromResolution(resolution)
  };
}

const REASON_KEYWORD_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "before",
  "being",
  "call",
  "caller",
  "could",
  "from",
  "have",
  "into",
  "more",
  "over",
  "parent",
  "reported",
  "request",
  "requested",
  "staff",
  "that",
  "their",
  "there",
  "this",
  "with",
  "while",
  "year",
  "years"
]);

function normalizeReason(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractReasonKeywords(reasonNarrative: string): string[] {
  return [
    ...new Set(
      normalizeReason(reasonNarrative)
        .split(" ")
        .map((part) => part.trim())
        .filter((part) => part.length >= 3)
        .filter((part) => !REASON_KEYWORD_STOP_WORDS.has(part))
    )
  ].slice(0, 12);
}

function suggestionFromSearchResult(result: ProtocolSearchResult): QueueProtocolSuggestionDto {
  return {
    protocolId: result.id,
    titleEn: result.titleEn,
    score: result.score,
    matchedTerms: result.matchedTerms,
    questionCount: result.questionCount,
    highestSeverity: result.highestSeverity,
    releaseVersion: result.releaseVersion,
    acuity: result.acuity
  };
}

function questionPreviewFromClinicalQuestion(question: ClinicalContentQuestion): QueueProtocolQuestionPreviewDto {
  return {
    id: question.id,
    acuityOrder: question.acuityOrder,
    severity: question.severity,
    questionTextEn: question.questionTextEn,
    dispositionCode: question.dispositionCode,
    redFlag: question.redFlag,
    careAdviceIds: question.careAdviceIds
  };
}

function resourceAvailabilityFor(protocol: ClinicalContentProtocol | undefined, suggestionCount: number) {
  return {
    background: Boolean(protocol?.backgroundInfoEn),
    firstAid: false,
    careAdvice: Boolean(protocol?.careAdvice.length),
    seeMoreAppropriateGuideline: suggestionCount > 1
  };
}

function buildPreparedProtocol(record: QueueRecord, preparedAtIso: string): QueuePreparedProtocolDto {
  const contentPackage = getCurrentClinicalContentPackage();
  const reasonNarrative = (record.reasonNarrative ?? record.summary).trim();
  const base = {
    sourceType: contentPackage.release.sourceType,
    releaseVersion: contentPackage.release.version,
    reasonNarrative,
    extractedKeywords: extractReasonKeywords(reasonNarrative),
    preparedAtIso
  };

  if (!reasonNarrative) {
    const suggestions: QueueProtocolSuggestionDto[] = [];
    return {
      ...base,
      status: "PENDING_REASON",
      suggestions,
      acuityQuestionPreview: [],
      resourceSectionsAvailable: resourceAvailabilityFor(undefined, 0),
      ragShadow: buildRagShadowSuggestion({
        reasonNarrative,
        sourceType: contentPackage.release.sourceType,
        releaseVersion: contentPackage.release.version,
        deterministicSuggestions: suggestions,
        preparedAtIso
      })
    };
  }

  const suggestions = searchClinicalProtocols({
    q: reasonNarrative,
    ageYears: record.patientAge?.ageYears,
    biologicalSex: record.patientAge?.biologicalSex,
    mode: contentPackage.release.mode,
    limit: 5
  }).map(suggestionFromSearchResult);
  const primarySuggestion = suggestions[0];
  const primaryProtocol = primarySuggestion ? getClinicalProtocolById(primarySuggestion.protocolId) : undefined;

  return {
    ...base,
    status: primarySuggestion ? "PREPARED" : "NO_MATCH",
    primaryProtocolId: primarySuggestion?.protocolId,
    primaryProtocolTitle: primarySuggestion?.titleEn,
    suggestions,
    acuityQuestionPreview: primaryProtocol
      ? primaryProtocol.questions.map(questionPreviewFromClinicalQuestion).slice(0, 8)
      : [],
    resourceSectionsAvailable: resourceAvailabilityFor(primaryProtocol, suggestions.length),
    ragShadow: buildRagShadowSuggestion({
      reasonNarrative,
      sourceType: contentPackage.release.sourceType,
      releaseVersion: contentPackage.release.version,
      deterministicSuggestions: suggestions,
      deterministicPrimaryProtocolId: primarySuggestion?.protocolId,
      preparedAtIso
    })
  };
}

function ensurePreparedProtocol(record: QueueRecord): QueueRecord {
  const contentPackage = getCurrentClinicalContentPackage();
  const reasonNarrative = (record.reasonNarrative ?? record.summary).trim();
  if (
    record.preparedProtocol &&
    record.reasonNarrative === reasonNarrative &&
    record.preparedProtocol.reasonNarrative === reasonNarrative &&
    record.preparedProtocol.releaseVersion === contentPackage.release.version &&
    record.preparedProtocol.ragShadow
  ) {
    return record;
  }

  const preparedAtIso = record.preparedProtocol?.preparedAtIso ?? record.createdAtIso;
  return {
    ...record,
    reasonNarrative,
    preparedProtocol: buildPreparedProtocol({ ...record, reasonNarrative }, preparedAtIso)
  };
}

function dbRowToRecord(row: QueueDbRow): QueueRecord {
  const queuePayload = queuePayloadFromUnknown(row.queuePayload);
  return {
    id: row.id,
    istStaffId: row.istStaffId,
    dependentId: queuePayload.dependentId ?? row.dependentId ?? undefined,
    organizationId: row.organizationId ?? undefined,
    organizationCode: organizationCodeFor(row.organizationId ?? undefined),
    targetOrganizationId: row.targetOrganizationId ?? undefined,
    targetOrganizationCode: organizationCodeFor(row.targetOrganizationId ?? undefined),
    status: row.status,
    currentStage: row.currentStage,
    priorityScore: row.priorityScore,
    patientType: row.patientType === "Dependent" ? "Dependent" : "Staff",
    channel: row.channel,
    stationCode: row.stationCode ?? row.outstationCode ?? undefined,
    department: row.department ?? undefined,
    jobTitle: row.jobTitle ?? undefined,
    summary: row.summary ?? "Tele-triage queue item",
    reasonNarrative: queuePayload.reasonNarrative ?? row.summary ?? "Tele-triage queue item",
    reasonCallCapture: queuePayload.reasonCallCapture,
    preparedProtocol: queuePayload.preparedProtocol,
    vitals: isVitals(row.vitals) ? row.vitals : undefined,
    matchedProtocolId: queuePayload.matchedProtocolId ?? row.matchedProtocolId ?? undefined,
    calculatedSeverity: row.calculatedSeverity ?? undefined,
    dispositionCode: row.dispositionCode ?? undefined,
    destinationName: row.destinationName ?? undefined,
    identityValidated: row.identityValidated,
    identityValidationSource: queuePayload.identityValidationSource,
    identityValidationMessage: queuePayload.identityValidationMessage,
    identityValidatedAtIso: queuePayload.identityValidatedAtIso,
    patientAge: queuePayload.patientAge,
    safetyFloorActive: row.safetyFloorActive,
    safetyFloorSource: queuePayload.safetyFloorSource,
    initialAssessmentResponses: queuePayload.initialAssessmentResponses,
    taqResponses: queuePayload.taqResponses,
    sbarNoteText: queuePayload.sbarNoteText,
    fitToFlyStatus: queuePayload.fitToFlyStatus,
    vitalsUnobtainable: queuePayload.vitalsUnobtainable,
    clinicalApproval: approvalFromUnknown(row.clinicalApproval),
    sbarCopied: row.sbarCopied,
    assignedNurseId: row.assignedNurseId ?? undefined,
    claimedAtIso: row.claimedAt?.toISOString(),
    slaDeadlineIso: row.slaDeadline.toISOString(),
    lockedBy: row.lockedBy ?? undefined,
    lockExpiresAtIso: row.lockExpiresAt?.toISOString(),
    customAviationTags: tagsFromUnknown(row.customAviationTags),
    createdAtIso: row.createdAt.toISOString(),
    updatedAtIso: row.updatedAt.toISOString(),
    transitionLogs: (row.transitionLogs ?? []).map((log) => ({
      id: log.id,
      queueItemId: log.queueItemId,
      actorId: log.actorId,
      actorOrganizationId: log.actorOrganizationId ?? undefined,
      actorRole: log.actorRole,
      targetOrganizationId: log.targetOrganizationId ?? undefined,
      eventType: log.eventType,
      fromStatus: log.fromStatus,
      toStatus: log.toStatus,
      fromStage: log.fromStage,
      toStage: log.toStage,
      reason: log.reason ?? undefined,
      auditSignature: log.auditSignature,
      timestampIso: log.timestamp.toISOString()
    }))
  };
}

// Resolves the raw lockedBy user id (e.g. "usr_nurse_10001") to the real
// signed-in user's display name, so the sidebar can show "with Nurse X"
// instead of either a meaningless id or a fabricated name.
function resolveLockedByName(userId: string | undefined): string | undefined {
  if (!userId) return undefined;
  return listUsers().find((user) => user.id === userId)?.fullName;
}

function toDto(record: QueueRecord): QueueItemDto {
  const prepared = ensurePreparedProtocol(record);
  return jsonClone({
    ...prepared,
    lockedByName: resolveLockedByName(prepared.lockedBy),
    stccProcess: buildStccProcessSnapshot(prepared)
  });
}

function computePriority(record: Pick<QueueRecord, "safetyFloorActive" | "calculatedSeverity" | "slaDeadlineIso" | "patientType" | "jobTitle" | "customAviationTags">): number {
  let score = 0;
  if (record.safetyFloorActive || record.calculatedSeverity === "EMERGENCY") {
    score += 10_000;
  }

  const minutesToSla = Math.floor((new Date(record.slaDeadlineIso).getTime() - Date.now()) / 60_000);
  if (minutesToSla <= 0) {
    score += 2_500;
  } else {
    score += Math.max(0, 1_500 - minutesToSla * 25);
  }

  if (record.patientType === "Dependent") {
    score += 600;
  }

  const roleText = `${record.jobTitle ?? ""} ${record.customAviationTags.join(" ")}`.toLowerCase();
  if (roleText.includes("pilot") || roleText.includes("flight_deck")) {
    score += 350;
  }
  if (roleText.includes("cabin")) {
    score += 250;
  }

  return score;
}

function partialVitalsChanged(update: Partial<QueueVitals>, existing: QueueVitals | undefined): boolean {
  return (Object.keys(update) as Array<keyof QueueVitals>).some((key) => update[key] !== existing?.[key]);
}

function redFloorFromVitals(vitals: QueueVitals | undefined): boolean {
  if (!vitals) {
    return false;
  }
  // Vitals may now be partially entered (see QueueContextUpdateSchema's
  // comment) - a field that hasn't been recorded yet must never itself
  // count as a breach (e.g. consciousLevel undefined is not "not alert").
  return (
    (vitals.consciousLevel !== undefined && vitals.consciousLevel !== "alert") ||
    (vitals.spo2 !== undefined && vitals.spo2 < 92) ||
    (vitals.respiratoryRate !== undefined && (vitals.respiratoryRate < 10 || vitals.respiratoryRate > 30)) ||
    (vitals.heartRate !== undefined && (vitals.heartRate < 60 || vitals.heartRate > 130))
  );
}

/**
 * 20 fresh, unclaimed test calls exercising every disposition tier of the
 * real licensed STCC "Abdominal Pain - Male" guideline
 * (src/data/stccLicensedContent), for full manual walkthrough QA now that
 * CLINICAL_CONTENT_SOURCE=stcc-licensed is the active content source. Each
 * `summary` is an ordinary plain-language caller complaint (never copied
 * from the licensed TAQ question text) chosen to search-match the real
 * protocol and plausibly reach the noted disposition level when a nurse
 * walks it through Reason & Rule-Out -> Questions -> Disposition -> SBAR.
 *
 * istStaffId values are real, active, adult-male person numbers pulled from
 * the actual Oracle Fusion HCM mock directory (data/generated/ist_qatar_seed_data.json,
 * served through hrmsOracleAdapter.ts/hrms.ts) - not fabricated IDs - so
 * `hydrateRecordIdentity()` validates them against HRMS exactly like a real
 * incoming call, matching the protocol's own ageMin:18/genderRestriction:male
 * eligibility, and the full workflow (including the identity-gated SBAR
 * completion step) can be exercised end-to-end without a separate bypass.
 */
function abdominalPainMaleTestCases(createdAtIso: string): QueueRecord[] {
  const cases: Array<{ istStaffId: string; summary: string; department: string; jobTitle: string; channel: QueueRecord["channel"] }> = [
    { istStaffId: "IST-00007", summary: "Sudden severe stomach pain, caller sounds confused, family says he looks pale and clammy.", department: "Administration", jobTitle: "CDC Analyst", channel: "Phone" },
    { istStaffId: "IST-00009", summary: "Collapsed briefly after severe stomach pain, now conscious but shaky and weak.", department: "Flight Operations", jobTitle: "Captain", channel: "Callback" },
    { istStaffId: "IST-00010", summary: "Severe belly pain for over an hour, just vomited and it had blood in it.", department: "Inflight Services", jobTitle: "Cabin Crew", channel: "Phone" },
    { istStaffId: "IST-00012", summary: "63-year-old with sudden severe abdominal pain, worse than anything before.", department: "Administration", jobTitle: "CDC Analyst", channel: "WhatsApp" },
    { istStaffId: "IST-00013", summary: "Vomiting green-colored fluid, abdomen pain has been getting worse over the last hour.", department: "Ground Operations", jobTitle: "Airport Customer Service", channel: "Phone" },
    { istStaffId: "IST-00015", summary: "Sounds extremely unwell on the phone, weak voice, reports bad stomach pain.", department: "Ground Operations", jobTitle: "Catering Coordinator", channel: "Callback" },
    { istStaffId: "IST-00017", summary: "Constant moderate stomach pain for about three hours, no vomiting so far.", department: "Administration", jobTitle: "HR Specialist", channel: "Phone" },
    { istStaffId: "IST-00021", summary: "Whites of the eyes look yellow, mild stomach discomfort for the last two days.", department: "Flight Operations", jobTitle: "First Officer", channel: "WhatsApp" },
    { istStaffId: "IST-00027", summary: "High fever around 103F along with a stomach ache since this morning.", department: "Flight Operations", jobTitle: "First Officer", channel: "Phone" },
    { istStaffId: "IST-00030", summary: "Severe stomach cramp that started about twenty minutes ago, nothing else yet.", department: "Inflight Services", jobTitle: "Cabin Supervisor", channel: "Callback" },
    { istStaffId: "IST-00032", summary: "Cramping stomach pain that comes and goes, going on for more than a day.", department: "Administration", jobTitle: "HR Specialist", channel: "Phone" },
    { istStaffId: "IST-00033", summary: "Noticed pink-tinged urine along with some mild stomach discomfort today.", department: "Ground Operations", jobTitle: "Ramp Agent", channel: "WhatsApp" },
    { istStaffId: "IST-00034", summary: "Vomited once this morning with a couple of streaks of blood, feels fine now.", department: "Inflight Services", jobTitle: "Cabin Supervisor", channel: "Phone" },
    { istStaffId: "IST-00038", summary: "Recurring stomach pain on and off for the past two months, nothing acute.", department: "Administration", jobTitle: "Medical Commission Clerk", channel: "Callback" },
    { istStaffId: "IST-00040", summary: "Constipated for a few days and noticed a little blood on the toilet paper.", department: "Flight Operations", jobTitle: "Captain", channel: "Phone" },
    { istStaffId: "IST-00042", summary: "Mild stomach ache for about the last hour, nothing else going on.", department: "Flight Operations", jobTitle: "First Officer", channel: "WhatsApp" },
    { istStaffId: "IST-00047", summary: "Occasional mild stomach cramps on and off today, otherwise feeling okay.", department: "Ground Operations", jobTitle: "Airport Customer Service", channel: "Phone" },
    { istStaffId: "IST-00048", summary: "Caller reports his colleague can't be woken up and is holding his stomach.", department: "Ground Operations", jobTitle: "Ramp Agent", channel: "Phone" },
    { istStaffId: "IST-00054", summary: "Noticed black, tarry-looking stools since yesterday plus abdominal discomfort.", department: "Inflight Services", jobTitle: "Cabin Crew", channel: "Callback" },
    { istStaffId: "IST-00055", summary: "Repeated vomiting with a greenish tinge and moderate stomach pain building for an hour.", department: "Engineering", jobTitle: "Avionics Engineer", channel: "WhatsApp" }
  ];

  return cases.map((testCase, index) => ({
    id: `case-abd-${9001 + index}`,
    istStaffId: testCase.istStaffId,
    organizationId: "org_ist_tech",
    organizationCode: "IST_TECH",
    targetOrganizationId: "org_ist_tech",
    targetOrganizationCode: "IST_TECH",
    status: "INCOMING",
    currentStage: "INTAKE",
    priorityScore: 0,
    patientType: "Staff",
    channel: testCase.channel,
    stationCode: "DOH",
    department: testCase.department,
    jobTitle: testCase.jobTitle,
    summary: testCase.summary,
    safetyFloorActive: false,
    identityValidated: false,
    sbarCopied: false,
    slaDeadlineIso: deadline(20),
    customAviationTags: ["stcc-licensed-test-case", "abdominal-pain-male"],
    createdAtIso,
    updatedAtIso: createdAtIso,
    transitionLogs: []
  }));
}

function initialQueueRecords(): QueueRecord[] {
  const createdAtIso = nowIso();
  const rows: QueueRecord[] = [
    {
      id: "case-10002",
      istStaffId: "IST-1001",
      dependentId: "dep_ist_1001_child_02",
      organizationId: "org_ist_tech",
      organizationCode: "IST_TECH",
      targetOrganizationId: "org_ist_tech",
      targetOrganizationCode: "IST_TECH",
      status: "INCOMING",
      currentStage: "INTAKE",
      priorityScore: 0,
      patientType: "Dependent",
      channel: "WhatsApp",
      stationCode: "DOH",
      department: "Family health",
      jobTitle: "Dependent child",
      summary: "Fever with fast breathing reported by parent.",
      safetyFloorActive: true,
      safetyFloorSource: "symptom",
      identityValidated: false,
      calculatedSeverity: "EMERGENCY",
      dispositionCode: "SIDRA_PEDIATRIC_ED",
      destinationName: "Sidra Medicine Emergency Department",
      sbarCopied: false,
      slaDeadlineIso: deadline(7),
      customAviationTags: ["dependent", "pediatric", "safety-floor"],
      createdAtIso,
      updatedAtIso: createdAtIso,
      transitionLogs: []
    },
    {
      id: "case-10001",
      istStaffId: "IST-10001",
      organizationId: "org_ist_tech",
      organizationCode: "IST_TECH",
      targetOrganizationId: "org_ist_tech",
      targetOrganizationCode: "IST_TECH",
      status: "IN_PROCESS",
      currentStage: "IDENTITY",
      priorityScore: 0,
      patientType: "Staff",
      channel: "Phone",
      stationCode: "DOH",
      department: "Flight Operations",
      jobTitle: "Cabin Crew",
      summary: "Chest tightness and sweating before duty report.",
      safetyFloorActive: true,
      safetyFloorSource: "symptom",
      identityValidated: true,
      calculatedSeverity: "EMERGENCY",
      dispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      destinationName: "Hamad Medical Corporation Emergency Department",
      sbarCopied: false,
      assignedNurseId: "demo-senior-triage-nurse",
      claimedAtIso: createdAtIso,
      slaDeadlineIso: deadline(4),
      lockedBy: "demo-senior-triage-nurse",
      lockExpiresAtIso: lockDeadline(),
      customAviationTags: ["cabin_crew", "fit-to-fly", "safety-floor"],
      createdAtIso,
      updatedAtIso: createdAtIso,
      transitionLogs: []
    },
    {
      id: "case-10003",
      istStaffId: "IST-1001",
      organizationId: "org_ist_tech",
      organizationCode: "IST_TECH",
      targetOrganizationId: "org_ist_tech",
      targetOrganizationCode: "IST_TECH",
      status: "IN_PROCESS",
      currentStage: "VITALS",
      priorityScore: 0,
      patientType: "Staff",
      channel: "Callback",
      stationCode: "LHR",
      department: "Flight Deck",
      jobTitle: "Pilot",
      summary: "Dizziness after long sector; fit-to-fly review requested.",
      vitals: { heartRate: 92, respiratoryRate: 16, spo2: 98, temperature: 36.8, consciousLevel: "alert" },
      safetyFloorActive: false,
      identityValidated: true,
      sbarCopied: false,
      assignedNurseId: "usr_nurse_10001",
      claimedAtIso: createdAtIso,
      slaDeadlineIso: deadline(11),
      lockedBy: "usr_nurse_10001",
      lockExpiresAtIso: lockDeadline(),
      customAviationTags: ["flight_deck", "outstation", "fit-to-fly"],
      createdAtIso,
      updatedAtIso: createdAtIso,
      transitionLogs: []
    },
    {
      id: "case-10005",
      istStaffId: "IST-2205",
      organizationId: "org_ist_tech",
      organizationCode: "IST_TECH",
      targetOrganizationId: "org_ist_tech",
      targetOrganizationCode: "IST_TECH",
      status: "IN_PROCESS",
      currentStage: "DISPOSITION",
      priorityScore: 0,
      patientType: "Staff",
      channel: "Phone",
      stationCode: "DOH",
      department: "Ground Operations",
      jobTitle: "Ground Operations",
      summary: "Back pain after ramp duty, reduced mobility, no trauma red flags.",
      vitals: { heartRate: 88, respiratoryRate: 18, spo2: 98, temperature: 36.9, consciousLevel: "alert" },
      matchedProtocolId: "back-pain-adult",
      calculatedSeverity: "URGENT",
      dispositionCode: "IST_OLD_AIRPORT_MEDICAL_COMMISSION",
      destinationName: "Occupational health clinician review",
      safetyFloorActive: false,
      identityValidated: true,
      sbarCopied: false,
      assignedNurseId: "demo-occupational-health-clinician",
      claimedAtIso: createdAtIso,
      slaDeadlineIso: deadline(13),
      customAviationTags: ["occupational"],
      createdAtIso,
      updatedAtIso: createdAtIso,
      transitionLogs: []
    },
    {
      id: "case-10004",
      istStaffId: "IST-3003",
      organizationId: "org_ist_tech",
      organizationCode: "IST_TECH",
      targetOrganizationId: "org_ist_tech",
      targetOrganizationCode: "IST_TECH",
      status: "INFO_REQUIRED",
      currentStage: "SBAR",
      priorityScore: 0,
      patientType: "Staff",
      channel: "Phone",
      stationCode: "DOH",
      department: "Airport Operations",
      jobTitle: "Operations Specialist",
      summary: "Mild sore throat, no red flags, requesting routine advice.",
      vitals: { heartRate: 78, respiratoryRate: 14, spo2: 99, temperature: 37.1, consciousLevel: "alert" },
      matchedProtocolId: "sore-throat-adult",
      calculatedSeverity: "ROUTINE",
      dispositionCode: "PHCC_URGENT_CARE_OR_TELECONSULT",
      destinationName: "PHCC urgent care or IST teleconsult",
      safetyFloorActive: false,
      identityValidated: true,
      clinicalApproval: { approvedBy: "Remote Triage Nurse", approvedAtIso: createdAtIso },
      sbarCopied: false,
      assignedNurseId: "demo-remote-triage-nurse",
      claimedAtIso: createdAtIso,
      slaDeadlineIso: deadline(16),
      customAviationTags: ["routine"],
      createdAtIso,
      updatedAtIso: createdAtIso,
      transitionLogs: []
    },
    ...abdominalPainMaleTestCases(createdAtIso)
  ];

  return rows.map((record) => {
    const hydrated = hydrateRecordIdentity(record);
    const prepared = ensurePreparedProtocol(hydrated);
    return {
      ...prepared,
      priorityScore: computePriority(prepared)
    };
  });
}

function store(): Map<string, QueueRecord> {
  if (!globalForQueue.istTriageQueueStore) {
    globalForQueue.istTriageQueueStore = new Map(initialQueueRecords().map((record) => [record.id, record]));
  }
  return globalForQueue.istTriageQueueStore;
}

export function resetQueueStoreForTests(): void {
  globalForQueue.istTriageQueueStore = new Map(initialQueueRecords().map((record) => [record.id, record]));
}

/**
 * One-time migration helper (see src/scripts/seedQueueDatabase.ts): inserts
 * the same starter records that back the in-memory store
 * (initialQueueRecords()) as real rows in triage_queue_items, so switching
 * QUEUE_DB_PERSISTENCE=true doesn't start from an empty queue. Safe to
 * re-run - each record is created with `skipDuplicates` semantics via a
 * pre-check rather than upsert, since QueueRecord has no natural unique key
 * besides id.
 */
async function insertQueueRecordIfAbsent(record: QueueRecord): Promise<boolean> {
  const existing = await queueClient().triageQueueItem.findUnique({ where: { id: record.id } });
  if (existing) {
    return false;
  }
  await queueClient().triageQueueItem.create({
    data: {
      id: record.id,
      istStaffId: record.istStaffId,
      // Not a Prisma Dependent row id - see queuePayloadFor's comment.
      dependentId: null,
      organizationId: record.organizationId,
      targetOrganizationId: record.targetOrganizationId,
      status: record.status,
      currentStage: record.currentStage,
      priorityScore: record.priorityScore,
      patientType: record.patientType,
      channel: record.channel,
      stationCode: record.stationCode,
      department: record.department,
      jobTitle: record.jobTitle,
      summary: record.summary,
      calculatedSeverity: record.calculatedSeverity,
      dispositionCode: record.dispositionCode,
      destinationName: record.destinationName,
      identityValidated: record.identityValidated,
      safetyFloorActive: record.safetyFloorActive,
      clinicalApproval: record.clinicalApproval,
      sbarCopied: record.sbarCopied,
      assignedNurseId: record.assignedNurseId,
      claimedAt: record.claimedAtIso ? new Date(record.claimedAtIso) : null,
      slaDeadline: new Date(record.slaDeadlineIso),
      customAviationTags: record.customAviationTags,
      queuePayload: queuePayloadFor(record)
    }
  });
  return true;
}

export async function seedQueueDatabaseFromInitialRecords(): Promise<{ inserted: number; skipped: number }> {
  const records = initialQueueRecords();
  let inserted = 0;
  let skipped = 0;
  for (const record of records) {
    if (await insertQueueRecordIfAbsent(record)) {
      inserted += 1;
    } else {
      skipped += 1;
    }
  }
  return { inserted, skipped };
}

export type BulkSyntheticCandidate = {
  istStaffId: string;
  department: string;
  jobTitle: string;
  ageYears: number;
  biologicalSex: "female" | "male" | "other" | "unknown";
};

/**
 * One record per real, currently-loaded protocol (see src/scripts/seedBulkSyntheticQueue.ts)
 * so validation testing has near-complete coverage of the actual content
 * package, not just the 20 hand-authored STCC abdominal-pain cases. The real
 * licensed STCC protocol is skipped here - it already has its own dedicated,
 * hand-written test cases (abdominalPainMaleTestCases) that shouldn't be
 * duplicated. Reason narratives are built from each open-source protocol's
 * own titleEn/clinicalDefinitionEn (our own authored content, never STCC's
 * licensed text), matched against a real HRMS candidate whose age/sex
 * satisfies that protocol's own ageMin/ageMax/genderRestriction, exactly like
 * abdominalPainMaleTestCases does for the STCC protocol.
 */
export async function seedBulkSyntheticQueueRecords(
  candidates: BulkSyntheticCandidate[],
  recordsPerProtocol = 1
): Promise<{ inserted: number; skipped: number; totalProtocols: number }> {
  const protocols = listClinicalProtocols().filter((protocol) => !protocol.id.startsWith("stcc-"));
  const createdAtIso = nowIso();
  const usedCandidates = new Set<string>();
  let inserted = 0;
  let skipped = 0;
  let cursor = 0;

  for (const protocol of protocols) {
    for (let variant = 1; variant <= recordsPerProtocol; variant++) {
      let match: BulkSyntheticCandidate | undefined;
      for (let attempt = 0; attempt < candidates.length; attempt++) {
        const candidate = candidates[(cursor + attempt) % candidates.length];
        if (usedCandidates.has(candidate.istStaffId)) continue;
        if (typeof protocol.ageMin === "number" && candidate.ageYears < protocol.ageMin) continue;
        if (typeof protocol.ageMax === "number" && candidate.ageYears > protocol.ageMax) continue;
        if (protocol.genderRestriction && protocol.genderRestriction !== candidate.biologicalSex) continue;
        match = candidate;
        cursor = (cursor + attempt + 1) % candidates.length;
        break;
      }
      if (!match) {
        skipped += 1;
        continue;
      }
      usedCandidates.add(match.istStaffId);

      const id = recordsPerProtocol > 1 ? `case-bulk-${protocol.id}-${variant}` : `case-bulk-${protocol.id}`;
      const summary = (protocol.clinicalDefinitionEn ?? protocol.titleEn).slice(0, 240);
      const baseRecord: QueueRecord = {
        id,
        istStaffId: match.istStaffId,
        organizationId: "org_ist_tech",
        organizationCode: "IST_TECH",
        targetOrganizationId: "org_ist_tech",
        targetOrganizationCode: "IST_TECH",
        status: "INCOMING",
        currentStage: "INTAKE",
        priorityScore: 0,
        patientType: "Staff",
        channel: "Phone",
        stationCode: "DOH",
        department: match.department,
        jobTitle: match.jobTitle,
        summary,
        safetyFloorActive: false,
        identityValidated: false,
        sbarCopied: false,
        slaDeadlineIso: deadline(30),
        customAviationTags: ["bulk-synthetic", protocol.id],
        createdAtIso,
        updatedAtIso: createdAtIso,
        transitionLogs: []
      };
      const hydrated = hydrateRecordIdentity(baseRecord);
      const prepared = ensurePreparedProtocol(hydrated);
      const record: QueueRecord = { ...prepared, priorityScore: computePriority(prepared) };

      if (await insertQueueRecordIfAbsent(record)) {
        inserted += 1;
      } else {
        skipped += 1;
      }
    }
  }

  return { inserted, skipped, totalProtocols: protocols.length };
}

function isSupervisor(session: AuthenticatedSession): boolean {
  return supervisorRoles.has(session.activeRole);
}

function hasManagerControl(session: AuthenticatedSession): boolean {
  return managerRoles.has(session.activeRole);
}

function isClinicalOperator(session: AuthenticatedSession): boolean {
  return clinicalOperatorRoles.has(session.activeRole) || isSupervisor(session);
}

function isCallIntake(session: AuthenticatedSession): boolean {
  return session.activeRole === "call_intake_coordinator";
}

function requireQueueAccess(session: AuthenticatedSession): void {
  if (
    !session.permissions.includes("triage.workspace.view") &&
    !session.permissions.includes("triage.queue.manage") &&
    !session.permissions.includes("admin.users.manage")
  ) {
    throw new QueueOrchestrationError(403, "Queue access denied for the active role.", "QUEUE_ACCESS_DENIED");
  }
}

function isGlobalTenantExempt(session: AuthenticatedSession): boolean {
  return session.activeRole === "platform_super_administrator" || session.activeRole === "system_administrator";
}

function requireTenantAccess(record: QueueRecord, session: AuthenticatedSession): void {
  if (isGlobalTenantExempt(session)) {
    return;
  }
  const userOrganizationId = session.user.organizationId;
  if (!userOrganizationId) {
    throw new QueueOrchestrationError(403, "Named user is not bound to an HRMS organization.", "QUEUE_TENANT_MISSING");
  }
  if (effectiveTargetOrganizationId(record) !== userOrganizationId) {
    throw new QueueOrchestrationError(403, "Queue item belongs to another organization.", "QUEUE_TENANT_DENIED");
  }
}

function canSeeTenant(record: QueueRecord, session: AuthenticatedSession): boolean {
  return isGlobalTenantExempt(session) || effectiveTargetOrganizationId(record) === session.user.organizationId;
}

function canTakeOverLock(session: AuthenticatedSession): boolean {
  return isSupervisor(session);
}

function isActiveForeignLock(record: QueueRecord, session: AuthenticatedSession): boolean {
  if (!record.lockedBy || record.lockedBy === session.user.id) {
    return false;
  }
  if (!record.lockExpiresAtIso) {
    return false;
  }
  return new Date(record.lockExpiresAtIso).getTime() > Date.now();
}

function requireUnlockedOrOwned(record: QueueRecord, session: AuthenticatedSession): void {
  if (isActiveForeignLock(record, session) && !canTakeOverLock(session)) {
    throw new QueueOrchestrationError(
      423,
      `Queue item ${record.id} is locked by another clinician until ${record.lockExpiresAtIso}.`,
      "QUEUE_ITEM_LOCKED"
    );
  }
}

function requireOwnClinicalCase(record: QueueRecord, session: AuthenticatedSession): void {
  if (isSupervisor(session)) {
    return;
  }
  if (!isClinicalOperator(session)) {
    throw new QueueOrchestrationError(403, "Active role cannot perform clinical queue movement.", "QUEUE_ROLE_DENIED");
  }
  if (record.assignedNurseId && record.assignedNurseId !== session.user.id) {
    throw new QueueOrchestrationError(403, "Remote triage nurses can move only their assigned cases.", "QUEUE_NOT_ASSIGNED");
  }
  if (record.lockedBy && record.lockedBy !== session.user.id) {
    throw new QueueOrchestrationError(423, "The queue item is locked by another clinician.", "QUEUE_ITEM_LOCKED");
  }
}

function validateMovePermissions(record: QueueRecord, session: AuthenticatedSession, request: QueueMoveRequest): void {
  requireUnlockedOrOwned(record, session);

  if (isCallIntake(session)) {
    if (request.toStatus !== "INCOMING" || request.toStage !== "INTAKE") {
      throw new QueueOrchestrationError(
        403,
        "Call intake coordinators can only return items to Incoming intake.",
        "QUEUE_ROLE_DENIED"
      );
    }
    return;
  }

  requireOwnClinicalCase(record, session);
}

function stageIndex(stage: QueueClinicalStage): number {
  return STAGE_ORDER.indexOf(stage);
}

function hasCompleteVitals(record: QueueRecord): boolean {
  return Boolean(record.vitals) || record.vitalsUnobtainable === true;
}

function validateClinicalSequence(record: QueueRecord, request: QueueMoveRequest): void {
  const targetStage = request.toStage;
  const movingForward = stageIndex(targetStage) > stageIndex(record.currentStage);
  const completing = request.toStatus === "COMPLETED";

  if (stageIndex(record.currentStage) >= stageIndex("DISPOSITION") && stageIndex(targetStage) < stageIndex("DISPOSITION")) {
    throw new QueueOrchestrationError(
      409,
      "Disposition has already been reached for this case. The record is read-only and cannot move back to an earlier stage.",
      "QUEUE_DISPOSITION_LOCKED"
    );
  }

  if (!movingForward && request.toStatus !== "COMPLETED") {
    return;
  }

  if (stageIndex(targetStage) >= stageIndex("VITALS") && !record.identityValidated) {
    throw new QueueOrchestrationError(400, "Identity validation is required before vitals/checklist work.", "QUEUE_SEQUENCE_BLOCKED");
  }
  if (stageIndex(targetStage) >= stageIndex("PROTOCOL") && !hasCompleteVitals(record)) {
    throw new QueueOrchestrationError(400, "Complete vital signs are required before protocol selection.", "QUEUE_SEQUENCE_BLOCKED");
  }
  if (stageIndex(targetStage) >= stageIndex("DISPOSITION") && !record.matchedProtocolId) {
    throw new QueueOrchestrationError(400, "Matched clinical protocol is required before disposition review.", "QUEUE_SEQUENCE_BLOCKED");
  }
  if (
    completing &&
    (!record.calculatedSeverity ||
      !record.dispositionCode ||
      !record.destinationName ||
      !record.clinicalApproval ||
      !record.sbarCopied ||
      // sbarCopied is only a boolean flag - checking it alone let a caller of
      // the context-update PATCH mark it true without ever actually
      // persisting the compiled note text, reaching COMPLETED with no SBAR
      // content at all (confirmed live: a call closed this way permanently
      // shows "closed before the SBAR note text was captured"). The real
      // "Copy SBAR" button always sets both together, but the backend gate
      // must enforce that pairing itself, not rely on the frontend's
      // cooperation.
      !record.sbarNoteText)
  ) {
    throw new QueueOrchestrationError(
      400,
      "Clinical approval, final route, and a captured SBAR note are required before completion.",
      "QUEUE_SEQUENCE_BLOCKED"
    );
  }
}

function matchesFilter(record: QueueRecord, filters: QueueListQuery): boolean {
  const textMatch = (value: string | undefined, expected: string | undefined) =>
    !expected || (value ?? "").toLowerCase().includes(expected.toLowerCase());
  const severity = record.calculatedSeverity === "SELF_CARE" ? "self-care" : record.calculatedSeverity?.toLowerCase();

  return (
    textMatch(severity, filters.severity) &&
    textMatch(record.stationCode, filters.station) &&
    textMatch(record.patientType, filters.patient_type) &&
    textMatch(record.jobTitle, filters.role) &&
    textMatch(record.department, filters.department) &&
    textMatch(record.channel, filters.channel) &&
    textMatch(record.currentStage, filters.stage) &&
    textMatch(record.assignedNurseId ?? record.lockedBy, filters.owner) &&
    (!filters.safety_floor_status ||
      (["active", "true", "yes"].includes(filters.safety_floor_status.toLowerCase())
        ? record.safetyFloorActive
        : !record.safetyFloorActive))
  );
}

// Real, licensed STCC protocols are named with a "stcc-" external id prefix
// (see src/data/stccLicensedContent/index.ts) to distinguish them from the
// synthetic open-source-guideline set ("oscg-"/"oscr-" prefixes). Surfacing
// them first lets validation testing focus on genuine STCC-backed records
// instead of them being buried among synthetic ones at the same priority tier.
function isRealStccProtocolMatch(record: QueueRecord): boolean {
  const protocolId = record.matchedProtocolId ?? record.preparedProtocol?.primaryProtocolId;
  return typeof protocolId === "string" && protocolId.startsWith("stcc-");
}

function sorted(records: QueueRecord[]): QueueRecord[] {
  return [...records].sort((left, right) => {
    const leftCompleted = left.status === "COMPLETED";
    const rightCompleted = right.status === "COMPLETED";
    if (leftCompleted !== rightCompleted) {
      // Open records first, completed ones after - priority/SLA ordering is
      // meaningless once a case is closed.
      return leftCompleted ? 1 : -1;
    }
    if (leftCompleted && rightCompleted) {
      // Most recently closed call first, so the Service Manager Board's
      // Closed column reads newest-to-oldest instead of an arbitrary
      // priority-score order left over from before completion.
      return new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime();
    }
    const leftIsStcc = isRealStccProtocolMatch(left);
    const rightIsStcc = isRealStccProtocolMatch(right);
    if (leftIsStcc !== rightIsStcc) {
      return leftIsStcc ? -1 : 1;
    }
    if (right.priorityScore !== left.priorityScore) {
      return right.priorityScore - left.priorityScore;
    }
    return new Date(left.slaDeadlineIso).getTime() - new Date(right.slaDeadlineIso).getTime();
  });
}

// Both windows are generous rather than tightly tuned - this is a query-result
// cap to protect the request from an unbounded table scan, not a product
// pagination limit. Neither open nor completed calls should silently vanish
// from the board/cockpit just because more test/real data accumulated than a
// small hardcoded number anticipated (previously 250/100, which capped the
// visible "Completed" count at 100 regardless of how many rows actually
// existed - a real gap, not deliberate pagination).
const OPEN_RECORDS_QUERY_LIMIT = 5000;
const COMPLETED_RECORDS_QUERY_LIMIT = 5000;

async function listDbRecords(filters: QueueListQuery): Promise<QueueRecord[]> {
  // Open and completed records are fetched with separate take() windows so
  // neither bucket can starve the other: a single combined query - even with
  // COMPLETED sorted last - still hits one shared take() cap, so once total
  // open records across all orgs exceeds that cap, completed calls vanish
  // from the list entirely (found via bulk end-to-end testing: 440 open
  // records system-wide left zero room for the 281 completed ones, even
  // though the UI's own Completed tab should always be able to show its own
  // items regardless of how many open calls exist elsewhere).
  // No transitionLogs relation here (unlike getDbRecord/saveDbRecord) - the
  // frontend never reads transitionLogs from the list response (confirmed:
  // zero references anywhere in frontend/src), so fetching up to 20 full
  // transition rows per record here was pure dead weight. With hundreds of
  // real records this alone was enough to balloon GET /api/v1/queue to
  // several megabytes per poll cycle, badly degrading UI responsiveness.
  const [openRows, completedRows] = await Promise.all([
    queueClient().triageQueueItem.findMany({
      where: { status: { not: "COMPLETED" } },
      orderBy: [{ priorityScore: "desc" }, { slaDeadline: "asc" }],
      take: OPEN_RECORDS_QUERY_LIMIT
    }),
    queueClient().triageQueueItem.findMany({
      where: { status: "COMPLETED" },
      orderBy: [{ updatedAt: "desc" }],
      take: COMPLETED_RECORDS_QUERY_LIMIT
    })
  ]);
  const rows = [...openRows, ...completedRows];
  return sorted(rows.map(dbRowToRecord).filter((record) => matchesFilter(record, filters)));
}

async function getDbRecord(id: string): Promise<QueueRecord | undefined> {
  const row = await queueClient().triageQueueItem.findUnique({
    where: { id },
    include: { transitionLogs: { orderBy: { timestamp: "desc" }, take: 20 } }
  });
  return row ? dbRowToRecord(row) : undefined;
}

// TriageQueueItem.matchedProtocolId is a real FK to MdbAlgorithm.algorithmId
// (the vendor's actual integer AlgorithmID), but every in-app consumer of
// matchedProtocolId deals in the app-facing string protocol id (e.g.
// "stcc-abdominal-pain-male") used by
// searchClinicalProtocols()/getClinicalProtocolById(). Resolve the string id
// to its real vendor integer id here so we never write a value the FK
// constraint would reject; the string id itself still round-trips via
// queuePayload.
async function resolveAlgorithmDbId(externalProtocolId: string | undefined): Promise<number | null> {
  return resolveMdbAlgorithmId(externalProtocolId);
}

async function saveDbRecord(record: QueueRecord): Promise<QueueRecord> {
  // Prisma treats `undefined` in an update's data object as "field not
  // provided" (leaves the column untouched), not "set to null" - so clearing
  // a nullable field (e.g. releaseQueueItem setting lockedBy = undefined)
  // silently no-ops unless undefined is coalesced to null explicitly here.
  const updated = await queueClient().triageQueueItem.update({
    where: { id: record.id },
    data: {
      status: record.status,
      currentStage: record.currentStage,
      organizationId: record.organizationId ?? null,
      targetOrganizationId: record.targetOrganizationId ?? null,
      priorityScore: record.priorityScore,
      vitals: record.vitals ?? null,
      matchedProtocolId: await resolveAlgorithmDbId(record.matchedProtocolId),
      calculatedSeverity: record.calculatedSeverity ?? null,
      dispositionCode: record.dispositionCode ?? null,
      destinationName: record.destinationName ?? null,
      identityValidated: record.identityValidated,
      safetyFloorActive: record.safetyFloorActive,
      clinicalApproval: record.clinicalApproval ?? null,
      sbarCopied: record.sbarCopied,
      assignedNurseId: record.assignedNurseId ?? null,
      claimedAt: record.claimedAtIso ? new Date(record.claimedAtIso) : null,
      lockedBy: record.lockedBy ?? null,
      lockExpiresAt: record.lockExpiresAtIso ? new Date(record.lockExpiresAtIso) : null,
      summary: record.summary,
      customAviationTags: record.customAviationTags,
      queuePayload: queuePayloadFor(record)
    },
    include: { transitionLogs: { orderBy: { timestamp: "desc" }, take: 20 } }
  });
  return dbRowToRecord(updated);
}

async function addDbTransition(record: QueueRecord, transition: QueueTransitionLogDto): Promise<void> {
  await queueClient().queueTransitionLog.create({
    data: {
      id: transition.id,
      queueItemId: record.id,
      actorId: transition.actorId,
      actorOrganizationId: transition.actorOrganizationId,
      actorRole: transition.actorRole,
      targetOrganizationId: transition.targetOrganizationId,
      eventType: transition.eventType ?? "QUEUE_TRANSITION",
      fromStatus: transition.fromStatus,
      toStatus: transition.toStatus,
      fromStage: transition.fromStage,
      toStage: transition.toStage,
      reason: transition.reason,
      auditSignature: transition.auditSignature,
      tracePayload: {
        queueItemId: record.id,
        fromStatus: transition.fromStatus,
        toStatus: transition.toStatus,
        fromStage: transition.fromStage,
        toStage: transition.toStage,
        reason: transition.reason,
        actorId: transition.actorId,
        actorOrganizationId: transition.actorOrganizationId,
        actorRole: transition.actorRole,
        targetOrganizationId: transition.targetOrganizationId,
        eventType: transition.eventType ?? "QUEUE_TRANSITION",
        timestampIso: transition.timestampIso
      },
      timestamp: new Date(transition.timestampIso)
    }
  });
}

function getMockRecord(id: string): QueueRecord | undefined {
  return store().get(id);
}

function saveMockRecord(record: QueueRecord): QueueRecord {
  store().set(record.id, record);
  return record;
}

async function getRecord(id: string): Promise<QueueRecord> {
  const record = shouldPersistQueueInDatabase() ? await getDbRecord(id) : getMockRecord(id);
  if (!record) {
    throw new QueueOrchestrationError(404, `Queue item ${id} was not found.`, "QUEUE_NOT_FOUND");
  }
  return record;
}

async function saveRecord(record: QueueRecord): Promise<QueueRecord> {
  return shouldPersistQueueInDatabase() ? saveDbRecord(record) : saveMockRecord(record);
}

function appendTransition(
  record: QueueRecord,
  session: AuthenticatedSession,
  previous: Pick<QueueRecord, "status" | "currentStage">,
  reason: string | undefined,
  options: { eventType?: string; targetOrganizationId?: string } = {}
): QueueTransitionLogDto {
  const timestampIso = nowIso();
  const eventType = options.eventType ?? "QUEUE_TRANSITION";
  const targetOrganizationId = options.targetOrganizationId ?? effectiveTargetOrganizationId(record);
  const tracePayload = {
    queueItemId: record.id,
    actorId: session.user.id,
    actorOrganizationId: session.user.organizationId,
    actorRole: session.activeRole,
    targetOrganizationId,
    eventType,
    fromStatus: previous.status,
    toStatus: record.status,
    fromStage: previous.currentStage,
    toStage: record.currentStage,
    reason: reason ?? "Queue transition",
    timestampIso
  };
  const transition: QueueTransitionLogDto = {
    id: `qlog-${randomUUID()}`,
    queueItemId: record.id,
    actorId: session.user.id,
    actorOrganizationId: session.user.organizationId,
    actorRole: session.activeRole,
    targetOrganizationId,
    eventType,
    fromStatus: previous.status,
    toStatus: record.status,
    fromStage: previous.currentStage,
    toStage: record.currentStage,
    reason,
    auditSignature: auditSignatureFor(tracePayload),
    timestampIso
  };
  record.transitionLogs = [transition, ...record.transitionLogs].slice(0, 20);
  return transition;
}

export async function listQueueItems(session: AuthenticatedSession, filters: QueueListQuery = {}): Promise<QueueItemDto[]> {
  requireQueueAccess(session);
  const records = shouldPersistQueueInDatabase()
    ? await listDbRecords(filters)
    : sorted(Array.from(store().values()).filter((record) => matchesFilter(record, filters)));
  return records.filter((record) => canSeeTenant(record, session)).map(toDto);
}

/**
 * One-time maintenance: persists the correct preparedProtocol (including
 * ragShadow) back to every existing queue record so ensurePreparedProtocol()'s
 * already-prepared cache check passes on future reads. Needed only for rows
 * saved before the preparedProtocolFromUnknown() ragShadow round-trip fix -
 * without this, every existing record keeps recomputing its full protocol
 * match against every protocol on every single list/get request forever,
 * since nothing else ever re-persists it. Bypasses session/lock/role checks
 * entirely (an internal data-repair operation, not a clinical action) and
 * writes directly via saveRecord so status (including COMPLETED, which the
 * normal PATCH endpoint locks) is never a blocker.
 */
export async function backfillPreparedProtocolCache(): Promise<{ processed: number; recomputed: number }> {
  const records = shouldPersistQueueInDatabase()
    ? await listDbRecords({})
    : Array.from(store().values());
  let recomputed = 0;
  for (const record of records) {
    const before = record.preparedProtocol?.ragShadow;
    const prepared = ensurePreparedProtocol(record);
    if (!before || prepared !== record) {
      await saveRecord(prepared);
      recomputed++;
    }
  }
  return { processed: records.length, recomputed };
}

export async function getQueueItem(session: AuthenticatedSession, id: string): Promise<QueueItemDto> {
  requireQueueAccess(session);
  const record = await getRecord(id);
  requireTenantAccess(record, session);
  return toDto(record);
}

export async function deleteQueueItem(session: AuthenticatedSession, id: string): Promise<void> {
  requireQueueAccess(session);
  if (!hasManagerControl(session)) {
    throw new QueueOrchestrationError(403, "Only queue manager roles can delete queue items.", "QUEUE_ROLE_DENIED");
  }
  const record = await getRecord(id);
  requireTenantAccess(record, session);

  if (shouldPersistQueueInDatabase()) {
    await queueClient().triageQueueItem.delete({ where: { id } });
    return;
  }
  store().delete(id);
}

export async function createQueueItem(session: AuthenticatedSession, request: QueueCreateRequest): Promise<QueueItemDto> {
  requireQueueAccess(session);
  if (!isCallIntake(session) && !hasManagerControl(session) && !isClinicalOperator(session)) {
    throw new QueueOrchestrationError(
      403,
      "Only intake, queue manager, or clinical operator roles can create queue items.",
      "QUEUE_ROLE_DENIED"
    );
  }
  const createdAtIso = request.seedCreatedAtIso && isMockMode() ? request.seedCreatedAtIso : nowIso();
  const organizationId = request.organizationId ?? session.user.organizationId ?? "org_ist_tech";
  const targetOrganizationId = request.targetOrganizationId ?? organizationId;
  const staffValidation = await validateStaffMember(request.istStaffId);
  if (!staffValidation.valid || !staffValidation.profile) {
    throw new QueueOrchestrationError(
      404,
      staffValidation.reason ?? "Staff identity could not be validated from HRMS.",
      "QUEUE_HRMS_IDENTITY_FAILED"
    );
  }
  const dependent = findDependent(staffValidation.profile, request.dependentId);
  if (request.dependentId && !dependent) {
    throw new QueueOrchestrationError(
      400,
      "Dependent is not mapped to the validated staff member.",
      "QUEUE_HRMS_DEPENDENT_FAILED"
    );
  }
  const ageResolution = resolvePatientAgeFromDirectory({
    istStaffId: request.istStaffId,
    dependentId: request.dependentId,
    referenceDate: new Date(createdAtIso)
  });
  if (!ageResolution.ok) {
    throw new QueueOrchestrationError(ageResolution.status, ageResolution.reason, "QUEUE_HRMS_AGE_FAILED");
  }
  const patientType = request.dependentId ? "Dependent" : request.patientType;
  const record: QueueRecord = {
    id: `case-${randomUUID()}`,
    istStaffId: request.istStaffId,
    dependentId: request.dependentId,
    organizationId,
    organizationCode: organizationCodeFor(organizationId),
    targetOrganizationId,
    targetOrganizationCode: organizationCodeFor(targetOrganizationId),
    status: "INCOMING",
    currentStage: "INTAKE",
    priorityScore: 0,
    patientType,
    channel: request.channel,
    stationCode: request.stationCode,
    department: request.department ?? staffValidation.profile.department,
    jobTitle: request.jobTitle ?? (dependent ? `${dependent.relationshipType} dependent` : staffValidation.profile.jobTitle),
    summary: request.summary,
    reasonNarrative: request.reasonNarrative ?? request.summary,
    identityValidated: true,
    identityValidationSource: "HRMS_AUTO",
    identityValidationMessage: "Validated from HRMS before the call entered the clinical queue.",
    identityValidatedAtIso: createdAtIso,
    patientAge: ageSnapshotFromResolution(ageResolution),
    safetyFloorActive: request.safetyFloorActive,
    sbarCopied: false,
    slaDeadlineIso: deadline(request.slaMinutes),
    customAviationTags: [],
    createdAtIso,
    updatedAtIso: createdAtIso,
    transitionLogs: []
  };
  const preparedRecord = ensurePreparedProtocol(record);
  record.reasonNarrative = preparedRecord.reasonNarrative;
  record.preparedProtocol = preparedRecord.preparedProtocol;
  record.priorityScore = computePriority(record);
  // Every call is conceptually an IVR/call-center call - the caller's reason
  // is always "captured from the call" even in this dry-run environment, so
  // reasonCallCapture is populated at creation time for every call, not only
  // ones that go through an explicit later capture step. A real STT/
  // telephony vendor drop-in still only changes reasonForCallVoiceCapture.ts.
  record.reasonCallCapture = await captureReasonForCallAudio({ simulatedTranscriptText: record.reasonNarrative });

  if (shouldPersistQueueInDatabase()) {
    const row = await queueClient().triageQueueItem.create({
      data: {
        id: record.id,
        istStaffId: record.istStaffId,
        // Not a Prisma Dependent row id - see queuePayloadFor's comment.
        dependentId: null,
        organizationId: record.organizationId,
        targetOrganizationId: record.targetOrganizationId,
        status: record.status,
        currentStage: record.currentStage,
        priorityScore: record.priorityScore,
        patientType: record.patientType,
        channel: record.channel,
        stationCode: record.stationCode,
        department: record.department,
        jobTitle: record.jobTitle,
        summary: record.summary,
        identityValidated: record.identityValidated,
        safetyFloorActive: record.safetyFloorActive,
        sbarCopied: record.sbarCopied,
        slaDeadline: new Date(record.slaDeadlineIso),
        customAviationTags: record.customAviationTags,
        queuePayload: queuePayloadFor(record)
      },
      include: { transitionLogs: true }
    });
    return toDto(dbRowToRecord(row));
  }

  return toDto(saveMockRecord(record));
}

export async function claimQueueItem(session: AuthenticatedSession, id: string): Promise<QueueItemDto> {
  requireQueueAccess(session);
  if (!isClinicalOperator(session) && !hasManagerControl(session)) {
    throw new QueueOrchestrationError(403, "Active role cannot claim clinical queue items.", "QUEUE_ROLE_DENIED");
  }

  const record = await getRecord(id);
  requireTenantAccess(record, session);
  requireUnlockedOrOwned(record, session);
  const previous = { status: record.status, currentStage: record.currentStage };
  const claimedAtIso = nowIso();
  record.lockedBy = session.user.id;
  record.assignedNurseId = session.user.id;
  record.claimedAtIso = claimedAtIso;
  record.lockExpiresAtIso = lockDeadline();
  if (record.status === "INCOMING") {
    record.status = "IN_PROCESS";
  }
  record.updatedAtIso = claimedAtIso;
  const transition = appendTransition(record, session, previous, "Queue item claimed and locked for active triage.");
  record.priorityScore = computePriority(record);
  const saved = await saveRecord(record);
  if (shouldPersistQueueInDatabase()) {
    await addDbTransition(saved, transition);
  }
  return toDto(saved);
}

export async function nextBestCall(session: AuthenticatedSession): Promise<QueueItemDto> {
  requireQueueAccess(session);
  const candidates = await listQueueItems(session, {});
  const candidate = candidates.find((item) => item.status !== "COMPLETED" && !isActiveForeignLock(itemToRecord(item), session));
  if (!candidate) {
    throw new QueueOrchestrationError(404, "No claimable queue item is available.", "QUEUE_EMPTY");
  }
  return claimQueueItem(session, candidate.id);
}

function itemToRecord(item: QueueItemDto): QueueRecord {
  return {
    ...item,
    transitionLogs: item.transitionLogs ?? []
  };
}

export async function releaseQueueItem(session: AuthenticatedSession, id: string): Promise<QueueItemDto> {
  requireQueueAccess(session);
  const record = await getRecord(id);
  requireTenantAccess(record, session);
  // Releasing is idempotent: a record with no active lock has nothing to
  // protect, so a second/duplicate release call should be a harmless no-op
  // rather than a 423 - only a genuinely different lock owner is rejected.
  if (record.lockedBy && record.lockedBy !== session.user.id && !canTakeOverLock(session)) {
    throw new QueueOrchestrationError(423, "Only the lock owner or a supervisor can release this queue item.", "QUEUE_ITEM_LOCKED");
  }
  if (!record.lockedBy) {
    return toDto(record);
  }
  const previous = { status: record.status, currentStage: record.currentStage };
  record.lockedBy = undefined;
  record.lockExpiresAtIso = undefined;
  record.updatedAtIso = nowIso();
  const transition = appendTransition(record, session, previous, "Queue item released.");
  const saved = await saveRecord(record);
  if (shouldPersistQueueInDatabase()) {
    await addDbTransition(saved, transition);
  }
  return toDto(saved);
}

export async function heartbeatQueueItem(session: AuthenticatedSession, id: string): Promise<QueueItemDto> {
  requireQueueAccess(session);
  const record = await getRecord(id);
  requireTenantAccess(record, session);
  if (record.lockedBy !== session.user.id && !canTakeOverLock(session)) {
    throw new QueueOrchestrationError(423, "Only the lock owner can refresh this queue item.", "QUEUE_ITEM_LOCKED");
  }
  record.lockExpiresAtIso = lockDeadline();
  record.updatedAtIso = nowIso();
  const saved = await saveRecord(record);
  return toDto(saved);
}

export async function updateQueueContext(
  session: AuthenticatedSession,
  id: string,
  update: QueueContextUpdate
): Promise<QueueItemDto> {
  requireQueueAccess(session);
  const record = await getRecord(id);
  requireTenantAccess(record, session);
  requireUnlockedOrOwned(record, session);
  if (record.status === "COMPLETED") {
    throw new QueueOrchestrationError(
      409,
      "This encounter is completed and its clinical record is locked. Reopen it explicitly before editing.",
      "QUEUE_ITEM_COMPLETED_LOCKED"
    );
  }
  if (stageIndex(record.currentStage) >= stageIndex("DISPOSITION") && record.dispositionCode) {
    const editsClinicalFields =
      (update.vitals && partialVitalsChanged(update.vitals, record.vitals)) ||
      (typeof update.vitalsUnobtainable === "boolean" && update.vitalsUnobtainable !== record.vitalsUnobtainable) ||
      (update.matchedProtocolId && update.matchedProtocolId !== record.matchedProtocolId) ||
      (update.initialAssessmentResponses &&
        JSON.stringify(update.initialAssessmentResponses) !== JSON.stringify(record.initialAssessmentResponses)) ||
      (update.taqResponses && JSON.stringify(update.taqResponses) !== JSON.stringify(record.taqResponses)) ||
      (update.calculatedSeverity && update.calculatedSeverity !== record.calculatedSeverity) ||
      (update.dispositionCode && update.dispositionCode !== record.dispositionCode) ||
      (update.destinationName && update.destinationName !== record.destinationName);
    if (editsClinicalFields) {
      throw new QueueOrchestrationError(
        409,
        "Disposition has already been reached for this case. The record is read-only; only SBAR/hand-off fields can still be recorded.",
        "QUEUE_DISPOSITION_LOCKED"
      );
    }
  }

  if (
    isCallIntake(session) &&
    (update.vitals ||
      update.matchedProtocolId ||
      update.calculatedSeverity ||
      update.dispositionCode ||
      update.initialAssessmentResponses ||
      update.taqResponses)
  ) {
    throw new QueueOrchestrationError(403, "Call intake coordinators cannot edit clinical queue context.", "QUEUE_ROLE_DENIED");
  }
  if (!isCallIntake(session)) {
    requireOwnClinicalCase(record, session);
  }

  if (typeof update.identityValidated === "boolean") record.identityValidated = update.identityValidated;
  if (update.vitals) {
    // Merge, not replace - the nurse enters vitals one field at a time
    // (see QueueContextUpdateSchema's comment), so each request only ever
    // carries the fields changed so far.
    record.vitals = { ...record.vitals, ...update.vitals } as QueueVitals;
    if (redFloorFromVitals(record.vitals)) {
      record.safetyFloorActive = true;
      record.safetyFloorSource = "vitals";
      record.calculatedSeverity = "EMERGENCY";
    }
  }
  if (update.matchedProtocolId) record.matchedProtocolId = update.matchedProtocolId;
  const floorBlocksDowngrade =
    record.safetyFloorActive &&
    record.calculatedSeverity === "EMERGENCY" &&
    Boolean(update.calculatedSeverity) &&
    update.calculatedSeverity !== "EMERGENCY";
  if (update.calculatedSeverity && !floorBlocksDowngrade) {
    record.calculatedSeverity = update.calculatedSeverity;
    if (update.calculatedSeverity === "EMERGENCY") {
      record.safetyFloorActive = true;
      record.safetyFloorSource = update.floorSource ?? record.safetyFloorSource ?? "judgment";
    }
  }
  if (update.dispositionCode && !floorBlocksDowngrade) record.dispositionCode = update.dispositionCode;
  if (update.destinationName && !floorBlocksDowngrade) record.destinationName = update.destinationName;
  if (update.initialAssessmentResponses) record.initialAssessmentResponses = update.initialAssessmentResponses;
  if (update.taqResponses) record.taqResponses = update.taqResponses;
  if (update.sbarNoteText) record.sbarNoteText = update.sbarNoteText;
  if (update.fitToFlyStatus) record.fitToFlyStatus = update.fitToFlyStatus;
  if (typeof update.vitalsUnobtainable === "boolean") record.vitalsUnobtainable = update.vitalsUnobtainable;
  if (update.clinicalApproval) record.clinicalApproval = update.clinicalApproval;
  if (typeof update.sbarCopied === "boolean") record.sbarCopied = update.sbarCopied;
  if (update.summary) record.summary = update.summary;
  if (update.reasonNarrative) record.reasonNarrative = update.reasonNarrative;
  if (update.reasonCallCapture) {
    record.reasonCallCapture = update.reasonCallCapture;
  } else if (update.reasonNarrative) {
    // Every call is conceptually captured from the call itself - if the
    // reason text changed (nurse correction, or a caller callback updating
    // their description) without an explicit capture payload, refresh the
    // capture to match so it never drifts out of sync with what's actually
    // displayed/played back.
    record.reasonCallCapture = await captureReasonForCallAudio({ simulatedTranscriptText: update.reasonNarrative });
  }
  if (update.summary || update.reasonNarrative) {
    const preparedRecord = ensurePreparedProtocol(record);
    record.reasonNarrative = preparedRecord.reasonNarrative;
    record.preparedProtocol = preparedRecord.preparedProtocol;
  }
  if (update.assignedNurseId && (hasManagerControl(session) || session.permissions.includes("triage.queue.manage"))) {
    record.assignedNurseId = update.assignedNurseId;
  }

  record.priorityScore = computePriority(record);
  record.updatedAtIso = nowIso();
  return toDto(await saveRecord(record));
}

export async function moveQueueItem(
  session: AuthenticatedSession,
  id: string,
  request: QueueMoveRequest
): Promise<QueueItemDto> {
  requireQueueAccess(session);
  const record = await getRecord(id);
  requireTenantAccess(record, session);
  if (record.status === "COMPLETED" && request.toStatus !== "COMPLETED") {
    throw new QueueOrchestrationError(
      409,
      "This encounter is completed and its clinical record is locked. Reopen it explicitly before moving it.",
      "QUEUE_ITEM_COMPLETED_LOCKED"
    );
  }
  validateMovePermissions(record, session, request);
  validateClinicalSequence(record, request);

  const previous = { status: record.status, currentStage: record.currentStage };
  record.currentStage = request.toStage;
  if (request.toStatus) {
    record.status = request.toStatus;
  } else if (request.toStage === COMPLETED_STAGE && record.clinicalApproval && record.sbarCopied) {
    record.status = "COMPLETED";
  } else if (record.status === "INCOMING") {
    record.status = "IN_PROCESS";
  }
  if (previous.status !== "COMPLETED" && record.status === "COMPLETED") {
    recordCompletion(record.id);
  }

  record.updatedAtIso = nowIso();
  const transition = appendTransition(record, session, previous, request.reason);
  record.priorityScore = computePriority(record);
  const saved = await saveRecord(record);
  if (shouldPersistQueueInDatabase()) {
    await addDbTransition(saved, transition);
  }
  return toDto(saved);
}

export async function escalateQueueItemToOrganization(
  session: AuthenticatedSession,
  id: string,
  request: QueueHandoverRequest
): Promise<QueueItemDto> {
  requireQueueAccess(session);
  const record = await getRecord(id);
  requireTenantAccess(record, session);
  requireUnlockedOrOwned(record, session);
  if (!isClinicalOperator(session) && !hasManagerControl(session)) {
    throw new QueueOrchestrationError(403, "Active role cannot perform escalation handover.", "QUEUE_ROLE_DENIED");
  }

  const previous = { status: record.status, currentStage: record.currentStage };
  record.targetOrganizationId = request.targetOrganizationId;
  record.targetOrganizationCode = request.targetOrganizationCode ?? organizationCodeFor(request.targetOrganizationId);
  record.status = "INCOMING";
  record.lockedBy = undefined;
  record.lockExpiresAtIso = undefined;
  record.assignedNurseId = undefined;
  record.updatedAtIso = nowIso();
  const transition = appendTransition(record, session, previous, request.reason, {
    eventType: "ESCALATION_HANDOVER",
    targetOrganizationId: request.targetOrganizationId
  });
  record.priorityScore = computePriority(record);
  const saved = await saveRecord(record);
  if (shouldPersistQueueInDatabase()) {
    await addDbTransition(saved, transition);
  }
  return toDto(saved);
}

export async function releaseQueueLocksForUser(userId: string): Promise<number> {
  if (shouldPersistQueueInDatabase()) {
    const result = await queueClient().triageQueueItem.updateMany({
      where: { lockedBy: userId },
      data: {
        status: "INCOMING",
        lockedBy: null,
        lockExpiresAt: null,
        assignedNurseId: null
      }
    });
    return result.count;
  }

  let released = 0;
  for (const record of store().values()) {
    if (record.lockedBy === userId) {
      record.status = "INCOMING";
      record.lockedBy = undefined;
      record.lockExpiresAtIso = undefined;
      record.assignedNurseId = undefined;
      record.updatedAtIso = nowIso();
      saveMockRecord(record);
      released += 1;
    }
  }
  return released;
}
