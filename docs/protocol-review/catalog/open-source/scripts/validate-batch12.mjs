import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-12");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", "batch-12-manifest.json"), "utf8"));
const register = JSON.parse(fs.readFileSync(path.join(root, "research-gaps", "batch-12-research-gap-register.json"), "utf8"));
const files = fs.readdirSync(path.join(root, "json")).filter((name) => name.endsWith(".db.json"));
const errors = [], ids = [], families = new Set();
const expectedFamilies = new Set(["Skin Foreign Body", "Stools - Unusual Color", "Swallowed Foreign Body", "Sores", "Skin Injury"]);
const allowedTargets = new Set(["Puncture Wound", "Diarrhea", "Poisoning", "Boil (Skin Abscess)", "Burns - Thermal"]);
const maleSpecificReproductiveAssertion = /(?:\bmale\b|\bboy\b|\bhe\b|\bhim\b|\bhis\b)[^.!?]{0,80}\b(?:is|may be|could be)\s+(?:pregnant|breastfeeding)|\b(?:pregnant|breastfeeding)\s+(?:male|boy)\b/i;

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, "json", file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`); else families.add(meta.protocolFamily);
  ids.push(doc.algorithm.AlgorithmID);
  if (typeof doc._source !== "string") errors.push(`${file}: _source must be a string`);
  if (doc.references.some((reference) => typeof reference !== "string")) errors.push(`${file}: references must be strings`);
  const redirects = doc.questions.filter((question) => question.DispositionLevel === null);
  if (redirects.length !== 1 || !redirects[0].GotoGuideline) errors.push(`${file}: expected one redirect`);
  else if (!allowedTargets.has(redirects[0].GotoGuideline)) errors.push(`${file}: unexpected redirect target`);
  if (doc.algorithm.Age.startsWith("Child") && !doc.initialAssessmentQuestions.some((question) => question.Category === "CAREGIVER_OBSERVATION")) errors.push(`${file}: missing caregiver observation`);
  if (doc.algorithm.GenderAtBirth === "Male" && maleSpecificReproductiveAssertion.test(JSON.stringify(doc))) errors.push(`${file}: unsafe male-specific reproductive assertion`);
  if (/\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b/i.test(JSON.stringify(doc))) errors.push(`${file}: UK operational language remains`);
  if (/Smoke and Fume|Snakebite|Spider Bite|Scorpion Sting|Stingray/.test(doc.algorithm.Title)) errors.push(`${file}: excluded family generated`);
  if (new Set(doc.questions.map((question) => question.QuestionID)).size !== doc.questions.length) errors.push(`${file}: duplicate question IDs`);
  const pdf = path.join(root, "pdf", file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) errors.push(`${file}: PDF missing`);
}
const expected = Array.from({ length: 20 }, (_, index) => 1265 + index);
if ([...ids].sort((a, b) => a - b).join(",") !== expected.join(",")) errors.push("IDs are not 1265-1284");
if (new Set(ids).size !== 20) errors.push("Duplicate IDs");
if (families.size !== 5 || [...families].some((family) => !expectedFamilies.has(family))) errors.push("Expected five selected families");
if (manifest.protocolCount !== 20 || manifest.entries.length !== 20) errors.push("Expected 20 manifest entries");
if (register.count !== 60 || register.gaps.length !== 60) errors.push("Expected 60 research gaps");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(JSON.stringify({ conditionFamilies: families.size, protocols: files.length, algorithmIds: "1265-1284", manifestEntries: manifest.entries.length, researchGaps: register.gaps.length, pdfs: fs.readdirSync(path.join(root, "pdf")).filter((name) => name.endsWith(".pdf")).length, status: "PASS" }, null, 2));
