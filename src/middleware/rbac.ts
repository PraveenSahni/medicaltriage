import type { NextFunction, Response } from "express";
import type { AuthorizedRequest } from "../services/authorization.js";

export function requireActiveRole(roles: string[]) {
  const allowed = new Set(roles);
  return (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    const session = req.securitySession;
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowed.has(session.activeRole)) {
      return res.status(403).json({
        error: "Access denied",
        activeRole: session.activeRole,
        allowedRoles: roles
      });
    }
    return next();
  };
}

export function requireAnyPermission(permissions: string[]) {
  return (req: AuthorizedRequest, res: Response, next: NextFunction) => {
    const session = req.securitySession;
    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!permissions.some((permission) => session.permissions.includes(permission))) {
      return res.status(403).json({
        error: "Access denied",
        activeRole: session.activeRole,
        requiredPermissions: permissions
      });
    }
    return next();
  };
}
