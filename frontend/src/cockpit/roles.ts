/**
 * Stable backend role codes (src/services/securityAdmin.ts `roles[].code`).
 * These are the exact strings the backend uses for `AdminUser.roles` /
 * `AuthenticatedSession.activeRole` - never match on display labels.
 */
export type RoleCode =
  | "platform_super_administrator"
  | "organization_administrator"
  | "system_administrator"
  | "security_administrator"
  | "privacy_officer"
  | "compliance_auditor"
  | "clinical_governance_lead"
  | "triage_service_manager"
  | "call_intake_coordinator"
  | "remote_triage_nurse"
  | "senior_triage_nurse"
  | "pediatric_triage_nurse"
  | "teleconsult_physician"
  | "occupational_health_clinician"
  | "protocol_content_manager"
  | "quality_reviewer"
  | "integration_administrator"
  | "reporting_analyst"
  | "helpdesk_support";

/**
 * "B - Business and Clinical Operations" allow-list: the only roles that may
 * see the Nurse Cockpit. Every other role code (admin/security/governance/
 * content/quality/integration/reporting/helpdesk) is explicitly excluded.
 */
export const NURSE_COCKPIT_ALLOWED_ROLES: ReadonlySet<RoleCode> = new Set([
  "triage_service_manager",
  "call_intake_coordinator",
  "remote_triage_nurse",
  "senior_triage_nurse",
  "pediatric_triage_nurse",
  "teleconsult_physician",
  "occupational_health_clinician",
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
