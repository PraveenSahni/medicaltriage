import { useEffect } from "react";
import type { QueueItem } from "../QueueContext";
import {
  BOARD_COLUMNS,
  friendlyProtocolLabel,
  friendlySeverity,
  mapExistingStatusToBoardColumn,
  maskId
} from "./boardMapping";

type ReadOnlyCallDrawerProps = {
  item: QueueItem;
  onClose: () => void;
};

function safetyStatusText(item: QueueItem): string {
  if (!item.safetyFloorActive) {
    return "No safety-floor condition is currently highlighted.";
  }
  const sourceText =
    item.safetyFloorSource === "vitals"
      ? "vital-sign thresholds"
      : item.safetyFloorSource === "symptom"
        ? "an emergency symptom phrase"
        : item.safetyFloorSource === "judgment"
          ? "nurse clinical judgment"
          : "the safety floor";
  return `Emergency safety floor is active (triggered by ${sourceText}) and visible here for manager awareness. The assigned nurse remains responsible for the clinical workflow.`;
}

export function ReadOnlyCallDrawer({ item, onClose }: ReadOnlyCallDrawerProps) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const currentColumn = mapExistingStatusToBoardColumn(item);
  const currentIndex = BOARD_COLUMNS.findIndex((column) => column.id === currentColumn);
  const currentColumnMeta = BOARD_COLUMNS[currentIndex];

  return (
    <div
      className="smb-drawer-backdrop smb-drawer-backdrop-open"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside className="smb-drawer" aria-label="Call details">
        <div className="smb-drawer-head">
          <div>
            <div className="smb-case-id">Read-only call progress</div>
            <h2>
              {maskId(item.id)} · {friendlyProtocolLabel(item)}
            </h2>
            {item.reasonNarrative && <p>{item.reasonNarrative}</p>}
          </div>
          <button type="button" className="smb-close-btn" onClick={onClose} aria-label="Close details">
            ✕
          </button>
        </div>

        <div className="smb-drawer-section">
          <h3>Clinical progress</h3>
          <div className="smb-stage-progress">
            {BOARD_COLUMNS.map((column, index) => (
              <span
                key={column.id}
                className={`smb-stage-progress-item${
                  index < currentIndex ? " smb-done" : index === currentIndex ? " smb-current" : ""
                }`}
              />
            ))}
          </div>
          <div className="smb-stage-progress-labels">
            {BOARD_COLUMNS.map((column) => (
              <span key={column.id}>{column.title}</span>
            ))}
          </div>
        </div>

        <div className="smb-detail-grid">
          <div className="smb-detail">
            <div className="smb-detail-label">Current stage</div>
            <div className="smb-detail-value">{currentColumnMeta.title}</div>
          </div>
          <div className="smb-detail">
            <div className="smb-detail-label">Assigned nurse</div>
            <div className="smb-detail-value">{item.lockedByName ?? "Unassigned"}</div>
          </div>
          <div className="smb-detail">
            <div className="smb-detail-label">Patient</div>
            <div className="smb-detail-value">
              {item.patientType}
              {item.patientAge ? ` · ${item.patientAge.ageYears}y` : ""}
            </div>
          </div>
          <div className="smb-detail">
            <div className="smb-detail-label">Station</div>
            <div className="smb-detail-value">{item.stationCode ?? "—"}</div>
          </div>
          <div className="smb-detail">
            <div className="smb-detail-label">Protocol</div>
            <div className="smb-detail-value">{friendlyProtocolLabel(item)}</div>
          </div>
          <div className="smb-detail">
            <div className="smb-detail-label">Priority</div>
            <div className="smb-detail-value">{friendlySeverity(item.calculatedSeverity)}</div>
          </div>
          {item.status === "COMPLETED" && (
            <div className="smb-detail">
              <div className="smb-detail-label">Disposition</div>
              <div className="smb-detail-value">{item.destinationName ?? item.dispositionCode ?? "—"}</div>
            </div>
          )}
        </div>

        <div className="smb-drawer-section">
          <h3>Reason for call</h3>
          <div className="smb-reason-box">{item.reasonNarrative ?? "Not yet captured."}</div>
        </div>

        <div className="smb-drawer-section">
          <h3>Safety status</h3>
          <div className="smb-reason-box">{safetyStatusText(item)}</div>
        </div>

        <div className="smb-readonly-note">
          <span>◉</span>
          <div>
            <strong>Observation only</strong>
            This Service Manager board cannot answer, hold, reassign, edit, escalate, complete, or otherwise change
            the call or clinical record.
          </div>
        </div>
      </aside>
    </div>
  );
}
