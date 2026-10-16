# Pass 3 — material, distortion and printing

## 1. Local ink spreading and gaps (`js/finish.js`)

The `press` SVG filter now draws five passes: (a) slight wobble driven by fractal noise; (b) noise-derived erosion subtracted from the colored illustration with `feComposite operator="out"`; (c) blur of the original alpha; (d) discrete alpha threshold, morphological dilation, and frayed displacement; (e) only the outside of the expanded shape is inked, followed by a merge with the distressed interior. This makes the edge visibly printed without simply blurring it. `print wear` and `ink spread` are separate sliders.

**Limitation:** SVG filters can differ slightly between Chromium, Safari and third-party rasterizers; detail should be judged in the actual browser and exported PNG. Extreme ink spread can merge adjacent details; reduce it for fine work.

## 2. Layered pigment textures and gradient mapping (`js/pigment.js`)

Five reusable gradient maps are generated per artwork from the selected palette. Each contains spectral-mixed stops from pigment + paper + darker concentration. Leaves use family-matched gradient fills, then patterned fine grain and explicit, randomly sized local irregular washes that are clipped to the leaf silhouette. Main stems use a similar masked paint compositor. Small paper-colored flecks and dry-grain patterns create abrasion inside the paint itself, not in the empty canvas.

**Limitation:** This is a vector simulation of irregular printed/painted material. It does not yet use scanned historic paint or parchment textures. There is no background color in the artwork itself.

## 3. Spectral pigment mixing (`js/pigment.js`, `index.html`)

The module calls the real Spectral.js v3 Color API when it is loaded by the pinned CDN script, and caches sampled mixes. On failure it degrades gracefully to a 3-channel Kubelka–Munk approximation. This is not a locally bundled or offline verified copy of the upstream dependency, and the testing environment could not fetch its CDN content. See README for optional local vendoring.

## 4. Misregistration and irregular print (`js/pigment.js`, `js/finish.js`)

Colored impressions of leaves and stem silhouettes may be printed 0–3.7 SVG units away from their dark linework. The registration direction and amount vary per painted element, deterministically from the seed, and the slider can turn the effect off. Dry-printed penwork uses a separate gentler filter. This maintains readability at moderate settings.

## 5. Structural randomness (`js/composition.js`)

Seven selector positions include one randomly chosen structure and six explicit arrangements: single wandering axis; crescent growth; diagonal overgrowth; radiating roots; winding meander; clustered thicket. Each has a different number and placement of stems, distinct Bézier control-point construction, and independent seeded ornament.

**Limitation:** These are still authored procedural grammars, not a formal spatial optimization system. At maximum density some naturally generated foliage can cross other leaves or stems. The work remains botanical-only, as requested.

## What's deliberately not part of this version

Custom initials, Celtic knot grids, manuscript paragraphs, framing, and random letter fragments have been removed. The shared navigation and global styles are unchanged. Future possibilities, if desired: user-drawn growth paths, fine scanned acanthus fragments, and full pixel-based print-grain compositing.
