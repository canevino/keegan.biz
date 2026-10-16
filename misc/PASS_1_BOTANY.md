# Pass 1 — Botanical drawing (v9)

This pass changes the botanical artwork only. The website structure, scarf navigation, layout, existing modes, initials, knot algorithm, ink/pigment filters, controls, seed handling and exports are unchanged from v8. No files in `/assets/` are included or modified.

## Changed code

`misc/js/botany.js` has been rewritten. Its public entry point remains:

```js
MS.botanical(plan, settings, seededRandom)
```

It receives the same inputs as v8 and returns a self-contained SVG markup string. The existing `render.js` therefore needs no modification.

## A. Primary stems and growth

`organicSpine(stem, rng)` begins with the scene planner's cubic Bézier. It adds low-frequency, endpoint-preserving lateral movement and **recalculates the tangents from the displaced points**. This prevents a visually rigid straight pole while ensuring the leaves still follow the drawn path.

`stemOutline(samples, rootWidth, tipWidth)` samples the centerline's local normal at each point and produces a closed, filled SVG silhouette from its left and right edges.

The approximate thickness relationship is:

```
width(t) = tipWidth + (rootWidth - tipWidth) * (1 - t)^1.18
```

The roots remain comparatively broad; branches end thin. Subtle irregularity modulates width without making the geometry look broken. A broad acanthus at each base helps conceal a mechanically cut starting point.

## B. A branching hierarchy, rather than leaf scatter

Every main stem has spaced primary-branch attachment points. Each primary branch begins in the current stem's tangent direction and gradually turns outward as a curved Bézier. Short secondary twigs emerge from some primary branches, but **the branching recursion is intentionally capped**. This prevents exponential overgrowth and keeps the page responsive.

The branches are checked against the composition's bounding box and a protected focal ellipse. Growth near the central letter is shortened or skipped. Selective overlaps are still expected: medieval ornament is not a diagram of nonintersecting objects.

## C. Leaf drawing

Each leaf is constructed in local coordinates from its petiole toward +X. Its final rotation is applied once using the attachment curve's tangent. Four shapes are used:

- acanthus: deep, asymmetric cut lobes, nested over/under scallops
- miniature acanthus: smaller, less extreme lobes
- lanceolate: long, gently asymmetrical leaves
- trumpet: broad flaring ornamental foliage

Large leaves have engraved midribs, secondary veins, occasional scratches, muted pigment speckles and thin contour strokes. Small folioles get lighter treatment to keep generated SVGs practical to render. Color is assigned from the existing manuscript palettes, with earthy greens predominating and selective lapis and vermilion.

## D. Fine penwork and terminal treatment

`stemDetails` adds a pale longitudinal highlight and occasional short scar-like engraving marks. `terminalScroll` produces a tapered scrolling tendril attached directly to the end of a branch; `berryRosette` and `bud` supply less frequent organic terminals.

Fine details are controlled by the existing **Small details** slider; the **Foliage** slider changes the primary and secondary branching and number of leaves. Both remain deterministic for a given seed.

## E. Performance safeguards

- One SVG print filter is applied to each main plant grouping, rather than to every leaf.
- No unbounded recursion; a primary shoot can grow at most one secondary twig.
- Unique clips are allocated only for larger leaf bodies, not every small foliole.
- Branch tips are tested against the page bounds and central protected region.
- All randomness comes from the seeded stream passed by the existing render compositor.
- Every generated mark is vector artwork; no external images, library downloads or new network calls are added.

## F. Testing

- JavaScript syntax check for `botany.js`.
- Determinism and invalid-number smoke tests: 216 combinations of mode, seed, foliage level and detail level.
- Parsed the nine representative SVG outputs as XML.
- Rendered a 3×3 reference contact sheet using CairoSVG for visual inspection.
- **Browser-based interaction/regression testing was unavailable in this session**: local HTTP and file URLs were blocked by the browser test environment. The webpage, controls and exports are unchanged from the previously browser-tested v8; this does not count as a new browser verification.

## G. Boundaries of this pass

This is **Pass 1**, not a full historical recreation. It improves structural botany, leaf anatomy, taper, scrolls and penwork. It does not change the font-derived decorated initial, the underlying rectangular knot algorithm, overall composition grammar, spectral pigment integration or the print filters. Those remain for Passes 2 and 3.

### Installation

For the smallest possible update, replace only:

`/misc/js/botany.js`

Or upload the complete v9 `/misc/` folder to replace the v8 version, preserving existing `/assets/` files.
