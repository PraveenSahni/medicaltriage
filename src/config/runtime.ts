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
  const dependencies = [...REQUIRED_LIVE_DEPENDENCIES];
  if (envFlag("CALL_CENTER_GATEWAY_ENABLED", false)) {
    dependencies.push(
      { name: "Call-center gateway provider", anyOf: ["CALL_CENTER_PROVIDER"] },
      { name: "Call-center gateway signing secret", anyOf: ["CALL_CENTER_GATEWAY_SECRET"] },
      { name: "Call-center target organization", anyOf: ["CALL_CENTER_DEFAULT_ORGANIZATION_ID"] }
    );
  }
  return dependencies.filter((dependency) =>
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

// Queue persistence is opt-in independently of MOCK_MODE: flipping MOCK_MODE
// off also disables demo-password auth and other mocked integrations
// (callCenterGateway, voiceAssessment, fhirWriteback), so the queue store
// gets its own explicit flag instead of reusing shouldUseDatabasePersistence().
export function shouldPersistQueueInDatabase(): boolean {
  return envFlag("QUEUE_DB_PERSISTENCE", false);
}

// Session persistence is opt-in independently of MOCK_MODE for the same
// reason as the queue store above. Without this, a mock-mode deployment
// (e.g. the demo/UAT Cloud Run service) only ever keeps sessions in the
// handling instance's in-memory Map (securityAdmin.ts's `sessions`), which
// is invisible to every other instance of the same service. Cloud Run
// routinely runs more than one instance, so any request that lands on a
// different instance than the one that processed login sees no session at
// all - even with a perfectly valid, unexpired cookie. Confirmed live: this
// is exactly why /help (a plain top-level navigation, its own new request)
// intermittently reported "Sign in required" right after a successful login
// on the demo environment.
export function shouldPersistSessionsInDatabase(): boolean {
  return envFlag("SESSION_DB_PERSISTENCE", false);
}

// MFA credentials need the same independent-of-MOCK_MODE treatment as
// sessions above, for the same reason: without it, enrollment recorded on
// one Cloud Run instance is invisible to any other instance/revision.
// Found during AR.13 production-activation validation - MOCK_MODE=true on
// soc2 was silently making shouldUseDatabasePersistence() (and therefore
// persistMfaCredential()/getPersistedMfaCredential()) a no-op.
export function shouldPersistMfaCredentialsInDatabase(): boolean {
  return envFlag("MFA_DB_PERSISTENCE", false);
}

// Security AuditEvent rows need the same independent-of-MOCK_MODE
// treatment as sessions and MFA credentials above - found as a Priority-0
// audit-integrity defect during AR.13's canary validation: MOCK_MODE=true
// on soc2 silently made every AuditEvent best-effort-persist as a no-op,
// so the durable security audit trail this whole engagement has cited as
// evidence (login, MFA, PAM elevation, access denial, legal hold, exports)
// only ever existed in one Cloud Run instance's memory, lost on restart/
// scale-down and invisible to every other instance. Default off (matches
// SESSION_DB_PERSISTENCE/MFA_DB_PERSISTENCE precedent) - unit tests stay
// isolated unless a test explicitly opts in.
export function shouldPersistAuditEventsInDatabase(): boolean {
  return envFlag("AUDIT_EVENT_DB_PERSISTENCE", false);
}

// Found in the follow-up persistence-gating sweep: role-permission grant/
// revoke had no cross-instance read-fallback at all (worse than MFA's
// original gap - a grant/revoke on one Cloud Run instance was never even
// best-effort visible to another) - a real authorization-bypass risk, not
// just a compliance-evidence gap.
export function shouldPersistRolePermissionOverridesInDatabase(): boolean {
  return envFlag("ROLE_PERMISSION_DB_PERSISTENCE", false);
}

// Same sweep: a privileged PII reveal request created on one instance was
// invisible to an approver whose request landed on a different instance -
// a functional failure in a workflow that is inherently two separate HTTP
// requests (requester, then approver), not just a durability nicety.
export function shouldPersistRevealWorkflowInDatabase(): boolean {
  return envFlag("REVEAL_WORKFLOW_DB_PERSISTENCE", false);
}

// Closes IS.61's multi-instance requirement: the reveal-anomaly counter
// was found to be process-local (in-memory only) during the persistence-
// gating sweep - a requester could distribute reveal requests across
// Cloud Run instances to stay under each instance's local threshold. This
// flag switches the counter to a shared, durable, cross-instance store.
// Default off, matching every other dedicated persistence flag added this
// engagement - unit tests stay isolated unless they opt in.
export function shouldPersistRevealAnomalyCountersInDatabase(): boolean {
  return envFlag("REVEAL_ANOMALY_DB_PERSISTENCE", false);
}

// Threshold/window are explicit, validated configuration rather than
// hardcoded - defaults match the prior in-memory implementation's values
// (5 minutes / 10 requests), an engineering-judgment starting point, NOT
// a Qatar-Airways-confirmed figure. Owner: CISO/Privacy Officer; review
// alongside the annual risk-register cadence, or immediately if QR
// specifies a different threshold - see docs/security/reveal-anomaly-detection.md.
export function getRevealAnomalyWindowSeconds(): number {
  const raw = process.env.REVEAL_ANOMALY_WINDOW_SECONDS;
  const parsed = raw ? Number(raw) : NaN;
  if (raw && (!Number.isFinite(parsed) || parsed <= 0)) {
    throw new Error(`REVEAL_ANOMALY_WINDOW_SECONDS must be a positive number, got: ${raw}`);
  }
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

export function getRevealAnomalyThreshold(): number {
  const raw = process.env.REVEAL_ANOMALY_THRESHOLD;
  const parsed = raw ? Number(raw) : NaN;
  if (raw && (!Number.isInteger(parsed) || parsed <= 0)) {
    throw new Error(`REVEAL_ANOMALY_THRESHOLD must be a positive integer, got: ${raw}`);
  }
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 10;
}

// Closes Cloud CSQ AR.13's literal ask ("MFA required for all remote user
// access") for real when an operator actually wants org-wide enforcement,
// without changing today's default (opt-in per user) behavior. Off by
// default - flipping this on is a deployment/rollout decision, not
// something this codebase should assume.
export function isMfaMandatory(): boolean {
  return envFlag("MFA_MANDATORY", false);
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
    callCenterGateway: {
      enabled: envFlag("CALL_CENTER_GATEWAY_ENABLED", isMockMode()),
      provider: process.env.CALL_CENTER_PROVIDER ?? (isMockMode() ? "dry-run" : "not-configured")
    },
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
