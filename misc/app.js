/* Botanical controls, deterministic regeneration, and vector exports. */
(()=>{
 'use strict';
 const M=window.MS;
 const el=id=>document.getElementById(id);
 const has=id=>!!el(id);
 const on=(id,event,handler)=>{const node=el(id);if(node)node.addEventListener(event,handler);};

 const defaultSettings={
   geometry:'random',conform:50,ornament:26,
   pattern:'random',species:'random',season:'summer',palette:'kells',seed:472818,
   foliage:66,finishLevel:30
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
   s.detail=78;
   s.pigment=Math.round(34+f*46);
   s.wear=Math.round(6+f*84);
   s.spread=Math.round(10+f*82);
   s.registration=Math.round(f*24);
   s.printWarp=Math.round(3+f*28);
   s.distortion=10;
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
   if(!art||!plant)return;
   try{
     const b=plant.getBBox();
     if(!b||![b.x,b.y,b.width,b.height].every(Number.isFinite)||b.width<1||b.height<1)return;
     const ratio=M.W/M.H;
     // The specimen should occupy roughly 82–85% of the smaller limiting
     // dimension; ensure a calm margin all around, even on small screens.
     const skinny=b.width/b.height<.33;
     const mx=Math.max(30,b.width*(skinny?.13:.095));
     const my=Math.max(34,b.height*.095);
     let width=b.width+2*mx,height=b.height+2*my;
     const minHeight=skinny?Math.max(440,b.height*1.15):Math.max(430,b.height*1.12);
     height=Math.max(height,minHeight);
     if(width/height<ratio)width=height*ratio;
     else height=width/ratio;
     // Center mass based on the whole silhouette. A tiny offset toward the
     // leafy crown gives the base a stronger, natural grounding.
     const cx=b.x+b.width/2;
     const cy=b.y+b.height/2-b.height*.016;
     framedViewBox=[cx-width/2,cy-height/2,width,height]
       .map(v=>Math.round(v*100)/100).join(' ');
     art.setAttribute('viewBox',framedViewBox);
     art.setAttribute('preserveAspectRatio','xMidYMid meet');
   }catch(err){console.warn('Art frame fallback:',err);}
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
   if(has('conform')) el('conform').value=String(Math.floor(12+Math.random()*89));
   if(has('ornament')) el('ornament').value=String(Math.floor(Math.random()*101));
   if(has('foliage')) el('foliage').value=String(Math.floor(18+Math.random()*83));
   if(has('finishLevel')) el('finishLevel').value=String(Math.floor(Math.random()*101));
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
     canvas.width=3200;canvas.height=Math.round(3200*M.H/M.W);
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
