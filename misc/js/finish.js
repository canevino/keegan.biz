/* Insular print finish — continuous vector anatomy with selective plate edges.
   Stems, thin petioles, thorns, and fine veins are NEVER block-processed.
   A restrained square-grain impression sits underneath colored leaf/fruit
   silhouettes; native-resolution ink and outlines remain on top.
   Finished exports and on-page display use the same print plate. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const create=tag=>document.createElementNS(NS,tag);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 M.finishDefs=(s,r)=>{
   const n=M.n,wear=clamp(Number(s.wear||0)/100,0,1);
   return `<filter id="impression" x="-3%" y="-3%" width="106%" height="106%" color-interpolation-filters="sRGB">`+
     `<feTurbulence type="fractalNoise" baseFrequency="${n(.055+.03*wear)} ${n(.08+.05*wear)}" numOctaves="2" seed="${r.int(1,99999)}" result="fiber"/>`+
     `<feDisplacementMap in="SourceGraphic" in2="fiber" scale="${n(.10+1.15*wear)}" xChannelSelector="R" yChannelSelector="G"/></filter>`+
     `<filter id="dry-print" x="-4%" y="-4%" width="108%" height="108%"><feTurbulence type="fractalNoise" baseFrequency="${n(.10+.04*wear)}" seed="${r.int(1,99998)}" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${n(.16+1.5*wear)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
 };
 // Keep the underlying illustration sharp at display/print size. The
 // irregular edges are a separate pigment impression, not a raster effect
 // applied to the drawing itself.
 M.pixelPlateSettings=s=>{
   const wear=clamp(Number((s.wear ?? s.finishLevel ?? 30))/100,0,1);
   return {resolution:2.35,cell:1.0+wear*.08,wear,spread:wear};
 };
 const encode=source=>{
   const clone=source.cloneNode(true);
   clone.setAttribute('xmlns',NS);
   // Render the UNFITTED master sheet. The live art's viewBox is a camera,
   // never a transform baked into the embedded print plate.
   clone.setAttribute('viewBox',`0 0 ${M.W} ${M.H}`);
   clone.setAttribute('width',String(M.W));clone.setAttribute('height',String(M.H));
   clone.removeAttribute('style');
   clone.removeAttribute('class');
   clone.removeAttribute('aria-hidden');
   clone.querySelectorAll('#pixel-print-plate,#construction-guides').forEach(e=>e.remove());
   const art=clone.querySelector('#artwork-layers');
   if(art){art.removeAttribute('display');art.removeAttribute('visibility');}
   // In browser, life stages are hidden by page CSS; exported SVG must match.
   const style=create('style');
   style.textContent='.life-bud,.life-bloom{display:none}';
   clone.insertBefore(style,clone.firstChild);
   return new XMLSerializer().serializeToString(clone);
 };
 // Build a second SVG image containing only broad ink silhouettes.
 // Preserving the original nesting retains every branch transform, clip and
 // species attachment; removing untagged objects excludes thin stems entirely.
 function pigmentOnly(source){
   const clone=source.cloneNode(true);
   clone.setAttribute('viewBox',`0 0 ${M.W} ${M.H}`);
   clone.setAttribute('width',String(M.W));clone.setAttribute('height',String(M.H));
   clone.querySelectorAll('#pixel-print-plate,#construction-guides').forEach(e=>e.remove());
   const art=clone.querySelector('#artwork-layers');
   if(!art)return null;
   art.removeAttribute('display');
   art.removeAttribute('visibility');
   const visit=node=>{
     if(node.nodeType!==1)return false;
     if(node.localName==='defs')return true; // gradient, mask and clip dependencies
     if(node.hasAttribute('data-pixel-pigment')||node.hasAttribute('data-pixel-organ'))return true;
     let hasInk=false;
     for(const child of [...node.children]){
       if(visit(child))hasInk=true;else child.remove();
     }
     return hasInk;
   };
   visit(art);
   // Hide optional seasonal stages, in the same manner as the main artwork.
   const style=create('style');
   style.textContent='.life-bud,.life-bloom{display:none}';
   clone.insertBefore(style,clone.firstChild);
   return new XMLSerializer().serializeToString(clone);
 }
 async function loadSVG(markup){
   const blob=new Blob([markup],{type:'image/svg+xml;charset=utf-8'});
   const url=URL.createObjectURL(blob),img=new Image();
   try{
     await new Promise((res,rej)=>{img.onload=res;img.onerror=()=>rej(Error('Botanical print plate could not be rasterized'));img.src=url;});
     return img;
   }finally{URL.revokeObjectURL(url);}
 }
 // A tiny irregular impression INSIDE leaf/berry pigment, never a glow
 // or outside halo. Square pixels are clipped by the native SVG silhouettes.
 // Every stem, petiole, vein and outline keeps its original vector edges.
 async function contourImpression(source,settings){
   const markup=pigmentOnly(source);
   if(!markup)return null;
   const image=await loadSVG(markup);
   const cell=settings.cell,wear=clamp(Number(settings.wear||0),0,1);
   const w=Math.max(1,Math.round(M.W/cell)),h=Math.max(1,Math.round(M.H/cell));
   const low=document.createElement('canvas');low.width=w;low.height=h;
   const lc=low.getContext('2d',{willReadFrequently:true});
   lc.imageSmoothingEnabled=true;lc.imageSmoothingQuality='high';
   lc.drawImage(image,0,0,w,h);
   const src=lc.getImageData(0,0,w,h).data;
   const edge=lc.createImageData(w,h),out=edge.data;
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
     const k=(y*w+x)*4;if(src[k+3]<150)continue;
     const adjacent=[src[(k-4)+3],src[(k+4)+3],src[(k-w*4)+3],src[(k+w*4)+3]];
     const edgePixel=adjacent.some(v=>v<138);
     const hash=((x*73856093)^(y*19349663))>>>0;
     const skipMod=Math.max(3,Math.round(13-wear*8));
     const scuffMod=Math.max(21,Math.round(58-wear*28));
     const alpha=edgePixel ? (36+wear*72) : (wear>.18 && hash%scuffMod===0 ? 10+wear*30 : 0);
     if(alpha<=0)continue;
     if(edgePixel && hash%skipMod===0)continue;
     out[k]=Math.round(src[k]*(edgePixel?.72:.78));
     out[k+1]=Math.round(src[k+1]*(edgePixel?.68:.74));
     out[k+2]=Math.round(src[k+2]*(edgePixel?.68:.74));
     out[k+3]=Math.round(alpha);
   }
   const cells=document.createElement('canvas');cells.width=w;cells.height=h;
   cells.getContext('2d').putImageData(edge,0,0);
   const rim=document.createElement('canvas');
   rim.width=Math.round(M.W*settings.resolution);rim.height=Math.round(M.H*settings.resolution);
   const ctx=rim.getContext('2d');
   ctx.imageSmoothingEnabled=false;
   ctx.drawImage(cells,0,0,rim.width,rim.height);
   // Clip the impression with the SHARP original silhouette. No effect is
   // permitted in the surrounding transparent area or on branch strokes.
   ctx.globalCompositeOperation='destination-in';
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(image,0,0,rim.width,rim.height);
   ctx.globalCompositeOperation='source-over';
   return rim;
 }
 async function raster(svg,settings,output='data'){
   const [original,edging]=await Promise.all([
     loadSVG(encode(svg)),
     contourImpression(svg,settings)
   ]);
   const W=Number(M.W)||850,H=Number(M.H)||1000;
   const hi=document.createElement('canvas');
   hi.width=Math.round(W*settings.resolution);
   hi.height=Math.round(H*settings.resolution);
   const ctx=hi.getContext('2d');
   if(!ctx)throw Error('Canvas 2D unavailable');
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(original,0,0,hi.width,hi.height);
   if(edging)ctx.drawImage(edging,0,0,hi.width,hi.height);
   return output==='low'?hi:hi.toDataURL('image/png');
 }
 M.applyPixelPlate=async(svg,s)=>{
   if(!svg)return svg;
   const art=svg.querySelector('#artwork-layers');if(!art)return svg;
   svg.querySelector('#pixel-print-plate')?.remove();
   const source=svg.cloneNode(true);
   // This operation must not mutate the SVG before its snapshot succeeds.
   const data=await raster(source,M.pixelPlateSettings(s));
   const plate=create('image');
   plate.id='pixel-print-plate';
   plate.setAttribute('x','0');plate.setAttribute('y','0');
   plate.setAttribute('width',String(M.W));plate.setAttribute('height',String(M.H));
   plate.setAttribute('href',data);plate.setAttribute('preserveAspectRatio','none');
   plate.setAttribute('image-rendering','auto');
   art.setAttribute('display','none');
   // Construction guides remain a separate optional, transparent overlay.
   art.parentNode.insertBefore(plate,art.nextSibling);
   return svg;
 };
})(window.MS);
