/* Botanical controls, deterministic regeneration, and vector exports. */
(()=>{
 'use strict';
 const M=window.MS;
 const el=id=>document.getElementById(id);
 const has=id=>!!el(id);
 const on=(id,event,handler)=>{const node=el(id);if(node)node.addEventListener(event,handler);};

 const defaultSettings={
   geometry:'random',conform:25,ornament:47,
   pattern:'random',species:'random',season:'summer',palette:'future',seed:472818,
   foliage:72,finishLevel:28
 };
 const s={...defaultSettings};
 const textFields=['pattern','geometry','species','season','palette'];
 const numberFields=['seed','conform','ornament','foliage','finishLevel'];
 const controlIds=[...textFields,...numberFields];
 const stage=el('drawing-stage');
 let paintTimer=null,svg='',framedViewBox=null;

 function read(){
   controlIds.forEach(id=>{
     const node=el(id);
     if(!node)return;
     s[id]=numberFields.includes(id)?Number(node.value):node.value;
   });
   s.seed=Number.isFinite(s.seed)?(s.seed>>>0)||1:1;
   const f=M.clamp((s.finishLevel??0)/100,0,1);
   // Make wear clearly legible, while keeping the drawing itself continuous.
   s.detail=76;
   const future=s.palette==='future';
   s.pigment=Math.round((future?38:32)+f*(future?28:32));
   s.wear=Math.round((future?5:4)+f*(future?62:60));
   s.spread=Math.round((future?14:8)+f*(future?47:45));
   s.registration=Math.round((future?3:0)+f*(future?14:11));
   s.printWarp=Math.round((future?4:3)+f*(future?18:14));
   s.distortion=future?22:17;
   s.bleed=s.spread>0;
   s.transparent=true;
   s.guideOverlay=false; // guides remain internal construction only
   s.drawnPaths=[];
 }


 function meta(){
   if(has('seed-label'))el('seed-label').textContent='seed '+s.seed;
   const species=s.species==='random'
     ? 'mixed botanical growth'
     : s.species==='hybrid'
       ? 'ornamental hybrid'
       : s.species+' / '+s.season;
   const construction=M.geometryNames[M.lastConstruction?.name]||'free growth';
   if(has('mode-description'))el('mode-description').textContent=species+' · '+construction;
   stage?.setAttribute('aria-label','Botanical ornament, seed '+s.seed);
 }

 // Fit the complete illustrated specimen, including trunk, fruit and fine
 // terminal twigs. Never crop woody endpoints to make the foliage look larger.
 // The same viewBox is carried to PNG/SVG export.
 function fitDrawing(){
   const art=el('drawing')?.querySelector('svg');
   const plant=art?.querySelector('#botanical-plants')||art?.querySelector('#artwork-layers');
   if(!art||!plant||!stage)return;
   try{
     const b=plant.getBBox();
     if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<1||b.height<1)return;
     // Frame the actual plant against the DISPLAY window, not the old portrait
     // drawing coordinates. This is what allows the whole panel to fit beside
     // its settings without turning into an enormous scrolling document.
     const rect=stage.getBoundingClientRect(),ratio=Math.max(.35,rect.width/Math.max(1,rect.height));
     let width=Math.max(120,b.width*1.20),height=Math.max(170,b.height*1.17);
     if(width/height<ratio)width=height*ratio;
     else height=width/ratio;
     const cx=b.x+b.width/2,cy=b.y+b.height/2;
     framedViewBox=[cx-width/2,cy-height/2,width,height]
       .map(v=>Math.round(v*100)/100).join(' ');
     art.setAttribute('viewBox',framedViewBox);
     art.setAttribute('preserveAspectRatio','xMidYMid meet');
   }catch(err){console.warn('Art frame fallback:',err);}
 }
 if(stage && 'ResizeObserver' in window){
   new ResizeObserver(()=>fitDrawing()).observe(stage);
 }

 function paint(){
   clearTimeout(paintTimer);
   read();
   numberFields.slice(1).forEach(id=>{if(has(id+'-value'))el(id+'-value').textContent=s[id];});
   svg=M.render(s);
   if(has('drawing'))el('drawing').innerHTML=svg;
   fitDrawing();
   meta();
 }

 function delayedPaint(){clearTimeout(paintTimer);paintTimer=setTimeout(()=>paint(),80);}
 controlIds.forEach(id=>on(id,id==='seed'?'change':'input',delayedPaint));

 const newSeed=()=>{
   const a=new Uint32Array(1);
   if(window.crypto?.getRandomValues)window.crypto.getRandomValues(a);
   else a[0]=Math.floor(Math.random()*0xffffffff);
   return a[0]||1;
 };

 function pick(selectId,{avoidRandom=false}={}){
   const select=el(selectId); if(!select) return null;
   const opts=[...select.options].map(o=>o.value).filter(Boolean);
   const pool=avoidRandom?opts.filter(v=>v!=='random'):opts;
   return pool[Math.floor(Math.random()*pool.length)] || opts[0] || null;
 }

 on('regenerate','click',()=>{ if(has('seed')) el('seed').value=newSeed(); paint(); });
 on('randomize','click',()=>{
   if(has('species')) el('species').value=pick('species',{avoidRandom:true});
   if(has('pattern')) el('pattern').value=pick('pattern',{avoidRandom:true});
   if(has('geometry')) el('geometry').value=pick('geometry',{avoidRandom:true});
   if(has('season')) el('season').value=pick('season');
   if(has('palette')) el('palette').value=pick('palette');
   if(has('conform')) el('conform').value=String(Math.floor(15+Math.random()*48));
   if(has('ornament')) el('ornament').value=String(Math.floor(24+Math.random()*53));
   if(has('foliage')) el('foliage').value=String(Math.floor(45+Math.random()*42));
   if(has('finishLevel')) el('finishLevel').value=String(Math.floor(10+Math.random()*44));
   if(has('seed')) el('seed').value=String(newSeed());
   paint();
 });

 function reset(){
   controlIds.forEach(id=>{if(has(id))el(id).value=defaultSettings[id];});
   paint();
 }
 on('reset','click',reset);


 async function cleanSVG(){
   read();
   const data=M.render({...s,guideOverlay:false,drawnPaths:[]});
   const parsed=new DOMParser().parseFromString(data,'image/svg+xml');
   const root=parsed.documentElement;
   if(framedViewBox)root.setAttribute('viewBox',framedViewBox);
   return new XMLSerializer().serializeToString(root);
 }
 function download(blob,filename){
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),3500);
 }
 on('export-svg','click',async()=>{
   const button=el('export-svg'); if(!button)return;
   button.disabled=true;
   try{
     const data=await cleanSVG();
     download(new Blob([data],{type:'image/svg+xml;charset=utf-8'}),`ornament-${s.seed}.svg`);
   }catch(error){console.error(error);alert('SVG export failed.');}
   finally{button.disabled=false;}
 });
 on('export-png','click',async()=>{
   const btn=el('export-png'); if(!btn)return;
   btn.disabled=true;btn.textContent='rendering…';
   let url='';
   try{
     const data=await cleanSVG();
     url=URL.createObjectURL(new Blob([data],{type:'image/svg+xml;charset=utf-8'}));
     const image=new Image();
     await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=reject;image.src=url;});
     const canvas=document.createElement('canvas');
     const frame=framedViewBox?.split(/\s+/).map(Number);
     canvas.width=2600;canvas.height=frame?.length===4 ? Math.round(2600*frame[3]/frame[2]) : Math.round(2600*M.H/M.W);
     const ctx=canvas.getContext('2d'); if(!ctx) throw Error('canvas unavailable');
     ctx.drawImage(image,0,0,canvas.width,canvas.height);
     const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
     if(!blob) throw Error('PNG export failed');
     download(blob,`ornament-${s.seed}.png`);
   }catch(error){console.error(error);alert('PNG export failed. Try saving the SVG instead.');}
   finally{ if(url)URL.revokeObjectURL(url); btn.disabled=false;btn.textContent='save png'; }
 });

 window.addEventListener('spectral-ready',()=>{if(M.verifySpectral?.().working)paint();});
 paint();
})();
