import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const catalog = path.resolve("docs/protocol-review/catalog/open-source");
const batches = [
  {
    root: catalog,
    manifest: "manifests/batch-01-manifest.json",
    evidence: "evidence",
  },
  {
    root: path.join(catalog, "batch-02"),
    manifest: "manifests/batch-02-manifest.json",
    evidence: "evidence",
  },
  {
    root: path.join(catalog, "batch-03"),
    manifest: "manifests/batch-03-manifest.json",
    evidence: "evidence",
  },
];
const sha = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const errors = [];
let adultPediatricClausesRemoved = 0;

for (const batch of batches) {
  const manifestPath = path.join(batch.root, batch.manifest);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  manifest.applicabilityPolicy = {
    pregnancySpecificProtocols:
      "Female-only. Never generate Male variants for a pregnancy-specific protocol.",
    pediatricSpecificProtocols:
      "Child-only within the source-supported age range. Never generate Adult variants.",
    adultSpecificProtocols:
      "Adult-only. Never generate Child variants.",
    mixedAgeProtocols:
      "Generate Adult and Child variants only when the cited source supports both populations.",
    sexSpecificDifferences:
      "Create or alter sex-specific clinical content only when supported by cited evidence; otherwise retain explicit routing without fabricated differences.",
  };
  for (const entry of manifest.entries) {
    const filePath = path.join(batch.root, entry.file);
    const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (doc.algorithm.GenderAtBirth === "Male") {
      const pregnancyQuestions = doc.initialAssessmentQuestions.filter(
        (q) => q.Category === "PREGNANCY" || /pregnan/i.test(q.Question),
      );
      if (pregnancyQuestions.length) {
        errors.push(`${entry.file}: Male protocol contains pregnancy assessment`);
      }
    }
    if (doc.algorithm.Age.startsWith("Adult")) {
      for (const question of doc.questions) {
        const before = question.Question;
        question.Question = question.Question
          .replace(
            ", is a child's headache getting worse or waking them at night",
            "",
          )
          .replace(", or is this a child under 1 year old", "")
          .replace(
            "Is the patient a child under 2, does the caller",
            "Does the caller",
          );
        if (question.Question !== before) adultPediatricClausesRemoved++;
      }
    }
    const newHash = sha(doc);
    entry.canonicalContentHash = newHash;
    fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
    const evidencePath = path.join(
      batch.root,
      batch.evidence,
      `${path.basename(entry.file, ".db.json")}-evidence-and-parity-report.md`,
    );
    if (fs.existsSync(evidencePath)) {
      const report = fs
        .readFileSync(evidencePath, "utf8")
        .replace(
          /- Content hash: `[a-f0-9]{64}`/,
          `- Content hash: \`${newHash}\``,
        );
      fs.writeFileSync(evidencePath, report);
    }
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  `Applicability policy applied; removed ${adultPediatricClausesRemoved} pediatric-only clauses from adult protocols; no Male pregnancy assessments found.`,
);
