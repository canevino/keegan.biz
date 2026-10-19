/* Local, non-destructive print impression. All alpha effects remain bounded. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 M.finishDefs=(s,r)=>{
   const n=M.n,c=M.clamp;
   const wear=c(Number(s.wear||0)/100,0,.45);
   const spread=c(Number(s.spread||0)/100,0,1);
   const warp=c(Number(s.printWarp||0)/100,0,.25);
   const blur=n(.40+.65*spread), radius=n(.70+1.70*spread);
   const displace=n(1.25+2.20*spread+1.3*warp);
   return `<filter id="impression" x="-9%" y="-9%" width="118%" height="118%" color-interpolation-filters="sRGB">`+
       `<feTurbulence type="fractalNoise" baseFrequency=".075 .098" numOctaves="2" seed="${r.int(1,99999)}" result="fiber"/>`+
       `<feDisplacementMap in="SourceGraphic" in2="fiber" scale="${displace}" xChannelSelector="R" yChannelSelector="G" result="drawn"/>`+
       `<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="wet"/>`+
       `<feMorphology in="wet" operator="dilate" radius="${radius}" result="spread"/>`+
       `<feComponentTransfer in="spread" result="hardEdge"><feFuncA type="discrete" tableValues="0 0 0 1 1 1 1 1"/></feComponentTransfer>`+
       `<feComposite in="hardEdge" in2="SourceAlpha" operator="out" result="rim"/>`+
       `<feFlood flood-color="${s.pal.ink}" flood-opacity="${n(.16+.16*spread)}" result="edgeColor"/>`+
       `<feComposite in="edgeColor" in2="rim" operator="in" result="edgeInk"/>`+
       `<feMerge><feMergeNode in="edgeInk"/><feMergeNode in="drawn"/></feMerge></filter>`+
       `<filter id="dry-print" x="-9%" y="-9%" width="118%" height="118%"><feTurbulence type="fractalNoise" baseFrequency=".10" seed="${r.int(1,99998)}" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${n(.35+wear*2)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
 };
})(window.MS);


/* Pass 0: pigment-only pixel plate. No new controls or external libraries.
   Rasterization never changes plant geometry. If a browser cannot rasterize
   SVG filters, the untouched vector drawing remains visible and exportable. */
((M)=>{
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const clamp=M.clamp;
 const create=(tag)=>document.createElementNS(NS,tag);
 const graphicTags=new Set(['path','circle','ellipse','rect','polygon','polyline','line','text','use','image']);

 // Parameter mapping is deterministic: no material choices can change growth.
 M.pixelPlateSettings=s=>{
   const wear=clamp(Number(s.finishLevel??0)/100,0,1);
   const random=M.rng(M.childSeed((Number(s.seed)>>>0)||1,0x50A731E));
   return {
     enabled:true,
     lowResScale:Math.round((.56-.30*wear)*1000)/1000,
     offsetX:(random.between(-1,1)*wear*.72).toFixed(3),
     offsetY:(random.between(-1,1)*wear*.72).toFixed(3)
   };
 };

 // In generated organ artwork, preserve the outline as a second vector shape;
 // only the flat petal / berry / nut pigment joins the pixel plate.
 const separateOrgans=(svg)=>{
   const parts=svg.querySelectorAll('.growth-organ .life-final path[fill], .growth-organ .life-final circle[fill], .growth-organ .life-final ellipse[fill]');
   for(const shape of parts){
     const fill=shape.getAttribute('fill');
     if(!fill||fill==='none'||shape.hasAttribute('data-pixel-pigment'))continue;
     const outline=shape.cloneNode(false);
     outline.removeAttribute('id');
     outline.setAttribute('fill','none');
     outline.removeAttribute('data-pixel-pigment');
     // Put the stroke back above the low-resolution pigment plate.
     shape.parentNode.insertBefore(outline,shape.nextSibling);
     shape.setAttribute('stroke','none');
     shape.setAttribute('data-pixel-pigment','1');
   }
 };

 const prunePigment=(node)=>{
   for(const child of [...node.children]){
     if(child.localName==='defs')continue; // gradients, clips and local ink masks
     if(child.hasAttribute('data-pixel-pigment'))continue;
     if(graphicTags.has(child.localName)){
       child.remove();continue;
     }
     prunePigment(child);
     if(!child.querySelector('[data-pixel-pigment]') && child.localName!=='defs')child.remove();
   }
 };

 function isolatedPigment(source){
   const svg=source.cloneNode(true);
   svg.setAttribute('viewBox',`0 0 ${M.W} ${M.H}`);
   svg.setAttribute('width',String(M.W));
   svg.setAttribute('height',String(M.H));
   svg.setAttribute('xmlns',NS);
   for(const child of [...svg.children]){
     if(child.localName==='defs'||child.id==='artwork-layers')continue;
     child.remove();
   }
   const art=svg.querySelector('#artwork-layers');
   if(!art)return null;
   // The impression filter is applied ONCE on the final SVG composite.
   art.removeAttribute('filter');
   prunePigment(art);
   return svg;
 }

 async function rasterPlate(svg,settings){
   const standalone=isolatedPigment(svg);
   if(!standalone)return null;
   const serialized=new XMLSerializer().serializeToString(standalone);
   const blob=new Blob([serialized],{type:'image/svg+xml;charset=utf-8'});
   const url=URL.createObjectURL(blob),im=new Image();
   try{
     await new Promise((resolve,reject)=>{
       im.onload=resolve;
       im.onerror=()=>reject(Error('Browser cannot rasterize isolated pigment'));
       im.src=url;
     });
     const w=Math.max(120,Math.round(M.W*settings.lowResScale));
     const h=Math.max(140,Math.round(M.H*settings.lowResScale));
     const small=document.createElement('canvas');small.width=w;small.height=h;
     const sc=small.getContext('2d',{alpha:true});
     if(!sc)throw Error('2D canvas unavailable');
     sc.clearRect(0,0,w,h);
     sc.drawImage(im,0,0,w,h);
     // Deliberately upscale at nearest neighbour BEFORE embedding, so the
     // stepped pigment survives even when Illustrator smooths placed images.
     const full=document.createElement('canvas');full.width=M.W;full.height=M.H;
     const fc=full.getContext('2d',{alpha:true});
     fc.imageSmoothingEnabled=false;
     fc.drawImage(small,0,0,M.W,M.H);
     return full.toDataURL('image/png');
   } finally {URL.revokeObjectURL(url);}
 }

 M.useVectorPigment=svg=>{
   if(!svg)return;
   const plate=svg.querySelector('#pixel-pigment-plate');
   if(plate)plate.setAttribute('display','none');
   svg.querySelectorAll('[data-pixel-pigment]').forEach(el=>el.removeAttribute('display'));
 };
 M.usePixelPigment=svg=>{
   if(!svg)return;
   const plate=svg.querySelector('#pixel-pigment-plate');
   if(!plate)return;
   // Still a true transparent PNG: no paper-colored rectangle or fill.
   svg.querySelectorAll('[data-pixel-pigment]').forEach(el=>el.setAttribute('display','none'));
   plate.removeAttribute('display');
 };

 M.applyPixelPlate=async(svg,s)=>{
   if(!svg||svg.querySelector('#pixel-pigment-plate'))return svg;
   const art=svg.querySelector('#artwork-layers');
   if(!art)return svg;
   separateOrgans(svg);
   const options=M.pixelPlateSettings(s);
   try{
     const url=await rasterPlate(svg,options);
     if(!url)return svg;
     const image=create('image');
     image.id='pixel-pigment-plate';
     image.setAttribute('x',options.offsetX);
     image.setAttribute('y',options.offsetY);
     image.setAttribute('width',String(M.W));
     image.setAttribute('height',String(M.H));
     image.setAttribute('preserveAspectRatio','none');
     image.setAttribute('image-rendering','pixelated');
     image.setAttribute('href',url);
     // Place under the original dark vectors, twigs and leaf venation.
     art.insertBefore(image,art.firstChild);
     M.usePixelPigment(svg);
   }catch(error){
     console.warn('Pixel plate unavailable; retaining vector paint',error);
   }
   return svg;
 };
})(window.MS);
