/**
 * Stable backend role codes (src/services/securityAdmin.ts `roles[].code`).
 * These are the exact strings the backend uses for `AdminUser.roles` /
 * `AuthenticatedSession.activeRole` - never match on display labels.
 */
export type RoleCode = "platform_super_administrator" | "triage_service_manager" | "remote_triage_nurse";

/**
 * "B - Business and Clinical Operations" allow-list: the only roles that may
 * see the Nurse Cockpit. Every other role code (admin) is explicitly excluded.
 */
export const NURSE_COCKPIT_ALLOWED_ROLES: ReadonlySet<RoleCode> = new Set([
  "remote_triage_nurse",
]);

export function isNurseCockpitRole(roleCode: string | undefined | null): roleCode is RoleCode {
  return Boolean(roleCode) && NURSE_COCKPIT_ALLOWED_ROLES.has(roleCode as RoleCode);
}

/**
 * A session may carry several assigned roles (`session.user.roles`) plus one
 * `activeRole` in effect. Cockpit access requires the active role to be on
 * the allow-list - a user merely holding an allowed role among many, without
 * it being active, must not see patient/queue data.
 */
export function canAccessNurseCockpit(activeRole: string | undefined | null): boolean {
  return isNurseCockpitRole(activeRole);
}

/**
 * Gate for the read-only Triage Service Manager Board - a distinct workspace
 * from the Nurse Cockpit, restricted to the manager role only. A session may
 * still hold other roles (see canAccessNurseCockpit above); this checks only
 * the active role, matching the same active-role-not-membership rule used for
 * cockpit access.
 */
export function canAccessServiceManagerBoard(activeRole: string | undefined | null): boolean {
  return activeRole === "triage_service_manager";
}
