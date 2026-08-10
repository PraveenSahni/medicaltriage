import type { AuthenticatedSession } from "../types/security.js";

// Shared multi-tenant scoping helpers, extracted so every Prisma read path
// that touches tenant data (encounters, staff, call-center records - not just
// the queue) applies the same rules. Mirrors queueOrchestration.ts's
// tenantWhereClause()/isGlobalTenantExempt() semantics exactly.

export function isGlobalTenantExempt(session: AuthenticatedSession): boolean {
  return session.activeRole === "platform_super_administrator";
}

// Where-clause fragment for any model carrying a plain `organizationId`
// column. Returns undefined for globally-exempt roles (no filter); a
// match-nothing clause for users with no bound organization (deny by
// default, matching requireTenantAccess()'s behavior); otherwise a filter
// that also admits legacy rows created before the column existed
// (organizationId null) - those rows predate multi-tenancy and have no
// owner to protect them for, so hiding them from everyone would only
// break existing single-tenant deployments.
export function organizationWhereClause(
  session: AuthenticatedSession | undefined
): Record<string, unknown> | undefined {
  if (!session) {
    // No session means an internal/system caller (seeds, backfills) - no filter.
    return undefined;
  }
  if (isGlobalTenantExempt(session)) {
    return undefined;
  }
  const organizationId = session.user.organizationId;
  if (!organizationId) {
    return { id: "__no_organization_bound__" };
  }
  return { OR: [{ organizationId }, { organizationId: null }] };
}

// Post-fetch guard for single-record access on org-scoped models.
export function canAccessOrganizationRecord(
  record: { organizationId: string | null },
  session: AuthenticatedSession
): boolean {
  if (isGlobalTenantExempt(session)) {
    return true;
  }
  if (!session.user.organizationId) {
    return false;
  }
  // Legacy rows (null org) are visible - see organizationWhereClause's note.
  return record.organizationId === null || record.organizationId === session.user.organizationId;
}
