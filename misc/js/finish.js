/* Local, non-destructive print impression. All alpha effects remain bounded. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.finishDefs=(s,r)=>{
   const n=M.n,c=M.clamp;
   const wear=c(Number(s.wear||0)/100,0,.45);
   const spread=c(Number(s.spread||0)/100,0,1);
   const warp=c(Number(s.printWarp||0)/100,0,.25);
   const blur=n(.40+.65*spread), radius=n(.70+1.70*spread);
   const displace=n(1.25+2.20*spread+1.3*warp);
   return `<filter id="impression" x="-9%" y="-9%" width="118%" height="118%" color-interpolation-filters="sRGB">`+
       `<feTurbulence type="fractalNoise" baseFrequency=".075 .098" numOctaves="2" seed="${r.int(1,99999)}" result="fiber"/>`+
       `<feDisplacementMap in="SourceGraphic" in2="fiber" scale="${displace}" xChannelSelector="R" yChannelSelector="G" result="drawn"/>`+
       `<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="wet"/>`+
       `<feMorphology in="wet" operator="dilate" radius="${radius}" result="spread"/>`+
       `<feComponentTransfer in="spread" result="hardEdge"><feFuncA type="discrete" tableValues="0 0 0 1 1 1 1 1"/></feComponentTransfer>`+
       `<feComposite in="hardEdge" in2="SourceAlpha" operator="out" result="rim"/>`+
       `<feFlood flood-color="${s.pal.ink}" flood-opacity="${n(.16+.16*spread)}" result="edgeColor"/>`+
       `<feComposite in="edgeColor" in2="rim" operator="in" result="edgeInk"/>`+
       `<feMerge><feMergeNode in="edgeInk"/><feMergeNode in="drawn"/></feMerge></filter>`+
       `<filter id="dry-print" x="-9%" y="-9%" width="118%" height="118%"><feTurbulence type="fractalNoise" baseFrequency=".10" seed="${r.int(1,99998)}" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${n(.35+wear*2)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
 };
})(window.MS);
