// De-duplicated from the verbatim copies previously in AdminPortal.tsx and
// App.tsx - single source of truth for role display names.
export const roleLabels: Record<string, string> = {
  platform_super_administrator: "Platform Super Administrator",
  organization_administrator: "Organization Administrator",
  system_administrator: "System Administrator",
  security_administrator: "Security Administrator",
  privacy_officer: "Privacy Officer / DPO",
  compliance_auditor: "Compliance Auditor",
  clinical_governance_lead: "Clinical Governance Lead",
  triage_service_manager: "Triage Service Manager",
  call_intake_coordinator: "Call Intake Coordinator",
  remote_triage_nurse: "Remote Triage Nurse",
  senior_triage_nurse: "Senior Triage Nurse",
  pediatric_triage_nurse: "Pediatric Triage Nurse",
  teleconsult_physician: "Teleconsult Physician",
  occupational_health_clinician: "Occupational Health Clinician",
  protocol_content_manager: "Protocol Content Manager",
  quality_reviewer: "Quality Reviewer",
  integration_administrator: "Integration Administrator",
  reporting_analyst: "Reporting Analyst",
  helpdesk_support: "Helpdesk Support"
};

export function formatRole(role: string): string {
  return (
    roleLabels[role] ??
    role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase())
  );
}
