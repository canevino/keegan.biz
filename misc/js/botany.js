/* Botanical anatomy / species pass 1: each stem receives an actual plant profile.
   Pass 2 will supply Gothic geometry; this pass deliberately retains the existing
   layout axes and all v3 material/printing controls. No letters or knot grids. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const P=(x,y)=>({x,y}), add=(a,b,k=1)=>P(a.x+b.x*k,a.y+b.y*k), polar=(a,d)=>P(Math.cos(a)*d,Math.sin(a)*d), V=p=>M.vec(p.x,p.y), n=M.n;
 const angle=p=>Math.atan2(p.y,p.x), norm=p=>M.normal(p), clamp=M.clamp;
 function allowed(p,plan,margin=0){return M.inBounds(p,plan.bounds,margin);}
 function widthAt(w,t,tip=.35){return tip+(w-tip)*(1-t)**1.22;}
 function wavy(samples,r,motion,habit){
   const amp=motion*(habit==='arching'?1.14:habit==='climbing'?.85:habit==='heavy'?.68:1);
   let phase=r.between(-2,2);
   let out=samples.map(v=>{
     const nv=norm(v.tng),envelope=Math.sin(Math.PI*v.t)**1.23;
     const delta=amp*envelope*(.76*Math.sin(Math.PI*v.t*2.7+phase)+.27*Math.sin(Math.PI*v.t*5.1-phase*.68));
     return {...v,x:v.x+nv.x*delta,y:v.y+nv.y*delta};
   });
   for(let i=0;i<out.length;i++){
     const a=out[Math.max(0,i-1)],b=out[Math.min(out.length-1,i+1)];out[i].tng=M.unit(P(b.x-a.x,b.y-a.y));
   }
   return out;
 }
 function silhouette(points,base,tip=.3){
   const left=[],right=[];
   for(const p of points){const nv=norm(p.tng),w=widthAt(base,p.t,tip),noise=1+.027*Math.sin(p.t*41+base);left.push(add(p,nv,.5*w*noise));right.push(add(p,nv,-.5*w*noise));}
   return M.poly([...left,...right.reverse()]);
 }
 function spine(a,b,c,d,count,r,motion,habit){return wavy(M.wave(a,b,c,d,count),r,motion,habit);}
 function guidedSpine(stem,sp,r,motion,s){
   const raw=stem.naturalPoints||M.wave(stem.a,stem.b,stem.c,stem.d,100);
   // Drawn paths are already smoothed and arc-length sampled. Preserve their
   // authored direction; do not bend them toward generated Gothic guides.
   if(stem.userDrawn)return raw;
   const guided=stem.guidePoints;
   // Woody species resist the scaffold slightly; climbing vines follow it more
   // closely; fronds are particularly responsive to radial construction.
   const habitBias={climbing:1.09,twining:1.04,arching:.95,heavy:.88,fronds:1.06,upright:.97};
   const compliance=M.clamp((stem.guideAmount||0)*(habitBias[sp.habit]||1),0,1);
   const positions=raw.map((p,i)=>{
     const q=guided?.[i]||p;
     return {...p,x:p.x+(q.x-p.x)*compliance,y:p.y+(q.y-p.y)*compliance};
   });
   for(let i=0;i<positions.length;i++){
     const a=positions[Math.max(0,i-1)],b=positions[Math.min(positions.length-1,i+1)];
     positions[i].tng=M.unit(P(b.x-a.x,b.y-a.y));
   }
   // The underlying architecture remains legible at high compliance, but the
   // plant is never forced into ruler-straight paths.
   return wavy(positions,r,motion*(1-compliance*.76),sp.habit);
 }

 function stemInk(points,w,color,pal,r,s,major=false){
   const d=silhouette(points,w,major?1:.23);
   const trace=major?`stem-${r.int(1000,999999999)}`:`shoot-${r.int(1000,999999999)}`;
   const xs=points.map(p=>p.x),ys=points.map(p=>p.y),pad=w+8;
   const bounds={x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+2*pad,h:Math.max(...ys)-Math.min(...ys)+2*pad};
   let out=M.painted(trace,d,color,bounds,s,r,{stroke:major?.65:.45,lightweight:true,bark:true});
   if(major){
     const stroke=points.filter((_,i)=>i%3===0).map((p,i)=>{
       const off=norm(p.tng),vv=add(p,off,w*.09);return `${i?'L':'M'}${V(vv)}`;
     }).join('');
     out+=M.path(stroke,M.mix(color,pal.light,.27),.52,'opacity=".43"');
   }
   return out;
 }
 function anchored(point,side,width,advance=.8){return add(add(point,norm(point.tng),side*width*.46),point.tng,advance);}
 function petioleLeaf(p,a,size,sp,season,pal,r,plan,s){
   const probe=add(p,polar(a,size*.80));
   if(!allowed(probe,plan,3))return '';
   // Reserve an approximate area before committing a leaf; keep controlled
   // overlaps within a single spray but discourage independent collisions.
   const center=add(p,polar(a,size*.48));
   const radius=Math.max(3,size*(sp.habit==='fronds'?.12:sp.leaf==='holly'?.23:.20));
   const artwork=M.plantLeaf(sp,p,a,size,season,pal,r,s);
   if(!artwork)return '';
   if(plan.spatial && !plan.spatial.accept(center,radius,{
     group:plan.activeStem||'spray',density:s.foliage||65}))return '';
   return artwork;
 }
 function twigDetails(samples,sp,season,pal,r,plan,s){
   const kind=sp.leaf,tip=samples[samples.length-1],a=angle(tip.tng);
   let out='';
   const ts=sp.habit==='fronds'?[.22,.61]:sp.habit==='climbing'?[.25,.48,.70,.90]:[.26,.53,.79];
   const count=s.foliage<28?2:ts.length;
   for(let i=0;i<count;i++){
     const p=samples[Math.round(ts[i]* (samples.length-1))],side=i%2?1:-1;
     const phi=angle(p.tng)+side*(kind==='honeysuckle'?.86:kind==='fern'?.88:1.0);
     const len=r.between(kind==='holly'?12:14,kind==='oak'?31:24)*sp.scale;
     out+=petioleLeaf(anchored(p,side,1.3,1),phi,len,sp,season,pal,r,plan,s);
     if(kind==='honeysuckle')out+=petioleLeaf(anchored(p,-side,1.3,1),angle(p.tng)-side*.90,len*.95,sp,season,pal,r,plan,s);
   }
   if(r.chance(.28) || ['bramble','hawthorn'].includes(kind)){
     const q=samples[Math.round(samples.length*.56)],p=anchored(q,1,.7,0);
     if(['bramble','hawthorn','dogrose'].includes(kind))out+=M.path(`M${V(p)}l${M.vec(r.between(-4,4),-r.between(3,7))}`,M.wood(sp,pal,'mature',r),1.1);
   }
   if(r.chance(.44))out+=M.plantOrgan(sp,tip,a,season,pal,r,r.between(5.5,8));
   // Terminal ornament is a continuation of the twig, never free-floating.
   if(M.ornamentTerminal)out+=M.ornamentTerminal(sp,tip,a,r.between(7,13),pal,r,s);
   return out;
 }
 function shoot(start,tng,side,len,sp,season,pal,r,plan,s,sub=false){
   if(len<16)return '';
   const theta=angle(tng),turn=(sp.habit==='upright'?.68:sp.habit==='arching'?1.25:sp.habit==='twining'?1.38:sp.habit==='heavy'?.82:.98)*(1-M.clamp(s.conform||0,0,100)*.0015);
   const outAngle=theta+side*r.between(turn*.7,turn*1.3);
   let end=add(start,polar(outAngle,len));
   const attracted=M.attractShoot?M.attractShoot(start,end,plan.construction,s.conform||0,sp.habit):end;
   if(allowed(attracted,plan,7))end=attracted;
   if(!allowed(end,plan,7))return '';
   const b=add(start,polar(theta+side*turn*.35,len*.36));
   const c=add(end,polar(outAngle+Math.PI-side*r.between(.1,.45),len*.42));
   const points=spine(start,b,c,end,30,r,Math.min(8,len*.085)*(s.distortion/100+.42),sp.habit);
   const wood=M.wood(sp,pal,sub?'new':'mature',r),base=sub?r.between(.95,1.8):r.between(2.2,5.1);
   let out=stemInk(points,base,wood,pal,r,s);
   const leafCount=clamp(Math.round((sub?2:3.7)*sp.frequency*(.64+s.foliage/82)),1,sub?3:5);
   const pairs=sp.habit==='twining';
   for(let i=0;i<leafCount;i++){
     const t=.19+(i+.3)*.72/leafCount,p=points[Math.round(t*30)],sign=i%2?1:-1;
     const a=angle(p.tng)+sign*r.between(.75,1.15)*sp.angle;
     const size=len*(sub?r.between(.20,.28):r.between(.27,.39))*sp.scale*(1-.2*t);
     const attachment=anchored(p,sign,widthAt(base,t,.25),.5);
     out+=petioleLeaf(attachment,a,size,sp,season,pal,r,plan,s);
     if(pairs)out+=petioleLeaf(anchored(p,-sign,widthAt(base,t,.25),.5),angle(p.tng)-sign*.85,size*.95,sp,season,pal,r,plan,s);
   }
   if(sp.habit==='climbing' && r.chance(.46)){
     const p=points[Math.round(r.between(.3,.66)*30)];
     for(const side of [-1,1])out+=M.path(`M${V(p)}q${M.vec(side*4,2)} ${M.vec(side*8,6)}`,M.wood(sp,pal,'new',r),.65,'opacity=".74"');
   }
   if(['bramble','hawthorn','dogrose'].includes(sp.leaf)){
     for(let i=0;i<2;i++){
       const p=points[Math.round((.27+i*.33)*30)],dir=angle(p.tng)+ (i%2?1:-1)*1.55;
       out+=M.path(`M${V(p)}l${M.vec(Math.cos(dir)*r.between(3,6),Math.sin(dir)*r.between(3,6))}`,wood,.72);
     }
   }
   if(!sub && sp.habit!=='fronds' && r.chance(.48*s.foliage/100)){
     const j=Math.round(r.between(.43,.65)*30),p=points[j],sign=r.sign();
     out+=shoot(anchored(p,sign,widthAt(base,p.t,.25)),p.tng,sign,len*r.between(.28,.43)*sp.twigs,sp,season,pal,r,plan,s,true);
   }
   if(sp.habit==='fronds' || r.chance(.12))out+=twigDetails(points,sp,season,pal,r,plan,s);
   else if(r.chance(.62))out+=M.plantOrgan(sp,points[30],angle(points[30].tng),season,pal,r,r.between(6,10));
   // Add restrained foliate ornament at true branch nodes, not loose symbols.
   if(M.ornamentJunction && !sub){
     const i=Math.round(r.between(.35,.72)*30),p=points[i],a=angle(p.tng)+r.sign()*r.between(.74,1.18);
     out+=M.ornamentJunction(sp,p,a,r.between(9,17),pal,r,s,plan,'joint');
   }
   if(M.ornamentTerminal && !sub)out+=M.ornamentTerminal(sp,points[30],angle(points[30].tng),r.between(9,16),pal,r,s);
   if(M.ornamentSplitTip && !sub)out+=M.ornamentSplitTip(sp,points[30],angle(points[30].tng),r.between(9,19),pal,r,s,plan);
   return out;
 }
 function fernStem(points,sp,season,pal,r,plan,s){
   let out='';
   const count=Math.round(4+s.foliage/16);
   for(let i=0;i<count;i++){
     const t=.12+(i+.45)*.78/count,p=points[Math.round(t*100)],side=i%2?1:-1;
     const a=angle(p.tng)+side*r.between(.75,1.3),len=r.between(75,145)*(1-t*.28);
     out+=petioleLeaf(anchored(p,side,4,.8),a,len,sp,season,pal,r,plan,s);
   }
   return out;
 }
 function stemSpecies(s,r,index){
   if(s.species==='hybrid')return M.chooseSpecies('acanthus',r); // main stem is acanthus; named hybrids chosen per shoots
   return M.chooseSpecies(s.species,r);
 }
 M.botanical=(plan,s,r)=>{
   if(s.foliage<=0)return '';
   const pal=s.pal,season=s.season||'summer',fol=s.foliage/100;
   let back='',front='';
   plan.spatial=M.makeSpatialField?M.makeSpatialField():null;
   const stems=plan.stems.slice(0,fol<.13?1:plan.stems.length);
   for(let k=0;k<stems.length;k++){
     const stem=stems[k],sp=stemSpecies(s,r,k),motion=(.45+clamp(s.distortion/100,0,1)*1.7)*r.between(13,26);
     plan.activeStem='stem-'+stem.id;
     const points=guidedSpine(stem,sp,r,motion,s);
     stem.drawnPoints=points;
     const base=stem.width*(sp.habit==='heavy'?1.24:sp.habit==='climbing'?.53:sp.habit==='fronds'?.36:.88) * (k>=2 && plan.conform>.2?.68+.32*plan.conform:1);
     const wood=M.wood(sp,pal,'mature',r);
     back+=`<g data-trunk="${sp.name}" filter="url(#press)">${stemInk(points,base,wood,pal,r,s,true)}</g>`;
     let body='';
     if(sp.habit==='fronds'){
       body+=fernStem(points,sp,season,pal,r,plan,s);
     } else {
       let count=clamp(Math.round((stem.major?10:7)*sp.frequency*(.35+fol*.85)),2,15);
       if(season==='winter'&&!sp.evergreen)count=Math.round(count*.85);
       for(let i=0;i<count;i++){
         const t=clamp(.10+(i+.56)*.76/count+r.between(-.015,.015),.07,.92),idx=Math.round(t*100),p=points[idx];
         const side=((i%2===0?stem.side:-stem.side)||1)*(r.chance(.08)?-1:1);
         const length=r.between(stem.major?75:55,stem.major?145:112)*sp.scale*(1-.21*t);
         const identity=s.species==='hybrid'?M.chooseSpecies(r.choose(['holly','ivy','dogrose','hazel','oak','acanthus']),r):sp;
         const launch=anchored(p,side,widthAt(base,t,1),.25);
         body+=shoot(launch,p.tng,side,length,identity,season,pal,r,plan,s);
       }
       // Basal leaves are attached to the actual root and inherit the stem species.
       for(let i=0;i<(sp.habit==='climbing'?1:2);i++){
         const t=.045+i*.038,p=points[Math.round(t*100)],side=i%2?1:-1;
         const a=angle(p.tng)+side*r.between(.8,1.3),len=r.between(27,46)*sp.scale;
         body+=petioleLeaf(anchored(p,side,widthAt(base,t,1)),a,len,sp,season,pal,r,plan,s);
       }
     }
     if(r.chance(.75)){
       const tip=points[100],ang=angle(tip.tng);
       body+=M.plantOrgan(sp,tip,ang,season,pal,r,r.between(6,9));
     }
     if(M.ornamentTerminal && sp.habit!=='fronds')body+=M.ornamentTerminal(sp,points[100],angle(points[100].tng),r.between(10,19),pal,r,s);
     if(M.ornamentJunction && M.ornamentLevel(s)>.56 && sp.habit!=='fronds'){
       const ti=Math.round(r.between(.32,.58)*100),node=points[ti];
       body+=M.ornamentJunction(sp,node,angle(node.tng)+stem.side*1.22,r.between(12,20),pal,r,s,plan,'joint');
     }
     front+=`<g data-plant="${sp.name}" filter="url(#press)">${body}</g>`;
   }
   return `<g id="woody-branches">${back}</g><g id="botanical-canopy">${front}</g>`;
 };
})(window.MS);
