import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonDir = path.join(root, "json");
const evidenceDir = path.join(root, "evidence");
const manifestDir = path.join(root, "manifests");
fs.mkdirSync(manifestDir, { recursive: true });

const sourceText =
  "Shaped to mirror the licensed After-Hours Telehealth Triage Guidelines database structure. This is IST open-source guideline content derived from NHS.UK under the Open Government Licence v3.0; it is not licensed STCC content. Question.DispositionLevel=null marks a See More Appropriate Guideline redirect and is not a disposition row. Local disposition mappings and TelemedicineEligible values require IST clinical governance approval.";

const sha = (value) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");

function renumberQuestions(doc) {
  doc.questions.forEach((question, index) => {
    question.QuestionID = doc.algorithm.AlgorithmID * 1000 + index + 1;
    question.AlgorithmID = doc.algorithm.AlgorithmID;
    question.QuestionOrder = index + 1;
  });
}

function addRedirects(doc, family) {
  const redirects = [];
  if (family === "Anaphylaxis") {
    redirects.push(
      {
        DispositionLevel: null,
        Question:
          "Did symptoms begin after an insect sting, with only pain, itching, or swelling at the sting site and none of the airway, breathing, faintness, confusion, or collapse features of anaphylaxis?",
        Information:
          "A localized sting reaction without anaphylaxis features belongs in the insect-sting guideline. Any airway, breathing, circulation, or consciousness feature stays in this emergency guideline.",
        GotoGuideline: "Bee or Yellow Jacket Sting",
        TelemedicineEligible: true,
        AdviceIDs: [],
      },
      {
        DispositionLevel: null,
        Question:
          "Is the reaction limited to hives, itching, or mild localized swelling without throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse?",
        Information:
          "A localized or skin-only allergic reaction without anaphylaxis features belongs in the allergic-reaction or hives guideline; progression requires immediate reassessment.",
        GotoGuideline: "Allergic Reaction or Hives",
        TelemedicineEligible: true,
        AdviceIDs: [],
      },
    );
  }
  if (family === "Carbon Monoxide Exposure") {
    redirects.push({
      DispositionLevel: null,
      Question:
        "Did the suspected exposure occur during a fire, with burns, facial injury, soot, hoarseness, coughing, or breathing difficulty now being the main concern?",
      Information:
        "Fires can produce carbon monoxide, but prominent burn or smoke-inhalation injury requires the dedicated fire-injury pathway. Suspected carbon monoxide exposure must still be communicated to emergency services.",
      GotoGuideline: "Smoke Inhalation or Burns",
      TelemedicineEligible: false,
      AdviceIDs: [],
    });
  }
  if (redirects.length) {
    doc.questions = [...redirects, ...doc.questions];
    renumberQuestions(doc);
  }
  return redirects.map((item) => item.GotoGuideline);
}

function tailorDemographics(doc, family, ageGroup, gender) {
  const ageChanges = [];
  const sexChanges = [];
  const child = ageGroup === "Child";
  const adultFemale = ageGroup === "Adult" && gender === "Female";

  if (doc.algorithm.PainSeverity?.length) {
    if (child) {
      doc.algorithm.PainSeverity = [
        "Mild (1-3): The child can continue usual play, school activities, movement, and sleep.",
        "Moderate (4-7): Pain interferes with play, movement, school activities, or sleep.",
        "Severe (8-10): The child cannot continue normal activity, is unable or unwilling to move normally, or cannot be consoled.",
      ];
      ageChanges.push("Child-specific functional pain descriptors replace adult activity wording.");
    } else {
      doc.algorithm.PainSeverity = [
        "Mild (1-3): Does not interfere with normal activity, movement, concentration, or sleep.",
        "Moderate (4-7): Interferes with normal activity, movement, concentration, or sleep.",
        "Severe (8-10): Prevents normal activity or movement, or is described as excruciating.",
      ];
      ageChanges.push("Adult functional pain descriptors use activity, movement, concentration, and sleep.");
    }
  }

  if (family === "Anaphylaxis") {
    const emergency = doc.questions.find((q) => q.DispositionLevel === 100);
    if (emergency && !child) {
      emergency.Question = emergency.Question.replace(
        ", or is a child unresponsive or unusually floppy",
        "",
      );
      ageChanges.push("Adult emergency wording removes the pediatric floppy-child sign.");
    } else if (emergency) {
      ageChanges.push("Child emergency wording retains the source-listed unresponsive or floppy-child sign.");
    }
    if (adultFemale) {
      if (!doc.initialAssessmentQuestions.some((q) => q.Category === "PREGNANCY")) {
        doc.initialAssessmentQuestions.push({
          Order: doc.initialAssessmentQuestions.length + 1,
          Category: "PREGNANCY",
          Question:
            "Is the patient pregnant or possibly pregnant? If yes, record gestation where known.",
          Rationale:
            "NHS.UK first-aid positioning specifically instructs a pregnant patient with anaphylaxis to lie on the left side.",
          Source: "NHS.UK Anaphylaxis",
        });
      }
      if (!doc.algorithm.FirstAid.includes("If pregnant, lie on the left side.")) {
        doc.algorithm.FirstAid.splice(3, 0, "If pregnant, lie on the left side.");
      }
      sexChanges.push("Pregnancy screening and left-side emergency positioning added from NHS.UK guidance.");
    }
  }

  const childRules = {
    "Burns - Thermal": {
      adultPattern: /, or is the patient a child under 5/g,
      adultReplacement: "",
      childNote: "Child pathway retains the under-5 urgent-assessment threshold.",
    },
    "Bee or Yellow Jacket Sting": {
      adultPattern: /, or is this a child under 1 year old/g,
      adultReplacement: "",
      childNote: "Child pathway retains the under-1 medical-review threshold.",
    },
    Nosebleed: {
      adultPattern: /Is the patient a child under 2, does the caller/g,
      adultReplacement: "Does the caller",
      childNote: "Child pathway retains the under-2 medical-review threshold.",
    },
    Headache: {
      adultPattern: /, is a child's headache getting worse or waking them at night/g,
      adultReplacement: "",
      childNote: "Child pathway retains worsening or night-waking pediatric headache criteria.",
    },
    Sunburn: {
      adultPattern: /, or is the patient a baby or young child/g,
      adultReplacement: "",
      childNote: "Child pathway retains the baby or young-child urgent-assessment threshold.",
    },
  };
  const rule = childRules[family];
  if (rule) {
    if (child) {
      ageChanges.push(rule.childNote);
    } else {
      for (const question of doc.questions) {
        question.Question = question.Question.replace(rule.adultPattern, rule.adultReplacement);
      }
      ageChanges.push("Adult pathway removes the pediatric age-threshold clause.");
    }
  }

  if (child && !ageChanges.length) {
    ageChanges.push(
      "Child pathway includes caregiver-observation assessment and child-specific age routing.",
    );
  }
  if (!child && !ageChanges.length) {
    ageChanges.push("Adult pathway uses adult age routing and direct patient-function assessment.");
  }
  if (!sexChanges.length) {
    sexChanges.push(
      "No additional sex-specific clinical difference was supported by the cited source; the separate top-level protocol is retained for explicit routing without fabrication.",
    );
  }
  doc.initialAssessmentQuestions.forEach((question, index) => {
    question.Order = index + 1;
  });
  return { ageSpecificChanges: ageChanges, sexSpecificChanges: sexChanges };
}

const files = fs.readdirSync(jsonDir).filter((name) => name.endsWith(".db.json")).sort();
const entries = [];

for (const file of files) {
  const filePath = path.join(jsonDir, file);
  const doc = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const oldSource = doc._source;
  const variant = oldSource.demographicVariant;
  const redirects = addRedirects(doc, variant.protocolFamily);
  const differentiation = tailorDemographics(
    doc,
    variant.protocolFamily,
    variant.ageGroup,
    variant.genderAtBirth,
  );
  doc._source = sourceText;
  const canonicalContentHash = sha(doc);
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
  entries.push({
    file: `json/${file}`,
    algorithmId: doc.algorithm.AlgorithmID,
    title: doc.algorithm.Title,
    protocolFamily: variant.protocolFamily,
    ageGroup: variant.ageGroup,
    genderAtBirth: variant.genderAtBirth,
    importSource: oldSource.importSource,
    sourceName: oldSource.sourceName,
    licenseType: oldSource.licenseType,
    protocolVersion: "batch01-demographic-revision-2-2026-07-25",
    validationStatus: oldSource.validationStatus,
    restrictions: oldSource.restrictions,
    canonicalContentHash,
    redirectTargetsAdded: redirects,
    demographicDifferentiation: differentiation,
  });
}

const manifest = {
  manifestVersion: "1.0",
  importBatch: "open-source-batch-01",
  generatedDate: "2026-07-25",
  protocolCount: entries.length,
  canonicalSourceFieldType: "string",
  note:
    "Tracking metadata is intentionally outside each canonical protocol JSON so _source remains transformer-compatible.",
  entries,
};
fs.writeFileSync(
  path.join(manifestDir, "batch-01-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

for (const entry of entries) {
  const base = path.basename(entry.file, ".db.json");
  const doc = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
  const redirectCount = doc.questions.filter((q) => q.DispositionLevel === null).length;
  const dispositionCount = doc.questions.length - redirectCount;
  const report = `# ${entry.title} - Evidence and Parity Report

## Status

- Algorithm ID: \`${entry.algorithmId}\`
- Protocol family: \`${entry.protocolFamily}\`
- Age group: **${entry.ageGroup}**
- Gender at birth: **${entry.genderAtBirth}**
- Completion status: **${entry.validationStatus}**
- Content hash: \`${entry.canonicalContentHash}\`
- Tracking manifest: \`../manifests/batch-01-manifest.json\`

## Canonical-format correction

- \`_source\` is a single provenance string, matching the licensed exemplar's field type.
- Import, validation, hash, and demographic tracking metadata are held in the separate batch manifest.
- Redirect rows use \`DispositionLevel: null\` and a non-empty \`GotoGuideline\`.

## Demographic differentiation

### Age-specific

${entry.demographicDifferentiation.ageSpecificChanges.map((v) => `- ${v}`).join("\n")}

### Sex-specific

${entry.demographicDifferentiation.sexSpecificChanges.map((v) => `- ${v}`).join("\n")}

## Research gaps

1. \`algorithm.LastRevised\`: internal IST clinical revision date is not recorded.
2. \`clinicalReview\`: a named IST clinician must approve this demographic variant, questions, dispositions, and redirects.
3. \`demographicParity\`: governance must confirm whether further pediatric or sex-specific thresholds are justified by authoritative evidence.

## Parity

- Disposition questions: ${dispositionCount}
- Redirect questions: ${redirectCount}
- Advice rows: ${doc.advice.length}
- Search words: ${doc.searchwords.length}
- Initial assessment questions: ${doc.initialAssessmentQuestions.length}
`;
  fs.writeFileSync(path.join(evidenceDir, `${base}-evidence-and-parity-report.md`), report);
}

console.log(`Repaired ${entries.length} protocols and wrote ${path.relative(process.cwd(), path.join(manifestDir, "batch-01-manifest.json"))}`);
