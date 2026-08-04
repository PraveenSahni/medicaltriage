import type { Request, Response, NextFunction } from "express";
import { readAuthenticatedSession } from "../middleware/auth.js";
import type { AuthenticatedSession } from "../types/security.js";
import { isElevated, PRIVILEGED_PERMISSIONS } from "./securityAdmin.js";

export type AuthorizedRequest = Request & {
  securitySession?: AuthenticatedSession;
};

export async function getRequestSession(req: Request): Promise<AuthenticatedSession | undefined> {
  return readAuthenticatedSession(req);
}

export function canPerformAction(session: AuthenticatedSession | undefined, permission: string): boolean {
  if (!session) {
    return false;
  }
  if (session.user.accountStatus !== "active") {
    return false;
  }
  return session.permissions.includes(permission);
}

export function canAccessModule(session: AuthenticatedSession | undefined, module: string): boolean {
  if (!session || session.user.accountStatus !== "active") {
    return false;
  }
  const normalizedModule = module.toLowerCase();
  return session.permissions.some((permission) => permission.toLowerCase().startsWith(`${normalizedModule}.`));
}

export function canRevealPersonalData(session: AuthenticatedSession | undefined): boolean {
  return canPerformAction(session, "privacy.reveal.request") || canPerformAction(session, "admin.users.manage");
}

export function requirePermission(permission: string) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const session = await getRequestSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!canPerformAction(session, permission)) {
        return res.status(403).json({ error: "Access denied" });
      }
      req.securitySession = session;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

// Closes NFR-180's JIT-elevation gap - a second, time-boxed layer on top of
// requirePermission() for the highest-risk mutation permissions (see
// PRIVILEGED_PERMISSIONS in securityAdmin.ts). Non-privileged permissions
// behave identically to requirePermission(); a privileged one additionally
// requires the session to hold a current, MFA-verified elevation.
export function requireElevatedPermission(permission: string) {
  return async (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    try {
      const session = await getRequestSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      if (!canPerformAction(session, permission)) {
        return res.status(403).json({ error: "Access denied" });
      }
      if (PRIVILEGED_PERMISSIONS.has(permission) && !isElevated(session.sessionId).elevated) {
        return res.status(403).json({ error: "Elevation required", elevationRequired: true });
      }
      req.securitySession = session;
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export async function optionalSession(req: AuthorizedRequest, _res: Response, next: NextFunction) {
  try {
    req.securitySession = await getRequestSession(req);
    return next();
  } catch (error) {
    return next(error);
  }
}
