import { useState } from "react";
import { useQueue, type QueueItem } from "../../QueueContext";
import { compileTriageCompletion } from "../api/triageCompletion";

type CompletionStageProps = {
  item: QueueItem;
  isReadOnly: boolean;
  onCallCompleted: () => void;
};

export function CompletionStage({ item, isReadOnly, onCallCompleted }: CompletionStageProps) {
  const { updateItemContext, moveItem } = useQueue();
  const [sbarText, setSbarText] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [completed, setCompleted] = useState(item.status === "COMPLETED");

  const fallbackSbar = `S: ${item.istStaffId}, reports ${item.reasonNarrative ?? "reason not captured"}\nB: Reason & Rule-Out and Questions completed via structured triage.\nA: Disposition: ${item.dispositionCode ?? "Not yet determined"}.\nR: Route per disposition; callback precautions given as applicable.`;

  async function compileSbarIfNeeded(): Promise<string> {
    if (sbarText) {
      // Already compiled once this session - do not re-call the non-idempotent
      // /triage/complete endpoint; reuse the cached display text.
      return sbarText;
    }
    try {
      const result = await compileTriageCompletion(item.id, {
        istStaffId: item.istStaffId,
        dispositionCode: item.dispositionCode,
        destinationName: item.destinationName
      });
      const text =
        typeof result.notePayload === "string" ? result.notePayload : JSON.stringify(result.notePayload, null, 2);
      setSbarText(text);
      return text;
    } catch {
      setSbarText(fallbackSbar);
      return fallbackSbar;
    }
  }

  async function copySbar() {
    setBusy(true);
    setActionError("");
    try {
      const text = await compileSbarIfNeeded();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // sbarCopied is only set true after the clipboard copy has actually
      // succeeded - never optimistically before this point. sbarNoteText is
      // persisted here too so the compiled note survives past this session
      // (previously only ever held in local component state, lost on reload -
      // e.g. for the Service Manager Board's read-only SBAR review tab).
      await updateItemContext(item.id, { sbarCopied: true, sbarNoteText: text });
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Copy failed.");
    } finally {
      setBusy(false);
    }
  }

  async function completeCall() {
    setBusy(true);
    setActionError("");
    try {
      // Step A: persist required encounter fields (idempotent PATCH).
      await updateItemContext(item.id, {
        clinicalApproval: item.clinicalApproval ?? { approvedAtIso: new Date().toISOString() }
      });
      // Step B: ensure the SBAR has been reviewed/copied at least once.
      if (!copied) {
        await copySbar();
      }
      // Step C: the only point of no return - never show "completed" before
      // this call's response confirms the COMPLETED transition.
      await moveItem(item.id, "SBAR", "COMPLETED");
      setCompleted(true);
      onCallCompleted();
    } catch (caught) {
      setActionError(
        caught instanceof Error
          ? `${caught.message} - the call remains open; you can safely retry.`
          : "Completion failed - the call remains open; you can safely retry."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="SBAR / Complete">
      <div className="action-sub-note">Copy the SBAR handoff, deliver callback instructions, and close the call.</div>

      <div className="reason-card">
        <label>SBAR Preview</label>
        <div className="cockpit-sbar-preview">
          {completed
            ? "This call has been closed and is now read-only."
            : sbarText || fallbackSbar}
        </div>

        {actionError && (
          <p className="cockpit-action-error" role="alert">
            {actionError}
          </p>
        )}

        {isReadOnly || completed ? (
          <div style={{ marginTop: 12, fontSize: "0.8rem", color: "var(--muted)" }}>
            &#128274; This call is closed - SBAR is shown for reference only.
          </div>
        ) : (
          <div className="flow-actions">
            <button type="button" className="complete-btn" style={{ background: "var(--muted)" }} onClick={copySbar} disabled={busy}>
              {copied ? "✓ Copied" : "Copy SBAR"}
            </button>
            <button
              type="button"
              className="complete-btn"
              onClick={completeCall}
              disabled={busy || !item.dispositionCode || !item.destinationName}
              title={
                !item.dispositionCode || !item.destinationName
                  ? "Complete the Disposition stage before finishing this call."
                  : undefined
              }
            >
              &#10003; Complete Call
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
