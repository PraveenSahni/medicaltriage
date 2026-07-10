import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { samplePhase1ClinicalContent } from "../data/samplePhase1ClinicalContent.js";
import {
  ClinicalContentPackageSchema,
  type ClinicalContentCareAdvice,
  type ClinicalContentPackage,
  type ClinicalContentProtocol,
  type ProtocolMode
} from "../types/clinicalContent.js";
import type { Severity } from "../types/triage.js";

type ImportSummary = {
  sourceUri: string;
  checksum: string;
  dryRun: boolean;
  releaseVersion: string;
  protocolCount: number;
  questionCount: number;
  careAdviceCount: number;
  keywordCount: number;
  localizedDispositionCount: number;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const fileIndex = args.indexOf("--file");

  return {
    dryRun: args.includes("--dry-run"),
    filePath: fileIndex >= 0 ? args[fileIndex + 1] : undefined
  };
}

function checksumFor(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function loadContentPackage(filePath?: string): Promise<{ sourceUri: string; raw: string; data: ClinicalContentPackage }> {
  if (filePath) {
    const absolutePath = path.resolve(filePath);
    const raw = await readFile(absolutePath, "utf8");
    return {
      sourceUri: absolutePath,
      raw,
      data: ClinicalContentPackageSchema.parse(JSON.parse(raw))
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

function summarize(sourceUri: string, raw: string, data: ClinicalContentPackage, dryRun: boolean): ImportSummary {
  return {
    sourceUri,
    checksum: checksumFor(raw),
    dryRun,
    releaseVersion: data.release.version,
    protocolCount: data.protocols.length,
    questionCount: data.protocols.reduce((count, protocol) => count + protocol.questions.length, 0),
    careAdviceCount: uniqueCareAdvice(data).length,
    keywordCount: data.protocols.reduce((count, protocol) => {
      const protocolKeywords = protocol.keywords.length;
      const questionKeywords = protocol.questions.reduce((inner, question) => inner + question.keywords.length, 0);
      return count + protocolKeywords + questionKeywords;
    }, 0),
    localizedDispositionCount: data.localizedDispositions.length
  };
}

async function importIntoDatabase(contentPackage: ClinicalContentPackage, summary: ImportSummary) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for import. Use --dry-run to validate without writing to Cloud SQL/PostgreSQL.");
  }

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
        rowsRead: summary.protocolCount + summary.questionCount + summary.careAdviceCount
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
          dispositionCode: advice.dispositionCode,
          warningSigns: advice.warningSigns
        },
        create: {
          externalCareAdviceId: advice.id,
          adviceTitleEn: advice.titleEn,
          adviceTitleAr: advice.titleAr,
          instructionTextEn: advice.instructionTextEn,
          instructionTextAr: advice.instructionTextAr,
          dispositionCode: advice.dispositionCode,
          warningSigns: advice.warningSigns
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
          ageMin: protocol.ageMin,
          ageMax: protocol.ageMax,
          stccVersion: contentPackage.release.version,
          mode: modeToDb(protocol.mode),
          active: true
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
          ageMin: protocol.ageMin,
          ageMax: protocol.ageMax,
          stccVersion: contentPackage.release.version,
          mode: modeToDb(protocol.mode),
          active: true
        }
      });
      rowsInserted += 1;

      await (prisma as any).protocolKeywordIndex.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).protocolDispositionMap.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).algorithmCareAdvice.deleteMany({ where: { algorithmId: algorithm.id } });
      await (prisma as any).triageQuestion.deleteMany({ where: { algorithmId: algorithm.id } });

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
          await (prisma as any).algorithmCareAdvice.create({
            data: {
              algorithmId: algorithm.id,
              careAdviceId
            }
          });
        }
      }

      for (const question of protocol.questions) {
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
            branching: question.branching
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
  const { dryRun, filePath } = parseArgs();
  const loaded = await loadContentPackage(filePath);
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
