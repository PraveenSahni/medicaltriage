import { disconnectPrisma } from "../db.js";
import { verifyAuditEventChain } from "../services/auditLedger.js";

async function main(): Promise<void> {
  const result = await verifyAuditEventChain();
  console.log(JSON.stringify(result));
  if (!result.valid) {
    process.exitCode = 2;
  }
}

main()
  .catch((error) => {
    console.error("Audit-ledger verification failed:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
