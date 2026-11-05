# DESIGN.md — Realistic 3D Trucks for 40+ Buyers
Every NWT 3D model must look like the truck in the yard and be easy to use for buyers aged 40 and up. Realism comes from accurate proportions, real materials, studio lighting and grounded shadows, not polygon count. This spec applies to all models made in-house and to the builder and homepage hero that show them.

## 1. Principles

1. **Accurate before beautiful.** A model that is 5% off in proportion looks fake, however good the materials. Fitment accuracy is also our sales promise.
2. **Real, not flashy.** Our buyers want to recognize their truck, not a game car. No neon, no exaggerated reflections, no dramatic camera moves.
3. **Light files, rich look.** Bake detail into textures; keep geometry lean. Realism that loads slowly is never seen.
4. **Easy by default.** Every action works with one tap or click. Dragging is optional, never required.

## 2. Modelling standards

| Item | Standard |
| --- | --- |
| Units | Meters, 1 unit = 1 m. Apply scale before export. |
| Orientation | +X forward, +Y up (glTF converts from Blender's Z-up on export). Origin at ground level, centered under the vehicle. |
| Upfit origins | At the real mounting point on the chassis, so parts snap without code offsets. |
| Dimensions | From the OEM body builder guide (wheelbase, CA, overall length/height/width). Tolerance ±1 cm on key dimensions. |
| Edges | Every visible hard edge gets a small bevel (2–5 mm) with 2 segments. Sharp 90° edges are the #1 cause of a fake look. |
| Shading | Smooth shading with weighted normals; no faceted curves. |
| Hidden geometry | Delete what can't be seen: engine internals, cab interior below the window line (unless doors open), underside detail beyond frame rails and axles. |
| Naming | `chassis_ram2500hd_cc`, `body_696j`, `rack_utility`, `bumper_step`. Mesh and material names are kebab or snake case, no spaces. |
| Triangle budget | Chassis ≤ 80k, body ≤ 30k, rack ≤ 15k, bumper ≤ 5k. |
| Draw calls | ≤ 15 materials per chassis, ≤ 6 per upfit. Merge parts that share a material and never move separately. |

## 3. Materials (PBR metal/rough only)

Never use the spec/gloss workflow. Values below are starting points for Blender's Principled BSDF; they export to glTF.

| Material | Base color | Metallic | Roughness | Extra |
| --- | --- | --- | --- | --- |
| Body paint | Paint color (variable) | 0.0–0.3 | 0.35–0.45 | Clearcoat 1.0, clearcoat roughness 0.03–0.08 |
| Service body (powder coat) | Paint color | 0.0 | 0.5–0.6 | No clearcoat (powder coat is satin) |
| Glass | #0C131C | 0.0 | 0.02–0.05 | Transmission off on web; use dark tinted reflective glass |
| Tire rubber | #111214 | 0.0 | 0.85–0.95 | Normal map for tread and sidewall lettering |
| Chrome / polished trim | #E8EAED | 1.0 | 0.05–0.15 |  |
| Brushed aluminum / diamond plate | #B8BEC6 | 1.0 | 0.3–0.4 | Normal map for diamond pattern |
| Black plastic trim | #1B1E23 | 0.0 | 0.6–0.75 |  |
| Lights (lens) | Lens tint | 0.0 | 0.05 | Emissive only for lit states |

Rules:

- Paint color is a material parameter, never baked into a texture, so one model covers every color.
- Ambient occlusion is baked per part into a separate AO texture, never into base color.
- Textures: 2048 px max for the chassis, 1024 px for upfits, 512 px for small parts. Final format KTX2 (or WebP fallback).
- Normal maps carry small detail: panel gaps, bolts, tread, diamond plate, vents.

## 4. Lighting and rendering (web)

| Setting | Value |
| --- | --- |
| Environment | Procedural studio (softbox strips) or a 1K CC0 studio HDRI, prefiltered. Never shown as background. |
| Key reflections | One long overhead strip plus two side strips, so highlight lines run along the body panels. |
| Tone mapping | ACES Filmic (or AgX on three r160+), exposure \~0.95–1.05. Output sRGB. |
| Materials in three.js | MeshPhysicalMaterial for paint (clearcoat); MeshStandardMaterial for everything else. |
| Shadow | Soft contact shadow under the truck, rendered once (not every frame). |
| Pixel ratio | Max 1.5 desktop, 1.25 mobile. |
| Frame rate | On-demand; never above 60 fps while dragging; 30 fps for auto-rotate; auto-rotate stops after 10 s of no interaction. |

## 5. Usability for buyers 40+

| Area | Standard |
| --- | --- |
| Text size | Body text ≥ 18 px; labels and chips ≥ 16 px; nothing below 14 px. |
| Contrast | All text ≥ 4.5:1 (target 7:1 for body text). No light grey on white. |
| Touch targets | ≥ 48 × 48 px, with ≥ 8 px between targets. |
| Camera control | Preset buttons always visible: Front 3/4, Side, Rear, Top. A "Reset view" button. Drag and pinch are optional extras. |
| Motion | Slow, smooth camera transitions (≤ 0.8 s). Respect reduced-motion settings. Auto-rotate is slow and stops on its own. |
| Zoom limits | Can't zoom inside the truck or lose it off-screen. |
| Language | Plain words first, trade terms explained: "Cab-to-axle (CA): the space behind the cab for the body." |
| Choices | One decision at a time, with a clear selected state (check mark plus text, not color alone). |
| Price and help | Quote button and a phone number visible on every builder screen. |
| Output | "Download spec sheet (PDF)" with images from 3 angles and the full configuration. Many buyers print or forward to a partner. |
| Feedback | Loading shows progress in words ("Loading your truck…"), never a blank area. |

## 6. Quality gates (a model can't ship until all pass)

- [ ] Key dimensions within ±1 cm of the OEM guide
- [ ] Side-by-side render vs. a real photo at the same angle, reviewed by someone from sales
- [ ] File size within budget after the optimize script
- [ ] Draw calls and triangles within budget in the default build
- [ ] Looks correct in both light and dark hero themes
- [ ] Tested by at least 2 people aged 40+ who complete a build without help
- [ ] License or ownership of every reference and texture recorded

## 7. Open questions

- Do doors open in the builder? If yes, interior must be modeled to a visible standard.
- Which paint colors are offered per chassis, and who supplies the exact color values?
- Who in sales signs off on the photo comparison?
