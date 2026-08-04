const apiBase = import.meta.env.VITE_API_BASE_URL || "";

export async function submitFeedback(context: string, rating: number, comment?: string): Promise<void> {
  await fetch(`${apiBase}/api/v1/feedback`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, rating, comment })
  });
}
