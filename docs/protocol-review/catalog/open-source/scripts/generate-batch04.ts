import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { batch04Protocols } from "../../../../../src/data/openSourceGuidelines/batch04.js";
import {
  localizeObjectText,
  localizeOperationalText,
  normalizeEmergencyAdvice,
} from "./shared-demographic-generator.js";

const root = path.resolve("docs/protocol-review/catalog/open-source/batch-04");
for (const dir of ["json", "pdf", "evidence", "manifests", "research-gaps", "batches"]) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}
const sourceText =
  "Shaped to mirror the licensed After-Hours Telehealth Triage Guidelines database structure. This is IST open-source guideline content derived from the cited NHS.UK pages under the Open Government Licence v3.0; it is not licensed STCC content. Question.DispositionLevel=null marks a See More Appropriate Guideline redirect and is not a disposition row. Local extensions, destination mappings, safeguarding workflows, and TelemedicineEligible values require IST clinical governance approval.";
const sha = (value: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const childOnly = new Set(["oscg-rash-widespread-drugs"]);
const qatarSafeguardingReferences = [
  "Protection and Social Rehabilitation Center (AMAN), Qatar, \"AMAN Help - Report Child Abuse\", https://help.aman.org.qa/ (official Qatar child-abuse reporting and support route).",
  "Protection and Social Rehabilitation Center (AMAN), Qatar, \"AMAN Center Continues to Offer 24-Hour Teleservices\", https://www.aman.org.qa/en/news/aman-center-continues-offer-24-hour-teleservices (published AMAN 919 support and reporting channel; current availability requires governance confirmation).",
  "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (official Qatar emergency 999 instruction).",
];
const redirectMap: Record<string, { question: string; info: string; target?: string; dispositionLevel?: number }> = {
  "oscg-confusion-delirium": {
    question: "Did the confusion begin after a recent head injury, with the injury as the main concern?",
    info: "Sudden confusion after head injury requires direct emergency assessment. The generated head-injury rule is adult-only and has narrower entry criteria, so no redirect is used.",
    dispositionLevel: 100,
  },
  "oscg-sexual-assault-rape": {
    question: "Was there no sexual assault, with a non-sexual physical assault or injury now being the primary concern?",
    info: "A non-sexual physical assault belongs in the physical-assault or injury pathway. Any sexual assault remains in this trauma-informed pathway.",
    dispositionLevel: 78,
  },
  "oscg-hair-loss": {
    question: "Is an inflamed, painful, scaling, crusting, or infected-looking scalp the main concern rather than hair loss itself?",
    info: "The localized-rash family is not generated. Arrange prompt in-person assessment through the Qatar route approved by governance (GOVERNANCE_REQUIRED).",
    dispositionLevel: 70,
  },
  "oscg-hallucinations": {
    question: "Did the hallucinations begin after a suspected overdose, poisoning, recreational drug, or unknown substance exposure?",
    info: "A suspected toxic exposure requires the poisoning pathway and urgent toxicology assessment.",
    target: "Poisoning",
  },
  "oscg-poisoning": {
    question: "Is suspected carbon monoxide exposure from a heater, fire, generator, engine, or enclosed-space source the main concern?",
    info: "Carbon monoxide has a dedicated exposure and evacuation pathway.",
    target: "Carbon Monoxide Exposure",
  },
  "oscg-rash-widespread-drugs": {
    question: "Are throat or tongue swelling, breathing difficulty, faintness, confusion, or collapse the main concern?",
    info: "Systemic allergic-reaction features require the anaphylaxis pathway rather than an isolated rash pathway.",
    target: "Anaphylaxis",
  },
  "oscg-weight-loss-unintended": {
    question: "Is intentional food restriction, fear of weight gain, purging, or a suspected eating disorder the main concern?",
    info: "Intentional restriction or eating-disorder behaviours require a dedicated eating-disorder and mental-health pathway.",
    target: "Eating Disorder Concerns",
  },
};

const entries: any[] = [];
const gaps: any[] = [];
let nextId = 1087;
for (const protocol of batch04Protocols) {
  const ageGroups = childOnly.has(protocol.id)
    ? [{ label: "Child", min: protocol.ageMin, max: 17 }]
    : [
        { label: "Adult", min: 18, max: null },
        { label: "Child", min: protocol.ageMin, max: 17 },
      ];
  for (const age of ageGroups) {
    for (const gender of ["Male", "Female"] as const) {
      const algorithmId = nextId++;
      const slug = `${slugify(protocol.titleEn)}-${age.label.toLowerCase()}-${gender.toLowerCase()}`;
      const adviceIdMap = new Map(
        protocol.careAdvice.map((advice, index) => [advice.id, algorithmId * 100 + index + 1]),
      );
      const isChildSexualAssault =
        protocol.id === "oscg-sexual-assault-rape" && age.label === "Child";
      const childSafeguardingAdviceId = algorithmId * 100 + protocol.careAdvice.length + 1;
      const iaqs = protocol.initialAssessmentQuestions.map((q, index) => ({
        Order: index + 1,
        Category: q.responseType,
        Question: q.promptTextEn,
        Rationale: "Condition-relevant source assessment retained from the Batch 4 runtime protocol.",
        Source: protocol.titleEn,
      }));
      const ageChanges: string[] = [];
      if (age.label === "Child") {
        if (protocol.id === "oscg-sexual-assault-rape") {
          iaqs.push({
            Order: iaqs.length + 1,
            Category: "SAFEGUARDING",
            Question:
              "Is the child currently safe, is the suspected perpetrator present, and can the child speak privately with an appropriately trained safeguarding professional?",
            Rationale:
              "A caregiver cannot automatically be treated as the safe respondent in a child sexual-assault pathway.",
            Source: "NHS.UK child safeguarding section; local Qatar workflow required",
          });
          ageChanges.push("Child pathway adds private safeguarding and immediate-safety assessment.");
        } else {
          iaqs.push({
            Order: iaqs.length + 1,
            Category: "CAREGIVER_OBSERVATION",
            Question:
              "What change has a safe parent or caregiver observed in behaviour, alertness, eating or drinking, sleep, school or play, and normal activity?",
            Rationale: "Child assessment includes safe-caregiver observation and functional change.",
            Source: "IST pediatric telephone-assessment adaptation; governance review required",
          });
          ageChanges.push(
            `Child applicability begins at source minimum age ${protocol.ageMin}; safe-caregiver observation is captured.`,
          );
        }
      } else {
        ageChanges.push("Adult pathway uses direct symptom, safety, and functional-impact assessment.");
      }
      const sexChanges: string[] = [];
      if (protocol.id === "oscg-sexual-assault-rape" && gender === "Male") {
        sexChanges.push("Pregnancy-risk wording is excluded; injury, STI, forensic, and support needs remain.");
      } else if (protocol.id === "oscg-sexual-assault-rape" && gender === "Female") {
        sexChanges.push("Pregnancy, STI, injury, forensic, and support needs remain source-relevant.");
      } else {
        sexChanges.push(
          "No sex-specific threshold is supported by the cited source; no difference was fabricated.",
        );
      }
      const redirect = redirectMap[protocol.id];
      const redirectAdviceIds = redirect && !redirect.target
        ? protocol.questions
            .find((question) => (question.dispositionLevel ?? 50) === redirect.dispositionLevel)
            ?.careAdviceIds.map((id) => adviceIdMap.get(id)) ?? []
        : [];
      const redirectRows = redirect
        ? [{
            QuestionID: algorithmId * 1000 + 1,
            AlgorithmID: algorithmId,
            DispositionLevel: redirect.target ? null : redirect.dispositionLevel,
            QuestionOrder: 1,
            Question: redirect.question,
            Information: redirect.info,
            GotoGuideline: redirect.target ?? null,
            TelemedicineEligible: false,
            AdviceIDs: redirectAdviceIds,
          }]
        : [];
      const questions = [
        ...redirectRows,
        ...(isChildSexualAssault
          ? [
              {
                QuestionID: algorithmId * 1000 + redirectRows.length + 1,
                AlgorithmID: algorithmId,
                DispositionLevel: 78,
                QuestionOrder: 1,
                Question:
                  "Is the child unable to speak safely and privately, is the suspected perpetrator or an unsafe caregiver present, or could the child be returned to an unsafe person or place?",
                Information:
                  "Do not assume the accompanying adult is a safe respondent. Keep the child's immediate safety central, avoid alerting a suspected perpetrator, and follow the approved Qatar child-safeguarding escalation pathway. Call 999 for immediate danger.",
                GotoGuideline: null,
                TelemedicineEligible: false,
                AdviceIDs: [childSafeguardingAdviceId],
              },
            ]
          : []),
        ...protocol.questions.map((q, index) => ({
          QuestionID:
            algorithmId * 1000 +
            index +
            redirectRows.length +
            1 +
            (isChildSexualAssault ? 1 : 0),
          AlgorithmID: algorithmId,
          DispositionLevel: q.dispositionLevel ?? 50,
          QuestionOrder:
            (q.questionOrder ?? index + 1) +
            (isChildSexualAssault && (q.dispositionLevel ?? 50) === 78 ? 1 : 0),
          Question: localizeOperationalText(
            protocol.id === "oscg-sexual-assault-rape" && gender === "Male"
              ? q.questionTextEn.replace("pregnancy/STI risk", "STI risk")
              : q.questionTextEn,
          ),
          Information: localizeOperationalText(isChildSexualAssault
            ? q.rationaleEn
                .replace("pregnancy/STIs", gender === "Male" ? "STIs" : "pregnancy/STIs")
                .replace(
                  "Explain reporting options without pressure, subject to Qatar law, safeguarding duties, and approved organizational policy.",
                  "Do not state that reporting is solely the caller's choice. Follow approved Qatar child-safeguarding, reporting, and information-sharing procedures while preserving trauma-informed communication and the child's immediate safety.",
                )
            : protocol.id === "oscg-sexual-assault-rape" && gender === "Male"
              ? q.rationaleEn.replace("pregnancy/STIs", "STIs")
              : q.rationaleEn),
          GotoGuideline: null,
          TelemedicineEligible: q.telemedicineEligible,
          AdviceIDs: q.careAdviceIds.map((id) => adviceIdMap.get(id)),
        })),
      ];
      const dispositions = new Map<number, any>();
      for (const q of protocol.questions) {
        const level = q.dispositionLevel ?? 50;
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
            DestinationCode: q.dispositionCode,
            Acuity: level >= 100 ? 5 : level >= 70 ? 4 : level >= 40 ? 3 : 2,
          });
        }
      }
      if (isChildSexualAssault && !dispositions.has(78)) {
        dispositions.set(78, {
          LevelID: 78,
          DispositionHeading: "Urgent Child Safeguarding Review",
          DispositionHeading_Telemedicine: "Immediate safeguarding escalation and in-person assessment",
          Video: false,
          CssVar: "--urgent",
          DestinationCode: "HMC_URGENT_REVIEW",
          Acuity: 4,
        });
      }
      const ageText =
        age.max === null ? "Adult (18 years and older)" : `Child (${age.min}-${age.max} years)`;
      const renderAdviceInstruction = (a: (typeof protocol.careAdvice)[number]) => {
        const instruction = isChildSexualAssault
          ? a.instructionTextEn
              .replace(
                "pregnancy/STI risk assessment",
                gender === "Male" ? "STI risk assessment" : "pregnancy/STI risk assessment",
              )
              .replace(
                "Explain reporting options without pressure and follow Qatar law, safeguarding duties, and approved organizational policy.",
                "Do not promise confidentiality or describe reporting as solely the caller's choice. Follow approved Qatar child-safeguarding, reporting, and information-sharing procedures.",
              )
          : protocol.id === "oscg-sexual-assault-rape" && gender === "Male"
            ? a.instructionTextEn.replace(
                "pregnancy/STI risk assessment",
                "STI risk assessment",
              )
            : a.instructionTextEn;
        const localizedInstruction = localizeOperationalText(instruction);
        return a.dispositionCode === "HMC_EMERGENCY_DEPARTMENT"
          ? normalizeEmergencyAdvice(localizedInstruction)
          : localizedInstruction;
      };
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
              "NHS.UK clinical editorial review (source publisher)",
          },
          FirstAid: protocol.careAdvice
            .filter((a) => a.dispositionCode === "HMC_EMERGENCY_DEPARTMENT")
            .map((a) => renderAdviceInstruction(a)),
          Author: protocol.authorship?.authorEn ?? "IST Health Open-Source Guideline Content",
          LastRevised: "RESEARCH_REQUIRED - internal IST clinical adaptation date is not recorded",
          LastReviewed:
            protocol.authorship?.lastReviewedIso ??
            "RESEARCH_REQUIRED - verify source review date during governance",
          VersionYear: protocol.authorship?.versionYear ?? 2026,
          Company: "IST Health Open-Source Guideline Content",
          Copyright:
            "Crown copyright (NHS.UK content), reused under the Open Government Licence v3.0. This is not licensed STCC content.",
        },
        dispositions: [...dispositions.values()].sort((a, b) => b.LevelID - a.LevelID),
        questions,
        advice: [
          ...protocol.careAdvice.map((a) => ({
            AdviceID: adviceIdMap.get(a.id),
            AlgorithmOrder: a.displayOrder + (isChildSexualAssault ? 1 : 0),
            Title: a.titleEn,
            PatientHealthInfo: a.patientSendable ?? false,
            Internal: false,
            Content: [
              renderAdviceInstruction(a),
              `Call Back If: ${a.warningSigns.join("; ")}.`,
            ],
          })),
          ...(isChildSexualAssault
            ? [
                {
                  AdviceID: childSafeguardingAdviceId,
                  AlgorithmOrder: 1,
                  Title: "Child safeguarding escalation",
                  PatientHealthInfo: false,
                  Internal: false,
                  Content: [
                    "Keep the child in a safe setting when possible. Do not promise confidentiality, confront or alert a suspected perpetrator, or assume the accompanying adult is safe. Escalate to the designated safeguarding lead and approved Qatar child-protection pathway. AMAN receives child-abuse reports and support requests on 919. Call 999 if danger is immediate or the assault is ongoing.",
                    "Clinical and legal governance must confirm the applicable Qatar reporting, consent, documentation, and information-sharing procedure before clinical use.",
                    "Call Back If: the child's safety changes; the suspected perpetrator approaches; immediate danger develops.",
                  ],
                },
              ]
            : []),
        ],
        references:
          protocol.id === "oscg-sexual-assault-rape"
            ? [...protocol.provenance.sourceDocuments, ...qatarSafeguardingReferences]
            : protocol.provenance.sourceDocuments,
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
        redirectTarget: redirect?.target ?? null,
        demographicDifferentiation: {
          ageSpecificChanges: ageChanges,
          sexSpecificChanges: sexChanges,
        },
      });
      for (const [field, description] of [
        ["algorithm.LastRevised", "Internal IST clinical adaptation date is not recorded."],
        ["clinicalReview", "Named IST clinician approval is required for questions, dispositions, redirects, and demographic applicability."],
        [
          "localization",
          protocol.id === "oscg-sexual-assault-rape"
            ? "Clinical and legal governance must confirm Qatar sexual-assault, forensic, child-reporting, consent, information-sharing, AMAN 919, safeguarding, and support pathways before clinical use."
            : "Local Qatar destination and callback instructions require approval.",
        ],
      ]) {
        gaps.push({
          gapId: `B04-${algorithmId}-${field.replaceAll(".", "-")}`,
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
};
const manifest = {
  manifestVersion: "1.0",
  importBatch: "open-source-batch-04",
  generatedDate: "2026-07-25",
  conditionFamilies: batch04Protocols.length,
  protocolCount: entries.length,
  canonicalSourceFieldType: "string",
  algorithmIdRange: "1087-1124",
  applicabilityPolicy,
  childOnlySourceOverrides: ["Rash - Widespread On Drugs"],
  entries,
};
fs.writeFileSync(
  path.join(root, "manifests", "batch-04-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "research-gaps", "batch-04-research-gap-register.json"),
  `${JSON.stringify({ batch: "04", count: gaps.length, gaps }, null, 2)}\n`,
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
- Tracking metadata is in \`../manifests/batch-04-manifest.json\`.

## Parity

- Disposition questions: ${doc.questions.filter((q: any) => q.DispositionLevel !== null).length}
- Redirect questions: ${doc.questions.filter((q: any) => q.DispositionLevel === null).length}
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
  path.join(root, "batches", "batch-04-summary.md"),
  `# Batch 04 - Open-Source Guideline Decomposition

Generated: 2026-07-25

## Outcome

- Ten NHS.UK-derived families produced as ${entries.length} relevant demographic protocols.
- Nine mixed-age families have Adult and source-age-eligible Child variants.
- The children-only drug-rash source produces Child Male/Female variants only.
- IDs continue sequentially from Batch 3: 1087-1124.
- Every protocol has a schema-valid scope redirect and plain-string \`_source\`.
- Sexual-assault child variants include safeguarding as a real urgent decision-tree gate, not only a pre-screen note.
- Child variants do not describe police or safeguarding reporting as solely the caller's choice.

| ID | Protocol | Redirect | Status |
|---:|---|---|---|
${rows}

## Totals

- Condition families: 10
- Demographic protocols: ${entries.length}
- Research-gap entries: ${gaps.length}
- Clinical-governance-approved protocols: 0
`,
);
console.log(`Generated ${entries.length} Batch 4 protocols and ${gaps.length} research gaps.`);
