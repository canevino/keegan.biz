/* Pass B — native vector printmaking finish.
   The earlier embedded canvas plate softened the whole drawing and made SVG
   exports effectively raster images. Pigment wear now lives in the SVG paths,
   and all stems, hatchwork, veins and export paths remain editable vectors. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const n=M.n,clamp=M.clamp;
 M.finishDefs=(s,r)=>{
   const wear=clamp(Number(s.wear||0)/100,0,1);
   const seed=r.int(1,99999);
   // Only sparse added penwork is textured; the botanical silhouettes stay native vectors.
   return `<filter id="dry-print" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB">`+
      `<feTurbulence type="fractalNoise" baseFrequency=".15 .21" numOctaves="2" seed="${seed+11}" result="fiber"/>`+
      `<feDisplacementMap in="SourceGraphic" in2="fiber" scale="${n(.08+.36*wear)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
 };
})(window.MS);
