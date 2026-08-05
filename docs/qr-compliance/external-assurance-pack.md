# External Assurance Pack

_Generated 2026-08-05. Rows that genuinely cannot reach "Yes" through
more engineering or documentation - each asks whether a real external
party's action has occurred, and it hasn't yet. Grouped by assurance
type per this batch's instruction. No further engineering action is
proposed for any row in this pack - each needs a business decision to
engage a real external party._

## 1. Penetration testing (application-layer)

**Rows**: CO.03 (independent application pentest), NFR-184 (optional
tab, independent pentest - listed for completeness though not
mandatory).

**Scope**: black-box or grey-box penetration test of
`triagedsoc2.irisstar.tech` (or a dedicated pentest environment
cloned from it), covering the full authenticated application surface
(triage queue, cockpit, admin/RBAC, MFA/SSO, PAM elevation, reveal
workflow, data export).

**Required provider qualification**: an accredited penetration-testing
firm (e.g. CREST-certified or equivalent recognized accreditation),
with healthcare/PII-handling experience preferred given the clinical
data involved.

**Evidence expected**: a formal, dated pentest report naming scope,
methodology, findings (with CVSS or equivalent severity ratings), and
remediation status for each finding.

**Estimated duration**: typically 1-2 weeks of active testing plus
1-2 weeks for reporting/remediation-verification, once scoped.

**Internal preparation required**: provide the firm a scoped test
environment (recommend the existing `triagedsoc2` environment,
already isolated from the live demo), test accounts (the 19 real
seeded roles already exist), and this engagement's own internal DAST
findings (`scripts/dastProbe.mjs` output) as a starting baseline so the
external test can focus on what internal tooling cannot see.

**Questionnaire rows affected**: CO.03 (primary), NFR-058 (OWASP ASVS -
often bundled into a pentest engagement's scope), NFR-184.

## 2. Penetration testing (network-layer)

**Rows**: CO.02 (currently Partial via internal DAST substitute),
CO.06 (optional tab), IS.39 (network-layer vulnerability scan).

**Scope**: external network-layer scan/pentest of the GCP project's
exposed surface (Cloud Run ingress, any exposed Cloud SQL endpoints,
DNS/Firebase Hosting configuration).

**Required provider qualification**: same as application-layer, or a
combined engagement covering both layers.

**Evidence expected**: a network scan/pentest report distinct from the
application-layer report, or a combined report with clearly separated
sections.

**Estimated duration**: typically shorter than application-layer
testing (days, not weeks) if scoped as an automated/managed vuln-scan
service rather than a manual pentest.

**Internal preparation required**: minimal - mostly requires scoping
the exact set of external IPs/domains in play (`triagedsoc2` and
`triaged` Firebase Hosting sites, Cloud Run direct URLs).

**Questionnaire rows affected**: CO.02, CO.06, IS.39.

## 3. Application-layer vulnerability scanning (recurring, not one-off)

**Rows**: IS.40 (currently Partial via `pnpm audit` + internal DAST
probe).

**Scope**: a recurring, commercial-grade application vulnerability
scanner (e.g. an authenticated DAST product) run on a schedule, not a
one-time pentest.

**Required provider qualification**: a reputable DAST/vulnerability-
scanning vendor (e.g. the kind of tool a SOC 2 auditor would expect to
see referenced in continuous-monitoring evidence).

**Evidence expected**: recurring scan reports (e.g. monthly) with a
tracked remediation SLA for findings by severity.

**Estimated duration**: ongoing/subscription-based, not a single
engagement - budget and procurement decision, not a time-boxed project.

**Internal preparation required**: none beyond selecting and
onboarding a vendor; the existing internal DAST probe already
demonstrates what categories of finding this would need to cover.

**Questionnaire rows affected**: IS.40.

## 4. SOC 2 Type II attestation

**Rows**: CO.08.

**Scope**: a formal SOC 2 Type II audit covering the 5 Trust Service
Criteria, examining controls over a real observation period (typically
6-12 months).

**Required provider qualification**: a licensed CPA firm accredited to
perform SOC 2 examinations.

**Evidence expected**: a SOC 2 Type II report (the actual attestation
document), typically shared under NDA with customers/prospects rather
than published openly.

**Estimated duration**: the observation period itself is 6-12 months;
the audit/reporting process following it is typically 6-10 weeks.

**Internal preparation required**: this entire engagement's
remediation work (risk register, gap analysis, control-matrix
documentation, real technical controls built) is genuine readiness
evidence for exactly this - recommend engaging an auditor for a
readiness/gap assessment first, then starting the formal observation
period once readiness is confirmed.

**Questionnaire rows affected**: CO.08 (primary), CO.01, CO.05, CO.07,
NFR-041 (AI tab).

## 5. ISO 27001 certification

**Rows**: CO.09.

**Scope**: a formal ISO 27001 certification audit (Stage 1 + Stage 2)
against the ISMS this engagement's work partially evidences.

**Required provider qualification**: an accredited certification body
(UKAS, ANAB, or equivalent accreditation).

**Evidence expected**: an ISO 27001 certificate and Statement of
Applicability.

**Estimated duration**: typically 3-6 months from ISMS-readiness
review through certification audit, depending on organizational
maturity.

**Internal preparation required**: same readiness work as SOC 2 above;
these two certifications are frequently pursued together or
sequentially given overlapping control evidence.

**Questionnaire rows affected**: CO.09 (primary), same shared rows as
SOC 2 above.

## 6. Privacy assessment

**Rows**: none currently scored as requiring a dedicated external
privacy-assessment engagement distinct from the legal/privacy
decision-paper rows already covered in `legal-privacy-action-pack.md`
(IG.10, IS.52, IS.55, IS.62, DR.09). If Qatar Airways' own vendor-risk
process requires a formal third-party privacy impact assessment (PIA)
as separate evidence, that would be a new external engagement not yet
scoped in this program - flagged here for completeness rather than
invented.

## 7. Accessibility audit (formal VPAT / manual conformance)

**Rows**: NFR-015 (UX tab) - currently Partial via an automated
axe-core audit (5 real pages/personas), explicitly **not** a full
manual WCAG 2.1 AA conformance audit or VPAT.

**Scope**: a manual accessibility conformance review (screen-reader
testing, keyboard-navigation testing, full WCAG 2.1 AA success-criteria
checklist) beyond what automated tooling (axe-core) can catch.

**Required provider qualification**: an accessibility-specialist firm
or certified accessibility auditor (e.g. IAAP-certified).

**Evidence expected**: a formal VPAT (Voluntary Product Accessibility
Template) document.

**Estimated duration**: typically 2-4 weeks for an application of this
size.

**Internal preparation required**: the existing automated audit
(`scripts/a11yAudit.mjs`) output is a real starting point; recommend
fixing all automated findings first (see `production-execution-pack.md`'s
soc2-redeploy item) before commissioning the manual review, so the
manual auditor's time isn't spent on already-known issues.

**Questionnaire rows affected**: NFR-015 (UX tab).

## 8. DR exercise (real switchover drill)

**Rows**: NFR-039, NFR-040, NFR-041 (NFR tab), DR.05.

**Scope**: not a third-party engagement in the audit-firm sense, but a
genuine external-to-engineering dependency in that it requires a
scheduled production maintenance window and (recommended) an
independent observer/verifier for the drill's RTO/RPO measurements to
be credible to an auditor.

**Required provider qualification**: internal (Cloud Administrator +
SRE), optionally with an independent verifier if QR or a future
auditor requires third-party attestation of the drill's results.

**Evidence expected**: a dated DR-drill report with measured (not
estimated) RTO/RPO, following the same rigor as the existing
`docs/restore-drill-2026-08-04.md`.

**Estimated duration**: the underlying DR-region deployment is a
significant infrastructure project (see `production-execution-pack.md`
and `mandatory-action-register.md`'s NFR-039/040/041 rows); the drill
itself, once the DR region exists, is a single scheduled exercise
(hours, not weeks).

**Internal preparation required**: DR-region Cloud Run deployment
must exist first (not yet done) - this is the long pole, not the drill
itself.

**Questionnaire rows affected**: NFR-039, NFR-040, NFR-041 (NFR tab),
DR.05.

## 9. Physical/environmental attestation (already exists, inherited)

**Rows**: PA.01, PA.03, PA.05, DR.06, DR.07, AR.19.

**Scope**: no new external engagement needed - Google Cloud already
publishes its own independent SOC 2 Type II/ISO 27001 attestations
covering physical data-center security, environmental protection, and
power/network redundancy for the regions this application uses.

**Required provider qualification**: N/A - already provided by Google
Cloud as the underlying infrastructure provider.

**Evidence expected**: a citation to Google Cloud's publicly available
compliance documentation (Google Cloud Trust Center) formally
referenced in each row's remark.

**Estimated duration**: essentially zero - this is a documentation
citation task, not an engagement.

**Internal preparation required**: none beyond formally citing the
existing Google attestation in each remark (already done in substance
for PA.01/PA.05; PA.03/DR.06/DR.07/AR.19 carry `"Yes (inherited)"` and
are recommended for workbook normalization to exact `"Yes"` - see
`mandatory-action-register.md`).

**Questionnaire rows affected**: PA.01, PA.03, PA.05, DR.06, DR.07,
AR.19.

## Summary: business decision required, not engineering

Every group above (except group 9, already effectively answered) needs
one of two real business decisions, not more internal engineering
work:

1. **Engage a real, accredited external party** for the relevant
   assurance type - the only way these rows genuinely become "Yes."
2. **Continue documenting the honest Partial/No status**, citing real
   internal readiness work as a signal, while being explicit that
   external validation has not occurred - the only honest option until
   (1) happens.

Recommend sequencing external engagements **after** the internal
mandatory-row closures in `mandatory-action-register.md` are
substantially complete, so an auditor/pentest firm evaluates a more
mature control set and findings are cleaner.
