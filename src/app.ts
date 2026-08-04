import compression from "compression";
import cors, { type CorsOptions, type CorsOptionsDelegate } from "cors";
import express, { type Request } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  assertRuntimeConfiguration,
  getAllowedCorsOrigins,
  isMockMode,
  publicRuntimeEnvironment,
  runtimeModeSummary
} from "./config/runtime.js";
import { requireAuthenticatedSession } from "./middleware/auth.js";
import { corsRejectionHandler, globalErrorHandler } from "./middleware/error.js";
import { ipAllowlist } from "./middleware/ipAllowlist.js";
import { requestDurationLogger } from "./middleware/requestDuration.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { createAdminRouter } from "./routes/admin.js";
import { createApprovalRouter } from "./routes/approvalRouter.js";
import { createAuthRouter } from "./routes/auth.js";
import {
  createCallCenterInboundRouter,
  createCallCenterRouter
} from "./routes/callCenterGateway.js";
import { createCcpRouter } from "./routes/ccp.js";
import { createEmrRouter } from "./routes/emr.js";
import { createHelpApiRouter, createHelpPageRouter } from "./routes/helpRouter.js";
import { createHrmsRouter } from "./routes/hrms.js";
import { createProtocolsRouter } from "./routes/protocols.js";
import { createQueueRouter } from "./routes/queueRouter.js";
import { createSimulationRouter } from "./routes/simulation.js";
import { createStaffRouter } from "./routes/staff.js";
import { createTriageRouter } from "./routes/triage.js";
import { createVoiceAssessmentRouter } from "./routes/voiceAssessment.js";
import { getCurrentClinicalContentPackage } from "./services/clinicalContent.js";

const staticRoot = path.resolve(process.cwd(), "dist-web");
const staticIndex = path.join(staticRoot, "index.html");

function loadSpaIndexHtml() {
  if (!existsSync(staticIndex)) {
    return null;
  }

  return readFileSync(staticIndex, "utf8")
    .replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g, (tag, src: string) =>
      tag.includes('type="module"') ? `<script defer src="${src}"></script>` : tag
    )
    .replace(/<link\b[^>]*\bhref="([^"]+)"[^>]*>/g, (tag, href: string) =>
      tag.includes('rel="stylesheet"') ? `<link rel="stylesheet" href="${href}">` : tag
    );
}

function requestOrigin(req: Request): string | undefined {
  const host = req.get("x-forwarded-host") ?? req.get("host");
  if (!host) {
    return undefined;
  }

  const forwardedProtocol = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProtocol || (req.secure ? "https" : req.protocol);
  return `${protocol}://${host}`;
}

function isAllowedOriginForRequest(origin: string | undefined, req: Request, allowedOrigins: string[]) {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return origin === requestOrigin(req);
}

function corsForbiddenError() {
  const error = new Error("Origin not allowed by security policies") as Error & {
    status?: number;
    code?: string;
  };
  error.status = 403;
  error.code = "CORS_ORIGIN_FORBIDDEN";
  return error;
}

export function createApp() {
  assertRuntimeConfiguration();
  const app = express();
  const spaIndexHtml = loadSpaIndexHtml();
  const allowedOrigins = getAllowedCorsOrigins();
  const corsOptions: CorsOptionsDelegate<Request> = (req, callback) => {
    const origin = req.get("origin");
    if (!isAllowedOriginForRequest(origin, req, allowedOrigins)) {
      return callback(corsForbiddenError());
    }

    const options: CorsOptions = {
      credentials: true,
      origin: origin || false
    };
    return callback(null, options);
  };
  const staffValidateRateLimit = rateLimit({
    name: "staff-validate",
    windowMs: 60_000,
    maxRequests: 30
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "connect-src": ["'self'"],
          "img-src": ["'self'", "data:"],
          "script-src": ["'self'"],
          "script-src-elem": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "upgrade-insecure-requests": null
        }
      }
    })
  );
  app.use(cors(corsOptions));
  app.use(corsRejectionHandler);
  // Closes NFR-143 - compresses response payloads (the queue/protocols
  // endpoints were flagged in the load-test baseline as large-payload
  // hotspots) to reduce network transfer time, especially for slower
  // client connections.
  app.use(compression());
  app.use(requestDurationLogger());
  // Optional IP allowlisting (NFR-027) - a no-op unless IP_ALLOWLIST is set,
  // so it never affects an existing deployment that hasn't opted in.
  app.use(ipAllowlist(process.env.IP_ALLOWLIST));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use((_req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = ((body: unknown) => {
      if (
        isMockMode() &&
        body &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        !("is_mock" in body)
      ) {
        return originalJson({ ...body, is_mock: true });
      }
      return originalJson(body);
    }) as typeof res.json;
    return next();
  });
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }

  app.get("/healthz", (_req, res) => {
    res.json({
      ok: true,
      service: "ist-tech-tele-triage-mvp",
      architecture: "rules-first-ai-second",
      phiPersistenceMode: "ephemeral-api-session-only",
      gcpPrimaryRegion: "me-central1",
      clinicalContentRelease: getCurrentClinicalContentPackage().release,
      runtime: runtimeModeSummary()
    });
  });

  app.get("/api/v1/runtime/environment", (_req, res) => {
    res.json(publicRuntimeEnvironment());
  });

  app.use("/api/v1/auth", createAuthRouter());
  app.use("/api/v1/hrms", createHrmsRouter());
  app.use("/api/v1/integrations/call-center", createCallCenterInboundRouter());
  app.use("/api/v1/admin", requireAuthenticatedSession, createAdminRouter());
  app.use("/api/v1/approval", requireAuthenticatedSession, createApprovalRouter());
  app.use("/api/v1/ccp", requireAuthenticatedSession, createCcpRouter());
  app.use("/api/v1/staff/validate", staffValidateRateLimit);
  app.use("/api/v1/staff", requireAuthenticatedSession, createStaffRouter());
  app.use("/api/v1/protocols", requireAuthenticatedSession, createProtocolsRouter());
  app.use("/api/v1/queue", requireAuthenticatedSession, createQueueRouter());
  app.use("/api/v1/call-center", requireAuthenticatedSession, createCallCenterRouter());
  app.use("/api/v1/simulation", requireAuthenticatedSession, createSimulationRouter());
  app.use("/api/v1/triage", requireAuthenticatedSession, createTriageRouter());
  app.use("/api/v1/voice-assessment", requireAuthenticatedSession, createVoiceAssessmentRouter());
  app.use("/api/v1/emr", requireAuthenticatedSession, createEmrRouter());
  app.use("/api/v1/help", createHelpApiRouter());
  // Mounted before the SPA catch-all below so /help is a genuinely separate
  // server-rendered page (not part of the Vite SPA bundle) - opening it in a
  // new tab never touches the Nurse Cockpit's or Service Manager Board's live
  // state in the other tab.
  app.use(createHelpPageRouter());

  if (spaIndexHtml) {
    app.use(express.static(staticRoot, { index: false }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.type("html").send(spaIndexHtml);
    });
  }

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });
  app.use(globalErrorHandler);

  return app;
}
