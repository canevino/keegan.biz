# Pass 2 — Gothic geometry and spatial composition

## Goal

Create a geometric design *before* growing each plant. The geometry organizes where shoots originate, how primary vines turn, where intersecting lines gather, and which areas remain comparatively open. This is a botanical illustration with an invisible construction skeleton—not a visible Gothic window or Celtic knot grid.

## Geometry families

| Name | Structure | Botanical interpretation |
| --- | --- | --- |
| `gothic-pointed` | Two pointed rising arcs and a central axis | Two woody climbs meeting toward a cusp |
| `gothic-quatrefoil` | Four-lobed circular/oval trajectories | Circular stems and climbers winding between lobes |
| `gothic-ogee` | Paired opposing S-curves | Flexible stems that reverse their curvature |
| `gothic-radial` | Fan of 4–6 curved radii | Fern fronds and shoots diverging from a center |
| `anglo-lozenge` | Nested diamond-inspired courses | Angular underlying relationship softened into living curves |
| `anglo-fret` | Stepped key/fret routes | Curved botanical interpretation of a stepped axis |
| `anglo-saltire` | Diagonal crossed courses | Crossing root-to-tip routes |
| `celtic-triskele` | Three rotating arms | Three curved spiral growth axes |
| `celtic-double-spiral` | Paired spirals and a connective S-course | Twining and returning shoots |
| `celtic-scroll` | Long repeated curvilinear sweeps | Scrolling botanical forms and opposing bends |

These are **interpretations influenced by** Anglo-Saxon and Celtic decorative structures, not historically exact reconstructions or imported examples. The Celtic options do not generate interlaced knots (which were explicitly removed earlier).

## How a drawing is produced

1. **`app.js`** reads the `geometry`, `conform`, `pattern`, species, season, pigment and export choices. Regeneration assigns a new numeric seed.
2. **`render.js`** creates independent seeded random streams for geometry, species, paint and print effects. This keeps the seed deterministic.
3. **`composition.js`** creates the familiar free-growth arrangement and calls **`geometry.js`** to construct 100-point guide rails. It assigns rails to existing main stems, and at stronger compliance introduces additional scaffold stems where useful.
4. **`botany.js`** samples the natural stem cubic and blends its coordinates toward the guide pointwise. Species influence the amount of compliance: climbing ivy follows more closely, heavier oak resists somewhat, and fern fronds respond to radiating paths. Organic waviness remains after the blend.
5. Secondary shoots use **`geometry.js`'s field attraction** when a guide lies nearby and ahead, limited to a subtle adjustment; leaves/flowers retain their plant-specific rules from **`species.js`**.
6. **`spatial.js`** keeps a coarse grid of occupied leaf centers and softly rejects severe crowding from unrelated sprays. Natural within-spray overlap remains possible. Major woody stems render first; sprays and leaves render afterward.
7. **`render.js`** applies existing pigment and ink effects. If `guideOverlay` is true, it includes dashed rails and reference points in the *preview only*.
8. **`app.js`** always re-renders with `guideOverlay:false` for exports. The construction is never burned into the exported SVG or PNG.

## Geometry strength

- **0:** Geometry does not affect stem positions; the original natural composition remains.
- **~25:** Directional influence becomes visible, with free-growth structure still dominant.
- **~58 (default):** Geometric rhythms appear, but most of the plant remains curved and organic.
- **100:** Primary stems closely follow the selected architecture. They still wiggle slightly and retain species-specific growth habits; secondary shoots are not forced into hard grids.

## Spacing and layering

`js/spatial.js` uses circles approximating leaf occupied regions, stored in spatial hash cells. It cannot infer the exact silhouette of every lobed leaf, and therefore **some overlaps are still possible**. This is intentional: complete nonoverlap would make the plants unnaturally sparse. The renderer separates major woody axes from the foreground shoots, giving a stable illustration hierarchy. A full vector-shape collision solver and branch-underpass masks are not implemented here.

## Checks and limitations

- Check every mode with the same numeric seed, including the conformity extremes and multiple species.
- Test guide visibility independently of export. The exported art contains no guide overlay.
- Keep `/assets/site.css` and `/assets/site-nav.js` unchanged.
- The construction system introduces underlying Gothic/Insular geometries only. It does **not** add text, decorated initials, Celtic knot tiles, or architectural frames.
- The next pass adds the adjustable natural-to-ornamental transformation, retaining some multicolored decorative flowers. A later pass refines pigment overlap and ink materials, followed by optional manual path input/animation.
