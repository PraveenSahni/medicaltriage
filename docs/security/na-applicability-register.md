# N/A Applicability Register

_Tracks every row where an architecture-inapplicability argument has been
formally assessed against the strict 6-part test (see the 2026-08-06
N/A applicability assessment). A row here does not necessarily mean the
row is N/A - it may mean a subcomponent was found N/A while the row
itself remains Partial or No._

## Strict test applied to every entry

A requirement (or subcomponent) may be classified N/A only when:
1. The relevant technology/infrastructure/process/data type is genuinely
   outside the offered solution scope.
2. The questionnaire wording permits non-applicability.
3. No responsibility remains with IST under the cloud shared-
   responsibility model.
4. No contradictory code, configuration, deployment, or documentation
   exists.
5. The rationale would withstand customer, auditor, and legal review.
6. The requirement will be reassessed if the architecture/operating
   model changes.

---

## AR.17 - Cloud CSQ - full row N/A

| Field | Value |
|---|---|
| Exact requirement | "Confirm whether policies and procedures established and mechanisms implemented to protect network environments and detect the presence of unauthorized (rogue) network devices for a timely disconnect from the network?" |
| Current response | **N/A** (was No) |
| Architecture boundary | All-cloud hosting (Google Cloud Run, project `triage-502706`, region `me-central1`/Doha) - confirmed directly with IST that no physical corporate office network exists |
| Why full-row N/A | The entire requirement concerns an IST-operated network environment; IST operates none |
| Reassessment trigger | If IST ever operates a physical office/on-prem network |
| Score impact | Denominator correction: mandatory 152->151, overall 400->399. Numerator unchanged. |

---

## IS.39 - Cloud CSQ - subcomponent N/A, row stays Partial

| Field | Value |
|---|---|
| Exact requirement | "*Confirm whether the supplier conduct network-layer vulnerability scans regularly?" |
| Current response | **Partial** (was No - unchanged denominator/numerator effect, since both buckets are "not Yes") |
| Subcomponents separated | (1) Host/VM/OS and customer-managed network-device scanning; (2) public-facing endpoint network/TLS reachability testing |
| Subcomponent 1 - conclusion | **N/A.** IST operates no VM hosts, guest operating systems, or customer-managed routers/switches/firewalls under this Cloud Run serverless deployment - there is nothing of this kind for a network-layer scanner to enumerate |
| Subcomponent 1 - evidence | `terraform/main.tf` - zero `google_compute_instance` resources anywhere; confirmed via this engagement's own IS.66 IAM review that the runtime identity has no host-level access |
| Subcomponent 1 - shared-responsibility | Google manages the physical network fabric and host layer entirely; independently attested (SOC 2 Type II / ISO 27001, already cited under CO.01/CO.08/CO.09) |
| Subcomponent 2 - conclusion | **Applicable, only partially met.** The service exposes real internet-facing HTTPS endpoints (`triagedsoc2.irisstar.tech`, `triaged.irisstar.tech`) regardless of the serverless hosting model - a genuine network/TLS-facing attack surface that IST is responsible for testing |
| Subcomponent 2 - current controls | `scripts/dastProbe.mjs` checks security-header presence (CSP, HSTS) - real, but **not** a genuine TLS/cipher-suite/protocol-version scan or port-level reachability scan |
| Subcomponent 2 - remaining gap | No dedicated TLS/cipher-suite scanning tool (e.g. `testssl.sh`, SSL Labs API) or port-level external reachability scan exists yet - a real, disclosed, unmet control |
| Related coverage | IS.40 (application-layer vulnerability scanning) is a separate, already-assessed row - see `docs/security/application-vulnerability-scanning.md`. IS.39 must not be conflated with IS.40 |
| Why NOT full-row N/A | Per the strict test's condition #4 (no contradictory evidence): the service's real, live, internet-facing endpoints are a genuine network-security responsibility that cannot be waved off merely because no VM exists. Classifying the full row N/A would misrepresent an unmet control as inapplicable |
| Reassessment trigger | If IST adds a TLS/cipher/port-level scanning tool against the public endpoints (subcomponent 2 could then move toward Yes/stronger Partial), or if the platform moves to customer-managed compute/networking (subcomponent 1 would then need a real answer) |
| Score impact | **None on the binary Method A score** - a No->Partial bucket shift does not change the scored denominator or the Yes numerator (both buckets are "not Yes, not N/A"). Reflected in the supplementary weighted-maturity indicator only (mandatory weighted 98.0->98.5, overall weighted 198.0->198.5) |

---

## Rows reviewed and confirmed NOT N/A (from the 2026-08-06 sweep, restated for the register)

| Row | Why not N/A |
|---|---|
| IS.40 | Unauthenticated-only scanning is a coverage gap, not an architectural inapplicability - the app has a real authenticated surface a scanner could exercise |
| NFR-118 (job-failure/transaction-drop gaps) | Unimplemented monitoring coverage, not out of scope |
| IS.33/IS.34 (CMEK/BYOK) | Deferred migration/accepted risk, not architecturally inapplicable |
| NFR-010/IS.45 (Security Command Center) | Blocked on a business/account-structure decision, not genuinely out of scope |
| IG.06/PA.04 (customer-configurable geo-routing) | A real, buildable feature that doesn't exist yet, not architecturally inapplicable |
| AR.21 (host FIM subcomponent) | Already correctly split (Yes overall, FIM subcomponent documented N/A) prior to this register's creation - see `docs/architecture/serverless-integrity-control-mapping.md` |
| IS.66 (full row) | Compound requirement; no subcomponent qualifies for N/A - all four parts (cloud IAM, application RBAC, least privilege, workstation hardening) are genuinely applicable, in varying states of completion |
