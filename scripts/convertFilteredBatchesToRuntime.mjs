// One-off filtered converter for Batches 2-4: same transformation logic as
// convertOpenSourceBatch01ToRuntime.mjs, but SKIPS any protocol file that has
// at least one redirect alias not marked "resolved" (or "conditional_adult_only"
// for an adult protocol) in redirect-alias-registry.json, instead of failing
// the whole batch closed. Skipped files (including all 4 Sexual Assault
// variants, whose target "Physical Assault or Injury" has no authored
// protocol yet) are reported and excluded from the runtime output entirely --
// nothing is invented or imported with a placeholder redirect.
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const CATALOG_ROOT = path.resolve("docs/protocol-review/catalog/open-source");
const REDIRECT_REGISTRY_PATH = path.join(CATALOG_ROOT, "redirect-alias-registry.json");

const BATCH_CONFIGS = {
  "2": {
    label: "Batch 2",
    root: path.join(CATALOG_ROOT, "batch-02"),
    manifest: "manifests/batch-02-manifest.json",
    version: "batch02-formal-rules-2026-07-25"
  },
  "3": {
    label: "Batch 3",
    root: path.join(CATALOG_ROOT, "batch-03"),
    manifest: "manifests/batch-03-manifest.json",
    version: "batch03-demographic-revision-2026-07-25"
  },
  "4": {
    label: "Batch 4",
    root: path.join(CATALOG_ROOT, "batch-04"),
    manifest: "manifests/batch-04-manifest.json",
    version: "batch04-demographic-revision-2026-07-25"
  }
};

const OUTPUT_PATH = path.join(CATALOG_ROOT, "runtime/batches-2-3-4-filtered.runtime.json");

const LEVEL_TO_SEVERITY = { 100: "Emergency", 78: "Urgent", 70: "Urgent", 50: "Routine", 15: "Self-care" };

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
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value) ? value : undefined;
}

function parsePainSeverityRow(raw) {
  const match = raw.match(/^([^:]+):\s*(.+)$/);
  const level = match ? match[1].trim() : raw;
  const textEn = raw;
  const lower = level.toLowerCase();
  const cls = lower.includes("severe") ? "severe" : lower.includes("moderate") ? "moderate" : "mild";
  return { level, cls, textEn };
}

function isRedirectResolved(alias, isAdult, redirectAliases) {
  const resolution = redirectAliases.get(alias);
  return (
    resolution?.status === "resolved" || (resolution?.status === "conditional_adult_only" && isAdult)
  );
}

function fileHasOnlyResolvedRedirects(raw, redirectAliases) {
  const isAdult = raw.algorithm.Age.startsWith("Adult");
  const redirectQuestions = raw.questions.filter((q) => q.DispositionLevel === null);
  return redirectQuestions.every((q) => isRedirectResolved(q.GotoGuideline ?? "", isAdult, redirectAliases));
}

function buildProtocol(raw, manifestEntry, protocolId, redirectAliases) {
  const { algorithm } = raw;
  const isAdult = raw.algorithm.Age.startsWith("Adult");

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
    return {
      id: `${protocolId}-redirect-${q.QuestionID}`,
      questionOrder: q.QuestionOrder,
      promptTextEn: stripHtml(q.Question),
      targetProtocolTitleEn: resolution.canonicalTitle,
      hintEn: `Resolved from alias: ${alias}`
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

  const ageGroup = manifestEntry.ageGroup;
  const genderAtBirth = manifestEntry.genderAtBirth;

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
      sourceKind: "open-source-guideline-demographic-variant",
      sourceDocuments: [`${algorithm.Company} - ${algorithm.Title}, ${algorithm.Copyright}`],
      contentNotice:
        "IST open-source guideline content, demographic-variant expansion. Not licensed STCC content. Blocked pending clinical governance approval; imported to UAT/demo only for structural/pipeline testing. Files with any unresolved redirect target were excluded from this import.",
      requiresClinicalValidation: true,
      licensedContentIncluded: false
    }
  };
}

function main() {
  const registry = JSON.parse(readFileSync(REDIRECT_REGISTRY_PATH, "utf8"));
  const redirectAliases = new Map(registry.aliases.map((entry) => [entry.alias, entry]));

  const allProtocols = [];
  const skipped = [];

  for (const [batchNum, config] of Object.entries(BATCH_CONFIGS)) {
    const jsonDir = path.join(config.root, "json");
    const manifest = JSON.parse(readFileSync(path.join(config.root, config.manifest), "utf8"));
    const manifestByFile = new Map(manifest.entries.map((entry) => [path.basename(entry.file), entry]));

    const files = readdirSync(jsonDir).filter((name) => name.endsWith(".db.json"));
    let batchIncluded = 0;
    for (const file of files) {
      const raw = JSON.parse(readFileSync(path.join(jsonDir, file), "utf8"));
      if (!fileHasOnlyResolvedRedirects(raw, redirectAliases)) {
        skipped.push(`Batch ${batchNum}: ${file}`);
        continue;
      }
      const manifestEntry = manifestByFile.get(file);
      if (!manifestEntry) {
        throw new Error(`No manifest entry found for ${file} (Batch ${batchNum})`);
      }
      const slug = file.replace(/\.db\.json$/, "");
      const protocolId = `oscg-${slug}`;
      allProtocols.push(buildProtocol(raw, manifestEntry, protocolId, redirectAliases));
      batchIncluded += 1;
    }
    console.log(`Batch ${batchNum}: included ${batchIncluded}/${files.length} files`);
  }

  allProtocols.sort((a, b) => a.id.localeCompare(b.id));

  const runtimePackage = {
    release: {
      name: "IST Open-Source Guideline Content - Batches 2-4 (Filtered, UAT)",
      version: "batches-2-3-4-filtered-2026-07-25",
      sourceType: "open-source-guideline",
      region: "QA",
      mode: "after-hours"
    },
    protocols: allProtocols,
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

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(runtimePackage, null, 2), "utf8");
  console.log(`\nWrote ${allProtocols.length} protocols to ${OUTPUT_PATH}`);
  console.log(`\nSkipped ${skipped.length} files (unresolved redirect target):`);
  skipped.forEach((s) => console.log(`  - ${s}`));
}

main();
