# misc / ornament machine — botanical only / Pass 3

A static, dependency-light botanical ornament generator for `keegan.biz/misc/`.
There are no decorative letters, Celtic knot grids, or narrative manuscript panels.
It works on GitHub Pages without a build step.

## Install

Upload the contained `misc/` folder to the website's `misc/` folder, replacing only files with the same names. Do not replace anything in `/assets/`. There is no need to update `site.css` or `site-nav.js`; they are referenced as before.

Open `keegan.biz/misc/` and hard-refresh after committing.

## Files

- `index.html`: page and controls; uses shared site navigation unchanged.
- `style.css`: `/misc/` scoped responsive page layout.
- `js/core.js`: deterministic random numbers, palettes, Bézier and SVG primitives.
- `js/composition.js`: six structurally different growth patterns and deterministic random selection.
- `js/botany.js`: stems, acanthus and lance leaves, petioles, buds, vein engraving, shoots, fine penwork.
- `js/pigment.js`: pigment mixing, sampled color gradients, shape-clipped washes and registration.
- `js/finish.js`: alpha-threshold ink spread, physical edge noise, erosion, dry-print filters.
- `js/render.js`: botanical-only layer assembly and transparent SVG.
- `js/app.js`: live controls, seeds, reset, and SVG/PNG exports.
- `js/smoke-test.cjs`: optional Node validation (`node misc/js/smoke-test.cjs`).
- `PASS_3.md`: explanations, tests, and known limitations.
- `THIRD_PARTY_LICENSES.md`: Spectral.js source and MIT attribution.

Old `js/glyphs.js`, `js/initials.js`, `js/interlace.js` are NOT used. They are intentionally NOT included here; remove them from `/misc/js/` if you want to simplify the repository. Do not remove other sections' files.

## Controls

- **Growth pattern**: chance, single, crescent, diagonal, radiating, meander, cluster. Distinct axes and stem counts, not color-only variations.
- **Pigments**: mineral palettes.
- **Seed**: exact recreation of the same artwork with the same controls.
- **Foliage / small details**: branching complexity and detailed vein/pen strokes.
- **Pigment variation**: intensity of clipped washes, grain, and graded color.
- **Branch movement**: strength of centerline undulation, plus slight displacement in the printing filter.
- **Print wear**: abrasion, dry-print gaps, and edge fraying.
- **Ink spread**: how far blurred alpha expands, if **ink bleed** enabled.
- **Color registration**: color shifted around leaves and stems, while dark pen outlines remain legible.
- **Transparent export**: both outputs have no paper/background unless explicitly unchecked.

## Spectral.js dependency

`index.html` loads the official Spectral.js 3.0.0 build from jsDelivr (`https://cdn.jsdelivr.net/gh/rvanwijnen/spectral.js@3.0.0/spectral.min.js`) before the local pigment module. It uses `new spectral.Color(hex)` and `spectral.mix([color1,weight1],[color2,weight2])` for real spectral mixing. Color mixes are memoized to minimize expensive calls.

The upstream JS file is **not** embedded in this ZIP. The library must load over the internet for full spectral mixing. If it is blocked or offline, the page still works with its channel-wise Kubelka–Munk approximation. To make it offline, download the official `spectral.min.js` from the release and change only its `<script src>` to `/misc/vendor/spectral.min.js`.

## Validation

The smoke tests cover all seven selector values (including random), repeatable seeds, changed seeds, 0/100 settings, no letters/knot grids, and a simulated Spectral API path. Representative generated SVGs were XML parsed and converted to PNG. A headless browser test loaded the actual HTML/CSS/JS from in-memory content, verified selector changes, download buttons, a 3200px transparent PNG, desktop and mobile widths, and reported no page JavaScript errors. In that browser test the Spectral CDN itself was **not loaded**, so online third-party availability remains unverified.
