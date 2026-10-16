# Botanical species — Pass 1

This builds on the **botanical-only Pass 3** version. No letters, knot grids, dense penwork, or alterations outside `/misc/`.

## What was added

- New **species.js** atlas of ten distinct plants. Each main stem is assigned a species profile *before* leaves, growth habit, fruit and flowers are generated.
- **Species** selection: random mix (species selected independently per major plant), one named species (consistent identity across each whole plant), or an ornamental hybrid (acanthus main stem with deliberately mixed secondary shoots).
- **Season** selection: spring, summer, autumn and winter. Seasonal buds, catkins, flowers, fruit, deciduous leaf loss and fall color are conditional rather than appearing indiscriminately. This is a stylized generative illustration, not a biological phenology simulation.
- Dedicated woody **brown stem pigment** instead of routing bark through the old green-wash gradient. New shoots may be greener.
- Retained all prior layout choices and controls: pattern, pigment palette, foliage, small details, branch movement, print wear, ink spread, registration, bleed, transparent SVG and PNG export.
- Retained occasional ornamental multicolor forms. Deliberately **not** adding Gothic geometric constraints or an ornamental-transformation slider yet: those are scheduled for Passes 2 and 3.

## Plant profiles

| Plant | Leaf and habit | Seasonal structures |
| --- | --- | --- |
| Holly | Spiny evergreen leaves, relatively stiff branching | Small spring blossoms and red fruit in fall/winter |
| Hazel | Broad serrated leaves, arching shoots | Late-winter/spring catkins and fall nuts |
| Ivy | Lobed evergreen leaves, trailing/climbing shoots with fine rootlet marks | Winter clusters of dark berries |
| Hawthorn | Small lobed leaves and short thorns | Spring flowers and autumn haws |
| Oak | Rounded lobes and heavy woody structure | Autumn acorn forms |
| Dog rose | Pinnate compound leaves and prickles | Five-petaled flowers in spring/summer, hips in fall/winter |
| Honeysuckle | Paired leaves on flexible stems | Tubular summer blooms, autumn berries |
| Bramble | Serrated compound leaves on prickly arching canes | Spring flowers and later blackberry drupelets |
| Ferns | Divided, curving fronds on fine rachises | Spring fiddlehead shapes; reduced foliage in winter |
| Acanthus | Dramatic deeply lobed ornamented leaves | Decorative summer flowers |

## Files

- `index.html` — adds plant and season inputs and loads the species atlas before botany.
- `js/app.js` — reads the new inputs and includes them in deterministic rendering and reset behavior.
- `js/species.js` — botanical profiles, leaf contours, compound leaves/fronds and reproductive motifs.
- `js/botany.js` — allocates a species profile to each stem and grows appropriate branches, foliage and organs.
- `js/pigment.js` — adds a dedicated brown bark wash and allows the stem renderer to preserve the actual bark color.
- `js/smoke-test.cjs` — seed repeatability, species-season combinations and extreme settings.

The other existing modules (`core.js`, `composition.js`, `finish.js`, `render.js`) and `style.css` are kept unchanged.

## Installation

Upload the enclosed `/misc/` files into `keegan.biz/misc/`, preserving their relative paths. Do not change anything under `/assets/`. If applying only changed files, include `js/species.js`; the HTML references it as a required script. Old unused scripts (e.g. initials.js) can remain in GitHub but are **not loaded** by the page.

## Remaining work from the five-pass plan

1. **Pass 2 — Gothic geometry and composition:** invisible pointed arches, quatrefoils, ogee curves, radial structures, stronger layering/collision rules and more varied entry/exit points.
2. **Pass 3 — Ornamental transformation:** controllable botanical-to-medieval stylization, more exaggerated acanthus, integrated spirals and occasional symbolic multicolor ornaments; **no** text or knot tiles.
3. **Pass 4 — Print/material refinement:** verify real upstream Spectral.js operation, improve overlap mixing, gradient maps, localized erosion, ink spread and registration.
4. **Pass 5 — Interaction/integration:** paint a path, optional growing animation, performance checks, final UX and export refinement.

The species paths are stylized rather than exhaustive botanical drawings. They should be visually reviewed against your historical references as the next passes mature.
