/* Pure drawing primitives shared by every generator. */
window.MS = window.MS || {};
((M)=>{
  'use strict';
  M.W = 850; M.H = 1000;
  M.n = v => Number(v.toFixed(2));
  M.clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  M.escape = v => String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));
  M.rng = seed => {
    let x=Number(seed)>>>0 || 672113;
    const rand=()=>{ x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x>>>0)/4294967296; };
    const api={random:rand, between:(a,b)=>a+(b-a)*rand(), int:(a,b)=>Math.floor(a+(b-a+1)*rand()), chance:p=>rand()<p,
      choose:a=>a[Math.min(a.length-1,Math.floor(a.length*rand()))], sign:()=>rand()<.5?-1:1,
      shuffled:a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}};
    api.n=api.between; api.pick=api.choose; api.shuffle=api.shuffled;
    return api;
  };
  M.childSeed=(seed,salt)=>{let x=(Number(seed)>>>0)^salt; x=Math.imul(x^x>>>16,0x7feb352d);x=Math.imul(x^x>>>15,0x846ca68b);return (x^x>>>16)>>>0;};
  M.vec=(x,y)=>`${M.n(x)} ${M.n(y)}`;
  M.move=(x,y)=>`M${M.vec(x,y)}`;
  M.path=(d,color,width=1,extras='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${M.n(width)}" stroke-linecap="round" stroke-linejoin="round" ${extras}/>`;
  M.shape=(d,color,extras='')=>`<path d="${d}" fill="${color}" ${extras}/>`;
  M.circle=(x,y,r,fill,more='')=>`<circle cx="${M.n(x)}" cy="${M.n(y)}" r="${M.n(r)}" fill="${fill}" ${more}/>`;
  M.group=(inner,attrs='')=>`<g ${attrs}>${inner}</g>`;
  M.pt=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
  M.distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
  M.unit=v=>{const l=Math.hypot(v.x,v.y)||1;return {x:v.x/l,y:v.y/l};};
  M.bezier=(a,b,c,d,t)=>{
    const q=1-t;return {x:q*q*q*a.x+3*q*q*t*b.x+3*q*t*t*c.x+t*t*t*d.x,
      y:q*q*q*a.y+3*q*q*t*b.y+3*q*t*t*c.y+t*t*t*d.y};
  };
  M.tangent=(a,b,c,d,t)=>{const q=1-t;return M.unit({x:3*q*q*(b.x-a.x)+6*q*t*(c.x-b.x)+3*t*t*(d.x-c.x),y:3*q*q*(b.y-a.y)+6*q*t*(c.y-b.y)+3*t*t*(d.y-c.y)});};
  M.normal=t=>({x:-t.y,y:t.x});
  M.curveD=(a,b,c,d)=>`M${M.vec(a.x,a.y)}C${M.vec(b.x,b.y)} ${M.vec(c.x,c.y)} ${M.vec(d.x,d.y)}`;
  M.wave=(a,b,c,d,samples=60)=>Array.from({length:samples+1},(_,i)=>{const t=i/samples,p=M.bezier(a,b,c,d,t),tng=M.tangent(a,b,c,d,t);return {...p,tng,t};});
  M.poly=(pts)=>pts.map((p,i)=>`${i?'L':'M'}${M.vec(p.x,p.y)}`).join('')+'Z';
  // Curated historic-pigment harmonies, not a randomly saturated RGB palette.
  // Leaf and wood profiles remain species-specific; these are the shared inks.
  M.palettes={
    kells:{ink:'#352d24',vermillion:'#a64b3e',lapis:'#375a82',green:'#607b57',ochre:'#be9954',light:'#ebdfbb'},
    jewel:{ink:'#302a2b',vermillion:'#ac4050',lapis:'#325e92',green:'#547b70',ochre:'#c29a51',light:'#eee0c7'},
    earth:{ink:'#3c3229',vermillion:'#9b5844',lapis:'#677483',green:'#687b55',ochre:'#b79565',light:'#e8d8c0'},
    site:{ink:'#252322',vermillion:'#c1272d',lapis:'#245c91',green:'#126b4d',ochre:'#dfac3f',light:'#efe3c4'},
    monochrome:{ink:'#2e2924',vermillion:'#675448',lapis:'#6e6962',green:'#747565',ochre:'#ad9d7f',light:'#e7dbbe'}
  };
  M.palette=(id)=>M.palettes[id]||M.palettes.kells;
  // Bounding boxes determine where secondary ornament is allowed to grow.
  M.inBounds=(p,b,pad=0)=>p.x>=b.x+pad&&p.x<=b.x+b.w-pad&&p.y>=b.y+pad&&p.y<=b.y+b.h-pad;
  M.insideEllipse=(p,c,margin=1)=>((p.x-c.x)/(c.rx*margin))**2+((p.y-c.y)/(c.ry*margin))**2 < 1;
})(window.MS);
