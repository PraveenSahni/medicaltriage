import { useEffect, useState } from "react";
import { formatDurationMMSS } from "./formatDuration";

type CallTimerProps = {
  /** ISO timestamp the clock starts counting from - the moment a nurse
      claims the call (item.claimedAtIso). No timer renders without it. */
  startIso: string | undefined;
  /** ISO timestamp the call was closed (item.completedAtIso). When present,
      the timer freezes and shows the final total time instead of ticking -
      this is the "total time taken to close a call" the manager needs. */
  endIso?: string;
  className?: string;
  title?: string;
};

/**
 * Live MM:SS call-duration clock, shared by the nurse Cockpit (ticking,
 * live) and the Service Manager Board (frozen once a call closes). Ticks
 * once per second while running; does nothing (no interval) once frozen.
 */
export function CallTimer({ startIso, endIso, className, title }: CallTimerProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startIso || endIso) {
      return;
    }
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [startIso, endIso]);

  if (!startIso) {
    return null;
  }

  const startMs = new Date(startIso).getTime();
  const endMs = endIso ? new Date(endIso).getTime() : now;
  const elapsedSeconds = (endMs - startMs) / 1000;

  return (
    <span className={className ?? "call-timer"} role="timer" title={title}>
      {formatDurationMMSS(elapsedSeconds)}
    </span>
  );
}
