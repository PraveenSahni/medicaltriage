// Multi-batch converter: reshapes the reviewed DB-shaped JSON for open-source
// Batches 1-23 into the runtime ClinicalContentPackageInput shape accepted by
// src/scripts/importClinicalContent.ts --file. Redirects are resolved only
// through the governed alias registry and conversion fails closed on missing,
// compound, geographic, or age-incompatible targets unless the caller
// explicitly enables the structural-testing override. Outputs remain
// UAT/demo-only and are not wired into a production content source list.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const CATALOG_ROOT = path.resolve("docs/protocol-review/catalog/open-source");
const REDIRECT_REGISTRY_PATH = path.join(CATALOG_ROOT, "redirect-alias-registry.json");
const BATCH_CONFIGS = {
  "1": {
    label: "Batch 1",
    root: CATALOG_ROOT,
    manifest: "manifests/batch-01-manifest.json",
    output: "runtime/batch-01.runtime.json",
    version: "batch01-demographic-revision-2-2026-07-25"
  },
  "2": {
    label: "Batch 2",
    root: path.join(CATALOG_ROOT, "batch-02"),
    manifest: "manifests/batch-02-manifest.json",
    output: "runtime/batch-02.runtime.json",
    version: "batch02-formal-rules-2026-07-25"
  },
  "3": {
    label: "Batch 3",
    root: path.join(CATALOG_ROOT, "batch-03"),
    manifest: "manifests/batch-03-manifest.json",
    output: "runtime/batch-03.runtime.json",
    version: "batch03-demographic-revision-2026-07-25"
  },
  "4": {
    label: "Batch 4",
    root: path.join(CATALOG_ROOT, "batch-04"),
    manifest: "manifests/batch-04-manifest.json",
    output: "runtime/batch-04.runtime.json",
    version: "batch04-demographic-revision-2026-07-25"
  },
  "5": {
    label: "Batch 5",
    root: path.join(CATALOG_ROOT, "batch-05"),
    manifest: "manifests/batch-05-manifest.json",
    output: "runtime/batch-05.runtime.json",
    version: "batch05-learned-safeguard-expansion-2026-07-25"
  },
  "6": {
    label: "Batch 6",
    root: path.join(CATALOG_ROOT, "batch-06"),
    manifest: "manifests/batch-06-manifest.json",
    output: "runtime/batch-06.runtime.json",
    version: "batch06-learned-safeguard-expansion-2026-07-25"
  },
  "7": {
    label: "Batch 7",
    root: path.join(CATALOG_ROOT, "batch-07"),
    manifest: "manifests/batch-07-manifest.json",
    output: "runtime/batch-07.runtime.json",
    version: "batch07-learned-safeguard-expansion-2026-07-25"
  },
  "8": {
    label: "Batch 8",
    root: path.join(CATALOG_ROOT, "batch-08"),
    manifest: "manifests/batch-08-manifest.json",
    output: "runtime/batch-08.runtime.json",
    version: "batch08-learned-safeguard-expansion-2026-07-25"
  },
  "9": {
    label: "Batch 9",
    root: path.join(CATALOG_ROOT, "batch-09"),
    manifest: "manifests/batch-09-manifest.json",
    output: "runtime/batch-09.runtime.json",
    version: "batch09-learned-safeguard-expansion-2026-07-25"
  },
  "10": {
    label: "Batch 10",
    root: path.join(CATALOG_ROOT, "batch-10"),
    manifest: "manifests/batch-10-manifest.json",
    output: "runtime/batch-10.runtime.json",
    version: "batch10-learned-safeguard-expansion-2026-07-25"
  },
  "11": {
    label: "Batch 11",
    root: path.join(CATALOG_ROOT, "batch-11"),
    manifest: "manifests/batch-11-manifest.json",
    output: "runtime/batch-11.runtime.json",
    version: "batch11-learned-safeguard-expansion-2026-07-25"
  },
  "12": {
    label: "Batch 12",
    root: path.join(CATALOG_ROOT, "batch-12"),
    manifest: "manifests/batch-12-manifest.json",
    output: "runtime/batch-12.runtime.json",
    version: "batch12-learned-safeguard-expansion-2026-07-25"
  },
  "13": {
    label: "Batch 13",
    root: path.join(CATALOG_ROOT, "batch-13"),
    manifest: "manifests/batch-13-manifest.json",
    output: "runtime/batch-13.runtime.json",
    version: "batch13-learned-safeguard-expansion-2026-07-25"
  },
  "14": {
    label: "Batch 14",
    root: path.join(CATALOG_ROOT, "batch-14"),
    manifest: "manifests/batch-14-manifest.json",
    output: "runtime/batch-14.runtime.json",
    version: "batch14-learned-safeguard-expansion-2026-07-25"
  },
  "15": {
    label: "Batch 15",
    root: path.join(CATALOG_ROOT, "batch-15"),
    manifest: "manifests/batch-15-manifest.json",
    output: "runtime/batch-15.runtime.json",
    version: "batch15-learned-safeguard-expansion-2026-07-25"
  },
  "16": {
    label: "Batch 16",
    root: path.join(CATALOG_ROOT, "batch-16"),
    manifest: "manifests/batch-16-manifest.json",
    output: "runtime/batch-16.runtime.json",
    version: "batch16-learned-safeguard-expansion-2026-07-25"
  },
  "17": {
    label: "Batch 17",
    root: path.join(CATALOG_ROOT, "batch-17"),
    manifest: "manifests/batch-17-manifest.json",
    output: "runtime/batch-17.runtime.json",
    version: "batch17-applicability-aware-expansion-2026-07-25"
  },
  "18": {
    label: "Batch 18",
    root: path.join(CATALOG_ROOT, "batch-18"),
    manifest: "manifests/batch-18-manifest.json",
    output: "runtime/batch-18.runtime.json",
    version: "batch18-applicability-aware-expansion-2026-07-25"
  },
  "19": {
    label: "Batch 19",
    root: path.join(CATALOG_ROOT, "batch-19"),
    manifest: "manifests/batch-19-manifest.json",
    output: "runtime/batch-19.runtime.json",
    version: "batch19-applicability-aware-expansion-2026-07-25"
  },
  "20": {
    label: "Batch 20",
    root: path.join(CATALOG_ROOT, "batch-20"),
    manifest: "manifests/batch-20-manifest.json",
    output: "runtime/batch-20.runtime.json",
    version: "batch20-applicability-aware-expansion-2026-07-25"
  },
  "21": {
    label: "Batch 21",
    root: path.join(CATALOG_ROOT, "batch-21"),
    manifest: "manifests/batch-21-manifest.json",
    output: "runtime/batch-21.runtime.json",
    version: "batch21-applicability-aware-expansion-2026-07-25"
  },
  "22": {
    label: "Batch 22",
    root: path.join(CATALOG_ROOT, "batch-22"),
    manifest: "manifests/batch-22-manifest.json",
    output: "runtime/batch-22.runtime.json",
    version: "batch22-applicability-aware-expansion-2026-07-25"
  },
  "23": {
    label: "Batch 23",
    root: path.join(CATALOG_ROOT, "batch-23"),
    manifest: "manifests/batch-23-manifest.json",
    output: "runtime/batch-23.runtime.json",
    version: "batch23-applicability-aware-expansion-2026-07-25"
  }
};

const LEVEL_TO_SEVERITY = {
  100: "Emergency",
  78: "Urgent",
  70: "Urgent",
  50: "Routine",
  15: "Self-care"
};

const CATEGORY_TO_RESPONSE_TYPE = {
  LOCATION: "LOCATION",
  ONSET: "DURATION",
  DURATION: "DURATION",
  RECURRENCE: "DURATION",
  TREATMENT_TIME: "DURATION",
  PAIN_SCALE: "PAIN_SCALE",
  TEMPERATURE: "TEMPERATURE"
};

function stripHtml(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&mdash;/g, "-")
    .replace(/&deg;/g, "°")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&rsquo;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isoDateOrUndefined(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;
}

function parsePainSeverityRow(raw) {
  const match = raw.match(/^([^:]+):\s*(.+)$/);
  const level = match ? match[1].trim() : raw;
  const textEn = raw;
  const lower = level.toLowerCase();
  const cls = lower.includes("severe") ? "severe" : lower.includes("moderate") ? "moderate" : "mild";
  return { level, cls, textEn };
}

function buildProtocol(raw, manifestEntry, protocolId, batchLabel, redirectAliases, allowUnresolved) {
  const { algorithm } = raw;

  const dispositionQuestions = raw.questions
    .filter((q) => q.DispositionLevel !== null)
    .sort((a, b) => b.DispositionLevel - a.DispositionLevel || a.QuestionOrder - b.QuestionOrder);
  const redirectQuestions = raw.questions.filter((q) => q.DispositionLevel === null);

  const levelToDestination = new Map(raw.dispositions.map((d) => [d.LevelID, d.DestinationCode]));
  const usedAdviceIds = new Set();

  const questions = dispositionQuestions.map((q, index) => {
    const level = q.DispositionLevel;
    q.AdviceIDs.forEach((id) => usedAdviceIds.add(id));
    return {
      id: `${protocolId}-q${q.QuestionID}`,
      acuityOrder: index + 1,
      severity: LEVEL_TO_SEVERITY[level] ?? "Routine",
      questionTextEn: stripHtml(q.Question),
      dispositionCode: levelToDestination.get(level) ?? "PHCC_URGENT_CARE_OR_TELECONSULT",
      rationaleEn: q.Information ? stripHtml(q.Information) : `Disposition level ${level}.`,
      redFlag: level >= 90,
      keywords: [],
      careAdviceIds: q.AdviceIDs.map((id) => `${protocolId}-advice-${id}`),
      telemedicineEligible: q.TelemedicineEligible,
      dispositionLevel: level,
      questionOrder: q.QuestionOrder
    };
  });

  const careAdvice = raw.advice
    .filter((advice) => usedAdviceIds.has(advice.AdviceID) && !advice.Internal)
    .map((advice) => {
      const owningQuestion = dispositionQuestions.find((q) => q.AdviceIDs.includes(advice.AdviceID));
      const level = owningQuestion?.DispositionLevel;
      return {
        id: `${protocolId}-advice-${advice.AdviceID}`,
        titleEn: advice.Title,
        instructionTextEn: advice.Content.join(" ") || advice.Title,
        dispositionCode: level !== undefined ? levelToDestination.get(level) : undefined,
        warningSigns: [],
        displayOrder: advice.AlgorithmOrder,
        patientSendable: advice.PatientHealthInfo
      };
    });

  const guidelineRedirects = redirectQuestions.map((q) => {
    const alias = q.GotoGuideline ?? "";
    const resolution = redirectAliases.get(alias);
    const isAdult = raw.algorithm.Age.startsWith("Adult");
    const resolved =
      resolution?.status === "resolved" ||
      (resolution?.status === "conditional_adult_only" && isAdult);
    if (!resolved && !allowUnresolved) {
      throw new Error(
        `${raw.algorithm.Title}: redirect '${alias}' is ${resolution?.status ?? "not registered"}; runtime conversion blocked.`
      );
    }
    return {
      id: `${protocolId}-redirect-${q.QuestionID}`,
      questionOrder: q.QuestionOrder,
      promptTextEn: stripHtml(q.Question),
      targetProtocolTitleEn:
        resolved && resolution.canonicalTitle
          ? resolution.canonicalTitle
          : alias.replace(/^Go to Guideline:\s*/, "").trim() || "Unresolved redirect",
      hintEn: resolved
        ? `Resolved from alias: ${alias}`
        : `UNRESOLVED (${resolution?.status ?? "not registered"}): ${alias}`
    };
  });

  const initialAssessmentQuestions = raw.initialAssessmentQuestions.map((iaq, index) => ({
    id: `${protocolId}-iaq-${index + 1}`,
    sequence: iaq.Order ?? index + 1,
    responseType: CATEGORY_TO_RESPONSE_TYPE[iaq.Category] ?? "OPEN_TEXT",
    promptTextEn: stripHtml(iaq.Question),
    clarificationPromptEn: iaq.Prompts?.length ? stripHtml(iaq.Prompts.join(" ")) : undefined,
    required: true,
    emergencyKeywords: []
  }));

  const ageGroup = manifestEntry.ageGroup; // "Adult" | "Child"
  const genderAtBirth = manifestEntry.genderAtBirth; // "Male" | "Female"

  return {
    id: protocolId,
    titleEn: algorithm.Title,
    clinicalDefinitionEn: algorithm.Definition.join(" "),
    backgroundInfoEn: algorithm.Background.KeyPoints.join(" "),
    ageMin: ageGroup === "Child" ? 0 : 18,
    ageMax: ageGroup === "Child" ? 17 : undefined,
    genderRestriction: genderAtBirth.toLowerCase(),
    mode: "after-hours",
    patientGroup: ageGroup === "Child" ? "pediatric" : "adult",
    acuity: algorithm.Acuity,
    keywords: raw.searchwords.map((phrase, index) => ({
      phrase: phrase.toLowerCase(),
      weight: Math.max(100 - index * 10, 50)
    })),
    initialAssessmentQuestions,
    questions,
    careAdvice,
    guidelineRedirects,
    painSeverity: (algorithm.PainSeverity ?? []).map(parsePainSeverityRow),
    backgroundDetail: {
      keyPointsEn: algorithm.Background.KeyPoints,
      causesUnder50En: algorithm.Background.CausesUnder50 ?? [],
      causesOver50En: algorithm.Background.CausesOver50 ?? [],
      locationTable: (algorithm.Background.LocationTable ?? []).map((row) => ({
        locationEn: row.loc,
        sourceEn: row.source
      }))
    },
    firstAid: (algorithm.FirstAid ?? []).map((textEn, index) => ({
      titleEn: "First Aid",
      instructionTextEn: textEn,
      displayOrder: index + 1
    })),
    references: (raw.references ?? []).map((citationText, index) => ({
      id: `${protocolId}-ref-${index + 1}`,
      title: citationText,
      citationText,
      referenceType: "public-source",
      displayOrder: index + 1
    })),
    authorship: {
      authorEn: algorithm.Author,
      expertReviewerEn: algorithm.Background.ExpertReviewer,
      lastRevisedIso: isoDateOrUndefined(algorithm.LastRevised),
      lastReviewedIso: isoDateOrUndefined(algorithm.LastReviewed),
      versionYear: algorithm.VersionYear,
      contentSet: algorithm.ContentSet
    },
    provenance: {
      generated: false,
      sourceKind: `open-source-guideline-${batchLabel.toLowerCase().replace(/\s+/g, "-")}`,
      sourceDocuments: [`${algorithm.Company} - ${algorithm.Title}, ${algorithm.Copyright}`],
      contentNotice:
        `IST open-source guideline content (${batchLabel}). Not licensed STCC content. Blocked pending clinical governance approval; import is permitted only for isolated structural/pipeline testing until localization and governance checks pass.`,
      usageStatus: "UAT_ONLY",
      productionEligible: false,
      clinicalStatus: "READY_FOR_QATAR_CLINICAL_REVIEW",
      requiresClinicalValidation: true,
      licensedContentIncluded: false
    }
  };
}

function convertBatch(config, redirectAliases, allowUnresolved) {
  const jsonDir = path.join(config.root, "json");
  const manifestPath = path.join(config.root, config.manifest);
  const outputPath = path.join(config.root, config.output);
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const manifestByFile = new Map(manifest.entries.map((entry) => [path.basename(entry.file), entry]));

  const files = readdirSync(jsonDir).filter((name) => name.endsWith(".db.json"));
  const protocols = [];

  for (const file of files) {
    const manifestEntry = manifestByFile.get(file);
    if (!manifestEntry) {
      throw new Error(`No manifest entry found for ${file}`);
    }
    const raw = JSON.parse(readFileSync(path.join(jsonDir, file), "utf8"));
    const slug = file.replace(/\.db\.json$/, "");
    const protocolId = `oscg-${slug}`;
    protocols.push(
      buildProtocol(raw, manifestEntry, protocolId, config.label, redirectAliases, allowUnresolved)
    );
  }

  protocols.sort((a, b) => a.id.localeCompare(b.id));

  const runtimePackage = {
    release: {
      name: `IST Open-Source Guideline Content - ${config.label} (UAT)`,
      version: config.version,
      sourceType: "open-source-guideline",
      region: "QA",
      mode: "after-hours"
    },
    protocols,
    localizedDispositions: [
      {
        code: "HMC_EMERGENCY_DEPARTMENT",
        destinationNameEn: "Nearest Hamad Medical Corporation Emergency Department",
        routingNotesEn: "Use for emergency presentations.",
        region: "QA"
      },
      {
        code: "HMC_URGENT_REVIEW",
        destinationNameEn: "HMC urgent review pathway",
        routingNotesEn: "Use for urgent but not immediately life-threatening presentations.",
        region: "QA"
      },
      {
        code: "PHCC_URGENT_CARE_OR_TELECONSULT",
        destinationNameEn: "PHCC urgent care or IST teleconsult",
        routingNotesEn: "Use for lower-acuity review after emergency and urgent red flags are ruled out.",
        region: "QA"
      },
      {
        code: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        destinationNameEn: "Self-care with callback precautions",
        routingNotesEn: "Use only when higher-acuity questions are negative and nurse review agrees.",
        region: "QA"
      }
    ]
  };

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(runtimePackage, null, 2), "utf8");
  console.log(`Wrote ${protocols.length} protocols to ${outputPath}`);
  return runtimePackage;
}

function main() {
  const batchArgIndex = process.argv.indexOf("--batch");
  const selection = batchArgIndex >= 0 ? process.argv[batchArgIndex + 1] : "1";
  const selected =
    selection === "all"
      ? Object.values(BATCH_CONFIGS)
      : [BATCH_CONFIGS[selection]].filter(Boolean);
  if (!selected.length) {
    throw new Error(`Unknown batch '${selection}'. Use --batch 1 through 23, or all.`);
  }
  const registry = JSON.parse(readFileSync(REDIRECT_REGISTRY_PATH, "utf8"));
  const redirectAliases = new Map(registry.aliases.map((entry) => [entry.alias, entry]));
  const allowUnresolved = process.argv.includes("--allow-unresolved-redirects");
  for (const config of selected) convertBatch(config, redirectAliases, allowUnresolved);
}

main();
