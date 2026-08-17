import { Router } from "express";
import {
  getCareAdviceForProtocol,
  getClinicalProtocolById,
  getCurrentClinicalContentPackage,
  listClinicalProtocols,
  searchClinicalProtocols
} from "../services/clinicalContent.js";
import { DispositionCodeSchema } from "../types/triage.js";
import { ProtocolSearchQuerySchema } from "../types/clinicalContent.js";

function parsePositiveQuestionIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item).split(",")).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

export function createProtocolsRouter(): Router {
  const router = Router();

  router.get("/releases/current", (_req, res) => {
    const contentPackage = getCurrentClinicalContentPackage();
    res.json({
      release: contentPackage.release,
      protocolCount: contentPackage.protocols.length,
      localizedDispositionCount: contentPackage.localizedDispositions.length,
      warning:
        "Synthetic Phase 1 content is for software wiring only. Replace with licensed STCC content before clinical production use."
    });
  });

  router.get("/search", (req, res) => {
    const parsed = ProtocolSearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid protocol search query", details: parsed.error.flatten() });
    }

    return res.json({
      release: getCurrentClinicalContentPackage().release,
      results: searchClinicalProtocols(parsed.data)
    });
  });

  router.get("/", (req, res) => {
    const all = listClinicalProtocols().map((protocol) => ({
      id: protocol.id,
      titleEn: protocol.titleEn,
      clinicalDefinitionEn: protocol.clinicalDefinitionEn,
      ageMin: protocol.ageMin,
      ageMax: protocol.ageMax,
      mode: protocol.mode,
      questionCount: protocol.questions.length
    }));

    // Opt-in only (closes the remainder of R-03's pagination recommendation,
    // docs/load-test-baseline-2026-08-04.md) - omitted, response is the full
    // unpaginated list exactly as before.
    const limit = Number(req.query.limit);
    const offset = Number(req.query.offset) || 0;
    const hasLimit = Number.isInteger(limit) && limit > 0;
    const protocols = hasLimit ? all.slice(offset, offset + limit) : all;

    // Closes NFR-140 (caching for master/seed/configuration data) - protocol
    // metadata changes only on a new STCC content release, not per request.
    // `private` since this is behind session auth, not a shared/CDN cache.
    res.set("Cache-Control", "private, max-age=300");
    return res.json({
      release: getCurrentClinicalContentPackage().release,
      protocols,
      totalCount: all.length
    });
  });

  router.get("/:protocolId", (req, res) => {
    const protocol = getClinicalProtocolById(req.params.protocolId);
    if (!protocol) {
      return res.status(404).json({ error: "Protocol not found" });
    }

    return res.json({
      release: getCurrentClinicalContentPackage().release,
      protocol
    });
  });

  router.get("/:protocolId/care-advice", (req, res) => {
    const protocol = getClinicalProtocolById(req.params.protocolId);
    if (!protocol) {
      return res.status(404).json({ error: "Protocol not found" });
    }

    const positiveQuestionIds = parsePositiveQuestionIds(req.query.positiveQuestionIds);
    const dispositionCode = req.query.dispositionCode
      ? DispositionCodeSchema.safeParse(req.query.dispositionCode)
      : undefined;

    if (dispositionCode && !dispositionCode.success) {
      return res.status(400).json({ error: "Invalid dispositionCode" });
    }

    if (positiveQuestionIds.length === 0) {
      return res.status(422).json({
        error: "Exact protocol question lineage is required for care advice",
        code: "CARE_ADVICE_QUESTION_REQUIRED"
      });
    }

    const protocolQuestionIds = new Set(protocol.questions.map((question) => question.id));
    const unknownQuestionIds = positiveQuestionIds.filter((questionId) => !protocolQuestionIds.has(questionId));
    if (unknownQuestionIds.length > 0) {
      return res.status(422).json({
        error: "One or more questions do not belong to the selected protocol",
        code: "CARE_ADVICE_PROTOCOL_MISMATCH",
        unknownQuestionIds
      });
    }

    return res.json({
      release: getCurrentClinicalContentPackage().release,
      protocolId: protocol.id,
      questionIds: positiveQuestionIds,
      selectionMode: "EXACT_QUESTION",
      careAdvice: getCareAdviceForProtocol(protocol.id, positiveQuestionIds)
    });
  });

  return router;
}
