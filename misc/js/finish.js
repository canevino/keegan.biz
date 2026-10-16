/* Explicit, exportable SVG ink wear: expanded alpha + threshold + frayed edge. */
window.MS=window.MS||{};
((M)=>{
  'use strict';
  M.finishDefs=(s,r)=>{
    const strength=M.clamp(s.wear/100,0,1);
    const blur=M.n(.35+strength*1.7);
    const displacement=M.n(0.4+strength*1.7+M.clamp(s.distortion/100,0,1)*19);
    return `<filter id="press" x="-18%" y="-18%" width="136%" height="136%" color-interpolation-filters="sRGB">
       <feTurbulence type="fractalNoise" baseFrequency=".018 .082" numOctaves="2" seed="${r.int(1,100000)}" result="roughNoise"/>
       <feDisplacementMap in="SourceGraphic" in2="roughNoise" scale="${displacement}" xChannelSelector="R" yChannelSelector="G" result="misprint"/>
       <feGaussianBlur in="SourceAlpha" stdDeviation="${s.bleed?blur:0}" result="blurred"/>
       <feComponentTransfer in="blurred" result="threshold"><feFuncA type="discrete" tableValues="${s.bleed?'0 0 1 1 1 1 1 1':'0 1'}"/></feComponentTransfer>
       <feTurbulence type="fractalNoise" baseFrequency=".115" numOctaves="1" seed="${r.int(1,100000)}" result="edgeNoise"/>
       <feDisplacementMap in="threshold" in2="edgeNoise" scale="${M.n(strength*2.8)}" xChannelSelector="R" yChannelSelector="G" result="edge"/>
       <feFlood flood-color="${s.pal.ink}" flood-opacity="${M.n(s.bleed?.28+.3*strength:0)}" result="edgeColor"/>
       <feComposite in="edgeColor" in2="edge" operator="in" result="spreadingInk"/>
       <feMerge><feMergeNode in="spreadingInk"/><feMergeNode in="misprint"/></feMerge>
     </filter>
     <filter id="dry-print" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
       <feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="2" seed="${r.int(1,100000)}" result="noise"/>
       <feDisplacementMap in="SourceGraphic" in2="noise" scale="${M.n(.4+strength*5+s.distortion*.08)}" xChannelSelector="R" yChannelSelector="G"/>
     </filter>
     <filter id="faint" x="-22%" y="-22%" width="144%" height="144%" color-interpolation-filters="sRGB">
       <feGaussianBlur in="SourceGraphic" stdDeviation="${M.n(.4+strength*.8)}"/>
     </filter>`;
  };
})(window.MS);
