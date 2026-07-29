import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../db.js";
import { samplePhase1ClinicalContent } from "../data/samplePhase1ClinicalContent.js";
import { stccLicensedContent } from "../data/stccLicensedContent/index.js";
import { mapCanonicalExtractToPackage, type CanonicalExtract } from "./stccMdbMapper.js";
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
import { assertClinicalContentAllowedInEnvironment } from "./clinicalContentReleasePolicy.js";
import type { DispositionCode, RuleTrace, Severity } from "../types/triage.js";
import { severityMax, severityRank } from "../types/triage.js";

const DEFAULT_GENERATED_CONTENT_PACKAGE_PATH = path.resolve(
  process.cwd(),
  "data",
  "generated",
  "synthetic_stcc_guidelines",
  "clinical_content_package.json"
);

/**
 * Reads the real STCC vendor-mirror tables (MdbAlgorithm/MdbQuestion/MdbAdvice/
 * MdbQuestionAdvice/MdbDisposition - see prisma/schema.prisma and the STCC
 * realignment plan) and shapes them into the same CanonicalExtract row shape
 * `scripts/extractStccMdb.ps1` produces from the file, so both the file-based
 * and database-backed content sources go through the identical
 * `mapCanonicalExtractToPackage()` mapper in stccMdbMapper.ts.
 *
 * These are the real, faithfully-mirrored vendor tables. The old app-facing
 * Algorithm/TriageQuestion/CareAdvice content domain has been removed
 * entirely - TriageQueueItem.matchedProtocolId and similar operational FKs
 * now reference MdbAlgorithm.algorithmId directly (see
 * resolveMdbAlgorithmId() in stccMdbMapper.ts).
 */
async function loadCanonicalExtractFromMdbMirror(): Promise<CanonicalExtract> {
  const [algorithms, questions, questionAdvice, advice, dispositions, algorithmSearchWords, supplementals, algorithmSupplementals] =
    await Promise.all([
      (prisma as any).mdbAlgorithm.findMany(),
      (prisma as any).mdbQuestion.findMany(),
      (prisma as any).mdbQuestionAdvice.findMany(),
      (prisma as any).mdbAdvice.findMany(),
      (prisma as any).mdbDisposition.findMany(),
      (prisma as any).mdbAlgorithmSearchWord.findMany(),
      (prisma as any).mdbSupplemental.findMany(),
      (prisma as any).mdbAlgorithmSupplemental.findMany()
    ]);

  return {
    algorithms: algorithms.map((a: any) => ({
      AlgorithmID: a.algorithmId,
      Title: a.title ?? "",
      Author: a.author,
      Copyright: a.copyright,
      Definition: a.definition,
      DefinitionXHTML: a.definitionXhtml,
      Background: a.background,
      BackgroundXHTML: a.backgroundXhtml,
      FirstAid: a.firstAid,
      InitialAssessmentQuestions: a.initialAssessmentQuestions,
      Category: a.category,
      Group: a.group,
      Type: a.typeName,
      System: a.systemName,
      Anatomy: a.anatomy,
      VersionYear: a.versionYear,
      Status: a.status,
      Acuity: a.acuity,
      Gender: a.gender,
      AgeGroup: a.ageGroup,
      Min_Age_Years: a.minAgeYears,
      Max_Age_Years: a.maxAgeYears,
      LastUpDate: a.lastUpDate ? a.lastUpDate.toISOString() : null,
      LastReviewDate: a.lastReviewDate ? a.lastReviewDate.toISOString() : null,
      WH: a.wh,
      BH: a.bh,
      OA: a.oa,
      CD: a.cd,
      Hospice: a.hospice,
      Oncology: a.oncology,
      Prescription_Option: a.prescriptionOption,
      CMS_PRIVATE: a.cmsPrivate,
      SampleGuidelines: a.sampleGuidelines
    })),
    questions: questions.map((q: any) => ({
      QuestionID: q.questionId,
      AlgorithmID: q.algorithmId,
      QuestionOrder: q.questionOrder ?? 0,
      Question: q.question ?? "",
      DispositionLevel: q.dispositionLevel,
      Information: q.information,
      TelemedicineEligible: q.telemedicineEligible
    })),
    questionAdvice: questionAdvice.map((qa: any) => ({
      QuestionID: qa.questionId,
      AdviceID: qa.adviceId,
      QuestionAdviceOrder: qa.questionAdviceOrder
    })),
    advice: advice.map((a: any) => ({
      AdviceID: a.adviceId,
      AlgorithmID: a.algorithmId,
      Advice: a.advice,
      Advice_XHTML: a.adviceXhtml,
      PatientHealthInfo: a.patientHealthInfo,
      AdviceSnap: a.adviceSnap,
      AlgorithmOrder: a.algorithmOrder
    })),
    dispositions: dispositions.map((d: any) => ({
      LevelID: d.levelId,
      DispositionHeading: d.dispositionHeading ?? "",
      DispositionHeading_Telemedicine: d.dispositionHeadingTelemedicine
    })),
    algorithmSearchWords: algorithmSearchWords.map((row: any) => ({
      AlgorithmID: row.algorithmId,
      SearchWord: row.searchWord
    })),
    supplementals: supplementals.map((s: any) => ({
      SupplementalID: s.supplementalId,
      Title: s.title,
      Content: s.content,
      Content_XHTML: s.contentXhtml,
      Category: s.category
    })),
    algorithmSupplementals: algorithmSupplementals.map((row: any) => ({
      AlgorithmID: row.algorithmId,
      SupplementalID: row.supplementalId
    }))
  };
}

async function loadContentPackageFromDatabase(): Promise<ClinicalContentPackage> {
  const extract = await loadCanonicalExtractFromMdbMirror();
  const mapped = mapCanonicalExtractToPackage(extract);

  // None of this content is PRODUCTION_APPROVED yet (real STCC content still
  // pending clinical governance sign-off) - mark it demoEligible so it can run
  // in the demo deployment without claiming production clinical approval, same
  // gating already applied to the file-based stcc-licensed source below.
  const demoEligibleProtocols = mapped.protocols.map((protocol) => ({
    ...protocol,
    provenance: protocol.provenance ? { ...protocol.provenance, demoEligible: true } : protocol.provenance
  }));

  const parsedPackage = ClinicalContentPackageSchema.parse({
    release: mapped.release,
    protocols: demoEligibleProtocols,
    localizedDispositions: mapped.localizedDispositions ?? []
  });
  assertClinicalContentAllowedInEnvironment(parsedPackage);
  return parsedPackage;
}

function loadSynchronousContentPackage(): ClinicalContentPackage {
  // Highest priority: real, licensed STCC content only (see
  // src/data/stccLicensedContent) - the hand-authored open-source-guideline
  // protocol set has been removed entirely per explicit product decision: the
  // app works only with real records sourced from the actual STCC Access
  // database, not synthetic approximations.
  if (process.env.CLINICAL_CONTENT_SOURCE === "stcc-licensed") {
    // None of these protocols are PRODUCTION_APPROVED yet (real STCC content
    // still pending clinical governance sign-off), so mark them demoEligible
    // instead - assertClinicalContentAllowedInEnvironment only honors this in
    // APP_ENVIRONMENT=demo, never in real production.
    const demoEligibleProtocols = stccLicensedContent.protocols.map((protocol) => ({
      ...protocol,
      provenance: protocol.provenance ? { ...protocol.provenance, demoEligible: true } : protocol.provenance
    }));
    const mergedPackage = ClinicalContentPackageSchema.parse({
      release: stccLicensedContent.release,
      protocols: demoEligibleProtocols,
      localizedDispositions: stccLicensedContent.localizedDispositions ?? []
    });
    assertClinicalContentAllowedInEnvironment(mergedPackage);
    return mergedPackage;
  }

  const configuredPath = process.env.CLINICAL_CONTENT_PACKAGE_PATH?.trim();
  if (configuredPath) {
    const absolutePath = path.resolve(configuredPath);
    if (!existsSync(absolutePath)) {
      throw new Error(`CLINICAL_CONTENT_PACKAGE_PATH does not exist: ${absolutePath}`);
    }
    const filePackage = ClinicalContentPackageSchema.parse(JSON.parse(readFileSync(absolutePath, "utf8")));
    assertClinicalContentAllowedInEnvironment(filePackage);
    return filePackage;
  }

  if (process.env.CLINICAL_CONTENT_USE_GENERATED_STCC === "true") {
    if (!existsSync(DEFAULT_GENERATED_CONTENT_PACKAGE_PATH)) {
      throw new Error(
        `Generated STCC-shaped clinical content package not found: ${DEFAULT_GENERATED_CONTENT_PACKAGE_PATH}. Run npm run synthetic:stcc-guidelines first.`
      );
    }
    const licensedPackage = ClinicalContentPackageSchema.parse(
      JSON.parse(readFileSync(DEFAULT_GENERATED_CONTENT_PACKAGE_PATH, "utf8"))
    );
    assertClinicalContentAllowedInEnvironment(licensedPackage);
    return licensedPackage;
  }

  // Also the temporary placeholder for CLINICAL_CONTENT_SOURCE=database until
  // contentPackageReady resolves below - the DB query is unavoidably async.
  const samplePackage = ClinicalContentPackageSchema.parse(samplePhase1ClinicalContent);
  assertClinicalContentAllowedInEnvironment(samplePackage);
  return samplePackage;
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

function queryTerms(query: string): string[] {
  return [...new Set(normalize(query).split(" ").filter((part) => part.length >= 3))];
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

  // Best-match-only, same reasoning as the per-term loop below: a protocol
  // whose own keyword bank repeats one generic word (e.g. "pain") across
  // several authored phrases (abdomen pain, abdominal pain, bladder pain...)
  // must not stack credit for each one - that rewards keyword-bank density
  // for a common word rather than actual relevance to the caller's reason,
  // and can make a protocol with more "pain"-containing phrases outscore a
  // genuinely more specific match by 10x+ on a short/generic query like the
  // bare word "Pain" (confirmed live). Only the single highest-weight
  // matching phrase counts, mirroring how the per-term loop already handles
  // this same failure mode for individual words.
  let bestPhraseMatch: { weight: number; phrase: string } | undefined;
  for (const keyword of protocol.keywords) {
    const phrase = normalize(keyword.phrase);
    if (normalizedQuery.includes(phrase) || phrase.includes(normalizedQuery)) {
      if (!bestPhraseMatch || keyword.weight > bestPhraseMatch.weight) {
        bestPhraseMatch = { weight: keyword.weight, phrase: keyword.phrase };
      }
    }
  }
  if (bestPhraseMatch) {
    score += bestPhraseMatch.weight + 40;
    matchedTerms.add(bestPhraseMatch.phrase);
  }

  // Per-term partial credit is awarded at most once per query term, not once
  // per keyword phrase that happens to contain it. Without this, a protocol
  // whose own keyword bank repeats one word across several phrases (e.g.
  // "turned blue" appearing in 3 separate authored phrases for a pediatric
  // breath-holding-spell protocol) stacks credit for that single word 3x,
  // which can outscore the actually-correct protocol for a caller query that
  // only shares that one generic word - confirmed live via a full-corpus
  // end-to-end sweep (that one protocol alone wrongly won 53 of 228 test
  // narratives via this exact mechanism before this fix). When multiple
  // phrases contain the same term, the highest-weight phrase wins the credit
  // (not first-seen), so a protocol's strongest matching phrase still governs.
  for (const term of terms) {
    let bestMatch: { weight: number; phrase: string } | undefined;
    for (const keyword of protocol.keywords) {
      const phrase = normalize(keyword.phrase);
      // Whole-word match only - a raw substring check let short terms like
      // "an" false-positive-match inside unrelated phrases (e.g. "an" is a
      // literal substring of "pregnancy"), awarding credit to a completely
      // irrelevant protocol from generic connector words in the caller's
      // sentence (confirmed live: "an hour ago" falsely matched "pregnancy").
      const phraseWords = phrase.split(" ");
      if (phraseWords.includes(term) && (!bestMatch || keyword.weight > bestMatch.weight)) {
        bestMatch = { weight: keyword.weight, phrase: keyword.phrase };
      }
    }
    if (bestMatch) {
      score += Math.max(5, Math.round(bestMatch.weight / 4));
      matchedTerms.add(bestMatch.phrase);
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
  return listClinicalProtocols()
    .filter((protocol) => ageMatches(protocol, query.ageYears))
    .filter((protocol) => sexMatches(protocol, query.biologicalSex))
    .filter((protocol) => modeMatches(protocol.mode, query.mode))
    .map((protocol) => {
      const scored = scoreProtocol(protocol, query.q);
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
        releaseVersion: contentPackage.release.version,
        acuity: protocol.acuity
      };
    })
    .filter((result) => !query.q.trim() || result.score > 0)
    .sort((left, right) => {
      // Keyword relevance ranks first - the auto-match pipeline
      // (buildPreparedProtocol in queueOrchestration.ts) picks index [0] as
      // the primary match, so acuity must never outrank an actually strong
      // keyword match (confirmed live: a noise-level score-18 match on
      // "pregnancy" was outranking a genuine score-402 Ankle Injury match
      // purely because Pregnancy's acuity was more urgent). Acuity (1 = most
      // urgent) only breaks a tie between two candidates that scored
      // identically - e.g. resolving a real tie between Ankle Pain and Ankle
      // Injury in the caller's favor of the more urgent one. Missing acuity
      // sorts last (treated as least urgent) rather than first.
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      const leftAcuity = left.acuity ?? 6;
      const rightAcuity = right.acuity ?? 6;
      if (leftAcuity !== rightAcuity) {
        return leftAcuity - rightAcuity;
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
