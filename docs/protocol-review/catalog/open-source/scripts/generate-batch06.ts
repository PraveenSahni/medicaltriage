import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { batch06Protocols } from "../../../../../src/data/openSourceGuidelines/batch06.js";
import { normalizeEmergencyAdvice } from "./shared-demographic-generator.js";

const root = path.resolve("docs/protocol-review/catalog/open-source/batch-06");
for (const dir of ["json", "pdf", "evidence", "manifests", "research-gaps", "batches"]) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}
const selectedIds = new Set([
  "oscg-diarrhea",
  "oscg-diarrhea-on-antibiotics",
  "oscg-earache",
  "oscg-ear-foreign-body",
  "oscg-ear-swimmers",
]);
const selected = batch06Protocols.filter((protocol) => selectedIds.has(protocol.id));
if (selected.length !== 5) throw new Error(`Expected 5 Batch 6 families, found ${selected.length}.`);

const redirectMap: Record<string, { question: string; info: string; target: string }> = {
  "oscg-diarrhea": {
    question: "Did the diarrhea begin while taking, or shortly after taking, an antibiotic?",
    info: "Antibiotic-associated diarrhea requires its dedicated pathway because C. difficile infection may need prompt assessment.",
    target: "Diarrhea on Antibiotics",
  },
  "oscg-diarrhea-on-antibiotics": {
    question: "Is there no current or recent antibiotic exposure, with ordinary diarrhea now the main concern?",
    info: "Diarrhea without antibiotic exposure belongs in the general Diarrhea pathway.",
    target: "Diarrhea",
  },
  "oscg-earache": {
    question: "Is an object, food, insect, battery, or other foreign material known or suspected to be inside the ear?",
    info: "A suspected object in the ear requires the Ear - Foreign Body pathway rather than general earache assessment.",
    target: "Ear - Foreign Body",
  },
  "oscg-ear-foreign-body": {
    question: "Is there no object in the ear, with ear pain or pressure now the main concern?",
    info: "Ear pain without a foreign body belongs in the Earache pathway.",
    target: "Earache",
  },
  "oscg-ear-swimmers": {
    question: "Is there ear pain without recent swimming, water exposure, or outer-ear canal inflammation?",
    info: "Ear pain not associated with water exposure or an inflamed ear canal belongs in the general Earache pathway.",
    target: "Earache",
  },
};
const sourceText =
  "Shaped to mirror the licensed After-Hours Telehealth Triage Guidelines database structure. This is IST open-source guideline content derived from the cited public sources; it is not licensed STCC content. Question.DispositionLevel=null is the schema marker for a See More Appropriate Guideline redirect. Demographic variants contain only source-supported differences; identical thresholds are documented rather than fabricated. Local destinations and TelemedicineEligible values require IST clinical governance approval.";
const sha = (value: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const localizeOperationalText = (value: string) =>
  value
    .replace(/\bcall-999\/A&E\b/gi, "Qatar 999/emergency-department")
    .replace(/\bcall 999 or go to A&E\b/gi, "call Qatar 999 or go to an emergency department")
    .replace(/\bgo to A&E\b/gi, "go to an emergency department")
    .replace(/\bA&E\b/g, "emergency department")
    .replace(/\bNHS 111\b/gi, "the Qatar urgent clinical review pathway")
    .replace(/\bcalling 111\b/gi, "urgent clinical review")
    .replace(/\bcall 111\b/gi, "seek urgent clinical review")
    .replace(/\b111 online\b/gi, "the approved Qatar urgent-care channel");
const entries: any[] = [];
const gaps: any[] = [];
let nextId = 1145;

for (const protocol of selected) {
  for (const age of [
    { label: "Adult", min: 18, max: null },
    { label: "Child", min: protocol.ageMin, max: 17 },
  ]) {
    for (const gender of ["Male", "Female"] as const) {
      const algorithmId = nextId++;
      const slug = `${slugify(protocol.titleEn)}-${age.label.toLowerCase()}-${gender.toLowerCase()}`;
      const adviceIds = new Map(
        protocol.careAdvice.map((advice, index) => [advice.id, algorithmId * 100 + index + 1]),
      );
      const iaqs = protocol.initialAssessmentQuestions.map((question, index) => ({
        Order: index + 1,
        Category: question.responseType,
        Question: question.promptTextEn,
        Rationale: "Condition-relevant assessment retained from the cited Batch 6 source.",
        Source: protocol.titleEn,
      }));
      if (age.label === "Child") {
        iaqs.push({
          Order: iaqs.length + 1,
          Category: "CAREGIVER_OBSERVATION",
          Question:
            "What has a safe parent or caregiver observed about alertness, fluid intake, urine output, pain, fever, sleep, play, and normal activity?",
          Rationale:
            "Child assessment adds safe-caregiver observations without inventing a different clinical threshold.",
          Source: "IST pediatric telephone-assessment adaptation; governance review required",
        });
      }
      const redirect = redirectMap[protocol.id];
      const questions = [
        {
          QuestionID: algorithmId * 1000 + 1,
          AlgorithmID: algorithmId,
          DispositionLevel: null,
          QuestionOrder: 1,
          Question: redirect.question,
          Information: redirect.info,
          GotoGuideline: redirect.target,
          TelemedicineEligible: true,
          AdviceIDs: [],
        },
        ...protocol.questions.map((question, index) => ({
          QuestionID: algorithmId * 1000 + index + 2,
          AlgorithmID: algorithmId,
          DispositionLevel: question.dispositionLevel ?? 50,
          QuestionOrder: question.questionOrder ?? index + 1,
          Question: localizeOperationalText(question.questionTextEn),
          Information: localizeOperationalText(question.rationaleEn),
          GotoGuideline: null,
          TelemedicineEligible: question.telemedicineEligible,
          AdviceIDs: question.careAdviceIds.map((id) => adviceIds.get(id)),
        })),
      ];
      const dispositions = new Map<number, any>();
      for (const question of protocol.questions) {
        const level = question.dispositionLevel ?? 50;
        if (!dispositions.has(level)) {
          dispositions.set(level, {
            LevelID: level,
            DispositionHeading:
              level >= 100
                ? "Emergency Department Now"
                : level >= 70
                  ? "Urgent Clinical Review"
                  : level >= 40
                    ? "Clinical Review"
                    : "Self Care with Callback Precautions",
            DispositionHeading_Telemedicine:
              level >= 100
                ? "Emergency transport / in-person assessment now"
                : level >= 70
                  ? "Urgent clinical assessment"
                  : level >= 40
                    ? "Prompt telemedicine or in-person review"
                    : "Home care with safety-net advice",
            Video: level < 100,
            CssVar:
              level >= 100 ? "--ems" : level >= 70 ? "--urgent" : level >= 40 ? "--review" : "--self-care",
            DestinationCode: question.dispositionCode,
            Acuity: level >= 100 ? 5 : level >= 70 ? 4 : level >= 40 ? 3 : 2,
          });
        }
      }
      const ageText =
        age.max === null ? "Adult (18 years and older)" : `Child (${age.min}-${age.max} years)`;
      const doc = {
        _source: sourceText,
        algorithm: {
          AlgorithmID: algorithmId,
          Title: `${protocol.titleEn} - ${gender} (${age.label})`,
          ContentSet: `IST Open-Source Guideline Content | ${age.label} | ${gender}`,
          Age: ageText,
          GenderAtBirth: gender,
          Acuity: protocol.acuity,
          Definition: [protocol.clinicalDefinitionEn, `${age.label} patient.`, `${gender}.`],
          PainSeverity: [],
          Background: {
            KeyPoints: protocol.backgroundInfoEn ? [protocol.backgroundInfoEn] : [],
            CausesUnder50: [],
            CausesOver50: [],
            LocationTable: [],
            ExpertReviewer:
              protocol.authorship?.expertReviewerEn ??
              "Public-source clinical editorial review (source publisher)",
          },
          FirstAid: protocol.careAdvice
            .filter((advice) => advice.dispositionCode === "HMC_EMERGENCY_DEPARTMENT")
            .map((advice) => normalizeEmergencyAdvice(localizeOperationalText(advice.instructionTextEn))),
          Author: protocol.authorship?.authorEn ?? "IST Health Open-Source Guideline Content",
          LastRevised: "RESEARCH_REQUIRED - internal IST clinical adaptation date is not recorded",
          LastReviewed:
            protocol.authorship?.lastReviewedIso ??
            "RESEARCH_REQUIRED - verify source review date during governance",
          VersionYear: protocol.authorship?.versionYear ?? 2026,
          Company: "IST Health Open-Source Guideline Content",
          Copyright:
            "Public-source content reused under its stated licence. This is not licensed STCC content.",
        },
        dispositions: [...dispositions.values()].sort((a, b) => b.LevelID - a.LevelID),
        questions,
        advice: protocol.careAdvice.map((advice) => ({
          AdviceID: adviceIds.get(advice.id),
          AlgorithmOrder: advice.displayOrder,
          Title: advice.titleEn,
          PatientHealthInfo: advice.patientSendable ?? false,
          Internal: false,
          Content: [
            advice.dispositionCode === "HMC_EMERGENCY_DEPARTMENT"
              ? normalizeEmergencyAdvice(localizeOperationalText(advice.instructionTextEn))
              : localizeOperationalText(advice.instructionTextEn),
            `Call Back If: ${advice.warningSigns.join("; ")}.`,
          ],
        })),
        references: protocol.provenance.sourceDocuments,
        searchwords: protocol.keywords.map((keyword) => keyword.phrase),
        initialAssessmentQuestions: iaqs,
      };
      const canonicalContentHash = sha(doc);
      fs.writeFileSync(
        path.join(root, "json", `${slug}.db.json`),
        `${JSON.stringify(doc, null, 2)}\n`,
      );
      entries.push({
        file: `json/${slug}.db.json`,
        algorithmId,
        title: doc.algorithm.Title,
        protocolFamily: protocol.titleEn,
        sourceProtocolId: protocol.id,
        ageGroup: age.label,
        sourceMinimumAge: protocol.ageMin,
        genderAtBirth: gender,
        validationStatus: "BLOCKED_BY_RESEARCH_GAP",
        canonicalContentHash,
        redirectTarget: redirect.target,
        demographicDifferentiation: {
          ageSpecificChanges:
            age.label === "Child"
              ? [
                  `Child applicability begins at source minimum age ${protocol.ageMin}.`,
                  "Safe-caregiver observations are added without changing the source-derived thresholds.",
                ]
              : ["Adult pathway uses direct symptom, safety, and functional-impact assessment."],
          sexSpecificChanges: [
            "No sex-specific threshold is supported by the cited source; no difference was fabricated.",
          ],
        },
      });
      for (const [field, description] of [
        ["algorithm.LastRevised", "Internal IST clinical adaptation date is not recorded."],
        [
          "clinicalReview",
          "Named IST clinician approval is required for questions, dispositions, advice, redirects, and demographic applicability.",
        ],
        [
          "localization",
          "Qatar destination, medication, callback, emergency, and infection-control instructions require approval.",
        ],
      ]) {
        gaps.push({
          gapId: `B06-${algorithmId}-${field.replaceAll(".", "-")}`,
          algorithmId,
          protocol: doc.algorithm.Title,
          field,
          description,
          status: "OPEN",
        });
      }
    }
  }
}

const manifest = {
  manifestVersion: "1.0",
  importBatch: "open-source-batch-06",
  generatedDate: "2026-07-25",
  conditionFamilies: selected.length,
  protocolCount: entries.length,
  canonicalSourceFieldType: "string",
  algorithmIdRange: "1145-1164",
  applicabilityPolicy: {
    pregnancySpecificProtocols: "Female-only; never generate Male variants.",
    pediatricSpecificProtocols: "Child-only within source-supported ages; never generate Adult variants.",
    adultSpecificProtocols: "Adult-only; never generate Child variants.",
    mixedAgeProtocols: "Adult and Child variants only when the cited source supports both populations.",
    sexSpecificDifferences: "Only evidence-supported differences; never fabricate demographic content.",
  },
  entries,
};
fs.writeFileSync(
  path.join(root, "manifests", "batch-06-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "research-gaps", "batch-06-research-gap-register.json"),
  `${JSON.stringify({ batch: "06", count: gaps.length, gaps }, null, 2)}\n`,
);
for (const entry of entries) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
  fs.writeFileSync(
    path.join(root, "evidence", `${path.basename(entry.file, ".db.json")}-evidence-and-parity-report.md`),
    `# ${entry.title} - Evidence and Parity Report

## Status

- Algorithm ID: \`${entry.algorithmId}\`
- Protocol family: \`${entry.protocolFamily}\`
- Age group: **${entry.ageGroup}**
- Gender at birth: **${entry.genderAtBirth}**
- Completion status: **${entry.validationStatus}**
- Content hash: \`${entry.canonicalContentHash}\`

## Applicability

- ${entry.demographicDifferentiation.ageSpecificChanges.join("\n- ")}
- ${entry.demographicDifferentiation.sexSpecificChanges.join("\n- ")}

## Parity

- Disposition questions: ${doc.questions.filter((question: any) => question.DispositionLevel !== null).length}
- Redirect questions: ${doc.questions.filter((question: any) => question.DispositionLevel === null).length}
- Advice rows: ${doc.advice.length}
- Initial assessment questions: ${doc.initialAssessmentQuestions.length}
- References: ${doc.references.length}
`,
  );
}
const rows = entries
  .map((entry) => `| ${entry.algorithmId} | ${entry.title} | ${entry.redirectTarget} | ${entry.validationStatus} |`)
  .join("\n");
fs.writeFileSync(
  path.join(root, "batches", "batch-06-summary.md"),
  `# Batch 06 - Learned-Safeguard Expansion

Generated: 2026-07-25

- Five public-source families produced as exactly 20 demographic protocols.
- IDs continue sequentially: 1145-1164.
- Redirects point only to authored canonical protocols.
- Child observation is explicit; no sex-specific difference is fabricated.
- Every record remains BLOCKED_BY_RESEARCH_GAP pending clinical governance.

| ID | Protocol | Redirect | Status |
|---:|---|---|---|
${rows}
`,
);
console.log(`Generated ${entries.length} Batch 6 protocols and ${gaps.length} research gaps.`);
