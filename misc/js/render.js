/* Botanical-only layer compositor.
   Letters, ivy grids, and detached knot compartments are intentionally removed. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const N=M.n;
 function attachedPenwork(plan,s,r){
   if(s.detail<18||!plan.stems.length)return '';
   const pal=s.pal,amount=Math.round(s.detail/31),parts=[];
   for(let i=0;i<Math.min(amount,4);i++){
     const stem=plan.stems[i%plan.stems.length],t=r.between(.26,.77),point=stem.drawnPoints?.[Math.round(t*100)],base=point||M.bezier(stem.a,stem.b,stem.c,stem.d,t),tan=point?.tng||M.tangent(stem.a,stem.b,stem.c,stem.d,t);
     const side=i%2?-1:1,normal=M.normal(tan),reach=r.between(7,14),lead={x:base.x+normal.x*side*3.6,y:base.y+normal.y*side*3.6};
     const c1={x:lead.x+normal.x*side*reach*.58+tan.x*reach*.24,y:lead.y+normal.y*side*reach*.58+tan.y*reach*.24};
     const tip={x:lead.x+normal.x*side*reach+tan.x*reach*.10,y:lead.y+normal.y*side*reach+tan.y*reach*.10};
     const back={x:tip.x-tan.x*reach*.22+normal.x*side*reach*.16,y:tip.y-tan.y*reach*.22+normal.y*side*reach*.16};
     const color=r.choose([pal.vermillion,pal.ochre,pal.green]);
     let d=`M${M.vec(base.x,base.y)}Q${M.vec(c1.x,c1.y)} ${M.vec(tip.x,tip.y)}`;
     d+=`Q${M.vec(back.x,back.y)} ${M.vec(lead.x,lead.y)}`;
     parts.push(M.path(d,color,r.between(.52,.92),`opacity="${N(r.between(.24,.46))}"`));
     if(r.chance(.55)){
       const side2=-side,tip2={x:lead.x+normal.x*side2*reach*.74+tan.x*reach*.08,y:lead.y+normal.y*side2*reach*.74+tan.y*reach*.08};
       const c2={x:lead.x+normal.x*side2*reach*.44+tan.x*reach*.16,y:lead.y+normal.y*side2*reach*.44+tan.y*reach*.16};
       parts.push(M.path(`M${M.vec(base.x,base.y)}Q${M.vec(c2.x,c2.y)} ${M.vec(tip2.x,tip2.y)}`,
         M.mix(color,pal.ink,.16),r.between(.42,.72),`opacity="${N(r.between(.18,.34))}"`));
     }
   }
   return `<g filter="url(#dry-print)">${parts.join('')}</g>`;
 }
 M.render=(settings)=>{
   const s={...settings,pal:M.palette(settings.palette)},root=Number(s.seed)>>>0||1;
   const plan=M.plan(s,M.rng(M.childSeed(root,0xaced0081)));
   M.lastConstruction=plan.construction;
   const pigmentR=M.rng(M.childSeed(root,17)),finishR=M.rng(M.childSeed(root,29));
   let body='';
   const drawR=M.rng(M.childSeed(root,43));
   body+=M.botanical(plan,s,drawR);
   if((Number(s.ornament||0)>18 || Number(s.detail||0)>62) && plan.stems?.length){
     body+=attachedPenwork(plan,s,M.rng(M.childSeed(root,61)));
   }
   M.lastGrowthPaths=plan.stems.filter(v=>v.drawnPoints?.length).map(v=>v.drawnPoints.map(p=>({x:p.x,y:p.y})));
   // Small-details control now affects plant veins, leaflets, bark and organs;
   // it no longer scatters independent scrolls across the composition.
   const defs=M.pigmentDefs(s,pigmentR)+M.finishDefs(s,finishR);
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${M.W} ${M.H}" width="${M.W}" height="${M.H}" role="img" aria-label="Generated botanical ornament"><defs>${defs}</defs><g id="artwork-layers" filter="url(#impression)">${body}</g></svg>`;
 };
})(window.MS);
