import { prisma, disconnectPrisma } from "../db.js";

if (process.env.ALLOW_LIVE_PR011_VERIFY !== "SOC2") throw new Error("Set ALLOW_LIVE_PR011_VERIFY=SOC2");

async function main() {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const [policy, migrationRows, expired, recordHolds, organizationHolds, archives, auditRows, raceQueueRows, raceHoldRows] = await Promise.all([
    prisma.retentionPolicy.findUnique({ where: { code: "TRIAGE_QUEUE_ITEM_COMPLETED" } }),
    prisma.$queryRaw<Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>>`
      SELECT migration_name, finished_at, rolled_back_at
      FROM _prisma_migrations
      WHERE migration_name IN (
        '20260817210000_approve_365_day_retention',
        '20260819090000_serialize_legal_hold_mutations'
      )
      ORDER BY migration_name
    `,
    prisma.triageQueueItem.findMany({
      where: { status: "COMPLETED", updatedAt: { lt: cutoff } },
      select: { id: true, organizationId: true }
    }),
    prisma.legalHold.findMany({ where: { resourceType: "TriageQueueItem", status: "active" }, select: { resourceId: true } }),
    prisma.legalHold.findMany({ where: { resourceType: "Organization", status: "active" }, select: { resourceId: true } }),
    prisma.archivedRecord.count({ where: { policyCode: "TRIAGE_QUEUE_ITEM_COMPLETED" } }),
    prisma.auditEvent.findMany({
      where: { action: { in: ["RETENTION_PURGE_DRY_RUN", "RETENTION_PURGE_EXECUTED"] } },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: { action: true, timestamp: true, success: true }
    }),
    prisma.triageQueueItem.count({ where: { id: { startsWith: "pr011-race-item-" } } }),
    prisma.legalHold.count({ where: { id: { startsWith: "pr011-race-hold-" } } })
  ]);
  const heldRecords = new Set(recordHolds.map((row) => row.resourceId));
  const heldOrganizations = new Set(organizationHolds.map((row) => row.resourceId));
  const excluded = expired.filter((row) => heldRecords.has(row.id) || (row.organizationId && heldOrganizations.has(row.organizationId))).length;
  console.log(JSON.stringify({
    inspectedAt: new Date().toISOString(),
    migration: migrationRows.map((row) => ({ name: row.migration_name, applied: Boolean(row.finished_at), rolledBack: Boolean(row.rolled_back_at) })),
    policy: policy ? {
      code: policy.code,
      retentionPeriod: policy.retentionPeriod,
      legalBasisPresent: Boolean(policy.legalBasis?.trim()),
      deletionMode: policy.deletionMode,
      status: policy.status
    } : null,
    cutoff: cutoff.toISOString(),
    expiredCompleted: expired.length,
    excludedByActiveHold: excluded,
    eligible: expired.length - excluded,
    activeRecordHolds: recordHolds.length,
    activeOrganizationHolds: organizationHolds.length,
    archiveCount: archives,
    recentRetentionAuditEvents: auditRows.map((row) => ({ action: row.action, timestamp: row.timestamp.toISOString(), success: row.success })),
    controlledRaceArtifacts: { queueRows: raceQueueRows, holdRows: raceHoldRows }
  }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(disconnectPrisma);
