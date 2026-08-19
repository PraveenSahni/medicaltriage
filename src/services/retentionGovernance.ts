export const APPROVED_RETENTION_DAYS = 365;
export const APPROVED_RETENTION_DECISION = "PR-011-2026-08-17";
export const LEGAL_HOLD_MUTATION_LOCK_ID = 1_096_520_211_011n;

export type ActiveRetentionPolicy = {
  code: string;
  status: string;
  retentionPeriod: unknown;
  deletionMode: string;
  legalBasis?: string | null;
};

export function approvedRetentionDays(policy: ActiveRetentionPolicy | null, execute: boolean, cliOverride?: number): {
  days: number;
  source: string;
} {
  if (cliOverride !== undefined && (!Number.isFinite(cliOverride) || cliOverride < 1)) {
    throw new Error("retention-days must be a positive number");
  }
  if (execute && cliOverride !== undefined) {
    throw new Error("Execute mode rejects --retention-days overrides; use the approved active RetentionPolicy.");
  }
  if (cliOverride !== undefined) return { days: cliOverride, source: "--retention-days dry-run override" };

  const period = policy?.retentionPeriod as { days?: unknown; decisionReference?: unknown } | null;
  const isApproved =
    policy?.status === "active" &&
    period?.days === APPROVED_RETENTION_DAYS &&
    period?.decisionReference === APPROVED_RETENTION_DECISION &&
    Boolean(policy.legalBasis?.trim());
  if (isApproved) {
    return { days: APPROVED_RETENTION_DAYS, source: `approved RetentionPolicy row (${policy!.code})` };
  }
  if (execute) {
    throw new Error(
      `Execute mode requires an active ${APPROVED_RETENTION_DAYS}-day RetentionPolicy with decisionReference=${APPROVED_RETENTION_DECISION} and legalBasis.`
    );
  }
  return { days: APPROVED_RETENTION_DAYS, source: "approved 365-day dry-run baseline; active policy not installed" };
}

export function excludeLegallyHeld<T extends { id: string; organizationId?: string | null }>(
  records: T[],
  heldRecordIds: ReadonlySet<string>,
  heldOrganizationIds: ReadonlySet<string>
): { eligible: T[]; excluded: T[] } {
  const eligible: T[] = [];
  const excluded: T[] = [];
  for (const record of records) {
    if (heldRecordIds.has(record.id) || Boolean(record.organizationId && heldOrganizationIds.has(record.organizationId))) {
      excluded.push(record);
    } else {
      eligible.push(record);
    }
  }
  return { eligible, excluded };
}
