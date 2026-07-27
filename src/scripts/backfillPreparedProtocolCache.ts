/**
 * One-time maintenance run: see backfillPreparedProtocolCache() in
 * queueOrchestration.ts for why this is needed - existing queue records
 * saved before the ragShadow round-trip fix keep recomputing their full
 * protocol match on every single list/get request forever. This persists
 * the corrected value once so the cache check starts passing.
 *
 * Usage: npx tsx src/scripts/backfillPreparedProtocolCache.ts
 */
import { backfillPreparedProtocolCache } from "../services/queueOrchestration.js";

backfillPreparedProtocolCache()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error("Backfill failed", error);
    process.exitCode = 1;
  });
