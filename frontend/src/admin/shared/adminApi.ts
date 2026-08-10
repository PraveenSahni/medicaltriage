export const apiBase = import.meta.env.VITE_API_BASE_URL || "";

function errorMessageFrom(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "error" in payload && typeof (payload as { error: unknown }).error === "string") {
    return (payload as { error: string }).error;
  }
  return `Request failed (${status})`;
}

export async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorMessageFrom(payload, response.status));
  }
  return payload as T;
}

async function sendJson<T>(method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(errorMessageFrom(payload, response.status));
  }
  return payload as T;
}

export function postJson<T>(path: string, body?: unknown): Promise<T> {
  return sendJson<T>("POST", path, body);
}

export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return sendJson<T>("PATCH", path, body);
}

export function deleteJson<T>(path: string): Promise<T> {
  return sendJson<T>("DELETE", path);
}
