/* PASS 2 / impression materials
   Botanical geometry is authoritative. All pigment, drybrush, and ink-pooling
   are CLIPPED TO THE SOURCE SILHOUETTE; registration is a separate faint plate.
   Material randomness is independent from structure/seed randomness. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const n=M.n, clamp=M.clamp, vec=M.vec;
 const toRGB=c=>(String(c).replace('#','').match(/../g)||['00','00','00']).map(x=>parseInt(x,16)/255);
 const toHEX=a=>'#'+a.map(x=>Math.round(clamp(x,0,1)*255).toString(16).padStart(2,'0')).join('');
 const cache=new Map();let sourceAvailable=-1;
 function hash(str){let h=2166136261;for(const ch of String(str))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
 function materialRng(s,id){return M.rng(M.childSeed(Number(s.seed)>>>0||1,hash(id)));}
 const spectral=()=>globalThis.spectral;
 M.spectralAvailable=()=>!!(spectral() && typeof spectral().Color==='function' && typeof spectral().mix==='function');
 M.spectralStatus=()=>M.spectralAvailable()?'spectral.js 3':'offline pigment approximation';
 M.verifySpectral=()=>{
   if(!M.spectralAvailable())return {available:false,working:false};
   try{
     const c=spectral().mix([new (spectral().Color)('#002185'),.5],[new (spectral().Color)('#FCD200'),.5]).toString();
     return {available:true,working:/^#[0-9a-f]{6}$/i.test(c),sample:c,referenceMatch:c.toLowerCase()==='#3d933e'};
   }catch(error){return {available:true,working:false,error:String(error)};}
 };
 // Intrinsic pigment mixing with Spectral.js v3 when reachable. Offline fallback
 // is reflectance-based rather than additive RGB; neither path uses Math.random.
 M.mix=(a,b,t)=>{
   t=clamp(t,0,1);
   if(t<=0)return a;if(t>=1)return b;
   const ready=M.spectralAvailable();
   if(Number(ready)!==sourceAvailable){cache.clear();sourceAvailable=Number(ready);}
   const q=Math.round(t*256)/256,key=`${a}|${b}|${q}`;
   if(cache.has(key))return cache.get(key);
   let col=null;
   if(ready){try{col=spectral().mix([new (spectral().Color)(a),1-q],[new (spectral().Color)(b),q]).toString();}catch(_){}}
   if(!col){
     const A=toRGB(a),B=toRGB(b),K=x=>(1-x)**2/(2*Math.max(.003,x)),R=k=>1+k-Math.sqrt(k*k+2*k);
     col=toHEX(A.map((x,i)=>R(K(x)*(1-q)+K(B[i])*q)));
   }
   if(cache.size>4500)cache.clear();cache.set(key,col);return col;
 };
 const P=(x,y)=>({x,y});
 const F=(s,key,def=0)=>clamp(Number(s[key]??def)/100,0,1);
 M.materialStrength=s=>({variation:F(s,'pigment',50),wear:F(s,'wear',20),spread:F(s,'spread',35),registration:F(s,'registration',12)});
 M.paintFamily=(color,pal)=>{
   const tones={leaf:pal.green,blue:pal.lapis,red:pal.vermillion,ochre:pal.ochre,black:pal.ink,bark:'#765039'};
   const a=toRGB(color),delta=k=>toRGB(tones[k]).reduce((z,c,i)=>z+(a[i]-c)**2,0);
   return Object.keys(tones).reduce((best,k)=>delta(k)<delta(best)?k:best,'leaf');
 };
 M.paintStop=k=>`url(#wash-${k})`;
 M.offsetPrint=(d,color,s,r,{opacity=.18,scale=1}={})=>{
   const level=F(s,'registration');if(level<.015)return '';
   const theta=r.between(-Math.PI,Math.PI),dist=scale*(.14+1.85*level)*r.between(.67,1.0);
   // Misregistration is selective, subdued, and never a broad second silhouette.
   return `<path d="${d}" fill="${color}" opacity="${n(opacity*level*.41)}" transform="translate(${n(Math.cos(theta)*dist)} ${n(Math.sin(theta)*dist)})"/>`;
 };
 // Page-scale patterns: separate grain (fine), scratches (directional), and
 // pigment pooling (large). None places color on unpainted background.
 M.pigmentDefs=(s,r)=>{
   const pal=s.pal,colors={leaf:pal.green,blue:pal.lapis,red:pal.vermillion,ochre:pal.ochre,black:pal.ink,bark:'#765039'};
   const {variation,wear,spread}=M.materialStrength(s);
   let z='';
   for(const [key,col] of Object.entries(colors)){
     const light=M.mix(col,pal.light,.12+variation*.19),dark=M.mix(col,pal.ink,.14+variation*.21);
     z+=`<linearGradient id="wash-${key}" x1=".09" y1=".04" x2=".84" y2=".97" objectBoundingBox="true">`+
       `<stop offset="0" stop-color="${light}"/><stop offset=".38" stop-color="${col}"/>`+
       `<stop offset=".71" stop-color="${M.mix(col,pal.ochre,variation*.11)}"/><stop offset="1" stop-color="${dark}"/></linearGradient>`;
   }
   let dust='',chips='',hatches='';
   for(let i=0;i<165;i++){
     const x=r.between(0,57),y=r.between(0,61),rad=r.between(.09,.38);
     dust+=M.circle(x,y,rad,r.chance(.37)?pal.light:pal.ink,`opacity="${n(r.between(.08,.32))}"`);
   }
   for(let i=0;i<35;i++){
     const x=r.between(0,72),y=r.between(0,88),size=r.between(.25,1.75);
     chips+=M.shape(`M${vec(x,y)}l${vec(size*.68,-size*.35)}l${vec(size*.52,size*.29)}l${vec(-size*.79,size*.30)}Z`,pal.light,`opacity="${n(r.between(.22,.48))}"`);
   }
   for(let i=0;i<40;i++){
     const x=r.between(0,45),y=r.between(0,59),length=r.between(.5,3.3);
     hatches+=M.path(`M${vec(x,y)}l${vec(length,r.between(-.5,.5))}`,r.chance(.5)?pal.light:pal.ink,r.between(.14,.38),`opacity="${n(r.between(.15,.40))}"`);
   }
   z+=`<pattern id="micro-grain" patternUnits="userSpaceOnUse" width="57" height="61">${dust}</pattern>`+
      `<pattern id="dry-grain" patternUnits="userSpaceOnUse" width="72" height="88">${chips}</pattern>`+
      `<pattern id="brush-fiber" patternUnits="userSpaceOnUse" width="45" height="59">${hatches}</pattern>`;
   // Diffuse wet ink accumulates inward from a shape's own edge. Keeping this
   // entire filter under an explicit clipPath avoids the previous gray halo.
   z+=`<filter id="pooled-ink" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">`+
      `<feTurbulence type="fractalNoise" baseFrequency=".12 .14" numOctaves="2" seed="${r.int(1,9999)}" result="fibers"/>`+
      `<feDisplacementMap in="SourceGraphic" in2="fibers" scale="${n(.2+spread*.90)}" xChannelSelector="R" yChannelSelector="G"/>`+
      `</filter>`;
   z+=`<filter id="print-fiber" x="-1%" y="-1%" width="102%" height="102%" color-interpolation-filters="sRGB">`+
      `<feTurbulence type="fractalNoise" baseFrequency=".11 .17" numOctaves="2" seed="${r.int(1,9999)}" result="fibers"/>`+
      `<feDisplacementMap in="SourceGraphic" in2="fibers" scale="${n(.06+wear*.36)}" xChannelSelector="R" yChannelSelector="G"/>`+
      `</filter>`;
   return z;
 };
 // Gaps are literal mask transparency, NOT cream-colored flecks. Every region
 // uses a private seeded RNG so varying materials cannot change branching.
 function wornMask(id,bounds,s,r,light=false){
   const wear=F(s,'wear');if(wear<.03)return '';
   const {x,y,w,h}=bounds,pad=3,area=Math.max(1,Math.sqrt(w*h)),count=Math.ceil((light?7:13)*(.23+wear*.64));
   let holes='';
   for(let i=0;i<count;i++){
     const xx=r.between(x,x+w),yy=r.between(y,y+h),rad=r.between(.11,.26+wear*area*.018);
     holes+=M.circle(xx,yy,rad,'#000',`opacity="${n(r.between(.23,.64))}"`);
   }
   return `<mask id="wear-${id}" maskUnits="userSpaceOnUse" x="${n(x-pad)}" y="${n(y-pad)}" width="${n(w+pad*2)}" height="${n(h+pad*2)}">`+
       `<rect x="${n(x-pad)}" y="${n(y-pad)}" width="${n(w+pad*2)}" height="${n(h+pad*2)}" fill="white"/>${holes}</mask>`;
 }
 const boundsOk=b=>b&&[b.x,b.y,b.w,b.h].every(Number.isFinite)&&b.w>0&&b.h>0;
 // Intentionally sparse washes: a larger uneven underpainting and a few
 // darker pools instead of a thousand identical polka-dot 'texture' marks.
 function tonalIslands(bounds,color,pal,s,r,light=false){
   const {variation,spread}=M.materialStrength(s),total=Math.ceil((light?2:4)*variation);
   let z='';
   for(let i=0;i<total;i++){
     const x=r.between(bounds.x,bounds.x+bounds.w),y=r.between(bounds.y,bounds.y+bounds.h);
     const radius=(light?1:2)*r.between(1.8,5.0),a=r.between(0,6.28),p=r.between(.60,1.27);
     const blob=`M${vec(x-radius,y)}C${vec(x-radius*.8,y-radius*p)} ${vec(x+radius*.8,y-radius*.5)} ${vec(x+radius,y)}`+
       `C${vec(x+radius*.7,y+radius*.80)} ${vec(x-radius*.65,y+radius*.9)} ${vec(x-radius,y)}Z`;
     const col=M.mix(color,r.chance(.65)?pal.ink:pal.ochre,r.between(.11,.27));
     z+=M.shape(blob,col,`opacity="${n(r.between(.11,.25)*variation)}" transform="rotate(${n(a*57.2958)} ${n(x)} ${n(y)})"`);
   }
   return z;
 }
 function pooledContour(d,id,pal,s,r,clipId,bark=false){
   const spread=F(s,'spread');if(spread<.025)return '';
   // Entirely INSIDE the illustrated edge; no external gray silhouette.
   const col=bark?M.mix('#765039',pal.ink,.43):M.mix(pal.green,pal.ink,.48);
   return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${n((bark?.55:.62)+spread*(bark?1.05:1.15))}"`+
      ` stroke-linejoin="round" opacity="${n(.13+.34*spread)}" clip-path="url(#${clipId})" filter="url(#pooled-ink)"/>`;
 }
 M.painted=(id,d,color,bounds,s,unused,opts={})=>{
   if(!boundsOk(bounds))return M.shape(d,color);
   const r=materialRng(s,`bark-${id}`),pal=s.pal,{variation,wear,spread}=M.materialStrength(s);
   const clip=`paint-clip-${id}`,mask=wornMask(id,bounds,s,r,!!opts.lightweight);
   const maskRef=mask?` mask="url(#wear-${id})"`:'';
   const low=M.mix(color,pal.light,.12+variation*.10),high=M.mix(color,pal.ink,.17+variation*.14);
   const grad=`paint-wash-${id}`;
   let out=M.offsetPrint(d,M.mix(color,pal.ochre,.20),s,r,{opacity:.18,scale:.43});
   out+=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath>${mask}`+
     `<linearGradient id="${grad}" x1="0%" y1="0%" x2="100%" y2="78%">`+
     `<stop stop-color="${low}" offset="0"/><stop stop-color="${color}" offset=".38"/>`+
     `<stop stop-color="${high}" offset="1"/></linearGradient></defs>`;
   out+=`<g${maskRef}>${M.shape(d,`url(#${grad})`,`stroke="${M.mix(color,pal.ink,.50)}" stroke-width="${n(opts.stroke??.6)}" stroke-linejoin="round"`)}`;
   out+=`<g clip-path="url(#${clip})">`;
   out+=M.shape(d,'url(#micro-grain)',`opacity="${n(.13+variation*.26)}"`);
   out+=M.shape(d,'url(#brush-fiber)',`opacity="${n(.14+wear*.27)}"`);
   if(wear>.03)out+=M.shape(d,'url(#dry-grain)',`opacity="${n(.08+wear*.55)}"`);
   out+=tonalIslands(bounds,color,pal,s,r,true);
   out+=pooledContour(d,id,pal,s,r,clip,true);
   out+='</g></g>';
   return out;
 };
 M.leafFinish=(id,d,size,color,pal,s,unused)=>{
   const r=materialRng(s,`leaf-${id}`),{variation,wear,spread}=M.materialStrength(s);
   const bounds={x:-size*.06,y:-size*.52,w:size*1.13,h:size*1.04};
   const clip=`leaf-clip-${id}`,mask=wornMask(`leaf-${id}`,bounds,s,r,true),maskRef=mask?` mask="url(#wear-leaf-${id})"`:'';
   const grad=`leaf-wash-${id}`;
   const pale=M.mix(color,pal.light,.24+.26*variation),deep=M.mix(color,pal.ink,.16+.29*variation),mid=M.mix(color,pal.ochre,.08+.17*variation);
   const angle=n(r.between(-12,12));
   let out=M.offsetPrint(d,M.mix(color,pal.ochre,.30),s,r,{opacity:.15,scale:.55});
   out+=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath>${mask}`+
       `<linearGradient id="${grad}" x1="0%" y1="0%" x2="96%" y2="100%" gradientTransform="rotate(${angle} .5 .5)">`+
       `<stop offset="0" stop-color="${pale}"/><stop offset=".24" stop-color="${color}"/>`+
       `<stop offset=".64" stop-color="${mid}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>`;
   out+=`<g${maskRef}>`;
   out+=M.shape(d,`url(#${grad})`,'data-pixel-pigment="1"');
   out+=`<g clip-path="url(#${clip})">`;
   // Full-size tonal marks, small side-by-side pigment irregularities and
   // interrupted brush marks—not a low-res pixel effect over the whole leaf.
   // Hand-laid pigment islands follow the midrib; patches actually land on
   // the leaf rather than disappearing outside the tiny bounding rectangle.
   if(size>11){
     const ink=M.mix(color,pal.ink,.28),mineral=M.mix(color,pal.ochre,.44);
     const blotches=3+Math.floor(variation*3);
     for(let i=0;i<blotches;i++){
       const x=size*r.between(.16,.83),y=size*r.between(-.055,.055);
       const rx=size*r.between(.085,.19),ry=size*r.between(.035,.085);
       const d2=`M${vec(x-rx,y)}Q${vec(x-rx*.7,y-ry)} ${vec(x+rx*.28,y-ry*.56)}Q${vec(x+rx*1.1,y)} ${vec(x+rx*.43,y+ry*.72)}Q${vec(x-rx*.75,y+ry)} ${vec(x-rx,y)}Z`;
       out+=M.shape(d2,i%3===0?mineral:ink,`opacity="${n((i%3===0?.30:.22)*(.44+1.0*variation))}"`);
     }
     if(wear>.13){
       for(let i=0;i<5+Math.floor(wear*7);i++){
         const x=size*r.between(.11,.88),y=size*r.between(-.12,.12);
         const x2=x+size*r.between(.016,.09);
         out+=M.path(`M${vec(x,y)}L${vec(x2,y+r.between(-.7,.7))}`,pal.light,
           r.between(.15,.42),`opacity="${n(.22+.35*wear)}"`);
       }
     }
   }
   out+=M.shape(d,'url(#micro-grain)' ,`opacity="${n(.18+.36*variation)}" data-pixel-pigment="1"`);
   out+=M.shape(d,'url(#brush-fiber)',`opacity="${n(.16+.40*wear)}" data-pixel-pigment="1"`);
   out+=M.shape(d,'url(#dry-grain)',`opacity="${n(.14+.46*wear)}" data-pixel-pigment="1"`);
   out+=pooledContour(d,id,pal,s,r,clip,false);
   out+='</g>';
   // The outline is hand-inked, but subtle; at high wear break up pigment
   // BELOW the contour without making the drawing itself disappear.
   out+=M.shape(d,'none',`stroke="${M.mix(pal.ink,color,.12)}" stroke-width="${n(Math.max(.50,size*.018))}" stroke-linejoin="round"`);
   out+='</g>';
   return out;
 };
})(window.MS);
