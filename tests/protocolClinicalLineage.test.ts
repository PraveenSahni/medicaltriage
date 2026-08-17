import express from "express";
import request from "supertest";
import { stccLicensedContent } from "../src/data/stccLicensedContent/index.js";
import { createProtocolsRouter } from "../src/routes/protocols.js";
import { ClinicalContentPackageSchema } from "../src/types/clinicalContent.js";
import {
  deriveProtocolSafetyFloorFromPackage,
  getCareAdviceForProtocolFromPackage,
  getCurrentClinicalContentPackage
} from "../src/services/clinicalContent.js";

describe("PR-006 exact protocol clinical lineage", () => {
  const clinicalPackage = getCurrentClinicalContentPackage();
  const fiveProtocolPackage = ClinicalContentPackageSchema.parse(stccLicensedContent);
  const thirtyCaseMatrix = Array.from({
    length: Math.max(...fiveProtocolPackage.protocols.map((protocol) => protocol.questions.length))
  })
    .flatMap((_, questionIndex) =>
      fiveProtocolPackage.protocols.flatMap((protocol) => {
        const question = protocol.questions[questionIndex];
        return question ? [{ protocol, question }] : [];
      })
    )
    .slice(0, 30);

  test("the named validation matrix contains 30 cases across exactly five licensed protocols", () => {
    expect(fiveProtocolPackage.protocols).toHaveLength(5);
    expect(thirtyCaseMatrix).toHaveLength(30);
    expect(new Set(thirtyCaseMatrix.map(({ protocol }) => protocol.id)).size).toBe(5);
  });

  test.each(thirtyCaseMatrix)(
    "five-protocol validation: $protocol.id / $question.id",
    ({ protocol, question }) => {
      const actualAdvice = getCareAdviceForProtocolFromPackage(fiveProtocolPackage, protocol.id, [question.id]);
      const expectedAdviceIds = protocol.careAdvice
        .filter((advice) => question.careAdviceIds.includes(advice.id))
        .map((advice) => advice.id);
      const floor = deriveProtocolSafetyFloorFromPackage(fiveProtocolPackage, protocol.id, [question.id]);

      expect(actualAdvice.map((advice) => advice.id)).toEqual(expectedAdviceIds);
      expect(actualAdvice.every((advice) => protocol.careAdvice.some((candidate) => candidate.id === advice.id))).toBe(
        true
      );
      expect(floor).toMatchObject({
        severity: question.severity,
        dispositionCode: question.dispositionCode
      });
    }
  );

  test.each([1, 2, 3])("exhaustive question/advice/disposition matrix pass %i", () => {
    for (const protocol of fiveProtocolPackage.protocols) {
      const adviceById = new Map(protocol.careAdvice.map((advice) => [advice.id, advice]));
      for (const question of protocol.questions) {
        const actual = getCareAdviceForProtocolFromPackage(fiveProtocolPackage, protocol.id, [question.id]);
        const expectedIds = protocol.careAdvice
          .filter((advice) => question.careAdviceIds.includes(advice.id))
          .map((advice) => advice.id);

        expect(actual.map((advice) => advice.id)).toEqual(expectedIds);
        expect(actual.every((advice) => adviceById.has(advice.id))).toBe(true);

        const floor = deriveProtocolSafetyFloorFromPackage(fiveProtocolPackage, protocol.id, [question.id]);
        expect(floor.severity).toBe(question.severity);
        expect(floor.dispositionCode).toBe(question.dispositionCode);
      }
    }
  });

  test("does not include sibling advice merely because disposition codes match", () => {
    for (const protocol of fiveProtocolPackage.protocols) {
      for (const question of protocol.questions) {
        const approvedIds = new Set(question.careAdviceIds);
        const sameDispositionSibling = protocol.careAdvice.find(
          (advice) => advice.dispositionCode === question.dispositionCode && !approvedIds.has(advice.id)
        );
        if (sameDispositionSibling) {
          expect(
            getCareAdviceForProtocolFromPackage(fiveProtocolPackage, protocol.id, [question.id]).map(
              (advice) => advice.id
            )
          ).not.toContain(sameDispositionSibling.id);
        }
      }
    }
  });

  test("unknown and cross-protocol question identifiers return no advice", () => {
    const [first, second] = fiveProtocolPackage.protocols;
    expect(getCareAdviceForProtocolFromPackage(fiveProtocolPackage, first.id, ["not-a-real-question"])).toEqual([]);
    if (second?.questions[0]) {
      expect(getCareAdviceForProtocolFromPackage(fiveProtocolPackage, first.id, [second.questions[0].id])).toEqual([]);
    }
  });

  test("care-advice API fails closed without exact question lineage", async () => {
    const protocol = clinicalPackage.protocols.find((candidate) => candidate.questions.length > 0)!;
    const app = express().use("/api/v1/protocols", createProtocolsRouter());

    await request(app)
      .get(`/api/v1/protocols/${protocol.id}/care-advice`)
      .query({ dispositionCode: protocol.questions[0].dispositionCode })
      .expect(422)
      .expect(({ body }) => expect(body.code).toBe("CARE_ADVICE_QUESTION_REQUIRED"));

    await request(app)
      .get(`/api/v1/protocols/${protocol.id}/care-advice`)
      .query({ positiveQuestionIds: "not-a-real-question" })
      .expect(422)
      .expect(({ body }) => expect(body.code).toBe("CARE_ADVICE_PROTOCOL_MISMATCH"));
  });

  test("care-advice API reports exact-question provenance", async () => {
    const protocol = clinicalPackage.protocols.find((candidate) => candidate.questions.length > 0)!;
    const question = protocol.questions[0];
    const app = express().use("/api/v1/protocols", createProtocolsRouter());

    const response = await request(app)
      .get(`/api/v1/protocols/${protocol.id}/care-advice`)
      .query({ positiveQuestionIds: question.id })
      .expect(200);

    expect(response.body).toMatchObject({
      protocolId: protocol.id,
      questionIds: [question.id],
      selectionMode: "EXACT_QUESTION"
    });
    expect(response.body.careAdvice.map((advice: { id: string }) => advice.id)).toEqual(
      protocol.careAdvice.filter((advice) => question.careAdviceIds.includes(advice.id)).map((advice) => advice.id)
    );
  });
});
