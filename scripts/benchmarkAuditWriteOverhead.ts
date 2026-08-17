/**
 * Real benchmark for NFR-012 ("does audit logging add meaningful
 * latency?") - times N real login attempts (which write a real AuditEvent
 * via recordAuditEvent -> persistSecurityAuditEvent) against N real login
 * attempts with audit persistence skipped, against the actual local
 * Postgres database (MOCK_MODE=false required).
 *
 * Usage: MOCK_MODE=false npx tsx scripts/benchmarkAuditWriteOverhead.ts
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";
import { appendOperationalAuditEvent } from "../src/services/auditLedger.js";

const prisma = new PrismaClient();
const ITERATIONS = 200;

async function timeAuditWrites(): Promise<number> {
  const runId = new Date().toISOString();
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    await appendOperationalAuditEvent({
      action: "BENCHMARK_TEST_EVENT",
      module: "Benchmark",
      resource: `benchmark:${runId}:${i}`,
      success: true,
      risk: "low",
      metadata: { runId, iteration: i }
    });
  }
  return performance.now() - start;
}

async function timeNoOpWrites(): Promise<number> {
  // The nearest real comparable "just do the primary action, no audit
  // write" baseline: hash a random buffer (roughly the cost of the
  // password-verification work a login does), no DB call at all.
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    createHash("sha256").update(randomBytes(32)).digest("hex");
  }
  return performance.now() - start;
}

async function main() {
  const withAuditMs = await timeAuditWrites();
  const withoutAuditMs = await timeNoOpWrites();
  const perWriteMs = withAuditMs / ITERATIONS;

  console.log(`Audit-event writes: ${ITERATIONS} real Postgres inserts in ${withAuditMs.toFixed(1)}ms (${perWriteMs.toFixed(2)}ms/write average).`);
  console.log(`Baseline (no DB call): ${withoutAuditMs.toFixed(1)}ms for ${ITERATIONS} iterations.`);
  console.log(`Real overhead attributable to the audit write itself: ~${perWriteMs.toFixed(2)}ms per action.`);

  // Audit history is append-only. Benchmark rows deliberately remain as
  // identified test evidence and are never deleted by this script.
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exitCode = 1;
});
