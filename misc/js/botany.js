/* Pass 1 visual anatomy: species-specific woody gesture, phyllotaxis and organs.
   Keeps all existing geometry, seed, export and growth interactions. */
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
   // The root of a side shoot emerges from inside its parent instead of
   // producing a hard-edged socket. The continuous strip tapers at both ends.
   const left=[],right=[];
   for(const p of points){
     const normal=norm(p.tng),t=clamp(p.t,0,1);
     const entry=rooted?1:(.28+.72*Math.min(1,t/.085));
     const width=widthAt(base,t,tip)*entry;
     const irregular=1+.016*Math.sin(t*23+base*1.3)+.009*Math.sin(t*51);
     left.push(add(p,normal,.5*width*irregular));
     right.push(add(p,normal,-.5*width*irregular));
   }
   const outline=[...left,...right.reverse()];
   // Quadratic smoothing removes polygon facets along stems without changing
   // their sampled backbone or the geometry-guided path.
   let d=`M${V(outline[0])}`;
   for(let i=0;i<outline.length;i++){
     const p=outline[i],q=outline[(i+1)%outline.length];
     d+=`Q${V(p)} ${V(P((p.x+q.x)/2,(p.y+q.y)/2))}`;
   }
   return d+'Z';
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
     // Intermediate conformity preserves real root attachment and the plant's
     // outward growing tip. Full conformity alone traces the complete guide.
     const span=i/(raw.length-1);
     const pull=conform>=.999?1:conform*(.16+.84*Math.pow(Math.sin(Math.PI*span),.72));
     return {...p,x:p.x*(1-pull)+target.x*pull,
       y:p.y*(1-pull)+target.y*pull};
   });
   for(let i=0;i<guided.length;i++){
     const a=guided[Math.max(0,i-2)],b=guided[Math.min(guided.length-1,i+2)];
     guided[i].tng=M.unit(P(b.x-a.x,b.y-a.y));
   }
   return conform>=.999 ? guided : wavy(guided,r,motion*.40*(1-conform),sp.habit);
 }
 function stemInk(points,w,color,pal,r,s,major=false,sp=null){
   const d=silhouette(points,w,major?.09:.16,major);
   const trace=major?`stem-${r.int(1000,999999999)}`:`shoot-${r.int(1000,999999999)}`;
   const xs=points.map(p=>p.x),ys=points.map(p=>p.y),pad=w+8;
   const bounds={x:Math.min(...xs)-pad,y:Math.min(...ys)-pad,w:Math.max(...xs)-Math.min(...xs)+2*pad,h:Math.max(...ys)-Math.min(...ys)+2*pad};
   let out=M.painted(trace,d,color,bounds,s,r,{stroke:major?.65:.45,lightweight:true,bark:true});
   // Pass 2: bark has its own ink, not the same grain as leaves. Interrupted
   // lengthwise mineral deposits follow the actual wood axis and are clipped
   // to the illustrated trunk so they never float into the paper.
   if(w>1.5){
     const uid=`wood-grain-${trace}`;
     const salt=(Number(trace.match(/\d+/)?.[0])||7181)^0x6f3a71;
     const grainR=M.rng(M.childSeed(Number(s.seed)>>>0||1,salt));
     let strokes='';
     for(let i=5;i<points.length-3;i+=major?5:7){
       const pt=points[i],t=pt.t,tan=pt.tng,perp=norm(tan);
       const current=Math.max(.3,widthAt(w,t,.15));
       const offset=grainR.between(-.32,.32)*current;
       const a=add(pt,perp,offset),len=Math.min(8,current*grainR.between(.8,1.8));
       const b=add(a,tan,len),c=add(b,perp,grainR.between(-.33,.33));
       const shade=grainR.chance(.53)?M.mix(color,pal.ink,.48):M.mix(color,pal.light,.43);
       strokes+=M.path(`M${V(a)}Q${V(b)} ${V(c)}`,shade,
         Math.max(.22,Math.min(.69,current*.16)),`opacity="${n(grainR.between(.22,.50))}"`);
     }
     if(strokes)out+=`<defs><clipPath id="${uid}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${uid})">${strokes}</g>`;
   }
   if(major){
     const stroke=points.filter((_,i)=>i%3===0).map((p,i)=>{
       const off=norm(p.tng),vv=add(p,off,w*.09);return `${i?'L':'M'}${V(vv)}`;
     }).join('');
     out+=M.path(stroke,M.mix(color,pal.light,.27),.52,'opacity=".43"');
     // Bark is illustrated *on the plant*: interrupted fissures on oak,
     // fine lenticels on hazel, sparse rings on ivy. No random floating marks.
     if(sp){
       const step=sp.leaf==='oak'?6:sp.leaf==='hazel'?9:sp.leaf==='holly'?12:15;
       for(let i=step;i<points.length-step;i+=step){
         const p=points[i],t=p.t,normal=norm(p.tng),radius=widthAt(w,t,.09)*.39;
         const offset=r.between(-.28,.28)*radius;
         const start=add(p,normal,offset),direction=r.sign();
         const q=add(start,normal,direction*r.between(1.5,Math.max(2,radius*.62)));
         const col=M.mix(color,r.chance(.72)?pal.ink:pal.light,r.between(.22,.4));
         out+=M.path(`M${V(start)}Q${V(add(start,p.tng,r.between(1,3)))} ${V(q)}`,
           col,sp.leaf==='oak'?.76:.43,`opacity="${n(r.between(.26,.55))}"`);
       }
     }
   } else if(w>2.3){
     // A single interrupted highlight helps the lateral taper read as wood
     // instead of a mathematically perfect filled ribbon.
     const stripe=points.filter((_,i)=>i%3===0).slice(2,-2).map((p,i)=>{
       const q=add(p,norm(p.tng),widthAt(w,p.t,.16)*.13);return `${i?'L':'M'}${V(q)}`;
     }).join('');
     if(stripe)out+=M.path(stripe,M.mix(color,pal.light,.28),.38,'opacity=".31"');
   }
   return out;
 }
 function anchored(point,side,width,advance=.8){return add(add(point,norm(point.tng),side*width*.29),point.tng,advance);}
 function petioleLeaf(p,a,size,sp,season,pal,r,plan,s,t=.5){
   // Keep real petiole attachment and reduce the finished blade size BEFORE
   // collision testing. Previously a giant compound leaf was checked as a
   // tiny circle, which produced impossible stacks of foliage.
   const max={holly:37,hazel:42,ivy:38,hawthorn:30,oak:48,dogrose:39,
      honeysuckle:37,bramble:39,acanthus:46,fern:31}[sp.leaf]||36;
   size=clamp(size,9,max)*r.between(.89,1.07);
   const variants=[
     [0,1,0],[.24,.94,0],[-.25,.91,0],[.39,.81,0],[-.40,.80,0],
     [.13,.78,3],[-.17,.76,-3],[.48,.67,0],[-.50,.67,0]
   ];
   for(const [rotation,scale,shift] of variants){
     const aa=a+rotation,sz=size*scale;
     const at=add(p,polar(a+Math.PI/2,shift));
     const center=add(at,polar(aa,sz*.60+Math.min(8,sz*.12)));
     const far=add(at,polar(aa,sz*1.15));
     if(!allowed(center,plan,13)||!allowed(far,plan,9))continue;
     const broad={holly:.59,hazel:.57,ivy:.62,hawthorn:.58,oak:.60,
         dogrose:.64,honeysuckle:.56,bramble:.64,acanthus:.61,fern:.45};
     const footprint=sz*(broad[sp.leaf]||.63);
     if(plan.spatial&&!plan.spatial.accept(center,footprint,{
         group:plan.activeShoot||plan.activeStem||'spray',density:s.foliage||50,
         anchor:p,angle:aa}))continue;
     const leaf=M.plantLeaf(sp,at,aa,sz,season,pal,r,s);
     if(!leaf)continue;
     // The petiole connects to the structural branch; avoid ghost connectors
     // extending across surrounding leaves.
     const stalk=M.distance(p,at)>.7 ? M.path(`M${V(p)}L${V(at)}`,
         M.wood(sp,pal,'new',r),.65):'';
     return `<g class="growth-leaf" data-attachment="${V(p)}" data-leaf-angle="${n(aa)}" data-grow-t="${n(t)}">${stalk}${leaf}</g>`;
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
     const len=r.between(kind==='holly'?17:15,kind==='oak'?32:27)*sp.scale*(sp.leafScale||1);
     out+=petioleLeaf(anchored(p,side,1.3,1),phi,len,sp,season,pal,r,plan,s);
     if(kind==='honeysuckle')out+=petioleLeaf(anchored(p,-side,1.3,1),angle(p.tng)-side*.90,len*.95,sp,season,pal,r,plan,s);
   }
   if(r.chance(.28) || ['bramble','hawthorn'].includes(kind)){
     const q=samples[Math.round(samples.length*.56)],p=anchored(q,1,.7,0);
     if(['bramble','hawthorn','dogrose'].includes(kind))out+=M.path(`M${V(p)}l${M.vec(r.between(-4,4),-r.between(3,7))}`,M.wood(sp,pal,'mature',r),1.1);
   }
   if(r.chance(.52))out+=M.plantOrgan(sp,tip,a,season,pal,r,r.between(8,11));
   // Terminal ornament is a continuation of the twig, never free-floating.

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
   // A new shoot begins tangent to the parent, then gradually leans into
   // its own direction. This replaces the sharp wedge-shaped T junction.
   const parentDirection=norm(tng),sideVec=polar(theta+side*Math.PI/2,1);
   const b=add(add(start,tng,len*.24),sideVec,len*.025);
   const c=add(end,polar(outAngle+Math.PI-side*.28,len*.34));
   const points=spine(start,b,c,end,30,r,Math.min(8,len*.085)*(s.distortion/100+.42),sp.habit);
   const wood=M.wood(sp,pal,sub?'new':'mature',r),base=sub?r.between(1.0,1.7):r.between(2.1,4.4);
   const prevShoot=plan.activeShoot;plan.activeShoot='spray-'+r.int(10000,99999999);
   let woodArt=stemInk(points,base,wood,pal,r,s,false,sp);
   plan.spatial?.addWood?.(points,base,plan.activeStem);
   let foliageArt='',organArt='';
   // Alternate or opposite leaves reflect species, not an evenly spaced
   // computational ladder. Variation happens at the node, not by rotating a
   // detached sprite away from its own stalk.
   const opposite=['honeysuckle'].includes(sp.leaf);
   const whorled=sp.leaf==='ivy',cluster=sp.leaf==='holly'||sp.leaf==='hawthorn';
   const leafCount=clamp(Math.round((sub?2.4:3.9)*sp.frequency*(.49+s.foliage/105)),1,sub?4:7);
   for(let i=0;i<leafCount;i++){
     const t=clamp(.14+(i+.38)*.78/leafCount+r.between(-.027,.027),.12,.93),p=points[Math.round(t*30)],sign=i%2?1:-1;
     const a=angle(p.tng)+sign*r.between(.76,1.09)*sp.angle;
     const size=len*(sub?r.between(.20,.29):r.between(.22,.33))*sp.scale*(sp.leafScale||1)*(1-.25*t);
     const attachment=add(p,norm(p.tng),sign*widthAt(base,t,.25)*.10);
     foliageArt+=petioleLeaf(attachment,a,size,sp,season,pal,r,plan,s,t);
     if(opposite || (whorled&&r.chance(.24)) || (cluster&&r.chance(.23))){
       const aa=angle(p.tng)-sign*r.between(.72,.99)*sp.angle;
       foliageArt+=petioleLeaf(anchored(p,-sign,widthAt(base,t,.25),.5),aa,size*r.between(.83,.97),sp,season,pal,r,plan,s,t);
     }
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
   if(sp.habit==='fronds' || r.chance(.09))organArt+=twigDetails(points,sp,season,pal,r,plan,s);
   else if(r.chance(.72))organArt+=M.plantOrgan(sp,points[30],angle(points[30].tng),season,pal,r,r.between(8,12));
   // Add restrained foliate ornament at true branch nodes, not loose symbols.
   if(M.ornamentJunction && !sub){
     const i=Math.round(r.between(.35,.72)*30),p=points[i],a=angle(p.tng)+r.sign()*r.between(.74,1.18);
     organArt+=M.ornamentJunction(sp,p,a,r.between(9,17),pal,r,s,plan,'joint');
   }
   // Terminal buds already belong to this shoot's reproductive details.

   // Decorative split-tip hooks removed: they looked disconnected.
   plan.activeShoot=prevShoot;
   const axis=M.strokePath(points);
   return `<g class="growth-shoot" data-root-t="${n(s._branchT??.4)}" data-growpath="${axis}">`+
       `<g class="shoot-wood" data-grow-width="${n(Math.max(4,base*3.1))}">${woodArt}</g>`+
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
   let wood=M.path(midrib,M.mix(sp.tint,pal.ink,.30),1.65,'opacity=".95"'),foliage='';
   const pairs=Math.round(13+detail*8+amount*5);
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
       const color=M.leafPigment(sp,season,pal,r,s);
       // Each pinna has a thin rachis and pairs of tapering pinnules.
       // Lightweight colored shapes avoid thousands of individual SVG masks.
       let pinnules=M.path(`M0 0Q${M.vec(len*.43,-len*.08)} ${M.vec(len,0)}`,
         M.mix(sp.tint,pal.ink,.34),Math.max(.35,len*.037));
       const smallPairs=Math.max(3,Math.min(6,Math.round(len/6)));
       for(let k=0;k<smallPairs;k++){
         const u=.12+(k+.27)*.76/smallPairs,xx=len*u,
           length=len*.23*Math.pow(Math.sin(Math.PI*u),.8)*(1-.20*u);
         for(const sign of [-1,1]){
           const endx=xx+length*.73,endy=sign*length*.76;
           const d=`M${M.vec(xx,0)}Q${M.vec(xx+length*.11,endy*.92)} ${M.vec(endx,endy)}`+
             `Q${M.vec(xx+length*.81,endy*.46)} ${M.vec(xx,0)}Z`;
           pinnules+=M.shape(d,color,`stroke="${pal.ink}" stroke-width="${n(Math.max(.25,len*.016))}"`);
         }
       }
       foliage+=`<g class="growth-leaf" data-attachment="${V(p)}" data-leaf-angle="${n(ang)}" data-grow-t="${n(t)}"><g transform="translate(${V(at)}) rotate(${n(ang*180/Math.PI)})">${pinnules}`;
       foliage+='</g></g>';
     }
   }
   if(season==='spring'&&r.chance(.34))foliage+=M.plantOrgan(sp,points[94],angle(points[94].tng),season,pal,r,9);
   return {wood,foliage};
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
       sections.push(`<g class="growth-plant" data-trunk="${sp.name}" data-plant="${sp.name}"><g class="growth-primary" data-grow-width="10" data-growpath="${M.strokePath(points)}">${fern.wood}</g><g class="growth-secondary">${fern.foliage}</g></g>`);
       continue;
     }
     const base=stem.width*(sp.habit==='heavy'?1.08:sp.habit==='climbing'?.86:sp.habit==='twining'?.88:1.01);
     const wood=M.wood(sp,pal,'mature',r);
     plan.spatial?.addWood?.(points,base,plan.activeStem);
     let woodArt=stemInk(points,base,wood,pal,r,s,true,sp);
     let growth='';
     let count=clamp(Math.round((stem.major?7:5)*sp.frequency*(.42+fol*.89)*(sp.shootDensity||1)),2,14);
     if(season==='winter'&&!sp.evergreen)count=Math.max(2,Math.round(count*.76));
     // Slightly irregular spacing instead of 12 evenly-spaced identical twigs.
     const positions=Array.from({length:count},(_,i)=>clamp(.11+(i+.4)*.77/count+r.between(-.023,.023),.06,.91));
     for(let i=0;i<count;i++){
       const t=positions[i],idx=Math.round(t*100),p=points[idx];
       const side=((i%2===0?stem.side:-stem.side)||1)*(r.chance(.12)?-1:1);
       const length=r.between(stem.major?80:64,stem.major?136:109)*sp.scale*(sp.shootScale||1)*(1-.12*t);
       const identity=s.species==='hybrid'?M.chooseSpecies(r.choose(['holly','ivy','dogrose','hazel','oak','acanthus']),r):sp;
       // Start each lateral well inside the parent silhouette; no floating joins.
       const launch=add(p,norm(p.tng),side*widthAt(base,t,.1)*.08);
       s._branchT=t;
       growth+=shoot(launch,p.tng,side,length,identity,season,pal,r,plan,s);
     }
     // Substantial lower foliage and coherent secondary branch scale.
     if(!['twining','climbing'].includes(sp.habit)){
       for(let i=0;i<2;i++){
         const t=.08+i*.09,p=points[Math.round(t*100)],side=i%2?1:-1;
         const a=angle(p.tng)+side*r.between(.8,1.3),len=r.between(20,34)*sp.scale*(sp.leafScale||1);
         growth+=petioleLeaf(add(p,norm(p.tng),side*widthAt(base,t,.1)*.08),a,len,sp,season,pal,r,plan,s,t);
       }
     }
     if(r.chance(.68)){
       const tip=points[100],ang=angle(tip.tng);
       growth+=M.plantOrgan(sp,tip,ang,season,pal,r,r.between(11,16));
     }

     const axis=M.strokePath(points);
     sections.push(`<g class="growth-plant" data-trunk="${sp.name}" data-plant="${sp.name}">`+
       `<g class="growth-secondary">${growth}</g>`+
       `<g class="growth-primary" data-grow-width="${n(Math.max(8,base*2.7))}" data-growpath="${axis}">${woodArt}</g></g>`);
   }
   // Whole-plant painter's order: one branch and its leaves are composed as a
   // unit, rather than putting *every* woody stem behind *every* leaf.
   return `<g id="botanical-plants">${sections.join('')}</g>`;
 };
})(window.MS);
