keegan.biz /design — v18 system cleanup + Triennial art-direction pass
Date: 2026-10-06
Base: v17 reconciled baseline

UPLOAD / REPLACE
- index.html
- design.css
- design.js

PURPOSE OF THIS PASS
v18 does not attempt to solve every project at once. It fixes the global visual-system problems visible in the first browser review, then tightens the Triennial case study so we have a cleaner standard to use when art-directing Better Angels, Paul Winter, PRX/Radiotopia, and Trinity FM.

CHECK IN THIS VERSION
1. DISPLAY TYPE
- No browser-style drop shadows behind large type.
- Printed texture remains inside the letters, but dimensional shadow is removed.
- Project title is always “Triennial 2025: The Exchange.”

2. KNOTS
- Smooth SVG knots no longer stretch, skew, rotate, or distort in place.
- Glitch behavior now comes from rapid swaps between the five drawings plus restrained color/ink flicker.
- Long knot spine is quieter, narrower, registered to the edge, and no longer aggressively skewed/stretched/overprinted.
- Check whether the long spine feels intentional rather than broken. If not, it will be reduced further or rebuilt as a repeated print element.

3. TEXTURE SYSTEM
- Grey Texturelabs material is treated as a low-opacity multiply overlay on the paper, not as opaque grey UI panels.
- Local plates should feel related to the same physical stock.
- No decorative drop shadows on portfolio assets.
- Ink-bleed texture around type/ornament edges is NOT finished; it is explicitly queued as a dedicated pass rather than simulated with shadows.

4. ALIGNMENT / CROPPING
- Shared modules are top-aligned.
- Wide Triennial installed imagery now uses a landscape stage instead of being forced into the portrait ratio.
- Artwork uses top registration and contain where cropping would damage the source shape.
- This is the beginning of the crop audit, not the final project-by-project crop pass.

5. TRIENNIAL EXTENSIONS
- Public Processes is one interactive object: one poster shown at a time, flipping on hover/click/keyboard.
- Making Public social graphics are again one flip pair rather than two unrelated static squares.
- Making Public event photography remains visible separately.
- Triennial summary collage has been rebalanced into a top-registered specimen board with one dominant campaign object.

STATIC QA
- 5 project accordions
- 3 Triennial artwork/installed-view switchers
- 4 flip cards total (Making Public program, Making Public social, Public Processes, Better Angels flyer)
- 1 Better Angels folder
- 3 knot-flash ornaments
- 1 long knot spine
- 0 duplicate HTML ids
- design.js syntax clean
- reduced-motion logic retained

INTENTIONALLY NOT SOLVED IN v18
These are now explicit checklist items rather than being half-fixed in the same pass:
- true ink-bleed / misregistration texture treatment
- complete key-image re-selection and crop audit for every project
- complete Better Angels fold-object rebuild
- Better Angels signage inventory/layout including both artwork/specimen and installed views
- Better Angels cohesion pass across takeaway, whistle/script, signage, and activation
- Paul Winter poster-suite art direction
- PRX / Radiotopia hierarchy and cleanup
- Trinity FM hierarchy and art direction
- final mobile/tablet pass

WORKING RULE
Use v18 as the visual-system checkpoint. Review the items above first. Once the global texture/knot/alignment behavior feels right, continue project-by-project rather than applying another whole-page redesign.
