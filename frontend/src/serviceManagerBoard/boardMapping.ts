import type { QueueItem } from "../QueueContext";

export type BoardColumnId =
  | "waiting"
  | "reasonRuleOut"
  | "questions"
  | "dispositionAdvice"
  | "sbarComplete"
  | "closed";

export const BOARD_COLUMNS: Array<{ id: BoardColumnId; title: string; subtitle: string; icon: string }> = [
  { id: "waiting", title: "Waiting Calls", subtitle: "Awaiting a nurse", icon: "☎" },
  { id: "reasonRuleOut", title: "Reason & Rule-Out", subtitle: "Opening + safety search", icon: "⌕" },
  { id: "questions", title: "Questions", subtitle: "High acuity first", icon: "◈" },
  { id: "dispositionAdvice", title: "Disposition & Advice", subtitle: "In nurse review", icon: "⚠" },
  { id: "sbarComplete", title: "SBAR / Complete", subtitle: "Preparing closure", icon: "✓" },
  { id: "closed", title: "Closed", subtitle: "Completed for the day", icon: "🔒" }
];

/**
 * Pure, frontend-only translation of the existing backend status/stage values
 * onto the 6 visual board columns. Never mutates the queue item; only decides
 * where a read-only card is drawn. Bucketing for in-progress items follows
 * KanbanWorkspace.tsx's existing statusFrom() precedent (currentStage only),
 * confirmed with the user rather than switching to the richer but unproven
 * stccProcess.currentActionTab signal. COMPLETED items get their own terminal
 * "closed" column, separate from "sbarComplete" (which holds only calls still
 * actively being wrapped up), placed last so the day's closed calls are
 * visually set apart from in-flight work.
 */
export function mapExistingStatusToBoardColumn(item: QueueItem): BoardColumnId {
  if (item.status === "COMPLETED") {
    return "closed";
  }
  if (item.status === "INCOMING") {
    return "waiting";
  }
  // IN_PROCESS or INFO_REQUIRED from here.
  switch (item.currentStage) {
    case "INTAKE":
    case "IDENTITY":
    case "VITALS":
      return "reasonRuleOut";
    case "PROTOCOL":
      return "questions";
    case "DISPOSITION":
      return "dispositionAdvice";
    case "SBAR":
      return "sbarComplete";
    default:
      return "reasonRuleOut";
  }
}

/** MM:SS elapsed since the call was created - only meaningful for waiting calls. */
export function deriveWaitTime(item: QueueItem): string {
  const totalSeconds = Math.max(0, Math.round((Date.now() - new Date(item.createdAtIso).getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

const MASK_PREFIX_LENGTH = 8;

/**
 * Masks an identifier down to a fixed-width display: a constant run of mask
 * characters followed by the last 4 real characters. Applied to every raw id
 * (queue record id, HRMS staff id) shown anywhere on the board - the manager
 * never needs the full value to monitor progress. The prefix length is fixed
 * (not proportional to the raw id's length) so every masked id on the board
 * renders at the same width, regardless of how long the underlying id is.
 */
export function maskId(rawId: string | undefined | null): string {
  if (!rawId) {
    return "—";
  }
  const visible = rawId.slice(-4);
  return `${"*".repeat(MASK_PREFIX_LENGTH)}${visible}`;
}

const FRIENDLY_SEVERITY: Record<string, string> = {
  EMERGENCY: "Emergency",
  URGENT: "Urgent",
  ROUTINE: "Routine",
  SELF_CARE: "Self-care"
};

export function friendlySeverity(severity: string | undefined): string {
  return FRIENDLY_SEVERITY[severity ?? ""] ?? "Routine";
}

/**
 * Card/drawer title. item.summary does not exist on QueueItem - the only
 * candidate free-text field is reasonNarrative (the nurse-facing reason
 * captured at intake), with a friendly protocol label as a fallback/
 * supplement when the narrative hasn't been captured yet.
 */
export function friendlyProtocolLabel(item: QueueItem): string {
  return item.preparedProtocol?.primaryProtocolTitle ?? item.matchedProtocolId ?? "Protocol pending";
}

export function cardTitle(item: QueueItem): string {
  const narrative = item.reasonNarrative?.trim();
  if (narrative) {
    // First clause/sentence only - the full narrative is shown separately as
    // the 2-line reason clamp beneath the title.
    const firstSentence = narrative.split(/(?<=[.!?])\s/)[0];
    return firstSentence.length > 60 ? `${firstSentence.slice(0, 57)}...` : firstSentence;
  }
  return friendlyProtocolLabel(item);
}

export function countWaiting(queue: QueueItem[]): number {
  return queue.filter((item) => mapExistingStatusToBoardColumn(item) === "waiting").length;
}

export function countInFlow(queue: QueueItem[]): number {
  return queue.filter((item) => {
    const column = mapExistingStatusToBoardColumn(item);
    return column !== "waiting" && item.status !== "COMPLETED";
  }).length;
}

export function countSafetyAlerts(queue: QueueItem[]): number {
  return queue.filter((item) => item.safetyFloorActive && item.status !== "COMPLETED").length;
}

/**
 * Distinct nurses currently holding an open (non-completed) item - a count of
 * assignment, not live presence/online status, since no API reports nurse
 * presence. Labelled "Assigned Nurses" in the UI, not "Active Nurses".
 */
export function countAssignedNurses(queue: QueueItem[]): number {
  const nurseIds = new Set(
    queue
      .filter((item) => item.status !== "COMPLETED")
      .map((item) => item.lockedBy ?? item.assignedNurseId)
      .filter((id): id is string => Boolean(id))
  );
  return nurseIds.size;
}

export function longestWaitMinutes(queue: QueueItem[]): number {
  const waiting = queue.filter((item) => mapExistingStatusToBoardColumn(item) === "waiting");
  if (waiting.length === 0) {
    return 0;
  }
  return Math.max(
    ...waiting.map((item) => Math.round((Date.now() - new Date(item.createdAtIso).getTime()) / 60_000))
  );
}
