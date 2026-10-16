# Pass 5 / Drawing interaction and integration

This release builds directly on Passes 1–4. It is still a botanical-only ornament generator for `keegan.biz/misc/`. **No files outside `/misc/` should be replaced.** Site-wide CSS and scarf navigation are not included.

## Using it

1. Choose a botanical species, season, pigment palette, and optional ornament/print settings.
2. Click **draw a vine**. Use a mouse, stylus, or one finger to drag a continuous path on the artwork. The direction matters: **start at the root and end at the tip**. A draft stroke appears as a thin dashed red line.
3. Release to generate branches, leaves, and organs along that path. Repeat for up to four independent main stems.
4. Click **finish drawing** to return to regular scrolling/clicking and optionally play growth animation. **Undo path** removes the newest authored stem; **clear paths** returns to generated compositions.
5. **Something else** changes the seed, so the same authored paths sprout different deterministic foliage. Select a new plant, season, or printing effect to re-render on the same stem shapes.
6. Enable **animate** to play a reveal when artwork regenerates; use **replay growth** to see it on demand.
7. **Save SVG** and **save PNG** export complete, static, transparent artwork, without any guide overlay or animation mask. PNG remains 3200 × 3765.

The existing Gothic, Anglo-Saxon and Celtic construction guides still work for automatically generated growth. A manually drawn path *replaces* the construction axes; the geometry slider and layout menu are deliberately ignored until the hand-drawn paths are cleared.

## Files changed

- `index.html`: new draw/edit/replay controls and `<svg id="stroke-overlay">`. Includes `js/drawing.js` before `js/composition.js`.
- `style.css`: scoped overlay, draw-mode `touch-action:none`, status, and toolbar styling.
- `js/drawing.js` (new): point cleaning, Chaikin smoothing, length-uniform sampling, tangent computation, four-stem cap.
- `js/composition.js`: user-authored roots override random/Gothic axes before any random composition decisions.
- `js/botany.js`: when a stem is user-drawn, its sampled centerline is preserved exactly (species and print rendering are otherwise unchanged).
- `js/render.js`: remembers the actual finished main-stem paths for screen-only growth playback.
- `js/app.js`: pointer capture, undo/clear/finish, responsive SVG coordinates, replay, and static exports.
- `js/test-pass5.cjs` (new): tests path sampling, species/geometry compatibility, deterministic output, and material effects.

The specimen library, ornamental transformations, geometry modules, pigment mixing, and print filters remain from the previous build.

## Internal flow

`pointer events → draft points → cleaned + smoothed stroke → 101 arc-length samples → M.plan(...drawnPaths) → M.botanical() → finished SVG`. Every sample carries `x`, `y`, normalized `t`, and unit tangent `tng`. This lets the existing plant engine compute branch angles and leaf attachments from the actually drawn curve.

The painting remains reproducible: the pointer paths are input data; independent deterministic seed streams still govern botanical growth, ornamental transforms, and print materials. Manual stroke geometry is not distorted by switching guide families.

Growth animation uses a broad, line-dashed SVG mask running along the finished main arteries. It is added to the **DOM only**, and never included in the export string. The animation is approximate—side shoots and leaves become visible near the growing stem rather than tracing their own branches. It respects `prefers-reduced-motion`. To prevent excessive work, a reveal is skipped if artwork markup exceeds 5 MB (3.2 MB on narrow screens); the complete static drawing still works. The animation itself does not continuously regenerate any SVG geometry.

## Safeguards and remaining limitations

- Strokes shorter than approximately 55 canvas units are rejected; unintentional taps don't create plants.
- Each stroke is capped at 240 captured points and resampled to 101 evenly spaced points. Four stems maximum limits mobile memory use.
- Touch scrolling is unaffected outside explicit drawing mode; drawing mode locks touch panning *only on the artwork*, not the rest of the page. ESC exits drawing.
- Cancelled strokes are discarded.
- Undo removes an entire main path, rather than individual pointer samples.
- Drawn paths are not persisted between page refreshes. SVG/PNG exports do not include editable stroke metadata. If editable sessions are needed later, add a JSON session export or URL state.
- Highly self-intersecting user strokes can still create congested foliage. Spatial avoidance is approximate and inherited from Pass 2.
- Spectral.js still uses the prior CDN/fallback approach; this pass does not claim upstream CDN availability verification.
- The final rendering can be expensive for extreme foliage/detail/print combinations, especially ferns. Reduce detail if mobile performance is limited.

## Tests

- Run `node misc/js/smoke-test.cjs` (existing generation combinations).
- Run `node misc/js/test-pass5.cjs` (46 manual-path and 100 cross-product combinations).
- Browser tests in Chromium use inline copies of site assets: mouse drawing, path undo/clear, desktop/tablet/mobile layouts, control changes, animation mask lifecycle, SVG/PNG downloads and transparent pixels.
- Live deployed GitHub Pages operation is not verified by local tests. Verify the page after uploading and allow for browser/CDN caching.
