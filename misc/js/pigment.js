/* Pass 4 — transparent, geometry-clipped printmaking.
   Spectral.js 3 is used when the published library is loaded; deterministic
   Kubelka–Munk RGB approximation is kept for offline use.
   All wash, loss and grain marks are confined to plant silhouettes. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const clamp=M.clamp,n=M.n,V=M.vec;
 const rgb=c=>String(c).replace('#','').match(/../g).map(t=>parseInt(t,16)/255);
 const hex=a=>'#'+a.map(v=>Math.round(clamp(v,0,1)*255).toString(16).padStart(2,'0')).join('');
 const cache=new Map();let wasReady=-1;
 // Material randomness must NEVER consume the growth RNG.
 // A change to wear, pigment, or registration must preserve the plant skeleton.
 function materialRng(s,id){
   let h=2166136261;
   for(const ch of String(id)){ h=Math.imul(h^ch.charCodeAt(0),16777619); }
   return M.rng(M.childSeed((Number(s.seed)>>>0)||1,h>>>0));
 }

 const spectral=()=>globalThis.spectral;
 M.spectralAvailable=()=>!!(spectral()&&typeof spectral().Color==='function'&&typeof spectral().mix==='function');
 M.spectralStatus=()=>M.spectralAvailable()?'spectral.js 3':'local fallback';
 M.verifySpectral=()=>{
   if(!M.spectralAvailable())return {available:false,working:false};
   try{
     const result=spectral().mix([new (spectral().Color)('#002185'),.5],[new (spectral().Color)('#FCD200'),.5]).toString();
     return {available:true,working:/^#[0-9a-f]{6}$/i.test(result),sample:result,referenceMatch:result.toLowerCase()==='#3d933e'};
   }catch(err){return {available:true,working:false,error:String(err)};}
 };
 M.mix=(a,b,t)=>{
   t=clamp(t,0,1);
   if(t<=0)return a;if(t>=1)return b;
   const ready=M.spectralAvailable();
   if(Number(ready)!==wasReady){cache.clear();wasReady=Number(ready);}
   const q=Math.round(t*400)/400,key=`${a}:${b}:${q}`;
   if(cache.has(key))return cache.get(key);
   let col;
   if(ready){
     try{col=spectral().mix([new (spectral().Color)(a),1-q],[new (spectral().Color)(b),q]).toString();}
     catch(err){col=null;}
   }
   if(!col){
     // Per-channel Kubelka–Munk approximation; NOT full spectral reflectance.
     const A=rgb(a),B=rgb(b),K=x=>(1-x)**2/(2*Math.max(.002,x)),R=k=>1+k-Math.sqrt(k*k+2*k);
     col=hex(A.map((x,i)=>R(K(x)*(1-q)+K(B[i])*q)));
   }
   if(cache.size>3600)cache.clear();cache.set(key,col);return col;
 };
 const families=['leaf','blue','red','ochre','black','bark'];
 M.paintFamily=(color,pal)=>{
   const tones={leaf:pal.green,blue:pal.lapis,red:pal.vermillion,ochre:pal.ochre,black:pal.ink,bark:'#765039'};
   const distance=(a,b)=>rgb(a).reduce((v,c,i)=>v+(c-rgb(b)[i])**2,0);
   return families.reduce((best,key)=>distance(color,tones[key])<distance(color,tones[best])?key:best,'leaf');
 };
 M.paintStop=family=>`url(#wash-${family})`;

 // Printed hue sits slightly behind the actual paint. Zero registration = no duplicate.
 M.offsetPrint=(d,color,s,r,{opacity=.18,scale=1}={})=>{
   const strength=clamp(Number(s.registration||0)/100,0,1);
   if(strength<.01)return '';
   const rot=r.between(-Math.PI,Math.PI),m=scale*(.22+strength*3.4)*r.between(.7,1.28);
   return `<path d="${d}" fill="${color}" opacity="${n(opacity*strength*.60)}" transform="translate(${n(Math.cos(rot)*m)} ${n(Math.sin(rot)*m)})"/>`;
 };

 // Shared tone ramps and two frequencies of fine-grained print texture.
 M.pigmentDefs=(s,r)=>{
   const p=s.pal,v=clamp(Number(s.pigment||0)/100,0,1),wear=clamp(Number(s.wear||0)/100,0,1);
   const colors={leaf:p.green,blue:p.lapis,red:p.vermillion,ochre:p.ochre,black:p.ink,bark:'#765039'};
   let defs='';
   for(const [family,base] of Object.entries(colors)){
     const dark=M.mix(base,p.ink,.08+.20*v),mid=M.mix(base,p.ochre,.05+.09*v);
     const light=M.mix(base,p.light,.14+.24*v);
     defs+=`<linearGradient id="wash-${family}" gradientUnits="objectBoundingBox" x1="6%" y1="5%" x2="82%" y2="94%">`+
      `<stop offset="0" stop-color="${light}"/><stop offset=".25" stop-color="${base}"/>`+
      `<stop offset=".58" stop-color="${mid}"/><stop offset=".82" stop-color="${base}"/>`+
      `<stop offset="1" stop-color="${dark}"/></linearGradient>`;
   }
   // The tone wash is chosen by monochrome density: pale -> pigment -> shadow.
   defs+=`<linearGradient id="tone-map" x1="0" y1="0" x2="1" y2="1">`+
      `<stop offset="0" stop-color="${M.mix(p.ochre,p.light,.36)}" stop-opacity=".10"/>`+
      `<stop offset=".48" stop-color="${p.ochre}" stop-opacity=".28"/>`+
      `<stop offset="1" stop-color="${p.ink}" stop-opacity=".17"/></linearGradient>`;
   let flecks='',micro='',scratches='';
   for(let i=0;i<84;i++){
     const x=r.between(0,67),y=r.between(0,61),a=r.between(.15,1.25);
     flecks+=M.circle(x,y,a,i%6?p.ink:p.vermillion,`opacity="${n(r.between(.03,.12))}"`);
   }
   for(let i=0;i<72;i++){
     const x=r.between(0,29),y=r.between(0,31),rr=r.between(.075,.36);
     micro+=M.circle(x,y,rr,p.ink,`opacity="${n(r.between(.04,.13))}"`);
   }
   for(let i=0;i<20;i++){
     const x=r.between(0,53),y=r.between(0,71),size=r.between(.4,3.0);
     scratches+=M.shape(`M${V(x,y)}l${V(size,r.between(-.5,.5))}l${V(-size*.20,.20)}Z`,p.light,`opacity="${n(r.between(.05,.20))}"`);
   }
   defs+=`<pattern id="speckle" patternUnits="userSpaceOnUse" width="67" height="61">${flecks}</pattern>`+
    `<pattern id="micro-grain" patternUnits="userSpaceOnUse" width="29" height="31">${micro}</pattern>`+
    `<pattern id="dry-grain" patternUnits="userSpaceOnUse" width="53" height="71">${scratches}</pattern>`;
   // Noise mask sampled inside each painted region. Stronger wear reduces paint.
   // Convert seeded tonal noise to an alpha field. This is sampled by local
   // masks, so dark/light image areas determine how much of the spectral
   // gradient map shows through each painted surface.
   defs+=`<filter id="tonal-alpha" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">`+
     `<feTurbulence type="fractalNoise" baseFrequency=".06 .085" numOctaves="2" seed="${r.int(1,90000)}" result="n"/>`+
     `<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .22 .65 .13 0 -.12"/>`+
     `<feComponentTransfer><feFuncA type="linear" slope="1.38" intercept=".04"/></feComponentTransfer></filter>`;
   return defs;
 };

 // A local transparent/eroded relief. Note: fill and outline are grouped under
 // the *same* mask, so holes really remove paint rather than adding cream dots.
 function erodeDef(id,bounds,s,r,lightweight=false){
   const wear=clamp(Number(s.wear||0)/100,0,1);
   if(wear<.045)return {id:null,markup:''};
   const area=lightweight?10:20,holes=Math.floor((.2+wear*1.1)*area);
   let loss='';
   for(let i=0;i<holes;i++){
     const x=r.between(bounds.x,bounds.x+bounds.w),y=r.between(bounds.y,bounds.y+bounds.h);
     const rad=r.between(.13,.45+1.5*wear);
     loss+=M.circle(x,y,rad,'black',`opacity="${n(r.between(.25,.74))}"`);
   }
   const mask=`wear-${id}`;
   const defs=`<mask id="${mask}" maskUnits="userSpaceOnUse" x="${n(bounds.x-5)}" y="${n(bounds.y-5)}" width="${n(bounds.w+10)}" height="${n(bounds.h+10)}">`+
     `<rect x="${n(bounds.x-5)}" y="${n(bounds.y-5)}" width="${n(bounds.w+10)}" height="${n(bounds.h+10)}" fill="white"/>${loss}</mask>`;
   return {id:mask,markup:defs};
 }
 M.painted=(id,d,color,bounds,s,r,opts={})=>{
   r=materialRng(s,`paint-${id}`);
   const p=s.pal,texture=clamp(Number(s.pigment||0)/100,0,1),wear=clamp(Number(s.wear||0)/100,0,1);
   const family=opts.bark?'bark':M.paintFamily(color,p);
   const primary=opts.bark?color:M.paintStop(family);
   const overprint=M.offsetPrint(d,opts.bark?M.mix(color,p.ochre,.21):M.mix(color,p.lapis,.18),s,r,{opacity:.18,scale:opts.bark?.45:.7});
   const clip=`pig-${id}`;const erosion=erodeDef(id,bounds,s,r,!!opts.lightweight);
   let out=overprint+`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath>${erosion.markup}</defs>`;
   out+=`<g${erosion.id?` mask="url(#${erosion.id})"`:''}>`;
   out+=M.shape(d,primary,`stroke="${p.ink}" stroke-width="${n(opts.stroke??1.2)}" stroke-linejoin="round"`);
   out+=`<g clip-path="url(#${clip})">`;
   if(opts.bark){
     out+=M.shape(d,M.paintStop('bark'),`opacity="${n(.2+.42*texture)}"`);
   }else{
     const spectralGlaze=M.mix(color,p.ochre,.13+.30*texture);
     const lightGlaze=M.mix(color,p.light,.10+.22*texture);
     const band=()=>`<linearGradient id="glaze-${id}" x1="0" y1="0" x2="1" y2=".92">`+
       `<stop offset="0" stop-color="${lightGlaze}" stop-opacity=".28"/>`+
       `<stop offset=".47" stop-color="${spectralGlaze}" stop-opacity=".35"/>`+
       `<stop offset="1" stop-color="${M.mix(color,p.ink,.18)}" stop-opacity=".13"/></linearGradient>`;
     const tonal=`stem-tone-${id}`;
     const tonalMask=`<mask id="${tonal}" maskUnits="userSpaceOnUse" x="${n(bounds.x-5)}" y="${n(bounds.y-5)}" width="${n(bounds.w+10)}" height="${n(bounds.h+10)}">`+
       `<rect x="${n(bounds.x-5)}" y="${n(bounds.y-5)}" width="${n(bounds.w+10)}" height="${n(bounds.h+10)}" fill="white" filter="url(#tonal-alpha)"/></mask>`;
     out+=`<defs>${band()}${tonalMask}</defs>`+
       `<g mask="url(#${tonal})">${M.shape(d,`url(#glaze-${id})`,`opacity="${n(.15+.76*texture)}"`)}</g>`;
   }
   // Two scales of clamped granulation; no stray squares outside the object.
   if(texture>.015){
     out+=M.shape(d,'url(#speckle)',`opacity="${n(.04+texture*.28)}"`);
     out+=M.shape(d,'url(#micro-grain)',`opacity="${n(.03+texture*.22)}"`);
   }
   if(wear>.03)out+=M.shape(d,'url(#dry-grain)',`opacity="${n(.08+wear*.40)}"`);
   // Sparse pigment-pooling islands have spectral-mixed colors, not random RGB.
   const count=Math.floor((opts.lightweight?5:14)*texture);
   for(let i=0;i<count;i++){
     const x=r.between(bounds.x,bounds.x+bounds.w),y=r.between(bounds.y,bounds.y+bounds.h);
     const rad=r.between(.7,2.4+4*texture),col=M.mix(color,r.choose([p.lapis,p.vermillion,p.ochre]),r.between(.12,.34));
     out+=M.circle(x,y,rad,col,`opacity="${n(r.between(.02,.10)*texture)}"`);
   }
   out+='</g></g>';
   return out;
 };

 // Per-leaf material system; coordinates local to the leaf before SVG rotation.
 // Used for *all* broad botanical leaves (the primary colored artwork).
 M.leafFinish=(id,d,size,color,pal,s,r)=>{
   r=materialRng(s,`leaf-${id}`);
   const texture=clamp(Number(s.pigment||0)/100,0,1),wear=clamp(Number(s.wear||0)/100,0,1);
   const bounds={x:-size*.1,y:-size*.50,w:size*1.2,h:size};
   const clip=`leaf-clip-${id}`,erosion=erodeDef(`leaf-${id}`,bounds,s,r,true);
   const glaze=M.mix(color,pal.ochre,.20+.29*texture),shade=M.mix(color,pal.ink,.10+.26*texture),light=M.mix(color,pal.light,.12+.30*texture);
   const tonal=`tone-${id}`;
   const noiseMask=texture>.08&&size>12 ?
     `<mask id="${tonal}" maskUnits="userSpaceOnUse" x="${n(bounds.x)}" y="${n(bounds.y)}" width="${n(bounds.w)}" height="${n(bounds.h)}">`+
       `<rect x="${n(bounds.x)}" y="${n(bounds.y)}" width="${n(bounds.w)}" height="${n(bounds.h)}" fill="white" filter="url(#tonal-alpha)"/></mask>`:'';
   let defs=`<defs><clipPath id="${clip}"><path d="${d}"/></clipPath>`+
     `<linearGradient id="map-${id}" x1="0" y1="0" x2="1" y2="1">`+
     `<stop offset="0" stop-color="${light}"/><stop offset=".31" stop-color="${color}"/>`+
     `<stop offset=".65" stop-color="${glaze}"/><stop offset="1" stop-color="${shade}"/></linearGradient>`+
     `${noiseMask}${erosion.markup}</defs>`;
   const fillOpacity=n(Math.max(.02,.1+.88*texture));
   const registration=M.offsetPrint(d,M.mix(color,pal.ochre,.30),s,r,{opacity:.25,scale:.76});
   // Unlike a flat fill + cream flecks, eroded regions retain transparency.
   let layers=registration+`<g${erosion.id?` mask="url(#${erosion.id})"`:''}>`;
   layers+=M.shape(d,color,`stroke="${pal.ink}" stroke-width="${n(Math.max(.55,size*.019))}" stroke-linejoin="round"`);
   layers+=`<g clip-path="url(#${clip})">`;
   if(texture>.01){
     const mapped=M.shape(d,`url(#map-${id})`,`opacity="${fillOpacity}"`);
     layers+=noiseMask?`<g mask="url(#${tonal})">${mapped}</g>`:mapped;
     layers+=M.shape(d,'url(#speckle)',`opacity="${n(.04+.22*texture)}"`);
     layers+=M.shape(d,'url(#micro-grain)',`opacity="${n(.03+.18*texture)}"`);
   }
   if(wear>.03)layers+=M.shape(d,'url(#dry-grain)',`opacity="${n(.07+wear*.34)}"`);
   layers+='</g></g>';
   return defs+layers;
 };
})(window.MS);
