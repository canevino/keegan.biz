/* Pass 5: botanical controls, authored growth paths and screen-only animation. */
(()=>{
 'use strict';
 const M=window.MS, el=id=>document.getElementById(id);
 const defaultSettings={geometry:'random',conform:52,ornament:28,guideOverlay:false,
   pattern:'random',species:'random',season:'summer',palette:'kells',seed:472818,
   foliage:70,finishLevel:24};
 const s={...defaultSettings};
 const textFields=['pattern','geometry','species','season','palette'];
 const numberFields=['seed','conform','ornament','foliage','finishLevel'];
 const controlIds=[...textFields,...numberFields];
 const stage=el('drawing-stage'),overlay=el('stroke-overlay'),preview=el('stroke-preview');
 let strokes=[],draft=[],drawing=false,pointerId=null,paintTimer=null,svg='';
 const cap=4;
 function read(){
   controlIds.forEach(id=>s[id]=numberFields.includes(id)?Number(el(id).value):el(id).value);
   s.seed=Number.isFinite(s.seed)?(s.seed>>>0)||1:1;
   // Four visible sliders with non-overlapping responsibilities:
   // geometry = directional influence, ornament = botanical stylisation,
   // density = branch/leaf population, wear = the coherent print finish.
   const f=M.clamp(s.finishLevel/100,0,1);
   s.detail=64; // real leaf venation stays legible regardless of density
   s.pigment=Math.round(24+f*34);        // subtle color variation within shapes
   s.wear=Math.round(f*75);              // missing ink / dry brush
   s.spread=Math.round(20+f*75);            // bleeding stays near source edges
   s.registration=Math.round(f*20);     // small imperfections, not ghost leaves
   s.printWarp=Math.round(f*14);        // local print wobble, not plant topology
   s.distortion=7;                     // gentle botanical waviness, not random shapes
   s.bleed=s.spread>0;s.transparent=true;
   s.guideOverlay=el('guideOverlay').checked;
   s.drawnPaths=strokes.map(path=>path.map(p=>({x:p.x,y:p.y})));
 }
 function stopPlayback(){M.growthAnimation?.cancel();}
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
 function paint({animate=true}={}){
   clearTimeout(paintTimer);read();
   numberFields.slice(1).forEach(id=>el(id+'-value').textContent=s[id]);
   stopPlayback();
   svg=M.render(s);
   el('drawing').innerHTML=svg;
   meta();refreshStatus();
   if(animate&&el('animate-growth').checked && !drawing)requestAnimationFrame(()=>animateGrowth());
 }
 function delayedPaint(){clearTimeout(paintTimer);paintTimer=setTimeout(()=>paint(),100);}
 controlIds.forEach(id=>el(id).addEventListener(id==='seed'?'change':'input',delayedPaint));
 el('guideOverlay').addEventListener('change',()=>paint({animate:false}));
 const newSeed=()=>{
   const a=new Uint32Array(1);
   if(window.crypto?.getRandomValues)window.crypto.getRandomValues(a);
   else a[0]=Math.floor(Math.random()*0xffffffff);
   return a[0]||1;
 };
 el('regenerate').addEventListener('click',()=>{el('seed').value=newSeed();paint();});
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
   M.growthAnimation?.play(el('drawing').querySelector('svg'));
 }
 M.animationComplete=()=>{
   if(!drawing)paint({animate:false});
 };
 el('replay-growth').addEventListener('click',()=>{
   paint({animate:false});requestAnimationFrame(animateGrowth);
 });
 el('animate-growth').addEventListener('change',ev=>{
   if(ev.target.checked)requestAnimationFrame(animateGrowth);
   else paint({animate:false});
 });

 // -------------------------- exports --------------------------------
 // Always render a clean, non-animated SVG with NO construction guide.
 // The authored growth paths remain part of that export.
 function cleanSVG(){return M.render({...s,guideOverlay:false,drawnPaths:strokes.map(a=>a.map(p=>({...p})))});}
 function download(blob,filename){
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),3500);
 }
 el('export-svg').addEventListener('click',()=>{
   const data=cleanSVG();
   download(new Blob([data],{type:'image/svg+xml;charset=utf-8'}),`ornament-${strokes.length?'drawn-':''}${s.seed}.svg`);
 });
 el('export-png').addEventListener('click',async()=>{
   const btn=el('export-png');btn.disabled=true;btn.textContent='rendering…';
   let url='';
   try{
     const data=cleanSVG();
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
   finally{if(url)URL.revokeObjectURL(url);btn.disabled=false;btn.textContent='save png ↗';}
 });
 window.addEventListener('spectral-ready',()=>{if(M.verifySpectral?.().working)paint({animate:false});});
 setDrawMode(false);paint({animate:false});
})();
