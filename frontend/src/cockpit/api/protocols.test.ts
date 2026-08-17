import type { ProtocolDetail } from "./protocols";
import { exactQuestionCareAdvice, resolveClinicalProtocolId } from "../clinicalLineage";

const protocol: ProtocolDetail["protocol"] = {
  id: "protocol-a",
  initialAssessmentQuestions: [],
  questions: [
    {
      id: "question-exact",
      acuityOrder: 1,
      severity: "Urgent",
      questionTextEn: "Exact question",
      dispositionCode: "HMC_URGENT_REVIEW",
      careAdviceIds: ["advice-exact"]
    }
  ],
  careAdvice: [
    { id: "advice-exact", titleEn: "Exact", instructionTextEn: "Exact advice", dispositionCode: "HMC_URGENT_REVIEW" },
    { id: "advice-sibling", titleEn: "Sibling", instructionTextEn: "Wrong advice", dispositionCode: "HMC_URGENT_REVIEW" }
  ]
};

describe("PR-006 cockpit protocol lineage", () => {
  test("nurse-selected protocol is canonical across clinical stages", () => {
    expect(
      resolveClinicalProtocolId({ matchedProtocolId: "protocol-selected", preparedProtocol: { primaryProtocolId: "protocol-auto" } })
    ).toBe("protocol-selected");
    expect(resolveClinicalProtocolId({ preparedProtocol: { primaryProtocolId: "protocol-auto" } })).toBe("protocol-auto");
  });

  test.each([undefined, "unknown-question"])("fails closed for missing question lineage: %s", (questionId) => {
    expect(exactQuestionCareAdvice(protocol, questionId)).toEqual([]);
  });

  test("returns only advice linked by the exact terminal question", () => {
    expect(exactQuestionCareAdvice(protocol, "question-exact").map((advice) => advice.id)).toEqual(["advice-exact"]);
  });
});
