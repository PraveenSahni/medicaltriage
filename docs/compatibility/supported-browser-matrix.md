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

- No formal, named browser-version support policy exists (e.g. "Chrome
  N-2"). The matrix tests whatever Playwright's pinned browser builds are
  at time of the test run.

## Update (2026-08-06): full matrix now clean, 86/86

The previously-disclosed "answer call -> SBAR completion" workflow-chain
gap and the `WEB-008` Help-Center stale-test issue are both resolved - see
`docs/compatibility/cross-browser-validation-report.md` for the full
history and root causes. The complete core clinical workflow, including
Help-Center navigation, now passes on all 6 configured engines/mobile
profiles with zero known gaps.
