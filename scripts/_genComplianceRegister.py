import json, csv
from collections import Counter

with open("/tmp/register_rows.json", encoding="utf-8") as f:
    rows = json.load(f)

# Known, already-investigated rows this engagement (real triage, not fabricated).
# Everything not in this dict is explicitly marked "not yet triaged" rather than guessed.
KNOWN = {
    "NFR-011": dict(gap="none (closed)", category="Engineering closure", action="Soft-delete implemented (TriageQueueItem.deletedAt/deletedBy)", role="Backend eng", dep="none", effort="S", risk="Low", validation="tests/softDeleteAndOrgExport.test.ts + DB-verified scratch script", evidence="src/services/queueOrchestration.ts, prisma/migrations/20260804210206_add_queue_item_soft_delete"),
    "NFR-010": dict(gap="none (closed)", category="Engineering closure", action="Audit coverage extended to createQueueItem + MFA enrollment", role="Backend eng", dep="none", effort="S", risk="Low", validation="npx jest --runInBand (692 baseline)", evidence="src/services/queueOrchestration.ts:1936, src/services/securityAdmin.ts:2850,2895"),
    "NFR-116": dict(gap="none (closed)", category="Engineering closure", action="X-Request-Id propagated to outbound FHIR calls", role="Backend eng", dep="none", effort="S", risk="Low", validation="npx tsc --noEmit; jest suite", evidence="src/integration/fhirWriteback.ts, src/routes/emr.ts"),
    "IG.12": dict(gap="none (closed)", category="Documentation closure", action="Exit-plan sanitization section added", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/exit-plan.md"),
    "IS.01": dict(gap="none (closed)", category="Documentation closure", action="ISMS index doc created", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/information-security-management-system.md"),
    "IS.30": dict(gap="none (closed)", category="Documentation closure", action="Data management policy consolidated", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/data-management-policy.md"),
    "IS.05": dict(gap="none (closed)", category="Documentation closure", action="Regulatory due-diligence mapping created", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/regulatory-due-diligence-mapping.md"),
    "IS.23": dict(gap="none (closed)", category="Documentation closure", action="Same due-diligence mapping doc", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/regulatory-due-diligence-mapping.md"),
    "AR.23": dict(gap="none (closed)", category="Documentation closure", action="Same due-diligence mapping doc", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/regulatory-due-diligence-mapping.md"),
    "HR.03": dict(gap="none (closed)", category="Documentation closure", action="HR termination procedure documented", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review + code cross-check (setDirectoryStatusForEmployee)", evidence="docs/hr-access-termination-procedure.md"),
    "RM.03": dict(gap="none (closed)", category="Documentation closure", action="Risk-register review cadence defined", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/risk-register-2026-08-04.md"),
    "RM.04": dict(gap="none (closed)", category="Documentation closure", action="Risk-register review cadence defined", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/risk-register-2026-08-04.md"),
    "RM.05": dict(gap="none (closed)", category="Documentation closure", action="Risk-register review cadence defined", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/risk-register-2026-08-04.md"),
    "RM.06": dict(gap="none (closed)", category="Documentation closure", action="Risk-register review cadence defined", role="Tech writer", dep="none", effort="S", risk="Low", validation="Manual doc review", evidence="docs/risk-register-2026-08-04.md"),
    "CO.13": dict(gap="none (closed)", category="Engineering closure", action="Org-scoped export endpoint added", role="Backend eng", dep="none", effort="M", risk="Low", validation="tests/softDeleteAndOrgExport.test.ts", evidence="src/routes/admin.ts (GET /organizations/:orgId/export)"),
    "LG.04": dict(gap="none (closed)", category="Engineering closure", action="Org-scoped export endpoint (same as CO.13)", role="Backend eng", dep="none", effort="M", risk="Low", validation="tests/softDeleteAndOrgExport.test.ts", evidence="src/routes/admin.ts"),
    "IS.54": dict(gap="none (closed)", category="Engineering closure", action="Org-level LegalHold enforcement added", role="Backend eng", dep="none", effort="M", risk="Low", validation="jest suite", evidence="src/scripts/purgeExpiredQueueData.ts, src/scripts/fulfillPrivacyRequests.ts"),
    "IS.61": dict(gap="none (closed)", category="Engineering closure", action="Reveal-anomaly rolling-window detector added", role="Backend eng", dep="none", effort="M", risk="Low", validation="jest suite", evidence="src/services/securityAdmin.ts (checkRevealAnomalyRate)"),
    "NFR-119": dict(gap="Alert thresholds real but engineer-configured, not QR-facing", category="Production execution required", action="Would require live GCP Monitoring policy write access exposed to QR - out of scope without a customer-facing config UI/API decision", role="Cloud architect + product", dep="Business decision: build a QR-facing config surface?", effort="L", risk="Med (prod alert-policy writes)", validation="N/A until scoped", evidence="docs/qr-questionnaire-backlog-tracker.md 2026-08-05 entry"),
    "IS.07": dict(gap="No CI/production Terraform drift-detection pipeline exists", category="Cloud or infrastructure closure", action="Needs a scheduled terraform plan diff job in CI with drift alerting - no CI credentials configured for this today (confirmed via grep)", role="DevOps lead", dep="CI credentials / service account for drift job", effort="M", risk="Low once scoped", validation="Real CI run showing zero drift", evidence="docs/qr-questionnaire-backlog-tracker.md 2026-08-05 entry"),
    "IG.09": dict(gap="RetentionPolicy only covers TriageQueueItem/COMPLETED; AviationTriageEncounter and AuditEvent have no formally decided retention period", category="Business decision required", action="Retention decision paper needed for clinical-record and audit-trail retention periods", role="Clinical + Legal + Privacy + Business owner", dep="Formal retention-period decision", effort="S (once decided)", risk="Low", validation="N/A until decided", evidence="src/scripts/purgeExpiredQueueData.ts comments"),
    "NFR-189": dict(gap="No monthly SLI report script exists despite earlier task marked done; 3 of 4 SLIs monitored, error-rate is count-based not percentage-SLO", category="Engineering closure", action="Build real GCP Monitoring API query + email report (task #102, reopened)", role="Backend eng + SRE", dep="New GCP Monitoring API dependency", effort="M", risk="Low", validation="Representative-environment report delivery + audit log", evidence="docs/sli-slo-definitions.md; task #102"),
    "NFR-138": dict(gap="Load test found p95 approx 2.95-3.15s / p99 approx 4.3-4.5s on /queue and /protocols under only 10 concurrent users - misses the 3s target", category="Testing or validation closure", action="Performance-engineering exercise: baseline, root-cause (query/payload/index), fix, re-test", role="Backend eng + SRE", dep="none", effort="M-L", risk="Med", validation="docs/performance/performance-validation-report.md (to be produced)", evidence="docs/load-test-baseline-2026-08-04.md"),
    "NFR-152": dict(gap="Same load-test regression as NFR-138", category="Testing or validation closure", action="Same performance-engineering exercise", role="Backend eng + SRE", dep="none", effort="M-L", risk="Med", validation="Pending", evidence="docs/load-test-baseline-2026-08-04.md"),
    "NFR-156": dict(gap="Same load-test regression as NFR-138", category="Testing or validation closure", action="Same performance-engineering exercise", role="Backend eng + SRE", dep="none", effort="M-L", risk="Med", validation="Pending", evidence="docs/load-test-baseline-2026-08-04.md"),
}


def classify(row):
    rid = row["id"]
    if row["bucket"] == "Yes":
        return dict(gap="none", category="Fully compliant", action="No action - already Yes", role="", dep="", effort="", risk="", validation="Existing (see remarks)", evidence=row["remarks"][:200], final="Yes", status="Closed")
    if row["bucket"] == "N/A":
        return dict(gap="Not applicable", category="Valid N/A", action="No action", role="", dep="", effort="", risk="", validation="", evidence=row["remarks"][:200], final="N/A", status="Closed")
    if rid in KNOWN:
        k = KNOWN[rid]
        final = "Yes" if "(closed)" in k["gap"] else row["bucket"]
        status = "Closed" if "(closed)" in k["gap"] else ("Flagged - blocked" if k["category"] in ("Production execution required", "Business decision required", "Cloud or infrastructure closure") else "In triage")
        return dict(gap=k["gap"], category=k["category"], action=k["action"], role=k["role"], dep=k["dep"], effort=k["effort"], risk=k["risk"], validation=k["validation"], evidence=k["evidence"], final=final, status=status)
    return dict(gap="Not yet independently investigated this pass", category="Existing control - evidence missing (tentative, unverified)", action="Pending Stage 2 evidence discovery", role="TBD", dep="TBD", effort="TBD", risk="TBD", validation="Pending", evidence="", final=row["bucket"], status="Not yet triaged")


out_rows = []
for row in rows:
    c = classify(row)
    out_rows.append({
        "Tab": row["tab"],
        "ID": row["id"],
        "Title": row["title"],
        "Requirement Text": row["text"],
        "Mandatory": row["mandatory"],
        "Current Response": row["response"],
        "Current Remarks": row["remarks"][:300],
        "Bucket": row["bucket"],
        "Identified Gap": c["gap"],
        "Closure Category": c["category"],
        "Proposed Closure Action": c["action"],
        "Responsible Role": c["role"],
        "Dependency": c["dep"],
        "Effort": c["effort"],
        "Risk": c["risk"],
        "Validation Method": c["validation"],
        "Evidence Location": c["evidence"],
        "Target Response": c["final"],
        "Final Response": c["final"] if c["status"] == "Closed" else row["bucket"],
        "Status": c["status"],
    })

fields = list(out_rows[0].keys())
with open("C:/AiMlTriage/docs/qr-compliance/master-compliance-register.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(out_rows)

tab_counts = Counter(r["Tab"] for r in out_rows)
status_counts = Counter(r["Status"] for r in out_rows)

print("rows written:", len(out_rows))
print("by tab:", tab_counts)
print("by status:", status_counts)

with open("/tmp/register_stats.json", "w") as f:
    json.dump({"total": len(out_rows), "by_tab": dict(tab_counts), "by_status": dict(status_counts)}, f)
