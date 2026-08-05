# Executive Approval Pack

_Generated 2026-08-05. Rows blocked on a named-executive decision or
sign-off, not on engineering work. No approval is assumed granted by
this document - every field below is a template for a real person to
complete._

## IS.02 - Executive security-policy commitment

**Exact questionnaire requirement**: confirmation of ongoing executive/
management commitment to information security, beyond ad hoc
engineering work - typically evidenced by a named-executive-approved
security policy document.

**Current workbook remark**: *"Real security work was prioritized and
executed by engineering leadership throughout this engagement (this
entire remediation pass) - there is no formal, separate
executive-sponsored information-security policy document confirming
ongoing management commitment beyond the work itself."*

**Why this cannot close without a named approver**: engineering
executing security work is not the same evidentiary claim as an
executive formally committing the organization to an information
security policy on an ongoing basis. Drafting a policy document and
quietly marking this "Yes" without a real approval would be exactly
the kind of overclaim this compliance program exists to avoid
(explicitly flagged and declined in an earlier batch - see
`mandatory-conversion-status.md`).

**Exact document requiring approval**: a new, short
`docs/information-security-policy.md` (not yet drafted - see "Next
step" below) stating: management's commitment to information security,
the security governance structure, the review cadence, and a
reference to the real controls already built this engagement as
evidence of that commitment.

**Control summary to include in the document** (real, already built,
for the drafter's use):
- Rate limiting, session management, MFA/OIDC SSO, role-permission
  administration, PAM/JIT elevation, audit logging, encryption in
  transit, IP allowlisting, CSP/security headers, SBOM generation,
  dependency scanning, incident-response plan, backup/DR (partial),
  SLI/SLO monitoring.

**Known limitations to include honestly** (do not omit):
- No formal SOC 2/ISO 27001 certification yet (see
  `external-assurance-pack.md`).
- Several mandatory rows remain open pending business/legal/HR
  decisions (see `mandatory-action-register.md`).
- This policy commits to an ongoing review cadence, not a one-time
  statement.

**Approval statement template** (for the named approver to sign,
verbatim or adapted):

> I, ______________________ (name), in my capacity as
> ______________________ (title), on behalf of IST Health, approve
> this Information Security Policy and confirm the organization's
> ongoing commitment to the information security program described
> herein, effective from the date below. This approval will be
> reviewed at the cadence stated in this document.
>
> Signature: ______________________
> Date: ______________________
> Next review date: ______________________ (recommend 12 months from
> approval)

**Named approver field**: not yet completed - requires a real CISO or
CTO/Executive Sponsor signature. **This document does not treat the
draft as approved.**

**Review cadence**: annual, aligned with `docs/risk-register-2026-08-04.md`'s
existing review cadence (next: 2026-11-04) unless the approver
specifies otherwise.

**Questionnaire-ready closure remark (prepared, not yet applied)**:
*"A named-executive-approved Information Security Policy exists
(`docs/information-security-policy.md`, approved by [name/title] on
[date], next review [date]), formally committing IST Health's
management to the information security program evidenced throughout
this engagement."* - **only to be entered once the document is drafted
and actually signed.**

**Execution steps**:
1. Draft `docs/information-security-policy.md` using the control
   summary and known-limitations content above (engineering can do
   this - it is documentation, not a policy decision).
2. Route to Executive Sponsor/CISO for review.
3. Obtain signature and date.
4. Update the questionnaire response using the prepared remark above.

**Validation method**: confirm the signed document exists in the repo
(or a referenced document-management system) with a real name, title,
signature/date, and review date filled in - not placeholders.

**Estimated effort**: drafting, ~0.5 engineering day; approval cycle,
depends on executive availability (typically 1-2 weeks).

**Risk if delayed**: low security risk (the underlying controls already
exist and function); moderate compliance-optics risk if QR's evaluator
specifically probes for named executive accountability, which several
CSQ rows in this register also depend on (IS.10/20/21/27 all touch
similar accountability themes).

**Final dependency state**: **Category 3 - Documentation complete,
awaiting approval**, once the draft above is written; currently the
draft itself does not yet exist, so today it is more accurately
**Category 1 (engineering/documentation work remaining) transitioning
to Category 3** once drafted.
