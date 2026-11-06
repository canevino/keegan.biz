/* Controls + deterministic updates + standalone vector and PNG export. */
(()=>{
 'use strict';
 const B=window.BotanicalPress;
 if(!B)return;
 const el=id=>document.getElementById(id);
 const ids=['species','pattern','geometry','season','palette','foliage','distress','glitch','ornament','seed'];
 const ranges=['foliage','distress','glitch','ornament'];
 const defaults={species:'random',pattern:'random',geometry:'gothic-pointed',season:'summer',palette:'future',foliage:77,distress:76,glitch:56,ornament:78,seed:472818};
 let settings={...defaults},renderHandle=0;
 function read(){
   const state={};
   ids.forEach(id=>{const v=el(id).value;state[id]=ranges.includes(id)||id==='seed'?Number(v):v;});
   state.seed=(Number(state.seed)>>>0)||1;
   state.transparent=el('transparent').checked;
   return state;
 }
 function paint(){
   renderHandle=0;
   settings=read();
   el('drawing').innerHTML=B.makeSVG(settings);
   ranges.forEach(id=>el(id+'-value').textContent=String(settings[id]));
   const sp=el('species'),season=settings.season;
   const plant=sp.options[sp.selectedIndex]?.textContent||'mixed plants';
   el('mode-description').textContent=`${plant} / ${season} · gothic print`;
   el('seed-label').textContent=`seed ${settings.seed}`;
 }
 function queue(){if(renderHandle)cancelAnimationFrame(renderHandle);renderHandle=requestAnimationFrame(paint);}
 ids.forEach(id=>el(id).addEventListener(id==='seed'?'change':'input',queue));
 function newSeed(){
   const words=new Uint32Array(1);
   if(window.crypto?.getRandomValues){window.crypto.getRandomValues(words);return words[0]||1;}
   return Math.floor(Math.random()*4294967295)||1;
 }
 function anyOption(id,notRandom=false){
   const arr=[...el(id).options].map(o=>o.value).filter(s=>!notRandom||s!=='random');
   return arr[Math.floor(Math.random()*arr.length)];
 }
 el('regenerate').addEventListener('click',()=>{el('seed').value=String(newSeed());queue();});
 el('randomize').addEventListener('click',()=>{
   ['species','pattern','geometry','season','palette'].forEach(id=>el(id).value=anyOption(id,id!=='season'&&id!=='palette'));
   ranges.forEach(id=>el(id).value=String(Math.floor(Math.random()*(id==='foliage'?58:86))+(id==='foliage'?42:12)));
   el('seed').value=String(newSeed());queue();
 });
 el('reset').addEventListener('click',()=>{
   Object.entries(defaults).forEach(([id,value])=>el(id).value=String(value));
   el('transparent').checked=false;queue();
 });
 function download(blob,filename){
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.download=filename;a.href=url;document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),6000);
 }
 function source(){return B.makeSVG(read(),{transparent:el('transparent').checked});}
 el('export-svg').addEventListener('click',()=>{
   try{download(new Blob([source()],{type:'image/svg+xml;charset=utf-8'}),`botanical-press-${read().seed}.svg`);}
   catch(err){console.error(err);alert('SVG export could not be completed.');}
 });
 el('export-png').addEventListener('click',async()=>{
   const button=el('export-png');button.disabled=true;
   let url='';
   try{
     url=URL.createObjectURL(new Blob([source()],{type:'image/svg+xml;charset=utf-8'}));
     const img=new Image();
     await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
     const canvas=document.createElement('canvas');
     canvas.width=2480;canvas.height=2840;
     const ctx=canvas.getContext('2d');
     if(!ctx)throw Error('Canvas unavailable');
     ctx.drawImage(img,0,0,canvas.width,canvas.height);
     const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
     if(!blob)throw Error('PNG conversion failed');
     download(blob,`botanical-press-${read().seed}.png`);
   }catch(err){console.error(err);alert('PNG export failed. Try saving SVG instead.');}
   finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}
 });
 paint();
})();
