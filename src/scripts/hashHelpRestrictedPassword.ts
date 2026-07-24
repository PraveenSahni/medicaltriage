/**
 * One-time offline helper: generates the scrypt hash for
 * HELP_RESTRICTED_ACCESS_PASSWORD_HASH from a plaintext password supplied as
 * a CLI argument. Prints only the hash - never writes the plaintext or the
 * hash to any file, log, or the repository. Copy the printed value directly
 * into your deployment's secret manager / protected environment
 * configuration.
 *
 * Usage:
 *   tsx src/scripts/hashHelpRestrictedPassword.ts "the-plaintext-password"
 */
import { hashRestrictedAccessPassword } from "../services/helpRestrictedAccess.js";

const plaintext = process.argv[2];
if (!plaintext) {
  console.error("Usage: tsx src/scripts/hashHelpRestrictedPassword.ts \"<plaintext-password>\"");
  process.exit(1);
}

console.log(hashRestrictedAccessPassword(plaintext));
