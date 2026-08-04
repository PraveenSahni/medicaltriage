import { fetchWithRetry } from "../src/utils/httpRetry.js";

// Closes NFR-112 (Resiliency) for outbound integration calls that previously
// had no retry at all (Twilio SMS/WhatsApp, Microsoft Graph email) - mirrors
// the reasoning already proven for FHIR writeback: retry a transient failure
// (network error or 5xx), never retry a 4xx.
describe("fetchWithRetry", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  function mockResponse(status: number): Response {
    return { status, ok: status >= 200 && status < 300 } as Response;
  }

  it("returns immediately on a successful response, no retry", async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockResponse(200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchWithRetry("https://example.test", {}, { maxAttempts: 3, baseDelayMs: 1 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 4xx - surfaces it immediately", async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockResponse(400));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchWithRetry("https://example.test", {}, { maxAttempts: 3, baseDelayMs: 1 });
    expect(response.status).toBe(400);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries a transient 503 and succeeds on a later attempt", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(mockResponse(503))
      .mockResolvedValueOnce(mockResponse(200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchWithRetry("https://example.test", {}, { maxAttempts: 3, baseDelayMs: 1 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after maxAttempts on a persistent 503", async () => {
    const fetchMock = jest.fn().mockResolvedValue(mockResponse(503));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchWithRetry("https://example.test", {}, { maxAttempts: 3, baseDelayMs: 1 });
    expect(response.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("retries a network error (thrown rejection) and succeeds on a later attempt", async () => {
    const fetchMock = jest.fn().mockRejectedValueOnce(new Error("network down")).mockResolvedValueOnce(mockResponse(200));
    global.fetch = fetchMock as unknown as typeof fetch;

    const response = await fetchWithRetry("https://example.test", {}, { maxAttempts: 3, baseDelayMs: 1 });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws after maxAttempts of persistent network errors", async () => {
    const fetchMock = jest.fn().mockRejectedValue(new Error("network down"));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(fetchWithRetry("https://example.test", {}, { maxAttempts: 3, baseDelayMs: 1 })).rejects.toThrow(
      "network down"
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
