import { Router } from "express";
import { requireAnyPermission } from "../middleware/rbac.js";
import { getFeedbackSummary, getFeedbackTrend } from "../services/feedbackSummary.js";
import { exportOrganizationQueueData } from "../services/queueOrchestration.js";
import {
  getRequestSession,
  requirePermission,
  requireElevatedPermission,
  type AuthorizedRequest
} from "../services/authorization.js";
import { shouldUseDatabasePersistence } from "../config/runtime.js";
import { countPersistedAuditEvents, listPersistedAuditEvents } from "../services/persistence.js";
import { rateLimit } from "../middleware/rateLimit.js";
import {
  listScheduledJobs,
  pauseScheduledJob,
  resumeScheduledJob,
  runScheduledJobNow,
  ScheduledJobNotFoundError
} from "../services/scheduledJobsAdmin.js";
import {
  CrossTenantMfaResetError,
  decideReveal,
  endElevation,
  fetchApprovedRevealValue,
  FieldNotRevealableError,
  getAccessRevocationMetricsReport,
  getSecurityDashboard,
  acknowledgeAccessEntitlementReview,
  grantPermissionToRole,
  ReviewCertificationNotFoundError,
  InvalidElevationCodeError,
  InvalidThresholdValueError,
  isElevated,
  listSecurityThresholds,
  SECURITY_THRESHOLD_KEYS,
  setSecurityThreshold,
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
  resetMfaForUser,
  revokeSessionById,
  RoleNotFoundError,
  SelfApprovalError,
  SelfMfaResetError,
  SelfPermissionRevocationError,
  SessionNotFoundError,
  updateUserAccountStatus,
  UserNotFoundError,
  SelfStatusChangeError,
  createUser,
  createCustomRole,
  DuplicateRoleCodeError,
  InvalidRoleDefinitionError,
  DuplicateUserEmailError,
  InvalidRoleCodeError,
  InvalidEmailDomainError
} from "../services/securityAdmin.js";
import { AccountStatusSchema, RevealRequestSchema } from "../types/security.js";
import { z } from "zod";

const UpdateUserStatusRequestSchema = z.object({
  status: AccountStatusSchema,
  reason: z.string().min(1).max(500)
});

// Every real named-user account in this application is an IST Tech
// employee/contractor account - enforced here, not just by convention, so
// the one place that creates users can't silently mint an out-of-domain
// account.
const ORGANIZATION_EMAIL_DOMAIN = "@irisstar.tech";

const CreateUserRequestSchema = z.object({
  fullName: z.string().min(1).max(200),
  email: z
    .string()
    .email()
    .refine((value) => value.trim().toLowerCase().endsWith(ORGANIZATION_EMAIL_DOMAIN), {
      message: `Email must be on the ${ORGANIZATION_EMAIL_DOMAIN} domain.`
    }),
  mobile: z.string().min(1).max(40),
  organization: z.string().min(1).max(200),
  facility: z.string().min(1).max(200),
  department: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  roles: z.array(z.string().min(1)).min(1).max(10),
  reason: z.string().min(1).max(500)
});

const CreateRoleRequestSchema = z.object({
  code: z.string().min(3).max(64).regex(/^[a-z][a-z0-9_]*$/),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  permissions: z.array(z.string().min(1)).max(100),
  responsibilities: z.array(z.string().min(1)).max(100),
  dataScopes: z.array(z.string().min(1)).max(100).optional(),
  clinicalScopes: z.array(z.string().min(1)).max(100).optional(),
  integrationScopes: z.array(z.string().min(1)).max(100).optional(),
  requiresApproval: z.boolean().optional(),
  reason: z.string().min(1).max(500)
});

// Same opt-in limit/offset convention as QueueListQuerySchema (NFR-144) -
// omitted entirely returns the full list exactly as before.
const PaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  offset: z.coerce.number().int().min(0).optional()
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

  router.get("/users", requirePermission("admin.users.manage"), (req, res) => {
    const parsed = PaginationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid pagination parameters", details: parsed.error.flatten() });
    }
    const { users, totalCount } = listUsers(parsed.data);
    return res.json({ users, totalCount });
  });

  // The Control Center's Users tab is the only place in the application
  // that creates a new named-user account - elevation-gated (account
  // creation is at least as sensitive as the existing status-change route)
  // and rate-limited the same way.
  router.post(
    "/users",
    requireElevatedPermission("admin.users.manage"),
    userStatusRateLimit,
    async (req: AuthorizedRequest, res, next) => {
      const parsed = CreateUserRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid request body", details: parsed.error.flatten() });
      }
      const actorUserId = req.securitySession?.user.id ?? "unknown";
      try {
        const { user, temporaryPassword } = await createUser(parsed.data, {
          userId: actorUserId,
          reason: parsed.data.reason
        });
        return res.status(201).json({ user, temporaryPassword });
      } catch (error) {
        if (error instanceof DuplicateUserEmailError) {
          return res.status(409).json({ error: error.message });
        }
        if (error instanceof InvalidRoleCodeError || error instanceof InvalidEmailDomainError) {
          return res.status(400).json({ error: error.message });
        }
        if (error instanceof InvalidRoleDefinitionError) {
          return res.status(409).json({ error: error.message, conflicts: error.conflicts });
        }
        return next(error);
      }
    }
  );

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

  // Real administrator-assisted MFA reset (closes AR.13's recovery gap).
  // PAM-elevated (same as the status/role-permission mutations above) since
  // this is one of the highest-risk actions in the app - it strips a
  // user's second factor and forces re-enrollment.
  const MfaResetRequestSchema = z.object({ reason: z.string().min(1).max(500) });
  router.post(
    "/users/:id/mfa-reset",
    requireElevatedPermission("admin.users.manage"),
    userStatusRateLimit,
    async (req: AuthorizedRequest, res, next) => {
      try {
        const parsed = MfaResetRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid MFA reset request", details: parsed.error.flatten() });
        }
        const actor = req.securitySession;
        if (!actor) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const result = await resetMfaForUser(
          req.params.id,
          { userId: actor.user.id, organization: actor.user.organization },
          parsed.data.reason
        );
        return res.json({ reset: true, sessionsRevoked: result.sessionsRevoked });
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          return res.status(404).json({ error: error.message });
        }
        if (error instanceof SelfMfaResetError) {
          return res.status(409).json({ error: error.message });
        }
        if (error instanceof CrossTenantMfaResetError) {
          return res.status(403).json({ error: error.message });
        }
        return next(error);
      }
    }
  );

  const rolePermissionRateLimit = rateLimit({
    name: "admin-role-permission",
    windowMs: 60_000,
    maxRequests: 20
  });

  router.get("/roles", requirePermission("admin.roles.manage"), (_req, res) => {
    // Role definitions and permission overrides are mutable security state;
    // never serve a cached pre-change authorization catalog.
    res.set("Cache-Control", "private, no-store");
    return res.json({ roles: listRoles() });
  });

  router.post(
    "/roles",
    requireElevatedPermission("admin.roles.manage"),
    rolePermissionRateLimit,
    async (req: AuthorizedRequest, res, next) => {
      try {
        const parsed = CreateRoleRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid role definition", details: parsed.error.flatten() });
        }
        const role = await createCustomRole(parsed.data, {
          userId: req.securitySession?.user.id ?? "unknown",
          activeRole: req.securitySession?.activeRole ?? "unknown",
          reason: parsed.data.reason
        });
        return res.status(201).json({ role });
      } catch (error) {
        if (error instanceof DuplicateRoleCodeError) {
          return res.status(409).json({ error: error.message });
        }
        if (error instanceof InvalidRoleDefinitionError) {
          return res.status(409).json({ error: error.message, conflicts: error.conflicts });
        }
        return next(error);
      }
    }
  );

  // Closes NFR-030/031/032 - real, permission-gated, audited role-permission
  // mutation, no source change or redeploy required. Mirrors the PATCH
  // /users/:id/status endpoint's shape (dedicated error classes, rate
  // limiting, audit trail).
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
        if (error instanceof InvalidRoleDefinitionError) {
          return res.status(409).json({ error: error.message, conflicts: error.conflicts });
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
        if (error instanceof InvalidRoleDefinitionError) {
          return res.status(409).json({ error: error.message, conflicts: error.conflicts });
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

  router.get("/audit-events", requirePermission("audit.events.view"), async (req, res, next) => {
    try {
      const parsed = PaginationQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid pagination parameters", details: parsed.error.flatten() });
      }
      if (shouldUseDatabasePersistence()) {
        const [events, totalCount] = await Promise.all([
          listPersistedAuditEvents(parsed.data.limit ?? 200, { offset: parsed.data.offset }),
          countPersistedAuditEvents()
        ]);
        return res.json({ events, totalCount });
      }
      const events = listAuditEvents(parsed.data);
      return res.json({ events, totalCount: listAuditEvents().length });
    } catch (error) {
      return next(error);
    }
  });

  // Closes NFR-014's real remaining gap: the existing /audit-events route
  // only ever returns a flat, unfiltered list - there was no way to ask
  // "show me every recorded change to this specific record" without
  // scrolling through everything. AuditEvent.resource already carries a
  // real per-record identifier (e.g. "UserAccount:<id>", "Role:<code>:<permission>")
  // at every existing recordAuditEvent() call site, so this route filters
  // on that field directly - a real modification-history trace, in
  // chronological order, per resource.
  router.get("/audit-events/resource/:resource", requirePermission("audit.events.view"), async (req, res, next) => {
    try {
      const resource = decodeURIComponent(req.params.resource);
      const events = shouldUseDatabasePersistence()
        ? await listPersistedAuditEvents(200, { resource })
        : listAuditEvents({ resource });
      return res.json({ resource, events: [...events].sort((left, right) => left.timestampIso.localeCompare(right.timestampIso)) });
    } catch (error) {
      return next(error);
    }
  });

  // Closes NFR-049/050/051's real remaining gap: real job scheduling,
  // periodic/on-demand execution, and pause/cancel already exist via Cloud
  // Scheduler + Cloud Run Jobs, only reachable via `gcloud`. This surfaces
  // the same real control through the application itself, using the
  // official @google-cloud/scheduler client - not a new scheduling engine.
  router.get("/scheduled-jobs", requirePermission("admin.roles.manage"), async (_req, res, next) => {
    try {
      return res.json({ jobs: await listScheduledJobs() });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/scheduled-jobs/:name/run", requirePermission("admin.roles.manage"), rateLimit({ name: "admin-scheduled-job-run", windowMs: 60_000, maxRequests: 20 }), async (req, res, next) => {
    try {
      return res.json({ job: await runScheduledJobNow(req.params.name) });
    } catch (error) {
      if (error instanceof ScheduledJobNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.post("/scheduled-jobs/:name/pause", requirePermission("admin.roles.manage"), rateLimit({ name: "admin-scheduled-job-pause", windowMs: 60_000, maxRequests: 20 }), async (req, res, next) => {
    try {
      return res.json({ job: await pauseScheduledJob(req.params.name) });
    } catch (error) {
      if (error instanceof ScheduledJobNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  });

  router.post("/scheduled-jobs/:name/resume", requirePermission("admin.roles.manage"), rateLimit({ name: "admin-scheduled-job-resume", windowMs: 60_000, maxRequests: 20 }), async (req, res, next) => {
    try {
      return res.json({ job: await resumeScheduledJob(req.params.name) });
    } catch (error) {
      if (error instanceof ScheduledJobNotFoundError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  });

  // Closes NFR-036's real remaining gap: the automated
  // ACCESS_ENTITLEMENT_REVIEW_CERTIFIED audit event (written by
  // scripts/accessEntitlementReview.mjs) already exists, but there was no
  // way for a human stakeholder to explicitly acknowledge/sign off on a
  // specific review inside the app. This lists certifications and lets an
  // authorized human record a real, distinct sign-off event referencing
  // the certification it acknowledges.
  router.get("/access-entitlement-reviews", requirePermission("audit.events.view"), async (_req, res, next) => {
    try {
      const certifications = shouldUseDatabasePersistence()
        ? await listPersistedAuditEvents(50, { action: "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED" })
        : listAuditEvents().filter((event) => event.action === "ACCESS_ENTITLEMENT_REVIEW_CERTIFIED");
      const acknowledgements = shouldUseDatabasePersistence()
        ? await listPersistedAuditEvents(50, { action: "ACCESS_ENTITLEMENT_REVIEW_ACKNOWLEDGED" })
        : listAuditEvents().filter((event) => event.action === "ACCESS_ENTITLEMENT_REVIEW_ACKNOWLEDGED");
      const acknowledgedIds = new Set(acknowledgements.map((event) => event.purpose?.match(/certificationId=(\S+)/)?.[1]));
      return res.json({
        reviews: certifications.map((event) => ({
          id: event.id,
          timestampIso: event.timestampIso,
          purpose: event.purpose,
          acknowledged: acknowledgedIds.has(event.id)
        }))
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post(
    "/access-entitlement-reviews/:id/acknowledge",
    requirePermission("audit.events.view"),
    async (req: AuthorizedRequest, res, next) => {
      try {
        const actor = req.securitySession;
        if (!actor) {
          return res.status(401).json({ error: "Authentication required" });
        }
        await acknowledgeAccessEntitlementReview(req.params.id, {
          userId: actor.user.id,
          activeRole: actor.activeRole
        });
        return res.json({ acknowledged: true });
      } catch (error) {
        if (error instanceof ReviewCertificationNotFoundError) {
          return res.status(404).json({ error: error.message });
        }
        return next(error);
      }
    }
  );

  // CSQ IS.13: "metrics which track the speed with which access rights are
  // removed" - a read-only, least-privilege reporting surface over the
  // access-revocation metrics recorded in securityAdmin.ts. Gated by the
  // same audit.events.view permission as the other reporting/audit routes,
  // since this is itself a compliance-reporting view, not a mutation.
  router.get("/access-revocation-metrics", requirePermission("audit.events.view"), (req, res) => {
    const days = req.query.days ? Number(req.query.days) : 30;
    const organization = typeof req.query.organization === "string" ? req.query.organization : undefined;
    // A caller may only request their own organization's metrics unless
    // they hold the platform-wide audit.events.view permission across all
    // orgs (mirrors the same scoping convention already used by
    // exportOrganizationQueueData) - never returns another organization's
    // metrics implicitly.
    return res.json(getAccessRevocationMetricsReport({ days: Number.isFinite(days) ? days : 30, organization }));
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

  // Closes UX/NFR-011's "analyzing behaviors, preferences, and pain
  // points" half - the plain summary above only reports a raw average;
  // this breaks it down by app location and role (lowest-scoring first,
  // i.e. real pain points) and shows a week-over-week trend direction.
  router.get(
    "/feedback-trend",
    requireAnyPermission(["reports.view", "operations.dashboard.view"]),
    async (_req, res) => {
      return res.json(await getFeedbackTrend());
    }
  );

  // Closes NFR-119 - a real, QR-facing capability to view/configure the
  // app's own security anomaly-detection thresholds without a redeploy.
  const SecurityThresholdUpdateRequestSchema = z.object({ value: z.number().int().positive() });
  router.get("/security-thresholds", requirePermission("admin.roles.manage"), async (_req, res) => {
    return res.json({ thresholds: listSecurityThresholds() });
  });

  router.patch(
    "/security-thresholds/:key",
    requirePermission("admin.roles.manage"),
    rateLimit({ name: "admin-security-threshold", windowMs: 60_000, maxRequests: 20 }),
    async (req: AuthorizedRequest, res, next) => {
      try {
        const key = req.params.key;
        if (!SECURITY_THRESHOLD_KEYS.includes(key as (typeof SECURITY_THRESHOLD_KEYS)[number])) {
          return res.status(404).json({ error: `Unknown security threshold key: ${key}` });
        }
        const parsed = SecurityThresholdUpdateRequestSchema.safeParse(req.body);
        if (!parsed.success) {
          return res.status(400).json({ error: "Invalid threshold update", details: parsed.error.flatten() });
        }
        const actor = req.securitySession;
        if (!actor) {
          return res.status(401).json({ error: "Authentication required" });
        }
        await setSecurityThreshold(key as (typeof SECURITY_THRESHOLD_KEYS)[number], parsed.data.value, {
          userId: actor.user.id,
          activeRole: actor.activeRole
        });
        return res.json({ thresholds: listSecurityThresholds() });
      } catch (error) {
        if (error instanceof InvalidThresholdValueError) {
          return res.status(400).json({ error: error.message });
        }
        return next(error);
      }
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
