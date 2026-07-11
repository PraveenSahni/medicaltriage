import {
  auditSignatureFor,
  HITL_FORBIDDEN_PAYLOAD,
  isSignedHumanApprovalTrace,
  SafetyKernelError,
  SafetyKernelTraceVerificationError
} from "../src/services/safetyKernel.js";

describe("non-bypassable safety kernel", () => {
  const originalHmacSecret = process.env.AUDIT_HMAC_SECRET;

  beforeEach(() => {
    process.env.AUDIT_HMAC_SECRET = "unit-test-hitl-secret";
  });

  afterEach(() => {
    if (originalHmacSecret === undefined) {
      delete process.env.AUDIT_HMAC_SECRET;
    } else {
      process.env.AUDIT_HMAC_SECRET = originalHmacSecret;
    }
  });

  it("accepts only clinician approvals with a recomputed HMAC signature", () => {
    const approvalTrace = {
      eventType: "HITL_CLINICAL_APPROVAL",
      activeReviewConfirmed: true,
      featureLevelReasoningReviewed: true,
      reviewedReasoningFeatureIds: ["rules-floor", "symptom-red-flag"],
      encounterId: "enc-100",
      finalDispositionCode: "HMC_EMERGENCY_DEPARTMENT"
    };
    const signedApprovalTrace = {
      ...approvalTrace,
      auditSignature: auditSignatureFor(approvalTrace)
    };

    expect(isSignedHumanApprovalTrace([signedApprovalTrace])).toBe(true);
  });

  it("does not accept unsigned or blind-review clinical approvals", () => {
    expect(
      isSignedHumanApprovalTrace([
        {
          eventType: "HITL_CLINICAL_APPROVAL",
          activeReviewConfirmed: true,
          featureLevelReasoningReviewed: false,
          reviewedReasoningFeatureIds: ["rules-floor", "symptom-red-flag"],
          auditSignature: auditSignatureFor({
            eventType: "HITL_CLINICAL_APPROVAL",
            activeReviewConfirmed: true,
            featureLevelReasoningReviewed: false,
            reviewedReasoningFeatureIds: ["rules-floor", "symptom-red-flag"]
          })
        }
      ])
    ).toBe(false);
  });

  it("throws a safety exception for forged approval signatures", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const approvalTrace = {
      eventType: "HITL_CLINICAL_APPROVAL",
      activeReviewConfirmed: true,
      featureLevelReasoningReviewed: true,
      reviewedReasoningFeatureIds: ["rules-floor", "symptom-red-flag"],
      encounterId: "enc-forged",
      finalDispositionCode: "HMC_EMERGENCY_DEPARTMENT",
      auditSignature: "a".repeat(64)
    };

    try {
      expect(() => isSignedHumanApprovalTrace([approvalTrace])).toThrow(SafetyKernelTraceVerificationError);
      expect(errorSpy).toHaveBeenCalledWith("HITL audit signature verification failed", {
        eventType: "HITL_CLINICAL_APPROVAL",
        encounterId: "enc-forged"
      });
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("uses the required 403 payload for blocked external transactions", () => {
    const error = new SafetyKernelError("enc-100", "EMR_WRITEBACK");
    expect(error.status).toBe(403);
    expect(error.payload).toEqual(HITL_FORBIDDEN_PAYLOAD);
  });
});
