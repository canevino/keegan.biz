keegan.biz /design — v17 baseline
Date: 2026-10-06
Purpose: single reconciled source of truth before checklist-led refinement

UPLOAD / REPLACE
- index.html
- design.css
- design.js

BASELINE INTENT
- Preserve the v14.1 interaction model and the v15/v16 art-direction work.
- Use one custom design-page navigation: keegan.biz scarf + lowercase text links.
- Keep the page editorial and modernist, with controlled dirty-print texture and selective Celtic-revival knotwork.
- Do not restructure the project system unless a specific defect requires it.

RECONCILED IN v17
- Restored the custom one-scarf/text navigation and removed the accidental shared site-nav dependency.
- Restored the full-height knot_long.svg page spine expected by CSS/JS.
- Restored live data-knot-flash ornament markup so the v16 flutter JS actually has targets.
- Removed all pinch_knot and knot_large references from the design-page HTML.
- Preserved the newer v16 project copy for Triennial, Better Angels, and PRX.
- Preserved the v16 Making Public treatment with static social graphics; this leaves 2 explicit flip-card modules, not 3.
- Restored tabindex/role/aria state on the Better Angels paper object so keyboard fold behavior matches the JS.
- Preserved reduced-motion support.

ACTIVE ORNAMENT ASSETS
- /assets/home/knot_long.svg
- /assets/home/knot_smooth_svg1.svg through knot_smooth_svg5.svg

CORE v16/v17 SURFACE ASSETS
- Texturelabs_Paper_226S grey paper pul overlay.jpg
- Texturelabs_Paper_375S printed paper screen.jpg
- Texturelabs_Paper_210S wheatpaste grey overlay.jpg
- Texturelabs_InkPaint_323S grey pastel blended overlay.jpg
- Texturelabs_InkPaint_324S grey brush strokes overlay.jpg
- Texturelabs_Film_185S Vintage daguerreotype film.jpg
- Texturelabs_Concrete_202S grey plaster texture overlay.jpg
- Texturelabs_Paper_360S black paper screen.jpg

NOTE ON LEGACY TEXTURE REFERENCES
The stylesheet still contains a small number of older section-specific Texturelabs references inherited from the working v15 CSS. They are not being removed in this baseline pass because the goal here is reconciliation without visual regression. They can be consolidated later only after live browser review.

STATIC BASELINE AUDIT
- JS syntax: clean
- CSS parse errors: 0
- duplicate HTML ids: 0
- project accordions: 5
- Triennial image switchers: 3
- explicit flip-card modules: 2
- Better Angels folders: 1
- live knot-flash ornaments: 3
- full-height page knot spine: 1
- pinch_knot references in HTML: 0
- knot_large references in HTML: 0
- prefers-reduced-motion: present
- Better Angels folder keyboard target: restored

LOCKED BEHAVIOR
- Five major project accordions begin closed.
- Three Triennial artwork / installed-view switchers retain click/tap/keyboard behavior and desktop hover where CSS supplies it.
- Making Public program and Better Angels flyer use the shared flip-card interaction.
- Better Angels paper object folds by click/tap/keyboard; flip remains separate; visible fold button remains hidden by CSS.
- Mobile layouts must not depend on hover.
- /design/assets paths remain unchanged.
- Ornament on this page is restricted to knot_long.svg and knot_smooth_svg1–5.svg.

NEXT GATE
Use portfolio-design-build-checklist-v17.docx. Start with browser QA at desktop/laptop/tablet/mobile widths, then work project-by-project. Do not mark visual items complete from code inspection alone.
