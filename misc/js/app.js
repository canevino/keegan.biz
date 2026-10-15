(() => {
  'use strict';
  const O=window.Ornament;
  const $=id=>document.getElementById(id);
  const DEFAULT={mode:'marginalia',palette:'medieval',initial:'A',seed:472818,foliage:72,knots:56,letters:23,pigment:40,wear:19,showInitial:true,bleed:true,transparent:true};
  let settings={...DEFAULT}, svgString='',timer=null;
  const modes={marginalia:'botanical marginalia',initial:'decorated initial',interlace:'woven illumination',chromatic:'distorted pigments'};
  const controlIds=['mode','palette','initial','seed','foliage','knots','letters','pigment','wear'];
  function read(){
    for(let id of controlIds){let el=$(id);settings[id]=['seed','foliage','knots','letters','pigment','wear'].includes(id)?Number(el.value):el.value;}
    settings.initial=String(settings.initial).trim().slice(0,1).toUpperCase()||'A';
    settings.seed=(Number(settings.seed)>>>0)||1;
    settings.showInitial=$('initial-visible').checked;settings.bleed=$('bleed').checked;settings.transparent=$('transparent').checked;
  }
  function redraw(){read();for(let name of ['foliage','knots','letters','pigment','wear'])$(name+'-out').textContent=settings[name];
    svgString=O.render(settings);$('artwork').innerHTML=svgString;
    // The artboard remains transparent by default; a cream export is opt-in.
    $('artwork').setAttribute('aria-label',`${modes[settings.mode]} in ${settings.palette} ink, seed ${settings.seed}`);
    $('state-name').textContent=modes[settings.mode];$('seed-label').textContent='seed '+settings.seed;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(redraw,80)}
  function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
  function serialized(){
    if(settings.transparent)return svgString;
    return svgString.replace(/(<svg[^>]+>)/,'$1<rect x="0" y="0" width="880" height="1040" fill="#ece7d7"/>');
  }
  async function savePNG(){let el=$('save-png'),old=el.textContent;el.disabled=true;el.textContent='rendering…';try{
    let blob=new Blob([serialized()],{type:'image/svg+xml;charset=utf-8'});let url=URL.createObjectURL(blob);
    const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Could not render SVG'));image.src=url});
    let c=document.createElement('canvas');c.width=3200;c.height=Math.round(3200*1040/880);let ctx=c.getContext('2d');ctx.drawImage(image,0,0,c.width,c.height);URL.revokeObjectURL(url);
    const output=await new Promise(resolve=>c.toBlob(resolve,'image/png'));if(!output)throw new Error('PNG export failed');download(output,`illuminarium-${settings.mode}-${settings.seed}.png`);
  }catch(err){console.error(err);window.alert('PNG could not be exported. Please try the SVG export.')}finally{el.disabled=false;el.textContent=old}}
  for(let id of controlIds){let el=$(id);el.addEventListener(id==='seed'||id==='initial'||id==='mode'||id==='palette'?'change':'input',schedule);}
  for(let id of ['initial-visible','bleed','transparent'])$(id).addEventListener('change',redraw);
  $('regenerate').addEventListener('click',()=>{let a=new Uint32Array(1);if(window.crypto?.getRandomValues)window.crypto.getRandomValues(a);else a[0]=Math.floor(Math.random()*0xffffffff);$('seed').value=(a[0]||314159);redraw()});
  $('save-svg').addEventListener('click',()=>download(new Blob([serialized()],{type:'image/svg+xml;charset=utf-8'}),`illuminarium-${settings.mode}-${settings.seed}.svg`));
  $('save-png').addEventListener('click',savePNG);
  $('show-grid').addEventListener('change',e=>$('workspace').classList.toggle('has-grid',e.target.checked));
  $('reset').addEventListener('click',()=>{settings={...DEFAULT};for(let id of controlIds)$(id).value=DEFAULT[id];$('initial-visible').checked=true;$('bleed').checked=true;$('transparent').checked=true;$('show-grid').checked=false;$('workspace').classList.remove('has-grid');redraw()});
  $('intro-flourish').innerHTML=O.intro();redraw();
})();
