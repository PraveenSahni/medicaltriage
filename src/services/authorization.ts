import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedSession } from "../types/security.js";
import { getSession, parseSessionCookie } from "./securityAdmin.js";

export type AuthorizedRequest = Request & {
  securitySession?: AuthenticatedSession;
};

export function getRequestSession(req: Request): AuthenticatedSession | undefined {
  return getSession(parseSessionCookie(req.headers));
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
  return (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    const session = getRequestSession(req);
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!canPerformAction(session, permission)) {
      return res.status(403).json({ error: "Access denied" });
    }
    req.securitySession = session;
    return next();
  };
}

export function optionalSession(req: AuthorizedRequest, _res: Response, next: NextFunction) {
  req.securitySession = getRequestSession(req);
  return next();
}
