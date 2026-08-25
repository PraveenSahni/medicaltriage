export function buildMfaResetRequest(reason: string) {
  return { reason: reason.trim() };
}
