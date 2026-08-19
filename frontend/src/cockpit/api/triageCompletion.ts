const apiBase = import.meta.env.VITE_API_BASE_URL || "";

/**
 * POST /api/v1/triage/complete is now idempotent on queueItemId - the backend
 * (persistCompletedTriageNote) checks for an existing aviationTriageEncounter
 * with the same sourceQueueItemId before creating a new one, so a genuine
 * retry with the same queueItemId returns the already-persisted encounter
 * instead of creating a duplicate row. The frontend still calls it at most
 * once per completion attempt and never automatically retries, and a failed
 * attempt requires an explicit user-initiated retry - not because the backend
 * can't handle a retry safely now, but because there's no reason to retry
 * automatically on a genuine failure without the nurse's awareness.
 */
export type TriageCompleteResponse = {
  notePayload: unknown;
  fitToFlyStatus?: "CLEARED" | "RESTRICTED" | "MEDICAL_REVIEW_REQUIRED";
  clipboardOptimized: true;
};

export async function compileTriageCompletion(
  queueItemId: string,
  request: Record<string, unknown>
): Promise<TriageCompleteResponse> {
  const response = await fetch(`${apiBase}/api/v1/triage/complete`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ queueItemId, ...request })
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? `SBAR compilation failed with ${response.status}`);
  }
  return payload as TriageCompleteResponse;
}

/**
 * Read-only counterpart to compileTriageCompletion() - calls /triage/preview,
 * which compiles the same bilingual note but never persists an encounter
 * row, so it's safe to call any number of times (e.g. every time an
 * already-closed call whose note wasn't captured at completion time is
 * reopened for review).
 */
export async function previewTriageCompletion(request: Record<string, unknown>): Promise<TriageCompleteResponse> {
  const response = await fetch(`${apiBase}/api/v1/triage/preview`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? `SBAR preview failed with ${response.status}`);
  }
  return payload as TriageCompleteResponse;
}

export type FitToFlyPreviewResponse = {
  fitToFlyStatus: "CLEARED" | "RESTRICTED" | "MEDICAL_REVIEW_REQUIRED";
};

/**
 * Side-effect-free fit-to-fly computation, callable as soon as a disposition
 * is reached - unlike compileTriageCompletion(), this never persists an
 * encounter row, so the Disposition & Advice stage can call it automatically
 * without waiting for (or requiring) the SBAR compile/complete flow.
 */
export async function fetchFitToFlyPreview(request: {
  jobTitle?: string;
  finalDispositionCode: string;
  customAviationTags: string[];
  calculatedSeverity?: "EMERGENCY" | "URGENT" | "ROUTINE" | "SELF_CARE";
}): Promise<FitToFlyPreviewResponse> {
  const response = await fetch(`${apiBase}/api/v1/triage/fit-to-fly-preview`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? payload.message ?? `Fit-to-fly preview failed with ${response.status}`);
  }
  return payload as FitToFlyPreviewResponse;
}
