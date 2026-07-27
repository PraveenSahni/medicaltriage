import { useEffect, useState } from "react";
import { useQueue, type QueueItem } from "../../QueueContext";
import { compileTriageCompletion, previewTriageCompletion } from "../api/triageCompletion";

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
  const [previewText, setPreviewText] = useState<string>("");

  // For an already-closed call that never had its note captured (e.g. an
  // older record from before sbarNoteText was persisted, or one closed via
  // the old broken request above), generate a read-only preview on demand
  // via /triage/preview - side-effect-free, so it's safe to call every time
  // this call is reopened rather than showing a dead-end "not captured"
  // message forever.
  useEffect(() => {
    if (item.status !== "COMPLETED" || item.sbarNoteText || previewText) {
      return;
    }
    let cancelled = false;
    previewTriageCompletion({
      ist_staff_id: item.istStaffId,
      chief_complaint: item.reasonNarrative ?? item.summary ?? "Reason not captured.",
      final_disposition_code: item.dispositionCode ?? "PENDING",
      routing_destination: item.destinationName ?? "Pending routing"
    })
      .then((result) => {
        if (cancelled) return;
        const text =
          typeof result.notePayload === "string" ? result.notePayload : JSON.stringify(result.notePayload, null, 2);
        setPreviewText(text);
      })
      .catch(() => {
        // Leave previewText empty - the render falls back to the existing
        // "closed before the SBAR was captured" message.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id, item.status, item.sbarNoteText]);

  const fallbackSbar = `S: ${item.istStaffId}, reports ${item.reasonNarrative ?? "reason not captured"}\nB: Reason & Rule-Out and Questions completed via structured triage.\nA: Disposition: ${item.dispositionCode ?? "Not yet determined"}.\nR: Route per disposition; callback precautions given as applicable.`;

  // TriageCompleteRequestSchema requires chief_complaint/final_disposition_code/
  // routing_destination (snake_case) - this previously sent istStaffId/
  // dispositionCode/destinationName instead, which the schema doesn't
  // recognize, so every real call to this endpoint was rejected with a 400
  // and silently fell back to the plain fallbackSbar text below. The real
  // bilingual note was never actually being compiled in production use.
  const completionRequestBody = {
    ist_staff_id: item.istStaffId,
    chief_complaint: item.reasonNarrative ?? item.summary ?? "Reason not captured.",
    final_disposition_code: item.dispositionCode ?? "PENDING",
    routing_destination: item.destinationName ?? "Pending routing"
  };

  async function compileSbarIfNeeded(): Promise<string> {
    if (sbarText) {
      // Already compiled once this session - do not re-call the non-idempotent
      // /triage/complete endpoint; reuse the cached display text.
      return sbarText;
    }
    try {
      const result = await compileTriageCompletion(item.id, completionRequestBody);
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
            ? // item.sbarNoteText is the persisted bilingual note (preferred);
              // sbarText is local state from an active copy/complete flow in
              // *this* session; previewText is a freshly-generated read-only
              // preview (see the effect above) for older records that never
              // had a note captured at all. Only fall through to the plain
              // message if none of those produced anything.
              item.sbarNoteText ||
              sbarText ||
              previewText ||
              "This call was closed before the SBAR note text was captured."
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
