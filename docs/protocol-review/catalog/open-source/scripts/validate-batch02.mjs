import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scripts = path.dirname(fileURLToPath(import.meta.url));
const root = process.env.BATCH02_OUTPUT_ROOT
  ? path.resolve(process.env.BATCH02_OUTPUT_ROOT)
  : path.resolve(scripts, "../batch-02");
const jsonDir = path.join(root, "json");
const pdfDir = path.join(root, "pdf");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifests", "batch-02-manifest.json"), "utf8"),
);
const register = JSON.parse(
  fs.readFileSync(
    path.join(root, "research-gaps", "batch-02-research-gap-register.json"),
    "utf8",
  ),
);
const files = fs.readdirSync(jsonDir).filter((name) => name.endsWith(".db.json")).sort();
const errors = [];
const ids = [];
const titles = [];
let scopeRedirects = 0;
let directScopeDispositions = 0;

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file), "utf8"));
  ids.push(doc.algorithm.AlgorithmID);
  titles.push(doc.algorithm.Title);
  if (typeof doc._source !== "string") errors.push(`${file}: _source is not a string`);
  if (doc.algorithm.Age !== "Adult (18 years and older)") {
    errors.push(`${file}: non-adult applicability detected`);
  }
  if (!["Male", "Female"].includes(doc.algorithm.GenderAtBirth)) {
    errors.push(`${file}: invalid top-level gender`);
  }
  if (!doc.algorithm.PainSeverity?.length) errors.push(`${file}: pain scale missing`);
  const redirects = doc.questions.filter((q) => q.DispositionLevel === null);
  const isDirectScopeFamily =
    doc.algorithm.Title.startsWith("Knee Injury (Ottawa Knee Rule)") ||
    doc.algorithm.Title.startsWith("Neck Injury (NEXUS Criteria)");
  if (isDirectScopeFamily) {
    const scopeRow = doc.questions[0];
    if (
      redirects.length !== 0 ||
      scopeRow.DispositionLevel !== 70 ||
      scopeRow.GotoGuideline !== null ||
      scopeRow.TelemedicineEligible !== false ||
      !scopeRow.AdviceIDs?.length
    ) {
      errors.push(`${file}: expected a linked, non-telemedicine DL70 direct scope disposition`);
    } else {
      directScopeDispositions += 1;
    }
  } else if (redirects.length !== 1 || !redirects[0].GotoGuideline) {
    errors.push(`${file}: expected exactly one valid scope redirect`);
  } else {
    scopeRedirects += 1;
  }
  if (new Set(doc.questions.map((q) => q.QuestionID)).size !== doc.questions.length) {
    errors.push(`${file}: duplicate question ID`);
  }
  if (!doc.initialAssessmentQuestions.some((q) => q.Category === "PAIN_SEVERITY")) {
    errors.push(`${file}: pain assessment question missing`);
  }
  if (
    doc.algorithm.GenderAtBirth === "Female" &&
    !doc.initialAssessmentQuestions.some((q) => q.Category === "PREGNANCY")
  ) {
    errors.push(`${file}: pregnancy care-coordination question missing`);
  }
  const pdf = path.join(pdfDir, file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) {
    errors.push(`${file}: PDF missing or empty`);
  }
}

const expectedIds = Array.from({ length: 8 }, (_, i) => 1041 + i);
if ([...ids].sort((a, b) => a - b).join(",") !== expectedIds.join(",")) {
  errors.push("Algorithm IDs are not exactly 1041-1048");
}
if (new Set(ids).size !== 8) errors.push("Algorithm IDs are not unique");
if (manifest.protocolCount !== 8 || manifest.entries.length !== 8) {
  errors.push("Manifest does not contain 8 entries");
}
if (manifest.pediatricVariantsGenerated !== 0) {
  errors.push("Manifest incorrectly claims pediatric variants");
}
if (register.count !== 24 || register.gaps.length !== 24) {
  errors.push("Research gap register does not contain 24 entries");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      conditionFamilies: new Set(titles.map((t) => t.replace(/ - (Male|Female) \(Adult\)$/, ""))).size,
      protocols: files.length,
      algorithmIds: "1041-1048",
      sourceStrings: files.length,
      scopeRedirects,
      directScopeDispositions,
      painAssessments: files.length,
      manifestEntries: manifest.entries.length,
      researchGaps: register.gaps.length,
      pdfs: fs.readdirSync(pdfDir).filter((name) => name.endsWith(".pdf")).length,
      pediatricVariantsGenerated: 0,
      status: "PASS",
    },
    null,
    2,
  ),
);
