import { Router } from "express";
import { requireAnyPermission } from "../middleware/rbac.js";
import type { AuthorizedRequest } from "../services/authorization.js";
import {
  CallCenterGatewayError,
  executeQueueCallCommand,
  getCallCenterGatewayStatus,
  ingestCallCenterEvent,
  listCallCenterSessions,
  verifyCallCenterSignature
} from "../services/callCenterGateway.js";
import { CallCenterCommandSchema, CallCenterEventSchema } from "../types/callCenter.js";

function handleGatewayError(
  error: unknown,
  next: (error: unknown) => void,
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if (error instanceof CallCenterGatewayError) {
    return res.status(error.statusCode).json({ error: error.message, code: error.code });
  }
  return next(error);
}

export function createCallCenterInboundRouter(): Router {
  const router = Router();

  router.post("/events", async (req, res, next) => {
    try {
      const suppliedSignature = req.get("x-ist-call-center-signature");
      if (!verifyCallCenterSignature(req.body, suppliedSignature)) {
        return res.status(401).json({
          error: "Call-center event signature is invalid.",
          code: "CALL_CENTER_SIGNATURE_INVALID"
        });
      }

      const parsed = CallCenterEventSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Call-center event is invalid.",
          code: "CALL_CENTER_EVENT_INVALID",
          details: parsed.error.flatten()
        });
      }

      const receipt = await ingestCallCenterEvent(parsed.data);
      return res.status(receipt.duplicate ? 200 : 202).json({ receipt });
    } catch (error) {
      return handleGatewayError(error, next, res);
    }
  });

  return router;
}

export function createCallCenterRouter(): Router {
  const router = Router();

  router.get(
    "/status",
    requireAnyPermission(["integration.callcenter.manage", "triage.queue.manage", "audit.events.view"]),
    async (_req, res, next) => {
      try {
        return res.json({ gateway: await getCallCenterGatewayStatus() });
      } catch (error) {
        return handleGatewayError(error, next, res);
      }
    }
  );

  router.get(
    "/sessions",
    requireAnyPermission(["integration.callcenter.manage", "triage.queue.manage", "audit.events.view"]),
    async (_req, res, next) => {
      try {
        const sessions = await listCallCenterSessions();
        return res.json({ sessions, count: sessions.length });
      } catch (error) {
        return handleGatewayError(error, next, res);
      }
    }
  );

  router.post(
    "/queue/:queueItemId/command",
    requireAnyPermission(["triage.workspace.view"]),
    async (req: AuthorizedRequest, res, next) => {
      try {
        const parsed = CallCenterCommandSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({
            error: "Call-center command is invalid.",
            code: "CALL_CENTER_COMMAND_INVALID",
            details: parsed.error.flatten()
          });
        }
        const actor = req.securitySession;
        if (!actor) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const result = await executeQueueCallCommand(actor, req.params.queueItemId, parsed.data);
        return res.json(result);
      } catch (error) {
        return handleGatewayError(error, next, res);
      }
    }
  );

  return router;
}
