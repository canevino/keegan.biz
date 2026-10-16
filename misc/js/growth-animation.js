/* SVG growth sequence: woody axes first, then shoots, then attached leaves,
   finally buds, open flowers and the selected season's fruit/flowers.
   All animation is screen-only; downloaded SVG/PNG contains final art. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 let current=null;
 const ease='cubic-bezier(.28,.05,.43,1)';
 const q=(root,sel)=>[...root.querySelectorAll(sel)];
 const create=(tag,attrs={})=>{
   const el=document.createElementNS(ns,tag);
   for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
   return el;
 };
 function cancel(){
   if(!current)return;
   const session=current;current=null;
   session.timers.forEach(t=>clearTimeout(t));
   session.animations.forEach(a=>{try{a.cancel()}catch(_){}});
   session.art?.classList.remove('is-growing');
   session.masks?.remove();
   session.targets.forEach(({el,mask})=>{if(el?.isConnected)el.removeAttribute('mask');});
 }
 function play(art){
   cancel();
   if(!art||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
   const stems=q(art,'.growth-primary');
   const shoots=q(art,'.growth-shoot');
   const leaves=q(art,'.growth-leaf');
   const organs=q(art,'.growth-organ');
   if(!stems.length)return;
   const session={art,animations:[],timers:[],targets:[],masks:null};current=session;
   const defs=create('defs');art.insertBefore(defs,art.firstChild);session.masks=defs;
   art.classList.add('is-growing');
   function later(cb,delay){const t=setTimeout(()=>{if(current===session)cb();},delay);session.timers.push(t);}
   function runAnimation(el,from,to,{delay=0,duration=1000,easing=ease}={}){
     const animation=el.animate([from,to],{delay,duration,fill:'forwards',easing});
     session.animations.push(animation);return animation;
   }
   function revealWood(el,centerline,delay,duration,width){
     if(!el||!centerline)return;
     const marker=create('path',{d:centerline,stroke:'white','stroke-width':width,fill:'none','stroke-linejoin':'round','stroke-linecap':'round'});
     const length=marker.getTotalLength?.()||0;
     if(!Number.isFinite(length)||length<=0)return;
     const mask=create('mask',{id:'growing-mask-'+Math.random().toString(36).slice(2),maskUnits:'userSpaceOnUse',x:-110,y:-110,width:M.W+220,height:M.H+220});
     marker.style.strokeDasharray=String(length+2);marker.style.strokeDashoffset=String(length+2);
     mask.appendChild(marker);defs.appendChild(mask);
     el.setAttribute('mask',`url(#${mask.id})`);session.targets.push({el,mask});
     runAnimation(marker,{strokeDashoffset:String(length+2)},{strokeDashoffset:'0'},{delay,duration});
   }
   const totalMain=3000;
   stems.forEach((stem,i)=>revealWood(stem,stem.getAttribute('data-growpath'),i*240,totalMain,65));
   const branchStart=2700, branchDuration=1900;
   const animateShoots=shoots.length<125;
   shoots.forEach((shoot,i)=>{
     const t=Number(shoot.getAttribute('data-root-t')||(.15+(i%9)*.07));
     const delay=branchStart+t*1100+(i%5)*95;
     const wood=shoot.querySelector(':scope > .shoot-wood');
     const fol=shoot.querySelector(':scope > .shoot-foliage');
     const details=shoot.querySelector(':scope > .shoot-details');
     if(animateShoots&&wood)revealWood(wood,shoot.getAttribute('data-growpath'),delay,branchDuration,48);
     else if(wood)runAnimation(wood,{opacity:0},{opacity:1},{delay,duration:branchDuration});
     if(fol)runAnimation(fol,{opacity:0},{opacity:1},{delay:delay+branchDuration*.66,duration:1500});
     if(details)runAnimation(details,{opacity:0},{opacity:1},{delay:delay+branchDuration+400,duration:1200});
   });
   // Leaves expand from petiole junctions, not from the drawing center.
   const revealLeaves=leaves.length<=360;
   if(revealLeaves)leaves.forEach((leaf,i)=>{
     const raw=leaf.getAttribute('data-attachment')||'0 0',pos=raw.split(/\s+/).map(Number);
     const anchor=pos.length>=2?`${pos[0]}px ${pos[1]}px`:'center center';
     leaf.style.transformBox='view-box';leaf.style.transformOrigin=anchor;
     runAnimation(leaf,{opacity:0,transform:'scale(.08)'},{opacity:1,transform:'scale(1)'},
       {delay:4300+(i%31)*53,duration:1050});
   });
   const organStart=5850;
   organs.forEach((organ,i)=>{
     const offset=(i%17)*70;
     const bud=organ.querySelector(':scope > .life-bud');
     const bloom=organ.querySelector(':scope > .life-bloom');
     const final=organ.querySelector(':scope > .life-final');
     if(!bud||!bloom||!final)return;
     // Use real intermediates, not simultaneous fade-in of all mature organs.
     bud.style.display='';bloom.style.display='none';final.style.display='none';
     runAnimation(bud,{opacity:0},{opacity:1},{delay:organStart+offset,duration:580});
     later(()=>{bud.style.display='none';bloom.style.display='';runAnimation(bloom,{opacity:0},{opacity:1},{duration:420});},organStart+offset+680);
     later(()=>{bloom.style.display='none';final.style.display='';runAnimation(final,{opacity:0},{opacity:1},{duration:600});},organStart+offset+1800);
   });
   later(()=>{
     if(current!==session)return;
     // Replacing the SVG with a clean final render also removes all motion
     // masks and animated CSS without altering geometry or export state.
     if(typeof M.animationComplete==='function')M.animationComplete();
     else cancel();
   },9400);
 }
 M.growthAnimation={play,cancel};
})(window.MS);
