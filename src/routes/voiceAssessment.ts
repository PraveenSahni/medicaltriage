import { Router } from "express";
import { z } from "zod";
import { requireAnyPermission } from "../middleware/rbac.js";
import type { AuthorizedRequest } from "../services/authorization.js";
import {
  buildMedGemmaVoiceTrainingExamples,
  getVoiceAssessmentSession,
  requestVoiceAssessmentNurseTakeover,
  startVoiceAssessment,
  submitVoiceAssessmentResponse,
  validateVoiceAssessmentTurn,
  VoiceAssessmentError
} from "../services/voiceAssessment.js";
import {
  StartVoiceAssessmentSchema,
  SubmitVoiceResponseSchema,
  ValidateVoiceTurnSchema
} from "../types/voiceAssessment.js";

const TakeoverSchema = z.object({ reason: z.string().min(3).max(1000) }).strict();

function actorFrom(req: AuthorizedRequest) {
  const actor = req.securitySession;
  if (!actor) {
    throw new VoiceAssessmentError("Authentication required.", "VOICE_AUTH_REQUIRED", 401);
  }
  return actor;
}

function handleVoiceError(
  error: unknown,
  next: (error: unknown) => void,
  res: { status: (code: number) => { json: (body: unknown) => void } }
) {
  if (error instanceof VoiceAssessmentError) {
    return res.status(error.statusCode).json({ error: error.message, code: error.code });
  }
  return next(error);
}

export function createVoiceAssessmentRouter(): Router {
  const router = Router();
  const requireClinicalOperator = requireAnyPermission(["triage.workspace.view"]);
  const requireTrainingReviewer = requireAnyPermission([
    "clinical.governance.approve",
    "protocol.library.manage",
    "audit.events.view"
  ]);

  router.post("/sessions", requireClinicalOperator, async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = StartVoiceAssessmentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Voice assessment start request is invalid.",
          code: "VOICE_START_INVALID",
          details: parsed.error.flatten()
        });
      }
      return res.status(201).json({ session: await startVoiceAssessment(actorFrom(req), parsed.data) });
    } catch (error) {
      return handleVoiceError(error, next, res);
    }
  });

  router.get("/sessions/:sessionId", requireClinicalOperator, async (req: AuthorizedRequest, res, next) => {
    try {
      return res.json({ session: await getVoiceAssessmentSession(actorFrom(req), req.params.sessionId) });
    } catch (error) {
      return handleVoiceError(error, next, res);
    }
  });

  router.post("/sessions/:sessionId/responses", requireClinicalOperator, async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = SubmitVoiceResponseSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Voice response is invalid.",
          code: "VOICE_RESPONSE_INVALID",
          details: parsed.error.flatten()
        });
      }
      return res.json({
        session: await submitVoiceAssessmentResponse(actorFrom(req), req.params.sessionId, parsed.data)
      });
    } catch (error) {
      return handleVoiceError(error, next, res);
    }
  });

  router.post("/sessions/:sessionId/turns/:turnId/validate", requireClinicalOperator, async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = ValidateVoiceTurnSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Voice turn validation is invalid.",
          code: "VOICE_VALIDATION_INVALID",
          details: parsed.error.flatten()
        });
      }
      return res.json({
        session: await validateVoiceAssessmentTurn(
          actorFrom(req),
          req.params.sessionId,
          req.params.turnId,
          parsed.data
        )
      });
    } catch (error) {
      return handleVoiceError(error, next, res);
    }
  });

  router.post("/sessions/:sessionId/takeover", requireClinicalOperator, async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = TakeoverSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Nurse takeover request is invalid.",
          code: "VOICE_TAKEOVER_INVALID",
          details: parsed.error.flatten()
        });
      }
      return res.json({
        session: await requestVoiceAssessmentNurseTakeover(
          actorFrom(req),
          req.params.sessionId,
          parsed.data.reason
        )
      });
    } catch (error) {
      return handleVoiceError(error, next, res);
    }
  });

  router.get(
    "/sessions/:sessionId/training-examples",
    requireTrainingReviewer,
    async (req: AuthorizedRequest, res, next) => {
      try {
        const examples = await buildMedGemmaVoiceTrainingExamples(actorFrom(req), req.params.sessionId);
        return res.json({
          examples,
          count: examples.length,
          boundary: "interpretation-only-no-clinical-outcomes"
        });
      } catch (error) {
        return handleVoiceError(error, next, res);
      }
    }
  );

  return router;
}
