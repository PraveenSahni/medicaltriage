import { createCipheriv, createDecipheriv, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Fails closed unconditionally - a fallback value here would be a public,
// guessable key that lets anyone decrypt governed identifiers/passwords or
// forge blind-index lookups. There is no safe default for an encryption key.
function rootSecret(): string {
  const secret = process.env.GOVERNED_ACCOUNT_ENCRYPTION_KEY ?? process.env.MFA_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("GOVERNED_ACCOUNT_ENCRYPTION_KEY or MFA_ENCRYPTION_KEY is required.");
  }
  return secret;
}

function encryptionKey(): Buffer {
  return scryptSync(rootSecret(), "ist-triage-governed-account-encryption-v1", 32);
}

function blindIndexKey(): Buffer {
  return scryptSync(rootSecret(), "ist-triage-governed-account-index-v1", 32);
}

export function encryptGovernedIdentifier(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64")).join(".");
}

export function decryptGovernedIdentifier(ciphertext: string): string {
  const [iv, tag, encrypted] = ciphertext.split(".").map((part) => Buffer.from(part, "base64"));
  if (!iv || !tag || !encrypted) throw new Error("Invalid governed identifier ciphertext.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function governedEmailBlindIndex(email: string): string {
  return createHmac("sha256", blindIndexKey()).update(email.trim().toLowerCase()).digest("hex");
}

export function hashGovernedPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt-v1:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

export function verifyGovernedPassword(password: string, encoded: string): boolean {
  const [version, salt, expectedHex] = encoded.split(":");
  if (version !== "scrypt-v1" || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
