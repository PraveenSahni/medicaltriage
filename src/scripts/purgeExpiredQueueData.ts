/**
 * Retention/purge job for completed queue items past a configurable
 * retention window - closes part of NFR-067/068/069 (per-subsystem purge
 * capability) and part of the RetentionPolicy accepted-risk item in
 * docs/soc2-data-governance-schema-status.md.
 *
 * The retention window is read from the real `RetentionPolicy` table (code
 * `TRIAGE_QUEUE_ITEM_COMPLETED`) when a row exists - this is the first real
 * enforcement code path for that previously schema-only table. `--retention-days`
 * remains as an explicit override/fallback for when no policy row exists yet,
 * so this script still works standalone (e.g. in an environment that hasn't
 * seeded a policy row) rather than hard-failing.
 *
 * This is intentionally narrow: it purges only TriageQueueItem rows in
 * COMPLETED status whose updatedAt is older than the retention window. It
 * does NOT touch AviationTriageEncounter (the actual clinical record kept
 * for medical/legal reasons) or AuditEvent (audit trail must outlive the
 * operational queue record it describes) - those need their own, separately
 * decided retention periods, not bundled into this first pass.
 *
 * Safety: dry-run by default. Requires --execute to actually delete.
 * Writes a summary AuditEvent for the purge run itself either way.
 *
 * Usage:
 *   npx tsx src/scripts/purgeExpiredQueueData.ts
 *   npx tsx src/scripts/purgeExpiredQueueData.ts --retention-days=90 --execute
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RETENTION_POLICY_CODE = "TRIAGE_QUEUE_ITEM_COMPLETED";

function jsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

async function resolveRetentionDays(cliOverride: number | undefined): Promise<{ days: number; source: string }> {
  if (cliOverride !== undefined) {
    return { days: cliOverride, source: "--retention-days flag" };
  }
  const policy = await prisma.retentionPolicy.findUnique({ where: { code: RETENTION_POLICY_CODE } });
  if (policy && policy.status === "active") {
    const period = policy.retentionPeriod as { days?: number } | null;
    if (period && typeof period.days === "number" && period.days > 0) {
      return { days: period.days, source: `RetentionPolicy row (${policy.code})` };
    }
  }
  return { days: 90, source: "hardcoded default (no active RetentionPolicy row found)" };
}

async function main() {
  const retentionArg = process.argv.find((a) => a.startsWith("--retention-days="));
  const cliOverride = retentionArg ? Number(retentionArg.split("=")[1]) : undefined;
  const execute = process.argv.includes("--execute");

  if (cliOverride !== undefined && (!Number.isFinite(cliOverride) || cliOverride < 1)) {
    throw new Error("retention-days must be a positive number");
  }

  const { days: retentionDays, source: retentionSource } = await resolveRetentionDays(cliOverride);
  console.log(`Retention period source: ${retentionSource} (${retentionDays} days)`);

  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

  const candidates = await prisma.triageQueueItem.findMany({
    where: { status: "COMPLETED", updatedAt: { lt: cutoff } },
    select: { id: true, updatedAt: true, organizationId: true }
  });

  console.log(
    `Retention window: ${retentionDays} days (cutoff ${cutoff.toISOString()}). ` +
      `${candidates.length} COMPLETED queue item(s) eligible for purge. ` +
      `Mode: ${execute ? "EXECUTE (will delete)" : "DRY RUN (no changes)"}`
  );

  if (candidates.length > 0) {
    console.log("Sample (up to 5):", candidates.slice(0, 5).map((c) => ({ id: c.id, updatedAt: c.updatedAt })));
  }

  if (execute && candidates.length > 0) {
    const ids = candidates.map((c) => c.id);
    const result = await prisma.triageQueueItem.deleteMany({ where: { id: { in: ids } } });
    console.log(`Deleted ${result.count} queue item(s).`);
  }

  await prisma.auditEvent.create({
    data: {
      timestamp: new Date(),
      action: execute ? "RETENTION_PURGE_EXECUTED" : "RETENTION_PURGE_DRY_RUN",
      module: "DataRetention",
      resource: "TriageQueueItem",
      success: true,
      riskLevel: execute ? "high" : "medium",
      metadata: jsonValue({ retentionDays, retentionSource, cutoffIso: cutoff.toISOString(), candidateCount: candidates.length })
    }
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Purge run failed:", error);
  process.exitCode = 1;
});
