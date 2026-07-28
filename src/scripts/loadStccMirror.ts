import { readFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * Upserts the canonical JSON produced by scripts/extractStccMdb.ps1 verbatim
 * into the Mdb* vendor-mirror tables (see prisma/schema.prisma) - a faithful
 * 1:1 copy of the real STCC Access database, keyed by the vendor's own
 * integer ids. This never touches the app-facing Algorithm/TriageQuestion/
 * CareAdvice models; src/data/stccLicensedContent maps those separately.
 *
 * Usage: npx tsx src/scripts/loadStccMirror.ts [path-to-extract.json]
 */

type RawRow = Record<string, unknown>;

type CanonicalExtract = {
  algorithms: RawRow[];
  questions: RawRow[];
  questionAdvice: RawRow[];
  advice: RawRow[];
  dispositions: RawRow[];
  acuityRatings: RawRow[];
  references: RawRow[];
  algorithmReferences: RawRow[];
  searchWords: RawRow[];
  algorithmSearchWords: RawRow[];
  supplementals: RawRow[];
  algorithmSupplementals: RawRow[];
  systems: RawRow[];
  types: RawRow[];
};

function toDate(value: unknown): Date | null {
  if (typeof value !== "string" || value.length === 0) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  return null;
}

function toStr(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function toInt(value: unknown): number | null {
  return typeof value === "number" ? Math.trunc(value) : null;
}

async function loadExtract(filePath: string): Promise<CanonicalExtract> {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw) as CanonicalExtract;
}

async function main() {
  const filePath = path.resolve(
    process.argv[2] ?? path.join(process.cwd(), "docs", "protocol-review", "data", "stcc-sample-extract.json")
  );
  const extract = await loadExtract(filePath);
  const prisma = new PrismaClient();

  try {
    // Order matters: lookup tables and parents first, then children with FKs.
    for (const row of extract.acuityRatings) {
      await prisma.mdbAcuityRating.upsert({
        where: { acuityRatingNumeric: toInt(row.AcuityRating_Numeric)! },
        create: {
          acuityRatingNumeric: toInt(row.AcuityRating_Numeric)!,
          acuityRatingText: toStr(row.AcuityRating_Text),
          acuityRatingColor: toStr(row.AcuityRating_Color),
          acuityRatingColorAlternate: toStr(row.AcuityRating_Color_Alternate),
          acuityRatingTitle: toStr(row.AcuityRating_Title)
        },
        update: {
          acuityRatingText: toStr(row.AcuityRating_Text),
          acuityRatingColor: toStr(row.AcuityRating_Color),
          acuityRatingColorAlternate: toStr(row.AcuityRating_Color_Alternate),
          acuityRatingTitle: toStr(row.AcuityRating_Title)
        }
      });
    }
    console.log(`Upserted ${extract.acuityRatings.length} AcuityRating rows`);

    for (const row of extract.systems) {
      const name = toStr(row.System);
      if (!name) continue;
      await prisma.mdbSystem.upsert({
        where: { system: name },
        create: { system: name, systemOrder: toInt(row.System_Order), systemExample: toStr(row.System_Example) },
        update: { systemOrder: toInt(row.System_Order), systemExample: toStr(row.System_Example) }
      });
    }
    console.log(`Upserted ${extract.systems.length} System rows`);

    for (const row of extract.types) {
      const name = toStr(row.Type);
      if (!name) continue;
      await prisma.mdbType.upsert({
        where: { type: name },
        create: { type: name, typeTopic: toStr(row.Type_Topic) },
        update: { typeTopic: toStr(row.Type_Topic) }
      });
    }
    console.log(`Upserted ${extract.types.length} Type rows`);

    for (const row of extract.dispositions) {
      const levelId = toInt(row.LevelID)!;
      await prisma.mdbDisposition.upsert({
        where: { levelId },
        create: {
          levelId,
          createdDate: toDate(row.CreatedDate),
          lastUpDate: toDate(row.LastUpDate),
          dispositionHeading: toStr(row.DispositionHeading),
          dispositionHeadingTelemedicine: toStr(row.DispositionHeading_Telemedicine),
          adultCareAdviceNumber: toInt(row.Adult_CareAdvice_Number),
          adultCareAdviceStatement: toStr(row.Adult_CareAdvice_Statement),
          adultCareAdviceStatementXhtml: toStr(row.Adult_CareAdvice_Statement_XHTML),
          adultCareAdviceStatementTelemedicine: toStr(row.Adult_CareAdvice_Statement_Telemedicine),
          adultCareAdviceStatementXhtmlTelemedicine: toStr(row.Adult_CareAdvice_Statement_XHTML_Telemedicine),
          pediatricCareAdviceNumber: toInt(row.Pediatric_CareAdvice_Number),
          pediatricCareAdviceStatement: toStr(row.Pediatric_CareAdvice_Statement),
          pediatricCareAdviceStatementXhtml: toStr(row.Pediatric_CareAdvice_Statement_XHTML),
          pediatricCareAdviceStatementTelemedicine: toStr(row.Pediatric_CareAdvice_Statement_Telemedicine),
          pediatricCareAdviceStatementXhtmlTelemedicine: toStr(row.Pediatric_CareAdvice_Statement_XHTML_Telemedicine),
          acuityRatingNumeric: toInt(row.AcuityRating)
        },
        update: {
          dispositionHeading: toStr(row.DispositionHeading),
          dispositionHeadingTelemedicine: toStr(row.DispositionHeading_Telemedicine),
          adultCareAdviceStatement: toStr(row.Adult_CareAdvice_Statement),
          pediatricCareAdviceStatement: toStr(row.Pediatric_CareAdvice_Statement),
          acuityRatingNumeric: toInt(row.AcuityRating)
        }
      });
    }
    console.log(`Upserted ${extract.dispositions.length} Disposition rows`);

    for (const row of extract.algorithms) {
      const algorithmId = toInt(row.AlgorithmID)!;
      const data = {
        author: toStr(row.Author),
        copyright: toStr(row.Copyright),
        createdDate: toDate(row.CreatedDate),
        lastUpDate: toDate(row.LastUpDate),
        lastReviewDate: toDate(row.LastReviewDate),
        title: toStr(row.Title),
        titleUpperCase: toStr(row.Title_UpperCase),
        definition: toStr(row.Definition),
        definitionXhtml: toStr(row.DefinitionXHTML),
        initialAssessmentQuestions: toStr(row.InitialAssessmentQuestions),
        background: toStr(row.Background),
        backgroundXhtml: toStr(row.BackgroundXHTML),
        firstAid: toStr(row.FirstAid),
        firstAidXhtml: toStr(row.FirstAidXHTML),
        ahDescriptors: toBool(row.AH_DESCRIPTORS),
        category: toStr(row.Category),
        group: toStr(row.Group),
        typeName: toStr(row.Type),
        systemName: toStr(row.System),
        anatomy: toStr(row.Anatomy),
        versionYear: toStr(row.VersionYear),
        status: toStr(row.Status),
        acuity: toInt(row.Acuity),
        gender: toStr(row.Gender),
        ageGroup: toStr(row.AgeGroup),
        minAgeYears: toInt(row.Min_Age_Years),
        maxAgeYears: toInt(row.Max_Age_Years),
        minAgeMonths: toInt(row.Min_Age_Months),
        maxAgeMonths: toInt(row.Max_Age_Months),
        wh: toBool(row.WH),
        bh: toBool(row.BH),
        oa: toBool(row.OA),
        cd: toBool(row.CD),
        hospice: toBool(row.Hospice),
        oncology: toBool(row.Oncology),
        prescriptionOption: toBool(row.Prescription_Option),
        cmsPrivate: toBool(row.CMS_PRIVATE),
        sampleGuidelines: toBool(row.SampleGuidelines)
      };
      await prisma.mdbAlgorithm.upsert({
        where: { algorithmId },
        create: { algorithmId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.algorithms.length} Algorithm rows`);

    for (const row of extract.questions) {
      const questionId = toInt(row.QuestionID)!;
      const data = {
        algorithmId: toInt(row.AlgorithmID),
        questionOrder: toInt(row.QuestionOrder),
        dateCreated: toDate(row.DateCreated),
        lastUpDate: toDate(row.LastUpDate),
        question: toStr(row.Question),
        dispositionLevel: toInt(row.DispositionLevel),
        information: toStr(row.Information),
        smagLinkId: toInt(row.SMAG_LINK_ID),
        cmsNew: toBool(row.CMS_NEW),
        telemedicineEligible: toBool(row.TelemedicineEligible)
      };
      await prisma.mdbQuestion.upsert({
        where: { questionId },
        create: { questionId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.questions.length} Question rows`);

    for (const row of extract.advice) {
      const adviceId = toInt(row.AdviceID)!;
      const data = {
        algorithmId: toInt(row.AlgorithmID),
        dateCreated: toDate(row.DateCreated),
        lastUpDate: toDate(row.LastUpDate),
        lastUpDateXhtml: toDate(row.LastUpDate_XHTML),
        advice: toStr(row.Advice),
        adviceXhtml: toStr(row.Advice_XHTML),
        patientHealthInfo: toBool(row.PatientHealthInfo),
        adviceSnap: toStr(row.AdviceSnap),
        algorithmOrder: toInt(row.AlgorithmOrder)
      };
      await prisma.mdbAdvice.upsert({
        where: { adviceId },
        create: { adviceId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.advice.length} Advice rows`);

    for (const row of extract.questionAdvice) {
      const questionId = toInt(row.QuestionID)!;
      const adviceId = toInt(row.AdviceID)!;
      const data = {
        lastUpdate: toDate(row.LastUpdate),
        questionAdviceOrder: toInt(row.QuestionAdviceOrder)
      };
      await prisma.mdbQuestionAdvice.upsert({
        where: { questionId_adviceId: { questionId, adviceId } },
        create: { questionId, adviceId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.questionAdvice.length} QuestionAdvice rows`);

    for (const row of extract.references) {
      const referenceId = toInt(row.ReferenceID)!;
      const data = {
        topicReferenceId: toInt(row.TopicReferenceID),
        referenceTitle: toStr(row.ReferenceTitle),
        referenceSource: toStr(row.ReferenceSource),
        referenceAuthor: toStr(row.ReferenceAuthor),
        lastUpdate: toDate(row.LastUpdate),
        dateAdded: toDate(row.DateAdded),
        pmid: toStr(row.PMID),
        pubMedUrl: toStr(row.PubMedURL),
        publicUrl: toStr(row.PublicURL)
      };
      await prisma.mdbReference.upsert({
        where: { referenceId },
        create: { referenceId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.references.length} Reference rows`);

    for (const row of extract.algorithmReferences) {
      const algorithmId = toInt(row.AlgorithmID)!;
      const referenceId = toInt(row.ReferenceID)!;
      const data = { dateUsed: toDate(row.DateUSed), lastUpdate: toDate(row.LastUpdate) };
      await prisma.mdbAlgorithmReference.upsert({
        where: { algorithmId_referenceId: { algorithmId, referenceId } },
        create: { algorithmId, referenceId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.algorithmReferences.length} AlgorithmReference rows`);

    for (const row of extract.searchWords) {
      const searchWord = toStr(row.SearchWord);
      if (!searchWord) continue;
      await prisma.mdbSearchWord.upsert({
        where: { searchWord },
        create: { searchWord, dateCreated: toDate(row.DateCreated) },
        update: { dateCreated: toDate(row.DateCreated) }
      });
    }
    console.log(`Upserted ${extract.searchWords.length} SearchWord rows`);

    for (const row of extract.algorithmSearchWords) {
      const algorithmId = toInt(row.AlgorithmID)!;
      const searchWord = toStr(row.SearchWord);
      if (!searchWord) continue;
      const data = { createDate: toDate(row.CreateDate), lastUpDate: toDate(row.LastUpDate) };
      await prisma.mdbAlgorithmSearchWord.upsert({
        where: { algorithmId_searchWord: { algorithmId, searchWord } },
        create: { algorithmId, searchWord, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.algorithmSearchWords.length} AlgorithmSearchWords rows`);

    for (const row of extract.supplementals) {
      const supplementalId = toInt(row.SupplementalID)!;
      const data = {
        topicId: toInt(row.TopicID),
        author: toStr(row.Author),
        filename: toStr(row.Filename),
        createDate: toDate(row.CreateDate),
        lastUpDate: toDate(row.LastUpDate),
        lastReviewDate: toDate(row.LastReviewDate),
        title: toStr(row.Title),
        contentXhtml: toStr(row.Content_XHTML),
        content: toStr(row.Content),
        category: toStr(row.Category),
        group: toStr(row.Group),
        status: toStr(row.Status),
        versionYear: toStr(row.VersionYear)
      };
      await prisma.mdbSupplemental.upsert({
        where: { supplementalId },
        create: { supplementalId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.supplementals.length} Supplemental rows`);

    for (const row of extract.algorithmSupplementals) {
      const algorithmId = toInt(row.AlgorithmID)!;
      const supplementalId = toInt(row.SupplementalID)!;
      const data = { createdDate: toDate(row.CreatedDate) };
      await prisma.mdbAlgorithmSupplemental.upsert({
        where: { algorithmId_supplementalId: { algorithmId, supplementalId } },
        create: { algorithmId, supplementalId, ...data },
        update: data
      });
    }
    console.log(`Upserted ${extract.algorithmSupplementals.length} AlgorithmSupplemental rows`);

    console.log("STCC vendor-mirror load complete.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
