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
 // Pass 1 / leaf atlas. Each shape is a variation of its species, not an
 // interchangeable decorative glyph. Variation changes lobes, taper, asymmetry
 // and minor insect/printing irregularities, never botanical identity.
 const S=(x,y)=>M.vec(x,y);
 const smoothClose=(pts,sharp=false)=>{
   const N=pts.length; let d=`M${S(pts[0].x,pts[0].y)}`;
   for(let i=0;i<N;i++){
     const prev=pts[(i+N-1)%N],from=pts[i],to=pts[(i+1)%N],next=pts[(i+2)%N];
     // Smoother historical-plate contours; angular hollies retain true spines.
     if(sharp){d+=`L${S(to.x,to.y)}`;continue;}
     const k=.135;
     d+=`C${S(from.x+(to.x-prev.x)*k,from.y+(to.y-prev.y)*k)} `+
       `${S(to.x-(next.x-from.x)*k,to.y-(next.y-from.y)*k)} ${S(to.x,to.y)}`;
   }
   return d+'Z';
 };
 const bell=(t,p=.76)=>Math.pow(Math.max(0,Math.sin(Math.PI*t)),p);
 const bump=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));
 function blade(kind,len,r,s){
   const ornament=M.ornamentInfluence?M.ornamentInfluence({leaf:kind},s):0;
   const variant=r.int(0,8),yaw=r.between(-.095,.095),phase=r.between(-1,1);
   // Each blade is drawn separately: asymmetry, uneven lobes, damaged cuticle.
   // Noise is coherent at three spatial scales, NOT low-resolution pixelation.
   const uneven=r.between(.032,.090),offsetA=r.between(-6.28,6.28),offsetB=r.between(-6.28,6.28);
   const nickAt=r.between(.19,.81),nickDepth=r.between(.018,.072);
   const handed=r.between(-.085,.085);
   const pairs=kind==='holly'?32:kind==='hazel'?42:kind==='oak'?34:kind==='bramble'||kind==='dogrose'?40:44;
   const widths={holly:.27,hazel:.36,ivy:.39,hawthorn:.32,oak:.39,
     dogrose:.27,honeysuckle:.25,bramble:.29,fern:.12,acanthus:.41};
   const scale=(widths[kind]||.3)*(1+variant*.023+ornament*.085);
   let result=[];
   for(const side of [-1,1]){
     const line=[];
     for(let i=0;i<=pairs;i++){
       const t=i/pairs;
       // A shared stalk-tip axis with a slight hand-drawn bow.
       let x=t*len;
       let w=bell(t,kind==='honeysuckle'?.98:.74);
       const sideOffset=side*(.044*Math.sin(3.7*t+phase)+.029*Math.sin(7*t+variant));
       if(kind==='hazel'){
         // Rounded, broad-at-base hazel with a true serrate edge.
         w*=1.19-.44*t;
         w*=1+.039*Math.cos(32*Math.PI*t+side*.48);
       } else if(kind==='holly'){
         // Four distinct sharp spines per margin; intervening lobes curve inward.
         w*=.83 + [.23,.44,.65,.84].reduce((v,q)=>v+.25*bump(t,q+.007*side,.023)-.15*bump(t,q+.065,.035),0);
       } else if(kind==='oak'){
         // Three or four broad, rounded lobes with clear deep sinuses.
         const lobes=[.22,.45,.70];
         w*=.40 + lobes.reduce((v,q)=>v+.60*bump(t,q+side*.015,.105),0);
         w*=1-.13*bump(t,.83,.035);
       } else if(kind==='hawthorn'){
         w*=.70 + [.29,.58,.80].reduce((v,q)=>v+.35*bump(t,q+.012*side,.072)-.14*bump(t,q+.12,.04),0);
       } else if(kind==='acanthus'){
         w*=.55 + [.16,.32,.52,.70,.86].reduce((v,q)=>v+.56*bump(t,q+side*.012,.061)-.25*bump(t,q+.077,.025),0);
       } else if(kind==='ivy'){
         // Long central spear with two backward-facing lobes either side.
         w*=.46+.52*bump(t,.28,.13)+.70*bump(t,.51,.12)-.25*bump(t,.69,.075);
       } else if(kind==='dogrose'||kind==='bramble'){
         w*=kind==='bramble'?1.08-.20*t:.90+.16*t;
         w*=1+.047*Math.cos((kind==='bramble'?28:32)*Math.PI*t+side*.45);
       } else if(kind==='honeysuckle'){
         w*=.76+.37*bump(t,.54,.35);
       }
       // Non-mirrored undulations give leaves individuality without losing the
       // defining outline of a holly, rose leaflet, oak or acanthus blade.
       w*=1+sideOffset+handed*side*(.3+.7*t) +
           uneven*(.48*Math.sin(10*t+offsetA+side*.8)+.31*Math.sin(19*t+offsetB+side*1.6));
       w*=1-nickDepth*bump(t,nickAt+side*.035,.012)*(kind==='holly'?.25:1);
       if(ornament>.02 && M.ornamentWidth)w=M.ornamentWidth(kind,t,w,ornament,phase);
       // A very small amount of irregular hand-cut outline; never pixelation.
       w*=1+(kind==='oak'?.003:.010)*Math.sin(t*50+variant*2.1+side);
       let y=side*len*scale*Math.max(0,w)+len*yaw*.25*Math.sin(Math.PI*t);
       // Only a modest displacement of the hand-drawn contour; no zigzags.
       if(ornament>.25&&M.ornamentPoint){const pt=M.ornamentPoint(x,y,t,ornament,len,phase);x=pt.x;y=pt.y;}
       line.push({x,y});
     }
     result.push(line);
   }
   return smoothClose([...result[0],...result[1].slice(1,-1).reverse()],kind==='holly');
 }
 function leafVeins(kind,size,color,pal,r,s={}){
   const ink=M.mix(color,pal.ink,.51),ochre=M.mix(color,pal.ochre,.43);
   const deep=M.mix(color,pal.ink,.66),lit=M.mix(color,pal.light,.34);
   const ornamental=M.ornamentInfluence?.({leaf:kind},s)||0;
   const length=kind==='ivy'?.94:.96;
   let out='';
   // The midrib is not a uniformly weighted line: an offset light vein and
   // a dark lower edge give a tiny engraved relief at actual on-page size.
   out+=M.path(`M${S(size*.045,-size*.006)}Q${S(size*.42,-size*.036)} ${S(size*length,0)}`,
      deep,Math.max(.28,size*.024),`opacity="${M.n(.46+.12*ornamental)}"`);
   out+=M.path(`M${S(size*.055,size*.007)}Q${S(size*.40,size*.008)} ${S(size*.88,size*.003)}`,
      ochre,Math.max(.25,size*.012),'opacity=".61"');
   const count=kind==='holly'?4:kind==='oak'||kind==='acanthus'?6:
     kind==='ivy'?4:kind==='hazel'?7:kind==='hawthorn'?5:5;
   for(let i=0;i<count;i++){
     const t=.16+(i+.40)*.76/count,x=size*t,tipVariance=r.between(.81,1.17);
     for(const side of [-1,1]){
       const reach=size*(kind==='acanthus'?.31:kind==='oak'?.30:kind==='ivy'?.23:kind==='holly'?.19:.22)*Math.sin(Math.PI*t)*tipVariance;
       const dx=size*r.between(.075,.16);
       const tipX=x+dx,tipY=side*reach;
       out+=M.path(`M${S(x,0)}Q${S(x+size*.055,side*reach*.18)} ${S(tipX,tipY)}`,
          (i+side)%4===0?ochre:ink,Math.max(.20,size*.011),`opacity="${M.n(r.between(.32,.56)+ornamental*.13)}"`);
       // Secondary venules subdivide the surface rather than repeating simple
       // symmetrical arrows. Their intersection remains inside leaf clips.
       if(size>15 && kind!=='holly'){
         for(let j=0;j<2;j++){
           const u=.42+j*.29;
           const ox=x+(tipX-x)*u, oy=tipY*u;
           out+=M.path(`M${S(ox,oy)}q${S(size*.038,side*size*.025)} ${S(size*.068,side*size*.044)}`,
             deep,Math.max(.15,size*.004),`opacity="${M.n(r.between(.19,.39))}"`);
         }
       }
     }
   }
   // Species-led plate etching on the leaf: selective engraved hatching and
   // soft pigment pools. Never a repeated overlay/pixel grid.
   const hatchCount=size>18?Math.round(size*(kind==='hazel'?1.15:.70)):0;
   for(let i=0;i<hatchCount;i++){
     const t=r.between(.18,.87),side=r.sign(),y=size*r.between(.025,.18)*side*Math.sin(Math.PI*t);
     const x=size*t,run=size*r.between(.018,.062);
     out+=M.path(`M${S(x,y)}l${S(run,-side*run*.55)}`,i%5===0?lit:deep,
       Math.max(.12,size*.004),`opacity="${M.n(r.between(.12,.34))}"`);
   }
   // A little pigment pooled at the base suggests a folded/cupped leaf.
   const fold=`M${S(size*.075,0)}Q${S(size*.26,-size*.10)} ${S(size*.44,-size*.12)}Q${S(size*.28,-size*.045)} ${S(size*.075,0)}Z`;
   out+=M.shape(fold,deep,`opacity="${M.n(.045+r.between(0,.06))}"`);
   if(ornamental>.40){
     const c=M.mix(pal.ochre,pal.vermillion,.15);
     out+=M.path(`M${S(size*.14,0)}Q${S(size*.46,-size*.012)} ${S(size*.82,0)}`,
       c,Math.max(.24,size*.026),`opacity="${M.n((ornamental-.40)*.74)}"`);
   }
   return out;
 }

 function simpleLeaf(sp,size,season,pal,r,kindOverride,s={registration:0,pigment:40,wear:20}){
   const kind=kindOverride||sp.leaf,d=blade(kind,size,r,s),
     color=M.leafPigment(sp,season,pal,r,s),id=`leaf-${r.int(10000,999999999)}`;
   let art=M.leafFinish(id,d,size,color,pal,s,r);
   const clipId=`leaf-clip-${id}`;
   const veins=leafVeins(kind,size,color,pal,r,s);
   const ornament=M.ornamentLeafInterior?M.ornamentLeafInterior(sp,size,color,pal,r,s):'';
   const patch=M.ornamentColorPatch?M.ornamentColorPatch(sp,size,pal,r,s):'';
   let plateMarks='';
   if(size>16){
     const count=Math.floor(6+size*.40),ink=M.mix(color,pal.ink,.55);
     for(let i=0;i<count;i++){
       const t=r.between(.14,.86),y=r.between(-.17,.17)*size*Math.sin(Math.PI*t);
       const rad=r.between(.15,.46);
       plateMarks+=M.circle(t*size,y,rad,r.chance(.22)?pal.ochre:ink,
         `opacity="${n(r.between(.11,.34))}"`);
     }
   }
   art+=`<g clip-path="url(#${clipId})">${veins}${plateMarks}${patch}${ornament}</g>`;
   return art;
 }
 function compound(sp,size,season,pal,r,s){
   const rose=sp.leaf==='dogrose',pairs=rose?(r.chance(.54)?3:2):(r.chance(.62)?2:1);
   const shaft=M.mix(sp.bark,sp.tint,.28);
   let z=M.path(`M0 0 Q${S(size*.42,-size*.045)} ${S(size*.96,0)}`,shaft,Math.max(.48,size*.022));
   for(let i=0;i<pairs;i++){
     const t=.19+i*.25,x=size*t;
     for(const side of [-1,1]){
       const len=size*(rose?.36:.42)*r.between(.78,1.12)*(1-.08*i),a=side*(rose?.84:.91)+r.between(-.17,.17);
       const basal=S(x,0);
       z+=`<g transform="translate(${basal}) rotate(${M.n(a*180/Math.PI)})">`+
         simpleLeaf(sp,len,season,pal,r,sp.leaf,s)+'</g>';
     }
   }
   z+=`<g transform="translate(${S(size*.75,0)})">`+
     simpleLeaf(sp,size*(rose?.41:.49),season,pal,r,sp.leaf,s)+'</g>';
   return z;
 }
 function fernFrond(sp,size,season,pal,r,s){
   const shaft=M.mix(sp.tint,pal.ink,.34);
   let z=M.path(`M0 0 Q${S(size*.44,-size*.075)} ${S(size*.99,0)}`,shaft,Math.max(.65,size*.023));
   const pairs=Math.max(7,Math.round(size/7));
   for(let i=0;i<pairs;i++){
     const t=.10+i*.82/pairs,span=size*.24*Math.pow(Math.sin(Math.PI*t),.92)*(1-.25*t),x=size*t;
     for(const side of [-1,1]){
       const len=span*(1+r.between(-.07,.07));
       const a=side*(.95+.18*t);
       z+=`<g transform="translate(${S(x,0)}) rotate(${M.n(a*180/Math.PI)})">`+
          simpleLeaf(sp,len,season,pal,r,'honeysuckle',s)+'</g>';
     }
   }
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
 // Species organs use illustrated morphology: a five-petalled rose is not a
 // colored dot, a blackberry consists of individual drupelets, and acorns have
 // visible cups. Motifs attach at a real shoot terminal.
 const pt=(at,a,d)=>({x:at.x+Math.cos(a)*d,y:at.y+Math.sin(a)*d});
 function blossom(at,scale,pal,r,kind='hawthorn'){
   let z='',petals=kind==='honeysuckle'?4:5;
   const flowerPhase=r.between(-.20,.20),petalVariance=Array.from({length:5},()=>r.between(.80,1.17));
   const blossomColor=kind==='dogrose'?M.mix('#e6a4b3',pal.light,.21):
     kind==='acanthus'?pal.lapis:M.mix(pal.light,'#ffffff',.73);
   const center=at;
   for(let i=0;i<petals;i++){
     const a=(i+(.035*r.random()))*2*Math.PI/petals+flowerPhase+r.between(-.08,.08),
        extent=petalVariance[i]*scale,edge=pt(center,a,extent*.51),left=pt(center,a-.51,extent*.32),right=pt(center,a+.51,extent*.34),
        tip1=pt(center,a-.17,extent*.68),tip2=pt(center,a+.16,extent*.66);
     const d=`M${S(center.x,center.y)}C${S(left.x,left.y)} ${S(tip1.x,tip1.y)} ${S(edge.x,edge.y)}`+
       `C${S(tip2.x,tip2.y)} ${S(right.x,right.y)} ${S(center.x,center.y)}Z`;
     z+=M.shape(d,blossomColor,`stroke="${pal.ink}" stroke-width=".56"`)+M.shape(d,'url(#brush-fiber)',`opacity=".46"`)+M.shape(d,'url(#micro-grain)',`opacity=".33"`);
     z+=M.path(`M${S(center.x,center.y)}Q${S(edge.x,edge.y)} ${S(tip1.x,tip1.y)}`,
       M.mix(blossomColor,pal.vermillion,.59),.47,'opacity=".62"');
     const shadow=pt(center,a,extent*.31);
     z+=M.circle(shadow.x,shadow.y,extent*.09,M.mix(blossomColor,pal.vermillion,.40),'opacity=".22"');
   }
   z+=M.circle(center.x,center.y,Math.max(1.2,scale*.17),pal.ochre,`stroke="${pal.ink}" stroke-width=".35"`);
   const stamens=kind==='dogrose'?7:kind==='hawthorn'?5:3;
   for(let i=0;i<stamens;i++){
     const ang=i*2.4,a=pt(center,ang,scale*.28),b=pt(center,ang,scale*.36);
     z+=M.path(`M${S(a.x,a.y)}L${S(b.x,b.y)}`,pal.ochre,.36);
     z+=M.circle(b.x,b.y,.48,pal.vermillion);
   }
   return z;
 }
 function berry(sp,at,size,pal,r,type){
   const shadow=M.mix(pal.ink,type==='blackberry'?'#532d50':pal.vermillion,.47);
   if(type==='blackberry'){
     let z='';
     // Blackberry cross-section: small dark drupelets taper into a cone.
     for(let row=0;row<3;row++){
       const count=4-row;
       for(let j=0;j<count;j++){
         const x=at.x+(j-(count-1)/2)*size*.34,y=at.y+(row-1)*size*.30;
         const col=r.choose(['#302333','#4b2e47','#673449','#261e29']);
         z+=M.circle(x,y,size*.19,col,`stroke="${pal.ink}" stroke-width=".38" data-pixel-organ="1"`);
         z+=M.circle(x-size*.05,y-size*.05,Math.max(.26,size*.045),M.mix(col,pal.light,.36),'opacity=".66"');
       }
     }
     z+=M.path(`M${S(at.x-size*.43,at.y-size*.45)}Q${S(at.x,at.y-size*.65)} ${S(at.x+size*.43,at.y-size*.45)}`,sp.tint,.6);
     return z;
   }
   if(type==='hip'){
     const d=`M${S(at.x-size*.20,at.y-size*.45)}Q${S(at.x-size*.65,at.y)} ${S(at.x-size*.19,at.y+size*.65)}Q${S(at.x+size*.22,at.y+size*.72)} ${S(at.x+size*.40,at.y)}Q${S(at.x+size*.28,at.y-size*.42)} ${S(at.x-size*.20,at.y-size*.45)}Z`;
     return M.shape(d,pal.vermillion,`stroke="${pal.ink}" stroke-width=".56" data-pixel-organ="1"`)+
       M.path(`M${S(at.x,at.y-size*.52)}l${S(-size*.14,-size*.22)}m${S(size*.14,size*.22)}l${S(size*.17,-size*.20)}`,sp.tint,.59);
   }
   if(type==='acorn'){
     const d=`M${S(at.x-size*.35,at.y-size*.22)}Q${S(at.x-size*.46,at.y+size*.36)} ${S(at.x,at.y+size*.78)}Q${S(at.x+size*.46,at.y+size*.36)} ${S(at.x+size*.35,at.y-size*.22)}Z`;
     const cap=`M${S(at.x-size*.45,at.y)}Q${S(at.x,at.y-size*.61)} ${S(at.x+size*.45,at.y)}Q${S(at.x,at.y+size*.18)} ${S(at.x-size*.45,at.y)}Z`;
     return M.shape(d,M.mix(pal.ochre,sp.bark,.36),`stroke="${pal.ink}" stroke-width=".56" data-pixel-organ="1"`)+
       M.shape(cap,M.mix(sp.tint,sp.bark,.46),`stroke="${pal.ink}" stroke-width=".46"`)+
       M.path(`M${S(at.x-size*.25,at.y-.8)}l${S(size*.5,.3)}`,pal.ochre,.45);
   }
   const color=type==='ivy'?'#283e55':pal.vermillion;
   return M.circle(at.x,at.y,size*.49,color,`stroke="${pal.ink}" stroke-width=".55" data-pixel-organ="1"`)+
     M.circle(at.x,at.y,size*.47,'url(#micro-grain)',`opacity=".50" data-pixel-organ="1"`)+
     M.circle(at.x-size*.14,at.y-size*.16,size*.12,M.mix(color,pal.light,.38),'opacity=".54"');
 }
 function fruitCluster(sp,at,a,scale,pal,r,type,count){
   let z='';const L=Math.max(6,scale);
   for(let i=0;i<count;i++){
     const dir=a+(i-(count-1)/2)*.43+r.between(-.07,.07),tip=pt(at,dir,L*(.58+r.between(.05,.28)));
     z+=M.path(`M${S(at.x,at.y)}Q${S(at.x+(tip.x-at.x)*.42,at.y+(tip.y-at.y)*.36)} ${S(tip.x,tip.y)}`,
        M.mix(sp.tint,sp.bark,.42),Math.max(.52,scale*.075));
     z+=berry(sp,tip,scale*(type==='blackberry'?.79:type==='hip'?.65:type==='acorn'?.72:.47),pal,r,type);
   }
   return z;
 }
 function rawOrgan(sp,at,angle,season,pal,r,scale=8){
   const name=sp.leaf,tip=pt(at,angle,scale*.65);
   if(name==='holly')return ['winter','autumn'].includes(season)?fruitCluster(sp,tip,angle,scale,pal,r,'red',3):season==='spring'?blossom(tip,scale*.53,pal,r,name):'';
   if(name==='hazel'){
     if(season==='winter'||season==='spring'){
       let z='';for(let i=0;i<2;i++){
         const p=pt(tip,angle+(i?-.42:.32),scale*.40);
         z+=M.path(`M${S(tip.x,tip.y)}Q${S(p.x,p.y+scale*.50)} ${S(p.x+scale*.24,p.y+scale*1.2)}`,sp.bark,.68);
         for(let j=0;j<5;j++){
           const q={x:p.x+scale*.14+Math.sin(j*1.2)*scale*.05,y:p.y+scale*.36+j*scale*.17};
           z+=M.shape(`M${S(q.x-scale*.23,q.y-scale*.10)}Q${S(q.x,q.y-scale*.26)} ${S(q.x+scale*.23,q.y-scale*.10)}Q${S(q.x,q.y+scale*.20)} ${S(q.x-scale*.23,q.y-scale*.10)}Z`,pal.ochre,`stroke="${pal.ink}" stroke-width=".34"`);
         }
       }return z;
     }
     return season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'acorn',2):'';
   }
   if(name==='ivy')return season==='winter'?fruitCluster(sp,tip,angle,scale,pal,r,'ivy',4):'';
   if(name==='hawthorn')return season==='spring'?blossom(tip,scale*1.12,pal,r,name):season==='autumn'||season==='winter'?fruitCluster(sp,tip,angle,scale,pal,r,'red',3):'';
   if(name==='oak')return season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'acorn',2):'';
   if(name==='dogrose')return season==='spring'||season==='summer'?blossom(tip,scale*2.15,pal,r,name):fruitCluster(sp,tip,angle,scale,pal,r,'hip',1);
   if(name==='honeysuckle'){
     if(season==='spring'||season==='summer'){
       let z='';for(let i=0;i<4;i++){
         const dir=angle+(i-1.5)*.23,base=pt(tip,dir,scale*.32),head=pt(base,dir,scale*.88);
         const tube=`M${S(tip.x,tip.y)}Q${S(base.x+scale*.06,base.y-scale*.10)} ${S(head.x,head.y)}`;
         z+=M.path(tube,M.mix(pal.ochre,pal.light,.28),Math.max(.85,scale*.13));
         const lip1=pt(head,dir-.60,scale*.34),lip2=pt(head,dir+.55,scale*.34);
         z+=M.path(`M${S(lip1.x,lip1.y)}Q${S(head.x,head.y)} ${S(lip2.x,lip2.y)}`,pal.vermillion,.65);
         for(let k=0;k<3;k++){const st=pt(head,dir+(k-1)*.28,scale*.53);z+=M.path(`M${S(head.x,head.y)}L${S(st.x,st.y)}`,pal.ochre,.35);z+=M.circle(st.x,st.y,.42,pal.vermillion);}
       }return z;
     }
     return season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'red',2):'';
   }
   if(name==='bramble')return season==='spring'?blossom(tip,scale*1.55,pal,r,name):season==='summer'||season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'blackberry',1):'';
   if(name==='fern')return season==='spring'?M.path(`M${S(at.x,at.y)}q${S(scale,-scale)} ${S(scale*.4,-scale*1.1)}`,sp.tint,1.2):'';
   if(name==='acanthus')return season==='summer'?blossom(tip,scale*.91,pal,r,name):'';
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
   // The life-cycle stages share a single attachment. During playback they
   // change by geometry/scale (not crossfading); the permanent image only
   // displays the appropriate final season's organ.
   const finalStage = (season==='spring'||season==='summer') &&
     ['dogrose','honeysuckle','acanthus'].includes(sp.leaf) ||
     season==='spring' && ['holly','hawthorn','bramble'].includes(sp.leaf)
       ? 'flower' :
     ['fern','hazel'].includes(sp.leaf) && (season==='winter'||season==='spring')
       ? 'catkin' : 'fruit';
   return `<g class="growth-organ" data-life="${M.escape(sp.leaf)}" data-final-stage="${finalStage}" data-life-origin="${V(tip.x,tip.y)}">${base}`+
     `<g class="life-bud">${bud}</g>`+
     `<g class="life-bloom">${bloom}</g>`+
     `<g class="life-final">${final}</g></g>`;
 };
})(window.MS);