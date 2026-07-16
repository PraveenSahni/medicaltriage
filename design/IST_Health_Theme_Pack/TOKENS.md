# IST Health — Design Tokens

Exact values from `frontend/src/styles/variables.css` (and login usage in `base.css` / `layout.css` / `components.css`).

Machine copies: [tokens.css](./tokens.css), [tokens.json](./tokens.json).

---

## Brand strings

| Key | Value |
|-----|--------|
| Product | IST Health |
| Short product | IST HIS |
| Company | IRIS STAR Technologies L.L.C |
| Iris Star | IRIS STAR Technologies L.L.C |
| Legal | IRIS STAR Technologies L.L.C |
| Location | Doha, Qatar |
| Login tagline | The Digital Health Engine for the Middle East & Africa. |

---

## Colors — light theme (canonical brand)

### Core

| Token | Hex | Role |
|-------|-----|------|
| `--color-navy` | `#0a1f44` | Primary brand / text / buttons |
| `--color-navy-dark` | `#071428` | Hover, deeper chrome |
| `--color-navy-light` | `#1a3056` | Links (login), secondary navy |
| `--color-navy-muted` | `#3d4f6a` | Muted navy / SAO icon mid |
| `--color-gold` | `#c9a66b` | Accent, tagline, active nav |
| `--color-gold-light` | `#d4b87a` | Lighter accent |
| `--color-gold-muted` | `#f0e6d4` | Soft gold wash / SAO hover |

### Neutrals

| Token | Hex |
|-------|-----|
| `--color-white` | `#ffffff` |
| `--color-off-white` | `#fafbfc` |
| `--color-gray-50` | `#f7f8fa` |
| `--color-gray-100` | `#eef0f3` |
| `--color-gray-200` | `#d8dce2` |
| `--color-gray-300` | `#b8bec8` |
| `--color-gray-400` | `#7a8494` |
| `--color-gray-500` | `#4a5568` |

### Semantic

| Token | Hex | BG | Border |
|-------|-----|-----|--------|
| Success | `#1f6b4a` | `#edf7f1` | `#8fd4a8` |
| Warning | `#8a5a00` | `#fef8e6` | `#e8c96a` |
| Danger | `#8b1e2f` | `#fdf2f4` | `#f0b8c0` |

### Surfaces & text (light)

| Token | Value |
|-------|--------|
| `--color-bg` | `#ffffff` |
| `--color-bg-subtle` / SAO `--ist-bg` | `#f7f8fa` |
| `--color-text` | `#0a1f44` |
| `--color-text-secondary` | `#4a5568` |
| `--color-text-muted` | `#7a8494` |
| `--color-border` / divider | `#d8dce2` |
| `--color-border-focus` | `#0a1f44` |
| `--color-bg-watermark` | `rgba(10, 31, 68, 0.02)` |
| `--hairline-width` | `1px` |

### Login (light)

| Token | Value |
|-------|--------|
| `--login-page-bg` | `linear-gradient(160deg, #eef2f8 0%, #f7f9fc 45%, #ffffff 100%)` |
| `--login-card-bg` | `#ffffff` |
| `--login-input-bg` | `#ffffff` |
| `--login-link-color` | `#1a3056` (`--color-navy-light`) |
| `--login-card-radius` | `16px` |
| `--login-card-shadow` | `0 4px 24px rgba(10, 31, 68, 0.08), 0 1px 3px rgba(10, 31, 68, 0.06)` |

---

## Colors — dark theme

Gold stays `#c9a66b`. Navy semantic tokens flip toward white text on deep navy canvas.

| Token | Hex / value |
|-------|-------------|
| Canvas `--color-bg` | `#050a14` |
| Card `--login-card-bg` | `#0d1520` |
| Input `--login-input-bg` | `#111827` |
| Text | `#ffffff` |
| Secondary text | `#a8b0bc` |
| Border | `#1e2836` |
| Focus ring | gold `#c9a66b` |
| Primary button BG | `#ffffff` on dark |
| Primary button text | `#050a14` |
| `--login-page-bg` | `linear-gradient(160deg, #0a0f18 0%, #050a14 55%, #071428 100%)` |
| `--logo-filter` | `invert(1) brightness(1.1)` |

---

## Typography

### Font stacks (what login actually uses)

Loaded in `base.css` / SAO custom.css:

```text
Google: Inter 400–900 + Noto Sans Arabic 400–700
```

| Token | Stack |
|-------|--------|
| `--font-sans` | `"Inter", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif` |
| `--font-display` | `"Inter", "Segoe UI", sans-serif` |
| `--font-accent` | `Georgia, "Times New Roman", "Noto Serif", serif` |
| `--font-ar` | `"Noto Sans Arabic", "Segoe UI", "Traditional Arabic", Tahoma, sans-serif` |
| `--font-mono` | `"SF Mono", "Roboto Mono", Consolas, monospace` |

Taglines (`.ist-tagline`) use `--font-accent` + gold + uppercase + letter-spacing `0.18em` (login inspire overrides to `0.06em` / 11px for MEA line).

### Scale

| Token | Rem | Px |
|-------|-----|-----|
| caption / nav | 0.6875 | 11 |
| xs | 0.75 | 12 |
| sm | 0.8125 | 13 |
| base | 1 | 16 |
| md | 1.125 | 18 |
| lg (inspire title) | 1.375 | 22 |
| xl (form title) | 1.75 | 28 |
| 2xl | 2.5 | 40 |
| display | 3.5 | 56 |

### Weights

400 / 500 / 600 / 700 / 800 / 900

Dashboard headings match login inspire title: **700**, **22px**, Inter.

---

## Spacing (8px base)

| Token | px |
|-------|-----|
| `--space-1` … `--space-12` | 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 |

Header height: **72px**. Sidebar: **220px**. Max width: **1200px**.

---

## Radii

| Token | Value | Use |
|-------|--------|-----|
| `--radius-sm` | 2px | Default buttons |
| `--radius-md` | 4px | Boxed inputs, bordered cards |
| `--radius-lg` | 6px | — |
| `--radius-xl` | 8px | — |
| `--radius-pill` | 9999px | Login CTA, theme toggle |
| `--login-card-radius` | 16px | Login card only |

---

## Shadows

Swiss default: **`--shadow-sm/md/lg: none`**.

Exceptions:

| Token | Light |
|-------|--------|
| `--shadow-focus` | `0 0 0 2px #fff, 0 0 0 3px #0a1f44` |
| `--login-card-shadow` | soft navy-tinted elevation (see above) |

Dark focus uses gold ring on `#050a14`.

---

## Logos

| Variant | File (repo) | Public URL | Notes |
|---------|-------------|------------|--------|
| Symbol + “IST” text | `assets/logo-symbol.svg` | `/assets/logo-symbol.svg` | Compact header; height 60px symbol |
| Full wordmark | `assets/logo-full.svg` | `/assets/logo-full.svg` | Default / lg; width 225px / 275px |
| Design copies | `design/assets/logo-irisstar*.svg` | — | Source design assets |

`Logo.tsx`: compact → symbol; default/lg → full. Aria-label: **IRIS STAR Technologies L.L.C**.

---

## Forbidden palettes

- Purple / indigo AI defaults
- Cream `#F4F1EA` + terracotta
- Tryton/GNU teal `#267f82` as primary
- Multi-layer decorative glows outside documented login shadow
