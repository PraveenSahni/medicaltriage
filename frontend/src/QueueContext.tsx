import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type QueueStatus = "INCOMING" | "IN_PROCESS" | "INFO_REQUIRED" | "COMPLETED";
export type QueueClinicalStage = "INTAKE" | "IDENTITY" | "VITALS" | "PROTOCOL" | "DISPOSITION" | "SBAR";
export type QueueSeverity = "EMERGENCY" | "URGENT" | "ROUTINE" | "SELF_CARE";
export type SafetyFloorSource = "vitals" | "symptom" | "judgment";

export type QueueVitals = {
  heartRate: number;
  respiratoryRate: number;
  spo2: number;
  temperature: number;
  consciousLevel: "alert" | "voice" | "pain" | "unresponsive";
};

export type QueuePatientAgeSnapshot = {
  source: "staff" | "dependent";
  ageYears: number;
  ageMonths: number;
  dateOfBirthIso?: string;
  calculatedFrom: "HRMS_DATE_OF_BIRTH" | "HRMS_AGE_FIELD";
  biologicalSex?: "female" | "male" | "other" | "unknown";
};

export type QueueProtocolSuggestion = {
  protocolId: string;
  titleEn: string;
  score: number;
  matchedTerms: string[];
  questionCount: number;
  highestSeverity: "Emergency" | "Urgent" | "Routine" | "Self-care";
  releaseVersion: string;
};

export type QueueProtocolQuestionPreview = {
  id: string;
  acuityOrder: number;
  severity: "Emergency" | "Urgent" | "Routine" | "Self-care";
  questionTextEn: string;
  dispositionCode: string;
  redFlag: boolean;
  careAdviceIds: string[];
};

export type StccProcessStepStatus = "NOT_STARTED" | "READY" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";

export type StccProcessStep = {
  id:
    | "OPENING_SCRIPT"
    | "REASON_FOR_VISIT"
    | "GUIDELINE_SELECTION"
    | "INITIAL_ASSESSMENT_QUESTIONS"
    | "TRIAGE_ASSESSMENT_QUESTIONS"
    | "TELEMEDICINE_ELIGIBLE"
    | "TRIAGE_DISPOSITION"
    | "CARE_ADVICE"
    | "HANDOFF_REFERRAL"
    | "CLOSING_SCRIPT";
  label: string;
  lane: "CALL_OPENING" | "GUIDELINE_SELECTION" | "ASSESSMENT" | "DISPOSITION_AND_CLOSE";
  status: StccProcessStepStatus;
  deterministicOwner: "SYSTEM" | "NURSE" | "SYSTEM_AND_NURSE";
  nurseActionRequired: boolean;
  notes: string[];
  sourceBoundary: "HRMS" | "STCC_CONTENT" | "LOCAL_QATAR_OVERLAY" | "NURSE_DOCUMENTATION";
};

export type StccVisibleActionTab =
  | "REASON_AND_EMERGENCY_RULE_OUT"
  | "QUESTIONS"
  | "DISPOSITION_AND_CARE_ADVICE"
  | "SBAR_COMPLETE";

export type StccProcessSnapshot = {
  processName: "Telehealth Triage Encounter";
  averageDurationMinutes: "11-13";
  currentActionTab: StccVisibleActionTab;
  canonicalSteps: StccProcessStep[];
  visibleActionTabs: Array<{
    id: StccVisibleActionTab;
    label: string;
    mappedStepIds: StccProcessStep["id"][];
  }>;
};

export type RagShadowSuggestion = {
  mode: "DRY_RUN_SHADOW";
  boundary: "APPROVED_CONTENT_ONLY";
  sourceType:
    | "synthetic-sample"
    | "licensed-stcc"
    | "local-qatar-override"
    | "open-source-clinical-rule"
    | "open-source-guideline";
  sourceReleaseVersion: string;
  query: string;
  extractedReason: {
    normalizedReason: string;
    keywords: string[];
    possibleRedFlags: string[];
  };
  retrieval: {
    eventId: string;
    corpusIds: string[];
    retrievedSourceIds: string[];
    retrievedSnippetHashes: string[];
    confidence: number;
  };
  suggestedProtocolCandidates: QueueProtocolSuggestion[];
  comparison: {
    deterministicPrimaryProtocolId?: string;
    shadowPrimaryProtocolId?: string;
    agreement: "FULL_MATCH" | "PARTIAL_MATCH" | "NO_MATCH" | "NO_DETERMINISTIC_CANDIDATE" | "NO_SHADOW_CANDIDATE";
    reasonCode: string;
  };
  prohibitedActionAcknowledgement: string[];
  cannotDecideDisposition: true;
  requiresNurseReview: true;
  generatedAtIso: string;
};

export type QueueCareAdvice = {
  id: string;
  titleEn: string;
  instructionTextEn: string;
  patientSendable: boolean;
  adviceCategory?: "DISPOSITION" | "NOTE_TO_TRIAGER" | "GENERAL" | "CALL_BACK_IF";
};

export type QueuePreparedProtocol = {
  status: "PENDING_REASON" | "PREPARED" | "NO_MATCH";
  sourceType:
    | "synthetic-sample"
    | "licensed-stcc"
    | "local-qatar-override"
    | "open-source-clinical-rule"
    | "open-source-guideline";
  releaseVersion: string;
  reasonNarrative: string;
  extractedKeywords: string[];
  primaryProtocolId?: string;
  primaryProtocolTitle?: string;
  suggestions: QueueProtocolSuggestion[];
  acuityQuestionPreview: QueueProtocolQuestionPreview[];
  careAdviceItems: QueueCareAdvice[];
  resourceSectionsAvailable: {
    background: boolean;
    firstAid: boolean;
    careAdvice: boolean;
    seeMoreAppropriateGuideline: boolean;
  };
  ragShadow?: RagShadowSuggestion;
  preparedAtIso: string;
};

export type QueueItem = {
  id: string;
  istStaffId: string;
  dependentId?: string;
  organizationId?: string;
  organizationCode?: string;
  targetOrganizationId?: string;
  targetOrganizationCode?: string;
  status: QueueStatus;
  currentStage: QueueClinicalStage;
  priorityScore: number;
  patientType: "Staff" | "Dependent";
  channel: string;
  stationCode?: string;
  department?: string;
  jobTitle?: string;
  summary: string;
  reasonNarrative?: string;
  preparedProtocol?: QueuePreparedProtocol;
  stccProcess: StccProcessSnapshot;
  vitals?: QueueVitals;
  matchedProtocolId?: string;
  calculatedSeverity?: QueueSeverity;
  dispositionCode?: string;
  destinationName?: string;
  identityValidated: boolean;
  identityValidationSource?: "HRMS_AUTO" | "HRMS_LOOKUP_FAILED";
  identityValidationMessage?: string;
  identityValidatedAtIso?: string;
  patientAge?: QueuePatientAgeSnapshot;
  safetyFloorActive: boolean;
  safetyFloorSource?: SafetyFloorSource;
  initialAssessmentResponses?: Record<string, string>;
  taqResponses?: Record<string, boolean>;
  careAdviceAcknowledgements?: Record<string, { givenNow?: boolean; sendLater?: boolean }>;
  vitalsUnobtainable?: boolean;
  clinicalApproval?: Record<string, unknown>;
  sbarCopied: boolean;
  assignedNurseId?: string;
  claimedAtIso?: string;
  slaDeadlineIso: string;
  lockedBy?: string;
  lockedByName?: string;
  lockExpiresAtIso?: string;
  customAviationTags: string[];
  createdAtIso: string;
  updatedAtIso: string;
};

export type CallCenterSession = {
  id: string;
  queueItemId?: string;
  provider: string;
  externalCallId: string;
  direction: "INBOUND" | "OUTBOUND";
  channel: "Phone" | "Callback";
  status: "OFFERED" | "WAITING_CALLBACK" | "CONNECTING" | "CONNECTED" | "HELD" | "ENDED" | "NO_ANSWER" | "FAILED";
  recording?: {
    purpose: "SERVICE_QUALITY_AND_SAFETY";
    noticePlayed: boolean;
    noticeVersion: string;
    consentStatus: "NOT_CAPTURED" | "GRANTED" | "DECLINED" | "LEGAL_BASIS";
    storageRegion: "me-central1";
    ragEligible: false;
  };
  updatedAtIso: string;
};

type QueueContextValue = {
  queue: QueueItem[];
  activeItem?: QueueItem;
  loading: boolean;
  error?: string;
  /** queueItemId -> CallCenterSession, joined on CallCenterSession.queueItemId === QueueItem.id */
  callCenterSessionsByQueueItemId: Record<string, CallCenterSession>;
  refreshQueue: () => Promise<void>;
  claimItem: (id: string) => Promise<QueueItem>;
  connectCall: (
    id: string,
    action?: "ANSWER" | "START_CALLBACK" | "HOLD" | "RESUME" | "END"
  ) => Promise<{ item: QueueItem; call: CallCenterSession }>;
  releaseItem: (id: string) => Promise<QueueItem>;
  moveItem: (id: string, toStage: QueueClinicalStage, toStatus?: QueueStatus, reason?: string) => Promise<QueueItem>;
  updateItemContext: (id: string, update: Record<string, unknown>) => Promise<QueueItem>;
  openItemInStep: (id: string) => Promise<void>;
  setActiveItemById: (id: string) => void;
  clearActiveItem: () => void;
};

const QueueContext = createContext<QueueContextValue | undefined>(undefined);
const apiBase = import.meta.env.VITE_API_BASE_URL || "";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? `Queue request failed with ${response.status}`);
  }
  return payload;
}

export function QueueProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeItem, setActiveItem] = useState<QueueItem | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [callCenterSessionsByQueueItemId, setCallCenterSessionsByQueueItemId] = useState<
    Record<string, CallCenterSession>
  >({});

  const refreshCallCenterSessions = useCallback(async () => {
    try {
      const response = await fetch(`${apiBase}/api/v1/call-center/sessions`, { credentials: "include" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { sessions?: CallCenterSession[] } | CallCenterSession[];
      const sessions = Array.isArray(payload) ? payload : payload.sessions ?? [];
      const byQueueItemId: Record<string, CallCenterSession> = {};
      for (const session of sessions) {
        if (session.queueItemId) {
          byQueueItemId[session.queueItemId] = session;
        }
      }
      setCallCenterSessionsByQueueItemId(byQueueItemId);
    } catch {
      // Non-fatal - hold-state badges just stay stale until the next poll.
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await readJson<{ queue: QueueItem[] }>(
        await fetch(`${apiBase}/api/v1/queue`, { credentials: "include" })
      );
      setQueue(payload.queue);
      setActiveItem((current) => (current ? payload.queue.find((item) => item.id === current.id) ?? current : current));
      setError(undefined);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Queue unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshQueue();
    void refreshCallCenterSessions();
    const handle = window.setInterval(() => {
      void refreshQueue();
      void refreshCallCenterSessions();
    }, 15_000);
    return () => window.clearInterval(handle);
  }, [refreshQueue, refreshCallCenterSessions]);

  const updateOne = useCallback((item: QueueItem) => {
    setQueue((current) => {
      const exists = current.some((candidate) => candidate.id === item.id);
      const next = exists ? current.map((candidate) => (candidate.id === item.id ? item : candidate)) : [item, ...current];
      return [...next].sort((left, right) => right.priorityScore - left.priorityScore);
    });
    setActiveItem(item);
    return item;
  }, []);

  const claimItem = useCallback(
    async (id: string) => {
      const payload = await readJson<{ item: QueueItem }>(
        await fetch(`${apiBase}/api/v1/queue/${encodeURIComponent(id)}/claim`, {
          method: "POST",
          credentials: "include"
        })
      );
      return updateOne(payload.item);
    },
    [updateOne]
  );

  const connectCall = useCallback(
    async (id: string, action?: "ANSWER" | "START_CALLBACK" | "HOLD" | "RESUME" | "END") => {
      const item = queue.find((candidate) => candidate.id === id);
      const resolvedAction = action ?? (item?.channel === "Callback" ? "START_CALLBACK" : "ANSWER");
      const payload = await readJson<{ item: QueueItem; call: CallCenterSession }>(
        await fetch(`${apiBase}/api/v1/call-center/queue/${encodeURIComponent(id)}/command`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: resolvedAction })
        })
      );
      updateOne(payload.item);
      setCallCenterSessionsByQueueItemId((current) => ({ ...current, [id]: payload.call }));
      return payload;
    },
    [queue, updateOne]
  );

  const releaseItem = useCallback(
    async (id: string) => {
      const payload = await readJson<{ item: QueueItem }>(
        await fetch(`${apiBase}/api/v1/queue/${encodeURIComponent(id)}/release`, {
          method: "POST",
          credentials: "include"
        })
      );
      return updateOne(payload.item);
    },
    [updateOne]
  );

  const moveItem = useCallback(
    async (id: string, toStage: QueueClinicalStage, toStatus?: QueueStatus, reason?: string) => {
      const payload = await readJson<{ item: QueueItem }>(
        await fetch(`${apiBase}/api/v1/queue/${encodeURIComponent(id)}/move`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toStage, toStatus, reason })
        })
      );
      return updateOne(payload.item);
    },
    [updateOne]
  );

  const updateItemContext = useCallback(
    async (id: string, update: Record<string, unknown>) => {
      const payload = await readJson<{ item: QueueItem }>(
        await fetch(`${apiBase}/api/v1/queue/${encodeURIComponent(id)}/context`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(update)
        })
      );
      return updateOne(payload.item);
    },
    [updateOne]
  );

  const setActiveItemById = useCallback(
    (id: string) => {
      const next = queue.find((item) => item.id === id);
      if (next) {
        setActiveItem(next);
      }
    },
    [queue]
  );

  // Matches the preview's completeCurrentCall() (activeIdx = null): without
  // this, the sidebar's tagForItem keeps treating the just-completed call as
  // still "active" (activeItemId stays truthy), so every other waiting call
  // shows Queue Locked until the page is reloaded - the nurse would be stuck
  // unable to pick up the next call.
  const clearActiveItem = useCallback(() => {
    setActiveItem(undefined);
  }, []);

  const openItemInStep = useCallback(
    async (id: string) => {
      await connectCall(id);
      window.location.hash = "#/workspace";
    },
    [connectCall]
  );

  useEffect(() => {
    if (!activeItem || activeItem.status !== "IN_PROCESS" || !activeItem.lockedBy) {
      return;
    }
    const handle = window.setInterval(() => {
      fetch(`${apiBase}/api/v1/queue/${encodeURIComponent(activeItem.id)}/heartbeat`, {
        method: "POST",
        credentials: "include"
      })
        .then((response) => (response.ok ? response.json() : undefined))
        .then((payload: { item?: QueueItem } | undefined) => {
          if (payload?.item) {
            updateOne(payload.item);
          }
        })
        .catch(() => {
          setError("Queue lock heartbeat failed. Refresh before continuing clinical edits.");
        });
    }, 120_000);
    return () => window.clearInterval(handle);
  }, [activeItem, updateOne]);

  const value = useMemo<QueueContextValue>(
    () => ({
      queue,
      activeItem,
      loading,
      error,
      callCenterSessionsByQueueItemId,
      refreshQueue,
      claimItem,
      connectCall,
      releaseItem,
      moveItem,
      updateItemContext,
      openItemInStep,
      setActiveItemById,
      clearActiveItem
    }),
    [
      activeItem,
      callCenterSessionsByQueueItemId,
      claimItem,
      clearActiveItem,
      connectCall,
      error,
      loading,
      moveItem,
      openItemInStep,
      queue,
      refreshQueue,
      releaseItem,
      setActiveItemById,
      updateItemContext
    ]
  );

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const value = useContext(QueueContext);
  if (!value) {
    throw new Error("useQueue must be used inside QueueProvider");
  }
  return value;
}
