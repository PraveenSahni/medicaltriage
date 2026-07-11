import { HITL_FORBIDDEN_PAYLOAD, isSignedHumanApprovalTrace, SafetyKernelError } from "../src/services/safetyKernel.js";

describe("non-bypassable safety kernel", () => {
  it("accepts only signed clinician approvals with feature-level reasoning review", () => {
    expect(
      isSignedHumanApprovalTrace([
        {
          eventType: "HITL_CLINICAL_APPROVAL",
          activeReviewConfirmed: true,
          featureLevelReasoningReviewed: true,
          reviewedReasoningFeatureIds: ["rules-floor", "symptom-red-flag"],
          auditSignature: "a".repeat(64)
        }
      ])
    ).toBe(true);

    expect(
      isSignedHumanApprovalTrace([
        {
          eventType: "HITL_CLINICAL_APPROVAL",
          activeReviewConfirmed: true,
          featureLevelReasoningReviewed: false,
          reviewedReasoningFeatureIds: ["rules-floor", "symptom-red-flag"],
          auditSignature: "a".repeat(64)
        }
      ])
    ).toBe(false);
  });

  it("uses the required 403 payload for blocked external transactions", () => {
    const error = new SafetyKernelError("enc-100", "EMR_WRITEBACK");
    expect(error.status).toBe(403);
    expect(error.payload).toEqual(HITL_FORBIDDEN_PAYLOAD);
  });
});
