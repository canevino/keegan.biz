# References and implementation boundaries

The user's three illuminated manuscript images and subsequent ornamental-print references determine the visual direction. The current artwork is botanical-only and intentionally has no decorated initials, Celtic knot grids, narrative panels or generated text.

## Influences

- **Gothic tracery** — pointed arches, quatrefoils, ogee curves, and radial patterns are used as invisible growth skeletons.
- **Anglo-Saxon decorative geometry** — lozenge, fret and saltire arrangements inform paths for botanical growth. These are modern procedural interpretations, not reconstructions of a named historic object.
- **Insular / Celtic geometric ornament** — triskele, paired spirals and curvilinear scrolling guide the form. No knot generator is imported or displayed.
- **VegetationGeneratorThreeJS and VineJS concepts** — path-following growth, branch topology, and leaf placement were reimplemented for flat SVG output; no Three.js or VineJS runtime library is used.
- **Spectral.js v3** — optional externally loaded pigment mixer, with offline approximation.
- **Ink-bleed SVG filter article and screenshots** — alpha thresholding, texture, displacement, registration.

## Known gaps

1. The geometry guides are stylized, not mathematical architectural reconstructions.
2. Collision avoidance uses approximate circles, not exact intersections of leaf contours.
3. Stems are layered globally behind foliage; individual front/back crossings are not yet masked as separate physical over/under paths.
4. At 100% geometry adherence, plants can appear visibly architectural; reducing the slider restores organic freedom.
5. The current manuscript ornament is still less detailed than hand-painted historical examples. The next ornamental-transformation pass handles stylization; it will not add dense penwork or restore giant letters.
6. Spectral.js's published CDN is used when available; no third-party library source is bundled.
7. Browser PNG export captures the browser rasterization; another SVG viewer may render filters slightly differently.
