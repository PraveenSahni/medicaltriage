import { createHmac, timingSafeEqual } from "node:crypto";
import { shouldUseDatabasePersistence } from "../config/runtime.js";
import { prisma } from "../db.js";

export const HITL_FORBIDDEN_PAYLOAD = {
  error: "Forbidden",
  message:
    "Transaction blocked. Human-in-the-loop clinical approval is required before executing EMR or CCP operations."
} as const;

export type SafetyKernelOperation = "EMR_WRITEBACK" | "CCP_SEND";

export class SafetyKernelError extends Error {
  readonly status = 403;
  readonly statusCode = 403;
  readonly payload = HITL_FORBIDDEN_PAYLOAD;

  constructor(
    readonly encounterId: string | undefined,
    readonly operation: SafetyKernelOperation
  ) {
    super(HITL_FORBIDDEN_PAYLOAD.message);
  }
}

export class SafetyKernelTraceVerificationError extends Error {
  readonly status = 403;
  readonly statusCode = 403;
  readonly payload = HITL_FORBIDDEN_PAYLOAD;

  constructor(
    message: string,
    readonly encounterId?: string
  ) {
    super(message);
  }
}

type SafetyKernelAccessError = SafetyKernelError | SafetyKernelTraceVerificationError;

export function isSafetyKernelError(error: unknown): error is SafetyKernelAccessError {
  return error instanceof SafetyKernelError || error instanceof SafetyKernelTraceVerificationError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function traceObjects(value: unknown): Array<Record<string, unknown>> {
  const output: Array<Record<string, unknown>> = [];
  const stack: unknown[] = [value];

  while (stack.length > 0) {
    const current = stack.pop();
    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }
    if (!isRecord(current)) {
      continue;
    }

    output.push(current);
    for (const nested of Object.values(current)) {
      if (Array.isArray(nested) || isRecord(nested)) {
        stack.push(nested);
      }
    }
  }

  return output;
}

// Fails closed unconditionally - falling back to another secret (or a mock
// value) would let the audit trail's tamper-evidence be silently forged, or
// reuse a key from an unrelated purpose (session signing). There is no safe
// default for a signing secret.
function auditHmacSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET;
  if (!secret) {
    throw new Error("AUDIT_HMAC_SECRET must be set before signing or verifying audit trace records.");
  }
  return secret;
}

function canonicalValue(value: unknown): string {
  if (value === undefined) {
    return "__undefined__";
  }

  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalValue(item)).join(",")}]`;
  }

  if (isRecord(value)) {
    return `{${Object.entries(value)
      .filter(([key]) => key !== "auditSignature")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalValue(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value) ?? "__unsupported__";
}

export function canonicalAuditPayload(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .filter(([key]) => key !== "auditSignature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${canonicalValue(value)}`)
    .join("|");
}

export function auditSignatureFor(payload: Record<string, unknown>): string {
  return createHmac("sha256", auditHmacSecret()).update(canonicalAuditPayload(payload)).digest("hex");
}

function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) {
    return false;
  }

  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function hasSignedApprovalShape(event: Record<string, unknown>): boolean {
  const reviewedReasoning = event.reviewedReasoningFeatureIds;
  return (
    event.eventType === "HITL_CLINICAL_APPROVAL" &&
    event.activeReviewConfirmed === true &&
    event.featureLevelReasoningReviewed === true &&
    Array.isArray(reviewedReasoning) &&
    reviewedReasoning.length >= 2 &&
    typeof event.auditSignature === "string"
  );
}

function verifyAuditSignature(event: Record<string, unknown>): boolean {
  const auditSignature = event.auditSignature;
  if (typeof auditSignature !== "string") {
    return false;
  }

  const expectedSignature = auditSignatureFor(event);
  if (!safeEqualHex(expectedSignature, auditSignature)) {
    console.error("HITL audit signature verification failed", {
      eventType: event.eventType,
      encounterId: typeof event.encounterId === "string" ? event.encounterId : undefined
    });
    throw new SafetyKernelTraceVerificationError(
      "HITL clinical approval signature verification failed.",
      typeof event.encounterId === "string" ? event.encounterId : undefined
    );
  }

  return true;
}

export function isSignedHumanApprovalTrace(trace: unknown): boolean {
  return traceObjects(trace).some((event) => {
    if (event.eventType !== "HITL_CLINICAL_APPROVAL") {
      return false;
    }
    if (!hasSignedApprovalShape(event)) {
      return false;
    }
    return verifyAuditSignature(event);
  });
}

export async function assertHumanApprovalForExport(
  encounterId: string | undefined,
  operation: SafetyKernelOperation
): Promise<{ approved: true; mode: "mock-mode" | "database"; encounterId?: string; operation: SafetyKernelOperation }> {
  if (!shouldUseDatabasePersistence()) {
    return { approved: true, mode: "mock-mode", encounterId, operation };
  }

  if (!encounterId) {
    throw new SafetyKernelError(encounterId, operation);
  }

  const safetyLog = await prisma.safetyAuditDeviationLog.findUnique({
    where: { encounterId },
    select: {
      id: true,
      explainabilityTrace: true
    }
  });

  if (!safetyLog || !isSignedHumanApprovalTrace(safetyLog.explainabilityTrace)) {
    throw new SafetyKernelError(encounterId, operation);
  }

  return { approved: true, mode: "database", encounterId, operation };
}
