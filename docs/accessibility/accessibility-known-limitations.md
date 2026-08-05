# Accessibility Known Limitations - NFR-015

_Written 2026-08-05. Honest, current list of what is NOT yet proven
accessible, so NFR-015's Partial status has a concrete, actionable
punch list rather than a vague caveat._

## 1. Focus Visible defect (WCAG 2.1 SC 2.4.7, Level AA) - open, blocking

**Confirmed real** via manual testing this batch (not automated - axe-
core does not check focus-ring rendering by default): at least
`.smb-soft-btn` (Triage Service Manager Board's top-action buttons,
e.g. "Generate Calls") receives `:focus-visible` correctly and the
app's real `--focus-ring` CSS custom property (`0 0 0 2px #ffffff, 0 0
0 5px #0a1f44`) resolves correctly at that element, but the computed
`box-shadow` is nonetheless `none` - a broader `box-shadow: none
!important` rule somewhere in the cascade (candidates found in
`global.css`, `cockpit.css`, `login.css` - the exact overriding
selector was not isolated this batch, only the effect was confirmed)
wins over the intended focus ring. **Practical effect**: a keyboard-
only user tabbing through the Service Manager Board (and possibly
other views using the same button styling - not yet checked page-by-
page) cannot see where focus currently is.

**Retest trigger**: once a fix is applied (either scoping the
`!important` box-shadow reset to exclude `:focus-visible` states, or
adding an explicit `.smb-soft-btn:focus-visible { box-shadow: var(--focus-ring) !important; }`
override), re-run the manual check in
`manual-accessibility-checklist.md` item 3 across all 5 audited pages,
not just the Service Manager Board, since the same broad reset may
affect other button classes too.

**This is the single item currently blocking NFR-015 from moving to
Yes.**

## 2. Firebase Hosting CDN cache is not auto-invalidated by a Cloud Run traffic cutover

**Confirmed real** this batch: after cutting the Cloud Run service
100% to the new, fixed revision, the custom domain
(`triagedsoc2.irisstar.tech`, fronted by Firebase Hosting) continued
serving the *old*, pre-fix bundle (reproducing the 2 stale-deployment
violations) until a separate `firebase deploy --only hosting:soc2` was
run - a real Hosting release event, even though the Hosting
configuration content itself was unchanged. **Practical effect**: any
future fix to this environment that depends on end users on the custom
domain seeing it promptly must include this extra step; a Cloud Run-only
cutover is not sufficient. Recommend folding `firebase deploy --only
hosting:soc2` into the standard canary-then-cutover runbook for this
environment as a required, not optional, final step.

## 3. Automated accessibility scanning is Chromium-only

`scripts/a11yAudit.mjs` uses `@axe-core/playwright` through Playwright's
Chromium build exclusively. Firefox, WebKit (Safari engine), and the
mobile emulation projects are exercised only for **functional**
regression coverage (`tests/e2e/browser-journey.spec.ts`), not
accessibility-rule scanning. A real, engine-specific accessibility
difference (e.g. a WebKit-only ARIA quirk) would not be caught by this
batch's automated pass. **Not fixed this batch** - would require either
running axe-core against each engine separately (axe-core's own
architecture supports this) or accepting Chromium-only automated
scanning as the standing limitation.

## 4. No real assistive-technology (screen reader) testing performed

Confirmed no NVDA/JAWS/VoiceOver or equivalent is available in this
engineering environment. All "screen-reader-readable" claims in the
validation report and checklist are automated-proxy-only (axe-core's
accessible-name/label/ARIA rules), not verified with a real screen
reader. **Do not claim real screen-reader compatibility based on this
batch's evidence alone.**

## 5. Manual checks not performed this batch (see checklist for the full table)

Modal/dialog focus-trap and restoration, zoom/reflow at 200%, session-
timeout warning UX, destructive-action confirmation UX, and full
keyboard-order verification across all 5 pages (only the Service
Manager Board's first Tab stop was checked) - not performed due to
this batch's time budget and the lack of populated live data to
exercise some of these flows (e.g. no dialog was open with real
content during the manual pass). None of these are assumed passing;
they are explicitly open items for a follow-up manual pass.

## What IS proven, real, and current as of this batch

- The current source's `--muted` color-contrast fix and `.smb-board`
  keyboard-focusability fix are genuinely deployed and live (0
  violations via both the canary and the production custom domain,
  post-CDN-fix).
- All 5 real pages/personas pass automated `wcag2a`/`wcag2aa`/
  `wcag21a`/`wcag21aa` axe-core scanning with 0 violations.
- No functional regression was introduced across 6 real browser
  engines (Chromium, Edge, Firefox, WebKit, mobile Chrome, mobile
  Safari) - the one observed e2e failure is a pre-existing test-data
  gap, not a browser- or accessibility-specific regression.
