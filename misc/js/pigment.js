/* Botanical pigments: Spectral.js 3 pigment mixing, sampled gradient maps,
   shape-clipped layered washes, dry pigment loss, and color registration.
   Spectral.js is loaded before this module from the vendor's published CDN.
   If offline, a lightweight Kubelka–Munk RGB-channel fallback still renders. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const clamp=M.clamp;
 const hexA=c=>c.slice(1).match(/../g).map(v=>parseInt(v,16)/255);
 const hex=a=>'#'+a.map(v=>Math.round(clamp(v,0,1)*255).toString(16).padStart(2,'0')).join('');
 const cache=new Map();
 let cacheReady=-1;
 M.spectralAvailable=()=>!!(window.spectral?.Color&&window.spectral?.mix);
 M.mix=(a,b,t)=>{
   t=clamp(t,0,1);
   if(t<=0)return a;
   if(t>=1)return b;
   const spectralReady=M.spectralAvailable();
   if(Number(spectralReady)!==cacheReady){cache.clear();cacheReady=Number(spectralReady);}
   const q=Math.round(t*500)/500, key=`${a}|${b}|${q}`;
   if(cache.has(key))return cache.get(key);
   let mixed;
   if(spectralReady){
     try{
       mixed=window.spectral.mix([new window.spectral.Color(a),1-q],[new window.spectral.Color(b),q]).toString();
     }catch(err){mixed=null;}
   }
   if(!mixed){
     const A=hexA(a),B=hexA(b),K=x=>(1-x)**2/(2*Math.max(.002,x)),I=k=>1+k-Math.sqrt(k*k+2*k);
     mixed=hex(A.map((v,i)=>I((1-q)*K(v)+q*K(B[i]))));
   }
   if(cache.size>4000)cache.clear();
   cache.set(key,mixed);
   return mixed;
 };
 M.paintFamily=(color,pal)=>{
   const targets={leaf:pal.green,blue:pal.lapis,red:pal.vermillion,ochre:pal.ochre,black:pal.ink,bark:'#765039'};
   const d=(x,y)=>hexA(x).reduce((v,z,i)=>v+(z-hexA(y)[i])**2,0);
   return Object.keys(targets).sort((a,b)=>d(color,targets[a])-d(color,targets[b]))[0];
 };
 M.paintStop=(family)=>`url(#wash-${family})`;
 M.offsetPrint=(d,color,s,r,{opacity=.18,scale=1}={})=>{
   const magnitude=(s.registration||0)/100;
   if(!magnitude)return '';
   const angle=r.between(-Math.PI,Math.PI);
   const shift=scale*magnitude*r.between(.8,3.7),dx=M.n(Math.cos(angle)*shift),dy=M.n(Math.sin(angle)*shift);
   return `<path d="${d}" fill="${color}" opacity="${M.n(opacity*(.35+.65*magnitude))}" transform="translate(${dx} ${dy})"/>`;
 };
 M.pigmentDefs=(s,r)=>{
   const p=s.pal;
   const families={leaf:p.green,blue:p.lapis,red:p.vermillion,ochre:p.ochre,black:p.ink,bark:'#765039'};
   const tone=(base,offset)=>M.mix(base,offset,.12+.30*Math.min(1,s.pigment/100));
   const gradients=Object.entries(families).map(([name,col],i)=>{
     const bottom=tone(col,p.ink),light=tone(col,p.light);
     return `<linearGradient id="wash-${name}" gradientUnits="objectBoundingBox" x1="${i%2?'8%':'4%'}" y1="0%" x2="${i%2?'94%':'75%'}" y2="100%">`+
       `<stop offset="0%" stop-color="${light}"/>`+
       `<stop offset="21%" stop-color="${col}"/>`+
       `<stop offset="54%" stop-color="${M.mix(col,p.ochre,.065)}"/>`+
       `<stop offset="77%" stop-color="${col}"/>`+
       `<stop offset="100%" stop-color="${bottom}"/></linearGradient>`;
   }).join('');
   // Patterns are generated once per seed; no external image assets are needed.
   const speckles=Array.from({length:75},(_,i)=>{
     const x=r.between(0,53),y=r.between(0,47),rad=r.between(.16,1.25);
     return M.circle(x,y,rad,i%5?p.ink:p.vermillion,`opacity="${M.n(r.between(.06,.22))}"`);
   }).join('');
   const scratches=Array.from({length:28},()=>{
     const x=r.between(0,79),y=r.between(0,71),w=r.between(.5,5),h=r.between(.15,1.5);
     return M.shape(`M${M.vec(x,y)}l${M.vec(w,h)}l${M.vec(-w*.36,h*.3)}Z`,p.light,`opacity="${M.n(r.between(.07,.34))}"`);
   }).join('');
   return gradients+
     `<pattern id="speckle" patternUnits="userSpaceOnUse" width="53" height="47">${speckles}</pattern>`+
     `<pattern id="dry-grain" patternUnits="userSpaceOnUse" width="79" height="71">${scratches}</pattern>`;
 };
 M.painted=(id,d,color,bounds,s,r,opts={})=>{
   const p=s.pal,detail=clamp((s.pigment||0)/100,0,1),wear=clamp((s.wear||0)/100,0,1);
   const reg=M.offsetPrint(d,r.choose([p.vermillion,p.lapis,p.ochre]),s,r,{opacity:.34,scale:1});
   const family=opts.bark?'bark':M.paintFamily(color,p);
   let out=reg+`<defs><clipPath id="clip-${id}"><path d="${d}"/></clipPath></defs>`;
   out+=M.shape(d,opts.bark?color:M.paintStop(family),`stroke="${p.ink}" stroke-width="${M.n(opts.stroke??1.4)}" stroke-linejoin="round"`);
   out+=`<g clip-path="url(#clip-${id})">`;
   if(opts.bark)out+=M.shape(d,'url(#wash-bark)',`opacity=".18"`);
   // Short textured washes are clipped to the branch shape, not free-floating.
   const n=opts.lightweight?Math.floor(14+detail*44):Math.floor(20+detail*100);
   const cols=[p.lapis,p.vermillion,p.green,p.ochre,p.light];
   for(let i=0;i<n;i++){
     const x=r.between(bounds.x,bounds.x+bounds.w),y=r.between(bounds.y,bounds.y+bounds.h);
     const rr=r.between(.6,3.6+detail*8),col=r.choose(cols);
     const blot=`M${M.vec(x-rr,y)}q${M.vec(rr*.7,-rr*.85)} ${M.vec(2*rr,.1*rr)}q${M.vec(.28*rr,.8*rr)} ${M.vec(-1.3*rr,rr*.95)}Z`;
     out+=M.shape(blot,col,`opacity="${M.n(r.between(.08,.24)*detail)}"`);
   }
   if(wear>.08){
     for(let i=0;i<Math.floor((opts.lightweight?12:45)*wear);i++){
       const x=r.between(bounds.x,bounds.x+bounds.w),y=r.between(bounds.y,bounds.y+bounds.h);
       out+=M.circle(x,y,r.between(.4,2.7),p.light,`opacity="${M.n(.13+.38*wear)}"`);
     }
   }
   out+=M.shape(d,'url(#speckle)',`opacity="${M.n(.1+detail*.62)}"`);
   out+=M.shape(d,'url(#dry-grain)',`opacity="${M.n(.10+wear*.65)}"`);
   return out+'</g>';
 };
})(window.MS);
