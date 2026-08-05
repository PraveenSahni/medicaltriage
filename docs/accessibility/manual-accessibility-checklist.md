# Manual Accessibility Checklist - NFR-015

_Written 2026-08-05. Companion to `accessibility-validation-report.md`.
A reusable checklist for future manual accessibility passes against
this application - not a one-time artifact. Results below are from
this batch's real run against `https://triagedsoc2.irisstar.tech`
(khalid@irisstar.tech, Triage Service Manager Board), logged per-item,
not assumed._

| # | Check | Page(s) exercised | Result | Note |
|---|---|---|---|---|
| 1 | Keyboard-only navigation reaches every interactive control | Service Manager Board | Pass (partial coverage) | Tab reached real, operable buttons; full board not exhaustively tabbed through |
| 2 | Logical, predictable focus order | Service Manager Board | Not fully exercised | Only the first Tab stop was verified this batch |
| 3 | Visible focus indicator | Service Manager Board, login page | **PASS (fixed 2026-08-05, follow-up batch)** | Was a confirmed WCAG 2.1 SC 2.4.7 FAIL - root-caused to an app-wide `[class]x6`-specificity `box-shadow: none !important` reset in `global.css`. Fixed by switching the generic focus rule to `outline` (untouched by the reset) using the existing `--t1` token. Verified live on production: `.smb-soft-btn` now shows a real `outline: rgb(10,31,68) solid ~2.67px, offset 2px`. Not exhaustively re-checked on every button class across all 5 pages (time-boxed) - see known-limitations doc. |
| 4 | Modal/dialog focus trapping and restoration | Not exercised | Not performed | No dialog/modal had live data to open during this session's manual pass |
| 5 | Form validation and error recovery | Login form | Pass (implicit) | Login form fields are correctly labeled (axe `label` rule, part of `wcag2a`); real error-message behavior (wrong credentials) not separately manually exercised this batch |
| 6 | Screen-reader-readable labels | Login/Help/Cockpit/SMB/Admin | Pass (automated proxy only) | Axe's accessible-name/label rules passed on all 5 pages; no real screen-reader (NVDA/VoiceOver/JAWS) was used - disclosed limitation |
| 7 | Meaningful page titles | All 5 pages | Pass | Axe `document-title` rule (part of `wcag2a`) passed on all 5 pages |
| 8 | Heading order | All 5 pages | Pass | Axe `heading-order`/landmark rules passed, 0 violations |
| 9 | Session-timeout warning | Not exercised | Not performed | Requires a real, long-lived session to observe; out of this batch's time budget |
| 10 | Destructive-action confirmation | Not exercised | Not performed | No destructive action (e.g. account suspension) was exercised in this pass |
| 11 | Loading/empty states | Service Manager Board | Pass (incidental) | Board rendered a real empty/loading state correctly during manual navigation |
| 12 | Zoom/reflow at 200% | Not exercised | Not performed | Requires a dedicated resize+zoom pass; not done this batch |
| 13 | Mobile navigation (real device or emulated) | Not exercised manually | Automated-only | Covered by the Playwright mobile-Chrome/mobile-Safari e2e projects (functional, not accessibility-specific) - see validation report Phase 6 |
| 14 | RTL readiness | Not applicable this batch | N/A | Arabic/RTL is tracked as a separate initiative (`frontend/src/i18n/`, `rtl.css`) - not part of NFR-015's scope |

## How to re-run this checklist

1. Log in via the real UI as each of the 3 authenticated personas
   (`layla@irisstar.tech`, `khalid@irisstar.tech`, `pa@irisstar.tech` -
   see `scripts/a11yAudit.mjs` for current passwords/roles).
2. For each page, Tab through every interactive control in order;
   confirm each stop is (a) visible in the viewport, (b) has a visibly
   distinct rendered state (not just a `:focus-visible` DOM match -
   verify via `getComputedStyle(document.activeElement).boxShadow`/
   `.outline` are non-`"none"`, per item 3's finding above), and (c)
   activatable via Enter/Space as appropriate.
3. Open any modal/dialog present with real data loaded; confirm Tab
   cannot escape it while open, and focus returns to the triggering
   control on close.
4. Submit each form with invalid data; confirm an accessible,
   programmatically-associated error message appears.
5. Resize the browser to 200% zoom equivalent (or use
   `resize_window`/browser zoom) and confirm no horizontal scrolling or
   content clipping at any of the 5 pages.
6. If a real screen reader is available in a future pass, repeat item 6
   with it active and update this table's "automated proxy only" note
   to a real result.
