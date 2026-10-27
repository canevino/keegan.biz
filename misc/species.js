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
   holly:{name:'holly',habit:'upright',leaf:'holly',bark:'#67503c',tint:'#52744d',scale:1.02,leafScale:1.25,frequency:1.14,shootDensity:1.24,shootScale:.82,tertiary:.73,angle:.80,twigs:1.1,evergreen:true,fruit:'holly'},
   hazel:{name:'hazel',habit:'arching',leaf:'hazel',bark:'#80634b',tint:'#7b885d',scale:1.12,leafScale:1.09,frequency:1.0,shootDensity:.92,shootScale:1.04,tertiary:.70,angle:1.16,twigs:1.22,evergreen:false,fruit:'hazel'},
   ivy:{name:'ivy',habit:'climbing',leaf:'ivy',bark:'#69563d',tint:'#426f5d',scale:1.03,leafScale:1.05,frequency:1.16,shootDensity:1.15,shootScale:1.15,tertiary:.63,angle:1.0,twigs:.85,evergreen:true,fruit:'ivy'},
   hawthorn:{name:'hawthorn',habit:'angular',leaf:'hawthorn',bark:'#6d5242',tint:'#63815c',scale:.97,leafScale:1.13,frequency:1.20,shootDensity:1.35,shootScale:.88,tertiary:.80,angle:1.05,twigs:1.14,evergreen:false,fruit:'hawthorn'},
   oak:{name:'oak',habit:'heavy',leaf:'oak',bark:'#68513c',tint:'#687c4d',scale:1.22,leafScale:1.30,frequency:.88,shootDensity:.95,shootScale:1.04,tertiary:.52,angle:.92,twigs:.82,evergreen:false,fruit:'oak'},
   dogrose:{name:'dog rose',habit:'arching',leaf:'dogrose',bark:'#765743',tint:'#63845d',scale:1.12,leafScale:1.20,frequency:1.04,shootDensity:1.0,shootScale:1.10,tertiary:.8,angle:1.2,twigs:1.16,evergreen:false,fruit:'dogrose'},
   honeysuckle:{name:'honeysuckle',habit:'twining',leaf:'honeysuckle',bark:'#695445',tint:'#648c70',scale:1.05,leafScale:1.1,frequency:1.08,shootDensity:1.16,shootScale:.9,tertiary:.76,angle:1.12,twigs:1.06,evergreen:false,fruit:'honeysuckle'},
   bramble:{name:'bramble',habit:'arching',leaf:'bramble',bark:'#725640',tint:'#52795a',scale:1.11,leafScale:1.1,frequency:1.05,shootDensity:1.2,shootScale:1.11,tertiary:.94,angle:1.20,twigs:1.25,evergreen:false,fruit:'bramble'},
   fern:{name:'fern',habit:'fronds',leaf:'fern',bark:'#65513d',tint:'#668263',scale:1.25,leafScale:1.0,frequency:1.0,shootDensity:1.0,shootScale:1.0,tertiary:0,angle:.94,twigs:0,evergreen:false,fruit:'fern'},
   acanthus:{name:'acanthus',habit:'ornamental',leaf:'acanthus',bark:'#765b45',tint:'#73815e',scale:1.24,leafScale:1.25,frequency:.90,shootDensity:.78,shootScale:1.14,tertiary:.5,angle:1.06,twigs:.93,evergreen:true,fruit:'acanthus'}
 };
 M.speciesNames=Object.keys(M.speciesProfiles);
 M.chooseSpecies=(selected,r)=>M.speciesProfiles[selected]||M.speciesProfiles[r.choose(M.speciesNames)];
 M.wood=(sp,pal,age,r)=>{const a=mix(sp.bark,pal.ink,r.between(.06,.20)); return age==='new'?mix(a,sp.tint,.35):a;};
 M.leafPigment=(sp,season,pal,r,s={})=>{
   const ornament=M.clamp(Number(s.ornament||0)/100,0,1);
   // Each blade is a distinct painted impression: green remains dominant,
   // but species lean cool/warm and pick up slightly different mineral stains.
   const variation=r.random();
   const familyBias={holly:'cool',ivy:'cool',honeysuckle:'light',hazel:'warm',oak:'earth',hawthorn:'light',dogrose:'warm',bramble:'cool',fern:'light',acanthus:'earth'}[sp.leaf]||'earth';
   let col=mix(sp.tint,pal.green,.10+r.between(0,.18));
   if(familyBias==='cool')col=mix(col,pal.lapis,r.between(.05,.16));
   if(familyBias==='warm')col=mix(col,pal.ochre,r.between(.05,.16));
   if(familyBias==='light')col=mix(col,pal.light,r.between(.06,.15));
   if(familyBias==='earth')col=mix(col,pal.ink,r.between(.03,.10));
   if(variation<.16)col=mix(col,pal.ochre,r.between(.10,.24));
   else if(variation>.82)col=mix(col,pal.lapis,r.between(.08,.18));
   else if(variation>.56)col=mix(col,pal.light,r.between(.06,.16));
   if(season==='spring'){
     col=mix(col,pal.light,r.between(.16,.30));
     if(!sp.evergreen)col=mix(col,pal.ochre,r.between(.02,.10));
   }
   if(season==='summer'){
     col=mix(col,pal.ink,r.between(.01,.05));
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
     col=sp.evergreen ? mix(col,pal.ink,.13) : mix(col,pal.ochre,.56);
   }
   if(ornament>.35 && r.chance(Math.pow((ornament-.35)/.65,1.5)*(sp.leaf==='acanthus'?.24:.14))){
     col=M.mix(col,r.choose([pal.lapis,pal.vermillion,pal.ochre]),r.between(.22,.42));
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
 // A blade is constructed from its species' own anatomical landmarks.
 // Slow variation follows an entire contour; only saw-toothed species get
 // high-frequency changes. Avoid the interchangeable oval / angular stamp.
 const bell=(t,p=.76)=>Math.pow(Math.max(0,Math.sin(Math.PI*t)),p);
 const bump=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));
 const L=(x,y)=>({x,y});
 function blade(kind,len,r,s){
   const ornament=M.ornamentInfluence?.({leaf:kind},s)||0;
   const phase=r.between(0,Math.PI*2),hand=r.between(-.10,.10);
   const asym=r.between(-.12,.12),round=r.between(.88,1.13);
   const scratch=r.between(.015,.042),serratePhase=r.between(-.45,.45);
   const teeth=(t,f)=>Math.pow(Math.abs(Math.sin(Math.PI*(t*f+serratePhase))),5);
   const lobes=(t,centres,w)=>centres.reduce((acc,c)=>acc+bump(t,c,w),0);
   const shape=(t,side)=>{
     let width=0,x=t;
     switch(kind){
       case 'ivy': // Palmate lobes have a narrow waist and a long lanceolate tip.
         width=.30*bell(t,.49)+.61*bump(t,.31,.105)+.22*bump(t,.61,.12)-.15*bump(t,.48,.055);
         x=t*.97+.025*bump(t,.33,.1);break;
       case 'holly': // Broad leathery blade with offset spine points.
         width=.24*bell(t,.55)+.16*bump(t,.42,.32)+
           .20*lobes(t,[.17,.38,.61,.81].map(c=>c+side*.022),.022);
         width-=.075*lobes(t,[.26,.50,.72],.035);break;
       case 'hazel': // Cordate base, serrated circumference, blunt tip.
         width=.45*bell(t,.49)*(1.30-.53*t)+.13*bump(t,.13,.085);
         width-=.17*bump(t,.045,.03);
         width+=.036*bell(t,.53)*teeth(t,12);break;
       case 'oak': // Broad rounded lobes, recessed sinuses and a narrow stalk.
         width=.20*bell(t,.56)+.39*lobes(t,[.21,.44,.69,.86].map(c=>c+side*.022),.073);
         width-=.038*lobes(t,[.33,.57,.78],.028);break;
       case 'hawthorn': // Three deep, tapering cuts; small teeth at lobe tips.
         width=.17*bell(t,.62)+.32*lobes(t,[.20,.46,.72].map(c=>c+side*.018),.075);
         width+=.020*bell(t,.72)*teeth(t,12);break;
       case 'acanthus': // Deep incisions between leaf divisions, not an oak clone.
         width=.15*bell(t,.45)+.40*lobes(t,[.16,.32,.51,.70,.86].map(c=>c+side*.016),.063);
         width-=.09*lobes(t,[.24,.42,.61,.80],.030);break;
       case 'dogrose': // Slender pointed rose leaflet with fine serration.
         width=.30*bell(t,.83)*(1.03+.21*t)+.020*bell(t,.7)*teeth(t,15);break;
       case 'bramble': // Plumper toothed leaflet with uneven opposing margins.
         width=.36*bell(t,.67)*(1.12-.23*t)+.041*bell(t,.64)*teeth(t,11);break;
       case 'honeysuckle': // Smooth ovate blade; tip drawn out and slightly bent.
         width=.34*bell(t,.84)*(1.15-.18*t);x=t+.016*Math.sin(Math.PI*t);break;
       case 'fern': width=.14*bell(t,.92);break;
       default: width=.31*bell(t,.70);
     }
     width=Math.max(0,width)*round;
     // Distort whole lobes, not every contour vertex.
     width*=1+side*asym*(.55+.35*t)+scratch*(Math.sin(8*t+phase+side*.65)+.31*Math.sin(21*t+phase*1.7));
     if(ornament>.16 && M.ornamentWidth)width=M.ornamentWidth(kind,t,width,ornament,phase);
     return {x:x*len,y:side*Math.max(0,width)*len + len*(hand*.11*Math.sin(Math.PI*t))};
   };
   const count=kind==='holly'?90:kind==='acanthus'?92:kind==='hazel'||kind==='bramble'?92:74;
   const upper=[],lower=[];
   for(let i=0;i<=count;i++){
     const t=i/count;
     upper.push(shape(t,-1));lower.push(shape(t,1));
   }
   // Smooth curves for oval/lobed leaves; teeth and holly spines stay crisp.
   return smoothClose([...upper,...lower.slice(1,-1).reverse()],
     kind==='holly'||kind==='hazel'||kind==='dogrose'||kind==='bramble');
 }
 function leafVeins(kind,size,color,pal,r,s={}){
   const ink=M.mix(color,pal.ink,.57),ochre=M.mix(color,pal.ochre,.38);
   const deep=M.mix(color,pal.ink,.70),lit=M.mix(color,pal.light,.33);
   const ornamental=M.ornamentInfluence?.({leaf:kind},s)||0;
   // Direction and branching respond to each family's morphology.
   const anatomy={
     ivy:{nodes:[.22,.37,.57],reach:.28,tip:.93,dx:.11},
     holly:{nodes:[.18,.39,.61,.80],reach:.21,tip:.96,dx:.08},
     hazel:{nodes:[.16,.29,.42,.55,.69,.81],reach:.32,tip:.91,dx:.12},
     oak:{nodes:[.19,.43,.67,.84],reach:.34,tip:.94,dx:.09},
     hawthorn:{nodes:[.19,.44,.69],reach:.28,tip:.95,dx:.09},
     acanthus:{nodes:[.15,.31,.50,.70,.85],reach:.35,tip:.94,dx:.05},
     dogrose:{nodes:[.17,.31,.45,.59,.72,.83],reach:.21,tip:.96,dx:.13},
     bramble:{nodes:[.16,.29,.43,.56,.69,.81],reach:.28,tip:.93,dx:.10},
     honeysuckle:{nodes:[.23,.38,.53,.69,.82],reach:.24,tip:.94,dx:.12},
     fern:{nodes:[.25,.45,.65,.80],reach:.11,tip:.94,dx:.10}
   }[kind]||{nodes:[.23,.4,.62,.78],reach:.23,tip:.95,dx:.11};
   let out='';
   // Engraved center vein is weighted at the base, with a fine dry echo.
   out+=M.path(`M${S(size*.055,0)}C${S(size*.27,size*.012)} ${S(size*.60,-size*.013)} ${S(size*anatomy.tip,0)}`,
      deep,Math.max(.33,size*.026),`opacity="${M.n(.55+.10*ornamental)}"`);
   out+=M.path(`M${S(size*.075,-size*.010)}Q${S(size*.35,-size*.013)} ${S(size*.76,0)}`,
      ochre,Math.max(.20,size*.009),`opacity=".55"`);
   anatomy.nodes.forEach((t,i)=>{
     for(const side of [-1,1]){
       const stagger=side===1?(i%2===0?.024:-.018):0;
       const x=size*(t+stagger),swell=Math.sin(Math.PI*t)**.65;
       const reach=size*anatomy.reach*swell*r.between(.78,1.02);
       const tipX=x+size*(anatomy.dx+r.between(-.014,.014));
       const tipY=side*reach;
       const d=`M${S(x,0)}Q${S(x+size*.034,side*reach*.36)} ${S(tipX,tipY)}`;
       out+=M.path(d,i%4===1?ochre:ink,Math.max(.22,size*.013),
         `opacity="${M.n(r.between(.36,.62))}"`);
       if(size>19 && i%2===0){
         const jx=x+(tipX-x)*.55,jy=tipY*.55;
         out+=M.path(`M${S(jx,jy)}q${S(size*.030,side*size*.016)} ${S(size*.053,side*size*.04)}`,
           deep,Math.max(.14,size*.005),`opacity="${M.n(r.between(.20,.34))}"`);
       }
     }
   });
   // Fine hatch, resembling thin coloured penwork on historic herbals.
   if(size>20){
     const count=Math.round(size*.38);
     for(let i=0;i<count;i++){
       const t=r.between(.18,.86),side=r.sign();
       const y=side*size*r.between(.035,.12)*Math.sin(Math.PI*t);
       out+=M.path(`M${S(size*t,y)}l${S(size*.024,-side*size*.013)}`,
         i%3===0?lit:deep,.20,`opacity="${M.n(r.between(.11,.29))}"`);
     }
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
   const rose=sp.leaf==='dogrose',pairs=rose?(r.chance(.58)?3:2):(r.chance(.65)?2:1);
   const shaft=M.mix(sp.bark,sp.tint,.28),last=.70;
   let z=M.path(`M0 0 Q${S(size*.35,-size*.025)} ${S(size*.98,0)}`,shaft,Math.max(.48,size*.022));
   for(let i=0;i<pairs;i++){
     const t=.19+i*(pairs===3?.22:.31),x=size*t;
     for(const side of [-1,1]){
       const len=size*(rose?.47:.48)*r.between(.85,1.16)*(1-.035*i);
       const a=side*(rose?1.02:.99)+r.between(-.09,.09);
       z+=`<g transform="translate(${S(x,0)}) rotate(${M.n(a*180/Math.PI)})">`+
         simpleLeaf(sp,len,season,pal,r,sp.leaf,s)+'</g>';
     }
   }
   z+=`<g transform="translate(${S(size*last,0)})">`+
     simpleLeaf(sp,size*(rose?.44:.43),season,pal,r,sp.leaf,s)+'</g>';
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
     // Historical botanical-plate shading: curved veins, a narrow fold in
     // every other petal, and dilute pigment near the throat.
     const fold=pt(center,a+((i%2)?-.12:.11),extent*.48);
     const rim=pt(center,a,extent*.57);
     z+=M.path(`M${S(center.x,center.y)}Q${S(shadow.x,shadow.y)} ${S(fold.x,fold.y)}`,
       M.mix(blossomColor,pal.ink,.43),Math.max(.28,scale*.023),'opacity=".48"');
     if(i%2===0){
       z+=M.path(`M${S(fold.x,fold.y)}Q${S(rim.x,rim.y)} ${S(edge.x,edge.y)}`,
         M.mix(blossomColor,pal.light,.34),Math.max(.22,scale*.018),'opacity=".61"');
     }
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
         const corolla=i%3===0 ? M.mix(pal.vermillion,pal.light,.34)
           : i%3===1 ? M.mix(pal.ochre,pal.light,.26) : M.mix(pal.vermillion,pal.ochre,.30);
         z+=M.path(tube,corolla,Math.max(1.2,scale*.22));
         const lip1=pt(head,dir-.66,scale*.49),lip2=pt(head,dir+.61,scale*.47);
         const sideA=pt(head,dir-.85,scale*.17),sideB=pt(head,dir+.84,scale*.17);
         z+=M.shape(`M${S(head.x,head.y)}Q${S(sideA.x,sideA.y)} ${S(lip1.x,lip1.y)}Q${S(head.x+Math.cos(dir)*scale*.38,head.y+Math.sin(dir)*scale*.38)} ${S(head.x,head.y)}Z`,corolla,`stroke="${M.mix(pal.ink,corolla,.40)}" stroke-width=".35"`);
         z+=M.shape(`M${S(head.x,head.y)}Q${S(sideB.x,sideB.y)} ${S(lip2.x,lip2.y)}Q${S(head.x+Math.cos(dir)*scale*.34,head.y+Math.sin(dir)*scale*.34)} ${S(head.x,head.y)}Z`,M.mix(corolla,pal.light,.25),`stroke="${M.mix(pal.ink,corolla,.47)}" stroke-width=".34"`);
         for(let k=0;k<3;k++){const st=pt(head,dir+(k-1)*.24,scale*.69);z+=M.path(`M${S(head.x,head.y)}L${S(st.x,st.y)}`,pal.ochre,.42);z+=M.circle(st.x,st.y,.54,pal.vermillion);}
       }return z;
     }
     return season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'red',2):'';
   }
   if(name==='bramble')return season==='spring'?blossom(tip,scale*1.55,pal,r,name):season==='summer'||season==='autumn'?fruitCluster(sp,tip,angle,scale,pal,r,'blackberry',1):'';
   if(name==='fern')return season==='spring'?M.path(`M${S(at.x,at.y)}q${S(scale,-scale)} ${S(scale*.4,-scale*1.1)}`,sp.tint,1.2):'';
   if(name==='acanthus'){
     if(season==='winter')return '';
     // Acanthus makes a bracted flower spike, not a rose-like open blossom.
     // Two ranks of small hooded flowers attach to one shared rachis.
     let z='',axis=angle-.05;
     const spikeTip=pt(tip,axis,scale*1.48);
     z+=M.path(`M${S(tip.x,tip.y)}Q${S(pt(tip,axis+.10,scale*.65).x,pt(tip,axis+.10,scale*.65).y)} ${S(spikeTip.x,spikeTip.y)}`,
       M.mix(sp.tint,pal.ink,.28),Math.max(.75,scale*.078));
     for(let i=0;i<5;i++){
       const t=.16+i*.165,origin=pt(tip,axis,scale*1.48*t),side=i%2?1:-1;
       const a=axis+side*1.09,end=pt(origin,a,scale*(.36+.13*(1-t)));
       const p1=pt(origin,a-side*.47,scale*.20),p2=pt(origin,a+side*.43,scale*.19);
       const d=`M${S(origin.x,origin.y)}Q${S(p1.x,p1.y)} ${S(end.x,end.y)}`+
         `Q${S(p2.x,p2.y)} ${S(origin.x,origin.y)}Z`;
       z+=M.shape(d,i%3===0?M.mix(sp.tint,pal.ochre,.23):sp.tint,
         `stroke="${pal.ink}" stroke-width=".44"`);
       if(season==='summer'){
         const flower=pt(origin,a,scale*.31);
         z+=M.shape(`M${S(flower.x,flower.y)}l${S(side*scale*.17,-scale*.10)} `+
            `l${S(side*scale*.12,scale*.16)}Z`,
           i%3===0?pal.lapis:M.mix(pal.light,pal.vermillion,.30),
           `stroke="${pal.ink}" stroke-width=".32"`);
       }
     }
     return z;
   }
   return '';
 }
 // Layered life-cycle states. Only the selected-season final is exported or
 // shown when still; preview animation reveals a stalk-attached bud, then a
 // blossom, and finally the season's organ (berries, hips, nut, catkin, etc.).
 M.plantOrgan=(sp,at,angle,season,pal,r,scale=8,s={ornament:0})=>{
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
   const calyx=M.manuscriptCalyx ? M.manuscriptCalyx(sp,tip,angle,scale,pal,snapshot(77),s,season) : '';
   return `<g class="growth-organ" data-life="${M.escape(sp.leaf)}" data-final-stage="${finalStage}" data-life-origin="${V(tip.x,tip.y)}">${base}`+
     `<g class="life-bud">${bud}</g>`+
     `<g class="life-bloom">${bloom}</g>`+
     `<g class="life-final">${final}${calyx}</g></g>`;
 };
})(window.MS);