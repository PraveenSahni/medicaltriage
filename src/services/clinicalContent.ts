import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../db.js";
import { samplePhase1ClinicalContent } from "../data/samplePhase1ClinicalContent.js";
import { openSourceGuidelinesContent } from "../data/openSourceGuidelines/index.js";
import { expandQueryWithConcepts } from "../data/openSourceGuidelines/shared/conceptGazetteer.js";
import {
  ClinicalContentPackageSchema,
  type ClinicalContentCareAdvice,
  type ClinicalContentPackage,
  type ClinicalContentPackageInput,
  type ClinicalContentProtocol,
  type ClinicalContentQuestion,
  type ProtocolMode,
  type ProtocolSearchQuery,
  type ProtocolSearchResult
} from "../types/clinicalContent.js";
import type { DispositionCode, RuleTrace, Severity } from "../types/triage.js";
import { severityMax, severityRank } from "../types/triage.js";

const DEFAULT_GENERATED_CONTENT_PACKAGE_PATH = path.resolve(
  process.cwd(),
  "data",
  "generated",
  "synthetic_stcc_guidelines",
  "clinical_content_package.json"
);

function dbSourceTypeToZod(sourceType: string): ClinicalContentPackageInput["release"]["sourceType"] {
  if (sourceType === "LICENSED_STCC") {
    return "licensed-stcc";
  }

  if (sourceType === "LOCAL_QATAR_OVERRIDE") {
    return "local-qatar-override";
  }

  return "synthetic-sample";
}

function dbModeToZod(mode: string): ProtocolMode {
  if (mode === "OFFICE_HOURS") {
    return "office-hours";
  }

  if (mode === "AFTER_HOURS") {
    return "after-hours";
  }

  return "both";
}

function dbSeverityToZod(severity: string): Severity {
  switch (severity) {
    case "EMERGENCY":
      return "Emergency";
    case "URGENT":
      return "Urgent";
    case "SELF_CARE":
      return "Self-care";
    default:
      return "Routine";
  }
}

function dbPatientGroupToZod(patientGroup: string): ClinicalContentProtocol["patientGroup"] {
  const lowered = patientGroup.toLowerCase();
  return (lowered === "adult" || lowered === "pediatric" || lowered === "mixed" ? lowered : "unknown") as ClinicalContentProtocol["patientGroup"];
}

function dbGenderToZod(gender: string | null): ClinicalContentProtocol["genderRestriction"] {
  if (!gender) {
    return undefined;
  }

  const lowered = gender.toLowerCase();
  return (lowered === "female" || lowered === "male" || lowered === "other" ? lowered : "unknown") as ClinicalContentProtocol["genderRestriction"];
}

function dbDateToIso(value: Date | null | undefined): string | undefined {
  return value ? value.toISOString() : undefined;
}

/**
 * Reconstructs the in-memory content package from the STCC-compatible Prisma
 * tables (Algorithm/TriageQuestion/CareAdvice/Disposition/...), the mirror
 * image of what `src/scripts/importClinicalContent.ts` writes. Used only when
 * `CLINICAL_CONTENT_SOURCE=database` - every other source stays file-based.
 *
 * Known, accepted lossy spots (both pre-existing in the importer, not
 * introduced here): (1) question-level `keywords` are indexed in
 * `ProtocolKeywordIndex` at the algorithm level only (no per-question FK), so
 * they cannot be reattached to individual questions on read-back - this only
 * degrades search-relevance scoring, not clinical correctness, since
 * protocol-level keywords round-trip fully; (2) `release.sourceType` collapses
 * to whatever `ProtocolRelease.sourceType` the importer wrote, which itself
 * collapses `open-source-clinical-rule`/`open-source-guideline` down to
 * `SYNTHETIC_SAMPLE` (`sourceToDb()` in the importer) since the DB enum has no
 * dedicated value for those two sourceTypes yet.
 */
async function loadContentPackageFromDatabase(): Promise<ClinicalContentPackage> {
  const algorithms = await (prisma as any).algorithm.findMany({
    where: { active: true },
    include: {
      release: true,
      questions: {
        include: {
          dispositionLevel: true,
          careAdviceLinks: { include: { advice: true } }
        }
      },
      initialAssessmentQuestions: true,
      careAdviceLinks: { include: { careAdvice: true }, orderBy: { displayOrder: "asc" } },
      keywordIndexes: true
    }
  });

  const localizedDispositionRows = await (prisma as any).localizedDisposition.findMany({
    where: { active: true }
  });

  const firstRelease = algorithms.find((algorithm: any) => algorithm.release)?.release;

  const protocols: ClinicalContentPackageInput["protocols"] = algorithms.map((algorithm: any) => {
    const protocolLevelKeywords = (algorithm.keywordIndexes ?? []).filter((row: any) => row.source !== "question");

    const questions: ClinicalContentPackageInput["protocols"][number]["questions"] = algorithm.questions
      .sort((left: any, right: any) => left.acuityOrder - right.acuityOrder)
      .map((question: any) => ({
        id: question.externalQuestionId ?? question.id,
        acuityOrder: question.acuityOrder,
        severity: dbSeverityToZod(question.severityGrade),
        questionTextEn: question.questionTextEn,
        questionTextAr: question.questionTextAr ?? undefined,
        dispositionCode: question.acuityDispositionCode as DispositionCode,
        rationaleEn: question.rationaleEn ?? "",
        redFlag: question.redFlag,
        keywords: [],
        careAdviceIds: (question.careAdviceLinks ?? []).map(
          (link: any) => link.advice.externalCareAdviceId ?? link.advice.id
        ),
        telemedicineEligible: question.telemedicineEligible ?? undefined,
        telemedicineNotesEn: question.telemedicineNotesEn ?? undefined,
        dispositionLevel: question.dispositionLevel?.levelId ?? undefined,
        questionOrder: question.questionOrder ?? undefined
      }));

    const careAdvice: ClinicalContentPackageInput["protocols"][number]["careAdvice"] = (algorithm.careAdviceLinks ?? []).map(
      (link: any) => ({
        id: link.careAdvice.externalCareAdviceId ?? link.careAdvice.id,
        titleEn: link.careAdvice.adviceTitleEn,
        titleAr: link.careAdvice.adviceTitleAr ?? undefined,
        instructionTextEn: link.careAdvice.instructionTextEn,
        instructionTextAr: link.careAdvice.instructionTextAr ?? undefined,
        contentFormat: link.careAdvice.contentFormat,
        sanitizedHtmlEn: link.careAdvice.sanitizedHtmlEn ?? undefined,
        sanitizedHtmlAr: link.careAdvice.sanitizedHtmlAr ?? undefined,
        dispositionCode: (link.careAdvice.dispositionCode as DispositionCode) ?? undefined,
        warningSigns: (link.careAdvice.warningSigns as string[] | null) ?? [],
        displayOrder: link.displayOrder,
        patientSendable: link.careAdvice.patientSendable,
        adviceCategory: link.careAdvice.adviceCategory ?? undefined
      })
    );

    return {
      id: algorithm.externalProtocolId ?? algorithm.id,
      titleEn: algorithm.titleEn,
      titleAr: algorithm.titleAr ?? undefined,
      clinicalDefinitionEn: algorithm.clinicalDefinitionEn ?? undefined,
      clinicalDefinitionAr: algorithm.clinicalDefinitionAr ?? undefined,
      backgroundInfoEn: algorithm.backgroundInfoEn ?? undefined,
      backgroundInfoAr: algorithm.backgroundInfoAr ?? undefined,
      ageMin: algorithm.ageMin ?? undefined,
      ageMax: algorithm.ageMax ?? undefined,
      genderRestriction: dbGenderToZod(algorithm.genderRestriction),
      mode: dbModeToZod(algorithm.mode),
      patientGroup: dbPatientGroupToZod(algorithm.patientGroup),
      acuity: algorithm.acuity ?? undefined,
      keywords: protocolLevelKeywords.map((row: any) => ({
        phrase: row.phrase,
        language: row.language,
        weight: row.weight,
        source: row.source
      })),
      initialAssessmentQuestions: (algorithm.initialAssessmentQuestions ?? [])
        .sort((left: any, right: any) => left.sequence - right.sequence)
        .map((iaq: any) => ({
          id: iaq.externalQuestionId ?? iaq.id,
          sequence: iaq.sequence,
          responseType: iaq.responseType,
          promptTextEn: iaq.promptTextEn,
          clarificationPromptEn: iaq.clarificationPromptEn ?? undefined,
          required: iaq.required,
          emergencyKeywords: (iaq.emergencyKeywords as string[] | null) ?? []
        })),
      questions,
      careAdvice,
      guidelineRedirects: (algorithm.guidelineRedirects as ClinicalContentProtocol["guidelineRedirects"]) ?? [],
      painSeverity: (algorithm.painSeverityTable as ClinicalContentProtocol["painSeverity"]) ?? [],
      backgroundDetail: (algorithm.backgroundDetail as ClinicalContentProtocol["backgroundDetail"]) ?? undefined,
      authorship: algorithm.authorEn || algorithm.expertReviewerEn || algorithm.contentSet
        ? {
            authorEn: algorithm.authorEn ?? undefined,
            expertReviewerEn: algorithm.expertReviewerEn ?? undefined,
            lastRevisedIso: dbDateToIso(algorithm.lastRevisedAt),
            lastReviewedIso: dbDateToIso(algorithm.lastReviewedAt),
            versionYear: algorithm.versionYear ?? undefined,
            contentSet: algorithm.contentSet ?? undefined
          }
        : undefined,
      provenance: (algorithm.provenance as ClinicalContentProtocol["provenance"]) ?? undefined
    };
  });

  return ClinicalContentPackageSchema.parse({
    release: {
      name: firstRelease?.name ?? "IST Health Database-Backed Clinical Content",
      version: firstRelease?.version ?? "database-live",
      sourceType: dbSourceTypeToZod(firstRelease?.sourceType ?? "SYNTHETIC_SAMPLE"),
      region: firstRelease?.region ?? "QA",
      mode: dbModeToZod(firstRelease?.mode ?? "BOTH")
    },
    protocols,
    localizedDispositions: localizedDispositionRows.map((row: any) => ({
      code: row.code,
      destinationNameEn: row.destinationNameEn,
      destinationNameAr: row.destinationNameAr ?? undefined,
      routingNotesEn: row.routingNotesEn,
      routingNotesAr: row.routingNotesAr ?? undefined,
      region: row.region
    }))
  });
}

function loadSynchronousContentPackage(): ClinicalContentPackage {
  const configuredPath = process.env.CLINICAL_CONTENT_PACKAGE_PATH?.trim();
  if (configuredPath) {
    const absolutePath = path.resolve(configuredPath);
    if (!existsSync(absolutePath)) {
      throw new Error(`CLINICAL_CONTENT_PACKAGE_PATH does not exist: ${absolutePath}`);
    }
    return ClinicalContentPackageSchema.parse(JSON.parse(readFileSync(absolutePath, "utf8")));
  }

  if (process.env.CLINICAL_CONTENT_USE_GENERATED_STCC === "true") {
    if (!existsSync(DEFAULT_GENERATED_CONTENT_PACKAGE_PATH)) {
      throw new Error(
        `Generated STCC-shaped clinical content package not found: ${DEFAULT_GENERATED_CONTENT_PACKAGE_PATH}. Run npm run synthetic:stcc-guidelines first.`
      );
    }
    return ClinicalContentPackageSchema.parse(
      JSON.parse(readFileSync(DEFAULT_GENERATED_CONTENT_PACKAGE_PATH, "utf8"))
    );
  }

  if (process.env.CLINICAL_CONTENT_SOURCE === "open-source-rules") {
    return ClinicalContentPackageSchema.parse(openSourceGuidelinesContent);
  }

  // Also the temporary placeholder for CLINICAL_CONTENT_SOURCE=database until
  // contentPackageReady resolves below - the DB query is unavoidably async.
  return ClinicalContentPackageSchema.parse(samplePhase1ClinicalContent);
}

let contentPackage: ClinicalContentPackage = loadSynchronousContentPackage();

/**
 * Avoids top-level `await` (ts-jest's isolated per-file ESM transpilation
 * rejects it under this repo's NodeNext module setting, even though plain
 * `tsc` and real Node ESM both support it fine). Every downstream function in
 * this file stays synchronous, reading whatever `contentPackage` currently
 * is. For `CLINICAL_CONTENT_SOURCE=database`, the real server entrypoint
 * (`src/index.ts`) awaits this before calling `app.listen()` so no request is
 * served from the placeholder sample; tests never set this source and this
 * promise is already-resolved for every other source, so nothing changes for
 * existing callers.
 */
export const contentPackageReady: Promise<void> =
  process.env.CLINICAL_CONTENT_SOURCE === "database"
    ? (async () => {
        if (!process.env.DATABASE_URL?.trim()) {
          throw new Error("CLINICAL_CONTENT_SOURCE=database requires DATABASE_URL to be set.");
        }
        contentPackage = await loadContentPackageFromDatabase();
      })()
    : Promise.resolve();

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Phase 1 of the semantic-matching plan (see
// docs/semantic-matching-enhancement-plan-2026.md) - lightweight,
// hand-written suffix stripping rather than a full Porter/Snowball stemmer:
// our vocabulary is narrow lay-medical English, and a general-purpose
// stemmer risks false collapses ("universe" -> "univers") that a narrow
// rule set avoids. Order matters - more specific suffixes are checked first
// so e.g. "worries" -> "worry" via the "ies" rule rather than "worrie" via
// a bare "s"/"es" rule.
const SUFFIX_RULES: ReadonlyArray<{ suffix: string; replacement: string }> = [
  { suffix: "ies", replacement: "y" },
  { suffix: "ing", replacement: "" },
  { suffix: "ed", replacement: "" },
  { suffix: "es", replacement: "" },
  { suffix: "s", replacement: "" }
];

// A stemmed result shorter than this is discarded outright - short stems
// are exactly the substrings that caused confirmed false-positive
// regressions during Phase 0 (see the plan doc's changelog).
const MIN_STEM_RESULT_LENGTH = 4;

// Even at 4+ characters, some stems are specifically the generic
// single-symptom words already found (during Phase 0) to cause widespread
// cross-protocol noise, because this content set deliberately has many
// competing protocols that legitimately share these exact words in their
// own authored keywords (see synonymDictionary.ts's "Common symptom words"
// comment for the full explanation). Stemming must not silently
// reintroduce them: e.g. "hurts" -> strip "s" -> "hurt" would make any
// query containing "hurts" newly match "hurt my hand"/"hurt my wrist"-style
// keywords across dozens of unrelated protocols, widening a noise-floor
// problem that most of Phase 0's effort went into containing rather than
// fixing it. This is a deliberate, narrow blocklist of stem *outputs*, not
// a general stopword list - only add to it with the same evidence standard
// (a confirmed regression via the A/B sweep), not speculatively.
const STEM_BLOCKLIST = new Set(["hurt", "ache", "sore", "pain", "swell", "itch", "faint", "dizzy", "weak", "numb"]);

function stem(word: string): string | null {
  for (const rule of SUFFIX_RULES) {
    if (!word.endsWith(rule.suffix)) {
      continue;
    }
    const stemmed = word.slice(0, word.length - rule.suffix.length) + rule.replacement;
    if (stemmed.length < MIN_STEM_RESULT_LENGTH || STEM_BLOCKLIST.has(stemmed) || stemmed === word) {
      return null;
    }
    return stemmed;
  }
  return null;
}

function queryTerms(query: string): string[] {
  const rawTerms = normalize(query)
    .split(" ")
    .filter((part) => part.length >= 2);
  const stemmedTerms = rawTerms.map(stem).filter((term): term is string => term !== null);
  return [...new Set([...rawTerms, ...stemmedTerms])];
}

function modeMatches(protocolMode: ProtocolMode, requestedMode: ProtocolMode): boolean {
  return protocolMode === "both" || requestedMode === "both" || protocolMode === requestedMode;
}

function ageMatches(protocol: ClinicalContentProtocol, ageYears?: number): boolean {
  if (typeof ageYears !== "number") {
    return true;
  }

  if (typeof protocol.ageMin === "number" && ageYears < protocol.ageMin) {
    return false;
  }

  if (typeof protocol.ageMax === "number" && ageYears > protocol.ageMax) {
    return false;
  }

  return true;
}

function sexMatches(protocol: ClinicalContentProtocol, biologicalSex?: string): boolean {
  return !protocol.genderRestriction || !biologicalSex || protocol.genderRestriction === biologicalSex;
}

function highestSeverityForQuestions(questions: ClinicalContentQuestion[]): Severity {
  return questions.reduce<Severity>(
    (current, question) => severityMax(current, question.severity),
    "Self-care"
  );
}

function scoreProtocol(protocol: ClinicalContentProtocol, query: string): { score: number; matchedTerms: string[] } {
  const normalizedQuery = normalize(query);
  const terms = queryTerms(query);

  if (!normalizedQuery) {
    return { score: 1, matchedTerms: [] };
  }

  let score = 0;
  const matchedTerms = new Set<string>();
  const title = normalize(protocol.titleEn);
  const definition = normalize(protocol.clinicalDefinitionEn ?? "");

  if (title.includes(normalizedQuery)) {
    score += 150;
    matchedTerms.add(protocol.titleEn);
  }

  if (definition.includes(normalizedQuery)) {
    score += 25;
  }

  // Same minimum-length guard as the synonym loop below - see its comment.
  const MIN_VARIANT_PHRASE_LENGTH = 4;

  for (const titleVariant of protocol.titleVariants) {
    const variant = normalize(titleVariant);
    if (!variant || variant.length < MIN_VARIANT_PHRASE_LENGTH) {
      continue;
    }
    if (normalizedQuery.includes(variant) || variant.includes(normalizedQuery)) {
      score += 120;
      matchedTerms.add(titleVariant);
    }
    for (const term of terms) {
      if (term.length >= MIN_VARIANT_PHRASE_LENGTH && variant.includes(term)) {
        score += 15;
        matchedTerms.add(titleVariant);
      }
    }
  }

  // Synonym phrases shorter than this are excluded from substring matching
  // entirely: a short phrase like "er" or "ed" is a substring of countless
  // unrelated words ("blistered", "swollen" contain "er"/"ed"), so scoring
  // it via normalizedQuery.includes(phrase) produces false-positive matches
  // against nearly any caller sentence. Confirmed via a real regression
  // during Phase 0 authoring (see docs/semantic-matching-enhancement-plan-2026.md).
  const MIN_SYNONYM_PHRASE_LENGTH = 4;

  // Multiple synonym rows commonly share the same canonicalTerm (one row per
  // variant word). Scoring the canonical phrase inside the per-row loop
  // would award full credit once per row sharing that canonical term - e.g.
  // 5 variant rows all sharing canonicalTerm "swelling" would each
  // separately match a caller's literal "swelling" and multiply the score
  // 5x for one real word match. Score each unique canonical phrase for a
  // protocol at most once, tracked here, while still scoring every distinct
  // variant phrase independently (those are genuinely different wordings).
  const scoredCanonicalPhrases = new Set<string>();

  for (const synonymEntry of protocol.synonyms) {
    const synonymPhrase = normalize(synonymEntry.synonym);
    const canonicalPhrase = normalize(synonymEntry.canonicalTerm);

    if (
      canonicalPhrase &&
      canonicalPhrase.length >= MIN_SYNONYM_PHRASE_LENGTH &&
      !scoredCanonicalPhrases.has(canonicalPhrase)
    ) {
      scoredCanonicalPhrases.add(canonicalPhrase);
      if (normalizedQuery.includes(canonicalPhrase) || canonicalPhrase.includes(normalizedQuery)) {
        score += 60;
        matchedTerms.add(synonymEntry.canonicalTerm);
      }
      for (const term of terms) {
        if (term.length >= MIN_SYNONYM_PHRASE_LENGTH && canonicalPhrase.includes(term)) {
          score += 8;
          matchedTerms.add(synonymEntry.canonicalTerm);
        }
      }
    }

    if (!synonymPhrase || synonymPhrase.length < MIN_SYNONYM_PHRASE_LENGTH) {
      continue;
    }
    if (normalizedQuery.includes(synonymPhrase) || synonymPhrase.includes(normalizedQuery)) {
      score += 60;
      matchedTerms.add(synonymEntry.synonym);
    }
    for (const term of terms) {
      if (term.length >= MIN_SYNONYM_PHRASE_LENGTH && synonymPhrase.includes(term)) {
        score += 8;
        matchedTerms.add(synonymEntry.synonym);
      }
    }
  }

  for (const keyword of protocol.keywords) {
    const phrase = normalize(keyword.phrase);
    if (normalizedQuery.includes(phrase) || phrase.includes(normalizedQuery)) {
      score += keyword.weight + 40;
      matchedTerms.add(keyword.phrase);
    }

    for (const term of terms) {
      if (phrase.includes(term)) {
        score += Math.max(5, Math.round(keyword.weight / 4));
        matchedTerms.add(keyword.phrase);
      }
    }
  }

  for (const question of protocol.questions) {
    for (const keyword of question.keywords) {
      const phrase = normalize(keyword);
      if (normalizedQuery.includes(phrase) || phrase.includes(normalizedQuery)) {
        score += question.redFlag ? 12 : 8;
        matchedTerms.add(keyword);
      }
    }
  }

  return { score, matchedTerms: [...matchedTerms].slice(0, 5) };
}

export function getCurrentClinicalContentPackage(): ClinicalContentPackage {
  return contentPackage;
}

export function listClinicalProtocols(): ClinicalContentProtocol[] {
  return contentPackage.protocols
    .map((protocol) => ({
      ...protocol,
      questions: [...protocol.questions].sort((left, right) => left.acuityOrder - right.acuityOrder)
    }))
    .sort((left, right) => left.titleEn.localeCompare(right.titleEn));
}

export function getClinicalProtocolById(protocolId: string): ClinicalContentProtocol | undefined {
  return listClinicalProtocols().find((protocol) => protocol.id === protocolId);
}

export function searchClinicalProtocols(query: ProtocolSearchQuery): ProtocolSearchResult[] {
  // Phase 2 of the semantic-matching plan (docs/semantic-matching-enhancement-plan-2026.md):
  // expand the raw query with any matched lay-term concept tags before scoring.
  // This is purely query-side - scoreProtocol() itself is unchanged, and the
  // original query.q (used below for the empty-query filter) is untouched.
  const expandedQuery = expandQueryWithConcepts(query.q);

  return listClinicalProtocols()
    .filter((protocol) => ageMatches(protocol, query.ageYears))
    .filter((protocol) => sexMatches(protocol, query.biologicalSex))
    .filter((protocol) => modeMatches(protocol.mode, query.mode))
    .map((protocol) => {
      const scored = scoreProtocol(protocol, expandedQuery);
      return {
        id: protocol.id,
        titleEn: protocol.titleEn,
        clinicalDefinitionEn: protocol.clinicalDefinitionEn,
        ageMin: protocol.ageMin,
        ageMax: protocol.ageMax,
        mode: protocol.mode,
        score: scored.score,
        matchedTerms: scored.matchedTerms,
        questionCount: protocol.questions.length,
        highestSeverity: highestSeverityForQuestions(protocol.questions),
        releaseVersion: contentPackage.release.version
      };
    })
    .filter((result) => !query.q.trim() || result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.titleEn.localeCompare(right.titleEn);
    })
    .slice(0, query.limit);
}

export function deriveProtocolSafetyFloor(protocolId?: string, selectedQuestionIds: string[] = []): {
  severity: Severity;
  dispositionCode?: DispositionCode;
  trace: RuleTrace[];
} {
  if (!protocolId || selectedQuestionIds.length === 0) {
    return { severity: "Self-care", trace: [] };
  }

  const protocol = getClinicalProtocolById(protocolId);
  if (!protocol) {
    return {
      severity: "Self-care",
      trace: [
        {
          ruleId: "CONTENT_PROTOCOL_NOT_FOUND",
          matched: false,
          rationale: `Protocol ${protocolId} was not found in the active Phase 1 content package.`
        }
      ]
    };
  }

  let severity: Severity = "Self-care";
  let dispositionCode: DispositionCode | undefined;
  const trace: RuleTrace[] = [];

  for (const question of protocol.questions) {
    const matched = selectedQuestionIds.includes(question.id);
    trace.push({
      ruleId: `CONTENT_${protocol.id}_${question.id}`.toUpperCase().replace(/[^A-Z0-9_]/g, "_"),
      matched,
      severity: matched ? question.severity : undefined,
      dispositionCode: matched ? question.dispositionCode : undefined,
      rationale: matched
        ? question.rationaleEn
        : `Question ${question.id} was not selected as positive.`
    });

    if (matched && severityRank[question.severity] > severityRank[severity]) {
      severity = question.severity;
      dispositionCode = question.dispositionCode;
    }
  }

  return { severity, dispositionCode, trace };
}

export function getCareAdviceForProtocol(
  protocolId: string,
  selectedQuestionIds: string[],
  dispositionCode?: DispositionCode
): ClinicalContentCareAdvice[] {
  const protocol = getClinicalProtocolById(protocolId);
  if (!protocol) {
    return [];
  }

  const careAdviceIds = new Set<string>();
  for (const question of protocol.questions) {
    if (selectedQuestionIds.includes(question.id)) {
      question.careAdviceIds.forEach((careAdviceId) => careAdviceIds.add(careAdviceId));
    }
  }

  const protocolCareAdvice = protocol.careAdvice;
  const seen = new Set<string>();

  return protocolCareAdvice.filter((advice) => {
    if (seen.has(advice.id)) {
      return false;
    }

    seen.add(advice.id);
    return (
      careAdviceIds.has(advice.id) ||
      (dispositionCode && advice.dispositionCode === dispositionCode)
    );
  });
}

export function getLocalizedDisposition(code: DispositionCode) {
  return contentPackage.localizedDispositions.find((item) => item.code === code);
}
