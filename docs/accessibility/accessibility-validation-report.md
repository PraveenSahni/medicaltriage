# Accessibility Validation Report - NFR-015

_Written 2026-08-05. Covers the NFR-015 accessibility redeployment and
validation batch. This report states exactly what was tested, against
which real environment, and what the results were - no claim here
exceeds the evidence below._

## Requirement interpretation (Phase 1)

**Literal wording** (QR CSQ, `UX` tab, NFR-015): *"Responsiveness &
Accessibility - Mobile friendly: Fully responsive design for seamless
use on desktops, tablets, and mobile devices / Compliance with WCAG 2.1
or equivalent accessibility standards (Accessibility Compliance)."*
Mandatory: Yes.

This row does not, in its literal text, require an independent/external
audit, a specific conformance level beyond "WCAG 2.1 or equivalent," or
a named assistive-technology test matrix. It requires (a) a fully
responsive design across desktop/tablet/mobile, and (b) accessibility
compliance with WCAG 2.1 or an equivalent standard. Given the QR
Consolidated Clarification pack already lists NFR-016 (brand theming)
as the only other UX-tab item pending QR input, and no other QR
document on file states an external-audit requirement for this
specific row, this batch treats "internal automated + manual validation
against the current, deployed build, honestly reported" as sufficient
evidence for this row's literal ask - **not** as "full WCAG 2.1 AA
certification," which would require an accredited external auditor
(tracked separately in `docs/qr-compliance/external-assurance-pack.md`).

## Environment and deployment (Phase 2-3)

- **Environment**: `ist-triage-soc2` Cloud Run service, project
  `triage-502706`, region `me-central1`, custom domain
  `triagedsoc2.irisstar.tech` (Firebase Hosting `run` rewrite).
- **Prior live revision**: `ist-triage-soc2-00045-muy` (100% traffic,
  from the preceding IS.61 batch) - an older build, predating this
  session's accessibility fixes (`--muted` color-contrast fix and
  `.smb-board` `tabIndex`/`aria-label` fix, both committed earlier
  today in `e8badbe9`).
- **Source commit built**: `c52a4c69` (HEAD at the start of this
  batch), plus this batch's own fix to `scripts/a11yAudit.mjs`'s login
  mechanism (committed alongside this report - see final commit).
- **Build**: `gcloud builds submit` ->
  `me-central1-docker.pkg.dev/triage-502706/ist-triage-repo/ist-triage-soc2:20260805-nfr015`
  (digest `sha256:5cdb6525c5ba13314891edda544aa2990de0c9b9d1c1479947db209f766260fd`),
  build ID `9beaef14-e14b-40db-afd1-4c83226a7b14`, `2026-08-05T17:46:35Z`,
  duration 2m43s, status `SUCCESS`.
- **Canary deploy**: `gcloud run deploy --no-traffic --tag=nfr015-a11y`
  -> revision `ist-triage-soc2-00047-nuz`, served at
  `https://nfr015-a11y---ist-triage-soc2-gv6v4zyvuq-ww.a.run.app`.
  Health-checked (`GET /api/v1/runtime/environment` -> `200`) before
  any audit traffic was sent to it.
- **Canary audit result**: 0 violations across all 5 pages/personas
  (see Phase 4 below for the full result).
- **Cutover**: `gcloud run services update-traffic --to-revisions=ist-triage-soc2-00047-nuz=100`
  - confirmed via `services describe`: `ist-triage-soc2-00047-nuz` at
  100%, all 17 prior revisions at 0%.
- **Post-cutover finding (new, this batch)**: the custom domain
  `triagedsoc2.irisstar.tech` (Firebase Hosting) initially still served
  2 violations identical to the pre-fix baseline, **even though the
  Cloud Run revision itself was already 100% cut over and had already
  proven 0 violations via its direct canary URL**. Root cause: Firebase
  Hosting's own CDN edge cache had not been invalidated - no new
  `firebase deploy` had occurred, only a new Cloud Run revision/traffic
  split, and the CDN's cache for the `**` `run`-rewrite responses was
  not automatically purged by a Cloud Run traffic change alone. Fix:
  `firebase deploy --only hosting:soc2` (a real Hosting release,
  forcing CDN invalidation even though the Hosting config content
  itself was unchanged). Re-ran the audit against the custom domain
  immediately after - 0 violations, matching the canary result. **This
  is a new, real operational finding**: future redeployments to this
  environment must include a `firebase deploy --only hosting:soc2` step
  whenever the fix depends on end users reaching the custom domain
  quickly, not just the Cloud Run URL - noted in
  `docs/accessibility/accessibility-known-limitations.md` and should be
  folded into the standard canary-then-cutover runbook for this
  environment going forward.

## Automated validation (Phase 4)

**Tool**: `scripts/a11yAudit.mjs` (axe-core via `@axe-core/playwright`,
Chromium via `@playwright/test`), tags `["wcag2a", "wcag2aa", "wcag21a",
"wcag21aa"]`. **This batch's fix**: the script's login mechanism was
broken (`loginAndGetCookie()` relied on a raw `fetch()` extracting a
`Set-Cookie` response header, which Firebase Hosting's `run` rewrite
does not reliably return to a bare HTTP client - a new manifestation of
the platform's already-documented Cookie-forwarding limitation, see
`docs/architecture/session-authentication-cross-instance.md`). Fixed by
switching to a real UI-driven login (`loginViaUi()`: fill `#username`/
`#password`, click the submit button, wait for the `/api/v1/auth/login`
response) - the same pattern already proven in
`tests/e2e/browser-journey.spec.ts`. Without this fix, none of the 3
authenticated-page audits could have run at all.

**Pages/personas audited** (all 5, both against the `--no-traffic`
canary and, after the CDN-cache fix above, the live custom domain):

| Page | Persona | Result (canary) | Result (production, post-CDN-fix) |
|---|---|---|---|
| Login page (unauthenticated) | none | 0 violations | 0 violations |
| Help Center (unauthenticated) | none | 0 violations | 0 violations |
| Nurse Cockpit | `layla@irisstar.tech` (remote_triage_nurse) | 0 violations | 0 violations |
| Triage Service Manager Board | `khalid@irisstar.tech` (triage_service_manager) | 0 violations | 0 violations |
| Control Center - Admin | `pa@irisstar.tech` (platform_super_administrator) | 0 violations | 0 violations |

**Total**: 0 violations (critical/serious/moderate/minor all 0) across
all 5 pages/personas, on both the canary and the live production
domain (after the CDN-cache invalidation above). Full raw JSON output
is reproducible via `node scripts/a11yAudit.mjs https://triagedsoc2.irisstar.tech`.

**What this automated pass covers**: missing `lang`, missing form
labels/accessible names, invalid ARIA, heading hierarchy, landmark
structure, color contrast, several dialog/keyboard-trap heuristics -
everything axe-core's `wcag2a`/`wcag2aa`/`wcag21a`/`wcag21aa` rule sets
check for. **What it does not cover** (by design - axe-core is a static/
DOM-analysis tool, not a full interaction simulator): real keyboard-only
navigation through multi-step flows, visible focus-indicator presence/
contrast (see the manual finding below - a real, confirmed gap this
automated pass did **not** catch), screen-reader announcement quality,
zoom/reflow behavior, or session-timeout/destructive-action UX. Those
are exactly why Phase 5 (manual validation) exists and must not be
skipped or treated as redundant with this automated pass.

**Prior violations investigated and found to be stale-deployment
artifacts, not real code defects**: this batch's initial audit against
the *old* live revision (`...-00045-muy`) found 2 serious violations on
the Service Manager Board (`color-contrast` on `.smb-metric-label`,
`scrollable-region-focusable` on `.smb-board`). Direct source
inspection confirmed both were **already fixed in source**, committed
in an earlier batch today (`e8badbe9`) - the `--muted` color token fix
and the `tabIndex={0}`/`aria-label` fix respectively - and simply had
not yet been deployed. The canary audit (0 violations) confirms this
conclusively: no code change was needed for either.

## Manual validation (Phase 5)

Performed via the Browser pane against the live, current production
build (`https://triagedsoc2.irisstar.tech`), logged in as
`khalid@irisstar.tech` (Triage Service Manager Board):

| Check | Result | Note |
|---|---|---|
| Keyboard-only Tab navigation reaches real controls | Pass | Tabbed to the "Generate Calls" toggle button; a real, focusable, operable control |
| `:focus-visible` state applied by the browser | Pass | `element.matches(':focus-visible')` -> `true` after a Tab keypress |
| **Visible focus indicator actually rendered** | **FAIL - confirmed real defect** | Computed `box-shadow` on the focused `.smb-soft-btn` was `none` despite `--focus-ring` (`0 0 0 2px #fff, 0 0 0 5px #0a1f44`) resolving correctly at that element and `:focus-visible` correctly matching. A broader `box-shadow: none !important` rule elsewhere in the stylesheet cascade (multiple candidates found in `global.css`/`cockpit.css`/`login.css`, exact overriding selector not yet isolated) suppresses the ring for at least this button. **This is a genuine WCAG 2.1 SC 2.4.7 (Focus Visible, Level AA) failure**, not caught by the automated axe-core pass above (axe does not check focus-ring rendering by default). |
| Logical page title present | Pass | Confirmed via `document.title`/page load on all 5 audited pages (implicit in the 0-violation `document-title` axe rule, which is part of `wcag2a`) |
| Heading order | Pass (automated) | Covered by axe's `heading-order`/landmark rules, 0 violations |
| Form labels (login form) | Pass | `#username`/`#password` correctly labeled - confirmed both by axe (`label` rule, part of `wcag2a`) and by the real UI login used throughout this batch's own audit tooling |

**Not performed this batch** (explicitly disclosed, not silently
assumed passing) - see
`docs/accessibility/accessibility-known-limitations.md` for the full
list and reasoning: modal/dialog focus-trap and restoration (no modal
was populated with data during this session's manual pass to exercise),
zoom/reflow at 200%, mobile-device manual keyboard/focus check (mobile
coverage this batch was automated-only, via the e2e matrix's mobile
projects - see Phase 6), screen-reader-driven testing (no assistive
technology is available in this environment), session-timeout warning
UX, and destructive-action confirmation UX.

## Browser coverage (Phase 6)

The existing 4-engine/2-mobile Playwright matrix
(`tests/e2e/browser-journey.spec.ts`, `playwright.config.ts`) applies
to functional/regression coverage for this change, **not** to the
accessibility scan itself - `scripts/a11yAudit.mjs` runs axe-core only
through Playwright's Chromium build, a single engine. This is an
honest, disclosed limitation: **automated accessibility scanning in
this batch is Chromium-only**; Firefox/WebKit/mobile engines were not
independently scanned for accessibility violations, only for functional
regressions (see below).

Ran the full matrix (`npx playwright test tests/e2e/browser-journey.spec.ts`)
against Chromium, Microsoft Edge, Firefox, WebKit (Safari engine),
mobile Chrome (Pixel 5 emulation), and mobile Safari (iPhone 13
emulation): **18 passed, 6 failed (all 6 failures are the same single
test, `WEB-004 renders queue records from the API without data drift`,
failing identically across all 6 engines with the same error** (a
missing test-fixture queue record, `case-10002`, not present in this
environment's current queue data - a pre-existing test-data gap, not a
browser-engine-specific or accessibility-related regression, confirmed
by the fact that the failure is byte-identical across every engine
rather than varying by rendering engine as a real cross-browser bug
would). All other functional assertions (page load, protocol
matching, form submission, clipboard operations) passed on every
engine, indicating no cross-browser functional regression from this
batch's changes.

## Closure determination (superseded by the 2026-08-05 follow-up batch below)

Per the 7 closure criteria in the original batch instructions:

1. Current fixes deployed - **Yes** (confirmed via 0-violation canary +
   production audit).
2. 5-page automated audit passes without material violations - **Yes**.
3. Manual keyboard and focus checks pass - **No** - a real, confirmed
   Focus Visible (WCAG 2.1 SC 2.4.7) defect was found on at least one
   real control this batch.
4. Form labels and error handling validated - **Yes** (automated +
   manual, login form).
5. Browser coverage meets the literal requirement - **Partial** -
   functional coverage across 6 engines confirmed; accessibility
   scanning itself is Chromium-only.
6. No unresolved material accessibility defect remains - **No** - the
   Focus Visible defect above is unresolved as of this report.
7. Questionnaire does not require independent external audit - true per
   Phase 1's literal-text reading, but does not offset criterion 3/6
   above.

**NFR-015 remained Partial** at the end of this original batch pending
the Focus Visible fix below.

## Follow-up batch (2026-08-05): Focus Visible remediation

**Root cause** found via direct CSSOM inspection (not guesswork): an
app-wide "blank reset" rule at the end of `global.css`
(`html body [class][class][class][class][class][class], ... *`),
deliberately engineered with 6 repeated `[class]` attribute selectors
to out-specificity every other `!important` rule in the file
"regardless of source order" (per its own code comment). It forces
`box-shadow: none !important` on every classed element, which silently
defeated the generic `:focus-visible` rule's `box-shadow: var(--focus-ring)`.

**Fix**: switched the generic focus rule
(`button:focus-visible, a:focus-visible, input:focus-visible,
select:focus-visible, textarea:focus-visible` in `global.css`) to use
`outline: 3px solid var(--t1); outline-offset: 2px;` instead of
`box-shadow` - the reset rule does not touch `outline` at all, and
`--t1` reuses the exact same outer-ring color `--focus-ring` already
used, so no new color token was invented.

**Deployment**: built image
`ist-triage-soc2:20260805-focusvisible` (digest
`sha256:ec7c9b63f55050eee626a42a92fffb1f621071f74ec8a534e4b9791bdba05576`,
build `d56c111d-cd67-4d23-b528-8a0d03bd9e0f`), deployed as `--no-traffic`
canary `ist-triage-soc2-00049-tuv` (tag `focus-visible-fix`),
health-checked, audited (0 violations across all 5 pages/personas),
cut over to 100% traffic.

**Second, distinct, real bug found and fixed during verification**:
after cutover, `triagedsoc2.irisstar.tech` still served the OLD CSS
bundle (`index-BSWmeLJU.css`) even after re-running `firebase deploy
--only hosting:soc2`, because that command uploads the **local**
`dist-web` directory, which had not been rebuilt with the current
source. Firebase Hosting serves matching static asset paths directly,
bypassing the Cloud Run rewrite entirely - so the Cloud Run image being
correct was not sufficient. Fixed by running `npm run build:web`
locally (producing the correct `index-CMwPER3V.css`, matching the
Cloud Run canary's independently-served hash) before re-running
`firebase deploy --only hosting:soc2`. Full detail in
`docs/accessibility/accessibility-known-limitations.md` item 2 - this
is a real, generally-applicable gap in this environment's deployment
runbook that should be fixed at the tooling level.

**Live verification** (real browser, real keyboard Tab, real
production domain, post-fix): the exact previously-broken
`.smb-soft-btn` on the Service Manager Board now computes `outline:
rgb(10, 31, 68) solid ~2.67px`, `outline-offset: 2px` - a real, visible
focus ring. Cross-checked on an unrelated element with no
component-specific override (the login page's `عربي` language toggle)
to confirm the fix is genuinely generic. Full 5-page/persona axe-core
re-audit: 0 violations (no regression). Frontend jest: 55/55 passing,
no regression.

## Updated closure determination

1. Current fixes deployed - **Yes**.
2. 5-page automated audit passes without material violations - **Yes**.
3. Manual keyboard and focus checks pass - **Yes** - the Focus Visible
   defect is fixed and verified live on production via direct keyboard
   testing (not just DOM/CSSOM inspection).
4. Form labels and error handling validated - **Yes**.
5. Browser coverage meets the literal requirement - **Partial**
   (unchanged) - functional coverage across 6 engines confirmed;
   automated accessibility scanning itself remains Chromium-only (see
   known-limitations item 3, not addressed this batch).
6. No unresolved material accessibility defect remains - **Yes**, with
   one caveat: the Focus Visible fix was verified on the Service
   Manager Board and cross-checked on one unrelated login-page control,
   but was not exhaustively re-checked against every button/control
   class across all 5 pages (time-boxed) - see known-limitations item 1.
7. Questionnaire does not require independent external audit - true per
   the original Phase 1 reading.

**NFR-015 remains Partial**, not moved to Yes. Reasoning: the one
*confirmed defect* found by this engagement (Focus Visible) is now
genuinely fixed and verified live - a real, material improvement. But
several manual checks explicitly required by the batch instructions
were never performed at all (modal focus-trap/restoration, 200%
zoom/reflow, session-timeout warning, destructive-action confirmation,
and a real screen-reader pass) - "not yet tested" is a different, more
honest status than "tested and passing," and moving this row to Yes
would overstate what has actually been verified, contradicting this
engagement's own standing instruction not to claim compliance beyond
the evidence. The correct, honest framing: **the known defect blocking
Yes is now closed; the remaining blocker is incomplete manual test
coverage, not a known defect** - a materially different and better
Partial than either prior batch's. See
`docs/accessibility/accessibility-known-limitations.md` for the exact
punch list a future batch would need to complete (modal, zoom, session-
timeout, destructive-action, screen-reader, exhaustive per-page focus
sweep) before this row could honestly move to Yes.
