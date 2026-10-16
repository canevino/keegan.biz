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
 let strokes=[],draft=[],drawing=false,pointerId=null,paintTimer=null,svg='',playback=[],version=0;
 const cap=4;
 function read(){
   controlIds.forEach(id=>s[id]=numberFields.includes(id)?Number(el(id).value):el(id).value);
   s.seed=Number.isFinite(s.seed)?(s.seed>>>0)||1:1;
   // Four visible sliders with non-overlapping responsibilities:
   // geometry = directional influence, ornament = botanical stylisation,
   // density = branch/leaf population, wear = the coherent print finish.
   const f=M.clamp(s.finishLevel/100,0,1);
   s.detail=64; // real leaf venation stays legible regardless of density
   s.pigment=Math.round(19+f*39);        // subtle color variation within shapes
   s.wear=Math.round(f*78);              // missing ink / dry brush
   s.spread=Math.round(f*56);            // bleeding stays near source edges
   s.registration=Math.round(f*26);     // small imperfections, not ghost leaves
   s.printWarp=Math.round(f*21);        // local print wobble, not plant topology
   s.distortion=12;                     // gentle botanical waviness, not random shapes
   s.bleed=s.spread>0;s.transparent=true;
   s.guideOverlay=el('guideOverlay').checked;
   s.drawnPaths=strokes.map(path=>path.map(p=>({x:p.x,y:p.y})));
 }
 function stopPlayback(){for(const animation of playback)try{animation.cancel()}catch(_){}playback=[];}
 function meta(){
   el('seed-label').textContent='seed '+s.seed;
   const species=s.species==='random'?'mixed botanical growth':s.species==='hybrid'?'ornamental hybrid':s.species+' / '+s.season;
   const construction=strokes.length?'hand-drawn path':(M.geometryNames[M.lastConstruction?.name]||'free growth');
   el('mode-description').textContent=species+' · '+construction;
   stage.setAttribute('aria-label','Botanical ornament, seed '+s.seed+(strokes.length?', hand-drawn stems':''));
 }
 function refreshStatus(message){
   el('path-status').textContent=message||(drawing
     ? `${strokes.length} of ${cap} paths · drag on artwork` :
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
     if(M.resampleStroke(draft).length){
       strokes.push(draft.map(q=>({...q})));
       // Keep draw mode enabled for another vine. Avoid replaying an animation
       // during consecutive strokes; the user should see the full composition.
       paint({animate:false});
     } else refreshStatus('stroke too short · draw a longer path');
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

 // ------------------- screen-only reveal ----------------------------
 function animateGrowth(){
   stopPlayback();
   if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
   const drawingSVG=el('drawing').querySelector('svg'),growth=M.lastGrowthPaths||[];
   if(!drawingSVG || growth.length===0)return;
   // Limit the effect on extremely large SVGs (not the artwork or exports).
   const playbackLimit=window.innerWidth<=700?3200000:5000000;
   if(svg.length>playbackLimit){refreshStatus('animation skipped for complex illustration');return;}
   const ns='http://www.w3.org/2000/svg';
   const maskId='growth-mask-'+(++version);
   const defs=document.createElementNS(ns,'defs'),mask=document.createElementNS(ns,'mask');
   mask.setAttribute('id',maskId);mask.setAttribute('maskUnits','userSpaceOnUse');
   mask.setAttribute('x','-200');mask.setAttribute('y','-200');mask.setAttribute('width',String(M.W+400));mask.setAttribute('height',String(M.H+400));
   mask.setAttribute('style','mask-type:luminance');
   const lanes=[];
   for(const [i,points] of growth.entries()){
     const path=document.createElementNS(ns,'path');
     path.setAttribute('d',M.strokePath(points));
     path.setAttribute('stroke','white');path.setAttribute('stroke-width','205');
     path.setAttribute('stroke-linejoin','round');path.setAttribute('stroke-linecap','round');
     path.setAttribute('fill','none');
     const len=Math.max(1,path.getTotalLength());
     path.style.strokeDasharray=String(len+1);
     path.style.strokeDashoffset=String(len+1);
     mask.appendChild(path);lanes.push({path,len,i});
   }
   defs.appendChild(mask);drawingSVG.insertBefore(defs,drawingSVG.firstChild);
   const layers=drawingSVG.querySelector('#artwork-layers');
   if(!layers)return;
   layers.setAttribute('mask',`url(#${maskId})`);
   for(const {path,len,i} of lanes){
     const animation=path.animate([{strokeDashoffset:len+1},{strokeDashoffset:0}],{
       duration:2100,delay:i*320,fill:'forwards',easing:'ease-in-out'
     });
     playback.push(animation);
   }
   // Keep the final result visible after all animation players finish.
   Promise.all(playback.map(p=>p.finished.catch(()=>null))).then(()=>{
     if(drawingSVG.isConnected&&drawingSVG.querySelector('#'+maskId)){
       layers.removeAttribute('mask');defs.remove();
     }
   });
 }
 el('replay-growth').addEventListener('click',()=>paint({animate:false})||requestAnimationFrame(animateGrowth));
 el('animate-growth').addEventListener('change',ev=>{if(ev.target.checked)requestAnimationFrame(animateGrowth);else paint({animate:false});});

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
