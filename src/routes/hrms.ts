import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { readAuthenticatedSession } from "../middleware/auth.js";
import {
  HrmsSyncError,
  HrmsSyncRequestSchema,
  syncUsersFromHrms
} from "../services/hrmsSync.js";

function safeSecretEquals(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

function cronAuthorized(headerValue: string | string[] | undefined): boolean {
  const configuredSecret = process.env.HRMS_SYNC_CRON_SECRET;
  const suppliedSecret = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  return Boolean(configuredSecret && suppliedSecret && safeSecretEquals(suppliedSecret, configuredSecret));
}

function handleHrmsError(error: unknown, next: (error: unknown) => void, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (error instanceof HrmsSyncError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }
  return next(error);
}

export function createHrmsRouter(): Router {
  const router = Router();

  router.post("/sync-users", async (req, res, next) => {
    try {
      const parsed = HrmsSyncRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid HRMS sync payload", details: parsed.error.flatten() });
      }

      const session = await readAuthenticatedSession(req);
      const summary = await syncUsersFromHrms({
        request: parsed.data,
        session,
        cronAuthorized: cronAuthorized(req.headers["x-hrms-sync-secret"])
      });
      return res.json({ summary });
    } catch (error) {
      return handleHrmsError(error, next, res);
    }
  });

  return router;
}
