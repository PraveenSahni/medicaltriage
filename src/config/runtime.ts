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
  provenance: {
    gitSha: string;
    buildId: string;
    cloudRunRevision: string;
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

/**
 * Seeded/shared demo credentials are a local simulation convenience, never a
 * safe production authentication mechanism. Cloud Run images set
 * NODE_ENV=production, so these credentials fail closed there unless an
 * operator deliberately enables the escape hatch for an isolated synthetic
 * environment.
 */
export function areDemoCredentialsEnabled(): boolean {
  return isMockMode() && envFlag("ALLOW_DEMO_CREDENTIALS", process.env.NODE_ENV !== "production");
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

// CSQ AR.21's application-level intrusion-detection equivalent / NFR-118's
// authentication-anomaly alert - mirrors the reveal-anomaly counter's
// exact shared/durable/multi-instance pattern above, generalized to any
// security-relevant signal type (login failure, MFA failure, PAM
// elevation denial, etc.) rather than a second bespoke table. Default off,
// same reasoning as REVEAL_ANOMALY_DB_PERSISTENCE - unit tests stay
// isolated unless they opt in.
export function shouldPersistSecurityAnomalyCountersInDatabase(): boolean {
  return envFlag("SECURITY_ANOMALY_DB_PERSISTENCE", false);
}

// Engineering-judgment defaults, NOT Qatar-Airways-confirmed figures -
// owner: CISO; review alongside the annual risk-register cadence, or
// immediately if QR specifies different thresholds. See
// docs/security/application-intrusion-detection.md.
export function getAuthAnomalyWindowSeconds(): number {
  const raw = process.env.AUTH_ANOMALY_WINDOW_SECONDS;
  const parsed = raw ? Number(raw) : NaN;
  if (raw && (!Number.isFinite(parsed) || parsed <= 0)) {
    throw new Error(`AUTH_ANOMALY_WINDOW_SECONDS must be a positive number, got: ${raw}`);
  }
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 300;
}

export function getAuthAnomalyFailureThreshold(): number {
  const raw = process.env.AUTH_ANOMALY_FAILURE_THRESHOLD;
  const parsed = raw ? Number(raw) : NaN;
  if (raw && (!Number.isInteger(parsed) || parsed <= 0)) {
    throw new Error(`AUTH_ANOMALY_FAILURE_THRESHOLD must be a positive integer, got: ${raw}`);
  }
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 10;
}

export function getPermissionDenialThreshold(): number {
  const raw = process.env.PERMISSION_DENIAL_THRESHOLD;
  const parsed = raw ? Number(raw) : NaN;
  if (raw && (!Number.isInteger(parsed) || parsed <= 0)) {
    throw new Error(`PERMISSION_DENIAL_THRESHOLD must be a positive integer, got: ${raw}`);
  }
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 10;
}

// Closes IS.61's second half - the privacy-incident notification workflow.
// Every value here is deliberately conservative-by-default: real customer
// delivery is off until explicitly enabled AND a real SLA/recipient are
// configured, matching this engagement's standing "never invent a
// contractual figure" principle (IG.09's retention decision follows the
// same pattern).

// Master switch for the notification-delivery step specifically (the
// incident/review/classification workflow itself always runs regardless -
// this only gates whether an approved notification can actually be sent).
export function isPrivacyNotificationEnabled(): boolean {
  return envFlag("PRIVACY_NOTIFICATION_ENABLED", false);
}

// Default true (safe) - even when notification is "enabled," a send only
// actually leaves this application when BOTH this is explicitly set to
// "false" AND a real, approved recipient is configured. Mirrors
// SLI_REPORT_DRY_RUN's exact precedent.
export function isPrivacyNotificationDryRun(): boolean {
  return envFlag("PRIVACY_NOTIFICATION_DRY_RUN", true);
}

// Not an engineering decision - null (not "approval-required" defaulted to
// a number) until a real SLA is configured. A missing SLA is a real,
// visible gap in the workflow (see docs/security/privacy-incident-notification-procedure.md),
// not silently assumed to be some default number of hours.
export function getPrivacyNotificationSlaHours(): number | null {
  const raw = process.env.PRIVACY_NOTIFICATION_SLA_HOURS;
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`PRIVACY_NOTIFICATION_SLA_HOURS must be a positive number, got: ${raw}`);
  }
  return parsed;
}

function splitRecipients(value?: string): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean);
}

// Internal (IST-side) recipients for incident-review/overdue alerts - a
// real, comma-separated list an operator configures; empty by default
// (no address invented or hardcoded).
export function getPrivacyNotificationInternalRecipients(): string[] {
  return splitRecipients(process.env.PRIVACY_NOTIFICATION_INTERNAL_RECIPIENTS);
}

// Real, QR-authorized customer-facing recipients - empty until Qatar
// Airways provides them (see docs/qr-compliance/qatar-airways-input-pack.md).
// Never hardcoded, never guessed.
export function getPrivacyNotificationCustomerRecipients(): string[] {
  return splitRecipients(process.env.PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS);
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
  return process.env.ADMIN_PASSWORD ?? (areDemoCredentialsEnabled() ? MOCK_LOCAL_ADMIN_PASSWORD : "");
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
    },
    provenance: {
      gitSha: process.env.APP_GIT_SHA?.trim() || "unknown",
      buildId: process.env.APP_BUILD_ID?.trim() || "unknown",
      cloudRunRevision: process.env.K_REVISION?.trim() || "local"
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
    adminPasswordSource: process.env.ADMIN_PASSWORD
      ? "environment"
      : areDemoCredentialsEnabled()
        ? "mock-local-fallback"
        : "disabled"
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
