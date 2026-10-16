/* SVG print treatments. Real transparent holes, alpha-based ink expansion,
   variable fraying and a lighter independent filter for fine penwork.
   These effects are serialized into both downloaded SVG and rasterized PNG. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.finishDefs=(s,r)=>{
   const wear=M.clamp((s.wear||0)/100,0,1);
   const spread=s.bleed?M.clamp((s.spread||0)/100,0,1):0;
   const movement=M.clamp((s.distortion||0)/100,0,1);
   const scalar= M.n(.22+movement*7+wear*1.3);
   const blur=M.n(spread*(.55+1.9*wear));
   const dilation=M.n(spread*(.25+1.25*wear));
   const haloOpacity=M.n(spread*(.14+.24*wear));
   // Alpha of loss field is based on brightness of noise; gamma controls how
   // many gaps are removed. Crucially it is composited OUT of the ink, not in.
   const lossSlope=M.n(.14+1.8*wear);
   const lossPower=M.n(4.3+3*(1-wear));
   return `<filter id="press" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
     <feTurbulence type="fractalNoise" baseFrequency="${M.n(.013+.019*movement)} ${M.n(.044+.038*movement)}" numOctaves="2" seed="${r.int(1,99998)}" result="edgeField"/>
     <feDisplacementMap in="SourceGraphic" in2="edgeField" scale="${scalar}" xChannelSelector="R" yChannelSelector="G" result="printed"/>
     <feTurbulence type="fractalNoise" baseFrequency="${M.n(.12+.085*wear)}" numOctaves="2" seed="${r.int(1,99998)}" result="grain"/>
     <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  .333 .333 .333 0 -.15" result="grayLoss"/>
     <feComponentTransfer in="grayLoss" result="loss"><feFuncA type="gamma" amplitude="${lossSlope}" exponent="${lossPower}" offset="0"/></feComponentTransfer>
     <feComposite in="printed" in2="loss" operator="out" result="eroded"/>
     <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="softAlpha"/>
     <feComponentTransfer in="softAlpha" result="firmAlpha"><feFuncA type="discrete" tableValues="0 0 0 1 1 1 1 1"/></feComponentTransfer>
     <feMorphology in="firmAlpha" operator="dilate" radius="${dilation}" result="spreadMask"/>
     <feTurbulence type="fractalNoise" baseFrequency=".095" numOctaves="1" seed="${r.int(1,99998)}" result="edgeGrain"/>
     <feDisplacementMap in="spreadMask" in2="edgeGrain" scale="${M.n(.1+2.6*wear*spread)}" xChannelSelector="R" yChannelSelector="G" result="frayedSpread"/>
     <feComposite in="frayedSpread" in2="SourceAlpha" operator="out" result="onlyOutside"/>
     <feFlood flood-color="${s.pal.ink}" flood-opacity="${haloOpacity}" result="inkColor"/>
     <feComposite in="inkColor" in2="onlyOutside" operator="in" result="edgeInk"/>
     <feMerge><feMergeNode in="edgeInk"/><feMergeNode in="eroded"/></feMerge>
   </filter>
   <filter id="dry-print" x="-16%" y="-16%" width="132%" height="132%" color-interpolation-filters="sRGB">
     <feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="2" seed="${r.int(1,99998)}" result="rough"/>
     <feDisplacementMap in="SourceGraphic" in2="rough" scale="${M.n(.4+wear*2.9+movement*3.8)}" xChannelSelector="R" yChannelSelector="G"/>
   </filter>
   <filter id="faint" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
     <feGaussianBlur in="SourceGraphic" stdDeviation="${M.n(.25+wear*.8)}"/>
   </filter>`;
 };
})(window.MS);
