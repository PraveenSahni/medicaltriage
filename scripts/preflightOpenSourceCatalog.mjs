import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertIsolatedCwd,
  cleanupIsolatedTemp,
  createIsolatedTemp,
  fingerprintTree,
  verifiedOsTempRoot,
} from "./lib/isolatedTemp.mjs";
import { ADULT_ONLY_CATALOG_COUNT } from "./adultOnlyCatalogPolicy.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_ROOT = path.join(REPO_ROOT, "src", "data", "openSourceGuidelines");
const CATALOG_SOURCE = path.join(REPO_ROOT, "docs", "protocol-review", "catalog", "open-source");
const GENERATOR_ROOT = path.join(CATALOG_SOURCE, "scripts");
const TSX_CLI = path.join(REPO_ROOT, "node_modules", "tsx", "dist", "cli.mjs");
const BLOCKED_PREFIX = "blocked";

function demographicsCompatible(source, target) {
  return source.ageGroup === target.ageGroup && source.genderAtBirth === target.genderAtBirth;
}

function isCompoundResolution(resolution) {
  return resolution?.status === "blocked_compound_target";
}

function run(command, args, cwd) {
  assertIsolatedCwd(cwd, activeStagingRoot);
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    env: { ...process.env, NODE_ENV: "test", APP_ENVIRONMENT: "uat" },
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with ${result.status}\n${result.stdout ?? ""}${result.stderr ?? ""}`,
    );
  }
  return result.stdout.trim();
}

function runResult(command, args, cwd) {
  assertIsolatedCwd(cwd, activeStagingRoot);
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: false,
    env: { ...process.env, NODE_ENV: "test", APP_ENVIRONMENT: "uat" },
  });
}

let activeStagingRoot;

function canonicalSourceIds() {
  const ids = new Set();
  for (const name of fs.readdirSync(SOURCE_ROOT).filter((file) => /^batch\d+.*\.ts$/.test(file))) {
    const source = fs.readFileSync(path.join(SOURCE_ROOT, name), "utf8");
    for (const match of source.matchAll(/\bid:\s*["']([^"']+)["']/g)) {
      if (/^osc[gr]-/.test(match[1])) ids.add(match[1]);
    }
  }
  return ids;
}

function batchRoot(catalog, batch) {
  return batch === 1 ? catalog : path.join(catalog, `batch-${String(batch).padStart(2, "0")}`);
}

function manifestName(batch) {
  return `batch-${String(batch).padStart(2, "0")}-manifest.json`;
}

function applyExecutionGuards(catalog) {
  const notice = "UAT DATA ONLY - NOT FOR REAL-PATIENT CARE OR PRODUCTION USE.";
  for (let batch = 1; batch <= 23; batch += 1) {
    const root = batchRoot(catalog, batch);
    const manifestPath = path.join(root, "manifests", manifestName(batch));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    for (const entry of manifest.entries ?? []) {
      const jsonPath = path.join(root, entry.file);
      const document = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      for (const question of document.questions ?? []) question.TelemedicineEligible = false;
      if (!document._source.includes(notice)) document._source = `${document._source} ${notice}`;
      fs.writeFileSync(jsonPath, `${JSON.stringify(document, null, 2)}\n`);
      entry.canonicalSourceProtocolId ??= entry.sourceProtocolId;
      entry.validationStatus = "BLOCKED_BY_RESEARCH_GAP";
      entry.canonicalContentHash = crypto
        .createHash("sha256")
        .update(JSON.stringify(document))
        .digest("hex");
    }
    manifest.safetyBoundary = {
      usageStatus: "UAT_ONLY",
      productionEligible: false,
      requiresClinicalValidation: true,
      importOrDeploymentPerformed: false,
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

function auditGeneratedCatalog(catalog) {
  const registry = JSON.parse(fs.readFileSync(path.join(catalog, "redirect-alias-registry.json"), "utf8"));
  const aliases = new Map(registry.aliases.map((entry) => [entry.alias, entry]));
  const canonicalIds = canonicalSourceIds();
  const errors = [];
  const blockedUsages = [];
  const compoundUsages = [];
  const usedAliases = new Set();
  const algorithmIds = [];
  const generatedEntries = [];
  const pendingRedirects = [];
  let redirects = 0;

  for (let batch = 1; batch <= 23; batch += 1) {
    const root = batchRoot(catalog, batch);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, "manifests", manifestName(batch)), "utf8"),
    );
    for (const entry of manifest.entries ?? []) {
      generatedEntries.push({ ...entry, batch });
      algorithmIds.push(entry.algorithmId);
      const sourceId = entry.sourceProtocolId ?? entry.importSource?.match(/#([^|]+)/)?.[1];
      if (!sourceId || !canonicalIds.has(sourceId)) {
        errors.push(`Batch ${batch} ID ${entry.algorithmId}: non-canonical sourceProtocolId '${sourceId ?? "missing"}'`);
      }
      const document = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
      for (const question of (document.questions ?? []).filter((item) => item.DispositionLevel === null)) {
        redirects += 1;
        const alias = question.GotoGuideline;
        const resolution = aliases.get(alias);
        usedAliases.add(alias);
        pendingRedirects.push({ batch, entry, alias, resolution });
        if (!resolution) errors.push(`Batch ${batch} ID ${entry.algorithmId}: unregistered redirect '${alias}'`);
        else if (resolution.status.startsWith(BLOCKED_PREFIX)) {
          blockedUsages.push({ batch, algorithmId: entry.algorithmId, alias, status: resolution.status });
        }
        if (isCompoundResolution(resolution)) {
          compoundUsages.push({ batch, algorithmId: entry.algorithmId, alias });
        }
      }
    }
  }

  const variantsByFamily = new Map();
  for (const entry of generatedEntries) {
    const variants = variantsByFamily.get(entry.protocolFamily) ?? [];
    variants.push(entry);
    variantsByFamily.set(entry.protocolFamily, variants);
  }
  for (const { batch, entry, alias, resolution } of pendingRedirects) {
    if (!resolution?.canonicalTitle) continue;
    const targets = variantsByFamily.get(resolution.canonicalTitle) ?? [];
    if (!targets.length) {
      errors.push(
        `Batch ${batch} ID ${entry.algorithmId}: redirect '${alias}' target '${resolution.canonicalTitle}' is not generated`,
      );
      continue;
    }
    if (!targets.some((target) => demographicsCompatible(entry, target))) {
      errors.push(
        `Batch ${batch} ID ${entry.algorithmId}: redirect '${alias}' has no ${entry.ageGroup}/${entry.genderAtBirth} compatible target`,
      );
    }
  }

  const uniqueIds = new Set(algorithmIds);
  if (
    algorithmIds.length !== ADULT_ONLY_CATALOG_COUNT ||
    uniqueIds.size !== ADULT_ONLY_CATALOG_COUNT
  ) {
    errors.push(
      `Expected ${ADULT_ONLY_CATALOG_COUNT} unique adult-only AlgorithmIDs; ` +
      `received ${algorithmIds.length}/${uniqueIds.size}`,
    );
  }
  if (blockedUsages.length) {
    errors.push(`${blockedUsages.length} generated redirect usage(s) remain blocked`);
  }
  if (compoundUsages.length) {
    errors.push(`${compoundUsages.length} generated redirect usage(s) remain compound`);
  }
  if (errors.length) {
    const detail = blockedUsages.length || compoundUsages.length
      ? `\n${JSON.stringify({ blockedUsages, compoundUsages }, null, 2)}`
      : "";
    throw new Error(`${errors.join("\n")}${detail}`);
  }
  return {
    records: algorithmIds.length,
    redirects,
    aliasesUsed: usedAliases.size,
    unregisteredRedirectUsages: 0,
    blockedRedirectUsages: 0,
    compoundRedirectUsages: 0,
    missingGeneratedTargets: 0,
    demographicMismatches: 0,
  };
}

function main() {
  if (process.argv.includes("--self-test")) {
    assert.equal(
      demographicsCompatible(
        { ageGroup: "Child", genderAtBirth: "Female" },
        { ageGroup: "Child", genderAtBirth: "Female" },
      ),
      true,
    );
    assert.equal(
      demographicsCompatible(
        { ageGroup: "Child", genderAtBirth: "Female" },
        { ageGroup: "Adult", genderAtBirth: "Female" },
      ),
      false,
    );
    assert.equal(isCompoundResolution({ status: "blocked_compound_target" }), true);
    assert.equal(isCompoundResolution({ status: "resolved" }), false);
    const registry = JSON.parse(
      fs.readFileSync(path.join(CATALOG_SOURCE, "redirect-alias-registry.json"), "utf8"),
    );
    const aliases = new Map(registry.aliases.map((entry) => [entry.alias, entry]));
    assert.deepEqual(aliases.get("Nasal Allergies (Hay Fever)"), {
      alias: "Nasal Allergies (Hay Fever)",
      canonicalTitle: "Nasal Allergies (Hay Fever)",
      status: "resolved",
    });
    assert.deepEqual(aliases.get("COVID-19 - Diagnosed or Suspected"), {
      alias: "COVID-19 - Diagnosed or Suspected",
      canonicalTitle: "COVID-19 - Diagnosed or Suspected",
      status: "resolved",
    });
    const before = fingerprintTree(CATALOG_SOURCE);
    const blocker = path.join(
      verifiedOsTempRoot(),
      `.aimltriage-intentional-setup-failure-${process.pid}-${crypto.randomUUID()}`,
    );
    fs.writeFileSync(blocker, "not a directory", { flag: "wx" });
    try {
      assert.throws(() => createIsolatedTemp("must-fail-", { tempRoot: blocker }));
    } finally {
      fs.rmSync(blocker, { force: true });
    }
    assert.equal(fingerprintTree(CATALOG_SOURCE), before);
    console.log(JSON.stringify({ status: "PASS", assertions: 8 }));
    return;
  }
  if (!fs.existsSync(TSX_CLI)) throw new Error(`Project-local tsx CLI not found: ${TSX_CLI}`);
  const stagingRoot = createIsolatedTemp("aimltriage-catalog-preflight-");
  activeStagingRoot = stagingRoot;
  try {
    assertIsolatedCwd(stagingRoot, stagingRoot);
    const stagingCatalog = path.join(stagingRoot, "docs", "protocol-review", "catalog", "open-source");
    const stagingSource = path.join(stagingRoot, "src", "data", "openSourceGuidelines");
    fs.mkdirSync(stagingCatalog, { recursive: true });
    fs.mkdirSync(path.dirname(stagingSource), { recursive: true });
    fs.copyFileSync(
      path.join(CATALOG_SOURCE, "redirect-alias-registry.json"),
      path.join(stagingCatalog, "redirect-alias-registry.json"),
    );
    fs.cpSync(SOURCE_ROOT, stagingSource, { recursive: true });

    for (let batch = 1; batch <= 23; batch += 1) {
      run(process.execPath, [
        TSX_CLI,
        path.join(GENERATOR_ROOT, `generate-batch${String(batch).padStart(2, "0")}.ts`),
      ], stagingRoot);
    }

    applyExecutionGuards(stagingCatalog);
    const stagingCatalogScripts = path.join(stagingCatalog, "scripts");
    fs.mkdirSync(stagingCatalogScripts, { recursive: true });
    const batchValidatorSummaries = [];
    const batchValidatorFailures = [];
    for (let batch = 1; batch <= 23; batch += 1) {
      run(process.execPath, [
        path.join(REPO_ROOT, "scripts", "runPython.mjs"),
        path.join(GENERATOR_ROOT, "render-batch01-pdfs.py"),
        "--batch-root", batchRoot(stagingCatalog, batch),
        "--manifest", manifestName(batch),
      ], stagingRoot);
      const validatorName = "validate-adult-only-batch.mjs";
      const stagingBatchValidator = path.join(stagingCatalogScripts, validatorName);
      fs.copyFileSync(path.join(GENERATOR_ROOT, validatorName), stagingBatchValidator);
      const validatorResult = runResult(process.execPath, [stagingBatchValidator, String(batch)], stagingRoot);
      const validatorOutput = `${validatorResult.stdout ?? ""}${validatorResult.stderr ?? ""}`.trim();
      if (validatorResult.status !== 0) {
        batchValidatorFailures.push({ batch, output: validatorOutput });
      } else {
        batchValidatorSummaries.push(validatorOutput.split(/\r?\n/).filter(Boolean).slice(-1)[0] ?? "");
      }
    }
    if (batchValidatorFailures.length) {
      throw new Error(`Per-batch validator failures:\n${JSON.stringify(batchValidatorFailures, null, 2)}`);
    }
    const audit = auditGeneratedCatalog(stagingCatalog);
    const conversionOutput = run(
      process.execPath,
      [path.join(REPO_ROOT, "scripts", "convertOpenSourceBatch01ToRuntime.mjs"), "--batch", "all"],
      stagingRoot,
    );
    const stagingScripts = path.join(stagingRoot, "scripts");
    fs.mkdirSync(stagingScripts, { recursive: true });
    const stagingValidator = path.join(stagingScripts, "validateOpenSourceCatalog.mjs");
    fs.copyFileSync(path.join(REPO_ROOT, "scripts", "validateOpenSourceCatalog.mjs"), stagingValidator);
    fs.copyFileSync(
      path.join(REPO_ROOT, "scripts", "adultOnlyCatalogPolicy.mjs"),
      path.join(stagingScripts, "adultOnlyCatalogPolicy.mjs"),
    );
    const acceptanceResult = spawnSync(process.execPath, [stagingValidator, "--skip-pdfs"], {
      cwd: stagingRoot,
      encoding: "utf8",
      shell: false,
      env: { ...process.env, NODE_ENV: "test", APP_ENVIRONMENT: "uat" },
    });
    const acceptanceOutput = acceptanceResult.stdout.trim();
    const acceptance = JSON.parse(acceptanceOutput);
    if (acceptance.status !== "PASS" || acceptance.errors?.length) {
      const categories = {};
      for (const error of acceptance.errors ?? []) {
        const category =
          error.includes("missing canonicalSourceProtocolId") ? "missingCanonicalSourceProtocolId" :
          error.includes("UAT/non-production provenance") ? "missingUatProvenance" :
          error.includes("telemedicine eligible") || error.includes("telemedicine eligibility") ? "telemedicineEligible" :
          error.includes("lacks literal Qatar 999") ? "missingQatar999" :
          error.includes("transport/no-driving") ? "missingControlledTransport" :
          "other";
        categories[category] = (categories[category] ?? 0) + 1;
      }
      throw new Error(
        `Temporary global acceptance validation failed with ${acceptance.errors?.length ?? 0} errors: ` +
        `${JSON.stringify(categories)}; other=${JSON.stringify(
          (acceptance.errors ?? []).filter((error) =>
            !error.includes("missing canonicalSourceProtocolId") &&
            !error.includes("UAT/non-production provenance") &&
            !error.includes("telemedicine eligible") &&
            !error.includes("telemedicine eligibility") &&
            !error.includes("lacks literal Qatar 999") &&
            !error.includes("transport/no-driving")
          ),
        )}`,
      );
    }
    console.log(JSON.stringify({
      status: "PASS",
      mode: "isolated-temporary-generation",
      authoritativeCatalogModified: false,
      strictRuntimeConversion: "PASS",
      perBatchValidators: "PASS (23/23)",
      globalAcceptanceValidation: "PASS",
      ...audit,
      acceptance: {
        records: acceptance.records,
        uniqueIds: acceptance.uniqueIds,
        idRange: acceptance.idRange,
        sourceProtocolIds: acceptance.sourceProtocolIds,
        openResearchGaps: acceptance.openResearchGaps,
      },
      batchValidatorSummaries,
      converterSummary: conversionOutput.split(/\r?\n/).filter(Boolean).slice(-1)[0] ?? "",
    }, null, 2));
  } finally {
    cleanupIsolatedTemp(stagingRoot);
    activeStagingRoot = undefined;
  }
}

main();
