# misc / illuminarium

A section-based miscellaneous page for keegan.biz. Includes one experimental ornament generator; future miscellaneous work can be added below it without rebuilding the page.

## Upload

Upload the entire `misc/` directory to the `main` branch of `https://github.com/canevino/keegan.biz`, replacing the current `/misc/index.html`, `/misc/style.css` and `/misc/js/` scripts. The original site files under `/assets/` are not included or replaced.

```
misc/
  index.html
  style.css
  js/
    core.js
    knot.js
    ornament.js
    app.js
  README.md
  THIRD_PARTY_LICENSES.md
```

You can delete previous unused `/misc/app.js`, `/misc/js/growth.js`, `/misc/js/letters.js`, and `/misc/js/composition.js` if they are still present. They will not run because the new page does not reference them.

Your site's existing `/assets/site.css` and `/assets/site-nav.js` are used for its shared palette and scarf navigation. The page is intended for `https://keegan.biz/misc/` on GitHub Pages. No npm, Vite, server, database, credentials, or build process is needed.

## Page

- A normal Misc introduction in the same Helvetica, cream, red/green/yellow/black language as the home page.
- `01 / drawing systems`: the Illuminarium experiment as a discrete page section with a transparent artwork preview, editing controls, and downloads.
- A quiet placeholder for later Misc sections.
- Responsive layout; controls move below the artwork on small screens.

## Drawing system

Four compositional grammars, each seeded and reproducible:

1. **Botanical marginalia:** foliate side stems, a loose botanical frame, a large letter, small woven knot, selected pigment patches.
2. **Decorated initial:** an engraved initial takes precedence; the foliage, interlace and color retreat to supporting positions.
3. **Woven illumination:** actual Celtic over/under paths, with foliage and a smaller letter.
4. **Distorted pigments:** controlled pigment mosaic fields, overlaid with botanical growth, ornamental lettering and smaller knots.

`js/core.js` contains repeatable random numbers, palette mixing, SVG primitives, and SVG print filters. `js/knot.js` contains the actual grid/break/strand tracing, adapted from Celtic Knot Maker (MIT). `js/ornament.js` builds the foliate forms, engraved initials, mosaics and overall layouts. `js/app.js` handles UI state and exports.

The artwork is transparent by default, without a full-page parchment or opaque rectangle. The cream seen behind it on the site belongs to the website, not the generated image. Unticking "transparent export" adds a cream rectangle to downloaded SVGs and PNGs. The transparency checkerboard is a preview-only option.

The live SVG retains paths and text nodes. PNG exports rasterize the current SVG at 3,200px wide, retaining alpha by default. Exact serif letterform rendering can vary by installed system font. The generator does not use the photographic screenshots as textures or copy their illustrations.

## Provenance

Please retain `THIRD_PARTY_LICENSES.md`: the knot construction is adapted from Olivier Giulieri's MIT-licensed Celtic Knot Maker. Other references supplied in the project informed design decisions but no third-party source files or artwork are bundled.

`Spectral.js` color mixing is recognized when already available on the page, but is not downloaded or required: the generator falls back to simple RGB color interpolation offline.
