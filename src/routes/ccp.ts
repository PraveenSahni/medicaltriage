import { Router } from "express";
import type { Request } from "express";
import { getEmployeeCcpSummary } from "../services/ccp.js";
import {
  approveAndSendCcpDraft,
  CcpCommunicationError,
  createCcpOutboundDraft,
  getCcpCommunicationStatus,
  listCcpOutboundDrafts,
  listInboundWebhookRecords,
  recordTwilioInboundWebhook
} from "../services/ccpCommunication.js";
import { EmployeeCcpLookupSchema } from "../types/ccp.js";
import { CcpMessageApproveRequestSchema, CcpMessageDraftRequestSchema } from "../types/communication.js";
import { isSafetyKernelError } from "../services/safetyKernel.js";

function normalizeFormBody(body: unknown): Record<string, string> {
  if (!body || typeof body !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(body as Record<string, unknown>).map(([key, value]) => [
      key,
      Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "")
    ])
  );
}

function publicWebhookUrl(req: Request): string {
  if (process.env.TWILIO_WEBHOOK_PUBLIC_URL) {
    return process.env.TWILIO_WEBHOOK_PUBLIC_URL;
  }

  const forwardedProto = req.header("x-forwarded-proto");
  const forwardedHost = req.header("x-forwarded-host");
  const protocol = forwardedProto ?? req.protocol;
  const host = forwardedHost ?? req.get("host") ?? "localhost";
  return `${protocol}://${host}${req.originalUrl}`;
}

function handleCcpError(error: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }) {
  if (isSafetyKernelError(error)) {
    return res.status(error.status).json(error.payload);
  }

  if (error instanceof CcpCommunicationError) {
    return res.status(error.statusCode).json({ error: error.message });
  }

  const message = error instanceof Error ? error.message : "Unexpected CCP communication error.";
  return res.status(500).json({ error: message });
}

export function createCcpRouter(): Router {
  const router = Router();

  router.get("/communication/status", (_req, res) => {
    return res.json(getCcpCommunicationStatus());
  });

  router.get("/messages/drafts", async (_req, res, next) => {
    try {
      return res.json({ drafts: await listCcpOutboundDrafts() });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/messages/draft", async (req, res) => {
    const parsed = CcpMessageDraftRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid CCP outbound draft request", details: parsed.error.flatten() });
    }

    try {
      const draft = await createCcpOutboundDraft(parsed.data);
      return res.status(201).json({ draft });
    } catch (error) {
      return handleCcpError(error, res);
    }
  });

  router.post("/messages/:draftId/approve-send", async (req, res) => {
    const parsed = CcpMessageApproveRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid CCP approval request", details: parsed.error.flatten() });
    }

    try {
      const draft = await approveAndSendCcpDraft(req.params.draftId, parsed.data);
      return res.json({ draft });
    } catch (error) {
      return handleCcpError(error, res);
    }
  });

  router.post("/webhooks/twilio", async (req, res) => {
    try {
      const form = normalizeFormBody(req.body);
      const record = await recordTwilioInboundWebhook(
        form,
        req.header("x-twilio-signature") ?? undefined,
        publicWebhookUrl(req)
      );

      return res.status(200).json({
        ok: true,
        persisted: Boolean(record),
        inboundRecordId: record?.id
      });
    } catch (error) {
      return handleCcpError(error, res);
    }
  });

  router.get("/webhooks/inbound-records", async (_req, res, next) => {
    try {
      return res.json({ records: await listInboundWebhookRecords() });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/employee/:istStaffId", async (req, res) => {
    const parsed = EmployeeCcpLookupSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid CCP employee lookup", details: parsed.error.flatten() });
    }

    const summary = await getEmployeeCcpSummary(parsed.data.istStaffId);
    if (!summary) {
      return res.status(404).json({
        error: "Employee CCP thread was not found.",
        message: "Validate the IST staff ID before opening the employee communication pipeline."
      });
    }

    return res.json(summary);
  });

  return router;
}
