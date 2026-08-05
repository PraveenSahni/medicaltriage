# Privacy Incident Notification Template

_Written 2026-08-05. This is a DRAFT template requiring Legal, DPO,
and management approval before any real customer use. No approval has
been obtained. Do not send this content to any real customer._

## Approved-fields-only content (per `renderNotificationTemplate()`,
`src/services/privacyIncidentWorkflow.ts`)

```
Subject: Privacy Incident Notification - Reference {incident.id}

Incident reference: {incident.id}
Detected: {incident.detectedAt}
Affected service: IST Health Tele-Triage platform
Nature of incident: under review - see incident record for classification
Known data impact: {incident.affectedCustomerStatus}
Containment status: {incident.status}
Contact point: [approved contact point - not yet configured]

This notification template requires Legal, DPO, and management approval
before use for any real customer communication.
```

## Design constraints (enforced by the template function, not just convention)

- **States only operational facts already recorded on the incident**
  (reference, detection timestamp, current status, affected-customer
  determination) - never free text authored ad hoc at send time.
- **Does not state unverified facts** - "nature of incident" and
  "known data impact" reference the incident's own recorded
  classification fields, not speculative language.
- **Does not admit liability or make legal commitments** - no
  causation, fault, or remediation-guarantee language appears
  anywhere in the template.
- **Contact point is an explicit placeholder** - `[approved contact
  point - not yet configured]` - until a real, approved contact
  channel is decided, the template cannot silently ship with a
  fabricated or guessed contact address.

## Fields explicitly requested by the task, current status

| Field | In current draft? | Note |
|---|---|---|
| Incident reference | Yes | Real, from the incident record |
| Detection date/time | Yes | Real, from the incident record |
| Affected service | Yes | Hardcoded to "IST Health Tele-Triage platform" - the only service this application represents |
| Nature of the incident | Placeholder | References "see incident record for classification" - a real, specific description requires legal/privacy review of what can be disclosed |
| Known data impact | Yes | Real, from the incident's `affectedCustomerStatus` field |
| Containment status | Yes | Real, from the incident's current workflow status |
| Actions taken | **Not included** | Requires a real, reviewed statement of remediation actions - not invented here |
| Customer action requested | **Not included** | Requires legal/privacy input on what (if anything) a customer should be asked to do |
| Contact point | Placeholder only | No approved contact channel configured |
| Update cadence | **Not included** | Requires a business decision on commitment cadence |

## Approval requirement

This template **must not** be used for any real customer communication
until:
1. Legal Counsel has reviewed and approved the exact wording.
2. The DPO/Privacy Officer has confirmed no over- or under-disclosure.
3. Management/Executive Sponsor has signed off on the customer-facing
   commitment implied by "actions taken" / "update cadence" once those
   sections are drafted.

**No such approval has occurred.** This document exists so a future
approval process has a concrete, real starting draft to review -
not a claim that review has happened.
