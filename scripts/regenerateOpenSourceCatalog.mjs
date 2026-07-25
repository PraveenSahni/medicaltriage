import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { CATALOG_ROOT, REPO_ROOT, validateCatalog } from "./validateOpenSourceCatalog.mjs";
import {
  ADULT_ONLY_ALGORITHM_IDS,
  ADULT_ONLY_CATALOG_COUNT,
} from "./adultOnlyCatalogPolicy.mjs";

const CONFIRMATION = "REGENERATE-ADULT-UAT-CATALOG-258";
const execute = process.argv.includes("--execute");
const confirmationIndex = process.argv.indexOf("--confirm");
const confirmed = confirmationIndex >= 0 && process.argv[confirmationIndex + 1] === CONFIRMATION;
const canonicalApproved = process.argv.includes("--canonical-approved");
const rollbackSelfTest = process.argv.includes("--self-test-rollback");

const batchRoot = (batch, catalogRoot = CATALOG_ROOT) =>
  batch === 1 ? catalogRoot : path.join(catalogRoot, `batch-${String(batch).padStart(2, "0")}`);
const pad = (batch) => String(batch).padStart(2, "0");
const generatedDirectories = ["json", "pdf", "evidence", "manifests", "research-gaps", "batches", "runtime"];
const allowedPatterns = {
  json: /\.db\.json$/,
  pdf: /\.pdf$/,
  evidence: /-evidence-and-parity-report\.md$/,
  manifests: /^batch-\d{2}-manifest\.json$/,
  "research-gaps": /^batch-\d{2}-research-gap-register\.json$/,
  batches: /^batch-\d{2}-summary\.md$/,
  runtime: /^(?:batch-\d{2}|batches-\d+(?:-\d+)*-filtered)\.runtime\.json$/,
};

function assertWithin(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Unsafe generated path: ${candidate}`);
  }
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: REPO_ROOT, stdio: "inherit", shell: false });
  if (result.error) {
    throw new Error(`${command} ${args.join(" ")} failed to start: ${result.error.code ?? "UNKNOWN"} ${result.error.message}`);
  }
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with ${result.status}`);
}

function cleanGeneratedBatch(batch, preserve = new Set(), catalogRoot = CATALOG_ROOT) {
  const root = batchRoot(batch, catalogRoot);
  for (const directory of generatedDirectories) {
    if (preserve.has(directory)) continue;
    const target = path.join(root, directory);
    assertWithin(catalogRoot, target);
    if (!fs.existsSync(target)) continue;
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      if (!entry.isFile()) throw new Error(`Unexpected non-file in generated directory: ${path.join(target, entry.name)}`);
      if (!allowedPatterns[directory].test(entry.name)) {
        throw new Error(`Refusing to remove unexpected file: ${path.join(target, entry.name)}`);
      }
      fs.rmSync(path.join(target, entry.name));
    }
  }
}

function snapshotGeneratedCatalog(catalogRoot = CATALOG_ROOT) {
  const snapshotRoot = fs.mkdtempSync(path.join(os.tmpdir(), "aimltriage-catalog-backup-"));
  for (let batch = 1; batch <= 23; batch += 1) {
    const sourceRoot = batchRoot(batch, catalogRoot);
    const batchSnapshotRoot = path.join(snapshotRoot, `batch-${pad(batch)}`);
    for (const directory of generatedDirectories) {
      const source = path.join(sourceRoot, directory);
      if (!fs.existsSync(source)) continue;
      const destination = path.join(batchSnapshotRoot, directory);
      fs.mkdirSync(destination, { recursive: true });
      for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        if (!entry.isFile() || !allowedPatterns[directory].test(entry.name)) {
          throw new Error(`Unsafe generated artifact: ${path.join(source, entry.name)}`);
        }
        fs.copyFileSync(path.join(source, entry.name), path.join(destination, entry.name));
      }
    }
  }
  return snapshotRoot;
}

function restoreGeneratedCatalog(snapshotRoot, catalogRoot = CATALOG_ROOT) {
  for (let batch = 1; batch <= 23; batch += 1) cleanGeneratedBatch(batch, new Set(), catalogRoot);
  for (let batch = 1; batch <= 23; batch += 1) {
    const sourceRoot = path.join(snapshotRoot, `batch-${pad(batch)}`);
    const destinationRoot = batchRoot(batch, catalogRoot);
    for (const directory of generatedDirectories) {
      const source = path.join(sourceRoot, directory);
      if (!fs.existsSync(source)) continue;
      const destination = path.join(destinationRoot, directory);
      assertWithin(catalogRoot, destination);
      fs.mkdirSync(destination, { recursive: true });
      for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
        if (!entry.isFile() || !allowedPatterns[directory].test(entry.name)) {
          throw new Error(`Unsafe snapshot entry: ${path.join(source, entry.name)}`);
        }
        fs.copyFileSync(path.join(source, entry.name), path.join(destination, entry.name));
      }
    }
  }
}

function assertBatch01CanonicalSet() {
  const root = batchRoot(1);
  const jsonDir = path.join(root, "json");
  const ids = fs.readdirSync(jsonDir)
    .filter((name) => allowedPatterns.json.test(name))
    .map((name) => JSON.parse(fs.readFileSync(path.join(jsonDir, name), "utf8")).algorithm.AlgorithmID)
    .sort((a, b) => a - b);
  const expected = ADULT_ONLY_ALGORITHM_IDS.filter((id) => id >= 1001 && id <= 1040);
  if (JSON.stringify(ids) !== JSON.stringify(expected)) {
    throw new Error(`Batch 01 canonical IDs must be exactly 1001-1040; received ${ids.join(",")}`);
  }
  const manifest = JSON.parse(
    fs.readFileSync(path.join(root, "manifests", "batch-01-manifest.json"), "utf8"),
  );
  if (manifest.protocolCount !== 20 || manifest.entries?.length !== 20) {
    throw new Error("Batch 01 adult-only manifest must contain exactly 20 entries");
  }
}

function repairManifestSourceProtocolIds(batch) {
  const root = batchRoot(batch);
  const manifestPath = path.join(root, "manifests", `batch-${pad(batch)}-manifest.json`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const entry of manifest.entries) {
    if (!entry.sourceProtocolId) {
      const sourceProtocolId = entry.importSource?.match(/#([^|]+)/)?.[1];
      if (!sourceProtocolId) throw new Error(`Batch ${batch} ID ${entry.algorithmId}: cannot derive sourceProtocolId`);
      entry.sourceProtocolId = sourceProtocolId;
    }
    entry.canonicalSourceProtocolId ??= entry.sourceProtocolId;
    entry.validationStatus = "BLOCKED_BY_RESEARCH_GAP";
    const jsonPath = path.join(root, entry.file);
    const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    entry.canonicalContentHash = crypto.createHash("sha256").update(JSON.stringify(doc)).digest("hex");
    const evidencePath = path.join(
      root,
      "evidence",
      `${path.basename(entry.file, ".db.json")}-evidence-and-parity-report.md`,
    );
    if (fs.existsSync(evidencePath)) {
      const evidence = fs.readFileSync(evidencePath, "utf8")
        .replace(/- Content hash: `[a-f0-9]{64}`/, `- Content hash: \`${entry.canonicalContentHash}\``);
      fs.writeFileSync(evidencePath, evidence);
    }
  }
  manifest.safetyBoundary = {
    usageStatus: "UAT_ONLY",
    productionEligible: false,
    requiresClinicalValidation: true,
    importOrDeploymentPerformed: false,
  };
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function forceGeneratedSafety(batch) {
  const root = batchRoot(batch);
  const manifestPath = path.join(root, "manifests", `batch-${pad(batch)}-manifest.json`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const entry of manifest.entries) {
    const jsonPath = path.join(root, entry.file);
    const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    for (const question of doc.questions ?? []) question.TelemedicineEligible = false;
    const notice = "UAT DATA ONLY - NOT FOR REAL-PATIENT CARE OR PRODUCTION USE.";
    if (!doc._source.includes(notice)) doc._source = `${doc._source} ${notice}`;
    fs.writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`);
  }
}

function printPlan() {
  console.log(JSON.stringify({
    mode: execute ? "execute" : "plan-only",
    confirmationRequired: CONFIRMATION,
    canonicalApprovalRequired: true,
    batches: "01-23",
    expectedRecords: ADULT_ONLY_CATALOG_COUNT,
    sourceOnlyFamilies: "preserved by each generator's explicit selectedIds/excludedNotes",
    cleanupRoots: Array.from({ length: 23 }, (_, index) => generatedDirectories.map(
      (directory) => path.join(batchRoot(index + 1), directory),
    )).flat(),
    importsOrDeployments: false,
  }, null, 2));
}

function selfTestRollback() {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), "aimltriage-rollback-fixture-"));
  let snapshot;
  try {
    const fixtures = [
      [path.join("json", "sample.db.json"), "original-json"],
      [path.join("runtime", "batch-01.runtime.json"), "original-runtime"],
      [path.join("runtime", "batches-2-3-4-filtered.runtime.json"), "original-filtered-runtime"],
      [path.join("batch-23", "json", "sample.db.json"), "original-batch23"],
    ];
    for (const [relative, content] of fixtures) {
      const target = path.join(fixtureRoot, relative);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
    snapshot = snapshotGeneratedCatalog(fixtureRoot);
    cleanGeneratedBatch(1, new Set(), fixtureRoot);
    cleanGeneratedBatch(23, new Set(), fixtureRoot);
    const failedOutput = path.join(fixtureRoot, "json", "sample.db.json");
    fs.mkdirSync(path.dirname(failedOutput), { recursive: true });
    fs.writeFileSync(failedOutput, "failed-run");
    restoreGeneratedCatalog(snapshot, fixtureRoot);
    for (const [relative, content] of fixtures) {
      if (fs.readFileSync(path.join(fixtureRoot, relative), "utf8") !== content) {
        throw new Error(`Rollback self-test mismatch: ${relative}`);
      }
    }
    console.log(JSON.stringify({ rollbackSelfTest: "PASS", liveCatalogTouched: false }, null, 2));
  } finally {
    if (snapshot) fs.rmSync(snapshot, { recursive: true, force: true });
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }
}

if (rollbackSelfTest) {
  selfTestRollback();
  process.exit(0);
}

printPlan();
if (!execute) process.exit(0);
if (!confirmed) throw new Error(`Execution requires --confirm ${CONFIRMATION}`);
if (!canonicalApproved) {
  throw new Error("Execution requires --canonical-approved after the child-suicide and HEART canonical fixes pass review");
}
if (process.env.NODE_ENV?.toLowerCase() === "production" || process.env.APP_ENVIRONMENT?.toLowerCase() === "production") {
  throw new Error("Catalog regeneration is prohibited in a production environment");
}

run("node", ["node_modules/typescript/bin/tsc", "-p", "tsconfig.json", "--noEmit"]);
const catalogSnapshot = snapshotGeneratedCatalog();
try {
  cleanGeneratedBatch(1);
  for (let batch = 2; batch <= 23; batch += 1) cleanGeneratedBatch(batch);

  run("node", ["node_modules/tsx/dist/cli.mjs", "docs/protocol-review/catalog/open-source/scripts/generate-batch01.ts"]);
  assertBatch01CanonicalSet();
  for (let batch = 2; batch <= 23; batch += 1) {
    run("node", ["node_modules/tsx/dist/cli.mjs", `docs/protocol-review/catalog/open-source/scripts/generate-batch${pad(batch)}.ts`]);
  }
  for (let batch = 1; batch <= 23; batch += 1) {
    forceGeneratedSafety(batch);
    repairManifestSourceProtocolIds(batch);
  }
  for (let batch = 1; batch <= 23; batch += 1) {
    const root = batchRoot(batch);
    run("node", [
      "scripts/runPython.mjs",
      "docs/protocol-review/catalog/open-source/scripts/render-batch01-pdfs.py",
      "--batch-root", root,
      "--manifest", `batch-${pad(batch)}-manifest.json`,
    ]);
    run("node", [
      "docs/protocol-review/catalog/open-source/scripts/validate-adult-only-batch.mjs",
      String(batch),
    ]);
  }
  run("node", ["docs/protocol-review/catalog/open-source/scripts/validate-redirect-aliases.mjs"]);
  run("node", ["scripts/convertOpenSourceBatch01ToRuntime.mjs", "--batch", "all"]);

  const result = validateCatalog();
  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length) throw new Error(`Catalog validation failed with ${result.errors.length} error(s)`);
  fs.rmSync(catalogSnapshot, { recursive: true, force: true });
} catch (error) {
  restoreGeneratedCatalog(catalogSnapshot);
  fs.rmSync(catalogSnapshot, { recursive: true, force: true });
  throw error;
}
