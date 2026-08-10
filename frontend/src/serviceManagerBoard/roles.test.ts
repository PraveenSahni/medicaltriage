import { canAccessNurseCockpit, canAccessServiceManagerBoard, type RoleCode } from "../cockpit/roles";

const ALL_ROLE_CODES: RoleCode[] = ["platform_super_administrator", "triage_service_manager", "remote_triage_nurse"];

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
