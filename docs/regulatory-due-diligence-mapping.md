# Regulatory & Standards Due-Diligence Mapping

_Closes Cloud CSQ IS.05 ("due diligence mapping of your controls, architecture
and processes to regulatory requirements"), IS.23 ("benchmark your security
controls against industry standards"), and AR.23 ("due diligence mapping of
currently applicable regulations and standards"). This consolidates the
real mapping work already done across this engagement's risk register and
questionnaire review into one named document - it is this engagement's own
internal self-assessment, not an independent third-party attestation (see
"What this is not")._

## Framework used: SOC 2 Trust Service Criteria

This engagement's entire remediation pass has been organized around the 5
SOC 2 Trust Service Criteria (Security, Availability, Processing Integrity,
Confidentiality, Privacy) - see `docs/soc2-control-matrix.md` for the
control-by-control mapping, and `docs/risk-register-2026-08-04.md` for the
risk-based view of the same landscape.

## Mapping summary

| Trust Service Criterion | Real controls mapped | Reference |
|---|---|---|
| Security | Tenant isolation, RBAC (66 permissions across 19 roles), MFA/OIDC SSO, PAM/JIT elevation, rate limiting, CSP/Helmet, dependency scanning (`pnpm audit`), SAST (CodeQL) | `docs/soc2-control-matrix.md` §Security |
| Availability | Uptime monitoring/alerting, automated backups + PITR, cross-region DB replica, canary-then-cutover deploys | `docs/soc2-control-matrix.md` §Availability, `docs/backup-disaster-recovery-plan.md` |
| Processing Integrity | Faithfully-mirrored vendor clinical content (`Mdb*` tables), HRMS identity validation before queue creation, completed-encounter edit locking, `tsc`/full test suite gating in CI | `docs/soc2-control-matrix.md` §Processing Integrity |
| Confidentiality | Tenant-scoped isolation, Secret Manager-backed secrets (soc2), field-level masking with approval-gated reveal | `docs/soc2-control-matrix.md` §Confidentiality, `docs/data-management-policy.md` |
| Privacy | DSAR fulfillment (access/erasure), retention/legal-hold enforcement, environment-level synthetic-vs-real data separation | `docs/soc2-control-matrix.md` §Privacy, `docs/data-management-policy.md` |

## Other frameworks referenced

- **OWASP** - Helmet CSP, input validation (Zod on every request), rate
  limiting, and a scripted DAST-style probe (`scripts/dastProbe.mjs`) cover
  several OWASP Top 10-adjacent concerns; no formal OWASP ASVS-level
  assessment has been performed (see `docs/qr-questionnaire-backlog-tracker.md`,
  Cloud CSQ blocked items).
- **GDPR/PDPPL-style data-subject rights** - real, verified DSAR access and
  erasure fulfillment paths exist (see `docs/data-management-policy.md`
  §4) - not a formal legal assessment of which specific regulation applies
  to this deployment's jurisdiction (needs QR legal/compliance input; see
  `docs/risk-register-2026-08-04.md`).

## What this is not

- **Not an independent, accredited regulatory or standards audit.** This is
  an internal mapping exercise performed by the engineering team during
  remediation, citing real, verifiable code/infra evidence - not a
  third-party attestation. Formal SOC 2 Type II certification, a
  commissioned OWASP ASVS assessment, and legal confirmation of applicable
  data-protection regulations all remain separate, explicitly-tracked future
  steps (see `docs/risk-register-2026-08-04.md` R-05 and the blocked items
  in `docs/qr-questionnaire-backlog-tracker.md`).
