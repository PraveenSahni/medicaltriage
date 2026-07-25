import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { samplePhase1ClinicalContent } from "../data/samplePhase1ClinicalContent.js";
import { openSourceGuidelinesContent } from "../data/openSourceGuidelines/index.js";
import { stccLicensedContent } from "../data/stccLicensedContent/index.js";
import {
  ClinicalContentPackageSchema,
  type ClinicalContentCareAdvice,
  type ClinicalContentPackage,
  type ClinicalContentProtocol,
  type ProtocolMode
} from "../types/clinicalContent.js";
import type { Severity } from "../types/triage.js";
import { assertClinicalContentAllowedInEnvironment } from "../services/clinicalContentReleasePolicy.js";

type ImportSummary = {
  sourceUri: string;
  checksum: string;
  dryRun: boolean;
  releaseVersion: string;
  protocolCount: number;
  initialAssessmentQuestionCount: number;
  questionCount: number;
  careAdviceCount: number;
  keywordCount: number;
  synonymCount: number;
  taxonomyCount: number;
  dispositionMappingCount: number;
  firstAidCount: number;
  referenceCount: number;
  supplementalCount: number;
  localizedDispositionCount: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");
  const sourceIndex = args.indexOf("--source");

  return {
    dryRun: args.includes("--dry-run"),
    filePath: fileIndex >= 0 ? args[fileIndex + 1] : undefined,
    source: sourceIndex >= 0 ? args[sourceIndex + 1] : undefined
  };
}

function checksumFor(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function recordHash(value: unknown): string {
  return checksumFor(JSON.stringify(value));
}

async function loadContentPackage(
  filePath?: string,
  source?: string
): Promise<{ sourceUri: string; raw: string; data: ClinicalContentPackage }> {
  if (filePath) {
    const absolutePath = path.resolve(filePath);
    const raw = await readFile(absolutePath, "utf8");
    return {
      sourceUri: absolutePath,
      raw,
      data: ClinicalContentPackageSchema.parse(JSON.parse(raw))
    };
  }

  if (source === "open-source-rules") {
    const raw = JSON.stringify(openSourceGuidelinesContent);
    return {
      sourceUri: "embedded:openSourceGuidelinesContent",
      raw,
      data: ClinicalContentPackageSchema.parse(openSourceGuidelinesContent)
    };
  }

  if (source === "stcc-licensed") {
    const raw = JSON.stringify(stccLicensedContent);
    return {
      sourceUri: "embedded:stccLicensedContent",
      raw,
      data: ClinicalContentPackageSchema.parse(stccLicensedContent)
    };
  }

  // Mirrors the runtime merge in clinicalContent.ts's loadSynchronousContentPackage():
  // the real licensed STCC protocol plus every open-source guideline protocol,
  // so the database ends up with exactly the same protocol set the live app
  // matches against when CLINICAL_CONTENT_SOURCE=stcc-licensed.
  if (source === "stcc-licensed-merged") {
    const merged: ClinicalContentPackage = ClinicalContentPackageSchema.parse({
      release: stccLicensedContent.release,
      protocols: [...stccLicensedContent.protocols, ...openSourceGuidelinesContent.protocols],
      localizedDispositions: [
        ...(stccLicensedContent.localizedDispositions ?? []),
        ...(openSourceGuidelinesContent.localizedDispositions ?? []).filter(
          (row) => !stccLicensedContent.localizedDispositions?.some((stccRow) => stccRow.code === row.code)
        )
      ]
    });
    return {
      sourceUri: "embedded:stccLicensedContent+openSourceGuidelinesContent",
      raw: JSON.stringify(merged),
      data: merged
    };
  }

  const raw = JSON.stringify(samplePhase1ClinicalContent);
  return {
    sourceUri: "embedded:samplePhase1ClinicalContent",
    raw,
    data: ClinicalContentPackageSchema.parse(samplePhase1ClinicalContent)
  };
}

function modeToDb(mode: ProtocolMode): string {
  if (mode === "office-hours") {
    return "OFFICE_HOURS";
  }

  if (mode === "after-hours") {
    return "AFTER_HOURS";
  }

  return "BOTH";
}

function sourceToDb(sourceType: ClinicalContentPackage["release"]["sourceType"]): string {
  if (sourceType === "licensed-stcc") {
    return "LICENSED_STCC";
  }

  if (sourceType === "local-qatar-override") {
    return "LOCAL_QATAR_OVERRIDE";
  }

  return "SYNTHETIC_SAMPLE";
}

function severityToDb(severity: Severity): string {
  return severity === "Self-care" ? "SELF_CARE" : severity.toUpperCase();
}

function sexToDb(sex: ClinicalContentProtocol["genderRestriction"]): string | null {
  if (!sex) {
    return null;
  }

  return sex.toUpperCase();
}

function patientGroupToDb(patientGroup: ClinicalContentProtocol["patientGroup"]): string {
  return patientGroup.toUpperCase();
}

function isoToDb(iso: string | undefined): Date | null {
  return iso ? new Date(iso) : null;
}

/// STCC's numeric disposition-level ladder (100 -> 15), read directly from the
/// After-Hours Telehealth Triage Guidelines Database Documentation. Structural
/// reference data only (level numbers and heading labels) - never the licensed
/// clinical question/advice content itself, and never consulted by the
/// deterministic safety kernel.
const STCC_DISPOSITION_LEVELS: Record<
  number,
  { headingEn: string; headingTelemedicineEn?: string; videoEligible: boolean }
> = {
  100: { headingEn: "Call EMS 911 Now", videoEligible: false },
  90: { headingEn: "Go to ED Now", videoEligible: false },
  85: { headingEn: "Go to ED Now (or PCP triage)", videoEligible: false },
  80: {
    headingEn: "See HCP (or PCP Triage) Within 4 Hours",
    headingTelemedicineEn: "See HCP (or PCP triage or Video Visit) Within 4 Hours",
    videoEligible: true
  },
  78: { headingEn: "Call PCP Now", headingTelemedicineEn: "Call PCP or Video Visit Now", videoEligible: true },
  70: {
    headingEn: "See PCP Within 24 Hours",
    headingTelemedicineEn: "See PCP or Video Visit Within 24 Hours",
    videoEligible: true
  },
  65: {
    headingEn: "Call PCP Within 24 Hours",
    headingTelemedicineEn: "Call PCP or Video Visit Within 24 Hours",
    videoEligible: true
  },
  50: {
    headingEn: "See PCP Within 3 Days",
    headingTelemedicineEn: "See PCP or Video Visit Within 3 Days",
    videoEligible: true
  },
  48: {
    headingEn: "Call PCP When Office is Open",
    headingTelemedicineEn: "Call PCP or Video Visit When Office is Open",
    videoEligible: true
  },
  20: {
    headingEn: "See PCP Within 2 Weeks",
    headingTelemedicineEn: "See PCP or Video Visit Within 2 Weeks",
    videoEligible: true
  },
  15: { headingEn: "Home Care", videoEligible: false }
};

async function dispositionLevelFor(prisma: PrismaClient, levelId: number): Promise<string> {
  const meta = STCC_DISPOSITION_LEVELS[levelId] ?? {
    headingEn: `STCC disposition level ${levelId}`,
    videoEligible: false
  };
  const saved = await (prisma as any).disposition.upsert({
    where: { levelId },
    update: {
      headingEn: meta.headingEn,
      headingTelemedicineEn: meta.headingTelemedicineEn ?? null,
      videoEligible: meta.videoEligible
    },
    create: {
      levelId,
      headingEn: meta.headingEn,
      headingTelemedicineEn: meta.headingTelemedicineEn ?? null,
      videoEligible: meta.videoEligible
    }
  });
  return saved.id as string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueCareAdvice(contentPackage: ClinicalContentPackage): ClinicalContentCareAdvice[] {
  const byId = new Map<string, ClinicalContentCareAdvice>();
  for (const protocol of contentPackage.protocols) {
    for (const advice of protocol.careAdvice) {
      byId.set(advice.id, advice);
    }
  }

  return [...byId.values()];
}

function protocolSynonyms(protocol: ClinicalContentProtocol) {
  const synonyms = [
    ...protocol.synonyms,
    ...protocol.titleVariants.map((synonym) => ({
      canonicalTerm: protocol.titleEn,
      synonym,
      language: "en",
      region: "QA"
    }))
  ];

  const unique = new Map<string, (typeof synonyms)[number]>();
  for (const synonym of synonyms) {
    if (normalize(synonym.canonicalTerm) === normalize(synonym.synonym)) {
      continue;
    }

    const key = [synonym.canonicalTerm, synonym.synonym, synonym.language, synonym.region]
      .map(normalize)
      .join("|");
    unique.set(key, synonym);
  }

  return [...unique.values()];
}

function protocolReferences(protocol: ClinicalContentProtocol) {
  const references = [...protocol.references];
  for (const [index, url] of protocol.openSourcePatientEducationAnchors.entries()) {
    references.push({
      id: `${protocol.id}-public-anchor-${index + 1}`,
      title: `Public patient education anchor - ${protocol.titleEn}`,
      sourceName: "Public patient education",
      citationText: "Public educational anchor. It does not replace licensed STCC clinical content.",
      url,
      referenceType: "public-patient-education",
      displayOrder: references.length + 1
    });
  }

  const unique = new Map<string, (typeof references)[number]>();
  for (const reference of references) {
    unique.set(reference.id, reference);
  }

  return [...unique.values()];
}

function summarize(sourceUri: string, raw: string, data: ClinicalContentPackage, dryRun: boolean): ImportSummary {
  return {
    sourceUri,
    checksum: checksumFor(raw),
    dryRun,
    releaseVersion: data.release.version,
    protocolCount: data.protocols.length,
    initialAssessmentQuestionCount: data.protocols.reduce(
      (count, protocol) => count + protocol.initialAssessmentQuestions.length,
      0
    ),
    questionCount: data.protocols.reduce((count, protocol) => count + protocol.questions.length, 0),
    careAdviceCount: uniqueCareAdvice(data).length,
    keywordCount: data.protocols.reduce((count, protocol) => {
      const protocolKeywords = protocol.keywords.length;
      const questionKeywords = protocol.questions.reduce((inner, question) => inner + question.keywords.length, 0);
      return count + protocolKeywords + questionKeywords;
    }, 0),
    synonymCount: data.protocols.reduce((count, protocol) => count + protocolSynonyms(protocol).length, 0),
    taxonomyCount: data.protocols.reduce((count, protocol) => count + protocol.taxonomy.length, 0),
    dispositionMappingCount: data.protocols.reduce((count, protocol) => count + protocol.dispositionMappings.length, 0),
    firstAidCount: data.protocols.reduce((count, protocol) => count + protocol.firstAid.length, 0),
    referenceCount: data.protocols.reduce((count, protocol) => count + protocolReferences(protocol).length, 0),
    supplementalCount: data.protocols.reduce((count, protocol) => count + protocol.supplementals.length, 0),
    localizedDispositionCount: data.localizedDispositions.length
  };
}

async function importIntoDatabase(contentPackage: ClinicalContentPackage, summary: ImportSummary) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for import. Use --dry-run to validate without writing to Cloud SQL/PostgreSQL.");
  }

  assertClinicalContentAllowedInEnvironment(contentPackage);

  const prisma = new PrismaClient();
  let importJob: { id: string } | undefined;

  try {
    const release = await (prisma as any).protocolRelease.upsert({
      where: {
        sourceType_version: {
          sourceType: sourceToDb(contentPackage.release.sourceType),
          version: contentPackage.release.version
        }
      },
      update: {
        name: contentPackage.release.name,
        region: contentPackage.release.region,
        mode: modeToDb(contentPackage.release.mode),
        active: true
      },
      create: {
        name: contentPackage.release.name,
        version: contentPackage.release.version,
        sourceType: sourceToDb(contentPackage.release.sourceType),
        region: contentPackage.release.region,
        mode: modeToDb(contentPackage.release.mode),
        active: true
      }
    });

    const createdImportJob = (await (prisma as any).clinicalContentImportJob.create({
      data: {
        releaseId: release.id,
        sourceUri: summary.sourceUri,
        sourceChecksum: summary.checksum,
        status: "VALIDATED",
        rowsRead:
          summary.protocolCount +
          summary.initialAssessmentQuestionCount +
          summary.questionCount +
          summary.careAdviceCount +
          summary.keywordCount +
          summary.synonymCount +
          summary.taxonomyCount +
          summary.dispositionMappingCount +
          summary.firstAidCount +
          summary.referenceCount +
          summary.supplementalCount
      }
    })) as { id: string };
    importJob = createdImportJob;
    const importJobId = createdImportJob.id;

    for (const disposition of contentPackage.localizedDispositions) {
      await (prisma as any).localizedDisposition.upsert({
        where: { code: disposition.code },
        update: {
          destinationNameEn: disposition.destinationNameEn,
          destinationNameAr: disposition.destinationNameAr,
          routingNotesEn: disposition.routingNotesEn,
          routingNotesAr: disposition.routingNotesAr,
          region: disposition.region,
          active: true
        },
        create: {
          code: disposition.code,
          destinationNameEn: disposition.destinationNameEn,
          destinationNameAr: disposition.destinationNameAr,
          routingNotesEn: disposition.routingNotesEn,
          routingNotesAr: disposition.routingNotesAr,
          region: disposition.region,
          active: true
        }
      });
    }

    const globalCareAdviceByExternalId = new Map<string, string>();
    for (const advice of uniqueCareAdvice(contentPackage)) {
      const saved = await (prisma as any).careAdvice.upsert({
        where: { externalCareAdviceId: advice.id },
        update: {
          adviceTitleEn: advice.titleEn,
          adviceTitleAr: advice.titleAr,
          instructionTextEn: advice.instructionTextEn,
          instructionTextAr: advice.instructionTextAr,
          contentFormat: advice.contentFormat,
          sanitizedHtmlEn: advice.sanitizedHtmlEn ?? null,
          sanitizedHtmlAr: advice.sanitizedHtmlAr ?? null,
          dispositionCode: advice.dispositionCode,
          warningSigns: advice.warningSigns,
          patientSendable: advice.patientSendable,
          adviceCategory: advice.adviceCategory ?? null
        },
        create: {
          externalCareAdviceId: advice.id,
          adviceTitleEn: advice.titleEn,
          adviceTitleAr: advice.titleAr,
          instructionTextEn: advice.instructionTextEn,
          instructionTextAr: advice.instructionTextAr,
          contentFormat: advice.contentFormat,
          sanitizedHtmlEn: advice.sanitizedHtmlEn ?? null,
          sanitizedHtmlAr: advice.sanitizedHtmlAr ?? null,
          dispositionCode: advice.dispositionCode,
          warningSigns: advice.warningSigns,
          patientSendable: advice.patientSendable,
          adviceCategory: advice.adviceCategory ?? null
        }
      });
      globalCareAdviceByExternalId.set(advice.id, saved.id);
    }

    let rowsInserted = 0;

    for (const protocol of contentPackage.protocols) {
      const algorithm = await (prisma as any).algorithm.upsert({
        where: { externalProtocolId: protocol.id },
        update: {
          releaseId: release.id,
          titleEn: protocol.titleEn,
          titleAr: protocol.titleAr,
          clinicalDefinitionEn: protocol.clinicalDefinitionEn,
          clinicalDefinitionAr: protocol.clinicalDefinitionAr,
          backgroundInfoEn: protocol.backgroundInfoEn,
          backgroundInfoAr: protocol.backgroundInfoAr,
          genderRestriction: sexToDb(protocol.genderRestriction),
          patientGroup: patientGroupToDb(protocol.patientGroup),
          acuity: protocol.acuity ?? null,
          ageMin: protocol.ageMin,
          ageMax: protocol.ageMax,
          stccVersion: contentPackage.release.version,
          mode: modeToDb(protocol.mode),
          sourceRecordHash: recordHash(protocol),
          sourceRecordChecksum: summary.checksum,
          annualReconciliationStatus: "SYNTHETIC_PUBLIC_INDEX_REQUIRES_CLINICAL_VALIDATION",
          active: true,
          guidelineRedirects: protocol.guidelineRedirects?.length ? protocol.guidelineRedirects : undefined,
          painSeverityTable: protocol.painSeverity?.length ? protocol.painSeverity : undefined,
          backgroundDetail: protocol.backgroundDetail ?? undefined,
          authorEn: protocol.authorship?.authorEn ?? null,
          expertReviewerEn: protocol.authorship?.expertReviewerEn ?? null,
          lastRevisedAt: isoToDb(protocol.authorship?.lastRevisedIso),
          lastReviewedAt: isoToDb(protocol.authorship?.lastReviewedIso),
          versionYear: protocol.authorship?.versionYear ?? null,
          contentSet: protocol.authorship?.contentSet ?? null,
          provenance: protocol.provenance ?? undefined
        },
        create: {
          releaseId: release.id,
          externalProtocolId: protocol.id,
          titleEn: protocol.titleEn,
          titleAr: protocol.titleAr,
          clinicalDefinitionEn: protocol.clinicalDefinitionEn,
          clinicalDefinitionAr: protocol.clinicalDefinitionAr,
          backgroundInfoEn: protocol.backgroundInfoEn,
          backgroundInfoAr: protocol.backgroundInfoAr,
          genderRestriction: sexToDb(protocol.genderRestriction),
          patientGroup: patientGroupToDb(protocol.patientGroup),
          acuity: protocol.acuity ?? null,
          ageMin: protocol.ageMin,
          ageMax: protocol.ageMax,
          stccVersion: contentPackage.release.version,
          mode: modeToDb(protocol.mode),
          sourceRecordHash: recordHash(protocol),
          sourceRecordChecksum: summary.checksum,
          annualReconciliationStatus: "SYNTHETIC_PUBLIC_INDEX_REQUIRES_CLINICAL_VALIDATION",
          active: true,
          guidelineRedirects: protocol.guidelineRedirects?.length ? protocol.guidelineRedirects : undefined,
          painSeverityTable: protocol.painSeverity?.length ? protocol.painSeverity : undefined,
          backgroundDetail: protocol.backgroundDetail ?? undefined,
          authorEn: protocol.authorship?.authorEn ?? null,
          expertReviewerEn: protocol.authorship?.expertReviewerEn ?? null,
          lastRevisedAt: isoToDb(protocol.authorship?.lastRevisedIso),
          lastReviewedAt: isoToDb(protocol.authorship?.lastReviewedIso),
          versionYear: protocol.authorship?.versionYear ?? null,
          contentSet: protocol.authorship?.contentSet ?? null,
          provenance: protocol.provenance ?? undefined
        }
      });
      rowsInserted += 1;

      await (prisma as any).protocolKeywordIndex.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).protocolDispositionMap.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).algorithmCareAdvice.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).triageQuestion.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).initialAssessmentQuestion.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).protocolSynonym.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).protocolTaxonomy.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).protocolFirstAid.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).algorithmReference.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).algorithmSupplemental.deleteMany({ where: { algorithmId: algorithm.id } });

      for (const initialQuestion of protocol.initialAssessmentQuestions) {
        await (prisma as any).initialAssessmentQuestion.create({
          data: {
            algorithmId: algorithm.id,
            externalQuestionId: initialQuestion.id,
            sequence: initialQuestion.sequence,
            responseType: initialQuestion.responseType,
            promptTextEn: initialQuestion.promptTextEn,
            clarificationPromptEn: initialQuestion.clarificationPromptEn,
            required: initialQuestion.required,
            emergencyKeywords: initialQuestion.emergencyKeywords,
            sourceRecordHash: recordHash(initialQuestion),
            sourceRecordChecksum: summary.checksum
          }
        });
        rowsInserted += 1;
      }

      for (const synonym of protocolSynonyms(protocol)) {
        await (prisma as any).protocolSynonym.create({
          data: {
            algorithmId: algorithm.id,
            canonicalTerm: synonym.canonicalTerm,
            synonym: synonym.synonym,
            language: synonym.language,
            region: synonym.region
          }
        });
        rowsInserted += 1;
      }

      for (const taxonomy of protocol.taxonomy) {
        await (prisma as any).protocolTaxonomy.create({
          data: {
            algorithmId: algorithm.id,
            category: taxonomy.category,
            value: taxonomy.value,
            source: taxonomy.source,
            displayOrder: taxonomy.displayOrder
          }
        });
        rowsInserted += 1;
      }

      for (const dispositionMap of protocol.dispositionMappings) {
        const dispositionLevelId = dispositionMap.dispositionLevel
          ? await dispositionLevelFor(prisma, dispositionMap.dispositionLevel)
          : null;
        await (prisma as any).protocolDispositionMap.create({
          data: {
            algorithmId: algorithm.id,
            severity: severityToDb(dispositionMap.severity),
            dispositionCode: dispositionMap.dispositionCode,
            ageMin: dispositionMap.ageMin,
            ageMax: dispositionMap.ageMax,
            aviationContext: dispositionMap.aviationContext,
            routeLabelEn: dispositionMap.routeLabelEn,
            routeRationaleEn: dispositionMap.routeRationaleEn,
            telemedicineHeadingEn: dispositionMap.telemedicineHeadingEn,
            sourceOfCareEn: dispositionMap.sourceOfCareEn,
            dispositionLevelId,
            active: true
          }
        });
        rowsInserted += 1;
      }

      for (const firstAid of protocol.firstAid) {
        await (prisma as any).protocolFirstAid.create({
          data: {
            algorithmId: algorithm.id,
            titleEn: firstAid.titleEn,
            instructionTextEn: firstAid.instructionTextEn,
            sanitizedHtmlEn: firstAid.sanitizedHtmlEn ?? null,
            sanitizedHtmlAr: firstAid.sanitizedHtmlAr ?? null,
            displayOrder: firstAid.displayOrder,
            sourceRecordHash: recordHash(firstAid)
          }
        });
        rowsInserted += 1;
      }

      for (const reference of protocolReferences(protocol)) {
        const savedReference = await (prisma as any).clinicalReference.upsert({
          where: {
            releaseId_externalReferenceId: {
              releaseId: release.id,
              externalReferenceId: reference.id
            }
          },
          update: {
            title: reference.title,
            sourceName: reference.sourceName,
            citationText: reference.citationText,
            url: reference.url,
            referenceType: reference.referenceType,
            sourceRecordHash: recordHash(reference)
          },
          create: {
            releaseId: release.id,
            externalReferenceId: reference.id,
            title: reference.title,
            sourceName: reference.sourceName,
            citationText: reference.citationText,
            url: reference.url,
            referenceType: reference.referenceType,
            sourceRecordHash: recordHash(reference)
          }
        });
        await (prisma as any).algorithmReference.upsert({
          where: {
            algorithmId_referenceId: {
              algorithmId: algorithm.id,
              referenceId: savedReference.id
            }
          },
          update: {
            displayOrder: reference.displayOrder,
            sectionLabel: "reference"
          },
          create: {
            algorithmId: algorithm.id,
            referenceId: savedReference.id,
            displayOrder: reference.displayOrder,
            sectionLabel: "reference"
          }
        });
        rowsInserted += 1;
      }

      for (const supplemental of protocol.supplementals) {
        const savedSupplemental = await (prisma as any).clinicalSupplemental.upsert({
          where: {
            releaseId_externalSupplementalId: {
              releaseId: release.id,
              externalSupplementalId: supplemental.id
            }
          },
          update: {
            titleEn: supplemental.titleEn,
            supplementalType: supplemental.supplementalType,
            plainTextEn: supplemental.plainTextEn,
            sanitizedHtmlEn: supplemental.sanitizedHtmlEn ?? null,
            sanitizedHtmlAr: supplemental.sanitizedHtmlAr ?? null,
            sourceRecordHash: recordHash(supplemental)
          },
          create: {
            releaseId: release.id,
            externalSupplementalId: supplemental.id,
            titleEn: supplemental.titleEn,
            supplementalType: supplemental.supplementalType,
            plainTextEn: supplemental.plainTextEn,
            sanitizedHtmlEn: supplemental.sanitizedHtmlEn ?? null,
            sanitizedHtmlAr: supplemental.sanitizedHtmlAr ?? null,
            sourceRecordHash: recordHash(supplemental)
          }
        });
        await (prisma as any).algorithmSupplemental.upsert({
          where: {
            algorithmId_supplementalId: {
              algorithmId: algorithm.id,
              supplementalId: savedSupplemental.id
            }
          },
          update: {
            displayOrder: supplemental.displayOrder,
            sectionLabel: supplemental.sectionLabel
          },
          create: {
            algorithmId: algorithm.id,
            supplementalId: savedSupplemental.id,
            displayOrder: supplemental.displayOrder,
            sectionLabel: supplemental.sectionLabel
          }
        });
        rowsInserted += 1;
      }

      for (const keyword of protocol.keywords) {
        await (prisma as any).protocolKeywordIndex.create({
          data: {
            algorithmId: algorithm.id,
            phrase: keyword.phrase,
            normalizedPhrase: normalize(keyword.phrase),
            language: keyword.language,
            weight: keyword.weight,
            source: keyword.source
          }
        });
      }

      for (const advice of protocol.careAdvice) {
        const careAdviceId = globalCareAdviceByExternalId.get(advice.id);
        if (careAdviceId) {
          await (prisma as any).algorithmCareAdvice.upsert({
            where: {
              algorithmId_careAdviceId: {
                algorithmId: algorithm.id,
                careAdviceId
              }
            },
            update: { displayOrder: advice.displayOrder },
            create: {
              algorithmId: algorithm.id,
              careAdviceId,
              displayOrder: advice.displayOrder
            }
          });
        }
      }

      for (const question of protocol.questions) {
        const questionDispositionLevelId = question.dispositionLevel
          ? await dispositionLevelFor(prisma, question.dispositionLevel)
          : null;
        const savedQuestion = await (prisma as any).triageQuestion.create({
          data: {
            algorithmId: algorithm.id,
            externalQuestionId: question.id,
            acuityOrder: question.acuityOrder,
            severityGrade: severityToDb(question.severity),
            questionTextEn: question.questionTextEn,
            questionTextAr: question.questionTextAr,
            acuityDispositionCode: question.dispositionCode,
            rationaleEn: question.rationaleEn,
            redFlag: question.redFlag,
            branching: question.branching,
            telemedicineEligible: question.telemedicineEligible ?? null,
            telemedicineNotesEn: question.telemedicineNotesEn ?? null,
            dispositionLevelId: questionDispositionLevelId,
            questionOrder: question.questionOrder ?? null
          }
        });
        rowsInserted += 1;

        for (const keyword of question.keywords) {
          await (prisma as any).protocolKeywordIndex.create({
            data: {
              algorithmId: algorithm.id,
              phrase: keyword,
              normalizedPhrase: normalize(keyword),
              language: "en",
              weight: question.redFlag ? 85 : 50,
              source: "question"
            }
          });
        }

        for (const externalCareAdviceId of question.careAdviceIds) {
          const careAdviceId = globalCareAdviceByExternalId.get(externalCareAdviceId);
          if (careAdviceId) {
            await (prisma as any).questionAdviceBridge.create({
              data: {
                questionId: savedQuestion.id,
                adviceId: careAdviceId,
                triggerAnswer: "YES"
              }
            });
          }
        }
      }
    }

    await (prisma as any).protocolRelease.update({
      where: { id: release.id },
      data: {
        active: true,
        importedAt: new Date()
      }
    });

    await (prisma as any).clinicalContentImportJob.update({
      where: { id: importJobId },
      data: {
        status: "IMPORTED",
        rowsInserted,
        finishedAt: new Date()
      }
    });

    await prisma.$disconnect();
    return { releaseId: release.id, importJobId, rowsInserted };
  } catch (error) {
    if (importJob) {
      await (prisma as any).clinicalContentImportJob.update({
        where: { id: importJob.id },
        data: {
          status: "FAILED",
          errorCount: 1,
          finishedAt: new Date(),
          errors: {
            create: {
              message: error instanceof Error ? error.message : String(error),
              severity: "error"
            }
          }
        }
      });
    }

    await prisma.$disconnect();
    throw error;
  }
}

async function main() {
  const { dryRun, filePath, source } = parseArgs();
  const loaded = await loadContentPackage(filePath, source);
  const summary = summarize(loaded.sourceUri, loaded.raw, loaded.data, dryRun);

  if (dryRun) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  const result = await importIntoDatabase(loaded.data, summary);
  console.log(JSON.stringify({ ...summary, ...result }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
