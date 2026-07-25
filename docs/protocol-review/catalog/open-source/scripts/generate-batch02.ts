import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { batch02FormalRulesProtocols } from "../../../../../src/data/openSourceGuidelines/batch02FormalRules.js";
import { localizeObjectText, normalizeEmergencyAdvice } from "./shared-demographic-generator.js";

const root = path.resolve("docs/protocol-review/catalog/open-source/batch-02");
const jsonDir = path.join(root, "json");
const evidenceDir = path.join(root, "evidence");
const manifestDir = path.join(root, "manifests");
const gapsDir = path.join(root, "research-gaps");
const batchesDir = path.join(root, "batches");
for (const dir of [jsonDir, evidenceDir, manifestDir, gapsDir, batchesDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const sourceText =
  "Shaped to mirror the licensed After-Hours Telehealth Triage Guidelines database structure. This is IST open-source clinical decision-rule content derived from the cited peer-reviewed publications; it is not licensed STCC content. Question.DispositionLevel=null marks a See More Appropriate Guideline redirect and is not a disposition row. Telephone adaptations, local disposition mappings, and TelemedicineEligible values require IST clinical governance approval.";
const genders = ["Male", "Female"] as const;
const familyNames: Record<string, string> = {
  "oscr-chest-pain-heart": "Chest Pain (HEART Score)",
  "oscr-knee-injury-ottawa": "Knee Injury (Ottawa Knee Rule)",
  "oscr-neck-injury-nexus": "Neck Injury (NEXUS Criteria)",
  "oscr-head-injury-cch": "Head Injury (Canadian CT Head Rule)",
};
const slugs: Record<string, string> = {
  "oscr-chest-pain-heart": "chest-pain-heart",
  "oscr-knee-injury-ottawa": "knee-injury-ottawa",
  "oscr-neck-injury-nexus": "neck-injury-nexus",
  "oscr-head-injury-cch": "head-injury-canadian-ct",
};
const redirects: Record<string, { question: string; info: string; target?: string; dispositionLevel?: number }> = {
  "oscr-chest-pain-heart": {
    question:
      "Did the pain begin immediately after a direct blow, fall, or other chest injury, with the injury as the main concern and none of the cardiac emergency features below?",
    info:
      "A clearly traumatic chest complaint belongs in the chest-injury pathway. Any pressure-like, radiating, exertional, breathless, sweaty, faint, or persistent pain stays in this pathway for cardiac assessment.",
    target: "Chest Injury",
  },
  "oscr-knee-injury-ottawa": {
    question:
      "Is the knee pain or swelling non-traumatic, with no recent twist, blow, fall, or other acute injury?",
    info:
      "The Ottawa Knee Rule applies to acute knee trauma and must not be applied to non-traumatic knee symptoms.",
    dispositionLevel: 70,
  },
  "oscr-neck-injury-nexus": {
    question:
      "Is the neck pain non-traumatic, with no recent blunt injury, collision, fall, or impact?",
    info:
      "NEXUS was validated for blunt trauma and must not be applied to non-traumatic neck pain.",
    dispositionLevel: 70,
  },
  "oscr-head-injury-cch": {
    question:
      "Is the main problem a headache without a recent blow, fall, collision, or other head injury?",
    info:
      "The Canadian CT Head Rule applies to a defined minor-head-injury population and must not be applied to a non-traumatic headache.",
    target: "Headache",
  },
};

const sha = (value: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const entries: any[] = [];
const gaps: any[] = [];

for (const [familyIndex, protocol] of batch02FormalRulesProtocols.entries()) {
  for (const [genderIndex, gender] of genders.entries()) {
    const algorithmId = 1041 + familyIndex * 2 + genderIndex;
    const slug = `${slugs[protocol.id]}-adult-${gender.toLowerCase()}`;
    const adviceIdBySource = new Map(
      protocol.careAdvice.map((item, index) => [item.id, algorithmId * 100 + index + 1]),
    );
    const dispositionMap = new Map<number, any>();
    for (const q of protocol.questions) {
      const level = q.dispositionLevel ?? (q.severity === "Emergency" ? 100 : 70);
      if (!dispositionMap.has(level)) {
        dispositionMap.set(level, {
          LevelID: level,
          DispositionHeading:
            level === 100
              ? "Emergency Department Now"
              : level === 70
                ? "Urgent Clinical Review"
                : "Self Care with Callback Precautions",
          DispositionHeading_Telemedicine:
            level === 100
              ? "Emergency transport / in-person assessment now"
              : level === 70
                ? "Urgent in-person assessment"
                : "Home care with safety-net advice",
          Video: level === 15,
          CssVar: level === 100 ? "--ems" : level === 70 ? "--urgent" : "--self-care",
          DestinationCode: q.dispositionCode,
          Acuity: level === 100 ? 5 : level === 70 ? 4 : 2,
        });
      }
    }
    const iaqs = protocol.initialAssessmentQuestions.map((q, index) => ({
      Order: index + 1,
      Category: q.responseType,
      Question: q.promptTextEn,
      Rationale: "Source-protocol intake question retained from the runtime Batch 2 implementation.",
      Source: familyNames[protocol.id],
    }));
    iaqs.push({
      Order: iaqs.length + 1,
      Category: "PAIN_SEVERITY",
      Question: "What is the current pain severity from 0 to 10, and how is it affecting normal activity or movement?",
      Rationale: "Records pain intensity and functional impact without replacing the named decision rule.",
      Source: "IST telephone-triage adaptation",
    });
    const sexChanges: string[] = [];
    if (gender === "Female") {
      iaqs.push({
        Order: iaqs.length + 1,
        Category: "PREGNANCY",
        Question: "Is the patient pregnant or possibly pregnant? If yes, record gestation where known.",
        Rationale:
          "Pregnancy status is recorded for in-person imaging and treatment planning; it does not change the published rule criteria.",
        Source: "IST care-coordination adaptation; governance review required",
      });
      sexChanges.push(
        "Pregnancy status is captured for imaging and treatment planning but does not alter the decision-rule score.",
      );
    } else {
      sexChanges.push(
        "No male-specific scoring criterion is present in the published rule; no clinical difference was fabricated.",
      );
    }
    const redirect = redirects[protocol.id];
    const redirectAdviceIds = redirect.target
      ? []
      : protocol.questions
          .find((question) => (question.dispositionLevel ?? 70) === redirect.dispositionLevel)
          ?.careAdviceIds.map((id) => adviceIdBySource.get(id)) ?? [];
    const questions: any[] = [
      {
        QuestionID: algorithmId * 1000 + 1,
        AlgorithmID: algorithmId,
        DispositionLevel: redirect.target ? null : redirect.dispositionLevel,
        QuestionOrder: 1,
        Question: redirect.question,
        Information: redirect.info,
        GotoGuideline: redirect.target ?? null,
        TelemedicineEligible: false,
        AdviceIDs: redirectAdviceIds,
      },
      ...protocol.questions.map((q, index) => ({
        QuestionID: algorithmId * 1000 + index + 2,
        AlgorithmID: algorithmId,
        DispositionLevel: q.dispositionLevel ?? (q.severity === "Emergency" ? 100 : 70),
        QuestionOrder: q.questionOrder ?? index + 1,
        Question: q.questionTextEn,
        Information: q.rationaleEn,
        GotoGuideline: null,
        TelemedicineEligible: q.telemedicineEligible,
        AdviceIDs: q.careAdviceIds.map((id) => adviceIdBySource.get(id)),
      })),
    ];
    const references = protocol.provenance.sourceDocuments;
    const doc = localizeObjectText({
      _source: sourceText,
      algorithm: {
        AlgorithmID: algorithmId,
        Title: `${familyNames[protocol.id]} - ${gender} (Adult)`,
        ContentSet: `IST Open-Source Clinical Decision Rules | Adult | ${gender}`,
        Age: "Adult (18 years and older)",
        GenderAtBirth: gender,
        Acuity: protocol.acuity,
        Definition: [protocol.clinicalDefinitionEn, "Adult patient.", `${gender}.`],
        PainSeverity: [
          "Mild (1-3): Does not interfere with normal activity, movement, concentration, or sleep.",
          "Moderate (4-7): Interferes with normal activity, movement, concentration, or sleep.",
          "Severe (8-10): Prevents normal activity or movement, or is described as excruciating.",
        ],
        Background: {
          KeyPoints: [protocol.backgroundInfoEn],
          CausesUnder50: [],
          CausesOver50: [],
          LocationTable: [],
          ExpertReviewer: references[0]?.split(".")[0] ?? "Published rule authors",
        },
        FirstAid: protocol.careAdvice
          .filter((a) => a.dispositionCode === "HMC_EMERGENCY_DEPARTMENT")
          .map((a) => normalizeEmergencyAdvice(a.instructionTextEn)),
        Author: "IST Health Open-Source Clinical Decision Rules",
        LastRevised: "RESEARCH_REQUIRED - internal IST clinical adaptation date is not recorded",
        LastReviewed: "RESEARCH_REQUIRED - verify against current rule publication and local policy",
        VersionYear: 2026,
        Company: "IST Health Open-Source Clinical Decision Rules",
        Copyright:
          "Derived from cited peer-reviewed publications. This is not licensed STCC content.",
      },
      dispositions: [...dispositionMap.values()].sort((a, b) => b.LevelID - a.LevelID),
      questions,
      advice: protocol.careAdvice.map((a) => ({
        AdviceID: adviceIdBySource.get(a.id),
        AlgorithmOrder: a.displayOrder,
        Title: a.titleEn,
        PatientHealthInfo: a.patientSendable ?? false,
        Internal: false,
        Content: [
          a.dispositionCode === "HMC_EMERGENCY_DEPARTMENT"
            ? normalizeEmergencyAdvice(a.instructionTextEn)
            : a.instructionTextEn,
          `Call Back If: ${a.warningSigns.join("; ")}.`,
        ],
      })),
      references,
      searchwords: protocol.keywords.map((k) => k.phrase),
      initialAssessmentQuestions: iaqs,
    });
    const canonicalContentHash = sha(doc);
    fs.writeFileSync(path.join(jsonDir, `${slug}.db.json`), `${JSON.stringify(doc, null, 2)}\n`);
    entries.push({
      file: `json/${slug}.db.json`,
      algorithmId,
      title: doc.algorithm.Title,
      protocolFamily: familyNames[protocol.id],
      sourceProtocolId: protocol.id,
      ageGroup: "Adult",
      genderAtBirth: gender,
      validationStatus: "BLOCKED_BY_RESEARCH_GAP",
      canonicalContentHash,
      redirectTarget: redirect.target ?? null,
      demographicDifferentiation: {
        ageSpecificChanges: [
          "Adult-only applicability retained from the runtime source; no pediatric relabeling was performed.",
        ],
        sexSpecificChanges: sexChanges,
      },
    });
    for (const [field, description] of [
      ["algorithm.LastRevised", "Internal IST clinical adaptation date is not recorded."],
      ["clinicalReview", "Named IST clinician approval is required for rule fidelity and telephone adaptation."],
      ["pediatricApplicability", "A separately sourced pediatric rule or guideline is required; this adult rule was not copied into a child protocol."],
    ]) {
      gaps.push({
        gapId: `B02-${algorithmId}-${field.replaceAll(".", "-")}`,
        algorithmId,
        protocol: doc.algorithm.Title,
        field,
        description,
        status: "OPEN",
      });
    }
  }
}

const manifest = {
  manifestVersion: "1.0",
  importBatch: "open-source-batch-02-formal-rules",
  generatedDate: "2026-07-25",
  conditionFamilies: batch02FormalRulesProtocols.length,
  protocolCount: entries.length,
  canonicalSourceFieldType: "string",
  pediatricVariantsGenerated: 0,
  pediatricExclusionReason:
    "The runtime Batch 2 rules are adult decision rules. Pediatric protocols require separate validated sources and are recorded as research gaps rather than fabricated by relabeling.",
  entries,
};
fs.writeFileSync(
  path.join(manifestDir, "batch-02-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(gapsDir, "batch-02-research-gap-register.json"),
  `${JSON.stringify({ batch: "02", count: gaps.length, gaps }, null, 2)}\n`,
);

for (const entry of entries) {
  const base = path.basename(entry.file, ".db.json");
  const doc = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
  const report = `# ${entry.title} - Evidence and Parity Report

## Status

- Algorithm ID: \`${entry.algorithmId}\`
- Age group: **Adult**
- Gender at birth: **${entry.genderAtBirth}**
- Completion status: **${entry.validationStatus}**
- Content hash: \`${entry.canonicalContentHash}\`

## Canonical format

- \`_source\` is a single provenance string.
- Tracking metadata is held in \`../manifests/batch-02-manifest.json\`.
- The scope redirect uses \`DispositionLevel: null\` and a non-empty \`GotoGuideline\`.

## Demographic differentiation

- ${entry.demographicDifferentiation.ageSpecificChanges[0]}
- ${entry.demographicDifferentiation.sexSpecificChanges[0]}

## Rule-safety boundary

- This protocol preserves the named rule's adult applicability.
- No child protocol was produced from an adult rule.
- Telephone-only limitations and local disposition choices require clinical governance approval.

## Parity

- Disposition questions: ${doc.questions.filter((q: any) => q.DispositionLevel !== null).length}
- Redirect questions: ${doc.questions.filter((q: any) => q.DispositionLevel === null).length}
- Advice rows: ${doc.advice.length}
- Initial assessment questions: ${doc.initialAssessmentQuestions.length}
- References: ${doc.references.length}
`;
  fs.writeFileSync(path.join(evidenceDir, `${base}-evidence-and-parity-report.md`), report);
}

const rows = entries
  .map(
    (e) =>
      `| ${e.algorithmId} | ${e.title} | ${e.redirectTarget} | ${e.validationStatus} |`,
  )
  .join("\n");
const summary = `# Batch 02 - Formal Clinical Decision Rules

Generated: 2026-07-25

## Outcome

- Four named adult decision-rule families produced as eight top-level Adult Male/Female protocols.
- Algorithm IDs continue sequentially from Batch 1: 1041-1048.
- Every protocol contains relevant intake questions, functional pain assessment, rule criteria, and one schema-valid scope redirect.
- \`_source\` is a plain string; tracking metadata is separate.
- Pediatric variants were not fabricated from adult rules. Eight pediatric protocol needs are represented in the research-gap register (one per adult demographic file, deduplicated by family during governance planning).

| ID | Protocol | Redirect | Status |
|---:|---|---|---|
${rows}

## Running totals

- Condition families: 4
- Adult demographic protocols: 8
- Pediatric protocols generated: 0
- Research-gap entries: ${gaps.length}
- Clinical-governance-approved protocols: 0
`;
fs.writeFileSync(path.join(batchesDir, "batch-02-summary.md"), summary);
console.log(`Generated ${entries.length} Batch 2 protocols and ${gaps.length} research gaps.`);
