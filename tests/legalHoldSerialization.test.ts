import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LEGAL_HOLD_MUTATION_LOCK_ID } from "../src/services/retentionGovernance.js";

describe("PR-011 legal-hold mutation serialization", () => {
  const migration = readFileSync(resolve("prisma/migrations/20260819090000_serialize_legal_hold_mutations/migration.sql"), "utf8");
  const purge = readFileSync(resolve("src/scripts/purgeExpiredQueueData.ts"), "utf8");
  const privacy = readFileSync(resolve("src/scripts/fulfillPrivacyRequests.ts"), "utf8");

  it("installs row and truncate triggers using the governed advisory lock", () => {
    expect(migration).toContain(`pg_advisory_xact_lock(${LEGAL_HOLD_MUTATION_LOCK_ID})`);
    expect(migration).toMatch(/BEFORE INSERT OR UPDATE OR DELETE ON "legal_holds"/);
    expect(migration).toMatch(/BEFORE TRUNCATE ON "legal_holds"/);
  });

  it.each([
    ["retention purge", purge],
    ["privacy erasure", privacy]
  ])("acquires the same lock before querying current items and holds in %s", (_label, source) => {
    const lockIndex = source.indexOf("pg_advisory_xact_lock($1)");
    const currentItemsIndex = Math.min(
      ...[source.indexOf("tx.triageQueueItem.findMany", lockIndex), source.indexOf("tx.legalHold.findMany", lockIndex)]
        .filter((index) => index >= 0)
    );
    expect(lockIndex).toBeGreaterThanOrEqual(0);
    expect(currentItemsIndex).toBeGreaterThan(lockIndex);
  });
});
