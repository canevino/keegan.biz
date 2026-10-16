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
  M.palettes={
    kells:{ink:'#28231d',vermillion:'#ab3829',lapis:'#244479',green:'#5a704a',ochre:'#b48e3e',light:'#e2d5af'},
    jewel:{ink:'#24211d',vermillion:'#bb3f2d',lapis:'#274c93',green:'#557153',ochre:'#bb913b',light:'#e6d9bc'},
    earth:{ink:'#33271f',vermillion:'#904231',lapis:'#516579',green:'#687049',ochre:'#ae8556',light:'#e0d3bd'},
    site:{ink:'#11110f',vermillion:'#c1272d',lapis:'#214b93',green:'#006a44',ochre:'#d4a52d',light:'#e6d49f'},
    monochrome:{ink:'#211d19',vermillion:'#4b3b30',lapis:'#615147',green:'#786b54',ochre:'#a99774',light:'#ddd0ad'}
  };
  M.palette=(id)=>M.palettes[id]||M.palettes.kells;
  // Bounding boxes determine where secondary ornament is allowed to grow.
  M.inBounds=(p,b,pad=0)=>p.x>=b.x+pad&&p.x<=b.x+b.w-pad&&p.y>=b.y+pad&&p.y<=b.y+b.h-pad;
  M.insideEllipse=(p,c,margin=1)=>((p.x-c.x)/(c.rx*margin))**2+((p.y-c.y)/(c.ry*margin))**2 < 1;
})(window.MS);
