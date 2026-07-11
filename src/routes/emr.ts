import { Router } from "express";
import { z } from "zod";
import { executeWriteback } from "../integration/fhirWriteback.js";
import { requirePermission } from "../services/authorization.js";

const ExecuteWritebackRequestSchema = z
  .object({
    isDraft: z.boolean().optional(),
    dryRun: z.boolean().optional(),
    patientId: z.string().min(1).max(120).optional(),
    practitionerId: z.string().min(1).max(120).optional()
  })
  .default({});

export function createEmrRouter(): Router {
  const router = Router();

  router.post("/writeback/:encounterId", requirePermission("triage.workspace.view"), async (req, res, next) => {
    try {
      const parsed = ExecuteWritebackRequestSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid EMR/FHIR writeback payload", details: parsed.error.flatten() });
      }

      const result = await executeWriteback(req.params.encounterId, {
        isDraft: parsed.data.isDraft,
        dryRun: parsed.data.dryRun,
        patientId: parsed.data.patientId,
        practitionerId: parsed.data.practitionerId
      });
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

