/* Species atlas: morphology and reproductive motifs, not independently chosen leaves.
   Each stem receives ONE profile. Hybrid mode switches profiles only between whole
   side-shoots; random mode switches only between independent primary stems. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const V=M.vec, n=M.n, P=(x,y)=>({x,y});
 const Q=(a,d)=>P(Math.cos(a)*d,Math.sin(a)*d);
 const sum=(a,b)=>P(a.x+b.x,a.y+b.y);
 const close=pts=>M.poly(pts);
 const mix=(a,b,t)=>M.mix(a,b,t);
 M.speciesProfiles={
   holly:{name:'holly',habit:'upright',leaf:'holly',bark:'#684832',tint:'#455e39',scale:.94,frequency:.83,angle:.80,twigs:1.1,evergreen:true,fruit:'holly'},
   hazel:{name:'hazel',habit:'arching',leaf:'hazel',bark:'#886044',tint:'#637341',scale:1.19,frequency:1.0,angle:1.16,twigs:1.22,evergreen:false,fruit:'hazel'},
   ivy:{name:'ivy',habit:'climbing',leaf:'ivy',bark:'#6a5036',tint:'#386547',scale:.78,frequency:1.26,angle:1.0,twigs:.85,evergreen:true,fruit:'ivy'},
   hawthorn:{name:'hawthorn',habit:'angular',leaf:'hawthorn',bark:'#67432f',tint:'#5e713d',scale:.75,frequency:1.18,angle:1.05,twigs:1.14,evergreen:false,fruit:'hawthorn'},
   oak:{name:'oak',habit:'heavy',leaf:'oak',bark:'#684733',tint:'#526d3c',scale:1.16,frequency:.8,angle:.92,twigs:.82,evergreen:false,fruit:'oak'},
   dogrose:{name:'dog rose',habit:'arching',leaf:'dogrose',bark:'#80563e',tint:'#537344',scale:1.06,frequency:.94,angle:1.2,twigs:1.16,evergreen:false,fruit:'dogrose'},
   honeysuckle:{name:'honeysuckle',habit:'twining',leaf:'honeysuckle',bark:'#765139',tint:'#65804d',scale:.88,frequency:1.0,angle:1.12,twigs:1.06,evergreen:false,fruit:'honeysuckle'},
   bramble:{name:'bramble',habit:'arching',leaf:'bramble',bark:'#76513e',tint:'#496e42',scale:1.08,frequency:1.08,angle:1.20,twigs:1.25,evergreen:false,fruit:'bramble'},
   fern:{name:'fern',habit:'fronds',leaf:'fern',bark:'#765c3d',tint:'#56734b',scale:1.18,frequency:.87,angle:.94,twigs:0,evergreen:false,fruit:'fern'},
   acanthus:{name:'acanthus',habit:'ornamental',leaf:'acanthus',bark:'#83573f',tint:'#607348',scale:1.22,frequency:.92,angle:1.06,twigs:.93,evergreen:true,fruit:'acanthus'}
 };
 M.speciesNames=Object.keys(M.speciesProfiles);
 M.chooseSpecies=(selected,r)=>M.speciesProfiles[selected]||M.speciesProfiles[r.choose(M.speciesNames)];
 M.wood=(sp,pal,age,r)=>{const a=mix(sp.bark,pal.ink,r.between(.06,.20)); return age==='new'?mix(a,sp.tint,.35):a;};
 M.leafPigment=(sp,season,pal,r)=>{
   let col=mix(sp.tint,pal.green,.18+r.between(0,.25));
   if(season==='autumn'&&!sp.evergreen){ col=r.choose([mix(col,pal.ochre,.48),mix(pal.ochre,pal.vermillion,.31),mix(col,pal.vermillion,.25),col]); }
   if(season==='winter'&&!sp.evergreen)col=mix(col,pal.ochre,.42);
   if(season==='spring')col=mix(col,pal.light,r.between(.08,.24));
   if(sp.leaf==='acanthus' && r.chance(.18))col=r.choose([pal.lapis,pal.vermillion,pal.green]);
   // A few symbolic multicolored leaves survive from the earlier version.
   else if(r.chance(.055))col=r.choose([pal.lapis,pal.vermillion]);
   return col;
 };
 const width=(t,a=.45)=>Math.pow(Math.sin(Math.PI*t),.82)*a;
 function outline(kind,len,r,s){
   const ornament=M.ornamentInfluence?M.ornamentInfluence({leaf:kind},s):0;
   const phase=r.between(-1.2,1.2);
   const top=[],bottom=[],steps=28;
   let maxW= len*(kind==='hazel'?.37:kind==='oak'?.33:kind==='acanthus'?.32:kind==='holly'?.27:.29);
   const spine=(t)=>{ // leaf axis tapers, with a slightly asymmetric end
     return t*len;
   };
   for(let i=0;i<=steps;i++){
     const t=i/steps;
     let w=Math.pow(Math.sin(Math.PI*t),.73);
     const lobes=kind==='oak'?3.8:kind==='hawthorn'?3.4:kind==='ivy'?2.6:kind==='acanthus'?4.8:0;
     if(lobes){
       const pulse=Math.sin(t*lobes*2*Math.PI - .4);
       w*= (kind==='acanthus'?.53:.68)+.38*Math.max(-.55,pulse);
     }
     if(kind==='hazel')w*=1.06 + .14*Math.cos(t*7);
     if(kind==='holly'){
       let spineWave=Math.sin(t*6*Math.PI);
       w*=.83 + .36*Math.pow(Math.max(0,spineWave),7);
     }
     if(kind==='ivy')w*= (t<.63?1:.8) * (1 + .18*Math.max(0,Math.sin(t*5*Math.PI)));
     if(['bramble','dogrose','hazel'].includes(kind))w*=1+.08*Math.sin(t*29*Math.PI);
     const shapeW=maxW*(M.ornamentWidth?M.ornamentWidth(kind,t,w,ornament,phase):w);
     const a=M.ornamentPoint?M.ornamentPoint(spine(t),-shapeW,t,ornament,len,phase):P(spine(t),-shapeW);
     const b=M.ornamentPoint?M.ornamentPoint(spine(t),shapeW*(.92+.06*Math.sin(t*9)),t,ornament,len,-phase):P(spine(t),shapeW);
     top.push(a);
     bottom.push(b);
   }
   // holly points are sharper on outside edges; serration is visible on hazel / rose
   return close([...top,...bottom.reverse()]);
 }
 function explicitLeaf(kind,len,r,s){
   const ornament=M.ornamentInfluence?M.ornamentInfluence({leaf:kind},s):0;
   const phase=r.between(-.7,.7);
   const transform=q=>{
      if(!ornament)return P(q[0]*len,q[1]*len);
      const pt=M.ornamentPoint(q[0]*len,q[1]*len*(1+ornament*.19),q[0],ornament,len,phase);
      return pt;
   };
   if(kind==='ivy'){
     const t=[ [0,0],[.20,-.18],[.27,-.48],[.43,-.29],[.53,-.66],[.65,-.33],[.97,-.06],[1,0],[.97,.06],[.65,.33],[.53,.66],[.43,.29],[.27,.48],[.20,.18] ];
     return close(t.map(transform));
   }
   if(kind==='holly'){
     const t=[[0,0],[.14,-.12],[.23,-.31],[.32,-.20],[.43,-.4],[.51,-.24],[.66,-.35],[.71,-.17],[.88,-.2],[1,0],[.88,.2],[.71,.17],[.66,.35],[.51,.24],[.43,.4],[.32,.20],[.23,.31],[.14,.12]];
     return close(t.map(transform));
   }
   return outline(kind,len,r,s);
 }
 function simpleLeaf(sp,size,season,pal,r,kindOverride,s={registration:0,pigment:40,wear:20}){
   const kind=kindOverride||sp.leaf;
   const d=explicitLeaf(kind,size,r,s),color=M.leafPigment(sp,season,pal,r),id=`leaf-${r.int(10000,999999999)}`;
   let z=M.leafFinish(id,d,size,color,pal,s,r);
   z+=`<g clip-path="url(#leaf-clip-${id})">`;
   z+=M.path(`M0 0 Q${V(size*.51,-size*.035)} ${V(size*.95,0)}`,mix(color,pal.ink,.57),Math.max(.5,size*.025),`opacity=".68"`);
   const veins=size>14?3:2;
   for(let i=1;i<=veins;i++){
     const t=.17+i*.17,x=size*t;
     for(const sign of [-1,1]){
       const y=sign*size*.21*Math.sin(Math.PI*t);
       z+=M.path(`M${V(x,-size*.008)}Q${V(x+size*.07,y*.61)} ${V(x+size*.13,y)}`,mix(pal.ink,color,.30),.42,`opacity=".55"`);
     }
   }
   if(M.ornamentLeafInterior)z+=M.ornamentLeafInterior(sp,size,color,pal,r,s);
   return z+'</g>';
 }
 function compound(sp,size,season,pal,r,s){
   const rose=sp.leaf==='dogrose',count=rose?2:1;
   let z=M.path(`M0 0 Q${V(size*.52,-size*.02)} ${V(size*.89,0)}`,mix(sp.tint,pal.ink,.35),1.3);
   for(let i=0;i<count;i++){
     const t=(i+1)/(count+1),x=size*(.16+t*.56);
     const signs=[-1,1];
     for(const sign of signs){
       const a=sign?sign*(rose?.90:1.1):0;
       const d=size*(rose?.32:.43)*(1+.14*r.random());
       z+=`<g transform="translate(${V(x,0)}) rotate(${n(a*180/Math.PI)})">`+simpleLeaf(sp,d,season,pal,r,rose?'dogrose':'bramble',s)+'</g>';
     }

   }
   z+=`<g transform="translate(${V(size*.88,0)})">`+simpleLeaf(sp,size*(rose?.32:.43),season,pal,r,rose?'dogrose':'bramble',s)+`</g>`;
   return z;
 }
 function fernFrond(sp,size,season,pal,r,s){
   let z=M.path(`M0 0 Q${V(size*.48,-size*.12)} ${V(size,0)}`,M.wood(sp,pal,'new',r),1.4);
   const pairs=12;
   for(let i=1;i<=pairs;i++){
     const t=i/(pairs+1),x=size*t,span=size*.21*Math.sin(Math.PI*t)**.88;
     for(const sign of [-1,1]){
       const d=`M${V(x,0)} Q${V(x+size*.04,sign*span*.53)} ${V(x+size*.16,sign*span)} Q${V(x+size*.065,sign*span*.83)} ${V(x,0)}Z`;
       const c=M.leafPigment(sp,season,pal,r);
       z+=M.leafFinish(`fern-${r.int(10000,999999999)}`,d,Math.max(8,size*.2),c,pal,s,r);
     }
   }
   if(M.ornamentTerminal)z+=M.ornamentTerminal(sp,{x:size,y:0},-.25,size*.11,pal,r,s);
   return z;
 }
 M.plantLeaf=(sp,at,angle,size,season,pal,r,s={registration:0,pigment:40,wear:20})=>{
   if(season==='winter'&&!sp.evergreen && r.chance(sp.leaf==='fern'?.65:.84))return '';
   const leaf=sp.leaf==='fern'?fernFrond(sp,size,season,pal,r,s):['dogrose','bramble'].includes(sp.leaf)?compound(sp,size,season,pal,r,s):simpleLeaf(sp,size,season,pal,r,undefined,s);
   // Larger illuminated leaves appear as the transformation increases.
   const ornamental=M.ornamentInfluence?M.ornamentInfluence(sp,s):0;
   const petiole=Math.min(6,Math.max(1,size*.075));
   const stem=M.path(`M0 0 L${V(petiole,0)}`,M.wood(sp,pal,'new',r),Math.max(.46,size*.033));
   const magnify=1+ornamental*.14;
   return `<g data-species="${sp.name}" transform="translate(${V(at.x,at.y)}) rotate(${n(angle*180/Math.PI)})">${stem}<g transform="translate(${V(petiole,0)}) scale(${n(magnify)})">${leaf}</g></g>`;
 };
 function blossom(at,scale,pal,r,white=true){
   let z=''; const p=r.choose([4,5,5]);
   for(let i=0;i<p;i++){
     const a=i*2*Math.PI/p,dx=Math.cos(a)*scale*.36,dy=Math.sin(a)*scale*.36;
     z+=`<ellipse cx="${n(at.x+dx)}" cy="${n(at.y+dy)}" rx="${n(scale*.28)}" ry="${n(scale*.48)}" transform="rotate(${n(a*180/Math.PI+90)} ${V(at.x+dx,at.y+dy)})" fill="${white?mix(pal.light,'#fff4e2',.65):r.choose([pal.lapis,pal.vermillion,pal.ochre])}" stroke="${pal.ink}" stroke-width=".38"/>`;
   }
   z+=M.circle(at.x,at.y,scale*.18,pal.ochre,`stroke="${pal.ink}" stroke-width=".3"`);
   return z;
 }
 function fruitCluster(sp,at,a,scale,pal,r,type,count){
   const berryColors=type==='berry'?[pal.vermillion,'#982f20']:type==='blackberry'?['#332a36','#482e48','#6d3c4b']:['#977333','#7a4d33'];
   let z='';
   for(let i=0;i<count;i++){
     const start=at,ang=a+(i-(count-1)/2)*.55,len=scale*(1.0+.13*i),tip=sum(start,Q(ang,len));
     z+=M.path(`M${V(start.x,start.y)} Q${V(start.x+Math.cos(ang-.2)*len*.54,start.y+Math.sin(ang-.2)*len*.54)} ${V(tip.x,tip.y)}`,mix(sp.bark,pal.ink,.14),.62);
     if(type==='blackberry'){
       for(let j=0;j<7;j++){
         const phi=j*2.4,x=tip.x+Math.cos(phi)*scale*.18*(j%2+1),y=tip.y+Math.sin(phi)*scale*.23;
         z+=M.circle(x,y,scale*.16,r.choose(berryColors),`stroke="${pal.ink}" stroke-width=".35"`);
       }
     } else z+=M.circle(tip.x,tip.y,scale*.42,r.choose(berryColors),`stroke="${pal.ink}" stroke-width=".65"`);
   }
   return z;
 }
 M.plantOrgan=(sp,at,angle,season,pal,r,scale=8)=>{
   const name=sp.leaf,tip=sum(at,Q(angle,scale*.7));
   if(name==='holly') return season==='winter'||season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'berry',3):season==='spring'?blossom(tip,scale*.47,pal,r):'';
   if(name==='hazel'){
     if(season==='winter'||season==='spring'){
       let z='';for(let i=0;i<2;i++){const pt=sum(at,Q(angle+(.42*i-.17),scale*.7));z+=M.path(`M${V(at.x,at.y)}Q${V(pt.x,pt.y)} ${V(pt.x+1,pt.y+scale*1.2)}`,mix(sp.bark,pal.ink,.14),1);for(let j=0;j<5;j++)z+=M.circle(pt.x+1,pt.y+j*scale*.26,scale*.23,pal.ochre,`stroke="${pal.ink}" stroke-width=".35"`);}return z;
     }
     if(season==='autumn')return fruitCluster(sp,tip,angle,scale*.8,pal,r,'nut',2);return '';
   }
   if(name==='ivy')return season==='winter'?fruitCluster(sp,tip,angle,scale,pal,r,'blackberry',3):'';
   if(name==='hawthorn')return season==='spring'?blossom(tip,scale*.95,pal,r):season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'berry',3):'';
   if(name==='oak'){
     if(season==='autumn'){
       let z=fruitCluster(sp,tip,angle,scale*.75,pal,r,'nut',2);
       z+=M.shape(`M${V(tip.x-scale*.46,tip.y)}Q${V(tip.x,tip.y-scale*.42)} ${V(tip.x+scale*.46,tip.y)}Z`,mix(pal.ochre,sp.bark,.2),`stroke="${pal.ink}" stroke-width=".5"`);return z;
     }return '';
   }
   if(name==='dogrose')return season==='spring'||season==='summer'?blossom(tip,scale*1.28,pal,r):fruitCluster(sp,tip,angle,scale,pal,r,'berry',2);
   if(name==='honeysuckle'){
     if(season==='summer'||season==='spring'){
       let z='';for(let i=0;i<4;i++){const a=angle+(i-1.5)*.3,pt=sum(tip,Q(a,scale*.5));z+=M.path(`M${V(tip.x,tip.y)}Q${V(pt.x,pt.y-scale*.35)} ${V(pt.x+Math.cos(a)*scale,pt.y+Math.sin(a)*scale)}`,pal.ochre,Math.max(1,scale*.13));z+=M.circle(pt.x+Math.cos(a)*scale,pt.y+Math.sin(a)*scale,scale*.13,pal.vermillion);}return z;
     }
     return season==='autumn'?fruitCluster(sp,tip,angle,scale*.6,pal,r,'berry',3):'';
   }
   if(name==='bramble')return season==='spring'?blossom(tip,scale*.9,pal,r):season==='summer'||season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'blackberry',2):'';
   if(name==='fern')return season==='spring'?M.path(`M${V(at.x,at.y)}q${V(scale,-scale)} ${V(scale*.4,-scale*1.1)}q${V(-scale*.3,-scale*.2)} ${V(-scale*.4,scale*.2)}`,sp.tint,1.6):'';
   if(name==='acanthus')return season==='summer'?blossom(tip,scale*.95,pal,r,false):'';
   return '';
 };
})(window.MS);
