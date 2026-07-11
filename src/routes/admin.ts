import { Router } from "express";
import { requirePermission, type AuthorizedRequest } from "../services/authorization.js";
import {
  getSecurityDashboard,
  listAuditEvents,
  listEncryptionPolicies,
  listPermissions,
  listResponsibilities,
  listRoles,
  listSsoProviders,
  listUsers,
  recordReveal
} from "../services/securityAdmin.js";
import { RevealRequestSchema } from "../types/security.js";

export function createAdminRouter(): Router {
  const router = Router();

  router.get("/summary", requirePermission("audit.events.view"), (_req, res) => {
    return res.json({ dashboard: getSecurityDashboard() });
  });

  router.get("/users", requirePermission("admin.users.manage"), (_req, res) => {
    return res.json({ users: listUsers() });
  });

  router.get("/roles", requirePermission("admin.roles.manage"), (_req, res) => {
    return res.json({ roles: listRoles() });
  });

  router.get("/responsibilities", requirePermission("admin.roles.manage"), (_req, res) => {
    return res.json({ responsibilities: listResponsibilities() });
  });

  router.get("/permissions", requirePermission("admin.roles.manage"), (_req, res) => {
    return res.json({ permissions: listPermissions() });
  });

  router.get("/sso-providers", requirePermission("security.sso.manage"), (_req, res) => {
    return res.json({ providers: listSsoProviders() });
  });

  router.get("/encryption-policies", requirePermission("crypto.policy.manage"), (_req, res) => {
    return res.json({ policies: listEncryptionPolicies() });
  });

  router.get("/audit-events", requirePermission("audit.events.view"), (_req, res) => {
    return res.json({ events: listAuditEvents() });
  });

  router.post("/reveal", requirePermission("privacy.reveal.request"), async (req: AuthorizedRequest, res) => {
    const parsed = RevealRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid reveal payload", details: parsed.error.flatten() });
    }
    if (!req.securitySession) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const result = await recordReveal(parsed.data, req.securitySession);
    if (result.decision === "denied") {
      return res.status(403).json({ decision: result.decision, audit: result.audit });
    }
    return res.json({
      decision: result.decision,
      value: result.value,
      remaskAfterSeconds: 60,
      audit: result.audit
    });
  });

  return router;
}
