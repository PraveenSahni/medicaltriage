import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertIsolatedCwd, cleanupIsolatedTemp, createIsolatedTemp } from "./lib/isolatedTemp.mjs";
import { batch13Protocols } from "../src/data/openSourceGuidelines/batch13.js";
import { batch14Protocols } from "../src/data/openSourceGuidelines/batch14.js";
import { batch15Protocols } from "../src/data/openSourceGuidelines/batch15.js";
import { batch16Protocols } from "../src/data/openSourceGuidelines/batch16.js";
import { batch17Protocols } from "../src/data/openSourceGuidelines/batch17.js";
import { batch18Protocols } from "../src/data/openSourceGuidelines/batch18.js";
import { batch19Protocols } from "../src/data/openSourceGuidelines/batch19.js";
import { batch20Protocols } from "../src/data/openSourceGuidelines/batch20.js";
import { batch21Protocols } from "../src/data/openSourceGuidelines/batch21.js";
import { batch22Protocols } from "../src/data/openSourceGuidelines/batch22.js";
import { batch23Protocols } from "../src/data/openSourceGuidelines/batch23.js";
import { generateDemographicBatch } from "../docs/protocol-review/catalog/open-source/scripts/shared-demographic-generator.js";

const batches = new Map<number, any[]>([
  [13, batch13Protocols],
  [14, batch14Protocols],
  [15, batch15Protocols],
  [16, batch16Protocols],
  [17, batch17Protocols],
  [18, batch18Protocols],
  [19, batch19Protocols],
  [20, batch20Protocols],
  [21, batch21Protocols],
  [22, batch22Protocols],
  [23, batch23Protocols],
]);
const prohibited =
  /\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b|\bchemist\b|\bwalk-in centre\b|\bminor injuries unit\b/i;
const tempRoot = createIsolatedTemp("catalog-b13-b23-self-test-");
let generated = 0;

try {
  assertIsolatedCwd(tempRoot, tempRoot);
  for (const [batch, protocols] of batches) {
    const selectedIds = protocols.map((protocol) => protocol.id);
    const root = path.join(tempRoot, `batch-${batch}`);
    generateDemographicBatch({
      batch: String(batch),
      root,
      protocols,
      selectedIds,
      redirects: Object.fromEntries(
        selectedIds.map((id) => [
          id,
          {
            question: "Does another governed protocol better match the primary concern?",
            info: "Use only a clinically matched target approved by Qatar governance.",
            target: "GOVERNANCE_REQUIRED",
          },
        ]),
      ),
      variants: Object.fromEntries(
        selectedIds.map((id) => [id, [{ age: "Adult", gender: "Male" }]]),
      ),
      startId: 1,
      endId: selectedIds.length,
      version: "operational-localization-self-test",
      sourceText: "UAT DATA - NOT FOR PRODUCTION.",
    });
    const jsonDir = path.join(root, "json");
    for (const file of fs.readdirSync(jsonDir).filter((name) => name.endsWith(".db.json"))) {
      const text = fs.readFileSync(path.join(jsonDir, file), "utf8");
      assert.doesNotMatch(text, prohibited, `Batch ${batch}: ${file}`);
      generated += 1;
    }
  }
  console.log(JSON.stringify({ status: "PASS", batches: batches.size, generated }, null, 2));
} finally {
  cleanupIsolatedTemp(tempRoot);
}
