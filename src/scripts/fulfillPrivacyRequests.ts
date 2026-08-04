/**
 * DSAR (Data Subject Access Request) fulfillment job for the `PrivacyRequest`
 * table - the first real enforcement code path for a table that was
 * previously schema-only (R-04, docs/soc2-data-governance-schema-status.md).
 *
 * Handles two request types against `TriageQueueItem` rows matching
 * `requesterRef` (the staff member's istStaffId):
 *   - "access": compiles a summary (record count, statuses, date range) into
 *     the request's `notes` field and marks it fulfilled. No data is changed.
 *   - "erasure": deletes the requester's TriageQueueItem rows, EXCLUDING any
 *     row with an active LegalHold (mirrors purgeExpiredQueueData.ts's same
 *     enforcement), then marks the request fulfilled.
 *
 * Intentionally narrow: only TriageQueueItem is in scope for this first
 * pass, matching the same scope purgeExpiredQueueData.ts already covers -
 * AviationTriageEncounter and AuditEvent have their own separate retention
 * decisions and are not touched here.
 *
 * Safety: dry-run by default. Requires --execute to actually change data or
 * mark a request fulfilled. Writes a summary AuditEvent per request either way.
 *
 * Usage:
 *   npx tsx src/scripts/fulfillPrivacyRequests.ts
 *   npx tsx src/scripts/fulfillPrivacyRequests.ts --execute
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function jsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

async function heldIdsFor(itemIds: string[]): Promise<Set<string>> {
  if (itemIds.length === 0) return new Set();
  const holds = await prisma.legalHold.findMany({
    where: { resourceType: "TriageQueueItem", resourceId: { in: itemIds }, status: "active" },
    select: { resourceId: true }
  });
  return new Set(holds.map((h) => h.resourceId));
}

async function main() {
  const execute = process.argv.includes("--execute");

  const openRequests = await prisma.privacyRequest.findMany({ where: { status: "open" } });
  console.log(`${openRequests.length} open PrivacyRequest row(s). Mode: ${execute ? "EXECUTE" : "DRY RUN (no changes)"}`);

  for (const request of openRequests) {
    const items = await prisma.triageQueueItem.findMany({
      where: { istStaffId: request.requesterRef },
      select: { id: true, status: true, createdAt: true, updatedAt: true }
    });

    if (request.requestType === "access") {
      const summary = {
        recordCount: items.length,
        statusBreakdown: items.reduce<Record<string, number>>((acc, i) => {
          acc[i.status] = (acc[i.status] ?? 0) + 1;
          return acc;
        }, {}),
        earliestCreatedAt: items.length ? items.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)).createdAt : null,
        latestUpdatedAt: items.length ? items.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b)).updatedAt : null
      };
      console.log(`[access] ${request.id} (${request.requesterRef}): ${items.length} record(s)`, summary);

      if (execute) {
        await prisma.privacyRequest.update({
          where: { id: request.id },
          data: { status: "fulfilled", notes: `Access summary compiled ${new Date().toISOString()}: ${JSON.stringify(summary)}` }
        });
      }

      await prisma.auditEvent.create({
        data: {
          timestamp: new Date(),
          action: execute ? "PRIVACY_REQUEST_ACCESS_FULFILLED" : "PRIVACY_REQUEST_ACCESS_DRY_RUN",
          module: "DataPrivacy",
          resource: "PrivacyRequest",
          success: true,
          riskLevel: "medium",
          metadata: jsonValue({ requestId: request.id, requesterRef: request.requesterRef, summary })
        }
      });
      continue;
    }

    if (request.requestType === "erasure") {
      const itemIds = items.map((i) => i.id);
      const held = await heldIdsFor(itemIds);
      const eligible = items.filter((i) => !held.has(i.id));

      console.log(
        `[erasure] ${request.id} (${request.requesterRef}): ${items.length} record(s), ${held.size} excluded by legal hold, ` +
          `${eligible.length} eligible for deletion`
      );

      if (execute && eligible.length > 0) {
        const result = await prisma.triageQueueItem.deleteMany({ where: { id: { in: eligible.map((i) => i.id) } } });
        console.log(`Deleted ${result.count} queue item(s) for erasure request ${request.id}.`);
      }

      if (execute) {
        await prisma.privacyRequest.update({
          where: { id: request.id },
          data: {
            status: "fulfilled",
            notes: `Erasure completed ${new Date().toISOString()}: ${eligible.length} record(s) deleted, ${held.size} retained under active legal hold.`
          }
        });
      }

      await prisma.auditEvent.create({
        data: {
          timestamp: new Date(),
          action: execute ? "PRIVACY_REQUEST_ERASURE_FULFILLED" : "PRIVACY_REQUEST_ERASURE_DRY_RUN",
          module: "DataPrivacy",
          resource: "PrivacyRequest",
          success: true,
          riskLevel: "high",
          metadata: jsonValue({
            requestId: request.id,
            requesterRef: request.requesterRef,
            totalRecords: items.length,
            excludedByLegalHoldCount: held.size,
            eligibleForDeletionCount: eligible.length
          })
        }
      });
      continue;
    }

    console.log(`Skipping ${request.id}: unrecognized requestType "${request.requestType}" (only "access"/"erasure" are handled).`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Privacy request fulfillment run failed:", error);
  process.exitCode = 1;
});
