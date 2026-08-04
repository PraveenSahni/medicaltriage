import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { shouldUseDatabasePersistence } from "../config/runtime.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const SubmitFeedbackRequestSchema = z.object({
  context: z.string().min(1).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional()
});

export function createFeedbackRouter(): Router {
  const router = Router();

  router.post("/", async (req: AuthenticatedRequest, res) => {
    const parsed = SubmitFeedbackRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid feedback payload", details: parsed.error.flatten() });
    }

    const session = req.securitySession;
    const { context, rating, comment } = parsed.data;

    if (shouldUseDatabasePersistence()) {
      await prisma.userFeedback.create({
        data: {
          userId: session?.user.id,
          role: session?.activeRole,
          context,
          rating,
          comment
        }
      });
    }

    return res.status(201).json({ recorded: true });
  });

  return router;
}
