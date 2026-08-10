import type { JSX } from "react";
import type { QueueItem } from "../QueueContext";
import { FitToFlyBadge } from "../cockpit/FitToFlyBadge";
import { colorStyleForSeverity } from "../cockpit/severityColors";
import { cardTitle, deriveWaitTime, friendlySeverity, maskId, type BoardColumnId } from "./boardMapping";

type ManagerCallCardProps = {
  item: QueueItem;
  column: BoardColumnId;
  onClick: (item: QueueItem) => void;
};

// Presentation-only check: cardTitle() derives its text from reasonNarrative's
// first sentence (falling back to a protocol label), truncating it for card
// display when long. When the narrative is only that one sentence, showing it
// again beneath the title is a pure display duplicate; the second line is
// only worth showing when the narrative has more sentences than the title
// already captured. This does not change cardTitle()/reasonNarrative
// themselves, only whether the narrative line renders a second time.
function narrativeHasContentBeyondTitle(narrative: string): boolean {
  const sentences = narrative.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length > 1;
}

export function ManagerCallCard({ item, column, onClick }: ManagerCallCardProps) {
  const severityLabel = friendlySeverity(item.calculatedSeverity);
  const isCompleted = item.status === "COMPLETED";
  const title = cardTitle(item);
  const narrative = item.reasonNarrative?.trim();
  const showNarrative = Boolean(narrative) && narrativeHasContentBeyondTitle(narrative!);

  let cornerLabel: JSX.Element;
  if (column === "waiting") {
    cornerLabel = (
      <span className="smb-wait">
        <strong>{deriveWaitTime(item)}</strong> wait
      </span>
    );
  } else if (column === "closed") {
    // A dedicated terminal column for the day's completed calls, kept
    // visually separate from calls still actively being wrapped up.
    cornerLabel = <span className="smb-wait smb-wait-completed">Closed</span>;
  } else if (column === "sbarComplete") {
    cornerLabel = <span className="smb-wait smb-wait-active">Active SBAR</span>;
  } else {
    cornerLabel = <span className="smb-wait">Active</span>;
  }

  return (
    <article
      className={`smb-card${item.safetyFloorActive ? " smb-card-emergency" : ""}${isCompleted ? " smb-card-completed" : ""}`}
      style={colorStyleForSeverity(severityLabel)}
      onClick={() => onClick(item)}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onClick(item);
      }}
    >
      <div className="smb-card-top">
        <span className="smb-case-id">{maskId(item.id)}</span>
        {cornerLabel}
      </div>
      <span className={`smb-severity smb-severity-${severityLabel.toLowerCase().replace(/\s|-/g, "")}`}>
        {severityLabel}
      </span>
      <div className="smb-card-title">{title}</div>
      {showNarrative && <div className="smb-card-text">{narrative}</div>}
      <div className="smb-card-meta">
        <span className="smb-owner">{item.lockedByName ?? "Unassigned"}</span>
        {item.safetyFloorActive ? (
          <span className="smb-mini-flag">⚠ Safety floor</span>
        ) : (
          <span>{item.stationCode ?? ""}</span>
        )}
      </div>
      <div className="smb-card-fit-to-fly">
        <FitToFlyBadge item={item} />
      </div>
    </article>
  );
}
