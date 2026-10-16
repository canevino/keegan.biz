# Ornament machine — botanical generator / Pass 5

An interactive botanical ornament generator for `keegan.biz/misc/`, built without a compilation step.

- Botanical plants: holly, hazel, ivy, hawthorn, oak, dog rose, honeysuckle, bramble, ferns, acanthus, and mixed/hybrid modes
- Growth structures: Gothic, Anglo-Saxon inspired, and Celtic inspired
- Ornamental transformation and imperfect pigment printing
- **Draw a vine:** use a mouse, pen, or touch to paint up to four main stems; species-specific vegetation grows along the stroke
- **Replay growth** and optional animated reveal (editor only)
- Static transparent SVG and PNG exports

## Installation

Replace the contents of the repository's `/misc/` directory with this package's `/misc/`. Keep `/assets/site.css` and `/assets/site-nav.js` exactly as they are. No build step or dependencies are required for the generator itself. Spectral.js is requested from an external CDN; the existing pigment fallback works if it is unavailable.

## Structure

`index.html` — layout and script references

`style.css` — only `/misc/` styles

`js/core.js`, `pigment.js`, `finish.js` — SVG, materials and printing

`js/geometry.js`, `spatial.js`, `composition.js` — growth layout and spatial structure

`js/species.js`, `ornament.js`, `botany.js` — plants and ornamental variations

`js/drawing.js` — mouse/touch paths and path resampling

`js/render.js`, `app.js` — composition, controls, exports and animation

Read `PASS_5_INTERACTION.md` for behavior, edge cases, and test instructions. See the earlier `PASS_*` files for the prior staged rebuilds.
