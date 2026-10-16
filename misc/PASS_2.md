# Pass 2 — letter construction, woven ornament and composition

This release **includes Pass 1 botanical refinements** and the follow-up fixes for the buds, terminal curls, leaf attachments and bendier primary stems. It also completes the **three specific Pass 2 areas**, which were missing from the previous botany-only release.

## Files changed from v9

- `index.html` — loads `glyphs.js` after botany and before `initials.js`.
- `js/glyphs.js` — **new** custom constructed capitals A–Z.
- `js/initials.js` — uses those custom SVG silhouettes rather than a browser font; clips interlace, pigment, and penwork to the actual glyph shapes; adds terminal decorations attached to stroke endpoints.
- `js/interlace.js` — retains the previous mirror-curve knot construction, then adds `braidOnStem` (an alternating over/under braid following a Bézier spine) and `knotCartouche` (woven knotwork clipped to irregular compartments).
- `js/composition.js` — four arrangement grammars, dynamic focal location, Bézier routing, and spacing checks for decorative compartments.
- `js/render.js` — consumes one composition plan for the letter, attached plants, woven compartments, and extra penwork. Standalone rectangular knot tiles have been removed.
- `js/botany.js` — includes the prior Pass 1 refinements plus smoother primary and secondary stems, edge-attached leaves, less disconnected buds and curls, and braids along selected main stems.
- `js/smoke-test.cjs` — loads the new glyph module before the other drawing modules.

`style.css`, `app.js`, `core.js`, `pigment.js`, and `finish.js` are **unchanged** from the modular v8 baseline. `assets/site.css` and `assets/site-nav.js` are not included or modified.

## 1. Custom Insular-influenced letter shapes

`MS.glyph(letter, size, rng)` returns filled SVG pen-stroke outlines constructed from hand-coded cubic and linear curves, along with actual terminal points. There are definitions for **all 26 Latin capitals**. The system samples the centreline, calculates normals, varies the stroke width slightly, and closes each outline. It doesn't rely on a browser's font installation, and the outlines export in SVG.

`MS.initial(plan, settings, rng)` uses the resulting letter polygons, fills them with a muted mineral pigment, applies uneven color and engraving marks, clips Celtic interlace to their silhouette, and attaches small penwork to the actual letter stroke terminals.

**Limit:** These are newly drawn *Insular-influenced* letterforms, not paleographically accurate facsimiles of individual Book of Kells letters. A historical glyph library traced from drawings remains a possible later art-direction improvement.

## 2. Interlace that participates in ornament

The original mirror-curve knot algorithm is retained (the underlying grid still enforces its crossing and break logic). There are now three uses:

1. **Inside letters:** real knot paths clipped to irregular curved letter strokes and their counters, so the ornament occupies the letter rather than sitting next to it.
2. **Along vines:** `MS.braidOnStem` follows the *actual sampled botanical spine*. Paired colored strands cross repeatedly; masks remove short segments from the underpassing strand, making the over/under pattern deliberate.
3. **Irregular compartments:** `MS.knotCartouche` uses a curved multi-lobed outline as an SVG clip. These cartouches are positioned near and physically connected to a growing stem.

**Limit:** The mirror-curve generator still uses a rectangular coordinate grid internally. It is now clipped into nonrectangular spaces; it does not yet solve a general free-form topology that follows an arbitrary letter outline perfectly.

## 3. More deliberate spatial composition

`MS.plan` decides the focal letter, the vine arteries, and attached cartouche positions *before* rendering. Its four arrangements are `crescent`, `diagonal`, `ascent`, and `split`.

The planner:

- uses a focal exclusion ellipse to preserve letter legibility;
- routes substantial Bézier stems around the focal region;
- places compartments close to a stem, with controlled size;
- rejects cartouches that would cover the main letter or another cartouche;
- selects one stem for its over-under braid;
- maintains independent, repeatable random streams for every subsystem.

**Limit:** This is a spatial heuristic, not a general-purpose collision solver; dense foliage can still overlap. Some intentional overlaps are essential to this style.

## 4. Additional ornament, without extra pasted-on icons

The release includes the new custom lettering terminals (roundels, short penwork and attached curls), attached vine braidwork, irregular framed knot compartments, linked stalks, and small attached penwork spirals with dot details. It avoids freestanding random ornaments wherever possible.

## How it all combines

`app.js` → `composition.js` (plan) → `interlace.js` (attached knot/cartouches) → `glyphs.js` + `initials.js` (custom central letter) → `botany.js` (bodyful branching, attached foliage, woven main stem) → `render.js` (additional penwork, optional fragmented letters) → `pigment.js` and `finish.js` (color texture and ink effects) → transparent SVG → optional PNG conversion.

The page uses plain HTML/CSS/JavaScript. No build process, Vite, WebGPU, or external font downloads are needed. The optional external Spectral.js library is **not bundled**; an offline pigment approximation is used when it is absent.

## Still to do

**Pass 3:** stronger localized ink bleeding and dry areas; layered pigment and gradient-map treatments; full tested Spectral.js integration rather than an optional fallback; richer broken-letter and calligraphic fragment generation; wider variation in pigment registration and printing conditions.

**Beyond Pass 3, already mentioned earlier:** user-drawn/painted vine paths; Gothic architectural / narrative panel mode; and optional animated ornaments or interactive text displacement. Further historical fine-art refinement could also include hand-traced historical acanthus and Insular glyph assets.

## Deployment

**Incremental:** replace five updated JavaScript files (`botany.js`, `composition.js`, `initials.js`, `interlace.js`, `render.js`) in `misc/js/`, add the new `misc/js/glyphs.js`, and replace `misc/index.html` so the new module loads.

**Complete:** upload the enclosed `misc/` folder over the current `misc/` directory. Do not overwrite anything in `/assets/` or other site sections.

Both archives include `PASS_2.md`. All site-wide files remain untouched.
