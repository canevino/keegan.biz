# misc / ornament machine — botanical-only species update

The generator is a static GitHub Pages page. No build step, npm installation or new global website files are required.

The **botanical species** and **season** controls implement Pass 1 of the five-part artwork plan. The atlas is in `js/species.js`; growth is in `js/botany.js`. The current pigment filters, layout controls and transparent export remain available.

See [PASS_1_SPECIES.md](PASS_1_SPECIES.md) for all species rules, an exact file list, remaining work, and the installation instructions.

Run `node js/smoke-test.cjs` for reproducibility and basic SVG generation checks. The site calls Spectral.js using the same CDN script as the previous version, with the prior color-mixing fallback if unavailable.
