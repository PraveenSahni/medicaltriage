import { canAccessOrganizationRecord, isGlobalTenantExempt, organizationWhereClause } from "../src/services/tenantScope.js";
import type { AuthenticatedSession } from "../src/types/security.js";

function sessionWith(activeRole: string, organizationId?: string): AuthenticatedSession {
  return {
    sessionId: "sess-1",
    activeRole,
    permissions: [],
    responsibilities: [],
    expiresAtIso: new Date(Date.now() + 60_000).toISOString(),
    authMethod: "local",
    mfaVerified: true,
    user: {
      id: "user-1",
      fullName: "Test User",
      email: "test@irisstar.tech",
      mobile: "+97400000000",
      organization: "IST Tech",
      organizationId
    } as AuthenticatedSession["user"]
  };
}

describe("tenantScope helpers", () => {
  it("treats platform_super_administrator and system_administrator as globally exempt", () => {
    expect(isGlobalTenantExempt(sessionWith("platform_super_administrator", "org_a"))).toBe(true);
    expect(isGlobalTenantExempt(sessionWith("system_administrator", "org_a"))).toBe(true);
    expect(isGlobalTenantExempt(sessionWith("remote_triage_nurse", "org_a"))).toBe(false);
  });

  it("returns undefined (no filter) for globally-exempt roles", () => {
    expect(organizationWhereClause(sessionWith("platform_super_administrator", "org_a"))).toBeUndefined();
  });

  it("returns undefined (no filter) for an internal/system caller with no session", () => {
    expect(organizationWhereClause(undefined)).toBeUndefined();
  });

  it("denies all access when a non-exempt user has no bound organization", () => {
    expect(organizationWhereClause(sessionWith("remote_triage_nurse", undefined))).toEqual({
      id: "__no_organization_bound__"
    });
  });

  it("scopes non-exempt users to their own org plus legacy null-org rows", () => {
    expect(organizationWhereClause(sessionWith("remote_triage_nurse", "org_a"))).toEqual({
      OR: [{ organizationId: "org_a" }, { organizationId: null }]
    });
  });

  it("canAccessOrganizationRecord allows exempt roles regardless of record org", () => {
    expect(canAccessOrganizationRecord({ organizationId: "org_b" }, sessionWith("system_administrator", "org_a"))).toBe(
      true
    );
  });

  it("canAccessOrganizationRecord denies a non-exempt user with no bound org", () => {
    expect(canAccessOrganizationRecord({ organizationId: "org_a" }, sessionWith("remote_triage_nurse", undefined))).toBe(
      false
    );
  });

  it("canAccessOrganizationRecord allows legacy null-org records for any bound user", () => {
    expect(canAccessOrganizationRecord({ organizationId: null }, sessionWith("remote_triage_nurse", "org_a"))).toBe(true);
  });

  it("canAccessOrganizationRecord allows same-org and denies cross-org records", () => {
    const session = sessionWith("remote_triage_nurse", "org_a");
    expect(canAccessOrganizationRecord({ organizationId: "org_a" }, session)).toBe(true);
    expect(canAccessOrganizationRecord({ organizationId: "org_b" }, session)).toBe(false);
  });
});
