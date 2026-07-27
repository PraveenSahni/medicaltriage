/**
 * Demo-only call generator for the Triage Service Manager Board. Calls the
 * shared backend generator (src/services/queueCallGenerator.ts, POST
 * /api/v1/queue/simulate) instead of picking its own candidate/reason -
 * this is now the same code path the in-process background simulator
 * (src/services/callSimulator.ts) uses, just triggered on demand.
 *
 * This is the only place on the Service Manager Board that calls a mutation
 * endpoint - it creates a brand-new demo call, it never edits or advances any
 * existing call, so it does not conflict with the board's read-only
 * requirement over existing queue records.
 */

const apiBase = import.meta.env.VITE_API_BASE_URL || "";

export async function generateDemoStccCall(): Promise<void> {
  const response = await fetch(`${apiBase}/api/v1/queue/simulate`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" }
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `Failed to generate call (${response.status})`);
  }
}
