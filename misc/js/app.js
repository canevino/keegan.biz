/* Browser controller. UI controls change the entire seeded SVG, not merely a filter. */
(() => {
  'use strict';
  const O=window.Ornament;
  const $=id=>document.getElementById(id);
  const IDs=['density','knots','growth','letters','damage','bleed','misprint'];
  const presets={interlace:[65,97,28,24,58,57,25],thicket:[73,26,100,36,81,68,36],type:[49,39,18,100,85,66,51],rupture:[71,75,79,82,100,92,89]};
  let markup='',painted=[],painting=false,active=false,points=[],touchWas=false;
  function randomSeed(){
    if(window.crypto&&window.crypto.getRandomValues){const n=new Uint32Array(1);window.crypto.getRandomValues(n);return n[0]||1;}
    return (Math.random()*4294967295)>>>0||1;
  }
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function getSettings(){
    const seed=(parseInt($('seed').value,10)||1)>>>0;
    const s={seed,mode:$('mode').value,palette:$('palette').value};
    IDs.forEach(id=>s[id]=Number($(id).value));
    return s;
  }
  function sync(){IDs.forEach(id=>$(id+'-value').textContent=$(id).value);}
  function updateUndo(){ $('undo').disabled=painted.length===0; $('clear').disabled=painted.length===0; }
  let pending=0;
  function schedule(){cancelAnimationFrame(pending);pending=requestAnimationFrame(draw);}
  function draw(){
    try {
      const state=getSettings(),result=O.compose(state,painted);
      markup=result.svg;
      $('art').innerHTML=markup;
      $('descriptor').textContent=result.structure+' / '+result.mode;
      $('status').textContent='seed '+state.seed;
      sync();updateUndo();
    } catch(err){console.error(err);$('status').textContent='render error — check console';}
  }
  function newComposition(){ $('seed').value=randomSeed();schedule(); }
  function applyMode(){
    const values=presets[$('mode').value];
    if(values)IDs.forEach((id,i)=>$(id).value=values[i]);
    newComposition();
  }
  function pointerToPoint(ev){
    const box=$('artbox').getBoundingClientRect();
    return {x:clamp((ev.clientX-box.left)/box.width*O.W,-180,O.W+180),y:clamp((ev.clientY-box.top)/box.height*O.H,-180,O.H+180)};
  }
  function scribble(){
    const d=points.length?'M'+points.map(p=>`${O.f(p.x)} ${O.f(p.y)}`).join(' L'):'';
    $('scribble-path').setAttribute('d',d);
  }
  function setPaint(is){
    active=is;
    $('paint').setAttribute('aria-pressed',String(active));
    $('paint').textContent=active?'finish drawing ×':'draw a vine +';
    $('artbox').classList.toggle('paint-active',active);
  }
  function pushPoint(ev){
    const pt=pointerToPoint(ev),last=points.at(-1);
    if(!last||Math.hypot(pt.x-last.x,pt.y-last.y)>5)points.push(pt);
    scribble();
  }
  function strokeStart(ev){if(!active||ev.button>0)return;ev.preventDefault();painting=true;points=[];$('artbox').setPointerCapture?.(ev.pointerId);pushPoint(ev);}
  function strokeMove(ev){
    if(painting){ev.preventDefault();pushPoint(ev);return;}
    if(!active&&ev.pointerType!=='touch')disturb(ev);
  }
  function strokeStop(ev){
    if(!painting)return;
    painting=false;pushPoint(ev);
    if(points.length>1)painted.push(points.map(p=>({...p})));
    points=[];scribble();schedule();
  }
  // The illustrator-manuscript inspiration becomes gentle proximity-based text displacement,
  // not a dragon, physics simulation, or costly canvas/DOM re-layout.
  function disturb(ev){
    const svg=$('art').querySelector('svg');if(!svg)return;
    const bounds=$('artbox').getBoundingClientRect(),ratio=O.W/bounds.width;
    svg.querySelectorAll('.field-glyph[data-field]').forEach(g=>{
      if(!g.dataset.base)g.dataset.base=g.getAttribute('transform')||'';
      const rect=g.getBoundingClientRect(),mx=(rect.left+rect.right)*.5,my=(rect.top+rect.bottom)*.5;
      const dx=mx-ev.clientX,dy=my-ev.clientY,d=Math.hypot(dx,dy),radius=145;
      const force=Math.max(0,1-d/radius);
      if(d<radius&&d>1){const amount=force*force*38*ratio;g.setAttribute('transform',`translate(${O.f(dx/d*amount)} ${O.f(dy/d*amount)}) ${g.dataset.base}`);}
      else g.setAttribute('transform',g.dataset.base);
    });
  }
  function resetDisturb(){
    $('art').querySelectorAll('.field-glyph[data-base]').forEach(g=>g.setAttribute('transform',g.dataset.base));
  }
  function save(blob,filename){
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function svgSource(){return '<?xml version="1.0" encoding="UTF-8"?>\n'+markup;}
  function exportSVG(){save(new Blob([svgSource()],{type:'image/svg+xml;charset=utf-8'}),`ornament-${getSettings().seed}.svg`);}
  async function exportPNG(){
    const button=$('export-png'),old=button.textContent;button.disabled=true;button.textContent='rendering…';
    const target=+($('export-size').value),height=Math.round(target*O.H/O.W);
    const svgBlob=new Blob([svgSource()],{type:'image/svg+xml;charset=utf-8'});
    const url=URL.createObjectURL(svgBlob);
    try{
      const img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Could not rasterize SVG'));img.src=url;});
      const canvas=document.createElement('canvas');canvas.width=target;canvas.height=height;
      const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw Error('Canvas context unavailable');
      ctx.clearRect(0,0,target,height);ctx.drawImage(img,0,0,target,height);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw Error('Failed PNG encoding');
      save(blob,`ornament-${getSettings().seed}-${target}.png`);
      $('status').textContent='transparent PNG saved';
    }catch(e){console.error(e);$('status').textContent='png export failed — try svg';}
    finally{URL.revokeObjectURL(url);button.disabled=false;button.textContent=old;}
  }
  $('seed').value=randomSeed();
  $('new').addEventListener('click',newComposition);
  $('repeat').addEventListener('click',schedule);
  $('seed').addEventListener('keydown',e=>{if(e.key==='Enter')schedule();});
  $('mode').addEventListener('change',applyMode);
  $('palette').addEventListener('change',schedule);
  IDs.forEach(id=>$(id).addEventListener('input',()=>{sync();schedule();}));
  $('paint').addEventListener('click',()=>setPaint(!active));
  $('undo').addEventListener('click',()=>{painted.pop();schedule();});
  $('clear').addEventListener('click',()=>{painted=[];schedule();});
  $('checker').addEventListener('change',()=>{$('artbox').classList.toggle('checker-on',$('checker').checked);});
  $('artbox').addEventListener('pointerdown',strokeStart);
  $('artbox').addEventListener('pointermove',strokeMove);
  $('artbox').addEventListener('pointerup',strokeStop);
  $('artbox').addEventListener('pointercancel',strokeStop);
  $('artbox').addEventListener('pointerleave',resetDisturb);
  $('export-svg').addEventListener('click',exportSVG);
  $('export-png').addEventListener('click',exportPNG);
  document.addEventListener('keydown',e=>{
    const tag=document.activeElement?.tagName;
    if(['INPUT','SELECT','TEXTAREA'].includes(tag)||e.metaKey||e.ctrlKey||e.altKey)return;
    if(e.key.toLowerCase()==='n')newComposition();
    if(e.key.toLowerCase()==='b')setPaint(!active);
    if(e.key==='Escape'&&active)setPaint(false);
  });
  sync();schedule();
})();
