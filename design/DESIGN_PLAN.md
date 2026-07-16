# IST Health — Design Plan (Swiss + IST Brand)

**Company / legal:** IRIS STAR Technologies L.L.C · **IST:** short abbreviation
**Primary office:** Doha, Qatar (Regus D-Ring Building, Old Airport)
**Product:** IST Health (GNU Health–based HIS)
**Brand reference:** [IRIS STAR Technologies L.L.C](https://irisstar.tech) — navy `#0a1f44`, gold `#c9a66b`
**Typography reference:** Swiss / International Typographic Style — extreme clarity, large headings, hairline rules
**Languages:** English (LTR) + Arabic (RTL)
**Status:** CSS + static HTML preview only — no React, no backend

---

## 1. Design philosophy — Swiss clarity + IST brand

IST Health merges **International Typographic Style** clarity with the **Iris Star corporate identity**:

| Principle | Application |
|-----------|-------------|
| **Typography-first** | Inter geometric sans; dramatic display scale (56px column headings) |
| **Extreme simplicity** | Black/navy text on white; no shadows, no gradients — *except login card* |
| **Hairline dividers** | 1px rules under headings; no heavy card borders |
| **Time \| label pattern** | Left column time/ID (mono), right column title — schedules, lists, tables |
| **Generous whitespace** | 8px grid, 64px section gaps, open two-column layouts |
| **IST navy authority** | `#0a1f44` text and CTAs in light mode |
| **Gold accent only** | `#c9a66b` for taglines, active nav, theme-toggle icon |
| **Dark mode** | `#050a14` background, white text, pill sun/moon toggle kept |
| **Logo** | Official Iris Star mandala SVG — black on light, inverted on dark |

Health-specific patterns (stats, schedules, patient lists) use the **same Swiss tokens** — no separate clinical palette.

---

## 2. Color palette

### Light mode (`:root`, `data-theme="light"`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-navy` | `#0a1f44` | Primary text, buttons |
| `--color-navy-dark` | `#071428` | Deep navy accents |
| `--color-gold` | `#c9a66b` | Taglines, active states only |
| `--color-white` | `#ffffff` | Page background |
| `--color-gray-200` | `#d8dce2` | Hairline dividers |
| `--color-gray-500` | `#4a5568` | Secondary text |

### Dark mode (`data-theme="dark"`)

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#050a14` | Page background |
| `--color-text` | `#ffffff` | Primary text, logo (dark mode) |
| `--color-gold` | `#c9a66b` | Accent only |
| `--color-divider` | `#1e2836` | Hairline rules |
| `--btn-primary-bg` | `#ffffff` | CTA fill |

Theme persists in `localStorage` key `ist-health-theme`.

---

## 3. Typography system

### Font choices

| Role | Font stack | Use |
|------|------------|-----|
| **Display & UI** | Inter 400–900 (Google Fonts) | Headings, body, nav, buttons |
| **Taglines** | Georgia, Noto Serif | Gold uppercase taglines only |
| **Arabic** | Noto Sans Arabic, Segoe UI | All AR UI |
| **Mono** | SF Mono, Roboto Mono, Consolas | Times, patient IDs, phone numbers |

### Type scale

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `--font-size-display` | 56px (3.5rem) | 900 | Column headings (Sat/Sun style) |
| `--font-size-2xl` | 40px (2.5rem) | 800 | Page titles (h1) |
| `--font-size-xl` | 28px (1.75rem) | 700 | Section headings (h2) |
| `--font-size-lg` | 22px (1.375rem) | 600 | Subsection (h3) |
| `--font-size-base` | 16px (1rem) | 400 | Body, list labels |
| `--font-size-sm` | 13px (0.8125rem) | 400 | Mono times, meta |
| `--font-size-caption` | 11px (0.6875rem) | 600 | Uppercase labels, nav |
| `--font-size-xs` | 12px (0.75rem) | 400 | Taglines (Georgia) |

Headings use tight letter-spacing (`-0.03em` display, `-0.02em` h2). Labels use `0.06em` tracking.

### Hairline dividers

```html
<h2>Today's Schedule</h2>
<hr class="ist-divider" />
```

Applied under all major headings — replaces heavy card borders.

---

## 4. Layout patterns

### Time | label (schedule / lists)

```html
<div class="ist-time-label">
  <span class="ist-time-label__time">09:00</span>
  <span class="ist-time-label__label">Fatima Al-Kuwari</span>
</div>
```

Grid: `72px` time column + flexible label. Used in `.ist-schedule`, `.ist-patient-list`, dashboard activity.

### Two-column grid

```html
<div class="ist-grid ist-grid--2">…</div>
```

64px gap, no card wrappers — content floats in whitespace like the reference.

### Key layout tokens

| Token | Value |
|-------|-------|
| `--layout-max-width` | 1200px |
| `--layout-sidebar-width` | 220px |
| `--layout-time-col` | 72px |
| `--section-gap` | 64px |
| `--layout-header-height` | 72px |

---

## 5. Components

| Component | Class | Notes |
|-----------|-------|-------|
| Logo (default) | `.ist-logo` | Official Iris Star mandala SVG |
| Logo (compact) | `.ist-logo.ist-logo--compact` | 32px — header, sidebar, login card header |
| Logo (large) | `.ist-logo.ist-logo--lg` | 80px — login inspire column |
| Primary button | `.ist-btn--primary` | Rectangular (2px radius), not pill |
| Theme toggle | `.ist-theme-switch` | Pill kept — sun/moon, gold active icon |
| Lang switch | `.ist-lang-switch` | EN \| AR pill |
| Hairline divider | `.ist-divider` | Under headings |
| Schedule row | `.ist-schedule__row` | time \| name \| status grid |
| Stat block | `.ist-stat` | Top hairline only, no card border |
| Patient list | `.ist-patient-list` | ID \| name \| phone \| status grid |
| Form inputs | `.ist-input` | Bottom-border only (app forms) |
| Login card | `.ist-login-card` | Google-inspired split card, 16px radius |
| Login inputs | `.ist-input--boxed` | Thin border, focus ring (login only) |
| Login button | `.ist-btn--pill` | Full-width pill CTA on login |

Shadows: **none** by default (Swiss clarity). Login card uses `--login-card-shadow` exception. Focus ring: 3px outline, no glow.

### 5.1 Logo — IRIS STAR Technologies L.L.C

Canonical source: **`C:\HMS\assets\`** — drop official logo files there. Synced copies live in `design/assets/` for the static preview (do not edit in place; re-copy from source).

| Source (`C:\HMS\assets\`) | Synced copy (`design/assets/`) | Purpose |
|---------------------------|--------------------------------|---------|
| `logo-full.svg` | `logo-irisstar-full.svg` | Full wordmark (symbol + IRIS STAR text) |
| `logo-symbol.svg` | `logo-irisstar.svg` | Mandala symbol only |

Use the files exactly as provided — do not redraw or recreate.

#### HTML structure

```html
<a href="#" class="ist-logo ist-logo--compact" aria-label="IRIS STAR Technologies L.L.C">
  <img class="ist-logo__img" src="assets/logo-irisstar.svg" alt="" />
</a>
```

#### Variants

| Class | Height | Use |
|-------|--------|-----|
| `.ist-logo` | 48px (`--logo-height-full`) | Tokens showcase, general |
| `.ist-logo.ist-logo--compact` | 32px | Header, sidebar, login card header |
| `.ist-logo.ist-logo--lg` | 80px | Login inspire column |

#### Theme behavior

The SVG uses default black fill on transparent background.

| Mode | Treatment |
|------|-----------|
| Light | `--logo-filter: none` — black symbol on white page |
| Dark | `--logo-filter: invert(1)` — symbol appears white on dark page |

Applied via CSS custom property on `.ist-logo__img`.

#### CSS tokens

| Token | Default | Notes |
|-------|---------|-------|
| `--logo-height-compact` | 32px | Header / sidebar |
| `--logo-height-full` | 48px | Default logo |
| `--logo-height-lg` | 80px | Login inspire |
| `--logo-filter` | `none` | `invert(1)` in dark theme |

#### Placement in preview

| Location | Variant |
|----------|---------|
| Global header | `.ist-logo--compact` |
| Login card header | `.ist-logo--compact` (28px via layout override) |
| Login inspire column | `.ist-logo--lg` |
| Dashboard sidebar | `.ist-logo--compact` in `.ist-sidebar__logo` |
| Tokens tab | All three size variants |

Do not stretch the symbol. Maintain clear space equal to logo height on all sides.

---

## 6. Preview screens

| Screen | Tab | Content |
|--------|-----|---------|
| **Tokens** | Tokens | Palette, type scale specimen, time\|label demo |
| **Login** | Login | Google-inspired split card — inspire column + sign-in form |
| **Dashboard** | Dashboard | Large h1, hairline stats, schedule rows |
| **Patients** | Patients | Swiss patient list grid, mono IDs |

**Open:** `C:\HMS\design\preview.html`

Interactive: EN/AR toggle, pill theme switch (persists), screen tabs.

---

## 6.1 Login pattern (Google-inspired, IST branded)

Split login card centered on a soft gradient page background. Inspired by Google sign-in layout; **left column is product inspiration**, not an account picker.

### Structure

```html
<div class="ist-login-page">
  <div class="ist-login-card">
    <header class="ist-login-card__header">…</header>
    <div class="ist-login-card__body">
      <div class="ist-login-card__inspire">…</div>
      <div class="ist-login-card__divider-v"></div>
      <div class="ist-login-card__form-col">…</div>
    </div>
    <footer class="ist-login-card__footer">…</footer>
  </div>
</div>
```

### Left column — Product inspiration

| Element | Class / content |
|---------|-----------------|
| Logo | `.ist-logo.ist-logo--lg` — full wordmark SVG only (no duplicate company name text) |
| Tagline | `.ist-tagline` — product line (e.g. *The Digital Health Engine for Qatar*), not legal name |
| Title | `.ist-login-card__inspire-title` — Sign in to IST Health |
| Features | `.ist-login-features` — gold dot bullets |
| Watermark | `.ist-login-card__watermark` — faint IST |

Logo and copy are left-aligned (`align-items: flex-start`, `align-self: flex-start` on `.ist-logo--lg`). Legal name (**IRIS STAR Technologies L.L.C**) appears only in the card footer — not under the wordmark.

### Right column — Sign in

| Element | Notes |
|---------|-------|
| Heading | `.ist-login-card__form-title` — centered "Sign in" |
| Database | Hidden field, pre-filled `gnuhealth` (`.ist-field--hidden`) |
| Username | `.ist-input--boxed` with label above |
| Password | Label row + "Forgot password?" link (`.ist-field__label-row`) |
| CTA | `.ist-btn--primary.ist-btn--pill` — navy (light) / white (dark) |

### Card styling

| Token | Light | Dark |
|-------|-------|------|
| `--login-card-radius` | 16px | 16px |
| `--login-card-shadow` | Soft navy tint | Deep shadow |
| `--login-page-bg` | Blue-gray gradient | Navy gradient |
| `--login-card-bg` | White | `#0d1520` |
| Divider | Hairline vertical between columns | Same |

Header bar: compact logo + "Sign in to IST Health" left; "to continue to IST Health" right. Footer: privacy copy, **IRIS STAR Technologies L.L.C** legal name + Qatar primary address, Policy / Terms links.

### Footer contact (legal)

| Field | Value |
|-------|-------|
| Display name | IRIS STAR Technologies L.L.C |
| Legal / footer name | IRIS STAR Technologies L.L.C |
| Primary address | Office 214/215, 2nd Floor, Regus D-Ring Building no 65, D-Ring Road, Old Airport, PO Box 32522, Doha, Qatar |

Regional offices (UAE, India) live in `config.yaml` under `company.offices` for invoices, settings, and legal pages — not shown on login footer.

### Responsive

Below 768px: columns stack — inspire block on top (centered), form below. Vertical divider hidden.

App forms elsewhere keep bottom-border `.ist-input`; boxed inputs are **login-only**.

---

## 7. File structure

```
design/
├── DESIGN_PLAN.md           ← this document
├── preview.html             ← static showcase
├── assets/
│   ├── logo-irisstar.svg       ← synced copy (source: C:\HMS\assets\logo-symbol.svg)
│   └── logo-irisstar-full.svg  ← synced copy (source: C:\HMS\assets\logo-full.svg)
└── styles/
    ├── ist-health.css       ← master import
    ├── variables.css        ← tokens, type scale, spacing
    ├── base.css             ← Inter import, type hierarchy, dividers
    ├── layout.css           ← grid, time|label, two-column
    ├── components.css       ← buttons, forms, hairline tables
    ├── dashboard.css        ← stats, schedule rows
    ├── modules.css          ← patient list grid
    └── rtl.css              ← Arabic overrides
```

---

## 8. Bilingual (EN / AR)

1. Set `<html lang="ar" dir="rtl">` when Arabic selected.
2. `rtl.css` mirrors sidebar, toggle thumb, table alignment.
3. Patient IDs, times, numbers stay **LTR** (`.ist-id`, `.ist-time`, `.ist-locale-ar`).
4. Noto Sans Arabic loaded via Google Fonts in `base.css`.

---

## 9. What changed from v0.3 (Minimalist)

| Before | After (Swiss + IST) |
|--------|---------------------|
| Pill buttons everywhere | Rectangular CTAs; pill only for theme/lang |
| Bordered stat cards | Hairline top border, open layout |
| Bordered table wrapper | Hairline rows, no outer border |
| 14px body text | 16px body for readability |
| 44px hero only | 56px display headings |
| Boxed form inputs | Bottom-border inputs |
| Badge pills with fill | Text-only status labels (color only) |
| Sidebar gray background | White sidebar, gold active link |

---

## 10. Approval checklist

- [ ] Swiss clarity: large headings, hairline dividers, whitespace
- [ ] IST brand: navy + gold accents, Iris Star logo, dark mode
- [ ] Time \| label pattern in schedule and patient list
- [ ] Inter type scale approved
- [ ] Login screen: Google-inspired split card, light + dark
- [ ] Dashboard stat density OK
- [ ] Arabic RTL renders correctly
- [ ] Theme toggle (pill) retained

---

## 11. Company & contact (config source of truth)

Configured in `config.yaml` → `company`:

| Key | Purpose |
|-----|---------|
| `name` | App display name — **IRIS STAR Technologies L.L.C** |
| `legal_name` | Footers, legal pages — **IRIS STAR Technologies L.L.C** |
| `address_en` / `address_ar` | Flat primary address (Qatar) for generators & legacy |
| `offices.qatar` | Primary office — Regus D-Ring, Old Airport, PO Box 32522 |
| `offices.uae` | Burj Gate Tower, Downtown Dubai · +971 4 518 2632 / +971 4 238 6786 |
| `offices.india` | Prestige Polygon, Anna Salai, Chennai · +91 44 4028 2542 |

Preview footers (`preview.html`) show **legal_name** + Qatar address on Login and Dashboard tabs.

---

*IRIS STAR Technologies L.L.C · Doha, Qatar · IST Health Design System v0.6 (Swiss + IST · Logo)*
