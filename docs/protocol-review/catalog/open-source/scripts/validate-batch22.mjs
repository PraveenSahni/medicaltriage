import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-22");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", "batch-22-manifest.json"), "utf8"));
const register = JSON.parse(fs.readFileSync(path.join(root, "research-gaps", "batch-22-research-gap-register.json"), "utf8"));
const files = fs.readdirSync(path.join(root, "json")).filter((name) => name.endsWith(".db.json"));
const errors = [], ids = [], families = new Set();
const expectedFamilies = new Set(["Pelvic Pain - Female", "Abdominal Pain - Upper", "Contraception - IUD Symptoms and Questions", "Measles Exposure", "Urine - Blood In", "Urination Pain - Female", "Urination Pain - Male"]);
for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, "json", file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`); else families.add(meta.protocolFamily);
  ids.push(doc.algorithm.AlgorithmID);
  if (typeof doc._source !== "string") errors.push(`${file}: _source must be string`);
  if (/\bGP\b|\b111\b|\bA&E\b|\bcall-999\b/i.test(JSON.stringify(doc))) errors.push(`${file}: UK operational wording`);
  if (/Birth Control Pills|Face Pain|Mouth Pain|Muscle Aches|Bullying|Child Abuse|Child Neglect/.test(doc.algorithm.Title)) errors.push(`${file}: excluded family`);
  if (/Pelvic Pain|IUD/.test(doc.algorithm.Title) && doc.algorithm.GenderAtBirth !== "Female") errors.push(`${file}: reproductive pathway not Female`);
  if (/Urination Pain - Female/.test(doc.algorithm.Title) && doc.algorithm.GenderAtBirth !== "Female") errors.push(`${file}: female urination pathway not Female`);
  if (/Urination Pain - Male/.test(doc.algorithm.Title) && doc.algorithm.GenderAtBirth !== "Male") errors.push(`${file}: male urination pathway not Male`);
  if (
    /Urine - Blood In/.test(doc.algorithm.Title) &&
    doc.algorithm.Age.startsWith("Child") &&
    doc.questions.some((question) => /oncology|cancer/i.test(question.GotoGuideline ?? ""))
  ) errors.push(`${file}: child hematuria redirects to an adult oncology pathway`);
  if (doc.algorithm.Age.startsWith("Child") && !doc.initialAssessmentQuestions.some((q) => q.Category === "CAREGIVER_OBSERVATION")) errors.push(`${file}: missing caregiver observation`);
  const redirects = doc.questions.filter((q) => q.DispositionLevel === null);
  if (redirects.length !== 1 || !redirects[0].GotoGuideline) errors.push(`${file}: redirect invalid`);
  const pdf = path.join(root, "pdf", file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) errors.push(`${file}: PDF missing`);
}
const expected = Array.from({ length: 20 }, (_, index) => 1465 + index);
if ([...ids].sort((a,b)=>a-b).join(",") !== expected.join(",")) errors.push("IDs are not 1465-1484");
if (families.size !== 7 || [...families].some((family) => !expectedFamilies.has(family))) errors.push("Expected seven source-supported families");
if (manifest.protocolCount !== 20 || manifest.entries.length !== 20) errors.push("Expected 20 manifest entries");
if (register.count !== 60 || register.gaps.length !== 60) errors.push("Expected 60 gaps");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(JSON.stringify({ conditionFamilies: families.size, protocols: files.length, algorithmIds: "1465-1484", researchGaps: register.gaps.length, pdfs: files.length, status: "PASS" }, null, 2));
