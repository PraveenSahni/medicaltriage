import { PrismaClient } from "@prisma/client";
import { LEGAL_HOLD_MUTATION_LOCK_ID } from "../services/retentionGovernance.js";

if (process.env.ALLOW_LIVE_PR011_RACE !== "SOC2") throw new Error("Set ALLOW_LIVE_PR011_RACE=SOC2");
if (!process.env.DATABASE_URL?.includes("ist_triage_soc2")) throw new Error("Refusing non-SOC2 database target");

const holdClient = new PrismaClient();
const purgeClient = new PrismaClient();
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
const itemId = `pr011-race-item-${stamp}`;
const holdId = `pr011-race-hold-${stamp}`;
const holdCode = `PR011-RACE-${stamp}`;

async function main() {
  let releaseHold!: () => void;
  let markInserted!: () => void;
  const inserted = new Promise<void>((resolve) => { markInserted = resolve; });
  const release = new Promise<void>((resolve) => { releaseHold = resolve; });

  await purgeClient.triageQueueItem.create({
    data: {
      id: itemId,
      istStaffId: `PR011-${stamp}`,
      status: "COMPLETED",
      currentStage: "SBAR",
      summary: "PR-011 controlled synthetic legal-hold race record",
      slaDeadline: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000)
    }
  });

  const holdTransaction = holdClient.$transaction(async (tx) => {
    await tx.legalHold.create({
      data: {
        id: holdId,
        holdCode,
        resourceType: "TriageQueueItem",
        resourceId: itemId,
        reason: "PR-011 controlled concurrency verification",
        createdBy: "codex-pr011-uat"
      }
    });
    markInserted();
    await release;
  }, { timeout: 10_000 });

  await inserted;
  let purgeSettled = false;
  const purgeTransaction = purgeClient.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SELECT pg_advisory_xact_lock($1)", LEGAL_HOLD_MUTATION_LOCK_ID);
    const item = await tx.triageQueueItem.findUnique({ where: { id: itemId }, select: { id: true } });
    const hold = await tx.legalHold.findFirst({
      where: { resourceType: "TriageQueueItem", resourceId: itemId, status: "active" },
      select: { id: true }
    });
    if (item && !hold) await tx.triageQueueItem.delete({ where: { id: itemId } });
    return { itemFound: Boolean(item), holdFound: Boolean(hold), deleted: Boolean(item && !hold) };
  }, { timeout: 10_000 }).finally(() => { purgeSettled = true; });

  await new Promise((resolve) => setTimeout(resolve, 500));
  const blockedUntilHoldCommit = !purgeSettled;
  releaseHold();
  await holdTransaction;
  const result = await purgeTransaction;
  const retained = Boolean(await purgeClient.triageQueueItem.findUnique({ where: { id: itemId }, select: { id: true } }));
  if (!blockedUntilHoldCommit || !result.holdFound || result.deleted || !retained) {
    throw new Error(`Legal-hold race failed: ${JSON.stringify({ blockedUntilHoldCommit, ...result, retained })}`);
  }
  console.log(JSON.stringify({ control: "PR-011", blockedUntilHoldCommit, ...result, retained, passed: true }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}).finally(async () => {
  // Exact synthetic IDs only; never broaden this cleanup predicate.
  await purgeClient.legalHold.deleteMany({ where: { id: holdId, holdCode } });
  await purgeClient.triageQueueItem.deleteMany({ where: { id: itemId, istStaffId: `PR011-${stamp}` } });
  await Promise.all([holdClient.$disconnect(), purgeClient.$disconnect()]);
});
