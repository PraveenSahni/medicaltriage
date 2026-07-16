# SAO Bridge — IST Health tokens → `custom.css` / `custom.js`

How the React / theme-pack tokens map into GNU Health **SAO** (Tryton web client) without forking SAO.

Related: `docs/ist-his/SAO_TOOLBAR_IST_THEMING.md`, `docs/ist-his/SAO_EMBED_AND_SCREEN_PARITY.md`.

---

## Deploy paths

| Repo (source) | VM (example) |
|---------------|--------------|
| `frontend/deploy/sao-custom.css` | `/opt/gnuhealth/his-50/sao/custom.css` |
| `frontend/deploy/sao-custom.js` | `/opt/gnuhealth/his-50/sao/custom.js` |

SAO auto-loads `custom.css` / `custom.js` from its web root. Prefer **mirror + deploy** over editing `sao-variables.less` or forking `tab.js`.

**Out of scope for this theme pack:** changing production SAO icon assets or recolor rules casually. Icon behavior is intentional and lives in `sao-custom.js` — update only with an explicit SAO theming change + verify on VM.

---

## CSS variable map

React / pack (`--color-*`) → SAO (`--ist-*`) in `sao-custom.css`:

| Theme pack / React | SAO custom.css | Hex |
|--------------------|----------------|-----|
| `--color-navy` | `--ist-navy` | `#0a1f44` |
| `--color-navy-dark` | `--ist-navy-dark` | `#071428` |
| `--color-navy-light` | `--ist-navy-light` | `#1a3056` |
| `--color-navy-muted` | `--ist-navy-muted` | `#3d4f6a` |
| `--color-gold` | `--ist-gold` | `#c9a66b` |
| `--color-gold-light` | `--ist-gold-light` | `#d4b87a` |
| `--color-gold-muted` | `--ist-gold-muted` | `#f0e6d4` |
| `--color-gray-50` | `--ist-bg` | `#f7f8fa` |
| `--color-white` | `--ist-bg-white` | `#ffffff` |
| `--color-text` | `--ist-text` | `#0a1f44` |
| `--color-text-secondary` | `--ist-text-secondary` | `#4a5568` |
| `--color-text-muted` | `--ist-text-muted` | `#7a8494` |
| `--font-sans` | `--ist-font-sans` | Inter stack |
| `--font-ar` | `--ist-font-ar` | Noto Sans Arabic stack |

Fonts: same Google Fonts `@import` as React `base.css` (Inter 400–900 + Noto Sans Arabic).

`tokens.css` also defines the `--ist-*` aliases so a single file can seed both shells.

---

## What CSS themes

| Surface | Behavior |
|---------|----------|
| Top navbar | Navy bar; gold on hover/active; soften Tryton brand opacity |
| Primary buttons | Navy; kill Bootstrap/Tryton teal `#267f82` |
| Tab toolbar | Navy strip, gold accent line, Inter |
| Vertical action menu | White panel, gold top border, navy text, gold-muted hover |
| Tab strip | Muted inactive; active gold underline |
| Embedded mode | `html.ist-embedded` hides **top** SAO navbar (IST Workspace header owns chrome) |

Keep menus, wizards, and JSON-RPC intact — selectors should not break layout.

---

## JS constants (`sao-custom.js`)

```js
var IST_NAVY = '#0a1f44';
var IST_MUTED = '#3d4f6a';
var IST_GOLD = '#c9a66b';

Sao.config.icon_colors = [IST_NAVY, IST_MUTED, IST_GOLD];
Sao.config.calendar_colors = ['#ffffff', IST_NAVY];
Sao.config.graph_color = IST_NAVY;
```

Also:

- Session handoff: React `ist-health-session` → SAO `sao_session_{db}` before `Sao.login()`.
- Blob SVG recolor: rewrite GNU teal/beige fills toward navy (menus) or gold (toolbar chrome / favorites).

**Do not** change these icon paths when only updating documentation or React tokens — coordinate a deliberate SAO deploy.

---

## Propagation checklist

1. Change tokens in `frontend/src/styles/variables.css`.
2. Sync this pack: `tokens.css`, `tokens.json`, docs.
3. Sync `--ist-*` block at top of `frontend/deploy/sao-custom.css`.
4. If palette hexes change, update `IST_*` in `sao-custom.js` **and** retest icons on VM.
5. Deploy CSS/JS mirrors; hard-refresh SAO.
6. Confirm login React shell and SAO toolbar still match navy/gold.

---

## Anti-patterns

| Avoid | Why |
|-------|-----|
| Patching `@brand-primary` in SAO less and rebuilding | Upgrade tax; prefer custom.css |
| Forking `tab.js` for styling | Strategy is pin upstream + theme overlays |
| Leaving `#267f82` on primary / active menus | Breaks IST brand continuity with login |
| Shipping purple focus rings in SAO overrides | Conflicts with navy/gold system |

---

## Quick reference

```
Login / React  →  tokens.css / variables.css
SAO chrome     →  sao-custom.css (--ist-*)
SAO icons      →  sao-custom.js (IST_NAVY / GOLD)  ← explicit change only
```
