# IST Health — Login Screen Spec

Derived from the live React login: `frontend/src/pages/LoginPage.tsx`, styles in `layout.css`, `components.css`, `variables.css`, copy in `frontend/src/i18n/locales/en.json`.

---

## Purpose

First-run branded surface for **IST HIS**. Establishes navy/gold, Iris Star logo, bilingual readiness, and legal footer. SAO and Workspace chrome should feel continuous with this screen — not GNU green/teal.

---

## Anatomy (top → bottom)

```
┌─ .ist-app ─────────────────────────────────────────────┐
│  .ist-header                                           │
│    start: Logo compact (symbol + IST) → /login         │
│    end: LangSwitch | divider | ThemeSwitch             │
├─ .ist-login-page (gradient canvas) ────────────────────┤
│  ┌─ .ist-login-card (max-width 1000px, r=16) ────────┐ │
│  │ HEADER: compact logo + “Sign in to IST HIS”       │ │
│  │         “to continue to” → IST HIS link           │ │
│  │ BODY (grid 1.15fr | hairline | 0.85fr):           │ │
│  │   INSPIRE column          │  FORM column          │ │
│  │   · Logo lg (full SVG)    │  · “Sign in” title    │ │
│  │   · Gold Georgia tagline  │  · Database picker    │ │
│  │   · Inspire title (22/700)│  · Username boxed     │ │
│  │   · Feature list + gold   │  · Password + forgot  │ │
│  │     dots                  │  · Pill primary CTA   │ │
│  │   · Huge “IST” watermark  │                       │ │
│  │ FOOTER: agreement text, IRISSTAR address, legal   │ │
│  └───────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Header (app chrome)

- Sticky, height **72px**, hairline bottom border, white/canvas bg.
- **Left:** `Logo variant="compact"` → `/assets/logo-symbol.svg` + text **IST**.
- **Right:** language switch + theme switch (pill track).

### Card header

- Compact logo + copy **“Sign in to IST HIS”** (`auth.loginHeaderBrand`).
- Continue line: “to continue to” + link to app name **IST HIS**.

### Inspire column (left)

| Element | Spec |
|---------|------|
| Logo | `variant="lg"` → `/assets/logo-full.svg`, width ~275px |
| Tagline | Serif stack, gold, uppercase; login uses ~11px / tracking 0.06em |
| Title | “Sign in to IST HIS” — 22px / weight 700 |
| Features | 4 bullets; **6px gold dots** (not checkmark icons) |
| Watermark | Absolute “IST”, black weight, `clamp(6rem, 18vw, 10rem)`, watermark tint |

Feature strings (EN): Patient management · Appointments & scheduling · Laboratory & pharmacy · Bilingual EN / AR.

### Form column (right)

| Field | Pattern |
|-------|---------|
| Database | Custom picker (multi-DB) or single db button; not a native select |
| Username | `.ist-input.ist-input--boxed` — full border, radius 4px |
| Password | Boxed + label row with “Forgot password?” link |
| Submit | `.ist-btn.ist-btn--primary.ist-btn--pill` — full width, height **48px**, pill radius |

Form title centered: **“Sign in”** at 28px / 700.

Error: `.ist-notice.ist-notice--error` above fields.

### Card footer

1. Agreement blurb (`auth.loginFooterText`) — muted 12px.
2. `.ist-contact-block`: **IRIS STAR Technologies L.L.C** + Doha address.
3. Links: Privacy Policy, Terms of Service (open legal HTML).

---

## Visual rules

| Rule | Value |
|------|--------|
| Page background | Soft cool gradient `#eef2f8 → #f7f9fc → #fff` (light) |
| Card | White, **16px** radius, soft dual shadow (only elevated card in system) |
| Split | CSS grid; vertical hairline divider |
| Min body height | ~420px |
| Primary CTA | Navy fill / white text (light); inverts in dark |
| Links | `--login-link-color` = navy-light (light) / gold (dark) |
| Inputs | Boxed (not underline-only) on login |
| Shadows elsewhere | Prefer none |

### Dark mode

Same structure. Card `#0d1520`, page deep navy gradient, gold links, logos via `--logo-filter: invert(1) brightness(1.1)`.

---

## Copy & naming

| UI | String |
|----|--------|
| Document / product | IST HIS |
| Subtitle (meta) | Iris Star Hospital Information System · Tryton 7 |
| Legal name | IRIS STAR Technologies L.L.C |
| Logo aria-label | IRIS STAR Technologies L.L.C |

Do not replace product naming with “GNU Health” on this screen.

---

## Responsive intent

- Card wraps; header brand/continue can wrap.
- On narrow viewports, expect stacked body columns (inspire above form) — preserve gold accents and pill CTA.
- Keep logo readable; do not crop Iris Star mark into a generic icon.

---

## Do / Don’t (login-specific)

**Do**

- Keep split inspire + form composition.
- Keep gold feature dots and serif gold tagline.
- Keep IRISSTAR legal block and privacy/terms links.
- Match Workspace compact footer tone to this legal voice.

**Don't**

- Center a single floating card with purple gradient backdrop.
- Use GNU teal primary button.
- Replace Iris Star SVG with emoji or text-only brand.
- Add promo badges, stats strips, or floating chips over the hero/inspire column.
- Change production SAO icons as part of login-only work.

---

## Implementation checklist for other apps

1. Import [tokens.css](./tokens.css).
2. Ship both logo SVGs at public `/assets/…` paths.
3. Implement `data-theme` toggle.
4. Mirror class structure or map tokens 1:1.
5. Wire auth against the same session contract if embedding SAO (`ist-health-session` — see SAO docs).
