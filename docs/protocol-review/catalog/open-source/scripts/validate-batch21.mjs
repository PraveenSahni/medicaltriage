import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-21");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", "batch-21-manifest.json"), "utf8"));
const register = JSON.parse(fs.readFileSync(path.join(root, "research-gaps", "batch-21-research-gap-register.json"), "utf8"));
const files = fs.readdirSync(path.join(root, "json")).filter((name) => name.endsWith(".db.json"));
const errors = [], ids = [], titles = [], familyCounts = new Map();
const expectedCounts = new Map([
  ["Ankle Pain", 4],
  ["Ankle Swelling", 2],
  ["Elbow Pain", 2],
  ["Elbow Swelling", 2],
  ["Finger Pain", 2],
  ["Foot Pain", 2],
  ["Hand Swelling", 2],
  ["Hip Pain", 2],
  ["Knee Swelling", 2],
]);

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, "json", file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`);
  else familyCounts.set(meta.protocolFamily, (familyCounts.get(meta.protocolFamily) ?? 0) + 1);
  ids.push(doc.algorithm.AlgorithmID);
  titles.push(doc.algorithm.Title);
  if (typeof doc._source !== "string") errors.push(`${file}: _source must be a string`);
  const redirects = doc.questions.filter((question) => question.DispositionLevel === null);
  if (redirects.length !== 1 || redirects[0].GotoGuideline !== "Motor Vehicle Accident") errors.push(`${file}: expected resolved crash redirect`);
  if (doc.algorithm.Age.startsWith("Child")) {
    if (!doc.algorithm.Title.startsWith("Ankle Pain")) errors.push(`${file}: unsupported child family`);
    if (!doc.initialAssessmentQuestions.some((question) => question.Category === "CAREGIVER_OBSERVATION")) errors.push(`${file}: missing caregiver observation`);
    if (doc.questions.some((question) => question.DispositionLevel === 15)) errors.push(`${file}: adult self-care disposition copied into child pathway`);
    if (!doc.questions.some((question) => question.DispositionLevel === 40)) errors.push(`${file}: child clinical-review disposition missing`);
  }
  if (/\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b/i.test(JSON.stringify(doc))) errors.push(`${file}: UK operational language remains`);
  if (/Arm Swelling and Edema/.test(doc.algorithm.Title)) errors.push(`${file}: excluded synthesized family generated`);
  if (new Set(doc.questions.map((question) => question.QuestionID)).size !== doc.questions.length) errors.push(`${file}: duplicate question IDs`);
  const pdf = path.join(root, "pdf", file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) errors.push(`${file}: PDF missing`);
}
for (const [family, count] of expectedCounts) {
  if (familyCounts.get(family) !== count) errors.push(`${family}: expected ${count} variants, got ${familyCounts.get(family) ?? 0}`);
}
if ([...familyCounts].some(([family]) => !expectedCounts.has(family))) errors.push("Unexpected family generated");
const expected = Array.from({ length: 20 }, (_, index) => 1445 + index);
if ([...ids].sort((a, b) => a - b).join(",") !== expected.join(",")) errors.push("IDs are not 1445-1464");
if (new Set(ids).size !== 20) errors.push("Duplicate IDs");
if (new Set(titles).size !== 20) errors.push("Duplicate titles");
if (manifest.conditionFamilies !== 9 || manifest.protocolCount !== 20 || manifest.entries.length !== 20) errors.push("Manifest applicability counts are incorrect");
if (register.count !== 60 || register.gaps.length !== 60) errors.push("Expected 60 research gaps");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(JSON.stringify({ conditionFamilies: 9, applicability: Object.fromEntries(familyCounts), protocols: files.length, algorithmIds: "1445-1464", manifestEntries: manifest.entries.length, researchGaps: register.gaps.length, pdfs: fs.readdirSync(path.join(root, "pdf")).filter((name) => name.endsWith(".pdf")).length, status: "PASS" }, null, 2));
