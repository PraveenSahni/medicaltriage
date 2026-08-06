# MFA Break-Glass Access Assessment - AR.13

_Written 2026-08-05. A real assessment, not a placeholder: this batch
deliberately does NOT implement a dedicated break-glass account, and
this document states why, plus what would need to be true before one
should be built._

## What break-glass access means here

A separate, rarely-used credential that can bypass mandatory MFA
entirely, for the specific case where every enrolled administrator is
simultaneously unavailable/locked out and no one can perform a normal
administrator-assisted MFA reset (see the runbook).

## Assessment

**Not implemented this batch.** Reasoning:

1. **The administrator-assisted reset flow built this batch already
   covers the realistic recovery scenario** - any one enrolled
   administrator can reset any other user's MFA (subject to the no-
   self-reset and no-cross-tenant guards). The failure mode break-glass
   exists for is specifically "zero administrators can act at all,"
   which requires at least two independent, simultaneous failures
   (e.g. both enrolled administrators' devices lost at once, or both
   accounts disabled at once) - a real but low-probability scenario
   given this batch also confirms at least two administrators
   (`pa@irisstar.tech`, `sa@irisstar.tech`) are enrolled in the soc2
   environment specifically so a single point of failure doesn't exist.
2. **A break-glass account is itself a real, standing security risk** -
   a permanently-available MFA-bypass credential, even one governed by
   strong controls, is exactly the kind of thing this whole AR.13 batch
   exists to close, not reintroduce through a side door. Building one
   without the full governance this document's own checklist requires
   (dedicated account, secure credential storage, strong monitoring,
   immediate alerting, restricted permissions, mandatory use-reason,
   credential rotation after every use, mandatory post-use review)
   would be worse than not having one - a half-built break-glass
   mechanism is a real, exploitable gap, not a safety net.
3. **This batch's time/scope budget does not support building and
   testing that full governance checklist safely.** Rather than ship a
   partial, under-governed break-glass mechanism, this assessment
   documents the decision not to build one now and what would need to
   be true first.

## What would need to exist before building one

If a future batch decides break-glass access is genuinely needed
(e.g. the real user population grows large enough that "at least 2
administrators always enrolled" becomes an operationally fragile
assumption), it must include, before activation, not after:

- A dedicated account, never a normal administrator's own account.
- Credentials stored in a real secrets-management system (e.g. Secret
  Manager, already used elsewhere in this engagement), not in source
  or configuration.
- Real-time alerting (not just an audit-log row someone might read
  later) the moment the account is used.
- Permissions restricted to exactly what recovery requires (MFA reset
  and session revocation), not full administrative access.
- A mandatory, non-optional use-reason captured at the moment of use,
  before any action is permitted.
- Automatic credential rotation immediately after every use.
- A mandatory post-use review by a second person, not just the person
  who used it.
- MFA is never silently bypassed for the break-glass account itself in
  a way indistinguishable from a normal account - the account's very
  existence and every use of it must be independently, loudly visible.

## Current mitigating control

Until/unless break-glass access is built, the mitigating control is
operational: **maintain at least two enrolled, active administrators
at all times** (confirmed as of this batch: `pa@irisstar.tech` and
`sa@irisstar.tech` in the soc2 environment) so a single administrator's
lockout never blocks recovery for anyone else.
