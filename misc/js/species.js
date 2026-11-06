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
   const future=s?.palette==='future';
   // Each blade is a distinct painted impression: green remains dominant,
   // but species lean cool/warm and pick up slightly different mineral stains.
   const variation=r.random();
   const familyBias={holly:'cool',ivy:'cool',honeysuckle:'light',hazel:'warm',oak:'earth',hawthorn:'light',dogrose:'warm',bramble:'cool',fern:'light',acanthus:'earth'}[sp.leaf]||'earth';
   let col=mix(sp.tint,pal.green,future?.24+r.between(.04,.28):.10+r.between(0,.18));
   if(familyBias==='cool')col=mix(col,pal.lapis,r.between(future?.11:.05,future?.24:.16));
   if(familyBias==='warm')col=mix(col,pal.ochre,r.between(future?.08:.05,future?.22:.16));
   if(familyBias==='light')col=mix(col,pal.light,r.between(.06,future?.18:.15));
   if(familyBias==='earth')col=mix(col,pal.ink,r.between(.03,future?.14:.10));
   if(variation<.14)col=mix(col,pal.ochre,r.between(future?.13:.08,future?.28:.19));
   else if(variation>.85)col=mix(col,pal.lapis,r.between(future?.16:.11,future?.31:.23));
   else if(variation>.56)col=mix(col,pal.light,r.between(.06,future?.21:.16));
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
   if((future||ornament>.55) && r.chance((future?.09:0)+Math.pow((ornament-.55)/.45,1.5)*(sp.leaf==='acanthus'?.26:.12))){
     col=M.mix(col,r.choose([pal.lapis,pal.vermillion,pal.ochre]),r.between(future?.16:.10,future?.32:.24));
   }
   if(future && r.chance(.26+.24*ornament)) col=M.mix(col,pal.ink,r.between(.06,.18));
   return col;
 };
 // Anatomical leaf atlas. Every closed contour has one continuous edge.
 // Earlier Gaussian "teeth" produced needle-like artificial lobes, and the
 // Catmull spline overshot sharp sinuses to form the white loops seen in SVG.
 // These profiles keep the primary axis monotone and deliberately control
 // every lobe, sinus and tooth rather than perturbing arbitrary vertices.
 const S=(x,y)=>M.vec(x,y);
 const bell=(t,p=.75)=>Math.pow(Math.max(0,Math.sin(Math.PI*t)),p);
 const bump=(t,c,w)=>Math.exp(-Math.pow((t-c)/w,2));
 const teeth=(t,count,phase)=>Math.pow(Math.max(0,Math.sin(Math.PI*(t*count+phase))),7);
 const pathPoints=pts=>pts.map((p,i)=>`${i?'L':'M'}${S(p.x,p.y)}`).join('')+'Z';
 function blade(kind,len,r,s){
   const orn=M.ornamentInfluence?.({leaf:kind},s)||0;
   const asym=r.between(-.07,.07),phase=r.between(0,Math.PI*2);
   const proportion=r.between(.96,1.05),lean=r.between(-.018,.018);

   // Ivy is a palmate, three-to-five-lobed leaf, not an angular serrated oval.
   // Explicit curved connections prevent intersections and flying spear points.
   if(kind==='ivy'){
     // Illuminated ivy: three pointed principal lobes and two minor basal horns.
     // Curved shoulders resolve into deliberate Gothic cusps; no repeated star polygons.
     const point=(x,y)=>S(x*len,(y*proportion*(y<0?1+asym:1-asym)+lean*Math.sin(Math.PI*x))*len);
     const P=point;
     return `M${P(0,0)}`+
       `C${P(.06,-.045)} ${P(.105,-.145)} ${P(.115,-.237)}`+
       `C${P(.15,-.245)} ${P(.197,-.216)} ${P(.247,-.179)}`+
       `C${P(.29,-.246)} ${P(.37,-.341)} ${P(.45,-.462)}`+
       `C${P(.515,-.423)} ${P(.535,-.335)} ${P(.548,-.238)}`+
       `C${P(.65,-.252)} ${P(.785,-.161)} ${P(1,0)}`+
       `C${P(.785,.161)} ${P(.65,.252)} ${P(.548,.238)}`+
       `C${P(.535,.335)} ${P(.515,.423)} ${P(.45,.462)}`+
       `C${P(.37,.341)} ${P(.29,.246)} ${P(.247,.179)}`+
       `C${P(.197,.216)} ${P(.15,.245)} ${P(.115,.237)}`+
       `C${P(.105,.145)} ${P(.06,.045)} ${P(0,0)}Z`;
   }

   const sample=(t,side)=>{
     const e=bell(t,.77),uneven=1+side*asym;
     let w=0;
     switch(kind){
       case 'holly':{
         // Leathery elliptical leaf with three to four small true spines.
         const nodes=side<0?[.28,.51,.74]:[.25,.49,.73];
         w=.285*bell(t,.71)+(.075+.060*orn)*nodes.reduce((z,c)=>z+bump(t,c,.018),0);
         w-=.040*[.37,.62].reduce((z,c)=>z+bump(t,c,.047),0);
         break;
       }
       case 'hazel':{
         // Round heart-like base, shallow regular serrations.
         w=.40*bell(t,.51)*(1.19-.26*t)+.074*bump(t,.10,.085);
         w+=.012*bell(t,.58)*teeth(t,13,phase*.05);
         break;
       }
       case 'oak':{
         // Rounded oak lobes, recessed but not spiky sinuses.
         w=.135*e+(.17+.075*orn)*[.23,.46,.67,.83].reduce((z,c,i)=>
           z+[.82,1.05,.98,.70][i]*bump(t,c+side*asym*.16,.086),0);
         w-=.055*[.35,.57,.76].reduce((z,c)=>z+bump(t,c,.055),0);
         break;
       }
       case 'hawthorn':{
         w=.15*e+(.16+.065*orn)*[.27,.52,.75].reduce((z,c,i)=>
           z+[1,.88,.72][i]*bump(t,c+side*asym*.2,.085),0);
         w+=.006*e*teeth(t,10,.15);break;
       }
       case 'acanthus':{
         // Acanthus lobes are soft scallops, not a serrated five-point star.
         w=.12*e+(.195+.075*orn)*[.20,.42,.63,.79].reduce((z,c,i)=>
           z+[.67,1.09,.91,.75][i]*bump(t,c+side*asym*.16,.083),0);
         w-=.061*[.31,.52,.72].reduce((z,c)=>z+bump(t,c,.051),0);
         break;
       }
       case 'dogrose':w=.285*bell(t,.77)*(1.08-.12*t)+.009*e*teeth(t,15,.23);break;
       case 'bramble':w=.33*bell(t,.69)*(1.14-.17*t)+.015*e*teeth(t,12,.18);break;
       case 'honeysuckle':w=.325*bell(t,.84)*(1.13-.12*t);break;
       case 'fern':w=.12*bell(t,.90);break;
       default:w=.31*e;
     }
     // Ornament changes the paintwork more than the silhouette. It can
     // gently swell the lobe masses but never create new serrations.
     w*=1+.016*orn*Math.sin(Math.PI*t*3+phase);
     w=Math.max(0,w*proportion*uneven);
     const tremor=(.002+.001*orn)*e*Math.sin(t*14+phase+side*.37);
     return {x:len*t,y:len*(side*(w+tremor)+lean*Math.sin(Math.PI*t))};
   };
   const N=kind==='holly'?160:kind==='hazel'||kind==='bramble'?144:112;
   const upper=[],lower=[];
   for(let i=0;i<=N;i++){
     const t=i/N;
     upper.push(sample(t,-1));lower.push(sample(t,1));
   }
   // Dense, monotone polylines avoid Bézier overshoot at the sinus. The
   // rendered contour is smooth at normal scale; holly retains visible spines.
   return pathPoints([...upper,...lower.slice(1,-1).reverse()]);
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
   // Ivy's veins radiate from the petiole into the two lateral lobes rather
   // than borrowing the generic pinnate/fishbone vein diagram.
   if(kind==='ivy'){
     let z=M.path(`M${S(size*.055,0)}Q${S(size*.50,-size*.005)} ${S(size*.91,0)}`,
       deep,Math.max(.35,size*.024),'opacity=".60"');
     for(const sg of [-1,1]){
       z+=M.path(`M${S(size*.075,0)}Q${S(size*.25,sg*size*.17)} ${S(size*.485,sg*size*.445)}`,
         ink,Math.max(.28,size*.016),'opacity=".52"');
       z+=M.path(`M${S(size*.085,0)}Q${S(size*.135,sg*size*.15)} ${S(size*.17,sg*size*.245)}`,
         ink,Math.max(.23,size*.011),'opacity=".39"');
       z+=M.path(`M${S(size*.28,sg*size*.22)}Q${S(size*.38,sg*size*.25)} ${S(size*.49,sg*size*.32)}`,
         ochre,Math.max(.20,size*.009),'opacity=".42"');
     }
     return z;
   }
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
   // Future-medieval inlay. Small heraldic geometry belongs to the leaf itself:
   // crisp pointed arches, lozenge seals and stained-ink hatching. These appear
   // selectively, rather than turning every leaf into a repeated digital icon.
   const level=M.clamp(Number(s.ornament||0)/100,0,1);
   let medievalInlay='';
   const future=s.palette==='future';
   if(size>15 && level>.20 && r.chance((future?.36:.13) + .42*level)){
     const sign=r.sign();
     const x=size*r.between(.35,.48),h=size*(kind==='ivy'?.082:.048);
     const height=size*(kind==='ivy'?.082:.071);
     const motif=r.int(0,2);
     const cobalt=M.mix(pal.lapis,pal.ink,.16),cinnabar=M.mix(pal.vermillion,pal.ink,.10);
     const accent=r.chance(.34)?pal.ochre:(r.chance(.5)?cinnabar:cobalt);
     if(motif===0){
       // A tiny pointed window inset, never a sharp protrusion outside the edge.
       medievalInlay+=M.shape(`M${S(x-size*.07,sign*h)}Q${S(x-size*.035,sign*(h+height*.55))} ${S(x,sign*(h+height))}`+
         `Q${S(x+size*.035,sign*(h+height*.55))} ${S(x+size*.07,sign*h)}Z`,
         accent,`opacity="${n(.65+.22*level)}"`);
       medievalInlay+=M.path(`M${S(x,sign*h)}L${S(x,sign*(h+height*.73))}`,pal.ink,.24,'opacity=".5"');
     }else if(motif===1){
       const dx=size*.055,dy=size*.068;
       medievalInlay+=M.shape(`M${S(x-dx,sign*h)}L${S(x,sign*(h+dy))}L${S(x+dx,sign*h)}L${S(x,sign*(h-dy))}Z`,
         'none',`stroke="${accent}" stroke-width="${n(Math.max(.44,size*.017))}" opacity=".78"`);
       medievalInlay+=M.circle(x,sign*h,Math.max(.34,size*.017),accent);
     }else{
       for(let j=0;j<3;j++){
         const xx=x-size*.075+j*size*.056;
         medievalInlay+=M.path(`M${S(xx,sign*(h-size*.025))}l${S(size*.033,sign*size*.05)}`,
           accent,Math.max(.3,size*.012),`opacity="${n(.54+.23*level)}"`);
       }
     }
   }
   if(future && size>16 && level>.38 && r.chance(.52)){
     const xx=size*r.between(.28,.68), yy=(r.sign())*size*r.between(.03,.11);
     const crest=r.int(0,2);
     if(crest===0){
       medievalInlay+=M.shape(`M${S(xx-size*.042,yy)}L${S(xx,yy-size*.055)}L${S(xx+size*.042,yy)}L${S(xx,yy+size*.055)}Z`, accent, `opacity="${n(.58+.22*level)}"`);
       medievalInlay+=M.path(`M${S(xx-size*.018,yy)}L${S(xx+size*.018,yy)}M${S(xx,yy-size*.018)}L${S(xx,yy+size*.018)}`, pal.ink, Math.max(.22,size*.01), `opacity="${n(.46+.18*level)}"`);
     }else if(crest===1){
       for(let step=0;step<4;step++){
         const sx=xx-size*.05+step*size*.022;
         medievalInlay+=M.shape(`M${S(sx,yy-size*.012)}L${S(sx+size*.016,yy-size*.012)}L${S(sx+size*.016,yy+size*.012)}L${S(sx,yy+size*.012)}Z`, step%2?cobalt:cinnabar, `opacity="${n(.42+.18*level)}"`);
       }
     }else{
       medievalInlay+=M.path(`M${S(xx-size*.055,yy+size*.022)}Q${S(xx,yy-size*.048)} ${S(xx+size*.055,yy+size*.022)}`, accent, Math.max(.28,size*.012), `opacity="${n(.52+.18*level)}"`);
       medievalInlay+=M.path(`M${S(xx-size*.028,yy+size*.006)}L${S(xx+size*.028,yy+size*.006)}`, pal.ink, Math.max(.18,size*.009), `opacity="${n(.40+.15*level)}"`);
     }
   }
   let plateMarks='';
   if(size>15){
     // The botanical-plate effect is deliberate pen hatchwork, not random
     // circular pixel noise. Each narrow stroke follows the leaf's midrib.
     const dark=M.mix(color,pal.ink,.58);
     const warm=M.mix(color,pal.ochre,.52);
     const light=M.mix(color,pal.light,.68);
     const lines=Math.max(5,Math.round(size*.31));
     const bias=r.sign();
     for(let i=0;i<lines;i++){
       const t=.15+(i+.3)/lines*.70+r.between(-.012,.012);
       const side=i%3===0?-bias:bias;
       const y=side*size*(.045+.070*Math.sin(Math.PI*t));
       const len=size*r.between(.032,.082);
       plateMarks+=M.path(`M${S(t*size,y)}q${S(len*.55,side*len*.32)} ${S(len,side*len*.22)}`,
         i%4===0?warm:dark,Math.max(.18,size*.007),`opacity="${n(r.between(.17,.39))}"`);
     }
     // A small softly printed folded plane. Its edge follows a curved vein,
     // so it reads as one leaf buckling rather than a geometric overlay.
     if(size>23 && r.chance(.53)){
       const side=r.sign();
       const d2=`M${S(size*.20,0)}Q${S(size*.42,side*size*.115)} ${S(size*.72,side*size*.105)}`+
         `Q${S(size*.48,side*size*.045)} ${S(size*.20,0)}Z`;
       plateMarks+=M.shape(d2,side>0?dark:light,`opacity="${n(r.between(.10,.20))}"`);
       plateMarks+=M.path(`M${S(size*.21,0)}Q${S(size*.45,side*size*.10)} ${S(size*.71,side*size*.103)}`,
         side>0?dark:light,Math.max(.23,size*.012),`opacity=".35"`);
     }
   }
   art+=`<g clip-path="url(#${clipId})">${veins}${plateMarks}${patch}${ornament}${medievalInlay}</g>`;
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
   const delay=-r.between(0,18),duration=r.between(14,24),flutter=r.between(.16,.42);
   // Only a minority of blades make their own tiny gesture; all other leaves already
   // participate in the parent shoot's motion. Keep painted SVG performant and natural.
   const flexes=r.chance(.22);
   return `<g data-species="${sp.name}" transform="translate(${V(at.x,at.y)}) rotate(${n(angle*180/Math.PI)})">`+
     `<g ${flexes?`class="leaf-breath" style="--leaf-delay:${n(delay)}s;--leaf-duration:${n(duration)}s;--leaf-amplitude:${n(flutter)}deg"`:''}>`+
     `${stem}<g transform="translate(${V(petiole,0)}) scale(${n(magnify)})">${leaf}</g></g></g>`;
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