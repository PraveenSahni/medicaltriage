import { Router } from "express";
import { requireAnyPermission } from "../middleware/rbac.js";
import { requirePermission, type AuthorizedRequest } from "../services/authorization.js";
import {
  getSecurityDashboard,
  listAuditEvents,
  listControlCenterModules,
  listEncryptionPolicies,
  listGovernanceWorkItems,
  listIntegrationConnectors,
  listPermissions,
  listProtocolLibraryItems,
  listReportCatalogItems,
  listRevealDirectory,
  listResponsibilities,
  listRoles,
  listSsoProviders,
  listSupportQueueItems,
  listUsers,
  recordReveal
} from "../services/securityAdmin.js";
import { RevealRequestSchema } from "../types/security.js";

const controlCenterPermissions = [
  "admin.users.manage",
  "admin.roles.manage",
  "security.sso.manage",
  "privacy.assessment.manage",
  "crypto.policy.manage",
  "audit.events.view",
  "clinical.governance.approve",
  "protocol.library.manage",
  "integration.hrms.manage",
  "integration.emr.manage",
  "reports.view",
  "support.tickets.manage",
  "operations.dashboard.view"
];

export function createAdminRouter(): Router {
  const router = Router();

  router.get("/control-modules", requireAnyPermission(controlCenterPermissions), (req: AuthorizedRequest, res) => {
    const sessionPermissions = req.securitySession?.permissions ?? [];
    const modules = listControlCenterModules().filter((module) =>
      module.requiredPermissions.some((permission) => sessionPermissions.includes(permission))
    );
    return res.json({ modules });
  });

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

  router.get(
    "/reveal-directory",
    requireAnyPermission(["privacy.assessment.manage", "admin.users.manage"]),
    (_req, res) => {
      return res.json({ users: listRevealDirectory() });
    }
  );

  router.get(
    "/governance",
    requireAnyPermission(["clinical.governance.approve", "protocol.library.manage", "audit.events.view"]),
    (_req, res) => {
      return res.json({ items: listGovernanceWorkItems() });
    }
  );

  router.get(
    "/protocol-library",
    requireAnyPermission(["protocol.library.manage", "clinical.governance.approve"]),
    (_req, res) => {
      return res.json({ protocols: listProtocolLibraryItems() });
    }
  );

  router.get(
    "/integrations",
    requireAnyPermission(["integration.hrms.manage", "integration.emr.manage", "security.sso.manage"]),
    (_req, res) => {
      return res.json({ connectors: listIntegrationConnectors() });
    }
  );

  router.get(
    "/reports",
    requireAnyPermission(["reports.view", "operations.dashboard.view"]),
    (_req, res) => {
      return res.json({ reports: listReportCatalogItems() });
    }
  );

  router.get(
    "/support",
    requireAnyPermission(["support.tickets.manage", "admin.users.manage"]),
    (_req, res) => {
      return res.json({ tickets: listSupportQueueItems() });
    }
  );

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
