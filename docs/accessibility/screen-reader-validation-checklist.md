# Screen-Reader Validation Checklist - NFR-015

_Written 2026-08-05. This is a PREPARED, NOT YET EXECUTED checklist -
no real screen reader (NVDA, JAWS, VoiceOver, or equivalent) is
available in this engineering environment, confirmed repeatedly across
every NFR-015 batch this engagement. This document exists so a future
session with real assistive-technology access has a concrete, scoped
plan to execute, rather than starting from nothing. Do not mark any
item below as complete without a real screen reader actually being
used._

## Prerequisite

A real screen reader running against a real browser, against either:
- `https://triagedsoc2.irisstar.tech` (the soc2 environment already
  used for every other NFR-015 validation this engagement), or
- A local dev build, if the tester has one running.

Recommended: NVDA + Chrome or Firefox on Windows (free, widely used in
real deployments), or VoiceOver + Safari on macOS. JAWS is acceptable
if licensed.

## Personas and pages to cover

Use the same 5 real pages/personas already used throughout this
engagement's automated and manual validation:

| Page | Persona | Credentials |
|---|---|---|
| Login (unauthenticated) | none | n/a |
| Help Center (unauthenticated fallback) | none | n/a |
| Nurse Cockpit | `layla@irisstar.tech` | `Layla@2026` |
| Triage Service Manager Board | `khalid@irisstar.tech` | `Khalid@2026` |
| Control Center Admin | `rishma@irisstar.tech` | `PlatformAdmin@2026` |

## Checklist

### 1. Login page
- [ ] Page title is announced on load.
- [ ] Username and password fields are announced with their labels.
- [ ] The EN/عربي language toggle is announced with its current state.
- [ ] "Show password" toggle announces its pressed/not-pressed state.
- [ ] A failed login announces the error message (not just visually
      shows it) without requiring the user to re-navigate to find it.

### 2. Main navigation / app chrome
- [ ] Landmark regions (main, navigation) are announced when navigating
      by landmark (NVDA: `D` key; VoiceOver: rotor).
- [ ] Heading structure allows jumping by heading (NVDA/VoiceOver
      heading navigation) to reach each major section.

### 3. One queue workflow (Nurse Cockpit)
- [ ] The queue sidebar's call list is announced as a navigable list
      with each card's key info (patient age, reason, severity) read
      in a sensible order.
- [ ] "Answer call" is announced with a clear accessible name and
      action.
- [ ] The stage-tabs (`role="tablist"`/`role="tab"`, added this
      engagement) announce as tabs, with the selected tab's state
      (`aria-selected`) read out, and Arrow-key navigation between
      tabs works as expected for a real tablist (this was NOT
      implemented in the fix - only `aria-selected`/`role="tab"` were
      added, not the APG's recommended roving-tabindex/Arrow-key
      behavior; a screen-reader pass may reveal this needs finishing).
- [ ] Vitals/IAQ/TAQ form fields announce their labels and current
      values correctly.
- [ ] A validation error (e.g. missing disposition) is announced via
      `role="alert"` without needing visual confirmation.

### 4. Service Manager Board controls
- [ ] The read-only call-detail drawer (`ReadOnlyCallDrawer`, fixed
      earlier this engagement with `role="dialog"`/`aria-modal`)
      announces itself as a dialog when opened, reads its accessible
      name ("Call details"), and a screen-reader user can confirm focus
      actually entered the dialog (not just a sighted-keyboard check).
- [ ] The drawer's own tabs (Reason/IAQ/TAQ/Disposition/SBAR) announce
      correctly.
- [ ] Closing the dialog (Escape or the close button) announces the
      return to the underlying board content.

### 5. A newly-fixed dialog (the same `ReadOnlyCallDrawer`)
- [ ] Confirm no keyboard trap remains after close (screen-reader users
      are especially vulnerable to silent traps that a sighted keyboard
      check might miss due to visual focus indicators alone).

### 6. An error message
- [ ] Any `role="alert"` error (login failure, escalation failure,
      disposition-save failure) is announced immediately, without the
      user needing to navigate to find it.

### 7. A loading or empty state
- [ ] "No active call" state (Nurse Cockpit) is announced meaningfully,
      not as blank/empty content.
- [ ] A loading spinner/state (queue loading, protocol detail loading)
      either announces via `aria-live` or does not leave the user
      wondering whether the page is broken.

## Recording results

For each checked item, record: pass/fail, the exact screen reader +
browser + OS combination used, and a one-line description of what was
actually heard. A future batch should append real results as a table
below this checklist, not just check boxes with no evidence - matching
this engagement's standing "verify, don't assume" discipline.

## What this checklist does NOT replace

This is a manual screen-reader pass, not a substitute for:
- The automated axe-core 5-page audit (already passing, 0 violations).
- The manual keyboard-only pass already completed
  (`manual-accessibility-checklist.md`).
- A full, independent, accredited WCAG 2.1 AA conformance audit or
  VPAT, which remains a separate, larger initiative
  (`docs/qr-compliance/external-assurance-pack.md`).
