import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type QueueStatus = "INCOMING" | "IN_PROCESS" | "INFO_REQUIRED" | "COMPLETED";
export type QueueClinicalStage = "INTAKE" | "IDENTITY" | "VITALS" | "PROTOCOL" | "DISPOSITION" | "SBAR";
export type QueueSeverity = "EMERGENCY" | "URGENT" | "ROUTINE" | "SELF_CARE";

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

export type QueuePreparedProtocol = {
  status: "PENDING_REASON" | "PREPARED" | "NO_MATCH";
  sourceType: "synthetic-sample" | "licensed-stcc" | "local-qatar-override";
  releaseVersion: string;
  reasonNarrative: string;
  extractedKeywords: string[];
  primaryProtocolId?: string;
  primaryProtocolTitle?: string;
  suggestions: QueueProtocolSuggestion[];
  acuityQuestionPreview: QueueProtocolQuestionPreview[];
  resourceSectionsAvailable: {
    background: boolean;
    firstAid: boolean;
    careAdvice: boolean;
    seeMoreAppropriateGuideline: boolean;
  };
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
  clinicalApproval?: Record<string, unknown>;
  sbarCopied: boolean;
  assignedNurseId?: string;
  claimedAtIso?: string;
  slaDeadlineIso: string;
  lockedBy?: string;
  lockExpiresAtIso?: string;
  customAviationTags: string[];
  createdAtIso: string;
  updatedAtIso: string;
};

type QueueContextValue = {
  queue: QueueItem[];
  activeItem?: QueueItem;
  loading: boolean;
  error?: string;
  refreshQueue: () => Promise<void>;
  claimItem: (id: string) => Promise<QueueItem>;
  releaseItem: (id: string) => Promise<QueueItem>;
  moveItem: (id: string, toStage: QueueClinicalStage, toStatus?: QueueStatus, reason?: string) => Promise<QueueItem>;
  updateItemContext: (id: string, update: Record<string, unknown>) => Promise<QueueItem>;
  openItemInStep: (id: string) => Promise<void>;
  setActiveItemById: (id: string) => void;
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
  }, [refreshQueue]);

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

  const openItemInStep = useCallback(
    async (id: string) => {
      await claimItem(id);
      window.location.hash = "#/workspace";
    },
    [claimItem]
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
      refreshQueue,
      claimItem,
      releaseItem,
      moveItem,
      updateItemContext,
      openItemInStep,
      setActiveItemById
    }),
    [
      activeItem,
      claimItem,
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
