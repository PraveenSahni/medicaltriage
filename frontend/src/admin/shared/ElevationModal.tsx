import { useState } from "react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";

type ElevationModalProps = {
  open: boolean;
  error: string;
  submitting: boolean;
  onSubmit: (code: string) => void;
  onClose: () => void;
};

// Radix Dialog already implements focus-trap/restore/escape-to-close per
// WAI-ARIA - replaces the hand-rolled capture->trap->restore logic this
// component previously had to implement itself. useElevatedAction's public
// contract ({runElevated, modalOpen, modalError, submitting, submitCode,
// closeModal}) is unchanged; only this component's JSX changed.
export function ElevationModal({ open, error, submitting, onSubmit, onClose }: ElevationModalProps) {
  const [code, setCode] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setCode("");
          onClose();
        }
      }}
    >
      <DialogContent aria-label="Privileged access elevation">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(code);
          }}
        >
          <DialogHeader>
            <DialogTitle>Elevation required</DialogTitle>
            <DialogDescription>This action requires a fresh MFA code (PAM elevation, valid 15 minutes).</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="6-digit code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            aria-label="Authentication code"
            className="my-4 text-center text-lg tracking-[0.3em]"
          />
          {error && <div className="login-alert">{error}</div>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || code.length !== 6}>
              {submitting ? "Verifying..." : "Elevate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
