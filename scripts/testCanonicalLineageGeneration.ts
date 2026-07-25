import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertIsolatedCwd, cleanupIsolatedTemp, createIsolatedTemp } from "./lib/isolatedTemp.mjs";
import { batch21Protocols } from "../src/data/openSourceGuidelines/batch21.js";
import {
  canonicalLineageId,
  generateDemographicBatch,
} from "../docs/protocol-review/catalog/open-source/scripts/shared-demographic-generator.js";

const base = batch21Protocols.find((protocol) => protocol.id === "oscg-ankle-pain");
assert.ok(base, "Ankle Pain canonical source must exist");

const pediatricVariant = {
  ...base,
  id: "oscg-ankle-pain-child",
  canonicalSourceProtocolId: base.id,
};

assert.equal(canonicalLineageId(base), "oscg-ankle-pain");
assert.equal(canonicalLineageId(pediatricVariant), "oscg-ankle-pain");

const tempRoot = createIsolatedTemp("catalog-lineage-self-test-");
try {
  assertIsolatedCwd(tempRoot, tempRoot);
  generateDemographicBatch({
    batch: "test",
    root: tempRoot,
    protocols: [pediatricVariant],
    selectedIds: [pediatricVariant.id],
    redirects: {
      [pediatricVariant.id]: {
        question: "Was this caused by a motor vehicle crash?",
        info: "Use the Motor Vehicle Accident pathway.",
        target: "Motor Vehicle Accident",
      },
    },
    variants: {
      [pediatricVariant.id]: [{ age: "Child", gender: "Male" }],
    },
    startId: 1,
    endId: 1,
    version: "lineage-self-test",
    sourceText: "UAT DATA - NOT FOR PRODUCTION.",
  });

  const manifest = JSON.parse(
    fs.readFileSync(path.join(tempRoot, "manifests", "batch-test-manifest.json"), "utf8"),
  );
  assert.equal(manifest.entries.length, 1);
  assert.equal(manifest.entries[0].sourceProtocolId, "oscg-ankle-pain");
  assert.equal(manifest.entries[0].canonicalSourceProtocolId, "oscg-ankle-pain");
  assert.notEqual(manifest.entries[0].sourceProtocolId, pediatricVariant.id);
  console.log(JSON.stringify({ status: "PASS", assertions: 6 }, null, 2));
} finally {
  cleanupIsolatedTemp(tempRoot);
}
