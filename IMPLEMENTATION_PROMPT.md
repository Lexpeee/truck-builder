You are implementing the homepage hero for newworktrucks.com. The full spec is in `docs/DESIGN.md`. Read it completely before writing code. It is the source of truth for copy, tokens, layout, 3D scene values, performance and accessibility.

## Before you code

1. Inspect the repo and tell me:
   - Framework and router (Next.js App Router or Pages Router?), styling approach (Tailwind, CSS Modules, etc.), TypeScript or JS.
   - Whether the builder already uses three.js or react-three-fiber, and which versions.
   - Where the current homepage hero lives.
2. Reuse the existing 3D stack. If react-three-fiber is installed, build the scene with R3F. If only `three` is installed, use plain three.js in a client component. Do not add a second 3D library.
3. Propose a short file plan, then proceed without waiting unless something in the repo contradicts the spec.

## What to build

A `ShowroomHero` component with:

- `theme: "dark" | "light"` (default: `"light"` until we decide)
- `model?: string` — optional GLB URL. If missing, use `buildTruck()` from `truck-procedural.js`.
- `cabColor?`, `bodyColor?` — paint, defaulting to the DESIGN.md values

Structure:

1. **`ShowroomHero`** (server-safe): background gradient, floor grid SVG, text block, chips, hint, CTAs, and a static poster image in the canvas slot. All colors come from CSS custom properties scoped by `[data-theme]` on the hero root, using the exact token values in DESIGN.md §3.
2. **`ShowroomScene`** (client only, loaded with `next/dynamic`, `ssr: false`): renderer, camera, lights, turntable, truck, and drag/keyboard/auto-rotate behavior. All values from DESIGN.md §3 and §5. Theme-dependent scene values (disc, ring, ticks, lights, exposure) come from a small config object keyed by theme.

## Hard requirements

- **Exact values.** Use the token hex codes, camera position/FOV, light positions/intensities and motion numbers from DESIGN.md. Don't substitute "close enough" values.
- **Light theme eyebrow is `#1A4FD8`**, not brand blue. That's an accessibility fix.
- **Performance (DESIGN.md §6):** the poster image is the LCP element. three.js loads only after hydration. The poster cross-fades to the canvas after the first rendered frame. The render loop pauses when the hero is off-screen or the tab is hidden. If WebGL fails, the poster stays.
- **Reduced motion:** no auto-rotate when `prefers-reduced-motion: reduce`.
- **Accessibility (DESIGN.md §7):** canvas wrapper has `role="img"`, a descriptive `aria-label`, `tabindex="0"`, ←/→ rotation and a visible focus ring. CTAs are `<a>` elements with ≥44px targets.
- **Responsive (DESIGN.md §4 table):** implement all four breakpoints. Check at 375, 768, 1024 and 1440 widths.
- **Cleanup:** dispose renderer, geometries and materials on unmount. Remove all event listeners.
- **Fonts:** Space Grotesk via `next/font/google`, no `<link>` tags.
- **No new dependencies** except `three` if it isn't already installed.

## Poster images

Add a dev-only script or page that renders the scene once per theme at 2000×940 and saves `public/hero/showroom-dark.webp` and `public/hero/showroom-light.webp`. If that's impractical in this repo, leave clearly named placeholder files and tell me.

## Done means

- Both themes render on the homepage behind a `theme` prop, with a temporary `?heroTheme=dark|light` query param so we can compare in production preview.
- Lighthouse on mobile: LCP not worse than the current homepage, CLS < 0.05.
- No console errors. No WebGL context left open after navigating away.
- Short summary of what you built, which files changed, and anything in DESIGN.md you couldn't follow and why.