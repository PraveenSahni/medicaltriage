/**
 * Qatar-specific routing destinations - the same 8 real localizedDispositions
 * already defined server-side (src/data/samplePhase1ClinicalContent.ts and
 * src/data/stccLicensedContent/index.ts, both backing getLocalizedDisposition()
 * in src/services/dispositionRouter.ts). That lookup isn't exposed through any
 * REST route the cockpit can call, so the same real names are mirrored here
 * rather than left as a blank field for the nurse to retype by hand.
 */
export const QATAR_DESTINATION_BY_CODE: Record<string, string> = {
  SIDRA_PEDIATRIC_ED: "Sidra Medicine Emergency Department",
  HMC_EMERGENCY_DEPARTMENT: "Nearest Hamad Medical Corporation Emergency Department",
  HMC_URGENT_REVIEW: "HMC urgent review pathway",
  IST_HIA_MIDFIELD_MEDICAL_CENTRE: "IST Medical Centre, HIA Midfield",
  IST_OLD_AIRPORT_MEDICAL_COMMISSION: "IST Old Airport Road Medical Commission",
  PHCC_URGENT_CARE_OR_TELECONSULT: "PHCC urgent care or IST teleconsult",
  OUTSTATION_TELECONSULT_ESCALATION: "IST outstation teleconsult escalation",
  SELF_CARE_WITH_CALLBACK_PRECAUTIONS: "Self-care with callback precautions"
};
