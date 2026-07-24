import type { CSSProperties } from "react";

export type SeverityColorTokens = { gc: string; gcbg: string; gcbd: string };

const tokensBySeverity: Record<string, SeverityColorTokens> = {
  Emergency: { gc: "var(--ems)", gcbg: "var(--emsbg)", gcbd: "var(--emsbd)" },
  Urgent: { gc: "var(--hcp4)", gcbg: "var(--hcp4bg)", gcbd: "var(--hcp4bd)" },
  Routine: { gc: "var(--pcp24)", gcbg: "var(--pcp24bg)", gcbd: "var(--pcp24bd)" },
  "Self-care": { gc: "var(--home)", gcbg: "var(--homebg)", gcbd: "var(--homebd)" }
};

export function colorStyleForSeverity(severity: string | undefined): CSSProperties {
  const tokens = tokensBySeverity[severity ?? ""] ?? {
    gc: "var(--muted)",
    gcbg: "var(--bg2)",
    gcbd: "var(--line)"
  };
  return {
    ["--gc" as string]: tokens.gc,
    ["--gcbg" as string]: tokens.gcbg,
    ["--gcbd" as string]: tokens.gcbd
  } as CSSProperties;
}
