# Pass 3 — Ornamental transformation

This pass builds directly on the **botanical species** and **Gothic/Anglo-Saxon/Celtic geometry** code. It does not add initials, text, knot grids, free-floating ornament, or dense ornamental penwork.

## New slider: `ornament` (0–100)

This is an independent drawing dimension, not a choice of plant species or structural guide. Values change the **illustrated parts** of the plant, not just background textures.

- **0–24**: Botanical silhouettes and familiar species organs remain dominant. No generated scrolls or symbolic motifs at zero.
- **25–49**: Subtle distortion of existing leaf contours and some directly attached curling terminals or flower forms.
- **50–74**: Stronger leaf lobe modulation, larger leaves, more colored foliate terminals, and occasional attached spirals.
- **75–100**: Stronger lobes, expanded silhouettes, colored fleuron/rosette motifs, split tendril tips, and more frequent curl extensions. Still attached to actual stems.

The transitions are continuous in shape deformation; addition of individual ornaments is stochastic and may change at seed-specific thresholds. Botanical morphology is retained: holly remains spiny, dog rose and bramble retain compound leaves, ferns retain segmented fronds, etc.

## New module: `js/ornament.js`

Provides `MS.ornamentInfluence(species, settings)`, `ornamentWidth`, `ornamentPoint`, `ornamentLeafInterior`, `ornamentTerminal`, `ornamentJunction`, and `ornamentSplitTip`. All are deterministic functions using the same seeded `rng` objects already used by the engine.

`ornamentWidth` and `ornamentPoint` alter contours inside species' original leaf geometry. `ornamentLeafInterior` adds one occasional broad drawn mark rather than dense penwork. Terminals are curls that start at an actual stem endpoint. Junction decorations include (1) multicolored painted rosettes, (2) pointed foliate fleurs, and (3) colored buds, each with a connecting stalk.

## Existing modules updated

- **`index.html`**: new slider, endpoint labels and ordered loading of `ornament.js` before `botany.js`.
- **`style.css`**: restrained label styling; no shared site files changed.
- **`js/app.js`**: state, reset and live updates include `ornament`. Existing SVG/PNG export unchanged.
- **`js/species.js`**: leaf contour generation and optional interior embellishment; species selection, seasons and pigment logic remain intact.
- **`js/botany.js`**: places attached scrollwork at twig tips, main branch terminals and a limited number of junctions; uses the shared spatial field to discourage obvious overlaps.
- **`js/smoke-test.cjs`**: tests ornament values 0, 25, 45, 74 and 100 across all 10 species plus random/hybrid.

The Gothic geometry engine (`geometry.js`) and collision layer (`spatial.js`) remain unchanged. Guidance is still invisible unless a user checks the diagnostic overlay.

## Known limitations

1. This is a stylized SVG rule-based system, not a historically accurate reproduction of a specific folio.
2. High density and high ornament can still create crowded areas; collision avoidance is approximate and scene-wide, not exact polygon intersection.
3. Strand/leaf layering still relies partly on draw order; not every overlap is optically perfect.
4. Spectral.js still uses the previous pass's CDN reference and local fallback. Pass 4 covers verification and paint overlap chemistry.
5. The static botanical shapes are generated immediately. Hand-drawn growth paths and animation remain for Pass 5.

## Test and deployment

Run `node misc/js/smoke-test.cjs` in the directory above `misc/`. Upload **only** the `misc/` directory to the site repository; do not replace `/assets/site.css` or `/assets/site-nav.js`.
