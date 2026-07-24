import { canAccessNurseCockpit, canAccessServiceManagerBoard, type RoleCode } from "../cockpit/roles";

const ALL_ROLE_CODES: RoleCode[] = [
  "platform_super_administrator",
  "organization_administrator",
  "system_administrator",
  "security_administrator",
  "privacy_officer",
  "compliance_auditor",
  "clinical_governance_lead",
  "triage_service_manager",
  "call_intake_coordinator",
  "remote_triage_nurse",
  "senior_triage_nurse",
  "pediatric_triage_nurse",
  "teleconsult_physician",
  "occupational_health_clinician",
  "protocol_content_manager",
  "quality_reviewer",
  "integration_administrator",
  "reporting_analyst",
  "helpdesk_support"
];

describe("canAccessServiceManagerBoard", () => {
  it("allows only the triage_service_manager role", () => {
    for (const role of ALL_ROLE_CODES) {
      expect(canAccessServiceManagerBoard(role)).toBe(role === "triage_service_manager");
    }
  });

  it("denies undefined/null", () => {
    expect(canAccessServiceManagerBoard(undefined)).toBe(false);
    expect(canAccessServiceManagerBoard(null)).toBe(false);
  });
});

describe("dual access is preserved", () => {
  it("triage_service_manager still passes the existing Nurse Cockpit gate", () => {
    expect(canAccessNurseCockpit("triage_service_manager")).toBe(true);
  });
});
