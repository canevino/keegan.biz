/* Animation never rebuilds the artwork. Each specimen is drawn only once:
   the animation exposes existing wood, shoots, leaves, buds and fruit. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const ns='http://www.w3.org/2000/svg';
 let current=null,serial=0;
 const list=(el,sel)=>Array.from(el.querySelectorAll(sel));
 const make=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el;};
 const easing='cubic-bezier(.25,.08,.36,1)';
 function cancel(){
   const s=current;if(!s)return;current=null;
   clearTimeout(s.end);
   // Releasing the animations exposes the COMPLETE source SVG, not a new render.
   for(const a of s.animations){try{a.cancel()}catch(_){}}
   for(const el of s.masked)el.removeAttribute('mask');
   s.defs.remove();s.art.classList.remove('is-growing');
   for(const el of s.life)el.style.removeProperty('display');
 }
 function play(art){
   cancel();if(!art||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
   const trunks=list(art,'.growth-primary'),shoots=list(art,'.growth-shoot'),leaves=list(art,'.growth-leaf'),organs=list(art,'.growth-organ');
   if(!trunks.length)return;
   const defs=make('defs');art.insertBefore(defs,art.firstChild);
   const s={art,defs,animations:[],masked:[],life:[],end:null};current=s;
   art.classList.add('is-growing');
   const animate=(el,frames,delay,duration,ease=easing)=>{
     const a=el.animate(frames,{delay,duration,easing:ease,fill:'both'});
     s.animations.push(a);return a;
   };
   // Growth masks belong to WOOD ONLY. A mask on the whole specimen caused
   // the large cut-off edges and disembodied leaves in previous builds.
   function growPath(el,d,delay,duration,maxWidth){
     if(!el||!d)return;
     const pen=make('path',{d,fill:'none',stroke:'#fff','stroke-width':maxWidth,
       'stroke-linecap':'round','stroke-linejoin':'round'});
     let len=0;try{len=pen.getTotalLength()}catch(_){}
     if(!(len>0))return animate(el,[{opacity:0},{opacity:1}],delay,duration);
     const id='botanical-growth-'+(++serial),mask=make('mask',{
       id,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:-160,y:-160,width:M.W+320,height:M.H+320
     });
     pen.style.strokeDasharray=String(len+4);
     pen.style.strokeDashoffset=String(len+4);
     mask.appendChild(pen);defs.appendChild(mask);
     el.setAttribute('mask',`url(#${id})`);s.masked.push(el);
     animate(pen,[{strokeDashoffset:String(len+4)},{strokeDashoffset:'0'}],delay,duration,'linear');
   }
   const trunkTime=3800;
   trunks.forEach((trunk,i)=>{
     const isFern=trunk.closest('[data-trunk="fern"]');
     growPath(trunk,trunk.getAttribute('data-growpath'),i*95,trunkTime,isFern?5:58);
   });
   const totalShoots=shoots.length;
   shoots.forEach((shoot,i)=>{
     const parent=shoot.parentElement?.closest('.growth-shoot');
     const t=Number(shoot.getAttribute('data-root-t')||.4);
     const delay=parent ? 3100+(i%13)*75 : 1200+t*2200+(i%7)*65;
     const duration=1400+(i%4)*110;
     const wood=shoot.querySelector(':scope > .shoot-wood');
     growPath(wood,shoot.getAttribute('data-growpath'),delay,duration,18);
     // Attached leaf sets grow only AFTER this specific twig reaches them.
     const fol=shoot.querySelector(':scope > .shoot-foliage');
     if(fol){const children=list(fol,'.growth-leaf');
       children.forEach((leaf,j)=>{
         const position=(j+1)/(children.length+1);
         leaf.style.transformBox='view-box';
         const xy=(leaf.getAttribute('data-attachment')||'425 500').split(' ').map(Number);
         leaf.style.transformOrigin=`${xy[0]}px ${xy[1]}px`;
         animate(leaf,[{opacity:0,transform:'scale(.05)'},{opacity:1,transform:'scale(1)'}],delay+duration*.38+duration*.55*position,570);
       });
     }
     // This includes attached ornamental details and their nested smaller twigs;
     // keep it after the wood is established to avoid disembodied decorations.
     const detail=shoot.querySelector(':scope > .shoot-details');
     if(detail)animate(detail,[{opacity:0},{opacity:1}],delay+duration*.8,710);
   });
   // Leaves directly on a primary axis, not inside a side shoot.
   const trunkLeaves=leaves.filter(l=>!l.closest('.growth-shoot'));
   trunkLeaves.forEach((leaf,i)=>{
     const xy=(leaf.getAttribute('data-attachment')||'425 500').split(' ').map(Number);
     leaf.style.transformBox='view-box';leaf.style.transformOrigin=`${xy[0]}px ${xy[1]}px`;
     animate(leaf,[{opacity:0,transform:'scale(.05)'},{opacity:1,transform:'scale(1)'}],2900+i*3100/Math.max(1,trunkLeaves.length),650);
   });
   // Reproductive stages are always descendants of an attached stem. Their
   // final illustrated state is restored in-place when the timeline finishes.
   organs.forEach((organ,i)=>{
     const bud=organ.querySelector(':scope > .life-bud');
     const bloom=organ.querySelector(':scope > .life-bloom');
     const final=organ.querySelector(':scope > .life-final');
     if(!bud||!bloom||!final)return;
     const t=5900+(i%19)*86;
     for(const el of [bud,bloom,final]){el.style.display='inline';s.life.push(el);}
     animate(bud,[{opacity:0},{opacity:1},{opacity:1},{opacity:0}],t,1650);
     animate(bloom,[{opacity:0},{opacity:0},{opacity:1},{opacity:0}],t+920,1500);
     animate(final,[{opacity:0},{opacity:0},{opacity:1}],t+2140,790);
   });
   // DO NOT repaint when ending: that previously caused one-frame flashes.
   s.end=setTimeout(()=>{if(current===s)cancel();},10700);
 }
 M.growthAnimation={play,cancel};
})(window.MS);
