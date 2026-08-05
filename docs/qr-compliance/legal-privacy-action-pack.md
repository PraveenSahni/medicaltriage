# Legal & Privacy Action Pack

_Generated 2026-08-05. Covers IG.09 (retention), LG.01 (NDA execution),
and the 5 legal/privacy decision-paper rows. No document here is a
substitute for real legal/clinical/privacy sign-off - every template
below is unsigned and unapproved until a named owner acts._

## IG.09 - Retention decision (full pack)

**Candidate entity types requiring a decision**:
- `AviationTriageEncounter` - the clinical encounter record (SBAR/SOAP
  notes, disposition, fit-to-fly status).
- `AuditEvent` - the security/compliance audit trail (every sensitive
  action across the platform).
- (Already decided, not part of this pack): `TriageQueueItem` -
  90-day retention post-`COMPLETED`, enforced today via a real
  `RetentionPolicy` row and automated purge job.

**Regulatory considerations** (for the decision owners to weigh, not
decided here):
- Medical-record retention requirements under the relevant
  jurisdiction's health-records law (Qatar and/or the jurisdiction of
  each treated individual, given this is aviation tele-triage).
- Aviation safety-record retention norms (fit-to-fly decisions may be
  safety-relevant records under aviation regulatory frameworks).
- SOC 2 audit-trail retention norms (commonly 1-7 years depending on
  control type and framework).
- Qatar's own data-protection law requirements on data minimization vs.
  retention necessity.

**Operational impact**:
- Shorter retention reduces the surface area for a future data breach
  and simplifies data-subject deletion requests, but risks discarding
  a record that a later clinical, legal, or safety inquiry needs.
- Longer retention preserves evidentiary/clinical value but increases
  storage cost and privacy exposure, and needs a defensible written
  justification for an auditor.

**Storage impact**: both tables grow indefinitely today (no policy).
Real row-count growth rate has not been separately measured in this
pass - recommend a quick query once a candidate period is proposed, to
confirm no near-term storage-cost surprise.

**Deletion/archival implications**:
- Hard delete: irreversibly removes the record - appropriate only if
  the decision owners confirm no future clinical/legal/audit need.
- Archival (e.g. move to cold storage after N days, delete after M):
  a two-tier option if long-term audit value is desired without
  keeping records live/queryable indefinitely.
- Whichever is chosen, the same automated-purge-job pattern already
  built for `TriageQueueItem` can be extended - this is a real,
  low-risk engineering pattern once the period is decided.

**Recommended retention options** (options, not a decision):

| Option | `AviationTriageEncounter` | `AuditEvent` | Rationale |
|---|---|---|---|
| A | Align to IST Health's existing paper/EMR medical-record retention period (if one exists organizationally) | 1 year (SOC 2 minimum norm) | Simplest - reuses an existing, already-defensible number |
| B | 7 years (common medical-record/malpractice-statute-of-limitations proxy) | 3 years (mid-range SOC 2 norm) | Defensible without a pre-existing IST policy to point to |
| C | Indefinite, with a documented business/legal justification | Indefinite, with justification | Only appropriate if the decision owners have a specific reason (e.g. ongoing regulatory requirement) - requires the strongest written rationale |

**Required approvers**: Clinical Governance Lead + Legal Counsel +
DPO/Privacy Officer + Business/Executive Sponsor (joint decision - no
single owner can decide this alone, since it spans clinical, legal,
privacy, and business risk).

**Final decision template** (for the approvers to complete):

> Retention decision for IG.09, approved 2026-__-__ by:
> Clinical Governance Lead: ______________________
> Legal Counsel: ______________________
> DPO/Privacy Officer: ______________________
> Business/Executive Sponsor: ______________________
>
> `AviationTriageEncounter` retention period: ______ (days/years) from
> ______ (encounter completion / disposition date / other trigger).
> `AuditEvent` retention period: ______ (days/years) from event
> creation.
> Archival tier (if any) before final deletion: ______
> Regulatory basis cited: ______________________

**This pack does not choose a retention period.** Once the template
above is completed and signed, engineering can implement it using the
existing `RetentionPolicy` + purge-job pattern within an estimated 1
engineering day.

## LG.01 - NDA execution

**Exact questionnaire requirement**: confirmation that non-disclosure/
confidentiality agreements are executed and in place governing this
engagement's data handling.

**Current workbook remark**: *"Standard confidentiality expectations
apply to this engagement's work and data handling, though no
dedicated, signed NDA/confidentiality-agreement template specific to
this application has been documented separately from broader
organizational agreements."*

**Current contract/document state**: no dedicated, signed NDA specific
to this application/engagement exists in the repository or referenced
documentation. Broader organizational confidentiality expectations may
exist outside this codebase's visibility, but none have been confirmed
or cited as satisfying this specific row.

**Required signing parties**: IST Health (as the party handling QR
data/systems) and Qatar Airways (or its designated legal
representative) - both parties' authorized signatories.

**Execution evidence needed to close this row**: a real, dated,
countersigned NDA or confidentiality agreement (PDF or equivalent),
referenced by filename/location in the questionnaire remark - not a
description of "standard expectations."

**Questionnaire update condition**: this row may only move to "Yes"
once a real, executed (both-parties-signed) NDA/confidentiality
agreement exists and can be cited. **This pack does not create,
draft, or simulate a signed NDA** - that would misrepresent contract
status to an auditor or customer.

**Owner**: Legal Counsel (IST Health side); Qatar Airways Security/
Technology Contact (to confirm QR's own signing authority).

**Estimated effort**: legal drafting/negotiation cycle, typically
1-4 weeks depending on both parties' legal review turnaround - not an
engineering task.

**Risk if delayed**: contractual/reputational risk if QR's audit
specifically checks for an executed NDA and none exists; low technical
risk (this row does not gate any system access).

## Legal/privacy decision-paper rows (IG.10, IS.52, IS.55, IS.62, DR.09)

None of these 5 rows has a drafted decision paper yet (confirmed via
direct inspection of `business-decision-register.md`, which currently
contains only IG.09 and NFR-119). Each needs its own real scoping
before a paper can be drafted - a generic template would understate
the real differences between them.

| ID | Requirement | What's needed before a decision paper can be drafted | Recommended owner |
|---|---|---|---|
| IG.10 | Formal procedure for handling third-party/government data requests | Legal to confirm current ad hoc process (if any) and the real regulatory triggers (subpoena, government request under Qatar law, etc.) that must be handled | Legal Counsel |
| IS.52 | Chain-of-custody standard alignment | Legal/security to confirm which chain-of-custody standard (e.g. ISO 27037-aligned) is the intended target before drafting | Legal Counsel + CISO |
| IS.55 | Subpoena-data-separation attestation | Legal to confirm whether any subpoena has ever been received (informs whether this is a live process gap or a theoretical one) | Legal Counsel |
| IS.62 | Qatar-law Privacy Policy alignment | Legal review of the existing Privacy Policy document against Qatar's data-protection law - the policy itself may already exist; what's missing is the legal alignment review, not necessarily a new policy | Legal Counsel + DPO |
| DR.09 | Customer jurisdiction-routing control | A business/architecture decision on whether per-customer jurisdiction routing is a real product capability IST intends to offer, before legal reviews the control | Business Owner, then Legal Counsel |

**Recommended sequencing**: IS.62 (Privacy Policy legal review) is
likely the fastest to close, since a policy document may already exist
- confirm with Legal Counsel/DPO before assuming new drafting is
needed. IG.10 and IS.55 are closely related (both about
third-party/government data requests) and could reasonably be drafted
together. DR.09 is blocked on a business decision before legal
involvement is even useful, and should not be scoped as "legal work
remaining" until that business decision is made.

**This pack does not draft any of these 5 decision papers** - each
requires the scoping conversation above before a real, non-generic
paper can be written without guessing at facts only Legal Counsel
knows.

## Update 2026-08-05: IS.61 notification template - legal/DPO approval needed

A draft customer-notification template now exists
(`docs/security/privacy-incident-notification-template.md`) - fields
are limited to real, already-recorded incident metadata (reference,
detection time, affected-customer status, containment status); it
deliberately excludes "actions taken," "customer action requested,"
and "update cadence" sections pending legal/privacy review of what can
be disclosed. **No approval has been sought or obtained.** Required
before any real use: Legal Counsel review of exact wording, DPO
confirmation of appropriate disclosure scope, and management sign-off
on any customer-facing commitment. This is a new, distinct approval
item alongside IG.09/IS.02/LG.01 already tracked in this pack.
