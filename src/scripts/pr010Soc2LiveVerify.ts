import { mkdir, writeFile } from "node:fs/promises";
import { auditPrisma, disconnectPrisma } from "../db.js";
import { verifyAuditEventChain } from "../services/auditLedger.js";

if (process.env.ALLOW_LIVE_PR010_VERIFY !== "SOC2") throw new Error("Set ALLOW_LIVE_PR010_VERIFY=SOC2");
const phase = process.env.PR010_VERIFY_PHASE === "post-restart" ? "post-restart" : "pre-restart";

async function blocked(statement: string): Promise<boolean> {
  try {
    await auditPrisma.$executeRawUnsafe(statement);
    return false;
  } catch {
    return true;
  }
}

async function main() {
  const chain = await verifyAuditEventChain();
  if (!chain.valid || chain.checkedEvents < 1) throw new Error(`Audit chain invalid: ${JSON.stringify(chain)}`);
  const actionRows = await auditPrisma.$queryRaw<Array<{ action: string; count: bigint }>>`
    SELECT action, COUNT(*)::bigint AS count
    FROM audit_events
    WHERE event_hash IS NOT NULL
    GROUP BY action
    ORDER BY action
  `;
  const actions = Object.fromEntries(actionRows.map((row) => [row.action, Number(row.count)]));
  const requiredFamilies = [
    ["LOGIN", "LOGIN_MFA_VERIFIED"],
    ["USER_CREATED", "USER_STATUS_CHANGED"],
    ["ROLE_PERMISSION_GRANTED", "ROLE_PERMISSION_REVOKED"],
    ["QUEUE_ITEM_CREATE"],
    ["QUEUE_ITEM_CLAIM"],
    ["QUEUE_CONTEXT_UPDATE"],
    ["QUEUE_ITEM_MOVE"],
    ["QUEUE_ITEM_DELETE"]
  ];
  const missingFamilies = requiredFamilies.filter((family) => !family.some((action) => (actions[action] ?? 0) > 0));
  if (missingFamilies.length) throw new Error(`Missing cross-path audit families: ${missingFamilies.map((family) => family.join("|")).join(", ")}`);

  const tamper = {
    updateBlocked: await blocked('UPDATE "audit_events" SET "event_hash" = "event_hash" WHERE "sequence_number" = (SELECT MAX("sequence_number") FROM "audit_events")'),
    deleteBlocked: await blocked('DELETE FROM "audit_events" WHERE "sequence_number" = (SELECT MAX("sequence_number") FROM "audit_events")'),
    truncateBlocked: await blocked('TRUNCATE TABLE "audit_events"')
  };
  if (!Object.values(tamper).every(Boolean)) throw new Error(`Audit mutation unexpectedly allowed: ${JSON.stringify(tamper)}`);

  const result = { control: "PR-010", phase, executedAt: new Date().toISOString(), chain, actions, tamper, passed: true };
  await mkdir("test-results", { recursive: true });
  const path = `test-results/pr010-soc2-${phase}-${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}.json`;
  await writeFile(path, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result));
  console.log(`Evidence: ${path}`);
}

main().catch((error) => { console.error("PR-010 SOC2 verification failed:", error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(disconnectPrisma);
