# Ornament Machine — modular rebuild (v9 · botanical pass 1)

A self-contained experiment section for `keegan.biz/misc/`, built in plain HTML, CSS and JavaScript. There is **no build step**. The ZIP intentionally contains **only `/misc/`**: do not replace anything in `/assets/`.

## Deployment

1. Unzip the archive.
2. Replace the files in the repository's `/misc/` directory with the enclosed `misc/` files.
3. Preserve the existing `/assets/site.css` and `/assets/site-nav.js` files. `index.html` references them; the archive does not contain copies.
4. Commit changes to GitHub Pages and allow the site to redeploy.
5. Hard-refresh `/misc/` after deployment if the browser shows a cached version.

## Structure

| File | Function |
|---|---|
| `index.html` | Adds the experiment as a section of Misc and wires in the existing site navigation. |
| `style.css` | Page layout, controls, viewport breakpoints and space reserved for the fixed scarves. |
| `js/core.js` | Seeded RNG, geometry, cubic Bézier sampling, paths, bounds, palette definitions. |
| `js/composition.js` | Chooses the overall hierarchy, main letter region, curves and interlace sites from a seed. |
| `js/botany.js` | Creates curved tapering stems, primary and secondary shoots, carved acanthus/trumpet leaves, vein engraving, ornamental rosettes and scrolling terminals. |
| `js/interlace.js` | Generates genuine crossing-and-break interlace with traced strands and overpasses. |
| `js/initials.js` | Builds a decorated, clipped initial with internal interlace and penwork. |
| `js/pigment.js` | Pigment mixtures and texture clipped into leaf, stem and letter regions. |
| `js/finish.js` | SVG filter stack for alpha-threshold bleed, displacement and dry print. |
| `js/render.js` | Runs modules in the correct order with independent random-number streams. |
| `js/app.js` | Connects controls, deterministic seeds, transparent SVG and high-resolution PNG. |
| `ARCHITECTURE.md` | Detailed explanation of every algorithm and the way the modules fit together. |
| `SOURCES_AND_LIMITATIONS.md` | Reference-to-implementation map and explicit gaps. |
| `THIRD_PARTY_LICENSES.md` | MIT attribution for the knot algorithm and a list of nonbundled reference projects. |

## Controls

- **Structure:** botanical illumination, decorated initial or interlace/carpet ornament. These are different *compositional grammars*.
- **Pigments:** muted Insular palettes or the website's own colors.
- **Initial:** one uppercase character; decorated-initial checkbox enables/disables it.
- **Seed:** the same seed, controls and code produce the same structure. 'Something else' changes the seed.
- **Foliage:** the number and complexity of secondary branch clusters.
- **Interlace:** number, density and complexity of traced knot strands.
- **Small details:** rosettes and internal letter embellishment.
- **Letter fragments:** small, restrained typographic debris at outer margins, not a generated paragraph.
- **Pigment variation:** irregular specks and translucent color changes *inside shapes*.
- **Distortion:** SVG displacement intensity, applied primarily to ink groups and printed forms.
- **Print wear:** erosion and roughness; affects some outline and pigment irregularities.
- **Ink bleed:** alpha-blur/threshold treatment. Turn off for cleaner artwork.
- **Transparent export:** on by default for SVG/PNG. Turning it off adds the site-cream fill to exported images only.

## External library: Spectral.js

The drawing works fully offline. If the website already loads Spectral.js v3 on `window.spectral`, the pigment adapter will automatically use `new spectral.Color(...)` and `spectral.mix(...)`. Without it, the adapter uses a lightweight *per-channel* Kubelka–Munk reflectance approximation. That fallback is **not equivalent to the full multi-wavelength Spectral.js model**. Spectral.js itself is not bundled or fetched from a CDN, so the basic site has no additional network dependency.

If you add a local Spectral.js browser bundle in a later revision, reference it in `index.html` before `js/pigment.js`. Confirm its browser build exposes `window.spectral`, since ESM-only packages do not necessarily create a global.

## Browser and export differences

The app uses SVG filters. Browsers can render these differently from Photoshop, Illustrator, or some SVG rasterizers. PNG export is rasterized *in the browser* specifically so it matches the live preview more closely. The SVG keeps paths and live text; standalone applications may replace Georgia/Palatino if unavailable. Converting text to outlines in Illustrator will lock its letter shape at the cost of editability.

See `PASS_1_BOTANY.md` for the updated botanical implementation. See `ARCHITECTURE.md` for the v8 foundation and other modules and `SOURCES_AND_LIMITATIONS.md` for historical-fidelity limits.

## v9 update: botanical pass 1

Only `js/botany.js` changed in the drawing/runtime code. Primary stems are more sinuous, leaf forms and veining are richer, secondary branching is capped, and a botanical terminal vocabulary is attached directly to the plant. See `PASS_1_BOTANY.md`. No global files are touched.
