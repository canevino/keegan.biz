/* Controls, reproducible state and background-free SVG/PNG exports. */
(()=>{
  'use strict';
  const M=window.MS, el=id=>document.getElementById(id);
  const initial={mode:'botanical',palette:'kells',initial:'B',seed:472818,foliage:70,knots:60,detail:52,fragments:12,pigment:46,distortion:20,wear:35,initialVisible:true,bleed:true,transparent:true};
  let settings={...initial},svg='',pending=0;
  const textFields=['mode','palette','initial'];
  const numberFields=['seed','foliage','knots','detail','fragments','pigment','distortion','wear'];
  const ids=[...textFields,...numberFields];
  function read(){
    ids.forEach(id=>{ settings[id]=numberFields.includes(id)?Number(el(id).value):el(id).value; });
    settings.seed=Number.isFinite(settings.seed)?(settings.seed>>>0)||1:1;
    settings.initial=(settings.initial||'B').slice(0,1).toUpperCase();
    settings.initialVisible=el('initial-visible').checked;
    settings.bleed=el('bleed').checked;
    settings.transparent=el('transparent').checked;
  }
  function paint(){
    read();
    numberFields.slice(1).forEach(id=>el(id+'-value').textContent=settings[id]);
    svg=M.render(settings);
    el('drawing').innerHTML=svg;
    el('seed-label').textContent='seed '+settings.seed;
    el('mode-description').textContent=el('mode').selectedOptions[0].text;
    el('drawing-stage').setAttribute('aria-label','Ornament, '+el('mode').selectedOptions[0].text+', seed '+settings.seed);
  }
  const update=()=>{window.clearTimeout(pending);pending=window.setTimeout(paint,75);};
  ids.forEach(id=>el(id).addEventListener(['initial','seed'].includes(id)?'change':'input',update));
  ['initial-visible','bleed','transparent'].forEach(id=>el(id).addEventListener('change',paint));
  const nextSeed=()=>{const x=new Uint32Array(1);if(window.crypto?.getRandomValues)window.crypto.getRandomValues(x);else x[0]=Math.floor(Math.random()*4294967295);return x[0]||1;};
  el('regenerate').addEventListener('click',()=>{el('seed').value=nextSeed();paint();});
  el('grid').addEventListener('change',e=>el('drawing-stage').classList.toggle('grid',e.target.checked));
  el('reset').addEventListener('click',()=>{Object.assign(settings,initial);ids.forEach(id=>el(id).value=initial[id]);el('initial-visible').checked=initial.initialVisible;el('bleed').checked=initial.bleed;el('transparent').checked=initial.transparent;el('grid').checked=false;el('drawing-stage').classList.remove('grid');paint();});
  function serialization(){
    // Transparent artwork by default. Background export is explicitly opt-in.
    if(settings.transparent)return svg;
    return svg.replace(/(<svg[^>]*>)/,`$1<rect x="0" y="0" width="${M.W}" height="${M.H}" fill="#ece7d7"/>`);
  }
  function trigger(blob,filename){
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2500);
  }
  el('export-svg').addEventListener('click',()=>trigger(new Blob([serialization()],{type:'image/svg+xml;charset=utf-8'}),`ornament-${settings.mode}-${settings.seed}.svg`));
  el('export-png').addEventListener('click',async()=>{
    const btn=el('export-png');btn.disabled=true;btn.textContent='rendering…';
    let temp='';
    try{
      const doc=new Blob([serialization()],{type:'image/svg+xml;charset=utf-8'});
      temp=URL.createObjectURL(doc);
      const image=new Image();
      await new Promise((res,rej)=>{image.onload=res;image.onerror=rej;image.src=temp;});
      const canvas=document.createElement('canvas');canvas.width=3200;canvas.height=Math.round(3200*M.H/M.W);
      const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas unavailable');ctx.drawImage(image,0,0,canvas.width,canvas.height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('PNG unavailable');
      trigger(blob,`ornament-${settings.mode}-${settings.seed}.png`);
    }catch(err){console.error(err);alert('PNG export failed. SVG export is still available.');}
    finally{if(temp)URL.revokeObjectURL(temp);btn.disabled=false;btn.textContent='save png ↗';}
  });
  paint();
})();
