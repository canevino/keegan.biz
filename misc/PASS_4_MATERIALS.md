# Pass 4 — material, print and texture

This is an update to the **botanical-only Pass 3** generator. It keeps the ten species, seasons, Gothic/Anglo-Saxon/Celtic construction guides, and ornamental transformation. There are no letters or Celtic knot grids.

## What changed

### `js/pigment.js`

- Introduces two different scales of pigment grain and a local `tonal-alpha` noise filter.
- Applies tone-mapped pigment washes **inside plant silhouette clips**. The gradients map pale regions to lighter pigment and dark regions to darker pigment mixes. Seeded noise masks determine how much of the gradient appears locally.
- Stem and leaf masks cut *transparent gaps* where ink has worn away. These are real alpha holes, not cream dots painted on top.
- Spectral.js v3 `Color` and `mix` calls mix palette pigments for shade/light glazes and their print layers. These are precomputed pigment color mixtures. Rendering separate overlapping SVG shapes still relies on ordinary SVG compositing; this is not a full spectral physically based per-pixel paint solver.
- A material-specific RNG is derived from the artwork seed and shape ID. Print sliders no longer change plant geometry.
- Retains brown bark independently of the green, blue, red and ochre paints.

### `js/finish.js`

- `press` filter uses seeded turbulent fields to slightly displace printed material locally.
- Ink spread thresholds, dilates and deforms source alpha, then isolates only the newly added edge, producing localized rather than uniformly blurred deposits.
- A low-opacity dry-pressure pass applies additional irregularity. Individual wear masks in `pigment.js` supply the main pigment-loss effect.
- Separate low-cost `dry-print` and `faint` filters remain for occasional small flourishes.

### `js/species.js`

- Broad leaves, compound leaves, and fern segments now use the shared material pipeline (`M.leafFinish`).
- Their paint and wear are clipped to their own contours; vein marks stay legible.

### Controls (`index.html`, `js/app.js`)

Controls retained: growth pattern, underlying geometry, species, season, palette, seed, follow geometry, ornamental transformation, construction guide overlay, foliage, small details, pigment variation, print wear/dry brush, ink spread, print distortion, color registration.

Controls removed:

- **Branch movement:** duplicated structural unpredictability; the original value (20) remains a fixed, stable baseline. `Print distortion` now controls printing effects without changing branch paths.
- **Ink bleed checkbox:** redundant with `ink spread` (0 = off).
- **Transparent export checkbox:** SVG and PNG exports are always transparent; the `grid` display switch is a preview-only aid.

## Spectral.js deployment and verification

`index.html` loads the published Spectral.js 3.0.0 browser bundle asynchronously from:

https://cdn.jsdelivr.net/gh/rvanwijnen/spectral.js@3.0.0/spectral.min.js

The generator renders immediately without waiting for the external request. When the library loads, it refreshes using the spectral calculation. If blocked/offline it continues to use an internal RGB-channel Kubelka–Munk *approximation*, which is not equivalent to the full library.

To check on your live site in the console:

```js
MS.verifySpectral()
MS.spectralStatus()
```

The published documentation's reference mix is 50% `#002185` and 50% `#FCD200`, yielding `#3D933E`. `MS.verifySpectral()` reports whether the browser library is present, returns a valid hex, and matches that reference example.

**Test limitation:** This development environment cannot fetch the external library for an end-to-end runtime test. The integration uses the documented v3 interface and has been tested against a compatible mock; the offline fallback and export path were tested in Chromium. Check `referenceMatch` on the deployed site before claiming the CDN is live.

## Interaction / export

- In-app construction guides are deliberately omitted from both SVG and PNG downloads.
- Source layout/navigation are referenced unchanged: `/assets/site.css` and `/assets/site-nav.js`.
- No file outside `/misc/` needs replacing.
- SVG export embeds all paint patterns and masks directly. PNG uses the browser's SVG renderer at 3200px wide and retains alpha transparency.

## Testing completed

- Original 163 modular generation checks pass.
- Changing only the material sliders leaves 129 tested leaf placement transforms unchanged for a representative holly seed.
- Offline fallback and v3 method signatures tested; SVG/XML validation passes.
- Inlined-browser rendering at 1536, 1200 and 390px: no script errors or horizontal overflow.
- Browser SVG and PNG downloads work. PNG is 3200 × 3765, RGBA, with transparent corner pixel.

## Still outstanding

Pass 5: drawing your own stem path, optional plant growth animation, and performance/interaction refinements. In particular, a heavily ornamented fern can generate an SVG with many masks, so stress testing on lower-powered phones will still be worthwhile.
