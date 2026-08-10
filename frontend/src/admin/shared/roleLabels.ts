// De-duplicated from the verbatim copies previously in AdminPortal.tsx and
// App.tsx - single source of truth for role display names.
export const roleLabels: Record<string, string> = {
  platform_super_administrator: "Platform Super Administrator",
  triage_service_manager: "Triage Service Manager",
  remote_triage_nurse: "Remote Triage Nurse"
};

export function formatRole(role: string): string {
  return (
    roleLabels[role] ??
    role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}
