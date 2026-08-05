# External Dependency Register

_Rows that cannot reach "Yes" through engineering or documentation alone -
they require an actual external party's action (an audit firm, a
certification body, a cloud vendor's own attestation, or a customer
confirmation). Generated 2026-08-05 from the master compliance register._

## SOC 2 / ISO 27001 / penetration testing (13 rows, mostly Cloud CSQ)

| ID | Tab | Mandatory | What's real today | What's actually missing |
|---|---|---|---|---|
| CO.01 | Cloud CSQ | Yes | Internal gap-analysis and this questionnaire remediation itself | A real third-party audit report - none exists |
| CO.02 | Cloud CSQ | Yes | `scripts/dastProbe.mjs`, a real scheduled internal DAST-style probe | An independent, external DAST/security-testing engagement |
| CO.03 | Cloud CSQ | Yes | Internal review only | An independent application penetration test |
| CO.05 | Cloud CSQ | Yes | Internal review only | Any external audit whatsoever |
| CO.07 | Cloud CSQ | Yes | Real internal findings (risk register, gap analysis) exist and are shareable | Not the same as an external auditor's findings |
| CO.08 | Cloud CSQ | Yes | Real remediation work (risk register, control-matrix docs, real fixes) | A formal SOC 2 Type II attestation - readiness work is not certification |
| CO.09 | Cloud CSQ | Yes | Same readiness work as CO.08 | ISO 27001 certification |
| PA.01 | Cloud CSQ | Yes | Google Cloud's own published SOC 2 Type II covers physical data-center security | Not this application's own attestation - inherited, not owned |
| PA.05 | Cloud CSQ | Yes | Same Google Cloud inheritance as PA.01 | Same - physical ingress/egress is GCP's attestation, not IST's |
| NFR-041 | AI | Yes | This engagement's remediation work is real evidence of security prioritization | Not a substitute for a named, accountable executive-sponsorship attestation an auditor would expect |
| NFR-184 | Non Functional Req | No | Internal DAST probe only | Independent penetration test |
| CO.06 | Cloud CSQ | No | N/A - no network pentest performed | Same as CO.03/184 but network-layer |
| IS.03 | Cloud CSQ | No | Internal practice follows OWASP/SOC 2 TSC framing | Not an externally-verified claim |

## Recommended action

These 13 rows genuinely cannot move to "Yes" through more engineering or
documentation work - the row itself asks "has this external thing
happened," and it hasn't. Two real options exist, both business
decisions, not engineering ones:

1. **Engage a real SOC 2 Type II auditor / pentest firm.** This is the
   only way CO.01/02/03/05/07/08/09/184/PA.01/PA.05/NFR-041 can honestly
   become "Yes." Recommend scoping this as a formal, budgeted engagement
   once the engineering/documentation closures in this program are
   substantially done (an auditor's findings will be cleaner against a
   more mature control set).
2. **Leave as Partial/No with an honest remark** citing the real internal
   work done as a readiness signal, while being explicit that
   certification/external validation has not occurred. This is the
   current state and is the only honest option until (1) happens.

No further engineering action is proposed for this register's contents.
