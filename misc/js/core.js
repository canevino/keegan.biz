/* Shared drawing primitives; no framework or build step. */
window.Ornament = window.Ornament || {};
((O) => {
  'use strict';
  O.W=880;O.H=1040;
  O.f=n=>Number(n.toFixed(2));
  O.clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  O.esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  O.RNG=(seed)=>{let s=(seed>>>0)||314159;const r={next(){s^=s<<13;s^=s>>>17;s^=s<<5;return(s>>>0)/4294967296}};r.n=(a=0,b=1)=>a+(b-a)*r.next();r.int=(a,b)=>Math.floor(r.n(a,b+1));r.chance=p=>r.next()<p;r.pick=a=>a[r.int(0,a.length-1)];r.sign=()=>r.chance(.5)?1:-1;r.shuffle=a=>{for(let i=a.length-1;i>0;i--){let j=r.int(0,i);[a[i],a[j]]=[a[j],a[i]]}return a};return r};
  O.palettes={
    medieval:['#251c1a','#a73527','#234583','#47704b','#ce9a34','#e8ca73'],
    insular:['#24201b','#8d3027','#456a43','#5c4e86','#c9a342','#eee0b7'],
    site:['#11110f','#c1272d','#006a44','#27508c','#fdb913','#e6d392'],
    monochrome:['#25201a','#49382b','#76624d','#42362c','#c0a57d','#eee0c5'],
  };
  O.palette=(key,r)=>key==='random'?r.pick(Object.values(O.palettes)):O.palettes[key]||O.palettes.medieval;
  O.pigment=(a,b,t)=>{
    if(window.spectral?.Color && window.spectral?.mix){try{return window.spectral.mix([new spectral.Color(a),1-t],[new spectral.Color(b),t]).toString()}catch(e){}}
    let A=a.slice(1).match(/../g).map(h=>parseInt(h,16)),B=b.slice(1).match(/../g).map(h=>parseInt(h,16));
    return '#'+A.map((c,i)=>Math.round(c+(B[i]-c)*t).toString(16).padStart(2,'0')).join('');
  };
  O.path=(d,col,w,extra='')=>`<path d="${d}" fill="none" stroke="${col}" stroke-width="${O.f(w)}" ${extra.includes('stroke-linecap=')?'':'stroke-linecap="round"'} ${extra.includes('stroke-linejoin=')?'':'stroke-linejoin="round"'} ${extra}/>`;
  O.fill=(d,col,extra='')=>`<path d="${d}" fill="${col}" ${extra}/>`;
  O.circle=(x,y,rad,col,extra='')=>`<circle cx="${O.f(x)}" cy="${O.f(y)}" r="${O.f(rad)}" fill="${col}" ${extra}/>`;
  O.rect=(x,y,w,h,col,extra='')=>`<rect x="${O.f(x)}" y="${O.f(y)}" width="${O.f(w)}" height="${O.f(h)}" fill="${col}" ${extra}/>`;
  O.blob=(x,y,sx,sy,r,n=14)=>{let p=Array.from({length:n},(_,i)=>{let a=2*Math.PI*i/n,k=r.n(.72,1.25);return[x+sx*Math.cos(a)*k,y+sy*Math.sin(a)*k]});let m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],st=m(p[n-1],p[0]);return `M${O.f(st[0])} ${O.f(st[1])}`+p.map((a,i)=>{let b=m(a,p[(i+1)%n]);return `Q${O.f(a[0])} ${O.f(a[1])} ${O.f(b[0])} ${O.f(b[1])}`}).join('')+'Z';};
  O.filters=(s,r)=>{let d=s.wear/100,b=s.bleed?1:0,seed=r.int(1,10000);return `<defs>
   <linearGradient id="gilt" x1="0" y1="0" x2=".75" y2="1"><stop stop-color="${s.pal[5]}"/><stop offset=".41" stop-color="${s.pal[4]}"/><stop offset=".73" stop-color="${O.pigment(s.pal[4],s.pal[1],.23)}"/><stop offset="1" stop-color="${s.pal[5]}"/></linearGradient>
   <filter id="ink" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${O.f(.014+.03*d)}" numOctaves="2" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${O.f(.5+4.5*d)}" xChannelSelector="R" yChannelSelector="G"/></filter>
   <filter id="dry" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="2" seed="${seed+17}" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="${O.f(1+5*d)}"/></filter>
   <filter id="blot" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur in="SourceGraphic" stdDeviation="${O.f(b*(.25+1.3*d))}" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   </defs>`};
})(window.Ornament);
