import request from "supertest";
import { createApp } from "../src/app.js";

// Integration-style check (NFR-078/NFR-004 AI-tab): exercises a real request
// through the real app and captures what actually gets written to
// console.log/console.error, rather than only unit-testing the sanitizer in
// isolation. A synthetic marker value stands in for real PII - never real
// PII/PHI in this test, per the batch's explicit instruction.
describe("logging surfaces do not expose synthetic PII markers", () => {
  const app = createApp();
  const PII_MARKER = "PII_TEST_EMAIL_should_never_appear_in_logs@example.com";

  test("a query-string value never appears in emitted request logs", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    try {
      await request(app).get(`/healthz?debugMarker=${encodeURIComponent(PII_MARKER)}`);
      const emitted = logSpy.mock.calls.map((call) => call.join(" ")).join("\n");
      expect(emitted).not.toContain(PII_MARKER);
    } finally {
      logSpy.mockRestore();
    }
  });

  test("an unauthenticated login attempt does not log the submitted password", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const MARKER_PASSWORD = "PII_TEST_PASSWORD_should_never_appear_in_logs";
    try {
      await request(app).post("/api/v1/auth/login").send({
        username: "nonexistent-user@example.com",
        password: MARKER_PASSWORD,
        tenant: "ist-tech",
        language: "en",
        rememberMe: false
      });
      const emitted = [...logSpy.mock.calls, ...errorSpy.mock.calls].map((call) => call.join(" ")).join("\n");
      expect(emitted).not.toContain(MARKER_PASSWORD);
    } finally {
      logSpy.mockRestore();
      errorSpy.mockRestore();
    }
  });
});
