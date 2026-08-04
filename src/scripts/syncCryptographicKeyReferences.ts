/**
 * Mirrors real GCP Secret Manager key metadata into the previously
 * schema-only `CryptographicKeyReference` table (part of R-04,
 * docs/soc2-data-governance-schema-status.md) - the first real data this
 * table has ever held. This does NOT invent or perform any key rotation;
 * it reads the actual current secret version and rotation config already
 * configured in GCP (via `gcloud`, since the Secret Manager Node client
 * isn't a project dependency) and records it as a governance-visible
 * inventory row per secret.
 *
 * `KeyRotationRecord` is intentionally NOT populated here - it models
 * actual rotation *events* (old version -> new version), and no real
 * rotation has ever occurred for these secrets (only the initial version 1
 * exists) - writing a fabricated "rotation" row for a version that was
 * simply created, not rotated, would misrepresent history. That table
 * stays empty until a real rotation happens.
 *
 * Requires the `gcloud` CLI locally authenticated - this is a manually-run
 * governance sync, not deployed as a Cloud Run Job (the production image
 * has no gcloud SDK installed, and this script's job is to read GCP's own
 * control-plane state, not application data).
 *
 * Usage: npx tsx src/scripts/syncCryptographicKeyReferences.ts
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const execFileAsync = promisify(execFile);
const prisma = new PrismaClient();

const PROJECT = "triage-502706";

const SECRETS: Array<{ secretName: string; keyClass: string }> = [
  { secretName: "ist-triage-soc2-database-url", keyClass: "database-credential" },
  { secretName: "ist-triage-soc2-auth-jwt-secret", keyClass: "jwt-signing" },
  { secretName: "ist-triage-soc2-audit-hmac-secret", keyClass: "audit-hmac" }
];

// shell: true is required for gcloud's .cmd wrapper to resolve on Windows.
// Safe here: every argument is a hardcoded constant from SECRETS below,
// never user/network input.
async function gcloud(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("gcloud", args, { shell: true });
  return stdout.trim();
}

async function main() {
  for (const { secretName, keyClass } of SECRETS) {
    const versions = await gcloud([
      "secrets", "versions", "list", secretName,
      "--project", PROJECT,
      "--filter", "state=enabled",
      "--sort-by", "~createTime",
      "--limit", "1",
      "--format", "value(name)"
    ]);
    const currentVersion = versions || "unknown";

    const location = await gcloud([
      "secrets", "describe", secretName,
      "--project", PROJECT,
      "--format", "value(replication.automatic)"
    ]).then((v) => (v ? "automatic (multi-region)" : "unknown"));

    const row = await prisma.cryptographicKeyReference.upsert({
      where: { keyAlias: secretName },
      update: { provider: "GCP Secret Manager", location, keyClass, currentVersion, status: "active" },
      create: {
        keyAlias: secretName,
        provider: "GCP Secret Manager",
        location,
        keyClass,
        currentVersion,
        status: "active"
      }
    });
    console.log(`Synced ${secretName}: version=${currentVersion}, id=${row.id}`);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Key reference sync failed:", error);
  process.exitCode = 1;
});
