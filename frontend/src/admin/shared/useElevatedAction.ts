import { useCallback, useRef, useState } from "react";
import { fetchJson, postJson } from "./adminApi";

type ElevationStatus = { elevated: boolean; expiresAtIso?: string; elevationId?: string };

// Real PAM (privileged access management) gate: before running an action
// that the backend guards with requireElevatedPermission(), check the
// real elevation status (GET /elevation/status). If not elevated, collect
// a fresh TOTP code via the shared ElevationModal, call the real
// POST /elevate, then run the original action - the same "verify, then
// act" flow the backend already enforces, now with a real UI in front of
// it instead of every privileged action failing with an opaque 403.
export function useElevatedAction() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const pendingActionRef = useRef<(() => Promise<void>) | null>(null);

  const runElevated = useCallback(async (action: () => Promise<void>) => {
    setModalError("");
    try {
      const status = await fetchJson<ElevationStatus>("/api/v1/admin/elevation/status");
      if (status.elevated) {
        await action();
        return;
      }
    } catch {
      // fall through to requesting elevation - status check failing should
      // not silently skip the gate.
    }
    pendingActionRef.current = action;
    setModalOpen(true);
  }, []);

  const submitCode = useCallback(async (code: string) => {
    setSubmitting(true);
    setModalError("");
    try {
      await postJson("/api/v1/admin/elevate", { code });
      setModalOpen(false);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      if (action) {
        await action();
      }
    } catch (error) {
      setModalError(error instanceof Error ? error.message : "Invalid or expired code.");
    } finally {
      setSubmitting(false);
    }
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setModalError("");
    pendingActionRef.current = null;
  }, []);

  return { runElevated, modalOpen, modalError, submitting, submitCode, closeModal };
}
