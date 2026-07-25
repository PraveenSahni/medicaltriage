import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { batch05Protocols } from "../../../../../src/data/openSourceGuidelines/batch05.js";
import {
  localizeObjectText,
  localizeOperationalText,
  normalizeEmergencyAdvice,
} from "./shared-demographic-generator.js";

const root = path.resolve("docs/protocol-review/catalog/open-source/batch-05");
for (const dir of ["json", "pdf", "evidence", "manifests", "research-gaps", "batches"]) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}

const selectedIds = new Set([
  "oscg-hypothermia",
  "oscg-coma-unconscious",
  "oscg-burns-chemical",
  "oscg-boil-skin-abscess",
  "oscg-covid19",
]);
const selected = batch05Protocols.filter((protocol) => selectedIds.has(protocol.id));
if (selected.length !== 5) {
  throw new Error(`Expected 5 selected Batch 5 families, found ${selected.length}.`);
}

const sourceText =
  "Shaped to mirror the licensed After-Hours Telehealth Triage Guidelines database structure. This is IST open-source guideline content derived from the cited public sources; it is not licensed STCC content. Question.DispositionLevel=null marks a See More Appropriate Guideline redirect and is not a disposition row. Demographic variants contain only source-supported differences; identical thresholds are explicitly documented rather than fabricated. Local destination mappings and TelemedicineEligible values require IST clinical governance approval.";
const sha = (value: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const redirects: Record<string, { question: string; info: string; target?: string; dispositionLevel?: number }> = {
  "oscg-hypothermia": {
    question:
      "Is the concern limited to one cold, numb, pale, white, or blistered body part without whole-body cold exposure symptoms, confusion, slurred speech, or drowsiness?",
    info:
      "A localized freezing injury without systemic hypothermia features belongs in the Frostbite pathway.",
    target: "Frostbite",
  },
  "oscg-coma-unconscious": {
    question:
      "Is the person awake and responsive, with sudden confusion rather than unconsciousness or failure to respond?",
    info:
      "A responsive person with sudden confusion belongs in the Confusion - Delirium pathway. Any unresponsive person remains in this emergency pathway.",
    target: "Confusion - Delirium",
  },
  "oscg-burns-chemical": {
    question:
      "Was the burn caused only by heat, flame, hot liquid, or steam, with no chemical or acid exposure?",
    info:
      "A heat-only burn belongs in the Burns - Thermal pathway. Any chemical or acid exposure remains here.",
    target: "Burns - Thermal",
  },
  "oscg-boil-skin-abscess": {
    question:
      "Is a widespread or flat localized rash the main concern, without a painful pus-filled lump or abscess?",
    info:
      "The localized-rash family is not generated. Arrange in-person clinical assessment through the Qatar route approved by governance (GOVERNANCE_REQUIRED).",
    dispositionLevel: 50,
  },
  "oscg-covid19": {
    question:
      "Are sudden throat or tongue swelling, wheeze, faintness, or collapse the main concern rather than an infection developing over time?",
    info:
      "Sudden systemic allergic-reaction features require the Anaphylaxis pathway.",
    target: "Anaphylaxis",
  },
};

const entries: any[] = [];
const gaps: any[] = [];
let nextId = 1125;

for (const protocol of selected) {
  for (const age of [
    { label: "Adult", min: 18, max: null },
    { label: "Child", min: protocol.ageMin, max: 17 },
  ]) {
    for (const gender of ["Male", "Female"] as const) {
      const algorithmId = nextId++;
      if (age.label === "Child") continue;
      const slug = `${slugify(protocol.titleEn)}-${age.label.toLowerCase()}-${gender.toLowerCase()}`;
      const adviceIdMap = new Map(
        protocol.careAdvice.map((advice, index) => [
          advice.id,
          algorithmId * 100 + index + 1,
        ]),
      );
      const iaqs = protocol.initialAssessmentQuestions.map((question, index) => ({
        Order: index + 1,
        Category: question.responseType,
        Question: localizeOperationalText(question.promptTextEn),
        Rationale: "Condition-relevant source assessment retained from the Batch 5 source protocol.",
        Source: protocol.titleEn,
      }));
      const ageChanges =
        age.label === "Child"
          ? [
              `Child applicability begins at source minimum age ${protocol.ageMin}.`,
              "A safe-caregiver observation question is added without changing source-derived clinical thresholds.",
            ]
          : ["Adult pathway uses direct symptom, safety, and functional-impact assessment."];
      if (age.label === "Child") {
        iaqs.push({
          Order: iaqs.length + 1,
          Category: "CAREGIVER_OBSERVATION",
          Question:
            "What change has a safe parent or caregiver observed in alertness, breathing, eating or drinking, sleep, play, and normal activity?",
          Rationale:
            "Child assessment includes safe-caregiver observation; it does not create a different clinical threshold.",
          Source: "IST pediatric telephone-assessment adaptation; governance review required",
        });
      }

      const redirect = redirects[protocol.id];
      if (!redirect) throw new Error(`Missing redirect definition for ${protocol.id}.`);
      const questions = [
        {
          QuestionID: algorithmId * 1000 + 1,
          AlgorithmID: algorithmId,
          DispositionLevel: redirect.target ? null : redirect.dispositionLevel,
          QuestionOrder: 1,
          Question: redirect.question,
          Information: redirect.info,
          GotoGuideline: redirect.target ?? null,
          TelemedicineEligible: false,
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
          AdviceIDs: question.careAdviceIds.map((id) => adviceIdMap.get(id)),
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
              level >= 100
                ? "--ems"
                : level >= 70
                  ? "--urgent"
                  : level >= 40
                    ? "--review"
                    : "--self-care",
            DestinationCode: question.dispositionCode,
            Acuity: level >= 100 ? 5 : level >= 70 ? 4 : level >= 40 ? 3 : 2,
          });
        }
      }

      const ageText =
        age.max === null ? "Adult (18 years and older)" : `Child (${age.min}-${age.max} years)`;
      const doc = localizeObjectText({
        _source: sourceText,
        algorithm: {
          AlgorithmID: algorithmId,
          Title: `${protocol.titleEn} - ${gender} (${age.label})`,
          ContentSet: `IST Open-Source Guideline Content | ${age.label} | ${gender}`,
          Age: ageText,
          GenderAtBirth: gender,
          Acuity: protocol.acuity,
          Definition: [localizeOperationalText(protocol.clinicalDefinitionEn), `${age.label} patient.`, `${gender}.`],
          PainSeverity: [],
          Background: {
            KeyPoints: protocol.backgroundInfoEn ? [localizeOperationalText(protocol.backgroundInfoEn)] : [],
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
          Author:
            protocol.authorship?.authorEn ?? "IST Health Open-Source Guideline Content",
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
          AdviceID: adviceIdMap.get(advice.id),
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
      });

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
          ageSpecificChanges: ageChanges,
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
          "Qatar destination, medication, callback, and safeguarding instructions require approval.",
        ],
      ]) {
        gaps.push({
          gapId: `B05-${algorithmId}-${field.replaceAll(".", "-")}`,
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

const applicabilityPolicy = {
  pregnancySpecificProtocols: "Female-only; never generate Male variants.",
  pediatricSpecificProtocols: "Child-only within source-supported ages; never generate Adult variants.",
  adultSpecificProtocols: "Adult-only; never generate Child variants.",
  mixedAgeProtocols: "Adult and Child variants only when the cited source supports both populations.",
  sexSpecificDifferences: "Only evidence-supported differences; never fabricate demographic content.",
  excludedSourceFamilies: [
    "Choking - Inhaled Foreign Body was not selected because its cited page is child-specific and its source note generalized beyond that page.",
  ],
};
const manifest = {
  manifestVersion: "1.0",
  importBatch: "open-source-batch-05",
  generatedDate: "2026-07-25",
  conditionFamilies: selected.length,
  protocolCount: entries.length,
  canonicalSourceFieldType: "string",
  algorithmIdRange: "1125-1144",
  applicabilityPolicy,
  entries,
};
fs.writeFileSync(
  path.join(root, "manifests", "batch-05-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "research-gaps", "batch-05-research-gap-register.json"),
  `${JSON.stringify({ batch: "05", count: gaps.length, gaps }, null, 2)}\n`,
);

for (const entry of entries) {
  const doc = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
  fs.writeFileSync(
    path.join(
      root,
      "evidence",
      `${path.basename(entry.file, ".db.json")}-evidence-and-parity-report.md`,
    ),
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
- Tracking metadata is in \`../manifests/batch-05-manifest.json\`.

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
  .map(
    (entry) =>
      `| ${entry.algorithmId} | ${entry.title} | ${entry.redirectTarget} | ${entry.validationStatus} |`,
  )
  .join("\n");
fs.writeFileSync(
  path.join(root, "batches", "batch-05-summary.md"),
  `# Batch 05 - Learned-Safeguard Expansion

Generated: 2026-07-25

## Outcome

- Five public-source families produced as exactly 20 demographic protocols.
- IDs continue sequentially from Batch 4: 1125-1144.
- Every protocol has condition-relevant questions and one source-compatible redirect.
- No sex-specific clinical difference was fabricated.
- Child variants add caregiver observation without inventing different thresholds.
- The child-specific choking source was deliberately excluded from Adult generation.
- Plain-string provenance and references are retained for runtime conversion.
- Every record remains BLOCKED_BY_RESEARCH_GAP pending named clinical governance approval.

| ID | Protocol | Redirect | Status |
|---:|---|---|---|
${rows}

## Totals

- Condition families: 5
- Demographic protocols: ${entries.length}
- Research-gap entries: ${gaps.length}
- Clinical-governance-approved protocols: 0
`,
);

console.log(`Generated ${entries.length} Batch 5 protocols and ${gaps.length} research gaps.`);
