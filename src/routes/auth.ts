import { Router, type Response } from "express";
import { readAuthenticatedSession, signSessionJwt, type AuthenticatedRequest } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  authenticateLocal,
  buildSsoAuthorizationUrl,
  completeSsoLogin,
  confirmMfaEnrollment,
  enrollMfa,
  expiredSessionCookie,
  MfaChallengeExpiredError,
  MfaChallengeNotFoundError,
  parseSessionCookie,
  revokeSession,
  sessionCookie,
  SsoProviderNotConfiguredError,
  SsoStateInvalidError,
  testSsoProvider,
  UserNotFoundError,
  verifyMfaChallenge
} from "../services/securityAdmin.js";
import {
  LoginRequestSchema,
  MfaEnrollConfirmRequestSchema,
  MfaVerifyRequestSchema,
  SsoTestRequestSchema,
  type AuthenticatedSession
} from "../types/security.js";

const controlCenterRoles = new Set([
  "platform_super_administrator",
  "organization_administrator",
  "system_administrator",
  "security_administrator",
  "privacy_officer",
  "compliance_auditor",
  "clinical_governance_lead",
  "triage_service_manager",
  "protocol_content_manager",
  "quality_reviewer",
  "integration_administrator",
  "reporting_analyst",
  "helpdesk_support"
]);

// Shared by /login and /mfa/verify - both end a real authentication attempt
// by issuing the same session cookie, JWT, and redirect target. Extracted
// so MFA doesn't duplicate this logic.
function finalizeLoginResponse(req: AuthenticatedRequest, res: Response, session: AuthenticatedSession, rememberMe: boolean) {
  const secureCookie = req.secure || req.headers["x-forwarded-proto"] === "https";
  res.setHeader("Set-Cookie", sessionCookie(session.sessionId, rememberMe, secureCookie));
  return res.json({
    authenticated: true,
    session,
    accessToken: signSessionJwt(session),
    redirectTo: controlCenterRoles.has(session.activeRole) ? "admin" : "workspace"
  });
}

export function createAuthRouter(): Router {
  const router = Router();
  // The real, production-strict limit is 10/min per bucket. The Playwright
  // e2e harness (scripts/startE2eServer.ts, the only place that sets
  // APP_DATA_PROFILE=synthetic-e2e) runs several browser-engine projects
  // sequentially against one shared backend server/rate-limit bucket (see
  // playwright.config.ts's shared-server rationale) - real login attempts
  // across those projects legitimately exceed 10/min even though each one
  // individually is a normal, intentional test login, not abuse. Loosening
  // this only for the synthetic e2e profile keeps the real security behavior
  // untouched in mock/production/demo modes.
  const isSyntheticE2e = process.env.APP_DATA_PROFILE === "synthetic-e2e";
  const loginRateLimit = rateLimit({
    name: "auth-login",
    windowMs: 60_000,
    maxRequests: isSyntheticE2e ? 200 : 10
  });
  const mfaVerifyRateLimit = rateLimit({
    name: "auth-mfa-verify",
    windowMs: 60_000,
    maxRequests: isSyntheticE2e ? 200 : 10
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
        return res.status(result.forbidden ? 403 : result.locked ? 423 : 401).json({
          error: "Authentication failed",
          message: result.message,
          ...(result.mfaEnrollmentRequired ? { mfaEnrollmentRequired: true } : {})
        });
      }

      if ("mfaRequired" in result) {
        return res.status(202).json({ authenticated: false, mfaRequired: true, challengeId: result.challengeId });
      }

      return finalizeLoginResponse(req, res, result.session, parsed.data.rememberMe);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/mfa/verify", mfaVerifyRateLimit, async (req, res, next) => {
    try {
      const parsed = MfaVerifyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid MFA verification payload", details: parsed.error.flatten() });
      }
      const result = await verifyMfaChallenge(parsed.data.challengeId, parsed.data.code);
      if (!result.ok) {
        return res.status(result.locked ? 423 : 401).json({ error: "MFA verification failed", message: result.message });
      }
      // rememberMe was already captured when the challenge was created; the
      // cookie's max-age just mirrors whatever the initial /login request
      // requested (the session object itself already reflects it via TTL).
      return finalizeLoginResponse(req, res, result.session, false);
    } catch (error) {
      if (error instanceof MfaChallengeNotFoundError || error instanceof MfaChallengeExpiredError) {
        return res.status(410).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.post("/mfa/enroll", async (req, res, next) => {
    try {
      const session = await readAuthenticatedSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const enrollment = enrollMfa(session.user.id);
      return res.json(enrollment);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.post("/mfa/enroll/confirm", async (req, res, next) => {
    try {
      const session = await readAuthenticatedSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const parsed = MfaEnrollConfirmRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid MFA enrollment confirmation", details: parsed.error.flatten() });
      }
      const confirmed = confirmMfaEnrollment(session.user.id, parsed.data.code);
      if (!confirmed) {
        return res.status(401).json({ error: "Invalid authentication code" });
      }
      return res.json({ enrolled: true });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
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

  router.post("/sso/test", async (req, res, next) => {
    try {
      const parsed = SsoTestRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid SSO test payload", details: parsed.error.flatten() });
      }
      return res.json(await testSsoProvider(parsed.data.providerId));
    } catch (error) {
      return next(error);
    }
  });

  const ssoCallbackRateLimit = rateLimit({
    name: "auth-sso-callback",
    windowMs: 60_000,
    maxRequests: 20
  });

  router.get("/sso/:providerId/login", async (req, res, next) => {
    try {
      const redirectUri = `${req.protocol}://${req.get("host")}/api/v1/auth/sso/${req.params.providerId}/callback`;
      const authorizationUrl = await buildSsoAuthorizationUrl(req.params.providerId, redirectUri);
      return res.redirect(authorizationUrl);
    } catch (error) {
      if (error instanceof SsoProviderNotConfiguredError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.get("/sso/:providerId/callback", ssoCallbackRateLimit, async (req, res, next) => {
    try {
      const callbackUrl = new URL(req.originalUrl, `${req.protocol}://${req.get("host")}`);
      const result = await completeSsoLogin(
        req.params.providerId,
        callbackUrl,
        req.ip ?? "unknown",
        Array.isArray(req.headers["user-agent"]) ? req.headers["user-agent"].join(" ") : req.headers["user-agent"] ?? "unknown"
      );
      if (!result.ok) {
        return res.status(401).json({ error: "SSO login failed", message: result.message });
      }
      return finalizeLoginResponse(req, res, result.session, false);
    } catch (error) {
      if (error instanceof SsoProviderNotConfiguredError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof SsoStateInvalidError) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  });

  return router;
}
