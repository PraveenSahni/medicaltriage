import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { createAdminRouter } from "./routes/admin.js";
import { createAuthRouter } from "./routes/auth.js";
import { createCcpRouter } from "./routes/ccp.js";
import { createProtocolsRouter } from "./routes/protocols.js";
import { createStaffRouter } from "./routes/staff.js";
import { createTriageRouter } from "./routes/triage.js";
import { getCurrentClinicalContentPackage } from "./services/clinicalContent.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
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
      clinicalContentRelease: getCurrentClinicalContentPackage().release
    });
  });

  app.use("/api/v1/auth", createAuthRouter());
  app.use("/api/v1/admin", createAdminRouter());
  app.use("/api/v1/ccp", createCcpRouter());
  app.use("/api/v1/staff", createStaffRouter());
  app.use("/api/v1/protocols", createProtocolsRouter());
  app.use("/api/v1/triage", createTriageRouter());

  app.use((_req, res) => {
    res.status(404).json({ error: "Route not found" });
  });

  return app;
}
