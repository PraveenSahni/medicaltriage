import { Router } from "express";
import {
  authenticateLocal,
  expiredSessionCookie,
  getSession,
  parseSessionCookie,
  revokeSession,
  sessionCookie,
  testSsoProvider
} from "../services/securityAdmin.js";
import { LoginRequestSchema, SsoTestRequestSchema } from "../types/security.js";

export function createAuthRouter(): Router {
  const router = Router();

  router.get("/session", (req, res) => {
    const session = getSession(parseSessionCookie(req.headers));
    if (!session) {
      return res.status(401).json({ authenticated: false });
    }
    return res.json({ authenticated: true, session });
  });

  router.post("/login", (req, res) => {
    const parsed = LoginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid login payload", details: parsed.error.flatten() });
    }

    const userAgent = req.headers["user-agent"];
    const result = authenticateLocal({
      username: parsed.data.username,
      password: parsed.data.password,
      rememberMe: parsed.data.rememberMe,
      simulateRole: parsed.data.simulateRole,
      ipAddress: req.ip ?? "unknown",
      device: Array.isArray(userAgent) ? userAgent.join(" ") : userAgent ?? "unknown"
    });

    if (!result.ok) {
      return res.status(result.locked ? 423 : 401).json({
        error: "Authentication failed",
        message: result.message
      });
    }

    const secureCookie = req.secure || req.headers["x-forwarded-proto"] === "https";
    res.setHeader("Set-Cookie", sessionCookie(result.session.sessionId, parsed.data.rememberMe, secureCookie));
    return res.json({
      authenticated: true,
      session: result.session,
      redirectTo: result.session.permissions.some((permission) =>
        ["admin.users.manage", "security.sso.manage", "audit.events.view"].includes(permission)
      )
        ? "admin"
        : "workspace"
    });
  });

  router.post("/logout", (req, res) => {
    revokeSession(parseSessionCookie(req.headers));
    res.setHeader("Set-Cookie", expiredSessionCookie());
    return res.json({ authenticated: false });
  });

  router.post("/sso/test", (req, res) => {
    const parsed = SsoTestRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid SSO test payload", details: parsed.error.flatten() });
    }
    return res.json(testSsoProvider(parsed.data.providerId));
  });

  return router;
}
