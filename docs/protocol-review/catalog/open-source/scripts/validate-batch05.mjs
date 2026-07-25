import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-05");
const jsonDir = path.join(root, "json");
const pdfDir = path.join(root, "pdf");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifests", "batch-05-manifest.json"), "utf8"),
);
const register = JSON.parse(
  fs.readFileSync(
    path.join(root, "research-gaps", "batch-05-research-gap-register.json"),
    "utf8",
  ),
);
const files = fs.readdirSync(jsonDir).filter((name) => name.endsWith(".db.json")).sort();
const errors = [];
const ids = [];
const families = new Set();
const titles = [];
let redirects = 0;
let childProtocols = 0;
const directDispositionFamilies = new Map([["Boil (Skin Abscess)", 50]]);

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`);
  else families.add(meta.protocolFamily);
  ids.push(doc.algorithm.AlgorithmID);
  titles.push(doc.algorithm.Title);
  if (typeof doc._source !== "string") errors.push(`${file}: _source is not a string`);
  if (!["Male", "Female"].includes(doc.algorithm.GenderAtBirth)) {
    errors.push(`${file}: invalid gender`);
  }
  const scope = doc.questions.filter((question) => question.DispositionLevel === null);
  const directLevel = meta ? directDispositionFamilies.get(meta.protocolFamily) : undefined;
  if (directLevel !== undefined) {
    const adviceIds = new Set(doc.advice.map((advice) => advice.AdviceID));
    const validDirect = doc.questions.some(
      (question) =>
        question.DispositionLevel === directLevel &&
        question.GotoGuideline === null &&
        question.AdviceIDs.length > 0 &&
        question.AdviceIDs.every((id) => adviceIds.has(id)),
    );
    if (scope.length !== 0 || !validDirect) {
      errors.push(`${file}: corrected boil branch must be a linked direct disposition`);
    }
  } else if (scope.length !== 1 || !scope[0].GotoGuideline) {
    errors.push(`${file}: expected one valid redirect`);
  }
  redirects += scope.length;
  if (!doc.references.length || !doc.initialAssessmentQuestions.length) {
    errors.push(`${file}: missing references or assessment questions`);
  }
  if (doc.references.some((reference) => typeof reference !== "string")) {
    errors.push(`${file}: references must remain plain strings`);
  }
  if (new Set(doc.questions.map((question) => question.QuestionID)).size !== doc.questions.length) {
    errors.push(`${file}: duplicate question ID`);
  }
  if (doc.algorithm.Age.startsWith("Child")) {
    childProtocols++;
    if (
      !doc.initialAssessmentQuestions.some(
        (question) => question.Category === "CAREGIVER_OBSERVATION",
      )
    ) {
      errors.push(`${file}: child caregiver-observation question missing`);
    }
  }
  if (/Choking - Inhaled Foreign Body/.test(doc.algorithm.Title)) {
    errors.push(`${file}: excluded child-specific choking source was generated`);
  }
  const pdf = path.join(pdfDir, file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) {
    errors.push(`${file}: PDF missing or empty`);
  }
}

const expectedIds = Array.from({ length: 20 }, (_, index) => 1125 + index);
if ([...ids].sort((a, b) => a - b).join(",") !== expectedIds.join(",")) {
  errors.push("Algorithm IDs are not exactly 1125-1144");
}
if (new Set(ids).size !== 20) errors.push("Algorithm IDs are not unique");
if (new Set(titles).size !== 20) errors.push("Protocol titles are not unique");
if (manifest.entries.length !== 20 || manifest.protocolCount !== 20) {
  errors.push("Manifest does not contain 20 entries");
}
if (register.gaps.length !== 60 || register.count !== 60) {
  errors.push("Research-gap register does not contain 60 entries");
}
if (families.size !== 5) errors.push("Expected 5 condition families");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      conditionFamilies: families.size,
      protocols: files.length,
      algorithmIds: "1125-1144",
      sourceStrings: files.length,
      scopeRedirects: redirects,
      childProtocols,
      manifestEntries: manifest.entries.length,
      researchGaps: register.gaps.length,
      pdfs: fs.readdirSync(pdfDir).filter((name) => name.endsWith(".pdf")).length,
      status: "PASS",
    },
    null,
    2,
  ),
);
