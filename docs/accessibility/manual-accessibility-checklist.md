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
| 4 | Modal/dialog focus trapping and restoration | Service Manager Board (`ReadOnlyCallDrawer`) | **FIXED (2026-08-05, final batch)** | Was a real, confirmed defect: the only dialog-like overlay in the 5-page scope had no `role="dialog"`/`aria-modal`, no initial focus, no Tab trap, no focus restoration. Fixed: added `role="dialog"`, `aria-modal="true"`, focus moves to the close button on open, Tab/Shift+Tab trap logic added, Escape closes, focus restores to the triggering card on close. **Live-verified on production**: `role`/`aria-modal` present, initial focus on close button confirmed, Escape-close confirmed, focus-restoration-to-trigger confirmed. Tab-trap directional wrap (last→first, first→last) is verified by a real jest/RTL regression test (`TriageServiceManagerBoard.test.tsx`) but gave inconsistent results when re-tested live through the browser-automation tool's synthesized Shift+Tab key events - disclosed as a tooling-verification gap, not a claimed-but-unproven pass. No other dialog/modal exists in the 5-page scope (confirmed via grep - the older `NurseWorkspace`/`NurseWorkspaceRedesign` components that do have `role="dialog"` are out of scope, not part of `#/cockpit`). |
| 5 | Form validation and error recovery | Login form | Pass (implicit) | Login form fields are correctly labeled (axe `label` rule, part of `wcag2a`); real error-message behavior (wrong credentials) not separately manually exercised this batch |
| 6 | Screen-reader-readable labels | Login/Help/Cockpit/SMB/Admin | Pass (automated proxy only) - **no real screen reader available in this environment** | Axe's accessible-name/label rules passed on all 5 pages; no NVDA/VoiceOver/JAWS session was performed - confirmed unavailable, not silently skipped. See known-limitations doc for the interpretation this drives. |
| 7 | Meaningful page titles | All 5 pages | Pass | Axe `document-title` rule (part of `wcag2a`) passed on all 5 pages |
| 8 | Heading order | All 5 pages | Pass | Axe `heading-order`/landmark rules passed, 0 violations |
| 9 | Session-timeout warning | Source-code review (all pages) | **Not implemented** | Real, enforced server-side session TTL exists (`SESSION_TIMEOUT_MINUTES`, default 30 min; `EXTENDED_SESSION_TIMEOUT_MINUTES`, default 8h for "remember me") - confirmed in `src/services/securityAdmin.ts`. But no client-side advance warning, extend-session action, or accessible timeout message exists anywhere in the frontend - confirmed via grep (zero UI component references a countdown/warning), and the app's own Help documentation (`HelpCenter.tsx`) explicitly lists "session-timeout notices" as a **planned, not-yet-built** item. Classification: **Not implemented** (not "not tested" - this is a real, confirmed gap in the current build, not an untested unknown). |
| 10 | Destructive-action confirmation | All 5 pages (inventory) | **N/A - no destructive action exists in the rendered UI** | Confirmed via grep across the 5 in-scope pages: no delete/suspend/revoke/reset/terminate control is rendered anywhere in the current frontend (the backend `PATCH /users/:id/status` and role-permission grant/revoke endpoints built earlier this engagement are real but backend/API-only, with no frontend UI - consistent with this whole engagement's established "backend/API only" scoping for Admin RBAC work). "Sign out" is the only session-ending control in scope and is reversible (re-login), not destructive in the WCAG sense. Classification: **Not applicable** to this batch's literal UI surface. |
| 11 | Loading/empty states | Service Manager Board | Pass (incidental) | Board rendered a real empty/loading state correctly during manual navigation |
| 12 | Zoom/reflow at 320px viewport | Login, Help (unauthenticated), Nurse Cockpit, Service Manager Board | Login: Pass. Help (unauth): **Fixed** (see below). Cockpit: **Confirmed defect, NOT fixed**. Service Manager Board: **Fixed**. | See the detailed reflow findings below this table. Admin page not separately checked this batch (time-boxed) - disclosed. |
| 13 | Mobile navigation (real device or emulated) | Not exercised manually | Automated-only | Covered by the Playwright mobile-Chrome/mobile-Safari e2e projects (functional, not accessibility-specific) - see validation report Phase 6 |
| 14 | RTL readiness | Not applicable this batch | N/A | Arabic/RTL is tracked as a separate initiative (`frontend/src/i18n/`, `rtl.css`) - not part of NFR-015's scope |

## Zoom/reflow findings detail (320px viewport, this batch)

- **Login page**: `document.documentElement.scrollWidth === clientWidth === 320` - no page-level horizontal overflow. Pass.
- **Help Center, unauthenticated "Sign in required" fallback**: real defect found and fixed - the server-rendered HTML response in `src/routes/helpRouter.ts` (returned when no valid session/token is present) had **no `<meta name="viewport">` tag at all**, unlike the main SPA's `index.html` and the authenticated Help Center HTML (`helpLibraryContent.ts`), both of which already have it. Confirmed via `curl` before the fix (`grep -i viewport` returned nothing) and after (tag present). Without it, mobile browsers default to a 980px desktop-width layout viewport, forcing pinch-zoom for this one page. Fixed by adding the identical viewport meta tag used elsewhere in the codebase. Not caught by axe-core (not one of its default rules) - a genuine manual-only find.
- **Nurse Cockpit** (`/#/cockpit`): **real, confirmed, unfixed defect**. At 320px, `document.documentElement.scrollWidth` (468px) exceeds `clientWidth` (320px); the overflowing element is `<main class="cockpit-main">` itself, not a content string inside it - the Cockpit's 3-column desktop layout (sidebar + main workspace + rail) does not collapse to a single-column mobile layout at all. This is a structural, whole-page layout gap, not a small CSS tweak - fixing it properly would mean designing and building a real responsive/mobile layout for the entire primary nurse workflow UI, which is a much larger effort than this batch's "smallest safe fix" scope for the other 2 findings. **Left unfixed, explicitly out of scope for this batch**, and disclosed as a material, real defect blocking full closure - see known-limitations doc.
- **Service Manager Board**: real defect found and fixed - the top action bar (`.smb-top-actions`, containing "Generate Calls"/"Nurse Cockpit"/"Refresh"/"Sign out"/"Help") had no `flex-wrap`, so at 320px the row overflowed the viewport (traced to the `<a class="smb-soft-btn">` Help link extending to x=540 against a 320px viewport) and forced page-level horizontal scroll. The board's own internal multi-column kanban content correctly uses its own contained horizontal scroll (`.smb-board`, `scrollWidth` 1265px vs `clientWidth` 296px) - this is the legitimate WCAG 1.4.10 exception for content that "requires two-dimensional layout for usage or meaning" and was **not** treated as a defect. Fixed the real defect by adding `flex-wrap: wrap` to `.smb-top-actions`. Verified live on production: `scrollWidth === clientWidth === 320` after the fix.
- **Control Center Admin**: not separately checked at 320px this batch (time-boxed) - disclosed as an open item, not assumed passing.
- **200% zoom** (as opposed to 320px viewport): not separately tested this batch via actual browser zoom (only the equivalent narrow-viewport resize was exercised) - disclosed limitation.

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
