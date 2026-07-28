import { Router } from "express";
import { z } from "zod";
import { readAuthenticatedSession, sessionFromTokenString } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  auditVaultAccess,
  checkRestrictedAccessPassword,
  issueVaultAccessToken,
  restrictedVaultEntries,
  verifyVaultAccessToken
} from "../services/helpRestrictedAccess.js";
import { HELP_LIBRARY_CLIENT_JS, renderHelpLibraryHtml } from "../services/helpLibraryContent.js";

// Existing permissions only (no new permission strings introduced) - deliberately
// excludes triage.queue.manage/operations.dashboard.view/reports.view/
// audit.events.view, all of which triage_service_manager also holds, so the
// vault stays out of reach for Nurse Cockpit and Service Manager Board users
// per the "not exposed to Nurse or Service Manager roles" requirement.
const RESTRICTED_VAULT_PERMISSIONS = [
  "admin.roles.manage",
  "security.sso.manage",
  "privacy.assessment.manage",
  "clinical.governance.approve",
  "crypto.policy.manage",
  "reports.export"
];

function hasRestrictedVaultAccess(permissions: string[]): boolean {
  return permissions.some((permission) => RESTRICTED_VAULT_PERMISSIONS.includes(permission));
}

function parseCookie(cookieHeader: string | undefined, name: string): string | undefined {
  if (!cookieHeader) return undefined;
  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match?.slice(name.length + 1);
}

const VerifyRequestSchema = z.object({
  password: z.string().min(1).max(256)
});

/**
 * Serves the standalone Help & Library page. Mounted at a top-level route
 * (not under /api/v1) so `<a href="/help" target="_blank">` opens a genuinely
 * separate page/tab, never interfering with the SPA's own state (Nurse
 * Cockpit or Service Manager Board keep running exactly as they were).
 */
export function createHelpPageRouter(): Router {
  const router = Router();

  router.get("/help", async (req, res, next) => {
    try {
      // A plain `<a href target="_blank">` click is a genuine top-level
      // browser navigation - it can carry cookies but never a custom
      // Authorization header (unlike the SPA's own fetch calls, which
      // installBearerTokenFetch already patches). On the custom domain,
      // Firebase Hosting's rewrite-to-Cloud-Run proxy does not forward the
      // Cookie request header at all (confirmed live), so cookie-based auth
      // silently fails here even immediately after a successful login. The
      // query-string token is the one thing a plain navigation CAN carry -
      // the frontend link is built with it (CockpitUtilityBar.tsx /
      // TriageServiceManagerBoard.tsx) whenever an access token is available.
      const queryToken = typeof req.query.token === "string" ? req.query.token : undefined;
      const session = (await readAuthenticatedSession(req)) ?? (await sessionFromTokenString(queryToken));
      if (!session) {
        res.status(401).type("html").send(
          "<!doctype html><title>Sign in required</title><body style=\"font-family:system-ui;padding:40px\">" +
            "<h1>Sign in required</h1><p>Please sign in to the IST Health Teletriage application, then reopen Help from the topbar.</p></body>"
        );
        return;
      }
      const html = renderHelpLibraryHtml(session, hasRestrictedVaultAccess(session.permissions), queryToken ?? "");
      res.type("html").send(html);
    } catch (error) {
      next(error);
    }
  });

  // Same-origin static script for the Help page - kept as a separate route
  // (rather than an inline <script> block) so it satisfies the app's existing
  // CSP `script-src 'self'` without any relaxation of that policy.
  router.get("/help.js", (_req, res) => {
    res.type("application/javascript").send(HELP_LIBRARY_CLIENT_JS);
  });

  return router;
}

/**
 * Restricted-vault API: secondary-password verification and metadata-only
 * vault content, both requiring the existing authenticated session in
 * addition to their own checks. Mounted under /api/v1/help alongside the
 * existing requireAuthenticatedSession-gated routers in app.ts.
 */
export function createHelpApiRouter(): Router {
  const router = Router();

  const verifyRateLimit = rateLimit({
    name: "help-restricted-verify",
    windowMs: 15 * 60_000,
    maxRequests: 5
  });

  router.post("/restricted-access/verify", verifyRateLimit, async (req, res, next) => {
    try {
      const session = await readAuthenticatedSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!hasRestrictedVaultAccess(session.permissions)) {
        auditVaultAccess({
          action: "verify_attempt",
          userId: session.user.id,
          role: session.activeRole,
          sessionId: session.sessionId,
          granted: false,
          reason: "role_not_permitted"
        });
        return res.status(403).json({ error: "Your role is not authorized for the Restricted Operations Vault." });
      }
      const parsed = VerifyRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "A password is required." });
      }
      const granted = checkRestrictedAccessPassword(parsed.data.password);
      auditVaultAccess({
        action: "verify_attempt",
        userId: session.user.id,
        role: session.activeRole,
        sessionId: session.sessionId,
        granted,
        reason: granted ? undefined : "invalid_password"
      });
      if (!granted) {
        return res.status(401).json({ error: "Invalid restricted-access password." });
      }
      const { cookieName, token, maxAgeMs } = issueVaultAccessToken(session);
      res.setHeader(
        "Set-Cookie",
        `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/v1/help; Max-Age=${Math.floor(maxAgeMs / 1000)}${
          process.env.NODE_ENV === "production" ? "; Secure" : ""
        }`
      );
      return res.json({ granted: true, expiresInSeconds: Math.floor(maxAgeMs / 1000) });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/restricted-vault", async (req, res, next) => {
    try {
      const session = await readAuthenticatedSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!hasRestrictedVaultAccess(session.permissions)) {
        return res.status(403).json({ error: "Your role is not authorized for the Restricted Operations Vault." });
      }
      const vaultToken = parseCookie(req.headers.cookie, "help_vault_token");
      if (!verifyVaultAccessToken(vaultToken, session)) {
        return res.status(401).json({ error: "Restricted-access verification required or expired." });
      }
      auditVaultAccess({
        action: "vault_view",
        userId: session.user.id,
        role: session.activeRole,
        sessionId: session.sessionId,
        granted: true
      });
      return res.json({ entries: restrictedVaultEntries });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
