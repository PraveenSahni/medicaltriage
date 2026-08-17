import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  istTriagePrisma?: PrismaClient;
};

// Closes part of NFR-138/152/156's root cause: Prisma's default pool size
// (2 * vCPUs + 1 - effectively 3 on this service's default 1-vCPU Cloud Run
// allocation) was confirmed via live Cloud Monitoring metrics during a real
// load test (2026-08-05) to cap concurrent DB work well below what 10
// concurrent requests need - active connections stayed at 2-4 throughout
// while Cloud SQL CPU stayed under 12%, meaning requests were queueing for
// a free connection, not for the database itself to keep up. Raising this
// per-instance limit is a deliberately conservative fix (default 8, not an
// unbounded value): the underlying Cloud SQL instance is shared across
// soc2, demo, and this session's own local-dev tunnel with a hard
// `max_connections` ceiling documented in this engagement's risk register,
// so an unbounded per-instance pool combined with Cloud Run autoscaling
// could itself exhaust that shared ceiling - see
// docs/performance/nfr-138-152-156-root-cause.md for the full analysis
// and residual risk if this service scales out to many instances at once.
function withConnectionLimit(databaseUrl: string): string {
  if (databaseUrl.includes("connection_limit=")) {
    return databaseUrl;
  }
  const limit = process.env.DATABASE_CONNECTION_LIMIT ?? "8";
  const separator = databaseUrl.includes("?") ? "&" : "?";
  return `${databaseUrl}${separator}connection_limit=${limit}`;
}

const datasourceUrl = process.env.DATABASE_URL ? withConnectionLimit(process.env.DATABASE_URL) : undefined;

export const prisma =
  globalForPrisma.istTriagePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {})
  });

// PR-010: production audit writes use a separate database principal whose
// grants are limited to SELECT/INSERT on the append-only audit ledger. Local
// development can reuse the primary client when AUDIT_DATABASE_URL is absent.
export const auditPrisma = process.env.AUDIT_DATABASE_URL
  ? new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      datasourceUrl: withConnectionLimit(process.env.AUDIT_DATABASE_URL)
    })
  : prisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.istTriagePrisma = prisma;
}

export async function disconnectPrisma(): Promise<void> {
  if (auditPrisma !== prisma) {
    await auditPrisma.$disconnect();
  }
  await prisma.$disconnect();
}
