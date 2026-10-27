/* Pass D: manuscript inflection grown from real plant anatomy.
   Every accent is attached to a node, petiole, or stem. Neither detached
   filigree nor a decorative border is added to the botanical illustration. */
window.MS=window.MS||{};
((M)=>{
 'use strict';
 const V=M.vec,n=M.n,clamp=M.clamp;
 const P=(x,y)=>({x,y});
 const q=(at,a,d)=>P(at.x+Math.cos(a)*d,at.y+Math.sin(a)*d);
 const bias={acanthus:1.13,ivy:1.04,honeysuckle:1.05,fern:.71,holly:.91,
   oak:.77,hazel:.91,bramble:.96,hawthorn:.94,dogrose:1.01};
 M.ornamentLevel=s=>clamp(Number(s?.ornament||0)/100,0,1);
 M.ornamentInfluence=(sp,s)=>clamp(Math.pow(M.ornamentLevel(s),1.05)*(bias[sp?.leaf]||1),0,1);
 // Botanically recognisable outlines are maintained even at 100 ornament.
 M.ornamentWidth=(kind,t,w,amount,phase=0)=>{
   const e=Math.sin(Math.PI*t)**.88;
   const lobes=kind==='acanthus'?5:kind==='ivy'?3:kind==='oak'?4:2;
   return w*(1+.12*amount)*(1+.14*amount*e*Math.sin(2*Math.PI*lobes*t+phase));
 };
 M.ornamentPoint=(x,y,t,amount,len,phase)=>P(
   x+amount*len*.023*Math.sin(Math.PI*t)*Math.sin(t*5.2+phase),
   y+amount*len*.035*Math.sin(Math.PI*t)*Math.sin(t*4+phase*.4));

 // Fine engraved midrib, paired foliate penwork and occasional shell-gold
 // terminal points. All drawing is clipped to the leaf silhouette upstream.
 M.ornamentLeafInterior=(sp,len,col,pal,r,s)=>{
   const lev=M.ornamentInfluence(sp,s);
   if(lev<.13||len<13)return '';
   const contrast=M.mix(pal.ink,pal.ochre,.28+.35*lev);
   const gold=M.mix(pal.ochre,pal.light,.09);
   let z=M.path(`M${V(len*.11,0)}Q${V(len*.55,-len*.012)} ${V(len*.91,0)}`,
      contrast,Math.max(.28,len*.019),`opacity="${n(.15+.48*lev)}"`);
   const veins=lev>.35?(lev>.73?4:3):2;
   for(const side of [-1,1])for(let k=0;k<veins;k++){
     const t=.20+k*(.57/Math.max(veins-1,1)),x=len*t;
     const rise=side*len*(.085+.042*lev)*Math.sin(Math.PI*t);
     z+=M.path(`M${V(x,0)}Q${V(x+len*.043,rise*.45)} ${V(x+len*.105,rise)}`,
        k%2?gold:contrast,Math.max(.25,len*.008),`opacity="${n(.15+.40*lev)}"`);
   }
   if(lev>.58){
     const count=lev>.89?4:2;
     for(let k=0;k<count;k++){
       const t=.29+k*.47/Math.max(1,count-1),x=len*t;
       const side=k%2?-1:1,y=side*len*(.061+.017*(k%2))*Math.sin(Math.PI*t);
       const rad=Math.max(.31,len*.014);
       z+=M.circle(x,y,rad,gold,`stroke="${contrast}" stroke-width=".25" opacity="${n((lev-.49)*.7)}"`);
     }
   }
   return z;
 };
 // Chromatic under-painting follows a band of the leaf, not an isolated badge.
 M.ornamentColorPatch=(sp,len,pal,r,s)=>{
   const lev=M.ornamentInfluence(sp,s);
   if(lev<.44||len<15||!r.chance((lev-.40)*.52))return '';
   const col=r.choose([pal.ochre,pal.lapis,pal.vermillion]);
   const start=len*r.between(.28,.49),length=len*r.between(.16,.29);
   const side=r.sign(),h=side*len*r.between(.09,.14);
   const d=`M${V(start,0)}Q${V(start+length*.38,h*.64)} ${V(start+length,h)}`+
     `Q${V(start+length*.81,h*.26)} ${V(start+length*.18,0)}Z`;
   return M.shape(d,col,`opacity="${n((lev-.3)*.40)}"`);
 };
 const stemCol=(pal)=>M.mix(pal.ink,pal.green,.56);
 const path=(a,b,c)=>`M${V(a.x,a.y)}Q${V(b.x,b.y)} ${V(c.x,c.y)}`;
 function sepalBud(at,angle,size,pal,r){
   const tip=q(at,angle,size*1.03),base=q(at,angle,size*.30);
   const left=q(base,angle-.58,size*.46),right=q(base,angle+.57,size*.41);
   const leaf=`M${V(at.x,at.y)}Q${V(left.x,left.y)} ${V(tip.x,tip.y)}`+
     `Q${V(right.x,right.y)} ${V(at.x,at.y)}Z`;
   let z=M.path(path(at,q(at,angle+.09,size*.21),base),stemCol(pal),.65);
   z+=M.shape(leaf,M.mix(pal.green,pal.ochre,.18),`stroke="${pal.ink}" stroke-width=".42"`);
   z+=M.path(path(base,q(base,angle,size*.42),tip),pal.ochre,.40,'opacity=".65"');
   return z;
 }
 function manuscriptFlower(at,angle,size,pal,r,lev){
   const center=q(at,angle,size*.54),color=r.choose([pal.vermillion,pal.lapis,pal.ochre]);
   const other=M.mix(color,pal.light,.51),count=r.choose([5,5,6]);
   let z=M.path(path(at,q(at,angle+.10,size*.3),center),stemCol(pal),.72);
   for(let i=0;i<count;i++){
     const a=angle*.10+i*2*Math.PI/count+r.between(-.055,.055);
     const near=q(center,a,size*.14),outer=q(center,a,size*r.between(.32,.44));
     const l=q(near,a-.62,size*.16),rr=q(near,a+.62,size*.16);
     const d=`M${V(center.x,center.y)}Q${V(l.x,l.y)} ${V(outer.x,outer.y)}`+
         `Q${V(rr.x,rr.y)} ${V(center.x,center.y)}Z`;
     z+=M.shape(d,i%3===0?other:color,`stroke="${pal.ink}" stroke-width=".43"`);
     const mid=q(center,a,size*.31);
     z+=M.path(`M${V(center.x,center.y)}L${V(mid.x,mid.y)}`,pal.ochre,.32,'opacity=".68"');
   }
   z+=M.circle(center.x,center.y,Math.max(.9,size*.095),pal.ochre,`stroke="${pal.ink}" stroke-width=".4"`);
   return z;
 }
 // A rare foliate seed-case with two engraved seed chambers. At reading
 // size it suggests a manuscript grotesque without inserting a loose face.
 function foliateSeedCase(at,angle,size,pal,r){
   const center=q(at,angle,size*.65);
   const edge=q(center,angle,size*.54);
   let z=M.path(path(at,q(at,angle+.10,size*.37),center),stemCol(pal),.79);
   const tip=q(center,angle,size*.52),left=q(center,angle-1.6,size*.44),right=q(center,angle+1.6,size*.44);
   const d=`M${V(center.x,center.y)}Q${V(left.x,left.y)} ${V(tip.x,tip.y)}`+
     `Q${V(right.x,right.y)} ${V(center.x,center.y)}Z`;
   z+=M.shape(d,M.mix(pal.green,pal.lapis,.36),`stroke="${pal.ink}" stroke-width=".58"`);
   for(const side of [-1,1]){
     const dot=q(center,angle+side*.57,size*.22);
     z+=M.circle(dot.x,dot.y,Math.max(.49,size*.06),pal.ochre,
         `stroke="${pal.ink}" stroke-width=".25"`);
   }
   z+=M.path(path(q(center,angle+Math.PI/2,size*.15),q(center,angle,size*.32),q(center,angle-Math.PI/2,size*.15)),
        pal.ochre,.42,'opacity=".7"');
   return z;
 }
 function seedhead(at,angle,size,pal,r){
   const center=q(at,angle,size*.52);
   let z=M.path(path(at,q(at,angle+.09,size*.31),center),stemCol(pal),.70);
   // Three to five attached seed capsules, with short calyces and dry stipple.
   const count=r.int(3,5);
   for(let i=0;i<count;i++){
     const a=angle+(i-(count-1)/2)*.31,tip=q(center,a,size*.27);
     z+=M.path(`M${V(center.x,center.y)}L${V(tip.x,tip.y)}`,stemCol(pal),.43);
     z+=M.circle(tip.x,tip.y,size*.088,pal.ochre,`stroke="${pal.ink}" stroke-width=".40"`);
     z+=M.circle(tip.x-size*.023,tip.y-size*.016,size*.024,pal.ink,'opacity=".5"');
   }
   return z;
 }
 // A fixed budget of rare ornaments per entire specimen. No uncontrolled
 // repeated curls, floating symbol fields or bloom clusters in winter.
 function permit(plan,at,size){
   if(!plan)return true;
   plan.manuscriptMarks=plan.manuscriptMarks||[];
   const maximum=plan.stems?.length>2?5:3;
   if(plan.manuscriptMarks.length>=maximum)return false;
   if(!M.inBounds(at,plan.bounds,Math.max(14,size)))return false;
   if(plan.manuscriptMarks.some(p=>M.distance(p,at)<size*3.3))return false;
   plan.manuscriptMarks.push(at);
   return true;
 }
 function motif(sp,at,angle,size,pal,r,season,lev,layout='single'){
   const woody=['oak','hazel','holly','hawthorn'].includes(sp.leaf);
   if(season==='winter'||(woody&&season==='autumn'))return seedhead(at,angle,size,pal,r);
   // The composition selects a restrained family of terminal marks:
   // foliate buds on upright forms, coronals on radiating forms, and more
   // unusual capsules along winding manuscript growth.
   if(lev>.83 && ['acanthus','ivy','honeysuckle'].includes(sp.leaf) &&
       ['meander','diagonal','crescent'].includes(layout) && r.chance(.32))
     return foliateSeedCase(at,angle,size,pal,r);
   const flowerLikelihood=['radiating','cluster'].includes(layout)?.80:
     layout==='single'?.38:.63;
   if(lev>.72 && r.chance(flowerLikelihood))return manuscriptFlower(at,angle,size,pal,r,lev);
   return sepalBud(at,angle,size,pal,r);
 }
 M.ornamentJunction=(sp,at,angle,size,pal,r,s,plan,role='joint')=>{
   const lev=M.ornamentInfluence(sp,s);
   if(lev<.52||!r.chance((lev-.44)*.38))return '';
   const length=clamp(size*r.between(.84,1.19),7,17);
   const direction=angle+r.between(-.17,.17);
   const center=q(at,direction,length*.48);
   if(!permit(plan,center,length))return '';
   return `<g class="growth-manuscript" data-manuscript="junction">`+
     motif(sp,at,direction,length,pal,r,s.season,lev,plan?.layout)+'</g>';
 };
 M.ornamentTerminal=(sp,at,angle,size,pal,r,s,force=false,plan=null)=>{
   const lev=M.ornamentInfluence(sp,s);
   if(lev<.66||!r.chance((lev-.55)*(force?.35:.22)))return '';
   const length=clamp(size*r.between(.72,.96),5,13),center=q(at,angle,length*.55);
   if(!permit(plan,center,length))return '';
   return `<g class="growth-manuscript" data-manuscript="terminal">`+
     motif(sp,at,angle,length,pal,r,s.season,lev,plan?.layout)+'</g>';
 };
 // An especially high transformation subtly engraves bracts at the base of
 // an existing flowering terminal. One botanical connection, not an icon.
 M.manuscriptCalyx=(sp,at,angle,size,pal,r,s,season)=>{
   const lev=M.ornamentInfluence(sp,s);
   if(lev<.38)return '';
   const green=M.mix(sp.tint,pal.ochre,.28);
   let z='';
   for(const side of [-1,1]){
     const a=angle+side*(.67+.19*lev),tip=q(at,a,size*(.25+.15*lev));
     const c=q(at,a+side*.21,size*.16);
     const d=`M${V(at.x,at.y)}Q${V(c.x,c.y)} ${V(tip.x,tip.y)}`+
        `Q${V(q(at,a-side*.29,size*.16).x,q(at,a-side*.29,size*.16).y)} ${V(at.x,at.y)}Z`;
     z+=M.shape(d,green,`stroke="${pal.ink}" stroke-width=".32"`);
   }
   return z;
 };
})(window.MS);
