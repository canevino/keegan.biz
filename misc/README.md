# ornament machine / keegan.biz / misc

A full replacement for the earlier Illuminarium / Ornament Machine. Static HTML/CSS/JavaScript, no build step and no runtime account. It can also be opened locally from `index.html` (the global site stylesheet will not be available locally, but the local stylesheet includes its own fallbacks).

## Installation

Upload the contents of this folder into `keegan.biz/misc/`, **replacing previous files**. In particular, delete the old `/misc/app.js`; this version uses the new files inside `/misc/js/` instead. Leave the other website directories alone.

    misc/
      index.html
      style.css
      js/
        core.js
        knot.js
        growth.js
        letters.js
        composition.js
        app.js
      README.md
      THIRD_PARTY_LICENSES.md

After publishing to GitHub Pages, visit `https://keegan.biz/misc/`. If an old page is still served, hard-refresh/clear its cache. All Javascript assets use relative URLs so the page can live at `/misc/` on GitHub Pages.

## Design rules

- The **artwork** is a background-free 1280 × 960 SVG. It is meant to float on the site's existing cream background. The optional checkerboard is **preview only**.
- Site UI: Helvetica, hard edges, `#ece7d7` (interface cream), `#11110f`, `#c1272d`, `#006a44`, `#fdb913`.
- No historical illustration sprites, cartoon foliage, framed folios, fake parchment, or imposed page labels.
- Each seed independently chooses an organizing pattern (including negative space and off-canvas crops). The `composition` selector changes the probability of different systems, **not** which picture template is loaded.
- The most expressive controls are *woven knotwork*, *creeping growth*, *broken lettering*, and *distortion*.

## Modules / how the artwork is built

- **core.js** — seeded xorshift RNG; SVG primitives; blob shapes; SVG ink and print filters influenced by the site's design page; palette mixing with optional Spectral.js (v3). Has a built-in RGB fallback if CDN is blocked.
- **knot.js** — **real mirror-curve knot tracing**, not hand-wavy loops: diagonal cell crossings, horizontal/vertical breaks, closed strand tracing, joining breaks, and independently repainted overpasses. Adapted from Olivier Giulieri's MIT-licensed Celtic Knot Maker using George Bain's method. Read `THIRD_PARTY_LICENSES.md`.
- **growth.js** — two separately written 2D systems: target-seeking branches (space colonization) with descendant-based stem width, and directionally drifting tendrils. Drawing across the preview supplies a sampled spine that branches organically to the side. Informed by the growth and stroke-following ideas from VegetationGeneratorThreeJS, VineJS, and the supplied tree-generator projects; no 3D renderer or sprite assets copied.
- **letters.js** — variable-scale serif/sans alphabetic shards, angled writing lines, and a minimal constructed glyph-mark system. Live hover gently repels nearby text fragments, an intentionally lightweight echo of the motion-sensitive text in Illustrated Manuscript. No imported font or sprite artwork. Font appearance will differ a little across operating systems.
- **composition.js** — score/structure selection, layering, negative space, overlaps, small fragments and occasional mosaic ink deposits. Independently seeds each region and hands the same controls to all modules. Uses Spectral.js-generated mixtures when available.
- **app.js** — UI, regeneration, stroke editing (undo / clear), pointer-sensitive text, reproducible seed, download / PNG rasterization and keyboard shortcuts.

## Controls

- **make something else** or `N`: new random seed and composition.
- Change a slider: rerender with same seed; the parameters really affect composition and shape geometry.
- Enter a saved **seed** and hit Return or the `↵` button to reconstruct artwork with the current settings. Saved painted strokes are local to the current page session and are not encoded in seed.
- **draw a vine** or `B`: drag across artwork. It will sprout side shoots when you release. Undo and clear work on the hand-drawn paths. Drawn paths are preserved on reseeding.
- Hover while not in drawing mode: local letter fragments nudge away from the pointer. This preview interaction does **not** change the exported artwork.
- **save svg**: original live SVG paths and text, no fill background.
- **save png**: transparent bitmap, selectable widths 1920/3840/5120 px. The aspect ratio is always 4:3. At 5120 the browser needs more memory.

## Dependencies and licensing

No dependency or build step is required. `spectral.js@3.0.0` is an **optional**, remotely loaded pigment-color mixer with an RGB fallback. The knot method has an MIT upstream attribution included in `THIRD_PARTY_LICENSES.md`. Concepts (not third-party source) from the ivy, VineJS, stained glass, Rune.js, Runicjs, Illustrated Manuscript/Pretext, and tree-generator materials were evaluated when designing the geometry and interactions. This is not a redistribution or a port of those applications.

The source code and UI do not require Blender, three.js, Vite, WebGPU, Pretext or Rune.js. Keeping the original SVG engine is deliberate: it is editable in Illustrator / Photoshop and deploys on GitHub Pages as static files.

## Known limitations

- Browser rendering is the reference. SVG filter support varies in Illustrator, Inkscape and Photoshop, so layers with filters can look different when imported. Prefer PNG for an exact baked appearance or SVG for editable vectors.
- SVG text remains real text and depends on fonts installed on the viewer's computer. Convert text to outlines in Illustrator when delivering to print or another machine.
- Color mixing changes slightly depending on whether the optional spectral library has loaded. The exported file embeds its computed colors, so **the saved SVG does not depend on that library**.
- Pointer disturbance is a preview-only feature. It is not an animated SVG export.
- This tool does not edit other site sections; do not delete `/assets/site.css`.
