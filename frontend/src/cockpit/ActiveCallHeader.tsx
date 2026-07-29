import { useState } from "react";
import { useQueue, type QueueItem } from "../QueueContext";
import type { AuthenticatedSession } from "../auth/session";
import { FitToFlyBadge } from "./FitToFlyBadge";

type ActiveCallHeaderProps = {
  item: QueueItem;
  session: AuthenticatedSession;
  isHeld: boolean;
  isReadOnly: boolean;
  isEscalated: boolean;
  escalationSource?: "symptom" | "judgment";
  onEscalate: () => void;
};

export function ActiveCallHeader({
  item,
  session,
  isHeld,
  isReadOnly,
  isEscalated,
  escalationSource,
  onEscalate
}: ActiveCallHeaderProps) {
  const { connectCall } = useQueue();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const canEscalate = session.permissions.includes("triage.queue.manage");
  const canHold = session.permissions.includes("triage.workspace.view");
  // Once a disposition has been reached, the call must be finished through
  // SBAR/Complete rather than parked on Hold indefinitely - stepping away at
  // that point (e.g. to answer a fresh incoming call) would otherwise leave
  // an already-triaged patient's case open with no forcing function to ever
  // close it. Resuming an already-held call is still allowed either way, so
  // a nurse who held before disposition was reached can still get back in.
  const holdBlockedByDisposition = !isHeld && Boolean(item.dispositionCode);

  async function toggleHold() {
    setBusy(true);
    setActionError("");
    try {
      await connectCall(item.id, isHeld ? "RESUME" : "HOLD");
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Hold/Resume failed.");
    } finally {
      setBusy(false);
    }
  }

  const escalateLabel = !isEscalated
    ? "⚠ Sounds life-threatening - escalate now"
    : escalationSource === "symptom"
      ? "✓ Escalated - emergency symptom phrase detected"
      : "✓ Escalated by triager judgment";

  return (
    <div className="active-call-hdr">
      <div>
        {/* reasonNarrative is the field that actually gets edited (nurse
            typing or IVR audio capture) - item.summary is only ever set once
            at creation and goes stale the moment reasonNarrative changes. */}
        <h1>{item.reasonNarrative || item.summary}</h1>
        <div className="sub">
          {item.matchedProtocolId ?? item.preparedProtocol?.primaryProtocolId ?? "No protocol matched"} &middot; Case{" "}
          {item.id}
        </div>
      </div>

      <div className="active-call-hdr-right">
        {!isReadOnly && (
          <div className="active-call-actions">
            {actionError && (
              <span className="cockpit-action-error" role="alert">
                {actionError}
              </span>
            )}
            {canEscalate && (
              <button type="button" className="escalate-btn" onClick={onEscalate} disabled={busy || isEscalated}>
                {escalateLabel}
              </button>
            )}
            {canHold && (
              <button
                type="button"
                className={isHeld ? "answer-btn resume-btn" : "hold-btn"}
                onClick={toggleHold}
                disabled={busy || holdBlockedByDisposition}
                title={
                  holdBlockedByDisposition
                    ? "A disposition has been reached - finish this call through SBAR/Complete instead of holding it."
                    : undefined
                }
              >
                {isHeld ? "↻ Resume" : "❚❚ Hold Call"}
              </button>
            )}
          </div>
        )}

        {isReadOnly && (
          <div className="ist-readonly-badge" role="status">
            &#128274; Closed - Read Only
          </div>
        )}

        <FitToFlyBadge item={item} />
      </div>
    </div>
  );
}
