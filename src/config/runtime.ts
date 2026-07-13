import { loadLocalEnv } from "./env.js";

loadLocalEnv();

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
  { name: "QHIE consent endpoint", anyOf: ["QHIE_BASE_URL", "QHIE_FHIR_BASE_URL"] },
  { name: "QHIE consent access token", anyOf: ["QHIE_ACCESS_TOKEN"] },
  { name: "FHIR writeback access token", anyOf: ["FHIR_ACCESS_TOKEN", "CERNER_FHIR_ACCESS_TOKEN", "EPIC_FHIR_ACCESS_TOKEN"] },
  { name: "FHIR practitioner mapping", anyOf: ["FHIR_PRACTITIONER_ID"] },
  { name: "FHIR patient identity mapping", anyOf: ["FHIR_TEST_PATIENT_QID", "FHIR_TEST_PATIENT_ID"] },
  { name: "JWT signing secret", anyOf: ["AUTH_JWT_SECRET"] },
  { name: "Local admin bootstrap password", anyOf: ["ADMIN_PASSWORD"] },
  { name: "Twilio account SID", anyOf: ["TWILIO_ACCOUNT_SID"] },
  { name: "Twilio auth token", anyOf: ["TWILIO_AUTH_TOKEN"] }
];

const MOCK_LOCAL_ADMIN_PASSWORD = "LocalMockAdmin!2026";

type RuntimeEnvironmentTone = "simulation" | "demo" | "uat" | "production";

export type PublicRuntimeEnvironment = {
  environment: RuntimeEnvironmentTone;
  dataProfile: string;
  banner: {
    visible: boolean;
    label: string;
    description: string;
    tone: RuntimeEnvironmentTone;
  };
};

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

function insecureLiveCredentialFindings(): string[] {
  const findings: string[] = [];
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (adminPassword === MOCK_LOCAL_ADMIN_PASSWORD) {
    findings.push("ADMIN_PASSWORD must not use the mock local fallback value when MOCK_MODE=false.");
  }
  return findings;
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

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD ?? (isMockMode() ? MOCK_LOCAL_ADMIN_PASSWORD : "");
}

function runtimeEnvironment(): RuntimeEnvironmentTone {
  const configured = process.env.APP_ENVIRONMENT?.trim().toLowerCase();
  if (configured === "demo" || configured === "uat" || configured === "production" || configured === "simulation") {
    return configured;
  }
  return isMockMode() ? "simulation" : "demo";
}

export function publicRuntimeEnvironment(): PublicRuntimeEnvironment {
  const environment = runtimeEnvironment();
  const defaults: Record<RuntimeEnvironmentTone, Omit<PublicRuntimeEnvironment["banner"], "tone"> & { dataProfile: string }> = {
    simulation: {
      visible: true,
      label: "SIMULATION",
      description: "Synthetic records only. No PHI. Use for workflow rehearsal, AI evaluation, and governed model testing.",
      dataProfile: "synthetic"
    },
    demo: {
      visible: true,
      label: "DEMO",
      description: "Curated demonstration environment. Use for customer walkthroughs, not live clinical service.",
      dataProfile: "curated-demo"
    },
    uat: {
      visible: true,
      label: "UAT",
      description: "User acceptance testing environment. Validate workflows before production approval.",
      dataProfile: "uat"
    },
    production: {
      visible: false,
      label: "PRODUCTION",
      description: "Production clinical environment.",
      dataProfile: "live"
    }
  };
  const selected = defaults[environment];

  return {
    environment,
    dataProfile: process.env.APP_DATA_PROFILE?.trim() || selected.dataProfile,
    banner: {
      visible: envFlag("APP_ENVIRONMENT_BANNER_VISIBLE", selected.visible),
      label: process.env.APP_ENVIRONMENT_LABEL?.trim() || selected.label,
      description: process.env.APP_ENVIRONMENT_DESCRIPTION?.trim() || selected.description,
      tone: environment
    }
  };
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

  const insecureCredentials = insecureLiveCredentialFindings();
  if (insecureCredentials.length > 0) {
    throw new Error(
      [
        "MOCK_MODE=false rejected insecure authentication configuration.",
        ...insecureCredentials.map((finding) => `- ${finding}`)
      ].join("\n")
    );
  }
}

export function runtimeModeSummary() {
  const environment = publicRuntimeEnvironment();
  return {
    environment: environment.environment,
    dataProfile: environment.dataProfile,
    mockMode: isMockMode(),
    persistenceMode: shouldUseDatabasePersistence() ? "postgresql" : "mock-in-memory",
    allowedCorsOrigins: getAllowedCorsOrigins(),
    adminPasswordSource: process.env.ADMIN_PASSWORD ? "environment" : "mock-local-fallback"
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
