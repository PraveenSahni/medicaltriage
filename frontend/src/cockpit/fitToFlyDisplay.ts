import type { CSSProperties } from "react";

export type FitToFlyStatus = "CLEARED" | "RESTRICTED" | "MEDICAL_REVIEW_REQUIRED";

// Labels match the 4-state convention the user specified for the always-visible
// header badge: Not Assessed (grey, before a disposition is reached) / Fit
// (green) / Restricted (red) / Need Assessment (orange) - CLEARED/
// MEDICAL_REVIEW_REQUIRED are the same underlying backend statuses, just
// labeled "Fit"/"Need Assessment" here rather than the more clinical-sounding
// "Cleared"/"Medical Review Required" used elsewhere.
export const FIT_TO_FLY_LABEL: Record<FitToFlyStatus, string> = {
  CLEARED: "Fit",
  RESTRICTED: "Restricted",
  MEDICAL_REVIEW_REQUIRED: "Need Assessment"
};

export const FIT_TO_FLY_NOT_ASSESSED_LABEL = "Not Assessed";

export const FIT_TO_FLY_RATIONALE: Record<FitToFlyStatus, string> = {
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
// `undefined` (no disposition reached yet, so nothing has been assessed) is
// its own neutral grey state - it must NOT default to the green "Fit" tokens,
// since "not assessed yet" and "assessed as fit" are clinically different.
export function colorStyleForFitToFly(status: FitToFlyStatus | undefined): CSSProperties {
  const tokens =
    status === "RESTRICTED"
      ? { gc: "var(--ems)", gcbg: "var(--emsbg)", gcbd: "var(--emsbd)" }
      : status === "MEDICAL_REVIEW_REQUIRED"
        ? { gc: "var(--hcp4)", gcbg: "var(--hcp4bg)", gcbd: "var(--hcp4bd)" }
        : status === "CLEARED"
          ? { gc: "var(--home)", gcbg: "var(--homebg)", gcbd: "var(--homebd)" }
          : { gc: "var(--muted)", gcbg: "var(--bg2)", gcbd: "var(--line)" };
  return {
    ["--gc" as string]: tokens.gc,
    ["--gcbg" as string]: tokens.gcbg,
    ["--gcbd" as string]: tokens.gcbd
  } as CSSProperties;
}
