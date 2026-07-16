import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { samplePhase1ClinicalContent } from "../data/samplePhase1ClinicalContent.js";
import {
  ClinicalContentPackageSchema,
  type ClinicalContentCareAdvice,
  type ClinicalContentPackage,
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

function loadContentPackage(): ClinicalContentPackage {
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

  return ClinicalContentPackageSchema.parse(samplePhase1ClinicalContent);
}

const contentPackage = loadContentPackage();

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function queryTerms(query: string): string[] {
  return [...new Set(normalize(query).split(" ").filter((part) => part.length >= 2))];
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
