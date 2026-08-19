import { useEffect, useRef, useState, type FormEvent } from "react";
import { useQueue } from "../QueueContext";

type AddCallModalProps = {
  onClose: () => void;
  onCreated: (itemId: string) => void;
};

// Manual call intake, opened from the "+" button next to the Open Calls
// tab. Mirrors the focus-trap/restore shape already proven in
// serviceManagerBoard/ReadOnlyCallDrawer.tsx (capture -> trap -> restore)
// rather than inventing a new dialog pattern.
export function AddCallModal({ onClose, onCreated }: AddCallModalProps) {
  const { createItem, resolvePatient } = useQueue();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [patientIdentifier, setPatientIdentifier] = useState("");
  const [resolvedPatient, setResolvedPatient] = useState<Awaited<ReturnType<typeof resolvePatient>>>();
  const [resolving, setResolving] = useState(false);
  const [channel, setChannel] = useState<"Phone" | "WhatsApp" | "Callback" | "Email">("Phone");
  const [reasonNarrative, setReasonNarrative] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
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

  async function handleResolve() {
    if (!patientIdentifier.trim()) {
      setError("Employee ID or Dependent ID is required.");
      return;
    }
    setResolving(true);
    setError("");
    try {
      setResolvedPatient(await resolvePatient(patientIdentifier.trim()));
    } catch (caught) {
      setResolvedPatient(undefined);
      setError(caught instanceof Error ? caught.message : "Patient could not be resolved.");
    } finally {
      setResolving(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!resolvedPatient) {
      setError("Resolve an Employee ID or Dependent ID before continuing.");
      return;
    }
    if (reasonNarrative.trim().length < 3) {
      setError("Reason for call is required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const item = await createItem({
        patientIdentifier: resolvedPatient.patientIdentifier,
        channel,
        reasonNarrative: reasonNarrative.trim()
      });
      onCreated(item.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to add call.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cockpit-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="cockpit-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add call manually"
      >
        <form onSubmit={handleSubmit}>
          <div className="cockpit-modal-header">
            <h2>Add Call Manually</h2>
            <button type="button" className="cockpit-modal-close" onClick={onClose} aria-label="Close">
              &times;
            </button>
          </div>

          <p className="cockpit-modal-subtitle">
            For calls received outside the automated intake pipeline - e.g. a walk-in report or a callback you're
            initiating yourself. The call goes through the same identity validation and protocol matching as any
            other call.
          </p>

          <label className="cockpit-field">
            <span>Employee ID or Dependent ID *</span>
            <input
              ref={firstFieldRef}
              type="text"
              value={patientIdentifier}
              onChange={(event) => {
                setPatientIdentifier(event.target.value);
                setResolvedPatient(undefined);
              }}
              placeholder="Enter one Employee ID or Dependent ID"
              required
              disabled={submitting}
            />
          </label>
          <button type="button" className="cockpit-modal-resolve" onClick={handleResolve} disabled={resolving || submitting}>
            {resolving ? "Identifying..." : "Identify patient"}
          </button>

          {resolvedPatient && (
            <div className="cockpit-patient-resolved" role="status">
              <strong>Patient identified</strong>
              <span>{resolvedPatient.patientType} · {resolvedPatient.patientIdentifier}</span>
              <span>{resolvedPatient.department}{resolvedPatient.relationshipType ? ` · ${resolvedPatient.relationshipType}` : ""}</span>
            </div>
          )}

          <label className="cockpit-field" aria-disabled={!resolvedPatient}>
            <span>Channel</span>
            <select disabled={!resolvedPatient || submitting} value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)}>
              <option value="Phone">Phone</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Callback">Callback</option>
              <option value="Email">Email</option>
            </select>
          </label>

          <label className="cockpit-field">
            <span>Reason for call *</span>
            <textarea
              disabled={!resolvedPatient || submitting}
              value={reasonNarrative}
              onChange={(event) => setReasonNarrative(event.target.value)}
              placeholder={resolvedPatient ? "Enter the reason for the call to select the clinical protocol." : "Identify the patient first."}
              rows={3}
              required
            />
          </label>

          {error && (
            <p className="cockpit-action-error" role="alert">
              {error}
            </p>
          )}

          <div className="cockpit-modal-actions">
            <button type="button" className="cockpit-modal-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="cockpit-modal-submit" disabled={submitting || !resolvedPatient || reasonNarrative.trim().length < 3}>
              {submitting ? "Adding..." : "Add Call"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
