# IST Health — Component Patterns

Patterns from `frontend/src/styles/components.css`, `layout.css`, and `index.css`. Use with [tokens.css](./tokens.css).

---

## Logo

| Variant | Class | Asset | Size tokens |
|---------|-------|-------|-------------|
| Compact | `.ist-logo.ist-logo--compact` | `/assets/logo-symbol.svg` + “IST” text | Symbol height `--logo-height-compact-symbol` (60px) |
| Default | `.ist-logo` | `/assets/logo-full.svg` | Width `--logo-width-full` (225px) |
| Large | `.ist-logo.ist-logo--lg` | full SVG | Width `--logo-width-lg` (275px) |

- Hover: opacity ~0.75.
- Dark: `filter: invert(1) brightness(1.1)` on img.
- Compact text: 1.25rem / weight 800 / tracking 0.08em / uppercase.

---

## Buttons

Base: `.ist-btn` — height **44px**, padding-x **24px**, radius **2px**, font sm / semibold / tracking 0.02em.

| Modifier | Appearance |
|----------|------------|
| `--primary` | `--btn-primary-bg` / `--btn-primary-text` (navy / white in light) |
| `--outline` | Transparent, hairline border in text color |
| `--ghost` | Transparent, secondary text |
| `--text` | Underlined, no height box |
| `--sm` | Height 36px |
| `--pill` | **Login CTA**: full width, radius pill, height **48px**, base font size |

Disabled: opacity 0.4.

SAO mapping: `.btn-primary` → navy background / white text (see sao-bridge).

---

## Inputs

### App forms (underline)

`.ist-input` / `.ist-select` / `.ist-textarea`

- Height 44px, no side border, **bottom hairline** only, radius 0.
- Focus: bottom border → `--color-border-focus`, no box shadow.

### Login / boxed

`.ist-input--boxed`

- Full 1px border, radius **4px**, background `--login-input-bg`.
- Focus: border focus color + `--shadow-focus` ring.

### Labels

- Default field labels: caption, uppercase, muted, tracking 0.06em.
- Login labels (`.ist-field--login`): sm / medium / sentence case / text color.

### Links

`.ist-link` — login link color, medium weight; underline on hover.

---

## Header

`.ist-header`

- Sticky, z sticky, height **72px**, padding-inline 40px (`--space-8`).
- Hairline bottom border; background canvas.
- `__start` / `__end` flex clusters; `__divider` 1×24px hairline.

### Nav links

`.ist-nav__link` — caption size, semibold, tracking **0.12em**, uppercase. Active → gold (`--color-text-accent`).

### Workspace header

`.ist-header--workspace` — minimal product chrome (logo + IST HIS + sign out). Aligns with login; SAO top navbar hidden when embedded.

---

## Footer

### Login card footer

`.ist-login-card__footer` — padding, top hairline.
Muted agreement text → contact block → legal links (navy-light / gold).

### Contact block

`.ist-contact-block` — xs muted; legal name semibold secondary; address `font-style: normal`.

### App footer

`.ist-app-footer` — centered xs muted, top hairline.
`.ist-app-footer--compact` — under SAO iframe: tight padding, flex wrap, legal · separator.

Legal display name: **IRIS STAR Technologies L.L.C**.

---

## Theme toggle

`.ist-theme-switch` — 56×28 pill track, 22px thumb, sun/moon icons.
Active icon color: **gold**. Focus uses `--shadow-focus`.

---

## Lang switch

Segmented buttons; active state uses brand text/border (see components.css). Prefer compact header placement next to theme switch.

---

## Cards (app — not login)

Default `.ist-card`: **no** heavy box — top hairline only.
`--bordered`: hairline all sides + radius md. Prefer Swiss flat over elevated cards outside login.

Feature list on login is **not** a card — plain column with gold dots.

---

## Notices

`.ist-notice--error` — danger semantic colors for auth failures.

---

## Feature list (login)

`.ist-login-features li::before` — 6×6px circle, `--color-gold`.

---

## Database picker (login)

`.ist-db-picker` — custom listbox trigger matching boxed input height; active option uses brand emphasis. Prefer this over native `<select>` for multi-DB IST HIS.

---

## Do / Don't

**Do**

- Hairline dividers between chrome regions.
- Rectangular primary buttons in app chrome; pill only for login CTA / toggles.
- Match dashboard section titles to login inspire title (22px / 700).

**Don't**

- Bootstrap default green/teal buttons.
- Large drop shadows on every panel.
- Purple accent for focus rings — use navy (light) or gold (dark).
