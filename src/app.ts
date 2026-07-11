import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import {
  assertRuntimeConfiguration,
  getAllowedCorsOrigins,
  isMockMode,
  runtimeModeSummary
} from "./config/runtime.js";
import { requireAuthenticatedSession } from "./middleware/auth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAuthRouter } from "./routes/auth.js";
import { createCcpRouter } from "./routes/ccp.js";
import { createProtocolsRouter } from "./routes/protocols.js";
import { createSimulationRouter } from "./routes/simulation.js";
import { createStaffRouter } from "./routes/staff.js";
import { createTriageRouter } from "./routes/triage.js";
import { getCurrentClinicalContentPackage } from "./services/clinicalContent.js";

export function createApp() {
  assertRuntimeConfiguration();
  const app = express();
  const allowedOrigins = getAllowedCorsOrigins();
  const corsOptions: CorsOptions = {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS origin is not approved for this environment."));
    }
  };
  const staffValidateRateLimit = rateLimit({
    name: "staff-validate",
    windowMs: 60_000,
    maxRequests: 30
  });

  app.use(helmet());
  app.use(cors(corsOptions));
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

  app.use("/api/v1/auth", createAuthRouter());
  app.use("/api/v1/admin", requireAuthenticatedSession, createAdminRouter());
  app.use("/api/v1/ccp", requireAuthenticatedSession, createCcpRouter());
  app.use("/api/v1/staff/validate", staffValidateRateLimit);
  app.use("/api/v1/staff", requireAuthenticatedSession, createStaffRouter());
  app.use("/api/v1/protocols", requireAuthenticatedSession, createProtocolsRouter());
  app.use("/api/v1/simulation", requireAuthenticatedSession, createSimulationRouter());
  app.use("/api/v1/triage", requireAuthenticatedSession, createTriageRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  return app;
}
