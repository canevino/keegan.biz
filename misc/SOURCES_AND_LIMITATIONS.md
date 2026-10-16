# Sources, treatment and open limits

This page is a technical **foundation**, not a claim of historical fidelity. The first and second images supplied in the conversation (floral Book of Hours-style border and Book of Kells/Insular lettering) remain the principal style targets. The third reference (framed Gothic storytelling) is useful for a possible later architecture-based mode, but no cartoon saints or figures are created here.

## Sources examined and architectural decisions

| Source | Useful mechanism | Current treatment |
|---|---|---|
| Initial illuminated-manuscript images | Acanthus, vegetal margins, interwoven capitals, patterned compartments | Botany, initials and interlace modules; stylistically simplified |
| `lukerobie.design` Instagram images and written method | Stacked texture, pixels/mosaic, gradient maps, misregistration | Shape-clipped pigment and displacement; not a literal Photoshop gradient-map port |
| Freddie Guthrie 3D drop cap/video | Letters as constructed objects, rough stone/pigment | Live glyph outline with clipped detail; **no** 3D modelling or exact old drop-cap path database |
| `spectral.js` | Kubelka–Munk pigment mixture | Optional Spectral.js v3 hook + offline 3-channel approximation; library not bundled |
| Olivier Giulieri, Celtic Knot Maker (MIT) | Mirror curves, breaks, true over/under paths | Directly adapted grid-tracing logic in `interlace.js`, with MIT attribution |
| David Mackinnon, `celtic` | Additional knot graph, editor/metrics | Conceptual comparison; no source incorporated |
| Joe Cooper, Stained Glass Generator | Irregular regions and color consistency | Simplified masked pigment variation, no standalone stained-glass shapes or source incorporated |
| GitHub tree-generator topic projects | Recursive branch rules, taper, stochastic variation | Original cubic Bézier vegetation geometry; not copied from a particular repo |
| Achref Elouafi, VegetationGeneratorThreeJS | Path-guided primary growth and tangent branches | Reimplemented in 2D vector geometry; no Three.js, WebGPU or raycasting |
| millerthegorilla, VineJS | Parametric vines, branch probability, growth directions | Original deterministic growth rules; not imported as a library |
| illustrated-manuscript.v... by River Marchand | Animated figure, dynamic exclusion text, real-time layout | Studied; omitted animated dragon, Pretext and moving typography as unnecessary for static ornament |
| Rune.js | Vector-graphic construction API | Native browser SVG retained; Rune.js not bundled |
| Runicjs | Runic lettering | No artificial runic alphabet inserted; input remains Latin initial unless revised |
| Andy Jakubowski ink-bleed HTML demo | Blur then discrete alpha threshold | Updated `#press` composite in `finish.js` |
| `keegan.biz` `/design/` page | Rough ink layers, overlapping print impressions, restrained palette | SVG press/filter ideas adopted; no design-page global source modified |
| `keegan.biz` homepage and illustration page | Modular sections, functional controls and intentional space | Embedded Misc section, independent SVG export, site navigation reused |

## Explicit decisions and gaps

1. **No global files edited.** `/assets/site.css`, `/assets/site-nav.js`, homepage, design page and other directories remain untouched.
2. **No fixed medieval paragraph or slogans.** The title 'ornament machine' is site UI; generated content is not a fake manuscript with generic Latin narration.
3. **No full medieval illustration library.** Drawing human figures, dragons, angels or animal interlace authentically requires source illustrations or much more specialized procedural anatomy. Hand-drawn/scanned SVGs could be imported later.
4. **Not yet hand-crafted Insular letter contours.** The live initial glyph relies on local fonts. It is decorated inside but its outer silhouette is not hand-designed for each letter. Custom vector initials are the most significant missing historical feature.
5. **Not a full space-colonization system.** Vines follow planned cubic growth paths with parametric shoots; they are not living trees competing for distributed attractors. This keeps the output editorial and controllable.
6. **Knot domains are still rectangular at the construction grid level.** Knot *overpasses* are real, and some internal structure is glyph-clipped, but genuinely arbitrary-shaped, fully connected interlace domains require deeper graph changes.
7. **No full gradient-map or multiscale bitmap blend stack.** The color variation is sampled and clipped vector pigmentation; it's not Photoshop's full multi-layer blend-mode engine.
8. **No animation or moving text exclusion.** The Illustrator-style SVG export is prioritized over 3D and runtime animation. Pretext or a Canvas text-exclusion engine can be a distinct later interactive experiment.
9. **Other editors may render SVG filters differently.** Browser PNG export captures the browser's appearance; editable SVG keeps the source vectors, live text and filters.
10. **Not an automatic style-matching algorithm.** The current rules produce coherent manuscript-inspired artwork, but they do not guarantee results visually comparable to a hand-painted Book of Kells original. That requires iterative artwork-specific refinements and/or asset libraries.

## Reasonable development priorities after this foundation

- First, create a collection of *authentic* hand-drawn acanthus leaf and terminal motifs and swap them into the growth system at different scales.
- Next, create several custom capital outline families, with knotwork generated to conform to the strokes rather than merely being clipped.
- Extend the mirror-curve grid to arbitrary-shaped, curved or letter-aware domains while preserving proper crossings.
- Add optional geometry-aware multi-ink misregistration and progressive growth animation.
- Only then explore text flow around live-growing ornament, which is a separate interaction problem.
