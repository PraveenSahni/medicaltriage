# IST Health Theme Pack

Propagatable design system for **IST HIS / IRIS STAR Technologies L.L.C** — extracted from the React login shell and mirrored for GNU Health SAO and other apps.

**Path:** `docs/design/IST_Health_Theme_Pack/`

## Brand

| Role | Name |
|------|------|
| Product | **IST Health** / **IST HIS** |
| Iris Star | **IRIS STAR Technologies L.L.C** (IST abbreviation) |
| Legal footer | **IRIS STAR Technologies L.L.C** |
| Company | IRIS STAR Technologies L.L.C · Doha, Qatar |
| Tagline (login) | The Digital Health Engine for the Middle East & Africa. |

Primary look: **navy + gold**, Inter + Noto Sans Arabic, hairline dividers, Swiss whitespace. Login is the visual reference.

## Contents

| File | Purpose |
|------|---------|
| [TOKENS.md](./TOKENS.md) | Colors, type, spacing, radii, shadows (exact hex) |
| [LOGIN_SPEC.md](./LOGIN_SPEC.md) | Login screen anatomy + rules from `LoginPage.tsx` |
| [COMPONENTS.md](./COMPONENTS.md) | Buttons, inputs, header, footer patterns |
| [tokens.css](./tokens.css) | Copy-paste CSS variables (export of source of truth) |
| [tokens.json](./tokens.json) | Machine-readable tokens for other apps |
| [sao-bridge.md](./sao-bridge.md) | Map → `sao-custom.css` / `sao-custom.js` |
| [preview.html](./preview.html) | Static visual reference (open in browser) |

## Source of truth (repo)

| Layer | Path |
|-------|------|
| Design tokens | `frontend/src/styles/variables.css` |
| Fonts / base type | `frontend/src/styles/base.css` |
| Components | `frontend/src/styles/components.css` |
| Login layout | `frontend/src/styles/layout.css` + `LoginPage.tsx` |
| Logos | `assets/logo-*.svg`, `frontend/public/assets/logo-*.svg` |
| SAO mirror | `frontend/deploy/sao-custom.css`, `sao-custom.js` |

When tokens change in the frontend, **update this pack** (`tokens.css` + `tokens.json` + docs) in the same PR when possible.

## How to propagate

### 1. New React / Vite app

1. Copy `tokens.css` (or import from this folder).
2. Load Google Fonts Inter 400–900 + Noto Sans Arabic (already in `tokens.css` `@import`).
3. Set `data-theme="light"` or `"dark"` on `<html>`.
4. Copy logo SVGs to `/assets/logo-symbol.svg` and `/assets/logo-full.svg`.
5. Follow [LOGIN_SPEC.md](./LOGIN_SPEC.md) and [COMPONENTS.md](./COMPONENTS.md) for chrome.

### 2. SAO (GNU Health Tryton web client)

See [sao-bridge.md](./sao-bridge.md). Deploy mirrors only — **do not fork SAO**.
**Do not change production SAO icons from this pack alone** — icon recolor lives in `sao-custom.js` and needs an explicit deploy.

### 3. Other stacks (Flutter, native, email)

Use [tokens.json](./tokens.json): `themes.light` / `themes.dark` hex values + `fonts.stacks`.

## Do / Don't

**Do**

- Use navy `#0a1f44` as primary and gold `#c9a66b` as accent.
- Prefer hairline borders; keep default shadows `none` (login card is the exception).
- Use Inter for UI; Georgia stack only for taglines (`.ist-tagline`).
- Support EN LTR / AR RTL with Noto Sans Arabic.

**Don't**

- Purple-on-white / purple→indigo AI defaults.
- Warm cream `#F4F1EA` + terracotta “editorial” look.
- GNU / Tryton teal `#267f82` as brand primary.
- Broadsheet / newspaper dense columns as the default chrome.
- Heavy glow, emoji chrome, or pill-stat clusters on branded first screens.

## Quick token summary

| Token | Light hex |
|-------|-----------|
| Navy | `#0a1f44` |
| Navy dark | `#071428` |
| Navy light | `#1a3056` |
| Gold | `#c9a66b` |
| Gold muted | `#f0e6d4` |
| Gray 50 / bg subtle | `#f7f8fa` |
| Border | `#d8dce2` |
| Success | `#1f6b4a` |
| Danger | `#8b1e2f` |
| Font EN | `"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif` |
| Font AR | `"Noto Sans Arabic", "Segoe UI", "Traditional Arabic", Tahoma, sans-serif` |

Open [preview.html](./preview.html) for a one-page swatch + mini login chrome.
