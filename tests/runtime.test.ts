import { assertRuntimeConfiguration, getAdminPassword } from "../src/config/runtime.js";

const REQUIRED_LIVE_ENV = {
  DATABASE_URL: "postgresql://triage_user:triage_password@localhost:5432/ist_triage?schema=public",
  ORACLE_HCM_BASE_URL: "https://example.fa.oraclecloud.com",
  EMR_BASE_URL: "https://example-emr.local",
  QHIE_BASE_URL: "https://example-qhie.local/fhir",
  QHIE_ACCESS_TOKEN: "test-qhie-access-token",
  FHIR_ACCESS_TOKEN: "test-fhir-access-token",
  FHIR_PRACTITIONER_ID: "Practitioner/test-triage-nurse",
  FHIR_TEST_PATIENT_QID: "28163400000",
  AUTH_JWT_SECRET: "test-jwt-secret-with-enough-length",
  TWILIO_ACCOUNT_SID: "test-account-sid",
  TWILIO_AUTH_TOKEN: "test-auth-token"
};

describe("runtime credential guardrails", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses a mock-only local password fallback in mock mode", () => {
    delete process.env.ADMIN_PASSWORD;
    process.env.MOCK_MODE = "true";

    expect(getAdminPassword()).toBe("LocalMockAdmin!2026");
    expect(() => assertRuntimeConfiguration()).not.toThrow();
  });

  it("rejects live mode when the admin password is missing", () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED_LIVE_ENV,
      MOCK_MODE: "false"
    };
    delete process.env.ADMIN_PASSWORD;

    expect(() => assertRuntimeConfiguration()).toThrow(/ADMIN_PASSWORD/);
  });

  it("rejects live mode when the mock local fallback is reused", () => {
    process.env = {
      ...originalEnv,
      ...REQUIRED_LIVE_ENV,
      MOCK_MODE: "false",
      ADMIN_PASSWORD: "LocalMockAdmin!2026"
    };

    expect(() => assertRuntimeConfiguration()).toThrow(/mock local fallback/);
  });
});
