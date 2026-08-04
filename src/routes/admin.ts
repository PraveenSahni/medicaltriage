import { Router } from "express";
import { requireAnyPermission } from "../middleware/rbac.js";
import { getFeedbackSummary } from "../services/feedbackSummary.js";
import { exportOrganizationQueueData } from "../services/queueOrchestration.js";
import {
  getRequestSession,
  requirePermission,
  requireElevatedPermission,
  type AuthorizedRequest
} from "../services/authorization.js";
import { shouldUseDatabasePersistence } from "../config/runtime.js";
import { listPersistedAuditEvents } from "../services/persistence.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  decideReveal,
  endElevation,
  fetchApprovedRevealValue,
  FieldNotRevealableError,
  getSecurityDashboard,
  grantPermissionToRole,
  InvalidElevationCodeError,
  isElevated,
  listActiveSessionsForUser,
  listAuditEvents,
  listControlCenterModules,
  listEncryptionPolicies,
  listGovernanceWorkItems,
  listIntegrationConnectors,
  listPendingRevealRequests,
  listPermissions,
  listProtocolLibraryItems,
  listReportCatalogItems,
  listRevealDirectory,
  listResponsibilities,
  listRoles,
  listSsoProviders,
  listSupportQueueItems,
  listUsers,
  MfaNotEnrolledError,
  PermissionNotFoundError,
  requestElevation,
  requestReveal,
  RevealAlreadyFulfilledError,
  RevealExpiredError,
  RevealForbiddenError,
  RevealNotApprovedError,
  RevealRequestNotFoundError,
  revokePermissionFromRole,
  revokeSessionById,
  RoleNotFoundError,
  SelfApprovalError,
  SelfPermissionRevocationError,
  SessionNotFoundError,
  updateUserAccountStatus,
  UserNotFoundError,
  SelfStatusChangeError
} from "../services/securityAdmin.js";
import { AccountStatusSchema, RevealRequestSchema } from "../types/security.js";
import { z } from "zod";

const UpdateUserStatusRequestSchema = z.object({
  status: AccountStatusSchema,
  reason: z.string().min(1).max(500)
});

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

  // A compromised or scripted session shouldn't be able to mass-suspend
  // accounts arbitrarily fast - this is a sensitive, high-impact action
  // (account lockout), same reasoning as the existing login/staff-validate
  // rate limits.
  const userStatusRateLimit = rateLimit({
    name: "admin-user-status",
    windowMs: 60_000,
    maxRequests: 20
  });

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

  // Closes CSQ CO.13 ("isolate and recover data for a specific customer")
  // and LG.04 ("data portability... port data from one data center to
  // another") - a real, admin-gated export of every queue record belonging
  // to one specific tenant, independent of the requesting admin's own
  // tenant scope. PAM-elevation-gated since this is a privileged,
  // cross-tenant bulk-data action.
  router.get(
    "/organizations/:orgId/export",
    requireElevatedPermission("admin.users.manage"),
    async (req, res, next) => {
      try {
        const items = await exportOrganizationQueueData(req.params.orgId);
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="ist-health-org-export-${req.params.orgId}.json"`
        );
        return res.json({ exportedAtIso: new Date().toISOString(), organizationId: req.params.orgId, queueItems: items });
      } catch (error) {
        return next(error);
      }
    }
  );

  // Closes NFR-021's "terminate this one specific session" gap -
  // PATCH .../status revokes every session for a user at once; these two
  // routes list/terminate exactly one, without affecting the user's other
  // active sessions (e.g. on a different device).
  router.get("/users/:id/sessions", requirePermission("admin.users.manage"), (req, res) => {
    return res.json({ sessions: listActiveSessionsForUser(req.params.id) });
  });

  router.delete(
    "/sessions/:sessionId",
    requireElevatedPermission("admin.users.manage"),
    userStatusRateLimit,
    async (req: AuthorizedRequest, res, next) => {
      try {
        const actorUserId = req.securitySession?.user.id ?? "unknown";
        const actorActiveRole = req.securitySession?.activeRole ?? "unknown";
        const result = await revokeSessionById(req.params.sessionId, {
          userId: actorUserId,
          activeRole: actorActiveRole
        });
        return res.json({ terminated: true, ...result });
      } catch (error) {
        if (error instanceof SessionNotFoundError) {
          return res.status(404).json({ error: error.message });
        }
        return next(error);
      }
    }
  );

  // Real remediation action for access-entitlement review findings (CSQ
  // IS.18: "are all remediation actions recorded?") - suspends/reactivates
  // an account, writing a real AuditEvent for the change itself.
  router.patch("/users/:id/status", requireElevatedPermission("admin.users.manage"), userStatusRateLimit, async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = UpdateUserStatusRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid status update", details: parsed.error.flatten() });
      }
      const actorUserId = req.securitySession?.user.id ?? "unknown";
      const user = await updateUserAccountStatus(req.params.id, parsed.data.status, {
        userId: actorUserId,
        reason: parsed.data.reason
      });
      return res.json({ user });
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof SelfStatusChangeError) {
        return res.status(409).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.get("/roles", requirePermission("admin.roles.manage"), (_req, res) => {
    // Closes NFR-140 (caching) - the role/permission baseline itself only
    // changes on a deploy, but grant/revoke overrides via the endpoints
    // below (closing NFR-030/031/032) apply immediately; this short cache
    // window just means a change may take up to 5 minutes to show up here.
    res.set("Cache-Control", "private, max-age=300");
    return res.json({ roles: listRoles() });
  });

  // Closes NFR-030/031/032 - real, permission-gated, audited role-permission
  // mutation, no source change or redeploy required. Mirrors the PATCH
  // /users/:id/status endpoint's shape (dedicated error classes, rate
  // limiting, audit trail).
  const rolePermissionRateLimit = rateLimit({
    name: "admin-role-permission",
    windowMs: 60_000,
    maxRequests: 20
  });

  const RolePermissionMutationRequestSchema = z.object({
    permissionCode: z.string().min(1),
    reason: z.string().min(1).max(500)
  });

  router.post(
    "/roles/:code/permissions",
    requireElevatedPermission("admin.roles.manage"),
    rolePermissionRateLimit,
    async (req: AuthorizedRequest, res, next) => {
      try {
        const parsed = RolePermissionMutationRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid role-permission grant", details: parsed.error.flatten() });
        }
        const actorUserId = req.securitySession?.user.id ?? "unknown";
        const actorActiveRole = req.securitySession?.activeRole ?? "unknown";
        const role = await grantPermissionToRole(req.params.code, parsed.data.permissionCode, {
          userId: actorUserId,
          activeRole: actorActiveRole,
          reason: parsed.data.reason
        });
        return res.json({ role });
      } catch (error) {
        if (error instanceof RoleNotFoundError || error instanceof PermissionNotFoundError) {
          return res.status(404).json({ error: error.message });
        }
        return next(error);
      }
    }
  );

  router.delete(
    "/roles/:code/permissions/:permissionCode",
    requireElevatedPermission("admin.roles.manage"),
    rolePermissionRateLimit,
    async (req: AuthorizedRequest, res, next) => {
      try {
        const parsed = z.object({ reason: z.string().min(1).max(500) }).safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid role-permission revocation", details: parsed.error.flatten() });
        }
        const actorUserId = req.securitySession?.user.id ?? "unknown";
        const actorActiveRole = req.securitySession?.activeRole ?? "unknown";
        const role = await revokePermissionFromRole(req.params.code, req.params.permissionCode, {
          userId: actorUserId,
          activeRole: actorActiveRole,
          reason: parsed.data.reason
        });
        return res.json({ role });
      } catch (error) {
        if (error instanceof RoleNotFoundError || error instanceof PermissionNotFoundError) {
          return res.status(404).json({ error: error.message });
        }
        if (error instanceof SelfPermissionRevocationError) {
          return res.status(409).json({ error: error.message });
        }
        return next(error);
      }
    }
  );

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

  router.get("/audit-events", requirePermission("audit.events.view"), async (_req, res, next) => {
    try {
      if (shouldUseDatabasePersistence()) {
        return res.json({ events: await listPersistedAuditEvents() });
      }
      return res.json({ events: listAuditEvents() });
    } catch (error) {
      return next(error);
    }
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

  // Closes part of NFR-008 (Learnability) - a real, if partial, usability
  // signal (average nurse-submitted rating over time) where none existed
  // before. Not a formal usability study - see docs for that caveat.
  router.get(
    "/feedback-summary",
    requireAnyPermission(["reports.view", "operations.dashboard.view"]),
    async (_req, res) => {
      return res.json(await getFeedbackSummary());
    }
  );

  router.get(
    "/support",
    requireAnyPermission(["support.tickets.manage", "admin.users.manage"]),
    (_req, res) => {
      return res.json({ tickets: listSupportQueueItems() });
    }
  );

  // Real two-step approval-gated reveal (closes R-04) - a request is never
  // fulfilled in the same call that created it; a distinct second account
  // must separately approve it before the original requester can fetch the
  // value, once, within a short TTL.
  router.post("/reveal/request", requirePermission("privacy.reveal.request"), async (req: AuthorizedRequest, res, next) => {
    try {
      const parsed = RevealRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid reveal payload", details: parsed.error.flatten() });
      }
      if (!req.securitySession) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const result = await requestReveal(req.securitySession.user.id, parsed.data);
      return res.status(202).json(result);
    } catch (error) {
      if (error instanceof FieldNotRevealableError) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.get("/reveal/pending", requirePermission("privacy.reveal.approve"), (_req, res) => {
    return res.json({ requests: listPendingRevealRequests() });
  });

  router.post(
    "/reveal/:id/decision",
    requirePermission("privacy.reveal.approve"),
    async (req: AuthorizedRequest, res, next) => {
      try {
        const parsed = z.object({ decision: z.enum(["approved", "denied"]), comments: z.string().max(500).optional() }).safeParse(
          req.body
        );
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid reveal decision", details: parsed.error.flatten() });
        }
        if (!req.securitySession) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const result = await decideReveal(
          req.params.id,
          req.securitySession.user.id,
          parsed.data.decision,
          parsed.data.comments
        );
        return res.json(result);
      } catch (error) {
        if (error instanceof RevealRequestNotFoundError) {
          return res.status(404).json({ error: error.message });
        }
        if (error instanceof SelfApprovalError) {
          return res.status(409).json({ error: error.message });
        }
        return next(error);
      }
    }
  );

  router.get("/reveal/:id/value", requirePermission("privacy.reveal.request"), async (req: AuthorizedRequest, res, next) => {
    try {
      if (!req.securitySession) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const value = await fetchApprovedRevealValue(req.params.id, req.securitySession.user.id);
      return res.json({ value, remaskAfterSeconds: 0 });
    } catch (error) {
      if (error instanceof RevealRequestNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof RevealForbiddenError) {
        return res.status(403).json({ error: error.message });
      }
      if (
        error instanceof RevealNotApprovedError ||
        error instanceof RevealAlreadyFulfilledError ||
        error instanceof RevealExpiredError
      ) {
        return res.status(409).json({ error: error.message });
      }
      return next(error);
    }
  });

  // Real JIT privileged-access elevation (closes NFR-180's PAM capability
  // gap). Available to any authenticated session (elevation itself never
  // requires an already-privileged permission - it's the gate that grants
  // one).
  const elevationRateLimit = rateLimit({
    name: "admin-elevation",
    windowMs: 60_000,
    maxRequests: 10
  });

  router.post("/elevate", elevationRateLimit, async (req: AuthorizedRequest, res, next) => {
    try {
      const session = await getRequestSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      const parsed = z.object({ code: z.string().min(1) }).safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid elevation request", details: parsed.error.flatten() });
      }
      const result = await requestElevation(session, parsed.data.code);
      return res.json(result);
    } catch (error) {
      if (error instanceof MfaNotEnrolledError) {
        return res.status(403).json({ error: error.message });
      }
      if (error instanceof InvalidElevationCodeError) {
        return res.status(401).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.post("/de-elevate", async (req: AuthorizedRequest, res, next) => {
    try {
      const session = await getRequestSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      await endElevation(session);
      return res.json({ elevated: false });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/elevation/status", async (req: AuthorizedRequest, res, next) => {
    try {
      const session = await getRequestSession(req);
      if (!session) {
        return res.status(401).json({ error: "Authentication required" });
      }
      return res.json(isElevated(session.sessionId));
    } catch (error) {
      return next(error);
    }
  });

  // The "session recording" evidence for NFR-180 - a real, queryable audit
  // trail bounded by an elevation's grant/end events, not video/keystroke
  // capture.
  router.get(
    "/elevation/:elevationId/audit-trail",
    requirePermission("audit.events.view"),
    async (req: AuthorizedRequest, res, next) => {
      try {
        const events = shouldUseDatabasePersistence()
          ? await listPersistedAuditEvents(200, { userId: req.query.userId as string | undefined })
          : listAuditEvents({ userId: req.query.userId as string | undefined });
        const filtered = events.filter((event) => event.resource === req.params.elevationId);
        return res.json({ events: filtered });
      } catch (error) {
        return next(error);
      }
    }
  );

  return router;
}
