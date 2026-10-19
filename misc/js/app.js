/* Pass 5: botanical controls, authored growth paths and screen-only animation. */
(()=>{
 'use strict';
 const M=window.MS, el=id=>document.getElementById(id);
 const defaultSettings={geometry:'random',conform:50,ornament:26,guideOverlay:false,
   pattern:'random',species:'random',season:'summer',palette:'kells',seed:472818,
   foliage:63,finishLevel:36};
 const s={...defaultSettings};
 const textFields=['pattern','geometry','species','season','palette'];
 const numberFields=['seed','conform','ornament','foliage','finishLevel'];
 const controlIds=[...textFields,...numberFields];
 const stage=el('drawing-stage'),overlay=el('stroke-overlay'),preview=el('stroke-preview');
 let strokes=[],draft=[],drawing=false,pointerId=null,paintTimer=null,svg='',framedViewBox=null,paintRevision=0,playingGrowth=false;
 const cap=4;
 function read(){
   controlIds.forEach(id=>s[id]=numberFields.includes(id)?Number(el(id).value):el(id).value);
   s.seed=Number.isFinite(s.seed)?(s.seed>>>0)||1:1;
   // Four visible sliders with non-overlapping responsibilities:
   // geometry = directional influence, ornament = botanical stylisation,
   // density = branch/leaf population, wear = the coherent print finish.
   const f=M.clamp(s.finishLevel/100,0,1);
   s.detail=78; // real leaf venation stays legible regardless of density
   s.pigment=Math.round(42+f*24);        // subtle color variation within shapes
   s.wear=Math.round(8+f*37);              // missing ink / dry brush
   s.spread=Math.round(36+f*58);            // bleeding stays near source edges
   s.registration=Math.round(5+f*16);     // small imperfections, not ghost leaves
   s.printWarp=Math.round(2+f*18);        // local print wobble, not plant topology
   s.distortion=10;                     // gentle botanical waviness, not random shapes
   s.bleed=s.spread>0;s.transparent=true;
   s.guideOverlay=el('guideOverlay').checked;
   s.drawnPaths=strokes.map(path=>path.map(p=>({x:p.x,y:p.y})));
 }
 function stopPlayback(){playingGrowth=false;M.growthAnimation?.cancel();}
 function meta(){
   el('seed-label').textContent='seed '+s.seed;
   const species=s.species==='random'?'mixed botanical growth':s.species==='hybrid'?'ornamental hybrid':s.species+' / '+s.season;
   const construction=strokes.length?'hand-drawn path':(M.geometryNames[M.lastConstruction?.name]||'free growth');
   el('mode-description').textContent=species+' · '+construction;
   stage.setAttribute('aria-label','Botanical ornament, seed '+s.seed+(strokes.length?', hand-drawn stems':''));
 }
 function refreshStatus(message){
   el('path-status').textContent=message||(drawing
     ? `${strokes.length} of ${cap} paths · drag from base to tip` :
       strokes.length?`${strokes.length} drawn ${strokes.length===1?'stem':'stems'}`:'generated growth');
   el('undo-path').disabled=strokes.length===0;
   el('clear-paths').disabled=strokes.length===0;
 }
 function fitDrawing(){
   const art=el('drawing').querySelector('svg'),plant=art?.querySelector('#botanical-plants');
   if(!art||!plant)return;
   // The SVG is still authored on the same 850 × 1000 sheet; framing changes
   // ONLY the camera/viewBox and never the botanical coordinates or export data.
   try{
     const b=plant.getBBox();
     if(![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<1||b.height<1)return;
     const aspect=M.W/M.H, margin=1.23;
     let w=Math.max(260,b.width*margin),h=Math.max(300,b.height*margin);
     if(w/h<aspect)w=h*aspect;else h=w/aspect;
     const midX=b.x+b.width*.5,midY=b.y+b.height*.5;
     framedViewBox=[midX-w*.5,midY-h*.5,w,h].map(n=>Math.round(n*100)/100).join(' ');
     art.setAttribute('viewBox',framedViewBox);
     overlay.setAttribute('viewBox',framedViewBox);
   }catch(err){console.warn('Art frame fallback:',err);}
 }
 function makePixelPlate(art,settings,revision){
   return M.applyPixelPlate(art,settings).then(()=>{
     // An earlier rasterization must never replace a newer species.
     if(revision!==paintRevision||!art.isConnected)return;
     if(playingGrowth)M.useVectorPigment(art);
   }).catch(error=>console.warn('Vector finish retained',error));
 }
 function paint({animate=false,forceGrowth=false}={}){
   clearTimeout(paintTimer);read();
   const revision=++paintRevision;
   numberFields.slice(1).forEach(id=>el(id+'-value').textContent=s[id]);
   stopPlayback();
   svg=M.render(s);
   el('drawing').innerHTML=svg;
   fitDrawing();meta();refreshStatus();
   const art=el('drawing').querySelector('svg');
   const settings={...s};
   const animateNow=(forceGrowth||(animate&&el('animate-growth').checked))&&!drawing;
   if(animateNow){
     // No temporary complete pixel bitmap while stems are just emerging.
     // Render the stable plate ONCE, after the vector growth completes.
     playingGrowth=true;
     M.useVectorPigment(art);
     M.growthAnimation?.play(art);
   } else {
     makePixelPlate(art,settings,revision);
   }
 }
 // Leave the old timeline intact during a slider's debounce. Cancelling it
 // early exposed a completed old image for one frame before the new species
 // was drawn. paint() cancels and replaces in the same synchronous task.
 function delayedPaint(){clearTimeout(paintTimer);paintTimer=setTimeout(()=>paint({animate:false}),80);}
 controlIds.forEach(id=>el(id).addEventListener(id==='seed'?'change':'input',delayedPaint));
 el('guideOverlay').addEventListener('change',()=>paint({animate:false}));
 const newSeed=()=>{
   const a=new Uint32Array(1);
   if(window.crypto?.getRandomValues)window.crypto.getRandomValues(a);
   else a[0]=Math.floor(Math.random()*0xffffffff);
   return a[0]||1;
 };
 el('regenerate').addEventListener('click',()=>{el('seed').value=newSeed();paint({animate:false});});
 el('grid').addEventListener('change',ev=>stage.classList.toggle('grid',ev.target.checked));
 function reset(){
   stopPlayback();strokes=[];draft=[];setDrawMode(false);
   for(const id of controlIds)el(id).value=defaultSettings[id];
   el('guideOverlay').checked=false;el('grid').checked=false;el('animate-growth').checked=false;
   stage.classList.remove('grid');paint({animate:false});
 }
 el('reset').addEventListener('click',reset);

 // ---------------------- pointer drawing -----------------------------
 function setDrawMode(active){
   drawing=!!active;
   stage.classList.toggle('is-drawing',drawing);
   el('draw-mode').setAttribute('aria-pressed',String(drawing));
   el('draw-mode').textContent=drawing?'stop drawing ×':'draw a vine ↗';
   el('finish-paths').hidden=!drawing;
   preview.setAttribute('d','');draft=[];pointerId=null;
   refreshStatus();
 }
 function locationFor(evt){
   // SVG screen transformation includes preserveAspectRatio/letterboxing, so
   // the coordinates remain correct on narrow mobile layouts and zoomed views.
   const matrix=overlay.getScreenCTM();
   if(!matrix)return null;
   const p=new DOMPoint(evt.clientX,evt.clientY).matrixTransform(matrix.inverse());
   return {x:M.clamp(p.x,6,M.W-6),y:M.clamp(p.y,6,M.H-6)};
 }
 function abortDraft(){draft=[];pointerId=null;preview.setAttribute('d','');}
 overlay.addEventListener('pointerdown',evt=>{
   if(!drawing||pointerId!==null||!evt.isPrimary||(evt.pointerType==='mouse'&&evt.button!==0))return;
   if(strokes.length>=cap){refreshStatus(`maximum ${cap} paths · undo or clear to continue`);return;}
   const p=locationFor(evt);if(!p)return;
   evt.preventDefault();pointerId=evt.pointerId;draft=[p];
   try{overlay.setPointerCapture(evt.pointerId)}catch(_){}
 });
 overlay.addEventListener('pointermove',evt=>{
   if(!drawing||evt.pointerId!==pointerId)return;
   evt.preventDefault();const p=locationFor(evt);if(!p)return;
   if(M.distance(p,draft[draft.length-1])<3)return;
   if(draft.length>=240)return;
   draft.push(p);preview.setAttribute('d',M.strokePath(draft));
 });
 function complete(evt,cancel=false){
   if(evt.pointerId!==pointerId)return;
   evt.preventDefault();
   if(!cancel){
     const p=locationFor(evt);
     if(p&&draft.length&&M.distance(p,draft[draft.length-1])>2&&draft.length<240)draft.push(p);
     const completeStroke=M.resampleStroke(draft).length?draft.map(q=>({...q})):null;
     try{overlay.releasePointerCapture(evt.pointerId)}catch(_){}
     abortDraft();
     if(completeStroke){strokes.push(completeStroke);paint({animate:false});}
     else refreshStatus('stroke too short · draw from stem base towards its tip');
     return;
   }
   try{overlay.releasePointerCapture(evt.pointerId)}catch(_){}
   abortDraft();
 }
 overlay.addEventListener('pointerup',evt=>complete(evt,false));
 overlay.addEventListener('pointercancel',evt=>complete(evt,true));
 overlay.addEventListener('lostpointercapture',()=>{if(pointerId!==null)abortDraft()});
 el('draw-mode').addEventListener('click',()=>setDrawMode(!drawing));
 el('finish-paths').addEventListener('click',()=>{
   setDrawMode(false);paint({animate:true});
 });
 el('undo-path').addEventListener('click',()=>{
   if(strokes.length){strokes.pop();paint({animate:false});}
 });
 el('clear-paths').addEventListener('click',()=>{
   strokes=[];abortDraft();paint({animate:false});
 });
 document.addEventListener('keydown',evt=>{
   if(evt.key==='Escape'&&drawing){setDrawMode(false);paint({animate:false});}
 });

 // A staged growth sequence is implemented separately from plant generation,
 // so it never alters the downloaded final SVG or any of the random seeds.
 function animateGrowth(){
   if(drawing)return;
   const art=el('drawing').querySelector('svg');
   if(!art)return;
   playingGrowth=true;
   M.useVectorPigment(art);
   M.growthAnimation?.play(art);
 }
 M.animationComplete=()=>{
   const art=el('drawing').querySelector('svg');
   if(!art||!playingGrowth)return;
   playingGrowth=false;
   // Render the plate only after growth is complete; keep current art visible
   // until it is ready, preventing missing leaves or flash-to-final glitches.
   makePixelPlate(art,{...s},paintRevision);
 };
 el('replay-growth').addEventListener('click',()=>paint({forceGrowth:true}));
 el('animate-growth').addEventListener('change',ev=>{
   if(ev.target.checked)paint({forceGrowth:true});
   else paint({animate:false});
 });

 // -------------------------- exports --------------------------------
 // Always render a clean, non-animated SVG with NO construction guide.
 // The authored growth paths remain part of that export.
 async function cleanSVG(){
   read();
   const data=M.render({...s,guideOverlay:false,drawnPaths:strokes.map(a=>a.map(p=>({...p})))});
   const parsed=new DOMParser().parseFromString(data,'image/svg+xml');
   const root=parsed.documentElement;
   // The same pigment renderer is used for browser, SVG and PNG. SVG holds
   // the true vector stems and outlines plus an embedded pixelated PNG plate.
   await M.applyPixelPlate(root,{...s});
   if(framedViewBox)root.setAttribute('viewBox',framedViewBox);
   return new XMLSerializer().serializeToString(root);
 }
 function download(blob,filename){
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),3500);
 }
 el('export-svg').addEventListener('click',async()=>{
   const button=el('export-svg');button.disabled=true;
   try{
     const data=await cleanSVG();
     download(new Blob([data],{type:'image/svg+xml;charset=utf-8'}),`ornament-${strokes.length?'drawn-':''}${s.seed}.svg`);
   }catch(error){console.error(error);alert('SVG export failed.');}
   finally{button.disabled=false;}
 });
 el('export-png').addEventListener('click',async()=>{
   const btn=el('export-png');btn.disabled=true;btn.textContent='rendering…';
   let url='';
   try{
     const data=await cleanSVG();
     url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'}));
     const image=new Image();
     await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
     const canvas=document.createElement('canvas');canvas.width=3200;canvas.height=Math.round(3200*M.H/M.W);
     const ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas unavailable');
     ctx.drawImage(image,0,0,canvas.width,canvas.height);
     const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
     if(!blob)throw Error('PNG export failed');
     download(blob,`ornament-${strokes.length?'drawn-':''}${s.seed}.png`);
   }catch(error){console.error(error);alert('PNG export failed. Try saving the SVG instead.');}
   finally{if(url)URL.revokeObjectURL(url);btn.disabled=false;btn.textContent='png ↗';}
 });
 window.addEventListener('spectral-ready',()=>{if(M.verifySpectral?.().working)paint({animate:false});});
 setDrawMode(false);paint({animate:false});
})();
