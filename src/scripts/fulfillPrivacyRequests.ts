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
import { sanitizeForLog } from "../utils/logSanitizer.js";
import { appendOperationalAuditEvent } from "../services/auditLedger.js";
import { excludeLegallyHeld } from "../services/retentionGovernance.js";

// Masks a person identifier for console output (NFR-078/NFR-004 AI-tab) -
// the durable AuditEvent.metadata below still records the real, unmasked
// requesterRef, since that's the legitimate, access-controlled audit trail
// this job exists to produce; console output goes to Cloud Logging, a much
// broader-access surface, so it gets the same partial mask already used
// elsewhere in this codebase for identifiers in logs/output.
function maskIdentifier(value: string): string {
  if (value.length <= 4) {
    return "***";
  }
  return `${value.slice(0, 3)}***${value.slice(-2)}`;
}

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

// Closes CSQ IS.54 ("litigation holds... freeze of data from a specific
// point in time for a specific customer") - a per-record hold alone can't
// express "freeze everything for this whole tenant"; an org-level hold
// (resourceType "Organization") excludes every record belonging to that
// organization regardless of individual per-record hold rows. Mirrors
// purgeExpiredQueueData.ts's identical org-level hold check.
async function heldOrganizationIds(): Promise<Set<string>> {
  const holds = await prisma.legalHold.findMany({
    where: { resourceType: "Organization", status: "active" },
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
      select: { id: true, status: true, createdAt: true, updatedAt: true, organizationId: true }
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
      console.log(`[access] ${request.id} (${maskIdentifier(request.requesterRef)}): ${items.length} record(s)`, summary);

      if (execute) {
        await prisma.privacyRequest.update({
          where: { id: request.id },
          data: { status: "fulfilled", notes: `Access summary compiled ${new Date().toISOString()}: ${JSON.stringify(summary)}` }
        });
      }

      await appendOperationalAuditEvent({
          action: execute ? "PRIVACY_REQUEST_ACCESS_FULFILLED" : "PRIVACY_REQUEST_ACCESS_DRY_RUN",
          module: "DataPrivacy",
          resource: "PrivacyRequest",
          success: true,
          risk: "medium",
          metadata: { requestId: request.id, requesterRef: request.requesterRef, summary }
      });
      continue;
    }

    if (request.requestType === "erasure") {
      const itemIds = items.map((i) => i.id);
      const [held, heldOrgIds] = await Promise.all([heldIdsFor(itemIds), heldOrganizationIds()]);
      const eligible = items.filter((i) => !held.has(i.id) && !(i.organizationId && heldOrgIds.has(i.organizationId)));
      const heldCount = items.length - eligible.length;

      console.log(
        `[erasure] ${request.id} (${maskIdentifier(request.requesterRef)}): ${items.length} record(s), ${heldCount} excluded by legal hold, ` +
          `${eligible.length} eligible for deletion`
      );

      let executionResult: { deletedCount: number; heldCount: number } | undefined;
      if (execute) {
        const execution = await prisma.$transaction(async (tx) => {
          const currentItems = await tx.triageQueueItem.findMany({
            where: { istStaffId: request.requesterRef },
            select: { id: true, organizationId: true }
          });
          const [recordHolds, organizationHolds] = await Promise.all([
            tx.legalHold.findMany({
              where: { resourceType: "TriageQueueItem", resourceId: { in: currentItems.map((item) => item.id) }, status: "active" },
              select: { resourceId: true }
            }),
            tx.legalHold.findMany({ where: { resourceType: "Organization", status: "active" }, select: { resourceId: true } })
          ]);
          const final = excludeLegallyHeld(
            currentItems,
            new Set(recordHolds.map((hold) => hold.resourceId)),
            new Set(organizationHolds.map((hold) => hold.resourceId))
          );
          const deleted = final.eligible.length
            ? await tx.triageQueueItem.deleteMany({ where: { id: { in: final.eligible.map((item) => item.id) } } })
            : { count: 0 };
          await tx.privacyRequest.update({
            where: { id: request.id },
            data: {
              status: final.excluded.length === 0 ? "fulfilled" : "open",
              notes:
                final.excluded.length === 0
                  ? `Erasure completed ${new Date().toISOString()}: ${deleted.count} record(s) deleted.`
                  : `Erasure partially executed ${new Date().toISOString()}: ${deleted.count} record(s) deleted, ${final.excluded.length} retained under active legal hold; request remains open.`
            }
          });
          return { deletedCount: deleted.count, heldCount: final.excluded.length };
        }, { isolationLevel: "Serializable" });
        executionResult = execution;
        console.log(`Deleted ${execution.deletedCount} record(s); ${execution.heldCount} retained under legal hold.`);
      }

      await appendOperationalAuditEvent({
          action: execute ? "PRIVACY_REQUEST_ERASURE_FULFILLED" : "PRIVACY_REQUEST_ERASURE_DRY_RUN",
          module: "DataPrivacy",
          resource: "PrivacyRequest",
          success: true,
          risk: "high",
          metadata: {
            requestId: request.id,
            requesterRef: request.requesterRef,
            totalRecords: items.length,
            excludedByLegalHoldCount: executionResult?.heldCount ?? heldCount,
            eligibleForDeletionCount: executionResult?.deletedCount ?? eligible.length
          }
      });
      continue;
    }

    console.log(`Skipping ${request.id}: unrecognized requestType "${request.requestType}" (only "access"/"erasure" are handled).`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Privacy request fulfillment run failed:", sanitizeForLog(error));
  process.exitCode = 1;
});
