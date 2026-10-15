/* Shared drawing primitives; no framework or build step. */
window.Ornament = window.Ornament || {};
((O) => {
  'use strict';
  O.W = 880;
  O.H = 1040;
  O.f = n => Number(n.toFixed(2));
  O.clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  O.esc = s => String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  O.RNG = (seed) => {
    let s = (seed >>> 0) || 314159;
    const r = { next(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; } };
    r.n = (a=0,b=1) => a + (b-a) * r.next();
    r.int = (a,b) => Math.floor(r.n(a,b+1));
    r.chance = p => r.next() < p;
    r.pick = a => a[r.int(0,a.length-1)];
    r.sign = () => r.chance(.5) ? 1 : -1;
    r.shuffle = a => { for(let i=a.length-1;i>0;i--){ let j=r.int(0,i); [a[i],a[j]]=[a[j],a[i]]; } return a; };
    return r;
  };
  O.palettes = {
    medieval:['#251c1a','#b03927','#21468d','#4e7447','#c69432','#eee0ba'],
    insular:['#24201b','#8d3027','#456a43','#5c4e86','#c9a342','#eee0b7'],
    site:['#11110f','#c1272d','#006a44','#27508c','#fdb913','#e6d392'],
    monochrome:['#25201a','#49382b','#76624d','#42362c','#c0a57d','#eee0c5'],
  };
  O.palette = (key,r) => key === 'random' ? r.pick(Object.values(O.palettes)) : (O.palettes[key] || O.palettes.medieval);
  O.pigment = (a,b,t) => {
    let A = a.slice(1).match(/../g).map(h => parseInt(h,16));
    let B = b.slice(1).match(/../g).map(h => parseInt(h,16));
    return '#'+A.map((c,i)=>Math.round(c+(B[i]-c)*t).toString(16).padStart(2,'0')).join('');
  };
  O.path = (d,col,w,extra='') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${O.f(w)}" ${extra.includes('stroke-linecap=')?'':'stroke-linecap="round"'} ${extra.includes('stroke-linejoin=')?'':'stroke-linejoin="round"'} ${extra}/>`;
  O.fill = (d,col,extra='') => `<path d="${d}" fill="${col}" ${extra}/>`;
  O.circle = (x,y,rad,col,extra='') => `<circle cx="${O.f(x)}" cy="${O.f(y)}" r="${O.f(rad)}" fill="${col}" ${extra}/>`;
  O.rect = (x,y,w,h,col,extra='') => `<rect x="${O.f(x)}" y="${O.f(y)}" width="${O.f(w)}" height="${O.f(h)}" fill="${col}" ${extra}/>`;
  O.blob = (x,y,sx,sy,r,n=14) => {
    let p = Array.from({length:n},(_,i)=>{ let a = 2*Math.PI*i/n, k = r.n(.72,1.25); return [x+sx*Math.cos(a)*k, y+sy*Math.sin(a)*k]; });
    let m = (a,b) => [(a[0]+b[0])/2,(a[1]+b[1])/2], st = m(p[n-1],p[0]);
    return `M${O.f(st[0])} ${O.f(st[1])}` + p.map((a,i)=>{ let b=m(a,p[(i+1)%n]); return `Q${O.f(a[0])} ${O.f(a[1])} ${O.f(b[0])} ${O.f(b[1])}`; }).join('') + 'Z';
  };
  O.filters = (s,r) => {
    const d = s.wear/100;
    const b = s.bleed ? 1 : 0;
    const seed = r.int(1,9999);
    const alphaTable = b ? '0 0 0 1 1 1 1 1' : '0 1 1 1';
    const blur = b ? O.f(.45 + 1.7*d) : 0;
    const halo = b ? O.f(.65 + 2.2*d) : 0;
    return `<defs>
      <linearGradient id="gilt" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${O.pigment(s.pal[4],s.pal[5],.48)}"/>
        <stop offset="0.55" stop-color="${O.pigment(s.pal[4],s.pal[0],.16)}"/>
        <stop offset="1" stop-color="${O.pigment(s.pal[5],s.pal[4],.22)}"/>
      </linearGradient>
      <filter id="ink" x="-38%" y="-38%" width="176%" height="176%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="soft"/>
        <feComponentTransfer in="soft" result="threshold"><feFuncA type="discrete" tableValues="${alphaTable}"/></feComponentTransfer>
        <feMorphology in="threshold" operator="dilate" radius="${O.f(.15 + .9*d*b)}" result="spread"/>
        <feTurbulence type="fractalNoise" baseFrequency="${O.f(.012 + .03*d)} ${O.f(.08 + .12*d)}" numOctaves="2" seed="${seed}" result="noise"/>
        <feDisplacementMap in="spread" in2="noise" scale="${O.f(.3 + 4*d)}" xChannelSelector="R" yChannelSelector="G" result="fray"/>
        <feComposite in="SourceGraphic" in2="fray" operator="in" result="core"/>
        <feGaussianBlur in="SourceGraphic" stdDeviation="${halo}" result="halo"/>
        <feComponentTransfer in="halo" result="faded"><feFuncA type="linear" slope="${O.f(.07 + .19*b)}"/></feComponentTransfer>
        <feMerge><feMergeNode in="faded"/><feMergeNode in="core"/></feMerge>
      </filter>
      <filter id="rough" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
        <feTurbulence baseFrequency="${O.f(.015 + .03*d)}" numOctaves="2" seed="${seed+17}" type="fractalNoise" result="n"/>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="${O.f(.6 + 5*d)}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="dry" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">
        <feTurbulence baseFrequency=".065" numOctaves="2" seed="${seed+31}" type="fractalNoise" result="grain"/>
        <feDisplacementMap in="SourceGraphic" in2="grain" scale="${O.f(1 + 6*d)}" xChannelSelector="R" yChannelSelector="G"/>
      </filter>
      <filter id="grain" x="-18%" y="-18%" width="136%" height="136%" color-interpolation-filters="sRGB">
        <feTurbulence baseFrequency=".34" numOctaves="2" seed="${seed+61}" type="fractalNoise" result="n"/>
        <feColorMatrix in="n" type="saturate" values="0" result="mono"/>
        <feComponentTransfer in="mono" result="faint"><feFuncA type="linear" slope="0.14"/></feComponentTransfer>
        <feComposite in="faint" in2="SourceAlpha" operator="in" result="grainInside"/>
        <feBlend in="SourceGraphic" in2="grainInside" mode="multiply"/>
      </filter>
    </defs>`;
  };
})(window.Ornament);
