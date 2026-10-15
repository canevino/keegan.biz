/* Shared deterministic primitives. No build tools or dependencies. */
window.Ornament = window.Ornament || {};
((O) => {
  'use strict';
  O.W = 1280; O.H = 960;
  O.f = n => Number(n.toFixed(2));
  O.clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  O.esc = text => String(text).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  O.RNG = function(seed) {
    let s=(seed>>>0)||0x9e3779b9;
    const R={next(){s^=s<<13;s^=s>>>17;s^=s<<5;return (s>>>0)/4294967296;}};
    R.n=(a=0,b=1)=>a+(b-a)*R.next();
    R.int=(a,b)=>Math.floor(R.n(a,b+1));
    R.chance=p=>R.next()<p;
    R.pick=arr=>arr[R.int(0,arr.length-1)];
    R.shuffle=arr=>{for(let i=arr.length-1;i>0;i--){let j=R.int(0,i);[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
    R.sign=()=>R.chance(.5)?1:-1;
    return R;
  };
  const paletteList={
    site:['#11110f','#c1272d','#006a44','#fdb913'],
    mineral:['#181712','#ba352a','#2c6250','#234182','#d0aa3d'],
    iron:['#17130f','#5d261e','#a4442c','#b78d3d'],
    electric:['#11110f','#c1272d','#073f7f','#e5c327','#145242'],
    black:['#11110f','#33312c','#141412'],
    red:['#11110f','#c1272d','#b93b30','#e3ad27']
  };
  O.palette=(key,r)=>key==='random'?r.pick(Object.values(paletteList)):paletteList[key]||paletteList.site;
  O.pigment=(a,b,t)=>{
    try {if(window.spectral && window.spectral.Color && window.spectral.mix) {
      return window.spectral.mix([new window.spectral.Color(a),1-t],[new window.spectral.Color(b),t]).toString();
    }} catch(e) {}
    const A=a.replace('#','').match(/../g).map(x=>parseInt(x,16));
    const B=b.replace('#','').match(/../g).map(x=>parseInt(x,16));
    return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');
  };
  O.blob=(x,y,sx,sy,r,count=12)=>{
    const pts=Array.from({length:count},(_,i)=>{const a=i*Math.PI*2/count,k=r.n(.56,1.35);return [x+Math.cos(a)*sx*k,y+Math.sin(a)*sy*k];});
    const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
    let p=m(pts[count-1],pts[0]),d=`M${O.f(p[0])} ${O.f(p[1])}`;
    pts.forEach((a,i)=>{p=m(a,pts[(i+1)%count]);d+=`Q${O.f(a[0])} ${O.f(a[1])} ${O.f(p[0])} ${O.f(p[1])}`;});
    return d+'Z';
  };
  O.path=(d,stroke,width,extra='')=>`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${O.f(width)}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  O.fill=(d,color,extra='')=>`<path d="${d}" fill="${color}" ${extra}/>`;
  O.point=(x,y)=>`${O.f(x)} ${O.f(y)}`;
  O.filters=(s,r)=>{
    const b=s.bleed/100,d=s.damage/100;
    const seed=r.int(1,9999),seed2=r.int(1,9999);
    return `<defs>
      <filter id="ink" x="-38%" y="-40%" width="176%" height="180%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${O.f(.6+2.3*b)}" result="blur"/>
        <feComponentTransfer in="blur" result="cut"><feFuncA type="discrete" tableValues="0 0 0 1 1 1 1 1"/></feComponentTransfer>
        <feMorphology in="cut" operator="dilate" radius="${O.f(.13+1.05*b)}" result="spread"/>
        <feTurbulence type="fractalNoise" baseFrequency="${O.f(.012+.025*d)} ${O.f(.055+.12*d)}" numOctaves="3" seed="${seed}" result="rough"/>
        <feDisplacementMap in="spread" in2="rough" scale="${O.f(1.6+6.8*d)}" xChannelSelector="R" yChannelSelector="G" result="fray"/>
        <feComposite in="SourceGraphic" in2="fray" operator="in" result="body"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${O.f(1+2.7*b)}" result="bleed"/>
        <feComponentTransfer in="bleed" result="wash"><feFuncA type="linear" slope="${O.f(.08+.29*b)}"/></feComponentTransfer>
        <feMerge><feMergeNode in="wash"/><feMergeNode in="body"/></feMerge>
      </filter>
      <filter id="dry" x="-18%" y="-18%" width="136%" height="136%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="${O.f(.013+.04*d)} ${O.f(.07+.11*d)}" numOctaves="3" seed="${seed2}" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="${O.f(1+14*d)}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="grit" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency=".35" numOctaves="2" seed="${seed+27}" result="noise"/>
        <feColorMatrix in="noise" type="saturate" values="0" result="gray"/>
        <feComponentTransfer in="gray" result="texture"><feFuncR type="linear" slope="0.23" intercept="0.77"/><feFuncG type="linear" slope="0.23" intercept="0.77"/><feFuncB type="linear" slope="0.23" intercept="0.77"/></feComponentTransfer>
        <feComposite in="texture" in2="SourceAlpha" operator="in" result="mask"/>
        <feBlend in="SourceGraphic" in2="mask" mode="multiply"/>
      </filter>
      <pattern id="transparent-grid" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="11" height="11" fill="#e5dfcf"/><rect x="11" y="11" width="11" height="11" fill="#e5dfcf"/></pattern>
    </defs>`;
  };
})(window.Ornament);
