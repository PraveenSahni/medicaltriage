import {
  assertRuntimeConfiguration,
  getAdminPassword,
  persistenceConfigurationSummary,
  publicRuntimeEnvironment
} from "../src/config/runtime.js";

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

  it("rejects a production runtime when any dedicated persistence control is missing", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      MOCK_MODE: "true",
      DATABASE_URL: REQUIRED_LIVE_ENV.DATABASE_URL,
      QUEUE_DB_PERSISTENCE: "true",
      SESSION_DB_PERSISTENCE: "true"
    };

    expect(() => assertRuntimeConfiguration()).toThrow(/MFA_DB_PERSISTENCE=true/);
  });

  it("accepts mock-mode production only when every dedicated persistence control is enabled", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      MOCK_MODE: "true",
      DATABASE_URL: REQUIRED_LIVE_ENV.DATABASE_URL,
      QUEUE_DB_PERSISTENCE: "true",
      SESSION_DB_PERSISTENCE: "true",
      MFA_DB_PERSISTENCE: "true",
      AUDIT_EVENT_DB_PERSISTENCE: "true",
      ROLE_PERMISSION_DB_PERSISTENCE: "true",
      REVEAL_WORKFLOW_DB_PERSISTENCE: "true",
      REVEAL_ANOMALY_DB_PERSISTENCE: "true",
      SECURITY_ANOMALY_DB_PERSISTENCE: "true"
    };

    expect(() => assertRuntimeConfiguration()).not.toThrow();
    expect(Object.values(persistenceConfigurationSummary()).every(Boolean)).toBe(true);
    expect(Object.values(publicRuntimeEnvironment().persistence).every(Boolean)).toBe(true);
  });

  it("rejects a whitespace-only production database URL", () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: "production",
      MOCK_MODE: "true",
      DATABASE_URL: "   ",
      QUEUE_DB_PERSISTENCE: "true",
      SESSION_DB_PERSISTENCE: "true",
      MFA_DB_PERSISTENCE: "true",
      AUDIT_EVENT_DB_PERSISTENCE: "true",
      ROLE_PERMISSION_DB_PERSISTENCE: "true",
      REVEAL_WORKFLOW_DB_PERSISTENCE: "true",
      REVEAL_ANOMALY_DB_PERSISTENCE: "true",
      SECURITY_ANOMALY_DB_PERSISTENCE: "true"
    };

    expect(() => assertRuntimeConfiguration()).toThrow(/DATABASE_URL/);
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
      },
      provenance: {
        gitSha: "unknown",
        buildId: "unknown",
        cloudRunRevision: "local"
      }
    });
  });

  it("exposes non-secret deployment provenance from the image and Cloud Run runtime", () => {
    process.env.APP_GIT_SHA = "c3f36a512345678901234567890123456789abcd";
    process.env.APP_BUILD_ID = "build-123";
    process.env.K_REVISION = "ist-triage-demo-00034-test";

    expect(publicRuntimeEnvironment().provenance).toEqual({
      gitSha: "c3f36a512345678901234567890123456789abcd",
      buildId: "build-123",
      cloudRunRevision: "ist-triage-demo-00034-test"
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
