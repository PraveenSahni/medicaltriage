import { useEffect, useRef, useState } from "react";
import type { QueueItem } from "../QueueContext";
import { fetchProtocolDetail, type ProtocolDetail } from "../cockpit/api/protocols";
import { FitToFlyBadge } from "../cockpit/FitToFlyBadge";
import { splitBilingualSbarNote } from "../utils/splitBilingualSbarNote";
import { CallTimer } from "../utils/CallTimer";
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
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Real WCAG 2.1 SC 2.4.3 (Focus Order) fix, found during the NFR-015
  // manual accessibility batch - this was the only dialog-like overlay
  // within the 5 audited pages and had no role/aria-modal, no focus
  // moved on open, no Tab trap, and no focus restoration on close.
  // Captures the triggering element on mount, moves focus into the
  // dialog, traps Tab/Shift+Tab within it, and restores focus to the
  // trigger on unmount - the same "capture -> trap -> restore" shape
  // already used by `role="dialog"` overlays elsewhere in this codebase
  // (NurseWorkspace.tsx), just not previously applied here.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const [activeTab, setActiveTab] = useState<"reason" | "iaq" | "taq" | "disposition" | "sbar">("reason");
  const [protocolDetail, setProtocolDetail] = useState<ProtocolDetail | undefined>(undefined);
  const [protocolError, setProtocolError] = useState("");
  const protocolId = item.matchedProtocolId ?? item.preparedProtocol?.primaryProtocolId;

  useEffect(() => {
    let cancelled = false;
    setProtocolDetail(undefined);
    setProtocolError("");
    if (!protocolId) {
      return;
    }
    fetchProtocolDetail(protocolId)
      .then((detail) => {
        if (!cancelled) setProtocolDetail(detail);
      })
      .catch((caught) => {
        if (!cancelled) setProtocolError(caught instanceof Error ? caught.message : "Failed to load protocol questions.");
      });
    return () => {
      cancelled = true;
    };
  }, [protocolId]);

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
      <aside ref={drawerRef} className="smb-drawer" role="dialog" aria-modal="true" aria-label="Call details">
        <div className="smb-drawer-head">
          <div>
            <div className="smb-case-id">Read-only call progress</div>
            <h2>
              {maskId(item.id)} · {friendlyProtocolLabel(item)}
            </h2>
            {item.reasonNarrative && <p>{item.reasonNarrative}</p>}
            {item.claimedAtIso && !(item.status === "COMPLETED" && !item.completedAtIso) && (
              <div className="smb-card-duration">
                <CallTimer
                  className="smb-call-timer"
                  startIso={item.claimedAtIso}
                  endIso={item.completedAtIso}
                  title={
                    item.completedAtIso ? "Total time from claim to close" : "Time elapsed since a nurse claimed this call"
                  }
                />
                <span className="smb-call-timer-label">
                  {item.completedAtIso ? "total time" : "elapsed"}
                </span>
              </div>
            )}
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="smb-close-btn"
            onClick={onClose}
            aria-label="Close details"
          >
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
            <div className="smb-detail-label">Severity</div>
            <div className="smb-detail-value">{friendlySeverity(item.calculatedSeverity)}</div>
          </div>
          <div className="smb-detail">
            <div className="smb-detail-label">Fit-to-fly</div>
            <div className="smb-detail-value">
              <FitToFlyBadge item={item} />
            </div>
          </div>
          {item.status === "COMPLETED" && (
            <div className="smb-detail">
              <div className="smb-detail-label">Disposition</div>
              <div className="smb-detail-value">{item.destinationName ?? item.dispositionCode ?? "—"}</div>
            </div>
          )}
        </div>

        <div className="smb-drawer-tabs" role="tablist" aria-label="Call detail tabs">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reason"}
            className={`smb-drawer-tab${activeTab === "reason" ? " smb-drawer-tab-active" : ""}`}
            onClick={() => setActiveTab("reason")}
          >
            Reason for Call
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "iaq"}
            className={`smb-drawer-tab${activeTab === "iaq" ? " smb-drawer-tab-active" : ""}`}
            onClick={() => setActiveTab("iaq")}
          >
            Initial Assessment
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "taq"}
            className={`smb-drawer-tab${activeTab === "taq" ? " smb-drawer-tab-active" : ""}`}
            onClick={() => setActiveTab("taq")}
          >
            TAQ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "disposition"}
            className={`smb-drawer-tab${activeTab === "disposition" ? " smb-drawer-tab-active" : ""}`}
            onClick={() => setActiveTab("disposition")}
          >
            Disposition
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "sbar"}
            className={`smb-drawer-tab${activeTab === "sbar" ? " smb-drawer-tab-active" : ""}`}
            onClick={() => setActiveTab("sbar")}
          >
            SBAR
          </button>
        </div>

        {activeTab === "reason" && (
          <>
            <div className="smb-drawer-section">
              <h3>Reason for call</h3>
              <div className="smb-reason-box">{item.reasonNarrative ?? "Not yet captured."}</div>
            </div>

            <div className="smb-drawer-section">
              <h3>Safety status</h3>
              <div className="smb-reason-box">{safetyStatusText(item)}</div>
            </div>
          </>
        )}

        {activeTab === "iaq" && (
          <div className="smb-drawer-section">
            <h3>Initial Assessment Questions</h3>
            {!item.initialAssessmentResponses || Object.keys(item.initialAssessmentResponses).length === 0 ? (
              <p className="smb-empty-note">No initial assessment answers recorded yet for this call.</p>
            ) : protocolError ? (
              <p className="smb-empty-note">{protocolError}</p>
            ) : !protocolDetail ? (
              <p className="smb-empty-note">Loading questions...</p>
            ) : (
              <ul className="smb-qa-list">
                {[...protocolDetail.protocol.initialAssessmentQuestions]
                  .filter((question) => question.id in (item.initialAssessmentResponses ?? {}))
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((question) => (
                    <li key={question.id} className="smb-qa-item">
                      <div className="smb-qa-question">{question.promptTextEn}</div>
                      <div className="smb-qa-answer">{item.initialAssessmentResponses?.[question.id]}</div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "taq" && (
          <div className="smb-drawer-section">
            <h3>Triage Assessment Questions (TAQ)</h3>
            {!item.taqResponses || Object.keys(item.taqResponses).length === 0 ? (
              <p className="smb-empty-note">No TAQ answers recorded yet for this call.</p>
            ) : protocolError ? (
              <p className="smb-empty-note">{protocolError}</p>
            ) : !protocolDetail ? (
              <p className="smb-empty-note">Loading questions...</p>
            ) : (
              <ul className="smb-qa-list">
                {[...protocolDetail.protocol.questions]
                  .filter((question) => question.id in (item.taqResponses ?? {}))
                  .sort((a, b) => a.acuityOrder - b.acuityOrder)
                  .map((question) => {
                    const answeredYes = item.taqResponses?.[question.id];
                    return (
                      <li key={question.id} className="smb-qa-item">
                        <div className="smb-qa-question">{question.questionTextEn}</div>
                        <div className={`smb-qa-answer${answeredYes ? " smb-qa-answer-yes" : ""}`}>
                          {answeredYes ? "Yes" : "No"}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
        )}

        {activeTab === "disposition" && (
          <div className="smb-drawer-section">
            <h3>Disposition</h3>
            {!item.dispositionCode ? (
              <p className="smb-empty-note">Disposition has not been reached yet for this call.</p>
            ) : (
              <>
                <div className="smb-detail-grid">
                  <div className="smb-detail">
                    <div className="smb-detail-label">Severity</div>
                    <div className="smb-detail-value">{friendlySeverity(item.calculatedSeverity)}</div>
                  </div>
                  <div className="smb-detail">
                    <div className="smb-detail-label">Disposition code</div>
                    <div className="smb-detail-value">{item.dispositionCode}</div>
                  </div>
                </div>
                <div className="smb-reason-box" style={{ marginTop: 10 }}>
                  {item.destinationName ?? "Destination not yet recorded."}
                </div>
                {(() => {
                  const terminalQuestionId = (item.clinicalApproval as { terminalQuestionId?: string } | undefined)
                    ?.terminalQuestionId;
                  const terminalQuestion = terminalQuestionId
                    ? protocolDetail?.protocol.questions.find((question) => question.id === terminalQuestionId)
                    : undefined;
                  if (!terminalQuestion) {
                    return null;
                  }
                  return (
                    <>
                      <h3 style={{ marginTop: 16 }}>Triggering TAQ</h3>
                      <div className="smb-reason-box">{terminalQuestion.questionTextEn}</div>
                    </>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {activeTab === "sbar" && (
          <div className="smb-drawer-section">
            <h3>SBAR</h3>
            {item.sbarNoteText ? (
              (() => {
                const { english, arabic } = splitBilingualSbarNote(item.sbarNoteText);
                return (
                  <>
                    <pre className="smb-sbar-note" dir="ltr">
                      {english}
                    </pre>
                    {arabic && (
                      <pre className="smb-sbar-note" dir="rtl" lang="ar">
                        {arabic}
                      </pre>
                    )}
                  </>
                );
              })()
            ) : (
              <p className="smb-empty-note">
                {item.sbarCopied
                  ? "SBAR was copied for this call, but its text was not captured before this feature existed."
                  : "SBAR has not been compiled/copied yet for this call."}
              </p>
            )}
          </div>
        )}

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
