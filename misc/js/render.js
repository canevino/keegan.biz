/* Botanical-only layer compositor.
   Letters, ivy grids, and detached knot compartments are intentionally removed. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const N=M.n;
 function attachedPenwork(plan,s,r){
   if(s.detail<18||!plan.stems.length)return '';
   const pal=s.pal,amount=Math.round(s.detail/29),parts=[];
   for(let i=0;i<Math.min(amount,4);i++){
     const stem=plan.stems[i%plan.stems.length],t=r.between(.24,.79),base=M.bezier(stem.a,stem.b,stem.c,stem.d,t),tan=M.tangent(stem.a,stem.b,stem.c,stem.d,t);
     const side=i%2?-1:1,normal=M.normal(tan),radius=r.between(9,16);
     const start={x:base.x+normal.x*side*5,y:base.y+normal.y*side*5};
     const center={x:start.x+normal.x*side*radius*1.3,y:start.y+normal.y*side*radius*1.3};
     let pts=[];
     for(let j=0;j<28;j++){
       const tt=j/27,angle=tt*Math.PI*3.4*side,rr=radius*(1-tt*.92);
       pts.push({x:center.x+rr*Math.cos(angle),y:center.y+rr*Math.sin(angle)});
     }
     pts[0]=start;
     const d=pts.map((p,j)=>(j?'L':'M')+M.vec(p.x,p.y)).join('');
     parts.push(M.path(d,r.choose([pal.vermillion,pal.ochre,pal.green]),r.between(.65,1.25),`opacity="${N(r.between(.56,.78))}"`));
   }
   return `<g filter="url(#dry-print)">${parts.join('')}</g>`;
 }
 M.render=(settings)=>{
   const s={...settings,pal:M.palette(settings.palette)},root=Number(s.seed)>>>0||1;
   const plan=M.plan(s,M.rng(M.childSeed(root,0xaced0081)));
   const pigmentR=M.rng(M.childSeed(root,17)),finishR=M.rng(M.childSeed(root,29));
   let body='';
   body+=M.botanical(plan,s,M.rng(M.childSeed(root,43)));
   if(s.detail>0)body+=attachedPenwork(plan,s,M.rng(M.childSeed(root,44)));
   const defs=M.pigmentDefs(s,pigmentR)+M.finishDefs(s,finishR);
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${M.W} ${M.H}" width="${M.W}" height="${M.H}" role="img" aria-label="Generated botanical ornament"><defs>${defs}</defs><g id="artwork-layers">${body}</g></svg>`;
 };
})(window.MS);
