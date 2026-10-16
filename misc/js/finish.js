/* Pass 4 — registered print edge, dry ink and local warping.
   The print distortion slider affects only the impression, NOT growth anatomy.
   Grained alpha bleeding is isolated to source edges; foliage interiors retain
   independently masked dry-brush erosion from pigment.js. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.finishDefs=(s,r)=>{
   const c=M.clamp,n=M.n;
   const wear=c(Number(s.wear||0)/100,0,1);
   const spread=c(Number(s.spread||0)/100,0,1);
   const warp=c(Number(s.printWarp||0)/100,0,1);
   const scale=n(warp*3.2 + wear*.24);
   const soft=n(.08+spread*(.42+wear*.42));
   const bleedRadius=n(spread*(.20+.72*wear));
   const loss=n(wear*.39);
   const poolOpacity=n(spread*(.08+.16*wear));
   return `<filter id="press" x="-16%" y="-16%" width="132%" height="132%" color-interpolation-filters="sRGB">`+
     // A long-grain field means low-frequency warped curves + short local damage.
     `<feTurbulence type="fractalNoise" baseFrequency="${n(.020+.016*warp)} ${n(.045+.028*warp)}" numOctaves="2" seed="${r.int(1,99998)}" result="warpField"/>`+
     `<feDisplacementMap in="SourceGraphic" in2="warpField" scale="${scale}" xChannelSelector="R" yChannelSelector="G" result="printed"/>`+
     // Ink spread: expand noisy alpha, then subtract actual original alpha so
     // pooled color deposits on the exterior, not as a uniform blurry halo.
     `<feGaussianBlur in="SourceAlpha" stdDeviation="${soft}" result="alphaBlur"/>`+
     `<feComponentTransfer in="alphaBlur" result="thresholdAlpha"><feFuncA type="discrete" tableValues="0 0 0 1 1 1 1 1"/></feComponentTransfer>`+
     `<feMorphology in="thresholdAlpha" operator="dilate" radius="${bleedRadius}" result="dilated"/>`+
     `<feTurbulence type="fractalNoise" baseFrequency=".12 .17" numOctaves="2" seed="${r.int(1,99998)}" result="bleedNoise"/>`+
     `<feDisplacementMap in="dilated" in2="bleedNoise" scale="${n(spread*(.20+wear*1.9))}" xChannelSelector="R" yChannelSelector="G" result="irregularBleed"/>`+
     `<feComposite in="irregularBleed" in2="SourceAlpha" operator="out" result="edgeOnly"/>`+
     `<feFlood flood-color="${s.pal.ink}" flood-opacity="${poolOpacity}" result="poolPigment"/>`+
     `<feComposite in="poolPigment" in2="edgeOnly" operator="in" result="edgeDeposits"/>`+
     // Patchy pressure is deliberately subtle: large pigment holes are made
     // by masks in pigment.js, so this filter doesn't destroy illustration.
     `<feTurbulence type="fractalNoise" baseFrequency=".23" numOctaves="2" seed="${r.int(1,99998)}" result="pressure"/>`+
     `<feColorMatrix in="pressure" type="saturate" values="0" result="mono"/>`+
     `<feComponentTransfer in="mono" result="missing"><feFuncA type="linear" slope="${n(.05+.52*wear)}" intercept="-${n(.03+.09*wear)}"/></feComponentTransfer>`+
     `<feComposite in="printed" in2="missing" operator="out" result="dryInk"/>`+
     `<feMerge><feMergeNode in="edgeDeposits"/><feMergeNode in="dryInk"/></feMerge></filter>`+
     `<filter id="dry-print" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">`+
     `<feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="2" seed="${r.int(1,99998)}" result="n"/>`+
     `<feDisplacementMap in="SourceGraphic" in2="n" scale="${n(.1+.8*wear+2*warp)}" xChannelSelector="R" yChannelSelector="G"/></filter>`+
     `<filter id="faint" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur in="SourceGraphic" stdDeviation="${n(.16+wear*.6)}"/></filter>`;
 };
})(window.MS);
