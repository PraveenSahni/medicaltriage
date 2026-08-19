# Qatar Airways Input Pack

> Deprecated dated customer-input snapshot; retained for historical traceability.

_Generated 2026-08-05. Every row here has real, honest engineering
evidence already in place - what's missing is a specific piece of
information or confirmation only Qatar Airways can provide. Each item
below is written as a ready-to-send clarification request._

## Consolidated clarification request (send as one package to the Qatar Airways Security/Technology Contact)

| # | Row(s) | Question for QR | Why it's needed | Current honest state without it |
|---|---|---|---|---|
| 1 | NFR-038 | Which SLA availability tier applies to this deployment (e.g. 99.95% for Tier 0, or a different tier)? | Cannot confirm compliance against an unstated target | 99.5%/month monitored today as a reasonable default - not yet confirmed against a QR-mandated tier |
| 2 | NFR-039, NFR-040, NFR-041 | What are the target RTO (Recovery Time Objective) and RPO (Recovery Point Objective) for this application's tier (e.g. 0 min RPO / <15 min RTO for Tier 0)? | Determines whether the current architecture (cross-region DB replica, no DR-region compute yet) is sufficient or needs the larger DR-deployment project | Real cross-region replica exists; RPO bounded by unmeasured replication lag; RTO unmeasured (no drill performed) |
| 3 | NFR-027 | What is QR's actual approved IP range/CIDR for allowlisting? | The IP-allowlist middleware exists and works (`IP_ALLOWLIST` env var) but is off by default with no range configured | Real, tested capability; simply not yet turned on for lack of a real range |
| 4 | NFR-185 | Which region(s) does QR consider data-residency-approved? | All infrastructure is in `me-central1` (Doha, Qatar) - a specific, verifiable, and likely favorable answer, but not yet confirmed against QR's own approved-region list | Real, verifiable current state; just needs QR's confirmation it satisfies their policy |
| 5 | NFR-156 | What is QR's actual projected peak concurrent-user count and/or peak requests-per-second for this application? | Without this, capacity validation can only use engineering-assumption test tiers (already run: 10/25 concurrent users validated clean, 20-minute soak clean) rather than a QR-confirmed target | Validated up to 25 concurrent users with zero errors; genuinely useful evidence, but not yet mapped to QR's real expected load |
| 6 | NFR-189 | Who is the real, designated recipient for the monthly SLI/SLO report (name/email)? | The reporting capability is fully built and proven (100.00% availability, 67.81ms p95, 0.03% error rate, 56.00% saturation, all PASS on a real 2026-08-05 execution) but no customer email is hardcoded anywhere by design | Implementation complete; awaiting only this one piece of information |
| 7 | NFR-016 (UX) | Can QR provide brand guidelines/assets (logo, color palette, typography) for a QR-themed instance of the application? | The application's CSS custom-property theming system already supports applying a new theme without code changes to components - it just has no QR-specific theme built yet | Real theming capability exists; needs QR's brand assets to apply it |

## Recommended delivery approach

Send as a single, short clarification email/document to the Qatar
Airways Security/Technology Contact containing exactly the 7 items
above - each is a one-line answer that would let the corresponding
row(s) move to a real "Yes" (or reveal a genuine gap requiring
further engineering work, e.g. if the stated RTO/RPO target is
stricter than today's architecture delivers).

## What happens after each answer arrives

| # | On receiving QR's answer | Estimated follow-on effort |
|---|---|---|
| 1 | Confirm/adjust the monitored SLA target in `docs/sli-slo-definitions.md` and alert policies | <0.5 day |
| 2 | If today's architecture already meets the target: document and close. If not: scope the DR-region deployment + drill project (see `external-assurance-pack.md` group 8) | 0.5 day to confirm, or a dedicated future session if a gap is found |
| 3 | Configure `IP_ALLOWLIST` with the real range; verify | <0.5 day |
| 4 | Confirm/document `me-central1` satisfies the policy, or scope a region-migration discussion if not | <0.5 day to confirm |
| 5 | Design a QR-scale-matched load-test tier (beyond the 10/25/50-user engineering tiers already run) and execute it | 1-2 eng days once the target is known |
| 6 | Configure `SLI_REPORT_RECIPIENT_EMAIL`, confirm live email secrets, run the safe test-delivery plan in `production-execution-pack.md` | <1 day |
| 7 | Apply QR brand assets via existing theming system | Depends on asset complexity; likely 1-3 eng days |

## Rows NOT included in this pack (deliberately)

Rows that also mention "Qatar Airways" in some capacity but are
**not** blocked on a QR answer (already actionable by IST alone or
blocked on something else) are excluded here to avoid diluting the
request - see `mandatory-action-register.md` for the complete
picture. Example: NFR-016/NFR-022 (SSO federation) needs a real QR IdP
tenant to test against, which is arguably a QR input too, but is
listed separately in the register since it's an IT/identity-team
action (provisioning test tenant access) rather than a one-line policy
answer - recommend bundling it into the same outreach conversation
once QR's Security/Technology Contact engages, even though it isn't
one of the 7 "quick answer" items above.

## Update 2026-08-05: authorized customer-notification recipients (IS.61)

A real, controlled privacy-incident notification workflow now exists
(see `docs/security/privacy-incident-notification-procedure.md`),
implemented in safe dry-run/internal-test mode only. To close IS.61
fully, Qatar Airways needs to provide:

1. **Authorized recipient address(es)** for privacy-incident customer
   notifications (`PRIVACY_NOTIFICATION_CUSTOMER_RECIPIENTS`).
2. **Confirmation of an acceptable notification SLA** (hours from a
   confirmed, notification-required incident to customer notification)
   - no engineering default was chosen; this is currently unset.
3. **Approval authority** - who at Qatar Airways needs to review/
   approve the notification template before any real send (see
   `docs/security/privacy-incident-notification-template.md`).

None of these are configured or assumed - real customer delivery is
technically refused outright until all three, plus IST's own Legal/
DPO/management template approval, are in place.
