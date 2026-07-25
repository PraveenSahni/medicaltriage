import fs from "node:fs";
import path from "node:path";

type CatalogQuestion = {
  AdviceIDs?: number[];
  DispositionLevel: number | null;
  Question: string;
  TelemedicineEligible: boolean;
};

type CatalogDocument = {
  algorithm: {
    Age: string;
    AlgorithmID: number;
    Title: string;
  };
  advice: Array<{ AdviceID: number }>;
  questions: CatalogQuestion[];
};

const catalogRoot = path.resolve("docs/protocol-review/catalog/open-source");
const excludedIds = new Set([
  1003, 1004, 1025, 1026, 1027, 1028, 1029, 1030, 1031, 1032, 1055, 1056,
  1070, 1207, 1208, 1227, 1228, 1235, 1236, 1247, 1248, 1255, 1256, 1259,
  1260, 1267, 1268, 1275, 1276, 1283, 1284, 1287, 1288, 1291, 1292, 1295,
  1296, 1299, 1300, 1303, 1304, 1307, 1308, 1363, 1364, 1389, 1390, 1391,
  1392, 1415, 1416, 1441, 1442, 1485, 1486,
]);

function findJsonFiles(root: string): string[] {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) return findJsonFiles(absolute);
    return entry.name.endsWith(".db.json") ? [absolute] : [];
  });
}

const records = new Map<number, CatalogDocument>();
for (const file of findJsonFiles(catalogRoot)) {
  const document = JSON.parse(fs.readFileSync(file, "utf8")) as CatalogDocument;
  if (excludedIds.has(document.algorithm.AlgorithmID)) {
    records.set(document.algorithm.AlgorithmID, document);
  }
}

const questionsText = (record: CatalogDocument) =>
  record.questions.map((question) => question.Question).join(" ");

describe("corrected 55-record clinical-content regression set", () => {
  test("contains every corrected record with resolved advice and no telemedicine terminal", () => {
    expect([...records.keys()].sort((a, b) => a - b)).toEqual(
      [...excludedIds].sort((a, b) => a - b),
    );

    for (const record of records.values()) {
      const adviceIds = new Set(record.advice.map((advice) => advice.AdviceID));
      for (const question of record.questions) {
        expect(question.TelemedicineEligible).toBe(false);
        for (const adviceId of question.AdviceIDs ?? []) {
          expect(adviceIds.has(adviceId)).toBe(true);
        }
      }
    }
  });

  test("preserves emergency and infant deterioration floors", () => {
    for (const id of [1389, 1390, 1391, 1392]) {
      const record = records.get(id)!;
      expect(record.questions.some((question) => question.DispositionLevel === 100)).toBe(true);
      expect(questionsText(record)).toMatch(/severe or abnormal breathing/i);
    }

    for (const id of [1391, 1392, 1415, 1416]) {
      const record = records.get(id)!;
      expect(questionsText(record)).toMatch(/under 3 months.*38/i);
    }

    for (const id of [1441, 1442]) {
      const record = records.get(id)!;
      expect(record.questions.some((question) => question.DispositionLevel === 100)).toBe(true);
      expect(questionsText(record)).toMatch(/temperature 38|systemically unwell/i);
    }
  });

  test("makes child safeguarding concerns executable", () => {
    const safeguardingIds = [
      1055, 1056, 1207, 1208, 1227, 1228, 1235, 1236, 1247, 1248, 1255, 1256,
      1267, 1268, 1275, 1276, 1283, 1284, 1287, 1288, 1291, 1292, 1295, 1296,
      1299, 1300, 1303, 1304, 1307, 1308, 1363, 1364, 1485, 1486,
    ];

    for (const id of safeguardingIds) {
      const record = records.get(id)!;
      expect(questionsText(record)).toMatch(/safeguard|caregiver|speak privately|abuse/i);
      expect(
        record.questions.some(
          (question) =>
            question.DispositionLevel !== null && question.DispositionLevel >= 70,
        ),
      ).toBe(true);
    }
  });

  test("applies corrected demographic and deterministic gates", () => {
    for (const id of [1003, 1004]) {
      const record = records.get(id)!;
      expect(record.questions.some((question) => question.DispositionLevel === 15)).toBe(false);
      expect(questionsText(record)).toMatch(/patient aged 5 to 17 years/i);
    }

    for (const id of [1070]) {
      expect(questionsText(records.get(id)!)).toMatch(/pregnant|postpartum|given birth/i);
    }

    for (const id of [1259, 1260]) {
      const record = records.get(id)!;
      const terminalLevels = record.questions
        .map((question) => question.DispositionLevel)
        .filter((level): level is number => level !== null);
      expect(terminalLevels).toEqual([70, 70]);
      expect(questionsText(record)).toMatch(/recorded demographics/i);
      expect(questionsText(record)).toMatch(/recorded age unavailable|recorded age.*contradictory/i);
    }

    for (const id of [1485, 1486]) {
      const record = records.get(id)!;
      expect(record.algorithm.Age).toBe("Child (5-17 years)");
      expect(questionsText(record)).toMatch(/excessive thirst|weight loss/i);
    }
  });

  test("separates clinical urgency from automatic ambulance transport", () => {
    for (const id of [1025, 1026, 1027, 1028]) {
      const record = records.get(id)!;
      expect(record.questions.some((question) => question.DispositionLevel === 100)).toBe(true);
      expect(record.questions.some((question) => question.DispositionLevel === 70)).toBe(true);
    }

    for (const id of [1029, 1030, 1031, 1032]) {
      const record = records.get(id)!;
      const recentInjury = record.questions.find((question) =>
        /head injury.*3 months/i.test(question.Question),
      );
      expect(recentInjury?.DispositionLevel).toBe(70);
    }
  });
});
