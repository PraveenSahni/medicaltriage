# Qatar Airways Clarification Register

_Rows where the questionnaire itself asks QR to specify a parameter before
a real answer can be given - engineering has provided the honest current
state, but the "compliant" threshold depends on QR's own input. Generated
2026-08-05._

| ID | Question | What QR needs to specify | Current honest state |
|---|---|---|---|
| NFR-038 | Availability SLA tier | Which SLA tier applies (e.g. 99.95% for Tier 0)? | 99.5%/month is monitored today as a reasonable default for a demo/staging workload - not yet confirmed against a QR-mandated tier. |
| NFR-039 / NFR-040 | RTO/RPO targets | Target RTO/RPO for this application's tier (e.g. 0 minutes for Tier 0)? | Real cross-region replica exists; RPO is bounded by replication lag (unmeasured under load), RTO is unmeasured (no drill performed). |
| NFR-027 | IP allowlisting to QR's network | QR's actual approved IP range(s) | Real IP-allowlist middleware exists (`IP_ALLOWLIST` env var, supports CIDR), off by default until QR provides the range. |
| NFR-185 | Data residency approved regions | Which region(s) does QR consider approved? | All infrastructure is in `me-central1` (Doha, Qatar) - a specific, verifiable answer, but not yet confirmed against QR's own approved-region list. |

## Recommended action

Draft a short, specific clarification request to Qatar Airways containing
exactly these 4 items (tier level, RTO/RPO target, IP range, approved
region confirmation) - each is a one-line answer from QR that would let
the corresponding row move to a real "Yes" (or reveal a genuine gap to
close, e.g. if the approved RTO/RPO target is stricter than what today's
architecture delivers).
