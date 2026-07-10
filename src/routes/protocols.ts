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

  router.get("/", (_req, res) => {
    return res.json({
      release: getCurrentClinicalContentPackage().release,
      protocols: listClinicalProtocols().map((protocol) => ({
        id: protocol.id,
        titleEn: protocol.titleEn,
        clinicalDefinitionEn: protocol.clinicalDefinitionEn,
        ageMin: protocol.ageMin,
        ageMax: protocol.ageMax,
        mode: protocol.mode,
        questionCount: protocol.questions.length
      }))
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

    return res.json({
      release: getCurrentClinicalContentPackage().release,
      protocolId: protocol.id,
      careAdvice: getCareAdviceForProtocol(
        protocol.id,
        positiveQuestionIds,
        dispositionCode?.success ? dispositionCode.data : undefined
      )
    });
  });

  return router;
}
