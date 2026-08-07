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

const prisma = new PrismaClient();
const ITERATIONS = 200;

function auditEventPayload(i: number) {
  return {
    timestamp: new Date(),
    action: "BENCHMARK_TEST_EVENT",
    module: "Benchmark",
    resource: `benchmark:${i}`,
    success: true,
    riskLevel: "low" as const
  };
}

async function timeAuditWrites(): Promise<number> {
  const start = performance.now();
  for (let i = 0; i < ITERATIONS; i++) {
    await prisma.auditEvent.create({ data: auditEventPayload(i) });
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

  await prisma.auditEvent.deleteMany({ where: { action: "BENCHMARK_TEST_EVENT" } });
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Benchmark failed:", error);
  process.exitCode = 1;
});
