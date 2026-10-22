/* Insular print finish — continuous vector anatomy with selective plate edges.
   Stems, thin petioles, thorns, and fine veins are NEVER block-processed.
   A restrained square-grain impression sits underneath colored leaf/fruit
   silhouettes; native-resolution ink and outlines remain on top.
   Finished export and animated growth use the identical paint plate. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 const create=tag=>document.createElementNS(NS,tag);
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 M.finishDefs=(s,r)=>{
   const n=M.n,wear=clamp(Number(s.wear||0)/100,0,1);
   return `<filter id="impression" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB">`+
     `<feTurbulence type="fractalNoise" baseFrequency=".065 .09" numOctaves="2" seed="${r.int(1,99999)}" result="fiber"/>`+
     `<feDisplacementMap in="SourceGraphic" in2="fiber" scale="${n(.10+.38*wear)}" xChannelSelector="R" yChannelSelector="G"/></filter>`+
     `<filter id="dry-print" x="-3%" y="-3%" width="106%" height="106%"><feTurbulence type="fractalNoise" baseFrequency=".11" seed="${r.int(1,99998)}" numOctaves="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${n(.12+wear*.42)}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
 };
 // Keep the underlying illustration sharp at display/print size. The
 // irregular edges are a separate pigment impression, not a raster effect
 // applied to the drawing itself.
 M.pixelPlateSettings=s=>({resolution:2,cell:1.00+clamp(Number(s.finishLevel??30)/100,0,1)*.15});
 const encode=source=>{
   const clone=source.cloneNode(true);
   clone.setAttribute('xmlns',NS);
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
   const cell=settings.cell, w=Math.max(1,Math.round(M.W/cell)),h=Math.max(1,Math.round(M.H/cell));
   const low=document.createElement('canvas');low.width=w;low.height=h;
   const lc=low.getContext('2d',{willReadFrequently:true});
   lc.imageSmoothingEnabled=true;lc.imageSmoothingQuality='high';
   lc.drawImage(image,0,0,w,h);
   const src=lc.getImageData(0,0,w,h).data;
   const edge=lc.createImageData(w,h),out=edge.data;
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
     const k=(y*w+x)*4;if(src[k+3]<160)continue;
     const adjacent=[(k-4)+3,(k+4)+3,(k-w*4)+3,(k+w*4)+3];
     if(!adjacent.some(i=>src[i]<140))continue;
     const hash=((x*73856093)^(y*19349663))>>>0;
     if(hash%11===0)continue; // small localized ink skips
     out[k]=Math.round(src[k]*.73);
     out[k+1]=Math.round(src[k+1]*.70);
     out[k+2]=Math.round(src[k+2]*.70);
     out[k+3]=57;
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
 M.useVectorPigment=svg=>{
   if(!svg)return;
   svg.querySelector('#pixel-print-plate')?.setAttribute('display','none');
   svg.querySelector('#artwork-layers')?.removeAttribute('display');
 };
 M.usePixelPigment=svg=>{
   if(!svg)return;
   svg.querySelector('#artwork-layers')?.setAttribute('display','none');
   svg.querySelector('#pixel-print-plate')?.removeAttribute('display');
 };
 // Prepare the finished print plate once; reveal it with moving botanical
 // masks. Never re-rasterize the entire SVG for each animation frame.
 let live=null;
 const ease=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
 const q=(node,k,fallback=0)=>{const val=Number(node.getAttribute(k));return Number.isFinite(val)?val:fallback;};
 const pair=(node,k)=>{const bits=(node.getAttribute(k)||'').split(/[ ,]+/).map(Number);return bits.length>1&&bits.every(Number.isFinite)?bits:[M.W/2,M.H/2];};
 function stop(){
   const r=live;if(!r)return;live=null;r.stopped=true;
   cancelAnimationFrame(r.raf);r.canvas.remove();
   if(r.svg.isConnected)r.svg.style.visibility='';
 }
 function setupObjects(svg){
   const phases=new Map(),axes=[],leaves=[],organs=[];
   let duration=0;
   const plants=[...svg.querySelectorAll('.growth-plant')];
   plants.forEach((plant,i)=>{
     const primary=plant.querySelector(':scope > .growth-primary');
     if(!primary)return;
     const phase={start:i*360,duration:plant.dataset.trunk==='fern'?3000:3350};
     phases.set(plant,phase);duration=Math.max(duration,phase.start+phase.duration);
     axes.push({node:primary,phase,width:Math.max(11,q(primary,'data-grow-width',18)*1.4)});
   });
   const shoots=[...svg.querySelectorAll('.growth-shoot')];
   for(const shoot of shoots){
     const parent=shoot.parentElement.closest('.growth-shoot')||shoot.closest('.growth-plant');
     const old=phases.get(parent);if(!old)continue;
     const phase={start:old.start+old.duration*(.10+.75*clamp(q(shoot,'data-root-t',.45),0,1)),duration:parent.classList.contains('growth-shoot')?1050:1450};
     phases.set(shoot,phase);duration=Math.max(duration,phase.start+phase.duration);
     const wood=shoot.querySelector(':scope > .shoot-wood');
     if(wood)axes.push({node:shoot,phase,width:Math.max(9,q(wood,'data-grow-width',7)*1.25)});
   }
   const stemsDone=duration;let leafEnd=stemsDone;
   for(const [i,leaf] of [...svg.querySelectorAll('.growth-leaf')].entries()){
     const parent=leaf.closest('.growth-shoot')||leaf.closest('.growth-plant');
     const phase=phases.get(parent);if(!phase)continue;
     const point=pair(leaf,'data-attachment'),t=clamp(q(leaf,'data-grow-t',.55),0,1);
     const species=(parent.closest('.growth-plant')?.dataset.trunk)||'other';
     const radius=species==='fern'?32:species==='oak'||species==='acanthus'?67:55;
     const start=stemsDone+120+(i%11)*38+t*420;
     const item={point,start,duration:720,radius};leaves.push(item);
     leafEnd=Math.max(leafEnd,start+item.duration);duration=Math.max(duration,leafEnd);
   }
   for(const [i,organ] of [...svg.querySelectorAll('.growth-organ')].entries()){
     const parent=organ.closest('.growth-shoot')||organ.closest('.growth-plant');
     const phase=phases.get(parent);if(!phase)continue;
     const point=pair(organ,'data-life-origin'),start=leafEnd+80+(i%9)*62;
     const item={point,start,duration:990,radius:24};organs.push(item);
     duration=Math.max(duration,start+item.duration);
   }
   // Sample actual authored centerlines; `getPointAtLength` is done ONCE.
   for(const axis of axes){
     const d=axis.node.getAttribute('data-growpath');
     if(!d)continue;
     const svgPath=create('path');svgPath.setAttribute('d',d);
     let L=0;try{L=svgPath.getTotalLength()}catch(_){}
     if(!Number.isFinite(L)||L<1)continue;
     const samples=Math.max(18,Math.min(300,Math.ceil(L/3.5)));
     axis.points=Array.from({length:samples+1},(_,i)=>{
       const p=svgPath.getPointAtLength(L*i/samples);return [p.x,p.y];
     });
   }
   return {axes:axes.filter(a=>a.points),leaves,organs,duration};
 }
 function renderFrame(r,elapsed){
   const {mask,mctx,ctx,canvas,plate,geometry}=r;
   const w=mask.width,h=mask.height;
   mctx.setTransform(1,0,0,1,0,0);mctx.clearRect(0,0,w,h);
   const vb=r.viewBox;
   mctx.setTransform(w/vb[2],0,0,h/vb[3],-vb[0]*w/vb[2],-vb[1]*h/vb[3]);
   mctx.fillStyle='#fff';mctx.strokeStyle='#fff';mctx.lineJoin='round';mctx.lineCap='round';
   for(const a of geometry.axes){
     const t=ease((elapsed-a.phase.start)/a.phase.duration);
     if(t<=0)continue;
     const pts=a.points,limit=Math.max(1,Math.ceil((pts.length-1)*t));
     mctx.lineWidth=a.width;mctx.beginPath();mctx.moveTo(...pts[0]);
     for(let i=1;i<=limit;i++)mctx.lineTo(...pts[i]);mctx.stroke();
   }
   for(const a of [...geometry.leaves,...geometry.organs]){
     const t=ease((elapsed-a.start)/a.duration);
     if(t<=0)continue;
     // Each blade emerges from its real petiole; its existing ink is uncovered,
     // not opacity-faded or swapped for an unrelated temporary shape.
     const radius=Math.max(.3,a.radius*t);
     mctx.beginPath();mctx.arc(a.point[0],a.point[1],radius,0,2*Math.PI);mctx.fill();
   }
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
   // Match the fitted SVG viewBox during animation: no sudden zoom or jump.
   ctx.setTransform(w/vb[2],0,0,h/vb[3],-vb[0]*w/vb[2],-vb[1]*h/vb[3]);
   ctx.drawImage(plate,0,0,M.W,M.H);
   ctx.setTransform(1,0,0,1,0,0);
   ctx.globalCompositeOperation='destination-in';ctx.drawImage(mask,0,0);
   ctx.globalCompositeOperation='source-over';
 }
 M.pixelPlayback={
   play(svg,s){
     stop();if(!svg?.parentElement)return;
     const settings=M.pixelPlateSettings(s||{}),canvas=document.createElement('canvas');
     canvas.width=Math.round(M.W*settings.resolution);canvas.height=Math.round(M.H*settings.resolution);
     canvas.className='growth-pixel-canvas';canvas.setAttribute('aria-hidden','true');
     svg.parentNode.appendChild(canvas);svg.style.visibility='hidden';
     const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
     const ctx=canvas.getContext('2d'),mctx=mask.getContext('2d');
     const vb=(svg.getAttribute('viewBox')||`0 0 ${M.W} ${M.H}`).split(/[ ,]+/).map(Number);
     const run={svg,canvas,mask,ctx,mctx,viewBox:vb,geometry:setupObjects(svg),stopped:false,raf:0,start:null,plate:null};
     live=run;
     raster(svg,settings,'low').then(plate=>{
       if(run.stopped||live!==run)return;
       run.plate=plate;
       const tick=now=>{
         if(run.stopped||live!==run)return;
         if(run.start===null)run.start=now;
         const t=Math.min(now-run.start,run.geometry.duration+100);
         renderFrame(run,t);
         if(t<run.geometry.duration+100)run.raf=requestAnimationFrame(tick);
         else {M.animationComplete?.();}
       };
       run.raf=requestAnimationFrame(tick);
     }).catch(err=>{
       console.warn('Pixel growth preview unavailable',err);stop();
       M.animationComplete?.();
     });
   },
   stop,
   promote(svg){
     const run=live;
     if(!run||run.svg!==svg||!run.plate)return false;
     const plate=create('image');plate.id='pixel-print-plate';
     plate.setAttribute('href',run.plate.toDataURL('image/png'));
     for(const [k,v] of Object.entries({x:0,y:0,width:M.W,height:M.H,preserveAspectRatio:'none','image-rendering':'auto'}))plate.setAttribute(k,String(v));
     const art=svg.querySelector('#artwork-layers');art.setAttribute('display','none');
     art.parentNode.insertBefore(plate,art.nextSibling);
     stop();return true;
   },
   finish:stop
 };
})(window.MS);
