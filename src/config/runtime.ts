type RequiredLiveDependency = {
  name: string;
  anyOf: string[];
};

const DEFAULT_ALLOWED_ORIGINS = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:5174",
  "http://localhost:5174"
];

const REQUIRED_LIVE_DEPENDENCIES: RequiredLiveDependency[] = [
  { name: "PostgreSQL / Cloud SQL", anyOf: ["DATABASE_URL"] },
  { name: "Oracle Fusion HCM", anyOf: ["ORACLE_HCM_BASE_URL"] },
  { name: "EMR / FHIR endpoint", anyOf: ["EMR_BASE_URL", "FHIR_BASE_URL", "ORACLE_HEALTH_BASE_URL"] },
  { name: "JWT signing secret", anyOf: ["AUTH_JWT_SECRET"] },
  { name: "Twilio account SID", anyOf: ["TWILIO_ACCOUNT_SID"] },
  { name: "Twilio auth token", anyOf: ["TWILIO_AUTH_TOKEN"] }
];

function envFlag(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function splitOrigins(value?: string): string[] {
  if (!value) {
    return DEFAULT_ALLOWED_ORIGINS;
  }
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function missingLiveDependencies(): string[] {
  return REQUIRED_LIVE_DEPENDENCIES.filter((dependency) =>
    dependency.anyOf.every((envName) => !process.env[envName])
  ).map((dependency) => `${dependency.name} (${dependency.anyOf.join(" or ")})`);
}

export function isMockMode(): boolean {
  return envFlag("MOCK_MODE", true);
}

export function getAllowedCorsOrigins(): string[] {
  return splitOrigins(process.env.CORS_ALLOWED_ORIGINS);
}

export function shouldUseDatabasePersistence(): boolean {
  return !isMockMode();
}

export function assertRuntimeConfiguration(): void {
  if (isMockMode()) {
    return;
  }

  const missing = missingLiveDependencies();
  if (missing.length > 0) {
    throw new Error(
      [
        "MOCK_MODE=false requires live integration configuration before the API can start.",
        "Missing dependencies:",
        ...missing.map((dependency) => `- ${dependency}`)
      ].join("\n")
    );
  }
}

export function runtimeModeSummary() {
  return {
    mockMode: isMockMode(),
    persistenceMode: shouldUseDatabasePersistence() ? "postgresql" : "mock-in-memory",
    allowedCorsOrigins: getAllowedCorsOrigins()
  };
}

export function withMockFlag<T extends Record<string, unknown>>(payload: T): T & { is_mock?: true } {
  if (!isMockMode()) {
    return payload;
  }
  return {
    ...payload,
    is_mock: true
  };
}
