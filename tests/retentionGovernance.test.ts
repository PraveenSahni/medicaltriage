import {
  approvedRetentionDays,
  excludeLegallyHeld,
  APPROVED_RETENTION_DECISION,
  APPROVED_RETENTION_DAYS
} from "../src/services/retentionGovernance.js";

const approvedPolicy = {
  code: "TRIAGE_QUEUE_ITEM_COMPLETED",
  status: "active",
  retentionPeriod: { days: APPROVED_RETENTION_DAYS, decisionReference: APPROVED_RETENTION_DECISION },
  deletionMode: "archive_then_delete",
  legalBasis: "Approved 2026-08-17"
};

describe("PR-011 retention governance", () => {
  it("accepts the approved active 365-day policy in execute mode", () => {
    expect(approvedRetentionDays(approvedPolicy, true)).toEqual({
      days: 365,
      source: "approved RetentionPolicy row (TRIAGE_QUEUE_ITEM_COMPLETED)"
    });
  });

  it.each([
    [null, "missing"],
    [{ ...approvedPolicy, status: "draft" }, "inactive"],
    [{ ...approvedPolicy, retentionPeriod: { days: 90, decisionReference: APPROVED_RETENTION_DECISION } }, "wrong period"],
    [{ ...approvedPolicy, retentionPeriod: { days: 365, decisionReference: "unapproved" } }, "wrong decision"],
    [{ ...approvedPolicy, legalBasis: "" }, "missing legal basis"]
  ])("fails closed in execute mode for %s (%s)", (policy, _label) => {
    expect(() => approvedRetentionDays(policy as typeof approvedPolicy | null, true)).toThrow(/requires an active 365-day/);
  });

  it("rejects command-line retention overrides in execute mode", () => {
    expect(() => approvedRetentionDays(approvedPolicy, true, 30)).toThrow(/rejects --retention-days overrides/);
  });

  it("allows a clearly labelled dry-run when the policy is not installed", () => {
    expect(approvedRetentionDays(null, false)).toMatchObject({ days: 365, source: expect.stringContaining("dry-run") });
  });

  it("excludes both record-level and organization-level legal holds", () => {
    const result = excludeLegallyHeld(
      [
        { id: "eligible", organizationId: "org-a" },
        { id: "record-held", organizationId: "org-a" },
        { id: "org-held", organizationId: "org-b" }
      ],
      new Set(["record-held"]),
      new Set(["org-b"])
    );
    expect(result.eligible.map((item) => item.id)).toEqual(["eligible"]);
    expect(result.excluded.map((item) => item.id)).toEqual(["record-held", "org-held"]);
  });

  it("allows a record after its hold is released (absent from active-hold sets)", () => {
    expect(excludeLegallyHeld([{ id: "released", organizationId: "org-a" }], new Set(), new Set()).eligible).toHaveLength(1);
  });
});
