import type { StaffProfile, StaffValidationResult } from "../types/triage.js";

// Mock directory adapter. The production target is an Oracle Fusion HCM adapter;
// keep this response shape stable for the triage API.
const staffDirectory: Record<string, StaffProfile> = {
  "IST-10001": {
    id: "staff_demo_10001",
    istStaffId: "IST-10001",
    department: "Flight Operations",
    jobTitle: "Cabin Crew",
    dutyStatus: "active",
    insuranceProvider: "IST Staff Health Plan",
    insuranceEligibilityStatus: "eligible",
    insuranceLastChecked: "2026-07-01T08:00:00.000Z",
    dependents: [
      {
        id: "dep_demo_10001_child",
        relationshipType: "child",
        age: 8,
        biologicalSex: "female"
      }
    ]
  },
  "IST-20002": {
    id: "staff_demo_20002",
    istStaffId: "IST-20002",
    department: "Ground Services",
    jobTitle: "Ramp Supervisor",
    dutyStatus: "on-leave",
    insuranceProvider: "IST Staff Health Plan",
    insuranceEligibilityStatus: "pending-verification",
    insuranceLastChecked: "2026-06-20T08:00:00.000Z",
    dependents: []
  }
};

export async function validateStaffMember(istStaffId: string): Promise<StaffValidationResult> {
  const profile = staffDirectory[istStaffId.toUpperCase()];

  if (!profile) {
    return {
      valid: false,
      reason: "IST staff ID was not found in the mock HRMS directory."
    };
  }

  if (profile.dutyStatus === "inactive" || profile.dutyStatus === "suspended") {
    return {
      valid: false,
      profile,
      reason: `Staff duty status is ${profile.dutyStatus}; manual verification is required.`
    };
  }

  return { valid: true, profile };
}

export function findDependent(profile: StaffProfile, dependentId?: string) {
  if (!dependentId) {
    return undefined;
  }

  return profile.dependents.find((dependent) => dependent.id === dependentId);
}
