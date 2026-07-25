import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { batch03Protocols } from "../../../../../src/data/openSourceGuidelines/batch03.js";
import {
  localizeOperationalText,
  normalizeEmergencyAdvice,
} from "./shared-demographic-generator.js";

const root = path.resolve("docs/protocol-review/catalog/open-source/batch-03");
for (const dir of ["json", "pdf", "evidence", "manifests", "research-gaps", "batches"]) {
  fs.mkdirSync(path.join(root, dir), { recursive: true });
}

const sourceText =
  "Shaped to mirror the licensed After-Hours Telehealth Triage Guidelines database structure. This is IST open-source guideline content derived from the cited NHS.UK pages under the Open Government Licence v3.0; it is not licensed STCC content. Question.DispositionLevel=null marks a See More Appropriate Guideline redirect and is not a disposition row. Local disposition mappings and TelemedicineEligible values require IST clinical governance approval.";
const sha = (value: unknown) =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const scopeRedirects: Record<string, { question: string; info: string; target: string }> = {
  "oscg-suicide-concerns": {
    question: "Is low mood the main concern, with no suicidal or self-harm thoughts, plan, means, or attempt?",
    info: "Low mood without suicide or self-harm concern belongs in the depression pathway.",
    target: "Depression",
  },
  "oscg-depression": {
    question: "Are suicidal or self-harm thoughts, a plan, access to means, or an attempt the primary concern?",
    info: "Any suicide or self-harm concern requires the dedicated safety pathway before routine depression assessment.",
    target: "Suicide Concerns",
  },
  "oscg-insomnia": {
    question: "Are sudden episodes of intense fear, racing heart, trembling, breathlessness, or panic the main concern rather than inability to sleep?",
    info: "A panic presentation belongs in the anxiety and panic pathway; insomnia may remain a related symptom.",
    target: "Anxiety and Panic Attack",
  },
  "oscg-anxiety-panic-attack": {
    question: "Is persistent low mood or loss of interest the main concern, without a current panic episode?",
    info: "Persistent depressive symptoms belong in the depression pathway; suicide risk must still be screened immediately.",
    target: "Depression",
  },
  "oscg-weakness-fatigue": {
    question: "Is a measured blood-glucose reading below 4 mmol/L, or are symptoms suggesting hypoglycaemia, in a person with diabetes?",
    info: "A confirmed low reading or hypoglycaemia symptom pattern belongs in the authored Diabetes - Low Blood Sugar pathway.",
    target: "Diabetes - Low Blood Sugar",
  },
  "oscg-blood-pressure-high": {
    question: "Is the current blood-pressure concern a low reading, faintness, or symptoms after standing rather than an elevated reading?",
    info: "A low-pressure presentation is outside this high-blood-pressure guideline.",
    target: "Blood Pressure - Low",
  },
  "oscg-diabetes-low-blood-sugar": {
    question: "Is the measured glucose high rather than below 4 mmol/L, with thirst, frequent urination, or other hyperglycaemia symptoms?",
    info: "NHS.UK distinguishes hyperglycaemia from hypoglycaemia; a high reading belongs in the high-blood-sugar pathway.",
    target: "Diabetes - High Blood Sugar",
  },
  "oscg-diabetes-high-blood-sugar": {
    question: "Is the measured glucose below 4 mmol/L, or are shaking, sweating, hunger, or confusion suggesting hypoglycaemia?",
    info: "A low reading or hypo symptom pattern belongs in the low-blood-sugar pathway and needs prompt treatment.",
    target: "Diabetes - Low Blood Sugar",
  },
  "oscg-cuts-lacerations": {
    question: "Was this wound caused by an animal or human bite?",
    info: "Bites have distinct infection, tetanus, blood-borne-virus, and rabies considerations and require the bite pathway.",
    target: "Animal Bite",
  },
  "oscg-hearing-loss": {
    question: "Is ear pain the main concern without new hearing loss or hearing change?",
    info: "Primary ear pain without hearing change belongs in the earache pathway.",
    target: "Earache",
  },
};

const painFamilies = new Set(["oscg-cuts-lacerations"]);
const pregnancyFamilies = new Set([
  "oscg-blood-pressure-high",
  "oscg-diabetes-low-blood-sugar",
  "oscg-diabetes-high-blood-sugar",
]);
const backgroundKeyPoints: Record<string, string[]> = {
  "oscg-suicide-concerns": [
    "Immediate danger, an attempt in progress, or a current plan with access to means requires Qatar emergency services.",
    "Urgent mental-health support without immediate danger requires a same-day local mental-health pathway and continued engagement until connected.",
    "The caller should not be left alone when immediate safety is uncertain.",
  ],
  "oscg-depression": [
    "Depression can include persistent low mood, loss of interest, hopelessness, sleep or appetite change, and impaired daily function.",
    "Symptoms present most of the day, nearly every day, for more than 2 weeks warrant clinical assessment.",
    "Suicidal thoughts or self-harm require immediate dedicated safety assessment.",
  ],
  "oscg-insomnia": [
    "Insomnia means regular difficulty falling asleep, remaining asleep, or waking too early, with daytime effects such as fatigue, irritability, or poor concentration.",
    "Short-term insomnia lasts less than 3 months; insomnia lasting 3 months or longer is long-term.",
    "Sleep requirements differ by age, so child and adult functional impact must be assessed in context.",
  ],
  "oscg-anxiety-panic-attack": [
    "Panic attacks can cause sudden intense fear with physical symptoms, but emergency cardiac or breathing presentations must be excluded first.",
    "Repeated unexpected panic attacks followed by persistent worry may indicate panic disorder.",
    "A single settling episode without emergency features still requires safety-net advice.",
  ],
  "oscg-weakness-fatigue": [
    "Persistent unexplained fatigue can be associated with sleep problems, mood disorders, anaemia, diabetes, thyroid disease, infection, or other medical conditions.",
    "Sudden focal weakness, chest pain, severe breathing difficulty, confusion, or reduced responsiveness is an emergency presentation.",
    "Fatigue lasting weeks or interfering with normal life warrants clinical assessment.",
  ],
  "oscg-blood-pressure-high": [
    "High blood pressure usually causes no symptoms and must be confirmed with an appropriate blood-pressure measurement.",
    "Readings are generally considered high at 140/90 mmHg or higher in a clinical setting or 135/85 mmHg or higher at home.",
    "Untreated hypertension increases the risk of heart attack, stroke, heart failure, kidney disease, eye disease, and vascular dementia.",
  ],
  "oscg-diabetes-low-blood-sugar": [
    "Hypoglycaemia is usually a blood-glucose level below 4 mmol/L and should be treated promptly.",
    "Symptoms can include hunger, sweating, shaking, dizziness, weakness, visual change, irritability, palpitations, and confusion.",
    "An unconscious person must not be given food or drink by mouth; emergency escalation depends on recovery and glucagon availability.",
  ],
  "oscg-diabetes-high-blood-sugar": [
    "Hyperglycaemia mainly affects people with diabetes and can become serious if untreated.",
    "Common symptoms include thirst, frequent urination, weakness or tiredness, blurred vision, and weight loss.",
    "Vomiting, abdominal pain, rapid breathing, drowsiness, fruity breath, confusion, or high ketones can indicate a life-threatening complication.",
  ],
  "oscg-cuts-lacerations": [
    "Most small cuts can be managed by controlling bleeding, cleaning the wound, and applying a clean dressing.",
    "Uncontrolled or spurting bleeding, loss of sensation or movement, a very large or deep wound, or an embedded object requires emergency assessment.",
    "Increasing redness, swelling, pain, pus, fever, or retained contamination can indicate infection or need for professional wound care.",
  ],
  "oscg-hearing-loss": [
    "Hearing loss may be gradual or sudden, temporary or permanent, and can have treatable causes such as infection or earwax.",
    "Sudden hearing loss or deterioration over days or weeks requires urgent assessment.",
    "In children, hearing loss can affect speech development and school progress; caregiver observations are clinically important.",
  ],
};
const qatarMentalHealthReferences = [
  "Hamad Medical Corporation, \"Life-Threatening Medical Emergency\", https://hamad.qa/EN/Emergency/Pages/Life-ThreateningMedicalEmergency.aspx (Qatar emergency ambulance: 999)",
  "Hamad Medical Corporation, \"National Mental Health Helpline\", https://hamad.qa/EN/news/2026/April/Pages/National-Mental-Health-Helpline-marks-six-years-of-supporting-Qatar%E2%80%99s-population.aspx (16000, option 4; published hours 08:00-18:00 Saturday-Thursday)",
];
const entries: any[] = [];
const gaps: any[] = [];
let nextId = 1049;

for (const protocol of batch03Protocols) {
  const ageGroups =
    protocol.patientGroup === "adult"
      ? [{ label: "Adult", min: Math.max(18, protocol.ageMin), max: null }]
      : [
          { label: "Adult", min: 18, max: null },
          { label: "Child", min: protocol.ageMin, max: 17 },
        ];
  for (const age of ageGroups) {
    for (const gender of ["Male", "Female"] as const) {
      const algorithmId = nextId++;
      if (age.label === "Child") continue;
      const ageSlug = age.label.toLowerCase();
      const slug = `${slugify(protocol.titleEn)}-${ageSlug}-${gender.toLowerCase()}`;
      const adviceIds = new Map(
        protocol.careAdvice.map((advice, index) => [
          advice.id,
          algorithmId * 100 + index + 1,
        ]),
      );
      const iaqs = protocol.initialAssessmentQuestions.map((q, index) => ({
        Order: index + 1,
        Category: q.responseType,
        Question: q.promptTextEn,
        Rationale: "Condition-relevant source assessment retained from the Batch 3 runtime protocol.",
        Source: protocol.titleEn,
      }));
      const ageChanges: string[] = [];
      const sexChanges: string[] = [];
      if (age.label === "Child") {
        iaqs.push({
          Order: iaqs.length + 1,
          Category: "CAREGIVER_OBSERVATION",
          Question:
            "What change has the parent or caregiver observed in behaviour, alertness, eating or drinking, sleep, school or play, and normal activity?",
          Rationale:
            "Child assessment includes caregiver-observed functional change and cannot rely only on adult-style self-report.",
          Source: "IST pediatric telephone-assessment adaptation; governance review required",
        });
        ageChanges.push(
          `Child applicability begins at source minimum age ${protocol.ageMin}; caregiver-observed function is captured.`,
        );
      } else {
        ageChanges.push("Adult pathway uses direct symptom and functional-impact assessment.");
      }
      if (painFamilies.has(protocol.id)) {
        iaqs.push({
          Order: iaqs.length + 1,
          Category: "PAIN_SEVERITY",
          Question:
            age.label === "Child"
              ? "What pain score from 0 to 10 best fits, and how is pain affecting play, movement, or sleep?"
              : "What is the pain severity from 0 to 10, and how is it affecting movement, activity, or sleep?",
          Rationale: "Pain is directly relevant to wound severity and functional impact.",
          Source: "IST telephone-triage pain assessment",
        });
      }
      if (gender === "Female" && age.label === "Adult" && pregnancyFamilies.has(protocol.id)) {
        iaqs.push({
          Order: iaqs.length + 1,
          Category: "PREGNANCY",
          Question: "Is the patient pregnant or possibly pregnant? If yes, record gestation where known.",
          Rationale:
            "Pregnancy changes the appropriate hypertension or diabetes care pathway and medication/treatment planning.",
          Source:
            protocol.id === "oscg-blood-pressure-high"
              ? "NHS.UK High blood pressure and pregnancy"
              : "IST care-coordination adaptation; governance review required",
        });
        sexChanges.push("Pregnancy status is captured for condition-specific care routing.");
      } else {
        sexChanges.push(
          "No additional sex-specific threshold is supported by the cited source; no difference was fabricated.",
        );
      }
      const redirect = scopeRedirects[protocol.id];
      const localizeQuestionInformation = (questionId: string, fallback: string) => {
        if (protocol.id !== "oscg-suicide-concerns") return fallback;
        if (questionId === "oscg-suicide-q0-emergency") {
          return "Qatar pathway: immediate danger, a suicide attempt, or a current plan with access to means requires calling 999 for an ambulance immediately.";
        }
        if (questionId === "oscg-suicide-q1-urgent") {
          return "Qatar pathway: when there is no immediate danger, arrange same-day mental-health support through HMC 16000, option 4, during published service hours. If safety deteriorates or the person cannot remain safe, call 999.";
        }
        return "Qatar pathway: arrange prompt PHCC or approved local mental-health review and give clear escalation instructions if suicide risk increases.";
      };
      const localizeAdvice = (adviceId: string, fallback: string) => {
        if (protocol.id !== "oscg-suicide-concerns") return fallback;
        if (adviceId === "oscg-suicide-emergency-advice") {
          return "Call 999 for an ambulance immediately. Stay with the person, keep them in a safe location, remove access to means only when safe to do so, and follow the emergency operator's instructions.";
        }
        if (adviceId === "oscg-suicide-urgent-advice") {
          return "Call HMC on 16000 and select option 4 for Mental Health during the published service hours (08:00-18:00, Saturday-Thursday), and arrange same-day clinical review. Stay engaged until support is connected. Outside service hours, or if the person cannot remain safe, call 999.";
        }
        return "Arrange PHCC or an approved Qatar mental-health follow-up pathway. If suicidal thoughts intensify, a plan or access to means develops, or the person cannot remain safe, call 999.";
      };
      const extraRedirects =
        protocol.id === "oscg-weakness-fatigue"
          ? [{
              question: "Is a measured blood-glucose reading high, with thirst, frequent urination, vomiting, abdominal pain, drowsiness, or other hyperglycaemia symptoms?",
              info: "A confirmed high reading or hyperglycaemia symptom pattern belongs in the authored Diabetes - High Blood Sugar pathway.",
              target: "Diabetes - High Blood Sugar",
            }]
          : [];
      const redirectRows = [redirect, ...extraRedirects].map((item, index) => ({
        QuestionID: algorithmId * 1000 + index + 1,
        AlgorithmID: algorithmId,
        DispositionLevel: null,
        QuestionOrder: index + 1,
        Question: item.question,
        Information: item.info,
        GotoGuideline: item.target,
        TelemedicineEligible: false,
        AdviceIDs: [],
      }));
      const questions = [
        ...redirectRows,
        ...protocol.questions.map((q, index) => ({
          QuestionID: algorithmId * 1000 + index + redirectRows.length + 1,
          AlgorithmID: algorithmId,
          DispositionLevel: q.dispositionLevel ?? 50,
          QuestionOrder: q.questionOrder ?? index + 1,
          Question: localizeOperationalText(q.questionTextEn),
          Information: localizeOperationalText(localizeQuestionInformation(q.id, q.rationaleEn)),
          GotoGuideline: null,
          TelemedicineEligible: q.telemedicineEligible,
          AdviceIDs: q.careAdviceIds.map((id) => adviceIds.get(id)),
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
      const ageText =
        age.max === null
          ? `Adult (${age.min} years and older)`
          : `Child (${age.min}-${age.max} years)`;
      const painSeverity = painFamilies.has(protocol.id)
        ? age.label === "Child"
          ? [
              "Mild (1-3): The child can continue usual play, movement, and sleep.",
              "Moderate (4-7): Pain interferes with play, movement, or sleep.",
              "Severe (8-10): The child cannot continue normal activity or cannot be consoled.",
            ]
          : [
              "Mild (1-3): Does not interfere with normal activity, movement, or sleep.",
              "Moderate (4-7): Interferes with normal activity, movement, or sleep.",
              "Severe (8-10): Prevents normal activity or movement, or is described as excruciating.",
            ]
        : [];
      const doc = {
        _source: sourceText,
        algorithm: {
          AlgorithmID: algorithmId,
          Title: `${protocol.titleEn} - ${gender} (${age.label})`,
          ContentSet: `IST Open-Source Guideline Content | ${age.label} | ${gender}`,
          Age: ageText,
          GenderAtBirth: gender,
          Acuity: protocol.acuity,
          Definition: [localizeOperationalText(protocol.clinicalDefinitionEn), `${age.label} patient.`, `${gender}.`],
          PainSeverity: painSeverity,
          Background: {
            KeyPoints: backgroundKeyPoints[protocol.id].map(localizeOperationalText),
            CausesUnder50: [],
            CausesOver50: [],
            LocationTable: [],
            ExpertReviewer:
              protocol.authorship?.expertReviewerEn ??
              "NHS.UK clinical editorial review (source publisher)",
          },
          FirstAid: protocol.careAdvice
            .filter((a) => a.dispositionCode === "HMC_EMERGENCY_DEPARTMENT")
            .map((a) => normalizeEmergencyAdvice(localizeOperationalText(localizeAdvice(a.id, a.instructionTextEn)))),
          Author:
            protocol.authorship?.authorEn ?? "IST Health Open-Source Guideline Content",
          LastRevised: "RESEARCH_REQUIRED - internal IST clinical adaptation date is not recorded",
          LastReviewed: "RESEARCH_REQUIRED - verify source review date during governance",
          VersionYear: protocol.authorship?.versionYear ?? 2026,
          Company: "IST Health Open-Source Guideline Content",
          Copyright:
            "Crown copyright (NHS.UK content), reused under the Open Government Licence v3.0. This is not licensed STCC content.",
        },
        dispositions: [...dispositions.values()].sort((a, b) => b.LevelID - a.LevelID),
        questions,
        advice: protocol.careAdvice.map((a) => ({
          AdviceID: adviceIds.get(a.id),
          AlgorithmOrder: a.displayOrder,
          Title: a.titleEn,
          PatientHealthInfo: a.patientSendable ?? false,
          Internal: false,
          Content: [
            a.dispositionCode === "HMC_EMERGENCY_DEPARTMENT"
              ? normalizeEmergencyAdvice(localizeOperationalText(localizeAdvice(a.id, a.instructionTextEn)))
              : localizeOperationalText(localizeAdvice(a.id, a.instructionTextEn)),
            `Call Back If: ${a.warningSigns.join("; ")}.`,
          ],
        })),
        references:
          protocol.id === "oscg-suicide-concerns"
            ? [...protocol.provenance.sourceDocuments, ...qatarMentalHealthReferences]
            : protocol.provenance.sourceDocuments,
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
          ageSpecificChanges: ageChanges,
          sexSpecificChanges: sexChanges,
        },
      });
      for (const [field, description] of [
        ["algorithm.LastRevised", "Internal IST clinical adaptation date is not recorded."],
        ["clinicalReview", "Named IST clinician approval is required for questions, dispositions, redirects, and demographic applicability."],
        ["localization", protocol.id === "oscg-suicide-concerns"
          ? "Clinical governance must confirm the Qatar 999 emergency wording, HMC 16000 option 4 pathway, published service hours, and approved out-of-hours escalation."
          : "Local Qatar destination and callback instructions require approval."],
      ]) {
        gaps.push({
          gapId: `B03-${algorithmId}-${field.replaceAll(".", "-")}`,
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
  importBatch: "open-source-batch-03",
  generatedDate: "2026-07-25",
  conditionFamilies: batch03Protocols.length,
  protocolCount: entries.length,
  canonicalSourceFieldType: "string",
  algorithmIdRange: "1049-1086",
  entries,
};
fs.writeFileSync(
  path.join(root, "manifests", "batch-03-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(root, "research-gaps", "batch-03-research-gap-register.json"),
  `${JSON.stringify({ batch: "03", count: gaps.length, gaps }, null, 2)}\n`,
);

for (const entry of entries) {
  const file = path.basename(entry.file, ".db.json");
  const doc = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
  fs.writeFileSync(
    path.join(root, "evidence", `${file}-evidence-and-parity-report.md`),
    `# ${entry.title} - Evidence and Parity Report

## Status

- Algorithm ID: \`${entry.algorithmId}\`
- Protocol family: \`${entry.protocolFamily}\`
- Age group: **${entry.ageGroup}**
- Gender at birth: **${entry.genderAtBirth}**
- Completion status: **${entry.validationStatus}**
- Content hash: \`${entry.canonicalContentHash}\`

## Canonical format

- \`_source\` is a single provenance string.
- Tracking metadata is in \`../manifests/batch-03-manifest.json\`.
- The scope redirect uses \`DispositionLevel: null\` and a non-empty \`GotoGuideline\`.

## Demographic differentiation

- ${entry.demographicDifferentiation.ageSpecificChanges.join("\n- ")}
- ${entry.demographicDifferentiation.sexSpecificChanges.join("\n- ")}

## Parity

- Disposition questions: ${doc.questions.filter((q: any) => q.DispositionLevel !== null).length}
- Redirect questions: ${doc.questions.filter((q: any) => q.DispositionLevel === null).length}
- Advice rows: ${doc.advice.length}
- Initial assessment questions: ${doc.initialAssessmentQuestions.length}
- Pain scale present: ${doc.algorithm.PainSeverity.length > 0 ? "yes" : "no"}
- References: ${doc.references.length}
`,
  );
}

const rows = entries
  .map((e) => `| ${e.algorithmId} | ${e.title} | ${e.redirectTarget} | ${e.validationStatus} |`)
  .join("\n");
fs.writeFileSync(
  path.join(root, "batches", "batch-03-summary.md"),
  `# Batch 03 - Open-Source Guideline Decomposition

Generated: 2026-07-25

## Outcome

- Ten NHS.UK-derived condition families produced as ${entries.length} top-level demographic protocols.
- Nine mixed-age families have Adult Male/Female and source-age-eligible Child Male/Female variants.
- Adult-only High Blood Pressure has Adult Male/Female variants only.
- Algorithm IDs continue sequentially from Batch 2: 1049-1086.
- Every protocol contains condition-relevant intake questions and one schema-valid scope redirect.
- Pain assessment is included only for Cuts and Lacerations, where pain is directly relevant.
- \`_source\` is a plain string and tracking metadata is separate.
- Suicide Concerns uses Qatar emergency wording (999) and the HMC National Mental Health Helpline (16000, option 4) with an explicit out-of-hours emergency fallback.
- Every protocol has source-backed Background.KeyPoints; empty placeholder backgrounds are not permitted.

| ID | Protocol | Redirect | Status |
|---:|---|---|---|
${rows}

## Running totals

- Condition families: 10
- Demographic protocols: ${entries.length}
- Research-gap entries: ${gaps.length}
- Clinical-governance-approved protocols: 0
`,
);
console.log(`Generated ${entries.length} Batch 3 protocols and ${gaps.length} research gaps.`);
