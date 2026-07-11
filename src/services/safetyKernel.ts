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

export function isSafetyKernelError(error: unknown): error is SafetyKernelError {
  return error instanceof SafetyKernelError;
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

export function isSignedHumanApprovalTrace(trace: unknown): boolean {
  return traceObjects(trace).some((event) => {
    const reviewedReasoning = event.reviewedReasoningFeatureIds;
    const auditSignature = event.auditSignature;
    return (
      event.eventType === "HITL_CLINICAL_APPROVAL" &&
      event.activeReviewConfirmed === true &&
      event.featureLevelReasoningReviewed === true &&
      Array.isArray(reviewedReasoning) &&
      reviewedReasoning.length >= 2 &&
      typeof auditSignature === "string" &&
      /^[a-f0-9]{64}$/i.test(auditSignature)
    );
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
