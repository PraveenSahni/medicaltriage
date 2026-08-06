# Supported Browser/Device Matrix (NFR-004, UX tab)

_Written 2026-08-06._

## Literal requirement (confirmed from the questionnaire)

NFR-004 (UX tab): **"Cross-Browser Compatibility: Ensure functionality across
modern browsers used across the enterprise."** Column D: "High" priority,
mandatory. This wording requires:

- Browser compatibility (multiple independent rendering engines)
- Functional workflow coverage (not just visual rendering)
- Evidence of testing

It does **not** name specific browser versions, a formal support-version
policy, or accessibility (that's the separate NFR-015 row). Mobile
responsiveness is closely related but is its own row (NFR-001) - this
document covers both together since the same Playwright matrix exercises
both.

## Closure criteria defined before testing

Login-page rendering alone does not prove application compatibility - the
full clinical workflow (queue display, answering a call, protocol/guidance
display, completing a call) must be exercised. Only a passing run across
the real workflow, on real independent rendering engines, counts as
evidence.

## Supported matrix (as configured in `playwright.config.ts`)

| Project | Engine | Form factor |
|---|---|---|
| `google-chrome` | Chromium (Chrome channel) | Desktop |
| `microsoft-edge` | Chromium (Edge channel) | Desktop |
| `mozilla-firefox` | Gecko (Firefox) | Desktop |
| `webkit-safari` | WebKit (Safari engine) | Desktop |
| `mobile-chrome-pixel5` | Chromium | Mobile (Pixel 5 emulation) |
| `mobile-safari-iphone13` | WebKit | Mobile (iPhone 13 emulation) |

3 genuinely independent rendering engines (Chromium, Gecko, WebKit) across
4 desktop + 2 mobile device profiles.

## Known limitations (disclosed)

- The deeper "answer call → SBAR completion" workflow chain
  (`WEB-005`–`WEB-008`, `API-005`–`API-008`) could not be fully verified
  this batch - see `docs/compatibility/cross-browser-validation-report.md`
  for the exact, confirmed root cause (a call-center-gateway session/
  permission gap, identical across all 6 engines - not a browser-specific
  defect).
- No formal, named browser-version support policy exists (e.g. "Chrome
  N-2"). The matrix tests whatever Playwright's pinned browser builds are
  at time of the test run.
