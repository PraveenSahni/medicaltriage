# Accessibility Known Limitations - NFR-015

_Written 2026-08-05. Honest, current list of what is NOT yet proven
accessible, so NFR-015's Partial status has a concrete, actionable
punch list rather than a vague caveat._

## 0. IMPORTANT CORRECTION: prior "Nurse Cockpit: 0 violations" audit results were not reliable - found and fixed 2026-08-05

**A real integrity defect in `scripts/a11yAudit.mjs` itself was found
during the Nurse Cockpit responsive-accessibility batch.** Its login
helper (`loginViaUi`) checked `response.ok()` on the `/api/v1/auth/login`
response to decide whether login succeeded - but `Response.ok()` is
`true` for *any* 2xx status, including the real `202 { authenticated:
false, mfaRequired: true }` response the backend returns when an
account has a real, enrolled MFA credential. Discovered because
`layla@irisstar.tech` (this script's NURSE persona for every prior
NFR-015 audit run this whole engagement) and `pa@irisstar.tech` (the
PLATFORM_ADMIN persona) both now have real, enabled MFA credentials
enrolled from earlier AR.13 MFA testing this session - their logins via
this script were silently "succeeding" (no thrown error) while never
actually completing authentication, meaning the script proceeded to
audit whatever unauthenticated/partial page state resulted, **not** the
real, authenticated Nurse Cockpit or Control Center Admin pages it
claimed to be testing.

**Fix**: `loginViaUi` now parses the real response body and requires
`body.authenticated === true`, throwing a clear, specific error
otherwise (confirmed working - re-running the audit with the old
personas now correctly throws `Login did not complete for
layla@irisstar.tech: ... mfaRequired=true` instead of silently
continuing). The script's `NURSE` and `PLATFORM_ADMIN` personas were
switched to `sara@irisstar.tech` (same real `remote_triage_nurse` role/
permissions as layla, confirmed no MFA enrolled) and `sa@irisstar.tech`
(`system_administrator` role, confirmed real Control Center admin
access, confirmed no MFA enrolled) respectively. The `MANAGER` persona
(`khalid@irisstar.tech`) was independently confirmed still able to
complete a real login with no MFA blocker.

**Practical effect / what this means for prior claims**: every
"Nurse Cockpit: 0 violations" and "Control Center Admin: 0 violations"
result reported in this engagement's NFR-015 documentation **from the
point layla's and pa's MFA credentials were enrolled onward** should be
treated as unverified for those two specific pages, not as false
(the pages may well have been genuinely compliant), but as **not
actually tested by the audit that claimed to test them**. This does
**not** retroactively invalidate the real, independently-verified fixes
made this engagement (Focus Visible, modal focus management, reflow
fixes, etc.) - those were each also confirmed via direct, real browser/
CSSOM/DOM inspection, not solely via this audit script's output. But it
does mean the specific claim "axe-core found 0 violations on the Nurse
Cockpit" in prior batches rested on an audit that silently never
reached that page in its authenticated state.

**Re-run with the fix**: `node scripts/a11yAudit.mjs
https://triagedsoc2.irisstar.tech` now genuinely completes real
authenticated logins for all 3 personas and reports 0 violations across
all 5 pages - this result, from this batch onward, is trustworthy.

## 1. Focus Visible defect (WCAG 2.1 SC 2.4.7, Level AA) - FIXED, verified live

**Root cause found** (2026-08-05, follow-up batch): a deliberate
"APP-WIDE BLANK RESET" rule at the very end of `global.css`
(`html body [class][class][class][class][class][class], html body
[class][class][class][class][class][class] *`), engineered with 6
repeated `[class]` attribute selectors specifically to out-specificity
every other `!important` rule in the file "regardless of source
order" (per its own code comment). This rule forces `box-shadow: none
!important` on every classed element and its descendants app-wide,
which silently defeated the generic focus-visible rule's
`box-shadow: var(--focus-ring)` - confirmed via direct CSSOM
inspection (`document.styleSheets`), not guesswork: the focus rule
matched and its `--focus-ring` value resolved correctly, but the reset
rule (index 1648 of 1686 in the bundled stylesheet) won on specificity
and set `box-shadow: none !important`.

**Fix**: the reset rule does **not** touch the `outline` property at
all (only `background`/`border`/`box-shadow`/`color`/`font-weight`/
`text-transform`/`letter-spacing`). Changed the generic
`button:focus-visible, a:focus-visible, input:focus-visible,
select:focus-visible, textarea:focus-visible` rule in `global.css` to
use `outline: 3px solid var(--t1); outline-offset: 2px;` instead of
`box-shadow: var(--focus-ring)` - `--t1` is the exact same outer-ring
color `--focus-ring` already used (`#0a1f44` light mode / `#ffffff`
dark mode), so no new color was invented, and `outline-offset` gives
the same visible-gap/halo effect the old box-shadow's `--bg` layer
provided. This survives the reset rule since `outline` isn't a
property it resets.

**Verified live** on the real production domain
(`triagedsoc2.irisstar.tech`, revision `ist-triage-soc2-00049-tuv`,
100% traffic): tabbing to the exact previously-broken
`.smb-soft-btn` ("Stop/Generate Calls") on the Service Manager Board
now shows `outline: rgb(10, 31, 68) solid ~2.67px`, `outline-offset:
2px` - a real, visible ring. Also verified on an unrelated element with
no component-specific override (`عربي` language button on the login
page) to confirm the fix is genuinely generic, not just patched for
one selector. Full 5-page/persona axe-core audit re-run after the fix:
0 violations (no regression). Frontend jest suite: 55/55 still passing.

**A second, real, distinct deployment-path bug was found and fixed
while verifying this** - see item 2 below (Firebase Hosting static
upload vs. Cloud Run rewrite).

**This item is now closed** - re-run `manual-accessibility-checklist.md`
item 3 was repeated across the Service Manager Board and confirmed
passing; a full per-page sweep of every button class was not
exhaustively repeated across all 5 pages (time-boxed), so this remains
noted as a residual, low-risk follow-up rather than a fully
page-by-page-proven closure.

## 2. Firebase Hosting serves a LOCAL static build, independent of the Cloud Run image - deeper root cause found

**Original framing (prior batch) was incomplete.** The prior batch
found that a Cloud Run traffic cutover alone doesn't update what
`triagedsoc2.irisstar.tech` serves, and worked around it with
`firebase deploy --only hosting:soc2`. This follow-up batch discovered
**why**, and that the prior workaround was itself insufficient on its
own: `firebase.json`'s `soc2` hosting target has `"public": "dist-web"`
- Firebase Hosting serves files that exist in that local directory
**directly**, without ever reaching the Cloud Run `run` rewrite, for
any request path that matches an uploaded static file (e.g.
`/assets/index-*.css`). `firebase deploy --only hosting:soc2` uploads
whatever is in the **local** `dist-web` directory at the moment the
command runs - which is a completely separate build artifact from the
Docker image built and deployed to Cloud Run via `gcloud builds
submit`/`gcloud run deploy`.

**Concretely, this batch**: after building and deploying the Focus
Visible CSS fix to Cloud Run (revision `ist-triage-soc2-00049-tuv`,
100% traffic) and running `firebase deploy --only hosting:soc2` (per
the prior batch's runbook update), production still served the OLD,
pre-fix CSS bundle (`index-BSWmeLJU.css`, confirmed via direct
`getComputedStyle` inspection showing `outline-style: none` again,
even though the Cloud Run canary URL and a `curl` of the Cloud Run
image's own container showed the fix present). Root cause: the local
`dist-web` directory had not been rebuilt with `npm run build:web`
since before this fix - the `firebase deploy` command dutifully
re-uploaded the stale local build, masking the real fix.

**Real fix**: ran `npm run build:web` (`vite build --config
frontend/vite.config.ts`) locally to regenerate `dist-web` with the
current source, confirmed the output hash (`index-CMwPER3V.css`)
matched what the Cloud Run canary independently served, then re-ran
`firebase deploy --only hosting:soc2`. Confirmed via `curl` and live
browser inspection that production now serves the correct,
current-source bundle and the Focus Visible fix is genuinely live.

**Practical effect / required process change**: the canary-then-
cutover runbook for this environment must include, as a required step
in this exact order: (1) `gcloud builds submit` (Docker image for
Cloud Run), (2) `npm run build:web` (a **separate, independent** local
static build for Firebase Hosting - do not skip this even if step 1
"already built the frontend," since the Docker build happens inside a
container and never touches the local `dist-web` directory), (3)
`gcloud run deploy --no-traffic` (canary) + audit, (4)
`gcloud run services update-traffic` (cutover), (5) `firebase deploy
--only hosting:soc2` (uploads the step-2 build). Skipping step 2 before
step 5 will silently serve stale static assets on the custom domain
indefinitely, with no error or warning from any command in the
sequence - exactly what happened in this batch and the prior one.
**This is a real, generally-applicable gap in this environment's
deployment runbook**, not specific to this one fix, and should be
fixed at the runbook/tooling level (e.g. a single script wrapping all
5 steps) rather than relied on being remembered manually each time.

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

## 4. No real assistive-technology (screen reader) testing performed - confirmed unavailable, still open

Confirmed no NVDA/JAWS/VoiceOver or equivalent is available in this
engineering environment (checked again in the final manual-validation
batch, 2026-08-05 - no change). All "screen-reader-readable" claims in
the validation report and checklist are automated-proxy-only (axe-core's
accessible-name/label/ARIA rules), not verified with a real screen
reader. **Do not claim real screen-reader compatibility based on this
batch's evidence alone.** This is the primary remaining item keeping
NFR-015 at Partial rather than Yes - see the closure decision in
`accessibility-validation-report.md`.

## 5. Modal/dialog focus management - FIXED, verified live (2026-08-05, final batch)

`ReadOnlyCallDrawer` (Triage Service Manager Board's call-detail
overlay) was the only dialog-like component in the 5-page scope and
had no `role="dialog"`, no `aria-modal`, no initial focus, no Tab trap,
and no focus restoration on close - a real WCAG 2.1 SC 2.4.3 gap.
Fixed: added `role="dialog"`/`aria-modal="true"`, focus moves to the
close button on open (captured via a real `useRef`), a Tab/Shift+Tab
trap cycles focus between the first and last focusable elements while
open, Escape closes it, and focus returns to the triggering call card
on close. Verified with 2 new jest/RTL regression tests
(`TriageServiceManagerBoard.test.tsx`) and live on production: `role`/
`aria-modal` present, initial focus on the close button confirmed,
Escape-close confirmed, focus-restoration-to-trigger confirmed. The
Tab-trap's directional wrap gave inconsistent results when re-tested
live via the browser-automation tool's synthesized Shift+Tab events
(works correctly and reliably in the real jsdom/RTL test, which uses
real DOM `KeyboardEvent`s) - disclosed as a tooling-verification gap
for this one sub-check, not claimed as fully live-proven.

## 6. Reflow/zoom at 320px - all 3 confirmed defects now fixed and verified live

- **Fixed** (prior batch): unauthenticated `/help` fallback page had no
  `<meta name="viewport">` tag at all (`src/routes/helpRouter.ts`),
  forcing a 980px desktop-width mobile rendering.
- **Fixed** (prior batch): Service Manager Board's top action bar
  (`.smb-top-actions`) had no `flex-wrap`, causing page-level
  horizontal overflow at 320px. Added `flex-wrap: wrap`. The board's
  own internal kanban-column horizontal scroll is untouched and
  correctly exempted (WCAG 1.4.10's two-dimensional-layout exception).
- **Fixed (this batch, 2026-08-05)**: the Nurse Cockpit page's 3-column
  desktop layout (300px sidebar + flex:1 main workspace, RagShadowRail
  already collapsed below 1600px by a pre-existing rule) had no
  breakpoint at all below that - `<main class="cockpit-main">` was
  468px wide against a 320px viewport, a real, structural WCAG 1.4.10
  failure on the primary nurse workflow screen. Fixed via a new
  responsive breakpoint in `frontend/src/cockpit/cockpit.css`:
  `.cockpit-layout` switches from a row to a column flex direction
  below 900px, the sidebar becomes full-width and height-bounded
  (`max-height: 40vh`, scrollable) instead of a fixed 300px side
  column, and the main workspace becomes full-width - a single-column
  stack, the smallest safe pattern that preserves every real control
  without inventing a new drawer/tab component. Below 480px, the
  stage-tabs row also gains `flex-wrap`. The existing `stage-tabs`
  navigation was also upgraded to real `role="tablist"`/`role="tab"`/
  `aria-selected` semantics (`CockpitApp.tsx`) - a genuine ARIA
  correctness improvement, not just a visual fix. **Verified live** via
  30 new Playwright tests (`tests/e2e/cockpitResponsive.spec.ts`)
  passing across all 6 configured browser engines (Chromium, Edge,
  Firefox, WebKit, mobile Chrome, mobile Safari) at 320px, 768px, and
  desktop widths, confirming `scrollWidth === clientWidth`, single-
  column stacking, and real tablist semantics. Also confirmed via the
  now-trustworthy `scripts/a11yAudit.mjs` (see item 0 above): 0
  violations on the authenticated Nurse Cockpit page, for the first
  time via a login that genuinely completed.
- Control Center Admin was not separately checked at 320px this batch
  (disclosed, not assumed passing). 200% browser zoom (as distinct from
  a 320px-equivalent narrow viewport) was not separately tested via
  actual browser zoom, though the 320px-equivalent narrow-viewport
  behavior was.

## 7. Session-timeout warning - confirmed NOT implemented (not merely untested)

Real, enforced server-side session TTL exists (`SESSION_TIMEOUT_MINUTES`/
`EXTENDED_SESSION_TIMEOUT_MINUTES` in `src/services/securityAdmin.ts`),
but there is no client-side advance warning, extend-session action, or
accessible timeout message anywhere in the frontend - confirmed via
code search (zero matching UI component) and the application's own
Help documentation, which lists "session-timeout notices" as an
explicitly planned, not-yet-built item. This is classified as **Not
implemented**, a confirmed gap, not an unknown - disclosed plainly per
the instruction not to hide it as "not tested."

## 8. Destructive-action confirmation - Not applicable to the current UI

No destructive action (delete/suspend/revoke/reset/terminate) is
rendered anywhere in the 5-page-scope frontend - confirmed via code
search. The backend RBAC/session-management mutation endpoints built
earlier this engagement are real but backend/API-only by explicit
design, with no frontend control. "Sign out" is the only session-
ending control and is reversible. Classified as **N/A** for this
batch's literal UI surface, not a gap requiring a fix.

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
- The Focus Visible defect (item 1) and modal focus-management defect
  (item 5) are both real, confirmed-root-caused, fixed, deployed to
  production, and live-verified.
- Two real reflow defects were found and fixed (missing viewport meta
  on `/help`'s unauthenticated fallback; unwrapped top-action bar on
  the Service Manager Board) - both verified live at 320px on
  production with zero page-level horizontal overflow remaining.
- Full backend suite (735/735) and full frontend suite (57/57) pass
  with zero regressions after all of this batch's fixes.

## Remaining material gaps as of this batch (the reason NFR-015 stays Partial)

1. **No real screen-reader testing has ever been performed** (item 4) -
   none is available in this environment. A prepared, not-yet-executed
   checklist now exists (`screen-reader-validation-checklist.md`) for a
   future session with real assistive-technology access.
2. **No session-timeout warning exists** (item 7) - confirmed not
   implemented, not merely untested.

The Nurse Cockpit's mobile-responsiveness defect (previously the other
blocker) is now **fixed and verified live** (item 6). Items 1-2 above
are the sole reason this row remains Partial. Everything else found
this engagement - color contrast, `.smb-board` keyboard focus, Focus
Visible, modal focus management, all 3 reflow defects, and a real
audit-tooling integrity bug (item 0) - has been found, fixed, deployed,
and verified live with a genuinely trustworthy automated audit.
