import { useEffect, useState, type CSSProperties } from "react";
import { Plane } from "lucide-react";
import { useQueue, type QueueItem } from "../../QueueContext";
import { compileTriageCompletion, previewTriageCompletion, type TriageCompleteResponse } from "../api/triageCompletion";

type FitToFlyStatus = NonNullable<TriageCompleteResponse["fitToFlyStatus"]>;

const FIT_TO_FLY_LABEL: Record<FitToFlyStatus, string> = {
  CLEARED: "Cleared",
  RESTRICTED: "Restricted",
  MEDICAL_REVIEW_REQUIRED: "Medical Review Required"
};

const FIT_TO_FLY_RATIONALE: Record<FitToFlyStatus, string> = {
  CLEARED: "No disposition or role-based factor requires duty restriction.",
  RESTRICTED:
    "Final disposition or safety-sensitive crew role requires this staff member to remain off duty. A fit-to-fly clearance must be obtained by visiting a clinic or hospital before returning to duty.",
  MEDICAL_REVIEW_REQUIRED: "Flagged for clinical review before a duty decision can be made."
};

// Mirrors colorStyleForSeverity()'s --gc/--gcbg/--gcbd token pattern
// (severityColors.ts) rather than a literal inline color - this app routes
// every visible text color through a CSS-variable-driven `!important` rule
// (e.g. .r-title, .fit-to-fly-value), so a plain style={{color: hex}} loses
// to that cascade. Reuses the same real red/amber/green tokens already used
// for clinical severity (--ems/--hcp4/--home) rather than inventing new hex
// values, so Fit-to-Fly matches the rest of the app's color language.
function colorStyleForFitToFly(status: FitToFlyStatus | undefined): CSSProperties {
  const tokens =
    status === "RESTRICTED"
      ? { gc: "var(--ems)", gcbg: "var(--emsbg)", gcbd: "var(--emsbd)" }
      : status === "MEDICAL_REVIEW_REQUIRED"
        ? { gc: "var(--hcp4)", gcbg: "var(--hcp4bg)", gcbd: "var(--hcp4bd)" }
        : { gc: "var(--home)", gcbg: "var(--homebg)", gcbd: "var(--homebd)" };
  return {
    ["--gc" as string]: tokens.gc,
    ["--gcbg" as string]: tokens.gcbg,
    ["--gcbd" as string]: tokens.gcbd
  } as CSSProperties;
}

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
  const [fitToFlyStatus, setFitToFlyStatus] = useState<FitToFlyStatus | undefined>(item.fitToFlyStatus);

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
        if (result.fitToFlyStatus) setFitToFlyStatus(result.fitToFlyStatus);
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

  async function compileSbarIfNeeded(): Promise<{ text: string; fitToFlyStatus?: FitToFlyStatus }> {
    if (sbarText) {
      // Already compiled once this session - do not re-call the non-idempotent
      // /triage/complete endpoint; reuse the cached display text.
      return { text: sbarText, fitToFlyStatus };
    }
    try {
      const result = await compileTriageCompletion(item.id, completionRequestBody);
      const text =
        typeof result.notePayload === "string" ? result.notePayload : JSON.stringify(result.notePayload, null, 2);
      setSbarText(text);
      if (result.fitToFlyStatus) setFitToFlyStatus(result.fitToFlyStatus);
      return { text, fitToFlyStatus: result.fitToFlyStatus };
    } catch {
      setSbarText(fallbackSbar);
      return { text: fallbackSbar };
    }
  }

  async function copySbar() {
    setBusy(true);
    setActionError("");
    try {
      const { text, fitToFlyStatus: compiledFitToFlyStatus } = await compileSbarIfNeeded();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      // sbarCopied is only set true after the clipboard copy has actually
      // succeeded - never optimistically before this point. sbarNoteText and
      // fitToFlyStatus are persisted here too so both survive past this
      // session (previously only ever held in local component state, lost on
      // reload - e.g. for the Service Manager Board's read-only SBAR review
      // tab, or for this same call reopened by another nurse/manager).
      await updateItemContext(item.id, {
        sbarCopied: true,
        sbarNoteText: text,
        ...(compiledFitToFlyStatus ? { fitToFlyStatus: compiledFitToFlyStatus } : {})
      });
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

  // item.fitToFlyStatus (the persisted, server-confirmed value for THIS item) always
  // wins over local `fitToFlyStatus` state - state alone would go stale when the
  // nurse switches between calls without this component remounting (useState's
  // initializer only runs once, so it kept showing the previously-viewed call's
  // status until this fell back to the live prop first, same pattern already used
  // for sbarNoteText below).
  const displayFitToFlyStatus = item.fitToFlyStatus ?? fitToFlyStatus;

  return (
    <section aria-label="SBAR / Complete">
      <div className="action-sub-note">Copy the SBAR handoff, deliver callback instructions, and close the call.</div>

      <div className="reason-card" style={{ marginBottom: 14 }}>
        <label>Fit-to-Fly Recommendation</label>
        {displayFitToFlyStatus ? (
          <div style={colorStyleForFitToFly(displayFitToFlyStatus)}>
            <div className="fit-to-fly-value">
              <Plane size={16} strokeWidth={2.5} />
              {FIT_TO_FLY_LABEL[displayFitToFlyStatus]}
            </div>
            <div className="action-sub-note" style={{ marginTop: 4 }}>
              {FIT_TO_FLY_RATIONALE[displayFitToFlyStatus]}
            </div>
          </div>
        ) : (
          <div className="action-sub-note">Determined once the SBAR note is compiled (Copy SBAR, below).</div>
        )}
      </div>

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
