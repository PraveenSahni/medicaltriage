// Shared transient-failure retry/backoff for outbound HTTP calls - closes
// NFR-112 (Resiliency) for integration points that had no retry at all
// (Twilio SMS/WhatsApp, Microsoft Graph email in src/services/
// communicationAdapters.ts). Mirrors the reasoning already proven in
// src/integration/fhirWriteback.ts's postDocumentReference(): retry a
// network error or 5xx (the far side is briefly unavailable), never retry a
// 4xx (a bad token or malformed request fails identically on every attempt,
// so retrying only delays surfacing a real error). Kept as its own small
// helper rather than importing fhirWriteback.ts's internal function, since
// that one is shaped around throwing on any non-2xx - callers here need the
// raw Response back (including non-2xx) so they can build their own
// provider-specific error message from the body.
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 250;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<Response> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, init);
      const isTransient = response.status >= 500;
      if (!isTransient || attempt === maxAttempts) {
        return response;
      }
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw error;
      }
      await sleep(baseDelayMs * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}
