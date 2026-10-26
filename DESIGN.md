# DESIGN.md — Showroom Hero (Dark + Light)

Homepage hero for newworktrucks.com. A 3D work truck rotates on a showroom turntable above a floor grid. The headline promises what the builder delivers: *see it before you sign.*

Two themes share one layout, one copy deck and one 3D scene. Only the tokens change.

---

## 1. Purpose

- **Job:** prove in the first five seconds that NWT has a real 3D builder, and get the visitor into it.
- **Primary action:** Start building → `/builder`
- **Secondary action:** Talk to our team → contact / quote flow
- **Audience:** U.S. business buyers of work trucks (owner-operators to fleet managers).

---

## 2. Copy

| Slot | Text |
| --- | --- |
| Eyebrow | New Work Trucks · 3D builder |
| Headline (h1) | See it before you sign. |
| Subhead | Spin your truck, swap the upfits, and know it fits before our team sends the quote. |
| Chip 1 | **Service body** · fits 60 in CA |
| Chip 2 | **Ladder rack** · added |
| Chip 3 | **Step bumper** · added |
| Hint | Drag to spin · real 3D |
| Primary CTA | Start building → |
| Secondary CTA | Talk to our team |

Chips must describe what is actually on the model shown. If the model changes, the chips change.

---

## 3. Design tokens

Implement as CSS custom properties scoped by `[data-theme="dark"]` / `[data-theme="light"]` on the hero root.

### Color — page

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--hero-bg` | `#0A0B0D` | `#E6EAF0` | Base background / gradient edge |
| `--hero-spot` | `#1D2938` | `#FFFFFF` | Radial spotlight center |
| `--hero-grid` | `#1C2836` | `#D5DBE4` | Floor grid lines |
| `--hero-text` | `#F2F4F7` | `#0E1620` | Headline, chip titles |
| `--hero-muted` | `#A9B1BD` | `#4E5869` | Subhead |
| `--hero-subtle` | `#6F7E92` | `#5A6474` | Hint line, chip detail text |
| `--hero-eyebrow` | `#7CC4FF` | `#1A4FD8` | Eyebrow text |
| `--hero-accent` | `#3EA6FF` | `#1F5EFF` | Primary button, check icons |
| `--hero-on-accent` | `#04121F` | `#FFFFFF` | Text on primary button |
| `--chip-bg` | `#141A22` | `#FFFFFF` | Chip fill |
| `--chip-border` | `#2A3644` | `#D8DEE7` | Chip border |
| `--chip-shadow` | `none` | `0 6px 18px rgba(14,22,32,0.08)` | Chip elevation |
| `--btn2-border` | `#3C4757` | `#B9C2CF` | Secondary button border |
| `--btn2-bg` | `transparent` | `#FFFFFF` | Secondary button fill |

> Light eyebrow uses `#1A4FD8`, not `#1F5EFF`. Brand blue on the light background is ~4.2:1, which fails WCAG AA for 15px text. `#1A4FD8` passes (~5.5:1). Brand blue stays for buttons and icons.

### Color — 3D scene

| Element | Dark | Light |
| --- | --- | --- |
| Turntable disc | `#10151C` (rough 0.55, metal 0.4) | `#D6DCE5` (rough 0.55, metal 0.15) |
| Turntable ring | emissive `#3EA6FF`, intensity 1.4 | `#1F5EFF`, emissive intensity 0.5 |
| Tick marks (24) | `#1E3A57`, emissive 0.6 | `#A9B4C3` |
| Hemisphere light | sky `#DFE8F5` / ground `#1A1D22`, 0.75 | sky `#FFFFFF` / ground `#C4CCD8`, 0.85 |
| Key light | `#FFFFFF`, 1.5, pos (6,10,5), casts shadow | `#FFFFFF`, 1.35, same |
| Rim light | `#9CC8FF`, 0.7, pos (-8,5,-6) | `#DCE6FF`, 0.55, same |
| Fill light | `#FFFFFF`, 0.35, pos (-4,3,8) | same |
| Tone mapping exposure | 1.05 | 0.95 |
| Truck cab / body default | `#F1F2EF` / `#F1F2EF` | `#F1F2EF` / `#F1F2EF` (consider charcoal cab `#2B2F36` for contrast) |

Paint presets (exposed as props): `#F1F2EF` white, `#1F5EFF` NWT blue, `#E0662B` safety orange, `#2B2F36` charcoal.

### Typography

Font: **Space Grotesk** (Google Fonts), weights 400/500/600/700. Self-host via `next/font/google`.

| Role | Size / line-height | Weight | Tracking | Case |
| --- | --- | --- | --- | --- |
| Eyebrow | 15 / normal | 500 dark, 600 light | 0.18em | Upper |
| H1 | 72 / 1.0 | 700 | -0.03em | Sentence |
| Subhead | 20 / 1.5 | 400 | 0 | Sentence |
| Chip | 15 | 600 title / 400 detail | 0 | Sentence |
| Hint | 13 | 400 | 0.14em | Upper |
| Buttons | 18 | 700 primary / 600 secondary | 0 | Sentence |

### Shape and spacing

- Buttons: min-height 56px, pill radius (999px), padding 0 30px (primary) / 0 28px (secondary), gap 16px.
- Chips: padding 12×16, radius 14px, 20px check icon, 10px gap.
- Text stack gap: 14px.

---

## 4. Layout (desktop reference: 1440 × 810)

Layers, back to front:

1. **Background:** radial gradient `--hero-spot` → `--hero-bg`, centered at 50% / 62%.
2. **Floor grid:** SVG, clipped to an ellipse (cx 50%, cy ~77%, rx ~44%, ry ~20%). 7 horizontal lines with increasing spacing (perspective) and 7 lines radiating from a vanishing point at (50%, 42%). 1px, `--hero-grid`.
3. **Text block:** centered, top 56px. Eyebrow → H1 → Subhead (max-width 900px).
4. **3D canvas:** 1000 × 470, centered horizontally, top 196px. Transparent background.
5. **Chips:** absolutely placed around the truck: left 96 / top 300; right 96 / top 280; right 120 / top 410.
6. **Hint:** centered, top 672px.
7. **CTAs:** centered row, 40px from bottom.

### Responsive

| Breakpoint | Changes |
| --- | --- |
| ≥ 1280 | As reference. Hero height `min(810px, 100svh)`. |
| 1024–1279 | Canvas scales to 80% width. Chips stay but move inward (left/right 32px). |
| 768–1023 | H1 56px. Chips move out of the canvas into one wrapped row under the hint. |
| < 768 | H1 40px, subhead 17px. Canvas full width, aspect 4:3. Chips as horizontal scroll row. CTAs stack full width. Floor grid hidden. Shadow map 1024. |

---

## 5. 3D scene

### Camera

- Perspective, FOV 26°, aspect = canvas aspect
- Position (8.2, 4.6, 8.2), look at (0, 1.0, 0)
- On mobile (4:3), move to (9.5, 5.2, 9.5) so the full turntable fits

### Renderer

- WebGL, `antialias: true`, `alpha: true` (page background shows through)
- sRGB output, ACES Filmic tone mapping
- Pixel ratio `min(devicePixelRatio, 1.5)`
- Soft shadows (PCFSoft), key-light shadow map 1024, shadow camera ±7, bias −0.0005

### Model

- **Placeholder:** procedural chassis-cab truck from `truck-procedural.js`: regular cab, service body with compartment doors, ladder rack with ladder, step bumper, dually rear axle, amber roof markers, no badges. Units are meters; length ≈ 6.8, width ≈ 2.3, height ≈ 2.85.
- **Production:** swap for an optimized licensed GLB through the same component (`model` prop). The scene, lights and turntable stay the same.
- Truck sits 0.12 above the origin (on the disc). Disc: radius 4.3, height 0.12.

### Motion

| Behavior | Value |
| --- | --- |
| Initial rotation | −0.35 rad (front three-quarter view) |
| Auto-rotate | 0.28 rad/s while idle |
| Resume after interaction | 1.5 s |
| Drag sensitivity | 0.008 rad per px (horizontal only) |
| Keyboard | ← / → rotate 0.15 rad per press when canvas wrapper is focused |
| `prefers-reduced-motion` | No auto-rotate; drag and keys still work |

---

## 6. Loading and performance

The hero is the LCP element. 3D must never block first paint.

1. Render a **static poster** (WebP of the truck on the turntable, per theme) immediately. This is the LCP image.
2. Lazy-load three.js and the scene with dynamic import (`ssr: false`) after the page is interactive.
3. Cross-fade from poster to live canvas (200ms) once the first frame renders.
4. Pause the render loop when the hero is off-screen (IntersectionObserver) or the tab is hidden.
4a. **Share the GPU.** The page often runs during a video call: sales demos over Google Meet or Zoom, with camera, screen-share encoding and background blur all on the GPU. So:
    - Cap rendering at **30 fps** while auto-rotating. Render on demand only (on drag or prop change) when it isn't.
    - Pixel ratio cap **1.5** (not 2). Key-light shadow map **1024** (not 2048).
    - Only one live 3D canvas per page. Any other 3D views show their poster until the user interacts.
    - Test it: run the hero during a Meet call with background blur on. The camera must not freeze.
5. If WebGL is unavailable or fails, keep the poster. Never show an empty box.
6. Budget: hero JS chunk ≤ 200 KB gzipped (three tree-shaken), GLB ≤ 3 MB when the real model is used.

---

## 7. Accessibility

- Canvas wrapper: `role="img"` with an `aria-label` describing the truck and its upfits, plus `tabindex="0"` for keyboard rotation, and a visible focus ring.
- All text uses the tokens above, which pass WCAG AA (4.5:1) on their backgrounds.
- CTAs are real `<a>` elements with ≥ 44px targets.
- Chips are decorative status labels (not buttons) unless they become interactive.
- Don't convey state by color alone: chips use a check icon plus text.

---

## 8. Theme selection

Decision pending: dark (premium, stands apart) vs light (matches the rest of the current site).

- Component takes `theme: "dark" | "light"`.
- Optional: `"auto"` follows `prefers-color-scheme`. Only enable this if the rest of the site supports both themes.

---

## 9. Open items

- [ ] Choose dark or light as default (decide based on buyer, not taste)
- [ ] Replace procedural truck with licensed, optimized GLB
- [ ] Produce poster WebPs per theme from the final model
- [ ] Confirm chip copy matches the configuration shown
- [ ] Wire analytics: hero view, drag interaction, CTA clicks