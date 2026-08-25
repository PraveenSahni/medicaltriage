import { buildMfaResetRequest } from "./mfaResetRequest";

describe("MFA reset request", () => {
  it("sends the governed reason required by the backend contract", () => {
    expect(buildMfaResetRequest("  Lost authenticator device  ")).toEqual({
      reason: "Lost authenticator device"
    });
  });
});
