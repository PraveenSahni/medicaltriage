import {
  assertClinicalContentAllowedInEnvironment,
  isProductionEnvironment
} from "../src/services/clinicalContentReleasePolicy.js";
import { ClinicalContentPackageSchema } from "../src/types/clinicalContent.js";

function packageWithProvenance(provenance: Record<string, unknown>) {
  return ClinicalContentPackageSchema.parse({
    release: {
      name: "Policy test",
      version: "test",
      sourceType: "open-source-guideline",
      region: "QA",
      mode: "both"
    },
    protocols: [{
      id: "policy-test",
      titleEn: "Policy test",
      patientGroup: "adult",
      questions: [{
        id: "q1",
        acuityOrder: 1,
        severity: "Self-care",
        questionTextEn: "Test question?",
        dispositionCode: "SELF_CARE_WITH_CALLBACK_PRECAUTIONS",
        rationaleEn: "Test rationale."
      }],
      provenance: {
        generated: false,
        sourceKind: "test",
        sourceDocuments: [],
        contentNotice: "Test content only.",
        licensedContentIncluded: false,
        ...provenance
      }
    }]
  });
}

describe("clinical content release policy", () => {
  test("recognizes both supported production environment markers", () => {
    expect(isProductionEnvironment({ NODE_ENV: "production" })).toBe(true);
    expect(isProductionEnvironment({ APP_ENVIRONMENT: "production" })).toBe(true);
    expect(isProductionEnvironment({ APP_ENVIRONMENT: "simulation" })).toBe(false);
  });

  test("allows UAT-only content outside production", () => {
    const content = packageWithProvenance({
      usageStatus: "UAT_ONLY",
      productionEligible: false,
      clinicalStatus: "READY_FOR_QATAR_CLINICAL_REVIEW",
      requiresClinicalValidation: true
    });

    expect(() =>
      assertClinicalContentAllowedInEnvironment(content, { APP_ENVIRONMENT: "uat" })
    ).not.toThrow();
  });

  test("rejects UAT-only content in production", () => {
    const content = packageWithProvenance({
      usageStatus: "UAT_ONLY",
      productionEligible: false,
      clinicalStatus: "READY_FOR_QATAR_CLINICAL_REVIEW",
      requiresClinicalValidation: true
    });

    expect(() =>
      assertClinicalContentAllowedInEnvironment(content, { APP_ENVIRONMENT: "production" })
    ).toThrow(/production gate rejected 1 protocol/);
  });

  test("fails closed when production approval metadata is missing", () => {
    const content = packageWithProvenance({ requiresClinicalValidation: true });

    expect(() =>
      assertClinicalContentAllowedInEnvironment(content, { NODE_ENV: "production" })
    ).toThrow(/Production requires usageStatus=PRODUCTION/);
  });

  test("allows only fully approved production content", () => {
    const content = packageWithProvenance({
      usageStatus: "PRODUCTION",
      productionEligible: true,
      clinicalStatus: "PRODUCTION_APPROVED",
      requiresClinicalValidation: false
    });

    expect(() =>
      assertClinicalContentAllowedInEnvironment(content, { NODE_ENV: "production" })
    ).not.toThrow();
  });

  test("allows demoEligible UAT-only content when APP_ENVIRONMENT=demo", () => {
    const content = packageWithProvenance({
      usageStatus: "UAT_ONLY",
      productionEligible: false,
      clinicalStatus: "READY_FOR_QATAR_CLINICAL_REVIEW",
      requiresClinicalValidation: true,
      demoEligible: true
    });

    expect(() =>
      assertClinicalContentAllowedInEnvironment(content, { NODE_ENV: "production", APP_ENVIRONMENT: "demo" })
    ).not.toThrow();
  });

  test("still rejects demoEligible content in real production (APP_ENVIRONMENT=production)", () => {
    const content = packageWithProvenance({
      usageStatus: "UAT_ONLY",
      productionEligible: false,
      clinicalStatus: "READY_FOR_QATAR_CLINICAL_REVIEW",
      requiresClinicalValidation: true,
      demoEligible: true
    });

    expect(() =>
      assertClinicalContentAllowedInEnvironment(content, { NODE_ENV: "production", APP_ENVIRONMENT: "production" })
    ).toThrow(/production gate rejected 1 protocol/);
  });

  test("rejects content without demoEligible even in demo environment", () => {
    const content = packageWithProvenance({
      usageStatus: "UAT_ONLY",
      productionEligible: false,
      clinicalStatus: "READY_FOR_QATAR_CLINICAL_REVIEW",
      requiresClinicalValidation: true
    });

    expect(() =>
      assertClinicalContentAllowedInEnvironment(content, { NODE_ENV: "production", APP_ENVIRONMENT: "demo" })
    ).toThrow(/production gate rejected 1 protocol/);
  });
});
