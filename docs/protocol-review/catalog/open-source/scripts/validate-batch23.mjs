import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-23");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", "batch-23-manifest.json"), "utf8"));
const register = JSON.parse(fs.readFileSync(path.join(root, "research-gaps", "batch-23-research-gap-register.json"), "utf8"));
const files = fs.readdirSync(path.join(root, "json")).filter((name) => name.endsWith(".db.json"));
const errors = [], ids = [], families = new Set();
const expectedFamilies = new Set([
  "Bedwetting (Nocturnal Enuresis)", "Crying - Before 3 Months Old",
  "Eating Disorders Symptoms and Questions", "ICD and Pacemaker Symptoms and Questions",
  "Elbow Pain", "Elbow Swelling", "Finger Pain", "Foot Pain", "Hand Swelling",
]);

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, "json", file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`); else families.add(meta.protocolFamily);
  ids.push(doc.algorithm.AlgorithmID);
  if (typeof doc._source !== "string") errors.push(`${file}: _source must be string`);
  if (/\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b/i.test(JSON.stringify(doc))) errors.push(`${file}: UK operational wording`);
  if (/Breath-Holding|3 Months and Older|Marijuana|Mushrooms|Substance Use|Fluid Intake/.test(doc.algorithm.Title)) errors.push(`${file}: excluded source family`);
  if (/Bedwetting|Crying - Before|Elbow|Finger|Foot Pain|Hand Swelling/.test(doc.algorithm.Title) && !doc.algorithm.Age.startsWith("Child") && !doc.algorithm.Age.startsWith("Infant")) errors.push(`${file}: pediatric family generated outside pediatric scope`);
  if (/ICD and Pacemaker/.test(doc.algorithm.Title) && !doc.algorithm.Age.startsWith("Adult")) errors.push(`${file}: implanted-device family generated outside adult scope`);
  if (/Elbow|Finger|Foot Pain|Hand Swelling/.test(doc.algorithm.Title) && doc.questions.some((question) => question.DispositionLevel === 15)) errors.push(`${file}: pediatric joint pathway retained adult self-care`);
  if (doc.algorithm.Age.startsWith("Child") || doc.algorithm.Age.startsWith("Infant")) {
    if (!doc.initialAssessmentQuestions.some((question) => question.Category === "CAREGIVER_OBSERVATION")) errors.push(`${file}: missing caregiver observation`);
  }
  const redirects = doc.questions.filter((question) => question.DispositionLevel === null);
  if (redirects.length !== 1 || !redirects[0].GotoGuideline) errors.push(`${file}: redirect invalid`);
  const pdf = path.join(root, "pdf", file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) errors.push(`${file}: PDF missing`);
}

const expected = Array.from({ length: 20 }, (_, index) => 1485 + index);
if ([...ids].sort((a,b)=>a-b).join(",") !== expected.join(",")) errors.push("IDs are not 1485-1504");
if (new Set(ids).size !== 20) errors.push("Duplicate IDs");
if (families.size !== 9 || [...families].some((family) => !expectedFamilies.has(family))) errors.push("Expected nine source-supported families");
if (manifest.protocolCount !== 20 || manifest.entries.length !== 20) errors.push("Expected 20 manifest entries");
if (register.count !== 60 || register.gaps.length !== 60) errors.push("Expected 60 gaps");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(JSON.stringify({ conditionFamilies: families.size, protocols: files.length, infantProtocols: manifest.entries.filter((entry) => entry.protocolFamily === "Crying - Before 3 Months Old").length, algorithmIds: "1485-1504", researchGaps: register.gaps.length, pdfs: files.length, status: "PASS" }, null, 2));
