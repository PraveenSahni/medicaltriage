import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { assertIsolatedCwd, cleanupIsolatedTemp, createIsolatedTemp } from "./lib/isolatedTemp.mjs";
import { batch20Protocols } from "../src/data/openSourceGuidelines/batch20.js";
import { generateDemographicBatch } from "../docs/protocol-review/catalog/open-source/scripts/shared-demographic-generator.js";

const protocol = batch20Protocols.find(
  (candidate) => candidate.id === "oscg-postpartum-high-blood-pressure",
);
assert.ok(protocol);

const tempRoot = createIsolatedTemp("catalog-direct-disposition-test-");
try {
  assertIsolatedCwd(tempRoot, tempRoot);
  generateDemographicBatch({
    batch: "direct-test",
    root: tempRoot,
    protocols: [protocol],
    selectedIds: [protocol.id],
    variants: { [protocol.id]: [{ age: "Child", gender: "Female" }] },
    redirects: {
      [protocol.id]: {
        question: "Is this outside the supported postpartum scope?",
        info: "Use governed in-person assessment; do not redirect to an adult-only protocol.",
        dispositionLevel: 70,
        careAdviceId: "oscg-postpartumhighbp-urgent-advice",
      },
    },
    startId: 1,
    endId: 1,
    version: "direct-disposition-self-test",
    sourceText: "UAT DATA - NOT FOR PRODUCTION.",
  });
  const manifest = JSON.parse(
    fs.readFileSync(path.join(tempRoot, "manifests", "batch-direct-test-manifest.json"), "utf8"),
  );
  const doc = JSON.parse(
    fs.readFileSync(path.join(tempRoot, manifest.entries[0].file), "utf8"),
  );
  assert.equal(doc.questions[0].DispositionLevel, 70);
  assert.equal(doc.questions[0].GotoGuideline, null);
  assert.equal(doc.questions[0].AdviceIDs.length, 1);
  assert.equal(manifest.entries[0].redirectTarget, "DIRECT_DISPOSITION_70");
  console.log(JSON.stringify({ status: "PASS", assertions: 5 }, null, 2));
} finally {
  cleanupIsolatedTemp(tempRoot);
}
