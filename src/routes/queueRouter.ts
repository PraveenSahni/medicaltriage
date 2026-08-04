import { Router } from "express";
import { requireAnyPermission } from "../middleware/rbac.js";
import type { AuthorizedRequest } from "../services/authorization.js";
import {
  claimQueueItem,
  createQueueItem,
  deleteQueueItem,
  escalateQueueItemToOrganization,
  getCompletionCounter,
  getQueueItem,
  heartbeatQueueItem,
  listQueueItems,
  moveQueueItem,
  nextBestCall,
  QueueOrchestrationError,
  releaseQueueItem,
  updateQueueContext
} from "../services/queueOrchestration.js";
import {
  QueueContextUpdateSchema,
  QueueCreateRequestSchema,
  QueueHandoverRequestSchema,
  QueueListQuerySchema,
  QueueMoveRequestSchema
} from "../types/queue.js";
import { buildSimulatedQueueCreateRequest, loadStaffCandidatePool } from "../services/queueCallGenerator.js";
import { captureReasonForCallAudio, ReasonForCallVoiceCaptureError } from "../services/reasonForCallVoiceCapture.js";

function sessionFrom(req: AuthorizedRequest) {
  const session = req.securitySession;
  if (!session) {
    throw new QueueOrchestrationError(401, "Authentication required", "QUEUE_AUTH_REQUIRED");
  }
  return session;
}

function handleQueueError(error: unknown, next: (error: unknown) => void, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (error instanceof QueueOrchestrationError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }
  if (error instanceof ReasonForCallVoiceCaptureError) {
    return res.status(error.status).json({
      error: error.message,
      code: error.code
    });
  }
  return next(error);
}

export function createQueueRouter(): Router {
  const router = Router();
  router.use(requireAnyPermission(["triage.workspace.view", "triage.queue.manage", "admin.users.manage"]));

  router.get("/", async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = QueueListQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid queue filters", details: parsed.error.flatten() });
      }
      const { items, totalCount } = await listQueueItems(sessionFrom(req), parsed.data);
      return res.json({
        queue: items,
        count: items.length,
        totalCount,
        source: "unified-queue-orchestration"
      });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.post("/", async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = QueueCreateRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid queue item", details: parsed.error.flatten() });
      }
      const item = await createQueueItem(sessionFrom(req), parsed.data);
      return res.status(201).json({ item });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  // Single shared synthetic-call generator (src/services/queueCallGenerator.ts),
  // also used by the in-process background simulator (callSimulator.ts). This
  // is the manual, on-demand invocation point (Service Manager Board's
  // "Generate Calls" action) - same candidate/reason logic, no request body.
  router.post("/simulate", async (req: AuthorizedRequest, res, next) => {
    try {
      const pool = loadStaffCandidatePool();
      if (pool.length === 0) {
        return res.status(503).json({ error: "No synthetic HRMS candidates available", code: "QUEUE_SIMULATE_NO_CANDIDATES" });
      }
      const request = buildSimulatedQueueCreateRequest(pool);
      const item = await createQueueItem(sessionFrom(req), request);
      return res.status(201).json({ item });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.post("/next-best-call", async (req: AuthorizedRequest, res, next) => {
    try {
      const item = await nextBestCall(sessionFrom(req));
      return res.json({
        item,
        lock: {
          lockedBy: item.lockedBy,
          lockExpiresAtIso: item.lockExpiresAtIso
        }
      });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  // Registered before "/:id" so "stats" isn't swallowed as a queue item id.
  // In-memory counter that increments on every real completion (see
  // recordCompletion() in queueOrchestration.ts) - lets a long-running bulk
  // pass be watched live (GET /api/v1/queue/stats/completions) without
  // re-querying the database from an external script.
  router.get("/stats/completions", async (req: AuthorizedRequest, res) => {
    sessionFrom(req);
    return res.json({ completions: getCompletionCounter() });
  });

  router.get("/:id", async (req: AuthorizedRequest, res, next) => {
    try {
      const item = await getQueueItem(sessionFrom(req), req.params.id);
      return res.json({ item });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.delete("/:id", async (req: AuthorizedRequest, res, next) => {
    try {
      await deleteQueueItem(sessionFrom(req), req.params.id);
      return res.status(204).send();
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.post("/:id/claim", async (req: AuthorizedRequest, res, next) => {
    try {
      const item = await claimQueueItem(sessionFrom(req), req.params.id);
      return res.json({
        item,
        lock: {
          lockedBy: item.lockedBy,
          lockExpiresAtIso: item.lockExpiresAtIso
        }
      });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.post("/:id/release", async (req: AuthorizedRequest, res, next) => {
    try {
      const item = await releaseQueueItem(sessionFrom(req), req.params.id);
      return res.json({ item });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.post("/:id/heartbeat", async (req: AuthorizedRequest, res, next) => {
    try {
      const item = await heartbeatQueueItem(sessionFrom(req), req.params.id);
      return res.json({
        item,
        lock: {
          lockedBy: item.lockedBy,
          lockExpiresAtIso: item.lockExpiresAtIso
        }
      });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.patch("/:id/context", async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = QueueContextUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid queue context update", details: parsed.error.flatten() });
      }
      const item = await updateQueueContext(sessionFrom(req), req.params.id, parsed.data);
      return res.json({ item });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  // Captures the caller's spoken "reason for call" from the IVR leg (any
  // call-center vendor - the capture service is provider-agnostic) and
  // converts it to text via a pluggable speech-to-text provider, then saves
  // the result as this call's reasonNarrative - same as if the nurse had
  // typed it, but sourced from the recorded audio instead. No real
  // telephony/STT vendor is wired in yet; see reasonForCallVoiceCapture.ts.
  router.post("/:id/reason-audio", async (req: AuthorizedRequest, res, next) => {
    try {
      const capture = await captureReasonForCallAudio({
        audioReference: typeof req.body?.audioReference === "string" ? req.body.audioReference : undefined,
        simulatedTranscriptText:
          typeof req.body?.simulatedTranscriptText === "string" ? req.body.simulatedTranscriptText : undefined
      });
      const item = await updateQueueContext(sessionFrom(req), req.params.id, {
        reasonNarrative: capture.transcriptText,
        reasonCallCapture: capture
      });
      return res.status(201).json({ item, capture });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.post("/:id/move", async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = QueueMoveRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid queue movement", details: parsed.error.flatten() });
      }
      const item = await moveQueueItem(sessionFrom(req), req.params.id, parsed.data);
      return res.json({ item });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  router.post("/:id/escalate", async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = QueueHandoverRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid queue handover", details: parsed.error.flatten() });
      }
      const item = await escalateQueueItemToOrganization(sessionFrom(req), req.params.id, parsed.data);
      return res.json({ item });
    } catch (error) {
      return handleQueueError(error, next, res);
    }
  });

  return router;
}
