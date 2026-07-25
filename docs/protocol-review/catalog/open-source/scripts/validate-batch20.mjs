import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-20");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifests", "batch-20-manifest.json"), "utf8"));
const register = JSON.parse(fs.readFileSync(path.join(root, "research-gaps", "batch-20-research-gap-register.json"), "utf8"));
const files = fs.readdirSync(path.join(root, "json")).filter((name) => name.endsWith(".db.json"));
const errors = [], ids = [], families = new Set();
let adultFemale = 0, childFemale = 0;
const allowedTargets = new Set(["Headache", "Vision Loss or Change", "Skin Injury", "Neurologic Deficit", "Flank Pain", "COVID-19 - Diagnosed or Suspected", "Boil (Skin Abscess)", "Fainting"]);
const directDispositionFamilies = new Set(["Postpartum - High Blood Pressure", "Postpartum - Leg Swelling and Edema"]);

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, "json", file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`); else families.add(meta.protocolFamily);
  ids.push(doc.algorithm.AlgorithmID);
  if (doc.algorithm.GenderAtBirth !== "Female") errors.push(`${file}: non-Female postpartum record`);
  if (doc.algorithm.Age.startsWith("Adult")) adultFemale++;
  else if (doc.algorithm.Age === "Child (12-17 years)") childFemale++;
  else errors.push(`${file}: unsupported postpartum age label ${doc.algorithm.Age}`);
  if (typeof doc._source !== "string") errors.push(`${file}: _source must be a string`);
  if (doc.references.some((reference) => typeof reference !== "string")) errors.push(`${file}: references must be strings`);
  const redirects = doc.questions.filter((question) => question.DispositionLevel === null);
  if (meta && directDispositionFamilies.has(meta.protocolFamily)) {
    if (redirects.length !== 0) errors.push(`${file}: corrected direct-disposition family must not redirect`);
    if (!doc.questions.some((question) => question.DispositionLevel !== null && question.AdviceIDs.length > 0)) {
      errors.push(`${file}: corrected direct-disposition family lacks linked advice`);
    }
  } else if (redirects.length !== 1 || !redirects[0].GotoGuideline) errors.push(`${file}: expected one redirect`);
  else if (!allowedTargets.has(redirects[0].GotoGuideline)) errors.push(`${file}: unexpected redirect target`);
  if (doc.algorithm.Age.startsWith("Child") && !doc.initialAssessmentQuestions.some((question) => question.Category === "CAREGIVER_OBSERVATION")) errors.push(`${file}: missing caregiver observation`);
  if (/\bGP\b|\b(?:NHS\s*)?111\b|\bA&E\b|\bcall-999\b/i.test(JSON.stringify(doc))) errors.push(`${file}: UK operational language remains`);
  if (new Set(doc.questions.map((question) => question.QuestionID)).size !== doc.questions.length) errors.push(`${file}: duplicate question IDs`);
  const pdf = path.join(root, "pdf", file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) errors.push(`${file}: PDF missing`);
}
const expected = Array.from({ length: 20 }, (_, index) => 1425 + index);
if ([...ids].sort((a, b) => a - b).join(",") !== expected.join(",")) errors.push("IDs are not 1425-1444");
if (new Set(ids).size !== 20) errors.push("Duplicate IDs");
if (families.size !== 10) errors.push("Expected all 10 postpartum families");
if (adultFemale !== 10 || childFemale !== 10) errors.push(`Expected 10 Adult Female and 10 Child Female; got ${adultFemale}/${childFemale}`);
if (manifest.protocolCount !== 20 || manifest.entries.length !== 20) errors.push("Expected 20 manifest entries");
if (register.count !== 60 || register.gaps.length !== 60) errors.push("Expected 60 research gaps");
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log(JSON.stringify({ conditionFamilies: families.size, protocols: files.length, adultFemale, childFemale, male: 0, algorithmIds: "1425-1444", researchGaps: register.gaps.length, pdfs: fs.readdirSync(path.join(root, "pdf")).filter((name) => name.endsWith(".pdf")).length, status: "PASS" }, null, 2));
