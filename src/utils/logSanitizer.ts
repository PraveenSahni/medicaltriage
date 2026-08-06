/**
 * Centralized structured-log sanitizer (NFR-078 / NFR-004 AI-tab).
 *
 * Recursively redacts sensitive keys and values before anything reaches
 * console.error/console.log. Never mutates the input - always returns a new
 * value - and is defensive against circular references, arrays, Error
 * objects, and unbounded depth/size (a malformed or huge object must never
 * turn a log call into a crash or a multi-MB log line).
 */

const REDACTED = "***REDACTED***";
const MAX_DEPTH = 6;
const MAX_ARRAY_ITEMS = 25;
const MAX_STRING_LENGTH = 2_000;

// Key names (case-insensitive, substring match) that are always redacted
// regardless of where they appear in the object graph. Deliberately broad -
// a false-positive redaction (e.g. a field merely named "tokenCount") is a
// usability cost; an unredacted secret is a compliance failure.
const SENSITIVE_KEY_PATTERNS: RegExp[] = [
  /password/i,
  /\btoken\b/i,
  /authorization/i,
  /\bcookie\b/i,
  /\botp\b/i,
  /secret/i,
  /\bemail\b/i,
  /\bphone\b/i,
  /mobile/i,
  /patientname/i,
  /\bfullname\b/i,
  /dateofbirth/i,
  /\bdob\b/i,
  /medicalnarrative/i,
  /\bsymptoms?\b/i,
  /\bdiagnosis\b/i,
  /requestbody/i,
  /responsebody/i,
  /nationalid/i,
  /passport/i,
  /licencenumber|licensenumber/i,
  /\baddress\b/i
];

// Fields that are operationally necessary and never sensitive - kept even
// when a broader pattern above might otherwise catch a similarly-named key.
// (Currently no overlaps exist, but this documents the intent for future
// pattern additions rather than leaving it implicit.)
const SAFE_KEYS = new Set([
  "requestId",
  "correlationId",
  "method",
  "path",
  "route",
  "statusCode",
  "durationMs",
  "count",
  "id",
  "errorCategory",
  "code"
]);

function isSensitiveKey(key: string): boolean {
  if (SAFE_KEYS.has(key)) {
    return false;
  }
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function truncateString(value: string): string {
  if (value.length <= MAX_STRING_LENGTH) {
    return value;
  }
  return `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`;
}

/**
 * Sanitizes an arbitrary value for safe inclusion in a log line. Handles
 * nested objects/arrays, Error instances (message + cause + a bounded set
 * of own-enumerable metadata fields, never a raw stack dump), and circular
 * references (via a WeakSet of already-visited objects, replaced with a
 * "[Circular]" marker rather than recursing forever).
 */
export function sanitizeForLog(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  return sanitizeAtDepth(value, 0, seen);
}

function sanitizeAtDepth(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === "string") {
    return truncateString(value);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }

  if (depth >= MAX_DEPTH) {
    return "[MaxDepthExceeded]";
  }

  if (value instanceof Error) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const sanitized: Record<string, unknown> = {
      name: value.name,
      message: truncateString(value.message)
    };
    if (value.cause !== undefined) {
      sanitized.cause = sanitizeAtDepth(value.cause, depth + 1, seen);
    }
    // Only a small, explicit allow-list of extra own-enumerable fields -
    // never the raw stack (which can echo request/query data via V8's
    // stack-trace formatting of thrown values in some driver errors) and
    // never an unrestricted spread of unknown error subclass fields.
    for (const key of ["code", "meta"] as const) {
      const extra = (value as unknown as Record<string, unknown>)[key];
      if (extra !== undefined) {
        sanitized[key] = sanitizeAtDepth(extra, depth + 1, seen);
      }
    }
    return sanitized;
  }

  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const truncated = value.length > MAX_ARRAY_ITEMS;
    const items = value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeAtDepth(item, depth + 1, seen));
    return truncated ? [...items, `...[${value.length - MAX_ARRAY_ITEMS} more]`] : items;
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
    const result: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
      if (isSensitiveKey(key)) {
        result[key] = entryValue === undefined ? undefined : REDACTED;
        continue;
      }
      result[key] = sanitizeAtDepth(entryValue, depth + 1, seen);
    }
    return result;
  }

  return String(value);
}
