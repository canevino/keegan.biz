# misc / ornament machine rebuild v6

This package contains a rebuilt `/misc/` page and the small site assets it depends on.

## Files
- `misc/index.html` — page markup
- `misc/style.css` — page-specific styling
- `misc/js/core.js` — shared SVG helpers and ink-bleed filters
- `misc/js/knot.js` — knot engine
- `misc/js/ornament.js` — ornament generator
- `misc/js/app.js` — UI / export logic
- `assets/site.css` — site-level base styles
- `assets/site-nav.js` — site navigation script

## What changed
- Removed the extra AI-sounding copy.
- Rebuilt the section so it sits as a cleaner `misc` experiment page.
- Reworked the ornament output to push closer to manuscript / interlace / distorted print territory.
- Updated the decorated initial so it is flatter, less shiny, and uses a rougher ink-bleed treatment.
- Thickened the vine structures so they read as actual stems rather than hairlines.
- Increased distorted pigment / fragment behavior and off-register print noise.

## Deploy
Drop `misc/` and `assets/` into the site root, replacing the earlier versions.
