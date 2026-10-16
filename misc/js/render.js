/* Pass 2 layer compositor. The planner governs all major elements.
   Interlace is clipped to organic cartouches or braided along a botanical
   artery, not scattered as detached rectangular knot-grid tiles. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const N=M.n;
 function cartouches(plan,s,r){
   if(s.knots===0)return '';
   const pal=s.pal,cols=[pal.ink,pal.lapis,pal.ochre,pal.vermillion,pal.green];
   let z='';
   for(const c of plan.compartments){
     if(plan.mode!=='interlace'&&s.knots<21)break;
     if(c.at){
       // Fine stalk links each ornament compartment to a real growing axis.
       const dx=c.x-c.at.x,dy=c.y-c.at.y,dist=Math.hypot(dx,dy)||1;
       const end={x:c.x-dx/dist*Math.min(c.rx,c.ry)*.72,y:c.y-dy/dist*Math.min(c.rx,c.ry)*.72};
       z+=M.path(`M${M.vec(c.at.x,c.at.y)} Q${M.vec((c.at.x+end.x)/2+dy*.10,(c.at.y+end.y)/2-dx*.10)} ${M.vec(end.x,end.y)}`,
         M.mix(pal.green,pal.ink,.28),1.8,`opacity=".75"`);
     }
     z+=M.knotCartouche(c,{density:.34+s.knots*.0055,distort:s.distortion/260,misprint:s.distortion/400},cols,r);
   }
   return z;
 }
 function attachedPenwork(plan,s,r){
   if(s.detail<18||!plan.stems.length)return '';
   const pal=s.pal,amount=Math.round(s.detail/29),parts=[];
   for(let i=0;i<Math.min(amount,3);i++){
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
     parts.push(M.path(d,r.choose([pal.vermillion,pal.ochre,pal.green]),r.between(.65,1.25),`opacity=".68"`));
     if(s.detail>55){
       const final=pts[pts.length-1];
       for(let k=0;k<4;k++){
         const a=k*Math.PI*.5;
         parts.push(M.circle(final.x+Math.cos(a)*radius*.18,final.y+Math.sin(a)*radius*.18,r.between(.65,1.3),r.choose([pal.ochre,pal.ink,pal.vermillion]),'opacity=".7"'));
       }
     }
   }
   return `<g filter="url(#dry-print)">${parts.join('')}</g>`;
 }
 function fragments(plan,s,r){
   if(s.fragments < 20)return '';
   const p=s.pal,chunks=['I','V','X','M','n','m','ꝏ','†','✣'];
   const n=Math.floor((s.fragments-12)*.13),parts=[];
   for(let i=0;i<n;i++){
     const side=r.choose(['top','bottom','left','right']),x=side==='left'?r.between(75,160):side==='right'?r.between(690,790):r.between(160,680);
     const y=side==='top'?r.between(90,190):side==='bottom'?r.between(840,930):r.between(220,795);
     const size=r.between(12,34)+(s.fragments>75?r.between(0,23):0);
     const ch=r.choose(chunks),rotation=r.between(-24,24);
     parts.push(`<g transform="translate(${M.vec(x,y)}) rotate(${N(rotation)})" filter="url(#dry-print)" opacity="${N(r.between(.18,.5))}"><text x="0" y="0" font-family="Georgia,serif" font-size="${N(size)}" fill="${r.choose([p.ink,p.vermillion,p.lapis])}">${M.escape(ch)}</text></g>`);
   }
   return parts.join('');
 }
 M.render=(settings)=>{
   const s={...settings,pal:M.palette(settings.palette)},root=Number(s.seed)>>>0||1;
   const plan=M.plan(s,M.rng(M.childSeed(root,0xaced0081)));
   const pigmentR=M.rng(M.childSeed(root,17)),finishR=M.rng(M.childSeed(root,29));
   let body='';
   body+=cartouches(plan,s,M.rng(M.childSeed(root,40)));
   body+=M.initial(plan,s,M.rng(M.childSeed(root,42)));
   body+=M.botanical(plan,s,M.rng(M.childSeed(root,43)));
   if(s.detail>0)body+=attachedPenwork(plan,s,M.rng(M.childSeed(root,44)));
   body+=fragments(plan,s,M.rng(M.childSeed(root,45)));
   const defs=M.pigmentDefs(s,pigmentR)+M.finishDefs(s,finishR);
   return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${M.W} ${M.H}" width="${M.W}" height="${M.H}" role="img" aria-label="Generated ornamental artwork">`+
     `<defs>${defs}</defs><g id="artwork-layers">${body}</g></svg>`;
 };
})(window.MS);
