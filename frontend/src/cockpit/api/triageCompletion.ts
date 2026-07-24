const apiBase = import.meta.env.VITE_API_BASE_URL || "";

/**
 * POST /api/v1/triage/complete is NOT confirmed idempotent - the backend
 * handler calls persistCompletedTriageNote(), which (when database
 * persistence is enabled) creates a brand-new aviationTriageEncounter row on
 * every call, with no dedup key. Two calls with identical input produce two
 * distinct rows. This is a genuine backend gap (see plan section 3, item 5) -
 * the frontend must not paper over it by treating a client-side cache as a
 * substitute for real idempotency. We call it at most once per completion
 * attempt and never automatically retry it; a failed attempt requires an
 * explicit user-initiated retry, and even then step B is only re-run if we
 * have no prior successful response cached for THIS in-memory session (a
 * display cache, not a durability guarantee).
 */
export type TriageCompleteResponse = {
  notePayload: unknown;
  fitToFlyStatus?: unknown;
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
