import type { ClinicalContentPackage } from "../types/clinicalContent.js";

export function isProductionEnvironment(environment: NodeJS.ProcessEnv = process.env): boolean {
  return environment.NODE_ENV?.toLowerCase() === "production" ||
    environment.APP_ENVIRONMENT?.toLowerCase() === "production";
}

/**
 * Production clinical content is fail-closed. Missing governance metadata is
 * treated as unapproved, so legacy, synthetic, and UAT-only packages cannot be
 * activated merely because an environment variable or source path changed.
 */
export function assertClinicalContentAllowedInEnvironment(
  contentPackage: ClinicalContentPackage,
  environment: NodeJS.ProcessEnv = process.env
): void {
  if (!isProductionEnvironment(environment)) {
    return;
  }

  const blocked = contentPackage.protocols.filter((protocol) => {
    const provenance = protocol.provenance;
    return provenance?.usageStatus !== "PRODUCTION" ||
      provenance.productionEligible !== true ||
      provenance.clinicalStatus !== "PRODUCTION_APPROVED" ||
      provenance.requiresClinicalValidation !== false;
  });

  if (blocked.length > 0) {
    const sampleIds = blocked.slice(0, 10).map((protocol) => protocol.id).join(", ");
    const suffix = blocked.length > 10 ? ", ..." : "";
    throw new Error(
      `Clinical content production gate rejected ${blocked.length} protocol(s): ${sampleIds}${suffix}. ` +
      "Production requires usageStatus=PRODUCTION, productionEligible=true, " +
      "clinicalStatus=PRODUCTION_APPROVED, and requiresClinicalValidation=false."
    );
  }
}
