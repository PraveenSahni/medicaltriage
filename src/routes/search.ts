import { Router } from "express";
import { z } from "zod";
import { searchGlobal } from "../services/globalSearch.js";
import type { AuthorizedRequest } from "../services/authorization.js";

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(240),
  limit: z.coerce.number().int().min(1).max(20).default(8)
});

export function createSearchRouter(): Router {
  const router = Router();

  // Closes NFR-007 - one call spans both real, structured data sources
  // (protocols, queue cases). No extra permission gate beyond session auth:
  // queue visibility is already enforced inside listQueueItems(), so a
  // second gate here would be redundant, not additive - matches
  // GET /api/v1/protocols/search's existing always-allowed-once-authenticated
  // gating.
  router.get("/", async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = SearchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid search query", details: parsed.error.flatten() });
      }
      if (!req.securitySession) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const results = await searchGlobal(req.securitySession, parsed.data.q, parsed.data.limit);
      return res.json({ query: parsed.data.q, ...results });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
