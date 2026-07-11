import { Router } from "express";
import { readAuthenticatedSession, signSessionJwt } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  authenticateLocal,
  expiredSessionCookie,
  parseSessionCookie,
  revokeSession,
  sessionCookie,
  testSsoProvider
} from "../services/securityAdmin.js";
import { LoginRequestSchema, SsoTestRequestSchema } from "../types/security.js";

export function createAuthRouter(): Router {
  const router = Router();
  const loginRateLimit = rateLimit({
    name: "auth-login",
    windowMs: 60_000,
    maxRequests: 10
  });

  router.get("/session", async (req, res, next) => {
    try {
      const session = await readAuthenticatedSession(req);
      if (!session) {
        return res.status(401).json({ authenticated: false });
      }
      return res.json({ authenticated: true, session });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/login", loginRateLimit, async (req, res, next) => {
    try {
      const parsed = LoginRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid login payload", details: parsed.error.flatten() });
      }

      const userAgent = req.headers["user-agent"];
      const result = await authenticateLocal({
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
        accessToken: signSessionJwt(result.session),
        redirectTo: result.session.permissions.some((permission) =>
          ["admin.users.manage", "security.sso.manage", "audit.events.view"].includes(permission)
        )
          ? "admin"
          : "workspace"
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      await revokeSession(parseSessionCookie(req.headers));
      res.setHeader("Set-Cookie", expiredSessionCookie());
      return res.json({ authenticated: false });
    } catch (error) {
      return next(error);
    }
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
