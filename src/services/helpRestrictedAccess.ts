import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AuthenticatedSession } from "../types/security.js";

/**
 * Server-side-only secondary access control for the Help & Library's
 * "Restricted Operations Vault". This never handles or returns actual secret
 * values (API keys, DB passwords, tokens) - only approved operational
 * metadata about where real secrets live (see restrictedVaultEntries below).
 *
 * The secondary password is supplied via HELP_RESTRICTED_ACCESS_PASSWORD_HASH
 * (a scrypt hash, generated once via src/scripts/hashHelpRestrictedPassword.ts
 * and stored in the deployment's secret manager / protected env config) -
 * never the plaintext password itself. If unset, restricted access is
 * unconditionally denied (fail closed) rather than falling back to any
 * default value.
 */

const VAULT_TOKEN_TTL_SECONDS = 15 * 60;
const VAULT_COOKIE_NAME = "help_vault_token";

function sessionSecret(): string {
  const configured = process.env.HELP_RESTRICTED_SESSION_SECRET;
  if (!configured) {
    // Fail closed rather than silently using a guessable default - a token
    // signed with a fallback secret would be forgeable by anyone who reads
    // this source file.
    throw new Error("HELP_RESTRICTED_SESSION_SECRET is not configured.");
  }
  return configured;
}

function sign(data: string): string {
  return createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

function safeEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

/** Hashes a plaintext password as "salt:hashHex" - used only by the offline hashing script, never at request time with a plaintext value from a client. */
export function hashRestrictedAccessPassword(plaintext: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(plaintext, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyRestrictedAccessPassword(plaintext: string): boolean {
  const configuredHash = process.env.HELP_RESTRICTED_ACCESS_PASSWORD_HASH;
  if (!configuredHash) {
    return false;
  }
  const [salt, expectedHex] = configuredHash.split(":");
  if (!salt || !expectedHex) {
    return false;
  }
  const derived = scryptSync(plaintext, salt, 64).toString("hex");
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(derived, "hex");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

export function issueVaultAccessToken(session: AuthenticatedSession): { cookieName: string; token: string; maxAgeMs: number } {
  const exp = Math.floor(Date.now() / 1000) + VAULT_TOKEN_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ sid: session.sessionId, exp })).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  return { cookieName: VAULT_COOKIE_NAME, token, maxAgeMs: VAULT_TOKEN_TTL_SECONDS * 1000 };
}

export function verifyVaultAccessToken(cookieValue: string | undefined, session: AuthenticatedSession): boolean {
  if (!cookieValue) {
    return false;
  }
  const [payloadPart, signaturePart] = cookieValue.split(".");
  if (!payloadPart || !signaturePart) {
    return false;
  }
  if (!safeEquals(signaturePart, sign(payloadPart))) {
    return false;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as { sid?: string; exp?: number };
    if (decoded.sid !== session.sessionId) {
      return false;
    }
    return typeof decoded.exp === "number" && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export const VAULT_COOKIE_NAME_EXPORT = VAULT_COOKIE_NAME;

type VaultAuditEvent = {
  action: "verify_attempt" | "vault_view";
  userId: string;
  role: string;
  organizationId?: string;
  sessionId: string;
  granted: boolean;
  reason?: string;
};

/**
 * Structured audit log line for restricted Help access. This project's
 * database schema is explicitly out of scope for this feature (no new
 * Prisma model/migration), so this is a deliberate, disclosed limitation:
 * audit events are captured as structured log lines (consistent with the
 * app's existing morgan/console logging) rather than persisted to a queryable
 * audit table. Never logs the submitted password or the stored hash.
 */
export function auditVaultAccess(event: VaultAuditEvent): void {
  console.log(
    JSON.stringify({
      auditType: "help-restricted-vault",
      timestamp: new Date().toISOString(),
      ...event
    })
  );
}

/**
 * Verifies the submitted password against the configured hash. Does not log
 * or return the submitted plaintext value under any circumstance.
 */
export function checkRestrictedAccessPassword(plaintext: string): boolean {
  return verifyRestrictedAccessPassword(plaintext);
}

/**
 * Approved operational metadata only - no credential type here ever carries
 * a real secret value. This is safe to keep in source because it describes
 * *where* a secret is managed, never the secret itself.
 */
export const restrictedVaultEntries = [
  {
    system: "Cloud SQL Postgres (ist-triage-postgres-uat)",
    credentialType: "Database user password",
    owner: "Platform Engineering",
    storageLocation: "GCP Secret Manager / Cloud Run environment configuration",
    environment: "UAT / Demo",
    rotationFrequency: "On-demand, and whenever an operator with direct DB access changes",
    accessRequestProcess: "Request via Platform Engineering; approval required before any reset.",
    revocationProcedure: "Rotate the Cloud SQL user password via `gcloud sql users set-password`; update the secret manager reference; redeploy dependent Cloud Run services."
  },
  {
    system: "Oracle Fusion HRMS Connector",
    credentialType: "OAuth2 client secret",
    owner: "Integration Administrator",
    storageLocation: "GCP Secret Manager (referenced by ORACLE_HCM_*_SECRET_NAME env vars)",
    environment: "Not yet connected to a live tenant (mock/synthetic mode only)",
    rotationFrequency: "Per source-system policy once a live tenant is connected",
    accessRequestProcess: "Raise a request to Integration Administrator with business justification.",
    revocationProcedure: "Revoke in Oracle Fusion IDCS console; rotate the Secret Manager entry; restart affected services."
  },
  {
    system: "Twilio WhatsApp/SMS Adapter",
    credentialType: "Account SID / Auth Token",
    owner: "CCP Integration Owner",
    storageLocation: "GCP Secret Manager (TWILIO_* env vars)",
    environment: "Dry-run only - CCP_TRANSPORT_MODE=dry-run",
    rotationFrequency: "Per Twilio account security policy once live",
    accessRequestProcess: "Request via CCP Integration Owner.",
    revocationProcedure: "Rotate Auth Token in Twilio console; update Secret Manager; restart CCP-dependent services."
  },
  {
    system: "Microsoft 365 Graph Email Adapter",
    credentialType: "Client secret",
    owner: "CCP Integration Owner",
    storageLocation: "GCP Secret Manager (MS_GRAPH_* env vars)",
    environment: "Not yet connected (dry-run mode only)",
    rotationFrequency: "Per Entra ID app registration policy",
    accessRequestProcess: "Request via CCP Integration Owner.",
    revocationProcedure: "Rotate in Entra ID app registration; update Secret Manager reference."
  },
  {
    system: "Help & Library Restricted Vault",
    credentialType: "Secondary access password (this feature's own gate)",
    owner: "Security Administrator",
    storageLocation: "GCP Secret Manager (HELP_RESTRICTED_ACCESS_PASSWORD_HASH - stores a scrypt hash only, never plaintext)",
    environment: "All environments",
    rotationFrequency: "Every 90 days, or immediately after any suspected exposure",
    accessRequestProcess: "Request via Security Administrator; requires an existing `triage_service_manager`-excluded admin/security/privacy/governance role.",
    revocationProcedure: "Generate a new hash with src/scripts/hashHelpRestrictedPassword.ts, update the secret manager entry, and redeploy."
  }
];
