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
   // Two long waves, rather than repeated local zigzags. Curves remain smooth
   // at scale; branches have their own smaller deviations.
   const amp=Math.max(0,motion)*(habit==='heavy'?.45:habit==='climbing'?.65:.60);
   const phase=r.between(-Math.PI,Math.PI);
   const out=samples.map(v=>{
     const normal=norm(v.tng),envelope=Math.pow(Math.sin(Math.PI*v.t),1.4);
     const delta=amp*envelope*(.76*Math.sin(Math.PI*v.t*1.2+phase)+.24*Math.sin(Math.PI*v.t*2.35-phase*.43));
     return {...v,x:v.x+normal.x*delta,y:v.y+normal.y*delta};
   });
   for(let i=0;i<out.length;i++){
     const a=out[Math.max(0,i-2)],b=out[Math.min(out.length-1,i+2)];
     out[i].tng=M.unit(P(b.x-a.x,b.y-a.y));
   }
   return out;
 }
 function silhouette(points,base,tip=.12,rooted=false){
   const left=[],right=[];
   for(const p of points){
     const nv=norm(p.tng);
     // Grown stems have tapered ends, never blunt cylindrical caps. A woody
     // root widens quickly after emerging from a narrow basal point.
     const entry=rooted ? (.15+.85*Math.min(1,p.t/.075)) : 1;
     const w=widthAt(base,p.t,tip)*entry;
     const noise=1+.026*Math.sin(p.t*41+base);
     left.push(add(p,nv,.5*w*noise));right.push(add(p,nv,-.5*w*noise));
   }
   return M.poly([...left,...right.reverse()]);
 }
 function spine(a,b,c,d,count,r,motion,habit){return wavy(M.wave(a,b,c,d,count),r,motion,habit);}
 function guidedSpine(stem,sp,r,motion,s){
   const raw=stem.naturalPoints||M.wave(stem.a,stem.b,stem.c,stem.d,100);
   if(stem.userDrawn)return raw;
   const guide=stem.guidePoints,conform=clamp(Number(s.conform||0)/100,0,1);
   if(!guide||conform<=0)return wavy(raw,r,motion*.48,sp.habit);
   // 100% means the entire axis lies on its guide. Partial values interpolate
   // the entire curve rather than attracting isolated vertices to nearest
   // segments (which caused sharp corners and unpredictable changes).
   const backwards=M.distance(raw[0],guide[guide.length-1])+M.distance(raw[raw.length-1],guide[0])
     < M.distance(raw[0],guide[0])+M.distance(raw[raw.length-1],guide[guide.length-1]);
   const guided=raw.map((p,i)=>{
     const u=i/(raw.length-1)*(guide.length-1),j=Math.floor(u),fraction=u-j;
     const lo=guide[backwards?guide.length-1-j:j];
     const hi=guide[backwards?Math.max(0,guide.length-2-j):Math.min(guide.length-1,j+1)];
     const target=M.pt(lo,hi,fraction);
     return {...p,x:p.x*(1-conform)+target.x*conform,
       y:p.y*(1-conform)+target.y*conform};
   });
   for(let i=0;i<guided.length;i++){
     const a=guided[Math.max(0,i-2)],b=guided[Math.min(guided.length-1,i+2)];
     guided[i].tng=M.unit(P(b.x-a.x,b.y-a.y));
   }
   return conform>=.999 ? guided : wavy(guided,r,motion*.40*(1-conform),sp.habit);
 }
 function stemInk(points,w,color,pal,r,s,major=false){
   const d=silhouette(points,w,major?.09:.16,major);
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
 function anchored(point,side,width,advance=.8){return add(add(point,norm(point.tng),side*width*.29),point.tng,advance);}
 function petioleLeaf(p,a,size,sp,season,pal,r,plan,s){
   // Leaf collision is adjustable. Search for a nearby viable attachment
   // rather than simply deleting foliage and leaving a conspicuous gap.
   const alternatives=[{a,size,shift:0},{a:a+.19,size:size*.96,shift:1.7},
     {a:a-.22,size:size*.9,shift:-1.4},{a:a+.32,size:size*.8,shift:3.2}];
   for(const candidate of alternatives){
     const at=add(p,polar(a+Math.PI/2,candidate.shift));
     const test=add(at,polar(candidate.a,candidate.size*.86));
     if(!allowed(test,plan,3))continue;
     const center=add(at,polar(candidate.a,candidate.size*.54));
     const footprint=Math.max(3,candidate.size*(sp.leaf==='fern'?.13:sp.leaf==='holly'?.33:['acanthus','oak','hazel'].includes(sp.leaf)?.40:.34));
     if(plan.spatial && !plan.spatial.accept(center,footprint,{
       group:plan.activeStem||'spray',density:s.foliage||65}))continue;
     const leaf=M.plantLeaf(sp,at,candidate.a,candidate.size,season,pal,r,s);
     if(!leaf)return '';
     const stalk=M.path(`M${V(p)}L${V(at)}`,M.wood(sp,pal,'new',r),.64);
     return `<g class="growth-leaf" data-attachment="${V(p)}">${stalk}${leaf}</g>`;
   }
   return '';
 }
 function twigDetails(samples,sp,season,pal,r,plan,s){
   const kind=sp.leaf,tip=samples[samples.length-1],a=angle(tip.tng);
   let out='';
   const ts=sp.habit==='fronds'?[.22,.61]:sp.habit==='climbing'?[.25,.48,.70,.90]:[.26,.53,.79];
   const count=s.foliage<28?2:ts.length;
   for(let i=0;i<count;i++){
     const p=samples[Math.round(ts[i]* (samples.length-1))],side=i%2?1:-1;
     const phi=angle(p.tng)+side*(kind==='honeysuckle'?.86:kind==='fern'?.88:1.0);
     const len=r.between(kind==='holly'?23:20,kind==='oak'?43:35)*sp.scale*(sp.leafScale||1);
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
   let woodArt=stemInk(points,base,wood,pal,r,s);
   let foliageArt='',organArt='';
   const leafCount=clamp(Math.round((sub?3:4.5)*sp.frequency*(.65+s.foliage/72)),1,sub?5:8);
   const pairs=sp.habit==='twining';
   for(let i=0;i<leafCount;i++){
     const t=.19+(i+.3)*.72/leafCount,p=points[Math.round(t*30)],sign=i%2?1:-1;
     const a=angle(p.tng)+sign*r.between(.75,1.15)*sp.angle;
     const size=len*(sub?r.between(.22,.34):r.between(.31,.48))*sp.scale*(sp.leafScale||1)*(1-.17*t);
     const attachment=anchored(p,sign,widthAt(base,t,.25),.5);
     foliageArt+=petioleLeaf(attachment,a,size,sp,season,pal,r,plan,s);
     if(pairs)foliageArt+=petioleLeaf(anchored(p,-sign,widthAt(base,t,.25),.5),angle(p.tng)-sign*.85,size*.95,sp,season,pal,r,plan,s);
   }
   if(sp.habit==='climbing' && r.chance(.46)){
     const p=points[Math.round(r.between(.3,.66)*30)];
     for(const side of [-1,1])woodArt+=M.path(`M${V(p)}q${M.vec(side*4,2)} ${M.vec(side*8,6)}`,M.wood(sp,pal,'new',r),.65,'opacity=".74"');
   }
   if(['bramble','hawthorn','dogrose'].includes(sp.leaf)){
     for(let i=0;i<2;i++){
       const p=points[Math.round((.27+i*.33)*30)],dir=angle(p.tng)+ (i%2?1:-1)*1.55;
       woodArt+=M.path(`M${V(p)}l${M.vec(Math.cos(dir)*r.between(3,6),Math.sin(dir)*r.between(3,6))}`,wood,.72);
     }
   }
   if(!sub && sp.habit!=='fronds' && r.chance((sp.tertiary||.68)*s.foliage/100)){
     const j=Math.round(r.between(.43,.65)*30),p=points[j],sign=r.sign();
     organArt+=shoot(anchored(p,sign,widthAt(base,p.t,.25)),p.tng,sign,len*r.between(.32,.55)*sp.twigs,sp,season,pal,r,plan,s,true);
   }
   if(sp.habit==='fronds' || r.chance(.12))organArt+=twigDetails(points,sp,season,pal,r,plan,s);
   else if(r.chance(.62))organArt+=M.plantOrgan(sp,points[30],angle(points[30].tng),season,pal,r,r.between(6,10));
   // Add restrained foliate ornament at true branch nodes, not loose symbols.
   if(M.ornamentJunction && !sub){
     const i=Math.round(r.between(.35,.72)*30),p=points[i],a=angle(p.tng)+r.sign()*r.between(.74,1.18);
     organArt+=M.ornamentJunction(sp,p,a,r.between(9,17),pal,r,s,plan,'joint');
   }
   if(M.ornamentTerminal && !sub)organArt+=M.ornamentTerminal(sp,points[30],angle(points[30].tng),r.between(9,16),pal,r,s);
   if(M.ornamentSplitTip && !sub)organArt+=M.ornamentSplitTip(sp,points[30],angle(points[30].tng),r.between(9,19),pal,r,s,plan);
   const axis=M.strokePath(points);
   return `<g class="growth-shoot" data-root-t="${n(s._branchT??.4)}" data-growpath="${axis}">`+
       `<g class="shoot-wood">${woodArt}</g>`+
       `<g class="shoot-foliage">${foliageArt}</g>`+
       `<g class="shoot-details">${organArt}</g></g>`;
 }
 function fernStem(points,sp,season,pal,r,plan,s){
   // A frond is one complete plant organ, not a woody cane carrying small
   // copies of another frond. All pinnae attach to a green rachis and narrow
   // progressively toward the tip. Fronds share a rhizome/crown.
   const amount=clamp(s.foliage/100,0,1),detail=clamp(s.detail/100,0,1);
   const frame=points.filter((_,i)=>i%2===0);
   const midrib=frame.map((p,i)=>(i?'L':'M')+V(p)).join('');
   let out=M.path(midrib,M.mix(sp.tint,pal.ink,.30),1.65,'opacity=".95"');
   const pairs=Math.round(12+detail*12+amount*7);
   for(let i=1;i<=pairs;i++){
     const t=.065+i*.88/(pairs+1),p=points[Math.round(t*100)];
     const span=47*(.43+.8*amount)*Math.sin(Math.PI*t)**.69*(1-.30*t);
     for(const side of [-1,1]){
       // Deciduous fern fronds wither through autumn and retain only a few
       // ragged pinnules in winter; spring fronds remain smaller and tender.
       if(season==='winter' && r.chance(.92))continue;
       const normal=norm(p.tng),ang=angle(p.tng)+side*(1.00+.16*t),len=span*r.between(.82,1.15)*(season==='spring'?.76:1);
       const at=add(p,normal,side*1.2);
       const spA=P(Math.cos(ang),Math.sin(ang)),end=add(at,spA,len);
       if(!allowed(end,plan,-8))continue;
       const leaf=`M0 0 Q${M.vec(len*.31,-len*.32)} ${M.vec(len*.80,-len*.095)} Q${M.vec(len*1.03,-len*.03)} ${M.vec(len,0)} Q${M.vec(len*.68,len*.23)} 0 0 Z`;
       const color=M.leafPigment(sp,season,pal,r,s),id='pinna-'+r.int(1000,99999999);
       out+=`<g transform="translate(${V(at)}) rotate(${n(ang*180/Math.PI)})">`+M.leafFinish(id,leaf,len,color,pal,s,r);
       if(detail>.36)out+=M.path(`M0 0L${M.vec(len*.87,0)}`,M.mix(color,pal.ink,.42),.37,'opacity=".51"');
       out+='</g>';
     }
   }
   if(season==='spring'&&r.chance(.34))out+=M.plantOrgan(sp,points[94],angle(points[94].tng),season,pal,r,9);
   return out;
 }
 function stemSpecies(s,r,index){
   if(s.species==='hybrid')return M.chooseSpecies('acanthus',r); // main stem is acanthus; named hybrids chosen per shoots
   return M.chooseSpecies(s.species,r);
 }
 M.botanical=(plan,s,r)=>{
   if(s.foliage<=0)return '';
   const pal=s.pal,season=s.season||'summer',fol=s.foliage/100;
   const sections=[];
   plan.spatial=M.makeSpatialField?M.makeSpatialField():null;
   const stems=plan.stems.slice(0,fol<.09?1:plan.stems.length);
   for(let k=0;k<stems.length;k++){
     const stem=stems[k],sp=stemSpecies(s,r,k);
     const motion=(.40+clamp(s.distortion/100,0,1)*.95)*r.between(7,19);
     plan.activeStem='stem-'+stem.id;
     const points=guidedSpine(stem,sp,r,motion,s);
     stem.drawnPoints=points;
     if(sp.habit==='fronds'){
       const fern=fernStem(points,sp,season,pal,r,plan,s);
       sections.push(`<g class="growth-plant" data-trunk="${sp.name}" data-plant="${sp.name}" filter="url(#press)"><g class="growth-primary" data-growpath="${M.strokePath(points)}">${fern}</g></g>`);
       continue;
     }
     const base=stem.width*(sp.habit==='heavy'?1.10:sp.habit==='climbing'?.68:sp.habit==='twining'?.73:1);
     const wood=M.wood(sp,pal,'mature',r);
     let woodArt=stemInk(points,base,wood,pal,r,s,true);
     let growth='';
     let count=clamp(Math.round((stem.major?8:6)*sp.frequency*(.43+fol*.96)*(sp.shootDensity||1)),2,19);
     if(season==='winter'&&!sp.evergreen)count=Math.max(2,Math.round(count*.76));
     // Slightly irregular spacing instead of 12 evenly-spaced identical twigs.
     const positions=Array.from({length:count},(_,i)=>clamp(.11+(i+.4)*.77/count+r.between(-.023,.023),.06,.91));
     for(let i=0;i<count;i++){
       const t=positions[i],idx=Math.round(t*100),p=points[idx];
       const side=((i%2===0?stem.side:-stem.side)||1)*(r.chance(.12)?-1:1);
       const length=r.between(stem.major?85:70,stem.major?159:128)*sp.scale*(sp.shootScale||1)*(1-.10*t);
       const identity=s.species==='hybrid'?M.chooseSpecies(r.choose(['holly','ivy','dogrose','hazel','oak','acanthus']),r):sp;
       const launch=anchored(p,side,widthAt(base,t,.1),.25);
       s._branchT=t;
       growth+=shoot(launch,p.tng,side,length,identity,season,pal,r,plan,s);
     }
     // Substantial lower foliage and coherent secondary branch scale.
     if(!['twining','climbing'].includes(sp.habit)){
       for(let i=0;i<2;i++){
         const t=.08+i*.09,p=points[Math.round(t*100)],side=i%2?1:-1;
         const a=angle(p.tng)+side*r.between(.8,1.3),len=r.between(31,51)*sp.scale*(sp.leafScale||1);
         growth+=petioleLeaf(anchored(p,side,widthAt(base,t,.1)),a,len,sp,season,pal,r,plan,s);
       }
     }
     if(r.chance(.68)){
       const tip=points[100],ang=angle(tip.tng);
       growth+=M.plantOrgan(sp,tip,ang,season,pal,r,r.between(9,14));
     }
     if(M.ornamentTerminal && sp.habit!=='fronds')
       growth+=M.ornamentTerminal(sp,points[100],angle(points[100].tng),r.between(8,16),pal,r,s);
     const axis=M.strokePath(points);
     sections.push(`<g class="growth-plant" data-trunk="${sp.name}" data-plant="${sp.name}" filter="url(#press)">`+
       `<g class="growth-primary" data-growpath="${axis}">${woodArt}</g>`+
       `<g class="growth-secondary">${growth}</g></g>`);
   }
   // Whole-plant painter's order: one branch and its leaves are composed as a
   // unit, rather than putting *every* woody stem behind *every* leaf.
   return `<g id="botanical-plants">${sections.join('')}</g>`;
 };
})(window.MS);
