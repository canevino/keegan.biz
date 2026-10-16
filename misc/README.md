# Ornament Machine / misc — v10 (complete Pass 2)

A modular, static, no-build web experiment for the `keegan.biz/misc/` section. It uses the site's existing `/assets/site.css` and `/assets/site-nav.js` without modifying either.

## Files

- `index.html` / `style.css` — scoped markup and layout
- `js/core.js` — seeded random streams, Bézier geometry, SVG helpers
- `js/pigment.js` — pigments and color-in-shape texture
- `js/finish.js` — SVG ink filters
- `js/interlace.js` — mirrored-knot breaks, irregular knot compartments, vine braiding
- `js/composition.js` — composition planning, stem routing, spatial heuristics
- `js/botany.js` — Pass 1 and follow-up botanical improvements
- `js/glyphs.js` — custom Insular-influenced vector capitals A–Z
- `js/initials.js` — letter decoration, clipped interlace, terminal penwork
- `js/render.js` — layers and attached ornament
- `js/app.js` — controls, redraw, transparent SVG/PNG export
- `js/smoke-test.cjs` — optional standalone test: `node js/smoke-test.cjs`
- `PASS_2.md` — technical changes, assumptions, limitations, remaining work

The HTML script order matters: `glyphs.js` must load after `core.js` and before `initials.js`. The browser loads all modules with `defer` and then starts `app.js`.

## Installation

Replace the `/misc/` folder in the GitHub repository, or use the changed-files ZIP to overwrite only the updated files and add `js/glyphs.js`. No build, npm packages, or changes to `/assets/` are required.

All three modes, sliders, repeatable seeds, optional checkerboard preview, and SVG/PNG exports remain available.

## Status

Pass 1 and the complete explicitly requested Pass 2 are implemented. For exact scope and unresolved items see `PASS_2.md`.
