import type { StaffProfile, StaffValidationResult } from "../types/triage.js";
import { resolveStaffProfile } from "./hrmsOracleAdapter.js";

export type PatientAgeResolution =
  | {
      ok: true;
      source: "staff" | "dependent";
      ageYears: number;
      ageMonths: number;
      dateOfBirthIso?: string;
      calculatedFrom: "HRMS_DATE_OF_BIRTH" | "HRMS_AGE_FIELD";
      biologicalSex?: "female" | "male" | "other" | "unknown";
    }
  | { ok: false; status: 400 | 404; reason: string };

// Simulation-mode Oracle Fusion HCM adapter (see hrmsOracleAdapter.ts and
// docs/oracle-fusion-hcm-integration.md). Still not a live Oracle connection -
// still simulation - but the underlying data and normalization now mirror the
// real Oracle REST resource shape/field names rather than an ad-hoc flat mock,
// so a live HTTP adapter can be substituted behind resolveStaffProfile() later
// without changing anything downstream of this file (this response shape,
// StaffProfile/StaffValidationResult, stays stable for the triage API).
export function getStaffProfileFromDirectory(istStaffId: string): StaffProfile | undefined {
  return resolveStaffProfile(istStaffId);
}

export async function validateStaffMember(istStaffId: string): Promise<StaffValidationResult> {
  const profile = getStaffProfileFromDirectory(istStaffId);
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

export function calculateAgeFromDateOfBirth(dateOfBirthIso: string, referenceDate = new Date()): {
  ageYears: number;
  ageMonths: number;
} {
  const dateOfBirth = new Date(dateOfBirthIso);
  if (Number.isNaN(dateOfBirth.getTime()) || dateOfBirth > referenceDate) {
    throw new Error("Invalid HRMS date of birth.");
  }

  let ageMonths =
    (referenceDate.getUTCFullYear() - dateOfBirth.getUTCFullYear()) * 12 +
    (referenceDate.getUTCMonth() - dateOfBirth.getUTCMonth());

  if (referenceDate.getUTCDate() < dateOfBirth.getUTCDate()) {
    ageMonths -= 1;
  }

  return {
    ageYears: Math.floor(Math.max(ageMonths, 0) / 12),
    ageMonths: Math.max(ageMonths, 0)
  };
}

export function resolvePatientAgeFromDirectory(args: {
  istStaffId: string;
  dependentId?: string;
  referenceDate?: Date;
}): PatientAgeResolution {
  const profile = getStaffProfileFromDirectory(args.istStaffId);
  if (!profile) {
    return {
      ok: false,
      status: 404,
      reason: "Staff member was not found in HRMS."
    };
  }

  if (profile.dutyStatus === "inactive" || profile.dutyStatus === "suspended") {
    return {
      ok: false,
      status: 400,
      reason: `Staff duty status is ${profile.dutyStatus}; manual verification is required.`
    };
  }

  const dependent = findDependent(profile, args.dependentId);
  if (args.dependentId && !dependent) {
    return {
      ok: false,
      status: 400,
      reason: "Dependent is not mapped to the validated staff member."
    };
  }

  const source = dependent ? "dependent" : "staff";
  const biologicalSex = dependent?.biologicalSex ?? profile.biologicalSex;
  const dateOfBirthIso = dependent?.dateOfBirthIso ?? profile.dateOfBirthIso;
  if (dateOfBirthIso) {
    return {
      ok: true,
      source,
      dateOfBirthIso,
      calculatedFrom: "HRMS_DATE_OF_BIRTH",
      biologicalSex,
      ...calculateAgeFromDateOfBirth(dateOfBirthIso, args.referenceDate)
    };
  }

  if (dependent) {
    return {
      ok: true,
      source,
      ageYears: dependent.age,
      ageMonths: dependent.age * 12,
      calculatedFrom: "HRMS_AGE_FIELD",
      biologicalSex
    };
  }

  return {
    ok: false,
    status: 400,
    reason: "HRMS did not return date of birth for the selected staff member."
  };
}

export async function resolvePatientAgeFromHrms(args: {
  istStaffId: string;
  dependentId?: string;
  referenceDate?: Date;
}): Promise<PatientAgeResolution> {
  return resolvePatientAgeFromDirectory(args);
}
