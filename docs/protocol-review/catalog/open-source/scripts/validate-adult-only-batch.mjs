import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const catalogRoot = path.resolve(scriptDir, "..");
const batch = Number(process.argv[2]);

if (!Number.isInteger(batch) || batch < 1 || batch > 23) {
  throw new Error("Usage: node validate-adult-only-batch.mjs <batch 1-23>");
}

const pad = String(batch).padStart(2, "0");
const root = batch === 1 ? catalogRoot : path.join(catalogRoot, `batch-${pad}`);
const manifestPath = path.join(root, "manifests", `batch-${pad}-manifest.json`);
const gapPath = path.join(root, "research-gaps", `batch-${pad}-research-gap-register.json`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const register = JSON.parse(fs.readFileSync(gapPath, "utf8"));
const errors = [];
const ids = [];

if (manifest.protocolCount !== manifest.entries?.length) {
  errors.push("Manifest protocolCount does not match entries");
}
if (manifest.safetyBoundary?.productionEligible !== false) {
  errors.push("Manifest is not explicitly production-ineligible");
}

const manifestFiles = new Set((manifest.entries ?? []).map((entry) => path.basename(entry.file)));
const actualJson = fs.readdirSync(path.join(root, "json")).filter((name) => name.endsWith(".db.json"));
for (const file of actualJson) {
  if (!manifestFiles.has(file)) errors.push(`Stale JSON outside manifest: ${file}`);
}

for (const entry of manifest.entries ?? []) {
  ids.push(entry.algorithmId);
  if (entry.ageGroup !== "Adult") errors.push(`ID ${entry.algorithmId}: non-adult manifest entry`);
  if (/child/i.test(entry.file) || /\(Child\)/i.test(entry.title)) {
    errors.push(`ID ${entry.algorithmId}: child-labelled generated artifact`);
  }
  const jsonPath = path.join(root, entry.file);
  const evidencePath = path.join(
    root,
    "evidence",
    `${path.basename(entry.file, ".db.json")}-evidence-and-parity-report.md`,
  );
  const pdfPath = path.join(root, "pdf", path.basename(entry.file).replace(/\.db\.json$/, ".pdf"));
  if (!fs.existsSync(jsonPath)) {
    errors.push(`ID ${entry.algorithmId}: JSON missing`);
    continue;
  }
  if (!fs.existsSync(evidencePath)) errors.push(`ID ${entry.algorithmId}: evidence report missing`);
  if (!fs.existsSync(pdfPath) || fs.statSync(pdfPath).size < 1000) {
    errors.push(`ID ${entry.algorithmId}: PDF missing or empty`);
  }
  const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  if (doc.algorithm?.AlgorithmID !== entry.algorithmId) errors.push(`ID ${entry.algorithmId}: JSON ID mismatch`);
  if (!/^Adult \(18 years and older\)$/.test(doc.algorithm?.Age ?? "")) {
    errors.push(`ID ${entry.algorithmId}: JSON age is not Adult (18 years and older)`);
  }
  if (/\bChild\b/i.test(doc.algorithm?.Title ?? "")) errors.push(`ID ${entry.algorithmId}: child JSON title`);
}

if (new Set(ids).size !== ids.length) errors.push("Duplicate AlgorithmIDs");
if (register.count !== register.gaps?.length) errors.push("Research-gap register count mismatch");
if ((register.gaps?.length ?? 0) !== (manifest.entries?.length ?? 0) * 3) {
  errors.push("Expected three open research/governance gaps per adult protocol");
}
if ((register.gaps ?? []).some((gap) => gap.status !== "OPEN")) {
  errors.push("Research-gap register contains a non-open item");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    batch,
    protocols: manifest.entries.length,
    ageScope: "Adult 18+ only",
    uniqueAlgorithmIds: ids.length,
    researchGaps: register.gaps.length,
    status: "PASS",
  }));
}
