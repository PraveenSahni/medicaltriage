import { useState } from "react";

// Real onboarding for new users (UX/NFR-017) - shown once, the first time
// a given browser sees this empty state, then dismissed permanently via
// localStorage. This is the natural moment for it: it's the very first
// screen a brand-new nurse sees before touching any real call.
const ONBOARDING_DISMISSED_KEY = "cockpit-onboarding-dismissed";

export function NoActiveCall() {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    } catch {
      // Non-critical - the tip just reappears next session if storage is unavailable.
    }
  }

  return (
    <div className="no-active-call">
      <div className="nac-icon" aria-hidden="true">
        &#9742;
      </div>
      <h2>No active call</h2>
      <p>
        Select a caller from the incoming queue. The cockpit blocks a second active encounter
        until the current call is completed or placed on hold.
      </p>
      {!dismissed && (
        <div className="cockpit-onboarding-tip" role="note">
          <p>
            <strong>New here?</strong> Every call moves through 4 stages, in order: capture the{" "}
            <em>Reason &amp; Rule-Out</em>, answer the <em>Triage Questions</em>, review the{" "}
            <em>Disposition &amp; Advice</em>, then finish with <em>SBAR / Complete</em>. You can
            hold one call and answer another while it waits.
          </p>
          <button type="button" onClick={dismiss}>
            Got it
          </button>
        </div>
      )}
    </div>
  );
}
