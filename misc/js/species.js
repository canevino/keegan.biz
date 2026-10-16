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
   holly:{name:'holly',habit:'upright',leaf:'holly',bark:'#684832',tint:'#455e39',scale:1.02,leafScale:1.25,frequency:1.14,shootDensity:1.24,shootScale:.82,tertiary:.73,angle:.80,twigs:1.1,evergreen:true,fruit:'holly'},
   hazel:{name:'hazel',habit:'arching',leaf:'hazel',bark:'#886044',tint:'#637341',scale:1.12,leafScale:1.09,frequency:1.0,shootDensity:.92,shootScale:1.04,tertiary:.70,angle:1.16,twigs:1.22,evergreen:false,fruit:'hazel'},
   ivy:{name:'ivy',habit:'climbing',leaf:'ivy',bark:'#6a5036',tint:'#386547',scale:1.03,leafScale:1.05,frequency:1.16,shootDensity:1.15,shootScale:1.15,tertiary:.63,angle:1.0,twigs:.85,evergreen:true,fruit:'ivy'},
   hawthorn:{name:'hawthorn',habit:'angular',leaf:'hawthorn',bark:'#67432f',tint:'#5e713d',scale:.97,leafScale:1.13,frequency:1.20,shootDensity:1.35,shootScale:.88,tertiary:.80,angle:1.05,twigs:1.14,evergreen:false,fruit:'hawthorn'},
   oak:{name:'oak',habit:'heavy',leaf:'oak',bark:'#684733',tint:'#526d3c',scale:1.22,leafScale:1.30,frequency:.88,shootDensity:.95,shootScale:1.04,tertiary:.52,angle:.92,twigs:.82,evergreen:false,fruit:'oak'},
   dogrose:{name:'dog rose',habit:'arching',leaf:'dogrose',bark:'#80563e',tint:'#537344',scale:1.12,leafScale:1.20,frequency:1.04,shootDensity:1.0,shootScale:1.10,tertiary:.8,angle:1.2,twigs:1.16,evergreen:false,fruit:'dogrose'},
   honeysuckle:{name:'honeysuckle',habit:'twining',leaf:'honeysuckle',bark:'#765139',tint:'#65804d',scale:1.05,leafScale:1.1,frequency:1.08,shootDensity:1.16,shootScale:.9,tertiary:.76,angle:1.12,twigs:1.06,evergreen:false,fruit:'honeysuckle'},
   bramble:{name:'bramble',habit:'arching',leaf:'bramble',bark:'#76513e',tint:'#496e42',scale:1.11,leafScale:1.1,frequency:1.05,shootDensity:1.2,shootScale:1.11,tertiary:.94,angle:1.20,twigs:1.25,evergreen:false,fruit:'bramble'},
   fern:{name:'fern',habit:'fronds',leaf:'fern',bark:'#765c3d',tint:'#56734b',scale:1.25,leafScale:1.0,frequency:1.0,shootDensity:1.0,shootScale:1.0,tertiary:0,angle:.94,twigs:0,evergreen:false,fruit:'fern'},
   acanthus:{name:'acanthus',habit:'ornamental',leaf:'acanthus',bark:'#83573f',tint:'#607348',scale:1.24,leafScale:1.25,frequency:.90,shootDensity:.78,shootScale:1.14,tertiary:.5,angle:1.06,twigs:.93,evergreen:true,fruit:'acanthus'}
 };
 M.speciesNames=Object.keys(M.speciesProfiles);
 M.chooseSpecies=(selected,r)=>M.speciesProfiles[selected]||M.speciesProfiles[r.choose(M.speciesNames)];
 M.wood=(sp,pal,age,r)=>{const a=mix(sp.bark,pal.ink,r.between(.06,.20)); return age==='new'?mix(a,sp.tint,.35):a;};
 M.leafPigment=(sp,season,pal,r,s={})=>{
   const ornament=M.clamp(Number(s.ornament||0)/100,0,1);
   let col=mix(sp.tint,pal.green,.14+r.between(0,.16));
   if(season==='spring'){
     col=mix(col,pal.light,r.between(.16,.30));
     if(!sp.evergreen)col=mix(col,pal.ochre,r.between(.02,.10));
   }
   if(season==='summer'){
     col=mix(col,pal.ink,r.between(.02,.08));
   }
   if(season==='autumn'&&!sp.evergreen){
     col=r.choose([
       mix(col,pal.ochre,.52),
       mix(col,pal.vermillion,.26),
       mix(mix(col,pal.ochre,.38),pal.vermillion,.16),
       mix(col,pal.ochre,.28)
     ]);
   }
   if(season==='winter'){
     col=sp.evergreen ? mix(col,pal.ink,.12) : mix(col,pal.ochre,.56);
   }
   if(ornament>.35 && r.chance(Math.pow((ornament-.35)/.65,1.5)*(sp.leaf==='acanthus'?.23:.13))){
     // A small number of leaf-shaped colored impressions, not random symbols.
     col=r.choose([pal.lapis,pal.vermillion,M.mix(col,pal.ochre,.35)]);
   }
   return col;
 };
 // Natural leaf anatomy is defined here; manuscript treatment is a separate,
 // low-amplitude variation of this silhouette, never a replacement polygon.
 const bell=(t,p=.8)=>Math.pow(Math.max(0,Math.sin(Math.PI*t)),p);
 const S=(x,y)=>V(x,y);
 const smoothClose=pts=>{
   // Cardinal cubic interpolation keeps every prescribed lobe while removing
   // the visibly polygonal, repeated zigzags of the older outline builder.
   const N=pts.length;
   let d=`M${S(pts[0].x,pts[0].y)}`;
   for(let i=0;i<N;i++){
     const prev=pts[(i+N-1)%N],from=pts[i],to=pts[(i+1)%N],next=pts[(i+2)%N];
     const k=.15;
     const c1=P(from.x+(to.x-prev.x)*k,from.y+(to.y-prev.y)*k);
     const c2=P(to.x-(next.x-from.x)*k,to.y-(next.y-from.y)*k);
     d+=`C${S(c1.x,c1.y)} ${S(c2.x,c2.y)} ${S(to.x,to.y)}`;
   }
   return d+'Z';
 };
 function outline(kind,len,r,s){
   const ornament=M.ornamentInfluence?M.ornamentInfluence({leaf:kind},s):0;
   const phase=r.between(-.5,.5);
   const serrate=['hazel','dogrose','bramble'].includes(kind);
   const steps=serrate?24:20;
   const size=kind==='hazel'?.35:kind==='acanthus'?.36:kind==='hawthorn'?.32:kind==='bramble'?.27:kind==='dogrose'?.24:kind==='honeysuckle'?.27:.30;
   const left=[],right=[];
   const width=(t,side)=>{
     let w=bell(t,kind==='hazel'?.67:kind==='honeysuckle'?.90:.79);
     // Pointed, heart-like hazel blades have their greatest width in the basal
     // half. Honeysuckle is entire-margined, bramble and rose are serrated.
     if(kind==='hazel')w*=1+.22*(1-t);
     if(kind==='honeysuckle')w*=.89+.23*t;
     if(kind==='dogrose')w*=.90+.10*t;
     if(kind==='hawthorn'){
       const lobe=.20*Math.cos(6.6*Math.PI*t+phase);
       w*=.84+lobe+.09*Math.sin(3.2*Math.PI*t);
     }
     if(kind==='acanthus'){
       const lobes=.31*Math.cos(8.4*Math.PI*t+phase);
       w*=.79+lobes+.05*Math.sin(2.7*Math.PI*t);
     }
     if(kind==='bramble')w*=.99+.05*Math.cos(8*Math.PI*t);
     if(serrate){
       const wave=Math.cos((kind==='hazel'?18:kind==='dogrose'?16:14)*Math.PI*t+(side===1?.4:1.0));
       w*=1+(kind==='hazel'?.045:.047)*Math.pow(Math.max(0,wave),3);
     }
     // An illuminator may gently amplify real anatomical lobes, but never
     // convert an ordinary plant into one generic ornamental sawblade.
     if(ornament>.01)w*=1+.09*ornament*(1+.16*Math.sin(5*Math.PI*t+phase));
     return Math.max(0,w);
   };
   const baseBend=r.between(-.028,.028)*len;
   for(let i=0;i<=steps;i++){
     const t=i/steps;
     const x=t*len;
     const y=baseBend*Math.sin(Math.PI*t)*t;
     const sideVariation=1+.055*Math.sin(t*3*Math.PI+phase);
     left.push(P(x,y-size*len*width(t,-1)*sideVariation));
     right.push(P(x,y+size*len*width(t,1)*(1-.043*Math.sin(t*4*Math.PI+phase))));
   }
   return smoothClose([...left,...right.slice(1,-1).reverse()]);
 }
 function explicitLeaf(kind,len,r,s){
   const ornament=M.ornamentInfluence?M.ornamentInfluence({leaf:kind},s):0;
   const width=1+.13*ornament;
   const v=(x,y)=>S(x*len,y*len*width);
   if(kind==='ivy'){
     // Five-lobed ivy blade: the basal lobes turn backwards towards the stem,
     // with curved sinuses and a broad central leaf rather than sharp triangles.
     return `M0 0 C${v(.11,-.05)} ${v(.16,-.17)} ${v(.17,-.28)} `+
       `C${v(.24,-.32)} ${v(.29,-.25)} ${v(.32,-.23)} `+
       `C${v(.39,-.27)} ${v(.39,-.46)} ${v(.44,-.48)} `+
       `C${v(.53,-.47)} ${v(.52,-.25)} ${v(.57,-.23)} `+
       `C${v(.72,-.20)} ${v(.80,-.09)} ${v(1,0)} `+
       `C${v(.80,.09)} ${v(.72,.20)} ${v(.57,.23)} `+
       `C${v(.52,.25)} ${v(.53,.47)} ${v(.44,.48)} `+
       `C${v(.39,.46)} ${v(.39,.27)} ${v(.32,.23)} `+
       `C${v(.29,.25)} ${v(.24,.32)} ${v(.17,.28)} `+
       `C${v(.16,.17)} ${v(.11,.05)} 0 0 Z`;
   }
   if(kind==='holly'){
     const f=1+ornament*.09,p=(x,y)=>S(len*x,len*y*f);
     return `M0 0 C${p(.13,-.09)} ${p(.20,-.18)} ${p(.26,-.17)} `+
       `L${p(.30,-.31)} Q${p(.38,-.18)} ${p(.44,-.22)} `+
       `L${p(.53,-.36)} Q${p(.60,-.18)} ${p(.67,-.20)} `+
       `L${p(.75,-.27)} Q${p(.85,-.11)} ${p(1,0)} `+
       `Q${p(.84,.12)} ${p(.75,.27)} `+
       `L${p(.67,.20)} Q${p(.60,.18)} ${p(.53,.36)} `+
       `L${p(.44,.22)} Q${p(.38,.18)} ${p(.30,.31)} `+
       `L${p(.26,.17)} C${p(.20,.18)} ${p(.13,.09)} 0 0 Z`;
   }
   if(kind==='oak'){
     const f=1+ornament*.15,p=(x,y)=>S(len*x,len*y*f);
     return `M0 0 C${p(.05,-.08)} ${p(.14,-.08)} ${p(.17,-.12)} `+
       `C${p(.12,-.22)} ${p(.22,-.32)} ${p(.29,-.30)} `+
       `Q${p(.35,-.29)} ${p(.38,-.21)} `+
       `C${p(.34,-.40)} ${p(.46,-.43)} ${p(.53,-.39)} `+
       `Q${p(.60,-.34)} ${p(.59,-.24)} `+
       `C${p(.64,-.40)} ${p(.74,-.38)} ${p(.78,-.28)} `+
       `Q${p(.80,-.15)} ${p(.84,-.16)} Q${p(.94,-.13)} ${p(1,0)} `+
       `Q${p(.94,.13)} ${p(.84,.16)} Q${p(.80,.15)} ${p(.78,.28)} `+
       `C${p(.74,.38)} ${p(.64,.40)} ${p(.59,.24)} `+
       `Q${p(.60,.34)} ${p(.53,.39)} `+
       `C${p(.46,.43)} ${p(.34,.40)} ${p(.38,.21)} `+
       `Q${p(.35,.29)} ${p(.29,.30)} `+
       `C${p(.22,.32)} ${p(.12,.22)} ${p(.17,.12)} `+
       `C${p(.14,.08)} ${p(.05,.08)} 0 0 Z`;
   }
   return outline(kind,len,r,s);
 }
 function simpleLeaf(sp,size,season,pal,r,kindOverride,s={registration:0,pigment:40,wear:20}){
   const kind=kindOverride||sp.leaf;
   const d=explicitLeaf(kind,size,r,s),color=M.leafPigment(sp,season,pal,r,s),id=`leaf-${r.int(10000,999999999)}`;
   // Compound leaves may contain hundreds of tiny leaflets. At this scale the
   // per-leaf filter/mask machinery creates huge SVGs without visible benefit.
   // Keep a crisp botanical blade and its midrib; reserve rich ink for big leaves.
   if(size<42){
     const outline=M.shape(d,color,`stroke="${pal.ink}" stroke-width="${n(Math.max(.36,size*.024))}" stroke-linejoin="round"`);
     const grain=M.shape(d,'url(#speckle)',`opacity="${n(.20+(s.wear||0)*.004)}"`);
     const rib=M.path(`M0 0Q${V(size*.52,-size*.011)} ${V(size*.95,0)}`,mix(color,pal.ink,.46),Math.max(.22,size*.017),'opacity=".48"');
     const ornament=M.ornamentLeafInterior?M.ornamentLeafInterior(sp,size,color,pal,r,s):'';
     return `<g>${outline}${grain}</g>${rib}${ornament}`;
   }
   let z=M.leafFinish(id,d,size,color,pal,s,r);
   z+=`<g clip-path="url(#leaf-clip-${id})">`;
   const midrib=mix(color,pal.ink,.44);
   z+=M.path(`M0 0 Q${V(size*.49,-size*.012)} ${V(size*.97,0)}`,midrib,Math.max(.35,size*.014),`opacity=".58"`);
   const veins=Math.max(2,Math.round((Number(s.detail??60)/100)*(size>28?7:5)));
   const broad=['acanthus','hawthorn','hazel','ivy','oak','holly'].includes(kind);
   for(let i=0;i<veins;i++){
     const t=.18+(i+.2)*.65/veins,x=size*t;
     for(const sign of [-1,1]){
       const y=sign*size*(broad?.27:.19)*Math.sin(Math.PI*t)*(.83+.13*r.random());
       z+=M.path(`M${V(x,-size*.008)}Q${V(x+size*.052,y*.38)} ${V(x+size*.14,y)}`,midrib,Math.max(.22,size*.008),`opacity=".42"`);
     }
   }
   if(M.ornamentLeafInterior)z+=M.ornamentLeafInterior(sp,size,color,pal,r,s);
   return z+'</g>';
 }
 function compound(sp,size,season,pal,r,s){
   const rose=sp.leaf==='dogrose',count=rose?2:(r.chance(.48)?2:1);
   let z=M.path(`M0 0 Q${V(size*.43,-size*.04)} ${V(size*.90,0)}`,mix(sp.bark,pal.ink,.23),Math.max(.45,size*.021));
   for(let i=0;i<count;i++){
     const t=(i+1)/(count+1),x=size*(.16+t*.56);
     const signs=[-1,1];
     for(const sign of signs){
       const a=sign*(rose?.72:.82) + r.between(-.08,.08);
       const d=size*(rose?.35:.41)*(1+.09*r.random());
       z+=`<g transform="translate(${V(x,0)}) rotate(${n(a*180/Math.PI)})">`+simpleLeaf(sp,d,season,pal,r,rose?'dogrose':'bramble',s)+'</g>';
     }

   }
   z+=`<g transform="translate(${V(size*.88,0)})">`+simpleLeaf(sp,size*(rose?.37:.45),season,pal,r,rose?'dogrose':'bramble',s)+`</g>`;
   return z;
 }
 function fernFrond(sp,size,season,pal,r,s){
   let z=M.path(`M0 0 Q${V(size*.48,-size*.12)} ${V(size,0)}`,M.wood(sp,pal,'new',r),1.4);
   const pairs=12;
   for(let i=1;i<=pairs;i++){
     const t=i/(pairs+1),x=size*t,span=size*.21*Math.sin(Math.PI*t)**.88;
     for(const sign of [-1,1]){
       const d=`M${V(x,0)} Q${V(x+size*.04,sign*span*.53)} ${V(x+size*.16,sign*span)} Q${V(x+size*.065,sign*span*.83)} ${V(x,0)}Z`;
       const c=M.leafPigment(sp,season,pal,r,s);
       z+=M.leafFinish(`fern-${r.int(10000,999999999)}`,d,Math.max(8,size*.2),c,pal,s,r);
     }
   }
   if(M.ornamentTerminal)z+=M.ornamentTerminal(sp,{x:size,y:0},-.25,size*.11,pal,r,s);
   return z;
 }
 M.plantLeaf=(sp,at,angle,size,season,pal,r,s={registration:0,pigment:40,wear:20})=>{
   if(season==='winter'&&!sp.evergreen && r.chance(sp.leaf==='fern'?.96:.95))return '';
   const leaf=sp.leaf==='fern'?fernFrond(sp,size,season,pal,r,s):['dogrose','bramble'].includes(sp.leaf)?compound(sp,size,season,pal,r,s):simpleLeaf(sp,size,season,pal,r,undefined,s);
   // Larger illuminated leaves appear as the transformation increases.
   const ornamental=M.ornamentInfluence?M.ornamentInfluence(sp,s):0;
   const petiole=Math.min(9,Math.max(2.2,size*.11));
   const stem=M.path(`M0 0 L${V(petiole,0)}`,M.wood(sp,pal,'new',r),Math.max(.46,size*.033));
   const magnify=1+ornamental*.08;
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
 function rawOrgan(sp,at,angle,season,pal,r,scale=8){
   const name=sp.leaf,tip=sum(at,Q(angle,scale*.7));
   if(name==='holly') return season==='winter'||season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'berry',3):season==='spring'?blossom(tip,scale*.47,pal,r):'';
   if(name==='hazel'){
     if(season==='winter'||season==='spring'){
       let z='';for(let i=0;i<2;i++){const pt=sum(at,Q(angle+(.42*i-.17),scale*.7));z+=M.path(`M${V(at.x,at.y)}Q${V(pt.x,pt.y)} ${V(pt.x+1,pt.y+scale*1.2)}`,mix(sp.bark,pal.ink,.14),1);for(let j=0;j<5;j++)z+=M.circle(pt.x+1,pt.y+j*scale*.26,scale*.23,pal.ochre,`stroke="${pal.ink}" stroke-width=".35"`);}return z;
     }
     if(season==='autumn')return fruitCluster(sp,tip,angle,scale*.8,pal,r,'nut',2);return '';
   }
   if(name==='ivy')return season==='winter'?fruitCluster(sp,tip,angle,scale,pal,r,'blackberry',3):'';
   if(name==='hawthorn')return season==='spring'?blossom(tip,scale*1.20,pal,r):season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'berry',3):'';
   if(name==='oak'){
     if(season==='autumn'){
       let z=fruitCluster(sp,tip,angle,scale*.75,pal,r,'nut',2);
       z+=M.shape(`M${V(tip.x-scale*.46,tip.y)}Q${V(tip.x,tip.y-scale*.42)} ${V(tip.x+scale*.46,tip.y)}Z`,mix(pal.ochre,sp.bark,.2),`stroke="${pal.ink}" stroke-width=".5"`);return z;
     }return '';
   }
   if(name==='dogrose')return season==='spring'||season==='summer'?blossom(tip,scale*1.65,pal,r):fruitCluster(sp,tip,angle,scale,pal,r,'berry',2);
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
 }
 // Layered life-cycle states. Only the selected-season final is exported or
 // shown when still; preview animation reveals a stalk-attached bud, then a
 // blossom, and finally the season's organ (berries, hips, nut, catkin, etc.).
 M.plantOrgan=(sp,at,angle,season,pal,r,scale=8)=>{
   const snapshot=(stage)=>M.rng(M.childSeed((Math.round(at.x*111+at.y*331+scale*17)>>>0),stage));
   const final=rawOrgan(sp,at,angle,season,pal,snapshot(43),scale);
   if(!final)return '';
   const tip=sum(at,Q(angle,scale*.7));
   const base=M.path(`M${V(at.x,at.y)} Q${V(at.x+Math.cos(angle-.14)*scale*.44,at.y+Math.sin(angle-.14)*scale*.44)} ${V(tip.x,tip.y)}`,
     M.wood(sp,pal,'new',snapshot(15)),Math.max(.55,scale*.095));
   const budTip=sum(tip,Q(angle,scale*.32)),v=(p)=>V(p.x,p.y);
   const bloom=rawOrgan(sp,at,angle,'spring',pal,snapshot(23),scale)||blossom(tip,scale*.79,pal,snapshot(25));
   const bud=M.path(`M${V(tip.x,tip.y)}L${v(budTip)}`,M.mix(sp.tint,pal.ink,.3),.65)+
     `<ellipse cx="${n(budTip.x)}" cy="${n(budTip.y)}" rx="${n(scale*.24)}" ry="${n(scale*.37)}" transform="rotate(${n(angle*180/Math.PI+90)} ${v(budTip)})" fill="${M.mix(sp.tint,pal.ochre,.28)}" stroke="${pal.ink}" stroke-width=".46"/>`;
   return `<g class="growth-organ" data-life="${M.escape(sp.leaf)}">${base}`+
     `<g class="life-bud">${bud}</g>`+
     `<g class="life-bloom">${bloom}</g>`+
     `<g class="life-final">${final}</g></g>`;
 };
})(window.MS);