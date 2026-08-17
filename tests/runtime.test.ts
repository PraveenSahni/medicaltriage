import { assertRuntimeConfiguration, getAdminPassword, publicRuntimeEnvironment } from "../src/config/runtime.js";

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

  it("disables the mock password fallback in production even when mock mode is enabled", () => {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ALLOW_DEMO_CREDENTIALS;
    process.env.MOCK_MODE = "true";
    process.env.NODE_ENV = "production";

    expect(getAdminPassword()).toBe("");
  });

  it("requires an explicit escape hatch to enable demo credentials in production", () => {
    delete process.env.ADMIN_PASSWORD;
    process.env.MOCK_MODE = "true";
    process.env.NODE_ENV = "production";
    process.env.ALLOW_DEMO_CREDENTIALS = "true";

    expect(getAdminPassword()).toBe("LocalMockAdmin!2026");
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

  it("marks mock-mode environments as synthetic simulation by default", () => {
    process.env = {
      ...originalEnv,
      MOCK_MODE: "true"
    };
    delete process.env.APP_ENVIRONMENT;

    expect(publicRuntimeEnvironment()).toMatchObject({
      environment: "simulation",
      dataProfile: "synthetic",
      banner: {
        visible: true,
        label: "SIMULATION",
        tone: "simulation"
      }
    });
  });

  it("allows a separate demo runtime label for customer walkthroughs", () => {
    process.env = {
      ...originalEnv,
      APP_ENVIRONMENT: "demo",
      APP_DATA_PROFILE: "curated-demo"
    };

    expect(publicRuntimeEnvironment()).toMatchObject({
      environment: "demo",
      dataProfile: "curated-demo",
      banner: {
        visible: true,
        label: "DEMO",
        tone: "demo"
      }
    });
  });
});
