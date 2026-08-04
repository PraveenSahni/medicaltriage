/**
 * Retention/purge job for completed queue items past a configurable
 * retention window - closes part of NFR-067/068/069 (per-subsystem purge
 * capability) and the RetentionPolicy accepted-risk item in
 * docs/soc2-data-governance-schema-status.md.
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
 *   npx tsx src/scripts/purgeExpiredQueueData.ts --retention-days=90
 *   npx tsx src/scripts/purgeExpiredQueueData.ts --retention-days=90 --execute
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function jsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

async function main() {
  const retentionArg = process.argv.find((a) => a.startsWith("--retention-days="));
  const retentionDays = retentionArg ? Number(retentionArg.split("=")[1]) : 90;
  const execute = process.argv.includes("--execute");

  if (!Number.isFinite(retentionDays) || retentionDays < 1) {
    throw new Error("retention-days must be a positive number");
  }

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
      metadata: jsonValue({ retentionDays, cutoffIso: cutoff.toISOString(), candidateCount: candidates.length })
    }
  });

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Purge run failed:", error);
  process.exitCode = 1;
});
