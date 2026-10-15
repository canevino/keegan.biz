# Ornament machine / keegan.biz

A browser-based, transparent abstract image generator for `/misc/`. No build system, canvas library, backend, or API key.

## Upload

Upload the **contents of this `misc` directory** to the repository's existing `/misc/` directory, replacing the earlier `index.html`, `style.css` and `app.js`. Keep the rest of the site untouched.

The page will be available at https://keegan.biz/misc/ after GitHub Pages publishes. GitHub can take a little time to refresh; hard-refresh the browser if the old design is cached.

## Files

- `index.html`: page layout, controls and metadata.
- `style.css`: page-specific layout; matches the site's shared palette and typography.
- `app.js`: seeded image generator, authentic crossing/break knot tracing, ornament geometry, print filters, and export tools.
- `THIRD_PARTY_LICENSES.md`: attribution and MIT license for the knot algorithm adaptation.

## How it works

- The weave starts as a diagonal plait across a doubled grid. At crossings, random horizontal and vertical breaks redirect the strands. The program traces closed strands and joins some of them; it redraws the overpass above the underpass at crossings. The final shapes are warped, transformed, layered and printed with irregular edges. This follows the George Bain approach implemented by Olivier Giulieri's Celtic Knot Maker (see attribution).
- Independent generators create stochastic L-system growth, space-colonization branching, crooked tendrils, typographic fragments, dye deposits, small geometric fragments and misregistered color plates.
- All artwork lives in a **background-free SVG**. The cream color belongs to the surrounding website, not the image. Exported PNGs retain transparency.
- "Make something else" changes the seed and creates a new composition, rather than restyling the previous template. The seed can be saved and re-entered to reproduce the output with matching settings.
- 'Composition' modes bias how much space different elements occupy; they're not fixed posters.
- Pigment mixing uses Spectral.js 3 when loaded from the optional CDN; when unavailable, RGB blending is the fallback. This is the only optional network request.

## Controls

- Density, knotwork, branching/growth, letters, distortion, ink bleed and misregistration are adjustable.
- `space` or `r` regenerates when focus is outside text inputs.
- Save SVG for vector work or a transparent 2400 × 2000 PNG for Photoshop.

## Notes

The SVG is an editable document: paths and text remain vector elements. Filters and blended effects may appear different in Illustrator and other vector editors because they support different SVG filter features; the exported PNG is the more faithful browser rendering. Fonts are standard system fonts, not external assets. The generated letters remain text in SVG (convert to outlines in an illustration editor if you need portability).

The generator doesn't overwrite any other page or modify site navigation. Its absolute `/assets/site.css` stylesheet reference is intentional and works on the deployed GitHub Pages site.

## Branching / tree-generator approach (v3)

The new growth slider controls two independent vector-growth algorithms: a stochastic L-system (recursive `F`, `+`, `-`, `[` and `]` instructions) and a space-colonization model (attractor sites cause branches to grow toward free space). Stroke width tapers according to branch depth or descendant mass. A new seed changes rules, attractor fields, spread, color and layering. They are intentionally rendered as abstract networks, not complete trees, with no leaf sprites. Both are original implementations of established public algorithms. Sources for approach: aurbano/TreeGenerator (MIT, parameterized branching/width loss); TanviKumar/treegen (L-system concepts); Angramme/TreeGenerator (space-colonization concept). No third-party tree code is bundled.
