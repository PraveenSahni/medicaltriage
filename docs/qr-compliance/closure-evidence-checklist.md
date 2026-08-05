# Closure Evidence Checklist

## Update 2026-08-05 (Batch 7A): 8 items resolved this pass

- [x] **PA.03, DR.06, DR.07, AR.19**: independently re-verified against
      Google Cloud's own published attestations, no contradicting
      evidence found -> normalized to exact "Yes" in the workbook.
- [x] **NFR-064, IS.41, IS.73, SD.06**: genuinely verified as
      non-applicable (Google's shared-responsibility model, or an
      internal remark inconsistency for NFR-064) -> reclassified to
      "N/A" in the workbook.
- [ ] **IS.11, AR.17**: reviewed and deliberately NOT reclassified -
      real gaps, remarks corrected for accuracy; still open, see
      `mandatory-action-register.md`.
- [ ] **NFR-040 (AI), NFR-044 (AI)**: reviewed against the "shadow AI"
      trap, confirmed already-honest existing answers; still open
      (Partial), no change made.

## Original checklist (below), unaffected items remain open

_Generated 2026-08-05. For every unresolved mandatory row, the exact
evidence needed before its questionnaire response is changed - a
checklist for whoever eventually applies the closure, not an
instruction to apply it now. No response was changed by this batch._

## How to use this checklist

For each row: when the "Evidence needed" checkbox items are all
genuinely true, apply the "Prepared closure remark" text (or a
refined version of it, if the real evidence differs in detail) to the
workbook, and update `mandatory-conversion-status.md`/`evidence-index.md`
accordingly. Do not check a box based on intent, plan, or partial
progress - only on completed, verifiable fact.

## Qatar-Airways-input rows

- [ ] **NFR-038**: QR has specified the SLA tier in writing -> update
      monitoring target if needed -> mark Yes with the confirmed tier
      cited.
- [ ] **NFR-039/040/041 (NFR tab)**: QR has specified RTO/RPO targets
      -> a real DR-region deployment exists -> a real switchover drill
      has been performed with measured (not estimated) RTO/RPO meeting
      the QR-specified target -> mark Yes with the drill report cited.
- [ ] **NFR-156**: QR has provided a real peak-load projection -> a
      load tier matching that projection has been run with zero
      errors -> a 60+ minute soak has been run -> mark Yes (or retain
      Partial with an honestly narrower scope if the QR target exceeds
      what's been validated).
- [ ] **NFR-185**: QR has confirmed `me-central1` (or wherever infra
      actually resides) is an approved region -> mark Yes citing the
      confirmation.
- [ ] **NFR-189**: A real QR recipient email is configured -> a real
      test/production email has been delivered and the
      `SLI_REPORT_EMAILED` audit event confirms it -> mark Yes citing
      the delivery evidence.
- [ ] **NFR-016 (UX)**: QR has provided brand assets -> a QR-themed
      instance has been built and verified -> mark Yes.
- [ ] **NFR-016/NFR-022**: Real QR IdP tenant credentials obtained ->
      SSO flow verified against the real tenant (not just the mock
      issuer) -> mark Yes.

## Business-decision rows

- [ ] **IG.09**: The retention decision template in
      `legal-privacy-action-pack.md` has been completed and signed by
      all 4 required approvers -> `RetentionPolicy` rows + purge jobs
      implemented and tested for `AviationTriageEncounter`/
      `AuditEvent` -> mark Yes citing the policy and the tested purge
      job.
- [ ] **NFR-119**: The self-service-vs-engineer-mediated decision has
      been made -> if engineer-mediated, mark this row's final honest
      state (current, already-deployed thresholds) rather than holding
      it open; if self-service, scope and build the API/UI, then mark
      Yes once built and tested.
- [ ] **NFR-010 (AI)**: A decision has been made on GCP Organization
      restructuring -> if yes, Security Command Center enabled and
      verified -> mark Yes; if no, retain No with the account-structure
      reason documented as a permanent limitation.
- [ ] **NFR-016 (AI)**: Go-ahead obtained to modify demo-environment
      secrets -> Secret Manager wired for demo the same way soc2
      already is -> mark Yes.
- [ ] **PA.02, HR.01, HR.02, IS.10, IS.20, IS.21, IS.27**: Each
      respective HR/policy document has been drafted and approved by
      HR Lead -> mark Yes citing the approved document.

## Legal/privacy rows

- [ ] **LG.01**: A real, dated, both-parties-signed NDA/confidentiality
      agreement exists and can be cited by filename/location -> mark
      Yes citing the executed document. **Do not mark Yes based on
      "standard expectations" language alone.**
- [ ] **IG.10, IS.52, IS.55, IS.62, DR.09**: Each respective decision
      paper has been drafted, reviewed, and approved by Legal
      Counsel/DPO -> mark Yes citing the approved paper/policy.

## Executive-approval rows

- [ ] **IS.02**: `docs/information-security-policy.md` has been
      drafted, and a named Executive Sponsor/CISO has signed and dated
      the approval statement in `executive-approval-pack.md` -> mark
      Yes citing the signed document, name, title, and date.

## Production-execution rows

- [ ] **IS.07**: A CI service-account credential has been provisioned
      -> the drift-detection workflow has run on schedule at least
      once with a real "zero drift" result -> mark Yes citing the CI
      run history.
- [ ] **UX/NFR-015**: `ist-triage-soc2` has been redeployed via
      canary-then-cutover -> `scripts/a11yAudit.mjs` re-run shows 0
      violations across all 5 pages -> mark Yes citing the re-run
      result.
- [ ] **UX/NFR-004**: Cloud SQL Auth Proxy tunnel access restored ->
      deeper e2e workflow fixtures fixed and passing -> mark Yes
      citing the passing suite.

## External-assurance rows

- [ ] **CO.01, CO.05, CO.07**: A real external audit has been
      performed and its findings can be shared -> mark Yes citing the
      audit report.
- [ ] **CO.02, IS.39**: An external network-layer pentest/scan has
      been performed -> mark Yes/Partial-to-Yes citing the report.
- [ ] **CO.03, NFR-058, NFR-184**: An external application-layer
      pentest (and/or formal ASVS assessment) has been performed ->
      mark Yes citing the report.
- [ ] **IS.40**: A recurring commercial vulnerability-scanning service
      has been onboarded and produced at least one real scan report ->
      mark Yes citing the report and cadence.
- [ ] **CO.08**: A formal SOC 2 Type II attestation has been issued by
      an accredited auditor -> mark Yes citing the attestation.
- [ ] **CO.09**: A formal ISO 27001 certificate has been issued -> mark
      Yes citing the certificate.
- [ ] **NFR-041 (AI)**: SOC 2 and/or ISO 27001 attestation exists (same
      evidence as CO.08/CO.09) -> mark Yes.
- [ ] **NFR-015 (UX)**: A formal manual accessibility conformance
      audit/VPAT has been completed -> mark Yes citing the VPAT.
- [ ] **PA.01, PA.03, PA.05, DR.06, DR.07, AR.19**: Google Cloud's own
      published attestation has been formally cited in the remark (no
      new external action needed - this is a documentation-only
      normalization) -> mark/confirm Yes citing the Google Trust
      Center reference.
- [ ] **NFR-039/040/041, DR.05**: A real DR-region deployment exists
      and a switchover drill has been performed with measured RTO/RPO
      -> mark Yes citing the drill report (shared checklist item with
      the QR-input section above, since QR's target also needs
      confirming).

## Reclassification-only rows (no external action, a documentation
## decision by CISO/Cloud Administrator)

- [ ] **NFR-064**: Confirmed no data-handoff pipeline of this kind is
      planned -> reclassify to N/A.
- [ ] **IS.59**: Confirmed no metadata-collection inspection tech
      exists in this architecture -> reclassify to N/A.
- [ ] **IS.41**: Confirmed whether OS-layer scanning responsibility is
      inherited from Google (Cloud Run is Google-managed) or genuinely
      N/A -> reclassify accordingly.
- [ ] **IS.11, IS.73, SD.06, AR.17**: Each confirmed as genuinely
      non-applicable to this serverless architecture -> reclassify to
      N/A.
- [ ] **NFR-044 (AI)**: Confirmed no live AI/GenAI request-response
      flow exists -> reclassify to N/A until one does.

## Engineering-closable rows (no approval needed beyond normal code
## review, per this batch's "no speculative code" instruction - only
## build these once actually prioritized)

- [ ] **IS.50, IS.66, DR.04, AR.03, AR.13, AR.21, CO.04**: Real
      existing controls documented with evidence -> mark Yes citing
      the documentation.
- [ ] **DR.05**: A recurring BCP test program built on the existing
      restore-drill precedent -> mark Yes citing at least one
      completed cycle of the recurring program (not just the plan).
- [ ] **NFR-076, NFR-078, NFR-004 (AI), NFR-118**: Real engineering
      work completed (field-level encryption, log-scrub audit, broader
      anomaly detection) and verified -> mark Yes citing the specific
      evidence.
- [ ] **LG.02**: Legal review confirms no third-party data access
      beyond Twilio metadata exists -> reclassify or mark Yes as
      appropriate once reviewed.

## Cannot-currently-comply rows (procurement/architecture-dependent,
## no near-term closure expected)

- [ ] **NFR-079, IG.15**: A DLP product has been procured and deployed.
- [ ] **IG.01**: A formal data-labelling standard has been adopted and
      implemented.
- [ ] **IG.06, PA.04**: Customer-configurable geo-routing has been
      built (a real architectural capability, not yet scoped).
- [ ] **IS.13**: A real offboarding-speed SLA/metric exists and is
      measured.
- [ ] **IS.33, IS.34**: CMEK/BYOK has been retrofitted (requires a
      Cloud SQL instance rebuild - a real migration project).
- [ ] **IS.45**: A commercial threat-detection product has been
      procured and deployed.
- [ ] **IS.53**: A forensic-readiness program/tool exists.
