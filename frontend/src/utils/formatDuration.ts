/**
 * Formats a non-negative duration in seconds as MM:SS. Minutes are
 * uncapped (e.g. "125:07" for a call over two hours), matching how the
 * rest of this app already renders long-running durations (see
 * boardMapping.ts's deriveWaitTime) rather than rolling over into hours.
 */
export function formatDurationMMSS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
