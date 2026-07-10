import type { InsuranceSnapshot, StaffProfile } from "../types/triage.js";

export async function verifyInsuranceEligibility(profile: StaffProfile): Promise<InsuranceSnapshot> {
  const status = profile.insuranceEligibilityStatus;
  const notes: string[] = [];

  if (status === "eligible") {
    notes.push("Coverage verified from mock IST eligibility cache.");
  } else if (status === "pending-verification") {
    notes.push("Eligibility requires payer confirmation before non-emergency booking.");
  } else if (status === "ineligible") {
    notes.push("Clinical advice should continue; financial counselling may be required.");
  } else {
    notes.push("No eligibility cache entry was available.");
  }

  return {
    provider: profile.insuranceProvider ?? "Unknown",
    status,
    lastCheckedIso: profile.insuranceLastChecked ?? new Date().toISOString(),
    notes
  };
}
