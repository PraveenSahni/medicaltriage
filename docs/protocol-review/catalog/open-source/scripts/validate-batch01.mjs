import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.env.BATCH01_ROOT
  ? path.resolve(process.env.BATCH01_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requirePdfs = process.env.BATCH01_REQUIRE_PDFS !== "false";
const jsonDir = path.join(root, "json");
const pdfDir = path.join(root, "pdf");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifests", "batch-01-manifest.json"), "utf8"),
);
const files = fs.readdirSync(jsonDir).filter((name) => name.endsWith(".db.json")).sort();
const errors = [];
const ids = [];
const redirects = new Map();

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file), "utf8"));
  ids.push(doc.algorithm.AlgorithmID);
  if (typeof doc._source !== "string") errors.push(`${file}: _source is not a string`);
  if (!doc.algorithm.GenderAtBirth || !doc.algorithm.Age) {
    errors.push(`${file}: missing top-level demographic routing`);
  }
  const questionIds = new Set();
  doc.questions.forEach((q) => {
    if (questionIds.has(q.QuestionID)) errors.push(`${file}: duplicate question ID`);
    questionIds.add(q.QuestionID);
    if (!Number.isInteger(q.QuestionOrder) || q.QuestionOrder < 1) {
      errors.push(`${file}: invalid question order`);
    }
    if (q.DispositionLevel === null && !q.GotoGuideline) {
      errors.push(`${file}: redirect has no GotoGuideline`);
    }
    if (q.TelemedicineEligible !== false) {
      errors.push(`${file}: TelemedicineEligible must be false for Qatar UAT`);
    }
  });
  const count = doc.questions.filter((q) => q.DispositionLevel === null).length;
  redirects.set(file, count);
  const pdf = path.join(pdfDir, file.replace(".db.json", ".pdf"));
  if (requirePdfs && (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000)) {
    errors.push(`${file}: PDF missing or empty`);
  }
}

const sortedIds = [...ids].sort((a, b) => a - b);
if (sortedIds.join(",") !== Array.from({ length: 40 }, (_, i) => 1001 + i).join(",")) {
  errors.push("Algorithm IDs are not exactly 1001-1040");
}
if (new Set(ids).size !== 40) errors.push("Algorithm IDs are not unique");
if (manifest.protocolCount !== 40 || manifest.entries.length !== 40) {
  errors.push("Manifest does not contain 40 entries");
}
if (
  manifest.safetyBoundary?.usageStatus !== "UAT_ONLY" ||
  manifest.safetyBoundary?.productionEligible !== false ||
  manifest.safetyBoundary?.requiresClinicalValidation !== true ||
  manifest.safetyBoundary?.importOrDeploymentPerformed !== false
) {
  errors.push("Manifest safetyBoundary is missing or not UAT-only");
}
for (const entry of manifest.entries) {
  const provenance = entry.sourceProvenance;
  if (
    provenance?.usageStatus !== "UAT_ONLY" ||
    provenance?.productionEligible !== false ||
    provenance?.requiresClinicalValidation !== true
  ) {
    errors.push(`${entry.file}: manifest source provenance is not UAT-only`);
  }
}
for (const [file, count] of redirects) {
  if (file.startsWith("anaphylaxis-") && count < 1) errors.push(`${file}: no redirect`);
  if (file.startsWith("carbon-monoxide-") && count !== 0) {
    errors.push(`${file}: carbon-monoxide exposure must use direct emergency/urgent dispositions, not redirects`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      protocols: files.length,
      algorithmIds: `${sortedIds[0]}-${sortedIds.at(-1)}`,
      sourceStrings: files.length,
      anaphylaxisRedirects: [...redirects].filter(([f]) => f.startsWith("anaphylaxis-")).map(([, n]) => n),
      carbonMonoxideRedirects: [...redirects].filter(([f]) => f.startsWith("carbon-monoxide-")).map(([, n]) => n),
      manifestEntries: manifest.entries.length,
      pdfs: fs.existsSync(pdfDir)
        ? fs.readdirSync(pdfDir).filter((name) => name.endsWith(".pdf")).length
        : 0,
      pdfValidationRequired: requirePdfs,
      status: "PASS",
    },
    null,
    2,
  ),
);
