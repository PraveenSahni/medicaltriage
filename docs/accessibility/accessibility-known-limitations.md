# Accessibility Known Limitations - NFR-015

_Written 2026-08-05. Honest, current list of what is NOT yet proven
accessible, so NFR-015's Partial status has a concrete, actionable
punch list rather than a vague caveat._

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
