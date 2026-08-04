import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// Real at-rest encryption for TOTP secrets (AES-256-GCM) - no existing
// encryption helper was found to reuse (the "ciphertext"-named columns
// elsewhere in this schema, e.g. AuthenticationProvider.clientIdCiphertext,
// are unpopulated placeholders with no encrypt/decrypt code anywhere), so
// this is a new, minimal, standard implementation, not a second scheme
// competing with an existing one.
function encryptionKey(): Buffer {
  const secret = process.env.MFA_ENCRYPTION_KEY ?? "mock-dev-only-ist-triage-mfa-key";
  return scryptSync(secret, "ist-triage-mfa-salt", 32);
}

export function encryptMfaSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((buffer) => buffer.toString("base64")).join(".");
}

export function decryptMfaSecret(ciphertext: string): string {
  const [ivB64, authTagB64, encryptedB64] = ciphertext.split(".");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
