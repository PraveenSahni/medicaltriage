import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-03");
const jsonDir = path.join(root, "json");
const pdfDir = path.join(root, "pdf");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifests", "batch-03-manifest.json"), "utf8"),
);
const register = JSON.parse(
  fs.readFileSync(
    path.join(root, "research-gaps", "batch-03-research-gap-register.json"),
    "utf8",
  ),
);
const files = fs.readdirSync(jsonDir).filter((name) => name.endsWith(".db.json")).sort();
const errors = [];
const ids = [];
const families = new Set();
let redirects = 0;
let painProtocols = 0;

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`);
  else families.add(meta.protocolFamily);
  ids.push(doc.algorithm.AlgorithmID);
  if (typeof doc._source !== "string") errors.push(`${file}: _source is not a string`);
  if (!doc.algorithm.Background.KeyPoints?.length) {
    errors.push(`${file}: background key points missing`);
  }
  if (!["Male", "Female"].includes(doc.algorithm.GenderAtBirth)) {
    errors.push(`${file}: invalid top-level gender`);
  }
  if (!/^(Adult|Child) \(/.test(doc.algorithm.Age)) {
    errors.push(`${file}: invalid top-level age`);
  }
  const scope = doc.questions.filter((q) => q.DispositionLevel === null);
  if (meta?.sourceProtocolId === "oscg-weakness-fatigue") {
    const targets = new Set(scope.map((question) => question.GotoGuideline));
    if (
      scope.length !== 2 ||
      !targets.has("Diabetes - Low Blood Sugar") ||
      !targets.has("Diabetes - High Blood Sugar")
    ) {
      errors.push(`${file}: weakness/fatigue must split low and high blood-glucose redirects`);
    }
  } else if (scope.length !== 1 || !scope[0].GotoGuideline) {
    errors.push(`${file}: expected one valid scope redirect`);
  }
  redirects += scope.length;
  if (new Set(doc.questions.map((q) => q.QuestionID)).size !== doc.questions.length) {
    errors.push(`${file}: duplicate question ID`);
  }
  const isCuts = meta?.sourceProtocolId === "oscg-cuts-lacerations";
  if (isCuts && doc.algorithm.PainSeverity.length === 0) {
    errors.push(`${file}: cuts pain scale missing`);
  }
  if (!isCuts && doc.algorithm.PainSeverity.length !== 0) {
    errors.push(`${file}: inappropriate pain scale present`);
  }
  if (doc.algorithm.PainSeverity.length) painProtocols++;
  if (
    doc.algorithm.Age.startsWith("Child") &&
    !doc.initialAssessmentQuestions.some((q) => q.Category === "CAREGIVER_OBSERVATION")
  ) {
    errors.push(`${file}: child caregiver assessment missing`);
  }
  if (
    meta?.sourceProtocolId === "oscg-suicide-concerns" &&
    /NHS 111|go to A&E|your organization's local emergency mental health crisis line/i.test(
      JSON.stringify(doc),
    )
  ) {
    errors.push(`${file}: unlocalized UK or placeholder crisis language remains`);
  }
  if (
    meta?.sourceProtocolId === "oscg-suicide-concerns" &&
    !/16000/.test(JSON.stringify(doc))
  ) {
    errors.push(`${file}: Qatar HMC mental-health pathway missing`);
  }
  const pdf = path.join(pdfDir, file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) {
    errors.push(`${file}: PDF missing or empty`);
  }
}

const expectedIds = Array.from({ length: 38 }, (_, index) => 1049 + index);
if ([...ids].sort((a, b) => a - b).join(",") !== expectedIds.join(",")) {
  errors.push("Algorithm IDs are not exactly 1049-1086");
}
if (new Set(ids).size !== 38) errors.push("Algorithm IDs are not unique");
if (manifest.protocolCount !== 38 || manifest.entries.length !== 38) {
  errors.push("Manifest does not contain 38 entries");
}
if (register.count !== 114 || register.gaps.length !== 114) {
  errors.push("Research-gap register does not contain 114 entries");
}
if (families.size !== 10) errors.push("Expected 10 condition families");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      conditionFamilies: families.size,
      protocols: files.length,
      algorithmIds: "1049-1086",
      sourceStrings: files.length,
      scopeRedirects: redirects,
      painProtocols,
      manifestEntries: manifest.entries.length,
      researchGaps: register.gaps.length,
      pdfs: fs.readdirSync(pdfDir).filter((name) => name.endsWith(".pdf")).length,
      status: "PASS",
    },
    null,
    2,
  ),
);
