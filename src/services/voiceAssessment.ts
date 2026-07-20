import { randomUUID } from "node:crypto";
import { isMockMode } from "../config/runtime.js";
import { getClinicalProtocolById, getCurrentClinicalContentPackage } from "./clinicalContent.js";
import { DeterministicVoiceResponseInterpreter, type VoiceResponseInterpreter } from "./voiceInterpreter.js";
import type { AuthenticatedSession } from "../types/security.js";
import {
  MedGemmaVoiceTrainingExampleSchema,
  type MedGemmaVoiceTrainingExample,
  type StartVoiceAssessmentInput,
  type SubmitVoiceResponseInput,
  type ValidateVoiceTurnInput,
  type VoiceQuestionDto,
  type VoiceSessionDto,
  type VoiceTurnDto
} from "../types/voiceAssessment.js";

const MAX_CLARIFICATION_ATTEMPTS = 1;

const globalForVoiceAssessment = globalThis as unknown as {
  istVoiceAssessmentSessions?: Map<string, VoiceSessionDto>;
};

function sessions(): Map<string, VoiceSessionDto> {
  globalForVoiceAssessment.istVoiceAssessmentSessions ??= new Map<string, VoiceSessionDto>();
  return globalForVoiceAssessment.istVoiceAssessmentSessions;
}

export class VoiceAssessmentError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "VoiceAssessmentError";
  }
}

function requireMockPersistence(): void {
  if (!isMockMode()) {
    throw new VoiceAssessmentError(
      "Database-backed voice assessment persistence must be enabled before live use.",
      "VOICE_ASSESSMENT_PERSISTENCE_NOT_CONFIGURED",
      503
    );
  }
}

function questionDto(
  question: NonNullable<ReturnType<typeof getClinicalProtocolById>>["initialAssessmentQuestions"][number]
): VoiceQuestionDto {
  return {
    id: question.id,
    sequence: question.sequence,
    responseType: question.responseType,
    promptTextEn: question.promptTextEn,
    clarificationPromptEn: question.clarificationPromptEn,
    deliveryMode: "TEXT_SIMULATION"
  };
}

function copySession(session: VoiceSessionDto): VoiceSessionDto {
  return structuredClone(session);
}

function requireSession(sessionId: string): VoiceSessionDto {
  const session = sessions().get(sessionId);
  if (!session) {
    throw new VoiceAssessmentError("Voice assessment session not found.", "VOICE_SESSION_NOT_FOUND", 404);
  }
  return session;
}

function hasAnyPermission(actor: AuthenticatedSession, permissions: string[]): boolean {
  return permissions.some((permission) => actor.permissions.includes(permission));
}

function requireClinicalSessionAccess(actor: AuthenticatedSession, session: VoiceSessionDto): void {
  const canSupervise = hasAnyPermission(actor, ["triage.queue.manage", "admin.users.manage"]);
  if (session.createdByUserId !== actor.user.id && !canSupervise) {
    throw new VoiceAssessmentError(
      "This voice assessment belongs to another named user.",
      "VOICE_SESSION_ACCESS_DENIED",
      403
    );
  }
}

function requireTrainingExportAccess(actor: AuthenticatedSession): void {
  if (
    !hasAnyPermission(actor, [
      "clinical.governance.approve",
      "protocol.library.manage",
      "audit.events.view"
    ])
  ) {
    throw new VoiceAssessmentError(
      "Voice training examples require governance, protocol, or audit access.",
      "VOICE_TRAINING_EXPORT_ACCESS_DENIED",
      403
    );
  }
}

function requireActiveSession(session: VoiceSessionDto): void {
  if (session.status !== "ACTIVE") {
    throw new VoiceAssessmentError(
      `Voice assessment session is ${session.status} and cannot accept another response.`,
      "VOICE_SESSION_NOT_ACTIVE",
      409
    );
  }
}

function questionForSession(session: VoiceSessionDto) {
  const protocol = getClinicalProtocolById(session.protocolId);
  const question = protocol?.initialAssessmentQuestions.find(
    (candidate) => candidate.id === session.currentQuestion?.id
  );
  if (!protocol || !question) {
    throw new VoiceAssessmentError(
      "The active initial-assessment question is not available in the pinned content release.",
      "VOICE_QUESTION_NOT_FOUND",
      409
    );
  }
  return { protocol, question };
}

function pendingNurseValidation(turn: VoiceTurnDto): boolean {
  return turn.status === "AWAITING_NURSE_VALIDATION" && turn.validationStatus === "PENDING";
}

function acceptedTurn(turn: VoiceTurnDto): boolean {
  return turn.validationStatus === "VALIDATED" || turn.validationStatus === "CORRECTED";
}

function completeIfValidated(session: VoiceSessionDto): void {
  const acceptedAnswerTurns = session.turns.filter(
    (turn) => turn.classification === "YES" || turn.classification === "NO" || turn.classification === "OPEN_TEXT"
  );
  if (
    !session.currentQuestion &&
    acceptedAnswerTurns.length > 0 &&
    acceptedAnswerTurns.every(acceptedTurn)
  ) {
    session.status = "COMPLETED";
    session.completedAt = new Date().toISOString();
  } else if (!session.currentQuestion) {
    session.status = "AWAITING_NURSE_VALIDATION";
  }
}

function saveSession(session: VoiceSessionDto): VoiceSessionDto {
  sessions().set(session.id, session);
  return copySession(session);
}

export function resetVoiceAssessmentStoreForTests(): void {
  globalForVoiceAssessment.istVoiceAssessmentSessions = new Map<string, VoiceSessionDto>();
}

export async function startVoiceAssessment(
  actor: AuthenticatedSession,
  input: StartVoiceAssessmentInput
): Promise<VoiceSessionDto> {
  requireMockPersistence();
  const protocol = getClinicalProtocolById(input.protocolId);
  if (!protocol) {
    throw new VoiceAssessmentError("Clinical protocol not found.", "VOICE_PROTOCOL_NOT_FOUND", 404);
  }
  const questions = [...protocol.initialAssessmentQuestions].sort(
    (left, right) => left.sequence - right.sequence
  );
  if (questions.length === 0) {
    throw new VoiceAssessmentError(
      "This protocol does not contain approved initial-assessment prompts.",
      "VOICE_INITIAL_ASSESSMENT_NOT_AVAILABLE",
      409
    );
  }

  const now = new Date().toISOString();
  return saveSession({
    id: `voice-${randomUUID()}`,
    createdByUserId: actor.user.id,
    protocolId: protocol.id,
    protocolTitleEn: protocol.titleEn,
    releaseVersion: getCurrentClinicalContentPackage().release.version,
    language: "en",
    status: "ACTIVE",
    queueItemId: input.queueItemId,
    callCenterSessionId: input.callCenterSessionId,
    recordingGovernance: {
      noticePlayed: true,
      authorizationStatus: input.recordingAuthorizationStatus,
      rawRecordingRagEligible: false,
      storageRegion: "me-central1"
    },
    currentQuestion: questionDto(questions[0]),
    clarificationAttempts: 0,
    maxClarificationAttempts: MAX_CLARIFICATION_ATTEMPTS,
    turns: [],
    startedAt: now
  });
}

export async function getVoiceAssessmentSession(
  actor: AuthenticatedSession,
  sessionId: string
): Promise<VoiceSessionDto> {
  requireMockPersistence();
  const session = requireSession(sessionId);
  requireClinicalSessionAccess(actor, session);
  return copySession(session);
}

export async function submitVoiceAssessmentResponse(
  actor: AuthenticatedSession,
  sessionId: string,
  input: SubmitVoiceResponseInput,
  interpreter: VoiceResponseInterpreter = new DeterministicVoiceResponseInterpreter()
): Promise<VoiceSessionDto> {
  requireMockPersistence();
  const session = requireSession(sessionId);
  requireClinicalSessionAccess(actor, session);
  requireActiveSession(session);
  const { protocol, question } = questionForSession(session);
  const attempt = session.turns.filter((turn) => turn.questionId === question.id).length + 1;
  const interpretation = await interpreter.interpret({
    questionId: question.id,
    responseType: question.responseType,
    promptTextEn: question.promptTextEn,
    emergencyKeywords: question.emergencyKeywords,
    transcriptText: input.transcriptText,
    interrupted: input.interrupted,
    sttConfidence: input.sttConfidence
  });

  const turn: VoiceTurnDto = {
    id: `turn-${randomUUID()}`,
    questionId: question.id,
    sequence: question.sequence,
    attempt,
    promptTextEn:
      session.clarificationAttempts > 0 && question.clarificationPromptEn
        ? question.clarificationPromptEn
        : question.promptTextEn,
    transcriptText: input.transcriptText,
    speechStartedAtMs: input.speechStartedAtMs,
    speechEndedAtMs: input.speechEndedAtMs,
    sttConfidence: input.sttConfidence,
    classification: interpretation.result.classification,
    structuredAnswer: interpretation.result.value,
    confidence: interpretation.result.confidence,
    evidence: interpretation.result.evidence,
    interpreterProvider: interpretation.context.provider,
    interpreterModel: interpretation.context.model,
    interpreterVersion: interpretation.context.version,
    status: "AWAITING_NURSE_VALIDATION",
    validationStatus: "PENDING"
  };

  if (interpretation.result.requiresNurseTakeover || interpretation.result.classification === "EMERGENCY_SIGNAL") {
    turn.status = "AWAITING_NURSE_VALIDATION";
    session.turns.push(turn);
    session.status = "NURSE_TAKEOVER";
    session.takeoverReason =
      interpretation.result.takeoverReason ?? "Emergency language requires immediate nurse review.";
    return saveSession(session);
  }

  if (
    interpretation.result.classification === "UNCERTAIN" ||
    interpretation.result.classification === "INTERRUPTED"
  ) {
    turn.status = "NEEDS_CLARIFICATION";
    session.turns.push(turn);
    if (session.clarificationAttempts < session.maxClarificationAttempts) {
      session.clarificationAttempts += 1;
      session.currentQuestion = {
        ...questionDto(question),
        promptTextEn: question.clarificationPromptEn ?? question.promptTextEn
      };
    } else {
      session.status = "NURSE_TAKEOVER";
      session.takeoverReason = "The caller response remained uncertain after the permitted clarification.";
    }
    return saveSession(session);
  }

  session.turns.push(turn);
  session.clarificationAttempts = 0;
  const orderedQuestions = [...protocol.initialAssessmentQuestions].sort(
    (left, right) => left.sequence - right.sequence
  );
  const nextQuestion = orderedQuestions.find((candidate) => candidate.sequence > question.sequence);
  session.currentQuestion = nextQuestion ? questionDto(nextQuestion) : undefined;
  completeIfValidated(session);
  return saveSession(session);
}

export async function validateVoiceAssessmentTurn(
  actor: AuthenticatedSession,
  sessionId: string,
  turnId: string,
  input: ValidateVoiceTurnInput
): Promise<VoiceSessionDto> {
  requireMockPersistence();
  const session = requireSession(sessionId);
  requireClinicalSessionAccess(actor, session);
  const turn = session.turns.find((candidate) => candidate.id === turnId);
  if (!turn) {
    throw new VoiceAssessmentError("Voice assessment turn not found.", "VOICE_TURN_NOT_FOUND", 404);
  }
  if (!pendingNurseValidation(turn)) {
    throw new VoiceAssessmentError(
      "Only a pending interpreted answer can be validated.",
      "VOICE_TURN_NOT_PENDING_VALIDATION",
      409
    );
  }

  turn.validatedBy = actor.user.id;
  turn.validatedAt = new Date().toISOString();
  turn.validationComment = input.comment;
  if (input.decision === "VALIDATE") {
    turn.validationStatus = "VALIDATED";
    turn.status = "VALIDATED";
  } else if (input.decision === "CORRECT") {
    turn.validationStatus = "CORRECTED";
    turn.status = "VALIDATED";
    turn.nurseCorrectedAnswer = input.correctedAnswer;
  } else {
    turn.validationStatus = "REJECTED";
    turn.status = "REJECTED";
    session.status = "NURSE_TAKEOVER";
    session.takeoverReason = "A nurse rejected the interpreted response.";
  }
  completeIfValidated(session);
  return saveSession(session);
}

export async function requestVoiceAssessmentNurseTakeover(
  actor: AuthenticatedSession,
  sessionId: string,
  reason: string
): Promise<VoiceSessionDto> {
  requireMockPersistence();
  const session = requireSession(sessionId);
  requireClinicalSessionAccess(actor, session);
  if (session.status === "COMPLETED" || session.status === "CANCELLED") {
    throw new VoiceAssessmentError(
      "A completed or cancelled session cannot be moved to nurse takeover.",
      "VOICE_TAKEOVER_NOT_ALLOWED",
      409
    );
  }
  session.status = "NURSE_TAKEOVER";
  session.takeoverReason = reason;
  return saveSession(session);
}

export async function buildMedGemmaVoiceTrainingExamples(
  actor: AuthenticatedSession,
  sessionId: string
): Promise<MedGemmaVoiceTrainingExample[]> {
  requireMockPersistence();
  requireTrainingExportAccess(actor);
  const session = requireSession(sessionId);
  const protocol = getClinicalProtocolById(session.protocolId);
  if (!protocol) {
    throw new VoiceAssessmentError("Clinical protocol not found.", "VOICE_PROTOCOL_NOT_FOUND", 404);
  }

  return session.turns.flatMap((turn) => {
    if (!acceptedTurn(turn) || !turn.transcriptText?.trim()) {
      return [];
    }
    const question = protocol.initialAssessmentQuestions.find((candidate) => candidate.id === turn.questionId);
    if (!question) {
      return [];
    }
    const approved = turn.nurseCorrectedAnswer ??
      (turn.classification && turn.structuredAnswer !== undefined
        ? {
            classification: turn.classification,
            value: turn.structuredAnswer
          }
        : undefined);
    if (
      !approved ||
      (approved.classification !== "YES" &&
        approved.classification !== "NO" &&
        approved.classification !== "OPEN_TEXT")
    ) {
      return [];
    }
    return [
      MedGemmaVoiceTrainingExampleSchema.parse({
        exampleId: `voice-training-${turn.id}`,
        task: "BOUNDED_INITIAL_ASSESSMENT_INTERPRETATION",
        protocolId: session.protocolId,
        releaseVersion: session.releaseVersion,
        questionId: question.id,
        responseType: question.responseType,
        promptTextEn: question.promptTextEn,
        transcriptText: turn.transcriptText,
        approvedClassification: approved.classification,
        approvedValue: approved.value,
        evidence: turn.evidence,
        source: "NURSE_VALIDATED_VOICE_TURN"
      })
    ];
  });
}
