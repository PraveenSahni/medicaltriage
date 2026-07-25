import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../batch-04");
const jsonDir = path.join(root, "json");
const pdfDir = path.join(root, "pdf");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifests", "batch-04-manifest.json"), "utf8"),
);
const register = JSON.parse(
  fs.readFileSync(
    path.join(root, "research-gaps", "batch-04-research-gap-register.json"),
    "utf8",
  ),
);
const files = fs.readdirSync(jsonDir).filter((name) => name.endsWith(".db.json")).sort();
const errors = [];
const ids = [];
const families = new Set();
let redirects = 0;
let childProtocols = 0;
const directDispositionFamilies = new Set([
  "Confusion - Delirium",
  "Sexual Assault or Rape",
  "Bluish Skin or Body Part (Cyanosis)",
  "Hair Loss",
  "Muscle Jerks - Tics - Shudders",
  "Pale Skin",
]);

for (const file of files) {
  const doc = JSON.parse(fs.readFileSync(path.join(jsonDir, file), "utf8"));
  const meta = manifest.entries.find((entry) => entry.file === `json/${file}`);
  if (!meta) errors.push(`${file}: missing manifest entry`);
  else families.add(meta.protocolFamily);
  ids.push(doc.algorithm.AlgorithmID);
  if (typeof doc._source !== "string") errors.push(`${file}: _source is not a string`);
  if (!["Male", "Female"].includes(doc.algorithm.GenderAtBirth)) {
    errors.push(`${file}: invalid gender`);
  }
  const scope = doc.questions.filter((q) => q.DispositionLevel === null);
  if (meta && directDispositionFamilies.has(meta.protocolFamily)) {
    const adviceIds = new Set(doc.advice.map((advice) => advice.AdviceID));
    const hasLinkedDirectDisposition = doc.questions.some(
      (question) =>
        question.DispositionLevel !== null &&
        question.GotoGuideline === null &&
        question.AdviceIDs.length > 0 &&
        question.AdviceIDs.every((id) => adviceIds.has(id)),
    );
    if (scope.length !== 0 || !hasLinkedDirectDisposition) {
      errors.push(`${file}: corrected direct-disposition family lacks linked advice`);
    }
  } else if (scope.length !== 1 || !scope[0].GotoGuideline) {
    errors.push(`${file}: expected one valid redirect`);
  }
  redirects += scope.length;
  if (!doc.references.length || !doc.initialAssessmentQuestions.length) {
    errors.push(`${file}: missing references or assessment questions`);
  }
  if (new Set(doc.questions.map((q) => q.QuestionID)).size !== doc.questions.length) {
    errors.push(`${file}: duplicate question ID`);
  }
  if (doc.algorithm.Age.startsWith("Child")) {
    childProtocols++;
    const category =
      meta?.sourceProtocolId === "oscg-sexual-assault-rape"
        ? "SAFEGUARDING"
        : "CAREGIVER_OBSERVATION";
    if (!doc.initialAssessmentQuestions.some((q) => q.Category === category)) {
      errors.push(`${file}: child ${category.toLowerCase()} question missing`);
    }
  }
  if (
    meta?.sourceProtocolId === "oscg-rash-widespread-drugs" &&
    !doc.algorithm.Age.startsWith("Child")
  ) {
    errors.push(`${file}: children-only rash source generated as Adult`);
  }
  if (
    meta?.sourceProtocolId === "oscg-sexual-assault-rape" &&
    doc.algorithm.Age.startsWith("Child")
  ) {
    const decisionTreeSafeguarding = doc.questions.filter(
      (q) =>
        q.DispositionLevel !== null &&
        /safe|safeguard|perpetrator|caregiver/i.test(
          `${q.Question ?? ""} ${q.Information ?? ""}`,
        ),
    );
    if (!decisionTreeSafeguarding.length) {
      errors.push(`${file}: child safeguarding exists only outside the decision tree`);
    }
    if (/reporting to police is the caller'?s choice/i.test(JSON.stringify(doc))) {
      errors.push(`${file}: child protocol says police reporting is solely caller choice`);
    }
    if (!/AMAN[\s\S]*919|919[\s\S]*AMAN/i.test(JSON.stringify(doc.advice))) {
      errors.push(`${file}: child protocol missing AMAN 919 safeguarding route`);
    }
    if (!/999/.test(JSON.stringify(doc.advice))) {
      errors.push(`${file}: child protocol missing immediate-danger 999 route`);
    }
  }
  const pdf = path.join(pdfDir, file.replace(".db.json", ".pdf"));
  if (!fs.existsSync(pdf) || fs.statSync(pdf).size < 1000) {
    errors.push(`${file}: PDF missing or empty`);
  }
}

const expectedIds = Array.from({ length: 38 }, (_, index) => 1087 + index);
if ([...ids].sort((a, b) => a - b).join(",") !== expectedIds.join(",")) {
  errors.push("Algorithm IDs are not exactly 1087-1124");
}
if (new Set(ids).size !== 38) errors.push("Algorithm IDs are not unique");
if (manifest.entries.length !== 38 || manifest.protocolCount !== 38) {
  errors.push("Manifest does not contain 38 entries");
}
if (register.gaps.length !== 114 || register.count !== 114) {
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
      algorithmIds: "1087-1124",
      sourceStrings: files.length,
      scopeRedirects: redirects,
      childProtocols,
      childOnlyRashAdultVariants: 0,
      manifestEntries: manifest.entries.length,
      researchGaps: register.gaps.length,
      pdfs: fs.readdirSync(pdfDir).filter((name) => name.endsWith(".pdf")).length,
      status: "PASS",
    },
    null,
    2,
  ),
);
