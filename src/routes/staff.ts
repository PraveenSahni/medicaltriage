import { Router } from "express";
import { validateStaffMember } from "../services/hrms.js";
import { StaffValidateRequestSchema } from "../types/triage.js";

export function createStaffRouter(): Router {
  const router = Router();

  router.post("/validate", async (req, res) => {
    const parsed = StaffValidateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid staff validation payload", details: parsed.error.flatten() });
    }

    const result = await validateStaffMember(parsed.data.istStaffId);
    return res.status(result.valid ? 200 : 404).json({
      ...result,
      validated: result.valid
    });
  });

  return router;
}
